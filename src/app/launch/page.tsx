'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/game/engine/GameContext';
import {
  Rocket,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Flame,
  Info,
  Play,
  Pause,
  Clock,
} from 'lucide-react';
import { sfx } from '@/lib/audio';
import { music } from '@/lib/music';
import confetti from 'canvas-confetti';
import { unlockAchievement } from '@/data/achievements';
import { DidYouKnowCard } from '@/components/science/DidYouKnowCard';
import { runPreflightDiagnostics } from '@/game/physics/budgetEngine';
import { Panel, Button, Badge, ProgressBar, SectionLabel, MissionSegmentChip } from '@/components/ui';

type OutcomeType = 'success' | 'risky_success' | 'partial' | 'failure' | null;

interface BlockerItem {
  system: string;
  title: string;
  description: string;
}

export default function LaunchPage() {
  const router = useRouter();
  const {
    activeScenario,
    selectedMission,
    selectedLauncher,
    selectedRocket,
    budgets,
    selectedComponents,
    setPhase,
  } = useGame();

  const mission = selectedMission || activeScenario;
  const launcher = selectedRocket || selectedLauncher;

  // Calculation parameters
  const capacityKg = launcher?.maxPayloadKg[mission.destination] || 0;
  const craftMass = budgets.totalMassKg;
  const isOverMass = capacityKg > 0 && craftMass > capacityKg;
  const marginKg = capacityKg - craftMass;
  const fillPct = capacityKg > 0 ? Math.min(100, Math.max(0, (craftMass / capacityKg) * 100)) : 100;

  // Preflight blockers check
  const [activeBlockers, setActiveBlockers] = useState<BlockerItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('skyrift_preflight_blockers');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveBlockers(parsed);
            return;
          }
        }
      } catch {
        // ignore
      }
      // Fallback: derive from diagnostics
      const diags = runPreflightDiagnostics(selectedComponents, mission, launcher, budgets);
      const errs = diags.filter((d) => d.type === 'error').map((e) => ({
        system: e.system,
        title: e.title,
        description: e.description,
      }));
      setActiveBlockers(errs);
    }
  }, [selectedComponents, mission, launcher, budgets]);

  const hasBlockers = activeBlockers.length > 0;

  // Reliability combination & Blocker penalty (Requirement 1: Reliability roll must include any blocker)
  const rocketRel = launcher?.reliability || 0.95;
  const partsRel = budgets.systemReliabilityAverage || 0.96;
  const combinedReliability = Math.round((rocketRel * 0.65 + partsRel * 0.35) * 1000) / 10;
  const blockerPenalty = hasBlockers ? activeBlockers.length * 15 : 0;
  const effectiveReliability = Math.max(10, Math.round((combinedReliability - blockerPenalty) * 10) / 10);

  // Launch countdown & outcome state
  const [stage, setStage] = useState<'standby' | 'counting' | 'outcome'>('standby');
  const [countdown, setCountdown] = useState<number>(10);
  const [outcome, setOutcome] = useState<OutcomeType>(null);
  const [failureReason, setFailureReason] = useState<string>('');
  const [partialNote, setPartialNote] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartCountdown = () => {
    sfx.playClick();
    music.ensurePlaying();
    setStage('counting');
    setCountdown(10);

    let currentCount = 10;
    timerRef.current = setInterval(() => {
      currentCount -= 1;
      setCountdown(currentCount);

      if (currentCount > 0) {
        sfx.playClick();
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        resolveLaunchResult();
      }
    }, 1000);
  };

  const handleAbort = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStage('standby');
    setCountdown(10);
    sfx.playAlert();
  };

  const resolveLaunchResult = () => {
    setStage('outcome');

    // 1. Hard Failure: Ineligible rocket (0 capacity)
    if (capacityKg === 0) {
      setOutcome('failure');
      setFailureReason(
        `${launcher?.name || 'Selected booster'} is not rated for ${mission.destinationName} missions. The rocket lacked the upper-stage orbital energy to escape Earth orbit.`
      );
      sfx.playAlert();
      return;
    }

    // 2. Reliability Roll (Requirement 1: Reliability roll must include any blocker)
    const roll = Math.random() * 100;
    const threshold = effectiveReliability;

    if (roll <= threshold) {
      // Success (Requirement 2: Perfect Launch & full velocity wording ONLY if no blockers)
      if (hasBlockers) {
        setOutcome('risky_success');
      } else {
        setOutcome('success');
        unlockAchievement('perfect-launch');
      }
      setPhase('flight');
      sfx.playTelemetryBeep();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } else if (roll <= threshold + 6) {
      // Partial Success
      setOutcome('partial');
      setPhase('flight');
      setPartialNote(
        'Main booster turbopump experienced minor cavitation during MECO (Main Engine Cutoff). Spacecraft achieved orbital injection with a 12% velocity penalty.'
      );
      sfx.playTelemetryBeep();
    } else {
      // Random Reliability Failure (incorporates blocker penalties)
      setOutcome('failure');
      const leadBlocker = activeBlockers[0]?.title || 'Booster stage 1 turbopump anomaly';
      setFailureReason(
        `${leadBlocker} triggered critical ascent malfunction (reliability roll failed: ${roll.toFixed(1)} vs ${threshold}% required). Automatic Range Safety flight termination triggered.`
      );
      sfx.playAlert();
    }
  };

  const handleProceedToFlight = () => {
    sfx.playClick();
    router.push('/flight');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="pb-5 border-b border-[rgba(148,163,184,0.18)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <SectionLabel label="STEP 04 // LAUNCH TERMINAL" />
              <MissionSegmentChip segment="launch" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              LAUNCH VEHICLE VERIFICATION
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Conduct pad pre-flight telemetry checks, verify payload mass margins against {launcher?.name || 'the booster'}, and initiate the launch sequence.
            </p>
          </div>

          <Panel variant="subtle" className="px-3.5 py-2 text-xs font-mono shrink-0">
            <span className="text-slate-400">TARGET: </span>
            <b className="text-white">{mission.name.toUpperCase()}</b>
          </Panel>
        </div>

        {/* 1. Payload Capacity Margin Bar */}
        <Panel variant="default" className="mt-6 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider">
                PAYLOAD LIFT MARGIN
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {launcher?.name || 'Selected Booster'} &bull; {mission.destinationName}
              </h2>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-400">SPARE MARGIN:</span>
              <span
                className={`font-black px-2 py-0.5 rounded text-xs ${
                  isOverMass
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                    : marginKg < capacityKg * 0.15
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isOverMass
                  ? `${Math.abs(marginKg).toLocaleString()} kg OVERLOAD`
                  : `+${marginKg.toLocaleString()} kg (${Math.round((marginKg / capacityKg) * 100)}% SPARE)`}
              </span>
            </div>
          </div>

          {/* Visual Margin Meter Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3.5 rounded-full bg-[#050A1C] overflow-hidden p-0.5 border border-[rgba(148,163,184,0.18)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverMass
                    ? 'bg-rose-500'
                    : fillPct >= 85
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
              <span>0 kg</span>
              <span className="font-bold text-white">
                Craft Weight: {craftMass.toLocaleString()} kg
              </span>
              <span>Max Capacity: {capacityKg.toLocaleString()} kg</span>
            </div>
          </div>
        </Panel>

        {/* 2. Combined Reliability Breakdown Card */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Panel variant="subtle" className="p-4">
            <div className="text-[10px] font-mono text-slate-400 uppercase">BOOSTER RELIABILITY</div>
            <div className="text-xl font-black font-mono text-white mt-0.5">
              {Math.round(rocketRel * 1000) / 10}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{launcher?.name} rating</div>
          </Panel>

          <Panel variant="subtle" className="p-4">
            <div className="text-[10px] font-mono text-slate-400 uppercase">SYSTEMS AVERAGE</div>
            <div className="text-xl font-black font-mono text-white mt-0.5">
              {Math.round(partsRel * 1000) / 10}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Across {selectedComponents.length} installed modules
            </div>
          </Panel>

          <Panel variant="subtle" className="p-4">
            <div className="text-[10px] font-mono text-rift-orange uppercase font-bold">
              LIFTOFF PROBABILITY
            </div>
            <div className={`text-xl font-black font-mono mt-0.5 ${hasBlockers ? 'text-amber-400' : 'text-emerald-400'}`}>
              {effectiveReliability}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {hasBlockers ? `-${blockerPenalty}% penalty (${activeBlockers.length} active blockers)` : 'Nominal ascent target'}
            </div>
          </Panel>
        </div>

        {/* 3. Main Launch Terminal: Countdown or Outcome Panel */}
        <Panel variant="elevated" className="mt-6 p-6 sm:p-8 text-center">
          {stage === 'standby' && (
            <div className="flex flex-col items-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-rift-orange/15 border border-rift-orange/30 text-rift-orange flex items-center justify-center mb-4">
                <Rocket className="w-8 h-8" />
              </div>
              <SectionLabel label="PAD READY // ALL SYSTEMS GO" className="mb-1" />
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                READY FOR LAUNCH COUNTDOWN
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Booster propellant loaded, avionics aligned, and range telemetry green. Press the button below to initiate the T-10 automated countdown.
              </p>

              <Button
                variant="primary"
                glow
                onClick={handleStartCountdown}
                className="mt-6 px-8 py-3 text-sm flex items-center space-x-2"
              >
                <Flame className="w-4 h-4 fill-white" />
                <span>INITIATE T-10 COUNTDOWN</span>
              </Button>
            </div>
          )}

          {stage === 'counting' && (
            <div className="flex flex-col items-center max-w-md mx-auto py-2">
              <div className="text-[11px] font-mono font-bold text-rift-orange uppercase tracking-[0.25em] animate-pulse">
                AUTOMATED LAUNCH SEQUENCE ACTIVE
              </div>
              <div className="my-6 text-7xl sm:text-8xl font-black font-mono text-white tracking-tighter">
                T-{countdown}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {countdown > 3
                  ? 'Terminal propellant pressurization & guidance lock...'
                  : countdown > 0
                  ? 'Main engine ignition sequence started...'
                  : 'LIFTOFF!'}
              </p>

              <Button
                variant="danger"
                onClick={handleAbort}
                className="mt-6 text-xs uppercase"
              >
                ABORT COUNTDOWN
              </Button>
            </div>
          )}

          {stage === 'outcome' && outcome === 'success' && (
            <div className="flex flex-col items-center max-w-lg mx-auto py-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-[0.2em] mb-1">
                LIFTOFF & ORBITAL INSERTION NOMINAL
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                LAUNCH SUCCESSFUL, full velocity margin
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                All booster stages burned to completion. Second stage separation confirmed with full velocity margin. {mission.name} has successfully entered cruise trajectory!
              </p>

              <Button
                variant="primary"
                glow
                onClick={handleProceedToFlight}
                className="mt-6 px-8 py-3 text-sm bg-emerald-600 hover:bg-emerald-500 flex items-center space-x-2"
              >
                <span>CONTINUE TO FLIGHT OPERATIONS</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {stage === 'outcome' && outcome === 'risky_success' && (
            <div className="flex flex-col items-center max-w-lg mx-auto py-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-[0.2em] mb-1">
                ORBIT ACHIEVED // ACTIVE RISK FACTORS
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                LAUNCH COMPLETED WITH RISKS
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Spacecraft reached orbital velocity, but flight telemetry has flagged active unresolved pre-flight blockers:
              </p>

              <div className="mt-4 w-full text-left p-4 rounded-xl bg-[#070E24] border border-amber-500/30 text-xs font-mono space-y-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  ACTIVE UNRESOLVED BLOCKERS:
                </span>
                <ul className="space-y-1.5 text-slate-200">
                  {activeBlockers.map((b, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-amber-400 shrink-0">•</span>
                      <span>
                        <b className="text-amber-300">{b.title}:</b> {b.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="primary"
                glow
                onClick={handleProceedToFlight}
                className="mt-6 px-8 py-3 text-sm bg-amber-600 hover:bg-amber-500 flex items-center space-x-2"
              >
                <span>CONTINUE TO FLIGHT OPERATIONS (RISKY)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {stage === 'outcome' && outcome === 'partial' && (
            <div className="flex flex-col items-center max-w-lg mx-auto py-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-[0.2em] mb-1">
                ORBIT ACHIEVED // SUB-NOMINAL PERFORMANCE
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                PARTIAL LAUNCH SUCCESS
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {partialNote}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/hangar" onClick={() => sfx.playClick()}>
                  <Button variant="secondary" className="flex items-center space-x-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>REDESIGN IN HANGAR</span>
                  </Button>
                </Link>

                <Button
                  variant="primary"
                  glow
                  onClick={handleProceedToFlight}
                  className="flex items-center space-x-1.5"
                >
                  <span>PROCEED WITH CAUTION</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {stage === 'outcome' && outcome === 'failure' && (
            <div className="flex flex-col items-center max-w-lg mx-auto py-2">
              <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3">
                <XCircle className="w-8 h-8" />
              </div>
              <div className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-[0.2em] mb-1">
                MISSION ABORTED // LAUNCH FAILURE
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                LAUNCH FAILED
              </h2>
              <div className="mt-3 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs text-left leading-relaxed">
                <b>Root Cause:</b> {failureReason}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/hangar" onClick={() => sfx.playClick()}>
                  <Button variant="primary" glow className="flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>REDESIGN IN HANGAR (PARTS KEPT)</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Panel>

        {/* 4. "Why This Matters" Educational Text (The Rocket Equation in Beginner Language) */}
        <Panel variant="subtle" className="mt-6 p-4 sm:p-5 flex items-start space-x-3.5">
          <Info className="w-5 h-5 text-rift-orange shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <b className="font-mono text-white uppercase block mb-0.5">
              WHY THIS MATTERS // THE ROCKET EQUATION (TSIOLKOVSKY)
            </b>
            The Tsiolkovsky rocket equation (<span className="font-mono text-white font-bold">Δv = Isp &bull; g₀ &bull; ln(m₀ / mf)</span>) explains spaceflight’s hardest rule: rockets must carry their own fuel. Because every extra kilogram of spacecraft requires exponential propellant to lift that fuel, adding heavy equipment reduces your rocket’s orbital reach. Selecting a booster with safe lift margin protects against catastrophic atmospheric drag and stage separation failures!
          </div>
        </Panel>

        {/* 5. Aerospace Fact on Launchpad */}
        <div className="mt-4">
          <DidYouKnowCard destination={mission.destination} />
        </div>
      </div>

      {/* Footer Navigation Back to Flight Plan */}
      <div className="mt-8 pt-4 border-t border-[rgba(148,163,184,0.18)] flex items-center justify-between">
        <Link href="/flight-plan" onClick={() => sfx.playClick()}>
          <Button variant="secondary" className="flex items-center space-x-1.5">
            <span>&larr; BACK TO ROCKET SELECTION</span>
          </Button>
        </Link>

        {stage === 'outcome' && outcome === 'failure' && (
          <Link
            href="/hangar"
            onClick={() => sfx.playClick()}
            className="text-xs font-mono font-bold text-rift-orange hover:underline"
          >
            Adjust Spacecraft Mass in Hangar &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
