import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  MessageSquare,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { BookingRequest } from '../../types';
import { EventOrderReceipt } from './EventOrderReceipt';
import { useToast } from '../../context/ToastContext';
import { buildEventOrderCaption } from '../../services/eventOrderShare';
import { DEFAULT_AUTHORIZED_SIGNATURE } from '../../services/defaultSignature';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRequest | null;
  autoOpenWhatsApp?: boolean;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  booking,
  autoOpenWhatsApp = true,
}) => {
  const { showToast } = useToast();
  const receiptContainerRef = useRef<HTMLDivElement>(null);

  const [isPreparing, setIsPreparing] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [hasCopiedImage, setHasCopiedImage] = useState(false);
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>(DEFAULT_AUTHORIZED_SIGNATURE);
  const [signatoryDesignation, setSignatoryDesignation] = useState<string>('Authorized Signatory');

  useEffect(() => {
    if (!isOpen) {
      setImageBlob(null);
      setImageUrl('');
      setHasCopiedImage(false);
      setHasCopiedText(false);
      return;
    }

    // Load signature settings
    try {
      const local = localStorage.getItem('hh_events_local_settings_v4');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.signatorySignature !== undefined && parsed.signatorySignature !== null) {
          setSignatureUrl(parsed.signatorySignature);
        }
        if (parsed.signatoryName) setSignatoryDesignation(parsed.signatoryName);
      }
    } catch {}

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.signatorySignature !== undefined && data?.signatorySignature !== null) {
          setSignatureUrl(data.signatorySignature);
        }
        if (data?.signatoryName) setSignatoryDesignation(data.signatoryName);
      })
      .catch(() => {});
  }, [isOpen]);

  // Clean phone and message builder
  const getCleanPhone = () => (booking?.phone || '').replace(/\D/g, '').slice(-10);

  const getEventDateInfo = () => {
    if (!booking) return { shortDate: '1-1-2027', dayOfWeek: 'Friday', sessionName: 'Day' };
    const bObj = booking as any;
    const evDateRaw = booking.date || bObj.eventDate || '';
    let shortDate = '1-1-2027';
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

    return { shortDate, dayOfWeek, sessionName };
  };

  const getWhatsAppMessageText = () => {
    if (!booking) return '';
    return buildEventOrderCaption(booking);
  };

  // Generate Image and handle automatic clipboard + download + WhatsApp launch
  useEffect(() => {
    if (!isOpen || !booking) return;

    let isMounted = true;
    setIsPreparing(true);

    const timer = setTimeout(async () => {
      try {
        if (!receiptContainerRef.current) {
          setIsPreparing(false);
          return;
        }

        const canvas = await html2canvas(receiptContainerRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000,
        });

        if (!isMounted) return;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setImageUrl(dataUrl);

        canvas.toBlob(async (blob) => {
          if (!blob || !isMounted) return;
          setImageBlob(blob);

          // Check if Web Share API supports file sharing
          try {
            const testFile = new File([blob], `HH-Event-Order-${booking.id}.jpg`, { type: 'image/jpeg' });
            if (navigator.canShare && navigator.canShare({ files: [testFile] })) {
              setCanNativeShare(true);
            }
          } catch {}

          // 1. Copy image directly to system clipboard for Ctrl+V in WhatsApp Web
          let copied = false;
          try {
            if (navigator.clipboard && window.ClipboardItem) {
              await navigator.clipboard.write([
                new window.ClipboardItem({ 'image/jpeg': blob }),
              ]);
              copied = true;
              setHasCopiedImage(true);
            }
          } catch {}

          // 2. Automatically download image file as backup
          try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `HH-Event-Order-${booking.id}.jpg`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          } catch {}

          // 3. Open WhatsApp Web chat with prefilled message
          if (autoOpenWhatsApp) {
            const phone = getCleanPhone();
            if (phone) {
              const text = encodeURIComponent(getWhatsAppMessageText());
              window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
            }
          }

          if (copied) {
            showToast('Event Order copied to clipboard! In WhatsApp, press Ctrl+V to attach.', 'success');
          } else {
            showToast('Event Order downloaded! In WhatsApp, attach the downloaded image.', 'success');
          }
        }, 'image/png');
      } catch (err) {
        console.error('Failed to generate Event Order image:', err);
        showToast('Unable to capture Event Order image automatically.', 'error');
      } finally {
        if (isMounted) setIsPreparing(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, booking?.id]);

  const handleCopyImage = async () => {
    if (!imageBlob) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': imageBlob }),
        ]);
        setHasCopiedImage(true);
        showToast('Event Order image copied to clipboard! Press Ctrl+V in WhatsApp.', 'success');
      }
    } catch {
      showToast('Clipboard copy failed. Please use Download button.', 'error');
    }
  };

  const handleCopyText = async () => {
    const text = getWhatsAppMessageText();
    try {
      await navigator.clipboard.writeText(text);
      setHasCopiedText(true);
      showToast('WhatsApp message text copied!', 'success');
    } catch {}
  };

  const handleDownloadImage = () => {
    if (!imageUrl || !booking) return;
    const link = document.createElement('a');
    link.download = `HH-Event-Order-${booking.id}.jpg`;
    link.href = imageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Event Order JPG downloaded successfully.', 'success');
  };

  const handleOpenWhatsApp = () => {
    const phone = getCleanPhone();
    if (!phone) {
      showToast('Customer phone number not available.', 'error');
      return;
    }
    const text = encodeURIComponent(getWhatsAppMessageText());
    window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (!imageBlob || !booking) return;
    try {
      const file = new File([imageBlob], `HH-Event-Order-${booking.id}.png`, { type: 'image/png' });
      await navigator.share({
        files: [file],
        text: getWhatsAppMessageText(),
        title: `Event Order - ${booking.id}`,
      });
      showToast('Shared successfully!', 'success');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showToast('Native share failed. Please open WhatsApp Web.', 'error');
      }
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Share Event Order via WhatsApp" maxWidth="2xl">
      <div className="space-y-4 text-slate-900">
        {/* Status Callout Banner */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <span className="p-1 rounded-full bg-emerald-600 text-white mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </span>
            <div className="text-xs">
              <div className="font-bold text-emerald-900 text-sm">
                Event Order Image Copied &amp; Ready for WhatsApp!
              </div>
              <p className="text-emerald-800 mt-0.5">
                In your WhatsApp chat, simply press <kbd className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded font-mono font-bold text-emerald-900">Ctrl + V</kbd> (or Right-Click &rarr; Paste) to attach the Event Order image alongside the message.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open WhatsApp Chat</span>
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyImage}
              leftIcon={hasCopiedImage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              {hasCopiedImage ? 'Image Copied to Clipboard!' : 'Copy Image to Clipboard'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              leftIcon={<Download className="w-3.5 h-3.5 text-[#0082a6]" />}
              className="text-xs font-semibold"
            >
              Download PNG
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              leftIcon={hasCopiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              {hasCopiedText ? 'Message Copied!' : 'Copy Text'}
            </Button>
          </div>

          {canNativeShare && (
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={handleNativeShare}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Direct Share (Mobile/App)
            </Button>
          )}
        </div>

        {/* Message Preview Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>WhatsApp Message Preview</span>
            <span className="font-mono text-emerald-700 font-bold lowercase">wa.me/91{getCleanPhone()}</span>
          </div>
          <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200 max-h-36 overflow-y-auto">
            {getWhatsAppMessageText()}
          </pre>
        </div>

        {/* Hidden or preview container for html2canvas */}
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto bg-slate-100 p-2 sm:p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            {isPreparing ? 'Generating High-Resolution Event Order Image...' : 'Event Order Visual Preview'}
          </div>

          <div className="bg-white shadow-md mx-auto max-w-xl">
            <EventOrderReceipt
              booking={booking}
              signatureUrl={signatureUrl}
              signatoryDesignation={signatoryDesignation}
              containerRef={receiptContainerRef}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-[11px] text-slate-500">
            Booking ID: <strong className="font-mono text-slate-700">{booking.id}</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleOpenWhatsApp}
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            >
              Open WhatsApp Now
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

