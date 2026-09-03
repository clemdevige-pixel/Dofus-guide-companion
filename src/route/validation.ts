import type { RouteDocument, StepType } from './types';

const supportedTypes = new Set<StepType>([
  'quest',
  'resume',
  'dungeon',
  'preparation',
  'rule',
  'milestone',
  'long_running',
  'hard_lock',
  'alignment',
  'order',
  'major_step',
  'finish',
]);

type GoalState = 'active' | 'finished';

function assertValidUrl(url: string, context: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new Error(`${context}: lien invalide (${url})`);
  }
}

export function validateRoute(route: RouteDocument): RouteDocument {
  if (route.schemaVersion !== 1) {
    throw new Error(`Version de schéma non supportée : ${route.schemaVersion}`);
  }

  const blockIds = new Set<string>();
  const blockOrders = new Set<number>();
  for (const block of route.blocks) {
    if (blockIds.has(block.id)) {
      throw new Error(`blockId dupliqué : ${block.id}`);
    }
    if (blockOrders.has(block.order)) {
      throw new Error(`ordre de bloc dupliqué : ${block.order}`);
    }
    blockIds.add(block.id);
    blockOrders.add(block.order);
  }

  const stepIds = new Set<string>();
  const stepOrders = new Set<number>();
  const goalStates = new Map<string, GoalState>();

  for (const step of route.steps) {
    if (stepIds.has(step.id)) {
      throw new Error(`stepId dupliqué : ${step.id}`);
    }
    if (stepOrders.has(step.order)) {
      throw new Error(`ordre d'étape dupliqué : ${step.order}`);
    }
    stepIds.add(step.id);
    stepOrders.add(step.order);

    if (!blockIds.has(step.blockId)) {
      throw new Error(`${step.id}: blockId inconnu (${step.blockId})`);
    }

    if (!supportedTypes.has(step.type)) {
      throw new Error(`${step.id}: type inconnu (${String(step.type)})`);
    }

    if (step.source) {
      assertValidUrl(step.source.url, step.id);
    }

    if (step.type === 'long_running' && !step.longRunningGoal) {
      throw new Error(`${step.id}: FIL ROUGE sans métadonnées longRunningGoal.`);
    }

    if (step.type === 'hard_lock' && !step.hardLock) {
      throw new Error(`${step.id}: VERROU DUR sans métadonnées hardLock.`);
    }

    const goal = step.longRunningGoal;
    if (goal) {
      const state = goalStates.get(goal.goalId);

      if (goal.phase === 'start') {
        if (state) {
          throw new Error(`${step.id}: goalId démarré plusieurs fois (${goal.goalId}).`);
        }
        goalStates.set(goal.goalId, 'active');
      } else if (goal.phase === 'progress') {
        if (state !== 'active') {
          throw new Error(`${step.id}: progress avant start ou après finish (${goal.goalId}).`);
        }
      } else if (goal.phase === 'finish') {
        if (state !== 'active') {
          throw new Error(`${step.id}: finish avant start ou après finish (${goal.goalId}).`);
        }
        goalStates.set(goal.goalId, 'finished');
      }
    }

    if (step.hardLock?.goalId && !goalStates.has(step.hardLock.goalId)) {
      throw new Error(
        `${step.id}: verrou lié à un goalId pas encore démarré (${step.hardLock.goalId})`,
      );
    }
  }

  return route;
}
