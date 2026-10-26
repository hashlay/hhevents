import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Phone,
  Calendar,
  Building2,
  ArrowUpRight,
  TrendingUp,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { InvoiceModal } from '../../components/ui/InvoiceModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { BookingRequest } from '../../types';

interface ExtendedPaymentTransaction {
  id: string;
  bookingId: string;
  amount: number;
  paymentType: 'advance' | 'balance' | 'full' | 'security_deposit' | 'installment' | 'refund' | string;
  paymentMethod: 'upi' | 'cash' | 'bank_transfer' | 'other' | string;
  receiptNumber?: string;
  referenceNo?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
  // Augmented customer booking fields
  customerName: string;
  phone: string;
  eventDate?: string;
  hall?: string;
  slot?: string;
  totalRent: number;
  totalCustomerPaid: number;
  customerBalanceDue: number;
  bookingStatus: string;
}

export const AdminPaymentsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<'all' | 'upi' | 'cash' | 'bank_transfer'>('all');
  const [filterType, setFilterType] = useState<'all' | 'advance' | 'balance' | 'full' | 'refund'>('all');
  const [activeTab, setActiveTab] = useState<'transactions' | 'accounts'>('transactions');

  // Modal States
  const [receiptBooking, setReceiptBooking] = useState<BookingRequest | null>(null);
  const [payingBooking, setPayingBooking] = useState<BookingRequest | null>(null);
  const [payAmount, setPayAmount] = useState<number>(10000);
  const [payType, setPayType] = useState<'advance' | 'balance' | 'full' | 'security_deposit'>('balance');
  const [payMethod, setPayMethod] = useState<'upi' | 'cash' | 'bank_transfer'>('upi');
  const [payRefNo, setPayRefNo] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('hh_admin_token') || sessionStorage.getItem('hh_admin_token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      } else {
        showToast('Failed to load bookings and payments from server', 'error');
      }
    } catch {
      showToast('Network error while fetching payments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Customer Booking Accounts & Metrics
  const bookingAccounts = bookings.map((b) => {
    const bObj = b as any;
    const totalRent = Number(bObj.totalAmount || b.totalEstimate || b.estimatedAmount || bObj.packagePrice || 0);

    const paymentsList = bObj.payments && Array.isArray(bObj.payments) && bObj.payments.length > 0
      ? bObj.payments
      : (bObj.amountPaid > 0 ? [{
          id: `LEGACY-${b.id}`,
          bookingId: b.id,
          amount: Number(bObj.amountPaid),
          paymentType: (b.advancePaymentStatus === 'fully_paid' ? 'full' : 'advance'),
          paymentMethod: 'cash',
          receiptNumber: `RCP-${b.id.slice(-6)}`,
          referenceNo: 'Initial Payment Token',
          receivedBy: 'Office Desk',
          createdAt: b.submittedAt || new Date().toISOString(),
        }] : []);

    const totalPaid = paymentsList.reduce(
      (sum: number, p: any) => sum + (p.paymentType === 'refund' ? -Number(p.amount) : Number(p.amount)),
      0
    );

    const balanceDue = Math.max(0, totalRent - totalPaid);
    const paymentCount = paymentsList.length;

    return {
      booking: b,
      id: b.id,
      customerName: b.customerName || bObj.applicantName || 'Customer',
      phone: b.phone || bObj.applicantPhone || '',
      eventDate: b.date || bObj.eventDate || '',
      slot: b.slot || bObj.timeSlot || '',
      hall: b.hall || bObj.hallSelection || '',
      totalRent,
      totalPaid,
      balanceDue,
      paymentCount,
      payments: paymentsList,
      status: b.status,
    };
  });

  // Flatten all transactions with enriched booking context
  const allTransactions: ExtendedPaymentTransaction[] = bookingAccounts.flatMap((acc) => {
    return acc.payments.map((p: any) => ({
      id: p.id,
      bookingId: acc.id,
      amount: Number(p.amount),
      paymentType: p.paymentType || 'advance',
      paymentMethod: p.paymentMethod || 'cash',
      receiptNumber: p.receiptNumber || `RCP-${acc.id.slice(-6)}`,
      referenceNo: p.referenceNo || '',
      receivedBy: p.receivedBy || 'Venue Desk',
      notes: p.notes || '',
      createdAt: p.createdAt || acc.booking.submittedAt || new Date().toISOString(),
      customerName: acc.customerName,
      phone: acc.phone,
      eventDate: acc.eventDate,
      hall: acc.hall,
      slot: acc.slot,
      totalRent: acc.totalRent,
      totalCustomerPaid: acc.totalPaid,
      customerBalanceDue: acc.balanceDue,
      bookingStatus: acc.status,
    }));
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Aggregate Metrics
  const totalCollected = bookingAccounts.reduce((sum, a) => sum + a.totalPaid, 0);
  const totalAgreedRevenue = bookingAccounts.reduce((sum, a) => sum + a.totalRent, 0);
  const totalOutstanding = Math.max(0, totalAgreedRevenue - totalCollected);
  const totalTransactionsCount = allTransactions.length;

  // Filters for Transactions
  const filteredTransactions = allTransactions.filter((tx) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tx.customerName.toLowerCase().includes(q) ||
      tx.phone.includes(q) ||
      tx.bookingId.toLowerCase().includes(q) ||
      (tx.receiptNumber && tx.receiptNumber.toLowerCase().includes(q)) ||
      (tx.referenceNo && tx.referenceNo.toLowerCase().includes(q));

    const matchesMethod = filterMethod === 'all' || tx.paymentMethod === filterMethod;
    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'advance'
        ? tx.paymentType === 'advance' || tx.paymentType === 'installment'
        : tx.paymentType === filterType;

    return matchesSearch && matchesMethod && matchesType;
  });

  // Filters for Accounts
  const filteredAccounts = bookingAccounts.filter((acc) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      !q ||
      acc.customerName.toLowerCase().includes(q) ||
      acc.phone.includes(q) ||
      acc.id.toLowerCase().includes(q)
    );
  });

  // Handle Recording New Installment
  const handleOpenRecordPayment = (b: BookingRequest) => {
    setPayingBooking(b);
    const bObj = b as any;
    const total = Number(bObj.totalAmount || b.totalEstimate || b.estimatedAmount || bObj.packagePrice || 65000);
    const paid = bObj.amountPaid !== undefined ? Number(bObj.amountPaid) : 0;
    const balance = bObj.balanceDue !== undefined ? Number(bObj.balanceDue) : Math.max(0, total - paid);

    setPayAmount(balance > 0 ? (paid === 0 ? Math.round(total * 0.25) : balance) : 10000);
    setPayType(paid === 0 ? 'advance' : 'balance');
    setPayMethod('upi');
    setPayRefNo('');
    setPayNotes('');
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBooking || payAmount <= 0) {
      showToast('Please enter a valid positive payment amount', 'error');
      return;
    }

    setIsRecording(true);
    try {
      const res = await fetch(`/api/bookings/${payingBooking.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('hh_admin_token') || sessionStorage.getItem('hh_admin_token') || ''}`,
        },
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentType: payType,
          paymentMethod: payMethod,
          referenceNo: payRefNo.trim() || undefined,
          notes: payNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to record payment transaction', 'error');
        return;
      }

      showToast(`Payment installment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully.`, 'success');
      await loadData();
      setPayingBooking(null);
    } catch {
      showToast('Network error while recording payment transaction', 'error');
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/payments"
      title="Payment Ledger & Revenue History"
      subtitle="Complete chronological audit history of all customer payments, advance tokens, multi-installment receipts, and outstanding dues."
      navigate={navigate}
      actionButton={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="cursor-pointer bg-white"
          >
            Refresh
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={() => navigate('/admin/bookings')}
            leftIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            All Bookings Desk
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Pillars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2DACB] shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Received</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 font-mono">
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              All installments collected across all bookings
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2DACB] shadow-2xs">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Outstanding Due</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-800 font-mono">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pending balance remaining across reservations
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2DACB] shadow-2xs">
            <div className="flex items-center justify-between text-slate-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Agreed Rent</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              ₹{totalAgreedRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gross contracted value of all events
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2DACB] shadow-2xs">
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Recorded Payments</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {totalTransactionsCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Total individual receipts &amp; payments logged
            </p>
          </div>
        </div>

        {/* View Tabs & Search Controls */}
        <div className="bg-white p-4 rounded-2xl border border-[#E2DACB] shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'bg-[#183E34] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Payment Transactions History ({filteredTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'accounts'
                    ? 'bg-[#183E34] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Customer Account Balances ({filteredAccounts.length})
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Every single payment installment is audited &amp; accounted for.
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer name, mobile phone, booking ref, or receipt #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#FAF8F5]"
              />
            </div>

            {activeTab === 'transactions' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-slate-200 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value as any)}
                    className="bg-transparent border-none text-xs font-medium text-slate-700 py-1.5 px-2 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Methods</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cash">Cash in Office</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-slate-200 text-xs">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="bg-transparent border-none text-xs font-medium text-slate-700 py-1.5 px-2 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Payment Types</option>
                    <option value="advance">Token / Installment</option>
                    <option value="balance">Balance Payment</option>
                    <option value="full">Full Settlement</option>
                    <option value="refund">Refunds</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: TRANSACTIONS AUDIT LEDGER */}
        {activeTab === 'transactions' && (
          <Card className="overflow-hidden border border-[#E2DACB] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Payment Date &amp; Time</th>
                    <th className="p-3.5">Receipt # &amp; Ref</th>
                    <th className="p-3.5">Customer / Contact</th>
                    <th className="p-3.5">Booking &amp; Event</th>
                    <th className="p-3.5">Payment Type</th>
                    <th className="p-3.5">Mode</th>
                    <th className="p-3.5 text-right">Amount Paid</th>
                    <th className="p-3.5 text-right">Booking Balance</th>
                    <th className="p-3.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-medium">No payment transactions match your search filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const bookingMatch = bookings.find((b) => b.id === tx.bookingId);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                            <div>
                              {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-slate-800 block">
                              {tx.receiptNumber || 'RCP-OFFICE'}
                            </span>
                            {tx.referenceNo && (
                              <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[120px]" title={tx.referenceNo}>
                                Ref: {tx.referenceNo}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <strong className="text-slate-900 block font-serif-heading text-xs">
                              {tx.customerName}
                            </strong>
                            <a
                              href={`tel:${tx.phone}`}
                              className="text-[11px] font-mono text-slate-500 hover:text-amber-800 flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              {tx.phone}
                            </a>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold text-slate-700 block">
                              {tx.bookingId}
                            </span>
                            {tx.eventDate && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {tx.eventDate} ({tx.slot === 'day' ? 'Day' : 'Evening'})
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                tx.paymentType === 'refund'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : tx.paymentType === 'full'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : tx.paymentType === 'balance'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {tx.paymentType === 'refund'
                                ? 'Refund'
                                : tx.paymentType === 'full'
                                ? 'Full Settlement'
                                : tx.paymentType === 'balance'
                                ? 'Balance Installment'
                                : 'Token Advance'}
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono text-xs uppercase font-medium text-slate-700 px-2 py-1 rounded bg-slate-100 border border-slate-200">
                              {tx.paymentMethod}
                            </span>
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            <span
                              className={`font-mono font-bold text-sm ${
                                tx.paymentType === 'refund' ? 'text-rose-700' : 'text-emerald-700'
                              }`}
                            >
                              {tx.paymentType === 'refund' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                            </span>
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            {tx.customerBalanceDue === 0 ? (
                              <span className="text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
                              </span>
                            ) : (
                              <span className="text-amber-700 font-mono text-xs font-semibold">
                                Due: ₹{tx.customerBalanceDue.toLocaleString('en-IN')}
                              </span>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono">
                              Paid ₹{tx.totalCustomerPaid.toLocaleString('en-IN')} of ₹{tx.totalRent.toLocaleString('en-IN')}
                            </div>
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            {bookingMatch ? (
                              <button
                                type="button"
                                onClick={() => setReceiptBooking(bookingMatch)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                                title="Print / View Official Receipt"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-700" />
                                <span>Receipt</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: CUSTOMER ACCOUNTS & MULTI-INSTALLMENT BREAKDOWN */}
        {activeTab === 'accounts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredAccounts.map((acc) => {
              const percentPaid = acc.totalRent > 0 ? Math.min(100, Math.round((acc.totalPaid / acc.totalRent) * 100)) : 0;
              const isSettled = acc.balanceDue === 0 && acc.totalPaid > 0;

              return (
                <Card key={acc.id} className="p-5 flex flex-col justify-between border border-[#E2DACB] bg-white shadow-2xs space-y-4">
                  <div>
                    {/* Header: Customer and Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                          Ref: {acc.id}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 font-serif-heading mt-0.5">
                          {acc.customerName}
                        </h4>
                        <a
                          href={`tel:${acc.phone}`}
                          className="text-xs font-mono text-slate-600 hover:text-amber-800 flex items-center gap-1 mt-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {acc.phone}
                        </a>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isSettled
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : acc.totalPaid > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isSettled ? 'Fully Settled' : acc.totalPaid > 0 ? 'Advance / Partial' : 'Unpaid'}
                      </span>
                    </div>

                    {/* Event & Rent Details */}
                    <div className="py-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Event Date:</span>
                        <strong className="text-slate-900 font-mono">
                          {acc.eventDate} ({acc.slot === 'day' ? 'Day Session' : 'Evening Session'})
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-slate-600">
                        <span>Total Agreed Rent:</span>
                        <strong className="text-slate-900 font-mono text-sm">
                          ₹{acc.totalRent.toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-emerald-700">
                        <span>Total Paid So Far:</span>
                        <strong className="font-mono text-sm font-bold">
                          ₹{acc.totalPaid.toLocaleString('en-IN')} ({acc.paymentCount} payments)
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-amber-800">
                        <span>Remaining Balance Due:</span>
                        <strong className="font-mono text-sm font-bold">
                          ₹{acc.balanceDue.toLocaleString('en-IN')}
                        </strong>
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-2">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Payment Progress</span>
                          <span className="font-mono font-bold">{percentPaid}% Paid</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isSettled ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Installments History Chips */}
                    {acc.payments.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Installments Breakdown:
                        </span>
                        <div className="space-y-1">
                          {acc.payments.map((p: any, idx: number) => (
                            <div
                              key={p.id || idx}
                              className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-200/70"
                            >
                              <span className="text-slate-600">
                                #{idx + 1} {p.paymentType === 'advance' ? 'Advance Token' : p.paymentType === 'full' ? 'Full Settlement' : 'Installment'} ({p.paymentMethod?.toUpperCase()})
                              </span>
                              <strong className="text-emerald-700 font-mono">
                                ₹{Number(p.amount).toLocaleString('en-IN')}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setReceiptBooking(acc.booking)}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Receipt / Invoice
                    </button>

                    <Button
                      variant={isSettled ? 'outline' : 'gold'}
                      size="sm"
                      onClick={() => handleOpenRecordPayment(acc.booking)}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {isSettled ? 'Record Adjustment' : 'Record Installment'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* RECORD PAYMENT DIALOG */}
        {payingBooking && (
          <Dialog
            isOpen={!!payingBooking}
            onClose={() => setPayingBooking(null)}
            title={`Record Payment Installment — ${payingBooking.id}`}
            maxWidth="md"
          >
            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              {(() => {
                const bObj = payingBooking as any;
                const total = Number(bObj.totalAmount || payingBooking.totalEstimate || payingBooking.estimatedAmount || bObj.packagePrice || 0);
                const paid = Number(bObj.amountPaid || 0);
                const balance = Number(bObj.balanceDue !== undefined ? bObj.balanceDue : Math.max(0, total - paid));
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
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Total Paid</span>
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
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Installment Type</label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as any)}
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
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="cash">Cash in Office</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Transaction Ref / Receipt No</label>
                <input
                  type="text"
                  value={payRefNo}
                  onChange={(e) => setPayRefNo(e.target.value)}
                  placeholder="e.g. UPI-9281729102 or Cash Slip #104"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Notes / Remarks</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. 2nd installment paid by client"
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
                  disabled={isRecording}
                  leftIcon={<CreditCard className="w-4 h-4" />}
                >
                  {isRecording ? 'Recording...' : 'Record Payment & Save'}
                </Button>
              </div>
            </form>
          </Dialog>
        )}

        {/* OFFICIAL PRINTABLE RECEIPT MODAL */}
        {receiptBooking && (
          <InvoiceModal
            isOpen={!!receiptBooking}
            onClose={() => setReceiptBooking(null)}
            booking={receiptBooking}
          />
        )}
      </div>
    </AdminLayout>
  );
};
