import type {
  PreparationItem,
  PreparationRequirementKind,
  StructuredPreparationItem,
} from './types';

const nonResourcePattern = /\b(kamas?|succ[eè]s|niveau|minimum|au choix|de chaque|emplacements?|points? de succ[eè]s|disponibles?|inventaire|sort)\b|\bOU\b|pierres? d['’]âme adaptées?|artefacts? pandawushu\s*:/i;
const annotatedRequirementPattern = /[—+():/]/;

const professionPattern = /\b(m[ée]tier|alchimiste|b[ûu]cheron|mineur|p[êe]cheur|paysan|chasseur|bricoleur|bijoutier|cordonnier|tailleur|fa[çc]onneur|forgeron|sculpteur)\b/i;
const classPattern = /\b(classes?|cra|ecaflip|eliotrope|eniripsa|enutrof|feca|forgelance|huppermage|iop|osamodas|ouginak|pandawa|roublard|sacrieur|sadida|sram|steamer|xelor|zobal)\b/i;
const partyPattern = /\b(dalles?|joueurs?|personnes?|personnages?|groupe|alli[ée]s?|aide)\b/i;

export const preparationRequirementLabels: Record<PreparationRequirementKind | 'note', string> = {
  kamas: 'KAMAS',
  profession: 'MÉTIER',
  party: 'GROUPE',
  class: 'CLASSE',
  requirement: 'PRÉREQUIS',
  note: 'PRÉREQUIS',
};

export function classifyPreparationRequirement(text: string): PreparationRequirementKind {
  if (/\bkamas?\b/i.test(text)) return 'kamas';
  if (professionPattern.test(text)) return 'profession';
  if (classPattern.test(text)) return 'class';
  if (partyPattern.test(text)) return 'party';
  return 'requirement';
}

/**
 * Adaptateur temporaire pendant la migration de route.json.
 * Les entrées déjà structurées sont rendues telles quelles.
 * Les anciennes chaînes ne sont jamais singularisées ni réécrites.
 */
export function normalizePreparationItem(item: PreparationItem): StructuredPreparationItem {
  if (typeof item !== 'string') {
    if (item.kind === 'note') {
      return { kind: classifyPreparationRequirement(item.text), text: item.text };
    }
    return item;
  }

  const trimmed = item.trim();
  const match = trimmed.match(/^([\d\s]+)\s*(?:[×x]\s*)?(.+?)\s*$/i);

  if (!match) {
    return { kind: classifyPreparationRequirement(trimmed), text: trimmed };
  }

  const quantity = Number.parseInt(match[1].replace(/\s/g, ''), 10);
  const name = match[2].trim();

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !name ||
    nonResourcePattern.test(name) ||
    annotatedRequirementPattern.test(name)
  ) {
    return { kind: classifyPreparationRequirement(trimmed), text: trimmed };
  }

  return { kind: 'resource', quantity, name };
}

export function getPreparationItemKey(stepId: string, itemIndex: number): string {
  return `${stepId}:${itemIndex}`;
}
