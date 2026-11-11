import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, MessageSquare, Check, Copy } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { BookingRequest } from '../../types';
import { VENUE_INFO } from '../../services/hallData';
import { useToast } from '../../context/ToastContext';
import { EventOrderReceipt } from './EventOrderReceipt';
import { downloadReceiptAsJpg, shareEventOrderDirectly } from '../../services/eventOrderShare';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest;
  receiptNumber?: string;
}

// Pure number to Indian English words converter (Crores, Lakhs, Thousands, Hundreds)
function numberToWordsIndian(num: number): string {
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

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  booking,
  receiptNumber,
}) => {
  const { showToast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [signatoryDesignation, setSignatoryDesignation] = useState<string>('Authorized Signatory');

  useEffect(() => {
    // Load authorized signature from local storage or server settings
    try {
      const local = localStorage.getItem('hh_events_local_settings_v4');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.signatorySignature) setSignatureUrl(parsed.signatorySignature);
        if (parsed.signatoryName) setSignatoryDesignation(parsed.signatoryName);
      }
    } catch {}

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.signatorySignature) setSignatureUrl(data.signatorySignature);
        if (data?.signatoryName) setSignatoryDesignation(data.signatoryName);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen || !booking) return null;

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

  // WhatsApp message generator
  const getWhatsAppMessage = () => {
    const hostName = booking.customerName || (booking as any).applicantName || 'Sir/Madam';
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://hhevents.vercel.app';
    const orderLink = `${origin}/order/${booking.id}`;

    return `Hello ${hostName}, this is regarding your event booking request (${booking.id}) at H H Events & Conventions.

Your Hall Booking Is Confirmed

Event Date : ${evDateShortHeader} ${dayOfWeek} ${sessionName} 

Advance Recieved ${amountPaid > 0 ? amountPaid.toFixed(2) : '0.00'} 

📄 Official Event Order (Invoice):
${orderLink}

Regards,
H H Events & Conventions 
Opposite Juma Masjid, Akkarangadi,
Panemangalore, Bantwal-574231
Ph:9448151878`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingImage(true);
    try {
      const ok = await downloadReceiptAsJpg(
        receiptRef.current,
        `HH-Event-Order-${orderNo}.jpg`
      );
      if (ok) {
        showToast('Event Order JPG downloaded successfully!', 'success');
      } else {
        showToast('Download could not complete. You can use Print / Save PDF instead.', 'info');
      }
    } catch {
      showToast('Download could not complete. You can use Print / Save PDF instead.', 'info');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareWhatsApp = async () => {
    setIsGeneratingImage(true);
    try {
      await shareEventOrderDirectly({
        booking,
        element: receiptRef.current,
        showToast,
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Event Order Invoice" maxWidth="2xl">
      <div className="space-y-4 text-slate-900">
        <EventOrderReceipt
          booking={booking}
          receiptNumber={receiptNumber}
          signatureUrl={signatureUrl}
          signatoryDesignation={signatoryDesignation}
          containerRef={receiptRef}
        />

        {/* Action Controls (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 no-print border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Close
          </Button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGeneratingImage}
              onClick={handleDownloadImage}
              leftIcon={<Download className="w-3.5 h-3.5 text-[#0082a6]" />}
              className="cursor-pointer text-xs font-semibold"
            >
              {isGeneratingImage ? 'Downloading...' : 'Download Image (JPG)'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5 text-slate-700" />}
              className="cursor-pointer text-xs font-semibold"
            >
              Print / Save PDF
            </Button>

            <button
              type="button"
              disabled={isGeneratingImage}
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isGeneratingImage ? 'Sharing...' : 'Share on WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
