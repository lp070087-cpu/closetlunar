/**
 * A demonstração de Segurança & Backup.
 *
 * ================== O LOG É REAL, O BACKUP ESTÁ VAZIO ==================
 *
 * O print adm-086 mostra as duas tabelas com conteúdos OPOSTOS, e a demonstração
 * copia os dois:
 *
 *   Logs de Auditoria Recentes   DEZ linhas preenchidas — os dez logins/logouts com
 *                                data e hora exatas que a captura mostra.
 *   Histórico de Backups         VAZIO, só o cabeçalho. Nenhum backup foi feito
 *                                ainda, e é justamente por isso que o cartão do
 *                                topo diz `Pendente`.
 *
 * Preencher o histórico "para ficar bonito" seria inventar dado que o print nega.
 *
 * ================== O ESTADO ==================
 *
 * `loginAttemptLimit` é 5 porque o print mostra `5 Limite`, e 5 é o padrão do
 * original quando `security_config` não tem a chave. `lastBackupLabel` é `Pendente`
 * pela MESMA razão do histórico vazio.
 *
 * `security_config` NÃO tem valor na demonstração: é uma tabela de
 * chave/valor em que só o limite aparece na tela, e ele já está representado pelo
 * campo acima. Guardar a tabela inteira seria copiar dado que ninguém desenha.
 */

import type { AuditLogRow, BackupRow, SecurityState } from './types';

/**
 * As dez linhas do print, na ordem — mais recente primeiro.
 *
 * Os instantes vêm com o fuso explícito (`-03:00`) porque é assim que o banco os
 * devolve para um evento ocorrido em Brasília. Escrever `27/09/2026, 23:26:00`
 * pronto aqui esconderia a conversão de fuso atrás de texto fixo.
 */
export const DEMO_AUDIT_LOGS: AuditLogRow[] = [
  { id: 'log-01', action: 'Login de cliente', createdAt: '2026-09-27T23:26:00-03:00' },
  { id: 'log-02', action: 'Login de cliente', createdAt: '2026-09-27T23:25:41-03:00' },
  { id: 'log-03', action: 'Login de cliente', createdAt: '2026-09-27T23:23:01-03:00' },
  { id: 'log-04', action: 'Login administrativo realizado', createdAt: '2026-09-27T23:11:03-03:00' },
  { id: 'log-05', action: 'Login de cliente', createdAt: '2026-09-27T23:11:02-03:00' },
  { id: 'log-06', action: 'Login administrativo realizado', createdAt: '2026-09-27T23:07:48-03:00' },
  { id: 'log-07', action: 'Login de cliente', createdAt: '2026-09-27T23:07:48-03:00' },
  { id: 'log-08', action: 'Logout de cliente', createdAt: '2026-09-27T23:07:19-03:00' },
  { id: 'log-09', action: 'Login de cliente', createdAt: '2026-09-27T23:07:05-03:00' },
  { id: 'log-10', action: 'Login administrativo realizado', createdAt: '2026-09-27T22:56:50-03:00' },
];

/** VAZIO — o print mostra a tabela sem nenhuma linha. */
export const DEMO_BACKUPS: BackupRow[] = [];

export const DEMO_SECURITY_STATE: SecurityState = {
  loginAttemptLimit: 5,
};
