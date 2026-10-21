import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPreparationItemKey,
  preparationRequirementLabels,
} from './preparation';

test('exposes stable player-facing labels for preparation requirements', () => {
  assert.equal(preparationRequirementLabels.kamas, 'KAMAS');
  assert.equal(preparationRequirementLabels.profession, 'MÉTIER');
  assert.equal(preparationRequirementLabels.party, 'GROUPE');
  assert.equal(preparationRequirementLabels.class, 'CLASSE');
  assert.equal(preparationRequirementLabels.requirement, 'PRÉREQUIS');
});

test('preparation item key is stable inside a route step', () => {
  assert.equal(getPreparationItemKey('route-step-0002', 3), 'route-step-0002:3');
});
