'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  ELASTICITY_OPTIONS,
  MODELING_OPTIONS,
  NOTES_PLACEHOLDER,
} from '@/lib/tamanhos/metrics';
import {
  draftFromRule,
  hasRuleErrors,
  isRuleDirty,
  validateRule,
  type RuleDraft,
} from '@/lib/tamanhos/form';
import type { Elasticity, Modeling, ProductRuleRow as Row, ProductSizeRule } from '@/lib/tamanhos/types';

/**
 * Linha de `Regras por Produto` (adm-034 a adm-037).
 *
 * MEDIDO NO PRINT:
 *
 * - A esquerda, o nome do produto em serifado, precedido de um quadrado bege
 *   arredondado com o icone de caixa.
 * - Depois, NA ORDEM: `Modelagem`, `Elasticidade`, o campo de observacao com o
 *   placeholder `Ex: Tecido firme, não estica`, e o botao preto `SALVAR`.
 * - As duas listas suspensas dos prints: modelagem = `Modelagem pequena`,
 *   `Modelagem normal`, `Modelagem grande`; elasticidade = `Pouca
 *   elasticidade`, `Média elasticidade`, `Alta elasticidade`.
 * - O botao `SALVAR` fica em TODAS as linhas, sempre visivel, e nao so quando
 *   ha mudanca. O print nao marca linha suja; por isso a marcacao de "alterado"
 *   aqui e discreta (um ponto no nome) e nao muda o desenho do botao.
 *
 * O que o print NAO mostra e por isso NAO esta aqui: desfazer, duplicar regra,
 * botao de resetar para o padrao. Um botao a mais seria invencao.
 */

export function ProductRuleRow({
  row,
  saving,
  onSave,
}: {
  row: Row;
  saving: boolean;
  onSave: (rule: ProductSizeRule) => void;
}) {
  const [draft, setDraft] = useState<RuleDraft>(() => draftFromRule(row.rule));

  // Quando a regra de fora muda (a gravacao voltou, ou a lista recarregou), o
  // rascunho acompanha. Sem isso a linha continuaria mostrando o texto antigo
  // depois de salvar.
  useEffect(() => {
    setDraft(draftFromRule(row.rule));
  }, [row.rule]);

  const errors = validateRule(draft);
  const dirty = isRuleDirty(draft, row.rule);
  const blocked = hasRuleErrors(errors);

  return (
    <div className="grid items-center gap-4 p-4 transition-colors hover:bg-background/50 sm:p-6 lg:grid-cols-[1fr_200px_200px_250px_100px]">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border/40 bg-secondary/50 text-muted-foreground">
          <Package className="size-5" aria-hidden />
        </span>
        <span className="truncate font-serif text-base text-foreground">{row.productName}</span>
        {/*
          Marca de alteracao nao salva. O print nao tem esse estado porque
          nenhuma linha foi editada quando ele foi tirado; e informacao que
          existe em qualquer tela de edicao e nao inventa desenho novo —
          e um ponto ao lado do nome.
        */}
        {dirty ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-warning-foreground"
            title="Alterações não salvas"
            aria-label="Alterações não salvas"
          />
        ) : null}
      </div>

      <LabeledControl label="Modelagem">
        <Select
          value={draft.modeling}
          onChange={(event) =>
            setDraft((current) => ({ ...current, modeling: event.target.value as Modeling }))
          }
          aria-label={`Modelagem de ${row.productName}`}
          className="h-10 text-xs"
        >
          {MODELING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </LabeledControl>

      <LabeledControl label="Elasticidade">
        <Select
          value={draft.elasticity}
          onChange={(event) =>
            setDraft((current) => ({ ...current, elasticity: event.target.value as Elasticity }))
          }
          aria-label={`Elasticidade de ${row.productName}`}
          className="h-10 text-xs"
        >
          {ELASTICITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </LabeledControl>

      <LabeledControl label="Observações">
        <Input
          value={draft.notes}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          placeholder={NOTES_PLACEHOLDER}
          aria-label={`Observações de ${row.productName}`}
          error={errors.notes}
          className="h-10 text-xs"
        />
      </LabeledControl>

      <Button
        type="button"
        onClick={() => onSave({
          productId: row.productId,
          modeling: draft.modeling,
          elasticity: draft.elasticity,
          notes: draft.notes.trim(),
          // Carimbo fica na hora do clique; quem grava e `data.ts`.
          updatedAt: new Date().toISOString(),
        })}
        disabled={saving || blocked}
        className={cn('w-full', 'uppercase tracking-[0.15em]')}
      >
        {saving ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );
}

/**
 * Rotulo das colunas.
 *
 * No print, desktop nao mostra rotulo nenhum — as colunas se explicam pelos
 * proprios valores e pelo contexto. A referencia do projeto revela a intencao:
 * os rotulos existem, mas so abaixo de `lg`, quando a grade vira coluna unica e
 * um seletor solto deixaria de dizer o que e. Aqui e igual: `lg:hidden`.
 */
function LabeledControl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label-caps mb-1.5 block lg:hidden">{label}</label>
      {children}
    </div>
  );
}
