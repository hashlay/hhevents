import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Receipt,
  PhoneCall,
  ThermometerSnowflake,
  Wind,
  Users,
  Info,
  MessageCircle,
  Check,
  UtensilsCrossed,
  ChefHat,
  Package as PackageIcon,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { useToast } from '../../context/ToastContext';
import { VENUE_INFO, TIMING_SLOTS, OFFICIAL_TARIFF_SCHEDULE } from '../../services/hallData';
import { checkSlotAvailability } from '../../services/bookingStorage';
import { HallId, SlotType, ACOption, BookingRequest } from '../../types';

interface BookPageProps {
  navigate: (path: string) => void;
}

export interface BookingPackage {
  id: string;
  name: string;
  displayName: string;
  details: string;
  rent: number;
  rentFormatted?: string;
  acType: 'AC' | 'Non AC' | 'Dining Only';
  requiredResources: string[];
  inclusions: string[];
  capacityText: string;
  active?: boolean;
}

type BookingStep = 'date' | 'package' | 'space' | 'details' | 'summary' | 'confirmation';

export const BookPage: React.FC<BookPageProps> = ({ navigate }) => {
  const { showToast } = useToast();

  // Parse URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const paramPackage = urlParams.get('package');
  const paramHall = (urlParams.get('hall') as HallId) || 'hall_1';
  const paramDate = urlParams.get('date');
  const paramSlot = (urlParams.get('slot') as SlotType) || 'day';

  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [packages, setPackages] = useState<BookingPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  // Selections
  const [date, setDate] = useState<string>(
    paramDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [slot, setSlot] = useState<SlotType>(paramSlot);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(paramPackage || 'full-ac-hall');
  const [hallPreference, setHallPreference] = useState<'hall_1' | 'hall_2' | 'both'>('hall_1');

  // Customer Contact Fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState('wedding');
  const [expectedAttendees, setExpectedAttendees] = useState<number | ''>('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Submission & Conflict State
  const [conflictReason, setConflictReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<BookingRequest | null>(null);

  // Load packages from server
  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch('/api/packages');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPackages(data.filter((p: any) => p.active !== false));
            if (paramPackage && data.some((p: any) => p.id === paramPackage)) {
              setSelectedPackageId(paramPackage);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load packages from server:', e);
      } finally {
        setIsLoadingPackages(false);
      }
    }
    fetchPackages();
  }, [paramPackage]);

  // Selected package reference
  const currentPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  // Sync hallPreference with package type
  useEffect(() => {
    if (currentPackage) {
      if (currentPackage.id.includes('full')) {
        setHallPreference('both');
      } else if (currentPackage.acType === 'Dining Only') {
        setHallPreference('hall_1'); // Only occupies dining
      }
    }
  }, [selectedPackageId, currentPackage]);

  // Re-check conflict on field changes
  useEffect(() => {
    if (date && slot && currentPackage) {
      const hallToCheck = currentPackage.id.includes('full') ? 'both' : hallPreference;
      const res = checkSlotAvailability(hallToCheck as HallId, date, slot);
      if (!res.available) {
        setConflictReason(res.conflictReason || 'The selected space is reserved for this session.');
      } else {
        setConflictReason(null);
      }
    }
  }, [date, slot, currentPackage, hallPreference]);

  const packagePrice = currentPackage ? currentPackage.rent : 30000;
  const advanceRequired = Math.round(packagePrice * 0.25);

  const stepsList: { id: BookingStep; label: string; number: number }[] = [
    { id: 'date', label: 'Date & Slot', number: 1 },
    { id: 'package', label: 'Select Package', number: 2 },
    { id: 'space', label: 'Space & Layout', number: 3 },
    { id: 'details', label: 'Host Details', number: 4 },
    { id: 'summary', label: 'Review & Terms', number: 5 },
  ];

  const currentStepIndex = stepsList.findIndex((s) => s.id === currentStep);

  const handleNextStep = () => {
    if (currentStep === 'date') {
      if (!date) {
        showToast('Please select a reservation date.', 'error');
        return;
      }
      if (conflictReason) {
        showToast(conflictReason, 'error');
        return;
      }
      setCurrentStep('package');
    } else if (currentStep === 'package') {
      if (!currentPackage) {
        showToast('Please select a hall package.', 'error');
        return;
      }
      setCurrentStep('space');
    } else if (currentStep === 'space') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (!customerName.trim() || !phone.trim()) {
        showToast('Full name and mobile phone number are required.', 'error');
        return;
      }
      if (phone.replace(/\D/g, '').length < 10) {
        showToast('Please enter a valid 10-digit mobile phone number.', 'error');
        return;
      }
      setCurrentStep('summary');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'package') setCurrentStep('date');
    else if (currentStep === 'space') setCurrentStep('package');
    else if (currentStep === 'details') setCurrentStep('space');
    else if (currentStep === 'summary') setCurrentStep('details');
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      showToast('Please accept the venue booking terms to proceed.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          packageId: currentPackage?.id || selectedPackageId,
          hallSelection: hallPreference,
          acOption: currentPackage?.acType === 'Non AC' ? 'non_ac' : 'ac',
          date,
          slot,
          expectedAttendees: expectedAttendees ? Number(expectedAttendees) : undefined,
          additionalInfo: additionalInfo.trim(),
          eventType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit booking request.', 'error');
        setIsSubmitting(false);
        return;
      }

      setSubmittedBooking(data.booking);
      setCurrentStep('confirmation');
      showToast('Booking request submitted successfully!', 'success');
    } catch {
      showToast('Network error while submitting reservation request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReference = () => {
    if (submittedBooking?.id) {
      navigator.clipboard.writeText(submittedBooking.id);
      showToast('Booking Reference ID copied to clipboard!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#252525] pb-24">
      {/* Top Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] py-10 sm:py-14 border-b border-[#E2DACB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="max-w-3xl space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#173D35] bg-[#F5F1E8] px-3.5 py-1.5 rounded-full border border-[#E2DACB] inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#C9AA72]" />
              Official Reservation Desk
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#252525] tracking-tight font-serif-heading">
              Reserve H H Events &amp; Conventions
            </h1>
            <p className="text-sm sm:text-base text-[#4A4A4A]">
              Opposite Juma Masjid, Akkarangadi, Panemangalore, Bantwal, Karnataka 574231
            </p>
          </div>
        </div>
      </section>

      {/* Main Form Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Step Progress Tracker */}
        {currentStep !== 'confirmation' && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2DACB] shadow-2xs mb-8">
            <div className="flex items-center justify-between">
              {stepsList.map((s, idx) => {
                const isPassed = currentStepIndex > idx;
                const isCurrent = currentStep === s.id;
                return (
                  <div key={s.id} className="flex-1 flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isPassed
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-[#C9AA72] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : s.number}
                      </div>
                      <span
                        className={`hidden md:block text-xs font-medium ${
                          isCurrent ? 'font-bold text-[#252525]' : 'text-slate-500'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < stepsList.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 sm:mx-4 ${
                          isPassed ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 1: DATE & SESSION SLOT */}
        {currentStep === 'date' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8 animate-in fade-in">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 1 of 5</span>
              <h2 className="text-2xl font-bold text-[#252525] font-serif-heading">
                Select Event Date &amp; Session Slot
              </h2>
              <p className="text-xs text-[#4A4A4A]">
                Choose your preferred date and session slot. Sessions operate with dedicated turnover intervals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Event Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                />
                <span className="text-[11px] text-[#737373] block">
                  Schedule reference: {OFFICIAL_TARIFF_SCHEDULE}
                </span>
              </div>

              {/* Session Slot Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Session Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TIMING_SLOTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlot(s.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        slot === s.id
                          ? 'border-[#C9AA72] bg-[#F5F1E8] text-[#252525] ring-1 ring-[#C9AA72]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="font-bold text-sm block">{s.label}</span>
                      <span className="text-xs font-mono text-[#173D35] font-semibold mt-1 block">
                        {s.timeRange}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Conflict Warning */}
            {conflictReason && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Session Slot Occupied:</strong>
                  <p>{conflictReason}</p>
                  <p className="text-[11px] text-rose-700 mt-1">
                    Please choose another session slot or an alternate date.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                onClick={handleNextStep}
                variant="gold"
                size="md"
                disabled={!!conflictReason}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Package Selection
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT OFFICIAL PACKAGE */}
        {currentStep === 'package' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 2 of 5</span>
                <h2 className="text-2xl font-bold text-[#252525] font-serif-heading">
                  Choose Your Hall Package
                </h2>
                <p className="text-xs text-[#4A4A4A]">
                  Select from the 8 official packages. All packages include the commercial kitchen facility.
                </p>
              </div>
              <span className="text-xs font-bold text-[#173D35] bg-[#F5F1E8] px-3 py-1 rounded-full border border-[#E2DACB] self-start sm:self-auto">
                Date: {date} ({slot === 'day' ? 'Day' : 'Evening'})
              </span>
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#C9AA72] bg-[#F5F1E8] shadow-md ring-2 ring-[#C9AA72]/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              pkg.acType === 'AC'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : pkg.acType === 'Non AC'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {pkg.acType}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 font-serif-heading mt-1">
                            {pkg.name}
                          </h3>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black font-mono text-[#C9AA72]">
                            ₹{pkg.rent.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {pkg.details}
                      </p>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span>{pkg.capacityText}</span>
                        <span className="text-emerald-700 font-medium">Kitchen Included</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isSelected ? 'text-[#C9AA72]' : 'text-slate-400'}`}>
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button onClick={handlePrevStep} variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={handleNextStep} variant="gold" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Configure Space &amp; Layout
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SPACE & LAYOUT CONFIGURATION */}
        {currentStep === 'space' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8 animate-in fade-in">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 3 of 5</span>
              <h2 className="text-2xl font-bold text-[#252525] font-serif-heading">
                Physical Space &amp; Layout Assignment
              </h2>
              <p className="text-xs text-[#4A4A4A]">
                Configure which specific hall section and dining facilities apply to your booking.
              </p>
            </div>

            {/* Package Summary Header */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500 block">Selected Package:</span>
                <strong className="text-base text-slate-900 font-serif-heading">
                  {currentPackage?.name}
                </strong>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Rent: ₹{currentPackage?.rent.toLocaleString('en-IN')} &bull; {currentPackage?.acType}
                </span>
              </div>
              <button
                onClick={() => setCurrentStep('package')}
                className="text-xs text-[#C9AA72] font-semibold hover:underline self-start sm:self-auto"
              >
                Change Package
              </button>
            </div>

            {/* Single Hall selection if applicable */}
            {currentPackage && !currentPackage.id.includes('full') && currentPackage.acType !== 'Dining Only' && (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Hall Section Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setHallPreference('hall_1')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      hallPreference === 'hall_1'
                        ? 'border-[#C9AA72] bg-[#F5F1E8] text-[#252525] ring-1 ring-[#C9AA72]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#C9AA72]" />
                      <strong className="text-sm">Hall 1 (Gents Wing)</strong>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Independent main section with stage and dedicated dining entrance.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHallPreference('hall_2')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      hallPreference === 'hall_2'
                        ? 'border-[#C9AA72] bg-[#F5F1E8] text-[#252525] ring-1 ring-[#C9AA72]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#C9AA72]" />
                      <strong className="text-sm">Hall 2 (Ladies Wing)</strong>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Independent hall section with private acoustic setup and dining link.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Inclusions checklist for this package */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                Confirmed Inclusions for this Package:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(currentPackage?.inclusions || [
                  'Kitchen Facility Included',
                  'Standard Session Timing Slot',
                  'Acoustic Power & Generator Setup'
                ]).map((inc, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button onClick={handlePrevStep} variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={handleNextStep} variant="gold" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Host &amp; Event Details
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: HOST DETAILS */}
        {currentStep === 'details' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8 animate-in fade-in">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 4 of 5</span>
              <h2 className="text-2xl font-bold text-[#252525] font-serif-heading">
                Enter Host &amp; Contact Details
              </h2>
              <p className="text-xs text-[#4A4A4A]">
                We use these details for booking verification and sending status updates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Host / Customer Full Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mohammed Farooq"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. farooq@gmail.com"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Nature of Event
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                >
                  <option value="wedding">Wedding Ceremony &amp; Reception</option>
                  <option value="nikah">Nikah Ceremony</option>
                  <option value="reception">Walima / Reception Gala</option>
                  <option value="cultural">Cultural Gathering</option>
                  <option value="corporate">Corporate Convention</option>
                  <option value="family">Family Gathering / Feast</option>
                  <option value="other">Other Event</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Expected Guest Count
                </label>
                <input
                  type="number"
                  value={expectedAttendees}
                  onChange={(e) => setExpectedAttendees(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 block">
                  Special Catering or Setup Notes (Optional)
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={3}
                  placeholder="e.g. Need kitchen early morning for catering preparation"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button onClick={handlePrevStep} variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={handleNextStep} variant="gold" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Review Summary &amp; Terms
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUMMARY */}
        {currentStep === 'summary' && (
          <form onSubmit={handleSubmitBooking} className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DACB] shadow-sm space-y-8 animate-in fade-in">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Step 5 of 5</span>
              <h2 className="text-2xl font-bold text-[#252525] font-serif-heading">
                Review Reservation Request
              </h2>
              <p className="text-xs text-[#4A4A4A]">
                Please review your selected package, schedule, and transparent price breakdown.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-[#FAF8F5] border border-[#E2DACB]">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Event &amp; Hall Details</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Package:</span>
                    <strong className="text-slate-900">{currentPackage?.name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Date:</span>
                    <strong className="text-slate-900 font-mono">{date}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Session Slot:</span>
                    <strong className="text-slate-900">{slot === 'day' ? 'Day (10:00 AM – 3:00 PM)' : 'Evening (6:00 PM – 10:00 PM)'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Climate:</span>
                    <strong className="text-slate-900">{currentPackage?.acType}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Kitchen:</span>
                    <strong className="text-emerald-700">Included without extra charge</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9AA72]">Financial Summary</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Package Rent:</span>
                    <strong className="text-slate-900 font-mono">₹{packagePrice.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">25% Advance Token Required:</span>
                    <strong className="text-amber-700 font-mono">₹{advanceRequired.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Balance on Agreement:</span>
                    <strong className="text-slate-900 font-mono">₹{(packagePrice - advanceRequired).toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Payment Notice:</span>
                    <span className="text-[11px] text-slate-600 text-right max-w-xs">
                      Advance token is handled directly with management upon approval.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded text-[#C9AA72] focus:ring-[#C9AA72] mt-0.5"
                  required
                />
                <span className="text-slate-700 leading-relaxed">
                  I confirm that all provided event details are accurate. I agree to the venue guidelines and understand that booking confirmation requires manager review and advance token deposit.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button type="button" onClick={handlePrevStep} variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                type="submit"
                variant="gold"
                size="md"
                disabled={isSubmitting || !termsAccepted}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isSubmitting ? 'Submitting Reservation...' : 'Submit Booking Request'}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 6: CONFIRMATION RECEIPT */}
        {currentStep === 'confirmation' && submittedBooking && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E2DACB] shadow-lg text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                Reservation Request Recorded
              </span>
              <h2 className="text-3xl font-bold text-slate-900 font-serif-heading">
                Thank You, {customerName}!
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                Your reservation request for <strong>{submittedBooking.packageName}</strong> on{' '}
                <strong>{submittedBooking.date}</strong> has been recorded in our reservation registry.
              </p>
            </div>

            {/* Reference Number Card */}
            <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] max-w-md mx-auto space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                Official Booking Reference ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-black font-mono text-[#C9AA72] tracking-wider">
                  {submittedBooking.id}
                </span>
                <button
                  type="button"
                  onClick={copyReference}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Copy Reference ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Save this reference number to track your reservation status at any time.
              </p>
            </div>

            {/* Next Steps Guidance */}
            <div className="max-w-md mx-auto text-left p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
              <strong className="block font-bold text-slate-900">What Happens Next?</strong>
              <p>
                1. Our management team reviews your requested slot and verifies resource availability.
              </p>
              <p>
                2. You will be contacted via mobile phone (<strong>{phone}</strong>) regarding confirmation and advance token remittance.
              </p>
            </div>

            {/* Direct WhatsApp Trigger */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`https://wa.me/91${VENUE_INFO.primaryPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Assalamu Alaikum / Greetings,\n\nI have submitted a booking request at H H Events & Conventions.\n\n*Booking ID:* ${submittedBooking.id}\n*Customer:* ${customerName}\n*Package:* ${submittedBooking.packageName}\n*Date:* ${submittedBooking.date}\n*Session:* ${submittedBooking.slot === 'day' ? 'Day (10 AM - 3 PM)' : 'Evening (6 PM - 10 PM)'}\n\nPlease let me know the advance token payment details for confirmation.\n\nThank you!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Venue via WhatsApp
              </a>

              <Button
                onClick={() => navigate(`/track-booking?ref=${submittedBooking.id}`)}
                variant="outline"
                size="md"
              >
                Track Booking Status
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
