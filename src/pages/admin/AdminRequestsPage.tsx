import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
  Eye,
  Building2,
  Calendar,
  Check,
  X,
  CreditCard,
  RefreshCw,
  Phone,
  Mail,
  User,
  Printer,
  Receipt,
  Plus,
  DollarSign,
  Tag,
  Trash2,
  Percent,
  Edit2,
  Sun,
  Moon,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { BookingStatusBadge, TimeSlotBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InvoiceModal } from '../../components/ui/InvoiceModal';
import { WhatsAppShareModal } from '../../components/ui/WhatsAppShareModal';
import { EventOrderReceipt } from '../../components/ui/EventOrderReceipt';
import { A4DocumentViewer } from '../../components/ui/A4DocumentViewer';
import { shareEventOrderDirectly, downloadReceiptAsJpg } from '../../services/eventOrderShare';
import { DEFAULT_AUTHORIZED_SIGNATURE } from '../../services/defaultSignature';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { syncAvailabilityFromServer } from '../../services/availabilityManager';
import {
  fetchBookingsAsync,
  updateBookingStatusAsync,
  updatePaymentStatusAsync,
  updateAdvancePaymentAsync,
  checkSlotAvailability,
  deleteBooking,
  updateBooking,
  generateBookingId,
  validateIndianPhone,
} from '../../services/bookingStorage';
import { BookingRequest, BookingStatus } from '../../types';
import {
  RESERVATION_PACKAGE_OPTIONS,
  ReservationPackageOption,
  STANDARD_OCCASIONS,
} from '../../services/hallData';

interface AdminRequestsPageProps {
  navigate: (path: string) => void;
}

export const AdminRequestsPage: React.FC<AdminRequestsPageProps> = ({ navigate }) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [horizonFilter, setHorizonFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming');
  const [sortBy, setSortBy] = useState<'function_upcoming' | 'booked_newest' | 'function_desc'>('function_upcoming');
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);

  // Rejection dialog state
  const [rejectingBooking, setRejectingBooking] = useState<BookingRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Invoice & Receipt Modal
  const [invoiceBooking, setInvoiceBooking] = useState<BookingRequest | null>(null);
  const [whatsAppBooking, setWhatsAppBooking] = useState<BookingRequest | null>(null);

  // Direct WhatsApp Sharing without popup
  const [directShareBooking, setDirectShareBooking] = useState<BookingRequest | null>(null);
  const [sharingBookingId, setSharingBookingId] = useState<string | null>(null);
  const directReceiptRef = React.useRef<HTMLDivElement>(null);
  const [signatureUrl, setSignatureUrl] = useState<string>(DEFAULT_AUTHORIZED_SIGNATURE);
  const [signatoryDesignation, setSignatoryDesignation] = useState<string>('Authorized Signatory');

  useEffect(() => {
    // Load venue signature settings
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
    setSharingBookingId(b.id);
    try {
      await shareEventOrderDirectly({
        booking: b,
        showToast,
        signatureUrl,
      });
    } finally {
      setSharingBookingId(null);
    }
  };

  // Payment Recording Modal
  const [payingBooking, setPayingBooking] = useState<BookingRequest | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(10000);
  const [paymentType, setPaymentType] = useState<'advance' | 'balance' | 'full' | 'security_deposit'>('advance');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'bank_transfer'>('upi');
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Discount Modal State
  const [discountBooking, setDiscountBooking] = useState<BookingRequest | null>(null);
  const [customDiscountType, setCustomDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [customDiscountVal, setCustomDiscountVal] = useState<number>(0);
  const [customDiscountReason, setCustomDiscountReason] = useState<string>('');
  const [customExtraCharge, setCustomExtraCharge] = useState<number>(0);
  const [customExtraChargeReason, setCustomExtraChargeReason] = useState<string>('');
  const [discountBaseMode, setDiscountBaseMode] = useState<'current' | 'gross'>('current');
  const [discountBaseAmount, setDiscountBaseAmount] = useState<number>(0);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

  // Edit Advance Payment State
  const [editAdvanceBooking, setEditAdvanceBooking] = useState<BookingRequest | null>(null);
  const [editAdvanceAmount, setEditAdvanceAmount] = useState<number>(0);
  const [editAdvanceReason, setEditAdvanceReason] = useState<string>('');
  const [editAdvanceMethod, setEditAdvanceMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'other'>('cash');
  const [isSavingAdvance, setIsSavingAdvance] = useState(false);

  // Formatting helpers for discounts and extra charges
  const formatDiscountLabel = (b: BookingRequest) => {
    const code = (b.couponCode || '').trim();
    const reason = (b.discountReason || '').trim();

    if (code.startsWith('DIRECT-')) {
      const raw = code.replace(/^DIRECT-/, '').trim();
      if (!raw || raw.toLowerCase() === 'special discount' || raw.toLowerCase() === 'manager direct discount') {
        return reason && reason.toLowerCase() !== 'special discount' && reason.toLowerCase() !== 'manager direct discount'
          ? `Special Discount (${reason})`
          : 'Special Discount';
      }
      return `Special Discount (${raw})`;
    }

    if (code) {
      return `Coupon (${code})`;
    }

    if (reason && reason.toLowerCase() !== 'manager direct discount') {
      return reason.toLowerCase().includes('discount') ? reason : `Special Discount (${reason})`;
    }

    return 'Special Discount';
  };

  const formatExtraChargeLabel = (b: BookingRequest) => {
    const reason = (b.extraChargeReason || '').trim();
    if (!reason || reason.toLowerCase() === 'extra charge') {
      return 'Extra Charge';
    }
    return `Extra Charge (${reason})`;
  };

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

  const getAuthToken = () => {
    return (
      token ||
      localStorage.getItem('hh_auth_token_v5') ||
      sessionStorage.getItem('hh_auth_token_v5') ||
      localStorage.getItem('hh_admin_token') ||
      sessionStorage.getItem('hh_admin_token') ||
      ''
    );
  };

  // Direct Manual Reservation Modal State & Packages
  const [packageOptions, setPackageOptions] = useState<ReservationPackageOption[]>(RESERVATION_PACKAGE_OPTIONS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStep, setCreateModalStep] = useState<'form' | 'preview'>('form');
  const [pendingReservation, setPendingReservation] = useState<(BookingRequest & any) | null>(null);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [isDownloadingPreviewJpg, setIsDownloadingPreviewJpg] = useState(false);
  const previewReceiptRef = React.useRef<HTMLDivElement>(null);

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateModalStep('form');
    setPendingReservation(null);
    setCreatePhoneError(null);
  };
  const [createPhoneError, setCreatePhoneError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    hall: 'both' as 'both' | 'hall_1' | 'hall_2',
    slot: 'day' as 'day' | 'evening',
    packageId: 'full-ac-hall',
    packageName: 'Full AC Hall (Combined Campus)',
    occasionCategory: 'Wedding / Nikah (Main Ceremony)',
    customOccasion: '',
    additionalNote: '',
    customerName: '',
    phone: '',
    estimatedRent: 65000,
    discountType: 'fixed' as 'fixed' | 'percentage',
    discountValue: 0,
    discountReason: '',
    extraCharge: 0,
    extraChargeReason: '',
    advancePaid: 15000,
    notes: 'Wedding / Nikah (Main Ceremony)',
  });

  // Edit Date, Session Slot & Package State (Inside Manage / Dossier Modal)
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [editScheduleForm, setEditScheduleForm] = useState({
    date: '',
    slot: 'day' as 'day' | 'evening',
    packageId: '',
    hall: 'both' as 'both' | 'hall_1' | 'hall_2',
    reason: '',
    discountAmount: 0,
    discountReason: '',
    extraCharge: 0,
    extraChargeReason: '',
  });

  const startEditingSchedule = (booking: BookingRequest) => {
    const rawSlot = (booking.slot || (booking as any).timeSlot || 'day').toLowerCase();
    const currentSlot: 'day' | 'evening' = rawSlot === 'evening' ? 'evening' : 'day';
    const currentDate = booking.date || booking.eventDate || '';
    const currentHall = ((booking.hall || (booking as any).hallSelection || 'hall_1') as 'both' | 'hall_1' | 'hall_2');

    let currentPkgId = booking.packageId || '';
    if (!currentPkgId) {
      const match = packageOptions.find(
        (p) => p.name.toLowerCase() === (booking.packageName || '').toLowerCase()
      );
      if (match) currentPkgId = match.id;
      else if (booking.hall === 'both') currentPkgId = 'full-ac-hall';
      else currentPkgId = 'single-ac-hall-1';
    }

    const bObj = booking as any;
    const existingDisc = Number(bObj.discountAmount) || 0;
    let existingDiscReason = (bObj.discountReason || '').trim();
    if (!existingDiscReason && (bObj.couponCode || '').startsWith('DIRECT-')) {
      existingDiscReason = (bObj.couponCode || '').replace(/^DIRECT-/, '').trim();
    }
    if (existingDiscReason.toLowerCase() === 'manager direct discount') {
      existingDiscReason = 'Special Discount';
    }

    const existingExtra = Number(bObj.extraCharge) || 0;
    const existingExtraReason = (bObj.extraChargeReason || '').trim();

    setEditScheduleForm({
      date: currentDate,
      slot: currentSlot,
      packageId: currentPkgId,
      hall: currentHall,
      reason: '',
      discountAmount: existingDisc,
      discountReason: existingDiscReason || (existingDisc > 0 ? 'Special Discount' : ''),
      extraCharge: existingExtra,
      extraChargeReason: existingExtraReason || (existingExtra > 0 ? 'If AC Needed' : ''),
    });
    setIsEditingSchedule(true);
  };

  const handleSaveScheduleUpdate = async () => {
    if (!selectedBooking) return;
    if (!editScheduleForm.date) {
      showToast('Please select a valid event date.', 'error');
      return;
    }

    const selectedPkg = packageOptions.find((p) => p.id === editScheduleForm.packageId);
    const isSingle = selectedPkg ? selectedPkg.hall !== 'both' : editScheduleForm.hall !== 'both';
    const targetHall = isSingle ? (editScheduleForm.hall === 'hall_2' ? 'hall_2' : 'hall_1') : 'both';
    const basePkgName = selectedPkg ? selectedPkg.name : (selectedBooking.packageName || '');
    const cleanBase = basePkgName.replace(/\s*\(Hall 1\s*\/\s*Hall 2\)/i, '').replace(/\s*-\s*Hall\s*[12]\s*\([^)]*\)/i, '').trim();
    const targetPkgName = isSingle
      ? `${cleanBase} - ${targetHall === 'hall_2' ? 'Hall 2 (Ladies Wing)' : 'Hall 1 (Gents Wing)'}`
      : basePkgName;
    const targetRent = selectedPkg ? selectedPkg.rent : ((selectedBooking as any).packagePrice || 30000);
    const targetAc = selectedPkg?.name.toLowerCase().includes('non ac') || selectedPkg?.name.toLowerCase().includes('non-ac') ? 'non_ac' : 'ac';

    setIsSavingSchedule(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
          'x-admin-token': getAuthToken(),
        },
        body: JSON.stringify({
          date: editScheduleForm.date,
          slot: editScheduleForm.slot,
          packageId: selectedPkg ? selectedPkg.id : selectedBooking.packageId,
          packageName: targetPkgName,
          hallSelection: targetHall,
          hall: targetHall,
          acOption: targetAc,
          packagePrice: targetRent,
          reason: editScheduleForm.reason || 'Manager schedule & pricing update',
          discountAmount: Math.max(0, Number(editScheduleForm.discountAmount) || 0),
          discountReason: editScheduleForm.discountReason.trim() || undefined,
          extraCharge: Math.max(0, Number(editScheduleForm.extraCharge) || 0),
          extraChargeReason: editScheduleForm.extraChargeReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update schedule. Space might be already occupied.', 'error');
        setIsSavingSchedule(false);
        return;
      }

      showToast(`Reservation ${selectedBooking.id} successfully updated!`, 'success');

      // Immediately sync availability cache for public & admin calendars
      await syncAvailabilityFromServer();

      // Update currently open dossier modal and client cache
      if (data.booking) {
        setSelectedBooking((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...data.booking,
            date: data.booking.date,
            eventDate: data.booking.date,
            slot: data.booking.slot,
            timeSlot: data.booking.slot,
            packageId: data.booking.packageId,
            packageName: data.booking.packageName,
            hall: data.booking.hallSelection || data.booking.hall,
            acOption: data.booking.acOption,
            totalAmount: data.booking.totalAmount,
            packagePrice: data.booking.packagePrice,
            originalAmount: data.booking.originalAmount,
            balanceDue: data.booking.balanceDue,
            discountAmount: data.booking.discountAmount,
            discountReason: data.booking.discountReason,
            couponCode: data.booking.couponCode,
            extraCharge: data.booking.extraCharge,
            extraChargeReason: data.booking.extraChargeReason,
          };
        });
        updateBooking(selectedBooking.id, data.booking);
      }

      // Reload bookings list
      await loadBookings();

      setIsEditingSchedule(false);
    } catch (err: any) {
      showToast(err?.message || 'Error updating schedule on server', 'error');
    } finally {
      setIsSavingSchedule(false);
    }
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
              const hall: 'both' | 'hall_1' | 'hall_2' = isBoth ? 'both' : isLadies ? 'hall_2' : 'hall_1';
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

  const handleProceedToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.customerName.trim()) {
      showToast('Please enter Customer / Organizer Name', 'error', 'Missing Information');
      return;
    }

    if (!createForm.phone.trim()) {
      setCreatePhoneError('Please enter a 10-digit Indian phone number (or +91)');
      showToast('Please enter a valid 10-digit Indian phone number (or +91 with 10 digits)', 'error', 'Phone Number Required');
      return;
    }

    const phoneValidation = validateIndianPhone(createForm.phone);
    if (!phoneValidation.isValid) {
      setCreatePhoneError(phoneValidation.errorMessage || 'Please enter a valid 10-digit Indian phone number (or +91 with 10 digits)');
      showToast(phoneValidation.errorMessage || 'Please enter a valid 10-digit Indian phone number (or +91 with 10 digits)', 'error', 'Invalid Phone Number');
      return;
    }
    setCreatePhoneError(null);

    if (!createForm.date) {
      showToast('Please select an Event Function Date', 'error', 'Missing Information');
      return;
    }

    const baseRent = Number(createForm.estimatedRent) || 0;
    const discAmount = createForm.discountValue > 0
      ? createForm.discountType === 'percentage'
        ? Math.round((baseRent * createForm.discountValue) / 100)
        : Math.min(baseRent, createForm.discountValue)
      : 0;
    const extraAmount = Math.max(0, Number(createForm.extraCharge) || 0);
    const netRent = Math.max(0, baseRent - discAmount + extraAmount);
    const advance = Number(createForm.advancePaid) || 0;
    const balanceDue = Math.max(0, netRent - advance);

    // Conflict check (admins creating direct reservation only check against existing confirmed bookings)
    const conflict = checkSlotAvailability(createForm.hall, createForm.date, createForm.slot, 'admin_direct');
    if (!conflict.available) {
      showToast(conflict.conflictReason || conflict.reason || 'Conflict: Slot is already occupied on this date.', 'error');
      return;
    }

    const effectiveOccasion =
      createForm.occasionCategory === 'Other (Custom Occasion)'
        ? (createForm.customOccasion.trim() || 'Custom Function')
        : createForm.occasionCategory;

    const finalEventTitle = createForm.additionalNote.trim()
      ? `${effectiveOccasion} — ${createForm.additionalNote.trim()}`
      : effectiveOccasion;

    const bookingId = pendingReservation?.id || generateBookingId();

    const pending: BookingRequest & any = {
      id: bookingId,
      customerName: createForm.customerName.trim(),
      phone: phoneValidation.clean10,
      email: 'desk@hhevents.in',
      hall: createForm.hall,
      hallSelection: createForm.hall,
      slot: createForm.slot,
      timeSlot: createForm.slot,
      date: createForm.date,
      eventDate: createForm.date,
      packageId: createForm.packageId,
      packageName: createForm.packageName,
      acOption: createForm.packageId.toLowerCase().includes('non-ac') ? 'Non AC' : 'AC',
      totalAmount: netRent,
      totalEstimate: netRent,
      packagePrice: baseRent,
      originalAmount: baseRent,
      discountAmount: discAmount > 0 ? discAmount : undefined,
      discountType: createForm.discountValue > 0 ? createForm.discountType : undefined,
      discountValue: createForm.discountValue > 0 ? createForm.discountValue : undefined,
      discountReason: discAmount > 0 ? (createForm.discountReason.trim() || undefined) : undefined,
      customDiscountReason: discAmount > 0 ? (createForm.discountReason.trim() || undefined) : undefined,
      couponCode: discAmount > 0 ? (createForm.discountReason.trim() ? `DIRECT-${createForm.discountReason.trim()}` : 'DIRECT-Special Discount') : undefined,
      extraCharge: extraAmount > 0 ? extraAmount : undefined,
      extraChargeReason: extraAmount > 0 ? (createForm.extraChargeReason.trim() || 'Extra Charge') : undefined,
      amountPaid: advance,
      balanceDue: balanceDue,
      paymentStatus: balanceDue === 0 && advance > 0 ? 'fully_paid' : advance > 0 ? 'advance_paid' : 'unpaid',
      advancePaymentStatus: balanceDue === 0 && advance > 0 ? 'fully_paid' : advance > 0 ? 'advance_paid' : 'unpaid',
      status: 'CONFIRMED',
      notes: finalEventTitle,
      additionalInfo: finalEventTitle,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPendingReservation(pending);
    setCreateModalStep('preview');
  };

  const handleFinalConfirmReservation = async () => {
    if (!pendingReservation) return;

    setIsSubmittingReservation(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(pendingReservation),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to create reservation', 'error');
        return;
      }

      showToast(`Reservation successfully confirmed for ${pendingReservation.customerName}!`, 'success');
      setIsCreateModalOpen(false);
      setCreateModalStep('form');
      setPendingReservation(null);
      setCreateForm({
        date: new Date().toISOString().slice(0, 10),
        hall: packageOptions[0]?.hall || 'both',
        slot: 'day',
        packageId: packageOptions[0]?.id || 'full-ac-hall',
        packageName: packageOptions[0]?.name || 'Full AC Hall (Combined Campus)',
        occasionCategory: 'Wedding / Nikah (Main Ceremony)',
        customOccasion: '',
        additionalNote: '',
        customerName: '',
        phone: '',
        estimatedRent: packageOptions[0]?.rent || 65000,
        discountType: 'fixed',
        discountValue: 0,
        discountReason: '',
        extraCharge: 0,
        extraChargeReason: '',
        advancePaid: 15000,
        notes: 'Wedding / Nikah (Main Ceremony)',
      });
      await loadBookings();
    } catch {
      showToast('Error connecting to server', 'error');
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  const handleDownloadPreviewJpg = async () => {
    if (!previewReceiptRef.current || !pendingReservation) return;
    setIsDownloadingPreviewJpg(true);
    try {
      const rawNum = pendingReservation.id.replace(/\D/g, '').slice(-3) || '101';
      const ok = await downloadReceiptAsJpg(
        previewReceiptRef.current,
        `HH-Event-Order-${rawNum}.jpg`,
        pendingReservation,
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
      setIsDownloadingPreviewJpg(false);
    }
  };

  const loadBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBookingsAsync();
      setBookings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusChange = async (
    id: string,
    newStatus: BookingStatus,
    remarks?: string
  ) => {
    if (newStatus === 'confirmed' || (newStatus as any) === 'approved' || (newStatus as any) === 'APPROVED') {
      const b = bookings.find((item) => item.id === id);
      if (b) {
        const conflict = checkSlotAvailability(b.hall || 'hall_1', b.date || b.eventDate || '', (b.slot || b.timeSlot) as any, b.id);
        if (!conflict.available) {
          showToast(conflict.conflictReason || conflict.reason || 'Conflict detected: space already occupied.', 'error');
          return;
        }
      }
    }

    setIsProcessing(true);
    try {
      await updateBookingStatusAsync(id, newStatus, remarks, user?.email || 'admin@hhevents.in');
      showToast(`Reservation ${id} updated to ${newStatus}.`, 'success');
      await loadBookings();
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({
          ...selectedBooking,
          status: newStatus,
          adminRemarks: remarks || selectedBooking.adminRemarks,
        });
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update booking status in database', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    setIsProcessing(true);
    try {
      await updateBookingStatusAsync(
        rejectingBooking.id,
        'rejected',
        rejectionReason || 'Declined by venue management',
        user?.email || 'admin@hhevents.in'
      );
      showToast(`Application ${rejectingBooking.id} rejected.`, 'info');
      await loadBookings();
      setRejectingBooking(null);
      setRejectionReason('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to reject booking in database', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const openPaymentModal = (b: BookingRequest) => {
    setPayingBooking(b);
    const bObj = b as any;
    const total = bObj.totalAmount || b.totalEstimate || b.estimatedAmount || bObj.packagePrice || 65000;
    const paid = bObj.amountPaid !== undefined ? Number(bObj.amountPaid) : 0;
    const remaining = bObj.balanceDue !== undefined ? Number(bObj.balanceDue) : Math.max(0, total - paid);
    setPaymentAmount(remaining > 0 ? (paid === 0 ? Math.round(total * 0.25) : remaining) : 10000);
    setPaymentType(paid === 0 ? 'advance' : 'balance');
    setPaymentRefNo('');
    setPaymentNotes('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBooking || paymentAmount <= 0) {
      showToast('Please enter a valid positive payment amount.', 'error');
      return;
    }

    setIsRecordingPayment(true);
    try {
      const res = await fetch(`/api/bookings/${payingBooking.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          paymentType,
          paymentMethod,
          referenceNo: paymentRefNo.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to record payment transaction', 'error');
        return;
      }

      showToast(`Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully. Receipt issued!`, 'success');
      await loadBookings();
      setPayingBooking(null);
    } catch {
      showToast('Network error while recording payment transaction.', 'error');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete booking #${bookingId} from the database? This will completely remove it from frontend, backend, and MongoDB database and release the slot.`
      )
    ) {
      return;
    }
    setDeletingBookingId(bookingId);
    try {
      const activeToken = getAuthToken();
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res.ok) {
        const cleanId = (bookingId || '').trim().toLowerCase();
        setBookings((prev) => prev.filter((b) => (b.id || '').trim().toLowerCase() !== cleanId));
        if (selectedBooking && (selectedBooking.id || '').trim().toLowerCase() === cleanId) {
          setSelectedBooking(null);
        }
        if (payingBooking && (payingBooking.id || '').trim().toLowerCase() === cleanId) {
          setPayingBooking(null);
        }
        if (discountBooking && (discountBooking.id || '').trim().toLowerCase() === cleanId) {
          setDiscountBooking(null);
        }
        // Purge completely from client storage service and localStorage
        deleteBooking(bookingId);
        showToast(`Booking #${bookingId} has been completely removed from database and client records.`, 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to delete booking from server', 'error');
      }
    } catch {
      showToast('Network error while deleting booking from database', 'error');
    } finally {
      setDeletingBookingId(null);
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountBooking) return;
    setIsApplyingDiscount(true);
    try {
      const activeToken = getAuthToken();
      const res = await fetch(`/api/bookings/${encodeURIComponent(discountBooking.id)}/discount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          discountType: customDiscountType,
          discountValue: customDiscountVal,
          baseAmount: discountBaseAmount,
          reason: customDiscountReason.trim() || undefined,
          extraCharge: customExtraCharge,
          extraChargeReason: customExtraChargeReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedBooking = data.booking;
        const cleanId = (discountBooking.id || '').trim().toLowerCase();
        setBookings((prev) =>
          prev.map((b) => ((b.id || '').trim().toLowerCase() === cleanId ? { ...b, ...updatedBooking } : b))
        );
        if (selectedBooking && (selectedBooking.id || '').trim().toLowerCase() === cleanId) {
          setSelectedBooking({ ...selectedBooking, ...updatedBooking });
        }
        // Update local client cache as well
        updateBooking(discountBooking.id, updatedBooking);
        setDiscountBooking(null);
        showToast(
          `Discount applied to #${discountBooking.id}. Net payable: ₹${(updatedBooking.totalAmount || 0).toLocaleString('en-IN')}, Balance due: ₹${(updatedBooking.balanceDue || 0).toLocaleString('en-IN')}`,
          'success'
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to apply discount', 'error');
      }
    } catch {
      showToast('Error applying discount', 'error');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleOpenEditAdvance = (b: BookingRequest) => {
    const bObj = b as any;
    const currentPaid = bObj.amountPaid !== undefined
      ? Number(bObj.amountPaid)
      : (b.advancePaymentStatus === 'fully_paid'
          ? Number(bObj.totalAmount || b.totalEstimate || b.estimatedAmount || 0)
          : b.advancePaymentStatus === 'advance_paid'
          ? Math.round(Number(bObj.totalAmount || b.totalEstimate || b.estimatedAmount || 0) * 0.25)
          : 0);

    setEditAdvanceBooking(b);
    setEditAdvanceAmount(currentPaid);
    setEditAdvanceReason('');
    const firstPayment = bObj.payments && Array.isArray(bObj.payments) && bObj.payments[0];
    setEditAdvanceMethod(firstPayment?.paymentMethod || 'cash');
  };

  const handleSaveAdvanceCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdvanceBooking) return;

    if (isNaN(editAdvanceAmount) || editAdvanceAmount < 0) {
      showToast('Please enter a valid non-negative advance amount (₹0 or more).', 'error');
      return;
    }

    setIsSavingAdvance(true);
    try {
      const res = await updateAdvancePaymentAsync(
        editAdvanceBooking.id,
        editAdvanceAmount,
        editAdvanceReason.trim() || 'Advance payment amount corrected by manager',
        editAdvanceMethod
      );

      if (res.success && res.booking) {
        const updatedBooking = res.booking;
        const cleanId = (editAdvanceBooking.id || '').trim().toLowerCase();

        setBookings((prev) =>
          prev.map((b) => ((b.id || '').trim().toLowerCase() === cleanId ? { ...b, ...updatedBooking } : b))
        );

        if (selectedBooking && (selectedBooking.id || '').trim().toLowerCase() === cleanId) {
          setSelectedBooking((prev) => prev ? { ...prev, ...updatedBooking } : null);
        }

        updateBooking(editAdvanceBooking.id, updatedBooking);
        setEditAdvanceBooking(null);
        showToast(
          `Advance payment for #${editAdvanceBooking.id} successfully updated to ₹${editAdvanceAmount.toLocaleString('en-IN')}. Remaining balance: ₹${(Number(updatedBooking.balanceDue) || 0).toLocaleString('en-IN')}`,
          'success'
        );
        await loadBookings();
      } else {
        showToast(res.error || 'Failed to update advance payment', 'error');
      }
    } catch {
      showToast('Error updating advance payment', 'error');
    } finally {
      setIsSavingAdvance(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const upcomingCount = React.useMemo(() => {
    return bookings.filter((b) => {
      const d = b.date || (b as any).eventDate || '';
      return d >= todayStr;
    }).length;
  }, [bookings, todayStr]);

  const pastCount = React.useMemo(() => {
    return bookings.filter((b) => {
      const d = b.date || (b as any).eventDate || '';
      return d && d < todayStr;
    }).length;
  }, [bookings, todayStr]);

  const filteredBookings = React.useMemo(() => {
    return bookings
      .filter((b) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          (b.customerName || b.applicantName || '').toLowerCase().includes(searchLower) ||
          (b.phone || b.applicantPhone || '').includes(searchQuery) ||
          b.id.toLowerCase().includes(searchLower) ||
          (b.packageName || '').toLowerCase().includes(searchLower) ||
          (b.date || (b as any).eventDate || '').includes(searchLower);

        const statusUpper = (b.status || '').toUpperCase();
        const filterUpper = statusFilter.toUpperCase();
        const matchesStatus = statusFilter === 'all' || statusUpper === filterUpper;

        const eventD = b.date || (b as any).eventDate || '';
        const isPast = eventD && eventD < todayStr;
        const matchesHorizon =
          horizonFilter === 'all'
            ? true
            : horizonFilter === 'upcoming'
            ? !isPast
            : isPast;

        return matchesSearch && matchesStatus && matchesHorizon;
      })
      .sort((a, b) => {
        if (sortBy === 'booked_newest') {
          const tA = new Date(a.submittedAt || 0).getTime();
          const tB = new Date(b.submittedAt || 0).getTime();
          return tB - tA;
        }

        if (sortBy === 'function_desc') {
          const dA = a.date || (a as any).eventDate || '';
          const dB = b.date || (b as any).eventDate || '';
          return dB.localeCompare(dA);
        }

        // Default: 'function_upcoming'
        // Nearest upcoming functions first (ascending order)
        // Followed by past functions at the very bottom
        const dA = a.date || (a as any).eventDate || '';
        const dB = b.date || (b as any).eventDate || '';
        const isPastA = dA && dA < todayStr;
        const isPastB = dB && dB < todayStr;

        if (!isPastA && isPastB) return -1;
        if (isPastA && !isPastB) return 1;

        if (!isPastA && !isPastB) {
          if (dA !== dB) return dA.localeCompare(dB);
          return (a.slot || '').localeCompare(b.slot || '');
        }

        // Both are past: sort descending (most recently passed function first among past)
        return dB.localeCompare(dA);
      });
  }, [bookings, searchQuery, statusFilter, horizonFilter, sortBy, todayStr]);

  return (
    <AdminLayout
      currentPath="/admin/bookings"
      navigate={navigate}
      title="Reservation Requests & Ledger"
      subtitle="Review online requests, record payments, prevent conflicts, and generate printable invoices"
      actionButton={
        <div className="flex items-center gap-2">
          <Button
            onClick={loadBookings}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Data
          </Button>
          <Button
            onClick={() => {
              setCreateModalStep('form');
              setPendingReservation(null);
              setIsCreateModalOpen(true);
            }}
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Reservation
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          {/* Top Row: Search Input + Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, mobile, reference, package, or event date..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#173D35] bg-white"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#173D35] cursor-pointer"
              >
                <option value="function_upcoming">📅 Function Date (Upcoming First)</option>
                <option value="booked_newest">🕒 Booked Time (Newest First)</option>
                <option value="function_desc">📅 Function Date (Farthest First)</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Horizon Tabs + Status Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
            {/* Horizon Filter: Upcoming vs All vs Past */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E2DACB] self-start">
              <button
                type="button"
                onClick={() => setHorizonFilter('upcoming')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  horizonFilter === 'upcoming'
                    ? 'bg-[#173D35] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Upcoming</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  horizonFilter === 'upcoming' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {upcomingCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHorizonFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  horizonFilter === 'all'
                    ? 'bg-[#173D35] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  horizonFilter === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {bookings.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHorizonFilter('past')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  horizonFilter === 'past'
                    ? 'bg-[#173D35] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Past</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  horizonFilter === 'past' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {pastCount}
                </span>
              </button>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {['all', 'pending', 'approved', 'confirmed', 'completed', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings Table / Mobile Cards */}
        {filteredBookings.length === 0 ? (
          <EmptyState
            title="No Bookings Found"
            description="No reservations match the specified search or status filter."
            actionText="Reset Search"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          />
        ) : (
          <div className="space-y-4">
            {/* Mobile Cards (Visible on mobile < md) */}
            <div className="md:hidden space-y-3">
              {filteredBookings.map((b) => {
                const bObj = b as any;
                const netRent = bObj.totalAmount !== undefined
                  ? Number(bObj.totalAmount)
                  : (b.totalEstimate || b.estimatedAmount || 30000);
                const disc = Number(b.discountAmount) || 0;
                const extra = Number(bObj.extraCharge) || 0;
                const extraReason = bObj.extraChargeReason || 'Extra Charge';
                const grossRent = Number(bObj.originalAmount || bObj.packagePrice) || (disc > 0 || extra > 0 ? netRent + disc - extra : netRent);
                const paid = Number(bObj.amountPaid) || 0;
                const balance = bObj.balanceDue !== undefined
                  ? Number(bObj.balanceDue)
                  : Math.max(0, netRent - paid);

                return (
                  <div key={b.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-[#173D35]">{b.id}</span>
                      <BookingStatusBadge status={b.status} />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{b.customerName || b.applicantName}</h4>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{b.phone || b.applicantPhone}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-slate-100">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                        {b.packageName || (b.hall === 'both' ? 'Full Combined Hall' : b.hall === 'hall_2' ? 'Hall 2 (Ladies)' : 'Hall 1 (Gents)')}
                      </span>
                      {(() => {
                        const evDate = b.date || b.eventDate || '';
                        const isToday = evDate === todayStr;
                        const isPast = evDate && evDate < todayStr;
                        const diffDays = evDate ? Math.round((new Date(evDate + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) / 86400000) : null;
                        return (
                          <span className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                            isToday
                              ? 'bg-emerald-600 text-white font-bold'
                              : isPast
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-50 text-amber-800'
                          }`}>
                            <span>{evDate} ({b.slot || b.timeSlot})</span>
                            {isToday && <span className="bg-white/30 px-1 rounded text-[9px]">TODAY</span>}
                            {!isToday && !isPast && diffDays === 1 && <span className="text-[10px]">• Tomorrow</span>}
                            {isPast && <span className="text-[10px]">• Past</span>}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100 bg-slate-50/60 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Rent</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {(disc > 0 || extra > 0) && grossRent !== netRent && (
                            <span className="text-[10px] font-mono text-slate-400 line-through">₹{grossRent.toLocaleString('en-IN')}</span>
                          )}
                          <span className="font-mono font-bold text-slate-900">₹{netRent.toLocaleString('en-IN')}</span>
                        </div>
                        {disc > 0 && (
                          <span className="text-[9.5px] text-emerald-700 font-semibold block">-₹{disc.toLocaleString('en-IN')} ({formatDiscountLabel(b)})</span>
                        )}
                        {extra > 0 && (
                          <span className="text-[9.5px] text-amber-800 font-semibold block">+₹{extra.toLocaleString('en-IN')} ({extraReason})</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Paid</span>
                        <span className="font-mono font-semibold text-emerald-700">₹{paid.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Balance</span>
                        <span className={`font-mono font-bold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {balance > 0 ? `₹${balance.toLocaleString('en-IN')}` : 'Settled'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                      {b.phone && (
                        <button
                          type="button"
                          onClick={() => handleDirectWhatsAppShare(b)}
                          disabled={sharingBookingId === b.id}
                          className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Direct Share Event Order via WhatsApp"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{sharingBookingId === b.id ? 'Sending...' : 'WhatsApp'}</span>
                        </button>
                      )}
                      {b.phone && (
                        <a
                          href={`tel:${b.phone}`}
                          className="p-1.5 sm:p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>Call</span>
                        </a>
                      )}
                      <button
                        onClick={() => setInvoiceBooking(b)}
                        className="p-1.5 sm:p-2 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5 text-amber-700" />
                        <span>Receipt</span>
                      </button>
                      <Button
                        onClick={() => setSelectedBooking(b)}
                        variant={b.status === 'PENDING' ? 'gold' : 'outline'}
                        size="sm"
                        className="text-xs font-bold px-2.5 py-1.5"
                      >
                        {b.status === 'PENDING' ? 'Review' : 'Manage'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBooking(b.id)}
                        disabled={deletingBookingId === b.id}
                        className="p-1.5 sm:p-2 rounded-lg text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        title="Permanently Delete Booking from Database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Hidden on mobile < md) */}
            <Card className="hidden md:block overflow-hidden border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 whitespace-nowrap">Reference</th>
                      <th className="p-2.5">Applicant / Host</th>
                      <th className="p-2.5">Package &amp; Spaces</th>
                      <th className="p-2.5 whitespace-nowrap">Event Date &amp; Slot</th>
                      <th className="p-2.5 whitespace-nowrap">Financials</th>
                      <th className="p-2.5 text-center whitespace-nowrap">Status</th>
                      <th className="p-2.5 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => {
                      const bObj = b as any;
                      const netRent = bObj.totalAmount !== undefined
                        ? Number(bObj.totalAmount)
                        : (b.totalEstimate || b.estimatedAmount || 30000);
                      const disc = Number(b.discountAmount) || 0;
                      const extra = Number(bObj.extraCharge) || 0;
                      const extraReason = bObj.extraChargeReason || 'Extra Charge';
                      const grossRent = Number(bObj.originalAmount || bObj.packagePrice) || (disc > 0 || extra > 0 ? netRent + disc - extra : netRent);
                      const paid = Number(bObj.amountPaid) || 0;
                      const balance = bObj.balanceDue !== undefined
                        ? Number(bObj.balanceDue)
                        : Math.max(0, netRent - paid);

                      return (
                        <tr key={b.id} className="group hover:bg-slate-50/70 transition-colors">
                          <td className="p-2.5 align-middle whitespace-nowrap">
                            <div className="font-mono font-bold text-[#173D35] text-xs">
                              {b.id}
                            </div>
                            {b.submittedAt ? (
                              <div className="text-[10.5px] text-slate-500 font-mono flex items-center gap-1 mt-0.5" title={`Booked on: ${b.submittedAt}`}>
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  {new Date(b.submittedAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                  {' '}
                                  <span className="text-slate-400">
                                    {new Date(b.submittedAt).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true,
                                    })}
                                  </span>
                                </span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Direct Entry
                              </div>
                            )}
                          </td>

                          <td className="p-2.5 align-middle">
                            <strong className="block text-slate-900 font-medium">
                              {b.customerName || b.applicantName}
                            </strong>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {b.phone || b.applicantPhone}
                            </span>
                          </td>

                          <td className="p-2.5 align-middle text-slate-700">
                            <strong className="block font-medium">
                              {b.packageName || (b.hall === 'both' ? 'Full Combined Hall' : 'Single Hall')}
                            </strong>
                            <span className="text-[11px] text-slate-500 block">
                              {b.hall === 'both' ? 'Gents + Ladies Hall' : b.hall === 'hall_2' ? 'Hall 2 (Ladies)' : 'Hall 1 (Gents)'} &bull; {b.acOption?.toUpperCase()}
                            </span>
                          </td>

                          <td className="p-2.5 text-slate-700 whitespace-nowrap align-middle">
                            {(() => {
                              const evDate = b.date || b.eventDate || '';
                              const isToday = evDate === todayStr;
                              const isPast = evDate && evDate < todayStr;
                              const diffDays = evDate ? Math.round((new Date(evDate + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) / 86400000) : null;
                              const sessionSlot = ((b.slot || (b as any).timeSlot || 'day') + ' SESSION').toUpperCase();

                              return (
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                                    {sessionSlot}
                                  </span>
                                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-900">
                                    <span>{evDate}</span>
                                    {isToday && (
                                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                        Today
                                      </span>
                                    )}
                                    {!isToday && !isPast && diffDays !== null && diffDays <= 7 && (
                                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                                        {diffDays === 1 ? 'Tomorrow' : `In ${diffDays}d`}
                                      </span>
                                    )}
                                    {isPast && (
                                      <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 text-[9px] font-medium">
                                        Past
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          <td className="p-2.5 text-slate-900 align-middle">
                            <div className="flex flex-col items-start gap-1 font-price">
                              <span className="font-bold text-slate-900 text-xs">
                                ₹{netRent.toLocaleString('en-IN')}
                              </span>
                              {disc > 0 && (
                                <span className="inline-flex items-center text-[10.5px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md leading-tight whitespace-nowrap">
                                  {(() => {
                                    const rawDisc = (bObj.discountReason || (bObj.couponCode?.startsWith('DIRECT-') ? bObj.couponCode.replace(/^DIRECT-/, '') : '') || '').trim();
                                    return rawDisc && rawDisc.toLowerCase() !== 'special discount'
                                      ? `${rawDisc}: ₹${disc.toLocaleString('en-IN')}`
                                      : `Special Discount: ₹${disc.toLocaleString('en-IN')}`;
                                  })()}
                                </span>
                              )}
                              {extra > 0 && (
                                <span className="inline-flex items-center text-[10px] text-amber-800 font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md leading-tight whitespace-nowrap">
                                  + ₹{extra.toLocaleString('en-IN')} ({extraReason})
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-2.5 text-center align-middle whitespace-nowrap">
                            <BookingStatusBadge status={b.status} />
                          </td>

                          <td className="p-2.5 text-right align-middle whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1. Direct WhatsApp Contact & Event Order Share */}
                              {b.phone && (
                                <button
                                  type="button"
                                  onClick={() => handleDirectWhatsAppShare(b)}
                                  disabled={sharingBookingId === b.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0 cursor-pointer shadow-2xs"
                                  title="Direct Share Event Order via WhatsApp"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>{sharingBookingId === b.id ? 'Sending...' : 'WhatsApp'}</span>
                                </button>
                              )}

                              {/* 2. Direct Phone Call */}
                              {b.phone && (
                                <a
                                  href={`tel:${b.phone}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                                  title="Call Customer"
                                >
                                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Call</span>
                                </a>
                              )}

                              {/* 3. Primary Review / Manage Button */}
                              <Button
                                onClick={() => setSelectedBooking(b)}
                                variant={b.status === 'PENDING' ? 'gold' : 'outline'}
                                size="sm"
                                className="cursor-pointer font-semibold px-2.5 py-1 text-xs min-h-[30px] shrink-0"
                                title="Manage Reservation"
                              >
                                {b.status === 'PENDING' ? 'Review' : 'Manage'}
                              </Button>

                              {/* 4. Official Printable Receipt Button */}
                              <button
                                onClick={() => setInvoiceBooking(b)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer shrink-0"
                                title="Print Official Receipt & Invoice"
                              >
                                <Receipt className="w-3.5 h-3.5 text-amber-700" />
                                <span>Receipt</span>
                              </button>

                              {/* 5. Permanently Delete Booking */}
                              <button
                                type="button"
                                onClick={() => handleDeleteBooking(b.id)}
                                disabled={deletingBookingId === b.id}
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                                title="Permanently Delete Booking from Database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Selected Booking Detail Dialog */}
        {selectedBooking && (
          <Dialog
            isOpen={!!selectedBooking}
            onClose={() => {
              setSelectedBooking(null);
              setIsEditingSchedule(false);
            }}
            title={`Application Dossier — ${selectedBooking.id}`}
            maxWidth="lg"
          >
            <div className="space-y-6 text-xs text-slate-700">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                    {selectedBooking.packageName || selectedBooking.additionalInfo || 'Event'}
                  </h3>
                  <span className="text-slate-500 capitalize">{selectedBooking.eventType || selectedBooking.hall}</span>
                </div>
                <BookingStatusBadge status={selectedBooking.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                    Host Information
                  </h4>
                  <p className="font-bold text-slate-900">{selectedBooking.customerName || selectedBooking.applicantName}</p>
                  <p className="font-mono text-slate-600">Mobile: {selectedBooking.phone || selectedBooking.applicantPhone}</p>
                  {selectedBooking.email && <p className="text-slate-600">Email: {selectedBooking.email}</p>}
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                        Reservation Schedule
                      </h4>
                      {!isEditingSchedule && (
                        <button
                          type="button"
                          onClick={() => startEditingSchedule(selectedBooking)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#173D35] hover:text-[#C9AA72] bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-colors cursor-pointer"
                          title="Edit Date, Session Slot & Package"
                        >
                          <Edit2 className="w-3 h-3 text-[#C9AA72]" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5">Date: <strong>{selectedBooking.date || selectedBooking.eventDate}</strong></p>
                    <p>Session: <strong className="uppercase">{selectedBooking.slot || (selectedBooking as any).timeSlot} Session</strong></p>
                    <p>Attendees: <strong>{selectedBooking.expectedAttendees || 0} Guests</strong></p>
                  </div>
                </div>
              </div>

              {/* Dedicated Reschedule & Package Editor */}
              {isEditingSchedule && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-300 shadow-sm space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#173D35]" />
                      <span className="font-bold text-sm text-slate-900">
                        Edit Reservation Date, Session Slot, Package &amp; Pricing
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Live Calendar Sync
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Updating the date or session will immediately release the old date on the public and admin calendar and block the new date.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. Date Picker */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={editScheduleForm.date}
                        onChange={(e) =>
                          setEditScheduleForm({ ...editScheduleForm, date: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-mono font-bold bg-white"
                      />
                      {editScheduleForm.date && (
                        <div className="text-[10.5px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(`${editScheduleForm.date}T00:00:00`).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2. Session Slot Toggle (Morning / Day vs Evening) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Session Slot *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditScheduleForm({ ...editScheduleForm, slot: 'day' })}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                            editScheduleForm.slot === 'day'
                              ? 'bg-[#173D35] text-white border-[#173D35] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <Sun className={`w-3.5 h-3.5 ${editScheduleForm.slot === 'day' ? 'text-[#C9AA72]' : 'text-amber-500'}`} />
                          <span>Day Session (10AM–3PM)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditScheduleForm({ ...editScheduleForm, slot: 'evening' })}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                            editScheduleForm.slot === 'evening'
                              ? 'bg-[#173D35] text-white border-[#173D35] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <Moon className={`w-3.5 h-3.5 ${editScheduleForm.slot === 'evening' ? 'text-[#C9AA72]' : 'text-indigo-400'}`} />
                          <span>Evening (6PM–10PM)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Package Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Package &amp; Spaces *
                    </label>
                    <select
                      value={editScheduleForm.packageId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        const selPkg = packageOptions.find((p) => p.id === selId);
                        const isSingle = selPkg ? selPkg.hall !== 'both' : editScheduleForm.hall !== 'both';
                        const targetHall = isSingle ? (editScheduleForm.hall === 'hall_2' ? 'hall_2' : 'hall_1') : 'both';
                        setEditScheduleForm({
                          ...editScheduleForm,
                          packageId: selId,
                          hall: targetHall,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] bg-white font-medium text-slate-800"
                    >
                      {packageOptions.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.label}
                        </option>
                      ))}
                    </select>

                    {(() => {
                      const selPkg = packageOptions.find((p) => p.id === editScheduleForm.packageId);
                      const isSingle = selPkg ? selPkg.hall !== 'both' : editScheduleForm.hall !== 'both';

                      return (
                        <div className="mt-1.5 space-y-1">
                          {isSingle ? (
                            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800 uppercase tracking-wider">
                                  Choose Hall Wing:
                                </span>
                                <span className="font-semibold text-emerald-800">
                                  {editScheduleForm.hall === 'hall_2' ? 'Hall 2 (Ladies Wing)' : 'Hall 1 (Gents Wing)'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditScheduleForm({ ...editScheduleForm, hall: 'hall_1' })}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                                    editScheduleForm.hall === 'hall_1'
                                      ? 'bg-[#173D35] text-white border-[#173D35] shadow-xs ring-1 ring-[#173D35]'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>👔 Gents Wing (Hall 1)</span>
                                  {editScheduleForm.hall === 'hall_1' && <span className="text-amber-300 text-xs font-black">✓</span>}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditScheduleForm({ ...editScheduleForm, hall: 'hall_2' })}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                                    editScheduleForm.hall === 'hall_2'
                                      ? 'bg-[#173D35] text-white border-[#173D35] shadow-xs ring-1 ring-[#173D35]'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>🧕 Ladies Wing (Hall 2)</span>
                                  {editScheduleForm.hall === 'hall_2' && <span className="text-amber-300 text-xs font-black">✓</span>}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/90 flex items-center justify-between text-xs font-bold text-amber-900">
                              <span>🏛️ Combined Campus (Both Wings)</span>
                              <span className="text-[10px] font-semibold text-amber-700 uppercase">Gents &amp; Ladies Halls</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1 px-1">
                            <span>Selected Space: <strong className="text-slate-800">{editScheduleForm.hall === 'both' ? 'Combined Campus (Full Hall)' : editScheduleForm.hall === 'hall_2' ? 'Hall 2 (Ladies Wing)' : 'Hall 1 (Gents Wing)'}</strong></span>
                            <span>Tariff: <strong className="text-emerald-700 font-mono font-bold">₹{selPkg ? selPkg.rent.toLocaleString('en-IN') : '0'}</strong></span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 4. Package Pricing Adjustments: Discount & Extra Charges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Discount Control Block */}
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-700" />
                          <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                            Special Discount
                          </label>
                        </div>
                        {editScheduleForm.discountAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setEditScheduleForm({
                                ...editScheduleForm,
                                discountAmount: 0,
                                discountReason: '',
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs"
                            title="Delete and remove discount completely"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Delete Discount</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                            ₹0 (No Discount)
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 font-mono">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Discount Amount (0 if none)"
                            value={editScheduleForm.discountAmount || ''}
                            onChange={(e) =>
                              setEditScheduleForm({
                                ...editScheduleForm,
                                discountAmount: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full pl-6 pr-3 py-1.5 text-xs rounded-lg border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-mono font-bold text-emerald-900"
                          />
                        </div>

                        {/* Quick Preset Buttons for Discount */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[9.5px] text-emerald-900/70 font-semibold mr-1">Presets:</span>
                          {[1000, 2000, 3000, 5000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() =>
                                setEditScheduleForm({
                                  ...editScheduleForm,
                                  discountAmount: amt,
                                  discountReason: editScheduleForm.discountReason || 'Special Discount',
                                })
                              }
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                editScheduleForm.discountAmount === amt
                                  ? 'bg-emerald-700 text-white border-emerald-800 font-bold'
                                  : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/60'
                              }`}
                            >
                              ₹{amt.toLocaleString('en-IN')}
                            </button>
                          ))}
                          {editScheduleForm.discountAmount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditScheduleForm({
                                  ...editScheduleForm,
                                  discountAmount: 0,
                                  discountReason: '',
                                })
                              }
                              className="text-[10px] px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-bold transition-colors cursor-pointer"
                            >
                              Clear (₹0)
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[10.5px] font-semibold text-emerald-900 block">
                          Discount Reason / Label (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Special Discount / VIP Waiver / Festival"
                          value={editScheduleForm.discountReason}
                          onChange={(e) =>
                            setEditScheduleForm({
                              ...editScheduleForm,
                              discountReason: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Extra Charge Control Block */}
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-amber-700" />
                          <label className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                            Extra Charge (Add-ons / AC)
                          </label>
                        </div>
                        {editScheduleForm.extraCharge > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setEditScheduleForm({
                                ...editScheduleForm,
                                extraCharge: 0,
                                extraChargeReason: '',
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs"
                            title="Delete and remove extra charge completely"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Delete Extra Charge</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                            ₹0 (No Extra Charge)
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700 font-mono">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Extra Charge Amount (0 if none)"
                            value={editScheduleForm.extraCharge || ''}
                            onChange={(e) =>
                              setEditScheduleForm({
                                ...editScheduleForm,
                                extraCharge: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full pl-6 pr-3 py-1.5 text-xs rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white font-mono font-bold text-amber-950"
                          />
                        </div>

                        {/* Quick Preset Buttons for Extra Charges */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          <span className="text-[9.5px] text-amber-900/70 font-semibold mr-1">Presets:</span>
                          {[
                            { amt: 5000, label: '+₹5k (If AC Needed)', reason: 'If AC Needed' },
                            { amt: 10000, label: '+₹10k (AC)', reason: 'AC Charges' },
                            { amt: 15000, label: '+₹15k (Full AC)', reason: 'Full AC Needed' },
                          ].map((item) => (
                            <button
                              key={item.amt}
                              type="button"
                              onClick={() =>
                                setEditScheduleForm({
                                  ...editScheduleForm,
                                  extraCharge: item.amt,
                                  extraChargeReason: item.reason,
                                })
                              }
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                editScheduleForm.extraCharge === item.amt
                                  ? 'bg-amber-700 text-white border-amber-800 font-bold'
                                  : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/70'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                          {editScheduleForm.extraCharge > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditScheduleForm({
                                  ...editScheduleForm,
                                  extraCharge: 0,
                                  extraChargeReason: '',
                                })
                              }
                              className="text-[10px] px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-bold transition-colors cursor-pointer"
                            >
                              Clear (₹0)
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[10.5px] font-semibold text-amber-950 block">
                          Extra Charge Reason / Description (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. If AC Needed / Cleaning Fee / Generator Fuel"
                          value={editScheduleForm.extraChargeReason}
                          onChange={(e) =>
                            setEditScheduleForm({
                              ...editScheduleForm,
                              extraChargeReason: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Real-time Financial Breakdown Card inside Editor */}
                  {(() => {
                    const selPkg = packageOptions.find((p) => p.id === editScheduleForm.packageId);
                    const grossRent = selPkg ? selPkg.rent : ((selectedBooking as any).packagePrice || 30000);
                    const disc = Math.max(0, Number(editScheduleForm.discountAmount) || 0);
                    const extra = Math.max(0, Number(editScheduleForm.extraCharge) || 0);
                    const netRent = Math.max(0, grossRent - disc + extra);
                    const paid = Number((selectedBooking as any).amountPaid) || 0;
                    const balance = Math.max(0, netRent - paid);

                    return (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-600 font-medium">
                          <span>Package Agreed Tariff:</span>
                          <span className="font-mono font-bold text-slate-900">₹{grossRent.toLocaleString('en-IN')}</span>
                        </div>
                        {disc > 0 && (
                          <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/70 px-2 py-0.5 rounded font-medium">
                            <span>Special Discount ({editScheduleForm.discountReason.trim() || 'Special Discount'}):</span>
                            <span className="font-mono font-bold text-emerald-700">-₹{disc.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {extra > 0 && (
                          <div className="flex justify-between items-center text-amber-900 bg-amber-50/70 px-2 py-0.5 rounded font-medium">
                            <span>Extra Charge ({editScheduleForm.extraChargeReason.trim() || 'Extra Charge'}):</span>
                            <span className="font-mono font-bold text-amber-800">+₹{extra.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                          <span>New Net Payable Rent:</span>
                          <span className="font-mono text-sm text-[#173D35]">₹{netRent.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-500">
                          <span>Advance Already Paid:</span>
                          <span className="font-mono text-emerald-700 font-semibold">₹{paid.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-1 border-t border-slate-100">
                          <span>Outstanding Balance Due:</span>
                          <span className={`font-mono text-xs ${balance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                            {balance > 0 ? `₹${balance.toLocaleString('en-IN')}` : 'Fully Settled (₹0)'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 5. Optional Reason / Note */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reason for Reschedule / Change (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Host requested postponement to weekend / shifted from evening to day session"
                      value={editScheduleForm.reason}
                      onChange={(e) =>
                        setEditScheduleForm({ ...editScheduleForm, reason: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] bg-white"
                    />
                  </div>

                  {/* Schedule & Financial Change Comparison Pill */}
                  {(() => {
                    const selPkg = packageOptions.find((p) => p.id === editScheduleForm.packageId);
                    const isDateChanged = editScheduleForm.date !== (selectedBooking.date || selectedBooking.eventDate);
                    const isSlotChanged = editScheduleForm.slot !== ((selectedBooking.slot || (selectedBooking as any).timeSlot || 'day').toLowerCase());
                    const isPkgChanged = selPkg && selPkg.name !== selectedBooking.packageName && selPkg.id !== selectedBooking.packageId;

                    const bObj = selectedBooking as any;
                    const oldDisc = Number(bObj.discountAmount) || 0;
                    const newDisc = Math.max(0, Number(editScheduleForm.discountAmount) || 0);
                    const isDiscChanged = oldDisc !== newDisc;

                    const oldExtra = Number(bObj.extraCharge) || 0;
                    const newExtra = Math.max(0, Number(editScheduleForm.extraCharge) || 0);
                    const isExtraChanged = oldExtra !== newExtra;

                    const oldNet = bObj.totalAmount !== undefined
                      ? Number(bObj.totalAmount)
                      : (bObj.totalEstimate || bObj.estimatedAmount || 0);
                    const newGross = selPkg ? selPkg.rent : ((selectedBooking as any).packagePrice || 30000);
                    const newNet = Math.max(0, newGross - newDisc + newExtra);
                    const isNetChanged = oldNet !== newNet;

                    return (
                      <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Summary of Changes to Apply:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pl-5">
                          <span className={isDateChanged ? 'font-bold text-amber-950 underline' : 'text-slate-600'}>
                            Date: {selectedBooking.date || selectedBooking.eventDate} → {editScheduleForm.date}
                          </span>
                          <span>&bull;</span>
                          <span className={isSlotChanged ? 'font-bold text-amber-950 underline' : 'text-slate-600'}>
                            Session: {((selectedBooking.slot || (selectedBooking as any).timeSlot || 'day') as string).toUpperCase()} → {editScheduleForm.slot.toUpperCase()}
                          </span>
                          {isPkgChanged && selPkg && (
                            <>
                              <span>&bull;</span>
                              <span className="font-bold text-amber-950 underline">
                                Package: {selectedBooking.packageName} → {selPkg.name} (₹{selPkg.rent.toLocaleString('en-IN')})
                              </span>
                            </>
                          )}
                          {isDiscChanged && (
                            <>
                              <span>&bull;</span>
                              {oldDisc > 0 && newDisc === 0 ? (
                                <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  Discount: -₹{oldDisc.toLocaleString('en-IN')} → ₹0 (DELETED)
                                </span>
                              ) : oldDisc === 0 && newDisc > 0 ? (
                                <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  Discount: Added -₹{newDisc.toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  Discount: -₹{oldDisc.toLocaleString('en-IN')} → -₹{newDisc.toLocaleString('en-IN')}
                                </span>
                              )}
                            </>
                          )}
                          {isExtraChanged && (
                            <>
                              <span>&bull;</span>
                              {oldExtra > 0 && newExtra === 0 ? (
                                <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  Extra Charge: +₹{oldExtra.toLocaleString('en-IN')} → ₹0 (DELETED)
                                </span>
                              ) : oldExtra === 0 && newExtra > 0 ? (
                                <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  Extra Charge: Added +₹{newExtra.toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  Extra Charge: +₹{oldExtra.toLocaleString('en-IN')} → +₹{newExtra.toLocaleString('en-IN')}
                                </span>
                              )}
                            </>
                          )}
                          {isNetChanged && (
                            <>
                              <span>&bull;</span>
                              <span className="font-bold text-[#173D35] bg-emerald-100/70 border border-emerald-300 px-1.5 py-0.5 rounded">
                                Net Total: ₹{oldNet.toLocaleString('en-IN')} → ₹{newNet.toLocaleString('en-IN')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Editor Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingSchedule(false)}
                      disabled={isSavingSchedule}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="gold"
                      size="sm"
                      onClick={handleSaveScheduleUpdate}
                      isLoading={isSavingSchedule}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Save &amp; Update Booking
                    </Button>
                  </div>
                </div>
              )}

              {selectedBooking.additionalInfo && (
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-1">Catering / Special Notes:</span>
                  <p>{selectedBooking.additionalInfo}</p>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                {(() => {
                  const bObj = selectedBooking as any;
                  const netRent = bObj.totalAmount !== undefined
                    ? Number(bObj.totalAmount)
                    : (bObj.totalEstimate || bObj.estimatedAmount || 0);
                  const disc = Number(bObj.discountAmount) || 0;
                  const extra = Number(bObj.extraCharge) || 0;
                  const grossRent = Number(bObj.originalAmount || bObj.packagePrice) || (disc > 0 || extra > 0 ? netRent + disc - extra : netRent);
                  const paid = bObj.amountPaid !== undefined
                    ? Number(bObj.amountPaid)
                    : (selectedBooking.advancePaymentStatus === 'fully_paid' ? netRent : selectedBooking.advancePaymentStatus === 'advance_paid' ? Math.round(netRent * 0.25) : 0);
                  const balance = bObj.balanceDue !== undefined ? Number(bObj.balanceDue) : Math.max(0, netRent - paid);

                  return (
                    <>
                      {(disc > 0 || extra > 0) && grossRent !== netRent && (
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>Original Agreed Tariff:</span>
                          <span className="font-mono line-through">₹{grossRent.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {disc > 0 && (
                        <div className="flex justify-between items-center text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                          <span className="flex items-center gap-1 font-semibold">
                            <Tag className="w-3.5 h-3.5 text-emerald-600" />
                            {formatDiscountLabel(selectedBooking)}:
                          </span>
                          <span className="font-mono font-bold text-emerald-700">
                            -₹{disc.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      {extra > 0 && (
                        <div className="flex justify-between items-center text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                          <span className="flex items-center gap-1 font-semibold">
                            {formatExtraChargeLabel(selectedBooking)}:
                          </span>
                          <span className="font-mono font-bold text-amber-800">
                            +₹{extra.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1 border-t border-slate-200/60">
                        <span>Net Payable Rent:</span>
                        <span className="font-mono text-base text-[#173D35]">
                          ₹{netRent.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-600 font-semibold">Advance / Paid Amount:</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditAdvance(selectedBooking)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                            title="Edit or correct recorded advance payment"
                          >
                            <Edit2 className="w-3 h-3 text-emerald-600" />
                            <span>Edit Advance</span>
                          </button>
                        </div>
                        <span className="font-mono font-bold text-emerald-700">
                          ₹{paid.toLocaleString('en-IN')} ({selectedBooking.advancePaymentStatus === 'fully_paid' ? 'Fully Paid' : paid > 0 ? 'Advance Paid' : 'Unpaid'})
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                        <span className="text-slate-700 font-bold">Outstanding Balance Due:</span>
                        <span className={`font-mono font-bold text-sm ${balance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                          {balance > 0 ? `₹${balance.toLocaleString('en-IN')}` : 'Fully Settled (₹0)'}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isEditingSchedule) {
                        setIsEditingSchedule(false);
                      } else {
                        startEditingSchedule(selectedBooking);
                      }
                    }}
                    leftIcon={<Calendar className="w-3.5 h-3.5 text-[#173D35]" />}
                  >
                    {isEditingSchedule ? 'Close Schedule Editor' : 'Edit Date / Slot / Package / Pricing'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInvoiceBooking(selectedBooking);
                      setSelectedBooking(null);
                    }}
                    leftIcon={<Receipt className="w-4 h-4" />}
                  >
                    Print Receipt
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const b = selectedBooking;
                      setSelectedBooking(null);
                      openPaymentModal(b);
                    }}
                    leftIcon={<CreditCard className="w-4 h-4 text-emerald-600" />}
                  >
                    Record Payment
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditAdvance(selectedBooking)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    Edit Advance
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const bObj = selectedBooking as any;
                      const netRent = bObj.totalAmount !== undefined
                        ? Number(bObj.totalAmount)
                        : (bObj.totalEstimate || bObj.estimatedAmount || 0);
                      const existingDisc = Number(bObj.discountAmount) || 0;
                      const existingExtra = Number(bObj.extraCharge) || 0;
                      const grossRent = Number(bObj.originalAmount || bObj.packagePrice) || (existingDisc > 0 || existingExtra > 0 ? netRent + existingDisc - existingExtra : netRent);

                      setDiscountBooking(selectedBooking);
                      setCustomDiscountType('fixed');
                      // If there is an existing discount, initialize with current net rent as base so manager can discount from current, or they can toggle to gross
                      setDiscountBaseAmount(netRent > 0 ? netRent : grossRent);
                      setDiscountBaseMode('current');
                      setCustomDiscountVal(0);

                      let rawDiscReason = (selectedBooking.discountReason || '').trim();
                      if (!rawDiscReason && (selectedBooking.couponCode || '').startsWith('DIRECT-')) {
                        rawDiscReason = (selectedBooking.couponCode || '').replace(/^DIRECT-/, '').trim();
                      }
                      if (rawDiscReason.toLowerCase() === 'special discount' || rawDiscReason.toLowerCase() === 'manager direct discount') {
                        rawDiscReason = '';
                      }
                      setCustomDiscountReason(rawDiscReason);
                      setCustomExtraCharge(existingExtra);
                      setCustomExtraChargeReason(bObj.extraChargeReason || '');
                    }}
                    leftIcon={<Percent className="w-3.5 h-3.5 text-amber-600" />}
                  >
                    {selectedBooking.discountAmount ? 'Edit / Add Discount' : 'Add Discount'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBooking(selectedBooking.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    Delete Booking
                  </Button>

                  {/* Complete Event Action Button */}
                  {(selectedBooking.status || '').toUpperCase() === 'COMPLETED' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled
                      className="bg-emerald-50 text-emerald-800 border-emerald-300 cursor-not-allowed font-bold"
                      leftIcon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
                    >
                      Completed ✓
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(
                          selectedBooking.id,
                          'COMPLETED',
                          'Event marked as completed by management.'
                        )
                      }
                      isLoading={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs transition-colors"
                      leftIcon={<Check className="w-3.5 h-3.5 text-white" />}
                    >
                      Complete Event
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                    Close
                  </Button>

                  {(selectedBooking.status === 'PENDING' || (selectedBooking.status as any) === 'pending') && (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const b = selectedBooking;
                          setSelectedBooking(null);
                          setRejectingBooking(b);
                        }}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => {
                          handleStatusChange(selectedBooking.id, 'APPROVED', 'Approved by administrative review');
                          setSelectedBooking(null);
                        }}
                      >
                        Approve Request
                      </Button>
                    </>
                  )}

                  {(selectedBooking.status === 'APPROVED' || (selectedBooking.status as any) === 'approved') && (
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        handleStatusChange(selectedBooking.id, 'CONFIRMED', 'Advance token verified. Event confirmed.');
                        setSelectedBooking(null);
                      }}
                    >
                      Confirm Booking
                    </Button>
                  )}

                  {(selectedBooking.status || '').toUpperCase() === 'CONFIRMED' && (
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(
                          selectedBooking.id,
                          'COMPLETED',
                          'Event marked as completed by management.'
                        )
                      }
                      isLoading={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                      leftIcon={<Check className="w-3.5 h-3.5 text-white" />}
                    >
                      Complete Event
                    </Button>
                  )}

                  {(selectedBooking.status || '').toUpperCase() === 'COMPLETED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed font-medium"
                    >
                      Completed ✓
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Dialog>
        )}

        {/* Record Payment Dialog */}
        {payingBooking && (
          <Dialog
            isOpen={!!payingBooking}
            onClose={() => setPayingBooking(null)}
            title={`Record Payment — ${payingBooking.id}`}
            maxWidth="md"
          >
            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              {(() => {
                const bObj = payingBooking as any;
                const total = bObj.totalAmount || payingBooking.totalEstimate || payingBooking.estimatedAmount || bObj.packagePrice || 0;
                const paid = bObj.amountPaid !== undefined ? Number(bObj.amountPaid) : (payingBooking.advancePaymentStatus === 'fully_paid' ? total : payingBooking.advancePaymentStatus === 'advance_paid' ? Math.round(total * 0.25) : 0);
                const balance = bObj.balanceDue !== undefined ? Number(bObj.balanceDue) : Math.max(0, total - paid);
                return (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Customer</span>
                      <strong className="text-slate-900 text-xs truncate block">{payingBooking.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Rent</span>
                      <strong className="text-slate-900 text-xs font-mono block">₹{total.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Already Paid</span>
                        <button
                          type="button"
                          onClick={() => {
                            const b = payingBooking;
                            setPayingBooking(null);
                            handleOpenEditAdvance(b);
                          }}
                          className="text-[10px] font-bold text-emerald-700 underline hover:text-emerald-900 cursor-pointer ml-1"
                          title="Correct previously recorded advance"
                        >
                          Edit
                        </button>
                      </div>
                      <strong className="text-emerald-700 text-xs font-mono block">₹{paid.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">Balance Due</span>
                      <strong className="text-amber-800 text-xs font-mono block">₹{balance.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Payment Amount (₹) *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Payment Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="advance">Token Advance</option>
                    <option value="balance">Remaining Balance</option>
                    <option value="full">Full Settlement</option>
                    <option value="security_deposit">Security Deposit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="cash">Cash in Office</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Transaction Ref / UTR / Receipt No</label>
                <input
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  placeholder="e.g. UPI-1049281729 or Cash Slip #42"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Notes / Ledger Remarks</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Advance paid at venue office by uncle"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setPayingBooking(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={isRecordingPayment}
                  leftIcon={<CreditCard className="w-4 h-4" />}
                >
                  {isRecordingPayment ? 'Recording...' : 'Record Payment & Issue Receipt'}
                </Button>
              </div>
            </form>
          </Dialog>
        )}

        {/* Direct Discount Dialog */}
        {discountBooking && (
          <Dialog
            isOpen={!!discountBooking}
            onClose={() => setDiscountBooking(null)}
            title={`Apply Direct Discount & Charges — ${discountBooking.id}`}
            maxWidth="md"
          >
            <form onSubmit={handleApplyDiscount} className="space-y-4 text-xs">
              {(() => {
                const bObj = discountBooking as any;
                const netRent = bObj.totalAmount !== undefined
                  ? Number(bObj.totalAmount)
                  : (bObj.totalEstimate || bObj.estimatedAmount || 0);
                const existingDisc = Number(bObj.discountAmount) || 0;
                const existingExtra = Number(bObj.extraCharge) || 0;
                const grossRent = Number(bObj.originalAmount || bObj.packagePrice) || (existingDisc > 0 || existingExtra > 0 ? netRent + existingDisc - existingExtra : netRent);
                const paid = Number(bObj.amountPaid) || 0;

                const effectiveBase = discountBaseAmount > 0 ? discountBaseAmount : (discountBaseMode === 'gross' ? grossRent : netRent);

                let computedDiscount = 0;
                if (customDiscountType === 'percentage') {
                  computedDiscount = Math.round((effectiveBase * customDiscountVal) / 100);
                } else {
                  computedDiscount = Math.min(effectiveBase, customDiscountVal);
                }
                const extraAmount = Math.max(0, Number(customExtraCharge) || 0);
                const newNetPayable = Math.max(0, effectiveBase - computedDiscount + extraAmount);
                const newBalanceDue = Math.max(0, newNetPayable - paid);

                return (
                  <div className="space-y-3">
                    {/* Calculation Base Selector (if booking already had a discount) */}
                    {grossRent !== netRent && (
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                          Calculate Discount From:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDiscountBaseMode('current');
                              setDiscountBaseAmount(netRent);
                            }}
                            className={`px-3 py-2 rounded-lg text-left transition-all border cursor-pointer ${
                              discountBaseMode === 'current'
                                ? 'bg-[#173D35] text-white border-[#173D35] font-bold shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span className="block text-[10px] opacity-80 uppercase">Current Net Rent</span>
                            <span className="font-price text-xs">₹{netRent.toLocaleString('en-IN')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDiscountBaseMode('gross');
                              setDiscountBaseAmount(grossRent);
                            }}
                            className={`px-3 py-2 rounded-lg text-left transition-all border cursor-pointer ${
                              discountBaseMode === 'gross'
                                ? 'bg-[#173D35] text-white border-[#173D35] font-bold shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span className="block text-[10px] opacity-80 uppercase">Original Tariff</span>
                            <span className="font-price text-xs">₹{grossRent.toLocaleString('en-IN')}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Breakdown Card */}
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-700">
                        <span>Base Rent Amount:</span>
                        <strong className="font-price text-sm text-slate-900">₹{effectiveBase.toLocaleString('en-IN')}</strong>
                      </div>
                      {computedDiscount > 0 && (
                        <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold">
                          <span>
                            {customDiscountReason.trim()
                              ? `Special Discount (${customDiscountReason.trim()}):`
                              : 'Special Discount to Deduct:'}
                          </span>
                          <span className="font-price">- ₹{computedDiscount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {extraAmount > 0 && (
                        <div className="flex justify-between items-center text-xs text-amber-800 font-semibold">
                          <span>
                            {customExtraChargeReason.trim()
                              ? `Extra Charge (${customExtraChargeReason.trim()}):`
                              : 'Extra Charge to Add:'}
                          </span>
                          <span className="font-price">+ ₹{extraAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs text-slate-900 font-semibold pt-2 border-t border-amber-200">
                        <span>New Net Payable Rent:</span>
                        <span className="font-price text-base text-amber-900">₹{newNetPayable.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1">
                        <span>Already Paid to Date:</span>
                        <span className="font-price text-emerald-700">₹{paid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-900 pt-1 border-t border-amber-200/60">
                        <span>New Balance Due:</span>
                        <span className={`font-price text-sm ${newBalanceDue > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                          {newBalanceDue > 0 ? `₹${newBalanceDue.toLocaleString('en-IN')}` : 'Fully Settled (₹0)'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase">Discount Configuration</label>
                {(customDiscountVal > 0 || Number((discountBooking as any).discountAmount) > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDiscountVal(0);
                      setCustomDiscountReason('');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                    title="Delete and reset discount to ₹0"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span>Delete / Remove Discount</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Discount Type</label>
                  <select
                    value={customDiscountType}
                    onChange={(e) => setCustomDiscountType(e.target.value as 'fixed' | 'percentage')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="fixed">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    {customDiscountType === 'percentage' ? 'Discount (%)' : 'Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={customDiscountType === 'percentage' ? 100 : undefined}
                    value={customDiscountVal || ''}
                    onChange={(e) => setCustomDiscountVal(Number(e.target.value))}
                    placeholder={customDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 5000'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Discount Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={customDiscountReason}
                  onChange={(e) => setCustomDiscountReason(e.target.value)}
                  placeholder="e.g. Festival offer / VIP waiver (defaults to 'Special Discount')"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Extra Charge Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <label className="text-xs font-bold text-slate-700 uppercase">Extra Charges (Add-ons / AC)</label>
                  {(customExtraCharge > 0 || Number((discountBooking as any).extraCharge) > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomExtraCharge(0);
                        setCustomExtraChargeReason('');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                      title="Delete and reset extra charge to ₹0"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>Delete / Remove Extra Charge</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Extra Charge (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={customExtraCharge || ''}
                      onChange={(e) => setCustomExtraCharge(Number(e.target.value))}
                      placeholder="e.g. 3000 (0 if none)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Extra Charge Note / Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={customExtraChargeReason}
                      onChange={(e) => setCustomExtraChargeReason(e.target.value)}
                      placeholder="e.g. Extra cleaning, late session (defaults to 'Extra Charge')"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setDiscountBooking(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={isApplyingDiscount}
                  leftIcon={<Percent className="w-4 h-4" />}
                >
                  {isApplyingDiscount ? 'Saving...' : 'Apply & Save Changes'}
                </Button>
              </div>
            </form>
          </Dialog>
        )}

        {/* Edit / Correct Advance Payment Dialog */}
        {editAdvanceBooking && (
          <Dialog
            isOpen={!!editAdvanceBooking}
            onClose={() => setEditAdvanceBooking(null)}
            title={`Edit / Correct Advance Payment — ${editAdvanceBooking.id}`}
            maxWidth="md"
          >
            <form onSubmit={handleSaveAdvanceCorrection} className="space-y-4 text-xs">
              {(() => {
                const bObj = editAdvanceBooking as any;
                const netRent = bObj.totalAmount !== undefined
                  ? Number(bObj.totalAmount)
                  : (bObj.totalEstimate || bObj.estimatedAmount || bObj.packagePrice || 0);
                const currentPaid = bObj.amountPaid !== undefined
                  ? Number(bObj.amountPaid)
                  : (editAdvanceBooking.advancePaymentStatus === 'fully_paid'
                      ? netRent
                      : editAdvanceBooking.advancePaymentStatus === 'advance_paid'
                      ? Math.round(netRent * 0.25)
                      : 0);
                const currentBalance = bObj.balanceDue !== undefined
                  ? Number(bObj.balanceDue)
                  : Math.max(0, netRent - currentPaid);

                const newPaid = Math.max(0, Number(editAdvanceAmount) || 0);
                const newBalance = Math.max(0, netRent - newPaid);
                const newStatus = newBalance === 0 && (newPaid > 0 || netRent === 0)
                  ? 'fully_paid'
                  : newPaid > 0
                  ? 'advance_paid'
                  : 'unpaid';

                return (
                  <div className="space-y-3">
                    {/* Header info card */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Customer</span>
                        <strong className="text-slate-900 text-xs truncate block">{editAdvanceBooking.customerName || (editAdvanceBooking as any).applicantName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Net Payable Rent</span>
                        <strong className="text-slate-900 text-xs font-mono block">₹{netRent.toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Advance</span>
                        <strong className="text-emerald-700 text-xs font-mono block">₹{currentPaid.toLocaleString('en-IN')}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Balance</span>
                        <strong className="text-amber-800 text-xs font-mono block">₹{currentBalance.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    {/* Input Field for Corrected Amount */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                          <span>Corrected Advance Amount (₹) *</span>
                          <span className="text-[10px] font-normal text-slate-500 lowercase">(enter exact advance received)</span>
                        </label>
                        {newPaid !== currentPaid && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            newPaid > currentPaid
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}>
                            {newPaid > currentPaid ? `+₹${(newPaid - currentPaid).toLocaleString('en-IN')}` : `-₹${(currentPaid - newPaid).toLocaleString('en-IN')}`} difference
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          autoFocus
                          value={editAdvanceAmount === 0 ? '' : editAdvanceAmount}
                          onChange={(e) => setEditAdvanceAmount(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Quick Presets</label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditAdvanceAmount(0)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-colors"
                        >
                          ₹0 (Unpaid)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditAdvanceAmount(5000)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 cursor-pointer transition-colors"
                        >
                          ₹5,000
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditAdvanceAmount(10000)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 cursor-pointer transition-colors"
                        >
                          ₹10,000
                        </button>
                        {netRent > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditAdvanceAmount(Math.round(netRent * 0.25))}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                            >
                              25% (₹{Math.round(netRent * 0.25).toLocaleString('en-IN')})
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditAdvanceAmount(Math.round(netRent * 0.5))}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                            >
                              50% (₹{Math.round(netRent * 0.5).toLocaleString('en-IN')})
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditAdvanceAmount(netRent)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 cursor-pointer transition-colors"
                            >
                              Full Rent (₹{netRent.toLocaleString('en-IN')})
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Payment Method</label>
                      <select
                        value={editAdvanceMethod}
                        onChange={(e) => setEditAdvanceMethod(e.target.value as any)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                      >
                        <option value="cash">Cash in Office</option>
                        <option value="upi">UPI / QR Code</option>
                        <option value="bank_transfer">Bank Transfer / NEFT</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Correction Reason & Quick Chips */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Reason for Correction / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={editAdvanceReason}
                        onChange={(e) => setEditAdvanceReason(e.target.value)}
                        placeholder="e.g. Typo correction: entered 8000 instead of 5000"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {[
                          'Typo correction (wrong digit)',
                          'Extra zero (0) entered by mistake',
                          'Customer adjusted advance token',
                          'Cash advance received at office',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setEditAdvanceReason(chip)}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer transition-colors"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Real-time Calculation Breakdown Preview */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-700">
                        <span>Net Payable Rent:</span>
                        <strong className="font-mono text-xs text-slate-900">₹{netRent.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs text-emerald-800 font-semibold">
                        <span>New Advance / Paid Amount:</span>
                        <span className="font-mono text-sm font-bold text-emerald-700">
                          ₹{newPaid.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-emerald-200">
                        <span className="font-bold text-slate-800">New Outstanding Balance Due:</span>
                        <span className={`font-mono text-sm font-bold ${newBalance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                          {newBalance > 0 ? `₹${newBalance.toLocaleString('en-IN')}` : 'Fully Settled (₹0)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1">
                        <span className="text-slate-600">New Payment Status:</span>
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          newStatus === 'fully_paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : newStatus === 'advance_paid'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {newStatus === 'fully_paid' ? 'Fully Paid' : newStatus === 'advance_paid' ? 'Advance Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditAdvanceBooking(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={isSavingAdvance}
                  leftIcon={<Edit2 className="w-4 h-4" />}
                >
                  {isSavingAdvance ? 'Updating...' : 'Save & Update Advance Payment'}
                </Button>
              </div>
            </form>
          </Dialog>
        )}

        {/* Rejection Dialog */}
        {rejectingBooking && (
          <Dialog
            isOpen={!!rejectingBooking}
            onClose={() => setRejectingBooking(null)}
            title="Decline Booking Application"
            maxWidth="md"
          >
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Please provide the reason for declining application <strong>{rejectingBooking.id}</strong>.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Hall space undergoing scheduled maintenance..."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setRejectingBooking(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={handleConfirmReject}
                  isLoading={isProcessing}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Dialog>
        )}

        {/* Direct Manual Reservation Modal */}
        {isCreateModalOpen && (
          <Dialog
            isOpen={isCreateModalOpen}
            onClose={handleCloseCreateModal}
            title={createModalStep === 'preview' ? `Preview Event Order — Check & Confirm (${pendingReservation?.id || ''})` : "Direct Manual Reservation"}
            maxWidth={createModalStep === 'preview' ? "4xl" : "md"}
          >
            {createModalStep === 'form' ? (
              <form onSubmit={handleProceedToPreview} className="space-y-4 text-xs">
                <p className="text-slate-500 text-[11px] -mt-1">
                  Instantly book and confirm a reservation directly into the venue database with custom pricing &amp; discounts.
                </p>

              {/* Hall & Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Package &amp; Hall Space *
                  </label>
                  <select
                    value={createForm.packageId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const pkg = packageOptions.find((p) => p.id === selId);
                      if (pkg) {
                        const isSingle = pkg.hall !== 'both';
                        const targetHall = isSingle ? (createForm.hall === 'hall_2' ? 'hall_2' : 'hall_1') : 'both';
                        const cleanBase = pkg.name.replace(/\s*\(Hall 1\s*\/\s*Hall 2\)/i, '').replace(/\s*-\s*Hall\s*[12]\s*\([^)]*\)/i, '').trim();
                        const finalPkgName = isSingle
                          ? `${cleanBase} - ${targetHall === 'hall_2' ? 'Hall 2 (Ladies Wing)' : 'Hall 1 (Gents Wing)'}`
                          : pkg.name;

                        setCreateForm({
                          ...createForm,
                          packageId: pkg.id,
                          packageName: finalPkgName,
                          hall: targetHall,
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

                  {/* Dedicated Wing Selection Option Below Package */}
                  {(() => {
                    const selPkg = packageOptions.find((p) => p.id === createForm.packageId);
                    const isSingle = selPkg ? selPkg.hall !== 'both' : createForm.hall !== 'both';

                    return isSingle ? (
                      <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1 mt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 uppercase tracking-wider">
                            Choose Hall Wing:
                          </span>
                          <span className="font-semibold text-emerald-800">
                            {createForm.hall === 'hall_2' ? 'Hall 2 (Ladies Wing)' : 'Hall 1 (Gents Wing)'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const base = selPkg ? selPkg.name : createForm.packageName;
                              const cleanBase = base.replace(/\s*\(Hall 1\s*\/\s*Hall 2\)/i, '').replace(/\s*-\s*Hall\s*[12]\s*\([^)]*\)/i, '').trim();
                              setCreateForm({
                                ...createForm,
                                hall: 'hall_1',
                                packageName: `${cleanBase} - Hall 1 (Gents Wing)`,
                              });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                              createForm.hall === 'hall_1'
                                ? 'bg-[#173D35] text-white border-[#173D35] shadow-xs ring-1 ring-[#173D35]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span>👔 Gents Wing (Hall 1)</span>
                            {createForm.hall === 'hall_1' && <span className="text-amber-300 text-xs font-black">✓</span>}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const base = selPkg ? selPkg.name : createForm.packageName;
                              const cleanBase = base.replace(/\s*\(Hall 1\s*\/\s*Hall 2\)/i, '').replace(/\s*-\s*Hall\s*[12]\s*\([^)]*\)/i, '').trim();
                              setCreateForm({
                                ...createForm,
                                hall: 'hall_2',
                                packageName: `${cleanBase} - Hall 2 (Ladies Wing)`,
                              });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                              createForm.hall === 'hall_2'
                                ? 'bg-[#173D35] text-white border-[#173D35] shadow-xs ring-1 ring-[#173D35]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span>🧕 Ladies Wing (Hall 2)</span>
                            {createForm.hall === 'hall_2' && <span className="text-amber-300 text-xs font-black">✓</span>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/90 flex items-center justify-between text-xs font-bold text-amber-900 mt-1">
                        <span>🏛️ Combined Campus (Both Wings)</span>
                        <span className="text-[10px] font-semibold text-amber-700 uppercase">Gents &amp; Ladies Halls</span>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 px-0.5">
                    <span>Selected Space: <strong className="text-slate-800">{createForm.hall === 'both' ? 'Combined Campus (Full Hall)' : createForm.hall === 'hall_2' ? 'Hall 2 (Ladies Wing)' : 'Hall 1 (Gents Wing)'}</strong></span>
                    <span>Tariff: <strong className="text-emerald-700 font-mono">₹{Number(createForm.estimatedRent).toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session Slot *
                </label>
                <select
                  value={createForm.slot}
                  onChange={(e) => setCreateForm({ ...createForm, slot: e.target.value as 'day' | 'evening' })}
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
                  value={createForm.customerName}
                  onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
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
                    value={createForm.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCreateForm({ ...createForm, phone: val });
                      if (createPhoneError) {
                        const res = validateIndianPhone(val);
                        if (res.isValid) setCreatePhoneError(null);
                      }
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-mono transition-colors focus:outline-none focus:ring-2 ${
                      createPhoneError
                        ? 'border-rose-500 bg-rose-50/50 text-rose-950 focus:ring-rose-500 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-[#173D35]'
                    }`}
                  />
                  {createForm.phone && validateIndianPhone(createForm.phone).isValid && (
                    <span className="absolute right-2.5 top-2 text-[11px] font-bold text-emerald-600 pointer-events-none">
                      ✓ Valid
                    </span>
                  )}
                </div>
                {createPhoneError ? (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{createPhoneError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Accepts 10-digit Indian mobile number or +91 followed by 10 digits
                  </p>
                )}
              </div>

              {(() => {
                const baseRent = Number(createForm.estimatedRent) || 0;
                const discAmount = createForm.discountValue > 0
                  ? createForm.discountType === 'percentage'
                    ? Math.round((baseRent * createForm.discountValue) / 100)
                    : Math.min(baseRent, createForm.discountValue)
                  : 0;
                const extraAmount = Math.max(0, Number(createForm.extraCharge) || 0);
                const netRent = Math.max(0, baseRent - discAmount + extraAmount);
                const advance = Number(createForm.advancePaid) || 0;
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
                          value={createForm.estimatedRent}
                          onChange={(e) => setCreateForm({ ...createForm, estimatedRent: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Direct Manager Discount
                        </label>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={createForm.discountType}
                            onChange={(e) => setCreateForm({ ...createForm, discountType: e.target.value as any })}
                            className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700"
                          >
                            <option value="fixed">₹ Flat</option>
                            <option value="percentage">% Off</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            placeholder="Discount value"
                            value={createForm.discountValue || ''}
                            onChange={(e) => setCreateForm({ ...createForm, discountValue: Number(e.target.value) })}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {createForm.discountValue > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Discount Note / Reason (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Festival offer, relative discount (defaults to 'Special Discount')"
                          value={createForm.discountReason}
                          onChange={(e) => setCreateForm({ ...createForm, discountReason: e.target.value })}
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
                            value={createForm.extraCharge || ''}
                            onChange={(e) => setCreateForm({ ...createForm, extraCharge: Number(e.target.value) })}
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
                            value={createForm.extraChargeReason}
                            onChange={(e) => setCreateForm({ ...createForm, extraChargeReason: e.target.value })}
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
                            {createForm.discountReason.trim()
                              ? `Special Discount (${createForm.discountReason.trim()}):`
                              : `Special Discount (${createForm.discountType === 'percentage' ? `${createForm.discountValue}%` : 'Flat'}):`}
                          </span>
                          <span className="font-price">- ₹{discAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {extraAmount > 0 && (
                        <div className="flex justify-between items-center text-amber-700 font-semibold">
                          <span>{createForm.extraChargeReason.trim() ? `Extra Charge (${createForm.extraChargeReason.trim()}):` : 'Extra Charge:'}</span>
                          <span className="font-price">+ ₹{extraAmount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-semibold">
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
                          value={createForm.advancePaid}
                          onChange={(e) => setCreateForm({ ...createForm, advancePaid: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-price text-emerald-700"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Remaining Balance Due (₹)
                        </label>
                        <div className="px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 font-price text-amber-800">
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
                    value={createForm.occasionCategory}
                    onChange={(e) => {
                      const occ = e.target.value;
                      setCreateForm({
                        ...createForm,
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

                {createForm.occasionCategory === 'Other (Custom Occasion)' && (
                  <div>
                    <label className="block text-xs font-bold text-amber-800 mb-1">
                      Type Custom Occasion Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Political Convention, Award Ceremony, Silver Jubilee"
                      value={createForm.customOccasion}
                      onChange={(e) => setCreateForm({ ...createForm, customOccasion: e.target.value })}
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
                    value={createForm.additionalNote}
                    onChange={(e) => setCreateForm({ ...createForm, additionalNote: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseCreateModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
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
              {pendingReservation && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50/50 p-1 sm:p-2">
                  <A4DocumentViewer defaultMode="fit" allowToggle={true}>
                    <EventOrderReceipt
                      booking={pendingReservation}
                      receiptNumber={pendingReservation.id.replace(/\D/g, '')}
                      signatureUrl={signatureUrl}
                      signatoryDesignation={signatoryDesignation}
                      containerRef={previewReceiptRef}
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
                  onClick={() => setCreateModalStep('form')}
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
                    disabled={isDownloadingPreviewJpg}
                    onClick={handleDownloadPreviewJpg}
                    leftIcon={<Download className="w-3.5 h-3.5 text-[#0082a6]" />}
                    className="cursor-pointer text-xs font-semibold"
                  >
                    {isDownloadingPreviewJpg ? 'Downloading...' : 'Download JPG'}
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
                    disabled={isSubmittingReservation}
                    onClick={handleFinalConfirmReservation}
                    leftIcon={<Check className="w-4 h-4" />}
                    className="cursor-pointer text-xs font-bold"
                  >
                    {isSubmittingReservation ? 'Reserving...' : '✓ Confirm & Reserve Now'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          </Dialog>
        )}

        {/* Invoice / Printable Receipt Modal */}
        {invoiceBooking && (
          <InvoiceModal
            isOpen={!!invoiceBooking}
            onClose={() => setInvoiceBooking(null)}
            booking={invoiceBooking}
          />
        )}

        {/* WhatsApp Event Order Share Modal */}
        {whatsAppBooking && (
          <WhatsAppShareModal
            isOpen={!!whatsAppBooking}
            onClose={() => setWhatsAppBooking(null)}
            booking={whatsAppBooking}
          />
        )}
      </div>
    </AdminLayout>
  );
};
