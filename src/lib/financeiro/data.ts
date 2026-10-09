/**
 * Camada de dados de Financeiro.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa `demo.ts` nem `lib/pedidos/demo.ts`: a tela pede `listFinancialOrders`
 * e recebe pedidos, sem saber de onde vieram.
 *
 * ================== ESTE MODULO NAO CRIA OS PEDIDOS ==================
 *
 * Financeiro NAO tem tabela de pedido propria. Ele e um relatorio SOBRE a tabela
 * de pedidos, e por isso `listFinancialOrders` delega a `lib/pedidos/data.ts` —
 * que ja e a camada de dados validada daquela tela. Duplicar a leitura aqui
 * criaria dois lugares que precisam concordar sobre qual e o conjunto de vendas,
 * e o dia em que discordassem a tela de Pedidos e a de Financeiro mostrariam
 * numeros diferentes para a mesma loja.
 *
 * O QUE ESTA FUNCAO ACRESCENTA, entao, e so uma coisa: ela pede os pedidos
 * COMPLETOS (a tela de Pedidos lista cartoes; aqui precisa de `payment.subtotal`
 * e `payment.shippingPrice`, que a de la nao usa). O `WriteResult` e o `Dataset`
 * seguem o mesmo contrato do resto do painel.
 *
 * ================== O QUE VAI DEPENDER DO NEON ==================
 *
 *   1. `settings` — a chave `financial_costs` guardando os cinco custos num
 *      registro unico (`{ key, value }`), como o original. O `upsert` e por
 *      `key`; sem indice unico em `key`, dois salvamentos simultaneos criariam
 *      duas linhas e a proxima leitura pegaria uma delas por acaso.
 *
 *   2. `orders` — a leitura por PERIODO. O original filtra no banco
 *      (`.gte("created_at", start).lte("created_at", end)`) e busca `total`,
 *      `subtotal`, `shipping_price`, `status`, `payment_method`, `created_at`.
 *      Aqui o recorte e feito em `metrics.ts`, sobre a lista inteira — o que e
 *      correto enquanto sao cinco pedidos, e o que muda quando a tabela crescer:
 *      trazer cinco anos de pedidos para somar o mes corrente nao escala. A
 *      assinatura de `listFinancialOrders` ja recebe a janela para que essa troca
 *      seja de CORPO, e nao de interface.
 *
 *   3. Nada mais. Nao ha tabela de custo, de despesa, de lancamento nem de
 *      categoria: esta tela NAO tem CRUD. O unico dado que a pessoa grava sao os
 *      cinco numeros de estimativa.
 *
 * ================== A DECISAO DE `persisted: false` ==================
 *
 * `saveCosts` nao grava. O original faz `upsert` e depois `toast.success("Custos
 * salvos")`; aqui a tela DIZ que nada foi gravado em vez de confirmar. Copiar a
 * confirmacao faria a pessoa achar que os custos estao guardados quando a conta
 * de lucro toda seria recalculada com eles — e eles sumiriam no proximo
 * carregamento, sem aviso.
 *
 * Os numeros DIGITADOS continuam valendo durante a sessao (a tela atualiza o
 * estado local), porque ver a conta de lucro reagir ao valor digitado e o que
 * torna o bloco util. O que nao se finge e a GRAVACAO.
 */

import { listOrders as listPedidosOrders, type Dataset } from '@/lib/pedidos/data';
import type { Order } from '@/lib/pedidos/types';
import type { DateWindow, FinancialCosts } from './types';
import { DEMO_COSTS, COSTS_KEY } from './demo';

export type { Dataset };

export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/* ------------------------------------------------------------------ leituras */

/**
 * OS PEDIDOS QUE ALIMENTAM A TELA.
 *
 * A janela entra como parametro e NAO e usada ainda: o recorte acontece em
 * `metrics.ts`, sobre a lista completa, para que o mesmo conjunto sirva ao total
 * (que ignora o periodo) e ao recorte (que depende dele). Quando o Neon entrar, e
 * aqui que o `where` de data entra — e a assinatura nao muda. Ver o cabecalho.
 */
export async function listFinancialOrders(options?: {
  window?: DateWindow;
  signal?: AbortSignal;
}): Promise<Dataset<Order[]>> {
  return listPedidosOrders(options?.signal ? { signal: options.signal } : undefined);
}

/**
 * OS CINCO CUSTOS SALVOS.
 *
 * Devolve o PADRAO enquanto nao ha banco — que e, literalmente, o estado do
 * print: a chave nao existia e a tela mostrou os `DEFAULT_COSTS`. As duas fontes
 * ficam separadas por `source`, como em todo o painel, para a tela poder dizer
 * que o numero nao veio do banco.
 */
export async function getCosts(options?: { signal?: AbortSignal }): Promise<Dataset<FinancialCosts>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_COSTS, source: 'demo' };
}

/* ------------------------------------------------------------------ escritas */

/**
 * SALVA OS CUSTOS. Nao grava — ver a decisao no cabecalho.
 *
 * A funcao existe (em vez de a tela mudar o estado direto) para que o dia do
 * Neon seja uma troca de corpo: aqui entra o `upsert` em `settings` por
 * `COSTS_KEY`, e a tela ja trata os dois resultados.
 */
export async function saveCosts(costs: FinancialCosts): Promise<WriteResult<FinancialCosts>> {
  return { data: costs, persisted: false, reason: PENDING_REASON };
}

/**
 * EXPORTA — os dois botoes de adm-023.
 *
 * ================== SEM IMPLEMENTACAO, E DECLARADO ==================
 *
 * O print mostra `EXPORTAR CSV` e `EXPORTAR PDF` no canto direito da linha de
 * filtros. O original implementa os dois, e a implementacao dele diz O QUE ELES
 * FAZEM — entao o comportamento esta documentado e nao ha o que inventar:
 *
 *   CSV   uma linha por pedido do periodo, com o cabecalho
 *         `Data · Pedido · Status · Pagamento · Subtotal · Frete · Desconto ·
 *         Total`, com BOM `﻿` na frente (sem ele o Excel abre `R$` e acentos
 *         errados) e o nome `financeiro-<periodo>-<timestamp>.csv`.
 *
 *   PDF   nao gera PDF: abre uma JANELA NOVA com o relatorio em HTML e chama
 *         `window.print()`. O texto do botao da janela e `Imprimir / Salvar como
 *         PDF`. Ou seja, o segundo botao e um atalho para a impressao do
 *         navegador.
 *
 * ESTE ARQUIVO NAO OS IMPLEMENTA, e a razao e a mesma que separa dado de tela:
 * `exportCSV` monta um `Blob` e um `URL.createObjectURL`; `exportPDF` escreve num
 * `window.open`. Os dois sao DOM puro e nao tem o que fazer numa camada de dados
 * — chamar de `data.ts` seria mentir sobre o que o arquivo e.
 *
 * O componente `ExportButtons` DESENHA os dois botoes — eles existem, com o
 * rotulo do print — e o clique cai em `data-export="pendente"`, um alvo
 * DECLARADO e nao um botao morto. Ver o cabecalho daquele componente para por
 * que nao se implementa a exportacao agora: um `Blob` que o navegador baixa nao
 * e verificavel pela bancada (ela roda em Node, sem `URL.createObjectURL`), e
 * uma prova que nao pode falhar nao e prova. Quando houver navegador na
 * verificacao, os dois entram.
 */

export { PENDING_REASON, COSTS_KEY };
