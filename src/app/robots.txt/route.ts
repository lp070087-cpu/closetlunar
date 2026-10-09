import type { NextRequest } from 'next/server';

/**
 * `/robots.txt` — transcrito do `robots[.]txt.ts` do original.
 *
 * ================== A BASE URL SAI DA REQUISICAO, E NAO DE UM DOMINIO INVENTADO ==================
 *
 * O original escreve `https://closetlunar.lovable.app` literal, porque no Lovable
 * esse E o dominio. Aqui **nao ha dominio definido**: o site ainda nao foi
 * publicado, e escrever um dominio de producao seria inventar o endereco (a
 * mesma regra de `NÃO invente credenciais`). Entao a base vem de
 * `request.nextUrl.origin` — e o host REAL que atendeu o pedido. Quando o
 * dominio existir, ele aparece sozinho, sem tocar neste arquivo.
 *
 * As tres regras de `Disallow` sao as do original: `/admin`, `/conta` e
 * `/checkout`. As duas primeiras nao devem ser indexadas por serem areas; a
 * terceira, por ser uma tela de sacola.
 */
export function GET(request: NextRequest) {
  const base = request.nextUrl.origin;
  const linhas = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /conta',
    'Disallow: /conta/',
    'Disallow: /checkout',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ];
  return new Response(linhas.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
