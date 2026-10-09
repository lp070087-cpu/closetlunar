import { Mail, MessageCircle, UserPlus } from 'lucide-react';
import { EmptyRow } from '@/components/ui/states';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { LEAD_ACTIONS, mailtoLeadUrl, whatsappLeadUrl } from '@/lib/crm/actions';
import { formatDateTimeShort } from '@/lib/crm/helpers';
import type { CrmLead } from '@/lib/crm/types';

/**
 * A tabela da aba `Leads` — adm-010.
 *
 * CINCO COLUNAS, NA ORDEM DO PRINT:
 *   NOME / IDENTIFICACAO · CONTATO · ORIGEM · DATA · ACOES
 *
 * TRES DETALHES QUE VAO CONTRA O PADRAO — e que o print manda guardar:
 *
 *   1. A coluna CONTATO tem as DUAS linhas de contato, e nao uma: e-mail em
 *      cima e WhatsApp embaixo, em cinza. A linha do WhatsApp so aparece quando
 *      existe. Colapsar em uma linha ("e-mail · whatsapp") seria reescrever a
 *      celula que o print desenhou.
 *
 *   2. A ORIGEM e uma PILULA em caixa alta, com o texto CRU do codigo de origem
 *      (`CARRINHO_ABANDONADO`, com underline) — e nao uma frase bonita. E um
 *      vazamento do nome tecnico para a interface, e esta no print exatamente
 *      assim. "Corrigir" para "Carrinho abandonado" seria inventar.
 *
 *   3. DATA mostra data E hora (`13/06/2026, 00:31`) — e a unica coluna do CRM
 *      com hora. Em Clientes, a ULTIMA COMPRA mostra so a data. Os dois prints
 *      diferem e os dois foram respeitados: `formatDate` la, `formatDateTime`
 *      aqui.
 *
 * AS ACOES sao duas, as duas de URL, e as duas obedecem ao DADO: sem WhatsApp
 * nao ha icone de conversa, que e o comportamento do original. Ver
 * `lib/crm/actions.ts` — inclusive para a mensagem pre-preenchida.
 */
export function LeadsTable({
  rows,
  hasFilter,
}: {
  rows: CrmLead[];
  /** `true` quando ha busca ativa — muda o texto do vazio. */
  hasFilter: boolean;
}) {
  const mailAction = LEAD_ACTIONS.find((item) => item.label === 'Enviar e-mail');
  const whatsappAction = LEAD_ACTIONS.find((item) => item.label === 'Conversar no WhatsApp');

  return (
    <TableWrap>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nome / Identificação</TableHeaderCell>
            <TableHeaderCell>Contato</TableHeaderCell>
            <TableHeaderCell>Origem</TableHeaderCell>
            <TableHeaderCell align="right">Data</TableHeaderCell>
            <TableHeaderCell align="right">Ações</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={5}
              icon={UserPlus}
              title={hasFilter ? 'Nenhum lead encontrado para essa busca.' : 'Nenhum lead registrado.'}
            />
          ) : (
            rows.map((lead) => {
              const mailUrl = mailtoLeadUrl(lead.email);
              const whatsUrl = whatsappLeadUrl(lead.whatsapp, lead.name);

              return (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col leading-tight">
                      {lead.email ? <span className="text-xs">{lead.email}</span> : null}
                      {lead.whatsapp ? (
                        <span className="text-xs text-muted-foreground">{lead.whatsapp}</span>
                      ) : null}
                      {!lead.email && !lead.whatsapp ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {lead.source}
                    </span>
                  </TableCell>
                  <TableCell align="right" className="text-xs text-muted-foreground tabular-nums">
                    {formatDateTimeShort(lead.createdAt)}
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex justify-end gap-2">
                      {whatsUrl && whatsappAction ? (
                        <a
                          href={whatsUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={whatsappAction.label}
                          aria-label={whatsappAction.label}
                          className="focus-ring grid size-8 place-items-center rounded-lg text-success-foreground transition-colors hover:bg-secondary"
                        >
                          <MessageCircle className="size-4" aria-hidden />
                        </a>
                      ) : null}
                      {mailUrl && mailAction ? (
                        <a
                          href={mailUrl}
                          title={mailAction.label}
                          aria-label={mailAction.label}
                          className="focus-ring grid size-8 place-items-center rounded-lg text-accent transition-colors hover:bg-secondary"
                        >
                          <Mail className="size-4" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableWrap>
  );
}
