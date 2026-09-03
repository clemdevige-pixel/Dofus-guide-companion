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
  for (const block of route.blocks) {
    if (blockIds.has(block.id)) {
      throw new Error(`blockId dupliqué : ${block.id}`);
    }
    blockIds.add(block.id);
  }

  const stepIds = new Set<string>();
  const startedGoalIds = new Set<string>();

  for (const step of route.steps) {
    if (stepIds.has(step.id)) {
      throw new Error(`stepId dupliqué : ${step.id}`);
    }
    stepIds.add(step.id);

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

    if (step.longRunningGoal?.phase === 'start') {
      if (startedGoalIds.has(step.longRunningGoal.goalId)) {
        throw new Error(`goalId démarré plusieurs fois : ${step.longRunningGoal.goalId}`);
      }
      startedGoalIds.add(step.longRunningGoal.goalId);
    }
  }

  for (const step of route.steps) {
    const goal = step.longRunningGoal;
    if (
      goal &&
      (goal.phase === 'progress' || goal.phase === 'finish') &&
      !startedGoalIds.has(goal.goalId)
    ) {
      throw new Error(`${step.id}: ${goal.phase} lié à un goalId jamais démarré (${goal.goalId})`);
    }

    if (step.hardLock?.goalId && !startedGoalIds.has(step.hardLock.goalId)) {
      throw new Error(
        `${step.id}: verrou lié à un goalId jamais démarré (${step.hardLock.goalId})`,
      );
    }
  }

  return route;
}
