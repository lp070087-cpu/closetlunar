'use client';

import Link from 'next/link';
import { NAV_ITEMS, clientHref, isActiveSlug } from '@/lib/cliente/nav';
import { cn } from '@/lib/utils';

/**
 * A navegacao da area da cliente em TELA ESTREITA: uma linha horizontal de
 * pilulas que rola de lado.
 *
 * Nao ha print desta versao — os 20 prints sao de desktop. Ela esta aqui porque
 * o ORIGINAL a declara (`AccountLayout.tsx`, `lg:hidden`) e porque o comando
 * desta fase exige que a navegacao funcione no celular: sem ela, os nove itens
 * ficariam inalcancaveis abaixo de `lg`.
 *
 * O que vem do original, literalmente: pilulas `rounded-full`, item ativo
 * `bg-foreground text-background border-foreground`, item inativo
 * `bg-background text-foreground/70`, a linha com `-mx-4 px-4` para o corte
 * encostar na borda, e a rolagem sem barra visivel.
 *
 * O QUE NAO VEM DO ORIGINAL, e por que: o `-mx-4 px-4` do original supõe um
 * `px-4` no pai. A casca daqui usa `px-4 sm:px-6` (a medida do print), entao o
 * corte da rolagem usa a MESMA variavel de recuo do pai — se um dia o recuo
 * mudar, o corte acompanha em vez de desalinhar.
 *
 * A rolagem e `scrollbar-hide` (utilitario ja existente em `globals.css`) e nao
 * o `no-scrollbar` do original, que e uma classe do Tailwind v4 do projeto de
 * origem e nao existe neste.
 */
export function AccountMobileNav({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Área da cliente"
      className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 scrollbar-hide lg:hidden"
    >
      <ul className="flex gap-2 pb-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const ativo = isActiveSlug(pathname, item.slug);
          return (
            <li key={item.slug} className="shrink-0">
              <Link
                href={clientHref(item.slug)}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'focus-ring flex items-center gap-2 whitespace-nowrap rounded-full border px-5 py-3 text-sm font-medium shadow-soft transition-all',
                  ativo
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-foreground/70 hover:border-foreground/30',
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
