/**
 * A demonstração de Busca — e a razão de ser VAZIA.
 *
 * ================== O PRINT MOSTRA O VAZIO, E O VAZIO É O DADO HONESTO ==================
 *
 * `235943.png` (adm-068) traz as duas listas em estado vazio: `Termos mais
 * pesquisados` com `Sem dados ainda.` e `Buscas sem resultado` com `Nenhuma —
 * ótimo trabalho!`. É o mesmo caso de Favoritos: `search_terms` numa loja
 * recém-instalada não tem linha, e não há termo nenhum para listar.
 *
 * Inventar termos plausíveis ("vestido", "legging preta") faria a tela AFIRMAR
 * buscas que ninguém fez — e o admin decidiria palavra-chave de catálogo a partir
 * de um dado falso. Pior: o estado vazio (que é o do print) nunca seria
 * exercitado. A lista vazia é o dado certo.
 *
 * As duas listas da tela saem DAS MESMAS LINHAS cruas — `aggregateSearch` as
 * separa. Sem linha nenhuma, as duas saem vazias, e é o que o print mostra.
 */

import type { SearchTermRow } from './types';

/** Tantos termos quanto o print registra: nenhum. */
export const DEMO_SEARCH_TERMS: SearchTermRow[] = [];
