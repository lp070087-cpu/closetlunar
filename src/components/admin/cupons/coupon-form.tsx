'use client';

import { AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldGrid, Input, Select } from '@/components/ui/form';
import type { CouponApplyTo, CouponDraft, CouponFieldErrors, CouponKind } from '@/lib/cupons/types';

/**
 * O formulario de cupom — adm-013.
 *
 * NAO E MODAL. O print mostra o bloco `Novo cupom` DENTRO da pagina, entre a
 * linha do contador e a tabela, com a tabela visivel por baixo. Abrir um modal
 * aqui seria trocar a interface que o print mostra por outra; o original tambem
 * e inline (`{(creating || editing) && <div ...>}`).
 *
 * ONZE CAMPOS EM DUAS COLUNAS, na ordem exata do print — lidos linha a linha:
 *
 *   CODIGO                        | NOME DA CAMPANHA (INTERNO)
 *   TIPO                          | PERCENTUAL (%)
 *   SUBTOTAL MINIMO (R$)          | QUANTIDADE MAXIMA (EM BRANCO = ILIMITADO)
 *   INICIO (OPCIONAL)             | VALIDADE (OPCIONAL)
 *   USO POR CLIENTE               | APLICAR EM
 *   STATUS                        |
 *
 * O ROTULO DO SEGUNDO CAMPO DA LINHA 2 MUDA COM O TIPO: `PERCENTUAL (%)` quando
 * e percentual, `VALOR (R$)` quando e valor fixo. Esta e uma condicional do
 * original (`draft.kind === "percent" ? "Percentual (%)" : "Valor (R$)"`) e o
 * print mostra o estado percentual.
 *
 * O CAMPO `PERCENTUAL (%)` ABRE COM `10` e o `SUBTOTAL MINIMO` com `0` — e nao
 * vazios. Ver `emptyDraft` em `lib/cupons/form.ts`, que transcreve os cinco
 * valores que o print mostra preenchidos.
 *
 * O AVISO AMBAR DO RODAPE e o unico elemento que NAO vem do print, e ele existe
 * por uma razao dura: o formulario tem um botao `SALVAR` e nao ha banco. Sem o
 * aviso, salvar um cupom pareceria ter funcionado e a loja so descobriria no
 * checkout. Ver `data.ts`.
 */
export function CouponForm({
  draft,
  errors,
  editingCode,
  saving,
  outcome,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: CouponDraft;
  errors: CouponFieldErrors;
  /** Codigo do cupom em edicao; `null` quando e um cupom novo. */
  editingCode: string | null;
  saving: boolean;
  /** `'none'` antes de salvar; `'unsaved'` depois de uma gravacao nao efetiva. */
  outcome: 'none' | 'unsaved';
  onChange: (next: CouponDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  // O RASCUNHO VIVE NA TELA (`cupons-view.tsx`); este componente so o edita e
  // sobe a mudanca. Um `useState` local aqui criaria DUAS fontes de verdade: o
  // formulario teria o proprio texto e a tela teria outro, e o `Cancelar`
  // (que descarta o rascunho de cima) nao limparia o de baixo.
  const patch = (fields: Partial<CouponDraft>) => {
    onChange({ ...draft, ...fields });
  };

  return (
    <div className="surface space-y-6 p-6 sm:p-8">
      <h3 className="font-serif text-lg">
        {editingCode ? `Editar ${editingCode}` : 'Novo cupom'}
      </h3>

      <FieldGrid columns={2}>
        <Field label="Código" htmlFor="cupom-codigo" error={errors.code}>
          {/*
            O `uppercase` e visual; a regra esta em `applyCode`, que e o que
            garante que o VALOR tambem suba. So a classe CSS gravaria minusculo
            num leitor de tela e num copiar/colar.
          */}
          <Input
            id="cupom-codigo"
            value={draft.code}
            onChange={(event) => patch({ code: event.target.value.toUpperCase() })}
            maxLength={32}
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase tracking-wider"
            aria-invalid={errors.code ? true : undefined}
          />
        </Field>

        <Field label="Nome da Campanha (Interno)" htmlFor="cupom-nome">
          <Input
            id="cupom-nome"
            value={draft.name}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder="Ex: Cupom Clientes VIP"
          />
        </Field>

        <Field label="Tipo" htmlFor="cupom-tipo">
          <Select
            id="cupom-tipo"
            value={draft.kind}
            onChange={(event) => patch({ kind: event.target.value as CouponKind })}
          >
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </Select>
        </Field>

        <Field
          label={draft.kind === 'percent' ? 'Percentual (%)' : 'Valor (R$)'}
          htmlFor="cupom-valor"
          error={errors.value}
        >
          <Input
            id="cupom-valor"
            type="number"
            min={0}
            step={draft.kind === 'percent' ? 1 : 0.01}
            value={draft.value}
            onChange={(event) => patch({ value: event.target.value })}
            aria-invalid={errors.value ? true : undefined}
          />
        </Field>

        <Field label="Subtotal mínimo (R$)" htmlFor="cupom-minimo">
          <Input
            id="cupom-minimo"
            type="number"
            min={0}
            step={0.01}
            value={draft.minSubtotal}
            onChange={(event) => patch({ minSubtotal: event.target.value })}
          />
        </Field>

        <Field
          label="Quantidade máxima (em branco = ilimitado)"
          htmlFor="cupom-max"
          error={errors.maxUses}
        >
          <Input
            id="cupom-max"
            type="number"
            min={0}
            value={draft.maxUses}
            onChange={(event) => patch({ maxUses: event.target.value })}
            aria-invalid={errors.maxUses ? true : undefined}
          />
        </Field>

        <Field label="Início (opcional)" htmlFor="cupom-inicio">
          <Input
            id="cupom-inicio"
            type="date"
            value={draft.startsAt}
            onChange={(event) => patch({ startsAt: event.target.value })}
          />
        </Field>

        <Field label="Validade (opcional)" htmlFor="cupom-validade">
          <Input
            id="cupom-validade"
            type="date"
            value={draft.expiresAt}
            onChange={(event) => patch({ expiresAt: event.target.value })}
          />
        </Field>

        <Field label="Uso por Cliente" htmlFor="cupom-por-cliente">
          <Input
            id="cupom-por-cliente"
            type="number"
            min={1}
            value={draft.usageLimitPerUser}
            onChange={(event) => patch({ usageLimitPerUser: event.target.value })}
          />
        </Field>

        <Field label="Aplicar em" htmlFor="cupom-aplicar">
          <Select
            id="cupom-aplicar"
            value={draft.applyTo}
            onChange={(event) => patch({ applyTo: event.target.value as CouponApplyTo })}
          >
            <option value="all">Todo o site</option>
            <option value="products">Produtos específicos</option>
            <option value="categories">Categorias específicas</option>
          </Select>
        </Field>

        <Field label="Status">
          {/*
            `Field` com `label` de bloco e um checkbox dentro, como no print: o
            rotulo `STATUS` fica ACIMA do quadradinho `Ativo`, e nao ao lado.
          */}
          <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => patch({ isActive: event.target.checked })}
              className="size-4 cursor-pointer accent-foreground"
            />
            <span className="font-medium">Ativo</span>
          </label>
        </Field>
      </FieldGrid>

      {/*
        O AVISO DE ESCOPO NAO IMPLEMENTADO. O seletor `Aplicar em` oferece
        `Produtos especificos` e `Categorias especificas`, mas NENHUM print
        mostra a lista que eles abrem. Ele aparece so quando uma dessas opcoes
        esta escolhida — nao polui o estado que o print mostra (`Todo o site`).
      */}
      {draft.applyTo !== 'all' ? (
        <p
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-surface/50 p-3 text-xs text-warning-foreground"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            A seleção de {draft.applyTo === 'products' ? 'produtos' : 'categorias'} ainda não tem
            tela em nenhuma referência. O cupom fica salvo com o escopo escolhido e sem alvos, ou
            seja, sem efeito até esta lista existir.
          </span>
        </p>
      ) : null}

      {outcome === 'unsaved' ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-surface/50 p-3 text-xs"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
          <p className="text-warning-foreground">
            Cupom mantido apenas nesta sessão. A gravação no banco entra na fase de integração com
            o Neon — ao recarregar a página, a lista volta ao que está no banco.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-4">
        {/* `Cancelar` e TEXTO cinza no print, nao um botao com borda. */}
        <button
          type="button"
          onClick={onCancel}
          className="focus-ring text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancelar
        </button>
        <Button type="button" size="sm" loading={saving} onClick={onSubmit}>
          {saving ? 'Salvando' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}

/**
 * O RODAPE DA TELA QUANDO A GRAVACAO NAO PERSISTE — fora do formulario.
 *
 * Existe separado porque o aviso precisa sobreviver ao FECHAMENTO do formulario:
 * o original fecha o bloco depois de salvar (`cancel()` no fim de `save()`), e
 * se o aviso morasse dentro dele o usuario fecharia o formulario e nao veria
 * nunca a informacao de que nada foi gravado. Aqui ele fica na lista.
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
        O cupom foi aplicado na lista desta sessão, mas <strong>não foi gravado no banco</strong>.
        Ele não vale no checkout enquanto o Neon não estiver conectado.
      </p>
    </div>
  );
}
