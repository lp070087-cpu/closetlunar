import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

/**
 * Um dos OITO cartoes de atalho do Dashboard.
 *
 * ================== O QUE O PRINT MOSTRA, E O QUE ELE NAO MOSTRA ==================
 *
 * O atalho do print e MAGRO: icone a esquerda, rotulo, e uma seta. Nao tem
 * moldura propria, nao tem fundo, nao tem sombra — o que separa um atalho do
 * outro e o espaco. E assim nos quatro prints que os mostram (`cli-001` a
 * `cli-003`, a grade se repetindo conforme a pagina rola).
 *
 * O original declara `border border-border bg-background shadow-sm`. Copiado
 * ao pe da letra, os oito viravam oito caixinhas dentro do painel branco — e o
 * painel branco ja esta dentro de um cartao com borda. Nao e o que o material
 * mostra, e por isso a borda saiu e ficou so o alvo do hover, que e o que
 * indica que o cartao e clicavel.
 *
 * ================== A CONTAGEM E DO ATALHO, E NAO DE TODOS ==================
 *
 * A segunda linha (`0 ITENS`) so existe em `Favoritos`: e o unico em que o
 * original passa `count`. O campo `mostraContagem` vem de `nav.ts`, junto da
 * lista — quem decide quais atalhos tem contagem e o material, nao a tela.
 */
export interface AccountQuickLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Contagem de itens. So e desenhada quando `mostraContagem` e verdadeiro. */
  count?: number;
  mostraContagem?: boolean;
}

export function AccountQuickLink({ href, icon: Icon, label, count, mostraContagem }: AccountQuickLinkProps) {
  return (
    <Link
      href={href}
      className="focus-ring group flex items-center justify-between rounded-2xl border border-transparent px-4 py-3.5 transition-all hover:border-border hover:bg-secondary/30"
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="size-4 shrink-0 transition-colors group-hover:text-accent" aria-hidden />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{label}</span>
          {mostraContagem && count != null ? (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {count} {count === 1 ? 'item' : 'itens'}
            </span>
          ) : null}
        </span>
      </span>
      <ChevronRight
        className="hidden size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 md:block md:-translate-x-2"
        aria-hidden
      />
    </Link>
  );
}
