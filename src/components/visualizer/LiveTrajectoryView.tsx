'use client';

import React from 'react';
import { MissionScenario } from '@/game/types';
import { Radio, Compass, Zap, Satellite, Globe2, Moon, Eye } from 'lucide-react';

interface LiveTrajectoryViewProps {
  mission: MissionScenario;
  turn: number;
  totalTurns: number;
  currentDay: number;
  totalDays: number;
  downlinkedGb: number;
  isSafeMode?: boolean;
}

export function LiveTrajectoryView({
  mission,
  turn,
  totalTurns,
  currentDay,
  totalDays,
  downlinkedGb,
  isSafeMode,
}: LiveTrajectoryViewProps) {
  // Parametric progress 0.0 to 1.0 along orbital trajectory
  const rawProgress = Math.max(0, Math.min(1, (turn - 1) / Math.max(1, totalTurns - 1)));

  // SVG coordinate dimensions
  const width = 900;
  const height = 240;

  // Earth coordinates (left)
  const earthX = 110;
  const earthY = 120;
  const earthRadius = 38;

  // Target body coordinates (right)
  const targetX = 790;
  const targetY = 120;
  let targetRadius = 30;

  if (mission.destination === 'moon') targetRadius = 24;
  else if (mission.destination === 'mars') targetRadius = 32;
  else if (mission.destination === 'asteroid') targetRadius = 22;

  // Bezier trajectory control points: P0 (Earth), P1 (Deep Space Apex), P2 (Target)
  // An authentic Hohmann-style elliptic transfer arcs upward or loops according to destination
  const isEarthOrbit = mission.destination === 'earth';
  const controlX = isEarthOrbit ? 450 : 450;
  const controlY = isEarthOrbit ? 20 : 35; // Apex arc height

  // Cubic Bezier interpolation: B(t) for P0(110,120), P1(320, 25), P2(580, 25), P3(790, 120)
  const p0 = { x: earthX, y: earthY };
  const p1 = { x: 340, y: isEarthOrbit ? 30 : 25 };
  const p2 = { x: 560, y: isEarthOrbit ? 30 : 25 };
  const p3 = { x: targetX, y: targetY };

  // Calculate position along cubic Bezier
  const t = rawProgress;
  const u = 1 - t;
  const craftX =
    u * u * u * p0.x +
    3 * u * u * t * p1.x +
    3 * u * t * t * p2.x +
    t * t * t * p3.x;
  const craftY =
    u * u * u * p0.y +
    3 * u * u * t * p1.y +
    3 * u * t * t * p2.y +
    t * t * t * p3.y;

  // Tangent angle for spacecraft orientation
  const dx =
    3 * u * u * (p1.x - p0.x) +
    6 * u * t * (p2.x - p1.x) +
    3 * t * t * (p3.x - p2.x);
  const dy =
    3 * u * u * (p1.y - p0.y) +
    6 * u * t * (p2.y - p1.y) +
    3 * t * t * (p3.y - p2.y);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Trajectory SVG Path string
  const trajectoryD = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  // Current flight phase label
  const flightPhaseLabel =
    t === 0
      ? 'TRANSLUNAR / INTERPLANETARY INJECTION'
      : t < 0.35
      ? 'DEEP SPACE OUTBOUND CRUISE'
      : t < 0.75
      ? 'MID-COURSE TRAJECTORY FINE-TUNING'
      : t < 0.95
      ? 'TARGET APPROACH & CAPTURE RECON'
      : 'FINAL ORBITAL INSERTION & SURVEY';

  // Computed velocity estimation
  const estVelocity = isEarthOrbit
    ? 7.6
    : mission.destination === 'moon'
    ? (1.08 + (1 - t) * 9.2).toFixed(1)
    : (18.5 + (1 - t) * 12.0).toFixed(1);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-rift-line shadow-hud mb-5 relative overflow-hidden select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rift-line gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider">
            ORBITAL DYNAMICS // LIVE TRAJECTORY PLOTTER
          </div>
          <span className="text-rift-lineDark hidden sm:inline">&bull;</span>
          <span className="text-xs font-mono font-bold text-rift-slate uppercase">
            {flightPhaseLabel}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5 text-rift-muted">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>DSN LINK: <b>NOMINAL</b></span>
          </div>
          <div className="text-rift-lineDark">&bull;</div>
          <div className="text-rift-slate">
            VELOCITY: <b className="text-rift-text">{estVelocity} km/s</b>
          </div>
        </div>
      </div>

      {/* SVG Canvas Trajectory Map */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 bg-slate-950 rounded-xl border border-slate-800 shadow-inner"
        >
          {/* Subtle Deep Space Star Background */}
          <g opacity="0.6">
            <circle cx="65" cy="35" r="1" fill="#FFFFFF" opacity="0.8" />
            <circle cx="160" cy="70" r="1.2" fill="#FFFFFF" opacity="0.5" />
            <circle cx="280" cy="180" r="1" fill="#93C5FD" opacity="0.9" />
            <circle cx="410" cy="85" r="1.5" fill="#FFFFFF" opacity="0.7" />
            <circle cx="520" cy="190" r="0.8" fill="#FFFFFF" opacity="0.4" />
            <circle cx="640" cy="45" r="1.2" fill="#FED7AA" opacity="0.8" />
            <circle cx="710" cy="160" r="1" fill="#FFFFFF" opacity="0.6" />
            <circle cx="840" cy="60" r="1.5" fill="#FFFFFF" opacity="0.9" />
          </g>

          {/* Solar Flux Rays from Top Center */}
          <g opacity="0.18">
            <line x1="450" y1="0" x2="110" y2="120" stroke="#FDE047" strokeWidth="1" strokeDasharray="4 6" />
            <line x1="450" y1="0" x2="790" y2="120" stroke="#FDE047" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="450" cy="0" r="28" fill="#FDE047" opacity="0.3" />
            <circle cx="450" cy="0" r="14" fill="#FEF08A" />
            <text x="450" y="24" fontSize="8" fill="#FEF08A" textAnchor="middle" fontFamily="monospace">
              SOLAR FLUX (1.0 AU)
            </text>
          </g>

          {/* DSN Radio Link Beam from Earth to Spacecraft */}
          <line
            x1={earthX}
            y1={earthY}
            x2={craftX}
            y2={craftY}
            stroke="#10B981"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.6"
          />

          {/* Full Planned Trajectory Path (Dashed) */}
          <path
            d={trajectoryD}
            fill="none"
            stroke="#334155"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />

          {/* Completed Segment of Trajectory (Solid Orange Gradient) */}
          <path
            d={trajectoryD}
            fill="none"
            stroke="#FF5E1E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset={1000 * (1 - rawProgress)}
          />

          {/* ===================================================================
              EARTH (Left Body)
             =================================================================== */}
          <g>
            {/* Atmosphere Glow */}
            <circle cx={earthX} cy={earthY} r={earthRadius + 6} fill="#0284C7" opacity="0.15" />
            <circle cx={earthX} cy={earthY} r={earthRadius} fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
            {/* Continental landmass silhouettes */}
            <path
              d={`M ${earthX - 18} ${earthY - 10} q 8 -12 18 -4 q 10 8 6 18 q -8 10 -16 6 q -12 -6 -8 -20 Z`}
              fill="#10B981"
              opacity="0.8"
            />
            <path
              d={`M ${earthX + 2} ${earthY + 6} q 10 -4 14 6 q 2 10 -8 10 q -8 -2 -6 -16 Z`}
              fill="#059669"
              opacity="0.7"
            />
            {/* Cloud swirls */}
            <ellipse cx={earthX - 4} cy={earthY - 14} rx="16" ry="3" fill="#FFFFFF" opacity="0.4" />
            <ellipse cx={earthX + 6} cy={earthY + 12} rx="14" ry="2.5" fill="#FFFFFF" opacity="0.35" />

            {/* Earth Label */}
            <text
              x={earthX}
              y={earthY + earthRadius + 18}
              fontSize="10"
              fontWeight="bold"
              fill="#E2E8F0"
              textAnchor="middle"
              fontFamily="monospace"
            >
              EARTH (1.0 AU)
            </text>
            <text
              x={earthX}
              y={earthY + earthRadius + 29}
              fontSize="8"
              fill="#94A3B8"
              textAnchor="middle"
              fontFamily="monospace"
            >
              DSN GOLDSTONE / MADRID
            </text>
          </g>

          {/* ===================================================================
              TARGET BODY (Right Body)
             =================================================================== */}
          <g>
            {mission.destination === 'moon' && (
              <>
                <circle cx={targetX} cy={targetY} r={targetRadius + 4} fill="#94A3B8" opacity="0.12" />
                <circle cx={targetX} cy={targetY} r={targetRadius} fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
                {/* Lunar Craters */}
                <circle cx={targetX - 7} cy={targetY - 5} r="4.5" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.8" />
                <circle cx={targetX + 8} cy={targetY + 6} r="3.5" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.8" />
                <circle cx={targetX + 2} cy={targetY - 9} r="2" fill="#94A3B8" />
                <circle cx={targetX - 8} cy={targetY + 9} r="2.8" fill="#94A3B8" />
              </>
            )}

            {mission.destination === 'mars' && (
              <>
                <circle cx={targetX} cy={targetY} r={targetRadius + 6} fill="#EA580C" opacity="0.18" />
                <circle cx={targetX} cy={targetY} r={targetRadius} fill="#EA580C" stroke="#F97316" strokeWidth="2" />
                {/* Polar Ice Cap */}
                <ellipse cx={targetX} cy={targetY - targetRadius + 4} rx="10" ry="3" fill="#FFFFFF" opacity="0.9" />
                {/* Surface Albedo details */}
                <path
                  d={`M ${targetX - 14} ${targetY + 2} q 12 -6 24 2 q 4 8 -10 8 q -12 2 -14 -10 Z`}
                  fill="#9A3412"
                  opacity="0.8"
                />
              </>
            )}

            {mission.destination === 'asteroid' && (
              <>
                <circle cx={targetX} cy={targetY} r={targetRadius + 4} fill="#64748B" opacity="0.12" />
                <polygon
                  points={`${targetX - 18},${targetY - 12} ${targetX + 2},${targetY - 20} ${targetX + 18},${targetY - 8} ${targetX + 22},${targetY + 12} ${targetX + 6},${targetY + 22} ${targetX - 16},${targetY + 14} ${targetX - 22},${targetY - 2}`}
                  fill="#475569"
                  stroke="#94A3B8"
                  strokeWidth="2"
                />
                <circle cx={targetX - 4} cy={targetY - 2} r="3" fill="#334155" />
                <circle cx={targetX + 8} cy={targetY + 6} r="2.5" fill="#334155" />
              </>
            )}

            {mission.destination === 'earth' && (
              <>
                {/* Low Earth Orbit Shell */}
                <circle cx={targetX} cy={targetY} r={targetRadius + 12} fill="none" stroke="#FF5E1E" strokeWidth="1.2" strokeDasharray="3 3" />
                <circle cx={targetX} cy={targetY} r={targetRadius} fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
                <path
                  d={`M ${targetX - 10} ${targetY - 6} q 6 -8 14 -2 q 8 6 4 12 q -6 6 -12 4 Z`}
                  fill="#10B981"
                  opacity="0.8"
                />
              </>
            )}

            {/* Target Label */}
            <text
              x={targetX}
              y={targetY + targetRadius + 18}
              fontSize="10"
              fontWeight="bold"
              fill="#E2E8F0"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {mission.destinationName.toUpperCase()}
            </text>
            <text
              x={targetX}
              y={targetY + targetRadius + 29}
              fontSize="8"
              fill="#94A3B8"
              textAnchor="middle"
              fontFamily="monospace"
            >
              TARGET INSERTION ZONE
            </text>
          </g>

          {/* ===================================================================
              SPACECRAFT AT CURRENT PROGRESS POSITION
             =================================================================== */}
          <g transform={`translate(${craftX}, ${craftY}) rotate(${angleDeg})`}>
            {/* Engine Exhaust Flame (when not in safe mode) */}
            {!isSafeMode && (
              <polygon
                points="-18,-3 -28,0 -18,3 -16,0"
                fill="#38BDF8"
                opacity="0.85"
              />
            )}

            {/* Outer Signal Beacon Pulse */}
            <circle cx="0" cy="0" r="16" fill="none" stroke="#FF5E1E" strokeWidth="1" opacity="0.4">
              <animate attributeName="r" values="8;20" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="1.8s" repeatCount="indefinite" />
            </circle>

            {/* Spacecraft Bus Chassis (Gold Foil) */}
            <rect x="-8" y="-7" width="16" height="14" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2" />

            {/* Blue Solar Array Wings */}
            <rect x="-6" y="-22" width="12" height="13" rx="1.5" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
            <rect x="-6" y="9" width="12" height="13" rx="1.5" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />

            {/* Solar Panel Cells */}
            <line x1="-6" y1="-15" x2="6" y2="-15" stroke="#BAE6FD" strokeWidth="0.8" />
            <line x1="-6" y1="15" x2="6" y2="15" stroke="#BAE6FD" strokeWidth="0.8" />

            {/* Parabolic Dish Antenna */}
            <circle cx="7" cy="0" r="4.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
            <line x1="7" y1="0" x2="11" y2="0" stroke="#FF5E1E" strokeWidth="1.2" />
          </g>

          {/* Floating Craft Status Tag Box */}
          <g transform={`translate(${Math.max(60, Math.min(width - 160, craftX - 45))}, ${Math.max(15, craftY - 45)})`}>
            <rect
              x="0"
              y="0"
              width="95"
              height="28"
              rx="6"
              fill="#0F172A"
              stroke="#FF5E1E"
              strokeWidth="1.2"
              opacity="0.95"
            />
            <text x="7" y="11" fontSize="8" fill="#F8FAFC" fontWeight="bold" fontFamily="monospace">
              SPACECRAFT // T+{turn}
            </text>
            <text x="7" y="21" fontSize="7" fill="#94A3B8" fontFamily="monospace">
              DAY {currentDay} &bull; {Math.round(rawProgress * 100)}% ORBIT
            </text>
          </g>
        </svg>
      </div>

      {/* Trajectory Legend Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[10px] font-mono text-rift-muted gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-[#FF5E1E] rounded-full block" />
            <span>Completed Path</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-slate-400 block" />
            <span>Planned Transfer Curve</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-500 rounded-full block" />
            <span>DSN Telemetry Link</span>
          </div>
        </div>

        <div className="text-rift-slate font-bold">
          TOTAL DOWNLINKED: <b className="text-rift-text">{downlinkedGb} GB</b>
        </div>
      </div>
    </div>
  );
}

