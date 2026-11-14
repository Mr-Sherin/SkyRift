'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { getCmlByDifficulty } from '@/data/segments';

interface CmlBadgeProps {
  difficulty?: string;
  showExplanation?: boolean;
  className?: string;
  isGate?: boolean;
}

export function CmlBadge({
  difficulty,
  showExplanation = false,
  className = '',
  isGate = false,
}: CmlBadgeProps) {
  const meta = getCmlByDifficulty(difficulty);

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className="inline-flex items-center space-x-1.5">
        <span
          title={meta.explanation}
          className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider select-none cursor-help transition-all ${meta.badgeClass}`}
        >
          <ShieldCheck className="w-3 h-3 shrink-0" />
          <span>{isGate ? 'CML GATE' : meta.badgeLabel}</span>
        </span>
      </div>

      {showExplanation && (
        <p className="text-[11px] font-mono text-slate-300 leading-snug">
          {meta.explanation}
        </p>
      )}
    </div>
  );
}

