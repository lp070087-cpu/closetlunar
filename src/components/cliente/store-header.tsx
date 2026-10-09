import Link from 'next/link';
import { Heart, Search, ShoppingBag, User } from 'lucide-react';

/**
 * O cabecalho da LOJA — a barra preta de recados e a faixa branca com logo,
 * categorias, busca e icones.
 *
 * ================== POR QUE ELE ESTA AQUI, E NAO NO SITE PUBLICO ==================
 *
 * As nove telas da area da cliente sao paginas da LOJA: no original elas ficam
 * dentro do layout raiz, que injeta o mesmo `Header` de todas as outras rotas.
 * Por isso ele aparece nos prints — `cli-001` mostra os recados e as
 * categorias, e `cli-006` mostra a caixa de busca `Buscar produtos,
 * categorias...`.
 *
 * O site publico (fase 3) NAO comeca agora, e este componente nao pretende ser
 * ele. Ele existe para a area da cliente nao abrir no meio de uma pagina em
 * branco, e o que esta escrito nele e o que os PRINTS mostram. Quando o site
 * publico existir, este cabecalho deve dar lugar ao dele — e o comentario fica
 * aqui para que a substituicao seja obvia e nao vire uma duplicata.
 *
 * ================== O QUE VEM DO PRINT, LITERALMENTE ==================
 *
 * Barra de recados (`cli-001`): `Frete grátis +R$299` · `10% OFF na primeira
 * compra com o cupom PRIMEIRA10` · `Primeira troca grátis`.
 *
 * Categorias, lidas da faixa `cli-001`: Início · Novidades · Tops · Shorts ·
 * Leggings · Macaquinhos · Conjuntos (as sete primeiras do menu da loja — o
 * print corta na oitava, e o original tambem mostra as sete primeiras em
 * desktop).
 *
 * Busca e icones (`cli-006`): `Buscar produtos, categorias...`, depois os
 * icones de conta, coracao e sacola.
 *
 * ================== OS LINKS ==================
 *
 * Categorias e busca apontam para `/` — a loja publica, que ainda nao existe.
 * E `href` REAL, e nao `#`: a rota existe (o `app/` tem raiz) e nao ha link
 * morto. O link de `Minha Conta` aponta para `/conta`, que e a propria area —
 * ali o cabecalho nao leva a lugar nenhum de novo, e isso e o comportamento
 * correto.
 */
const RECADOS = ['Frete grátis +R$299', '10% OFF na primeira compra com o cupom PRIMEIRA10', 'Primeira troca grátis'];

const CATEGORIAS = ['Início', 'Novidades', 'Tops', 'Shorts', 'Leggings', 'Macaquinhos', 'Conjuntos'];

export function StoreHeader() {
  return (
    <>
      {/* Barra preta de recados. O print repete os tres avisos em sequencia. */}
      <div className="bg-foreground text-[10px] tracking-wide text-background md:text-[11px]">
        <div className="mx-auto flex items-center justify-center gap-3 px-4 py-2 text-center md:gap-6">
          <span className="whitespace-nowrap">{RECADOS[0]}</span>
          <span className="hidden opacity-50 md:inline" aria-hidden>•</span>
          <span className="hidden md:inline">{RECADOS[1]}</span>
          <span className="hidden opacity-50 md:inline" aria-hidden>•</span>
          <span className="hidden md:inline">{RECADOS[2]}</span>
        </div>
      </div>

      <header className="border-b border-border bg-background/95 backdrop-blur">
        {/*
          Sem teto de largura: `container mx-auto px-4`, que e literalmente o
          que o original declara (`Header.tsx`, linha 41). O `container` padrao
          do Tailwind so limita acima de `2xl`, que e mais largo do que a
          captura cobre — entao ate esse ponto ele e simplesmente a largura
          toda, e o conteudo fica centralizado com o recuo de 16 px.

          Medido na captura `cli-001`: o conteudo do header vai de x=517 a
          x=2011, com centro em 1264 — e o centro da imagem e 1265. Ou seja, o
          que governa a posicao aqui e a CENTRALIZACAO da faixa inteira, e nao
          um teto de largura: o conteudo nao encosta em nenhuma das bordas
          porque o que sobra e distribuido para os dois lados.
        */}
        <div className="mx-auto flex h-20 w-full items-center gap-4 px-4">
          {/* Menu — so em tela estreita; em desktop as categorias ja aparecem. */}
          {/*
            `md:hidden`, e NAO `lg:hidden`: e o que o original declara. A
            diferenca importa — as categorias so aparecem a partir de `lg`
            (`hidden lg:flex`), entao um botao de menu que so sumisse em `lg`
            deixaria a faixa entre `md` e `lg` sem menu E sem categorias: a
            navegacao da loja sumiria justamente na largura de um tablet.
          */}
          <button
            type="button"
            aria-label="Abrir menu"
            className="focus-ring -ml-2 rounded-lg p-2 md:hidden"
          >
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="mt-1 block h-0.5 w-5 bg-foreground" />
            <span className="mt-1 block h-0.5 w-5 bg-foreground" />
          </button>

          <Link href="/" className="focus-ring shrink-0 rounded font-serif text-xl tracking-tight md:text-3xl">
            Closet <span className="italic">Lunar</span>
          </Link>

          <nav aria-label="Categorias" className="ml-8 hidden items-center gap-6 text-sm lg:flex">
            {CATEGORIAS.map((categoria) => (
              <Link
                key={categoria}
                href="/"
                className="focus-ring rounded transition-colors hover:text-accent"
              >
                {categoria}
              </Link>
            ))}
          </nav>

          {/* Busca — visivel a partir de `md`, como no original. */}
          <div className="ml-auto hidden w-72 md:block">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                readOnly
                aria-label="Buscar produtos, categorias"
                placeholder="Buscar produtos, categorias..."
                className="focus-ring h-11 w-full rounded-full border border-transparent bg-secondary pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            {/*
              `hidden md:inline-flex` no icone de conta: o original o esconde
              abaixo de `md`, porque no celular a conta e alcancada por outro
              caminho. Sem isso o cabecalho estreito fica com um icone a mais
              do que a referencia mostra.
            */}
            <Link
              href="/conta"
              aria-label="Minha Conta"
              className="focus-ring hidden rounded-full p-2 md:inline-flex"
            >
              <User className="size-5" aria-hidden />
            </Link>
            <Link href="/conta/favoritos" aria-label="Favoritos" className="focus-ring rounded-full p-2">
              <Heart className="size-5" aria-hidden />
            </Link>
            <Link href="/" aria-label="Carrinho" className="focus-ring rounded-full p-2">
              <ShoppingBag className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
