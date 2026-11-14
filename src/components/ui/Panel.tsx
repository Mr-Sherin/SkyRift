import React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glow' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  chamfer?: boolean;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      chamfer = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default:
        'bg-[#0A1228] border border-[rgba(148,163,184,0.16)] shadow-[0_8px_32px_0_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_0_24px_0_rgba(56,189,248,0.03)]',
      elevated:
        'bg-[#0D1733] border border-[rgba(56,189,248,0.3)] shadow-[0_12px_44px_0_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.12),inset_0_0_32px_0_rgba(56,189,248,0.05)]',
      glow:
        'bg-[#0A1228] border-2 border-[#FF5A1F] shadow-[0_0_30px_rgba(255,90,31,0.35),inset_0_1px_0_0_rgba(255,255,255,0.1)]',
      subtle:
        'bg-[#0E1836]/80 border border-[rgba(148,163,184,0.12)] shadow-[0_4px_16px_rgba(0,0,0,0.3)]',
    };

    const paddingStyles = {
      none: 'p-0',
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    const cornerRadius = chamfer ? 'clip-chamfer' : 'rounded-2xl';

    return (
      <div
        ref={ref}
        className={`relative ${cornerRadius} ${variantStyles[variant]} ${paddingStyles[padding]} text-[#F1F5F9] backdrop-blur-sm transition-all duration-200 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';

