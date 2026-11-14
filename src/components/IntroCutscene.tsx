'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Sparkles,
  Radio,
  RadioTower,
  Cpu,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { PORTRAIT_CONFIG } from '@/components/story/DialogueBox';
import { sfx } from '@/lib/audio';

interface IntroCutsceneProps {
  onComplete: () => void;
}

export function IntroCutscene({ onComplete }: IntroCutsceneProps) {
  // Current Scene: 1 to 6
  const [scene, setScene] = useState<number>(1);
  const [scene5Part, setScene5Part] = useState<'voss' | 'mercer' | 'reyes'>('voss');

  // Typewriter state
  const [typedText, setTypedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Audio State: starts muted until the user interacts or clicks unmute
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const hasInteractedRef = useRef<boolean>(false);

  // Web Audio Nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const humOsc1Ref = useRef<OscillatorNode | null>(null);
  const humOsc2Ref = useRef<OscillatorNode | null>(null);

  // White flash state for Scene 6
  const [whiteFlash, setWhiteFlash] = useState<boolean>(false);

  // Helper to lazily start / resume Web Audio engine
  const startAudioEngine = useCallback((unmute = false) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Master Gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(unmute ? 0.065 : 0.0001, ctx.currentTime);
        masterGain.connect(ctx.destination);
        humGainRef.current = masterGain;

        // Low-pass filter for ambient space drone
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(115, ctx.currentTime);
        filter.connect(masterGain);

        // Sub-bass oscillator 1 (55 Hz - A1)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, ctx.currentTime);
        osc1.connect(filter);
        osc1.start();
        humOsc1Ref.current = osc1;

        // Sub-bass oscillator 2 (58.5 Hz detuned for subtle space resonance)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(58.5, ctx.currentTime);
        osc2.connect(filter);
        osc2.start();
        humOsc2Ref.current = osc2;
      } else {
        if (audioCtxRef.current.state === 'suspended') {
          void audioCtxRef.current.resume();
        }
        if (humGainRef.current) {
          humGainRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
          humGainRef.current.gain.setValueAtTime(
            unmute ? 0.065 : 0.0001,
            audioCtxRef.current.currentTime
          );
        }
      }
    } catch {
      // AudioContext blocked or unsupported
    }
  }, []);

  // Cleanup Web Audio on unmount
  useEffect(() => {
    return () => {
      try {
        if (humOsc1Ref.current) humOsc1Ref.current.stop();
        if (humOsc2Ref.current) humOsc2Ref.current.stop();
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close();
        }
      } catch {
        // ignore
      }
    };
  }, []);

  // Toggle Mute with user interaction
  const toggleMute = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      hasInteractedRef.current = true;

      setIsMuted((prev) => {
        const next = !prev;
        if (!next) {
          // Unmuting: start or resume audio
          startAudioEngine(true);
        } else {
          // Muting: ramp gain to 0
          if (humGainRef.current && audioCtxRef.current) {
            humGainRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
            humGainRef.current.gain.setValueAtTime(0.0001, audioCtxRef.current.currentTime);
          }
        }
        return next;
      });
    },
    [startAudioEngine]
  );

  // Play Scene 6 Aerospace Resonance Chime
  const playFinalChime = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx =
        audioCtxRef.current ||
        new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const now = ctx.currentTime;
      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0.18, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
      chimeGain.connect(ctx.destination);

      // Fundamental harmonic (587 Hz - D5)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.connect(chimeGain);
      osc1.start(now);
      osc1.stop(now + 3.2);

      // Second harmonic (880 Hz - A5)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now);
      osc2.connect(chimeGain);
      osc2.start(now);
      osc2.stop(now + 3.2);

      // Third overtone (1174.66 Hz - D6)
      const osc3 = ctx.createOscillator();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1174.66, now);
      osc3.connect(chimeGain);
      osc3.start(now);
      osc3.stop(now + 2.4);
    } catch {
      // ignore
    }
  }, [isMuted]);

  // Determine current scene full line
  const getCurrentTargetLine = useCallback((): string => {
    switch (scene) {
      case 2:
        return 'There is a rift between what we know...';
      case 3:
        return '...and what is out there.';
      case 4:
        return 'We build the bridge.';
      case 5:
        if (scene5Part === 'voss') {
          return 'Four missions, Director. Then the board decides.';
        } else if (scene5Part === 'mercer') {
          return 'Assemble in Hangar, match delta-v in Flight Plan, and fly live.';
        } else {
          return 'Four frontiers. Survive eclipse blackouts and downlink to Earth.';
        }
      default:
        return '';
    }
  }, [scene, scene5Part]);

  // Typewriter effect (crisp, quick pacing)
  useEffect(() => {
    const target = getCurrentTargetLine();
    if (!target) {
      setTypedText('');
      setIsTyping(false);
      return;
    }

    setTypedText('');
    setIsTyping(true);
    let index = 0;
    const speed = 22; // ms per char

    const timer = setInterval(() => {
      index++;
      setTypedText(target.slice(0, index));
      if (index >= target.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [scene, scene5Part, getCurrentTargetLine]);

  // Automatic Scene Progression Timers (Whole intro strictly under 30 seconds!)
  // 1: 3.0s | 2: 4.2s | 3: 3.8s | 4: 3.8s | 5a: 4.0s | 5b: 3.2s => Total scripted: ~22s
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (scene === 1) {
      // Scene 1: Starfield fades in (0-3.0s)
      timeout = setTimeout(() => {
        setScene(2);
      }, 3000);
    } else if (scene === 2) {
      // Scene 2: Earth zoom & typed line
      timeout = setTimeout(() => {
        setScene(3);
      }, 4200);
    } else if (scene === 3) {
      // Scene 3: Moon drifts past
      timeout = setTimeout(() => {
        setScene(4);
      }, 3800);
    } else if (scene === 4) {
      // Scene 4: Satellite crosses frame
      timeout = setTimeout(() => {
        setScene(5);
        setScene5Part('voss');
      }, 3800);
    } else if (scene === 5) {
      if (scene5Part === 'voss') {
        timeout = setTimeout(() => {
          setScene5Part('mercer');
        }, 3800);
      } else if (scene5Part === 'mercer') {
        timeout = setTimeout(() => {
          setScene5Part('reyes');
        }, 4200);
      } else {
        timeout = setTimeout(() => {
          // Trigger Scene 6: Flash to white
          setWhiteFlash(true);
          playFinalChime();
          setScene(6);
          setTimeout(() => setWhiteFlash(false), 400);
        }, 3600);
      }
    }

    return () => clearTimeout(timeout);
  }, [scene, scene5Part, playFinalChime]);

  // Advance Action (Space, Enter, or Click)
  const advance = useCallback(() => {
    hasInteractedRef.current = true;
    const fullLine = getCurrentTargetLine();

    // If currently typing, finish typing instantly first
    if (isTyping && typedText.length < fullLine.length) {
      setTypedText(fullLine);
      setIsTyping(false);
      return;
    }

    // Otherwise, advance to next scene immediately
    if (scene === 1) {
      setScene(2);
    } else if (scene === 2) {
      setScene(3);
    } else if (scene === 3) {
      setScene(4);
    } else if (scene === 4) {
      setScene(5);
      setScene5Part('voss');
    } else if (scene === 5) {
      if (scene5Part === 'voss') {
        setScene5Part('mercer');
      } else if (scene5Part === 'mercer') {
        setScene5Part('reyes');
      } else {
        setWhiteFlash(true);
        playFinalChime();
        setScene(6);
        setTimeout(() => setWhiteFlash(false), 400);
      }
    } else if (scene === 6) {
      onComplete();
    }
  }, [scene, scene5Part, isTyping, typedText, getCurrentTargetLine, playFinalChime, onComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advance, onComplete]);

  return (
    <div
      onClick={advance}
      role="dialog"
      aria-modal="true"
      aria-label="SkyRift Prologue Cutscene"
      className="fixed inset-0 z-50 bg-[#030610] text-white flex flex-col justify-between select-none cursor-pointer overflow-hidden font-sans"
    >
      {/* =======================================================================
          TOP BAR CONTROLS (MUTE & SKIP)
         ======================================================================= */}
      <div className="relative z-40 w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-2 text-[9px] sm:text-[10px] font-mono text-slate-300 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-rift-orange animate-ping" />
          <span className="hidden xs:inline">PROLOGUE // ARCHIVE 01</span>
          <span className="xs:hidden">PROLOGUE</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 text-[10px] sm:text-xs font-mono font-bold transition-all shadow-md ${
              isMuted
                ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-emerald-950/80 hover:bg-emerald-900/80 border-emerald-500/60 text-emerald-300'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-amber-300 tracking-wider font-mono">UNMUTE</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-300 tracking-wider font-mono">SOUND ON</span>
              </>
            )}
          </button>

          {/* Skip Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            title="Skip Intro (Escape)"
            className="px-3 sm:px-3.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[10px] sm:text-[11px] font-mono font-bold text-slate-200 hover:text-rift-orange flex items-center space-x-1.5 transition-all shadow-md"
          >
            <span>SKIP</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =======================================================================
          WHITE FLASH OVERLAY (SCENE 6 TRANSITION)
         ======================================================================= */}
      {whiteFlash && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-300" />
      )}

      {/* =======================================================================
          CINEMATIC STAGE VIEWPORT
         ======================================================================= */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden px-3 sm:px-6">
        {/* Background Starfield (Persists across scenes) */}
        <div className="absolute inset-0 pointer-events-none opacity-90">
          {/* Twinkling ambient stars */}
          <div className="absolute top-[12%] left-[18%] w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          <div className="absolute top-[28%] left-[75%] w-1.5 h-1.5 bg-sky-300 rounded-full animate-pulse" />
          <div className="absolute top-[65%] left-[12%] w-1 h-1 bg-amber-200 rounded-full animate-pulse" />
          <div className="absolute top-[82%] left-[68%] w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          <div className="absolute top-[42%] left-[38%] w-1 h-1 bg-white/70 rounded-full" />
          <div className="absolute top-[15%] left-[55%] w-1.5 h-1.5 bg-white/80 rounded-full" />
          <div className="absolute top-[78%] left-[45%] w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" />
          <div className="absolute top-[50%] left-[88%] w-1 h-1 bg-white/80 rounded-full" />
          <div className="absolute top-[22%] left-[30%] w-1 h-1 bg-white/60 rounded-full" />
          <div className="absolute top-[90%] left-[22%] w-1 h-1 bg-white/60 rounded-full" />

          {/* Deep Space Cosmic Dust Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(24,36,65,0.45)_0%,rgba(3,6,16,0.95)_100%)]" />
        </div>

        {/* -------------------------------------------------------------------
            SCENE 1: STARFIELD FADES IN (0 - 3s)
           ------------------------------------------------------------------- */}
        {scene === 1 && (
          <div className="relative z-10 text-center space-y-4 animate-in fade-in duration-1000 max-w-lg px-4">
            <div className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.3em] text-rift-orange uppercase">
              SECTOR 00-ALPHA // DEEP SPACE RECONNAISSANCE
            </div>
            <div className="w-16 h-0.5 bg-rift-orange mx-auto shadow-hud-orange" />
            <p className="text-xs sm:text-sm font-mono text-slate-300 leading-relaxed uppercase tracking-widest animate-pulse">
              [INITIALIZING TELEMETRY CARRIER...]
            </p>
          </div>
        )}

        {/* -------------------------------------------------------------------
            SCENE 2: SLOW ZOOM ON SVG/CSS EARTH
           ------------------------------------------------------------------- */}
        {scene === 2 && (
          <div className="relative z-10 flex flex-col items-center justify-center animate-in zoom-in-75 fade-in duration-1000">
            {/* SVG Stylized Earth */}
            <div className="relative w-44 h-44 sm:w-64 sm:h-64 rounded-full shadow-[0_0_90px_rgba(56,189,248,0.4)] flex items-center justify-center mb-6 sm:mb-8">
              <svg viewBox="0 0 200 200" className="w-full h-full rounded-full">
                <defs>
                  <radialGradient id="earthGrad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="45%" stopColor="#0284C7" />
                    <stop offset="85%" stopColor="#0369A1" />
                    <stop offset="100%" stopColor="#0C4A6E" />
                  </radialGradient>
                  <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Ocean Sphere */}
                <circle cx="100" cy="100" r="96" fill="url(#earthGrad)" />

                {/* Continental Silhouettes */}
                <path
                  d="M60 45 Q75 35 90 40 T125 50 Q145 65 140 85 T110 100 Q95 125 70 120 T45 85 Z"
                  fill="#15803D"
                  opacity="0.85"
                />
                <path
                  d="M115 110 Q130 115 135 135 T120 160 Q105 165 95 150 Z"
                  fill="#16A34A"
                  opacity="0.8"
                />
                <path
                  d="M35 110 Q50 115 45 130 T30 145 Z"
                  fill="#15803D"
                  opacity="0.75"
                />

                {/* Swirling Clouds */}
                <path
                  d="M40 70 Q90 60 130 75 Q160 85 170 70"
                  stroke="url(#cloudGrad)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M30 115 Q70 125 120 110 Q150 100 165 120"
                  stroke="url(#cloudGrad)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Atmospheric Glow Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="98"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  opacity="0.7"
                />
              </svg>

              {/* Sub-Orbital Telemetry Ring */}
              <div className="absolute inset-0 rounded-full border border-sky-400/30 border-dashed animate-spin duration-[60s]" />
            </div>

            {/* Telemetry Annotation */}
            <div className="text-[9px] sm:text-[11px] font-mono text-sky-300 font-bold tracking-widest uppercase">
              TERRA FIRMA // 1.00 AU // 6,371 KM RADIUS
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            SCENE 3: MOON DRIFTS PAST
           ------------------------------------------------------------------- */}
        {scene === 3 && (
          <div className="relative z-10 flex flex-col items-center justify-center animate-in fade-in duration-1000">
            {/* Drifting Moon */}
            <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-full shadow-[0_0_70px_rgba(226,232,240,0.3)] flex items-center justify-center mb-6 sm:mb-8 transform -translate-x-3 sm:-translate-x-4 animate-in slide-in-from-right duration-1000">
              <svg viewBox="0 0 200 200" className="w-full h-full rounded-full">
                <defs>
                  <radialGradient id="moonGrad" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#F1F5F9" />
                    <stop offset="50%" stopColor="#94A3B8" />
                    <stop offset="85%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#1E293B" />
                  </radialGradient>
                </defs>

                {/* Moon Regolith Sphere */}
                <circle cx="100" cy="100" r="96" fill="url(#moonGrad)" />

                {/* Lunar Maria (Dark Basalt Plains) */}
                <circle cx="70" cy="65" r="24" fill="#334155" opacity="0.65" />
                <circle cx="125" cy="85" r="32" fill="#334155" opacity="0.6" />
                <circle cx="85" cy="130" r="28" fill="#334155" opacity="0.55" />

                {/* Prominent Impact Craters */}
                <circle cx="55" cy="120" r="10" fill="#1E293B" opacity="0.8" />
                <circle cx="55" cy="120" r="8" fill="#64748B" opacity="0.6" />
                <circle cx="140" cy="50" r="7" fill="#1E293B" opacity="0.7" />
                <circle cx="110" cy="145" r="9" fill="#1E293B" opacity="0.8" />
              </svg>

              {/* Orbital Path Line */}
              <div className="absolute -inset-8 sm:-inset-10 border-t border-slate-600/70 rounded-full transform -rotate-12 pointer-events-none" />
            </div>

            {/* Polish requirement: MEAN DISTANCE 384,400 KM */}
            <div className="text-[9px] sm:text-[11px] font-mono text-slate-300 font-bold tracking-widest uppercase">
              LUNA // MEAN DISTANCE 384,400 KM // 1,737 KM RADIUS
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            SCENE 4: SATELLITE CROSSES THE FRAME
           ------------------------------------------------------------------- */}
        {scene === 4 && (
          <div className="relative z-10 flex flex-col items-center justify-center animate-in fade-in duration-700">
            {/* Satellite Craft Visual */}
            <div className="relative mb-6 sm:mb-8 transform -rotate-12 animate-in slide-in-from-left duration-1000">
              <svg viewBox="0 0 320 180" className="w-64 sm:w-96 h-auto drop-shadow-[0_0_40px_rgba(255,94,30,0.5)]">
                {/* Propulsion Plume */}
                <polygon
                  points="160,115 148,165 172,165"
                  fill="url(#thrusterGrad)"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="thrusterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="30%" stopColor="#FF5E1E" />
                    <stop offset="100%" stopColor="#FF5E1E" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Left Solar Array */}
                <rect x="20" y="70" width="85" height="40" rx="3" fill="#1E293B" stroke="#0284C7" strokeWidth="2" />
                <line x1="48" y1="70" x2="48" y2="110" stroke="#0284C7" strokeWidth="1" />
                <line x1="76" y1="70" x2="76" y2="110" stroke="#0284C7" strokeWidth="1" />
                <line x1="20" y1="90" x2="105" y2="90" stroke="#0284C7" strokeWidth="1" />

                {/* Array Strut */}
                <rect x="105" y="86" width="20" height="8" fill="#94A3B8" />

                {/* Central Spacecraft Bus */}
                <rect x="125" y="60" width="70" height="55" rx="6" fill="#F8FAFC" stroke="#FF5E1E" strokeWidth="2.5" />
                {/* Thermal Blanket Pattern */}
                <rect x="133" y="68" width="54" height="39" rx="3" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />

                {/* Parabolic High-Gain Dish */}
                <ellipse cx="160" cy="50" rx="22" ry="10" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
                <line x1="160" y1="50" x2="160" y2="35" stroke="#FF5E1E" strokeWidth="2" />
                <circle cx="160" cy="33" r="2.5" fill="#FF5E1E" />

                {/* Right Solar Array */}
                <rect x="195" y="86" width="20" height="8" fill="#94A3B8" />
                <rect x="215" y="70" width="85" height="40" rx="3" fill="#1E293B" stroke="#0284C7" strokeWidth="2" />
                <line x1="243" y1="70" x2="243" y2="110" stroke="#0284C7" strokeWidth="1" />
                <line x1="271" y1="70" x2="271" y2="110" stroke="#0284C7" strokeWidth="1" />
                <line x1="215" y1="90" x2="300" y2="90" stroke="#0284C7" strokeWidth="1" />
              </svg>
            </div>

            <div className="text-[9px] sm:text-[11px] font-mono text-rift-orange font-bold tracking-widest uppercase">
              DEEP-SPACE EXPLORER // ACTIVE ORBITAL TRANSLATION
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            SCENE 5: HIGH-CONTRAST EXPANDED CONTROL ROOM & SILHOUETTES
           ------------------------------------------------------------------- */}
        {scene === 5 && (
          <div className="relative z-10 flex flex-col items-center justify-center animate-in fade-in duration-700 w-full max-w-3xl px-2 sm:px-4">
            {/* Control Room Console Wall with 5 Silhouettes */}
            <div className="relative w-full rounded-2xl bg-gradient-to-t from-slate-950 via-slate-900/95 to-slate-950 border-2 border-slate-700/80 p-3 sm:p-6 flex flex-col justify-between overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.85)] mb-3 sm:mb-6">
              {/* Background Wall Monitors - High-Contrast Bright Panels */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full mb-3 sm:mb-6">
                {/* 1. Trajectory Telemetry */}
                <div className="rounded-lg bg-emerald-950/90 border border-emerald-500/60 p-2 sm:p-2.5 font-mono text-[9px] sm:text-[11px] text-emerald-300 flex flex-col justify-between shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-emerald-400 font-bold">
                    <span>ORBITAL VECTORS</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-emerald-200 font-black tracking-wider text-[10px] sm:text-xs mt-1">
                    7.68 KM/S // NOMINAL
                  </div>
                </div>

                {/* 2. DSN Comms Carrier */}
                <div className="rounded-lg bg-sky-950/90 border border-sky-500/60 p-2 sm:p-2.5 font-mono text-[9px] sm:text-[11px] text-sky-300 flex flex-col justify-between shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                  <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-sky-400 font-bold">
                    <span>DSN CARRIER</span>
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  </div>
                  <div className="text-sky-200 font-black tracking-wider text-[10px] sm:text-xs mt-1">
                    LOCKED [DSN-34]
                  </div>
                </div>

                {/* 3. Spacecraft Power Bus */}
                <div className="rounded-lg bg-amber-950/90 border border-amber-500/60 p-2 sm:p-2.5 font-mono text-[9px] sm:text-[11px] text-amber-300 flex flex-col justify-between shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                  <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-amber-400 font-bold">
                    <span>POWER BUS</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <div className="text-amber-200 font-black tracking-wider text-[10px] sm:text-xs mt-1">
                    28.4 V // 98.4%
                  </div>
                </div>

                {/* 4. Science Sensors */}
                <div className="rounded-lg bg-purple-950/90 border border-purple-500/60 p-2 sm:p-2.5 font-mono text-[9px] sm:text-[11px] text-purple-300 flex flex-col justify-between shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                  <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-purple-400 font-bold">
                    <span>SCIENCE SUITE</span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  </div>
                  <div className="text-purple-200 font-black tracking-wider text-[10px] sm:text-xs mt-1">
                    ARMED // READY
                  </div>
                </div>
              </div>

              {/* Five Silhouettes at Console Desk with Distinct Roles */}
              <div className="relative flex items-end justify-between sm:justify-around w-full pt-3 sm:pt-6 border-b-4 border-slate-700/80 shadow-[0_4px_20px_rgba(59,130,246,0.2)] px-1 sm:px-4">
                {/* 1. Kai Mercer (ENG) */}
                <div className="flex flex-col items-center transition-all group">
                  <div className="relative">
                    <div
                      className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center transition-all ${
                        scene5Part === 'mercer'
                          ? 'ring-4 ring-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.85)] scale-110'
                          : 'shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                      }`}
                    >
                      <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                    </div>
                    {scene5Part === 'mercer' && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-amber-400 text-slate-900 text-[8px] font-mono font-bold uppercase tracking-wider animate-bounce">
                        SPEAKING
                      </span>
                    )}
                  </div>
                  <div className="w-11 sm:w-16 h-14 sm:h-20 bg-gradient-to-t from-slate-900 to-slate-800 rounded-t-xl mt-1 border-t-2 border-amber-400/60" />
                  <span className="px-1.5 sm:px-2.5 py-0.5 rounded bg-amber-950/90 border border-amber-500 text-amber-300 font-mono font-bold text-[9px] sm:text-xs mt-1.5 shadow-xs uppercase tracking-wider">
                    ENG
                  </span>
                </div>

                {/* 2. Dr. Lena Okafor (SCI) */}
                <div className="flex flex-col items-center transition-all group">
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-800 border-2 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.4)] flex items-center justify-center">
                      <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
                    </div>
                  </div>
                  <div className="w-11 sm:w-16 h-15 sm:h-22 bg-gradient-to-t from-slate-900 to-slate-800 rounded-t-xl mt-1 border-t-2 border-emerald-400/60" />
                  <span className="px-1.5 sm:px-2.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-mono font-bold text-[9px] sm:text-xs mt-1.5 shadow-xs uppercase tracking-wider">
                    SCI
                  </span>
                </div>

                {/* 3. Sofia Reyes (FLIGHT DIRECTOR - Center, Prominent) */}
                <div className="flex flex-col items-center transition-all -translate-y-1">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-slate-800 border-2 border-rift-orange flex items-center justify-center transition-all ${
                        scene5Part === 'reyes'
                          ? 'ring-4 ring-rift-orange/60 shadow-[0_0_35px_rgba(255,94,30,0.85)] scale-110'
                          : 'shadow-[0_0_20px_rgba(255,94,30,0.5)]'
                      }`}
                    >
                      <RadioTower className="w-5 h-5 sm:w-6 sm:h-6 text-rift-orange" />
                    </div>
                    {scene5Part === 'reyes' && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-rift-orange text-white text-[8px] font-mono font-bold uppercase tracking-wider animate-bounce">
                        SPEAKING
                      </span>
                    )}
                  </div>
                  <div className="w-14 sm:w-20 h-16 sm:h-24 bg-gradient-to-t from-slate-900 to-slate-700 rounded-t-2xl mt-1 border-t-2 border-rift-orange" />
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded bg-orange-950 border-2 border-rift-orange text-rift-orange font-mono font-black text-[10px] sm:text-xs mt-1.5 shadow-hud-orange uppercase tracking-wider">
                    FLIGHT
                  </span>
                </div>

                {/* 4. Ravi Anand (COMMS) */}
                <div className="flex flex-col items-center transition-all group">
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-slate-800 border-2 border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.4)] flex items-center justify-center">
                      <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
                    </div>
                  </div>
                  <div className="w-11 sm:w-16 h-14 sm:h-20 bg-gradient-to-t from-slate-900 to-slate-800 rounded-t-xl mt-1 border-t-2 border-sky-400/60" />
                  <span className="px-1.5 sm:px-2.5 py-0.5 rounded bg-sky-950/90 border border-sky-500 text-sky-300 font-mono font-bold text-[9px] sm:text-xs mt-1.5 shadow-xs uppercase tracking-wider">
                    COMMS
                  </span>
                </div>

                {/* 5. Chair Voss (BOARD - Standing Oversight) */}
                <div className="flex flex-col items-center transition-all group">
                  <div className="relative">
                    <div
                      className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center transition-all ${
                        scene5Part === 'voss'
                          ? 'ring-4 ring-slate-300/60 shadow-[0_0_30px_rgba(226,232,240,0.85)] scale-110'
                          : 'shadow-[0_0_15px_rgba(203,213,225,0.4)]'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
                    </div>
                    {scene5Part === 'voss' && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-slate-200 text-slate-900 text-[8px] font-mono font-bold uppercase tracking-wider animate-bounce">
                        SPEAKING
                      </span>
                    )}
                  </div>
                  <div className="w-12 sm:w-18 h-18 sm:h-26 bg-gradient-to-t from-slate-950 to-slate-800 rounded-t-xl mt-1 border-t-2 border-slate-300/70" />
                  <span className="px-1.5 sm:px-2.5 py-0.5 rounded bg-slate-800 border border-slate-400 text-slate-100 font-mono font-bold text-[9px] sm:text-xs mt-1.5 shadow-xs uppercase tracking-wider">
                    BOARD
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[9px] sm:text-[11px] font-mono text-slate-400 font-bold tracking-widest uppercase text-center">
              FLIGHT CONTROL ROOM // MAIN CONSOLE DIRECTORY
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            SCENE 6: SKY RIFT LOGO & "BEGIN" BUTTON
           ------------------------------------------------------------------- */}
        {scene === 6 && (
          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 animate-in zoom-in-95 fade-in duration-700 px-4 max-w-xl">
            {/* Glowing Program Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-rift-orange/50 shadow-hud-orange text-rift-orange">
              <Sparkles className="w-3.5 h-3.5 animate-spin duration-[4000ms]" />
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.25em] uppercase">
                MISSION CONTROL PROTOCOL READY
              </span>
            </div>

            {/* Main Program Logo */}
            <div className="flex flex-col items-center space-y-2">
              <img
                src="/images/skyrift_logo.png"
                alt="SKY RIFT"
                className="w-64 sm:w-80 md:w-96 max-w-full h-auto object-contain drop-shadow-[0_0_50px_rgba(255,90,31,0.6)]"
              />
              <p className="text-xs sm:text-sm font-mono text-slate-300 uppercase tracking-widest">
                PLAN &bull; ASSEMBLE &bull; LAUNCH &bull; SURVIVE
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed font-mono">
              The solar system awaits your flight designs. Balance power, delta-v, and thermal margins across four frontiers.
            </p>

            {/* 3-Step Mission Architecture Overview */}
            <div className="grid grid-cols-3 gap-2 w-full text-left font-mono max-w-lg mx-auto">
              <div className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-900/80">
                <span className="text-[9px] text-[#FF5A1F] font-bold block uppercase tracking-wider">01 // HANGAR</span>
                <span className="text-[10px] sm:text-xs text-slate-200 block font-bold">Systems Build</span>
                <span className="text-[9px] text-slate-400 block leading-tight mt-0.5">Power, batteries & mass</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-900/80">
                <span className="text-[9px] text-amber-400 font-bold block uppercase tracking-wider">02 // FLIGHT PLAN</span>
                <span className="text-[10px] sm:text-xs text-slate-200 block font-bold">Rocket Sizing</span>
                <span className="text-[9px] text-slate-400 block leading-tight mt-0.5">Tsiolkovsky Δv matching</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl border border-slate-800 bg-slate-900/80">
                <span className="text-[9px] text-sky-400 font-bold block uppercase tracking-wider">03 // MISSION CTRL</span>
                <span className="text-[10px] sm:text-xs text-slate-200 block font-bold">Flight Ops</span>
                <span className="text-[9px] text-slate-400 block leading-tight mt-0.5">35m eclipse & DSN comms</span>
              </div>
            </div>

            {/* BEGIN BUTTON */}
            <div className="pt-2 sm:pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.playSuccessChime();
                  onComplete();
                }}
                className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-rift-orange hover:bg-rift-orangeHover text-white text-xs sm:text-base font-mono font-black uppercase tracking-wider flex items-center space-x-3 shadow-hud-orange transition-all hover:scale-105 active:scale-95"
              >
                <span>BEGIN MISSION COMMAND</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================================
          BOTTOM DIALOGUE / SUBTITLE BOX (SCENES 2 - 5)
         ======================================================================= */}
      {scene >= 2 && scene <= 5 && (
        <div className="relative z-30 w-full max-w-2xl mx-auto px-3 sm:px-6 pb-4 sm:pb-8 animate-in fade-in duration-300">
          <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-950/95 border-2 border-slate-800 shadow-2xl backdrop-blur-md flex items-start space-x-3 sm:space-x-4">
            {/* Character Avatar Icon */}
            {(() => {
              const speakerName =
                scene === 5 && scene5Part === 'voss'
                  ? 'Chair Voss'
                  : scene === 5 && scene5Part === 'mercer'
                  ? 'Kai Mercer'
                  : 'Sofia Reyes';
              const portrait = PORTRAIT_CONFIG[speakerName];

              return (
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br ${portrait.gradient} text-white font-mono font-black text-[10px] sm:text-xs flex items-center justify-center ring-2 ${portrait.ringColor} shadow-md shrink-0 mt-0.5`}
                >
                  {portrait.initials}
                </div>
              );
            })()}

            {/* Character Dialogue Speech */}
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-mono font-bold text-white uppercase tracking-wider truncate">
                  {scene === 5 && scene5Part === 'voss'
                    ? 'CHAIR VOSS'
                    : scene === 5 && scene5Part === 'mercer'
                    ? 'KAI MERCER'
                    : 'SOFIA REYES'}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-widest shrink-0 ml-2">
                  {scene === 5 && scene5Part === 'voss'
                    ? 'BOARD OVERSIGHT'
                    : scene === 5 && scene5Part === 'mercer'
                    ? 'SYSTEMS ENGINEERING'
                    : 'SENTINEL FLIGHT'}
                </span>
              </div>

              <p className="text-xs sm:text-base text-slate-100 font-medium italic leading-relaxed break-words">
                &ldquo;{typedText}&rdquo;
                {isTyping && (
                  <span className="inline-block w-1.5 sm:w-2 h-3.5 sm:h-4 bg-rift-orange ml-1 animate-pulse align-middle" />
                )}
              </p>
            </div>
          </div>

          <div className="mt-2 text-center text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            PRESS [SPACE] OR TAP TO ADVANCE
          </div>
        </div>
      )}

      {/* Empty spacer for Scene 1 and Scene 6 to balance flex layout */}
      {(scene === 1 || scene === 6) && (
        <div className="py-3 sm:py-4 text-center text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          {scene === 6 ? 'PRESS [ENTER] OR TAP BEGIN' : 'PRESS [SPACE] OR TAP TO ADVANCE'}
        </div>
      )}
    </div>
  );
}
