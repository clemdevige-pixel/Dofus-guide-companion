import assert from 'node:assert/strict';
import test from 'node:test';
import routeData from '../../data/route.json';
import migrationData from '../../data/route-progress-migrations.json';
import type { RouteDocument } from '../route/types';
import { reconcileProgressWithRoute, parseProgressBackup } from './storage';
import { loadProfiles, saveProfiles } from './profiles';

const route = routeData as RouteDocument;
const base = { completedStepIds: [] as string[], checkedPreparationItemIds: [] as string[], compact: false, routeVersion: '2026-10-16' };

test('Champ Pomy revision preserves completed quests and never validates a consulted launch', () => {
  const finish = 'route-step-audit-champ-pomy';
  const start = 'route-step-champ-pomy-start';
  const previous = { ...base, routeVersion: '2026-11-05' };
  const done = reconcileProgressWithRoute({ ...previous, completedStepIds: [finish] }, route);
  assert.ok(done.completedStepIds.includes(start));
  assert.ok(done.completedStepIds.includes(finish));
  const unchecked = { ...done, completedStepIds: done.completedStepIds.filter(id => id !== start) };
  assert.deepEqual(reconcileProgressWithRoute(unchecked, route), unchecked);
  const pending = reconcileProgressWithRoute({ ...previous, currentStepId: finish }, route);
  assert.equal(pending.currentStepId, start);
  assert.deepEqual(pending.completedStepIds, []);
});

test('a validated legacy card expands to its actions without checking another card', () => {
  for (const [legacyId, ids] of Object.entries(migrationData.migrations[0].expansions)) {
    const result = reconcileProgressWithRoute({ ...base, completedStepIds: [legacyId] }, route);
    for (const id of ids) assert.ok(result.completedStepIds.includes(id), id);
    for (const id of result.completedStepIds) {
      assert.ok(ids.includes(id) || route.steps.find(step => step.id === id)?.type === 'preparation', id);
    }
  }
});

test('migration is idempotent and an unchecked new action stays unchecked after reload', () => {
  const migrated = reconcileProgressWithRoute({ ...base, completedStepIds: ['route-step-0012'] }, route);
  assert.deepEqual(reconcileProgressWithRoute(migrated, route), migrated);
  const id = migrationData.migrations[0].expansions['route-step-0012']!.find(id => id !== 'route-step-0012')!;
  const unchecked = { ...migrated, completedStepIds: migrated.completedStepIds.filter(value => value !== id) };
  assert.ok(!reconcileProgressWithRoute(unchecked, route).completedStepIds.includes(id));
});

test('consulting an unfinished legacy card resumes its first action without validating it', () => {
  const migrated = reconcileProgressWithRoute({ ...base, currentStepId: 'route-step-0012' }, route);
  assert.deepEqual(migrated.completedStepIds, []);
  assert.equal(migrated.currentStepId, migrationData.migrations[0].expansions['route-step-0012']![0]);
});

test('backup import and multiple profiles migrate independently', () => {
  const restored = parseProgressBackup(JSON.stringify({ ...base, completedStepIds: ['route-step-0012'] }), route);
  assert.ok(restored.completedStepIds.includes('route-step-0012-action-3'));
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  storage.setItem('dofus-guide-companion.profiles.v2', JSON.stringify({
    version: 2, activeProfileId: 'a', profiles: [
      { id: 'a', name: 'A', progress: { ...base, completedStepIds: ['route-step-0012'] } },
      { id: 'b', name: 'B', progress: { ...base, currentStepId: 'route-step-0012' } },
    ],
  }));
  const loaded = loadProfiles(storage, route);
  assert.ok(loaded.profiles[0].progress.completedStepIds.includes('route-step-0012-action-3'));
  assert.deepEqual(loaded.profiles[1].progress.completedStepIds, []);
  saveProfiles(loaded, storage);
  assert.deepEqual(loadProfiles(storage, route), loaded);
});
