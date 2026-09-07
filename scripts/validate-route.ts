import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RouteDocument } from '../src/route/types';
import { validateRoute } from '../src/route/validation';

const routePath = resolve('data/route.json');
const raw = await readFile(routePath, 'utf8');
const route = JSON.parse(raw) as RouteDocument;

validateRoute(route);

console.log(`Route valide : ${route.steps.length} étapes, ${route.blocks.length} blocs.`);
