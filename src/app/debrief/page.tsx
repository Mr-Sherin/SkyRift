'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/game/engine/GameContext';
import { calculateMissionScore, evaluateMissionOutcome } from '@/game/physics/scoringEngine';
import { MissionScoreBreakdown } from '@/game/types';
import {
  Trophy,
  RotateCcw,
  ArrowRight,
  Info,
  Rocket,
  Wrench,
  Download,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Zap,
  Radio,
  ShieldCheck,
  Award,
  Users,
  Newspaper,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useTeam } from '@/game/team/TeamContext';
import { TEAM_ROLES, TeamRole } from '@/game/team/teamTypes';
import { sfx } from '@/lib/audio';
import confetti from 'canvas-confetti';
import { getMissionDebriefHeadline, FlightHeadlineContext } from '@/data/narration';
import { recordMissionCompletion, MissionCompletionResult, getCampaignData } from '@/data/campaign';
import { evaluateFlightAchievements, clearUnlockedAchievements } from '@/data/achievements';
import { AchievementGallery } from '@/components/achievements/AchievementGallery';
import { ScienceReturnCard } from '@/components/science/ScienceReturnCard';
import { DidYouKnowCard } from '@/components/science/DidYouKnowCard';
import { submitMissionDebrief } from '@/services/supabaseService';
import { GlobalLeaderboardCard } from '@/components/ui/GlobalLeaderboardCard';
import {
  getMissionStory,
  isStoryEnabled,
  getCampaignEnding,
  getHighestTrustCharacter,
  CHARACTERS,
} from '@/data/story';
import { DialogueBox, PORTRAIT_CONFIG } from '@/components/story/DialogueBox';
import { CrewTrustMeter } from '@/components/story/CrewTrustMeter';
import { Panel, Button, Badge, ProgressBar, SectionLabel, MissionSegmentChip, CmlBadge } from '@/components/ui';
import { MISSION_SEGMENTS, MissionSegmentKey } from '@/data/segments';
import { getSimilarRealMissions } from '@/data/missionObjectives';
import { MissionTimelineStrip } from '@/components/flight/MissionTimelineStrip';

interface StoredFlightResults {
  dataDownlinkedGb?: number;
  storedDataGb?: number;
  dataLossGb?: number;
  spacecraftHealth?: number;
  operationsBonus?: number;
  totalScience?: number;
  batteryHistory?: number[];
  dataHistory?: number[];
  deltaVRemainingMs?: number;
  propellantRemainingKg?: number;
  budgetRemaining?: number;
  eventLog?: Array<{
    turn: number;
    day: number;
    action: string;
    title: string;
    details: string;
    type: 'nominal' | 'warning' | 'alert' | 'success';
  }>;
  completed?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  timestamp: number;
  date: string;
  missionId: string;
  missionName: string;
  destination: string;
  score: number;
  tier: string;
  dataDownlinkedGb: number;
  craftHealth: number;
}

type DebriefTab = 'result' | 'learning' | 'crew_progress';

export default function DebriefPage() {
  const router = useRouter();
  const { activeScenario, selectedMission, selectedComponents, selectedLauncher, budgets } = useGame();
  const { gameMode, roomCode, roomState } = useTeam();
  const [report, setReport] = useState<MissionScoreBreakdown | null>(null);
  const [hasCompletedFlight, setHasCompletedFlight] = useState(false);
  const [flightData, setFlightData] = useState<StoredFlightResults | null>(null);
  const [activeTab, setActiveTab] = useState<DebriefTab>('result');
  const [campaignOutcome, setCampaignOutcome] = useState<MissionCompletionResult | null>(null);
  const [showCampaignEnding, setShowCampaignEnding] = useState<boolean>(false);

  const mission = selectedMission || activeScenario;
  const hasInstalledParts = selectedComponents && selectedComponents.length > 0;

  useEffect(() => {
    let rawResults: StoredFlightResults | null = null;
    let completed = false;
    let downlinked = 0;
    let health = 100;
    let opsBonus = 0;

    try {
      const raw = sessionStorage.getItem('skyrift_flight_results');
      if (raw) {
        rawResults = JSON.parse(raw);
        setFlightData(rawResults);
        completed = !!rawResults?.completed;
      }
    } catch {
      // ignore
    }

    setHasCompletedFlight(completed);

    // If no real flight has ever been completed, reset unearned projection achievements
    if (!completed) {
      try {
        const board = localStorage.getItem('skyrift_leaderboard_v1');
        if (!board || JSON.parse(board).length === 0) {
          clearUnlockedAchievements();
        }
      } catch {
        // ignore
      }
    }

    if (hasInstalledParts || completed) {
      if (completed && rawResults) {
        downlinked = rawResults.dataDownlinkedGb ?? 0;
        health = Math.max(0, Math.min(100, rawResults.spacecraftHealth ?? 0));
        opsBonus = rawResults.operationsBonus ?? 0;

        const score = calculateMissionScore(
          mission,
          budgets,
          downlinked,
          health,
          opsBonus,
          true
        );
        setReport(score);

        // Record Campaign Progression and calculate carryover funding
        const campaignRes = recordMissionCompletion(
          mission.id,
          score.totalScore,
          rawResults.budgetRemaining || 0
        );
        setCampaignOutcome(campaignRes);

        // Evaluate and unlock Achievements ONLY from real flight events
        const minBat = rawResults.batteryHistory && rawResults.batteryHistory.length > 0
          ? Math.min(...rawResults.batteryHistory)
          : 100;

        evaluateFlightAchievements({
          missionId: mission.id,
          totalScore: score.totalScore,
          completed: true,
          budgetRemaining: rawResults.budgetRemaining || 0,
          initialBudget: budgets.totalCostCredits + (rawResults.budgetRemaining || 0),
          dataLossGb: rawResults.dataLossGb || 0,
          downlinkedDataGb: downlinked,
          scienceCollected: rawResults.totalScience || 0,
          minBatterySoC: minBat,
          minCraftHealth: health,
          hasTriggeredSafeMode: minBat <= 10,
          isTeamMode: gameMode === 'team',
          teamGoalsMetCount: 0,
        });

        try {
          const runId = `run_${Date.now()}`;
          const existingRaw = localStorage.getItem('skyrift_leaderboard_v1');
          const entries: LeaderboardEntry[] = existingRaw ? JSON.parse(existingRaw) : [];

          // Avoid duplicate entry on refresh within 15 seconds
          const lastEntry = entries[0];
          const isRecentDup = lastEntry && Date.now() - lastEntry.timestamp < 15000 && lastEntry.score === score.totalScore;

          if (!isRecentDup) {
            const newEntry: LeaderboardEntry = {
              id: runId,
              timestamp: Date.now(),
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              missionId: mission.id,
              missionName: mission.name,
              destination: mission.destinationName,
              score: score.totalScore,
              tier: score.tier,
              dataDownlinkedGb: downlinked,
              craftHealth: health,
            };
            const updated = [newEntry, ...entries].slice(0, 10);
            localStorage.setItem('skyrift_leaderboard_v1', JSON.stringify(updated));

            // Sync completed flight debrief to Supabase cloud
            submitMissionDebrief({
              callsign: (typeof window !== 'undefined' && localStorage.getItem('skyrift_player_name')) || 'Flight Director',
              missionId: mission.id,
              score: score.totalScore,
              outcome: score.totalScore >= 75 ? 'nominal_success' : score.totalScore >= 40 ? 'partial_success' : 'critical_failure',
              turnsCompleted: rawResults.turnsCompleted || rawResults.turnHistory?.length || 1,
              scienceCollected: rawResults.totalScience || 0,
              remainingBudget: budgets.remainingCredits || 0,
              remainingPropellant: rawResults.propellantKg || 0,
              remainingBattery: rawResults.batterySoC || 0,
              anomaliesResolved: rawResults.resolvedAnomaliesCount || 0,
              telemetrySummary: {
                craftHealth: health,
                dataDownlinkedGb: downlinked,
                tier: score.tier,
              },
            }).catch((err) => console.warn('[Debrief] Supabase sync notice:', err));
          }
        } catch {
          // ignore localStorage failures
        }

        if (score.totalScore >= 75) {
          try {
            confetti({
              particleCount: 80,
              spread: 65,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore
          }
        }
      } else {
        // Projection mode: strictly calculated from hangar parts without flight event awards
        const projScore = calculateMissionScore(
          mission,
          budgets,
          0,
          100,
          0,
          false
        );
        setReport(projScore);
      }
    } else {
      setReport(null);
    }
  }, [mission, budgets, hasInstalledParts]);

  // Dynamic Root Cause Analysis derived from real flight simulation log and telemetry
  const dynamicCauses: string[] = [];
  if (flightData) {
    const eventLog = flightData.eventLog || [];

    // 1. Δv shortfall from flight log
    const dvDeficitLog = eventLog.find(
      (e) => e.title.includes('DEGRADED ORBIT') || e.details.includes('Insertion burn fell')
    );
    if (dvDeficitLog) {
      dynamicCauses.push(`Trajectory Shortfall: ${dvDeficitLog.details}`);
    } else {
      const dVRemain = flightData.deltaVRemainingMs ?? budgets.availableDeltaVMs;
      if (dVRemain < 150) {
        dynamicCauses.push(
          `Propulsion Margin Warning: Propulsion reserve ended near exhaustion (${Math.round(dVRemain)} m/s left). Any trajectory perturbation would have stranded the craft.`
        );
      } else {
        dynamicCauses.push(
          `Propulsion Stage Nominal: Propulsion stage delivered ${Math.round(dVRemain)} m/s of surplus delta-v margin beyond mission requirements.`
        );
      }
    }

    // 2. Events chosen from flight log
    const eventChoices = eventLog.filter((e) => e.title.startsWith('EVENT:'));
    eventChoices.forEach((e) => {
      dynamicCauses.push(`${e.title}: ${e.details}`);
    });

    // 3. Battery outcomes from flight log
    const blackoutLog = eventLog.find(
      (e) => e.title.includes('BLACKOUT') || e.details.includes('Safe Mode')
    );
    if (blackoutLog) {
      dynamicCauses.push(`Power Anomaly: ${blackoutLog.details}`);
    } else if (flightData.batteryHistory && flightData.batteryHistory.length > 0) {
      const minBattery = Math.min(...flightData.batteryHistory);
      if (minBattery < 25) {
        dynamicCauses.push(
          `Battery Depth of Discharge: Storage cell dropped to ${minBattery}% SoC during orbital eclipse shadow. Additional battery mass or solar capacity recommended.`
        );
      } else {
        dynamicCauses.push(
          `Power Generation Nominal: Electrical power subsystems maintained continuous operation (minimum battery reserve: ${minBattery}% SoC).`
        );
      }
    }

    // 4. Data outcomes from flight log
    const bufferOverflowLog = eventLog.find(
      (e) => e.title.includes('BUFFER OVERFLOW') || e.details.includes('data was lost')
    );
    const dataLoss = flightData.dataLossGb || 0;
    const downlinked = flightData.dataDownlinkedGb || 0;
    const totalData = dataLoss + downlinked;

    if (bufferOverflowLog || dataLoss > 0) {
      const lossPct = totalData > 0 ? Math.round((dataLoss / totalData) * 100) : 100;
      dynamicCauses.push(
        `Storage Buffer Overflow: ${dataLoss.toFixed(1)} GB of scientific data (${lossPct}% of generated observations) was lost before transmission. A larger solid-state recorder or higher-gain antenna is recommended.`
      );
    } else {
      dynamicCauses.push(
        `Data Downlink Nominal: All generated science observations (${downlinked.toFixed(1)} GB) were securely held and downlinked to ground stations with 0% data loss.`
      );
    }

    // 5. Trim burns propellant outcomes from flight log
    const trimBurnAborted = eventLog.find((e) => e.title.includes('TRIM BURN ABORTED'));
    if (trimBurnAborted) {
      dynamicCauses.push(`Propellant Depletion: ${trimBurnAborted.details}`);
    }

    // 6. Subsystem health outcome
    const health = flightData.spacecraftHealth ?? 100;
    if (health < 75) {
      dynamicCauses.push(
        `Hardware Degradation: Spacecraft sustained damage, ending mission at ${health}% subsystem health due to radiation exposure and operational anomalies.`
      );
    } else {
      dynamicCauses.push(
        `Structural Integrity: Spacecraft bus survived the operational spaceflight environment with robust ${health}% subsystem health.`
      );
    }

    // 7. Budget outcome
    if (budgets.isOverBudget) {
      dynamicCauses.push(
        `Budget Penalty: Mission launched over budget by ${Math.abs(budgets.remainingCredits).toLocaleString()} CR, resulting in a Budget Efficiency score of 0/10 and operational constraints.`
      );
    }
  } else {
    // Before a flight: Projected issues only
    if (budgets.isOverBudget) {
      dynamicCauses.push(
        `Mission expenditures exceed available grant budget by ${Math.abs(budgets.remainingCredits).toLocaleString()} CR.`
      );
    }
    if (budgets.isMassExceeded) {
      dynamicCauses.push(
        `Spacecraft total mass (${budgets.totalMassKg} kg) exceeds launch capacity (${budgets.launchCapacityKg} kg).`
      );
    }
    if (budgets.isDeltaVDeficit && budgets.requiredDeltaVMs > 0) {
      dynamicCauses.push(
        `Propulsion stage offers ${budgets.availableDeltaVMs} m/s, short by ${Math.abs(budgets.deltaVMarginMs)} m/s of required ${budgets.requiredDeltaVMs} m/s.`
      );
    }
    if (budgets.isPowerDeficit) {
      dynamicCauses.push(
        `Power generation or battery reserves (${budgets.batteryCapacityWh} Wh) are inadequate for the ${mission.eclipseMinutesPerOrbit}-minute eclipse shadow.`
      );
    }
    if (dynamicCauses.length === 0) {
      dynamicCauses.push(
        'Current spacecraft design satisfies all preliminary engineering limits. Launch the mission to verify performance under real spaceflight conditions.'
      );
    }
  }

  // Component-specific Recommendations
  const actionableSuggestions: string[] = [];
  const commsPart = selectedComponents.find((c) => c.subsystem === 'communications');
  const powerPart = selectedComponents.find((c) => c.subsystem === 'power');
  const enginePart = selectedComponents.find((c) => c.subsystem === 'propulsion');
  const thermalPart = selectedComponents.find((c) => c.subsystem === 'thermal');

  // Evaluate private goals for all roles to compute Teamwork Bonus
  const roleGoalResults = (Object.keys(TEAM_ROLES) as TeamRole[]).map((rKey) => {
    const role = TEAM_ROLES[rKey];
    const check = role.privateGoal.checkMet({
      budgets,
      selectedRocket: selectedLauncher,
      selectedComponents,
      flightResults: flightData,
    });
    return {
      roleKey: rKey,
      role,
      ...check,
    };
  });

  const goalsMetCount = roleGoalResults.filter((g) => g.met).length;
  const teamworkBonus = gameMode === 'team'
    ? goalsMetCount === 4
      ? 15
      : goalsMetCount === 3
      ? 10
      : goalsMetCount === 2
      ? 6
      : goalsMetCount === 1
      ? 3
      : 0
    : 0;

  const totalFinalScore = report ? Math.min(100, report.totalScore + teamworkBonus) : 0;
  const outcome = evaluateMissionOutcome(totalFinalScore);

  const batteryHitZero = !!flightData?.batteryHistory?.some((b) => b <= 0);
  const deltaVDeficit = budgets.availableDeltaVMs < budgets.requiredDeltaVMs || ((flightData?.deltaVRemainingMs ?? 0) < 0);
  const headlineContext: FlightHeadlineContext = {
    batteryHitZero,
    deltaVDeficit,
    missionName: mission.name,
  };
  const pressHeadline = getMissionDebriefHeadline(mission.id, outcome.score, hasCompletedFlight, headlineContext);
  const missionStory = getMissionStory(mission.id);
  const outcomeScene = missionStory.outcomes[outcome.key];
  const rootCausesTitle = outcome.isFailure
    ? 'WHY IT FAILED'
    : outcome.isPartial
    ? 'WHY IT ONLY PARTLY WORKED'
    : 'WHAT WENT WELL';
  const signOffMood = outcome.isFailure ? 'calm' : outcome.isPartial ? 'relieved' : 'proud';

  // Single unified debrief result object driving score, label, headline, dialogue, and styling
  const debriefResult = {
    score: outcome.score,
    label: hasCompletedFlight ? outcome.label : 'Projected', // 'Projected' when no flight, otherwise 'Failure' | 'Partial Success' | 'Success'
    key: outcome.key,     // 'failure' | 'partial' | 'success'
    isSuccess: outcome.isSuccess,
    isPartial: outcome.isPartial,
    isFailure: outcome.isFailure,
    headline: pressHeadline,
    outcomeScene,
    statusColor: !hasCompletedFlight
      ? {
          bg: 'bg-sky-950/60',
          border: 'border-sky-500/40',
          text: 'text-sky-300',
          badgeBorder: 'border-sky-500/30',
        }
      : outcome.isSuccess
      ? {
          bg: 'bg-emerald-950/60',
          border: 'border-emerald-500/40',
          text: 'text-emerald-300',
          badgeBorder: 'border-emerald-500/30',
        }
      : outcome.isPartial
      ? {
          bg: 'bg-amber-950/60',
          border: 'border-amber-500/40',
          text: 'text-amber-300',
          badgeBorder: 'border-amber-500/30',
        }
      : {
          bg: 'bg-rose-950/60',
          border: 'border-rose-500/40',
          text: 'text-rose-300',
          badgeBorder: 'border-rose-500/30',
        },
  };

  // Campaign evaluation and ending calculations
  const campaignData = getCampaignData();
  const completedMissionsEntries = Object.entries(campaignData.completedMissions || {});
  const isFinalMission = mission.id === 'mission-asteroid-scout';
  const isCampaignCompleted = completedMissionsEntries.length >= 4 || (isFinalMission && hasCompletedFlight);

  const campaignScores = completedMissionsEntries.map(([_, m]) => m.score);
  if (hasCompletedFlight && !campaignScores.includes(totalFinalScore)) {
    campaignScores.push(totalFinalScore);
  }
  const campaignAverageScore =
    campaignScores.length > 0
      ? Math.round(campaignScores.reduce((acc, s) => acc + s, 0) / campaignScores.length)
      : totalFinalScore;

  const campaignEnding = getCampaignEnding(campaignAverageScore);
  const highestTrust = getHighestTrustCharacter();
  const highestTrustPortrait = PORTRAIT_CONFIG[highestTrust.speaker];
  const highestTrustChar = CHARACTERS[highestTrust.speaker];

  if (flightData?.dataLossGb && flightData.dataLossGb > 0) {
    actionableSuggestions.push('Upgrade to a High-Gain Parabolic Dish or deploy a secondary Deep Space Comm relay to increase downlink throughput.');
  }
  if (flightData?.batteryHistory && Math.min(...flightData.batteryHistory) < 30) {
    actionableSuggestions.push('Add an auxiliary Li-ion battery pack or swap to Ultraflex Solar Arrays to sustain power through eclipse shadows.');
  }
  if (budgets.remainingCredits < 50000) {
    actionableSuggestions.push('Consider composite structural frames or standard avionics to save credit reserves for launch margin.');
  }
  if (enginePart && (enginePart.ispS || 0) < 300) {
    actionableSuggestions.push('Switch to high-efficiency Bipropellant or Ion propulsion to maximize delta-V without bloating spacecraft wet mass.');
  }
  if (!thermalPart) {
    actionableSuggestions.push('Install dedicated MLI Thermal Blankets or Louvers to shield electronics against extreme sun-to-shadow thermal swings.');
  }
  if (actionableSuggestions.length < 3) {
    actionableSuggestions.push('Balance science payload suites to maximize multi-band planetary imaging without exceeding continuous power output.');
    actionableSuggestions.push('Perform trajectory fine-tuning burns in early mission turns to minimize late delta-V correction costs.');
  }

  const scoreItems = report ? [
    { label: 'Science Return', score: report.scienceScore, max: 35, note: 'Instrument payload & data returned', icon: Zap },
    { label: 'Trajectory & Δv', score: report.trajectoryScore, max: 20, note: 'Orbital transfer fuel margin', icon: Rocket },
    { label: 'Data Downlink', score: report.downlinkScore, max: 15, note: 'Ground station throughput link', icon: Radio },
    { label: 'Craft Health', score: report.spacecraftHealthScore, max: 10, note: 'Hull & avionics radiation survival', icon: ShieldCheck },
    { label: 'Budget Efficiency', score: report.budgetEfficiencyScore, max: 10, note: 'Unallocated funding reserve', icon: Award },
    { label: 'Operations', score: report.operationsScore, max: 10, note: 'Autonomous anomaly resolutions', icon: Activity },
  ] : [];

  // Telemetry chart data points
  const batteryPoints = flightData?.batteryHistory || [100, 85, 92, 60, 78, 88, 72, 85, 90];
  const dataPoints = flightData?.dataHistory || [0, 24, 52, 90, 120, 145, 170, 195, 210];
  const maxDownlink = Math.max(1, ...dataPoints);

  // SVG Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 160;
  const padding = { top: 20, right: 25, bottom: 25, left: 35 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const batteryPolyline = batteryPoints.map((val, idx) => {
    const x = padding.left + (idx / Math.max(1, batteryPoints.length - 1)) * graphWidth;
    const y = padding.top + (1 - val / 100) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  const dataPolyline = dataPoints.map((val, idx) => {
    const x = padding.left + (idx / Math.max(1, dataPoints.length - 1)) * graphWidth;
    const y = padding.top + (1 - val / maxDownlink) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  const handlePrint = () => {
    sfx.playClick();
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleRetrySameDesign = () => {
    sfx.playClick();
    router.push('/flight');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col justify-between">
      {!hasInstalledParts && !hasCompletedFlight ? (
        /* Empty State: Hidden Projected Score until at least 1 part is installed */
        <Panel variant="subtle" className="my-auto py-16 px-6 text-center border-dashed border-[rgba(148,163,184,0.25)] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-rift-orange/15 border border-rift-orange/30 text-rift-orange flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <SectionLabel label="MISSION DEBRIEF // PENDING CRAFT" className="mb-1" />
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            NO SPACECRAFT INSTALLED
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-md leading-relaxed">
            Evaluation requires at least one installed spacecraft module. Assemble your spacecraft in the Hangar to simulate mission performance and telemetry scores.
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
      ) : report ? (
        <div className="space-y-6">
          {/* Projection Notice if visited directly before launching */}
          {!hasCompletedFlight && (
            <Panel variant="subtle" className="p-4 bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="flex items-start space-x-2.5 text-xs text-amber-200">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <b>Projected Score Preview:</b> You haven&apos;t executed this flight run yet. These metrics are estimated from your current hangar configuration. Run the flight simulation for authentic orbital telemetry!
                </div>
              </div>
              <Link href="/launch" onClick={() => sfx.playClick()}>
                <Button variant="primary" glow className="text-[11px] font-mono shrink-0 self-start sm:self-auto flex items-center space-x-1.5">
                  <Rocket className="w-3.5 h-3.5" />
                  <span>GO TO LAUNCH CHECK</span>
                </Button>
              </Link>
            </Panel>

          )}

          {/* =========================================================================
              SCORE HEADER CARD
             ========================================================================= */}
          <Panel variant="elevated" className="p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Top Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rift-orange/15 border border-rift-orange/30 text-rift-orange mb-3">
              <Trophy className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
                {hasCompletedFlight ? 'FLIGHT TELEMETRY // FINAL EVALUATION' : 'PROJECTED FLIGHT EVALUATION'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {mission.name} — {mission.destinationName}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
              MISSION TARGET: {mission.destination.toUpperCase()} ORBIT • DURATION: {mission.durationDays} DAYS
            </p>

            <div className="mt-3 flex justify-center">
              <CmlBadge difficulty={mission.difficulty} showExplanation />
            </div>

            <div className="mt-5 flex flex-col items-center">
              <div className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tight flex items-baseline justify-center">
                <span>{debriefResult.score}</span>
                <span className="text-2xl text-slate-400 font-normal ml-1"> / 100</span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`text-xs font-mono font-bold uppercase px-4 py-1.5 rounded-full border shadow-sm ${debriefResult.statusColor.bg} ${debriefResult.statusColor.border} ${debriefResult.statusColor.text}`}
                >
                  {debriefResult.label}
                </span>

                {gameMode === 'team' && teamworkBonus > 0 && (
                  <span className="text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>TEAMWORK BONUS: +{teamworkBonus} PTS ({goalsMetCount}/4 GOALS)</span>
                  </span>
                )}
              </div>
            </div>
          </Panel>

          {/* =========================================================================
              DEBRIEF 3-TAB SWITCHER (Rule 6: Result, Learning, Crew & Progress)
             ========================================================================= */}
          <div className="flex border-b border-slate-700/80 mb-6 gap-2 print:hidden overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveTab('result');
              }}
              className={`pb-3 px-4 font-mono font-bold text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'result'
                  ? 'border-rift-orange text-rift-orange shadow-[0_2px_10px_rgba(255,90,31,0.25)]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              1. Result &amp; Actions
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveTab('learning');
              }}
              className={`pb-3 px-4 font-mono font-bold text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'learning'
                  ? 'border-rift-orange text-rift-orange shadow-[0_2px_10px_rgba(255,90,31,0.25)]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              2. Learning &amp; Real Missions
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveTab('crew_progress');
              }}
              className={`pb-3 px-4 font-mono font-bold text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'crew_progress'
                  ? 'border-rift-orange text-rift-orange shadow-[0_2px_10px_rgba(255,90,31,0.25)]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              3. Crew &amp; Progress
            </button>
          </div>

          {/* =========================================================================
              TAB 1: RESULT & ACTIONS (Opens first - Rule 6)
             ========================================================================= */}
          {activeTab === 'result' && (
            <div className="space-y-6">
              {/* News-Style Headline (Real flight only) */}
              {hasCompletedFlight && (
                <Panel variant="default" className="p-5 sm:p-6 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[rgba(148,163,184,0.18)]">
                    <div className="flex items-center space-x-2">
                      <Newspaper className="w-4 h-4 text-rift-orange" />
                      <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-slate-300 uppercase">
                        {debriefResult.headline.publication}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${debriefResult.statusColor.bg} ${debriefResult.statusColor.text} ${debriefResult.statusColor.badgeBorder}`}
                      >
                        {debriefResult.headline.tag}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {debriefResult.headline.date}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase leading-snug font-mono">
                      {debriefResult.headline.headline}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-slate-400 italic leading-relaxed font-sans">
                      {debriefResult.headline.subhead}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 border-t border-[rgba(148,163,184,0.15)] font-sans">
                      {debriefResult.headline.lede}
                    </p>
                  </div>
                </Panel>
              )}

              {/* Top 3 Root Causes & One "Try Next" Tip Grid (Rule 6) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Top 3 Root Causes */}
                <Panel variant="default" className="p-5">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-rift-orange uppercase mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>{hasCompletedFlight ? rootCausesTitle : 'PRE-FLIGHT LIMITS'}</span>
                    <span className="text-slate-500 text-[10px]">(TOP 3 CAUSES)</span>
                  </div>
                  <ul className="space-y-2.5 font-sans">
                    {dynamicCauses.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                        <span className="font-mono text-rift-orange font-bold text-xs">{idx + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>

                {/* 2. One Key "Try Next" Tip */}
                <Panel variant="default" className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-400 uppercase mb-3">
                      <Lightbulb className="w-4 h-4 text-emerald-400" />
                      <span>TOP RECOMMENDATION // TRY NEXT</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed font-sans">
                      <b className="text-white font-mono block text-[11px] mb-1 uppercase">ENGINEERING ACTION:</b>
                      {actionableSuggestions[0] || 'Balance payload suites and fine-tune trajectory burns in early turns.'}
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800">
                    Apply this recommendation in the Hangar to optimize science returns and delta-V margins.
                  </p>
                </Panel>
              </div>

              {/* ACTION BUTTONS - Rule 1 & Rule 6 (Retry / Redesign / Download / Next) */}
              <div className="p-4 rounded-2xl bg-[#0A1228] border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 print:hidden shadow-lg">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Retry with Same Design (Quiet outline unless failure) */}
                  <button
                    type="button"
                    onClick={handleRetrySameDesign}
                    className={`px-4 py-2.5 rounded-xl font-mono font-bold text-xs uppercase flex items-center space-x-2 transition-all ${
                      debriefResult.isFailure
                        ? 'bg-rift-orange hover:bg-[#E64C0E] text-white shadow-[0_0_16px_rgba(255,90,31,0.5)]'
                        : 'border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>RETRY FLIGHT</span>
                  </button>

                  {/* Redesign in Hangar (Quiet outline) */}
                  <Link href="/hangar" onClick={() => sfx.playClick()}>
                    <button
                      type="button"
                      className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-mono font-bold text-xs uppercase flex items-center space-x-2 transition-colors"
                    >
                      <Wrench className="w-4 h-4 text-slate-400" />
                      <span>REDESIGN IN HANGAR</span>
                    </button>
                  </Link>

                  {/* Download Report / Print (Quiet outline) */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-mono font-bold text-xs uppercase flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>DOWNLOAD REPORT (PDF)</span>
                  </button>
                </div>

                {/* Primary Action Button: NEXT MISSION (The ONE strong orange CTA when success) */}
                <Link href="/missions" onClick={() => sfx.playClick()}>
                  <button
                    type="button"
                    className={`px-5 py-2.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center space-x-2 transition-all active:scale-95 ${
                      !debriefResult.isFailure
                        ? 'bg-rift-orange hover:bg-[#E64C0E] text-white shadow-[0_0_20px_rgba(255,90,31,0.5)]'
                        : 'border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>NEXT MISSION</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Live Global Supabase Leaderboard */}
              <GlobalLeaderboardCard
                missionId={mission.id}
                missionName={mission.name}
              />

              {/* 6 Scoring Criteria Tiles */}
              <div>
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                  SCORING CRITERIA BREAKDOWN
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {scoreItems.map((item) => {
                    const Icon = item.icon;
                    const pct = Math.round((item.score / item.max) * 100);
                    return (
                      <Panel key={item.label} variant="subtle" className="p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center space-x-1.5">
                              <Icon className="w-3.5 h-3.5 text-rift-orange" />
                              <span className="font-bold text-slate-300 uppercase">{item.label}</span>
                            </div>
                            <span className="font-black text-white">
                              {item.score} <span className="text-slate-400 font-normal">/ {item.max}</span>
                            </span>
                          </div>
                          <div className="my-2.5">
                            <ProgressBar value={pct} />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono leading-tight">{item.note}</p>
                      </Panel>
                    );
                  })}
                </div>
              </div>

              {/* NASA 4-Segment Scorecard */}
              <Panel variant="elevated" className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(148,163,184,0.18)]">
                  <div>
                    <SectionLabel color="orange">NASA MISSION ARCHITECTURE // 4 SEGMENTS</SectionLabel>
                    <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-tight mt-0.5">
                      SEGMENT SCORECARD
                    </h3>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Mission performance broken down across NASA science mission segments
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[
                    {
                      key: 'launch' as MissionSegmentKey,
                      label: 'LAUNCH SEGMENT',
                      pct: Math.min(100, Math.max(0, Math.round((report.trajectoryScore / 20) * 100))),
                      scoreText: `${report.trajectoryScore} / 20 PTS`,
                      tooltip: MISSION_SEGMENTS.launch.tooltip,
                      desc: 'Booster lift capacity, mass margin, and orbital insertion burn.',
                    },
                    {
                      key: 'space' as MissionSegmentKey,
                      label: 'SPACE SEGMENT',
                      pct: Math.min(100, Math.max(0, Math.round(((report.spacecraftHealthScore / 10) * (budgets.isPowerDeficit ? 0.6 : 1.0)) * 100))),
                      scoreText: `${report.spacecraftHealthScore} / 10 HEALTH`,
                      tooltip: MISSION_SEGMENTS.space.tooltip,
                      desc: 'Spacecraft bus integrity, battery power viability, and bus survival.',
                    },
                    {
                      key: 'ground' as MissionSegmentKey,
                      label: 'GROUND SEGMENT',
                      pct: Math.min(100, Math.max(0, Math.round((report.downlinkScore / 15) * 100))),
                      scoreText: `${report.downlinkScore} / 15 PTS`,
                      tooltip: MISSION_SEGMENTS.ground.tooltip,
                      desc: 'Ground station passes, tracking network link, and data downlink.',
                    },
                    {
                      key: 'user' as MissionSegmentKey,
                      label: 'USER SEGMENT',
                      pct: Math.min(100, Math.max(0, Math.round((report.scienceScore / 35) * 100))),
                      scoreText: `${report.scienceScore} / 35 PTS`,
                      tooltip: MISSION_SEGMENTS.user.tooltip,
                      desc: 'Primary instrument data yield, calibrated science, and research value.',
                    },
                  ].map((seg) => (
                    <div
                      key={seg.key}
                      title={seg.tooltip}
                      className="p-4 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.16)] flex flex-col justify-between space-y-3 cursor-help group hover:border-[rgba(148,163,184,0.3)] transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <MissionSegmentChip segment={seg.key} />
                          <span className="text-xs font-black font-mono text-white">
                            {seg.scoreText}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">
                          {seg.desc}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-[rgba(148,163,184,0.1)]">
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="text-slate-400">Readiness / Return</span>
                          <span
                            className={`font-black ${
                              seg.pct >= 85
                                ? 'text-emerald-400'
                                : seg.pct >= 50
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {seg.pct}%
                          </span>
                        </div>
                        <ProgressBar
                          value={seg.pct}
                          variant={seg.pct >= 85 ? 'default' : seg.pct >= 50 ? 'warn' : 'danger'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Flight Simulation Telemetry Chart (Battery & Cumulative Data Downlink) */}
              {hasCompletedFlight && (
                <Panel variant="default" className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider">
                        FLIGHT SIMULATION TELEMETRY
                      </div>
                      <h3 className="text-base font-bold text-white font-mono">
                        BATTERY STATE &amp; CUMULATIVE DATA DOWNLINK
                      </h3>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-1 bg-amber-400 rounded" />
                        <span className="text-slate-300 font-bold">Battery (%)</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-1 bg-rift-orange rounded" />
                        <span className="text-slate-300 font-bold">Downlink (GB)</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40 select-none">
                      {[0.25, 0.5, 0.75, 1.0].map((frac) => {
                        const y = padding.top + (1 - frac) * graphHeight;
                        return (
                          <g key={frac}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={svgWidth - padding.right}
                              y2={y}
                              stroke="#1E293B"
                              strokeDasharray="3 3"
                              strokeWidth="1"
                            />
                            <text
                              x={padding.left - 6}
                              y={y + 3}
                              fontSize="9"
                              fill="#64748B"
                              textAnchor="end"
                              fontFamily="monospace"
                            >
                              {Math.round(frac * 100)}%
                            </text>
                          </g>
                        );
                      })}

                      <polyline
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={batteryPolyline}
                      />

                      <polyline
                        fill="none"
                        stroke="#FF5A1F"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={dataPolyline}
                      />

                      {batteryPoints.map((val, idx) => {
                        const x = padding.left + (idx / Math.max(1, batteryPoints.length - 1)) * graphWidth;
                        const y = padding.top + (1 - val / 100) * graphHeight;
                        return (
                          <circle
                            key={`bat-${idx}`}
                            cx={x}
                            cy={y}
                            r="3.5"
                            fill="#050A1C"
                            stroke="#F59E0B"
                            strokeWidth="2"
                          />
                        );
                      })}

                      {dataPoints.map((val, idx) => {
                        const x = padding.left + (idx / Math.max(1, dataPoints.length - 1)) * graphWidth;
                        const y = padding.top + (1 - val / maxDownlink) * graphHeight;
                        return (
                          <circle
                            key={`dat-${idx}`}
                            cx={x}
                            cy={y}
                            r="3.5"
                            fill="#050A1C"
                            stroke="#FF5A1F"
                            strokeWidth="2"
                          />
                        );
                      })}

                      {batteryPoints.map((_, idx) => {
                        const x = padding.left + (idx / Math.max(1, batteryPoints.length - 1)) * graphWidth;
                        return (
                          <text
                            key={`turn-${idx}`}
                            x={x}
                            y={svgHeight - 6}
                            fontSize="9"
                            fill="#64748B"
                            textAnchor="middle"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            T{idx}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: LEARNING & REAL MISSIONS (Preserves all NASA numbers & archives)
             ========================================================================= */}
          {activeTab === 'learning' && (
            <div className="space-y-6">
              {/* Similar Real Missions Card */}
              <Panel variant="elevated" className="p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(148,163,184,0.18)]">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 text-[#FF5A1F]">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider">
                        NASA ARCHIVE COMPARISON // MISSION ANALOGS
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-tight mt-0.5">
                        Similar Real Missions
                      </h3>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Real space missions matching your objective and craft design
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-sans">
                  Based on your target orbit ({mission.destinationName}) and science payload selections, explore how NASA and international space agencies solved similar mission engineering challenges:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {getSimilarRealMissions(mission.id).map((real, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#070E24] border border-[rgba(148,163,184,0.18)] flex flex-col justify-between space-y-3.5 hover:border-[rgba(148,163,184,0.35)] transition-all shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <div className="text-xs font-mono font-bold text-[#38BDF8]">
                              {real.agencyYear}
                            </div>
                            <h4 className="text-base font-black text-white font-mono leading-tight mt-0.5">
                              {real.name}
                            </h4>
                          </div>
                          <a
                            href={real.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#0A1228] border border-[rgba(148,163,184,0.2)] text-[#38BDF8] hover:text-white transition-colors shrink-0 group"
                            title={`Explore official NASA archive for ${real.name}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          </a>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400 mb-2">
                          <span className="text-slate-500 uppercase">Target: </span>
                          <span className="text-slate-300">{real.targetDestination}</span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {real.scientificGoal}
                        </p>

                        {/* Verifiable Real Mission Engineering Numbers */}
                        {real.verifiableSpecs && (
                          <div className="my-2.5 p-2.5 rounded-xl bg-[#091126] border border-[rgba(56,189,248,0.2)] font-mono space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span className="text-[#38BDF8]">VERIFIABLE NASA SPECS</span>
                              <a
                                href={real.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#38BDF8] hover:text-white flex items-center space-x-1"
                              >
                                <span>NASA Archive</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] pt-0.5">
                              <div className="bg-[#050A1C] p-2 rounded-lg border border-slate-800/80">
                                <span className="text-slate-400 text-[10px] block uppercase">Launch Mass</span>
                                <b className="text-white">{real.verifiableSpecs.launchMassFormatted}</b>
                              </div>
                              <div className="bg-[#050A1C] p-2 rounded-lg border border-slate-800/80 sm:col-span-2">
                                <span className="text-slate-400 text-[10px] block uppercase">Target Orbit</span>
                                <b className="text-slate-200 truncate block">{real.verifiableSpecs.targetOrbit}</b>
                              </div>
                            </div>
                            <div className="bg-[#050A1C] p-2 rounded-lg border border-slate-800/80 text-[11px]">
                              <span className="text-slate-400 text-[10px] block uppercase">
                                Science Payload ({real.verifiableSpecs.instrumentCount} Instruments)
                              </span>
                              <span className="text-slate-300 font-sans text-xs">
                                {real.verifiableSpecs.primaryInstruments}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-[#050A1C] border border-[rgba(148,163,184,0.12)] space-y-1">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                          HOW YOUR CRAFT DIFFERS:
                        </span>
                        <p className="text-xs font-sans text-slate-200 leading-relaxed">
                          {real.keyDifference}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Science Return Card */}
              {(hasCompletedFlight || debriefResult.score >= 40) && (
                <ScienceReturnCard
                  destination={mission.destination}
                  missionName={mission.name}
                  totalScience={flightData?.totalScience || 140}
                  dataDownlinkedGb={flightData?.dataDownlinkedGb || 180}
                />
              )}

              {/* Aerospace Did You Know Card */}
              <DidYouKnowCard destination={mission.destination} />

              {/* Mission Timeline Strip */}
              {hasCompletedFlight && flightData?.eventLog && flightData.eventLog.length > 0 && (
                <MissionTimelineStrip
                  events={flightData.eventLog}
                  missionName={mission.name}
                  destinationName={mission.destinationName}
                  durationDays={mission.durationDays}
                />
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: CREW & PROGRESS (Morale, Campaign Finale, Teamwork, Achievements)
             ========================================================================= */}
          {activeTab === 'crew_progress' && (
            <div className="space-y-6">
              {/* Crew Trust Meters */}
              {hasCompletedFlight && <CrewTrustMeter />}

              {/* Visual Novel Debrief Dialogue Scene */}
              {hasCompletedFlight && isStoryEnabled() && (
                <div className="space-y-3">
                  <DialogueBox
                    title={`${mission.name.toUpperCase()} // CREW DEBRIEF DIALOGUE`}
                    badge={`OUTCOME: ${debriefResult.label.toUpperCase()}`}
                    dialogue={debriefResult.outcomeScene.dialogue}
                    onComplete={() => {}}
                    allowSkip={false}
                  />

                  {/* Character Sign-off Closing Line */}
                  <Panel variant="subtle" className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rift-orange shrink-0" />
                      <span className="text-slate-400 font-bold uppercase shrink-0">
                        {missionStory.closingLine.speaker} SIGN-OFF:
                      </span>
                      <span className="text-white font-bold italic font-sans">
                        &ldquo;{missionStory.closingLine.line}&rdquo;
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#0D1733] border border-[rgba(148,163,184,0.2)] text-slate-300 self-start sm:self-auto">
                      {signOffMood}
                    </span>
                  </Panel>
                </div>
              )}

              {/* Campaign Progression Outcome */}
              {hasCompletedFlight && campaignOutcome && (
                <Panel variant="default" className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                        CAMPAIGN PROGRESSION UPDATE
                      </div>
                      {campaignOutcome.isNewUnlock && (
                        <div className="text-sm font-black text-emerald-300 mt-0.5 font-mono">
                          ★ NEW DESTINATION UNLOCKED IN CAMPAIGN!
                        </div>
                      )}
                      <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed font-sans">
                        Earned <b>+{campaignOutcome.bonusFundingEarned.toLocaleString()} CR</b> campaign funding bonus.
                        {campaignOutcome.totalAccumulatedBonus > 0 && (
                          <span> Total grant reserve: <b>{campaignOutcome.totalAccumulatedBonus.toLocaleString()} CR</b>.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Link href="/missions" onClick={() => sfx.playClick()}>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase flex items-center space-x-1.5 shrink-0"
                    >
                      <span>NEXT MISSION</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </Panel>
              )}

              {/* Campaign Finale Card */}
              {(isCampaignCompleted || showCampaignEnding) && isStoryEnabled() && (
                <Panel variant="elevated" className="p-6 sm:p-8 border-2 border-amber-500/40 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(148,163,184,0.18)]">
                    <div>
                      <div className="flex items-center space-x-2 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-widest">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>SKY RIFT CAMPAIGN FINALE // {campaignEnding.tier.toUpperCase()} TIER</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 font-mono">
                        {campaignEnding.title}
                      </h2>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        CAMPAIGN AVERAGE SCORE: <strong className="text-white">{campaignAverageScore} / 100</strong> ({campaignEnding.scoreRange})
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border self-start sm:self-auto shadow-xs ${
                        campaignEnding.tier === 'Gold'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : campaignEnding.tier === 'Silver'
                          ? 'bg-slate-900/60 text-slate-300 border-slate-600'
                          : 'bg-orange-950/60 text-orange-300 border-orange-500/40'
                      }`}
                    >
                      {campaignEnding.tier} Tier Award
                    </span>
                  </div>

                  <DialogueBox
                    title={`CAMPAIGN DEBRIEF // ${campaignEnding.tier.toUpperCase()} EVALUATION`}
                    badge="FULL FLIGHT TEAM DIRECTORY"
                    dialogue={campaignEnding.dialogue}
                    onComplete={() => {}}
                    allowSkip={false}
                  />

                  <div className="pt-2 flex justify-end">
                    <Link href="/ending" onClick={() => sfx.playSuccessChime()}>
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-mono font-black text-xs uppercase flex items-center space-x-2 shadow-lg"
                      >
                        <Trophy className="w-4 h-4 text-white" />
                        <span>WATCH CREDITS ROLL</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </Panel>
              )}

              {/* Team Mode Secret Objectives Evaluation */}
              {gameMode === 'team' && (
                <Panel variant="default" className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[rgba(148,163,184,0.18)] gap-2 mb-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                          MULTI-CREW EVALUATION // ROOM {roomCode}
                        </div>
                        <h3 className="text-base font-bold text-white font-mono">
                          CREW SYNERGY &amp; SECRET ROLE OBJECTIVES
                        </h3>
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
                      {goalsMetCount} / 4 GOALS ACHIEVED &bull; +{teamworkBonus} BONUS PTS
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {roleGoalResults.map((res) => (
                      <div
                        key={res.roleKey}
                        className={`p-4 rounded-xl border flex flex-col justify-between ${
                          res.met
                            ? 'bg-emerald-950/40 border-emerald-500/30'
                            : 'bg-[#050A1C] border-[rgba(148,163,184,0.15)]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="font-bold text-white uppercase">{res.role.name}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                res.met
                                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {res.met ? 'GOAL MET (+PTS)' : 'UNFULFILLED'}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-200 font-mono">
                            {res.role.privateGoal.title}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">
                            {res.role.privateGoal.description}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[rgba(148,163,184,0.15)] text-[10px] font-mono text-slate-400">
                          Result: <b className="text-white">{res.currentText}</b> (Target: {res.targetText})
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {/* Achievements Gallery */}
              <Panel variant="default" className="p-5 sm:p-6">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                  UNLOCKED FLIGHT ACHIEVEMENTS
                </div>
                <AchievementGallery />
              </Panel>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
