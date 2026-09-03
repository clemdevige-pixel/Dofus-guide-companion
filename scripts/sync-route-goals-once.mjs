import { readFile, writeFile } from 'node:fs/promises';

const ROUTE_PATH = new URL('../data/route.json', import.meta.url);

const expectedGoals = new Map([
  ['route-step-0073', { goalId: 'combat-de-rue', phase: 'start' }],
  ['route-step-0092', { goalId: 'combat-de-rue', phase: 'finish' }],
  ['route-step-0361', { goalId: 'benediction-viti', phase: 'start' }],
  ['route-step-0454', { goalId: 'benediction-viti', phase: 'progress' }],
  ['route-step-0467', { goalId: 'benediction-viti', phase: 'finish' }],
  ['route-step-0470', { goalId: 'benediction-thomahon', phase: 'start' }],
  ['route-step-0522', { goalId: 'benediction-thomahon', phase: 'finish' }],
  ['route-step-0525', { goalId: 'benediction-foluk', phase: 'start' }],
  ['route-step-0559', { goalId: 'rescapes-village-enseveli', phase: 'start' }],
  ['route-step-0569', { goalId: 'mission-solution', phase: 'start' }],
  ['route-step-0578', { goalId: 'benediction-foluk', phase: 'finish' }],
  ['route-step-0585', { goalId: 'rescapes-village-enseveli', phase: 'finish' }],
  ['route-step-0586', { goalId: 'mission-solution', phase: 'progress' }],
  ['route-step-0587', { goalId: 'mission-solution', phase: 'finish' }],
  ['route-step-0611', { goalId: 'vie-de-chateau', phase: 'start' }],
  ['route-step-0634', { goalId: 'vie-de-chateau', phase: 'finish' }],
]);

const route = JSON.parse(await readFile(ROUTE_PATH, 'utf8'));
const stepsById = new Map(route.steps.map((step) => [step.id, step]));

for (const [stepId, goal] of expectedGoals) {
  const step = stepsById.get(stepId);
  if (!step) {
    throw new Error(`Étape absente du runtime : ${stepId}`);
  }

  if (step.longRunningGoal) {
    const current = JSON.stringify(step.longRunningGoal);
    const expected = JSON.stringify(goal);
    if (current !== expected) {
      throw new Error(`${stepId}: longRunningGoal différent de la source attendue.`);
    }
    continue;
  }

  step.longRunningGoal = goal;
}

await writeFile(ROUTE_PATH, `${JSON.stringify(route)}\n`, 'utf8');
console.log(`Synchronisé ${expectedGoals.size} checkpoints de fils rouges.`);
