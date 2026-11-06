import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ManagerAvailabilityCalendar } from '../../components/calendar/ManagerAvailabilityCalendar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  getAllManagerAvailability,
  resetDateToDefault,
  clearAllManagerAvailability,
  subscribeAvailability,
  DateAvailabilityEntry,
} from '../../services/availabilityManager';
import { useToast } from '../../context/ToastContext';

interface AdminAvailabilityPageProps {
  navigate: (path: string) => void;
}

export const AdminAvailabilityPage: React.FC<AdminAvailabilityPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<Record<string, DateAvailabilityEntry>>(
    getAllManagerAvailability()
  );

  useEffect(() => {
    return subscribeAvailability(() => {
      setEntries(getAllManagerAvailability());
    });
  }, []);

  const modifiedDates = Object.keys(entries).sort();

  const handleResetDate = (date: string) => {
    resetDateToDefault(date);
    showToast(`Reset ${date} back to default (Open/Available for all halls).`, 'info');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to reset all dates back to default Available?')) {
      clearAllManagerAvailability();
      showToast('All calendar dates reset to default Available.', 'info');
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/availability"
      navigate={navigate}
      title="Manager-Controlled Availability"
      subtitle="Authoritative manual calendar: Open calendar → Tap date → Select Hall 1 / Hall 2 / Combined Hall → Mark Available or Unavailable"
      actionButton={
        <Button
          onClick={() => navigate('/availability')}
          variant="outline"
          size="sm"
          leftIcon={<ExternalLink className="w-4 h-4" />}
        >
          View Public Calendar
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Workflow Guidance Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 font-serif-heading">
                Direct Manager Authority Workflow
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>1.</strong> Select Hall (Hall 1, Hall 2, or Combined Hall) &nbsp;•&nbsp;
                <strong>2.</strong> Tap date on the calendar &nbsp;•&nbsp;
                <strong>3.</strong> Toggle Available / Unavailable for Day (10 AM–3 PM), Evening (6 PM–10 PM), or Whole Day.
              </p>
              <p className="text-[11px] text-amber-900">
                All changes save instantly to localStorage and reflect on the public Availability page in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {modifiedDates.length > 0 && (
              <Button
                onClick={handleClearAll}
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-300 hover:bg-rose-50"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset All Overrides
              </Button>
            )}
          </div>
        </div>

        {/* The Master Manager-Controlled Availability Calendar */}
        <ManagerAvailabilityCalendar />

        {/* Manager-Modified Dates Log & Quick Action Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-base font-bold text-slate-900 font-serif-heading">
                Manager-Configured Dates ({modifiedDates.length})
              </h4>
              <p className="text-xs text-slate-500">
                Dates where you have customized availability from the default open state
              </p>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Default for untracked dates: <strong className="text-emerald-700">Available (Open)</strong>
            </span>
          </div>

          {modifiedDates.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">All Dates Open by Default</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No specific dates have been marked unavailable. Tap any date above to close sessions for maintenance or private reservations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Hall 1 (Day / Eve)</th>
                    <th className="py-3 px-3">Hall 2 (Day / Eve)</th>
                    <th className="py-3 px-3">Combined Status</th>
                    <th className="py-3 px-3">Private Manager Note</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modifiedDates.map((dateStr) => {
                    const item = entries[dateStr];
                    const h1Day = item.hall_1.day;
                    const h1Eve = item.hall_1.evening;
                    const h2Day = item.hall_2.day;
                    const h2Eve = item.hall_2.evening;
                    const combDay = h1Day && h2Day;
                    const combEve = h1Eve && h2Eve;

                    return (
                      <tr key={dateStr} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-semibold text-slate-900 font-mono">
                          {dateStr}
                        </td>

                        {/* Hall 1 status */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                h1Day ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Day: {h1Day ? 'OPEN' : 'CLOSED'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                h1Eve ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Eve: {h1Eve ? 'OPEN' : 'CLOSED'}
                            </span>
                          </div>
                        </td>

                        {/* Hall 2 status */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                h2Day ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Day: {h2Day ? 'OPEN' : 'CLOSED'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                h2Eve ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Eve: {h2Eve ? 'OPEN' : 'CLOSED'}
                            </span>
                          </div>
                        </td>

                        {/* Combined status */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              combDay && combEve
                                ? 'bg-emerald-100 text-emerald-800'
                                : combDay || combEve
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {combDay && combEve
                              ? 'Fully Available'
                              : combDay || combEve
                              ? 'Partial Open'
                              : 'Unavailable'}
                          </span>
                        </td>

                        {/* Note */}
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                          {item.notes || '—'}
                        </td>

                        {/* Reset action */}
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleResetDate(dateStr)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Reset this date back to default Available"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
