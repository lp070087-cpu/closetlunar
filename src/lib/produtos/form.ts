/**
 * Regras do formulario de produto.
 *
 * Modulo PURO (sem React) com uma unica responsabilidade: converter entre o
 * rascunho que o usuario digita e o `Product` que a tela guarda. Ficou separado
 * do componente porque validacao dentro de JSX nao se testa.
 *
 * Decisoes que os prints sustentam:
 * - O slug e gerado do nome e para de acompanhar assim que o usuario o edita.
 * - O rotulo `DESCONTO %` e o `PROMOCIONAL` sao dois caminhos para o mesmo
 *   dado: mexer num limpa o outro. E o que a referencia faz.
 * - Nenhum campo e obrigatorio alem do nome: a referencia salva com preco 0.
 */

import { slugify } from '@/lib/utils';
import { discountPercent, priceFromDiscount } from './metrics';
import type { Product, ProductColor, ProductDraft, ProductFieldErrors } from './types';

/** Id local, estavel dentro da sessao. Nao e id de banco. */
export function localId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_SIZES = ['P', 'M', 'G'] as const;

/** Rascunho em branco, com os mesmos valores iniciais da referencia. */
export function emptyDraft(): ProductDraft {
  return {
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    price: '',
    costPrice: '',
    promoPrice: '',
    compareAtPrice: '',
    sizes: [...DEFAULT_SIZES],
    colors: [],
    images: [],
    stock: '',
    status: 'active',
    featured: false,
    slugTouched: false,
  };
}

/** Rascunho a partir de um produto existente (modo edicao). */
export function draftFromProduct(product: Product): ProductDraft {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    price: String(product.price || ''),
    costPrice: String(product.costPrice || ''),
    promoPrice: product.promoPrice ? String(product.promoPrice) : '',
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
    sizes: [...product.sizes],
    colors: product.colors.map((color) => ({ ...color, images: [...color.images] })),
    images: [...product.images],
    stock: String(product.stock || ''),
    status: product.status,
    featured: product.featured,
    slugTouched: true,
  };
}

/** Aplica o resultado do campo nome, respeitando se o slug ja foi tocado. */
export function applyName(draft: ProductDraft, name: string): ProductDraft {
  const next = { ...draft, name };
  if (!draft.slugTouched) next.slug = slugify(name);
  return next;
}

export function applySlug(draft: ProductDraft, value: string): ProductDraft {
  return { ...draft, slug: slugify(value), slugTouched: true };
}

/** Aba `DESCONTO %`: recalcula o promocional. Zero limpa a promocao. */
export function applyDiscount(draft: ProductDraft, percent: string): ProductDraft {
  if (!percent.trim()) return { ...draft, promoPrice: '' };
  const price = Number(draft.price) || 0;
  if (price <= 0) return { ...draft, promoPrice: '' };
  const calculated = priceFromDiscount(price, percent);
  return { ...draft, promoPrice: calculated > 0 ? calculated.toFixed(2) : '' };
}

/** Desconto atual do rascunho, para preencher o campo ao abrir a edicao. */
export function draftDiscount(draft: ProductDraft): string {
  const percent = discountPercent(draft.price, draft.promoPrice);
  return percent > 0 ? String(percent) : '';
}

export function addColor(draft: ProductDraft, name: string, hex: string): ProductDraft {
  const color: ProductColor = { id: localId('cor'), name, hex, images: [], stock: null };
  return { ...draft, colors: [...draft.colors, color] };
}

export function updateColor(
  draft: ProductDraft,
  id: string,
  patch: Partial<Omit<ProductColor, 'id'>>,
): ProductDraft {
  return {
    ...draft,
    colors: draft.colors.map((color) => (color.id === id ? { ...color, ...patch } : color)),
  };
}

export function removeColor(draft: ProductDraft, id: string): ProductDraft {
  return { ...draft, colors: draft.colors.filter((color) => color.id !== id) };
}

export function toggleSize(draft: ProductDraft, size: string): ProductDraft {
  const has = draft.sizes.includes(size);
  const sizes = has ? draft.sizes.filter((item) => item !== size) : [...draft.sizes, size];
  // Mantem a ordem canonica da loja, nao a ordem do clique.
  const order = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
  return { ...draft, sizes: sizes.sort((a, b) => order.indexOf(a) - order.indexOf(b)) };
}

/** Move uma imagem na galeria. A primeira e a principal. */
export function moveImage(draft: ProductDraft, index: number, direction: -1 | 1): ProductDraft {
  const target = index + direction;
  if (target < 0 || target >= draft.images.length) return draft;
  const images = [...draft.images];
  [images[index], images[target]] = [images[target], images[index]];
  return { ...draft, images };
}

export function removeImage(draft: ProductDraft, id: string): ProductDraft {
  return { ...draft, images: draft.images.filter((image) => image.id !== id) };
}

/** Validacao. Hoje so o nome e obrigatorio — igual a referencia. */
export function validateDraft(draft: ProductDraft): ProductFieldErrors {
  const errors: ProductFieldErrors = {};
  if (!draft.name.trim()) errors.name = 'Informe o nome do produto.';
  if (!draft.slug.trim()) errors.slug = 'A URL amigável não pode ficar vazia.';

  const price = Number(draft.price) || 0;
  const promo = draft.promoPrice ? Number(draft.promoPrice) : 0;
  if (promo > 0 && promo >= price) {
    errors.promoPrice = 'O preço promocional precisa ser menor que o de venda.';
  }
  return errors;
}

export function hasErrors(errors: ProductFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Rascunho -> produto. Sem efeito colateral; o id e o createdAt vem de fora. */
export function draftToProduct(
  draft: ProductDraft,
  base: Pick<Product, 'id' | 'createdAt'>,
): Product {
  const now = new Date().toISOString();
  return {
    id: base.id,
    name: draft.name.trim(),
    slug: draft.slug.trim() || slugify(draft.name),
    description: draft.description.trim(),
    categoryId: draft.categoryId,
    price: Number(draft.price) || 0,
    costPrice: Number(draft.costPrice) || 0,
    promoPrice: draft.promoPrice ? Number(draft.promoPrice) : null,
    compareAtPrice: draft.compareAtPrice ? Number(draft.compareAtPrice) : null,
    images: draft.images,
    colors: draft.colors,
    sizes: draft.sizes,
    stock: Number(draft.stock) || 0,
    status: draft.status,
    featured: draft.featured,
    createdAt: base.createdAt,
    updatedAt: now,
  };
}
