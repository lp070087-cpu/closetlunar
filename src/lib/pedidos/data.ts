'use server';

/**
 * Camada de dados de Pedidos — LIGADA AO BANCO (Neon/Prisma).
 *
 * `use server` + guarda de ADMIN: pedido tem dado pessoal da cliente (nome,
 * telefone, endereco). Sem sessao de admin a leitura devolve lista vazia.
 * Sem banco (desenvolvimento local), devolve o demo.
 */

import { temBanco } from '@/lib/db';
import { ler } from '@/lib/data/repositorio';
import { paraOrder } from './mapear-db';
import { sessaoAtual } from '@/lib/auth/guardas';
import { DEMO_ORDERS_PEDIDOS } from './demo';
import { filterByTab, sortOrders, trackedOrders } from './metrics';
import type { Order, OrdersTab } from './types';
import type { Product } from '@/lib/produtos/types';
import { listProducts } from '@/lib/produtos/data';

export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
}

async function todos(): Promise<Dataset<Order[]>> {
  if (temBanco()) {
    const s = await sessaoAtual();
    if (!s || s.papel !== 'admin') return { data: [], source: 'database' };
  }
  const r = await ler(DEMO_ORDERS_PEDIDOS, async (db) => {
    const linhas = await db.order.findMany({ include: { items: true }, orderBy: { placedAt: 'desc' }, take: 500 });
    return linhas.map(paraOrder);
  });
  return { data: r.data, source: r.source };
}

export async function listOrders(): Promise<Dataset<Order[]>> {
  const r = await todos();
  return { data: sortOrders(r.data), source: r.source };
}

export async function listTrackedOrders(): Promise<Dataset<Order[]>> {
  const r = await todos();
  return { data: sortOrders(trackedOrders(r.data)), source: r.source };
}

export interface OrderProductLink {
  orderId: string;
  productId: string;
  product: Product | null;
  soldAs: string;
}

export async function listOrderProductLinks(): Promise<Dataset<OrderProductLink[]>> {
  const [r, produtos] = await Promise.all([todos(), listProducts()]);
  const catalog = new Map(produtos.data.map((p) => [p.id, p]));
  const links: OrderProductLink[] = [];
  for (const order of r.data) {
    for (const item of order.items) {
      links.push({
        orderId: order.id,
        productId: item.productId ?? '',
        product: item.productId ? (catalog.get(item.productId) ?? null) : null,
        soldAs: item.productName,
      });
    }
  }
  return { data: links, source: r.source };
}

export async function listTabCounts(): Promise<Dataset<Record<OrdersTab, number>>> {
  const r = await todos();
  return {
    data: {
      todos: filterByTab(r.data, 'todos').length,
      rastreamento: filterByTab(r.data, 'rastreamento').length,
    },
    source: r.source,
  };
}

export type { Order, OrdersTab };
