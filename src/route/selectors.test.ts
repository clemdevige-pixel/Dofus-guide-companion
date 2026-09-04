import assert from 'node:assert/strict';
import test from 'node:test';
import type { RouteDocument, RouteStep } from './types';
import {
  getActiveLongRunningGoals,
  getSequenceObjectives,
  getStepGroups,
} from './selectors';

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

test('steps without MOMENT_ID always remain standalone cards', () => {
  const groupedRoute: RouteDocument = {
    ...route,
    steps: [
      { id: 'quest-a', order: 1, blockId: 'block-01', type: 'quest', title: 'Quest A', action: 'TERMINER' },
      { id: 'dungeon-a', order: 2, blockId: 'block-01', type: 'dungeon', title: 'Dungeon A', action: 'FAIRE' },
      { id: 'quest-b', order: 3, blockId: 'block-01', type: 'resume', title: 'Quest B', action: 'TERMINER' },
    ],
  };

  assert.deepEqual(getStepGroups(groupedRoute).map((group) => group.steps.map((step) => step.id)), [
    ['quest-a'],
    ['dungeon-a'],
    ['quest-b'],
  ]);
});

test('STOP never creates an implicit grouping boundary', () => {
  const groupedRoute: RouteDocument = {
    ...route,
    steps: [
      { id: 'take', order: 1, blockId: 'block-01', type: 'quest', title: 'Quest A', action: 'LANCER' },
      { id: 'advance-stop', order: 2, blockId: 'block-01', type: 'quest', title: 'Quest A — avancer', action: 'AVANCER / STOP' },
      { id: 'next', order: 3, blockId: 'block-01', type: 'quest', title: 'Quest B', action: 'TERMINER' },
    ],
  };

  assert.deepEqual(getStepGroups(groupedRoute).map((group) => group.steps.map((step) => step.id)), [
    ['take'],
    ['advance-stop'],
    ['next'],
  ]);
});

test('one explicit MOMENT_ID creates exactly one card', () => {
  const momentId = 'moment-a';
  const groupedRoute: RouteDocument = {
    ...route,
    steps: [
      {
        id: 'advance-stop',
        order: 1,
        blockId: 'block-01',
        type: 'quest',
        title: 'Quest A',
        action: 'AVANCER / STOP',
        momentId,
        displayRole: 'objective',
      },
      {
        id: 'dungeon',
        order: 2,
        blockId: 'block-01',
        type: 'dungeon',
        title: 'Dungeon A',
        action: 'FAIRE',
        momentId,
        displayRole: 'detail',
      },
      {
        id: 'finish',
        order: 3,
        blockId: 'block-01',
        type: 'resume',
        title: 'Quest A',
        action: 'TERMINER',
        momentId,
        displayRole: 'transition',
      },
    ],
  };

  const groups = getStepGroups(groupedRoute);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].id, 'moment:moment-a');
  assert.equal(groups[0].isSequence, true);
  assert.deepEqual(groups[0].steps.map((step) => step.id), ['advance-stop', 'dungeon', 'finish']);
});

test('different explicit moments create different cards', () => {
  const groupedRoute: RouteDocument = {
    ...route,
    steps: [
      {
        id: 'quest-a', order: 1, blockId: 'block-01', type: 'quest', title: 'Quest A',
        momentId: 'moment-a', displayRole: 'objective',
      },
      {
        id: 'finish-a', order: 2, blockId: 'block-01', type: 'resume', title: 'Finish A',
        momentId: 'moment-a', displayRole: 'transition',
      },
      {
        id: 'quest-b', order: 3, blockId: 'block-01', type: 'quest', title: 'Quest B',
        momentId: 'moment-b', displayRole: 'objective',
      },
    ],
  };

  assert.deepEqual(getStepGroups(groupedRoute).map((group) => group.steps.map((step) => step.id)), [
    ['quest-a', 'finish-a'],
    ['quest-b'],
  ]);
});

test('DISPLAY_ROLE decides checkbox boundaries inside a moment', () => {
  const momentId = 'moment-a';
  const steps: RouteStep[] = [
    {
      id: 'shin', order: 1, blockId: 'block-01', type: 'resume', title: 'Shin Larve',
      momentId, displayRole: 'objective', action: 'FAIRE',
    },
    {
      id: 'larves', order: 2, blockId: 'block-01', type: 'dungeon', title: 'Donjon des Larves',
      momentId, displayRole: 'detail', action: 'FAIRE',
    },
    {
      id: 'transition', order: 3, blockId: 'block-01', type: 'resume', title: 'Rendre puis reprendre',
      momentId, displayRole: 'transition', action: 'TERMINER',
    },
    {
      id: 'rakoopeur', order: 4, blockId: 'block-01', type: 'resume', title: 'Rakoopeur',
      momentId, displayRole: 'objective', action: 'FAIRE',
    },
  ];

  const objectives = getSequenceObjectives(steps);
  assert.deepEqual(
    objectives.map((objective) => objective.steps.map((step) => step.id)),
    [['shin', 'larves', 'transition'], ['rakoopeur']],
  );
  assert.equal(objectives.flatMap((objective) => objective.steps).some((step) => step.action), false);
});

test('source equality never affects objective grouping', () => {
  const source = { label: 'DPLN', url: 'https://example.test/quest-a' };
  const steps: RouteStep[] = [
    {
      id: 'a', order: 1, blockId: 'block-01', type: 'quest', title: 'A', source,
      momentId: 'moment-a', displayRole: 'objective',
    },
    {
      id: 'b', order: 2, blockId: 'block-01', type: 'resume', title: 'B', source,
      momentId: 'moment-a', displayRole: 'objective',
    },
  ];

  assert.deepEqual(
    getSequenceObjectives(steps).map((objective) => objective.steps.map((step) => step.id)),
    [['a'], ['b']],
  );
});
