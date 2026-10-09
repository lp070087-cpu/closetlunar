/**
 * Os dados de demonstração de Favoritos — e a razão de NÃO haver nenhum.
 *
 * ================== A LISTA É VAZIA, E ISSO É A RESPOSTA CERTA ==================
 *
 * O print (adm-067) mostra a tela em ESTADO VAZIO: o card com o texto `Nenhum
 * favorito registrado ainda.`. Não há tabela, não há nome de produto, não há
 * contagem. Não é um vazio "por enquanto" que eu deveria preencher para a tela
 * parecer melhor — é o estado que o banco de uma loja recém-instalada tem, porque
 * `wishlist` começa sem linha nenhuma.
 *
 * Escrever aqui alguns produtos "prováveis" faria a tela MENTIR sobre o banco: o
 * admin veria favoritos que ninguém salvou. A demonstração tem que poder mostrar
 * o vazio, senão o vazio nunca é testado — e é justamente o estado que o print
 * documenta. Ver a nota de `data.ts`.
 */

import type { FavoriteRow } from './types';

/** Tantos favoritos quanto o print mostra: nenhum. */
export const DEMO_FAVORITES: FavoriteRow[] = [];
