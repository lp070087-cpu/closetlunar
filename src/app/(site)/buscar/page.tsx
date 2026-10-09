import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/site/product-card';
import { emPromocao } from '@/components/site/catalog-filters';
import { listCategories } from '@/lib/categorias/data';
import { buscarProdutos } from '@/lib/produtos/busca';
import { listProducts } from '@/lib/produtos/data';

export const metadata: Metadata = {
  title: 'Buscar — Closet Lunar',
  robots: { index: false, follow: true },
};

/**
 * `/buscar?q=` — os resultados, e as tres vitrines de sugestao.
 *
 * ================== SEM PRINT, FONTE = ORIGINAL ==================
 *
 * `/buscar` nao aparece nos 14 prints. A fonte e o `buscar.tsx` do original, e o
 * desenho e o dele: o titulo `Resultados`, a linha `Busca por: <termo>`, e — sem
 * resultado — as tres secoes `Mais procurados`, `Novidades` e `Promoções`.
 *
 * ================== O `more` DE BUSCA NAO ESTA AQUI ==================
 *
 * O original grava cada busca em `search_terms` (o analytics que a Fase 1
 * entregou em `lib/busca`). Aqui **nao ha escrita**: nao ha banco, e gravar uma
 * busca sem persistencia seria um registro que some. O `lib/busca` continua
 * lendo a tabela — que nascia de uma escrita que ainda nao existe. Fica
 * registrado: quando o Neon entrar, a busca passa a registrar por aqui.
 *
 * ================== A COLUNA DE FILTROS NAO ESTA DESENHADA ==================
 *
 * Pela mesma razao de `/categoria/[slug]`: ela exige estado. A CONTA esta pronta
 * em `components/site/catalog-filters.tsx`; falta a casca.
 */
export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const termo = (q ?? '').trim();

  const [{ data: produtos }, { data: categorias }] = await Promise.all([
    listProducts(),
    listCategories(),
  ]);

  const ativos = produtos.filter((p) => p.status === 'active');
  const encontrados = termo ? buscarProdutos(ativos, termo, categorias).map((r) => r.produto) : [];

  const populares = ativos.filter((p) => p.featured).slice(0, 8);
  const promocao = ativos.filter(emPromocao).slice(0, 8);
  const novidades = ativos.slice(0, 8);

  const sugestoes = [
    { titulo: 'Mais procurados', itens: populares },
    { titulo: 'Novidades', itens: novidades },
    { titulo: 'Promoções', itens: promocao },
  ].filter((s) => s.itens.length > 0);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-2 text-center font-serif text-3xl italic">Resultados</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        {termo ? (
          <>
            Busca por: <strong>{termo}</strong>
          </>
        ) : (
          'Digite no campo de busca para começar'
        )}
      </p>

      {encontrados.length === 0 ? (
        <div className="space-y-12">
          <div className="rounded-3xl border border-dashed border-border py-10 text-center">
            <p className="mb-2 font-serif text-2xl italic">
              Não encontramos produtos para sua busca.
            </p>
            <p className="text-sm text-muted-foreground">
              Tente outras palavras ou explore as sugestões abaixo.
            </p>
          </div>

          {sugestoes.map((s) => (
            <section key={s.titulo}>
              <div className="mb-4 flex items-end justify-between">
                <h2 className="font-serif text-2xl italic">{s.titulo}</h2>
                <Link
                  href="/"
                  className="text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ver mais
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                {s.itens.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <>
          <p className="mb-5 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {encontrados.length} {encontrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {encontrados.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
