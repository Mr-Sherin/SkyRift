// ============================================================================
// SKY RIFT: ACHIEVEMENTS SYSTEM
// ============================================================================

import { sfx } from '@/lib/audio';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'operations' | 'engineering' | 'science' | 'campaign';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string; // Lucide icon identifier
  secret?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-contact',
    title: 'First Contact',
    description: 'Complete your first successful orbital mission to any destination.',
    category: 'campaign',
    rarity: 'common',
    icon: 'Radio',
  },
  {
    id: 'penny-pincher',
    title: 'Penny Pincher',
    description: 'Finish a mission with at least 25% of your allocated budget unspent.',
    category: 'engineering',
    rarity: 'rare',
    icon: 'Coins',
  },
  {
    id: 'zero-waste',
    title: 'Zero Waste',
    description: 'Complete an entire flight without losing a single gigabyte of data to storage overflow.',
    category: 'operations',
    rarity: 'rare',
    icon: 'Database',
  },
  {
    id: 'close-call',
    title: 'Close Call',
    description: 'Survive a mission where craft health dropped below 30% or battery dropped below 15%.',
    category: 'operations',
    rarity: 'epic',
    icon: 'HeartPulse',
  },
  {
    id: 'perfect-launch',
    title: 'Perfect Launch',
    description: 'Achieve a flawless 100% launch reliability roll without any subsystem degradation.',
    category: 'operations',
    rarity: 'rare',
    icon: 'Rocket',
  },
  {
    id: 'solar-maestro',
    title: 'Solar Maestro',
    description: 'Complete an orbital flight without ever triggering emergency Safe Mode.',
    category: 'operations',
    rarity: 'common',
    icon: 'Sun',
  },
  {
    id: 'lunar-pioneer',
    title: 'Lunar Pioneer',
    description: 'Complete Artemis Surveyor and map polar ice inside shadowed lunar craters.',
    category: 'campaign',
    rarity: 'rare',
    icon: 'Moon',
  },
  {
    id: 'martian-explorer',
    title: 'Martian Explorer',
    description: 'Complete Red Frontier and return high-resolution mineral spectra from Mars.',
    category: 'campaign',
    rarity: 'epic',
    icon: 'Compass',
  },
  {
    id: 'deep-space-voyager',
    title: 'Deep Space Voyager',
    description: 'Complete Deep Primitive and lock rendezvous with asteroid Bennu across its 0.90–1.36 AU orbit.',
    category: 'campaign',
    rarity: 'legendary',
    icon: 'Sparkles',
  },
  {
    id: 'science-prodigy',
    title: 'Science Prodigy',
    description: 'Collect 200 or more total science points in a single flight campaign.',
    category: 'science',
    rarity: 'epic',
    icon: 'Zap',
  },
  {
    id: 'high-gain-link',
    title: 'High-Gain Link',
    description: 'Downlink more than 150 GB of telemetry back to the Deep Space Network.',
    category: 'science',
    rarity: 'common',
    icon: 'Wifi',
  },
  {
    id: 'master-architect',
    title: 'Master Architect',
    description: 'Attain a Stellar Tier score of 90/100 or higher on any mission debrief.',
    category: 'engineering',
    rarity: 'legendary',
    icon: 'Trophy',
  },
  {
    id: 'team-synergy',
    title: 'Team Synergy',
    description: 'Complete a mission in Team Mode with all 4 secret crew role goals successfully met.',
    category: 'campaign',
    rarity: 'epic',
    icon: 'Users',
  },
  {
    id: 'daily-challenger',
    title: 'Daily Challenger',
    description: 'Complete today’s date-seeded Daily Challenge mission with active modifiers.',
    category: 'campaign',
    rarity: 'rare',
    icon: 'Calendar',
  },
];

const STORAGE_KEY = 'skyrift_achievements_v1';

export interface UnlockedAchievementRecord {
  unlockedAt: string;
}

export function getUnlockedAchievements(): Record<string, UnlockedAchievementRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function clearUnlockedAchievements(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isAchievementUnlocked(id: string): boolean {
  const all = getUnlockedAchievements();
  return !!all[id];
}

export function unlockAchievement(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const ach = ACHIEVEMENTS.find((a) => a.id === id);
  if (!ach) return false;

  const current = getUnlockedAchievements();
  if (current[id]) return false; // Already unlocked

  current[id] = { unlockedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    sfx.playSuccessChime();
    window.dispatchEvent(
      new CustomEvent('skyrift_achievement_unlocked', {
        detail: ach,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export interface AchievementEvaluationInput {
  missionId: string;
  totalScore: number;
  completed: boolean;
  budgetRemaining: number;
  initialBudget: number;
  dataLossGb: number;
  downlinkedDataGb: number;
  scienceCollected: number;
  minBatterySoC: number;
  minCraftHealth: number;
  hasTriggeredSafeMode: boolean;
  isDailyChallenge?: boolean;
  isTeamMode?: boolean;
  teamGoalsMetCount?: number;
}

export function evaluateFlightAchievements(input: AchievementEvaluationInput): Achievement[] {
  const newlyUnlocked: Achievement[] = [];

  const tryUnlock = (id: string) => {
    if (unlockAchievement(id)) {
      const found = ACHIEVEMENTS.find((a) => a.id === id);
      if (found) newlyUnlocked.push(found);
    }
  };

  if (input.completed) {
    tryUnlock('first-contact');

    if (input.missionId === 'mission-lunar-echo') {
      tryUnlock('lunar-pioneer');
    } else if (input.missionId === 'mission-mars-frontier') {
      tryUnlock('martian-explorer');
    } else if (input.missionId === 'mission-asteroid-scout') {
      tryUnlock('deep-space-voyager');
    }

    if (input.initialBudget > 0 && input.budgetRemaining >= input.initialBudget * 0.25) {
      tryUnlock('penny-pincher');
    }

    if (input.dataLossGb === 0) {
      tryUnlock('zero-waste');
    }

    if (input.minBatterySoC < 15 || input.minCraftHealth < 30) {
      tryUnlock('close-call');
    }

    if (!input.hasTriggeredSafeMode) {
      tryUnlock('solar-maestro');
    }

    if (input.scienceCollected >= 200) {
      tryUnlock('science-prodigy');
    }

    if (input.downlinkedDataGb >= 150) {
      tryUnlock('high-gain-link');
    }

    if (input.totalScore >= 90) {
      tryUnlock('master-architect');
    }

    if (input.isTeamMode && input.teamGoalsMetCount === 4) {
      tryUnlock('team-synergy');
    }

    if (input.isDailyChallenge) {
      tryUnlock('daily-challenger');
    }
  }

  return newlyUnlocked;
}

