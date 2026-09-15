import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RouteDocument, StructuredPreparationItem } from '../src/route/types';

const routePath = resolve(process.cwd(), 'data/route.json');
const route = JSON.parse(readFileSync(routePath, 'utf8')) as RouteDocument;

const quantityPattern = /^([\d\s]+)\s*(?:[×x]\s*)?(.+?)\s*$/i;
const nonResourcePattern = /\b(kamas?|succ[eè]s|niveau|minimum|au choix|de chaque|emplacements?|points? de succ[eè]s|disponibles?|inventaire|sort|m[ée]tier|alignement|personnages?)\b|\bOU\b|pierres? d['’]âme adaptées?|artefacts? pandawushu\s*:/i;

const implicitSingleResources = new Map<string, Set<string>>([
  ['route-step-0418', new Set([
    'Duvet de Mamansot',
    'Cuir du Sanglacier',
    'Étoffe de Rat Bougri',
    'Oreille percée du Fricochère',
    'Pince de Crabe Hijacob',
    'Poil de Smilomouth',
    'Plume du Timansot',
    'Plume de Gélikan',
    'Queue du Fu Mansot',
    "Queue d'Ecumouth",
    'Peau de Mansobèse',
  ])],
  ['route-step-0421', new Set([
    'Bout Blop Coco',
    'Écaille Dragoss Calcaire',
    'Patte Corbac',
    'Écaille Ouroboulos',
    'Œuf Dragoeuf Ardoise',
    'Papatte Croc Gland',
    'Tissu Pourpre',
  ])],
]);

function splitEditorialAnnotation(name: string): { name: string; note?: string } {
  if (name.includes(' — ')) {
    const [resourceName, ...noteParts] = name.split(' — ');
    const normalizedName = resourceName
      .replace(/\s+supplémentaires?$/i, '')
      .trim();
    return { name: normalizedName, note: noteParts.join(' — ').trim() };
  }

  const parenthetical = name.match(/^(.+?)\s+\((.+)\)$/);
  if (parenthetical && /\b(ou|si|supplément|amulette|déjà|à|pour|trousseau)\b|\+/i.test(parenthetical[2])) {
    return { name: parenthetical[1].trim(), note: parenthetical[2].trim() };
  }

  return { name: name.trim() };
}

function migrateItem(stepId: string, rawItem: string): StructuredPreparationItem {
  const trimmed = rawItem.trim();
  if (implicitSingleResources.get(stepId)?.has(trimmed)) {
    return { kind: 'resource', quantity: 1, name: trimmed };
  }

  const match = trimmed.match(quantityPattern);
  if (!match) return { kind: 'note', text: trimmed };

  const quantity = Number.parseInt(match[1].replace(/\s/g, ''), 10);
  const rawName = match[2].trim();

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    nonResourcePattern.test(rawName) ||
    rawName.includes(' / ') ||
    rawName.includes(' + ') ||
    rawName.includes(':') ||
    /^slip compatible$/i.test(rawName)
  ) {
    return { kind: 'note', text: trimmed };
  }

  const { name, note } = splitEditorialAnnotation(rawName);
  if (!name || nonResourcePattern.test(name)) return { kind: 'note', text: trimmed };

  return {
    kind: 'resource',
    quantity,
    name,
    ...(note ? { note } : {}),
  };
}

let migrated = 0;
let resources = 0;
let notes = 0;

for (const step of route.steps) {
  if (!step.preparationItems) continue;

  step.preparationItems = step.preparationItems.map((item) => {
    if (typeof item !== 'string') return item;
    migrated += 1;
    const structured = migrateItem(step.id, item);
    if (structured.kind === 'resource') resources += 1;
    else notes += 1;
    return structured;
  });
}

writeFileSync(routePath, `${JSON.stringify(route, null, 2)}\n`, 'utf8');
console.log(`Preparation data migrated: ${migrated} legacy entries -> ${resources} resources + ${notes} notes.`);
