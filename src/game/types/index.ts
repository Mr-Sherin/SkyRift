export type SubsystemType =
  | 'structure'
  | 'power'
  | 'propulsion'
  | 'communications'
  | 'gnc'
  | 'thermal'
  | 'cdh'
  | 'payload';

export type GamePhase = 'design' | 'launch' | 'flight' | 'debrief';
export type GameDifficulty = 'beginner' | 'standard' | 'expert';

export type MissionObjectiveType =
  | 'earth-observation'
  | 'lunar-water-ice'
  | 'mars-surface-atmosphere'
  | 'asteroid-sample-composition';

export type SourceStatus = 'nasa' | 'derived' | 'placeholder';

export interface ValueSourceMeta {
  status: SourceStatus;
  url: string;
  label?: string;
  citation?: string;
}

export interface SpacecraftComponent {
  id: string;
  name: string;
  subsystem: SubsystemType;
  description: string;

  // Primary unified fields
  mass: number;
  power: number;
  cost: number;
  reliability: number;         // 0.0 - 1.0

  // Backward compatibility fields
  massKg: number;
  powerDrawW: number;
  costCredits: number;

  // Science parts specific
  dataGenerated?: number;
  dataGenMbPerHour?: number;
  scienceValue?: number;
  scienceTarget?: 'earth' | 'moon' | 'mars' | 'asteroid' | 'all';
  compatibleObjectives?: MissionObjectiveType[];
  incompatibleReasons?: Partial<Record<MissionObjectiveType, string>>;

  // Comms parts specific
  downlinkRate?: number;
  downlinkMbps?: number;

  // Power & Propulsion specifics
  powerGenW?: number;          // At 1 AU
  batteryWh?: number;
  ispS?: number;               // Specific Impulse (seconds)
  propellantKg?: number;       // Propellant tank load
  thrustN?: number;
  pointingPrecisionDeg?: number; // lower is better
  thermalMinC?: number;
  thermalMaxC?: number;
  storageGb?: number;
  iconName: string;
  tags: string[];

  // Source attribution metadata
  sourceStatus?: SourceStatus;
  sourceUrl?: string;
  sourceCitation?: string;
  valueSources?: Record<string, ValueSourceMeta>;
}

export interface LaunchVehicle {
  id: string;
  name: string;
  costCredits: number;
  reliability: number;
  maxPayloadKg: {
    earth: number;
    moon: number;
    mars: number;
    asteroid: number;
  };
  description: string;

  // Source attribution metadata
  sourceStatus?: SourceStatus;
  sourceUrl?: string;
  sourceCitation?: string;
  valueSources?: Record<string, ValueSourceMeta>;
}

export interface MissionScenario {
  id: string;
  name: string;
  destination: 'earth' | 'moon' | 'mars' | 'asteroid';
  destinationName: string;
  distanceAu: number;
  distanceKm?: number;
  orbitAltitudeKm?: number;
  bodyRadiusKm?: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objectiveType?: MissionObjectiveType;
  objectiveLabel?: string;
  tagline: string;
  description: string;
  primaryObjective: string;
  budgetCredits: number;
  maxDesignMassKg?: number;
  minDeltaVMs: number;
  durationDays: number;
  requiredSubsystems: SubsystemType[];
  requiredScienceTargets: string[];
  suggestedLauncherId: string;
  eclipseMinutesPerOrbit: number;
  orbitPeriodMinutes: number;

  // Source attribution metadata
  sourceStatus?: SourceStatus;
  sourceUrl?: string;
  sourceCitation?: string;
  valueSources?: Record<string, ValueSourceMeta>;
}

export interface ComputedTotals {
  totalMass: number;
  totalPower: {
    generation: number;
    consumption: number;
    net: number;
  };
  totalCost: number;
  availableDeltaV: number;
  dataRate: number;
  downlinkRate: number;
}

export interface BudgetTotals extends ComputedTotals {
  dryMassKg: number;
  propellantMassKg: number;
  totalMassKg: number;
  launchCapacityKg: number;
  isMassExceeded: boolean;

  powerGen1AuW: number;
  powerGenDestinationW: number;
  powerDrawActiveW: number;
  powerMarginW: number;
  batteryCapacityWh: number;
  eclipseBatteryDrainWh: number;
  isPowerDeficit: boolean;

  totalCostCredits: number;
  remainingCredits: number;
  isOverBudget: boolean;

  availableDeltaVMs: number;
  requiredDeltaVMs: number;
  deltaVMarginMs: number;
  isDeltaVDeficit: boolean;

  totalStorageGb: number;
  dataRateMbps: number;
  pointingAccuracyDeg: number;
  estimatedSciencePotential: number;
  systemReliabilityAverage: number;
  signalDelaySeconds?: number;
}

export interface PreflightDiagnostic {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  system: SubsystemType | 'budget' | 'launcher' | 'trajectory';
}

export interface AnomalyEvent {
  id: string;
  title: string;
  description: string;
  missionPhase: 'ascent' | 'cruise' | 'insertion' | 'operations';
  triggerProb: number;
  options: {
    label: string;
    description: string;
    consequenceText: string;
    effects: {
      batteryDrainWh?: number;
      propellantLossKg?: number;
      scienceValueChange?: number;
      reliabilityImpact?: number;
      dataLossGb?: number;
    };
  }[];
}

export interface MissionScoreBreakdown {
  scienceScore: number;       // max 35
  trajectoryScore: number;    // max 20
  downlinkScore: number;      // max 15
  spacecraftHealthScore: number; // max 10
  budgetEfficiencyScore: number; // max 10
  operationsScore: number;    // max 10
  totalScore: number;         // max 100
  tier: 'Success' | 'Partial Success' | 'Failure' | 'Exceptional (NASA Trophy)' | 'Nominal Success' | 'Mission Failure';
  rootCauseAnalysis: string[];
  recommendations: string[];
}
