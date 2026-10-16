import React from 'react';
import {
  Building2,
  CheckCircle2,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  Camera,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { OFFICIAL_FACILITIES, VENUE_INFO } from '../../services/hallData';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';

interface FacilitiesPageProps {
  navigate: (path: string) => void;
}

export const FacilitiesPage: React.FC<FacilitiesPageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();

  return (
    <div className="space-y-16 pb-24 bg-[#F5F1E8] text-[#252525]">
      {/* Header */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] py-14 sm:py-18 border-b border-[#E2DACB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#173D35] bg-[#F5F1E8] px-3.5 py-1.5 rounded-full border border-[#E2DACB] inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#C9AA72]" />
              Verified Infrastructure
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#252525] tracking-tight font-serif-heading">
              Official Venue Facilities
            </h1>
            <p className="text-base sm:text-lg text-[#4A4A4A] leading-relaxed">
              Official facilities of H H Events &amp; Conventions in Panemangalore — comprising Gents &amp; Ladies Hall, Single Hall, Gents &amp; Ladies Dining, Single Dining, and Kitchen facilities.
            </p>
          </div>
        </div>
      </section>

      {/* Official Facilities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DACB] pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#252525] font-serif-heading">
              Our Venue Facilities
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4A4A] mt-1">
              Hall spaces, dining wings, and catering amenities available for your events.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#173D35] bg-[#F5F1E8] px-3.5 py-1.5 rounded-full border border-[#E2DACB] w-fit">
            5 Core Facilities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {OFFICIAL_FACILITIES.map((facility) => {
            const realPhoto =
              getPhotoUrl(facility.id) ||
              (facility.id.includes('dining') ? getPhotoUrl('dining') : null) ||
              (facility.id === 'single-hall' ? getPhotoUrl('hall1') : null) ||
              (facility.id === 'gents-ladies-hall' ? getPhotoUrl('combined') : null);

            return (
              <div
                key={facility.id}
                className="bg-white rounded-2xl border border-[#E2DACB] shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="relative h-56 bg-[#FAF8F5] overflow-hidden flex items-center justify-center">
                  {realPhoto ? (
                    <img
                      src={realPhoto}
                      alt={facility.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2 text-[#737373]">
                      <Camera className="w-8 h-8 text-[#C9AA72] mx-auto" />
                      <h4 className="text-sm font-bold text-[#252525]">{facility.name}</h4>
                      <span className="text-[11px] block">Facility photograph</span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#252525] font-serif-heading">
                      {facility.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4A4A4A] mt-2 leading-relaxed">
                      {facility.details}
                    </p>
                    {facility.id === 'gents-ladies-dining' && (
                      <p className="text-[11px] text-amber-800 italic pt-1">
                        * Facility designation (Covered Dining &amp; Service Area) awaiting owner confirmation.
                      </p>
                    )}
                    {facility.id === 'kitchen' && (
                      <p className="text-[11px] text-[#737373] italic pt-1">
                        * Commercial catering kitchen photograph awaiting physical venue capture.
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[#E2DACB]">
                    <Button
                      onClick={() => navigate('/book')}
                      variant="gold"
                      size="sm"
                      className="w-full justify-center"
                    >
                      Book With This Facility
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
