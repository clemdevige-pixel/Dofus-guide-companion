import type { RouteDocument, RouteStep } from './types';

const MAX_SEQUENCE_STEPS = 6;
const sequenceActions = new Set([
  'LANCER',
  'TERMINER',
  'LANCER / TERMINER',
  'REPRENDRE / TERMINER',
  'REPRENDRE / AVANCER',
  'FAIRE & VALIDER',
  'FAIRE / CAPTURER / VALIDER',
]);

export interface RouteStepGroup {
  id: string;
  blockId: string;
  steps: RouteStep[];
  isSequence: boolean;
}

function getRawSortedSteps(route: RouteDocument): RouteStep[] {
  return [...route.steps].sort((a, b) => a.order - b.order);
}

function getRuleText(rule: RouteStep): string {
  const title = rule.title.trim();
  const instruction = rule.instruction?.trim();

  if (!instruction || instruction === title) {
    return `⚠ ${title}`;
  }

  return `⚠ ${title} — ${instruction}`;
}

function isSequenceCandidate(step: RouteStep): boolean {
  if (step.type !== 'quest' && step.type !== 'resume' && step.type !== 'dungeon') {
    return false;
  }

  if (step.guideItems?.length || step.longRunningGoal || step.hardLock) {
    return false;
  }

  const action = step.action?.trim().toUpperCase() ?? '';
  if (!sequenceActions.has(action)) {
    return false;
  }

  const context = `${step.title}\n${step.instruction ?? ''}\n${step.launchInstruction ?? ''}`.toUpperCase();
  if (context.includes('⚠') || context.includes('STOP') || context.includes('FIL ROUGE')) {
    return false;
  }

  if ((step.instruction?.length ?? 0) > 220 || (step.launchInstruction?.length ?? 0) > 220) {
    return false;
  }

  return true;
}

export function getSortedSteps(route: RouteDocument): RouteStep[] {
  const visibleSteps: RouteStep[] = [];
  const pendingRules: RouteStep[] = [];

  for (const step of getRawSortedSteps(route)) {
    if (step.type === 'rule') {
      pendingRules.push(step);
      continue;
    }

    if (pendingRules.length === 0) {
      visibleSteps.push(step);
      continue;
    }

    const ruleContext = pendingRules.map(getRuleText).join('\n');
    const instruction = [ruleContext, step.instruction].filter(Boolean).join('\n');

    visibleSteps.push({
      ...step,
      instruction,
    });
    pendingRules.length = 0;
  }

  return visibleSteps;
}

export function getStepGroups(route: RouteDocument): RouteStepGroup[] {
  const steps = getSortedSteps(route);
  const groups: RouteStepGroup[] = [];

  for (let index = 0; index < steps.length; ) {
    const first = steps[index];
    if (!isSequenceCandidate(first)) {
      groups.push({ id: first.id, blockId: first.blockId, steps: [first], isSequence: false });
      index += 1;
      continue;
    }

    const sequence: RouteStep[] = [first];
    let cursor = index + 1;

    while (cursor < steps.length && sequence.length < MAX_SEQUENCE_STEPS) {
      const next = steps[cursor];
      if (next.blockId !== first.blockId || !isSequenceCandidate(next)) {
        break;
      }
      sequence.push(next);
      cursor += 1;
    }

    if (sequence.length === 1) {
      groups.push({ id: first.id, blockId: first.blockId, steps: sequence, isSequence: false });
      index += 1;
      continue;
    }

    groups.push({
      id: `sequence:${sequence[0].id}:${sequence.at(-1)!.id}`,
      blockId: first.blockId,
      steps: sequence,
      isSequence: true,
    });
    index += sequence.length;
  }

  return groups;
}

export function getStepGroupIndex(route: RouteDocument, stepId: string): number {
  return getStepGroups(route).findIndex((group) => group.steps.some((step) => step.id === stepId));
}

export function getFirstIncompleteStep(
  route: RouteDocument,
  completedStepIds: ReadonlySet<string>,
): RouteStep | undefined {
  return getSortedSteps(route).find((step) => !completedStepIds.has(step.id));
}

export function getStepIndex(route: RouteDocument, stepId: string): number {
  return getSortedSteps(route).findIndex((step) => step.id === stepId);
}

export function getProgress(route: RouteDocument, completedStepIds: ReadonlySet<string>) {
  const steps = getSortedSteps(route);
  const completed = steps.filter((step) => completedStepIds.has(step.id)).length;

  return {
    completed,
    total: steps.length,
    percentage: steps.length === 0 ? 0 : Math.round((completed / steps.length) * 100),
  };
}

export function getActiveLongRunningGoals(
  route: RouteDocument,
  completedStepIds: ReadonlySet<string>,
): RouteStep[] {
  const activeGoalIds = new Set<string>();
  const activeSteps = new Map<string, RouteStep>();

  for (const step of getSortedSteps(route)) {
    if (!completedStepIds.has(step.id)) {
      continue;
    }

    const goal = step.longRunningGoal;
    if (goal?.phase === 'start') {
      activeGoalIds.add(goal.goalId);
      activeSteps.set(goal.goalId, step);
    } else if (goal?.phase === 'progress' && activeGoalIds.has(goal.goalId)) {
      activeSteps.set(goal.goalId, step);
    } else if (goal?.phase === 'finish') {
      activeGoalIds.delete(goal.goalId);
      activeSteps.delete(goal.goalId);
    }

    if (step.type === 'hard_lock' && step.hardLock?.goalId) {
      activeGoalIds.delete(step.hardLock.goalId);
      activeSteps.delete(step.hardLock.goalId);
    }
  }

  return [...activeGoalIds]
    .map((goalId) => activeSteps.get(goalId))
    .filter((step): step is RouteStep => step !== undefined);
}

export function getNextHardLock(
  route: RouteDocument,
  completedStepIds: ReadonlySet<string>,
): RouteStep | undefined {
  return getSortedSteps(route).find(
    (step) => step.type === 'hard_lock' && !completedStepIds.has(step.id),
  );
}

export function getHardLockForGoal(
  route: RouteDocument,
  goalId: string,
): RouteStep | undefined {
  return getSortedSteps(route).find(
    (step) => step.type === 'hard_lock' && step.hardLock?.goalId === goalId,
  );
}

export function getBlockPreparationSteps(
  route: RouteDocument,
  blockId: string,
): RouteStep[] {
  return getSortedSteps(route).filter(
    (step) => step.blockId === blockId && step.type === 'preparation',
  );
}

export function getCompletedSteps(
  route: RouteDocument,
  completedStepIds: ReadonlySet<string>,
): RouteStep[] {
  return getSortedSteps(route)
    .filter((step) => completedStepIds.has(step.id))
    .reverse();
}
