import React, { useState, useEffect } from 'react';
import {
  Building2,
  CalendarDays,
  Search,
  Menu,
  X,
  ShieldAlert,
  PhoneCall,
  Clock,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { VENUE_INFO } from '../../services/hallData';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Halls & Spaces', path: '/halls' },
    { label: 'Availability', path: '/availability' },
    { label: 'Tariff & Packages', path: '/pricing' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Facilities', path: '/facilities' },
    { label: 'About', path: '/about' },
    { label: 'Location', path: '/location' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleLinkClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isAdminRoute = currentPath.startsWith('/admin');

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-[#E2DACB] shadow-xs'
            : 'bg-white border-b border-[#E2DACB]'
        }`}
      >
        {/* Top Info Bar: Deep Emerald background with Champagne Gold accents */}
        <div className="bg-[#173D35] text-[#FAF8F5] text-xs py-2 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-[#F5F1E8] font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#C9AA72]" />
                Opposite Juma Masjid, Akkarangadi, Panemangalore 574231
              </span>
              <span className="text-[#245A4F]">|</span>
              <span className="flex items-center gap-1.5 text-[#D9C194]">
                <Clock className="w-3.5 h-3.5 text-[#C9AA72]" />
                Sessions: 10:00 AM – 3:00 PM &bull; 6:00 PM – 10:00 PM
              </span>
            </div>

            <div className="flex items-center gap-4 text-[12px]">
              <a
                href={`tel:${VENUE_INFO.primaryPhone}`}
                className="flex items-center gap-1.5 font-semibold text-[#F5F1E8] hover:text-[#C9AA72] transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#C9AA72]" />
                <span>{VENUE_INFO.primaryPhone}</span>
              </a>
              <span className="text-[#245A4F]">|</span>
              <button
                type="button"
                onClick={() => handleLinkClick(isAdminRoute ? '/admin/dashboard' : '/admin/login')}
                className="inline-flex items-center gap-1 text-[#D9C194] hover:text-white transition-colors font-medium cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#C9AA72]" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Header / Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Wordmark (Clean bespoke typography with Deep Emerald & Champagne Gold) */}
            <button
              type="button"
              onClick={() => handleLinkClick('/')}
              className="flex flex-col text-left group focus:outline-none cursor-pointer py-1"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#173D35] font-serif-heading leading-tight group-hover:text-[#A58448] transition-colors">
                  H H Events
                </span>
                <span className="text-[11px] font-bold text-[#C9AA72] uppercase tracking-widest hidden sm:inline">
                  &amp; Conventions
                </span>
              </div>
              <p className="text-[11px] text-[#737373] font-medium tracking-wide">
                Panemangalore &bull; Bantwal
              </p>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleLinkClick(link.path)}
                    className={`relative px-3.5 py-2 text-[13px] font-semibold tracking-normal transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#173D35] font-bold'
                        : 'text-[#252525] hover:text-[#173D35] hover:bg-[#F5F1E8] rounded-lg'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C9AA72] rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleLinkClick('/track-booking')}
                className="p-2.5 rounded-xl text-[#252525] hover:text-[#173D35] hover:bg-[#F5F1E8] transition-colors border border-[#E2DACB] cursor-pointer"
                title="Track Booking Reference"
                aria-label="Track Booking Status"
              >
                <Search className="w-4 h-4 text-[#C9AA72]" />
              </button>

              <button
                type="button"
                onClick={() => handleLinkClick('/book')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#173D35] hover:bg-[#0F2722] text-[#F5F1E8] font-semibold text-xs uppercase tracking-wider border border-[#C9AA72]/30 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 text-[#C9AA72]" />
                <span>Book Venue</span>
              </button>
            </div>

            {/* Mobile Buttons */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => handleLinkClick('/book')}
                className="px-3.5 py-2 rounded-xl bg-[#173D35] text-[#F5F1E8] font-semibold text-xs uppercase tracking-wider shadow-xs active:scale-95"
              >
                Book
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-xl bg-[#F5F1E8] border border-[#E2DACB] text-[#173D35] hover:bg-[#EDE6D8] transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-[#C9AA72]" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Banquet Hall Pro Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-t border-[#E2DACB]">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E2DACB] flex items-center justify-between bg-[#173D35] text-white">
              <div>
                <span className="font-bold text-white text-lg font-serif-heading block">H H Events &amp; Conventions</span>
                <span className="text-[11px] text-[#D9C194] font-medium">Panemangalore, Bantwal</span>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-white/10 border border-white/20 text-[#FAF8F5] hover:bg-white/20"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-[#C9AA72]" />
              </button>
            </div>

            {/* Links */}
            <div className="p-4 space-y-1 overflow-y-auto flex-1 bg-[#FAF8F5]">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleLinkClick(link.path)}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#173D35] text-[#FAF8F5] font-bold border border-[#173D35]'
                        : 'text-[#252525] hover:bg-white'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowRight className={`w-4 h-4 ${isActive ? 'text-[#C9AA72]' : 'text-[#737373]'}`} />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleLinkClick('/track-booking')}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold text-[#252525] hover:bg-white border border-dashed border-[#E2DACB] mt-2 bg-white/60"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#C9AA72]" />
                  Track Reservation Status
                </span>
                <ArrowRight className="w-4 h-4 text-[#737373]" />
              </button>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-[#E2DACB] bg-white space-y-3 pb-safe">
              <button
                type="button"
                onClick={() => handleLinkClick('/book')}
                className="w-full py-3.5 px-4 rounded-xl bg-[#173D35] hover:bg-[#0F2722] text-[#FAF8F5] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all border border-[#C9AA72]/30"
              >
                <CalendarDays className="w-5 h-5 text-[#C9AA72]" />
                <span>Reserve Venue Now</span>
              </button>

              <div className="flex items-center justify-between text-xs text-[#737373] pt-1">
                <a
                  href={`tel:${VENUE_INFO.primaryPhone}`}
                  className="flex items-center gap-1.5 text-[#173D35] hover:underline font-semibold"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C9AA72]" />
                  <span>{VENUE_INFO.primaryPhone}</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleLinkClick('/admin/login')}
                  className="text-[#737373] hover:text-[#173D35]"
                >
                  Admin Portal &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
