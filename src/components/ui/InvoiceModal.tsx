import React from 'react';
import { Printer, CheckCircle2, Phone, MapPin, Building, ShieldCheck, Download } from 'lucide-react';
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
  const amountPaid =
    (booking as any).amountPaid ||
    (booking.advancePaymentStatus === 'fully_paid'
      ? totalAmount
      : booking.advancePaymentStatus === 'advance_paid'
      ? Math.round(totalAmount * 0.25)
      : 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);
  const receiptNo =
    receiptNumber ||
    (booking as any).payments?.[0]?.receiptNumber ||
    `RCP-${booking.id.replace(/\D/g, '').slice(-6) || '881878'}`;
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
        {/* Printable Official Receipt Sheet */}
        <div
          id="printable-receipt"
          className="p-6 sm:p-8 bg-white border-2 border-[#E2DACB] rounded-2xl space-y-6 shadow-sm print:border-none print:shadow-none print:p-0"
        >
          {/* Header with Official Logo & Luxury Venue Details */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-[#173D35]/15 pb-6">
            <div className="flex items-start gap-4">
              <img
                src="/assets/branding/hh-logo.png"
                alt="H H Events Official Logo"
                className="h-16 w-auto object-contain shrink-0"
              />
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black font-serif-heading text-[#173D35] tracking-tight">
                  H H Events &amp; Conventions
                </h1>
                <p className="text-xs text-[#737373] font-medium leading-relaxed max-w-sm">
                  Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal, Karnataka — 574231
                </p>
                <div className="text-xs text-[#173D35] font-semibold flex flex-wrap items-center gap-3 pt-1">
                  <span>Tel: {VENUE_INFO.primaryPhone}</span>
                  <span className="text-slate-300">&bull;</span>
                  <span>Alt: {VENUE_INFO.secondaryPhone}</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E2DACB] sm:bg-transparent sm:p-0 sm:border-0">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#C9AA72] block">
                Official Booking Receipt
              </span>
              <span className="text-base font-mono font-black text-[#173D35] block mt-0.5">
                {receiptNo}
              </span>
              <span className="text-xs text-[#737373] block mt-0.5">
                Issued Date: <strong className="text-slate-800">{currentDate}</strong>
              </span>
            </div>
          </div>

          {/* Reference & Customer Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Host Info */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                  Host / Applicant
                </span>
                <span className="text-[10px] font-semibold text-[#173D35] bg-white px-2 py-0.5 rounded border border-[#E2DACB]">
                  Client Details
                </span>
              </div>
              <div className="text-base font-bold text-[#173D35]">{booking.customerName}</div>
              <div className="text-slate-700 font-mono font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C9AA72]" />
                {booking.phone}
              </div>
              {booking.email && (
                <div className="text-slate-600 truncate">{booking.email}</div>
              )}
              {booking.eventType && (
                <div className="text-xs text-slate-700 pt-1">
                  Occasion:{' '}
                  <strong className="capitalize text-[#173D35]">{booking.eventType}</strong>
                </div>
              )}
            </div>

            {/* Event Schedule Info */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2DACB] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                  Event Schedule
                </span>
                <span className="text-[10px] font-mono font-bold text-[#C9AA72] bg-white px-2 py-0.5 rounded border border-[#E2DACB]">
                  {booking.id}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#737373] block">Booked Date:</span>
                <span className="text-base font-bold text-[#173D35]">{booking.date}</span>
              </div>
              <div className="text-xs text-slate-700">
                Session:{' '}
                <strong className="capitalize text-[#173D35]">
                  {booking.slot === 'day'
                    ? 'Day Session (10:00 AM – 3:00 PM)'
                    : 'Evening Session (6:00 PM – 10:00 PM)'}
                </strong>
              </div>
              <div className="text-xs text-slate-700">
                Reserved Space:{' '}
                <strong className="text-[#173D35]">
                  {booking.packageName ||
                    (booking.hall === 'both' ? 'Full Combined Hall' : 'Single Hall')}
                </strong>
              </div>
            </div>
          </div>

          {/* Charges & Payments Breakdown Table */}
          <div className="border border-[#E2DACB] rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#173D35] text-white">
                <tr>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-[11px]">
                    Description &amp; Inclusions
                  </th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-center">
                    Session
                  </th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-right">
                    Tariff (₹)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DACB]">
                <tr>
                  <td className="p-3.5">
                    <strong className="text-sm font-bold text-[#173D35] block">
                      {booking.packageName || 'Convention Hall Booking'}
                    </strong>
                    <span className="text-xs text-slate-500 mt-0.5 block leading-relaxed">
                      Includes full venue lighting, sound acoustic dais, stage setup, kitchen facility, and standby generator power backup.
                    </span>
                  </td>
                  <td className="p-3.5 text-center text-slate-700 uppercase font-mono font-bold">
                    {booking.slot}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                    ₹{totalAmount.toLocaleString('en-IN')}.00
                  </td>
                </tr>

                {/* Subtotals & Payment Status */}
                <tr className="bg-[#FAF8F5] font-semibold text-slate-700">
                  <td colSpan={2} className="p-3 text-right">
                    Total Agreed Tariff:
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                    ₹{totalAmount.toLocaleString('en-IN')}.00
                  </td>
                </tr>

                <tr className="bg-emerald-50/70 font-semibold text-emerald-900">
                  <td colSpan={2} className="p-3 text-right">
                    Advance Payment Received:
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-800 text-sm">
                    - ₹{amountPaid.toLocaleString('en-IN')}.00
                  </td>
                </tr>

                <tr className="bg-amber-50/80 font-bold">
                  <td colSpan={2} className="p-3.5 text-right text-amber-950 text-sm">
                    Outstanding Balance Due:
                  </td>
                  <td className="p-3.5 text-right font-mono text-base font-black text-amber-900">
                    ₹{balanceDue.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Status & Signatures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block">
                Settlement Status
              </span>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    balanceDue === 0
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : amountPaid > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {balanceDue === 0
                    ? 'FULLY SETTLED'
                    : amountPaid > 0
                    ? 'ADVANCE TOKEN RECEIVED'
                    : 'AWAITING ADVANCE TOKEN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Remaining balance is payable at the venue office before or on the event date.
              </p>
            </div>

            <div className="space-y-1 text-right flex flex-col justify-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block">
                Authorized Signatory
              </span>
              <div className="h-12 flex items-end justify-end">
                <div className="border-b-2 border-slate-400 w-48 text-center pb-1 text-[11px] font-serif text-slate-600">
                  Manager / Authorized Sign
                </div>
              </div>
              <span className="text-[10px] text-[#737373] block font-semibold">
                H H Events &amp; Conventions Desk
              </span>
            </div>
          </div>

          {/* Terms Footer */}
          <div className="border-t border-[#E2DACB] pt-4 text-[10px] text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-600">Important Venue Guidelines:</p>
            <ul className="list-disc list-inside space-y-0.5 mt-1">
              <li>Please carry this official receipt for entry clearance and hall key handover.</li>
              <li>Standard day session: 10:00 AM – 3:00 PM. Evening session: 6:00 PM – 10:00 PM.</li>
              <li>For any booking adjustments or catering queries, call {VENUE_INFO.primaryPhone}.</li>
            </ul>
          </div>
        </div>

        {/* Action Controls (Hidden on Print) */}
        <div className="flex items-center justify-between pt-2 no-print">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Close
          </Button>

          <Button
            variant="gold"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="cursor-pointer font-bold shadow-md"
          >
            Print Receipt / Save PDF
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
