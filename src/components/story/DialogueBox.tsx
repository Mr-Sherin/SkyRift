'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DialogueLine, StorySpeaker, CHARACTERS } from '@/data/story';
import { sfx } from '@/lib/audio';
import { ChevronRight, FastForward } from 'lucide-react';

interface DialogueBoxProps {
  dialogue: DialogueLine[];
  onComplete: () => void;
  title?: string;
  badge?: string;
  allowSkip?: boolean;
  className?: string;
}

export const PORTRAIT_CONFIG: Record<
  StorySpeaker,
  {
    initials: string;
    gradient: string;
    ringColor: string;
    textColor: string;
    badgeBg: string;
  }
> = {
  'Sofia Reyes': {
    initials: 'SR',
    gradient: 'from-orange-600 to-amber-700',
    ringColor: 'ring-orange-500/80 border-orange-400',
    textColor: 'text-orange-400',
    badgeBg: 'bg-orange-950/80 text-orange-300 border-orange-500/50',
  },
  'Kai Mercer': {
    initials: 'KM',
    gradient: 'from-amber-600 to-yellow-700',
    ringColor: 'ring-amber-500/80 border-amber-400',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
  },
  'Dr. Lena Okafor': {
    initials: 'LO',
    gradient: 'from-emerald-600 to-teal-700',
    ringColor: 'ring-emerald-500/80 border-emerald-400',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
  },
  'Ravi Anand': {
    initials: 'RA',
    gradient: 'from-sky-600 to-indigo-700',
    ringColor: 'ring-sky-500/80 border-sky-400',
    textColor: 'text-sky-400',
    badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
  },
  'Chair Voss': {
    initials: 'CV',
    gradient: 'from-slate-600 to-slate-800',
    ringColor: 'ring-slate-400/80 border-slate-300',
    textColor: 'text-slate-300',
    badgeBg: 'bg-slate-800/80 text-slate-200 border-slate-500/50',
  },
};

export function DialogueBox({
  dialogue,
  onComplete,
  title = 'MISSION COMMUNICATIONS',
  badge = 'TRANSMISSION INCOMING',
  allowSkip = true,
  className = '',
}: DialogueBoxProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);

  const currentLine = dialogue[currentIndex] || dialogue[0];
  const charInfo = CHARACTERS[currentLine?.speaker] || {
    name: currentLine?.speaker || 'Unknown',
    role: 'Crew Member',
    callsign: 'OPS',
  };
  const portrait = PORTRAIT_CONFIG[currentLine?.speaker] || PORTRAIT_CONFIG['Sofia Reyes'];

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;
    setDisplayedText('');
    setIsTyping(true);

    let charIndex = 0;
    const fullText = currentLine.line;
    const speed = 22; // ms per character

    const interval = setInterval(() => {
      charIndex++;
      setDisplayedText(fullText.slice(0, charIndex));

      if (charIndex >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [currentIndex, currentLine]);

  // Advance or Complete
  const advance = useCallback(() => {
    if (isTyping) {
      setDisplayedText(currentLine.line);
      setIsTyping(false);
      sfx.playClick();
    } else {
      if (currentIndex < dialogue.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        sfx.playClick();
      } else {
        sfx.playClick();
        onComplete();
      }
    }
  }, [isTyping, currentIndex, dialogue.length, currentLine, onComplete]);

  const handleSkip = useCallback(() => {
    sfx.playClick();
    onComplete();
  }, [onComplete]);

  // Keyboard navigation: Space/Enter advances, Escape skips
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        advance();
      } else if (e.code === 'Escape' && allowSkip) {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advance, handleSkip, allowSkip]);

  if (!currentLine) return null;

  return (
    <div
      role="region"
      aria-label="Mission Dialogue"
      onClick={advance}
      className={`cursor-pointer select-none rounded-2xl bg-[#0A1228]/95 backdrop-blur-md border border-[rgba(148,163,184,0.18)] shadow-[0_12px_44px_0_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_0_24px_0_rgba(56,189,248,0.03)] p-4 sm:p-6 transition-all max-w-3xl w-full mx-auto ${className}`}
    >
      {/* Top Protocol Bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(148,163,184,0.14)]">
        <div className="flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-ping" />
          <div className="text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-widest">
            {title} &bull; {badge}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-xs font-bold text-[#94A3B8] uppercase">
            {currentIndex + 1} / {dialogue.length}
          </span>

          {allowSkip && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#0E1836] hover:bg-[#14224A] text-[#94A3B8] hover:text-[#FF5A1F] border border-[rgba(148,163,184,0.2)] transition-colors flex items-center space-x-1"
            >
              <span>SKIP</span>
              <FastForward className="w-3.5 h-3.5 text-[#FF5A1F]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Dialogue Content: Circular Portrait + Speech Box */}
      <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Character Portrait with Circular Colored Initials Ring */}
        <div className="flex sm:flex-col items-center space-x-3 sm:space-x-0 space-y-0 sm:space-y-2 shrink-0">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${portrait.gradient} flex items-center justify-center text-white font-mono font-black text-lg sm:text-xl shadow-[0_0_16px_rgba(0,0,0,0.5)] ring-2 ${portrait.ringColor} transition-transform transform group-hover:scale-105`}
          >
            {portrait.initials}
          </div>

          <span
            className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border ${portrait.badgeBg}`}
          >
            {currentLine.mood}
          </span>
        </div>

        {/* Speaker Name, Callsign & Typewriter Text */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline space-x-2 mb-1.5">
            <h3 className="text-base sm:text-lg font-black text-[#F1F5F9] font-mono tracking-wide uppercase">
              {currentLine.speaker}
            </h3>
            <span className="text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-wider">
              // {charInfo.role} ({charInfo.callsign})
            </span>
          </div>

          {/* Dialogue Speech Body */}
          <div className="min-h-[56px] text-base text-[#F1F5F9] font-medium leading-relaxed italic">
            <span>&ldquo;{displayedText}&rdquo;</span>
            {isTyping && (
              <span className="inline-block w-2 h-4 ml-1 bg-[#FF5A1F] animate-pulse align-middle" />
            )}
          </div>

          {/* Footer Prompt */}
          <div className="mt-3 pt-2.5 border-t border-[rgba(148,163,184,0.14)] flex items-center justify-between text-xs font-mono text-[#94A3B8] uppercase tracking-wider">
            <span>
              PRESS <b className="text-white">[SPACE]</b> OR <b className="text-white">CLICK</b> TO ADVANCE
            </span>
            <div className="flex items-center space-x-1 text-[#FF5A1F] font-bold">
              <span>CONTINUE</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
