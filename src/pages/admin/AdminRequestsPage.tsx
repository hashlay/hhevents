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
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { BookingStatusBadge, TimeSlotBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InvoiceModal } from '../../components/ui/InvoiceModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  fetchBookingsAsync,
  updateBookingStatusAsync,
  updatePaymentStatusAsync,
  checkSlotAvailability,
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
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

  // Direct Manual Reservation Modal State & Packages
  const [packageOptions, setPackageOptions] = useState<ReservationPackageOption[]>(RESERVATION_PACKAGE_OPTIONS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
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
    advancePaid: 15000,
    notes: 'Wedding / Nikah (Main Ceremony)',
  });

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

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.customerName.trim() || !createForm.phone.trim() || !createForm.date) {
      showToast('Please fill in Customer Name, Phone, and Event Date', 'error');
      return;
    }

    const cleanPhone = createForm.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    const baseRent = Number(createForm.estimatedRent) || 0;
    const discAmount = createForm.discountValue > 0
      ? createForm.discountType === 'percentage'
        ? Math.round((baseRent * createForm.discountValue) / 100)
        : Math.min(baseRent, createForm.discountValue)
      : 0;
    const netRent = Math.max(0, baseRent - discAmount);
    const advance = Number(createForm.advancePaid) || 0;
    const balanceDue = Math.max(0, netRent - advance);

    // Conflict check
    const conflict = checkSlotAvailability(createForm.hall, createForm.date, createForm.slot);
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

    setIsSubmittingReservation(true);
    try {
      const payload = {
        customerName: createForm.customerName.trim(),
        phone: cleanPhone.slice(-10),
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
        discountAmount: discAmount,
        discountType: createForm.discountValue > 0 ? createForm.discountType : undefined,
        discountValue: createForm.discountValue > 0 ? createForm.discountValue : undefined,
        amountPaid: advance,
        balanceDue: balanceDue,
        paymentStatus: balanceDue === 0 && advance > 0 ? 'fully_paid' : advance > 0 ? 'advance_paid' : 'unpaid',
        advancePaymentStatus: balanceDue === 0 && advance > 0 ? 'fully_paid' : advance > 0 ? 'advance_paid' : 'unpaid',
        status: 'CONFIRMED',
        notes: finalEventTitle,
        additionalInfo: finalEventTitle,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('hh_auth_token_v5') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to create reservation', 'error');
        return;
      }

      showToast(`Reservation successfully confirmed for ${createForm.customerName}!`, 'success');
      setIsCreateModalOpen(false);
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
          Authorization: `Bearer ${token}`,
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
        `Are you sure you want to permanently delete booking #${bookingId} from the database? This will completely remove it and release the slot.`
      )
    ) {
      return;
    }
    setDeletingBookingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('hh_admin_token') || sessionStorage.getItem('hh_admin_token') || ''}`,
        },
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(null);
        }
        showToast(`Booking #${bookingId} has been permanently deleted from database.`, 'success');
      } else {
        showToast('Failed to delete booking from server', 'error');
      }
    } catch {
      showToast('Error deleting booking', 'error');
    } finally {
      setDeletingBookingId(null);
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountBooking) return;
    setIsApplyingDiscount(true);
    try {
      const res = await fetch(`/api/bookings/${discountBooking.id}/discount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hh_admin_token') || sessionStorage.getItem('hh_admin_token') || ''}`,
        },
        body: JSON.stringify({
          discountType: customDiscountType,
          discountValue: customDiscountVal,
          reason: customDiscountReason,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === discountBooking.id ? { ...b, ...data.booking } : b))
        );
        if (selectedBooking?.id === discountBooking.id) {
          setSelectedBooking({ ...selectedBooking, ...data.booking });
        }
        setDiscountBooking(null);
        showToast(`Discount applied to #${discountBooking.id}. Total & balance updated.`, 'success');
      } else {
        showToast('Failed to apply discount', 'error');
      }
    } catch {
      showToast('Error applying discount', 'error');
    } finally {
      setIsApplyingDiscount(false);
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
            onClick={() => setIsCreateModalOpen(true)}
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
                const totalRent = b.totalEstimate || b.estimatedAmount || 30000;
                const paid = (b as any).amountPaid || 0;
                const balance = (b as any).balanceDue !== undefined ? (b as any).balanceDue : Math.max(0, totalRent - paid);

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
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
                        <span className="font-mono font-bold text-slate-900">₹{totalRent.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Paid</span>
                        <span className="font-mono font-semibold text-emerald-700">₹{paid.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Balance</span>
                        <span className={`font-mono font-bold ${balance > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                          ₹{balance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                      {b.phone && (
                        <a
                          href={`https://wa.me/91${b.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                            `Hello ${b.customerName || 'Sir/Madam'}, this is regarding your event booking request (${b.id}) at H H Events & Conventions.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>WhatsApp</span>
                        </a>
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
                      <th className="p-3.5">Reference</th>
                      <th className="p-3.5">Applicant / Host</th>
                      <th className="p-3.5">Package &amp; Spaces</th>
                      <th className="p-3.5">Event Date &amp; Slot</th>
                      <th className="p-3.5">Financials</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => {
                      const totalRent = b.totalEstimate || b.estimatedAmount || 30000;
                      const paid = (b as any).amountPaid || 0;
                      const balance = (b as any).balanceDue !== undefined ? (b as any).balanceDue : Math.max(0, totalRent - paid);

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 whitespace-nowrap">
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

                          <td className="p-3.5">
                            <strong className="block text-slate-900 font-medium">
                              {b.customerName || b.applicantName}
                            </strong>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {b.phone || b.applicantPhone}
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-700">
                            <strong className="block font-medium">
                              {b.packageName || (b.hall === 'both' ? 'Full Combined Hall' : 'Single Hall')}
                            </strong>
                            <span className="text-[11px] text-slate-500 block">
                              {b.hall === 'both' ? 'Gents + Ladies Hall' : b.hall === 'hall_2' ? 'Hall 2 (Ladies)' : 'Hall 1 (Gents)'} &bull; {b.acOption?.toUpperCase()}
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-700">
                            {(() => {
                              const evDate = b.date || b.eventDate || '';
                              const isToday = evDate === todayStr;
                              const isPast = evDate && evDate < todayStr;
                              const diffDays = evDate ? Math.round((new Date(evDate + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) / 86400000) : null;

                              return (
                                <div>
                                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
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
                                  <span className="text-[10px] text-slate-400 uppercase font-mono block mt-0.5">
                                    {b.slot || b.timeSlot} Session
                                  </span>
                                </div>
                              );
                            })()}
                          </td>

                          <td className="p-3.5 text-slate-900">
                            <div className="font-mono font-bold">
                              ₹{totalRent.toLocaleString('en-IN')}
                            </div>
                            {b.couponCode && (
                              <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
                                <Tag className="w-2.5 h-2.5" />
                                {b.couponCode} (-₹{(b.discountAmount || 0).toLocaleString('en-IN')})
                              </div>
                            )}
                            <div className="text-[11px] text-emerald-700 font-medium">
                              Paid: ₹{paid.toLocaleString('en-IN')}
                            </div>
                            {balance > 0 && (
                              <div className="text-[10px] text-amber-700 font-mono">
                                Due: ₹{balance.toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5">
                            <BookingStatusBadge status={b.status} />
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Direct WhatsApp Contact */}
                              {b.phone && (
                                <a
                                  href={`https://wa.me/91${b.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                                    `Hello ${b.customerName || 'Sir/Madam'}, this is regarding your event booking request (${b.id}) at H H Events & Conventions.`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  title="Chat on WhatsApp"
                                >
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>WhatsApp</span>
                                </a>
                              )}

                              {/* Direct Phone Call */}
                              {b.phone && (
                                <a
                                  href={`tel:${b.phone}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                                  title="Call Customer"
                                >
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  <span>Call</span>
                                </a>
                              )}

                              {/* Official Printable Receipt Button */}
                              <button
                                onClick={() => setInvoiceBooking(b)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                                title="Print Official Receipt & Invoice"
                              >
                                <Receipt className="w-3.5 h-3.5 text-amber-700" />
                                <span>Receipt</span>
                              </button>

                              {/* Primary Review / Manage Button */}
                              <Button
                                onClick={() => setSelectedBooking(b)}
                                variant={b.status === 'PENDING' ? 'gold' : 'outline'}
                                size="sm"
                                className="cursor-pointer font-bold px-3 py-1 text-xs"
                              >
                                {b.status === 'PENDING' ? 'Review Request' : 'Manage'}
                              </Button>

                              {/* Permanently Delete Booking */}
                              <button
                                type="button"
                                onClick={() => handleDeleteBooking(b.id)}
                                disabled={deletingBookingId === b.id}
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
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
            onClose={() => setSelectedBooking(null)}
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

                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-400">
                    Reservation Schedule
                  </h4>
                  <p>Date: <strong>{selectedBooking.date || selectedBooking.eventDate}</strong></p>
                  <p>Session: <strong className="uppercase">{selectedBooking.slot || selectedBooking.timeSlot} Session</strong></p>
                  <p>Attendees: <strong>{selectedBooking.expectedAttendees || 0} Guests</strong></p>
                </div>
              </div>

              {selectedBooking.additionalInfo && (
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-1">Catering / Special Notes:</span>
                  <p>{selectedBooking.additionalInfo}</p>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Grand Total Tariff:</span>
                  <span className="font-mono text-base text-[#173D35]">
                    ₹{((selectedBooking as any).totalAmount || selectedBooking.estimatedAmount || selectedBooking.totalEstimate || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {selectedBooking.couponCode && (
                  <div className="flex justify-between items-center text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <span className="flex items-center gap-1 font-semibold">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      Discount ({selectedBooking.couponCode}):
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      -₹{(selectedBooking.discountAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {(() => {
                  const bObj = selectedBooking as any;
                  const total = bObj.totalAmount || selectedBooking.totalEstimate || selectedBooking.estimatedAmount || 0;
                  const paid = bObj.amountPaid !== undefined ? Number(bObj.amountPaid) : (selectedBooking.advancePaymentStatus === 'fully_paid' ? total : selectedBooking.advancePaymentStatus === 'advance_paid' ? Math.round(total * 0.25) : 0);
                  const balance = bObj.balanceDue !== undefined ? Number(bObj.balanceDue) : Math.max(0, total - paid);
                  return (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">Advance / Paid Amount:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ₹{paid.toLocaleString('en-IN')} Paid ({selectedBooking.advancePaymentStatus === 'fully_paid' ? 'Fully Paid' : paid > 0 ? 'Advance Paid' : 'Unpaid'})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">Outstanding Balance:</span>
                        <span className="font-mono font-bold text-amber-800">
                          ₹{balance.toLocaleString('en-IN')}
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
                    onClick={() => {
                      setDiscountBooking(selectedBooking);
                      setCustomDiscountType('fixed');
                      setCustomDiscountVal(selectedBooking.discountAmount || 0);
                      setCustomDiscountReason('');
                    }}
                    leftIcon={<Percent className="w-3.5 h-3.5 text-amber-600" />}
                  >
                    Add Discount
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
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Already Paid</span>
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
            title={`Apply Direct Discount — ${discountBooking.id}`}
            maxWidth="md"
          >
            <form onSubmit={handleApplyDiscount} className="space-y-4 text-xs">
              {(() => {
                const bObj = discountBooking as any;
                const origTotal = bObj.totalEstimate || bObj.totalAmount || bObj.estimatedAmount || bObj.packagePrice || 0;
                let computedDiscount = 0;
                if (customDiscountType === 'percentage') {
                  computedDiscount = Math.round((origTotal * customDiscountVal) / 100);
                } else {
                  computedDiscount = Math.min(origTotal, customDiscountVal);
                }
                const netPayable = Math.max(0, origTotal - computedDiscount);
                return (
                  <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-700">
                      <span>Original Booking Total:</span>
                      <strong className="font-mono text-sm">₹{origTotal.toLocaleString('en-IN')}</strong>
                    </div>
                    {computedDiscount > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                        <span>Discount to Deduct:</span>
                        <span className="font-mono">- ₹{computedDiscount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-slate-900 font-bold pt-2 border-t border-amber-200">
                      <span>New Net Payable Rent:</span>
                      <span className="font-mono text-base text-amber-900">₹{netPayable.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
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
                    {customDiscountType === 'percentage' ? 'Discount (%) *' : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={customDiscountType === 'percentage' ? 100 : undefined}
                    value={customDiscountVal || ''}
                    onChange={(e) => setCustomDiscountVal(Number(e.target.value))}
                    placeholder={customDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 5000'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Reason / Remarks</label>
                <input
                  type="text"
                  value={customDiscountReason}
                  onChange={(e) => setCustomDiscountReason(e.target.value)}
                  placeholder="e.g. Special management waiver / festival promotion"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
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
                  {isApplyingDiscount ? 'Applying...' : 'Apply & Save Discount'}
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
            onClose={() => setIsCreateModalOpen(false)}
            title="Direct Manual Reservation"
            maxWidth="md"
          >
            <form onSubmit={handleCreateReservation} className="space-y-4 text-xs">
              <p className="text-slate-500 text-[11px] -mt-1">
                Instantly book and confirm a reservation directly into the venue database with custom pricing &amp; discounts.
              </p>

              {/* Hall & Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Package &amp; Hall Space *
                  </label>
                  <select
                    value={createForm.packageId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const pkg = packageOptions.find((p) => p.id === selId);
                      if (pkg) {
                        setCreateForm({
                          ...createForm,
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
                    <span>Wing: <strong className="text-slate-700">{createForm.hall === 'both' ? 'Combined Campus (Full Hall)' : createForm.hall === 'hall_1' ? 'Hall 1 (Gents Wing)' : 'Hall 2 (Ladies Wing)'}</strong></span>
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
                  Phone Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35]"
                />
              </div>

              {(() => {
                const baseRent = Number(createForm.estimatedRent) || 0;
                const discAmount = createForm.discountValue > 0
                  ? createForm.discountType === 'percentage'
                    ? Math.round((baseRent * createForm.discountValue) / 100)
                    : Math.min(baseRent, createForm.discountValue)
                  : 0;
                const netRent = Math.max(0, baseRent - discAmount);
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
                          <span>Special Discount ({createForm.discountType === 'percentage' ? `${createForm.discountValue}%` : 'Flat'}):</span>
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
                          value={createForm.advancePaid}
                          onChange={(e) => setCreateForm({ ...createForm, advancePaid: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#173D35] font-mono text-emerald-700 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Remaining Balance Due (₹)
                        </label>
                        <div className="px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 font-mono text-amber-800 font-bold">
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
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={isSubmittingReservation}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  {isSubmittingReservation ? 'Reserving...' : 'Confirm & Reserve Instantly'}
                </Button>
              </div>
            </form>
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
      </div>
    </AdminLayout>
  );
};
