import { useEffect, useMemo, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { openUrl } from '@tauri-apps/plugin-opener';
import { loadProgress, saveProgress } from './progress/storage';
import { loadBundledRoute } from './route/loader';
import {
  getActiveLongRunningGoals,
  getActiveParallelGroups,
  getBlockPreparationSteps,
  getCompletedSteps,
  getFirstIncompleteStep,
  getHardLockForGoal,
  getNextHardLock,
  getProgress,
  getSequenceObjectives,
  getStepGroupIndex,
  getStepGroups,
} from './route/selectors';
import type { GuideItem, GuideItemAction, RouteStep, StepType } from './route/types';
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

const guideActionLabels: Record<GuideItemAction, string> = {
  take: 'Vous devez maintenant prendre :',
  advance: 'Vous devez maintenant avancer :',
  finish: 'Vous devez maintenant terminer :',
  do: 'Vous devez maintenant faire :',
};

function getResourceName(item: string): string {
  return item.replace(/^\d+\s*[×x]\s*/i, '').trim();
}

function groupGuideItems(items: GuideItem[]) {
  const groups: Array<{ action: GuideItemAction; items: GuideItem[] }> = [];

  for (const item of items) {
    const currentGroup = groups.at(-1);
    if (currentGroup?.action === item.action) {
      currentGroup.items.push(item);
    } else {
      groups.push({ action: item.action, items: [item] });
    }
  }

  return groups;
}

function getSequenceTitle(steps: RouteStep[]): string {
  return steps.some((step) => step.type === 'dungeon')
    ? 'Enchaînement de quêtes et donjons'
    : 'Enchaînement de quêtes';
}

function getSequenceCoordinate(step: RouteStep) {
  return step.destination ?? step.location;
}

function getObjectiveDisplayStep(steps: RouteStep[]): RouteStep {
  return steps[0];
}

function getParallelGroupLabel(steps: RouteStep[]): string {
  return [...new Set(steps.map((step) => step.title))].join(' + ');
}

export function App() {
  const initialProgress = useMemo(() => loadProgress(), []);
  const initialShortcuts = useMemo(() => loadShortcutBindings(), []);
  const stepGroups = useMemo(() => getStepGroups(route), []);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(
    () => new Set(initialProgress.completedStepIds),
  );
  const [compact, setCompact] = useState(initialProgress.compact);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [secondaryView, setSecondaryView] = useState<SecondaryView>(null);
  const [shortcutBindings, setShortcutBindings] = useState<ShortcutBindings>(initialShortcuts);
  const [viewIndex, setViewIndex] = useState(() => {
    if (initialProgress.currentStepId) {
      const savedIndex = getStepGroupIndex(route, initialProgress.currentStepId);
      if (savedIndex >= 0) {
        return savedIndex;
      }
    }

    const firstIncomplete = getFirstIncompleteStep(
      route,
      new Set(initialProgress.completedStepIds),
    );
    return firstIncomplete ? Math.max(0, getStepGroupIndex(route, firstIncomplete.id)) : 0;
  });

  const [cardJumpValue, setCardJumpValue] = useState(() => String(viewIndex + 1));

  useEffect(() => {
    setCardJumpValue(String(viewIndex + 1));
  }, [viewIndex]);

  const currentGroup = stepGroups[viewIndex];
  const currentStep = currentGroup
    ? currentGroup.steps.find((step) => !completedStepIds.has(step.id)) ?? currentGroup.steps[0]
    : undefined;
  const sequenceObjectives = useMemo(
    () => (currentGroup?.isSequence ? getSequenceObjectives(currentGroup.steps) : []),
    [currentGroup],
  );

  useEffect(() => {
    const savedStep = currentGroup
      ? currentGroup.steps.find((step) => !completedStepIds.has(step.id)) ?? currentGroup.steps[0]
      : undefined;

    saveProgress({
      completedStepIds: [...completedStepIds],
      compact,
      ...(savedStep ? { currentStepId: savedStep.id } : {}),
    });
  }, [completedStepIds, compact, currentGroup]);

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

  const progress = getProgress(route, completedStepIds);
  const activeGoals = getActiveLongRunningGoals(route, completedStepIds);
  const activeParallelGroups = getActiveParallelGroups(route, completedStepIds);
  const nextHardLock = getNextHardLock(route, completedStepIds);
  const completedHistory = getCompletedSteps(route, completedStepIds);
  const isCurrentCompleted = currentGroup
    ? currentGroup.steps.every((step) => completedStepIds.has(step.id))
    : false;
  const currentBlock = currentGroup
    ? route.blocks.find((block) => block.id === currentGroup.blockId)
    : undefined;
  const blockPreparations = currentGroup
    ? getBlockPreparationSteps(route, currentGroup.blockId)
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
    setViewIndex((index) => Math.min(stepGroups.length - 1, index + 1));
  }

  function jumpToCard() {
    const requestedCard = Number.parseInt(cardJumpValue, 10);
    if (!Number.isFinite(requestedCard)) {
      setCardJumpValue(String(viewIndex + 1));
      return;
    }

    const targetCard = Math.min(stepGroups.length, Math.max(1, requestedCard));
    setDrawerOpen(false);
    setSecondaryView(null);
    setViewIndex(targetCard - 1);
    setCardJumpValue(String(targetCard));
  }

  function toggleCurrentStep() {
    if (!currentGroup || !currentStep) {
      return;
    }

    const shouldComplete = !isCurrentCompleted;
    setCompletedStepIds((previous) => {
      const next = new Set(previous);
      for (const step of currentGroup.steps) {
        if (shouldComplete) {
          next.add(step.id);
        } else {
          next.delete(step.id);
        }
      }
      return next;
    });

    const containsHardLock = currentGroup.steps.some((step) => step.type === 'hard_lock');
    if (shouldComplete && !containsHardLock && viewIndex < stepGroups.length - 1) {
      setViewIndex((index) => index + 1);
    }
  }

  function toggleSequenceObjective(stepIds: string[]) {
    if (!currentGroup) {
      return;
    }

    const containsHardLock = currentGroup.steps.some(
      (step) => stepIds.includes(step.id) && step.type === 'hard_lock',
    );

    setCompletedStepIds((previous) => {
      const next = new Set(previous);
      const wasCompleted = stepIds.every((stepId) => next.has(stepId));

      for (const stepId of stepIds) {
        if (wasCompleted) {
          next.delete(stepId);
        } else {
          next.add(stepId);
        }
      }

      const completesSequence =
        !wasCompleted && currentGroup.steps.every((step) => next.has(step.id));
      if (completesSequence && !containsHardLock && viewIndex < stepGroups.length - 1) {
        setViewIndex((index) => index + 1);
      }

      return next;
    });
  }

  async function copyToClipboard(text: string) {
    try {
      await writeText(text);
    } catch (error: unknown) {
      console.error('Impossible de copier dans le presse-papier.', error);
    }
  }

  async function openExternalSource(url: string) {
    try {
      await openUrl(url);
    } catch (error: unknown) {
      console.error("Impossible d'ouvrir le lien externe.", error);
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

  if (!currentStep || !currentGroup) {
    return <main className="overlay">Aucune étape disponible.</main>;
  }

  const isSequence = currentGroup.isSequence;
  const containsHardLock = currentGroup.steps.some((step) => step.type === 'hard_lock');
  const typeLabel = containsHardLock
    ? 'VERROU DUR'
    : isSequence
      ? 'SÉQUENCE'
      : currentStep.displayType ?? typeLabels[currentStep.type];
  const displayIndex = viewIndex + 1;
  const travelTarget = currentStep.destination ?? currentStep.location;
  const travelLabel = currentStep.destination ? 'Destination' : 'Lancement';
  const hasGuideItems = Boolean(currentStep.guideItems?.length);
  const guideGroups = currentStep.guideItems ? groupGuideItems(currentStep.guideItems) : [];
  const hasDistinctLaunchLocation =
    currentStep.location &&
    currentStep.destination &&
    (currentStep.location.x !== currentStep.destination.x ||
      currentStep.location.y !== currentStep.destination.y);

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
            <form
              className="card-jump"
              onSubmit={(event) => {
                event.preventDefault();
                jumpToCard();
              }}
            >
              <span>Carte</span>
              <input
                type="number"
                min={1}
                max={stepGroups.length}
                value={cardJumpValue}
                aria-label="Aller à la carte"
                onChange={(event) => setCardJumpValue(event.target.value)}
                onBlur={jumpToCard}
              />
              <span>/ {stepGroups.length} · {progress.percentage}%</span>
            </form>
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
            {displayIndex} / {stepGroups.length} · {typeLabel}
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

      {currentBlock && (
        <div className="block-banner">
          <span>Bloc {currentBlock.order} / {route.blocks.length}</span>
          <strong>{currentBlock.title}</strong>
        </div>
      )}

      {drawerOpen && !compact && (
        <nav className="drawer" aria-label="Navigation secondaire">
          <button type="button" onClick={() => openSecondaryView('progress')}>Progression</button>
          <button type="button" onClick={() => openSecondaryView('goals')}>Fils rouges</button>
          <button type="button" onClick={() => openSecondaryView('lock')}>Prochain verrou</button>
          <button type="button" onClick={() => openSecondaryView('preparation')}>Prépa du bloc</button>
          <button type="button" onClick={() => openSecondaryView('history')}>Étapes validées</button>
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
              {secondaryView === 'history' && 'Étapes validées'}
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
              <p>{stepGroups.length} cartes après mutualisation.</p>
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
                      <ul className="copy-list">
                        {preparation.preparationItems.map((item) => (
                          <li key={item}>
                            <button
                              className="copy-item-button"
                              type="button"
                              title={`Copier ${getResourceName(item)}`}
                              onClick={() => void copyToClipboard(getResourceName(item))}
                            >
                              <span>{item}</span>
                              <span aria-hidden="true">⧉</span>
                            </button>
                          </li>
                        ))}
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
        className={`current-step current-step--${containsHardLock ? 'hard_lock' : isSequence ? 'sequence' : currentStep.type}`}
        aria-labelledby="current-step-title"
      >
        {!compact && <span className="type-badge">{typeLabel}</span>}

        {activeParallelGroups.length > 0 && (
          <section className="step-context step-context--goal" aria-label="Quêtes en parallèle">
            <strong>QUÊTES EN PARALLÈLE — garde-les actives</strong>
            {activeParallelGroups.map((group) => (
              <span key={group.parallelId}>{getParallelGroupLabel(group.members)}</span>
            ))}
          </section>
        )}

        {isSequence ? (
          <>
            <div className="step-title-row">
              <h1 id="current-step-title">
                {containsHardLock ? 'Verrou de progression' : getSequenceTitle(currentGroup.steps)}
              </h1>
            </div>
            <p className="action-label">
              {containsHardLock
                ? 'STOP — ne poursuis pas tant que la condition du verrou n’est pas remplie.'
                : `${sequenceObjectives.length} objectifs à enchaîner`}
            </p>

            <ol className="sequence-list">
              {sequenceObjectives.map((objective) => {
                const displayStep = getObjectiveDisplayStep(objective.steps);
                const completed = objective.steps.every((step) => completedStepIds.has(step.id));
                const stepIds = objective.steps.map((step) => step.id);

                return (
                  <li
                    className={completed ? 'sequence-item sequence-item--completed' : 'sequence-item'}
                    key={objective.id}
                  >
                    <button
                      className="sequence-checkbox"
                      type="button"
                      aria-label={completed ? `Décocher ${displayStep.title}` : `Cocher ${displayStep.title}`}
                      aria-pressed={completed}
                      onClick={() => toggleSequenceObjective(stepIds)}
                    >
                      {completed ? '✓' : ''}
                    </button>
                    <div className="sequence-item__content">
                      <div className="sequence-item__header">
                        <strong>{displayStep.title}</strong>
                        {displayStep.source && (
                          <button
                            className="source-link-button"
                            type="button"
                            title={`Ouvrir ${displayStep.source.label}`}
                            onClick={() => void openExternalSource(displayStep.source!.url)}
                          >
                            ↗
                          </button>
                        )}
                      </div>

                      {objective.steps.map((step) => {
                        const coordinate = getSequenceCoordinate(step);
                        return (
                          <div className="sequence-item__detail" key={step.id}>
                            <div className="sequence-item__header">
                              <div>
                                {step.action && <span className="sequence-item__action">{step.action}</span>}
                                {step !== displayStep && step.type === 'dungeon' && <strong>{step.title}</strong>}
                              </div>
                              <div className="sequence-item__tools">
                                {coordinate && (
                                  <button
                                    className="guide-location-button"
                                    type="button"
                                    title={`Copier /travel ${coordinate.x} ${coordinate.y}`}
                                    onClick={() => void copyToClipboard(`/travel ${coordinate.x} ${coordinate.y}`)}
                                  >
                                    [{coordinate.x},{coordinate.y}] · ⧉
                                  </button>
                                )}
                                {step.source && step.source.url !== displayStep.source?.url && (
                                  <button
                                    className="source-link-button"
                                    type="button"
                                    title={`Ouvrir ${step.source.label}`}
                                    onClick={() => void openExternalSource(step.source!.url)}
                                  >
                                    ↗
                                  </button>
                                )}
                              </div>
                            </div>
                            {step.launchInstruction && !step.location && (
                              <span className="sequence-item__note">{step.launchInstruction}</span>
                            )}
                            {step.instruction && (
                              <span className="sequence-item__note">{step.instruction}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <>
            <div className="step-title-row">
              <h1 id="current-step-title">{currentStep.title}</h1>
              {currentStep.source && (
                <button
                  className="source-link-button"
                  type="button"
                  onClick={() => void openExternalSource(currentStep.source!.url)}
                >
                  ↗{compact ? '' : ` ${currentStep.source.label}`}
                </button>
              )}
            </div>

            {currentStep.action && <p className="action-label">{currentStep.action}</p>}

            {guideGroups.length > 0 && (
              <div className="guide-items">
                {guideGroups.map((group, groupIndex) => (
                  <div className="guide-items__group" key={`${group.action}-${groupIndex}`}>
                    <p className="guide-items__heading">{guideActionLabels[group.action]}</p>
                    <ul className="guide-items__list">
                      {group.items.map((item, itemIndex) => (
                        <li key={`${item.label}-${itemIndex}`}>
                          <div className="guide-items__row">
                            <strong>{item.label}</strong>
                            {item.location && (
                              <button
                                className="guide-location-button"
                                type="button"
                                title={`Copier /travel ${item.location.x} ${item.location.y}`}
                                onClick={() =>
                                  void copyToClipboard(`/travel ${item.location!.x} ${item.location!.y}`)
                                }
                              >
                                [{item.location.x},{item.location.y}] · ⧉
                              </button>
                            )}
                          </div>
                          {item.note && <span className="guide-items__note">{item.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {travelTarget && !hasGuideItems && (
              <button
                className="travel-button"
                type="button"
                title={`Copier /travel vers la ${travelLabel.toLowerCase()}`}
                onClick={() => void copyToClipboard(`/travel ${travelTarget.x} ${travelTarget.y}`)}
              >
                <span>{travelLabel} [{travelTarget.x},{travelTarget.y}]</span>
                <span>/travel · ⧉</span>
              </button>
            )}

            {hasDistinctLaunchLocation && currentStep.location && !hasGuideItems && (
              <div className="step-context step-context--launch">
                <strong>Lancement de la quête</strong>
                <span>[{currentStep.location.x},{currentStep.location.y}]</span>
              </div>
            )}

            {!currentStep.location && currentStep.launchInstruction && (
              <div className="step-context step-context--launch">
                <strong>Lancement</strong>
                <span>{currentStep.launchInstruction}</span>
              </div>
            )}

            {currentStep.instruction && <p className="instruction">{currentStep.instruction}</p>}

            {currentStep.type === 'preparation' && currentStep.preparationItems && (
              <ul className="preparation-list copy-list">
                {currentStep.preparationItems.map((item) => (
                  <li key={item}>
                    <button
                      className="copy-item-button"
                      type="button"
                      title={`Copier ${getResourceName(item)}`}
                      onClick={() => void copyToClipboard(getResourceName(item))}
                    >
                      <span>{item}</span>
                      <span aria-hidden="true">⧉</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {currentStep.longRunningGoal && currentStep.longRunningGoal.phase !== 'finish' && (
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
          </>
        )}
      </section>

      <footer className="navigation-bar">
        <button type="button" aria-label="Carte précédente" onClick={goPrevious} disabled={viewIndex === 0}>
          ←
        </button>
        <button className="complete-button" type="button" onClick={toggleCurrentStep}>
          {isCurrentCompleted ? '↶' : '✓'} {compact ? '' : isCurrentCompleted ? 'DÉVALIDER' : containsHardLock ? 'VALIDER LE VERROU' : isSequence ? 'TOUT COCHER' : 'TERMINÉ'}
        </button>
        <button
          type="button"
          aria-label="Carte suivante"
          onClick={goNext}
          disabled={viewIndex === stepGroups.length - 1}
        >
          →
        </button>
      </footer>
    </main>
  );
}
