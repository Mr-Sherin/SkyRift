import React from 'react';

export interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  label?: string;
  indicator?: boolean;
  color?: 'orange' | 'cyan' | 'slate' | 'emerald';
  divider?: boolean;
}

export const SectionLabel = React.forwardRef<HTMLDivElement, SectionLabelProps>(
  (
    {
      children,
      label,
      indicator = true,
      color = 'orange',
      divider = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const textColors = {
      orange: 'text-[#FF5A1F]',
      cyan: 'text-[#38BDF8]',
      slate: 'text-[#94A3B8]',
      emerald: 'text-[#10B981]',
    };

    const dotColors = {
      orange: 'bg-[#FF5A1F]',
      cyan: 'bg-[#38BDF8]',
      slate: 'bg-[#94A3B8]',
      emerald: 'bg-[#10B981]',
    };

    return (
      <div
        ref={ref}
        className={`flex items-center space-x-2 text-xs font-mono font-bold tracking-[0.2em] uppercase ${textColors[color]} select-none ${className}`}
        {...props}
      >
        {indicator && (
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[color]}`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[color]}`}
            />
          </span>
        )}
        <span>{children ?? label}</span>
        {divider && (
          <div className="flex-1 h-[1px] bg-[rgba(148,163,184,0.18)] ml-3" />
        )}
      </div>
    );
  }
);

SectionLabel.displayName = 'SectionLabel';

