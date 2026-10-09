import { AlertTriangle, Activity, CheckCircle, Clock, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import {
  AUDIT_EMPTY_TEXT,
  AUDIT_TABLE,
  BACKUPS_TABLE,
  backupStatusLabel,
  backupTone,
  backupTypeLabel,
  formatDateBR,
  formatDateTimeBR,
} from '@/lib/seguranca/metrics';
import type { AuditLogRow, BackupRow } from '@/lib/seguranca/types';

/**
 * As duas tabelas de Segurança & Backup (adm-086), lado a lado.
 *
 * ================== A ASSIMETRIA DO PRIMEIRO X DO SEGUNDO ==================
 *
 * O print trata os dois vazios de forma DIFERENTE, e a diferença foi preservada:
 *
 *   Logs de Auditoria   o original escreve a frase `Nenhum log registrado` quando
 *                       a lista está vazia. A frase existe e está aqui.
 *   Histórico de Backups  o original NÃO tem frase nenhuma — a tabela sai só com
 *                       o cabeçalho e o corpo vazio. É exatamente o que o print
 *                       mostra. Não é esquecimento: é como o original é.
 *
 * "Consertar" a simetria inventando um vazio na segunda tabela seria desenhar uma
 * frase que nenhum pixel mostra.
 */

/**
 * A tabela de logs: duas colunas, uma frase de vazio.
 *
 * ================== `loading` SEPARA "AINDA NÃO CHEGOU" DE "NÃO TEM" ==================
 *
 * Sem o `loading`, a tabela recebia `logs ?? []` e desenhava `Nenhum log
 * registrado` no primeiro quadro — ANTES de a leitura chegar. Isso afirma um fato
 * falso ("não há nenhum log") com base só na ausência de resposta. Com o
 * `loading`, o estado vazio fica reservado para quando a leitura JÁ respondeu e
 * a resposta foi mesmo uma lista vazia, como manda a regra do projeto de não
 * confundir estado vazio legítimo com tela por fazer.
 */
export function AuditLogsCard({ logs, loading = false }: { logs: AuditLogRow[]; loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5" aria-hidden />
          {AUDIT_TABLE.title}
        </CardTitle>
        <CardDescription>{AUDIT_TABLE.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <TableWrap>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{AUDIT_TABLE.columns[0]}</TableHeaderCell>
                <TableHeaderCell>{AUDIT_TABLE.columns[1]}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell className="text-xs">{formatDateTimeBR(log.createdAt)}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center text-sm text-muted-foreground">
                    {AUDIT_EMPTY_TEXT}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableWrap>
      </CardContent>
    </Card>
  );
}

/**
 * A tabela de backups: três colunas, SEM frase de vazio. Um backup `completed` sai
 * em selo verde com visto; `pending` em selo de contorno com relógio; e qualquer
 * outro status vira falha, com o triângulo.
 */
export function BackupHistoryCard({ backups }: { backups: BackupRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="size-5" aria-hidden />
          {BACKUPS_TABLE.title}
        </CardTitle>
        <CardDescription>{BACKUPS_TABLE.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <TableWrap>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{BACKUPS_TABLE.columns[0]}</TableHeaderCell>
                <TableHeaderCell>{BACKUPS_TABLE.columns[1]}</TableHeaderCell>
                <TableHeaderCell>{BACKUPS_TABLE.columns[2]}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backups.map((backup) => {
                const tom = backupTone(backup.status);
                return (
                  <TableRow key={backup.id}>
                    <TableCell className="capitalize">{backupTypeLabel(backup.type)}</TableCell>
                    <TableCell>
                      {tom === 'success' ? (
                        <Badge variant="success" size="sm" className="normal-case tracking-normal">
                          <CheckCircle className="size-3" aria-hidden />
                          {backupStatusLabel(backup.status)}
                        </Badge>
                      ) : tom === 'pending' ? (
                        <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                          <Clock className="size-3" aria-hidden />
                          {backupStatusLabel(backup.status)}
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm" className="normal-case tracking-normal">
                          <AlertTriangle className="size-3" aria-hidden />
                          {backupStatusLabel(backup.status)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{formatDateBR(backup.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrap>
      </CardContent>
    </Card>
  );
}
