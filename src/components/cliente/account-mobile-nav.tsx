'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu } from 'lucide-react';
import { NAV_ITEMS, clientHref, isActiveSlug } from '@/lib/cliente/nav';
import { cn } from '@/lib/utils';

/** In-flow disclosure: account sections never cover the page or widen it. */
export function AccountMobileNav({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const active = NAV_ITEMS.find((item) => isActiveSlug(pathname, item.slug));

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <nav aria-label="Área da cliente" className="min-w-0 max-w-full lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="account-mobile-sections"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-medium shadow-soft"
      >
        <Menu className="size-5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{active?.label ?? 'Seções da conta'}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform motion-reduce:transition-none', open && 'rotate-180')} aria-hidden />
      </button>
      <ul id="account-mobile-sections" hidden={!open} className="mt-2 space-y-1 rounded-2xl border border-border bg-background p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const ativo = isActiveSlug(pathname, item.slug);
          return (
            <li key={item.slug}>
              <Link
                href={clientHref(item.slug)}
                onClick={() => setOpen(false)}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'focus-ring flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors motion-reduce:transition-none',
                  ativo
                    ? 'bg-foreground text-background'
                    : 'bg-background text-foreground/70 hover:bg-secondary',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
