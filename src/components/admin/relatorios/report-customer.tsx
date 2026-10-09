import { ShoppingBag, UserPlus, Users } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { EmptyRow } from '@/components/ui/states';
import { StatCard, StatGrid } from '@/components/ui/stats';
import { formatBRL, formatDate } from '@/lib/utils';
import { abandonedLabel } from '@/lib/relatorios/metrics';
import type { AbandonedCartRow, CustomerReportRow } from '@/lib/relatorios/types';

/**
 * A ABA `Clientes` — adm-065.
 *
 * O print mostra a tela INTEIRA no estado vazio: os três KPIs em `0`, a tabela
 * `Top Clientes (por faturamento)` só com o cabeçalho e os dois painéis com o
 * texto de vazio. Então o que esta aba prova é a ESTRUTURA — os três cartões, as
 * cinco colunas, os dois painéis e os dois textos — e é isso que ela reproduz.
 *
 * ================== OS TRÊS KPIs E AS SUAS CORES ==================
 *
 * `Total de Clientes`       tom NEUTRO (cinza)   — é a contagem, sem julgamento
 * `Clientes Recorrentes`    tom SUCCESS (verde)  — o cartão verde do print
 * `Carrinhos Abandonados`   tom DANGER (rosa)    — o cartão rosa do print
 *
 * As três cores foram lidas na captura: o quadrado do segundo é verde-menta e o
 * do terceiro é rosa. Os tokens `success-surface` e `danger-surface` são os do
 * painel, medidos nos mesmos tons.
 *
 * ================== OS DOIS PAINÉIS TÊM TÍTULOS DE CORES DIFERENTES ==================
 *
 * `Clientes Inativos (+90 dias)` é VERMELHO no print (o mesmo `text-danger` do
 * `Estoque Baixo (≤ 5)`, no original); `Carrinhos Abandonados` é tinta comum. É
 * uma diferença de uma palavra no original (`text-rose-600` num e nada no
 * outro), e a tela a preserva — pintar os dois iguais apagaria a distinção que o
 * print faz.
 */

/** Os três KPIs da aba — `adm-065`. */
export function CustomerStats({
  customers,
  recurringCount,
  abandonedCount,
}: {
  customers: CustomerReportRow[];
  recurringCount: number;
  abandonedCount: number;
}) {
  return (
    <StatGrid columns={3}>
      <StatCard label="Total de Clientes" value={customers.length} icon={Users} />
      <StatCard
        label="Clientes Recorrentes"
        value={recurringCount}
        icon={UserPlus}
        tone="success"
      />
      <StatCard
        label="Carrinhos Abandonados"
        value={abandonedCount}
        icon={ShoppingBag}
        tone="danger"
      />
    </StatGrid>
  );
}

/**
 * `Top Clientes (por faturamento)` — a tabela de adm-065.
 *
 * ================== O NOME E O E-MAIL NA MESMA CÉLULA ==================
 *
 * O print tem CINCO colunas (`CLIENTE`, `PEDIDOS`, `TOTAL GASTO`, `ÚLTIMA
 * COMPRA`, `STATUS`), e a coluna `CLIENTE` traz DUAS linhas: o nome em cima e o
 * e-mail embaixo, em cinza menor. Não é uma coluna de e-mail separada — por isso
 * `TablePrimaryCell`, que é o componente do painel para exatamente esse par.
 *
 * ================== O SELO `STATUS` VEM DO DADO ==================
 *
 * O texto sai de `row.status`, e não de um `Ativo` fixo no JSX. No original o
 * valor é gravado `"Ativo"` na montagem — e é isso que o dado É hoje; mas um
 * `Ativo` escrito na tela seria a tela afirmando um status que ela não leu, e o
 * dia em que existir cliente inativo ela continuaria dizendo `Ativo`.
 */
export function TopCustomersTable({ items }: { items: CustomerReportRow[] }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
        <h3 className="font-serif text-lg">Top Clientes (por faturamento)</h3>
      </div>
      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell align="center">Pedidos</TableHeaderCell>
              <TableHeaderCell align="right">Total Gasto</TableHeaderCell>
              <TableHeaderCell align="right">Última Compra</TableHeaderCell>
              <TableHeaderCell align="center">Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? (
              items.map((customer) => (
                <TableRow key={customer.email}>
                  <TableCell>
                    <TablePrimaryCell title={customer.name} subtitle={customer.email} />
                  </TableCell>
                  <TableCell align="center" className="tabular-nums">
                    {customer.totalOrders}
                  </TableCell>
                  <TableCell align="right" className="font-bold tabular-nums">
                    {formatBRL(customer.totalSpent)}
                  </TableCell>
                  <TableCell align="right" className="text-xs text-muted-foreground">
                    {formatDate(customer.lastOrder)}
                  </TableCell>
                  <TableCell align="center">
                    <Badge variant="success">{customer.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRow colSpan={5} title="Nenhum cliente no período." icon={Users} />
            )}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}

/** `Clientes Inativos (+90 dias)` — o painel vermelho de adm-065. */
export function InactiveCustomersPanel({ items }: { items: CustomerReportRow[] }) {
  return (
    <div className="surface-flat p-6">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-lg text-danger">
        <Users className="size-5" aria-hidden />
        Clientes Inativos (+90 dias)
      </h3>
      <div className="max-h-[18rem] space-y-2 overflow-y-auto">
        {items.length > 0 ? (
          items.map((customer) => (
            <div
              key={customer.email}
              className="flex items-center justify-between gap-4 border-b border-border/50 px-2 py-2 text-sm last:border-0"
            >
              <span className="truncate">{customer.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                Último: {formatDate(customer.lastOrder)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum cliente inativo no período.</p>
        )}
      </div>
    </div>
  );
}

/**
 * `Carrinhos Abandonados` — o painel da direita em adm-065.
 *
 * DUAS COLUNAS: quem abandonou e quanto. Sem data e sem telefone — o painel do
 * print mostra só isso, e a tela não acrescenta o que o material não tem. O
 * e-mail vazio vira `Visitante` por `abandonedLabel`, que é o texto literal do
 * original.
 */
export function AbandonedPanel({ items }: { items: AbandonedCartRow[] }) {
  return (
    <div className="surface-flat p-6">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-lg">
        <ShoppingBag className="size-5" aria-hidden />
        Carrinhos Abandonados
      </h3>
      <div className="max-h-[18rem] space-y-2 overflow-y-auto">
        {items.length > 0 ? (
          items.map((cart, index) => (
            <div
              key={`${cart.email ?? 'visitante'}-${index}`}
              className="flex items-center justify-between gap-4 border-b border-border/50 px-2 py-2 text-sm last:border-0"
            >
              <span className="max-w-[12rem] truncate">{abandonedLabel(cart)}</span>
              <span className="shrink-0 font-mono font-bold tabular-nums">
                {formatBRL(cart.subtotal)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum carrinho abandonado no período.</p>
        )}
      </div>
    </div>
  );
}
