import {
  BookingRequest,
  HallId,
  SlotType,
  ACOption,
  BookingStatus,
  AvailabilityOverride,
  ManagerSession,
  AuditLogRecord,
} from '../types';
import { VENUE_ADMIN_INFO } from '../config/managerCredentials';
import { INITIAL_AUDIT_LOGS } from './hallData';
import { isSlotAvailable } from './availabilityManager';

const BOOKINGS_KEY = 'hh_events_bookings_v5';
const AVAILABILITY_OVERRIDES_KEY = 'hh_events_availability_overrides_v5';
const AUDIT_LOGS_KEY = 'hh_events_audit_logs_v5';
const TOKEN_KEY = 'hh_auth_token_v5';

function getAuthHeader(): Record<string, string> {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

// In-memory cache for synchronous renders
let cachedBookings: BookingRequest[] = [];

// Initialize cache from localStorage
try {
  const raw = localStorage.getItem(BOOKINGS_KEY);
  if (raw) {
    cachedBookings = JSON.parse(raw);
  }
} catch {}

// Background sync with shared server
export async function syncBookingsFromServer(): Promise<BookingRequest[]> {
  try {
    const res = await fetch('/api/bookings', {
      headers: { ...getAuthHeader() },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        cachedBookings = data.map((b: any) => ({
          ...b,
          // Compatibility mapping
          hall: b.hallSelection || b.hall || 'hall_1',
          acOption: b.acOption || 'ac',
          applicantName: b.customerName,
          applicantPhone: b.phone,
          applicantEmail: b.email,
          eventDate: b.date,
          timeSlot: b.slot,
          totalEstimate: b.totalAmount,
          advancePaymentStatus: b.paymentStatus,
        }));
        try {
          localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
        } catch {}
        return cachedBookings;
      }
    }
  } catch (err) {
    console.warn('Could not sync bookings from server:', err);
  }
  return cachedBookings;
}

// Trigger initial sync silently
syncBookingsFromServer();

// ==========================================
// 1. BOOKINGS STORAGE
// ==========================================

export function getBookings(): BookingRequest[] {
  return cachedBookings;
}

export async function saveBookingAsync(booking: BookingRequest): Promise<BookingRequest> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        customerName: booking.customerName || booking.applicantName,
        phone: booking.phone || booking.applicantPhone,
        email: booking.email || booking.applicantEmail,
        hallSelection: booking.hall || 'hall_1',
        packageId: booking.packageId,
        acOption: booking.acOption || 'ac',
        date: booking.date || booking.eventDate,
        slot: booking.slot || booking.timeSlot,
        expectedAttendees: booking.expectedAttendees || booking.estimatedAttendees,
        additionalInfo: booking.additionalInfo || booking.adminRemarks,
        eventType: booking.eventType || 'wedding',
        status: booking.status || 'PENDING',
        paymentStatus: booking.advancePaymentStatus || 'unpaid',
        amountPaid: (booking as any).amountPaid || 0,
        customDiscountAmount: (booking as any).customDiscountAmount,
        customDiscountReason: (booking as any).customDiscountReason,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.booking) {
        const normalized: BookingRequest = {
          ...booking,
          id: data.booking.id,
          status: data.booking.status,
          totalEstimate: data.booking.totalAmount,
          advancePaymentStatus: data.booking.paymentStatus,
          submittedAt: data.booking.submittedAt,
          updatedAt: data.booking.updatedAt,
        };
        cachedBookings = [normalized, ...cachedBookings.filter((b) => b.id !== normalized.id)];
        try {
          localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
        } catch {}
        return normalized;
      }
    }
  } catch (err) {
    console.error('Failed to save booking to server:', err);
  }

  // Fallback
  cachedBookings = [booking, ...cachedBookings.filter((b) => b.id !== booking.id)];
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
  } catch {}
  return booking;
}

export function saveBooking(booking: BookingRequest): BookingRequest {
  saveBookingAsync(booking);
  cachedBookings = [booking, ...cachedBookings.filter((b) => b.id !== booking.id)];
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
  } catch {}
  return booking;
}

export async function updateBookingAsync(id: string, updates: Partial<BookingRequest>): Promise<boolean> {
  try {
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        status: updates.status,
        remarks: updates.adminRemarks,
        rejectionReason: updates.rejectionReason,
      }),
    });

    if (res.ok) {
      await syncBookingsFromServer();
      return true;
    }
  } catch (err) {
    console.warn('Server status update fallback:', err);
  }

  // Local fallback
  const idx = cachedBookings.findIndex((b) => b.id === id);
  if (idx !== -1) {
    cachedBookings[idx] = { ...cachedBookings[idx], ...updates, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
    } catch {}
    return true;
  }
  return false;
}

export function updateBooking(id: string, updates: Partial<BookingRequest>): boolean {
  updateBookingAsync(id, updates);
  const idx = cachedBookings.findIndex((b) => b.id === id);
  if (idx !== -1) {
    cachedBookings[idx] = { ...cachedBookings[idx], ...updates, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
    } catch {}
    return true;
  }
  return false;
}

export async function deleteBookingAsync(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (res.ok) {
      cachedBookings = cachedBookings.filter((b) => b.id !== id);
      try {
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
      } catch {}
      return true;
    }
  } catch (err) {
    console.warn('Server delete error, fallback to cache:', err);
  }

  cachedBookings = cachedBookings.filter((b) => b.id !== id);
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
  } catch {}
  return true;
}

export function deleteBooking(id: string): boolean {
  deleteBookingAsync(id);
  cachedBookings = cachedBookings.filter((b) => b.id !== id);
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(cachedBookings));
    return true;
  } catch {
    return false;
  }
}

/**
 * Verification for /track-booking: queries shared server with local fallback
 */
export async function getBookingByIdAndPhoneAsync(id: string, rawPhone: string): Promise<BookingRequest | null> {
  const cleanId = (id || '').trim().toUpperCase();
  const cleanPhone = (rawPhone || '').replace(/\D/g, '');

  if (!cleanId || !cleanPhone) return null;

  try {
    const res = await fetch(`/api/bookings/track?id=${encodeURIComponent(cleanId)}&phone=${encodeURIComponent(cleanPhone)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        customerName: data.customerName,
        phone: rawPhone,
        email: '',
        hall: data.hallSelection,
        acOption: data.acOption,
        date: data.date,
        slot: data.slot,
        status: data.status,
        totalEstimate: data.totalAmount,
        advancePaymentStatus: data.paymentStatus,
        submittedAt: data.submittedAt,
        updatedAt: data.submittedAt,
        adminRemarks: data.adminRemarks,
      };
    }
  } catch (err) {
    console.warn('Track booking server fetch error, falling back to cache:', err);
  }

  // Local fallback
  return getBookingByIdAndPhone(cleanId, cleanPhone);
}

export function getBookingByIdAndPhone(id: string, rawPhone: string): BookingRequest | null {
  const cleanId = (id || '').trim().toUpperCase();
  const cleanPhone = (rawPhone || '').replace(/\D/g, '');

  if (!cleanId || !cleanPhone) return null;

  const found = cachedBookings.find((b) => {
    const bId = (b.id || '').toUpperCase();
    const bPhone = (b.phone || b.applicantPhone || '').replace(/\D/g, '');
    return bId === cleanId && (bPhone.endsWith(cleanPhone) || cleanPhone.endsWith(bPhone));
  });

  return found || null;
}

export function generateBookingId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `HH-2026-${randomNum}`;
}

// ==========================================
// 2. AVAILABILITY & CONFLICT LOGIC
// ==========================================

export function getAvailabilityOverrides(): AvailabilityOverride[] {
  try {
    const raw = localStorage.getItem(AVAILABILITY_OVERRIDES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAvailabilityOverride(
  override: Omit<AvailabilityOverride, 'id' | 'updatedAt'>
): AvailabilityOverride {
  const list = getAvailabilityOverrides();
  const newOverride: AvailabilityOverride = {
    ...override,
    id: `OVR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    updatedAt: new Date().toISOString(),
  };

  const filtered = list.filter(
    (item) => !(item.date === override.date && item.hall === override.hall && item.slot === override.slot)
  );
  filtered.push(newOverride);

  try {
    localStorage.setItem(AVAILABILITY_OVERRIDES_KEY, JSON.stringify(filtered));
  } catch {}

  // Sync to server blackout if authenticated
  try {
    fetch('/api/availability/blackout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        date: override.date,
        slot: override.slot,
        resources: [override.hall === 'both' ? 'all' : override.hall === 'hall_2' ? 'ladies_hall' : 'gents_hall'],
        reason: override.reason,
      }),
    });
  } catch {}

  return newOverride;
}

export function removeAvailabilityOverride(id: string): void {
  const list = getAvailabilityOverrides();
  const filtered = list.filter((i) => i.id !== id);
  try {
    localStorage.setItem(AVAILABILITY_OVERRIDES_KEY, JSON.stringify(filtered));
  } catch {}
}

export function checkSlotAvailability(
  hall: HallId,
  date: string,
  slot: SlotType,
  ignoreBookingId?: string
): { available: boolean; conflictReason?: string; booking?: BookingRequest; reason?: string } {
  // 1. Manager Blackout Override Check
  // Check if management explicitly created a blackout for this date/slot
  const overrides = getAvailabilityOverrides();
  const isManuallyBlackedOut = overrides.some((o) => {
    if (o.date !== date) return false;
    if ((o.slot as any) !== 'full_day' && o.slot !== slot) return false;
    if (o.hall === 'both' || hall === 'both' || o.hall === hall) return true;
    return false;
  });

  if (isManuallyBlackedOut) {
    const hallName = hall === 'hall_1' ? 'Hall 1' : hall === 'hall_2' ? 'Hall 2' : 'Combined Hall';
    const slotName = slot === 'day' ? 'Day Session (10:00 AM – 3:00 PM)' : 'Evening Session (6:00 PM – 10:00 PM)';
    const msg = `${hallName} is marked Unavailable by management blackout for ${slotName} on ${date}.`;
    return {
      available: false,
      conflictReason: msg,
      reason: msg,
    };
  }

  // If this is a new public inquiry without an ignoreBookingId, also respect public slot availability
  if (!ignoreBookingId) {
    const managerOpen = isSlotAvailable(hall, date, slot);
    if (!managerOpen) {
      const hallName = hall === 'hall_1' ? 'Hall 1' : hall === 'hall_2' ? 'Hall 2' : 'Combined Hall';
      const slotName = slot === 'day' ? 'Day Session (10:00 AM – 3:00 PM)' : 'Evening Session (6:00 PM – 10:00 PM)';
      const msg = `${hallName} is marked Unavailable for ${slotName} on ${date}.`;
      return {
        available: false,
        conflictReason: msg,
        reason: msg,
      };
    }
  }

  // 2. Check for existing approved & confirmed customer reservations
  // NOTE: When an admin reviews or approves a booking, unapproved PENDING requests do NOT block approval!
  // Only APPROVED and CONFIRMED bookings represent real booked reservations.
  const bookings = getBookings();
  const activeBookings = bookings.filter((b) => {
    if (ignoreBookingId && b.id === ignoreBookingId) return false;
    const statusUpper = (b.status || '').toUpperCase();
    return statusUpper === 'APPROVED' || statusUpper === 'CONFIRMED';
  });

  for (const b of activeBookings) {
    if (b.date !== date) continue;
    if (b.slot !== slot) continue;

    if (hall === 'both') {
      const msg = `Full Campus conflict: ${
        b.hall === 'hall_1' ? 'Hall 1' : b.hall === 'hall_2' ? 'Hall 2' : 'Full Campus'
      } is already confirmed/approved (${b.id}) for this session on ${date}.`;
      return {
        available: false,
        conflictReason: msg,
        reason: msg,
        booking: b,
      };
    }

    if (b.hall === hall || b.hall === 'both') {
      const msg = `${
        hall === 'hall_1' ? 'Hall 1' : 'Hall 2'
      } is already confirmed/approved (${b.id}) for this session on ${date}.`;
      return {
        available: false,
        conflictReason: msg,
        reason: msg,
        booking: b,
      };
    }
  }

  return { available: true };
}

export function approveBooking(id: string): { success: boolean; error?: string } {
  const current = getBookings();
  const booking = current.find((b) => b.id === id);
  if (!booking) return { success: false, error: 'Booking not found' };

  const avail = checkSlotAvailability(booking.hall, booking.date, booking.slot, booking.id);
  if (!avail.available) {
    return {
      success: false,
      error: avail.conflictReason || 'Conflict detected: this hall slot is already approved for another party.',
    };
  }

  updateBooking(id, {
    status: 'APPROVED',
    rejectionReason: undefined,
  });

  logAuditAction('APPROVE_BOOKING', id, `Booking ${id} approved for ${booking.hall} on ${booking.date} (${booking.slot})`);
  return { success: true };
}

export function rejectBooking(id: string, reason?: string): { success: boolean; error?: string } {
  updateBooking(id, {
    status: 'REJECTED',
    rejectionReason: reason?.trim() || 'Declined by venue management.',
  });

  logAuditAction('REJECT_BOOKING', id, `Booking ${id} rejected. Reason: ${reason || 'N/A'}`);
  return { success: true };
}

// ==========================================
// 3. AUDIT LOGS
// ==========================================

export function getAuditLogs(): AuditLogRecord[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function logAuditAction(action: string, targetId: string, details: string): void {
  const logs = getAuditLogs();
  const newLog: AuditLogRecord = {
    id: `LOG-${Date.now()}`,
    action,
    performedBy: VENUE_ADMIN_INFO.email,
    targetEntity: 'booking',
    targetId,
    details,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch {}
}
