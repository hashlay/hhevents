import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Calendar,
  Wrench,
  History,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sliders,
  Camera,
  Package,
  Activity,
  Layers,
  Sparkles,
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
  const [connectionStatus, setConnectionStatus] = React.useState<'online' | 'offline' | 'checking'>('checking');

  React.useEffect(() => {
    let isMounted = true;
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/health');
        if (isMounted) {
          setConnectionStatus(res.ok ? 'online' : 'offline');
        }
      } catch {
        if (isMounted) {
          setConnectionStatus('offline');
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileSidebarOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileSidebarOpen]);

  // Streamlined Senior-Friendly Navigation
  const primaryNavigation = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Bookings', path: '/admin/bookings', icon: Inbox },
    { label: 'Calendar', path: '/admin/calendar', icon: Calendar },
    { label: 'Hall Rates', path: '/admin/packages', icon: Package },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const secondaryTools = [
    { label: 'Hall Availability', path: '/admin/availability', icon: Sliders },
    { label: 'Venue Photos', path: '/admin/photos', icon: Camera },
    { label: 'Maintenance Log', path: '/admin/maintenance', icon: Wrench },
    { label: 'Activity History', path: '/admin/history', icon: History },
  ];

  const [showMoreTools, setShowMoreTools] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isSubPage = currentPath !== '/admin/dashboard' && currentPath !== '/admin';

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col lg:flex-row text-[#252525]">
      {/* Mobile Admin Top Navigation Bar */}
      <div className="lg:hidden bg-[#0B1E19] text-[#FAF8F5] p-3.5 sm:p-4 flex items-center justify-between sticky top-0 z-30 shadow-md border-b border-[#183E34]">
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
          <img
            src="/assets/branding/hh-logo.png"
            alt="HH Logo"
            className="h-7 w-auto object-contain shrink-0"
          />
          <div>
            <span className="font-bold text-sm block leading-tight">H H Events</span>
            <span className="text-[9px] block text-[#C9AA72] font-semibold tracking-wider uppercase">MANAGEMENT CONSOLE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#123028]"
            title="Switch to Public Website"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1.5 rounded-lg text-white hover:bg-[#123028]"
            aria-label="Toggle navigation menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5 text-[#C9AA72]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 lg:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Desktop & Mobile Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0B1E19] text-slate-300 flex flex-col justify-between transition-transform duration-200 border-r border-[#183E34] lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Brand header */}
          <div className="p-5 border-b border-[#183E34] flex items-center justify-between bg-[#081814]">
            <div className="flex items-center gap-3">
              <img
                src="/assets/branding/hh-logo.png"
                alt="HH Events Official Logo"
                className="h-8 w-auto object-contain shrink-0"
              />
              <div className="min-w-0">
                <span className="text-sm font-bold text-white tracking-tight font-serif-heading block truncate">
                  H H Events
                </span>
                <span className="block text-[9px] uppercase font-bold tracking-[0.16em] text-[#C9AA72]">
                  Executive Console
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

          {/* Streamlined Primary Navigation */}
          <div className="p-3.5 space-y-2">
            <nav className="space-y-1.5">
              {primaryNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#173D35] text-white shadow-xs border-l-4 border-[#C9AA72]'
                        : 'text-slate-300 hover:bg-[#123028] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#C9AA72]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Optional Collapsible Secondary Tools */}
            <div className="pt-4 border-t border-[#183E34]/80">
              <button
                onClick={() => setShowMoreTools(!showMoreTools)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span className="uppercase tracking-wider text-[10px]">More Tools</span>
                <span className="text-xs">{showMoreTools ? '−' : '+'}</span>
              </button>

              {showMoreTools && (
                <div className="mt-1 space-y-1 pl-2 animate-in fade-in duration-150">
                  {secondaryTools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = currentPath === tool.path;
                    return (
                      <button
                        key={tool.path}
                        onClick={() => {
                          navigate(tool.path);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-[#173D35] text-white'
                            : 'text-slate-400 hover:bg-[#123028] hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-[#C9AA72]" />
                        <span className="truncate">{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User profile & bottom actions */}
        <div className="p-3.5 border-t border-[#183E34] bg-[#081814] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0D241F] border border-[#1E4D41]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#173D35] text-[#D9C194] flex items-center justify-center font-bold text-xs shrink-0 border border-[#C9AA72]/40">
                HH
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {user?.name || user?.displayName || 'Venue Manager'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-[#C9AA72] block uppercase tracking-wider font-medium">
                    Verified Manager
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-[#14332B]"
              title="Sign Out of Console"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-2 px-3 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#123028] border border-[#183E34] transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#C9AA72]" />
            <span>Switch to Public Website</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top Header Bar with Consistent Back Navigation */}
        <div className="bg-white border-b border-[#E2DACB] px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#173D35] tracking-tight font-serif-heading">{title}</h1>
                {connectionStatus === 'online' ? (
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Server Online</span>
                  </div>
                ) : connectionStatus === 'offline' ? (
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>Server Offline</span>
                  </div>
                ) : (
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold">
                    <span>Checking...</span>
                  </div>
                )}
              </div>
              {subtitle && <p className="text-xs text-[#737373] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actionButton && <div className="shrink-0">{actionButton}</div>}
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
};
