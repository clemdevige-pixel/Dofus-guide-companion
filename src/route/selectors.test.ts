import assert from 'node:assert/strict';
import test from 'node:test';
import type { RouteDocument, RouteStep } from './types';
import { getActiveLongRunningGoals } from './selectors';

const baseSteps: RouteStep[] = [
  {
    id: 'start',
    order: 1,
    blockId: 'block-01',
    type: 'quest',
    title: 'Start',
    longRunningGoal: { goalId: 'goal', phase: 'start' },
  },
  {
    id: 'progress',
    order: 2,
    blockId: 'block-01',
    type: 'resume',
    title: 'Progress',
    longRunningGoal: { goalId: 'goal', phase: 'progress' },
  },
  {
    id: 'finish',
    order: 3,
    blockId: 'block-01',
    type: 'resume',
    title: 'Finish',
    longRunningGoal: { goalId: 'goal', phase: 'finish' },
  },
];

const route: RouteDocument = {
  schemaVersion: 1,
  routeVersion: 'test',
  title: 'Test',
  blocks: [{ id: 'block-01', order: 1, title: 'Block' }],
  steps: baseSteps,
};

test('progress alone never opens a long-running goal', () => {
  assert.deepEqual(getActiveLongRunningGoals(route, new Set(['progress'])), []);
});

test('completed start opens the goal', () => {
  assert.deepEqual(
    getActiveLongRunningGoals(route, new Set(['start'])).map((step) => step.id),
    ['start'],
  );
});

test('completed progress updates an already active goal', () => {
  assert.deepEqual(
    getActiveLongRunningGoals(route, new Set(['start', 'progress'])).map((step) => step.id),
    ['progress'],
  );
});

test('completed finish closes the goal', () => {
  assert.deepEqual(getActiveLongRunningGoals(route, new Set(['start', 'progress', 'finish'])), []);
});

test('completed linked hard lock closes the goal', () => {
  const routeWithLock: RouteDocument = {
    ...route,
    steps: [
      ...baseSteps.slice(0, 2),
      {
        id: 'lock',
        order: 3,
        blockId: 'block-01',
        type: 'hard_lock',
        title: 'Lock',
        hardLock: { goalId: 'goal', message: 'Stop' },
      },
      { ...baseSteps[2], order: 4 },
    ],
  };

  assert.deepEqual(
    getActiveLongRunningGoals(routeWithLock, new Set(['start', 'progress', 'lock'])),
    [],
  );
});
