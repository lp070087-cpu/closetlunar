'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/modal';
import { CategoryForm } from '@/components/admin/categorias/category-form';
import {
  draftFromCategory,
  draftToCategory,
  emptyDraft,
  hasErrors,
  localId,
  validateDraft,
} from '@/lib/categorias/form';
import { createCategory, deleteCategory, updateCategory } from '@/lib/categorias/data';
import { PENDING_REASON } from '@/lib/conteudo/data';
import { positionOf, toSiteCategories } from '@/lib/conteudo/metrics';
import { ListRow, ListStack } from './list-row';
import { EmptyLine } from './empty-line';
import { SiteCategoryRow } from './conteudo-rows';
import type { Category, CategoryDraft, CategoryFieldErrors } from '@/lib/categorias/types';

/**
 * A ABA `Categorias` — adm-054.
 *
 * ================== NAO E UMA LISTA NOVA — E A MESMA ENTIDADE, OUTRO DESENHO ==================
 *
 * As categorias desta aba SAO as categorias de `/admin/categorias` (adm-030/031). O
 * cabecalho da propria camada de dados ja registra a decisao: `listSiteCategories` faz
 * um JOIN em `lib/categorias`, e nao uma constante propria — porque uma constante aqui
 * criaria um SEGUNDO dono das categorias, e a lista desta aba divergiria da outra no
 * primeiro rename.
 *
 * O que muda entre as duas telas e o DESENHO:
 *
 *   /admin/categorias    nome SERIFADO, miniatura CIRCULAR, seis linhas
 *   esta aba             nome SANS (`text-xl`), miniatura CONDICIONAL/proporcional
 *
 * Ver a nota de tipografia em `list-row.tsx` e a da miniatura em `conteudo-rows.tsx`.
 *
 * ================== E POR ISSO O `CategoryForm` E REUSADO ==================
 *
 * O botao `+ Nova categoria` desta aba abre O MESMO modal de adm-031 — que esta provado
 * por captura (`category-form.tsx`). Inventar um formulario "de aba" aqui seria duplicar
 * um formulario inteiro para sair identico, e criar duas traduções de `Category` que se
 * desincronizam. O painel reusa `lib/categorias` INTEIRO: mesmo `draft`, mesma validacao,
 * mesmos escritores (`createCategory`/`updateCategory`). Nada e gravado — os escritores
 * devolvem `persisted: false`, como todo o painel nesta fase.
 *
 * ================== O CORTE `SiteCategory` CONTINUA EXISTINDO ==================
 *
 * O painel recebe a `Category` COMPLETA (o formulario precisa dos campos de SEO que a
 * linha nao desenha) e deriva o corte `SiteCategory` so para as linhas, com
 * `toSiteCategories`. E o corte que carrega o `imageUrl` condicional que a linha usa.
 */
export function CategoriasPanel({ initial }: { initial: Category[] }) {
  const [rows, setRows] = useState<Category[]>(() => sortByOrder(initial));
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryDraft>(() => emptyDraft(initial));
  const [errors, setErrors] = useState<CategoryFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState<Category | null>(null);

  const ordered = sortByOrder(rows);
  const corte = toSiteCategories(ordered);

  function openNew() {
    setEditingId(null);
    setDraft(emptyDraft(ordered));
    setErrors({});
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditingId(category.id);
    setDraft(draftFromCategory(category));
    setErrors({});
    setOpen(true);
  }

  async function submit() {
    const found = validateDraft(draft, ordered, editingId ?? undefined);
    setErrors(found);
    if (hasErrors(found)) return;

    setSaving(true);
    const base =
      editingId !== null
        ? ordered.find((row) => row.id === editingId)!
        : { id: localId(), createdAt: new Date().toISOString() };

    const category = draftToCategory(draft, base);
    const result = editingId !== null ? await updateCategory(category) : await createCategory(category);

    setRows((current) => {
      const exists = current.some((candidate) => candidate.id === category.id);
      return exists
        ? current.map((candidate) => (candidate.id === category.id ? category : candidate))
        : [...current, category];
    });
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
    setSaving(false);
    setOpen(false);
  }

  async function toggle(category: Category) {
    const next = { ...category, isActive: !category.isActive };
    const result = await updateCategory(next);
    setRows((current) => current.map((c) => (c.id === next.id ? next : c)));
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
  }

  async function remove() {
    if (!confirming) return;
    const result = await deleteCategory(confirming.id);
    setRows((current) => current.filter((c) => c.id !== confirming.id));
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
    setConfirming(null);
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Categorias"
        action={
          <Button onClick={openNew} className="uppercase tracking-[0.12em]">
            + Nova categoria
          </Button>
        }
      />

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-warning/40 bg-warning-surface px-4 py-3 text-xs text-foreground"
        >
          {notice}
        </p>
      ) : null}

      {corte.length === 0 ? (
        <EmptyLine text="Nenhuma categoria cadastrada ainda." />
      ) : (
        <ListStack>
          {corte.map((category) => {
            const full = ordered.find((row) => row.id === category.id)!;
            return (
              <ListRow key={category.id}>
                <SiteCategoryRow
                  category={category}
                  imageUrl={category.imageUrl}
                  onEdit={() => openEdit(full)}
                  onToggle={() => void toggle(full)}
                  onDelete={() => setConfirming(full)}
                />
              </ListRow>
            );
          })}
        </ListStack>
      )}

      <CategoryForm
        open={open}
        onClose={() => setOpen(false)}
        draft={draft}
        onDraftChange={setDraft}
        editing={editingId !== null}
        saving={saving}
        errors={errors}
        onSubmit={() => void submit()}
      />

      <ConfirmModal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => void remove()}
        title="Excluir categoria"
        description={
          confirming
            ? `A categoria “${confirming.name}” sai da lista. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}

/**
 * A ORDEM DA LISTA.
 *
 * `byDisplayOrder` de `metrics.ts` exige `{ sortOrder, title }`, e `Category` tem
 * `name` no lugar de `title` — entao o desempate aqui e por `name`, e a ordenacao e
 * local. E o mesmo criterio da lista de `/admin/categorias`: `sortOrder` primeiro,
 * nome para empatar.
 */
function sortByOrder(rows: readonly Category[]): Category[] {
  return [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}
