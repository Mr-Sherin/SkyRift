'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  ChevronDown,
  Info,
  BookOpen,
  Sparkles,
  HelpCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { sfx } from '@/lib/audio';
import { useDetailLevel } from '@/lib/useDetailLevel';

export interface MissionCoachProps {
  title?: string;
  badge?: string;
  summary?: string;
  tips?: string[];
  whyItMatters?: string;
  whatRealMissionsDo?: string;
  formula?: {
    name: string;
    equation: string;
    workedExample?: string;
  };
  chips?: React.ReactNode;
  forceOpen?: boolean;
  className?: string;
}

export function MissionCoachPanel({
  title = 'Mission Coach',
  badge = 'LEARNING BRIEF',
  summary,
  tips = [],
  whyItMatters,
  whatRealMissionsDo,
  formula,
  chips,
  forceOpen = false,
  className = '',
}: MissionCoachProps) {
  const { isFull } = useDetailLevel();
  const [userToggled, setUserToggled] = useState<boolean | null>(null);

  // If forceOpen is true (e.g. blocker or anomaly), or user has FULL detail mode enabled, default to open
  const isOpen = userToggled !== null ? userToggled : (forceOpen || isFull);

  const toggle = () => {
    sfx.playClick();
    setUserToggled(!isOpen);
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isOpen
          ? 'bg-[#0A1228]/95 border-slate-700/80 shadow-2xl backdrop-blur-md'
          : 'bg-[#0A1228]/80 border-slate-800/80 hover:border-slate-700 backdrop-blur-sm'
      } ${className}`}
    >
      {/* Header Strip - Clickable within 1 click */}
      <div
        onClick={toggle}
        className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-1.5 rounded-lg bg-rift-orange/15 text-rift-orange border border-rift-orange/30 shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider shrink-0">
                {badge}
              </span>
              {forceOpen && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 uppercase shrink-0">
                  ATTENTION REQUIRED
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-200 truncate font-sans">
              {title}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-auto">
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-700/60">
            <span className="text-xs font-mono text-slate-400">
              {isOpen ? 'COLLAPSE' : 'EXPAND'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-rift-orange' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800/70 space-y-3 font-sans text-xs">
          {/* Always display chips when expanded */}
          {chips && (
            <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800/60">
              {chips}
            </div>
          )}

          {/* Summary / Lead */}
          {summary && (
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {summary}
            </p>
          )}

          {/* Educational Tips List */}
          {tips.length > 0 && (
            <div className="space-y-1.5 bg-[#070E24]/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3 h-3 text-rift-orange" />
                <span>FLIGHT ARCHITECTURE ADVICE</span>
              </div>
              <ul className="space-y-1 text-slate-300 font-sans leading-relaxed">
                {tips.map((t, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-rift-orange font-bold font-mono text-xs">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Why This Matters Section */}
          {whyItMatters && (
            <div className="p-3 rounded-xl bg-[#0D1733]/90 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Info className="w-3 h-3" />
                <span>WHY THIS MATTERS</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                {whyItMatters}
              </p>
            </div>
          )}

          {/* What Real Missions Do Section */}
          {whatRealMissionsDo && (
            <div className="p-3 rounded-xl bg-[#0F1E28]/90 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <BookOpen className="w-3 h-3" />
                <span>WHAT REAL MISSIONS DO</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                {whatRealMissionsDo}
              </p>
            </div>
          )}

          {/* Live Textbook Formula Section */}
          {formula && (
            <div className="p-3 rounded-xl bg-[#070E24] border border-slate-800 space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                TEXTBOOK FORMULA // {formula.name}
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#050A1C] border border-slate-800 text-amber-300 font-mono text-xs overflow-x-auto">
                <code>{formula.equation}</code>
              </div>
              {formula.workedExample && (
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  <span className="font-mono text-slate-300 font-bold">Worked: </span>
                  {formula.workedExample}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact "Why?" Drawer / Popover button for placing next to specific meters or controls.
 */
export function WhyDrawerButton({
  title,
  explanation,
  formula,
  sourceUrl,
}: {
  title: string;
  explanation: React.ReactNode;
  formula?: string;
  sourceUrl?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          sfx.playClick();
          setOpen((prev) => !prev);
        }}
        className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-rift-orange hover:text-white bg-rift-orange/15 hover:bg-rift-orange/30 border border-rift-orange/30 transition-colors"
        title="Why does this value matter?"
      >
        <HelpCircle className="w-2.5 h-2.5" />
        <span>Why?</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-3 rounded-xl bg-[#070E24] border border-slate-700 shadow-2xl z-50 text-left font-sans text-xs">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
            <span className="font-mono font-bold text-rift-orange text-[10px] uppercase tracking-wider">
              {title}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-slate-300 leading-relaxed space-y-2">
            {typeof explanation === 'string' ? <p>{explanation}</p> : explanation}
            {formula && (
              <div className="p-2 rounded bg-[#050A1C] border border-slate-800 text-amber-300 font-mono text-[11px]">
                {formula}
              </div>
            )}
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-[11px] text-sky-400 hover:underline"
              >
                <span>Read NASA technical documentation</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
