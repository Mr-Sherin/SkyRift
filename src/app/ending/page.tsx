'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Share2,
  Check,
  Sparkles,
  Rocket,
  Award,
  ShieldCheck,
  Radio,
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Volume2,
  VolumeX,
  Newspaper,
  HeartHandshake,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sfx } from '@/lib/audio';
import {
  getCampaignEnding,
  getHighestTrustCharacter,
  getCrewTrust,
  CREW_CAMPAIGN_CLOSING_LINES,
  CHARACTERS,
  StorySpeaker,
  resetCrewTrust,
} from '@/data/story';
import { PORTRAIT_CONFIG } from '@/components/story/DialogueBox';
import { getCampaignData, resetCampaign, MISSION_ORDER } from '@/data/campaign';
import { getMissionDebriefHeadline } from '@/data/narration';
import { getUnlockedAchievements, ACHIEVEMENTS, Achievement } from '@/data/achievements';
import { MISSIONS } from '@/data/gameData';

interface MissionSummaryItem {
  id: string;
  name: string;
  destination: string;
  destinationName: string;
  score: number;
  tier: string;
  headline: string;
  publication: string;
}

export default function EndingPage() {
  const router = useRouter();

  // Campaign State
  const [averageScore, setAverageScore] = useState<number>(85);
  const [missionSummaries, setMissionSummaries] = useState<MissionSummaryItem[]>([]);
  const [unlockedList, setUnlockedList] = useState<Achievement[]>([]);
  const [crewTrustState, setCrewTrustState] = useState<Record<StorySpeaker, number>>(getCrewTrust());
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Animated Credits Auto-Scroll Controls
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);
  const [scrollSpeedMultiplier, setScrollSpeedMultiplier] = useState<number>(1);
  const creditsRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef<number | null>(null);

  // Load Data on Mount
  useEffect(() => {
    // 1. Confetti & Audio
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
    });
    sfx.playSuccessChime();

    // 2. Campaign Data
    const campaign = getCampaignData();
    const completed = campaign.completedMissions || {};
    const trust = getCrewTrust();
    setCrewTrustState(trust);

    // Build summaries for all 4 missions in order
    const summaries: MissionSummaryItem[] = MISSION_ORDER.map((mId, idx) => {
      const missionDef = MISSIONS.find((m) => m.id === mId) || {
        id: mId,
        name: idx === 0 ? 'Orbital Sentinel' : idx === 1 ? 'Artemis Surveyor' : idx === 2 ? 'Red Frontier' : 'Deep Primitive',
        destination: idx === 0 ? 'earth' : idx === 1 ? 'moon' : idx === 2 ? 'mars' : 'asteroid',
        destinationName: idx === 0 ? 'Earth Orbit' : idx === 1 ? 'The Moon' : idx === 2 ? 'Mars' : 'Asteroid Bennu',
      };

      const record = completed[mId];
      // If completed in storage, use real score, otherwise fallback to nominal score for preview
      const fallbackScores = [88, 82, 85, 90];
      const score = record ? record.score : fallbackScores[idx] || 80;
      const tier = score >= 85 ? 'Exemplary Flight' : score >= 70 ? 'Mission Success' : score >= 50 ? 'Marginal' : 'Failed';
      const press = getMissionDebriefHeadline(mId, score, true);

      return {
        id: mId,
        name: missionDef.name,
        destination: missionDef.destination,
        destinationName: missionDef.destinationName,
        score,
        tier,
        headline: press.headline,
        publication: press.publication,
      };
    });

    setMissionSummaries(summaries);

    const scores = summaries.map((s) => s.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
    setAverageScore(avg);

    // 3. Unlocked Achievements
    const unlockedMap = getUnlockedAchievements();
    const list = ACHIEVEMENTS.filter((a) => !!unlockedMap[a.id]);
    setUnlockedList(list.length > 0 ? list : ACHIEVEMENTS.slice(0, 5));
  }, []);

  const ending = getCampaignEnding(averageScore);
  const highestTrust = getHighestTrustCharacter(crewTrustState);
  const highestTrustPortrait = PORTRAIT_CONFIG[highestTrust.speaker];
  const highestTrustChar = CHARACTERS[highestTrust.speaker];

  // Auto-Scroll Credits Loop
  useEffect(() => {
    let lastTimestamp = performance.now();

    const scrollLoop = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (isAutoScrolling && creditsRef.current) {
        const el = creditsRef.current;
        // Scroll 28px per second * multiplier
        const pxToScroll = 28 * scrollSpeedMultiplier * delta;
        el.scrollTop += pxToScroll;

        // If reached bottom, pause
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
          setIsAutoScrolling(false);
        }
      }

      scrollAnimRef.current = requestAnimationFrame(scrollLoop);
    };

    scrollAnimRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeedMultiplier]);

  // Restart Credits to Top
  const handleRewind = () => {
    sfx.playClick();
    if (creditsRef.current) {
      creditsRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setIsAutoScrolling(true);
    }
  };

  // Jump to End of Credits
  const handleFastForwardToEnd = () => {
    sfx.playClick();
    if (creditsRef.current) {
      creditsRef.current.scrollTo({ top: creditsRef.current.scrollHeight, behavior: 'smooth' });
      setIsAutoScrolling(false);
    }
  };

  // Share Campaign Results
  const handleShareResult = async () => {
    sfx.playClick();
    const shareText = `🚀 SKY RIFT MISSION CONTROL // CAMPAIGN FINALE\n🏆 Outcome: ${ending.tier.toUpperCase()} COMMENDATION — "${ending.title}"\n📊 Campaign Average Score: ${averageScore}/100\n🛰️ Expeditions: 4/4 Complete (Earth, Moon, Mars, Bennu)\n🤝 Top Crew Trust: ${highestTrust.speaker} (${highestTrust.trust}% Trust)\n🎖️ Aerospace Achievements: ${unlockedList.length} Unlocked\n\nCommand your own deep-space mission in SkyRift!`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 3000);
      }
    } catch {
      // fallback
    }
  };

  // Play Again: Reset Campaign and Navigate to Hangar
  const handlePlayAgain = () => {
    sfx.playClick();
    resetCampaign();
    resetCrewTrust();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('skyrift_flight_results');
      sessionStorage.removeItem('skyrift_crisis_seen_mission-earth-obs');
      sessionStorage.removeItem('skyrift_crisis_seen_mission-lunar-echo');
      sessionStorage.removeItem('skyrift_crisis_seen_mission-mars-frontier');
      sessionStorage.removeItem('skyrift_crisis_seen_mission-asteroid-scout');
    }
    router.push('/missions');
  };

  const speakers: StorySpeaker[] = [
    'Sofia Reyes',
    'Kai Mercer',
    'Dr. Lena Okafor',
    'Ravi Anand',
    'Chair Voss',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col justify-between animate-fadeIn">
      {/* =========================================================================
          TOP BANNER: CAMPAIGN FINALE COMMENDATION HEADER
         ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-rift-line shadow-hud relative overflow-hidden mb-5 text-center">
        {/* Tier Commendation Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 mb-3 shadow-xs">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
            {ending.tier} COMMENDATION &bull; CAMPAIGN COMPLETE
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-rift-text tracking-tight uppercase">
          {ending.title}
        </h1>

        <p className="text-xs sm:text-sm font-mono text-rift-muted mt-1 uppercase tracking-wider">
          ALL 4 MISSIONS CONCLUDED &bull; AVERAGE SCORE: {averageScore} / 100 ({ending.scoreRange})
        </p>

        {/* Global News Headline Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-rift-canvas border border-rift-line/80 max-w-2xl mx-auto text-left flex items-start space-x-3">
          <Newspaper className="w-4 h-4 text-rift-orange shrink-0 mt-0.5" />
          <div className="text-xs font-mono">
            <span className="text-rift-orange font-bold uppercase block text-[10px] tracking-wider mb-0.5">
              GLOBAL BROADCAST // WORLD PRESS SYNDICATE
            </span>
            <p className="font-bold text-rift-text uppercase tracking-tight">
              &ldquo;{ending.headline}&rdquo;
            </p>
          </div>
        </div>

        {/* Top Summary Metrics Pill Row */}
        <div className="mt-5 pt-4 border-t border-rift-line/70 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-rift-canvas border border-rift-line/60">
            <span className="text-[9px] text-rift-muted uppercase block font-bold">AVG FLIGHT SCORE</span>
            <span className="text-base font-black text-rift-text">{averageScore} / 100</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rift-canvas border border-rift-line/60">
            <span className="text-[9px] text-rift-muted uppercase block font-bold">EXPEDITIONS</span>
            <span className="text-base font-black text-emerald-700">4 / 4 CONCLUDED</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rift-canvas border border-rift-line/60">
            <span className="text-[9px] text-rift-muted uppercase block font-bold">ACHIEVEMENTS</span>
            <span className="text-base font-black text-rift-orange">{unlockedList.length} UNLOCKED</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rift-canvas border border-rift-line/60">
            <span className="text-[9px] text-rift-muted uppercase block font-bold">TOP CREW BOND</span>
            <span className="text-xs font-black text-indigo-700 truncate block">
              {highestTrust.speaker.replace('Dr. ', '')} ({highestTrust.trust}%)
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ANIMATED CREDITS ROLL CONTAINER (CINEMATIC AUTO-SCROLL)
         ========================================================================= */}
      <div className="rounded-2xl bg-[#090D16] border border-slate-800 shadow-2xl overflow-hidden flex flex-col mb-5">
        {/* Credits Control Bar */}
        <div className="px-5 py-3 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[11px] text-white">
              ANIMATED CREDITS ROLL
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              (AUTOPLAYS DOWNWARD &bull; PAUSE OR SCROLL FREELY)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Speed Multiplier Button */}
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setScrollSpeedMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
              }}
              title="Change Scroll Speed"
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-amber-400 border border-slate-700 transition-colors"
            >
              {scrollSpeedMultiplier}X SPEED
            </button>

            {/* Play / Pause Auto-Scroll */}
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsAutoScrolling(!isAutoScrolling);
              }}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title={isAutoScrolling ? 'Pause Credits' : 'Play Credits'}
            >
              {isAutoScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Rewind to Top */}
            <button
              type="button"
              onClick={handleRewind}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Rewind to Top"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Jump to End */}
            <button
              type="button"
              onClick={handleFastForwardToEnd}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Fast Forward to Bottom"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Credits Canvas */}
        <div
          ref={creditsRef}
          onMouseEnter={() => setIsAutoScrolling(false)}
          onMouseLeave={() => setIsAutoScrolling(true)}
          className="h-[480px] overflow-y-auto px-6 sm:px-12 py-10 space-y-16 text-center select-text scroll-smooth"
        >
          {/* Logo & Program Title */}
          <div className="space-y-3 pt-6">
            <div className="text-[11px] font-mono font-bold tracking-[0.3em] text-rift-orange uppercase">
              ANTIGRAVITY AEROSPACE PRESENTS
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
              SKY RIFT
            </h2>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              OFFICIAL ORBITAL FLIGHT &bull; EXPEDITION DIRECTORY
            </div>
            <div className="w-16 h-0.5 bg-rift-orange mx-auto mt-4" />
          </div>

          {/* ACT I: MISSION EXPEDITIONS & HEADLINES */}
          <div className="space-y-8 max-w-xl mx-auto">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-slate-400 uppercase block">
                ACT I &bull; THE EXPEDITIONS
              </span>
              <h3 className="text-lg font-black font-mono text-white tracking-wide uppercase">
                FOUR DESTINATIONS IN THE VOID
              </h3>
            </div>

            <div className="space-y-6 text-left">
              {missionSummaries.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-rift-orange uppercase">
                      MISSION 0{idx + 1} &bull; {m.destinationName.toUpperCase()}
                    </span>
                    <span className="font-black text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                      SCORE: {m.score} / 100
                    </span>
                  </div>

                  <div className="text-sm font-black text-white">{m.name}</div>

                  <p className="text-xs text-slate-300 italic leading-relaxed border-t border-slate-800 pt-2">
                    &ldquo;{m.headline}&rdquo;
                  </p>

                  <div className="text-[10px] font-mono text-slate-500">
                    Press Wire: {m.publication} &bull; Rating: {m.tier}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACT II: AEROSPACE ACHIEVEMENTS UNLOCKED */}
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-slate-400 uppercase block">
                ACT II &bull; FLIGHT CITATIONS
              </span>
              <h3 className="text-lg font-black font-mono text-white tracking-wide uppercase">
                AEROSPACE ACHIEVEMENTS UNLOCKED
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {unlockedList.map((ach) => (
                <div
                  key={ach.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start space-x-3"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <div className="font-bold text-xs text-white truncate font-mono">
                      {ach.title}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {ach.description}
                    </p>
                    <span className="text-[9px] font-mono uppercase text-amber-400 font-bold block">
                      {ach.rarity} Citation
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACT III: CREW SIGN-OFFS & CLOSING LINES */}
          <div className="space-y-8 max-w-xl mx-auto">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-slate-400 uppercase block">
                ACT III &bull; MISSION CONTROL DIRECTORATE
              </span>
              <h3 className="text-lg font-black font-mono text-white tracking-wide uppercase">
                CREW CLOSING SIGN-OFFS
              </h3>
            </div>

            <div className="space-y-5 text-left">
              {speakers.map((speaker) => {
                const char = CHARACTERS[speaker];
                const portrait = PORTRAIT_CONFIG[speaker];
                const trustScore = crewTrustState[speaker] ?? 50;
                const closing = CREW_CAMPAIGN_CLOSING_LINES[speaker][ending.tier];

                return (
                  <div
                    key={speaker}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${portrait.gradient} text-white font-mono font-black text-xs flex items-center justify-center ring-2 ${portrait.ringColor} shadow-sm shrink-0`}
                        >
                          {portrait.initials}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white">
                            {speaker}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {char.role} &bull; {char.callsign}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {trustScore}% TRUST
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
                      <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed font-medium">
                        &ldquo;{closing.line}&rdquo;
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACT IV: HIGHEST TRUST OFFICER COMMENDATION */}
          <div className="max-w-xl mx-auto">
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 border-2 border-amber-400/80 text-left shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>DISTINGUISHED CREW BOND CITATION</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/70 px-2.5 py-0.5 rounded border border-amber-600/50">
                  {highestTrust.trust}% HIGHEST TRUST
                </span>
              </div>

              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${highestTrustPortrait.gradient} text-white font-mono font-black text-sm flex items-center justify-center ring-2 ${highestTrustPortrait.ringColor} shadow-md shrink-0`}
                >
                  {highestTrustPortrait.initials}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-black text-white">
                    {highestTrust.speaker} &bull; {highestTrust.relationshipTitle}
                  </div>
                  <p className="text-xs sm:text-sm text-amber-100 font-semibold italic leading-relaxed">
                    &ldquo;{highestTrust.bonusLine.line}&rdquo;
                  </p>
                  <p className="text-[11px] font-mono text-amber-200/80 leading-normal pt-1">
                    {highestTrust.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ACT V: HISTORICAL EPILOGUE */}
          <div className="space-y-4 max-w-xl mx-auto text-center pt-4">
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-slate-400 uppercase block">
              HISTORICAL EPILOGUE
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono italic max-w-lg mx-auto">
              {ending.epilogue}
            </p>
          </div>

          {/* PRODUCTION ACKNOWLEDGMENTS */}
          <div className="pt-10 pb-8 border-t border-slate-800 space-y-3 text-slate-500 text-xs font-mono">
            <div className="text-white font-black uppercase text-sm">
              SKY RIFT MISSION CONTROL
            </div>
            <div>Orbital Dynamics &bull; Aerospace Telemetry &bull; Crew Simulation</div>
            <div>Special thanks to NASA ADS, JPL Solar System Dynamics &amp; Open Spaceflight APIs</div>
            <div className="text-amber-500 font-bold uppercase text-[10px] tracking-widest pt-2">
              PER ASPERA AD ASTRA
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ACTION BAR: "PLAY AGAIN" & "SHARE MY RESULT" BUTTONS
         ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-rift-line shadow-hud flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-rift-muted">
          <Link
            href="/debrief"
            onClick={() => sfx.playClick()}
            className="hover:text-rift-text transition-colors flex items-center space-x-1 underline"
          >
            <span>&larr; Return to Debrief</span>
          </Link>
          <span>&bull;</span>
          <span>SkyRift Campaign Version 1.0</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* Share My Result Button */}
          <button
            type="button"
            onClick={handleShareResult}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white border border-rift-line hover:border-rift-orange text-xs font-mono font-bold text-rift-text flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow"
          >
            {copiedShare ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">COPIED TO CLIPBOARD!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-rift-orange" />
                <span>SHARE MY RESULT</span>
              </>
            )}
          </button>

          {/* Play Again Button */}
          <button
            type="button"
            onClick={handlePlayAgain}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-rift-orange hover:bg-rift-orangeHover text-white text-xs font-mono font-bold uppercase flex items-center justify-center space-x-2 transition-all shadow-hud-orange hover:-translate-y-0.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

