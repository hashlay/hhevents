import React from 'react';
import { RotateCcw, AlertTriangle, CalendarCheck, Clock, CheckCircle2 } from 'lucide-react';
import { BackButton } from '../../components/ui/BackButton';
import { VENUE_INFO } from '../../services/hallData';

interface RefundPolicyPageProps {
  navigate: (path: string) => void;
}

export const RefundPolicyPage: React.FC<RefundPolicyPageProps> = ({ navigate }) => {
  return (
    <div className="space-y-12 pb-24 bg-[#F5F1E8] text-[#252525]">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] py-14 sm:py-18 border-b border-[#E2DACB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#173D35] bg-[#F5F1E8] px-3.5 py-1.5 rounded-full border border-[#E2DACB] inline-flex items-center gap-1.5 shadow-2xs">
              <RotateCcw className="w-3.5 h-3.5 text-[#C9AA72]" />
              Official Venue Legal Document
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#173D35] tracking-tight font-serif-heading">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="text-sm sm:text-base text-[#4A4A4A] leading-relaxed max-w-2xl">
              Transparent terms governing advance reservation tokens, event cancellations, date postponements, and financial settlements at H H Events &amp; Conventions.
            </p>
            <p className="text-xs font-semibold text-[#8C734B] tracking-wide">
              Effective Date: October 2026 &bull; Reference: HH-POL-REFUND-01
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-3xl border border-[#E2DACB] p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-[#4A4A4A]">
          {/* Section 1: Nature of Advance Token */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#173D35]">
              <CalendarCheck className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                1. Purpose of Advance Reservation Tokens
              </h2>
            </div>
            <p>
              When a booking is confirmed, the specific hall, date, and time slot are exclusively blocked on the master calendar, and all competing booking requests for that slot are turned away. The advance token represents a mutual commitment ensuring operational readiness, staff scheduling, and energy infrastructure allocation.
            </p>
          </div>

          {/* Section 2: Cancellation Schedule */}
          <div className="space-y-3 pt-6 border-t border-[#E2DACB]">
            <div className="flex items-center gap-2 text-[#173D35]">
              <Clock className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                2. Cancellation Timelines &amp; Refund Matrix
              </h2>
            </div>
            <p>
              In the unforeseen event that a host must cancel a scheduled function, refunds are calculated based on notice received prior to the event date:
            </p>
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs sm:text-sm border border-[#E2DACB] rounded-xl overflow-hidden">
                <thead className="bg-[#FAF8F5] text-[#173D35] font-bold border-b border-[#E2DACB]">
                  <tr>
                    <th className="p-3 sm:p-4">Written Notice Received</th>
                    <th className="p-3 sm:p-4">Advance Token Refund</th>
                    <th className="p-3 sm:p-4">Administrative Charge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DACB] text-[#4A4A4A]">
                  <tr>
                    <td className="p-3 sm:p-4 font-semibold text-[#173D35]">45 or more days before event</td>
                    <td className="p-3 sm:p-4 text-emerald-700 font-bold">75% Refund of Token</td>
                    <td className="p-3 sm:p-4">25% Retained Processing Fee</td>
                  </tr>
                  <tr>
                    <td className="p-3 sm:p-4 font-semibold text-[#173D35]">30 to 44 days before event</td>
                    <td className="p-3 sm:p-4 text-amber-700 font-bold">50% Refund of Token</td>
                    <td className="p-3 sm:p-4">50% Retained Administrative Fee</td>
                  </tr>
                  <tr>
                    <td className="p-3 sm:p-4 font-semibold text-[#173D35]">15 to 29 days before event</td>
                    <td className="p-3 sm:p-4 text-amber-800 font-bold">25% Refund of Token</td>
                    <td className="p-3 sm:p-4">75% Retained Administrative Fee</td>
                  </tr>
                  <tr>
                    <td className="p-3 sm:p-4 font-semibold text-[#173D35]">Less than 15 days before event</td>
                    <td className="p-3 sm:p-4 text-rose-700 font-bold">Non-Refundable</td>
                    <td className="p-3 sm:p-4">100% Retained Compensation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Rescheduling Flexibility */}
          <div className="space-y-3 pt-6 border-t border-[#E2DACB]">
            <div className="flex items-center gap-2 text-[#173D35]">
              <RotateCcw className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                3. Date Postponement &amp; Rescheduling Terms
              </h2>
            </div>
            <p>
              We understand family emergencies and unforeseen scheduling challenges. Hosts may request a one-time postponement subject to the following criteria:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Rescheduling request must be submitted at least 21 days prior to the original date.</li>
              <li>The new event date must fall within 6 months of the original booking date and is subject to open calendar availability.</li>
              <li>A nominal administrative date-alteration fee of ₹2,500 applies to cover calendar re-indexing.</li>
            </ul>
          </div>

          {/* Section 4: Refund Disbursement Timelines */}
          <div className="space-y-3 pt-6 border-t border-[#E2DACB]">
            <div className="flex items-center gap-2 text-[#173D35]">
              <AlertTriangle className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                4. Method of Refund Disbursement
              </h2>
            </div>
            <p>
              Approved refunds are credited strictly via original banking channels (NEFT/RTGS/UPI) or authorized account-payee cheque issued by the venue management within <strong>5 to 7 bank working days</strong> from formal written approval. Cash refunds are strictly prohibited for financial auditing integrity.
            </p>
          </div>

          {/* Official Sign-off Card */}
          <div className="pt-8 border-t-2 border-[#C9AA72]/40">
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <img
                  src="/assets/branding/hh-logo.png"
                  alt="HH Official Crest"
                  className="h-12 w-auto object-contain shrink-0 mt-1"
                />
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9AA72] block">
                    Authorized Management Sign-Off
                  </span>
                  <strong className="text-sm sm:text-base font-bold text-[#173D35] block font-serif-heading">
                    Management of H H Events &amp; Conventions
                  </strong>
                  <p className="text-[#4A4A4A]">
                    Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal, Karnataka 574231
                  </p>
                  <p className="text-[#737373]">
                    Official Desk: {VENUE_INFO.primaryPhone} &bull; {VENUE_INFO.secondaryPhone}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Legal Document
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
