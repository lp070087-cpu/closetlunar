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
 * ================== O QUE NAO ESTA AQUI, E POR QUE ==================
 *
 * O original tem troca de imagem por clique, zoom por hover e navegacao por
 * toque — tudo com `useState` e `useRef`. Num Componente de Servidor nao ha
 * estado. Entao a galeria **mostra a primeira foto em tamanho grande e TODAS as
 * outras como miniaturas**, incluindo a primeira — assim nenhuma foto some, e a
 * bancada pode provar que a lista inteira esta na pagina. A troca entra quando o
 * bloco virar cliente, junto com o carrinho.
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
  if (images.length === 0) return null;
  const principal = images[0];

  return (
    <div className="flex flex-col gap-4 md:flex-row-reverse">
      <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-2xl bg-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={principal.url}
          alt={principal.alt || alt}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
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
        <div className="flex gap-3 md:w-24 md:flex-col">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl border border-border md:w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || alt}
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
