import React from 'react';
import { Printer, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
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

  const totalAmount = booking.totalEstimate || booking.estimatedAmount || 20000;
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
    <Dialog isOpen={isOpen} onClose={onClose} title="Booking Invoice" maxWidth="2xl">
      <div className="space-y-4 text-neutral-900">
        {/* Clean Luxury Invoice Sheet (Airy, Minimalist, Proportional Typography) */}
        <div
          id="printable-receipt"
          className="p-6 sm:p-8 bg-white border border-neutral-200 rounded-xl space-y-5 shadow-xs print:border-none print:shadow-none print:p-0"
        >
          {/* Header: Venue Branding & Invoice Meta */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <img
                src="/assets/branding/hh-logo.png"
                alt="H H Events"
                className="h-10 sm:h-11 w-auto object-contain shrink-0"
              />
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-serif font-bold text-neutral-900 tracking-tight leading-tight">
                  H H Events &amp; Conventions
                </h2>
                <p className="text-[10.5px] text-neutral-500 leading-tight">
                  Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal — 574231
                </p>
                <p className="text-[10.5px] text-neutral-600 font-mono pt-0.5">
                  Tel: {VENUE_INFO.primaryPhone} &bull; Alt: {VENUE_INFO.secondaryPhone} &bull; WhatsApp: {VENUE_INFO.whatsappPhone}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 space-y-0.5">
              <span className="text-[9.5px] font-bold uppercase tracking-widest text-neutral-400 block">
                Official Invoice
              </span>
              <span className="text-xs font-mono font-bold text-neutral-900 block">
                {receiptNo}
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Date: <strong className="text-neutral-700 font-medium">{currentDate}</strong>
              </span>
              {balanceDue > 0 ? (
                <span className="inline-block mt-1 text-[9.5px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Balance Pending
                </span>
              ) : (
                <span className="inline-block mt-1 text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Fully Settled
                </span>
              )}
            </div>
          </div>

          {/* Client & Reservation Coordinates (Clean Open Grid, No Clunky Boxes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Host Details */}
            <div className="space-y-1">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-400 block">
                Billed To
              </span>
              <div className="text-xs font-bold text-neutral-900">{booking.customerName}</div>
              <div className="text-neutral-600 font-mono text-[11px] flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                <span>{booking.phone}</span>
              </div>
              {booking.email && (
                <div className="text-neutral-500 text-[11px] truncate">{booking.email}</div>
              )}
              {booking.eventType && (
                <div className="text-[11px] text-neutral-600 pt-0.5">
                  Occasion: <span className="capitalize font-medium text-neutral-800">{booking.eventType}</span>
                </div>
              )}
            </div>

            {/* Event Schedule */}
            <div className="space-y-1 sm:text-right">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-400 block">
                Reservation Details
              </span>
              <div className="text-xs font-bold text-neutral-900">
                {booking.packageName || (booking.hall === 'both' ? 'Full Combined Hall' : 'Single Hall')}
              </div>
              <div className="text-[11px] text-neutral-700">
                Event Date: <span className="font-semibold text-neutral-900">{booking.date}</span>
              </div>
              <div className="text-[11px] text-neutral-600">
                {booking.slot === 'day' ? 'Day Session (10:00 AM – 3:00 PM)' : 'Evening Session (6:00 PM – 10:00 PM)'}
              </div>
              <div className="text-[10.5px] font-mono text-neutral-400">
                Ref: {booking.id}
              </div>
            </div>
          </div>

          {/* Itemized Charges Table (Airy, Hairline Borders, Proportional Typography) */}
          <div className="pt-1">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[9.5px]">
                  <th className="py-2 pr-3 font-semibold">Description</th>
                  <th className="py-2 px-3 font-semibold text-center">Session</th>
                  <th className="py-2 pl-3 font-semibold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-3 pr-3">
                    <span className="font-semibold text-neutral-900 block text-xs">
                      {booking.packageName || 'Convention Hall Booking'}
                    </span>
                    <span className="text-[10.5px] text-neutral-500 block mt-0.5 leading-relaxed">
                      Venue space, stage setup, lighting, kitchen facility &amp; standby power.
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center uppercase font-mono text-[11px] text-neutral-700">
                    {booking.slot}
                  </td>
                  <td className="py-3 pl-3 text-right font-mono font-medium text-neutral-900 text-xs">
                    ₹{(booking.originalAmount || (booking.discountAmount ? totalAmount + booking.discountAmount : totalAmount)).toLocaleString('en-IN')}.00
                  </td>
                </tr>

                {/* Subtotals & Advance Payment */}
                {booking.couponCode && (booking.discountAmount || 0) > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/50">
                    <td colSpan={2} className="py-1 text-right text-[11px] font-semibold pr-3">
                      Promotional Discount ({booking.couponCode}):
                    </td>
                    <td className="py-1 text-right font-mono text-[11.5px] font-bold text-emerald-700">
                      - ₹{(booking.discountAmount || 0).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                )}

                <tr className="text-neutral-600">
                  <td colSpan={2} className="pt-3 pb-1 text-right text-[11px]">
                    Total Agreed Tariff:
                  </td>
                  <td className="pt-3 pb-1 text-right font-mono text-neutral-900 text-[11.5px] font-medium">
                    ₹{totalAmount.toLocaleString('en-IN')}.00
                  </td>
                </tr>

                <tr className="text-neutral-600">
                  <td colSpan={2} className="py-1 text-right text-[11px]">
                    Advance Paid:
                  </td>
                  <td className="py-1 text-right font-mono text-neutral-700 text-[11.5px]">
                    - ₹{amountPaid.toLocaleString('en-IN')}.00
                  </td>
                </tr>

                {/* Balance Due Row (Tasteful Red Accent on Number Only) */}
                <tr className="border-t border-neutral-200">
                  <td colSpan={2} className="pt-2.5 pb-1 text-right text-xs font-bold text-neutral-800 uppercase tracking-wide">
                    Outstanding Balance:
                  </td>
                  <td className="pt-2.5 pb-1 text-right font-mono text-sm font-bold text-rose-600">
                    ₹{balanceDue.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Guidelines & Authorized Signature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-100 text-[10.5px]">
            <div className="text-neutral-500 leading-relaxed space-y-0.5">
              <p className="font-semibold text-neutral-700 text-[10px] uppercase tracking-wide">Notice &amp; Guidelines:</p>
              <p>&bull; Present this receipt at the venue office for event entry and hall handover.</p>
              <p>&bull; Session times: Day 10 AM – 3 PM | Evening 6 PM – 10 PM.</p>
            </div>

            <div className="flex flex-col justify-end text-left sm:text-right space-y-1">
              <div className="h-8 flex items-end sm:justify-end">
                <div className="border-b border-neutral-300 w-36 pb-0.5 text-[9.5px] font-serif text-neutral-500 text-center sm:text-right">
                  Authorized Signatory
                </div>
              </div>
              <span className="text-[10px] text-neutral-400 block">
                H H Events &amp; Conventions Desk
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls (Hidden on Print) */}
        <div className="flex items-center justify-between pt-1 no-print">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Close
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            className="cursor-pointer font-bold shadow-xs text-xs"
          >
            Print Receipt / Save PDF
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
