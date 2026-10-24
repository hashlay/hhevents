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
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { VENUE_INFO } from '../../services/hallData';
import { useToast } from '../../context/ToastContext';

interface AdminSettingsPageProps {
  navigate: (path: string) => void;
}

const SETTINGS_KEY = 'hh_events_local_settings_v4';

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ navigate }) => {
  const { showToast } = useToast();

  const [primaryPhone, setPrimaryPhone] = useState(VENUE_INFO.primaryPhone);
  const [secondaryPhone, setSecondaryPhone] = useState(VENUE_INFO.secondaryPhone);
  const [whatsappPhone, setWhatsappPhone] = useState(VENUE_INFO.whatsappPhone);
  const [daySlotHours, setDaySlotHours] = useState(VENUE_INFO.daySlotHours);
  const [eveningSlotHours, setEveningSlotHours] = useState(VENUE_INFO.eveningSlotHours);
  const [paymentNotice, setPaymentNotice] = useState(VENUE_INFO.paymentNotice);
  const [address, setAddress] = useState(VENUE_INFO.address);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
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
      }
    } catch (e) {
      console.error('Failed to load local settings:', e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        primaryPhone: primaryPhone.trim(),
        secondaryPhone: secondaryPhone.trim(),
        whatsappPhone: whatsappPhone.trim(),
        daySlotHours: daySlotHours.trim(),
        eveningSlotHours: eveningSlotHours.trim(),
        paymentNotice: paymentNotice.trim(),
        address: address.trim(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
      showToast('Venue parameters saved to local browser storage', 'success');
    } catch (e) {
      showToast('Failed to save settings', 'error');
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
