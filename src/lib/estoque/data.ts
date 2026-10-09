/**
 * Camada de dados de Estoque.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts` nem conhece Prisma. Quando o Neon entrar, troca-se o
 * corpo destas funcoes; a assinatura e as telas continuam iguais.
 *
 * A PONTE COM PRODUTOS
 *
 * O estoque NAO tem tabela propria aqui. O dono da quantidade e `lib/produtos`,
 * e este arquivo importa `@/lib/produtos/demo` — a mesma decisao (e o mesmo
 * lugar) do join de `lib/tamanhos/data.ts` e de `lib/categorias/data.ts`: a
 * ponte entre modulos fica na camada de dados, nunca numa tela.
 *
 * No Prisma isso vira um `include` das variacoes sobre `products`, mais a tabela
 * nova de verdade: `stock_movements`. As movimentacoes SAO do Estoque — nao ha
 * nada igual em Produtos — e por isso elas moram em `demo.ts` daqui.
 *
 * TRES LEITURAS, NA ORDEM DOS DOIS BLOCOS DO PRINT
 *
 *   listStockRows      -> a tabela                 (adm-028 + topo do adm-029)
 *   listStockStats     -> os quatro indicadores    (adm-028)
 *   listStockMovements -> Historico de Movimentacoes (rodape do adm-029)
 *
 * O QUE ESTE ARQUIVO NAO FAZ
 *
 * Nao grava nada (ver `WriteResult` no fim). E nao "conserta" a divergencia
 * entre os prints: as sobreposicoes de `demo.ts` sao aplicadas como
 * sobreposicoes, e o comentario de la diz por que.
 */

import { DEMO_PRODUCTS_PRODUTOS } from '@/lib/produtos/demo';
import type { Product } from '@/lib/produtos/types';
import {
  DEMO_RESPONSIBLE,
  DEMO_REASON_OPTIONS,
  DEMO_STOCK_MOVEMENTS,
  DEMO_STOCK_OVERRIDES,
  DEFAULT_REASON,
  type StockOverride,
} from './demo';
import {
  buildMovement,
  buildOverrideRow,
  buildStockRow,
  filterMovements,
  orderForStock,
  summarizeStock,
  type MovementFilter,
} from './metrics';
import type {
  ReasonOption,
  StockAdjustment,
  StockMovement,
  StockRow,
  StockStats,
} from './types';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

/** As sobreposicoes declaradas, por id de produto. Ver DIVERGENCIA em `demo.ts`. */
function overrideMap(): Map<string, StockOverride> {
  return new Map(DEMO_STOCK_OVERRIDES.map((override) => [override.productId, override]));
}

/**
 * A tabela de estoque inteira, ja na ordem do print.
 *
 * Duas familias de linha, e a distincao e proposital:
 *
 *   1. um PRODUTO de `lib/produtos`, projetado por `buildStockRow` — e o caso de
 *      nove das dez linhas do print;
 *   2. um produto que so o print de Estoque tem (`Conjunto Glow Nude`), montado a
 *      partir da sobreposicao — ver DIVERGENCIA em `demo.ts`.
 *
 * Os dois grupos passam pelo mesmo `orderForStock`, entao a ordem e uma so e e
 * a do print.
 *
 * A ordem de insercao aqui nao importa: quem ordena e a lista explicita. Manter
 * os dois grupos juntos e so higiene de leitura.
 */
export async function listStockRows(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<StockRow[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');

  const overrides = overrideMap();
  const rows: StockRow[] = DEMO_PRODUCTS_PRODUTOS.map((product) =>
    buildStockRow(product, overrides.get(product.id)),
  );

  // As sobreposicoes que NAO casaram com nenhum produto cadastrado viram linha
  // propria. E assim que `Conjunto Glow Nude` aparece: uma linha de estoque cujo
  // produto nao existe no cadastro.
  const known = new Set(DEMO_PRODUCTS_PRODUTOS.map((product) => product.id));
  for (const override of DEMO_STOCK_OVERRIDES) {
    if (!known.has(override.productId)) rows.push(buildOverrideRow(override));
  }

  return { data: orderForStock(rows), source: 'demo' };
}

/** Os quatro indicadores do topo do adm-028. */
export async function listStockStats(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<StockStats>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  const [rows, movements] = await Promise.all([listStockRows(), listStockMovements()]);
  return { data: summarizeStock(rows.data, movements.data), source: 'demo' };
}

/**
 * O historico de movimentacoes inteiro, sem filtro.
 *
 * O filtro dos chips e aplicado na TELA (`filterMovements`), e nao aqui: com o
 * banco, filtrar no cliente seria baixar o historico inteiro para jogar fora
 * quase tudo. O que esta funcao devolve e a lista completa de hoje; o filtro
 * entra na assinatura quando a paginacao chegar.
 */
export async function listStockMovements(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<StockMovement[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  // Mais recentes primeiro, igual ao print (as duas linhas sao identicas, mas
  // com o banco a ordem vai importar).
  const data = [...DEMO_STOCK_MOVEMENTS].sort((a, b) => b.at.localeCompare(a.at));
  return { data, source: 'demo' };
}

/** Os motivos do ajuste — os chips do print, com o campo `used`. */
export async function listReasonOptions(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<ReasonOption[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_REASON_OPTIONS.map((reason) => ({ ...reason })), source: 'demo' };
}

/** Re-exportado para a tela nao precisar decorar o indice da lista de motivos. */
export { DEFAULT_REASON, DEMO_RESPONSIBLE };
export { filterMovements };
export type { MovementFilter };

/**
 * Escrita.
 *
 * NAO PERSISTE NADA. Enquanto o Neon nao existir, estas funcoes devolvem o que
 * foi enviado para a tela poder atualizar o estado; mas `persisted: false` marca
 * explicitamente que o dado NAO foi gravado.
 *
 * Isso importa mais aqui do que em qualquer outra tela: um ajuste de estoque e a
 * operacao que muda o numero que a loja inteira usa para vender. Fingir que
 * gravou seria mostrar um estoque que nao existe em lugar nenhum.
 */
export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * O produto com a quantidade ja ajustada, e o lancamento correspondente.
 *
 * Devolve os DOIS de uma vez porque um ajuste sem historico e exatamente o
 * defeito que a tela precisa evitar: o numero mudaria e ninguem saberia por que.
 * O `id` do lancamento vem de fora (a tela gera) porque so ela sabe garantir que
 * dois ajustes no mesmo instante nao colidam.
 *
 * A quantidade JA VEM atualizada no `product` que chega: quem aplica o ajuste ao
 * estado e `applyAdjustment`, na tela, para que o mesmo valor que foi para o
 * historico seja o que ficou na tabela.
 */
export async function saveStockAdjustment(
  adjustment: StockAdjustment,
  context: {
    id: string;
    at: string;
    productName: string;
    colorName: string | null;
    responsible: string;
  },
): Promise<WriteResult<StockMovement>> {
  return {
    data: buildMovement(adjustment, context),
    persisted: false,
    reason: PENDING_REASON,
  };
}

export { PENDING_REASON };
export type { Product };
