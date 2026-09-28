import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlayerFacingStepTitle } from './displayTitle';
import type { RouteStep } from './types';

function makeStep(overrides: Partial<RouteStep>): RouteStep {
  return {
    id: 'step',
    order: 1,
    blockId: 'block-01',
    type: 'quest',
    title: 'Titre',
    ...overrides,
  };
}

test('a DPLN quest hides its editorial suffix', () => {
  const step = makeStep({
    title: "Dépôt de ravitaillement — avancer jusqu'au verrou Chaud du S.L.I.P.",
    source: { label: 'DPLN', url: 'https://example.com' },
  });

  assert.equal(getPlayerFacingStepTitle(step), 'Dépôt de ravitaillement');
});

test('a dungeon hides passage metadata and the legacy diamond prefix', () => {
  const step = makeStep({
    type: 'dungeon',
    title: '◆ Serre du Royalmouth — PASSAGE #3',
  });

  assert.equal(getPlayerFacingStepTitle(step), 'Serre du Royalmouth');
});

test('a composite routing card keeps its meaningful suffix', () => {
  const step = makeStep({
    type: 'major_step',
    title: 'Enutrosor — La quatrième dimension + Crache Test',
  });

  assert.equal(getPlayerFacingStepTitle(step), 'Enutrosor — La quatrième dimension + Crache Test');
});
