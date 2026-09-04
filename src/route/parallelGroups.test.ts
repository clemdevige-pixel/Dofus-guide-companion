import assert from 'node:assert/strict';
import test from 'node:test';
import { getActiveParallelGroups } from './selectors';
import type { RouteDocument } from './types';

test('parallel groups remain active across unrelated cards until their finish checkpoint', () => {
  const route: RouteDocument = {
    schemaVersion: 1,
    routeVersion: 'test',
    title: 'Test',
    blocks: [{ id: 'block-01', order: 1, title: 'Block' }],
    steps: [
      {
        id: 'a', order: 1, blockId: 'block-01', type: 'quest', title: 'Quête A',
        parallelGroup: { parallelId: 'pack', phase: 'start' },
      },
      {
        id: 'unrelated', order: 2, blockId: 'block-01', type: 'quest', title: 'Autre quête',
      },
      {
        id: 'b', order: 3, blockId: 'block-01', type: 'quest', title: 'Quête B',
        parallelGroup: { parallelId: 'pack', phase: 'progress' },
      },
      {
        id: 'boss', order: 4, blockId: 'block-01', type: 'dungeon', title: 'Boss',
        parallelGroup: { parallelId: 'pack', phase: 'finish' },
      },
      { id: 'finish', order: 5, blockId: 'block-01', type: 'finish', title: 'Fin' },
    ],
  };

  const afterStart = getActiveParallelGroups(route, new Set(['a']));
  assert.equal(afterStart.length, 1);
  assert.deepEqual(afterStart[0].members.map((step) => step.id), ['a', 'b']);

  const beforeBoss = getActiveParallelGroups(route, new Set(['a', 'unrelated', 'b']));
  assert.equal(beforeBoss.length, 1);

  const afterBoss = getActiveParallelGroups(route, new Set(['a', 'unrelated', 'b', 'boss']));
  assert.equal(afterBoss.length, 0);
});
