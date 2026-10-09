/**
 * Regras do formulario de categoria.
 *
 * Modulo PURO (sem React), igual ao de Produtos e pelo mesmo motivo: validacao
 * dentro de JSX nao se testa.
 *
 * Decisoes que os prints sustentam:
 * - O slug e gerado do nome e para de acompanhar assim que a pessoa o edita
 *   (mesma regra do formulario de produto, que ja esta aprovado).
 * - O campo de ordem abre com o proximo numero livre, como o `Ordem 7` do
 *   modal no print — com seis categorias listadas, a proxima e 7.
 * - Nome e ordem sao os unicos campos com validacao. O print nao mostra
 *   nenhum campo obrigatorio marcado, e a referencia salva categoria so com
 *   nome e slug.
 */

import { slugify } from '@/lib/utils';
import { nextSortOrder, slugTaken } from './metrics';
import type { Category, CategoryDraft, CategoryFieldErrors } from './types';

/** Id local, estavel dentro da sessao. Nao e id de banco. */
export function localId(prefix = 'cat'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Rascunho em branco, com a proxima ordem ja sugerida.
 *
 * `rows` e a lista atual: e dela que sai o `Ordem 7` do print. Isso evita o
 * defeito de toda categoria nova nascer com ordem 1 e a lista ficar
 * embaralhada sem ninguem entender por que.
 */
export function emptyDraft(rows: Category[]): CategoryDraft {
  return {
    name: '',
    slug: '',
    imageUrl: '',
    sortOrder: String(nextSortOrder(rows)),
    isActive: true,
    metaTitle: '',
    metaDescription: '',
    introText: '',
    slugTouched: false,
  };
}

/** Rascunho a partir de uma categoria existente (modo edicao). */
export function draftFromCategory(category: Category): CategoryDraft {
  return {
    name: category.name,
    slug: category.slug,
    imageUrl: category.image?.url ?? '',
    sortOrder: String(category.sortOrder),
    isActive: category.isActive,
    metaTitle: category.metaTitle,
    metaDescription: category.metaDescription,
    introText: category.introText,
    slugTouched: true,
  };
}

/** Aplica o campo nome, respeitando se o slug ja foi tocado. */
export function applyName(draft: CategoryDraft, name: string): CategoryDraft {
  const next = { ...draft, name };
  if (!draft.slugTouched) next.slug = slugify(name);
  return next;
}

export function applySlug(draft: CategoryDraft, value: string): CategoryDraft {
  return { ...draft, slug: slugify(value), slugTouched: true };
}

/**
 * Validacao.
 *
 * O slug duplicado e acusado aqui — e nao na gravacao — porque as duas
 * categorias com a mesma URL so aparecem na loja depois do deploy. O print nao
 * mostra essa mensagem, mas ele tambem nao mostra o caso de erro; o que ele
 * mostra e o campo `Slug (url)` existindo, e um slug que se repete derruba a
 * rota das duas.
 */
export function validateDraft(
  draft: CategoryDraft,
  rows: Category[],
  editingId?: string,
): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};

  if (!draft.name.trim()) errors.name = 'Informe o nome da categoria.';
  if (!draft.slug.trim()) errors.slug = 'A URL amigável não pode ficar vazia.';
  else if (slugTaken(rows, draft.slug, editingId)) {
    errors.slug = 'Já existe uma categoria com esta URL.';
  }

  const order = Number(draft.sortOrder);
  if (!draft.sortOrder.trim() || !Number.isFinite(order) || order < 1) {
    errors.sortOrder = 'A ordem precisa ser um número a partir de 1.';
  } else if (rows.some((row) => row.id !== editingId && row.sortOrder === order)) {
    // Nao e bloqueante na referencia, mas avisar evita a lista embaralhada.
    errors.sortOrder = 'Outra categoria já usa esta ordem.';
  }

  return errors;
}

export function hasErrors(errors: CategoryFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Rascunho -> categoria. Sem efeito colateral; o id e o createdAt vem de fora. */
export function draftToCategory(
  draft: CategoryDraft,
  base: Pick<Category, 'id' | 'createdAt'>,
): Category {
  const now = new Date().toISOString();
  const url = draft.imageUrl.trim();
  return {
    id: base.id,
    name: draft.name.trim(),
    slug: draft.slug.trim() || slugify(draft.name),
    image: url ? { id: `img-${base.id}`, url, alt: draft.name.trim() } : null,
    sortOrder: Number(draft.sortOrder) || 1,
    isActive: draft.isActive,
    // NAO e campo do formulario: a contagem vem de Produtos, na leitura. Gravar
    // um numero aqui criaria um contador que diverge sozinho depois de mover
    // uma peca de categoria.
    productCount: 0,
    metaTitle: draft.metaTitle.trim(),
    metaDescription: draft.metaDescription.trim(),
    introText: draft.introText.trim(),
    createdAt: base.createdAt,
    updatedAt: now,
  };
}
