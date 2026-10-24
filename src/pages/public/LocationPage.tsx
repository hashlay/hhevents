import React from 'react';
import {
  MapPin,
  Navigation,
  Plane,
  Train,
  Bus,
  Car,
  Clock,
  ShieldCheck,
  Building2,
  ExternalLink,
  Accessibility,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { VENUE_INFO } from '../../services/hallData';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';

interface LocationPageProps {
  navigate: (path: string) => void;
}

export const LocationPage: React.FC<LocationPageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();
  const locationPhoto = getPhotoUrl('gal-01') || getPhotoUrl('hero');

  return (
    <div className="space-y-16 pb-24 bg-[#F5F1E8] text-[#252525]">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] py-14 sm:py-18 border-b border-[#E2DACB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#173D35] bg-[#F5F1E8] px-3.5 py-1.5 rounded-full border border-[#E2DACB] inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#C9AA72]" />
              Venue Coordinates &amp; Access
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#252525] tracking-tight font-serif-heading">
              How to Reach H H Events &amp; Conventions
            </h1>
            <p className="text-base sm:text-lg text-[#4A4A4A] leading-relaxed">
              Prominently located Opposite Juma Masjid, Panemangalore, Akkarangadi, Bantwal Taluk with direct highway connectivity and spacious parking.
            </p>
          </div>
        </div>
      </section>

      {/* Main Address Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2DACB] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#C9AA72] font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-[#C9AA72]" />
                <span>OFFICIAL VENUE LOCATION</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#252525] font-serif-heading">
                H H Events &amp; Conventions
              </h2>
              <p className="text-sm font-semibold text-[#4A4A4A]">
                {VENUE_INFO.address}
              </p>
            </div>

            <a
              href={VENUE_INFO.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C9AA72] hover:bg-[#A58448] text-white font-bold text-sm shadow-xs transition-colors shrink-0"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#E2DACB] text-xs text-[#4A4A4A]">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              <Accessibility className="w-3.5 h-3.5 text-emerald-600" /> Wheelchair Accessible Entrance &amp; Parking Bays
            </span>
            <span className="text-[#737373]">
              Landmark: Directly Opposite Juma Masjid, Panemangalore
            </span>
            <a href={`tel:${VENUE_INFO.primaryPhone}`} className="text-[#C9AA72] font-bold hover:underline">
              Call Desk: {VENUE_INFO.primaryPhone}
            </a>
            <span className="text-[#737373]">&bull;</span>
            <a
              href={`https://wa.me/91${VENUE_INFO.whatsappPhone}?text=${encodeURIComponent('Hello H H Events Management, I need location assistance.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp: {VENUE_INFO.whatsappPhone}
            </a>
          </div>
        </div>
      </section>

      {/* Map Box + Transit Connectivity */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visual Showcase Box */}
          <div className="lg:col-span-1 rounded-3xl bg-white border border-[#E2DACB] shadow-sm p-3 flex flex-col justify-between">
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-[#FAF8F5]">
              {locationPhoto ? (
                <img
                  src={locationPhoto}
                  alt="H H Events Entrance & Landmark"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#737373]">
                  <MapPin className="w-10 h-10 text-[#C9AA72] mb-2" />
                  <span className="font-bold text-sm text-[#252525]">Panemangalore Campus</span>
                  <span className="text-xs">Opposite Juma Masjid</span>
                </div>
              )}
            </div>

            <div className="p-4 space-y-2">
              <h3 className="font-bold text-base text-[#252525]">Prime Highway Visibility</h3>
              <p className="text-xs text-[#4A4A4A] leading-relaxed">
                Located right off the main road in Akkarangadi with a dedicated entrance gate that allows easy turning for buses and cars.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => navigate('/book')}
                  variant="gold"
                  size="sm"
                  className="w-full justify-center"
                >
                  Book Date for This Venue
                </Button>
              </div>
            </div>
          </div>

          {/* Transit Options */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold text-[#252525] font-serif-heading">
              Connectivity from Key Hubs
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-[#E2DACB] shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#252525]">
                  <Car className="w-4 h-4 text-[#C9AA72]" />
                  <span>By Road / Car</span>
                </div>
                <p className="text-[#4A4A4A] leading-relaxed">
                  Easily accessible via Mangalore–Bangalore National Highway (NH 75) via BC Road junction. 5 minutes from BC Road center.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E2DACB] shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#252525]">
                  <Bus className="w-4 h-4 text-[#C9AA72]" />
                  <span>By Public Transit / Bus</span>
                </div>
                <p className="text-[#4A4A4A] leading-relaxed">
                  Regular town buses and express buses running between Mangalore, BC Road, and Bantwal stop near Panemangalore bridge / Akkarangadi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E2DACB] shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#252525]">
                  <Train className="w-4 h-4 text-[#C9AA72]" />
                  <span>By Train</span>
                </div>
                <p className="text-[#4A4A4A] leading-relaxed">
                  Bantwal Railway Station (BC Road) is located approximately 3.5 km away, with auto-rickshaw stands connecting directly to the venue.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E2DACB] shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#252525]">
                  <Plane className="w-4 h-4 text-[#C9AA72]" />
                  <span>By Air (Airport)</span>
                </div>
                <p className="text-[#4A4A4A] leading-relaxed">
                  Mangalore International Airport (IXE) at Bajpe is approximately 32 km (45–50 minutes drive) via highway.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="text-[#4A4A4A]">Need navigation assistance on event day?</span>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`tel:${VENUE_INFO.primaryPhone}`}
                  className="font-bold text-[#C9AA72] hover:underline"
                >
                  Call Desk: {VENUE_INFO.primaryPhone}
                </a>
                <span className="text-[#C9AA72]">&bull;</span>
                <a
                  href={`https://wa.me/91${VENUE_INFO.whatsappPhone}?text=${encodeURIComponent('Hello H H Events Management, I need navigation directions.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp: {VENUE_INFO.whatsappPhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
