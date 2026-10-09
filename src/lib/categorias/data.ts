/**
 * Camada de dados de Categorias.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts` nem conhece Prisma. Quando o Neon entrar, troca-se o
 * corpo destas funcoes; a assinatura e as telas continuam iguais.
 *
 * O JOIN COM OS PRODUTOS
 *
 * `productCount` e a unica coisa desta camada que NAO sai de `demo.ts`: ela e
 * contada a partir dos produtos reais. Este arquivo e o lugar do join, e o
 * lugar onde ele vira `_count: { select: { products: true } }` no Prisma. Por
 * isso ele importa `@/lib/produtos/demo` — e a UNICA importacao cruzada entre
 * os dois modulos, e ela esta aqui, nao numa tela.
 *
 * Hoje a contagem e 100% de Produtos, que ja foi fechado na Fase 2. Quando os
 * dois modulos lerem do banco, este mesmo ponto passa a ler as duas tabelas.
 */

import { DEMO_CATEGORIES } from './demo';
import { sortCategories } from './metrics';
import type { Category } from './types';
import { DEMO_PRODUCTS_PRODUTOS } from '@/lib/produtos/demo';
import type { Product } from '@/lib/produtos/types';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

export interface CategoryFilters {
  /** Busca textual em nome e slug. */
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface CategorySort {
  field: 'sortOrder' | 'name' | 'productCount';
  direction: 'asc' | 'desc';
}

/**
 * Junta a contagem de produtos em cada categoria.
 *
 * Contada na leitura, nunca gravada — ver o comentario de `productCount` em
 * `types.ts`. Categoria sem produto recebe 0, e nao some da lista: e justamente
 * ela que a tela precisa mostrar para alguem perceber que ficou vazia.
 */
function withProductCount(rows: Category[], products: Product[]): Category[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (!product.categoryId) continue;
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }
  return rows.map((category) => ({
    ...category,
    productCount: counts.get(category.id) ?? 0,
  }));
}

/**
 * Leitura da lista de categorias.
 *
 * Assincrona de proposito, mesmo servindo dados locais: e o que a chamada ao
 * Neon vai ser, e assim nenhuma tela precisa mudar de sincrona para assincrona
 * depois. `signal` ja esta no contrato para cancelamento.
 */
export async function listCategories(options?: {
  filters?: CategoryFilters;
  sort?: CategorySort;
  signal?: AbortSignal;
}): Promise<Dataset<Category[]>> {
  const { filters, sort } = options ?? {};
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');

  let rows = withProductCount(DEMO_CATEGORIES, DEMO_PRODUCTS_PRODUTOS);

  if (filters?.search) {
    const term = filters.search.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (category) =>
          category.name.toLowerCase().includes(term) ||
          category.slug.toLowerCase().includes(term),
      );
    }
  }

  if (filters?.status && filters.status !== 'all') {
    const wantActive = filters.status === 'active';
    rows = rows.filter((category) => category.isActive === wantActive);
  }

  // Ordem padrao identica ao print: `ordem 1`, `ordem 2`, ... de cima para baixo.
  rows = sortCategories(rows, sort ?? { field: 'sortOrder', direction: 'asc' });

  return { data: rows, source: 'demo' };
}

/** Uma categoria por id. `null` quando nao existe. */
export async function getCategory(id: string): Promise<Dataset<Category | null>> {
  const rows = withProductCount(DEMO_CATEGORIES, DEMO_PRODUCTS_PRODUTOS);
  return { data: rows.find((category) => category.id === id) ?? null, source: 'demo' };
}

/**
 * Escrita.
 *
 * NAO PERSISTE NADA. Enquanto o Neon nao existir, estas funcoes devolvem o que
 * foi enviado para que a tela possa fechar o modal e atualizar a lista; mas
 * `persisted: false` marca explicitamente que o dado NAO foi gravado.
 *
 * Isso e intencional: um CRUD que finge gravar e pior do que um que admite nao
 * gravar, porque o primeiro faz a loja acreditar que salvou.
 */
export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

export async function createCategory(category: Category): Promise<WriteResult<Category>> {
  return { data: category, persisted: false, reason: PENDING_REASON };
}

export async function updateCategory(category: Category): Promise<WriteResult<Category>> {
  return { data: category, persisted: false, reason: PENDING_REASON };
}

export async function deleteCategory(id: string): Promise<WriteResult<{ id: string }>> {
  return { data: { id }, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
