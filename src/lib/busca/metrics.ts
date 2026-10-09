/**
 * As métricas de Busca — PURAS.
 *
 * Sem React, sem I/O, sem relógio: nada aqui lê `Date.now()`. O recorte de
 * período (7/30/90 dias) NÃO acontece neste arquivo — ele é uma decisão da
 * camada de dados, que sabe traduzir "30 dias" para a data de corte. Aqui só
 * entram as linhas que já passaram pelo recorte, e o que sai são as duas listas
 * da tela. É a mesma regra de `lib/relatorios/metrics.ts`.
 *
 * ================== O QUE ESTE ARQUIVO DECIDE (e o de tela não) ==================
 *
 * Agrupar as buscas por termo, contar quantas foram, calcular a média de
 * resultados e separar as que não acharam nada. São QUATRO regras, e todas
 * aparecem nas duas listas do print — nenhuma pode morar dentro do JSX.
 */

import type { AggregatedTerm, SearchTermRow } from './types';

/**
 * QUANTOS TERMOS CADA LISTA MOSTRA — `slice(0, 20)` do original.
 *
 * Um termo por linha fica ilegível depois de vinte, e o topo é o que interessa:
 * uma busca que apareceu uma vez não é tendência. Vinte, e não dez, porque o
 * original diz vinte.
 */
export const TOP_TERMS = 20;

/** O recorte de período, em dias. A tela oferece exatamente estes três. */
export const SEARCH_WINDOWS = [7, 30, 90] as const;

/** O recorte ativo no print (adm-068): `Últimos 30 dias`. */
export const DEFAULT_WINDOW = 30;

/**
 * AGRUPA AS BUSCAS POR TERMO.
 *
 * ================== A CHAVE É `normalized || term` ==================
 *
 * `Camiseta` e `camiseta` são a MESMA busca, e contá-las em separado partiria em
 * duas a posição de um termo que na verdade é um só. Por isso a chave do
 * agrupamento é o `normalized` quando ele existe, e o próprio `term` quando é
 * `null`. Isso é do original, e o `||` é deliberado: um `normalized` vazio
 * (`''`) também cai no `term` — string vazia é `falsy`, e usar `''` como chave
 * juntaria TODOS os termos vazios num balde só.
 *
 * ================== O TERMO EXIBIDO É O PRIMEIRO DA LINHA CRUA ==================
 *
 * O rótulo fica com a PRIMEIRA grafia que apareceu daquele termo, e não é
 * recalculado depois: numa loja em que alguém busca `Camiseta` e depois
 * `camiseta`, a lista mostra `Camiseta` — a grafia que a cliente digitou. É o
 * que o original faz (`e = byTerm.get(key) ?? { term: r.term, ... }`), e trocar
 * por uma grafia "canônica" seria inventar um dado que o banco não tem.
 *
 * ================== A ORDEM ==================
 *
 * `Map` — e não um objeto simples — porque a iteração de um `Map` preserva a
 * ordem de INSERÇÃO, que é a ordem das linhas (mais recentes primeiro). Isso é o
 * que define o desempate da ordenação: `count` decrescente, e empate pela ordem
 * em que o termo apareceu. Um objeto com chaves numéricas reordenaria as chaves
 * sozinho, e o desempate mudaria — por isso `Map`.
 */
export function aggregateSearch(rows: readonly SearchTermRow[]): AggregatedTerm[] {
  type Accumulator = { term: string; total: number; results: number[] };
  const byTerm = new Map<string, Accumulator>();

  for (const row of rows) {
    const key = row.normalized || row.term;
    const acumulado = byTerm.get(key) ?? { term: row.term, total: 0, results: [] };
    acumulado.total += 1;
    acumulado.results.push(row.resultsCount ?? 0);
    byTerm.set(key, acumulado);
  }

  const lista: AggregatedTerm[] = [];
  for (const [, acumulado] of byTerm) {
    const avg = acumulado.results.reduce((a, b) => a + b, 0) / Math.max(acumulado.results.length, 1);
    lista.push({ term: acumulado.term, count: acumulado.total, avg });
  }

  return lista;
}

/** Uma lista ordenada por volume decrescente e cortada em `TOP_TERMS`. */
function topOf(lista: AggregatedTerm[]): AggregatedTerm[] {
  return [...lista].sort((a, b) => b.count - a.count).slice(0, TOP_TERMS);
}

/**
 * OS `Termos mais pesquisados` — a lista da esquerda.
 *
 * É a lista agrupada INTEIRA, ordenada e cortada: um termo aparece aqui mesmo
 * que não tenha achado nada, porque ele FOI pesquisado. O que separa as duas
 * listas é o `avg` (ver `emptySearchTerms`), e não a presença.
 */
export function topSearchTerms(rows: readonly SearchTermRow[]): AggregatedTerm[] {
  return topOf(aggregateSearch(rows));
}

/**
 * AS `Buscas sem resultado` — a lista da direita.
 *
 * ================== O CORTE É `avg === 0`, NÃO `resultsCount === 0` ==================
 *
 * Um termo só entra aqui se a MÉDIA de resultados for ZERO — ou seja, se
 * *nenhuma* das vezes que foi buscado devolveu produto. Um termo buscado cinco
 * vezes que achou resultado em três delas tem média `> 0` e NÃO é um problema de
 * catálogo. O `=== 0` é exato: uma média de `0.2` já significa que a busca
 * funciona às vezes, e arredondar para zero esconderia justamente o caso que a
 * dica da tela pede para corrigir. Ver a nota da Dica em `search-view.tsx`.
 */
export function emptySearchTerms(rows: readonly SearchTermRow[]): AggregatedTerm[] {
  return topOf(aggregateSearch(rows).filter((termo) => termo.avg === 0));
}

/**
 * O RÓTULO DE RESULTADOS DE UMA LINHA — `12x · 3 result.`.
 *
 * `Math.round` sobre a média, como o original: a média de `2.4` resultados vira
 * `2 result.`. Fica aqui, e não no `<span>`, para a bancada poder conferir o
 * texto — e para o dia em que o rótulo mudar de idioma, mudar num lugar só.
 */
export function resultsLabel(term: AggregatedTerm): string {
  return `${term.count}x · ${Math.round(term.avg)} result.`;
}

/** O rótulo de volume de uma busca sem resultado — `5x`, sem os resultados. */
export function countLabel(term: AggregatedTerm): string {
  return `${term.count}x`;
}
