'use client';

import React, { useState, useEffect } from 'react';
import { MissionScenario, LaunchVehicle, SpacecraftComponent } from '@/game/types';
import { Rocket, ShieldCheck, CheckCircle2, Volume2, VolumeX, FastForward, ArrowRight, Zap } from 'lucide-react';
import { sfx } from '@/lib/audio';
import { DidYouKnowCard } from '@/components/science/DidYouKnowCard';

interface LaunchSequenceModalProps {
  mission: MissionScenario;
  rocket: LaunchVehicle | null;
  components: SpacecraftComponent[];
  onComplete: () => void;
}

type SequenceStage = 'countdown' | 'liftoff' | 'separation' | 'injection';

export function LaunchSequenceModal({
  mission,
  rocket,
  components,
  onComplete,
}: LaunchSequenceModalProps) {
  const [stage, setStage] = useState<SequenceStage>('countdown');
  const [countdownNum, setCountdownNum] = useState<number>(5);
  const [telemetryAlt, setTelemetryAlt] = useState<number>(0);
  const [telemetryVel, setTelemetryVel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => sfx.getMuted());

  const handleToggleSound = () => {
    const next = sfx.toggleMute();
    setIsMuted(next);
  };

  const handleSkip = () => {
    sfx.playClick();
    onComplete();
  };

  // 1. Countdown Phase: T-5 down to T-0
  useEffect(() => {
    if (stage !== 'countdown') return;

    if (countdownNum > 0) {
      sfx.playCountdownBeep(false);
      const timer = setTimeout(() => {
        setCountdownNum((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown hits 0: Liftoff!
      sfx.playCountdownBeep(true);
      sfx.playRocketRumble(3.0);
      setStage('liftoff');
    }
  }, [stage, countdownNum]);

  // 2. Liftoff & Ascent Phase
  useEffect(() => {
    if (stage !== 'liftoff') return;

    const interval = setInterval(() => {
      setTelemetryAlt((prev) => Math.min(85, prev + 12));
      setTelemetryVel((prev) => Math.min(2400, prev + 340));
    }, 250);

    const timer = setTimeout(() => {
      clearInterval(interval);
      sfx.playStageSeparation();
      setStage('separation');
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [stage]);

  // 3. Stage Separation Phase
  useEffect(() => {
    if (stage !== 'separation') return;

    const interval = setInterval(() => {
      setTelemetryAlt((prev) => Math.min(220, prev + 25));
      setTelemetryVel((prev) => Math.min(7800, prev + 650));
    }, 250);

    const timer = setTimeout(() => {
      clearInterval(interval);
      sfx.playSuccessChime();
      setStage('injection');
    }, 2600);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [stage]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Launch Sequence"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-300"
    >
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Background Radial Glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-rift-orange/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-mono relative z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 uppercase tracking-widest text-[10px]">
              LAUNCH SYSTEM TERMINAL // {rocket?.name || 'HEAVY LIFTER'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleToggleSound}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono flex items-center space-x-1.5 transition-colors"
            >
              <span>SKIP</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Center Animation Stage */}
        <div className="my-8 text-center flex flex-col items-center justify-center min-h-[260px] relative z-10">
          {/* STAGE 1: COUNTDOWN */}
          {stage === 'countdown' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-150">
              <div className="text-[11px] font-mono text-rift-orange font-bold uppercase tracking-[0.3em]">
                TERMINAL COUNTDOWN SEQUENCE
              </div>
              <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_24px_rgba(255,94,30,0.45)]">
                T-{countdownNum < 10 ? `0${countdownNum}` : countdownNum}
              </div>
              <p className="text-xs font-mono text-slate-400">
                All launch pad clamps pressurized &bull; Cryogenic tanks fully conditioned
              </p>
            </div>
          )}

          {/* STAGE 2: LIFTOFF */}
          {stage === 'liftoff' && (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
              <div className="inline-flex p-4 rounded-2xl bg-rift-orange/20 border border-rift-orange/40 text-rift-orange animate-bounce">
                <Rocket className="w-12 h-12" />
              </div>
              <div>
                <div className="text-[11px] font-mono text-rift-orange font-bold uppercase tracking-[0.25em]">
                  MAIN ENGINE IGNITION
                </div>
                <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white mt-1">
                  LIFTOFF!
                </h2>
              </div>
              {/* Rocket Exhaust Particles */}
              <div className="w-12 h-16 mx-auto bg-gradient-to-t from-transparent via-amber-500 to-white rounded-full blur-sm opacity-90 animate-pulse" />
            </div>
          )}

          {/* STAGE 3: SEPARATION */}
          {stage === 'separation' && (
            <div className="space-y-4 animate-in zoom-in-90 duration-300">
              <div className="flex items-center justify-center space-x-3 text-cyan-400">
                <div className="w-8 h-12 border-l-2 border-dashed border-cyan-400 -rotate-12 opacity-80" />
                <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40">
                  <Zap className="w-8 h-8 text-cyan-300 animate-pulse" />
                </div>
                <div className="w-8 h-12 border-r-2 border-dashed border-cyan-400 rotate-12 opacity-80" />
              </div>

              <div>
                <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-[0.2em]">
                  MECO // MAIN ENGINE CUTOFF
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
                  STAGE SEPARATION CONFIRMED
                </h2>
              </div>
              <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                Booster decoupled cleanly &bull; Payload fairing jettisoned &bull; Vacuum upper stage burning
              </p>
            </div>
          )}

          {/* STAGE 4: INJECTION */}
          {stage === 'injection' && (
            <div className="space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-[0.25em]">
                  ORBITAL INSERTION ACHIEVED
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
                  TRANSIT INJECTION NOMINAL
                </h2>
              </div>
              <p className="text-xs font-mono text-slate-300 max-w-md mx-auto">
                Spacecraft solar arrays deployed &bull; Telemetry carrier acquired by Deep Space Network.
              </p>

              <button
                type="button"
                onClick={onComplete}
                className="mt-4 px-6 py-3 rounded-xl bg-rift-orange hover:bg-rift-orangeHover text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-2 transition-all shadow-hud-orange hover:scale-105"
              >
                <span>ENTER FLIGHT CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Did You Know? Aerospace Fact during Launch Loading */}
        <div className="pt-3 relative z-10">
          <DidYouKnowCard destination={mission.destination} variant="dark" />
        </div>

        {/* Bottom Telemetry Strip */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center font-mono text-xs relative z-10">
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <div className="text-[9px] text-slate-400 uppercase">MISSION TARGET</div>
            <div className="font-bold text-white mt-0.5 truncate">{mission.destinationName}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <div className="text-[9px] text-slate-400 uppercase">ALTITUDE</div>
            <div className="font-bold text-white mt-0.5">{telemetryAlt} km</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <div className="text-[9px] text-slate-400 uppercase">VELOCITY</div>
            <div className="font-bold text-emerald-400 mt-0.5">{telemetryVel.toLocaleString()} m/s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

