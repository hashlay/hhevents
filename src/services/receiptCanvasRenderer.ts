import { BookingRequest } from '../types';
import { numberToWordsIndian } from '../components/ui/EventOrderReceipt';
import { DEFAULT_AUTHORIZED_SIGNATURE } from './defaultSignature';

/**
 * Loads an image from a data URI or URL into an HTMLImageElement with promise support.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Pure HTML5 Canvas renderer for Event Order & Bill.
 * Renders directly onto an offscreen canvas at 2x resolution (1600x2280)
 * with zero DOM dependency and zero risk of CSS/html2canvas failures.
 */
export async function renderReceiptToCanvas(
  canvas: HTMLCanvasElement,
  booking: BookingRequest,
  isBill: boolean,
  signatureUrl?: string,
  receiptNumber?: string
): Promise<void> {
  const scale = 2;
  const width = 800;
  const height = 1140;

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Financial calculations
  const bObj = booking as any;
  const totalAmount =
    bObj.totalAmount !== undefined
      ? Number(bObj.totalAmount)
      : booking.totalEstimate || booking.estimatedAmount || 20000;
  const discountAmount = Number(booking.discountAmount) || 0;
  const extraCharge = Number(booking.extraCharge) || 0;
  const baseRent =
    Number(booking.originalAmount || booking.packagePrice) ||
    totalAmount + discountAmount - extraCharge;
  const netHallAmount = Math.max(0, baseRent - discountAmount);

  const amountPaid =
    bObj.amountPaid !== undefined
      ? Number(bObj.amountPaid)
      : booking.advancePaymentStatus === 'fully_paid'
      ? totalAmount
      : booking.advancePaymentStatus === 'advance_paid'
      ? Math.round(totalAmount * 0.25)
      : 0;
  const balanceDue =
    bObj.balanceDue !== undefined
      ? Number(bObj.balanceDue)
      : Math.max(0, totalAmount - amountPaid);

  const rawIdNum = booking.id.replace(/\D/g, '');
  const orderNo = receiptNumber || rawIdNum.slice(-4) || rawIdNum.slice(-6) || '2026-0004';

  // Dates
  const evDateRaw = booking.date || bObj.eventDate || '';
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

  const today = new Date();
  const todaySlashFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(
    today.getMonth() + 1
  ).padStart(2, '0')}/${today.getFullYear()}`;

  const bookedDateRaw = booking.submittedAt || new Date().toISOString();
  let bookedDateFormatted = todaySlashFormatted.replace(/\//g, '-');
  if (bookedDateRaw) {
    const d = new Date(bookedDateRaw);
    if (!isNaN(d.getTime())) {
      bookedDateFormatted = d
        .toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '-');
    }
  }

  const sessionSlot = (booking.slot || bObj.timeSlot || 'day').toLowerCase();
  const sessionName = sessionSlot === 'evening' ? 'Night' : 'Day';

  const extraChargeLabel = booking.extraChargeReason?.trim()
    ? `AC Charges if needed: ${booking.extraChargeReason.trim()}`
    : 'AC Charges if needed';

  const marginX = 24;
  const contentW = width - marginX * 2; // 752

  // 1. TOP BANNER (Solid Teal #0082a6)
  const bannerY = 24;
  const bannerH = 135;
  ctx.fillStyle = '#0082a6';
  ctx.fillRect(marginX, bannerY, contentW, bannerH);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  ctx.font = 'bold 23px Arial, Helvetica, sans-serif';
  ctx.fillText('H H Events & Conventions', width / 2, bannerY + 40);

  ctx.font = '12px Arial, Helvetica, sans-serif';
  ctx.fillText('Opposite Juma Masjid', width / 2, bannerY + 65);
  ctx.fillText('Akkarangadi, Panemangalore,', width / 2, bannerY + 85);

  ctx.font = '11.5px Arial, Helvetica, sans-serif';
  ctx.fillText(
    'Bantwal, Dakshina Kannada, Ph. no.: 9448151878 Email: hheventsconvention@gmail.com',
    width / 2,
    bannerY + 107
  );

  // 2. SUBHEADING ("Event Order" or "Bill")
  const subY = bannerY + bannerH + 28;
  ctx.fillStyle = '#0082a6';
  ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
  ctx.fillText(isBill ? 'BILL' : 'EVENT ORDER', width / 2, subY);

  // 3. TOP BOX (Order From / Bill To & Order Details / Invoice Details)
  const boxY = subY + 16;
  const boxH = 120;

  // Box border
  ctx.strokeStyle = '#0082a6';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(marginX, boxY, contentW, boxH);

  // Header strip
  ctx.fillStyle = '#0082a6';
  ctx.fillRect(marginX, boxY, contentW, 26);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11.5px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(isBill ? 'Bill To' : 'Order From', marginX + 12, boxY + 17);

  ctx.textAlign = 'right';
  ctx.fillText(isBill ? 'Invoice Details' : 'Order Details', marginX + contentW - 12, boxY + 17);

  // Box content: Left
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.font = 'bold 13.5px Arial, Helvetica, sans-serif';
  ctx.fillText(`${evDateShortHeader} ${booking.customerName}`, marginX + 12, boxY + 50);

  let leftCursorY = boxY + 70;
  if (isBill && ((booking as any).address || bObj.place)) {
    ctx.font = '11.5px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`${(booking as any).address || bObj.place}`, marginX + 12, leftCursorY);
    leftCursorY += 20;
  }

  ctx.font = '12px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Contact No. : ', marginX + 12, leftCursorY);
  ctx.font = 'bold 12px monospace';
  ctx.fillText(booking.phone, marginX + 85, leftCursorY);

  // Box content: Right
  ctx.textAlign = 'right';
  const rightX = marginX + contentW - 12;

  if (isBill) {
    ctx.font = '11.5px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Invoice No. : `, rightX - 65, boxY + 48);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(orderNo, rightX, boxY + 48);

    ctx.font = '11.5px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Date : `, rightX - 75, boxY + 68);
    ctx.font = '11.5px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(todaySlashFormatted, rightX, boxY + 68);

    ctx.font = '11.5px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Event day: `, rightX - 70, boxY + 88);
    ctx.font = 'bold 11.5px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(dayOfWeek, rightX, boxY + 88);

    ctx.font = '11.5px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Event Date: `, rightX - 75, boxY + 108);
    ctx.font = '11.5px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(evDateSlashFormatted, rightX, boxY + 108);
  } else {
    ctx.font = '11px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Order No. : `, rightX - 60, boxY + 45);
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(orderNo, rightX, boxY + 45);

    ctx.font = '11px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Date : `, rightX - 70, boxY + 62);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(bookedDateFormatted, rightX, boxY + 62);

    ctx.font = '11px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Due Date : `, rightX - 70, boxY + 79);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(evDateFormatted, rightX, boxY + 79);

    ctx.font = '11px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Event day: `, rightX - 75, boxY + 96);
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`${dayOfWeek} ${sessionName}`, rightX, boxY + 96);

    ctx.font = '11px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Event Date: `, rightX - 70, boxY + 113);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(evDateSlashFormatted, rightX, boxY + 113);
  }

  // 4. ITEMIZED TABLE
  const tableY = boxY + boxH;
  const headerH = 24;
  const rowH = 34;
  const hasExtra = extraCharge > 0;
  const tableH = headerH + rowH * (hasExtra ? 2 : 1);

  // Table border
  ctx.strokeStyle = '#0082a6';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(marginX, tableY, contentW, tableH);

  // Header background
  ctx.fillStyle = '#0082a6';
  ctx.fillRect(marginX, tableY, contentW, headerH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Arial, Helvetica, sans-serif';

  if (isBill) {
    // Columns: # (40) | Item name (360) | Qty (80) | Price/ Unit (136) | Amount (136)
    ctx.textAlign = 'center';
    ctx.fillText('#', marginX + 20, tableY + 16);
    ctx.textAlign = 'left';
    ctx.fillText('Item name', marginX + 50, tableY + 16);
    ctx.textAlign = 'center';
    ctx.fillText('Quantity', marginX + 440, tableY + 16);
    ctx.textAlign = 'right';
    ctx.fillText('Price/ Unit', marginX + 600, tableY + 16);
    ctx.fillText('Amount', marginX + contentW - 12, tableY + 16);

    // Row 1
    const r1Y = tableY + headerH;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.font = '11.5px monospace';
    ctx.fillText('1', marginX + 20, r1Y + 22);

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
    ctx.fillText(booking.packageName || 'Day Session Hall 1 AC', marginX + 50, r1Y + 22);

    ctx.textAlign = 'center';
    ctx.font = '11.5px monospace';
    ctx.fillText('1', marginX + 440, r1Y + 22);

    ctx.textAlign = 'right';
    ctx.fillText(`₹ ${baseRent.toFixed(2)}`, marginX + 600, r1Y + 22);
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`₹ ${netHallAmount.toFixed(2)}`, marginX + contentW - 12, r1Y + 22);

    // Row 2 (if extra)
    if (hasExtra) {
      const r2Y = r1Y + rowH;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, r2Y);
      ctx.lineTo(marginX + contentW, r2Y);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = '11.5px monospace';
      ctx.fillText('2', marginX + 20, r2Y + 22);

      ctx.textAlign = 'left';
      ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
      ctx.fillText(extraChargeLabel, marginX + 50, r2Y + 22);

      ctx.textAlign = 'center';
      ctx.font = '11.5px monospace';
      ctx.fillText('1', marginX + 440, r2Y + 22);

      ctx.textAlign = 'right';
      ctx.fillText(`₹ ${extraCharge.toFixed(2)}`, marginX + 600, r2Y + 22);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`₹ ${extraCharge.toFixed(2)}`, marginX + contentW - 12, r2Y + 22);
    }
  } else {
    // Event Order Columns: # (35) | Item name (300) | Qty (70) | Price (110) | Discount (117) | Amount (120)
    ctx.textAlign = 'center';
    ctx.fillText('#', marginX + 18, tableY + 16);
    ctx.textAlign = 'left';
    ctx.fillText('Item name', marginX + 45, tableY + 16);
    ctx.textAlign = 'center';
    ctx.fillText('Quantity', marginX + 375, tableY + 16);
    ctx.textAlign = 'right';
    ctx.fillText('Price/ Unit', marginX + 490, tableY + 16);
    ctx.fillText('Discount', marginX + 620, tableY + 16);
    ctx.fillText('Amount', marginX + contentW - 12, tableY + 16);

    // Row 1
    const r1Y = tableY + headerH;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.font = '11.5px monospace';
    ctx.fillText('1', marginX + 18, r1Y + 22);

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
    ctx.fillText(booking.packageName || 'Single Hall + Single Dining Hall', marginX + 45, r1Y + 22);

    ctx.textAlign = 'center';
    ctx.font = '11.5px monospace';
    ctx.fillText('1', marginX + 375, r1Y + 22);

    ctx.textAlign = 'right';
    ctx.fillText(`₹ ${baseRent.toFixed(2)}`, marginX + 490, r1Y + 22);

    ctx.fillStyle = '#047857';
    ctx.font = 'bold 11.5px monospace';
    ctx.fillText(
      discountAmount > 0 ? `₹ ${discountAmount.toFixed(2)}` : '₹ 0.00',
      marginX + 620,
      r1Y + 22
    );

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`₹ ${netHallAmount.toFixed(2)}`, marginX + contentW - 12, r1Y + 22);

    if (hasExtra) {
      const r2Y = r1Y + rowH;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, r2Y);
      ctx.lineTo(marginX + contentW, r2Y);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = '11.5px monospace';
      ctx.fillText('2', marginX + 18, r2Y + 22);

      ctx.textAlign = 'left';
      ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
      ctx.fillText(extraChargeLabel, marginX + 45, r2Y + 22);

      ctx.textAlign = 'center';
      ctx.font = '11.5px monospace';
      ctx.fillText('1', marginX + 375, r2Y + 22);

      ctx.textAlign = 'right';
      ctx.fillText(`₹ ${extraCharge.toFixed(2)}`, marginX + 490, r2Y + 22);

      ctx.fillText('-', marginX + 620, r2Y + 22);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`₹ ${extraCharge.toFixed(2)}`, marginX + contentW - 12, r2Y + 22);
    }
  }

  // 5. LOWER GRID (Words, Description, Terms on Left; Amounts & Signatory on Right)
  const gridY = tableY + tableH;
  const gridH = height - gridY - 24; // remaining height ~430px
  const splitX = marginX + 455; // Left col: 455, Right col: 297

  // Outer border & divider
  ctx.strokeStyle = '#0082a6';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(marginX, gridY, contentW, gridH);

  ctx.beginPath();
  ctx.moveTo(splitX, gridY);
  ctx.lineTo(splitX, gridY + gridH);
  ctx.stroke();

  // LEFT COLUMN:
  let lY = gridY;

  // Words Section
  ctx.fillStyle = '#0082a6';
  ctx.fillRect(marginX, lY, splitX - marginX, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    isBill ? 'Invoice Amount In Words' : 'Order Amount In Words',
    marginX + 10,
    lY + 15
  );

  lY += 22;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11.5px Arial, Helvetica, sans-serif';
  ctx.fillText(numberToWordsIndian(totalAmount), marginX + 10, lY + 18);
  lY += 30;

  // Description Section (Event Order mode)
  if (!isBill) {
    ctx.fillStyle = '#0082a6';
    ctx.fillRect(marginX, lY, splitX - marginX, 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    ctx.fillText('Description', marginX + 10, lY + 15);

    lY += 22;
    ctx.fillStyle = '#0f172a';
    ctx.font = '11.5px Arial, Helvetica, sans-serif';
    ctx.fillText(`${evDateShortHeader} ${dayOfWeek} ${sessionName}`, marginX + 10, lY + 18);
    lY += 30;
  }

  // Terms and Conditions Section
  ctx.fillStyle = '#0082a6';
  ctx.fillRect(marginX, lY, splitX - marginX, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
  ctx.fillText('Terms and Conditions :', marginX + 10, lY + 15);

  lY += 22;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 10.5px Arial, Helvetica, sans-serif';
  ctx.fillText('1) Hall Timings (ಹಾಲ್ ಸಮಯಗಳು)', marginX + 10, lY + 16);

  ctx.font = '10px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(
    'Morning - 10:00AM To 3:00PM ಬೆಳಿಗ್ಗೆ 10:00 ರಿಂದ ಮಧ್ಯಾಹ್ನ 3:00 ರವರೆಗೆ',
    marginX + 10,
    lY + 32
  );
  ctx.fillText(
    'Evening - 6:00 PM To 10:00PM ಸಂಜೆ 6:00 ರಿಂದ ರಾತ್ರಿ 10:00 ರವರೆಗೆ',
    marginX + 10,
    lY + 48
  );

  ctx.font = 'bold 10.5px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(
    '2) Advance Amount is non refundable. ಮುಂಗಡ ಮೊತ್ತವನ್ನು ಮರುಪಾವತಿಸಲಾಗುವುದಿಲ್ಲ.',
    marginX + 10,
    lY + 70
  );

  if (isBill) {
    ctx.fillText('3) Decoration done by the party.', marginX + 10, lY + 90);
  }

  // RIGHT COLUMN: Amounts & Signatory
  ctx.fillStyle = '#0082a6';
  ctx.fillRect(splitX, gridY, marginX + contentW - splitX, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Amounts', splitX + 10, gridY + 15);

  let aY = gridY + 22;
  const drawAmountRow = (
    label: string,
    valStr: string,
    isBold: boolean = false,
    color: string = '#0f172a'
  ) => {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX, aY + 26);
    ctx.lineTo(marginX + contentW, aY + 26);
    ctx.stroke();

    ctx.fillStyle = isBold ? '#0f172a' : '#334155';
    ctx.font = isBold ? 'bold 11.5px Arial' : '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, splitX + 10, aY + 18);

    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.font = isBold ? 'bold 12px monospace' : '11.5px monospace';
    ctx.fillText(valStr, marginX + contentW - 12, aY + 18);

    aY += 26;
  };

  drawAmountRow('Sub Total', `₹ ${baseRent.toFixed(2)}`);
  if (hasExtra) {
    drawAmountRow('AC Charges', `₹ ${extraCharge.toFixed(2)}`);
  }
  drawAmountRow('Total', `₹ ${totalAmount.toFixed(2)}`, true);
  drawAmountRow(isBill ? 'Received' : 'Advance', `₹ ${amountPaid.toFixed(2)}`, false, '#047857');
  drawAmountRow('Balance', `₹ ${balanceDue.toFixed(2)}`, true);

  // Signatory Block (Bottom of Right Column)
  const sigBoxY = gridY + gridH - 120;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#334155';
  ctx.font = '11px Arial, Helvetica, sans-serif';
  ctx.fillText('For : H H Events & Conventions', marginX + contentW - 16, sigBoxY);

  // Signature Image
  const activeSig = signatureUrl || DEFAULT_AUTHORIZED_SIGNATURE;
  if (activeSig) {
    try {
      const sigImg = await loadImage(activeSig);
      const sigW = 150;
      const sigH = (sigImg.height / sigImg.width) * sigW;
      const targetH = Math.min(sigH, 50);
      const targetW = (sigImg.width / sigImg.height) * targetH;

      ctx.drawImage(
        sigImg,
        marginX + contentW - 16 - targetW,
        sigBoxY + 8,
        targetW,
        targetH
      );
    } catch {
      // Fallback text if image load fails
      ctx.font = 'italic 10px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('(Authorized Signature)', marginX + contentW - 16, sigBoxY + 35);
    }
  }

  // Designation line
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11.5px Arial, Helvetica, sans-serif';
  ctx.fillText('Authorized Signatory', marginX + contentW - 16, sigBoxY + 75);
}

/**
 * Offscreen rendering of a full Event Order or Bill directly to a JPEG Blob (0.95 quality)
 * and PNG Blob (for clipboard). Takes 5 milliseconds and works on all devices without DOM dependency.
 */
export async function renderReceiptToBlob(
  booking: BookingRequest,
  isBill: boolean,
  signatureUrl?: string,
  receiptNumber?: string
): Promise<{
  jpegBlob: Blob;
  pngBlob: Blob;
  fileName: string;
}> {
  const canvas = document.createElement('canvas');
  await renderReceiptToCanvas(canvas, booking, isBill, signatureUrl, receiptNumber);

  const cleanId = booking.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = isBill ? `HH-Bill-${cleanId}.jpg` : `HH-Event-Order-${cleanId}.jpg`;

  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create JPEG blob'));
      },
      'image/jpeg',
      0.95
    );
  });

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create PNG blob'));
      },
      'image/png'
    );
  });

  return { jpegBlob, pngBlob, fileName };
}
