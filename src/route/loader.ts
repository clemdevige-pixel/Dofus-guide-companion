import routeData from '../../data/route.json';
import { getPlayerFacingStepTitle } from './displayTitle';
import type { RouteDocument } from './types';
import { validateRoute } from './validation';

let cachedRoute: RouteDocument | undefined;

export function loadBundledRoute(): RouteDocument {
  if (!cachedRoute) {
    const validatedRoute = validateRoute(routeData as RouteDocument);
    cachedRoute = {
      ...validatedRoute,
      steps: validatedRoute.steps.map((step) => ({
        ...step,
        title: getPlayerFacingStepTitle(step),
      })),
    };
  }

  return cachedRoute;
}
