'use client';

import { AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldGrid, Input, Select } from '@/components/ui/form';
import { CAMPAIGN_TYPE_OPTIONS, DISCOUNT_TYPE_OPTIONS } from '@/lib/campanhas/metrics';
import type {
  CampaignDiscountType,
  CampaignDraft,
  CampaignFieldErrors,
  CampaignType,
} from '@/lib/campanhas/types';

/**
 * O formulario de campanha — adm-016 e adm-017.
 *
 * NAO E MODAL. O print mostra o bloco `Nova Campanha` DENTRO da pagina, entre a
 * linha do contador e a tabela, com a tabela visivel por baixo. O original
 * tambem e inline (`{(creating || editing) && <div ...>}`). E a mesma decisao de
 * Cupons.
 *
 * OITO CAMPOS EM DUAS COLUNAS, na ordem exata do print — lidos linha a linha:
 *
 *   NOME DA CAMPANHA ......... | TIPO DE PROMOÇÃO
 *   VALOR DO DESCONTO ........ | TIPO DE VALOR
 *   PEDIDO MÍNIMO (R$) ....... | TEXTO DO SELO (BADGE)
 *   DATA INÍCIO .............. | DATA EXPIRAÇÃO
 *
 * AO CONTRARIO DE CUPONS, O ROTULO DO CAMPO DE VALOR NAO MUDA COM O TIPO: os dois
 * prints dizem `VALOR DO DESCONTO` nas duas linhas, com `TIPO DE VALOR` em
 * `Porcentagem (%)`. Em Cupons o rotulo trocava entre `Percentual (%)` e
 * `Valor (R$)`. Sao decisoes diferentes do material, e cada tela segue a sua.
 *
 * DOIS CAMPOS TRAZEM `placeholder` NO PRINT, e os dois foram transcritos:
 * `Ex: Black Friday 2026` no nome e `Ex: 20% OFF` no selo. Os outros nao tem.
 *
 * A `DATA INÍCIO` ABRE PREENCHIDA COM O DIA (o print mostra `28/09/2026`, a data
 * da captura) e a `DATA EXPIRAÇÃO` abre vazia, mostrando `dd/mm/aaaa`. Quem
 * preenche a primeira e `emptyDraft(today)`.
 *
 * O AVISO AMBAR DO RODAPE e o unico elemento que NAO vem do print, e ele existe
 * pela mesma razao de Cupons: ha um botao `SALVAR CAMPANHA` e nao ha banco. Sem o
 * aviso, salvar pareceria ter funcionado. Ver `data.ts`.
 */
export function CampaignForm({
  draft,
  errors,
  editingName,
  saving,
  outcome,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: CampaignDraft;
  errors: CampaignFieldErrors;
  /** Nome da campanha em edicao; `null` quando e uma campanha nova. */
  editingName: string | null;
  saving: boolean;
  /** `'none'` antes de salvar; `'unsaved'` depois de uma gravacao nao efetiva. */
  outcome: 'none' | 'unsaved';
  onChange: (next: CampaignDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  // O RASCUNHO VIVE NA TELA (`campanhas-view.tsx`); este componente so o edita e
  // sobe a mudanca. Um `useState` local aqui criaria DUAS fontes de verdade, e o
  // `Cancelar` (que descarta o rascunho de cima) nao limparia o de baixo.
  const patch = (fields: Partial<CampaignDraft>) => {
    onChange({ ...draft, ...fields });
  };

  return (
    <div className="surface space-y-6 p-6 sm:p-8">
      <h3 className="font-serif text-lg">
        {editingName ? `Editar ${editingName}` : 'Nova Campanha'}
      </h3>

      <FieldGrid columns={2}>
        <Field label="Nome da Campanha" htmlFor="campanha-nome" error={errors.name}>
          <Input
            id="campanha-nome"
            value={draft.name}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder="Ex: Black Friday 2026"
            aria-invalid={errors.name ? true : undefined}
          />
        </Field>

        <Field label="Tipo de Promoção" htmlFor="campanha-tipo">
          <Select
            id="campanha-tipo"
            value={draft.type}
            onChange={(event) => patch({ type: event.target.value as CampaignType })}
            options={CAMPAIGN_TYPE_OPTIONS}
          />
        </Field>

        <Field label="Valor do Desconto" htmlFor="campanha-valor" error={errors.discountValue}>
          {/*
            O campo e VAZIO por padrao, e nao `0`. Ver `emptyDraft`.
            O `step` acompanha o tipo: porcentagem aceita inteiro, valor fixo
            aceita centavos.
          */}
          <Input
            id="campanha-valor"
            type="number"
            min={0}
            step={draft.discountType === 'percentage' ? 1 : 0.01}
            value={draft.discountValue}
            onChange={(event) => patch({ discountValue: event.target.value })}
            aria-invalid={errors.discountValue ? true : undefined}
          />
        </Field>

        <Field label="Tipo de Valor" htmlFor="campanha-tipo-valor">
          <Select
            id="campanha-tipo-valor"
            value={draft.discountType}
            onChange={(event) => patch({ discountType: event.target.value as CampaignDiscountType })}
            options={DISCOUNT_TYPE_OPTIONS}
          />
        </Field>

        <Field label="Pedido Mínimo (R$)" htmlFor="campanha-minimo">
          <Input
            id="campanha-minimo"
            type="number"
            min={0}
            step={0.01}
            value={draft.minOrderValue}
            onChange={(event) => patch({ minOrderValue: event.target.value })}
          />
        </Field>

        <Field label="Texto do Selo (Badge)" htmlFor="campanha-selo">
          <Input
            id="campanha-selo"
            value={draft.badgeText}
            onChange={(event) => patch({ badgeText: event.target.value })}
            placeholder="Ex: 20% OFF"
          />
        </Field>

        <Field label="Data Início" htmlFor="campanha-inicio">
          <Input
            id="campanha-inicio"
            type="date"
            value={draft.startsAt}
            onChange={(event) => patch({ startsAt: event.target.value })}
          />
        </Field>

        <Field label="Data Expiração" htmlFor="campanha-expiracao">
          <Input
            id="campanha-expiracao"
            type="date"
            value={draft.expiresAt}
            onChange={(event) => patch({ expiresAt: event.target.value })}
          />
        </Field>
      </FieldGrid>

      {/*
        O AVISO DE QUE NADA FOI GRAVADO. Aparece so DEPOIS de salvar (nao no
        estado que o print mostra), e o formulario ja fechou quando ele entra —
        por isso o mesmo aviso tambem existe fora daqui, em `UnsavedNotice`.
      */}
      {outcome === 'unsaved' ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-surface/50 p-3 text-xs"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
          <p className="text-warning-foreground">
            Campanha mantida apenas nesta sessão. A gravação no banco entra na fase de integração
            com o Neon — ao recarregar a página, a lista volta ao que está no banco.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
        {/* `Cancelar` e TEXTO cinza no print, nao um botao com borda. */}
        <button
          type="button"
          onClick={onCancel}
          className="focus-ring text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancelar
        </button>
        <Button type="button" size="sm" loading={saving} onClick={onSubmit}>
          {saving ? 'Salvando' : 'Salvar Campanha'}
        </Button>
      </div>
    </div>
  );
}

/**
 * O AVISO FORA DO FORMULARIO.
 *
 * Existe separado porque o formulario FECHA depois de salvar (o original faz
 * `setCreating(false)`), e se o aviso morasse dentro dele o usuario fecharia o
 * bloco e nunca veria a informacao de que nada foi gravado. Mesma solucao de
 * Cupons (`UnsavedNotice`).
 */
export function UnsavedNotice({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-surface/50 p-4 text-xs"
    >
      <Check className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
      <p className="text-warning-foreground">
        A campanha foi aplicada na lista desta sessão, mas <strong>não foi gravada no banco</strong>.
        Ela não vale na loja enquanto o Neon não estiver conectado.
      </p>
    </div>
  );
}
