'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Search, ShoppingBag, User, X } from 'lucide-react';
import { BotaoSacola } from './botao-sacola';
import { clientHref } from '@/lib/cliente/nav';

/**
 * O cabecalho do SITE PUBLICO — a barra preta de recados e a faixa branca com
 * logo, categorias, busca e os tres icones.
 *
 * ================== ELE SUBSTITUI O STAND-IN DO PAINEL DO CLIENTE ==================
 *
 * A Fase 2 criou `components/cliente/store-header.tsx` para a area da cliente
 * nao abrir no meio de uma pagina em branco. Aquele arquivo DIZ, no proprio
 * comentario, que nao pretende ser o cabecalho do site e que deve dar lugar a
 * ele quando o site publico existir. Este e esse cabecalho.
 *
 * A area da cliente CONTINUA com o header dela: ela e outra area, com os mesmos
 * recados e as mesmas categorias, e trocar o dela por este acoplaria a area da
 * cliente a um layout que nao e o dela. O que os dois compartilham e o DADO
 * (categorias, rodape), e nao o componente.
 *
 * ================== O QUE VEM DO PRINT, LITERALMENTE ==================
 *
 * Barra de recados (`003828`): `Frete grátis +R$299` · `10% OFF na primeira
 * compra com o cupom PRIMEIRA10` · `Primeira troca grátis`.
 *
 * Categorias (`003840`): Início · Novidades · Tops · Shorts · Leggings ·
 * Macaquinhos · Conjuntos. **O `Início` e o `Novidades` NAO sao categorias do
 * catalogo** — sao rotas (`/` e `/categoria/novidades`). As cinco do meio sao
 * categorias de verdade e vem de `listSiteCategories`, na ordem do painel — e
 * nao de uma lista escrita aqui, que divergiria no primeiro ajuste do admin.
 *
 * Busca e icones (`003840`): `Buscar produtos, categorias...`, depois conta,
 * coracao e sacola.
 */

/** Os tres avisos da faixa preta. O print os mostra lado a lado. */
const RECADOS = [
  'Frete grátis +R$299',
  '10% OFF na primeira compra com o cupom PRIMEIRA10',
  'Primeira troca grátis',
] as const;

/**
 * O menu — lido literalmente do `NAV` do original, e o original mostra
 * `NAV.slice(0, 7)`.
 *
 * ================== POR QUE OS SETE SAO FIXOS, E NAO LIDOS DO ADMIN ==================
 *
 * A tentacao era montar o menu a partir de `listSiteCategories()` — assim
 * renomear `Tops` no admin mudaria o site. **O original NAO faz isso**, e a
 * ordem dele desmente a do admin:
 *
 *   print / original : Tops, Shorts, Leggings, Macaquinhos, Conjuntos
 *   admin (`sortOrder`): Tops(1), Macaquinhos(2), Conjuntos(3), Shorts(4),
 *                        Leggings(6), ...
 *
 * Se o menu fosse gerado do `sortOrder`, ele sairia `Tops, Macaquinhos,
 * Conjuntos, Shorts, Leggings` — DIFERENTE do print. Obedecer ao painel aqui
 * seria trocar uma medida do material por uma inferencia, que e exatamente o
 * que a regra de prioridade proibe.
 *
 * O `Início` e o `Novidades` tambem NAO sao categorias do catalogo: apontam para
 * `/` e para a categoria de lancamentos, que nao existe na lista do admin. Por
 * isso os sete sao declarados aqui — e a divergencia com o `sortOrder` fica
 * registrada no `SITE-STATUS.md`, em vez de resolvida em silencio.
 */
const MENU = [
  { label: 'Início', href: '/' },
  { label: 'Novidades', href: '/categoria/novidades' },
  { label: 'Tops', href: '/categoria/tops' },
  { label: 'Shorts', href: '/categoria/shorts' },
  { label: 'Leggings', href: '/categoria/leggings' },
  { label: 'Macaquinhos', href: '/categoria/macaquinhos' },
  { label: 'Conjuntos', href: '/categoria/conjuntos' },
] as const;

export function SiteHeader({ cartHref }: { cartHref?: string } = {}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const dialog = menu.current;
    const trigger = menuButton.current;
    if (!menuOpen || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    const desktop = window.matchMedia('(min-width: 1280px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    closeOnDesktop();
    return () => {
      desktop.removeEventListener('change', closeOnDesktop);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.getClientRects().length) trigger.focus();
    };
  }, [menuOpen]);

  return (
    <>
      {/* Barra preta de recados. */}
      <div className="bg-foreground text-[10px] tracking-wide text-background md:text-[11px]">
        <div className="mx-auto flex items-center justify-center gap-3 px-4 py-2 text-center md:gap-6">
          <span className="whitespace-nowrap">{RECADOS[0]}</span>
          <span className="hidden opacity-50 md:inline" aria-hidden>
            •
          </span>
          <span className="hidden md:inline">{RECADOS[1]}</span>
          <span className="hidden opacity-50 md:inline" aria-hidden>
            •
          </span>
          <span className="hidden md:inline">{RECADOS[2]}</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full items-center gap-4 px-4">
          {/* O menu cobre celular e tablet, ate as categorias desktop aparecerem. */}
          <button
            ref={menuButton}
            type="button"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="store-mobile-menu"
            onClick={() => setMenuOpen(true)}
            className="focus-ring -ml-2 flex min-h-11 min-w-11 flex-col justify-center rounded-lg p-2 xl:hidden"
          >
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="mt-1 block h-0.5 w-5 bg-foreground" />
            <span className="mt-1 block h-0.5 w-5 bg-foreground" />
          </button>

          <Link href="/" className="focus-ring shrink-0 rounded font-serif text-xl tracking-tight md:text-3xl">
            Closet <span className="italic">Lunar</span>
          </Link>

          <nav aria-label="Categorias" className="ml-8 hidden items-center gap-6 text-sm xl:flex">
            {MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring rounded transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Busca — visivel a partir de `md`, como no original. */}
          <form action="/buscar" className="ml-auto hidden w-72 md:block">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                aria-label="Buscar produtos, categorias"
                placeholder="Buscar produtos, categorias..."
                className="focus-ring h-11 w-full rounded-full border border-transparent bg-secondary pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            {/*
              `hidden md:inline-flex` no icone de conta: o original o esconde
              abaixo de `md`. Sem isso o cabecalho estreito fica com um icone a
              mais do que a referencia mostra.
            */}
            <Link
              href={clientHref('')}
              aria-label="Minha Conta"
              className="focus-ring hidden rounded-full p-2 md:inline-flex"
            >
              <User className="size-5" aria-hidden />
            </Link>
            <Link
              href="/conta/favoritos"
              aria-label="Favoritos"
              className="focus-ring rounded-full p-2"
            >
              <Heart className="size-5" aria-hidden />
            </Link>
            {cartHref ? (
              <Link href={cartHref} aria-label="Sacola" className="focus-ring rounded-full p-2">
                <ShoppingBag className="size-5" aria-hidden />
              </Link>
            ) : <BotaoSacola />}
          </div>
        </div>
      </header>

      <dialog
        ref={menu}
        id="store-mobile-menu"
        aria-labelledby="store-mobile-menu-title"
        onCancel={() => setMenuOpen(false)}
        onClose={() => setMenuOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}
        className="m-0 h-dvh max-h-none w-[min(90vw,24rem)] max-w-none border-0 bg-background p-0 text-foreground shadow-elegant backdrop:bg-black/40"
      >
        <div className="flex min-h-full flex-col p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="store-mobile-menu-title" className="font-serif text-2xl">Closet <span className="italic">Lunar</span></h2>
            <button type="button" autoFocus aria-label="Fechar menu" onClick={() => setMenuOpen(false)} className="focus-ring flex size-11 items-center justify-center rounded-full">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <form action="/buscar" onSubmit={() => setMenuOpen(false)} className="mb-6 flex gap-2">
            <input type="search" name="q" aria-label="Buscar no menu" placeholder="Buscar produtos..." className="focus-ring min-w-0 flex-1 rounded-full border border-border bg-secondary px-4 py-3 text-sm" />
            <button type="submit" aria-label="Buscar" className="focus-ring rounded-full border border-border p-3"><Search className="size-5" aria-hidden /></button>
          </form>
          <nav aria-label="Categorias no celular" className="flex flex-col gap-1">
            {MENU.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={pathname === item.href ? 'page' : undefined} className="focus-ring rounded-xl px-4 py-3 text-sm hover:bg-secondary aria-[current=page]:bg-secondary">{item.label}</Link>)}
          </nav>
          <Link href={clientHref('')} onClick={() => setMenuOpen(false)} className="focus-ring mt-6 flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm"><User className="size-5" aria-hidden />Minha Conta</Link>
        </div>
      </dialog>
    </>
  );
}
