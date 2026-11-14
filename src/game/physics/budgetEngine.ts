import { SpacecraftComponent, MissionScenario, LaunchVehicle, BudgetTotals, PreflightDiagnostic } from '../types';
import { isInstrumentCompatible } from '../../data/missionObjectives';

export const G0 = 9.80665; // Standard Earth gravitational acceleration (m/s^2)
export const SPEED_OF_LIGHT_KM_S = 299792.458; // Speed of light in vacuum (km/s)
export const KM_PER_AU = 149597870.7; // Astronomical Unit in kilometers

export function getMissionDistanceKm(scenario: MissionScenario): number {
  if (scenario.distanceKm) return scenario.distanceKm;
  if (scenario.destination === 'earth') {
    return scenario.orbitAltitudeKm || 600;
  }
  if (scenario.destination === 'moon') {
    return 384400;
  }
  return (scenario.distanceAu || 1.0) * KM_PER_AU;
}

export function getMissionSignalDelay(scenario: MissionScenario): number {
  const distKm = getMissionDistanceKm(scenario);
  return distKm / SPEED_OF_LIGHT_KM_S;
}

export function calculateEclipseDuration(scenario: MissionScenario): number {
  const radius = scenario.bodyRadiusKm ?? (
    scenario.destination === 'earth' ? 6371 :
    scenario.destination === 'moon' ? 1737.4 :
    scenario.destination === 'mars' ? 3389.5 : 0.245
  );
  const altitude = scenario.orbitAltitudeKm ?? (
    scenario.destination === 'earth' ? 600 :
    scenario.destination === 'moon' ? 100 :
    scenario.destination === 'mars' ? 250 : 1.63
  );
  const period = scenario.orbitPeriodMinutes || 90;
  return (Math.asin(radius / (radius + altitude)) / Math.PI) * period;
}

export interface MissionRequirements {
  baseDeltaVMs: number;
  requiredDeltaVMs: number;
  baseMassLimitKg: number;
  massLimitKg: number;
  baseBudgetCredits: number;
  budgetCredits: number;
  isBeginner: boolean;
  allowanceLabel: string;
}

/**
 * Determine if beginner forgiving margins apply:
 * Applies if player selected Beginner difficulty OR if playing in Standard mode on a Beginner-tier mission (e.g. Orbital Sentinel).
 * Expert mode strictly turns off beginner allowances.
 */
export function isBeginnerAllowance(difficulty?: string, scenario?: MissionScenario): boolean {
  const diff = (difficulty || '').toLowerCase();
  if (diff === 'beginner') return true;
  if (diff === 'expert') return false;
  return (scenario?.difficulty || '').toLowerCase() === 'beginner';
}

/**
 * Single source of truth for all mission requirements and difficulty allowances.
 * Beginner mode uses forgiving margins:
 * - Δv required x0.9 (10% less Δv needed)
 * - mass limit x1.2 (20% more mass allowed)
 * - budget grant x1.25
 */
export function getMissionRequirements(
  scenario: MissionScenario,
  difficulty: 'beginner' | 'standard' | 'expert' | string = 'standard',
  launcher?: LaunchVehicle | null,
  bonusCredits: number = 0
): MissionRequirements {
  const isBeginner = isBeginnerAllowance(difficulty, scenario);

  const baseDeltaVMs = scenario.minDeltaVMs;
  const requiredDeltaVMs = isBeginner ? Math.round(baseDeltaVMs * 0.90) : baseDeltaVMs;

  const baseCapacity = launcher
    ? (launcher.maxPayloadKg[scenario.destination] || 0)
    : (scenario.maxDesignMassKg || (
        scenario.destination === 'earth' ? 5000 :
        scenario.destination === 'moon' ? 2500 :
        scenario.destination === 'mars' ? 4000 : 9000
      ));
  const baseMassLimitKg = baseCapacity;
  const massLimitKg = isBeginner ? Math.round(baseCapacity * 1.20) : baseCapacity;

  const diffStr = (difficulty || '').toLowerCase();
  const budgetMultiplier = isBeginner ? 1.25 : diffStr === 'expert' ? 0.80 : 1.0;
  const baseBudgetCredits = scenario.budgetCredits;
  const budgetCredits = Math.round(baseBudgetCredits * budgetMultiplier) + (bonusCredits || 0);

  return {
    baseDeltaVMs,
    requiredDeltaVMs,
    baseMassLimitKg,
    massLimitKg,
    baseBudgetCredits,
    budgetCredits,
    isBeginner,
    allowanceLabel: 'Beginner allowance: 10% less Δv needed, 20% more mass allowed',
  };
}

/**
 * Calculates full physics and engineering budgets deterministically.
 */
export function calculateBudgetTotals(
  components: SpacecraftComponent[],
  scenario: MissionScenario,
  launcher: LaunchVehicle | null,
  difficulty: 'beginner' | 'standard' | 'expert' = 'standard',
  bonusCredits: number = 0
): BudgetTotals {
  let dryMassKg = 0;
  let propellantMassKg = 0;
  let powerGen1AuW = 0;
  let batteryCapacityWh = 0;
  let powerDrawActiveW = 0;
  let totalCostCredits = launcher ? launcher.costCredits : 0;
  let totalStorageGb = 0;
  let dataRateMbps = 0;
  let pointingAccuracyDeg = 99;
  let estimatedSciencePotential = 0;
  let reliabilitySum = 0;

  // Track propulsion parameters
  let weightedIspNumerator = 0;
  let totalEngineThrust = 0;

  components.forEach(comp => {
    dryMassKg += comp.massKg;
    totalCostCredits += comp.costCredits;
    powerDrawActiveW += comp.powerDrawW;
    reliabilitySum += comp.reliability;

    if (comp.powerGenW) {
      powerGen1AuW += comp.powerGenW;
    }
    if (comp.batteryWh) {
      batteryCapacityWh += comp.batteryWh;
    }
    if (comp.propellantKg) {
      propellantMassKg += comp.propellantKg;
    }
    if (comp.ispS && comp.thrustN) {
      weightedIspNumerator += comp.ispS * comp.thrustN;
      totalEngineThrust += comp.thrustN;
    }
    if (comp.storageGb) {
      totalStorageGb += comp.storageGb;
    }
    if (comp.downlinkMbps && comp.downlinkMbps > dataRateMbps) {
      dataRateMbps = comp.downlinkMbps;
    }
    if (comp.pointingPrecisionDeg && comp.pointingPrecisionDeg < pointingAccuracyDeg) {
      pointingAccuracyDeg = comp.pointingPrecisionDeg;
    }
    if (comp.scienceValue) {
      // Relevance multiplier: if instrument matches scenario destination or 'all'
      const match = comp.scienceTarget === 'all' || comp.scienceTarget === scenario.destination;
      estimatedSciencePotential += comp.scienceValue * (match ? 1.0 : 0.4);
    }
  });

  const totalMassKg = dryMassKg + propellantMassKg;
  const reqs = getMissionRequirements(scenario, difficulty, launcher, bonusCredits);
  const launchCapacityKg = launcher ? reqs.massLimitKg : reqs.baseMassLimitKg;
  const isMassExceeded = totalMassKg > (launcher ? launchCapacityKg : reqs.massLimitKg);

  // Inverse-Square Law: Solar power at destination
  // P(r) = P_1AU * (1 / r^2)
  const solarDistanceAu = scenario.distanceAu;
  // If component is RTG (constant nuclear power), it shouldn't attenuate with distance.
  let solarGenOnlyW = 0;
  let constantRtgW = 0;
  components.forEach(c => {
    if (c.id === 'eps-rtg-nextgen') {
      constantRtgW += c.powerGenW || 0;
    } else if (c.powerGenW) {
      solarGenOnlyW += c.powerGenW;
    }
  });
  const powerGenDestinationW = (solarGenOnlyW * (1 / Math.pow(solarDistanceAu, 2))) + constantRtgW;

  const powerMarginW = powerGenDestinationW - powerDrawActiveW;
  const eclipseHours = scenario.eclipseMinutesPerOrbit / 60;
  const eclipseBatteryDrainWh = powerDrawActiveW * eclipseHours;
  const isPowerDeficit = powerMarginW < 0 || (batteryCapacityWh < eclipseBatteryDrainWh);

  // Ideal Rocket Equation (Tsiolkovsky):
  // delta_v = Isp * g0 * ln(m0 / mf)
  // m0 = totalMassKg (dry + propellant), mf = dryMassKg
  let effectiveIsp = 0;
  if (totalEngineThrust > 0) {
    effectiveIsp = weightedIspNumerator / totalEngineThrust;
  }
  let availableDeltaVMs = 0;
  if (effectiveIsp > 0 && totalMassKg > dryMassKg && dryMassKg > 0) {
    availableDeltaVMs = effectiveIsp * G0 * Math.log(totalMassKg / dryMassKg);
  }

  const requiredDeltaVMs = reqs.requiredDeltaVMs;
  const deltaVMarginMs = availableDeltaVMs - requiredDeltaVMs;
  const isDeltaVDeficit = deltaVMarginMs < 0;

  const effectiveScenarioBudget = reqs.budgetCredits;
  const remainingCredits = effectiveScenarioBudget - totalCostCredits;
  const isOverBudget = remainingCredits < 0;

  const systemReliabilityAverage = components.length > 0
    ? reliabilitySum / components.length
    : 0;

  return {
    // Unified computed totals
    totalMass: Math.round(totalMassKg * 10) / 10,
    totalPower: {
      generation: Math.round(powerGenDestinationW),
      consumption: Math.round(powerDrawActiveW),
      net: Math.round(powerMarginW),
    },
    totalCost: Math.round(totalCostCredits),
    availableDeltaV: Math.round(availableDeltaVMs),
    dataRate: dataRateMbps,
    downlinkRate: dataRateMbps,

    dryMassKg: Math.round(dryMassKg * 10) / 10,
    propellantMassKg: Math.round(propellantMassKg * 10) / 10,
    totalMassKg: Math.round(totalMassKg * 10) / 10,
    launchCapacityKg,
    isMassExceeded,

    powerGen1AuW: Math.round(powerGen1AuW),
    powerGenDestinationW: Math.round(powerGenDestinationW),
    powerDrawActiveW: Math.round(powerDrawActiveW),
    powerMarginW: Math.round(powerMarginW),
    batteryCapacityWh: Math.round(batteryCapacityWh),
    eclipseBatteryDrainWh: Math.round(eclipseBatteryDrainWh),
    isPowerDeficit,

    totalCostCredits: Math.round(totalCostCredits),
    remainingCredits: Math.round(remainingCredits),
    isOverBudget,

    availableDeltaVMs: Math.round(availableDeltaVMs),
    requiredDeltaVMs: Math.round(requiredDeltaVMs),
    deltaVMarginMs: Math.round(deltaVMarginMs),
    isDeltaVDeficit,

    totalStorageGb: Math.round(totalStorageGb),
    dataRateMbps,
    pointingAccuracyDeg: pointingAccuracyDeg === 99 ? 0 : pointingAccuracyDeg,
    estimatedSciencePotential: Math.round(estimatedSciencePotential),
    systemReliabilityAverage: Math.round(systemReliabilityAverage * 100) / 100,
    signalDelaySeconds: Math.round(getMissionSignalDelay(scenario) * 1000) / 1000,
  };
}

/**
 * Runs deep automated preflight diagnostics to guarantee 0 launch failure blindspots.
 */
export function runPreflightDiagnostics(
  components: SpacecraftComponent[],
  scenario: MissionScenario,
  launcher: LaunchVehicle | null,
  budgets: BudgetTotals
): PreflightDiagnostic[] {
  const diagnostics: PreflightDiagnostic[] = [];

  // 1. Missing Subsystems
  scenario.requiredSubsystems.forEach(sub => {
    const hasSub = components.some(c => c.subsystem === sub);
    if (!hasSub) {
      diagnostics.push({
        type: 'error',
        title: `Missing Required Subsystem: ${sub.toUpperCase()}`,
        description: `Mission "${scenario.name}" requires an active ${sub} module before launch clearance.`,
        recommendation: `Add a ${sub} component from the catalog.`,
        system: sub,
      });
    }
  });

  // 1b. Mission Objective Science Instrument Compatibility Check
  const objectiveType = scenario.objectiveType;
  if (objectiveType) {
    const hasCompatibleScience = components.some(
      (c) => c.subsystem === 'payload' && isInstrumentCompatible(c.id, objectiveType)
    );
    if (!hasCompatibleScience) {
      diagnostics.push({
        type: 'error',
        title: 'No Compatible Primary Science Instrument',
        description: `Mission "${scenario.name}" is an ${scenario.objectiveLabel || objectiveType} mission and requires at least one compatible primary science instrument to fulfill mission objectives.`,
        recommendation: `Install a compatible instrument in the Science tab matching the mission objective.`,
        system: 'payload',
      });
    }
  }

  // 2. Launcher Selection & Mass Limit
  if (!launcher) {
    if (budgets.isMassExceeded) {
      diagnostics.push({
        type: 'error',
        title: 'Craft Mass Exceeds Mission Design Limit',
        description: `Spacecraft mass (${budgets.totalMassKg} kg) exceeds mission envelope limit (${scenario.maxDesignMassKg || 4500} kg).`,
        recommendation: 'Strip down non-critical modules or choose a lighter bus structure.',
        system: 'launcher',
      });
    }
  } else if (budgets.isMassExceeded) {
    const excess = Math.round(budgets.totalMassKg - budgets.launchCapacityKg);
    diagnostics.push({
      type: 'error',
      title: 'Payload Mass Exceeds Rocket Capacity',
      description: `Spacecraft mass (${budgets.totalMassKg} kg) exceeds ${launcher.name}'s limit of ${budgets.launchCapacityKg} kg to ${scenario.destinationName} by ${excess} kg.`,
      recommendation: 'Upgrade to a heavier launcher or strip down non-critical instruments.',
      system: 'launcher',
    });
  }

  // 3. Power Generation at Destination (Inverse Square Law)
  if (budgets.powerMarginW < 0) {
    diagnostics.push({
      type: 'error',
      title: 'Active Power Deficit at Destination',
      description: `At ${scenario.distanceAu} AU, available generation (${budgets.powerGenDestinationW} W) is below active subsystem draw (${budgets.powerDrawActiveW} W).`,
      recommendation: scenario.distanceAu > 1.4
        ? 'Solar drops sharply past Mars. Install an RTG nuclear generator or larger deployable arrays.'
        : 'Install additional solar array wings or lower instrument power draw.',
      system: 'power',
    });
  }

  // 4. Battery Eclipse Drain Check
  if (budgets.batteryCapacityWh < budgets.eclipseBatteryDrainWh) {
    diagnostics.push({
      type: 'error',
      title: 'Battery Reserve Inadequate for Eclipse',
      description: `Orbit eclipse is ${scenario.eclipseMinutesPerOrbit} minutes (${budgets.eclipseBatteryDrainWh} Wh needed), but onboard battery is only ${budgets.batteryCapacityWh} Wh.`,
      recommendation: 'Install a dedicated Li-Ion battery pack or reduce baseline power consumption.',
      system: 'power',
    });
  }

  // 5. Delta-V Propulsion Check
  if (budgets.isDeltaVDeficit && budgets.requiredDeltaVMs > 0) {
    diagnostics.push({
      type: 'error',
      title: 'Insufficient Delta-V Maneuver Capability',
      description: `Available Δv (${budgets.availableDeltaVMs} m/s) cannot fulfill mission trajectory requirements (${budgets.requiredDeltaVMs} m/s). Short by ${Math.abs(budgets.deltaVMarginMs)} m/s.`,
      recommendation: 'Select a higher Isp engine (e.g. Bipropellant or Ion) and expand propellant tankage.',
      system: 'propulsion',
    });
  }

  // 6. Monetary Budget Check
  if (budgets.isOverBudget) {
    diagnostics.push({
      type: 'error',
      title: 'Mission Cost Exceeds Agency Grant',
      description: `Total mission expenditures exceed available budget by ${Math.abs(budgets.remainingCredits).toLocaleString()} Credits.`,
      recommendation: 'Optimize component selection or choose a more economical launch provider.',
      system: 'budget',
    });
  }

  // 7. Data Storage & Downlink Bottleneck Warning
  if (budgets.totalStorageGb === 0) {
    diagnostics.push({
      type: 'error',
      title: 'Zero On-Board Data Storage (SSDR)',
      description: 'Flight computer has no solid-state data recorder to store science observations between ground passes.',
      recommendation: 'Install a flight computer or payload processor with storage.',
      system: 'cdh',
    });
  } else if (budgets.totalStorageGb < 64 && scenario.durationDays > 30) {
    diagnostics.push({
      type: 'warning',
      title: 'Low Storage Buffer for Long-Duration Mission',
      description: `With only ${budgets.totalStorageGb} GB of storage, deep space observation gaps might trigger data drops.`,
      recommendation: 'Consider upgrading to a 256 GB or 2 TB edge AI payload processor.',
      system: 'cdh',
    });
  }

  // 8. Communications Range Check
  if (scenario.distanceAu > 1.2 && budgets.dataRateMbps < 1.0) {
    diagnostics.push({
      type: 'warning',
      title: 'High-Latency Downlink Bottleneck',
      description: `Using a low or medium-gain antenna at ${scenario.destinationName} will restrict downlink to ${budgets.dataRateMbps} Mbps.`,
      recommendation: 'Upgrade to a High-Gain Cassegrain dish for maximum science data return.',
      system: 'communications',
    });
  }

  // 9. Pointing Precision Check for High-Precision Instruments
  const hasNarrowImager = components.some(c => c.id === 'inst-multispectral' || c.id === 'inst-raman-spectro');
  if (hasNarrowImager && budgets.pointingAccuracyDeg > 0.5) {
    diagnostics.push({
      type: 'warning',
      title: 'Coarse Pointing Degrades Optical Instrument Resolution',
      description: `Current GNC pointing uncertainty (±${budgets.pointingAccuracyDeg}°) will cause optical image smearing.`,
      recommendation: 'Install 3-Axis Reaction Wheels or Star Trackers for sub-arcsecond pointing.',
      system: 'gnc',
    });
  }

  return diagnostics;
}

