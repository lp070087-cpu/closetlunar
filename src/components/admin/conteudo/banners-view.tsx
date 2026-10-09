'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/modal';
import { localId } from '@/lib/produtos/form';
import { PENDING_REASON } from '@/lib/conteudo/data';
import { byDisplayOrder, positionOf } from '@/lib/conteudo/metrics';
import {
  newHeroSlideDraft,
  draftToHeroSlide,
  heroSlideToDraft,
  validateHeroSlide,
} from '@/lib/conteudo/form';
import { DEMO_HERO_DEFAULTS } from '@/lib/conteudo/demo';
import { saveBanner, deleteBanner, toggleBanner } from '@/lib/conteudo/data';
import { EmptyLine } from './empty-line';
import type { HeroSlide, HeroSlideDraft, HeroSlideFieldErrors } from '@/lib/conteudo/types';
import { BannerCard } from './banner-card';
import { BannerForm } from './banner-form';

/**
 * `/admin/banners` — reconstruida de adm-051 (a grade) e adm-052 (o modal).
 *
 * ================== O QUE ESTA TELA FAZ, E O QUE ELA NAO FAZ ==================
 *
 * FAZ: abrir o modal, criar e editar um slide no ESTADO da tela, ativar/desativar,
 * ordenar por `ORDEM`, e excluir com confirmacao.
 *
 * NAO FAZ: gravar. `saveBanner` devolve `persisted: false` e a tela mostra a faixa
 * dizendo isso — em vez do `toast.success` do original, que adicionaria a linha na
 * lista como se tivesse ido para o banco. Essa diferenca e o ponto do modulo.
 *
 * ================== A LISTA ORDENADA E A FONTE DA COLUNA `ORDEM` ==================
 *
 * O modal abre com `Ordem de exibição: 0` e a grade imprime `ORDEM: 1`, `ORDEM: 2`,
 * `ORDEM: 3`. Os dois numeros NAO sao o mesmo campo: o da grade e a POSICAO (derivada de
 * `positionOf` sobre a lista ja ordenada), e o do modal e o `sortOrder` gravado.
 *
 * Por isso a tela ordena UMA VEZ (`byDisplayOrder`) e usa essa mesma lista para
 * desenhar e para numerar. Ordenar em dois lugares daria dois donos da mesma ordem — e
 * a numeracao poderia discordar da sequencia impressa.
 */
export function BannersView({ initial }: { initial: HeroSlide[] }) {
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
    // O id de um slide NOVO e gerado aqui, pelo mesmo `localId` das imagens de
    // produto: a camada de dados nao gera id (ver `newLook` em `data.ts`).
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

  async function toggle(slide: HeroSlide) {
    const next = { ...slide, isActive: !slide.isActive };
    const result = await toggleBanner(next);
    setSlides((current) => current.map((c) => (c.id === next.id ? next : c)));
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
  }

  async function remove() {
    if (!confirming) return;
    const result = await deleteBanner(confirming.id);
    setSlides((current) => current.filter((c) => c.id !== confirming.id));
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
    setConfirming(null);
  }

  return (
    <div className="space-y-6 motion-safe:animate-fade-in">
      <SectionHeader
        title="Gerenciamento de Banners"
        description="Configure os banners principais da loja para Desktop e Mobile."
        action={
          <Button onClick={openNew} className="uppercase tracking-[0.12em]">
            <Plus className="size-4" aria-hidden />
            Novo Banner
          </Button>
        }
      />

      {notice ? (
        <p role="status" className="rounded-xl border border-warning/40 bg-warning-surface px-4 py-3 text-xs text-foreground">
          {notice}
        </p>
      ) : null}

      {ordered.length === 0 ? (
        <EmptyLine text="Nenhum banner cadastrado ainda." />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((slide) => (
            <BannerCard
              key={slide.id}
              slide={slide}
              order={positionOf(ordered, slide)}
              onEdit={() => openEdit(slide)}
              onToggle={() => void toggle(slide)}
              onDelete={() => setConfirming(slide)}
            />
          ))}
        </ul>
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
        title="Excluir banner"
        description={
          confirming
            ? `O banner “${confirming.title}” sai da lista. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}
