/**
 * As métricas de Favoritos — PURAS.
 *
 * Sem React, sem I/O, sem relógio: nada aqui lê `new Date()`. Tudo o que entra
 * são as linhas já agrupadas, e o que sai é a lista pronta para desenhar. É a
 * mesma regra dos outros módulos (`lib/relatorios/metrics.ts`).
 *
 * ================== O ÚNICO DONO AQUI É A ORDEM ==================
 *
 * A tela mostra os produtos ordenados por número de salvamentos, MAIOR PRIMEIRO.
 * Essa é a única regra que o módulo tem, e ela mora aqui — não no `.sort()` do
 * JSX — porque uma ordem escrita dentro da tela não tem onde ser provada, e o
 * dia em que alguém inverter o `b - a` para `a - b` o typecheck não sente.
 */

import type { FavoriteRow } from './types';

/** O rótulo do produto sem categoria — o mesmo texto do original e do Relatórios. */
export const NO_CATEGORY_LABEL = 'Sem categoria';

/**
 * ORDENA POR SALVAMENTOS, do maior para o menor.
 *
 * `[...rows]` antes de ordenar: `sort` MUTA o array, e a lista que chega pode ser
 * um array do módulo (compartilhado) — ordenar no lugar o reordenaria para todo
 * mundo, e a próxima leitura da tela começaria de uma ordem que ninguém pediu.
 *
 * O EMPATE FICA COM A ORDEM DE ENTRADA, e não é um descuido: o original faz
 * `.sort((a, b) => b.count - a.count)` sem critério de desempate, e `sort` é
 * estável desde o ES2019. Acrescentar um `localeCompare` por nome inventaria uma
 * ordem que o material não tem — foi exatamente o defeito corrigido em Relatórios.
 */
export function sortByCount(rows: readonly FavoriteRow[]): FavoriteRow[] {
  return [...rows].sort((a, b) => b.count - a.count);
}

/**
 * O TEXTO DA CATEGORIA DE UMA LINHA — `Sem categoria` quando não há.
 *
 * Uma categoria em branco (`''`) conta como ausente junto com `null`: as duas
 * significam "não sei a categoria", e mostrar um vão vazio na segunda linha da
 * linha seria pior do que dizer o que é. O `.trim()` cobre o caso de um nome só
 * de espaços.
 */
export function categoryLabel(category: string | null | undefined): string {
  return category && category.trim() !== '' ? category : NO_CATEGORY_LABEL;
}

/**
 * A CONTAGEM FORMATADA — `5 ♥`.
 *
 * O coração vai junto do número porque é ele que dá sentido ao valor: um `5`
 * sozinho na ponta da linha poderia ser estoque, vendas ou qualquer outra coisa.
 * Fica aqui, e não escrito no `<span>`, para a bancada poder conferir o texto.
 */
export function countLabel(count: number): string {
  return `${count} ♥`;
}
