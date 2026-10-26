import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  Wrench,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  Building2,
  Phone,
  MessageSquare,
  Lock,
  Unlock,
  RotateCcw,
  User,
  Tag,
  Ban,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AvailabilityCalendar } from '../../components/calendar/AvailabilityCalendar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookingStatusBadge } from '../../components/ui/Badge';
import {
  getStoredBookings,
  getStoredMaintenance,
  updateBookingStatusAsync,
  generateBookingId,
} from '../../services/bookingStorage';
import { syncBookingsFromServer, saveBookingAsync } from '../../services/storageService';
import {
  HallTarget,
  SlotTarget,
  isSlotAvailable,
  setSlotAvailability,
  setDayAvailability,
  resetDateToDefault,
  subscribeAvailability,
  syncAvailabilityFromServer,
} from '../../services/availabilityManager';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { BookingRequest } from '../../types';

interface AdminCalendarPageProps {
  navigate: (path: string) => void;
}

export const AdminCalendarPage: React.FC<AdminCalendarPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // Default to Combined Hall ('both') per requirements
  const [selectedHall, setSelectedHall] = useState<HallTarget>('both');
  const [bookings, setBookings] = useState<BookingRequest[]>(getStoredBookings());
  const [maintenance, setMaintenance] = useState(getStoredMaintenance());
  const [isLoading, setIsLoading] = useState(false);
  const [, setTick] = useState(0);

  // Quick reservation modal state
  const [isQuickBookModalOpen, setIsQuickBookModalOpen] = useState(false);
  const [quickBookForm, setQuickBookForm] = useState<{
    customerName: string;
    phone: string;
    hall: HallTarget;
    slot: SlotTarget;
    eventTitle: string;
    estimatedRent: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountReason: string;
    advancePaid: number;
  }>({
    customerName: '',
    phone: '',
    hall: 'both',
    slot: 'day',
    eventTitle: 'Private Function',
    estimatedRent: 65000,
    discountType: 'fixed',
    discountValue: 0,
    discountReason: '',
    advancePaid: 15000,
  });

  // Subscribe to live availability updates
  useEffect(() => {
    return subscribeAvailability(() => {
      setTick((t) => t + 1);
    });
  }, []);

  // Sync bookings & server availability on mount
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const fresh = await syncBookingsFromServer();
        await syncAvailabilityFromServer();
        if (mounted) {
          setBookings(fresh);
        }
      } catch (err) {
        if (mounted) {
          setBookings(getStoredBookings());
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to determine if a booking occupies or conflicts with the selected hall
  const isBookingOccupying = (b: BookingRequest, targetHall: HallTarget) => {
    const rawHall = (b as any).hallSelection || b.hall || '';
    const pkgId = (b.packageId || '').toLowerCase();
    const pkgName = ((b as any).packageName || '').toLowerCase();
    const resources: string[] = Array.isArray((b as any).occupiedResources) ? (b as any).occupiedResources : [];

    const isFullCampus =
      rawHall === 'both' ||
      pkgId.includes('full') ||
      pkgName.includes('full') ||
      pkgName.includes('combined') ||
      (resources.includes('gents_hall') && resources.includes('ladies_hall'));

    const isHall1 =
      rawHall === 'hall_1' ||
      pkgId.includes('single') ||
      pkgName.includes('gents') ||
      resources.includes('gents_hall');

    const isHall2 =
      rawHall === 'hall_2' ||
      pkgName.includes('ladies') ||
      resources.includes('ladies_hall');

    if (targetHall === 'both') {
      // Combined hall is unavailable if ANY hall is booked (Full Campus, Hall 1, or Hall 2)
      return isFullCampus || isHall1 || isHall2;
    }

    if (targetHall === 'hall_1') {
      // Hall 1 is unavailable if Full Campus is booked OR Hall 1 is booked
      return isFullCampus || isHall1;
    }

    if (targetHall === 'hall_2') {
      // Hall 2 is unavailable if Full Campus is booked OR Hall 2 is booked
      return isFullCampus || isHall2;
    }

    return isFullCampus;
  };

  // Filter bookings strictly for the selected hall & date
  const hallBookingsOnDate = bookings.filter((b) => {
    const isDateMatch = b.date === selectedDate || b.eventDate === selectedDate;
    if (!isDateMatch) return false;
    // Exclude cancelled / rejected bookings - they immediately free the slot
    const st = (b.status || '').toUpperCase();
    if (st === 'CANCELLED' || st === 'REJECTED') return false;

    return isBookingOccupying(b, selectedHall);
  });

  // Separate day session booking vs evening session booking
  const dayBooking = hallBookingsOnDate.find((b) => b.slot === 'day');
  const eveningBooking = hallBookingsOnDate.find((b) => b.slot === 'evening');

  // Check availability state (via Manager Availability Engine)
  const isDayAvailable = isSlotAvailable(selectedHall, selectedDate, 'day');
  const isEveningAvailable = isSlotAvailable(selectedHall, selectedDate, 'evening');

  // Maintenance tasks for this date
  const selectedMaintenance = maintenance.filter((m) => m.scheduledDate === selectedDate);

  const getHallTitle = (h: HallTarget) => {
    switch (h) {
      case 'hall_1':
        return 'Hall 1 (Gents Wing)';
      case 'hall_2':
        return 'Hall 2 (Ladies Wing)';
      case 'both':
        return 'Combined Hall (Full Campus)';
    }
  };

  // 1-Tap Toggle Slot Availability
  const handleToggleSlot = (slot: SlotTarget) => {
    const currentOpen = isSlotAvailable(selectedHall, selectedDate, slot);
    const newTarget = !currentOpen;
    setSlotAvailability(
      selectedHall,
      selectedDate,
      slot,
      newTarget,
      newTarget ? 'Made Available by Manager' : 'Blocked by Manager'
    );
    showToast(
      newTarget
        ? `${slot === 'day' ? 'Day Session' : 'Evening Session'} is now OPEN for ${getHallTitle(selectedHall)}`
        : `${slot === 'day' ? 'Day Session' : 'Evening Session'} is now BLOCKED for ${getHallTitle(selectedHall)}`,
      newTarget ? 'success' : 'info'
    );
  };

  // Full day open/block actions
  const handleSetFullDay = (makeAvailable: boolean) => {
    setDayAvailability(
      selectedHall,
      selectedDate,
      makeAvailable,
      makeAvailable ? 'Full Day Opened by Manager' : 'Full Day Blocked by Manager'
    );
    showToast(
      makeAvailable
        ? `Full Day opened for ${getHallTitle(selectedHall)} on ${selectedDate}`
        : `Full Day blocked for ${getHallTitle(selectedHall)} on ${selectedDate}`,
      makeAvailable ? 'success' : 'info'
    );
  };

  // Reset overrides back to system default
  const handleResetDate = () => {
    resetDateToDefault(selectedDate);
    showToast(`Reset ${selectedDate} overrides back to default open state.`, 'info');
  };

  // Cancel / Release a customer booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm(`Are you sure you want to cancel booking #${bookingId} and release this slot?`)) {
      return;
    }
    try {
      await updateBookingStatusAsync(
        bookingId,
        'CANCELLED',
        'Released by manager via Master Calendar',
        user?.email || 'admin@hhevents.in'
      );
      const fresh = await syncBookingsFromServer();
      setBookings(fresh);
      await syncAvailabilityFromServer();
      showToast(`Booking #${bookingId} has been cancelled and the slot is freed up.`, 'success');
    } catch (err) {
      showToast('Failed to cancel booking. Please try again.', 'error');
    }
  };

  // Quick manual booking submission
  const handleSaveQuickBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookForm.customerName.trim() || !quickBookForm.phone.trim()) {
      showToast('Please enter both customer name and phone number.', 'error');
      return;
    }

    const baseRent = Number(quickBookForm.estimatedRent) || (quickBookForm.hall === 'both' ? 65000 : 30000);
    const discAmount = quickBookForm.discountValue > 0
      ? quickBookForm.discountType === 'percentage'
        ? Math.round((baseRent * quickBookForm.discountValue) / 100)
        : Math.min(baseRent, quickBookForm.discountValue)
      : 0;
    const netRent = Math.max(0, baseRent - discAmount);
    const advance = Number(quickBookForm.advancePaid) || 0;

    const newBooking: BookingRequest & any = {
      id: generateBookingId(),
      customerName: quickBookForm.customerName.trim(),
      phone: quickBookForm.phone.trim(),
      email: '',
      hall: quickBookForm.hall as any,
      slot: quickBookForm.slot,
      packageId: quickBookForm.hall === 'both' ? 'full-ac-hall' : (quickBookForm.hall === 'hall_2' ? 'hall-2-ac' : 'single-ac-hall'),
      date: selectedDate,
      status: 'CONFIRMED',
      acOption: 'ac',
      advancePaymentStatus: advance >= netRent && netRent > 0 ? 'fully_paid' : advance > 0 ? 'advance_paid' : 'unpaid',
      totalEstimate: netRent,
      amountPaid: advance,
      balanceDue: Math.max(0, netRent - advance),
      customDiscountAmount: discAmount > 0 ? discAmount : undefined,
      customDiscountReason: discAmount > 0 ? (quickBookForm.discountReason || 'Manager Direct Discount') : undefined,
      additionalInfo: quickBookForm.eventTitle || 'Manager Manual Reservation',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveBookingAsync(newBooking);
      const fresh = await syncBookingsFromServer();
      setBookings(fresh);
      await syncAvailabilityFromServer();
      setIsQuickBookModalOpen(false);
      setQuickBookForm({
        customerName: '',
        phone: '',
        hall: selectedHall,
        slot: 'day',
        eventTitle: 'Private Function',
        estimatedRent: selectedHall === 'both' ? 65000 : 30000,
        discountType: 'fixed',
        discountValue: 0,
        discountReason: '',
        advancePaid: 15000,
      });
      showToast(`Direct Reservation confirmed for ${newBooking.customerName} on ${selectedDate}.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save manual reservation.', 'error');
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      await updateBookingStatusAsync(
        bookingId,
        'APPROVED',
        'Approved by manager via Master Calendar',
        user?.email || 'admin@hhevents.in'
      );
      const fresh = await syncBookingsFromServer();
      setBookings(fresh);
      await syncAvailabilityFromServer();
      showToast(`Booking #${bookingId} has been successfully approved!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve booking.', 'error');
    }
  };

  const openQuickBook = (slot: SlotTarget) => {
    setQuickBookForm((prev) => ({
      ...prev,
      slot,
      hall: selectedHall,
      estimatedRent: selectedHall === 'both' ? 65000 : 30000,
      discountType: 'fixed',
      discountValue: 0,
      discountReason: '',
      advancePaid: 15000,
    }));
    setIsQuickBookModalOpen(true);
  };

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const formattedSelectedDate = isNaN(selectedDateObj.getTime())
    ? selectedDate
    : selectedDateObj.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  return (
    <AdminLayout
      currentPath="/admin/calendar"
      navigate={navigate}
      title="Master Hall Schedule & Availability"
      subtitle="Complete venue schedule, live booking inspector, and 1-tap manager slot availability control"
      actionButton={
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => openQuickBook('day')}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Direct Reservation
          </Button>
          <Button
            onClick={() => navigate('/admin/maintenance')}
            variant="outline"
            size="sm"
            leftIcon={<Wrench className="w-4 h-4" />}
          >
            Maintenance
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Interactive Calendar on Left (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <AvailabilityCalendar
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            selectedHall={selectedHall}
            onSelectHall={(h) => setSelectedHall(h)}
          />
        </div>

        {/* Unified Date Inspector & Slot Control Sidebar (1 col) */}
        <div className="space-y-6">
          <Card className="p-5 sm:p-6 space-y-5 border border-slate-200 shadow-sm bg-white rounded-2xl">
            {/* Inspector Header */}
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C9AA72] block">
                  {getHallTitle(selectedHall)}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{formattedSelectedDate}</h3>
              </div>
              <CalendarDays className="w-5 h-5 text-slate-400" />
            </div>

            {/* Quick Hall Selector Pills */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedHall('both')}
                className={`py-1.5 px-2 rounded-lg transition-all ${
                  selectedHall === 'both'
                    ? 'bg-[#173D35] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Combined
              </button>
              <button
                type="button"
                onClick={() => setSelectedHall('hall_1')}
                className={`py-1.5 px-2 rounded-lg transition-all ${
                  selectedHall === 'hall_1'
                    ? 'bg-[#173D35] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hall 1
              </button>
              <button
                type="button"
                onClick={() => setSelectedHall('hall_2')}
                className={`py-1.5 px-2 rounded-lg transition-all ${
                  selectedHall === 'hall_2'
                    ? 'bg-[#173D35] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hall 2
              </button>
            </div>

            {/* Session 1: Day Session (10 AM - 3 PM) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-[#FAF8F5] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#173D35]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Day Session (10 AM – 3 PM)
                  </span>
                </div>
                {dayBooking ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                    RESERVED
                  </span>
                ) : isDayAvailable ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    AVAILABLE
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    BLOCKED
                  </span>
                )}
              </div>

              {/* Day Booking Details if present */}
              {dayBooking ? (
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{dayBooking.id}</span>
                    <BookingStatusBadge status={dayBooking.status} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">
                      {dayBooking.customerName || dayBooking.applicantName}
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {dayBooking.additionalInfo || dayBooking.eventTitle || 'Day Session Event'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {dayBooking.phone && (
                        <>
                          <a
                            href={`https://wa.me/91${dayBooking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hello ${dayBooking.customerName || 'Customer'}, regarding your booking at H H Events on ${selectedDate} (Day Session)...`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${dayBooking.phone}`}
                            className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {dayBooking.status === 'PENDING' && (
                        <Button
                          variant="gold"
                          size="sm"
                          className="text-xs font-bold py-1 px-2.5 shadow-2xs"
                          onClick={() => handleApproveBooking(dayBooking.id)}
                        >
                          Approve Request
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(dayBooking.id)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline"
                      >
                        Cancel & Free Slot
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* No booking: 1-Tap Toggle and Quick Reserve */
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleSlot('day')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      isDayAvailable
                        ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                        : 'bg-[#173D35] hover:bg-[#123028] text-white border-[#173D35] shadow-xs'
                    }`}
                  >
                    {isDayAvailable ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Block Slot</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Make Available</span>
                      </>
                    )}
                  </button>

                  {isDayAvailable && (
                    <button
                      type="button"
                      onClick={() => openQuickBook('day')}
                      className="py-2 px-3 rounded-lg text-xs font-bold bg-[#F5F1E8] hover:bg-[#EDE6D8] text-[#173D35] border border-[#E2DACB] transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Book</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Session 2: Evening Session (6 PM - 10 PM) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-[#FAF8F5] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#173D35]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Evening Session (6 PM – 10 PM)
                  </span>
                </div>
                {eveningBooking ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                    RESERVED
                  </span>
                ) : isEveningAvailable ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    AVAILABLE
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    BLOCKED
                  </span>
                )}
              </div>

              {/* Evening Booking Details if present */}
              {eveningBooking ? (
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{eveningBooking.id}</span>
                    <BookingStatusBadge status={eveningBooking.status} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">
                      {eveningBooking.customerName || eveningBooking.applicantName}
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {eveningBooking.additionalInfo || eveningBooking.eventTitle || 'Evening Session Event'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {eveningBooking.phone && (
                        <>
                          <a
                            href={`https://wa.me/91${eveningBooking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hello ${eveningBooking.customerName || 'Customer'}, regarding your booking at H H Events on ${selectedDate} (Evening Session)...`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${eveningBooking.phone}`}
                            className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {eveningBooking.status === 'PENDING' && (
                        <Button
                          variant="gold"
                          size="sm"
                          className="text-xs font-bold py-1 px-2.5 shadow-2xs"
                          onClick={() => handleApproveBooking(eveningBooking.id)}
                        >
                          Approve Request
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(eveningBooking.id)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline"
                      >
                        Cancel & Free Slot
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* No booking: 1-Tap Toggle and Quick Reserve */
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleSlot('evening')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      isEveningAvailable
                        ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                        : 'bg-[#173D35] hover:bg-[#123028] text-white border-[#173D35] shadow-xs'
                    }`}
                  >
                    {isEveningAvailable ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Block Slot</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Make Available</span>
                      </>
                    )}
                  </button>

                  {isEveningAvailable && (
                    <button
                      type="button"
                      onClick={() => openQuickBook('evening')}
                      className="py-2 px-3 rounded-lg text-xs font-bold bg-[#F5F1E8] hover:bg-[#EDE6D8] text-[#173D35] border border-[#E2DACB] transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Book</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Full-Day Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick Actions for {selectedDate}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetFullDay(true)}
                  className="py-2 px-2.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all text-center"
                >
                  Free Whole Day
                </button>
                <button
                  type="button"
                  onClick={() => handleSetFullDay(false)}
                  className="py-2 px-2.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all text-center"
                >
                  Block Whole Day
                </button>
              </div>
              <button
                type="button"
                onClick={handleResetDate}
                className="w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Date to Default
              </button>
            </div>

            {/* Maintenance tasks on this day */}
            {selectedMaintenance.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Maintenance Tasks ({selectedMaintenance.length})
                </h4>
                {selectedMaintenance.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                    <span className="font-bold text-slate-900 block">{m.title}</span>
                    <span className="text-[11px] text-amber-800 font-medium">Assigned: {m.assignedTo || m.technicianName}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Manual Reservation Modal */}
      {isQuickBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base font-serif-heading">Direct Manual Reservation</h4>
                <p className="text-xs text-slate-500">
                  Instantly book and confirm a reservation on {selectedDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickBookModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Hall / Wing *
                  </label>
                  <select
                    value={quickBookForm.hall}
                    onChange={(e) => {
                      const h = e.target.value as HallTarget;
                      setQuickBookForm({
                        ...quickBookForm,
                        hall: h,
                        estimatedRent: h === 'both' ? 65000 : 30000,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] bg-white"
                  >
                    <option value="both">Combined Hall (Full Campus)</option>
                    <option value="hall_1">Hall 1 (Gents Wing)</option>
                    <option value="hall_2">Hall 2 (Ladies Wing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Session Slot *
                  </label>
                  <select
                    value={quickBookForm.slot}
                    onChange={(e) => setQuickBookForm({ ...quickBookForm, slot: e.target.value as SlotTarget })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] bg-white"
                  >
                    <option value="day">Day Session (10 AM – 3 PM)</option>
                    <option value="evening">Evening Session (6 PM – 10 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer / Organizer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mohammed Farooq"
                  value={quickBookForm.customerName}
                  onChange={(e) => setQuickBookForm({ ...quickBookForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={quickBookForm.phone}
                  onChange={(e) => setQuickBookForm({ ...quickBookForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35]"
                />
              </div>

              {(() => {
                const baseRent = Number(quickBookForm.estimatedRent) || 0;
                const discAmount = quickBookForm.discountValue > 0
                  ? quickBookForm.discountType === 'percentage'
                    ? Math.round((baseRent * quickBookForm.discountValue) / 100)
                    : Math.min(baseRent, quickBookForm.discountValue)
                  : 0;
                const netRent = Math.max(0, baseRent - discAmount);
                const advance = Number(quickBookForm.advancePaid) || 0;
                const balanceDue = Math.max(0, netRent - advance);

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Package Rent Tariff (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          required
                          value={quickBookForm.estimatedRent}
                          onChange={(e) => setQuickBookForm({ ...quickBookForm, estimatedRent: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Direct Manager Discount
                        </label>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={quickBookForm.discountType}
                            onChange={(e) => setQuickBookForm({ ...quickBookForm, discountType: e.target.value as any })}
                            className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700"
                          >
                            <option value="fixed">₹ Flat</option>
                            <option value="percentage">% Off</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            placeholder="Discount value"
                            value={quickBookForm.discountValue || ''}
                            onChange={(e) => setQuickBookForm({ ...quickBookForm, discountValue: Number(e.target.value) })}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Breakdown */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Agreed Package Price:</span>
                        <span className={`font-mono ${discAmount > 0 ? 'line-through text-slate-400' : 'font-bold text-slate-800'}`}>
                          ₹{baseRent.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {discAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-700 font-semibold">
                          <span>Special Discount ({quickBookForm.discountType === 'percentage' ? `${quickBookForm.discountValue}%` : 'Flat'}):</span>
                          <span className="font-mono">- ₹{discAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-bold">
                        <span className="text-slate-900">Net Payable Rent:</span>
                        <span className="text-slate-900 font-mono text-sm">₹{netRent.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Advance Token Paid Now (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={quickBookForm.advancePaid}
                          onChange={(e) => setQuickBookForm({ ...quickBookForm, advancePaid: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-mono font-bold text-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Remaining Balance Due (₹)
                        </label>
                        <div className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-amber-800">
                          ₹{balanceDue.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Occasion / Event Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wedding Reception, Engagement, Family Meet"
                  value={quickBookForm.eventTitle}
                  onChange={(e) => setQuickBookForm({ ...quickBookForm, eventTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickBookModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  className="font-bold"
                >
                  Confirm & Reserve Instantly
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
