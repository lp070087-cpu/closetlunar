'use client';

import { useEffect, useState } from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSecurityState, listAuditLogs, listBackups, requestBackup } from '@/lib/seguranca/data';
import {
  DEFAULT_LOGIN_ATTEMPT_LIMIT,
  LAST_BACKUP_CARD,
  LAST_BACKUP_PENDING,
  PAGE_TITLE,
  RUN_BACKUP_LABEL,
  lastBackupValue,
} from '@/lib/seguranca/metrics';
import type { AuditLogRow, BackupRow, SecurityState } from '@/lib/seguranca/types';
import { LastBackupCard, LoginAttemptsCard, SystemStatusCard } from './security-cards';
import { AuditLogsCard, BackupHistoryCard } from './security-tables';

/**
 * A tela de Segurança & Backup (`/admin/seguranca`) — adm-086.
 *
 * ================== O BOTÃO NÃO FINGE QUE DEU CERTO ==================
 *
 * O original chama `triggerBackup('database')` e mostra o toast
 * "Solicitação de backup enviada com sucesso!". Isso insere uma linha numa tabela
 * `backups` que ainda não existe — e um backup é justamente a operação em que
 * mentir é pior. Aqui o clique NÃO inventa sucesso: ele escreve o motivo real
 * (a persistência ainda não está conectada) na linha abaixo do cabeçalho, com
 * `role="status"` para o leitor de tela anunciar. Quando o Neon entrar, é só
 * trocar a chamada e recarregar a lista.
 *
 * ================== O CABEÇALHO TEM UM ESCUDO À ESQUERDA ==================
 *
 * O print põe o ícone `Shield` ANTES do título serifado. O `SectionHeader` do
 * projeto não tem ícone à esquerda, e passá-lo como `action` o jogaria para a
 * direita, junto do botão. Por isso este cabeçalho é local — mesma tipografia do
 * `SectionHeader` (`font-serif text-2xl sm:text-3xl`), com um escudo na frente.
 */
export function SegurancaView() {
  const [logs, setLogs] = useState<AuditLogRow[] | null>(null);
  const [backups, setBackups] = useState<BackupRow[] | null>(null);
  const [state, setState] = useState<SecurityState | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    Promise.all([listAuditLogs(), listBackups(), getSecurityState()]).then(([l, b, s]) => {
      if (!vivo) return;
      setLogs(l.data);
      setBackups(b.data);
      setState(s.data);
    });
    return () => {
      vivo = false;
    };
  }, []);

  async function executarBackup() {
    const resultado = await requestBackup();
    setAviso(resultado.reason);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <ShieldCheck className="size-6 shrink-0" aria-hidden />
          <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">{PAGE_TITLE}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="primary" size="md" onClick={executarBackup}>
            <Database className="size-4" aria-hidden />
            {RUN_BACKUP_LABEL}
          </Button>
        </div>
      </header>

      {aviso ? (
        <p role="status" className="text-sm font-medium text-muted-foreground">
          {aviso}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SystemStatusCard />
        <LoginAttemptsCard limit={state?.loginAttemptLimit ?? DEFAULT_LOGIN_ATTEMPT_LIMIT} />
        <LastBackupCard
          value={
            backups === null
              ? '—'
              : lastBackupValue(backups, LAST_BACKUP_PENDING)
          }
          badge={LAST_BACKUP_CARD.scheduleLabel}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AuditLogsCard logs={logs ?? []} loading={logs === null} />
        <BackupHistoryCard backups={backups ?? []} />
      </div>
    </div>
  );
}
