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
import { lerModulo } from '@/lib/data/modulo';

const PENDING_REASON = 'Ainda não há buscas registradas.';

export interface SearchTermsResult {
  data: SearchTermRow[];
  source: 'demo' | 'database';
  reason?: string;
}

export async function listSearchTerms(days: number = DEFAULT_WINDOW): Promise<SearchTermsResult> {
  void days;
  return lerModulo<SearchTermRow[]>('busca:termos', [...DEMO_SEARCH_TERMS], []);
}

export { PENDING_REASON };
