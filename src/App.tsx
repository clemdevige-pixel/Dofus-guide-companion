import { useEffect, useMemo, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { loadProgress, saveProgress } from './progress/storage';
import { loadBundledRoute } from './route/loader';
import {
  getActiveLongRunningGoals,
  getFirstIncompleteStep,
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
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const isCurrentCompleted = currentStep ? completedStepIds.has(currentStep.id) : false;

  function goPrevious() {
    setViewIndex((index) => Math.max(0, index - 1));
  }

  function goNext() {
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

    if (!isCurrentCompleted && viewIndex < steps.length - 1) {
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

  function openSettings() {
    setDrawerOpen(false);
    setSettingsOpen(true);
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
          <button type="button" onClick={openSettings}>Paramètres</button>
        </nav>
      )}

      {settingsOpen && !compact && (
        <section className="settings-panel" aria-labelledby="settings-title">
          <div className="settings-header">
            <div>
              <p className="eyebrow" id="settings-title">Paramètres</p>
              <p className="settings-help">Raccourcis globaux Tauri, persistés localement.</p>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Fermer les paramètres"
              onClick={() => setSettingsOpen(false)}
            >
              ×
            </button>
          </div>

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
