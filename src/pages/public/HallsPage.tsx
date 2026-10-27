import React from 'react';
import {
  Building2,
  CheckCircle2,
  CalendarCheck,
  ArrowRight,
  ThermometerSnowflake,
  Wind,
  ShieldCheck,
  Clock,
  Camera,
  UtensilsCrossed,
  DoorOpen,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { HALL_STRUCTURE, COMBINED_PACKAGE, VENUE_INFO } from '../../services/hallData';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';
import { VENUE_DEFAULT_ASSETS } from '../../services/photoStorage';

interface HallsPageProps {
  navigate: (path: string) => void;
}

export const HallsPage: React.FC<HallsPageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();

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
              Venue Architecture &amp; Capacities
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#252525] tracking-tight font-serif-heading">
              Our Halls: Hall 1 &amp; Hall 2
            </h1>
            <p className="text-base sm:text-lg text-[#4A4A4A] leading-relaxed">
              H H Events &amp; Conventions offers two independently bookable halls designed to host concurrent or standalone gatherings with total acoustic and logistical privacy in Panemangalore.
            </p>
          </div>
        </div>
      </section>

      {/* Dual Independent Booking Highlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#F5F1E8] border border-[#E2DACB] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173D35] uppercase tracking-wide">
              <DoorOpen className="w-4 h-4 text-[#C9AA72]" />
              Dual Independent Architecture
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#252525] font-serif-heading">
              Need Hall 1, Hall 2, or Both? Book Exactly What Fits Your Event
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4A4A] max-w-2xl leading-relaxed">
              Each hall has its own independent entrance, banquet seating, dining wings, and dedicated kitchen facilities. Even if one hall is reserved, the other remains fully available for booking.
            </p>
          </div>
          <Button
            onClick={() => navigate('/availability')}
            variant="gold"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Check Live Availability
          </Button>
        </div>
      </section>

      {/* Halls Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {HALL_STRUCTURE.map((hall) => {
            const isHall1 = hall.id === 'hall_1';
            const hallPhoto = getPhotoUrl(isHall1 ? 'hall1' : 'hall2');

            return (
              <div
                key={hall.id}
                className="bg-white rounded-3xl border border-[#E2DACB] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row"
              >
                {/* Visual Image */}
                <div className="lg:w-1/2 relative bg-[#FAF8F5] min-h-[320px] lg:min-h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={hallPhoto || (isHall1 ? VENUE_DEFAULT_ASSETS.hallBlackGold : VENUE_DEFAULT_ASSETS.hallYellow)}
                    alt={`${hall.name} - ${isHall1 ? 'Black & Gold Seating Arrangement' : 'Yellow Seating Arrangement'}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-[#252525] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E2DACB] shadow-2xs">
                    {hall.name} &bull; {isHall1 ? 'Black & Gold Seating Arrangement' : 'Yellow Seating Arrangement'}
                  </div>
                </div>

                {/* Details */}
                <div className="lg:w-1/2 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-[#173D35] bg-[#F5F1E8] px-2.5 py-0.5 rounded border border-[#E2DACB]">
                        Independent Booking
                      </span>
                      <span className="text-xs text-[#737373]">Panemangalore Campus</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-[#252525] font-serif-heading">
                      {hall.displayName}
                    </h2>
                    <p className="text-sm text-[#4A4A4A] mt-2 leading-relaxed">
                      {hall.description}
                    </p>

                    {/* Official Pricing Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-sky-800">
                          <ThermometerSnowflake className="w-4 h-4 text-sky-600" />
                          <span>Single AC Hall</span>
                        </div>
                        <span className="text-xl font-bold text-[#252525] block mt-1">₹{hall.pricing.ac.toLocaleString()}.00</span>
                        <span className="text-[11px] text-[#737373]">Single Dining + Kitchen included</span>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <Wind className="w-4 h-4 text-emerald-600" />
                          <span>Single Non AC Hall</span>
                        </div>
                        <span className="text-xl font-bold text-[#252525] block mt-1">₹{hall.pricing.nonAc.toLocaleString()}.00</span>
                        <span className="text-[11px] text-[#737373]">Single Dining + Kitchen included</span>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-purple-800">
                          <ThermometerSnowflake className="w-4 h-4 text-purple-600" />
                          <span>Single AC (Double Dining)</span>
                        </div>
                        <span className="text-xl font-bold text-[#252525] block mt-1">₹{(hall.pricing.acWithDoubleDining ?? 45000).toLocaleString()}.00</span>
                        <span className="text-[11px] text-[#737373]">Double Dining + Kitchen</span>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                          <Wind className="w-4 h-4 text-amber-600" />
                          <span>Single Non AC (Double Dining)</span>
                        </div>
                        <span className="text-xl font-bold text-[#252525] block mt-1">₹{(hall.pricing.nonAcWithDoubleDining ?? 30000).toLocaleString()}.00</span>
                        <span className="text-[11px] text-[#737373]">Double Dining + Kitchen</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="mt-6 space-y-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-[#252525] block">
                        Included Facilities:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4A4A4A]">
                        {hall.features.map((feat, fidx) => (
                          <div key={fidx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Food Preparation Kitchen</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Independent Entrance &amp; Foyer</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
                      Kitchen Included in All Packages
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Button
                        onClick={() => navigate(`/availability?hall=${hall.id}`)}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto justify-center"
                      >
                        Check Dates
                      </Button>
                      <Button
                        onClick={() => navigate(`/book?hall=${hall.id}`)}
                        variant="gold"
                        size="sm"
                        className="w-full sm:w-auto justify-center"
                      >
                        Book {hall.name}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Combined Hall Card */}
          <div className="bg-gradient-to-br from-[#FFFDF9] via-[#F5F1E8] to-[#FFFDF9] rounded-3xl border border-[#E2DACB] p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="relative z-10 max-w-4xl space-y-6">
              <span className="text-xs uppercase font-bold tracking-widest text-[#173D35] bg-[#F5F1E8] px-3 py-1 rounded-full border border-[#E2DACB] inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#C9AA72]" />
                Grand Campus Reservation
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#252525] font-serif-heading">
                {COMBINED_PACKAGE.name}
              </h2>
              <p className="text-sm sm:text-base text-[#4A4A4A] leading-relaxed">
                Reserve the entire venue — Hall 1 and Hall 2 combined. Features dedicated Gents Hall &amp; Ladies Hall, Gents Dining &amp; Ladies Dining wings, and catering kitchens for mega celebrations and grand conventions up to 3,000 persons.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#E2DACB] shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-[#173D35] text-sm">
                    <ThermometerSnowflake className="w-4 h-4 text-[#C9AA72]" />
                    <span>Full AC Hall Package</span>
                  </div>
                  <span className="text-2xl font-bold text-[#252525] block mt-1">₹{COMBINED_PACKAGE.pricing.ac.toLocaleString()}.00</span>
                  <p className="text-xs text-[#737373] mt-1">
                    Gents &amp; Ladies Hall + Gents &amp; Ladies Dining + Kitchen
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E2DACB] shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                    <Wind className="w-4 h-4 text-emerald-600" />
                    <span>Full Non AC Hall Package</span>
                  </div>
                  <span className="text-2xl font-bold text-[#252525] block mt-1">₹{COMBINED_PACKAGE.pricing.nonAc.toLocaleString()}.00</span>
                  <p className="text-xs text-[#737373] mt-1">
                    Gents &amp; Ladies Hall + Gents &amp; Ladies Dining + Kitchen
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={() => navigate('/book?hall=both')}
                  variant="gold"
                  size="md"
                  className="w-full sm:w-auto justify-center"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Book Full Combined Venue
                </Button>
                <Button
                  onClick={() => navigate('/availability?hall=both')}
                  variant="outline"
                  size="md"
                  className="w-full sm:w-auto justify-center"
                >
                  Check Combined Dates
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
