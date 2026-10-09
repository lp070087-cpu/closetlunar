/**
 * Regras de formulario e de edicao de Fidelidade.
 *
 * Modulo PURO (sem React), pelo mesmo motivo dos outros modulos do painel:
 * validacao dentro de JSX nao se testa.
 *
 * DUAS COISAS AQUI NAO SAO VALIDACAO, sao CONVERSAO — e a diferenca importa:
 *
 *   O rascunho guarda numero como TEXTO. Fidelidade e o modulo do painel onde
 *   isso pesa mais, porque a tela tem DOZE campos numericos (tres de regras, dois
 *   por recompensa, tres por nivel). Se cada um virasse `Number(e.target.value)`
 *   como no original, apagar o campo para redigitar escreveria `0` e o campo
 *   ficaria com um zero que ninguem digitou. Ver `toNumber`.
 *
 *   O JSON dos beneficios e TEXTO enquanto se digita. O original faz
 *   `try { JSON.parse(...) } catch(e) {}` — ou seja, uma lista de beneficios
 *   digitada com uma virgula a mais NAO e gravada e a pessoa nao fica sabendo.
 *   Aqui o erro sobe para o campo. Ver `parseBenefits`.
 */

import type {
  LoyaltyMovement,
  LoyaltyReward,
  LoyaltyRules,
  LoyaltyTier,
  RewardDraft,
  RulesDraft,
  TierDraft,
} from './types';
import { benefitsToText, plainText, rewardValueFromLabel } from './metrics';

/**
 * TEXTO -> NUMERO, com o vazio valendo ZERO.
 *
 * O `Number('')` do JS ja da `0`; o `Number('abc')` da `NaN`, e e isso que a
 * guarda pega. Nao existe validacao de "campo obrigatorio" aqui porque o original
 * nao tem nenhuma nesta tela: um nivel com zero pontos e zero multiplicador e
 * salvavel na referencia, e nao foi inventada uma regra para impedir.
 */
export function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * NUMERO -> TEXTO para o campo, SEM preferencia de idioma.
 *
 * `String(1.2)` da `"1.2"`, que e o que um `<input type="number">` espera
 * INDEPENDENTE da lingua: o atributo `value` de um input numerico e sempre em
 * ponto, e o navegador e que desenha a virgula para a pessoa. Usar
 * `toLocaleString` aqui devolveria `"1,2"`, o navegador nao reconheceria o valor
 * e o campo abriria VAZIO na edicao — o mesmo defeito das datas em Cupons, em
 * outro campo.
 */
export function toField(value: number): string {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '';
}

/** Zero vira campo VAZIO — mesma regra dos outros modulos do painel. */
function toFieldEmptyOnZero(value: number): string {
  return Number(value) === 0 ? '' : toField(value);
}

/* ------------------------------------------------------------------ regras */

/**
 * Regras -> rascunho.
 *
 * OS TRES CAMPOS VAZIOS QUANDO ZERO, como nos outros modulos. E aqui isso tem um
 * efeito que precisa ficar dito: um programa recem-instalado tem `pointsPerReal:
 * 0` de verdade (a linha `general_rules` do banco nao existe e o original cai para
 * `{}`), e nesse caso o campo abre EM BRANCO — que e exatamente o que ele e. O
 * zero nao e escondido, ele e o mesmo estado do campo que sempre foi.
 */
export function rulesToDraft(rules: LoyaltyRules): RulesDraft {
  return {
    pointsPerReal: toFieldEmptyOnZero(rules.pointsPerReal),
    pointsForReferral: toFieldEmptyOnZero(rules.pointsForReferral),
    pointsForReview: toFieldEmptyOnZero(rules.pointsForReview),
    isEnabled: Boolean(rules.isEnabled),
  };
}

/** Rascunho -> regras, no formato que o `jsonb` do banco guarda. */
export function draftToRules(draft: RulesDraft): LoyaltyRules {
  return {
    pointsPerReal: toNumber(draft.pointsPerReal),
    pointsForReferral: toNumber(draft.pointsForReferral),
    pointsForReview: toNumber(draft.pointsForReview),
    isEnabled: draft.isEnabled,
  };
}

/* ------------------------------------------------------------- recompensas */

/**
 * Recompensa -> rascunho.
 *
 * O `points` fica VAZIO quando e zero (a recompensa recem-adicionada nasce com
 * `points: 0` no original) para que o campo mostre o `placeholder` `Pontos` em
 * vez de um zero que ninguem digitou.
 */
export function rewardToDraft(reward: LoyaltyReward): RewardDraft {
  return {
    id: reward.id,
    label: reward.label,
    points: toFieldEmptyOnZero(reward.points),
  };
}

/**
 * Rascunho -> recompensa.
 *
 * O `discountValue` e DERIVADO DO ROTULO, e nao carregado de lugar nenhum. Ver
 * `formatRewardValue`: o original grava este campo na criacao e nunca o le de
 * volta, entao todo valor vindo do banco esta zerado. Derivando-o do texto que a
 * pessoa escreveu, o campo deixa de ser um zero sem significado e passa a
 * acompanhar o que esta na tela — e o contrato do original (`label`, `points`,
 * `discount_value`, `id`) continua intacto para quando o Neon entrar.
 *
 * Quando o rotulo nao traz valor (`Frete grátis`, por exemplo), o campo fica ZERO
 * — e nao `null` —, porque o JSON do original guarda numero.
 */
export function draftToReward(draft: RewardDraft, base?: LoyaltyReward): LoyaltyReward {
  return {
    id: draft.id,
    label: draft.label,
    points: toNumber(draft.points),
    discountValue: rewardValueFromLabel(draft.label) ?? (base ? Number(base.discountValue) || 0 : 0),
  };
}

/**
 * UMA RECOMPENSA NOVA.
 *
 * O `id` e estavel dentro da sessao e NAO e `Date.now().toString()`, que e o que o
 * original usa. Ver a divergencia registrada em `data.ts`: dois cliques no mesmo
 * milissegundo dariam o mesmo id, e as duas linhas da lista teriam a mesma `key`.
 */
export function newReward(id: string): LoyaltyReward {
  return { id, label: '', points: 0, discountValue: 0 };
}

/* ------------------------------------------------------------------ niveis */

/** Nivel -> rascunho. Os beneficios saem como o JSON do print. */
export function tierToDraft(tier: LoyaltyTier): TierDraft {
  return {
    id: tier.id,
    name: tier.name,
    color: tier.color,
    minPoints: toFieldEmptyOnZero(tier.minPoints),
    multiplier: toFieldEmptyOnZero(tier.multiplier),
    benefitsText: benefitsToText(tier.benefits),
  };
}

/**
 * TEXTO -> LISTA DE BENEFICIOS, acusando o erro em vez de descarta-lo.
 *
 * Devolve `{ ok: true, benefits }` ou `{ ok: false, error }`. O caso do TEXTO
 * VAZIO e tratado como lista vazia, e nao como erro: esvaziar o campo e uma forma
 * legitima de dizer "este nivel nao tem beneficios".
 *
 * O que a checagem RECUSA, e que o original descartava em silencio: JSON
 * malformado e JSON valido que nao e uma lista de textos (um numero solto, um
 * objeto). Os dois gravariam um dado que a leitura (`plainText`) nao saberia
 * mostrar.
 */
export function parseBenefits(
  text: string,
): { ok: true; benefits: string[] } | { ok: false; error: string } {
  const bruto = text.trim();
  if (bruto === '') return { ok: true, benefits: [] };

  let valor: unknown;
  try {
    valor = JSON.parse(bruto);
  } catch {
    return {
      ok: false,
      error: 'JSON inválido. Use uma lista de textos, ex.: ["Frete grátis"].',
    };
  }

  if (!Array.isArray(valor) || valor.some((item) => typeof item !== 'string')) {
    return {
      ok: false,
      error: 'Precisa ser uma lista de textos, ex.: ["Frete grátis", "Brinde"].',
    };
  }

  return { ok: true, benefits: valor as string[] };
}

/**
 * Rascunho -> nivel. `parseBenefits` ja rodou antes: o que chega aqui e uma lista
 * valida, e o `plainText` e so a rede de seguranca.
 */
export function draftToTier(draft: TierDraft, benefits: string[] | null | undefined): LoyaltyTier {
  return {
    id: draft.id,
    name: draft.name,
    color: draft.color,
    minPoints: toNumber(draft.minPoints),
    multiplier: toNumber(draft.multiplier),
    benefits: plainText(benefits),
  };
}

/** Os niveis em rascunho, prontos para a tela. */
export function tiersToDrafts(rows: LoyaltyTier[]): TierDraft[] {
  return rows.map(tierToDraft);
}

/**
 * VALIDA OS BENEFICIOS DE TODOS OS NIVEIS de uma vez.
 *
 * A tela edita VÁRIOS cartoes ao mesmo tempo e tem UM botao de salvar no fim. Se
 * um unico cartao estiver com o JSON torto, salvar tudo gravaria os outros e
 * perderia esse — em silencio. Por isso o erro e mapeado por id e o salvamento
 * para enquanto houver qualquer um.
 */
export function validateTierDrafts(drafts: TierDraft[]): {
  errors: Record<string, string>;
  parsed: Record<string, string[]>;
} {
  const errors: Record<string, string> = {};
  const parsed: Record<string, string[]> = {};
  for (const draft of drafts) {
    const resultado = parseBenefits(draft.benefitsText);
    if (resultado.ok) parsed[draft.id] = resultado.benefits;
    else errors[draft.id] = resultado.error;
  }
  return { errors, parsed };
}

/* ----------------------------------------------------------- movimentacoes */

/**
 * Traduz o `type` CRU do banco para o tipo do dominio.
 *
 * A coluna `type` e texto livre no Postgres, sem CHECK documentado. A leitura do
 * original ja decidia com `=== 'earn'`, entao a normalizacao aqui faz a mesma
 * escolha — mas de forma EXPLICITA, para que o tipo deixe de ser `string` no
 * resto do codigo. Ver `movementTypeLabel` para a consequencia de um valor
 * inesperado.
 */
export function toMovementType(value: string): LoyaltyMovement['type'] {
  return value === 'earn' ? 'earn' : 'redeem';
}

/** Uma linha do extrato, vinda do banco. */
export function toMovement(row: {
  id: string;
  customer_email: string;
  created_at: string;
  description: string | null;
  type: string;
  points: number;
}): LoyaltyMovement {
  return {
    id: row.id,
    customerEmail: row.customer_email,
    createdAt: row.created_at,
    description: row.description ?? '',
    type: toMovementType(row.type),
    points: Number(row.points) || 0,
  };
}

/** Id local, estavel dentro da sessao. Nao e id de banco. */
export function localId(prefix = 'rw'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
