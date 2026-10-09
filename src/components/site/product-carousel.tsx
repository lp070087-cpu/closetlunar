import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/produtos/types';
import { ProductCard } from './product-card';
import { SectionHeading } from './section-heading';

/**
 * A secao que a Home repete seis vezes — titulo a esquerda e uma faixa de
 * cartoes que rola na horizontal.
 *
 * ================== O QUE ESTA AQUI, E O QUE NAO ESTA ==================
 *
 * O `ProductCarousel` do original tem tres coisas a mais que este nao tem, e as
 * tres por motivo:
 *
 * **As setas `‹ ›`** dependem de `useEffect` para ler `scrollLeft` e decidir se
 * estao habilitadas. Num Componente de Servidor nao ha efeito; e o `onClick`
 * seria inerte. As setas do print sao um CONTROLE de uma faixa que ja rola por
 * toque e por roda — entao a faixa rola, e as setas entram quando este bloco
 * virar cliente (junto com o carrinho, que ja vai exigir `'use client'`).
 * **Isto esta registrado como pendencia**, e nao escondido: as setas do print
 * nao foram desenhadas.
 *
 * **O `VER TUDO`** e um `Link` REAL para `/categoria/<slug>` — ele existe, e nao
 * e enfeite. No original ele e um `<a href>`; aqui e um `Link` do Next.
 *
 * **A largura dos cartoes** e a do print: quatro e meio na tela larga (o print
 * `003953` mostra o quinto cartao cortado na borda). `w-[48%]` no celular,
 * `sm:w-[44%]`, `md:w-[31%]`, `lg:w-[23%]`.
 */
export function ProductCarousel({
  products,
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'Ver tudo',
  notice,
}: {
  products: Product[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  notice?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="mb-6 flex items-end justify-between gap-6 md:mb-8">
        <div className="flex-1">
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} align="left" />
          {notice && (
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-accent">{notice}</p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="hidden shrink-0 items-center gap-2 border-b border-foreground/40 pb-1 text-[11px] uppercase tracking-[0.18em] transition-all hover:gap-3 md:inline-flex"
          >
            {viewAllLabel} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>

      {/*
        A FAIXA. `overflow-x-auto` com o `[scrollbar-width:none]` esconde a barra
        de rolagem — e o que o original faz, e o print nao mostra barra nenhuma.
        O `snap-x` faz cada cartao parar alinhado.
      */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-6">
        {products.map((p) => (
          <div key={p.id} className="w-[48%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-[23%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {viewAllHref && (
        <div className="mt-6 text-center md:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 border-b border-foreground/40 pb-1 text-[11px] uppercase tracking-[0.18em]"
          >
            {viewAllLabel} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      )}
    </section>
  );
}
