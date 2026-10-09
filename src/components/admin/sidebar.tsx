'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ExternalLink, Store, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminHref, type AdminNavGroup } from '@/lib/nav';

/**
 * Sidebar do painel administrativo.
 *
 * Reproduz fielmente a referencia: marca no topo, grupos com titulo em caixa
 * alta minuscula, itens com icone + rotulo + seta, item ativo como pill preta,
 * e "Ver Loja Online" fixo no rodape.
 *
 * O rotulo do item ativo e truncado com reticencias quando nao couber — e
 * exatamente o que a referencia faz ("Carrinho Abandona...", "Usuários / Adm...").
 * Nao "melhorar" isso: e fidelidade, nao defeito.
 */

interface SidebarProps {
  groups: AdminNavGroup[];
  /** Chamado ao clicar num item (usado para fechar o drawer no mobile). */
  onNavigate?: () => void;
  /** Exibe o botao de fechar (apenas no drawer mobile). */
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ groups, onNavigate, onClose, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do painel"
      className={cn('flex h-full min-h-0 flex-col bg-background', className)}
    >
      {/* Marca */}
      <div className="relative flex items-center justify-center border-b border-border/40 bg-secondary/20 px-6 py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-1 grid size-12 place-items-center rounded-2xl bg-foreground text-background shadow-elegant">
            <Store className="size-6" aria-hidden />
          </div>
          <div className="text-center">
            <div className="font-serif text-xl leading-none tracking-tight text-foreground">
              Closet Lunna
            </div>
            <div className="mt-2 text-[8px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">
              Luxury Admin v2.0
            </div>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="focus-ring absolute right-3 top-3 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Grupos */}
      <div className="scrollbar-hide flex-1 space-y-8 overflow-y-auto px-4 py-6">
        {groups.map((group) => (
          <div key={group.id} className="space-y-2">
            <div className="px-3 text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const href = adminHref(item.slug);
                const active = pathname === href;
                const Icon = item.icon;
                return (
                  <li key={item.slug || 'dashboard'}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'focus-ring group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                        active
                          ? 'bg-foreground text-background shadow-soft ring-4 ring-foreground/5'
                          : 'text-foreground/70 hover:bg-secondary/80 hover:text-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center transition-transform duration-300',
                          active ? 'scale-110' : 'group-hover:scale-110',
                        )}
                      >
                        <Icon className="size-full" aria-hidden />
                      </span>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {active ? <ChevronRight className="size-3.5 opacity-60" aria-hidden /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Rodape fixo */}
      <div className="mt-auto border-t border-border/40 bg-secondary/10 p-4">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="focus-ring group flex items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-all duration-300 hover:border-border hover:bg-background hover:text-foreground hover:shadow-soft"
        >
          <ExternalLink className="size-3.5 transition-transform group-hover:scale-110" aria-hidden />
          Ver Loja Online
        </a>
      </div>
    </nav>
  );
}
