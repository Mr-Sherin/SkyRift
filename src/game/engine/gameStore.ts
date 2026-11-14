import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  MissionScenario,
  LaunchVehicle,
  SpacecraftComponent,
  SubsystemType,
  GamePhase,
  GameDifficulty,
  BudgetTotals,
} from '@/game/types';
import { MISSIONS, ROCKETS, PARTS } from '@/data/gameData';
import { calculateBudgetTotals } from '@/game/physics/budgetEngine';
import { sfx } from '@/lib/audio';
import { getActiveCampaignBonus, isMissionUnlocked } from '@/data/campaign';

export type InstalledPartsByCategory = Record<SubsystemType, SpacecraftComponent[]>;

function createEmptyPartsMap(): InstalledPartsByCategory {
  return {
    structure: [],
    power: [],
    propulsion: [],
    communications: [],
    gnc: [],
    thermal: [],
    cdh: [],
    payload: [],
  };
}

const EMPTY_INSTALLED_PARTS: InstalledPartsByCategory = createEmptyPartsMap();

const NOMINAL_PRESET_IDS = [
  'bus-smallsat-hex',
  'eps-solar-deployable',
  'eps-li-ion-heavy',
  'prop-bipropellant',
  'comm-parabolic-mga',
  'gnc-reactionwheels-imu',
  'tcs-passive-mli',
  'cdh-radhard-dual',
  'inst-multispectral',
  'inst-gamma-neutron',
];

export interface GameStoreState {
  // Core Store Fields required by specification
  selectedMission: MissionScenario;
  installedParts: InstalledPartsByCategory;
  selectedRocket: LaunchVehicle | null;
  phase: GamePhase;
  difficulty: GameDifficulty;

  // Compatibility aliases
  activeScenario: MissionScenario;
  selectedComponents: SpacecraftComponent[];
  selectedLauncher: LaunchVehicle | null;
  budgets: BudgetTotals;
  activeRole: 'commander' | 'engineer' | 'science' | 'flightOps';

  // Actions
  selectMission: (scenarioIdOrMission: string | MissionScenario) => void;
  selectScenario: (scenarioId: string) => void;
  installPart: (componentOrId: string | SpacecraftComponent) => void;
  addComponent: (componentId: string) => void;
  uninstallPart: (componentId: string) => void;
  removeComponent: (componentId: string) => void;
  selectRocket: (launcherOrId: string | LaunchVehicle | null) => void;
  selectLauncher: (launcherId: string) => void;
  setPhase: (phase: GamePhase) => void;
  setDifficulty: (difficulty: GameDifficulty) => void;
  setActiveRole: (role: 'commander' | 'engineer' | 'science' | 'flightOps') => void;
  resetSpacecraft: () => void;
  loadPresetNominal: () => void;
}

function computeAllTotals(
  components: SpacecraftComponent[],
  mission: MissionScenario,
  rocket: LaunchVehicle | null,
  difficulty: GameDifficulty = 'standard'
): BudgetTotals {
  const bonus = getActiveCampaignBonus();
  return calculateBudgetTotals(components, mission, rocket, difficulty, bonus);
}

function flattenParts(byCategory: InstalledPartsByCategory): SpacecraftComponent[] {
  return Object.values(byCategory).flat();
}

function buildCategoryMap(components: SpacecraftComponent[]): InstalledPartsByCategory {
  const map: InstalledPartsByCategory = {
    structure: [],
    power: [],
    propulsion: [],
    communications: [],
    gnc: [],
    thermal: [],
    cdh: [],
    payload: [],
  };
  components.forEach((c) => {
    if (map[c.subsystem]) {
      map[c.subsystem].push(c);
    }
  });
  return map;
}

const defaultMission = MISSIONS[0]; // Orbital Sentinel (Earth Obs) - always unlocked
const defaultRocket = ROCKETS[0];  // Scout-V / or default starter launcher
const initialComponents = NOMINAL_PRESET_IDS
  .map((id) => PARTS.find((c) => c.id === id))
  .filter(Boolean) as SpacecraftComponent[];
const initialByCategory = buildCategoryMap(initialComponents);
const initialBudgets = computeAllTotals(initialComponents, defaultMission, defaultRocket);

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      selectedMission: defaultMission,
      installedParts: initialByCategory,
      selectedRocket: defaultRocket,
      phase: 'design',
      difficulty: 'standard',

      // Compatibility bindings
      activeScenario: defaultMission,
      selectedComponents: initialComponents,
      selectedLauncher: defaultRocket,
      budgets: initialBudgets,
      activeRole: 'commander',

      selectMission: (input) => {
        const mission =
          typeof input === 'string'
            ? MISSIONS.find((m) => m.id === input) || get().selectedMission
            : input;

        // Ensure locked missions can never become the active mission
        if (!isMissionUnlocked(mission.id)) {
          sfx.playAlert();
          return;
        }

        // When switching missions, reset installed parts and launcher to start fresh
        const isMissionChanging = mission.id !== get().selectedMission.id;
        const nextParts = isMissionChanging
          ? {
              structure: [],
              power: [],
              propulsion: [],
              communications: [],
              gnc: [],
              thermal: [],
              cdh: [],
              payload: [],
            }
          : get().installedParts;
        const nextFlat = isMissionChanging ? [] : flattenParts(nextParts);
        const nextRocket = isMissionChanging ? null : get().selectedRocket;
        const budgets = computeAllTotals(nextFlat, mission, nextRocket, get().difficulty);

        set({
          selectedMission: mission,
          activeScenario: mission,
          installedParts: nextParts,
          selectedComponents: nextFlat,
          selectedRocket: nextRocket,
          selectedLauncher: nextRocket,
          budgets,
        });
        sfx.playClick();
      },

      selectScenario: (scenarioId: string) => {
        get().selectMission(scenarioId);
      },

      installPart: (input) => {
        const comp =
          typeof input === 'string'
            ? PARTS.find((c) => c.id === input)
            : input;
        if (!comp) return;

        const currentComps = [...(get().selectedComponents || [])];
        const singleInstanceSubs: SubsystemType[] = ['structure', 'cdh'];

        let nextComps: SpacecraftComponent[];
        if (singleInstanceSubs.includes(comp.subsystem)) {
          nextComps = currentComps.filter((c) => c.subsystem !== comp.subsystem).concat(comp);
        } else {
          nextComps = [...currentComps, comp];
        }

        const map = buildCategoryMap(nextComps);
        const budgets = computeAllTotals(nextComps, get().selectedMission, get().selectedRocket, get().difficulty);

        set({
          installedParts: map,
          selectedComponents: nextComps,
          budgets,
        });
        try {
          sfx.playComponentAttach();
        } catch {
          // ignore audio failure
        }
      },

      addComponent: (componentId: string) => {
        get().installPart(componentId);
      },

      uninstallPart: (componentId: string) => {
        const currentComps = [...(get().selectedComponents || [])];
        const idx = currentComps.findIndex((c) => c.id === componentId);
        if (idx !== -1) {
          currentComps.splice(idx, 1);
        }

        const map = buildCategoryMap(currentComps);
        const budgets = computeAllTotals(currentComps, get().selectedMission, get().selectedRocket, get().difficulty);

        set({
          installedParts: map,
          selectedComponents: currentComps,
          budgets,
        });
        try {
          sfx.playClick();
        } catch {
          // ignore audio failure
        }
      },

      removeComponent: (componentId: string) => {
        get().uninstallPart(componentId);
      },

      selectRocket: (input) => {
        let rocket: LaunchVehicle | null = null;
        if (typeof input === 'string') {
          rocket = ROCKETS.find((r) => r.id === input) || null;
        } else {
          rocket = input;
        }

        const currentParts = flattenParts(get().installedParts);
        const budgets = computeAllTotals(currentParts, get().selectedMission, rocket, get().difficulty);

        set({
          selectedRocket: rocket,
          selectedLauncher: rocket,
          budgets,
        });
        sfx.playClick();
      },

      selectLauncher: (launcherId: string) => {
        get().selectRocket(launcherId);
      },

      setPhase: (phase: GamePhase) => {
        set({ phase });
      },

      setDifficulty: (difficulty: GameDifficulty) => {
        const flat = flattenParts(get().installedParts);
        const budgets = computeAllTotals(flat, get().selectedMission, get().selectedRocket, difficulty);
        set({ difficulty, budgets });
        sfx.playClick();
      },

      setActiveRole: (role) => {
        set({ activeRole: role });
      },

      resetSpacecraft: () => {
        const emptyMap = createEmptyPartsMap();
        const budgets = computeAllTotals([], get().selectedMission, get().selectedRocket, get().difficulty);
        set({
          installedParts: emptyMap,
          selectedComponents: [],
          budgets,
        });
        sfx.playAlert();
      },

      loadPresetNominal: () => {
        const comps = NOMINAL_PRESET_IDS
          .map((id) => PARTS.find((c) => c.id === id))
          .filter(Boolean) as SpacecraftComponent[];
        const map = buildCategoryMap(comps);
        const budgets = computeAllTotals(comps, get().selectedMission, get().selectedRocket);

        set({
          installedParts: map,
          selectedComponents: comps,
          budgets,
        });
      },
    }),
    {
      name: 'skyrift_mission_state_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        scenarioId: state.selectedMission.id,
        launcherId: state.selectedRocket?.id || null,
        componentIds: state.selectedComponents.map((c) => c.id),
        phase: state.phase,
        difficulty: state.difficulty,
        activeRole: state.activeRole,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Re-construct objects from IDs safely after hydration
        try {
          const raw = localStorage.getItem('skyrift_mission_state_v1');
          if (!raw) return;
          const parsed = JSON.parse(raw);
          const stateData = parsed.state || parsed;

          const targetMission = MISSIONS.find((m) => m.id === stateData.scenarioId);
          const mission =
            targetMission && isMissionUnlocked(targetMission.id)
              ? targetMission
              : defaultMission;
          const rocket =
            ROCKETS.find((r) => r.id === stateData.launcherId) || defaultRocket;
          const components = Array.isArray(stateData.componentIds)
            ? (stateData.componentIds
                .map((id: string) => PARTS.find((c) => c.id === id))
                .filter(Boolean) as SpacecraftComponent[])
            : initialComponents;

          const byCategory = buildCategoryMap(components);
          const budgets = computeAllTotals(components, mission, rocket);

          state.selectedMission = mission;
          state.activeScenario = mission;
          state.selectedRocket = rocket;
          state.selectedLauncher = rocket;
          state.installedParts = byCategory;
          state.selectedComponents = components;
          state.budgets = budgets;
          if (stateData.phase) state.phase = stateData.phase;
          if (stateData.difficulty) state.difficulty = stateData.difficulty;
          if (stateData.activeRole) state.activeRole = stateData.activeRole;
        } catch {
          // ignore parsing error
        }
      },
    }
  )
);

