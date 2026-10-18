import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  Wrench,
  CheckCircle2,
  Plus,
  ArrowRight,
  Building2
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AvailabilityCalendar } from '../../components/calendar/AvailabilityCalendar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookingStatusBadge, TimeSlotBadge } from '../../components/ui/Badge';
import { getStoredBookings, getStoredMaintenance } from '../../services/bookingStorage';
import { syncBookingsFromServer } from '../../services/storageService';
import { BookingRequest } from '../../types';

interface AdminCalendarPageProps {
  navigate: (path: string) => void;
}

import { HallTarget } from '../../services/availabilityManager';

export const AdminCalendarPage: React.FC<AdminCalendarPageProps> = ({ navigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedHall, setSelectedHall] = useState<HallTarget>('hall_1');
  const [bookings, setBookings] = useState<BookingRequest[]>(getStoredBookings());
  const [maintenance, setMaintenance] = useState(getStoredMaintenance());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const fresh = await syncBookingsFromServer();
        if (mounted) {
          setBookings(fresh);
        }
      } catch (err) {
        if (mounted) {
          setBookings(getStoredBookings());
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter bookings strictly for the selected hall
  const hallBookingsOnDate = bookings.filter((b) => {
    const isDateMatch = b.date === selectedDate || b.eventDate === selectedDate;
    if (!isDateMatch) return false;

    if (selectedHall === 'hall_1') {
      return b.hall === 'hall_1' || b.hall === 'both';
    }
    if (selectedHall === 'hall_2') {
      return b.hall === 'hall_2' || b.hall === 'both';
    }
    // Combined hall shows any bookings taking either or both
    return true;
  });

  // Other hall bookings (if any) to explain independent status
  const otherHallBookings = bookings.filter((b) => {
    const isDateMatch = b.date === selectedDate || b.eventDate === selectedDate;
    if (!isDateMatch) return false;
    if (selectedHall === 'hall_1') return b.hall === 'hall_2';
    if (selectedHall === 'hall_2') return b.hall === 'hall_1';
    return false;
  });

  const selectedMaintenance = maintenance.filter((m) => m.scheduledDate === selectedDate);

  const getHallTitle = (h: HallTarget) => {
    switch (h) {
      case 'hall_1':
        return 'Hall 1 (Gents Wing)';
      case 'hall_2':
        return 'Hall 2 (Ladies Wing)';
      case 'both':
        return 'Combined Hall (Full Campus)';
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/calendar"
      navigate={navigate}
      title="Master Hall Schedule Calendar"
      subtitle="Comprehensive view of Hall 1 and Hall 2 bookings, session slots, and maintenance turnover"
      actionButton={
        <Button
          onClick={() => navigate('/admin/maintenance')}
          variant="outline"
          size="sm"
          leftIcon={<Wrench className="w-4 h-4" />}
        >
          Schedule Maintenance
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Interactive Calendar on Left (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <AvailabilityCalendar
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            selectedHall={selectedHall}
            onSelectHall={(h) => setSelectedHall(h)}
          />
        </div>

        {/* Date Inspector Sidebar (1 col) */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                  {getHallTitle(selectedHall)}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedDate}</h3>
              </div>
              <CalendarDays className="w-5 h-5 text-slate-400" />
            </div>

            {/* Scheduled events on this day for the selected hall */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Bookings Scheduled ({hallBookingsOnDate.length})
                </h4>
                <span className="text-[10px] font-semibold text-[#173D35] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedHall === 'hall_1' ? 'Hall 1 View' : selectedHall === 'hall_2' ? 'Hall 2 View' : 'Combined View'}
                </span>
              </div>

              {hallBookingsOnDate.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{b.id}</span>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <h5 className="font-semibold text-slate-900">
                    {b.customerName || b.applicantName}
                  </h5>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="font-semibold text-[#173D35]">
                      {b.hall === 'hall_1' ? 'Hall 1' : b.hall === 'hall_2' ? 'Hall 2' : 'Both Halls'}
                    </span>
                    <span className="font-mono uppercase font-bold text-slate-700">
                      {b.slot === 'day' ? '10 AM–3 PM' : '6 PM–10 PM'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    {b.additionalInfo || b.eventTitle || 'Event'}
                  </p>
                </div>
              ))}

              {hallBookingsOnDate.length === 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>No Bookings in {getHallTitle(selectedHall)}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    This space is open and available for reservations on this date.
                  </p>
                  {otherHallBookings.length > 0 && (
                    <p className="text-[10px] text-slate-500 pt-1 border-t border-emerald-200/80">
                      (Note: {otherHallBookings[0].hall === 'hall_1' ? 'Hall 1' : 'Hall 2'} has a separate reservation, but {selectedHall === 'hall_1' ? 'Hall 1' : 'Hall 2'} is independent).
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Maintenance tasks on this day */}
            {selectedMaintenance.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Maintenance Tasks ({selectedMaintenance.length})
                </h4>
                {selectedMaintenance.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                    <span className="font-bold text-slate-900 block">{m.title}</span>
                    <span className="text-[11px] text-amber-800 font-medium">Assigned: {m.assignedTo || m.technicianName}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
