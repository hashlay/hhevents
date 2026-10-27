import React from 'react';
import {
  CalendarDays,
  Building2,
  UtensilsCrossed,
  ArrowRight,
  PhoneCall,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Check,
  MessageCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { VENUE_INFO, TIMING_SLOTS } from '../../services/hallData';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';
import { VENUE_DEFAULT_ASSETS } from '../../services/photoStorage';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();
  const heroPhoto = getPhotoUrl('hero') || VENUE_DEFAULT_ASSETS.exterior;
  const mobileHeroPhoto = '/assets/venue/photos/HH_Events_Venue_Images/01_venue_exterior_mobile.webp';
  const hallBlackGoldPhoto = getPhotoUrl('hall1') || VENUE_DEFAULT_ASSETS.hallBlackGold;
  const hallYellowPhoto = getPhotoUrl('hall2') || VENUE_DEFAULT_ASSETS.hallYellow;
  const diningSeatingPhoto = getPhotoUrl('dining') || VENUE_DEFAULT_ASSETS.diningSeating;
  const diningOpenPhoto = getPhotoUrl('dining_open') || VENUE_DEFAULT_ASSETS.diningOpen;

  // Selected packages preview (from official tariff)
  const previewPackages = [
    {
      id: 'single-ac-hall',
      name: 'Single AC Hall',
      scope: 'Hall 1 or Hall 2 + Single Dining + Kitchen',
      capacity: 'Up to 600 Guests',
      rent: '₹30,000.00',
      features: [
        'Air-conditioned hall with stage dais',
        'Dedicated dining wing with seating tables',
        'Commercial catering kitchen included',
        'Full power backup generator',
      ],
      popular: true,
    },
    {
      id: 'full-ac-hall',
      name: 'Full Combined AC Hall',
      scope: 'Hall 1 + Hall 2 + Dual Dining Wings + Kitchen',
      capacity: 'Up to 3,000 Guests (Floating)',
      rent: '₹65,000.00',
      features: [
        'Complete venue campus (Gents & Ladies wings)',
        'Dual dining halls for seamless service',
        'Spacious commercial kitchen facility',
        'Dedicated green rooms & stage dais',
      ],
      popular: false,
    },
    {
      id: 'single-dining',
      name: 'Single Dining & Kitchen',
      scope: 'Single Dining Wing + Commercial Kitchen',
      capacity: 'Up to 350 Guests Dining Turnover',
      rent: '₹15,000.00',
      features: [
        'Independent feast dining area',
        'Equipped catering kitchen access',
        'Ideal for community meals & preparations',
        'Water stations & hygiene amenities',
      ],
      popular: false,
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-24 pb-20 bg-[#F5F1E8] text-[#252525]">
      {/* 1. HERO SECTION — DESKTOP VIEWPORT (Preserved with fixed contrast) */}
      <section className="hidden lg:block relative overflow-hidden bg-[#071512] text-white">
        {/* Full Photographic Background showing Real Building & Illuminated Signage */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroPhoto}
            alt="H H Events & Conventions Building Exterior with Illuminated Signage"
            className="w-full h-full object-cover object-right"
            loading="eager"
          />
          {/* Subtle Scrim: Gradient over left portion preserves text readability without obscuring the illuminated HH signage and entrance */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071512]/95 via-[#071512]/80 to-transparent lg:w-3/5" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#122E27]/90 backdrop-blur-md border border-[#C9AA72]/40 text-[#D9C194] text-xs font-semibold tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-[#C9AA72]" />
              <span>Opposite Juma Masjid, Panemangalore, Bantwal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] font-serif-heading drop-shadow-sm">
              A Beautiful Venue for Your Special Occasions
            </h1>

            <p className="text-base sm:text-lg text-[#F5F1E8]/90 leading-relaxed font-normal max-w-xl">
              Explore our event spaces, dining facilities, and hall packages in Panemangalore, Bantwal.
            </p>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                onClick={() => navigate('/availability')}
                variant="gold"
                size="lg"
                rightIcon={<CalendarDays className="w-4 h-4" />}
              >
                Check Availability
              </Button>

              <Button
                onClick={() => navigate('/pricing')}
                variant="outline-light"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Packages
              </Button>
            </div>

            {/* Coordinates Strip */}
            <div className="pt-4 border-t border-white/15 flex flex-wrap items-center gap-6 text-xs text-[#D9C194]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C9AA72]" />
                <span>Day Session (10 AM–3 PM) &bull; Evening Session (6 PM–10 PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#C9AA72]" />
                <span>Dual Independent Halls &bull; Commercial Kitchen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1b. DEDICATED CINEMATIC MOBILE & TABLET HERO (Matching Approved Design Reference) */}
      <section className="block lg:hidden relative overflow-hidden bg-[#071512] text-white min-h-[580px] sm:min-h-[640px] flex flex-col justify-between">
        {/* Full Photographic Background with Reference-Matched Mobile Framing */}
        <div className="absolute inset-0 z-0">
          <img
            src={mobileHeroPhoto}
            alt="H H Events & Conventions Building Exterior with Illuminated Signage"
            className="w-full h-full object-cover object-[center_30%] sm:object-center"
            loading="eager"
          />
          {/* Subtle Scrim for Pristine Text Readability: Focused on top-left text area without darkening the illuminated building & forecourt */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#071512]/80 via-[#071512]/30 to-transparent via-55%" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071512]/85 via-[#071512]/30 to-transparent w-full sm:w-4/5" />
          {/* Subtle Base Scrim for Floating Session Strip */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#071512]/70 via-transparent to-transparent" />
        </div>

        {/* Hero Content Area */}
        <div className="relative z-10 px-4 pt-7 pb-6 sm:px-6 sm:pt-11 max-w-xl">
          {/* Location Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D241F]/80 backdrop-blur-md border border-[#C9AA72]/50 text-[#D9C194] text-[11px] font-semibold tracking-wide shadow-xs mb-3.5">
            <MapPin className="w-3 h-3 text-[#C9AA72] shrink-0" />
            <span>Panemangalore, Bantwal</span>
          </div>

          {/* Luxury Serif Headline */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-[1.18] font-serif-heading drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            A Beautiful Venue <br />
            for Your <br />
            <span className="text-[#C9AA72]">Special Occasions</span>
          </h1>

          {/* Concise Supporting Description */}
          <p className="mt-3 text-xs sm:text-sm text-[#F5F1E8] leading-relaxed font-normal max-w-sm sm:max-w-md drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            Explore our event spaces, dining facilities, and hall packages in Panemangalore, Bantwal.
          </p>

          {/* Call to Actions (Matching Approved Reference Layout) */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-xs sm:max-w-none">
            <button
              type="button"
              onClick={() => navigate('/availability')}
              className="inline-flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9AA72] hover:bg-[#BA995F] text-[#173D35] font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#173D35]" />
                <span>Check Availability</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#173D35]" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-xs border border-white/30 hover:border-white/50 text-[#FAF8F5] font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Explore Packages</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/80" />
            </button>
          </div>
        </div>

        {/* 3-Column Session Information Strip (Floating Card matching Reference Layout) */}
        <div className="relative z-10 mx-3 mb-3.5 sm:mx-6 sm:mb-5 rounded-2xl border border-white/20 bg-[#091D17]/75 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-xl">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 divide-x divide-white/15 max-w-2xl mx-auto">
            {/* Item 1: Day Session */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2 min-w-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C9AA72] shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-white truncate leading-tight">Day Session</p>
                <p className="text-[8.5px] sm:text-[10.5px] text-[#D9C194] truncate leading-tight mt-0.5">10 AM – 3 PM</p>
              </div>
            </div>

            {/* Item 2: Evening Session */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 min-w-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C9AA72] shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-white truncate leading-tight">Evening Session</p>
                <p className="text-[8.5px] sm:text-[10.5px] text-[#D9C194] truncate leading-tight mt-0.5">6 PM – 10 PM</p>
              </div>
            </div>

            {/* Item 3: Dual Independent */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 min-w-0">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C9AA72] shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-white truncate leading-tight">Dual Independent</p>
                <p className="text-[8.5px] sm:text-[10.5px] text-[#D9C194] truncate leading-tight mt-0.5">Halls &bull; Kitchen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VENUE INTRODUCTION — Honest Campus Architecture (Matching Reference Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E2DACB] p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">
                About The Venue
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#173D35]">
                Built for Memorable Gatherings
              </h2>
            </div>
            <button
              onClick={() => navigate('/about')}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E2DACB] text-xs font-semibold text-[#252525] hover:text-[#173D35] transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              <span>Learn More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed space-y-3">
            <p>
              <strong>H H Events &amp; Conventions</strong> is designed to offer maximum flexibility for families and event organizers. Our architecture allows Hall 1 and Hall 2 to be booked independently for intimate gatherings or combined seamlessly into a grand venue for up to 3,000 floating guests.
            </p>
            <p>
              Every package includes dedicated dining facilities and access to an equipped commercial catering kitchen, ensuring your event operations run smoothly from arrival to feast.
            </p>
          </div>
        </div>
      </section>

      {/* 3. EVENT SPACES — Balanced Showcase (Matching Reference Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-[#E2DACB] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">
              Event Spaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#252525] mt-0.5">
              Our Event Halls
            </h2>
          </div>
          <button
            onClick={() => navigate('/halls')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E2DACB] text-xs font-semibold text-[#252525] hover:text-[#173D35] transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <span>View All Halls</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Event Hall — Black & Gold Seating (Image 02) */}
          <Card className="overflow-hidden border-[#E2DACB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="relative aspect-16/9 bg-[#FAF8F5] overflow-hidden">
                <img
                  src={hallBlackGoldPhoto}
                  alt="Event Hall with Black and Gold Seating Arrangement"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-[#173D35]/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs">
                  Event Hall
                </div>
              </div>

              <div className="p-6 space-y-2">
                <h3 className="text-xl font-bold font-serif-heading text-[#173D35]">
                  Event Hall — Black &amp; Gold Seating
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                  Real indoor event hall configuration with banquet seating in black-and-gold covers, central processional aisle, overhead lighting, and decorated stage dais.
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => navigate('/halls')}
              >
                View Hall Details &rarr;
              </Button>
            </div>
          </Card>

          {/* Card 2: Event Hall — Yellow Seating Arrangement (Image 03) */}
          <Card className="overflow-hidden border-[#E2DACB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="relative aspect-16/9 bg-[#FAF8F5] overflow-hidden">
                <img
                  src={hallYellowPhoto}
                  alt="Event Hall with Yellow Seating Arrangement"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-[#173D35]/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs">
                  Event Hall
                </div>
              </div>

              <div className="p-6 space-y-2">
                <h3 className="text-xl font-bold font-serif-heading text-[#173D35]">
                  Event Hall — Yellow Seating Arrangement
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                  Real indoor event hall arrangement featuring custom yellow H H Events-branded chair covers, central processional aisle, and decorated ceremony dais.
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => navigate('/halls')}
              >
                View Hall Details &rarr;
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. DINING FACILITIES PREVIEW — Authentic Dining Areas (Images 05 & 06) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DACB] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C9AA72]">
              Dining &amp; Feasting
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#252525] mt-1">
              Dining Facilities
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/facilities')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Explore All Facilities
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Dining Area (Image 05) */}
          <Card className="overflow-hidden border-[#E2DACB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="relative aspect-16/9 bg-[#FAF8F5] overflow-hidden">
                <img
                  src={diningSeatingPhoto}
                  alt="Authentic Covered Dining Area with Seating"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-[#173D35]/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs">
                  Dining Wing
                </div>
              </div>

              <div className="p-6 space-y-2">
                <h3 className="text-xl font-bold font-serif-heading text-[#173D35]">
                  Dining Area
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                  Authentic covered dining facility featuring organized dining tables, red-and-black chairs, high ceiling fans, and natural cross-ventilation for comfortable meal service.
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => navigate('/facilities')}
              >
                Facility Details &rarr;
              </Button>
            </div>
          </Card>

          {/* Card 2: Covered Dining & Service Area (Image 06) */}
          <Card className="overflow-hidden border-[#E2DACB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="relative aspect-16/9 bg-[#FAF8F5] overflow-hidden">
                <img
                  src={diningOpenPhoto}
                  alt="Covered Dining & Service Area"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-[#173D35]/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs">
                  Multi-Purpose Wing
                </div>
              </div>

              <div className="p-6 space-y-2">
                <h3 className="text-xl font-bold font-serif-heading text-[#173D35]">
                  Covered Dining &amp; Service Area
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                  Spacious covered area with tiled flooring, stainless-steel food service counters, high-capacity ceiling fans, and flexible catering turnover space.
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={() => navigate('/facilities')}
              >
                Facility Details &rarr;
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. PACKAGES PREVIEW — Official Tariffs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DACB] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C9AA72]">
              Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#252525] mt-1">
              Popular Hall Packages
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pricing')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All 8 Tariffs
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`p-6 flex flex-col justify-between ${
                pkg.popular ? 'border-[#C9AA72] shadow-sm' : 'border-[#E2DACB]'
              }`}
            >
              <div className="space-y-4">
                <div>
                  {pkg.popular && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#173D35] text-white inline-block mb-2">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold font-serif-heading text-[#173D35]">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-[#737373] mt-1">{pkg.scope}</p>
                </div>

                <div className="py-2 border-y border-[#E2DACB]/60">
                  <span className="text-2xl font-bold font-mono text-[#252525]">
                    {pkg.rent}
                  </span>
                  <span className="text-xs text-[#737373] block mt-0.5">
                    Per Session ({pkg.capacity})
                  </span>
                </div>

                <ul className="text-xs text-[#4A4A4A] space-y-2">
                  {pkg.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  variant={pkg.popular ? 'gold' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/book')}
                >
                  Reserve This Package
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. LOCATION & CONTACT COORDINATES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-[#E2DACB] p-8 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C9AA72]">
                Location &amp; Visiting
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#173D35]">
                Easily Accessible in Panemangalore
              </h2>
              <p className="text-sm text-[#4A4A4A] leading-relaxed">
                Located conveniently opposite Juma Masjid in Akkarangadi, Panemangalore, Bantwal. With straightforward highway connectivity, direct vehicular access, and parking for your guests.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                <a
                  href={`tel:${VENUE_INFO.primaryPhone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#173D35] text-white font-semibold hover:bg-[#0F2722] transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C9AA72]" />
                  <span>Call {VENUE_INFO.primaryPhone}</span>
                </a>

                <a
                  href={`https://wa.me/91${VENUE_INFO.whatsappPhone}?text=${encodeURIComponent('Hello H H Events Management, I would like to inquire about hall availability.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                  <span>WhatsApp {VENUE_INFO.whatsappPhone}</span>
                </a>

                <a
                  href={VENUE_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E2DACB] text-[#252525] font-semibold hover:bg-[#F5F1E8] transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C9AA72]" />
                  <span>Google Maps Directions</span>
                  <ExternalLink className="w-3 h-3 text-[#737373]" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] space-y-3 text-xs">
              <div className="font-bold text-sm text-[#252525] font-serif-heading">Session Hours</div>
              <div className="space-y-2 text-[#4A4A4A]">
                <div className="flex justify-between py-1 border-b border-[#E2DACB]/60">
                  <span className="font-medium">Day Session:</span>
                  <span>10:00 AM – 3:00 PM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2DACB]/60">
                  <span className="font-medium">Evening Session:</span>
                  <span>6:00 PM – 10:00 PM</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Venue Inquiries:</span>
                  <span>Daily 9:00 AM – 8:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
