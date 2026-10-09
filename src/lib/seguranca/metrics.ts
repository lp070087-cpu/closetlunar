/**
 * As medidas de Segurança & Backup — funções PURAS, sem React, sem I/O, sem
 * `Date.now()` e sem `Math.random()`. Tudo aqui pode ser provado por bancada.
 *
 * ================== O FUSO É CALCULADO, NÃO HERDADO ==================
 *
 * O original escreve `new Date(log.created_at).toLocaleString()`, que formata no
 * fuso da MÁQUINA. Isso é uma armadilha conhecida: uma data ISO sem fuso
 * (`2026-09-27`) é lida como MEIA-NOITE UTC, e num fuso -03:00 ela volta para o
 * dia anterior. O print mostra `27/09/2026, 23:26:00` — o dia 27, não o 26.
 *
 * Por isso `formatDateTimeBR` calcula o deslocamento de Brasília por conta própria
 * e lê os componentes em UTC. O resultado não depende do fuso de quem roda.
 */

import type { BackupRow } from './types';

/** O deslocamento de Brasília em milissegundos. */
const BR_OFFSET_MS = 3 * 60 * 60 * 1000;

const dois = (n: number) => String(n).padStart(2, '0');

/**
 * Formata um instante ISO como `27/09/2026, 23:26:00` no horário de Brasília.
 *
 * Aceita tanto `2026-09-27T23:26:00-03:00` quanto `2026-09-27` (que é lida como
 * meia-noite UTC por `Date.parse`). O recuo de três horas é aplicado SEMPRE, e os
 * componentes são lidos em UTC — o fuso do computador não entra na conta.
 */
export function formatDateTimeBR(iso: string): string {
  const instante = Date.parse(iso);
  if (Number.isNaN(instante)) return '';
  const d = new Date(instante - BR_OFFSET_MS);
  return (
    `${dois(d.getUTCDate())}/${dois(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}` +
    `, ${dois(d.getUTCHours())}:${dois(d.getUTCMinutes())}:${dois(d.getUTCSeconds())}`
  );
}

/** Só a data, como o `Histórico de Backups` escreve. */
export function formatDateBR(iso: string): string {
  const instante = Date.parse(iso);
  if (Number.isNaN(instante)) return '';
  const d = new Date(instante - BR_OFFSET_MS);
  return `${dois(d.getUTCDate())}/${dois(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/* ====================== os três cartões ====================== */

/** Os rótulos fixos do print. Não são dados: são a tela. */
export const SYSTEM_STATUS_CARD = {
  label: 'Status do Sistema',
  value: 'Protegido',
  hint: 'Monitoramento ativo em tempo real',
} as const;

export const LOGIN_ATTEMPTS_CARD = {
  label: 'Tentativas de Login',
  hint: 'Bloqueio automático após o limite',
} as const;

/**
 * ================== DOIS RÓTULOS SÃO TELA, NÃO DADO ==================
 *
 * `Pendente` e `Automático Diário` parecem vir do banco, mas não vêm: o
 * `Automático Diário` é o selo FIXO do cartão, e o `Pendente` é o que se escreve
 * quando não existe backup nenhum. Nenhum dos dois muda com o conteúdo da tabela.
 * Deixá-los dentro de `SecurityState` faria a demonstração fingir que são dados
 * lidos — e pior, faria o primeiro desenho da tela (antes de a leitura chegar)
 * mostrar um traço em vez do que o print mostra.
 *
 * O único valor que REALMENTE vem de `security_config` é o limite de tentativas.
 * É ele, e só ele, que viaja no estado.
 */
export const LAST_BACKUP_CARD = {
  label: 'Último Backup',
  /** O selo fixo ao lado do valor. */
  scheduleLabel: 'Automático Diário',
} as const;

/** O que se escreve quando não existe nenhum backup — a palavra do print. */
export const LAST_BACKUP_PENDING = 'Pendente';

/** O padrão do original quando `security_config` está vazio. */
export const DEFAULT_LOGIN_ATTEMPT_LIMIT = 5;

/**
 * `5 Limite` — o número e a palavra colados, como o print escreve.
 * Uma tentativa só vira `1 Limite`, no singular, porque a palavra não muda.
 */
export function loginAttemptsValue(limit: number): string {
  return `${limit} Limite`;
}

/** O valor do cartão do último backup: a data do mais recente, ou `Pendente`. */
export function lastBackupValue(backups: BackupRow[], fallback: string): string {
  return backups.length > 0 ? formatDateBR(backups[0].createdAt) : fallback;
}

/* ====================== o histórico de backups ====================== */

/** `automatico` → `Automatico` — o `capitalize` do original. */
export function backupTypeLabel(type: string): string {
  if (type === '') return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export type BackupTone = 'success' | 'pending' | 'failure';

/**
 * Três desfechos, como o original: `completed` é sucesso, `pending` é pendente e
 * QUALQUER outra coisa é falha. Não existe um quarto estado.
 */
export function backupTone(status: string): BackupTone {
  if (status === 'completed') return 'success';
  if (status === 'pending') return 'pending';
  return 'failure';
}

const BACKUP_LABELS: Record<BackupTone, string> = {
  success: 'Sucesso',
  pending: 'Pendente',
  failure: 'Falha',
};

export function backupStatusLabel(status: string): string {
  return BACKUP_LABELS[backupTone(status)];
}

/* ====================== os vazios ====================== */

/** O vazio do log — o original tem esta frase. */
export const AUDIT_EMPTY_TEXT = 'Nenhum log registrado';

/**
 * O histórico de backups NÃO tem frase de vazio, nem no print nem no original: a
 * tabela simplesmente aparece só com o cabeçalho. Está aqui registrado para que
 * ninguém "conserte" a assimetria achando que é esquecimento.
 */
export const BACKUPS_HAVE_NO_EMPTY_TEXT = true;

/* ====================== os títulos das duas tabelas ====================== */

export const AUDIT_TABLE = {
  title: 'Logs de Auditoria Recentes',
  description: 'Monitoramento de ações administrativas e acessos',
  columns: ['Ação', 'Data/Hora'],
} as const;

export const BACKUPS_TABLE = {
  title: 'Histórico de Backups',
  description: 'Registro de salvamentos automáticos e manuais',
  columns: ['Tipo', 'Status', 'Data'],
} as const;

/** O botão do cabeçalho. */
export const RUN_BACKUP_LABEL = 'Executar Backup Agora';

/** O título da tela — `e`, não `&`, como o print escreve. */
export const PAGE_TITLE = 'Segurança e Backup';
