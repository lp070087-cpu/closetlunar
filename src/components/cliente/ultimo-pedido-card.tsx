import Link from 'next/link';
import { Package } from 'lucide-react';
import { formatBRL } from '@/lib/utils';
import { tomStatus } from '@/lib/cliente/metrics';
import type { PedidoCliente } from '@/lib/cliente/types';
import { ContaSectionCard } from './conta-section-card';

/**
 * O cartao `Ultimo pedido` do Dashboard — com os DOIS ramos.
 *
 * ================== O RAMO VAZIO E DO ORIGINAL, E NAO UMA INVENCAO ==================
 *
 * Quando nao ha pedido nenhum, o material desenha um bloco tracejado com o
 * icone, `Nenhum pedido realizado ainda.` e um link `Ir para a loja`. Isso esta
 * em `conta.index.tsx` (o `else` do `last ? ... : ...`), e nao num print — o
 * print so mostra o ramo COM pedido.
 *
 * Isso importa para a regra de prioridade: o print manda na APARENCIA, mas
 * quando ele nao mostra um comportamento e o original o comprova, o
 * comportamento se preserva sem inventar interface nova. E exatamente o caso —
 * o desenho do vazio vem inteiro do original.
 *
 * ================== O SELO DE STATUS ==================
 *
 * Ele mostra o rotulo CURTO do admin (`NOVO`), e nao o longo do cliente
 * (`Aguardando pagamento`). Nao e incoerencia: o original escreve `{last.status}`
 * cru neste cartao — o valor do campo, sem passar pelo mapa de rotulos que a
 * tela de `Meus Pedidos` usa. Sao dois lugares do material, e cada um escreve do
 * seu jeito.
 *
 * O TOM vem do mapa do cliente (`tomStatus`), porque o cru nao existe aqui: o
 * original dependia do texto do campo, e o nosso campo guarda o codigo.
 */
export interface UltimoPedidoCardProps {
  pedido: PedidoCliente | null;
}

export function UltimoPedidoCard({ pedido }: UltimoPedidoCardProps) {
  return (
    <ContaSectionCard titulo="Último pedido">
      {pedido ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-secondary/40 p-4">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Número</p>
              <p className="text-sm font-medium">{pedido.codigo}</p>
            </div>
            <div className="text-right">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Status</p>
              <span
                className={`inline-flex rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tomStatus(pedido.status)}`}
              >
                {pedido.status}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-sm">
            <span className="text-muted-foreground">Valor total</span>
            <span className="font-serif text-lg">{formatBRL(pedido.total)}</span>
          </div>

          <Link
            href="/conta/pedidos"
            className="focus-ring block w-full rounded-xl bg-foreground py-3 text-center text-xs font-bold uppercase tracking-widest text-background transition-all hover:opacity-90"
          >
            Ver todos os pedidos
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-8 text-center">
          <Package className="mx-auto mb-3 size-8 text-muted-foreground/30" aria-hidden />
          <p className="text-sm text-muted-foreground">Nenhum pedido realizado ainda.</p>
          <Link
            href="/"
            className="focus-ring mt-4 inline-block rounded text-xs font-bold uppercase tracking-widest hover:underline"
          >
            Ir para a loja
          </Link>
        </div>
      )}
    </ContaSectionCard>
  );
}
