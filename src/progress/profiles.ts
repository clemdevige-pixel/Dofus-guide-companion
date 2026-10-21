import { loadBundledRoute } from '../route/loader';
import type { RouteDocument } from '../route/types';
import { loadProgress, reconcileProgressWithRoute, type ProgressState } from './storage';

const KEY = 'dofus-guide-companion.profiles.v2';
const LEGACY_KEY = 'dofus-guide-companion.progress.v1';

export interface CharacterProfile { id: string; name: string; classId?: number; progress: ProgressState }
export interface ProfilesState { version: 2; activeProfileId: string; profiles: CharacterProfile[] }
export interface ProfileStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function emptyProgress(route: RouteDocument = loadBundledRoute()): ProgressState {
  return { completedStepIds: [], checkedPreparationItemIds: [], compact: false, routeVersion: route.routeVersion };
}
export function newProfileId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function loadProfiles(storage: ProfileStorage = window.localStorage, route: RouteDocument = loadBundledRoute()): ProfilesState {
  const legacyExists = storage.getItem(LEGACY_KEY) !== null;
  const legacy = legacyExists ? loadProgress(storage, route) : emptyProgress(route);
  try {
    const raw = storage.getItem(KEY);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        if (obj.version === 2 && Array.isArray(obj.profiles) && obj.profiles.length) {
          const seen = new Set<string>();
          const profiles: CharacterProfile[] = [];
          for (const item of obj.profiles) {
            if (!item || typeof item !== 'object') continue;
            const entry = item as Record<string, unknown>;
            if (typeof entry.id !== 'string' || !entry.id || seen.has(entry.id)
              || typeof entry.name !== 'string' || !entry.name.trim()
              || !entry.progress || typeof entry.progress !== 'object') continue;
            const progress = entry.progress as Record<string, unknown>;
            if (!Array.isArray(progress.completedStepIds) || !progress.completedStepIds.every(x => typeof x === 'string')
              || !Array.isArray(progress.checkedPreparationItemIds) || !progress.checkedPreparationItemIds.every(x => typeof x === 'string')) continue;
            seen.add(entry.id);
            profiles.push({
              id: entry.id, name: entry.name.trim(),
              ...(typeof entry.classId === 'number' && Number.isInteger(entry.classId) ? { classId: entry.classId } : {}),
              progress: reconcileProgressWithRoute({
                completedStepIds: progress.completedStepIds as string[],
                checkedPreparationItemIds: progress.checkedPreparationItemIds as string[],
                compact: typeof progress.compact === 'boolean' ? progress.compact : false,
                ...(typeof progress.currentStepId === 'string' ? { currentStepId: progress.currentStepId } : {}),
                ...(typeof progress.routeVersion === 'string' ? { routeVersion: progress.routeVersion } : {}),
              }, route),
            });
          }
          if (profiles.length) {
            return { version: 2, profiles, activeProfileId:
              profiles.some(p => p.id === obj.activeProfileId) ? obj.activeProfileId as string : profiles[0].id };
          }
        }
      }
    }
  } catch { /* Invalid v2 should never delete or overwrite the v1 backup. */ }
  const id = newProfileId();
  return { version: 2, activeProfileId: id, profiles: [{ id, name: 'Personnage principal', progress: legacy }] };
}
export function saveProfiles(state: ProfilesState, storage: ProfileStorage = window.localStorage): void {
  if (!state.profiles.length || !state.profiles.some(p => p.id === state.activeProfileId)) throw new Error('Profil actif invalide.');
  storage.setItem(KEY, JSON.stringify(state));
}
export function updateProfileProgress(state: ProfilesState, id: string, progress: ProgressState): ProfilesState {
  return { ...state, profiles: state.profiles.map(p => p.id === id ? { ...p, progress } : p) };
}
export function createProfile(state: ProfilesState, name: string, progress: ProgressState, id: string = newProfileId()): ProfilesState {
  const clean = name.trim();
  if (!clean || clean.length > 50 || state.profiles.some(p => p.id === id)) throw new Error('Nom ou identifiant invalide.');
  return { ...state, activeProfileId: id, profiles: [...state.profiles, { id, name: clean, progress }] };
}
export function renameProfile(state: ProfilesState, id: string, name: string): ProfilesState {
  const clean = name.trim();
  if (!clean || clean.length > 50) throw new Error('Nom invalide (1 à 50 caractères).');
  return { ...state, profiles: state.profiles.map(p => p.id === id ? { ...p, name: clean } : p) };
}
export function deleteProfile(state: ProfilesState, id: string): ProfilesState {
  if (state.profiles.length === 1) throw new Error('Conserve au moins un personnage.');
  const profiles = state.profiles.filter(p => p.id !== id);
  return { ...state, profiles, activeProfileId: state.activeProfileId === id ? profiles[0].id : state.activeProfileId };
}
export function resetProfile(state: ProfilesState, id: string, route: RouteDocument = loadBundledRoute()): ProfilesState {
  return updateProfileProgress(state, id, emptyProgress(route));
}
