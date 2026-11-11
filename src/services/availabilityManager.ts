export type HallTarget = 'hall_1' | 'hall_2' | 'both';
export type SlotTarget = 'day' | 'evening';

export interface DaySlotsState {
  day: boolean; // true = Available, false = Unavailable
  evening: boolean; // true = Available, false = Unavailable
}

export interface DateAvailabilityEntry {
  date: string; // YYYY-MM-DD
  hall_1: DaySlotsState;
  hall_2: DaySlotsState;
  notes?: string;
  updatedAt: string;
}

export interface BlackoutEntry {
  id: string;
  date: string; // YYYY-MM-DD
  slot: 'day' | 'evening' | 'full_day';
  resources: string[]; // e.g. ['all'] or ['gents_hall']
  reason: string;
  blockedBy?: string;
  createdAt?: string;
  blockType?: 'customer_hold' | 'maintenance' | 'manager_hold';
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

const STORAGE_KEY = 'hh_manager_controlled_availability_v5';
const BLACKOUTS_STORAGE_KEY = 'hh_blackouts_cache_v5';
const TOKEN_KEY = 'hh_auth_token_v5';

// In-memory cache
let availabilityCache: Record<string, DateAvailabilityEntry> = {};
let blackoutsCache: BlackoutEntry[] = [];
let listeners: Array<() => void> = [];

function getAuthHeader(): Record<string, string> {
  try {
    const token =
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem('hh_admin_token') ||
      sessionStorage.getItem('hh_admin_token');
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {}
  return {};
}

// Initialize from localStorage
function initCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      availabilityCache = JSON.parse(raw);
    } else {
      availabilityCache = {};
    }
  } catch {
    availabilityCache = {};
  }

  try {
    const blkRaw = localStorage.getItem(BLACKOUTS_STORAGE_KEY);
    if (blkRaw) {
      blackoutsCache = JSON.parse(blkRaw);
    } else {
      blackoutsCache = [];
    }
  } catch {
    blackoutsCache = [];
  }
}

initCache();

export async function syncAvailabilityFromServer(): Promise<void> {
  try {
    const res = await fetch('/api/availability');
    if (res.ok) {
      const data = await res.json();
      const updated: Record<string, DateAvailabilityEntry> = {};

      // Process blackouts
      if (Array.isArray(data.blackouts)) {
        blackoutsCache = data.blackouts;
        try {
          localStorage.setItem(BLACKOUTS_STORAGE_KEY, JSON.stringify(blackoutsCache));
        } catch {}

        for (const b of data.blackouts) {
          if (!updated[b.date]) {
            updated[b.date] = {
              date: b.date,
              hall_1: { day: true, evening: true },
              hall_2: { day: true, evening: true },
              notes: b.reason || b.notes || 'Manager Hold',
              updatedAt: b.createdAt || new Date().toISOString(),
            };
          }
          const isHall1 = b.resources.includes('all') || b.resources.includes('gents_hall');
          const isHall2 = b.resources.includes('all') || b.resources.includes('ladies_hall');

          if (b.slot === 'full_day' || b.slot === 'day') {
            if (isHall1) updated[b.date].hall_1.day = false;
            if (isHall2) updated[b.date].hall_2.day = false;
          }
          if (b.slot === 'full_day' || b.slot === 'evening') {
            if (isHall1) updated[b.date].hall_1.evening = false;
            if (isHall2) updated[b.date].hall_2.evening = false;
          }
        }
      } else {
        blackoutsCache = [];
      }

      // Process active bookings
      if (Array.isArray(data.bookings)) {
        for (const b of data.bookings) {
          if (!updated[b.date]) {
            updated[b.date] = {
              date: b.date,
              hall_1: { day: true, evening: true },
              hall_2: { day: true, evening: true },
              notes: 'Reserved',
              updatedAt: new Date().toISOString(),
            };
          }
          const isHall1 =
            b.occupiedResources?.includes('all') ||
            b.occupiedResources?.includes('gents_hall') ||
            b.hallSelection === 'both' ||
            b.hallSelection === 'hall_1' ||
            b.hall === 'both' ||
            b.hall === 'hall_1';

          const isHall2 =
            b.occupiedResources?.includes('all') ||
            b.occupiedResources?.includes('ladies_hall') ||
            b.hallSelection === 'both' ||
            b.hallSelection === 'hall_2' ||
            b.hall === 'both' ||
            b.hall === 'hall_2';

          if (b.slot === 'day') {
            if (isHall1) updated[b.date].hall_1.day = false;
            if (isHall2) updated[b.date].hall_2.day = false;
          } else if (b.slot === 'evening') {
            if (isHall1) updated[b.date].hall_1.evening = false;
            if (isHall2) updated[b.date].hall_2.evening = false;
          }
        }
      }

      availabilityCache = updated;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(availabilityCache));
      } catch {}
      notifyListeners();
    }
  } catch (err) {
    console.warn('Failed to sync availability from server:', err);
  }
}

// Initial sync on mount
syncAvailabilityFromServer();

function persist(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(availabilityCache));
    localStorage.setItem(BLACKOUTS_STORAGE_KEY, JSON.stringify(blackoutsCache));
  } catch {}
  notifyListeners();
}

function notifyListeners(): void {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeAvailability(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

export function getBlackouts(): BlackoutEntry[] {
  return [...blackoutsCache];
}

export function getSlotBlackout(
  hall: HallTarget,
  date: string,
  slot: SlotTarget
): BlackoutEntry | undefined {
  return blackoutsCache.find((b) => {
    if (b.date !== date) return false;
    const slotMatch = b.slot === 'full_day' || b.slot === slot;
    if (!slotMatch) return false;

    if (hall === 'both') return true;
    const isHall1 = b.resources.includes('all') || b.resources.includes('gents_hall');
    const isHall2 = b.resources.includes('all') || b.resources.includes('ladies_hall');
    if (hall === 'hall_1') return isHall1;
    if (hall === 'hall_2') return isHall2;
    return true;
  });
}

export function isSlotBlockedByManager(
  hall: HallTarget,
  date: string,
  slot: SlotTarget
): boolean {
  return getSlotBlackout(hall, date, slot) !== undefined;
}

export function getManagerAvailability(date: string): DateAvailabilityEntry {
  if (availabilityCache[date]) {
    return availabilityCache[date];
  }
  return {
    date,
    hall_1: { day: true, evening: true },
    hall_2: { day: true, evening: true },
    notes: '',
    updatedAt: '',
  };
}

export function getAllManagerAvailability(): Record<string, DateAvailabilityEntry> {
  return { ...availabilityCache };
}

export function isSlotAvailable(hall: HallTarget, date: string, slot: SlotTarget): boolean {
  const entry = getManagerAvailability(date);

  if (hall === 'hall_1') {
    return entry.hall_1[slot] !== false;
  }
  if (hall === 'hall_2') {
    return entry.hall_2[slot] !== false;
  }
  return entry.hall_1[slot] !== false && entry.hall_2[slot] !== false;
}

export function getDayAvailabilitySummary(
  hall: HallTarget,
  date: string
): 'available' | 'partial' | 'unavailable' {
  const dayAvail = isSlotAvailable(hall, date, 'day');
  const eveAvail = isSlotAvailable(hall, date, 'evening');

  if (dayAvail && eveAvail) return 'available';
  if (!dayAvail && !eveAvail) return 'unavailable';
  return 'partial';
}

export async function blockSlotWithDetails(params: {
  hall: HallTarget;
  date: string;
  slot: SlotTarget | 'full_day';
  blockType: 'customer_hold' | 'maintenance' | 'manager_hold';
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  reason?: string;
}): Promise<void> {
  const { hall, date, slot, blockType, customerName, customerPhone, notes, reason } = params;

  const res = await fetch('/api/availability/blackout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      date,
      slot,
      resources: [hall === 'both' ? 'all' : hall === 'hall_2' ? 'ladies_hall' : 'gents_hall'],
      reason: reason || notes || (blockType === 'customer_hold' ? `Customer Hold: ${customerName}` : 'Manager slot blackout'),
      blockType,
      customerName,
      customerPhone,
      notes: notes || reason,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to block slot on server');
  }

  await syncAvailabilityFromServer();
}

export async function releaseSlotAvailability(
  hall: HallTarget,
  date: string,
  slot: SlotTarget | 'full_day',
  deleteBookings: boolean = true
): Promise<{ removedBlackouts: number; deletedBookingsCount: number }> {
  const res = await fetch('/api/availability/release', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      date,
      slot,
      hall,
      deleteBookings,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to release slot on server');
  }

  const data = await res.json();

  // If bookings were deleted on server, clean local cache
  if (deleteBookings) {
    try {
      const localBookings = localStorage.getItem('hh_bookings_v5');
      if (localBookings) {
        const list = JSON.parse(localBookings);
        const filtered = list.filter((b: any) => {
          if (b.date !== date) return true;
          const slotMatch = slot === 'full_day' || (b.slot || '').toLowerCase() === slot.toLowerCase();
          if (!slotMatch) return true;
          if (hall === 'both') return false;
          const bHall = b.hallSelection || b.hall || 'both';
          if (bHall === 'both' || bHall === hall) return false;
          return true;
        });
        localStorage.setItem('hh_bookings_v5', JSON.stringify(filtered));
      }
    } catch {}
  }

  await syncAvailabilityFromServer();
  return data;
}

export async function releaseFullDayAvailability(
  hall: HallTarget,
  date: string,
  deleteBookings: boolean = true
): Promise<any> {
  return releaseSlotAvailability(hall, date, 'full_day', deleteBookings);
}

export function setSlotAvailability(
  hall: HallTarget,
  date: string,
  slot: SlotTarget,
  available: boolean,
  notes?: string
): DateAvailabilityEntry {
  const current = getManagerAvailability(date);

  const updated: DateAvailabilityEntry = {
    date,
    hall_1: { ...current.hall_1 },
    hall_2: { ...current.hall_2 },
    notes: notes !== undefined ? notes : current.notes,
    updatedAt: new Date().toISOString(),
  };

  if (hall === 'hall_1') {
    updated.hall_1[slot] = available;
  } else if (hall === 'hall_2') {
    updated.hall_2[slot] = available;
  } else {
    updated.hall_1[slot] = available;
    updated.hall_2[slot] = available;
  }

  availabilityCache[date] = updated;
  persist();

  if (!available) {
    blockSlotWithDetails({
      hall,
      date,
      slot,
      blockType: 'manager_hold',
      reason: notes || 'Manager-controlled blackout',
    }).catch(() => {});
  } else {
    releaseSlotAvailability(hall, date, slot, true).catch(() => {});
  }

  return updated;
}

export function setDayAvailability(
  hall: HallTarget,
  date: string,
  available: boolean,
  notes?: string
): DateAvailabilityEntry {
  const current = getManagerAvailability(date);

  const updated: DateAvailabilityEntry = {
    date,
    hall_1: { ...current.hall_1 },
    hall_2: { ...current.hall_2 },
    notes: notes !== undefined ? notes : current.notes,
    updatedAt: new Date().toISOString(),
  };

  if (hall === 'hall_1') {
    updated.hall_1.day = available;
    updated.hall_1.evening = available;
  } else if (hall === 'hall_2') {
    updated.hall_2.day = available;
    updated.hall_2.evening = available;
  } else {
    updated.hall_1.day = available;
    updated.hall_1.evening = available;
    updated.hall_2.day = available;
    updated.hall_2.evening = available;
  }

  availabilityCache[date] = updated;
  persist();

  if (!available) {
    blockSlotWithDetails({
      hall,
      date,
      slot: 'full_day',
      blockType: 'manager_hold',
      reason: notes || 'Manager whole day blackout',
    }).catch(() => {});
  } else {
    releaseFullDayAvailability(hall, date, true).catch(() => {});
  }

  return updated;
}

export function resetDateToDefault(date: string): void {
  releaseFullDayAvailability('both', date, false).catch(() => {});
  delete availabilityCache[date];
  persist();
}

export function clearAllManagerAvailability(): void {
  availabilityCache = {};
  blackoutsCache = [];
  persist();
}
