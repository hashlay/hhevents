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
      <div className="space-y-5 text-black">
        {/* Printable Official Executive Receipt (Monochrome Luxury with Red Balance Highlight) */}
        <div
          id="printable-receipt"
          className="p-5 sm:p-6 bg-white border-2 border-black rounded-xl space-y-4 shadow-sm print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 border-b-2 border-black pb-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/assets/branding/hh-logo.png"
                alt="H H Events Official Logo"
                className="h-14 w-auto object-contain shrink-0"
              />
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-black">
                  H H Events &amp; Conventions
                </h1>
                <p className="text-xs text-slate-600 font-medium leading-tight">
                  Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal — 574231
                </p>
                <div className="text-xs text-black font-medium pt-0.5 flex items-center gap-2">
                  <span>Tel: {VENUE_INFO.primaryPhone}</span>
                  <span>|</span>
                  <span>Alt: {VENUE_INFO.secondaryPhone}</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 border border-black/40 p-2.5 rounded-lg bg-slate-50 sm:bg-transparent">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Official Booking Invoice
              </span>
              <span className="text-base font-mono font-black text-black block">
                {receiptNo}
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">
                Date: <strong className="text-black">{currentDate}</strong>
              </span>
            </div>
          </div>

          {/* Reference & Customer Coordinates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Host Details */}
            <div className="p-3 rounded-lg border border-slate-300 bg-white space-y-1">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
                Bill To / Host Coordinates
              </span>
              <div className="text-sm font-black text-black">{booking.customerName}</div>
              <div className="text-slate-700 font-mono font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-black" />
                {booking.phone}
              </div>
              {booking.email && (
                <div className="text-slate-600 truncate">{booking.email}</div>
              )}
              {booking.eventType && (
                <div className="text-xs text-slate-800 pt-0.5">
                  Occasion: <strong className="capitalize text-black">{booking.eventType}</strong>
                </div>
              )}
            </div>

            {/* Event Schedule */}
            <div className="p-3 rounded-lg border border-slate-300 bg-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                  Reservation Schedule
                </span>
                <span className="text-[10px] font-mono font-bold text-black border border-black px-1.5 py-0.2 rounded">
                  {booking.id}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-600">Event Date: </span>
                <strong className="text-sm font-black text-black">{booking.date}</strong>
              </div>
              <div className="text-xs text-slate-800">
                Session: <strong className="text-black">{booking.slot === 'day' ? 'Day (10:00 AM – 3:00 PM)' : 'Evening (6:00 PM – 10:00 PM)'}</strong>
              </div>
              <div className="text-xs text-slate-800">
                Reserved Space: <strong className="text-black">{booking.packageName || (booking.hall === 'both' ? 'Full Combined Hall' : 'Single Hall')}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Financial Charges Table */}
          <div className="border border-black rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-black text-white">
                <tr>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
                    Description &amp; Amenities
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-center">
                    Session
                  </th>
                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right">
                    Tariff (₹)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-3">
                    <strong className="text-sm font-bold text-black block">
                      {booking.packageName || 'Convention Hall Booking'}
                    </strong>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Full venue lighting, acoustic dais, stage setup, kitchen facility, and standby generator power backup.
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-black uppercase font-mono font-bold">
                    {booking.slot}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-black text-sm">
                    ₹{totalAmount.toLocaleString('en-IN')}.00
                  </td>
                </tr>

                {/* Subtotals & Advance Payment */}
                <tr className="bg-slate-50 font-semibold text-slate-700">
                  <td colSpan={2} className="py-2 px-3 text-right">
                    Total Agreed Tariff:
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-black text-sm">
                    ₹{totalAmount.toLocaleString('en-IN')}.00
                  </td>
                </tr>

                <tr className="bg-white font-medium text-slate-700">
                  <td colSpan={2} className="py-2 px-3 text-right">
                    Advance Payment Received:
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                    - ₹{amountPaid.toLocaleString('en-IN')}.00
                  </td>
                </tr>

                {/* OUTSTANDING BALANCE DUE — Striking Red Highlight when Balance > 0 */}
                {balanceDue > 0 ? (
                  <tr className="border-t-2 border-red-600 bg-red-50/70">
                    <td colSpan={2} className="py-3 px-3 text-right font-black text-red-950 text-sm">
                      OUTSTANDING BALANCE DUE:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-lg font-black text-red-600">
                      ₹{balanceDue.toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                ) : (
                  <tr className="border-t-2 border-black bg-slate-50">
                    <td colSpan={2} className="py-2.5 px-3 text-right font-bold text-slate-900">
                      Outstanding Balance Due:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-base font-bold text-black">
                      ₹0.00 (Fully Settled)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Settlement Status Stamp & Authorized Signatory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="space-y-1.5">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
                Settlement Status
              </span>
              <div>
                {balanceDue > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded border-2 border-red-600 text-red-700 bg-red-50 font-black text-xs tracking-wide">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    BALANCE DUE — PENDING ADVANCE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded border-2 border-black text-black bg-slate-50 font-black text-xs tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    FULLY SETTLED &amp; CONFIRMED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                {balanceDue > 0
                  ? `Remaining balance of ₹${balanceDue.toLocaleString('en-IN')} is payable at the venue office before event start.`
                  : 'All dues for this event booking are settled in full.'}
              </p>
            </div>

            <div className="space-y-1 text-right flex flex-col justify-end">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block">
                Authorized Signatory
              </span>
              <div className="h-10 flex items-end justify-end">
                <div className="border-b border-black w-44 text-center pb-0.5 text-[10px] font-serif text-slate-700">
                  Manager / Authorized Sign
                </div>
              </div>
              <span className="text-[10px] text-slate-600 block font-semibold">
                H H Events &amp; Conventions Desk
              </span>
            </div>
          </div>

          {/* Compact Terms Footer (Guaranteed 1-Page Fit) */}
          <div className="border-t border-black/30 pt-2.5 text-[10px] text-slate-600 leading-normal">
            <p className="font-bold text-black uppercase tracking-wider text-[9px]">Important Guidelines:</p>
            <ul className="list-disc list-inside space-y-0.5 mt-0.5">
              <li>Please present this official receipt at the venue office for event entry clearance and hall handover.</li>
              <li>Standard day session: 10:00 AM – 3:00 PM. Evening session: 6:00 PM – 10:00 PM.</li>
              <li>For any booking questions or catering coordination, call {VENUE_INFO.primaryPhone}.</li>
            </ul>
          </div>
        </div>

        {/* Action Controls (Hidden on Print) */}
        <div className="flex items-center justify-between pt-1 no-print">
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
