import type { GuideItemAction, RouteDocument, RouteStep } from './types';

export interface RouteStepGroup {
  id: string;
  blockId: string;
  steps: RouteStep[];
  isSequence: boolean;
}

export interface RouteSequenceObjective {
  id: string;
  steps: RouteStep[];
}

export interface ActiveParallelGroup {
  parallelId: string;
  members: RouteStep[];
}

const sequenceGuideActionLabels: Record<GuideItemAction, string> = {
  take: 'PRENDRE',
  advance: 'AVANCER',
  finish: 'TERMINER',
  do: 'FAIRE',
};

function getRawSortedSteps(route: RouteDocument): RouteStep[] {
  return [...route.steps].sort((a, b) => a.order - b.order);
}

function getRuleText(rule: RouteStep): string {
  const title = rule.title.trim();
  const instruction = rule.instruction?.trim();
  if (!instruction || instruction === title) return `⚠ ${title}`;
  return `⚠ ${title} — ${instruction}`;
}

function formatSequenceGuideItems(step: RouteStep): string | undefined {
  if (!step.guideItems?.length) return undefined;

  return step.guideItems
    .map((item) => {
      const location = item.location ? ` [${item.location.x},${item.location.y}]` : '';
      const note = item.note ? ` — ${item.note}` : '';
      return `${sequenceGuideActionLabels[item.action]} — ${item.label}${location}${note}`;
    })
    .join('\n');
}

function getSequenceFallbackInstruction(step: RouteStep): string | undefined {
  if (step.guideItems?.length || step.instruction || !step.action) return undefined;
  if (step.displayRole === 'transition') return `${step.action} — ${step.title}`;
  return step.action;
}

function toSequenceDisplayStep(step: RouteStep): RouteStep {
  const displayStep = { ...step };
  displayStep.instruction = [
    formatSequenceGuideItems(step),
    step.instruction,
    getSequenceFallbackInstruction(step),
  ]
    .filter(Boolean)
    .join('\n');
  delete displayStep.action;
  return displayStep;
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
    visibleSteps.push({ ...step, instruction });
    pendingRules.length = 0;
  }

  return visibleSteps;
}

/** MOMENT_ID is the only multi-step card boundary. */
export function getStepGroups(route: RouteDocument): RouteStepGroup[] {
  const steps = getSortedSteps(route);
  const groups: RouteStepGroup[] = [];

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (!step.momentId) {
      groups.push({ id: step.id, blockId: step.blockId, steps: [step], isSequence: false });
      continue;
    }

    const momentId = step.momentId;
    const members: RouteStep[] = [step];
    let cursor = index + 1;
    while (
      cursor < steps.length &&
      steps[cursor].blockId === step.blockId &&
      steps[cursor].momentId === momentId
    ) {
      members.push(steps[cursor]);
      cursor += 1;
    }

    groups.push({
      id: `moment:${momentId}`,
      blockId: step.blockId,
      steps: members,
      isSequence: members.length > 1,
    });
    index = cursor - 1;
  }

  return groups;
}

export function getSequenceObjectives(steps: RouteStep[]): RouteSequenceObjective[] {
  const objectives: RouteSequenceObjective[] = [];
  for (const rawStep of steps) {
    const step = toSequenceDisplayStep(rawStep);
    const currentObjective = objectives.at(-1);
    if (
      (rawStep.displayRole === 'transition' || rawStep.displayRole === 'detail') &&
      currentObjective
    ) {
      currentObjective.steps.push(step);
      continue;
    }
    objectives.push({ id: rawStep.id, steps: [step] });
  }
  return objectives;
}

export function getActiveParallelGroups(
  route: RouteDocument,
  completedStepIds: ReadonlySet<string>,
): ActiveParallelGroup[] {
  const activeIds = new Set<string>();
  const memberIds = new Map<string, Set<string>>();
  const sortedSteps = getSortedSteps(route);

  for (const step of sortedSteps) {
    const parallel = step.parallelGroup;
    if (!parallel || !completedStepIds.has(step.id)) continue;

    if (parallel.phase === 'start') {
      activeIds.add(parallel.parallelId);
    }

    if (
      parallel.phase !== 'finish' &&
      step.type !== 'dungeon' &&
      activeIds.has(parallel.parallelId)
    ) {
      const members = memberIds.get(parallel.parallelId) ?? new Set<string>();
      members.add(step.id);
      memberIds.set(parallel.parallelId, members);
    }

    if (parallel.phase === 'finish') {
      activeIds.delete(parallel.parallelId);
    }
  }

  return [...activeIds].map((parallelId) => {
    const ids = memberIds.get(parallelId) ?? new Set<string>();
    const members = sortedSteps.filter((step) => ids.has(step.id));
    return { parallelId, members };
  });
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
    if (!completedStepIds.has(step.id)) continue;
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

export function getHardLockForGoal(route: RouteDocument, goalId: string): RouteStep | undefined {
  return getSortedSteps(route).find(
    (step) => step.type === 'hard_lock' && step.hardLock?.goalId === goalId,
  );
}

export function getBlockPreparationSteps(route: RouteDocument, blockId: string): RouteStep[] {
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
