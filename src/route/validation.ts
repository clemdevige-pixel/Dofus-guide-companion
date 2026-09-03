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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

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
  if (!isNonEmptyString(route.routeVersion) || !isNonEmptyString(route.title)) {
    throw new Error('RouteDocument incomplet : routeVersion et title sont obligatoires.');
  }
  if (!Array.isArray(route.blocks) || route.blocks.length === 0) {
    throw new Error('RouteDocument sans bloc.');
  }
  if (!Array.isArray(route.steps) || route.steps.length === 0) {
    throw new Error('RouteDocument sans étape.');
  }

  const blockIds = new Set<string>();
  for (let index = 0; index < route.blocks.length; index += 1) {
    const block = route.blocks[index];
    const expectedOrder = index + 1;

    if (!isNonEmptyString(block.id) || !isNonEmptyString(block.title)) {
      throw new Error(`Bloc ${expectedOrder}: id et title sont obligatoires.`);
    }
    if (block.order !== expectedOrder) {
      throw new Error(`Bloc ${block.id}: ordre attendu ${expectedOrder}, reçu ${block.order}.`);
    }
    if (blockIds.has(block.id)) {
      throw new Error(`blockId dupliqué : ${block.id}`);
    }
    blockIds.add(block.id);
  }

  const stepIds = new Set<string>();
  const goalStates = new Map<string, GoalState>();
  let finishCount = 0;

  for (let index = 0; index < route.steps.length; index += 1) {
    const step = route.steps[index];
    const expectedOrder = index + 1;

    if (!isNonEmptyString(step.id) || !isNonEmptyString(step.title)) {
      throw new Error(`Étape ${expectedOrder}: id et title sont obligatoires.`);
    }
    if (step.order !== expectedOrder) {
      throw new Error(`${step.id}: ordre attendu ${expectedOrder}, reçu ${step.order}.`);
    }
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
      if (!isNonEmptyString(step.source.label) || !isNonEmptyString(step.source.url)) {
        throw new Error(`${step.id}: source incomplète.`);
      }
      assertValidUrl(step.source.url, step.id);
    }

    if (step.location) {
      if (!Number.isInteger(step.location.x) || !Number.isInteger(step.location.y)) {
        throw new Error(`${step.id}: position invalide, x et y doivent être des entiers.`);
      }
    }

    if (step.type === 'preparation') {
      const hasItems =
        Array.isArray(step.preparationItems) &&
        step.preparationItems.length > 0 &&
        step.preparationItems.every(isNonEmptyString);
      if (!hasItems && !isNonEmptyString(step.instruction)) {
        throw new Error(`${step.id}: PRÉPA sans preparationItems ni instruction exploitable.`);
      }
    }

    if (step.type === 'long_running' && !step.longRunningGoal) {
      throw new Error(`${step.id}: FIL ROUGE sans métadonnées longRunningGoal.`);
    }

    if (step.type === 'hard_lock') {
      if (!step.hardLock || !isNonEmptyString(step.hardLock.message)) {
        throw new Error(`${step.id}: VERROU DUR sans message structuré.`);
      }
    }

    const goal = step.longRunningGoal;
    if (goal) {
      if (!isNonEmptyString(goal.goalId)) {
        throw new Error(`${step.id}: goalId vide.`);
      }

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
      } else {
        throw new Error(`${step.id}: phase de goal inconnue (${String(goal.phase)}).`);
      }
    }

    if (step.hardLock?.goalId && !goalStates.has(step.hardLock.goalId)) {
      throw new Error(
        `${step.id}: verrou lié à un goalId pas encore démarré (${step.hardLock.goalId})`,
      );
    }

    if (step.type === 'finish') {
      finishCount += 1;
      if (index !== route.steps.length - 1) {
        throw new Error(`${step.id}: FIN doit être la dernière étape de la route.`);
      }
    }
  }

  if (finishCount !== 1) {
    throw new Error(`La route doit contenir exactement une étape FIN, reçu : ${finishCount}.`);
  }

  return route;
}
