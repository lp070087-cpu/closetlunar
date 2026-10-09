'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { listFavoritos } from '@/lib/cliente/data';
import type { FavoritoCliente } from '@/lib/cliente/types';
import { formatBRL } from '@/lib/utils';
import { ClientPageHeader } from './client-page-header';

/**
 * `Favoritos` — `/conta/favoritos`, o print `cli-007` (`004717`).
 *
 * ================== O TITULO E `Favoritos`, E NAO `Meus Favoritos` ==================
 *
 * A coluna de navegacao escreve `Meus Favoritos`; a TELA escreve `Favoritos`. Os
 * dois rotulos existem no material, em lugares diferentes, e os dois foram
 * reproduzidos onde aparecem: o item de menu em `lib/cliente/nav.ts`, e o titulo
 * do painel aqui. O original confirma — `conta.favoritos.tsx` escreve
 * `<h2 className="font-serif text-3xl mb-8">Favoritos</h2>`, enquanto a casca
 * (`AccountLayout.tsx`) escreve `Meus Favoritos`. Ver a divergencia registrada
 * em `PAINEL-CLIENTE-STATUS.md`.
 *
 * ================== O `mb-8` SO EXISTE AQUI, E FOI PARA O CABECALHO ==================
 *
 * `conta.favoritos.tsx` e a UNICA tela desta area cujo `<h2>` declara margem
 * inferior propria (`mb-8`); `Pedidos`, `Cupons`, `Dados da Conta` e `Seguranca`
 * escrevem o `<h2>` sem margem nenhuma. O `ClientPageHeader` ja carrega o espaco
 * padrao entre titulo e conteudo, entao o `mb-8` nao pode ser somado por fora:
 * ele seria um segundo espaco, e o print mostra UM. A classe entra no cabecalho
 * via `className`, e a nota existe para a proxima tela saber por que esta e
 * diferente das outras.
 *
 * ================== O ESTADO VAZIO E O DO PRINT, LINHA POR LINHA ==================
 *
 * O unico estado que a referencia desta tela mostra e o VAZIO:
 *
 *   [ bloco tracejado, raio grande, centralizado ]
 *     [ circulo ]            <- com o coracao claro dentro
 *     `Sua lista de favoritos está vazia.`
 *     `[ EXPLORAR A LOJA ]`  <- botao preto
 *
 * A lista NAO e vazia por falta de dado: e a resposta certa. O print mostra a
 * tela assim porque `wishlist` comeca sem linha, e escrever aqui produtos
 * "provaveis" faria a tela mentir sobre o banco — a mesma decisao que o modulo
 * Favoritos do admin ja tomou (`lib/favoritos/demo.ts`). Ver `data.ts`.
 *
 * ================== A TINTA DO `beige` NAO FOI REPRODUZIDA ==================
 *
 * O original declara `bg-beige/5` na caixa e `bg-beige/20` no circulo. O `beige`
 * do projeto original e `oklch(0.95 0.018 70)` — um champagne de 95% de
 * luminosidade. A 5% sobre branco isso da (255,254,254), e a 20% da
 * (253,251,249): uma tinta de 1 a 2 unidades, que a captura NAO mostra. A
 * amostragem do print confirma: o interior da caixa e **branco puro
 * (255,255,255)**, e o circulo tambem (media (255,255,255) dentro e fora dele).
 * O projeto `closet-lunnar` tambem nao tem o token `beige`.
 *
 * Entao a caixa fica sem fundo, e o circulo usa `bg-secondary/40` — o mesmo
 * desenho e a mesma tinta que o navegador pinta para `beige/20`, ja que
 * `--secondary` e `33 30% 95%`, o mesmo 95% de luminosidade. Nao se cria um token
 * novo para reproduzir uma tinta que o material nao mostra; a FORMA (raio,
 * tracejado, circulo, icone claro) e que e transcrita. E a mesma conversao ja
 * usada no vazio de `Pedidos` (`orders-view.tsx`) — o original escreve os dois
 * blocos identicos.
 *
 * ================== O BOTAO LEVA PARA A HOME ==================
 *
 * `Explorar a loja` aponta para `/`, como o original (`<Link to="/">`). Quando a
 * Fase 3 chegar, `/` deixa de ser o placeholder e passa a ser a vitrine, e o
 * destino ja esta certo. Nao se aponta para uma rota de produto inventada.
 *
 * ================== O ESTADO CHEIO E DO ORIGINAL, NAO DO PRINT ==================
 *
 * O print `cli-007` nao mostra favorito nenhum, e por isso a GRADE nao tem como
 * ser conferida contra pixel. Mas o original desenha a grade por extenso, e a
 * regra de prioridade diz que o comportamento comprovado pelo original se
 * preserva — o que nao se inventa e a APARENCIA que nenhuma fonte mostra. Aqui a
 * aparencia tambem vem do original (cartao, foto `aspect-[3/4]`, botao de
 * remover, nome, preco e os dois botoes), entao o ramo inteiro e transcricao.
 *
 * As ACOES do ramo cheio dependem de dois contratos que ainda NAO existem nesta
 * fase — o carrinho (`useCart`) e a propria remocao (`useWishlist`), ambos da
 * LOJA. Recriar um `useCart` local seria a segunda implementacao do mesmo
 * conceito, que a Fase 4 proibe. Entao os botoes aparecem com a forma e o texto
 * do original e ficam SEM handler, anotados como pendencia — mesmo tratamento
 * dado aos dois botoes de `PedidoCard`, que no original tambem nao tem `onClick`.
 * Quando a Fase 3 trouxer a loja, estas acoes ligam nela e nao numa copia aqui.
 *
 * ================== A IMAGEM: `<img>`, E NAO `next/image` ==================
 *
 * O projeto nao usa `next/image` em lugar nenhum — nem no admin. E como a loja
 * publica so entra na Fase 3, o `next.config` ainda nao declara os dominios
 * remotos; `next/image` quebraria na primeira foto de outro host. O original
 * tambem escreve `<img>`. Cada uso leva o `eslint-disable-next-line` de
 * `@next/next/no-img-element`, que e o padrao ja adotado no admin.
 */
export function FavoritesView() {
  const [favoritos, setFavoritos] = useState<FavoritoCliente[] | null>(null);

  useEffect(() => {
    let ativo = true;
    void listFavoritos().then(({ data }) => {
      if (ativo) setFavoritos(data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!favoritos) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div>
      <ClientPageHeader titulo="Favoritos" className="mb-8" />

      {favoritos.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border p-16 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-secondary/40">
            {/*
              `text-muted-foreground/40` e do original: o coracao e um desenho de
              fundo, e nao um alerta. Medido no print, a tinta e (195,192,190).
            */}
            <Heart className="size-8 text-muted-foreground/40" aria-hidden />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Sua lista de favoritos está vazia.
          </p>
          <Link
            href="/"
            className="focus-ring mt-6 inline-block rounded-xl bg-foreground px-8 py-3 text-xs font-bold uppercase tracking-widest text-background transition-all hover:opacity-90"
          >
            Explorar a loja
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {favoritos.map((favorito) => (
            <div
              key={favorito.id}
              className="group overflow-hidden rounded-3xl border border-border bg-background shadow-sm transition-all hover:border-foreground/30"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30">
                <Link
                  href={`/produto/${favorito.slug}`}
                  className="flex h-full w-full items-center justify-center"
                  aria-label={favorito.nome}
                >
                  {favorito.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={favorito.imagem}
                      alt={favorito.nome}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <Heart className="size-8 text-muted-foreground/30" aria-hidden />
                  )}
                </Link>

                {/*
                  O botao de remover. Sem `onClick` — a remocao e da wishlist da
                  LOJA, que ainda nao existe nesta fase (ver a nota do topo).
                  `text-rose-600` do original vira `text-danger`, a mesma
                  conversao ja feita para o desconto de `PedidoCard`.
                */}
                <button
                  type="button"
                  className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/80 text-danger shadow-md backdrop-blur transition-all hover:bg-danger hover:text-background"
                  aria-label="Remover"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>

              <div className="flex h-[180px] flex-col p-5">
                <div className="flex-1">
                  <Link
                    href={`/produto/${favorito.slug}`}
                    className="line-clamp-2 block font-bold tracking-tight text-foreground hover:underline"
                  >
                    {favorito.nome}
                  </Link>
                  <p className="mt-2 font-serif text-xl">{formatBRL(favorito.preco)}</p>
                </div>

                {/*
                  Os dois botoes existem com a forma do original e ficam como
                  alvo, sem handler — ver a nota do topo. `hover:bg-beige/50` do
                  original vira `hover:bg-secondary/50`, pela mesma razao do
                  vazio: e a tinta equivalente, e o projeto nao tem `beige`.
                */}
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-secondary/50"
                  >
                    <ShoppingBag className="size-4" aria-hidden /> Carrinho
                  </button>
                  <button
                    type="button"
                    className="h-11 rounded-xl bg-foreground text-[10px] font-bold uppercase tracking-widest text-background transition-all hover:opacity-90"
                  >
                    Comprar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
