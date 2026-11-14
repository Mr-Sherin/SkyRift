'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/game/engine/GameContext';
import { ANOMALIES } from '@/data/gameData';
import { AnomalyEvent } from '@/game/types';
import {
  Radio,
  Battery,
  Database,
  ShieldAlert,
  Play,
  Pause,
  CheckCircle,
  ArrowRight,
  Flame,
  HeartPulse,
} from 'lucide-react';
import { SpacecraftStation3D } from '@/components/visualizer/SpacecraftStation3D';
import { sfx } from '@/lib/audio';
import { Panel, HudStat, SectionLabel } from '@/components/ui';

export default function OperationsPage() {
  const router = useRouter();
  const { activeScenario, budgets } = useGame();

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [missionElapsedHours, setMissionElapsedHours] = useState<number>(0);

  const [batterySoC, setBatterySoC] = useState<number>(100);
  const [propellantRemainingKg, setPropellantRemainingKg] = useState<number>(budgets.propellantMassKg);
  const [dataStoredGb, setDataStoredGb] = useState<number>(0);
  const [dataDownlinkedGb, setDataDownlinkedGb] = useState<number>(0);
  const [spacecraftHealth, setSpacecraftHealth] = useState<number>(100);
  const [operationsBonus, setOperationsBonus] = useState<number>(0);

  const [currentAnomaly, setCurrentAnomaly] = useState<AnomalyEvent | null>(null);
  const [anomalyTriggered, setAnomalyTriggered] = useState<boolean>(false);
  const [missionComplete, setMissionComplete] = useState<boolean>(false);

  useEffect(() => {
    if (missionElapsedHours === 0) {
      setPropellantRemainingKg(budgets.propellantMassKg);
    }
  }, [budgets.propellantMassKg, missionElapsedHours]);

  const oneWayLightSeconds = Math.round(activeScenario.distanceAu * 499);
  const latencyDisplay =
    oneWayLightSeconds < 5
      ? `${oneWayLightSeconds}s (Instant)`
      : `${Math.round(oneWayLightSeconds / 60)} min (${oneWayLightSeconds}s)`;

  // Mission simulation tick loop
  useEffect(() => {
    if (!isPlaying || missionComplete || currentAnomaly) return;

    const timer = setInterval(() => {
      setMissionElapsedHours((prev) => {
        const nextHours = prev + simSpeed * 2;
        const totalMissionHours = activeScenario.durationDays * 24;

        if (nextHours >= totalMissionHours) {
          setMissionComplete(true);
          sfx.playSuccessChime();
          return totalMissionHours;
        }

        // Anomaly trigger around midpoint
        if (!anomalyTriggered && nextHours >= totalMissionHours * 0.45) {
          if (ANOMALIES.length > 0) {
            const chosen = ANOMALIES[Math.floor(Math.random() * ANOMALIES.length)];
            setCurrentAnomaly(chosen);
            setAnomalyTriggered(true);
            sfx.playAlert();
          }
        }

        return nextHours;
      });

      // Battery & Power calculations
      setBatterySoC((prev) => {
        const netW = budgets.powerMarginW;
        if (netW >= 0) {
          return Math.min(100, prev + 0.8 * simSpeed);
        } else {
          const drain = Math.abs(netW) / (budgets.batteryCapacityWh || 500);
          return Math.max(5, prev - drain * 1.5 * simSpeed);
        }
      });

      // Data production & downlink
      setDataStoredGb((prevStored) => {
        const generationRate = 2 * simSpeed;
        const downlinkCapacity = (budgets.dataRateMbps / 10) * simSpeed;
        const newStored = Math.min(budgets.totalStorageGb, prevStored + generationRate);
        const actualDownlinked = Math.min(newStored, downlinkCapacity);

        setDataDownlinkedGb((d) => d + actualDownlinked);
        return Math.max(0, newStored - actualDownlinked);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isPlaying,
    simSpeed,
    missionComplete,
    currentAnomaly,
    anomalyTriggered,
    activeScenario,
    budgets,
  ]);

  const handleResolveAnomaly = (optionIdx: number) => {
    if (!currentAnomaly) return;
    sfx.playComponentAttach();

    const opt = currentAnomaly.options[optionIdx];
    if (opt.effects.reliabilityImpact) {
      setSpacecraftHealth((h) => Math.max(10, h - (opt.effects.reliabilityImpact || 0)));
    }
    if (opt.effects.propellantLossKg) {
      setPropellantRemainingKg((f) => Math.max(0, f - (opt.effects.propellantLossKg || 0)));
    }
    if (opt.effects.scienceValueChange) {
      setOperationsBonus((b) => b + (opt.effects.scienceValueChange || 0));
    }

    setCurrentAnomaly(null);
  };

  const handleFinishToDebrief = () => {
    sfx.playClick();
    router.push(`/debrief?bonus=${operationsBonus}&health=${spacecraftHealth}`);
  };

  const progressPercent = Math.min(
    100,
    (missionElapsedHours / (activeScenario.durationDays * 24)) * 100
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[rgba(148,163,184,0.14)] gap-4">
        <div>
          <SectionLabel color="orange">STEP 05 // FLIGHT OPERATIONS</SectionLabel>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9] font-mono tracking-tight mt-1">
            MISSION CONTROL CONSOLE
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Monitoring <b className="text-[#F1F5F9]">{activeScenario.name}</b> at {activeScenario.destinationName} &bull; Signal delay: <b className="font-mono text-[#FF5A1F]">{latencyDisplay}</b>
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#0A1228] p-1.5 rounded-xl border border-[rgba(148,163,184,0.18)] shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause simulation' : 'Resume simulation'}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0E1836] hover:bg-[#15234A] text-xs font-mono font-bold text-[#F1F5F9] transition-all"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#FF5A1F]" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isPlaying ? 'PAUSE' : 'RESUME'}</span>
          </button>
          <div className="h-5 w-px bg-[rgba(148,163,184,0.18)]" />
          {[1, 5, 20].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => setSimSpeed(speed)}
              className={`px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                simSpeed === speed
                  ? 'bg-[#FF5A1F] text-white shadow-[0_0_10px_rgba(255,90,31,0.4)]'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#0E1836]'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Card */}
      <Panel variant="default" padding="sm" className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-[#94A3B8]">
            MISSION PROGRESS: DAY {Math.floor(missionElapsedHours / 24)} OF {activeScenario.durationDays}
          </span>
          <span className="text-[#FF5A1F] font-black">{progressPercent.toFixed(1)}% COMPLETE</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#070E24] border border-[rgba(148,163,184,0.14)] overflow-hidden">
          <div
            className="h-full bg-[#FF5A1F] shadow-[0_0_10px_rgba(255,90,31,0.5)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Panel>

      {/* 4 Clean Telemetry Cards + 3D Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Panel variant="default" padding="md" className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#94A3B8] uppercase">
              <Battery className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>BATTERY CHARGE</span>
            </div>
            <div className={`text-2xl font-black font-mono ${batterySoC < 30 ? 'text-rose-400' : 'text-[#F1F5F9]'}`}>
              {batterySoC.toFixed(0)}%
            </div>
            <div className="text-xs text-[#94A3B8]">
              Active power load: <b className="font-mono text-[#F1F5F9]">{budgets.powerDrawActiveW} W</b>
            </div>
          </Panel>

          <Panel variant="default" padding="md" className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#94A3B8] uppercase">
              <Flame className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>FUEL REMAINING</span>
            </div>
            <div className="text-2xl font-black font-mono text-[#F1F5F9]">
              {propellantRemainingKg.toFixed(1)} kg
            </div>
            <div className="text-xs text-[#94A3B8]">
              Starting tank load: <b className="font-mono text-[#F1F5F9]">{budgets.propellantMassKg} kg</b>
            </div>
          </Panel>

          <Panel variant="default" padding="md" className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#94A3B8] uppercase">
              <Database className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>SCIENCE DATA</span>
            </div>
            <div className="text-2xl font-black font-mono text-[#F1F5F9]">
              {dataDownlinkedGb.toFixed(1)} GB
            </div>
            <div className="text-xs text-[#94A3B8]">
              Buffer: <b className="font-mono text-[#F1F5F9]">{dataStoredGb.toFixed(1)} / {budgets.totalStorageGb} GB</b>
            </div>
          </Panel>

          <Panel variant="default" padding="md" className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#94A3B8] uppercase">
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
              <span>CRAFT HEALTH</span>
            </div>
            <div className={`text-2xl font-black font-mono ${spacecraftHealth < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {spacecraftHealth}%
            </div>
            <div className="text-xs text-[#94A3B8]">
              {currentAnomaly ? 'Anomaly requires crew action' : 'Thermal & guidance nominal'}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-5 h-[250px] lg:h-auto min-h-[230px] rounded-2xl bg-[#0A1228] border border-[rgba(148,163,184,0.16)] overflow-hidden shadow-hud relative">
          <div className="pointer-events-none absolute top-3 left-3.5 z-10 text-[10px] font-mono font-bold text-[#94A3B8] uppercase bg-[#070E24]/85 px-2.5 py-1 rounded-lg border border-[rgba(148,163,184,0.18)]">
            LIVE ORBITAL ORIENTATION
          </div>
          <SpacecraftStation3D centered className="w-full h-full" />
        </div>
      </div>

      {/* Deep Space Network Status Strip */}
      <Panel variant="default" padding="md" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 flex items-center justify-center text-[#FF5A1F] shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black font-mono text-[#F1F5F9] uppercase tracking-wide">
              Deep Space Network Downlink Active
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Goldstone, Canberra &amp; Madrid antennas receiving science telemetry continuously.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 font-mono text-xs">
          <div>
            <span className="text-[10px] text-[#94A3B8] uppercase block">DOWNLINK SPEED</span>
            <span className="text-sm text-[#F1F5F9] font-black">{budgets.dataRateMbps} Mbps</span>
          </div>
          <div>
            <span className="text-[10px] text-[#94A3B8] uppercase block">ONE-WAY DELAY</span>
            <span className="text-sm text-[#FF5A1F] font-black">{latencyDisplay}</span>
          </div>
        </div>
      </Panel>

      {missionComplete && (
        <Panel variant="default" padding="lg" className="border-emerald-500/40 bg-emerald-950/20 text-center flex flex-col items-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
          <h2 className="text-lg font-black font-mono text-[#F1F5F9] uppercase">Mission Complete</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-md">
            Your spacecraft finished its survey window and transmitted science results back to Earth.
          </p>
          <button
            type="button"
            onClick={handleFinishToDebrief}
            className="mt-4 px-8 py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#E64C0E] text-white font-mono font-bold text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(255,90,31,0.4)] flex items-center space-x-2 active:scale-95"
          >
            <span>VIEW FINAL MISSION REPORT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Panel>
      )}

      {currentAnomaly && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0A1228] border border-rose-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-400 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                IN-FLIGHT ANOMALY ALERT
              </span>
            </div>

            <h3 className="text-lg font-black font-mono text-[#F1F5F9]">{currentAnomaly.title}</h3>
            <p className="text-sm text-[#CBD5E1] mt-1.5 leading-relaxed">
              {currentAnomaly.description}
            </p>

            <div className="mt-5 space-y-2.5">
              {currentAnomaly.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleResolveAnomaly(idx)}
                  className="w-full p-3.5 rounded-xl bg-[#070E24] hover:bg-[#0E1836] border border-[rgba(148,163,184,0.2)] hover:border-[#FF5A1F] text-left transition-all group"
                >
                  <div className="text-xs font-mono font-bold text-[#F1F5F9] group-hover:text-[#FF5A1F] flex items-center justify-between">
                    <span>{opt.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
