import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(process.argv[2] || '.');
const source = path.join(root, 'public/produtos');
const target = path.join(source, 'otimizadas');
await fs.mkdir(target, { recursive: true });
const names = (await fs.readdir(source)).filter(name => /\.jpe?g$/i.test(name)).sort();
const photos = [];
for (const [index, name] of names.entries()) {
  const output = `foto-${String(index + 1).padStart(2, '0')}.webp`;
  await sharp(path.join(source, name)).rotate().resize({ width: 1200, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(target, output));
  const stat = await fs.stat(path.join(source, name));
  const meta = await sharp(path.join(source, name)).metadata();
  photos.push({ id: index + 1, original: name, url: `/produtos/otimizadas/${output}`, width: meta.width, height: meta.height, bytes: stat.size });
}
await fs.writeFile(path.join(root, 'src/lib/produtos/fotografias.json'), JSON.stringify(photos, null, 2) + '\n');
console.log(`Preparadas ${photos.length} fotografias WebP. Originais preservados. Nenhuma associação comercial inferida.`);
