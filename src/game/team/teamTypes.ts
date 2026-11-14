import { SubsystemType, SpacecraftComponent, BudgetTotals, LaunchVehicle, MissionScenario } from '@/game/types';
import { FlightAction } from '@/lib/simulation';

export type TeamRole = 'director' | 'engineer' | 'science' | 'comms';

export interface RoleInfo {
  id: TeamRole;
  name: string;
  shortTitle: string;
  badge: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  colorHex: string;
  managedSubsystems: SubsystemType[];
  description: string;
  privateGoal: {
    title: string;
    description: string;
    targetLabel: string;
    checkMet: (context: {
      budgets: BudgetTotals;
      selectedRocket: LaunchVehicle | null;
      selectedComponents: SpacecraftComponent[];
      flightResults?: any;
    }) => {
      met: boolean;
      currentText: string;
      targetText: string;
    };
  };
}

export const TEAM_ROLES: Record<TeamRole, RoleInfo> = {
  director: {
    id: 'director',
    name: 'Mission Director',
    shortTitle: 'DIRECTOR',
    badge: 'DIR',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-800',
    colorHex: '#D97706',
    managedSubsystems: [],
    description: 'Selects mission target and launcher vehicle. Manages mission budget and has final launch go/no-go authority.',
    privateGoal: {
      title: 'Fiscal & Reliability Discipline',
      description: 'Preserve at least 100,000 CR unallocated reserve and ensure rocket launcher reliability is >= 90%.',
      targetLabel: 'Reserve >= 100K CR & Rocket >= 90%',
      checkMet: ({ budgets, selectedRocket }) => {
        const reserve = budgets.remainingCredits;
        const reliability = selectedRocket?.reliability || 0;
        const met = reserve >= 100000 && reliability >= 0.90;
        return {
          met,
          currentText: `${reserve.toLocaleString()} CR / ${Math.round(reliability * 100)}% Rel`,
          targetText: '>= 100,000 CR & >= 90%',
        };
      },
    },
  },
  engineer: {
    id: 'engineer',
    name: 'Spacecraft Engineer',
    shortTitle: 'ENGINEER',
    badge: 'ENG',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-300',
    badgeText: 'text-blue-800',
    colorHex: '#2563EB',
    managedSubsystems: ['structure', 'power', 'thermal', 'cdh'],
    description: 'Assembles spacecraft Frame, Power generation/storage, Thermal radiators, and Central CPU avionics.',
    privateGoal: {
      title: 'Mass Margin & Continuous Power',
      description: 'Keep total spacecraft wet mass under 75% of launcher capacity and maintain positive net power (+W).',
      targetLabel: 'Mass <= 75% Capacity & Net Power > 0 W',
      checkMet: ({ budgets }) => {
        const capacity = Math.max(1, budgets.launchCapacityKg);
        const massPct = Math.round((budgets.totalMassKg / capacity) * 100);
        const powerMargin = budgets.powerMarginW;
        const met = (budgets.totalMassKg / capacity) <= 0.75 && powerMargin > 0;
        return {
          met,
          currentText: `${massPct}% capacity / ${powerMargin >= 0 ? '+' : ''}${powerMargin} W`,
          targetText: '<= 75% Mass & > 0 W Power',
        };
      },
    },
  },
  science: {
    id: 'science',
    name: 'Science Lead',
    shortTitle: 'SCIENCE',
    badge: 'SCI',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-800',
    colorHex: '#059669',
    managedSubsystems: ['payload'],
    description: 'Selects the scientific sensor and instrument payload suite to maximize planetary discovery yield.',
    privateGoal: {
      title: 'High-Yield Planetary Survey',
      description: 'Equip at least 2 distinct science instruments and achieve >= 80% science yield.',
      targetLabel: '>= 2 Instruments & >= 80 Sci Points',
      checkMet: ({ selectedComponents, flightResults, budgets }) => {
        const instruments = selectedComponents.filter((c) => c.subsystem === 'payload').length;
        const sci = flightResults?.totalScience ?? budgets.estimatedSciencePotential;
        const met = instruments >= 2 && sci >= 80;
        return {
          met,
          currentText: `${instruments} instruments / ${sci} science pts`,
          targetText: '>= 2 instruments & >= 80 pts',
        };
      },
    },
  },
  comms: {
    id: 'comms',
    name: 'Comms & Operations Lead',
    shortTitle: 'COMMS/OPS',
    badge: 'OPS',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-300',
    badgeText: 'text-purple-800',
    colorHex: '#7C3AED',
    managedSubsystems: ['communications', 'gnc', 'propulsion'],
    description: 'Configures Communications, GNC guidance, and propulsion. Executes in-flight mission action turns.',
    privateGoal: {
      title: 'Flawless Link & Hull Survival',
      description: 'Downlink at least 120 GB of telemetry and preserve spacecraft health at >= 80%.',
      targetLabel: '>= 120 GB Downlinked & >= 80% Health',
      checkMet: ({ flightResults }) => {
        const downlinked = flightResults?.dataDownlinkedGb ?? 180;
        const health = flightResults?.spacecraftHealth ?? 95;
        const met = downlinked >= 120 && health >= 80;
        return {
          met,
          currentText: `${Math.round(downlinked)} GB / ${health}% health`,
          targetText: '>= 120 GB & >= 80% Health',
        };
      },
    },
  },
};

export interface TeamPlayer {
  id: string;
  name: string;
  role: TeamRole | null;
  isReady: boolean;
  joinedAt: number;
}

export interface DesignReviewStatus {
  approved: boolean;
  rejected: boolean;
  autoApproved?: boolean;
  reason?: string;
  timestamp?: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  role: TeamRole | null;
  text: string;
  timestamp: number;
  isQuickMsg?: boolean;
}

export interface ActionVote {
  role: TeamRole;
  senderName: string;
  action: FlightAction;
  timestamp: number;
}

export interface TeamRoomState {
  code: string;
  hostPlayerId: string;
  status: 'lobby' | 'design' | 'flight' | 'debrief';
  fillEmptyRoles?: boolean;
  players: Record<string, TeamPlayer>;
  designReviews: Record<TeamRole, DesignReviewStatus>;
  turnVotes: Record<string, ActionVote>;
  chatMessages: ChatMessage[];
  lastSyncedTimestamp: number;
}

export const INITIAL_DESIGN_REVIEWS: Record<TeamRole, DesignReviewStatus> = {
  director: { approved: false, rejected: false },
  engineer: { approved: false, rejected: false },
  science: { approved: false, rejected: false },
  comms: { approved: false, rejected: false },
};

export const QUICK_TACTICAL_MESSAGES = [
  'All systems nominal.',
  'Check battery & solar margin!',
  'Need higher-gain comms dish!',
  'Mass limit exceeded—shed dry weight!',
  'Hold launch! Reviewing telemetry.',
  'Observe next turn for science bonus!',
  'Downlink data before buffer overflows!',
  'Engage safe mode / recharge batteries!',
  'Ready to approve design review.',
];

