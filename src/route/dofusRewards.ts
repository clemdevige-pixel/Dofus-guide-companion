export interface DofusReward {
  stepId: string;
  name: string;
  image: string;
  tier: 'major' | 'standard';
}

/** Presentation only: no new route cards, no route or persistence schema changes. */
export const dofusRewards: Record<string, DofusReward> = {
  'route-step-0093': { stepId: 'route-step-0093', name: 'Dofus Argenté', image: '/dofus/argente.png', tier: 'major' },
  'route-step-0321': { stepId: 'route-step-0321', name: 'Dofus Émeraude', image: '/dofus/emeraude.png', tier: 'major' },
  'route-step-0440': { stepId: 'route-step-0440', name: 'Dofus Pourpre', image: '/dofus/pourpre.png', tier: 'major' },
  'route-step-0286': { stepId: 'route-step-0286', name: 'Domakuro', image: '/dofus/domakuro.png', tier: 'major' },
  'route-step-0512': { stepId: 'route-step-0512', name: 'Dorigami', image: '/dofus/dorigami.png', tier: 'major' },
  'route-step-0580': { stepId: 'route-step-0580', name: 'Dofus Turquoise', image: '/dofus/turquoise.png', tier: 'major' },
  'route-step-audit-dofus-glaces': { stepId: 'route-step-audit-dofus-glaces', name: 'Dofus des Glaces', image: '/dofus/glaces.png', tier: 'major' },
  'route-step-0890': { stepId: 'route-step-0890', name: 'Dofus Ocre', image: '/dofus/ocre.png', tier: 'major' },
  'route-step-0846': { stepId: 'route-step-0846', name: 'Dofus Ivoire', image: '/dofus/ivoire.png', tier: 'major' },
  'route-step-0703': { stepId: 'route-step-0703', name: 'Dofus Tacheté', image: '/dofus/tachete.png', tier: 'major' },
  'route-step-0886': { stepId: 'route-step-0886', name: 'Dofus Ébène', image: '/dofus/ebene.png', tier: 'major' },
  'route-step-0919': { stepId: 'route-step-0919', name: 'Dofus Argenté Scintillant', image: '/dofus/argente-scintillant.png', tier: 'standard' },
  'route-step-0999': { stepId: 'route-step-0999', name: 'Dofus Sylvestre', image: '/dofus/sylvestre.png', tier: 'major' },
};

export function getNewDofusReward(stepIds: readonly string[], completedBefore: ReadonlySet<string>) {
  return stepIds
    .filter((id) => !completedBefore.has(id))
    .map((id) => dofusRewards[id])
    .find((reward): reward is DofusReward => Boolean(reward));
}
