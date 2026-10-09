/**
 * Contas financeiras de um produto.
 *
 * Modulo PURO, sem React e sem I/O: recebe numeros, devolve numeros. Isso e
 * deliberado — e aqui que moram os defeitos de dinheiro (null virando zero,
 * margem dividida por zero, desconto negativo), entao precisa ser testavel
 * isoladamente.
 *
 * Espelha exatamente as contas que os prints mostram:
 *   LUCRO BRUTO     = preco de venda - preco de custo
 *   MARGEM DE LUCRO = lucro / preco de venda * 100   ("0.00%" com uma casa)
 *   barra de margem = verde > 40%, ambara > 20%, vermelha abaixo disso
 *   chip de estoque = rosa quando <= 5, verde acima disso
 */

import type { Product, ProductColor } from './types';

/** Converte qualquer entrada em numero finito. `null` e `''` viram 0. */
export function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
    if (!normalized) return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Lucro bruto em reais. Nunca negativo por arredondamento. */
export function grossProfit(price: number | string, costPrice: number | string): number {
  const value = toNumber(price) - toNumber(costPrice);
  return Math.round(value * 100) / 100;
}

/**
 * Margem de lucro em porcentagem.
 *
 * Preco zero devolve ZERO, nao `Infinity` nem `NaN`: uma peca sem preco ainda
 * nao tem margem, e a tela precisa mostrar `0.00%` como nos prints.
 */
export function profitMargin(price: number | string, costPrice: number | string): number {
  const sale = toNumber(price);
  if (sale <= 0) return 0;
  const margin = (grossProfit(sale, costPrice) / sale) * 100;
  return Math.round(margin * 10) / 10;
}

/** Margem formatada como nos prints: `49.7%`, `100.0%`, `0.00%` sem preco. */
export function formatMargin(margin: number): string {
  return `${margin.toFixed(1)}%`;
}

export type MarginTone = 'success' | 'warning' | 'danger';

/** Cor da barra de margem, pelos cortes medidos nos prints. */
export function marginTone(margin: number): MarginTone {
  if (margin > 40) return 'success';
  if (margin > 20) return 'warning';
  return 'danger';
}

/** Estoque baixo: chip rosa. O corte e 5 unidades, igual a referencia. */
export function isLowStock(stock: number): boolean {
  return stock <= 5;
}

/**
 * Par de precos no formato que a tela tem em maos.
 *
 * Aceita `number | string` de proposito: o produto salvo chega com numero, mas
 * o formulario guarda o que a pessoa digitou, que e string (`ProductDraft`).
 * Os dois formatos descrevem o mesmo par, e `toNumber` ja sabe ler os dois.
 */
export interface PricedLike {
  price: number | string;
  promoPrice: number | string | null;
}

/** Preco efetivo: promocional quando existir e for menor, senao o de venda. */
export function effectivePrice(priced: PricedLike): number {
  const promo = toNumber(priced.promoPrice);
  const price = toNumber(priced.price);
  return promo > 0 && promo < price ? promo : price;
}

/** Desconto em porcentagem a partir do par preco/promocional. */
export function discountPercent(price: number | string, promoPrice: number | string): number {
  const base = toNumber(price);
  const promo = toNumber(promoPrice);
  if (base <= 0 || promo <= 0 || promo >= base) return 0;
  return Math.round((1 - promo / base) * 100);
}

/** Preco a partir da porcentagem de desconto (campo `DESCONTO %` do modal). */
export function priceFromDiscount(price: number | string, percent: number | string): number {
  const base = toNumber(price);
  const pct = toNumber(percent);
  if (base <= 0 || pct <= 0) return 0;
  const clamped = Math.min(100, pct);
  return Math.round(base * (1 - clamped / 100) * 100) / 100;
}

/**
 * Estoque total exibido na tabela.
 *
 * Se o produto tem cores com estoque proprio, a soma delas e a verdade. Sem
 * cores, vale o estoque geral. Isso evita o defeito classico de mostrar 40 no
 * resumo e 3 nas variacoes.
 */
export function totalStock(product: Pick<Product, 'stock' | 'colors'>): number {
  const withOwnStock = product.colors.filter(
    (color): color is ProductColor & { stock: number } => color.stock !== null,
  );
  if (withOwnStock.length === 0) return toNumber(product.stock);
  return withOwnStock.reduce((sum, color) => sum + toNumber(color.stock), 0);
}

/** Preco riscado a exibir: o antigo ou, na falta dele, o de venda em promo. */
export function strikethroughPrice(
  product: Pick<Product, 'price' | 'promoPrice' | 'compareAtPrice'>,
): number | null {
  const compare = toNumber(product.compareAtPrice);
  if (compare > 0) return compare;
  const promo = toNumber(product.promoPrice);
  const price = toNumber(product.price);
  if (promo > 0 && promo < price) return price;
  return null;
}

/** Quantas variacoes de cor o produto tem (coluna "Sem variacoes" do Estoque). */
export function colorCount(product: Pick<Product, 'colors'>): number {
  return product.colors.length;
}

/**
 * Lucro bruto de um produto.
 *
 * Quando existe preco promocional ativo, o lucro e calculado sobre ele — nao
 * sobre o preco cheio. Calcular pelo cheio inflaria o lucro de toda peca em
 * promocao, que e justamente o caso em que o numero mais importa.
 */
export function productProfit(
  product: Pick<Product, 'price' | 'costPrice' | 'promoPrice'>,
): number {
  return grossProfit(effectivePrice(product), product.costPrice);
}

/** Margem de lucro de um produto, sobre o preco efetivamente praticado. */
export function productMargin(
  product: Pick<Product, 'price' | 'costPrice' | 'promoPrice'>,
): number {
  return profitMargin(effectivePrice(product), product.costPrice);
}
