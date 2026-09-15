import type { PreparationItem, StructuredPreparationItem } from './types';

const nonResourcePattern = /\b(kamas?|succ[eè]s|niveau|minimum|au choix|de chaque|emplacements?|points? de succ[eè]s|disponibles?|inventaire|sort)\b|\bOU\b|pierres? d['’]âme adaptées?|artefacts? pandawushu\s*:/i;
const annotatedRequirementPattern = /[—+():/]/;

/**
 * Adaptateur temporaire pendant la migration de route.json.
 * Les entrées déjà structurées sont rendues telles quelles.
 * Les anciennes chaînes ne sont jamais singularisées ni réécrites.
 */
export function normalizePreparationItem(item: PreparationItem): StructuredPreparationItem {
  if (typeof item !== 'string') return item;

  const trimmed = item.trim();
  const match = trimmed.match(/^([\d\s]+)\s*(?:[×x]\s*)?(.+?)\s*$/i);

  if (!match) return { kind: 'note', text: trimmed };

  const quantity = Number.parseInt(match[1].replace(/\s/g, ''), 10);
  const name = match[2].trim();

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !name ||
    nonResourcePattern.test(name) ||
    annotatedRequirementPattern.test(name)
  ) {
    return { kind: 'note', text: trimmed };
  }

  return { kind: 'resource', quantity, name };
}

export function getPreparationItemKey(stepId: string, itemIndex: number): string {
  return `${stepId}:${itemIndex}`;
}
