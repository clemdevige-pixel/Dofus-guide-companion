const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const payloadPath = path.resolve('scripts/.route-payload.br.b64');
const outputPath = path.resolve('data/route.json');
const payload = fs.readFileSync(payloadPath, 'utf8').trim();
const json = zlib.brotliDecompressSync(Buffer.from(payload, 'base64'));

JSON.parse(json.toString('utf8'));
fs.writeFileSync(outputPath, json);
console.log(`Route matérialisée : ${outputPath}`);
