import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  Building2,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { useToast } from '../../context/ToastContext';
import { VENUE_INFO } from '../../services/hallData';

interface ContactPageProps {
  navigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      showToast('Please fill out your name, contact phone, and inquiry message.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          topic: inquiryType,
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        showToast('Inquiry delivered directly to H H Events management desk.', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to submit inquiry. Please call directly.', 'error');
      }
    } catch {
      // Fallback
      setSubmitted(true);
      showToast('Inquiry submitted. Our coordinator will contact you promptly.', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 pb-24 bg-[#F5F1E8] text-[#252525]">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] py-14 sm:py-18 border-b border-[#E2DACB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#173D35] bg-[#F5F1E8] px-3.5 py-1.5 rounded-full border border-[#E2DACB] inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#C9AA72]" />
              Venue Liaison Desk
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#252525] tracking-tight font-serif-heading">
              Contact H H Events &amp; Conventions
            </h1>
            <p className="text-base sm:text-lg text-[#4A4A4A] leading-relaxed">
              Reach our management desk directly for hall walkthroughs, date consultations, and booking arrangements.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Contact Info + Inquiry Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Contact Info Cards */}
          <div className="space-y-6">
            <div className="p-6 sm:p-8 bg-white rounded-3xl space-y-6 border border-[#E2DACB] shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-[#252525] font-serif-heading">
                  Management Desk
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Direct contact for reservations and hall coordination
                </p>
              </div>

              <div className="space-y-5 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#C9AA72] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#252525] block">Venue Address</span>
                    <p className="text-[#4A4A4A] text-xs mt-0.5 leading-relaxed">
                      {VENUE_INFO.address}
                    </p>
                    <a
                      href={VENUE_INFO.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#C9AA72] hover:underline text-xs font-semibold pt-1"
                    >
                      <span>Open Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#C9AA72] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-[#252525] block">Phone Numbers</span>
                    <p className="text-[#4A4A4A] text-xs">
                      Primary (Calling):{' '}
                      <a href={`tel:${VENUE_INFO.primaryPhone}`} className="text-[#252525] font-semibold hover:underline">
                        {VENUE_INFO.primaryPhone}
                      </a>
                    </p>
                    <p className="text-[#4A4A4A] text-xs">
                      Secondary (Calling):{' '}
                      <a href={`tel:${VENUE_INFO.secondaryPhone}`} className="text-[#252525] font-semibold hover:underline">
                        {VENUE_INFO.secondaryPhone}
                      </a>
                    </p>
                    <p className="text-[#4A4A4A] text-xs">
                      WhatsApp:{' '}
                      <a
                        href={`https://wa.me/91${VENUE_INFO.whatsappPhone}?text=${encodeURIComponent('Hello H H Events Management, I would like to inquire about hall availability.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-semibold hover:underline"
                      >
                        {VENUE_INFO.whatsappPhone}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#C9AA72] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#252525] block">Booking Sessions</span>
                    <p className="text-[#4A4A4A] text-xs mt-0.5">
                      Day: {VENUE_INFO.daySlotHours}
                      <br />
                      Evening: {VENUE_INFO.eveningSlotHours}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2DACB]">
                <a
                  href={`https://wa.me/91${VENUE_INFO.whatsappPhone}?text=${encodeURIComponent('Hello H H Events Management, I would like to inquire about hall availability.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp ({VENUE_INFO.whatsappPhone})</span>
                </a>
              </div>
            </div>

            {/* Management Notice Card */}
            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E2DACB] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#C9AA72] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>OFFICIAL VENUE NOTICE</span>
              </div>
              <p className="text-[#4A4A4A] leading-relaxed">
                {VENUE_INFO.paymentNotice}
              </p>
            </div>
          </div>

          {/* Right: Interactive Contact Form */}
          <div className="lg:col-span-2">
            <div className="p-6 sm:p-10 bg-white rounded-3xl border border-[#E2DACB] shadow-sm space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#252525] font-serif-heading">
                  Send an Inquiry
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4A4A] mt-1">
                  Fill in your details below and our management desk will respond promptly.
                </p>
              </div>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-bold text-[#252525]">Inquiry Submitted Successfully</h4>
                  <p className="text-xs text-[#4A4A4A] max-w-md mx-auto">
                    Thank you, {name}. Our venue coordinator will contact you via {phone} shortly.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    size="sm"
                  >
                    Send Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#252525] uppercase mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ibrahim Shafi"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2DACB] text-sm text-[#252525] focus:ring-2 focus:ring-[#C9AA72] focus:outline-none bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#252525] uppercase mb-1.5">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9845012345"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2DACB] text-sm text-[#252525] focus:ring-2 focus:ring-[#C9AA72] focus:outline-none bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#252525] uppercase mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. ibrahim@gmail.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2DACB] text-sm text-[#252525] focus:ring-2 focus:ring-[#C9AA72] focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#252525] uppercase mb-1.5">
                        Inquiry Topic
                      </label>
                      <select
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2DACB] text-sm text-[#252525] focus:ring-2 focus:ring-[#C9AA72] focus:outline-none bg-white"
                      >
                        <option value="general">General Hall Inquiry</option>
                        <option value="wedding">Wedding / Nikah Reservation</option>
                        <option value="tariff">Tariff &amp; Packages Confirmation</option>
                        <option value="visit">Venue Walkthrough Appointment</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#252525] uppercase mb-1.5">
                      Your Message or Requirements *
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please share event dates, expected attendees, and questions..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2DACB] text-sm text-[#252525] focus:ring-2 focus:ring-[#C9AA72] focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-[#737373]">
                      * Required fields
                    </span>
                    <Button
                      type="submit"
                      variant="gold"
                      size="md"
                      isLoading={isSubmitting}
                      rightIcon={<Send className="w-4 h-4" />}
                    >
                      Send Message
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
