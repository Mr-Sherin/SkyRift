'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useGame } from '@/game/engine/GameContext';
import { PARTS } from '@/data/gameData';
import { calculateBudgetTotals, runPreflightDiagnostics, getMissionRequirements } from '@/game/physics/budgetEngine';
import { getAutoBuildForMission } from '@/game/physics/autoBuild';
import { SubsystemType, SpacecraftComponent } from '@/game/types';
import {
  Box,
  Zap,
  Flame,
  Radio,
  Compass,
  Thermometer,
  Cpu,
  Eye,
  X,
  Plus,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Activity,
  Layers,
  Lightbulb,
  AlertTriangle,
  Info,
  Lock,
  Sliders,
} from 'lucide-react';
import { useTeam } from '@/game/team/TeamContext';
import { TEAM_ROLES } from '@/game/team/teamTypes';
import { SpacecraftHangar3D } from '@/components/visualizer/SpacecraftHangar3D';
import { AnimatedNumber } from '@/components/hud/AnimatedNumber';
import { sfx } from '@/lib/audio';
import { getMissionStory, isStoryEnabled } from '@/data/story';
import { DialogueBox } from '@/components/story/DialogueBox';
import { ConOpsModal } from '@/components/story/ConOpsModal';
import { ShipyardModal } from '@/components/hangar/ShipyardModal';
import { MissionSegmentChip, CmlBadge, SourceInfoBadge } from '@/components/ui';
import {
  isInstrumentCompatible,
  getInstrumentIncompatibilityReason,
} from '@/data/missionObjectives';

const SUBSYSTEM_TABS: {
  id: SubsystemType;
  label: string;
  shortLabel: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'structure',
    label: 'Structure',
    shortLabel: 'Frame',
    helper: 'Main body frame holding your instruments and shielding.',
    icon: Box,
  },
  {
    id: 'power',
    label: 'Power',
    shortLabel: 'Power',
    helper: 'Solar wings or RTG power plus batteries for orbital shadows.',
    icon: Zap,
  },
  {
    id: 'propulsion',
    label: 'Propulsion',
    shortLabel: 'Engine',
    helper: 'Engines and fuel tanks providing Δv maneuver capability.',
    icon: Flame,
  },
  {
    id: 'communications',
    label: 'Comms',
    shortLabel: 'Comms',
    helper: 'Antennas to transmit science data back to Earth.',
    icon: Radio,
  },
  {
    id: 'gnc',
    label: 'Navigation',
    shortLabel: 'Nav',
    helper: 'Reaction wheels and star trackers for precision aiming.',
    icon: Compass,
  },
  {
    id: 'thermal',
    label: 'Thermal',
    shortLabel: 'Thermal',
    helper: 'Insulation blankets and heaters for extreme space temperatures.',
    icon: Thermometer,
  },
  {
    id: 'cdh',
    label: 'Computer',
    shortLabel: 'CPU',
    helper: 'Flight computer and solid-state drive memory.',
    icon: Cpu,
  },
  {
    id: 'payload',
    label: 'Science',
    shortLabel: 'Science',
    helper: 'Cameras, radars, and spectrometers to complete mission science.',
    icon: Eye,
  },
];

const MISSION_AUTOBUILDS: Record<string, string[]> = {
  'mission-earth-obs': [
    'bus-smallsat-hex',
    'eps-solar-deployable',
    'eps-li-ion-heavy',
    'prop-coldgas-rcs',
    'comm-omni-lga',
    'gnc-reactionwheels-imu',
    'tcs-passive-mli',
    'cdh-single-micro',
    'inst-multispectral',
  ],
  'mission-lunar-echo': [
    'bus-smallsat-hex',
    'eps-solar-deployable',
    'eps-li-ion-heavy',
    'prop-bipropellant',
    'comm-parabolic-mga',
    'gnc-reactionwheels-imu',
    'tcs-passive-mli',
    'cdh-radhard-dual',
    'inst-gamma-neutron',
  ],
  'mission-mars-frontier': [
    'bus-deepspace-titanium',
    'eps-rtg-nextgen',
    'eps-solar-deployable',
    'eps-li-ion-heavy',
    'prop-bipropellant',
    'comm-deepspace-hga',
    'gnc-dual-startracker',
    'tcs-active-louvers',
    'cdh-radhard-dual',
    'inst-raman-spectro',
    'inst-magnetometer',
  ],
  'mission-asteroid-scout': [
    'bus-smallsat-hex',
    'eps-rtg-nextgen',
    'eps-solar-deployable',
    'eps-li-ion-heavy',
    'prop-ion-xenon',
    'comm-parabolic-mga',
    'gnc-reactionwheels-imu',
    'tcs-passive-mli',
    'cdh-radhard-dual',
    'inst-magnetometer',
    'inst-multispectral',
  ],
};

type OverlayPanel = 'browser' | 'curve' | 'parts' | null;

function formatCredits(cr: number): string {
  if (Math.abs(cr) >= 1_000_000) return `${(cr / 1_000_000).toFixed(2).replace(/\.00$/, '')}M CR`;
  if (Math.abs(cr) >= 1_000) return `${Math.round(cr / 1_000)}K CR`;
  return `${cr} CR`;
}

function getSimulatedComponents(current: SpacecraftComponent[], candidate: SpacecraftComponent): SpacecraftComponent[] {
  const singleInstance = ['structure', 'cdh'];
  if (singleInstance.includes(candidate.subsystem)) {
    return [...current.filter((c) => c.subsystem !== candidate.subsystem), candidate];
  }
  return [...current, candidate];
}

const BEGINNER_PART_IDS = [
  'bus-cubesat-6u',
  'bus-smallsat-hex',
  'eps-solar-deployable',
  'eps-solar-body',
  'eps-li-ion-heavy',
  'prop-coldgas-rcs',
  'prop-bipropellant',
  'comm-omni-lga',
  'comm-parabolic-mga',
  'gnc-reactionwheels-imu',
  'gnc-dual-startracker',
  'tcs-passive-mli',
  'cdh-radhard-dual',
  'inst-multispectral',
  'inst-radar-altimeter',
  'inst-mag-boom',
];

const GLOSSARY_TOOLTIPS: Record<string, string> = {
  'Δv': 'Delta-V (Δv) = Velocity Change: The total speed boost your engines deliver using stored propellant, measured in meters per second (m/s).',
  'Isp': 'Specific Impulse (Isp) = Fuel Efficiency: How efficiently an engine converts propellant into thrust, in seconds (s). Higher is more efficient.',
  'CR': 'Credits (CR) = Agency Mission Budget: Funds available to manufacture parts and contract launch vehicles.',
  'rel': 'Reliability (rel) = Hardware Quality: Likelihood of nominal inflight operation without telemetry anomalies or malfunctions.',
};

function TechTooltip({ term, label }: { term: 'Δv' | 'Isp' | 'CR' | 'rel'; label?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center cursor-help group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="underline decoration-dotted decoration-[rgba(148,163,184,0.4)] hover:decoration-[#FF5A1F] transition-colors">
        {label || term}
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-64 p-2.5 rounded-xl bg-[#070E24] text-white text-xs font-sans normal-case shadow-2xl border border-[rgba(148,163,184,0.25)] z-50 pointer-events-none leading-relaxed">
          <span className="font-mono font-bold text-[#FF5A1F] block text-[11px] uppercase tracking-wider mb-0.5">
            {term} Terminology
          </span>
          <span className="text-slate-200 text-xs">
            {GLOSSARY_TOOLTIPS[term]}
          </span>
        </span>
      )}
    </span>
  );
}

const BEGINNER_HINTS: Record<SubsystemType, { title: string; hint: string }> = {
  structure: {
    title: 'PICK A SOLID CHASSIS',
    hint: 'Every spacecraft needs a main body frame to hold its parts. The Hexagonal SmallSat Bus provides the ideal balance of weight and mounting slots for beginner missions.',
  },
  power: {
    title: 'PREVENT COLD BLACKOUTS IN SHADOW',
    hint: 'Spacecraft run on sunlight, but orbits pass through dark shadows. Pair Deployable Solar Wings to gather power with a Heavy Battery so instruments never freeze in the dark.',
  },
  propulsion: {
    title: 'BALANCED ORBITAL ENGINE SPEED',
    hint: 'Your engine provides the push needed to reach and maintain orbit. Bipropellant Thrusters give high fuel efficiency without draining your electrical battery.',
  },
  communications: {
    title: 'SEND OBSERVATIONS BACK HOME',
    hint: 'Without an antenna, scientists will never receive your planetary photos. A Medium-Gain Dish provides fast transmission so your science memory never fills up.',
  },
  gnc: {
    title: 'KEEP CAMERAS POINTED ON TARGET',
    hint: 'Reaction wheels and star cameras spin the craft gently so your sensors stay locked on the target planet without burning engine fuel.',
  },
  thermal: {
    title: 'INSULATE AGAINST EXTREME SPACE TEMPERATURES',
    hint: 'Space swings from boiling sun to icy shadows. Passive thermal blankets wrap your spacecraft like an insulated jacket using zero electrical power.',
  },
  cdh: {
    title: 'THE SPACECRAFT BRAIN',
    hint: 'The flight computer runs your satellite and stores telemetry. A Dual Rad-Hardened Computer automatically handles space radiation glitches.',
  },
  payload: {
    title: 'SCIENTIFIC INSTRUMENTS',
    hint: 'This is why we explore! The Multispectral Imager captures both visual light and infrared heat maps, ideal for climate and surface surveys.',
  },
};

export default function HangarPage() {
  const {
    activeScenario,
    selectedComponents,
    selectedLauncher,
    budgets,
    difficulty,
    setDifficulty,
    addComponent,
    removeComponent,
    resetSpacecraft,
    selectRocket,
    selectLauncher,
  } = useGame();

  const [activeTab, setActiveTab] = useState<SubsystemType>('structure');
  const [openPanel, setOpenPanel] = useState<OverlayPanel>('browser');
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);
  const [showAllBeginnerParts, setShowAllBeginnerParts] = useState(false);
  const [violationsExpanded, setViolationsExpanded] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [missionInfoOpen, setMissionInfoOpen] = useState(false);
  const [shipyardOpen, setShipyardOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setMissionInfoOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Requirement 1: One-Screen ConOps Briefing Modal State
  const [showConOpsModal, setShowConOpsModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const hideAlways = localStorage.getItem(`skyrift_hide_conops_${activeScenario.id}`);
      if (hideAlways === 'true') return false;
      const dismissedInSession = sessionStorage.getItem(`skyrift_conops_dismissed_${activeScenario.id}`);
      if (dismissedInSession === 'true') return false;
      return true;
    } catch {
      return true;
    }
  });

  // Visual Novel Story: Opening Briefing Modal State
  const missionStory = getMissionStory(activeScenario.id);
  const [showBriefingModal, setShowBriefingModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (!isStoryEnabled()) return false;
    return !sessionStorage.getItem(`skyrift_briefing_seen_${activeScenario.id}`);
  });

  const handleDismissBriefing = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`skyrift_briefing_seen_${activeScenario.id}`, 'true');
    }
    setShowBriefingModal(false);
  };

  const { gameMode, myRole, myRoleInfo, canEditSubsystem } = useTeam();
  const managerRole =
    (['structure', 'power', 'thermal', 'cdh'] as SubsystemType[]).includes(activeTab)
      ? 'engineer'
      : activeTab === 'payload'
      ? 'science'
      : 'comms';
  const managerName = TEAM_ROLES[managerRole].name;
  const canEditCurrentTab = canEditSubsystem(activeTab);

  const currentTabIdx = SUBSYSTEM_TABS.findIndex((t) => t.id === activeTab);
  const currentTabMeta = SUBSYSTEM_TABS[currentTabIdx] || SUBSYSTEM_TABS[0];
  const rawFilteredComponents = PARTS.filter((c) => c.subsystem === activeTab);
  const filteredComponents =
    difficulty === 'beginner'
      ? rawFilteredComponents.filter((c) => {
          if (activeTab === 'payload') {
            return isInstrumentCompatible(c.id, activeScenario.objectiveType);
          }
          if (showAllBeginnerParts) return true;
          return (
            BEGINNER_PART_IDS.includes(c.id) ||
            selectedComponents.some((sc) => sc.id === c.id)
          );
        })
      : rawFilteredComponents;
  const hiddenCount = rawFilteredComponents.length - filteredComponents.length;

  // Diagnostics & requirements check
  const diagnostics = runPreflightDiagnostics(
    selectedComponents,
    activeScenario,
    selectedLauncher,
    budgets
  );
  const errors = diagnostics.filter((d) => d.type === 'error');
  const isSingleInstanceTab = activeTab === 'structure' || activeTab === 'cdh';
  const hasTabComponent = selectedComponents.some((c) => c.subsystem === activeTab);

  // Verification of minimum mission requirements
  const hasStructure = selectedComponents.some((c) => c.subsystem === 'structure');
  const hasPowerSource = selectedComponents.some(
    (c) => c.subsystem === 'power' && ((c.powerGenW && c.powerGenW > 0) || c.id === 'eps-rtg-nextgen')
  );
  const hasEngine = selectedComponents.some(
    (c) => c.subsystem === 'propulsion' && (c.thrustN || c.ispS)
  );
  const hasComms = selectedComponents.some((c) => c.subsystem === 'communications');
  const hasScience = selectedComponents.some((c) => c.subsystem === 'payload');
  const hasCompatibleScience = selectedComponents.some(
    (c) => c.subsystem === 'payload' && isInstrumentCompatible(c.id, activeScenario.objectiveType)
  );

  const missingRequirements: string[] = [];
  if (!hasStructure) missingRequirements.push('Frame (Structure)');
  if (!hasPowerSource) missingRequirements.push('Power Source (Solar or RTG)');
  if (!hasEngine) missingRequirements.push('Engine (Propulsion)');
  if (!hasComms) missingRequirements.push('Comms (Antenna)');
  if (!hasCompatibleScience) {
    missingRequirements.push(
      `Compatible Science Instrument (${activeScenario.objectiveLabel || 'Primary Payload'})`
    );
  }

  const canProceedToRocket = missingRequirements.length === 0;

  // Single source of truth for mission requirements
  const reqs = getMissionRequirements(activeScenario, difficulty, selectedLauncher);

  // Requirement 4: Compact requirement violations detection
  const violations: { id: string; label: string; title: string; desc: string }[] = [];
  const missionDesignLimit = reqs.massLimitKg;

  if (selectedLauncher && budgets.isMassExceeded) {
    violations.push({
      id: 'mass',
      label: 'Weight',
      title: 'OVER MASS LIMIT',
      desc: `Craft mass (${budgets.totalMassKg} kg) exceeds launch capacity (${budgets.launchCapacityKg} kg). Remove heavy parts or pick a lighter frame.`,
    });
  } else if (!selectedLauncher && budgets.totalMassKg > missionDesignLimit) {
    violations.push({
      id: 'mass',
      label: 'Weight',
      title: 'EXCEEDS MISSION DESIGN MASS',
      desc: `Craft mass (${budgets.totalMassKg} kg) exceeds mission design envelope (${missionDesignLimit} kg). Remove heavy parts or pick a lighter frame.`,
    });
  }
  if (budgets.isPowerDeficit) {
    violations.push({
      id: 'power',
      label: 'Power',
      title: 'NEGATIVE POWER BALANCE',
      desc:
        budgets.powerMarginW < 0
          ? `Craft has a continuous deficit of ${Math.abs(budgets.powerMarginW)} W at ${activeScenario.destinationName}. Add solar arrays or an RTG.`
          : `Battery (${budgets.batteryCapacityWh} Wh) cannot sustain ${activeScenario.eclipseMinutesPerOrbit}-min shadow (${Math.round(budgets.eclipseBatteryDrainWh)} Wh required).`,
    });
  }
  if (budgets.isDeltaVDeficit && hasEngine) {
    violations.push({
      id: 'deltav',
      label: 'Δv',
      title: 'INSUFFICIENT FUEL SPEED (Δv)',
      desc: `Engine delivers ${budgets.availableDeltaVMs.toLocaleString()} m/s, but ${activeScenario.name} requires at least ${budgets.requiredDeltaVMs.toLocaleString()} m/s.`,
    });
  }
  if (budgets.isOverBudget) {
    violations.push({
      id: 'budget',
      label: 'Budget',
      title: 'BUDGET CEILING EXCEEDED',
      desc: `Spacecraft cost exceeds grant by ${formatCredits(Math.abs(budgets.remainingCredits))}. Swap expensive parts for lighter variants.`,
    });
  }

  // Requirement 2: Uniform Resource Color Rule across Top HUD:
  // Green when within limits (<85%), Amber at 85%+, Red when violated (including negative Budget Left).

  // 1. Budget Left
  const effectiveBudget = Math.round(
    activeScenario.budgetCredits * (difficulty === 'beginner' ? 1.25 : difficulty === 'expert' ? 0.8 : 1.0)
  );
  const spentRatio = effectiveBudget > 0 ? budgets.totalCostCredits / effectiveBudget : 0;
  const budgetColorState = budgets.remainingCredits < 0 || budgets.isOverBudget
    ? 'text-rose-400'
    : spentRatio >= 0.85
    ? 'text-amber-400'
    : 'text-emerald-400';

  // 2. Weight
  const effectiveCap = selectedLauncher ? budgets.launchCapacityKg : missionDesignLimit;
  const massRatio = effectiveCap > 0 ? budgets.totalMassKg / effectiveCap : 0;
  const massColorState = (selectedLauncher ? budgets.isMassExceeded : budgets.totalMassKg > missionDesignLimit)
    ? 'text-rose-400'
    : massRatio >= 0.85
    ? 'text-amber-400'
    : 'text-emerald-400';

  // 3. Fuel (Δv)
  const deltaVRatio = budgets.availableDeltaVMs > 0 ? budgets.requiredDeltaVMs / budgets.availableDeltaVMs : 1.0;
  const deltaVColorState = budgets.isDeltaVDeficit
    ? 'text-rose-400'
    : deltaVRatio >= 0.85
    ? 'text-amber-400'
    : 'text-emerald-400';

  // 4. Power Balance
  const powerUsageRatio = budgets.powerGenDestinationW > 0 ? budgets.powerDrawActiveW / budgets.powerGenDestinationW : 1.0;
  const eclipseHours = activeScenario.eclipseMinutesPerOrbit / 60;
  const eclipseWhRequired = budgets.powerDrawActiveW * eclipseHours;
  const batteryUsageRatio = budgets.batteryCapacityWh > 0 ? eclipseWhRequired / budgets.batteryCapacityWh : 1.0;
  const powerColorState = budgets.isPowerDeficit || budgets.powerMarginW < 0
    ? 'text-rose-400'
    : (powerUsageRatio >= 0.85 || batteryUsageRatio >= 0.85)
    ? 'text-amber-400'
    : 'text-emerald-400';

  const stepSubsystem = (delta: number) => {
    sfx.playClick();
    const nextIdx = (currentTabIdx + delta + SUBSYSTEM_TABS.length) % SUBSYSTEM_TABS.length;
    setActiveTab(SUBSYSTEM_TABS[nextIdx].id);
    if (openPanel !== 'browser') setOpenPanel('browser');
  };

  // Requirement 4: Valid Auto-Build & Clear (passes Delta-V, Mass, Power, and Budget)
  const handleAutoBuild = () => {
    const build = getAutoBuildForMission(activeScenario.id);
    if (selectRocket) selectRocket(build.rocketId);
    if (selectLauncher) selectLauncher(build.rocketId);
    resetSpacecraft();
    build.parts.forEach((id) => addComponent(id));
    sfx.playClick();
  };

  const handleClear = () => {
    resetSpacecraft();
    sfx.playAlert();
  };

  // Trade-off preview calculator
  const getTradeoffPreview = (candidate: SpacecraftComponent) => {
    const simulatedComps = getSimulatedComponents(selectedComponents, candidate);
    const simBudgets = calculateBudgetTotals(simulatedComps, activeScenario, selectedLauncher);

    const dMass = simBudgets.totalMassKg - budgets.totalMassKg;
    const dPower = simBudgets.powerMarginW - budgets.powerMarginW;
    const dCost = simBudgets.totalCostCredits - budgets.totalCostCredits;
    const dDv = simBudgets.availableDeltaVMs - budgets.availableDeltaVMs;

    const tokens: string[] = [];
    tokens.push(`${dMass >= 0 ? '+' : ''}${Math.round(dMass)} kg`);
    tokens.push(`${dPower >= 0 ? '+' : ''}${Math.round(dPower)} W`);
    tokens.push(`${dCost >= 0 ? '+' : ''}${formatCredits(dCost)}`);

    if (candidate.subsystem === 'payload') {
      if (candidate.dataGenMbPerHour) {
        const gbPerDay = ((candidate.dataGenMbPerHour * 24) / 1000).toFixed(1);
        tokens.push(`+${gbPerDay} GB/d data`);
      }
      if (candidate.scienceValue) {
        tokens.push(`+${candidate.scienceValue} sci`);
      }
    } else if (candidate.subsystem === 'communications' && candidate.downlinkMbps) {
      tokens.push(`+${candidate.downlinkMbps} Mbps link`);
    } else if (dDv !== 0) {
      tokens.push(`${dDv >= 0 ? '+' : ''}${Math.round(dDv)} m/s Δv`);
    }

    return tokens.join(', ');
  };

  // Requirement 5: Plain language hint without raw jargon for Beginner mode
  let nextHint = 'Craft ready! Press Next: Rocket in the bottom dock to continue.';
  if (selectedComponents.length === 0) {
    nextHint = difficulty === 'beginner'
      ? 'Start by picking a Frame below, or click Auto-Build above to generate a working spacecraft immediately.'
      : 'Pick a Frame below or click Auto-Build at the top-left.';
  } else if (!canProceedToRocket) {
    nextHint = difficulty === 'beginner'
      ? `Your spacecraft needs essential systems: missing ${missingRequirements.map(m => m.split(' ')[0]).join(', ')}. Select each category below to install.`
      : `Missing: ${missingRequirements.join(', ')}`;
  } else if (budgets.isDeltaVDeficit && hasEngine) {
    nextHint = difficulty === 'beginner'
      ? `Your engine can only push ${budgets.availableDeltaVMs.toLocaleString()} m/s but the mission needs ${budgets.requiredDeltaVMs.toLocaleString()}. Try a stronger engine or add fuel.`
      : `Engine delivers ${budgets.availableDeltaVMs.toLocaleString()} m/s, but ${activeScenario.name} requires ${budgets.requiredDeltaVMs.toLocaleString()} m/s.`;
  } else if (budgets.isOverBudget) {
    nextHint = difficulty === 'beginner'
      ? `You went over budget by ${formatCredits(Math.abs(budgets.remainingCredits))}. Try choosing lighter or more economical components.`
      : `Spacecraft cost exceeds grant by ${formatCredits(Math.abs(budgets.remainingCredits))}.`;
  } else if (budgets.isPowerDeficit) {
    nextHint = difficulty === 'beginner'
      ? `Your spacecraft will run out of power in the dark! Add more solar panels or install a larger battery.`
      : `Power balance deficit: expand solar collection or battery storage for shadow passes.`;
  } else if (selectedLauncher && budgets.isMassExceeded) {
    nextHint = difficulty === 'beginner'
      ? `Your spacecraft is too heavy for this rocket (${budgets.totalMassKg} kg vs ${budgets.launchCapacityKg} kg max). Remove heavy parts or pick a lighter frame.`
      : `Craft mass exceeds launch capacity (${budgets.launchCapacityKg} kg).`;
  } else if (errors.length > 0) {
    nextHint = errors[0].recommendation || errors[0].title;
  }

  // Performance Curve Points (Baseline Target = 50% line, Scaled 0..100%)
  const liftScore = effectiveCap
    ? Math.max(0, Math.min(100, Math.round((1 - budgets.totalMassKg / effectiveCap) * 100 + 40)))
    : 15;
  const dvScore = Math.max(
    0,
    Math.min(100, Math.round((budgets.availableDeltaVMs / Math.max(1, budgets.requiredDeltaVMs)) * 65))
  );
  const powerScore =
    budgets.powerDrawActiveW > 0
      ? Math.max(0, Math.min(100, Math.round((budgets.powerGenDestinationW / budgets.powerDrawActiveW) * 58)))
      : budgets.powerGenDestinationW > 0
      ? 80
      : 10;
  const scienceScore = Math.max(0, Math.min(100, Math.round((budgets.estimatedSciencePotential / 900) * 85)));
  const commsScore = Math.max(0, Math.min(100, Math.round((Math.min(4.5, budgets.dataRateMbps) / 4.5) * 90 + 10)));

  const curveMetrics = [
    { label: 'Lift Margin', val: liftScore, base: 50 },
    { label: 'Δv Fuel', val: dvScore, base: 65 },
    { label: 'Power @ AU', val: powerScore, base: 58 },
    { label: 'Science', val: scienceScore, base: 55 },
    { label: 'Comms Link', val: commsScore, base: 50 },
  ];

  const svgPoints = curveMetrics
    .map((m, i) => {
      const x = 40 + i * 110;
      const y = 165 - (m.val / 100) * 135;
      return `${x},${y}`;
    })
    .join(' ');

  const basePoints = curveMetrics
    .map((m, i) => {
      const x = 40 + i * 110;
      const y = 165 - (m.base / 100) * 135;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="relative w-full h-[calc(100vh-64px)] min-h-[600px] overflow-hidden bg-[#050A1C] flex flex-col justify-between select-none">
      {/* =========================================================================
          FULL-STAGE INTERACTIVE 3D HANGAR BAY
         ========================================================================= */}
      <div className="absolute inset-0 z-0">
        <SpacecraftHangar3D
          components={selectedComponents}
          activeSubsystem={activeTab}
          stageOffsetX={openPanel === 'browser' ? -185 : 0}
        />
      </div>

      {/* Left / Right Subsystem Step Chevrons */}
      <button
        type="button"
        onClick={() => stepSubsystem(-1)}
        aria-label="Previous subsystem"
        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#0A1228]/90 hover:bg-[#0E1836] border border-[rgba(148,163,184,0.18)] hover:border-rift-orange text-slate-300 hover:text-white items-center justify-center shadow-lg transition-all ${
          openPanel === 'browser' ? 'left-[420px]' : 'left-4'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => stepSubsystem(1)}
        aria-label="Next subsystem"
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#0A1228]/90 hover:bg-[#0E1836] border border-[rgba(148,163,184,0.18)] hover:border-rift-orange text-slate-300 hover:text-white items-center justify-center shadow-lg transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* =========================================================================
          TOP FLOATING GARAGE BAR (ONE TOP LINE: Mission, 4 Meters, NEXT: ROCKET)
         ========================================================================= */}
      <div className="pointer-events-none relative z-40 max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-2.5 flex flex-col gap-2">
        {/* ONE Top Line (Rule 4) */}
        <div className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-[#0A1228]/95 backdrop-blur-md border border-[rgba(148,163,184,0.18)] shadow-2xl">
          {/* Left: Mission Name + Mission Info Popover + Tools Menu */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="font-mono font-black text-white text-xs sm:text-sm tracking-tight uppercase">
              {activeScenario.name}
            </span>

            {/* Mission Info Popover (Merges CML, segment, and allowance) */}
            <div className="relative" ref={infoRef}>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setMissionInfoOpen((prev) => !prev);
                  setToolsMenuOpen(false);
                }}
                title="Mission Segment, CML, and Difficulty Allowance"
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                  missionInfoOpen
                    ? 'bg-rift-orange/20 border-rift-orange text-rift-orange'
                    : 'bg-[#0E1836] border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500'
                }`}
              >
                <Info className="w-3 h-3 text-rift-orange" />
                <span className="hidden sm:inline">Mission info</span>
              </button>

              {missionInfoOpen && (
                <div
                  style={{ backgroundColor: '#0A1228' }}
                  className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-slate-600 shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-3.5 z-[100] font-sans text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="font-mono font-bold text-rift-orange text-[10px] uppercase tracking-wider">
                      MISSION DIRECTIVE INFO
                    </span>
                    <button
                      type="button"
                      onClick={() => setMissionInfoOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <MissionSegmentChip segment="space" />
                    <CmlBadge difficulty={activeScenario.difficulty} showExplanation={false} />
                  </div>

                  <div className="text-slate-300 text-xs leading-relaxed">
                    <b className="text-white">Target:</b> {activeScenario.destinationName} ({activeScenario.distanceAu} AU).
                    <p className="mt-1 text-slate-400">{activeScenario.tagline}</p>
                  </div>

                  {reqs.isBeginner && (
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
                      <b className="text-emerald-200">BEGINNER ALLOWANCE:</b> {reqs.allowanceLabel}
                    </div>
                  )}

                  <div className="p-2 rounded-lg bg-[#050A1C] border border-slate-800 text-[11px] text-slate-400 font-mono">
                    CML {activeScenario.difficulty === 'Beginner' ? '1-2' : activeScenario.difficulty === 'Intermediate' ? '3-4' : '5-6'}: Concept Maturity Level indicates mission readiness and engineering complexity.
                  </div>
                </div>
              )}
            </div>

            {/* Tools Menu (Auto-Build, Clear, ConOps, Briefing, Difficulty) */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setToolsMenuOpen((prev) => !prev);
                  setMissionInfoOpen(false);
                }}
                title="Hangar Tools & Settings"
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                  toolsMenuOpen
                    ? 'bg-rift-orange/20 border-rift-orange text-rift-orange'
                    : 'bg-[#0E1836] border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500'
                }`}
              >
                <Sliders className="w-3 h-3 text-rift-orange" />
                <span>Tools</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${toolsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsMenuOpen && (
                <div
                  style={{ backgroundColor: '#0A1228' }}
                  className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-slate-600 shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-3 z-[100] font-mono text-xs space-y-2"
                >
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 pt-1">
                    DIFFICULTY LEVEL
                  </div>
                  <div
                    style={{ backgroundColor: '#060B1C' }}
                    className="grid grid-cols-3 gap-1 p-1 rounded-lg border border-slate-800"
                  >
                    {(['beginner', 'standard', 'expert'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          setDifficulty(diff);
                          sfx.playClick();
                        }}
                        className={`py-1 text-[10px] rounded uppercase font-bold transition-colors ${
                          difficulty === diff
                            ? diff === 'beginner'
                              ? 'bg-emerald-600 text-white'
                              : diff === 'expert'
                              ? 'bg-rose-600 text-white'
                              : 'bg-rift-orange text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-slate-700/80 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      handleAutoBuild();
                      setToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-[#132044] text-slate-200 hover:text-rift-orange text-left transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rift-orange" />
                    <span className="font-bold">Auto-Build Design</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleClear();
                      setToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 text-left transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear All Parts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setShowConOpsModal(true);
                      setToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-[#132044] text-slate-200 hover:text-sky-400 text-left transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-sky-400" />
                    <span>ConOps Briefing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setShipyardOpen(true);
                      setToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-[#132044] text-slate-200 hover:text-rift-orange text-left transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-rift-orange" />
                    <span className="font-bold">Shipyard Blueprints</span>
                  </button>

                  {isStoryEnabled() && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setShowBriefingModal(true);
                        setToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl hover:bg-[#132044] text-slate-200 hover:text-rift-orange text-left transition-colors"
                    >
                      <Radio className="w-3.5 h-3.5 text-rift-orange" />
                      <span>Story Briefing</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center: The 4 Meters (Budget, Weight, Δv, Power) */}
          <div className="flex items-center space-x-2 sm:space-x-3.5 lg:space-x-5 font-mono text-xs shrink min-w-0">
            {/* 1. Budget Left */}
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">BUDGET</span>
              <span className={`font-black ${budgetColorState}`}>
                <AnimatedNumber value={budgets.remainingCredits} formatter={(v) => formatCredits(v)} />
              </span>
            </div>
            <div className="h-5 w-px bg-slate-700/60 hidden md:block" />

            {/* 2. Weight */}
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">WEIGHT</span>
              <span className={`font-black ${massColorState}`}>
                <AnimatedNumber value={budgets.totalMassKg} /> kg
                <span className="text-[9px] text-slate-400 font-normal ml-1 hidden xl:inline">/ {selectedLauncher ? budgets.launchCapacityKg.toLocaleString() : reqs.massLimitKg} kg</span>
              </span>
            </div>
            <div className="h-5 w-px bg-slate-700/60 hidden md:block" />

            {/* 3. Fuel Δv */}
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">ΔV</span>
              <span className={`font-black ${deltaVColorState}`}>
                <AnimatedNumber value={budgets.availableDeltaVMs} /><span className="hidden xl:inline"> / {budgets.requiredDeltaVMs.toLocaleString()}</span> m/s
              </span>
            </div>
            <div className="h-5 w-px bg-slate-700/60 hidden md:block" />

            {/* 4. Power */}
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">POWER</span>
              <span className={`font-black ${powerColorState}`}>
                <AnimatedNumber value={budgets.powerMarginW} formatter={(v) => `${v >= 0 ? '+' : ''}${v} W`} />
              </span>
            </div>
          </div>

          {/* Right: NEXT: ROCKET (The ONE Strong Orange Action on this screen) */}
          <div className="shrink-0">
            {canProceedToRocket ? (
              <Link
                href="/flight-plan"
                onClick={() => sfx.playClick()}
                className="px-4 py-2 rounded-xl bg-rift-orange hover:bg-[#E64C0E] text-white font-mono font-black text-xs tracking-wider uppercase flex items-center space-x-1.5 shadow-[0_0_16px_rgba(255,90,31,0.5)] transition-all"
              >
                <span>NEXT: ROCKET</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => sfx.playAlert()}
                title={`Missing: ${missingRequirements.join(', ')}`}
                className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 font-mono font-bold text-xs uppercase flex items-center space-x-1.5 cursor-not-allowed"
              >
                <span>NEXT: ROCKET</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-40" />
              </button>
            )}
          </div>
        </div>

        {/* Compact Issues Strip with "Why?" (Rule 4) */}
        {violations.length > 0 && (
          <div className="pointer-events-auto self-start max-w-lg">
            <div className="rounded-xl bg-rose-950/85 backdrop-blur-md border border-rose-500/40 shadow-xl overflow-hidden transition-all text-rose-100">
              <div className="px-3 py-1.5 flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center space-x-2 min-w-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-bold text-rose-300 uppercase tracking-wider">
                    {violations.length} {violations.length === 1 ? 'issue' : 'issues'}:
                  </span>
                  <span className="font-bold text-white truncate">
                    {violations.map((v) => v.label).join(', ')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setViolationsExpanded((prev) => !prev);
                  }}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-900/60 hover:bg-rose-800 text-[10px] font-mono font-bold text-rose-200 border border-rose-500/40 shrink-0 transition-colors"
                >
                  <span>Why?</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${violationsExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {violationsExpanded && (
                <div className="px-3.5 py-2.5 border-t border-rose-500/30 bg-rose-950/95 space-y-2 max-h-56 overflow-y-auto">
                  {violations.map((v) => (
                    <div key={v.id} className="text-xs">
                      <div className="font-mono font-bold text-rose-300 uppercase tracking-wider text-[10px]">
                        • {v.title}
                      </div>
                      <div className="font-sans text-xs text-rose-100/90 mt-0.5 leading-relaxed">
                        {v.desc}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          FLOATING OVERLAY PANEL (PARTS BROWSER / DYNO CURVE / INSTALLED LIST)
         ========================================================================= */}
      <div className="pointer-events-none relative z-20 max-w-[1440px] w-full mx-auto px-4 sm:px-6 flex-1 flex items-center">
        {/* 1. PARTS BROWSER DRAWER */}
        {openPanel === 'browser' && (
          <div className="pointer-events-auto w-full max-w-[360px] lg:max-w-[36%] xl:max-w-[32%] rounded-2xl bg-[#0A1228]/95 backdrop-blur-md border border-[rgba(148,163,184,0.18)] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-250px)]">
            <div className="px-4 py-3.5 bg-[#0D1733]/90 border-b border-[rgba(148,163,184,0.18)] flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider">
                  <currentTabMeta.icon className="w-3.5 h-3.5" />
                  <span>{currentTabMeta.label}</span>
                  {isSingleInstanceTab && <span className="text-slate-400">&bull; 1 SLOT</span>}
                </div>
                <p className="font-sans text-[14px] sm:text-[16px] text-slate-200 mt-1 leading-relaxed">
                  {currentTabMeta.helper}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                aria-label="Hide parts browser to view full spacecraft"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Team Mode Subsystem Role Restriction Banner */}
            {gameMode === 'team' && !canEditCurrentTab && (
              <div className="mx-3 mt-3 p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-[11px] font-mono text-amber-200 flex items-start space-x-2">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <b className="text-amber-300 uppercase">ROLE RESTRICTED:</b> In Team Mode, <b>{managerName}</b> manages {currentTabMeta.shortLabel} components. You can inspect specs, but only they can install or modify them.
                </div>
              </div>
            )}

            {/* Team Mode Acting As Banner when host controls empty role */}
            {gameMode === 'team' && canEditCurrentTab && myRole !== managerRole && (
              <div className="mx-3 mt-3 p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-[11px] font-mono text-purple-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span>
                    <b className="text-purple-300 uppercase tracking-wider">Acting as: {managerName}</b>
                    <span className="text-purple-300/80 ml-1.5">(Empty role managed by Room Host)</span>
                  </span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/30 font-bold uppercase">
                  ROLE CONTROL ACTIVE
                </span>
              </div>
            )}

            {/* Beginner Academy Hint Banner - 16px Sans-Serif Plain Language */}
            {difficulty === 'beginner' && (
              <div className="mx-3 mt-3 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-start space-x-2.5 shadow-xs">
                <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-wider mb-1">
                    <span>BEGINNER TIP // {BEGINNER_HINTS[activeTab]?.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-bold">
                      ACADEMY
                    </span>
                  </div>
                  <p className="font-sans text-[14px] sm:text-[16px] text-emerald-100 leading-relaxed whitespace-normal break-words">
                    {BEGINNER_HINTS[activeTab]?.hint}
                  </p>
                </div>
              </div>
            )}

            {/* Beginner Mode Simplified Parts Filter Notice */}
            {difficulty === 'beginner' && hiddenCount > 0 && (
              <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg bg-[#0D1733] border border-[rgba(148,163,184,0.15)] text-[10px] font-mono text-slate-300 flex items-center justify-between">
                <span>Simplified Catalog ({filteredComponents.length} shown, {hiddenCount} advanced hidden)</span>
                <button
                  type="button"
                  onClick={() => setShowAllBeginnerParts(true)}
                  className="text-rift-orange font-bold hover:underline"
                >
                  Show All Parts
                </button>
              </div>
            )}

            {difficulty === 'beginner' && showAllBeginnerParts && (
              <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg bg-[#0D1733] border border-[rgba(148,163,184,0.15)] text-[10px] font-mono text-slate-300 flex items-center justify-between">
                <span>Showing Full Catalog (All Modules)</span>
                <button
                  type="button"
                  onClick={() => setShowAllBeginnerParts(false)}
                  className="text-rift-orange font-bold hover:underline"
                >
                  Show Beginner Only
                </button>
              </div>
            )}

            {/* Expert Mode Banner */}
            {difficulty === 'expert' && (
              <div className="mx-3 mt-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-[11px] font-mono text-rose-200 flex items-center justify-between shadow-xs">
                <span className="font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>EXPERT CHALLENGE: -20% BUDGET // FREQUENT ANOMALIES</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-500/30 font-bold uppercase">
                  HARDCORE
                </span>
              </div>
            )}

            {/* Requirement 8: Catalog Panel Bottom Padding (pb-32) so Toolbar never obscures cards */}
            <div className="p-3 space-y-3 overflow-y-auto pb-32 sm:pb-36">
              {filteredComponents.map((comp) => {
                const installedCount = selectedComponents.filter((c) => c.id === comp.id).length;
                const isPayload = comp.subsystem === 'payload';
                const isCompatible = !isPayload || isInstrumentCompatible(comp.id, activeScenario.objectiveType);
                const incompReason = !isCompatible ? getInstrumentIncompatibilityReason(comp.id, activeScenario.objectiveType) : '';
                const isIdeal =
                  comp.subsystem === 'payload' &&
                  isCompatible &&
                  (comp.scienceTarget === activeScenario.destination || comp.scienceTarget === 'all');

                const renderHighlightStat = () => {
                  if (comp.powerGenW) return `+${comp.powerGenW} W gen`;
                  if (comp.batteryWh) return `${comp.batteryWh} Wh bat`;
                  if (comp.ispS) return (
                    <span>
                      {comp.ispS}s <TechTooltip term="Isp" />
                    </span>
                  );
                  if (comp.downlinkMbps !== undefined) return `${comp.downlinkMbps} Mbps`;
                  if (comp.storageGb !== undefined) return `${comp.storageGb} GB`;
                  if (comp.scienceValue !== undefined) return `+${comp.scienceValue} sci`;
                  return (
                    <span>
                      {Math.round(comp.reliability * 100)}% <TechTooltip term="rel" />
                    </span>
                  );
                };

                const isHovered = hoveredCompId === comp.id;

                return (
                  <div
                    key={comp.id}
                    onMouseEnter={() => setHoveredCompId(comp.id)}
                    onMouseLeave={() => setHoveredCompId(null)}
                    className={`relative p-3.5 rounded-xl border transition-all ${
                      !isCompatible
                        ? 'bg-[#070D1E]/70 border-slate-800/80 opacity-60'
                        : installedCount > 0
                        ? 'bg-[#0E1836] border-rift-orange ring-1 ring-rift-orange/40 shadow-lg'
                        : 'bg-[#0D1733]/90 border-[rgba(148,163,184,0.15)] hover:border-[rgba(148,163,184,0.35)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h2 className="text-xs sm:text-sm font-black text-white leading-snug">
                            {comp.name}
                          </h2>
                          {/* Requirement 8: Clear INSTALLED badge on active part in each category */}
                          {installedCount > 0 && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#FF5A1F] text-white text-[9px] font-mono font-black uppercase tracking-wider shadow-[0_0_8px_rgba(255,90,31,0.5)] shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>INSTALLED</span>
                            </span>
                          )}
                          {!isCompatible && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              <span>INCOMPATIBLE WITH OBJECTIVE</span>
                            </span>
                          )}
                        </div>
                        {isIdeal && (
                          <span className="inline-block mt-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            BEST FOR {activeScenario.name.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono font-bold text-white shrink-0 inline-flex items-center">
                        {formatCredits(comp.costCredits)}
                        <SourceInfoBadge
                          status={comp.valueSources?.costCredits?.status || 'placeholder'}
                          url={comp.valueSources?.costCredits?.url || comp.sourceUrl}
                          citation={comp.valueSources?.costCredits?.citation || comp.sourceCitation}
                          label="Part Cost"
                          className="ml-1"
                        />
                      </span>
                    </div>

                    {/* Requirement 6: Sans-serif at 16px for descriptions */}
                    <p className="font-sans text-[14px] sm:text-[16px] text-slate-200 mt-1.5 leading-relaxed">
                      {comp.description}
                    </p>

                    {/* Incompatible Plain-Language Reason Alert */}
                    {!isCompatible && incompReason && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 flex items-start space-x-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="font-sans text-[13px] text-amber-100 leading-snug">
                          {incompReason}
                        </p>
                      </div>
                    )}

                    {/* Trade-off Preview Tooltip on Hover */}
                    {isHovered && isCompatible && (
                      <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-[#050A1C] text-white text-[11px] font-mono flex items-center space-x-1.5 shadow-md border border-slate-700 animate-fadeIn">
                        <span className="text-rift-orange font-bold">CHANGE:</span>
                        <span className="text-slate-200">{getTradeoffPreview(comp)}</span>
                      </div>
                    )}

                    <div className="mt-2.5 pt-2.5 border-t border-[rgba(148,163,184,0.12)] flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-300 inline-flex flex-wrap items-center gap-1">
                        <span>{comp.massKg} kg</span>
                        <SourceInfoBadge
                          status={comp.valueSources?.massKg?.status || comp.sourceStatus || 'derived'}
                          url={comp.valueSources?.massKg?.url || comp.sourceUrl}
                          citation={comp.valueSources?.massKg?.citation || comp.sourceCitation}
                          label="Part Mass"
                        />
                        <span>&bull;</span>
                        <span>{comp.powerDrawW} W</span>
                        <SourceInfoBadge
                          status={comp.valueSources?.powerDrawW?.status || 'derived'}
                          url={comp.valueSources?.powerDrawW?.url || comp.sourceUrl}
                          citation={comp.valueSources?.powerDrawW?.citation}
                          label="Power Draw"
                        />
                        <span>&bull;</span>
                        <b className="text-rift-orange inline-flex items-center">
                          {renderHighlightStat()}
                          <SourceInfoBadge
                            status={comp.sourceStatus || 'nasa'}
                            url={comp.sourceUrl}
                            citation={comp.sourceCitation}
                            label="Key Metric"
                            className="ml-0.5"
                          />
                        </b>
                      </span>

                      {!isCompatible ? (
                        installedCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => removeComponent(comp.id)}
                            className="px-3 py-1 rounded-lg text-[11px] font-mono font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 flex items-center space-x-1 transition-colors shrink-0"
                            title="Remove incompatible instrument"
                          >
                            <X className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-3 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-800/80 text-slate-400 border border-slate-700/80 flex items-center space-x-1 cursor-not-allowed shrink-0"
                            title={incompReason}
                          >
                            <Lock className="w-3 h-3 text-amber-400/70" />
                            <span>Locked</span>
                          </button>
                        )
                      ) : (
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {installedCount > 0 && (
                            <button
                              type="button"
                              disabled={!canEditCurrentTab}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canEditCurrentTab) return;
                                removeComponent(comp.id);
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 hover:text-white flex items-center space-x-1 transition-colors shrink-0"
                              title={`Remove 1 unit of ${comp.name}`}
                            >
                              <X className="w-3 h-3" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!canEditCurrentTab}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!canEditCurrentTab) return;
                              addComponent(comp.id);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1 transition-colors shrink-0 ${
                              !canEditCurrentTab
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                : installedCount > 0 && isSingleInstanceTab
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                : 'bg-rift-orange hover:bg-rift-orangeHover text-white shadow-hud-orange'
                            }`}
                            title={!canEditCurrentTab ? `Only ${managerName} can install this module in Team Mode` : undefined}
                          >
                            {installedCount > 0 && isSingleInstanceTab ? (
                              <>
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>Installed</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                                <span>
                                  {isSingleInstanceTab && hasTabComponent
                                    ? 'Replace'
                                    : installedCount > 0
                                    ? `Add (${installedCount})`
                                    : 'Install'}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Requirement 5 & 6: Never truncate hint text, wrap it smoothly at 16px sans-serif */}
            <div className="px-4 py-3 bg-[#0D1733] border-t border-[rgba(148,163,184,0.18)] flex items-start justify-between gap-3 text-slate-200">
              <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                <Lightbulb className="w-4 h-4 text-rift-orange shrink-0 mt-0.5" />
                <span className="font-sans text-[13px] sm:text-[14px] text-slate-100 leading-relaxed whitespace-normal break-words">
                  {nextHint}
                </span>
              </div>
              {selectedComponents.length === 0 && (
                <button
                  type="button"
                  onClick={handleAutoBuild}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-rift-orange/20 hover:bg-rift-orange border border-rift-orange/50 hover:border-rift-orange text-rift-orange hover:text-white text-xs font-mono font-bold transition-all shrink-0 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Build</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. PERFORMANCE CURVE OVERLAY */}
        {openPanel === 'curve' && (
          <div className="pointer-events-auto mx-auto w-full max-w-2xl rounded-2xl bg-[#0A1228]/95 backdrop-blur-md border border-[rgba(148,163,184,0.18)] shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#0D1733] border-b border-[rgba(148,163,184,0.18)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-rift-orange" />
                <div>
                  <div className="text-[10px] font-mono font-bold text-rift-orange uppercase">
                    CRAFT PERFORMANCE BENCHMARK
                  </div>
                  <h2 className="text-sm font-black text-white">
                    {activeScenario.name} — Target vs Your Build
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                aria-label="Close performance curve"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Top Metric Gains Row */}
              <div className="grid grid-cols-5 gap-2 text-center font-mono">
                {curveMetrics.map((m) => {
                  const gain = m.val - m.base;
                  return (
                    <div key={m.label} className="p-2.5 rounded-xl bg-[#0D1733] border border-[rgba(148,163,184,0.18)]">
                      <div className="text-[9px] text-slate-400 uppercase truncate">{m.label}</div>
                      <div className="text-sm font-black text-white mt-0.5">{m.val}%</div>
                      <div
                        className={`text-[10px] font-bold ${
                          gain > 0 ? 'text-emerald-400' : gain < 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {gain > 0 ? `+${gain}%` : `${gain}%`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SVG Dyno Chart Area */}
              <div className="relative h-44 rounded-xl bg-[#050A1C] p-3 border border-slate-700/80 flex flex-col justify-between">
                <svg className="w-full h-full" viewBox="0 0 520 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[30, 65, 100, 135].map((y) => (
                    <line
                      key={y}
                      x1="30"
                      y1={y}
                      x2="490"
                      y2={y}
                      stroke="#1E293B"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Target Base Line (Dashed Slate) */}
                  <polyline
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    points={basePoints}
                  />

                  {/* Active Craft Line (Bright Rift Orange) */}
                  <polyline
                    fill="none"
                    stroke="#FF5A1F"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={svgPoints}
                  />

                  {/* Node Dots */}
                  {curveMetrics.map((m, i) => {
                    const x = 40 + i * 110;
                    const y = 165 - (m.val / 100) * 135;
                    return (
                      <g key={m.label}>
                        <circle cx={x} cy={y} r="5" fill="#FF5A1F" stroke="#FFFFFF" strokeWidth="2" />
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="flex items-center justify-center space-x-6 text-[11px] font-mono text-slate-300 mt-1">
                  <span className="inline-flex items-center space-x-1.5">
                    <span className="w-4 h-1 bg-rift-orange rounded-full inline-block" />
                    <span>Your Spacecraft</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
                    <span>Mission Target</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. INSTALLED PARTS MANAGER DRAWER */}
        {openPanel === 'parts' && (
          <div className="pointer-events-auto ml-auto w-full max-w-sm rounded-2xl bg-[#0A1228]/95 backdrop-blur-md border border-[rgba(148,163,184,0.18)] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-250px)]">
            <div className="px-4 py-3.5 bg-[#0D1733] border-b border-[rgba(148,163,184,0.18)] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold text-rift-orange uppercase">
                  SPACECRAFT MANIFEST
                </div>
                <h2 className="text-sm font-black text-white">
                  Installed Parts ({selectedComponents.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                aria-label="Close parts list"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-1.5 overflow-y-auto">
              {selectedComponents.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No parts installed yet. Pick a category on the dock below.
                </p>
              ) : (
                selectedComponents.map((comp, idx) => (
                  <div
                    key={`${comp.id}-${idx}`}
                    className="px-3 py-2 rounded-xl bg-[#0D1733] border border-[rgba(148,163,184,0.18)] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{comp.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        {comp.subsystem} &bull; {comp.massKg} kg
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canEditSubsystem(comp.subsystem)}
                      onClick={() => {
                        if (!canEditSubsystem(comp.subsystem)) return;
                        removeComponent(comp.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        canEditSubsystem(comp.subsystem)
                          ? 'text-slate-400 hover:text-rose-400 hover:bg-white/10 cursor-pointer'
                          : 'text-slate-600 cursor-not-allowed'
                      }`}
                      title={!canEditSubsystem(comp.subsystem) ? 'Managed by another role in Team Mode' : 'Remove part'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          BOTTOM GARAGE DOCK BAR
         ========================================================================= */}
      <div className="pointer-events-none relative z-20 max-w-[1440px] w-full mx-auto px-4 pb-4 flex justify-center">
        <div className="pointer-events-auto max-w-full overflow-x-auto rounded-2xl bg-[#0A1228]/95 backdrop-blur-md border border-[rgba(148,163,184,0.18)] shadow-2xl px-2.5 py-2 flex items-center space-x-1.5 sm:space-x-2">
          {/* 8 Subsystem Icon Tiles */}
          {SUBSYSTEM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && openPanel === 'browser';
            const count = selectedComponents.filter((c) => c.subsystem === tab.id).length;
            const needsAttention =
              count === 0 &&
              (activeScenario.requiredSubsystems.includes(tab.id) ||
                (tab.id === 'propulsion' && budgets.isDeltaVDeficit));

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sfx.playClick();
                  if (activeTab === tab.id && openPanel === 'browser') {
                    setOpenPanel(null);
                  } else {
                    setActiveTab(tab.id);
                    setOpenPanel('browser');
                  }
                }}
                className={`relative px-2.5 sm:px-3 py-2 rounded-xl flex flex-col items-center justify-center min-w-[58px] transition-all ${
                  isActive
                    ? 'bg-rift-orange/20 text-rift-orange ring-1 ring-rift-orange'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-mono font-bold tracking-tight">
                  {tab.shortLabel}
                </span>
                {count > 0 ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                ) : needsAttention ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                ) : null}
              </button>
            );
          })}

          <div className="h-9 w-px bg-[rgba(148,163,184,0.18)] mx-1 shrink-0" />

          {/* Secondary quiet Rocket link */}
          <div className="relative group shrink-0">
            {canProceedToRocket ? (
              <Link
                href="/flight-plan"
                onClick={() => sfx.playClick()}
                className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-mono font-bold text-xs tracking-wider uppercase flex items-center space-x-1.5 transition-colors"
              >
                <span>Launch Prep</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            ) : null}
          </div>

          <div className="h-9 w-px bg-[rgba(148,163,184,0.18)] mx-1 shrink-0" />

          {/* Performance Curve Toggle */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setOpenPanel((prev) => (prev === 'curve' ? null : 'curve'));
            }}
            className={`px-3 py-2 rounded-xl flex flex-col items-center justify-center min-w-[58px] transition-all ${
              openPanel === 'curve'
                ? 'bg-rift-orange/20 text-rift-orange ring-1 ring-rift-orange'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-mono font-bold">Curve</span>
          </button>

          {/* Installed Parts Toggle */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setOpenPanel((prev) => (prev === 'parts' ? null : 'parts'));
            }}
            className={`px-3 py-2 rounded-xl flex flex-col items-center justify-center min-w-[58px] transition-all ${
              openPanel === 'parts'
                ? 'bg-rift-orange/20 text-rift-orange ring-1 ring-rift-orange'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-mono font-bold">
              Parts ({selectedComponents.length})
            </span>
          </button>
        </div>
      </div>

      {/* Visual Novel: Opening Mission Briefing Modal Overlay */}
      {showBriefingModal && isStoryEnabled() && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#050A1C]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <DialogueBox
            title={missionStory.chapterTitle.toUpperCase()}
            badge="OPENING BRIEFING"
            dialogue={missionStory.openingBriefing}
            onComplete={handleDismissBriefing}
          />
        </div>
      )}

      {/* Requirement 1: One-Screen ConOps Briefing for Active Mission */}
      <ConOpsModal
        mission={activeScenario}
        isOpen={showConOpsModal}
        onClose={() => setShowConOpsModal(false)}
      />

      {/* Cloud Shipyard Vault Modal (Supabase Blueprints) */}
      <ShipyardModal
        isOpen={shipyardOpen}
        onClose={() => setShipyardOpen(false)}
      />
    </div>
  );
}
