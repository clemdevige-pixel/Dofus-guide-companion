import { loadBundledRoute } from '../route/loader';
import { getPreparationItemKey } from '../route/preparation';
import { getSortedSteps } from '../route/selectors';
import type { RouteDocument } from '../route/types';

const STORAGE_KEY = 'dofus-guide-companion.progress.v1';

export interface ProgressState {
  completedStepIds: string[];
  checkedPreparationItemIds: string[];
  compact: boolean;
  currentStepId?: string;
  routeVersion?: string;
}

interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const defaultState: ProgressState = {
  completedStepIds: [],
  checkedPreparationItemIds: [],
  compact: false,
};

export function parseProgress(raw: string | null): ProgressState {
  if (!raw) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;

    return {
      completedStepIds: Array.isArray(parsed.completedStepIds)
        ? parsed.completedStepIds.filter((id): id is string => typeof id === 'string')
        : [],
      checkedPreparationItemIds: Array.isArray(parsed.checkedPreparationItemIds)
        ? parsed.checkedPreparationItemIds.filter((id): id is string => typeof id === 'string')
        : [],
      compact: typeof parsed.compact === 'boolean' ? parsed.compact : false,
      ...(typeof parsed.currentStepId === 'string' && parsed.currentStepId
        ? { currentStepId: parsed.currentStepId }
        : {}),
      ...(typeof parsed.routeVersion === 'string' && parsed.routeVersion
        ? { routeVersion: parsed.routeVersion }
        : {}),
    };
  } catch {
    return defaultState;
  }
}

export function reconcileProgressWithRoute(
  progress: ProgressState,
  route: RouteDocument,
): ProgressState {
  const sortedSteps = getSortedSteps(route);
  const stepIndexById = new Map(sortedSteps.map((step, index) => [step.id, index]));
  const routeStepIds = new Set(route.steps.map((step) => step.id));
  const completedStepIds = new Set(
    progress.completedStepIds.filter((stepId) => routeStepIds.has(stepId)),
  );

  let furthestCompletedProgressIndex = -1;
  for (const step of sortedSteps) {
    if (step.type === 'preparation' || !completedStepIds.has(step.id)) {
      continue;
    }
    const index = stepIndexById.get(step.id);
    if (index !== undefined && index > furthestCompletedProgressIndex) {
      furthestCompletedProgressIndex = index;
    }
  }

  if (progress.routeVersion !== route.routeVersion && furthestCompletedProgressIndex >= 0) {
    for (let index = 0; index < furthestCompletedProgressIndex; index += 1) {
      const step = sortedSteps[index];
      if (step.type === 'preparation') {
        completedStepIds.add(step.id);
      }
    }
  }

  const validPreparationItemIds = new Set<string>();
  for (const step of route.steps) {
    for (let itemIndex = 0; itemIndex < (step.preparationItems?.length ?? 0); itemIndex += 1) {
      validPreparationItemIds.add(getPreparationItemKey(step.id, itemIndex));
    }
  }

  let currentStepId =
    progress.currentStepId && stepIndexById.has(progress.currentStepId)
      ? progress.currentStepId
      : undefined;

  if (!currentStepId && furthestCompletedProgressIndex >= 0) {
    currentStepId = sortedSteps
      .slice(furthestCompletedProgressIndex + 1)
      .find((step) => !completedStepIds.has(step.id))?.id;
  }

  return {
    completedStepIds: [...completedStepIds],
    checkedPreparationItemIds: progress.checkedPreparationItemIds.filter((itemId) =>
      validPreparationItemIds.has(itemId),
    ),
    compact: progress.compact,
    ...(currentStepId ? { currentStepId } : {}),
    routeVersion: route.routeVersion,
  };
}

export function loadProgress(
  storage: ProgressStorage = window.localStorage,
  route: RouteDocument = loadBundledRoute(),
): ProgressState {
  try {
    return reconcileProgressWithRoute(parseProgress(storage.getItem(STORAGE_KEY)), route);
  } catch {
    return reconcileProgressWithRoute(defaultState, route);
  }
}

export function saveProgress(
  state: ProgressState,
  storage: ProgressStorage = window.localStorage,
  routeVersion: string = loadBundledRoute().routeVersion,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify({ ...state, routeVersion }));
}
