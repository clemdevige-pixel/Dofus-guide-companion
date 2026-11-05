import assert from 'node:assert/strict';
import test from 'node:test';
import routeData from '../../data/route.json';
import migrations from '../../data/route-progress-migrations.json';
import { getStepGroups, getSequenceObjectives } from './selectors';
import type { RouteDocument } from './types';

const route = routeData as RouteDocument;
const openingBlocks = new Set(['block-01', 'block-02', 'block-03']);
const opening = route.steps.filter(step => openingBlocks.has(step.blockId));

test('Incarnam and Astrub group explicit actions into useful stops', () => {
  assert.ok(opening.length > 142);
  const groups = getStepGroups(route).filter(group => openingBlocks.has(group.blockId));
  assert.ok(groups.length <= 100, `Too many opening cards: ${groups.length}`);
  assert.ok(groups.some(group => group.steps.some(step => step.action === 'LANCER')
    && group.steps.some(step => step.action === 'TERMINER')));
  for (const group of groups) {
    assert.ok(group.steps.length <= 5, group.id);
    assert.deepEqual(getSequenceObjectives(group.steps).map(objective => objective.id),
      group.steps.map(step => step.id), `${group.id}: each action must keep its checkbox`);
  }
  for (const step of opening.filter(step => step.type !== 'preparation')) {
    assert.ok(['LANCER', 'AVANCER', 'TERMINER', 'FAIRE'].includes(step.action ?? ''), step.id);
    assert.ok(step.instruction?.trim() || step.launchInstruction?.trim(), step.id);
    assert.equal(step.guideItems, undefined, step.id);
    if (step.action === 'LANCER') assert.ok(step.location || step.launchInstruction, step.id);
  }
});

test('an uninterrupted quest keeps its take, progress and turn-in on one card', () => {
  const groups = getStepGroups(route);
  const ids = ['route-step-0009-action-1', 'route-step-0009-action-2', 'route-step-0009'];
  const group = groups.find(group => group.steps.some(step => step.id === ids[0]));
  assert.deepEqual(group?.steps.map(step => step.id), ids);
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
