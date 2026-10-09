/**
 * Camada de dados do cluster Provador e IA.
 *
 * ESTE E O UNICO PONTO DE CONTATO DAS TRES TELAS COM OS DADOS. Nenhum componente
 * importa de `demo.ts` nem conhece Prisma. Quando o Neon entrar, troca-se o corpo
 * destas funcoes; a assinatura e as telas continuam iguais.
 *
 * ================== A LISTA DE PRODUTOS NAO VEM DAQUI ==================
 *
 * `listSelectorProducts` e um WRAPPER de `lib/produtos/data`, e nao uma lista
 * nova. O dono da lista de produtos e `lib/produtos` — esta camada so a ordena e
 * a filtra (ver `metrics.ts`, `O DONO DA LISTA`).
 *
 * As funcoes que devolvem `{ data, persisted: false, reason }` seguem o padrao do
 * resto do painel: a UI nunca finge uma gravacao. Ver `WriteResult` abaixo.
 */

import type { Category, Product } from '@/lib/produtos/types';
import { listCategories as listProdutoCategories, listProducts } from '@/lib/produtos/data';
import type { Dataset } from '@/lib/produtos/data';
import { DEMO_AI_SETTINGS, DEMO_AVATAR, DEMO_PIECE, DEMO_SUGGESTIONS } from './demo';
import { selectorProducts } from './metrics';
import type { AiSettings, AvatarSettings, ManualSuggestion, PieceConfig, PieceDefaults } from './types';

/**
 * O RESULTADO DE UMA ESCRITA QUE AINDA NAO ACONTECE.
 *
 * `data` e o valor que a tela passa a usar (o mesmo que foi enviado, quando ele e
 * valido) e `persisted: false` diz que ele NAO foi para lugar nenhum. A tela
 * mostra os dois: usa o valor E avisa que ele volta ao padrao ao recarregar.
 *
 * Fingir `persisted: true` seria pior que nao salvar — a pessoa ajustaria o
 * avatar, veria "salvo", e o ajuste teria sumido no proximo carregamento sem
 * nunca ter existido.
 */
export interface WriteResult<T> {
  data: T;
  persisted: false;
  reason: string;
}

const REASON =
  'A gravação depende do Neon, que ainda não está conectado nesta fase. O ajuste vale só nesta tela.';

/* ============================== catalogo ============================== */

/**
 * OS PRODUTOS DO SELETOR — derivados do catalogo, em ordem alfabetica.
 *
 * Devolve a lista JUNTO com as categorias, porque o seletor precisa das duas: a
 * lista mostra o nome, e o painel de configuracao mostra a categoria. Buscar as
 * duas em duas chamadas separadas abriria uma janela em que a lista tem um
 * produto e a categoria dele ainda nao chegou.
 */
export async function listSelectorData(): Promise<{ products: Product[]; categories: Category[] }> {
  const [produtos, categorias] = await Promise.all([listProducts(), listProdutoCategories()]);
  return { products: selectorProducts(produtos.data), categories: categorias.data };
}

/* =============================== Avatar =============================== */

/** As imagens e as medidas do avatar. Hoje do `demo`. */
export async function getAvatar(): Promise<Dataset<AvatarSettings>> {
  return { data: DEMO_AVATAR, source: 'demo' };
}

/**
 * A GRAVACAO DAS IMAGENS DO AVATAR — declarada, nao implementada.
 *
 * ================== POR QUE NAO IMPLEMENTAR, E O QUE FALTA ==================
 *
 * As URLs das cinco imagens sao resultado de UPLOAD, e upload precisa de um
 * bucket. O bucket do material e de terceiro (`...supabase.co`, o storage do
 * painel original) e nao serve; o storage de producao desta loja esta FORA do
 * escopo desta fase, por instrucao.
 *
 * Sem bucket, a unica implementacao possivel seria trocar o `url` no estado — o
 * mesmo que a tela ja faz. Escrever isso como `saveAvatar` que devolve
 * `persisted: false` seria honesto mas inutil: a tela ja sabe que nada foi
 * gravado, porque o bucket nao existe. Entao a funcao NAO existe, e o botao
 * `SALVAR ALTERAÇÕES` de adm-039 fica DESABILITADO — que e, aliás, o estado que
 * o print mostra (`Nenhuma alteração pendente`).
 */
export async function saveAvatar(_avatar: AvatarSettings): Promise<WriteResult<AvatarSettings>> {
  return { data: _avatar, persisted: false, reason: REASON };
}

/* ============================== Provador ============================== */

/**
 * A config de REPOUSO da peca — os valores que nao vem do produto.
 *
 * O tipo `PieceDefaults` exclui `productId` e `categoryId`: os dois sao do produto
 * escolhido, e `newPieceConfigFromDefaults` (`metrics.ts`) faz a juncao. Ver a nota
 * em `types.ts` sobre o defeito que essa exclusao existe para impedir.
 */
export async function getPieceDefaults(): Promise<Dataset<PieceDefaults>> {
  return { data: DEMO_PIECE, source: 'demo' };
}

export async function savePiece(piece: PieceConfig): Promise<WriteResult<PieceConfig>> {
  return { data: piece, persisted: false, reason: REASON };
}

/* ============================= IA de Looks ============================= */

/** A tabela de sugestoes manuais — VAZIA, como o print (adm-047). */
export async function listSuggestions(): Promise<Dataset<ManualSuggestion[]>> {
  return { data: DEMO_SUGGESTIONS, source: 'demo' };
}

export async function saveSuggestions(
  rows: ManualSuggestion[],
): Promise<WriteResult<ManualSuggestion[]>> {
  return { data: rows, persisted: false, reason: REASON };
}

export async function getAiSettings(): Promise<Dataset<AiSettings>> {
  return { data: DEMO_AI_SETTINGS, source: 'demo' };
}

export async function saveAiSettings(settings: AiSettings): Promise<WriteResult<AiSettings>> {
  return { data: settings, persisted: false, reason: REASON };
}

/* ============================== Insights ============================== */

/**
 * OS NUMEROS DE USO DO PROVADOR — `0` em tudo (adm-044/045).
 *
 * Vem de `demo.ts` porque a loja de demonstracao nao tinha looks, e nao ha o que
 * agregar: quando o Neon entrar, esta funcao passa a contar `saved_looks` e
 * `cart_events`, e a tela nao muda.
 *
 * A ASSINATURA JA E ASSINCRONA pelo mesmo motivo das outras: a tela ja a chama
 * como se fosse banco, e liga-la depois e trocar o corpo, nao a chamada.
 */
export async function getUsage() {
  const { DEMO_USAGE } = await import('./demo');
  return { data: DEMO_USAGE, source: 'demo' as const };
}

/* ====================== Pendencias para o Neon ====================== */
/**
 * O QUE ESTE ARQUIVO AINDA NAO FAZ, e o que vai ser preciso:
 *
 * 1. TABELA `avatar_settings` — chave/valor (`slot -> url`) + as tres medidas.
 *    Uma linha por slot, ou um JSON: as cinco URLs e tres numeros caem bem em
 *    `settings` com a chave `avatar`, como os custos de Financeiro.
 * 2. TABELA `product_piece_config` — uma linha por produto: `category_id`,
 *    `layer`, `position` e as tres URLs de vista. Chave estrangeira para
 *    `products`; `ON DELETE CASCADE`, porque a config nao existe sem o produto.
 * 3. TABELA `manual_suggestions` — `base_id`, `target_id`, `priority`, com
 *    chave unica no par (base, target), que e a mesma unicidade que
 *    `isDuplicateRelation` confere na tela.
 * 4. TABELA `ai_settings` — as tres opcoes de adm-050, tambem em `settings`.
 * 5. CONTAGENS de uso — `saved_looks` e `cart_events`, agregadas por
 *    `getUsage`. Sem elas, os cards de adm-044/045 continuam em zero.
 */
