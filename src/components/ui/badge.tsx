import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge/pill de status.
 *
 * Cores medidas nos prints: verde de operacao normal, ambar de estoque baixo,
 * rosa/vermelho de alerta. Todas em caixa alta minuscula com tracking.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-bold uppercase',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-secondary/60 text-muted-foreground',
        dark: 'border-foreground bg-foreground text-background',
        success: 'border-transparent bg-success-surface text-success-foreground',
        warning: 'border-transparent bg-warning-surface text-warning-foreground',
        danger: 'border-transparent bg-danger-surface text-danger-foreground',
        outline: 'border-border bg-transparent text-foreground',
      },
      size: {
        sm: 'px-2.5 py-1 text-[9px] tracking-[0.14em]',
        md: 'px-3 py-1 text-[10px] tracking-[0.16em]',
        lg: 'px-4 py-1.5 text-[11px] tracking-[0.18em]',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'sm' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

/** Ponto verde pulsante usado em "ONLINE" e "OPERACAO NORMAL". */
export function StatusDot({ className, tone = 'success' }: { className?: string; tone?: 'success' | 'warning' | 'danger' | 'muted' }) {
  const tones = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    muted: 'bg-muted-foreground',
  } as const;
  return (
    <span aria-hidden className={cn('relative flex size-2 shrink-0', className)}>
      <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', tones[tone])} />
      <span className={cn('relative inline-flex size-2 rounded-full', tones[tone])} />
    </span>
  );
}

/**
 * Pill de status com ponto, no formato "OPERACAO NORMAL" do dashboard.
 */
export function StatusPill({
  label,
  tone = 'success',
  className,
}: {
  label: string;
  tone?: 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const tones = {
    success: 'bg-success-surface text-success-foreground',
    warning: 'bg-warning-surface text-warning-foreground',
    danger: 'bg-danger-surface text-danger-foreground',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em]',
        tones[tone],
        className,
      )}
    >
      <StatusDot tone={tone} />
      {label}
    </span>
  );
}
