import assert from 'node:assert/strict';
import test from 'node:test';
import { getSequenceObjectives } from './selectors';
import type { RouteDocument, RouteStep } from './types';
import { validateRoute } from './validation';

test('explicit display roles decide checkbox boundaries inside a moment', () => {
  const momentId = 'moment-a';
  const steps: RouteStep[] = [
    {
      id: 'skeunk-objective',
      order: 1,
      blockId: 'block-01',
      type: 'quest',
      title: 'Avancer jusqu’au Skeunk',
      displayRole: 'objective',
      momentId,
    },
    {
      id: 'skeunk-detail',
      order: 2,
      blockId: 'block-01',
      type: 'dungeon',
      title: 'Repaire de Skeunk',
      displayRole: 'detail',
      momentId,
    },
    {
      id: 'fraktale-transition',
      order: 3,
      blockId: 'block-01',
      type: 'resume',
      title: 'Reprendre vers Fraktale',
      action: 'AVANCER / STOP',
      displayRole: 'transition',
      momentId,
    },
    {
      id: 'fraktale-objective',
      order: 4,
      blockId: 'block-01',
      type: 'dungeon',
      title: 'Mégalithe de Fraktale',
      displayRole: 'objective',
      momentId,
    },
    {
      id: 'finish-transition',
      order: 5,
      blockId: 'block-01',
      type: 'resume',
      title: 'Terminer la quête',
      action: 'TERMINER',
      displayRole: 'transition',
      momentId,
    },
  ];

  const objectives = getSequenceObjectives(steps);

  assert.deepEqual(
    objectives.map((objective) => objective.steps.map((step) => step.id)),
    [
      ['skeunk-objective', 'skeunk-detail', 'fraktale-transition'],
      ['fraktale-objective', 'finish-transition'],
    ],
  );
  assert.equal(objectives.flatMap((objective) => objective.steps).some((step) => step.action), false);
  assert.equal(
    objectives[0]?.steps.find((step) => step.id === 'fraktale-transition')?.instruction,
    'AVANCER / STOP — Reprendre vers Fraktale',
  );
  assert.equal(
    objectives[1]?.steps.find((step) => step.id === 'finish-transition')?.instruction,
    'TERMINER — Terminer la quête',
  );
});

test('an explicit transition instruction stays authoritative', () => {
  const momentId = 'moment-b';
  const objectives = getSequenceObjectives([
    {
      id: 'objective',
      order: 1,
      blockId: 'block-01',
      type: 'quest',
      title: 'Objectif',
      displayRole: 'objective',
      momentId,
    },
    {
      id: 'transition',
      order: 2,
      blockId: 'block-01',
      type: 'resume',
      title: 'Rendu technique',
      action: 'TERMINER',
      instruction: 'Retourne voir le PNJ puis prends immédiatement la suite.',
      displayRole: 'transition',
      momentId,
    },
  ]);

  assert.equal(
    objectives[0]?.steps[1]?.instruction,
    'Retourne voir le PNJ puis prends immédiatement la suite.',
  );
  assert.equal(objectives[0]?.steps[1]?.action, undefined);
});

test('displayRole cannot exist outside an explicit moment', () => {
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
        displayRole: 'objective',
      },
      {
        id: 'finish',
        order: 2,
        blockId: 'block-01',
        type: 'finish',
        title: 'Finish',
      },
    ],
  };

  assert.throws(() => validateRoute(route), /displayRole défini sans momentId/);
});

test('an explicit moment must start with an objective', () => {
  const route: RouteDocument = {
    schemaVersion: 1,
    routeVersion: 'test',
    title: 'Test',
    blocks: [{ id: 'block-01', order: 1, title: 'Block' }],
    steps: [
      {
        id: 'transition-first',
        order: 1,
        blockId: 'block-01',
        type: 'resume',
        title: 'Rendu',
        momentId: 'moment-invalid',
        displayRole: 'transition',
      },
      {
        id: 'finish',
        order: 2,
        blockId: 'block-01',
        type: 'finish',
        title: 'Finish',
      },
    ],
  };

  assert.throws(
    () => validateRoute(route),
    /un momentId doit commencer par displayRole=objective/,
  );
});

test('an explicit card cannot contain more than five objectives', () => {
  const momentId = 'moment-too-large';
  const objectives: RouteStep[] = Array.from({ length: 6 }, (_, index) => ({
    id: `objective-${index + 1}`,
    order: index + 1,
    blockId: 'block-01',
    type: 'quest',
    title: `Objectif ${index + 1}`,
    momentId,
    displayRole: 'objective',
  }));

  const route: RouteDocument = {
    schemaVersion: 1,
    routeVersion: 'test',
    title: 'Test',
    blocks: [{ id: 'block-01', order: 1, title: 'Block' }],
    steps: [
      ...objectives,
      {
        id: 'finish',
        order: 7,
        blockId: 'block-01',
        type: 'finish',
        title: 'Finish',
      },
    ],
  };

  assert.throws(() => validateRoute(route), /contient plus de 5 objectifs/);
});
