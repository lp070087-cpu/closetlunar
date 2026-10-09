import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

/**
 * Estados visuais do painel: vazio, carregando, erro e "em breve".
 *
 * As telas dos prints mostram os textos vazios por extenso ("Sem vendas no
 * periodo.", "Sem favoritos registrados.", "Sem dados de uso."). Este
 * componente padroniza esse formato para que nenhuma tela invente o seu.
 */

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-serif text-lg">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/**
 * Estado vazio dentro de uma tabela: ocupa a largura toda e mantem o cabecalho
 * visivel, como nos prints de Cupons/Campanhas/Favoritos.
 */
export function EmptyRow({
  colSpan,
  title,
  icon: Icon,
}: {
  colSpan: number;
  title: string;
  icon?: LucideIcon;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          {Icon ? <Icon className="size-4" aria-hidden /> : null}
          {title}
        </span>
      </td>
    </tr>
  );
}

/** Bloco de carregamento com o texto "Carregando..." usado no painel. */
export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 py-16 text-sm font-medium text-muted-foreground"
    >
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
      />
      {label}
    </div>
  );
}

/** Esqueleto de tabela para carregamento sem salto de layout. */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="table-scroll" aria-hidden>
      <div className="min-w-[44rem]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-5 border-b border-border/60 px-5 py-4 last:border-0"
          >
            {Array.from({ length: columns }).map((__, colIndex) => (
              <span
                key={colIndex}
                className="skeleton h-4 rounded-full"
                style={{ width: colIndex === 0 ? '28%' : `${14 + (colIndex % 3) * 6}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Esqueleto de cards de KPI. */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="skeleton h-2.5 w-24 rounded-full" />
              <span className="skeleton h-8 w-20 rounded-lg" />
            </div>
            <span className="skeleton size-12 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title = 'Não foi possível carregar',
  description = 'Tente novamente em instantes. Se persistir, verifique a conexão com o banco de dados.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-danger/40 bg-danger-surface/40 px-6 py-12 text-center"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-danger-surface text-danger-foreground">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <div>
        <p className="font-serif text-lg">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Bloco "em breve" para modulos cuja tela detalhada ainda sera construida
 * numa proxima fase. Mantem a rota viva e navegavel sem inventar interface.
 */
export function ComingSoon({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="max-w-md text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
