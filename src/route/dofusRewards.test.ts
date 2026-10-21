import assert from 'node:assert/strict';
import test from 'node:test';
import { dofusRewards, getNewDofusReward } from './dofusRewards';
import { loadBundledRoute } from './loader';

test('all acquisition rewards refer to existing route steps', () => {
  const ids = new Set(loadBundledRoute().steps.map((step) => step.id));
  assert.equal(Object.keys(dofusRewards).length, 13);
  for (const [stepId, reward] of Object.entries(dofusRewards)) {
    assert.ok(ids.has(stepId), `Unknown acquisition: ${stepId}`);
    assert.equal(reward.stepId, stepId);
  }
});

test('reward triggers only when the acquisition is newly checked', () => {
  assert.equal(getNewDofusReward(['route-step-0890'], new Set())?.name, 'Dofus Ocre');
  assert.equal(getNewDofusReward(['route-step-0890'], new Set(['route-step-0890'])), undefined);
  assert.equal(getNewDofusReward(['route-step-0889'], new Set()), undefined);
});

test('Abyssal is excluded and final Sylvestre reward is distinct from its temporary quest item', () => {
  assert.ok(!Object.values(dofusRewards).some((reward) => /Abyssal/.test(reward.name)));
  assert.equal(dofusRewards['route-step-0999'].name, 'Dofus Sylvestre');
  assert.equal(dofusRewards['route-step-0996'], undefined);
});
