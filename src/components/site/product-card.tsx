'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { BotaoFavorito } from './botao-favorito';
import { mensagemDoGatilho, useContatoLoja, whatsappLinkFor } from '@/lib/site/whatsapp';
import { BotaoComprar } from './botao-comprar';
import { effectivePrice, discountPercent, strikethroughPrice } from '@/lib/produtos/metrics';
import type { Product } from '@/lib/produtos/types';
import { formatBRL } from '@/lib/utils';

/** Parcelamento oferecido pela loja (cartao, via InfinitePay). */
export const PARCELAS_SEM_JUROS = 3;

/**
 * O cartao de produto.
 *
 * - Foto 3:4; ao passar o mouse, troca para a 2a foto (costas/detalhe) se houver.
 * - Selos (-N%, Ultimas pecas / Destaque) a esquerda, favoritar a direita.
 * - Nome, tamanhos, preco (com riscado quando ha promo) e "ou 3x sem juros".
 * - Botoes Comprar e Duvidas pelo WhatsApp sempre alinhados no rodape do cartao.
 * As contas de preco/desconto vem de `lib/produtos/metrics` (as mesmas do admin).
 */
export function ProductCard({ product }: { product: Product }) {
  const contato = useContatoLoja();
  const whatsapp = contato.telefone;
  const preco = effectivePrice(product);
  const riscado = strikethroughPrice(product);
  const temDesconto = riscado !== null && riscado > preco;
  const desconto = temDesconto ? discountPercent(product.price, preco) : 0;
  const semEstoque = product.stock <= 0;

  const selos: { label: string; tom: 'escuro' | 'claro' }[] = [];
  if (desconto > 0) selos.push({ label: `-${desconto}%`, tom: 'escuro' });
  if (product.stock > 0 && product.stock <= 3) selos.push({ label: 'Últimas peças', tom: 'claro' });
  else if (product.featured) selos.push({ label: 'Destaque', tom: 'claro' });

  const foto = product.images[0];
  const verso = product.images[1];
  const ordem = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
  const tamanhos = [...product.sizes].sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
  const parcela = preco / PARCELAS_SEM_JUROS;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-background shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-border/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-elegant hover:ring-border">
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <Link href={`/produto/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          {foto ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={foto.alt || product.name}
                loading="lazy"
                decoding="async"
                className={
                  'absolute inset-0 size-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04] ' +
                  (verso ? 'group-hover:opacity-0' : '')
                }
              />
              {verso ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={verso.url}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full scale-[1.04] object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <span className="absolute inset-0 grid place-items-center font-serif text-6xl italic text-foreground/15">
              {product.name.charAt(0)}
            </span>
          )}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent" />
        </Link>

        {semEstoque && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full border border-border bg-background px-3 py-1.5 text-[10px] uppercase tracking-[0.2em]">
              Esgotado
            </span>
          </div>
        )}

        {selos.length > 0 && (
          <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-col items-start gap-1.5 md:left-3 md:top-3">
            {selos.slice(0, 2).map((s) => (
              <span
                key={s.label}
                className={
                  'max-w-full truncate rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] shadow-sm md:px-2.5 md:py-1 md:text-[10px] ' +
                  (s.tom === 'escuro' ? 'bg-foreground text-background' : 'bg-background/95 text-foreground')
                }
              >
                {s.label}
              </span>
            ))}
          </div>
        )}

        <BotaoFavorito
          produtoId={product.id}
          nome={product.name}
          className="absolute right-2 top-2 z-10 size-8 md:right-3 md:top-3 md:size-9"
        />
      </div>

      <div className="flex flex-1 flex-col p-3 md:p-4">
        <Link
          href={`/produto/${product.slug}`}
          className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-foreground transition-colors hover:text-accent md:text-sm"
        >
          {product.name}
        </Link>

        {tamanhos.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tamanhos.map((t) => (
              <span
                key={t}
                className="grid h-5 min-w-[1.5rem] place-items-center rounded-full bg-secondary/70 px-1.5 text-[10px] font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3">
          {temDesconto && (
            <span className="block text-[11px] text-muted-foreground line-through">{formatBRL(riscado!)}</span>
          )}
          <span className="block text-base font-semibold tracking-tight text-foreground md:text-lg">
            {formatBRL(preco)}
          </span>
          <span className="block text-[11px] leading-tight text-muted-foreground">
            ou {PARCELAS_SEM_JUROS}x de {formatBRL(parcela)} <span className="whitespace-nowrap">sem juros</span>
          </span>
        </div>

        <div className="mt-auto flex min-w-0 flex-col gap-1.5 pt-3 md:gap-2">
          <BotaoComprar product={product} className="w-full" />
          <a
            href={whatsappLinkFor(whatsapp, mensagemDoGatilho(contato.modelos, 'product_query', 'Olá! Vim pelo site da Closet Lunar e tenho uma dúvida sobre este produto.', { produto: product.name }))}
            aria-disabled={!whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-2 text-[10px] font-medium uppercase tracking-[0.06em] text-foreground transition-colors hover:border-[#25D366] hover:text-[#128C7E] md:h-10 md:gap-2 md:text-[11px] md:tracking-[0.12em]"
          >
            <MessageCircle className="size-3.5 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">
              <span className="md:hidden">Dúvidas</span>
              <span className="hidden md:inline">Tirar dúvida</span>
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}

