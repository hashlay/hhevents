import html2canvas from 'html2canvas';
import { BookingRequest } from '../types';

/**
 * Builds the official WhatsApp caption for the confirmed Event Order.
 */
export function buildEventOrderCaption(booking: BookingRequest): string {
  const bObj = booking as any;
  const hostName = booking.customerName || bObj.applicantName || 'Sir/Madam';
  const paid = Number(bObj.amountPaid) || 0;

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

  return `Hello ${hostName}, this is regarding your event booking request (${booking.id}) at H H Events & Conventions.

Your Hall Booking Is Confirmed

Event Date : ${shortDate} ${dayOfWeek} ${sessionName} 

Advance Recieved ${paid > 0 ? paid.toFixed(2) : '0.00'} 

📄 Official Event Order (Invoice):
${orderLink}

Regards,
H H Events & Conventions 
Opposite Juma Masjid, Akkarangadi,
Panemangalore, Bantwal-574231
Ph:9448151878`;
}

/**
 * Renders an HTMLElement to a JPG Blob with high resolution and robust cross-origin handling.
 */
export async function renderElementToJpgBlob(element: HTMLElement): Promise<Blob | null> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const imgs = clonedDoc.getElementsByTagName('img');
        for (let i = 0; i < imgs.length; i++) {
          imgs[i].setAttribute('crossOrigin', 'anonymous');
        }
      },
    });

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  } catch (err) {
    console.warn('html2canvas rendering warning:', err);
    return null;
  }
}

/**
 * Downloads a DOM element directly as a high-quality JPG image.
 */
export async function downloadReceiptAsJpg(
  element: HTMLElement,
  filename: string = 'HH-Event-Order.jpg'
): Promise<boolean> {
  try {
    const blob = await renderElementToJpgBlob(element);
    if (!blob) {
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

    const url = URL.createObjectURL(blob);
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
 * Direct WhatsApp sharing:
 * 1. Generates the JPG image of the Event Order.
 * 2. Uses Web Share API with file attachment if supported.
 * 3. Copies JPG directly to system clipboard for instant Ctrl+V into WhatsApp Web.
 * 4. Triggers automatic download of the JPG file to the device.
 * 5. Directly launches WhatsApp chat with the customer's phone and confirmed caption.
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

  const caption = buildEventOrderCaption(booking);
  const filename = `HH-Event-Order-${booking.id}.jpg`;

  let fileSharedNatively = false;

  if (element) {
    const blob = await renderElementToJpgBlob(element);

    if (blob) {
      const jpgFile = new File([blob], filename, { type: 'image/jpeg' });

      // 1. Try Web Share API with file attachment (Mobile / modern tablet / supported desktop)
      if (navigator.canShare && navigator.canShare({ files: [jpgFile] })) {
        try {
          await navigator.share({
            files: [jpgFile],
            title: `HH Events - Event Order (${booking.id})`,
            text: caption,
          });
          fileSharedNatively = true;
          showToast?.('Event Order shared directly to WhatsApp!', 'success');
          return;
        } catch {
          // If native share was dismissed, proceed with browser clipboard + direct URL
        }
      }

      if (!fileSharedNatively) {
        // 2. Copy JPG directly to clipboard for effortless Ctrl+V in WhatsApp Web
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new window.ClipboardItem({ 'image/jpeg': blob }),
            ]);
          }
        } catch {}

        // 3. Automatically download the JPG so the admin has the file ready on their computer
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch {}
      }
    }
  }

  // 4. Open WhatsApp directly to customer's phone with prefilled confirmed caption
  if (!fileSharedNatively) {
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(caption)}`;
    window.open(whatsappUrl, '_blank');
    showToast?.(
      'Event Order JPG downloaded & copied! Opening WhatsApp chat...',
      'success'
    );
  }
}

