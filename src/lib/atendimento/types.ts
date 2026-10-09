/**
 * Tipos do módulo Atendimento (`/admin/atendimento`) — adm-074.
 *
 * ================== O STATUS TEM DOIS NOMES, E ISSO É DE PROPÓSITO ==================
 *
 * O BANCO guarda a situação do ticket em `status`, com os valores crus
 * `novo` / `em_atendimento` / `aguardando_cliente` / `finalizado`. A TELA não
 * conhece esses valores: ela trabalha em três BALDES — `open`, `progress` e
 * `done` — porque é assim que o print desenha (três colunas de contagem mais o
 * `Todos`).
 *
 * O mapeamento entre os dois é do `metrics.ts`, e ele não é 1-para-1:
 * `aguardando_cliente` cai no mesmo balde que `em_atendimento`, e qualquer valor
 * desconhecido cai em `open`. Guardar só o balde perderia os valores do banco;
 * guardar só o valor cru obrigaria a tela a refazer o mapeamento em três lugares.
 *
 * Por isso o tipo do dado é `TicketStatus` (o valor cru) e o tipo de filtro é
 * `TicketBucket` (o balde). São coisas diferentes com nomes diferentes.
 */

/** O valor CRU de `status` no banco. É o que `listTickets` devolve. */
export type TicketStatus = 'novo' | 'em_atendimento' | 'aguardando_cliente' | 'finalizado';

/** O BALDE da tela — o que o print mostra e o que as pílulas filtram. */
export type TicketBucket = 'open' | 'progress' | 'done';

/** A pílula `Todos` não é um balde: é a ausência de filtro. */
export type TicketFilter = 'all' | TicketBucket;

export interface Ticket {
  id: string;
  /** Nome do cliente — o print usa `Cliente` quando não há nome. */
  customerName: string;
  /** Telefone como o cliente informou. O print mostra `—` quando vazio. */
  phone: string;
  /** A mensagem inteira. A linha da lista corta; o modal mostra tudo. */
  message: string;
  status: TicketStatus;
  /** ISO completo (`2026-10-01T14:32:00`) — a tela mostra data E hora. */
  createdAt: string;
}

/** A contagem de cada pílula — as quatro do print, na ordem do print. */
export interface TicketCounts {
  all: number;
  open: number;
  progress: number;
  done: number;
}
