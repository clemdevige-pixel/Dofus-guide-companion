export type ShortcutAction =
  | 'previous'
  | 'next'
  | 'toggleComplete'
  | 'toggleVisibility';

export type ShortcutBindings = Record<ShortcutAction, string>;

export const defaultShortcutBindings: ShortcutBindings = {
  previous: 'CommandOrControl+Alt+ArrowLeft',
  next: 'CommandOrControl+Alt+ArrowRight',
  toggleComplete: 'CommandOrControl+Alt+Enter',
  toggleVisibility: 'CommandOrControl+Alt+Space',
};

export const shortcutLabels: Record<ShortcutAction, string> = {
  previous: 'Étape précédente',
  next: 'Étape suivante',
  toggleComplete: 'Valider / dévalider',
  toggleVisibility: 'Afficher / masquer',
};
