import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'outline-light' | 'outline-gold' | 'ghost' | 'danger' | 'gold' | 'luxury';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 gap-1.5 min-h-[40px]',
    md: 'text-sm px-5 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[50px]',
  };

  const variantStyles = {
    primary:
      'bg-[#173D35] text-white hover:bg-[#0F2722] active:bg-[#081815] focus:ring-[#C9AA72]/50 shadow-sm hover:shadow-md',
    gold:
      'bg-[#C9AA72] text-[#173D35] font-bold hover:bg-[#B89B65] active:bg-[#A88C56] focus:ring-[#C9AA72]/50 shadow-sm hover:shadow-md',
    secondary:
      'bg-[#EDE6D8] text-[#252525] hover:bg-[#E2DACB] border border-[#D9CDBB] focus:ring-[#C9AA72]/30',
    outline:
      'border border-[#C9AA72] bg-white text-[#173D35] hover:bg-[#F5F1E8] hover:border-[#B89B65] focus:ring-[#C9AA72]/30 shadow-xs font-semibold',
    'outline-light':
      'border border-white/60 bg-black/40 text-white hover:bg-white/15 hover:border-white focus:ring-white/40 shadow-xs font-semibold backdrop-blur-sm',
    'outline-gold':
      'border border-[#C9AA72] bg-[#122E27]/90 text-[#D9C194] hover:bg-[#1C463C] hover:text-white hover:border-[#D9C194] focus:ring-[#C9AA72]/40 shadow-xs font-semibold',
    ghost:
      'text-[#252525] hover:bg-[#F5F1E8] hover:text-[#173D35] active:bg-[#EDE6D8] focus:ring-[#C9AA72]/30',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 focus:ring-rose-500 shadow-sm',
    luxury:
      'bg-[#173D35] text-[#C9AA72] hover:bg-[#0F2722] border border-[#C9AA72]/50 focus:ring-[#C9AA72]/40 shadow-sm font-bold',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
