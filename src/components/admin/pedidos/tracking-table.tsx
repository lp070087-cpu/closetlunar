import { Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { EmptyRow } from '@/components/ui/states';
import { actionLabel, formatShippingStatus, trackingUrl } from '@/lib/pedidos/metrics';
import type { Order } from '@/lib/pedidos/types';

/**
 * A TABELA DE RASTREAMENTO — a aba `Rastreamento` (adm-004).
 *
 * As SEIS colunas, na ordem exata do print:
 *
 *   PEDIDO · CLIENTE · TRANSPORTADORA · CÓDIGO · STATUS · AÇÃO
 *
 * O QUE CADA COLUNA MOSTRA, e as duas que enganam:
 *
 *   PEDIDO           `#ff3048c9` — o id truncado, em MONO. Nao e numero amigavel;
 *   CLIENTE          so o nome, sem o telefone. O cartao de adm-003 mostra
 *                    `Mariana · 81994608572`, mas ESTA tabela so tem `Mariana`.
 *                    Reusar o `customerLine` aqui seria o erro mais facil de
 *                    cometer, e ele poria o telefone numa coluna que o print
 *                    nao tem;
 *   TRANSPORTADORA   `Correios`;
 *   CÓDIGO           `—` quando nao ha codigo — TRAVESSAO LONGO, nao hifen. E a
 *                    coluna que mostra o codigo de verdade quando existe;
 *   STATUS           `Aguardando postagem` — o estado da POSTAGEM, e nao o do
 *                    pedido. Ver `formatShippingStatus`;
 *   AÇÃO             `sem código` em cinza claro — um ESTADO VAZIO, nao um
 *                    botao. Quando ha codigo, o projeto original troca por um
 *                    link `Rastrear`. Ver `actionLabel`.
 *
 * A coluna AÇÃO e a unica que tem duas caras, e a segunda nunca foi
 * fotografada: o print so mostra o estado vazio. O link existe porque o projeto
 * original o declara — nao porque ha um print dele.
 */
export function TrackingTable({ orders }: { orders: Order[] }) {
  return (
    <div className="surface overflow-hidden">
      <TableWrap>
        <Table className="min-w-[54rem]">
          <TableHead>
            <tr>
              <TableHeaderCell className="pl-8">Pedido</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Transportadora</TableHeaderCell>
              <TableHeaderCell>Código</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell align="right" className="pr-8">
                Ação
              </TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <EmptyRow colSpan={6} icon={Package} title="Nenhum pedido com rastreamento." />
            ) : (
              orders.map((order) => {
                const action = actionLabel(order);
                const url = trackingUrl(order);
                return (
                  <TableRow key={order.id}>
                    {/* `#ff3048c9` — mono, como no print. */}
                    <TableCell className="pl-8 font-mono text-xs">{order.code}</TableCell>
                    {/* SO O NOME. Nao e o `customerLine` do cartao. */}
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>{order.shipping.carrier ?? '—'}</TableCell>
                    {/* `—` = travessao longo, e nao hifen. */}
                    <TableCell className="font-mono text-xs">
                      {order.shipping.trackingCode ?? '—'}
                    </TableCell>
                    {/*
                      O `?? 'Aguardando postagem'` NAO e uma escolha desta tela:
                      e o que o projeto original escreve (`o.delivery_status ||
                      "Aguardando postagem"`). O print concorda — as duas linhas
                      dessa tabela mostram esse texto.

                      Ele so entra quando a transportadora EXISTE e o status nao
                      (senao a linha nem estaria nesta aba): um pedido que ja
                      tem transportadora escolhida mas ainda nao foi despachado
                      esta, por definicao, aguardando postagem.
                    */}
                    <TableCell className="text-xs">
                      {order.shipping.status
                        ? formatShippingStatus(order.shipping.status)
                        : 'Aguardando postagem'}
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      {action.kind === 'track' && url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-warning-foreground transition-colors hover:bg-warning-surface/60"
                        >
                          {action.text}
                        </a>
                      ) : (
                        // `sem código`: cinza claro, NAO e botao.
                        <span className="text-xs text-muted-foreground">{action.text}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}
