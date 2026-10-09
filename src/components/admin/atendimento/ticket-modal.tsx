'use client';

import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/form';
import { formatReceivedAt } from '@/lib/atendimento/metrics';
import type { Ticket, TicketStatus } from '@/lib/atendimento/types';

/**
 * O detalhe de um atendimento — a mensagem inteira e a troca de status.
 *
 * ================== ELE TAMBÉM NÃO ESTÁ EM PRINT ==================
 *
 * Nenhuma captura abre o detalhe. O que existe é o botão `Ver detalhes` em cada
 * linha, no original — e um botão que não abre nada seria pior que um painel sem
 * print. Os três blocos (`Mensagem`, `Recebido em`, `Status`) e o `select` com as
 * três opções `Aberto` / `Em andamento` / `Finalizado` vêm do original, na ordem
 * dele.
 *
 * ================== O `select` MOSTRA O RÓTULO, MAS GUARDA O VALOR CRU ==================
 *
 * Os `option` têm `value` cru (`novo` / `em_atendimento` / `finalizado`) e rótulo
 * em português. Isso importa para o Neon: a coluna `status` guarda o valor cru, e
 * trocar o rótulo na tela nunca deve mexer no que o banco recebe.
 *
 * `aguardando_cliente` não tem opção própria — o original o trata como
 * `Em andamento` na leitura, e ao trocar por `Em andamento` grava
 * `em_atendimento`. Como a escrita ainda não grava, o efeito visível é a troca
 * imediata do badge na lista.
 *
 * ================== A ESCRITA AINDA NÃO GRAVA ==================
 *
 * Escolher um status chama a camada de dados, que devolve `persisted: false`. A
 * lista muda em memória e o rodapé do modal avisa que nada foi ao banco — o mesmo
 * comportamento de WhatsApp e E-mails enquanto o Neon não está ligado.
 */
export function TicketModal({
  ticket,
  onClose,
  onStatusChange,
  aviso,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  onStatusChange: (id: string, status: TicketStatus) => void;
  aviso: string | null;
}) {
  if (!ticket) return null;

  const nome = ticket.customerName.trim() === '' ? 'Cliente' : ticket.customerName;

  return (
    <Modal
      open
      onClose={onClose}
      title={nome}
      description={ticket.phone.trim() === '' ? '—' : ticket.phone}
      footer={
        aviso ? (
          <p role="status" className="w-full text-xs text-warning">
            {aviso}
          </p>
        ) : null
      }
    >
      <div className="space-y-4 text-sm">
        <div>
          <p className="label-caps mb-1">Mensagem</p>
          <p className="whitespace-pre-wrap rounded-xl bg-secondary/40 p-3">
            {ticket.message.trim() === '' ? '—' : ticket.message}
          </p>
        </div>

        <div>
          <p className="label-caps mb-1">Recebido em</p>
          <p>{formatReceivedAt(ticket.createdAt)}</p>
        </div>

        <div>
          <label htmlFor="tk-status" className="label-caps mb-1 block">
            Status
          </label>
          <Select
            id="tk-status"
            value={ticket.status}
            options={[
              { value: 'novo', label: 'Aberto' },
              { value: 'em_atendimento', label: 'Em andamento' },
              { value: 'finalizado', label: 'Finalizado' },
            ]}
            onChange={(event) => onStatusChange(ticket.id, event.target.value as TicketStatus)}
          />
        </div>
      </div>
    </Modal>
  );
}
