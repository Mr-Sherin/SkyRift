'use client';

import React, { useState, useMemo } from 'react';
import {
  Rocket,
  Compass,
  Radio,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Moon,
  Clock,
  Layers,
  ShieldAlert,
  Zap,
  Info,
} from 'lucide-react';
import { Panel, Badge } from '@/components/ui';

export interface TimelineLogEvent {
  turn: number;
  day: number;
  action: string;
  title: string;
  details: string;
  type: 'nominal' | 'warning' | 'alert' | 'success';
}

interface MissionTimelineStripProps {
  events: TimelineLogEvent[];
  missionName: string;
  destinationName: string;
  durationDays: number;
}

type TimelineCategory = 'all' | 'launch' | 'insertion' | 'eclipse' | 'anomaly' | 'downlink';

interface ClassifiedEvent {
  id: string;
  raw: TimelineLogEvent;
  category: 'launch' | 'insertion' | 'eclipse' | 'anomaly' | 'downlink' | 'science' | 'completion';
  categoryLabel: string;
  icon: React.ElementType;
  colorClass: string;
  badgeVariant: 'good' | 'warn' | 'danger' | 'info' | 'neutral';
  phase: string;
}

export function MissionTimelineStrip({
  events,
  missionName,
  destinationName,
  durationDays,
}: MissionTimelineStripProps) {
  const [selectedFilter, setSelectedFilter] = useState<TimelineCategory>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Classify real flight log events into chronological markers
  const classifiedEvents = useMemo(() => {
    // If events array is empty or lacks specific milestones, generate baseline timeline entries
    const list: TimelineLogEvent[] = events && events.length > 0 ? [...events] : [];

    // Ensure chronological ordering (turn/day ascending)
    list.sort((a, b) => a.day - b.day || a.turn - b.turn);

    return list.map((item, idx): ClassifiedEvent => {
      const lowerTitle = (item.title || '').toLowerCase();
      const lowerDetails = (item.details || '').toLowerCase();
      const lowerAction = (item.action || '').toLowerCase();

      let category: ClassifiedEvent['category'] = 'science';
      let categoryLabel = 'Science Operation';
      let icon = Sparkles;
      let colorClass = 'text-sky-400 bg-sky-950/60 border-sky-500/40 ring-sky-500/40';
      let badgeVariant: ClassifiedEvent['badgeVariant'] = 'info';
      let phase = 'Phase 3: Orbital Operations';

      // 1. Launch Result
      if (
        item.turn === 0 ||
        lowerTitle.includes('launch') ||
        lowerTitle.includes('liftoff') ||
        lowerTitle.includes('ascent') ||
        lowerDetails.includes('liftoff')
      ) {
        category = 'launch';
        categoryLabel = 'Launch & Staging';
        icon = Rocket;
        phase = 'Phase 1: Launch & Ascent';
        if (item.type === 'alert') {
          colorClass = 'text-rose-400 bg-rose-950/60 border-rose-500/50 ring-rose-500/40';
          badgeVariant = 'danger';
        } else if (item.type === 'warning') {
          colorClass = 'text-amber-400 bg-amber-950/60 border-amber-500/50 ring-amber-500/40';
          badgeVariant = 'warn';
        } else {
          colorClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50 ring-emerald-500/40';
          badgeVariant = 'good';
        }
      }
      // 2. Orbit Insertion
      else if (
        lowerTitle.includes('insertion') ||
        lowerTitle.includes('injection') ||
        lowerTitle.includes('circulariz') ||
        lowerDetails.includes('orbit insertion') ||
        lowerTitle.includes('capture burn') ||
        lowerDetails.includes('tli') ||
        lowerDetails.includes('tmi')
      ) {
        category = 'insertion';
        categoryLabel = 'Orbit Insertion';
        icon = Compass;
        phase = 'Phase 2: Orbit Insertion';
        colorClass = 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50 ring-cyan-500/40';
        badgeVariant = 'info';
      }
      // 3. Anomalies & Malfunctions
      else if (
        item.type === 'alert' ||
        item.type === 'warning' ||
        lowerTitle.includes('anomaly') ||
        lowerTitle.includes('flare') ||
        lowerTitle.includes('cme') ||
        lowerTitle.includes('radiation') ||
        lowerTitle.includes('strike') ||
        lowerTitle.includes('safe mode') ||
        lowerDetails.includes('safe mode') ||
        lowerDetails.includes('anomaly')
      ) {
        category = 'anomaly';
        categoryLabel = 'Flight Anomaly';
        icon = ShieldAlert;
        phase = 'In-Flight Anomaly';
        colorClass =
          item.type === 'alert'
            ? 'text-rose-400 bg-rose-950/80 border-rose-500/60 ring-rose-500/50'
            : 'text-amber-400 bg-amber-950/80 border-amber-500/60 ring-amber-500/50';
        badgeVariant = item.type === 'alert' ? 'danger' : 'warn';
      }
      // 4. Eclipses
      else if (
        lowerTitle.includes('eclipse') ||
        lowerTitle.includes('shadow') ||
        lowerTitle.includes('umbra') ||
        lowerDetails.includes('eclipse') ||
        lowerDetails.includes('shadow') ||
        lowerDetails.includes('battery drain')
      ) {
        category = 'eclipse';
        categoryLabel = 'Orbital Eclipse';
        icon = Moon;
        phase = 'Phase 3: Eclipse Shadow';
        colorClass = 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40 ring-indigo-500/40';
        badgeVariant = 'warn';
      }
      // 5. Downlinks
      else if (
        lowerAction === 'downlink' ||
        lowerTitle.includes('downlink') ||
        lowerTitle.includes('dsn') ||
        lowerTitle.includes('ground station') ||
        lowerDetails.includes('downlink') ||
        lowerDetails.includes('ground pass')
      ) {
        category = 'downlink';
        categoryLabel = 'Data Downlink';
        icon = Radio;
        phase = 'Phase 4: Ground Segment';
        colorClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50 ring-emerald-500/40';
        badgeVariant = 'good';
      }
      // 6. Completion
      else if (
        idx === list.length - 1 ||
        lowerTitle.includes('complete') ||
        lowerTitle.includes('concluded') ||
        lowerTitle.includes('final')
      ) {
        category = 'completion';
        categoryLabel = 'Mission Closeout';
        icon = CheckCircle2;
        phase = 'Phase 5: Mission Closeout';
        colorClass = 'text-rift-orange bg-orange-950/60 border-rift-orange/50 ring-rift-orange/40';
        badgeVariant = 'good';
      }

      return {
        id: `ev-${idx}-${item.turn}-${item.day}`,
        raw: item,
        category,
        categoryLabel,
        icon,
        colorClass,
        badgeVariant,
        phase,
      };
    });
  }, [events]);

  // Filtered list
  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'all') return classifiedEvents;
    return classifiedEvents.filter((e) => e.category === selectedFilter);
  }, [classifiedEvents, selectedFilter]);

  const activeEvent = useMemo(() => {
    if (!selectedEventId) return classifiedEvents[0] || null;
    return classifiedEvents.find((e) => e.id === selectedEventId) || classifiedEvents[0] || null;
  }, [classifiedEvents, selectedEventId]);

  if (!classifiedEvents || classifiedEvents.length === 0) {
    return null;
  }

  return (
    <Panel variant="elevated" className="p-5 sm:p-7 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[rgba(148,163,184,0.18)] gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-rift-orange/15 border border-rift-orange/40 text-rift-orange">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider">
              TELEMETRY LOG RECONSTRUCTION // FLIGHT EVENTS
            </div>
            <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-tight mt-0.5">
              Mission Timeline &amp; Event Strip
            </h3>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto text-[10px] font-mono font-bold">
          {(
            [
              { id: 'all', label: `ALL (${classifiedEvents.length})` },
              { id: 'launch', label: 'LAUNCH' },
              { id: 'insertion', label: 'INSERTION' },
              { id: 'eclipse', label: 'ECLIPSES' },
              { id: 'anomaly', label: 'ANOMALIES' },
              { id: 'downlink', label: 'DOWNLINKS' },
            ] as const
          ).map((filter) => {
            const count =
              filter.id === 'all'
                ? classifiedEvents.length
                : classifiedEvents.filter((e) => e.category === filter.id).length;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-2.5 py-1 rounded-full border transition-all ${
                  selectedFilter === filter.id
                    ? 'bg-rift-orange text-white border-rift-orange shadow-hud-orange'
                    : 'bg-[#070E24] text-slate-400 border-[rgba(148,163,184,0.18)] hover:text-white hover:border-[rgba(148,163,184,0.35)]'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mission Phases Horizontal Track Indicator */}
      <div className="p-3 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.14)] space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
          <span>T+0h Liftoff</span>
          <span>Target: {destinationName}</span>
          <span>Mission Day {durationDays} Complete</span>
        </div>

        {/* Horizontal Phase Progress Ribbon */}
        <div className="grid grid-cols-5 gap-1 text-[10px] font-mono font-bold">
          <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-center truncate">
            1. Launch
          </div>
          <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-center truncate">
            2. Insertion
          </div>
          <div className="p-1.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-sky-300 text-center truncate">
            3. Science Ops
          </div>
          <div className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-center truncate">
            4. Downlink
          </div>
          <div className="p-1.5 rounded-lg bg-orange-950/40 border border-orange-500/30 text-orange-300 text-center truncate">
            5. Closeout
          </div>
        </div>
      </div>

      {/* Horizontal Timeline Ribbon with Event Markers */}
      <div className="relative py-4 overflow-x-auto pb-4">
        {/* Horizontal Connecting Guideline */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-emerald-500 via-[#38BDF8] to-rift-orange opacity-40 -translate-y-1/2" />

        <div className="flex items-center space-x-4 sm:space-x-6 min-w-max px-4">
          {filteredEvents.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeEvent?.id === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedEventId(item.id)}
                className={`relative flex flex-col items-center group transition-transform ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                {/* Event Marker Node */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                    item.colorClass
                  } ${
                    isSelected
                      ? 'ring-4 ring-rift-orange shadow-[0_0_18px_rgba(255,90,31,0.6)]'
                      : 'shadow-md group-hover:border-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Day / Turn Label */}
                <span
                  className={`mt-2 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-rift-orange text-white border-rift-orange'
                      : 'bg-[#0A1228] text-slate-300 border-[rgba(148,163,184,0.2)]'
                  }`}
                >
                  Day {item.raw.day}
                </span>

                {/* Short Title on Marker */}
                <span className="text-[11px] font-mono text-slate-400 max-w-[100px] truncate text-center mt-1">
                  {item.raw.title.split(':')[0] || item.raw.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Event Detail Inspection Card */}
      {activeEvent && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#070E24] border border-[rgba(148,163,184,0.18)] shadow-inner space-y-2 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[rgba(148,163,184,0.12)]">
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-2 rounded-xl border ${activeEvent.colorClass} shrink-0`}
              >
                <activeEvent.icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider block">
                  {activeEvent.phase} &bull; DAY {activeEvent.raw.day} (TURN {activeEvent.raw.turn})
                </span>
                <h4 className="text-sm sm:text-base font-black text-white font-mono">
                  {activeEvent.raw.title}
                </h4>
              </div>
            </div>

            <Badge variant={activeEvent.badgeVariant}>
              {activeEvent.categoryLabel.toUpperCase()}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans pt-1">
            {activeEvent.raw.details}
          </p>
        </div>
      )}
    </Panel>
  );
}
