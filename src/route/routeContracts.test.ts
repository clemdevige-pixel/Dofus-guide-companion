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

test('contrat éditorial — une instruction ne répète pas seulement action, titre et position', () => {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[’']/g, "'")
      .replace(/[.,;:!?()[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const baseTitle = (title: string) => title.replace(/\s+—.*$/, '').trim();

  for (const step of route.steps) {
    if (!step.instruction) continue;

    const title = baseTitle(step.title);
    const coordinate = step.destination ?? step.location;
    const patterns = [
      `Lance ${title}`,
      `Termine ${title}`,
      `Terminer ${title}`,
      `Reprends ${title} et termine-la`,
      `Reprends ${title} et termine la quête`,
      `Reprends et termine ${title}`,
      ...(coordinate
        ? [
            `En [${coordinate.x},${coordinate.y}], lance puis termine ${title}`,
            `En [${coordinate.x},${coordinate.y}], lance ${title} et termine la quête`,
            `[${coordinate.x},${coordinate.y}] : prendre puis terminer ${title}`,
            `En [${coordinate.x},${coordinate.y}], termine ${title}`,
            `À [${coordinate.x},${coordinate.y}], termine ${title}`,
          ]
        : []),
      `Termine ${title} maintenant`,
      `Terminer ${title} maintenant`,
    ].map(normalize);

    assert.ok(
      !patterns.includes(normalize(step.instruction)),
      `instruction redondante sur ${step.id} : ${step.instruction}`,
    );
  }
});

test('contrat UX — reprends n\'apparaît dans un flow qu\'au moment d\'une vraie reprise', () => {
  for (const step of route.steps) {
    if (!step.flowNote || !/\breprends\b/i.test(step.flowNote)) continue;
    assert.match(
      step.action ?? '',
      /REPRENDRE/i,
      `${step.id}: flowNote utilise « reprends » sans action REPRENDRE.`,
    );
  }
});

test('contrat UX — le wording joueur utilise termine plutôt que ferme', () => {
  for (const step of route.steps) {
    if (!step.flowNote) continue;
    assert.ok(
      !/\bferme(?:r)?\b/i.test(step.flowNote),
      `${step.id}: flowNote contient encore « ferme/fermer ».`,
    );
  }
});

test('contrat route — Pêche en eaux gelées est explicitement terminée après le Mansot Royal', () => {
  assertOrderedSequence('Pêche en eaux gelées', [
    'route-step-0417',
    'route-step-0426',
    'route-step-peche-eaux-gelees-finish',
    'route-step-0430',
  ]);

  const finish = route.steps.find((step) => step.id === 'route-step-peche-eaux-gelees-finish');
  assert.equal(finish?.displayRole, 'objective');
  assert.match(finish?.action ?? '', /REPRENDRE/);
  assert.match(finish?.action ?? '', /TERMINER/);
});

test('contrat route — le drop Parangon est activé avant le premier donjon 200 de la série', () => {
  assertOrderedSequence('Parangon avant donjons 200', [
    'route-step-1171',
    'route-step-0622',
  ]);

  const parangon = route.steps.find((step) => step.id === 'route-step-1171');
  assert.match(parangon?.action ?? '', /AVANCER/);
  assert.match(parangon?.action ?? '', /STOP/);
  assert.match(parangon?.flowNote ?? '', /Obtenir un Parangon de puissance/i);
  assert.match(parangon?.flowNote ?? '', /avant tout donjon niveau 200/i);
});

test('contrat UX — les flow notes restent ciblées sur les moments complexes', () => {
  const flowNotes = route.steps.filter((step) => step.flowNote);
  assert.ok(flowNotes.length >= 50, `Au moins 50 flow notes sont attendues, reçu : ${flowNotes.length}.`);

  for (const step of flowNotes) {
    if (!step.momentId) continue;
    const firstMomentStep = route.steps.find((candidate) => candidate.momentId === step.momentId);
    assert.equal(
      firstMomentStep?.id,
      step.id,
      `${step.id}: une flow note doit être portée par le premier step du moment.`,
    );
  }

  const expected = new Map([
    ['route-step-1100', /quêtes des PNJ/i],
    ['route-step-0857', /Skeunk.*Fraktale/i],
    ['route-step-0833', /un seul retour au Pichon/i],
    ['route-step-0693', /Main dans la main.*branches/i],
    ['route-step-0938', /Rune d’Harmonie.*totems de Maïmane/i],
    ['route-step-0994', /Flovoraison.*Protecteur/i],
  ]);

  for (const [stepId, pattern] of expected) {
    const step = route.steps.find((candidate) => candidate.id === stepId);
    assert.ok(step?.flowNote, `${stepId}: flow note manquante.`);
    assert.match(step.flowNote ?? '', pattern);
  }
});

test('contrat route — La source de tous les maux reste un objectif visible après Veilleur', () => {
  const ids = ['route-step-0681', 'route-step-0682', 'route-step-0683', 'route-step-0684', 'route-step-0685'] as const;
  const steps = ids.map((id) => route.steps.find((step) => step.id === id));

  for (const step of steps) {
    assert.ok(step, `${step?.id ?? 'étape'} absente de la route`);
    assert.equal(step?.momentId, 'moment-eliocalypse-reel-b');
    assert.equal(step?.displayRole, 'objective');
  }

  const source = route.steps.find((step) => step.id === 'route-step-0685');
  assert.equal(source?.prerequisites, 'Veilleur sous surveillance terminé.');
  assert.equal(source?.action, 'LANCER / TERMINER');
});

assertOrderedSequence('contrat route — L\'accusé de la réception débloque la diligence', [
  'route-step-accuse-reception',
  'route-step-0531',
]);

assertOrderedSequence('contrat route — ouverture Martegel inclut La dernière barbe avant De Brikke', [
  'route-step-0848',
  'route-step-derniere-barbe',
  'route-step-0849',
]);


test('contrat route — Meno mutualise Ivoire + Abyssal en un seul passage', () => {
  const menoDungeons = route.steps.filter(
    (step) => step.type === 'dungeon' && step.title.includes('Vaisseau du Capitaine Meno'),
  );

  assert.equal(menoDungeons.length, 1, 'Le Vaisseau du Capitaine Meno doit rester mutualisé en un seul passage.');
  assert.equal(menoDungeons[0]?.id, 'route-step-0837');
  assert.match(menoDungeons[0]?.title ?? '', /IVOIRE \+ ABYSSAL/);
  assertOrderedSequence('contrat Meno — Piège attend la convergence Ivoire', [
    'route-step-0671',
    'route-step-0835',
    'route-step-0836',
    'route-step-0837',
    'route-step-0838',
  ]);
});

test('contrat route — Dazak mutualise Ébène + Martegel sur leur passage commun', () => {
  const dazakEbeneMartegel = route.steps.filter(
    (step) =>
      step.type === 'dungeon' &&
      step.title.includes('Brasserie du Roi Dazak') &&
      step.title.includes('ÉBÈNE + MARTEGEL'),
  );

  assert.equal(
    dazakEbeneMartegel.length,
    1,
    'La convergence Ébène + Martegel doit rester mutualisée en un seul passage Dazak.',
  );
  assert.equal(dazakEbeneMartegel[0]?.id, 'route-step-0874');
  assertOrderedSequence('contrat Dazak — Martegel attend la convergence Ébène', [
    'route-step-0853',
    'route-step-0873',
    'route-step-0874',
    'route-step-0875',
    'route-step-0876',
  ]);
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


test('contrat route — Nordalie ouvre ses missions au début du bloc Ivoire II', () => {
  const nordalieIds = ['route-step-0830', 'route-step-0831', 'route-step-0832'] as const;

  for (const stepId of nordalieIds) {
    const step = route.steps.find((candidate) => candidate.id === stepId);
    assert.equal(step?.blockId, 'block-24', `${stepId} doit rester dans le bloc Ivoire II.`);
  }

  assert.ok(requireOrder('block-entry-23') < requireOrder('route-step-0896'));
  assert.ok(requireOrder('block-entry-24') < requireOrder('route-step-0830'));
  assert.ok(requireOrder('route-step-0832') < requireOrder('route-step-0833'));
});
