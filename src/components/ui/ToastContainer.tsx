import React from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const content = (
    <div
      className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-md w-[calc(100vw-2.5rem)] sm:w-full pointer-events-none"
      style={{ zIndex: 99999 }}
      aria-live="assertive"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border-2 shadow-2xl transition-all duration-200 animate-in slide-in-from-bottom-3 ${
              isSuccess
                ? 'bg-[#064e3b] text-white border-emerald-500 shadow-emerald-950/60'
                : isError
                ? 'bg-[#7f1d1d] text-white border-rose-500 shadow-rose-950/70'
                : isWarning
                ? 'bg-[#78350f] text-white border-amber-500 shadow-amber-950/60'
                : 'bg-[#0f172a] text-white border-[#C9AA72] shadow-slate-950/70'
            }`}
            style={{
              boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.45), 0 10px 15px -5px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-200 stroke-[2.5]" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-300" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-300" />}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title ? (
                <h5 className="text-sm font-bold tracking-tight mb-0.5">{toast.title}</h5>
              ) : isError ? (
                <h5 className="text-xs font-bold uppercase tracking-wider text-rose-200 mb-0.5">Attention Required</h5>
              ) : null}
              <p className="text-xs text-slate-100 font-medium leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};
