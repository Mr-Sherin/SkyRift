'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/game/engine/GameContext';
import { useTeam } from '@/game/team/TeamContext';
import { TEAM_ROLES } from '@/game/team/teamTypes';
import {
  initFlightState,
  simulateTurn,
  FlightState,
  FlightAction,
  FlightLogEntry,
} from '@/lib/simulation';
import {
  FLIGHT_EVENTS,
  FlightEvent,
  FlightEventOption,
  createPRNG,
  hashStringToSeed,
  evaluateEventTrigger,
} from '@/data/events';
import {
  Battery,
  Database,
  Radio,
  Sparkles,
  Flame,
  HeartPulse,
  Coins,
  ArrowRight,
  Eye,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Send,
  ShieldAlert,
  Play,
  Lightbulb,
  X,
  ChevronDown,
  Volume2,
  VolumeX,
  Rocket,
} from 'lucide-react';
import { sfx } from '@/lib/audio';
import confetti from 'canvas-confetti';
import { LiveTrajectoryView } from '@/components/visualizer/LiveTrajectoryView';
import { LaunchSequenceModal } from '@/components/flight/LaunchSequenceModal';
import { getFlightDirectorComment } from '@/data/narration';
import { getDailyChallenge, markDailyChallengeCompleted } from '@/data/dailyChallenge';
import {
  getMissionStory,
  isStoryEnabled,
  getEventReaction,
  updateCrewTrust,
  CHARACTERS,
} from '@/data/story';
import { DialogueBox, PORTRAIT_CONFIG } from '@/components/story/DialogueBox';
import { CrewTrustMeter } from '@/components/story/CrewTrustMeter';
import { Panel, Button, Badge, ProgressBar, SectionLabel, MissionSegmentChip } from '@/components/ui';

function formatCredits(cr: number): string {
  if (Math.abs(cr) >= 1_000_000) return `${(cr / 1_000_000).toFixed(2).replace(/\.00$/, '')}M CR`;
  if (Math.abs(cr) >= 1_000) return `${Math.round(cr / 1_000)}K CR`;
  return `${cr} CR`;
}

export default function FlightPage() {
  const router = useRouter();
  const {
    activeScenario,
    selectedMission,
    selectedComponents,
    selectedLauncher,
    selectedRocket,
    difficulty = 'standard',
    budgets,
    setPhase,
  } = useGame();

  const mission = selectedMission || activeScenario;
  const launcher = selectedRocket || selectedLauncher;

  const daily = useMemo(() => getDailyChallenge(), []);
  const isDaily = mission.id === daily.mission.id;

  // Initialize deterministic seeded PRNG (uses date-seed for Daily Challenge, ensuring identical events globally)
  const seed = useMemo(() => {
    if (isDaily) {
      return daily.seed;
    }
    return hashStringToSeed(`${mission.id}-${difficulty}-skyrift-flight-v1`);
  }, [mission.id, difficulty, isDaily, daily.seed]);

  const prngRef = useRef(createPRNG(seed));

  // Initialize simulation state (passing preflight blockers if launching with active risks)
  const [flight, setFlight] = useState<FlightState>(() => {
    let blockers: Array<{ system: string; title: string; description?: string }> = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('skyrift_preflight_blockers');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) blockers = parsed;
        }
      } catch {
        // ignore
      }
    }
    return initFlightState(mission, selectedComponents, budgets, blockers);
  });
  const [selectedAction, setSelectedAction] = useState<FlightAction>('observe');
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);
  const [batteryHistory, setBatteryHistory] = useState<number[]>([100]);
  const [dataHistory, setDataHistory] = useState<number[]>([0]);
  const [showMoreTelemetry, setShowMoreTelemetry] = useState<boolean>(false);

  const eventModalScrollRef = useRef<HTMLDivElement>(null);

  const {
    gameMode,
    myRole,
    turnVotes,
    voteFlightAction,
    executeFlightTurn,
    canExecuteFlightTurn,
    roomState,
  } = useTeam();

  const isCommsOpsOrSolo = gameMode === 'solo' || myRole === 'comms';
  const commsPlayer = roomState
    ? Object.values(roomState.players).find((p) => p.role === 'comms')
    : null;

  const voteTally: Record<FlightAction, string[]> = {
    observe: [],
    downlink: [],
    recharge: [],
    maneuver: [],
  };

  if (gameMode === 'team' && turnVotes) {
    Object.values(turnVotes).forEach((v) => {
      if (voteTally[v.action]) {
        voteTally[v.action].push(v.senderName);
      }
    });
  }

  const handleSelectAction = (action: FlightAction) => {
    setSelectedAction(action);
    sfx.playClick();
    if (gameMode === 'team' && myRole && myRole !== 'comms') {
      voteFlightAction(action);
    }
  };

  // Random event modal state
  const [currentEvent, setCurrentEvent] = useState<FlightEvent | null>(null);
  const [triggeredEventIds, setTriggeredEventIds] = useState<string[]>([]);

  // Auto-scroll anomaly modal to top when a new event triggers
  useEffect(() => {
    if (currentEvent && eventModalScrollRef.current) {
      eventModalScrollRef.current.scrollTop = 0;
    }
  }, [currentEvent]);

  // Flight Director live commentary based on telemetry and action
  const directorComment = useMemo(() => {
    return getFlightDirectorComment(mission.id, flight, selectedAction, !!currentEvent);
  }, [mission.id, flight, selectedAction, currentEvent]);

  // Audio Mute State (persisted to localStorage)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => sfx.getMuted());
  const toggleMute = () => {
    const next = sfx.toggleMute();
    setIsAudioMuted(next);
  };

  // Launch Sequence Modal state (shown once on initial mission flight load, or on-demand)
  const [showLaunchModal, setShowLaunchModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(`skyrift_launched_${mission.id}`);
  });

  const handleLaunchComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`skyrift_launched_${mission.id}`, 'true');
    }
    setShowLaunchModal(false);
  };

  // Visual Novel Story: Mid-Mission Crisis State
  const missionStory = getMissionStory(mission.id);
  const [showCrisisModal, setShowCrisisModal] = useState<boolean>(false);

  // Sync phase to 'flight'
  useEffect(() => {
    setPhase('flight');
  }, [setPhase]);

  // Handle Turn Execution
  const handleExecuteTurn = () => {
    if (flight.isCompleted || isProcessingTurn || currentEvent) return;

    setIsProcessingTurn(true);
    sfx.playClick();

    setTimeout(() => {
      const nextState = simulateTurn(
        flight,
        selectedAction,
        mission,
        selectedComponents,
        budgets
      );

      // Crew Trust micro-adjustment based on deliberate operational action
      if (selectedAction === 'observe') {
        updateCrewTrust({ 'Dr. Lena Okafor': 1 });
      } else if (selectedAction === 'downlink') {
        updateCrewTrust({ 'Ravi Anand': 1 });
      } else if (selectedAction === 'recharge') {
        updateCrewTrust({ 'Kai Mercer': 1 });
      } else if (selectedAction === 'maneuver') {
        updateCrewTrust({ 'Sofia Reyes': 1 });
      }

      // Check for seeded random event trigger, or funding review trigger if launched over budget
      let triggered: FlightEvent | null = null;
      if (
        budgets.isOverBudget &&
        (nextState.turn === 2 || nextState.turn === 3) &&
        !triggeredEventIds.includes('event-funding-review')
      ) {
        triggered = FLIGHT_EVENTS.find((e) => e.id === 'event-funding-review') || null;
      } else {
        triggered = evaluateEventTrigger(
          prngRef.current,
          difficulty,
          triggeredEventIds
        );
      }

      if (triggered && !nextState.isCompleted) {
        setCurrentEvent(triggered);
        setTriggeredEventIds((prev) => [...prev, triggered.id]);
        sfx.playAlert();
      }

      setFlight(nextState);
      if (gameMode === 'team') {
        executeFlightTurn(selectedAction, nextState);
      }
      const updatedBatteryHistory = [...batteryHistory, nextState.batterySoC];
      const updatedDataHistory = [...dataHistory, nextState.downlinkedDataGb];
      setBatteryHistory(updatedBatteryHistory);
      setDataHistory(updatedDataHistory);
      setIsProcessingTurn(false);

      // Trigger Visual Novel Mid-Mission Crisis on turn 4 (halfway through campaign)
      if (
        nextState.turn === 4 &&
        !nextState.isCompleted &&
        isStoryEnabled() &&
        typeof window !== 'undefined' &&
        !sessionStorage.getItem(`skyrift_crisis_seen_${mission.id}`)
      ) {
        setShowCrisisModal(true);
      }

      if (nextState.isCompleted) {
        // Save flight telemetry for Debrief report
        const flightResults = {
          dataDownlinkedGb: nextState.downlinkedDataGb,
          storedDataGb: nextState.storedDataGb,
          dataLossGb: nextState.dataLossGb,
          spacecraftHealth: nextState.craftHealth,
          operationsBonus: Math.round(nextState.scienceCollected / 25),
          totalScience: nextState.scienceCollected,
          batteryHistory: updatedBatteryHistory,
          dataHistory: updatedDataHistory,
          deltaVRemainingMs: nextState.deltaVRemainingMs,
          propellantRemainingKg: nextState.propellantRemainingKg,
          budgetRemaining: nextState.budgetRemaining,
          eventLog: nextState.eventLog,
          completed: true,
        };
        try {
          sessionStorage.setItem('skyrift_flight_results', JSON.stringify(flightResults));
          if (isDaily) {
            markDailyChallengeCompleted(daily.dateString, nextState.scienceCollected);
          }
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
        sfx.playSuccessChime();
      } else {
        if (nextState.isSafeMode) {
          sfx.playAlert();
        } else {
          sfx.playTelemetryBeep();
        }
      }
    }, 280);
  };

  // Resolve Event Choice
  const handleResolveEventOption = (option: FlightEventOption, optIndex: number) => {
    if (!currentEvent) return;
    sfx.playClick();

    // Apply Crew Trust impacts matching this character concern
    const eventReaction = getEventReaction(currentEvent.id);
    const impact = eventReaction?.optionImpacts[optIndex];
    if (impact?.trustDeltas) {
      updateCrewTrust(impact.trustDeltas);
    }

    const effects = option.effects;
    setFlight((prev) => {
      const newWh = Math.max(
        0,
        Math.min(prev.maxBatteryWh, prev.batteryWh + (effects.batteryDeltaWh || 0))
      );
      const newHealth = Math.max(
        0,
        Math.min(100, prev.craftHealth + (effects.craftHealthDelta || 0))
      );
      const newProp = Math.max(
        0,
        prev.propellantRemainingKg + (effects.propellantDeltaKg || 0)
      );
      const newStoredGb = Math.max(
        0,
        Math.min(prev.maxStorageGb, prev.storedDataGb + (effects.dataDeltaGb || 0))
      );
      const newSci = Math.max(0, prev.scienceCollected + (effects.scienceDelta || 0));

      const logEntry: FlightLogEntry = {
        turn: prev.turn,
        day: prev.currentDay,
        action: 'maneuver',
        title: `EVENT: ${currentEvent.title.toUpperCase()}`,
        details: `${option.label} -> ${option.consequenceText}`,
        type: effects.craftHealthDelta && effects.craftHealthDelta < 0 ? 'warning' : 'nominal',
      };

      return {
        ...prev,
        batteryWh: newWh,
        batterySoC: Math.round((newWh / prev.maxBatteryWh) * 100),
        craftHealth: newHealth,
        propellantRemainingKg: Math.round(newProp * 10) / 10,
        storedDataGb: Math.round(newStoredGb * 10) / 10,
        scienceCollected: newSci,
        lastExplanation: `[EVENT RESOLVED]: ${option.consequenceText}`,
        eventLog: [logEntry, ...prev.eventLog],
      };
    });

    setCurrentEvent(null);
  };

  // Color indicators for metrics
  const batteryColor =
    flight.batterySoC < 20
      ? 'text-rose-400'
      : flight.batterySoC < 45
      ? 'text-amber-400'
      : 'text-emerald-400';

  const healthColor =
    flight.craftHealth < 40
      ? 'text-rose-400'
      : flight.craftHealth < 75
      ? 'text-amber-400'
      : 'text-emerald-400';

  const storagePct = Math.round((flight.storedDataGb / flight.maxStorageGb) * 100);
  const turnProgressPct = Math.round((flight.turn / flight.totalTurns) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1 flex flex-col justify-between select-none">
      <div>
        {/* =====================================================================
            TOP TIMELINE PROGRESS BAR
           ===================================================================== */}
        <Panel variant="default" className="p-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider">
                MISSION FLIGHT TIMELINE // {mission.name.toUpperCase()}
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono font-bold text-white">
              <div className="flex items-center space-x-2">
                <span>TURN {Math.min(flight.totalTurns, flight.turn)} OF {flight.totalTurns}</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-slate-400">
                  DAY {flight.currentDay} / {flight.totalDays} DAYS
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-rift-orange uppercase">{difficulty} MODE</span>
                {isDaily && (
                  <>
                    <span className="text-slate-600">&bull;</span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-950/60 text-orange-300 border border-orange-500/30 text-[9px] uppercase font-mono font-bold">
                      DAILY: {daily.modifier.badge}
                    </span>
                  </>
                )}
              </div>

              {/* Action buttons: Replay Launch & Audio Mute Toggle */}
              <div className="flex items-center space-x-1 pl-2 border-l border-[rgba(148,163,184,0.18)]">
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(true)}
                  title="Replay Launch Sequence"
                  className="px-2 py-1 rounded text-[10px] font-mono font-semibold uppercase bg-[#0D1733] hover:bg-[#0E1836] text-white hover:text-rift-orange transition-colors flex items-center space-x-1 border border-[rgba(148,163,184,0.18)]"
                >
                  <Rocket className="w-3 h-3 text-rift-orange" />
                  <span className="hidden sm:inline">LAUNCH</span>
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  title={isAudioMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
                  className="p-1 rounded text-slate-400 hover:text-rift-orange bg-[#0D1733] hover:bg-[#0E1836] transition-colors border border-[rgba(148,163,184,0.18)]"
                >
                  {isAudioMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="w-full h-2.5 rounded-full bg-[#050A1C] overflow-hidden border border-[rgba(148,163,184,0.18)] p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rift-orange to-emerald-500 transition-all duration-300"
              style={{ width: `${turnProgressPct}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1.5">
            <span>T+0 INJECTION</span>
            <span>MID-CRUISE SURVEY</span>
            <span>ORBITAL RECON</span>
            <span>FINAL OBSERVATIONS</span>
          </div>
        </Panel>

        {/* =====================================================================
            LIVE ORBITAL TRAJECTORY VIEW
           ===================================================================== */}
        <div className="mb-5">
          <LiveTrajectoryView
            mission={mission}
            turn={flight.turn}
            totalTurns={flight.totalTurns}
            currentDay={flight.currentDay}
            totalDays={flight.totalDays}
            downlinkedGb={flight.downlinkedDataGb}
            isSafeMode={flight.isSafeMode}
          />
        </div>

        {/* =====================================================================
            LIVE TELEMETRY DASHBOARD (4 MAIN METERS: Battery, Data, Propellant, Health) - Rule 5
           ===================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* 1. Battery */}
          <Panel variant="subtle" className="p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase font-bold">BATTERY</span>
              <Battery className="w-4 h-4 text-rift-orange" />
            </div>
            <div className={`text-xl font-black font-mono ${batteryColor}`}>
              {flight.batterySoC}%
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              {flight.batteryWh} / {flight.maxBatteryWh} Wh
            </div>
          </Panel>

          {/* 2. Data Buffer */}
          <Panel variant="subtle" className="p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase font-bold">DATA BUFFER</span>
              <Database className="w-4 h-4 text-rift-orange" />
            </div>
            <div className={`text-xl font-black font-mono ${storagePct >= 95 ? 'text-rose-400' : 'text-white'}`}>
              {flight.storedDataGb} GB
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              {storagePct}% SSD &bull; {flight.downlinkedDataGb} GB downlinked
            </div>
          </Panel>

          {/* 3. Propellant */}
          <Panel variant="subtle" className="p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase font-bold">PROPELLANT</span>
              <Flame className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-black font-mono text-white">
              {flight.propellantRemainingKg} kg
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              Δv {flight.deltaVRemainingMs} m/s remaining
            </div>
          </Panel>

          {/* 4. Craft Health */}
          <Panel variant="subtle" className="p-3.5">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase font-bold">CRAFT HEALTH</span>
              <HeartPulse className="w-4 h-4 text-rose-400" />
            </div>
            <div className={`text-xl font-black font-mono ${healthColor}`}>
              {flight.craftHealth}%
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate">
              {flight.isSafeMode ? 'Safe Mode Active' : 'Nominal Systems'}
            </div>
          </Panel>
        </div>

        {/* 1-Line "Why" Diagnostic Strip with "More" Toggle (Rule 5) */}
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#0A1228]/95 border border-slate-700/80 text-xs font-mono flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Info className="w-4 h-4 text-rift-orange shrink-0" />
            <span className="text-slate-300 truncate font-sans">
              <strong className="text-rift-orange uppercase font-mono mr-1">Turn {flight.turn} Why:</strong>
              {flight.lastExplanation || 'Nominal orbital passage; solar wings generating power while instruments stand by.'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setShowMoreTelemetry((prev) => !prev);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold flex items-center space-x-1 shrink-0 transition-colors"
          >
            <span>{showMoreTelemetry ? 'Hide More' : 'More Stats & Log'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreTelemetry ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* =====================================================================
            MORE TELEMETRY, CREW TRUST & FLIGHT LOG (COLLAPSIBLE DRAWER - Rule 5)
           ===================================================================== */}
        {showMoreTelemetry && (
          <div className="space-y-4 mb-5 p-4 rounded-2xl bg-[#070E24]/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            {/* Secondary 3 Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#0A1228] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">SCIENCE COLLECTED</span>
                  <span className="text-lg font-black font-mono text-rift-orange">{flight.scienceCollected} pts</span>
                </div>
                <MissionSegmentChip segment="user" />
              </div>

              <div className="p-3 rounded-xl bg-[#0A1228] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">DOWNLINK TOTAL</span>
                  <span className="text-lg font-black font-mono text-emerald-400">{flight.downlinkedDataGb} GB</span>
                </div>
                <MissionSegmentChip segment="ground" />
              </div>

              <div className="p-3 rounded-xl bg-[#0A1228] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">SURPLUS GRANT</span>
                  <span className="text-lg font-black font-mono text-white">{formatCredits(flight.budgetRemaining)}</span>
                </div>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            {/* Crew Trust Meter behind More */}
            <div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                CREW MORALE &amp; TRUST LEVEL
              </div>
              <CrewTrustMeter compact />
            </div>

            {/* Flight Director Advisory Note */}
            <div className="p-3.5 rounded-xl bg-[#0A1228] border border-slate-800 flex items-start space-x-3">
              <Radio className="w-4 h-4 text-rift-orange shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs font-sans">
                <span className="font-mono font-bold text-rift-orange text-[10px] uppercase block mb-0.5">
                  {directorComment.directorName} ({directorComment.callsign}) &bull; STATUS: {directorComment.badge}
                </span>
                <p className="text-slate-200 italic leading-relaxed">&ldquo;{directorComment.line.text}&rdquo;</p>
              </div>
            </div>

            {/* Full Event Telemetry Log */}
            <div className="rounded-xl bg-[#0A1228] border border-slate-800 overflow-hidden">
              <div className="px-3.5 py-2 bg-[#0D1733] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-rift-orange uppercase">FULL FLIGHT EVENT LOG</span>
                <span className="text-slate-400">{flight.eventLog.length} EVENTS</span>
              </div>
              <div className="p-3 space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
                {flight.eventLog.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-left ${
                      entry.type === 'alert'
                        ? 'bg-rose-950/50 border-rose-500/30 text-rose-200'
                        : entry.type === 'warning'
                        ? 'bg-amber-950/50 border-amber-500/30 text-amber-200'
                        : 'bg-[#0D1733]/80 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold text-rift-orange uppercase">
                        TURN {entry.turn} &bull; DAY {entry.day}
                      </span>
                      <span className="text-slate-400 uppercase">{entry.action}</span>
                    </div>
                    <div className="font-bold text-xs text-white">{entry.title}</div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed font-sans">
                      {entry.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MAIN GAMEPLAY ROW: 4 ACTION CARDS & TURN EXECUTION - Rule 5
           ===================================================================== */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              {gameMode === 'team' && !isCommsOpsOrSolo
                ? `RECOMMEND TURN ${flight.turn} ACTION (CREW VOTE)`
                : `SELECT TURN ${flight.turn} ACTION (CHOOSE ONE)`}
            </h2>
            {gameMode === 'team' && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                COMMS &amp; OPS LEAD CONTROLS EXECUTION
              </span>
            )}
            {flight.isSafeMode && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                SAFE MODE ACTIVE
              </span>
            )}
          </div>

          {/* 4 Action Cards Grid (Rule 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. OBSERVE */}
            <button
              type="button"
              disabled={flight.isCompleted || flight.isSafeMode || !!currentEvent}
              onClick={() => handleSelectAction('observe')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedAction === 'observe'
                  ? 'bg-[#0E1836] border-rift-orange ring-1 ring-rift-orange/40 shadow-hud-orange'
                  : 'bg-[#0A1228]/80 border-slate-800 hover:border-slate-700 shadow-sm'
              } ${flight.isSafeMode || !!currentEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2 text-rift-orange font-bold text-xs font-mono uppercase">
                  <Eye className="w-4 h-4" />
                  <span>Observe</span>
                </div>
                <div className="flex items-center space-x-1">
                  {gameMode === 'team' && voteTally.observe.length > 0 && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                      {voteTally.observe.length} vote{voteTally.observe.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <MissionSegmentChip segment="user" />
                </div>
              </div>
              <h3 className="text-sm font-black text-white font-sans">Science Survey</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                Power up science instruments to gather planetary observations and accumulate score points.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                +Data Buffer &bull; +Science &bull; -Battery
              </div>
            </button>

            {/* 2. DOWNLINK */}
            <button
              type="button"
              disabled={flight.isCompleted || flight.isSafeMode || !!currentEvent}
              onClick={() => handleSelectAction('downlink')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedAction === 'downlink'
                  ? 'bg-[#0E1836] border-rift-orange ring-1 ring-rift-orange/40 shadow-hud-orange'
                  : 'bg-[#0A1228]/80 border-slate-800 hover:border-slate-700 shadow-sm'
              } ${flight.isSafeMode || !!currentEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs font-mono uppercase">
                  <Radio className="w-4 h-4" />
                  <span>Downlink</span>
                </div>
                <div className="flex items-center space-x-1">
                  {gameMode === 'team' && voteTally.downlink.length > 0 && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                      {voteTally.downlink.length} vote{voteTally.downlink.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <MissionSegmentChip segment="ground" />
                </div>
              </div>
              <h3 className="text-sm font-black text-white font-sans">Transmit to Earth</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                Slew antenna toward Earth to beam stored observations through the Deep Space Network.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                -Buffer &bull; +Downlinked &bull; Frees SSD
              </div>
            </button>

            {/* 3. RECHARGE / SAFE MODE */}
            <button
              type="button"
              disabled={flight.isCompleted || !!currentEvent}
              onClick={() => handleSelectAction('recharge')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedAction === 'recharge'
                  ? 'bg-[#0E1836] border-rift-orange ring-1 ring-rift-orange/40 shadow-hud-orange'
                  : 'bg-[#0A1228]/80 border-slate-800 hover:border-slate-700 shadow-sm'
              } ${!!currentEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs font-mono uppercase">
                  <Zap className="w-4 h-4" />
                  <span>Recharge / Safe</span>
                </div>
                {gameMode === 'team' && voteTally.recharge.length > 0 && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                    {voteTally.recharge.length} vote{voteTally.recharge.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-white font-sans">Power Conservation</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                Orient solar wings for peak sun exposure, idle instruments, and restore depleted batteries.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                +Battery &bull; +12% Health &bull; Zero Drain
              </div>
            </button>

            {/* 4. MANEUVER */}
            <button
              type="button"
              disabled={flight.isCompleted || flight.propellantRemainingKg <= 0 || flight.isSafeMode || !!currentEvent}
              onClick={() => handleSelectAction('maneuver')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedAction === 'maneuver'
                  ? 'bg-[#0E1836] border-rift-orange ring-1 ring-rift-orange/40 shadow-hud-orange'
                  : 'bg-[#0A1228]/80 border-slate-800 hover:border-slate-700 shadow-sm'
              } ${flight.propellantRemainingKg <= 0 || flight.isSafeMode || !!currentEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2 text-slate-300 font-bold text-xs font-mono uppercase">
                  <Flame className="w-4 h-4" />
                  <span>Maneuver</span>
                </div>
                {gameMode === 'team' && voteTally.maneuver.length > 0 && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                    {voteTally.maneuver.length} vote{voteTally.maneuver.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-white font-sans">Orbital Trim Burn</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                Fire thrusters to counteract orbital drag and maintain ideal science observation periapsis.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                -Propellant &bull; -Δv &bull; Orbit Stabilized
              </div>
            </button>
          </div>

          {/* Execute Button - The ONE strong orange action on screen (Rule 1) */}
          <div className="pt-2">
            {!flight.isCompleted ? (
              isCommsOpsOrSolo ? (
                <button
                  type="button"
                  disabled={isProcessingTurn || !!currentEvent}
                  onClick={handleExecuteTurn}
                  className="w-full py-4 rounded-xl bg-rift-orange hover:bg-[#E64C0E] text-white font-mono font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_24px_rgba(255,90,31,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>EXECUTE TURN {flight.turn} ({selectedAction.toUpperCase()})</span>
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center space-x-2 text-purple-200">
                    <Radio className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
                    <span>
                      <b>SUGGESTED {selectedAction.toUpperCase()}:</b> Waiting for {commsPlayer?.name || 'Comms & Ops Lead'} to execute turn.
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-300 bg-purple-900/60 px-2.5 py-1 rounded-md border border-purple-500/30 font-bold uppercase self-start sm:self-auto shadow-xs">
                    Vote Submitted
                  </span>
                </div>
              )
            ) : (
              <Link href="/debrief" onClick={() => sfx.playClick()}>
                <button
                  type="button"
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_24px_rgba(16,185,129,0.5)] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>MISSION COMPLETED &bull; PROCEED TO DEBRIEF</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          RANDOM EVENT MODAL OVERLAY (DETERMINISTIC SEEDED EVENTS) - Rule 5
         ===================================================================== */}
      {currentEvent && (
        <div className="fixed inset-0 z-50 bg-[#050A1C]/85 backdrop-blur-md flex items-start justify-center pt-4 sm:pt-8 p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0A1228] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-fadeIn flex flex-col my-auto sm:my-0">
            {/* Modal Header (Fixed top) */}
            <div className="px-5 py-3.5 bg-[#0D1733] text-white flex items-center justify-between border-b border-slate-700/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-rift-orange text-white shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-widest">
                    IN-FLIGHT ANOMALY // OPERATIONAL DECISION REQUIRED
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-sans">
                    {currentEvent.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Narrative Body */}
            <div
              ref={eventModalScrollRef}
              className="p-4 sm:p-5 space-y-3"
            >
              {/* Event Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {currentEvent.description}
              </p>

              {/* Matching Character Reaction Banner */}
              {(() => {
                const reaction = getEventReaction(currentEvent.id);
                if (!reaction || !isStoryEnabled()) return null;
                const portrait = PORTRAIT_CONFIG[reaction.speaker];
                const char = CHARACTERS[reaction.speaker];
                return (
                  <div className="p-3 rounded-xl bg-[#050A1C] border border-slate-800 flex items-start space-x-3 shadow-xs">
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${portrait.gradient} text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-sm ring-1 ${portrait.ringColor}`}
                    >
                      {portrait.initials}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-white">
                            {reaction.speaker}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            &bull; {char.callsign}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-[#0D1733] border border-slate-700 text-slate-300">
                          {reaction.mood}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium italic leading-relaxed font-sans">
                        &ldquo;{reaction.line}&rdquo;
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* "What Real Missions Do" Educational Box as Compact Card (Rule 5) */}
              <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-500/30 flex items-start space-x-2.5 text-sky-200 font-sans text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-mono text-[10px] font-bold uppercase text-sky-300 mr-1.5">
                    REAL MISSION NOTE:
                  </span>
                  <span>{currentEvent.realMissionContext}</span>
                </div>
              </div>
            </div>

            {/* Response Options - Both options immediately visible (Rule 5) */}
            <div className="shrink-0 bg-[#070E24] border-t border-slate-700/80 p-3.5 sm:p-4 space-y-2">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>SELECT CONTROLLER ACTION:</span>
                <span className="text-[9px] font-mono text-slate-500">2 OPTIONS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentEvent.options.map((opt, idx) => {
                  const reaction = getEventReaction(currentEvent.id);
                  const impact = reaction?.optionImpacts[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleResolveEventOption(opt, idx)}
                      className="p-3 rounded-xl border border-slate-700/80 hover:border-rift-orange bg-[#0D1733] hover:bg-[#0E1836] text-left transition-all group shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-black text-xs sm:text-sm text-white group-hover:text-rift-orange transition-colors leading-tight font-sans">
                            {opt.label}
                          </span>
                          {impact && (
                            <span className="text-[9px] font-mono font-bold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30 shrink-0">
                              {impact.summaryBadge}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 font-sans">
                          {opt.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono">
                        <span className="font-bold text-slate-400">IMPACT:</span>
                        {opt.effects.batteryDeltaWh && (
                          <span className={opt.effects.batteryDeltaWh > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {opt.effects.batteryDeltaWh > 0 ? '+' : ''}
                            {opt.effects.batteryDeltaWh} Wh
                          </span>
                        )}
                        {opt.effects.craftHealthDelta && (
                          <span className={opt.effects.craftHealthDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {opt.effects.craftHealthDelta > 0 ? '+' : ''}
                            {opt.effects.craftHealthDelta}% hp
                          </span>
                        )}
                        {opt.effects.scienceDelta && (
                          <span className={opt.effects.scienceDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {opt.effects.scienceDelta > 0 ? '+' : ''}
                            {opt.effects.scienceDelta} sci
                          </span>
                        )}
                        {opt.effects.dataDeltaGb && (
                          <span className={opt.effects.dataDeltaGb > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {opt.effects.dataDeltaGb > 0 ? '+' : ''}
                            {opt.effects.dataDeltaGb} GB
                          </span>
                        )}
                        {opt.effects.propellantDeltaKg && (
                          <span className="text-rose-400">
                            {opt.effects.propellantDeltaKg} kg
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          LAUNCH SEQUENCE ANIMATION MODAL
         ===================================================================== */}
      {showLaunchModal && (
        <LaunchSequenceModal
          mission={mission}
          rocket={launcher}
          components={selectedComponents}
          onComplete={handleLaunchComplete}
        />
      )}

      {/* =====================================================================
          VISUAL NOVEL: MID-MISSION CRISIS DIALOGUE MODAL OVERLAY
         ===================================================================== */}
      {showCrisisModal && isStoryEnabled() && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#050A1C]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <DialogueBox
            title={missionStory.chapterTitle.toUpperCase()}
            badge={missionStory.midMissionCrisis.title.toUpperCase()}
            dialogue={missionStory.midMissionCrisis.dialogue}
            onComplete={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(`skyrift_crisis_seen_${mission.id}`, 'true');
              }
              setShowCrisisModal(false);
            }}
          />
        </div>
      )}

      {/* Footer Navigation */}
      <div className="mt-6 pt-4 border-t border-[rgba(148,163,184,0.18)] flex items-center justify-between text-xs font-mono">
        <Link
          href="/hangar"
          onClick={() => sfx.playClick()}
          className="text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Abandon to Hangar</span>
        </Link>

        {flight.isCompleted && (
          <span className="font-bold text-emerald-400 uppercase">
            All 8 Turns Completed Successfully!
          </span>
        )}
      </div>
    </div>
  );
}
