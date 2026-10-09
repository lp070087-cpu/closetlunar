import { cn } from '@/lib/utils';
import { formatMargin, marginTone, type MarginTone } from '@/lib/produtos/metrics';

/**
 * Barra de margem da coluna `MARGEM` (adm-025).
 *
 * Medido nos prints: trilho de 48px de largura por 6px de altura, arredondado,
 * preenchido proporcionalmente, com a porcentagem ao lado em 12px.
 * Cores pelos cortes reais: verde > 40%, ambar > 20%, vermelho abaixo.
 */

const TONE_BG: Record<MarginTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

const TONE_TEXT: Record<MarginTone, string> = {
  success: 'text-success-foreground',
  warning: 'text-warning-foreground',
  danger: 'text-danger',
};

export function MarginBar({
  margin,
  className,
  showLabel = true,
}: {
  margin: number;
  className?: string;
  showLabel?: boolean;
}) {
  const tone = marginTone(margin);
  const width = Math.min(100, Math.max(0, margin));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-secondary"
        role="img"
        aria-label={`Margem de ${formatMargin(margin)}`}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', TONE_BG[tone])}
          style={{ width: `${width}%` }}
        />
      </div>
      {showLabel ? (
        <span className={cn('text-xs font-medium tabular-nums', TONE_TEXT[tone])}>
          {formatMargin(margin)}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Chip de estoque (adm-025): pill totalmente arredondada, `8 un.`
 * Rosa quando o estoque esta baixo (<= 5), verde acima disso.
 */
export function StockChip({ stock, className }: { stock: number; className?: string }) {
  const low = stock <= 5;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums',
        low ? 'bg-danger-surface text-danger' : 'bg-success-surface text-success-foreground',
        className,
      )}
    >
      {stock} un.
    </span>
  );
}

/**
 * Ganho em reais (coluna `LUCRO`). Verde quando positivo, vermelho quando
 * negativo. Nunca mostra `R$ NaN`.
 */
export function ProfitValue({ profit, className }: { profit: number; className?: string }) {
  const positive = profit > 0;
  return (
    <span
      className={cn(
        'font-medium tabular-nums',
        positive ? 'text-success-foreground' : profit < 0 ? 'text-danger' : 'text-muted-foreground',
        className,
      )}
    >
      {profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    </span>
  );
}
