const fs = require('fs');
const ts = require('typescript');

function loadTs(path) {
  const code = fs.readFileSync(path, 'utf8');
  const res = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  });
  return res.outputText;
}

const gameData = {};
new Function('exports', 'require', 'module', loadTs('./src/data/gameData.ts'))(gameData, (p) => {
  if (p.includes('missionObjectives')) {
    const mo = {};
    new Function('exports', 'require', 'module', loadTs('./src/data/missionObjectives.ts'))(mo, () => ({}), { exports: mo });
    return mo;
  }
  return {};
}, { exports: gameData });

const missionObjectives = {};
new Function('exports', 'require', 'module', loadTs('./src/data/missionObjectives.ts'))(missionObjectives, () => ({}), { exports: missionObjectives });

const budgetEngine = {};
new Function('exports', 'require', 'module', loadTs('./src/game/physics/budgetEngine.ts'))(budgetEngine, (p) => {
  if (p.includes('missionObjectives')) return missionObjectives;
  if (p.includes('gameData')) return gameData;
  return {};
}, { exports: budgetEngine });

const { MISSIONS, ROCKETS, PARTS } = gameData;
const { calculateBudgetTotals, runPreflightDiagnostics, getMissionRequirements } = budgetEngine;

const AUTOBUILDS = {
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

const results = [];

MISSIONS.forEach(mission => {
  const build = AUTOBUILDS[mission.id];
  const rocket = ROCKETS.find(r => r.id === build.rocketId);
  const comps = build.parts.map(id => PARTS.find(p => p.id === id));

  ['beginner', 'standard', 'expert'].forEach(diff => {
    const budgets = calculateBudgetTotals(comps, mission, rocket, diff);
    const diags = runPreflightDiagnostics(comps, mission, rocket, budgets);
    const errors = diags.filter(d => d.type === 'error');
    const reqs = getMissionRequirements(mission, diff, rocket);

    results.push({
      Mission: mission.name,
      Difficulty: diff,
      Rocket: rocket.name.split(' ')[0],
      Status: errors.length === 0 ? 'PASS' : 'FAIL',
      Mass: `${budgets.totalMassKg}/${budgets.launchCapacityKg} kg`,
      DeltaV: `${budgets.availableDeltaVMs}/${budgets.requiredDeltaVMs} m/s`,
      Power: `+${budgets.powerMarginW} W`,
      Cost: `${(budgets.totalCostCredits / 1000).toFixed(0)}K / ${(reqs.budgetCredits / 1000).toFixed(0)}K CR`,
      Errors: errors.length,
    });
  });
});

console.table(results);
