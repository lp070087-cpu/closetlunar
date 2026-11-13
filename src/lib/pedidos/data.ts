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
import { numero, iso, statusPedido, metodoPagamento } from '@/lib/data/mapear';
import { sessaoAtual } from '@/lib/auth/guardas';
import { DEMO_ORDERS_PEDIDOS } from './demo';
import { filterByTab, sortOrders, trackedOrders } from './metrics';
import type { Order, OrdersTab, ShippingStatus } from './types';
import type { Product } from '@/lib/produtos/types';
import { listProducts } from '@/lib/produtos/data';

export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
}

const ENTREGA: ShippingStatus[] = [
  'aguardando_postagem', 'postado', 'em_transito', 'saiu_para_entrega', 'entregue', 'extraviado', 'devolvido',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function paraOrder(l: any): Order {
  return {
    id: l.id,
    code: l.code,
    placedAt: iso(l.placedAt),
    status: statusPedido(l.status),
    paymentStatus: l.paymentStatus,
    customer: { name: l.customerName, phone: l.customerPhone, email: l.customerEmail },
    items: (l.items ?? []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      unitPrice: numero(i.unitPrice),
    })),
    payment: {
      method: metodoPagamento(l.paymentMethod),
      shippingPrice: numero(l.shippingPrice),
      discount: numero(l.discount),
      couponCode: l.couponCode,
      subtotal: numero(l.subtotal),
      total: numero(l.total),
    },
    shipping: {
      kind: l.shippingKind === 'propria' ? 'propria' : 'transportadora',
      carrier: l.carrier,
      trackingCode: l.trackingCode,
      status: ENTREGA.includes(l.shippingStatus) ? l.shippingStatus : null,
      shipmentMethod: l.shipmentMethod,
    },
    address: {
      street: [l.addressStreet, l.addressNumber, l.addressDistrict].filter(Boolean).join(', '),
      cep: l.addressZip,
      city: l.addressCity,
      state: l.addressState,
      complement: l.addressComplement || null,
    },
  };
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
