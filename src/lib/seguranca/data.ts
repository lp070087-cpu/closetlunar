/**
 * A camada de dados de Segurança & Backup — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda: o
 * original lê três tabelas (ver o cabeçalho de cada função).
 */

import { DEMO_AUDIT_LOGS, DEMO_BACKUPS, DEMO_SECURITY_STATE } from './demo';
import type { AuditLogRow, BackupRow, SecurityState } from './types';

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * Os dez últimos logs de auditoria, mais recente primeiro.
 *
 * FUTURO (Neon): `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`.
 */
export async function listAuditLogs(): Promise<{
  data: AuditLogRow[];
  source: 'demo';
  reason: string;
}> {
  return { data: DEMO_AUDIT_LOGS.map((linha) => ({ ...linha })), source: 'demo', reason: PENDING_REASON };
}

/**
 * Os cinco últimos backups, mais recente primeiro. Na demonstração é VAZIO — e é
 * por isso que o cartão do topo diz `Pendente`, como no print.
 *
 * FUTURO (Neon): `SELECT * FROM backups ORDER BY created_at DESC LIMIT 5`.
 */
export async function listBackups(): Promise<{
  data: BackupRow[];
  source: 'demo';
  reason: string;
}> {
  return { data: DEMO_BACKUPS.map((linha) => ({ ...linha })), source: 'demo', reason: PENDING_REASON };
}

/**
 * O estado do sistema — o limite de tentativas de login e o rótulo do último
 * backup.
 *
 * FUTURO (Neon): `SELECT key, value FROM security_config`, montado em objeto como
 * o original faz; o limite sai de `rate_limit.login_attempts`, com 5 de padrão.
 */
export async function getSecurityState(): Promise<{
  data: SecurityState;
  source: 'demo';
  reason: string;
}> {
  return { data: { ...DEMO_SECURITY_STATE }, source: 'demo', reason: PENDING_REASON };
}

/**
 * O pedido de backup.
 *
 * NÃO grava e NÃO finge que gravou: devolve `persisted: false` com o motivo. O
 * original chama `triggerBackup('database')` e mostra um toast de sucesso — mas
 * isso escreve numa tabela que não existe. Inventar um "backup enviado" seria
 * mentir sobre uma operação de segurança, que é o pior lugar para isso.
 *
 * FUTURO (Neon): insere `backups (type='database', status='pending')` e devolve o
 * id; a tela recarrega a lista e a linha nova aparece sozinha.
 */
export async function requestBackup(): Promise<{
  persisted: false;
  reason: string;
}> {
  return { persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
