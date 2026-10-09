import type { NextRequest } from 'next/server';
import { listCategories } from '@/lib/categorias/data';
import { listProducts } from '@/lib/produtos/data';

/**
 * `/sitemap.xml` — as paginas do site, no formato do `sitemap[.]xml.ts` do
 * original.
 *
 * ================== A BASE URL SAI DA REQUISICAO ==================
 *
 * Pelo mesmo motivo do `robots.txt`: o original escreve o dominio do Lovable
 * literal, e aqui nao ha dominio publicado. `request.nextUrl.origin` devolve o
 * host que atendeu — e o `loc` de cada entrada fica correto sem que ninguem
 * tenha que editar o arquivo quando o dominio existir.
 *
 * ================== AS ENTRADAS ==================
 *
 * As estaticas sao as do original (`/`, `/sobre`, `/buscar`, `/blog`) — menos
 * `/contato`, que **nao existe como rota** nem no original (o `Footer` aponta
 * `Contato` para `/sobre`). Listar uma URL que responde 404 seria o "link
 * interno falso" que a condicao de conclusao da fase proibe.
 *
 * Depois entram as categorias ATIVAS (a `atacado` esta inativa e nao entra) e os
 * produtos ativos. As datas vem do `updatedAt` do proprio registro — nao ha
 * `lastmod` inventado.
 */
const ESTATICAS = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/sobre', changefreq: 'monthly', priority: '0.5' },
  { path: '/buscar', changefreq: 'weekly', priority: '0.4' },
  { path: '/blog', changefreq: 'monthly', priority: '0.3' },
] as const;

function escaparXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface Entrada {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin;
  const [{ data: categorias }, { data: produtos }] = await Promise.all([
    listCategories(),
    listProducts(),
  ]);

  const entradas: Entrada[] = ESTATICAS.map((e) => ({
    loc: `${base}${e.path}`,
    changefreq: e.changefreq,
    priority: e.priority,
  }));

  for (const c of categorias.filter((x) => x.isActive)) {
    entradas.push({
      loc: `${base}/categoria/${c.slug}`,
      lastmod: c.updatedAt,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  for (const p of produtos.filter((x) => x.status === 'active')) {
    entradas.push({
      loc: `${base}/produto/${p.slug}`,
      lastmod: p.updatedAt,
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  const corpo = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entradas.map((e) =>
      [
        '  <url>',
        `    <loc>${escaparXml(e.loc)}</loc>`,
        e.lastmod ? `    <lastmod>${escaparXml(e.lastmod)}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    '</urlset>',
  ].join('\n');

  return new Response(corpo, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
