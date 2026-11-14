import { MissionScenario, BudgetTotals, MissionScoreBreakdown } from '../types';

export type MissionOutcomeCategory = 'Failure' | 'Partial Success' | 'Success';
export type MissionOutcomeKey = 'failure' | 'partial' | 'success';

export interface EvaluatedMissionResult {
  score: number;
  label: MissionOutcomeCategory;
  key: MissionOutcomeKey;
  isSuccess: boolean;
  isPartial: boolean;
  isFailure: boolean;
}

/**
 * Single source of truth for outcome evaluation:
 * - below 40: Failure
 * - 40 - 74: Partial Success
 * - 75+: Success
 */
export function evaluateMissionOutcome(score: number): EvaluatedMissionResult {
  if (score >= 75) {
    return {
      score,
      label: 'Success',
      key: 'success',
      isSuccess: true,
      isPartial: false,
      isFailure: false,
    };
  }
  if (score >= 40) {
    return {
      score,
      label: 'Partial Success',
      key: 'partial',
      isSuccess: false,
      isPartial: true,
      isFailure: false,
    };
  }
  return {
    score,
    label: 'Failure',
    key: 'failure',
    isSuccess: false,
    isPartial: false,
    isFailure: true,
  };
}

/**
 * 100-Point Transparent Rubric:
 * 1. Science Objective: Max 35
 * 2. Trajectory & Orbit: Max 20
 * 3. Data Downlink: Max 15
 * 4. Spacecraft Health: Max 10
 * 5. Budget Efficiency: Max 10
 * 6. Operations Decisions: Max 10
 */
export function calculateMissionScore(
  scenario: MissionScenario,
  budgets: BudgetTotals,
  dataDownlinkedGb: number,
  healthPercent: number,
  operationsPenaltyOrBonus: number,
  reachedOrbit: boolean
): MissionScoreBreakdown {
  const rootCauseAnalysis: string[] = [];
  const recommendations: string[] = [];

  const reqDeltaV = Math.max(1, budgets.requiredDeltaVMs);
  // Trajectory & Δv score proportional to availableΔv / requiredΔv, capped at 1
  const deltaVRatio = Math.max(0, Math.min(1.0, budgets.availableDeltaVMs / reqDeltaV));

  // 1. Science Score (35)
  // Requires craft to be in orbit and have enough delta-v to maintain orbital survey
  let scienceScore = 0;
  if (reachedOrbit && deltaVRatio >= 0.25) {
    const deltaVScienceFactor = Math.min(1.0, (deltaVRatio - 0.25) / 0.5); // 0 at 0.25, 1 at 0.75+
    const dataRatio = Math.min(1.0, dataDownlinkedGb / Math.max(1, budgets.totalStorageGb));
    scienceScore = Math.round(Math.min(35, (budgets.estimatedSciencePotential / 25) * dataRatio * deltaVScienceFactor));
    if (scienceScore < 20) {
      rootCauseAnalysis.push('Science return lower than optimal due to limited payload instrument suitability or trajectory limits.');
      recommendations.push('Select instruments specifically tailored to the destination planetary environment.');
    }
  } else {
    scienceScore = 0;
    rootCauseAnalysis.push('Catastrophic failure to achieve target orbit halted all payload scientific operations.');
  }

  // 2. Trajectory & Orbit (20)
  // Strictly proportional to availableΔv / requiredΔv, capped at 1
  let trajectoryScore = 0;
  if (reachedOrbit) {
    trajectoryScore = Math.round(20 * deltaVRatio);
    if (deltaVRatio < 1.0) {
      rootCauseAnalysis.push(`Sub-optimal orbital insertion: propulsion short by ${Math.abs(budgets.deltaVMarginMs)} m/s.`);
      recommendations.push('Add propellant tanks or choose a higher ISP propulsion system.');
    }
  } else {
    trajectoryScore = 0;
    rootCauseAnalysis.push('Launcher or propulsion failure prevented reaching the target celestial body.');
  }

  // 3. Data Downlink & DSN (15)
  // Depends on actual data downlinked and antenna throughput; craft with no delta-v cannot downlink deep-space science
  let downlinkScore = 0;
  if (reachedOrbit && budgets.dataRateMbps > 0 && deltaVRatio >= 0.25 && dataDownlinkedGb > 0) {
    const targetStorage = Math.max(20, budgets.totalStorageGb);
    const returnRatio = Math.min(1.0, dataDownlinkedGb / targetStorage);
    const linkQuality = budgets.dataRateMbps >= 2.0 ? 1.0 : budgets.dataRateMbps >= 0.5 ? 0.7 : 0.35;
    downlinkScore = Math.round(15 * returnRatio * linkQuality);
    if (budgets.dataRateMbps < 2.0) {
      recommendations.push('Deploy a High-Gain Dish to clear onboard buffers faster during brief DSN passes.');
    }
  } else if (budgets.dataRateMbps <= 0 || dataDownlinkedGb === 0 || deltaVRatio < 0.25) {
    downlinkScore = 0;
    if (reachedOrbit && deltaVRatio >= 0.25) {
      rootCauseAnalysis.push('Low bandwidth or transmitter blackout bottlenecked science telemetry backlogs on Earth.');
    }
  }

  // 4. Spacecraft Health (10)
  const healthScore = Math.round(Math.max(0, Math.min(10, (healthPercent / 100) * 10)));
  if (healthPercent < 70) {
    rootCauseAnalysis.push(`Spacecraft suffered hardware degradation; final subsystem health ended at ${healthPercent}%.`);
    recommendations.push('Install radiation-hardened flight computers and active thermal louvers.');
  }

  // 5. Budget Efficiency (10)
  // Only reward surplus budget if craft has basic flight viability (deltaVRatio >= 0.5)
  let budgetEfficiencyScore = 0;
  if (!budgets.isOverBudget) {
    const costRatio = budgets.totalCostCredits / scenario.budgetCredits;
    let rawBudgetScore = 0;
    if (costRatio <= 0.85) {
      rawBudgetScore = 10;
    } else if (costRatio <= 0.98) {
      rawBudgetScore = 8;
    } else {
      rawBudgetScore = 6;
    }
    const viability = deltaVRatio >= 0.75 ? 1.0 : deltaVRatio >= 0.4 ? (deltaVRatio - 0.4) / 0.35 : 0;
    budgetEfficiencyScore = Math.round(rawBudgetScore * viability);
  } else {
    budgetEfficiencyScore = 0;
    rootCauseAnalysis.push('Exceeded financial grant ceiling.');
  }

  // 6. Operational Decisions (10)
  // Scaled by flight viability so an empty craft that never flew cannot score operational points
  let operationsScore = 0;
  if (deltaVRatio >= 0.25) {
    const opsViability = Math.min(1.0, (deltaVRatio - 0.25) / 0.5);
    operationsScore = Math.max(0, Math.min(10, Math.round((5 + operationsPenaltyOrBonus) * opsViability)));
  }

  const totalScore = Math.min(100, Math.max(0,
    scienceScore +
    trajectoryScore +
    downlinkScore +
    healthScore +
    budgetEfficiencyScore +
    operationsScore
  ));

  const outcome = evaluateMissionOutcome(totalScore);

  return {
    scienceScore,
    trajectoryScore,
    downlinkScore,
    spacecraftHealthScore: healthScore,
    budgetEfficiencyScore,
    operationsScore,
    totalScore,
    tier: outcome.label,
    rootCauseAnalysis,
    recommendations,
  };
}

