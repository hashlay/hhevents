import React from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CalendarCheck,
  ExternalLink,
} from 'lucide-react';
import { VENUE_INFO } from '../../services/hallData';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-[#173D35] text-slate-200 pt-16 pb-12 border-t border-[#C9AA72]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand & Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-3">
              <img
                src="/assets/branding/hh-logo.png"
                alt="H H Events & Conventions Logo"
                className="h-10 w-auto object-contain"
              />
              <div>
                <span className="text-2xl font-bold text-white tracking-tight font-serif-heading block">
                  H H Events &amp; Conventions
                </span>
                <p className="text-xs text-[#C9AA72] font-semibold mt-1 tracking-wider uppercase">
                  Panemangalore, Bantwal &bull; Hall 1 &amp; Hall 2
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Premier destination for weddings, Nikah, celebrations, cultural gatherings, and corporate conventions. Featuring dual independent halls, dedicated dining wings, and complete commercial kitchen facilities.
            </p>

            {/* Official Address */}
            <div className="p-3.5 rounded-xl bg-[#0F2722] border border-[#C9AA72]/20 text-xs text-slate-200 space-y-1.5">
              <span className="font-bold text-[#C9AA72] block text-[11px] uppercase tracking-wider">
                Venue Address
              </span>
              <p className="leading-relaxed">
                {VENUE_INFO.address}
              </p>
              <a
                href={VENUE_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#C9AA72] hover:text-white font-semibold pt-1"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Public Navigation */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-4">
              Explore Venue
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-white transition-colors cursor-pointer">
                  Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/about')} className="hover:text-white transition-colors cursor-pointer">
                  About H H Events
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/halls')} className="hover:text-white transition-colors cursor-pointer">
                  Halls (Hall 1 &amp; Hall 2)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/facilities')} className="hover:text-white transition-colors cursor-pointer">
                  Facilities &amp; Amenities
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/gallery')} className="hover:text-white transition-colors cursor-pointer">
                  Photo Gallery
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors cursor-pointer">
                  Tariff &amp; Packages
                </button>
              </li>
            </ul>
          </div>

          {/* Reservations & Schedule */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-4">
              Reservations
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => navigate('/book')}
                  className="text-[#DFAB4C] font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" /> Book Hall Online
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/availability')} className="hover:text-white transition-colors cursor-pointer">
                  Hall Availability
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/track-booking')} className="hover:text-white transition-colors cursor-pointer">
                  Track Reservation
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/location')} className="hover:text-white transition-colors cursor-pointer">
                  Location &amp; Route
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contact')} className="hover:text-white transition-colors cursor-pointer">
                  Contact Management
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Contact & Hours */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-4">
              Direct Contact
            </h4>
            <div className="space-y-3 text-xs text-[#A8A29E]">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C88D23] shrink-0 mt-0.5" />
                <span>Opposite Juma Masjid, Panemangalore, Akkarangadi, Bantwal 574231</span>
              </p>
              <div className="space-y-1">
                <p className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#C88D23] shrink-0" />
                  <a href={`tel:${VENUE_INFO.primaryPhone}`} className="hover:text-white font-medium">
                    {VENUE_INFO.primaryPhone}
                  </a>
                </p>
                <p className="flex items-center gap-2.5 pl-6">
                  <a href={`tel:${VENUE_INFO.secondaryPhone}`} className="hover:text-white font-medium">
                    {VENUE_INFO.secondaryPhone}
                  </a>
                </p>
              </div>
              <div className="pt-2 border-t border-[#29221D] space-y-1">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#C88D23] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Session Timings:</span>
                    <span>Day: {VENUE_INFO.daySlotHours}</span>
                    <br />
                    <span>Evening: {VENUE_INFO.eveningSlotHours}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Management Payment Notice Banner */}
        <div className="p-4 rounded-xl bg-[#241E1A] border border-[#3D312A] mb-8 text-xs text-[#E7E5E4] leading-relaxed">
          <span className="font-bold text-[#DFAB4C] block mb-1">BOOKING &amp; PAYMENT NOTICE:</span>
          {VENUE_INFO.paymentNotice}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#29221D] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <p>&copy; {new Date().getFullYear()} H H Events &amp; Conventions. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span>Opposite Juma Masjid, Panemangalore</span>
            <span className="text-[#3D312A] hidden sm:inline">&bull;</span>
            <a href={`tel:${VENUE_INFO.primaryPhone}`} className="hover:text-[#DFAB4C]">
              Tel: {VENUE_INFO.primaryPhone}
            </a>
            <span className="text-[#3D312A] hidden sm:inline">&bull;</span>
            <button onClick={() => navigate('/admin/dashboard')} className="hover:text-white cursor-pointer">
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
