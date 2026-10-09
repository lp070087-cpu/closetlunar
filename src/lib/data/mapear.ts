/**
 * A TRADUCAO DO BANCO PARA O DOMINIO — de linha para tipo de tela.
 *
 * ================== ONDE ESTA A FASE 5 ENTRE O DEMO E O REAL ==================
 *
 * `data.ts` de cada dominio E o ponto de contato unico (a regra das Fases 2 e 3).
 * Hoje ele devolve `DEMO_*`. Amanha ele vai chamar o Prisma. O que falta entre os
 * dois NAO e uma abstracao nova: e a TRADUCAO — o banco guarda `Decimal` e
 * `DateTime`; a tela espera `number` e `string` ISO.
 *
 * Este arquivo e essa traducao, e ela e a parte que da para PROVAR sem banco:
 * recebe uma linha (com a forma que o schema descreve) e devolve o tipo do
 * dominio. Se o mapeamento estiver errado, a bancada pega hoje; sem ele, o erro
 * apareceria so na integracao, com o banco ja ligado.
 *
 * ================== AS FORMAS DE LINHA SAO DECLARADAS AQUI ==================
 *
 * Cada `LinhaX` abaixo espelha um `model` de `prisma/schema.prisma` — os mesmos
 * nomes de coluna, os mesmos opcionais, os mesmos tipos do Postgres (`Decimal`,
 * `DateTime`, `Json`, arrays `String[]`).
 *
 * **Isto NAO e `any` e nao e um `as`.** E o contrato que o Prisma vai satisfazer
 * quando `prisma generate` rodar: o tipo gerado pelo Prisma para `Product` tem
 * que ser ESTRUTURALMENTE compativel com `LinhaProduto`, e se nao for, o
 * `tsc` acusa na hora em que alguem ligar os dois. A bancada confere esta
 * compatibilidade campo a campo contra o `schema.prisma`.
 *
 * ================== AS TRES TRADUCOES QUE IMPORTAM ==================
 *
 *   1. **`Decimal` -> `number`.** O Postgres nao tem `float` para dinheiro, e o
 *      Prisma devolve `Decimal` (um objeto com precisao arbitraria). O dominio
 *      espera `number`. `Number()` aqui e a fronteira, e e o unico lugar onde a
 *      troca acontece — um `toNumber` espalhado por 20 telas divergiria.
 *
 *   2. **`DateTime` -> string ISO.** O dominio usa ISO e RECORTA o dia do texto
 *      (`dataCurta`, `dataVenda`), porque `new Date(...)` desloca o dia em BRT
 *      (ver `feedback_data_iso_e_utc_meia_noite`). `toISOString()` preserva isso.
 *
 *   3. **`null` continua `null`.** Um campo opcional do banco NAO vira `''` nem
 *      `0`: `null` e "nao ha", e a tela ja desenha o travessao para ele. O
 *      `null` virando zero foi o defeito registrado em `project_null_vira_zero`.
 */

import type { ProductStatus, Product, ProductImage, ProductColor } from '@/lib/produtos/types';
import type { Category } from '@/lib/categorias/types';
import type { OrderStatus } from '@/lib/pedidos/types';
import type { EstadoPagamento } from '@/lib/pagamento/provider';

/* ==========================================================================
 * As formas de LINHA — espelho de `prisma/schema.prisma`
 * ========================================================================== */

/** O que o Postgres devolve para dinheiro. O Prisma entrega `Decimal`. */
export type Decimal = { toString(): string } | number | string;

/** O que o Postgres devolve para `timestamp`. O Prisma entrega `Date`. */
export type Momento = Date | string;

export interface LinhaCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageAlt: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
  introText: string;
  createdAt: Momento;
  updatedAt: Momento;
  /** Contado na leitura, e nao gravado — ver `BACKEND-MAP.md`. */
  _count?: { products: number };
}

export interface LinhaProductColor {
  id: string;
  name: string;
  hex: string;
  stock: number | null;
  sortOrder?: number;
}

export interface LinhaProductImage {
  id: string;
  url: string;
  alt: string;
  sortOrder?: number;
}

export interface LinhaProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string | null;
  price: Decimal;
  costPrice: Decimal;
  promoPrice: Decimal | null;
  compareAtPrice: Decimal | null;
  stock: number;
  sizes: string[];
  status: string;
  featured: boolean;
  images: LinhaProductImage[];
  colors: LinhaProductColor[];
  createdAt: Momento;
  updatedAt: Momento;
}

export interface LinhaOrder {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentExternalId: string | null;
  shippingPrice: Decimal;
  discount: Decimal;
  couponCode: string | null;
  subtotal: Decimal;
  total: Decimal;
  shippingKind: string | null;
  carrier: string | null;
  trackingCode: string | null;
  shippingStatus: string | null;
  shipmentMethod: string | null;
  addressZip: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  status: string;
  placedAt: Momento;
}

/* ==========================================================================
 * As conversoes primitivas
 * ========================================================================== */

/**
 * Dinheiro -> numero do dominio.
 *
 * `null` -> `0` SO nos campos que o dominio declara `number` (nao-opcionais).
 * Um campo OPCIONAL tem que passar por `numeroOuNull`, senao `null` viraria `0`
 * e a tela diria "R$ 0,00" onde o dado e "sem preco".
 */
export function numero(v: Decimal | null | undefined): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v.toString());
  return Number.isFinite(n) ? n : 0;
}

/** Dinheiro OPCIONAL -> `number | null`. `null` continua `null`. */
export function numeroOuNull(v: Decimal | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return numero(v);
}

/** `Date` -> ISO. Uma string ja ISO passa intacta (nao reinterpreta o fuso). */
export function iso(v: Momento | null | undefined): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.toISOString();
}

/**
 * O `status` do banco -> a uniao fechada do dominio.
 *
 * O banco guarda a coluna como `enum`; se por algum motivo vier um valor que o
 * dominio nao conhece, o fallback e `draft`/`novo` — o lado que NAO publica.
 * Inventar um valor novo seria pior: a tela imprimiria um estado que nao existe.
 */
export function statusProduto(v: string): ProductStatus {
  return v === 'active' || v === 'archived' || v === 'draft' ? v : 'draft';
}

export function statusPedido(v: string): OrderStatus {
  const validos: OrderStatus[] = ['novo', 'pago', 'separacao', 'enviado', 'entregue', 'cancelado'];
  return (validos as string[]).includes(v) ? (v as OrderStatus) : 'novo';
}

/* ==========================================================================
 * Os mapeadores — linha -> tipo de dominio
 * ========================================================================== */

export function paraImagem(l: LinhaProductImage): ProductImage {
  return { id: l.id, url: l.url, alt: l.alt ?? '' };
}

export function paraCor(l: LinhaProductColor): ProductColor {
  return {
    id: l.id,
    name: l.name,
    hex: l.hex,
    // As imagens por cor chegam numa leitura dedicada; aqui a cor vem sozinha.
    images: [],
    stock: l.stock === null ? null : l.stock,
  };
}

export function paraProduto(l: LinhaProduct): Product {
  const imagens = [...l.images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const cores = [...l.colors].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return {
    id: l.id,
    name: l.name,
    slug: l.slug,
    description: l.description ?? '',
    // `null` no banco e `''` no dominio: `categoryId: ''` e o "— Sem categoria —"
    // do formulario. A conversao e explicita, e nao um `??` no meio da tela.
    categoryId: l.categoryId ?? '',
    price: numero(l.price),
    costPrice: numero(l.costPrice),
    promoPrice: numeroOuNull(l.promoPrice),
    compareAtPrice: numeroOuNull(l.compareAtPrice),
    images: imagens.map(paraImagem),
    colors: cores.map(paraCor),
    sizes: [...l.sizes],
    stock: l.stock,
    status: statusProduto(l.status),
    featured: l.featured,
    createdAt: iso(l.createdAt),
    updatedAt: iso(l.updatedAt),
  };
}

/**
 * A categoria do BANCO para o dominio de `categorias`.
 *
 * O `productCount` e CONTADO na leitura (o `BACKEND-MAP.md` explica: gravar um
 * contador o faz divergir no dia em que uma peca muda de categoria). Ele sai do
 * `_count` da consulta — e quando a consulta nao o pedir, o valor e `0`, e nao
 * um numero inventado.
 */
export function paraCategoria(l: LinhaCategory): Category {
  return {
    id: l.id,
    name: l.name,
    slug: l.slug,
    image: l.imageUrl ? { id: `${l.id}-img`, url: l.imageUrl, alt: l.imageAlt ?? l.name } : null,
    sortOrder: l.sortOrder,
    isActive: l.isActive,
    productCount: l._count?.products ?? 0,
    metaTitle: l.metaTitle ?? '',
    metaDescription: l.metaDescription ?? '',
    introText: l.introText ?? '',
    createdAt: iso(l.createdAt),
    updatedAt: iso(l.updatedAt),
  };
}

/** A categoria LEVE, a de `produtos/types.ts` — o subconjunto `{id,name,slug}`. */
export function paraCategoriaLeve(l: Pick<LinhaCategory, 'id' | 'name' | 'slug'>) {
  return { id: l.id, name: l.name, slug: l.slug };
}

/**
 * O pedido do banco para o dominio de `pedidos`.
 *
 * Os quatro blocos do dominio (cliente, pagamento, entrega, endereco) sao
 * COLUNAS no banco — o `BACKEND-MAP.md` explica por que: eles nao existem fora
 * do pedido. A remontagem devolve a mesma FORMA que o original tinha, para a
 * tela nao precisar saber que o armazenamento mudou.
 *
 * `shippingStatus` e `shippingKind` sao `string | null` no banco e unioes no
 * dominio. Um valor desconhecido vira `null` — "nao tem postagem" —, e nao um
 * estado inventado que a tela imprimiria.
 */
export function paraPedido(l: LinhaOrder) {
  return {
    id: l.id,
    code: l.code,
    placedAt: iso(l.placedAt),
    status: statusPedido(l.status),
    customer: {
      name: l.customerName,
      phone: l.customerPhone,
      email: l.customerEmail,
    },
    payment: {
      method: metodoPagamento(l.paymentMethod),
      /** O estado neutro do pagamento — ver `lib/pagamento/provider.ts`. */
      status: estadoPagamento(l.paymentStatus),
      externalId: l.paymentExternalId,
      shippingPrice: numero(l.shippingPrice),
      discount: numero(l.discount),
      couponCode: l.couponCode,
      subtotal: numero(l.subtotal),
      total: numero(l.total),
    },
    shipping: {
      kind: l.shippingKind === 'propria' || l.shippingKind === 'transportadora' ? l.shippingKind : null,
      carrier: l.carrier,
      trackingCode: l.trackingCode,
      status: statusEntrega(l.shippingStatus),
      shipmentMethod: l.shipmentMethod,
    },
    address: {
      zip: l.addressZip,
      street: l.addressStreet,
      number: l.addressNumber,
      complement: l.addressComplement,
      district: l.addressDistrict,
      city: l.addressCity,
      state: l.addressState,
    },
  };
}

/** O metodo de pagamento: um valor fora da lista cai em `pix` (o mais comum). */
export function metodoPagamento(v: string): 'pix' | 'cartao' | 'boleto' {
  return v === 'cartao' || v === 'boleto' || v === 'pix' ? v : 'pix';
}

/**
 * O ESTADO do pagamento.
 *
 * Um valor desconhecido cai em `pendente` — o lado que NAO afirma que a compra
 * foi paga. Se um dia um provider gravar um estado que este projeto nao conhece,
 * o pedido aparece como pendente ate alguem traduzir o vocabulario; o contrario
 * (cair em `pago`) transformaria um estado desconhecido numa venda confirmada.
 */
export function estadoPagamento(v: string | null | undefined): EstadoPagamento {
  return v === 'pago' || v === 'recusado' || v === 'processando' || v === 'pendente' ? v : 'pendente';
}

/** O estado da POSTAGEM. `null` = o pedido nao tem postagem — ver o tipo. */
export function statusEntrega(v: string | null): string | null {
  const validos = [
    'aguardando_postagem',
    'postado',
    'em_transito',
    'saiu_para_entrega',
    'entregue',
    'extraviado',
    'devolvido',
  ];
  return v && validos.includes(v) ? v : null;
}
