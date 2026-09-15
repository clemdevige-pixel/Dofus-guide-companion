import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyPreparationRequirement,
  getPreparationItemKey,
  getTypedPreparationRequirement,
  normalizePreparationItem,
} from './preparation';

test('keeps structured preparation resources unchanged', () => {
  const resource = {
    kind: 'resource' as const,
    quantity: 18,
    name: 'Blé',
  };

  assert.equal(normalizePreparationItem(resource), resource);
});

test('reclassifies legacy notes as typed requirements', () => {
  assert.deepEqual(normalizePreparationItem({ kind: 'note', text: 'Bricoleur niveau 100' }), {
    kind: 'profession',
    text: 'Bricoleur niveau 100',
  });
});

test('temporarily supports legacy route strings without rewriting resource names', () => {
  assert.deepEqual(normalizePreparationItem('18 × Blé'), {
    kind: 'resource',
    quantity: 18,
    name: 'Blé',
  });

  assert.deepEqual(normalizePreparationItem('Succès « Elle a peut-être trop mangé ? »'), {
    kind: 'requirement',
    text: 'Succès « Elle a peut-être trop mangé ? »',
  });
});

test('classifies common non-resource prerequisites', () => {
  assert.equal(classifyPreparationRequirement('Prévoir 10 000 kamas'), 'kamas');
  assert.equal(classifyPreparationRequirement('Bricoleur niveau 100'), 'profession');
  assert.equal(classifyPreparationRequirement('Prévoir un Pandawa pour la mécanique'), 'class');
  assert.equal(classifyPreparationRequirement('Prévoir 4 joueurs pour les dalles'), 'party');
  assert.equal(classifyPreparationRequirement('Succès requis'), 'requirement');
});

test('prioritizes quantified class and party prerequisites over resources', () => {
  assert.deepEqual(getTypedPreparationRequirement('1 × Pandawa pour Pense-bête'), {
    kind: 'class',
    text: 'Pandawa pour Pense-bête',
  });
  assert.deepEqual(normalizePreparationItem('1 × Pandawa pour Pense-bête'), {
    kind: 'class',
    text: 'Pandawa pour Pense-bête',
  });
  assert.deepEqual(normalizePreparationItem({
    kind: 'resource',
    quantity: 1,
    name: 'Pandawa pour Pense-bête',
  }), {
    kind: 'class',
    text: 'Pandawa pour Pense-bête',
  });
  assert.deepEqual(normalizePreparationItem('4 × joueurs pour les dalles'), {
    kind: 'party',
    text: 'joueurs pour les dalles',
  });
});

test('does not reclassify normal resources that merely contain profession words', () => {
  assert.deepEqual(normalizePreparationItem('1 × Marteau du Forgeron'), {
    kind: 'resource',
    quantity: 1,
    name: 'Marteau du Forgeron',
  });
});

test('preparation item key is stable inside a route step', () => {
  assert.equal(getPreparationItemKey('route-step-0002', 3), 'route-step-0002:3');
});
