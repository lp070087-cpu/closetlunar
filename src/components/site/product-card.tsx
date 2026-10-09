import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import { BotaoComprar } from './botao-comprar';
import { effectivePrice, discountPercent, strikethroughPrice } from '@/lib/produtos/metrics';
import type { Product } from '@/lib/produtos/types';
import { formatBRL } from '@/lib/utils';

/**
 * O cartao de produto — o bloco que a Home repete seis vezes.
 *
 * ================== O DESENHO VEM DO PRINT; AS CONTAS, DO ADMIN ==================
 *
 * O print `003944` mostra o cartao inteiro: o selo `-10%` no canto, o `BEST
 * SELLER` abaixo dele, o coracao no canto oposto, a foto em 3:4, o nome, a
 * fileira de tamanhos (`P M G GG`), os pontos de cor, o `De R$ 200,00` riscado,
 * o `Por R$ 179,00`, o `ou 6x de R$ 29,83 sem juros` e os dois botoes.
 *
 * **Nenhuma dessas contas e feita aqui.** O desconto, o preco efetivo e o preco
 * riscado saem de `lib/produtos/metrics` — o MESMO modulo que o painel do admin
 * usa. Se o cartao calculasse o proprio desconto, o admin e o site poderiam
 * discordar sobre a porcentagem da mesma peca, e os dois numeros seriam
 * defensaveis. `discountPercent`, `effectivePrice` e `strikethroughPrice` ja
 * existiam; o site so os desenha.
 *
 * ================== OS SELOS, E POR QUE NAO HA "LANCAMENTO" ==================
 *
 * O original monta ate quatro selos: `-N%`, `Lançamento` (criado nos ultimos 30
 * dias), `Best Seller` (destaque) e `Ultimas pecas` (estoque <= 3), e mostra os
 * DOIS PRIMEIROS.
 *
 * Aqui nao ha `Lançamento`. Ele depende de `Date.now()` — um selo que muda
 * sozinho com o relogio, e que a bancada nao consegue provar (o mesmo defeito do
 * `cuponsValidos`, que a Fase 2 removeu do dashboard do cliente por depender do
 * relogio). O material tambem nao o mostra: nenhum print de site tem o selo
 * `LANÇAMENTO`. Ficam dois — `-N%` e `Best Seller` —, e o `Ultimas pecas` no
 * lugar do segundo quando o estoque e baixo, como no `-42%` riscado do print
 * `003936`.
 *
 * ================== O CORACAO E O `COMPRAR` NAO AGEM ==================
 *
 * O coracao leva para `/conta/favoritos`, que EXISTE (Fase 2): e um link real, e
 * nao um botao que finge salvar. O `COMPRAR` e o `TIRAR DUVIDA` sao botoes de
 * alvo: a sacola e o checkout entram com o carrinho persistido (Fase 4), e um
 * botao que fingisse adicionar seria a promessa que a regra de honestidade
 * proibe. O de WhatsApp e o unico dos dois que FAZ algo — abre o `wa.me`.
 */
export function ProductCard({ product }: { product: Product }) {
  const preco = effectivePrice(product);
  const riscado = strikethroughPrice(product);
  const desconto = riscoEfetivo(product) ? discountPercent(product.price, preco) : 0;
  const semEstoque = product.stock <= 0;

  const selos: { label: string; tom: 'escuro' | 'claro' }[] = [];
  if (desconto > 0) selos.push({ label: `-${desconto}%`, tom: 'escuro' });
  if (product.stock > 0 && product.stock <= 3) selos.push({ label: 'Últimas peças', tom: 'claro' });
  else if (product.featured) selos.push({ label: 'Best Seller', tom: 'claro' });

  const foto = product.images[0]?.url ?? '';
  const ordem = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
  const tamanhos = [...product.sizes].sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/40 bg-background shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1 hover:border-border hover:shadow-elegant md:rounded-2xl">
      <div className="relative block aspect-[3/4] overflow-hidden bg-secondary">
        <Link href={`/produto/${product.slug}`} aria-label={product.name}>
          {foto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={foto}
              alt={product.images[0]?.alt || product.name}
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
          ) : null}
        </Link>

        {semEstoque && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] uppercase tracking-[0.2em]">
              Produto indisponível
            </span>
          </div>
        )}

        {selos.length > 0 && (
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {selos.slice(0, 2).map((s) => (
              <span
                key={s.label}
                className={
                  'rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] backdrop-blur ' +
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

        <Link
          href="/conta/favoritos"
          aria-label={`Favoritar ${product.name}`}
          className="focus-ring absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-background/90 text-foreground shadow-soft transition-transform hover:scale-105"
        >
          <Heart className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-2 p-3 md:p-4">
        <Link
          href={`/produto/${product.slug}`}
          className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug transition-colors hover:text-accent md:text-sm"
        >
          {product.name}
        </Link>

        {tamanhos.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tamanhos.map((t) => (
              <span
                key={t}
                className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.id}
                title={c.name}
                style={{ backgroundColor: c.hex }}
                className="size-3.5 rounded-full border border-border/60 shadow-sm"
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{product.colors.length - 4}</span>
            )}
          </div>
        )}

        <div className="mt-1 flex flex-col gap-0.5">
          {riscado !== null && (
            <span className="text-[11px] text-muted-foreground line-through">
              De {formatBRL(riscado)}
            </span>
          )}
          <span className="text-base font-medium tracking-tight text-foreground md:text-lg">
            {riscado !== null ? 'Por ' : ''}
            {formatBRL(preco)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            ou 6x de {formatBRL(preco / 6)} sem juros
          </span>
        </div>

        <div className="mt-2 flex min-w-0 flex-col gap-1.5 md:gap-2">
          <BotaoComprar product={product} className="w-full" />
          <Link
            href={linkDuvida(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full border border-border bg-background py-2 text-[9px] font-medium uppercase leading-tight tracking-[0.08em] text-foreground transition-colors hover:border-foreground md:py-2.5 md:text-[11px] md:tracking-[0.15em]"
          >
            <MessageCircle className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">Tirar dúvida pelo WhatsApp</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Se ha desconto a exibir.
 *
 * O desconto percentual so faz sentido quando o preco riscado EXISTE e e maior
 * que o praticado. Sem esta guarda, um produto sem preco antigo produziria um
 * `-0%`, e um com promocional igual ao cheio produziria `-0%` tambem — dois
 * selos que o print nao tem.
 */
function riscoEfetivo(product: Pick<Product, 'price' | 'promoPrice' | 'compareAtPrice'>): boolean {
  const riscado = strikethroughPrice(product);
  return riscado !== null && riscado > effectivePrice(product);
}

/**
 * O link do `TIRAR DUVIDA PELO WHATSAPP`.
 *
 * A mensagem e a do fallback do original (`product_query`), com o nome e o preco
 * ja preenchidos — e o link do produto aponta para `/produto/<slug>`, que a Fase
 * 3 cria. Sem numero configurado, cai no `wa.me` puro, e nao num link quebrado.
 */
function linkDuvida(product: Product): string {
  const texto = encodeURIComponent(
    `Olá! Gostaria de tirar uma dúvida sobre o produto ${product.name}.`,
  );
  return `https://wa.me/?text=${texto}`;
}
