'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

/**
 * Modal do painel.
 *
 * Comportamento que os prints exigem: overlay escurecido com desfoque, painel
 * branco arredondado, titulo serifado, corpo rolavel e rodape de acoes.
 * Acessibilidade: fecha com Esc, trava a rolagem do fundo, prende o foco
 * dentro do dialogo e devolve o foco ao elemento de origem ao fechar.
 */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Botoes do rodape. Sem isso, o rodape nao aparece. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Permite abrir sem titulo (modais de confirmacao com conteudo proprio). */
  hideHeader?: boolean;
  className?: string;
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideHeader = false,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // Foca o primeiro controle util do dialogo.
    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 40);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(timer);
      previouslyFocused.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fechar"
        className="fixed inset-0 cursor-default bg-foreground/40 backdrop-blur-sm motion-safe:animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={cn(
          'relative z-10 w-full rounded-t-4xl bg-background shadow-elegant motion-safe:animate-scale-in sm:rounded-4xl',
          'max-h-[92vh] overflow-y-auto',
          SIZES[size],
          className,
        )}
      >
        {!hideHeader ? (
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border/60 bg-background/95 px-6 py-5 backdrop-blur">
            <div className="min-w-0">
              <h2 className="font-serif text-xl leading-tight tracking-tight">{title}</h2>
              {description ? (
                <p className="mt-1 text-sm font-medium text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="focus-ring -mr-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>
        ) : null}

        <div className={cn(hideHeader ? 'p-6' : 'px-6 py-6')}>{children}</div>

        {footer ? (
          <footer className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Modal de confirmacao para acoes destrutivas (excluir, desativar).
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = true,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <p className="text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
    </Modal>
  );
}
