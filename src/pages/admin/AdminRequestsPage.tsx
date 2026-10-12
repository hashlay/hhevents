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
  DollarSign
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
    const total = b.totalEstimate || b.estimatedAmount || 30000;
    const paid = (b as any).amountPaid || 0;
    const remaining = Math.max(0, total - paid);
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

  const filteredBookings = bookings.filter((b) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (b.customerName || b.applicantName || '').toLowerCase().includes(searchLower) ||
      (b.phone || b.applicantPhone || '').includes(searchQuery) ||
      b.id.toLowerCase().includes(searchLower) ||
      (b.packageName || '').toLowerCase().includes(searchLower);

    const statusUpper = (b.status || '').toUpperCase();
    const filterUpper = statusFilter.toUpperCase();

    const matchesStatus =
      statusFilter === 'all' ||
      statusUpper === filterUpper;

    return matchesSearch && matchesStatus;
  });

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
            onClick={() => navigate('/book')}
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Reservation
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, mobile, reference, or package..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'pending', 'approved', 'confirmed', 'completed', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#173D35] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table / Cards */}
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
          <Card className="overflow-hidden border-slate-200 bg-white shadow-xs">
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
                        <td className="p-3.5 font-mono font-bold text-[#173D35]">
                          {b.id}
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

                        <td className="p-3.5 text-slate-700 font-mono">
                          <div>{b.date || b.eventDate}</div>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {b.slot || b.timeSlot} Session
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-900">
                          <div className="font-mono font-bold">
                            ₹{totalRent.toLocaleString('en-IN')}
                          </div>
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
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Dossier */}
                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title="View Dossier"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Record Payment */}
                            <button
                              onClick={() => openPaymentModal(b)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                              title="Record Payment in Ledger"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>

                            {/* Print Receipt / Invoice */}
                            <button
                              onClick={() => setInvoiceBooking(b)}
                              className="p-1.5 rounded-lg text-[#C9AA72] hover:text-[#A58448] hover:bg-amber-50"
                              title="Official Printable Receipt"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>

                            {/* Approve Action */}
                            {(b.status === 'PENDING' || (b.status as any) === 'pending') && (
                              <button
                                onClick={() => handleStatusChange(b.id, 'APPROVED', 'Approved by administrative desk')}
                                disabled={isProcessing}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                                title="Approve Reservation"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}

                            {/* Reject Action */}
                            {(b.status === 'PENDING' || (b.status as any) === 'pending') && (
                              <button
                                onClick={() => setRejectingBooking(b)}
                                disabled={isProcessing}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                title="Decline Reservation"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}

                            {/* Confirm Action */}
                            {(b.status === 'APPROVED' || (b.status as any) === 'approved') && (
                              <Button
                                onClick={() => handleStatusChange(b.id, 'CONFIRMED', 'Advance token verified. Event confirmed.')}
                                variant="gold"
                                size="sm"
                                className="py-1 px-2.5 text-[11px]"
                              >
                                Confirm
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
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
                    ₹{(selectedBooking.estimatedAmount || selectedBooking.totalEstimate || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Advance Status:</span>
                  <span className="capitalize font-semibold">{String(selectedBooking.advancePaymentStatus || 'unpaid').replace('_', ' ')}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInvoiceBooking(selectedBooking);
                    setSelectedBooking(null);
                  }}
                  leftIcon={<Receipt className="w-4 h-4" />}
                >
                  Print Official Receipt
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                    Close
                  </Button>
                  {(selectedBooking.status === 'PENDING' || (selectedBooking.status as any) === 'pending') && (
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
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block">Customer: <strong className="text-slate-900">{payingBooking.customerName}</strong></span>
                <span className="text-slate-500 block">Total Rent: <strong className="text-slate-900 font-mono">₹{(payingBooking.totalEstimate || payingBooking.estimatedAmount || 0).toLocaleString('en-IN')}</strong></span>
              </div>

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
