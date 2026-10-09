import { cn } from '@/lib/utils';

/**
 * Tabela do painel.
 *
 * Cabecalho em caixa alta minuscula cinza, linhas separadas por hairline e
 * dados em sans. Em telas pequenas a tabela rola na horizontal em vez de
 * quebrar o layout — comportamento obrigatorio nesta fundacao.
 */

export function TableWrap({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('table-scroll', className)}>{children}</div>;
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn('w-full min-w-[44rem] border-collapse text-sm', className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-muted/60', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-border/60', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('transition-colors duration-150 hover:bg-muted/40', className)}
      {...props}
    />
  );
}

export function TableHeaderCell({
  className,
  align = 'left',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  align = 'left',
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={cn(
        'px-5 py-4 align-middle text-foreground/90',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    />
  );
}

/** Celula de destaque com titulo e linha de apoio (nome + e-mail). */
export function TablePrimaryCell({
  title,
  subtitle,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-serif text-base text-foreground">{title}</span>
      {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
    </div>
  );
}

/** Rodape da tabela com contagem e paginacao. */
export function TableFooter({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 border-t border-border/60 px-5 py-4 sm:flex-row',
        className,
      )}
    >
      {children}
    </div>
  );
}
