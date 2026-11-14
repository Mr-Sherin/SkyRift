// ============================================================================
// SKY RIFT: CAMPAIGN PROGRESSION SYSTEM
// ============================================================================

export const MISSION_ORDER = [
  'mission-earth-obs',      // 1. Orbital Sentinel (Earth Orbit)
  'mission-lunar-echo',      // 2. Artemis Surveyor (The Moon)
  'mission-mars-frontier',   // 3. Red Frontier (Mars)
  'mission-asteroid-scout',  // 4. Deep Primitive (Asteroid Bennu)
];

export interface CampaignRecord {
  unlockedMissionIds: string[];
  completedMissions: Record<string, { score: number; date: string; bonusEarned: number }>;
  accumulatedBonusCredits: number;
  lastCompletedMissionId?: string;
}

const CAMPAIGN_STORAGE_KEY = 'skyrift_campaign_v1';

const INITIAL_CAMPAIGN_STATE: CampaignRecord = {
  unlockedMissionIds: ['mission-earth-obs'],
  completedMissions: {},
  accumulatedBonusCredits: 0,
};

export function getCampaignData(): CampaignRecord {
  if (typeof window === 'undefined') return INITIAL_CAMPAIGN_STATE;
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!raw) return INITIAL_CAMPAIGN_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed.unlockedMissionIds || !parsed.unlockedMissionIds.includes('mission-earth-obs')) {
      parsed.unlockedMissionIds = ['mission-earth-obs', ...(parsed.unlockedMissionIds || [])];
    }
    return parsed;
  } catch {
    return INITIAL_CAMPAIGN_STATE;
  }
}

export const DEMO_UNLOCK_STORAGE_KEY = 'skyrift_demo_unlock_all';

export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DEMO_UNLOCK_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDemoModeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_UNLOCK_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('skyrift-demo-mode-changed'));
  } catch {
    // ignore
  }
}

export function isMissionUnlocked(missionId: string): boolean {
  if (isDemoModeEnabled()) return true;
  const data = getCampaignData();
  return data.unlockedMissionIds.includes(missionId);
}

export function getNextLockedMission(): string | null {
  const data = getCampaignData();
  for (const id of MISSION_ORDER) {
    if (!data.unlockedMissionIds.includes(id)) {
      return id;
    }
  }
  return null;
}

export function getActiveCampaignBonus(): number {
  const data = getCampaignData();
  return data.accumulatedBonusCredits || 0;
}

export interface MissionCompletionResult {
  bonusFundingEarned: number;
  totalAccumulatedBonus: number;
  unlockedNextMissionId?: string;
  isNewUnlock: boolean;
}

export function recordMissionCompletion(
  missionId: string,
  score: number,
  remainingBudget: number = 0
): MissionCompletionResult {
  if (typeof window === 'undefined') {
    return { bonusFundingEarned: 0, totalAccumulatedBonus: 0, isNewUnlock: false };
  }

  const data = getCampaignData();
  const passingScore = score >= 45;

  // Calculate campaign grant bonus based on performance
  // 15,000 CR per point scored + 25% of unspent budget carryover
  const bonusFundingEarned = passingScore
    ? Math.round(score * 15_000) + Math.max(0, Math.round(remainingBudget * 0.25))
    : 0;

  data.completedMissions[missionId] = {
    score,
    date: new Date().toISOString(),
    bonusEarned: bonusFundingEarned,
  };

  data.lastCompletedMissionId = missionId;
  data.accumulatedBonusCredits = (data.accumulatedBonusCredits || 0) + bonusFundingEarned;

  let unlockedNextMissionId: string | undefined = undefined;
  let isNewUnlock = false;

  if (passingScore) {
    const currentIndex = MISSION_ORDER.indexOf(missionId);
    if (currentIndex >= 0 && currentIndex < MISSION_ORDER.length - 1) {
      const nextMissionId = MISSION_ORDER[currentIndex + 1];
      if (!data.unlockedMissionIds.includes(nextMissionId)) {
        data.unlockedMissionIds.push(nextMissionId);
        unlockedNextMissionId = nextMissionId;
        isNewUnlock = true;
      }
    }
  }

  try {
    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }

  return {
    bonusFundingEarned,
    totalAccumulatedBonus: data.accumulatedBonusCredits,
    unlockedNextMissionId,
    isNewUnlock,
  };
}

export function resetCampaign(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CAMPAIGN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

