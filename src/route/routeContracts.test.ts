import assert from 'node:assert/strict';
import test from 'node:test';

import routeData from '../../data/route.json';
import type { RouteDocument } from './types';
import { validateRoute } from './validation';

// Les contrats éditoriaux doivent auditer la donnée source brute.
// loadBundledRoute() normalise volontairement certains titres pour l'affichage joueur.
const route = validateRoute(routeData as RouteDocument);
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

function normalizeObjectiveTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr-FR');
}

test('contrat route — un moment ne contient pas deux fois le même objectif éditorial brut', () => {
  const objectiveTitlesByMoment = new Map<string, Map<string, string>>();

  for (const step of route.steps) {
    if (!step.momentId || step.displayRole !== 'objective') continue;

    // Lint éditorial de la donnée source uniquement : les suffixes de checkpoint restent
    // disponibles ici même s'ils sont masqués ensuite par le renderer joueur.
    const objectiveKey = normalizeObjectiveTitle(step.title);
    const titles = objectiveTitlesByMoment.get(step.momentId) ?? new Map<string, string>();
    const existingStepId = titles.get(objectiveKey);

    assert.equal(
      existingStepId,
      undefined,
      `${step.momentId}: objectif éditorial brut dupliqué entre ${existingStepId ?? 'inconnu'} et ${step.id} (${step.title}).`,
    );

    titles.set(objectiveKey, step.id);
    objectiveTitlesByMoment.set(step.momentId, titles);
  }
});

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


test('contrat route — Meno mutualisé Ivoire + Abyssal en un seul passage', () => {
  const menoDungeons = route.steps.filter(
    (step) => step.type === 'dungeon' && step.title.includes('Vaisseau du Capitaine Meno'),
  );

  assert.equal(menoDungeons.length, 1, 'Le Vaisseau du Capitaine Meno ne doit apparaître qu’une seule fois.');
  assert.equal(menoDungeons[0]?.id, 'route-step-0837');
  assert.ok(requireOrder('route-step-0671') < requireOrder('route-step-0837'));
});

test('contrat route — Frimar utilise le drop de Métal Éternel, jamais une capture', () => {
  const serialized = route.steps
    .map((step) => [step.title, step.instruction, step.warning, step.prerequisites].filter(Boolean).join(' '))
    .join('\n');

  assert.doesNotMatch(serialized, /captur\w*[^\n]*Frimar|Frimar[^\n]*captur/i);

  const machine = route.steps.find((step) => step.id === 'route-step-0643');
  assert.ok(machine?.instruction);
  assert.match(machine.instruction, /2 Métaux Éternels.*Frimar/i);
});


test('contrat route — une seule carte ENTRÉE par bloc et aucune ancienne PRÉPA autonome', () => {
  const entries = route.steps.filter((step) => step.type === 'preparation');

  assert.equal(entries.length, route.blocks.length);
  for (const block of route.blocks) {
    const blockEntries = entries.filter((step) => step.blockId === block.id);
    assert.equal(blockEntries.length, 1, `${block.id}: une seule carte ENTRÉE est attendue.`);
    assert.equal(blockEntries[0]?.displayType, 'ENTRÉE');
    assert.match(blockEntries[0]?.id ?? '', /^block-entry-\d{2}$/);
  }
});
