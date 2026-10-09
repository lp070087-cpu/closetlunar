/**
 * Tipos de Campanhas.
 *
 * ESTE MODULO E O DONO DA ENTIDADE `campaign`. O modulo Cupons ja a referencia
 * por id (`Coupon.campaignId`), e a relacao entre os dois e essa: uma campanha
 * agrupa cupons. O CRM tambem foi escrito prevendo `campaignId`. Ver
 * `lib/cupons/types.ts`.
 *
 * O QUE OS PRINTS PROVAM, E O QUE ELES DEIXAM EM ABERTO
 *
 * Os quatro prints de Campanhas (adm-006, adm-015, adm-016, adm-017) mostram a
 * tela SEM NENHUMA CAMPANHA — os tres estados vazios da lista e os dois cards de
 * desempenho tambem vazios. Nenhum deles exibe uma LINHA preenchida.
 *
 * O que define a forma de uma campanha e, portanto, o FORMULARIO (adm-016 e
 * adm-017), que esta inteiro nos prints, somado ao original. Os oito campos do
 * formulario viram os oito campos editaveis do tipo; o resto (`target_ids`,
 * `rules`, `banner_url`, `banner_url_mobile`) existe no contrato do original mas
 * NAO tem campo no formulario, e por isso fica no tipo como dado preservado e
 * nao como algo que esta tela edita. Ver `demo.ts` e `form.ts`.
 */

/**
 * O tipo da promocao — o seletor `TIPO DE PROMOÇÃO`.
 *
 * AS SEIS OPCOES SAO AS DO ORIGINAL, na mesma ordem. O print mostra so a
 * primeira (`Desconto Automático`), que e o padrao; as outras cinco nao
 * aparecem abertas em print nenhum, mas o seletor existe no formulario que o
 * print mostra, e um seletor fechado nao prova que os outros itens nao existem —
 * prova so qual e o padrao. Por isso as seis foram transcritas do original em
 * vez de inventadas.
 */
export type CampaignType =
  | 'discount_automatic'
  | 'free_shipping'
  | 'category_sale'
  | 'first_purchase'
  | 'vip'
  | 'anniversary';

/** `TIPO DE VALOR`: porcentagem ou valor fixo em reais. */
export type CampaignDiscountType = 'percentage' | 'fixed';

export interface Campaign {
  id: string;
  name: string;
  /** `Nome da Campanha` no formulario; a tabela mostra abaixo do nome. */
  description: string;
  type: CampaignType;
  discountType: CampaignDiscountType;
  discountValue: number;
  /** `Pedido Mínimo (R$)`. Zero significa "sem minimo". */
  minOrderValue: number;
  /** `Texto do Selo (Badge)`. Vazio imprime `Sem selo` na tabela, como o original. */
  badgeText: string;
  /** `Data Início`. A tela abre o formulario com a data de hoje. */
  startsAt: string;
  /** `Data Expiração`. Nulo e o unico jeito de dizer "indeterminado". */
  expiresAt: string | null;
  isActive: boolean;
  /**
   * CAMPOS DO CONTRATO QUE ESTA TELA NAO EDITA.
   *
   * Existem no original (colunas `banner_url`, `banner_url_mobile`, `target_ids`
   * e `rules`) e nenhum print mostra um campo para eles aqui — os banners sao da
   * tela `Banners` e os alvos de `Promoção por Categoria` nao tem tela em
   * referencia nenhuma. Ficam no tipo para que salvar uma campanha nao APAGUE o
   * que outra tela gravou, e sao preservados por `draftToCampaign`.
   */
  bannerUrl: string;
  bannerUrlMobile: string;
  targetIds: string[];
  rules: Record<string, string>;
  createdAt: string;
}

/**
 * O RASCUNHO guarda os numeros como STRING.
 *
 * Mesmo motivo de Cupons: o campo `Valor do Desconto` abre VAZIO em adm-016, e o
 * original faz `discount_value: Number(e.target.value)`. Com um
 * `<input type="number">` controlado por numero, apagar o campo para redigitar
 * escreve `0` e a pessoa briga com o zero que apareceu sozinho. Em string, o
 * estado vazio e representavel; a conversao acontece uma vez, ao salvar.
 */
export interface CampaignDraft {
  name: string;
  type: CampaignType;
  discountValue: string;
  discountType: CampaignDiscountType;
  minOrderValue: string;
  badgeText: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  description: string;
  bannerUrl: string;
  bannerUrlMobile: string;
  targetIds: string[];
  rules: Record<string, string>;
}

export interface CampaignFieldErrors {
  name?: string;
  discountValue?: string;
}

/**
 * Uma linha do card `Campanhas com mais venda`.
 *
 * O original monta isso de `campaign_usage` (que traz `campaign_id`,
 * `revenue_generated` e o nome da campanha por join) e mostra `sales` como
 * contagem de USOS, e nao como quantidade de itens vendidos — o campo no banco
 * e `revenue_generated` por registro de uso. Ver `metrics.ts`.
 */
export interface CampaignPerformance {
  name: string;
  sales: number;
  revenue: number;
}
