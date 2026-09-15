import assert from 'node:assert/strict';
import test from 'node:test';
import { getPreparationItemKey, normalizePreparationItem } from './preparation';

test('keeps structured preparation resources unchanged', () => {
  const resource = {
    kind: 'resource' as const,
    quantity: 18,
    name: 'Blé',
  };

  assert.equal(normalizePreparationItem(resource), resource);
});

test('keeps structured preparation notes unchanged', () => {
  const note = {
    kind: 'note' as const,
    text: 'Bricoleur 100',
  };

  assert.equal(normalizePreparationItem(note), note);
});

test('temporarily supports legacy route strings without rewriting names', () => {
  assert.deepEqual(normalizePreparationItem('18 × Blé'), {
    kind: 'resource',
    quantity: 18,
    name: 'Blé',
  });

  assert.deepEqual(normalizePreparationItem('Succès « Elle a peut-être trop mangé ? »'), {
    kind: 'note',
    text: 'Succès « Elle a peut-être trop mangé ? »',
  });
});

test('preparation item key is stable inside a route step', () => {
  assert.equal(getPreparationItemKey('route-step-0002', 3), 'route-step-0002:3');
});
