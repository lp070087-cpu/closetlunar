/**
 * Métricas e rótulos do Atendimento.
 *
 * PURO: sem React, sem I/O, sem `Date.now()`. Tudo o que sai daqui é função do
 * que entrou.
 */

import type { Ticket, TicketBucket, TicketCounts, TicketFilter, TicketStatus } from './types';

/**
 * O BALDE de um `status` cru.
 *
 * ================== O `default` NÃO É PREGUIÇA ==================
 *
 * O print desenha três colunas de contagem, e o `Todos` é a soma. Se um ticket
 * chegar com um `status` que este código não conhece — porque o banco ganhou um
 * valor novo, ou porque a coluna veio nula —, ele NÃO pode sumir da conta: se
 * sumisse, `all` deixaria de ser a soma das partes e a tela mostraria números que
 * não fecham. O `default` joga o desconhecido em `open`, como o original faz, e
 * `all` continua sendo o comprimento da lista.
 */
export function bucketOf(status: TicketStatus | string): TicketBucket {
  if (status === 'finalizado') return 'done';
  if (status === 'em_atendimento' || status === 'aguardando_cliente') return 'progress';
  return 'open';
}

/** O rótulo do balde — é o texto do badge na lista e do título do print. */
export function bucketLabel(bucket: TicketBucket): string {
  if (bucket === 'done') return 'Finalizado';
  if (bucket === 'progress') return 'Em andamento';
  return 'Aberto';
}

/** O rótulo a partir do status CRU — atalho de `bucketLabel(bucketOf(...))`. */
export function statusLabel(status: TicketStatus | string): string {
  return bucketLabel(bucketOf(status));
}

const TONES: Record<TicketBucket, string> = {
  open: 'bg-blue-100 text-blue-700',
  progress: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
};

/**
 * As cores do badge de status.
 *
 * ================== POR QUE CLASSE CRUA, E NÃO UM `Badge variant` ==================
 *
 * O sistema do projeto tem quatro tons — `neutral`, `success`, `warning`,
 * `danger`. O print usa TRÊS, e um deles é AZUL. Azul não existe entre os quatro:
 * o tom mais próximo (`neutral`) é cinza, e pintar de cinza um status que o print
 * pinta de azul seria trocar a referência por conveniência.
 *
 * Já há precedente no projeto para esse caso: `segment-grid.tsx` (CRM) usa
 * `bg-blue-100 text-blue-600` e mais sete cores cruas do Tailwind onde o print
 * pede um tom fora dos tokens. Aqui vale o mesmo: as três cores do print, na
 * paleta do Tailwind, com os valores medidos por pixel — azul `#155DFC` (blue-600
 * / blue-700), laranja `#F54A00` (orange-600 / orange-700) e verde `#02A73F`
 * (green-600 / green-700).
 */
export function statusTone(status: TicketStatus | string): string {
  return TONES[bucketOf(status)];
}

/** As quatro contagens do print, na ordem do print. */
export function countTickets(tickets: Ticket[]): TicketCounts {
  const counts: TicketCounts = { all: tickets.length, open: 0, progress: 0, done: 0 };
  for (const ticket of tickets) {
    counts[bucketOf(ticket.status)] += 1;
  }
  return counts;
}

/** Aplica o filtro da pílula. `all` devolve a lista inteira. */
export function filterTickets(tickets: Ticket[], filter: TicketFilter): Ticket[] {
  if (filter === 'all') return tickets;
  return tickets.filter((ticket) => bucketOf(ticket.status) === filter);
}

/** `Total` / `Abertos` / `Em andamento` / `Finalizados` — os títulos dos cards. */
export function bucketTitle(bucket: TicketBucket): string {
  if (bucket === 'done') return 'Finalizados';
  if (bucket === 'progress') return 'Em andamento';
  return 'Abertos';
}

/**
 * Corta a mensagem para a LINHA da lista.
 *
 * O original corta em 80 caracteres e mostra `Sem assunto` quando não há texto.
 * Nada de reticências: o print não mostra nenhuma, e o corte mora aqui (não no
 * CSS) para a bancada poder medir o texto que sai.
 */
export function excerpt(message: string, limit = 80): string {
  const texto = message.trim();
  if (texto.length === 0) return 'Sem assunto';
  return texto.slice(0, limit);
}

/**
 * A data e a hora do ticket.
 *
 * ================== O `slice` ANTES DO `replace` NÃO É OPCIONAL ==================
 *
 * O `created_at` chega como ISO. Jogar a string direto no `new Date()` funciona,
 * mas o caminho curto — `iso.slice(0, 16).replace('T', ' ')` — não depende de
 * fuso nenhum: o que o banco gravou é o que a tela mostra. As duas rotas dão o
 * mesmo resultado aqui, e é a de fatia que fica por ser a que não tem como
 * escorregar. O separador do print é `·`, montado na tela, não aqui.
 */
export function formatReceivedAt(createdAt: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(createdAt)) return '—';
  return `${createdAt.slice(0, 10).split('-').reverse().join('/')} ${createdAt.slice(11, 16)}`;
}

/** Aplica uma troca de status a UM ticket, devolvendo uma lista NOVA. */
export function applyStatusChange(tickets: Ticket[], id: string, status: TicketStatus): Ticket[] {
  return tickets.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket));
}
