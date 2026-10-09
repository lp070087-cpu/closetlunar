import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/site/product-card';
import { emPromocao } from '@/components/site/catalog-filters';
import { listCategories } from '@/lib/categorias/data';
import { listProducts } from '@/lib/produtos/data';
import type { Product } from '@/lib/produtos/types';

/**
 * `/categoria/[slug]` — a grade de uma categoria, e as duas VIRTUAIS.
 *
 * ================== AS DUAS CATEGORIAS QUE NAO EXISTEM NO ADMIN ==================
 *
 * O original (`categoria.$slug.tsx`, linha 16) trata `promocoes` e `novidades`
 * como categorias **virtuais**: elas nao estao na tabela `categories`, e a rota
 * as aceita de qualquer forma. E o que permite o menu (`Novidades`) e o CTA da
 * faixa escura (`Aproveitar promoções`) apontarem para uma pagina que EXISTE sem
 * criar uma categoria falsa no catalogo do admin.
 *
 * As regras sao as do original:
 *
 *   novidades  -> TODOS os produtos ativos, mais recentes primeiro
 *   promocoes  -> so os que tem `compareAtPrice > price`
 *
 * ================== NAO HA PRINT DESTA TELA ==================
 *
 * Os 14 prints cobrem so a Home. Aqui a fonte e o original — a hierarquia perde
 * o primeiro termo, como na tela `Afiliada` da Fase 2. Por isso **nao ha medida
 * de pixel**: a grade e `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (literal do
 * original), e nao um numero lido de captura.
 *
 * ================== O QUE ESTA DE FORA, E POR QUE ==================
 *
 * **A coluna de filtros** nao esta desenhada. Ela exige estado (marcar
 * tamanho/cor/preco re-renderiza a grade), e esta rota e um Componente de
 * Servidor. A CONTA do filtro ja existe e esta provada em
 * `components/site/catalog-filters.tsx`; falta so a casca de cliente, que entra
 * junto com o carrinho. Fica registrado — nao escondido.
 */
export async function generateStaticParams() {
  const { data } = await listCategories();
  return [
    ...data.map((c) => ({ slug: c.slug })),
    { slug: 'novidades' },
    { slug: 'promocoes' },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: categorias } = await listCategories();
  const c = categorias.find((x) => x.slug === slug);

  const nome = c?.name ?? (slug === 'promocoes' ? 'Promoções' : slug === 'novidades' ? 'Novidades' : slug);
  const titulo = c?.metaTitle || `${nome} — Closet Lunar`;
  const descricao =
    c?.metaDescription ||
    `Explore a coleção ${nome} da Closet Lunar — moda fitness feminina premium, com conforto e estilo.`;

  return {
    title: titulo,
    description: descricao,
    openGraph: { title: titulo, description: descricao, type: 'website' },
  };
}

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const virtual = slug === 'promocoes' || slug === 'novidades';

  const [{ data: categorias }, { data: produtos }] = await Promise.all([
    listCategories(),
    listProducts(),
  ]);

  const categoria = categorias.find((c) => c.slug === slug);
  if (!categoria && !virtual) notFound();

  const ativos = produtos.filter((p) => p.status === 'active');

  let lista: Product[];
  if (slug === 'promocoes') lista = ativos.filter(emPromocao);
  else if (slug === 'novidades') lista = [...ativos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  else lista = ativos.filter((p) => p.categoryId === categoria!.id);

  const titulo = categoria?.name ?? (slug === 'promocoes' ? 'Promoções' : 'Novidades');

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Início
          </Link>{' '}
          <span className="mx-2">/</span> <span>{titulo}</span>
        </nav>
        <h1 className="font-serif text-4xl italic md:text-5xl">{titulo}</h1>
        <div className="mx-auto mt-4 h-px w-16 bg-foreground/30" />
        {categoria?.introText && (
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {categoria.introText}
          </p>
        )}
      </div>

      {lista.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">Nenhuma peça encontrada com esses filtros.</p>
          <Link href="/" className="mt-4 inline-block text-sm underline">
            Ver toda a coleção
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-5 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {lista.length} {lista.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
            {lista.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
