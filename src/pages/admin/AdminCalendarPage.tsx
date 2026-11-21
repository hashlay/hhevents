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
  Eye,
  Printer,
  Download,
  ArrowLeft,
  Check,
  AlertCircle,
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
  checkSlotAvailability,
  validateIndianPhone,
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
  getSlotBlackout,
  isSlotBlockedByManager,
  blockSlotWithDetails,
  releaseSlotAvailability,
  releaseFullDayAvailability,
  BlackoutEntry,
} from '../../services/availabilityManager';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { BookingRequest } from '../../types';
import { WhatsAppShareModal } from '../../components/ui/WhatsAppShareModal';
import { EventOrderReceipt } from '../../components/ui/EventOrderReceipt';
import { A4DocumentViewer } from '../../components/ui/A4DocumentViewer';
import { shareEventOrderDirectly, downloadReceiptAsJpg } from '../../services/eventOrderShare';
import { DEFAULT_AUTHORIZED_SIGNATURE } from '../../services/defaultSignature';
import {
  RESERVATION_PACKAGE_OPTIONS,
  ReservationPackageOption,
  STANDARD_OCCASIONS,
} from '../../services/hallData';

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

  // Quick reservation modal state & dynamic package list
  const [packageOptions, setPackageOptions] = useState<ReservationPackageOption[]>(RESERVATION_PACKAGE_OPTIONS);
  const [isQuickBookModalOpen, setIsQuickBookModalOpen] = useState(false);
  const [quickBookStep, setQuickBookStep] = useState<'form' | 'preview'>('form');
  const [pendingQuickBook, setPendingQuickBook] = useState<(BookingRequest & any) | null>(null);
  const [isSubmittingQuickBook, setIsSubmittingQuickBook] = useState(false);
  const [isDownloadingQuickJpg, setIsDownloadingQuickJpg] = useState(false);
  const quickReceiptRef = React.useRef<HTMLDivElement>(null);

  const [quickPhoneError, setQuickPhoneError] = useState<string | null>(null);

  const handleCloseQuickBook = () => {
    setIsQuickBookModalOpen(false);
    setQuickBookStep('form');
    setPendingQuickBook(null);
    setQuickPhoneError(null);
  };
  const [quickBookForm, setQuickBookForm] = useState<{
    customerName: string;
    phone: string;
    hall: HallTarget;
    slot: SlotTarget;
    packageId: string;
    packageName: string;
    occasionCategory: string;
    customOccasion: string;
    additionalNote: string;
    estimatedRent: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountReason: string;
    extraCharge: number;
    extraChargeReason: string;
    advancePaid: number;
  }>({
    customerName: '',
    phone: '',
    hall: 'both',
    slot: 'day',
    packageId: 'full-ac-hall',
    packageName: 'Full AC Hall (Combined Campus)',
    occasionCategory: 'Wedding / Nikah (Main Ceremony)',
    customOccasion: '',
    additionalNote: '',
    estimatedRent: 65000,
    discountType: 'fixed',
    discountValue: 0,
    discountReason: '',
    extraCharge: 0,
    extraChargeReason: '',
    advancePaid: 15000,
  });

  const [whatsAppBooking, setWhatsAppBooking] = useState<BookingRequest | null>(null);

  // Direct WhatsApp sharing without popup
  const [directShareBooking, setDirectShareBooking] = useState<BookingRequest | null>(null);
  const directReceiptRef = React.useRef<HTMLDivElement>(null);
  const [signatureUrl, setSignatureUrl] = useState<string>(DEFAULT_AUTHORIZED_SIGNATURE);
  const [signatoryDesignation, setSignatoryDesignation] = useState<string>('Authorized Signatory');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.signatorySignature && data.signatorySignature.trim().length > 0 && data.signatorySignature !== '/authorized-signatory.png') {
          setSignatureUrl(data.signatorySignature);
        } else {
          setSignatureUrl(DEFAULT_AUTHORIZED_SIGNATURE);
        }
        if (data?.signatoryName) setSignatoryDesignation(data.signatoryName);
      })
      .catch(() => {
        setSignatureUrl(DEFAULT_AUTHORIZED_SIGNATURE);
      });
  }, []);

  const handleDirectWhatsAppShare = async (b: BookingRequest) => {
    try {
      await shareEventOrderDirectly({
        booking: b,
        showToast,
        signatureUrl,
      });
    } catch (err: any) {
      showToast('Could not share to WhatsApp.', 'error');
    }
  };

  // Block Slot with Details Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockSlotTarget, setBlockSlotTarget] = useState<SlotTarget | 'full_day'>('day');
  const [blockForm, setBlockForm] = useState({
    blockType: 'customer_hold' as 'customer_hold' | 'maintenance' | 'manager_hold',
    customerName: '',
    customerPhone: '',
    notes: '',
  });
  const [isSavingBlock, setIsSavingBlock] = useState(false);
  const [isReleasingSlot, setIsReleasingSlot] = useState(false);

  const getWhatsAppConfirmationMessage = (b: BookingRequest) => {
    const bObj = b as any;
    const hostName = b.customerName || bObj.applicantName || 'Sir/Madam';
    const paid = Number(bObj.amountPaid) || 0;

    const evDateRaw = b.date || bObj.eventDate || '';
    let evDateShort = '1-1-2027';
    let dayOfWeek = 'Friday';

    if (evDateRaw) {
      const parts = evDateRaw.split('-');
      if (parts.length === 3) {
        evDateShort = `${parseInt(parts[2], 10)}-${parseInt(parts[1], 10)}-${parts[0]}`;
      }
      const dObj = new Date(`${evDateRaw}T00:00:00`);
      if (!isNaN(dObj.getTime())) {
        dayOfWeek = dObj.toLocaleDateString('en-IN', { weekday: 'long' });
      }
    }

    const sessionSlot = (b.slot || bObj.timeSlot || 'day').toLowerCase();
    const sessionName = sessionSlot === 'evening' ? 'Night' : 'Day';

    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://hhevents.vercel.app';
    const orderUrl = `${origin}/order/${b.id}`;

    return `Hello ${hostName}, this is regarding your event booking request (${b.id}) at H H Events & Conventions.

Your Hall Booking Is Confirmed

Event Date : ${evDateShort} ${dayOfWeek} ${sessionName} 

Advance Recieved ${paid > 0 ? paid.toFixed(2) : '0.00'} 

📄 Official Event Order (Invoice):
${orderUrl}

Regards,
H H Events & Conventions 
Opposite Juma Masjid, Akkarangadi,
Panemangalore, Bantwal-574231
Ph:9448151878`;
  };

  // Fetch latest packages from server if configured
  useEffect(() => {
    fetch('/api/packages')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const activeOnly = data.filter((p: any) => p.active !== false);
          if (activeOnly.length > 0) {
            const mapped: ReservationPackageOption[] = activeOnly.map((p: any) => {
              const req = Array.isArray(p.requiredResources) ? p.requiredResources : [];
              const isBoth = req.includes('gents_hall') && req.includes('ladies_hall');
              const isLadies = req.includes('ladies_hall') && !req.includes('gents_hall');
              const hall: HallTarget = isBoth ? 'both' : isLadies ? 'hall_2' : 'hall_1';
              return {
                id: p.id,
                name: p.name || p.displayName,
                hall,
                rent: Number(p.rent) || 0,
                label: `${p.displayName || p.name} — ₹${Number(p.rent).toLocaleString('en-IN')}`,
              };
            });
            setPackageOptions(mapped);
          }
        }
      })
      .catch(() => {});
  }, []);

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

  // Open Dialog to block slot with detailed reason/customer hold
  const openBlockModal = (slot: SlotTarget | 'full_day') => {
    setBlockSlotTarget(slot);
    setBlockForm({
      blockType: 'customer_hold',
      customerName: '',
      customerPhone: '',
      notes: '',
    });
    setIsBlockModalOpen(true);
  };

  const handleConfirmBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBlock(true);
    try {
      await blockSlotWithDetails({
        hall: selectedHall,
        date: selectedDate,
        slot: blockSlotTarget,
        blockType: blockForm.blockType,
        customerName: blockForm.customerName.trim(),
        customerPhone: blockForm.customerPhone.trim(),
        notes: blockForm.notes.trim(),
        reason:
          blockForm.notes.trim() ||
          (blockForm.blockType === 'customer_hold'
            ? `Customer Hold: ${blockForm.customerName}`
            : blockForm.blockType === 'maintenance'
            ? 'Venue Maintenance'
            : 'Manager Administrative Hold'),
      });

      showToast(
        `${blockSlotTarget === 'full_day' ? 'Full Day' : blockSlotTarget.toUpperCase() + ' Session'} on ${selectedDate} is now BLOCKED (${blockForm.blockType === 'customer_hold' ? 'Customer Hold' : blockForm.blockType === 'maintenance' ? 'Maintenance' : 'Manager Hold'}).`,
        'success'
      );
      setIsBlockModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to block slot on server.', 'error');
    } finally {
      setIsSavingBlock(false);
    }
  };

  // Permanently make slot available & free up slot (cleans server blackouts AND deletes bookings from database)
  const handleMakeSlotAvailable = async (slot: SlotTarget) => {
    setIsReleasingSlot(true);
    try {
      const result = await releaseSlotAvailability(selectedHall, selectedDate, slot, true);
      const fresh = await syncBookingsFromServer();
      setBookings(fresh);
      showToast(
        `${slot === 'day' ? 'Day Session' : 'Evening Session'} on ${selectedDate} is now completely FREE and Available!${result.deletedBookingsCount > 0 ? ` (${result.deletedBookingsCount} booking removed from database)` : ''}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to make slot available on server.', 'error');
    } finally {
      setIsReleasingSlot(false);
    }
  };

  // Full day open/block actions
  const handleReleaseFullDay = async (makeAvailable: boolean) => {
    if (!makeAvailable) {
      openBlockModal('full_day');
      return;
    }

    setIsReleasingSlot(true);
    try {
      const result = await releaseFullDayAvailability(selectedHall, selectedDate, true);
      const fresh = await syncBookingsFromServer();
      setBookings(fresh);
      showToast(
        `Full Day on ${selectedDate} is now completely FREE and Available!${result.deletedBookingsCount > 0 ? ` (${result.deletedBookingsCount} bookings removed from database)` : ''}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to release full day.', 'error');
    } finally {
      setIsReleasingSlot(false);
    }
  };

  // Reset overrides back to system default
  const handleResetDate = async () => {
    await releaseFullDayAvailability('both', selectedDate, false).catch(() => {});
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

  // Proceed to Event Order Preview before confirming quick manual reservation
  const handleProceedToQuickPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookForm.customerName.trim()) {
      showToast('Please enter Customer / Organizer Name.', 'error', 'Missing Information');
      return;
    }
    if (!quickBookForm.phone.trim()) {
      setQuickPhoneError('Please enter a 10-digit Indian phone number (or +91)');
      showToast('Please enter a valid 10-digit Indian phone number (or +91 with 10 digits)', 'error', 'Phone Number Required');
      return;
    }

    const phoneValidation = validateIndianPhone(quickBookForm.phone);
    if (!phoneValidation.isValid) {
      setQuickPhoneError(phoneValidation.errorMessage || 'Please enter a valid 10-digit Indian phone number (or +91 with 10 digits)');
      showToast(phoneValidation.errorMessage || 'Please enter a valid 10-digit Indian phone number (or +91 with 10 digits)', 'error', 'Invalid Phone Number');
      return;
    }
    setQuickPhoneError(null);

    const conflict = checkSlotAvailability(quickBookForm.hall, selectedDate, quickBookForm.slot, 'admin_direct');
    if (!conflict.available) {
      showToast(conflict.conflictReason || 'Conflict detected: Requested slot is already occupied on this date.', 'error');
      return;
    }

    const baseRent = Number(quickBookForm.estimatedRent) || (quickBookForm.hall === 'both' ? 65000 : 30000);
    const discAmount = quickBookForm.discountValue > 0
      ? quickBookForm.discountType === 'percentage'
        ? Math.round((baseRent * quickBookForm.discountValue) / 100)
        : Math.min(baseRent, quickBookForm.discountValue)
      : 0;
    const extraAmount = Math.max(0, Number(quickBookForm.extraCharge) || 0);
    const netRent = Math.max(0, baseRent - discAmount + extraAmount);
    const advance = Number(quickBookForm.advancePaid) || 0;
    const balanceDue = Math.max(0, netRent - advance);

    const effectiveOccasion =
      quickBookForm.occasionCategory === 'Other (Custom Occasion)'
        ? (quickBookForm.customOccasion.trim() || 'Custom Function')
        : quickBookForm.occasionCategory;

    const finalEventTitle = quickBookForm.additionalNote.trim()
      ? `${effectiveOccasion} — ${quickBookForm.additionalNote.trim()}`
      : effectiveOccasion;

    const bookingId = pendingQuickBook?.id || generateBookingId();

    const newBooking: BookingRequest & any = {
      id: bookingId,
      customerName: quickBookForm.customerName.trim(),
      phone: phoneValidation.clean10,
      email: 'desk@hhevents.in',
      hall: quickBookForm.hall as any,
      hallSelection: quickBookForm.hall as any,
      slot: quickBookForm.slot,
      timeSlot: quickBookForm.slot,
      packageId: quickBookForm.packageId,
      packageName: quickBookForm.packageName,
      date: selectedDate,
      eventDate: selectedDate,
      status: 'CONFIRMED',
      acOption: quickBookForm.packageId.toLowerCase().includes('non-ac') ? 'Non AC' : 'AC',
      advancePaymentStatus: balanceDue === 0 && advance > 0 ? 'fully_paid' : advance > 0 ? 'advance_paid' : 'unpaid',
      paymentStatus: balanceDue === 0 && advance > 0 ? 'fully_paid' : advance > 0 ? 'advance_paid' : 'unpaid',
      totalAmount: netRent,
      totalEstimate: netRent,
      packagePrice: baseRent,
      originalAmount: baseRent,
      amountPaid: advance,
      balanceDue: balanceDue,
      discountAmount: discAmount > 0 ? discAmount : undefined,
      discountType: quickBookForm.discountValue > 0 ? quickBookForm.discountType : undefined,
      discountValue: quickBookForm.discountValue > 0 ? quickBookForm.discountValue : undefined,
      discountReason: discAmount > 0 ? (quickBookForm.discountReason.trim() || undefined) : undefined,
      customDiscountAmount: discAmount > 0 ? discAmount : undefined,
      customDiscountReason: discAmount > 0 ? (quickBookForm.discountReason.trim() || undefined) : undefined,
      couponCode: discAmount > 0 ? (quickBookForm.discountReason.trim() ? `DIRECT-${quickBookForm.discountReason.trim()}` : 'DIRECT-Special Discount') : undefined,
      extraCharge: extraAmount > 0 ? extraAmount : undefined,
      extraChargeReason: extraAmount > 0 ? (quickBookForm.extraChargeReason.trim() || 'Extra Charge') : undefined,
      additionalInfo: finalEventTitle,
      notes: finalEventTitle,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPendingQuickBook(newBooking);
    setQuickBookStep('preview');
  };

  const handleConfirmFinalQuickBook = async () => {
    if (!pendingQuickBook) return;

    setIsSubmittingQuickBook(true);
    try {
      await saveBookingAsync(pendingQuickBook);
      const fresh = await syncBookingsFromServer();
      setBookings(fresh);
      await syncAvailabilityFromServer();
      handleCloseQuickBook();
      setQuickBookForm({
        customerName: '',
        phone: '',
        hall: selectedHall,
        slot: 'day',
        packageId: packageOptions[0]?.id || 'full-ac-hall',
        packageName: packageOptions[0]?.name || 'Full AC Hall (Combined Campus)',
        occasionCategory: 'Wedding / Nikah (Main Ceremony)',
        customOccasion: '',
        additionalNote: '',
        estimatedRent: packageOptions[0]?.rent || 65000,
        discountType: 'fixed',
        discountValue: 0,
        discountReason: '',
        extraCharge: 0,
        extraChargeReason: '',
        advancePaid: 15000,
      });
      showToast(`Direct Reservation confirmed for ${pendingQuickBook.customerName} on ${pendingQuickBook.date}.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save manual reservation.', 'error');
    } finally {
      setIsSubmittingQuickBook(false);
    }
  };

  const handleDownloadQuickJpg = async () => {
    if (!quickReceiptRef.current || !pendingQuickBook) return;
    setIsDownloadingQuickJpg(true);
    try {
      const rawNum = pendingQuickBook.id.replace(/\D/g, '').slice(-3) || '101';
      const ok = await downloadReceiptAsJpg(
        quickReceiptRef.current,
        `HH-Event-Order-${rawNum}.jpg`,
        pendingQuickBook,
        false,
        signatureUrl
      );
      if (ok) {
        showToast('Event Order JPG downloaded successfully!', 'success');
      } else {
        showToast('Could not generate JPG. Use Print / Save PDF instead.', 'info');
      }
    } catch {
      showToast('Could not generate JPG. Use Print / Save PDF instead.', 'info');
    } finally {
      setIsDownloadingQuickJpg(false);
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
    // Pick the best matching package for current hall view
    const matchedPkg = packageOptions.find((p) => p.hall === selectedHall) || packageOptions[0];
    setQuickBookForm((prev) => ({
      ...prev,
      slot,
      hall: matchedPkg ? matchedPkg.hall : selectedHall,
      packageId: matchedPkg ? matchedPkg.id : prev.packageId,
      packageName: matchedPkg ? matchedPkg.name : prev.packageName,
      estimatedRent: matchedPkg ? matchedPkg.rent : (selectedHall === 'both' ? 65000 : 30000),
      discountType: 'fixed',
      discountValue: 0,
      discountReason: '',
      advancePaid: 15000,
    }));
    setQuickBookStep('form');
    setPendingQuickBook(null);
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
            allowPastDates={true}
            onBookSlot={(hall, date, slot) => {
              setSelectedHall(hall);
              setSelectedDate(date);
              openQuickBook(slot);
            }}
          />
        </div>

        {/* Unified Date Inspector & Slot Control Sidebar (1 col) */}
        <div className="space-y-6">
          <Card className="p-5 sm:p-6 space-y-5 border border-slate-200 shadow-sm bg-white rounded-2xl">
            {/* Inspector Header */}
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9AA72] block">
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
            {(() => {
              const dayBlackout = getSlotBlackout(selectedHall, selectedDate, 'day');

              return (
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
                    ) : dayBlackout ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {dayBlackout.blockType === 'customer_hold'
                          ? 'CUSTOMER HOLD'
                          : dayBlackout.blockType === 'maintenance'
                          ? 'MAINTENANCE'
                          : 'BLOCKED'}
                      </span>
                    ) : isDayAvailable ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        AVAILABLE
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        BLOCKED
                      </span>
                    )}
                  </div>

                  {/* 1. Confirmed / Pending Booking View (Red) */}
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
                              <button
                                type="button"
                                onClick={() => handleDirectWhatsAppShare(dayBooking)}
                                className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer shadow-2xs"
                                title="Direct Share Event Order via WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
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
                            onClick={() => handleMakeSlotAvailable('day')}
                            disabled={isReleasingSlot}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                            title="Cancel booking and completely delete from database"
                          >
                            {isReleasingSlot ? 'Freeing...' : 'Cancel & Free Slot'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : dayBlackout ? (
                    /* 2. Manager / Customer Hold Blackout View (Yellow/Amber Theme) */
                    <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-300 text-xs space-y-2 text-amber-950">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                          {dayBlackout.blockType === 'customer_hold'
                            ? 'Customer Hold'
                            : dayBlackout.blockType === 'maintenance'
                            ? 'Venue Maintenance'
                            : 'Manager Administrative Hold'}
                        </span>
                        <span className="text-[10px] text-amber-700 font-mono">
                          {dayBlackout.createdAt ? new Date(dayBlackout.createdAt).toLocaleDateString('en-IN') : ''}
                        </span>
                      </div>

                      {dayBlackout.customerName && (
                        <div>
                          <span className="text-[10px] text-amber-800 font-semibold uppercase block">Customer Details</span>
                          <div className="font-bold text-sm text-amber-950">{dayBlackout.customerName}</div>
                          {dayBlackout.customerPhone && (
                            <div className="text-xs font-mono text-amber-900 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-amber-600" />
                              <a href={`tel:${dayBlackout.customerPhone}`} className="hover:underline">
                                {dayBlackout.customerPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {(dayBlackout.notes || dayBlackout.reason) && (
                        <div>
                          <span className="text-[10px] text-amber-800 font-semibold uppercase block">Reason / Details</span>
                          <p className="text-[11.5px] text-amber-950 bg-white/90 p-2 rounded-lg border border-amber-200 leading-relaxed">
                            {dayBlackout.notes || dayBlackout.reason}
                          </p>
                        </div>
                      )}

                      {dayBlackout.blockedBy && (
                        <div className="text-[10px] text-amber-700">
                          Blocked by: <strong>{dayBlackout.blockedBy}</strong>
                        </div>
                      )}

                      <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                        <span className="text-[11px] text-amber-800 italic">Not available for public</span>
                        <button
                          type="button"
                          onClick={() => handleMakeSlotAvailable('day')}
                          disabled={isReleasingSlot}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>{isReleasingSlot ? 'Freeing...' : 'Make Available'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 3. Available State: Block Slot (with details) & Book */
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openBlockModal('day')}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-white hover:bg-amber-50 text-amber-800 border-amber-300 shadow-2xs cursor-pointer"
                        title="Block slot with customer hold or maintenance details"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Block Slot</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openQuickBook('day')}
                        className="py-2 px-3 rounded-lg text-xs font-bold bg-[#F5F1E8] hover:bg-[#EDE6D8] text-[#173D35] border border-[#E2DACB] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Book</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Session 2: Evening Session (6 PM - 10 PM) */}
            {(() => {
              const eveningBlackout = getSlotBlackout(selectedHall, selectedDate, 'evening');

              return (
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
                    ) : eveningBlackout ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {eveningBlackout.blockType === 'customer_hold'
                          ? 'CUSTOMER HOLD'
                          : eveningBlackout.blockType === 'maintenance'
                          ? 'MAINTENANCE'
                          : 'BLOCKED'}
                      </span>
                    ) : isEveningAvailable ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        AVAILABLE
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        BLOCKED
                      </span>
                    )}
                  </div>

                  {/* 1. Confirmed / Pending Booking View (Red) */}
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
                              <button
                                type="button"
                                onClick={() => handleDirectWhatsAppShare(eveningBooking)}
                                className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer shadow-2xs"
                                title="Direct Share Event Order via WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
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
                            onClick={() => handleMakeSlotAvailable('evening')}
                            disabled={isReleasingSlot}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                            title="Cancel booking and completely delete from database"
                          >
                            {isReleasingSlot ? 'Freeing...' : 'Cancel & Free Slot'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : eveningBlackout ? (
                    /* 2. Manager / Customer Hold Blackout View (Yellow/Amber Theme) */
                    <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-300 text-xs space-y-2 text-amber-950">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                          {eveningBlackout.blockType === 'customer_hold'
                            ? 'Customer Hold'
                            : eveningBlackout.blockType === 'maintenance'
                            ? 'Venue Maintenance'
                            : 'Manager Administrative Hold'}
                        </span>
                        <span className="text-[10px] text-amber-700 font-mono">
                          {eveningBlackout.createdAt ? new Date(eveningBlackout.createdAt).toLocaleDateString('en-IN') : ''}
                        </span>
                      </div>

                      {eveningBlackout.customerName && (
                        <div>
                          <span className="text-[10px] text-amber-800 font-semibold uppercase block">Customer Details</span>
                          <div className="font-bold text-sm text-amber-950">{eveningBlackout.customerName}</div>
                          {eveningBlackout.customerPhone && (
                            <div className="text-xs font-mono text-amber-900 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-amber-600" />
                              <a href={`tel:${eveningBlackout.customerPhone}`} className="hover:underline">
                                {eveningBlackout.customerPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {(eveningBlackout.notes || eveningBlackout.reason) && (
                        <div>
                          <span className="text-[10px] text-amber-800 font-semibold uppercase block">Reason / Details</span>
                          <p className="text-[11.5px] text-amber-950 bg-white/90 p-2 rounded-lg border border-amber-200 leading-relaxed">
                            {eveningBlackout.notes || eveningBlackout.reason}
                          </p>
                        </div>
                      )}

                      {eveningBlackout.blockedBy && (
                        <div className="text-[10px] text-amber-700">
                          Blocked by: <strong>{eveningBlackout.blockedBy}</strong>
                        </div>
                      )}

                      <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                        <span className="text-[11px] text-amber-800 italic">Not available for public</span>
                        <button
                          type="button"
                          onClick={() => handleMakeSlotAvailable('evening')}
                          disabled={isReleasingSlot}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>{isReleasingSlot ? 'Freeing...' : 'Make Available'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 3. Available State: Block Slot (with details) & Book */
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openBlockModal('evening')}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-white hover:bg-amber-50 text-amber-800 border-amber-300 shadow-2xs cursor-pointer"
                        title="Block slot with customer hold or maintenance details"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Block Slot</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openQuickBook('evening')}
                        className="py-2 px-3 rounded-lg text-xs font-bold bg-[#F5F1E8] hover:bg-[#EDE6D8] text-[#173D35] border border-[#E2DACB] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Book</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Quick Full-Day Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick Actions for {selectedDate}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleReleaseFullDay(true)}
                  disabled={isReleasingSlot}
                  className="py-2 px-2.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all text-center cursor-pointer shadow-2xs"
                >
                  {isReleasingSlot ? 'Freeing...' : 'Free Whole Day'}
                </button>
                <button
                  type="button"
                  onClick={() => openBlockModal('full_day')}
                  className="py-2 px-2.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all text-center cursor-pointer shadow-2xs"
                >
                  Block Whole Day
                </button>
              </div>
              <button
                type="button"
                onClick={handleResetDate}
                className="w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
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
          <div className={`bg-white rounded-2xl ${quickBookStep === 'preview' ? 'max-w-4xl' : 'max-w-lg'} w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div>
                <h4 className="font-bold text-slate-900 text-base font-serif-heading">
                  {quickBookStep === 'preview' ? `Preview Event Order — Check & Confirm (${pendingQuickBook?.id || ''})` : 'Direct Manual Reservation'}
                </h4>
                <p className="text-xs text-slate-500">
                  {quickBookStep === 'preview' ? 'Review all details, pricing, advance payment, and terms before saving' : `Instantly book and confirm a reservation on ${selectedDate}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseQuickBook}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickBookStep === 'form' ? (
              <form onSubmit={handleProceedToQuickPreview} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Function Date *
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] bg-white font-medium text-slate-800"
                />
                {selectedDate < new Date().toISOString().split('T')[0] && (
                  <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                    <span>⚠️ Past Date:</span> Recording a completed past event. An official invoice and event order will be generated.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Package &amp; Hall Space *
                </label>
                <select
                  value={quickBookForm.packageId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const pkg = packageOptions.find((p) => p.id === selId);
                    if (pkg) {
                      setQuickBookForm({
                        ...quickBookForm,
                        packageId: pkg.id,
                        packageName: pkg.name,
                        hall: pkg.hall,
                        estimatedRent: pkg.rent,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] bg-white font-medium text-slate-800"
                >
                  {packageOptions.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 px-0.5">
                  <span>Wing: <strong className="text-slate-700">{quickBookForm.hall === 'both' ? 'Combined Campus (Full Hall)' : quickBookForm.hall === 'hall_1' ? 'Hall 1 (Gents Wing)' : 'Hall 2 (Ladies Wing)'}</strong></span>
                  <span>Tariff: <strong className="text-emerald-700 font-mono">₹{Number(quickBookForm.estimatedRent).toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session Slot *
                </label>
                <select
                  value={quickBookForm.slot}
                  onChange={(e) => setQuickBookForm({ ...quickBookForm, slot: e.target.value as SlotTarget })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] bg-white font-medium"
                >
                  <option value="day">Day Session (10 AM – 3 PM)</option>
                  <option value="evening">Evening Session (6 PM – 10 PM)</option>
                </select>
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
                  Phone Number (10 digits or +91) *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210 or +91 98765 43210"
                    value={quickBookForm.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickBookForm({ ...quickBookForm, phone: val });
                      if (quickPhoneError) {
                        const res = validateIndianPhone(val);
                        if (res.isValid) setQuickPhoneError(null);
                      }
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono transition-colors focus:outline-none focus:ring-2 ${
                      quickPhoneError
                        ? 'border-rose-500 bg-rose-50/50 text-rose-950 focus:ring-rose-500 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-[#173D35]'
                    }`}
                  />
                  {quickBookForm.phone && validateIndianPhone(quickBookForm.phone).isValid && (
                    <span className="absolute right-2.5 top-2 text-[11px] font-bold text-emerald-600 pointer-events-none">
                      ✓ Valid
                    </span>
                  )}
                </div>
                {quickPhoneError ? (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{quickPhoneError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Accepts 10-digit Indian mobile number or +91 followed by 10 digits
                  </p>
                )}
              </div>

              {(() => {
                const baseRent = Number(quickBookForm.estimatedRent) || 0;
                const discAmount = quickBookForm.discountValue > 0
                  ? quickBookForm.discountType === 'percentage'
                    ? Math.round((baseRent * quickBookForm.discountValue) / 100)
                    : Math.min(baseRent, quickBookForm.discountValue)
                  : 0;
                const extraAmount = Math.max(0, Number(quickBookForm.extraCharge) || 0);
                const netRent = Math.max(0, baseRent - discAmount + extraAmount);
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

                    {quickBookForm.discountValue > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Discount Note / Reason (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Festival offer, VIP waiver (defaults to 'Special Discount')"
                          value={quickBookForm.discountReason}
                          onChange={(e) => setQuickBookForm({ ...quickBookForm, discountReason: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35]"
                        />
                      </div>
                    )}

                    {/* Extra Charge Section */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Extra Charge (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 3000 (0 if none)"
                            value={quickBookForm.extraCharge || ''}
                            onChange={(e) => setQuickBookForm({ ...quickBookForm, extraCharge: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Extra Charge Reason (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Extra cleaning, late session (defaults to 'Extra Charge')"
                            value={quickBookForm.extraChargeReason}
                            onChange={(e) => setQuickBookForm({ ...quickBookForm, extraChargeReason: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Breakdown */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Agreed Package Price:</span>
                        <span className={`font-price ${(discAmount > 0 || extraAmount > 0) ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          ₹{baseRent.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {discAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-700 font-semibold">
                          <span>
                            {quickBookForm.discountReason.trim()
                              ? `Special Discount (${quickBookForm.discountReason.trim()}):`
                              : `Special Discount (${quickBookForm.discountType === 'percentage' ? `${quickBookForm.discountValue}%` : 'Flat'}):`}
                          </span>
                          <span className="font-price">- ₹{discAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {extraAmount > 0 && (
                        <div className="flex justify-between items-center text-amber-700 font-semibold">
                          <span>{quickBookForm.extraChargeReason.trim() ? `Extra Charge (${quickBookForm.extraChargeReason.trim()}):` : 'Extra Charge:'}</span>
                          <span className="font-price">+ ₹{extraAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-bold">
                        <span className="text-slate-900">Net Payable Rent:</span>
                        <span className="text-slate-900 font-price text-sm">₹{netRent.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Advance Token Paid Now (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={quickBookForm.advancePaid}
                          onChange={(e) => setQuickBookForm({ ...quickBookForm, advancePaid: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-price text-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Remaining Balance Due (₹)
                        </label>
                        <div className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-price text-amber-800">
                          ₹{balanceDue.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Occasion / Function Type *
                  </label>
                  <select
                    value={quickBookForm.occasionCategory}
                    onChange={(e) => {
                      const occ = e.target.value;
                      setQuickBookForm({
                        ...quickBookForm,
                        occasionCategory: occ,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] bg-white font-medium text-slate-800"
                  >
                    {STANDARD_OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>

                {quickBookForm.occasionCategory === 'Other (Custom Occasion)' && (
                  <div>
                    <label className="block text-xs font-bold text-amber-800 mb-1">
                      Type Custom Occasion Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Political Convention, Award Ceremony, Silver Jubilee"
                      value={quickBookForm.customOccasion}
                      onChange={(e) => setQuickBookForm({ ...quickBookForm, customOccasion: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Additional Event Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Early kitchen access, bride room setup, floral dais decor"
                    value={quickBookForm.additionalNote}
                    onChange={(e) => setQuickBookForm({ ...quickBookForm, additionalNote: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseQuickBook}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  className="font-bold"
                  leftIcon={<Eye className="w-4 h-4" />}
                >
                  Preview &amp; Verify Event Order →
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-slate-900">
              {/* Information Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 no-print">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Check &amp; Confirm Event Order:</span> Review all customer details, slot, package, tariff, discount, extra charges, advance payment, and terms below. If you notice any mistakes, click <strong className="underline decoration-amber-600">"← Back &amp; Edit Details"</strong> to fix them before saving.
                </div>
              </div>

              {/* Event Order Receipt Preview */}
              {pendingQuickBook && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50/50 p-1 sm:p-2">
                  <A4DocumentViewer defaultMode="fit" allowToggle={true}>
                    <EventOrderReceipt
                      booking={pendingQuickBook}
                      receiptNumber={pendingQuickBook.id.replace(/\D/g, '')}
                      signatureUrl={signatureUrl}
                      signatoryDesignation={signatoryDesignation}
                      containerRef={quickReceiptRef}
                    />
                  </A4DocumentViewer>
                </div>
              )}

              {/* Bottom Action Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200 no-print">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickBookStep('form')}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                  className="cursor-pointer text-xs font-semibold"
                >
                  ← Back &amp; Edit Mistakes
                </Button>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isDownloadingQuickJpg}
                    onClick={handleDownloadQuickJpg}
                    leftIcon={<Download className="w-3.5 h-3.5 text-[#0082a6]" />}
                    className="cursor-pointer text-xs font-semibold"
                  >
                    {isDownloadingQuickJpg ? 'Downloading...' : 'Download JPG'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    leftIcon={<Printer className="w-3.5 h-3.5 text-slate-700" />}
                    className="cursor-pointer text-xs font-semibold"
                  >
                    Print / Save PDF
                  </Button>

                  <Button
                    type="button"
                    variant="gold"
                    size="sm"
                    disabled={isSubmittingQuickBook}
                    onClick={handleConfirmFinalQuickBook}
                    leftIcon={<Check className="w-4 h-4" />}
                    className="cursor-pointer text-xs font-bold"
                  >
                    {isSubmittingQuickBook ? 'Reserving...' : '✓ Confirm & Reserve Now'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Block Slot with Details Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider mb-0.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Administrative Slot Block</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base font-serif-heading">
                  Block {blockSlotTarget === 'full_day' ? 'Full Day' : `${blockSlotTarget.toUpperCase()} Session`} — {selectedDate}
                </h4>
                <p className="text-xs text-slate-500">
                  Holds this slot. It will appear as Yellow (Blocked) in management and will be completely unavailable for public reservations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBlockSlot} className="space-y-4 text-xs">
              {/* Block Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Why are you blocking this slot? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBlockForm({ ...blockForm, blockType: 'customer_hold' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      blockForm.blockType === 'customer_hold'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs">Customer Hold</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">
                      Customer requested tentative hold
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBlockForm({ ...blockForm, blockType: 'maintenance' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      blockForm.blockType === 'maintenance'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs">Maintenance</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">
                      AC, cleaning, repairs, or setup
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBlockForm({ ...blockForm, blockType: 'manager_hold' })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      blockForm.blockType === 'manager_hold'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
                      <span className="text-xs">Manager Hold</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">
                      General private reservation
                    </p>
                  </button>
                </div>
              </div>

              {/* Customer Hold Fields */}
              {blockForm.blockType === 'customer_hold' && (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    Customer Contact Information
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mohammed Iqbal"
                        value={blockForm.customerName}
                        onChange={(e) => setBlockForm({ ...blockForm, customerName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9611810386"
                        value={blockForm.customerPhone}
                        onChange={(e) => setBlockForm({ ...blockForm, customerPhone: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance / Details Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {blockForm.blockType === 'maintenance'
                    ? 'Maintenance Task Details *'
                    : blockForm.blockType === 'customer_hold'
                    ? 'Hold Reason / Conditions (Optional)'
                    : 'Reason / Remarks *'}
                </label>
                <textarea
                  rows={2}
                  required={blockForm.blockType !== 'customer_hold'}
                  placeholder={
                    blockForm.blockType === 'maintenance'
                      ? 'e.g. Full hall AC condenser servicing, dining area repaint'
                      : blockForm.blockType === 'customer_hold'
                      ? 'e.g. Customer requested 2 days to finalize advance payment with family'
                      : 'e.g. Venue booked for management VIP meeting'
                  }
                  value={blockForm.notes}
                  onChange={(e) => setBlockForm({ ...blockForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Hall Scope Info */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Applied Scope:</span>
                <strong className="text-slate-900">{getHallTitle(selectedHall)}</strong>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBlockModalOpen(false)}
                  disabled={isSavingBlock}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingBlock}
                  leftIcon={<Lock className="w-3.5 h-3.5" />}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-amber-500 shadow-sm cursor-pointer"
                >
                  Confirm &amp; Block Slot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Event Order Share Modal */}
      {whatsAppBooking && (
        <WhatsAppShareModal
          isOpen={!!whatsAppBooking}
          onClose={() => setWhatsAppBooking(null)}
          booking={whatsAppBooking}
        />
      )}
    </AdminLayout>
  );
};
