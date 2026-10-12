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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { VENUE_INFO, TIMING_SLOTS } from '../../services/hallData';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();
  const heroPhoto = getPhotoUrl('hero') || getPhotoUrl('hall1');

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
      {/* 1. HERO SECTION — Clean, Photographic & Elegant */}
      <section className="relative pt-8 sm:pt-12 lg:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2DACB] text-[#173D35] text-xs font-semibold tracking-wide">
                <span>Opposite Juma Masjid, Panemangalore</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#252525] leading-[1.15] font-serif-heading">
                A Beautiful Venue for Your Special Occasions
              </h1>

              <p className="text-base sm:text-lg text-[#4A4A4A] leading-relaxed max-w-2xl font-normal">
                Discover our event spaces and find the right hall package for your celebration. Featuring two independently bookable halls, dedicated feast dining wings, and fully equipped commercial kitchen facilities.
              </p>

              {/* Call to Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
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
                  variant="outline"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Packages
                </Button>
              </div>

              {/* Operating Coordinates */}
              <div className="pt-3 border-t border-[#E2DACB]/80 flex flex-wrap items-center gap-6 text-xs text-[#737373]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#C9AA72]" />
                  <span>Akkarangadi, Panemangalore, Bantwal 574231</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#C9AA72]" />
                  <span>Day (10 AM–3 PM) &bull; Evening (6 PM–10 PM)</span>
                </div>
              </div>
            </div>

            {/* Right: Venue Photograph Frame */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden bg-white border border-[#E2DACB] shadow-sm p-3">
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#FAF8F5]">
                  {heroPhoto ? (
                    <img
                      src={heroPhoto}
                      alt="H H Events & Conventions Grand Hall Interior"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#737373]">
                      <div className="w-12 h-12 rounded-xl bg-[#F5F1E8] border border-[#E2DACB] flex items-center justify-center text-[#173D35] mb-3">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-[#252525] text-base font-serif-heading">H H Events &amp; Conventions</span>
                      <span className="text-xs text-[#737373] mt-1 max-w-xs">
                        Official Panemangalore Venue Campus &bull; Hall 1 &amp; Hall 2
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-[#173D35]/90 text-white text-[11px] font-medium backdrop-blur-xs">
                    Air-Conditioned &bull; Multi-Space Facility
                  </div>
                </div>

                <div className="pt-3 px-1 flex items-center justify-between text-xs text-[#4A4A4A]">
                  <span>Opposite Juma Masjid, Bantwal</span>
                  <button
                    type="button"
                    onClick={() => navigate('/gallery')}
                    className="font-semibold text-[#173D35] hover:underline"
                  >
                    View Gallery &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. VENUE INTRODUCTION — Clear, Honest Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-[#E2DACB] p-8 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C9AA72]">
                About The Venue
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#173D35]">
                Built for Memorable Gatherings
              </h2>
            </div>

            <div className="lg:col-span-8 text-sm text-[#4A4A4A] leading-relaxed space-y-3">
              <p>
                <strong>H H Events &amp; Conventions</strong> is designed to offer maximum flexibility for families and event organizers. Our architecture allows Hall 1 and Hall 2 to be booked independently for intimate gatherings or combined seamlessly into a grand venue for up to 3,000 floating guests.
              </p>
              <p>
                Every package includes dedicated dining facilities and access to an equipped commercial catering kitchen, ensuring your event operations run smoothly from arrival to feast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HALL SPACES & FACILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DACB] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C9AA72]">
              Configurable Spaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-[#252525] mt-1">
              Event Spaces &amp; Capacity
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/halls')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Detailed Hall Specs
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hall 1 */}
          <Card className="p-6 space-y-4 hover:border-[#C9AA72] transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#737373]">Section A</span>
              <h3 className="text-xl font-bold font-serif-heading text-[#173D35]">Hall 1</h3>
              <p className="text-xs text-[#737373]">Single independent hall wing with dining and kitchen</p>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl text-xs space-y-1.5 border border-[#E2DACB]/60">
              <div className="flex justify-between">
                <span className="text-[#737373]">Seated Capacity:</span>
                <span className="font-semibold text-[#252525]">Up to 400</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Floating Capacity:</span>
                <span className="font-semibold text-[#252525]">Up to 600</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Climate:</span>
                <span className="font-semibold text-[#252525]">AC or Non-AC</span>
              </div>
            </div>

            <ul className="text-xs text-[#4A4A4A] space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                <span>Dedicated stage platform with lighting</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                <span>Dedicated Single Dining Wing included</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                <span>Double Dining wing upgrade available</span>
              </li>
            </ul>
          </Card>

          {/* Hall 2 */}
          <Card className="p-6 space-y-4 hover:border-[#C9AA72] transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#737373]">Section B</span>
              <h3 className="text-xl font-bold font-serif-heading text-[#173D35]">Hall 2</h3>
              <p className="text-xs text-[#737373]">Independent hall wing with dedicated ingress</p>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl text-xs space-y-1.5 border border-[#E2DACB]/60">
              <div className="flex justify-between">
                <span className="text-[#737373]">Seated Capacity:</span>
                <span className="font-semibold text-[#252525]">Up to 400</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Floating Capacity:</span>
                <span className="font-semibold text-[#252525]">Up to 600</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Climate:</span>
                <span className="font-semibold text-[#252525]">AC or Non-AC</span>
              </div>
            </div>

            <ul className="text-xs text-[#4A4A4A] space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                <span>Separate entrance and restroom facilities</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                <span>Single Dining Wing &amp; Kitchen included</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                <span>Can operate simultaneously with Hall 1</span>
              </li>
            </ul>
          </Card>

          {/* Full Campus */}
          <Card className="p-6 space-y-4 border-[#C9AA72] bg-gradient-to-b from-white to-[#FAF8F5]">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#C9AA72]">Combined Campus</span>
              <h3 className="text-xl font-bold font-serif-heading text-[#173D35]">Full Venue</h3>
              <p className="text-xs text-[#737373]">Hall 1 + Hall 2 + Dual Dining Wings</p>
            </div>

            <div className="p-3 bg-white rounded-xl text-xs space-y-1.5 border border-[#E2DACB]">
              <div className="flex justify-between">
                <span className="text-[#737373]">Seated Capacity:</span>
                <span className="font-semibold text-[#252525]">Up to 1,200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Floating Capacity:</span>
                <span className="font-semibold text-[#252525]">Up to 3,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Climate:</span>
                <span className="font-semibold text-[#252525]">Full AC or Non-AC</span>
              </div>
            </div>

            <ul className="text-xs text-[#4A4A4A] space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                <span>Both halls unified for grand weddings</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                <span>Both Gents &amp; Ladies Dining halls active</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#173D35] shrink-0 mt-0.5" />
                <span>Maximum capacity and stage presence</span>
              </li>
            </ul>
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
