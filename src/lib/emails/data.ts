/**
 * A camada de dados de E-mails — o ÚNICO ponto de contato com os dados.
 *
 * Duas leituras (modelos + identidade, e o histórico) e uma escrita (salvar um
 * modelo). Nada aqui toca banco: não há `prisma`, não há `DATABASE_URL`.
 *
 * ================== O QUE O BANCO VAI FAZER ==================
 *
 *   MODELOS    `transactional_email_templates`, ordenado por `name` — a mesma
 *              ordem que o original usa. As colunas são `name`, `subject`,
 *              `body_html`, `active`, `updated_at`.
 *
 *   IDENTIDADE o original lê a cor e o logo da linha `settings` (`store`) e passa
 *              junto. Aqui é uma leitura própria, que na integração sai desse
 *              mesmo objeto de configurações.
 *
 *   HISTÓRICO  `email_logs`, ordenado por `sent_at` decrescente, limitado a 20 —
 *              o `Envios Recentes`.
 *
 *   ESCRITA    `update` do modelo (assunto, corpo, ativo, `updated_at`). Devolve o
 *              envelope `persisted: false` + motivo, e NÃO altera a demonstração.
 */

import { DEMO_EMAIL_IDENTITY, DEMO_EMAIL_LOGS, DEMO_EMAIL_TEMPLATES } from './demo';
import type { EmailIdentity, EmailLog, EmailTemplate } from './types';

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/** O resultado de uma leitura. */
export interface EmailsReadResult<T> {
  data: T;
  source: 'demo';
  reason?: string;
}

/** O resultado de uma escrita — o mesmo envelope dos outros módulos. */
export interface EmailsWriteResult {
  data: EmailTemplate;
  /** Sempre `false` enquanto o Neon não está ligado. */
  persisted: false;
  reason: string;
}

/**
 * OS SEIS MODELOS + A IDENTIDADE — a leitura da tela.
 *
 * Devolve cópias: o admin edita um modelo na tela, e a lista da demonstração não
 * pode ser mutada por essa edição (o texto voltaria editado na próxima abertura,
 * mesmo sem salvar). São dois arrays novos e um objeto de identidade novo.
 */
export async function listTemplates(): Promise<EmailsReadResult<EmailTemplate[]>> {
  return {
    data: DEMO_EMAIL_TEMPLATES.map((template) => ({ ...template })),
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/** A IDENTIDADE VISUAL — o painel escuro. Uma leitura separada. */
export async function getIdentity(): Promise<EmailsReadResult<EmailIdentity>> {
  return {
    data: { ...DEMO_EMAIL_IDENTITY },
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/** OS ENVIOS RECENTES — VAZIOS, como o print. */
export async function listEmailLogs(): Promise<EmailsReadResult<EmailLog[]>> {
  return {
    data: DEMO_EMAIL_LOGS.map((log) => ({ ...log })),
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * SALVAR UM MODELO — a escrita do editor.
 *
 * NÃO grava nada: o banco não está ligado. Devolve `persisted: false` e o motivo,
 * e a tela mostra o aviso em vez de fingir um "template atualizado". O objeto
 * devolvido é o que o admin editou, para a tela refletir o que foi enviado.
 */
export async function saveTemplate(template: EmailTemplate): Promise<EmailsWriteResult> {
  return {
    data: { ...template },
    persisted: false,
    reason: PENDING_REASON,
  };
}

export { PENDING_REASON };
