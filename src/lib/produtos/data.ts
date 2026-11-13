'use server';

/**
 * Camada de dados de Produtos — LIGADA AO BANCO (Neon/Prisma).
 *
 * Arquivo `use server`: as funcoes rodam sempre no servidor, inclusive quando a
 * tela do admin (componente cliente) as chama. Sem `DATABASE_URL` o `ler()`
 * devolve o demo com o motivo, entao o desenvolvimento local continua funcionando.
 *
 * Escritas exigem sessao de ADMIN.
 */

import { ler, escrever } from '@/lib/data/repositorio';
import { paraProduto, paraCategoriaLeve } from '@/lib/data/mapear';
import { sessaoAtual } from '@/lib/auth/guardas';
import { DEMO_CATEGORIES_PRODUTOS, DEMO_PRODUCTS_PRODUTOS } from './demo';
import type { Category, Product, ProductStatus } from './types';

export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: ProductStatus | 'all';
  lowStockOnly?: boolean;
}

export interface ProductSort {
  field: 'name' | 'price' | 'stock' | 'margin';
  direction: 'asc' | 'desc';
}

export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

const INCLUIR = { images: true, colors: true } as const;

async function todos(): Promise<Dataset<Product[]>> {
  const r = await ler(DEMO_PRODUCTS_PRODUTOS, async (db) => {
    const linhas = await db.product.findMany({ include: INCLUIR, orderBy: { createdAt: 'desc' } });
    return linhas.map(paraProduto);
  });
  return { data: r.data, source: r.source };
}

export async function listProducts(options?: {
  filters?: ProductFilters;
  sort?: ProductSort;
}): Promise<Dataset<Product[]>> {
  const { filters, sort } = options ?? {};
  const base = await todos();
  let rows = [...base.data];

  if (filters?.search) {
    const term = filters.search.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (p) => p.name.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term),
      );
    }
  }
  if (filters?.categoryId) rows = rows.filter((p) => p.categoryId === filters.categoryId);
  if (filters?.status && filters.status !== 'all') rows = rows.filter((p) => p.status === filters.status);
  if (filters?.lowStockOnly) rows = rows.filter((p) => p.stock <= 5);

  if (sort) {
    const d = sort.direction === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      switch (sort.field) {
        case 'price':
          return (a.price - b.price) * d;
        case 'stock':
          return (a.stock - b.stock) * d;
        case 'margin':
          return (
            ((a.price - a.costPrice) / (a.price || 1) - (b.price - b.costPrice) / (b.price || 1)) * d
          );
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'pt-BR') * d;
      }
    });
  }
  return { data: rows, source: base.source };
}

export async function getProduct(id: string): Promise<Dataset<Product | null>> {
  const r = await ler<Product | null>(
    DEMO_PRODUCTS_PRODUTOS.find((p) => p.id === id) ?? null,
    async (db) => {
      const l = await db.product.findUnique({ where: { id }, include: INCLUIR });
      return l ? paraProduto(l) : null;
    },
  );
  return { data: r.data, source: r.source };
}

export async function listCategories(): Promise<Dataset<Category[]>> {
  const r = await ler(DEMO_CATEGORIES_PRODUTOS, async (db) => {
    const linhas = await db.category.findMany({ orderBy: { sortOrder: 'asc' } });
    return linhas.map(paraCategoriaLeve);
  });
  return { data: r.data, source: r.source };
}

async function ehAdmin(): Promise<boolean> {
  const s = await sessaoAtual();
  return !!s && s.papel === 'admin';
}

const SEM_PERMISSAO = 'Apenas administradores podem alterar produtos.';

/** Somente URLs publicas/relativas vao para o banco (nada de `data:` gigante). */
function imagensValidas(p: Product) {
  return p.images
    .filter((i) => /^(https?:\/\/|\/)/.test(i.url))
    .map((i, idx) => ({ url: i.url, alt: i.alt ?? '', sortOrder: idx }));
}

function camposBase(p: Product) {
  return {
    name: p.name.trim(),
    slug: p.slug.trim(),
    description: p.description ?? '',
    categoryId: p.categoryId || null,
    price: p.price,
    costPrice: p.costPrice ?? 0,
    promoPrice: p.promoPrice,
    compareAtPrice: p.compareAtPrice,
    stock: Math.max(0, Math.trunc(p.stock)),
    sizes: p.sizes,
    status: p.status,
    featured: p.featured,
  };
}

export async function createProduct(product: Product): Promise<WriteResult<Product>> {
  if (!(await ehAdmin())) return { data: product, persisted: false, reason: SEM_PERMISSAO };
  const r = await escrever(async (db) => {
    const l = await db.product.create({
      data: {
        ...camposBase(product),
        images: { create: imagensValidas(product) },
        colors: {
          create: product.colors.map((c, idx) => ({ name: c.name, hex: c.hex, stock: c.stock, sortOrder: idx })),
        },
      },
      include: INCLUIR,
    });
    return paraProduto(l);
  });
  return r.ok && r.valor
    ? { data: r.valor, persisted: true }
    : { data: product, persisted: false, reason: r.reason };
}

export async function updateProduct(product: Product): Promise<WriteResult<Product>> {
  if (!(await ehAdmin())) return { data: product, persisted: false, reason: SEM_PERMISSAO };
  const r = await escrever(async (db) => {
    const l = await db.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      await tx.productColor.deleteMany({ where: { productId: product.id } });
      return tx.product.update({
        where: { id: product.id },
        data: {
          ...camposBase(product),
          images: { create: imagensValidas(product) },
          colors: {
            create: product.colors.map((c, idx) => ({ name: c.name, hex: c.hex, stock: c.stock, sortOrder: idx })),
          },
        },
        include: INCLUIR,
      });
    });
    return paraProduto(l);
  });
  return r.ok && r.valor
    ? { data: r.valor, persisted: true }
    : { data: product, persisted: false, reason: r.reason };
}

export async function deleteProduct(id: string): Promise<WriteResult<{ id: string }>> {
  if (!(await ehAdmin())) return { data: { id }, persisted: false, reason: SEM_PERMISSAO };
  const r = await escrever((db) => db.product.delete({ where: { id } }));
  return { data: { id }, persisted: r.ok, reason: r.reason };
}
