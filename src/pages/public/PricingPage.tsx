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
    <div className="space-y-16 pb-24 bg-[#FDFBF9] text-[#161210]">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#F6F5F4] py-14 sm:py-18 border-b border-[#E8E5E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#9A6611] bg-[#FAF2E4] px-3.5 py-1.5 rounded-full border border-[#E8D7BE] inline-flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#C88D23]" />
              Official Tariff Schedule
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#161210] tracking-tight font-serif-heading">
              Official Tariff &amp; Packages
            </h1>
            <p className="text-base sm:text-lg text-[#58453E] leading-relaxed">
              Transparent, confirmed package pricing for H H Events &amp; Conventions — Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[#58453E] font-semibold">
              <span className="bg-[#FAF2E4] text-[#9A6611] px-3.5 py-1 rounded-full border border-[#E8D7BE]">
                Official Schedule: {OFFICIAL_TARIFF_SCHEDULE}
              </span>
              <span>&bull;</span>
              <span className="text-emerald-700">Kitchen Included in All Packages</span>
              <span>&bull;</span>
              <span className="text-[#C88D23]">Flexible Multi-Hall &amp; Dining Combinations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Official Tariff Card Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E5E1] shadow-sm space-y-8">
          {/* Header of Tariff Card */}
          <div className="text-center max-w-2xl mx-auto space-y-2 border-b border-[#F0ECE7] pb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
              H H Events &amp; Conventions
            </h2>
            <p className="text-xs sm:text-sm text-[#58453E] font-medium">
              Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal 574231
            </p>
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#FAF2E4] text-[#9A6611] text-xs font-bold uppercase tracking-wider border border-[#E8D7BE]">
              Schedule: {OFFICIAL_TARIFF_SCHEDULE}
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#7E7873] uppercase tracking-wide flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#C88D23]" />
                Filter:
              </span>
              {(['all', 'AC', 'Non AC', 'Dining Only'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterType(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filterType === cat
                      ? 'bg-[#C88D23] text-white font-bold shadow-xs'
                      : 'bg-[#F6F5F4] text-[#58453E] hover:bg-[#ECEAE8] border border-[#E8E5E1]'
                  }`}
                >
                  {cat === 'all' ? `All (${packages.length})` : cat}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#7E7873] font-medium">
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
                      ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FAF4EA] border-[#EAD8BF] shadow-md ring-1 ring-[#C88D23]/20'
                      : 'bg-white border-[#E8E5E1] shadow-2xs hover:border-[#D8CFBC]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-[#7E7873]">
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
                      <h3 className="text-lg font-bold text-[#161210] font-serif-heading">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-[#58453E] mt-1 leading-relaxed">
                        {pkg.details}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F0ECE7]">
                      <span className="text-[11px] text-[#7E7873] uppercase tracking-wide block">
                        Official Rent:
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-[#C88D23]">
                          ₹{pkg.rent.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {pkg.capacityText && (
                        <span className="text-[11px] text-[#7E7873] block mt-1">
                          {pkg.capacityText}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-[#58453E] pt-2 border-t border-[#F0ECE7]">
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

                  <div className="pt-5 mt-4 border-t border-[#F0ECE7]">
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
          <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] text-[#161210] text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[#C88D23] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#C88D23]" />
              Official Tariff Schedule Terms
            </div>
            <p className="leading-relaxed text-[#58453E]">
              Rates apply for <strong>{OFFICIAL_TARIFF_SCHEDULE}</strong>. Commercial kitchen facilities are included with all packages without extra charge. Food preparation, cleaning, power usage, and timing slots are subject to standard venue terms.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 font-semibold text-[#161210]">
              <a href={`tel:${VENUE_INFO.primaryPhone}`} className="hover:text-[#C88D23] flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-[#C88D23]" /> Call: {VENUE_INFO.primaryPhone}
              </a>
              <span>&bull;</span>
              <a href={`tel:${VENUE_INFO.secondaryPhone}`} className="hover:text-[#C88D23] flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-[#C88D23]" /> Alt: {VENUE_INFO.secondaryPhone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Official Timings Summary */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E8E5E1] shadow-sm space-y-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#C88D23]">
              Operational Hours
            </span>
            <h3 className="text-2xl font-bold text-[#161210] font-serif-heading mt-1">
              Official Session Hours
            </h3>
            <p className="text-xs sm:text-sm text-[#7E7873] mt-1">
              Events are hosted under standard scheduled operational sessions:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TIMING_SLOTS.map((s) => (
              <div key={s.id} className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-[#161210]">{s.label}</h4>
                  <span className="text-xs font-mono font-bold text-[#9A6611] bg-[#FAF2E4] px-2.5 py-1 rounded border border-[#E8D7BE]">
                    {s.timeRange}
                  </span>
                </div>
                <p className="text-xs text-[#58453E] leading-relaxed pt-1">
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
