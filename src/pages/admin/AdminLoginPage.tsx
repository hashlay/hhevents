import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { BackButton } from '../../components/ui/BackButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigation } from '../../context/NavigationContext';

interface AdminLoginPageProps {
  navigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ navigate }) => {
  const { goBack } = useNavigation();
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // If already authenticated, redirect to admin dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !phone.trim() || !password.trim()) {
      setErrorMessage('Please provide Manager Email, Phone Number, and Password.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email.trim(), phone.trim(), password);
      showToast('Welcome to H H Events & Conventions Management Console', 'success', 'Authenticated');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage('Invalid administrative credentials. Please verify your email, phone, and password.');
      showToast('Invalid administrative credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061410] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Refined subtle ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-[#173D35]/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-[#C9AA72]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10 space-y-6">
        {/* Minimal Top Navigation */}
        <div className="flex items-center justify-between">
          <BackButton fallback="/" variant="dark" label="Public Website" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0D241F] border border-[#C9AA72]/20 text-[#C9AA72] text-[10.5px] font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Executive Console</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src="/assets/branding/hh-logo.png"
            alt="H H Events"
            className="h-12 sm:h-14 w-auto object-contain mx-auto drop-shadow-md"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#FAF8F5] tracking-tight font-serif-heading">
              H H Events &amp; Conventions
            </h1>
            <p className="text-[10.5px] text-[#C9AA72] font-semibold tracking-[0.22em] uppercase mt-0.5">
              Executive Management Portal
            </p>
          </div>
        </div>

        {/* Luxury Minimalist Login Card */}
        <div className="p-6 sm:p-7 bg-[#091D17]/90 backdrop-blur-xl border border-[#C9AA72]/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.55)] space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Access Denied:</strong>
                <span className="text-[11px] leading-relaxed">{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Manager Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Manager Email
              </label>
              <div className="relative flex items-center bg-[#061410] border border-[#173D35] rounded-xl focus-within:border-[#C9AA72] focus-within:ring-1 focus-within:ring-[#C9AA72] transition-all">
                <div className="pl-3.5 flex items-center pointer-events-none text-[#C9AA72]">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="manager@hhevents.in"
                  className="w-full pl-2.5 pr-4 py-2.5 bg-transparent text-xs sm:text-sm text-[#FAF8F5] placeholder-slate-500 focus:outline-none"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Registered Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Registered Phone Number
              </label>
              <div className="relative flex items-center bg-[#061410] border border-[#173D35] rounded-xl focus-within:border-[#C9AA72] focus-within:ring-1 focus-within:ring-[#C9AA72] transition-all">
                <div className="pl-3.5 flex items-center pointer-events-none text-[#C9AA72]">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="10-digit mobile number"
                  className="w-full pl-2.5 pr-4 py-2.5 bg-transparent text-xs sm:text-sm text-[#FAF8F5] placeholder-slate-500 focus:outline-none"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* Security Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Security Password
              </label>
              <div className="relative flex items-center bg-[#061410] border border-[#173D35] rounded-xl focus-within:border-[#C9AA72] focus-within:ring-1 focus-within:ring-[#C9AA72] transition-all">
                <div className="pl-3.5 flex items-center pointer-events-none text-[#C9AA72]">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-2.5 pr-10 py-2.5 bg-transparent text-xs sm:text-sm text-[#FAF8F5] placeholder-slate-500 focus:outline-none"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 pr-3 flex items-center text-slate-400 hover:text-[#C9AA72] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#173D35] text-[#C9AA72] focus:ring-[#C9AA72] bg-[#061410] w-3.5 h-3.5 cursor-pointer accent-[#C9AA72]"
                />
                <span className="text-[11.5px] text-slate-300">Remember this device (7 days)</span>
              </label>
            </div>

            {/* Refined Luxury Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#C9AA72] hover:bg-[#D4B985] text-[#071512] transition-all duration-200 shadow-[0_4px_20px_rgba(201,170,114,0.22)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#071512] border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Minimal Return Link */}
          <div className="pt-3 border-t border-[#173D35]/60 text-center">
            <button
              onClick={() => goBack('/')}
              className="text-[11px] text-slate-400 hover:text-[#C9AA72] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>&larr; Return to Public Website</span>
            </button>
          </div>
        </div>

        {/* Discreet Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C9AA72]/60" />
          <span>256-bit Encrypted Management Session</span>
        </div>
      </div>
    </div>
  );
};
