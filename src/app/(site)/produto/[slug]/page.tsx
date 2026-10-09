import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { ComprarProduto } from '@/components/site/comprar-produto';
import { ProductCard } from '@/components/site/product-card';
import { ProductGallery } from '@/components/site/product-gallery';
import { discountPercent, effectivePrice, strikethroughPrice } from '@/lib/produtos/metrics';
import { listProducts } from '@/lib/produtos/data';
import type { Product } from '@/lib/produtos/types';
import { formatBRL } from '@/lib/utils';

/**
 * `/produto/[slug]` — a pagina do produto.
 *
 * ================== NAO HA PRINT DESTA TELA, E ISSO MUDA A FONTE ==================
 *
 * Os 14 prints cobrem so a Home. Aqui a fonte e o `produto.$slug.tsx` do
 * original, e a hierarquia perde o primeiro termo — como na tela `Afiliada` da
 * Fase 2. **Nao ha medida de pixel**: os tamanhos das coisas vem das CLASSES do
 * original.
 *
 * ================== AS CONTAS SAO DO ADMIN ==================
 *
 * `effectivePrice`, `strikethroughPrice` e `discountPercent` vem de
 * `lib/produtos/metrics` — o mesmo modulo que o painel usa. O `Pix (5% off)` do
 * original NAO esta aqui: ele e uma promessa de desconto no pagamento, e nao ha
 * gateway definido (ver `GATEWAY A DEFINIR`). Anunciar 5% de desconto que o
 * checkout nao aplica seria a promessa que a regra de honestidade proibe.
 *
 * ================== O QUE NAO ESTA AQUI, E POR QUE ==================
 *
 * **Escolher tamanho/cor e quantidade** exige estado (mudam o preco por
 * variacao, o estoque e a sacola). A PDP e um Componente de Servidor, entao os
 * tamanhos e as cores aparecem como SELETORES VISIVEIS — mostrando os valores —
 * mas sem selecao. O `ADICIONAR AO CARRINHO` e o `Comprar pelo WhatsApp` sao
 * botoes de alvo (o segundo e um link `wa.me` real). Tudo isso entra junto com o
 * carrinho, e fica registrado.
 *
 * **`Ver no Avatar` e a `Tabela de Medidas`** dependem do provador (Fase 6) e da
 * matriz de `lib/tamanhos`. Ficam de fora, registrados.
 */
export async function generateStaticParams() {
  const { data } = await listProducts();
  return data.filter((p) => p.status === 'active').map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await listProducts();
  const p = data.find((x) => x.slug === slug);
  if (!p) return { title: 'Produto | Closet Lunar' };

  const descricao =
    (p.description || 'Peça premium da Closet Lunar — moda fitness feminina com caimento impecável.').slice(
      0,
      157,
    );
  return {
    title: p.name,
    description: descricao,
    openGraph: {
      title: p.name,
      description: descricao,
      type: 'website',
      images: p.images[0]?.url ? [p.images[0].url] : undefined,
    },
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: produtos } = await listProducts();
  const produto = produtos.find((p) => p.slug === slug && p.status === 'active');
  if (!produto) notFound();

  const preco = effectivePrice(produto);
  const riscado = strikethroughPrice(produto);
  const temDesconto = riscado !== null && riscado > preco;
  const desconto = temDesconto ? discountPercent(produto.price, preco) : 0;

  const selos: { label: string; tom: 'escuro' | 'claro' }[] = [];
  if (desconto > 0) selos.push({ label: `-${desconto}%`, tom: 'escuro' });
  if (produto.stock > 0 && produto.stock <= 3) selos.push({ label: 'Últimas peças', tom: 'claro' });
  else if (produto.featured) selos.push({ label: 'Best Seller', tom: 'claro' });

  /*
    A grade de `Voce tambem pode gostar` — os destaques, menos a propria peca.
    O original usa `SmartSuggestions`, que ordena por afinidade lida do banco e
    do historico da cliente. Sem banco, o criterio honesto e o destaque: e o
    mesmo `featured` que a Home ja usa, e nao um "recomendado para voce" que nao
    foi calculado.
  */
  const relacionados = produtos
    .filter((p) => p.status === 'active' && p.id !== produto.id && p.featured)
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-10">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Início
        </Link>{' '}
        <span className="mx-2">/</span>
        <Link href="/buscar" className="transition-colors hover:text-foreground">
          Produtos
        </Link>{' '}
        <span className="mx-2">/</span> <span>{produto.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={produto.images} alt={produto.name} selos={selos} />

        <div>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">{produto.name}</h1>

          <div className="mt-4">
            {temDesconto && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {formatBRL(riscado)}
                </span>
                <span className="text-xs font-semibold text-danger-foreground">-{desconto}%</span>
              </div>
            )}
            <div className="text-3xl font-medium">{formatBRL(preco)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              ou 6x de <span className="font-medium text-foreground">{formatBRL(preco / 6)}</span> sem
              juros
            </div>
          </div>

          {/* Estoque, com as tres faixas do original. */}
          <div className="mt-4 text-xs">
            {produto.stock <= 0 ? (
              <span className="font-medium text-danger-foreground">Esgotado</span>
            ) : produto.stock <= 5 ? (
              <span className="text-warning-foreground">
                Apenas {produto.stock} {produto.stock === 1 ? 'peça' : 'peças'} em estoque
              </span>
            ) : (
              <span className="text-success-foreground">Em estoque</span>
            )}
          </div>

          {produto.description && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{produto.description}</p>
          )}

          <ComprarProduto product={produto} />

          <div className="mt-8 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <Truck className="size-4" aria-hidden /> Frete grátis acima de R$299
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="size-4" aria-hidden /> Primeira troca grátis em até 7 dias
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4" aria-hidden /> Pagamento 100% seguro
            </div>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-serif text-2xl italic md:text-3xl">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {relacionados.map((p) => (
              <ProductCard key={p.id} product={p as Product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
