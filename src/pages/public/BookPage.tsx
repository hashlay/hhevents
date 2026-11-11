import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Receipt,
  PhoneCall,
  ThermometerSnowflake,
  Wind,
  Users,
  Info,
  MessageCircle,
  Check,
  UtensilsCrossed,
  ChefHat,
  Package as PackageIcon,
  Ticket,
  Tag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { useToast } from '../../context/ToastContext';
import { VENUE_INFO, TIMING_SLOTS, OFFICIAL_TARIFF_SCHEDULE, DEFAULT_BOOKING_PACKAGES, BookingPackage } from '../../services/hallData';
import { checkSlotAvailability } from '../../services/bookingStorage';
import { saveBooking, getBookings, syncBookingsFromServer } from '../../services/storageService';
import {
  isSlotAvailable,
  isSlotBlockedByManager,
  syncAvailabilityFromServer,
  subscribeAvailability,
  HallTarget,
  SlotTarget,
} from '../../services/availabilityManager';
import { AvailabilityCalendar } from '../../components/calendar/AvailabilityCalendar';
import { HallId, SlotType, ACOption, BookingRequest } from '../../types';

interface BookPageProps {
  navigate: (path: string) => void;
}

export type { BookingPackage };

type BookingStep = 'date' | 'package' | 'space' | 'details' | 'summary' | 'confirmation';

export const BookPage: React.FC<BookPageProps> = ({ navigate }) => {
  const { showToast } = useToast();

  // Parse URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const paramPackage = urlParams.get('package');
  const paramHall = (urlParams.get('hall') as HallId) || 'both';
  const paramDate = urlParams.get('date');
  const paramSlot = (urlParams.get('slot') as SlotType) || 'day';

  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [packages, setPackages] = useState<BookingPackage[]>(DEFAULT_BOOKING_PACKAGES);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  const today = new Date();
  const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const defaultFutureDate = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];

  // Selections (strictly disallow past dates)
  const [date, setDate] = useState<string>(
    paramDate && paramDate >= todayStr ? paramDate : defaultFutureDate
  );
  const [slot, setSlot] = useState<SlotType>(paramSlot);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(paramPackage || 'full-ac-hall');
  const [hallPreference, setHallPreference] = useState<'hall_1' | 'hall_2' | 'both'>(
    (paramHall as any) || 'both'
  );

  // Live bookings & availability state
  const [allBookings, setAllBookings] = useState<BookingRequest[]>(getBookings());
  const [, setAvailabilityTick] = useState(0);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // Calendar month/year navigation state
  const initialCalendarDate = date ? new Date(date + 'T00:00:00') : today;
  const [calendarYear, setCalendarYear] = useState<number>(
    isNaN(initialCalendarDate.getTime()) ? today.getFullYear() : initialCalendarDate.getFullYear()
  );
  const [calendarMonth, setCalendarMonth] = useState<number>(
    isNaN(initialCalendarDate.getTime()) ? today.getMonth() : initialCalendarDate.getMonth()
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const canGoPrev =
    calendarYear > today.getFullYear() ||
    (calendarYear === today.getFullYear() && calendarMonth > today.getMonth());

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
  };

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();

  // Reactive sync of bookings and manager availability on mount
  useEffect(() => {
    let mounted = true;
    syncBookingsFromServer()
      .then((fresh) => {
        if (mounted) setAllBookings(fresh);
      })
      .catch(() => {});
    syncAvailabilityFromServer().catch(() => {});
    const unsub = subscribeAvailability(() => {
      if (mounted) setAvailabilityTick((t) => t + 1);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Helper to check if a slot is occupied by a reservation
  const isSlotOccupiedByBooking = (
    hall: 'hall_1' | 'hall_2' | 'both',
    targetDate: string,
    targetSlot: SlotType
  ) => {
    return allBookings.some((b) => {
      const isDate = b.date === targetDate || b.eventDate === targetDate;
      if (!isDate) return false;
      if (b.slot !== targetSlot && (b as any).timeSlot !== targetSlot) return false;
      const st = (b.status || '').toUpperCase();
      if (st === 'CANCELLED' || st === 'REJECTED') return false;

      const rawHall = (b as any).hallSelection || b.hall || '';
      const pkgId = (b.packageId || '').toLowerCase();
      const pkgName = ((b as any).packageName || '').toLowerCase();
      const resources: string[] = Array.isArray((b as any).occupiedResources)
        ? (b as any).occupiedResources
        : [];

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

      if (hall === 'both') {
        return isFullCampus || isHall1 || isHall2;
      }
      if (hall === 'hall_1') {
        return isFullCampus || isHall1;
      }
      if (hall === 'hall_2') {
        return isFullCampus || isHall2;
      }
      return isFullCampus;
    });
  };

  const handleDateClick = (dateStr: string) => {
    if (dateStr < todayStr) return;
    const isBooked = isSlotOccupiedByBooking(hallPreference, dateStr, slot);
    if (isBooked) {
      showToast(`This date is already booked for ${slot === 'day' ? 'Day' : 'Evening'} Session.`, 'error');
      return;
    }
    const isBlocked =
      isSlotBlockedByManager(hallPreference, dateStr, slot) ||
      !isSlotAvailable(hallPreference, dateStr, slot);
    if (isBlocked) {
      showToast(`This date is blocked (maintenance/hold) for ${slot === 'day' ? 'Day' : 'Evening'} Session.`, 'error');
      return;
    }
    setDate(dateStr);
  };

  // If default future date happens to be occupied, find the first open date
  useEffect(() => {
    if (allBookings.length > 0 && !paramDate) {
      const isCurrentOccupied =
        isSlotOccupiedByBooking(hallPreference, date, slot) ||
        isSlotBlockedByManager(hallPreference, date, slot) ||
        !isSlotAvailable(hallPreference, date, slot);

      if (isCurrentOccupied) {
        const now = new Date();
        for (let d = 1; d <= 45; d++) {
          const testDateObj = new Date(now.getTime() + d * 86400000);
          const testDateStr = formatDateKey(
            testDateObj.getFullYear(),
            testDateObj.getMonth(),
            testDateObj.getDate()
          );
          const occupied =
            isSlotOccupiedByBooking(hallPreference, testDateStr, slot) ||
            isSlotBlockedByManager(hallPreference, testDateStr, slot) ||
            !isSlotAvailable(hallPreference, testDateStr, slot);
          if (!occupied) {
            setDate(testDateStr);
            break;
          }
        }
      }
    }
  }, [allBookings]);

  // Customer Contact Fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState('wedding');
  const [expectedAttendees, setExpectedAttendees] = useState<number | ''>('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Submission & Conflict State
  const [conflictReason, setConflictReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<BookingRequest | null>(null);

  // Promotional coupon state
  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    title: string;
    discountType: string;
    discountValue: number;
    maxDiscountAmount?: number;
    discountAmount: number;
    originalPrice: number;
    finalRent: number;
    advanceRequired: number;
    balanceDue: number;
    category?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [publicOffers, setPublicOffers] = useState<any[]>([]);

  // Fetch active seasonal/promotional coupons
  useEffect(() => {
    fetch('/api/coupons/public')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPublicOffers(data);
      })
      .catch(() => {});
  }, []);

  // Load packages from server with fallback to DEFAULT_BOOKING_PACKAGES
  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch('/api/packages');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const activeOnly = data.filter((p: any) => p.active !== false);
            if (activeOnly.length > 0) {
              setPackages(activeOnly);
              if (paramPackage && activeOnly.some((p: any) => p.id === paramPackage)) {
                setSelectedPackageId(paramPackage);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not load packages from server, retaining default packages:', e);
      } finally {
        setIsLoadingPackages(false);
      }
    }
    fetchPackages();
  }, [paramPackage]);

  // Selected package reference
  const currentPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  // Sync hallPreference with package type
  useEffect(() => {
    if (currentPackage) {
      if (currentPackage.id.includes('full')) {
        setHallPreference('both');
      } else if (currentPackage.acType === 'Dining Only') {
        setHallPreference('hall_1'); // Only occupies dining
      }
    }
  }, [selectedPackageId, currentPackage]);

  // Re-check conflict on field changes
  useEffect(() => {
    if (date && slot) {
      const hallToCheck = currentPackage
        ? currentPackage.id.includes('full')
          ? 'both'
          : hallPreference
        : hallPreference;
      if (date < todayStr) {
        setConflictReason(
          'Reservations cannot be made for past dates. Please pick today or an upcoming event date on the calendar.'
        );
        return;
      }
      const isBooked = isSlotOccupiedByBooking(hallToCheck, date, slot);
      if (isBooked) {
        setConflictReason(
          `This venue space is already booked on ${date} for ${
            slot === 'day' ? 'Day (Morning)' : 'Evening'
          } Session.`
        );
        return;
      }
      const isBlocked =
        isSlotBlockedByManager(hallToCheck, date, slot) ||
        !isSlotAvailable(hallToCheck, date, slot);
      if (isBlocked) {
        setConflictReason(
          `This venue space is marked unavailable (venue hold / maintenance) on ${date} for ${
            slot === 'day' ? 'Day (Morning)' : 'Evening'
          } Session.`
        );
        return;
      }
      const res = checkSlotAvailability(hallToCheck as HallId, date, slot);
      if (!res.available) {
        setConflictReason(res.conflictReason || 'The selected space is reserved for this session.');
      } else {
        setConflictReason(null);
      }
    }
  }, [date, slot, currentPackage, hallPreference, allBookings]);

  // Revalidate coupon if package changes
  useEffect(() => {
    if (appliedCoupon && currentPackage) {
      fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: appliedCoupon.code,
          packagePrice: currentPackage.rent,
          phone: phone.trim(),
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.valid && data.coupon) {
            setAppliedCoupon(data.coupon);
          } else {
            setAppliedCoupon(null);
            showToast(data.message || 'Coupon removed due to package change', 'info');
          }
        })
        .catch(() => {});
    }
  }, [selectedPackageId]);

  const handleApplyCoupon = async (overrideCode?: string) => {
    const codeToValidate = (overrideCode || couponInput).trim();
    if (!codeToValidate) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToValidate,
          packagePrice: currentPackage ? currentPackage.rent : 30000,
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid && data.coupon) {
        setAppliedCoupon(data.coupon);
        setCouponInput(data.coupon.code);
        setCouponError(null);
        showToast(
          `Coupon '${data.coupon.code}' applied: ₹${data.coupon.discountAmount.toLocaleString('en-IN')} off!`,
          'success'
        );
      } else {
        setCouponError(data.message || 'Invalid or expired coupon code.');
        showToast(data.message || 'Failed to apply coupon', 'error');
      }
    } catch {
      setCouponError('Could not reach coupon validation service.');
      showToast('Validation server error', 'error');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    showToast('Discount coupon removed', 'info');
  };

  const packagePrice = currentPackage ? currentPackage.rent : 30000;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const netRent = Math.max(0, packagePrice - couponDiscount);
  const advanceRequired = Math.round(netRent * 0.25);
  const balanceDue = netRent - advanceRequired;

  const stepsList: { id: BookingStep; label: string; number: number }[] = [
    { id: 'date', label: 'Date & Slot', number: 1 },
    { id: 'package', label: 'Select Package', number: 2 },
    { id: 'space', label: 'Space & Layout', number: 3 },
    { id: 'details', label: 'Host Details', number: 4 },
    { id: 'summary', label: 'Review & Terms', number: 5 },
  ];

  const currentStepIndex = stepsList.findIndex((s) => s.id === currentStep);

  const handleNextStep = () => {
    if (currentStep === 'date') {
      if (!date) {
        showToast('Please select an available event date from the calendar.', 'error');
        return;
      }
      if (date < todayStr) {
        showToast('Reservations cannot be made for past dates.', 'error');
        return;
      }
      const hallToCheck = currentPackage
        ? currentPackage.id.includes('full')
          ? 'both'
          : hallPreference
        : hallPreference;
      const isBooked = isSlotOccupiedByBooking(hallToCheck, date, slot);
      if (isBooked) {
        showToast(
          `The selected date is already booked for ${
            slot === 'day' ? 'Day (Morning)' : 'Evening'
          } Session. Please select a green date.`,
          'error'
        );
        return;
      }
      const isBlocked =
        isSlotBlockedByManager(hallToCheck, date, slot) ||
        !isSlotAvailable(hallToCheck, date, slot);
      if (isBlocked) {
        showToast(
          `The selected date is unavailable (venue hold / maintenance) for ${
            slot === 'day' ? 'Day (Morning)' : 'Evening'
          } Session.`,
          'error'
        );
        return;
      }
      if (conflictReason) {
        showToast(conflictReason, 'error');
        return;
      }
      setCurrentStep('package');
    } else if (currentStep === 'package') {
      if (!currentPackage) {
        showToast('Please select a hall package.', 'error');
        return;
      }
      setCurrentStep('space');
    } else if (currentStep === 'space') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (!customerName.trim() || !phone.trim()) {
        showToast('Full name and mobile phone number are required.', 'error');
        return;
      }
      if (phone.replace(/\D/g, '').length < 10) {
        showToast('Please enter a valid 10-digit mobile phone number.', 'error');
        return;
      }
      setCurrentStep('summary');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'package') setCurrentStep('date');
    else if (currentStep === 'space') setCurrentStep('package');
    else if (currentStep === 'details') setCurrentStep('space');
    else if (currentStep === 'summary') setCurrentStep('details');
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      showToast('Please accept the venue booking terms to proceed.', 'error');
      return;
    }

    setIsSubmitting(true);
    const bookingPayload = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      packageId: currentPackage?.id || selectedPackageId,
      hallSelection: hallPreference,
      acOption: currentPackage?.acType === 'Non AC' ? 'non_ac' : 'ac',
      date,
      slot,
      expectedAttendees: expectedAttendees ? Number(expectedAttendees) : undefined,
      additionalInfo: additionalInfo.trim(),
      eventType,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.booking) {
          setSubmittedBooking(data.booking);
          setCurrentStep('confirmation');
          showToast('Booking request submitted successfully!', 'success');
          setIsSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend booking endpoint unreachable, creating local verified booking:', err);
    }

    // Resilient local fallback: save reservation locally so customer is NEVER stranded
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const fallbackBooking: BookingRequest = {
      id: `BK-${Date.now().toString(36).toUpperCase()}-${randomHex}`,
      customerName: bookingPayload.customerName,
      phone: bookingPayload.phone,
      email: bookingPayload.email,
      date: bookingPayload.date,
      slot: bookingPayload.slot as SlotType,
      hall: bookingPayload.hallSelection as any,
      acOption: bookingPayload.acOption as any,
      eventType: bookingPayload.eventType as any,
      estimatedAttendees: bookingPayload.expectedAttendees || 500,
      status: 'pending',
      totalEstimate: netRent,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountAmount: couponDiscount > 0 ? couponDiscount : undefined,
      originalAmount: couponDiscount > 0 ? packagePrice : undefined,
      advancePaymentStatus: 'unpaid',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminRemarks: bookingPayload.additionalInfo,
    };

    saveBooking(fallbackBooking);
    setSubmittedBooking(fallbackBooking);
    setCurrentStep('confirmation');
    showToast('Reservation request registered successfully! Reference ID created.', 'success');
    setIsSubmitting(false);
  };

  const copyReference = () => {
    if (submittedBooking?.id) {
      navigator.clipboard.writeText(submittedBooking.id);
      showToast('Booking Reference ID copied to clipboard!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#252525] pb-24">
      {/* Top Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] py-10 sm:py-14 border-b border-[#E2DACB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="max-w-3xl space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#173D35] bg-[#F5F1E8] px-3.5 py-1.5 rounded-full border border-[#E2DACB] inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#C9AA72]" />
              Official Reservation Desk
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#252525] tracking-tight">
              Reserve H H Events &amp; Conventions
            </h1>
            <p className="text-sm sm:text-base text-[#4A4A4A]">
              Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal, Karnataka 574231
            </p>
          </div>
        </div>
      </section>

      {/* Main Form Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Step Progress Tracker */}
        {currentStep !== 'confirmation' && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2DACB] shadow-2xs mb-8">
            <div className="flex items-center justify-between">
              {stepsList.map((s, idx) => {
                const isPassed = currentStepIndex > idx;
                const isCurrent = currentStep === s.id;
                return (
                  <div key={s.id} className="flex-1 flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isPassed
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-[#C9AA72] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : s.number}
                      </div>
                      <span
                        className={`hidden md:block text-xs font-medium ${
                          isCurrent ? 'font-bold text-[#252525]' : 'text-slate-500'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < stepsList.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 sm:mx-4 ${
                          isPassed ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 1: DATE & SESSION SLOT WITH INTERACTIVE AVAILABILITY CALENDAR */}
        {currentStep === 'date' && (
          <div className="bg-white rounded-3xl p-5 sm:p-9 border border-[#E2DACB] shadow-sm space-y-7 animate-in fade-in">
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DACB] pb-5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 1 of 5</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#173D35] font-serif-heading">
                  Select Event Date &amp; Session Slot
                </h2>
                <p className="text-xs text-[#4A4A4A]">
                  Choose your session slot below to inspect live month availability. Green dates are open for immediate reservation.
                </p>
              </div>

              {/* View Master Schedule Modal Shortcut */}
              <button
                type="button"
                onClick={() => setIsMasterModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F5F1E8] border border-[#E2DACB] hover:border-[#C9AA72] text-[#173D35] text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
                title="Open Master Schedule Modal"
              >
                <Eye className="w-4 h-4 text-[#C9AA72]" />
                <span>View Master Schedule</span>
              </button>
            </div>

            {/* 1. SESSION SLOT SELECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  1. Choose Session Slot
                </label>
                <span className="text-[11px] text-[#737373]">
                  Schedule: {OFFICIAL_TARIFF_SCHEDULE}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TIMING_SLOTS.map((s) => {
                  const isSelected = slot === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlot(s.id as SlotType)}
                      className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#173D35] bg-[#173D35] text-white shadow-md ring-2 ring-[#C9AA72]'
                          : 'border-[#E2DACB] hover:border-[#C9AA72] bg-white hover:bg-[#FAF8F5] text-[#252525]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${isSelected ? 'text-[#D9C194]' : 'text-[#C9AA72]'}`} />
                            <span className="font-bold text-base font-serif-heading">{s.label}</span>
                          </div>
                          <span
                            className={`text-xs font-mono font-bold mt-1 inline-block ${
                              isSelected ? 'text-[#D9C194]' : 'text-[#173D35]'
                            }`}
                          >
                            {s.timeRange}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#C9AA72] text-[#173D35]">
                            Active Slot
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isSelected ? 'text-white/85' : 'text-[#737373]'}`}>
                        {s.id === 'day'
                          ? 'Morning & afternoon ceremonies, nikah, muhurtham, and grand lunch banquets.'
                          : 'Ambient evening lighting, gala receptions, cultural gatherings, and dinner banquets.'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. VENUE SPACE AVAILABILITY FILTER */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                2. Venue Space Availability
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHallPreference('both')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    hallPreference === 'both'
                      ? 'bg-[#173D35] text-white shadow-xs ring-1 ring-[#C9AA72]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Combined Hall (Full Campus)
                </button>
                <button
                  type="button"
                  onClick={() => setHallPreference('hall_1')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    hallPreference === 'hall_1'
                      ? 'bg-[#173D35] text-white shadow-xs ring-1 ring-[#C9AA72]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Hall 1 (Gents Wing)
                </button>
                <button
                  type="button"
                  onClick={() => setHallPreference('hall_2')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    hallPreference === 'hall_2'
                      ? 'bg-[#173D35] text-white shadow-xs ring-1 ring-[#C9AA72]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Hall 2 (Ladies Wing)
                </button>
              </div>
            </div>

            {/* 3. INTERACTIVE MONTH AVAILABILITY CALENDAR */}
            <div className="bg-[#FAF8F5] rounded-3xl p-4 sm:p-7 border border-[#E2DACB] space-y-5">
              {/* Calendar Month Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DACB] pb-4">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9AA72] flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Month Availability for {slot === 'day' ? 'Day Session (10 AM – 3 PM)' : 'Evening Session (6 PM – 10 PM)'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#173D35] font-serif-heading">
                    {monthNames[calendarMonth]} {calendarYear}
                  </h3>
                </div>

                {/* Month Navigation Controls */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={!canGoPrev}
                    className={`p-2 rounded-xl border border-[#E2DACB] transition-colors ${
                      canGoPrev
                        ? 'bg-white hover:bg-[#EDE6D8] text-[#252525] cursor-pointer'
                        : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-40'
                    }`}
                    aria-label="Previous Month"
                    title={canGoPrev ? 'Previous Month' : 'Past months cannot be selected'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCurrentMonth}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EDE6D8] text-xs text-[#173D35] border border-[#E2DACB] transition-colors font-bold cursor-pointer shadow-2xs"
                  >
                    Current Month
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl bg-white hover:bg-[#EDE6D8] text-[#252525] border border-[#E2DACB] transition-colors cursor-pointer"
                    aria-label="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

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

              {/* Month Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`blank-${i}`} className="min-h-[56px] sm:min-h-[72px] rounded-2xl bg-white/40 border border-transparent" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDateKey(calendarYear, calendarMonth, day);
                  const isPast = dateStr < todayStr;
                  const isToday = dateStr === todayStr;
                  const isSelected = date === dateStr && !isPast;

                  const isBooked = isSlotOccupiedByBooking(hallPreference, dateStr, slot);
                  const isBlocked =
                    isSlotBlockedByManager(hallPreference, dateStr, slot) ||
                    !isSlotAvailable(hallPreference, dateStr, slot);
                  const isAvailable = !isPast && !isBooked && !isBlocked;

                  let cellBg = 'bg-white border-[#E2DACB] text-[#252525]';
                  let statusBadge = 'Available';
                  let statusColor = 'text-emerald-700';
                  let dotColor = 'bg-emerald-500';

                  if (isPast) {
                    cellBg = 'bg-slate-100/70 border-slate-200/60 text-slate-300 cursor-not-allowed opacity-40 select-none';
                    statusBadge = 'Past';
                    statusColor = 'text-slate-400';
                    dotColor = 'bg-slate-300';
                  } else if (isSelected) {
                    cellBg = 'bg-[#173D35] border-[#173D35] text-white shadow-md ring-2 ring-[#C9AA72] cursor-pointer';
                    statusBadge = 'Selected';
                    statusColor = 'text-[#D9C194]';
                    dotColor = 'bg-[#C9AA72]';
                  } else if (isBooked) {
                    cellBg = 'bg-rose-50/90 border-rose-300 text-rose-800 cursor-not-allowed shadow-none';
                    statusBadge = 'Booked';
                    statusColor = 'text-rose-700';
                    dotColor = 'bg-rose-500';
                  } else if (isBlocked) {
                    cellBg = 'bg-blue-50/90 border-blue-300 text-blue-900 cursor-not-allowed shadow-none';
                    statusBadge = 'Blocked';
                    statusColor = 'text-blue-700';
                    dotColor = 'bg-blue-600';
                  } else {
                    // Available
                    cellBg = 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/90 text-emerald-950 cursor-pointer shadow-xs';
                    statusBadge = 'Available';
                    statusColor = 'text-emerald-700';
                    dotColor = 'bg-emerald-500';
                  }

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={isPast || isBooked || isBlocked}
                      onClick={() => handleDateClick(dateStr)}
                      className={`min-h-[56px] sm:min-h-[72px] p-1.5 sm:p-2.5 rounded-2xl text-left transition-all relative flex flex-col justify-between items-stretch border ${cellBg}`}
                      title={
                        isPast
                          ? 'Past Date (Disabled)'
                          : isBooked
                          ? `Booked for ${slot === 'day' ? 'Day (Morning)' : 'Evening'} Session (Disabled)`
                          : isBlocked
                          ? `Blocked (Hold / Maintenance) for ${slot === 'day' ? 'Day (Morning)' : 'Evening'} Session (Disabled)`
                          : `Available for ${slot === 'day' ? 'Day (Morning)' : 'Evening'} Session (Click to Select)`
                      }
                    >
                      {/* Top row: day number & today / selected badge */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs sm:text-sm font-bold leading-none ${
                            isSelected
                              ? 'text-white'
                              : isPast
                              ? 'text-slate-400 font-normal'
                              : isBooked
                              ? 'text-rose-900'
                              : isBlocked
                              ? 'text-blue-900'
                              : 'text-emerald-950'
                          }`}
                        >
                          {day}
                        </span>
                        {isToday && !isSelected && (
                          <span className="text-[9px] font-bold text-[#173D35] bg-[#C9AA72]/20 border border-[#C9AA72] px-1 py-0.2 rounded">
                            Today
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[9px] font-bold text-[#173D35] bg-[#C9AA72] px-1.5 py-0.2 rounded-full">
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Bottom row: session dot + status label */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                        <span
                          className={`text-[9.5px] sm:text-[10.5px] font-bold truncate leading-tight ${
                            isSelected ? 'text-white/90' : statusColor
                          }`}
                        >
                          {statusBadge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Color Legend */}
              <div className="pt-4 border-t border-[#E2DACB] flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] sm:text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-emerald-950">Available (Selectable)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="font-semibold text-blue-900">Blocked (Hold / Maintenance)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-semibold text-rose-900">Booked (Reserved)</span>
                  </span>
                  <span className="flex items-center gap-1.5 opacity-50">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                    <span className="text-slate-600">Past (Disabled)</span>
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#737373]">
                  Live slot status:{' '}
                  <strong className="text-[#173D35]">
                    {slot === 'day' ? 'Day (Morning) Session' : 'Evening Session'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Selected Date Confirmation Banner */}
            {date && !conflictReason && date >= todayStr && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F1E8] border border-[#C9AA72] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#173D35] text-[#D9C194] flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-[#C9AA72]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9AA72] block">
                      Confirmed Selection
                    </span>
                    <strong className="text-sm sm:text-base font-bold text-[#173D35] block">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                    <p className="text-xs text-[#4A4A4A]">
                      {slot === 'day' ? 'Day Session (10:00 AM – 3:00 PM)' : 'Evening Session (6:00 PM – 10:00 PM)'} &bull;{' '}
                      {hallPreference === 'both'
                        ? 'Combined Hall (Full Campus)'
                        : hallPreference === 'hall_1'
                        ? 'Hall 1 (Gents Wing)'
                        : 'Hall 2 (Ladies Wing)'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold self-start sm:self-auto border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Available for Booking
                </span>
              </div>
            )}

            {/* Conflict Warning */}
            {conflictReason && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-sm block">Selected Slot is Occupied / Unavailable</strong>
                  <p className="text-xs text-rose-700 mt-0.5">{conflictReason}</p>
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    Please click an open (green) date from the calendar above, or switch session slots.
                  </p>
                </div>
              </div>
            )}

            {/* Past Date Warning */}
            {date < todayStr && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Past Date Selected:</strong>
                  <p>Reservations cannot be made for past dates. Please pick today ({todayStr}) or an upcoming green date on the calendar.</p>
                </div>
              </div>
            )}

            {/* Step 1 Actions */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                onClick={handleNextStep}
                variant="gold"
                size="md"
                disabled={!!conflictReason || date < todayStr || !date}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto justify-center"
              >
                Proceed to Package Selection
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT OFFICIAL PACKAGE */}
        {currentStep === 'package' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 2 of 5</span>
                <h2 className="text-2xl font-bold text-[#252525] font-serif-heading">
                  Choose Your Hall Package
                </h2>
                <p className="text-xs text-[#4A4A4A]">
                  Select from the 8 official packages. All packages include the commercial kitchen facility.
                </p>
              </div>
              <span className="text-xs font-bold text-[#173D35] bg-[#F5F1E8] px-3 py-1 rounded-full border border-[#E2DACB] self-start sm:self-auto">
                Date: {date} ({slot === 'day' ? 'Day' : 'Evening'})
              </span>
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#C9AA72] bg-[#F5F1E8] shadow-md ring-2 ring-[#C9AA72]/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              pkg.acType === 'AC'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : pkg.acType === 'Non AC'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {pkg.acType}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 font-serif-heading mt-1">
                            {pkg.name}
                          </h3>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-semibold font-price text-[#C9AA72]">
                            ₹{pkg.rent.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {pkg.details}
                      </p>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span>{pkg.capacityText}</span>
                        <span className="text-emerald-700 font-medium">Kitchen Included</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isSelected ? 'text-[#C9AA72]' : 'text-slate-400'}`}>
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Button onClick={handlePrevStep} variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} className="w-full sm:w-auto justify-center">
                Back
              </Button>
              <Button onClick={handleNextStep} variant="gold" size="md" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full sm:w-auto justify-center">
                Configure Space &amp; Layout
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SPACE & LAYOUT CONFIGURATION */}
        {currentStep === 'space' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8 animate-in fade-in">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 3 of 5</span>
              <h2 className="text-2xl font-bold text-[#252525] font-serif-heading">
                Physical Space &amp; Layout Assignment
              </h2>
              <p className="text-xs text-[#4A4A4A]">
                Configure which specific hall section and dining facilities apply to your booking.
              </p>
            </div>

            {/* Package Summary Header */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500 block">Selected Package:</span>
                <strong className="text-base text-slate-900 font-serif-heading">
                  {currentPackage?.name}
                </strong>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Rent: ₹{currentPackage?.rent.toLocaleString('en-IN')} &bull; {currentPackage?.acType}
                </span>
              </div>
              <button
                onClick={() => setCurrentStep('package')}
                className="text-xs text-[#C9AA72] font-semibold hover:underline self-start sm:self-auto"
              >
                Change Package
              </button>
            </div>

            {/* Single Hall selection if applicable */}
            {currentPackage && !currentPackage.id.includes('full') && currentPackage.acType !== 'Dining Only' && (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Hall Section Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setHallPreference('hall_1')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      hallPreference === 'hall_1'
                        ? 'border-[#C9AA72] bg-[#F5F1E8] text-[#252525] ring-1 ring-[#C9AA72]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#C9AA72]" />
                      <strong className="text-sm">Hall 1 (Gents Wing)</strong>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Independent main section with stage and dedicated dining entrance.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHallPreference('hall_2')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      hallPreference === 'hall_2'
                        ? 'border-[#C9AA72] bg-[#F5F1E8] text-[#252525] ring-1 ring-[#C9AA72]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#C9AA72]" />
                      <strong className="text-sm">Hall 2 (Ladies Wing)</strong>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Independent hall section with private acoustic setup and dining link.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Inclusions checklist for this package */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                Confirmed Inclusions for this Package:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(currentPackage?.inclusions || [
                  'Kitchen Facility Included',
                  'Standard Session Timing Slot',
                  'Acoustic Power & Generator Setup'
                ]).map((inc, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Button onClick={handlePrevStep} variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} className="w-full sm:w-auto justify-center">
                Back
              </Button>
              <Button onClick={handleNextStep} variant="gold" size="md" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full sm:w-auto justify-center">
                Host &amp; Event Details
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: HOST DETAILS */}
        {currentStep === 'details' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8 animate-in fade-in">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 4 of 5</span>
              <h2 className="text-2xl font-bold text-[#252525] font-serif-heading">
                Enter Host &amp; Contact Details
              </h2>
              <p className="text-xs text-[#4A4A4A]">
                We use these details for booking verification and sending status updates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Host / Customer Full Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mohammed Farooq"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. farooq@gmail.com"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Nature of Event
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                >
                  <option value="wedding">Wedding Ceremony &amp; Reception</option>
                  <option value="nikah">Nikah Ceremony</option>
                  <option value="reception">Walima / Reception Gala</option>
                  <option value="cultural">Cultural Gathering</option>
                  <option value="corporate">Corporate Convention</option>
                  <option value="family">Family Gathering / Feast</option>
                  <option value="other">Other Event</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Expected Guest Count
                </label>
                <input
                  type="number"
                  value={expectedAttendees}
                  onChange={(e) => setExpectedAttendees(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Special Catering or Setup Notes (Optional)
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={3}
                  placeholder="e.g. Need kitchen early morning for catering preparation"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Button onClick={handlePrevStep} variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} className="w-full sm:w-auto justify-center">
                Back
              </Button>
              <Button onClick={handleNextStep} variant="gold" size="md" rightIcon={<ArrowRight className="w-4 h-4" />} className="w-full sm:w-auto justify-center">
                Review Summary &amp; Terms
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUMMARY */}
        {currentStep === 'summary' && (
          <form onSubmit={handleSubmitBooking} className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8 animate-in fade-in">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 5 of 5</span>
              <h2 className="text-2xl font-bold text-[#252525] font-serif-heading">
                Review Reservation Request
              </h2>
              <p className="text-xs text-[#4A4A4A]">
                Please review your selected package, schedule, and transparent price breakdown.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-[#FAF8F5] border border-[#E2DACB]">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Event &amp; Hall Details</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Package:</span>
                    <strong className="text-slate-900">{currentPackage?.name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Date:</span>
                    <strong className="text-slate-900 font-mono">{date}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Session Slot:</span>
                    <strong className="text-slate-900">{slot === 'day' ? 'Day (10:00 AM – 3:00 PM)' : 'Evening (6:00 PM – 10:00 PM)'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Climate:</span>
                    <strong className="text-slate-900">{currentPackage?.acType}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Kitchen:</span>
                    <strong className="text-emerald-700">Included without extra charge</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Financial Summary</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Package Base Rent:</span>
                    <strong className="text-slate-900 font-price">₹{packagePrice.toLocaleString('en-IN')}</strong>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between py-1.5 border-b border-emerald-200 text-emerald-800 bg-emerald-50 px-2 rounded-lg">
                      <span className="font-semibold flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        Discount ({appliedCoupon.code}):
                      </span>
                      <strong className="font-price text-emerald-700">
                        -₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Net Package Rent:</span>
                      <strong className="text-slate-900 font-price">₹{netRent.toLocaleString('en-IN')}</strong>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">25% Advance Token Required:</span>
                    <strong className="text-amber-700 font-price">₹{advanceRequired.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Balance on Agreement:</span>
                    <strong className="text-slate-900 font-price">₹{balanceDue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Payment Notice:</span>
                    <span className="text-[11px] text-slate-600 text-right max-w-xs">
                      Advance token is handled directly with management upon approval.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PROMOTIONAL COUPON & VOUCHER MODULE */}
            <div className="p-5 rounded-3xl bg-[#FAF8F5] border border-[#E2DACB] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#C9AA72]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Have a Discount Coupon / Referral Code?
                  </span>
                </div>
                {publicOffers.length > 0 && !appliedCoupon && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500">Available Deals:</span>
                    {publicOffers.slice(0, 2).map((offer: any) => (
                      <button
                        key={offer.code}
                        type="button"
                        onClick={() => handleApplyCoupon(offer.code)}
                        className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        {offer.code} ({offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue.toLocaleString('en-IN')} OFF`})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!appliedCoupon ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter coupon code (e.g. EID2026, VIP...)"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                        setCouponError(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#C9AA72] bg-white tracking-wider"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="gold"
                    size="sm"
                    disabled={!couponInput.trim() || isValidatingCoupon}
                    onClick={() => handleApplyCoupon()}
                    className="font-bold sm:min-w-[120px]"
                  >
                    {isValidatingCoupon ? 'Checking...' : 'Apply Code'}
                  </Button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-mono font-bold text-emerald-950 uppercase tracking-wider">
                          {appliedCoupon.code}
                        </strong>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          Coupon Applied
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        {appliedCoupon.title} &bull; Concession: <strong>-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold cursor-pointer shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {couponError}
                </p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded text-[#C9AA72] focus:ring-[#C9AA72] mt-0.5"
                  required
                />
                <span className="text-slate-700 leading-relaxed">
                  I confirm that all provided event details are accurate. I agree to the venue guidelines and understand that booking confirmation requires manager review and advance token deposit.
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Button type="button" onClick={handlePrevStep} variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} className="w-full sm:w-auto justify-center">
                Back
              </Button>
              <Button
                type="submit"
                variant="gold"
                size="md"
                disabled={isSubmitting || !termsAccepted}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="w-full sm:w-auto justify-center"
              >
                {isSubmitting ? 'Submitting Reservation...' : 'Submit Booking Request'}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 6: CONFIRMATION RECEIPT */}
        {currentStep === 'confirmation' && submittedBooking && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E2DACB] shadow-lg text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                Reservation Request Recorded
              </span>
              <h2 className="text-3xl font-bold text-slate-900 font-serif-heading">
                Thank You, {customerName}!
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                Your reservation request for <strong>{submittedBooking.packageName}</strong> on{' '}
                <strong>{submittedBooking.date}</strong> has been recorded in our reservation registry.
              </p>
            </div>

            {/* Reference Number Card */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] max-w-md mx-auto space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                Official Booking Reference ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-bold font-mono text-[#C9AA72] tracking-wider">
                  {submittedBooking.id}
                </span>
                <button
                  type="button"
                  onClick={copyReference}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Copy Reference ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Save this reference number to track your reservation status at any time.
              </p>
            </div>

            {/* Next Steps Guidance */}
            <div className="max-w-md mx-auto text-left p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
              <strong className="block font-bold text-slate-900">What Happens Next?</strong>
              <p>
                1. Our management team reviews your requested slot and verifies resource availability.
              </p>
              <p>
                2. You will be contacted via mobile phone (<strong>{phone}</strong>) regarding confirmation and advance token remittance.
              </p>
            </div>

            {/* Direct WhatsApp Trigger */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`https://wa.me/91${VENUE_INFO.whatsappPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Assalamu Alaikum / Greetings,\n\nI have submitted a booking request at H H Events & Conventions.\n\n*Booking ID:* ${submittedBooking.id}\n*Customer:* ${customerName}\n*Package:* ${submittedBooking.packageName}\n*Date:* ${submittedBooking.date}\n*Session:* ${submittedBooking.slot === 'day' ? 'Day (10 AM - 3 PM)' : 'Evening (6 PM - 10 PM)'}\n\nPlease let me know the advance token payment details for confirmation.\n\nThank you!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Venue via WhatsApp ({VENUE_INFO.whatsappPhone})
              </a>

              <Button
                onClick={() => navigate(`/track-booking?ref=${submittedBooking.id}`)}
                variant="outline"
                size="md"
              >
                Track Booking Status
              </Button>
            </div>
          </div>
        )}

        {/* MASTER SCHEDULE MODAL */}
        {isMasterModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 border border-[#E2DACB] shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2DACB]">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9AA72]">
                    Master Venue Schedule
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#173D35] font-serif-heading">
                    Full Venue &amp; Session Inspector
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMasterModalOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AvailabilityCalendar
                selectedDate={date}
                initialHall={hallPreference}
                onSelectDate={(newDate) => {
                  setDate(newDate);
                }}
                onBookSlot={(h, d, s) => {
                  setDate(d);
                  setSlot(s);
                  setHallPreference(h);
                  setIsMasterModalOpen(false);
                  showToast(
                    `Selected ${d} for ${s === 'day' ? 'Day' : 'Evening'} Session`,
                    'success'
                  );
                }}
              />

              <div className="flex justify-end pt-2 border-t border-[#E2DACB]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMasterModalOpen(false)}
                >
                  Close Schedule
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
