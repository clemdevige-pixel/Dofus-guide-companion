import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type {
  GuideItemAction,
  ParallelPhase,
  RouteBlock,
  RouteDocument,
  RouteStep,
  StepDisplayRole,
  StepType,
} from '../src/route/types';
import { validateRoute } from '../src/route/validation';

const DEFAULT_RANGE = 'ROUTE!A5:V';
const OUTPUT_PATH = resolve('data/route.json');

const typeMap: Record<string, { type: StepType; displayType?: string }> = {
  'QUÊTE': { type: 'quest' },
  'QUÊTES PARALLÈLES': { type: 'quest', displayType: 'QUÊTES PARALLÈLES' },
  'REPRISE': { type: 'resume' },
  'DONJON': { type: 'dungeon' },
  'PRÉPA': { type: 'preparation' },
  'RÈGLE': { type: 'rule' },
  'JALON': { type: 'milestone' },
  'FIL ROUGE': { type: 'long_running' },
  'VERROU DUR': { type: 'hard_lock' },
  'ALIGN.': { type: 'alignment', displayType: 'ALIGN.' },
  'ORDRE': { type: 'order' },
  'GROSSE ÉTAPE': { type: 'major_step' },
  'FIN': { type: 'finish' },
  'TOUR': { type: 'quest', displayType: 'TOUR' },
  'TURQUOISE': { type: 'quest', displayType: 'TURQUOISE' },
  'OPTI ALIGNEMENT': { type: 'major_step', displayType: 'OPTI ALIGNEMENT' },
};

const guideItemActionMap: Record<string, GuideItemAction> = {
  PRENDRE: 'take',
  AVANCER: 'advance',
  TERMINER: 'finish',
  FAIRE: 'do',
};

const displayRoleMap: Record<string, StepDisplayRole> = {
  OBJECTIVE: 'objective',
  TRANSITION: 'transition',
  DETAIL: 'detail',
};

type SheetRow = string[];
type LifecyclePhase = 'start' | 'progress' | 'finish';

type GoogleAuth = {
  headers: Record<string, string>;
  query: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

function getAuth(): GoogleAuth {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN?.trim();
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY?.trim();
  if (accessToken) return { headers: { Authorization: `Bearer ${accessToken}` }, query: '' };
  if (apiKey) return { headers: {}, query: `&key=${encodeURIComponent(apiKey)}` };
  throw new Error('Authentification Google absente : définir GOOGLE_ACCESS_TOKEN ou GOOGLE_SHEETS_API_KEY.');
}

async function fetchValues(spreadsheetId: string, valueRenderOption: 'FORMATTED_VALUE' | 'FORMULA') {
  const auth = getAuth();
  const range = encodeURIComponent(process.env.ROUTE_SHEET_RANGE?.trim() || DEFAULT_RANGE);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${range}?majorDimension=ROWS&valueRenderOption=${valueRenderOption}${auth.query}`;
  const response = await fetch(url, { headers: auth.headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Sheets API ${response.status}: ${body}`);
  }
  const payload = (await response.json()) as { values?: SheetRow[] };
  return payload.values ?? [];
}

function cell(row: SheetRow | undefined, index: number): string {
  return row?.[index]?.trim() ?? '';
}

function parseBoolean(rawValue: string, sheetRow: number): boolean {
  if (!rawValue) return false;
  if (rawValue === 'TRUE') return true;
  if (rawValue === 'FALSE') return false;
  throw new Error(`Ligne Sheet ${sheetRow}: LANCEMENT_REQUIS invalide « ${rawValue} », attendu TRUE/FALSE.`);
}

function parseLifecyclePhase(
  rawPhase: string,
  sheetRow: number,
  columnName: 'GOAL_PHASE' | 'PARALLEL_PHASE',
): LifecyclePhase | undefined {
  if (!rawPhase) return undefined;
  if (rawPhase === 'start' || rawPhase === 'progress' || rawPhase === 'finish') return rawPhase;
  throw new Error(`Ligne Sheet ${sheetRow}: ${columnName} inconnu « ${rawPhase} »`);
}

function parseDisplayRole(rawRole: string, sheetRow: number): StepDisplayRole | undefined {
  if (!rawRole) return undefined;
  const role = displayRoleMap[rawRole.toUpperCase()];
  if (!role) {
    throw new Error(
      `Ligne Sheet ${sheetRow}: DISPLAY_ROLE inconnu « ${rawRole} », attendu OBJECTIVE, TRANSITION ou DETAIL.`,
    );
  }
  return role;
}

function parseCoordinate(rawPosition: string, sheetRow: number, columnName: string): RouteStep['location'] | undefined {
  if (!rawPosition) return undefined;
  const match = rawPosition.match(/^\[?\s*(-?\d+)\s*,\s*(-?\d+)\s*\]?$/);
  if (!match) {
    throw new Error(`Ligne Sheet ${sheetRow}: ${columnName} invalide « ${rawPosition} », attendu [x,y].`);
  }
  return { x: Number.parseInt(match[1], 10), y: Number.parseInt(match[2], 10) };
}

function parseGuideItems(rawItems: string, sheetRow: number): RouteStep['guideItems'] {
  if (!rawItems) return undefined;
  const items = rawItems
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, itemIndex) => {
      const [rawAction = '', rawLabel = '', rawLocation = '', ...noteParts] = line.split('::').map((part) => part.trim());
      const action = guideItemActionMap[rawAction.toUpperCase()];
      if (!action) {
        throw new Error(
          `Ligne Sheet ${sheetRow}: GUIDE_ITEMS ${itemIndex + 1}, action inconnue « ${rawAction} ». ` +
            'Attendu PRENDRE, AVANCER, TERMINER ou FAIRE.',
        );
      }
      if (!rawLabel) throw new Error(`Ligne Sheet ${sheetRow}: GUIDE_ITEMS ${itemIndex + 1}, libellé manquant.`);
      const location = parseCoordinate(rawLocation, sheetRow, `GUIDE_ITEMS ${itemIndex + 1} position`);
      const note = noteParts.join(' :: ').trim();
      return {
        action,
        label: rawLabel,
        ...(location ? { location } : {}),
        ...(note ? { note } : {}),
      };
    });
  return items.length > 0 ? items : undefined;
}

function parseHyperlinkFormula(formula: string): { label: string; url: string } | undefined {
  if (!formula.startsWith('=HYPERLINK(')) return undefined;
  const match = formula.match(/^=HYPERLINK\("([^"]+)"[;,]"((?:[^"]|"")*)"\)$/i);
  if (!match) throw new Error(`Formule HYPERLINK non supportée : ${formula}`);
  return { url: match[1], label: match[2].replaceAll('""', '"') };
}

function parseBlock(title: string): RouteBlock | undefined {
  const match = title.match(/^NOUVEAU BLOC\s+(\d+)\s+—\s+(.+)$/i);
  if (!match) return undefined;
  const order = Number.parseInt(match[1], 10);
  return { id: `block-${match[1].padStart(2, '0')}`, order, title: match[2].trim() };
}

function parsePreparationItems(text: string): string[] | undefined {
  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('•'))
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function buildRoute(formattedRows: SheetRow[], formulaRows: SheetRow[]): RouteDocument {
  if (formattedRows.length === 0) throw new Error('Le Sheet ne contient aucune donnée dans la plage demandée.');

  const headers = formattedRows[0] ?? [];
  const expectedHeaders: Array<[number, string]> = [
    [1, 'TYPE'], [2, 'ÉTAPE'], [10, 'STEP_ID'], [11, 'GOAL_ID'], [12, 'GOAL_PHASE'],
    [13, 'POSITION'], [14, 'LANCEMENT'], [15, 'LANCEMENT_REQUIS'], [16, 'DESTINATION'],
    [17, 'GUIDE_ITEMS'], [18, 'MOMENT_ID'], [19, 'DISPLAY_ROLE'], [20, 'PARALLEL_ID'],
    [21, 'PARALLEL_PHASE'],
  ];
  if (expectedHeaders.some(([index, label]) => cell(headers, index) !== label)) {
    throw new Error('Colonnes ROUTE inattendues : les colonnes techniques jusqu’à PARALLEL_PHASE sont obligatoires.');
  }

  const blocks: RouteBlock[] = [];
  const steps: RouteStep[] = [];
  let currentBlock: RouteBlock | undefined;
  let stepOrder = 0;

  for (let index = 1; index < formattedRows.length; index += 1) {
    const formatted = formattedRows[index] ?? [];
    const formula = formulaRows[index] ?? [];
    const rawType = cell(formatted, 1);
    const rawTitle = cell(formatted, 2);
    const sheetRow = index + 5;

    if (!rawType && !rawTitle) continue;
    const block = !rawType ? parseBlock(rawTitle) : undefined;
    if (block) {
      currentBlock = block;
      blocks.push(block);
      continue;
    }
    if (!rawType && rawTitle === '▶ À FAIRE') continue;
    if (!rawType) throw new Error(`Ligne Sheet ${sheetRow}: TYPE vide pour « ${rawTitle} »`);
    if (!currentBlock) throw new Error(`Ligne Sheet ${sheetRow}: étape rencontrée avant le premier bloc.`);

    const mapping = typeMap[rawType];
    if (!mapping) throw new Error(`Ligne Sheet ${sheetRow}: TYPE inconnu « ${rawType} »`);

    const id = cell(formatted, 10);
    if (!id) throw new Error(`Ligne Sheet ${sheetRow}: STEP_ID manquant.`);

    const action = cell(formatted, 8);
    const goalId = cell(formatted, 11);
    const goalPhase = parseLifecyclePhase(cell(formatted, 12), sheetRow, 'GOAL_PHASE');
    const parallelId = cell(formatted, 20);
    const parallelPhase = parseLifecyclePhase(cell(formatted, 21), sheetRow, 'PARALLEL_PHASE') as ParallelPhase | undefined;

    if (goalPhase && !goalId) throw new Error(`Ligne Sheet ${sheetRow}: GOAL_PHASE défini sans GOAL_ID.`);
    if (goalId && !goalPhase && mapping.type !== 'hard_lock') throw new Error(`Ligne Sheet ${sheetRow}: GOAL_ID défini sans GOAL_PHASE.`);
    if (mapping.type === 'long_running' && (!goalId || !goalPhase)) throw new Error(`Ligne Sheet ${sheetRow}: FIL ROUGE sans GOAL_ID/GOAL_PHASE.`);
    if (action.includes('FIL ROUGE') && (!goalId || !goalPhase)) throw new Error(`Ligne Sheet ${sheetRow}: action « ${action} » sans GOAL_ID/GOAL_PHASE.`);
    if (parallelPhase && !parallelId) throw new Error(`Ligne Sheet ${sheetRow}: PARALLEL_PHASE défini sans PARALLEL_ID.`);
    if (parallelId && !parallelPhase) throw new Error(`Ligne Sheet ${sheetRow}: PARALLEL_ID défini sans PARALLEL_PHASE.`);

    const hyperlink = parseHyperlinkFormula(cell(formula, 2));
    const prerequisites = cell(formatted, 3);
    const warning = cell(formatted, 4);
    const preparationText = prerequisites;
    const instruction = cell(formatted, 9);
    const location = parseCoordinate(cell(formatted, 13), sheetRow, 'POSITION');
    const launchInstruction = cell(formatted, 14);
    const launchRequired = parseBoolean(cell(formatted, 15), sheetRow);
    const destination = parseCoordinate(cell(formatted, 16), sheetRow, 'DESTINATION');
    const guideItems = parseGuideItems(cell(formatted, 17), sheetRow);
    const momentId = cell(formatted, 18);
    const displayRole = parseDisplayRole(cell(formatted, 19), sheetRow);
    const title = rawTitle.split('\n')[0]?.trim() || rawTitle;

    if (action.toUpperCase().includes('LANCER') && !launchRequired) throw new Error(`Ligne Sheet ${sheetRow}: action de lancement sans LANCEMENT_REQUIS=TRUE.`);
    if (launchRequired && !location && !launchInstruction) throw new Error(`Ligne Sheet ${sheetRow}: lancement requis sans POSITION ni LANCEMENT pour « ${title} ».`);
    if (displayRole && !momentId) throw new Error(`Ligne Sheet ${sheetRow}: DISPLAY_ROLE défini sans MOMENT_ID.`);

    stepOrder += 1;
    const step: RouteStep = {
      id,
      order: stepOrder,
      blockId: currentBlock.id,
      type: mapping.type,
      ...(mapping.displayType ? { displayType: mapping.displayType } : {}),
      ...(displayRole ? { displayRole } : {}),
      title,
      ...(mapping.type !== 'preparation' && prerequisites ? { prerequisites } : {}),
      ...(warning ? { warning } : {}),
      ...(action ? { action } : {}),
      ...(instruction ? { instruction } : {}),
      ...(hyperlink ? { source: { label: 'DPLN', url: hyperlink.url } } : {}),
      ...(momentId ? { momentId } : {}),
      ...(parallelId && parallelPhase ? { parallelGroup: { parallelId, phase: parallelPhase } } : {}),
      ...(location ? { location } : {}),
      ...(destination ? { destination } : {}),
      ...(launchInstruction ? { launchInstruction } : {}),
      ...(guideItems ? { guideItems } : {}),
      ...(mapping.type === 'preparation' ? { preparationItems: parsePreparationItems(preparationText || rawTitle) } : {}),
      ...(goalId && goalPhase ? { longRunningGoal: { goalId, phase: goalPhase } } : {}),
      ...(mapping.type === 'hard_lock' ? { hardLock: { ...(goalId ? { goalId } : {}), message: instruction || title } } : {}),
    };
    steps.push(step);
  }

  return validateRoute({
    schemaVersion: 1,
    routeVersion: process.env.ROUTE_VERSION?.trim() || new Date().toISOString().slice(0, 10),
    title: 'Astrub → Dofus Sylvestre',
    blocks,
    steps,
  });
}

async function main() {
  const spreadsheetId = requireEnv('ROUTE_SHEET_ID');
  const [formattedRows, formulaRows] = await Promise.all([
    fetchValues(spreadsheetId, 'FORMATTED_VALUE'),
    fetchValues(spreadsheetId, 'FORMULA'),
  ]);
  if (formattedRows.length !== formulaRows.length) throw new Error('Les lectures FORMATTED_VALUE et FORMULA ne couvrent pas les mêmes lignes.');
  const route = buildRoute(formattedRows, formulaRows);
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(route, null, 2)}\n`, 'utf8');
  console.log(`Route exportée : ${route.steps.length} étapes, ${route.blocks.length} blocs.`);
  console.log(`Fichier : ${OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});