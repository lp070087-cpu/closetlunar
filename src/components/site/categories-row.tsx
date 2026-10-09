import Link from 'next/link';
import type { SiteCategory } from '@/lib/conteudo/types';

/**
 * `Categorias — Encontre seu estilo` — a fileira de circulos.
 *
 * ================== A FOTO E OPCIONAL, E A LETRA NAO E ENFEITE ==================
 *
 * No print (`003921`) os cinco circulos sao: `Tops` com FOTO (um modelo de
 * bone e camiseta), `Macaquinhos` com a letra `M` num fundo bege, `Conjuntos`
 * com FOTO, `Shorts` com a letra `S` e `Leggings` com a letra `L`.
 *
 * Ou seja: **o material mostra os dois estados na mesma fileira.** Circulo sem
 * foto cai na INICIAL do nome, em serifada italica — e e o que o original faz
 * (`c.name[0]`). Nao ha, portanto, duas telas a inventar: ha um componente que
 * desenha a foto quando ela existe e a letra quando nao existe.
 *
 * A ordem e a do `sortOrder`, e nao a do menu: aqui o admin manda, e a fileira
 * sai `Tops, Macaquinhos, Conjuntos, Shorts, Leggings` — a mesma do print, que
 * por acaso coincide com o `sortOrder` (ao contrario do MENU do cabecalho, cuja
 * ordem vem do `NAV` fixo do original — ver a nota em `site-header.tsx`).
 */
export function CategoriesRow({ categories }: { categories: SiteCategory[] }) {
  const ativas = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (ativas.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-14">
      <div className="mb-10 text-center">
        <div className="mb-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Categorias
        </div>
        <h2 className="font-serif text-3xl italic md:text-4xl">Encontre seu estilo</h2>
      </div>

      {/* Celular: faixa que rola na horizontal, centrada quando cabe. */}
      <div className="-mx-4 px-4 md:hidden">
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex gap-5">
            {ativas.map((c) => (
              <Item key={c.id} c={c} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: fileira centrada, com o espacamento do print. */}
      <div className="mx-auto hidden max-w-5xl flex-wrap justify-center gap-x-10 gap-y-10 md:flex lg:gap-x-14">
        {ativas.map((c) => (
          <Item key={c.id} c={c} />
        ))}
      </div>
    </section>
  );
}

function Item({ c }: { c: SiteCategory }) {
  return (
    <Link href={`/categoria/${c.slug}`} className="group w-24 shrink-0 text-center md:w-32">
      <div className="mx-auto aspect-square w-24 overflow-hidden rounded-full bg-secondary shadow-soft transition-all group-hover:shadow-elegant md:w-32">
        {c.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={c.imageUrl}
            alt={c.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid size-full place-items-center font-serif text-2xl italic text-muted-foreground">
            {c.name[0]}
          </div>
        )}
      </div>
      <div className="mt-4 text-sm font-medium tracking-wide transition-colors group-hover:text-accent">
        {c.name}
      </div>
    </Link>
  );
}
