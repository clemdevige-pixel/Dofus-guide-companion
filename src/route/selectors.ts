import type { RouteDocument, RouteStep } from './types';

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
