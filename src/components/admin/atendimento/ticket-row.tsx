'use client';

import { cn } from '@/lib/utils';
import type { Ticket } from '@/lib/atendimento/types';
import { excerpt, formatReceivedAt, statusLabel, statusTone } from '@/lib/atendimento/metrics';

/**
 * UMA linha da fila — o bloco que o original desenha quando há atendimentos.
 *
 * ================== ELE NÃO ESTÁ EM PRINT NENHUM, E POR ISSO É SÓBRIO ==================
 *
 * O print adm-074 mostra a fila VAZIA. Nenhuma captura abre um atendimento, então
 * não há desenho de linha para copiar. A estrutura vem do original
 * (`AtendimentoAdmin`): nome + badge na primeira linha, telefone e um trecho da
 * mensagem na segunda, a data embaixo, e o botão `Ver detalhes` à direita.
 *
 * Como não há print, a regra do projeto vale ao contrário: em vez de inventar um
 * desenho novo, a linha usa o que já existe em todo o painel — o badge de status,
 * a hairline entre as linhas, e o botão secundário. Nenhuma classe nova.
 *
 * ================== O SEPARADOR `·` É MONTADO AQUI ==================
 *
 * `formatReceivedAt` devolve `01/10/2026 14:32` e não sabe do `·`. Quem junta
 * telefone e assunto é esta linha; se o telefone estiver vazio, ele vira `—`, como
 * no original, e o separador continua fazendo sentido.
 */
export function TicketRow({ ticket, onOpen }: { ticket: Ticket; onOpen: (ticket: Ticket) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-bold">
            {ticket.customerName.trim() === '' ? 'Cliente' : ticket.customerName}
          </span>
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              statusTone(ticket.status),
            )}
          >
            {statusLabel(ticket.status)}
          </span>
        </div>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {ticket.phone.trim() === '' ? '—' : ticket.phone} · {excerpt(ticket.message)}
        </p>

        <p className="mt-0.5 text-[11px] text-muted-foreground">{formatReceivedAt(ticket.createdAt)}</p>
      </div>

      <button
        type="button"
        onClick={() => onOpen(ticket)}
        className="focus-ring shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:bg-secondary"
      >
        Ver detalhes
      </button>
    </div>
  );
}
