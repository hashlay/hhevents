import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  HallTarget,
  SlotTarget,
  isSlotAvailable,
  getDayAvailabilitySummary,
  subscribeAvailability,
} from '../../services/availabilityManager';
import { Button } from '../ui/Button';

interface AvailabilityCalendarProps {
  onSelectDate?: (dateStr: string) => void;
  selectedDate?: string;
  initialHall?: HallTarget;
  className?: string;
  onBookSlot?: (hall: HallTarget, date: string, slot: SlotTarget) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  onSelectDate,
  selectedDate: initialSelectedDate,
  initialHall = 'hall_1',
  className = '',
  onBookSlot,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    initialSelectedDate || today.toISOString().split('T')[0]
  );
  const [activeHall, setActiveHall] = useState<HallTarget>(initialHall);

  // Re-render listener for instant reactive sync when manager toggles availability
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribeAvailability(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    const todayStr = now.toISOString().split('T')[0];
    setSelectedDate(todayStr);
    if (onSelectDate) onSelectDate(todayStr);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (onSelectDate) onSelectDate(dateStr);
  };

  const getHallDisplayName = (h: HallTarget) => {
    switch (h) {
      case 'hall_1':
        return 'Hall 1';
      case 'hall_2':
        return 'Hall 2';
      case 'both':
        return 'Combined Hall';
    }
  };

  const getHallDescription = (h: HallTarget) => {
    switch (h) {
      case 'hall_1':
        return 'Single independent hall section with dedicated dining & kitchen.';
      case 'hall_2':
        return 'Single independent hall section with dedicated dining & kitchen.';
      case 'both':
        return 'Full venue reserved together (Hall 1 + Hall 2 Combined for grand conventions).';
    }
  };

  // Status for selected date & active hall
  const daySlotAvailable = isSlotAvailable(activeHall, selectedDate, 'day');
  const eveningSlotAvailable = isSlotAvailable(activeHall, selectedDate, 'evening');

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const readableDate = isNaN(selectedDateObj.getTime())
    ? selectedDate
    : selectedDateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const handleBook = (slot: SlotTarget) => {
    if (onBookSlot) {
      onBookSlot(activeHall, selectedDate, slot);
    } else {
      const hallParam = activeHall;
      window.location.href = `/book?hall=${hallParam}&date=${selectedDate}&slot=${slot}`;
    }
  };

  return (
    <div className={`bg-white rounded-3xl overflow-hidden border border-[#E2DACB] shadow-sm text-[#252525] ${className}`}>
      {/* 3 Prominent Hall Options/Tabs */}
      <div className="bg-[#FAF8F5] p-5 sm:p-6 border-b border-[#E2DACB]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5F1E8] border border-[#E2DACB] flex items-center justify-center text-[#C9AA72]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif-heading text-[#252525] tracking-wide">
                Select Venue Section
              </h3>
              <p className="text-xs text-[#4A4A4A]">Independent halls bookable separately</p>
            </div>
          </div>
          <span className="text-xs text-[#173D35] bg-[#F5F1E8] border border-[#E2DACB] px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5 text-[#C9AA72]" />
            Live Real-Time Calendar
          </span>
        </div>

        {/* 3 Separate Options/Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Hall 1 Tab */}
          <button
            type="button"
            onClick={() => setActiveHall('hall_1')}
            className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
              activeHall === 'hall_1'
                ? 'bg-[#F5F1E8] text-[#173D35] border-[#E2DACB] font-bold shadow-2xs ring-1 ring-[#C9AA72]/30'
                : 'bg-white hover:bg-[#EDE6D8] text-[#252525] border-[#E2DACB]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-extrabold tracking-wide">Hall 1</span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  activeHall === 'hall_1'
                    ? 'bg-[#C9AA72] text-white'
                    : 'bg-[#FAF8F5] text-[#737373] border border-[#E2DACB]'
                }`}
              >
                Independent
              </span>
            </div>
            <p
              className={`text-xs ${
                activeHall === 'hall_1' ? 'text-[#4A4A4A] font-medium' : 'text-[#737373]'
              }`}
            >
              Single Hall + Dining + Kitchen
            </p>
          </button>

          {/* Hall 2 Tab */}
          <button
            type="button"
            onClick={() => setActiveHall('hall_2')}
            className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
              activeHall === 'hall_2'
                ? 'bg-[#F5F1E8] text-[#173D35] border-[#E2DACB] font-bold shadow-2xs ring-1 ring-[#C9AA72]/30'
                : 'bg-white hover:bg-[#EDE6D8] text-[#252525] border-[#E2DACB]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-extrabold tracking-wide">Hall 2</span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  activeHall === 'hall_2'
                    ? 'bg-[#C9AA72] text-white'
                    : 'bg-[#FAF8F5] text-[#737373] border border-[#E2DACB]'
                }`}
              >
                Independent
              </span>
            </div>
            <p
              className={`text-xs ${
                activeHall === 'hall_2' ? 'text-[#4A4A4A] font-medium' : 'text-[#737373]'
              }`}
            >
              Single Hall + Dining + Kitchen
            </p>
          </button>

          {/* Combined Hall Tab */}
          <button
            type="button"
            onClick={() => setActiveHall('both')}
            className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
              activeHall === 'both'
                ? 'bg-[#F5F1E8] text-[#173D35] border-[#E2DACB] font-bold shadow-2xs ring-1 ring-[#C9AA72]/30'
                : 'bg-white hover:bg-[#EDE6D8] text-[#252525] border-[#E2DACB]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-extrabold tracking-wide">Combined Hall</span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  activeHall === 'both'
                    ? 'bg-[#C9AA72] text-white'
                    : 'bg-[#FAF8F5] text-[#737373] border border-[#E2DACB]'
                }`}
              >
                Full Venue
              </span>
            </div>
            <p
              className={`text-xs ${
                activeHall === 'both' ? 'text-[#4A4A4A] font-medium' : 'text-[#737373]'
              }`}
            >
              Both Halls Reserved Together
            </p>
          </button>
        </div>

        {/* Informational Guidance bar */}
        <div className="mt-3 pt-3 border-t border-[#E2DACB] flex items-center justify-between text-xs text-[#4A4A4A]">
          <span className="truncate">{getHallDescription(activeHall)}</span>
          <span className="text-emerald-700 font-semibold shrink-0 ml-2">
            &bull; Hall 1 &amp; Hall 2 Book Independently
          </span>
        </div>
      </div>

      {/* Calendar Header with Navigation */}
      <div className="p-4 sm:p-6 bg-white border-b border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F1E8] border border-[#E2DACB] flex items-center justify-center text-[#C9AA72]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-[#252525] font-serif-heading">
              {monthNames[currentMonth]} {currentYear}
            </h4>
            <p className="text-xs text-[#4A4A4A]">
              Showing availability for <strong className="text-[#C9AA72]">{getHallDisplayName(activeHall)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EDE6D8] text-[#252525] border border-[#E2DACB] transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCurrentMonth}
            className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EDE6D8] text-xs text-[#252525] border border-[#E2DACB] transition-colors font-semibold cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EDE6D8] text-[#252525] border border-[#E2DACB] transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Calendar Body */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center border-b border-[#E2DACB] pb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <span
              key={d}
              className={`text-[11px] font-bold uppercase tracking-wider ${
                i === 0 ? 'text-[#C9AA72]' : 'text-[#737373]'
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Offset blank cells */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[58px] sm:min-h-[64px] rounded-xl bg-[#FAF8F5]/60" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDateKey(currentYear, currentMonth, day);
            const isSelected = selectedDate === dateStr;
            const isToday =
              today.getFullYear() === currentYear &&
              today.getMonth() === currentMonth &&
              today.getDate() === day;

            const summary = getDayAvailabilitySummary(activeHall, dateStr);
            const daySlotOpen = isSlotAvailable(activeHall, dateStr, 'day');
            const eveSlotOpen = isSlotAvailable(activeHall, dateStr, 'evening');

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDateClick(dateStr)}
                className={`min-h-[60px] sm:min-h-[68px] p-1.5 sm:p-2 rounded-xl text-left transition-all relative flex flex-col justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-[#F5F1E8] border-[#C9AA72] shadow-xs ring-2 ring-[#C9AA72]/30'
                    : summary === 'unavailable'
                    ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                    : summary === 'partial'
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                    : 'bg-white border-[#E2DACB] hover:border-[#D6CCA9] hover:bg-[#FAF8F5]'
                }`}
              >
                {/* Day Number and Today Badge */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-bold ${
                      isSelected
                        ? 'text-[#173D35] font-extrabold'
                        : summary === 'unavailable'
                        ? 'text-rose-700'
                        : 'text-[#252525]'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-bold text-[#173D35] bg-[#F5F1E8] border border-[#E2DACB] px-1 py-0.2 rounded">
                      Today
                    </span>
                  )}
                </div>

                {/* Session status dots */}
                <div className="flex items-center gap-1 my-0.5">
                  <span
                    title={`Day Session (10 AM–3 PM): ${daySlotOpen ? 'Available' : 'Unavailable'}`}
                    className={`w-2 h-2 rounded-full ${
                      daySlotOpen ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span
                    title={`Evening Session (6 PM–10 PM): ${eveSlotOpen ? 'Available' : 'Unavailable'}`}
                    className={`w-2 h-2 rounded-full ${
                      eveSlotOpen ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </div>

                {/* Text indicator */}
                <span
                  className={`text-[9px] font-bold leading-tight ${
                    summary === 'unavailable'
                      ? 'text-rose-700'
                      : summary === 'partial'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {summary === 'unavailable' ? 'Booked' : summary === 'partial' ? '1 Open' : 'Open'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-[#E2DACB] flex flex-wrap items-center justify-between gap-3 text-xs text-[#4A4A4A]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>1 Session Open</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Booked</span>
            </span>
          </div>
          <span className="text-[11px] text-[#737373]">
            Dot 1: Day (10 AM–3 PM) &bull; Dot 2: Evening (6 PM–10 PM)
          </span>
        </div>

        {/* Selected Date Session Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DACB] pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">
                Selected Date Schedule
              </span>
              <h4 className="text-xl font-bold text-[#252525] font-serif-heading mt-0.5">
                {readableDate}
              </h4>
              <p className="text-xs text-[#4A4A4A]">
                Venue Section:{' '}
                <strong className="text-[#252525] font-semibold">{getHallDisplayName(activeHall)}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F5F1E8] border border-[#E2DACB] text-[#173D35]">
                {activeHall === 'both' ? 'Combined Hall' : `${getHallDisplayName(activeHall)} (Independent)`}
              </span>
            </div>
          </div>

          {/* Two Session Slot Cards (10:00 AM – 3:00 PM and 6:00 PM – 10:00 PM) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day Session Card */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                daySlotAvailable
                  ? 'bg-white border-emerald-200 text-[#252525] shadow-2xs'
                  : 'bg-white border-rose-200 text-[#4A4A4A]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#C9AA72]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#252525]">
                      Day Session
                    </span>
                  </div>
                  <p className="text-base font-bold font-mono text-[#252525] mt-0.5">
                    10:00 AM – 3:00 PM
                  </p>
                  <p className="text-xs text-[#4A4A4A] mt-0.5">
                    Ceremonies, Muhurtham, Nikah &amp; Lunch Feasts
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    daySlotAvailable
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {daySlotAvailable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> UNAVAILABLE
                    </>
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E2DACB] flex items-center justify-between">
                <span className="text-xs text-[#737373]">
                  {daySlotAvailable ? 'Open for reservation' : 'Slot reserved on this date'}
                </span>
                {daySlotAvailable ? (
                  <Button
                    onClick={() => handleBook('day')}
                    variant="gold"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Book Day Session
                  </Button>
                ) : (
                  <span className="text-xs font-semibold text-rose-600">
                    Slot Booked
                  </span>
                )}
              </div>
            </div>

            {/* Evening Session Card */}
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                eveningSlotAvailable
                  ? 'bg-white border-emerald-200 text-[#252525] shadow-2xs'
                  : 'bg-white border-rose-200 text-[#4A4A4A]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#C9AA72]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#252525]">
                      Evening Session
                    </span>
                  </div>
                  <p className="text-base font-bold font-mono text-[#252525] mt-0.5">
                    6:00 PM – 10:00 PM
                  </p>
                  <p className="text-xs text-[#4A4A4A] mt-0.5">
                    Grand Receptions, Dinner Banquets &amp; Cultural Galas
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    eveningSlotAvailable
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {eveningSlotAvailable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> UNAVAILABLE
                    </>
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E2DACB] flex items-center justify-between">
                <span className="text-xs text-[#737373]">
                  {eveningSlotAvailable ? 'Open for reservation' : 'Slot reserved on this date'}
                </span>
                {eveningSlotAvailable ? (
                  <Button
                    onClick={() => handleBook('evening')}
                    variant="gold"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Book Evening Session
                  </Button>
                ) : (
                  <span className="text-xs font-semibold text-rose-600">
                    Slot Booked
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Operational Clarity Note */}
          <div className="p-3.5 rounded-xl bg-white border border-[#E2DACB] text-xs text-[#4A4A4A] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#C9AA72] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-[#252525]">Dual Independence:</strong>
              <p>
                Hall 1 and Hall 2 operate independently with dedicated dining halls and kitchens. Combined Hall reserves both spaces together. Availability status updates immediately when modified by venue management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
