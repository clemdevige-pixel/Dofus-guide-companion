import assert from 'node:assert/strict';
import test from 'node:test';
import routeData from '../../data/route.json';
import { getSequenceObjectives, getStepGroups } from './selectors';
import type { RouteDocument } from './types';

const route = routeData as RouteDocument;

test('playable quest and dungeon actions remain visible and individually checkable', () => {
  const objectives = new Set(getStepGroups(route).flatMap(group =>
    getSequenceObjectives(group.steps).map(objective => objective.id)));
  const types = new Set(['quest', 'resume', 'alignment', 'order', 'long_running', 'dungeon', 'major_step']);
  for (const step of route.steps.filter(step => types.has(step.type) && step.action !== 'FIN DU SUIVI')) {
    assert.ok(objectives.has(step.id), `${step.id}: hidden playable action`);
  }
  for (const group of getStepGroups(route)) {
    assert.ok(getSequenceObjectives(group.steps).length <= 5, group.id);
  }
});

test('a whole quest stays on one objective while staged quests announce their launch and stop', () => {
  assert.equal(route.steps.find(step => step.id === 'route-step-0106')?.action, 'LANCER / TERMINER');
  const launch = route.steps.find(step => step.id === 'route-step-0803')!;
  assert.equal(launch.action, 'LANCER / AVANCER / STOP');
  assert.match(launch.instruction ?? '', /Ilyzaelle/);
  assert.ok(launch.location || launch.launchInstruction);
  assert.equal(route.steps.find(step => step.id === 'route-step-0805')?.action, 'REPRENDRE / TERMINER');
  for (const id of ['route-step-0782', 'route-step-0832', 'route-step-0696']) {
    assert.ok(route.steps.find(step => step.id === id)?.instruction?.trim(), id);
  }
});

test('Champ Pomy is taken before entering the dungeon and turned in after its collection', () => {
  const ids = ['route-step-audit-mauvaise-graine', 'route-step-champ-pomy-start', 'route-step-0519',
    'route-step-0520', 'route-step-audit-champ-pomy'];
  for (let i = 1; i < ids.length; i++) {
    assert.ok(route.steps.find(step => step.id === ids[i - 1])!.order
      < route.steps.find(step => step.id === ids[i])!.order, ids[i]);
  }
  const start = route.steps.find(step => step.id === ids[1])!;
  assert.equal(start.action, 'LANCER / AVANCER / STOP');
  assert.match(start.instruction ?? '', /40 Graines de Basalte/);
  assert.match(start.instruction ?? '', /avant de quitter le donjon/);
  const finish = route.steps.find(step => step.id === ids.at(-1))!;
  assert.equal(finish.action, 'TERMINER');
  assert.match(finish.instruction ?? '', /Cassiopée/);
});
