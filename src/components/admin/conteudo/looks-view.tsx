'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/modal';
import { localId } from '@/lib/produtos/form';
import { DEMO_LOOK_DEFAULTS, LOOKS_EMPTY_TEXT } from '@/lib/conteudo/demo';
import { PENDING_REASON, deleteLook, saveLook, toggleLook } from '@/lib/conteudo/data';
import { newLookDraft, lookToDraft, draftToLook, validateLook } from '@/lib/conteudo/form';
import { ListStack } from './list-row';
import { EmptyLine } from './empty-line';
import { LookRow } from './look-row';
import { LookModal } from './look-modal';
import type { Look, LookDraft, LookFieldErrors } from '@/lib/conteudo/types';
import type { Product } from '@/lib/produtos/types';

/**
 * `/admin/looks` — a lista (adm-061) e o modal (adm-062).
 *
 * ================== OS DOIS PRINTS DESTA TELA ==================
 *
 *   adm-061  a lista VAZIA: `Monte seu Look`, o subtitulo, `Nenhum look cadastrado
 *            ainda.` e o botao `Novo look` a direita.
 *   adm-062  o modal que aquele botao abre, com os dez produtos do catalogo.
 *
 * O ESTADO DE ABERTURA DA TELA E O VAZIO — nao porque faltou dado, mas porque o print
 * mostra a lista vazia. `DEMO_LOOKS` e `[]` de proposito. Ver `demo.ts`.
 *
 * ================== O CATALOGO VEM DE `lib/produtos` ==================
 *
 * Os dez cartoes de adm-062 NAO sao transcritos aqui: eles sao o catalogo de produtos
 * pelo mesmo JOIN do modulo Provador. A pagina carrega os produtos no servidor e os
 * passa adiante; a lista de looks e vazia, mas a LISTA DE PRODUTOS nao — e por isso a
 * tela precisa dos dois datasets.
 *
 * ================== O TITULO MUDA ENTRE NAVEGAR E EDITAR? NAO ==================
 *
 * `Monte seu Look` fica no cabecalho nos dois estados. O check do subtitulo (`Combos
 * curados — pronto para futura assinatura SaaS.`) confirma o que a tela E hoje, e o
 * material nao a contradiz.
 */
export function LooksView({
  initial,
  products,
}: {
  initial: Look[];
  products: readonly Product[];
}) {
  const [looks, setLooks] = useState<Look[]>(initial);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LookDraft>(() => newLookDraft(localId('look'), DEMO_LOOK_DEFAULTS));
  const [errors, setErrors] = useState<LookFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState<Look | null>(null);

  function openNew() {
    setDraft(newLookDraft(localId('look'), DEMO_LOOK_DEFAULTS));
    setErrors({});
    setOpen(true);
  }

  function openEdit(look: Look) {
    setDraft(lookToDraft(look));
    setErrors({});
    setOpen(true);
  }

  async function submit() {
    const found = validateLook(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const look = draftToLook(draft);
    const result = await saveLook(look);

    setLooks((current) => {
      const exists = current.some((candidate) => candidate.id === look.id);
      return exists
        ? current.map((candidate) => (candidate.id === look.id ? look : candidate))
        : [...current, look];
    });
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
    setSaving(false);
    setOpen(false);
  }

  async function toggle(look: Look) {
    const next = { ...look, isActive: !look.isActive };
    const result = await toggleLook(next);
    setLooks((current) => current.map((c) => (c.id === next.id ? next : c)));
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
  }

  async function remove() {
    if (!confirming) return;
    const result = await deleteLook(confirming.id);
    setLooks((current) => current.filter((c) => c.id !== confirming.id));
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
    setConfirming(null);
  }

  return (
    <div className="space-y-6 motion-safe:animate-fade-in">
      <SectionHeader
        title="Monte seu Look"
        description="Combos curados — pronto para futura assinatura SaaS."
        action={
          <Button onClick={openNew} className="uppercase tracking-[0.12em]">
            Novo look
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

      {looks.length === 0 ? (
        <EmptyLine text={LOOKS_EMPTY_TEXT} />
      ) : (
        <ListStack>
          {looks.map((look) => (
            <LookRow
              key={look.id}
              look={look}
              products={products}
              onEdit={() => openEdit(look)}
              onToggle={() => void toggle(look)}
              onDelete={() => setConfirming(look)}
            />
          ))}
        </ListStack>
      )}

      <LookModal
        open={open}
        onClose={() => setOpen(false)}
        draft={draft}
        onDraftChange={setDraft}
        products={products}
        editing={looks.some((look) => look.id === draft.id)}
        saving={saving}
        errors={errors}
        onSubmit={() => void submit()}
      />

      <ConfirmModal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => void remove()}
        title="Excluir look"
        description={
          confirming
            ? `O look “${confirming.name}” sai da lista. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}
