/**
 * Regras do formulario de Afiliada.
 *
 * Modulo PURO (sem React), pelo mesmo motivo de Cupons e Fidelidade: validacao
 * dentro de JSX nao se testa.
 *
 * ================== O ORIGINAL NAO VALIDA NADA, E ISSO E FIEL ==================
 *
 * O `save()` do `AffiliateForm` original e literalmente:
 *
 *     async function save() {
 *       setSaving(true);
 *       const { error } = await supabase.from("affiliate_profiles").upsert(val);
 *       setSaving(false);
 *       if (error) toast.error(error.message);
 *       else { toast.success("Afiliada salva"); onClose(); }
 *     }
 *
 * NAO HA UMA CHECAGEM SEQUER. Nome vazio, e-mail vazio e cupom vazio passam
 * todos: quem recusa e o BANCO (as colunas `name`, `email` e `coupon_code` do
 * `Insert` sao NOT NULL, e o erro volta pelo `toast`). Ou seja, a unica validacao
 * visivel do original e a mensagem de erro crua do Postgres, no canto da tela.
 *
 * INVENTAR OBRIGATORIEDADE AQUI FARIA A TELA RECUSAR UMA AFILIADA QUE A
 * REFERENCIA ACEITA — exatamente o defeito que o comentario de `cupons/form.ts`
 * descreve. Entao este modulo NAO acrescenta "informe o nome" nem "informe o
 * e-mail". O que ele acrescenta sao as DUAS checagens de duplicidade abaixo,
 * declaradas como divergencia — a mesma classe que `codeTaken` em Cupons tem, e
 * pelo mesmo motivo.
 *
 * ================== AS DUAS TRANSFORMACOES DO ORIGINAL ==================
 *
 * Elas SAO do original, e ficam no `onChange` (a cada tecla) e nao so no
 * salvamento, para o campo mostrar o texto que vai ser gravado:
 *
 *   CUPOM — `.toUpperCase()`. A pessoa digita `luna10` e o campo vira `LUNA10`.
 *   Sem isso o cupom fica em minusculo e a coluna mostra `luna10`, que e o
 *   oposto do print (`CARINNAS`).
 *
 *   SLUG — `.toLowerCase().replace(/ /g, '-')`. A pessoa digita `Luna 10` e o
 *   campo vira `luna-10`. O `replace` cobre o ESPACO e mais nada: acento e
 *   pontuacao passam, e isso e do original — `luna-ção` e um slug que ele
 *   gravaria. Nao "consertar" com `slugify()` mudaria o comportamento visivel
 *   do campo.
 *
 * ================== DIVERGENCIA REGISTRADA: AS DUPLICIDADES ==================
 *
 * O original nao checa cupom nem e-mail repetido: ele deixa o banco recusar e
 * traduz o erro num `toast`. Aqui a checagem existe (`couponCodeTaken`,
 * `emailTaken` em `metrics.ts`) e a mensagem chega NO CAMPO, e nao no canto da
 * tela. E a mesma divergencia registrada em Cupons, e a mesma justificativa: a
 * coluna `coupon_code` precisa de indice unico, e acusar antes de ir ao servidor
 * da a mensagem no lugar certo.
 *
 * O E-MAIL SO ACUSA CONFLITO SE ESTIVER PREENCHIDO — ver `emailTaken`: ao
 * contrario do cupom, a tela permite salvar sem e-mail, e dois vazios nao sao
 * duplicata um do outro.
 */

import { couponCodeTaken, emailTaken } from './metrics';
import type { Affiliate, AffiliateDraft, AffiliateStatus } from './types';

/** Id local, estavel dentro da sessao. Nao e id de banco. */
export function localId(prefix = 'aff'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * O RASCUNHO EM BRANCO — e os dois valores que vem preenchidos.
 *
 * O print de adm-022 (o formulario aberto) esta no modo NOVO e mostra:
 *
 *   NOME ................ VAZIO   (`placeholder` `Nome`)
 *   E-MAIL .............. VAZIO   (`placeholder` `E-mail`)
 *   CUPOM ............... VAZIO   (`placeholder` `Cupom (ex: LUNA10)`)
 *   SLUG ................ VAZIO   (`placeholder` `Slug (ex: luna10)`)
 *   TIPO ................ `Percentual (%)`  (o primeiro item do seletor)
 *   VALOR ............... `10`
 *
 * Os QUATRO vazios sao o `placeholder` do campo e nao um texto digitado, e o
 * `10` e o padrao do original. Os dois valores vem do `setEditing` do original:
 * `{ name: '', email: '', coupon_code: '', referral_slug: '',
 * commission_type: 'percentage', commission_value: 10 }`.
 *
 * O `id: ''` e o que distingue NOVA de EDICAO — o titulo do modal decide
 * `val.id ? "Editar" : "Nova" Afiliada`. Ver `types.ts`.
 */
export function emptyDraft(): AffiliateDraft {
  return {
    id: '',
    name: '',
    email: '',
    couponCode: '',
    referralSlug: '',
    commissionType: 'percentage',
    commissionValue: '10',
  };
}

/**
 * Rascunho a partir de uma afiliada existente (modo edicao).
 *
 * O `commissionValue` vira STRING. O original guarda numero e o `<input
 * type="number">` reescreve `0` quando o campo e apagado (`Number('') === 0`);
 * com o rascunho em string, apagar o campo o deixa VAZIO, que e o que qualquer
 * pessoa espera ao redigitar. A conversao de volta acontece uma vez, em
 * `draftToAffiliate`.
 *
 * O `String(Number(...))` normaliza o `"5.00"` que o driver pode devolver para
 * `"5"`, para o campo abrir com o numero que a pessoa digitou.
 */
export function draftFromAffiliate(affiliate: Affiliate): AffiliateDraft {
  return {
    id: affiliate.id,
    name: affiliate.name,
    email: affiliate.email,
    couponCode: affiliate.couponCode,
    referralSlug: affiliate.referralSlug,
    commissionType: affiliate.commissionType,
    commissionValue: String(Number(affiliate.commissionValue)),
  };
}

/**
 * O CUPOM SEMPRE EM MAIUSCULA, sem espaco nas pontas.
 *
 * Aplicado a cada tecla, como o `onChange` do original. O `trim` so acontece ao
 * salvar (ver `draftToAffiliate`): cortar espaco a cada tecla impediria de
 * digitar um cupom com espaco no meio.
 */
export function applyCouponCode(draft: AffiliateDraft, code: string): AffiliateDraft {
  return { ...draft, couponCode: code.toUpperCase() };
}

/**
 * O SLUG EM MINUSCULA, com ESPACO virando hifen.
 *
 * As duas operacoes na mesma passada, como no original
 * (`.toLowerCase().replace(/ /g, '-')`). O `replace` sem `g` trocaria so o
 * primeiro espaco — `Luna 10 Pro` viraria `luna-10 pro`, e o segundo espaco
 * sobreviveria dentro do slug. O `/g` e o que faz a regra valer para o texto
 * inteiro.
 */
export function applyReferralSlug(draft: AffiliateDraft, slug: string): AffiliateDraft {
  return { ...draft, referralSlug: slug.toLowerCase().replace(/ /g, '-') };
}

/** Erros por campo, no formato que o `Field` do design system ja usa. */
export type AffiliateFieldErrors = Partial<Record<keyof AffiliateDraft, string>>;

/**
 * Validacao.
 *
 * DUAS REGRAS, e nao mais — ver o cabecalho: o original nao valida nada, e
 * inventar obrigatoriedade faria a tela recusar o que a referencia aceita.
 */
export function validateDraft(
  draft: AffiliateDraft,
  rows: Affiliate[],
  editingId?: string,
): AffiliateFieldErrors {
  const errors: AffiliateFieldErrors = {};

  const code = draft.couponCode.trim().toUpperCase();
  if (code && couponCodeTaken(rows, code, editingId)) {
    errors.couponCode = 'Já existe uma afiliada com este cupom.';
  }

  const email = draft.email.trim();
  if (email && emailTaken(rows, email, editingId)) {
    errors.email = 'Já existe uma afiliada com este e-mail.';
  }

  return errors;
}

export function hasErrors(errors: AffiliateFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Rascunho -> afiliada. Sem efeito colateral; o que o formulario nao edita vem
 * de fora em `base`.
 *
 * OS QUATRO CAMPOS PRESERVADOS, e por que cada um:
 *
 *   `status` — o formulario NAO o edita. Quem muda o status e o botao
 *   `Suspender`/`Ativar` da LINHA. Zerar para `active` ao salvar faria editar o
 *   nome de uma afiliada suspensa a REATIVAR — um efeito colateral que ninguem
 *   pediu e que o print nao mostra.
 *
 *   `bankInfo` — `jsonb` livre, nem exibido nem editado. E a razao de o tipo
 *   existir: o `upsert` grava o objeto inteiro, e omitir a coluna a apagaria.
 *
 *   `userId` / `createdAt` — idem: existem no `Row`, o formulario nao os toca, e
 *   o `upsert` os gravaria como nulos se ficassem de fora.
 *
 * O `commissionValue` NAO cai mais em zero por acidente: campo vazio vira `0`
 * de forma explicita, e nao `Number('')`. `Number('')` tambem e `0`, mas o
 * caminho ate ele passa por `Number.isFinite` — um texto nao numerico no campo
 * (`abc`, que o `type="number"` deixa passar em alguns navegadores) vira `0` em
 * vez de `NaN`, e `NaN` no banco e um registro quebrado.
 */
export function draftToAffiliate(
  draft: AffiliateDraft,
  base: Pick<Affiliate, 'id' | 'status' | 'bankInfo' | 'userId' | 'createdAt' | 'updatedAt'>,
): Affiliate {
  const value = Number(draft.commissionValue);
  return {
    id: base.id,
    name: draft.name.trim(),
    email: draft.email.trim(),
    couponCode: draft.couponCode.trim().toUpperCase(),
    // O slug fica COMO ESTA no campo, so com as pontas aparadas: aplicar
    // `toLowerCase` de novo aqui mascararia um `applyReferralSlug` que nao
    // tivesse rodado, e a bancada nao conseguiria apontar o defeito.
    referralSlug: draft.referralSlug.trim(),
    commissionType: draft.commissionType,
    commissionValue: Number.isFinite(value) ? value : 0,
    status: base.status as AffiliateStatus,
    bankInfo: base.bankInfo,
    userId: base.userId,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
  };
}
