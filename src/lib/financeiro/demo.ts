/**
 * Dados demonstrativos de Financeiro.
 *
 * ================== ESTE ARQUIVO QUASE NAO TEM DADO, E ISSO E O PONTO ==================
 *
 * Todo outro modulo do painel tem uma lista demo transcrita print a print
 * (`DEMO_AFFILIATES`, `DEMO_COUPONS`, `DEMO_ORDERS_PEDIDOS`). Este nao pode ter:
 * Financeiro e um RELATORIO, e o que ele mostra sao DERIVACOES dos pedidos que
 * ja existem. Inventar uma lista de pedidos aqui seria criar uma segunda fonte
 * de verdade para a mesma venda — a tela passaria a somar uma coisa e a tela de
 * Pedidos a mostrar outra.
 *
 * SO EXISTE UMA COISA A TRANSCREVER, e ela e a que o print mostra preenchida: os
 * CINCO CUSTOS de adm-024 (`40`, `4,99`, `100`, `3`, `0`). Eles sao os padroes do
 * original, e o print os exibe porque a chave `financial_costs` ainda nao existia
 * no banco de demonstracao — ou seja, o que se ve ali E o padrao.
 *
 * ================== POR QUE adm-023 SAI CERTO SEM PEDIDO NOVO ==================
 *
 * A pergunta legitima e: se este modulo nao inventa pedido, como a tela reproduz
 * os numeros do print? Porque OS NUMEROS DO PRINT SAEM DOS PEDIDOS QUE JA
 * EXISTEM — os cinco de adm-003, que sao de JUNHO/2026:
 *
 *   Faturamento total   R$ 1.252,71   <- 506,95 + 187,76 + 186 + 186 + 186
 *   Este mes (setembro) R$ 0,00       <- nenhum pedido e de setembro
 *   Faturamento por mes                  uma barra: 06/2026
 *   Vendas por dia                       eixo 09-01..09-27, linha no zero
 *
 * O print foi capturado em 27/09/2026 com `ESTE MES` selecionado — um periodo
 * VAZIO. "Total" mostra dinheiro (ele ignora o periodo); todo o resto mostra zero
 * (porque o periodo nao tem pedido). Nao ha nada a inventar: a demonstracao E o
 * encontro de um relatorio real com um periodo vazio.
 *
 * E POR ISSO QUE ESTA TELA NAO PRECISA DE RELOGIO CONGELADO. Ela usa a data de
 * verdade, como o original, e a bancada prova a RELACAO (o total vale 1.252,71
 * sempre; o periodo vale zero quando a janela nao cobre junho) em vez de fixar um
 * literal do print.
 */

import type { FinancialCosts } from './types';

/**
 * OS CINCO CUSTOS DE adm-024, na ordem em que o print os apresenta.
 *
 * `DEFAULT_COSTS` do original, sem alteracao de valor. Eles estao aqui — e nao
 * em `data.ts` — porque sao DADO DE DEMONSTRACAO: quando o Neon entrar, quem
 * responde por eles e a tabela `settings`, e este arquivo deixa de ser lido. A
 * tela nunca cai para o padrao silenciosamente: ver `data.ts`.
 */
export const DEMO_COSTS: FinancialCosts = {
  productCostPct: 40,
  paymentFeePct: 4.99,
  shippingCostPct: 100,
  packagingPerOrder: 3,
  fixedMonthly: 0,
};

/**
 * A CHAVE DA TABELA `settings` QUE GUARDA OS CUSTOS.
 *
 * UM `settings` COM CHAVE. O original guarda os cinco num unico registro
 * (`{ key: "financial_costs", value: { ... } }`) e faz `upsert` com
 * `onConflict: "key"` — um objeto JSON numa coluna, e nao cinco linhas. E por
 * isso que a leitura aqui e "um registro so" e nao uma lista: a forma do dado
 * segue o original.
 *
 * O NOME DA CHAVE E `financial_costs`, e nao `financeiro_costs`: e o que ja esta
 * gravado no banco de demonstracao do original, e trocar a grafia faria a tela
 * abrir com os padroes para sempre, sem erro nenhum — um defeito mudo.
 */
export const COSTS_KEY = 'financial_costs';
