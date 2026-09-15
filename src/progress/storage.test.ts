import assert from 'node:assert/strict';
import test from 'node:test';
import { loadProgress, saveProgress, type ProgressState } from './storage';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

test('progress survives a storage round trip', () => {
  const storage = new MemoryStorage();
  const state: ProgressState = {
    completedStepIds: ['route-step-0001', 'route-step-0042'],
    checkedPreparationItemIds: ['route-step-0002:0', 'route-step-0002:1'],
    compact: true,
    currentStepId: 'route-step-0043',
  };

  saveProgress(state, storage);

  assert.deepEqual(loadProgress(storage), state);
});

test('legacy progress without preparation checks stays compatible', () => {
  const storage = new MemoryStorage();
  storage.setItem(
    'dofus-guide-companion.progress.v1',
    JSON.stringify({ completedStepIds: ['route-step-0001'], compact: false }),
  );

  assert.deepEqual(loadProgress(storage), {
    completedStepIds: ['route-step-0001'],
    checkedPreparationItemIds: [],
    compact: false,
  });
});

test('invalid persisted data falls back safely', () => {
  const storage = new MemoryStorage();
  storage.setItem('dofus-guide-companion.progress.v1', '{invalid json');

  assert.deepEqual(loadProgress(storage), {
    completedStepIds: [],
    checkedPreparationItemIds: [],
    compact: false,
  });
});
