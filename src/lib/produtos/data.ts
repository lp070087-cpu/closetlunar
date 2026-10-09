/**
 * Camada de dados de Produtos.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts` nem conhece Prisma. Quando o Neon entrar, troca-se o
 * corpo destas funcoes; a assinatura e as telas continuam iguais.
 *
 * Hoje a origem e `demo.ts`, e `source: 'demo'` viaja junto com os dados para
 * que a interface possa DIZER que sao demonstrativos, em vez de fingir que
 * vieram de um banco. `source: 'database'` e o que valera em producao.
 */

import { DEMO_CATEGORIES_PRODUTOS, DEMO_PRODUCTS_PRODUTOS } from './demo';
import type { Category, Product, ProductStatus } from './types';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

export interface ProductFilters {
  /** Busca textual em nome e slug. */
  search?: string;
  categoryId?: string;
  status?: ProductStatus | 'all';
  /** Apenas produtos com estoque <= 5. */
  lowStockOnly?: boolean;
}

export interface ProductSort {
  field: 'name' | 'price' | 'stock' | 'margin';
  direction: 'asc' | 'desc';
}

/**
 * Leitura da lista de produtos.
 *
 * Assincrona de proposito, mesmo servindo dados locais: e o que a chamada ao
 * Neon vai ser, e assim nenhuma tela precisa mudar de sincrona para assincrona
 * depois. `signal` ja esta no contrato para cancelamento.
 */
export async function listProducts(options?: {
  filters?: ProductFilters;
  sort?: ProductSort;
  signal?: AbortSignal;
}): Promise<Dataset<Product[]>> {
  const { filters, sort } = options ?? {};
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');

  let rows = [...DEMO_PRODUCTS_PRODUTOS];

  if (filters?.search) {
    const term = filters.search.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (product) =>
          product.name.toLowerCase().includes(term) || product.slug.toLowerCase().includes(term),
      );
    }
  }

  if (filters?.categoryId) {
    rows = rows.filter((product) => product.categoryId === filters.categoryId);
  }

  if (filters?.status && filters.status !== 'all') {
    rows = rows.filter((product) => product.status === filters.status);
  }

  if (filters?.lowStockOnly) {
    rows = rows.filter((product) => product.stock <= 5);
  }

  if (sort) {
    const direction = sort.direction === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      switch (sort.field) {
        case 'price':
          return (a.price - b.price) * direction;
        case 'stock':
          return (a.stock - b.stock) * direction;
        case 'margin':
          return (
            ((a.price - a.costPrice) / (a.price || 1) - (b.price - b.costPrice) / (b.price || 1)) *
            direction
          );
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'pt-BR') * direction;
      }
    });
  }

  return { data: rows, source: 'demo' };
}

/** Uma peca por id. `null` quando nao existe. */
export async function getProduct(id: string): Promise<Dataset<Product | null>> {
  const found = DEMO_PRODUCTS_PRODUTOS.find((product) => product.id === id) ?? null;
  return { data: found, source: 'demo' };
}

export async function listCategories(): Promise<Dataset<Category[]>> {
  return { data: DEMO_CATEGORIES_PRODUTOS, source: 'demo' };
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

export async function createProduct(product: Product): Promise<WriteResult<Product>> {
  return { data: product, persisted: false, reason: PENDING_REASON };
}

export async function updateProduct(product: Product): Promise<WriteResult<Product>> {
  return { data: product, persisted: false, reason: PENDING_REASON };
}

export async function deleteProduct(id: string): Promise<WriteResult<{ id: string }>> {
  return { data: { id }, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
