import { readFileSync } from 'node:fs';
const snapshot = JSON.parse(readFileSync(new URL('./route-export-snapshot.json', import.meta.url), 'utf8'));
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.hostname !== 'sheets.googleapis.com') return originalFetch(input, init);
  return new Response(JSON.stringify({ values: url.searchParams.get('valueRenderOption') === 'FORMULA' ? snapshot.formulas : snapshot.formatted }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
