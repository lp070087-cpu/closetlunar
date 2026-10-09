/**
 * Regras do formulario de campanha.
 *
 * Modulo PURO (sem React), pelo mesmo motivo de Produtos, Categorias e Cupons:
 * validacao dentro de JSX nao se testa.
 *
 * A VALIDACAO DO ORIGINAL TEM UMA REGRA, E SO UMA:
 *
 *     if (!draft.name) return toast.error("Nome é obrigatório");
 *
 * Exatamente isso: nome vazio para o salvamento. O aviso vai para um `toast` no
 * original; aqui ele fica no CAMPO, que e onde a pessoa esta olhando.
 *
 * O QUE NAO E VALIDADO, e por que nao foi inventado:
 *
 *   `VALOR DO DESCONTO` — o original inicializa `discount_value: 0` e nao checa
 *   nada. Uma campanha de desconto com valor zero e salvavel na referencia. Nao
 *   foi criada uma obrigatoriedade que ela nao tem.
 *
 *   `DATA EXPIRAÇÃO` antes de `DATA INÍCIO` — mesmo caso registrado em Cupons: o
 *   original nao compara as duas datas. Uma campanha que nunca vale e erro de
 *   quem digitou, e a loja simplesmente nao a aplica. Nao foi inventada a regra.
 *
 * O TIPO DE VALOR NAO MANDA NO NOME DO CAMPO DE VALOR: o rotulo e sempre `VALOR
 * DO DESCONTO` nos dois prints, ao contrario de Cupons, onde o rotulo MUDA entre
 * `Percentual (%)` e `Valor (R$)`. Ver `campaign-form.tsx`.
 */

import type { Campaign, CampaignDraft, CampaignFieldErrors } from './types';

/**
 * O RASCUNHO EM BRANCO — e os TRES valores que ja vem preenchidos.
 *
 * Os prints de adm-016 e adm-017 mostram o formulario recem-aberto:
 *
 *   NOME DA CAMPANHA ..... vazio, com `placeholder` `Ex: Black Friday 2026`
 *   TIPO DE PROMOÇÃO ..... `Desconto Automático`  (primeiro item do seletor)
 *   VALOR DO DESCONTO .... vazio
 *   TIPO DE VALOR ........ `Porcentagem (%)`      (primeiro item do seletor)
 *   PEDIDO MÍNIMO (R$) ... vazio
 *   TEXTO DO SELO ........ vazio, com `placeholder` `Ex: 20% OFF`
 *   DATA INÍCIO .......... A DATA DO DIA
 *   DATA EXPIRAÇÃO ....... vazio, mostrando `dd/mm/aaaa`
 *
 * A DATA DE INICIO E O UNICO CAMPO QUE ABRE PREENCHIDO COM UM VALOR CALCULADO, e
 * isso e do original: o `Nova Campanha` do botao faz
 * `setDraft({ name: "", type: "discount_automatic", is_active: true, starts_at:
 * new Date().toISOString() })`. O print mostra `28/09/2026`, que era o dia da
 * captura.
 *
 * `today` entra por parametro para a bancada poder congelar o relogio — um
 * `new Date()` escondido aqui dentro tornaria o teste dependente do dia em que
 * ele roda.
 */
export function emptyDraft(today: string): CampaignDraft {
  return {
    name: '',
    type: 'discount_automatic',
    discountValue: '',
    discountType: 'percentage',
    minOrderValue: '',
    badgeText: '',
    startsAt: today,
    expiresAt: '',
    isActive: true,
    description: '',
    bannerUrl: '',
    bannerUrlMobile: '',
    targetIds: [],
    rules: {},
  };
}

/**
 * Rascunho a partir de uma campanha existente (modo edicao).
 *
 * AS DATAS VOLTAM PARA `aaaa-mm-dd`, e o `slice(0, 10)` do ISO basta — NAO
 * `toLocaleDateString`, que devolveria `dd/mm/aaaa` e o `<input type="date">`
 * descartaria em silencio, deixando o campo vazio na edicao sem erro nenhum.
 * Mesmo par de funcoes de Cupons (`lib/cupons/form.ts`), e a bancada prova as
 * duas pelo mesmo motivo: o defeito e invisivel a olho nu.
 *
 * `discountValue` e `minOrderValue` saem como STRING pelo motivo de sempre: o
 * campo precisa poder ficar vazio.
 */
export function draftFromCampaign(campaign: Campaign): CampaignDraft {
  return {
    name: campaign.name,
    type: campaign.type,
    discountValue: campaign.discountValue === 0 ? '' : String(Number(campaign.discountValue)),
    discountType: campaign.discountType,
    // Zero significa "sem pedido minimo" — o campo fica VAZIO, e nao com `0`,
    // que e o que o print mostra em `PEDIDO MÍNIMO`.
    minOrderValue: campaign.minOrderValue === 0 ? '' : String(Number(campaign.minOrderValue)),
    badgeText: campaign.badgeText,
    startsAt: toDateInput(campaign.startsAt),
    expiresAt: toDateInput(campaign.expiresAt),
    isActive: campaign.isActive,
    description: campaign.description,
    bannerUrl: campaign.bannerUrl,
    bannerUrlMobile: campaign.bannerUrlMobile,
    targetIds: [...campaign.targetIds],
    rules: { ...campaign.rules },
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
 * O `T00:00:00` sem `Z` e obrigatorio e nao decorativo: `new Date('2026-09-28')`
 * sozinho e lido como UTC, e num fuso a oeste (o Brasil e UTC-3) isso vira
 * `27/09` as 21h — a data que a pessoa digitou apareceria um dia antes na tabela.
 * A bancada prova as partes LOCAIS da data; comparar o ISO daria verde nos dois
 * casos.
 */
export function fromDateInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * A UNICA REGRA, com a mensagem do original.
 *
 * A checagem e `draft.name.trim()` e nao `!draft.name`: o original usa
 * `if (!draft.name)`, entao um nome de um espaco `" "` PASSA na referencia e
 * gravaria uma campanha sem nome visivel. Aqui um nome so de espacos e recusado —
 * e a menor correcao possivel do defeito, com o mesmo texto de mensagem.
 * O que a bancada trava e a mensagem, que e a do original.
 */
export function validateDraft(draft: CampaignDraft): CampaignFieldErrors {
  const errors: CampaignFieldErrors = {};

  if (!draft.name.trim()) {
    errors.name = 'Nome é obrigatório';
  }

  return errors;
}

export function hasErrors(errors: CampaignFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Rascunho -> campanha. Sem efeito colateral; id e `createdAt` vem de fora.
 *
 * OS CAMPOS FORA DO FORMULARIO SAO PRESERVADOS (`description`, `bannerUrl`,
 * `bannerUrlMobile`, `targetIds`, `rules`). Eles existem no contrato e nenhum
 * campo desta tela os edita — zera-los ao salvar apagaria o que a tela `Banners`
 * ou uma promocao por categoria tivesse gravado, sem ninguem pedir.
 *
 * `discountValue` e `minOrderValue` vazios viram `0`, que e o que o campo vazio
 * SIGNIFICA aqui: sem desconto e sem pedido minimo. O `Number('')` ja da `0`, e a
 * guarda `Number.isFinite` e para o caso de texto que nao e numero.
 */
export function draftToCampaign(
  draft: CampaignDraft,
  base: Pick<Campaign, 'id' | 'createdAt' | 'description' | 'bannerUrl' | 'bannerUrlMobile' | 'targetIds' | 'rules'>,
): Campaign {
  const discountValue = Number(draft.discountValue);
  const minOrderValue = Number(draft.minOrderValue);
  return {
    id: base.id,
    name: draft.name.trim(),
    description: base.description,
    type: draft.type,
    discountType: draft.discountType,
    discountValue: Number.isFinite(discountValue) ? discountValue : 0,
    minOrderValue: Number.isFinite(minOrderValue) && minOrderValue > 0 ? minOrderValue : 0,
    badgeText: draft.badgeText.trim(),
    startsAt: fromDateInput(draft.startsAt) ?? new Date().toISOString(),
    expiresAt: fromDateInput(draft.expiresAt),
    isActive: draft.isActive,
    bannerUrl: base.bannerUrl,
    bannerUrlMobile: base.bannerUrlMobile,
    targetIds: [...base.targetIds],
    rules: { ...base.rules },
    createdAt: base.createdAt,
  };
}

/** Id local, estavel dentro da sessao. Nao e id de banco. */
export function localId(prefix = 'cam'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
