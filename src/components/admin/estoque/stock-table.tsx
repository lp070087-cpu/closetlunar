'use client';

import { ImageIcon, Package, SearchX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { EmptyRow } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { isHighlightedTotal, statusLabel } from '@/lib/estoque/metrics';
import type { StockRow, StockVariation } from '@/lib/estoque/types';

/**
 * Tabela de estoque (adm-028, continuando no topo do adm-029).
 *
 * Colunas na ordem exata do print:
 *   PRODUTO · SKU · VARIACOES (COR/TAM) · ESTOQUE TOTAL · ACOES
 *
 * Celula PRODUTO: miniatura quadrada de 48px com cantos arredondados e fundo
 * bege, nome em sans de 14px. SEM slug embaixo — isso e do print de Produtos; o
 * de Estoque mostra so o nome.
 *
 * Celula SKU: `—` em TODAS as linhas do print, porque nao ha SKU cadastrado.
 *
 * Celula VARIACOES: quando nao ha cor, o texto `Sem variações` em italico cinza;
 * quando ha, uma pastilha por cor com o ponto, o nome em versalete e a
 * quantidade dentro de uma caixinha propria — sem barra entre eles.
 *
 * Celula ESTOQUE TOTAL: o numero fica LARANJA/vermelho quando o estoque esta
 * baixo ou esgotado. O corte e o mesmo dos KPIs (ver `stockStatus`), e nao um
 * segundo numero escrito aqui.
 *
 * Celula ACOES: `Ajuste Geral` em laranja, como texto — nao e uma pill preta.
 * O print nao tem modal de ajuste em lugar nenhum, entao o clique abre o
 * formulario minimo; a divergencia esta relatada no fim da fase.
 */
export function StockTable({
  rows,
  onAdjust,
  hasFilter,
}: {
  rows: StockRow[];
  onAdjust: (row: StockRow) => void;
  /** Ha busca ativa? Muda so o texto do estado vazio, nao a tabela. */
  hasFilter: boolean;
}) {
  return (
    <TableWrap>
      <Table className="min-w-[48rem]">
        <TableHead>
          <tr>
            <TableHeaderCell className="pl-8">Produto</TableHeaderCell>
            <TableHeaderCell>SKU</TableHeaderCell>
            <TableHeaderCell>Variações (cor/tam)</TableHeaderCell>
            <TableHeaderCell align="right">Estoque total</TableHeaderCell>
            <TableHeaderCell align="right" className="pr-8">
              Ações
            </TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            hasFilter ? (
              <EmptyRow colSpan={5} icon={SearchX} title="Nenhum produto encontrado para a busca." />
            ) : (
              <EmptyRow colSpan={5} icon={Package} title="Nenhum produto cadastrado ainda." />
            )
          ) : (
            rows.map((row) => (
              <TableRow key={row.productId}>
                <TableCell className="py-4 pl-8">
                  <div className="flex items-center gap-3">
                    <Thumbnail row={row} />
                    <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
                  </div>
                </TableCell>

                {/* SKU: `—` em todas as linhas do print. Ver `buildStockRow`. */}
                <TableCell className="text-muted-foreground tabular-nums">
                  {row.sku ?? '—'}
                </TableCell>

                <TableCell>
                  <VariationList variations={row.variations} />
                </TableCell>

                <TableCell align="right">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      isHighlightedTotal(row.total) ? 'text-warning-foreground' : 'text-foreground',
                    )}
                  >
                    {row.total}
                  </span>
                  <span className="sr-only"> — {statusLabel(row.status)}</span>
                </TableCell>

                <TableCell className="pr-8 text-right">
                  <button
                    type="button"
                    onClick={() => onAdjust(row)}
                    className="focus-ring rounded-lg px-2 py-1 text-sm font-medium text-warning-foreground transition-colors hover:bg-warning-surface/60"
                  >
                    Ajuste Geral
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

/**
 * Miniatura de 48px com fundo bege.
 *
 * A peca sem foto (`Conjunto Glow Nude`, que so existe no print de Estoque, e as
 * que na referencia vieram sem imagem) cai no icone neutro — o mesmo estado que
 * a lista de Produtos usa. Nao ha placeholder de foto de produto aqui.
 */
function Thumbnail({ row }: { row: StockRow }) {
  return (
    <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-secondary">
      {row.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.imageUrl} alt={row.imageAlt} className="size-full object-cover" loading="lazy" />
      ) : (
        <div className="grid size-full place-items-center text-muted-foreground/40">
          <ImageIcon className="size-5" aria-hidden />
        </div>
      )}
    </div>
  );
}

/** `Sem variações` ou uma pastilha por cor, empilhadas (o `top` tem duas). */
function VariationList({ variations }: { variations: StockVariation[] }) {
  if (variations.length === 0) {
    return <span className="text-xs italic text-muted-foreground">Sem variações</span>;
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {variations.map((variation) => (
        <li key={variation.colorId} className="flex items-center gap-2">
          {/* O print desenha o ponto em CINZA NEUTRO mesmo em PRETO/ROSA — a
              referencia nao pinta o ponto com a cor. `hex` `null` = ponto
              neutro. Ver `StockVariation` em types.ts. */}
          <span
            aria-hidden
            className={cn(
              'size-3 shrink-0 rounded-full',
              variation.hex ? '' : 'bg-muted-foreground/25',
            )}
            style={variation.hex ? { backgroundColor: variation.hex } : undefined}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {variation.name}
          </span>
          <span className="rounded-md border border-border/70 px-1.5 py-0.5 text-[11px] tabular-nums text-foreground">
            {variation.quantity}
          </span>
        </li>
      ))}
    </ul>
  );
}
