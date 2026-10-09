/**
 * Camada de dados do Carrinho Abandonado.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts`, e nenhum conhece Prisma. Quando o Neon entrar, troca-se
 * o corpo destas funcoes; a assinatura e as telas continuam iguais.
 *
 * O MÓDULO E O DONO DA LISTA. Ver a nota de propriedade em `demo.ts`: os tres
 * carrinhos deixaram `lib/crm/demo.ts` e passaram a morar aqui. `lib/crm/data.ts`
 * le daqui — nao ha duas listas de carrinhos no projeto.
 *
 * ============================ A ESCRITA ============================
 *
 * ESTA TELA TEM UM BOTAO QUE GRAVA. `SALVAR CONFIGURACOES` existe em adm-009, e
 * o original faz `upsert` em `abandoned_cart_config`.
 *
 * As outras telas do painel nao gravam em lugar nenhum — a acao de Pedidos
 * (`Alterar status`) nao tem print, e o CRM nao tem escrita. Aqui a escrita ESTA
 * na referencia, e por isso ela e declarada: `saveCartConfig` existe, devolve
 * `WriteResult` com `persisted: false`, e a tela diz na cara que nao gravou.
 *
 * O QUE NAO SE FAZ: devolver `persisted: true` sobre uma variavel de memoria. O
 * dado sumiria ao recarregar e a tela teria mentido. `persisted: false` com o
 * motivo e a unica resposta honesta enquanto nao ha banco — e e o mesmo padrao
 * de `lib/categorias`, `lib/produtos`, `lib/estoque` e `lib/tamanhos`.
 *
 * O QUE DEPENDERA DO NEON
 *
 *   carrinhos     a tabela `abandoned_carts`, ordenada por `created_at desc`
 *   KPIs          as quatro contagens saem da MESMA consulta, sem ida extra
 *   configuracao  `abandoned_cart_config` — uma linha so (`maybeSingle`)
 *   salvar        `upsert` nessa linha, e nao `insert` (e a mesma tabela sempre)
 *   disparos      quem DISPARA as mensagens de verdade e o servidor, num cron
 *                 lendo `created_at` e os atrasos; esta tela so configura
 *   status        `recovered` / `lost` sao escritos pelo checkout e pelo cron,
 *                 e nao por esta tela — nenhum print mostra mudar status a mao
 */

import {
  DEMO_ABANDONED_CARTS,
  DEMO_CART_CONFIG,
} from './demo';
import { buildCartConfig, buildCartStats, sortCarts } from './metrics';
import type { CartConfig, CartDataset } from './types';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

/**
 * Tudo o que a tela precisa, numa leitura so.
 *
 * Os indicadores saem da MESMA lista que a tabela desenha — separar em duas
 * chamadas faria o topo contar uma lista e a tabela mostrar outra no dia em que
 * o dado mudasse no meio. O original tambem le as duas coisas juntas.
 */
export async function getCartDataset(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<CartDataset>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');

  const carts = sortCarts(DEMO_ABANDONED_CARTS);
  return {
    data: {
      carts,
      stats: buildCartStats(carts),
      config: buildCartConfig(DEMO_CART_CONFIG),
    },
    source: 'demo',
  };
}

/** So os carrinhos, na ordem da tabela — para quem nao precisa dos KPIs. */
export async function listAbandonedCarts(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<CartDataset['carts']>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: sortCarts(DEMO_ABANDONED_CARTS), source: 'demo' };
}

/** So a configuracao de adm-009. */
export async function getCartConfig(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<CartConfig>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: buildCartConfig(DEMO_CART_CONFIG), source: 'demo' };
}

export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * Salva a configuracao de recuperacao.
 *
 * DEVOLVE `persisted: false` DE PROPOSITO. O objeto volta atualizado — a tela
 * pode mostra-lo na tela como o usuario o deixou — mas ele NAO foi para banco
 * nenhum, e o `reason` diz isso com todas as letras. E o unico jeito de a tela
 * ter o botao que a referencia mostra sem afirmar uma gravacao que nao houve.
 *
 * Repare que NAO ha `console.log` de sucesso nem `toast` de "salvo aqui": o
 * feedback de "nao persistiu" e responsabilidade da tela, que le `persisted` e
 * escolhe a mensagem. A camada de dados nao inventa confirmacao.
 */
export async function saveCartConfig(config: CartConfig): Promise<WriteResult<CartConfig>> {
  return { data: buildCartConfig(config), persisted: false, reason: PENDING_REASON };
}

export type { AbandonedCart, CartConfig, CartDelay, CartDataset, CartStats, CartStatus } from './types';
export { DEMO_ABANDONED_CARTS, DEMO_CART_CONFIG };
