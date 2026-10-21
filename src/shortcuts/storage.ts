import { defaultShortcutBindings, type ShortcutAction, type ShortcutBindings } from './types';

const STORAGE_KEY = 'dofus-guide-companion.shortcuts.v1';
const actions = Object.keys(defaultShortcutBindings) as ShortcutAction[];

export function loadShortcutBindings(): ShortcutBindings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultShortcutBindings };
    }

    const parsed = JSON.parse(raw) as Partial<Record<ShortcutAction, unknown>>;
    const bindings = { ...defaultShortcutBindings };

    for (const action of actions) {
      const value = parsed[action];
      if (typeof value === 'string' && value.trim()) {
        bindings[action] = value.trim();
      }
    }

    return bindings;
  } catch {
    return { ...defaultShortcutBindings };
  }
}

export function saveShortcutBindings(bindings: ShortcutBindings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}
