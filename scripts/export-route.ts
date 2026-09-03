import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { RouteBlock, RouteDocument, RouteStep, StepType } from '../src/route/types';
import { validateRoute } from '../src/route/validation';

const DEFAULT_RANGE = 'ROUTE!A5:M1004';
const OUTPUT_PATH = resolve('data/route.json');

const typeMap: Record<string, { type: StepType; displayType?: string }> = {
  'QUÊTE': { type: 'quest' },
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
  'OPTI ALIGNEMENT': { type: 'rule', displayType: 'OPTI ALIGNEMENT' },
};

type SheetRow = string[];
type GoalPhase = 'start' | 'progress' | 'finish';

type GoogleAuth = {
  headers: Record<string, string>;
  query: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

function getAuth(): GoogleAuth {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN?.trim();
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY?.trim();

  if (accessToken) {
    return {
      headers: { Authorization: `Bearer ${accessToken}` },
      query: '',
    };
  }

  if (apiKey) {
    return {
      headers: {},
      query: `&key=${encodeURIComponent(apiKey)}`,
    };
  }

  throw new Error(
    'Authentification Google absente : définir GOOGLE_ACCESS_TOKEN ou GOOGLE_SHEETS_API_KEY.',
  );
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

function parseGoalPhase(rawPhase: string, sheetRow: number): GoalPhase | undefined {
  if (!rawPhase) {
    return undefined;
  }

  if (rawPhase === 'start' || rawPhase === 'progress' || rawPhase === 'finish') {
    return rawPhase;
  }

  throw new Error(`Ligne Sheet ${sheetRow}: GOAL_PHASE inconnu « ${rawPhase} »`);
}

function parseHyperlinkFormula(formula: string): { label: string; url: string } | undefined {
  if (!formula.startsWith('=HYPERLINK(')) {
    return undefined;
  }

  const match = formula.match(/^=HYPERLINK\("([^"]+)";"((?:[^"]|"")*)"\)$/i);
  if (!match) {
    throw new Error(`Formule HYPERLINK non supportée : ${formula}`);
  }

  return {
    url: match[1],
    label: match[2].replaceAll('""', '"'),
  };
}

function parseBlock(title: string): RouteBlock | undefined {
  const match = title.match(/^NOUVEAU BLOC\s+(\d+)\s+—\s+(.+)$/i);
  if (!match) {
    return undefined;
  }

  const order = Number.parseInt(match[1], 10);
  return {
    id: `block-${match[1].padStart(2, '0')}`,
    order,
    title: match[2].trim(),
  };
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
  if (formattedRows.length === 0) {
    throw new Error('Le Sheet ne contient aucune donnée dans la plage demandée.');
  }

  const headers = formattedRows[0] ?? [];
  if (
    cell(headers, 1) !== 'TYPE' ||
    cell(headers, 2) !== 'ÉTAPE' ||
    cell(headers, 10) !== 'STEP_ID' ||
    cell(headers, 11) !== 'GOAL_ID' ||
    cell(headers, 12) !== 'GOAL_PHASE'
  ) {
    throw new Error(
      'Colonnes ROUTE inattendues : TYPE, ÉTAPE, STEP_ID, GOAL_ID et GOAL_PHASE sont obligatoires.',
    );
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

    if (!rawType && !rawTitle) {
      continue;
    }

    const block = !rawType ? parseBlock(rawTitle) : undefined;
    if (block) {
      currentBlock = block;
      blocks.push(block);
      continue;
    }

    if (!rawType && rawTitle === '▶ À FAIRE') {
      continue;
    }

    if (!rawType) {
      throw new Error(`Ligne Sheet ${sheetRow}: TYPE vide pour « ${rawTitle} »`);
    }

    if (!currentBlock) {
      throw new Error(`Ligne Sheet ${sheetRow}: étape rencontrée avant le premier bloc.`);
    }

    const mapping = typeMap[rawType];
    if (!mapping) {
      throw new Error(`Ligne Sheet ${sheetRow}: TYPE inconnu « ${rawType} »`);
    }

    const id = cell(formatted, 10);
    if (!id) {
      throw new Error(`Ligne Sheet ${sheetRow}: STEP_ID manquant.`);
    }

    const goalId = cell(formatted, 11);
    const goalPhase = parseGoalPhase(cell(formatted, 12), sheetRow);
    if (goalPhase && !goalId) {
      throw new Error(`Ligne Sheet ${sheetRow}: GOAL_PHASE défini sans GOAL_ID.`);
    }

    const hyperlink = parseHyperlinkFormula(cell(formula, 2));
    const preparationText = cell(formatted, 3);
    const action = cell(formatted, 8);
    const instruction = cell(formatted, 9);
    const title = rawTitle.split('\n')[0]?.trim() || rawTitle;

    stepOrder += 1;
    const step: RouteStep = {
      id,
      order: stepOrder,
      blockId: currentBlock.id,
      type: mapping.type,
      ...(mapping.displayType ? { displayType: mapping.displayType } : {}),
      title,
      ...(action ? { action } : {}),
      ...(instruction ? { instruction } : {}),
      ...(hyperlink ? { source: { label: 'DPLN', url: hyperlink.url } } : {}),
      ...(mapping.type === 'preparation'
        ? { preparationItems: parsePreparationItems(preparationText || rawTitle) }
        : {}),
      ...(goalId && goalPhase
        ? { longRunningGoal: { goalId, phase: goalPhase } }
        : {}),
      ...(mapping.type === 'hard_lock'
        ? { hardLock: { ...(goalId ? { goalId } : {}), message: instruction || title } }
        : {}),
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

  if (formattedRows.length !== formulaRows.length) {
    throw new Error('Les lectures FORMATTED_VALUE et FORMULA ne couvrent pas les mêmes lignes.');
  }

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
