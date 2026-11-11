import html2canvas from 'html2canvas';
import { BookingRequest } from '../types';

/**
 * Builds the official WhatsApp caption for the confirmed Event Order.
 */
export function buildEventOrderCaption(booking: BookingRequest): string {
  const isCompleted = (booking.status || '').toUpperCase() === 'COMPLETED';

  // For COMPLETED bookings, the caption is strictly the official Bill caption:
  if (isCompleted) {
    return `Thanks for doing business with us.
Regards,
H H Events & Conventions`;
  }

  const bObj = booking as any;
  const hostName = booking.customerName || bObj.applicantName || 'Sir/Madam';
  const paid = Number(bObj.amountPaid) || 0;
  const total = Number(bObj.totalAmount) || Number(booking.totalEstimate) || 0;
  const balance = Number(bObj.balanceDue) !== undefined && !isNaN(Number(bObj.balanceDue))
    ? Number(bObj.balanceDue)
    : Math.max(0, total - paid);

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

  const sessionSlot = (booking.slot || bObj.timeSlot || 'day').toLowerCase();
  const sessionName = sessionSlot === 'evening' ? 'Night' : 'Day';

  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://hhevents.vercel.app';
  const orderLink = `${origin}/order/${booking.id}`;

  return `Dear Customer (${hostName}),

Your event booking has been confirmed.

Please find your Event Order attached for your reference.

📋 Booking Ref: ${booking.id}
📅 Event Date: ${shortDate} ${dayOfWeek} (${sessionName} Session)
💰 Advance Received: ₹${paid > 0 ? Number(paid).toLocaleString('en-IN') : '0.00'}
💳 Balance Due: ₹${balance > 0 ? Number(balance).toLocaleString('en-IN') : '0.00'}

📄 View Order Online:
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
  element: HTMLElement,
  filename: string = 'HH-Event-Order.jpg'
): Promise<boolean> {
  try {
    const { jpgBlob } = await renderElementToBlobs(element);
    if (!jpgBlob) {
      // Fallback: try direct dataURL
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    const url = URL.createObjectURL(jpgBlob);
    const link = document.createElement('a');
    link.download = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch (err) {
    console.error('Download JPG failed:', err);
    return false;
  }
}

/**
 * Direct WhatsApp Event Order Image Sharing:
 *
 * 1. Generates the Event Order as an actual JPG image file and caption.
 * 2. Preferred Option A (Mobile & Supported Browsers):
 *    Uses Web Share API with files: [imageFile], passing both the real JPG file
 *    and the caption together to WhatsApp in one tap.
 * 3. Option B (Desktop / WhatsApp Web fallback):
 *    Copies the image to the OS clipboard (as image/png, browser standard),
 *    triggers an automatic JPG download to the computer, and launches the
 *    customer's WhatsApp chat with the caption. The user simply hits Ctrl+V
 *    in WhatsApp Web to attach the copied image and press Send!
 */
export async function shareEventOrderDirectly({
  booking,
  element,
  showToast,
}: {
  booking: BookingRequest;
  element?: HTMLElement | null;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
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
  const filename = isCompleted ? `HH-Bill-${booking.id}.jpg` : `HH-Event-Order-${booking.id}.jpg`;
  const docTypeLabel = isCompleted ? 'Bill' : 'Event Order';

  let jpgBlob: Blob | null = null;
  let pngBlob: Blob | null = null;

  if (element) {
    const blobs = await renderElementToBlobs(element);
    jpgBlob = blobs.jpgBlob;
    pngBlob = blobs.pngBlob;
  }

  // OPTION A: Web Share API with File
  // Native mobile browsers (Android Chrome, iOS Safari) and supported Windows desktop devices
  // allow sharing the real JPG file attachment directly into WhatsApp with the caption.
  if (jpgBlob) {
    const jpgFile = new File([jpgBlob], filename, { type: 'image/jpeg' });

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [jpgFile] })
    ) {
      try {
        await navigator.share({
          files: [jpgFile],
          title: `HH Events - ${docTypeLabel} (${booking.id})`,
          text: caption,
        });
        showToast?.(`${docTypeLabel} JPG shared to WhatsApp!`, 'success');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // User closed share picker without selecting
          return;
        }
        console.warn('Web Share API aborted or failed, using desktop fallback:', err);
      }
    }
  }

  // OPTION B: Desktop / WhatsApp Web Workflow
  // Browsers cannot programmatically inject files into WhatsApp Web URLs (wa.me only supports ?text=).
  // We execute the closest, highest-reliability direct attachment workflow:
  // 1. Copy the rendered image directly to OS clipboard as image/png.
  // 2. Automatically download the high-res JPG to the device.
  // 3. Open the customer's direct WhatsApp chat with the confirmed caption prefilled.
  // 4. In WhatsApp Web, pressing Ctrl+V immediately pastes & attaches the copied Event Order / Bill image!

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

  // Open WhatsApp chat directly to the customer's number
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(caption)}`;
  window.open(whatsappUrl, '_blank');

  if (copiedToClipboard) {
    showToast?.(
      `${docTypeLabel} JPG copied to clipboard & downloaded! In WhatsApp, press Ctrl+V to attach image and send.`,
      'success'
    );
  } else {
    showToast?.(
      `${docTypeLabel} JPG downloaded! Opening customer WhatsApp chat...`,
      'success'
    );
  }
}
