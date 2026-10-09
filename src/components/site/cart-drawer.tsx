'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useSacola } from '@/lib/site/carrinho';
import { formatBRL } from '@/lib/utils';

/**
 * A gaveta da sacola — o painel que abre pela direita.
 *
 * ================== O DESENHO E O DO ORIGINAL ==================
 *
 * `/checkout` e `/carrinho` nao aparecem nos 14 prints. A forma e a do
 * `CartDrawer.tsx` do original: o veu, o painel a direita com a lista, o
 * subtotal e o botao de seguir.
 *
 * ================== O QUE NAO ESTA AQUI ==================
 *
 * **Cupom, frete e "finalizar compra".** O original calcula desconto, cota frete
 * e leva ao checkout. Nada disso tem fonte nesta fase: o cupom exige a regra de
 * `lib/cupons`, o frete exige provedor, e o pagamento exige gateway —
 * `GATEWAY A DEFINIR`. O botao leva ao `/checkout`, que mostra o resumo e DIZ
 * que o pagamento entra na integracao, em vez de fingir cobrar.
 *
 * **"Frete grátis acima de R$299"** ja e a promessa da faixa de recados e da
 * PDP; aqui ela aparece como informacao, e nao como um calculo — a sacola nao
 * afirma quanto falta, porque o teto de frete gratis tambem e um dado de
 * configuracao que o projeto ainda nao le.
 */
export function CartDrawer() {
  const sacola = useSacola();
  if (!sacola || !sacola.aberta) return null;

  const { itens, fechar, remover, definirQuantidade, subtotal, contagem } = sacola;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Sacola">
      <button
        type="button"
        aria-label="Fechar a sacola"
        onClick={fechar}
        className="absolute inset-0 bg-black/40"
      />
      <div className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-serif text-2xl">
            Sacola {contagem > 0 && <span className="text-muted-foreground">({contagem})</span>}
          </h2>
          <button type="button" onClick={fechar} aria-label="Fechar" className="focus-ring rounded p-1">
            <X className="size-5" aria-hidden />
          </button>
        </header>

        {itens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="size-10 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">Sua sacola está vazia.</p>
            <Link
              href="/"
              onClick={fechar}
              className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.18em] text-background"
            >
              Explorar coleção
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ul className="space-y-5">
                {itens.map((i) => (
                  <li key={i.id} className="flex gap-4">
                    <Link
                      href={`/produto/${i.slug}`}
                      onClick={fechar}
                      className="block size-20 shrink-0 overflow-hidden rounded-lg bg-secondary"
                    >
                      {i.imagem ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={i.imagem} alt={i.nome} className="size-full object-cover" />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/produto/${i.slug}`}
                        onClick={fechar}
                        className="line-clamp-2 text-sm font-medium leading-snug hover:text-accent"
                      >
                        {i.nome}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {[i.tamanho, i.cor].filter(Boolean).join(' · ')}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-full border border-border">
                          <button
                            type="button"
                            aria-label="Diminuir"
                            onClick={() => definirQuantidade(i.id, i.quantidade - 1)}
                            className="focus-ring rounded-l-full px-2.5 py-1.5"
                          >
                            <Minus className="size-3.5" aria-hidden />
                          </button>
                          <span className="min-w-8 border-x border-border px-2 py-1.5 text-center text-sm">
                            {i.quantidade}
                          </span>
                          <button
                            type="button"
                            aria-label="Aumentar"
                            onClick={() => definirQuantidade(i.id, i.quantidade + 1)}
                            className="focus-ring rounded-r-full px-2.5 py-1.5"
                          >
                            <Plus className="size-3.5" aria-hidden />
                          </button>
                        </div>
                        <span className="text-sm font-medium">{formatBRL(i.preco * i.quantidade)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remover ${i.nome}`}
                      onClick={() => remover(i.id)}
                      className="focus-ring self-start rounded p-1 text-muted-foreground transition-colors hover:text-danger-foreground"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-serif text-2xl">{formatBRL(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Frete grátis acima de R$299 · ou 6x sem juros
              </p>
              <Link
                href="/checkout"
                onClick={fechar}
                className="mt-4 block w-full rounded-full bg-foreground py-3.5 text-center text-xs font-medium uppercase tracking-[0.18em] text-background"
              >
                Finalizar compra
              </Link>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
