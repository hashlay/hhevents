import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';
import { BackButton } from '../../components/ui/BackButton';
import { VENUE_INFO } from '../../services/hallData';

interface PrivacyPolicyPageProps {
  navigate: (path: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ navigate }) => {
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
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9AA72]" />
              Official Venue Legal Document
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#173D35] tracking-tight font-serif-heading">
              Privacy Policy
            </h1>
            <p className="text-sm sm:text-base text-[#4A4A4A] leading-relaxed max-w-2xl">
              H H Events &amp; Conventions respects your personal privacy. This policy outlines how your reservation details, contact records, and event specifications are securely collected, processed, and safeguarded.
            </p>
            <p className="text-xs font-semibold text-[#8C734B] tracking-wide">
              Last Updated &amp; Effective Date: October 2026 &bull; Reference: HH-POL-PRIVACY-01
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-3xl border border-[#E2DACB] p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-[#4A4A4A]">
          {/* Section 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#173D35]">
              <Eye className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                1. Information We Collect
              </h2>
            </div>
            <p>
              When you enquire, submit a reservation request, or book H H Events &amp; Conventions (Hall 1, Hall 2, Dining Wings, or Kitchen), we collect personal information necessary to execute venue operations:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Contact Identification:</strong> Full Name, Primary Mobile Phone Number, and Optional Email Address.</li>
              <li><strong>Event Specifications:</strong> Date of Function, Session Slot (Day 10 AM&ndash;3 PM or Evening 6 PM&ndash;10 PM), Hall Preference, and Nature of Function (Wedding, Nikah, Reception, Feast, Cultural).</li>
              <li><strong>Attendance Estimations:</strong> Expected guest counts and special catering requirements.</li>
              <li><strong>Financial Transaction Records:</strong> Advance token receipts, payment ledger entries, and transaction reference numbers.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3 pt-6 border-t border-[#E2DACB]">
            <div className="flex items-center gap-2 text-[#173D35]">
              <Lock className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                2. How We Use Your Information
              </h2>
            </div>
            <p>
              Your personal and event data is utilized solely for legitimate banquet management and service delivery:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs space-y-1">
                <strong className="text-[#173D35] block font-bold">Booking Validation &amp; Scheduling</strong>
                <p>Preventing hall schedule collisions and securing dates on the master venue calendar.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs space-y-1">
                <strong className="text-[#173D35] block font-bold">Operational Coordination</strong>
                <p>Arranging air-conditioning, generator backup, green rooms, and commercial kitchen turnover.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs space-y-1">
                <strong className="text-[#173D35] block font-bold">Billing &amp; Advance Token Receipts</strong>
                <p>Issuing numbered payment receipts and maintaining statutory financial ledgers.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs space-y-1">
                <strong className="text-[#173D35] block font-bold">Customer Status Inquiries</strong>
                <p>Enabling hosts to look up real-time booking progress via our online tracking desk.</p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3 pt-6 border-t border-[#E2DACB]">
            <div className="flex items-center gap-2 text-[#173D35]">
              <ShieldCheck className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                3. Zero Third-Party Data Selling
              </h2>
            </div>
            <p>
              H H Events &amp; Conventions enforces a strict no-sale policy. We <strong>never sell, lease, rent, or trade</strong> your personal contact numbers, guest counts, or booking history to third-party telemarketers, external decorators, or marketing agencies.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3 pt-6 border-t border-[#E2DACB]">
            <div className="flex items-center gap-2 text-[#173D35]">
              <FileText className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                4. Data Security &amp; Retention
              </h2>
            </div>
            <p>
              All reservation requests and ledger records are protected with restricted executive authorization. Administrative consoles employ encrypted authentication sessions and rate-limiting safeguards to prevent unauthorized tampering. Records are retained for statutory accounting and booking history verification.
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
                    Official Desk: {VENUE_INFO.primaryPhone} &bull; Alt: {VENUE_INFO.secondaryPhone} &bull; WhatsApp: {VENUE_INFO.whatsappPhone}
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
