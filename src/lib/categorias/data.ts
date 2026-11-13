'use server';

/**
 * Camada de dados de Categorias — LIGADA AO BANCO (Neon/Prisma).
 * `use server`: roda no servidor mesmo quando o admin (cliente) chama.
 * Escritas exigem sessao de ADMIN.
 */

import { ler, escrever } from '@/lib/data/repositorio';
import { paraCategoria } from '@/lib/data/mapear';
import { sessaoAtual } from '@/lib/auth/guardas';
import { DEMO_CATEGORIES } from './demo';
import { sortCategories } from './metrics';
import type { Category } from './types';
import { DEMO_PRODUCTS_PRODUTOS } from '@/lib/produtos/demo';

export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
}

export interface CategoryFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface CategorySort {
  field: 'sortOrder' | 'name' | 'productCount';
  direction: 'asc' | 'desc';
}

export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

function demoComContagem(): Category[] {
  const counts = new Map<string, number>();
  for (const p of DEMO_PRODUCTS_PRODUTOS) {
    if (p.categoryId) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
  }
  return DEMO_CATEGORIES.map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }));
}

async function todas() {
  return ler(demoComContagem(), async (db) => {
    const linhas = await db.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return linhas.map(paraCategoria);
  });
}

export async function listCategories(options?: {
  filters?: CategoryFilters;
  sort?: CategorySort;
}): Promise<Dataset<Category[]>> {
  const { filters, sort } = options ?? {};
  const base = await todas();
  let rows = [...base.data];

  if (filters?.search) {
    const term = filters.search.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (c) => c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term),
      );
    }
  }
  if (filters?.status && filters.status !== 'all') {
    const ativo = filters.status === 'active';
    rows = rows.filter((c) => c.isActive === ativo);
  }
  rows = sortCategories(rows, sort ?? { field: 'sortOrder', direction: 'asc' });
  return { data: rows, source: base.source };
}

export async function getCategory(id: string): Promise<Dataset<Category | null>> {
  const base = await todas();
  return { data: base.data.find((c) => c.id === id) ?? null, source: base.source };
}

async function ehAdmin() {
  const s = await sessaoAtual();
  return !!s && s.papel === 'admin';
}

const SEM_PERMISSAO = 'Apenas administradores podem alterar categorias.';

function campos(c: Category) {
  return {
    name: c.name.trim(),
    slug: c.slug.trim(),
    imageUrl: c.image?.url && /^(https?:\/\/|\/)/.test(c.image.url) ? c.image.url : null,
    imageAlt: c.image?.alt ?? null,
    sortOrder: c.sortOrder ?? 0,
    isActive: c.isActive,
    metaTitle: c.metaTitle ?? '',
    metaDescription: c.metaDescription ?? '',
    introText: c.introText ?? '',
  };
}

export async function createCategory(category: Category): Promise<WriteResult<Category>> {
  if (!(await ehAdmin())) return { data: category, persisted: false, reason: SEM_PERMISSAO };
  const r = await escrever(async (db) => paraCategoria(await db.category.create({ data: campos(category) })));
  return r.ok && r.valor ? { data: r.valor, persisted: true } : { data: category, persisted: false, reason: r.reason };
}

export async function updateCategory(category: Category): Promise<WriteResult<Category>> {
  if (!(await ehAdmin())) return { data: category, persisted: false, reason: SEM_PERMISSAO };
  const r = await escrever(async (db) =>
    paraCategoria(await db.category.update({ where: { id: category.id }, data: campos(category) })),
  );
  return r.ok && r.valor ? { data: r.valor, persisted: true } : { data: category, persisted: false, reason: r.reason };
}

export async function deleteCategory(id: string): Promise<WriteResult<{ id: string }>> {
  if (!(await ehAdmin())) return { data: { id }, persisted: false, reason: SEM_PERMISSAO };
  const r = await escrever((db) => db.category.delete({ where: { id } }));
  return { data: { id }, persisted: r.ok, reason: r.reason };
}
