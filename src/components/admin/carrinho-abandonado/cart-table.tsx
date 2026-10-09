import { ShoppingCart } from 'lucide-react';
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
import type { AbandonedCart, CartStatus } from '@/lib/carrinho-abandonado/types';
import { formatBRL } from '@/lib/utils';

/**
 * A tabela `Historico de Carrinhos` — adm-008.
 *
 * CINCO COLUNAS, NA ORDEM DO PRINT:
 *   CLIENTE / EMAIL · VALOR · NOTIFICACOES · ULTIMO ENVIO · STATUS
 *
 * AS DUAS LINHAS DA COLUNA CLIENTE, e o texto exato do vazio.
 *
 * O print mostra `Visitante` em cima e, embaixo, ou o e-mail ou as palavras
 * `Nao identificado`. Essas duas palavras NAO sao dado — sao o que o original
 * escreve quando `contact_email` e nulo (`c.contact_email || "Não identificado"`).
 * Por isso elas sao compostas AQUI, na tela, e nao gravadas no registro: se
 * estivessem no dado, um carrinho identificado hoje carregaria o texto de
 * "nao identificado" para sempre.
 *
 * O `—` DA COLUNA ULTIMO ENVIO e o mesmo caso: `lastNotifiedAt` nulo vira
 * travessao, e nao "nunca" nem uma data inventada.
 *
 * O STATUS E UMA PILULA, e o print tem os tres estados possiveis mesmo mostrando
 * so um: as tres linhas sao `PENDENTE` em ambar. As outras duas cores (verde
 * para recuperado, rosa para perdido) sao as do original e entram pelo mesmo
 * mapa — nao sao um "a mais" inventado, sao o estado que o KPI `Recuperados`
 * conta quando ele deixa de ser zero.
 */
const STATUS_LABELS: Record<CartStatus, string> = {
  pendente: 'Pendente',
  recuperado: 'Recuperado',
  perdido: 'Perdido',
};

const STATUS_TONES: Record<CartStatus, string> = {
  pendente: 'bg-warning-surface text-warning-foreground',
  recuperado: 'bg-success-surface text-success-foreground',
  perdido: 'bg-danger-surface text-danger-foreground',
};

export function CartTable({ rows }: { rows: AbandonedCart[] }) {
  return (
    <TableWrap>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Cliente / Email</TableHeaderCell>
            <TableHeaderCell align="right">Valor</TableHeaderCell>
            <TableHeaderCell align="center">Notificações</TableHeaderCell>
            <TableHeaderCell align="center">Último Envio</TableHeaderCell>
            <TableHeaderCell align="center">Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={5}
              icon={ShoppingCart}
              title="Nenhum carrinho abandonado registrado."
            />
          ) : (
            rows.map((cart) => (
              <TableRow key={cart.id}>
                <TableCell>
                  <div className="flex flex-col leading-tight">
                    <span className="font-medium">{cart.contactName || 'Visitante'}</span>
                    <span className="text-xs text-muted-foreground">
                      {cart.contactEmail || 'Não identificado'}
                    </span>
                  </div>
                </TableCell>
                <TableCell align="right" className="tabular-nums">
                  {formatBRL(cart.subtotal)}
                </TableCell>
                <TableCell align="center" className="tabular-nums">
                  {cart.notificationCount}
                </TableCell>
                <TableCell align="center" className="text-xs text-muted-foreground">
                  {cart.lastNotifiedAt ? formatDateShort(cart.lastNotifiedAt) : '—'}
                </TableCell>
                <TableCell align="center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${STATUS_TONES[cart.status]}`}
                  >
                    {STATUS_LABELS[cart.status]}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableWrap>
  );
}

/**
 * A data do ULTIMO ENVIO, sem hora.
 *
 * A coluna mostra `—` neste print, entao nao ha formato confirmado para ela. A
 * escolha foi `dd/mm/aaaa`: e a mesma da coluna ULTIMA COMPRA do CRM, que tem
 * print, e manter a mesma forma nas duas telas evita duas datas diferentes no
 * mesmo painel. Se o formato de hora aparecer numa referencia futura, muda aqui
 * — a funcao existe isolada justamente para isso.
 */
function formatDateShort(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}
