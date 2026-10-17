import React from 'react';
import { Cookie, Shield, Settings, Info, CheckCircle2 } from 'lucide-react';
import { BackButton } from '../../components/ui/BackButton';
import { VENUE_INFO } from '../../services/hallData';

interface CookiePolicyPageProps {
  navigate: (path: string) => void;
}

export const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({ navigate }) => {
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
              <Cookie className="w-3.5 h-3.5 text-[#C9AA72]" />
              Official Venue Legal Document
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#173D35] tracking-tight font-serif-heading">
              Cookie &amp; Storage Policy
            </h1>
            <p className="text-sm sm:text-base text-[#4A4A4A] leading-relaxed max-w-2xl">
              This policy explains how H H Events &amp; Conventions uses cookies, local browser storage, and session tokens to provide a seamless, secure online reservation experience.
            </p>
            <p className="text-xs font-semibold text-[#8C734B] tracking-wide">
              Effective Date: October 2026 &bull; Reference: HH-POL-COOKIE-01
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-3xl border border-[#E2DACB] p-6 sm:p-10 shadow-xs space-y-8 text-sm leading-relaxed text-[#4A4A4A]">
          {/* Section 1: What Are Cookies */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#173D35]">
              <Info className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                1. What Are Cookies &amp; Local Storage?
              </h2>
            </div>
            <p>
              Cookies and local browser storage are small, benign text files stored on your computer or mobile device when you browse web applications. They allow the website to recognize your preferences and maintain your navigation state between pages without losing entered reservation data.
            </p>
          </div>

          {/* Section 2: How HH Events Uses Storage */}
          <div className="space-y-3 pt-6 border-t border-[#E2DACB]">
            <div className="flex items-center gap-2 text-[#173D35]">
              <Shield className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                2. Categories of Storage We Use
              </h2>
            </div>
            <p>
              We maintain an ultra-minimal storage policy focused strictly on functional execution:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs space-y-1">
                <strong className="text-[#173D35] block font-bold">Strictly Essential Session Storage</strong>
                <p>Retains your ongoing step in the multi-step booking drawer so you do not lose dates, hall choices, or guest numbers if refreshing.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs space-y-1">
                <strong className="text-[#173D35] block font-bold">Administrative Authentication Tokens</strong>
                <p>Safeguards secure cryptographic session tokens for authorized venue managers logging into the management dashboard.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs space-y-1">
                <strong className="text-[#173D35] block font-bold">UI Preference Caching</strong>
                <p>Stores theme states, recent search queries, and dismissed notification banners for a smooth browsing experience.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] text-xs space-y-1">
                <strong className="text-[#173D35] block font-bold">Zero Ad-Network or Cross-Site Trackers</strong>
                <p>We do not deploy invasive third-party ad retargeting pixels, social tracking beacons, or cross-site profiling cookies.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Managing Cookies */}
          <div className="space-y-3 pt-6 border-t border-[#E2DACB]">
            <div className="flex items-center gap-2 text-[#173D35]">
              <Settings className="w-5 h-5 text-[#C9AA72]" />
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading text-[#173D35]">
                3. Managing &amp; Clearing Browser Storage
              </h2>
            </div>
            <p>
              You maintain full authority over stored tokens. You may inspect, block, or clear all cookies and site storage at any moment through your web browser preferences (Chrome, Safari, Firefox, Edge). Please note that clearing essential storage may reset incomplete booking forms.
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
