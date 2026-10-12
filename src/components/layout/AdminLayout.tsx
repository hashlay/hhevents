import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Calendar,
  Wrench,
  History,
  Settings,
  LogOut,
  Building2,
  ExternalLink,
  ShieldAlert,
  Menu,
  X,
  Sliders,
  Camera,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BackButton } from '../ui/BackButton';

interface AdminLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  backFallback?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  navigate,
  children,
  title,
  subtitle,
  actionButton,
  backFallback = '/admin/dashboard',
}) => {
  const { user, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Booking Requests', path: '/admin/bookings', icon: Inbox },
    { label: 'Tariff & Packages', path: '/admin/packages', icon: Package },
    { label: 'Availability Controls', path: '/admin/availability', icon: Sliders },
    { label: 'Master Calendar', path: '/admin/calendar', icon: Calendar },
    { label: 'Real Photos', path: '/admin/photos', icon: Camera },
    { label: 'Maintenance Hub', path: '/admin/maintenance', icon: Wrench },
    { label: 'Audit & History', path: '/admin/history', icon: History },
    { label: 'Venue Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isSubPage = currentPath !== '/admin/dashboard';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Admin Header */}
      <div className="lg:hidden bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          {isSubPage && (
            <BackButton
              fallback={backFallback}
              variant="dark"
              label=""
              ariaLabel="Go back to previous admin view"
              className="py-1 px-2.5"
            />
          )}
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm">H H Events</span>
            <span className="text-[10px] block text-amber-400 font-medium">ADMIN PORTAL</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded text-slate-400 hover:text-white"
            title="Public Site"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1.5 rounded text-white hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop & Mobile Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static lg:h-screen ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#173D35] text-[#C9AA72] flex items-center justify-center font-extrabold border border-[#C9AA72]/30 shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight font-serif-heading">
                  H H Events
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#C9AA72]">
                  Management Console
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#173D35] text-[#FAF8F5] font-semibold shadow-xs border-l-2 border-[#C9AA72]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C9AA72]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & bottom actions */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#173D35] text-[#C9AA72] flex items-center justify-center font-bold text-xs shrink-0 border border-[#C9AA72]/30">
                HH
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || user?.displayName || 'Venue Manager'}
                </p>
                <span className="text-[10px] text-[#C9AA72] block uppercase tracking-wider">
                  {user?.role?.replace('_', ' ') || 'Admin'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-2 px-3 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Switch to Public Website</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top Header Bar with Consistent Back Navigation */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            {isSubPage && (
              <BackButton
                fallback={backFallback}
                variant="light"
                label="Back"
                className="shrink-0"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actionButton && <div className="shrink-0">{actionButton}</div>}
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
};
