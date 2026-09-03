const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const chunkPaths = [1, 2, 3, 4, 5].map((index) =>
  path.resolve(`scripts/.route-payload.${index}.b64`),
);
const outputPath = path.resolve('data/route.json');
const payload = chunkPaths
  .map((chunkPath) => fs.readFileSync(chunkPath, 'utf8').trim())
  .join('');
const compressed = Buffer.from(payload, 'base64');
const json = zlib.brotliDecompressSync(compressed);
const parsed = JSON.parse(json.toString('utf8'));

if (!Array.isArray(parsed.blocks) || !Array.isArray(parsed.steps)) {
  throw new Error('Route matérialisée invalide : blocks/steps absents.');
}

fs.writeFileSync(outputPath, json);
console.log(`Route matérialisée : ${outputPath} (${parsed.blocks.length} blocs, ${parsed.steps.length} étapes)`);
