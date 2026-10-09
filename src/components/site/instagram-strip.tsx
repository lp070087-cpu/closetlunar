import type { Product } from '@/lib/produtos/types';
import { SectionHeading } from './section-heading';

/**
 * `@CLOSETLUNAR — Siga-nos no Instagram` — a fileira de seis quadrados.
 *
 * ================== O ARROBA E O DO `getInstagram()` ==================
 *
 * O `eyebrow` sai de `getInstagram()`, cujo valor de demonstracao e
 * `@closetlunar` — com UM `n`, que e como a aba `Instagram` do painel escreve.
 * O rodape escreve `@closetlunnar` com DOIS — a divergencia ja registrada na
 * Fase 2 (`SiteFooter.instagram`). O print `004033` mostra este bloco com UM
 * (`@closetlunar`) e o print `004049` mostra o rodape com DOIS. **As duas
 * grafias sao transcritas como estao**, cada uma na sua fonte.
 *
 * ================== AS SEIS FOTOS SAO DE PRODUTO, E ISSO E DO ORIGINAL ==================
 *
 * O original pega `all[i].images[0]` — as seis primeiras fotos de produto — e as
 * poe num link com o icone do Instagram no hover. Nao ha dado de Instagram (nem
 * API, nem embutido): o bloco e uma VITRINE, e nao uma integracao. Por isso ele
 * funciona sem token e sem provider — e por isso nao viola a regra de
 * integracoes externas.
 *
 * Com menos de seis produtos com foto, o bloco mostra o que ha; sem nenhum, ele
 * nao desenha. Nao ha foto de banco preenchendo o vazio.
 */
export function InstagramStrip({
  products,
  usuario = '@closetlunar',
  url = 'https://instagram.com/closetlunar',
}: {
  products: Product[];
  usuario?: string;
  url?: string;
}) {
  const fotos = products.filter((p) => p.images[0]?.url).slice(0, 6);
  if (fotos.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <SectionHeading
        eyebrow={usuario.startsWith('@') ? usuario : `@${usuario}`}
        title="Siga-nos no Instagram"
        subtitle="Inspirações diárias, lançamentos e bastidores"
      />
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
        {fotos.map((p) => (
          <a
            key={p.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-xl bg-secondary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.images[0].url}
              alt={p.images[0].alt || p.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-all group-hover:bg-foreground/30">
              <span className="text-lg text-background opacity-0 transition-opacity group-hover:opacity-100">
                ◎
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
