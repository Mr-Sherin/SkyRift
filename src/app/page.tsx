'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Play,
  RotateCcw,
  Settings,
  Trophy,
  BookOpen,
  Rocket,
  ChevronRight,
  Volume2,
  VolumeX,
  X,
  Users,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Music2,
  Flame,
  Repeat,
  Disc3,
  Pause,
  Radio,
  Calendar,
  Award,
  Lock,
} from 'lucide-react';
import { useGame } from '@/game/engine/GameContext';
import { useTeam } from '@/game/team/TeamContext';
import { TEAM_ROLES } from '@/game/team/teamTypes';
import { TeamModal } from '@/components/team/TeamModal';
import { TeamErrorBoundary } from '@/components/team/TeamErrorBoundary';
import { runPreflightDiagnostics } from '@/game/physics/budgetEngine';
import { sfx } from '@/lib/audio';
import {
  music,
  MusicLoopMode,
  MusicStateSnapshot,
  SOUNDTRACK_TRACKS,
} from '@/lib/music';
import { getDailyChallenge, isDailyChallengeCompleted } from '@/data/dailyChallenge';
import { isMissionUnlocked, MISSION_ORDER } from '@/data/campaign';
import { getUnlockedAchievements, ACHIEVEMENTS } from '@/data/achievements';
import { AchievementGallery } from '@/components/achievements/AchievementGallery';
import { isStoryEnabled, setStoryEnabled, CHARACTERS, StorySpeaker } from '@/data/story';
import { PORTRAIT_CONFIG } from '@/components/story/DialogueBox';
import { IntroCutscene } from '@/components/IntroCutscene';

const CREW_ROLES = [
  { id: 'commander' as const, label: 'Commander' },
  { id: 'engineer' as const, label: 'Systems Eng' },
  { id: 'science' as const, label: 'Science Lead' },
  { id: 'flightOps' as const, label: 'Flight Ops' },
];

let initialNarrationShown = false;

export default function LandingPage() {
  const {
    activeScenario,
    selectScenario,
    selectedComponents,
    selectedLauncher,
    budgets,
    activeRole,
    setActiveRole,
    loadPresetNominal,
    resetSpacecraft,
  } = useGame();

  const { gameMode, roomCode, myRole, myRoleInfo } = useTeam();

  const [hasHydrated, setHasHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamInitialTab, setTeamInitialTab] = useState<'create' | 'join'>('create');
  const [teamPopoverOpen, setTeamPopoverOpen] = useState(false);
  const teamMenuRef = useRef<HTMLDivElement>(null);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const [storyActive, setStoryActive] = useState<boolean>(() => isStoryEnabled());
  const [musicSnap, setMusicSnap] = useState<MusicStateSnapshot>(() => music.getSnapshot());
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; missionName: string; score: number; tier: string; date: string }>>([]);
  const [showIntro, setShowIntro] = useState<boolean>(() => !initialNarrationShown);

  const daily = getDailyChallenge();
  const dailyDone = hasHydrated ? isDailyChallengeCompleted(daily.dateString) : false;
  const isDailyUnlocked = hasHydrated ? isMissionUnlocked(daily.mission.id) : (daily.mission.id === 'mission-earth-obs');
  const dailyMissionIndex = MISSION_ORDER.indexOf(daily.mission.id);

  useEffect(() => {
    setHasHydrated(true);
    initialNarrationShown = true;
    try {
      localStorage.removeItem('introSeen');
      localStorage.removeItem('skyrift_intro_seen');
      sessionStorage.removeItem('skyrift_session_intro_shown');

      const raw = localStorage.getItem('skyrift_leaderboard_v1');
      if (raw) {
        setLeaderboard(JSON.parse(raw).slice(0, 3));
      }
      setUnlockedCount(Object.keys(getUnlockedAchievements()).length);

      // Check URL for explicit replay intro trigger
      const searchParams = new URLSearchParams(window.location.search);
      const forceReplay = searchParams.get('replayIntro') === 'true' || searchParams.get('intro') === '1';
      if (forceReplay) {
        setShowIntro(true);
      }
    } catch {
      // ignore
    }
    return music.subscribe((snap) => {
      setMusicSnap(snap);
      setMuted(snap.isMuted || sfx.getMuted());
    });
  }, []);

  const handleIntroComplete = () => {
    initialNarrationShown = true;
    try {
      if (typeof window !== 'undefined' && window.location.search) {
        const url = new URL(window.location.href);
        if (url.searchParams.has('replayIntro') || url.searchParams.has('intro')) {
          url.searchParams.delete('replayIntro');
          url.searchParams.delete('intro');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      }
    } catch {
      // ignore
    }
    setShowIntro(false);
  };

  useEffect(() => {
    if (!settingsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen]);

  useEffect(() => {
    if (!teamPopoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (teamMenuRef.current && !teamMenuRef.current.contains(e.target as Node)) {
        setTeamPopoverOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTeamPopoverOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [teamPopoverOpen]);

  const diagnostics = runPreflightDiagnostics(
    selectedComponents,
    activeScenario,
    selectedLauncher,
    budgets
  );
  const errorCount = diagnostics.filter((d) => d.type === 'error').length;
  const hasCraft = selectedComponents.length > 0;
  const isReady = hasHydrated && errorCount === 0 && hasCraft;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setParallax({ x: -nx * 7, y: -ny * 5 });
  };

  const handleMouseLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  const handleToggleSound = () => {
    const nextMuted = sfx.toggleMute();
    music.setMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) sfx.playClick();
  };

  const handleToggleStory = () => {
    const next = !storyActive;
    setStoryEnabled(next);
    setStoryActive(next);
    sfx.playClick();
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[calc(100vh-64px)] bg-[#050A1C] overflow-hidden flex flex-col justify-between select-none"
    >
      {/* =========================================================================
          FULL-BLEED ORBITAL SCENE BACKGROUND (LIGHTENED FOR STATION & ASTRONAUT)
         ========================================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[#050A1C]"
      >
        <img
          src="/images/skyrift_hero_clean.jpg"
          alt=""
          style={{
            transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.02)`,
            transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="w-full h-full object-cover object-[75%_center] lg:object-right-bottom opacity-75 sm:opacity-85 filter brightness-105 contrast-110"
        />

        {/* Soft left-side gradient keeping menu typography readable while leaving station & astronaut crisp on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050A1C] via-[#050A1C]/85 sm:via-[#050A1C]/65 to-transparent" />
        {/* Soft top & bottom fades for seamless header and HUD bar integration */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050A1C]/75 to-transparent" />
        {/* Bottom Atmospheric Fade */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#050A1C]/85 to-transparent" />
      </div>

      {/* =========================================================================
          SUBTLE TOP-RIGHT LIVE TELEMETRY PILL (Hidden until player has a craft)
         ========================================================================= */}
      {hasCraft && (
        <div className="relative z-10 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-12 pt-5 flex justify-end">
          <Link
            href="/preflight"
            onClick={() => sfx.playClick()}
            className="hidden md:inline-flex items-center space-x-3 px-4 py-1.5 rounded-full bg-[#0A1228]/95 hover:bg-[#101C3D] backdrop-blur-md border border-[rgba(148,163,184,0.22)] hover:border-[#FF5A1F] shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all text-xs font-mono"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !hasHydrated
                  ? 'bg-slate-500'
                  : isReady
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]'
                  : 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
              }`}
            />
            <span className="font-bold text-[#F1F5F9] uppercase tracking-wider">
              {activeScenario.name}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[#94A3B8]">
              {hasHydrated
                ? `Δv ${budgets.availableDeltaVMs.toLocaleString()} / ${budgets.requiredDeltaVMs.toLocaleString()} m/s`
                : 'SYNCING TELEMETRY'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                !hasHydrated
                  ? 'bg-slate-800 text-slate-400'
                  : isReady
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              }`}
            >
              {!hasHydrated ? '...' : isReady ? 'GO' : `${errorCount} ALERT${errorCount === 1 ? '' : 'S'}`}
            </span>
          </Link>
        </div>
      )}

      {/* =========================================================================
          MAIN TITLE & CHAMFERED MENU COLUMN
         ========================================================================= */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-12 my-auto py-4 sm:py-6">
        <div className="w-full max-w-[420px]">
          {/* Title Lockup with Official Brand Logo */}
          <div className="inline-block">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-pulse" />
              <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.38em] text-[#FF5A1F] uppercase drop-shadow-[0_0_12px_rgba(255,90,31,0.35)]">
                A NEW FRONTIER AWAITS
              </p>
            </div>

            <div className="relative">
              <img
                src="/images/skyrift_logo.png"
                alt="SKY RIFT"
                className="w-60 sm:w-72 lg:w-80 h-auto object-contain drop-shadow-[0_12px_36px_rgba(255,90,31,0.45)] hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          </div>

          {/* Signature Hairline Divider with Orange 4-Point Star */}
          <div className="mt-3.5 mb-5 flex items-center space-x-3 max-w-[380px]">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-slate-700" />
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-[#FF5A1F] shrink-0 drop-shadow-[0_0_10px_#FF5A1F]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 1L14.6 9.4L23 12L14.6 14.6L12 23L9.4 14.6L1 12L9.4 9.4L12 1Z" />
            </svg>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700 via-slate-600 to-transparent" />
          </div>

          {/* Interactive Chamfered Button Stack */}
          <nav aria-label="Main Game Menu" className="w-full max-w-[380px] space-y-2.5">
            {/* 1. PLAY (The ONLY Primary Orange Action on this screen) */}
            <Link
              href="/missions"
              onClick={() => {
                sfx.playClick();
                music.ensurePlaying();
              }}
              className="group clip-chamfer-menu relative flex items-center justify-between w-full h-11 sm:h-12 px-5 bg-[#FF5A1F] hover:bg-[#E64C0E] text-white transition-all duration-150 shadow-[0_10px_24px_-6px_rgba(255,90,31,0.5)] hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] focus:ring-offset-2"
            >
              <div className="flex items-center space-x-3.5">
                <Play className="w-4 h-4 fill-white text-white shrink-0" />
                <span className="text-sm font-semibold tracking-[0.32em] uppercase font-sans">
                  PLAY
                </span>
              </div>

              {/* Signature Dual Diagonal Accent Bars */}
              <div className="flex items-center space-x-1.5 opacity-85 group-hover:opacity-100 transition-opacity">
                <span className="w-1.5 h-4.5 bg-white/40 -skew-x-[24deg] block" />
                <span className="w-1.5 h-4.5 bg-white/40 -skew-x-[24deg] block" />
                <ChevronRight className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 2. CONTINUE (Secondary: Quiet outline button) */}
            <Link
              href="/hangar"
              onClick={() => sfx.playClick()}
              className="group block w-full p-[1px] rounded-xl border border-slate-700/80 hover:border-slate-500 bg-[#0A1228]/80 hover:bg-[#0E1836] transition-all duration-150 focus:outline-none"
            >
              <div className="flex items-center justify-between h-10 px-4 text-slate-300 hover:text-white transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors shrink-0" />
                  <span className="text-xs font-mono font-bold tracking-[0.16em] uppercase">
                    CONTINUE
                  </span>
                </div>
                {hasHydrated && (
                  <span className="ml-2 text-xs font-mono text-slate-400 group-hover:text-slate-200 truncate max-w-[140px] uppercase transition-colors">
                    {activeScenario.name}
                  </span>
                )}
              </div>
            </Link>

            {/* 3. ONE ROW FOR: Team Mode, Daily Challenge, and Reports */}
            <div className="grid grid-cols-3 gap-2">
              {/* Team Mode Button */}
              <div className="relative" ref={teamMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setTeamPopoverOpen((prev) => !prev);
                  }}
                  title="Multiplayer room setup"
                  className="w-full h-10 px-2 rounded-xl border border-slate-700/80 hover:border-slate-500 bg-[#0A1228]/80 hover:bg-[#0E1836] text-slate-300 hover:text-white transition-all flex items-center justify-center space-x-1.5 text-xs font-mono font-bold"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">TEAM</span>
                </button>

                {/* Popover Menu for Create Room / Join with Code */}
                {teamPopoverOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-64 bg-[#0A1228] backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl p-2 z-50 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setTeamPopoverOpen(false);
                        setTeamInitialTab('create');
                        setTeamModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#0E1836] text-slate-200 hover:text-white text-xs font-mono font-bold transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="w-3.5 h-3.5 text-rift-orange" />
                        <span>CREATE ROOM</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setTeamPopoverOpen(false);
                        setTeamInitialTab('join');
                        setTeamModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#0E1836] text-slate-200 hover:text-white text-xs font-mono font-bold transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Radio className="w-3.5 h-3.5 text-rift-orange" />
                        <span>JOIN WITH CODE</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Daily Challenge Button */}
              {isDailyUnlocked ? (
                <Link
                  href="/missions"
                  onClick={() => {
                    sfx.playClick();
                    selectScenario(daily.mission.id);
                  }}
                  title={daily.dailyTitle}
                  className="h-10 px-2 rounded-xl border border-slate-700/80 hover:border-slate-500 bg-[#0A1228]/80 hover:bg-[#0E1836] text-slate-300 hover:text-white transition-all flex items-center justify-center space-x-1.5 text-xs font-mono font-bold truncate"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">DAILY</span>
                </Link>
              ) : (
                <div
                  title={`Unlocks at Mission ${dailyMissionIndex}`}
                  className="h-10 px-2 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-500 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 cursor-not-allowed"
                >
                  <Lock className="w-3 h-3" />
                  <span className="truncate">M{dailyMissionIndex}</span>
                </div>
              )}

              {/* Reports Button */}
              <Link
                href="/debrief"
                onClick={() => sfx.playClick()}
                title="Mission flight reports and scores"
                className="h-10 px-2 rounded-xl border border-slate-700/80 hover:border-slate-500 bg-[#0A1228]/80 hover:bg-[#0E1836] text-slate-300 hover:text-white transition-all flex items-center justify-center space-x-1.5 text-xs font-mono font-bold"
              >
                <Trophy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">REPORTS</span>
              </Link>
            </div>
          </nav>

          {/* Compact Readability Caption */}
          <p className="mt-4 max-w-[380px] text-xs font-mono text-[#94A3B8] leading-relaxed">
            Balance coupled mass, <b className="text-[#FF5A1F]">Δv</b>, solar attenuation, and deep-space comms across authentic orbital missions.
          </p>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM TECHNICAL HUD BRACKET BAR
         ========================================================================= */}
      <footer className="relative z-10 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-12 pb-4 pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block w-8 h-[1px] bg-slate-700" />
          <span className="text-xs font-mono font-bold tracking-[0.24em] text-[#94A3B8] uppercase bg-[#0A1228]/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-[rgba(148,163,184,0.18)]">
            SECTOR 01 &nbsp;/&nbsp; ORBITAL FRONTIER
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono font-bold tracking-[0.28em] text-[#94A3B8] uppercase bg-[#0A1228]/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-[rgba(148,163,184,0.18)]">
            EXPLORE &bull; SURVIVE &bull; CONQUER
          </span>
          <div className="hidden sm:block w-8 h-[1px] bg-slate-700" />
        </div>
      </footer>

      {/* =========================================================================
          MISSION CONTROL SETTINGS MODAL
         ========================================================================= */}
      {settingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          onClick={() => setSettingsOpen(false)}
          className="fixed inset-0 z-50 bg-[#050A1C]/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0A1228] border border-[rgba(148,163,184,0.2)] shadow-[0_12px_44px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[rgba(148,163,184,0.16)] bg-[#0D1733] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold text-[#FF5A1F] uppercase tracking-[0.2em]">
                  SYSTEM CONFIGURATION
                </div>
                <h2
                  id="settings-modal-title"
                  className="text-base font-black text-[#F1F5F9] font-mono tracking-wide uppercase"
                >
                  MISSION CONTROL SETTINGS
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setSettingsOpen(false);
                }}
                aria-label="Close settings"
                className="p-1.5 rounded-lg hover:bg-[#0E1836] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* 1. Audio Synthesizer */}
              <div>
                <div className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                  TACTICAL AUDIO SYNTHESIZER
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#070E24]">
                  <div className="flex items-center space-x-2.5">
                    {muted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#FF5A1F]" />
                    )}
                    <span className="text-xs font-mono font-bold text-[#F1F5F9]">
                      {muted ? 'SOUND MUTED' : 'WEB AUDIO ACTIVE'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => sfx.playComponentAttach()}
                      className="px-2.5 py-1 rounded-lg bg-[#0E1836] border border-[rgba(148,163,184,0.2)] hover:border-[#FF5A1F] text-[10px] font-mono font-bold text-[#F1F5F9] transition-colors"
                    >
                      TEST
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                        muted
                          ? 'bg-[#FF5A1F] text-white hover:bg-[#E64C0E]'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {muted ? 'UNMUTE' : 'MUTE'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. NCS High-Moment Soundtrack */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider flex items-center space-x-1.5">
                    <Music2 className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    <span>HIGH-MOMENT SOUNDTRACK</span>
                  </span>
                  <button
                    type="button"
                    data-music-control="true"
                    onClick={() => {
                      sfx.playClick();
                      music.togglePlayPause();
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#FF5A1F] text-white text-[10px] font-mono font-bold hover:bg-[#E64C0E] transition-all shadow-[0_0_10px_rgba(255,90,31,0.35)]"
                  >
                    {musicSnap.isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                    <span>{musicSnap.isPlaying ? 'PAUSE' : 'PLAY'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#070E24] space-y-2.5">
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'peak-mix', label: 'PEAK MIX', icon: Flame },
                        { id: 'peak-single', label: 'LOCK PEAK', icon: Repeat },
                        { id: 'full-track', label: 'FULL SONG', icon: Disc3 },
                      ] as { id: MusicLoopMode; label: string; icon: React.ComponentType<{ className?: string }> }[]
                    ).map((m) => {
                      const Icon = m.icon;
                      const active = musicSnap.loopMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            sfx.playClick();
                            music.setLoopMode(m.id);
                          }}
                          className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg border text-[9px] font-mono font-bold transition-all ${
                            active
                              ? 'bg-[#FF5A1F] text-white border-[#FF5A1F] shadow-[0_0_10px_rgba(255,90,31,0.35)]'
                              : 'bg-[#0E1836] text-[#CBD5E1] border-[rgba(148,163,184,0.18)] hover:border-[#FF5A1F]'
                          }`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1">
                    {SOUNDTRACK_TRACKS.map((t, idx) => {
                      const active = idx === musicSnap.trackIndex;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            sfx.playClick();
                            void music.selectTrack(idx);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between text-[10px] font-mono transition-all ${
                            active
                              ? 'bg-[#15234A] border-[#FF5A1F] text-[#F1F5F9] font-bold shadow-[0_0_12px_rgba(255,90,31,0.2)]'
                              : 'bg-[#0A1228] border-[rgba(148,163,184,0.14)] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[rgba(148,163,184,0.3)]'
                          }`}
                        >
                          <span className="truncate">{t.title}</span>
                          <span className="text-[9px] text-[#FF5A1F] shrink-0 ml-2">{t.vibe}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center space-x-2.5 pt-1">
                    <span className="text-[9px] font-mono text-[#94A3B8] uppercase">VOL</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      aria-label="Music volume"
                      value={Math.round(musicSnap.volume * 100)}
                      onChange={(e) => music.setVolume(Number(e.target.value) / 100)}
                      className="w-full accent-[#FF5A1F]"
                    />
                    <span className="text-[10px] font-mono font-bold text-[#F1F5F9] w-8 text-right">
                      {Math.round(musicSnap.volume * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Crew Station Role */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider">
                    ACTIVE CREW STATION
                  </span>
                  <Link
                    href="/multiplayer"
                    onClick={() => {
                      sfx.playClick();
                      setSettingsOpen(false);
                    }}
                    className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-[#FF5A1F] hover:underline"
                  >
                    <Users className="w-3 h-3" />
                    <span>FULL CREW DECK</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CREW_ROLES.map((role) => {
                    const selected = activeRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setActiveRole(role.id);
                          sfx.playClick();
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                          selected
                            ? 'bg-[#15234A] border-[#FF5A1F] text-[#FF5A1F] shadow-[0_0_12px_rgba(255,90,31,0.25)]'
                            : 'bg-[#0E1836] border-[rgba(148,163,184,0.18)] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[rgba(148,163,184,0.3)]'
                        }`}
                      >
                        {role.label.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Visual Novel Story Narrative Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    <span>VISUAL NOVEL STORY NARRATIVE</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      storyActive
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {storyActive ? 'STORY: ON' : 'STORY: OFF'}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#070E24] flex items-center justify-between">
                  <div className="text-xs text-[#94A3B8] leading-tight max-w-[240px]">
                    Character briefings, mid-mission crises & outcome scenes.
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleStory}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                      storyActive
                        ? 'bg-[#FF5A1F] text-white hover:bg-[#E64C0E] shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {storyActive ? 'DISABLE' : 'ENABLE'}
                  </button>
                </div>
              </div>

              {/* 5. Replay Intro Cutscene */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider flex items-center space-x-1.5">
                    <Play className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    <span>MISSION PROLOGUE CUTSCENE</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#070E24] flex items-center justify-between">
                  <div className="text-xs text-[#94A3B8] leading-tight max-w-[240px]">
                    Re-watch the animated spaceflight prologue and mission control briefing.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setSettingsOpen(false);
                      setShowIntro(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-[#0E1836] border border-[rgba(148,163,184,0.2)] hover:border-[#FF5A1F] text-[#F1F5F9] transition-all flex items-center space-x-1.5 shadow-xs"
                  >
                    <Repeat className="w-3 h-3 text-[#FF5A1F]" />
                    <span>REPLAY INTRO</span>
                  </button>
                </div>
              </div>

              {/* 6. Saved Spacecraft Controls */}
              <div>
                <div className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                  ACTIVE SPACECRAFT DRAFT ({selectedComponents.length} MODULES)
                </div>
                <div className="p-3.5 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#070E24] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#94A3B8]">{activeScenario.name}</span>
                    <span
                      className={`inline-flex items-center space-x-1 font-bold ${
                        isReady ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isReady ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>GO FOR LAUNCH</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{errorCount} DEFICIT{errorCount === 1 ? '' : 'S'}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        loadPresetNominal();
                        sfx.playComponentAttach();
                      }}
                      className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-[#0E1836] border border-[rgba(148,163,184,0.2)] hover:border-[#FF5A1F] text-[11px] font-mono font-bold text-[#FF5A1F] transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>NOMINAL PRESET</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetSpacecraft}
                      className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-[#0E1836] border border-[rgba(148,163,184,0.2)] hover:border-rose-500/50 text-[11px] font-mono font-bold text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>CLEAR CRAFT</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 7. Credits & Third-Party Attributions */}
              <div>
                <div className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                  CREDITS &amp; ATTRIBUTIONS
                </div>
                <div className="p-3.5 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#070E24] space-y-3 text-xs font-mono">
                  {/* Soundtrack Credits */}
                  <div>
                    <div className="text-[10px] font-bold text-[#FF5A1F] uppercase flex items-center space-x-1.5 mb-1">
                      <Music2 className="w-3.5 h-3.5" />
                      <span>SOUNDTRACK // NOCOPYRIGHTSOUNDS (NCS)</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed mb-2">
                      All background music tracks are provided by <b>NoCopyrightSounds (NCS)</b> under their free creator usage policy:
                    </p>
                    <div className="space-y-1.5 pl-2 border-l-2 border-[#FF5A1F]/50 text-[11px]">
                      {SOUNDTRACK_TRACKS.map((track) => (
                        <div key={track.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-[#F1F5F9] gap-0.5">
                          <span className="font-bold">&ldquo;{track.title}&rdquo;</span>
                          <span className="text-[#94A3B8] text-[10px]">{track.artist}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Third-Party Assets */}
                  <div className="pt-2.5 border-t border-[rgba(148,163,184,0.14)]">
                    <div className="text-[10px] font-bold text-[#F1F5F9] uppercase mb-1">
                      ADDITIONAL THIRD-PARTY ASSETS
                    </div>
                    <ul className="text-[10px] text-[#94A3B8] space-y-1 leading-snug">
                      <li>&bull; <b className="text-[#F1F5F9]">NASA Open APIs &amp; Observation Archives:</b> Planetary imagery, real-time metrics, and astronomical facts via images-api.nasa.gov.</li>
                      <li>&bull; <b className="text-[#F1F5F9]">Lucide React:</b> Open-source tactical aerospace iconography and HUD indicators.</li>
                      <li>&bull; <b className="text-[#F1F5F9]">Web Audio API:</b> Procedural synthesis engine for tactical button clicks, engine rumble, and telemetry klaxons.</li>
                      <li>&bull; <b className="text-[#F1F5F9]">Canvas Confetti:</b> Mission accomplishment particle physics by Kiril Vatev.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[rgba(148,163,184,0.16)] bg-[#0D1733] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setSettingsOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E64C0E] text-white text-xs font-mono font-bold uppercase transition-all shadow-[0_0_14px_rgba(255,90,31,0.4)] active:scale-95"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Multiplayer Modal */}
      <TeamErrorBoundary>
        <TeamModal isOpen={teamModalOpen} onClose={() => setTeamModalOpen(false)} initialTab={teamInitialTab} />
      </TeamErrorBoundary>

      {/* Achievements Gallery Modal */}
      {achievementsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="achievements-modal-title"
          onClick={() => setAchievementsModalOpen(false)}
          className="fixed inset-0 z-50 bg-[#050A1C]/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0A1228] border border-[rgba(148,163,184,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(148,163,184,0.16)]">
              <div>
                <div className="text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-wider">
                  MISSION REPORTS // AEROSPACE HONORS
                </div>
                <h2
                  id="achievements-modal-title"
                  className="text-lg font-black text-[#F1F5F9] font-mono tracking-wide uppercase"
                >
                  AGENCY ACHIEVEMENTS GALLERY
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setAchievementsModalOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-[#0E1836] text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AchievementGallery />
          </div>
        </div>
      )}

      {/* Intro Cutscene Full-Screen Overlay (First Visit or Replay) */}
      {showIntro && (
        <IntroCutscene onComplete={handleIntroComplete} />
      )}
    </div>
  );
}
