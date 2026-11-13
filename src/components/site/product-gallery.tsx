'use client';

import { useState } from 'react';
import type { ProductImage } from '@/lib/produtos/types';

/**
 * A galeria da pagina de produto — a foto grande a esquerda e as miniaturas.
 *
 * ================== NAO HA PRINT DESTA TELA ==================
 *
 * `/produto/[slug]` nao aparece em nenhum dos 14 prints (todos sao a Home). A
 * fonte e o `ProductGallery.tsx` do original, e a forma e a dele: a foto grande
 * em 3:4 com as miniaturas ao lado.
 *
 * Miniaturas sao botoes com selecao acessivel por teclado e toque. A foto
 * selecionada usa a mesma origem do catalogo. URLs indisponiveis mostram erro
 * explicito; nenhuma imagem de outro produto e usada como substituta.
 */
export function ProductGallery({
  images,
  alt,
  selos = [],
}: {
  images: ProductImage[];
  alt: string;
  selos?: { label: string; tom: 'escuro' | 'claro' }[];
}) {
  const [selectedId, setSelectedId] = useState(images[0]?.id);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (images.length === 0) return <div className="grid aspect-[3/4] place-items-center rounded-2xl bg-secondary text-sm text-muted-foreground"><span className="font-serif text-6xl italic text-foreground/15" aria-hidden>{alt.charAt(0)}</span></div>;
  const principal = images.find(image => image.id === selectedId) ?? images[0];

  return (
    <div className="flex flex-col gap-4 md:flex-row-reverse">
      <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-2xl bg-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {failedUrl !== principal.url ? <img
          src={principal.url}
          alt={principal.alt || alt}
          fetchPriority="high"
          decoding="async"
          onError={() => setFailedUrl(principal.url)}
          className="absolute inset-0 size-full object-cover"
        /> : <p role="status" className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">Não foi possível carregar esta fotografia.</p>}
        {selos.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {selos.slice(0, 2).map((s) => (
              <span
                key={s.label}
                className={
                  'rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ' +
                  (s.tom === 'escuro'
                    ? 'bg-foreground text-background'
                    : 'border border-border/60 bg-background/95 text-foreground')
                }
              >
                {s.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex max-w-full gap-3 overflow-x-auto pb-1 md:max-h-[38rem] md:w-24 md:shrink-0 md:flex-col md:overflow-y-auto" aria-label="Fotografias do produto">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedId(img.id)}
              aria-label={`Ver ${img.alt || alt}, foto ${images.indexOf(img) + 1}`}
              aria-pressed={principal.id === img.id}
              className="focus-ring relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl border border-border aria-pressed:border-foreground aria-pressed:ring-1 aria-pressed:ring-foreground md:w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || alt}
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
