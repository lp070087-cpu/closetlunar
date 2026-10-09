import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { HeroSlide } from '@/lib/conteudo/types';

/**
 * O Hero — a faixa grande do topo da Home, com `CLOSET LUNAR` / `Nova coleção
 * fitness` / o subtitulo e o botao `VER COLEÇÃO`.
 *
 * ================== O TEXTO VEM DO ADMIN; A FOTO, DO PROPRIO MATERIAL ==================
 *
 * O `eyebrow`, o titulo, o subtitulo e o `ctaText` do slide ativo saem do
 * `listHeroSlides()` — o MESMO dado que o painel edita em `Conteúdo do Site`.
 * Escrever `Nova coleção fitness` aqui criaria uma segunda verdade.
 *
 * A FOTO entra por `imagemPadrao`, e nao do slide: o `imageDesktopUrl` da
 * demonstracao e `null` (o painel ainda nao subiu foto nenhuma), e uma foto
 * inventada por mim nao seria do material. A imagem padrao e uma das fotos
 * **da propria Closet Lunar** — a mesma que aparece no print `003828` (a modelo
 * de top nude e short preto `NIKE PRO`). Nao e uma imagem de banco: e a foto da
 * loja, escolhida porque E a que o material mostra. Quando o admin subir a foto
 * do slide, ela tem precedencia.
 *
 * ================== O QUE NAO ESTA AQUI ==================
 *
 * **As setas `‹ ›` e os pontinhos.** No original eles trocam o slide por
 * `useState`, e a troca automatica roda num `useEffect` de 5 segundos. Num
 * Componente de Servidor nao ha estado nem efeito. O print mostra as setas e os
 * pontinhos — entao fica REGISTRADO como pendencia, e nao escondido: eles entram
 * quando o hero virar cliente, junto com o carrinho. O slide 1, que e o unico
 * que os 14 prints mostram, aparece correto.
 *
 * Os outros slides nao sao descartados: eles sao renderizados em sequencia
 * abaixo (nao sobrepostos), para que o conteudo dos tres exista na pagina. E o
 * comportamento de uma faixa sem JavaScript, o que e honesto para um bloco que
 * so tem um slide provado por captura.
 */
export function Hero({
  slides,
  imagemPadrao = '/site/essencia.jpg',
}: {
  slides: HeroSlide[];
  imagemPadrao?: string;
}) {
  const ativos = slides
    .filter((s) => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const principal = ativos[0];
  if (!principal) return null;

  const foto = principal.imageDesktopUrl || imagemPadrao;
  const fotoMobile = principal.imageMobileUrl || foto;

  return (
    <section className="relative overflow-hidden bg-secondary" aria-roledescription="carousel">
      <div className="relative min-h-[500px] sm:min-h-[560px] md:min-h-[640px]">
        {/*
          A FOTO. `<picture>` com o mobile primeiro, como no original: a imagem
          de celular e um recorte vertical da mesma cena, e nao um segundo
          desenho.

          A foto cobre a faixa e o veu (`bg-gradient-to-r`) escurece a ESQUERDA,
          que e onde o texto entra — medido no print `003840`: o texto encosta em
          x=417 e a modelo esta na metade direita.
        */}
        <picture>
          {fotoMobile !== foto && <source media="(max-width: 767px)" srcSet={fotoMobile} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto}
            alt={principal.title}
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/20 md:from-background/80 md:via-background/40 md:to-transparent" />

        <div className="relative container mx-auto flex h-full min-h-[500px] items-center px-4 sm:min-h-[560px] md:min-h-[640px] md:px-8">
          <div className="max-w-xl space-y-4 py-12 md:space-y-6 md:py-24">
            <div className="text-[11px] uppercase tracking-[0.32em] text-foreground/70">
              {principal.eyebrow || 'Closet Lunar'}
            </div>
            <h1 className="font-serif text-3xl leading-[1.1] tracking-tight text-foreground drop-shadow-sm sm:text-5xl md:text-6xl md:leading-[1.04] lg:text-7xl">
              {principal.title}
            </h1>
            {principal.subtitle && (
              <p className="max-w-md text-base leading-relaxed text-foreground/75 md:text-lg">
                {principal.subtitle}
              </p>
            )}
            {principal.ctaText && principal.linkUrl && (
              <Link
                href={principal.linkUrl}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[10px] uppercase tracking-[0.18em] text-background shadow-elegant transition-all hover:gap-3 hover:bg-foreground/90 active:scale-95 md:px-8 md:py-4 md:text-sm"
              >
                {principal.ctaText} <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/*
        OS SLIDES SEGUINTES, em secoes proprias.
        Ver a nota do topo: sem estado nao ha sobreposicao. Cada um vira uma
        faixa; os dois do meio do material nao tem foto nem CTA, entao saem como
        faixas de texto — e nao como espacos vazios.
      */}
      {ativos.slice(1).map((s) => (
        <div key={s.id} className="border-t border-border/40 bg-secondary/60 px-4 py-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.32em] text-foreground/60">{s.eyebrow}</p>
          <p className="mt-2 font-serif text-2xl md:text-3xl">{s.title}</p>
          {s.subtitle && (
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{s.subtitle}</p>
          )}
        </div>
      ))}
    </section>
  );
}
