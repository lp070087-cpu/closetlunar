import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(process.argv[2] || '.');
const photos = JSON.parse(await fs.readFile(path.join(root, 'src/lib/produtos/fotografias.json'), 'utf8'));
const originals = (await fs.readdir(path.join(root, 'public/produtos'))).filter(name => /\.jpe?g$/i.test(name));
if (originals.length) assert.equal(photos.length, originals.length, 'Toda foto original disponível deve constar no inventário');
const optimized = (await fs.readdir(path.join(root, 'public/produtos/otimizadas'))).filter(name => name.endsWith('.webp'));
assert.equal(optimized.length, photos.length, 'Toda fotografia inventariada deve ter versão otimizada');
assert.equal(new Set(photos.map(photo => photo.url)).size, photos.length, 'URLs não podem colidir');
let originalBytes = 0;
let optimizedBytes = 0;
for (const photo of photos) {
  if (originals.length) assert.ok(originals.includes(photo.original), `Original ausente: ${photo.original}`);
  assert.ok(photo.url.startsWith('/produtos/otimizadas/'), 'URL deve ser local e otimizada');
  const target = path.join(root, 'public', photo.url);
  const decoded = await sharp(target).raw().toBuffer({ resolveWithObject: true });
  assert.ok(decoded.info.width > 0 && decoded.info.width <= 1200);
  assert.ok(decoded.info.height > 0 && decoded.info.height <= 1600);
  originalBytes += photo.bytes;
  optimizedBytes += (await fs.stat(target)).size;
}
assert.ok(optimizedBytes < originalBytes, 'O catálogo deve carregar menos bytes que os originais');
console.log(`PASS: ${photos.length} fotografias decodificadas, dimensões válidas. ${originals.length} originais locais verificados. ${originalBytes} → ${optimizedBytes} bytes.`);
