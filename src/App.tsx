import { useEffect, useMemo, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { loadProgress, saveProgress } from './progress/storage';
import { loadBundledRoute } from './route/loader';
import {
  getActiveLongRunningGoals,
  getBlockPreparationSteps,
  getCompletedSteps,
  getFirstIncompleteStep,
  getHardLockForGoal,
  getNextHardLock,
  getProgress,
  getSortedSteps,
  getStepIndex,
} from './route/selectors';
import type { StepType } from './route/types';
import { loadShortcutBindings, saveShortcutBindings } from './shortcuts/storage';
import {
  defaultShortcutBindings,
  shortcutLabels,
  type ShortcutAction,
  type ShortcutBindings,
} from './shortcuts/types';
import { useGlobalShortcuts } from './shortcuts/useGlobalShortcuts';
import { restoreAndPersistWindowGeometry } from './window/persistence';

const route = loadBundledRoute();
const shortcutActions = Object.keys(defaultShortcutBindings) as ShortcutAction[];

type SecondaryView =
  | 'progress'
  | 'goals'
  | 'lock'
  | 'preparation'
  | 'history'
  | 'settings'
  | null;

const typeLabels: Record<StepType, string> = {
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
  const initialShortcuts = useMemo(() => loadShortcutBindings(), []);
  const steps = useMemo(() => getSortedSteps(route), []);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(
    () => new Set(initialProgress.completedStepIds),
  );
  const [compact, setCompact] = useState(initialProgress.compact);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [secondaryView, setSecondaryView] = useState<SecondaryView>(null);
  const [shortcutBindings, setShortcutBindings] = useState<ShortcutBindings>(initialShortcuts);
  const [viewIndex, setViewIndex] = useState(() => {
    if (initialProgress.currentStepId) {
      const savedIndex = getStepIndex(route, initialProgress.currentStepId);
      if (savedIndex >= 0) {
        return savedIndex;
      }
    }

    const firstIncomplete = getFirstIncompleteStep(
      route,
      new Set(initialProgress.completedStepIds),
    );
    return firstIncomplete ? Math.max(0, getStepIndex(route, firstIncomplete.id)) : 0;
  });

  useEffect(() => {
    saveProgress({
      completedStepIds: [...completedStepIds],
      compact,
      ...(steps[viewIndex] ? { currentStepId: steps[viewIndex].id } : {}),
    });
  }, [completedStepIds, compact, steps, viewIndex]);

  useEffect(() => {
    saveShortcutBindings(shortcutBindings);
  }, [shortcutBindings]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    void restoreAndPersistWindowGeometry()
      .then((unlisten) => {
        if (disposed) {
          unlisten();
        } else {
          cleanup = unlisten;
        }
      })
      .catch((error: unknown) => {
        console.error('Impossible de restaurer la géométrie de la fenêtre.', error);
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  const currentStep = steps[viewIndex];
  const progress = getProgress(route, completedStepIds);
  const activeGoals = getActiveLongRunningGoals(route, completedStepIds);
  const nextHardLock = getNextHardLock(route, completedStepIds);
  const completedHistory = getCompletedSteps(route, completedStepIds);
  const isCurrentCompleted = currentStep ? completedStepIds.has(currentStep.id) : false;
  const currentBlock = currentStep
    ? route.blocks.find((block) => block.id === currentStep.blockId)
    : undefined;
  const blockPreparations = currentStep
    ? getBlockPreparationSteps(route, currentStep.blockId)
    : [];
  const currentGoalLock = currentStep?.longRunningGoal
    ? getHardLockForGoal(route, currentStep.longRunningGoal.goalId)
    : undefined;

  function goPrevious() {
    setSecondaryView(null);
    setViewIndex((index) => Math.max(0, index - 1));
  }

  function goNext() {
    setSecondaryView(null);
    setViewIndex((index) => Math.min(steps.length - 1, index + 1));
  }

  function toggleCurrentStep() {
    if (!currentStep) {
      return;
    }

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

    if (
      !isCurrentCompleted &&
      currentStep.type !== 'hard_lock' &&
      viewIndex < steps.length - 1
    ) {
      setViewIndex((index) => index + 1);
    }
  }

  async function toggleOverlayVisibility() {
    const window = getCurrentWindow();
    if (await window.isVisible()) {
      await window.hide();
    } else {
      await window.show();
    }
  }

  const shortcutError = useGlobalShortcuts(shortcutBindings, {
    previous: goPrevious,
    next: goNext,
    toggleComplete: toggleCurrentStep,
    toggleVisibility: toggleOverlayVisibility,
  });

  if (!currentStep) {
    return <main className="overlay">Aucune étape disponible.</main>;
  }

  const typeLabel = currentStep.displayType ?? typeLabels[currentStep.type];
  const displayIndex = viewIndex + 1;

  function updateShortcut(action: ShortcutAction, value: string) {
    setShortcutBindings((current) => ({ ...current, [action]: value }));
  }

  function openSecondaryView(view: Exclude<SecondaryView, null>) {
    setDrawerOpen(false);
    setSecondaryView(view);
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
            {currentBlock && <p className="block-label">{currentBlock.title}</p>}
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Basculer le mode compact"
            onClick={() => {
              setDrawerOpen(false);
              setSecondaryView(null);
              setCompact(true);
            }}
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
          <button type="button" onClick={() => openSecondaryView('progress')}>Progression</button>
          <button type="button" onClick={() => openSecondaryView('goals')}>Fils rouges</button>
          <button type="button" onClick={() => openSecondaryView('lock')}>Prochain verrou</button>
          <button type="button" onClick={() => openSecondaryView('preparation')}>Prépa du bloc</button>
          <button type="button" onClick={() => openSecondaryView('history')}>Historique</button>
          <button type="button" onClick={() => openSecondaryView('settings')}>Paramètres</button>
        </nav>
      )}

      {secondaryView && !compact && (
        <section className="context-panel" aria-label="Vue secondaire">
          <div className="context-panel__header">
            <p className="eyebrow">
              {secondaryView === 'progress' && 'Progression'}
              {secondaryView === 'goals' && 'Fils rouges'}
              {secondaryView === 'lock' && 'Prochain verrou'}
              {secondaryView === 'preparation' && 'Prépa du bloc'}
              {secondaryView === 'history' && 'Historique'}
              {secondaryView === 'settings' && 'Paramètres'}
            </p>
            <button
              className="icon-button"
              type="button"
              aria-label="Fermer la vue secondaire"
              onClick={() => setSecondaryView(null)}
            >
              ×
            </button>
          </div>

          {secondaryView === 'progress' && (
            <div className="context-panel__body">
              <p>{progress.completed} / {progress.total} étapes validées · {progress.percentage}%</p>
              {currentBlock && <p>Bloc courant : {currentBlock.title}</p>}
            </div>
          )}

          {secondaryView === 'goals' && (
            <div className="context-panel__body">
              {activeGoals.length === 0 ? (
                <p>Aucun fil rouge actif.</p>
              ) : (
                <ul>
                  {activeGoals.map((goal) => <li key={goal.id}>{goal.title}</li>)}
                </ul>
              )}
            </div>
          )}

          {secondaryView === 'lock' && (
            <div className="context-panel__body">
              {nextHardLock ? (
                <>
                  <strong>{nextHardLock.title}</strong>
                  <p>{nextHardLock.hardLock?.message ?? nextHardLock.instruction}</p>
                </>
              ) : (
                <p>Aucun verrou dur restant.</p>
              )}
            </div>
          )}

          {secondaryView === 'preparation' && (
            <div className="context-panel__body">
              {blockPreparations.length === 0 ? (
                <p>Aucune préparation structurée dans ce bloc.</p>
              ) : (
                blockPreparations.map((preparation) => (
                  <div className="preparation-group" key={preparation.id}>
                    <strong>{preparation.title}</strong>
                    {preparation.preparationItems && preparation.preparationItems.length > 0 ? (
                      <ul>
                        {preparation.preparationItems.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ) : preparation.instruction ? (
                      <p>{preparation.instruction}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          )}

          {secondaryView === 'history' && (
            <div className="context-panel__body">
              {completedHistory.length === 0 ? (
                <p>Aucune étape validée.</p>
              ) : (
                <ol className="history-list">
                  {completedHistory.slice(0, 30).map((step) => (
                    <li key={step.id}>{step.title}</li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {secondaryView === 'settings' && (
            <>
              <p className="settings-help">Raccourcis globaux Tauri, persistés localement.</p>
              <div className="shortcut-list">
                {shortcutActions.map((action) => (
                  <label className="shortcut-field" key={action}>
                    <span>{shortcutLabels[action]}</span>
                    <input
                      type="text"
                      value={shortcutBindings[action]}
                      onChange={(event) => updateShortcut(action, event.target.value)}
                      spellCheck={false}
                    />
                  </label>
                ))}
              </div>
              {shortcutError && <p className="settings-error">⚠ {shortcutError}</p>}
              <div className="settings-actions">
                <button
                  type="button"
                  onClick={() => setShortcutBindings({ ...defaultShortcutBindings })}
                >
                  Raccourcis par défaut
                </button>
              </div>
            </>
          )}
        </section>
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

        {currentStep.type === 'preparation' && currentStep.preparationItems && (
          <ul className="preparation-list">
            {currentStep.preparationItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}

        {currentStep.type === 'long_running' && (
          <div className="step-context step-context--goal">
            <strong>Pas besoin de finir maintenant.</strong>
            {currentGoalLock && <span>Verrou associé : {currentGoalLock.title}</span>}
          </div>
        )}

        {currentStep.type === 'hard_lock' && (
          <div className="step-context step-context--lock">
            <strong>STOP — ne valide ce verrou que lorsque la condition est remplie.</strong>
            <span>{currentStep.hardLock?.message ?? currentStep.instruction}</span>
          </div>
        )}
      </section>

      {!compact && secondaryView === null && activeGoals.length > 0 && (
        <section className="secondary-panel secondary-panel--goal">
          <h2>⚠ Fils rouges actifs</h2>
          <ul>
            {activeGoals.map((goal) => (
              <li key={goal.id}>{goal.title}</li>
            ))}
          </ul>
        </section>
      )}

      {!compact && secondaryView === null && nextHardLock && (
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
