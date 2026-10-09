import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Look — Closet Lunar',
  robots: { index: false, follow: false },
};

/**
 * `/look/[token]` — a pagina do look compartilhado.
 *
 * ================== O QUE ELA É, E O QUE ELA AINDA NAO PODE SER ==================
 *
 * No original, esta rota abre um LOOK montado no Provador Virtual: ela le o token
 * de `savedLooks` e mostra as pecas com um `Comprar o look inteiro` que joga
 * tudo na sacola. **O provador do site nao existe nesta fase** (ele depende do
 * avatar 3D e da camera, que sao a Fase 6)
 *
 * NAO HA LOOK PARA ABRIR, e a pagina diz isso — com o mesmo desenho do `Look não
 * encontrado` do original, que e um estado que ELE MESMO tem. Nao e um
 * placeholder: e o ramo de erro do original, que passa a ser o unico estado
 * possivel enquanto nao houver provador.
 *
 * `robots: noindex` — um link pessoal compartilhado nao deve entrar no indice.
 */
export default function LookPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <Sparkles className="mx-auto size-6 text-muted-foreground" aria-hidden />
      <h1 className="mt-3 font-serif text-2xl">Look não encontrado</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Esse link pode ter expirado ou sido removido.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-6 text-xs uppercase tracking-wider text-background"
      >
        Voltar à loja
      </Link>
    </div>
  );
}
