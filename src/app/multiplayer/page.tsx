'use client';

import React from 'react';
import Link from 'next/link';
import { useGame } from '@/game/engine/GameContext';
import { Shield, Cpu, Eye, Radio, CheckCircle2, ArrowRight } from 'lucide-react';
import { sfx } from '@/lib/audio';

const ROLES = [
  {
    id: 'commander' as const,
    name: 'Flight Commander',
    icon: Shield,
    description: 'Leads overall mission targets, approves launch readiness, and makes high-stakes anomaly calls.',
    responsibilities: ['Mission Selection', 'Launch Authorization', 'Anomaly Decisions'],
  },
  {
    id: 'engineer' as const,
    name: 'Systems Engineer',
    icon: Cpu,
    description: 'Balances spacecraft weight, solar or RTG power, thermal survival, and Δv fuel margins.',
    responsibilities: ['Subsystem Assembly', 'Mass & Power Balance', 'Propulsion Margin'],
  },
  {
    id: 'science' as const,
    name: 'Lead Science Officer',
    icon: Eye,
    description: 'Selects cameras, radars, and spectrometers matched to the target planet to maximize science points.',
    responsibilities: ['Payload Matching', 'Storage Sizing', 'Science Yield'],
  },
  {
    id: 'flightOps' as const,
    name: 'Flight Ops Officer',
    icon: Radio,
    description: 'Plans Deep Space Network antenna links, tracks speed-of-light delays, and manages flight speed.',
    responsibilities: ['Antenna Selection', 'Downlink Tracking', 'Orbital Operations'],
  },
];

export default function MultiplayerPage() {
  const { activeRole, setActiveRole } = useGame();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col justify-between">
      <div>
        <div className="mb-6 pb-5 border-b border-rift-line flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono text-rift-orange font-bold uppercase tracking-[0.2em] mb-1">
              CREW ROLES // TEAMWORK MODE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-rift-text tracking-tight">
              MISSION ROLES &amp; CREW DECK
            </h1>
            <p className="mt-1.5 text-sm text-rift-muted max-w-2xl">
              Real space missions divide responsibilities across specialist stations. Choose your station role for solo play or local team coordination.
            </p>
          </div>

          <Link
            href="/hangar"
            onClick={() => sfx.playClick()}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-rift-orange hover:bg-rift-orangeHover text-white text-xs font-mono font-bold transition-colors shadow-hud-orange shrink-0 self-start"
          >
            <span>OPEN HANGAR</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isCurrent = activeRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => {
                  setActiveRole(role.id);
                  sfx.playClick();
                }}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-white border-rift-orange shadow-hud-orange ring-1 ring-rift-orange'
                    : 'bg-white border-rift-line hover:border-rift-lineDark shadow-hud'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-rift-surface border border-rift-line flex items-center justify-center text-rift-orange">
                      <Icon className="w-5 h-5" />
                    </div>
                    {isCurrent && (
                      <span className="flex items-center space-x-1 text-[10px] font-mono text-rift-orange font-bold bg-rift-orangeMuted px-2.5 py-1 rounded-full border border-rift-orange/25">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ACTIVE ROLE</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-black text-rift-text">{role.name}</h2>
                  <p className="text-xs sm:text-sm text-rift-muted mt-1.5 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-rift-line flex flex-wrap gap-1.5">
                    {role.responsibilities.map((resp, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-rift-surface text-rift-slate border border-rift-line"
                      >
                        {resp}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={`mt-5 w-full py-2.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                    isCurrent
                      ? 'bg-rift-orange text-white'
                      : 'bg-rift-slate text-white hover:bg-rift-text'
                  }`}
                >
                  {isCurrent ? 'ROLE ASSIGNED ✓' : 'ASSUME ROLE'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
