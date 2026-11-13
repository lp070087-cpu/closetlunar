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
import { lerModulo, gravarModulo } from '@/lib/data/modulo';

const PENDING_REASON = 'Não foi possível salvar agora. Tente novamente.';

export interface WhatsAppReadResult<T> {
  data: T;
  source: 'demo' | 'database';
  reason?: string;
}

export interface WhatsAppWriteResult {
  data: WhatsAppConfig;
  persisted: boolean;
  reason?: string;
}

export async function listTickets(): Promise<WhatsAppReadResult<Ticket[]>> {
  return lerModulo<Ticket[]>('atendimento:tickets', [...DEMO_TICKETS], []);
}

export async function getConfig(): Promise<WhatsAppReadResult<WhatsAppConfig>> {
  const padrao = { ...DEMO_WHATSAPP_CONFIG, templates: DEMO_WHATSAPP_CONFIG.templates.map((t) => ({ ...t })) };
  return lerModulo<WhatsAppConfig>('whatsapp:config', padrao, padrao);
}

export async function saveConfig(config: WhatsAppConfig): Promise<WhatsAppWriteResult> {
  const r = await gravarModulo('whatsapp:config', config);
  return { data: config, persisted: r.persisted, reason: r.persisted ? undefined : r.reason ?? PENDING_REASON };
}

export { PENDING_REASON };
