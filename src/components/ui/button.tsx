import { forwardRef, type ButtonHTMLAttributes } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Botao do painel.
 *
 * O padrao visual dos prints e a pill preta de caixa alta com tracking largo.
 * Por isso `primary` e `outline` ja saem em versalete, enquanto `ghost` e
 * `link` ficam em caixa normal para acoes secundarias dentro de tabelas.
 */

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'soft' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-foreground text-background hover:bg-foreground/90 active:bg-foreground shadow-soft',
  outline:
    'border border-border bg-background text-foreground hover:bg-secondary/70 hover:border-border',
  ghost: 'text-foreground hover:bg-secondary/70',
  soft: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
  danger:
    'bg-danger text-destructive-foreground hover:bg-danger/90 shadow-soft focus-visible:ring-danger',
  link: 'text-foreground underline underline-offset-4 hover:text-muted-foreground px-0',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[10px] tracking-[0.16em]',
  md: 'h-11 px-6 text-[11px] tracking-[0.16em]',
  lg: 'h-12 px-8 text-xs tracking-[0.18em]',
  icon: 'size-11 px-0',
};

/** Variantes que usam caixa alta espacada. */
const CAPS_VARIANTS: ButtonVariant[] = ['primary', 'outline', 'soft', 'danger'];

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props },
  ref,
) {
  const isCaps = CAPS_VARIANTS.includes(variant);
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
        isCaps && 'uppercase',
        size !== 'icon' && isCaps && 'whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});

/** Mesmo visual do Button, mas renderiza um <Link> do Next. */
export interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
  prefetch?: boolean;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const isCaps = CAPS_VARIANTS.includes(variant);
  return (
    <Link
      href={href}
      className={cn(
        'focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold transition-all duration-200',
        isCaps && 'uppercase',
        size !== 'icon' && isCaps && 'whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
