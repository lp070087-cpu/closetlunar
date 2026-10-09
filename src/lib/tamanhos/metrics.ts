/**
 * Metricas de Tamanhos — modulo PURO, sem React e sem dados.
 *
 * Tudo aqui e funcao que entra valor e sai valor. E o que a bancada prova sem
 * precisar de navegador, e o que a tela usa para ordenar, contar e validar.
 */

import type {
  Elasticity,
  GarmentType,
  MeasurementKey,
  MeasurementRange,
  Modeling,
  ProductSizeRule,
  SizeRow,
} from './types';

/**
 * Regua canonica dos tamanhos, do MENOR para o MAIOR.
 *
 * Esta lista serve para COMPARAR — "XG e maior que G?" — e nao para ordenar a
 * tela. Ver `sortBySizeOrder` para saber por que essa distincao existe.
 *
 * Por que uma lista literal e nao `sort()`: ordenar alfabeticamente strings de
 * tamanho funciona por acidente (G < GG < M < P < PP) e quebra com `XG`, que
 * alfabeticamente cairia ANTES de `PP`.
 */
export const SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'] as const;

/**
 * Posicao do tamanho na regua (menor -> maior). Desconhecido vai para o fim.
 *
 * E a comparacao entre DOIS tamanhos — nao a ordem de exibicao. Para exibir,
 * `sortBySizeOrder`.
 */
export function sizeRank(sizeLabel: string): number {
  const index = SIZE_ORDER.indexOf(sizeLabel.trim().toUpperCase() as (typeof SIZE_ORDER)[number]);
  return index === -1 ? SIZE_ORDER.length : index;
}

/**
 * Ordena as linhas de medida — ALFABETICAMENTE.
 *
 * ISTO PARECE ERRADO E NAO E: a ordem do print adm-032 (`G`, `GG`, `M`, `P`,
 * `PP`) e a ordem alfabetica, e nao a ordem de tamanho.
 *
 * A tentacao e tratar a lista como "do maior para o menor" — eu mesmo escrevi
 * isso na primeira versao. As duas leituras dao ordens DIFERENTES, e o print
 * decide qual delas vale:
 *
 *   tamanho decrescente -> `GG` antes de `G`   (errado: o print poe `G` 1o)
 *   tamanho crescente   -> `PP` antes das outras (errado: o print poe `PP` ultimo)
 *   alfabetica          -> `G, GG, M, P, PP`    (exato)
 *
 * Ou seja: nenhuma regua de tamanho produz a ordem do print; so a alfabetica
 * produz. `SIZE_ORDER` continua existindo porque a pergunta "G e maior que PP?"
 * tem outra resposta, e essa continua sendo a da regua.
 *
 * Nao inventar um `sort()` de tamanho aqui de novo sem conferir o print: foi
 * exatamente esse "conserto" que imprimia a tabela de tras para frente.
 */
export function sortBySizeOrder(rows: SizeRow[]): SizeRow[] {
  // Copia antes de ordenar: o input e estado do React, e `sort()` no lugar
  // reordenaria o estado por baixo dos panos.
  return [...rows].sort((a, b) => a.sizeLabel.localeCompare(b.sizeLabel, 'pt-BR'));
}

/** Filtra as linhas de um tipo de peca — o que o seletor do print faz. */
export function rowsForGarment(rows: SizeRow[], garmentType: GarmentType): SizeRow[] {
  return sortBySizeOrder(rows.filter((row) => row.garmentType === garmentType));
}

/**
 * Quantas celulas do tipo de peca ja estao preenchidas, de quantas.
 *
 * O print nao mostra esse numero; ele existe para a tela poder dizer "esta
 * incompleto" sem inventar uma coluna. Uma celula conta como preenchida apenas
 * quando tem as DUAS pontas: um minimo sozinho nao e uma faixa.
 */
export function measuredCells(rows: SizeRow[]): { filled: number; total: number } {
  const KEYS: MeasurementKey[] = ['bust', 'waist', 'hip', 'height', 'weight'];
  let filled = 0;
  for (const row of rows) {
    for (const key of KEYS) {
      const range = row[key];
      if (range.min !== null && range.max !== null) filled += 1;
    }
  }
  return { filled, total: rows.length * KEYS.length };
}

/**
 * A faixa e coerente? `min` maior que `max` e impossivel numa medida real.
 *
 * Devolve a mensagem de erro, ou `null` quando esta tudo certo. Nao olha para
 * o outro lado (max < min) porque as duas pontas passam por aqui: quem grava
 * chama esta funcao com o par ja atualizado.
 */
export function rangeError(range: MeasurementRange): string | null {
  if (range.min === null || range.max === null) return null;
  if (range.min > range.max) return 'O mínimo não pode ser maior que o máximo.';
  return null;
}

/**
 * Grava um valor numa ponta da faixa.
 *
 * Aceita string porque e o que o `<input>` entrega. Vazio vira `null` — que e
 * "apagou o campo", e nao zero. Qualquer outra coisa passa por `Number`; se
 * nao virar numero finito, tambem vira `null`, em vez de `NaN` (um `NaN` num
 * estado de React envenena toda conta seguinte em silencio).
 */
export function applyMeasurement(
  range: MeasurementRange,
  end: 'min' | 'max',
  raw: string,
): MeasurementRange {
  const trimmed = raw.trim();
  if (trimmed === '') return { ...range, [end]: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { ...range, [end]: null };
  return { ...range, [end]: value };
}

/** Opcoes de modelagem, como o print adm-037 mostra no seletor. */
export const MODELING_OPTIONS: { value: Modeling; label: string }[] = [
  { value: 'pequena', label: 'Modelagem pequena' },
  { value: 'normal', label: 'Modelagem normal' },
  { value: 'grande', label: 'Modelagem grande' },
];

/** Opcoes de elasticidade, como o print adm-035 mostra no seletor. */
export const ELASTICITY_OPTIONS: { value: Elasticity; label: string }[] = [
  { value: 'baixa', label: 'Pouca elasticidade' },
  { value: 'media', label: 'Média elasticidade' },
  { value: 'alta', label: 'Alta elasticidade' },
];

/** Modelagem padrao dos produtos ainda sem regra — o `normal` do print. */
export const DEFAULT_MODELING: Modeling = 'normal';
/** Elasticidade padrao — a `media` que o print mostra selecionada. */
export const DEFAULT_ELASTICITY: Elasticity = 'media';

/** Placeholder do campo de observacoes, do print. */
export const NOTES_PLACEHOLDER = 'Ex: Tecido firme, não estica';

/**
 * A regra efetiva de um produto: a salva, ou o padrao do print.
 *
 * Mora aqui, e nao na tela, porque e REGRA e nao desenho: quando a integracao
 * chegar, o banco pode nao ter linha nenhuma para um produto novo, e o padrao
 * precisa continuar sendo o mesmo em qualquer lugar que leia a regra.
 */
export function effectiveRule(
  productId: string,
  saved: ProductSizeRule | undefined,
): ProductSizeRule {
  return (
    saved ?? {
      productId,
      modeling: DEFAULT_MODELING,
      elasticity: DEFAULT_ELASTICITY,
      notes: '',
      updatedAt: null,
    }
  );
}

/** Quantos produtos ja tem regra salva (diferente de estar no padrao). */
export function countConfigured(rules: ProductSizeRule[]): number {
  return rules.filter((rule) => rule.updatedAt !== null).length;
}
