import { Package, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBRL } from '@/lib/utils';
import { isLowStock } from '@/lib/relatorios/metrics';
import type { ProductReportRow } from '@/lib/relatorios/types';

/**
 * OS CARTÕES E OS DOIS PAINÉIS DA ABA `Produtos` — adm-063/064.
 *
 * São presentacionais e não guardam estado: quem ordena e corta é `metrics.ts`,
 * quem lê é `data.ts`. Aqui só se desenha o que chegou pronto — um número
 * calculado no JSX não tem onde ser provado.
 */

/**
 * `ReportCard` do original — título serifado e uma lista numerada.
 *
 * CADA LINHA É `n. NOME` (o número é a POSIÇÃO na lista, com ponto, como o print
 * mostra: `1. Top Essential Sustentação`) e o valor à direita em monoespaçada
 * negrito. O `metric` escolhe o número — `qtySold`, `views` ou `favorites` — e é
 * a única diferença entre os três cartões.
 *
 * A LISTA NÃO É CORTADA AQUI. O `slice(0, 10)` é do `topBy`, não do desenho: se
 * a tela cortasse, o corte não teria onde ser provado e um cartão de topo poderia
 * mostrar 12 linhas sem ninguém notar.
 */
export function ReportRankCard({
  title,
  items,
  metric,
}: {
  title: string;
  items: ProductReportRow[];
  metric: (row: ProductReportRow) => number;
}) {
  return (
    <div className="surface-flat p-6">
      <h3 className="mb-4 font-serif text-lg">{title}</h3>
      {items.length > 0 ? (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate flex-1">
                {index + 1}. {item.name}
              </span>
              <span className="shrink-0 font-mono font-bold tabular-nums">{metric(item)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">Sem dados no período.</p>
      )}
    </div>
  );
}

/**
 * `Estoque Baixo (≤ 5)` — o painel da esquerda em adm-064.
 *
 * O CORTE VEM DE FORA (`lowStockRows`), já filtrado e ordenado por estoque
 * crescente — é o que põe o `Kit Nike (1 un.)` antes do `Macaquinho (5 un.)`.
 * O `isLowStock` aqui só confirma, linha a linha, o que o título promete: o
 * painel diz `≤ 5` e as linhas que ele pinta de vermelho são as que de fato têm
 * `stock <= 5`. Se as duas coisas divergissem, o título estaria mentindo — e o
 * título é um número que a tela promete.
 */
export function LowStockPanel({ items }: { items: ProductReportRow[] }) {
  return (
    <div className="surface-flat p-6">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-lg text-danger">
        <Package className="size-5" aria-hidden />
        Estoque Baixo (≤ 5)
      </h3>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg bg-danger-surface px-3 py-2 text-sm"
            >
              <span className="truncate">{item.name}</span>
              <span className="shrink-0 font-bold tabular-nums">{item.stock} un.</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>
        )}
      </div>
    </div>
  );
}

/**
 * `Sem Vendas no Período` — o painel da direita em adm-064.
 *
 * A lista ROLA dentro do painel (`max-h-[18rem] overflow-y-auto`), como a barra
 * de rolagem que aparece na captura: com dez produtos sem venda, os dez não cabem
 * e o painel corta em vez de esticar a página.
 *
 * O TEXTO VAZIO é literal do original (`Todos os produtos tiveram vendas!`) e só
 * aparece quando NÃO há linhas — na loja do print nunca aparece, porque não há
 * vendas e a lista tem tudo.
 */
export function NoSalesPanel({ items }: { items: ProductReportRow[] }) {
  return (
    <div className="surface-flat p-6">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-lg">
        <ShoppingBag className="size-5" aria-hidden />
        Sem Vendas no Período
      </h3>
      <div className="max-h-[18rem] space-y-2 overflow-y-auto">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="border-b border-border/50 px-2 py-2 text-sm last:border-0"
            >
              {item.name}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Todos os produtos tiveram vendas!</p>
        )}
      </div>
    </div>
  );
}

/**
 * O ESTOQUE NA TABELA `Todos os Produtos`.
 *
 * `≤ 5` sai pintado de vermelho e negrito, como no print (`Kit Nike` e
 * `Macaquinho` são as duas linhas vermelhas). O critério é o MESMO
 * `LOW_STOCK_THRESHOLD` do painel ao lado — pela função `isLowStock`, e não por
 * um `<= 5` reescrito aqui, que é como as duas telas começam a discordar.
 */
export function StockCell({ stock }: { stock: number }) {
  return (
    <span className={cn('tabular-nums', isLowStock(stock) && 'font-bold text-danger')}>
      {stock}
    </span>
  );
}

/** Dinheiro em reais — o mesmo `formatBRL` do resto do painel. */
export { formatBRL };
