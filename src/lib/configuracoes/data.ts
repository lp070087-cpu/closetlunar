/**
 * A camada de dados de Configurações — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda: as
 * assinaturas continuam as mesmas e nenhum componente precisa ser tocado.
 */

import {
  DEMO_CONNECTION,
  DEMO_DELIVERY_ZONES,
  DEMO_MELHOR_ENVIO,
  DEMO_PAYMENTS,
} from './demo';
import type { ConnectionInfo, DeliveryZone, MelhorEnvioConfig, PaymentConfig } from './types';

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * As zonas de entrega própria.
 *
 * FUTURO (Neon): `local_delivery_zones ORDER BY state, city`. Devolve cópias — a
 * tela edita preço em memória e não pode escrever na demonstração do módulo.
 */
export async function listDeliveryZones(): Promise<{
  data: DeliveryZone[];
  source: 'demo';
  reason: string;
}> {
  return { data: DEMO_DELIVERY_ZONES.map((zona) => ({ ...zona })), source: 'demo', reason: PENDING_REASON };
}

/**
 * A configuração do Melhor Envio.
 *
 * FUTURO (Neon): `settings WHERE key = 'melhor_envio'`.
 */
export async function getMelhorEnvio(): Promise<{
  data: MelhorEnvioConfig;
  source: 'demo';
  reason: string;
}> {
  return { data: { ...DEMO_MELHOR_ENVIO }, source: 'demo', reason: PENDING_REASON };
}

/** O estado da conexão OAuth. FUTURO (Neon): `shipping_settings WHERE provider = 'melhor_envio'`. */
export async function getConnection(): Promise<{
  data: ConnectionInfo;
  source: 'demo';
  reason: string;
}> {
  return { data: { ...DEMO_CONNECTION }, source: 'demo', reason: PENDING_REASON };
}

/** As credenciais de pagamento. FUTURO (Neon): `payment_settings WHERE provider = 'infinitepay'`. */
export async function getPayments(): Promise<{
  data: PaymentConfig;
  source: 'demo';
  reason: string;
}> {
  return { data: { ...DEMO_PAYMENTS }, source: 'demo', reason: PENDING_REASON };
}

/** A gravação da entrega própria. FUTURO (Neon): `UPDATE local_delivery_zones SET price = $2 WHERE id = $1`. */
export async function saveZonePrices(
  prices: { id: string; price: number }[],
): Promise<{ data: { id: string; price: number }[]; persisted: false; reason: string }> {
  return { data: prices.map((p) => ({ ...p })), persisted: false, reason: PENDING_REASON };
}

/** A gravação do Melhor Envio. FUTURO (Neon): `settings` upsert por `key`. */
export async function saveMelhorEnvio(
  config: MelhorEnvioConfig,
): Promise<{ data: MelhorEnvioConfig; persisted: false; reason: string }> {
  return { data: { ...config }, persisted: false, reason: PENDING_REASON };
}

/** A gravação do pagamento. FUTURO (Neon): `payment_settings` upsert por `provider`. */
export async function savePayments(
  config: PaymentConfig,
): Promise<{ data: PaymentConfig; persisted: false; reason: string }> {
  return { data: { ...config }, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
