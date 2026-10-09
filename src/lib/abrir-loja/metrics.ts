/**
 * As medidas de Abrir Loja — funções PURAS, sem React, sem I/O e sem `Date.now()`.
 *
 * Tudo o que a tela calcula (a contagem, a porcentagem, o rótulo do selo, as
 * frases dos dois avisos) passa por aqui, para poder ser provado por bancada.
 */

import type { CheckStatus, ChecklistItem } from './types';

/* ====================== as definições fixas ====================== */

/** O título do cartão do topo. */
export const PAGE_TITLE = 'Abrir Loja — Checklist de Produção';

/** O subtítulo — a frase que explica que nada é marcado à mão. */
export const PAGE_DESCRIPTION =
  'Verificações reais no banco de dados. Cada item só fica verde quando o dado existe.';

/** O botão do cabeçalho. */
export const RECHECK_LABEL = 'Revalidar';

/* ====================== a contagem e a porcentagem ====================== */

/** Quantos itens ficaram `ok`. */
export function okCount(items: ChecklistItem[]): number {
  return items.filter((i) => i.status === 'ok').length;
}

/**
 * A porcentagem, ARREDONDADA — `Math.round`, como o original. Seis de nove dá
 * 66,66…% e o print mostra **67%**; truncar daria 66 e não bateria.
 */
export function progressPercent(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((okCount(items) / items.length) * 100);
}

/** `6 DE 9 ITENS PRONTOS` — em caixa alta, como o print. */
export function progressLabel(items: ChecklistItem[]): string {
  return `${okCount(items)} de ${items.length} itens prontos`;
}

/**
 * A loja está pronta quando TODOS os itens ficaram verdes. Não há oitenta por
 * cento: ou está tudo pronto, ou não está.
 */
export function isReady(items: ChecklistItem[]): boolean {
  return items.length > 0 && items.every((i) => i.status === 'ok');
}

/** A frase do aviso abaixo da barra — verde quando pronto, âmbar quando não. */
export function readyMessage(items: ChecklistItem[]): string {
  return isReady(items)
    ? 'Loja pronta para produção.'
    : 'Finalize os itens pendentes antes de abrir.';
}

/* ====================== o selo de cada linha ====================== */

/** `OK` · `Pendente` · `...` · `—`, como o original escreve. */
export function statusLabel(status: CheckStatus): string {
  if (status === 'ok') return 'OK';
  if (status === 'fail') return 'Pendente';
  if (status === 'checking') return '...';
  return '—';
}

export type StatusTone = 'ok' | 'fail' | 'neutral';

/** O tom do selo: verde, vermelho, ou neutro enquanto não se sabe. */
export function statusTone(status: CheckStatus): StatusTone {
  if (status === 'ok') return 'ok';
  if (status === 'fail') return 'fail';
  return 'neutral';
}

/** Ligar/desligar o ícone de linha: só `ok` e `fail` mostram o símbolo. */
export function showsRowIcon(status: CheckStatus): boolean {
  return status === 'ok' || status === 'fail';
}

/* ====================== a aplicação do resultado ====================== */

/**
 * Aplica o resultado de uma verificação a um item, sem tocar nos outros.
 *
 * PURA de propósito: devolve uma lista NOVA. Se mutasse o array, a tela não
 * re-renderizaria num componente React e a bancada não conseguiria comparar o
 * antes com o depois.
 */
export function applyOutcome(
  items: ChecklistItem[],
  id: string,
  outcome: { status: CheckStatus; detail?: string },
): ChecklistItem[] {
  return items.map((i) => (i.id === id ? { ...i, ...outcome } : i));
}

/** Marca UM item como `checking`, limpando o detalhe antigo. */
export function markChecking(items: ChecklistItem[], id: string): ChecklistItem[] {
  return applyOutcome(items, id, { status: 'checking', detail: undefined });
}

/** Zera a limpeza: todo item volta a `pending` antes de uma nova rodada. */
export function resetAll(items: ChecklistItem[]): ChecklistItem[] {
  return items.map((i) => ({ ...i, status: 'pending' as CheckStatus, detail: undefined }));
}
