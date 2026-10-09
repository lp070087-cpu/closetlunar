'use client';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/form';
import type { FinanceRange } from '@/lib/financeiro/types';

/**
 * A LINHA DE FILTROS de adm-023 — sete pilulas a esquerda, dois botoes a direita.
 *
 * A ORDEM DAS PILULAS E A DO PRINT, e ela nao e alfabetica nem por duracao:
 *
 *   HOJE · ONTEM · 7 DIAS · 30 DIAS · ESTE MES · MES ANTERIOR · PERSONALIZADO
 *
 * Os tres primeiros sao recortes de dia (um dia, um dia, uma semana), depois o
 * mes, depois a janela livre. A ordem vai do mais curto para o mais configuravel,
 * e agrupa os dois de DIA no comeco de proposito. A ativa do print e `ESTE MES`.
 *
 * ================== AS PILULAS NAO SAO `SegmentedTabs` ==================
 *
 * O painel tem `SegmentedTabs` (pilula escura com fundo para o conjunto) e
 * `UnderlineTabs`. Nenhum dos dois serve aqui, e a diferenca esta no MATERIAL:
 * os prints das outras telas mostram as abas DENTRO de um trilho
 * (`bg-secondary/40`), enquanto este e um conjunto solto de sete botoes SEM
 * trilho, cada um com borda propria. Usar `SegmentedTabs` desenharia um trilho
 * que o print nao tem.
 *
 * O que se reaproveita e o ESTILO da pilula ativa (fundo tinta, texto claro,
 * caixa alta espacada), que e o mesmo do resto do painel.
 *
 * ================== `PERSONALIZADO` ABRE DOIS CAMPOS ==================
 *
 * E o unico que revela interface: os dois `<input type="date">` ao lado das
 * pilulas. Eles NAO aparecem no print — o print esta em `ESTE MES`, e a
 * customizacao so se revela quando alguem clica. O comportamento esta no original
 * (o par `{range === "custom" && (<>...</>)}`), entao a tela o reproduz.
 *
 * ================== OS DOIS BOTOES DE EXPORTACAO ==================
 *
 * `EXPORTAR CSV` (contorno) e `EXPORTAR PDF` (pill preta cheia), no canto
 * direito da MESMA linha — o `ml-auto` do original. Os dois desenham o rotulo do
 * print e NAO implementam a exportacao: ver `data.ts`, secao "Exportar", para o
 * motivo (os dois sao DOM puro — `Blob` e `window.open` — e nao ha navegador na
 * verificacao deste projeto, entao uma prova de exportacao nao poderia falhar).
 *
 * Eles carregam `data-export="pendente"` para que a bancada possa provar que os
 * DOIS existem com o rotulo certo e que nenhum esta ligado a um manipulador que
 * finge baixar arquivo.
 */

const PERIODOS: { value: FinanceRange; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês anterior' },
  { value: 'custom', label: 'Personalizado' },
];

export function RangeFilter({
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomChange,
}: {
  range: FinanceRange;
  onRangeChange: (range: FinanceRange) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (patch: { start?: string; end?: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PERIODOS.map((periodo) => {
        const ativo = periodo.value === range;
        return (
          <button
            key={periodo.value}
            type="button"
            aria-pressed={ativo}
            onClick={() => onRangeChange(periodo.value)}
            className={cn(
              'focus-ring rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors duration-200',
              ativo
                ? 'bg-foreground text-background'
                : 'border border-border text-foreground/70 hover:text-foreground',
            )}
          >
            {periodo.label}
          </button>
        );
      })}

      {/* Os dois campos SO no modo personalizado — como no original. */}
      {range === 'custom' ? (
        <>
          <Input
            type="date"
            aria-label="Início do período"
            value={customStart}
            onChange={(event) => onCustomChange({ start: event.target.value })}
            className="h-9 w-auto text-xs"
          />
          <Input
            type="date"
            aria-label="Fim do período"
            value={customEnd}
            onChange={(event) => onCustomChange({ end: event.target.value })}
            className="h-9 w-auto text-xs"
          />
        </>
      ) : null}

      <div className="ml-auto flex flex-wrap gap-2">
        <button
          type="button"
          data-export="pendente"
          aria-disabled="true"
          className="focus-ring rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-foreground/70 transition-colors duration-200 hover:text-foreground"
        >
          Exportar CSV
        </button>
        <button
          type="button"
          data-export="pendente"
          aria-disabled="true"
          className="focus-ring rounded-full bg-foreground px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-background transition-colors duration-200 hover:bg-foreground/90"
        >
          Exportar PDF
        </button>
      </div>
    </div>
  );
}
