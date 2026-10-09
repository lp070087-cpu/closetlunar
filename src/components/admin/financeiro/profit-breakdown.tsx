'use client';

import { Card } from '@/components/ui/card';
import { cn, formatBRL } from '@/lib/utils';
import type { CostBreakdown } from '@/lib/financeiro/types';

/**
 * O BLOCO `Lucro estimado` de adm-024 — a conta aberta, linha por linha.
 *
 *   Faturamento                 R$ 0,00      (verde, e o unico positivo)
 *   Custo dos produtos         - R$ 0,00
 *   Taxas de pagamento         - R$ 0,00
 *   Custo de frete             - R$ 0,00
 *   Embalagem                  - R$ 0,00
 *   Custo fixo (27 dias)       - R$ 0,00     (o numero de dias do PERIODO)
 *   Total de custos            - R$ 0,00     (cinza, e um subtotal)
 *   Lucro estimado              R$ 0,00 (0,0%)  (verde se positivo)
 *
 * ================== O SINAL E DO DESENHO, NAO DO VALOR ==================
 *
 * As cinco linhas de custo sao SUBTRACOES — elas aparecem com `-` na frente
 * porque a conta e `faturamento - custos`, e o print escreve o sinal. O valor
 * que chega aqui pelo `props` e POSITIVO (o custo dos produtos e `R$ 0,00`, nao
 * `-R$ 0,00`); quem poe o sinal e a linha, ao negar.
 *
 * ISSO NAO E SO ESTETICA. `formatBRL(-0)` produz `-R$ 0,00` — com o sinal, e
 * diferente do `R$ 0,00` que o print mostra na linha `Total de custos`. Negar um
 * zero com sinal ja embutido daria `-(-0) = 0` numa linha e `-0` na outra, e a
 * coluna de sinais ficaria inconsistente justamente no estado do print, que e
 * tudo zero. Por isso o sinal e aplicado AQUI, uma vez, sobre um valor positivo.
 *
 * ================== O VERDE SO NA ULTIMA LINHA E NO FATURAMENTO ==================
 *
 * O FATURAMENTO sai verde porque e a unica linha que SOMA. E o `positive` do
 * original (`<Row label="Faturamento" value={props.revenue} positive />`).
 *
 * O LUCRO usa `props.profit >= 0` — verde quando nao-negativo, rosa quando
 * negativo. Zero conta como verde: `>= 0` e nao `> 0`, como no original. Com tudo
 * zero o print mostra verde, e essa e a razao.
 *
 * `Total de custos` sai em CINZA (`muted`): e um subtotal, e destaca-lo com a
 * tinta das linhas de cima faria ele competir com o lucro, que e a conclusao.
 */

/**
 * O TOM DAS LINHAS, no lugar das classes literais do original.
 *
 * O original usa `text-emerald-600` / `text-rose-600` — cores do Tailwind cru,
 * FORA do design system do painel (nao existem como token em `globals.css`).
 * Reproduzi-las aqui deixaria a tela com um verde e um rosa que nao sao os do
 * resto do painel; o projeto tem `success-foreground` e `danger` exatamente para
 * isso. A COR MUDA, o SIGNIFICADO nao — e o tom do lucro e o mesmo do restante
 * do painel, que e o que a pessoa le.
 */
function Linha({
  label,
  value,
  tone = 'neutral',
  muted = false,
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'positive' | 'negative';
  muted?: boolean;
}) {
  return (
    <li
      className={cn(
        'flex items-center justify-between gap-4 py-2 text-sm',
        muted && 'text-muted-foreground',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'shrink-0 tabular-nums',
          tone === 'positive' && 'text-success-foreground',
          tone === 'negative' && 'text-danger',
        )}
      >
        {formatBRL(value)}
      </span>
    </li>
  );
}

export function ProfitBreakdown({
  breakdown,
  revenue,
  days,
}: {
  breakdown: CostBreakdown;
  revenue: number;
  /** Os dias do periodo — o texto `Custo fixo (27 dias)` do print. */
  days: number;
}) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 font-serif text-lg leading-tight">Lucro estimado</h3>

      <ul className="divide-y divide-border/60 text-sm">
        <Linha label="Faturamento" value={revenue} tone="positive" />
        {/* Os cinco custos: valor POSITIVO com o sinal posto pela linha. Ver o
            cabecalho para por que nao se nega o valor na origem. */}
        <Linha label="Custo dos produtos" value={-breakdown.productCost} />
        <Linha label="Taxas de pagamento" value={-breakdown.paymentFee} />
        <Linha label="Custo de frete" value={-breakdown.shippingCost} />
        <Linha label="Embalagem" value={-breakdown.packagingCost} />
        <Linha label={`Custo fixo (${days} dias)`} value={-breakdown.fixedCost} />
        <Linha label="Total de custos" value={-breakdown.totalCosts} muted />

        <li className="flex items-center justify-between gap-4 py-3 font-medium">
          <span>Lucro estimado</span>
          <span className="shrink-0 tabular-nums">
            <span className={breakdown.profit >= 0 ? 'text-success-foreground' : 'text-danger'}>
              {formatBRL(breakdown.profit)}
            </span>{' '}
            <span className="text-xs text-muted-foreground">
              {/* `toFixed(1)` — `(0.0%)` no print, com a casa decimal sempre. */}
              ({breakdown.margin.toFixed(1)}%)
            </span>
          </span>
        </li>
      </ul>

      {/*
        A NATUREZA DESTA CONTA, DITA NA TELA.

        Nao ha uma unica fonte de custo real neste modulo: os cinco numeros sao
        estimativas digitadas no bloco ao lado, e o proprio subtitulo de adm-024
        pede que a pessoa "defina suas estimativas". O titulo do bloco ja diz
        `estimado`, mas o rodape explicita de onde saiu o numero — do contrario a
        margem aparece com a mesma autoridade de um dado medido.

        E a mesma decisao dos avisos de persistencia do resto do painel: o que a
        tela nao pode garantir, ela diz em vez de deixar parecer.
      */}
      <p className="mt-4 border-t border-border/40 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Cálculo estimado a partir dos custos informados acima. Não há lançamento de despesa real
        nesta tela.
      </p>
    </Card>
  );
}
