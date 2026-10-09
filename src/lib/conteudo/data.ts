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

/**
 * A RAZAO UNICA das escritas que nao gravam.
 *
 * Um texto so, exportado, porque cinco telas repetindo a mesma frase escrita de
 * cinco jeitos diferentes e como se comeca a achar que sao cinco motivos diferentes.
 */
const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/* ================================ Banners ================================ */

/**
 * OS SLIDES — a lista da tela `Banners` E a da aba `Hero Banner`.
 *
 * A ordenacao NAO acontece aqui: `byDisplayOrder` roda na tela, sobre o que chegou.
 * Ordenar nos dois lugares seria dois donos da mesma ordem, e a tela precisa da
 * lista ORDENADA justamente para calcular o `ORDEM: n` por posicao (`positionOf`).
 *
 * A ASSINATURA E A MESMA `{ signal }` do resto do painel: cancelamento ja esta no
 * contrato para nao ter que mudar quando a leitura virar rede.
 */
export async function listBanners(options?: { signal?: AbortSignal }): Promise<Dataset<HeroSlide[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_HERO_SLIDES, source: 'demo' };
}

/** A MESMA leitura, com o nome que a aba usa. Ver o cabecalho: e o mesmo dado. */
export async function listHeroSlides(options?: { signal?: AbortSignal }): Promise<Dataset<HeroSlide[]>> {
  return listBanners(options);
}

/**
 * SALVAR UM SLIDE — cria quando o id nao existe, atualiza quando existe.
 *
 * UMA FUNCAO, E NAO DUAS. O formulario de adm-052 e o MESMO para criar e para
 * editar (`Novo Banner` so muda de titulo), entao duas funcoes obrigariam o
 * componente a decidir qual chamar — e a decisao seria por `id === ''`, espalhada
 * pela tela. Aqui a regra fica num lugar so.
 *
 * NAO GRAVA. Ver `WriteResult`: `persisted: false` e a tela diz que nao gravou, em
 * vez de confirmar. O original mostra `toast.success` e a lista ganha a linha — que
 * e a mentira mais cara deste modulo, porque o slide apareceria na home e nao
 * existiria no banco.
 */
export async function saveBanner(slide: HeroSlide): Promise<WriteResult<HeroSlide>> {
  return { data: slide, persisted: false, reason: PENDING_REASON };
}

export async function deleteBanner(id: string): Promise<WriteResult<{ id: string }>> {
  return { data: { id }, persisted: false, reason: PENDING_REASON };
}

export async function toggleBanner(slide: HeroSlide): Promise<WriteResult<HeroSlide>> {
  return { data: slide, persisted: false, reason: PENDING_REASON };
}

/* =========================== Conteudo do Site =========================== */

/**
 * AS CATEGORIAS DA ABA — um JOIN sobre `lib/categorias`.
 *
 * ================== ESTA FUNCAO NAO LE `demo.ts` ==================
 *
 * E a unica leitura deste arquivo que vai a OUTRO modulo, e isso e deliberado. A
 * alternativa foi escrita e descartada: uma constante com os seis ids de adm-054
 * aqui dentro. Ela criaria um segundo dono das categorias — a lista desta aba
 * divergiria de `/admin/categorias` no primeiro rename, reorder ou toggle.
 *
 * O join ja esta provado no modulo Provador e em Tamanhos: quando o print mostra uma
 * lista e o catalogo mostra outra, a lista e derivada e a bancada declara o ausente
 * pelo nome. Aqui o catalogo tem OITO e o print tem SEIS; a tela mostra as oito.
 *
 * ================== O `listCategories` DEVOLVE MAIS DO QUE ISSO ==================
 *
 * A camada de Categorias devolve `Category` completo — com `image`, `productCount`,
 * `metaTitle`, `metaDescription`, `introText`. `toSiteCategories` corta para os
 * quatro campos que esta aba desenha. O corte acontece em `metrics.ts`, que e puro e
 * testavel; esta funcao so faz a ponte.
 */
export async function listSiteCategories(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<SiteCategory[]>> {
  const result = await listCategories(
    options?.signal ? { signal: options.signal } : undefined,
  );
  return { data: toSiteCategories(result.data), source: result.source };
}

export async function listHomeSections(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<HomeSection[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_HOME_SECTIONS, source: 'demo' };
}

export async function saveHomeSection(section: HomeSection): Promise<WriteResult<HomeSection>> {
  return { data: section, persisted: false, reason: PENDING_REASON };
}

export async function listPromoBanners(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<PromoBanner[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return {
    /**
     * `DEMO_PROMO_BANNERS` e `never[]` — um array vazio com tipo. O spread existe
     * para que o retorno seja `PromoBanner[]` e nao `never[]`: sem ele, o tipo do
     * array vazio "grudaria" e a bancada nao conseguiria provar que a tela aceita
     * uma lista preenchida quando ela existir.
     */
    data: [...DEMO_PROMO_BANNERS],
    source: 'demo',
  };
}

export async function savePromoBanner(banner: PromoBanner): Promise<WriteResult<PromoBanner>> {
  return { data: banner, persisted: false, reason: PENDING_REASON };
}

export async function listBenefits(options?: { signal?: AbortSignal }): Promise<Dataset<Benefit[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_BENEFITS, source: 'demo' };
}

export async function saveBenefit(benefit: Benefit): Promise<WriteResult<Benefit>> {
  return { data: benefit, persisted: false, reason: PENDING_REASON };
}

/* ------------------------------- Instagram ------------------------------- */

/** A config do Instagram. Devolve o padrao enquanto nao ha banco — o estado do print. */
export async function getInstagram(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<InstagramConfig>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_INSTAGRAM, source: 'demo' };
}

export async function saveInstagram(config: InstagramConfig): Promise<WriteResult<InstagramConfig>> {
  return { data: config, persisted: false, reason: PENDING_REASON };
}

/* --------------------------------- Rodape --------------------------------- */

export async function getFooter(options?: { signal?: AbortSignal }): Promise<Dataset<SiteFooter>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_SITE_FOOTER, source: 'demo' };
}

export async function saveFooter(footer: SiteFooter): Promise<WriteResult<SiteFooter>> {
  return { data: footer, persisted: false, reason: PENDING_REASON };
}

/* ============================ Personalizar Loja ============================ */

/**
 * OS TEMAS — e o ATIVO.
 *
 * O ATIVO NAO E UM CAMPO DO TEMA. Ele e uma ESCOLHA da loja, e nao uma propriedade
 * do tema: um tema nao "e" o ativo, ele "esta" ativo. Guardar `isActive` dentro de
 * cada `StoreTheme` permitiria dois temas ativos ao mesmo tempo — o estado invalido
 * seria representavel, e a tela teria que escolher qual dos dois desenhar como
 * `Tema atual`.
 *
 * Guardando o ID, o estado invalido nao existe: ou ha um id, ou nao ha. E a mesma
 * correcao de forma que `PieceDefaults = Omit<..., 'productId'|'categoryId'>` no
 * Provador — em vez de validar, tornar inrepresentavel.
 *
 * `DEMO_ACTIVE_THEME_ID` e `theme-elegant`, que e o unico cartao com o selo `ATIVO` e
 * o unico cujo botao diz `Tema atual`.
 */
export const DEMO_ACTIVE_THEME_ID = 'theme-elegant';

export async function listThemes(options?: { signal?: AbortSignal }): Promise<Dataset<StoreTheme[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_STORE_THEMES, source: 'demo' };
}

export async function getActiveThemeId(): Promise<Dataset<string>> {
  return { data: DEMO_ACTIVE_THEME_ID, source: 'demo' };
}

/**
 * APLICAR UM TEMA. Nao grava — e a tela troca o `Tema atual` localmente.
 *
 * O BOTAO FAZ O QUE O PRINT PROMETE: `Aplicar tema` muda o tema ativo da TELA. O
 * que ele nao faz e publicar — e o subtitulo da propria tela diz que `publicação`
 * chega numa proxima etapa. A diferenca entre "aplicado aqui" e "publicado na loja"
 * e exatamente a diferenca entre o que esta implementado e o que nao esta.
 */
export async function applyTheme(id: string): Promise<WriteResult<{ id: string }>> {
  return { data: { id }, persisted: false, reason: PENDING_REASON };
}

/* ================================== Looks ================================== */

export async function listLooks(options?: { signal?: AbortSignal }): Promise<Dataset<Look[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_LOOKS, source: 'demo' };
}

/**
 * UM LOOK VAZIO — o estado de abertura do modal `Novo look`.
 *
 * O `id` entra como parametro em vez de ser gerado aqui: quem gera e `localId`, que
 * ja e o gerador do painel (o mesmo das imagens de produto e das recompensas de
 * Fidelidade). Gerar id dentro de uma camada de dados tornaria a funcao impura sem
 * necessidade — `Date.now()` escondido aqui e a fonte de instabilidade que
 * `metrics.ts` inteiro evita.
 */
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

/** As pecas marcadas, na ordem da marcacao. Ver `lookPreview`. */
export function newLookPieces(productIds: readonly string[]): LookPiece[] {
  return productIds.map((productId) => ({ productId }));
}

export async function saveLook(look: Look): Promise<WriteResult<Look>> {
  return { data: look, persisted: false, reason: PENDING_REASON };
}

export async function deleteLook(id: string): Promise<WriteResult<{ id: string }>> {
  return { data: { id }, persisted: false, reason: PENDING_REASON };
}

export async function toggleLook(look: Look): Promise<WriteResult<Look>> {
  return { data: look, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
