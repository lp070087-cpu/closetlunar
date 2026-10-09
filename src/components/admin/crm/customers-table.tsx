import { ChevronRight, Users } from 'lucide-react';
import { EmptyRow } from '@/components/ui/states';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TablePrimaryCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { CUSTOMER_ACTIONS } from '@/lib/crm/actions';
import type { CrmCustomer } from '@/lib/crm/types';
import { formatBRL, formatDate } from '@/lib/utils';

/**
 * A tabela da aba `Clientes` — adm-005.
 *
 * SEIS COLUNAS, NA ORDEM DO PRINT:
 *   CLIENTE · LOCALIZACAO · PEDIDOS · TOTAL INVESTIDO · ULTIMA COMPRA · ACOES
 *
 * Duas particularidades do print que o componente respeita:
 *
 *   1. CLIENTE tem DUAS linhas — nome em serifada e, abaixo, o e-mail em
 *      cinza. Por isso `TablePrimaryCell`, e nao uma celula simples. A segunda
 *      linha so existe quando ha e-mail: no material, os pedidos reais nao tem
 *      e-mail nenhum, e um `null` virando "—" seria ruido que o print nao tem.
 *
 *   2. ACOES e `Ver Perfil ›` em TEXTO, e nao um botao — inclinado para a
 *      direita, sem caixa. Vem de `CUSTOMER_ACTIONS`, que o declara
 *      INDISPONIVEL: o destino nao tem print. Ver `lib/crm/actions.ts`.
 *
 * O alinhamento segue o original: PEDIDOS ao centro, valores e datas a direita,
 * texto a esquerda. E o que o print mostra, e misturar isso deixaria a coluna
 * numerica flutuando.
 */
export function CustomersTable({
  rows,
  hasFilter,
  onSelect,
}: {
  rows: CrmCustomer[];
  /** `true` quando ha busca ativa — muda o texto do vazio. */
  hasFilter: boolean;
  onSelect: (customer: CrmCustomer) => void;
}) {
  const action = CUSTOMER_ACTIONS[0];

  return (
    <TableWrap>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Cliente</TableHeaderCell>
            <TableHeaderCell>Localização</TableHeaderCell>
            <TableHeaderCell align="center">Pedidos</TableHeaderCell>
            <TableHeaderCell align="right">Total Investido</TableHeaderCell>
            <TableHeaderCell align="right">Última Compra</TableHeaderCell>
            <TableHeaderCell align="right">Ações</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={6}
              icon={Users}
              title={
                hasFilter
                  ? 'Nenhum cliente encontrado para essa busca.'
                  : 'Nenhuma cliente ainda.'
              }
            />
          ) : (
            rows.map((customer) => (
              <TableRow key={customer.key}>
                <TableCell>
                  <TablePrimaryCell
                    title={customer.name}
                    subtitle={customer.email ?? undefined}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {/* Cidade vazia fica vazia: `—` seria um dado que o material
                      nao tem. Ver `buildLocation` em `metrics.ts`. */}
                  {customer.location || <span className="text-muted-foreground/50">—</span>}
                </TableCell>
                <TableCell align="center" className="font-medium tabular-nums">
                  {customer.orders}
                </TableCell>
                <TableCell align="right" className="font-semibold tabular-nums">
                  {formatBRL(customer.totalSpent)}
                </TableCell>
                <TableCell align="right" className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(customer.lastOrderAt)}
                </TableCell>
                <TableCell align="right">
                  <button
                    type="button"
                    disabled={!action.available}
                    title={action.reason}
                    onClick={() => onSelect(customer)}
                    className="focus-ring inline-flex cursor-not-allowed items-center gap-1 text-xs font-medium text-accent disabled:opacity-70"
                  >
                    {action.label}
                    <ChevronRight className="size-3" aria-hidden />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableWrap>
  );
}
