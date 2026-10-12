import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Building2,
  UtensilsCrossed,
  ChefHat,
  ThermometerSnowflake,
  Wind,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export interface AdminPackageItem {
  id: string;
  name: string;
  displayName: string;
  details: string;
  rent: number;
  rentFormatted: string;
  acType: 'AC' | 'Non AC' | 'Dining Only';
  requiredResources: string[];
  inclusions: string[];
  capacityText: string;
  active: boolean;
  displayOrder: number;
}

const AVAILABLE_RESOURCES = [
  { id: 'gents_hall', label: 'Gents Hall (Hall 1)', icon: Building2 },
  { id: 'ladies_hall', label: 'Ladies Hall (Hall 2)', icon: Building2 },
  { id: 'dining_1', label: 'Dining Section 1 (Gents Dining)', icon: UtensilsCrossed },
  { id: 'dining_2', label: 'Dining Section 2 (Ladies Dining)', icon: UtensilsCrossed },
  { id: 'kitchen', label: 'Commercial Catering Kitchen', icon: ChefHat },
];

export const AdminPackagesPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<AdminPackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Add modal state
  const [editingPackage, setEditingPackage] = useState<AdminPackageItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    displayName: string;
    details: string;
    rent: number;
    acType: 'AC' | 'Non AC' | 'Dining Only';
    requiredResources: string[];
    inclusionsText: string;
    capacityText: string;
    active: boolean;
  }>({
    id: '',
    name: '',
    displayName: '',
    details: '',
    rent: 30000,
    acType: 'AC',
    requiredResources: ['gents_hall', 'dining_1', 'kitchen'],
    inclusionsText: '',
    capacityText: '',
    active: true,
  });

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/packages');
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch {
      showToast('Failed to load packages', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const openEditModal = (pkg: AdminPackageItem) => {
    setIsNew(false);
    setEditingPackage(pkg);
    setFormData({
      id: pkg.id,
      name: pkg.name,
      displayName: pkg.displayName || pkg.name,
      details: pkg.details,
      rent: pkg.rent,
      acType: pkg.acType,
      requiredResources: [...pkg.requiredResources],
      inclusionsText: (pkg.inclusions || []).join('\n'),
      capacityText: pkg.capacityText || '',
      active: pkg.active !== false,
    });
  };

  const openAddModal = () => {
    setIsNew(true);
    const newId = `custom-pkg-${Date.now()}`;
    const emptyPkg: AdminPackageItem = {
      id: newId,
      name: '',
      displayName: '',
      details: '',
      rent: 30000,
      rentFormatted: '30,000.00',
      acType: 'AC',
      requiredResources: ['gents_hall', 'dining_1', 'kitchen'],
      inclusions: [],
      capacityText: 'Up to 500 Persons',
      active: true,
      displayOrder: packages.length + 1,
    };
    setEditingPackage(emptyPkg);
    setFormData({
      id: newId,
      name: '',
      displayName: '',
      details: '',
      rent: 30000,
      acType: 'AC',
      requiredResources: ['gents_hall', 'dining_1', 'kitchen'],
      inclusionsText: 'Stage Platform\nDining Wing Access\nKitchen Facility',
      capacityText: 'Up to 500 Persons',
      active: true,
    });
  };

  const toggleResource = (resourceId: string) => {
    setFormData((prev) => {
      const exists = prev.requiredResources.includes(resourceId);
      const updated = exists
        ? prev.requiredResources.filter((r) => r !== resourceId)
        : [...prev.requiredResources, resourceId];
      return { ...prev, requiredResources: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.rent <= 0) {
      showToast('Please enter a package name and valid rental price.', 'error');
      return;
    }
    if (formData.requiredResources.length === 0) {
      showToast('Select at least one physical venue space occupied by this package.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const inclusions = formData.inclusionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const updatedPackage: AdminPackageItem = {
        id: formData.id,
        name: formData.name.trim(),
        displayName: formData.displayName.trim() || formData.name.trim(),
        details: formData.details.trim(),
        rent: Number(formData.rent),
        rentFormatted: Number(formData.rent).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        }),
        acType: formData.acType,
        requiredResources: formData.requiredResources,
        inclusions,
        capacityText: formData.capacityText.trim() || 'Flexible Capacity',
        active: formData.active,
        displayOrder: editingPackage?.displayOrder || packages.length + 1,
      };

      let newPackagesList: AdminPackageItem[];
      if (isNew) {
        newPackagesList = [...packages, updatedPackage];
      } else {
        newPackagesList = packages.map((p) => (p.id === updatedPackage.id ? updatedPackage : p));
      }

      const res = await fetch('/api/packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packages: newPackagesList }),
      });

      if (res.ok) {
        setPackages(newPackagesList);
        setEditingPackage(null);
        showToast(
          isNew ? 'New package created successfully.' : 'Package configuration saved.',
          'success'
        );
      } else {
        showToast('Failed to save packages to server.', 'error');
      }
    } catch {
      showToast('Failed to save packages', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePackageActive = async (pkg: AdminPackageItem) => {
    const updated = packages.map((p) =>
      p.id === pkg.id ? { ...p, active: !p.active } : p
    );
    try {
      const res = await fetch('/api/packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packages: updated }),
      });
      if (res.ok) {
        setPackages(updated);
        showToast(`Package "${pkg.name}" is now ${!pkg.active ? 'Active' : 'Archived'}.`, 'info');
      }
    } catch {
      showToast('Failed to update package status', 'error');
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/packages"
      navigate={navigate}
      title="Dynamic Package & Pricing Management"
      subtitle="Configure the 8 official packages, rental rates, physical space occupancy, and custom combinations"
      actionButton={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/pricing')}
            variant="outline"
            size="sm"
          >
            Preview Public Tariff
          </Button>
          <Button
            onClick={openAddModal}
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Package
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5">
              <Package className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 font-serif-heading">
                Multi-Resource Hall &amp; Dining Flexibility
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                H H Events packages bind to physical spaces (Gents Hall, Ladies Hall, Dining 1, Dining 2, Kitchen).
                When a customer books any package, the atomic conflict engine automatically prevents overlapping bookings for those exact occupied spaces while leaving independent spaces open for concurrent reservations.
              </p>
            </div>
          </div>
        </div>

        {/* Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`p-6 flex flex-col justify-between transition-all border ${
                pkg.active ? 'border-slate-200 bg-white' : 'border-slate-200/60 bg-slate-50 opacity-75'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block ${
                      pkg.acType === 'AC'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : pkg.acType === 'Non AC'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {pkg.acType}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-serif-heading mt-1">
                      {pkg.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Rent</span>
                    <span className="text-xl font-bold font-mono text-amber-600">
                      ₹{pkg.rent.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {pkg.details}
                </p>

                {/* Resource occupancy badges */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Occupied Spaces:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pkg.requiredResources.map((rId) => {
                      const res = AVAILABLE_RESOURCES.find((r) => r.id === rId);
                      return (
                        <span
                          key={rId}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1"
                        >
                          {res?.label.split(' (')[0] || rId}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Capacity & Inclusions count */}
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Capacity: <strong className="text-slate-700">{pkg.capacityText}</strong></span>
                  <span>{pkg.inclusions?.length || 0} Inclusions</span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => togglePackageActive(pkg)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    pkg.active
                      ? 'text-emerald-700 hover:bg-emerald-50'
                      : 'text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {pkg.active ? '● Active' : '○ Disabled'}
                </button>

                <Button
                  onClick={() => openEditModal(pkg)}
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit Configuration
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit/Add Modal */}
      {editingPackage && (
        <Dialog
          isOpen={true}
          onClose={() => setEditingPackage(null)}
          title={isNew ? 'Create New Venue Package' : `Edit Package: ${editingPackage.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Package Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Single AC Hall-II"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Advertised Rent (₹)</label>
                <input
                  type="number"
                  value={formData.rent}
                  onChange={(e) => setFormData({ ...formData, rent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Climate / AC Category</label>
                <select
                  value={formData.acType}
                  onChange={(e) => setFormData({ ...formData, acType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="AC">Central AC</option>
                  <option value="Non AC">Non AC (Natural Ventilation)</option>
                  <option value="Dining Only">Dining &amp; Kitchen Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Capacity Highlight</label>
                <input
                  type="text"
                  value={formData.capacityText}
                  onChange={(e) => setFormData({ ...formData, capacityText: e.target.value })}
                  placeholder="e.g. Up to 1,000 Persons (Floating)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Package Description &amp; Details</label>
              <textarea
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={2}
                placeholder="Brief summary of hall sections, dining and kitchen included"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Physical Space Occupancy Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-900 uppercase block">
                Physical Venue Spaces Occupied (Concurrency Barrier):
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Checking these spaces locks them when this package is booked, preventing double bookings for overlapping events.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_RESOURCES.map((r) => {
                  const Icon = r.icon;
                  const isChecked = formData.requiredResources.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      onClick={() => toggleResource(r.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <Icon className={`w-4 h-4 ${isChecked ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span className="text-xs">{r.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Inclusions list */}
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-700 uppercase block">
                Inclusions &amp; Amenities (One per line)
              </label>
              <textarea
                value={formData.inclusionsText}
                onChange={(e) => setFormData({ ...formData, inclusionsText: e.target.value })}
                rows={4}
                placeholder="Gents & Ladies Hall Wings&#10;Equipped Catering Kitchen&#10;Power Generator Backup"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-amber-600"
                />
                Publicly Active on Tariff &amp; Booking Pages
              </label>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPackage(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  disabled={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {isSaving ? 'Saving...' : 'Save Package'}
                </Button>
              </div>
            </div>
          </form>
        </Dialog>
      )}
    </AdminLayout>
  );
};
