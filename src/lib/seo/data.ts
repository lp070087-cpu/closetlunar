/**
 * A camada de dados de SEO & Google — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda: a
 * assinatura continua a mesma e nenhum componente precisa ser tocado.
 */

import { DEMO_SEO } from './demo';
import type { SeoConfig } from './types';

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * A configuração de SEO da loja.
 *
 * FUTURO (Neon): `settings WHERE key = 'site'` — o original guarda TUDO num único
 * registro `site`, com o SEO dentro do mesmo objeto. Devolve cópia: a tela edita
 * campo a campo e não pode escrever na demonstração do módulo.
 */
export async function getSeoConfig(): Promise<{
  data: SeoConfig;
  source: 'demo';
  reason: string;
}> {
  return { data: { ...DEMO_SEO }, source: 'demo', reason: PENDING_REASON };
}

/**
 * A gravação. FUTURO (Neon): upsert do registro `site` com os campos de SEO.
 *
 * Devolve `persisted: false` como todo o resto do painel — a tela mostra o motivo
 * em vez de fingir um "Configurações de SEO salvas!".
 */
export async function saveSeoConfig(
  config: SeoConfig,
): Promise<{ data: SeoConfig; persisted: false; reason: string }> {
  return { data: { ...config }, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
