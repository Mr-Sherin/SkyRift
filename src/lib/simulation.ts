import { MissionScenario, SpacecraftComponent, BudgetTotals } from '@/game/types';

export type FlightAction = 'observe' | 'downlink' | 'recharge' | 'maneuver';

export interface FlightLogEntry {
  turn: number;
  day: number;
  action: FlightAction;
  title: string;
  details: string;
  type: 'nominal' | 'warning' | 'alert' | 'success';
  metricsDelta?: {
    batteryDelta?: number;
    dataDelta?: number;
    scienceDelta?: number;
    propellantDelta?: number;
    healthDelta?: number;
  };
}

export interface FlightState {
  turn: number;
  totalTurns: number;
  daysPerTurn: number;
  currentDay: number;
  totalDays: number;

  batterySoC: number;           // 0 to 100%
  batteryWh: number;            // Current Wh
  maxBatteryWh: number;         // Total battery capacity
  powerBalanceW: number;        // Net continuous power balance

  storedDataGb: number;
  maxStorageGb: number;
  downlinkedDataGb: number;
  dataLossGb: number;

  scienceCollected: number;

  propellantRemainingKg: number;
  maxPropellantKg: number;
  deltaVRemainingMs: number;

  craftHealth: number;          // 0 to 100%
  budgetRemaining: number;

  isSafeMode: boolean;
  lastAction: FlightAction | null;
  lastExplanation: string;
  eventLog: FlightLogEntry[];
  isCompleted: boolean;
}

/**
 * Initializes a new flight simulation state from the player's spacecraft build and mission.
 */
export function initFlightState(
  mission: MissionScenario,
  components: SpacecraftComponent[],
  budgets: BudgetTotals,
  activeBlockers: Array<{ system: string; title: string; description?: string }> = []
): FlightState {
  const totalTurns = 8;
  const daysPerTurn = Math.max(1, Math.ceil(mission.durationDays / totalTurns));
  const maxStorageGb = Math.max(8, budgets.totalStorageGb || 32);
  const maxBatteryWh = Math.max(100, budgets.batteryCapacityWh || 500);
  const propellantKg = budgets.propellantMassKg || 0;

  // Requirement 3: Craft health must reflect actual damage from events and unresolved blockers (not 100% by default)
  let initialHealth = 100;
  if (budgets.isMassExceeded) initialHealth -= 20; // Structural overload at launch
  if (budgets.isDeltaVDeficit) initialHealth -= 15; // Trajectory stress & degraded orbit
  if (budgets.isPowerDeficit) initialHealth -= 15; // Brownout & thermal strain
  if (budgets.isOverBudget) initialHealth -= 10; // Procurement shortcuts & unvetted hardware
  if (activeBlockers && activeBlockers.length > 0) {
    const unhandledCount = activeBlockers.filter(
      (b) => b.system !== 'launcher' && b.system !== 'propulsion' && b.system !== 'power' && b.system !== 'budget'
    ).length;
    initialHealth -= unhandledCount * 10;
  }
  const craftHealth = Math.max(25, Math.min(100, initialHealth));

  const hasDeltaVShortfall = budgets.isDeltaVDeficit;
  const shortfallMs = Math.abs(budgets.deltaVMarginMs || budgets.requiredDeltaVMs - budgets.availableDeltaVMs);

  // Requirement 1: If Δv shortfall, craft reaches degraded orbit and log says why
  const initialLogEntry: FlightLogEntry = hasDeltaVShortfall
    ? {
        turn: 1,
        day: 1,
        action: 'maneuver',
        title: 'DEGRADED ORBIT INSERTION',
        details: `Insertion burn fell ${shortfallMs} m/s short: orbit decays early.`,
        type: 'warning',
        metricsDelta: { healthDelta: initialHealth - 100 },
      }
    : {
        turn: 1,
        day: 1,
        action: 'recharge',
        title: 'STAGE SEPARATION & ORBIT INSERTION',
        details: `Spacecraft successfully detached from launch vehicle. Solar arrays unlatched and telemetry locked onto ${mission.destinationName}.`,
        type: 'nominal',
      };

  return {
    turn: 1,
    totalTurns,
    daysPerTurn,
    currentDay: daysPerTurn,
    totalDays: mission.durationDays,

    batterySoC: 100,
    batteryWh: maxBatteryWh,
    maxBatteryWh,
    powerBalanceW: budgets.powerMarginW,

    storedDataGb: 0,
    maxStorageGb,
    downlinkedDataGb: 0,
    dataLossGb: 0,

    scienceCollected: 0,

    propellantRemainingKg: propellantKg,
    maxPropellantKg: propellantKg,
    deltaVRemainingMs: budgets.availableDeltaVMs,

    craftHealth,
    budgetRemaining: budgets.remainingCredits,

    isSafeMode: false,
    lastAction: null,
    lastExplanation: hasDeltaVShortfall
      ? `Insertion burn fell ${shortfallMs} m/s short: spacecraft entered degraded orbit. Trajectory corrections restricted.`
      : `Mission initialized. Spacecraft in nominal ${mission.destinationName} transfer trajectory. All systems online.`,
    eventLog: [initialLogEntry],
    isCompleted: false,
  };
}

/**
 * Pure step function: computes the next flight state deterministically
 * based on the chosen action and the craft's engineering parameters.
 */
export function simulateTurn(
  prev: FlightState,
  action: FlightAction,
  mission: MissionScenario,
  components: SpacecraftComponent[],
  budgets: BudgetTotals
): FlightState {
  if (prev.isCompleted) return prev;

  const hoursInTurn = prev.daysPerTurn * 24;
  const nextTurn = prev.turn + 1;
  const nextDay = Math.min(prev.totalDays, prev.turn * prev.daysPerTurn);
  const isLastTurn = prev.turn >= prev.totalTurns;

  // 1. Solar generation at destination (1/r^2 law) + RTG
  const solarDistance = mission.distanceAu;
  let solarGen1Au = 0;
  let constantRtg = 0;
  components.forEach((c) => {
    if (c.id === 'eps-rtg-nextgen') {
      constantRtg += c.powerGenW || 0;
    } else if (c.powerGenW) {
      solarGen1Au += c.powerGenW;
    }
  });
  const solarGenDestinationW = solarGen1Au * (1 / Math.pow(solarDistance, 2)) + constantRtg;

  // Eclipse calculations per turn
  const orbitsPerTurn = (hoursInTurn * 60) / Math.max(30, mission.orbitPeriodMinutes);
  const totalEclipseHours = (orbitsPerTurn * mission.eclipseMinutesPerOrbit) / 60;
  const sunlightHours = Math.max(0, hoursInTurn - totalEclipseHours);

  // Comms and Storage capabilities
  const commsPart = components.find((c) => c.subsystem === 'communications');
  const downlinkSpeedMbps = commsPart?.downlinkMbps || commsPart?.downlinkRate || 0.05;

  // Science parts
  const scienceParts = components.filter((c) => c.subsystem === 'payload');
  const totalDataRatePerHour = scienceParts.reduce(
    (sum, c) => sum + (c.dataGenMbPerHour || c.dataGenerated || 40),
    0
  );
  const totalScienceValue = scienceParts.reduce((sum, c) => {
    const match = c.scienceTarget === 'all' || c.scienceTarget === mission.destination;
    return sum + (c.scienceValue || 100) * (match ? 1.0 : 0.4);
  }, 0);

  // Power draw baselines
  const baseBusDrawW = Math.max(10, budgets.powerDrawActiveW * 0.35);
  const instrumentDrawW = budgets.powerDrawActiveW * 0.65;

  let batteryWh = prev.batteryWh;
  let storedDataGb = prev.storedDataGb;
  let downlinkedDataGb = prev.downlinkedDataGb;
  let dataLossGb = prev.dataLossGb;
  let scienceCollected = prev.scienceCollected;
  let propellantRemainingKg = prev.propellantRemainingKg;
  let deltaVRemainingMs = prev.deltaVRemainingMs;
  let craftHealth = prev.craftHealth;
  let isSafeMode = prev.isSafeMode;

  let actionTitle = '';
  let actionDetails = '';
  let explanation = '';
  let logType: 'nominal' | 'warning' | 'alert' | 'success' = 'nominal';

  // If in safe mode, forced to recharge
  const effectiveAction: FlightAction = isSafeMode ? 'recharge' : action;

  if (isSafeMode) {
    explanation = 'Craft was in SAFE MODE. Turn spent running low-power thermal heaters and solar re-acquisition.';
  }

  // --------------------------------------------------------------------------
  // ACTION EXECUTION
  // --------------------------------------------------------------------------
  switch (effectiveAction) {
    case 'observe': {
      actionTitle = 'SCIENCE OBSERVATION SEQUENCE';
      // Science data generated
      const generatedMb = totalDataRatePerHour * (hoursInTurn * 0.3); // 30% duty cycle
      const generatedGb = Math.round((generatedMb / 1024) * 10) / 10;
      storedDataGb += generatedGb;

      // Science points proportional to instrument fit
      // Requirement 1: a science multiplier penalty applies for delta-V shortfall (degraded orbit)
      const dVPenaltyMultiplier = budgets.isDeltaVDeficit ? 0.65 : 1.0;
      const earnedSci = Math.round((totalScienceValue / prev.totalTurns) * 1.25 * dVPenaltyMultiplier);
      scienceCollected += earnedSci;

      // Power consumption
      const totalPowerDraw = baseBusDrawW + instrumentDrawW;
      const netHourlySunlight = solarGenDestinationW - totalPowerDraw;
      const netSunlightEnergy = netHourlySunlight * sunlightHours;
      const eclipseDrain = totalPowerDraw * totalEclipseHours;
      const turnNetEnergy = netSunlightEnergy - eclipseDrain;

      batteryWh = Math.min(prev.maxBatteryWh, Math.max(0, batteryWh + turnNetEnergy));

      actionDetails = `Activated instruments for ${Math.round(hoursInTurn * 0.3)}h. Gathered +${generatedGb} GB observations (+${earnedSci} science points).`;
      explanation = `Observation consumed ${Math.round(totalPowerDraw)}W. Sun intensity at ${solarDistance} AU generated ${Math.round(solarGenDestinationW)}W during daylight.`;
      if (budgets.isDeltaVDeficit) {
        explanation += ` [DEGRADED ORBIT: Science yield penalized by 35% due to orbit altitude decay.]`;
      }
      break;
    }

    case 'downlink': {
      actionTitle = 'DEEP SPACE NETWORK DOWNLINK';
      // DSN window transmission capacity
      // 1 Mbps = ~0.45 GB per hour. 25% daily DSN pass window.
      const dsnContactHours = hoursInTurn * 0.25;
      const maxTransmitGb = Math.round(((downlinkSpeedMbps * 3600) / 8000) * dsnContactHours * 10) / 10;
      const transmittedGb = Math.min(storedDataGb, Math.max(1, maxTransmitGb));

      storedDataGb = Math.max(0, Math.round((storedDataGb - transmittedGb) * 10) / 10);
      downlinkedDataGb = Math.round((downlinkedDataGb + transmittedGb) * 10) / 10;

      // Transmitting also yields verified ground science points
      const downlinkScienceReward = Math.round(transmittedGb * 3.5);
      scienceCollected += downlinkScienceReward;

      // Moderate transmitter power draw
      const transmitDraw = baseBusDrawW + 35;
      const netEnergy = (solarGenDestinationW - transmitDraw) * sunlightHours - transmitDraw * totalEclipseHours;
      batteryWh = Math.min(prev.maxBatteryWh, Math.max(0, batteryWh + netEnergy));

      actionDetails = `Aimed high-gain dish at Earth DSN. Successfully downlinked ${transmittedGb} GB telemetry (${downlinkSpeedMbps} Mbps link).`;
      explanation = `Transmitted ${transmittedGb} GB during ${Math.round(dsnContactHours)}h of Goldstone/Canberra DSN visibility. Stored buffer reduced.`;
      break;
    }

    case 'recharge': {
      actionTitle = 'SOLAR RECHARGE & BUS CONSERVATION';
      // Low bus draw, maximum power recharge
      const idleDraw = Math.max(4, baseBusDrawW * 0.4);
      const sunlightEnergy = (solarGenDestinationW - idleDraw) * sunlightHours;
      const eclipseDrain = idleDraw * totalEclipseHours;
      const netEnergy = sunlightEnergy - eclipseDrain;

      batteryWh = Math.min(prev.maxBatteryWh, Math.max(0, batteryWh + netEnergy));

      // Health recovery (modest recovery from maintenance, preserves underlying damage history)
      craftHealth = Math.min(100, craftHealth + 8);
      isSafeMode = false;

      actionDetails = `Payload instruments idled. Oriented panels for peak solar irradiance. Battery bank replenished.`;
      explanation = `Recharge generated a net surplus of ${Math.round(Math.max(0, netEnergy))} Wh. Subsystem thermals stabilized (+8% craft health).`;
      break;
    }

    case 'maneuver': {
      actionTitle = 'ORBITAL MANEUVER TRIM BURN';
      // Requirement 1: Orbital Trim Burns are limited or unavailable when propellant/Δv is insufficient
      if (propellantRemainingKg <= 0 || deltaVRemainingMs <= 0 || budgets.availableDeltaVMs === 0) {
        actionTitle = 'ORBITAL TRIM BURN ABORTED';
        actionDetails = 'Propellant exhausted. Attitude control thrusters cannot execute orbital trajectory trim.';
        explanation = 'Trim burn failed: spacecraft lacks delta-v and propellant to correct orbit.';
        logType = 'alert';
        craftHealth = Math.max(10, craftHealth - 12);
        break;
      }

      // Burn propellant to correct trajectory
      const burnKg = Math.min(propellantRemainingKg, Math.max(4, Math.round(prev.maxPropellantKg * 0.18)));
      propellantRemainingKg = Math.max(0, propellantRemainingKg - burnKg);

      const dVSpent = budgets.availableDeltaVMs > 0 && prev.maxPropellantKg > 0
        ? Math.round((burnKg / prev.maxPropellantKg) * budgets.availableDeltaVMs)
        : 80;
      deltaVRemainingMs = Math.max(0, deltaVRemainingMs - dVSpent);

      // Reaction wheels / avionics draw during burn
      const burnDraw = baseBusDrawW + 40;
      const netEnergy = (solarGenDestinationW - burnDraw) * sunlightHours - burnDraw * totalEclipseHours;
      batteryWh = Math.min(prev.maxBatteryWh, Math.max(0, batteryWh + netEnergy));

      actionDetails = `Fired orbital thrusters for trajectory insertion. Expended ${burnKg} kg propellant (-${dVSpent} m/s Δv).`;
      explanation = `Maneuver burn stabilized orbital apoapsis. Propellant reserves now at ${Math.round(propellantRemainingKg)} kg.`;
      break;
    }
  }

  // --------------------------------------------------------------------------
  // RULES CHECK 1: STORAGE BUFFER OVERFLOW
  // --------------------------------------------------------------------------
  if (storedDataGb > prev.maxStorageGb) {
    const overflow = Math.round((storedDataGb - prev.maxStorageGb) * 10) / 10;
    dataLossGb = Math.round((dataLossGb + overflow) * 10) / 10;
    storedDataGb = prev.maxStorageGb;
    logType = 'warning';
    explanation += ` [BUFFER OVERFLOW: Solid-state storage full! ${overflow} GB of oldest observations discarded. Run a Downlink turn soon!]`;
  }

  // --------------------------------------------------------------------------
  // RULES CHECK 2: BATTERY DEPLETION -> SAFE MODE
  // --------------------------------------------------------------------------
  const batteryPct = Math.round((batteryWh / prev.maxBatteryWh) * 100);
  if (batteryWh <= 0 || batteryPct <= 0) {
    isSafeMode = true;
    batteryWh = 0;
    craftHealth = Math.max(10, craftHealth - 25);
    logType = 'alert';
    explanation += ` [BLACKOUT ALERT: Battery drained to 0% during ${mission.eclipseMinutesPerOrbit}-min eclipse shadow! Spacecraft tripped into safe mode.]`;
  }

  const logEntry: FlightLogEntry = {
    turn: prev.turn,
    day: nextDay,
    action: effectiveAction,
    title: actionTitle,
    details: actionDetails,
    type: logType,
  };

  return {
    ...prev,
    turn: nextTurn,
    currentDay: nextDay,
    batterySoC: Math.max(0, Math.min(100, batteryPct)),
    batteryWh: Math.round(batteryWh),
    storedDataGb: Math.round(storedDataGb * 10) / 10,
    downlinkedDataGb: Math.round(downlinkedDataGb * 10) / 10,
    dataLossGb: Math.round(dataLossGb * 10) / 10,
    scienceCollected,
    propellantRemainingKg: Math.round(propellantRemainingKg * 10) / 10,
    deltaVRemainingMs: Math.round(deltaVRemainingMs),
    craftHealth: Math.max(0, Math.min(100, Math.round(craftHealth))),
    isSafeMode,
    lastAction: effectiveAction,
    lastExplanation: explanation,
    eventLog: [logEntry, ...prev.eventLog],
    isCompleted: isLastTurn,
  };
}

