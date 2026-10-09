/**
 * A camada de dados de Busca — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Nada aqui toca banco: não há `prisma`, não há
 * `DATABASE_URL`, não há `process.env`. O Neon entra na fase de integração, e o
 * contrato já é o que ele vai preencher.
 *
 * ================== ONDE O RECORTE DE PERÍODO ACONTECE ==================
 *
 * A janela (`7`/`30`/`90` dias) é uma DECISÃO DE LEITURA e mora aqui, não em
 * `metrics.ts`: as métricas são puras e não leem relógio, então quem transforma
 * "30 dias" na data de corte é esta camada. O original faz o mesmo —
 *
 *   since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
 *   .gte("created_at", since).order("created_at", desc).limit(2000)
 *
 * — e a ORDEM importa: as linhas vêm das MAIS RECENTES para as mais antigas, e
 * é essa ordem que o `Map` de `aggregateSearch` usa como desempate. Trocar o
 * `order` mudaria o desempate da lista sem tocar em nenhuma métrica.
 *
 * O `limit(2000)` é um TETO: uma loja movimentada pode ter milhares de buscas em
 * 30 dias, e trazer todas para agregar no cliente é caro. Quem agrupa de verdade,
 * no banco, vai agrupar em SQL — o teto é da versão atual e está anotado aqui
 * para não virar surpresa depois.
 *
 * ================== POR QUE A DEMONSTRAÇÃO É VAZIA ==================
 *
 * `search_terms` numa loja recém-instalada não tem linha. Inventar termos faria a
 * tela afirmar buscas que ninguém fez — e o estado vazio, que é o do print, nunca
 * seria exercitado. A lista vazia é o dado honesto.
 */

import { DEMO_SEARCH_TERMS } from './demo';
import { DEFAULT_WINDOW } from './metrics';
import type { SearchTermRow } from './types';

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/** O que uma leitura devolve: as linhas cruas do período e de onde vieram. */
export interface SearchTermsResult {
  data: SearchTermRow[];
  source: 'demo';
  /** Presente só enquanto a persistência não está ligada. */
  reason?: string;
}

/**
 * AS BUSCAS DE UM PERÍODO — a leitura da tela.
 *
 * Devolve as LINHAS CRUAS (não agrupadas): o agrupamento é regra, e regra mora em
 * `metrics.ts`, onde a bancada a alcança. Devolver as listas prontas daqui
 * deixaria a agregação sem prova — e ela é metade do módulo.
 *
 * `days` NÃO é aplicado na demonstração (não há linha para filtrar), mas entra na
 * assinatura porque é o parâmetro que o banco vai usar: quando o Neon ligar, é
 * aqui que a data de corte é calculada. Sem ele, a tela teria que montar a
 * consulta, e a camada de dados deixaria de ser o único ponto de contato.
 */
export async function listSearchTerms(days: number = DEFAULT_WINDOW): Promise<SearchTermsResult> {
  void days;
  return {
    data: [...DEMO_SEARCH_TERMS],
    source: 'demo',
    reason: PENDING_REASON,
  };
}

export { PENDING_REASON };
