import type { RouteStep } from '../route/types';

type MarkerKind = 'alignment' | 'dofus' | 'dungeon';

function MarkerIcon({ kind }: { kind: MarkerKind }) {
  if (kind === 'alignment') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z" />
      </svg>
    );
  }

  if (kind === 'dungeon') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 21V9l3-2 3 2 2-4 2 4 3-2 3 2v12H4Z" />
        <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.2 3.2c-3.1 0-6.5 4.7-6.5 9.3 0 4.7 2.7 8.3 6.3 8.3s6.3-3.6 6.3-8.3c0-4.6-3-9.3-6.1-9.3Z" />
      <path d="M8.8 12.2c1.6-1.2 3.1-1.7 4.6-1.4 1 .2 1.8.6 2.5 1.1" />
    </svg>
  );
}

function markerLabel(kind: MarkerKind, dofusSeries?: string) {
  if (kind === 'alignment') return 'Quête d’alignement';
  if (kind === 'dungeon') return 'Étape de donjon';
  return dofusSeries ? `Quête liée au ${dofusSeries}` : 'Quête liée à un Dofus';
}

export function StepMarkers({ step }: { step: RouteStep }) {
  const markers: MarkerKind[] = [];

  if (step.type === 'alignment') markers.push('alignment');
  if (step.dofusSeries) markers.push('dofus');
  if (step.type === 'dungeon') markers.push('dungeon');

  if (markers.length === 0) return null;

  return (
    <span className="step-markers" aria-label={markers.map((kind) => markerLabel(kind, step.dofusSeries)).join(', ')}>
      {markers.slice(0, 2).map((kind) => (
        <span
          className={`step-marker step-marker--${kind}`}
          title={markerLabel(kind, step.dofusSeries)}
          key={kind}
        >
          <MarkerIcon kind={kind} />
        </span>
      ))}
    </span>
  );
}
