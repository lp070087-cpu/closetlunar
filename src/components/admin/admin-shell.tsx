'use client';

import { useEffect, useMemo, useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { visibleGroups, type AdminNavGroup, type AdminRole } from '@/lib/nav';
import { avatarLetter } from '@/lib/utils';
import { Sidebar } from './sidebar';

/**
 * Casca do painel: sidebar fixa no desktop, drawer no mobile, topbar pegajosa.
 *
 * Geometria retirada da referencia: sidebar 256px, topbar 64px, conteudo
 * limitado a 1600px e centralizado.
 */

interface AdminShellProps {
  groups: AdminNavGroup[];
  currentLabel: string;
  email: string;
  role: AdminRole;
  children: React.ReactNode;
}

export function AdminShell({ groups, currentLabel, email, role, children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Ao trocar de rota, garante que o drawer mobile nao fique aberto.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [currentLabel]);

  // Trava a rolagem do fundo enquanto o drawer esta aberto.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [mobileNavOpen]);

  const filteredGroups = useMemo(() => visibleGroups([role]), [role]);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar fixa — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/70 bg-background lg:flex lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <Sidebar groups={filteredGroups} />
        </div>
      </aside>

      {/* Drawer — mobile e tablet */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fechar menu"
            className="absolute inset-0 cursor-default bg-foreground/30 backdrop-blur-sm motion-safe:animate-fade-in"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside
            className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border/70 bg-background shadow-elegant motion-safe:animate-slide-in-left"
            role="dialog"
            aria-modal="true"
            aria-label="Menu do painel"
          >
            <Sidebar
              groups={filteredGroups}
              onClose={() => setMobileNavOpen(false)}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-shell items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Abrir menu"
                aria-expanded={mobileNavOpen}
                className="focus-ring grid size-10 place-items-center rounded-xl transition-colors hover:bg-secondary lg:hidden"
              >
                <Menu className="size-5" />
              </button>
              <div className="flex min-w-0 flex-col">
                <div className="mb-1 text-[9px] uppercase leading-none tracking-[0.25em] text-muted-foreground/80">
                  Painel Administrativo
                </div>
                <h1 className="truncate font-serif text-lg leading-none text-foreground sm:text-xl">
                  {currentLabel}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden items-center rounded-full border border-border bg-secondary/50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground md:inline-flex">
                {role}
              </span>

              <div className="hidden min-w-0 flex-col items-end leading-tight sm:flex">
                <span className="max-w-[150px] truncate text-xs font-medium text-foreground lg:max-w-[200px]">
                  {email}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Online
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    'grid size-9 place-items-center rounded-xl bg-foreground font-serif text-sm text-background shadow-soft',
                  )}
                >
                  {avatarLetter(email)}
                </span>
                <form action="/api/admin/logout" method="post">
                  <button
                    type="submit"
                    title="Sair"
                    className="focus-ring grid size-9 place-items-center rounded-xl border border-border bg-background text-foreground transition-all duration-200 hover:border-danger/30 hover:bg-danger-surface hover:text-danger sm:flex sm:w-auto sm:items-center sm:gap-1.5 sm:px-3 sm:py-2"
                  >
                    <LogOut className="size-4 shrink-0" aria-hidden />
                    <span className="hidden text-xs font-bold uppercase tracking-wider sm:inline">Sair</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        {/* Conteudo */}
        <main className="mx-auto w-full max-w-shell flex-1 overflow-x-hidden px-3 py-5 motion-safe:animate-fade-in sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="space-y-6 sm:space-y-8 lg:space-y-12">{children}</div>
        </main>
      </div>
    </div>
  );
}
