'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGame } from '@/game/engine/GameContext';
import { useTeam } from '@/game/team/TeamContext';
import { ROCKETS } from '@/data/gameData';
import { LaunchVehicle } from '@/game/types';
import { getMissionRequirements } from '@/game/physics/budgetEngine';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Rocket,
  Wrench,
  Lock,
  Check,
  Info,
  X,
  Zap,
  Globe2,
  Gauge,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { sfx } from '@/lib/audio';
import { Panel, Button, Badge, ProgressBar, SectionLabel, MissionSegmentChip, SourceInfoBadge, MissionCoachPanel } from '@/components/ui';

function formatCredits(cr: number): string {
  const isNeg = cr < 0;
  const abs = Math.abs(cr);
  const formatted =
    abs >= 1_000_000
      ? `${(abs / 1_000_000).toFixed(2).replace(/\.00$/, '')}M CR`
      : `${Math.round(abs / 1_000)}K CR`;
  return isNeg ? `-${formatted}` : formatted;
}

interface RocketDossier {
  tag: string;
  classTitle: string;
  analog: string;
  engineType: string;
  propellant: string;
  stages: string;
  keyStrength: string;
  bestFor: string;
  mechanicsNote: string;
}

const ROCKET_DOSSIERS: Record<string, RocketDossier> = {
  'launcher-aerodart': {
    tag: 'LIGHT LEO',
    classTitle: 'SmallSat Dedicated Launch Vehicle',
    analog: 'Rocket Lab Electron / Astra Rocket 3',
    engineType: '3D-Printed Electric-Pump Fed Rutherford Engines',
    propellant: 'Battery Electric + RP-1/LOX',
    stages: '2 Stages (Expendable)',
    keyStrength: 'Lowest launch cost for lightweight orbital satellites',
    bestFor: 'Earth observation & climate cubesats up to 550 kg in LEO',
    mechanicsNote:
      'AeroDart uses electric battery-driven turbopumps instead of complex gas generators, drastically lowering launch cost. Because it is optimized exclusively for Low Earth Orbit, it lacks the secondary stage burn capacity for lunar or interplanetary transfer orbits.',
  },
  'launcher-valkyrie9': {
    tag: 'MEDIUM LIFTER',
    classTitle: 'Reusable Medium Workhorse',
    analog: 'SpaceX Falcon 9 / Ariane 6',
    engineType: 'Open-Cycle Gas Generator Merlin-class Engines',
    propellant: 'Kerolox (RP-1 / Liquid Oxygen)',
    stages: '2 Stages (First stage propulsively reusable)',
    keyStrength: 'Reusability with high cadence and interplanetary reach',
    bestFor: 'Lunar orbiters, planetary communications relays, and inner solar system probes',
    mechanicsNote:
      'Propulsive first-stage recovery dramatically drives down flight cost while maintaining a 98.5% flight-proven reliability record. Valkyrie-9 carries enough upper-stage delta-v to execute Trans-Lunar Injections (TLI) and modest Mars transfers.',
  },
  'launcher-titanheavy': {
    tag: 'HEAVY TRI-CORE',
    classTitle: 'Interplanetary Heavy Flagship Booster',
    analog: 'Delta IV Heavy / Falcon Heavy',
    engineType: 'Triple-Core Clustered Hydrocarbon Heavy Boosters',
    propellant: 'Hydrocarbon / LOX Multi-Core Cluster',
    stages: '2.5 Stages (3 Cores with Cross-Feed Staging)',
    keyStrength: 'Direct deep space transfer injection with massive payload margin',
    bestFor: 'Heavily shielded robotic flagships to Mars and the outer planets',
    mechanicsNote:
      'Three synchronized booster cores ignite at liftoff to generate over 5 million pounds of thrust. Titan-Heavy bypasses the need for orbital refueling by delivering multi-ton scientific platforms directly into high-energy heliocentric transfer trajectories.',
  },
  'launcher-novastarship': {
    tag: 'SUPER-HEAVY',
    classTitle: 'Next-Gen Methane Super-Heavy Transport',
    analog: 'SpaceX Starship / NASA SLS Block 2',
    engineType: 'Full-Flow Staged Combustion Methalox Engines',
    propellant: 'Liquid Methane / Liquid Oxygen (Methalox)',
    stages: '2 Stages (100% Fully Reusable Architecture)',
    keyStrength: 'Unconstrained payload mass and volumetric fairing capacity',
    bestFor: 'Deep asteroid scouting, massive planetary rovers, and permanent habitats',
    mechanicsNote:
      'Liquid methane burns cleaner than kerosene, eliminating soot buildup and enabling rapid booster turnaround. Nova provides unparalleled payload capacity (up to 40 metric tons), allowing science teams to install maximum payload instrumentation without strict weight penalties.',
  },
};

export default function FlightPlanPage() {
  const {
    activeScenario,
    selectedMission,
    selectedLauncher,
    selectedRocket,
    selectLauncher,
    selectRocket,
    budgets,
    selectedComponents,
    difficulty,
  } = useGame();

  const { gameMode, canSelectRocket } = useTeam();
  const isAllowedToSelect = canSelectRocket();

  const [detailLauncher, setDetailLauncher] = useState<LaunchVehicle | null>(null);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const mission = selectedMission || activeScenario;
  const launcherActive = selectedRocket || selectedLauncher;
  const reqs = getMissionRequirements(mission, difficulty, launcherActive);
  const chooseLauncher = (id: string) => {
    if (gameMode === 'team' && !isAllowedToSelect) {
      sfx.playAlert();
      return;
    }
    sfx.playClick();
    selectRocket(id);
    selectLauncher(id);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailLauncher(null);
        setGuideModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCraftEmpty = budgets.totalMassKg === 0 || selectedComponents.length === 0;
  const currentRocketCost = launcherActive?.costCredits || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1 flex flex-col justify-between">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-[rgba(148,163,184,0.18)] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionLabel color="orange">STEP 03 // ROCKET SELECTION</SectionLabel>
            <MissionSegmentChip segment="launch" />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              CHOOSE YOUR LAUNCH VEHICLE
            </h1>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setGuideModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0E1836] hover:bg-[#15234A] border border-[rgba(148,163,184,0.22)] hover:border-slate-500 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all shadow-sm"
              title="Learn how orbital payload & escape energy work"
            >
              <BookOpen className="w-3.5 h-3.5 text-rift-orange" />
              <span>ROCKET SCIENCE GUIDE</span>
            </button>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl font-sans">
            Select a booster to launch your craft (<b className="text-white font-mono">{budgets.totalMassKg} kg</b>) into{' '}
            <b className="text-white">{mission.destinationName}</b> orbit within your budget grant.
          </p>

          {gameMode === 'team' && !isAllowedToSelect && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-xs font-mono text-amber-200 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>In Team Mode, launch vehicle selection is controlled by the <b>Mission Director</b>.</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-[#0A1228] border border-[rgba(148,163,184,0.18)] text-xs font-mono shadow-sm">
            <span className="text-slate-400">CRAFT WEIGHT: </span>
            <b className={isCraftEmpty ? 'text-amber-400' : 'text-white font-bold'}>
              {budgets.totalMassKg} kg
            </b>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#0A1228] border border-[rgba(148,163,184,0.18)] text-xs font-mono hidden sm:block shadow-sm">
            <span className="text-slate-400">MISSION GRANT: </span>
            <b className="text-white">
              {formatCredits(mission.budgetCredits)}
            </b>
          </div>
        </div>
      </div>

      {/* Collapsible Mission Coach for Flight Plan (Rule 3) */}
      <div className="mb-4">
        <MissionCoachPanel
          title="Launch Vehicle Flight Dynamics & Sizing"
          badge="LAUNCH COACH"
          summary="Booster selection couples launch cost directly against lift capacity. Ensuring positive mass margin avoids costly trajectory penalties."
          tips={[
            'Light lifters minimize launch costs for small LEO payloads but cannot escape Earth gravity.',
            'Multi-stage boosters like Titan-Heavy and Nova deliver payloads directly into Trans-Mars and interplanetary transfer orbits.',
            'Remaining budget carries over into operations as an anomaly contingency reserve.',
          ]}
          whyItMatters="Tsiolkovsky's Rocket Equation dictates exponential fuel requirements for heavy payload fractions. Sizing the right booster prevents mission mass aborts."
          whatRealMissionsDo="NASA mission planners mandate a minimum 15-20% payload mass margin at Critical Design Review (CDR) to account for hardware growth."
          formula={{
            name: "Tsiolkovsky Ideal Rocket Equation",
            equation: "Δv = g0 * Isp * ln(m0 / mf)",
            workedExample: `Current spacecraft wet mass is ${budgets.totalMassKg} kg. Total booster stage capacity must exceed this mass at ${mission.destinationName}.`,
          }}
          chips={
            reqs.isBeginner ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                {reqs.allowanceLabel}
              </span>
            ) : undefined
          }
        />
      </div>

      {/* Main Body: Empty State vs Uncluttered 4-Card Grid */}
      {isCraftEmpty ? (
        <Panel variant="subtle" className="my-auto py-16 px-6 text-center border-dashed border-[rgba(148,163,184,0.25)] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-rift-orange/15 border border-rift-orange/30 text-rift-orange flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8" />
          </div>
          <SectionLabel color="orange">CRAFT MASS // 0 KG</SectionLabel>
          <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight mt-1">
            BUILD YOUR SPACECRAFT FIRST
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-md leading-relaxed">
            You haven&apos;t installed any modules on your spacecraft yet. Enter the Hangar to assemble your structure, power, propulsion, and payloads before sizing a booster.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/hangar" onClick={() => sfx.playClick()}>
              <Button variant="primary" glow className="flex items-center space-x-2">
                <span>ENTER SPACECRAFT HANGAR</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Panel>
      ) : (
        <>
          {/* Crisp, Breathable 4-Column Card Grid with zero clutter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 my-auto">
            {ROCKETS.map((launcher) => {
              const isSelected = launcherActive?.id === launcher.id;
              const launcherReqs = getMissionRequirements(mission, difficulty, launcher);
              const capacityToDestination = launcherReqs.massLimitKg;
              const isEligible = (launcher.maxPayloadKg[mission.destination] || 0) > 0;
              const canLiftCurrentMass = isEligible && capacityToDestination >= budgets.totalMassKg;
              const isSuggested = launcher.id === mission.suggestedLauncherId;
              const fillPct = isEligible ? Math.min(100, (budgets.totalMassKg / capacityToDestination) * 100) : 100;

              const projectedRemaining = budgets.remainingCredits + currentRocketCost - launcher.costCredits;
              const isOverBudget = projectedRemaining < 0;
              const margin = capacityToDestination - budgets.totalMassKg;
              const dossier = ROCKET_DOSSIERS[launcher.id];

              return (
                <div
                  key={launcher.id}
                  onClick={() => {
                    if (isEligible) chooseLauncher(launcher.id);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between select-none relative group ${
                    !isEligible
                      ? 'bg-[#070E24]/50 border-[rgba(148,163,184,0.1)] opacity-55 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#0D1733] border-[#FF5A1F] ring-1 ring-[#FF5A1F] shadow-[0_0_24px_rgba(255,90,31,0.28)] cursor-pointer'
                      : 'bg-[#0A1228] border-[rgba(148,163,184,0.16)] hover:bg-[#0E1836] hover:border-[rgba(56,189,248,0.4)] cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  <div>
                    {/* Top Tag Badges + (i) Button + Selection Check */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#070E24] border border-[rgba(148,163,184,0.2)] text-slate-300 uppercase tracking-wider">
                          {dossier?.tag || 'BOOSTER'}
                        </span>
                        {isSuggested && (
                          <Badge variant="warn">
                            RECOMMENDED
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Interactive (i) Button to Learn Flight Details */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sfx.playClick();
                            setDetailLauncher(launcher);
                          }}
                          className="w-7 h-7 rounded-lg bg-[#0E1836] hover:bg-[#16254F] border border-[rgba(148,163,184,0.25)] hover:border-[#38BDF8] text-[#38BDF8] hover:text-white flex items-center justify-center transition-all shadow-xs"
                          title="Click to view full flight specs and learn about this rocket"
                          aria-label={`Flight details for ${launcher.name}`}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>

                        {isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center shrink-0 shadow-[0_0_10px_#FF5A1F]">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full border border-slate-700/80 shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Rocket Name */}
                    <h2 className="text-base sm:text-lg font-black font-mono text-[#F1F5F9] leading-tight">
                      {launcher.name}
                    </h2>

                    {/* Lift Capacity Section (Clean, Uncluttered) */}
                    <div className="mt-3.5 p-3 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.14)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 text-[11px] uppercase">
                          LIFT TO {mission.destination.toUpperCase()}
                        </span>
                        <span
                          className={`font-black ${
                            !isEligible
                              ? 'text-rose-400'
                              : canLiftCurrentMass
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {isEligible ? `${capacityToDestination.toLocaleString()} kg max` : 'NOT RATED'}
                        </span>
                      </div>

                      {isEligible && (
                        <ProgressBar
                          value={fillPct}
                          variant={canLiftCurrentMass ? 'default' : 'danger'}
                        />
                      )}

                      <div className="text-[11px] font-mono leading-tight pt-0.5">
                        {!isEligible ? (
                          <span className="text-rose-400 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Incompatible destination</span>
                          </span>
                        ) : !canLiftCurrentMass ? (
                          <span className="text-rose-400 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>-{Math.abs(margin).toLocaleString()} kg overweight</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>+{margin.toLocaleString()} kg spare margin</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cost & Grant Feasibility */}
                    <div className="mt-3 p-3 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.14)] font-mono space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] uppercase">LAUNCH COST</span>
                        <span className="text-sm font-black text-white inline-flex items-center">
                          {formatCredits(launcher.costCredits)}
                          <SourceInfoBadge
                            status={launcher.valueSources?.costCredits?.status || 'placeholder'}
                            url={launcher.valueSources?.costCredits?.url || launcher.sourceUrl}
                            citation={launcher.valueSources?.costCredits?.citation || launcher.sourceCitation}
                            label="Booster Cost"
                            className="ml-1"
                          />
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">GRANT IMPACT:</span>
                        <span
                          className={`font-bold ${
                            isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isOverBudget
                            ? `${formatCredits(projectedRemaining)} (Deficit)`
                            : `${formatCredits(projectedRemaining)} left`}
                        </span>
                      </div>
                    </div>

                    {/* Reliability & Quick Specs Pill */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                      <span className="inline-flex items-center">
                        Reliability: <b className="text-slate-200 ml-1">{Math.round(launcher.reliability * 100)}%</b>
                        <SourceInfoBadge
                          status={launcher.valueSources?.reliability?.status || 'derived'}
                          url={launcher.valueSources?.reliability?.url || launcher.sourceUrl}
                          citation={launcher.valueSources?.reliability?.citation || launcher.sourceCitation}
                          label="Reliability"
                          className="ml-1"
                        />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sfx.playClick();
                          setDetailLauncher(launcher);
                        }}
                        className="text-[#38BDF8] hover:text-white hover:underline flex items-center space-x-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Select Button (Quiet outline - Rule 1) */}
                  <div className="mt-4 pt-3 border-t border-[rgba(148,163,184,0.12)]">
                    <button
                      type="button"
                      disabled={!isEligible}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEligible) chooseLauncher(launcher.id);
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold tracking-wider transition-all border ${
                        !isEligible
                          ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-xs'
                          : 'bg-[#0E1836] border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white'
                      }`}
                    >
                      {!isEligible ? 'UNAVAILABLE' : isSelected ? 'SELECTED ✓' : 'SELECT ROCKET'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Consolidated Bottom Action Bar - Single Primary Strong Orange CTA (Rule 1) */}
          <Panel variant="elevated" className="mt-5 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 text-xs font-mono w-full md:w-auto">
              <div
                className={`p-2.5 rounded-xl border shrink-0 ${
                  budgets.isMassExceeded || budgets.isOverBudget
                    ? 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                    : 'bg-[#FF5A1F]/15 border-[#FF5A1F]/30 text-[#FF5A1F]'
                }`}
              >
                <Rocket className="w-5 h-5 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white uppercase truncate">
                    SELECTED: {launcherActive?.name || 'NONE'}
                  </span>
                  {launcherActive && (
                    <Badge variant={budgets.isMassExceeded || budgets.isOverBudget ? 'danger' : 'good'}>
                      {budgets.isMassExceeded ? 'OVER MASS' : budgets.isOverBudget ? 'OVER BUDGET' : 'LAUNCH READY'}
                    </Badge>
                  )}
                </div>
                <div className="text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span>Target Δv: <b className="text-white">{budgets.requiredDeltaVMs.toLocaleString()} m/s</b></span>
                  <span>•</span>
                  <span>
                    Remaining Grant:{' '}
                    <b className={budgets.isOverBudget ? 'text-rose-400' : 'text-emerald-400'}>
                      {formatCredits(budgets.remainingCredits)}
                    </b>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto justify-end shrink-0">
              <Link href="/hangar" onClick={() => sfx.playClick()}>
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-mono font-bold text-xs uppercase flex items-center space-x-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>BACK TO HANGAR</span>
                </button>
              </Link>

              <Link href="/preflight" onClick={() => sfx.playClick()}>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-rift-orange hover:bg-[#E64C0E] text-white font-mono font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-[0_0_20px_rgba(255,90,31,0.5)] transition-all active:scale-95"
                >
                  <span>NEXT: LAUNCH CHECK</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </Panel>
        </>
      )}

      {/* =========================================================================
          FLIGHT DETAILS DOSSIER & LEARNING MODAL (TRIGGERED BY (i) BUTTON)
         ========================================================================= */}
      {detailLauncher && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setDetailLauncher(null)}
          className="fixed inset-0 z-50 bg-[#050A1C]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0A1228] border border-[rgba(148,163,184,0.22)] shadow-[0_16px_50px_rgba(0,0,0,0.85)] p-5 sm:p-7 space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[rgba(148,163,184,0.18)]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FF5A1F]/15 border border-[#FF5A1F]/40 text-[#FF5A1F] uppercase tracking-wider">
                    {ROCKET_DOSSIERS[detailLauncher.id]?.tag || 'LAUNCH VEHICLE'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    DOSSIER // {detailLauncher.id.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                  {detailLauncher.name}
                </h2>
                <p className="text-xs font-mono text-[#38BDF8] mt-0.5">
                  {ROCKET_DOSSIERS[detailLauncher.id]?.classTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailLauncher(null)}
                className="p-1.5 rounded-lg bg-[#0E1836] hover:bg-[#16254F] border border-[rgba(148,163,184,0.2)] text-slate-400 hover:text-white transition-colors"
                aria-label="Close dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview & Flight Mechanics Educational Insight */}
            <div className="p-4 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.14)] space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#FF5A1F]" />
                <span>AEROSPACE ARCHITECTURE & FLIGHT MECHANICS</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {ROCKET_DOSSIERS[detailLauncher.id]?.mechanicsNote}
              </p>
              <div className="pt-2 border-t border-[rgba(148,163,184,0.12)] text-xs font-mono text-slate-400">
                <b className="text-slate-200">Real-World Inspiration: </b>
                <span className="text-[#38BDF8]">{ROCKET_DOSSIERS[detailLauncher.id]?.analog}</span>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.12)] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">PROPULSION & ENGINE ARCHITECTURE</span>
                <span className="text-sm font-bold text-white block">
                  {ROCKET_DOSSIERS[detailLauncher.id]?.engineType}
                </span>
                <span className="text-[11px] text-[#38BDF8]">
                  Fuel: {ROCKET_DOSSIERS[detailLauncher.id]?.propellant}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.12)] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">FLIGHT STAGING & REUSABILITY</span>
                <span className="text-sm font-bold text-white block">
                  {ROCKET_DOSSIERS[detailLauncher.id]?.stages}
                </span>
                <span className="text-[11px] text-emerald-400">
                  Reliability Rating: {Math.round(detailLauncher.reliability * 100)}%
                </span>
              </div>
            </div>

            {/* Destination Payload Capacity Breakdown Table (Educational Matrix) */}
            <div>
              <div className="flex items-center justify-between mb-2 text-xs font-mono">
                <span className="font-bold text-slate-300 uppercase flex items-center space-x-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>ORBITAL DESTINATION PAYLOAD MATRIX</span>
                </span>
                <span className="text-[10px] text-slate-400">Higher escape energy reduces max payload</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                {[
                  { key: 'earth', name: 'Earth (LEO)', capacity: detailLauncher.maxPayloadKg.earth },
                  { key: 'moon', name: 'Lunar Orbit', capacity: detailLauncher.maxPayloadKg.moon },
                  { key: 'mars', name: 'Mars Transfer', capacity: detailLauncher.maxPayloadKg.mars },
                  { key: 'asteroid', name: 'Asteroid Belt', capacity: detailLauncher.maxPayloadKg.asteroid },
                ].map((dest) => {
                  const isCurrent = mission.destination === dest.key;
                  const canLift = dest.capacity >= budgets.totalMassKg;
                  return (
                    <div
                      key={dest.key}
                      className={`p-3 rounded-xl border ${
                        isCurrent
                          ? 'bg-[#0D1733] border-[#FF5A1F] shadow-[0_0_12px_rgba(255,90,31,0.2)]'
                          : 'bg-[#070E24] border-[rgba(148,163,184,0.12)]'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 uppercase truncate">
                        {dest.name} {isCurrent && '★'}
                      </div>
                      <div className="text-base font-black text-white mt-1 inline-flex items-center justify-center">
                        <span>{dest.capacity > 0 ? `${dest.capacity.toLocaleString()} kg` : '0 kg'}</span>
                        <SourceInfoBadge
                          status={dest.capacity > 0 ? 'derived' : 'placeholder'}
                          url={detailLauncher.sourceUrl}
                          citation={`${detailLauncher.name} payload to ${dest.name}`}
                          label={`${dest.name} Capacity`}
                          className="ml-1"
                        />
                      </div>
                      <div className="text-[10px] mt-1">
                        {dest.capacity === 0 ? (
                          <span className="text-rose-400">Not Rated</span>
                        ) : isCurrent ? (
                          <span className={canLift ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {canLift ? 'Can Lift Craft' : 'Craft Too Heavy'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-[rgba(148,163,184,0.18)] flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-xs">
                <span className="text-slate-400">Launch Cost: </span>
                <b className="text-white text-sm">{formatCredits(detailLauncher.costCredits)}</b>
              </div>

              <div className="flex items-center space-x-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDetailLauncher(null)}
                >
                  <span>CLOSE</span>
                </Button>

                <Button
                  variant={launcherActive?.id === detailLauncher.id ? 'ghost' : 'primary'}
                  size="sm"
                  glow={launcherActive?.id !== detailLauncher.id}
                  disabled={
                    (detailLauncher.maxPayloadKg[mission.destination] || 0) === 0 ||
                    (gameMode === 'team' && !isAllowedToSelect)
                  }
                  onClick={() => {
                    chooseLauncher(detailLauncher.id);
                    setDetailLauncher(null);
                  }}
                >
                  {launcherActive?.id === detailLauncher.id ? (
                    'CURRENTLY SELECTED ✓'
                  ) : (detailLauncher.maxPayloadKg[mission.destination] || 0) === 0 ? (
                    'CANNOT REACH DESTINATION'
                  ) : (
                    'SELECT THIS ROCKET'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDUCATIONAL ROCKET SCIENCE GUIDE MODAL
         ========================================================================= */}
      {guideModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setGuideModalOpen(false)}
          className="fixed inset-0 z-50 bg-[#050A1C]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0A1228] border border-[rgba(148,163,184,0.22)] shadow-[0_16px_50px_rgba(0,0,0,0.85)] p-5 sm:p-7 space-y-4"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[rgba(148,163,184,0.18)]">
              <div>
                <SectionLabel color="orange">AEROSPACE PRINCIPLES</SectionLabel>
                <h2 className="text-xl font-black font-mono text-white mt-1">
                  How Rocket Sizing Works
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setGuideModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#0E1836] hover:bg-[#16254F] border border-[rgba(148,163,184,0.2)] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.12)]">
                <b className="text-[#FF5A1F] block mb-1">1. The Payload Penalty:</b>
                Escaping Earth’s gravity well to reach the Moon or Mars requires dramatically more velocity ($\Delta v$) than staying in Low Earth Orbit (LEO). That extra velocity requires more propellant, which decreases the maximum payload mass a rocket can carry.
              </div>

              <div className="p-3.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.12)]">
                <b className="text-[#38BDF8] block mb-1">2. Sizing Your Booster:</b>
                Never buy more booster than your spacecraft needs. A Super-Heavy rocket can carry anything, but its multi-million credit cost will deplete your mission budget, causing an automatic budget penalty blocker in preflight check.
              </div>

              <div className="p-3.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.12)]">
                <b className="text-emerald-400 block mb-1">3. The Sweet Spot:</b>
                Look for the rocket marked <b className="text-amber-300">RECOMMENDED</b> for your active mission. It is calibrated to carry your spacecraft mass with healthy spare margin without exceeding the agency funding grant.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setGuideModalOpen(false)}>
                GOT IT
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
