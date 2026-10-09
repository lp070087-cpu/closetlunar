import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * O cartao de metrica — `PEDIDOS 5`, `CASHBACK R$ 10,14`, `MEUS PONTOS 0`.
 *
 * ================== ELE NAO TEM COR PROPIA NEM "CARD" PROPRIO ==================
 *
 * Duas decisoes que fazem este componente servir aos dois paineis:
 *
 * 1. **A cor do icone e prop, nao constante.** `AMBAR` aqui quer dizer o
 *    `text-amber-600` que o Dashboard do admin usa; no cliente, `CASHBACK` usa o
 *    tom do accent e `MEUS PONTOS` um bronze proprio. Fixar a cor la dentro
 *    obrigaria a area da cliente a reimplementar o cartao inteiro.
 *
 * 2. **Ele NAO desenha a moldura.** A casca da area da cliente ja entrega o
 *    painel de conteudo pronto (`rounded-[2.5rem] … lg:p-10`), e o Dashboard
 *    original desenvolve os blocos DENTRO dele — o `Card` de la so existe para
 *    `Ultimo pedido` e `Cupons ativos`. Se este `Stat` trouxesse a propria
 *    borda, os indicadores apareceriam como quatro cartoes soltos dentro de um
 *    quinto cartao.
 *
 * ================== A CAIXA DO ICONE, NO ESTADO DE REPOUSO ==================
 *
 * O original declara `bg-beige/50` (uma tinta champanhe a meia opacidade) na
 * caixa do icone. O print **nao mostra tinta nenhuma**: o interior da caixa foi
 * amostrado em (254,254,254), que e a mesma variacao de ruido do resto do
 * cartao — e o projeto tambem nao tem o token `beige`. Em vez de criar um token
 * novo para reproduzir uma tinta que o material nao mostra, o repouso fica sem
 * fundo e a INTERACAO e mantida: no hover a caixa vira `bg-foreground` e o
 * icone inverte para `text-background`, que e o movimento que o original
 * descreve. Regra de ouro: o print manda na aparencia.
 */
export interface StatProps {
  icon: LucideIcon;
  /** Caixa alta, escrito do jeito que a tela escreve (`Pedidos`, `CASHBACK`). */
  label: string;
  /** Ja formatado. `Stat` nao formata nada — ver `formatBRL` em quem chama. */
  value: string;
  /** A classe da cor do ICONE. Default: a tinta secundaria. */
  corIcone?: string;
  className?: string;
}

export function Stat({ icon: Icon, label, value, corIcone, className }: StatProps) {
  return (
    <div
      className={cn(
        'group flex flex-col justify-between rounded-3xl border border-border bg-background p-5 shadow-soft transition-all hover:border-foreground/20 md:p-6',
        className,
      )}
    >
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-2xl transition-all duration-300 group-hover:bg-foreground',
          corIcone ?? 'text-muted-foreground',
        )}
      >
        <Icon className="size-5 transition-colors group-hover:text-background" aria-hidden />
      </div>
      <div className="mt-4">
        <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="font-serif text-xl leading-none md:text-2xl">{value}</p>
      </div>
    </div>
  );
}
