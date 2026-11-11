import React from 'react';
import { BookingRequest } from '../../types';

export interface EventOrderReceiptProps {
  booking: BookingRequest;
  receiptNumber?: string;
  signatureUrl?: string;
  signatoryDesignation?: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

// Pure number to Indian English words converter (Crores, Lakhs, Thousands, Hundreds)
export function numberToWordsIndian(num: number): string {
  const rounded = Math.round(num);
  if (rounded === 0) return 'Zero Rupees only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  }

  let words = '';
  let n = rounded;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertLessThanThousand(remainder) + ' ';
  }

  return `${words.trim()} Rupees only`;
}

export const EventOrderReceipt: React.FC<EventOrderReceiptProps> = ({
  booking,
  receiptNumber,
  signatureUrl,
  signatoryDesignation = 'Authorized Signatory',
  containerRef,
  className = '',
}) => {
  if (!booking) return null;

  // Financial calculations
  const totalAmount = (booking as any).totalAmount !== undefined
    ? Number((booking as any).totalAmount)
    : (booking.totalEstimate || booking.estimatedAmount || 20000);
  const discountAmount = Number(booking.discountAmount) || 0;
  const extraCharge = Number(booking.extraCharge) || 0;
  const baseRent = Number(booking.originalAmount || booking.packagePrice) || (totalAmount + discountAmount - extraCharge);
  const netHallAmount = Math.max(0, baseRent - discountAmount);

  const amountPaid = (booking as any).amountPaid !== undefined
    ? Number((booking as any).amountPaid)
    : (booking.advancePaymentStatus === 'fully_paid'
      ? totalAmount
      : booking.advancePaymentStatus === 'advance_paid'
      ? Math.round(totalAmount * 0.25)
      : 0);
  const balanceDue = (booking as any).balanceDue !== undefined
    ? Number((booking as any).balanceDue)
    : Math.max(0, totalAmount - amountPaid);

  // Clean Order/Receipt reference number
  const rawIdNum = booking.id.replace(/\D/g, '');
  const orderNo = receiptNumber || rawIdNum.slice(-3) || rawIdNum.slice(-6) || '194';

  // Dates and session calculations
  const evDateRaw = booking.date || (booking as any).eventDate || '';
  let dayOfWeek = 'Friday';
  let evDateFormatted = '01-01-2027';
  let evDateSlashFormatted = '01/01/2027';
  let evDateShortHeader = '1-1-2027';

  if (evDateRaw) {
    const parts = evDateRaw.split('-');
    if (parts.length === 3) {
      evDateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
      evDateSlashFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      evDateShortHeader = `${parseInt(parts[2], 10)}-${parseInt(parts[1], 10)}-${parts[0]}`;
    }
    const dObj = new Date(`${evDateRaw}T00:00:00`);
    if (!isNaN(dObj.getTime())) {
      dayOfWeek = dObj.toLocaleDateString('en-IN', { weekday: 'long' });
    }
  }

  const bookedDateRaw = booking.submittedAt || new Date().toISOString();
  let bookedDateFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '-');
  if (bookedDateRaw) {
    const d = new Date(bookedDateRaw);
    if (!isNaN(d.getTime())) {
      bookedDateFormatted = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, '-');
    }
  }

  const sessionSlot = (booking.slot || (booking as any).timeSlot || 'day').toLowerCase();
  const sessionName = sessionSlot === 'evening' ? 'Night' : 'Day';

  // Discount percentage label if available
  let discountPercentageStr = '';
  if (discountAmount > 0 && baseRent > 0) {
    const pct = Math.round((discountAmount / baseRent) * 100);
    discountPercentageStr = `(${pct}%)`;
  }

  // Extra charge label
  const extraChargeLabel = booking.extraChargeReason?.trim()
    ? `Extra Charge — ${booking.extraChargeReason.trim()}`
    : 'Extra Charge';

  return (
    <div
      ref={containerRef as any}
      id="printable-receipt"
      className={`bg-white p-4 sm:p-7 border border-slate-300 rounded-sm shadow-xs print:border-none print:shadow-none print:p-0 select-text ${className}`}
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {/* Top Banner (Solid Blue with Venue Coordinates) */}
      <div className="bg-[#0082a6] text-white text-center py-3.5 px-4 sm:px-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-wide">
          H H Events &amp; Conventions
        </h1>
        <p className="text-[11.5px] sm:text-xs mt-0.5 opacity-95">Opposite Juma Masjid</p>
        <p className="text-[11.5px] sm:text-xs opacity-95">Akkarangadi, Panemangalore,</p>
        <p className="text-[11px] sm:text-[11.5px] opacity-95">
          Bantwal, Dakshina Kannada, Ph. no.: 9448151878 Email: hheventsconvention@gmail.com
        </p>
      </div>

      {/* Subheading: Event Order */}
      <div className="py-2.5 text-center">
        <h2 className="text-base sm:text-lg font-bold text-[#0082a6] tracking-wide uppercase">
          Event Order
        </h2>
      </div>

      {/* Order From & Order Details Box */}
      <div className="border border-[#0082a6] text-xs">
        {/* Header Strip */}
        <div className="grid grid-cols-2 bg-[#0082a6] text-white font-bold py-1 px-3 text-[11.5px]">
          <div>Order From</div>
          <div className="text-right">Order Details</div>
        </div>

        {/* Content Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 p-3 text-slate-800 leading-relaxed gap-2">
          <div>
            <div className="font-bold text-sm text-slate-900">
              {evDateShortHeader} {booking.customerName}
            </div>
            <div className="text-xs mt-1 text-slate-800">
              Contact No. : <strong className="font-mono text-slate-900">{booking.phone}</strong>
            </div>
            {booking.email && booking.email !== 'desk@hhevents.in' && (
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{booking.email}</div>
            )}
          </div>

          <div className="text-left sm:text-right space-y-0.5 text-xs">
            <div>Order No. : <strong className="font-mono text-slate-900">{orderNo}</strong></div>
            <div>Date : <span className="font-mono text-slate-800">{bookedDateFormatted}</span></div>
            <div>Due Date : <span className="font-mono text-slate-800">{evDateFormatted}</span></div>
            <div>Event day: <strong className="text-slate-900">{dayOfWeek} {sessionName}</strong></div>
            <div>Event Date: <span className="font-mono text-slate-800">{evDateSlashFormatted}</span></div>
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="border border-[#0082a6] border-t-0 text-xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0082a6] text-white text-[11px] font-bold">
              <th className="py-1 px-2 border-r border-[#0082a6]/40 text-center w-8">#</th>
              <th className="py-1 px-3 border-r border-[#0082a6]/40">Item name</th>
              <th className="py-1 px-2 border-r border-[#0082a6]/40 text-center w-16">Quantity</th>
              <th className="py-1 px-3 border-r border-[#0082a6]/40 text-right w-24">Price/ Unit</th>
              <th className="py-1 px-3 border-r border-[#0082a6]/40 text-right w-32">Discount</th>
              <th className="py-1 px-3 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
            <tr className="hover:bg-slate-50/50">
              <td className="py-2 px-2 border-r border-slate-200 text-center font-mono">1</td>
              <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                {booking.packageName || 'Single Hall + Single Dining Hall'}
              </td>
              <td className="py-2 px-2 border-r border-slate-200 text-center font-mono">1</td>
              <td className="py-2 px-3 border-r border-slate-200 text-right font-mono">
                ₹ {baseRent.toFixed(2)}
              </td>
              <td className="py-2 px-3 border-r border-slate-200 text-right font-mono text-emerald-800 font-semibold">
                {discountAmount > 0 ? (
                  <span>₹ {discountAmount.toFixed(2)} {discountPercentageStr}</span>
                ) : (
                  '₹ 0.00'
                )}
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                ₹ {netHallAmount.toFixed(2)}
              </td>
            </tr>

            {extraCharge > 0 && (
              <tr className="hover:bg-slate-50/50">
                <td className="py-2 px-2 border-r border-slate-200 text-center font-mono">2</td>
                <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                  {extraChargeLabel}
                </td>
                <td className="py-2 px-2 border-r border-slate-200 text-center font-mono">1</td>
                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono">
                  ₹ {extraCharge.toFixed(2)}
                </td>
                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono">
                  -
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                  ₹ {extraCharge.toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lower Grid (Left: Words, Description, Terms | Right: Amounts) */}
      <div className="grid grid-cols-1 md:grid-cols-12 border border-[#0082a6] border-t-0 text-xs">
        {/* Left Column (7 cols) */}
        <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-[#0082a6] flex flex-col justify-between">
          <div>
            {/* Order Amount In Words */}
            <div className="bg-[#0082a6] text-white font-bold py-1 px-3 text-[11px]">
              Order Amount In Words
            </div>
            <div className="p-2.5 text-xs text-slate-800 font-medium">
              {numberToWordsIndian(totalAmount)}
            </div>

            {/* Description */}
            <div className="bg-[#0082a6] text-white font-bold py-1 px-3 text-[11px]">
              Description
            </div>
            <div className="p-2.5 text-xs text-slate-800 font-medium">
              {evDateShortHeader} {dayOfWeek} {sessionName}
              {(booking as any).notes && (booking as any).notes !== `${dayOfWeek} ${sessionName}` && (
                <span className="block text-slate-600 mt-0.5">{(booking as any).notes}</span>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="bg-[#0082a6] text-white font-bold py-1 px-3 text-[11px]">
              Terms and Conditions
            </div>
            <div className="p-2.5 text-[11px] leading-relaxed text-slate-800 space-y-1.5">
              <p>
                <strong>1) Hall Timings (ಹಾಲ್ ಸಮಯಗಳು)</strong>
                <br />
                Morning - 10:00AM To 3:00PM ಬೆಳಿಗ್ಗೆ 10:00 ರಿಂದ ಮಧ್ಯಾಹ್ನ 3:00 ರವರೆಗೆ
                <br />
                Evening - 6:00 PM To 10:00PM ಸಂಜೆ 6:00 ರಿಂದ ರಾತ್ರಿ 10:00 ರವರೆಗೆ
              </p>
              <p>
                <strong>2) Advance Amount is non refundable. ಮುಂಗಡ ಮೊತ್ತವನ್ನು ಮರುಪಾವತಿಸಲಾಗುವುದಿಲ್ಲ.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols: Amounts & Signatory) */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div>
            <div className="bg-[#0082a6] text-white font-bold py-1 px-3 text-[11px]">
              Amounts
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-1.5 px-3 text-slate-700">Sub Total</td>
                  <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900">
                    ₹ {totalAmount.toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-slate-50/70 font-bold">
                  <td className="py-2 px-3 text-slate-900">Total</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900 text-sm">
                    ₹ {totalAmount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-slate-700">Advance</td>
                  <td className="py-1.5 px-3 text-right font-mono font-medium text-emerald-700">
                    ₹ {amountPaid.toFixed(2)}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2 px-3 text-slate-900">Balance</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900 text-sm">
                    ₹ {balanceDue.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Authorized Signatory Block (Bottom-Right) */}
          <div className="p-4 pt-6 text-center sm:text-right space-y-1">
            <div className="text-[11px] font-medium text-slate-700">
              For : H H Events &amp; Conventions
            </div>

            <div className="h-16 flex items-center justify-center sm:justify-end my-1">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Authorized Signatory"
                  className="max-h-14 max-w-[170px] object-contain"
                />
              ) : (
                <div className="w-36 h-12 border border-slate-300 border-dashed rounded flex items-center justify-center text-[10px] text-slate-400 italic">
                  (Signature Stamp)
                </div>
              )}
            </div>

            <div className="text-xs font-bold text-slate-900">
              {signatoryDesignation || 'Authorized Signatory'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
