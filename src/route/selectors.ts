import type { RouteDocument, RouteStep } from './types';

const MAX_SEQUENCE_STEPS = 8;
const sequenceStepTypes = new Set<RouteStep['type']>([
  'quest',
  'resume',
  'dungeon',
  'alignment',
  'order',
]);

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

function getStepContext(step: RouteStep): string {
  return `${step.title}\n${step.action ?? ''}\n${step.instruction ?? ''}\n${step.launchInstruction ?? ''}`.toUpperCase();
}

/**
 * Ordinary actionable steps without an explicit editorial moment may still share a
 * compact checklist. Explicit momentId values are handled separately and are the
 * authoritative card boundaries.
 */
function isSequenceCandidate(step: RouteStep): boolean {
  if (!sequenceStepTypes.has(step.type)) {
    return false;
  }

  if (step.guideItems?.length || step.longRunningGoal || step.hardLock) {
    return false;
  }

  const context = getStepContext(step);
  if (context.includes('⚠') || context.includes('FIL ROUGE') || context.includes('VERROU DUR')) {
    return false;
  }

  return Boolean(step.action?.trim() || step.instruction?.trim() || step.title.trim());
}

/**
 * MOMENT_ID is an editorial card boundary, regardless of the technical RouteStep type.
 * This allows one player-facing moment to contain quests, resumptions, milestones,
 * hard locks, long-running-goal transitions or major steps without React having to
 * infer business meaning from text.
 */
function isExplicitMomentStep(step: RouteStep): boolean {
  return Boolean(step.momentId);
}

/** A STOP closes only an inferred checklist. Explicit moments are already bounded by momentId. */
function closesSequence(step: RouteStep): boolean {
  return getStepContext(step).includes('STOP');
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
  let sequence: RouteStep[] = [];

  function flushSequence() {
    if (sequence.length === 0) {
      return;
    }

    const first = sequence[0];
    const last = sequence.at(-1)!;
    groups.push({
      id: sequence.length === 1 ? first.id : `sequence:${first.id}:${last.id}`,
      blockId: first.blockId,
      steps: sequence,
      isSequence: sequence.length > 1,
    });
    sequence = [];
  }

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];

    if (isExplicitMomentStep(step)) {
      flushSequence();

      const momentId = step.momentId!;
      const members: RouteStep[] = [step];
      let cursor = index + 1;
      while (
        cursor < steps.length &&
        steps[cursor].blockId === step.blockId &&
        steps[cursor].momentId === momentId &&
        isExplicitMomentStep(steps[cursor])
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
      continue;
    }

    const blockChanged = sequence.length > 0 && sequence[0].blockId !== step.blockId;
    if (blockChanged || !isSequenceCandidate(step)) {
      flushSequence();
      groups.push({ id: step.id, blockId: step.blockId, steps: [step], isSequence: false });
      continue;
    }

    sequence.push(step);

    if (closesSequence(step) || sequence.length >= MAX_SEQUENCE_STEPS) {
      flushSequence();
    }
  }

  flushSequence();
  return groups;
}

/**
 * Collapses technical RouteSteps carrying the same explicit editorial momentId into
 * one player-facing objective. The UI does not infer quest identity from titles,
 * instructions or external URLs.
 */
export function getSequenceObjectives(steps: RouteStep[]): RouteSequenceObjective[] {
  const objectives: RouteSequenceObjective[] = [];
  let index = 0;

  while (index < steps.length) {
    const first = steps[index];
    const momentId = first.momentId;

    if (!momentId) {
      objectives.push({ id: first.id, steps: [first] });
      index += 1;
      continue;
    }

    const members: RouteStep[] = [first];
    let cursor = index + 1;
    while (cursor < steps.length && steps[cursor].momentId === momentId) {
      members.push(steps[cursor]);
      cursor += 1;
    }

    objectives.push({ id: `moment:${momentId}`, steps: members });
    index = cursor;
  }

  return objectives;
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
      activeSteps.delete(step.goalId);
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
