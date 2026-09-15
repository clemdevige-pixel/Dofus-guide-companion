import { getPreparationItemKey, parsePreparationItem } from '../route/preparation';

interface PreparationChecklistProps {
  stepId: string;
  items: string[];
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
      {items.map((rawItem, itemIndex) => {
        const parsed = parsePreparationItem(rawItem);
        const itemId = getPreparationItemKey(stepId, itemIndex);

        if (parsed.kind === 'note') {
          return (
            <li className="preparation-checklist__note" key={itemId}>
              {parsed.text}
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
              aria-label={checked ? `Décocher ${parsed.name}` : `Cocher ${parsed.name}`}
              aria-pressed={checked}
              onClick={() => onToggleItem(itemId)}
            >
              {checked ? '✓' : ''}
            </button>
            <button
              className="preparation-checklist__copy"
              type="button"
              title={`Copier ${parsed.name}`}
              onClick={() => onCopyName(parsed.name)}
            >
              <span className="preparation-checklist__quantity">{parsed.quantity} ×</span>
              <span className="preparation-checklist__name">{parsed.name}</span>
              <span className="preparation-checklist__copy-icon" aria-hidden="true">⧉</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
