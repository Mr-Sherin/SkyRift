'use client';

import React from 'react';
import Link from 'next/link';
import { useGame } from '@/game/engine/GameContext';
import { useTeam } from '@/game/team/TeamContext';
import { MISSIONS, ROCKETS } from '@/data/gameData';
import { MissionScenario, LaunchVehicle } from '@/game/types';
import { MISSION_BRIEFINGS } from '@/data/narration';
import { getActiveCampaignBonus, isMissionUnlocked, isDemoModeEnabled, setDemoModeEnabled, MISSION_ORDER } from '@/data/campaign';
import { getDailyChallenge, isDailyChallengeCompleted } from '@/data/dailyChallenge';
import { getMissionStory } from '@/data/story';
import { getMissionRequirements } from '@/game/physics/budgetEngine';
import { DialogueBox } from '@/components/story/DialogueBox';
import { sfx } from '@/lib/audio';
import { ArrowRight, Check, Clock, Lightbulb, Rocket, Lock, Calendar, Award, Radio, Target, Volume2, Sparkles, Sliders, ChevronDown } from 'lucide-react';
import { Panel, HudStat, Badge, SectionLabel, MissionSegmentChip, CmlBadge, SourceInfoBadge, MissionCoachPanel } from '@/components/ui';

const MISSION_COPY: Record<string, { place: string; shortDesc: string; tip: string }> = {
  'mission-earth-obs': {
    place: 'Low Earth Orbit (LEO)',
    shortDesc: 'Deploy a high-resolution orbital surveillance & climate observatory.',
    tip: 'Mind your battery capacity during 35-minute orbital shadow passes!',
  },
  'mission-lunar-echo': {
    place: 'Lunar Polar Orbit',
    shortDesc: 'Prospecting shadowed permanently cold craters for water ice.',
    tip: 'Ensure your trans-lunar injection stage has sufficient delta-v margin.',
  },
  'mission-mars-frontier': {
    place: 'Mars Aerocapture Orbit',
    shortDesc: 'Interplanetary exploration of the Martian atmosphere and surface.',
    tip: 'Solar irradiance drops by 57% at Mars. Size your power arrays accordingly.',
  },
  'mission-asteroid-scout': {
    place: 'Deep Asteroid Belt',
    shortDesc: 'Reconnaissance and sample scouting at near-Earth asteroid Bennu.',
    tip: 'Extreme comms latency requires robust autonomous power and attitude authority.',
  },
};

const DIFFICULTY_STYLES: Record<string, { badge: string; color: 'good' | 'warn' | 'orange' | 'danger' }> = {
  Beginner: { badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40', color: 'good' },
  Intermediate: { badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40', color: 'warn' },
  Advanced: { badge: 'bg-orange-950/80 text-orange-300 border-orange-500/40', color: 'orange' },
  Expert: { badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40', color: 'danger' },
};

function DestinationOrb({ destination, size = 'md' }: { destination: string; size?: 'sm' | 'md' }) {
  const isSmall = size === 'sm';
  const dim = isSmall ? 32 : 44;

  if (destination === 'earth') {
    return (
      <svg width={dim} height={dim} viewBox="0 0 40 40" className="shrink-0 drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]">
        <circle cx="20" cy="20" r="15" fill="#0284C7" />
        <ellipse cx="20" cy="20" rx="14" ry="11" fill="#15803D" opacity="0.8" />
        <ellipse cx="20" cy="20" rx="18" ry="6" transform="rotate(-22 20 20)" fill="none" stroke="#FF5A1F" strokeWidth="1.2" strokeDasharray="3 2" />
        <circle cx="20" cy="20" r="16" fill="none" stroke="#38BDF8" strokeWidth="1.2" opacity="0.6" />
      </svg>
    );
  }
  if (destination === 'moon') {
    return (
      <svg width={dim} height={dim} viewBox="0 0 40 40" className="shrink-0 drop-shadow-[0_0_12px_rgba(203,213,225,0.3)]">
        <circle cx="20" cy="20" r="14" fill="#94A3B8" />
        <circle cx="16" cy="16" r="4" fill="#64748B" />
        <circle cx="24" cy="22" r="3" fill="#64748B" />
        <ellipse cx="20" cy="20" rx="6" ry="17" transform="rotate(15 20 20)" fill="none" stroke="#FF5A1F" strokeWidth="1.2" strokeDasharray="3 2" />
        <circle cx="20" cy="20" r="15" fill="none" stroke="#CBD5E1" strokeWidth="1.2" opacity="0.5" />
      </svg>
    );
  }
  if (destination === 'mars') {
    return (
      <svg width={dim} height={dim} viewBox="0 0 40 40" className="shrink-0 drop-shadow-[0_0_14px_rgba(239,68,68,0.35)]">
        <circle cx="20" cy="20" r="15" fill="#DC2626" />
        <circle cx="20" cy="8" r="4" fill="#F8FAFC" opacity="0.7" />
        <ellipse cx="20" cy="20" rx="18" ry="7" transform="rotate(-18 20 20)" fill="none" stroke="#94A3B8" strokeWidth="1.1" strokeDasharray="3 3" />
        <circle cx="20" cy="20" r="16" fill="none" stroke="#F87171" strokeWidth="1.2" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg width={dim} height={dim} viewBox="0 0 40 40" className="shrink-0 drop-shadow-[0_0_12px_rgba(148,163,184,0.3)]">
      <circle cx="20" cy="20" r="14" fill="#475569" />
      <polygon points="12,14 18,10 26,13 28,22 22,28 14,26" fill="#334155" />
      <circle cx="20" cy="20" r="17" fill="none" stroke="#FF5A1F" strokeWidth="1.1" strokeDasharray="2 3" />
    </svg>
  );
}

export default function MissionsPage() {
  const { activeScenario, selectScenario, difficulty } = useGame();
  const { gameMode, canSelectMission } = useTeam();
  const isAllowedToSelect = canSelectMission();

  const [hasHydrated, setHasHydrated] = React.useState(false);
  const [demoMode, setDemoMode] = React.useState(false);
  const [storyModalOpen, setStoryModalOpen] = React.useState(false);
  React.useEffect(() => {
    setHasHydrated(true);
    setDemoMode(isDemoModeEnabled());

    const onDemoChange = () => setDemoMode(isDemoModeEnabled());
    window.addEventListener('skyrift-demo-mode-changed', onDemoChange);
    return () => window.removeEventListener('skyrift-demo-mode-changed', onDemoChange);
  }, []);

  const copy = MISSION_COPY[activeScenario.id] || {
    place: activeScenario.destinationName,
    shortDesc: activeScenario.tagline,
    tip: '',
  };
  const briefing = MISSION_BRIEFINGS[activeScenario.id];
  const missionStory = getMissionStory(activeScenario.id);
  const suggestedLauncher = ROCKETS.find((l: LaunchVehicle) => l.id === activeScenario.suggestedLauncherId);
  const solarStrengthPct = Math.round((1 / Math.pow(activeScenario.distanceAu, 2)) * 100);

  const campaignBonus = hasHydrated ? getActiveCampaignBonus() : 0;
  const activeReqs = getMissionRequirements(activeScenario, difficulty, null, campaignBonus);
  const daily = getDailyChallenge();
  const dailyDone = hasHydrated ? isDailyChallengeCompleted(daily.dateString) : false;
  const isDailyUnlocked = hasHydrated ? isMissionUnlocked(daily.mission.id) : (daily.mission.id === 'mission-earth-obs');
  const dailyMissionIndex = MISSION_ORDER.indexOf(daily.mission.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 w-full flex-1 flex flex-col scroll-mt-24">
      {/* Header Eyebrow & Title */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <SectionLabel color="orange">STEP 1 OF 4 // MISSION DIRECTIVE</SectionLabel>
          <div className="flex items-center space-x-2.5">
            {/* Demo mode: unlock all missions switch */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0A1228] border border-[rgba(148,163,184,0.18)] text-xs font-mono shadow-sm">
              <span className="text-slate-300">Demo mode: unlock all missions</span>
              <button
                type="button"
                onClick={() => {
                  const next = !demoMode;
                  setDemoMode(next);
                  setDemoModeEnabled(next);
                  sfx.playClick();
                }}
                className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${
                  demoMode ? 'bg-[#FF5A1F]' : 'bg-slate-700'
                }`}
                title="Demo mode: unlock all missions"
                aria-pressed={demoMode}
              >
                <div
                  className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                    demoMode ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <MissionSegmentChip segment="space" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#F1F5F9] font-mono tracking-tight mt-1">
          Choose Your Mission
        </h1>
        <p className="mt-1 text-base text-[#94A3B8]">
          Select an orbital frontier to review trajectory parameters, environmental hazards, and flight requirements.
        </p>

        {gameMode === 'team' && !isAllowedToSelect && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs font-mono text-amber-300 flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>In Team Mode, destination selection is controlled by the <b>Mission Director</b>.</span>
          </div>
        )}

        {/* Daily Challenge Banner */}
        <Panel variant="subtle" padding="sm" className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[#FF5A1F] text-white shrink-0 mt-0.5 shadow-[0_0_12px_rgba(255,90,31,0.4)]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-wider">
                  TODAY&apos;S DAILY CHALLENGE &bull; {daily.dateString}
                </span>
                <Badge variant="warn">{daily.modifier.badge}</Badge>
                {dailyDone && <Badge variant="good">COMPLETED</Badge>}
              </div>
              <div className="text-sm font-black font-mono text-[#F1F5F9] mt-0.5">
                {daily.dailyTitle}
              </div>
              <p className="text-xs text-[#94A3B8] leading-tight mt-0.5">
                {daily.modifier.description}
              </p>
            </div>
          </div>

          {isDailyUnlocked ? (
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                selectScenario(daily.mission.id);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#FF5A1F] text-white text-xs font-mono font-bold hover:bg-[#E64C0E] transition-all shadow-[0_0_14px_rgba(255,90,31,0.4)] shrink-0 self-start sm:self-auto"
            >
              <span>LOAD CHALLENGE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div
              title={`Unlocks after completing Mission ${dailyMissionIndex}`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold shrink-0 self-start sm:self-auto cursor-not-allowed border border-slate-700/80"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlocks after Mission {dailyMissionIndex}</span>
            </div>
          )}
        </Panel>

        {/* Campaign Funding Carryover Notice */}
        {campaignBonus > 0 && (
          <div className="mt-2.5 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <b>Campaign Funding Surplus Active:</b> +{Math.round(campaignBonus / 1000).toLocaleString()}K CR added to mission budget from previous triumphs!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Aligned Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT (5 cols): Destination Selector List (Sticky & Symmetrically Aligned) */}
        <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20 self-start z-30">
          <div className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase tracking-widest px-1">
            AVAILABLE FLIGHT DIRECTIVES (4)
          </div>

          {MISSIONS.map((sc: MissionScenario, idx: number) => {
            const isSelected = activeScenario.id === sc.id;
            const meta = MISSION_COPY[sc.id];
            const unlocked = hasHydrated ? isMissionUnlocked(sc.id) : idx === 0;
            const diff = DIFFICULTY_STYLES[sc.difficulty] || DIFFICULTY_STYLES.Beginner;
            const scReqs = getMissionRequirements(sc, difficulty);

            return (
              <div
                key={sc.id}
                role="button"
                tabIndex={unlocked ? 0 : -1}
                aria-disabled={!unlocked}
                aria-pressed={isSelected}
                onClick={() => {
                  if (!unlocked) {
                    sfx.playAlert();
                    return;
                  }
                  if (gameMode === 'team' && !isAllowedToSelect) {
                    sfx.playAlert();
                    return;
                  }
                  selectScenario(sc.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!unlocked || (gameMode === 'team' && !isAllowedToSelect)) {
                      sfx.playAlert();
                      return;
                    }
                    selectScenario(sc.id);
                  }
                }}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col gap-2.5 select-none ${
                  !unlocked
                    ? 'bg-[#070E24]/60 border-[rgba(148,163,184,0.1)] opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#0D1733] border-[#FF5A1F] ring-1 ring-[#FF5A1F] shadow-[0_0_24px_rgba(255,90,31,0.25)] cursor-pointer'
                    : 'bg-[#0A1228] border-[rgba(148,163,184,0.16)] hover:bg-[#0E1836] hover:border-[rgba(56,189,248,0.4)] shadow-[0_4px_16px_rgba(0,0,0,0.3)] cursor-pointer'
                } ${gameMode === 'team' && !isAllowedToSelect && !isSelected ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <DestinationOrb destination={sc.destination} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black font-mono text-[#F1F5F9] truncate">
                          {sc.name}
                        </span>
                        {unlocked ? (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${diff.badge}`}>
                            {sc.difficulty}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>LOCKED</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-[#94A3B8] truncate mt-0.5">
                        {!unlocked
                          ? `Complete mission ${idx} to unlock`
                          : `${meta?.place || sc.destinationName} • ${sc.durationDays} days`}
                      </div>
                    </div>
                  </div>

                  {isSelected && unlocked && (
                    <span className="w-6 h-6 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center shrink-0 shadow-[0_0_10px_#FF5A1F]">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {!unlocked && (
                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </div>

                {unlocked && (
                  <div className="pt-2 border-t border-[rgba(148,163,184,0.1)] flex items-center justify-between text-[11px] font-mono text-[#94A3B8] w-full">
                    <span className="inline-flex items-center">
                      Budget: <b className="text-[#F1F5F9] ml-1">{(scReqs.budgetCredits / 1_000_000).toFixed(1)}M CR</b>
                      <SourceInfoBadge
                        status={sc.valueSources?.budgetCredits?.status || 'placeholder'}
                        url={sc.valueSources?.budgetCredits?.url}
                        citation={sc.valueSources?.budgetCredits?.citation}
                        label="Mission Budget"
                        className="ml-1"
                        align="left"
                      />
                    </span>
                    <span className="inline-flex items-center">
                      Min Δv: <b className="text-[#FF5A1F] ml-1">{scReqs.requiredDeltaVMs.toLocaleString()} m/s</b>
                      <SourceInfoBadge
                        status={sc.valueSources?.minDeltaVMs?.status || 'derived'}
                        url={sc.valueSources?.minDeltaVMs?.url}
                        citation={sc.valueSources?.minDeltaVMs?.citation}
                        label="Required Δv"
                        className="ml-1"
                        align="right"
                      />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT (7 cols): Briefing Sheet Panel */}
        <Panel variant="default" padding="lg" className="lg:col-span-7 space-y-5 relative z-10">
          {/* Mission Title Row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <DestinationOrb destination={activeScenario.destination} size="md" />
              <div>
                <div className="text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-wider">
                  {activeScenario.destinationName}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-mono text-[#F1F5F9] tracking-tight">
                  {activeScenario.name}
                </h2>
              </div>
            </div>

            <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-[#94A3B8] bg-[#0E1836] px-3.5 py-1.5 rounded-full border border-[rgba(148,163,184,0.18)]">
              <Clock className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>{activeScenario.durationDays} days</span>
              <SourceInfoBadge
                status={activeScenario.valueSources?.durationDays?.status || 'nasa'}
                url={activeScenario.valueSources?.durationDays?.url || activeScenario.sourceUrl}
                citation={activeScenario.valueSources?.durationDays?.citation || activeScenario.sourceCitation}
                label="Mission Duration"
                className="ml-1"
              />
            </div>
          </div>

          {/* Description & Objective Callout */}
          <div className="space-y-3">
            <p className="text-sm sm:text-base text-[#F1F5F9] leading-relaxed font-sans">
              {activeScenario.description}
            </p>

            <div className="p-3.5 rounded-xl bg-[#0E1836] border border-[rgba(148,163,184,0.16)] flex items-start space-x-3 text-xs text-[#94A3B8]">
              <Target className="w-4 h-4 text-[#FF5A1F] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="text-[#FF5A1F] uppercase font-bold font-mono mr-1.5">GOAL TO WIN:</span>
                <span className="text-[#F1F5F9] font-medium font-sans">{activeScenario.primaryObjective}</span>
              </div>
            </div>
          </div>

          {/* HudStat 4-Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
            <HudStat
              label="BUDGET"
              value={`${(activeReqs.budgetCredits / 1_000_000).toFixed(1)}M`}
              unit="CR"
              status="neutral"
              sourceStatus={activeScenario.valueSources?.budgetCredits?.status || 'placeholder'}
              sourceUrl={activeScenario.valueSources?.budgetCredits?.url}
              sourceCitation={activeScenario.valueSources?.budgetCredits?.citation}
            />
            <HudStat
              label="MIN ΔV"
              value={activeReqs.requiredDeltaVMs.toLocaleString()}
              unit="m/s"
              status="orange"
              sourceStatus={activeScenario.valueSources?.minDeltaVMs?.status || 'derived'}
              sourceUrl={activeScenario.valueSources?.minDeltaVMs?.url}
              sourceCitation={activeScenario.valueSources?.minDeltaVMs?.citation}
            />
            <HudStat
              label="SUNLIGHT"
              value={solarStrengthPct}
              unit="%"
              status={solarStrengthPct >= 80 ? 'good' : 'warn'}
              sourceStatus={activeScenario.valueSources?.sunlight?.status || 'derived'}
              sourceUrl={activeScenario.valueSources?.sunlight?.url}
              sourceCitation={activeScenario.valueSources?.sunlight?.citation}
            />
            <HudStat
              label="ECLIPSE"
              value={activeScenario.eclipseMinutesPerOrbit}
              unit="min"
              status={activeScenario.eclipseMinutesPerOrbit > 0 ? 'warn' : 'good'}
              sourceStatus={activeScenario.valueSources?.eclipseMinutesPerOrbit?.status || 'derived'}
              sourceUrl={activeScenario.valueSources?.eclipseMinutesPerOrbit?.url}
              sourceCitation={activeScenario.valueSources?.eclipseMinutesPerOrbit?.citation}
            />
          </div>

          {/* Collapsible Mission Coach: All tips, CML info, Director Dispatch & Real Mission Notes */}
          <MissionCoachPanel
            title={`Flight Briefing // ${briefing?.callsign || activeScenario.name}`}
            badge="MISSION COACH"
            summary={briefing?.quote ? `“${briefing.quote}” — ${briefing.directorName}` : undefined}
            tips={[
              copy.tip,
              ...(briefing?.objectives || []),
            ].filter(Boolean)}
            whyItMatters={
              briefing?.keyRisk
                ? `Critical Operational Risk: ${briefing.keyRisk}`
                : undefined
            }
            whatRealMissionsDo={
              `Authentic NASA ${activeScenario.destinationName} missions require careful balance between thermal shadow survival and propellant budget.`
            }
            formula={{
              name: 'Solar Power Attenuation',
              equation: 'P(r) = P_0 / r^2 (where r = distance from Sun in AU)',
              workedExample: `At ${activeScenario.destinationName} (${activeScenario.distanceAu} AU), solar irradiance is ${solarStrengthPct}% of Earth orbit.`,
            }}
            chips={
              <>
                <MissionSegmentChip segment="space" />
                <CmlBadge difficulty={activeScenario.difficulty} showExplanation={false} />
                {activeReqs.isBeginner && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                    Beginner Margins Active
                  </span>
                )}
              </>
            }
          />

          {/* Starting Narration Dialogue Trigger (Secondary quiet outline) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#070E24] border border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <Radio className="w-3.5 h-3.5 text-rift-orange" />
              <span>Cinematic Briefing Available</span>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setStoryModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-mono font-bold uppercase transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-slate-300" />
              <span>PLAY NARRATION</span>
            </button>
          </div>

          {/* Footer CTA */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[rgba(148,163,184,0.14)]">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#94A3B8]">
              <Rocket className="w-4 h-4 text-[#FF5A1F] shrink-0" />
              <span>
                Suggested rocket: <b className="text-[#F1F5F9]">{suggestedLauncher?.name || 'Medium Lifter'}</b>
              </span>
            </div>

            <Link
              href="/hangar"
              onClick={() => sfx.playClick()}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E64C0E] text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(255,90,31,0.4)] shrink-0 active:scale-95"
            >
              <span>Build Spacecraft</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* Interactive Story Narration DialogueBox Modal */}
      {storyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#050A1C]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <DialogueBox
            dialogue={missionStory.openingBriefing}
            title={missionStory.chapterTitle.toUpperCase()}
            badge="STARTING NARRATION"
            onComplete={() => setStoryModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
