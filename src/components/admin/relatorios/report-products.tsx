import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/states';
import { formatBRL } from '@/lib/utils';
import {
  filterByCategory,
  lowStockRows,
  noSalesRows,
  topBy,
} from '@/lib/relatorios/metrics';
import type { ProductReportRow } from '@/lib/relatorios/types';
import { LowStockPanel, NoSalesPanel, ReportRankCard, StockCell } from './report-cards';

/**
 * A ABA `Produtos` — adm-063 (topo) e adm-064 (o resto).
 *
 * ================== A ORDEM FOI MEDIDA NA CAPTURA ==================
 *
 * As três listas têm a MESMA sequência de nomes em quase toda a extensão
 * (`Top Essential Sustentação`, `Conjunto Glow Nude`, `Kit Nike`, …) porque as
 * contagens são quase todas `0` — são EMPATES, e o `sort` estável os mantém na
 * ordem de entrada. É essa a ordem que o print mostra, e por isso `topBy` NÃO
 * tem desempate por nome: um `localeCompare` ali começaria o `Mais Vendidos` em
 * `Conjunto Glow Nude` e contrariaria a captura. A demonstração inteira está na
 * nota de `topBy`, em `metrics.ts`.
 *
 * A DIFERENÇA entre os três cartões é o `Jaqueta Corta Vento Fit`: é o único com
 * `views = 1`, e por isso SOBE para o topo de `Mais Visualizados`, empurrando os
 * outros nove uma casa para baixo — que é exatamente o que o print mostra nos
 * dois primeiros cartões.
 *
 * ================== OS DOIS PAINÉIS NÃO SÃO A MESMA LISTA ==================
 *
 * `Estoque Baixo (≤ 5)` corta por `stock` e ORDENA por estoque crescente (`Kit
 * Nike 1 un.` antes de `Macaquinho 5 un.`); `Sem Vendas no Período` corta por
 * `qtySold === 0` e mantém a ordem da tabela. São cortes diferentes sobre a
 * mesma lista — por isso os dois vêm de `metrics.ts`, e a tela não os recalcula.
 */
export function ProductReport({
  rows,
  category,
}: {
  rows: ProductReportRow[];
  category: string;
}) {
  /**
   * O filtro é aplicado AQUI — a lista plena é a que `data.ts` devolveu, e o
   * filtro é uma escolha de TELA (muda com o `select`, sem nova leitura). E o
   * critério mora em `filterByCategory` (`metrics.ts`), com os outros: as três
   * listas derivadas saem da lista JÁ FILTRADA, como no original — filtrar por
   * `Tops` mostra o topo dos tops, não o topo geral.
   */
  const filtradas = filterByCategory(rows, category);
  const topSellers = topBy(filtradas, 'qtySold');
  const topViews = topBy(filtradas, 'views');
  const topFavorites = topBy(filtradas, 'favorites');
  const lowStock = lowStockRows(filtradas);
  const noSales = noSalesRows(filtradas);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportRankCard
          title="Mais Vendidos"
          items={topSellers}
          metric={(row) => row.qtySold}
        />
        <ReportRankCard
          title="Mais Visualizados"
          items={topViews}
          metric={(row) => row.views}
        />
        <ReportRankCard
          title="Mais Favoritados"
          items={topFavorites}
          metric={(row) => row.favorites}
        />
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
          <h3 className="font-serif text-lg">Todos os Produtos</h3>
        </div>
        <TableWrap>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Produto</TableHeaderCell>
                <TableHeaderCell>Categoria</TableHeaderCell>
                <TableHeaderCell align="center">Estoque</TableHeaderCell>
                <TableHeaderCell align="center">Vendas</TableHeaderCell>
                <TableHeaderCell align="right">Receita</TableHeaderCell>
                <TableHeaderCell align="center">Views</TableHeaderCell>
                <TableHeaderCell align="center">Favs</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtradas.length > 0 ? (
                filtradas.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.category}
                    </TableCell>
                    <TableCell align="center">
                      <StockCell stock={row.stock} />
                    </TableCell>
                    <TableCell align="center" className="tabular-nums">
                      {row.qtySold}
                    </TableCell>
                    <TableCell align="right" className="tabular-nums">
                      {formatBRL(row.revenue)}
                    </TableCell>
                    <TableCell align="center" className="tabular-nums">
                      {row.views}
                    </TableCell>
                    <TableCell align="center" className="tabular-nums">
                      {row.favorites}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-0">
                    <EmptyState
                      title="Nenhum produto nesta categoria"
                      description="Ajuste o filtro de categoria para ver os produtos do relatório."
                    />
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </TableWrap>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <LowStockPanel items={lowStock} />
        <NoSalesPanel items={noSales} />
      </div>
    </div>
  );
}
