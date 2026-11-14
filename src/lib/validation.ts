/**
 * SkyRift Physics Validation Layer
 *
 * Independently recomputes spacecraft physical constraints using analytical textbook
 * astrodynamics formulations (not internal game code) and compares them against the
 * game engine's calculated values to verify <1% deviation across sample flight designs.
 */

import { calculateBudgetTotals, getMissionSignalDelay, calculateEclipseDuration } from '../game/physics/budgetEngine';
import { MISSIONS, ROCKETS, PARTS } from '../data/gameData';
import { SpacecraftComponent, MissionScenario, LaunchVehicle } from '../game/types';

// ============================================================================
// 1. INDEPENDENT TEXTBOOK FORMULAS (Standard Astrodynamics / NASA SP-8000)
// ============================================================================

/**
 * Tsiolkovsky Rocket Equation:
 * Δv = Isp · g₀ · ln(m₀ / mf)
 *
 * @param isp Specific impulse in seconds (s)
 * @param wetMassKg Initial total spacecraft wet mass (dry mass + propellant mass in kg)
 * @param dryMassKg Final burnout spacecraft dry mass in kg
 * @returns Available delta-v in m/s
 */
export function textbookDeltaV(isp: number, wetMassKg: number, dryMassKg: number): number {
  if (dryMassKg <= 0 || wetMassKg <= dryMassKg || isp <= 0) return 0;
  const STANDARD_G0 = 9.80665; // Standard gravitational acceleration at sea level (m/s²)
  return isp * STANDARD_G0 * Math.log(wetMassKg / dryMassKg);
}

/**
 * Spherical Planetary Eclipse Duration for Circular Orbit:
 * t_eclipse = (asin(R / (R + h)) / π) · T_orbit
 *
 * @param bodyRadiusKm Central planetary body radius in km (R)
 * @param altitudeKm Orbital altitude above surface in km (h)
 * @param orbitPeriodMinutes Total orbital revolution period in minutes (T)
 * @returns Eclipse duration in dark shadow umbra in minutes
 */
export function textbookEclipseDuration(bodyRadiusKm: number, altitudeKm: number, orbitPeriodMinutes: number): number {
  if (altitudeKm < 0 || bodyRadiusKm <= 0 || orbitPeriodMinutes <= 0) return 0;
  const angularShadowHalfAngle = Math.asin(bodyRadiusKm / (bodyRadiusKm + altitudeKm));
  return (angularShadowHalfAngle / Math.PI) * orbitPeriodMinutes;
}

/**
 * Solar Flux Attenuation (Inverse-Square Law) & Nuclear Power:
 * P(r) = P_1AU · (1 / r²) + P_RTG
 *
 * @param powerAt1AuW Photovoltaic array generation at 1.0 Astronomical Unit in Watts
 * @param distanceAu Heliocentric distance from Sun in Astronomical Units (r)
 * @param rtgPowerW Constant radioisotope thermoelectric generator power in Watts
 * @returns Total electrical generation available at destination in Watts
 */
export function textbookSolarPower(powerAt1AuW: number, distanceAu: number, rtgPowerW: number = 0): number {
  if (distanceAu <= 0) return powerAt1AuW + rtgPowerW;
  const solarAtDestination = powerAt1AuW * (1 / (distanceAu * distanceAu));
  return solarAtDestination + rtgPowerW;
}

/**
 * Deep Space Speed-of-Light Radio Latency:
 * t_delay = d / c
 *
 * @param distanceKm One-way propagation distance in kilometers (d)
 * @returns One-way light-time signal delay in seconds
 */
export function textbookSignalDelay(distanceKm: number): number {
  const SPEED_OF_LIGHT_KM_S = 299792.458; // Vacuum speed of light c (km/s)
  return distanceKm / SPEED_OF_LIGHT_KM_S;
}

// ============================================================================
// 2. SAMPLE SPACECRAFT DESIGNS (5 CONFIGURATIONS PER MISSION = 20 TOTAL)
// ============================================================================

export interface SampleDesign {
  id: string;
  name: string;
  missionId: string;
  partIds: string[];
  launcherId?: string;
  description: string;
}

export const SAMPLE_DESIGNS: SampleDesign[] = [
  // --------------------------------------------------------------------------
  // Mission 1: Orbital Sentinel (LEO Earth Observation)
  // --------------------------------------------------------------------------
  {
    id: 'sentinel-lightweight-cubesat',
    name: 'Nano-Sentinel 6U',
    missionId: 'mission-earth-obs',
    launcherId: 'launcher-aerodart',
    description: 'Ultra-light CubeSat for fast tactical environmental imaging',
    partIds: [
      'bus-cubesat-6u',
      'eps-solar-fixed',
      'prop-coldgas-rcs',
      'comm-omni-lga',
      'gnc-sunsensors-magneto',
      'tcs-passive-mli',
      'cdh-single-micro',
      'inst-multispectral',
    ],
  },
  {
    id: 'sentinel-smallsat-standard',
    name: 'Standard Sentinel Hex',
    missionId: 'mission-earth-obs',
    launcherId: 'launcher-aerodart',
    description: 'Balanced SmallSat with tracking solar wings and hydrazine orbit adjustments',
    partIds: [
      'bus-smallsat-hex',
      'eps-solar-deployable',
      'prop-monoprop-hydrazine',
      'comm-parabolic-mga',
      'gnc-reactionwheels-imu',
      'tcs-passive-mli',
      'cdh-single-micro',
      'inst-multispectral',
    ],
  },
  {
    id: 'sentinel-heavy-battery-buffer',
    name: 'Nightshade Resilience Probe',
    missionId: 'mission-earth-obs',
    launcherId: 'launcher-valkyrie9',
    description: 'Equipped with heavy deep-cycle Li-Ion battery pack for dark eclipse passes',
    partIds: [
      'bus-smallsat-hex',
      'eps-solar-deployable',
      'eps-li-ion-heavy',
      'prop-monoprop-hydrazine',
      'comm-parabolic-mga',
      'gnc-reactionwheels-imu',
      'tcs-active-louvers',
      'cdh-radhard-dual',
      'inst-multispectral',
    ],
  },
  {
    id: 'sentinel-high-delta-v',
    name: 'Sentinel Orbit Climber',
    missionId: 'mission-earth-obs',
    launcherId: 'launcher-valkyrie9',
    description: 'High-thrust bipropellant engine configuration for orbit raising',
    partIds: [
      'bus-smallsat-hex',
      'eps-solar-deployable',
      'prop-bipropellant',
      'comm-parabolic-mga',
      'gnc-reactionwheels-imu',
      'tcs-passive-mli',
      'cdh-radhard-dual',
      'inst-multispectral',
    ],
  },
  {
    id: 'sentinel-autonomous-edge',
    name: 'Autonomous AI Climate Scout',
    missionId: 'mission-earth-obs',
    launcherId: 'launcher-valkyrie9',
    description: 'Dual star trackers with neuromorphic flash processing for real-time edge detection',
    partIds: [
      'bus-deepspace-titanium',
      'eps-solar-deployable',
      'prop-bipropellant',
      'comm-deepspace-hga',
      'gnc-dual-startracker',
      'tcs-active-louvers',
      'cdh-ai-edge',
      'inst-multispectral',
    ],
  },

  // --------------------------------------------------------------------------
  // Mission 2: Artemis Surveyor (Lunar Polar Orbit)
  // --------------------------------------------------------------------------
  {
    id: 'artemis-polar-prospector',
    name: 'Polar Ice Prospector',
    missionId: 'mission-lunar-echo',
    launcherId: 'launcher-valkyrie9',
    description: 'Hydrazine propelled probe with gamma-ray neutron spectrometer',
    partIds: [
      'bus-smallsat-hex',
      'eps-solar-deployable',
      'prop-monoprop-hydrazine',
      'comm-parabolic-mga',
      'gnc-reactionwheels-imu',
      'tcs-passive-mli',
      'cdh-radhard-dual',
      'inst-gamma-neutron',
    ],
  },
  {
    id: 'artemis-heavy-biprop-surveyor',
    name: 'Artemis Heavy Mapper',
    missionId: 'mission-lunar-echo',
    launcherId: 'launcher-valkyrie9',
    description: 'Bipropellant main engine with 420 kg fuel for lunar orbit capture',
    partIds: [
      'bus-deepspace-titanium',
      'eps-solar-deployable',
      'eps-li-ion-heavy',
      'prop-bipropellant',
      'comm-parabolic-mga',
      'gnc-reactionwheels-imu',
      'tcs-active-louvers',
      'cdh-radhard-dual',
      'inst-gamma-neutron',
    ],
  },
  {
    id: 'artemis-dual-sensor-platform',
    name: 'Radar & Neutron Explorer',
    missionId: 'mission-lunar-echo',
    launcherId: 'launcher-titanheavy',
    description: 'Carries synthetic aperture radar and neutron sensor to prospect crater water-ice',
    partIds: [
      'bus-deepspace-titanium',
      'eps-solar-deployable',
      'eps-li-ion-heavy',
      'prop-bipropellant',
      'comm-deepspace-hga',
      'gnc-dual-startracker',
      'tcs-active-louvers',
      'cdh-radhard-dual',
      'inst-sar-radar',
      'inst-gamma-neutron',
    ],
  },
  {
    id: 'artemis-high-efficiency-ion',
    name: 'Lunar Ion Drifter',
    missionId: 'mission-lunar-echo',
    launcherId: 'launcher-valkyrie9',
    description: 'High-Isp xenon electrostatic thruster for low-energy lunar transfer',
    partIds: [
      'bus-smallsat-hex',
      'eps-solar-deployable',
      'prop-ion-xenon',
      'comm-parabolic-mga',
      'gnc-reactionwheels-imu',
      'tcs-passive-mli',
      'cdh-single-micro',
      'inst-gamma-neutron',
    ],
  },
  {
    id: 'artemis-minimalist-scout',
    name: 'Artemis Micro-Scout',
    missionId: 'mission-lunar-echo',
    launcherId: 'launcher-valkyrie9',
    description: 'Streamlined payload configuration focusing purely on volatile water detection',
    partIds: [
      'bus-cubesat-6u',
      'eps-solar-deployable',
      'prop-monoprop-hydrazine',
      'comm-omni-lga',
      'gnc-sunsensors-magneto',
      'tcs-passive-mli',
      'cdh-single-micro',
      'inst-gamma-neutron',
    ],
  },

  // --------------------------------------------------------------------------
  // Mission 3: Red Frontier (Mars Transfer & Areocentric Orbit)
  // --------------------------------------------------------------------------
  {
    id: 'mars-interplanetary-cruiser',
    name: 'Ares Deep Cruiser',
    missionId: 'mission-mars-frontier',
    launcherId: 'launcher-titanheavy',
    description: 'Deployable tracking arrays with bipropellant propulsion for Mars capture',
    partIds: [
      'bus-deepspace-titanium',
      'eps-solar-deployable',
      'prop-bipropellant',
      'comm-deepspace-hga',
      'gnc-dual-startracker',
      'tcs-active-louvers',
      'cdh-radhard-dual',
      'inst-magnetometer',
    ],
  },
  {
    id: 'mars-rtg-powered-flagship',
    name: 'Curiosity-Class RTG Scout',
    missionId: 'mission-mars-frontier',
    launcherId: 'launcher-titanheavy',
    description: 'Next-Gen RTG provides continuous 135 W nuclear power independent of solar loss',
    partIds: [
      'bus-deepspace-titanium',
      'eps-rtg-nextgen',
      'prop-bipropellant',
      'comm-deepspace-hga',
      'gnc-dual-startracker',
      'tcs-passive-mli',
      'cdh-radhard-dual',
      'inst-raman-spectro',
    ],
  },
  {
    id: 'mars-dual-payload-laboratory',
    name: 'Red Planet Aeronomy Lab',
    missionId: 'mission-mars-frontier',
    launcherId: 'launcher-novastarship',
    description: 'Pairs magnetic boom with laser Raman mineralogy for surface and atmospheric science',
    partIds: [
      'bus-deepspace-titanium',
      'eps-solar-deployable',
      'eps-rtg-nextgen',
      'prop-bipropellant',
      'comm-deepspace-hga',
      'gnc-dual-startracker',
      'tcs-active-louvers',
      'cdh-radhard-dual',
      'inst-magnetometer',
      'inst-raman-spectro',
    ],
  },
  {
    id: 'mars-solar-electric-propulsion',
    name: 'Mars Ion Transfer Rig',
    missionId: 'mission-mars-frontier',
    launcherId: 'launcher-titanheavy',
    description: 'Electrostatic xenon ion engine with 3,800s Isp for spiral interplanetary cruise',
    partIds: [
      'bus-smallsat-hex',
      'eps-solar-deployable',
      'prop-ion-xenon',
      'comm-parabolic-mga',
      'gnc-reactionwheels-imu',
      'tcs-passive-mli',
      'cdh-radhard-dual',
      'inst-magnetometer',
    ],
  },
  {
    id: 'mars-high-battery-reserve',
    name: 'Mars Eclipse Sentinel',
    missionId: 'mission-mars-frontier',
    launcherId: 'launcher-titanheavy',
    description: 'Deployable arrays backed by heavy battery pack to sustain 55-minute Mars shadow passes',
    partIds: [
      'bus-deepspace-titanium',
      'eps-solar-deployable',
      'eps-li-ion-heavy',
      'prop-bipropellant',
      'comm-deepspace-hga',
      'gnc-reactionwheels-imu',
      'tcs-active-louvers',
      'cdh-radhard-dual',
      'inst-raman-spectro',
    ],
  },

  // --------------------------------------------------------------------------
  // Mission 4: Deep Primitive (Near-Earth Asteroid 101955 Bennu)
  // --------------------------------------------------------------------------
  {
    id: 'asteroid-ion-scout',
    name: 'Bennu Ion Rendezvous Probe',
    missionId: 'mission-asteroid-scout',
    launcherId: 'launcher-valkyrie9',
    description: 'High specific impulse xenon electric propulsion designed for microgravity rendezvous',
    partIds: [
      'bus-smallsat-hex',
      'eps-solar-deployable',
      'prop-ion-xenon',
      'comm-parabolic-mga',
      'gnc-reactionwheels-imu',
      'tcs-passive-mli',
      'cdh-radhard-dual',
      'inst-multispectral',
    ],
  },
  {
    id: 'asteroid-biprop-heavy-sampler',
    name: 'Primitive Regolith Cartographer',
    missionId: 'mission-asteroid-scout',
    launcherId: 'launcher-titanheavy',
    description: 'Bipropellant propulsion with dual star trackers for millimeter guidance precision',
    partIds: [
      'bus-deepspace-titanium',
      'eps-solar-deployable',
      'prop-bipropellant',
      'comm-deepspace-hga',
      'gnc-dual-startracker',
      'tcs-active-louvers',
      'cdh-radhard-dual',
      'inst-raman-spectro',
    ],
  },
  {
    id: 'asteroid-nuclear-explorer',
    name: 'Deep Space Nuclear Scout',
    missionId: 'mission-asteroid-scout',
    launcherId: 'launcher-valkyrie9',
    description: 'RTG powered craft providing stable electrical margin out past aphelion',
    partIds: [
      'bus-deepspace-titanium',
      'eps-rtg-nextgen',
      'prop-bipropellant',
      'comm-deepspace-hga',
      'gnc-dual-startracker',
      'tcs-passive-mli',
      'cdh-radhard-dual',
      'inst-raman-spectro',
    ],
  },
  {
    id: 'asteroid-edge-ai-mapper',
    name: 'Autonomous Hazard Mapper',
    missionId: 'mission-asteroid-scout',
    launcherId: 'launcher-novastarship',
    description: 'Neuromorphic edge AI for real-time optical boulder hazard navigation',
    partIds: [
      'bus-deepspace-titanium',
      'eps-solar-deployable',
      'prop-ion-xenon',
      'comm-deepspace-hga',
      'gnc-dual-startracker',
      'tcs-active-louvers',
      'cdh-ai-edge',
      'inst-multispectral',
    ],
  },
  {
    id: 'asteroid-multi-instrument-flagship',
    name: 'Carbonaceous Matrix Flagship',
    missionId: 'mission-asteroid-scout',
    launcherId: 'launcher-novastarship',
    description: 'Carries multispectral camera, Raman spectrometer, and magnetometer for total composition survey',
    partIds: [
      'bus-deepspace-titanium',
      'eps-solar-deployable',
      'eps-rtg-nextgen',
      'prop-bipropellant',
      'comm-deepspace-hga',
      'gnc-dual-startracker',
      'tcs-active-louvers',
      'cdh-radhard-dual',
      'inst-multispectral',
      'inst-magnetometer',
      'inst-raman-spectro',
    ],
  },
];

// ============================================================================
// 3. VALIDATION TEST SUITE RUNNER & RESULTS
// ============================================================================

export interface ValidationMetricComparison {
  missionId: string;
  missionName: string;
  designId: string;
  designName: string;
  metric: 'deltaV' | 'eclipseDuration' | 'solarPower' | 'signalDelay';
  metricLabel: string;
  unit: string;
  gameValue: number;
  textbookValue: number;
  diffPct: number;
  tolerancePct: number;
  passed: boolean;
  notes?: string;
}

export interface ValidationSuiteReport {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  maxDiffPct: number;
  allPassed: boolean;
  results: ValidationMetricComparison[];
  summaryTable: string;
}

export function runValidationSuite(): ValidationSuiteReport {
  const results: ValidationMetricComparison[] = [];
  const TOLERANCE_PCT = 1.0; // Fail test if difference exceeds 1%

  // Build lookup maps
  const partsMap = new Map<string, SpacecraftComponent>();
  PARTS.forEach((p) => partsMap.set(p.id, p));

  const rocketsMap = new Map<string, LaunchVehicle>();
  ROCKETS.forEach((r) => rocketsMap.set(r.id, r));

  const missionsMap = new Map<string, MissionScenario>();
  MISSIONS.forEach((m) => missionsMap.set(m.id, m));

  SAMPLE_DESIGNS.forEach((sample) => {
    const mission = missionsMap.get(sample.missionId);
    if (!mission) throw new Error(`Unknown missionId ${sample.missionId}`);

    const components = sample.partIds.map((pid) => {
      const c = partsMap.get(pid);
      if (!c) throw new Error(`Unknown partId ${pid}`);
      return c;
    });

    const launcher = sample.launcherId ? rocketsMap.get(sample.launcherId) || null : null;
    const gameBudgets = calculateBudgetTotals(components, mission, launcher);

    // ------------------------------------------------------------------------
    // Metric 1: Delta-V (Δv) from Isp and Mass Ratio
    // ------------------------------------------------------------------------
    let weightedIspNum = 0;
    let totalThrust = 0;
    let dryMass = 0;
    let propellantMass = 0;

    components.forEach((c) => {
      dryMass += c.massKg;
      if (c.propellantKg) propellantMass += c.propellantKg;
      if (c.ispS && c.thrustN) {
        weightedIspNum += c.ispS * c.thrustN;
        totalThrust += c.thrustN;
      }
    });

    const wetMass = dryMass + propellantMass;
    const effectiveIsp = totalThrust > 0 ? weightedIspNum / totalThrust : 0;
    const textbookDeltaVVal = textbookDeltaV(effectiveIsp, wetMass, dryMass);
    const gameDeltaVVal = gameBudgets.availableDeltaVMs;

    const deltaVDiffPct =
      textbookDeltaVVal > 0
        ? (Math.abs(gameDeltaVVal - textbookDeltaVVal) / textbookDeltaVVal) * 100
        : 0;

    results.push({
      missionId: mission.id,
      missionName: mission.name,
      designId: sample.id,
      designName: sample.name,
      metric: 'deltaV',
      metricLabel: 'Available Δv',
      unit: 'm/s',
      gameValue: Math.round(gameDeltaVVal * 10) / 10,
      textbookValue: Math.round(textbookDeltaVVal * 10) / 10,
      diffPct: Math.round(deltaVDiffPct * 1000) / 1000,
      tolerancePct: TOLERANCE_PCT,
      passed: deltaVDiffPct <= TOLERANCE_PCT,
      notes: `Isp=${effectiveIsp.toFixed(0)}s, m₀=${wetMass}kg, mf=${dryMass}kg`,
    });

    // ------------------------------------------------------------------------
    // Metric 2: Eclipse Duration from Altitude (asin(R/(R+h))/pi * Period)
    // ------------------------------------------------------------------------
    const bodyRadius = mission.bodyRadiusKm ?? (
      mission.destination === 'earth' ? 6371 :
      mission.destination === 'moon' ? 1737.4 :
      mission.destination === 'mars' ? 3389.5 : 0.245
    );
    const altitude = mission.orbitAltitudeKm ?? (
      mission.destination === 'earth' ? 600 :
      mission.destination === 'moon' ? 100 :
      mission.destination === 'mars' ? 250 : 1.63
    );
    const period = mission.orbitPeriodMinutes;

    const textbookEclipseVal = textbookEclipseDuration(bodyRadius, altitude, period);
    const gameEclipseVal = mission.eclipseMinutesPerOrbit;

    const eclipseDiffPct =
      textbookEclipseVal > 0
        ? (Math.abs(gameEclipseVal - textbookEclipseVal) / textbookEclipseVal) * 100
        : 0;

    results.push({
      missionId: mission.id,
      missionName: mission.name,
      designId: sample.id,
      designName: sample.name,
      metric: 'eclipseDuration',
      metricLabel: 'Orbital Eclipse',
      unit: 'min',
      gameValue: Math.round(gameEclipseVal * 100) / 100,
      textbookValue: Math.round(textbookEclipseVal * 100) / 100,
      diffPct: Math.round(eclipseDiffPct * 1000) / 1000,
      tolerancePct: TOLERANCE_PCT,
      passed: eclipseDiffPct <= TOLERANCE_PCT,
      notes: `R=${bodyRadius}km, h=${altitude}km, T=${period}min`,
    });

    // ------------------------------------------------------------------------
    // Metric 3: Solar Power at Distance r (1/r² Attenuation)
    // ------------------------------------------------------------------------
    let solar1AuOnly = 0;
    let rtgConstant = 0;

    components.forEach((c) => {
      if (c.id === 'eps-rtg-nextgen') {
        rtgConstant += c.powerGenW || 0;
      } else if (c.powerGenW) {
        solar1AuOnly += c.powerGenW;
      }
    });

    const textbookPowerVal = textbookSolarPower(solar1AuOnly, mission.distanceAu, rtgConstant);
    const gamePowerVal = gameBudgets.powerGenDestinationW;

    const powerDiffPct =
      textbookPowerVal > 0
        ? (Math.abs(gamePowerVal - textbookPowerVal) / textbookPowerVal) * 100
        : 0;

    results.push({
      missionId: mission.id,
      missionName: mission.name,
      designId: sample.id,
      designName: sample.name,
      metric: 'solarPower',
      metricLabel: 'Destination Power',
      unit: 'W',
      gameValue: Math.round(gamePowerVal * 10) / 10,
      textbookValue: Math.round(textbookPowerVal * 10) / 10,
      diffPct: Math.round(powerDiffPct * 1000) / 1000,
      tolerancePct: TOLERANCE_PCT,
      passed: powerDiffPct <= TOLERANCE_PCT,
      notes: `P_1AU=${solar1AuOnly}W, r=${mission.distanceAu}AU, RTG=${rtgConstant}W`,
    });

    // ------------------------------------------------------------------------
    // Metric 4: Signal Delay (One-Way Light Time d / c)
    // ------------------------------------------------------------------------
    const distanceKm = mission.distanceKm || (mission.destination === 'moon' ? 384400 : mission.destination === 'earth' ? 600 : mission.distanceAu * 149597870.7);
    const textbookSignalVal = textbookSignalDelay(distanceKm);
    const gameSignalVal = getMissionSignalDelay(mission);

    const signalDiffPct =
      textbookSignalVal > 0
        ? (Math.abs(gameSignalVal - textbookSignalVal) / textbookSignalVal) * 100
        : 0;

    results.push({
      missionId: mission.id,
      missionName: mission.name,
      designId: sample.id,
      designName: sample.name,
      metric: 'signalDelay',
      metricLabel: 'Signal Delay',
      unit: 's',
      gameValue: Math.round(gameSignalVal * 1000) / 1000,
      textbookValue: Math.round(textbookSignalVal * 1000) / 1000,
      diffPct: Math.round(signalDiffPct * 1000) / 1000,
      tolerancePct: TOLERANCE_PCT,
      passed: signalDiffPct <= TOLERANCE_PCT,
      notes: `d=${distanceKm.toLocaleString()}km, c=299,792.458km/s`,
    });
  });

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;
  const maxDiffPct = Math.max(...results.map((r) => r.diffPct));

  // Generate ASCII results table
  const lines: string[] = [];
  lines.push('========================================================================================================');
  lines.push('SKYRIFT ASTRODYNAMICS VALIDATION SUITE // INDEPENDENT TEXTBOOK COMPARISON');
  lines.push('========================================================================================================');
  lines.push(
    [
      '#'.padEnd(3),
      'Mission'.padEnd(18),
      'Design Name'.padEnd(28),
      'Metric'.padEnd(18),
      'Game'.padStart(10),
      'Textbook'.padStart(10),
      'Diff %'.padStart(8),
      'Status'.padStart(7),
    ].join(' ')
  );
  lines.push('--------------------------------------------------------------------------------------------------------');

  results.forEach((r, idx) => {
    lines.push(
      [
        String(idx + 1).padEnd(3),
        r.missionName.slice(0, 17).padEnd(18),
        r.designName.slice(0, 27).padEnd(28),
        r.metricLabel.padEnd(18),
        `${r.gameValue}${r.unit}`.padStart(10),
        `${r.textbookValue}${r.unit}`.padStart(10),
        `${r.diffPct.toFixed(3)}%`.padStart(8),
        (r.passed ? 'PASS' : 'FAIL').padStart(7),
      ].join(' ')
    );
  });

  lines.push('========================================================================================================');
  lines.push(
    `TOTAL COMPARISONS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount} | MAX ERROR: ${maxDiffPct.toFixed(3)}% (TOLERANCE: ≤ ${TOLERANCE_PCT}%)`
  );
  lines.push('========================================================================================================');

  return {
    totalTests: results.length,
    passedCount,
    failedCount,
    maxDiffPct,
    allPassed: failedCount === 0,
    results,
    summaryTable: lines.join('\n'),
  };
}

