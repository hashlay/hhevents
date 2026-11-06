import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Building2,
  CheckCircle2,
  Phone,
  Clock,
  ShieldCheck,
  FileText,
  Camera,
  ArrowRight,
  PenTool,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { VENUE_INFO } from '../../services/hallData';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface AdminSettingsPageProps {
  navigate: (path: string) => void;
}

const SETTINGS_KEY = 'hh_events_local_settings_v4';

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const { token } = useAuth();

  const [primaryPhone, setPrimaryPhone] = useState(VENUE_INFO.primaryPhone);
  const [secondaryPhone, setSecondaryPhone] = useState(VENUE_INFO.secondaryPhone);
  const [whatsappPhone, setWhatsappPhone] = useState(VENUE_INFO.whatsappPhone);
  const [daySlotHours, setDaySlotHours] = useState(VENUE_INFO.daySlotHours);
  const [eveningSlotHours, setEveningSlotHours] = useState(VENUE_INFO.eveningSlotHours);
  const [paymentNotice, setPaymentNotice] = useState(VENUE_INFO.paymentNotice);
  const [address, setAddress] = useState(VENUE_INFO.address);
  const [signatorySignature, setSignatorySignature] = useState<string>('');
  const [signatoryName, setSignatoryName] = useState<string>('Authorized Signatory');
  const [isSaving, setIsSaving] = useState(false);

  const getAuthToken = () => {
    return (
      token ||
      localStorage.getItem('hh_auth_token_v5') ||
      sessionStorage.getItem('hh_auth_token_v5') ||
      localStorage.getItem('hh_admin_token') ||
      sessionStorage.getItem('hh_admin_token') ||
      ''
    );
  };

  useEffect(() => {
    // 1. Try loading from server API
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.primaryPhone) setPrimaryPhone(data.primaryPhone);
          if (data.secondaryPhone) setSecondaryPhone(data.secondaryPhone);
          if (data.whatsappPhone) setWhatsappPhone(data.whatsappPhone);
          if (data.daySlotHours) setDaySlotHours(data.daySlotHours);
          if (data.eveningSlotHours) setEveningSlotHours(data.eveningSlotHours);
          if (data.paymentNotice) setPaymentNotice(data.paymentNotice);
          if (data.address) setAddress(data.address);
          if (data.signatorySignature) setSignatorySignature(data.signatorySignature);
          if (data.signatoryName) setSignatoryName(data.signatoryName);
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
        }
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem(SETTINGS_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.primaryPhone) setPrimaryPhone(parsed.primaryPhone);
            if (parsed.secondaryPhone) setSecondaryPhone(parsed.secondaryPhone);
            if (parsed.whatsappPhone) setWhatsappPhone(parsed.whatsappPhone);
            if (parsed.daySlotHours) setDaySlotHours(parsed.daySlotHours);
            if (parsed.eveningSlotHours) setEveningSlotHours(parsed.eveningSlotHours);
            if (parsed.paymentNotice) setPaymentNotice(parsed.paymentNotice);
            if (parsed.address) setAddress(parsed.address);
            if (parsed.signatorySignature) setSignatorySignature(parsed.signatorySignature);
            if (parsed.signatoryName) setSignatoryName(parsed.signatoryName);
          }
        } catch (e) {
          console.error('Failed to load local settings:', e);
        }
      });
  }, []);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, or WebP)', 'error');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size should be less than 3MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Create canvas to keep image crisp and lightweight
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          setSignatorySignature(dataUrl);
          showToast('Signature loaded! Remember to click "Save Settings" to apply.', 'success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleClearSignature = () => {
    setSignatorySignature('');
    showToast('Signature removed. Blank signatory line will be displayed.', 'info');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      primaryPhone: primaryPhone.trim(),
      secondaryPhone: secondaryPhone.trim(),
      whatsappPhone: whatsappPhone.trim(),
      daySlotHours: daySlotHours.trim(),
      eveningSlotHours: eveningSlotHours.trim(),
      paymentNotice: paymentNotice.trim(),
      address: address.trim(),
      signatorySignature: signatorySignature || '',
      signatoryName: signatoryName.trim() || 'Authorized Signatory',
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));

      const activeToken = getAuthToken();
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Venue settings & signature successfully saved to server & database!', 'success');
      } else {
        showToast('Saved locally in browser (server responded with notice)', 'info');
      }
    } catch {
      showToast('Venue parameters saved to local browser storage', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrimaryPhone(VENUE_INFO.primaryPhone);
    setSecondaryPhone(VENUE_INFO.secondaryPhone);
    setWhatsappPhone(VENUE_INFO.whatsappPhone);
    setDaySlotHours(VENUE_INFO.daySlotHours);
    setEveningSlotHours(VENUE_INFO.eveningSlotHours);
    setPaymentNotice(VENUE_INFO.paymentNotice);
    setAddress(VENUE_INFO.address);
    setSignatorySignature('');
    setSignatoryName('Authorized Signatory');
    localStorage.removeItem(SETTINGS_KEY);
    showToast('Settings restored to venue defaults', 'info');
  };

  return (
    <AdminLayout
      currentPath="/admin/settings"
      navigate={navigate}
      title="Venue Settings"
      subtitle="Configure operational contact numbers, session timings, and policies"
    >
      <div className="max-w-4xl space-y-6">
        {/* Real Photography Quick Link Card */}
        <Card className="p-6 border-2 border-amber-300 bg-amber-50/60 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                  Official Real Hall Photographs Manager
                </h3>
                <p className="text-xs text-slate-600">
                  Upload and assign the exact real photographs of H H Events &amp; Conventions for the hero background, halls, and 15 gallery slots.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => navigate('/admin/photos')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="shrink-0"
            >
              Manage Real Photos
            </Button>
          </div>
        </Card>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Contact Numbers */}
          <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                  Management Contact Numbers
                </h3>
                <p className="text-xs text-slate-500">Official phone numbers displayed across the public portal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Primary Calling Number
                </label>
                <input
                  type="tel"
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Secondary Calling Number
                </label>
                <input
                  type="tel"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  WhatsApp Contact Number
                </label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Operating Session Hours */}
          <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                  Operating Session Timings
                </h3>
                <p className="text-xs text-slate-500">Standardized day and evening booking windows</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Day Session Slot
                </label>
                <input
                  type="text"
                  value={daySlotHours}
                  onChange={(e) => setDaySlotHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Evening Session Slot
                </label>
                <input
                  type="text"
                  value={eveningSlotHours}
                  onChange={(e) => setEveningSlotHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Direct Payment & Arrangement Notice (Requirement 25) */}
          <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                  Payment Arrangement Notice
                </h3>
                <p className="text-xs text-slate-500">Notice displayed to customers stating that payments are handled directly with management</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Notice Text
              </label>
              <textarea
                value={paymentNotice}
                onChange={(e) => setPaymentNotice(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </Card>

          {/* Authorized Signatory & Official Signature for Invoices */}
          <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-[#0082a6]/10 text-[#0082a6] flex items-center justify-center">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                  Authorized Signatory &amp; Stamp / Signature
                </h3>
                <p className="text-xs text-slate-500">
                  Signature image rendered on official Event Order invoices and customer receipts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Signatory Designation Label
                  </label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    placeholder="e.g. Authorized Signatory / General Manager"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0082a6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Upload Signature Image
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0082a6] text-[#0082a6] hover:bg-[#0082a6]/10 text-xs font-bold transition-all shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>{signatorySignature ? 'Replace Signature' : 'Choose Signature File'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>
                    {signatorySignature && (
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Recommended: Transparent PNG or crisp photo on white paper. If left blank, a clean blank signature area will appear on receipts for physical signing.
                  </p>
                </div>
              </div>

              {/* Live Preview Box (matches Event Order footer layout) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Invoice Footer Preview
                </span>
                <div className="bg-white p-4 rounded-lg border border-slate-200 max-w-[260px] mx-auto text-center space-y-1 shadow-xs">
                  <div className="text-[11px] font-medium text-slate-700">For : H H Events &amp; Conventions</div>
                  <div className="h-16 flex items-center justify-center border-b border-slate-300 border-dashed my-1">
                    {signatorySignature ? (
                      <img
                        src={signatorySignature}
                        alt="Authorized Signatory"
                        className="max-h-14 max-w-[180px] object-contain"
                      />
                    ) : (
                      <span className="text-[10.5px] text-slate-400 italic">
                        (Blank Signature Area)
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900">{signatoryName || 'Authorized Signatory'}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset to Defaults
            </Button>

            <Button
              type="submit"
              variant="gold"
              size="md"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
