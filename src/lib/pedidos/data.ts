/**
 * Camada de dados de Pedidos.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts` nem conhece Prisma. Quando o Neon entrar, troca-se o
 * corpo destas funcoes; a assinatura e as telas continuam iguais.
 *
 * A PONTE COM PRODUTOS
 *
 * O pedido guarda `productId`, e nao uma copia do produto — mas ele guarda
 * TAMBEM o nome e o preco do momento da venda, e essa redundancia e de
 * proposito: um pedido de junho precisa continuar dizendo R$ 179,00 depois que
 * o preco subir para R$ 199,00. O `productId` serve para LIGAR as duas pontas
 * (relatorio, estoque, link para o produto), e o nome/preco para o pedido nao
 * depender de um cadastro que muda.
 *
 * E por isso que este arquivo NAO reescreve `productName` a partir de
 * `lib/produtos`: fazer isso "consertaria" o historico. A ligacao com o
 * catalogo fica disponivel em `listOrderProductLinks`, que e leitura pura e nao
 * toca no pedido.
 *
 * TRES LEITURAS, NA ORDEM DAS DUAS ABAS
 *
 *   listOrders          -> a aba `Todos`        (adm-003)
 *   listTrackedOrders   -> a aba `Rastreamento` (adm-004)
 *   listOrderProductLinks -> a ponte Pedido -> Produto, para o relatorio
 *
 * O QUE ESTE ARQUIVO NAO FAZ
 *
 * Nao grava nada (nao ha `save*`): a unica escrita possivel nesta tela seria
 * mudar status ou lancar rastreio, e nenhum dos dois tem print. Criar um
 * `saveOrderStatus` sem print seria projetar a interface por antecipacao. O
 * `WriteResult` fica de fora de proposito, e a ausencia dele e a prova de que a
 * fase nao inventou a acao.
 */

import { DEMO_PRODUCTS_PRODUTOS } from '@/lib/produtos/demo';
import type { Product } from '@/lib/produtos/types';
import { DEMO_ORDERS_PEDIDOS, DEMO_TRACKED_ORDER } from './demo';
import { filterByTab, sortOrders, trackedOrders } from './metrics';
import type { Order, OrdersTab } from './types';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

/** Os pedidos, mais recente primeiro — a ordem de adm-003. */
export async function listOrders(options?: { signal?: AbortSignal }): Promise<Dataset<Order[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: sortOrders(DEMO_ORDERS_PEDIDOS), source: 'demo' };
}

/**
 * Os pedidos da aba `Rastreamento` (adm-004).
 *
 * Ordenados pela mesma regra da outra aba: o print mostra `Mariana` (14:56:54)
 * antes de `carinna` (14:45:30), que e a ordem de data decrescente.
 */
export async function listTrackedOrders(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<Order[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: sortOrders(trackedOrders(DEMO_ORDERS_PEDIDOS)), source: 'demo' };
}

/**
 * A ponte Pedido -> Produto -> Variacao.
 *
 * Devolve, por pedido, os itens que AINDA existem no catalogo, ligados ao
 * `Product` de verdade. Os itens cujo `productId` nao existe mais aparecem em
 * `missing` em vez de sumirem calados — um pedido que aponta para um produto
 * apagado e um problema de dado, e a tela de relatorio precisa saber disso.
 *
 * O que a ligacao NAO faz: reescrever o nome ou o preco do pedido. O que foi
 * vendido fica registrado no pedido; o que existe hoje fica no catalogo.
 */
export interface OrderProductLink {
  orderId: string;
  productId: string;
  /** O produto de hoje, ou `null` se ele saiu do catalogo. */
  product: Product | null;
  /** O que o pedido registrou na venda. */
  soldAs: string;
}

export async function listOrderProductLinks(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<OrderProductLink[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');

  const catalog = new Map(DEMO_PRODUCTS_PRODUTOS.map((product) => [product.id, product]));
  const links: OrderProductLink[] = [];
  for (const order of DEMO_ORDERS_PEDIDOS) {
    for (const item of order.items) {
      links.push({
        orderId: order.id,
        productId: item.productId ?? '',
        product: item.productId ? (catalog.get(item.productId) ?? null) : null,
        soldAs: item.productName,
      });
    }
  }
  return { data: links, source: 'demo' };
}

/** A contagem de cada uma das duas abas, para o `(N)` do chip. */
export async function listTabCounts(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<Record<OrdersTab, number>>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  const orders = DEMO_ORDERS_PEDIDOS;
  return {
    data: {
      todos: filterByTab(orders, 'todos').length,
      rastreamento: filterByTab(orders, 'rastreamento').length,
    },
    source: 'demo',
  };
}

export { DEMO_TRACKED_ORDER };
export type { Order, OrdersTab };
