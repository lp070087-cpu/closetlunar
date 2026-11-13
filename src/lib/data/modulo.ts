/**
 * Ajudantes dos `data.ts` dos modulos do painel, em cima de `colecao-acoes.ts`.
 *
 * Regra de leitura:
 *   - ja salvo no banco  -> devolve o salvo (`source: 'database'`);
 *   - banco ligado, nada salvo -> devolve o PADRAO REAL do modulo
 *     (configuracao inicial da loja, ou lista vazia para dados operacionais —
 *     nunca leads/tickets/pedidos inventados);
 *   - sem banco (dev local) -> devolve a demonstracao.
 */

import { gravarModuloAcao, lerModuloAcao } from './colecao-acoes';

export interface DatasetModulo<T> {
  data: T;
  source: 'demo' | 'database';
}

export async function lerModulo<T>(chave: string, demo: T, padraoReal: T): Promise<DatasetModulo<T>> {
  const r = await lerModuloAcao(chave);
  if (r.existe) return { data: r.valor as T, source: 'database' };
  if (r.banco) return { data: padraoReal, source: 'database' };
  return { data: demo, source: 'demo' };
}

export async function gravarModulo<T>(chave: string, valor: T): Promise<{ persisted: boolean; reason?: string }> {
  const r = await gravarModuloAcao(chave, valor);
  return { persisted: r.ok, reason: r.reason };
}

/** Insere ou substitui um item (por `id`) numa colecao salva. */
export async function salvarItem<T extends { id: string }>(
  chave: string,
  atual: T[],
  item: T,
): Promise<{ data: T; persisted: boolean; reason?: string }> {
  const i = atual.findIndex((x) => x.id === item.id);
  const nova = i >= 0 ? atual.map((x) => (x.id === item.id ? item : x)) : [...atual, item];
  const r = await gravarModulo(chave, nova);
  return { data: item, ...r };
}

export async function removerItem<T extends { id: string }>(
  chave: string,
  atual: T[],
  id: string,
): Promise<{ data: { id: string }; persisted: boolean; reason?: string }> {
  const r = await gravarModulo(
    chave,
    atual.filter((x) => x.id !== id),
  );
  return { data: { id }, ...r };
}

export const MOTIVO_PADRAO = 'Não foi possível salvar agora. Tente novamente.';
