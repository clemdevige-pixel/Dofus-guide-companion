import assert from 'node:assert/strict';
import test from 'node:test';

import { loadBundledRoute } from './loader';

const route = loadBundledRoute();
const orderById = new Map(route.steps.map((step) => [step.id, step.order]));

function requireOrder(stepId: string): number {
  const order = orderById.get(stepId);
  assert.notEqual(order, undefined, `Étape métier absente de la route : ${stepId}`);
  return order as number;
}

function assertOrderedSequence(label: string, stepIds: readonly string[]) {
  test(label, () => {
    for (let index = 1; index < stepIds.length; index += 1) {
      const previousId = stepIds[index - 1];
      const currentId = stepIds[index];
      const previousOrder = requireOrder(previousId);
      const currentOrder = requireOrder(currentId);

      assert.ok(
        previousOrder < currentOrder,
        `${label}: ${previousId} (${previousOrder}) doit précéder ${currentId} (${currentOrder}).`,
      );
    }
  });
}

assertOrderedSequence('contrat route — alignement 75→85 reste exécutable après Tengu', [
  'route-step-0540',
  'route-step-0556',
  'route-step-0557',
  'route-step-0558',
  'route-step-0541',
  'route-step-0542',
  'route-step-0543',
  'route-step-0544',
  'route-step-0545',
  'route-step-0546',
  'route-step-0547',
  'route-step-0548',
  'route-step-0549',
  'route-step-0550',
  'route-step-0551',
]);

assertOrderedSequence('contrat route — Fratrie débloque Ébène avant Gang des Toxines', [
  'route-step-0686',
  'route-step-0687',
  'route-step-0688',
  'route-step-0689',
  'route-step-0862',
  'route-step-0864',
  'route-step-audit-gang-toxines',
]);

assertOrderedSequence('contrat route — Ordre 4 est terminé avant Ordre 5', [
  'route-step-0552',
  'route-step-audit-ougah-order4',
  'route-step-0740',
  'route-step-0808',
  'route-step-0809',
  'route-step-0810',
]);

assertOrderedSequence('contrat route — alignement 99 est terminé avant alignement 100 puis Ordre 5', [
  'route-step-0641',
  'route-step-audit-ilyzaelle-align99',
  'route-step-0806',
  'route-step-0807',
  'route-step-0808',
]);

assertOrderedSequence('contrat route — premier Comte donne le DDG avant le Comte Six sur six', [
  'route-step-0647',
  'route-step-0949',
  'route-step-audit-un-comte-start',
  'route-step-audit-comte-ddg',
  'route-step-audit-un-comte-finish',
  'route-step-0951',
  'route-step-audit-dofus-glaces',
  'route-step-0946',
  'route-step-0948',
  'route-step-0950',
]);

assertOrderedSequence('contrat route — Tour du Monde suit Ougah → Merkator → Kralamoure', [
  'route-step-0496',
  'route-step-audit-ougah-order4',
  'route-step-audit-tour-force-nage',
  'route-step-0809',
  'route-step-audit-tour-nage-joue',
  'route-step-0889',
  'route-step-audit-tour-joue-finish',
]);

assertOrderedSequence('contrat route — accès Martegel précède De Brikke et de Brokke', [
  'route-step-0848',
  'route-step-0849',
]);
