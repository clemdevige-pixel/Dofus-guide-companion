import { useEffect, useMemo, useState } from 'react';
import { loadProgress, saveProgress } from './progress/storage';
import { mockRoute } from './route/mockRoute';
import {
  getActiveLongRunningGoals,
  getFirstIncompleteStep,
  getNextHardLock,
  getProgress,
  getSortedSteps,
  getStepIndex,
} from './route/selectors';

const typeLabels: Record<string, string> = {
  quest: 'QUÊTE',
  resume: 'REPRISE',
  dungeon: 'DONJON',
  preparation: 'PRÉPA',
  rule: 'RÈGLE',
  milestone: 'JALON',
  long_running: 'FIL ROUGE',
  hard_lock: 'VERROU DUR',
  alignment: 'ALIGNEMENT',
  order: 'ORDRE',
  major_step: 'GROSSE ÉTAPE',
  finish: 'FIN',
};

export function App() {
  const initialProgress = useMemo(() => loadProgress(), []);
  const steps = useMemo(() => getSortedSteps(mockRoute), []);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(
    () => new Set(initialProgress.completedStepIds),
  );
  const [compact, setCompact] = useState(initialProgress.compact);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState(() => {
    const firstIncomplete = getFirstIncompleteStep(
      mockRoute,
      new Set(initialProgress.completedStepIds),
    );
    return firstIncomplete ? Math.max(0, getStepIndex(mockRoute, firstIncomplete.id)) : 0;
  });

  useEffect(() => {
    saveProgress({
      completedStepIds: [...completedStepIds],
      compact,
    });
  }, [completedStepIds, compact]);

  const currentStep = steps[viewIndex];
  const progress = getProgress(mockRoute, completedStepIds);
  const activeGoals = getActiveLongRunningGoals(mockRoute, completedStepIds);
  const nextHardLock = getNextHardLock(mockRoute, completedStepIds);
  const isCurrentCompleted = currentStep ? completedStepIds.has(currentStep.id) : false;

  if (!currentStep) {
    return <main className="overlay">Aucune étape disponible.</main>;
  }

  const typeLabel = typeLabels[currentStep.type] ?? currentStep.type;
  const displayIndex = viewIndex + 1;

  function goPrevious() {
    setViewIndex((index) => Math.max(0, index - 1));
  }

  function goNext() {
    setViewIndex((index) => Math.min(steps.length - 1, index + 1));
  }

  function toggleCurrentStep() {
    setCompletedStepIds((previous) => {
      const next = new Set(previous);
      const wasCompleted = next.has(currentStep.id);

      if (wasCompleted) {
        next.delete(currentStep.id);
      } else {
        next.add(currentStep.id);
      }

      return next;
    });

    if (!isCurrentCompleted && viewIndex < steps.length - 1) {
      setViewIndex((index) => index + 1);
    }
  }

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
            <p className="progress-label">
              Étape {displayIndex} / {steps.length} · {progress.percentage}%
            </p>
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
          <span>
            {displayIndex} / {steps.length} · {typeLabel}
          </span>
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

      <section
        className={`current-step current-step--${currentStep.type}`}
        aria-labelledby="current-step-title"
      >
        {!compact && <span className="type-badge">{typeLabel}</span>}

        <div className="step-title-row">
          <h1 id="current-step-title">{currentStep.title}</h1>
          {currentStep.source && (
            <a href={currentStep.source.url} target="_blank" rel="noreferrer">
              ↗{compact ? '' : ` ${currentStep.source.label}`}
            </a>
          )}
        </div>

        {currentStep.action && <p className="action-label">{currentStep.action}</p>}
        {currentStep.instruction && <p className="instruction">{currentStep.instruction}</p>}
      </section>

      {!compact && activeGoals.length > 0 && (
        <section className="secondary-panel secondary-panel--goal">
          <h2>⚠ Fils rouges actifs</h2>
          <ul>
            {activeGoals.map((goal) => (
              <li key={goal.id}>{goal.title}</li>
            ))}
          </ul>
        </section>
      )}

      {!compact && nextHardLock && (
        <section className="secondary-panel secondary-panel--lock">
          <h2>🔒 Prochain verrou dur</h2>
          <p>{nextHardLock.title}</p>
        </section>
      )}

      <footer className="navigation-bar">
        <button type="button" aria-label="Étape précédente" onClick={goPrevious} disabled={viewIndex === 0}>
          ←
        </button>
        <button className="complete-button" type="button" onClick={toggleCurrentStep}>
          {isCurrentCompleted ? '↶' : '✓'} {compact ? '' : isCurrentCompleted ? 'DÉVALIDER' : 'TERMINÉ'}
        </button>
        <button
          type="button"
          aria-label="Étape suivante"
          onClick={goNext}
          disabled={viewIndex === steps.length - 1}
        >
          →
        </button>
      </footer>
    </main>
  );
}
