import { useEffect, useRef, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import type { ShortcutAction, ShortcutBindings } from './types';

export type ShortcutHandlers = Record<ShortcutAction, () => void | Promise<void>>;

const REMAP_DELAY_MS = 200;

function assertUniqueBindings(bindings: ShortcutBindings) {
  const seen = new Map<string, ShortcutAction>();

  for (const [action, shortcut] of Object.entries(bindings) as [ShortcutAction, string][]) {
    const normalized = shortcut.trim().toLowerCase();
    if (!normalized) {
      throw new Error(`Raccourci vide pour ${action}.`);
    }

    const existing = seen.get(normalized);
    if (existing) {
      throw new Error(`Le raccourci « ${shortcut} » est déjà utilisé par ${existing}.`);
    }

    seen.set(normalized, action);
  }
}

async function unregisterBindings(bindings: ShortcutBindings | null) {
  if (!bindings) {
    return;
  }

  for (const shortcut of Object.values(bindings)) {
    try {
      await unregister(shortcut.trim());
    } catch {
      // A shortcut may already have been released by the OS/plugin.
    }
  }
}

export function useGlobalShortcuts(
  bindings: ShortcutBindings,
  handlers: ShortcutHandlers,
): string | null {
  const handlersRef = useRef(handlers);
  const activeBindingsRef = useRef<ShortcutBindings | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);
  const [error, setError] = useState<string | null>(null);

  handlersRef.current = handlers;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      queueRef.current = queueRef.current.then(async () => {
        await unregisterBindings(activeBindingsRef.current);
        activeBindingsRef.current = null;
      });
    };
  }, []);

  useEffect(() => {
    if (!isTauri()) {
      setError(null);
      return;
    }

    let cancelled = false;
    const nextBindings = { ...bindings };

    const timeout = window.setTimeout(() => {
      queueRef.current = queueRef.current.then(async () => {
        if (cancelled || !mountedRef.current) {
          return;
        }

        const previousBindings = activeBindingsRef.current;
        const registered: string[] = [];

        try {
          assertUniqueBindings(nextBindings);
          await unregisterBindings(previousBindings);
          activeBindingsRef.current = null;

          for (const [action, shortcut] of Object.entries(nextBindings) as [
            ShortcutAction,
            string,
          ][]) {
            const normalized = shortcut.trim();
            await register(normalized, (event) => {
              if (event.state === 'Pressed') {
                void handlersRef.current[action]();
              }
            });
            registered.push(normalized);
          }

          activeBindingsRef.current = nextBindings;
          if (mountedRef.current) {
            setError(null);
          }
        } catch (registrationError) {
          for (const shortcut of registered) {
            try {
              await unregister(shortcut);
            } catch {
              // Best effort cleanup after a partial registration failure.
            }
          }

          if (previousBindings && mountedRef.current) {
            try {
              for (const [action, shortcut] of Object.entries(previousBindings) as [
                ShortcutAction,
                string,
              ][]) {
                await register(shortcut.trim(), (event) => {
                  if (event.state === 'Pressed') {
                    void handlersRef.current[action]();
                  }
                });
              }
              activeBindingsRef.current = previousBindings;
            } catch {
              activeBindingsRef.current = null;
            }
          }

          if (mountedRef.current) {
            setError(
              registrationError instanceof Error
                ? registrationError.message
                : 'Impossible d’enregistrer les raccourcis globaux.',
            );
          }
        }
      });
    }, REMAP_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [bindings]);

  return error;
}
