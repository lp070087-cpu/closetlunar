import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { formatBRL } from '@/lib/utils';
import type { CategoryShareRow } from '@/lib/relatorios/metrics';

/**
 * A ABA `Categorias` — adm-066.
 *
 * ================== O GRÁFICO `Receita por Categoria` NÃO ESTÁ AQUI ==================
 *
 * O original desenha, DEPOIS da tabela, um gráfico de barras (`recharts`) — mas
 * só quando há linhas:
 *
 *     {data.length > 0 && ( <BarChart … /> )}
 *
 * E o print de adm-066 mostra a tela SEM o gráfico, porque a loja não tem receita
 * por categoria: a tabela tem só o cabeçalho e nada abaixo dele. O gráfico, no
 * estado do print, NÃO EXISTE.
 *
 * Ele também não existe em nenhum outro lugar do painel — este projeto não tem
 * biblioteca de gráficos instalada, e o gráfico de Financeiro foi desenhado à mão
 * em SVG por causa disso. Escrever agora um gráfico de barras para um estado que
 * o material mostra VAZIO seria construir interface que ninguém pediu e que
 * print nenhum confirma. A tabela — que o print CONFIRMA — é o que fica, com o
 * estado vazio fiel. O gráfico entra quando houver dado e quando a fase de
 * integração definir a biblioteca. Ver a nota de pendências em `types.ts`.
 *
 * ================== A BARRA DE SHARE É CSS, E O SHARE VEM PRONTO ==================
 *
 * A última coluna (`SHARE DE RECEITA`) traz, por linha, uma barrinha de largura
 * proporcional e o número `42,5%` ao lado. A largura é `style={{ width: share% }}`
 * — a mesma técnica do original (`${share}%`), só que com o `share` calculado em
 * `metrics.ts` (`categoryShareRows`), onde o `total === 0` já foi tratado. Sem
 * isso, uma loja sem receita produziria `width: NaN%` e `NaN%` escrito na tela.
 */

/** `Desempenho por Categoria` — a única tabela de adm-066. */
export function CategoryReportTable({ items }: { items: CategoryShareRow[] }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
        <h3 className="font-serif text-lg">Desempenho por Categoria</h3>
      </div>
      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Categoria</TableHeaderCell>
              <TableHeaderCell align="center">Produtos Vendidos</TableHeaderCell>
              <TableHeaderCell align="right">Receita Total</TableHeaderCell>
              <TableHeaderCell align="right">Share de Receita</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? (
              items.map((category) => (
                <TableRow key={category.name}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell align="center" className="tabular-nums">
                    {category.qty}
                  </TableCell>
                  <TableCell align="right" className="font-bold tabular-nums">
                    {formatBRL(category.revenue)}
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${category.share}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs tabular-nums">
                        {category.share.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              /**
               * O ESTADO VAZIO DESTA TABELA NÃO TEM TEXTO NO PRINT — ela apenas
               * termina depois do cabeçalho, sem a linha "Nenhuma categoria".
               * Reproduzir um texto que o print não tem seria inventar; deixar a
               * tabela só com o cabeçalho é o que a captura mostra. O
               * `EmptyRow` fica reservado para quando houver dado e o filtro
               * esvaziar a lista — que é um estado DIFERENTE de "a loja não vendeu".
               */
              <tr>
                <td colSpan={4} className="px-5 py-0" />
              </tr>
            )}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}
