'use client';

import { useMemo, useState } from 'react';
import { PackagePlus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/states';
import { PIECE_PENDING_STATUS } from '@/lib/provador/demo';
import { filterProducts } from '@/lib/provador/metrics';
import type { Product } from '@/lib/produtos/types';

/**
 * O SELETOR DE PRODUTOS — a coluna esquerda de adm-041/042 (Avatar Virtual) e
 * adm-043/046 (Provador Virtual).
 *
 * ================== ELE NAO TEM LISTA PROPRIA ==================
 *
 * A lista chega por prop, ja derivada de `lib/produtos` (`metrics.selectorProducts`).
 * Este componente NAO transcreve, NAO guarda uma constante de produtos e NAO
 * importa `demo`: se ele tivesse a propria lista, existiriam dois donos da mesma
 * coisa — que e a origem de toda divergencia neste painel.
 *
 * ================== O ELEMENTO QUE O PRINT MOSTRA E ESTE COMPONENTE NAO DESENHA ==================
 *
 * `Conjunto Glow Nude` aparece na lista do print e NAO aparece aqui, porque NAO
 * EXISTE em `lib/produtos` — e o mesmo produto fantasma de adm-034. A decisao
 * (JOIN em vez de transcricao) esta escrita por inteiro em `metrics.ts`, com as
 * tres saidas consideradas e o custo declarado: a tela mostra 8 onde o print
 * mostra 9.
 *
 * A linha `Top Essential Sustentação` faz o caminho inverso: existe no catalogo,
 * aparece aqui, e NAO aparece no print. A bancada DECLARA as duas pelo nome — ver
 * `bench-provador.mjs`, secao "a lista ausente".
 *
 * ================== O ESTADO VAZIO E DE BUSCA, E SO DE BUSCA ==================
 *
 * `Nenhum produto encontrado.` so aparece quando um TERMO foi digitado e nao
 * casou (adm-040). Com a lista cheia e nenhum termo, o vazio nunca aparece — e
 * como o `Conjunto Glow Nude` nao existe, buscar `Glow` cai exatamente neste
 * estado, que e o do print.
 */
export function ProductPicker({
  products,
  selectedId,
  onSelect,
  className,
}: {
  products: Product[];
  selectedId: string | null;
  onSelect: (product: Product) => void;
  className?: string;
}) {
  const [termo, setTermo] = useState('');
  const filtrados = useMemo(() => filterProducts(products, termo), [products, termo]);

  return (
    <div className={cn('surface-flat flex flex-col', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <span className="eyebrow-caps">Produtos</span>
        {/**
         * A CONTAGEM E DERIVADA, nao escrita a mao: ela mostra o que a lista TEM,
         * e nao o que o print tinha. Se um produto entrar ou sair do catalogo, o
         * numero acompanha sozinho.
         */}
        <span className="rounded-full bg-secondary/70 px-2.5 py-1 text-[10px] font-bold tabular-nums text-muted-foreground">
          {filtrados.length}/{products.length}
        </span>
      </header>

      <div className="border-b border-border/60 p-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">
            <Search aria-hidden />
          </span>
          <input
            type="search"
            value={termo}
            onChange={(event) => setTermo(event.target.value)}
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
            className="focus-ring h-10 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 hover:border-border"
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState title="Nenhum produto encontrado." className="py-10" />
      ) : (
        <ul className="max-h-[32rem] overflow-y-auto p-2">
          {filtrados.map((product) => {
            const ativo = product.id === selectedId;
            const capa = product.images[0]?.url;
            return (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onSelect(product)}
                  aria-pressed={ativo}
                  className={cn(
                    'focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200',
                    ativo ? 'bg-secondary' : 'hover:bg-secondary/60',
                  )}
                >
                  <span className="size-10 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
                    {capa ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={capa} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-muted-foreground">
                        <PackagePlus className="size-4" aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={cn(
                        'truncate text-sm',
                        ativo ? 'font-bold text-foreground' : 'font-medium text-foreground/85',
                      )}
                    >
                      {product.name}
                    </span>
                    {/**
                     * O STATUS DE PENDENCIA — em TODOS os produtos.
                     *
                     * Lido em `235547.png`, `235557.png` e `235613.png`: os nove
                     * mostram `Imagem do provador pendente`. A loja do material
                     * nao tinha nenhuma peca com imagem de provador cadastrada —
                     * que e justamente o que esta tela serve para resolver.
                     */}
                    <span className="truncate text-[11px] text-muted-foreground">
                      {PIECE_PENDING_STATUS}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
