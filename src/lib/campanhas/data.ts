/**
 * Camada de dados de Campanhas.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts`. Quando o Neon entrar, troca-se o corpo destas funcoes; a
 * assinatura e as telas continuam iguais.
 *
 * ================== O QUE VAI DEPENDER DO NEON ==================
 *
 *   `campaigns` — uma linha por campanha, com as colunas snake_case do original
 *   (`name`, `description`, `type`, `starts_at`, `expires_at`, `is_active`,
 *   `banner_url`, `banner_url_mobile`, `badge_text`, `discount_value`,
 *   `discount_type`, `min_order_value`, `target_ids`, `rules`, `created_at`).
 *
 *   `campaign_usage` — uma linha por USO, com `campaign_id` e
 *   `revenue_generated`. E daqui que sai o card `Campanhas com mais venda`:
 *   agrupa por campanha, conta os usos e soma a receita.
 *
 *   O `type` e o `discount_type` precisam de CHECK (ou enum) com exatamente os
 *   valores que `types.ts` declara — sao seis e dois. Sem a restricao, um valor
 *   fora da lista passa pelo TypeScript (que so ve a tela) e chega ao banco, e a
 *   coluna TIPO imprime o valor cru que `campaignTypeLabel` nao conhece.
 *
 * ================== A DIVERGENCIA DE `sales` ==================
 *
 * O original chama de `sales` a CONTAGEM DE USOS (`entry.sales += 1` por linha de
 * `campaign_usage`), e nao a quantidade de itens vendidos. O nome do campo diz
 * uma coisa e o dado diz outra. A divergencia esta registrada em `types.ts`;
 * nenhuma tela mostra esse numero hoje (os dois cards estao vazios em todos os
 * prints), entao NAO se inventou uma semantica para ele — manteve-se o que o
 * original faz, com o nome que ele usa.
 *
 * ================== A UNIAO COM CUPONS ==================
 *
 * O card `Cupons mais usados` NAO e lido aqui. Ele e dado do modulo CUPONS e sai
 * de `topUsedCoupons` em `lib/cupons/metrics.ts`, que a tela chama diretamente.
 * Nao ha copia da logica de cupons dentro deste modulo — o `CouponReport` do
 * original fazia a propria query, e reproduzir isso aqui criaria dois donos para
 * o mesmo numero. Ver `campanhas-view.tsx`.
 */

import { DEMO_CAMPAIGNS, DEMO_CAMPAIGN_PERFORMANCE } from './demo';
import { sortCampaigns } from './metrics';
import type { Campaign, CampaignPerformance } from './types';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

/**
 * Leitura da lista.
 *
 * Assincrona de proposito, mesmo servindo dados locais: e o que a chamada ao
 * Neon vai ser, e assim nenhuma tela precisa mudar de sincrona para assincrona
 * depois.
 *
 * A ordem e a do original — `created_at` decrescente. Ver `sortCampaigns`.
 */
export async function listCampaigns(options?: { signal?: AbortSignal }): Promise<Dataset<Campaign[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: sortCampaigns(DEMO_CAMPAIGNS), source: 'demo' };
}

/** Uma campanha por id. `null` quando nao existe. */
export async function getCampaign(id: string): Promise<Dataset<Campaign | null>> {
  return { data: DEMO_CAMPAIGNS.find((campaign) => campaign.id === id) ?? null, source: 'demo' };
}

/**
 * O desempenho por campanha — o dado do card `Campanhas com mais venda`.
 *
 * Vazio hoje pelos motivos de `demo.ts`. Quando o Neon entrar, esta funcao faz o
 * agrupamento de `campaign_usage` e devolve `CampaignPerformance[]`; a tela nao
 * muda, porque quem ordena e corta e `topCampaignsByRevenue`.
 */
export async function listCampaignPerformance(): Promise<Dataset<CampaignPerformance[]>> {
  return { data: DEMO_CAMPAIGN_PERFORMANCE, source: 'demo' };
}

/**
 * Escrita.
 *
 * NAO PERSISTE NADA. Enquanto o Neon nao existir, estas funcoes devolvem o que
 * foi enviado para que a tela possa fechar o formulario e atualizar a lista; mas
 * `persisted: false` marca explicitamente que o dado NAO foi gravado.
 *
 * O ORIGINAL MOSTRA `toast.success("Campanha criada")`. Reproduzir essa
 * confirmacao aqui seria a mentira mais cara do modulo: a campanha apareceria na
 * lista e NAO existiria no banco, e a loja so descobriria quando a promocao nao
 * aplicasse o desconto no checkout. A tela DIZ que nao gravou. Ver
 * `campaign-form.tsx`.
 */
export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

export async function createCampaign(campaign: Campaign): Promise<WriteResult<Campaign>> {
  return { data: campaign, persisted: false, reason: PENDING_REASON };
}

export async function updateCampaign(campaign: Campaign): Promise<WriteResult<Campaign>> {
  return { data: campaign, persisted: false, reason: PENDING_REASON };
}

export async function deleteCampaign(id: string): Promise<WriteResult<{ id: string }>> {
  return { data: { id }, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
