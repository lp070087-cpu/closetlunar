'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Menu suspenso leve, sem biblioteca externa.
 *
 * Fecha ao clicar fora e com Esc, e devolve o foco ao gatilho. Usado nas acoes
 * de linha das tabelas e no menu do rodape da sidebar.
 */

export interface DropdownItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export function DropdownMenu({
  trigger,
  items,
  align = 'end',
  className,
}: {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.querySelector<HTMLElement>('button')?.focus();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div
        ref={triggerRef}
        onClick={() => setOpen((current) => !current)}
        className="contents"
      >
        {trigger}
      </div>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute top-[calc(100%+0.5rem)] z-40 min-w-52 overflow-hidden rounded-2xl border border-border/70 bg-popover py-1.5 shadow-elegant motion-safe:animate-scale-in',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
              className={cn(
                'focus-ring flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-40',
                item.destructive
                  ? 'text-danger hover:bg-danger-surface'
                  : 'text-foreground hover:bg-secondary',
              )}
            >
              {item.icon ? <span className="[&>svg]:size-4">{item.icon}</span> : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
