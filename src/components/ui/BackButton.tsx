import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export interface BackButtonProps {
  label?: string;
  fallback?: string;
  variant?: 'light' | 'dark' | 'glass';
  className?: string;
  ariaLabel?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  fallback,
  variant = 'light',
  className = '',
  ariaLabel,
}) => {
  const { goBack } = useNavigation();

  const baseStyles =
    'group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#C9AA72]/40';

  const variantStyles = {
    light:
      'bg-white hover:bg-[#F5F1E8] text-[#252525] hover:text-[#173D35] border border-[#E2DACB] hover:border-[#C9AA72] shadow-xs',
    dark:
      'bg-[#173D35] hover:bg-[#0F2722] text-[#F5F1E8] border border-[#245A4F] shadow-xs',
    glass:
      'bg-white/80 hover:bg-white text-[#252525] border border-[#E2DACB] backdrop-blur-md shadow-xs',
  };

  return (
    <button
      type="button"
      onClick={() => goBack(fallback)}
      aria-label={ariaLabel || `Navigate back (${label})`}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 text-[#C9AA72] group-hover:-translate-x-1 transition-transform duration-200 shrink-0" />
      <span>{label}</span>
    </button>
  );
};
