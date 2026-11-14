'use client';

import React from 'react';
import { Layers, Rocket, Radio, Sparkles } from 'lucide-react';
import { MISSION_SEGMENTS, MissionSegmentKey } from '@/data/segments';

const ICONS: Record<MissionSegmentKey, React.ElementType> = {
  space: Layers,
  launch: Rocket,
  ground: Radio,
  user: Sparkles,
};

interface MissionSegmentChipProps {
  segment: MissionSegmentKey;
  className?: string;
  showTooltip?: boolean;
}

export function MissionSegmentChip({
  segment,
  className = '',
  showTooltip = true,
}: MissionSegmentChipProps) {
  const meta = MISSION_SEGMENTS[segment];
  const Icon = ICONS[segment] || Layers;

  return (
    <span
      title={showTooltip ? meta.tooltip : undefined}
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-xs select-none cursor-help transition-all ${meta.badgeClass} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
}

