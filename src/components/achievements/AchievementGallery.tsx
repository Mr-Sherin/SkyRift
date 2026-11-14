'use client';

import React, { useState, useEffect } from 'react';
import { ACHIEVEMENTS, getUnlockedAchievements, Achievement } from '@/data/achievements';
import {
  Trophy,
  Radio,
  Coins,
  Database,
  HeartPulse,
  Rocket,
  Sun,
  Moon,
  Compass,
  Sparkles,
  Zap,
  Wifi,
  Users,
  Calendar,
  Lock,
  CheckCircle2,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Radio,
  Coins,
  Database,
  HeartPulse,
  Rocket,
  Sun,
  Moon,
  Compass,
  Sparkles,
  Zap,
  Wifi,
  Trophy,
  Users,
  Calendar,
};

const RARITY_STYLES: Record<string, { badge: string; border: string }> = {
  common: { badge: 'bg-slate-800 text-slate-300 border-slate-700', border: 'border-slate-700' },
  rare: { badge: 'bg-sky-950/80 text-sky-300 border-sky-500/40', border: 'border-sky-500/30' },
  epic: { badge: 'bg-purple-950/80 text-purple-300 border-purple-500/40', border: 'border-purple-500/30' },
  legendary: { badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40', border: 'border-amber-500/30' },
};

export function AchievementGallery() {
  const [unlockedMap, setUnlockedMap] = useState<Record<string, { unlockedAt: string }>>({});
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'campaign' | 'operations' | 'engineering' | 'science'>('all');

  useEffect(() => {
    setUnlockedMap(getUnlockedAchievements());
    const onUnlock = () => {
      setUnlockedMap(getUnlockedAchievements());
    };
    window.addEventListener('skyrift_achievement_unlocked', onUnlock);
    return () => window.removeEventListener('skyrift_achievement_unlocked', onUnlock);
  }, []);

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = Object.keys(unlockedMap).length;
  const progressPct = Math.round((unlockedCount / Math.max(1, totalCount)) * 100);

  const filteredAchievements = ACHIEVEMENTS.filter((ach) => {
    if (selectedFilter === 'all') return true;
    return ach.category === selectedFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header bar with progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.16)]">
        <div>
          <div className="text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-wider">
            AEROSPACE HONORS // HALL OF FAME
          </div>
          <div className="text-sm font-black text-[#F1F5F9] font-mono mt-0.5">
            {unlockedCount} of {totalCount} Achievements Unlocked ({progressPct}%)
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-48 h-2 rounded-full bg-[#050A1C] border border-[rgba(148,163,184,0.2)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF5A1F] to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_#FF5A1F]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
        {(['all', 'campaign', 'operations', 'engineering', 'science'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedFilter(cat)}
            className={`px-3 py-1 rounded-full border transition-all uppercase text-xs font-bold ${
              selectedFilter === cat
                ? 'bg-[#FF5A1F] text-white border-[#FF5A1F] shadow-[0_0_12px_rgba(255,90,31,0.4)]'
                : 'bg-[#0A1228] text-[#94A3B8] border-[rgba(148,163,184,0.18)] hover:text-white hover:border-[rgba(56,189,248,0.4)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Achievement Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAchievements.map((ach) => {
          const isUnlocked = !!unlockedMap[ach.id];
          const unlockInfo = unlockedMap[ach.id];
          const IconComponent = ICON_MAP[ach.icon] || Trophy;
          const rarity = RARITY_STYLES[ach.rarity] || RARITY_STYLES.common;

          return (
            <div
              key={ach.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start space-x-3 ${
                isUnlocked
                  ? 'bg-[#0E1836] border-[#FF5A1F]/40 shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                  : 'bg-[#070E24]/60 border-[rgba(148,163,184,0.12)] opacity-50'
              }`}
            >
              {/* Icon Container */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                  isUnlocked
                    ? 'bg-[#FF5A1F]/15 border-[#FF5A1F]/30 text-[#FF5A1F] shadow-[0_0_10px_rgba(255,90,31,0.3)]'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                {isUnlocked ? (
                  <IconComponent className="w-5 h-5" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4
                    className={`text-xs font-black font-mono truncate ${
                      isUnlocked ? 'text-[#F1F5F9]' : 'text-slate-400'
                    }`}
                  >
                    {ach.title}
                  </h4>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${rarity.badge}`}
                  >
                    {ach.rarity}
                  </span>
                </div>

                <p className="text-xs text-[#94A3B8] leading-tight mt-1 line-clamp-2">
                  {ach.description}
                </p>

                <div className="mt-2 text-xs font-mono">
                  {isUnlocked && unlockInfo ? (
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unlocked {new Date(unlockInfo.unlockedAt).toLocaleDateString()}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium">Locked</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
