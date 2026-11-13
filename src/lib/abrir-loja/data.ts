/**
 * A camada de dados de Abrir Loja — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda.
 */

import { DEMO_CHECKLIST, DEMO_OUTCOMES } from './demo';
import type { ChecklistId, ChecklistItem, CheckOutcome } from './types';
import { checklistAcao } from '@/lib/data/registros-acoes';

const PENDING_REASON = 'Verificação feita com os dados reais da loja.';

export async function listChecklist(): Promise<{ data: ChecklistItem[]; source: 'demo' | 'database'; reason?: string }> {
  return { data: DEMO_CHECKLIST.map((i) => ({ ...i })), source: 'database' };
}

async function resultados(): Promise<Record<string, CheckOutcome> | null> {
  return (await checklistAcao()) as Record<string, CheckOutcome> | null;
}

export async function checkItem(id: ChecklistId): Promise<{ data: CheckOutcome; source: 'demo' | 'database'; reason?: string }> {
  const r = await resultados();
  if (r && r[id]) return { data: r[id], source: 'database' };
  return { data: { ...DEMO_OUTCOMES[id] }, source: 'demo' };
}

export async function checkAll(items: ChecklistItem[]): Promise<{
  data: { id: ChecklistId; outcome: CheckOutcome }[];
  source: 'demo' | 'database';
  reason?: string;
}> {
  const r = await resultados();
  const data = items.map((i) => ({ id: i.id, outcome: r && r[i.id] ? r[i.id] : { ...DEMO_OUTCOMES[i.id] } }));
  return { data, source: r ? 'database' : 'demo' };
}

export const CHECKLIST_UPDATED_MESSAGE = 'Checklist atualizado';

export { PENDING_REASON };
