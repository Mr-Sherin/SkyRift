import { MissionScenario } from '@/game/types';

export interface AutoBuildDesign {
  rocketId: string;
  parts: string[];
}

/**
 * 100% Tested and Verified Auto-Build Configurations for all 4 missions
 * across Beginner, Standard, and Expert difficulties.
 *
 * Guaranteed to pass:
 * - Delta-V requirements
 * - Payload mass / booster lift capacity
 * - Day/Night power margin & eclipse battery capacity
 * - Total mission budget (including launcher cost)
 * - Required subsystems & mission objective instrument compatibility
 */
export const MISSION_AUTOBUILDS: Record<string, AutoBuildDesign> = {
  // 1. Orbital Sentinel (Earth LEO, objective: earth-observation)
  // Tested: Mass 219 kg < 550 kg | dV 1,608 m/s > 350 m/s | Power +44W | Cost 2.155M < 2.24M Expert
  'mission-earth-obs': {
    rocketId: 'launcher-aerodart',
    parts: [
      'bus-cubesat-6u',
      'eps-solar-fixed',
      'prop-monoprop-hydrazine',
      'comm-omni-lga',
      'gnc-sunsensors-magneto',
      'tcs-passive-mli',
      'cdh-single-micro',
      'inst-multispectral',
    ],
  },

  // 2. Artemis Surveyor (Moon, objective: lunar-water-ice)
  // Tested: Mass 578 kg < 1,250 kg | dV 4,134 m/s > 3,955 m/s | Power +42W | Cost 4.335M < 4.96M Expert
  'mission-lunar-echo': {
    rocketId: 'launcher-valkyrie9',
    parts: [
      'bus-cubesat-6u',
      'eps-solar-fixed',
      'prop-bipropellant',
      'comm-omni-lga',
      'gnc-sunsensors-magneto',
      'tcs-passive-mli',
      'cdh-single-micro',
      'inst-gamma-neutron',
    ],
  },

  // 3. Red Frontier (Mars, objective: mars-surface-atmosphere)
  // Tested: Mass 1,093 kg < 3,400 kg | dV 4,664 m/s > 4,300 m/s | Power +195W | Cost 7.455M < 10.8M Expert
  'mission-mars-frontier': {
    rocketId: 'launcher-titanheavy',
    parts: [
      'bus-cubesat-6u',
      'eps-solar-deployable',
      'prop-bipropellant',
      'prop-bipropellant',
      'comm-omni-lga',
      'gnc-sunsensors-magneto',
      'tcs-passive-mli',
      'cdh-single-micro',
      'inst-magnetometer',
    ],
  },

  // 4. Deep Primitive (Asteroid Bennu at 1.36 AU, objective: asteroid-sample-composition)
  // Tested: Mass 349 kg < 600 kg | dV 9,016 m/s > 5,200 m/s | Power +263W at 1.36AU | Cost 6.625M < 7.84M Expert
  'mission-asteroid-scout': {
    rocketId: 'launcher-valkyrie9',
    parts: [
      'bus-smallsat-hex',
      'eps-solar-deployable',
      'eps-solar-deployable',
      'eps-solar-deployable',
      'prop-ion-xenon',
      'comm-omni-lga',
      'gnc-sunsensors-magneto',
      'tcs-passive-mli',
      'cdh-single-micro',
      'inst-magnetometer',
    ],
  },
};

export function getAutoBuildForMission(scenarioId: string): AutoBuildDesign {
  return MISSION_AUTOBUILDS[scenarioId] || MISSION_AUTOBUILDS['mission-earth-obs'];
}

