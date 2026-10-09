/**
 * A camada de dados de Abrir Loja — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda.
 */

import { DEMO_CHECKLIST, DEMO_OUTCOMES } from './demo';
import type { ChecklistId, ChecklistItem, CheckOutcome } from './types';

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * O checklist, com todo item em `pending`.
 *
 * FUTURO (Neon): o estado inicial não muda — os itens são fixos, e a verificação
 * é que os pinta.
 */
export async function listChecklist(): Promise<{
  data: ChecklistItem[];
  source: 'demo';
  reason: string;
}> {
  return { data: DEMO_CHECKLIST.map((i) => ({ ...i })), source: 'demo', reason: PENDING_REASON };
}

/**
 * A verificação de UM item — o coração da tela.
 *
 * ================== NADA AQUI É MARCADO À MÃO ==================
 *
 * Cada item é uma CONSULTA. O original faz exatamente isso: conta produtos ativos,
 * conta categorias, conta banners ativos, lê `settings` para o Instagram e o
 * WhatsApp, conta políticas no rodapé, conta métodos de frete, e olha o gateway de
 * pagamento. O resultado é o que pinta o item de verde ou vermelho. Não existe
 * caixa de marcar, e o subtítulo do print diz isso por extenso.
 *
 * FUTURO (Neon), item a item:
 *   products   SELECT count(*) FROM products WHERE is_active
 *   categories SELECT count(*) FROM categories
 *   stock      SELECT count(*) FROM products WHERE is_active AND stock > 0
 *   banner     SELECT count(*) FROM banners WHERE is_active
 *   instagram  settings WHERE key IN ('store','site')  — `instagram_url` | `instagram_username`
 *   whatsapp   settings WHERE key IN ('site','footer') — dígitos >= 10
 *   policy     settings WHERE key='footer'  — `policies[]`
 *   shipping   settings WHERE key='shipping' — `methods[]`
 *   payment    settings WHERE key='payment_gateway' — `enabled` | `provider`
 *
 * Enquanto o Neon não está conectado, devolve o resultado que a CAPTURA mostra —
 * inclusive os três vermelhos. Inventar verdes deixaria a loja "pronta para
 * produção" na tela enquanto os dados reais dizem o contrário.
 */
export async function checkItem(id: ChecklistId): Promise<{
  data: CheckOutcome;
  source: 'demo';
  reason: string;
}> {
  return { data: { ...DEMO_OUTCOMES[id] }, source: 'demo', reason: PENDING_REASON };
}

/**
 * Roda todas as verificações, na ordem dos itens.
 *
 * Devolve os resultados na mesma ordem de entrada, para que a tela possa aplicar
 * um a um e mostrar a barra subindo — como o original faz no laço.
 */
export async function checkAll(items: ChecklistItem[]): Promise<{
  data: { id: ChecklistId; outcome: CheckOutcome }[];
  source: 'demo';
  reason: string;
}> {
  const data = items.map((i) => ({ id: i.id, outcome: { ...DEMO_OUTCOMES[i.id] } }));
  return { data, source: 'demo', reason: PENDING_REASON };
}

/**
 * ================== SOBRE O AVISO "Checklist atualizado" ==================
 *
 * O original mostra `toast.success('Checklist atualizado')` no fim da rodada, e o
 * print adm-089 flagra esse aviso no canto superior direito. A frase é VERDADEIRA
 * aqui — a rodada de verificação realmente aconteceu —, diferente de um "salvo com
 * sucesso" de escrita. Por isso ela é mostrada, e não trocada por um aviso de
 * "não gravado": verificar não grava nada.
 *
 * O projeto NÃO tem biblioteca de toast. O aviso é desenhado na própria tela, no
 * mesmo lugar e com a mesma cara do print — ver `ChecklistToast`.
 */
export const CHECKLIST_UPDATED_MESSAGE = 'Checklist atualizado';

export { PENDING_REASON };
