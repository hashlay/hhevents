import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  Printer,
  ArrowRight,
  ShieldCheck,
  XCircle,
  PhoneCall,
  MessageCircle,
  Receipt,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { trackBooking } from '../../services/bookingStorage';
import { VENUE_INFO } from '../../services/hallData';

interface TrackedBooking {
  id: string;
  customerName: string;
  packageName?: string;
  hall?: string;
  hallSelection?: string;
  acOption?: string;
  date: string;
  slot: string;
  status: string;
  totalAmount?: number;
  estimatedAmount?: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus?: string;
  submittedAt?: string;
  adminRemarks?: string;
  rejectionReason?: string;
}

export const TrackBookingPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramId = urlParams.get('id') || urlParams.get('ref') || '';
  const paramPhone = urlParams.get('phone') || '';

  const [bookingIdQuery, setBookingIdQuery] = useState(paramId);
  const [phoneQuery, setPhoneQuery] = useState(paramPhone);
  const [booking, setBooking] = useState<TrackedBooking | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performSearch = async (queryId: string, queryPhone?: string) => {
    const cleanId = queryId.trim();
    if (!cleanId) return;

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      // 1. Try server tracking API with phone verification if phone provided
      const phoneParam = queryPhone ? `&phone=${encodeURIComponent(queryPhone.trim())}` : '';
      const res = await fetch(`/api/bookings/track?id=${encodeURIComponent(cleanId)}${phoneParam}`);

      if (res.ok) {
        const data = await res.json();
        setBooking(data);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to local synchronous cache
      const localResult = trackBooking(cleanId);
      if (localResult) {
        setBooking(localResult as any);
        setIsLoading(false);
        return;
      }

      setBooking(null);
      setErrorMessage(`No reservation found matching "${cleanId}". Please verify your reference number or phone number.`);
    } catch {
      // Fallback to local
      const localResult = trackBooking(cleanId);
      if (localResult) {
        setBooking(localResult as any);
      } else {
        setErrorMessage('Unable to look up reservation details. Please check connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) {
      performSearch(paramId, paramPhone);
    }
  }, [paramId, paramPhone]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(bookingIdQuery, phoneQuery);
  };

  const getStatusBadge = (status: string) => {
    const upper = (status || '').toUpperCase();
    switch (upper) {
      case 'APPROVED':
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> CONFIRMED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDING REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> DECLINED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F6F5F4] text-[#7E7873] border border-[#E8E5E1]">
            <AlertCircle className="w-3.5 h-3.5" /> CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-16 pb-24 bg-[#FDFBF9] text-[#161210]">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#F6F5F4] py-14 sm:py-18 border-b border-[#E8E5E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#9A6611] bg-[#FAF2E4] px-3.5 py-1.5 rounded-full border border-[#E8D7BE] inline-flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#C88D23]" />
              Reservation Tracker
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#161210] tracking-tight font-serif-heading">
              Track Reservation Status
            </h1>
            <p className="text-base sm:text-lg text-[#58453E] leading-relaxed">
              Enter your booking reference code or registered mobile phone number to check review progress, payment records, and allocated hall wings.
            </p>
          </div>
        </div>
      </section>

      {/* Search Input Box */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSearch} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5E1] shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#161210] uppercase tracking-wider mb-1.5">
                Booking Reference ID *
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E7873]" />
                <input
                  type="text"
                  value={bookingIdQuery}
                  onChange={(e) => setBookingIdQuery(e.target.value)}
                  placeholder="e.g. HH-2026-104921"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#D8D3CC] text-sm text-[#161210] focus:ring-2 focus:ring-[#C88D23] focus:outline-none bg-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161210] uppercase tracking-wider mb-1.5">
                Registered Mobile Phone
              </label>
              <input
                type="tel"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                placeholder="e.g. 9876543210 (Optional verification)"
                className="w-full px-4 py-3 rounded-xl border border-[#D8D3CC] text-sm text-[#161210] focus:ring-2 focus:ring-[#C88D23] focus:outline-none bg-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="gold"
              size="md"
              isLoading={isLoading}
              className="w-full sm:w-auto"
            >
              Verify &amp; Track Booking
            </Button>
          </div>
        </form>

        {/* Results Area */}
        <div className="mt-8">
          {errorMessage && (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Search Notice:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {booking && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E5E1] shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0ECE7] pb-6">
                <div>
                  <span className="text-xs text-[#7E7873] uppercase tracking-wider block">Reservation Reference</span>
                  <h3 className="text-2xl font-bold font-mono text-[#161210] mt-0.5">
                    {booking.id}
                  </h3>
                </div>
                <div>{getStatusBadge(booking.status)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
                <div>
                  <span className="text-[#7E7873] block uppercase">Host Name</span>
                  <span className="font-bold text-[#161210] text-sm">{booking.customerName}</span>
                </div>
                <div>
                  <span className="text-[#7E7873] block uppercase">Package</span>
                  <span className="font-bold text-[#161210] text-sm">{booking.packageName || 'Official Hall Package'}</span>
                </div>
                <div>
                  <span className="text-[#7E7873] block uppercase">Event Date</span>
                  <span className="font-bold text-[#161210] text-sm">{booking.date}</span>
                </div>
                <div>
                  <span className="text-[#7E7873] block uppercase">Session Slot</span>
                  <span className="font-bold text-[#161210] text-sm uppercase">
                    {booking.slot === 'day' ? 'Day (10 AM - 3 PM)' : 'Evening (6 PM - 10 PM)'}
                  </span>
                </div>
              </div>

              {/* Remarks if any */}
              {booking.adminRemarks && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <strong className="font-bold block">Management Remarks:</strong>
                  <p>{booking.adminRemarks}</p>
                </div>
              )}

              {/* Financial Status */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#7E7873] block uppercase">Total Rent</span>
                  <span className="text-xl font-bold text-[#161210]">
                    ₹{(booking.totalAmount || booking.estimatedAmount || 0).toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div>
                  <span className="text-[#7E7873] block uppercase">Advance Paid</span>
                  <span className="text-xl font-bold text-emerald-700">
                    ₹{(booking.amountPaid || 0).toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div>
                  <span className="text-[#7E7873] block uppercase">Balance Due</span>
                  <span className="text-xl font-bold text-amber-700">
                    ₹{(booking.balanceDue !== undefined ? booking.balanceDue : (booking.totalAmount || 0)).toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <a
                  href={`tel:${VENUE_INFO.primaryPhone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-[#161210] font-semibold hover:text-[#C88D23]"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C88D23]" />
                  <span>Call Venue Management: {VENUE_INFO.primaryPhone}</span>
                </a>

                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print Summary
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
