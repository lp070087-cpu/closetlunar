import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { SiteCategory } from '@/lib/conteudo/types';

/**
 * CATEGORIAS da home — cartoes compactos com foto, todos do mesmo tamanho.
 *
 * - Mostra so categorias ativas que TEM produto (nada de pagina vazia).
 * - Foto: a imagem da categoria; sem ela, a capa do primeiro produto.
 * - Sempre fecha com o cartao "Novidades".
 * - Celular: faixa com rolagem lateral; desktop: grade centralizada.
 */
export interface CapaCategoria {
  imagem: string | null;
  quantidade: number;
}

export function CategoriesRow({
  categories,
  capas = {},
  novidadesImagem = null,
}: {
  categories: SiteCategory[];
  capas?: Record<string, CapaCategoria>;
  novidadesImagem?: string | null;
}) {
  const ativas = categories
    .filter((c) => c.isActive && (capas[c.id]?.quantidade ?? 0) > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const itens = [
    ...ativas.map((c) => ({
      href: `/categoria/${c.slug}`,
      nome: c.name,
      imagem: c.imageUrl || capas[c.id]?.imagem || null,
      detalhe: `${capas[c.id]?.quantidade ?? 0} ${capas[c.id]?.quantidade === 1 ? 'peça' : 'peças'}`,
    })),
    { href: '/categoria/novidades', nome: 'Novidades', imagem: novidadesImagem, detalhe: 'Ver tudo' },
  ];
  if (itens.length <= 1 && !novidadesImagem) return null;

  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground md:text-[11px]">Categorias</div>
          <h2 className="font-serif text-2xl italic md:text-4xl">Encontre seu estilo</h2>
        </div>
        <Link
          href="/buscar"
          className="hidden items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground transition hover:gap-2.5 hover:text-foreground sm:inline-flex"
        >
          Ver todos <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        <ul className="flex snap-x snap-mandatory gap-3 md:grid md:grid-cols-4 md:gap-5">
          {itens.map((c) => (
            <li key={c.href} className="w-[42%] shrink-0 snap-start sm:w-[30%] md:w-auto">
              <Link
                href={c.href}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-secondary shadow-soft ring-1 ring-border/40 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-elegant"
              >
                {c.imagem ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={c.imagem}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center font-serif text-5xl italic text-foreground/15">
                    {c.nome[0]}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white md:p-4">
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-lg leading-tight md:text-2xl">{c.nome}</span>
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-white/80 md:text-[11px]">{c.detalhe}</span>
                  </span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/90 text-foreground transition group-hover:translate-x-0.5 md:size-8">
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
