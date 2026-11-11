import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Printer,
  Download,
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { EventOrderReceipt } from '../../components/ui/EventOrderReceipt';
import { BookingRequest } from '../../types';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

interface PublicOrderPageProps {
  navigate: (path: string) => void;
}

export const PublicOrderPage: React.FC<PublicOrderPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Extract ID from path like /order/HH-2026-719798 or search param ?id=...
  const getInitialBookingId = () => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2 && (parts[0] === 'order' || parts[0] === 'receipt')) {
      return decodeURIComponent(parts[1]);
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('ref') || '';
  };

  const [bookingId] = useState<string>(getInitialBookingId);
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [signatoryDesignation, setSignatoryDesignation] = useState<string>('Authorized Signatory');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    // Load venue signature settings
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.signatorySignature) setSignatureUrl(data.signatorySignature);
        if (data?.signatoryName) setSignatoryDesignation(data.signatoryName);
      })
      .catch(() => {});

    if (!bookingId) {
      setErrorMessage('No booking reference provided. Please check your link.');
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // 1. Try public order endpoint
        const res = await fetch(`/api/orders/${encodeURIComponent(bookingId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.booking) {
            setBooking(data.booking);
            setIsLoading(false);
            return;
          }
        }

        // 2. Try tracking API
        const trackRes = await fetch(`/api/bookings/track?id=${encodeURIComponent(bookingId)}`);
        if (trackRes.ok) {
          const trackData = await trackRes.json();
          setBooking(trackData);
          setIsLoading(false);
          return;
        }

        // 3. Fallback to localStorage
        try {
          const localStr = localStorage.getItem('hh_bookings_v5');
          if (localStr) {
            const list = JSON.parse(localStr);
            const found = list.find((b: any) => (b.id || '').toUpperCase() === bookingId.toUpperCase());
            if (found) {
              setBooking(found);
              setIsLoading(false);
              return;
            }
          }
        } catch {}

        setErrorMessage(`Event Order "${bookingId}" could not be retrieved. Please verify reference or contact venue.`);
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to fetch Event Order. Please check internet connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [bookingId]);

  const handleDownloadImage = async () => {
    if (!receiptRef.current || !booking) return;
    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `HH-Event-Order-${booking.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Event Order image downloaded successfully!', 'success');
    } catch {
      showToast('Download failed. You can use Print / Save PDF instead.', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Navigation & Controls Bar (Hidden on Print) */}
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#173D35] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Venue Portal</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGeneratingImage || !booking}
              onClick={handleDownloadImage}
              leftIcon={<Download className="w-3.5 h-3.5 text-[#0082a6]" />}
              className="text-xs font-semibold"
            >
              Download Event Order (PNG)
            </Button>

            <Button
              type="button"
              variant="gold"
              size="sm"
              disabled={!booking}
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Print / Save PDF
            </Button>

            <a
              href="https://wa.me/919448151878?text=Hello%20HH%20Events%20team,%20I%20have%20an%20inquiry%20regarding%20my%20Event%20Order."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Venue</span>
            </a>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <div className="w-8 h-8 border-3 border-[#173D35] border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Loading Verified Event Order...</h3>
            <p className="text-xs text-slate-500 font-mono">Reference: {bookingId}</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-rose-200 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Event Order Lookup Notice</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{errorMessage}</p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/track-booking')}>
                Track with Mobile Number
              </Button>
            </div>
          </div>
        )}

        {/* Event Order Document Container */}
        {!isLoading && booking && (
          <div className="bg-white shadow-xl rounded-sm border border-slate-300 p-2 sm:p-6 overflow-hidden">
            <EventOrderReceipt
              booking={booking}
              signatureUrl={signatureUrl}
              signatoryDesignation={signatoryDesignation}
              containerRef={receiptRef}
            />
          </div>
        )}
      </div>
    </div>
  );
};

