'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/modal';
import { EmptyState, TableSkeleton } from '@/components/ui/states';
import { SearchInput, Select } from '@/components/ui/form';
import { formatDate } from '@/lib/utils';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type CategorySort,
} from '@/lib/categorias/data';
import {
  countActive,
  countInactive,
  lastUpdated,
  totalProducts,
} from '@/lib/categorias/metrics';
import {
  draftFromCategory,
  draftToCategory,
  emptyDraft,
  hasErrors,
  localId,
  validateDraft,
} from '@/lib/categorias/form';
import type { Category, CategoryDraft, CategoryFieldErrors } from '@/lib/categorias/types';
import { CategoryRow } from './category-row';
import { CategoryForm } from './category-form';

/**
 * Tela de Categorias (`/admin/categorias`) — reconstruida de adm-030/adm-031.
 *
 * Cabecalho conforme o print: o eyebrow `PAINEL ADMINISTRATIVO` e o rotulo
 * `Categorias` ja vem da casca; aqui entra o titulo serifado grande
 * `Categorias`, o subtitulo e, na linha da secao, o botao preto
 * `+ Nova categoria` alinhado a direita.
 *
 * Toda a leitura passa por `@/lib/categorias/data`. Se nada foi persistido, a
 * tela DIZ isso — nao ha simulacao de gravacao.
 *
 * A contagem de produtos por categoria e requisito da fase e NAO existe no
 * print. Ela entra como linha de resumo acima da lista, e nao como coluna em
 * cada linha, para nao inventar uma coluna que a referencia nao tem.
 */

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'active', label: 'Ativas' },
  { value: 'inactive', label: 'Inativas' },
];

export function CategoriesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<CategorySort>({ field: 'sortOrder', direction: 'asc' });

  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<CategoryFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const result = await listCategories();
        if (alive) setCategories(result.data);
      } catch {
        if (alive) setError('Não foi possível carregar as categorias.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    let rows = [...categories];

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      rows = rows.filter(
        (category) =>
          category.name.toLowerCase().includes(term) ||
          category.slug.toLowerCase().includes(term),
      );
    }
    if (status !== 'all') {
      const wantActive = status === 'active';
      rows = rows.filter((category) => category.isActive === wantActive);
    }

    const direction = sort.direction === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      let result: number;
      switch (sort.field) {
        case 'name':
          result = a.name.localeCompare(b.name, 'pt-BR');
          break;
        case 'productCount':
          result = a.productCount - b.productCount;
          break;
        case 'sortOrder':
        default:
          result = a.sortOrder - b.sortOrder;
          break;
      }
      if (result !== 0) return result * direction;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    return rows;
  }, [categories, search, status, sort]);

  /**
   * Resumo calculado sobre a lista FILTRADA, e nao sobre a lista inteira.
   *
   * E o que torna o filtro util: escolher "Inativas" e ver "2 ativas" no resumo
   * seria responder sobre outra pergunta. O total de produtos some junto porque
   * a soma de `productCount` muda com o filtro.
   */
  const totals = useMemo(
    () => ({
      count: visible.length,
      active: countActive(visible),
      inactive: countInactive(visible),
      products: totalProducts(visible),
      updated: lastUpdated(visible),
    }),
    [visible],
  );

  function openNew() {
    setEditingId(null);
    setErrors({});
    // A proxima ordem sai da lista COMPLETA, nao da filtrada: uma categoria nova
    // precisa de uma ordem livre entre todas, nao so entre as visiveis.
    setDraft(emptyDraft(categories));
  }

  function openEdit(category: Category) {
    setEditingId(category.id);
    setErrors({});
    setDraft(draftFromCategory(category));
  }

  function closeForm() {
    setDraft(null);
    setEditingId(null);
    setErrors({});
  }

  async function submit() {
    if (!draft) return;
    const found = validateDraft(draft, categories, editingId ?? undefined);
    setErrors(found);
    if (hasErrors(found)) return;

    setSaving(true);
    try {
      if (editingId) {
        const base = categories.find((category) => category.id === editingId);
        const next = draftToCategory(draft, {
          id: editingId,
          createdAt: base?.createdAt ?? new Date().toISOString(),
        });
        const result = await updateCategory(next);
        setCategories((current) =>
          // Preserva o `productCount` que veio da leitura: o formulario nao o
          // conhece, e sobrescrever com 0 zeraria a contagem de Produtos.
          current.map((category) =>
            category.id === next.id ? { ...next, productCount: category.productCount } : category,
          ),
        );
        setNotice(
          result.persisted
            ? 'Categoria salva.'
            : 'Alterações aplicadas nesta sessão. A gravação no banco entra na fase de integração.',
        );
      } else {
        const next = draftToCategory(draft, {
          id: localId('cat'),
          createdAt: new Date().toISOString(),
        });
        const result = await createCategory(next);
        setCategories((current) => [...current, next]);
        setNotice(
          result.persisted
            ? 'Categoria criada.'
            : 'Categoria adicionada nesta sessão. A gravação no banco entra na fase de integração.',
        );
      }
      closeForm();
    } catch {
      setNotice('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  /**
   * Ativar / desativar.
   *
   * Sem modal de confirmacao, igual ao print: a acao e reversivel (o mesmo
   * botao faz o caminho de volta), entao pedir confirmacao seria atrito puro.
   * O `updatedAt` e atualizado porque a data do resumo deve refletir a mudanca.
   */
  async function toggle(category: Category) {
    const next: Category = {
      ...category,
      isActive: !category.isActive,
      updatedAt: new Date().toISOString(),
    };
    try {
      const result = await updateCategory(next);
      setCategories((current) => current.map((row) => (row.id === next.id ? next : row)));
      setNotice(
        result.persisted
          ? `Categoria ${next.isActive ? 'ativada' : 'desativada'}.`
          : `Categoria ${next.isActive ? 'ativada' : 'desativada'} nesta sessão. A gravação no banco entra na fase de integração.`,
      );
    } catch {
      setNotice('Não foi possível alterar o status. Tente novamente.');
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      setCategories((current) => current.filter((category) => category.id !== pendingDelete.id));
      setNotice('Categoria removida desta sessão. A exclusão no banco entra na fase de integração.');
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
            Categorias
          </h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Organize as categorias exibidas na loja.
          </p>
        </div>
        <Button onClick={openNew} className="w-full shrink-0 sm:w-auto">
          <Plus className="size-4" aria-hidden />
          Nova categoria
        </Button>
      </div>

      {/* Aviso honesto sobre a origem dos dados e o que foi feito na sessao */}
      {notice ? (
        <p
          role="status"
          className="rounded-2xl border border-warning-surface bg-warning-surface/50 px-4 py-3 text-xs font-medium text-warning-foreground"
        >
          {notice}
        </p>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar por nome ou slug..."
            className="sm:max-w-md sm:flex-1"
            aria-label="Buscar categorias"
          />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            aria-label="Filtrar por status"
            className="h-12 sm:w-44"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {/*
          Resumo: contagem de produtos por categoria e o status. Requisito da
          fase; fica AQUI, e nao numa coluna de cada linha, para nao inventar
          coluna que o print nao tem.
        */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground tabular-nums">{totals.count}</strong>{' '}
            {totals.count === 1 ? 'categoria' : 'categorias'}
          </span>
          <span>
            <strong className="font-semibold text-foreground tabular-nums">{totals.active}</strong>{' '}
            {totals.active === 1 ? 'ativa' : 'ativas'}
          </span>
          <span>
            <strong className="font-semibold text-foreground tabular-nums">{totals.inactive}</strong>{' '}
            {totals.inactive === 1 ? 'inativa' : 'inativas'}
          </span>
          <span>
            <strong className="font-semibold text-foreground tabular-nums">{totals.products}</strong>{' '}
            {totals.products === 1 ? 'produto classificado' : 'produtos classificados'}
          </span>
          {totals.updated ? (
            <span className="text-muted-foreground/80">
              Atualizado em <span className="tabular-nums">{formatDate(totals.updated)}</span>
            </span>
          ) : null}
          <span className="ml-auto flex items-center gap-2">
            <label htmlFor="ordenar-categorias" className="label-caps">
              Ordenar
            </label>
            <select
              id="ordenar-categorias"
              value={`${sort.field}:${sort.direction}`}
              onChange={(event) => {
                const [field, direction] = event.target.value.split(':') as [
                  CategorySort['field'],
                  CategorySort['direction'],
                ];
                setSort({ field, direction });
              }}
              className="focus-ring rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
            >
              <option value="sortOrder:asc">Ordem (crescente)</option>
              <option value="sortOrder:desc">Ordem (decrescente)</option>
              <option value="name:asc">Nome (A–Z)</option>
              <option value="name:desc">Nome (Z–A)</option>
              <option value="productCount:desc">Mais produtos</option>
              <option value="productCount:asc">Menos produtos</option>
            </select>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="surface-flat overflow-hidden">
          <TableSkeleton rows={6} columns={3} />
        </div>
      ) : error ? (
        <div className="surface-flat p-6">
          <EmptyState title={error} icon={SearchX} />
        </div>
      ) : visible.length === 0 ? (
        <div className="surface-flat p-6">
          <EmptyState
            title="Nenhuma categoria encontrada."
            description="Ajuste a busca ou o filtro para ver outros resultados."
            icon={SearchX}
            action={
              <Button variant="outline" size="sm" onClick={openNew}>
                <Plus className="size-3.5" aria-hidden />
                Criar categoria
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onEdit={openEdit}
              onToggle={toggle}
              onDelete={setPendingDelete}
            />
          ))}
        </ul>
      )}

      {draft ? (
        <CategoryForm
          open
          draft={draft}
          onDraftChange={setDraft}
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
        title="Excluir categoria"
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
