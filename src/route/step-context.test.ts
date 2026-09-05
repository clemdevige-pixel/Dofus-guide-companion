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

test('prerequisites and warnings become visible context on normal cards', () => {
  const [quest] = getSortedSteps(route);
  assert.equal(
    quest.instruction,
    'PRÉREQUIS — Niveau 50\nÀ SAVOIR — Ne quitte pas la salle.\nParle au PNJ.',
  );
});

test('preparation resources are not duplicated as prerequisites', () => {
  const [, prep] = getSortedSteps(route);
  assert.equal(prep.instruction, 'À SAVOIR — Conserve le surplus.');
});

test('sequence objectives preserve projected context', () => {
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
        guideItems: [{ action: 'do', label: 'Donjon' }],
      },
    ],
  };

  const [step] = getSortedSteps(sequenceRoute);
  const [objective] = getSequenceObjectives([step]);
  assert.equal(objective.steps[0].instruction, 'FAIRE — Donjon\nPRÉREQUIS — Clef du donjon');
});
