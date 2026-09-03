import type { RouteDocument, RouteStep } from './types';

export function getSortedSteps(route: RouteDocument): RouteStep[] {
  return [...route.steps].sort((a, b) => a.order - b.order);
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
  const steps = getSortedSteps(route);
  const activeGoalIds = new Set<string>();
  const activeSteps = new Map<string, RouteStep>();

  for (const step of steps) {
    if (completedStepIds.has(step.id)) {
      if (step.longRunningGoal?.phase === 'start' || step.longRunningGoal?.phase === 'progress') {
        activeGoalIds.add(step.longRunningGoal.goalId);
        activeSteps.set(step.longRunningGoal.goalId, step);
      }

      if (step.longRunningGoal?.phase === 'finish') {
        activeGoalIds.delete(step.longRunningGoal.goalId);
        activeSteps.delete(step.longRunningGoal.goalId);
      }

      if (step.type === 'hard_lock' && step.hardLock?.goalId) {
        activeGoalIds.delete(step.hardLock.goalId);
        activeSteps.delete(step.hardLock.goalId);
      }
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
