'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, Plus, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/modal';
import { EmptyState, TableSkeleton } from '@/components/ui/states';
import { SearchInput, Select } from '@/components/ui/form';
import { TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  createProduct,
  deleteProduct,
  listCategories,
  listProducts,
  updateProduct,
  type ProductSort,
} from '@/lib/produtos/data';
import { effectivePrice, productMargin, productProfit, totalStock } from '@/lib/produtos/metrics';
import {
  draftFromProduct,
  draftToProduct,
  emptyDraft,
  hasErrors,
  localId,
  validateDraft,
} from '@/lib/produtos/form';
import type { Category, Product, ProductDraft, ProductFieldErrors, ProductStatus } from '@/lib/produtos/types';
import { ProductsTable } from './products-table';
import { ProductCard } from './product-card';
import { ProductForm } from './product-form';

/**
 * Tela de Produtos (`/admin/produtos`).
 *
 * Cabecalho conforme o print: eyebrow `PAINEL ADMINISTRATIVO` + `Produtos` ja
 * vem da casca; aqui entra o titulo serifado `Gerenciamento de Produtos`, o
 * subtitulo e o botao pill preta `+ NOVO PRODUTO` alinhado a direita.
 *
 * Toda a leitura passa por `@/lib/produtos/data`. Se nada foi persistido, a
 * tela DIZ isso — nao ha simulação de gravacao.
 */

type StatusFilter = ProductStatus | 'all';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'active', label: 'Ativos' },
  { value: 'draft', label: 'Rascunhos' },
  { value: 'archived', label: 'Arquivados' },
];

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sort, setSort] = useState<ProductSort>({ field: 'name', direction: 'asc' });

  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProductFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [productSet, categorySet] = await Promise.all([listProducts(), listCategories()]);
        if (!alive) return;
        setProducts(productSet.data);
        setCategories(categorySet.data);
      } catch {
        if (alive) setError('Não foi possível carregar os produtos.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    let rows = [...products];

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      rows = rows.filter(
        (product) =>
          product.name.toLowerCase().includes(term) || product.slug.toLowerCase().includes(term),
      );
    }
    if (categoryId) rows = rows.filter((product) => product.categoryId === categoryId);
    if (status !== 'all') rows = rows.filter((product) => product.status === status);
    if (lowStockOnly) rows = rows.filter((product) => product.stock <= 5);

    const direction = sort.direction === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      switch (sort.field) {
        case 'price':
          return (a.price - b.price) * direction;
        case 'stock':
          return (a.stock - b.stock) * direction;
        case 'margin':
          return (productMargin(a) - productMargin(b)) * direction;
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'pt-BR') * direction;
      }
    });

    return rows;
  }, [products, search, categoryId, status, lowStockOnly, sort]);

  const totals = useMemo(() => {
    // Estoque pela mesma regra da tabela e do cartao: quando a cor tem estoque
    // proprio, e a soma das cores que vale — nao o campo geral do produto.
    const units = visible.reduce((sum, product) => sum + totalStock(product), 0);
    const revenue = visible.reduce((sum, product) => sum + effectivePrice(product), 0);
    const profit = visible.reduce((sum, product) => sum + productProfit(product), 0);
    return { count: visible.length, units, revenue, profit };
  }, [visible]);

  function openNew() {
    setEditingId(null);
    setErrors({});
    setDraft(emptyDraft());
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setErrors({});
    setDraft(draftFromProduct(product));
  }

  function closeForm() {
    setDraft(null);
    setEditingId(null);
    setErrors({});
    setNotice(null);
  }

  async function submit() {
    if (!draft) return;
    const found = validateDraft(draft);
    setErrors(found);
    if (hasErrors(found)) return;

    setSaving(true);
    try {
      if (editingId) {
        const base = products.find((product) => product.id === editingId);
        const next = draftToProduct(draft, {
          id: editingId,
          createdAt: base?.createdAt ?? new Date().toISOString(),
        });
        const result = await updateProduct(next);
        setProducts((current) =>
          current.map((product) => (product.id === next.id ? next : product)),
        );
        setNotice(
          result.persisted
            ? 'Produto salvo.'
            : 'Alterações aplicadas nesta sessão. A gravação no banco entra na fase de integração.',
        );
      } else {
        const next = draftToProduct(draft, {
          id: localId('novo'),
          createdAt: new Date().toISOString(),
        });
        const result = await createProduct(next);
        setProducts((current) => [next, ...current]);
        setNotice(
          result.persisted
            ? 'Produto criado.'
            : 'Produto adicionado nesta sessão. A gravação no banco entra na fase de integração.',
        );
      }
      setDraft(null);
      setEditingId(null);
    } catch {
      setNotice('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(pendingDelete.id);
      setProducts((current) => current.filter((product) => product.id !== pendingDelete.id));
      setNotice('Produto removido desta sessão. A exclusão no banco entra na fase de integração.');
      setPendingDelete(null);
    } catch {
      setNotice('Não foi possível excluir. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 lg:space-y-8 motion-safe:animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
            Gerenciamento de Produtos
          </h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Cadastre, edite e acompanhe a performance das suas peças.
          </p>
        </div>
        <Button onClick={openNew} className="w-full shrink-0 sm:w-auto">
          <Plus className="size-4" aria-hidden />
          Novo Produto
        </Button>
      </div>

      {/* Aviso honesto sobre a origem dos dados e o que foi feito na sessão */}
      {notice ? (
        <p
          role="status"
          className="rounded-2xl border border-warning-surface bg-warning-surface/50 px-4 py-3 text-xs font-medium text-warning-foreground"
        >
          {notice}
        </p>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar por nome ou slug..."
            className="lg:max-w-md lg:flex-1"
            aria-label="Buscar produtos"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:items-center">
            <Select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              aria-label="Filtrar por categoria"
              className="h-12 lg:w-48"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>

            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              aria-label="Filtrar por status"
              className="h-12 lg:w-44"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <button
              type="button"
              aria-pressed={lowStockOnly}
              onClick={() => setLowStockOnly((current) => !current)}
              className={cn(
                'focus-ring h-12 rounded-xl border px-4 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors',
                lowStockOnly
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-input bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              Estoque baixo
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground tabular-nums">{totals.count}</strong>{' '}
            {totals.count === 1 ? 'produto' : 'produtos'}
          </span>
          <span>
            <strong className="font-semibold text-foreground tabular-nums">{totals.units}</strong>{' '}
            unidades
          </span>
          <span className="ml-auto flex items-center gap-2">
            <label htmlFor="ordenar-produtos" className="label-caps">
              Ordenar
            </label>
            <select
              id="ordenar-produtos"
              value={`${sort.field}:${sort.direction}`}
              onChange={(event) => {
                const [field, direction] = event.target.value.split(':') as [
                  ProductSort['field'],
                  ProductSort['direction'],
                ];
                setSort({ field, direction });
              }}
              className="focus-ring rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
            >
              <option value="name:asc">Nome (A–Z)</option>
              <option value="name:desc">Nome (Z–A)</option>
              <option value="price:desc">Maior preço</option>
              <option value="price:asc">Menor preço</option>
              <option value="stock:asc">Menor estoque</option>
              <option value="margin:desc">Maior margem</option>
            </select>
          </span>
        </div>
      </div>

      <div className="surface overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : error ? (
          <div className="p-6">
            <EmptyState title={error} icon={SearchX} />
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Nenhum produto encontrado."
              description="Ajuste a busca ou os filtros para ver outros resultados."
              icon={Package}
              action={
                <Button variant="outline" size="sm" onClick={openNew}>
                  <Plus className="size-3.5" aria-hidden />
                  Cadastrar produto
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* Tabela: a partir de lg, onde as 7 colunas cabem sem cortar */}
            <div className="hidden lg:block">
              <ProductsTable
                products={visible}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            </div>

            {/* Cartões: abaixo de lg, com os mesmos campos e as mesmas ações */}
            <ul className="space-y-3 p-3 lg:hidden">
              {visible.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              ))}
            </ul>

            <TableFooter>
              <span className="text-xs text-muted-foreground">
                Exibindo{' '}
                <strong className="font-semibold text-foreground tabular-nums">
                  {visible.length}
                </strong>{' '}
                de{' '}
                <strong className="font-semibold text-foreground tabular-nums">
                  {products.length}
                </strong>
              </span>
              <span className="text-xs text-muted-foreground">
                Receita potencial{' '}
                <strong className="font-semibold text-foreground tabular-nums">
                  {totals.revenue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </span>
            </TableFooter>
          </>
        )}
      </div>

      {draft ? (
        <ProductForm
          open
          draft={draft}
          onDraftChange={setDraft}
          categories={categories}
          editing={editingId !== null}
          saving={saving}
          errors={errors}
          onClose={closeForm}
          onSubmit={submit}
        />
      ) : null}

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Excluir produto"
        description={
          pendingDelete
            ? `Tem certeza que deseja excluir "${pendingDelete.name}"? Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
      />
    </div>
  );
}
