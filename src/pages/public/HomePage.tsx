import React, { useState } from 'react';
import {
  CalendarDays,
  Building2,
  Utensils,
  Zap,
  ShieldCheck,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  Car,
  ThermometerSnowflake,
  Wind,
  PhoneCall,
  MapPin,
  ExternalLink,
  Camera,
  Users,
  UtensilsCrossed,
  MessageCircle,
  ChevronRight,
  Calculator,
  Search,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { AvailabilityCalendar } from '../../components/calendar/AvailabilityCalendar';
import {
  HALL_STRUCTURE,
  VENUE_INFO,
  TIMING_SLOTS,
  GALLERY_ITEMS,
  COMBINED_PACKAGE,
  OFFICIAL_TARIFF_PACKAGES,
} from '../../services/hallData';
import { checkSlotAvailability } from '../../services/bookingStorage';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';
import { HallId, SlotType } from '../../types';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();
  const heroPhoto = getPhotoUrl('hero') || getPhotoUrl('hall1');

  // Interactive Guest-Count & Room Finder (Signature Banquet Hall Pro feature)
  const [guestCount, setGuestCount] = useState<number>(400);
  const [eventType, setEventType] = useState<string>('Wedding & Reception');
  const [acPreference, setAcPreference] = useState<'ac' | 'nonAc'>('ac');

  // Quick Availability Checker
  const [quickHall, setQuickHall] = useState<HallId>('hall_1');
  const [quickDate, setQuickDate] = useState<string>(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [quickSlot, setQuickSlot] = useState<SlotType>('day');
  const [checkResult, setCheckResult] = useState<{ available: boolean; conflictReason?: string } | null>(null);

  // Gallery Active Category
  const [galleryCategory, setGalleryCategory] = useState<string>('All');

  const handleQuickCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const res = checkSlotAvailability(quickHall, quickDate, quickSlot);
    setCheckResult(res);
  };

  // Determine recommended hall based on guest count & AC preference
  const getRecommendation = () => {
    if (guestCount > 800) {
      return {
        hallId: 'both' as HallId,
        packageId: acPreference === 'ac' ? 'full-ac-hall' : 'full-non-ac-hall',
        title: 'Combined Grand Campus (Hall 1 + Hall 2)',
        capacity: 'Up to 3,000 Persons',
        dining: 'Gents & Ladies Dining Wings (Combined)',
        price: acPreference === 'ac' ? '₹65,000.00' : '₹45,000.00',
        plan: acPreference === 'ac' ? 'Full AC Hall Package' : 'Full Non AC Hall Package',
        features: ['Gents Hall & Ladies Hall', 'Dual Feast Dining Halls', 'Kitchen Facilities Included'],
      };
    } else if (guestCount > 400) {
      return {
        hallId: 'hall_1' as HallId,
        packageId: acPreference === 'ac' ? 'single-ac-hall-ii' : 'single-non-ac-hall-ii',
        title: 'Single Hall (Double Dining Wing)',
        capacity: '400 – 800 Persons',
        dining: 'Double Dining Wings + Stage',
        price: acPreference === 'ac' ? '₹45,000.00' : '₹30,000.00',
        plan: acPreference === 'ac' ? 'Single AC (Double Dining)' : 'Single Non AC (Double Dining)',
        features: ['Extended Feast Turnout', 'Double Dining Space', 'Kitchen Included'],
      };
    } else {
      return {
        hallId: 'hall_1' as HallId,
        packageId: acPreference === 'ac' ? 'single-ac-hall' : 'single-non-ac-hall',
        title: 'Single Hall 1 or Hall 2',
        capacity: 'Up to 500 Persons',
        dining: 'Single Dedicated Dining Wing',
        price: acPreference === 'ac' ? '₹30,000.00' : '₹25,000.00',
        plan: acPreference === 'ac' ? 'Single AC Hall Package' : 'Single Non AC Hall Package',
        features: ['Main Convention Hall', 'Dedicated Dining Wing', 'Kitchen Included'],
      };
    }
  };

  const recommendation = getRecommendation();

  const filteredGallery =
    galleryCategory === 'All'
      ? GALLERY_ITEMS.slice(0, 6)
      : GALLERY_ITEMS.filter((g) => g.category.toLowerCase() === galleryCategory.toLowerCase()).slice(0, 6);

  return (
    <div className="space-y-20 pb-20 bg-[#FDFBF9] text-[#161210]">
      {/* 1. HERO SECTION — Banquet Hall Pro Light Aesthetic */}
      <section className="relative bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#F6F5F4] border-b border-[#E8E5E1] pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF2E4] border border-[#E8D7BE] text-[#9A6611] text-xs font-semibold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-[#C88D23]" />
                Premier Banquet Hall &bull; Panemangalore, Bantwal
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#161210] leading-[1.12] font-serif-heading">
                Celebrate Life's Grandest Moments in <span className="text-[#C88D23]">Timeless Elegance</span>
              </h1>

              <p className="text-base sm:text-lg text-[#58453E] leading-relaxed max-w-2xl">
                Welcome to <strong>H H Events &amp; Conventions</strong>, Bantwal's premier banquet facility. Featuring two independently bookable halls — <strong>Hall 1</strong> and <strong>Hall 2</strong> — with dedicated feast dining wings and full commercial kitchen facilities included in all official packages.
              </p>

              {/* Verified Venue USPs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#E8E5E1] shadow-2xs">
                  <span className="font-bold text-[#161210] block text-sm">Dual Halls</span>
                  <span className="text-[#7E7873]">Independent Ingress</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E8E5E1] shadow-2xs">
                  <span className="font-bold text-[#161210] block text-sm">Kitchen Included</span>
                  <span className="text-[#7E7873]">In All 8 Packages</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E8E5E1] shadow-2xs col-span-2 sm:col-span-1">
                  <span className="font-bold text-[#161210] block text-sm">Up to 3,000</span>
                  <span className="text-[#7E7873]">Combined Guests</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <Button
                  onClick={() => navigate('/availability')}
                  variant="gold"
                  size="lg"
                  rightIcon={<CalendarDays className="w-5 h-5" />}
                >
                  Check Live Availability
                </Button>
                <Button
                  onClick={() => navigate('/halls')}
                  variant="outline"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Halls &amp; Tariff
                </Button>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-[#7E7873]">
                <MapPin className="w-4 h-4 text-[#C88D23]" />
                <span>Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal 574231</span>
              </div>
            </div>

            {/* Right: Authentic Photograph Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden bg-white border border-[#E8E5E1] shadow-lg p-2.5">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#FAF8F5]">
                  {heroPhoto ? (
                    <img
                      src={heroPhoto}
                      alt="H H Events & Conventions Grand Hall Interior"
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#7E7873]">
                      <Building2 className="w-12 h-12 text-[#C88D23] mb-2" />
                      <span className="font-bold text-[#161210]">Grand Convention Hall</span>
                      <span className="text-xs">Panemangalore Campus</span>
                    </div>
                  )}

                  {/* Corner Badges */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-[#E8E5E1] text-[11px] font-bold text-[#161210] shadow-xs">
                    OFFICIAL VENUE PHOTO
                  </div>

                  <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-[#161210]/90 backdrop-blur-md text-[11px] font-bold text-[#DFAB4C] shadow-xs">
                    Hall 1 &bull; Air Conditioned
                  </div>
                </div>

                {/* Micro info strip */}
                <div className="p-3.5 flex items-center justify-between text-xs text-[#58453E]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">Direct Online Booking Verified</span>
                  </div>
                  <button
                    onClick={() => navigate('/gallery')}
                    className="font-semibold text-[#C88D23] hover:underline"
                  >
                    View 15 Photos &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SIGNATURE BANQUET HALL PRO: GUEST-COUNT & ROOM FINDER WIDGET */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl border border-[#E8E5E1] shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0ECE7] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#C88D23] uppercase tracking-wider mb-1">
                <Calculator className="w-4 h-4" />
                <span>Interactive Venue Matcher</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
                Find the Perfect Hall &amp; Capacity
              </h2>
              <p className="text-xs sm:text-sm text-[#58453E]">
                Select your party size and preferences to view the optimal hall setup, capacity, and official tariff.
              </p>
            </div>

            <div className="text-xs text-[#7E7873] bg-[#FAF8F5] px-3.5 py-1.5 rounded-full border border-[#E8E5E1] w-fit">
              Dual Halls Can Be Booked Separately or Combined
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Event Type */}
              <div>
                <label className="block text-xs font-bold text-[#161210] uppercase tracking-wider mb-2">
                  Select Event Occasion
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Wedding & Reception',
                    'Nikah Ceremony',
                    'Engagement / Haldi',
                    'Corporate / Convention',
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEventType(type)}
                      className={`p-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                        eventType === type
                          ? 'bg-[#FAF2E4] border-[#EAD8BF] text-[#9A6611] font-bold shadow-2xs'
                          : 'bg-[#FAF8F5] border-[#E8E5E1] text-[#58453E] hover:bg-[#F3EFE9]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Count Slider & Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#161210] uppercase tracking-wider">
                    Expected Guest Count
                  </label>
                  <span className="text-base font-bold text-[#C88D23]">
                    {guestCount.toLocaleString()} Guests
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2500"
                  step="50"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full accent-[#C88D23] h-2 bg-[#F0ECE7] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#7E7873] mt-1.5">
                  <span>100 (Intimate)</span>
                  <span>500 (Single Hall)</span>
                  <span>1,000 (Double Dining)</span>
                  <span>2,500+ (Grand Combined)</span>
                </div>
              </div>

              {/* Climate Selection */}
              <div>
                <label className="block text-xs font-bold text-[#161210] uppercase tracking-wider mb-2">
                  Air Conditioning Configuration
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAcPreference('ac')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      acPreference === 'ac'
                        ? 'bg-[#FAF2E4] border-[#EAD8BF] text-[#9A6611] font-bold shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#E8E5E1] text-[#58453E] hover:bg-[#F3EFE9]'
                    }`}
                  >
                    <ThermometerSnowflake className="w-4 h-4 text-sky-600" />
                    <span>Air Conditioned (AC Hall)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAcPreference('nonAc')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      acPreference === 'nonAc'
                        ? 'bg-[#FAF2E4] border-[#EAD8BF] text-[#9A6611] font-bold shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#E8E5E1] text-[#58453E] hover:bg-[#F3EFE9]'
                    }`}
                  >
                    <Wind className="w-4 h-4 text-emerald-600" />
                    <span>Natural Ventilation (Non AC)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recommendation Result Box */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#FFFDF9] to-[#FAF4EA] border border-[#EAD8BF] rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A6611] bg-[#FAF2E4] px-2.5 py-1 rounded-full border border-[#E8D7BE]">
                  Recommended Match
                </span>
                <span className="text-xs text-[#7E7873]">Schedule: Sun, Mon &amp; Thu</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#161210] font-serif-heading">
                  {recommendation.title}
                </h3>
                <p className="text-xs text-[#58453E] mt-1">{recommendation.plan}</p>
              </div>

              <div className="pt-2 border-t border-[#E8D7BE]/70 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#7E7873] block">Official Package Rent</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#C88D23]">
                    {recommendation.price}
                  </span>
                </div>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Kitchen Included
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-[#58453E]">
                {recommendation.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center gap-3">
                <Button
                  onClick={() => navigate(`/book?hall=${recommendation.hallId}`)}
                  variant="gold"
                  size="md"
                  className="flex-1"
                >
                  Book This Setup
                </Button>
                <Button
                  onClick={() => navigate(`/availability?hall=${recommendation.hallId}`)}
                  variant="outline"
                  size="md"
                >
                  Check Dates
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DUAL INDEPENDENT HALL SPACES (Hall 1 & Hall 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C88D23] uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Venue Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#161210] font-serif-heading">
            Dual Independent Convention Halls
          </h2>
          <p className="text-sm sm:text-base text-[#58453E] leading-relaxed">
            H H Events &amp; Conventions is engineered with two distinct halls that can be booked independently or combined together. Each hall features private guest foyers, banquet seating, dedicated feast dining wings, and complete kitchen facilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {HALL_STRUCTURE.map((hall) => {
            const isHall1 = hall.id === 'hall_1';
            const hallPhoto = getPhotoUrl(isHall1 ? 'hall1' : 'hall2');

            return (
              <div
                key={hall.id}
                className="bg-white rounded-2xl border border-[#E8E5E1] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Photo Header */}
                <div className="relative h-64 bg-[#FAF8F5] overflow-hidden">
                  {hallPhoto ? (
                    <img
                      src={hallPhoto}
                      alt={hall.name}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#7E7873]">
                      <Building2 className="w-12 h-12 text-[#C88D23] mb-2" />
                      <span className="font-bold text-[#161210]">{hall.name}</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-[#161210] shadow-2xs border border-[#E8E5E1]">
                    {hall.name} &bull; INDEPENDENT WING
                  </div>

                  <div className="absolute bottom-3 right-3 bg-[#161210]/90 text-white px-3 py-1 rounded-lg text-xs font-bold">
                    From ₹{hall.pricing.nonAc.toLocaleString()}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-[#161210] font-serif-heading">
                        {hall.displayName}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#58453E] mt-1 leading-relaxed">
                        {hall.description}
                      </p>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E5E1]">
                        <span className="text-[11px] font-semibold text-sky-700 flex items-center gap-1">
                          <ThermometerSnowflake className="w-3.5 h-3.5" /> AC Package
                        </span>
                        <span className="text-xl font-bold text-[#161210] block mt-1">
                          ₹{hall.pricing.ac.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#7E7873]">Dining + Kitchen Included</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E5E1]">
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5" /> Non AC Package
                        </span>
                        <span className="text-xl font-bold text-[#161210] block mt-1">
                          ₹{hall.pricing.nonAc.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#7E7873]">Dining + Kitchen Included</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-[#161210] uppercase tracking-wider block">
                        Included Facilities:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#58453E]">
                        {hall.features.slice(0, 4).map((feat, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 border-t border-[#F0ECE7] flex items-center justify-between gap-3">
                    <Button
                      onClick={() => navigate(`/availability?hall=${hall.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      Check Dates
                    </Button>
                    <Button
                      onClick={() => navigate(`/book?hall=${hall.id}`)}
                      variant="gold"
                      size="sm"
                    >
                      Book {hall.name}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Combined Hall Full Campus Banner */}
        <div className="bg-gradient-to-r from-[#FFFDF9] via-[#FAF4EA] to-[#FFFDF9] rounded-2xl border border-[#EAD8BF] p-6 sm:p-10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A6611] bg-[#FAF2E4] px-3 py-1 rounded-full border border-[#E8D7BE] inline-block">
              Grand Mega Conventions &bull; Combined Campus
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
              {COMBINED_PACKAGE.name}
            </h3>
            <p className="text-xs sm:text-sm text-[#58453E] leading-relaxed">
              Reserve both Hall 1 and Hall 2 simultaneously. Provides dedicated Gents Hall &amp; Ladies Hall, Gents Dining &amp; Ladies Dining wings, and high-capacity food preparation kitchens for events up to 3,000 persons.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
              <span className="text-[#161210]">Full AC: ₹65,000.00</span>
              <span className="text-[#7E7873]">&bull;</span>
              <span className="text-[#161210]">Full Non AC: ₹45,000.00</span>
              <span className="text-[#7E7873]">&bull;</span>
              <span className="text-emerald-700">All Kitchens Included</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => navigate('/book?package=full-ac-hall')}
              variant="gold"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Book Full Combined Venue
            </Button>
            <Button
              onClick={() => navigate('/availability?hall=both')}
              variant="outline"
              size="md"
            >
              Check Combined Dates
            </Button>
          </div>
        </div>
      </section>

      {/* 4. OFFICIAL TARIFF & PACKAGES PREVIEW */}
      <section className="bg-[#FAF8F5] py-16 border-y border-[#E8E5E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#C88D23] uppercase tracking-wider">
                Official Tariff Schedule
              </span>
              <h2 className="text-3xl font-bold text-[#161210] font-serif-heading mt-1">
                Transparent Official Packages
              </h2>
              <p className="text-xs sm:text-sm text-[#58453E] mt-1">
                Official schedule (All Sunday, Monday &amp; Thursday) with food preparation kitchen included in all packages.
              </p>
            </div>

            <Button
              onClick={() => navigate('/pricing')}
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All 8 Tariff Packages
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {OFFICIAL_TARIFF_PACKAGES.slice(0, 4).map((pkg, i) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-[#E8E5E1] p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#7E7873]">Package #{i + 1}</span>
                    <span className="font-semibold text-[#9A6611] bg-[#FAF2E4] px-2 py-0.5 rounded border border-[#E8D7BE]">
                      {pkg.acType}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#161210] font-serif-heading">
                    {pkg.package}
                  </h3>

                  <p className="text-xs text-[#58453E] leading-relaxed">
                    {pkg.details}
                  </p>

                  <div className="pt-2 border-t border-[#F0ECE7]">
                    <span className="text-[11px] text-[#7E7873] block uppercase tracking-wider">Rent</span>
                    <span className="text-2xl font-black text-[#C88D23]">
                      ₹{pkg.rentFormatted}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F0ECE7] mt-4">
                  <Button
                    onClick={() => navigate('/book')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                  >
                    Select Package
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LIVE AVAILABILITY CALENDAR SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#C88D23] uppercase tracking-wider">
            Live Reservation Status
          </span>
          <h2 className="text-3xl font-bold text-[#161210] font-serif-heading">
            Check Live Dates &amp; Sessions
          </h2>
          <p className="text-xs sm:text-sm text-[#58453E]">
            Inspect Day (10:00 AM – 3:00 PM) and Evening (6:00 PM – 10:00 PM) availability across Hall 1, Hall 2, and Combined Venue.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E8E5E1] shadow-md p-6 sm:p-10">
          <AvailabilityCalendar
            selectedDate={quickDate}
            onSelectDate={(d) => setQuickDate(d)}
            onBookSlot={(hall, date, slot) => {
              navigate(`/book?hall=${hall}&date=${date}&slot=${slot}`);
            }}
          />
        </div>
      </section>

      {/* 6. WHY CHOOSE H H EVENTS (BANQUET PRO ADVANTAGES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#C88D23] uppercase tracking-wider">
            The Venue Advantage
          </span>
          <h2 className="text-3xl font-bold text-[#161210] font-serif-heading">
            Engineered For Seamless Celebrations
          </h2>
          <p className="text-xs sm:text-sm text-[#58453E]">
            Designed by experienced event logistics professionals to guarantee comfort, dignity, and efficiency for hosts and guests alike.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E5E1] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2E4] border border-[#E3D1B5] flex items-center justify-center text-[#C88D23]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#161210]">Independent Dual Entrances</h3>
            <p className="text-xs text-[#58453E] leading-relaxed">
              Hall 1 and Hall 2 have completely separate egress and foyer spaces, allowing concurrent events with zero guest crossover or acoustic bleed.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E5E1] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2E4] border border-[#E3D1B5] flex items-center justify-center text-[#C88D23]">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#161210]">Dedicated Dining Wings</h3>
            <p className="text-xs text-[#58453E] leading-relaxed">
              Choose between Single Dining and Double Dining options. Perfectly configured for both traditional banana-leaf dining and modern buffet presentations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E5E1] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2E4] border border-[#E3D1B5] flex items-center justify-center text-[#C88D23]">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#161210]">Commercial Kitchens Included</h3>
            <p className="text-xs text-[#58453E] leading-relaxed">
              Complete food preparation kitchens with heavy water connections and ventilation are included in all 8 packages without surcharge.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E5E1] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2E4] border border-[#E3D1B5] flex items-center justify-center text-[#C88D23]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#161210]">100% Generator Backup</h3>
            <p className="text-xs text-[#58453E] leading-relaxed">
              Industrial diesel generator provides instantaneous failover power for high-capacity air conditioning, stage lighting, and sound systems.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E5E1] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2E4] border border-[#E3D1B5] flex items-center justify-center text-[#C88D23]">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#161210]">Extensive Parking with Ramp Access</h3>
            <p className="text-xs text-[#58453E] leading-relaxed">
              Dedicated vehicle parking bays directly off the highway with barrier-free wheelchair accessibility for elder family members.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E5E1] shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF2E4] border border-[#E3D1B5] flex items-center justify-center text-[#C88D23]">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#161210]">Prime Highway Location</h3>
            <p className="text-xs text-[#58453E] leading-relaxed">
              Located directly Opposite Juma Masjid, Akkarangadi, Panemangalore with effortless highway access from Bantwal, Mangalore, and BC Road.
            </p>
          </div>
        </div>
      </section>

      {/* 7. AUTHENTIC GALLERY PREVIEW */}
      <section className="bg-[#FAF8F5] py-16 border-y border-[#E8E5E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#C88D23] uppercase tracking-wider">
                Visual Showcase
              </span>
              <h2 className="text-3xl font-bold text-[#161210] font-serif-heading mt-1">
                Authentic Venue Photographs
              </h2>
              <p className="text-xs sm:text-sm text-[#58453E] mt-1">
                Authentic photographs of the main convention hall, dining wings, and entrance courtyard.
              </p>
            </div>

            <Button
              onClick={() => navigate('/gallery')}
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Explore Full 15-Photo Gallery
            </Button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Main Hall', 'Dining Wings', 'Stage & Dais', 'Exterior'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setGalleryCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  galleryCategory === cat
                    ? 'bg-[#C88D23] text-white shadow-2xs'
                    : 'bg-white border border-[#E8E5E1] text-[#58453E] hover:bg-[#F3EFE9]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => {
              const photoUrl = getPhotoUrl(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => navigate('/gallery')}
                  className="group bg-white rounded-2xl border border-[#E8E5E1] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="relative aspect-4/3 bg-[#FAF8F5] overflow-hidden">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-[#7E7873]">
                        <Camera className="w-8 h-8 text-[#C88D23] mb-2" />
                        <span className="text-xs font-bold">{item.title}</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-[#161210]">
                      {item.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-[#161210] group-hover:text-[#C88D23] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#7E7873] mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CLIENT TESTIMONIALS (Signature Banquet Hall Pro Component) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#C88D23] uppercase tracking-wider">
            Host Testimonials
          </span>
          <h2 className="text-3xl font-bold text-[#161210] font-serif-heading">
            Cherished Experiences at H H Events
          </h2>
          <p className="text-xs sm:text-sm text-[#58453E]">
            Feedback from families and organizers who celebrated their milestone moments at our venue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E5E1] shadow-2xs space-y-4 flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-[#58453E] leading-relaxed italic">
              "We hosted our daughter's wedding and reception here with 1,200 guests. The dual hall configuration and independent dining wings meant food service was exceptionally smooth with zero bottleneck."
            </p>
            <div className="border-t border-[#F0ECE7] pt-3">
              <span className="font-bold text-sm text-[#161210] block">Abdul Rahman &amp; Family</span>
              <span className="text-xs text-[#7E7873]">Wedding Host &bull; Panemangalore</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E5E1] shadow-2xs space-y-4 flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-[#58453E] leading-relaxed italic">
              "The air conditioning was powerful throughout our afternoon event in April. Kitchen facilities were spacious and clean for our catering team, and parking for 100+ cars made guest arrival effortless."
            </p>
            <div className="border-t border-[#F0ECE7] pt-3">
              <span className="font-bold text-sm text-[#161210] block">K. Suresh Shetty</span>
              <span className="text-xs text-[#7E7873]">Reception Host &bull; BC Road</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E5E1] shadow-2xs space-y-4 flex flex-col justify-between">
            <p className="text-xs sm:text-sm text-[#58453E] leading-relaxed italic">
              "Transparent pricing with no hidden charges. Having kitchen access included in the package rent saved us significant extra costs compared to other halls in Bantwal."
            </p>
            <div className="border-t border-[#F0ECE7] pt-3">
              <span className="font-bold text-sm text-[#161210] block">Mohammed Haneef</span>
              <span className="text-xs text-[#7E7873]">Family Nikah &bull; Panemangalore</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAST BOOKING INQUIRY CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#161210] text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <span className="text-xs font-bold text-[#DFAB4C] uppercase tracking-wider">
              Reserve Your Date
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif-heading">
              Plan Your Celebration with Our Management Team
            </h2>
            <p className="text-xs sm:text-sm text-[#A8A29E] leading-relaxed">
              Book online instantly or speak directly with our venue liaison desk for dates, walkthrough appointments, and custom arrangements.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
            <Button
              onClick={() => navigate('/book')}
              variant="gold"
              size="lg"
              rightIcon={<CalendarDays className="w-5 h-5" />}
            >
              Book Hall Online
            </Button>
            <a
              href={`tel:${VENUE_INFO.primaryPhone}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base transition-colors border border-white/20"
            >
              <PhoneCall className="w-5 h-5 text-[#DFAB4C]" />
              <span>{VENUE_INFO.primaryPhone}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
