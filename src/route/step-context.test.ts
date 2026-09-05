import assert from 'node:assert/strict';
import test from 'node:test';
import type { RouteDocument } from './types';
import { getSequenceObjectives, getSortedSteps } from './selectors';

const route: RouteDocument = {
  schemaVersion: 1,
  routeVersion: 'test',
  title: 'Test',
  blocks: [{ id: 'block-01', order: 1, title: 'Block' }],
  steps: [
    {
      id: 'quest',
      order: 1,
      blockId: 'block-01',
      type: 'quest',
      title: 'Quest',
      prerequisites: 'Niveau 50',
      warning: 'Ne quitte pas la salle.',
      instruction: 'Parle au PNJ.',
    },
    {
      id: 'prep',
      order: 2,
      blockId: 'block-01',
      type: 'preparation',
      title: 'Prépa',
      prerequisites: '• 10 Fer',
      warning: 'Conserve le surplus.',
      preparationItems: ['10 Fer'],
    },
  ],
};

test('prerequisites and warnings stay separate from the instruction', () => {
  const [quest] = getSortedSteps(route);
  assert.equal(quest.prerequisites, 'Niveau 50');
  assert.equal(quest.warning, 'Ne quitte pas la salle.');
  assert.equal(quest.instruction, 'Parle au PNJ.');
});

test('preparation resources remain available without duplicating the instruction', () => {
  const [, prep] = getSortedSteps(route);
  assert.equal(prep.prerequisites, '• 10 Fer');
  assert.deepEqual(prep.preparationItems, ['10 Fer']);
  assert.equal(prep.warning, 'Conserve le surplus.');
  assert.equal(prep.instruction, undefined);
});

test('sequence objectives preserve context fields while projecting GUIDE_ITEMS', () => {
  const sequenceRoute: RouteDocument = {
    ...route,
    steps: [
      {
        id: 'objective',
        order: 1,
        blockId: 'block-01',
        type: 'quest',
        title: 'Objective',
        momentId: 'moment-a',
        displayRole: 'objective',
        prerequisites: 'Clef du donjon',
        warning: 'Ne quitte pas la salle.',
        guideItems: [{ action: 'do', label: 'Donjon' }],
      },
    ],
  };

  const [step] = getSortedSteps(sequenceRoute);
  const [objective] = getSequenceObjectives([step]);
  assert.equal(objective.steps[0].prerequisites, 'Clef du donjon');
  assert.equal(objective.steps[0].warning, 'Ne quitte pas la salle.');
  assert.equal(objective.steps[0].instruction, 'FAIRE — Donjon');
});
