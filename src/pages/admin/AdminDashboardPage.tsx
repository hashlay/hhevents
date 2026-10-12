import React, { useState, useEffect } from 'react';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  RefreshCw,
  Sliders,
  CalendarDays,
  IndianRupee,
  Receipt,
  Package,
  CreditCard,
  Eye,
  AlertCircle
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

  return (
    <AdminLayout
      currentPath="/admin/dashboard"
      navigate={navigate}
      title="Management Operations Dashboard"
      subtitle="H H Events & Conventions reservation overview, live venue status, and financial ledger"
      actionButton={
        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/admin/bookings')}
            variant="gold"
            size="sm"
            leftIcon={<Inbox className="w-4 h-4" />}
          >
            Review Bookings ({pendingBookings.length})
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Core KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Pending Requests */}
          <Card className="p-5 flex items-center justify-between border-slate-200 hover:border-amber-400 transition-colors shadow-2xs bg-white">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Requests
              </span>
              <h3 className="text-3xl font-extrabold text-amber-600 mt-1 font-mono">
                {pendingBookings.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting review clearance</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </Card>

          {/* 2. Confirmed & Approved */}
          <Card className="p-5 flex items-center justify-between border-slate-200 hover:border-emerald-400 transition-colors shadow-2xs bg-white">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Confirmed Events
              </span>
              <h3 className="text-3xl font-extrabold text-emerald-700 mt-1 font-mono">
                {approvedBookings.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Spaces locked in schedule</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </Card>

          {/* 3. Agreed Revenue Ledger */}
          <Card className="p-5 flex items-center justify-between border-slate-200 hover:border-[#173D35] transition-colors shadow-2xs bg-white">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Agreed Revenue
              </span>
              <h3 className="text-2xl font-black text-[#173D35] mt-1 font-mono">
                ₹{totalAgreedRevenue.toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Paid: ₹{totalAdvancePaid.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#173D35] flex items-center justify-center">
              <Receipt className="w-6 h-6 text-[#173D35]" />
            </div>
          </Card>

          {/* 4. Outstanding Balance Due */}
          <Card className="p-5 flex items-center justify-between border-slate-200 hover:border-amber-400 transition-colors shadow-2xs bg-white">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Outstanding Balance
              </span>
              <h3 className="text-2xl font-black text-amber-700 mt-1 font-mono">
                ₹{outstandingBalance.toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">To be remitted before events</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Venue Operational Status for Today */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#173D35]" />
              <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                Today's Real-Time Hall Availability ({today})
              </h3>
            </div>
            <Button
              onClick={() => navigate('/admin/availability')}
              variant="outline"
              size="sm"
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
            >
              Adjust Calendar
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Hall 1 &bull; Day Session</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">10:00 AM – 3:00 PM</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hall1TodayDay.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {hall1TodayDay.available ? 'Available' : 'Reserved'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Hall 1 &bull; Evening Session</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">6:00 PM – 10:00 PM</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hall1TodayEve.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {hall1TodayEve.available ? 'Available' : 'Reserved'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Hall 2 &bull; Day Session</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">10:00 AM – 3:00 PM</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hall2TodayDay.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {hall2TodayDay.available ? 'Available' : 'Reserved'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Hall 2 &bull; Evening Session</span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">6:00 PM – 10:00 PM</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hall2TodayEve.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {hall2TodayEve.available ? 'Available' : 'Reserved'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                Recent Booking Applications
              </h3>
              <p className="text-xs text-slate-500">Latest reservation requests submitted via customer portal</p>
            </div>

            <Button
              onClick={() => navigate('/admin/bookings')}
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View All ({bookings.length})
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Applicant / Host</th>
                  <th className="p-3">Package / Space</th>
                  <th className="p-3">Event Date</th>
                  <th className="p-3">Rent Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#173D35]">{b.id}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{b.customerName}</div>
                      <span className="text-[11px] text-slate-400 font-mono">{b.phone}</span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {b.packageName || (b.hall === 'both' ? 'Full Combined Hall' : 'Single Hall')}
                    </td>
                    <td className="p-3 text-slate-700 font-mono">
                      <div>{b.date}</div>
                      <span className="text-[10px] text-slate-400 uppercase">{b.slot} Session</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      ₹{(b.totalEstimate || b.estimatedAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        onClick={() => navigate('/admin/bookings')}
                        variant="outline"
                        size="sm"
                        className="py-1 px-2 text-[11px]"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No booking applications recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
