'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FieldGrid, Input } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { ImageDropField } from './image-field';
import type { HeroSlideDraft, HeroSlideFieldErrors } from '@/lib/conteudo/types';

/**
 * O MODAL `Novo Banner` / `Editar banner` — adm-052.
 *
 * ================== OS CAMPOS SAO OS DO PRINT, NA ORDEM DO PRINT ==================
 *
 *   TÍTULO PRINCIPAL          campo, placeholder `Ex: Nova Coleção Primavera`
 *   EYEBROW (TEXTO SUPERIOR)  campo, com `Closet Lunar` preenchido
 *   SUBTÍTULO                 campo, placeholder `Breve descrição do banner`
 *   IMAGEM DESKTOP (PRINCIPAL) caixa tracejada
 *   IMAGEM MOBILE (OPCIONAL)   caixa tracejada
 *   LINK DO BANNER (URL)      campo, com `/categoria/novidades`
 *   TEXTO DO BOTÃO (CTA)      campo, com `Ver coleção`
 *   ORDEM DE EXIBIÇÃO         campo numerico estreito, com `0`
 *   Banner Ativo              checkbox MARCADO
 *   rodape                    `CANCELAR` (texto) + `SALVAR BANNER` (pilula preta)
 *
 * Nove campos, e o `HeroSlide` tem exatamente nove — nenhum sobrando, nenhum faltando.
 * Nao ha campo de VALIDADE nem de POSICAO: o placeholder anterior desta rota dizia que
 * a tela tinha "posição, validade e status", e nenhuma das tres existe no formulario.
 * O que existe e `Ordem de exibição` (um numero) e `Banner Ativo` (um booleano). A
 * diferenca importa: "ordem" e um numero que a pessoa digita; "posicao: topo/meio/rodape"
 * seria uma lista fechada que ninguem mostra.
 *
 * ================== O CHECKBOX E AZUL, E ISSO E DO MATERIAL ==================
 *
 * O quadradinho marcado mede `rgb(0,117,255)` — o AZUL NATIVO do navegador para
 * `input[type=checkbox]`, e nao uma cor do sistema de design. O print de `Exibir feed na
 * Home` (adm-058) tem o mesmo azul, e o de `Ordem + Ativo` de `/admin/categorias`
 * (adm-031) NAO tem (la e preto).
 *
 * (A aba `Instagram` e adm-058, e o numero confere: o deslocamento de uma posicao
 * comecava em `Hero Banner` (054 por 053) e terminava em `Beneficios` (058 por 057).
 * `Instagram` (058) e `Rodape` (059) — os dois ultimos da faixa — ja estavam certos.
 * Ver `demo.ts`.)
 *
 * As duas marcas convivem no material. Como o `Checkbox` do design system fixa a marca
 * em preto (`accent-foreground`), os dois campos deste grupo pedem o azul nativo de
 * volta por `accent-auto` — a classe que deixa o navegador desenhar. So vale porque o
 * `cn` do projeto e um `twMerge`: `accent-auto` SUBSTITUI `accent-foreground`, em vez
 * de duelar com ele. (Sem `twMerge`, as duas classes apareceriam e quem ganhasse seria
 * a ordem do CSS — o tipo de coisa que "funciona" ate mudar de versao.)
 *
 * ================== O AVISO DE IMAGEM NAO E `persisted` ==================
 *
 * `onError` sobe para a tela e vira a faixa de aviso. Nada aqui confirma gravacao: o
 * `Salvar banner` fecha o modal e a tela diz, por escrito, que nao gravou.
 */
export function BannerForm({
  open,
  onClose,
  draft,
  onDraftChange,
  editing,
  saving,
  errors,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  draft: HeroSlideDraft;
  onDraftChange: (draft: HeroSlideDraft) => void;
  editing: boolean;
  saving?: boolean;
  errors: HeroSlideFieldErrors;
  onSubmit: () => void;
}) {
  const [fileError, setFileError] = useState('');

  function set<K extends keyof HeroSlideDraft>(key: K, value: HeroSlideDraft[K]) {
    onDraftChange({ ...draft, [key]: value });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar banner' : 'Novo Banner'}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md px-2 py-1 text-[11px] font-bold tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            CANCELAR
          </button>
          <Button onClick={onSubmit} disabled={saving} className="uppercase tracking-[0.12em]">
            {saving ? 'Salvando…' : 'Salvar banner'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Título principal" htmlFor="banner-title" error={errors.title} required>
          <Input
            id="banner-title"
            value={draft.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="Ex: Nova Coleção Primavera"
            className="h-11"
          />
        </Field>

        <FieldGrid columns={2}>
          <Field label="Eyebrow (texto superior)" htmlFor="banner-eyebrow">
            <Input
              id="banner-eyebrow"
              value={draft.eyebrow}
              onChange={(event) => set('eyebrow', event.target.value)}
              className="h-11"
            />
          </Field>
          <Field label="Subtítulo" htmlFor="banner-subtitle">
            <Input
              id="banner-subtitle"
              value={draft.subtitle}
              onChange={(event) => set('subtitle', event.target.value)}
              placeholder="Breve descrição do banner"
              className="h-11"
            />
          </Field>
        </FieldGrid>

        <FieldGrid columns={2}>
          <ImageDropField
            label="Imagem desktop (principal)"
            value={draft.imageDesktopUrl}
            onChange={(url) => set('imageDesktopUrl', url)}
            onError={setFileError}
          />
          <ImageDropField
            label="Imagem mobile (opcional)"
            value={draft.imageMobileUrl}
            onChange={(url) => set('imageMobileUrl', url)}
            onError={setFileError}
            cta="ENVIAR VERSÃO CELULAR"
          />
        </FieldGrid>

        {fileError ? (
          <p role="alert" className="-mt-2 text-xs font-medium text-danger">
            {fileError}
          </p>
        ) : null}

        <FieldGrid columns={2}>
          <Field label="Link do banner (URL)" htmlFor="banner-link">
            <Input
              id="banner-link"
              value={draft.linkUrl}
              onChange={(event) => set('linkUrl', event.target.value)}
              placeholder="/categoria/novidades"
              className="h-11"
            />
          </Field>
          <Field label="Texto do botão (CTA)" htmlFor="banner-cta">
            <Input
              id="banner-cta"
              value={draft.ctaText}
              onChange={(event) => set('ctaText', event.target.value)}
              placeholder="Ver coleção"
              className="h-11"
            />
          </Field>
        </FieldGrid>

        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <Field label="Ordem de exibição" htmlFor="banner-order" error={errors.sortOrder}>
            <Input
              id="banner-order"
              inputMode="numeric"
              value={draft.sortOrder}
              onChange={(event) => set('sortOrder', event.target.value.replace(/[^\d]/g, ''))}
              className="h-11 w-24 tabular-nums"
            />
          </Field>

          <Checkbox
            checked={draft.isActive}
            onChange={(event) => set('isActive', event.target.checked)}
            label="Banner Ativo"
            className="pb-3 accent-auto"
          />
        </div>
      </div>
    </Modal>
  );
}
