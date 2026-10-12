import fs from 'fs';
import path from 'path';

export interface PhysicalResource {
  id: string;
  name: string;
  category: 'hall' | 'dining' | 'kitchen';
  capacity?: number;
}

export const PHYSICAL_RESOURCES: PhysicalResource[] = [
  { id: 'gents_hall', name: 'Gents Hall (Hall 1)', category: 'hall', capacity: 600 },
  { id: 'ladies_hall', name: 'Ladies Hall (Hall 2)', category: 'hall', capacity: 600 },
  { id: 'dining_1', name: 'Dining Section 1 (Gents Dining)', category: 'dining', capacity: 350 },
  { id: 'dining_2', name: 'Dining Section 2 (Ladies Dining)', category: 'dining', capacity: 350 },
  { id: 'kitchen', name: 'Commercial Catering Kitchen', category: 'kitchen', capacity: 50 },
];

export interface HallPackage {
  id: string;
  name: string;
  displayName: string;
  details: string;
  rent: number;
  rentFormatted: string;
  acType: 'AC' | 'Non AC' | 'Dining Only';
  requiredResources: string[]; // e.g. ['gents_hall', 'ladies_hall', 'dining_1', 'dining_2', 'kitchen']
  inclusions: string[];
  capacityText: string;
  active: boolean;
  displayOrder: number;
}

export const INITIAL_PACKAGES: HallPackage[] = [
  {
    id: 'full-ac-hall',
    name: 'Full AC Hall',
    displayName: 'Full AC Hall (Gents & Ladies Hall)',
    details: 'Gents & Ladies Hall + Gents & Ladies Dining + Kitchen with Centralized Air Conditioning',
    rent: 65000,
    rentFormatted: '65,000.00',
    acType: 'AC',
    requiredResources: ['gents_hall', 'ladies_hall', 'dining_1', 'dining_2', 'kitchen'],
    inclusions: [
      'Gents & Ladies Convention Hall Wings',
      'Dual Gents & Ladies Dining Wings',
      'Full Central Air Conditioning (AC)',
      'Equipped Catering Kitchen Facility',
      'Main Stage & Processional Aisle',
      'Backup Generator Power Supply'
    ],
    capacityText: 'Up to 3,000 Persons (Floating) / 1,200 Seated',
    active: true,
    displayOrder: 1,
  },
  {
    id: 'full-non-ac-hall',
    name: 'Full Non AC Hall',
    displayName: 'Full Non AC Hall (Gents & Ladies Hall)',
    details: 'Gents & Ladies Hall + Gents & Ladies Dining + Kitchen (Natural High Ventilation)',
    rent: 45000,
    rentFormatted: '45,000.00',
    acType: 'Non AC',
    requiredResources: ['gents_hall', 'ladies_hall', 'dining_1', 'dining_2', 'kitchen'],
    inclusions: [
      'Gents & Ladies Convention Hall Wings',
      'Dual Gents & Ladies Dining Wings',
      'High-Ceiling Ventilation & Air Circulators',
      'Equipped Catering Kitchen Facility',
      'Main Stage & Processional Aisle',
      'Backup Generator Power Supply'
    ],
    capacityText: 'Up to 3,000 Persons (Floating) / 1,200 Seated',
    active: true,
    displayOrder: 2,
  },
  {
    id: 'single-ac-hall',
    name: 'Single AC Hall',
    displayName: 'Single AC Hall (Hall 1 / Hall 2)',
    details: 'Single Hall + Single Dining + Kitchen with Air Conditioning',
    rent: 30000,
    rentFormatted: '30,000.00',
    acType: 'AC',
    requiredResources: ['gents_hall', 'dining_1', 'kitchen'],
    inclusions: [
      'Single Independent Hall Wing (AC)',
      'Dedicated Single Dining Wing',
      'Equipped Catering Kitchen Facility',
      'Stage Platform with Acoustic Lighting',
      'Independent Entrance & Restroom Amenities'
    ],
    capacityText: 'Up to 600 Persons (Floating) / 400 Seated',
    active: true,
    displayOrder: 3,
  },
  {
    id: 'single-ac-hall-ii',
    name: 'Single AC Hall-II',
    displayName: 'Single AC Hall-II (Double Dining)',
    details: 'Single Hall + Double Dining + Kitchen with Air Conditioning',
    rent: 45000,
    rentFormatted: '45,000.00',
    acType: 'AC',
    requiredResources: ['gents_hall', 'dining_1', 'dining_2', 'kitchen'],
    inclusions: [
      'Single Independent Hall Wing (AC)',
      'Dual Dining Wings (Double Dining Turnout)',
      'Equipped Catering Kitchen Facility',
      'Ideal for heavy dining turnouts with single stage program'
    ],
    capacityText: 'Up to 1,000 Persons (Floating) / 500 Seated',
    active: true,
    displayOrder: 4,
  },
  {
    id: 'single-non-ac-hall',
    name: 'Single Non AC Hall',
    displayName: 'Single Non AC Hall (Hall 1 / Hall 2)',
    details: 'Single Hall + Single Dining + Kitchen (Natural Ventilation)',
    rent: 25000,
    rentFormatted: '25,000.00',
    acType: 'Non AC',
    requiredResources: ['gents_hall', 'dining_1', 'kitchen'],
    inclusions: [
      'Single Independent Hall Wing (Non-AC)',
      'Dedicated Single Dining Wing',
      'Equipped Catering Kitchen Facility',
      'Ceiling Circulators & Ambient Lighting'
    ],
    capacityText: 'Up to 600 Persons (Floating) / 400 Seated',
    active: true,
    displayOrder: 5,
  },
  {
    id: 'single-non-ac-hall-ii',
    name: 'Single Non AC Hall -II',
    displayName: 'Single Non AC Hall-II (Double Dining)',
    details: 'Single Hall + Double Dining + Kitchen (Natural Ventilation)',
    rent: 30000,
    rentFormatted: '30,000.00',
    acType: 'Non AC',
    requiredResources: ['gents_hall', 'dining_1', 'dining_2', 'kitchen'],
    inclusions: [
      'Single Independent Hall Wing (Non-AC)',
      'Dual Dining Wings (Double Dining)',
      'Equipped Catering Kitchen Facility'
    ],
    capacityText: 'Up to 1,000 Persons (Floating) / 500 Seated',
    active: true,
    displayOrder: 6,
  },
  {
    id: 'single-dining',
    name: 'Single Dining',
    displayName: 'Single Dining + Kitchen',
    details: 'Single Dining + Kitchen for intimate lunch/dinner feasts or catering preparation',
    rent: 15000,
    rentFormatted: '15,000.00',
    acType: 'Dining Only',
    requiredResources: ['dining_1', 'kitchen'],
    inclusions: [
      'Single Dining Wing Access',
      'Equipped Catering Kitchen Facility',
      'Sanitation & Dining Table Setup'
    ],
    capacityText: 'Up to 350 Persons Dining Turnover',
    active: true,
    displayOrder: 7,
  },
  {
    id: 'double-dining',
    name: 'Double Dining',
    displayName: 'Double Dining + Kitchen',
    details: 'Double Dining + Kitchen for expansive banquets, community feasts, or iftar gatherings',
    rent: 20000,
    rentFormatted: '20,000.00',
    acType: 'Dining Only',
    requiredResources: ['dining_1', 'dining_2', 'kitchen'],
    inclusions: [
      'Both Dining Wings (Gents & Ladies Dining)',
      'Equipped Catering Kitchen Facility',
      'High Volume Banquet Table Setup'
    ],
    capacityText: 'Up to 700 Persons Simultaneous Dining',
    active: true,
    displayOrder: 8,
  },
];

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  amount: number;
  paymentType: 'advance' | 'balance' | 'full' | 'security_deposit' | 'refund';
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'other';
  referenceNo?: string;
  receivedBy: string;
  receiptNumber: string;
  notes?: string;
  createdAt: string;
}

export interface BookingRecord {
  id: string; // e.g. HH-2026-104921
  customerName: string;
  phone: string;
  email: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  // Resource occupancy
  occupiedResources: string[]; // e.g. ['gents_hall', 'dining_1', 'kitchen']
  hallSelection: 'hall_1' | 'hall_2' | 'both';
  acOption: 'ac' | 'non_ac';
  date: string; // YYYY-MM-DD
  slot: 'day' | 'evening'; // 'day' (10 AM - 3 PM), 'evening' (6 PM - 10 PM)
  expectedAttendees?: number;
  additionalInfo?: string;
  eventType?: string;
  status: 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'COMPLETED';
  totalAmount: number;
  advanceRequired: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'unpaid' | 'advance_paid' | 'fully_paid' | 'refunded';
  payments: PaymentTransaction[];
  adminRemarks?: string;
  rejectionReason?: string;
  submittedAt: string;
  updatedAt: string;
  verifiedBy?: string;
}

export interface AvailabilityBlackout {
  id: string;
  date: string; // YYYY-MM-DD
  slot: 'day' | 'evening' | 'full_day';
  resources: string[]; // e.g. ['all'] or ['gents_hall']
  reason: string;
  blockedBy: string;
  createdAt: string;
}

export interface MaintenanceBlock {
  id: string;
  title: string;
  category: string;
  resources: string[];
  startDate: string;
  endDate: string;
  slot: 'day' | 'evening' | 'full_day';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  action: string;
  performedBy: string;
  targetEntity: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface VenueSettingsRecord {
  name: string;
  tagline: string;
  address: string;
  primaryPhone: string;
  secondaryPhone: string;
  googleMapsUrl: string;
  daySlotHours: string;
  eveningSlotHours: string;
  paymentNotice: string;
  gstNumber?: string;
  panNumber?: string;
  termsAndConditions?: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  bookings: BookingRecord[];
  packages: HallPackage[];
  availabilityBlackouts: AvailabilityBlackout[];
  maintenance: MaintenanceBlock[];
  auditLogs: AuditRecord[];
  settings: VenueSettingsRecord;
  lastUpdated: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'store.json');

// Memory cache & mutex
let dbCache: DatabaseSchema | null = null;
let writeLock: Promise<void> = Promise.resolve();

function getInitialDatabase(): DatabaseSchema {
  return {
    bookings: [],
    packages: INITIAL_PACKAGES,
    availabilityBlackouts: [],
    maintenance: [],
    auditLogs: [
      {
        id: `LOG-INIT`,
        action: 'SYSTEM_BOOT',
        performedBy: 'system',
        targetEntity: 'system',
        targetId: 'hh-events-core',
        details: 'Shared persistent database initialized with 8 official packages.',
        timestamp: new Date().toISOString(),
      },
    ],
    settings: {
      name: 'H H Events & Conventions',
      tagline: 'Premier Convention, Wedding & Grand Event Destination',
      address: 'Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal, Karnataka 574231',
      primaryPhone: '09448133378',
      secondaryPhone: '9741575078',
      googleMapsUrl: 'https://maps.app.goo.gl/JxfruJVzpVDhxUhx6?g_st=ac',
      daySlotHours: '10:00 AM – 3:00 PM',
      eveningSlotHours: '6:00 PM – 10:00 PM',
      paymentNotice:
        'Payment and final booking arrangements are handled directly with the management. Please contact management for advance token confirmation.',
      gstNumber: '',
      panNumber: '',
      termsAndConditions: 'Standard venue guidelines apply. Advance deposit is required to confirm the reservation.',
      updatedAt: new Date().toISOString(),
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function getDb(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = await fs.promises.readFile(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
      // Ensure schema completeness
      if (!dbCache!.packages || dbCache!.packages.length === 0) {
        dbCache!.packages = INITIAL_PACKAGES;
      }
      return dbCache!;
    }
  } catch (err) {
    console.error('Error reading store.json, re-initializing default schema:', err);
  }

  dbCache = getInitialDatabase();
  await persistDb();
  return dbCache;
}

export async function persistDb(): Promise<void> {
  if (!dbCache) return;

  // Queue writes sequentially through writeLock
  writeLock = writeLock.then(async () => {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      dbCache!.lastUpdated = new Date().toISOString();
      await fs.promises.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write store.json:', err);
    }
  });

  return writeLock;
}

export async function logAudit(
  action: string,
  performedBy: string,
  targetEntity: string,
  targetId: string,
  details: string
): Promise<void> {
  const db = await getDb();
  const newLog: AuditRecord = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    performedBy,
    targetEntity,
    targetId,
    details,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  await persistDb();
}
