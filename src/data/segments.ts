import React from 'react';

export type MissionSegmentKey = 'space' | 'launch' | 'ground' | 'user';

export interface MissionSegmentMeta {
  key: MissionSegmentKey;
  label: string;
  shortTitle: string;
  tooltip: string;
  accentHex: string;
  badgeClass: string;
}

export const MISSION_SEGMENTS: Record<MissionSegmentKey, MissionSegmentMeta> = {
  space: {
    key: 'space',
    label: 'SPACE SEGMENT',
    shortTitle: 'Spacecraft & Payloads',
    tooltip:
      'Space Segment: The orbiting spacecraft bus, science instruments, avionics, power generation, and propulsion hardware operating in the target space environment.',
    accentHex: '#38BDF8',
    badgeClass: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]',
  },
  launch: {
    key: 'launch',
    label: 'LAUNCH SEGMENT',
    shortTitle: 'Booster & Ascent',
    tooltip:
      'Launch Segment: The booster, launch vehicle infrastructure, and ascent trajectory required to place the spacecraft into its initial orbital insertion.',
    accentHex: '#FF5A1F',
    badgeClass: 'bg-[#FF5A1F]/15 text-[#FF5A1F] border-[#FF5A1F]/40 shadow-[0_0_12px_rgba(255,90,31,0.2)]',
  },
  ground: {
    key: 'ground',
    label: 'GROUND SEGMENT',
    shortTitle: 'Tracking & Telemetry',
    tooltip:
      'Ground Segment: Ground stations, tracking networks (e.g. Deep Space Network & Near Space Network), antennas, and mission operations centers receiving downlink data.',
    accentHex: '#10B981',
    badgeClass: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
  },
  user: {
    key: 'user',
    label: 'USER SEGMENT',
    shortTitle: 'Science Discovery',
    tooltip:
      'User Segment: Principal investigators, science operations centers, researchers, and end-users processing observation telemetry into peer-reviewed discoveries.',
    accentHex: '#F59E0B',
    badgeClass: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
  },
};

export interface CmlMeta {
  level: string;
  title: string;
  badgeLabel: string;
  explanation: string;
  badgeClass: string;
}

export function getCmlByDifficulty(difficulty?: string): CmlMeta {
  const norm = (difficulty || '').toLowerCase();
  if (norm.includes('begin')) {
    return {
      level: 'CML 1-2',
      title: 'Idea and feasibility',
      badgeLabel: 'CML 1-2 // Idea & Feasibility',
      explanation:
        'CML 1-2: Formulating initial science objectives, mission architecture, and feasibility concepts.',
      badgeClass: 'bg-sky-950/70 text-sky-300 border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]',
    };
  }
  if (norm.includes('inter') || norm.includes('stand')) {
    return {
      level: 'CML 3',
      title: 'Trade study',
      badgeLabel: 'CML 3 // Trade Study',
      explanation:
        'CML 3: Evaluating engineering trade studies, subsystem margins, and baseline vehicle architectures.',
      badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    };
  }
  return {
    level: 'CML 4',
    title: 'Point design',
    badgeLabel: 'CML 4 // Point Design',
    explanation:
      'CML 4: Validating a point design with integrated subsystem parameters and formal risk reduction.',
    badgeClass: 'bg-orange-950/70 text-orange-300 border-orange-500/40 shadow-[0_0_10px_rgba(255,90,31,0.25)]',
  };
}

