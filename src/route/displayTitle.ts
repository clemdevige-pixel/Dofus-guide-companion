import type { RouteStep } from './types';

const canonicalSourceTypes = new Set<RouteStep['type']>([
  'quest',
  'resume',
  'alignment',
  'order',
  'long_running',
]);

export function getPlayerFacingStepTitle(step: RouteStep): string {
  let title = step.title.trim();

  if (step.type === 'dungeon') {
    title = title.replace(/^◆\s*/, '');
  }

  const shouldDropEditorialSuffix =
    step.type === 'dungeon' || (Boolean(step.source) && canonicalSourceTypes.has(step.type));

  if (shouldDropEditorialSuffix) {
    title = title.split(' — ')[0]?.trim() || title;
  }

  return title;
}
