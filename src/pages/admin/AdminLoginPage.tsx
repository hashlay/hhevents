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
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
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
    <div className="min-h-screen bg-[#071512] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-[#173D35]/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#C9AA72]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <BackButton fallback="/" variant="dark" label="Public Website" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#122E27] border border-[#C9AA72]/30 text-[#D9C194] text-[11px] font-semibold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9AA72]" />
            <span>Secure Portal</span>
          </div>
        </div>

        {/* Brand header */}
        <div className="text-center space-y-2">
          {/* Luxury Monogram Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#173D35] to-[#0A1E19] border border-[#C9AA72]/50 text-[#F5F1E8] flex items-center justify-center mx-auto shadow-xl shadow-black/40">
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="font-serif-heading font-extrabold text-lg tracking-widest text-[#D9C194]">HH</span>
              <span className="w-5 h-[1.5px] bg-[#C9AA72]/70 mt-1" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif-heading pt-1">
            H H Events &amp; Conventions
          </h1>
          <p className="text-xs text-[#C9AA72] font-bold tracking-[0.2em] uppercase">
            Executive Operations Suite
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Authorized administrative access for bookings, scheduling, tariff, and hall operations.
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 md:p-8 bg-[#0D241F]/90 backdrop-blur-xl border border-[#C9AA72]/30 text-slate-100 shadow-2xl rounded-2xl">
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Access Verification Failed:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Manager Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Manager Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-[#C9AA72]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="manager@hhevents.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#071512] border border-[#1B453C] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9AA72] focus:border-transparent transition-all"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Manager Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Registered Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 text-[#C9AA72]" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="10-digit mobile number"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#071512] border border-[#1B453C] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9AA72] focus:border-transparent transition-all"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* Manager Password with Show/Hide Control */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-[#C9AA72]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-[#071512] border border-[#1B453C] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9AA72] focus:border-transparent transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="gold"
                size="lg"
                isLoading={isLoading}
                className="w-full justify-center text-[#071512] font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Console
              </Button>
            </div>
          </form>

          {/* Return link */}
          <div className="mt-6 pt-4 border-t border-[#1B453C] text-center">
            <button
              onClick={() => goBack('/')}
              className="text-xs text-slate-400 hover:text-[#C9AA72] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>&larr; Return to Public Website</span>
            </button>
          </div>
        </Card>

        {/* Security watermark */}
        <p className="text-center text-[11px] text-slate-500">
          Strictly restricted to authorized administrative personnel of H H Events &amp; Conventions.
        </p>
      </div>
    </div>
  );
};
