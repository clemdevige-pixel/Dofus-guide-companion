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
const quantityPrefixPattern = /^\s*\d[\d\s]*\s*(?:[×x]\s*)?/i;

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
 * Détecte les prérequis qui ne doivent jamais être interprétés comme des ressources,
 * même lorsqu'ils commencent par une quantité (ex. "1 × Pandawa pour Pense-bête").
 */
export function getTypedPreparationRequirement(text: string): StructuredPreparationItem | undefined {
  const trimmed = text.trim();
  const withoutQuantity = trimmed.replace(quantityPrefixPattern, '').trim();

  if (/\bkamas?\b/i.test(trimmed)) return { kind: 'kamas', text: trimmed };
  if (partyPattern.test(withoutQuantity)) return { kind: 'party', text: withoutQuantity || trimmed };
  if (classPattern.test(withoutQuantity) && classPattern.exec(withoutQuantity)?.index === 0) {
    return { kind: 'class', text: withoutQuantity };
  }
  if (/^m[ée]tier\b/i.test(withoutQuantity) || (professionPattern.test(withoutQuantity) && /\b(niveau|requis|minimum|pour)\b/i.test(withoutQuantity))) {
    return { kind: 'profession', text: withoutQuantity || trimmed };
  }

  return undefined;
}

/**
 * Adaptateur temporaire pendant la migration de route.json.
 * Les entrées déjà structurées sont rendues telles quelles, sauf une ancienne
 * ressource qui correspond en réalité à un prérequis typé.
 * Les anciennes chaînes ne sont jamais singularisées ni réécrites.
 */
export function normalizePreparationItem(item: PreparationItem): StructuredPreparationItem {
  if (typeof item !== 'string') {
    if (item.kind === 'note') {
      return { kind: classifyPreparationRequirement(item.text), text: item.text };
    }
    if (item.kind === 'resource') {
      const typedRequirement = getTypedPreparationRequirement(`${item.quantity} × ${item.name}`);
      if (typedRequirement) return typedRequirement;
    }
    return item;
  }

  const trimmed = item.trim();
  const typedRequirement = getTypedPreparationRequirement(trimmed);
  if (typedRequirement) return typedRequirement;

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
