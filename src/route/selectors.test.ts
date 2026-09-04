import assert from 'node:assert/strict';
import test from 'node:test';
import type { RouteDocument, RouteStep } from './types';
import { getActiveLongRunningGoals, getStepGroups } from './selectors';

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

test('ordinary quest, dungeon, alignment and order steps share one checklist', () => {
  const groupedRoute: RouteDocument = {
    ...route,
    steps: [
      { id: 'take', order: 1, blockId: 'block-01', type: 'quest', title: 'Quest A', action: 'LANCER' },
      { id: 'dungeon', order: 2, blockId: 'block-01', type: 'dungeon', title: 'Dungeon A', action: 'FAIRE & VALIDER' },
      { id: 'finish', order: 3, blockId: 'block-01', type: 'resume', title: 'Quest A', action: 'REPRENDRE / TERMINER' },
      { id: 'alignment', order: 4, blockId: 'block-01', type: 'alignment', title: 'Alignement', action: 'TERMINER' },
      { id: 'order', order: 5, blockId: 'block-01', type: 'order', title: 'Ordre', action: 'TERMINER' },
    ],
  };

  const groups = getStepGroups(groupedRoute);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].isSequence, true);
  assert.deepEqual(groups[0].steps.map((step) => step.id), ['take', 'dungeon', 'finish', 'alignment', 'order']);
});

test('STOP closes the current checklist instead of creating a useless standalone card', () => {
  const groupedRoute: RouteDocument = {
    ...route,
    steps: [
      { id: 'take', order: 1, blockId: 'block-01', type: 'quest', title: 'Quest A', action: 'LANCER' },
      { id: 'advance-stop', order: 2, blockId: 'block-01', type: 'quest', title: 'Quest A — avancer', action: 'AVANCER / STOP' },
      { id: 'next', order: 3, blockId: 'block-01', type: 'quest', title: 'Quest B', action: 'TERMINER' },
    ],
  };

  assert.deepEqual(getStepGroups(groupedRoute).map((group) => group.steps.map((step) => step.id)), [
    ['take', 'advance-stop'],
    ['next'],
  ]);
});

test('structured and critical steps remain isolated', () => {
  const groupedRoute: RouteDocument = {
    ...route,
    steps: [
      { id: 'simple-a', order: 1, blockId: 'block-01', type: 'quest', title: 'Simple A', action: 'TERMINER' },
      {
        id: 'structured',
        order: 2,
        blockId: 'block-01',
        type: 'major_step',
        title: 'Structured',
        action: 'AVANCER',
        guideItems: [{ action: 'advance', label: 'Quest C' }],
      },
      { id: 'simple-b', order: 3, blockId: 'block-01', type: 'quest', title: 'Simple B', action: 'TERMINER' },
    ],
  };

  assert.deepEqual(getStepGroups(groupedRoute).map((group) => group.steps.map((step) => step.id)), [
    ['simple-a'],
    ['structured'],
    ['simple-b'],
  ]);
});

test('checklist groups are capped to eight steps', () => {
  const groupedRoute: RouteDocument = {
    ...route,
    steps: Array.from({ length: 10 }, (_, index) => ({
      id: `quest-${index + 1}`,
      order: index + 1,
      blockId: 'block-01',
      type: 'quest' as const,
      title: `Quest ${index + 1}`,
      action: 'TERMINER',
    })),
  };

  assert.deepEqual(getStepGroups(groupedRoute).map((group) => group.steps.length), [8, 2]);
});
