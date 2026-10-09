import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * A faixa escura `COLEÇÃO EXCLUSIVA — Essência feminina, força e elegância em
 * cada peça.` (print `004020`).
 *
 * ================== O TEXTO E FIXO, E A FOTO E DO MATERIAL ==================
 *
 * No original esta faixa e escrita NO `index.tsx`, e nao vem do banco: o
 * `eyebrow`, o titulo, o paragrafo e o rotulo do botao sao literais do arquivo.
 * Por isso eles sao literais aqui tambem — nao ha dado de painel para ler.
 *
 * A FOTO e a `661605379_...jpg` de `imagens de referencia pra maneres ect`: a
 * modelo de top nude e short preto `NIKE PRO`, a mesma imagem do print. Ela foi
 * para `public/site/essencia.jpg`. O mesmo arquivo aparece no modal `Ganhe 10%
 * OFF` do print `003828` — e por isso que ele serve aos dois lugares.
 *
 * ================== O BOTAO APONTA PARA A CATEGORIA DE PROMOCOES ==================
 *
 * No original o CTA diz `Aproveitar promoções` e leva a
 * `/categoria/promocoes` — uma rota de CUPOM, e nao uma categoria do catalogo
 * (nao existe `promocoes` na lista do admin). A rota sera criada na Fase 3 como
 * uma VISao de catalogo: as pecas com `compareAtPrice > price`. O link e real, e
 * a pagina existe quando o catalogo existir — a bancada de fechamento de rotas
 * cobre isso.
 */
export function FaixaEscura({ imagem = '/site/essencia.jpg' }: { imagem?: string }) {
  return (
    <section className="relative my-8 overflow-hidden bg-foreground py-12 text-background md:my-12 md:py-20">
      <div className="container mx-auto grid items-center gap-10 px-4 md:grid-cols-2 md:gap-14">
        <div className="order-1 space-y-5">
          <div className="text-[11px] uppercase tracking-[0.32em] text-background/60">
            Coleção Exclusiva
          </div>
          <h2 className="font-serif text-3xl italic leading-tight md:text-5xl">
            Essência feminina, força e elegância em cada peça.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-background/70">
            Tecidos premium, modelagem impecável e detalhes pensados para mulheres que vivem com
            intenção.
          </p>
          <Link
            href="/categoria/promocoes"
            className="inline-flex items-center gap-2 rounded-full bg-background px-8 py-3.5 text-sm tracking-[0.15em] text-foreground transition-all hover:gap-3"
          >
            Aproveitar promoções <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="relative order-2 mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-background/10 shadow-elegant md:ml-auto md:mr-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagem}
            alt="Closet Lunar — essência feminina"
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
