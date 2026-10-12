import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Save,
  Info,
} from 'lucide-react';
import {
  HallTarget,
  SlotTarget,
  getManagerAvailability,
  isSlotAvailable,
  getDayAvailabilitySummary,
  setSlotAvailability,
  setDayAvailability,
  resetDateToDefault,
  subscribeAvailability,
  DateAvailabilityEntry,
} from '../../services/availabilityManager';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ManagerAvailabilityCalendarProps {
  onDateSelected?: (dateStr: string) => void;
  className?: string;
}

export const ManagerAvailabilityCalendar: React.FC<ManagerAvailabilityCalendarProps> = ({
  onDateSelected,
  className = '',
}) => {
  const { showToast } = useToast();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().split('T')[0]
  );
  const [selectedHall, setSelectedHall] = useState<HallTarget>('hall_1');
  const [managerNote, setManagerNote] = useState<string>('');

  // Re-render trigger on reactive updates
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribeAvailability(() => {
      setTick((t) => t + 1);
    });
  }, []);

  // Update note when selectedDate changes
  useEffect(() => {
    const entry = getManagerAvailability(selectedDate);
    setManagerNote(entry.notes || '');
  }, [selectedDate]);

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

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    const todayStr = now.toISOString().split('T')[0];
    setSelectedDate(todayStr);
    if (onDateSelected) onDateSelected(todayStr);
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
    if (onDateSelected) onDateSelected(dateStr);
  };

  const getHallDisplayName = (h: HallTarget) => {
    switch (h) {
      case 'hall_1':
        return 'Hall 1';
      case 'hall_2':
        return 'Hall 2';
      case 'both':
        return 'Combined Hall (Both Halls)';
    }
  };

  // Toggle individual slot
  const handleToggleSlot = (slot: SlotTarget) => {
    const currentStatus = isSlotAvailable(selectedHall, selectedDate, slot);
    const newStatus = !currentStatus;

    setSlotAvailability(selectedHall, selectedDate, slot, newStatus, managerNote);

    const slotLabel = slot === 'day' ? 'Day Session (10 AM–3 PM)' : 'Evening Session (6 PM–10 PM)';
    showToast(
      `${getHallDisplayName(selectedHall)} on ${selectedDate}: marked ${newStatus ? 'AVAILABLE' : 'UNAVAILABLE'} for ${slotLabel}`,
      'success',
      'Availability Saved'
    );
  };

  // Mark entire day available or unavailable
  const handleSetWholeDay = (available: boolean) => {
    setDayAvailability(selectedHall, selectedDate, available, managerNote);
    showToast(
      `${getHallDisplayName(selectedHall)} on ${selectedDate}: marked ${available ? 'AVAILABLE' : 'UNAVAILABLE'} for Whole Day`,
      'success',
      'Whole Day Saved'
    );
  };

  const handleResetDate = () => {
    resetDateToDefault(selectedDate);
    setManagerNote('');
    showToast(
      `Restored default Availability for ${selectedDate}. All halls & slots are OPEN.`,
      'info',
      'Reset to Default'
    );
  };

  const handleSaveNote = () => {
    const current = getManagerAvailability(selectedDate);
    setSlotAvailability(
      selectedHall,
      selectedDate,
      'day',
      current.hall_1.day,
      managerNote.trim()
    );
    showToast('Manager reference note saved.', 'success');
  };

  // Status values for currently selected date and hall
  const dayAvailable = isSlotAvailable(selectedHall, selectedDate, 'day');
  const eveningAvailable = isSlotAvailable(selectedHall, selectedDate, 'evening');

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const readableDate = isNaN(selectedDateObj.getTime())
    ? selectedDate
    : selectedDateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hall Selector Tabs (Hall 1, Hall 2, Combined Hall) */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Select Venue Section:
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedHall('hall_1')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                selectedHall === 'hall_1'
                  ? 'bg-slate-900 text-amber-400 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              Hall 1 (Single)
            </button>

            <button
              onClick={() => setSelectedHall('hall_2')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                selectedHall === 'hall_2'
                  ? 'bg-slate-900 text-amber-400 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              Hall 2 (Single)
            </button>

            <button
              onClick={() => setSelectedHall('both')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                selectedHall === 'both'
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-600/30 font-black'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              Combined Hall
            </button>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            {selectedHall === 'hall_1' && 'Controlling Hall 1 independent availability.'}
            {selectedHall === 'hall_2' && 'Controlling Hall 2 independent availability.'}
            {selectedHall === 'both' && 'Controlling Combined Hall (both halls reserved together).'}
          </span>
          <span className="text-emerald-700 font-semibold">
            ● Hall 1 and Hall 2 operate independently
          </span>
        </div>
      </div>

      {/* Main Grid: Calendar Grid on Left, Control Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Month Calendar (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          {/* Calendar Header with Month Nav & Today */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-slate-900 font-serif-heading">
                {monthNames[currentMonth]} {currentYear}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center border-b border-slate-100 pb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <span
                key={d}
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  i === 0 ? 'text-amber-700' : 'text-slate-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty slots for previous month offset */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-xl bg-slate-50/50" />
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = formatDateKey(currentYear, currentMonth, day);
              const isSelected = selectedDate === dateKey;
              const isToday =
                today.getFullYear() === currentYear &&
                today.getMonth() === currentMonth &&
                today.getDate() === day;

              const summary = getDayAvailabilitySummary(selectedHall, dateKey);
              const daySlotOpen = isSlotAvailable(selectedHall, dateKey, 'day');
              const eveSlotOpen = isSlotAvailable(selectedHall, dateKey, 'evening');

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleDateClick(dateKey)}
                  className={`aspect-square p-1 sm:p-1.5 rounded-xl flex flex-col justify-between items-center transition-all relative border cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/20'
                      : summary === 'unavailable'
                      ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                      : summary === 'partial'
                      ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Day Number and Today Indicator */}
                  <div className="w-full flex items-center justify-between text-[11px] font-bold">
                    <span
                      className={`${
                        isSelected
                          ? 'text-amber-950 font-black'
                          : summary === 'unavailable'
                          ? 'text-rose-900'
                          : 'text-slate-800'
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Today" />
                    )}
                  </div>

                  {/* Slot Indicators: Day and Evening dots */}
                  <div className="w-full flex items-center justify-center gap-1 pt-0.5">
                    <span
                      title={`Day Session: ${daySlotOpen ? 'Available' : 'Unavailable'}`}
                      className={`w-2 h-2 rounded-full ${
                        daySlotOpen ? 'bg-emerald-500' : 'bg-rose-500 ring-1 ring-rose-300'
                      }`}
                    />
                    <span
                      title={`Evening Session: ${eveSlotOpen ? 'Available' : 'Unavailable'}`}
                      className={`w-2 h-2 rounded-full ${
                        eveSlotOpen ? 'bg-emerald-500' : 'bg-rose-500 ring-1 ring-rose-300'
                      }`}
                    />
                  </div>

                  {/* Micro label for state */}
                  <span
                    className={`text-[9px] font-semibold leading-tight ${
                      summary === 'unavailable'
                        ? 'text-rose-700'
                        : summary === 'partial'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {summary === 'unavailable' ? 'Closed' : summary === 'partial' ? '1 Open' : 'Open'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Legend at bottom of calendar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
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
                <span>Unavailable</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Dot 1: Day (10 AM) • Dot 2: Eve (6 PM)
            </span>
          </div>
        </div>

        {/* Right Column: Date Inspector & Manual Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="p-6 bg-white border border-slate-200 shadow-sm space-y-6">
            {/* Inspector Header */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Manager Date Control
                </span>
                <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {selectedDate}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-serif-heading mt-1">
                {readableDate}
              </h3>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                <Building2 className="w-3.5 h-3.5" />
                <span>{getHallDisplayName(selectedHall)}</span>
              </div>
            </div>

            {/* Session 1: Day Session Control */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                dayAvailable
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      Day Session
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-700">
                    10:00 AM – 3:00 PM
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Ceremonies, Muhurtham &amp; Lunch Feast
                  </p>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider shrink-0 ${
                    dayAvailable
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-rose-600 text-white shadow-xs'
                  }`}
                >
                  {dayAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-600">Change Day Session:</span>
                <button
                  type="button"
                  onClick={() => handleToggleSlot('day')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    dayAvailable
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {dayAvailable ? 'Mark Unavailable' : 'Mark Available'}
                </button>
              </div>
            </div>

            {/* Session 2: Evening Session Control */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                eveningAvailable
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      Evening Session
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-700">
                    6:00 PM – 10:00 PM
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Grand Receptions &amp; Dinner Galas
                  </p>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider shrink-0 ${
                    eveningAvailable
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-rose-600 text-white shadow-xs'
                  }`}
                >
                  {eveningAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-600">Change Evening Session:</span>
                <button
                  type="button"
                  onClick={() => handleToggleSlot('evening')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    eveningAvailable
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {eveningAvailable ? 'Mark Unavailable' : 'Mark Available'}
                </button>
              </div>
            </div>

            {/* Quick Whole Day Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick Actions for {selectedDate}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetWholeDay(true)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors text-center"
                >
                  Mark Whole Day Available
                </button>

                <button
                  type="button"
                  onClick={() => handleSetWholeDay(false)}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-colors text-center"
                >
                  Mark Whole Day Unavailable
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetDate}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset This Date to Default Available</span>
              </button>
            </div>

            {/* Optional Manager Reference Note */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Internal Manager Note (Private):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  placeholder="e.g. VIP reservation / hall maintenance"
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Button
                  onClick={handleSaveNote}
                  variant="outline"
                  size="sm"
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save
                </Button>
              </div>
              <p className="text-[10px] text-slate-400">
                Private reference only. Never shown on the public website.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
