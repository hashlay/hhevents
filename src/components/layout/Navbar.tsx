import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  CalendarDays,
  Search,
  Menu,
  X,
  PhoneCall,
  Clock,
  ArrowRight,
  MapPin,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { VENUE_INFO } from '../../services/hallData';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMoreDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsMoreDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
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

  // Primary navigation journeys (always prominent)
  const primaryLinks = [
    { label: 'Home', path: '/' },
    { label: 'Halls & Spaces', path: '/halls' },
    { label: 'Tariff & Packages', path: '/pricing' },
    { label: 'Availability', path: '/availability' },
    { label: 'Gallery', path: '/gallery' },
  ];

  // Secondary/Detailed navigation links
  const secondaryLinks = [
    { label: 'Facilities', path: '/facilities', icon: Sparkles, desc: 'AC, dining & kitchen specs' },
    { label: 'About Venue', path: '/about', icon: Info, desc: 'Campus capacity & history' },
    { label: 'Location & Map', path: '/location', icon: MapPin, desc: 'Directions & coordinates' },
    { label: 'Contact Us', path: '/contact', icon: PhoneCall, desc: 'Direct desk & phone inquiries' },
  ];

  // All links list for XL displays and Mobile drawer
  const allLinks = [
    { label: 'Home', path: '/' },
    { label: 'Halls & Spaces', path: '/halls' },
    { label: 'Tariff & Packages', path: '/pricing' },
    { label: 'Availability', path: '/availability' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Facilities', path: '/facilities' },
    { label: 'About', path: '/about' },
    { label: 'Location', path: '/location' },
    { label: 'Contact', path: '/contact' },
  ];

  const isMoreActive = secondaryLinks.some((l) => l.path === currentPath);

  const handleLinkClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsMoreDropdownOpen(false);
  };

  const isAdminRoute = currentPath.startsWith('/admin');

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-[#E2DACB] shadow-sm'
            : 'bg-white border-b border-[#E2DACB]'
        }`}
      >
        {/* Top Utility Bar: Static, clean executive header with verified venue details */}
        <div className="bg-[#173D35] text-[#FAF8F5] text-xs h-9 flex items-center border-b border-[#245A4F]/70 select-none">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Left: Venue Location */}
            <div className="flex items-center gap-2 text-[#F5F1E8] text-[11.5px] truncate">
              <MapPin className="w-3.5 h-3.5 text-[#C9AA72] shrink-0" />
              <span className="truncate">Opposite Juma Masjid, Akkarangadi, Panemangalore 574231</span>
            </div>

            {/* Center: Session Times */}
            <div className="hidden md:flex items-center gap-2 text-[#D9C194] text-[11.5px] whitespace-nowrap shrink-0">
              <Clock className="w-3.5 h-3.5 text-[#C9AA72] shrink-0" />
              <span>Day Session (10:00 AM – 3:00 PM) &bull; Evening Session (6:00 PM – 10:00 PM)</span>
            </div>

            {/* Right: Direct Desk Phone */}
            <div className="flex items-center shrink-0">
              <a
                href={`tel:${VENUE_INFO.primaryPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#122E27] hover:bg-[#1C463C] border border-[#C9AA72]/40 hover:border-[#C9AA72] text-[#F5F1E8] hover:text-[#D9C194] text-[11px] font-semibold transition-all whitespace-nowrap"
                title="Call Venue Desk"
              >
                <PhoneCall className="w-3 h-3 text-[#C9AA72] shrink-0" />
                <span>{VENUE_INFO.primaryPhone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Header / Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Brand Wordmark & Monogram Crest */}
            <button
              type="button"
              onClick={() => handleLinkClick('/')}
              className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer shrink-0 py-1"
            >
              {/* Luxury Monogram Crest Badge */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#173D35] to-[#0D241F] border border-[#C9AA72]/40 shadow-xs flex items-center justify-center text-[#F5F1E8] group-hover:border-[#C9AA72] group-hover:shadow transition-all shrink-0">
                <div className="flex flex-col items-center justify-center leading-none">
                  <span className="font-serif-heading font-bold text-xs sm:text-sm tracking-wider text-[#D9C194]">HH</span>
                  <span className="w-3 h-[1px] bg-[#C9AA72]/60 mt-0.5" />
                </div>
              </div>

              {/* Typography Wordmark */}
              <div className="flex flex-col shrink-0">
                <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#173D35] font-serif-heading leading-tight group-hover:text-[#A58448] transition-colors">
                    H H Events
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#C9AA72] uppercase tracking-widest hidden sm:inline">
                    &amp; Conventions
                  </span>
                </div>
                <p className="text-[10px] text-[#737373] font-medium tracking-wider uppercase whitespace-nowrap leading-none mt-1">
                  Panemangalore &bull; Bantwal
                </p>
              </div>
            </button>

            {/* Desktop Navigation Links — XL Viewports (All Links Spaced Elegantly) */}
            <nav className="hidden 2xl:flex items-center gap-1 shrink-0">
              {allLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleLinkClick(link.path)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#173D35] text-[#FAF8F5] shadow-xs'
                        : 'text-[#252525] hover:text-[#173D35] hover:bg-[#F5F1E8]'
                    }`}
                  >
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Desktop Navigation Links — LG to 2XL Viewports (Primary Links + Luxury "More" Dropdown) */}
            <nav className="hidden lg:flex 2xl:hidden items-center gap-1 shrink-0">
              {primaryLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleLinkClick(link.path)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#173D35] text-[#FAF8F5] shadow-xs'
                        : 'text-[#252525] hover:text-[#173D35] hover:bg-[#F5F1E8]'
                    }`}
                  >
                    <span>{link.label}</span>
                  </button>
                );
              })}

              {/* Luxury "More ▾" Dropdown */}
              <div className="relative" ref={moreDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                    isMoreActive || isMoreDropdownOpen
                      ? 'bg-[#173D35] text-[#FAF8F5] shadow-xs'
                      : 'text-[#252525] hover:text-[#173D35] hover:bg-[#F5F1E8]'
                  }`}
                  aria-expanded={isMoreDropdownOpen}
                  aria-haspopup="true"
                >
                  <span>More</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMoreDropdownOpen ? 'rotate-180 text-[#C9AA72]' : ''
                    }`}
                  />
                </button>

                {isMoreDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E2DACB] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 text-[10px] font-bold text-[#8C734B] uppercase tracking-wider border-b border-[#F0EBE1]">
                      Venue Exploration
                    </div>
                    <div className="py-1 space-y-0.5">
                      {secondaryLinks.map((item) => {
                        const IconComponent = item.icon;
                        const isCurrent = currentPath === item.path;
                        return (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => handleLinkClick(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-[#F5F1E8] text-[#173D35] font-bold'
                                : 'text-[#252525] hover:bg-[#F5F1E8]/70 hover:text-[#173D35]'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#E2DACB] flex items-center justify-center shrink-0 text-[#173D35]">
                              <IconComponent className="w-3.5 h-3.5 text-[#C9AA72]" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold leading-tight">{item.label}</span>
                              <span className="text-[10px] text-[#737373] truncate leading-tight mt-0.5">
                                {item.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleLinkClick('/track-booking')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#252525] hover:text-[#173D35] hover:bg-[#F5F1E8] transition-colors border border-[#E2DACB] cursor-pointer whitespace-nowrap shadow-2xs"
                title="Track Booking Reference"
                aria-label="Track Booking Status"
              >
                <Search className="w-3.5 h-3.5 text-[#C9AA72] shrink-0" />
                <span className="hidden xl:inline">Track</span>
              </button>

              <button
                type="button"
                onClick={() => handleLinkClick('/book')}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#173D35] hover:bg-[#0F2722] text-[#F5F1E8] font-bold text-xs uppercase tracking-wider border border-[#C9AA72]/40 shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                <CalendarDays className="w-4 h-4 text-[#C9AA72] shrink-0" />
                <span>Book Venue</span>
              </button>
            </div>

            {/* Mobile / Tablet Controls */}
            <div className="flex lg:hidden items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleLinkClick('/book')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#173D35] text-[#F5F1E8] font-semibold text-xs uppercase tracking-wider shadow-2xs active:scale-95 whitespace-nowrap"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#C9AA72]" />
                <span>Book</span>
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

      {/* Banquet Hall Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/50 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-t border-[#E2DACB]">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E2DACB] flex items-center justify-between bg-[#173D35] text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0D241F] border border-[#C9AA72]/40 flex items-center justify-center">
                  <span className="font-serif-heading font-bold text-xs text-[#D9C194]">HH</span>
                </div>
                <div>
                  <span className="font-bold text-white text-base font-serif-heading block leading-tight">
                    H H Events &amp; Conventions
                  </span>
                  <span className="text-[10px] text-[#D9C194] font-medium tracking-wide">
                    Panemangalore &bull; Bantwal
                  </span>
                </div>
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

            {/* Drawer Links */}
            <div className="p-4 space-y-1 overflow-y-auto flex-1 bg-[#FAF8F5]">
              {allLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleLinkClick(link.path)}
                    className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
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
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-sm font-semibold text-[#252525] hover:bg-white border border-dashed border-[#E2DACB] mt-2 bg-white/60"
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

              <div className="flex items-center justify-center text-xs text-[#737373] pt-1">
                <a
                  href={`tel:${VENUE_INFO.primaryPhone}`}
                  className="flex items-center gap-1.5 text-[#173D35] hover:underline font-semibold"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C9AA72]" />
                  <span>Call Venue Office: {VENUE_INFO.primaryPhone}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
