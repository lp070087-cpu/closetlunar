'use client';

import { ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { MarginBar, ProfitValue, StockChip } from '@/components/ui/margin-bar';
import { formatBRL } from '@/lib/utils';
import { productMargin, productProfit, totalStock } from '@/lib/produtos/metrics';
import type { Product, ProductStatus } from '@/lib/produtos/types';

/**
 * Selo de status. So aparece quando o produto NAO esta ativo — na referencia
 * todos os produtos listados estao ativos, entao nao ha selo para copiar; o
 * desenho segue o chip que os prints ja usam em Estoque (`Sem variacoes`).
 */
function StatusTag({ status }: { status: ProductStatus }) {
  const label = status === 'draft' ? 'Rascunho' : 'Arquivado';
  return (
    <span className="inline-flex items-center rounded-full bg-warning-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-warning-foreground">
      {label}
    </span>
  );
}

/**
 * Versao em cartao de um produto, para telas pequenas.
 *
 * REGRA DE RESPONSIVIDADE DESTA FASE: no celular nao se comprime a tabela. O
 * cartao carrega TODOS os campos da linha (venda, custo, lucro, margem,
 * estoque) e as MESMAS duas acoes. Nada e escondido — so muda o arranjo.
 *
 * A tabela continua existindo a partir de `lg`, onde ela cabe sem cortar.
 */
export function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const profit = productProfit(product);
  const margin = productMargin(product);
  const first = product.images[0];

  return (
    <li className="surface-flat overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-secondary">
          {first ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={first.url} alt={first.alt} className="size-full object-cover" loading="lazy" />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground/40">
              <ImageIcon className="size-5" aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
          <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
            {product.slug}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StockChip stock={totalStock(product)} />
            {product.status !== 'active' ? <StatusTag status={product.status} /> : null}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-x-4 gap-y-3 border-t border-border/60 px-4 py-3">
        <div>
          <dt className="label-caps">Venda</dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums">
            {formatBRL(product.price)}
          </dd>
        </div>
        <div>
          <dt className="label-caps">Custo</dt>
          <dd className="mt-0.5 text-sm text-muted-foreground tabular-nums">
            {formatBRL(product.costPrice)}
          </dd>
        </div>
        <div>
          <dt className="label-caps">Lucro</dt>
          <dd className="mt-0.5 text-sm">
            <ProfitValue profit={profit} />
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="label-caps mb-1.5">Margem</p>
          <MarginBar margin={margin} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(product)}
            aria-label={`Editar ${product.name}`}
            className="focus-ring grid size-10 place-items-center rounded-xl border border-border text-foreground transition-colors hover:bg-secondary"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            aria-label={`Excluir ${product.name}`}
            className="focus-ring grid size-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-danger/30 hover:bg-danger-surface hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
