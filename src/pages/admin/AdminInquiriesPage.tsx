import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  Eye,
  Send,
  User,
  AlertCircle,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { InquiryRecord } from '../../types';

interface AdminInquiriesPageProps {
  navigate: (path: string) => void;
}

export const AdminInquiriesPage: React.FC<AdminInquiriesPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const { token } = useAuth();
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'resolved'>('all');

  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getAuthHeader = () => {
    const activeToken =
      token ||
      localStorage.getItem('hh_auth_token_v5') ||
      sessionStorage.getItem('hh_auth_token_v5') ||
      localStorage.getItem('hh_admin_token') ||
      sessionStorage.getItem('hh_admin_token') ||
      '';
    return activeToken
      ? {
          Authorization: `Bearer ${activeToken}`,
          'x-admin-token': activeToken,
        }
      : {};
  };

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inquiries', {
        headers: { ...getAuthHeader() },
      });
      if (res.ok) {
        const data = await res.json();
        setInquiries(Array.isArray(data) ? data : []);
      } else {
        showToast('Failed to load inquiries', 'error');
      }
    } catch {
      showToast('Error connecting to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'new' | 'contacted' | 'resolved') => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });

      if (res.ok) {
        const data = await res.json();
        setInquiries((prev) => prev.map((inq) => (inq.id === id ? data.inquiry : inq)));
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry(data.inquiry);
        }
        showToast(`Inquiry marked as ${newStatus}`, 'success');
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch {
      showToast('Error updating status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer inquiry from the database?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });

      if (res.ok) {
        setInquiries((prev) => prev.filter((inq) => inq.id !== id));
        if (selectedInquiry?.id === id) {
          setSelectedInquiry(null);
        }
        showToast('Inquiry permanently deleted from database', 'success');
      } else {
        showToast('Failed to delete inquiry', 'error');
      }
    } catch {
      showToast('Error deleting inquiry', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const openDossier = (inquiry: InquiryRecord) => {
    setSelectedInquiry(inquiry);
    setAdminNotes(inquiry.adminNotes || '');
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      inq.fullName.toLowerCase().includes(q) ||
      inq.phone.includes(q) ||
      inq.email.toLowerCase().includes(q) ||
      (inq.topic && inq.topic.toLowerCase().includes(q)) ||
      (inq.message && inq.message.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countNew = inquiries.filter((i) => i.status === 'new').length;
  const countContacted = inquiries.filter((i) => i.status === 'contacted').length;
  const countResolved = inquiries.filter((i) => i.status === 'resolved').length;

  return (
    <AdminLayout currentPath="/admin/inquiries" title="Customer Form Inquiries" navigate={navigate}>
      <div className="space-y-6">
        {/* Header Summary Cards */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif-heading">
                Customer Inquiries &amp; Messages
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Direct website contact form submissions, venue requests, and customer questions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadInquiries}
                disabled={isLoading}
                leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Received</span>
              <strong className="text-lg font-bold text-slate-900 font-mono">{inquiries.length}</strong>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">New / Pending</span>
              <strong className="text-lg font-bold text-amber-900 font-mono">{countNew}</strong>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Contacted</span>
              <strong className="text-lg font-bold text-blue-900 font-mono">{countContacted}</strong>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Resolved</span>
              <strong className="text-lg font-bold text-emerald-900 font-mono">{countResolved}</strong>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, topic, or message..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'new', 'contacted', 'resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#173D35] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'All Inquiries' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiries Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Inquiry Topic</th>
                  <th className="py-3.5 px-4">Message Snippet</th>
                  <th className="py-3.5 px-4">Date Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="font-medium text-xs">No customer inquiries found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Inquiries submitted via the public contact form will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inq) => {
                    const formattedDate = new Date(inq.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={inq.id}
                        onClick={() => openDossier(inq)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                            {inq.fullName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[11px]">
                            <span>{inq.phone}</span>
                            {inq.email && <span>&bull; {inq.email}</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E2DACB] text-[11px] font-semibold text-[#173D35]">
                            {inq.topic || 'General Inquiry'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-600 line-clamp-1 text-[11px]">
                            {inq.message || 'No additional message text'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              inq.status === 'new'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : inq.status === 'contacted'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {inq.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/91${inq.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Hello ${inq.fullName}, greetings from H H Events & Conventions. Regarding your inquiry on "${inq.topic || 'venue booking'}"...`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${inq.phone}`}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                              title="Call Customer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => openDossier(inq)}
                              className="p-1.5 rounded-lg bg-[#FAF8F5] text-[#173D35] hover:bg-[#F2ECE1] border border-[#E2DACB] transition-colors"
                              title="View Full Dossier"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInquiry(inq.id)}
                              disabled={deletingId === inq.id}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                              title="Delete from Database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inquiry Dossier Modal */}
        {selectedInquiry && (
          <Dialog
            isOpen={!!selectedInquiry}
            onClose={() => setSelectedInquiry(null)}
            title={`Customer Inquiry Dossier — ${selectedInquiry.id}`}
            maxWidth="lg"
          >
            <div className="space-y-5 text-xs">
              {/* Header Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    APPLICANT / SENDER
                  </span>
                  <h4 className="text-base font-bold text-slate-900 font-serif-heading">
                    {selectedInquiry.fullName}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-slate-600 font-mono">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedInquiry.phone}
                    </span>
                    {selectedInquiry.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {selectedInquiry.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/91${selectedInquiry.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hello ${selectedInquiry.fullName}, greetings from H H Events & Conventions. Regarding your inquiry on "${selectedInquiry.topic || 'venue booking'}"...`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                </div>
              </div>

              {/* Inquiry Topic & Timestamp */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2DACB]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Topic of Inquiry
                  </span>
                  <strong className="text-slate-900 text-sm font-serif-heading">
                    {selectedInquiry.topic || 'General Hall Inquiry'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Date &amp; Time Submitted
                  </span>
                  <strong className="text-slate-800 font-mono text-xs">
                    {new Date(selectedInquiry.submittedAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </strong>
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Customer Message / Requirements
                </span>
                <div className="p-4 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedInquiry.message || 'No message content provided.'}
                </div>
              </div>

              {/* Internal Manager Notes */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Management Desk Follow-up Notes
                </span>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record customer preferences, callback status, or negotiated rate details..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold uppercase">Status:</span>
                  {(['new', 'contacted', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedInquiry.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                        selectedInquiry.status === st
                          ? 'bg-[#173D35] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete Inquiry
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedInquiry(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};
