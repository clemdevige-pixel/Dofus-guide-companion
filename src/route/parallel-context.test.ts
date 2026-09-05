import assert from 'node:assert/strict';
import test from 'node:test';
import type { RouteDocument } from './types';
import { getActiveParallelGroups } from './selectors';

const route: RouteDocument = {
  schemaVersion: 1,
  routeVersion: 'test',
  title: 'Parallel context',
  blocks: [{ id: 'block-01', order: 1, title: 'Block' }],
  steps: [
    {
      id: 'parallel-start',
      order: 1,
      blockId: 'block-01',
      type: 'quest',
      title: 'Quest A',
      parallelGroup: { parallelId: 'group-a', phase: 'start' },
    },
    {
      id: 'unrelated',
      order: 2,
      blockId: 'block-01',
      type: 'quest',
      title: 'Unrelated quest',
    },
    {
      id: 'parallel-progress',
      order: 3,
      blockId: 'block-01',
      type: 'quest',
      title: 'Quest B',
      parallelGroup: { parallelId: 'group-a', phase: 'progress' },
    },
    {
      id: 'parallel-finish',
      order: 4,
      blockId: 'block-01',
      type: 'dungeon',
      title: 'Shared checkpoint',
      parallelGroup: { parallelId: 'group-a', phase: 'finish' },
    },
  ],
};

test('parallel reminder stays hidden on unrelated intermediate cards', () => {
  const completed = new Set(['parallel-start']);
  assert.deepEqual(getActiveParallelGroups(route, completed), []);
});

test('parallel reminder returns when the current frontier belongs to the group', () => {
  const completed = new Set(['parallel-start', 'unrelated']);
  const active = getActiveParallelGroups(route, completed);
  assert.equal(active.length, 1);
  assert.equal(active[0].parallelId, 'group-a');
  assert.deepEqual(active[0].members.map((step) => step.id), ['parallel-start']);
});

test('completed finish closes the parallel reminder', () => {
  const completed = new Set([
    'parallel-start',
    'unrelated',
    'parallel-progress',
    'parallel-finish',
  ]);
  assert.deepEqual(getActiveParallelGroups(route, completed), []);
});
