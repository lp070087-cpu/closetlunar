/**
 * A camada de dados do WhatsApp — o ÚNICO ponto de contato com os dados.
 *
 * Duas leituras (atendimentos e configuração) e uma escrita (salvar a
 * configuração). Nada aqui toca banco: não há `prisma`, não há `DATABASE_URL`.
 * O Neon entra na fase de integração, e o contrato já é o que ele vai preencher.
 *
 * ================== O QUE O BANCO VAI FAZER ==================
 *
 *   ATENDIMENTOS  `customer_service_tickets` com o produto relacionado e o nome
 *                 do cliente: um `select` com JOIN em `products` (para a
 *                 miniatura) e em `customers` (para o nome), ordenado por data
 *                 decrescente — é a ORDEM da lista, e a tela não a refaz.
 *
 *   CONFIGURAÇÃO  o original guarda tudo numa linha de `settings` com chave
 *                 `store`, e faz "merge" com o resto do objeto. Aqui a leitura
 *                 devolve só a parte do WhatsApp (`whatsapp`, `opening_hours` e
 *                 `templates`) — na integração, é esse pedaço que sai da linha
 *                 `store`.
 *
 *   ESCRITA       `upsert` da mesma linha. A escrita devolve o mesmo envelope das
 *                 outras (`persisted: false` + motivo), e NÃO altera a
 *                 demonstração: enquanto o banco não está ligado, salvar mostra o
 *                 aviso, e não finge gravar.
 */

import { DEMO_TICKETS, DEMO_WHATSAPP_CONFIG } from './demo';
import type { Ticket, WhatsAppConfig } from './types';

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/** O resultado de uma leitura. */
export interface WhatsAppReadResult<T> {
  data: T;
  source: 'demo';
  reason?: string;
}

/** O resultado de uma escrita — o mesmo envelope dos outros módulos. */
export interface WhatsAppWriteResult {
  data: WhatsAppConfig;
  /** Sempre `false` enquanto o Neon não está ligado. */
  persisted: false;
  reason: string;
}

/**
 * OS ATENDIMENTOS — a leitura da aba `Atendimentos`.
 *
 * Devolve as linhas JÁ ORDENADAS por data (mais recente primeiro), como o banco
 * as devolverá. A tela filtra por status, mas não reordena — a ordem é da leitura.
 *
 * Copia o array (`[...]`) para a tela não mutar a demonstração global.
 */
export async function listTickets(): Promise<WhatsAppReadResult<Ticket[]>> {
  return {
    data: [...DEMO_TICKETS],
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * A CONFIGURAÇÃO — a leitura da aba `Configurações`.
 *
 * Devolve uma cópia PROFUNDA dos `templates`: o admin edita os textos, e cada
 * edição mutaria o objeto da demonstração se ele fosse devolvido por referência —
 * o texto voltaria editado na próxima abertura da tela, mesmo sem salvar.
 */
export async function getConfig(): Promise<WhatsAppReadResult<WhatsAppConfig>> {
  return {
    data: {
      ...DEMO_WHATSAPP_CONFIG,
      templates: DEMO_WHATSAPP_CONFIG.templates.map((template) => ({ ...template })),
    },
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * SALVAR A CONFIGURAÇÃO — a escrita da aba.
 *
 * NÃO grava nada: o banco não está ligado. Devolve `persisted: false` e o motivo,
 * e a tela mostra o aviso em vez de fingir um "salvo com sucesso". O objeto
 * devolvido é o que o admin editou, para a tela poder refletir o que foi enviado
 * sem uma segunda leitura — mas marcado como NÃO persistido.
 */
export async function saveConfig(config: WhatsAppConfig): Promise<WhatsAppWriteResult> {
  return {
    data: config,
    persisted: false,
    reason: PENDING_REASON,
  };
}

export { PENDING_REASON };
