import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Card de indicador (KPI).
 *
 * Reproduz o cartao do dashboard: rotulo em caixa alta minuscula, valor grande
 * em serifada, icone em quadrado arredondado a direita e uma linha de apoio
 * separada por hairline ("desde 00:00", "margem media 35%", "<= 5 unidades").
 */

export type StatTone = 'neutral' | 'danger' | 'success' | 'warning';

const TONES: Record<StatTone, string> = {
  neutral: 'bg-secondary/60 text-foreground',
  danger: 'bg-danger-surface text-danger-foreground',
  success: 'bg-success-surface text-success-foreground',
  warning: 'bg-warning-surface text-warning-foreground',
};

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: StatTone;
  trend?: { value: string; up: boolean };
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'surface group flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant sm:p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="eyebrow-caps truncate">{label}</span>
          <span className="truncate font-serif text-3xl tabular-nums tracking-tight">{value}</span>
        </div>
        <span
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-2xl shadow-card transition-transform duration-300 group-hover:scale-110',
            TONES[tone],
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      {hint || trend ? (
        <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3">
          {hint ? <span className="truncate text-[11px] font-medium text-muted-foreground">{hint}</span> : <span />}
          {trend ? (
            <span
              className={cn(
                'shrink-0 text-[11px] font-bold',
                trend.up ? 'text-success-foreground' : 'text-danger',
              )}
            >
              {trend.up ? '↑' : '↓'} {trend.value}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Grade responsiva de KPIs: 1 coluna no celular, ate 4 no desktop. */
export function StatGrid({
  columns = 4,
  className,
  children,
}: {
  columns?: 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2',
        columns === 2 && 'lg:grid-cols-2',
        columns === 3 && 'lg:grid-cols-3',
        columns === 4 && 'lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
