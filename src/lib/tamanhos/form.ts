/**
 * Formulario de Tamanhos — modulo PURO, igual ao `form.ts` dos outros modulos.
 *
 * Aqui so mora o RASCUNHO DAS REGRAS POR PRODUTO. A Tabela de Medidas nao tem
 * rascunho: ela grava direto na celula ao sair do campo, como o print promete
 * no rodape ("alteracoes sao salvas automaticamente ao sair do campo"). Criar
 * um rascunho para ela seria contrariar o unico comportamento que o print
 * descreve por escrito.
 */

import type { Elasticity, Modeling, ProductSizeRule } from './types';

/** Rascunho de uma linha de regra — o que o usuario esta editando agora. */
export interface RuleDraft {
  modeling: Modeling;
  elasticity: Elasticity;
  notes: string;
}

export type RuleFieldErrors = Partial<Record<keyof RuleDraft, string>>;

/** Rascunho a partir da regra salva (ou do padrao, se ainda nao houver). */
export function draftFromRule(rule: ProductSizeRule): RuleDraft {
  return {
    modeling: rule.modeling,
    elasticity: rule.elasticity,
    notes: rule.notes,
  };
}

/** Rascunho de volta para a regra, carimbando a data da gravacao. */
export function draftToRule(
  draft: RuleDraft,
  productId: string,
  savedAt: string,
): ProductSizeRule {
  return {
    productId,
    modeling: draft.modeling,
    elasticity: draft.elasticity,
    notes: draft.notes.trim(),
    updatedAt: savedAt,
  };
}

/**
 * O rascunho mudou em relacao ao que esta salvo?
 *
 * O botao `SALVAR` do print fica em cada linha, sempre visivel. Ele nao diz se
 * ha mudanca pendente. Esta funcao e o que permite marcar a linha como "suja"
 * sem transformar o botao num semaforo que o print nao tem — quem decide o que
 * fazer com a informacao e a tela.
 */
export function isRuleDirty(draft: RuleDraft, saved: ProductSizeRule): boolean {
  return (
    draft.modeling !== saved.modeling ||
    draft.elasticity !== saved.elasticity ||
    draft.notes.trim() !== saved.notes.trim()
  );
}

/**
 * Validacao das regras.
 *
 * Deliberadamente magra: os dois seletores so aceitam valores de uma lista
 * fechada, entao nao ha o que validar neles. A observacao e texto livre e o
 * print aceita qualquer coisa — inclusive vazio. O unico limite real e o
 * tamanho, para o campo nao virar um deposito de texto que estoura a linha.
 */
export const NOTES_MAX_LENGTH = 120;

export function validateRule(draft: RuleDraft): RuleFieldErrors {
  const errors: RuleFieldErrors = {};
  if (draft.notes.trim().length > NOTES_MAX_LENGTH) {
    errors.notes = `Use no máximo ${NOTES_MAX_LENGTH} caracteres.`;
  }
  return errors;
}

export function hasRuleErrors(errors: RuleFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/**
 * Cria id local para registros que ainda nao existem no banco.
 *
 * Mesmo padrao dos outros modulos: enquanto o Neon nao entra, o id nasce aqui.
 * Quando entrar, quem manda o id e o banco e estas linhas saem.
 */
let counter = 0;
export function localId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
