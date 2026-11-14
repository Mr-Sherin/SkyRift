// ============================================================================
// SKY RIFT: DAILY CHALLENGE SYSTEM
// ============================================================================

import { MISSIONS } from '@/data/gameData';
import { MissionScenario } from '@/game/types';
import { hashStringToSeed } from '@/data/events';

export interface DailyModifier {
  id: string;
  name: string;
  description: string;
  badge: string;
  solarMultiplier: number;
  batteryDrainMultiplier: number;
  budgetMultiplier: number;
  scienceMultiplier: number;
  deltaVMultiplier: number;
}

export const DAILY_MODIFIERS_POOL: DailyModifier[] = [
  {
    id: 'solar-storm-surge',
    name: 'Solar Storm Surge',
    description: 'Coronal mass ejection increases solar panel output by 20%, but increases battery drain during active ops by 15%.',
    badge: 'SOLAR SURGE',
    solarMultiplier: 1.2,
    batteryDrainMultiplier: 1.15,
    budgetMultiplier: 1.0,
    scienceMultiplier: 1.15,
    deltaVMultiplier: 1.0,
  },
  {
    id: 'deep-space-austerity',
    name: 'Deep Space Austerity',
    description: 'Federal budget sequestration reduces initial grant by 20%, but all validated science points receive a 1.35x bonus.',
    badge: 'TIGHT BUDGET',
    solarMultiplier: 1.0,
    batteryDrainMultiplier: 1.0,
    budgetMultiplier: 0.8,
    scienceMultiplier: 1.35,
    deltaVMultiplier: 1.0,
  },
  {
    id: 'high-radiation-belt',
    name: 'High Radiation Belt',
    description: 'Intense cosmic rays elevate instrument noise. Observations generate 25% more science if shielded against degradation.',
    badge: 'RAD BELT',
    solarMultiplier: 0.9,
    batteryDrainMultiplier: 1.0,
    budgetMultiplier: 1.0,
    scienceMultiplier: 1.25,
    deltaVMultiplier: 1.0,
  },
  {
    id: 'gravitational-slingshot',
    name: 'Gravitational Slingshot Corridor',
    description: 'Planetary alignment allows opportunistic gravity assists, reducing delta-V requirements by 15%.',
    badge: 'GRAVITY ASSIST',
    solarMultiplier: 1.0,
    batteryDrainMultiplier: 1.0,
    budgetMultiplier: 1.0,
    scienceMultiplier: 1.0,
    deltaVMultiplier: 0.85,
  },
  {
    id: 'deep-space-attenuation',
    name: 'Deep Space Attenuation',
    description: 'Interplanetary plasma clouds throttle DSN downlink speeds by 25%. Onboard data buffer management is critical.',
    badge: 'RADIO LAG',
    solarMultiplier: 1.0,
    batteryDrainMultiplier: 1.0,
    budgetMultiplier: 1.1,
    scienceMultiplier: 1.2,
    deltaVMultiplier: 1.0,
  },
];

export interface DailyChallengeInfo {
  dateString: string; // YYYY-MM-DD
  seed: number;
  mission: MissionScenario;
  modifier: DailyModifier;
  dailyTitle: string;
}

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDailyChallenge(customDate?: string): DailyChallengeInfo {
  const dateString = customDate || getTodayDateString();
  const seed = hashStringToSeed(`skyrift-daily-${dateString}`);

  // Select mission based on deterministic seed
  const missionIndex = Math.abs(seed) % MISSIONS.length;
  const baseMission = MISSIONS[missionIndex];

  // Select modifier based on deterministic seed
  const modifierIndex = Math.abs(Math.floor(seed / 11)) % DAILY_MODIFIERS_POOL.length;
  const modifier = DAILY_MODIFIERS_POOL[modifierIndex];

  const dailyTitles = [
    'Orbital Sentinel: Atmospheric Calving Run',
    'Artemis Surveyor: Shackleton Reconnaissance',
    'Red Frontier: Ares Lakebed Probe',
    'Deep Primitive: Bennu Touchdown Scan',
  ];

  return {
    dateString,
    seed,
    mission: baseMission,
    modifier,
    dailyTitle: dailyTitles[missionIndex] || `${baseMission.name}: Daily Protocol`,
  };
}

export function isDailyChallengeCompleted(dateString: string = getTodayDateString()): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('skyrift_daily_completed_v1');
    if (!raw) return false;
    const records = JSON.parse(raw);
    return !!records[dateString];
  } catch {
    return false;
  }
}

export function markDailyChallengeCompleted(dateString: string = getTodayDateString(), score: number = 0): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('skyrift_daily_completed_v1');
    const records = raw ? JSON.parse(raw) : {};
    records[dateString] = {
      score,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem('skyrift_daily_completed_v1', JSON.stringify(records));
  } catch {
    // ignore
  }
}

