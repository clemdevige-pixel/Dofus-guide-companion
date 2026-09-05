import assert from 'node:assert/strict';
import test from 'node:test';
import type { RouteStep } from './types';
import { getSequenceObjectives } from './selectors';

test('GUIDE_ITEMS are projected into sequence instructions', () => {
  const steps: RouteStep[] = [
    {
      id: 'quest',
      order: 1,
      blockId: 'block-01',
      type: 'quest',
      title: 'Tour de passe-passe',
      momentId: 'moment-tour',
      displayRole: 'objective',
      guideItems: [
        { action: 'finish', label: 'Tour de passe-passe' },
        {
          action: 'take',
          label: 'Tour de rein',
          location: { x: 16, y: 27 },
          note: 'Parle à Lorie Culère.',
        },
      ],
    },
  ];

  const [objective] = getSequenceObjectives(steps);
  const [displayStep] = objective.steps;

  assert.equal(
    displayStep.instruction,
    'TERMINER — Tour de passe-passe\nPRENDRE — Tour de rein [16,27] — Parle à Lorie Culère.',
  );
  assert.equal(displayStep.action, undefined);
});

test('GUIDE_ITEMS keep the existing instruction after the structured actions', () => {
  const steps: RouteStep[] = [
    {
      id: 'quest',
      order: 1,
      blockId: 'block-01',
      type: 'quest',
      title: 'Quest',
      momentId: 'moment-quest',
      displayRole: 'objective',
      instruction: 'Garde la quête active.',
      guideItems: [{ action: 'take', label: 'Quest' }],
    },
  ];

  const [objective] = getSequenceObjectives(steps);
  assert.equal(objective.steps[0].instruction, 'PRENDRE — Quest\nGarde la quête active.');
});

test('sequence objectives keep an explicit action when no GUIDE_ITEMS or instruction exist', () => {
  const steps: RouteStep[] = [
    {
      id: 'quest',
      order: 1,
      blockId: 'block-01',
      type: 'quest',
      title: 'La terre banquise',
      action: 'TERMINER',
      momentId: 'moment-frigost',
      displayRole: 'objective',
    },
    {
      id: 'transition',
      order: 2,
      blockId: 'block-01',
      type: 'resume',
      title: 'Retourner voir le PNJ',
      action: 'TERMINER',
      momentId: 'moment-frigost',
      displayRole: 'transition',
    },
  ];

  const [objective] = getSequenceObjectives(steps);
  assert.equal(objective.steps[0].instruction, 'TERMINER');
  assert.equal(objective.steps[1].instruction, 'TERMINER — Retourner voir le PNJ');
});
