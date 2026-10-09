'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/modal';
import { localId } from '@/lib/produtos/form';
import { PENDING_REASON } from '@/lib/conteudo/data';
import { byDisplayOrder, positionOf } from '@/lib/conteudo/metrics';
import { ListRow, ListStack } from './list-row';
import { EmptyLine } from './empty-line';
import { HeroSlideRow } from './conteudo-rows';
import { BannerForm } from './banner-form';
import { saveBanner, deleteBanner } from '@/lib/conteudo/data';
import { DEMO_HERO_DEFAULTS } from '@/lib/conteudo/demo';
import {
  newHeroSlideDraft,
  draftToHeroSlide,
  heroSlideToDraft,
  validateHeroSlide,
} from '@/lib/conteudo/form';
import type { HeroSlide, HeroSlideDraft, HeroSlideFieldErrors } from '@/lib/conteudo/types';

/**
 * A ABA `Hero Banner` — adm-053.
 *
 * ================== E A MESMA ENTIDADE DA TELA `Banners`, EM OUTRO DESENHO ==================
 *
 * Os dois slides desta lista sao os MESMOS tres de `/admin/banners` (adm-051): os
 * titulos, os subtitulos e a ordem batem linha a linha. E o mesmo caso de
 * `Avatar Virtual` / `Provador Virtual`, que dividem a secao de imagens das pecas.
 *
 * O QUE MUDA E O DESENHO, e a diferenca e do print:
 *
 *   /admin/banners    GRADE de cartoes, titulo SERIFADO, imagem sangrando na borda,
 *                     acoes em CAIXA ALTA com icone
 *   esta aba          LISTA de linhas, titulo SANS, miniatura contida, acoes
 *                     minusculas sublinhadas
 *
 * Por isso o cartao (`banner-card.tsx`) nao e reaproveitado aqui, e sim a linha
 * (`HeroSlideRow`). Trocar um pelo outro seria mudar o desenho da tela para
 * aproveitar um componente — a inversao que o modulo Provador recusou.
 *
 * ================== DUAS ACOES, E NAO TRES ==================
 *
 * Esta lista NAO tem `Desativar` por linha (ver `conteudo-rows.tsx`). O estado
 * `ativo/inativo` existe e aparece na meta (`Ordem 1 · ativo`); o que nao existe e o
 * ATALHO de trocar pela lista. Ele se troca pelo modal, que e onde o print oferece o
 * campo `Banner Ativo`.
 */
export function HeroList({ initial }: { initial: HeroSlide[] }) {
  const [slides, setSlides] = useState<HeroSlide[]>(() => byDisplayOrder(initial));
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<HeroSlideDraft>(() => newHeroSlideDraft(DEMO_HERO_DEFAULTS));
  const [errors, setErrors] = useState<HeroSlideFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState<HeroSlide | null>(null);

  const ordered = byDisplayOrder(slides);

  function openNew() {
    setEditingId(null);
    setDraft(newHeroSlideDraft(DEMO_HERO_DEFAULTS));
    setErrors({});
    setOpen(true);
  }

  function openEdit(slide: HeroSlide) {
    setEditingId(slide.id);
    setDraft(heroSlideToDraft(slide));
    setErrors({});
    setOpen(true);
  }

  async function submit() {
    const found = validateHeroSlide(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const slide = draftToHeroSlide(draft, editingId ?? localId('banner'));
    const result = await saveBanner(slide);

    setSlides((current) => {
      const exists = current.some((candidate) => candidate.id === slide.id);
      return exists
        ? current.map((candidate) => (candidate.id === slide.id ? slide : candidate))
        : [...current, slide];
    });
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
    setSaving(false);
    setOpen(false);
  }

  async function remove() {
    if (!confirming) return;
    const result = await deleteBanner(confirming.id);
    setSlides((current) => current.filter((c) => c.id !== confirming.id));
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
    setConfirming(null);
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Hero Banner"
        action={
          <Button onClick={openNew} className="uppercase tracking-[0.12em]">
            + Novo slide
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

      {ordered.length === 0 ? (
        <EmptyLine text="Nenhum slide cadastrado ainda." />
      ) : (
        <ListStack>
          {ordered.map((slide) => (
            <ListRow key={slide.id}>
              <HeroSlideRow
                title={slide.title}
                subtitle={slide.subtitle}
                order={positionOf(ordered, slide)}
                active={slide.isActive}
                onEdit={() => openEdit(slide)}
                onDelete={() => setConfirming(slide)}
              />
            </ListRow>
          ))}
        </ListStack>
      )}

      <BannerForm
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
        title="Excluir slide"
        description={
          confirming
            ? `O slide “${confirming.title}” sai da lista. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}
