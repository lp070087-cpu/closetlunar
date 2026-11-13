/**
 * A camada de dados do Atendimento — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda: as
 * assinaturas continuam as mesmas e nenhum componente precisa ser tocado.
 */

import { DEMO_TICKETS } from './demo';
import type { Ticket, TicketStatus } from './types';
import { lerModulo, gravarModulo } from '@/lib/data/modulo';

const PENDING_REASON = 'Não foi possível salvar agora. Tente novamente.';

export async function listTickets(): Promise<{ data: Ticket[]; source: 'demo' | 'database'; reason?: string }> {
  return lerModulo<Ticket[]>('atendimento:tickets', DEMO_TICKETS.map((t) => ({ ...t })), []);
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<{ data: { id: string; status: TicketStatus }; persisted: boolean; reason?: string }> {
  const atual = (await listTickets()).data;
  const r = await gravarModulo('atendimento:tickets', atual.map((t) => (t.id === id ? { ...t, status } : t)));
  return { data: { id, status }, persisted: r.persisted, reason: r.persisted ? undefined : r.reason ?? PENDING_REASON };
}

export { PENDING_REASON };
