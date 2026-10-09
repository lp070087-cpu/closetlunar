/**
 * Contas, formatacao e ordenacao de Fidelidade.
 *
 * Modulo PURO: sem React, sem I/O. E aqui que moram os defeitos que um typecheck
 * nao pega — o SINAL dos pontos, a palavra e a cor do tipo de movimentacao, a
 * ordem dos niveis e o texto dos beneficios.
 */

import { formatBRL } from '@/lib/utils';
import type { LoyaltyMovement, LoyaltyMovementType, LoyaltyTier } from './types';

/**
 * AS ABAS DA TELA, na ordem do print.
 *
 * Os tres rotulos sao LITERAIS de adm-018/019/020 — nao ha margem aqui. A ordem
 * tambem e a do print: `Configurações & Resgates` vem primeiro e por isso e a aba
 * que abre.
 */
export const LOYALTY_TABS = [
  { value: 'config', label: 'Configurações & Resgates' },
  { value: 'tiers', label: 'Níveis Clube VIP' },
  { value: 'logs', label: 'Histórico de Pontos' },
] as const;

export type LoyaltyTab = (typeof LOYALTY_TABS)[number]['value'];

/**
 * O SELO DO TIPO DE MOVIMENTACAO — a palavra.
 *
 * `Ganho` / `Resgate`, do original. A REGRA E FALSAVEL DE PROPOSITO: o original
 * escreve `log.type === 'earn' ? 'Ganho' : 'Resgate'`, ou seja, QUALQUER coisa
 * que nao seja exatamente `earn` vira `Resgate`. Nao foi endurecido para "so
 * `redeem` e resgate" — a coluna `type` vem do banco como texto livre e nao ha
 * CHECK documentado, entao seguir o original aqui e o mais fiel. Fica registrado
 * que uma linha com `type` corrompido aparece como `Resgate` e com pontos
 * NEGATIVOS (ver `formatMovementPoints`).
 */
export function movementTypeLabel(type: LoyaltyMovementType): string {
  return type === 'earn' ? 'Ganho' : 'Resgate';
}

/**
 * Os PONTOS com sinal, como a ultima coluna mostra.
 *
 * `+100` ou `-100`. O SINAL VEM DO TIPO, e nao do numero: o print nao tem linha,
 * mas o original faz `{log.type === 'earn' ? '+' : '-'}{log.points}`. Isso
 * significa que o `points` e guardado SEMPRE POSITIVO, e o sinal e derivado — uma
 * `earn` com `points: -50` imprimiria `+-50`, que e um estado que a tela permite
 * e que nao foi "consertado" por conta propria.
 *
 * O `toLocaleString('pt-BR')` entra igual ao original: mil pontos saem `1.000`.
 */
export function formatMovementPoints(movement: Pick<LoyaltyMovement, 'points' | 'type'>): string {
  const magnitude = Number(movement.points);
  const safe = Number.isFinite(magnitude) ? magnitude : 0;
  const signal = movement.type === 'earn' ? '+' : '-';
  return `${signal}${safe.toLocaleString('pt-BR')}`;
}

/**
 * O VALOR DO MULTIPLICADOR.
 *
 * O print mostra `1`, `1,2`, `1,5` e `2` dentro de um campo. O `1,2` e do
 * NAVEGADOR, e nao deste codigo: o `<input type="number">` de um navegador em
 * portugues escreve o decimal com virgula por conta propria. Nao ha formatacao
 * para fazer aqui — e por isso nao ha funcao de "formatar multiplicador" nas
 * telas. Fica registrado para ninguem "consertar" um `1,2` que nunca esteve no
 * codigo.
 */

/**
 * A ORDEM DOS NIVEIS: `min_points` crescente.
 *
 * E o `order("min_points", { ascending: true })` do original, e e o que poe
 * Bronze antes de Prata antes de Ouro antes de Diamante.
 *
 * O DESEMPATE por nome existe porque dois niveis com o mesmo `min_points` (uma
 * configuracao que a tela permite) trocariam de lugar entre renderizacoes — e com
 * eles as CORES dos cartoes, que e a unica coisa que distingue um do outro a
 * olho. Ordena numa COPIA: a lista que chega e o estado do React.
 */
export function sortTiers(rows: LoyaltyTier[]): LoyaltyTier[] {
  return [...rows].sort((a, b) => {
    const diff = Number(a.minPoints) - Number(b.minPoints);
    if (diff !== 0 && Number.isFinite(diff)) return diff;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

/**
 * O TEXTO DOS BENEFICIOS NO CAMPO.
 *
 * O campo e um `<textarea>` com o JSON, e o original escreve
 * `JSON.stringify(tier.benefits)`. Sem espacos, sem quebra de linha:
 * `["Acúmulo padrão de pontos","Cupons sazonais"]`, exatamente como adm-019.
 *
 * O `plainText` existe para NAO depender do `JSON.stringify` num lugar onde o
 * dado pode vir torto do banco (um `null`, uma string solta): ele devolve uma
 * lista vazia em vez de `undefined` no campo.
 */
export function benefitsToText(benefits: string[] | null | undefined): string {
  return JSON.stringify(plainText(benefits));
}

/** Uma lista de beneficios, seja qual for o formato em que ela chegou. */
export function plainText(benefits: string[] | null | undefined): string[] {
  if (Array.isArray(benefits)) return benefits.map((item) => String(item));
  return [];
}

/**
 * O NUMERO DE BENEFICIOS, para o resumo.
 *
 * NAO CONFUNDIR com a contagem de caracteres do campo: um nivel com a lista vazia
 * tem ZERO beneficios, e um com dois tem DOIS. E a conta que o cartao mostra
 * quando houver dado.
 */
export function countBenefits(tier: Pick<LoyaltyTier, 'benefits'>): number {
  return plainText(tier.benefits).length;
}

/**
 * A COR DO NIVEL — vinda do DADO, e nao de uma tabela fixa no codigo.
 *
 * As quatro cores de adm-019 — Bronze #CD7F32, Prata #C0C0C0, Ouro #FFD700 e
 * Diamante #B9F2FF — sao cores do REGISTRO do banco: o original pinta com
 * `style={{ color: tier.color }}` e `borderTop: 4px solid ${tier.color}}`. Os
 * quatro valores foram LIDOS DO PIXEL da tarja de cada cartao no print, e estao
 * em `demo.ts`; este comentario os repete so para dar o exemplo. Escrever os
 * quatro hexa numa `Record`
 * aqui amarraria a tela a um catalogo de niveis que o banco e quem decide — um
 * quinto nivel criado no banco nao teria cor.
 *
 * O `COR_PADRAO` cobre o unico caso que o banco nao cobre: um nivel sem `color`.
 */
export const COR_PADRAO = '#9CA3AF';

export function tierColor(tier: Pick<LoyaltyTier, 'color'>): string {
  const cor = (tier.color ?? '').trim();
  return cor.length > 0 ? cor : COR_PADRAO;
}

/** O maior nivel da lista — o ultimo na ordem crescente de pontos. Util no resumo. */
export function highestTier(rows: LoyaltyTier[]): LoyaltyTier | null {
  const ordenados = sortTiers(rows);
  return ordenados.length > 0 ? ordenados[ordenados.length - 1] : null;
}

/**
 * O VALOR EM REAIS DE UMA RECOMPENSA, LIDO DO PROPRIO ROTULO.
 *
 * Os tres rotulos de adm-018 comecam com `R$ N de desconto`, e o N e a unica
 * fonte do valor que o print tem. A tentacao era usar o campo `discountValue` —
 * mas ele NAO aparece em print nenhum, e o original so o escreve na CRIACAO
 * (`{ label: '', points: 0, discount_value: 0, id: ... }`) sem NUNCA ler de volta:
 * o `input` da tela edita apenas `label` e `points`. Ou seja, todo `discount_value`
 * vindo do banco esta zerado, e mostrar `R$ 0,00` a partir dele seria apresentar
 * como dado um campo que a referencia nunca preenche.
 *
 * O rotulo, ao contrario, esta no print E e o que a pessoa edita — entao e ele que
 * manda. Se o texto nao vier no formato `R$ N ...`, a funcao devolve o rotulo
 * inteiro, que sempre diz algo util, em vez de um `R$ 0,00` inventado.
 *
 * O separador de milhar e o decimal com virgula (`R$ 1.000,50`) tambem sao
 * aceitos, porque e assim que uma pessoa digitaria.
 */
export function formatRewardValue(label: string): string {
  const match = /^R\$\s*([\d.]+(?:,\d{1,2})?)/.exec(label.trim());
  if (!match) return label;
  const numero = Number(match[1].replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(numero) || numero <= 0) return label;
  return formatBRL(numero);
}

/**
 * SO O NUMERO, sem o `R$` — e o que o `<input>` de valor aceitaria.
 *
 * Existe separada de `formatRewardValue` porque as duas respondem perguntas
 * diferentes: uma formata para LER, a outra devolve um numero para EDITAR. Devolve
 * `null` quando o rotulo nao traz valor, e nao `0` — zero seria um valor de verdade,
 * e um campo preenchido com zero e pior do que um campo vazio.
 */
export function rewardValueFromLabel(label: string): number | null {
  const match = /^R\$\s*([\d.]+(?:,\d{1,2})?)/.exec(label.trim());
  if (!match) return null;
  const numero = Number(match[1].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

/** Os pontos de uma recompensa, com separador de milhar do print (`500`, `1.000`). */
export function formatRewardPoints(points: number): string {
  const valor = Number(points);
  return (Number.isFinite(valor) ? valor : 0).toLocaleString('pt-BR');
}
