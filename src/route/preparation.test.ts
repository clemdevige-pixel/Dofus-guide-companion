import assert from 'node:assert/strict';
import test from 'node:test';
import { getPreparationItemKey, parsePreparationItem } from './preparation';

test('parses quantity and keeps the route resource name unchanged', () => {
  assert.deepEqual(parsePreparationItem('18 × Blé'), {
    kind: 'resource',
    quantity: 18,
    name: 'Blé',
  });

  assert.deepEqual(parsePreparationItem('30 Ambre'), {
    kind: 'resource',
    quantity: 30,
    name: 'Ambre',
  });
});

test('keeps non-resource preparation requirements as notes', () => {
  assert.deepEqual(parsePreparationItem('1 700 kamas minimum — 700 Foire + 1 000 quête'), {
    kind: 'note',
    text: '1 700 kamas minimum — 700 Foire + 1 000 quête',
  });
  assert.deepEqual(parsePreparationItem('Succès « Elle a peut-être trop mangé ? »'), {
    kind: 'note',
    text: 'Succès « Elle a peut-être trop mangé ? »',
  });
});

test('preparation item key is stable inside a route step', () => {
  assert.equal(getPreparationItemKey('route-step-0002', 3), 'route-step-0002:3');
});
