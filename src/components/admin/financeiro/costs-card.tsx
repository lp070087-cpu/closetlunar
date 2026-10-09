'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/form';
import { costsToDraft, draftToCosts } from '@/lib/financeiro/metrics';
import type { CostsDraft, FinancialCosts } from '@/lib/financeiro/types';

/**
 * O BLOCO `Custos` de adm-024 — os cinco campos digitaveis e o botao de salvar.
 *
 * ================== OS CINCO CAMPOS, NA ORDEM DO PRINT ==================
 *
 *   CUSTO MEDIO DO PRODUTO (%)    |  TAXA DE PAGAMENTO (%)
 *   [40]                          |  [4,99]
 *   CUSTO DE FRETE (% DO COBRADO) |  EMBALAGEM POR PEDIDO (R$)
 *   [100]                         |  [3]
 *   CUSTO FIXO MENSAL (R$)
 *   [0]
 *                                          [ Salvar custos ]
 *
 * DOIS POR LINHA, com o quinto sozinho na terceira — e o que uma grade de duas
 * colunas produz sozinha, na ordem em que os campos entram. O print nao deixa
 * duvida de qual campo esta em qual celula, e a ordem acima e a dele.
 *
 * O BOTAO FICA A DIREITA, embaixo (`flex justify-end`), e nao no rodape do card.
 *
 * ================== CADA ROTULO CARREGA A UNIDADE ==================
 *
 * `(%)`, `(R$)`, `(% do cobrado)`, `(R$/pedido)`. Os cinco valores sao `number`
 * puros em `FinancialCosts`, sem unidade embutida — a unidade vive no rotulo, e
 * nao no dado. Isso e o que permite multiplicar direto (`revenue * pct / 100`)
 * sem tirar simbolo de dentro do numero.
 *
 * `CUSTO DE FRETE (% DO COBRADO)` e o unico rotulo com uma preposicao, e ela
 * importa: `100` significa "o frete cobrado e todo custo", e nao "100% do
 * faturamento". Um rotulo so `Custo de frete (%)` faria a pessoa digitar o numero
 * pensando na base errada.
 *
 * ================== OS NUMEROS SAO TEXTO ENQUANTO SE DIGITA ==================
 *
 * O campo guarda STRING, como todo o painel. Com um `number` no estado, apagar o
 * campo para digitar `45` daria `Number('') === 0`, o campo mostraria `0` e o
 * zero seria gravado — o campo nunca ficaria limpo. Ver `CostsDraft`.
 *
 * E `inputMode="decimal"` em vez de `type="number"` pelo mesmo motivo de
 * Afiliadas: o `type="number"` do original reescreve o campo vazio e ainda
 * bloqueia a virgula, que e como se digita decimal em teclado brasileiro. A
 * virgula e aceita e convertida em `draftToCosts`.
 */
export function CostsCard({
  costs,
  onSave,
  saving,
  outcome,
}: {
  costs: FinancialCosts;
  onSave: (costs: FinancialCosts) => void;
  saving: boolean;
  /** `'none'` antes de salvar; `'unsaved'` depois de uma gravacao nao efetiva. */
  outcome: 'none' | 'unsaved';
}) {
  const [draft, setDraft] = useState<CostsDraft>(() => costsToDraft(costs));

  /**
   * O RASCUNHO ACOMPANHA OS CUSTOS DE FORA.
   *
   * Sem isto, o botao `Salvar` nao mudaria nada na tela: o estado local ficaria
   * com o texto digitado e o `costs` de cima voltaria ao valor antigo — o campo
   * mostraria `45` e a conta de lucro usaria `40`, que e a pior divergencia
   * possivel (a tela e a conta discordando em silencio).
   *
   * O `setDraft` roda quando `costs` muda de IDENTIDADE, e nao a cada render: e a
   * mesma protecao que impede o efeito de apagar o que a pessoa esta digitando.
   */
  useEffect(() => {
    setDraft(costsToDraft(costs));
  }, [costs]);

  const patch = (fields: Partial<CostsDraft>) => setDraft((atual) => ({ ...atual, ...fields }));

  return (
    <Card className="p-5">
      <h3 className="font-serif text-lg leading-tight">Custos</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Defina suas estimativas para calcular o lucro.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Custo médio do produto (%)">
          <Input
            inputMode="decimal"
            value={draft.productCostPct}
            onChange={(event) => patch({ productCostPct: event.target.value })}
            autoComplete="off"
          />
        </Field>
        <Field label="Taxa de pagamento (%)">
          <Input
            inputMode="decimal"
            value={draft.paymentFeePct}
            onChange={(event) => patch({ paymentFeePct: event.target.value })}
            autoComplete="off"
          />
        </Field>
        <Field label="Custo de frete (% do cobrado)">
          <Input
            inputMode="decimal"
            value={draft.shippingCostPct}
            onChange={(event) => patch({ shippingCostPct: event.target.value })}
            autoComplete="off"
          />
        </Field>
        <Field label="Embalagem por pedido (R$)">
          <Input
            inputMode="decimal"
            value={draft.packagingPerOrder}
            onChange={(event) => patch({ packagingPerOrder: event.target.value })}
            autoComplete="off"
          />
        </Field>
        <Field label="Custo fixo mensal (R$)">
          <Input
            inputMode="decimal"
            value={draft.fixedMonthly}
            onChange={(event) => patch({ fixedMonthly: event.target.value })}
            autoComplete="off"
          />
        </Field>
      </div>

      {/*
        O AVISO DE "NAO GRAVADO". Mesmo padrao do resto do painel: o original
        faz `toast.success("Custos salvos")` e a tela nao pode confirmar uma
        gravacao que nao aconteceu — os cinco numeros voltariam ao padrao no
        proximo carregamento e a conta de lucro teria sido feita com eles.
      */}
      {outcome === 'unsaved' ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-surface/50 p-3.5 text-xs"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
          <p className="text-warning-foreground">
            Os custos valem só nesta tela e não foram gravados no banco. Enquanto o Neon não estiver
            conectado, eles voltam ao padrão ao recarregar a página.
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          onClick={() => onSave(draftToCosts(draft))}
          loading={saving}
          // O rotulo fica em caixa mista, como o print (`Salvar custos`) — a
          // pill preta do painel sai em versalete por padrao e aqui o print
          // mostra a frase em caixa de texto normal.
          className="normal-case tracking-normal"
        >
          Salvar custos
        </Button>
      </div>
    </Card>
  );
}
