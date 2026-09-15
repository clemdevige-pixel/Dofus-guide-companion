export interface ParsedPreparationResource {
  kind: 'resource';
  quantity: number;
  name: string;
}

export interface ParsedPreparationNote {
  kind: 'note';
  text: string;
}

export type ParsedPreparationItem = ParsedPreparationResource | ParsedPreparationNote;

const nonResourcePattern = /\b(kamas?|succ[eè]s|niveau|minimum|au choix|de chaque)\b|\bOU\b|pierres? d['’]âme adaptées?|artefacts? pandawushu\s*:/i;

/**
 * preparationItems reste la source de vérité de la route.
 * Ce parseur sépare uniquement la quantité du nom pour l'UI et le presse-papier.
 * Il ne singularise et ne réécrit jamais un nom de ressource : le texte de la route
 * doit déjà correspondre au nom exact en jeu.
 */
export function parsePreparationItem(item: string): ParsedPreparationItem {
  const trimmed = item.trim();
  const match = trimmed.match(/^([\d\s]+)\s*(?:[×x]\s*)?(.+?)\s*$/i);

  if (!match) return { kind: 'note', text: trimmed };

  const quantity = Number.parseInt(match[1].replace(/\s/g, ''), 10);
  const name = match[2].trim();

  if (!Number.isFinite(quantity) || quantity <= 0 || !name || nonResourcePattern.test(name)) {
    return { kind: 'note', text: trimmed };
  }

  return { kind: 'resource', quantity, name };
}

export function getPreparationItemKey(stepId: string, itemIndex: number): string {
  return `${stepId}:${itemIndex}`;
}
