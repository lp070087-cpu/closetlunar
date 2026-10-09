'use client';

import Link from 'next/link';
import { useSacola } from '@/lib/site/carrinho';
import { formatBRL } from '@/lib/utils';

/**
 * O resumo do checkout.
 *
 * ================== ESTA TELA NAO COBRA, E DIZ ISSO ==================
 *
 * O `checkout.tsx` do original tem o formulario de entrega, o calculo de frete,
 * o campo de cupom e um botao que abre um gateway de pagamento (`createPayment`)
 * com uma chave configurada. **Nenhuma dessas tres coisas existe nesta fase:**
 *
 *   - o gateway nao esta escolhido -> `GATEWAY A DEFINIR`;
 *   - a cotacao de frete exige um provedor (Correios/transportadora) -> nao ha;
 *   - o cupom exige a regra de validade de `lib/cupons` -> existe, mas o
 *     checkout nao esta ligado a ela.
 *
 * Entao esta tela mostra o que a sacola TEM (os itens e o subtotal) e diz, em
 * texto, que o pagamento entra na integracao. Um botao `PAGAR` que nao cobra
 * seria a promessa que a regra de honestidade proibe — e o mesmo vale para um
 * `frete: R$ 19,90` inventado, porque seria um numero que ninguem cotou.
 *
 * ================== O QUE JA E VERDADE ==================
 *
 * O subtotal e a soma real dos itens; a sacola persiste no navegador; a
 * quantidade e editavel aqui (a gaveta ja faz isso, e esta tela reusa o estado,
 * nao o dinheiro). O que falta e SO a cobranca — e a tela separa as duas coisas
 * em vez de esconder a segunda.
 */
export function CheckoutView() {
  const sacola = useSacola();

  if (!sacola || !sacola.pronto) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Carregando...</p>;
  }

  const { itens, subtotal, contagem } = sacola;

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="text-sm text-muted-foreground">Sua sacola está vazia.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.18em] text-background"
        >
          Explorar coleção
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <h2 className="font-serif text-2xl italic">Seus itens</h2>
        <ul className="mt-5 divide-y divide-border/40 rounded-2xl border border-border/60">
          {itens.map((i) => (
            <li key={i.id} className="flex items-center gap-4 p-4">
              <Link
                href={`/produto/${i.slug}`}
                className="block size-20 shrink-0 overflow-hidden rounded-lg bg-secondary"
              >
                {i.imagem ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={i.imagem} alt={i.nome} className="size-full object-cover" />
                ) : null}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/produto/${i.slug}`} className="text-sm font-medium hover:text-accent">
                  {i.nome}
                </Link>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {[i.tamanho, i.cor].filter(Boolean).join(' · ')} · {i.quantidade}x
                </p>
              </div>
              <span className="text-sm font-medium">{formatBRL(i.preco * i.quantidade)}</span>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-2xl border border-border/60 bg-secondary/30 p-6">
        <h2 className="font-serif text-xl">Resumo</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Subtotal ({contagem} {contagem === 1 ? 'item' : 'itens'})
            </dt>
            <dd className="font-medium">{formatBRL(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Frete</dt>
            <dd className="text-muted-foreground">a calcular</dd>
          </div>
        </dl>

        <div className="mt-4 flex justify-between border-t border-border pt-4">
          <span className="font-medium">Total</span>
          <span className="font-serif text-2xl">{formatBRL(subtotal)}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">ou 6x sem juros</p>

        <button
          type="button"
          className="mt-6 w-full rounded-full bg-foreground py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-background"
        >
          Finalizar compra
        </button>

        <p className="mt-3 text-center text-[11px] italic leading-relaxed text-muted-foreground">
          O pagamento entra na fase de integração — o gateway ainda não foi definido.
        </p>

        <Link
          href="/"
          className="mt-4 block text-center text-xs text-muted-foreground underline transition-colors hover:text-foreground"
        >
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}
