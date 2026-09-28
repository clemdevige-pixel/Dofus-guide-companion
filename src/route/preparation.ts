import type { PreparationRequirementKind } from './types';

export const preparationRequirementLabels: Record<PreparationRequirementKind, string> = {
  kamas: 'KAMAS',
  profession: 'MÉTIER',
  party: 'GROUPE',
  class: 'CLASSE',
  requirement: 'PRÉREQUIS',
};

export function getPreparationItemKey(stepId: string, itemIndex: number): string {
  return `${stepId}:${itemIndex}`;
}
