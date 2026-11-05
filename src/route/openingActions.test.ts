import assert from 'node:assert/strict';
import test from 'node:test';
import routeData from '../../data/route.json';
import migrations from '../../data/route-progress-migrations.json';
import { getStepGroups } from './selectors';
import type { RouteDocument } from './types';

const route = routeData as RouteDocument;
const openingBlocks = new Set(['block-01', 'block-02', 'block-03']);
const opening = route.steps.filter(step => openingBlocks.has(step.blockId));

test('Incarnam and Astrub expose independent chronological action cards', () => {
  assert.ok(opening.length > 142);
  for (const group of getStepGroups(route).filter(group => openingBlocks.has(group.blockId))) {
    assert.equal(group.isSequence, false, group.id);
    assert.equal(group.steps.length, 1);
  }
  for (const step of opening.filter(step => step.type !== 'preparation')) {
    assert.ok(['LANCER', 'AVANCER', 'TERMINER', 'FAIRE'].includes(step.action ?? ''), step.id);
    assert.ok(step.instruction?.trim(), step.id);
    assert.equal(step.guideItems, undefined, step.id);
    if (step.action === 'LANCER') assert.ok(step.location || step.launchInstruction, step.id);
  }
});

test('new action IDs have a unique legacy migration and all migration targets exist', () => {
  const ids = new Set(route.steps.map(step => step.id));
  const migrated = new Set<string>();
  for (const migration of migrations.migrations) {
    for (const [legacyId, targets] of Object.entries(migration.expansions)) {
      assert.ok(ids.has(legacyId), legacyId);
      assert.ok(targets.includes(legacyId));
      for (const id of targets) {
        assert.ok(ids.has(id), id);
        assert.ok(!migrated.has(id), id);
        migrated.add(id);
      }
    }
  }
  for (const step of opening.filter(step => step.id.includes('-action-'))) {
    assert.ok(migrated.has(step.id), step.id);
  }
});

test('opening quest launches have a later explicit turn-in or a documented continuation', () => {
  const carriedToLaterBlocks = new Set(['Le réceptacle des Dofus', 'Le maître des clefs']);
  for (const start of opening.filter(step => step.action === 'LANCER')) {
    if (carriedToLaterBlocks.has(start.title)) {
      assert.ok(route.steps.some(step => step.order > start.order && !openingBlocks.has(step.blockId)
        && step.source?.url === start.source?.url), start.title);
      continue;
    }
    assert.ok(opening.some(step => step.order > start.order
      && step.title === start.title && step.action === 'TERMINER'), start.title);
  }
});

test('Vestiges visits all five zones before its turn-in and Rikiki returns to Emma', () => {
  const vestiges = opening.filter(step => step.title === 'Des vestiges de légende');
  const finish = vestiges.find(step => step.action === 'TERMINER');
  assert.ok(finish);
  for (const [x, y] of [[0, -3], [0, -5], [-2, -2], [1, -5], [1, -1]]) {
    assert.ok(vestiges.some(step => step.action === 'AVANCER' && step.order < finish.order
      && step.destination?.x === x && step.destination.y === y));
  }
  const rikiki = opening.find(step => step.id === 'route-step-0094');
  assert.deepEqual(rikiki?.destination, { x: 1, y: -15 });
  assert.match(rikiki?.instruction ?? '', /Emma Tompouce/);
});
