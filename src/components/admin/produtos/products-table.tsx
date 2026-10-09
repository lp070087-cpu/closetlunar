'use client';

import { ImageIcon, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { MarginBar, ProfitValue, StockChip } from '@/components/ui/margin-bar';
import { EmptyRow } from '@/components/ui/states';
import { formatBRL } from '@/lib/utils';
import { productMargin, productProfit } from '@/lib/produtos/metrics';
import type { Product } from '@/lib/produtos/types';

/**
 * Tabela de produtos (adm-025).
 *
 * Colunas na ordem exata do print:
 *   PRODUTO · VENDA · CUSTO · LUCRO · MARGEM · ESTOQUE · AÇÕES
 *
 * Celula PRODUTO: miniatura quadrada de 48px com cantos arredondados e fundo
 * bege, nome em sans de 14px, slug em versalete cinza logo abaixo.
 *
 * ACOES: `Editar` em texto (nao e um botao pill — e texto com area de toque) e
 * a lixeira como icone sem texto, exatamente como o print mostra.
 *
 * LUCRO e MARGEM usam `productProfit` / `productMargin`, nunca `grossProfit` /
 * `profitMargin` com `product.price`. A diferenca aparece quando a peca tem
 * preco promocional: a versao com `price` calcula sobre o preco cheio, e a
 * mesma peca mostraria um lucro na tabela e outro no cartao ao lado. O dono
 * unico dessa conta e `lib/produtos/metrics.ts`.
 */

const MIN_TABLE_WIDTH = 'min-w-[52rem]';

export function ProductsTable({
  products,
  onEdit,
  onDelete,
}: {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  return (
    <TableWrap>
      <Table className={MIN_TABLE_WIDTH}>
        <TableHead>
          <tr>
            <TableHeaderCell className="pl-8">Produto</TableHeaderCell>
            <TableHeaderCell>Venda</TableHeaderCell>
            <TableHeaderCell>Custo</TableHeaderCell>
            <TableHeaderCell>Lucro</TableHeaderCell>
            <TableHeaderCell>Margem</TableHeaderCell>
            <TableHeaderCell>Estoque</TableHeaderCell>
            <TableHeaderCell align="right" className="pr-8">
              Ações
            </TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {products.length === 0 ? (
            <EmptyRow
              colSpan={7}
              icon={ImageIcon}
              title="Nenhum produto encontrado para os filtros aplicados."
            />
          ) : (
            products.map((product) => {
              const profit = productProfit(product);
              const margin = productMargin(product);
              return (
                <TableRow key={product.id}>
                  <TableCell className="pl-8 py-4">
                    <div className="flex items-center gap-3">
                      <Thumbnail product={product} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {product.name}
                        </div>
                        <div className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                          {product.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {formatBRL(product.price)}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatBRL(product.costPrice)}
                  </TableCell>
                  <TableCell>
                    <ProfitValue profit={profit} />
                  </TableCell>
                  <TableCell>
                    <MarginBar margin={margin} />
                  </TableCell>
                  <TableCell>
                    <StockChip stock={product.stock} />
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="focus-ring rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        aria-label={`Excluir ${product.name}`}
                        className="focus-ring grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-surface hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
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

/** Miniatura de 48px com fundo bege, igual as linhas da referencia. */
function Thumbnail({ product }: { product: Product }) {
  const first = product.images[0];
  return (
    <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-secondary">
      {first ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={first.url} alt={first.alt} className="size-full object-cover" loading="lazy" />
      ) : (
        <div className="grid size-full place-items-center text-muted-foreground/40">
          <ImageIcon className="size-5" aria-hidden />
        </div>
      )}
    </div>
  );
}
