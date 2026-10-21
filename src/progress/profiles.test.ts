import assert from 'node:assert/strict';
import test from 'node:test';
import type { RouteDocument } from '../route/types';
import { loadProfiles, saveProfiles, createProfile, updateProfileProgress, deleteProfile, resetProfile, renameProfile, emptyProgress } from './profiles';

class Storage {
  values = new Map<string,string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key,value); }
}
const route: RouteDocument = {
  schemaVersion: 1, routeVersion: 'v1', title: 'Route',
  blocks: [{ id: 'b', order: 1, title: 'Block' }],
  steps: [{ id: 's1', order: 1, blockId: 'b', type: 'quest', title: 'One' },
          { id: 's2', order: 2, blockId: 'b', type: 'quest', title: 'Two' }],
};

test('migrate legacy progress without deleting its source', () => {
  const storage = new Storage();
  const old = JSON.stringify({ completedStepIds: ['s1'], checkedPreparationItemIds: [], compact: false, currentStepId: 's2', routeVersion: 'v1' });
  storage.setItem('dofus-guide-companion.progress.v1', old);
  const first = loadProfiles(storage, route);
  assert.deepEqual(first.profiles[0].progress.completedStepIds, ['s1']);
  saveProfiles(first, storage);
  const loaded = loadProfiles(storage, route);
  assert.equal(loaded.activeProfileId, first.activeProfileId);
  assert.equal(storage.getItem('dofus-guide-companion.progress.v1'), old);
});

test('separate progress, duplication, rename, deletion, and reset', () => {
  const storage = new Storage();
  let state = loadProfiles(storage, route);
  const firstId = state.activeProfileId;
  state = updateProfileProgress(state, firstId, { ...emptyProgress(route), completedStepIds: ['s1'], currentStepId: 's2' });
  state = createProfile(state, 'Alt', emptyProgress(route), 'alt');
  assert.deepEqual(state.profiles[1].progress.completedStepIds, []);
  state = createProfile(state, 'Copy', state.profiles[0].progress, 'copy');
  assert.deepEqual(state.profiles[2].progress.completedStepIds, ['s1']);
  state = renameProfile(state, 'copy', 'New name');
  assert.equal(state.profiles[2].name, 'New name');
  state = resetProfile(state, 'copy', route);
  assert.deepEqual(state.profiles[2].progress.completedStepIds, []);
  assert.deepEqual(state.profiles[0].progress.completedStepIds, ['s1']);
  state = deleteProfile(state, 'copy');
  assert.equal(state.profiles.length, 2);
  saveProfiles(state, storage);
  assert.equal(loadProfiles(storage, route).activeProfileId, firstId);
  assert.throws(() => createProfile(state, ' ', emptyProgress(route)), /Nom/);
  assert.throws(() => deleteProfile({ ...state, profiles: [state.profiles[0]], activeProfileId: firstId }, firstId), /au moins un/);
});

test('corrupted v2 never discards legacy progress', () => {
  const storage = new Storage();
  storage.setItem('dofus-guide-companion.progress.v1', JSON.stringify({ completedStepIds: ['s1'], compact: false, routeVersion: 'v1' }));
  storage.setItem('dofus-guide-companion.profiles.v2', '{oops');
  assert.deepEqual(loadProfiles(storage, route).profiles[0].progress.completedStepIds, ['s1']);
});
