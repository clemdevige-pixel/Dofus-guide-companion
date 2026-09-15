import assert from 'node:assert/strict';
import test from 'node:test';
import { getSequenceObjectives } from './selectors';
import type { RouteStep } from './types';

test('sequence dedup keeps prerequisites that still contain independent requirements', () => {
  const momentId = 'moment-test';
  const steps: RouteStep[] = [
    {
      id: 'first',
      order: 1,
      blockId: 'block-01',
      type: 'quest',
      displayRole: 'objective',
      title: "C'est stupéfiant",
      momentId,
    },
    {
      id: 'second',
      order: 2,
      blockId: 'block-01',
      type: 'dungeon',
      displayRole: 'detail',
      title: 'Caverne du Koulosse',
      prerequisites: "C'est stupéfiant + Un juge hystérique + capture Ocre.",
      momentId,
    },
  ];

  const displaySteps = getSequenceObjectives(steps).flatMap((objective) => objective.steps);
  assert.equal(displaySteps[1].prerequisites, "C'est stupéfiant + Un juge hystérique + capture Ocre.");
});
