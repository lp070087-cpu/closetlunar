/**
 * A camada de dados de Segurança & Backup — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda: o
 * original lê três tabelas (ver o cabeçalho de cada função).
 */

import { DEMO_AUDIT_LOGS, DEMO_BACKUPS, DEMO_SECURITY_STATE } from './demo';
import type { AuditLogRow, BackupRow, SecurityState } from './types';
import { auditoriaAcao } from '@/lib/data/registros-acoes';

const PENDING_REASON =
  'Os backups são automáticos no Neon (restauração para qualquer momento das últimas 6 horas). Para uma cópia extra, use o painel do Neon.';

export async function listAuditLogs(): Promise<{ data: AuditLogRow[]; source: 'demo' | 'database'; reason?: string }> {
  const reais = await auditoriaAcao();
  if (reais) return { data: reais, source: 'database' };
  return { data: DEMO_AUDIT_LOGS.map((l) => ({ ...l })), source: 'demo' };
}

export async function listBackups(): Promise<{ data: BackupRow[]; source: 'demo' | 'database'; reason?: string }> {
  const reais = await auditoriaAcao();
  if (reais) return { data: [], source: 'database', reason: PENDING_REASON };
  return { data: DEMO_BACKUPS.map((l) => ({ ...l })), source: 'demo' };
}

export async function getSecurityState(): Promise<{ data: SecurityState; source: 'demo' | 'database'; reason?: string }> {
  return { data: { ...DEMO_SECURITY_STATE }, source: 'database' };
}

export async function requestBackup(): Promise<{ persisted: boolean; reason?: string }> {
  return { persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
