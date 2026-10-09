/**
 * A BUSCA do catalogo — pura, sem React e sem I/O.
 *
 * ================== POR QUE ELA MORA AQUI, E NAO EM `lib/busca` ==================
 *
 * `lib/busca` JA existe, e e OUTRA COISA: ele agrega a tabela `search_terms` para
 * o painel do admin ver os termos mais buscados (`topSearchTerms`,
 * `aggregateSearch`). Aquilo e ANALYTICS da busca.
 *
 * Este arquivo e a BUSCA em si — o que casa um termo com uma peca. Ele mora em
 * `lib/produtos/` porque o que ele conhece e o PRODUTO: o nome, a descricao, a
 * cor, a categoria. Se ele fosse para `lib/busca`, teria de importar produtos de
 * qualquer jeito, e a dependencia ficaria invertida.
 *
 * ================== O ALGORITMO E O DO ORIGINAL ==================
 *
 * Transcrito do `search.ts` do original, que e bem definido e testavel:
 *
 *   1. `normalizar` — minusculas, sem acento (`NFD` + remocao de diacriticos),
 *      pontuacao vira espaco. E o que faz `Tops` casar com `tops` e `básica` com
 *      `basica`.
 *   2. Para cada TOKEN do termo, uma pontuacao:
 *      - substring no texto: `1` (ou `0.6` se o token tem menos de 3 letras);
 *      - se nao, distancia de edicao (Damerau-Levenshtein) contra cada palavra,
 *        com orcamento `1` para tokens de ate 5 letras e `2` acima disso — e so
 *        para tokens com 4+ letras, para nao casar `p` com qualquer coisa.
 *   3. Reforco quando o token aparece no NOME: `+0.8`, e `+0.4` se comeca o nome.
 *   4. TODOS os tokens precisam casar (`matchedAll`), senao a peca sai.
 *   5. Destaque: `+0.2`.
 *
 * ================== O QUE MUDOU EM RELACAO AO ORIGINAL, E POR QUE ==================
 *
 * O `productHaystack` do original monta o texto com `sku`, `collection`, `tags`
 * e `keywords` — campos que **nao existem no `Product` deste projeto**. Manter a
 * chamada a eles nao compilaria, e inventar os campos seria inventar dado. O
 * texto aqui e montado com o que EXISTE: nome, descricao, nome da categoria,
 * nomes das cores e tamanhos. Sao os campos que o painel edita e que a cliente
 * ve — e um deles a mais do que o original usava (os tamanhos), porque buscar
 * `GG` e uma busca legitima.
 *
 * O `HAY_CACHE` do original e um `WeakMap` por produto. Aqui nao ha cache: a
 * funcao e pura sobre a lista recebida, e o cache so faz sentido num laco de
 * digitacao (que e do cliente, e nao do servidor). Se o autocompletar entrar, o
 * cache entra junto — no lugar onde ele serve.
 */

import type { Category, Product } from './types';

/** Minusculas, sem acento, pontuacao como espaco. */
export function normalizarBusca(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Damerau-Levenshtein com orcamento pequeno — a distancia de edicao do original. */
export function distancia(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  const dp: number[] = Array(bl + 1)
    .fill(0)
    .map((_, j) => j);
  for (let i = 1; i <= al; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= bl; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[bl];
}

/** A pontuacao de um token contra o texto. `0` = nao casou. */
export function pontuarToken(token: string, texto: string): number {
  if (!token) return 0;
  if (texto.includes(token)) return token.length >= 3 ? 1 : 0.6;
  // Fuzzy so para tokens de tamanho decente — senao `p` casaria com tudo.
  if (token.length < 4) return 0;
  const palavras = texto.split(' ');
  let melhor = 0;
  for (const w of palavras) {
    if (Math.abs(w.length - token.length) > 2) continue;
    const d = distancia(token, w);
    const orcamento = token.length <= 5 ? 1 : 2;
    if (d <= orcamento) {
      const s = 1 - d / Math.max(token.length, w.length);
      if (s > melhor) melhor = s * 0.8;
    }
  }
  return melhor;
}

/** O texto de busca de uma peca, com o nome da categoria resolvido. */
export function textoDeBusca(p: Product, nomeCategoria = ''): string {
  return normalizarBusca(
    [
      p.name,
      p.description ?? '',
      nomeCategoria,
      p.colors.map((c) => c.name).join(' '),
      p.sizes.join(' '),
    ].join(' '),
  );
}

export interface ResultadoBusca {
  produto: Product;
  score: number;
}

/**
 * A busca. Devolve as pecas que casam com TODOS os tokens, da maior pontuacao
 * para a menor.
 *
 * `categorias` entra para que o nome da categoria seja pesquisavel — buscar
 * `leggings` acha as pecas de leggings mesmo que a palavra nao esteja no nome.
 */
export function buscarProdutos(
  produtos: readonly Product[],
  termo: string,
  categorias: readonly Category[] = [],
): ResultadoBusca[] {
  const q = normalizarBusca(termo);
  if (!q) return [];

  const nomeDaCategoria = new Map(categorias.map((c) => [c.id, c.name]));
  const tokens = q.split(' ').filter(Boolean);
  const resultados: ResultadoBusca[] = [];

  for (const p of produtos) {
    const texto = textoDeBusca(p, nomeDaCategoria.get(p.categoryId) ?? '');
    const nome = normalizarBusca(p.name);
    let score = 0;
    let casouTudo = true;

    for (const t of tokens) {
      const s = pontuarToken(t, texto);
      if (s === 0) {
        casouTudo = false;
        break;
      }
      score += s;
      if (nome.includes(t)) score += 0.8;
      if (nome.startsWith(t)) score += 0.4;
    }

    if (casouTudo) {
      if (p.featured) score += 0.2;
      resultados.push({ produto: p, score });
    }
  }

  return resultados.sort((a, b) => b.score - a.score);
}

/** As categorias que casam com o termo — o autocompletar do original. */
export function sugerirCategorias(
  categorias: readonly Category[],
  termo: string,
  limite = 3,
): Category[] {
  const q = normalizarBusca(termo);
  if (!q) return [];
  return categorias
    .map((c) => ({ c, s: pontuarToken(q, normalizarBusca(c.name)) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limite)
    .map((x) => x.c);
}
