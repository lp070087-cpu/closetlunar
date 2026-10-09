/**
 * Tipos de Afiliadas.
 *
 * OS NOMES ESPELHAM AS COLUNAS `affiliate_profiles` do original, e nao um modelo
 * desenhado aqui. A tabela tem dez colunas e a tela mostra cinco delas — as outras
 * cinco (`bank_info`, `user_id`, `created_at`, `updated_at`, e o `id`) existem no
 * `Row` do schema e ficam no tipo porque o `upsert` do original grava o OBJETO
 * INTEIRO: quando o Neon entrar, uma coluna que nao estivesse no tipo seria
 * apagada em silencio no primeiro salvamento.
 */

/**
 * Como a comissao e calculada.
 *
 * `percentage` = percentual sobre a venda; `fixed` = valor em reais por venda.
 * E o `commission_type` do schema, e e `string` la — sem CHECK documentado. Ver
 * `toCommissionType` para o que acontece com um valor inesperado.
 */
export type CommissionType = 'percentage' | 'fixed';

/**
 * O status da afiliada.
 *
 * O PRINT MOSTRA `ACTIVE` em caixa alta verde, e o selo de suspensa e o mesmo com
 * `suspended` — o original imprime `{af.status}` CRU, sem traduzir. Ver
 * `affiliateStatusLabel`.
 */
export type AffiliateStatus = 'active' | 'suspended';

/**
 * Uma afiliada — uma linha de `affiliate_profiles`.
 *
 * `bankInfo` fica como `unknown` e nao como um objeto tipado: a coluna e `jsonb`
 * livre, nenhum print mostra o conteudo, e desenhar os campos do dado bancario
 * seria inventar um formulario que a referencia nao tem. Ele e PRESERVADO (o
 * `upsert` grava o objeto inteiro), e nao editado.
 */
export interface Affiliate {
  id: string;
  name: string;
  email: string;
  /** O cupom que a afiliada divulga. O print mostra `CARINNAS`. */
  couponCode: string;
  /** O trecho da URL de indicacao. O print mostra `/` — vazio. */
  referralSlug: string;
  commissionType: CommissionType;
  /** Percentual (5) ou reais — depende do `commissionType`. Ver `formatCommission`. */
  commissionValue: number;
  status: AffiliateStatus;
  /** `jsonb` livre, nem exibido nem editado. Preservado no salvamento. */
  bankInfo: unknown;
  /** Nulo enquanto a afiliada nao tiver conta de usuario ligada. */
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Um rascunho de afiliada em edicao.
 *
 * O NUMERO E TEXTO ENQUANTO SE DIGITA, como em Fidelidade e Cupons: o campo
 * `Percentual (%)` e o valor da comissao. Se ele guardasse numero, apagar o campo
 * para digitar outro valor escreveria um `0` que ninguem digitou — e uma comissao
 * de `0%` nao e um campo vazio, e a afiliada trabalhando de graca. Ver `toNumber`.
 *
 * O `id` vazio e o que distingue NOVA de EDICAO: o original decide o titulo do
 * modal com `val.id ? "Editar" : "Nova"`, e o `upsert` insere quando o id e nulo.
 */
export interface AffiliateDraft {
  id: string;
  name: string;
  email: string;
  couponCode: string;
  referralSlug: string;
  commissionType: CommissionType;
  commissionValue: string;
}

/**
 * O resultado do modal, depois de salvar.
 *
 * O `id` e o unico campo que o chamador precisa para saber se foi INSERCAO ou
 * EDICAO, e por isso ele volta separado do rascunho.
 */
export interface AffiliateSaveResult {
  affiliate: Affiliate;
  wasNew: boolean;
}
