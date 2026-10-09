'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { NAV_ITEMS, SIGN_OUT_LABEL, clientHref, isActiveSlug } from '@/lib/cliente/nav';
import { cn } from '@/lib/utils';

/**
 * A coluna de navegacao da area da cliente.
 *
 * ================== O QUE DEFINE A APARENCIA ==================
 *
 * O print `cli-019` e a medida que manda aqui, e as tres medidas sao:
 *
 *   cartao   x 13..272 → 259 px de largura   (o original declara `260px`)
 *   raio do cartao                           (o original declara `rounded-3xl`)
 *   cartao interno x 45..241, item ativo com fundo preto arredondado
 *
 * O item ATIVO e a PILULA PRETA (`bg-foreground text-background`) — nao um
 * realce rosa, nao um risco na lateral. E o contraste mais forte da coluna, e e
 * assim que o print marca `Meus Favoritos` em `cli-006`.
 *
 * ================== O PADDING ZERADO DO CARTAO ==================
 *
 * `p-3` e `px-0` — nao e engano. O original declara `p-3` (que o Tailwind
 * aplica nos QUATRO lados), mas as bordas do cartao foram medidas no print em
 * x=12 e x=272, e a pilula ativa comeca em x=12: o cartao comeca ONDE a pilula
 * comeca. Com `p-3` de verdade haveria 12 px de fundo entre a borda do cartao
 * e a pilula, e o print nao mostra nenhum — ele mostra a pilula encostada no
 * recorte.
 *
 * `p-3 … px-0` mantem o que o padding vertical faz (o respiro de topo e o de
 * baixo, que o print tem) e zera o horizontal, que o print nao tem. E a mesma
 * prancha do cartao de conteudo, que tambem encosta o titulo na borda.
 *
 * ================== O QUE ESTA COLUNA *NAO* E ==================
 *
 * Ela nao e a sidebar do admin. Aquela e uma faixa fixa de 256 px colada na
 * borda esquerda, de altura total, com grupos e subitens. Esta e um CARTAO
 * flutuante dentro do fluxo, com nove itens e um botao. Reusar o componente do
 * admin traria grupos, recolhimento e a largura errada — e o admin esta
 * encerrado, nao se mexe nele para atender o cliente.
 *
 * `aria-current="page"` no item ativo, e nao so a cor: quem navega por leitor
 * de tela precisa da mesma informacao que quem ve a pilula preta.
 */
export interface AccountSidebarProps {
  /** A URL atual, para marcar o item ativo. Vem de `usePathname()`. */
  pathname: string | null;
  /** Chamado depois de clicar num item (usado pelo drawer mobile). */
  onNavigate?: () => void;
  /** Acao de sair. */
  onSignOut?: () => void;
  className?: string;
}

export function AccountSidebar({ pathname, onNavigate, onSignOut, className }: AccountSidebarProps) {
  return (
    <div
      className={cn(
        'sticky top-28 rounded-3xl border border-border bg-background p-3 px-0 shadow-elegant',
        className,
      )}
    >
      <nav className="space-y-1" aria-label="Área da cliente">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const ativo = isActiveSlug(pathname, item.slug);
          return (
            <Link
              key={item.slug}
              href={clientHref(item.slug)}
              onClick={onNavigate}
              aria-current={ativo ? 'page' : undefined}
              className={cn(
                'focus-ring flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium transition-all',
                ativo
                  ? 'bg-foreground text-background shadow-md'
                  : 'text-foreground/70 hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Divisor antes da saida — o original usa `my-2 border-t mx-3`. */}
        <div className="mx-3 my-2 border-t border-border/50" />

        <button
          type="button"
          onClick={onSignOut}
          className="focus-ring flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium text-danger transition-all hover:bg-danger-surface"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          <span>{SIGN_OUT_LABEL}</span>
        </button>
      </nav>
    </div>
  );
}
