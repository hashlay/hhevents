import React from 'react';
import {
  MapPin,
  Phone,
  Clock,
  CalendarCheck,
  ExternalLink,
} from 'lucide-react';
import { VENUE_INFO } from '../../services/hallData';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-[#173D35] text-slate-200 pt-8 sm:pt-12 pb-20 lg:pb-10 border-t border-[#C9AA72]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-10 pb-5 sm:pb-7 border-b border-[#C9AA72]/20">
          
          {/* Brand & Identity (Cols 1-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/branding/hh-logo.png"
                alt="Events & Conventions Logo"
                className="h-10 sm:h-11 w-auto object-contain"
              />
              <div>
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif-heading block leading-tight">
                  Events &amp; Conventions
                </span>
                <p className="text-xs text-[#C9AA72] font-semibold tracking-wider uppercase mt-0.5">
                  Panemangalore &bull; Bantwal
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
              Premier destination for weddings, Nikah, receptions, cultural celebrations, and corporate conventions with dual independent halls and dedicated dining wings.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => navigate('/book')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F2722] hover:bg-[#0B1E19] text-[#C9AA72] hover:text-white border border-[#C9AA72]/30 transition-all text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-[#C9AA72]" />
                <span>Reserve Your Date</span>
              </button>
            </div>
          </div>

          {/* Quick Links & Services (Side-by-side on mobile to eliminate blank space, separate on desktop) */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:contents">
            {/* Quick Links (Cols 5-6) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#C9AA72]">
                Explore
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <button onClick={() => navigate('/')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/halls')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    Halls &amp; Spaces
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/pricing')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    Tariff &amp; Packages
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/availability')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    Hall Availability
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/gallery')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    Photo Gallery
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/facilities')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    Facilities
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/about')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    About Venue
                  </button>
                </li>
              </ul>
            </div>

            {/* Guest Services (Cols 7-8) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[#C9AA72]">
                Services
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <button
                    onClick={() => navigate('/book')}
                    className="text-[#DFAB4C] hover:text-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Book Online</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/track-booking')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    Track Reservation
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/location')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    Directions &amp; Map
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/contact')} className="hover:text-white text-slate-300 transition-colors cursor-pointer text-left">
                    Contact Desk
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Location & Direct Inquiries (Cols 9-12) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#C9AA72]">
              Location &amp; Inquiries
            </h4>

            {/* Integrated Location & Google Maps Link */}
            <a
              href={VENUE_INFO.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-3 rounded-xl bg-[#0F2722]/80 hover:bg-[#0F2722] border border-[#C9AA72]/20 hover:border-[#C9AA72]/60 transition-all text-xs text-slate-200"
              title="Click to open venue location on Google Maps"
            >
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C9AA72] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="space-y-1">
                  <p className="leading-snug text-slate-200 group-hover:text-white transition-colors">
                    Opposite Juma Masjid, Panemangalore, Akkarangadi, Bantwal 574231
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C9AA72] group-hover:text-[#F3E8D8] transition-colors">
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </a>

            {/* Direct Phone Numbers (Single Line on Desktop & Mobile) */}
            <div className="flex items-center gap-2 text-xs text-slate-200 flex-wrap pt-0.5">
              <Phone className="w-3.5 h-3.5 text-[#C9AA72] shrink-0" />
              <a
                href={`tel:${VENUE_INFO.primaryPhone}`}
                className="hover:text-[#C9AA72] transition-colors font-medium"
              >
                {VENUE_INFO.primaryPhone}
              </a>
              <span className="text-[#C9AA72]/60 font-bold">&bull;</span>
              <a
                href={`tel:${VENUE_INFO.secondaryPhone}`}
                className="hover:text-[#C9AA72] transition-colors text-slate-300"
              >
                {VENUE_INFO.secondaryPhone}
              </a>
            </div>

            {/* Timings */}
            <div className="flex items-center gap-2 text-[11px] text-slate-300 pt-1.5 border-t border-[#C9AA72]/15">
              <Clock className="w-3.5 h-3.5 text-[#C9AA72] shrink-0" />
              <span>Session: Day 10 AM&ndash;3 PM &bull; Evening 6 PM&ndash;10 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal Policies */}
        <div className="pt-4 sm:pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} H H Events &amp; Conventions. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            <button
              type="button"
              onClick={() => navigate('/privacy-policy')}
              className="text-slate-300 hover:text-[#C9AA72] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-[#C9AA72]/40">&bull;</span>
            <button
              type="button"
              onClick={() => navigate('/terms-and-conditions')}
              className="text-slate-300 hover:text-[#C9AA72] transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <span className="text-[#C9AA72]/40">&bull;</span>
            <button
              type="button"
              onClick={() => navigate('/refund-policy')}
              className="text-slate-300 hover:text-[#C9AA72] transition-colors cursor-pointer"
            >
              Refund Policy
            </button>
            <span className="text-[#C9AA72]/40">&bull;</span>
            <button
              type="button"
              onClick={() => navigate('/cookie-policy')}
              className="text-slate-300 hover:text-[#C9AA72] transition-colors cursor-pointer"
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
