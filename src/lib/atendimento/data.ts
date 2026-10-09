/**
 * A camada de dados do Atendimento — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda: as
 * assinaturas continuam as mesmas e nenhum componente precisa ser tocado.
 */

import { DEMO_TICKETS } from './demo';
import type { Ticket, TicketStatus } from './types';

/**
 * O motivo padrão de toda escrita que ainda não grava. Exportado no fim do
 * arquivo e reusado pela tela, para o aviso ser um texto só.
 */
const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * A fila de atendimentos, do mais recente para o mais antigo.
 *
 * FUTURO (Neon): `customer_service_tickets ORDER BY created_at DESC`, com
 * `customer_name`, `customer_phone`, `message` e `status`. Devolve uma lista
 * NOVA — uma cópia de cada ticket — para que editar a tela não escreva na
 * demonstração do módulo.
 */
export async function listTickets(): Promise<{ data: Ticket[]; source: 'demo'; reason: string }> {
  return {
    data: DEMO_TICKETS.map((ticket) => ({ ...ticket })),
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * Troca o status de um atendimento.
 *
 * A interface é a do banco — `(id, status)` e nada mais. A tela atualiza a lista
 * que já tem em memória com `applyStatusChange`; aqui devolvemos o envelope de
 * escrita dizendo que NADA foi gravado, e é a tela que mostra o aviso em vez de
 * fingir sucesso.
 *
 * FUTURO (Neon): `UPDATE customer_service_tickets SET status = $2 WHERE id = $1`,
 * seguido do `reload` da lista.
 */
export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<{ data: { id: string; status: TicketStatus }; persisted: false; reason: string }> {
  return { data: { id, status }, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
