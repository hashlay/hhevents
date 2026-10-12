import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: 'glass' | 'dark' | 'emerald' | 'default';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  variant = 'default',
  ...props
}) => {
  const variantStyles = {
    glass:
      'bg-white/95 backdrop-blur-md border border-[#E2DACB] shadow-sm text-[#252525]',
    dark:
      'bg-[#252525] border border-[#383838] text-[#F5F1E8] shadow-xl',
    emerald:
      'bg-[#173D35] border border-[#245A4F] text-[#FAF8F5] shadow-xl',
    default:
      'bg-white border border-[#E2DACB] shadow-sm text-[#252525]',
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${variantStyles[variant]} ${
        hoverable ? 'hover:border-[#C9AA72] hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-6 pb-4 border-b border-[#E2DACB] ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-lg font-bold text-[#173D35] tracking-tight font-serif-heading ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-sm text-[#4A4A4A] mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-6 pt-4 border-t border-[#E2DACB] flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);
