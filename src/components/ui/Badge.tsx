import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'good' | 'warn' | 'warning' | 'danger' | 'info' | 'orange' | 'neutral' | 'outline';
  pulse?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'neutral',
      pulse = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const activeVariant = variant === 'warning' ? 'warn' : variant === 'outline' ? 'neutral' : variant;
    const variantStyles = {
      good: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      warn: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      danger: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
      info: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]',
      orange:
        'bg-[#FF5A1F]/15 text-[#FF5A1F] border-[#FF5A1F]/50 shadow-[0_0_12px_rgba(255,90,31,0.25)]',
      neutral: 'bg-slate-800/60 text-[#CBD5E1] border-slate-700/60',
    };

    const dotColors = {
      good: 'bg-[#10B981]',
      warn: 'bg-[#F59E0B]',
      danger: 'bg-[#EF4444]',
      info: 'bg-[#38BDF8]',
      orange: 'bg-[#FF5A1F]',
      neutral: 'bg-slate-400',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-xs select-none ${variantStyles[activeVariant]} ${className}`}
        {...props}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[activeVariant]} ${
            pulse ? 'animate-pulse' : ''
          }`}
        />
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';

