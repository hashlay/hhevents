export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CONFIRMED'
  | 'COMPLETED'
  // Support lowercase for backward-compatible views
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'confirmed'
  | 'completed';

export type HallId = 'hall_1' | 'hall_2' | 'both';
export type SlotType = 'day' | 'evening';
export type ACOption = 'ac' | 'non_ac';
export type TimeSlot = 'day' | 'evening' | 'morning' | 'full_day';
export type EventType = 'wedding' | 'reception' | 'nikah' | 'cultural' | 'corporate' | 'family' | 'other';

export interface BookingRequest {
  id: string; // e.g. HH-2026-101
  customerName: string;
  phone: string;
  email: string;
  hall: HallId;
  acOption: ACOption;
  date: string; // YYYY-MM-DD
  slot: SlotType; // 'day' (10:00 AM – 3:00 PM) or 'evening' (6:00 PM – 10:00 PM)
  expectedAttendees?: number;
  estimatedAttendees?: number;
  additionalInfo?: string;
  status: BookingStatus;
  rejectionReason?: string;
  estimatedAmount?: number;
  packageId?: string;
  packageName?: string;
  totalEstimate?: number;
  submittedAt: string;
  updatedAt: string;

  // Compatibility fields for existing forms/views
  applicantName?: string;
  applicantPhone?: string;
  applicantEmail?: string;
  organizationName?: string;
  eventTitle?: string;
  eventType?: EventType | string;
  eventDate?: string;
  timeSlot?: TimeSlot | string;
  facilityIds?: string[];
  addionalServices?: string[];
  specialRequirements?: string[];
  advancePaymentStatus?: 'unpaid' | 'paid' | 'waived' | 'advance_paid' | 'fully_paid';
  adminRemarks?: string;
}

export interface HallDetails {
  id: HallId;
  name: string;
  displayName: string;
  subtitle: string;
  description: string;
  pricing: {
    ac: number;
    nonAc: number;
    acWithDoubleDining?: number;
    nonAcWithDoubleDining?: number;
  };
  features: string[];
  equipmentIncluded?: string[];
  imageKey: string;
}

export interface TimingSlotConfig {
  id: SlotType;
  label: string;
  timeRange: string;
  description: string;
}

export interface VenueSettings {
  name: string;
  tagline: string;
  address: string;
  primaryPhone: string;
  secondaryPhone: string;
  googleMapsUrl: string;
  daySlotHours: string;
  eveningSlotHours: string;
  paymentNotice: string;
}

export interface HallSettings extends VenueSettings {
  productName?: string;
  hallLegalTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  emergencyPhone?: string;
  locationReference?: string;
  physicalAddress?: string;
  morningSlotHours?: string;
  securityDepositAmount?: number;
  taxRatePercentage?: number;
  minAdvanceBookingDays?: number;
  maxAdvanceBookingMonths?: number;
  autoCancelUnpaidDays?: number;
}

export interface FacilityWing {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  dimensions?: string;
  baseRatePerSlot: number;
  imageUrl: string;
  features: string[];
  capacity?: number;
  squareFeet?: number;
}

export interface MaintenanceRecord {
  id: string;
  facilityId?: string;
  facilityIds?: string[];
  facilityName?: string;
  title: string;
  description?: string;
  category?: 'hvac' | 'electrical' | 'sanitary' | 'acoustic' | 'general' | string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: string;
  startDate?: string;
  endDate?: string;
  slot?: 'morning' | 'evening' | 'full_day' | 'day' | string;
  assignedTo?: string;
  assignedContractor?: string;
  technicianName?: string;
  technicianPhone?: string;
  notes?: string;
  estimatedCost?: number;
  completedAt?: string;
  createdAt?: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'hall_manager' | 'reception_officer' | 'finance_officer' | 'facility_supervisor';
  avatar?: string;
  lastLogin?: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  performedBy: string;
  targetEntity: 'booking' | 'settings' | 'hall' | 'facility' | 'maintenance';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface AvailabilityOverride {
  id: string;
  date: string; // YYYY-MM-DD
  hall: HallId;
  slot: SlotType;
  acOption?: ACOption;
  isAvailable: boolean;
  reason: string;
  updatedAt: string;
  createdAt?: string;
}

export interface ManagerSession {
  email: string;
  name: string;
  displayName?: string;
  role?: string;
  loginTime: string;
  token: string;
  phone?: string;
}
