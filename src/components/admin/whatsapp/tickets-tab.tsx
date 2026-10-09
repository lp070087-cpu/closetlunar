'use client';

import { useState } from 'react';
import { FileText, MessageCircle } from 'lucide-react';
import { PillTabs, type TabItem } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import {
  TICKET_FILTERS,
  filterLabel,
  filterTickets,
  formatTicketDate,
  originLabel,
  openingMessage,
  phoneDigits,
  statusCounts,
  statusLabel,
  whatsappLink,
} from '@/lib/whatsapp/metrics';
import type { Ticket, TicketFilter } from '@/lib/whatsapp/types';

/**
 * A ABA `Atendimentos` — adm-069.
 *
 * ================== O FILTRO É UMA PÍLULA POR STATUS, COM A CONTAGEM ==================
 *
 * As cinco pílulas (`Todos`, `NOVO`, `EM ATENDIMENTO`, `AGUARDANDO CLIENTE`,
 * `FINALIZADO`) saem de `TICKET_FILTERS`, e o número ao lado de cada uma vem de
 * `statusCounts` — contado sobre a LISTA INTEIRA, não sobre o que a pílula ativa
 * mostra. É o que faz o `FINALIZADO (2)` continuar dizendo `2` mesmo com a pílula
 * `NOVO` acesa; contar depois de filtrar zeraria todas as pílulas menos a ativa.
 *
 * O componente é `PillTabs` (pílulas `rounded-full` soltas), e não `SegmentedTabs`
 * (faixa única) — no print as pílulas têm BORDA própria e espaço entre elas, com só
 * a ativa preenchida de preto.
 *
 * ================== A TABELA, E O QUE CADA COLUNA FAZ ==================
 *
 *   Cliente     nome em cima, telefone embaixo, em cinza.
 *   Origem      o rótulo gritado em caixa alta — `WHATSAPP DO PRODUTO`.
 *   Relacionado a miniatura do produto + o nome, ou um `—` quando não há produto.
 *   Status      aqui o original usa um `select` que TROCA o status ao vivo. Nesta
 *               fase (sem banco) ele é um `<span>` — um `select` que não grava
 *               prometeria uma troca que não acontece. Vira `Select` na integração.
 *   Data        `27/09 14:35` — ver `formatTicketDate`.
 *   Ações       o botão verde do WhatsApp e o de copiar a mensagem.
 *
 * ================== AS DUAS AÇÕES ESCREVEM NA ÁREA DE TRANSFERÊNCIA ==================
 *
 * O botão verde ABRE o `wa.me` numa aba nova (isso funciona sem banco — é um link).
 * O de copiar usa `navigator.clipboard`, com um estado local só para dar o retorno
 * visual de "copiado". O original faz o mesmo, e ainda move o ticket de `novo` para
 * `em_atendimento` — essa PARTE fica para a integração, porque é escrita no banco.
 */
export function TicketsTab({ tickets }: { tickets: Ticket[] }) {
  const [filter, setFilter] = useState<TicketFilter>('all');
  const [copiado, setCopiado] = useState<string | null>(null);

  const contagens = statusCounts(tickets);
  const filtrados = filterTickets(tickets, filter);

  /**
   * O `TabItem<TicketFilter>` explícito (e o `<PillTabs<TicketFilter>>` lá embaixo)
   * é o que segura o genérico: sem ele o `filter` corrente casaria contra o
   * `onChange: (value: string) => void` do genérico aberto, e o `setFilter` — que só
   * aceita `TicketFilter` — não assignaria. Mesmo arranjo de `movement-history.tsx`.
   */
  const itens: TabItem<TicketFilter>[] = TICKET_FILTERS.map((valor) => ({
    value: valor,
    label: filterLabel(valor),
    count: contagens[valor],
  }));

  async function copiar(ticket: Ticket) {
    try {
      await navigator.clipboard.writeText(openingMessage(ticket));
      setCopiado(ticket.id);
      window.setTimeout(() => setCopiado((atual) => (atual === ticket.id ? null : atual)), 2000);
    } catch {
      // Sem permissao de area de transferencia o botao simplesmente nao confirma;
      // nao vale um alerta para isto.
    }
  }

  return (
    <div className="space-y-4">
      <PillTabs<TicketFilter> items={itens} value={filter} onChange={setFilter} />

      <div className="surface overflow-hidden">
        <TableWrap>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Cliente</TableHeaderCell>
                <TableHeaderCell>Origem</TableHeaderCell>
                <TableHeaderCell>Relacionado</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell align="right">Ações</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Nenhum atendimento encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="font-medium">{ticket.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {phoneDigits(ticket.customerPhone)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {originLabel(ticket.origin)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {ticket.product ? (
                        <div className="flex items-center gap-2">
                          {ticket.product.image ? (
                            <img
                              src={ticket.product.image}
                              alt=""
                              loading="lazy"
                              className="size-8 rounded border border-border object-cover"
                            />
                          ) : null}
                          <span className="max-w-[120px] truncate text-xs">
                            {ticket.product.name}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {statusLabel(ticket.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTicketDate(ticket.createdAt)}
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={whatsappLink(ticket)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Abrir conversa no WhatsApp"
                          className="focus-ring rounded-lg bg-success p-2 text-white transition-colors hover:brightness-95"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copiar(ticket)}
                          aria-label={copiado === ticket.id ? 'Mensagem copiada' : 'Copiar mensagem'}
                          className="focus-ring rounded-lg border border-border p-2 transition-colors hover:bg-secondary"
                        >
                          <FileText className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrap>
      </div>
    </div>
  );
}
