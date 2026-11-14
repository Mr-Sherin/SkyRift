import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  unit?: string;
  status?: 'auto' | 'good' | 'warn' | 'danger' | 'orange';
  variant?: 'default' | 'good' | 'warn' | 'danger' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  showPercent?: boolean;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      label,
      unit,
      status,
      variant,
      size = 'md',
      showPercent = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    // Determine status automatically if 'auto'
    const resolveStatus = () => {
      const active = status || (variant === 'default' ? 'good' : variant) || 'auto';
      if (active !== 'auto') return active;
      if (percentage <= 25) return 'danger';
      if (percentage <= 50) return 'warn';
      return 'good';
    };

    const activeStatus = resolveStatus();

    const barColors = {
      good: 'bg-[#10B981] shadow-[0_0_12px_#10B981]',
      warn: 'bg-[#F59E0B] shadow-[0_0_12px_#F59E0B]',
      danger: 'bg-[#EF4444] shadow-[0_0_14px_#EF4444]',
      orange: 'bg-[#FF5A1F] shadow-[0_0_12px_#FF5A1F]',
    };

    const heightStyles = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    };

    return (
      <div ref={ref} className={`w-full space-y-1.5 ${className}`} {...props}>
        {(label || showPercent) && (
          <div className="flex items-center justify-between text-xs font-mono font-bold tracking-wider">
            {label && (
              <span className="text-[#94A3B8] uppercase">{label}</span>
            )}
            {showPercent && (
              <span className="text-[#F1F5F9]">
                {Math.round(value)}
                {unit ? ` ${unit}` : '%'}
              </span>
            )}
          </div>
        )}

        <div
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={max}
          className={`w-full ${heightStyles[size]} rounded-full bg-[#070E24] border border-[rgba(148,163,184,0.18)] overflow-hidden p-[1px]`}
        >
          <div
            style={{ width: `${percentage}%` }}
            className={`h-full rounded-full transition-all duration-300 ${barColors[activeStatus]}`}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

