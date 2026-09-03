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
