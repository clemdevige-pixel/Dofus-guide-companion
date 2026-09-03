import { useEffect, useRef, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import type { ShortcutAction, ShortcutBindings } from './types';

export type ShortcutHandlers = Record<ShortcutAction, () => void | Promise<void>>;

function assertUniqueBindings(bindings: ShortcutBindings) {
  const seen = new Map<string, ShortcutAction>();

  for (const [action, shortcut] of Object.entries(bindings) as [ShortcutAction, string][]) {
    const normalized = shortcut.trim().toLowerCase();
    const existing = seen.get(normalized);

    if (existing) {
      throw new Error(`Le raccourci « ${shortcut} » est déjà utilisé par ${existing}.`);
    }

    seen.set(normalized, action);
  }
}

export function useGlobalShortcuts(
  bindings: ShortcutBindings,
  handlers: ShortcutHandlers,
): string | null {
  const handlersRef = useRef(handlers);
  const [error, setError] = useState<string | null>(null);

  handlersRef.current = handlers;

  useEffect(() => {
    if (!isTauri()) {
      setError(null);
      return;
    }

    let disposed = false;
    const registered: string[] = [];

    async function setup() {
      try {
        assertUniqueBindings(bindings);

        for (const [action, shortcut] of Object.entries(bindings) as [ShortcutAction, string][]) {
          const normalized = shortcut.trim();
          if (!normalized) {
            throw new Error(`Raccourci vide pour ${action}.`);
          }

          await register(normalized, (event) => {
            if (event.state === 'Pressed') {
              void handlersRef.current[action]();
            }
          });
          registered.push(normalized);
        }

        if (!disposed) {
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

        if (!disposed) {
          setError(
            registrationError instanceof Error
              ? registrationError.message
              : 'Impossible d’enregistrer les raccourcis globaux.',
          );
        }
      }
    }

    void setup();

    return () => {
      disposed = true;
      for (const shortcut of registered) {
        void unregister(shortcut).catch(() => undefined);
      }
    };
  }, [bindings]);

  return error;
}
