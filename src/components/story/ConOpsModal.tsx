'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MissionScenario } from '@/game/types';
import { getMissionConOps, ConOpsPhaseTask } from '@/data/conOpsData';
import { PORTRAIT_CONFIG } from '@/components/story/DialogueBox';
import { StorySpeaker, CHARACTERS } from '@/data/story';
import { sfx } from '@/lib/audio';
import {
  Rocket,
  Compass,
  Sparkles,
  Radio,
  CheckCircle2,
  FastForward,
  ArrowRight,
  Globe2,
  BookOpen,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface ConOpsModalProps {
  mission: MissionScenario;
  isOpen: boolean;
  onClose: () => void;
}

const PHASE_ICONS: Record<ConOpsPhaseTask['iconName'], React.ElementType> = {
  Rocket,
  Compass,
  Sparkles,
  Radio,
  CheckCircle2,
};

export function ConOpsModal({ mission, isOpen, onClose }: ConOpsModalProps) {
  const conOps = getMissionConOps(mission.id);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);

  const speakerName = (conOps.speaker as StorySpeaker) || 'Sofia Reyes';
  const portrait = PORTRAIT_CONFIG[speakerName] || PORTRAIT_CONFIG['Sofia Reyes'];
  const charInfo = CHARACTERS[speakerName] || {
    name: speakerName,
    role: 'Flight Director',
    callsign: 'OPS',
  };

  const currentPhase = conOps.phases[selectedPhaseIdx] || conOps.phases[0];
  const CurrentIcon = PHASE_ICONS[currentPhase.iconName] || Rocket;

  const handleFinish = useCallback(() => {
    sfx.playClick();
    if (dontShowAgain && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`skyrift_hide_conops_${mission.id}`, 'true');
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`skyrift_conops_dismissed_${mission.id}`, 'true');
      } catch {
        // ignore
      }
    }
    onClose();
  }, [dontShowAgain, mission.id, onClose]);

  // Keyboard controls: Escape skips immediately, Space/Enter advances phase or completes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleFinish();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleFinish]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conops-title"
      className="fixed inset-0 z-50 bg-[#050A1C]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 overflow-y-auto"
    >
      {/* Existing DialogueBox styled container */}
      <div className="relative select-none rounded-2xl bg-[#0A1228]/95 backdrop-blur-md border border-[rgba(148,163,184,0.22)] shadow-[0_16px_50px_0_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_0_30px_0_rgba(56,189,248,0.04)] p-5 sm:p-7 max-w-4xl w-full mx-auto my-auto space-y-5 animate-in zoom-in-95 duration-150">
        {/* Top Protocol Bar (Matching DialogueBox Style) */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(148,163,184,0.16)] gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A1F] animate-ping shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-widest block truncate">
                CONOPS BRIEFING // CONCEPT OF OPERATIONS &bull; {mission.name.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0E1836] border border-[rgba(148,163,184,0.2)] text-slate-300 uppercase">
              {conOps.destinationName}
            </span>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleFinish}
              className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-[#0E1836] hover:bg-[#14224A] text-slate-300 hover:text-[#FF5A1F] border border-[rgba(148,163,184,0.25)] hover:border-[#FF5A1F] transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
              title="Skip ConOps briefing and enter Hangar"
            >
              <span>SKIP</span>
              <FastForward className="w-3.5 h-3.5 text-[#FF5A1F]" />
            </button>
          </div>
        </div>

        {/* Header Directive: Speaker Portrait + Core Mission Questions */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Circular Speaker Portrait (Exact DialogueBox Style) */}
          <div className="flex sm:flex-col items-center space-x-3 sm:space-x-0 sm:space-y-2 shrink-0">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${portrait.gradient} flex items-center justify-center text-white font-mono font-black text-lg sm:text-xl shadow-[0_0_16px_rgba(0,0,0,0.5)] ring-2 ${portrait.ringColor} shrink-0`}
            >
              {portrait.initials}
            </div>

            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${portrait.badgeBg}`}>
              BRIEFING
            </span>
          </div>

          {/* Core ConOps Directive Speech Box */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="flex flex-wrap items-baseline space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-wide uppercase">
                  {conOps.speaker}
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  // {conOps.callsign}
                </span>
              </div>
              <p className="text-xs font-mono text-[#38BDF8] mt-0.5">
                {conOps.orbitParameters}
              </p>
            </div>

            {/* Questions 1 & 2: What are we trying to learn? Where do we go? */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Question 1: What are we trying to learn? */}
              <div className="p-3.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.16)] space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. WHAT ARE WE TRYING TO LEARN?</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-medium">
                  {conOps.whatWeLearn}
                </p>
              </div>

              {/* Question 2: Where do we go? */}
              <div className="p-3.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.16)] space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>2. WHERE DO WE GO?</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-medium">
                  {conOps.whereWeGo}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Question 3: What must the spacecraft do each phase? */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(148,163,184,0.14)]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                3. WHAT MUST THE SPACECRAFT DO EACH PHASE?
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              CLICK A PHASE TO INSPECT CONOPS TASKS
            </span>
          </div>

          {/* Phase Selector Horizontal Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {conOps.phases.map((p, idx) => {
              const isSelected = selectedPhaseIdx === idx;
              const IconComponent = PHASE_ICONS[p.iconName] || Rocket;

              return (
                <button
                  key={p.phase}
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setSelectedPhaseIdx(idx);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0E1836] border-[#FF5A1F] ring-1 ring-[#FF5A1F]/50 shadow-hud-orange'
                      : 'bg-[#070E24] border-[rgba(148,163,184,0.14)] hover:border-[rgba(148,163,184,0.3)] hover:bg-[#0B1530]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <IconComponent
                      className={`w-4 h-4 ${isSelected ? 'text-[#FF5A1F]' : 'text-slate-400'}`}
                    />
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                      P{idx + 1}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-black font-mono leading-tight truncate ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {p.phaseTitle.split(':')[1]?.trim() || p.phaseTitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Phase Deep Dive Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#070E24] border border-[rgba(148,163,184,0.18)] flex flex-col sm:flex-row items-start justify-between gap-4 shadow-sm animate-in fade-in duration-150">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FF5A1F]/15 border border-[#FF5A1F]/40 text-[#FF5A1F] uppercase tracking-wider">
                  {currentPhase.phaseTitle}
                </span>
                <span className="text-xs font-mono text-slate-400 truncate">
                  {currentPhase.tagline}
                </span>
              </div>

              <p className="font-sans text-sm text-[#F1F5F9] leading-relaxed pt-1">
                {currentPhase.spacecraftTasks}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#050A1C] border border-amber-500/30 sm:max-w-xs w-full shrink-0 space-y-1">
              <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>CRITICAL SYSTEM CHALLENGE</span>
              </div>
              <p className="text-xs text-amber-100 font-sans leading-snug">
                {currentPhase.keyChallenge}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions: "Don't show again" Checkbox + Enter Hangar Button */}
        <div className="pt-3 border-t border-[rgba(148,163,184,0.16)] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Don't show again toggle */}
          <label className="flex items-center space-x-2.5 text-xs font-mono text-slate-300 cursor-pointer select-none self-start sm:self-auto hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-[#070E24] text-rift-orange focus:ring-rift-orange/50 cursor-pointer"
            />
            <span>Don&apos;t show again for this mission</span>
          </label>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleFinish}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A1F] to-[#E64C0E] hover:from-[#E64C0E] hover:to-[#CC3F00] text-white text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_24px_rgba(255,90,31,0.45)] transition-all active:scale-95"
            >
              <span>ENTER SPACECRAFT HANGAR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

