import {
  getPreparationItemKey,
  preparationRequirementLabels,
} from '../route/preparation';
import type { PreparationItem } from '../route/types';
import './PreparationChecklist.css';

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
  const indexedItems = items.map((item, itemIndex) => ({ item, itemIndex }));
  const resources = indexedItems.filter(({ item }) => item.kind === 'resource');
  const requirements = indexedItems.filter(({ item }) => item.kind !== 'resource');

  return (
    <div className="preparation-checklist">
      {resources.length > 0 && (
        <section className="preparation-checklist__section" aria-label="Ressources à avoir">
          <p className="preparation-checklist__heading">RESSOURCES À AVOIR</p>
          <ul className="preparation-checklist__list">
            {resources.map(({ item, itemIndex }) => {
              if (item.kind !== 'resource') return null;
              const itemId = getPreparationItemKey(stepId, itemIndex);
              const checked = checkedItemIds.has(itemId);

              return (
                <li
                  className={`preparation-checklist__resource${checked ? ' preparation-checklist__resource--checked' : ''}`}
                  key={itemId}
                >
                  <button
                    className="preparation-checklist__check"
                    type="button"
                    aria-label={checked ? `Décocher ${item.name}` : `Cocher ${item.name}`}
                    aria-pressed={checked}
                    onClick={() => onToggleItem(itemId)}
                  >
                    {checked ? '✓' : ''}
                  </button>
                  <button
                    className="preparation-checklist__copy"
                    type="button"
                    title={`Copier ${item.name}`}
                    onClick={() => onCopyName(item.name)}
                  >
                    <span className="preparation-checklist__quantity">{item.quantity} ×</span>
                    <span className="preparation-checklist__name">{item.name}</span>
                    <span className="preparation-checklist__copy-icon" aria-hidden="true">⧉</span>
                  </button>
                  {item.note && (
                    <span className="preparation-checklist__resource-note">{item.note}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {requirements.length > 0 && (
        <section className="preparation-checklist__section" aria-label="Autres prérequis">
          <p className="preparation-checklist__heading">AUTRES PRÉREQUIS</p>
          <ul className="preparation-checklist__requirements">
            {requirements.map(({ item, itemIndex }) => {
              if (item.kind === 'resource') return null;
              const itemId = getPreparationItemKey(stepId, itemIndex);

              return (
                <li className="preparation-checklist__requirement" key={itemId}>
                  <span className={`preparation-checklist__requirement-kind preparation-checklist__requirement-kind--${item.kind}`}>
                    {preparationRequirementLabels[item.kind]}
                  </span>
                  <span>{item.text}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
