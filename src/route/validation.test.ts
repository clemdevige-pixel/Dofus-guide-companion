import assert from 'node:assert/strict';
import test from 'node:test';
import type { RouteDocument, RouteStep } from './types';
import { validateRoute } from './validation';

function makeRoute(steps: RouteStep[]): RouteDocument {
  return {
    schemaVersion: 1,
    routeVersion: 'test',
    title: 'Test route',
    blocks: [{ id: 'block-01', order: 1, title: 'Block' }],
    steps,
  };
}

const finalStep: RouteStep = {
  id: 'final',
  order: 2,
  blockId: 'block-01',
  type: 'finish',
  title: 'Finish',
};

test('accepts a valid ordered goal lifecycle', () => {
  assert.doesNotThrow(() =>
    validateRoute(
      makeRoute([
        {
          id: 'start',
          order: 1,
          blockId: 'block-01',
          type: 'quest',
          title: 'Start',
          longRunningGoal: { goalId: 'goal', phase: 'start' },
        },
        { ...finalStep, order: 2 },
      ]),
    ),
  );
});

test('rejects progress before start', () => {
  assert.throws(
    () =>
      validateRoute(
        makeRoute([
          {
            id: 'progress',
            order: 1,
            blockId: 'block-01',
            type: 'resume',
            title: 'Progress',
            longRunningGoal: { goalId: 'goal', phase: 'progress' },
          },
          { ...finalStep, order: 2 },
        ]),
      ),
    /progress avant start/,
  );
});

test('rejects finish before start', () => {
  assert.throws(
    () =>
      validateRoute(
        makeRoute([
          {
            id: 'goal-finish',
            order: 1,
            blockId: 'block-01',
            type: 'resume',
            title: 'Goal finish',
            longRunningGoal: { goalId: 'goal', phase: 'finish' },
          },
          { ...finalStep, order: 2 },
        ]),
      ),
    /finish avant start/,
  );
});

test('rejects a FIN before the last step', () => {
  assert.throws(
    () =>
      validateRoute(
        makeRoute([
          { ...finalStep, id: 'early-finish', order: 1 },
          {
            id: 'quest',
            order: 2,
            blockId: 'block-01',
            type: 'quest',
            title: 'Quest',
          },
        ]),
      ),
    /FIN doit être la dernière étape/,
  );
});

test('rejects a preparation without useful content', () => {
  assert.throws(
    () =>
      validateRoute(
        makeRoute([
          {
            id: 'prep',
            order: 1,
            blockId: 'block-01',
            type: 'preparation',
            title: 'Prep',
          },
          { ...finalStep, order: 2 },
        ]),
      ),
    /PRÉPA sans preparationItems ni instruction/,
  );
});

test('rejects a launch action without structured launch metadata', () => {
  assert.throws(
    () =>
      validateRoute(
        makeRoute([
          {
            id: 'launch',
            order: 1,
            blockId: 'block-01',
            type: 'quest',
            title: 'Launch quest',
            action: 'LANCER / STOP',
          },
          { ...finalStep, order: 2 },
        ]),
      ),
    /action de lancement sans location ni launchInstruction/,
  );
});

test('accepts a launch action with a structured location', () => {
  assert.doesNotThrow(() =>
    validateRoute(
      makeRoute([
        {
          id: 'launch',
          order: 1,
          blockId: 'block-01',
          type: 'quest',
          title: 'Launch quest',
          action: 'LANCER',
          location: { x: 1, y: -2 },
        },
        { ...finalStep, order: 2 },
      ]),
    ),
  );
});

test('accepts a pure travel step with a structured destination and no launch location', () => {
  assert.doesNotThrow(() =>
    validateRoute(
      makeRoute([
        {
          id: 'travel',
          order: 1,
          blockId: 'block-01',
          type: 'major_step',
          title: 'Travel objective',
          action: 'AVANCER',
          destination: { x: -12, y: 34 },
        },
        { ...finalStep, order: 2 },
      ]),
    ),
  );
});

test('rejects a non-integer structured destination', () => {
  assert.throws(
    () =>
      validateRoute(
        makeRoute([
          {
            id: 'travel',
            order: 1,
            blockId: 'block-01',
            type: 'major_step',
            title: 'Travel objective',
            destination: { x: 1.5, y: 2 },
          },
          { ...finalStep, order: 2 },
        ]),
      ),
    /destination invalide/,
  );
});

test('accepts structured guide items for a multi-quest roadbook step', () => {
  assert.doesNotThrow(() =>
    validateRoute(
      makeRoute([
        {
          id: 'roadbook',
          order: 1,
          blockId: 'block-01',
          type: 'major_step',
          title: 'Quest batch',
          guideItems: [
            { action: 'take', label: 'Quest A', location: { x: 1, y: -2 } },
            { action: 'take', label: 'Quest B', location: { x: 3, y: -4 }, note: 'Garder active.' },
          ],
        },
        { ...finalStep, order: 2 },
      ]),
    ),
  );
});

test('rejects an empty guide item label', () => {
  assert.throws(
    () =>
      validateRoute(
        makeRoute([
          {
            id: 'roadbook',
            order: 1,
            blockId: 'block-01',
            type: 'major_step',
            title: 'Quest batch',
            guideItems: [{ action: 'advance', label: '   ', location: { x: 1, y: -2 } }],
          },
          { ...finalStep, order: 2 },
        ]),
      ),
    /libellé vide/,
  );
});

test('rejects a character-level hard lock card', () => {
  assert.throws(
    () =>
      validateRoute(
        makeRoute([
          {
            id: 'level-lock',
            order: 1,
            blockId: 'block-01',
            type: 'hard_lock',
            title: 'NIVEAU 80 — VERROU DUR',
            hardLock: { message: 'STOP jusqu’au niveau 80.' },
          },
          { ...finalStep, order: 2 },
        ]),
      ),
    /niveau de personnage ne doit pas créer de VERROU DUR/,
  );
});
