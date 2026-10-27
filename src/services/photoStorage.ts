export interface RealPhotoRecord {
  slotId: string;
  url: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
}

const STORAGE_KEY = 'hh_venue_real_photos_cache';

// In-memory cache
let photoCache: Record<string, RealPhotoRecord> = {};
let listeners: Array<() => void> = [];

// Initialize from localStorage
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    photoCache = JSON.parse(saved);
  }
} catch (e) {
  console.warn('Failed to parse cached photos:', e);
}

// Fetch from backend API
export async function syncPhotosFromBackend(): Promise<Record<string, RealPhotoRecord>> {
  try {
    const res = await fetch('/api/photos');
    if (res.ok) {
      const data = await res.json();
      if (data.photos) {
        photoCache = { ...photoCache, ...data.photos };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(photoCache));
        } catch (e) {}
        notifyListeners();
      }
    }
  } catch (err) {
    console.warn('Could not sync photos from backend, using local cache:', err);
  }
  return photoCache;
}

// Auto-sync on startup
if (typeof window !== 'undefined') {
  syncPhotosFromBackend();
}

// Authoritative Local Venue Photo Assets (Under public/assets/venue/photos/HH_Events_Venue_Images/)
export const VENUE_DEFAULT_ASSETS = {
  exterior: '/assets/venue/photos/HH_Events_Venue_Images/01_venue_exterior.webp',
  exteriorJpg: '/assets/venue/photos/HH_Events_Venue_Images/01_venue_exterior.jpg',
  hallBlackGold: '/assets/venue/photos/HH_Events_Venue_Images/02_event_hall_black_gold.webp',
  hallBlackGoldJpg: '/assets/venue/photos/HH_Events_Venue_Images/02_event_hall_black_gold.jpg',
  hallYellow: '/assets/venue/photos/HH_Events_Venue_Images/03_event_hall_yellow.webp',
  hallYellowJpg: '/assets/venue/photos/HH_Events_Venue_Images/03_event_hall_yellow.jpg',
  conceptOutdoor: '/assets/venue/photos/HH_Events_Venue_Images/04_outdoor_event_concept.webp',
  conceptOutdoorJpg: '/assets/venue/photos/HH_Events_Venue_Images/04_outdoor_event_concept.jpg',
  diningSeating: '/assets/venue/photos/HH_Events_Venue_Images/05_dining_area_seating.webp',
  diningSeatingJpg: '/assets/venue/photos/HH_Events_Venue_Images/05_dining_area_seating.jpg',
  diningOpen: '/assets/venue/photos/HH_Events_Venue_Images/06_dining_area_open.webp',
  diningOpenJpg: '/assets/venue/photos/HH_Events_Venue_Images/06_dining_area_open.jpg',
  conceptParking: '/assets/venue/photos/HH_Events_Venue_Images/07_parking_concept.webp',
  conceptParkingJpg: '/assets/venue/photos/HH_Events_Venue_Images/07_parking_concept.jpg',
} as const;

// Default slot-to-photo dictionary with verified labels and conceptual badges
export const DEFAULT_SLOT_PHOTOS: Record<
  string,
  { url: string; label: string; isConcept?: boolean; note?: string }
> = {
  hero: {
    url: VENUE_DEFAULT_ASSETS.exterior,
    label: 'Real Building Exterior & Illuminated Signage',
  },
  exterior: {
    url: VENUE_DEFAULT_ASSETS.exterior,
    label: 'Real Building Exterior & Portico',
  },
  hall1: {
    url: VENUE_DEFAULT_ASSETS.hallBlackGold,
    label: 'Event Hall — Black & Gold Seating Arrangement',
  },
  hall2: {
    url: VENUE_DEFAULT_ASSETS.hallYellow,
    label: 'Event Hall — Yellow Seating Arrangement',
  },
  combined: {
    url: VENUE_DEFAULT_ASSETS.exterior,
    label: 'H H Events & Conventions Campus View',
  },
  dining: {
    url: VENUE_DEFAULT_ASSETS.diningSeating,
    label: 'Dining Area',
    note: 'Authentic covered dining setup with table seating',
  },
  dining_open: {
    url: VENUE_DEFAULT_ASSETS.diningOpen,
    label: 'Covered Dining & Service Area',
  },
  'single-hall': {
    url: VENUE_DEFAULT_ASSETS.hallBlackGold,
    label: 'Event Hall — Black & Gold Setup',
  },
  'gents-ladies-hall': {
    url: VENUE_DEFAULT_ASSETS.hallYellow,
    label: 'Event Hall — Yellow Setup',
  },
  'single-dining': {
    url: VENUE_DEFAULT_ASSETS.diningSeating,
    label: 'Dining Area',
  },
  'gents-ladies-dining': {
    url: VENUE_DEFAULT_ASSETS.diningOpen,
    label: 'Covered Dining & Service Area',
  },
  // Gallery default slots
  'gal-01': {
    url: VENUE_DEFAULT_ASSETS.exterior,
    label: 'Main Building Exterior & Illuminated Portico',
  },
  'gal-02': {
    url: VENUE_DEFAULT_ASSETS.hallBlackGold,
    label: 'Event Hall — Black & Gold Seating Arrangement',
  },
  'gal-03': {
    url: VENUE_DEFAULT_ASSETS.hallYellow,
    label: 'Event Hall — Yellow Seating Arrangement',
  },
  'gal-04': {
    url: VENUE_DEFAULT_ASSETS.diningSeating,
    label: 'Dining Area (Seated Banquet Wing)',
  },
  'gal-05': {
    url: VENUE_DEFAULT_ASSETS.diningOpen,
    label: 'Covered Dining & Service Area',
  },
  'gal-06': {
    url: VENUE_DEFAULT_ASSETS.conceptOutdoor,
    label: 'Outdoor Event Space — Architectural Visualization',
    isConcept: true,
  },
  'gal-07': {
    url: VENUE_DEFAULT_ASSETS.conceptParking,
    label: 'Parking Plaza — Architectural Visualization',
    isConcept: true,
  },
};

export function getRealPhoto(slotId: string): string | null {
  return photoCache[slotId]?.url || DEFAULT_SLOT_PHOTOS[slotId]?.url || null;
}

export function getAllRealPhotos(): Record<string, RealPhotoRecord> {
  const merged: Record<string, RealPhotoRecord> = {};
  // Populate defaults
  for (const [slotId, def] of Object.entries(DEFAULT_SLOT_PHOTOS)) {
    merged[slotId] = {
      slotId,
      url: def.url,
      filename: def.url.split('/').pop() || 'photo.webp',
      mimeType: 'image/webp',
      uploadedAt: 'system-default',
    };
  }
  // Overlay user uploads
  return { ...merged, ...photoCache };
}

export async function saveRealPhoto(
  slotId: string,
  filename: string,
  dataUrl: string
): Promise<{ success: boolean; url: string }> {
  const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  // 1. Save locally first for instant reactive update
  const localRecord: RealPhotoRecord = {
    slotId,
    url: dataUrl,
    filename,
    mimeType,
    uploadedAt: new Date().toISOString(),
  };

  photoCache[slotId] = localRecord;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photoCache));
  } catch (e) {
    // If local storage is full, keep in memory
  }
  notifyListeners();

  // 2. Persist to backend server so it saves as actual file in public/assets/venue/photos/
  try {
    const res = await fetch('/api/photos/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, filename, dataUrl }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.url) {
        // Update URL to the real static file URL
        photoCache[slotId] = {
          ...localRecord,
          url: json.url,
          filename: json.filename || filename,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(photoCache));
        } catch (e) {}
        notifyListeners();
        return { success: true, url: json.url };
      }
    }
  } catch (err) {
    console.error('Backend photo upload failed, persisted locally:', err);
  }

  return { success: true, url: dataUrl };
}

export async function removeRealPhoto(slotId: string): Promise<void> {
  delete photoCache[slotId];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photoCache));
  } catch (e) {}
  notifyListeners();

  try {
    await fetch(`/api/photos/${slotId}`, { method: 'DELETE' });
  } catch (e) {}
}

export function subscribePhotos(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}
