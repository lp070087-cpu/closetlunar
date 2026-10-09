import type { Metadata } from 'next';
import { CheckoutView } from '@/components/site/checkout-view';

export const metadata: Metadata = {
  title: 'Sacola — Closet Lunar',
  robots: { index: false, follow: false },
};

/**
 * `/checkout` — o resumo da compra.
 *
 * ================== SEM PRINT, FONTE = ORIGINAL ==================
 *
 * Nenhum dos 14 prints mostra o checkout. A fonte e o `checkout.tsx` do original,
 * e o que da para reproduzir sem inventar esta em `CheckoutView` — o resumo dos
 * itens e o subtotal real.
 *
 * ================== O QUE NAO FOI REPRODUZIDO ==================
 *
 * O formulario de entrega, a cotacao de frete, o campo de cupom e o pagamento
 * dependem de: provedor de frete, regra de cupom ligada, gateway de pagamento e
 * a sessao da cliente. Nenhum dos quatro existe nesta fase. A tela diz isso no
 * proprio texto, em vez de desenhar campos que nao enviam nada.
 *
 * A rota existe (e nao um `href="#"`): a sacola aponta para ela, e ela mostra o
 * que ha. `robots: noindex` — uma pagina de sacola nao deve ser indexada.
 */
export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <header className="mb-10 text-center">
        <h1 className="font-serif text-4xl md:text-5xl">Sua sacola</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confira os itens antes de finalizar.
        </p>
      </header>
      <CheckoutView />
    </div>
  );
}
