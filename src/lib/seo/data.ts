/**
 * A camada de dados de SEO & Google — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda: a
 * assinatura continua a mesma e nenhum componente precisa ser tocado.
 */

import { DEMO_SEO } from './demo';
import type { SeoConfig } from './types';
import { lerModulo, gravarModulo } from '@/lib/data/modulo';

const PENDING_REASON = 'Não foi possível salvar agora. Tente novamente.';

export async function getSeoConfig(): Promise<{ data: SeoConfig; source: 'demo' | 'database'; reason?: string }> {
  return lerModulo<SeoConfig>('seo:config', { ...DEMO_SEO }, { ...DEMO_SEO });
}

export async function saveSeoConfig(
  config: SeoConfig,
): Promise<{ data: SeoConfig; persisted: boolean; reason?: string }> {
  const r = await gravarModulo('seo:config', config);
  return { data: { ...config }, persisted: r.persisted, reason: r.persisted ? undefined : r.reason ?? PENDING_REASON };
}

export { PENDING_REASON };
