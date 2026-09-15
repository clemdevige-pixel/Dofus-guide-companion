import { getPreparationItemKey, normalizePreparationItem } from '../route/preparation';
import type { PreparationItem } from '../route/types';

interface PreparationChecklistProps {
  stepId: string;
  items: PreparationItem[];
  checkedItemIds: ReadonlySet<string>;
  onToggleItem: (itemId: string) => void;
  onCopyName: (name: string) => void;
}

export function PreparationChecklist({
  stepId,
  items,
  checkedItemIds,
  onToggleItem,
  onCopyName,
}: PreparationChecklistProps) {
  return (
    <ul className="preparation-checklist">
      {items.map((item, itemIndex) => {
        const normalized = normalizePreparationItem(item);
        const itemId = getPreparationItemKey(stepId, itemIndex);

        if (normalized.kind === 'note') {
          return (
            <li className="preparation-checklist__note" key={itemId}>
              {normalized.text}
            </li>
          );
        }

        const checked = checkedItemIds.has(itemId);

        return (
          <li
            className={`preparation-checklist__resource${checked ? ' preparation-checklist__resource--checked' : ''}`}
            key={itemId}
          >
            <button
              className="preparation-checklist__check"
              type="button"
              aria-label={checked ? `Décocher ${normalized.name}` : `Cocher ${normalized.name}`}
              aria-pressed={checked}
              onClick={() => onToggleItem(itemId)}
            >
              {checked ? '✓' : ''}
            </button>
            <button
              className="preparation-checklist__copy"
              type="button"
              title={`Copier ${normalized.name}`}
              onClick={() => onCopyName(normalized.name)}
            >
              <span className="preparation-checklist__quantity">{normalized.quantity} ×</span>
              <span className="preparation-checklist__name">{normalized.name}</span>
              <span className="preparation-checklist__copy-icon" aria-hidden="true">⧉</span>
            </button>
            {normalized.note && (
              <span className="preparation-checklist__resource-note">{normalized.note}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
