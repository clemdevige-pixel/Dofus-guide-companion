import assert from 'node:assert/strict';
import test from 'node:test';
import type { RouteDocument } from '../route/types';
import {
  loadProgress,
  reconcileProgressWithRoute,
  saveProgress,
  type ProgressState,
} from './storage';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const route: RouteDocument = {
  schemaVersion: 1,
  routeVersion: '2026-09-16',
  title: 'Test route',
  blocks: [{ id: 'block-01', order: 1, title: 'Block' }],
  steps: [
    {
      id: 'prep-before',
      order: 1,
      blockId: 'block-01',
      type: 'preparation',
      title: 'Prepare before',
      preparationItems: [{ kind: 'resource', quantity: 1, name: 'Resource A' }],
    },
    { id: 'quest-1', order: 2, blockId: 'block-01', type: 'quest', title: 'Quest 1' },
    {
      id: 'prep-middle',
      order: 3,
      blockId: 'block-01',
      type: 'preparation',
      title: 'Prepare middle',
      preparationItems: [{ kind: 'resource', quantity: 1, name: 'Resource B' }],
    },
    { id: 'quest-2', order: 4, blockId: 'block-01', type: 'quest', title: 'Quest 2' },
  ],
};

test('progress survives a storage round trip', () => {
  const storage = new MemoryStorage();
  const state: ProgressState = {
    completedStepIds: ['quest-1'],
    checkedPreparationItemIds: ['prep-before:0'],
    compact: true,
    currentStepId: 'prep-middle',
  };

  saveProgress(state, storage, route.routeVersion);

  assert.deepEqual(loadProgress(storage, route), {
    ...state,
    routeVersion: route.routeVersion,
  });
});

test('legacy progress without preparation checks stays compatible', () => {
  const storage = new MemoryStorage();
  storage.setItem(
    'dofus-guide-companion.progress.v1',
    JSON.stringify({ completedStepIds: ['quest-1'], compact: false }),
  );

  assert.deepEqual(loadProgress(storage, route), {
    completedStepIds: ['quest-1', 'prep-before'],
    checkedPreparationItemIds: [],
    compact: false,
    currentStepId: 'prep-middle',
    routeVersion: route.routeVersion,
  });
});

test('route revision closes only historical preparation cards', () => {
  const migrated = reconcileProgressWithRoute(
    {
      completedStepIds: ['quest-1', 'removed-old-prep'],
      checkedPreparationItemIds: ['prep-before:0', 'removed-old-prep:0'],
      compact: false,
      currentStepId: 'quest-2',
      routeVersion: 'old-route',
    },
    route,
  );

  assert.deepEqual(new Set(migrated.completedStepIds), new Set(['quest-1', 'prep-before']));
  assert.equal(migrated.currentStepId, 'quest-2');
  assert.deepEqual(migrated.checkedPreparationItemIds, ['prep-before:0']);
});

test('same route version does not infer preparation completion from consultation position', () => {
  const reconciled = reconcileProgressWithRoute(
    {
      completedStepIds: ['quest-1'],
      checkedPreparationItemIds: [],
      compact: false,
      currentStepId: 'quest-2',
      routeVersion: route.routeVersion,
    },
    route,
  );

  assert.deepEqual(reconciled.completedStepIds, ['quest-1']);
});

test('removed saved cursor resumes after the furthest surviving completed métier step', () => {
  const migrated = reconcileProgressWithRoute(
    {
      completedStepIds: ['quest-1'],
      checkedPreparationItemIds: [],
      compact: false,
      currentStepId: 'removed-old-prep',
      routeVersion: 'old-route',
    },
    route,
  );

  assert.deepEqual(new Set(migrated.completedStepIds), new Set(['quest-1', 'prep-before']));
  assert.equal(migrated.currentStepId, 'prep-middle');
});

test('invalid persisted data falls back safely', () => {
  const storage = new MemoryStorage();
  storage.setItem('dofus-guide-companion.progress.v1', '{invalid json');

  assert.deepEqual(loadProgress(storage, route), {
    completedStepIds: [],
    checkedPreparationItemIds: [],
    compact: false,
    routeVersion: route.routeVersion,
  });
});
