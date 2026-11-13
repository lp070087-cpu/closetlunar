/**
 * Cadastra as pecas fotografadas pela loja (fotos MODA/SBNE) com as imagens
 * otimizadas em /public/produtos/loja. Idempotente (upsert por slug).
 * Os 6 produtos de exemplo do seed (sem foto) viram rascunho — nao somem.
 * Rodar: node prisma/produtos-fotos.mjs
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
for (const l of existsSync('.env') ? readFileSync('.env', 'utf8').split('\n') : []) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\r\n]*)"?/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const f = (n) => `/produtos/loja/foto-${String(n).padStart(2, '0')}.webp`;
const PECAS = [
  { slug: 'conjunto-verde-esmeralda', name: 'Conjunto Verde Esmeralda', price: 189.9, fotos: [30, 32, 29, 33], featured: true,
    description: 'Top regata com costas nadador e short de cintura alta em tecido com compressão. Toque macio, não marca e acompanha cada movimento.' },
  { slug: 'conjunto-top-cafe-short-saia', name: 'Conjunto Top Café + Short-Saia', price: 179.9, fotos: [31, 46, 38, 47], featured: true,
    description: 'Top de alcinha com bojo removível e short-saia preto com shortinho interno. Leve para o treino e lindo no dia a dia.' },
  { slug: 'conjunto-marinho-short-saia', name: 'Conjunto Marinho + Short-Saia', price: 179.9, fotos: [36, 37, 40],
    description: 'Regata azul-marinho ajustada e short-saia preto com shortinho interno, para treinar com liberdade.' },
  { slug: 'conjunto-preto-short-saia', name: 'Conjunto Preto Básico + Short-Saia', price: 179.9, fotos: [39, 41, 42, 53],
    description: 'O clássico que combina com tudo: regata preta de alcinha e short-saia com shortinho interno.' },
  { slug: 'conjunto-vinho-short-saia', name: 'Conjunto Vinho + Short-Saia', price: 179.9, fotos: [43, 45], featured: true,
    description: 'Top vinho de alcinha e short-saia preto. Cor marcante, caimento perfeito.' },
  { slug: 'conjunto-azul-ceu-flare', name: 'Conjunto Azul Céu Flare', price: 229.9, fotos: [51, 48, 49, 50, 52], featured: true,
    description: 'Top frente única com decote nas costas e calça flare de cintura alta que alonga a silhueta.' },
  { slug: 'conjunto-cinza-polo-saia', name: 'Conjunto Cinza Polo + Saia', price: 199.9, fotos: [57, 54],
    description: 'Blusinha estilo polo e saia com shortinho interno. Esportivo e elegante na medida certa.' },
  { slug: 'conjunto-terracota-flare', name: 'Conjunto Terracota Flare', price: 229.9, fotos: [59, 56, 55, 58], featured: true,
    description: 'Top frente única e calça flare em tom terracota. Conforto de ponta a ponta, do treino ao rolê.' },
];

const cat = await prisma.category.findUnique({ where: { slug: 'conjuntos' } });
for (const p of PECAS) {
  const imagens = p.fotos.map((n, i) => ({ url: f(n), alt: `${p.name} — foto ${i + 1}`, sortOrder: i }));
  const existente = await prisma.product.findUnique({ where: { slug: p.slug } });
  if (existente) {
    await prisma.productImage.deleteMany({ where: { productId: existente.id } });
    await prisma.product.update({ where: { id: existente.id }, data: { images: { create: imagens } } });
  } else {
    await prisma.product.create({
      data: {
        slug: p.slug, name: p.name, description: p.description, price: p.price, costPrice: 0,
        stock: 5, sizes: ['P', 'M', 'G'], status: 'active', featured: !!p.featured,
        categoryId: cat?.id ?? null, images: { create: imagens },
      },
    });
  }
}
const antigos = ['top', 'top-essential-sustentacao', 'kitnike', 'conjunto-glow-nude', 'legging-modeladora-premium', 'jaqueta-corta-vento'];
const r = await prisma.product.updateMany({ where: { slug: { in: antigos }, images: { none: {} } }, data: { status: 'draft' } });
console.log(`ok: ${PECAS.length} pecas com fotos; ${r.count} produtos de exemplo sem foto viraram rascunho`);
await prisma.$disconnect();
