'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Settings,
  LifeBuoy,
  HelpCircle,
  User,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Flame,
  Repeat,
  Disc3,
  Sparkles,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Users,
  ShieldCheck,
  Rocket,
  BookOpen,
  Music2,
  Award,
} from 'lucide-react';
import { AchievementGallery } from '@/components/achievements/AchievementGallery';
import { useGame } from '@/game/engine/GameContext';
import { useTeam } from '@/game/team/TeamContext';
import { runPreflightDiagnostics } from '@/game/physics/budgetEngine';
import { isDemoModeEnabled, setDemoModeEnabled } from '@/data/campaign';
import { sfx } from '@/lib/audio';
import { upsertPilotProfile } from '@/services/supabaseService';
import {
  music,
  MusicLoopMode,
  MusicStateSnapshot,
  SOUNDTRACK_TRACKS,
} from '@/lib/music';

type ExtraTab = 'settings' | 'support' | 'help' | 'profile' | 'honors';

const TABS: { id: ExtraTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'settings', label: 'GAME SETTINGS', icon: Settings },
  { id: 'honors', label: 'HONORS & BADGES', icon: Award },
  { id: 'support', label: 'SUPPORT', icon: LifeBuoy },
  { id: 'help', label: 'HELP', icon: HelpCircle },
  { id: 'profile', label: 'USER INFORMATION', icon: User },
];

const CREW_ROLES = [
  { id: 'commander' as const, label: 'Commander' },
  { id: 'engineer' as const, label: 'Systems Engineer' },
  { id: 'science' as const, label: 'Science Officer' },
  { id: 'flightOps' as const, label: 'Flight Ops' },
];

const PROFILE_STORAGE_KEY = 'skyrift_user_profile_v1';

interface UserProfile {
  callsign: string;
  division: string;
  agency: string;
}

const DEFAULT_PROFILE: UserProfile = {
  callsign: 'ORBITAL-01',
  division: 'Deep Space Mission Design',
  agency: 'SkyRift Flight Operations',
};

function ExtraContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const activeTab: ExtraTab =
    tabParam === 'support' || tabParam === 'help' || tabParam === 'profile' || tabParam === 'honors'
      ? tabParam
      : 'settings';

  const {
    activeScenario,
    selectedComponents,
    selectedLauncher,
    budgets,
    activeRole,
    setActiveRole,
    loadPresetNominal,
    resetSpacecraft,
  } = useGame();

  const { gameMode, leaveRoom } = useTeam();
  const [soloTestActive, setSoloTestActive] = useState(false);

  const [muted, setMuted] = useState(false);
  const [musicSnap, setMusicSnap] = useState<MusicStateSnapshot>(() => music.getSnapshot());
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [profileSaved, setProfileSaved] = useState(false);
  const [copiedDiag, setCopiedDiag] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [capabilities, setCapabilities] = useState({
    webAudio: false,
    webGL: false,
    storage: false,
  });

  useEffect(() => {
    const unsub = music.subscribe((snap) => {
      setMusicSnap(snap);
      setMuted(snap.isMuted || sfx.getMuted());
    });
    return unsub;
  }, []);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          callsign: typeof parsed.callsign === 'string' && parsed.callsign ? parsed.callsign : DEFAULT_PROFILE.callsign,
          division: typeof parsed.division === 'string' && parsed.division ? parsed.division : DEFAULT_PROFILE.division,
          agency: typeof parsed.agency === 'string' && parsed.agency ? parsed.agency : DEFAULT_PROFILE.agency,
        });
      }
    } catch {
      // ignore storage errors
    }

    try {
      const rawFlight = sessionStorage.getItem('skyrift_flight_results');
      if (rawFlight) {
        const parsed = JSON.parse(rawFlight);
        if (typeof parsed.dataDownlinkedGb === 'number') {
          setLastScore(parsed.dataDownlinkedGb);
        }
      }
    } catch {
      // ignore sessionStorage errors
    }

    const hasWebAudio = typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    let hasWebGL = false;
    try {
      const canvas = document.createElement('canvas');
      hasWebGL = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      hasWebGL = false;
    }
    let hasStorage = false;
    try {
      localStorage.setItem('__skyrift_test__', '1');
      localStorage.removeItem('__skyrift_test__');
      hasStorage = true;
    } catch {
      hasStorage = false;
    }
    setCapabilities({ webAudio: hasWebAudio, webGL: hasWebGL, storage: hasStorage });
    setDemoMode(isDemoModeEnabled());
  }, []);

  const diagnostics = runPreflightDiagnostics(
    selectedComponents,
    activeScenario,
    selectedLauncher,
    budgets
  );
  const errorCount = diagnostics.filter((d) => d.type === 'error').length;

  const setTab = (tab: ExtraTab) => {
    sfx.playClick();
    router.replace(`/extra?tab=${tab}`);
  };

  const handleToggleMute = () => {
    const nextMuted = sfx.toggleMute();
    music.setMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) sfx.playClick();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playComponentAttach();
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      localStorage.setItem('skyrift_player_name', profile.callsign);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);

      // Cloud profile sync to Supabase
      upsertPilotProfile({
        callsign: profile.callsign || 'Flight Director',
        agency_name: profile.agency || 'SkyRift Aerospace Agency',
        difficulty_preference: profile.division || 'standard',
        missions_completed: 0,
        total_score: 0,
        unlocked_achievements: [],
      }).catch((err) => console.warn('[Profile] Cloud sync notice:', err));
    } catch {
      // ignore storage errors
    }
  };

  const handleCopyDiagnostics = async () => {
    sfx.playClick();
    const payload = {
      mission: activeScenario.name,
      destination: activeScenario.destinationName,
      launcher: selectedLauncher?.name || 'None',
      installedModules: selectedComponents.map((c) => c.id),
      budgets,
      preflightErrors: errorCount,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedDiag(true);
      setTimeout(() => setCopiedDiag(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleResetLocalCache = () => {
    sfx.playAlert();
    try {
      localStorage.removeItem('skyrift_mission_state_v1');
      localStorage.removeItem('skyrift_music_prefs_v1');
      sessionStorage.removeItem('skyrift_flight_results');
      loadPresetNominal();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Page Header */}
      <div className="mb-8 border-b border-rift-line pb-6">
        <div className="text-[10px] font-mono text-rift-orange font-bold uppercase tracking-widest mb-1">
          EXTRA // MISSION CONTROL UTILITIES
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-rift-text tracking-tight">
          SYSTEM &amp; COMMAND CENTER
        </h1>
        <p className="mt-2 text-rift-muted text-sm max-w-3xl font-mono">
          Configure game audio and soundtrack preferences, inspect system diagnostics, review quick-start mission guidance, or manage your commander profile.
        </p>

        {/* Sub-tab switcher */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded border text-xs font-mono font-bold tracking-wider transition-colors ${
                  isCurrent
                    ? 'bg-rift-orange text-white border-rift-orange shadow-hud-orange'
                    : 'bg-rift-panel text-rift-slate border-rift-line hover:border-rift-orange hover:text-rift-orange'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          1. GAME SETTINGS
         ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Audio & Soundtrack */}
          <div className="p-6 rounded-lg bg-rift-panel border border-rift-line shadow-hud space-y-5">
            <div className="flex items-center justify-between border-b border-rift-line pb-3">
              <div>
                <div className="text-[10px] font-mono font-bold text-rift-orange uppercase">AUDIO ENGINE</div>
                <h2 className="text-base font-black text-rift-text uppercase">Sound &amp; Soundtrack</h2>
              </div>
              <button
                type="button"
                onClick={handleToggleMute}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors ${
                  muted
                    ? 'bg-rift-orange text-white hover:bg-rift-orangeHover'
                    : 'bg-rift-slate text-white hover:bg-rift-text'
                }`}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{muted ? 'UNMUTE ALL' : 'MUTE ALL'}</span>
              </button>
            </div>

            {/* Loop Mode */}
            <div>
              <div className="text-[10px] font-mono font-bold text-rift-faint uppercase mb-2">
                HIGH-MOMENT LOOP MODE
              </div>
              <div className="grid grid-cols-3 gap-2">
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
                      className={`flex items-center justify-center space-x-1 py-2 px-2 rounded border text-[10px] font-mono font-bold transition-colors ${
                        active
                          ? 'bg-rift-orange text-white border-rift-orange'
                          : 'bg-rift-surface text-rift-slate border-rift-line hover:border-rift-orange'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tracks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-rift-faint uppercase">
                <span>SOUNDTRACK ROTATION</span>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    music.togglePlayPause();
                  }}
                  className="inline-flex items-center space-x-1 text-rift-orange hover:underline"
                >
                  {musicSnap.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{musicSnap.isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>
              </div>
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
                    className={`w-full px-3 py-2 rounded border text-left flex items-center justify-between text-xs font-mono transition-colors ${
                      active
                        ? 'bg-rift-orangeMuted border-rift-orange text-rift-text font-bold'
                        : 'bg-rift-surface border-rift-line text-rift-slate hover:border-rift-lineDark'
                    }`}
                  >
                    <div>
                      <div>{t.title}</div>
                      <div className="text-[10px] text-rift-muted">{t.artist}</div>
                    </div>
                    <span className="text-[10px] text-rift-orange font-bold">{t.vibe}</span>
                  </button>
                );
              })}
            </div>

            {/* Volume */}
            <div className="flex items-center space-x-3 pt-1">
              <span className="text-[10px] font-mono text-rift-muted uppercase">VOLUME</span>
              <input
                type="range"
                min="0"
                max="100"
                aria-label="Music volume"
                value={Math.round(musicSnap.volume * 100)}
                onChange={(e) => music.setVolume(Number(e.target.value) / 100)}
                className="w-full accent-[#FF5E1E]"
              />
              <span className="text-xs font-mono font-bold text-rift-text w-10 text-right">
                {Math.round(musicSnap.volume * 100)}%
              </span>
            </div>
          </div>

          {/* Crew Role & Spacecraft State */}
          <div className="p-6 rounded-lg bg-rift-panel border border-rift-line shadow-hud space-y-5">
            <div className="border-b border-rift-line pb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold text-rift-orange uppercase">GAMEPLAY &amp; CREW</div>
                <h2 className="text-base font-black text-rift-text uppercase">Station &amp; Craft Controls</h2>
              </div>
              <Link
                href="/multiplayer"
                onClick={() => sfx.playClick()}
                className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold text-rift-orange hover:underline"
              >
                <Users className="w-3.5 h-3.5" />
                <span>CREW DECK</span>
              </Link>
            </div>

            <div>
              <div className="text-[10px] font-mono font-bold text-rift-faint uppercase mb-2">
                ACTIVE CREW STATION ROLE
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
                      className={`px-3 py-2.5 rounded border text-xs font-mono font-bold transition-all ${
                        selected
                          ? 'bg-rift-orangeMuted border-rift-orange text-rift-orange'
                          : 'bg-rift-surface border-rift-line text-rift-slate hover:border-rift-lineDark'
                      }`}
                    >
                      {role.label.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded bg-rift-surface border border-rift-line space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rift-muted">ACTIVE MISSION</span>
                <span className="font-bold text-rift-text uppercase">{activeScenario.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rift-muted">INSTALLED MODULES</span>
                <span className="font-bold text-rift-orange">{selectedComponents.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    loadPresetNominal();
                    sfx.playComponentAttach();
                  }}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-[#0E1836] hover:bg-[#15234A] border border-[rgba(148,163,184,0.2)] hover:border-[#FF5A1F] text-xs font-mono font-bold text-[#FF5A1F] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>NOMINAL PRESET</span>
                </button>
                <button
                  type="button"
                  onClick={resetSpacecraft}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-[#0E1836] hover:bg-rose-950/50 border border-[rgba(148,163,184,0.2)] hover:border-rose-500/50 text-xs font-mono font-bold text-rose-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>CLEAR CRAFT</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => sfx.playComponentAttach()}
                className="flex-1 py-2.5 rounded bg-rift-surface border border-rift-line hover:border-rift-orange text-xs font-mono font-bold text-rift-text transition-colors"
              >
                TEST UI CHIME
              </button>
              <Link
                href="/?replayIntro=true"
                onClick={() => sfx.playClick()}
                className="flex-1 py-2.5 rounded bg-rift-orangeMuted border border-rift-orange/60 hover:border-rift-orange text-xs font-mono font-bold text-rift-orange transition-colors flex items-center justify-center space-x-1.5"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>REPLAY INTRO</span>
              </Link>
            </div>

            {/* Demo mode: unlock all missions switch */}
            <div className="p-4 rounded-lg bg-rift-surface border border-rift-line flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-rift-text">
                  Demo mode: unlock all missions
                </div>
                <div className="text-[10px] font-mono text-rift-muted mt-0.5">
                  Bypass campaign progression gates to test any mission directive immediately.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !demoMode;
                  setDemoMode(next);
                  setDemoModeEnabled(next);
                  sfx.playClick();
                }}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                  demoMode ? 'bg-[#FF5A1F]' : 'bg-slate-700'
                }`}
                title="Demo mode: unlock all missions"
                aria-pressed={demoMode}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    demoMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Test solo (all roles) shortcut for judges */}
            <div className="p-4 rounded-lg bg-rift-surface border border-rift-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono font-bold text-rift-text flex items-center space-x-2">
                  <span>Test solo (all roles)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FF5A1F]/20 text-[#FF5A1F] border border-[#FF5A1F]/30 font-bold uppercase">
                    JUDGE SHORTCUT
                  </span>
                </div>
                <div className="text-[10px] font-mono text-rift-muted mt-0.5">
                  Instant solo evaluation mode: grants unrestricted access to all four roles (Director, Engineer, Science, Comms) with identical UI.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sfx.playComponentAttach();
                  leaveRoom();
                  setSoloTestActive(true);
                  setTimeout(() => setSoloTestActive(false), 3000);
                }}
                className="px-3.5 py-2 rounded-lg bg-[#0E1836] hover:bg-[#15234A] border border-[rgba(148,163,184,0.25)] hover:border-[#FF5A1F] text-xs font-mono font-bold text-white flex items-center justify-center space-x-1.5 transition-all shrink-0 shadow-sm"
              >
                {soloTestActive || gameMode === 'solo' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">SOLO MODE ACTIVE</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    <span>ACTIVATE SOLO TEST</span>
                  </>
                )}
              </button>
            </div>

            {/* Credits & Third-Party Attributions */}
            <div className="p-4 rounded-lg bg-rift-surface border border-rift-line space-y-3 font-mono text-xs">
              <div className="text-[10px] font-bold text-rift-orange uppercase flex items-center space-x-1.5">
                <Music2 className="w-3.5 h-3.5" />
                <span>SOUNDTRACK CREDITS // NOCOPYRIGHTSOUNDS (NCS)</span>
              </div>
              <p className="text-[11px] text-rift-muted leading-relaxed">
                Background soundtrack provided by <b>NoCopyrightSounds (NCS)</b> under their free creator policy:
              </p>
              <div className="space-y-1.5 pl-2 border-l-2 border-rift-orange/50 text-[11px]">
                {SOUNDTRACK_TRACKS.map((track) => (
                  <div key={track.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-rift-text gap-0.5">
                    <span className="font-bold">&ldquo;{track.title}&rdquo;</span>
                    <span className="text-rift-muted text-[10px]">{track.artist}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-rift-line/60 space-y-1 text-[10px] text-rift-muted">
                <div className="font-bold text-rift-text uppercase">ADDITIONAL THIRD-PARTY ASSETS</div>
                <div>&bull; <b>NASA APIs &amp; Observation Archives:</b> Real Moon, Mars &amp; Asteroid imagery via images-api.nasa.gov.</div>
                <div>&bull; <b>Lucide React:</b> Tactical UI and aerospace iconography.</div>
                <div>&bull; <b>Web Audio API:</b> Procedural synthesis engine for tactical sound effects.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. SUPPORT
         ===================================================================== */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg bg-rift-panel border border-rift-line shadow-hud space-y-4">
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase">SYSTEM TELEMETRY</div>
            <h2 className="text-base font-black text-rift-text uppercase">Browser Environment Check</h2>
            <p className="text-xs text-rift-muted font-mono">
              Live capability diagnostics for Web Audio synthesis, 3D WebGL station rendering, and local mission save persistence.
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded bg-rift-surface border border-rift-line flex items-center justify-between">
                <span>WEB AUDIO API</span>
                <span className={capabilities.webAudio ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {capabilities.webAudio ? 'SUPPORTED' : 'UNAVAILABLE'}
                </span>
              </div>
              <div className="p-3 rounded bg-rift-surface border border-rift-line flex items-center justify-between">
                <span>WEBGL 3D ENGINE</span>
                <span className={capabilities.webGL ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {capabilities.webGL ? 'SUPPORTED' : 'SVG FALLBACK'}
                </span>
              </div>
              <div className="p-3 rounded bg-rift-surface border border-rift-line flex items-center justify-between">
                <span>LOCAL SAVE STORAGE</span>
                <span className={capabilities.storage ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {capabilities.storage ? 'ACTIVE' : 'RESTRICTED'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-rift-panel border border-rift-line shadow-hud space-y-4">
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase">TROUBLESHOOTING &amp; CACHE</div>
            <h2 className="text-base font-black text-rift-text uppercase">Diagnostics &amp; Reset Tools</h2>
            <p className="text-xs text-rift-muted font-mono leading-relaxed">
              Copy your current spacecraft telemetry snapshot to share a build or troubleshoot a preflight deficit, or reset your local browser mission cache to factory defaults.
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyDiagnostics}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded bg-rift-orange hover:bg-rift-orangeHover text-white text-xs font-mono font-bold transition-colors"
              >
                {copiedDiag ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDiag ? 'BUILD SNAPSHOT COPIED' : 'COPY MISSION TELEMETRY JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetLocalCache}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded bg-rift-surface border border-rift-line hover:border-rose-400 text-xs font-mono font-bold text-rose-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{cacheCleared ? 'LOCAL CACHE RESET TO NOMINAL' : 'RESET SAVED DATA TO NOMINAL'}</span>
              </button>
            </div>

            <div className="p-3 rounded bg-rift-surface border border-rift-line text-[11px] font-mono text-rift-muted">
              SkyRift: Mission Control &bull; Educational Space Mission Simulator (NASA Space Apps Challenge 2026 Edition).
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. HELP
         ===================================================================== */}
      {activeTab === 'help' && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-rift-panel border border-rift-line shadow-hud">
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase mb-1">FLIGHT MANUAL</div>
            <h2 className="text-lg font-black text-rift-text uppercase mb-4">How To Complete A Mission</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-3.5 rounded bg-rift-surface border border-rift-line">
                <div className="font-black text-rift-orange mb-1">1. MISSIONS</div>
                <p className="text-rift-muted">Choose Earth LEO, Moon, Mars, or Asteroid Bennu based on target difficulty and Δv.</p>
              </div>
              <div className="p-3.5 rounded bg-rift-surface border border-rift-line">
                <div className="font-black text-rift-orange mb-1">2. HANGAR</div>
                <p className="text-rift-muted">Install structure, power, propulsion, comms, GNC, thermal, C&amp;DH, and science payloads.</p>
              </div>
              <div className="p-3.5 rounded bg-rift-surface border border-rift-line">
                <div className="font-black text-rift-orange mb-1">3. FLIGHT PLAN</div>
                <p className="text-rift-muted">Pick a launch vehicle whose payload capacity to your destination exceeds total spacecraft wet mass.</p>
              </div>
              <div className="p-3.5 rounded bg-rift-surface border border-rift-line">
                <div className="font-black text-rift-orange mb-1">4. LAUNCH &amp; OPS</div>
                <p className="text-rift-muted">Pass Preflight FRR, ride countdown telemetry, handle orbital anomalies, and review your 100-pt Debrief.</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-rift-panel border border-rift-line shadow-hud">
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase mb-1">COMMON PREFLIGHT FIXES</div>
            <h2 className="text-base font-black text-rift-text uppercase mb-3">Resolving Engineering Deficits</h2>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded bg-rift-surface border border-rift-line">
                <b className="text-rift-text">Power Deficit at Mars / Asteroid:</b>{' '}
                <span className="text-rift-muted">Solar irradiance drops by 1/r². Add Dual-Wing Tracking Arrays or switch to the Next-Gen RTG nuclear generator.</span>
              </div>
              <div className="p-3 rounded bg-rift-surface border border-rift-line">
                <b className="text-rift-text">Insufficient Δv Margin:</b>{' '}
                <span className="text-rift-muted">Swap low-Isp cold gas thrusters for Bipropellant or High-Isp Ion propulsion and reduce excess dry mass.</span>
              </div>
              <div className="p-3 rounded bg-rift-surface border border-rift-line">
                <b className="text-rift-text">Mass Exceeds Rocket Capacity:</b>{' '}
                <span className="text-rift-muted">Upgrade your booster in Flight Plan (e.g., Titan-Heavy or Nova Super-Heavy) or trim redundant modules.</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/learn"
                onClick={() => sfx.playClick()}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded bg-rift-orange text-white text-xs font-mono font-bold hover:bg-rift-orangeHover transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>PHYSICS EQUATIONS GUIDE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/preflight"
                onClick={() => sfx.playClick()}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded bg-rift-surface border border-rift-line text-rift-text text-xs font-mono font-bold hover:border-rift-orange transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rift-orange" />
                <span>OPEN PREFLIGHT CHECK</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. HONORS & ACHIEVEMENTS
         ===================================================================== */}
      {activeTab === 'honors' && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-rift-panel border border-rift-line shadow-hud">
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase mb-1">AGENCY ACCOLADES</div>
            <h2 className="text-lg font-black text-rift-text uppercase mb-2">Honors &amp; Badges Gallery</h2>
            <p className="text-xs text-rift-muted font-mono mb-4">
              Achievements earned across your orbital flight career through nominal operations, extreme survival, and rigorous engineering.
            </p>
            <AchievementGallery />
          </div>
        </div>
      )}

      {/* =====================================================================
          4. USER INFORMATION
         ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-lg bg-rift-panel border border-rift-line shadow-hud space-y-4"
          >
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase">OPERATOR CREDENTIALS</div>
            <h2 className="text-base font-black text-rift-text uppercase">Commander Profile</h2>

            <div>
              <label htmlFor="profile-callsign" className="block text-[10px] font-mono font-bold text-rift-faint uppercase mb-1">
                COMMANDER CALLSIGN
              </label>
              <input
                id="profile-callsign"
                type="text"
                value={profile.callsign}
                onChange={(e) => setProfile({ ...profile, callsign: e.target.value })}
                className="w-full px-3 py-2 rounded bg-rift-surface border border-rift-line focus:border-rift-orange focus:outline-none text-xs font-mono font-bold text-rift-text"
              />
            </div>

            <div>
              <label htmlFor="profile-division" className="block text-[10px] font-mono font-bold text-rift-faint uppercase mb-1">
                ENGINEERING DIVISION
              </label>
              <input
                id="profile-division"
                type="text"
                value={profile.division}
                onChange={(e) => setProfile({ ...profile, division: e.target.value })}
                className="w-full px-3 py-2 rounded bg-rift-surface border border-rift-line focus:border-rift-orange focus:outline-none text-xs font-mono text-rift-text"
              />
            </div>

            <div>
              <label htmlFor="profile-agency" className="block text-[10px] font-mono font-bold text-rift-faint uppercase mb-1">
                AGENCY / TEAM NAME
              </label>
              <input
                id="profile-agency"
                type="text"
                value={profile.agency}
                onChange={(e) => setProfile({ ...profile, agency: e.target.value })}
                className="w-full px-3 py-2 rounded bg-rift-surface border border-rift-line focus:border-rift-orange focus:outline-none text-xs font-mono text-rift-text"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-rift-orange hover:bg-rift-orangeHover text-white text-xs font-mono font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              {profileSaved && <CheckCircle2 className="w-4 h-4" />}
              <span>{profileSaved ? 'PROFILE SAVED LOCALLY' : 'SAVE COMMANDER PROFILE'}</span>
            </button>
          </form>

          <div className="p-6 rounded-lg bg-rift-panel border border-rift-line shadow-hud space-y-4">
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase">ACTIVE ASSIGNMENT</div>
            <h2 className="text-base font-black text-rift-text uppercase">Mission Telemetry Summary</h2>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded bg-rift-surface border border-rift-line flex justify-between">
                <span className="text-rift-muted">ASSIGNED STATION</span>
                <span className="font-bold text-rift-orange uppercase">{activeRole}</span>
              </div>
              <div className="p-3 rounded bg-rift-surface border border-rift-line flex justify-between">
                <span className="text-rift-muted">ACTIVE MISSION</span>
                <span className="font-bold text-rift-text uppercase">{activeScenario.name}</span>
              </div>
              <div className="p-3 rounded bg-rift-surface border border-rift-line flex justify-between">
                <span className="text-rift-muted">LAUNCH VEHICLE</span>
                <span className="font-bold text-rift-text uppercase">{selectedLauncher?.name || 'NONE'}</span>
              </div>
              <div className="p-3 rounded bg-rift-surface border border-rift-line flex justify-between">
                <span className="text-rift-muted">REMAINING GRANT</span>
                <span className={`font-bold ${budgets.isOverBudget ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {budgets.remainingCredits.toLocaleString()} CR
                </span>
              </div>
              <div className="p-3 rounded bg-rift-surface border border-rift-line flex justify-between">
                <span className="text-rift-muted">LAST SESSION DOWNLINK</span>
                <span className="font-bold text-rift-text">
                  {lastScore !== null ? `${lastScore} GB` : 'NO COMPLETED FLIGHT YET'}
                </span>
              </div>
            </div>

            <Link
              href="/hangar"
              onClick={() => sfx.playClick()}
              className="inline-flex items-center justify-center space-x-1.5 w-full py-2.5 rounded bg-rift-slate hover:bg-rift-text text-white text-xs font-mono font-bold transition-colors"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>RETURN TO SPACECRAFT HANGAR</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExtraPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 font-mono text-xs text-rift-muted">
          LOADING EXTRA COMMAND CENTER...
        </div>
      }
    >
      <ExtraContent />
    </Suspense>
  );
}

