/** Linha de Order (Prisma, com items) -> Order do dominio. Compartilhado por admin e area da cliente. */
import { numero, iso, statusPedido, metodoPagamento } from '@/lib/data/mapear';
import type { Order, ShippingStatus } from './types';

const ENTREGA: ShippingStatus[] = [
  'aguardando_postagem', 'postado', 'em_transito', 'saiu_para_entrega', 'entregue', 'extraviado', 'devolvido',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function paraOrder(l: any): Order {
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

