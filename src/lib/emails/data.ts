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
import { lerModulo, gravarModulo, salvarItem } from '@/lib/data/modulo';
import { emailsEnviadosAcao } from '@/lib/data/registros-acoes';

const PENDING_REASON = 'Não foi possível salvar agora. Tente novamente.';

export interface EmailsReadResult<T> {
  data: T;
  source: 'demo' | 'database';
  reason?: string;
}

export interface EmailsWriteResult {
  data: EmailTemplate;
  persisted: boolean;
  reason?: string;
}

export async function listTemplates(): Promise<EmailsReadResult<EmailTemplate[]>> {
  const padrao = DEMO_EMAIL_TEMPLATES.map((t) => ({ ...t }));
  return lerModulo<EmailTemplate[]>('emails:modelos', padrao, padrao);
}

export async function getIdentity(): Promise<EmailsReadResult<EmailIdentity>> {
  return lerModulo<EmailIdentity>('emails:identidade', { ...DEMO_EMAIL_IDENTITY }, { ...DEMO_EMAIL_IDENTITY });
}

export async function listEmailLogs(): Promise<EmailsReadResult<EmailLog[]>> {
  const reais = await emailsEnviadosAcao();
  if (reais) return { data: reais, source: 'database' };
  return { data: DEMO_EMAIL_LOGS.map((l) => ({ ...l })), source: 'demo' };
}

export async function saveTemplate(template: EmailTemplate): Promise<EmailsWriteResult> {
  const atual = (await listTemplates()).data;
  const r = await salvarItem('emails:modelos', atual, template);
  void gravarModulo;
  return { data: { ...template }, persisted: r.persisted, reason: r.persisted ? undefined : r.reason ?? PENDING_REASON };
}

export { PENDING_REASON };
