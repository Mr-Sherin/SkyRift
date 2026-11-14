'use client';

import React from 'react';
import Link from 'next/link';
import { Rocket, Zap, Radio, ArrowRight, Compass, CheckCircle2, ExternalLink } from 'lucide-react';
import { SpacecraftStation3D } from '@/components/visualizer/SpacecraftStation3D';
import { sfx } from '@/lib/audio';
import { Panel, SectionLabel } from '@/components/ui';

export default function LearnPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-[rgba(148,163,184,0.14)] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <SectionLabel color="orange">HOW TO PLAY // ORBITAL ENGINEERING</SectionLabel>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F1F5F9] font-mono tracking-tight mt-1">
            THE PHYSICS BEHIND SKYRIFT
          </h1>
          <p className="mt-1.5 text-sm text-[#94A3B8] max-w-2xl">
            Every part you add affects weight, fuel, power, and communication speed. Here are the three core rules powering your spacecraft design.
          </p>
        </div>

        <Link
          href="/missions"
          onClick={() => sfx.playClick()}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E64C0E] text-white text-xs font-mono font-bold transition-all shadow-[0_0_18px_rgba(255,90,31,0.4)] shrink-0 self-start active:scale-95"
        >
          <span>CHOOSE A MISSION</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Top Row: Quick Loop + 3D Station Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <Panel variant="default" padding="md" className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#FF5A1F] text-xs font-mono font-bold uppercase mb-4">
              <Compass className="w-4 h-4" />
              <span>HOW A MISSION WORKS</span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3.5">
                <span className="w-6 h-6 rounded-full bg-[#FF5A1F]/20 border border-[#FF5A1F]/40 text-[#FF5A1F] font-mono font-black text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <div className="font-bold text-[#F1F5F9]">Pick a Target Orbit</div>
                  <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
                    Start with Earth LEO or challenge yourself with the Moon, Mars, or Asteroid Bennu.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <span className="w-6 h-6 rounded-full bg-[#FF5A1F]/20 border border-[#FF5A1F]/40 text-[#FF5A1F] font-mono font-black text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <div className="font-bold text-[#F1F5F9]">Build Your Spacecraft</div>
                  <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
                    Install required subsystems in the Hangar while staying within power, mass, and Δv targets.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <span className="w-6 h-6 rounded-full bg-[#FF5A1F]/20 border border-[#FF5A1F]/40 text-[#FF5A1F] font-mono font-black text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <div className="font-bold text-[#F1F5F9]">Match a Rocket &amp; Launch</div>
                  <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
                    Pick a booster strong enough to lift your total mass, pass Preflight, and manage orbital anomalies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[rgba(148,163,184,0.14)] flex items-center space-x-2 text-xs text-emerald-400 font-mono font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Tip: Aim for 75+ / 100 points in the final debrief for mission success.</span>
          </div>
        </Panel>

        <Panel variant="default" padding="md" className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-[#FF5A1F] uppercase">
              3D ORBITAL STATION MODEL (DRAG TO ROTATE)
            </span>
            <span className="text-[11px] font-mono text-[#94A3B8]">SPIN GRAVITY HABITAT</span>
          </div>
          <div className="h-[230px] w-full rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.16)] overflow-hidden">
            <SpacecraftStation3D centered className="w-full h-full" />
          </div>
          <p className="text-xs text-[#94A3B8] mt-3 leading-relaxed">
            Counter-rotating rings generate artificial centrifugal gravity (<span className="font-mono font-semibold text-[#F1F5F9]">a = ω² · r</span>) to keep astronauts healthy on multi-year deep-space voyages.
          </p>
        </Panel>
      </div>

      {/* Bottom Row: 3 Core Physics Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Rocket Equation */}
        <Panel variant="default" padding="md" className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2.5 text-[#F1F5F9] mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 flex items-center justify-center text-[#FF5A1F]">
                <Rocket className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black font-mono uppercase">1. Rocket Equation (Δv)</h2>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Every extra kilogram of sensors lowers your fuel-to-weight ratio. Lighter payloads and higher-efficiency engines unlock farther destinations.
            </p>
            <div className="my-3 p-3 rounded-xl bg-[#070E24] text-center font-mono font-bold text-xs text-[#FF5A1F] border border-[rgba(148,163,184,0.16)] shadow-inner">
              Δv = Isp × g₀ × ln(m₀ / mf)
            </div>
          </div>
          <div className="space-y-1 text-[11px] font-mono text-[#94A3B8] border-t border-[rgba(148,163,184,0.14)] pt-3">
            <div><b className="text-[#F1F5F9]">Isp:</b> Engine efficiency (~325s chemical vs 3,800s ion)</div>
            <div><b className="text-[#F1F5F9]">m₀ / mf:</b> Full fueled weight ÷ dry empty weight</div>
          </div>
        </Panel>

        {/* 2. Solar Inverse Square */}
        <Panel variant="default" padding="md" className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2.5 text-[#F1F5F9] mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black font-mono uppercase">2. Sunlight Drop-Off (1/r²)</h2>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Sunlight spreads outward in a sphere, dropping sharply with distance from the Sun. Solar panels lose power fast beyond Earth.
            </p>
            <div className="my-3 p-3 rounded-xl bg-[#070E24] text-center font-mono font-bold text-xs text-amber-400 border border-[rgba(148,163,184,0.16)] shadow-inner">
              Power(r) = Power₁AU / r²
            </div>
          </div>
          <div className="space-y-1 text-[11px] font-mono text-[#94A3B8] border-t border-[rgba(148,163,184,0.14)] pt-3">
            <div><b className="text-[#F1F5F9]">Mars (1.52 AU):</b> Only 43% of Earth solar power</div>
            <div><b className="text-[#F1F5F9]">Bennu (0.90 to 1.36 AU):</b> 54% to 123% solar power (54% at 1.36 AU aphelion) — size arrays for aphelion or use RTG!</div>
          </div>
        </Panel>

        {/* 3. Comms Latency */}
        <Panel variant="default" padding="md" className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2.5 text-[#F1F5F9] mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Radio className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black font-mono uppercase">3. Signal Delay &amp; DSN</h2>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Radio signals travel at light speed (<span className="font-mono">c</span>). Deep-space probes communicate via the{' '}
              <a
                href="https://eyes.nasa.gov/dsn/dsn.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline hover:text-sky-300 font-bold"
              >
                NASA Deep Space Network (DSN)
              </a>{' '}
              and must buffer data onboard until contact windows open.
            </p>
            <div className="my-3 p-3 rounded-xl bg-[#070E24] text-center font-mono font-bold text-xs text-sky-400 border border-[rgba(148,163,184,0.16)] shadow-inner">
              Delay = Distance / c
            </div>
          </div>
          <div className="space-y-1 text-[11px] font-mono text-[#94A3B8] border-t border-[rgba(148,163,184,0.14)] pt-3">
            <div><b className="text-[#F1F5F9]">Earth to Moon:</b> ~1.3 seconds one-way</div>
            <div><b className="text-[#F1F5F9]">Earth to Mars:</b> 3 to 22 minutes one-way &bull; <span className="text-slate-500">SKY RIFT educational note</span></div>
          </div>
        </Panel>
      </div>

      {/* Explore Further Panel (NASA Interactive Links) */}
      <Panel variant="elevated" className="p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(148,163,184,0.18)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 text-[#FF5A1F]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider">
                EXTERNAL MISSION EXPLORATION
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white font-mono tracking-tight mt-0.5">
                Explore Further with Real NASA Tools
              </h2>
            </div>
          </div>

          <Link
            href="/sources"
            onClick={() => sfx.playClick()}
            className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-[#38BDF8] hover:text-white transition-colors"
          >
            <span>View All Formulas &amp; Citations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Deepen your aerospace engineering knowledge with these official NASA learning tools, interactive visualizations, and mission design handbooks:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: NASA Eyes */}
          <a
            href="https://eyes.nasa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.16)] hover:border-rift-orange/50 hover:bg-[#0C1635] flex flex-col justify-between space-y-3 transition-all group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#0A1228] border border-[rgba(148,163,184,0.2)] text-[#38BDF8]">
                  REAL-TIME 3D
                </span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#38BDF8]" />
              </div>
              <h3 className="text-sm font-black text-white font-mono group-hover:text-rift-orange transition-colors">
                NASA Mission Viz (Eyes on the Solar System)
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Fly alongside active planetary probes, track asteroids, and visualize authentic orbital trajectories across the Solar System in real time.
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#38BDF8] flex items-center space-x-1 pt-2 border-t border-[rgba(148,163,184,0.1)]">
              <span>Launch Eyes on the Web</span>
              <span>&rarr;</span>
            </div>
          </a>

          {/* Card 2: Webb Build It Yourself */}
          <a
            href="https://webbtelescope.org/resource-gallery/learning-resources/build-it-yourself-satellite"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.16)] hover:border-rift-orange/50 hover:bg-[#0C1635] flex flex-col justify-between space-y-3 transition-all group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#0A1228] border border-[rgba(148,163,184,0.2)] text-amber-400">
                  INTERACTIVE LAB
                </span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-amber-400" />
              </div>
              <h3 className="text-sm font-black text-white font-mono group-hover:text-rift-orange transition-colors">
                Webb: Build It Yourself: Satellite!
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Explore how engineers balance scientific requirements, instrument suites, and mission budgets to assemble space telescopes like Hubble and Webb.
              </p>
            </div>
            <div className="text-[11px] font-mono text-amber-400 flex items-center space-x-1 pt-2 border-t border-[rgba(148,163,184,0.1)]">
              <span>Play Satellite Game</span>
              <span>&rarr;</span>
            </div>
          </a>

          {/* Card 3: CubeSat 101 */}
          <a
            href="https://www.nasa.gov/reference/cubesat-101-basic-concepts-and-processes-for-first-time-cubesat-developers/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.16)] hover:border-rift-orange/50 hover:bg-[#0C1635] flex flex-col justify-between space-y-3 transition-all group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#0A1228] border border-[rgba(148,163,184,0.2)] text-emerald-400">
                  NASA HANDBOOK
                </span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-emerald-400" />
              </div>
              <h3 className="text-sm font-black text-white font-mono group-hover:text-rift-orange transition-colors">
                CubeSat 101 Developer Handbook
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                NASA’s comprehensive primer covering small satellite mission design, thermal/power management, orbital debris mitigation, and flight licensing.
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1 pt-2 border-t border-[rgba(148,163,184,0.1)]">
              <span>Read Handbook</span>
              <span>&rarr;</span>
            </div>
          </a>
        </div>
      </Panel>
    </div>
  );
}
