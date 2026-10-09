'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import type { AffiliateDraft } from '@/lib/afiliadas/types';
import type { AffiliateFieldErrors } from '@/lib/afiliadas/form';

/**
 * O formulario de afiliada — adm-022.
 *
 * E UM MODAL, e nao um bloco inline como o de Cupons. A diferenca e do
 * MATERIAL, e nao uma escolha: adm-022 mostra o painel branco CENTRALIZADO
 * sobre a lista escurecida, com o titulo `Nova Afiliada` e o rodape `Cancelar` +
 * `Salvar`. O original tambem e modal (`<div className="fixed inset-0 z-50
 * bg-black/40 …">`), e nao o bloco inline do formulario de cupom.
 *
 * SEIS CAMPOS EM DUAS COLUNAS, na ordem exata do print:
 *
 *   NOME .................................. (largura cheia, `col-span-2`)
 *   E-MAIL ................................ (largura cheia, `col-span-2`)
 *   CUPOM (EX: LUNA10)  |  SLUG (EX: LUNA10)
 *   [Percentual (%)]    |  [10]
 *
 * Nome e e-mail ocupam a LINHA INTEIRA nos dois casos — esta e a unica celula
 * que o print deixa inequivoca, porque os dois campos sao visivelmente mais
 * largos que os outros dois da metade de baixo. E o que o original faz com
 * `col-span-2`.
 *
 * O PLACEHOLDER E O TEXTO DE AJUDA, e nao um rotulo: o print nao tem rotulo em
 * campo nenhum — o que a pessoa le dentro do campo vazio e `Nome`, `E-mail`,
 * `Cupom (ex: LUNA10)`, `Slug (ex: luna10)`. Manter isso fiel e o ponto: um
 * `<Field label>` acima de cada campo seria mais acessivel e MENOS igual ao
 * print. O `aria-label` cobre a acessibilidade sem mudar o que se ve.
 *
 * O SELETOR NAO TEM VALOR AO LADO, SO O TIPO. No print, o campo da direita
 * mostra `10` e o da esquerda mostra `Percentual (%)` — ou seja, o seletor diz o
 * TIPO e o campo diz o VALOR. Nao ha rotulo `Valor` em lugar nenhum, e por isso
 * nao ha `<label>` aqui: o rotulo e o proprio texto do seletor.
 *
 * O TITULO MUDA COM O MODO: `Nova Afiliada` ou `Editar Afiliada`. O original
 * escreve `{val.id ? "Editar" : "Nova"} Afiliada` — a diferenca e o `val.id`,
 * que e vazio numa afiliada nova. Ver `emptyDraft` em `lib/afiliadas/form.ts`.
 *
 * O AVISO AMBAR DO RODAPE e o unico elemento que NAO vem do print, e ele existe
 * pela mesma razao do aviso de Cupons: o modal tem um botao `Salvar` e nao ha
 * banco. Sem o aviso, cadastrar uma afiliada pareceria ter funcionado e a
 * comissao dela nao existiria em lugar nenhum.
 */
export function AffiliateForm({
  draft,
  errors,
  saving,
  outcome,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: AffiliateDraft;
  errors: AffiliateFieldErrors;
  saving: boolean;
  /** `'none'` antes de salvar; `'unsaved'` depois de uma gravacao nao efetiva. */
  outcome: 'none' | 'unsaved';
  onChange: (next: AffiliateDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  // O RASCUNHO VIVE NA TELA (`affiliates-view.tsx`); este componente so o edita.
  // Um `useState` local aqui criaria DUAS fontes de verdade — o formulario
  // teria o proprio texto e a tela teria outro, e o `Cancelar` (que descarta o
  // rascunho de cima) nao limparia o de baixo.
  const patch = (fields: Partial<AffiliateDraft>) => {
    onChange({ ...draft, ...fields });
  };

  const isEditing = draft.id !== '';

  return (
    <Modal
      open
      onClose={onCancel}
      title={isEditing ? 'Editar Afiliada' : 'Nova Afiliada'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={saving}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/*
          AS QUATRO LINHAS DO PRINT. O `gap-3` e o espacamento entre as linhas
          do original (`space-y-4` no modal, `gap-3` na grade) — a grade usa
          `grid-cols-2` para que a terceira e a quarta linha fiquem lado a lado.
        */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input
              aria-label="Nome"
              placeholder="Nome"
              value={draft.name}
              onChange={(event) => patch({ name: event.target.value })}
              autoComplete="off"
            />
          </div>

          <div className="col-span-2">
            <Input
              aria-label="E-mail"
              type="email"
              placeholder="E-mail"
              value={draft.email}
              onChange={(event) => patch({ email: event.target.value })}
              autoComplete="off"
              error={errors.email}
            />
          </div>

          <Input
            aria-label="Cupom"
            placeholder="Cupom (ex: LUNA10)"
            value={draft.couponCode}
            // A MAIUSCULA E A CADA TECLA, como o original. Ver `applyCouponCode`.
            onChange={(event) => patch({ couponCode: event.target.value.toUpperCase() })}
            maxLength={32}
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase tracking-wider"
            error={errors.couponCode}
          />

          <Input
            aria-label="Slug"
            placeholder="Slug (ex: luna10)"
            value={draft.referralSlug}
            // Minuscula e ESPACO virando hifen, a cada tecla. Ver
            // `applyReferralSlug` para por que o `replace` leva `/g`.
            onChange={(event) =>
              patch({ referralSlug: event.target.value.toLowerCase().replace(/ /g, '-') })
            }
            maxLength={48}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />

          {/*
            O SELETOR: o rotulo e o proprio texto da opcao. As duas opcoes sao as
            do original — `Percentual (%)` e `Valor Fixo (R$)`. A primeira e a
            que o print mostra.
          */}
          <Select
            aria-label="Tipo de comissão"
            value={draft.commissionType}
            onChange={(event) =>
              patch({ commissionType: event.target.value === 'fixed' ? 'fixed' : 'percentage' })
            }
          >
            <option value="percentage">Percentual (%)</option>
            <option value="fixed">Valor Fixo (R$)</option>
          </Select>

          {/*
            O VALOR. `inputMode="decimal"` em vez de `type="number"`: o
            `type="number"` do original reescreve o campo com `0` quando ele e
            apagado (o `Number('')` do `onChange`), e apagar o campo para
            redigitar e o gesto mais comum. Com o rascunho em string e o
            `decimal`, o campo aceita ficar vazio. Ver `types.ts`.
          */}
          <Input
            aria-label="Valor da comissão"
            inputMode="decimal"
            placeholder="10"
            value={draft.commissionValue}
            onChange={(event) => patch({ commissionValue: event.target.value })}
            autoComplete="off"
          />
        </div>

        {/*
          O AVISO DE "NAO GRAVADO". Ele fica DEPOIS da grade e ANTES do rodape,
          e aparece depois de um salvamento que nao persistiu. Ver o cabecalho.
        */}
        {outcome === 'unsaved' ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-surface/50 p-3.5 text-xs"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
            <p className="text-warning-foreground">
              A afiliada foi alterada somente nesta tela, mas não foi gravada no banco. Enquanto o
              Neon não estiver conectado, ela não recebe comissão nenhuma.
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
