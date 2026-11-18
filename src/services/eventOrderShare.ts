import html2canvas from 'html2canvas';
import { BookingRequest } from '../types';
import { renderReceiptToBlob } from './receiptCanvasRenderer';
import { DEFAULT_AUTHORIZED_SIGNATURE } from './defaultSignature';

/**
 * Builds the comprehensive official WhatsApp message for the confirmed Event Order or completed Bill.
 * Includes complete customer, package, schedule, and financial breakdown (tariff, discount, extra charges, net total, advance, balance)
 * along with the online verification link.
 */
export function buildEventOrderCaption(booking: BookingRequest): string {
  const isCompleted = (booking.status || '').toUpperCase() === 'COMPLETED';
  const bObj = booking as any;
  const hostName = booking.customerName || bObj.applicantName || 'Customer';

  // Financial details
  const totalAmount =
    bObj.totalAmount !== undefined
      ? Number(bObj.totalAmount)
      : (booking.totalEstimate || booking.estimatedAmount || 0);
  const discountAmount = Number(bObj.discountAmount) || 0;
  const extraCharge = Number(bObj.extraCharge) || 0;
  const grossRent =
    Number(bObj.originalAmount || bObj.packagePrice) ||
    (discountAmount > 0 || extraCharge > 0 ? totalAmount + discountAmount - extraCharge : totalAmount);

  const amountPaid =
    bObj.amountPaid !== undefined
      ? Number(bObj.amountPaid)
      : booking.advancePaymentStatus === 'fully_paid'
      ? totalAmount
      : booking.advancePaymentStatus === 'advance_paid'
      ? Math.round(totalAmount * 0.25)
      : 0;

  const balanceDue =
    bObj.balanceDue !== undefined && !isNaN(Number(bObj.balanceDue))
      ? Number(bObj.balanceDue)
      : Math.max(0, totalAmount - amountPaid);

  // Package & Spaces
  const packageName = booking.packageName || bObj.packageTitle || 'Hall Reservation';
  const hallType = (booking.hall || bObj.hallSelection || 'both');
  const spaceLabel =
    hallType === 'both'
      ? 'Combined Campus (Full Hall)'
      : hallType === 'hall_2'
      ? 'Ladies Wing (Hall 2)'
      : 'Gents Wing (Hall 1)';

  // Event Date formatting
  const evDateRaw = booking.date || bObj.eventDate || '';
  let shortDate = '01-01-2027';
  let dayOfWeek = 'Friday';

  if (evDateRaw) {
    const parts = evDateRaw.split('-');
    if (parts.length === 3) {
      shortDate = `${parseInt(parts[2], 10)}-${parseInt(parts[1], 10)}-${parts[0]}`;
    }
    const dObj = new Date(`${evDateRaw}T00:00:00`);
    if (!isNaN(dObj.getTime())) {
      dayOfWeek = dObj.toLocaleDateString('en-IN', { weekday: 'long' });
    }
  }

  const rawSlot = (booking.slot || bObj.timeSlot || 'day').toLowerCase();
  const sessionLabel = rawSlot === 'evening' ? 'Evening Session (6PM–10PM)' : 'Day Session (10AM–3PM)';

  // Discount & Extra Charge lines
  let discountLine = '';
  if (discountAmount > 0) {
    const rawDisc = (bObj.discountReason || (bObj.couponCode?.startsWith('DIRECT-') ? bObj.couponCode.replace(/^DIRECT-/, '') : '') || '').trim();
    const reasonText = rawDisc && rawDisc.toLowerCase() !== 'special discount' ? ` (${rawDisc})` : '';
    discountLine = `\n🏷️ Special Discount: -₹${discountAmount.toLocaleString('en-IN')}${reasonText}`;
  }

  let extraChargeLine = '';
  if (extraCharge > 0) {
    const extraReason = (bObj.extraChargeReason || 'If AC Needed').trim();
    extraChargeLine = `\n⚡ Extra Charge: +₹${extraCharge.toLocaleString('en-IN')}${extraReason ? ` (${extraReason})` : ''}`;
  }

  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://hhevents.vercel.app';
  const orderLink = `${origin}/order/${booking.id}`;

  if (isCompleted) {
    return `Dear Customer (${hostName}),

Your event invoice bill has been generated.

Please find your Invoice Bill attached for your reference.

📋 Invoice Ref: ${booking.id}
🎪 Package: ${packageName} — ${spaceLabel}
📅 Event Date: ${shortDate} ${dayOfWeek} (${sessionLabel})
💰 Agreed Tariff / Package Price: ₹${grossRent.toLocaleString('en-IN')}${discountLine}${extraChargeLine}
💵 Total Bill Amount: ₹${totalAmount.toLocaleString('en-IN')}
👑 Total Paid: ₹${amountPaid.toLocaleString('en-IN')}
💳 Balance Due: ₹${balanceDue > 0 ? balanceDue.toLocaleString('en-IN') : '0.00 (Fully Settled)'}

📄 View / Download Tax Invoice Online:
${orderLink}

Thanks for doing business with us.
Regards,
H H Events & Conventions
Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal-574231
Ph: 9448151878`;
  }

  return `Dear Customer (${hostName}),

Your event booking has been confirmed.

Please find your Event Order attached for your reference.

📋 Booking Ref: ${booking.id}
🎪 Package: ${packageName} — ${spaceLabel}
📅 Event Date: ${shortDate} ${dayOfWeek} (${sessionLabel})
💰 Agreed Tariff / Package Price: ₹${grossRent.toLocaleString('en-IN')}${discountLine}${extraChargeLine}
💵 Net Payable Rent: ₹${totalAmount.toLocaleString('en-IN')}
👑 Advance Received: ₹${amountPaid.toLocaleString('en-IN')}
💳 Balance Due: ₹${balanceDue > 0 ? balanceDue.toLocaleString('en-IN') : '0.00 (Fully Settled)'}

📄 View / Verify Event Order Online:
${orderLink}

Regards,
H H Events & Conventions
Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal-574231
Ph: 9448151878`;
}

/**
 * Renders an HTMLElement to both JPG and PNG Blobs with high resolution and cross-origin handling.
 * - JPG Blob is used for standard file download and Web Share API file attachment.
 * - PNG Blob is used for HTML5 Clipboard API (browsers only accept image/png for clipboard write).
 */
export async function renderElementToBlobs(element: HTMLElement): Promise<{
  jpgBlob: Blob | null;
  pngBlob: Blob | null;
}> {
  try {
    // If element is freshly mounted or offscreen, wait briefly for layout
    if (element.clientHeight === 0) {
      await new Promise((r) => setTimeout(r, 150));
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc, clonedElement) => {
        if (clonedElement) {
          clonedElement.style.opacity = '1';
          clonedElement.style.visibility = 'visible';
          clonedElement.style.display = 'block';
        }
        const imgs = clonedDoc.getElementsByTagName('img');
        for (let i = 0; i < imgs.length; i++) {
          imgs[i].setAttribute('crossOrigin', 'anonymous');
        }
      },
    });

    const jpgBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });

    return { jpgBlob, pngBlob };
  } catch (err) {
    console.warn('html2canvas rendering error:', err);
    return { jpgBlob: null, pngBlob: null };
  }
}

/**
 * Backward-compatible helper for single JPG Blob rendering.
 */
export async function renderElementToJpgBlob(element: HTMLElement): Promise<Blob | null> {
  const { jpgBlob } = await renderElementToBlobs(element);
  return jpgBlob;
}

/**
 * Downloads a DOM element directly as a high-quality JPG image.
 */
export async function downloadReceiptAsJpg(
  element?: HTMLElement | null,
  filename: string = 'HH-Event-Order.jpg',
  booking?: BookingRequest,
  isBill?: boolean,
  signatureUrl?: string
): Promise<boolean> {
  try {
    if (booking) {
      const rendered = await renderReceiptToBlob(
        booking,
        isBill ?? (booking.status || '').toUpperCase() === 'COMPLETED',
        signatureUrl
      );
      const url = URL.createObjectURL(rendered.jpegBlob);
      const link = document.createElement('a');
      link.download = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return true;
    }

    if (element) {
      const { jpgBlob } = await renderElementToBlobs(element);
      if (jpgBlob) {
        const url = URL.createObjectURL(jpgBlob);
        const link = document.createElement('a');
        link.download = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Download JPG failed:', err);
    return false;
  }
}

/**
 * Direct WhatsApp Event Order & Bill Sharing:
 *
 * 1. Instantly launches customer WhatsApp chat to their phone number (https://wa.me/91XXXXXXXXXX)
 *    with the complete, comprehensive message prefilled (packages, tariff, discount, extra charges, totals, balance, link).
 * 2. Concurrently renders the exact Event Order or Bill JPG with authorized signature (in ~5-10ms)
 *    and immediately downloads it to the admin's device.
 * 3. Copies the image to system clipboard (as PNG) so the admin can simply press Ctrl+V in WhatsApp Web.
 */
export async function shareEventOrderDirectly({
  booking,
  element,
  showToast,
  signatureUrl,
}: {
  booking: BookingRequest;
  element?: HTMLElement | null;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  signatureUrl?: string;
}): Promise<void> {
  const cleanPhone = (booking.phone || (booking as any).applicantPhone || '')
    .replace(/\D/g, '')
    .slice(-10);

  if (!cleanPhone) {
    showToast?.('Customer phone number is missing or invalid.', 'error');
    return;
  }

  const isCompleted = (booking.status || '').toUpperCase() === 'COMPLETED';
  const caption = buildEventOrderCaption(booking);
  const docTypeLabel = isCompleted ? 'Invoice Bill' : 'Event Order';

  // 1. Instantly open customer's WhatsApp chat in a new tab without delay
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(caption)}`;
  window.open(whatsappUrl, '_blank');

  // 2. Concurrently render and trigger immediate JPG download to admin device
  const activeSig =
    (signatureUrl && signatureUrl.trim().length > 0 && signatureUrl !== '/authorized-signatory.png')
      ? signatureUrl
      : DEFAULT_AUTHORIZED_SIGNATURE;

  let jpgBlob: Blob | null = null;
  let pngBlob: Blob | null = null;
  let filename = isCompleted ? `HH-Bill-${booking.id}.jpg` : `HH-Event-Order-${booking.id}.jpg`;

  try {
    const rendered = await renderReceiptToBlob(booking, isCompleted, activeSig);
    jpgBlob = rendered.jpegBlob;
    pngBlob = rendered.pngBlob;
    filename = rendered.fileName;
  } catch (canvasErr) {
    console.warn('Canvas rendering fallback to html2canvas:', canvasErr);
    if (element) {
      const blobs = await renderElementToBlobs(element);
      jpgBlob = blobs.jpgBlob;
      pngBlob = blobs.pngBlob;
    }
  }

  // 3. Copy image directly to OS clipboard as image/png for instant Ctrl+V pasting in WhatsApp Web
  let copiedToClipboard = false;
  if (pngBlob && typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({ 'image/png': pngBlob }),
      ]);
      copiedToClipboard = true;
    } catch (clipErr) {
      console.warn('Clipboard write error:', clipErr);
    }
  }

  // 4. Trigger automatic download of the high-res JPG to the admin's device
  if (jpgBlob) {
    try {
      const url = URL.createObjectURL(jpgBlob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (dlErr) {
      console.warn('Auto download error:', dlErr);
    }
  }

  if (copiedToClipboard) {
    showToast?.(
      `${docTypeLabel} JPG downloaded & copied to clipboard! Opening WhatsApp chat...`,
      'success'
    );
  } else {
    showToast?.(
      `${docTypeLabel} JPG downloaded! Opening WhatsApp chat...`,
      'success'
    );
  }
}
