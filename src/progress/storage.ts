const STORAGE_KEY = 'dofus-guide-companion.progress.v1';

export interface ProgressState {
  completedStepIds: string[];
  compact: boolean;
  currentStepId?: string;
}

const defaultState: ProgressState = {
  completedStepIds: [],
  compact: false,
};

export function loadProgress(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw) as Partial<ProgressState>;

    return {
      completedStepIds: Array.isArray(parsed.completedStepIds)
        ? parsed.completedStepIds.filter((id): id is string => typeof id === 'string')
        : [],
      compact: typeof parsed.compact === 'boolean' ? parsed.compact : false,
      ...(typeof parsed.currentStepId === 'string' && parsed.currentStepId
        ? { currentStepId: parsed.currentStepId }
        : {}),
    };
  } catch {
    return defaultState;
  }
}

export function saveProgress(state: ProgressState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
