'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroSlide } from '@/lib/conteudo/types';

/**
 * O HERO da home — carrossel dos banners de `Conteudo do Site`.
 *
 * - Imagem (desktop/mobile via `<picture>`) ou VIDEO (mp4 mudo em loop, com o
 *   poster como primeira imagem). O video escolhe a versao pelo tamanho da tela.
 * - Troca sozinho a cada 7 s, pausa com o mouse em cima ou com a aba oculta, e
 *   nao anima quando o sistema pede movimento reduzido.
 * - O texto e HTML por cima (nitido em qualquer tela e editavel no painel).
 */
const INTERVALO = 7000;

export function Hero({ slides, imagemPadrao = '/site/essencia.jpg' }: { slides: HeroSlide[]; imagemPadrao?: string }) {
  const ativos = slides.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [reduzido, setReduzido] = useState(false);
  const [mobile, setMobile] = useState(false);
  const total = ativos.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mm = window.matchMedia('(max-width: 1023px)');
    const sync = () => {
      setReduzido(mq.matches);
      setMobile(mm.matches);
    };
    sync();
    mq.addEventListener('change', sync);
    mm.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      mm.removeEventListener('change', sync);
    };
  }, []);

  const ir = useCallback((i: number) => setAtual(((i % total) + total) % total), [total]);

  useEffect(() => {
    if (total < 2 || pausado || reduzido) return;
    const t = setTimeout(() => ir(atual + 1), INTERVALO);
    return () => clearTimeout(t);
  }, [atual, pausado, reduzido, total, ir]);

  // toque: arrastar para os lados
  const toque = useRef<number | null>(null);

  if (total === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-secondary"
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toque.current == null) return;
        const dx = e.changedTouches[0].clientX - toque.current;
        if (Math.abs(dx) > 50) ir(atual + (dx < 0 ? 1 : -1));
        toque.current = null;
      }}
    >
      <div className="relative min-h-[560px] lg:min-h-[640px]">
        {ativos.map((s, i) => (
          <Slide
            key={s.id}
            slide={s}
            ativo={i === atual}
            prioridade={i === 0}
            mobile={mobile}
            reduzido={reduzido}
            imagemPadrao={imagemPadrao}
            indice={i}
            total={total}
          />
        ))}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => ir(atual - 1)}
              aria-label="Banner anterior"
              className="focus-ring absolute left-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow-soft backdrop-blur transition hover:bg-background lg:grid"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => ir(atual + 1)}
              aria-label="Próximo banner"
              className="focus-ring absolute right-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow-soft backdrop-blur transition hover:bg-background lg:grid"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {ativos.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => ir(i)}
                  aria-label={`Ir para o banner ${i + 1}`}
                  aria-current={i === atual}
                  className={
                    'h-1.5 rounded-full transition-all duration-500 ' +
                    (i === atual ? 'w-8 bg-foreground' : 'w-3 bg-foreground/30 hover:bg-foreground/50')
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Slide({
  slide,
  ativo,
  prioridade,
  mobile,
  reduzido,
  imagemPadrao,
  indice,
  total,
}: {
  slide: HeroSlide;
  ativo: boolean;
  prioridade: boolean;
  mobile: boolean;
  reduzido: boolean;
  imagemPadrao: string;
  indice: number;
  total: number;
}) {
  const foto = slide.imageDesktopUrl || imagemPadrao;
  const fotoMobile = slide.imageMobileUrl || foto;
  const video = (mobile ? slide.videoMobileUrl : slide.videoDesktopUrl) || slide.videoDesktopUrl || null;
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (ativo && !reduzido) {
      v.currentTime = 0;
      void v.play().catch(() => undefined);
    } else v.pause();
  }, [ativo, reduzido, video]);

  const Titulo = prioridade ? 'h1' : 'h2';

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${indice + 1} de ${total}`}
      aria-hidden={!ativo}
      className={
        'absolute inset-0 transition-opacity duration-1000 ease-out ' +
        (ativo ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0')
      }
    >
      {video && !reduzido ? (
        <video
          ref={ref}
          key={video}
          src={video}
          poster={mobile ? fotoMobile : foto}
          muted
          loop
          playsInline
          preload={prioridade ? 'auto' : 'metadata'}
          aria-hidden
          className="absolute inset-0 size-full object-cover object-center"
        />
      ) : (
        <picture>
          {fotoMobile !== foto && <source media="(max-width: 1023px)" srcSet={fotoMobile} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto}
            alt=""
            fetchPriority={prioridade ? 'high' : 'auto'}
            loading={prioridade ? 'eager' : 'lazy'}
            className="absolute inset-0 size-full object-cover object-center"
          />
        </picture>
      )}

      {/* veu: no desktop clareia a esquerda (texto); no celular escurece a base */}
      <div className="absolute inset-0 hidden bg-gradient-to-r from-background/90 via-background/45 to-transparent lg:block" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:hidden" />

      <div className="relative container mx-auto flex h-full min-h-[560px] items-end px-5 pb-16 lg:min-h-[640px] lg:items-center lg:px-8 lg:pb-0">
        <div
          className={
            'max-w-xl space-y-3 transition-all duration-1000 lg:max-w-md lg:space-y-6 xl:max-w-lg ' +
            (ativo ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-4 opacity-0')
          }
        >
          <div className="text-[10px] uppercase tracking-[0.32em] text-white/85 lg:text-[11px] lg:text-foreground/70">
            {slide.eyebrow || 'Closet Lunar'}
          </div>
          <Titulo className="font-serif text-4xl leading-[1.05] tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl lg:text-foreground xl:text-7xl">
            {slide.title}
          </Titulo>
          {slide.subtitle && (
            <p className="max-w-md text-sm leading-relaxed text-white/85 lg:text-lg lg:text-foreground/75">
              {slide.subtitle}
            </p>
          )}
          {slide.ctaText && slide.linkUrl && (
            <Link
              href={slide.linkUrl}
              tabIndex={ativo ? 0 : -1}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground shadow-elegant transition-all hover:gap-3 active:scale-95 lg:bg-foreground lg:px-8 lg:py-4 lg:text-xs lg:text-background lg:hover:bg-foreground/90"
            >
              {slide.ctaText} <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
