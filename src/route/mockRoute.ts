import type { RouteDocument } from './types';

export const mockRoute: RouteDocument = {
  schemaVersion: 1,
  routeVersion: 'mock-2026-09-03',
  title: 'Astrub → Dofus Sylvestre',
  blocks: [
    {
      id: 'block-03',
      order: 3,
      title: 'Bonta 1→12 + donjons bas niveau',
      shortTitle: 'Bonta + donjons',
    },
  ],
  steps: [
    {
      id: 'mock-quest-before',
      order: 127,
      blockId: 'block-03',
      type: 'quest',
      title: 'Un juge hystérique',
      action: 'TERMINER',
      instruction: 'Termine la quête avant de poursuivre.',
      source: {
        label: 'DPLN',
        url: 'https://www.dofuspourlesnoobs.com/',
      },
    },
    {
      id: 'mock-current-step',
      order: 128,
      blockId: 'block-03',
      type: 'quest',
      title: 'La raison du plus fort',
      action: 'AVANCER / STOP',
      instruction: "Avance jusqu'au Directeur Grunob puis STOP avant l'Akadémie des Gobs.",
      source: {
        label: 'DPLN',
        url: 'https://www.dofuspourlesnoobs.com/',
      },
    },
    {
      id: 'mock-long-running',
      order: 129,
      blockId: 'block-03',
      type: 'long_running',
      title: "L'Éternelle moisson",
      action: 'FIL ROUGE',
      instruction: 'Capture les objectifs utiles au fil de la route. Pas besoin de finir maintenant.',
      longRunningGoal: {
        goalId: 'eternelle-moisson',
        phase: 'start',
      },
    },
    {
      id: 'mock-next-quest',
      order: 130,
      blockId: 'block-03',
      type: 'quest',
      title: 'Maya la belle',
      action: 'TERMINER',
      instruction: 'Termine la quête.',
      source: {
        label: 'DPLN',
        url: 'https://www.dofuspourlesnoobs.com/',
      },
    },
    {
      id: 'mock-hard-lock',
      order: 131,
      blockId: 'block-03',
      type: 'hard_lock',
      title: 'Ocre — étapes 1 à 18',
      action: 'VERROU DUR',
      instruction: 'Tu dois avoir terminé les étapes 1 à 18 avant de continuer.',
      hardLock: {
        goalId: 'eternelle-moisson',
        message: 'Terminer les étapes 1 à 18 avant de continuer.',
      },
    },
  ],
};
