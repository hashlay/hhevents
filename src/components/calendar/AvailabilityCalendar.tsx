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
  AlertCircle,
  Sparkles,
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
  selectedHall?: HallTarget;
  onSelectHall?: (hall: HallTarget) => void;
  className?: string;
  onBookSlot?: (hall: HallTarget, date: string, slot: SlotTarget) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  onSelectDate,
  selectedDate: initialSelectedDate,
  initialHall = 'hall_1',
  selectedHall,
  onSelectHall,
  className = '',
  onBookSlot,
}) => {
  const today = new Date();

  const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());

  // Ensure default selected date is never in the past
  const [selectedDate, setSelectedDate] = useState<string>(
    initialSelectedDate && initialSelectedDate >= todayStr ? initialSelectedDate : todayStr
  );
  const [internalActiveHall, setInternalActiveHall] = useState<HallTarget>(initialHall);
  const activeHall = selectedHall !== undefined ? selectedHall : internalActiveHall;

  const handleHallChange = (newHall: HallTarget) => {
    setInternalActiveHall(newHall);
    if (onSelectHall) {
      onSelectHall(newHall);
    }
  };

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

  // Prevent navigating to past months
  const canGoPrev =
    currentYear > today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth > today.getMonth());

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
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
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(todayStr);
    if (onSelectDate) onSelectDate(todayStr);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handleDateClick = (dateStr: string) => {
    // Strictly prevent selecting past dates
    if (dateStr < todayStr) return;
    setSelectedDate(dateStr);
    if (onSelectDate) onSelectDate(dateStr);
  };

  const getHallDisplayName = (h: HallTarget) => {
    switch (h) {
      case 'hall_1':
        return 'Hall 1 (Gents Wing)';
      case 'hall_2':
        return 'Hall 2 (Ladies Wing)';
      case 'both':
        return 'Combined Hall (Full Venue)';
    }
  };

  const isSelectedDatePast = selectedDate < todayStr;

  // Status for selected date & active hall
  const daySlotAvailable = !isSelectedDatePast && isSlotAvailable(activeHall, selectedDate, 'day');
  const eveningSlotAvailable = !isSelectedDatePast && isSlotAvailable(activeHall, selectedDate, 'evening');

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
    if (isSelectedDatePast) return;
    if (onBookSlot) {
      onBookSlot(activeHall, selectedDate, slot);
    } else {
      const hallParam = activeHall;
      window.location.href = `/book?hall=${hallParam}&date=${selectedDate}&slot=${slot}`;
    }
  };

  return (
    <div className={`bg-white rounded-3xl overflow-hidden border border-[#E2DACB] shadow-sm text-[#252525] ${className}`}>
      {/* =========================================================================
          STEP 1: SELECT VENUE SPACE
         ========================================================================= */}
      <div className="bg-[#FAF8F5] p-5 sm:p-6 border-b border-[#E2DACB]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9AA72] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#173D35] text-[#D9C194] text-[9.5px] font-bold flex items-center justify-center">1</span>
              Step 1: Select Venue Space
            </span>
            <h3 className="text-xl font-bold font-serif-heading text-[#173D35] tracking-tight">
              Choose Hall Wing
            </h3>
            <p className="text-xs text-[#4A4A4A]">Independent wings operate with dedicated dining &amp; kitchen</p>
          </div>
          <span className="text-xs text-[#173D35] bg-[#F5F1E8] border border-[#E2DACB] px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 w-fit shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C9AA72]" />
            Live Real-Time Availability
          </span>
        </div>

        {/* 3 Executive Hall Option Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Hall 1 Tab */}
          <button
            type="button"
            onClick={() => handleHallChange('hall_1')}
            className={`p-4 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
              activeHall === 'hall_1'
                ? 'bg-[#173D35] text-white border-[#173D35] shadow-md ring-2 ring-[#C9AA72]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#252525] border-[#E2DACB]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold tracking-wide">Hall 1 (Gents Wing)</span>
                <span
                  className={`text-[9.5px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    activeHall === 'hall_1'
                      ? 'bg-[#C9AA72] text-[#173D35]'
                      : 'bg-[#F5F1E8] text-[#173D35] border border-[#E2DACB]'
                  }`}
                >
                  Independent
                </span>
              </div>
              <p
                className={`text-xs ${
                  activeHall === 'hall_1' ? 'text-white/85' : 'text-[#737373]'
                }`}
              >
                Up to 600 Guests &bull; Single Dining &bull; Kitchen
              </p>
            </div>
          </button>

          {/* Hall 2 Tab */}
          <button
            type="button"
            onClick={() => handleHallChange('hall_2')}
            className={`p-4 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
              activeHall === 'hall_2'
                ? 'bg-[#173D35] text-white border-[#173D35] shadow-md ring-2 ring-[#C9AA72]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#252525] border-[#E2DACB]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold tracking-wide">Hall 2 (Ladies Wing)</span>
                <span
                  className={`text-[9.5px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    activeHall === 'hall_2'
                      ? 'bg-[#C9AA72] text-[#173D35]'
                      : 'bg-[#F5F1E8] text-[#173D35] border border-[#E2DACB]'
                  }`}
                >
                  Independent
                </span>
              </div>
              <p
                className={`text-xs ${
                  activeHall === 'hall_2' ? 'text-white/85' : 'text-[#737373]'
                }`}
              >
                Up to 600 Guests &bull; Single Dining &bull; Kitchen
              </p>
            </div>
          </button>

          {/* Combined Hall Tab */}
          <button
            type="button"
            onClick={() => handleHallChange('both')}
            className={`p-4 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
              activeHall === 'both'
                ? 'bg-[#173D35] text-white border-[#173D35] shadow-md ring-2 ring-[#C9AA72]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#252525] border-[#E2DACB]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold tracking-wide">Combined Hall</span>
                <span
                  className={`text-[9.5px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    activeHall === 'both'
                      ? 'bg-[#C9AA72] text-[#173D35]'
                      : 'bg-[#FAF8F5] text-[#173D35] border border-[#E2DACB]'
                  }`}
                >
                  Full Campus
                </span>
              </div>
              <p
                className={`text-xs ${
                  activeHall === 'both' ? 'text-white/85' : 'text-[#737373]'
                }`}
              >
                Up to 3,000 Floating Guests &bull; Dual Dining
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          STEP 2: SELECT DATE (WITH ALL PREVIOUS DATES STRICTLY DISABLED)
         ========================================================================= */}
      <div className="p-4 sm:p-6 bg-white border-b border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9AA72] flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#173D35] text-[#D9C194] text-[9.5px] font-bold flex items-center justify-center">2</span>
            Step 2: Pick an Upcoming Date
          </span>
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-[#C9AA72]" />
            <h4 className="text-xl sm:text-2xl font-bold text-[#173D35] font-serif-heading">
              {monthNames[currentMonth]} {currentYear}
            </h4>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={!canGoPrev}
            className={`p-2 rounded-xl border border-[#E2DACB] transition-colors ${
              canGoPrev
                ? 'bg-[#FAF8F5] hover:bg-[#EDE6D8] text-[#252525] cursor-pointer'
                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-40'
            }`}
            aria-label="Previous Month"
            title={canGoPrev ? 'Previous Month' : 'Past months are disabled'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCurrentMonth}
            className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EDE6D8] text-xs text-[#173D35] border border-[#E2DACB] transition-colors font-bold cursor-pointer shadow-2xs"
          >
            Current Month
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
          {/* Offset blank cells for first day of month */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[50px] sm:min-h-[64px] rounded-xl bg-[#FAF8F5]/40" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDateKey(currentYear, currentMonth, day);
            const isPastDate = dateStr < todayStr;
            const isSelected = selectedDate === dateStr && !isPastDate;
            const isToday = todayStr === dateStr;

            const summary = isPastDate ? 'past' : getDayAvailabilitySummary(activeHall, dateStr);
            const daySlotOpen = isPastDate ? false : isSlotAvailable(activeHall, dateStr, 'day');
            const eveSlotOpen = isPastDate ? false : isSlotAvailable(activeHall, dateStr, 'evening');

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isPastDate}
                onClick={() => handleDateClick(dateStr)}
                className={`min-h-[52px] sm:min-h-[68px] p-1 sm:p-2 rounded-xl text-left transition-all relative flex flex-col justify-between items-center sm:items-stretch border ${
                  isPastDate
                    ? 'bg-slate-100/70 border-slate-200/60 text-slate-300 cursor-not-allowed opacity-40 select-none shadow-none'
                    : isSelected
                    ? 'bg-[#F5F1E8] border-[#C9AA72] shadow-sm ring-2 ring-[#C9AA72]/60 cursor-pointer'
                    : summary === 'unavailable'
                    ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300 cursor-pointer'
                    : summary === 'partial'
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300 cursor-pointer'
                    : 'bg-white border-[#E2DACB] hover:border-[#D6CCA9] hover:bg-[#FAF8F5] cursor-pointer'
                }`}
                aria-label={`${dateStr}: ${
                  isPastDate
                    ? 'Past Date (Disabled)'
                    : summary === 'unavailable'
                    ? 'Booked'
                    : summary === 'partial'
                    ? '1 Session Open'
                    : 'Available'
                }`}
              >
                {/* Day Number and Badges */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[11px] sm:text-xs font-bold leading-tight ${
                      isPastDate
                        ? 'text-slate-400 font-normal'
                        : isSelected
                        ? 'text-[#173D35] font-extrabold'
                        : summary === 'unavailable'
                        ? 'text-rose-700'
                        : 'text-[#252525]'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="hidden sm:inline text-[9px] font-bold text-[#173D35] bg-[#C9AA72]/20 border border-[#C9AA72] px-1 py-0.2 rounded">
                      Today
                    </span>
                  )}
                  {isToday && (
                    <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-[#C9AA72]" title="Today" />
                  )}
                </div>

                {/* Session status dots (Day dot, Evening dot) — Disabled for past dates */}
                {isPastDate ? (
                  <div className="flex items-center gap-1 my-0.5 opacity-20">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-300" />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-300" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 my-0.5">
                    <span
                      title={`Day Session (10 AM–3 PM): ${daySlotOpen ? 'Available' : 'Unavailable'}`}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                        daySlotOpen ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span
                      title={`Evening Session (6 PM–10 PM): ${eveSlotOpen ? 'Available' : 'Unavailable'}`}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                        eveSlotOpen ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                )}

                {/* Micro Label */}
                {isPastDate ? (
                  <>
                    <span className="text-[9px] font-medium text-slate-400 hidden sm:block">Past</span>
                    <span className="text-[8px] font-medium text-slate-400 sm:hidden">&mdash;</span>
                  </>
                ) : (
                  <>
                    <span
                      className={`text-[9px] font-bold leading-tight truncate max-w-full hidden sm:block ${
                        summary === 'unavailable'
                          ? 'text-rose-700'
                          : summary === 'partial'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {summary === 'unavailable' ? 'Booked' : summary === 'partial' ? '1 Open' : 'Open'}
                    </span>
                    <span
                      className={`sm:hidden text-[8px] font-bold leading-none ${
                        summary === 'unavailable'
                          ? 'text-rose-700'
                          : summary === 'partial'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {summary === 'unavailable' ? '✕' : summary === 'partial' ? '½' : '✓'}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-[#E2DACB] flex flex-wrap items-center justify-between gap-3 text-xs text-[#4A4A4A]">
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
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
            <span className="flex items-center gap-1.5 opacity-60">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Past (Disabled)</span>
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#737373]">
            Dot 1: Day (10 AM&ndash;3 PM) &bull; Dot 2: Evening (6 PM&ndash;10 PM)
          </span>
        </div>

        {/* =========================================================================
            STEP 3: CHOOSE SESSION SLOT & BOOK INSTANTLY
           ========================================================================= */}
        <div className="p-5 sm:p-7 rounded-3xl bg-[#FAF8F5] border border-[#E2DACB] space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DACB] pb-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9AA72] flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#173D35] text-[#D9C194] text-[9.5px] font-bold flex items-center justify-center">3</span>
                Step 3: Choose Session Slot &amp; Reserve
              </span>
              <h4 className="text-xl sm:text-2xl font-bold text-[#173D35] font-serif-heading">
                {readableDate}
              </h4>
              <p className="text-xs text-[#4A4A4A]">
                Selected Space: <strong className="text-[#173D35] font-semibold">{getHallDisplayName(activeHall)}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-[#E2DACB] text-[#173D35] shadow-2xs">
                {activeHall === 'both' ? 'Full Combined Venue' : `${getHallDisplayName(activeHall)}`}
              </span>
            </div>
          </div>

          {/* Past Date Alert (if any) */}
          {isSelectedDatePast ? (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-bold block">Past Date Selected</strong>
                <p className="text-xs text-amber-800 mt-0.5">
                  Reservations cannot be made for past dates. Please pick today ({todayStr}) or an upcoming date on the calendar above.
                </p>
              </div>
            </div>
          ) : (
            /* Two Premium Session Cards: Day Session and Evening Session */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Day Session Card */}
              <div
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  daySlotAvailable
                    ? 'bg-white border-emerald-300 text-[#252525] shadow-sm hover:shadow-md'
                    : 'bg-white/70 border-rose-200 text-[#737373]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#C9AA72]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#173D35]">
                          Day Session
                        </span>
                      </div>
                      <p className="text-lg font-bold font-mono text-[#252525] mt-1">
                        10:00 AM &ndash; 3:00 PM
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        daySlotAvailable
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-700'
                      }`}
                    >
                      {daySlotAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-500" /> Booked
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-[#4A4A4A] leading-relaxed">
                    Designed for wedding ceremonies, muhurtham rituals, nikah celebrations, and community lunch feasts.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-[#737373]">
                    {daySlotAvailable ? 'Instant reservation open' : 'Already reserved on this date'}
                  </span>
                  {daySlotAvailable ? (
                    <Button
                      onClick={() => handleBook('day')}
                      variant="gold"
                      size="sm"
                      className="w-full sm:w-auto justify-center font-bold"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Book Day Session
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-rose-600">
                      Slot Occupied
                    </span>
                  )}
                </div>
              </div>

              {/* Evening Session Card */}
              <div
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  eveningSlotAvailable
                    ? 'bg-white border-emerald-300 text-[#252525] shadow-sm hover:shadow-md'
                    : 'bg-white/70 border-rose-200 text-[#737373]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#C9AA72]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#173D35]">
                          Evening Session
                        </span>
                      </div>
                      <p className="text-lg font-bold font-mono text-[#252525] mt-1">
                        6:00 PM &ndash; 10:00 PM
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        eveningSlotAvailable
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-700'
                      }`}
                    >
                      {eveningSlotAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-500" /> Booked
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-[#4A4A4A] leading-relaxed">
                    Designed for grand wedding receptions, walima banquets, evening dinners, and musical cultural galas.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-[#737373]">
                    {eveningSlotAvailable ? 'Instant reservation open' : 'Already reserved on this date'}
                  </span>
                  {eveningSlotAvailable ? (
                    <Button
                      onClick={() => handleBook('evening')}
                      variant="gold"
                      size="sm"
                      className="w-full sm:w-auto justify-center font-bold"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Book Evening Session
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-rose-600">
                      Slot Occupied
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Operational Clarity Note */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2DACB] text-xs text-[#4A4A4A] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#C9AA72] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-[#173D35]">Dual Independence Guarantee:</strong>
              <p>
                Hall 1 and Hall 2 have separate entrances, dedicated dining halls, and separate kitchen links. Booking Hall 1 leaves Hall 2 completely free for another host, and vice-versa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
