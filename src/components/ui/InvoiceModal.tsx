import React from 'react';
import { Printer, X, Building2, CheckCircle2, Phone, MapPin, Mail, ShieldCheck } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { BookingRequest } from '../../types';
import { VENUE_INFO } from '../../services/hallData';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest;
  receiptNumber?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  booking,
  receiptNumber,
}) => {
  if (!isOpen || !booking) return null;

  const totalAmount = booking.totalEstimate || booking.estimatedAmount || 30000;
  const amountPaid = (booking as any).amountPaid || (booking.advancePaymentStatus === 'fully_paid' ? totalAmount : booking.advancePaymentStatus === 'advance_paid' ? Math.round(totalAmount * 0.25) : 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);
  const receiptNo = receiptNumber || (booking as any).payments?.[0]?.receiptNumber || `RCP-${booking.id.replace(/\D/g, '').slice(-6) || '104921'}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Official Booking Receipt & Invoice" maxWidth="2xl">
      <div className="space-y-6 text-[#161210]">
        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl space-y-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#173D35] text-[#C9AA72] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif-heading text-[#173D35]">
                  H H Events &amp; Conventions
                </h2>
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal, Karnataka 574231
              </p>
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-1">
                <span>Phone: {VENUE_INFO.primaryPhone}</span>
                <span>&bull;</span>
                <span>Alt: {VENUE_INFO.secondaryPhone}</span>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 sm:bg-transparent sm:p-0 sm:border-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Official Booking Receipt
              </span>
              <span className="text-sm font-mono font-black text-[#173D35] block">
                {receiptNo}
              </span>
              <span className="text-xs text-slate-500 block">
                Date: {currentDate}
              </span>
            </div>
          </div>

          {/* Reference & Host Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Applicant / Host Coordinates
              </span>
              <div className="text-sm font-bold text-slate-900">{booking.customerName}</div>
              <div className="text-slate-600 font-mono">Mobile: {booking.phone}</div>
              {booking.email && <div className="text-slate-600">Email: {booking.email}</div>}
              {booking.eventType && (
                <div className="text-slate-600 capitalize">
                  Event: <strong>{booking.eventType}</strong>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Reservation Reference &amp; Schedule
              </span>
              <div className="text-sm font-mono font-bold text-[#C9AA72]">{booking.id}</div>
              <div className="text-slate-900 font-medium">Event Date: <strong>{booking.date}</strong></div>
              <div className="text-slate-700 capitalize">
                Session: <strong>{booking.slot === 'day' ? 'Day (10:00 AM – 3:00 PM)' : 'Evening (6:00 PM – 10:00 PM)'}</strong>
              </div>
              <div className="text-slate-700">
                Package: <strong>{booking.packageName || (booking.hall === 'both' ? 'Full Combined Hall' : 'Single Hall')}</strong>
              </div>
            </div>
          </div>

          {/* Financial Ledger Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#173D35] text-white">
                <tr>
                  <th className="p-3 font-semibold">Description</th>
                  <th className="p-3 font-semibold text-center">Session</th>
                  <th className="p-3 font-semibold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3">
                    <strong className="block text-slate-900 font-medium">
                      {booking.packageName || 'Convention Hall Booking'}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Includes Catering Kitchen facility, acoustic lighting, stage dais, and power backup.
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-600 uppercase font-mono">
                    {booking.slot}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    ₹{totalAmount.toLocaleString('en-IN')}.00
                  </td>
                </tr>

                {/* Subtotals & Payments Breakdown */}
                <tr className="bg-slate-50 font-medium">
                  <td colSpan={2} className="p-3 text-right text-slate-600">Total Agreed Tariff:</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    ₹{totalAmount.toLocaleString('en-IN')}.00
                  </td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td colSpan={2} className="p-3 text-right text-emerald-800 font-semibold">Advance Payment Received:</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">
                    - ₹{amountPaid.toLocaleString('en-IN')}.00
                  </td>
                </tr>
                <tr className="bg-amber-50/50 font-bold">
                  <td colSpan={2} className="p-3 text-right text-amber-900">Outstanding Balance Due:</td>
                  <td className="p-3 text-right font-mono text-base text-amber-700">
                    ₹{balanceDue.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Status & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Payment Status
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                balanceDue === 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : amountPaid > 0
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {balanceDue === 0 ? 'FULLY PAID' : amountPaid > 0 ? 'ADVANCE TOKEN PAID' : 'PENDING ADVANCE'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Balance payable upon agreement signing or event commencement.
              </p>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Authorized Signatory
              </span>
              <div className="h-10 flex items-end justify-end">
                <span className="border-b border-slate-300 w-40 text-center text-[10px] font-serif text-slate-400">
                  Venue Authority Signature
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">H H Events &amp; Conventions</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="gold"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Receipt / Save PDF
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
