import type { RouteDocument, RouteStep } from './types';

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

const dungeonExitWarningPrefix = '⚠ AVANT DE SORTIR DU DONJON —';
const semanticStopWords = new Set([
  'avec', 'dans', 'pour', 'puis', 'apres', 'avant', 'cette', 'depuis', 'entre', 'faire',
  'fais', 'fait', 'jusqu', 'mais', 'plus', 'sans', 'salle', 'sortir', 'termine', 'terminer',
  'vers', 'votre', 'quand', 'reste', 'restez', 'apres', 'avant', 'donjon',
]);

function getRawSortedSteps(route: RouteDocument): RouteStep[] {
  return [...route.steps].sort((a, b) => a.order - b.order);
}

function getRuleText(rule: RouteStep): string {
  const title = rule.title.trim();
  const instruction = rule.instruction?.trim();
  if (!instruction || instruction === title) return `⚠ ${title}`;
  return `⚠ ${title} — ${instruction}`;
}

function normalizeSemanticText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSemanticTokens(value: string): Set<string> {
  return new Set(
    normalizeSemanticText(value)
      .split(' ')
      .filter((token) => token.length >= 4 && !semanticStopWords.has(token)),
  );
}

function getTokenOverlap(left: string, right: string): number {
  const leftTokens = getSemanticTokens(left);
  const rightTokens = getSemanticTokens(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let common = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) common += 1;
  }
  return common / Math.min(leftTokens.size, rightTokens.size);
}

function trimTrailingConnector(value: string): string {
  return value
    .replace(/\s*[,;:\-–—]+\s*$/g, '')
    .replace(/\s+(?:et|puis)\s*$/i, '')
    .trim();
}

function removeCriticalWarningDuplicate(instruction: string | undefined, warning: string | undefined): string | undefined {
  if (!instruction || !warning?.startsWith(dungeonExitWarningPrefix)) return instruction;

  const warningContent = warning.slice(dungeonExitWarningPrefix.length).trim();
  const sentences = instruction.split(/(?<=[.!?])\s+|\n+/).map((sentence) => sentence.trim()).filter(Boolean);
  const cleaned: string[] = [];

  for (const sentence of sentences) {
    const overlap = getTokenOverlap(sentence, warningContent);
    const cue = sentence.search(/\b(?:avant de sortir|avant de partir|dans la salle de sortie|dans la salle de fin)\b/i);

    if (cue >= 0 && overlap >= 0.25) {
      const prefix = trimTrailingConnector(sentence.slice(0, cue));
      if (prefix) cleaned.push(prefix.endsWith('.') ? prefix : `${prefix}.`);
      continue;
    }

    if (overlap >= 0.72) continue;
    cleaned.push(sentence);
  }

  const result = cleaned.join(' ').replace(/\s+/g, ' ').trim();
  return result || undefined;
}

function getCoreStepTitle(title: string): string {
  return title
    .replace(/^◆\s*/, '')
    .split(/\s+—\s+/)[0]
    .trim();
}

function isPrerequisiteCoveredByEarlierStep(prerequisite: string | undefined, earlierSteps: readonly RouteStep[]): boolean {
  if (!prerequisite) return false;
  const normalizedPrerequisite = normalizeSemanticText(prerequisite);

  return earlierSteps.some((step) => {
    const title = normalizeSemanticText(getCoreStepTitle(step.title));
    return title.length >= 6 && normalizedPrerequisite.includes(title);
  });
}

function isRewardWarningDuplicatedByInstruction(warning: string | undefined, instruction: string | undefined): boolean {
  if (!warning || !instruction || warning.startsWith(dungeonExitWarningPrefix)) return false;
  const match = warning.match(/^Récompense(?: notamment)? (?:la |le |les )?(.+?) (?:requise?|requis|nécessaire|nécessaires)\b/i);
  if (!match) return false;
  const reward = normalizeSemanticText(match[1]);
  return reward.length >= 5 && normalizeSemanticText(instruction).includes(reward);
}

function toSequenceDisplayStep(step: RouteStep, earlierSteps: readonly RouteStep[]): RouteStep {
  const displayStep = { ...step };

  if (step.displayRole === 'transition' && !step.instruction && (step.action || step.title)) {
    displayStep.instruction = [step.action, step.title].filter(Boolean).join(' — ');
  }

  displayStep.instruction = removeCriticalWarningDuplicate(displayStep.instruction, displayStep.warning);

  if (isPrerequisiteCoveredByEarlierStep(displayStep.prerequisites, earlierSteps)) {
    delete displayStep.prerequisites;
  }

  if (isRewardWarningDuplicatedByInstruction(displayStep.warning, displayStep.instruction)) {
    delete displayStep.warning;
  }

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
  const earlierSteps: RouteStep[] = [];

  for (const rawStep of steps) {
    const step = toSequenceDisplayStep(rawStep, earlierSteps);
    const currentObjective = objectives.at(-1);
    if (
      (rawStep.displayRole === 'transition' || rawStep.displayRole === 'detail') &&
      currentObjective
    ) {
      currentObjective.steps.push(step);
    } else {
      objectives.push({ id: rawStep.id, steps: [step] });
    }
    earlierSteps.push(rawStep);
  }
  return objectives;
}

export function getActiveParallelGroups(
  route: RouteDocument,
  completedStepIds: ReadonlySet<string>,
  visibleSteps: readonly RouteStep[],
): ActiveParallelGroup[] {
  const relevantParallelIds = new Set(
    visibleSteps
      .map((step) => step.parallelGroup?.parallelId)
      .filter((parallelId): parallelId is string => parallelId !== undefined),
  );
  if (relevantParallelIds.size === 0) return [];

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

  return [...relevantParallelIds]
    .filter((parallelId) => activeIds.has(parallelId))
    .map((parallelId) => {
      const ids = memberIds.get(parallelId) ?? new Set<string>();
      return {
        parallelId,
        members: sortedSteps.filter((step) => ids.has(step.id)),
      };
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
