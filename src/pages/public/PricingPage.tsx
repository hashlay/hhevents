import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle2,
  PhoneCall,
  Info,
  ThermometerSnowflake,
  Wind,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import {
  OFFICIAL_TARIFF_SCHEDULE,
  VENUE_INFO,
  TIMING_SLOTS,
} from '../../services/hallData';

interface PricingPackage {
  id: string;
  name: string;
  displayName?: string;
  details: string;
  rent: number;
  rentFormatted?: string;
  acType: 'AC' | 'Non AC' | 'Dining Only';
  requiredResources?: string[];
  inclusions?: string[];
  capacityText?: string;
  active?: boolean;
}

interface PricingPageProps {
  navigate: (path: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ navigate }) => {
  const [filterType, setFilterType] = useState<'all' | 'AC' | 'Non AC' | 'Dining Only'>('all');
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await fetch('/api/packages');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPackages(data.filter((p: any) => p.active !== false));
            setIsLoading(false);
            return;
          }
        }
      } catch {}
      setIsLoading(false);
    }
    loadPackages();
  }, []);

  const filteredPackages =
    filterType === 'all'
      ? packages
      : packages.filter((p) => p.acType === filterType);

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
              Official Tariff Schedule
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#252525] tracking-tight font-serif-heading">
              Hall Packages &amp; Tariff
            </h1>
            <p className="text-base sm:text-lg text-[#4A4A4A] leading-relaxed">
              Standard pricing schedule for H H Events &amp; Conventions. Commercial kitchen facility and stage dais are included across all packages.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[#4A4A4A] font-semibold">
              <span className="bg-[#F5F1E8] text-[#173D35] px-3.5 py-1 rounded-full border border-[#E2DACB]">
                Tariff: {OFFICIAL_TARIFF_SCHEDULE}
              </span>
              <span>&bull;</span>
              <span className="text-emerald-700">Kitchen Included in All Packages</span>
              <span>&bull;</span>
              <span className="text-[#C9AA72]">Opposite Juma Masjid, Bantwal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Official Tariff Card Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8">

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#737373] uppercase tracking-wide flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#C9AA72]" />
                Filter:
              </span>
              {(['all', 'AC', 'Non AC', 'Dining Only'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterType(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterType === cat
                      ? 'bg-[#C9AA72] text-white font-bold shadow-xs'
                      : 'bg-[#FAF8F5] text-[#4A4A4A] hover:bg-[#ECEAE8] border border-[#E2DACB]'
                  }`}
                >
                  {cat === 'all' ? `All (${packages.length})` : cat}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#737373] font-medium">
              Showing {filteredPackages.length} package options
            </span>
          </div>

          {/* Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPackages.map((pkg, idx) => {
              const isFullHall = pkg.id.includes('full');
              return (
                <div
                  key={pkg.id}
                  className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isFullHall
                      ? 'bg-gradient-to-b from-[#FFFDF9] to-[#F5F1E8] border-[#E2DACB] shadow-md ring-1 ring-[#C9AA72]/20'
                      : 'bg-white border-[#E2DACB] shadow-2xs hover:border-[#D8CFBC]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-[#737373]">
                        #{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          pkg.acType === 'AC'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : pkg.acType === 'Non AC'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {pkg.acType}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#252525] font-serif-heading">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-[#4A4A4A] mt-1 leading-relaxed">
                        {pkg.details}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E2DACB]">
                      <span className="text-[11px] text-[#737373] uppercase tracking-wide block">
                        Official Rent:
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-[#C9AA72]">
                          ₹{pkg.rent.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {pkg.capacityText && (
                        <span className="text-[11px] text-[#737373] block mt-1">
                          {pkg.capacityText}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-[#4A4A4A] pt-2 border-t border-[#E2DACB]">
                      {(pkg.inclusions && pkg.inclusions.length > 0
                        ? pkg.inclusions.slice(0, 3)
                        : ['Kitchen Facility Included', 'Standard Session Hours', 'Acoustic & Power Setup']
                      ).map((inc, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-[#E2DACB]">
                    <Button
                      onClick={() => {
                        navigate(`/book?package=${pkg.id}`);
                      }}
                      variant={isFullHall ? 'gold' : 'outline'}
                      size="sm"
                      className="w-full justify-center"
                    >
                      Book This Package
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Operational Notice Box */}
          <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] text-[#252525] text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[#C9AA72] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#C9AA72]" />
              Official Tariff Schedule Terms
            </div>
            <p className="leading-relaxed text-[#4A4A4A]">
              Rates apply for <strong>{OFFICIAL_TARIFF_SCHEDULE}</strong>. Commercial kitchen facilities are included with all packages without extra charge. Food preparation, cleaning, power usage, and timing slots are subject to standard venue terms.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 font-semibold text-[#252525]">
              <a href={`tel:${VENUE_INFO.primaryPhone}`} className="hover:text-[#C9AA72] flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-[#C9AA72]" /> Call: {VENUE_INFO.primaryPhone}
              </a>
              <span>&bull;</span>
              <a href={`tel:${VENUE_INFO.secondaryPhone}`} className="hover:text-[#C9AA72] flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-[#C9AA72]" /> Alt: {VENUE_INFO.secondaryPhone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Official Timings Summary */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DACB] shadow-sm space-y-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#C9AA72]">
              Operational Hours
            </span>
            <h3 className="text-2xl font-bold text-[#252525] font-serif-heading mt-1">
              Official Session Hours
            </h3>
            <p className="text-xs sm:text-sm text-[#737373] mt-1">
              Events are hosted under standard scheduled operational sessions:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TIMING_SLOTS.map((s) => (
              <div key={s.id} className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-[#252525]">{s.label}</h4>
                  <span className="text-xs font-mono font-bold text-[#173D35] bg-[#F5F1E8] px-2.5 py-1 rounded border border-[#E2DACB]">
                    {s.timeRange}
                  </span>
                </div>
                <p className="text-xs text-[#4A4A4A] leading-relaxed pt-1">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
