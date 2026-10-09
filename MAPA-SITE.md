# MAPA-SITE — Fase 3 (site publico / e-commerce)

Fonte da verdade desta fase. Cada linha liga **um arquivo de print** a **uma
secao/rota** e ao **trecho do projeto original Lovable** que o comprova.

## Fontes e prioridade

```
PRINT DO SITE  >  PROJETO LOVABLE ORIGINAL  >  ESTRUTURA ATUAL  >  INFERENCIA
```

- Prints: `..\referencia visual do site\` — **14 PNG** contados em disco
  (`003828` a `004049`) + `desktop.ini`.
- Original: `..\PROJETO-ORIGINAL-LOVABLE-REFERENCIA\src\routes\*` (menos
  `conta*`, que e a Fase 2) + `src\components\site\*`.
- `vivence-joias-main`: **so inspiracao de animacao/microinteracao** — nunca
  fonte de layout, texto ou dado.
- Todas as pastas de referencia sao **read-only**. Nada foi escrito nelas.

## O que os 14 prints cobrem — e o que NAO cobrem

**Todos os 14 prints sao da MESMA tela: a Home (`/`).** A barra de URL de
`004041` imprime `https://closetlunar.lovable.app/`. A sequencia e o scroll
unico, de cima a baixo:

| # | arquivo | o que mostra |
| - | ------- | ------------ |
| 1 | `003828` | topo: faixa de recados + cabecalho + hero — **com o modal `Ganhe 10% OFF` aberto** |
| 2 | `003840` | o mesmo topo, **modal fechado** — a unica visao limpa do hero |
| 3 | `003921` | `Categorias — Encontre seu estilo` + `Best Sellers — As Mais Amadas` (inicio) |
| 4 | `003936` | `Estoque Limitado — Ultima Oportunidade` (um card) |
| 5 | `003944` | `Encontre o seu — Compre por Tamanho` (filtro PP/P/M/G/GG + grade) |
| 6 | `003953` | `Rece-m-chegadas — Novidades` + `VER TUDO` |
| 7 | `003959` | `Ofertas — Promocoes` + `VER TUDO` |
| 8 | `004005` | `Top Vendas — Mais Vendidos` |
| 9 | `004012` | `Best Sellers — As mais amadas` (a MESMA da captura 3, rolada) |
| 10 | `004020` | faixa ESCURA `Coleção Exclusiva — Essência feminina...` |
| 11 | `004027` | bloco `Closet Lunar IA — Descubra seu tamanho ideal` |
| 12 | `004033` | `Depoimentos — O que dizem nossas clientes` + `@closetlunar` |
| 13 | `004041` | `Siga-nos no Instagram` (grade de 6) + a faixa escura do rodape |
| 14 | `004049` | rodape completo: marca, redes, newsletter, 4 colunas de link, copyright |

**NAO existe print de nenhuma outra rota.** Nao ha captura de `/produto`,
`/categoria`, `/buscar`, `/checkout`, `/favoritos`, `/sobre` nem `/blog`. Para
essas rotas a fonte e o ORIGINAL — a hierarquia perde o primeiro termo, como
aconteceu com a tela `Afiliada` na Fase 2. Isso esta escrito aqui para que
ninguem procure o print que nao existe, e nenhuma bancada invente uma medida de
pixel que ninguem fez.

## As rotas publicas — do ORIGINAL

| arquivo do original | URL | print? |
| ------------------- | --- | ------ |
| `routes/index.tsx` | `/` (Home) | **SIM — os 14** |
| `routes/categoria.$slug.tsx` | `/categoria/:slug` | nao |
| `routes/produto.$slug.tsx` | `/produto/:slug` | nao |
| `routes/buscar.tsx` | `/buscar` | nao |
| `routes/checkout.tsx` | `/checkout` | nao |
| `routes/favoritos.tsx` | `/favoritos` | nao |
| `routes/sobre.tsx` | `/sobre` | nao |
| `routes/blog.tsx` | `/blog` | nao |
| `routes/look.$token.tsx` | `/look/:token` | nao |
| `routes/pedido-confirmado.$orderId.tsx` | `/pedido-confirmado/:orderId` | nao |
| `routes/robots[.]txt.ts` | `/robots.txt` | nao |
| `routes/sitemap[.]xml.ts` | `/sitemap.xml` | nao |

`api/`, `admin*` e `conta*` estao fora desta fase (a Fase 1 e a Fase 2).

## A Home — as 13 secoes, na ordem

A ordem abaixo e a do **print** (o scroll real) e bate com a do
`conta.index`-equivalente `index.tsx`. Cada secao existe nas duas fontes; onde
elas divergirem, vale o print.

| # | secao | eyebrow | titulo | fonte |
| - | ----- | ------- | ------ | ----- |
| 1 | Faixa de recados | — | 3 frases girando | print 1 |
| 2 | Cabecalho | — | logo + 6 itens + busca + 3 icones | prints 1 e 2 |
| 3 | Hero | `CLOSET LUNAR` | `Nova coleção fitness` | prints 1 e 2 |
| 4 | Barra de beneficios | — | 5 itens (frete, 6x, compra segura, troca, atendimento) | prints 1 e 2 |
| 5 | Categorias | `CATEGORIAS` | `Encontre seu estilo` | print 3 |
| 6 | Best Sellers | `BEST SELLERS` | `As Mais Amadas` | prints 3 e 9 |
| 7 | Estoque Limitado | `ESTOQUE LIMITADO` | `Última Oportunidade` | print 4 |
| 8 | Compre por Tamanho | `ENCONTRE O SEU` | `Compre por Tamanho` | print 5 |
| 9 | Novidades | `RECÉM-CHEGADAS` | `Novidades` | print 6 |
| 10 | Ofertas | `OFERTAS` | `Promoções` | print 7 |
| 11 | Top Vendas | `TOP VENDAS` | `Mais Vendidos` | print 8 |
| 12 | Faixa escura | `COLEÇÃO EXCLUSIVA` | `Essência feminina, força e elegância em cada peça.` | print 10 |
| 13 | Provador IA | `PROVADOR VIRTUAL INTELIGENTE` | `Descubra seu tamanho ideal` | print 11 |
| 14 | Depoimentos | `DEPOIMENTOS` | `O que dizem nossas clientes` | print 12 |
| 15 | Instagram | `@CLOSETLUNAR` | `Siga-nos no Instagram` | prints 12 e 13 |
| 16 | Rodape | — | marca + newsletter + 4 colunas + copyright | prints 13 e 14 |

(16 blocos; as "13 secoes" do titulo deste mapa contam os blocos comerciais,
sem a faixa de recados, o cabecalho e o rodape, que sao a CASCA e nao secoes da
pagina.)

### O modal `Ganhe 10% OFF`

So o print 1 o mostra, sobre a Home. E o `LeadPopup.tsx` do original: nome,
WhatsApp, e-mail, o botao `QUERO MEU DESCONTO` e o `não, obrigada`. A bancada
nao consegue prova-lo por render (ele nasce de um tempo/estado), mas a prova de
transcricao e do texto.

## Os contratos que o site REUSA — nao cria

`src/lib/` ja tem **26 dominios** com `types.ts` + `demo.ts` + `metrics.ts` +
`data.ts`. O site consome os MESMOS que o admin e o painel do cliente:

| conceito do site | dono hoje | observacao |
| ---------------- | --------- | ---------- |
| Produto | `lib/produtos` | `Product` do admin |
| Categoria | `lib/categorias` | `productCount` ja e calculado por join |
| Tamanho / variacao | `lib/tamanhos` | a matriz, e nao um CRUD |
| Estoque | `lib/estoque` | o `ativo && qtd > 0 && preco > 0` da vitrine |
| Cupom | `lib/cupons` | `is_active`; a validade NAO filtra o dashboard |
| Favorito | `lib/favoritos` | — |
| Cliente | `lib/cliente` + `lib/usuarios` | a sessao entra na Fase 4 |
| Pedido | `lib/pedidos` | `status` x `shippingStatus` |
| Carrinho | `lib/carrinho-abandonado` | existe do lado do ADMIN; o carrinho do SITE e outro objeto |
| Conteudo | `lib/conteudo` | banner, faixa, depoimento, Instagram |
| SEO | `lib/seo` | `robots`/`sitemap` |
| Provador | `lib/provador` | `tela` do modulo `Provador e IA` da Fase 2 |
| WhatsApp / atendimento | `lib/whatsapp`, `lib/atendimento` | o flutuante e os links |

**Nao criar `lib/site/` como um sistema paralelo.** O site e uma area como o
`admin` e o `(cliente)`: ele tem os proprios COMPONENTES
(`components/site/*`), e le os DADOS dos mesmos dominios. Se um conceito ainda
nao tem tipo (o `HomeSection`, o banner de promo), ele nasce no dono do
conceito e nao aqui.

## Os componentes do site — do ORIGINAL (37 arquivos)

Os que as rotas desta fase usam:

`Header`, `Footer`, `FloatingWhatsapp`, `LeadPopup`, `Hero`, `BenefitsBar`,
`CategoriesRow`, `ProductCard`, `ProductCarousel`, `SectionHeading`,
`ShopBySize`, `SizeFinderSection`, `LooksSection`, `CartDrawer`,
`QuickBuyModal`, `WishlistButton`, `SmartSearch`, `SmartSuggestions`,
`CatalogFilters`, `ProductGallery`, `CouponInput`, `ShippingCalculator`,
`SizeTableModal`, `ShareLookDialog`, `FloatingFittingRoom`,
`VirtualFittingRoom`, `TryOnLayers`, `BuildYourLook`, `StoreThemeProvider`,
`PixelIntegrations`.

Os que sao da Fase 2/`account` (`account/`, `checkout/`) e os que dependem de
`supabase` direto (`AbandonedCartAdmin`, `AdminAuthScreen`) **nao** entram aqui.

## O que NAO foi provado por print (honestidade do mapa)

- Nao ha print de nenhuma rota alem da Home. As outras oito vem do original.
- Nao ha print do site em **celular**. A responsividade do site sera a do
  projeto (as mesmas classes do original), e nao uma medida de captura.
- Nao ha print do **carrinho aberto** nem do **checkout**. Ver a secao do
  `CartDrawer`/`checkout` no STATUS quando forem construidos.
- O tom `bg-beige` do original (na secao de depoimentos, print 12) **nao existe
  no projeto** — vira `secondary`, como na Fase 2.
