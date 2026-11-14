import React from 'react';
import { SourceInfoBadge } from './SourceInfoBadge';
import { SourceStatus } from '@/game/types';

export interface HudStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  status?: 'good' | 'warn' | 'danger' | 'info' | 'orange' | 'neutral';
  icon?: React.ReactNode;
  sourceStatus?: SourceStatus;
  sourceUrl?: string;
  sourceCitation?: string;
}

export const HudStat = React.forwardRef<HTMLDivElement, HudStatProps>(
  (
    {
      label,
      value,
      unit,
      subtext,
      status = 'neutral',
      icon,
      sourceStatus,
      sourceUrl,
      sourceCitation,
      className = '',
      ...props
    },
    ref
  ) => {
    const statusConfig = {
      good: {
        text: 'text-[#10B981]',
        dot: 'bg-[#10B981] shadow-[0_0_10px_#10B981]',
        border: 'border-[#10B981]/30',
        bg: 'bg-[#10B981]/10',
      },
      warn: {
        text: 'text-[#F59E0B]',
        dot: 'bg-[#F59E0B] shadow-[0_0_10px_#F59E0B]',
        border: 'border-[#F59E0B]/30',
        bg: 'bg-[#F59E0B]/10',
      },
      danger: {
        text: 'text-[#EF4444]',
        dot: 'bg-[#EF4444] shadow-[0_0_10px_#EF4444]',
        border: 'border-[#EF4444]/30',
        bg: 'bg-[#EF4444]/10',
      },
      info: {
        text: 'text-[#38BDF8]',
        dot: 'bg-[#38BDF8] shadow-[0_0_10px_#38BDF8]',
        border: 'border-[#38BDF8]/30',
        bg: 'bg-[#38BDF8]/10',
      },
      orange: {
        text: 'text-[#FF5A1F]',
        dot: 'bg-[#FF5A1F] shadow-[0_0_10px_#FF5A1F]',
        border: 'border-[#FF5A1F]/40',
        bg: 'bg-[#FF5A1F]/10',
      },
      neutral: {
        text: 'text-[#F1F5F9]',
        dot: 'bg-slate-400',
        border: 'border-slate-700/50',
        bg: 'bg-slate-800/40',
      },
    };

    const currentStatus = statusConfig[status];

    return (
      <div
        ref={ref}
        className={`p-3 sm:p-3.5 rounded-xl bg-[#0A1228] border ${currentStatus.border} shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex flex-col justify-between transition-all ${className}`}
        {...props}
      >
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center space-x-1 min-w-0">
            <span
              title={label}
              className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-[#94A3B8] uppercase truncate"
            >
              {label}
            </span>
            {sourceStatus && (
              <SourceInfoBadge
                status={sourceStatus}
                url={sourceUrl}
                citation={sourceCitation}
                label={label}
                className="shrink-0"
              />
            )}
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            {icon && <span className="text-[#94A3B8]">{icon}</span>}
            <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
          </div>
        </div>

        <div className="flex items-baseline space-x-1.5">
          <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${currentStatus.text}`}>
            {value}
          </span>
          {unit && (
            <span className="text-xs font-mono text-[#94A3B8] font-bold uppercase tracking-wider">
              {unit}
            </span>
          )}
        </div>

        {subtext && (
          <div className="text-xs text-[#94A3B8] mt-1 font-mono leading-tight">
            {subtext}
          </div>
        )}
      </div>
    );
  }
);

HudStat.displayName = 'HudStat';

