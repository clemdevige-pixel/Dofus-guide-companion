const STORAGE_KEY = 'dofus-guide-companion.progress.v1';

export interface ProgressState {
  completedStepIds: string[];
  compact: boolean;
  currentStepId?: string;
}

interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const defaultState: ProgressState = {
  completedStepIds: [],
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
      compact: typeof parsed.compact === 'boolean' ? parsed.compact : false,
      ...(typeof parsed.currentStepId === 'string' && parsed.currentStepId
        ? { currentStepId: parsed.currentStepId }
        : {}),
    };
  } catch {
    return defaultState;
  }
}

export function loadProgress(storage: ProgressStorage = window.localStorage): ProgressState {
  try {
    return parseProgress(storage.getItem(STORAGE_KEY));
  } catch {
    return defaultState;
  }
}

export function saveProgress(
  state: ProgressState,
  storage: ProgressStorage = window.localStorage,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
