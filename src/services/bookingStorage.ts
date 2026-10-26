import {
  BookingRequest,
  HallId,
  SlotType,
  ACOption,
  BookingStatus,
  AuditLogRecord,
  MaintenanceRecord,
} from '../types';
import {
  getBookings,
  saveBooking,
  saveBookingAsync,
  updateBooking,
  updateBookingAsync,
  deleteBooking,
  deleteBookingAsync,
  checkSlotAvailability,
  getBookingByIdAndPhone,
  getBookingByIdAndPhoneAsync,
  generateBookingId,
  getAuditLogs,
  logAuditAction,
  syncBookingsFromServer,
} from './storageService';
import { INITIAL_MAINTENANCE_SCHEDULE } from './hallData';

export {
  getBookings,
  saveBooking,
  updateBooking,
  deleteBooking,
  deleteBookingAsync,
  checkSlotAvailability,
  getBookingByIdAndPhone,
  getBookingByIdAndPhoneAsync,
  generateBookingId,
};

export function trackBooking(query: string): BookingRequest | null {
  const clean = (query || '').trim().toLowerCase();
  if (!clean) return null;
  const cleanPhone = clean.replace(/\D/g, '');
  const all = getBookings();
  return (
    all.find((b) => {
      const idMatch = (b.id || '').toLowerCase() === clean;
      const phoneDigits = (b.phone || b.applicantPhone || '').replace(/\D/g, '');
      const phoneMatch = cleanPhone.length >= 6 && (phoneDigits.includes(cleanPhone) || cleanPhone.includes(phoneDigits));
      const emailMatch = (b.email || b.applicantEmail || '').toLowerCase() === clean;
      return idMatch || phoneMatch || emailMatch;
    }) || null
  );
}

export function getStoredBookings(): BookingRequest[] {
  return getBookings();
}

export function saveStoredBookings(bookings: BookingRequest[]): void {
  try {
    localStorage.setItem('hh_events_bookings_v5', JSON.stringify(bookings));
  } catch {}
}

export function getStoredAuditLogs(): AuditLogRecord[] {
  return getAuditLogs();
}

export function saveAuditLog(record: Omit<AuditLogRecord, 'id' | 'timestamp'>): void {
  logAuditAction(record.action, record.targetId, record.details);
}

export function getStoredMaintenance(): MaintenanceRecord[] {
  try {
    const raw = localStorage.getItem('hh_events_maintenance_v5');
    if (!raw) {
      localStorage.setItem('hh_events_maintenance_v5', JSON.stringify(INITIAL_MAINTENANCE_SCHEDULE));
      return INITIAL_MAINTENANCE_SCHEDULE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MAINTENANCE_SCHEDULE;
  }
}

export function saveStoredMaintenance(records: MaintenanceRecord[]): void {
  try {
    localStorage.setItem('hh_events_maintenance_v5', JSON.stringify(records));
  } catch {}
}

export interface BookingCreationInput {
  customerName: string;
  phone: string;
  email: string;
  hall: HallId;
  acOption: ACOption;
  date: string;
  slot: SlotType;
  expectedAttendees?: number;
  additionalInfo?: string;
  estimatedAmount?: number;
  packageId?: string;
  packageName?: string;
}

export function createBooking(input: BookingCreationInput): {
  success: boolean;
  booking?: BookingRequest;
  error?: string;
} {
  const avail = checkSlotAvailability(input.hall, input.date, input.slot);
  if (!avail.available) {
    return {
      success: false,
      error: avail.conflictReason || 'The selected hall and slot is already reserved for this date.',
    };
  }

  const newId = generateBookingId();
  const now = new Date().toISOString();

  const newBooking: BookingRequest = {
    id: newId,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    hall: input.hall,
    acOption: input.acOption,
    date: input.date,
    slot: input.slot,
    expectedAttendees: input.expectedAttendees,
    additionalInfo: input.additionalInfo?.trim(),
    status: 'PENDING',
    estimatedAmount: input.estimatedAmount,
    submittedAt: now,
    updatedAt: now,
    // Compatibility fields
    applicantName: input.customerName.trim(),
    applicantPhone: input.phone.trim(),
    applicantEmail: input.email.trim(),
    eventDate: input.date,
    timeSlot: input.slot,
    advancePaymentStatus: 'unpaid',
    adminRemarks: 'Pending administrative review and manager confirmation.',
  };

  saveBooking(newBooking);
  logAuditAction('Booking Submitted', newId, `Customer ${input.customerName} submitted reservation for ${input.hall} on ${input.date}`);

  return { success: true, booking: newBooking };
}

export async function createBookingAsync(input: BookingCreationInput): Promise<{
  success: boolean;
  booking?: BookingRequest;
  error?: string;
}> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        packageId: input.packageId,
        hallSelection: input.hall,
        acOption: input.acOption,
        date: input.date,
        slot: input.slot,
        expectedAttendees: input.expectedAttendees,
        additionalInfo: input.additionalInfo,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to submit reservation' };
    }

    const b = data.booking;
    const normalized: BookingRequest = {
      id: b.id,
      customerName: b.customerName,
      phone: b.phone,
      email: b.email,
      hall: b.hallSelection || input.hall,
      acOption: b.acOption || input.acOption,
      date: b.date,
      slot: b.slot,
      expectedAttendees: b.expectedAttendees,
      additionalInfo: b.additionalInfo,
      status: b.status,
      estimatedAmount: b.totalAmount,
      totalEstimate: b.totalAmount,
      advancePaymentStatus: b.paymentStatus,
      submittedAt: b.submittedAt,
      updatedAt: b.updatedAt,
      applicantName: b.customerName,
      applicantPhone: b.phone,
      applicantEmail: b.email,
      eventDate: b.date,
      timeSlot: b.slot,
      adminRemarks: b.adminRemarks,
    };

    saveBooking(normalized);
    return { success: true, booking: normalized };
  } catch (err: any) {
    // Fallback to local synchronous creation
    return createBooking(input);
  }
}

export function approveBooking(
  id: string,
  userEmail: string = 'manager@hhevents.in'
): { success: boolean; error?: string } {
  const current = getBookings();
  const booking = current.find((b) => b.id === id);
  if (!booking) return { success: false, error: 'Booking reference not found' };

  updateBooking(id, {
    status: 'APPROVED',
    adminRemarks: 'Booking approved by management. Ready for token advance payment and agreement execution.',
  });

  logAuditAction('Booking Approved', id, `Booking approved by ${userEmail}`);
  return { success: true };
}

export function rejectBooking(
  id: string,
  reason: string,
  userEmail: string = 'manager@hhevents.in'
): { success: boolean; error?: string } {
  const current = getBookings();
  const booking = current.find((b) => b.id === id);
  if (!booking) return { success: false, error: 'Booking reference not found' };

  updateBooking(id, {
    status: 'REJECTED',
    rejectionReason: reason || 'Hall unavailable on requested date/slot.',
    adminRemarks: reason || 'Application declined by management.',
  });

  logAuditAction('Booking Rejected', id, `Booking rejected: ${reason}`);
  return { success: true };
}

export function cancelBooking(
  id: string,
  reason?: string,
  userEmail: string = 'manager@hhevents.in'
): { success: boolean; error?: string } {
  const current = getBookings();
  const booking = current.find((b) => b.id === id);
  if (!booking) return { success: false, error: 'Booking reference not found' };

  updateBooking(id, {
    status: 'CANCELLED',
    adminRemarks: reason || 'Booking cancelled at request of customer/manager.',
  });

  logAuditAction('Booking Cancelled', id, `Booking cancelled: ${reason || 'N/A'}`);
  return { success: true };
}

// Async bridge functions for component compatibility
export async function fetchBookingsAsync(): Promise<BookingRequest[]> {
  const synced = await syncBookingsFromServer();
  return synced;
}

export async function fetchMaintenanceAsync(): Promise<MaintenanceRecord[]> {
  try {
    const res = await fetch('/api/maintenance');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return getStoredMaintenance();
}

export async function updateBookingStatusAsync(
  id: string,
  newStatus: BookingStatus | string,
  remarks?: string,
  userEmail: string = 'manager@hhevents.in'
): Promise<void> {
  const upper = (newStatus || '').toUpperCase();
  const ok = await updateBookingAsync(id, {
    status: upper as any,
    adminRemarks: remarks,
  });
  if (!ok) {
    throw new Error('Failed to update booking status on server');
  }
}

export async function updatePaymentStatusAsync(
  id: string,
  paymentStatus: 'unpaid' | 'paid' | 'waived' | 'advance_paid' | 'fully_paid' | string,
  amount?: number
): Promise<void> {
  try {
    const token = localStorage.getItem('hh_auth_token_v5') || sessionStorage.getItem('hh_auth_token_v5');
    if (token && amount) {
      await fetch(`/api/bookings/${id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          paymentType: paymentStatus === 'fully_paid' ? 'full' : 'advance',
          paymentMethod: 'upi',
        }),
      });
      await syncBookingsFromServer();
      return;
    }
  } catch {}
  updateBooking(id, { advancePaymentStatus: paymentStatus as any });
}

export async function createBookingRequestAsync(payload: any): Promise<BookingRequest> {
  const result = await createBookingAsync({
    customerName: payload.customerName || payload.applicantName || 'Valued Guest',
    phone: payload.phone || payload.applicantPhone || '',
    email: payload.email || payload.applicantEmail || '',
    hall: payload.hall || 'hall_1',
    acOption: payload.acOption || 'ac',
    date: payload.date || payload.eventDate || new Date().toISOString().split('T')[0],
    slot: payload.slot || (payload.timeSlot === 'evening' ? 'evening' : 'day'),
    expectedAttendees: payload.expectedAttendees || payload.estimatedAttendees,
    additionalInfo: payload.additionalInfo || payload.specialRequirements,
    estimatedAmount: payload.totalEstimate || payload.estimatedAmount || 30000,
    packageId: payload.packageId,
    packageName: payload.packageName,
  });

  if (!result.success || !result.booking) {
    throw new Error(result.error || 'Conflict detected or unable to process reservation');
  }
  return result.booking;
}

export const createBookingRequest = createBooking;

export async function fetchAuditLogsAsync(): Promise<AuditLogRecord[]> {
  try {
    const token = localStorage.getItem('hh_auth_token_v5') || sessionStorage.getItem('hh_auth_token_v5');
    if (token) {
      const res = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    }
  } catch {}
  return getAuditLogs();
}

export async function createMaintenanceRecordAsync(payload: Omit<MaintenanceRecord, 'id'>): Promise<MaintenanceRecord> {
  try {
    const token = localStorage.getItem('hh_auth_token_v5') || sessionStorage.getItem('hh_auth_token_v5');
    if (token) {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.maintenance) return data.maintenance;
      }
    }
  } catch {}

  const current = getStoredMaintenance();
  const newRec: MaintenanceRecord = {
    ...payload,
    id: `MNT-${Date.now()}`,
  };
  current.unshift(newRec);
  saveStoredMaintenance(current);
  return newRec;
}

export async function updateMaintenanceStatusAsync(
  id: string,
  status: MaintenanceRecord['status']
): Promise<void> {
  const current = getStoredMaintenance();
  const idx = current.findIndex((m) => m.id === id);
  if (idx !== -1) {
    current[idx].status = status;
    saveStoredMaintenance(current);
  }
}
