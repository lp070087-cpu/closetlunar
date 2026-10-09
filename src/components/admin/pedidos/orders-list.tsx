import { ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/ui/states';
import { customerLine, formatItemLine, shippingSummary } from '@/lib/pedidos/metrics';
import type { Order } from '@/lib/pedidos/types';
import { formatBRL, formatDateTime } from '@/lib/utils';
import { OrderStatusBadge } from './order-status-badge';

/**
 * A LISTA DE PEDIDOS — a aba `Todos` (adm-003).
 *
 * A geometria do cartao, medida no print:
 *
 *   MARIANA · 81994608572                          R$ 506,95 • novo
 *   16/06/2026, 14:56:54
 *   Transp.: Correios  Status: Aguardando postagem
 *   • 1x Jaqueta Corta Vento Fit (M/Preto) — R$ 179,90
 *
 * Tres linhas com pesos diferentes:
 *
 *   1. nome em NEGRITO + telefone normal, e o valor + status ancorados a
 *      DIREITA, na mesma linha;
 *   2. a data-hora sozinha, em cinza e menor — `16/06/2026, 14:56:54`, com
 *      VIRGULA e SEGUNDOS (o formato do projeto, `formatDateTime`);
 *   3. a linha `Transp.:`/`Status:` com os ROTULOS em negrito e os valores
 *      normais;
 *   4. os itens como lista com marcador (`•`), um por linha.
 *
 * QUANDO CADA LINHA DESAPARECE — e isto e fidelidade, nao uma condicional
 * defensiva:
 *
 *   - a linha `Transp./Status:` inteira some quando o pedido nao tem postagem.
 *     No print, os dois cartoes do topo mostram; os tres do `lucas` nao. O
 *     projeto original usa a mesma condicao (`carrier || tracking_code ||
 *     delivery_status`), e por isso o `shippingSummary` devolve `null`;
 *   - a lista de itens nao e desenhada quando nao ha item. E o caso do cartao
 *     da `Mariana`, que mostra o total de R$ 506,95 e nenhuma linha de item.
 *
 * Card BRANCO de largura total com borda fina, e nao uma tabela: o print nao
 * tem cabecalho nesta aba.
 */
export function OrdersList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="surface">
        <EmptyState
          icon={ShoppingBag}
          title="Sem pedidos ainda."
          description="Assim que uma cliente finalizar uma compra, o pedido aparece aqui."
        />
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </ul>
  );
}

/**
 * Um cartao. Separado da lista para a bancada poder renderizar UM pedido e
 * medir os textos do print sem depender da lista inteira — e para a condicional
 * da linha de frete ter um lugar so.
 */
export function OrderCard({ order }: { order: Order }) {
  const shipping = shippingSummary(order);

  return (
    <li className="surface px-5 py-4">
      {/* Linha 1: cliente a esquerda, valor + status a direita. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{order.customer.name}</span>
          <span className="text-muted-foreground"> · {order.customer.phone}</span>
        </p>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {formatBRL(order.payment.total)}
          <OrderStatusBadge status={order.status} />
        </p>
      </div>

      {/* Linha 2: data e hora, com virgula e segundos. */}
      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.placedAt)}</p>

      {/* Linha 3: so quando ha postagem. Ver `shippingSummary`. */}
      {shipping ? (
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground">
          {shipping.carrier ? (
            <span>
              <strong className="font-semibold">Transp.:</strong> {shipping.carrier}
            </span>
          ) : null}
          {shipping.status ? (
            <span>
              <strong className="font-semibold">Status:</strong> {shipping.status}
            </span>
          ) : null}
        </p>
      ) : null}

      {/* Linha 4: os itens. Lista com marcador, como no print. */}
      {order.items.length > 0 ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
          {order.items.map((item) => (
            <li key={item.id}>{formatItemLine(item)}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Exportado para o teste de fumaça da bancada: o cartao da `Mariana` e o caso
 * em que a lista de itens NAO existe, e o do `carinna` e o caso em que existe.
 * Ter os dois nomes aqui evita a bancada procurar por id cru.
 */
export { customerLine, formatItemLine };
