/**
 * Camada de dados do grupo CONTEUDO — o UNICO ponto de contato das quatro telas.
 *
 * Nenhum componente importa de `demo.ts`. Quando o Neon entrar, troca-se o CORPO
 * destas funcoes; as assinaturas e as telas continuam iguais.
 *
 * ================== O QUE VAI DEPENDER DO NEON ==================
 *
 *   `banners`          uma linha por slide. As colunas que o formulario de adm-052
 *                      prova: `title`, `eyebrow`, `subtitle`, `link_url`,
 *                      `cta_text`, `image_desktop_url`, `image_mobile_url`,
 *                      `sort_order`, `is_active`.
 *
 *   `site_categories`  NAO EXISTE. A aba Categorias e um JOIN sobre `categories`,
 *                      que ja tem dono. Ver `listSiteCategories`.
 *
 *   `home_sections`    `title`, `kind`, `source`, `item_count`, `sort_order`,
 *                      `is_active`. O `kind` precisa de CHECK com os SEIS valores de
 *                      `SiteSectionKind`: sem ele, um valor fora da lista passa pelo
 *                      TypeScript (que so ve a tela), chega ao banco e a tela imprime
 *                      o slug cru entre parenteses.
 *
 *   `promo_banners`    `title`, `subtitle`, `image_url`, `link_url`, `sort_order`,
 *                      `is_active`. Tabela vazia hoje — e o print tambem.
 *
 *   `benefits`         `icon_name`, `title`, `description`, `sort_order`,
 *                      `is_active`. O `icon_name` guarda o NOME do icone do lucide,
 *                      e nao um SVG: e o que o formulario do original grava, e e o
 *                      que a tela imprime (ver `types.ts`).
 *
 *   `site_settings`    chave/valor, como `loyalty_config` e `financial_costs`. Tres
 *                      chaves: `instagram` (o objeto de `InstagramConfig`) e
 *                      `footer` (o objeto de `SiteFooter`). O `upsert` e por `key`
 *                      — sem indice unico em `key`, dois salvamentos simultaneos
 *                      criariam duas linhas e a proxima leitura pegaria uma delas
 *                      por acaso.
 *
 *   `looks` + `look_items`  `looks` tem `name`, `subtitle`, `description`,
 *                      `cover_url`, `sort_order`, `is_active`; `look_items` tem
 *                      `look_id`, `product_id` e a ORDEM da peca no look. A ordem
 *                      importa: o preview desenha as pecas na ordem em que foram
 *                      marcadas, e sem uma coluna de ordem o `select` devolveria as
 *                      linhas na ordem que o banco quisesse.
 *
 * ================== A DIVERGENCIA ENTRE BANNERS E A ABA HERO ==================
 *
 * `listHeroSlides` devolve OS MESMOS registros que `listBanners`. Nao ha duas
 * tabelas: a tela `Banners` e a aba `Hero Banner` sao duas vistas do mesmo dado, com
 * o mesmo titulo, o mesmo subtitulo e a mesma ordem linha a linha. Duas tabelas
 * divergiriam no primeiro dia em que alguem editasse uma das duas telas.
 */

import { toSiteCategories } from './metrics';
import { DEMO_HERO_SLIDES } from './demo';
import type {
  Benefit,
  Dataset,
  HeroSlide,
  HomeSection,
  InstagramConfig,
  Look,
  LookPiece,
  PromoBanner,
  SiteCategory,
  SiteFooter,
  StoreTheme,
  WriteResult,
} from './types';
import {
  DEMO_BENEFITS,
  DEMO_HOME_SECTIONS,
  DEMO_INSTAGRAM,
  DEMO_LOOKS,
  DEMO_PROMO_BANNERS,
  DEMO_SITE_FOOTER,
  DEMO_STORE_THEMES,
} from './demo';
import { listCategories } from '@/lib/categorias/data';
import { lerModulo, gravarModulo, salvarItem, removerItem } from '@/lib/data/modulo';

/**
 * A RAZAO UNICA das escritas que nao gravam.
 *
 * Um texto so, exportado, porque cinco telas repetindo a mesma frase escrita de
 * cinco jeitos diferentes e como se comeca a achar que sao cinco motivos diferentes.
 */

/* ================================ Banners ================================ */
/*
 * Persistencia: `lib/data/modulo` (Setting `modulo:conteudo:*`). Leitura publica
 * (o site mostra), escrita so do admin. Sem nada salvo, a loja usa o PADRAO
 * REAL abaixo (os banners com as fotos da loja), nao a demonstracao.
 */

const PENDING_REASON = 'Não foi possível salvar agora. Tente novamente.';

export const BANNERS_PADRAO: HeroSlide[] = [
  {
    id: 'banner-video',
    title: 'Movimento que veste você',
    eyebrow: 'Nova coleção',
    subtitle: 'Conjuntos com compressão na medida, tecidos que não marcam e caimento pensado para o seu treino.',
    linkUrl: '/categoria/novidades',
    ctaText: 'Ver coleção',
    imageDesktopUrl: '/site/banners/campanha-desktop-poster.webp',
    imageMobileUrl: '/site/banners/campanha-mobile-poster.webp',
    videoDesktopUrl: '/site/banners/campanha-desktop.mp4',
    videoMobileUrl: '/site/banners/campanha-mobile.mp4',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'banner-colecao',
    title: 'Cores que acompanham seu ritmo',
    eyebrow: 'Conjuntos Closet Lunar',
    subtitle: 'Verde esmeralda, azul céu e terracota: escolha o seu tom e treine com estilo.',
    linkUrl: '/categoria/conjuntos',
    ctaText: 'Escolher meu conjunto',
    imageDesktopUrl: '/site/banners/colecao-desktop.webp',
    imageMobileUrl: '/site/banners/colecao-mobile.webp',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'banner-short-saia',
    title: 'Short-saia: liberdade com elegância',
    eyebrow: 'Queridinhos da loja',
    subtitle: 'Shortinho interno, cintura confortável e o balanço perfeito. Em até 3x sem juros.',
    linkUrl: '/categoria/conjuntos',
    ctaText: 'Comprar agora',
    imageDesktopUrl: '/site/banners/short-saia-desktop.webp',
    imageMobileUrl: '/site/banners/short-saia-mobile.webp',
    sortOrder: 3,
    isActive: true,
  },
];

export async function listBanners(options?: { signal?: AbortSignal }): Promise<Dataset<HeroSlide[]>> {
  void options;
  return lerModulo<HeroSlide[]>('conteudo:banners', DEMO_HERO_SLIDES, BANNERS_PADRAO);
}

export async function listHeroSlides(options?: { signal?: AbortSignal }): Promise<Dataset<HeroSlide[]>> {
  return listBanners(options);
}

export async function saveBanner(slide: HeroSlide): Promise<WriteResult<HeroSlide>> {
  const atual = (await listBanners()).data;
  return salvarItem('conteudo:banners', atual, slide);
}

export async function deleteBanner(id: string): Promise<WriteResult<{ id: string }>> {
  const atual = (await listBanners()).data;
  return removerItem('conteudo:banners', atual, id);
}

export async function toggleBanner(slide: HeroSlide): Promise<WriteResult<HeroSlide>> {
  return saveBanner(slide);
}

/* =========================== Conteudo do Site =========================== */

export async function listSiteCategories(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<SiteCategory[]>> {
  void options;
  const result = await listCategories();
  return { data: toSiteCategories(result.data), source: result.source };
}

export async function listHomeSections(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<HomeSection[]>> {
  void options;
  return lerModulo('conteudo:secoes', DEMO_HOME_SECTIONS, DEMO_HOME_SECTIONS);
}

export async function saveHomeSection(section: HomeSection): Promise<WriteResult<HomeSection>> {
  const atual = (await listHomeSections()).data;
  return salvarItem('conteudo:secoes', atual, section);
}

export async function listPromoBanners(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<PromoBanner[]>> {
  void options;
  return lerModulo<PromoBanner[]>('conteudo:promo', [...DEMO_PROMO_BANNERS], []);
}

export async function savePromoBanner(banner: PromoBanner): Promise<WriteResult<PromoBanner>> {
  const atual = (await listPromoBanners()).data;
  return salvarItem('conteudo:promo', atual, banner);
}

export async function listBenefits(options?: { signal?: AbortSignal }): Promise<Dataset<Benefit[]>> {
  void options;
  return lerModulo('conteudo:beneficios', DEMO_BENEFITS, DEMO_BENEFITS);
}

export async function saveBenefit(benefit: Benefit): Promise<WriteResult<Benefit>> {
  const atual = (await listBenefits()).data;
  return salvarItem('conteudo:beneficios', atual, benefit);
}

/* ------------------------------- Instagram ------------------------------- */

export async function getInstagram(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<InstagramConfig>> {
  void options;
  return lerModulo('conteudo:instagram', DEMO_INSTAGRAM, DEMO_INSTAGRAM);
}

export async function saveInstagram(config: InstagramConfig): Promise<WriteResult<InstagramConfig>> {
  const r = await gravarModulo('conteudo:instagram', config);
  return { data: config, ...r };
}

/* --------------------------------- Rodape --------------------------------- */

export async function getFooter(options?: { signal?: AbortSignal }): Promise<Dataset<SiteFooter>> {
  void options;
  return lerModulo('conteudo:rodape', DEMO_SITE_FOOTER, DEMO_SITE_FOOTER);
}

export async function saveFooter(footer: SiteFooter): Promise<WriteResult<SiteFooter>> {
  const r = await gravarModulo('conteudo:rodape', footer);
  return { data: footer, ...r };
}

/* ============================ Personalizar Loja ============================ */

export const DEMO_ACTIVE_THEME_ID = 'theme-elegant';

export async function listThemes(options?: { signal?: AbortSignal }): Promise<Dataset<StoreTheme[]>> {
  void options;
  return { data: DEMO_STORE_THEMES, source: 'database' };
}

export async function getActiveThemeId(): Promise<Dataset<string>> {
  const r = await lerModulo<{ id: string }>('conteudo:tema', { id: DEMO_ACTIVE_THEME_ID }, { id: DEMO_ACTIVE_THEME_ID });
  return { data: r.data.id, source: r.source };
}

export async function applyTheme(id: string): Promise<WriteResult<{ id: string }>> {
  const r = await gravarModulo('conteudo:tema', { id });
  return { data: { id }, ...r };
}

/* ================================== Looks ================================== */

export async function listLooks(options?: { signal?: AbortSignal }): Promise<Dataset<Look[]>> {
  void options;
  return lerModulo<Look[]>('conteudo:looks', DEMO_LOOKS, []);
}

export function newLook(id: string): Look {
  return {
    id,
    name: '',
    subtitle: '',
    description: '',
    coverUrl: null,
    sortOrder: 0,
    isActive: true,
    pieces: [],
  };
}

export function newLookPieces(productIds: readonly string[]): LookPiece[] {
  return productIds.map((productId) => ({ productId }));
}

export async function saveLook(look: Look): Promise<WriteResult<Look>> {
  const atual = (await listLooks()).data;
  return salvarItem('conteudo:looks', atual, look);
}

export async function deleteLook(id: string): Promise<WriteResult<{ id: string }>> {
  const atual = (await listLooks()).data;
  return removerItem('conteudo:looks', atual, id);
}

export async function toggleLook(look: Look): Promise<WriteResult<Look>> {
  return saveLook(look);
}

export { PENDING_REASON };
