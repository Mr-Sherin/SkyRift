'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/game/engine/GameContext';
import { useTeam } from '@/game/team/TeamContext';
import { TEAM_ROLES, TeamRole } from '@/game/team/teamTypes';
import { DesignReviewBoard } from '@/components/team/DesignReviewBoard';
import { TeamErrorBoundary } from '@/components/team/TeamErrorBoundary';
import { runPreflightDiagnostics, getMissionRequirements } from '@/game/physics/budgetEngine';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Wrench, Rocket, Sparkles, X } from 'lucide-react';
import { sfx } from '@/lib/audio';
import { Panel, HudStat, Badge, SectionLabel } from '@/components/ui';

export default function PreflightPage() {
  const router = useRouter();
  const { activeScenario, selectedComponents, selectedLauncher, budgets, difficulty } = useGame();
  const { gameMode, activeDesignReviews, roomState } = useTeam();
  const [showRiskyModal, setShowRiskyModal] = useState(false);

  const reqs = getMissionRequirements(activeScenario, difficulty, selectedLauncher);

  const diagnostics = runPreflightDiagnostics(
    selectedComponents,
    activeScenario,
    selectedLauncher,
    budgets
  );

  const errors = diagnostics.filter((d) => d.type === 'error');
  const isDiagnosticsPass = errors.length === 0 && selectedComponents.length > 0;

  // Multi-crew review validation: all 4 roles must be approved (or auto-approved for empty roles)
  const ALL_ROLES: TeamRole[] = ['director', 'engineer', 'science', 'comms'];
  const claimedRoles: TeamRole[] = roomState
    ? (Object.values(roomState.players).map((p) => p.role).filter(Boolean) as TeamRole[])
    : ['director'];

  const fillEmpty = roomState?.fillEmptyRoles ?? true;
  const anyRejected = ALL_ROLES.some((r) => activeDesignReviews[r]?.rejected);
  const allApproved = ALL_ROLES.every((r) => {
    if (claimedRoles.includes(r)) {
      return activeDesignReviews[r]?.approved;
    }
    return fillEmpty ? Boolean(activeDesignReviews[r]?.approved) : false;
  });

  const savePreflightBlockers = () => {
    if (typeof window === 'undefined') return;
    const blockers = errors.map((e) => ({
      system: e.system,
      title: e.title,
      description: e.description,
    }));
    sessionStorage.setItem('skyrift_preflight_blockers', JSON.stringify(blockers));
  };

  const isGoForLaunch = gameMode === 'team'
    ? isDiagnosticsPass && allApproved && !anyRejected
    : isDiagnosticsPass;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[rgba(148,163,184,0.14)] gap-4">
          <div>
            <SectionLabel color="orange">STEP 04 // READINESS CHECK</SectionLabel>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9] font-mono tracking-tight mt-1">
              PREFLIGHT DIAGNOSTICS
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#94A3B8]">
              Final engineering check before ignition for <b className="text-[#F1F5F9]">{activeScenario.name}</b> aboard <b className="text-[#F1F5F9]">{selectedLauncher?.name || 'No Rocket Selected'}</b>.
            </p>
            {reqs.isBeginner && (
              <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{reqs.allowanceLabel}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 self-start sm:self-auto">
            {isGoForLaunch ? (
              <Badge variant="good" pulse>
                GO FOR LAUNCH
              </Badge>
            ) : (
              <Badge variant="danger">
                {errors.length} BLOCKER{errors.length === 1 ? '' : 'S'} FOUND
              </Badge>
            )}
          </div>
        </div>

        {/* 4 Summary Telemetry Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <HudStat
            label="CRAFT WEIGHT"
            value={`${budgets.totalMassKg} / ${budgets.launchCapacityKg || '—'}`}
            unit="kg"
            status={budgets.isMassExceeded ? 'danger' : 'neutral'}
          />
          <HudStat
            label="FUEL SPEED (ΔV)"
            value={`${budgets.availableDeltaVMs.toLocaleString()} / ${budgets.requiredDeltaVMs.toLocaleString()}`}
            unit="m/s"
            status={budgets.isDeltaVDeficit ? 'danger' : 'good'}
          />
          <HudStat
            label="NET POWER"
            value={budgets.powerMarginW >= 0 ? `+${budgets.powerMarginW}` : `${budgets.powerMarginW}`}
            unit="W"
            status={budgets.isPowerDeficit ? 'danger' : 'good'}
          />
          <HudStat
            label="BUDGET LEFT"
            value={budgets.remainingCredits.toLocaleString()}
            unit="CR"
            status={budgets.isOverBudget ? 'danger' : 'neutral'}
          />
        </div>

        {/* Step 04 Team Mode: Design Review Board */}
        <div className="mt-6">
          <TeamErrorBoundary>
            <DesignReviewBoard />
          </TeamErrorBoundary>
        </div>

        {/* Diagnostic Findings */}
        <div className="mt-6 space-y-3">
          {diagnostics.length === 0 ? (
            <Panel variant="default" padding="lg" className="text-center border-emerald-500/30 bg-emerald-950/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-lg font-black text-[#F1F5F9] font-mono uppercase tracking-wide">
                All Systems Cleared For Launch
              </h2>
              <p className="text-sm text-[#94A3B8] mt-1 max-w-md mx-auto">
                Your spacecraft satisfies all weight, power, fuel, communications, and budget limits. You are ready for the countdown terminal.
              </p>
            </Panel>
          ) : (
            diagnostics.map((diag, idx) => {
              const isErr = diag.type === 'error';
              const fixHref = diag.system === 'launcher' ? '/flight-plan' : '/hangar';
              const fixLabel = diag.system === 'launcher' ? 'Adjust Rocket' : 'Fix in Hangar';

              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all ${
                    isErr
                      ? 'bg-[#180A14] border-rose-500/40 shadow-[0_0_18px_rgba(244,63,94,0.12)]'
                      : 'bg-[#18140A] border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.12)]'
                  }`}
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    {isErr ? (
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black font-mono text-[#F1F5F9]">
                          {diag.title}
                        </h3>
                        <Badge variant={isErr ? 'danger' : 'warn'}>
                          {diag.system.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-[#CBD5E1] mt-1.5 leading-relaxed">
                        {diag.description}
                      </p>
                      {diag.recommendation && (
                        <div className="mt-3 text-xs text-[#F1F5F9] bg-[#070E24] px-4 py-3 rounded-xl border border-[rgba(148,163,184,0.25)] font-mono leading-relaxed shadow-sm">
                          <b className="text-[#FF5A1F] uppercase font-bold tracking-wide">HOW TO FIX: </b>
                          <span className="text-[#E2E8F0]">{diag.recommendation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={fixHref}
                    onClick={() => sfx.playClick()}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0A1228] hover:bg-[#101C3D] border border-[rgba(148,163,184,0.3)] hover:border-[#FF5A1F] text-xs font-mono font-bold text-[#F1F5F9] hover:text-[#FF5A1F] transition-all shrink-0 self-start sm:self-auto shadow-md"
                  >
                    {diag.system === 'launcher' ? <Rocket className="w-3.5 h-3.5 text-[#FF5A1F]" /> : <Wrench className="w-3.5 h-3.5 text-[#FF5A1F]" />}
                    <span>{fixLabel.toUpperCase()}</span>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-5 border-t border-[rgba(148,163,184,0.14)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/hangar"
            onClick={() => sfx.playClick()}
            className="px-4 py-2.5 rounded-xl bg-[#0A1228] hover:bg-[#101C3D] border border-[rgba(148,163,184,0.3)] hover:border-[#FF5A1F] text-xs font-mono font-bold text-[#F1F5F9] hover:text-[#FF5A1F] flex items-center space-x-2 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF5A1F]" />
            <span>HANGAR</span>
          </Link>
          <Link
            href="/flight-plan"
            onClick={() => sfx.playClick()}
            className="px-4 py-2.5 rounded-xl bg-[#0A1228] hover:bg-[#101C3D] border border-[rgba(148,163,184,0.3)] hover:border-[#FF5A1F] text-xs font-mono font-bold text-[#F1F5F9] hover:text-[#FF5A1F] flex items-center space-x-2 transition-all shadow-md"
          >
            <span>FLIGHT PLAN</span>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          {/* Risky launch option only allowed in Standard and Expert modes (Hard blocked in Beginner) */}
          {!isGoForLaunch && !reqs.isBeginner && (
            <button
              type="button"
              onClick={() => {
                sfx.playAlert();
                setShowRiskyModal(true);
              }}
              className="px-5 py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase flex items-center space-x-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
              title="Standard / Expert mode override: Launch with active system blockers"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>LAUNCH ANYWAY (RISKY)</span>
            </button>
          )}

          <Link
            href={isGoForLaunch ? '/launch' : '#'}
            onClick={(e) => {
              if (!isGoForLaunch) {
                e.preventDefault();
                sfx.playAlert();
              } else {
                savePreflightBlockers();
                sfx.playClick();
              }
            }}
            className={`px-7 py-3 rounded-xl text-xs font-mono font-bold tracking-widest uppercase flex items-center space-x-2 transition-all ${
              isGoForLaunch
                ? 'bg-[#FF5A1F] hover:bg-[#E64C0E] text-white shadow-[0_0_20px_rgba(255,90,31,0.4)] cursor-pointer active:scale-95'
                : 'bg-[#0A1228] text-[#64748B] border border-[rgba(148,163,184,0.15)] cursor-not-allowed opacity-60'
            }`}
            title={
              gameMode === 'team' && !allApproved
                ? 'All crew members must approve in Design Review before opening launch pad'
                : undefined
            }
          >
            <span>
              {gameMode === 'team' && !allApproved
                ? anyRejected
                  ? 'HOLD // DESIGN REJECTED'
                  : 'AWAITING CREW REVIEW'
                : 'OPEN LAUNCH PAD'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Risky Launch Confirmation Dialog */}
      {showRiskyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#070E24] border border-amber-500/50 p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black font-mono text-white tracking-wide">
                    RISKY LAUNCH AUTHORIZATION
                  </h3>
                  <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider block">
                    STANDARD / EXPERT FLIGHT OVERRIDE
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRiskyModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are overriding pre-flight safety protocols to launch <b className="text-white">{activeScenario.name}</b> with active failure diagnostics. Telemetry simulation predicts the following catastrophic or degraded failure modes:
            </p>

            <div className="p-3.5 rounded-xl bg-[#040816] border border-amber-500/30 space-y-2 text-xs font-mono">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                WHAT WILL PROBABLY FAIL:
              </span>
              <ul className="space-y-1.5 text-slate-200">
                {budgets.isMassExceeded && (
                  <li className="flex items-start space-x-2 text-rose-300">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>
                      <b>Payload Mass Overload:</b> Spacecraft ({budgets.totalMassKg} kg) exceeds booster lift limit ({budgets.launchCapacityKg} kg). High risk of thrust deficiency and orbit insertion abort.
                    </span>
                  </li>
                )}
                {budgets.isDeltaVDeficit && (
                  <li className="flex items-start space-x-2 text-rose-300">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>
                      <b>Delta-V Depletion:</b> Engine offers {budgets.availableDeltaVMs} m/s, short by {Math.abs(budgets.deltaVMarginMs)} m/s of required {budgets.requiredDeltaVMs} m/s. Craft will run out of fuel before achieving target orbit.
                    </span>
                  </li>
                )}
                {budgets.isPowerDeficit && (
                  <li className="flex items-start space-x-2 text-amber-300">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>
                      <b>Power Brownout:</b> Net power or battery reserve ({budgets.batteryCapacityWh} Wh) cannot survive the {activeScenario.eclipseMinutesPerOrbit}-minute eclipse shadow. Subsystems will freeze or shut down.
                    </span>
                  </li>
                )}
                {budgets.isOverBudget && (
                  <li className="flex items-start space-x-2 text-amber-300">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>
                      <b>Budget Deficit:</b> Expenditures exceed authorized mission grant by {Math.abs(budgets.remainingCredits).toLocaleString()} CR.
                    </span>
                  </li>
                )}
                {errors.filter(e => e.system !== 'propulsion' && e.system !== 'launcher' && e.system !== 'power' && e.system !== 'budget').map((err, i) => (
                  <li key={i} className="flex items-start space-x-2 text-amber-300">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span><b>{err.title}:</b> {err.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setShowRiskyModal(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0A1228] hover:bg-[#121E42] border border-[rgba(148,163,184,0.2)] text-xs font-mono font-bold text-slate-300 hover:text-white transition-all"
              >
                ABORT // RETURN TO SAFETY
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setShowRiskyModal(false);
                  savePreflightBlockers();
                  router.push('/launch');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95"
              >
                CONFIRM RISKY LAUNCH →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
