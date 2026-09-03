import { useState } from 'react';
import type { RouteStep } from './route/types';

const currentStep: RouteStep = {
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
};

const activeGoals = ["L'Éternelle moisson", 'Alignement + Ordres'];

export function App() {
  const [compact, setCompact] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className={`overlay ${compact ? 'overlay--compact' : ''}`}>
      {!compact && (
        <header className="app-header">
          <button
            className="icon-button"
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            ☰
          </button>
          <div>
            <p className="eyebrow">Dofus Guide Companion</p>
            <p className="progress-label">Étape 128 / 978 · 13%</p>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Basculer le mode compact"
            onClick={() => setCompact(true)}
          >
            −
          </button>
        </header>
      )}

      {compact && (
        <div className="compact-header">
          <span>128 / 978 · QUÊTE</span>
          <button
            className="icon-button"
            type="button"
            aria-label="Afficher le mode détaillé"
            onClick={() => setCompact(false)}
          >
            +
          </button>
        </div>
      )}

      {drawerOpen && !compact && (
        <nav className="drawer" aria-label="Navigation secondaire">
          <button type="button">Progression</button>
          <button type="button">Fils rouges</button>
          <button type="button">Prochain verrou</button>
          <button type="button">Prépa du bloc</button>
          <button type="button">Historique</button>
          <button type="button">Paramètres</button>
        </nav>
      )}

      <section className="current-step" aria-labelledby="current-step-title">
        {!compact && <span className="type-badge">QUÊTE</span>}

        <div className="step-title-row">
          <h1 id="current-step-title">{currentStep.title}</h1>
          <a href={currentStep.source?.url} target="_blank" rel="noreferrer">
            ↗{compact ? '' : ` ${currentStep.source?.label}`}
          </a>
        </div>

        <p className="action-label">{currentStep.action}</p>
        <p className="instruction">{currentStep.instruction}</p>
      </section>

      {!compact && (
        <section className="secondary-panel secondary-panel--goal">
          <h2>⚠ Fils rouges actifs</h2>
          <ul>
            {activeGoals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </section>
      )}

      {!compact && (
        <section className="secondary-panel secondary-panel--lock">
          <h2>🔒 Prochain verrou dur</h2>
          <p>Niveau 80</p>
        </section>
      )}

      <footer className="navigation-bar">
        <button type="button" aria-label="Étape précédente">←</button>
        <button className="complete-button" type="button">✓ {compact ? '' : 'TERMINÉ'}</button>
        <button type="button" aria-label="Étape suivante">→</button>
      </footer>
    </main>
  );
}
