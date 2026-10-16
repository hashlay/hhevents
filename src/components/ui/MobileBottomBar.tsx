import React, { useState, useEffect } from 'react';
import { CalendarDays, PhoneCall } from 'lucide-react';
import { VENUE_INFO } from '../../services/hallData';

interface MobileBottomBarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ currentPath, navigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (currentPath !== '/') {
        setIsVisible(true);
      } else {
        setIsVisible(window.scrollY > 80);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPath]);

  // Don't render on Admin pages or Book page where it would obstruct form inputs & actions
  if (currentPath.startsWith('/admin') || currentPath === '/book') return null;

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 lg:hidden transition-transform duration-300 pb-safe ${
        isVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
    >
      <div className="mx-3 mb-2 p-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#E2DACB] shadow-lg flex items-center justify-between gap-2 text-[#252525]">
        {/* Quick Phone Call Button */}
        <a
          href={`tel:${VENUE_INFO.primaryPhone}`}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#F5F1E8] hover:bg-[#EDE6D8] text-[#173D35] border border-[#E2DACB] transition-colors shrink-0 text-center min-w-[62px]"
          aria-label="Call Venue Manager"
        >
          <PhoneCall className="w-4 h-4 text-[#C9AA72]" />
          <span className="text-[10px] font-semibold mt-0.5">Call</span>
        </a>

        {/* Check Dates Button */}
        <button
          type="button"
          onClick={() => navigate('/availability')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
            currentPath === '/availability'
              ? 'bg-[#173D35] border-[#173D35] text-[#FAF8F5]'
              : 'bg-[#F5F1E8] border-[#E2DACB] text-[#252525] hover:bg-[#EDE6D8]'
          }`}
        >
          <CalendarDays className={`w-4 h-4 ${currentPath === '/availability' ? 'text-[#C9AA72]' : 'text-[#173D35]'} shrink-0`} />
          <span className="truncate">Check Dates</span>
        </button>

        {/* Primary Book Hall Button */}
        <button
          type="button"
          onClick={() => navigate('/book')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#173D35] hover:bg-[#0F2722] text-[#FAF8F5] font-bold text-xs shadow-sm active:scale-95 transition-all border border-[#C9AA72]/30"
        >
          <CalendarDays className="w-4 h-4 text-[#C9AA72] shrink-0" />
          <span className="truncate">Book Hall</span>
        </button>
      </div>
    </div>
  );
};
