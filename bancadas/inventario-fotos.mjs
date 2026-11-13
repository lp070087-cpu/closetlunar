import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Originais preservados. Inventário e folhas de contato são saídas locais.
const root = path.resolve(process.argv[2] || '.');
const dir = path.join(root, 'public/produtos');
const out = path.join(root, '.tmp-prints/fotos');
await fs.mkdir(out, { recursive: true });
const names = (await fs.readdir(dir)).filter(n => /\.(jpe?g|png|webp)$/i.test(n)).sort();
const inventory = [];
for (const name of names) {
  const file = path.join(dir, name);
  const meta = await sharp(file).metadata();
  inventory.push({ file: name, width: meta.width, height: meta.height, bytes: (await fs.stat(file)).size, status: 'aguarda confirmação do produto' });
}
await fs.writeFile(path.join(out, 'inventario.json'), JSON.stringify(inventory, null, 2));
for (let start = 0; start < names.length; start += 20) {
  const composites = [];
  for (const [i, name] of names.slice(start, start + 20).entries()) {
    const thumb = await sharp(path.join(dir, name)).rotate().resize(210, 235, { fit: 'contain', background: 'white' }).jpeg().toBuffer();
    const label = Buffer.from(`<svg width="220" height="40"><rect width="220" height="40" fill="white"/><text x="5" y="17" font-size="11">${start + i + 1}: ${name.slice(0, 26)}</text></svg>`);
    composites.push({ input: thumb, left: (i % 5) * 220, top: Math.floor(i / 5) * 280 });
    composites.push({ input: label, left: (i % 5) * 220, top: Math.floor(i / 5) * 280 + 238 });
  }
  await sharp({ create: { width: 1100, height: 1120, channels: 3, background: '#eeeeee' } }).composite(composites).jpeg({ quality: 85 }).toFile(path.join(out, `contato-${start}.jpg`));
}
console.log(`${inventory.length} fotografias inventariadas. Originais preservados. Saída: ${out}`);
