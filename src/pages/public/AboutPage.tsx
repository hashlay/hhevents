import React from 'react';
import {
  Building2,
  ShieldCheck,
  Users,
  Clock,
  Car,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { VENUE_INFO } from '../../services/hallData';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';

interface AboutPageProps {
  navigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();
  const exteriorPhoto = getPhotoUrl('gal-01') || getPhotoUrl('hero');

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
              <Building2 className="w-3.5 h-3.5 text-[#C9AA72]" />
              About H H Events &amp; Conventions
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#252525] tracking-tight font-serif-heading">
              A Premier Venue for Celebrations &amp; Conventions
            </h1>
            <p className="text-base sm:text-lg text-[#4A4A4A] leading-relaxed">
              Conveniently situated opposite Juma Masjid in Panemangalore, H H Events &amp; Conventions provides an exceptional setting for weddings, Nikah, receptions, cultural gatherings, and corporate conventions.
            </p>
          </div>
        </div>
      </section>

      {/* Main Philosophy & Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#173D35] bg-[#F5F1E8] px-3.5 py-1.5 rounded-full border border-[#E2DACB]">
              <Building2 className="w-3.5 h-3.5 text-[#C9AA72]" /> Venue Vision &amp; Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#252525] font-serif-heading">
              Designed For Unforgettable Celebrations
            </h2>
            <p className="text-[#4A4A4A] text-sm leading-relaxed">
              H H Events &amp; Conventions was built with modern event logistics in mind. Featuring two independently bookable halls — Hall 1 and Hall 2 — hosts can configure either an intimate family celebration or a grand dual-hall convention with simultaneous ceremony and feast turnover.
            </p>
            <p className="text-[#4A4A4A] text-sm leading-relaxed">
              Every detail is planned for guest convenience: two independent halls bookable separately or combined, comfortable dining wings configured for traditional seated feasting or modern buffet service, and dedicated kitchen facilities included in all official packages.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white border border-[#E2DACB] shadow-2xs">
                <span className="text-xl sm:text-2xl font-bold text-[#252525] block">Dual Halls</span>
                <span className="text-xs text-[#C9AA72] font-medium">Independent Ingress</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2DACB] shadow-2xs">
                <span className="text-xl sm:text-2xl font-bold text-[#252525] block">600 Persons</span>
                <span className="text-xs text-[#C9AA72] font-medium">Seating Capacity</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2DACB] shadow-2xs">
                <span className="text-xl sm:text-2xl font-bold text-[#252525] block">AC / Non-AC</span>
                <span className="text-xs text-[#C9AA72] font-medium">Configurable Options</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#E2DACB] bg-[#FAF8F5] min-h-[360px] flex items-center justify-center p-2.5">
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-[#FAF8F5]">
              {exteriorPhoto ? (
                <img
                  src={exteriorPhoto}
                  alt="H H Events & Conventions Campus"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#737373]">
                  <Building2 className="w-12 h-12 text-[#C9AA72] mb-2" />
                  <h4 className="text-base font-bold text-[#252525]">H H Events &amp; Conventions Campus</h4>
                  <p className="text-xs">Opposite Juma Masjid, Panemangalore</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Checklist */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E2DACB] shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#252525] font-serif-heading">
              Our Core Promises to Hosts
            </h3>
            <p className="text-xs sm:text-sm text-[#4A4A4A]">
              From arrival to final departure, our facilities ensure your family and guests feel respected and comfortable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] space-y-2">
              <ShieldCheck className="w-6 h-6 text-[#C9AA72]" />
              <h4 className="font-bold text-sm text-[#252525]">Acoustic &amp; Visual Privacy</h4>
              <p className="text-xs text-[#4A4A4A] leading-relaxed">
                Independent entrances and foyers ensure your celebration has total exclusivity.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] space-y-2">
              <ShieldCheck className="w-6 h-6 text-[#C9AA72]" />
              <h4 className="font-bold text-sm text-[#252525]">Continuous Power Backup</h4>
              <p className="text-xs text-[#4A4A4A] leading-relaxed">
                Industrial generator backup covers all air conditioning units and stage equipment.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] space-y-2">
              <Car className="w-6 h-6 text-[#C9AA72]" />
              <h4 className="font-bold text-sm text-[#252525]">Spacious Parking</h4>
              <p className="text-xs text-[#4A4A4A] leading-relaxed">
                On-campus parking slots for wedding convoys and buses with wheelchair-friendly entry.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] space-y-2">
              <Clock className="w-6 h-6 text-[#C9AA72]" />
              <h4 className="font-bold text-sm text-[#252525]">3-Hour Buffer Guarantee</h4>
              <p className="text-xs text-[#4A4A4A] leading-relaxed">
                Dedicated sanitation and decor setup windows between Day and Evening slots.
              </p>
            </div>
          </div>

          <div className="pt-4 text-center">
            <Button
              onClick={() => navigate('/book')}
              variant="gold"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Plan Your Event With Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
