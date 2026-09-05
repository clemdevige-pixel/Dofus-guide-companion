import assert from 'node:assert/strict';
import test from 'node:test';
import { getActiveParallelGroups } from './selectors';
import type { RouteDocument } from './types';

test('parallel reminders only appear when the visible card belongs to the group', () => {
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

  const afterStart = getActiveParallelGroups(route, new Set(['a']), [route.steps[1]]);
  assert.equal(afterStart.length, 0);

  const beforeProgress = getActiveParallelGroups(route, new Set(['a', 'unrelated']), [route.steps[2]]);
  assert.equal(beforeProgress.length, 1);
  assert.deepEqual(beforeProgress[0].members.map((step) => step.id), ['a']);

  const beforeBoss = getActiveParallelGroups(route, new Set(['a', 'unrelated', 'b']), [route.steps[3]]);
  assert.equal(beforeBoss.length, 1);
  assert.deepEqual(beforeBoss[0].members.map((step) => step.id), ['a', 'b']);

  const afterBoss = getActiveParallelGroups(
    route,
    new Set(['a', 'unrelated', 'b', 'boss']),
    [route.steps[4]],
  );
  assert.equal(afterBoss.length, 0);
});
