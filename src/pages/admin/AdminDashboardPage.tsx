import React, { useState, useEffect } from 'react';
import {
  Inbox,
  CheckCircle2,
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  RefreshCw,
  Sliders,
  Receipt,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Phone,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookingStatusBadge } from '../../components/ui/Badge';
import { getBookings, checkSlotAvailability } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { BookingRequest } from '../../types';

interface AdminDashboardPageProps {
  navigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('hh_auth_token_v5') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookings(data);
          setIsLoading(false);
          return;
        }
      }
      // Fallback
      setBookings(getBookings());
    } catch {
      setBookings(getBookings());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const pendingBookings = bookings.filter(
    (b) => (b.status || '').toUpperCase() === 'PENDING'
  );
  const approvedBookings = bookings.filter(
    (b) => (b.status || '').toUpperCase() === 'APPROVED' || (b.status || '').toUpperCase() === 'CONFIRMED'
  );
  const completedBookings = bookings.filter(
    (b) => (b.status || '').toUpperCase() === 'COMPLETED'
  );

  // Financial Metrics
  const totalAgreedRevenue = approvedBookings.reduce(
    (sum, b) => sum + (b.totalEstimate || b.estimatedAmount || 0),
    0
  );

  const totalAdvancePaid = bookings.reduce((sum, b) => {
    if ((b as any).payments && Array.isArray((b as any).payments)) {
      return sum + (b as any).payments.reduce((pSum: number, p: any) => pSum + (p.paymentType === 'refund' ? -p.amount : p.amount), 0);
    }
    return sum + ((b as any).amountPaid || (b.advancePaymentStatus === 'fully_paid' ? (b.totalEstimate || b.estimatedAmount || 0) : b.advancePaymentStatus === 'advance_paid' ? Math.round((b.totalEstimate || b.estimatedAmount || 0) * 0.25) : 0));
  }, 0);

  const outstandingBalance = Math.max(0, totalAgreedRevenue - totalAdvancePaid);

  // Real-time Hall Availability for Today
  const hall1TodayDay = checkSlotAvailability('hall_1', today, 'day');
  const hall1TodayEve = checkSlotAvailability('hall_1', today, 'evening');
  const hall2TodayDay = checkSlotAvailability('hall_2', today, 'day');
  const hall2TodayEve = checkSlotAvailability('hall_2', today, 'evening');

  const formattedToday = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <AdminLayout
      currentPath="/admin/dashboard"
      navigate={navigate}
      title="Manager Desk"
      subtitle="Welcome! Here is today's venue status and new customer booking inquiries."
      actionButton={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              loadData();
              showToast('Refreshed latest bookings', 'info');
            }}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="cursor-pointer"
          >
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/admin/bookings')}
            variant="gold"
            size="sm"
            leftIcon={<Inbox className="w-4 h-4" />}
            className="cursor-pointer font-bold"
          >
            New Inquiries ({pendingBookings.length})
          </Button>
        </div>
      }
    >
      <div className="space-y-6 sm:space-y-7 max-w-6xl">
        {/* 3 Calm, Senior-Friendly Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* 1. New Inquiries */}
          <div
            onClick={() => navigate('/admin/bookings')}
            className="p-5 rounded-2xl bg-white border-2 border-amber-200/80 hover:border-amber-400 transition-all shadow-xs cursor-pointer group flex items-start justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                New Inquiries
              </span>
              <div className="text-4xl font-extrabold text-amber-700 font-mono">
                {pendingBookings.length}
              </div>
              <p className="text-xs text-slate-500 font-medium pt-1">
                {pendingBookings.length === 1 ? '1 request needs review' : `${pendingBookings.length} requests waiting for approval`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* 2. Confirmed Bookings */}
          <div
            onClick={() => navigate('/admin/calendar')}
            className="p-5 rounded-2xl bg-white border-2 border-emerald-200/80 hover:border-emerald-400 transition-all shadow-xs cursor-pointer group flex items-start justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Confirmed Bookings
              </span>
              <div className="text-4xl font-extrabold text-emerald-800 font-mono">
                {approvedBookings.length}
              </div>
              <p className="text-xs text-slate-500 font-medium pt-1">
                Dates confirmed on calendar
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* 3. Advance Payments Collected */}
          <div className="p-5 rounded-2xl bg-white border-2 border-[#E2DACB] hover:border-[#C9AA72] transition-all shadow-xs flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#173D35]">
                Advance Received
              </span>
              <div className="text-3xl font-extrabold text-[#173D35] font-mono">
                ₹{totalAdvancePaid.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 font-medium pt-1">
                Balance due: <strong className="text-amber-800 font-mono">₹{outstandingBalance.toLocaleString('en-IN')}</strong>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] text-[#173D35] flex items-center justify-center shrink-0 border border-[#E2DACB]">
              <Receipt className="w-6 h-6 text-[#173D35]" />
            </div>
          </div>
        </div>

        {/* Today's Venue Schedule (Clear & Human Friendly) */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2DACB] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#173D35] font-serif-heading">
                Today's Hall Schedule
              </h3>
              <p className="text-xs text-[#737373] mt-0.5">
                {formattedToday}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/admin/calendar')}
                variant="outline"
                size="sm"
                leftIcon={<Calendar className="w-3.5 h-3.5" />}
              >
                View Full Calendar
              </Button>
              <Button
                onClick={() => navigate('/admin/availability')}
                variant="outline"
                size="sm"
                leftIcon={<Sliders className="w-3.5 h-3.5" />}
              >
                Block / Free Date
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hall 1 (Main Hall) */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#173D35] text-sm">Hall 1 (Main Hall)</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Gents Hall</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium block">Day (10 AM – 3 PM)</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    hall1TodayDay.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {hall1TodayDay.available ? 'Available' : 'Booked'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium block">Evening (6 PM – 10 PM)</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    hall1TodayEve.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {hall1TodayEve.available ? 'Available' : 'Booked'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hall 2 (Dining & Ladies) */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#173D35] text-sm">Hall 2 (Dining Hall)</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Ladies &amp; Dining</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium block">Day (10 AM – 3 PM)</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    hall2TodayDay.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {hall2TodayDay.available ? 'Available' : 'Booked'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium block">Evening (6 PM – 10 PM)</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    hall2TodayEve.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {hall2TodayEve.available ? 'Available' : 'Booked'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Inquiries List with 1-Click WhatsApp & Call */}
        <div className="bg-white rounded-2xl border border-[#E2DACB] shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-[#173D35] font-serif-heading">
                Recent Customer Requests
              </h3>
              <p className="text-xs text-[#737373]">
                Customer inquiries needing your review or phone confirmation
              </p>
            </div>

            <Button
              onClick={() => navigate('/admin/bookings')}
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="cursor-pointer"
            >
              View All Bookings ({bookings.length})
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {bookings.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 p-3 rounded-xl transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">
                      {b.customerName || 'Customer'}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-500">
                      ({b.phone})
                    </span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#173D35]">
                      {b.packageName || 'Hall Booking'}
                    </span>
                    <span>&bull;</span>
                    <span>Date: <strong>{b.date}</strong> ({b.slot === 'day' ? 'Day' : 'Evening'})</span>
                    <span>&bull;</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{(b.totalEstimate || b.estimatedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {b.phone && (
                    <a
                      href={`https://wa.me/91${b.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                        `Hello ${b.customerName || 'Sir/Madam'}, this is H H Events & Conventions regarding your booking request for ${b.date}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {b.phone && (
                    <a
                      href={`tel:${b.phone}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Call</span>
                    </a>
                  )}

                  <Button
                    onClick={() => navigate('/admin/bookings')}
                    variant={b.status === 'PENDING' ? 'gold' : 'outline'}
                    size="sm"
                    className="cursor-pointer font-bold px-3 py-1 text-xs"
                  >
                    {b.status === 'PENDING' ? 'Review' : 'Open'}
                  </Button>
                </div>
              </div>
            ))}

            {bookings.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No booking inquiries recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
