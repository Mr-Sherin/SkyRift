'use client';

import React, { useState, useEffect } from 'react';
import {
  CrewTrust,
  getCrewTrust,
  StorySpeaker,
  CHARACTERS,
} from '@/data/story';
import { PORTRAIT_CONFIG } from '@/components/story/DialogueBox';
import { ShieldCheck, Sparkles, HeartHandshake, ChevronDown, ChevronUp } from 'lucide-react';
import { Panel } from '@/components/ui';

const SPEAKER_FOCUS: Record<StorySpeaker, string> = {
  'Sofia Reyes': 'Values flight discipline, trajectory security, and mission safety margin.',
  'Kai Mercer': 'Values spacecraft hull health, conservative battery use, and thermal protection.',
  'Dr. Lena Okafor': 'Values bold science observations, sensor calibration, and deep-space discoveries.',
  'Ravi Anand': 'Values ground-station comms links, downlink throughput, and telemetry integrity.',
  'Chair Voss': 'Values budget discipline, low resource expenditure, and cost stewardship.',
};

interface CrewTrustMeterProps {
  compact?: boolean;
  className?: string;
  showTitle?: boolean;
}

export function CrewTrustMeter({
  compact = false,
  className = '',
  showTitle = true,
}: CrewTrustMeterProps) {
  const [trust, setTrust] = useState<CrewTrust>(getCrewTrust());
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);

  useEffect(() => {
    setTrust(getCrewTrust());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CrewTrust>;
      if (customEvent.detail) {
        setTrust(customEvent.detail);
      } else {
        setTrust(getCrewTrust());
      }
    };

    window.addEventListener('skyrift_crew_trust_updated', handleUpdate);
    return () => {
      window.removeEventListener('skyrift_crew_trust_updated', handleUpdate);
    };
  }, []);

  const speakers = Object.keys(trust) as StorySpeaker[];

  if (compact) {
    return (
      <Panel variant="default" className={`p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-rift-orange" />
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              CREW TRUST
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-mono text-slate-400 hover:text-rift-orange flex items-center space-x-0.5 transition-colors"
          >
            <span>{isExpanded ? 'COLLAPSE' : 'EXPAND'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Compact Micro-Row */}
        <div className="grid grid-cols-5 gap-1.5">
          {speakers.map((speaker) => {
            const val = trust[speaker];
            const cfg = PORTRAIT_CONFIG[speaker];
            return (
              <div
                key={speaker}
                title={`${speaker}: ${val}% Trust — ${SPEAKER_FOCUS[speaker]}`}
                className="flex flex-col items-center p-1.5 rounded-lg bg-[#050A1C] border border-[rgba(148,163,184,0.15)] hover:border-rift-orange transition-all cursor-help"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${cfg.gradient} text-white text-[9px] font-mono font-black flex items-center justify-center shadow-xs mb-1`}
                >
                  {cfg.initials}
                </div>
                <span className="text-[10px] font-mono font-bold text-white">
                  {val}%
                </span>
                <div className="w-full h-1 rounded-full bg-[#0D1733] overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      val >= 70
                        ? 'bg-emerald-400'
                        : val >= 40
                        ? 'bg-rift-orange'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {isExpanded && (
          <div className="mt-3 pt-2.5 border-t border-[rgba(148,163,184,0.15)] space-y-2">
            {speakers.map((speaker) => {
              const val = trust[speaker];
              const cfg = PORTRAIT_CONFIG[speaker];
              const char = CHARACTERS[speaker];
              return (
                <div key={speaker} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-300 truncate">
                      {char.callsign} &bull; {speaker}
                    </span>
                    <span
                      className={`font-black ${
                        val >= 70
                          ? 'text-emerald-400'
                          : val >= 40
                          ? 'text-white'
                          : 'text-rose-400'
                      }`}
                    >
                      {val}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#050A1C] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        val >= 70
                          ? 'bg-emerald-400'
                          : val >= 40
                          ? 'bg-rift-orange'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    );
  }

  // Full Expanded Display (for Debrief or Story Modals)
  return (
    <Panel variant="default" className={`p-5 sm:p-6 ${className}`}>
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[rgba(148,163,184,0.18)]">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-4 h-4 text-rift-orange" />
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-slate-300 uppercase">
              CREW TRUST &amp; RELATIONSHIPS
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            AFFECTED BY IN-FLIGHT CHOICES &amp; ANOMALIES
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {speakers.map((speaker) => {
          const val = trust[speaker];
          const cfg = PORTRAIT_CONFIG[speaker];
          const char = CHARACTERS[speaker];
          const focus = SPEAKER_FOCUS[speaker];

          const statusBadge =
            val >= 75
              ? { label: 'DEVOTED', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' }
              : val >= 55
              ? { label: 'CONFIDENT', bg: 'bg-teal-950/60 text-teal-300 border-teal-500/30' }
              : val >= 40
              ? { label: 'NEUTRAL', bg: 'bg-slate-800 text-slate-300 border-slate-700' }
              : { label: 'STRAINED', bg: 'bg-rose-950/60 text-rose-300 border-rose-500/30' };

          return (
            <div
              key={speaker}
              className="p-3.5 rounded-xl bg-[#050A1C] border border-[rgba(148,163,184,0.18)] flex flex-col justify-between hover:border-rift-orange/60 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${cfg.gradient} text-white text-xs font-mono font-black flex items-center justify-center shadow-sm`}
                  >
                    {cfg.initials}
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                <div className="font-bold text-xs text-white truncate">
                  {speaker}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {char.role}
                </div>

                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-400 font-bold">TRUST LEVEL</span>
                    <span className="font-black text-white">{val}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0D1733] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        val >= 70
                          ? 'bg-emerald-400'
                          : val >= 40
                          ? 'bg-rift-orange'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[10px] text-slate-400 leading-tight italic pt-2 border-t border-[rgba(148,163,184,0.15)]">
                {focus}
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

