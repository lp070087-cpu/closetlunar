/**
 * Tipos de Fidelidade.
 *
 * OS NOMES ESPELHAM AS COLUNAS DO ORIGINAL, e nao um modelo desenhado aqui. O
 * banco da referencia tem tres tabelas — `loyalty_config` (chave/valor),
 * `loyalty_tiers` (os niveis) e `loyalty_points` (o extrato) — e os campos abaixo
 * correspondem um a um ao que aquelas tabelas guardam. Quando o Neon entrar, a
 * conversao e direta, sem um "modelo bonito" no meio para traduzir.
 *
 * ISSO IMPORTA PORQUE ESTE MODULO TEM POUCO PRINT: tres telas e so. O que os
 * prints nao dizem — os nomes das colunas — vem do schema, e nao da imaginacao.
 */

/**
 * As regras gerais do programa.
 *
 * `loyalty_config` e uma tabela CHAVE/VALOR: a linha de chave `general_rules`
 * guarda este objeto inteiro numa coluna `jsonb`. Por isso ele nao tem tabela
 * propria e por isso os tres campos moram juntos.
 */
export interface LoyaltyRules {
  /** Quantos pontos a cliente ganha por cada R$ 1,00 gasto. */
  pointsPerReal: number;
  /** Pontos de bonus quando a cliente indica alguem. */
  pointsForReferral: number;
  /** Pontos de bonus quando a cliente avalia um produto. */
  pointsForReview: number;
  /** O programa esta ligado? O print mostra o quadradinho MARCADO. */
  isEnabled: boolean;
}

/**
 * Uma recompensa resgatavel.
 *
 * A SEGUNDA linha de `loyalty_config` (chave `rewards`) guarda um ARRAY destes.
 * O `id` existe porque cada linha da lista precisa de uma `key` propria no React
 * — no original ele e `Date.now().toString()`, gerado na hora de adicionar. Ver a
 * divergencia registrada em `metrics.ts` sobre esse id.
 */
export interface LoyaltyReward {
  id: string;
  label: string;
  points: number;
  discountValue: number;
}

/**
 * Um nivel do Clube VIP.
 *
 * `loyalty_tiers` tem tabela propria, com `order by min_points asc` na leitura —
 * e a ORDEM DA LISTA no original. Ver `sortTiers`.
 *
 * `benefits` e uma LISTA DE STRINGS gravada como JSON, e nao uma lista de
 * objetos. A tela edita o JSON em texto puro (um `<textarea>`), como o original.
 */
export interface LoyaltyTier {
  id: string;
  name: string;
  /** Cor da tarja do topo do cartao e do nome. Vem do banco, nao do codigo. */
  color: string;
  minPoints: number;
  multiplier: number;
  benefits: string[];
}

/**
 * Uma movimentacao de pontos — a linha do extrato.
 *
 * `type` e `'earn' | 'redeem'`, e e ele que decide TUDO na linha: a cor do selo,
 * a palavra (`Ganho`/`Resgate`) e o SINAL dos pontos. Ver `metrics.ts`.
 */
export type LoyaltyMovementType = 'earn' | 'redeem';

export interface LoyaltyMovement {
  id: string;
  customerEmail: string;
  createdAt: string;
  description: string;
  type: LoyaltyMovementType;
  points: number;
}

/**
 * Um rascunho das REGRAS GERAIS: os tres numeros sao TEXTO enquanto se digita.
 *
 * `LoyaltyRules` e o formato GRAVADO (numeros); este e o formato EDITADO. A
 * separacao existe pelo mesmo motivo de `RewardDraft` e `TierDraft`, e ela nao e
 * decoracao: o campo de `Pontos por R$ 1,00` decide quantos pontos a loja INTEIRA
 * passa a dar. Se ele guardasse numero, apagar o campo para digitar outro valor
 * escreveria um `0` que ninguem digitou — e um `0` aqui nao e um campo vazio, e o
 * programa de pontos desligado de facto. Ver `toNumber`.
 */
export interface RulesDraft {
  pointsPerReal: string;
  pointsForReferral: string;
  pointsForReview: string;
  isEnabled: boolean;
}

/** Um rascunho de recompensa em edicao: os numeros sao TEXTO enquanto se digita. */
export interface RewardDraft {
  id: string;
  label: string;
  /** Texto, e nao numero: o campo precisa poder ficar VAZIO. Ver `form.ts`. */
  points: string;
}

/** Um rascunho de nivel: o mesmo motivo, nos tres campos editaveis. */
export interface TierDraft {
  id: string;
  name: string;
  color: string;
  minPoints: string;
  multiplier: string;
  /** Os beneficios sao editados como JSON em texto. */
  benefitsText: string;
}

/**
 * O JSON de beneficios e um CAMPO DE TEXTO na tela.
 *
 * O erro so pode ser acusado no campo que o causou, e nao descartado em silencio
 * como o original faz (`catch(e) {}`). Por isso o erro e por id de nivel.
 */
export type TierJsonError = Record<string, string>;
