/**
 * Regras do formulario de cupom.
 *
 * Modulo PURO (sem React), pelo mesmo motivo de Produtos e Categorias:
 * validacao dentro de JSX nao se testa.
 *
 * AS TRES REGRAS DE VALIDACAO SAO AS DO ORIGINAL, literalmente — `save()` em
 * `CouponsAdmin`, que acusa e para antes de gravar:
 *
 *   1. `Informe o codigo do cupom.` ............ codigo vazio
 *   2. `Valor do cupom deve ser maior que zero.`  `!(value > 0)`
 *   3. `Percentual maximo e 100%.` ............. percentual acima de 100
 *
 * E O QUE O ORIGINAL **NAO** VALIDA, e por que:
 *
 *   ELAS SAO AS UNICAS. Nome da campanha pode ficar vazio (e opcional: o
 *   rotulo diz `(INTERNO)`), a `Validade` pode ser vazia (`(OPCIONAL)`), o
 *   `Subtotal minimo` pode ser zero, o `Uso por cliente` nao tem checagem
 *   nenhuma. Inventar obrigatoriedade aqui faria a tela recusar um cupom que a
 *   referencia aceita — e o print de adm-013 tem o formulario INTEIRO preenchido
 *   com valores padrao, ou seja, ele abre saloavel.
 *
 *   A DATA DE VALIDADE ANTERIOR AO INICIO nao e checada pelo original. Fica
 *   registrado como divergencia conhecida (ver `data.ts`), e NAO como regra
 *   inventada: um cupom que nunca vale e um erro de quem digitou, e a loja
 *   simplesmente nao o aplica.
 */

import { codeTaken } from './metrics';
import type { Coupon, CouponDraft, CouponFieldErrors } from './types';

/** Id local, estavel dentro da sessao. Nao e id de banco. */
export function localId(prefix = 'cup'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * O RASCUNHO EM BRANCO — e os tres valores que vem preenchidos.
 *
 * O print de adm-013 (o formulario aberto) nao esta em branco:
 *
 *   TIPO ................ `Percentual (%)`   (o primeiro item do seletor)
 *   PERCENTUAL (%) ...... `10`
 *   SUBTOTAL MINIMO ..... `0`
 *   USO POR CLIENTE ..... `1`
 *   APLICAR EM .......... `Todo o site`
 *   STATUS .............. `Ativo` (marcado)
 *
 * Os cinco primeiros sao os padroes do original (`EMPTY_COUPON`), e o `Ativo`
 * tambem. Os outros — codigo, nome, quantidade maxima, inicio e validade —
 * abrem VAZIOS no print, e os rotulos explicam por que: os dois de data dizem
 * `(OPCIONAL)` e o de quantidade diz `(em branco = ilimitado)`.
 *
 * `CÓDIGO` e `NOME DA CAMPANHA (INTERNO)` abrem vazios porque o print mostra o
 * `placeholder` `Ex: Cupom Clientes VIP` no segundo e nada no primeiro.
 */
export function emptyDraft(): CouponDraft {
  return {
    code: '',
    name: '',
    kind: 'percent',
    value: '10',
    minSubtotal: '0',
    maxUses: '',
    startsAt: '',
    expiresAt: '',
    isActive: true,
    usageLimitPerUser: '1',
    applyTo: 'all',
    applicableIds: [],
    description: '',
    campaignId: null,
  };
}

/**
 * Rascunho a partir de um cupom existente (modo edicao).
 *
 * AS DATAS VOLTAM PARA `aaaa-mm-dd`, que e o que o `<input type="date">` aceita.
 * O original faz isso com `toDateInput`, e o `slice(0, 10)` do ISO basta — e
 * NAO `toLocaleDateString`, que devolveria `dd/mm/aaaa` e o input descartaria
 * em silencio, deixando o campo vazio na edicao.
 */
export function draftFromCoupon(coupon: Coupon): CouponDraft {
  return {
    code: coupon.code,
    name: coupon.name,
    kind: coupon.kind,
    value: String(Number(coupon.value)),
    minSubtotal: String(Number(coupon.minSubtotal)),
    maxUses: coupon.maxUses === null ? '' : String(Number(coupon.maxUses)),
    startsAt: toDateInput(coupon.startsAt),
    expiresAt: toDateInput(coupon.expiresAt),
    isActive: coupon.isActive,
    usageLimitPerUser: String(Number(coupon.usageLimitPerUser)),
    applyTo: coupon.applyTo,
    applicableIds: [...coupon.applicableIds],
    description: coupon.description,
    campaignId: coupon.campaignId,
  };
}

/** ISO -> `aaaa-mm-dd`. Vazio quando nao ha data ou ela e invalida. */
export function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/**
 * `aaaa-mm-dd` -> ISO, no INICIO DO DIA LOCAL.
 *
 * O `T00:00:00` sem `Z` e obrigatorio: `new Date('2026-08-20')` sozinho e
 * interpretado como UTC, e num fuso a oeste (o Brasil e UTC-3) isso vira
 * 19/08 as 21h — a data que o usuario digitou ficaria um dia antes do que ele
 * viu no campo. Com a hora local explicita, `20/08` no campo e `20/08` na
 * tabela.
 *
 * Guardar a validade no inicio do dia e o que a torna INCLUSIVA: um cupom que
 * vence em 20/08 vale durante o dia 20 inteiro, e nao ate a meia-noite de 19.
 * O `isRedeemableNow` faz `time > end` (e nao `>=`), entao o instante exato
 * ainda vale.
 */
export function fromDateInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * O CODIGO SEMPRE EM MAIUSCULA, sem espaco nas pontas.
 *
 * Aplicado a cada tecla (`applyCode`), e nao so ao salvar, para o campo mostrar
 * o texto que vai ser gravado. O original faz as duas coisas: o `onChange` do
 * input faz `.toUpperCase()` e o `save()` faz `.trim().toUpperCase()` de novo.
 * Sem o `toUpperCase` no `onChange`, a pessoa digita `volta10` e o cupom some
 * porque a loja procura por `VOLTA10`.
 *
 * O `trim` so acontece ao salvar: cortar espaco a cada tecla impediria de
 * digitar `CLOSET 10` com espaco no meio.
 */
export function applyCode(draft: CouponDraft, code: string): CouponDraft {
  return { ...draft, code: code.toUpperCase() };
}

/**
 * Validacao.
 *
 * Devolve os erros por campo. As tres mensagens sao as do original, palavra por
 * palavra, para o painel nao ter duas redacoes para a mesma regra.
 */
export function validateDraft(
  draft: CouponDraft,
  rows: Coupon[],
  editingId?: string,
): CouponFieldErrors {
  const errors: CouponFieldErrors = {};

  const code = draft.code.trim().toUpperCase();
  if (!code) {
    errors.code = 'Informe o código do cupom.';
  } else if (codeTaken(rows, code, editingId)) {
    // Nao esta no original (ele deixa o banco recusar e traduz o erro), mas
    // aqui a mensagem chega no CAMPO, e nao num aviso no canto da tela.
    errors.code = 'Já existe um cupom com este código.';
  }

  const value = Number(draft.value);
  if (!Number.isFinite(value) || !(value > 0)) {
    errors.value = 'Valor do cupom deve ser maior que zero.';
  } else if (draft.kind === 'percent' && value > 100) {
    errors.value = 'Percentual máximo é 100%.';
  }

  // O teto de uso e opcional (`em branco = ilimitado`), mas se preenchido
  // precisa ser um numero inteiro nao negativo — `-3` nao e um teto.
  if (draft.maxUses.trim()) {
    const maxUses = Number(draft.maxUses);
    if (!Number.isFinite(maxUses) || maxUses < 0 || !Number.isInteger(maxUses)) {
      errors.maxUses = 'Informe um número inteiro de usos, ou deixe em branco para ilimitado.';
    }
  }

  return errors;
}

export function hasErrors(errors: CouponFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Rascunho -> cupom. Sem efeito colateral; id e `createdAt` vem de fora.
 *
 * `usesCount` e `description` sao PRESERVADOS, e nao zerados. O `usesCount`
 * porque o formulario nao o edita — zera-lo ao salvar apagaria o historico de
 * usos so porque alguem corrigiu o nome da campanha. A `description` porque o
 * formulario tambem nao a edita, e o dado existe no banco do original.
 */
export function draftToCoupon(
  draft: CouponDraft,
  base: Pick<Coupon, 'id' | 'createdAt' | 'usesCount' | 'description'>,
): Coupon {
  const value = Number(draft.value);
  const minSubtotal = Number(draft.minSubtotal);
  const maxUses = draft.maxUses.trim() ? Number(draft.maxUses) : null;
  const perUser = Number(draft.usageLimitPerUser);
  return {
    id: base.id,
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    kind: draft.kind,
    value: Number.isFinite(value) ? value : 0,
    // Campo vazio vira 0 = sem pedido minimo, que e o mesmo que o print mostra.
    minSubtotal: Number.isFinite(minSubtotal) && minSubtotal > 0 ? minSubtotal : 0,
    maxUses: maxUses !== null && Number.isFinite(maxUses) ? maxUses : null,
    startsAt: fromDateInput(draft.startsAt),
    expiresAt: fromDateInput(draft.expiresAt),
    isActive: draft.isActive,
    campaignId: draft.campaignId,
    // `1` e o piso: zero significaria um cupom que ninguem pode usar, e o campo
    // abre com 1 no print. Vazio cai no mesmo piso.
    usageLimitPerUser: Number.isFinite(perUser) && perUser >= 1 ? Math.floor(perUser) : 1,
    applyTo: draft.applyTo,
    applicableIds: [...draft.applicableIds],
    description: base.description,
    usesCount: base.usesCount,
    createdAt: base.createdAt,
  };
}
