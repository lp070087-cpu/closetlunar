# SITE-STATUS — Fase 3

Arquivo de retomada. Mantido **compacto** e atualizado a cada modulo.

## Cabecalho

- Projeto: `closet-lunnar`
- Fase: **3 — Site publico / e-commerce**
- Rota base: **`/`** (comprovada pela barra de URL do print `004041`)
- Prints: **14 arquivos, TODOS da Home** (ver `MAPA-SITE.md`)
- Admin (Fase 1): **ENCERRADO**, nao alterado
- Painel do cliente (Fase 2): **ENCERRADO e auditado** (13/13 modulos,
  `bench-cliente-auditoria.mjs` 38/38), nao alterado
- Typecheck da fase ate agora: **EXIT=0**

## Modulos

| # | Modulo | Rota(s) | Status |
| - | ------ | ------- | ------ |
| 1 | Casca (header + footer + layout + WhatsApp) | todas | **PRONTO** |
| 2 | Cartoes e carrossel (ProductCard/Carousel/SectionHeading) | — | **PRONTO** |
| 3 | Home (as 14 capturas) | `/` | **PRONTO** |
| 4 | Categoria + produto | `/categoria/[slug]`, `/produto/[slug]` | **PRONTO** |
| 5 | Checkout + favoritos + busca | `/checkout`, `/favoritos`, `/buscar` | a fazer |
| 6 | Secundarias + SEO | `/sobre`, `/blog`, `/look/[token]`, `/pedido-confirmado/[orderId]`, `/robots.txt`, `/sitemap.xml` | **PRONTO** |
| 7 | Auditoria final do site | — | **PRONTO** (24/24) |

## Auditoria final da FASE 3

`bench-site-auditoria.mjs` — **24/24**. Ela nao remede a Home: as 14 capturas
foram conferidas na construcao, e **nao ha medida de pixel nesta fase** (os
prints cobrem UMA rota; as outras oito vem do original, como a tela `Afiliada`
da Fase 2). O que ela prova e o CONJUNTO:

1. **Fechamento das rotas** — as nove rotas do disco mais os dois handlers de
   arquivo; todo destino literal do codigo resolve numa rota que existe.
2. **Nenhum link falso** — varredura de todo `href`: nenhum `#` sozinho, nenhum
   caminho sem rota.
3. **Reuso dos dominios** — o unico modulo proprio do site e a sacola
   (`lib/site/carrinho`); produtos, conteudo e categorias vem de `@/lib`. Nenhum
   tipo de dominio redeclarado — nao ha um segundo catalogo.
4. **A fronteira** — nenhum cliente de banco, nenhum `process.env`, nenhum dos
   quatro padroes de segredo.
5. **Provas ao contrario** — ausentes: `ModulePage`, `TODO`, `Lorem ipsum`, `em
   construc`, `bg-beige`, `overflow-x-hidden`, cor crua fora da excecao.
6. **A honestidade** — nenhuma afirmacao de integracao que nao existe; o
   checkout AVISA que o gateway nao foi definido; o modal do cupom AVISA que o
   cadastro entra na integracao.
7. **O STATUS contra o disco** — 22 componentes.

**Tres falhas de INSTRUMENTO na primeira rodada** (nunca de projeto): o walker de
rotas perdia o prefixo do caminho (colhia so o nome do arquivo), o que fazia
`href="/"` parecer falso; e a prova de cor hexadecimal nao previa a excecao da
marca do WhatsApp (`#25D366`). As tres foram do instrumento.

## Validacao da fase

- **TYPECHECK** `node node_modules/typescript/bin/tsc --noEmit` -> **EXIT=0**
- **BUILD** `npm run build` -> **FALHA AMBIENTAL**:
  `Failed to load SWC binary for linux/x64` / `Attempted to load
  @next/swc-linux-x64-gnu, but it was not installed`. O projeto foi instalado no
  Windows e o binario do SWC para linux/x64 nao esta no `node_modules`; nao roda
  no sandbox (ver `project_sandbox_next_build`). **Nao e erro de codigo** — a
  prova de tipos (`tsc`) e a de rotas passam.
- **REGRESSAO** — Fase 2 (`bench-cliente-auditoria.mjs`) **38/38**; Fase 1
  (`bench-cupons.mjs`, admin) **65 provas, 0 falha(s)**. Nenhuma das duas foi
  tocada por esta fase.

## Pendencia honesta: a Home nao foi vista renderizada

**Nenhuma rota do site foi aberta num navegador.** O `next dev` nao roda no
sandbox por falta de rede/binario, e o build nao completa pelo SWC. Entao o que
esta provado e: os tipos, a emissao sem erro, o fechamento das rotas, o reuso dos
dominios e a ausencia de link falso. **O que NAO esta provado e o pixel** — se a
Home sai exatamente como os 14 prints. Isso exige rodar no Windows e olhar.
Registrado como a primeira coisa a fazer na retomada.

## O que ja esta no disco

**Casca** (`src/components/site/` + `src/app/(site)/layout.tsx`)
`site-header.tsx` (recados + logo + 7 itens de menu + busca + 3 icones),
`site-footer.tsx` (faixa Instagram + newsletter + 4 colunas + copyright),
`whatsapp-flutuante.tsx` (link `wa.me` real). O grupo `(site)` existe para o
cabecalho da loja **nao** envolver `/admin` nem `/conta`, que ja estao validados.

**Home** (`src/app/(site)/page.tsx`) — as 16 faixas na ordem do print, com as
quatro fontes de produto do original (`featured`, `stock<=3`, `compareAtPrice >
price`, e "tudo menos os destaques").

**Catalogo** — `catalog-filters.tsx` (a CONTA do filtro: tamanhos/cores
disponiveis, as seis ordens, `passaNosFiltros`, `aplicarFiltros`) e as rotas
`/categoria/[slug]` (com as duas VIRTUAIS `novidades` e `promocoes`) e
`/produto/[slug]`.

## Decisoes e divergencias

**1. O menu do cabecalho e FIXO, e nao vem do `sortOrder` do admin.** O original
declara o `NAV` no `Header.tsx` e mostra `NAV.slice(0,7)`. A ordem dele e
`Tops, Shorts, Leggings, Macaquinhos, Conjuntos`; a do `sortOrder` do admin e
`Tops(1), Macaquinhos(2), Conjuntos(3), Shorts(4), Leggings(6)`. **Sao diferentes.**
Gerar o menu do painel daria uma ordem que o print desmente — por isso os sete
itens sao literais do original, e a divergencia fica registrada aqui em vez de
resolvida em silencio. `Início` e `Novidades` tambem NAO sao categorias do
catalogo (sao rotas).

**2. O selo `Lançamento` NAO existe.** O original o calcula por `Date.now() - 30
dias`. E um selo que muda sozinho com o relogio — o mesmo defeito que a Fase 2
removeu do dashboard do cliente (`cuponsValidos`). O material tambem nao o tem:
nenhum print de site mostra `LANÇAMENTO`. Ficam `-N%`, `Best Seller` e
`Últimas peças`.

**3. Nao existe filtro por `qtdLoja`.** A regra de vitrine aqui e
`status === 'active'` — a unica nocao de "publicado" que o projeto tem. Uma peca
esgotada **continua** na vitrine com o selo `Produto indisponível`, que e o que o
original faz e o que o print `003936` mostra.

**4. `bg-beige` -> `bg-secondary`.** O original usa `#FDFBF7`/`bg-beige` em varias
secoes; o projeto nao tem esse token. Mesma conversao da Fase 2.

**5. As imagens do site sao as do proprio material.** `banner-1/2/3.jpg`,
`banner-mobile-1/2/3.jpg` e `promo-essencia.jpg` vieram do
`PROJETO-ORIGINAL-LOVABLE-REFERENCIA/src/assets` para `public/site/`;
`essencia.jpg` e `avatar-provador.png` vieram de `imagens de referencia pra
maneres ect` e do `assets` do original. **Todas sao fotos da Closet Lunar** (as
pecas que a loja vende) — nao ha imagem de banco. A foto do hero e a mesma do
print `003828`.

**6. Sem `printer`/`ModulePage`.** Nenhuma rota desta fase foi deixada com
placeholder: as que existem renderizam conteudo real ou `notFound()`.

## Pendencias registradas (nao escondidas)

| pendencia | onde | entra quando |
| --------- | ---- | ------------ |
| setas `‹ ›` do hero e a troca de slide | `hero.tsx` | o hero virar `'use client'` (junto com o carrinho) |
| setas do carrossel de produto | `product-carousel.tsx` | idem |
| troca de tamanho no `Compre por Tamanho` | `shop-by-size.tsx` | idem |
| a coluna de filtros (`260px`) e a folha do celular | `/categoria/[slug]` | idem (a CONTA ja esta pronta e provada) |
| escolher tamanho/cor/quantidade na PDP | `/produto/[slug]` | idem |
| `ADICIONAR AO CARRINHO` sem `onClick` | card + PDP | carrinho persistido (Fase 4) |
| `INICIAR PROVADOR` sem `onClick` | `provador-ia.tsx` | provador do site (Fase 6) |
| newsletter nao grava | `site-footer.tsx` | `AGUARDA PROVIDER` (e-mail) |
| `QUERO MEU DESCONTO` nao envia cupom | `lead-popup.tsx` | Fase 4 (tabela `leads`) |

## Pendencias para o Neon / integracoes

- `Pix (5% off)` da PDP **nao foi reproduzido**: e uma promessa de desconto no
  pagamento, e nao ha gateway. `GATEWAY A DEFINIR`.
- A sacola, o checkout e o `pedido-confirmado` dependem do carrinho persistido.
- `SmartSuggestions` (recomendacao por afinidade) foi trocado por `featured`:
  sem banco e sem historico, "recomendado para voce" nao tem como ser calculado.
- O bloco do Instagram e uma VITRINE de fotos de produto (como no original), e
  **nao** uma integracao — por isso funciona sem token.
- `lib/whatsapp` ja tem o template e o `phoneDigits`; o numero sai do
  `getFooter()`, o mesmo que o admin edita.

## Arquivos da fase

- `src/components/site/` — `site-header.tsx`, `site-footer.tsx`,
  `whatsapp-flutuante.tsx`, `hero.tsx`, `benefits-bar.tsx`, `categories-row.tsx`,
  `product-card.tsx`, `product-carousel.tsx`, `section-heading.tsx`,
  `shop-by-size.tsx`, `faixa-escura.tsx`, `provador-ia.tsx`, `depoimentos.tsx`,
  `instagram-strip.tsx`, `lead-popup.tsx` (o unico `'use client'`),
  `catalog-filters.tsx` (a conta), `product-gallery.tsx`
- `src/app/(site)/` — `layout.tsx`, `page.tsx`, `categoria/[slug]/page.tsx`,
  `produto/[slug]/page.tsx`
- `public/site/` — 10 imagens (banners, essencia, avatar, logo)
