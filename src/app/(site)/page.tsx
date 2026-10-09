import type { Metadata } from 'next';
import { BenefitsBar } from '@/components/site/benefits-bar';
import { CategoriesRow } from '@/components/site/categories-row';
import { Depoimentos } from '@/components/site/depoimentos';
import { FaixaEscura } from '@/components/site/faixa-escura';
import { Hero } from '@/components/site/hero';
import { InstagramStrip } from '@/components/site/instagram-strip';
import { LeadPopup } from '@/components/site/lead-popup';
import { ProductCarousel } from '@/components/site/product-carousel';
import { ProvadorIa } from '@/components/site/provador-ia';
import { ShopBySize } from '@/components/site/shop-by-size';
import {
  getInstagram,
  listBenefits,
  listHeroSlides,
  listSiteCategories,
} from '@/lib/conteudo/data';
import { listProducts } from '@/lib/produtos/data';
import type { Product } from '@/lib/produtos/types';

export const metadata: Metadata = {
  title: 'Closet Lunar — moda fitness feminina',
  description:
    'Moda fitness e streetwear feminino. Conforto, estilo e performance em peças pensadas para o seu movimento.',
};

/**
 * A HOME — a unica tela do site que os 14 prints cobrem.
 *
 * ================== A ORDEM DAS SECOES VEM DO PRINT, E NAO DO ADMIN ==================
 *
 * O `index.tsx` do original diz, em comentario, o que fazer: *"Sales-driven home:
 * always show the commercial sections in the right order."* Ou seja, a ordem das
 * secoes comerciais e FIXA no codigo, e as `home_sections` do admin sao EXTRAS
 * que entram depois. As duas listas do `DEMO_HOME_SECTIONS` (`As mais amadas` e
 * `Recém-chegadas`) **ja aparecem** na home pelas secoes fixas equivalentes
 * (`best_sellers` = `As Mais Amadas`, `latest` = `Novidades`) — entao repeti-las
 * aqui duplicaria as duas faixas. Elas ficam registradas como o que sao: a
 * configuracao do painel que coincide com a ordem fixa.
 *
 * A ORDEM ABAIXO e a do SCROLL dos prints, e bate com a do `index.tsx`:
 *
 *   1. recados + cabecalho           (casca, no layout)
 *   2. Hero                          `003840`  `Nova coleção fitness`
 *   3. Barra de beneficios           `003840`  os cinco
 *   4. Categorias                    `003921`  `Encontre seu estilo`
 *   5. Best Sellers                  `003921`  `As Mais Amadas`
 *   6. Ultima Oportunidade           `003936`  `Estoque limitado`
 *   7. Compre por Tamanho            `003944`  `Encontre o seu`
 *   8. Novidades                     `003953`  `Recém-chegadas`
 *   9. Promocoes                     `003959`  `Ofertas`
 *  10. Mais Vendidos                 `004005`  `Top vendas`
 *  11. Faixa escura                  `004020`  `Coleção Exclusiva`
 *  12. Provador IA                   `004027`  `Closet Lunar IA`
 *  13. Depoimentos                   `004033`  `O que dizem nossas clientes`
 *  14. Instagram                     `004033`  `Siga-nos no Instagram`
 *  15. Rodape                        `004049`
 *
 * ================== AS QUATRO FONTES DE PRODUTO ==================
 *
 * O original separa quatro listas com regras concretas (linhas 129-137 do
 * `index.tsx`):
 *
 *   bestSellers  = destaques (`featured`)                              -> `As Mais Amadas`
 *   lowStock     = `stock > 0 && stock <= 3`                           -> `Ultima Oportunidade`
 *   novidades    = TODOS, mais recentes primeiro                       -> `Novidades`
 *   promo        = `compareAtPrice > price`                            -> `Promocoes`
 *   maisVendidos = tudo MENOS o que ja esta em `bestSellers`           -> `Mais Vendidos`
 *
 * O `maisVendidos` tem uma sutileza do original que vale manter: ele EXCLUI os
 * ids que ja sairam em `As Mais Amadas`, para a mesma peca nao aparecer duas
 * vezes na mesma pagina — e o comentario do original diz exatamente isso
 * ("avoids duplicates on the home").
 */
export default async function HomePage() {
  const [
    { data: slides },
    { data: beneficios },
    { data: categorias },
    { data: produtos },
    { data: instagram },
  ] = await Promise.all([
    listHeroSlides(),
    listBenefits(),
    listSiteCategories(),
    listProducts(),
    getInstagram(),
  ]);

  /*
    ================== O QUE A HOME MOSTRA, E O QUE ELA ESCONDE ==================

    `listProducts()` devolve TUDO — os tres estados de `status` (`active`,
    `draft`, `archived`). A loja nao pode mostrar um rascunho nem uma peca
    arquivada: o admin as esconde no catalogo dele, e mostrar aqui seria duas
    lojas diferentes.

    A regra e `status === 'active'`, que e o estado que o painel edita no
    formulario de produto. Nao ha uma segunda nocao de "publicado" neste projeto
    — e por isso ela e escrita uma vez, aqui, e nao em cada secao.

    NAO ha filtro por `stock > 0` nesta camada. Ele esta DENTRO das secoes que o
    pedem: o `Ultima Oportunidade` filtra `stock <= 3`, o `Compre por Tamanho`
    filtra `stock > 0`, e os cartoes marcam `Produto indisponível` quando o
    estoque esta zerado (o print mostra esse estado). Uma peca esgotada continua
    na vitrine com o selo, e nao desaparece — que e o que o original faz.
  */
  const visiveis = produtos.filter((p) => p.status === 'active');

  const destaques = visiveis.filter((p) => p.featured);
  const estoqueBaixo = visiveis.filter((p) => p.stock > 0 && p.stock <= 3);
  const novidades = ordenarPorRecentes(visiveis);
  const promocao = visiveis.filter(
    (p) => p.compareAtPrice !== null && p.compareAtPrice > p.price,
  );
  const idsDestaque = new Set(destaques.map((p) => p.id));
  const maisVendidos = visiveis.filter((p) => !idsDestaque.has(p.id));

  return (
    <>
      <Hero slides={slides} />
      <BenefitsBar benefits={beneficios} />
      <CategoriesRow categories={categorias} />

      <ProductCarousel
        eyebrow="Best Sellers"
        title="As Mais Amadas"
        subtitle="Peças que conquistaram nossas clientes"
        products={destaques}
      />

      <ProductCarousel
        eyebrow="Estoque limitado"
        title="Última Oportunidade"
        subtitle="Restam poucas unidades — não deixe escapar"
        products={estoqueBaixo}
        notice="Restam poucas unidades"
      />

      <ShopBySize products={visiveis} />

      <ProductCarousel
        eyebrow="Recém-chegadas"
        title="Novidades"
        subtitle="Acabaram de chegar à coleção"
        products={novidades}
        viewAllHref="/categoria/novidades"
      />

      <ProductCarousel
        eyebrow="Ofertas"
        title="Promoções"
        subtitle="Aproveite antes que acabe"
        products={promocao}
        viewAllHref="/categoria/promocoes"
      />

      <ProductCarousel
        eyebrow="Top vendas"
        title="Mais Vendidos"
        subtitle="As favoritas das nossas clientes"
        products={maisVendidos}
      />

      <FaixaEscura />
      <ProvadorIa />
      <Depoimentos />
      {instagram.showOnHome && (
        <InstagramStrip products={visiveis} usuario={handleInstagram(instagram.url)} url={instagram.url} />
      )}

      <LeadPopup />
    </>
  );
}

/**
 * `Novidades` — os mais recentes primeiro.
 *
 * A ordenacao e por `createdAt` DECRESCENTE, como o original (`[...all]` sem
 * `sort` acaba ordenado pelo banco; aqui o `DEMO` ja vem em ordem decrescente de
 * data, mas confiar nisso seria frágil). O `localeCompare` sobre a string ISO
 * funciona porque o formato e `YYYY-MM-DDThh:mm:ss` — a comparacao lexicografica
 * coincide com a cronologica, e nao depende de `Date` nem do fuso da maquina
 * (ver `feedback_data_iso_e_utc_meia_noite`).
 */
function ordenarPorRecentes(lista: Product[]): Product[] {
  return [...lista].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * O `@` do bloco do Instagram, derivado da URL configurada.
 *
 * O `InstagramConfig` do painel guarda so a URL (`https://instagram.com/...`) e
 * o `showOnHome` — **nao ha campo de usuario**. O original tambem nao tem: ele
 * deriva o arroba de `site.instagram_username` com fallback `"closetlunar"`.
 *
 * Aqui o arroba sai da PROPRIA URL (o ultimo segmento), porque ela esta
 * preenchida e e a mesma fonte que o link usa — assim o texto e o destino nao
 * podem divergir. URL vazia ou sem segmento cai no fallback, literal do
 * original. O `@` inicial e removido porque quem o poe e o componente.
 */
function handleInstagram(url: string): string {
  const m = String(url ?? '').match(/instagram\.com\/([^/?#]+)/i);
  return m ? m[1] : 'closetlunar';
}
