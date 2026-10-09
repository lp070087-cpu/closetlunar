/**
 * Dados de demonstracao de Campanhas.
 *
 * A LISTA E VAZIA, E ISSO E O QUE O MATERIAL MOSTRA.
 *
 * Os QUATRO prints desta tela (adm-006, adm-015, adm-016, adm-017) mostram, todos
 * eles, `0 campanha(s)`:
 *
 *   adm-006   `0 campanha(s)`, tabela so com o cabecalho, os dois cards vazios
 *   adm-015   `0 campanha(s)`, tabela com `Nenhuma campanha ativa no momento.`
 *             E o card `Cupons mais usados` com `CLOSET10 · 0 usos`
 *   adm-016   o formulario `Nova Campanha` aberto, com a tabela vazia por baixo
 *   adm-017   a mesma tela rolada
 *
 * Ou seja: NAO EXISTE, em referencia nenhuma, uma campanha preenchida. Inventar
 * tres campanhas de exemplo com nomes plausiveis seria a invencao mais facil
 * deste modulo — e a mais danosa, porque o dado de demonstracao passaria a ser a
 * unica prova visual de como uma linha se parece, e essa prova seria FALSA: ela
 * nao veio do material.
 *
 * A decisao e manter a lista vazia e deixar as funcoes de formatacao provadas
 * pela bancada com objetos construidos NO TESTE. Assim o unico estado que o
 * usuario ve e um estado que o material atesta, e a formatacao de uma linha
 * preenchida continua verificada — so que por um instrumento, e nao por um print
 * inventado.
 *
 * O MESMO VALE PARA OS DOIS CARDS DE DESEMPENHO. `Campanhas com mais venda` sem
 * dado nao aparece com nomes de exemplo.
 */

import type { Campaign, CampaignPerformance } from './types';

/** Vazia de proposito. Ver o bloco acima antes de acrescentar qualquer linha. */
export const DEMO_CAMPAIGNS: Campaign[] = [];

/**
 * O desempenho por campanha, tambem vazio.
 *
 * A entrada do card sao os USOS ja agrupados (ver `metrics.ts`), e nao as
 * campanhas: uma campanha que existe e nunca foi usada NAO entra no card — o
 * print vazio diz "Sem dados de uso.", e nao "campanhas com zero usos".
 */
export const DEMO_CAMPAIGN_PERFORMANCE: CampaignPerformance[] = [];
