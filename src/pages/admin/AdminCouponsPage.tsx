import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Tag,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Copy,
  Percent,
  IndianRupee,
  Sparkles,
  Clock,
  Phone,
  Search,
  Filter,
  Eye,
  Gift,
  Check,
  UserCheck
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { DiscountCoupon, CouponUsageRecord } from '../../types';

export const AdminCouponsPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'seasonal' | 'client_exclusive' | 'general'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [selectedLedgerCoupon, setSelectedLedgerCoupon] = useState<DiscountCoupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form State
  const defaultExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  };

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    maxDiscountAmount: 5000,
    minBookingAmount: 30000,
    expiryDate: defaultExpiry(),
    usageLimit: 20,
    perCustomerLimit: 1,
    category: 'seasonal' as 'seasonal' | 'client_exclusive' | 'general',
    specificCustomerPhone: '',
    specificCustomerName: '',
    isActive: true,
  });

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/coupons', {
        headers: { 'x-admin-token': token || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      } else {
        showToast('Failed to load coupons from server', 'error');
      }
    } catch {
      showToast('Could not reach backend coupons service', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscountAmount: 5000,
      minBookingAmount: 30000,
      expiryDate: defaultExpiry(),
      usageLimit: 20,
      perCustomerLimit: 1,
      category: 'seasonal',
      specificCustomerPhone: '',
      specificCustomerName: '',
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (coupon: DiscountCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      minBookingAmount: coupon.minBookingAmount || 0,
      expiryDate: coupon.expiryDate,
      usageLimit: coupon.usageLimit,
      perCustomerLimit: coupon.perCustomerLimit || 1,
      category: coupon.category,
      specificCustomerPhone: coupon.specificCustomerPhone || '',
      specificCustomerName: coupon.specificCustomerName || '',
      isActive: coupon.isActive,
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim() || !formData.expiryDate) {
      showToast('Please fill in required fields (Code, Title, Expiry Date)', 'error');
      return;
    }

    if (formData.category === 'client_exclusive' && !formData.specificCustomerPhone.trim()) {
      showToast('Please provide the designated client mobile number for client-exclusive coupon.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount:
          formData.discountType === 'percentage' && formData.maxDiscountAmount
            ? Number(formData.maxDiscountAmount)
            : undefined,
        minBookingAmount: formData.minBookingAmount ? Number(formData.minBookingAmount) : undefined,
        expiryDate: formData.expiryDate,
        usageLimit: Number(formData.usageLimit) || 0,
        perCustomerLimit: Number(formData.perCustomerLimit) || 1,
        category: formData.category,
        specificCustomerPhone: formData.specificCustomerPhone.trim() || undefined,
        specificCustomerName: formData.specificCustomerName.trim() || undefined,
        isActive: formData.isActive,
      };

      if (editingCoupon) {
        const res = await fetch(`/api/coupons/${editingCoupon.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': token || '',
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`Coupon '${payload.code}' updated successfully`, 'success');
          setIsCreateModalOpen(false);
          loadCoupons();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to update coupon', 'error');
        }
      } else {
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': token || '',
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`Coupon '${payload.code}' created successfully`, 'success');
          setIsCreateModalOpen(false);
          loadCoupons();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to create coupon', 'error');
        }
      }
    } catch {
      showToast('Error communicating with coupon server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (coupon: DiscountCoupon) => {
    try {
      const newStatus = !coupon.isActive;
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token || '',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        showToast(`Coupon '${coupon.code}' is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}`, 'info');
        setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, isActive: newStatus } : c)));
      }
    } catch {
      showToast('Failed to update coupon status', 'error');
    }
  };

  const handleDeleteCoupon = async (coupon: DiscountCoupon) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon '${coupon.code}'?`)) {
      return;
    }
    setIsDeleting(coupon.id);
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token || '' },
      });
      if (res.ok) {
        showToast(`Coupon '${coupon.code}' removed successfully`, 'success');
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      } else {
        showToast('Failed to delete coupon', 'error');
      }
    } catch {
      showToast('Error deleting coupon', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Code '${text}' copied to clipboard!`, 'success');
  };

  // Filter calculations
  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.specificCustomerPhone && c.specificCustomerPhone.includes(searchTerm)) ||
      (c.specificCustomerName && c.specificCustomerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;

    const isExpired = c.expiryDate < todayStr || (c.usageLimit > 0 && c.usedCount >= c.usageLimit);
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? c.isActive && !isExpired
        : !c.isActive || isExpired;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Overview stats
  const totalCreated = coupons.length;
  const activeCount = coupons.filter((c) => c.isActive && c.expiryDate >= todayStr && (c.usageLimit === 0 || c.usedCount < c.usageLimit)).length;
  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);
  const totalSavingsGiven = coupons.reduce((acc, c) => {
    const couponSavings = (c.usedBy || []).reduce((subAcc, u) => subAcc + (u.discountAmount || 0), 0);
    return acc + couponSavings;
  }, 0);

  return (
    <AdminLayout currentPath="/admin/coupons" title="Discount Coupons & Offers" navigate={navigate}>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="bg-[#0B1E19] text-[#FAF8F5] p-6 sm:p-8 rounded-3xl shadow-sm border border-[#183E34] relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#C9AA72]/10 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#C9AA72] bg-[#183E34] px-3 py-1 rounded-full border border-[#C9AA72]/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Privilege &amp; Promotions Hub
                </span>
                <span className="text-[11px] text-emerald-300 font-mono bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  Verified Executive Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif-heading">
                Discount Coupons &amp; Seasonal Offers
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Create promotional discount codes, festival specials, and VIP client-specific concessions. Coupons are securely deducted during customer checkout and recorded only upon confirmed reservation submission.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={loadCoupons}
                className="bg-transparent border-[#C9AA72]/50 text-[#FAF8F5] hover:bg-[#183E34]"
              >
                Refresh
              </Button>
              <Button
                variant="gold"
                size="md"
                onClick={handleOpenCreateModal}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shadow-lg shadow-[#C9AA72]/20 font-bold"
              >
                + Create Discount Coupon
              </Button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-[#183E34]/80">
            <div className="bg-[#122A23] p-3.5 rounded-2xl border border-[#1E4D40] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9AA72]/15 text-[#C9AA72] flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Created</span>
                <strong className="text-lg font-bold text-white font-mono">{totalCreated}</strong>
              </div>
            </div>

            <div className="bg-[#122A23] p-3.5 rounded-2xl border border-[#1E4D40] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Live &amp; Active</span>
                <strong className="text-lg font-bold text-emerald-300 font-mono">{activeCount}</strong>
              </div>
            </div>

            <div className="bg-[#122A23] p-3.5 rounded-2xl border border-[#1E4D40] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Redeemed</span>
                <strong className="text-lg font-bold text-white font-mono">{totalRedemptions} orders</strong>
              </div>
            </div>

            <div className="bg-[#122A23] p-3.5 rounded-2xl border border-[#1E4D40] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Client Savings</span>
                <strong className="text-lg font-bold text-amber-300 font-mono">₹{totalSavingsGiven.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-[#E2DACB] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coupon by code, title, or client phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72] bg-[#FAF8F5]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="bg-transparent border-none text-xs font-medium text-slate-700 py-1.5 px-2 focus:outline-none cursor-pointer"
              >
                <option value="all">All Offers</option>
                <option value="seasonal">Seasonal &amp; Festivals</option>
                <option value="client_exclusive">Client Specific (VIP)</option>
                <option value="general">General Promotional</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-slate-200 text-xs">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-transparent border-none text-xs font-medium text-slate-700 py-1.5 px-2 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired / Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Coupons Grid / Cards */}
        {isLoading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E2DACB]">
            <div className="animate-spin w-8 h-8 border-3 border-[#C9AA72] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading promotional discount codes...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E2DACB] p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#C9AA72] flex items-center justify-center mx-auto border border-amber-200">
              <Ticket className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No Discount Coupons Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'No coupons match your active search filters. Try clearing filters to see all coupons.'
                  : 'Get started by creating your first promotional coupon, seasonal festival deal, or client VIP discount.'}
              </p>
            </div>
            <Button
              variant="gold"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create First Coupon
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCoupons.map((coupon) => {
              const isExpired = coupon.expiryDate < todayStr;
              const isLimitReached = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
              const isLive = coupon.isActive && !isExpired && !isLimitReached;

              return (
                <div
                  key={coupon.id}
                  className={`bg-white rounded-3xl border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                    isLive ? 'border-[#E2DACB]' : 'border-slate-200 opacity-80 bg-slate-50/50'
                  }`}
                >
                  {/* Top Badge ribbon */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {coupon.category === 'seasonal' && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Seasonal
                          </span>
                        )}
                        {coupon.category === 'client_exclusive' && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-300 inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-purple-600" />
                            Client Exclusive
                          </span>
                        )}
                        {coupon.category === 'general' && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 inline-flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-500" />
                            General
                          </span>
                        )}

                        {isLive ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Active
                          </span>
                        ) : isExpired ? (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            Expired
                          </span>
                        ) : isLimitReached ? (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            Limit Exhausted
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            Deactivated
                          </span>
                        )}
                      </div>

                      {/* Quick Active Switch */}
                      <button
                        onClick={() => handleToggleStatus(coupon)}
                        title={coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold cursor-pointer transition-colors border ${
                          coupon.isActive
                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                            : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {coupon.isActive ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Code Snippet Box */}
                    <div className="bg-[#FAF8F5] border border-[#E2DACB] rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-[#C9AA72]" />
                        <span className="text-base font-black tracking-widest text-[#0B1E19] font-mono select-all">
                          {coupon.code}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(coupon.code)}
                        title="Copy code"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-3 font-serif-heading">
                      {coupon.title}
                    </h3>
                    {coupon.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{coupon.description}</p>
                    )}

                    {/* Client Exclusive Detail */}
                    {coupon.category === 'client_exclusive' && coupon.specificCustomerPhone && (
                      <div className="mt-2 text-[11px] bg-purple-50/70 border border-purple-200/80 rounded-xl px-2.5 py-1 text-purple-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="truncate">
                          Reserved for: <strong>{coupon.specificCustomerName || 'Designated Client'}</strong> ({coupon.specificCustomerPhone})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle Pricing & Rules Details */}
                  <div className="px-5 py-2.5 bg-[#FAF8F5]/80 border-t border-b border-[#E2DACB]/60 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Discount Value:</span>
                      <strong className="text-emerald-700 font-bold text-sm">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue.toLocaleString('en-IN')} Flat OFF`}
                        {coupon.discountType === 'percentage' && coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && (
                          <span className="text-[10px] text-slate-500 font-normal ml-1">
                            (Cap ₹{coupon.maxDiscountAmount.toLocaleString('en-IN')})
                          </span>
                        )}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Min Package Order:</span>
                      <span className="text-slate-800 font-medium">
                        {coupon.minBookingAmount ? `₹${coupon.minBookingAmount.toLocaleString('en-IN')}` : 'No minimum'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Valid Until:</span>
                      <span className={`font-mono ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                        {coupon.expiryDate} {isExpired && '(Passed)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Customer Limit:</span>
                      <span className="text-slate-700 font-medium">
                        Max {coupon.perCustomerLimit || 1} use per phone
                      </span>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="pt-1">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Total Usage:</span>
                        <strong className="text-slate-800 font-mono">
                          {coupon.usedCount} / {coupon.usageLimit > 0 ? coupon.usageLimit : '∞'} used
                        </strong>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isLimitReached ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{
                            width:
                              coupon.usageLimit > 0
                                ? `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%`
                                : coupon.usedCount > 0
                                ? '40%'
                                : '0%',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-3 bg-white flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedLedgerCoupon(coupon)}
                      className="text-xs font-semibold text-[#183E34] hover:text-[#C9AA72] flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Redemptions ({coupon.usedBy?.length || 0})
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(coupon)}
                        title="Edit Coupon"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon)}
                        disabled={isDeleting === coupon.id}
                        title="Delete Coupon"
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE / EDIT COUPON MODAL */}
        <Dialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveCoupon} className="space-y-5 text-slate-800">
            {/* Category selection selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Offer Type &amp; Target Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'seasonal' })}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    formData.category === 'seasonal'
                      ? 'border-[#C9AA72] bg-[#FAF8F5] ring-2 ring-[#C9AA72]/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Seasonal &amp; Festival
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Eid, Wedding Season, New Year festival deals visible to all guests.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'client_exclusive' })}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    formData.category === 'client_exclusive'
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    Specific Client (VIP)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Special rate for a specific client mobile number. Only they can redeem.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'general' })}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    formData.category === 'general'
                      ? 'border-[#183E34] bg-emerald-50/40 ring-2 ring-[#183E34]/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#183E34]">
                    <Tag className="w-3.5 h-3.5 text-emerald-700" />
                    General Promotional
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    General coupon codes for marketing campaigns &amp; partner agencies.
                  </p>
                </button>
              </div>
            </div>

            {/* Client specific phone inputs if selected */}
            {formData.category === 'client_exclusive' && (
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-3">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-purple-700" />
                  Designated VIP Client Mobile &amp; Name
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Client 10-Digit Mobile Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9448151878"
                      value={formData.specificCustomerPhone}
                      onChange={(e) => setFormData({ ...formData, specificCustomerPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Client Name / Family Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Ahmed / Al-Hira Family"
                      value={formData.specificCustomerName}
                      onChange={(e) => setFormData({ ...formData, specificCustomerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-purple-800">
                  ⚠️ This coupon will strictly be rejected if applied by any customer whose phone number does not match.
                </p>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Coupon Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. EID2026 or HHVIP5000"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#C9AA72] uppercase"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Letters, numbers, dashes only. Auto capitalized.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand Eid Season Special"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Campaign Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ₹5,000 direct deduction on any Full AC Hall bookings during festival month."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
              />
            </div>

            {/* Discount Calculation Section */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] space-y-4">
              <span className="text-xs font-bold text-[#183E34] uppercase tracking-wider block">
                Discount Calculation &amp; Deduction Limits
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Discount Calculation Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.discountType === 'percentage'
                          ? 'bg-[#183E34] text-white border-[#183E34]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.discountType === 'fixed'
                          ? 'bg-[#183E34] text-white border-[#183E34]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      Flat Amount (₹)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    {formData.discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Flat Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percentage' ? '90' : '100000'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.discountType === 'percentage' ? (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Maximum Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10000 (0 for no cap)"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Protects large packages from exceeding maximum permissible concession.
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Minimum Booking Rent (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 30000"
                      value={formData.minBookingAmount}
                      onChange={(e) => setFormData({ ...formData, minBookingAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Customer must select a package worth at least this amount to apply.
                    </span>
                  </div>
                )}

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Minimum Booking Rent (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 30000"
                      value={formData.minBookingAmount}
                      onChange={(e) => setFormData({ ...formData, minBookingAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C9AA72]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Expiry & Usage Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72] font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Total Venue Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                  placeholder="0 = Unlimited"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72] font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">0 for unlimited total redemptions</span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Per Customer Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.perCustomerLimit}
                  onChange={(e) => setFormData({ ...formData, perCustomerLimit: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9AA72] font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Max uses per mobile phone</span>
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-[#183E34] rounded focus:ring-[#C9AA72]"
              />
              <label htmlFor="isActiveCheckbox" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Coupon is immediately ACTIVE and available for redemption
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gold"
                size="md"
                disabled={isSaving}
                className="font-bold min-w-[130px]"
              >
                {isSaving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </div>
          </form>
        </Dialog>

        {/* REDEMPTION USAGE LEDGER MODAL */}
        <Dialog
          isOpen={!!selectedLedgerCoupon}
          onClose={() => setSelectedLedgerCoupon(null)}
          title={`Redemption Ledger: ${selectedLedgerCoupon?.code}`}
          maxWidth="2xl"
        >
          {selectedLedgerCoupon && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <strong className="text-sm font-serif-heading text-slate-900 block">
                    {selectedLedgerCoupon.title}
                  </strong>
                  <span className="text-slate-500">
                    Category: {selectedLedgerCoupon.category.toUpperCase()} &bull; Total Used: {selectedLedgerCoupon.usedCount} of {selectedLedgerCoupon.usageLimit > 0 ? selectedLedgerCoupon.usageLimit : 'Unlimited'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Total Concession Given:</span>
                  <strong className="text-base text-emerald-700 font-mono font-bold">
                    ₹
                    {(selectedLedgerCoupon.usedBy || [])
                      .reduce((acc, u) => acc + (u.discountAmount || 0), 0)
                      .toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {(!selectedLedgerCoupon.usedBy || selectedLedgerCoupon.usedBy.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No Customers Have Redeemed This Coupon Yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                    When customers apply this code during booking and officially submit their order, their name, phone, reservation ID, and price breakdown will appear here.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0B1E19] text-[#FAF8F5] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Booking Ref</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Date Redeemed</th>
                          <th className="py-3 px-4 text-right">Package Rent</th>
                          <th className="py-3 px-4 text-right">Discount</th>
                          <th className="py-3 px-4 text-right">Final Rent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedLedgerCoupon.usedBy.map((usage, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                              {usage.referenceNo || usage.bookingId}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">
                              {usage.customerName}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 font-mono">
                              {usage.customerPhone}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                              {usage.usedAt ? new Date(usage.usedAt).toLocaleDateString('en-IN') : 'N/A'}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-500 font-mono">
                              ₹{(usage.originalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-4 text-right text-emerald-700 font-bold font-mono">
                              -₹{(usage.discountAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-900 font-bold font-mono">
                              ₹{(usage.finalAmount || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedLedgerCoupon(null)}>
                  Close Ledger
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </AdminLayout>
  );
};
