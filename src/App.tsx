import { useEffect, useMemo, useRef, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { openUrl } from '@tauri-apps/plugin-opener';
import { PreparationChecklist } from './components/PreparationChecklist';
import { StepMarkers } from './components/StepMarkers';
import { parseProgressBackup, type ProgressState } from './progress/storage';
import { dofusClasses, getClassIcon } from './progress/classes';
import { dofusRewards } from './route/dofusRewards';
import { loadProfiles, saveProfiles, updateProfileProgress, emptyProgress, createProfile, renameProfile, deleteProfile, resetProfile, type ProfilesState } from './progress/profiles';
import { loadBundledRoute } from './route/loader';
import { getNewDofusReward, type DofusReward } from './route/dofusRewards';
import {
  getActiveParallelGroups,
  getFirstIncompleteStep,
  getHardLockForGoal,
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
import './progression.css';

const route = loadBundledRoute();
const shortcutActions = Object.keys(defaultShortcutBindings) as ShortcutAction[];

type SecondaryView = 'progress' | 'settings' | 'profiles' | null;

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
  take: 'PRENDRE',
  advance: 'AVANCER',
  finish: 'TERMINER',
  do: 'FAIRE',
};

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

function hasExpandableObjectiveDetails(steps: RouteStep[]): boolean {
  const displayStep = getObjectiveDisplayStep(steps);

  return steps.some((step) => {
    const hasDistinctSource = Boolean(step.source && step.source.url !== displayStep.source?.url);
    const hasDistinctStep = step !== displayStep;
    return Boolean(
      step.warning ||
      step.instruction ||
      (step.launchInstruction && !step.location) ||
      (hasDistinctStep && (step.type === 'dungeon' || hasDistinctSource || step.title !== displayStep.title)),
    );
  });
}

function getParallelGroupLabel(steps: RouteStep[]): string {
  return [...new Set(steps.map((step) => step.title))].join(' + ');
}

function getActionTone(action?: string): 'danger' | 'success' | 'start' | 'progress' | 'neutral' {
  const normalizedAction = action?.toUpperCase() ?? '';
  if (normalizedAction.includes('STOP')) return 'danger';
  if (normalizedAction.includes('TERMINER')) return 'success';
  if (normalizedAction.includes('LANCER')) return 'start';
  if (normalizedAction.includes('AVANCER') || normalizedAction.includes('REPRENDRE')) return 'progress';
  return 'neutral';
}

const dungeonExitWarningPrefix = '⚠ AVANT DE SORTIR DU DONJON —';

function getWarningLabel(warning: string): string {
  return warning.startsWith(dungeonExitWarningPrefix)
    ? '⚠ AVANT DE SORTIR DU DONJON'
    : '⚠ À SAVOIR';
}

function getWarningContent(warning: string): string {
  return warning.startsWith(dungeonExitWarningPrefix)
    ? warning.slice(dungeonExitWarningPrefix.length).trim()
    : warning;
}

export function App() {
  const initialProfiles = useMemo(() => loadProfiles(), []);
  const initialProgress = initialProfiles.profiles.find(p => p.id === initialProfiles.activeProfileId)!.progress;
  const profilesRef = useRef<ProfilesState>(initialProfiles);
  const [profiles, setProfiles] = useState<ProfilesState>(initialProfiles);
  const [profileName, setProfileName] = useState('');
  const [newClassId, setNewClassId] = useState<number | undefined>(undefined);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [duplicateNewProfile, setDuplicateNewProfile] = useState(false);
  const [profileMenuId, setProfileMenuId] = useState<string | null>(null);
  const [expandedDofusProfileId, setExpandedDofusProfileId] = useState<string | null>(null);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileConfirmation, setProfileConfirmation] = useState<{ kind: 'delete' | 'reset'; id: string } | null>(null);
  const initialShortcuts = useMemo(() => loadShortcutBindings(), []);
  const stepGroups = useMemo(() => getStepGroups(route), []);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(
    () => new Set(initialProgress.completedStepIds),
  );
  const [checkedPreparationItemIds, setCheckedPreparationItemIds] = useState<Set<string>>(
    () => new Set(initialProgress.checkedPreparationItemIds),
  );
  const [compact, setCompact] = useState(initialProgress.compact);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [secondaryView, setSecondaryView] = useState<SecondaryView>(null);
  const [selectedProgressBlockId, setSelectedProgressBlockId] = useState<string | null>(null);
  const [expandedSequenceObjectiveId, setExpandedSequenceObjectiveId] = useState<string | null>(null);
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
  const [reward, setReward] = useState<DofusReward | null>(null);
  const [rewardImageFailed, setRewardImageFailed] = useState(false);
  const [lastValidation, setLastValidation] = useState<{ completedIds: string[]; cardIndex: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

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
  const activeSequenceObjectiveId = useMemo(
    () =>
      sequenceObjectives.find(
        (objective) => !objective.steps.every((step) => completedStepIds.has(step.id)),
      )?.id ?? null,
    [sequenceObjectives, completedStepIds],
  );

  useEffect(() => {
    if (!currentGroup?.isSequence) {
      setExpandedSequenceObjectiveId(null);
      return;
    }

    const activeObjective = sequenceObjectives.find(
      (objective) => objective.id === activeSequenceObjectiveId,
    );
    setExpandedSequenceObjectiveId(
      activeObjective && hasExpandableObjectiveDetails(activeObjective.steps)
        ? activeObjective.id
        : null,
    );
  }, [currentGroup?.id, currentGroup?.isSequence, activeSequenceObjectiveId, sequenceObjectives]);

  useEffect(() => {
    try {
      const step = currentGroup?.steps.find(x => !completedStepIds.has(x.id)) ?? currentGroup?.steps[0];
      const snapshot: ProgressState = { completedStepIds: [...completedStepIds],
        checkedPreparationItemIds: [...checkedPreparationItemIds], compact,
        ...(step ? { currentStepId: step.id } : {}), routeVersion: route.routeVersion };
      const updated = updateProfileProgress(profilesRef.current, profilesRef.current.activeProfileId, snapshot);
      saveProfiles(updated); profilesRef.current = updated;
      setSaveError(null);
    } catch (error) {
      console.error('Sauvegarde de profil impossible.', error);
      setSaveError('Sauvegarde locale impossible. Exporte ta progression depuis Paramètres.');
    }
  }, [completedStepIds, checkedPreparationItemIds, compact, currentGroup, profiles.activeProfileId]);

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
  const activeParallelGroups = getActiveParallelGroups(
    route,
    completedStepIds,
    currentGroup?.steps ?? [],
  );
  const isCurrentCompleted = currentGroup
    ? currentGroup.steps.every((step) => completedStepIds.has(step.id))
    : false;
  const currentBlock = currentGroup
    ? route.blocks.find((block) => block.id === currentGroup.blockId)
    : undefined;
  const currentGoalLock = currentStep?.longRunningGoal
    ? getHardLockForGoal(route, currentStep.longRunningGoal.goalId)
    : undefined;
  const blockProgress = useMemo(
    () => route.blocks.map((block) => {
      const blockSteps = route.steps.filter((step) => step.blockId === block.id);
      const completed = blockSteps.filter((step) => completedStepIds.has(step.id)).length;
      const total = blockSteps.length;
      const firstCardIndex = stepGroups.findIndex((group) => group.blockId === block.id);
      const firstIncompleteCardIndex = stepGroups.findIndex(
        (group) =>
          group.blockId === block.id &&
          group.steps.some((step) => !completedStepIds.has(step.id)),
      );
      return {
        ...block,
        completed,
        total,
        percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
        firstCardIndex,
        targetCardIndex: firstIncompleteCardIndex >= 0 ? firstIncompleteCardIndex : firstCardIndex,
      };
    }),
    [completedStepIds, stepGroups],
  );
  const currentBlockProgress = currentBlock
    ? blockProgress.find((block) => block.id === currentBlock.id)
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

  function jumpToCardIndex(targetCardIndex: number) {
    if (targetCardIndex < 0) {
      return;
    }
    setDrawerOpen(false);
    setSecondaryView(null);
    setViewIndex(targetCardIndex);
  }

  function snapshot(): ProgressState {
    const step = currentGroup?.steps.find(x => !completedStepIds.has(x.id)) ?? currentGroup?.steps[0];
    return { completedStepIds: [...completedStepIds], checkedPreparationItemIds: [...checkedPreparationItemIds],
      compact, ...(step ? { currentStepId: step.id } : {}), routeVersion: route.routeVersion };
  }
  function commitProfiles(next: ProfilesState) {
    saveProfiles(next); profilesRef.current = next; setProfiles(next); setProfileMessage(null);
  }
  function activateProfile(next: ProfilesState) {
    try {
      const current = profilesRef.current;
      const updated = updateProfileProgress(current, current.activeProfileId, snapshot());
      const merged: ProfilesState = { ...next, profiles: next.profiles.map(p =>
        p.id === current.activeProfileId ? updated.profiles.find(q => q.id === p.id) ?? p : p) };
      const target = merged.profiles.find(p => p.id === merged.activeProfileId);
      if (!target) throw new Error('Profil introuvable.');
      saveProfiles(merged); profilesRef.current = merged; setProfiles(merged);
            setCompletedStepIds(new Set(target.progress.completedStepIds));
      setCheckedPreparationItemIds(new Set(target.progress.checkedPreparationItemIds));
      setCompact(target.progress.compact);
      const index = target.progress.currentStepId ? getStepGroupIndex(route, target.progress.currentStepId) : -1;
      const first = getFirstIncompleteStep(route, new Set(target.progress.completedStepIds));
      setViewIndex(index >= 0 ? index : first ? Math.max(0, getStepGroupIndex(route, first.id)) : 0);
      setLastValidation(null); setReward(null); setBackupMessage(null);
      setSecondaryView('profiles'); setProfileMessage(null);
    } catch (error) { setProfileMessage(error instanceof Error ? error.message : 'Action impossible.'); }
  }
  function addCharacter(duplicate: boolean) {
    try {
      const base = updateProfileProgress(profilesRef.current, profilesRef.current.activeProfileId, snapshot());
      const next = createProfile(base, profileName, duplicate ? snapshot() : emptyProgress(route));
      activateProfile(next); setProfileName('');
      setCreateProfileOpen(false); setDuplicateNewProfile(false);
      if (newClassId !== undefined) changeCharacterClass(next.activeProfileId, newClassId);
      setNewClassId(undefined);
    } catch (error) { setProfileMessage(error instanceof Error ? error.message : 'Nom invalide.'); }
  }
  function renameCharacter(id: string) {
    try {
      commitProfiles(renameProfile(profilesRef.current, id, editingName));
      setEditingProfileId(null);
    } catch (error) { setProfileMessage(error instanceof Error ? error.message : 'Nom invalide.'); }
  }
  function changeCharacterClass(id: string, classId: number | undefined) {
    const state = profilesRef.current;
    commitProfiles({ ...state, profiles: state.profiles.map(p =>
      p.id === id ? { ...p, classId } : p) });
  }
  function removeCharacter(id: string) {
    if (profilesRef.current.profiles.length <= 1) return;
    setProfileConfirmation({ kind: 'delete', id });
  }
  function restartCharacter() {
    setProfileConfirmation({ kind: 'reset', id: profilesRef.current.activeProfileId });
  }
  function confirmProfileAction() {
    if (!profileConfirmation) return;
    const { kind, id } = profileConfirmation;
    try {
      if (kind === 'delete') {
        const state = profilesRef.current;
        const next = deleteProfile(state, id);
        if (next.activeProfileId !== state.activeProfileId) activateProfile(next);
        else commitProfiles(next);
        setExpandedProfileId(prev => prev === id ? null : prev);
      } else {
        const state = profilesRef.current;
        if (id !== state.activeProfileId) throw new Error('Profil actif modifié.');
        const next = resetProfile(state, id, route);
        saveProfiles(next); profilesRef.current = next; setProfiles(next);
        setCompletedStepIds(new Set()); setCheckedPreparationItemIds(new Set());
        setViewIndex(0); setLastValidation(null); setReward(null);
        setProfileMessage('Progression réinitialisée.');
      }
      setProfileConfirmation(null);
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Action impossible.');
      setProfileConfirmation(null);
    }
  }

  function toggleCurrentStep() {
    if (!currentGroup || !currentStep) {
      return;
    }

    const shouldComplete = !isCurrentCompleted;
    const earnedReward = shouldComplete ? getNewDofusReward(currentGroup.steps.map(step => step.id), completedStepIds) : undefined;
    if (earnedReward) { setRewardImageFailed(false); setReward(earnedReward); }
    setLastValidation({ completedIds: [...completedStepIds], cardIndex: viewIndex });
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
    const wasCompleted = stepIds.every((stepId) => completedStepIds.has(stepId));
    const nextCompletedStepIds = new Set(completedStepIds);
    if (!wasCompleted) {
      const earnedReward = getNewDofusReward(stepIds, completedStepIds);
      if (earnedReward) { setRewardImageFailed(false); setReward(earnedReward); }
    }
    setLastValidation({ completedIds: [...completedStepIds], cardIndex: viewIndex });

    for (const stepId of stepIds) {
      if (wasCompleted) {
        nextCompletedStepIds.delete(stepId);
      } else {
        nextCompletedStepIds.add(stepId);
      }
    }

    const completesSequence =
      !wasCompleted && currentGroup.steps.every((step) => nextCompletedStepIds.has(step.id));

    setCompletedStepIds(nextCompletedStepIds);

    if (completesSequence && !containsHardLock && viewIndex < stepGroups.length - 1) {
      setViewIndex((index) => index + 1);
    }
  }

  function undoLastValidation() {
    if (!lastValidation) return;
    setCompletedStepIds(new Set(lastValidation.completedIds));
    setViewIndex(lastValidation.cardIndex);
    setSecondaryView(null);
    setLastValidation(null);
    setReward(null);
  }

  function exportProgressBackup() {
    const snapshot = {
      completedStepIds: [...completedStepIds],
      checkedPreparationItemIds: [...checkedPreparationItemIds],
      compact,
      currentStepId: currentGroup?.steps.find(step => !completedStepIds.has(step.id))?.id
        ?? currentGroup?.steps[0]?.id,
      routeVersion: route.routeVersion,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dofus-companion-progression.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupMessage('Sauvegarde exportée.');
  }

  async function importProgressBackup(file: File) {
    try {
      if (file.size > 2_000_000) throw new Error('Fichier trop volumineux.');
      const recovered = parseProgressBackup(await file.text(), route);
      const updated = updateProfileProgress(profilesRef.current, profilesRef.current.activeProfileId, recovered);
      saveProfiles(updated); profilesRef.current = updated; setProfiles(updated);       setLastValidation(null);
      setReward(null);
      setCompletedStepIds(new Set(recovered.completedStepIds));
      setCheckedPreparationItemIds(new Set(recovered.checkedPreparationItemIds));
      setCompact(recovered.compact);
      if (recovered.currentStepId) {
        const index = getStepGroupIndex(route, recovered.currentStepId);
        if (index >= 0) setViewIndex(index);
      }
      setBackupMessage('Progression restaurée. Vérifie les cartes avant de continuer.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fichier invalide.';
      setBackupMessage('Import impossible : ' + message);
    }
  }

  function togglePreparationItem(itemId: string) {
    setCheckedPreparationItemIds((previous) => {
      const next = new Set(previous);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
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
    if (view === 'progress') {
      setSelectedProgressBlockId(null);
    }
    setSecondaryView(view);
  }

  return (
    <main className={`overlay ${compact ? 'overlay--compact' : ''}`}>
      {secondaryView === 'profiles' && (
        <section className="profiles-page" aria-label="Gestion des personnages">
          <div className="profiles-page__header">
            <div><strong>Personnages</strong><span>{profiles.profiles.length} profil(s) localement</span></div>
            <button type="button" onClick={() => setSecondaryView(null)} aria-label="Retour au guide">← Guide</button>
          </div>
          <button className="profile-add-trigger" type="button" onClick={() => {
            setProfileName(''); setNewClassId(undefined); setDuplicateNewProfile(false);
            setProfileMessage(null); setCreateProfileOpen(true);
          }}>+ Ajouter un personnage</button>
          <div className="profiles-page__scroll">
            {profiles.profiles.map(profile => {
              const ids = new Set(profile.id === profiles.activeProfileId ? [...completedStepIds] : profile.progress.completedStepIds);
              const summary = getProgress(route, ids);
              const expanded = expandedProfileId === profile.id;
              return <div className="profile-card" key={profile.id}>
                <button type="button" className="profile-card__summary"
                  aria-expanded={expanded}
                  onClick={() => setExpandedProfileId(expanded ? null : profile.id)}>
                  {getClassIcon(profile.classId)
                    ? <img className="profile-card__icon" src={getClassIcon(profile.classId)!} alt="" />
                    : <span className="profile-card__icon profile-card__icon--empty">♙</span>}
                  <span className="profile-card__identity">
                    <strong>{profile.name}</strong>
                    <small>{profile.id === profiles.activeProfileId ? 'ACTIF · ' : ''}{summary.completed}/{summary.total} étapes</small>
                  </span>
                  <b>{summary.percentage}%</b><span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
                </button>
                <div className="profile-card__progress"><span style={{ width: `${summary.percentage}%` }}/></div>
                {expanded && <div className="profile-card__detail">
                  <div className="profile-card__toolbar">
                    {profile.id !== profiles.activeProfileId && <button type="button" onClick={() => activateProfile({...profilesRef.current,activeProfileId:profile.id})}>Utiliser ce personnage</button>}
                    <button type="button" aria-expanded={profileMenuId === profile.id}
                      onClick={() => setProfileMenuId(profileMenuId === profile.id ? null : profile.id)}>⋯ Gérer</button>
                  </div>
                  {profileMenuId === profile.id && <div className="profile-card__menu">
                    <button type="button" onClick={() => {setEditingName(profile.name);setEditingProfileId(profile.id);setProfileMenuId(null)}}>Renommer</button>
                    {profile.id === profiles.activeProfileId && <button type="button" onClick={() => {setProfileMenuId(null);restartCharacter()}}>Réinitialiser la progression</button>}
                    <button type="button" disabled={profiles.profiles.length === 1}
                      onClick={() => {setProfileMenuId(null);removeCharacter(profile.id)}}>Supprimer le personnage</button>
                  </div>}
                  {editingProfileId === profile.id && <form className="profile-edit" onSubmit={event => {event.preventDefault();renameCharacter(profile.id)}}>
                    <input aria-label="Nom du personnage" autoFocus value={editingName} maxLength={50} onChange={event => setEditingName(event.target.value)}/>
                    <button type="submit">OK</button><button type="button" onClick={() => setEditingProfileId(null)}>×</button>
                  </form>}
                  <label className="profile-class-select">Classe
                    <select value={profile.classId ?? ''} onChange={event => changeCharacterClass(profile.id, event.target.value ? Number(event.target.value) : undefined)}>
                      <option value="">Non définie</option>
                      {dofusClasses.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <div className="profile-collection-heading">
                    <strong>Collection de Dofus</strong>
                    <small>{Object.values(dofusRewards).filter(reward => ids.has(reward.stepId)).length}/{Object.keys(dofusRewards).length} obtenus</small>
                  </div>
                  <div className="profile-trophy-grid" aria-label="Dofus obtenus">
                    {Object.values(dofusRewards).map(reward => {
                      const obtained = ids.has(reward.stepId);
                      const related = route.steps.filter(step => step.dofusSeries === reward.name);
                      const completed = related.filter(step => ids.has(step.id)).length;
                      const percent = obtained ? 100 : related.length ? Math.round(completed / related.length * 100) : 0;
                      return <div className={`profile-trophy${obtained ? ' profile-trophy--obtained' : ''}`}
                        title={`${reward.name} · ${percent}% · ${obtained ? 'Obtenu' : 'Non obtenu'}`}
                        aria-label={`${reward.name}, progression ${percent}%, ${obtained ? 'obtenu' : 'non obtenu'}`}
                        key={reward.stepId}>
                        <img className="profile-trophy__muted" src={reward.image} alt="" aria-hidden="true" />
                        <span className="profile-trophy__reveal" style={{height: `${percent}%`}} aria-hidden="true">
                          <img src={reward.image} alt="" />
                        </span>
                        {obtained && <span className="profile-trophy__check" aria-hidden="true">✓</span>}
                      </div>;
                    })}
                  </div>
                  <button className="profile-dofus-toggle" type="button"
                    aria-expanded={expandedDofusProfileId === profile.id}
                    onClick={() => setExpandedDofusProfileId(expandedDofusProfileId === profile.id ? null : profile.id)}>
                    Progression détaillée par Dofus <span aria-hidden="true">{expandedDofusProfileId === profile.id ? '⌃' : '⌄'}</span>
                  </button>
                  {expandedDofusProfileId === profile.id && <div className="profile-dofus-list">
                    {Object.values(dofusRewards).map(reward => {
                      const steps = route.steps.filter(step => step.dofusSeries === reward.name);
                      const total = steps.length || 1;
                      const completed = steps.length ? steps.filter(step => ids.has(step.id)).length : Number(ids.has(reward.stepId));
                      const pct = ids.has(reward.stepId) ? 100 : Math.round(completed / total * 100);
                      return <div className="profile-dofus-row" key={reward.stepId}>
                        <img src={reward.image} alt="" />
                        <div><div className="profile-dofus-meta"><span>{reward.name}</span><b>{pct}%</b></div>
                          <div className="profile-dofus-bar"><span style={{width: `${pct}%`}}/></div></div>
                      </div>;
                    })}
                  </div>}
                </div>}
              </div>;
            })}
            {profileMessage && <p role="status">{profileMessage}</p>}
          </div>
          {createProfileOpen && (
            <div className="profile-confirm-backdrop">
              <form className="profile-create-dialog" role="dialog" aria-modal="true"
                aria-labelledby="profile-create-title" onSubmit={event => { event.preventDefault(); addCharacter(duplicateNewProfile); }}>
                <strong id="profile-create-title">Ajouter un personnage</strong>
                <label>Nom du personnage
                  <input autoFocus maxLength={50} required value={profileName} placeholder="Nom du personnage"
                    onChange={event => setProfileName(event.target.value)} />
                </label>
                <label>Classe
                  <select value={newClassId ?? ''} onChange={event => setNewClassId(event.target.value ? Number(event.target.value) : undefined)}>
                    <option value="">Non définie</option>
                    {dofusClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="profile-create-dialog__duplicate">
                  <input type="checkbox" checked={duplicateNewProfile} onChange={event => setDuplicateNewProfile(event.target.checked)} />
                  Dupliquer la progression du personnage actif
                </label>
                {profileMessage && <p role="alert">{profileMessage}</p>}
                <div className="profile-create-dialog__actions">
                  <button type="button" onClick={() => setCreateProfileOpen(false)}>Annuler</button>
                  <button type="submit" disabled={!profileName.trim()}>Valider</button>
                </div>
              </form>
            </div>
          )}
          {profileConfirmation && (() => {
            const profile = profiles.profiles.find(p => p.id === profileConfirmation.id);
            return <div className="profile-confirm-backdrop">
              <section className="profile-confirm" role="alertdialog" aria-modal="true"
                aria-labelledby="profile-confirm-title" aria-describedby="profile-confirm-description">
                <strong id="profile-confirm-title">{profileConfirmation.kind === 'delete' ? 'Supprimer le personnage ?' : 'Recommencer le guide ?'}</strong>
                <p id="profile-confirm-description">
                  {profileConfirmation.kind === 'delete'
                    ? <>Supprimer définitivement <b>{profile?.name}</b> et toute sa progression ?</>
                    : <>Effacer la progression de <b>{profile?.name}</b> ? Les autres profils seront conservés.</>}
                </p>
                <p className="profile-confirm__warning">Cette action est irréversible. Exporte une sauvegarde avant si nécessaire.</p>
                <div className="profile-confirm__actions">
                  <button type="button" onClick={() => setProfileConfirmation(null)}>Annuler</button>
                  <button type="button" className="profile-confirm__danger" onClick={confirmProfileAction}>
                    {profileConfirmation.kind === 'delete' ? 'Supprimer' : 'Réinitialiser'}
                  </button>
                </div>
              </section>
            </div>;
          })()}
        </section>
      )}
      {secondaryView !== 'profiles' && (<>
      {!compact && (
        <header className="app-header app-header--dense">
          <button
            className="icon-button"
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            ☰
          </button>
          <div className="app-header__context">
            <button className="profile-switch" type="button" onClick={() => openSecondaryView('profiles')}>
              ♙ {profiles.profiles.find(p => p.id === profiles.activeProfileId)?.name ?? 'Personnage'} ▾
            </button>
            {currentBlock && (
              <p className="header-block-line">
                <span className="header-block-line__index">Bloc {currentBlock.order}/{route.blocks.length}</span>
                <span className="header-block-line__title">· <strong>{currentBlock.title}</strong></span>
                <span className="header-block-line__progress">· {currentBlockProgress?.percentage ?? 0}%</span>
              </p>
            )}
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
            {displayIndex}/{stepGroups.length}
            {currentBlock ? ` · B${currentBlock.order}/${route.blocks.length} · ${currentBlockProgress?.percentage ?? 0}%` : ''}
            {' · '}{typeLabel}
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
          <button type="button" onClick={() => openSecondaryView('profiles')}>Personnages</button>
          <button type="button" onClick={() => openSecondaryView('progress')}>Progression</button>
          <button type="button" onClick={() => openSecondaryView('settings')}>Paramètres</button>
        </nav>
      )}

      {secondaryView && !compact && (
        <section className={`context-panel${secondaryView === 'progress' ? ' context-panel--progress' : ''}`} aria-label="Vue secondaire">
          <div className="context-panel__header">
            <p className="eyebrow">
              {secondaryView === 'progress' && 'Progression'}
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
            <div className="context-panel__body progression-dashboard">
              <div className="progression-summary">
                <strong>{progress.percentage}%</strong>
                <span>{progress.completed} / {progress.total} étapes · {stepGroups.length} cartes</span>
              </div>
              <div className="progression-blocks">
                {blockProgress.map((block) => {
                  const isCurrent = block.id === currentBlock?.id;
                  const isExpanded = block.id === selectedProgressBlockId;
                  const blockCards = isExpanded
                    ? stepGroups
                        .map((group, index) => ({ group, index }))
                        .filter(({ group }) => group.blockId === block.id)
                    : [];

                  return (
                    <div
                      className={`progression-block-group${isExpanded ? ' progression-block-group--expanded' : ''}`}
                      key={block.id}
                    >
                      <button
                        className={`progression-block${isCurrent ? ' progression-block--current' : ''}${isExpanded ? ' progression-block--selected' : ''}`}
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setSelectedProgressBlockId((current) =>
                            current === block.id ? null : block.id,
                          )
                        }
                      >
                        <div className="progression-block__header">
                          <span className="progression-block__title">
                            <b>{block.order}</b>
                            <span>{block.title}</span>
                          </span>
                          <strong>{block.percentage}%</strong>
                        </div>
                        <div className="progression-block__bar" aria-hidden="true">
                          <span style={{ width: `${block.percentage}%` }} />
                        </div>
                        <span className="progression-block__meta">
                          {block.completed} / {block.total} étapes
                        </span>
                      </button>

                      {isExpanded && blockCards.length > 0 && (
                        <div className="block-roadmap__cards block-roadmap__cards--inline">
                          {blockCards.map(({ group, index }) => {
                            const completed = group.steps.every((step) => completedStepIds.has(step.id));
                            const isCurrentCard = index === viewIndex;
                            const representative =
                              group.steps.find((step) => step.displayRole === 'objective') ?? group.steps[0];
                            return (
                              <button
                                className={`block-roadmap__card${completed ? ' block-roadmap__card--completed' : ''}${isCurrentCard ? ' block-roadmap__card--current' : ''}`}
                                type="button"
                                key={group.id}
                                onClick={() => jumpToCardIndex(index)}
                              >
                                <span className="block-roadmap__status" aria-hidden="true">
                                  {completed ? '✓' : isCurrentCard ? '→' : '○'}
                                </span>
                                <span className="block-roadmap__content">
                                  <small>Carte {index + 1}</small>
                                  <strong>{representative.title}</strong>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {secondaryView === 'settings' && (
            <>
              <p className="settings-help">Raccourcis globaux Tauri, persistés localement.</p>
              <div className="progress-backup">
                <strong>SAUVEGARDE DE PROGRESSION</strong>
                <p>Conserve une copie locale de tes coches et préparations avant une mise à jour.</p>
                <button type="button" onClick={exportProgressBackup}>Exporter ma progression</button>
                <label className="progress-backup__import">
                  Importer une sauvegarde JSON
                  <input type="file" accept=".json,application/json" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importProgressBackup(file);
                    event.currentTarget.value = '';
                  }} />
                </label>
                {backupMessage && <p role="status">{backupMessage}</p>}
                {saveError && <p className="settings-error" role="alert">{saveError}</p>}
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
            </>
          )}
        </section>
      )}

      {secondaryView !== 'progress' && (
      <section
        className={`current-step current-step--${containsHardLock ? 'hard_lock' : isSequence ? 'sequence' : currentStep.type}${isCurrentCompleted ? ' current-step--completed' : ''}`}
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

            <ol className="sequence-list sequence-list--simple">
              {sequenceObjectives.map((objective) => {
                const displayStep = getObjectiveDisplayStep(objective.steps);
                const completed = objective.steps.every((step) => completedStepIds.has(step.id));
                const active = objective.id === activeSequenceObjectiveId;
                const stepIds = objective.steps.map((step) => step.id);
                const expandable = hasExpandableObjectiveDetails(objective.steps);
                const expanded = expandable && objective.id === expandedSequenceObjectiveId;
                return (
                  <li
                    className={['sequence-item', completed ? 'sequence-item--completed' : '', active ? 'sequence-item--active' : ''].filter(Boolean).join(' ')}
                    key={objective.id}
                    onClick={() => {
                      if (expandable) setExpandedSequenceObjectiveId((current) => current === objective.id ? null : objective.id);
                    }}
                  >
                    <button
                      className="sequence-checkbox"
                      type="button"
                      aria-label={completed ? `Décocher ${displayStep.title}` : `Cocher ${displayStep.title}`}
                      aria-pressed={completed}
                      onClick={(event) => { event.stopPropagation(); toggleSequenceObjective(stepIds); }}
                    >
                      {completed ? '✓' : active ? '→' : ''}
                    </button>
                    <div className="sequence-item__content">
                      {objective.steps.map((step) => (
                        <div className="sequence-simple-row" key={step.id}>
                          <span className="sequence-simple-row__title" title={step.title}>
                            <StepMarkers step={step} />
                            {step.source ? (
                              <button
                                className="source-title-button"
                                type="button"
                                title={`Ouvrir ${step.source.label} : ${step.title}`}
                                onClick={(event) => { event.stopPropagation(); void openExternalSource(step.source!.url); }}
                              >
                                {step.title}
                              </button>
                            ) : (
                              step.title
                            )}
                          </span>
                          {(step.warning || step.instruction || step.launchInstruction) && (
                            <span className="sequence-simple-row__hint" aria-hidden="true">{expanded ? '−' : '＋'}</span>
                          )}
                        </div>
                      ))}
                      {expanded && objective.steps.map((step) => (
                        <div className="sequence-simple-row__details" key={`detail:${step.id}`}>
                          {step.warning && <span className="sequence-item__note">{step.warning}</span>}
                          {step.launchInstruction && !step.location && <span className="sequence-item__note">{step.launchInstruction}</span>}
                          {step.instruction && <span className="sequence-item__note">{step.instruction}</span>}
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <>
            <div className="step-title-row">
              <h1 id="current-step-title">
                <span className="title-with-markers">
                  <StepMarkers step={currentStep} />
                  {currentStep.source ? (
                    <button
                      className="source-title-button source-title-button--main"
                      type="button"
                      title={`Ouvrir ${currentStep.source.label}`}
                      onClick={() => void openExternalSource(currentStep.source!.url)}
                    >
                      {currentStep.title}
                    </button>
                  ) : (
                    currentStep.title
                  )}
                </span>
              </h1>
            </div>

            {currentStep.warning && (
              <div className="step-context step-context--lock">
                <strong>{getWarningLabel(currentStep.warning)}</strong>
                <span>{getWarningContent(currentStep.warning)}</span>
              </div>
            )}

            {currentStep.action && (
              <p className={`action-label action-label--${getActionTone(currentStep.action)}`}>
                {currentStep.action}
              </p>
            )}

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
              <PreparationChecklist
                stepId={currentStep.id}
                items={currentStep.preparationItems}
                checkedItemIds={checkedPreparationItemIds}
                onToggleItem={togglePreparationItem}
                onCopyName={(name) => void copyToClipboard(name)}
              />
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
      )}

      {reward && (
        <section className={`dofus-reward dofus-reward--${reward.tier}`} role="dialog" aria-modal="true" aria-label={`Dofus obtenu : ${reward.name}`}>
          <div className="dofus-reward__panel">
            <p className="dofus-reward__eyebrow">DOFUS OBTENU</p>
            <div className="dofus-reward__image">
              {!rewardImageFailed ? (
                <img src={reward.image} alt={reward.name} onError={() => setRewardImageFailed(true)} />
              ) : (
                <span className="dofus-reward__placeholder" aria-hidden="true">✦</span>
              )}
            </div>
            <h2>Félicitations !</h2>
            <p className="dofus-reward__name">Tu as obtenu le {reward.name}.</p>
            <button type="button" onClick={() => setReward(null)}>Continuer →</button>
          </div>
        </section>
      )}

      {secondaryView !== 'progress' && (
      <footer className="navigation-bar">
        {lastValidation && (
          <button className="undo-validation-button" type="button" onClick={undoLastValidation} title="Annuler la dernière validation">↶ Annuler</button>
        )}
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
      )}
      </>)}
    </main>
  );
}
