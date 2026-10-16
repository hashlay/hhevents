import {
  HallDetails,
  TimingSlotConfig,
  VenueSettings,
  HallSettings,
  FacilityWing,
  MaintenanceRecord,
  BookingRequest,
  AuditLogRecord,
} from '../types';

export const VENUE_INFO: VenueSettings = {
  name: 'H H Events & Conventions',
  tagline: 'Premier Convention, Wedding & Grand Event Destination',
  address: 'Opposite Juma Masjid, Panemangalore, Akkarangadi, Bantwal, Karnataka 574231',
  primaryPhone: '09448133378',
  secondaryPhone: '9741575078',
  googleMapsUrl: 'https://maps.app.goo.gl/JxfruJVzpVDhxUhx6?g_st=ac',
  daySlotHours: '10:00 AM – 3:00 PM',
  eveningSlotHours: '6:00 PM – 10:00 PM',
  paymentNotice:
    'Payment and final booking arrangements are handled directly with the management. Please contact the management for payment details and confirmation.',
};

export const TIMING_SLOTS: TimingSlotConfig[] = [
  {
    id: 'day',
    label: 'Day Session',
    timeRange: '10:00 AM – 3:00 PM',
    description: 'Prime morning to afternoon slot for wedding ceremonies, muhurtham, nikah, and lunch receptions.',
  },
  {
    id: 'evening',
    label: 'Evening Session',
    timeRange: '6:00 PM – 10:00 PM',
    description: 'Ambient evening slot for grand receptions, cultural gatherings, dinner feasts, and celebratory galas.',
  },
];

export const HALL_STRUCTURE: HallDetails[] = [
  {
    id: 'hall_1',
    name: 'Hall 1',
    displayName: 'Hall 1 (Single Hall)',
    subtitle: 'Single Hall + Single Dining + Kitchen with AC or Non AC options',
    description:
      'Single independent hall section at H H Events & Conventions with dining and kitchen facilities.',
    pricing: {
      ac: 30000,
      nonAc: 25000,
      acWithDoubleDining: 45000,
      nonAcWithDoubleDining: 30000,
    },
    features: [
      'Single Hall section',
      'Single Dining + Kitchen included',
      'Double Dining option available',
      'AC or Non AC configuration',
    ],
    imageKey: '',
  },
  {
    id: 'hall_2',
    name: 'Hall 2',
    displayName: 'Hall 2 (Single Hall)',
    subtitle: 'Single Hall + Single Dining + Kitchen with AC or Non AC options',
    description:
      'Single independent hall section at H H Events & Conventions with dining and kitchen facilities. Can be booked independently or together with Hall 1.',
    pricing: {
      ac: 30000,
      nonAc: 25000,
      acWithDoubleDining: 45000,
      nonAcWithDoubleDining: 30000,
    },
    features: [
      'Single Hall section',
      'Single Dining + Kitchen included',
      'Double Dining option available',
      'AC or Non AC configuration',
    ],
    imageKey: '',
  },
];

export const COMBINED_PACKAGE = {
  id: 'both' as const,
  name: 'Full Hall (Hall 1 + Hall 2 Combined)',
  displayName: 'Full Hall (Gents & Ladies Hall)',
  subtitle: 'Gents & Ladies Hall + Gents & Ladies Dining + Kitchen',
  pricing: {
    ac: 65000,
    nonAc: 45000,
  },
  features: [
    'Gents & Ladies Hall',
    'Gents & Ladies Dining',
    'Kitchen included',
    'Full AC (₹65,000) or Full Non AC (₹45,000)',
  ],
};

export interface OfficialFacility {
  id: string;
  name: string;
  details: string;
  packageSupport: string;
  imageUrl: string;
}

// Official facilities strictly from uploaded source of truth
export const OFFICIAL_FACILITIES: OfficialFacility[] = [
  {
    id: 'gents-ladies-hall',
    name: 'Gents & Ladies Hall',
    details: 'Full hall configuration featuring dedicated Gents Hall and Ladies Hall sections.',
    packageSupport: 'Full AC Hall (₹65,000.00) & Full Non AC Hall (₹45,000.00)',
    imageUrl: '',
  },
  {
    id: 'single-hall',
    name: 'Single Hall',
    details: 'Single independent hall section (Hall 1 or Hall 2) for individual bookings.',
    packageSupport: 'Single AC Hall (₹30,000.00 / ₹45,000.00) & Single Non AC Hall (₹25,000.00 / ₹30,000.00)',
    imageUrl: '',
  },
  {
    id: 'gents-ladies-dining',
    name: 'Gents & Ladies Dining',
    details: 'Complete dining wings accommodating both Gents Dining and Ladies Dining.',
    packageSupport: 'Full AC Hall, Full Non AC Hall, Single AC Hall-II, Single Non AC Hall -II & Double Dining',
    imageUrl: '',
  },
  {
    id: 'single-dining',
    name: 'Single Dining',
    details: 'Dedicated single dining hall wing.',
    packageSupport: 'Single AC Hall, Single Non AC Hall & Single Dining',
    imageUrl: '',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    details: 'Food preparation and catering kitchen included with all official hall and dining packages.',
    packageSupport: 'Included in all 8 packages without additional charges',
    imageUrl: '',
  },
];

export const FACILITY_AMENITIES = OFFICIAL_FACILITIES;
export const ADDON_SERVICES: { id: string; name: string; description: string; rate: number }[] = [];

export const INITIAL_FACILITIES: FacilityWing[] = [
  {
    id: 'hall_1',
    name: 'Hall 1 (Single Hall)',
    category: 'Hall',
    tagline: 'Single Hall + Single Dining + Kitchen',
    description: 'Single Hall section with dining and kitchen facilities.',
    baseRatePerSlot: 30000,
    imageUrl: '',
    features: ['Single Hall', 'Single Dining', 'Kitchen'],
  },
  {
    id: 'hall_2',
    name: 'Hall 2 (Single Hall)',
    category: 'Hall',
    tagline: 'Single Hall + Single Dining + Kitchen',
    description: 'Single Hall section with dining and kitchen facilities.',
    baseRatePerSlot: 30000,
    imageUrl: '',
    features: ['Single Hall', 'Single Dining', 'Kitchen'],
  },
  {
    id: 'dining-wing',
    name: 'Dining Wing (Single / Double Dining)',
    category: 'Dining',
    tagline: 'Gents & Ladies Dining / Single Dining',
    description: 'Dining wing facilities available as Single Dining or Double Dining with kitchen.',
    baseRatePerSlot: 15000,
    imageUrl: '',
    features: ['Single Dining / Double Dining', 'Kitchen'],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    category: 'Kitchen',
    tagline: 'Included with all packages',
    description: 'Food preparation and catering kitchen included with all hall and dining packages.',
    baseRatePerSlot: 0,
    imageUrl: '',
    features: ['Kitchen included in all packages'],
  },
];

export interface OfficialTariffPackage {
  id: string;
  package: string;
  details: string;
  rent: number;
  rentFormatted: string;
  acType: 'AC' | 'Non AC' | 'Dining Only';
}

export const OFFICIAL_TARIFF_SCHEDULE = 'All Sunday,Monday & Thursday';

// Official Packages exactly as presented in the uploaded source of truth image
export const OFFICIAL_TARIFF_PACKAGES: OfficialTariffPackage[] = [
  {
    id: 'full-ac-hall',
    package: 'Full AC Hall',
    details: 'Gents & Ladies Hall + Gents & Ladies Dining + Kitchen',
    rent: 65000,
    rentFormatted: '65,000.00',
    acType: 'AC',
  },
  {
    id: 'full-non-ac-hall',
    package: 'Full Non AC Hall',
    details: 'Gents & Ladies Hall + Gents & Ladies Dining + Kitchen',
    rent: 45000,
    rentFormatted: '45,000.00',
    acType: 'Non AC',
  },
  {
    id: 'single-ac-hall',
    package: 'Single AC Hall',
    details: 'Single Hall + Single Dining+ Kitchen',
    rent: 30000,
    rentFormatted: '30,000.00',
    acType: 'AC',
  },
  {
    id: 'single-ac-hall-ii',
    package: 'Single AC Hall-II',
    details: 'Single Hall + Double Dining+ Kitchen',
    rent: 45000,
    rentFormatted: '45,000.00',
    acType: 'AC',
  },
  {
    id: 'single-non-ac-hall',
    package: 'Single Non AC Hall',
    details: 'Single Hall + Single Dining+ Kitchen',
    rent: 25000,
    rentFormatted: '25,000.00',
    acType: 'Non AC',
  },
  {
    id: 'single-non-ac-hall-ii',
    package: 'Single Non AC Hall -II',
    details: 'Single Hall + Double Dining+ Kitchen',
    rent: 30000,
    rentFormatted: '30,000.00',
    acType: 'Non AC',
  },
  {
    id: 'single-dining',
    package: 'Single Dining',
    details: 'Single Dining + Kitchen',
    rent: 15000,
    rentFormatted: '15,000.00',
    acType: 'Dining Only',
  },
  {
    id: 'double-dining',
    package: 'Double Dining',
    details: 'Double Dining + Kitchen',
    rent: 20000,
    rentFormatted: '20,000.00',
    acType: 'Dining Only',
  },
];

// Official Venue Photographs and Visualizations from HH Events & Conventions
export interface GalleryItem {
  id: string;
  title: string;
  category: 'Venue Exterior' | 'Event Halls' | 'Dining Facilities' | 'Architectural Concepts';
  imageUrl: string;
  description: string;
  featured: boolean;
  isConcept?: boolean;
  note?: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-01',
    title: 'Main Building Exterior & Illuminated Signage',
    category: 'Venue Exterior',
    imageUrl: '/assets/venue/photos/HH_Events_Venue_Images/01_venue_exterior.webp',
    description: 'Authentic exterior view of H H Events & Conventions with illuminated golden signage, front entrance portico, decorative string lighting, and paved forecourt.',
    featured: true,
    isConcept: false,
  },
  {
    id: 'gal-02',
    title: 'Event Hall — Black & Gold Seating',
    category: 'Event Halls',
    imageUrl: '/assets/venue/photos/HH_Events_Venue_Images/02_event_hall_black_gold.webp',
    description: 'Real indoor event hall configuration with banquet seating in black-and-gold covers, central processional aisle, overhead lighting, and decorated stage dais.',
    featured: true,
    isConcept: false,
    note: 'Physical hall allocation awaiting owner confirmation',
  },
  {
    id: 'gal-03',
    title: 'Event Hall — Yellow Seating Arrangement',
    category: 'Event Halls',
    imageUrl: '/assets/venue/photos/HH_Events_Venue_Images/03_event_hall_yellow.webp',
    description: 'Real indoor event hall arrangement featuring custom yellow H H Events-branded chair covers, central processional aisle, and decorated ceremony dais.',
    featured: true,
    isConcept: false,
    note: 'Physical hall allocation awaiting owner confirmation',
  },
  {
    id: 'gal-04',
    title: 'Dining Area (Seated Banquet Wing)',
    category: 'Dining Facilities',
    imageUrl: '/assets/venue/photos/HH_Events_Venue_Images/05_dining_area_seating.webp',
    description: 'Authentic covered dining area equipped with dining tables, red-and-black chairs, overhead ceiling fans, and natural cross-ventilation.',
    featured: true,
    isConcept: false,
  },
  {
    id: 'gal-05',
    title: 'Covered Dining & Service Area',
    category: 'Dining Facilities',
    imageUrl: '/assets/venue/photos/HH_Events_Venue_Images/06_dining_area_open.webp',
    description: 'Spacious covered area featuring tiled flooring, stainless-steel food service counters, high-capacity ceiling fans, and flexible turnover space.',
    featured: true,
    isConcept: false,
    note: 'Facility designation awaiting owner confirmation',
  },
  {
    id: 'gal-06',
    title: 'Outdoor Banquet Area — Architectural Concept',
    category: 'Architectural Concepts',
    imageUrl: '/assets/venue/photos/HH_Events_Venue_Images/04_outdoor_event_concept.webp',
    description: 'Computer-generated architectural visualization illustrating a potential landscaped outdoor banquet layout with round dining tables and royal palm trees. Not an actual photograph.',
    featured: false,
    isConcept: true,
  },
  {
    id: 'gal-07',
    title: 'Parking Plaza — Architectural Concept',
    category: 'Architectural Concepts',
    imageUrl: '/assets/venue/photos/HH_Events_Venue_Images/07_parking_concept.webp',
    description: 'Computer-generated architectural visualization depicting the building exterior, vehicular approach, and planned parking arrangement. Not an actual photograph.',
    featured: false,
    isConcept: true,
  },
];

export const INITIAL_BOOKINGS: BookingRequest[] = [];

export const INITIAL_MAINTENANCE_SCHEDULE: MaintenanceRecord[] = [
  {
    id: 'MNT-101',
    facilityId: 'hall_1',
    title: 'VRF Air Conditioning Routine Servicing',
    description: 'Quarterly filter sanitization, refrigerant pressure check, and blower inspection.',
    status: 'scheduled',
    priority: 'medium',
    scheduledDate: '2026-11-02',
    assignedTo: 'Coastal HVAC Engineers',
    estimatedCost: 15000,
  },
  {
    id: 'MNT-102',
    facilityId: 'hall_2',
    title: 'Acoustic Sound System Recalibration',
    description: 'Tuning audio processors, boundary microphones, and digital speakers.',
    status: 'completed',
    priority: 'low',
    scheduledDate: '2026-09-10',
    assignedTo: 'ProAudio Solutions',
    estimatedCost: 8000,
    completedAt: '2026-09-10T16:00:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'AUD-101',
    action: 'SYSTEM_INITIALIZED',
    performedBy: 'management@hhevents.in',
    targetEntity: 'hall',
    targetId: 'hall_1',
    details: 'Manager availability schedule initialized.',
    timestamp: '2026-10-01T10:00:00Z',
  },
];

export const SEED_AUDIT_LOGS = INITIAL_AUDIT_LOGS;

export const VENUE_SETTINGS: HallSettings = {
  ...VENUE_INFO,
  productName: VENUE_INFO.name,
  hallLegalTitle: VENUE_INFO.name,
  contactEmail: 'contact@hhevents.in',
  contactPhone: VENUE_INFO.primaryPhone,
  emergencyPhone: VENUE_INFO.secondaryPhone,
  locationReference: VENUE_INFO.address,
  physicalAddress: VENUE_INFO.address,
  morningSlotHours: VENUE_INFO.daySlotHours,
  securityDepositAmount: 10000,
  taxRatePercentage: 18,
  minAdvanceBookingDays: 3,
  maxAdvanceBookingMonths: 12,
  autoCancelUnpaidDays: 5,
};
