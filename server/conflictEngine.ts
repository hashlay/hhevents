import { getDb, DatabaseSchema, BookingRecord, PHYSICAL_RESOURCES } from './db';

export interface ConflictCheckResult {
  available: boolean;
  conflictReason?: string;
  conflictingBookingId?: string;
  conflictingResources?: string[];
}

/**
 * Resolves the physical resources needed for a booking request.
 */
export function resolveRequiredResources(
  packageId?: string,
  hallSelection?: 'hall_1' | 'hall_2' | 'both',
  packagesList?: Array<{ id: string; requiredResources: string[] }>
): string[] {
  // If a package is specified and matched in registry
  if (packageId && packagesList) {
    const pkg = packagesList.find((p) => p.id === packageId);
    if (pkg && pkg.requiredResources && pkg.requiredResources.length > 0) {
      // If hall_2 is specifically requested for a single-hall package:
      if (hallSelection === 'hall_2') {
        return pkg.requiredResources.map((r) => {
          if (r === 'gents_hall') return 'ladies_hall';
          if (r === 'dining_1') return 'dining_2';
          return r;
        });
      }
      return [...pkg.requiredResources];
    }
  }

  // Fallback to hall selection mapping:
  if (hallSelection === 'both') {
    return ['gents_hall', 'ladies_hall', 'dining_1', 'dining_2', 'kitchen'];
  } else if (hallSelection === 'hall_2') {
    return ['ladies_hall', 'dining_2', 'kitchen'];
  }
  // Default hall_1
  return ['gents_hall', 'dining_1', 'kitchen'];
}

/**
 * Concurrency-safe check against current database snapshot.
 * Detects any overlap on:
 * - Date
 * - Session Slot (Day or Evening)
 * - Any single Physical Resource (e.g. Gents Hall, Ladies Hall, Dining 1, Dining 2, Kitchen)
 */
export function checkResourceConflict(
  db: DatabaseSchema,
  date: string,
  slot: 'day' | 'evening',
  requiredResources: string[],
  ignoreBookingId?: string
): ConflictCheckResult {
  // 1. Check Manager Blackout blocks
  for (const block of db.availabilityBlackouts) {
    if (block.date === date) {
      if (block.slot === 'full_day' || block.slot === slot) {
        if (block.resources.includes('all')) {
          return {
            available: false,
            conflictReason: `Date is marked unavailable by venue management: ${block.reason || 'Management Block'}`,
          };
        }
        const hasOverlap = requiredResources.some((r) => block.resources.includes(r));
        if (hasOverlap) {
          return {
            available: false,
            conflictReason: `Required hall space is reserved/blacked out on ${date} (${slot}): ${block.reason || 'Manager Blackout'}`,
          };
        }
      }
    }
  }

  // 2. Check Maintenance Blocks
  for (const m of db.maintenance) {
    if (m.status !== 'cancelled' && m.status !== 'completed') {
      if (date >= m.startDate && date <= m.endDate) {
        if (m.slot === 'full_day' || m.slot === slot) {
          const hasOverlap = requiredResources.some((r) => m.resources.includes(r) || m.resources.includes('all'));
          if (hasOverlap) {
            return {
              available: false,
              conflictReason: `Facility is undergoing scheduled maintenance: ${m.title}`,
            };
          }
        }
      }
    }
  }

  // 3. Check Confirmed & Active Reservations
  const activeBookings = db.bookings.filter((b) => {
    if (ignoreBookingId && b.id === ignoreBookingId) return false;
    return b.status === 'APPROVED' || b.status === 'CONFIRMED' || b.status === 'PENDING';
  });

  for (const b of activeBookings) {
    if (b.date === date && b.slot === slot) {
      // Find intersection of occupied physical resources
      const overlapping = requiredResources.filter((r) =>
        b.occupiedResources.includes(r)
      );

      if (overlapping.length > 0) {
        const resourceNames = overlapping
          .map((rId) => PHYSICAL_RESOURCES.find((pr) => pr.id === rId)?.name || rId)
          .join(', ');

        const isPending = b.status === 'PENDING';
        const msg = isPending
          ? `A reservation request (${b.id}) is already pending review for ${resourceNames} on this session.`
          : `Space conflict: ${resourceNames} is already booked on ${date} (${slot === 'day' ? 'Day Session' : 'Evening Session'}).`;

        return {
          available: false,
          conflictReason: msg,
          conflictingBookingId: b.id,
          conflictingResources: overlapping,
        };
      }
    }
  }

  return { available: true };
}
