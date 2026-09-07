import routeData from '../../data/route.json';
import type { RouteDocument } from './types';
import { validateRoute } from './validation';

let cachedRoute: RouteDocument | undefined;

export function loadBundledRoute(): RouteDocument {
  if (!cachedRoute) {
    cachedRoute = validateRoute(routeData as RouteDocument);
  }

  return cachedRoute;
}
