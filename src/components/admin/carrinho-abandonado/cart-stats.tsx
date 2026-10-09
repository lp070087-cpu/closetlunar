import { Check, ShoppingCart, Wallet, X } from 'lucide-react';
import { formatBRL } from '@/lib/utils';
import type { CartStats } from '@/lib/carrinho-abandonado/types';

/**
 * Os QUATRO indicadores do topo de adm-008.
 *
 * TOTAL ABANDONADOS · RECUPERADOS · PERDIDOS · VALOR RECUPERADO
 *
 * AS CORES SAO AS DO PRINT, e sao diferentes das dos outros KPIs do painel:
 * carrinho neutro, check verde, X rosa e carteira ambar. O original passa
 * `accent` por cartao justamente porque os quatro nao compartilham a mesma
 * paleta; usar um tom unico para os quatro apagaria a informacao que o print
 * da — de longe, o verde e o rosa ja dizem qual numero e bom e qual e ruim.
 *
 * O CARD NAO E REUTILIZADO DO `StatCard` DO PAINEL por um motivo concreto: o
 * print mostra o icone num quadrado colorido a direita e o numero grande a
 * esquerda. E o mesmo motivo registrado no card de Segmentos do CRM — cada tela
 * tem a sua disposicao, e "padronizar" apagaria a diferenca que o print mostra.
 *
 * O QUARTO VALOR E DINHEIRO, e nao contagem: por isso `formatBRL` so nele. Os
 * outros tres sao `length` de lista.
 */
export function CartStatsRow({ stats }: { stats: CartStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CartStatCard
        label="Total Abandonados"
        value={String(stats.total)}
        icon={ShoppingCart}
        tone="bg-secondary text-muted-foreground"
      />
      <CartStatCard
        label="Recuperados"
        value={String(stats.recovered)}
        icon={Check}
        tone="bg-success-surface text-success-foreground"
      />
      <CartStatCard
        label="Perdidos"
        value={String(stats.lost)}
        icon={X}
        tone="bg-danger-surface text-danger-foreground"
      />
      <CartStatCard
        label="Valor Recuperado"
        value={formatBRL(stats.recoveredValue)}
        icon={Wallet}
        tone="bg-warning-surface text-warning-foreground"
      />
    </div>
  );
}

/** Um dos quatro cartoes. `value` ja chega formatado — numero ou dinheiro. */
function CartStatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof ShoppingCart;
  /** Cor do quadrado do icone. Cada cartao tem a sua. */
  tone: string;
}) {
  return (
    <div className="surface flex items-start justify-between gap-4 p-6">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-3 font-serif text-3xl tabular-nums">{value}</p>
      </div>
      <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${tone}`}>
        <Icon className="size-5" aria-hidden />
      </span>
    </div>
  );
}
