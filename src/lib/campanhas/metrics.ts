/**
 * Formatacao, ordenacao e agregacao de Campanhas.
 *
 * Modulo PURO: sem React, sem I/O. E aqui que moram os defeitos que um typecheck
 * nao pega — desconto formatado com o separador errado, validade nula virando
 * `Invalid Date`, a coluna STATUS dizendo `Ativo`/`Inativo` quando o original diz
 * `Ativa`/`Pausada`, e o card de desempenho mostrando `R$ 0,00` no lugar de
 * "sem dados".
 */

import { formatBRL } from '@/lib/utils';
import type { Campaign, CampaignPerformance, CampaignType } from './types';

/**
 * O ROTULO DE CADA TIPO — o que a coluna TIPO imprime.
 *
 * O original faz `r.type.replace("_", " ")`, ou seja, imprime o VALOR CRU do
 * banco com o primeiro sublinhado trocado por espaco, em caixa alta pelo CSS:
 * `discount automatic`, `free shipping`, `category sale`...
 *
 * Isso produz `discount automatic` — ingles, e sem traduzir. O painel aqui e
 * todo em portugues, e o SELETOR do formulario (que o print mostra) lista os
 * tipos em portugues: `Desconto Automático`, `Frete Grátis`, `Promoção por
 * Categoria`, `Primeira Compra`, `Clientes VIP`, `Aniversário`.
 *
 * PRINT ATUAL VENCE, E AQUI ELE NAO AJUDA: nenhum print tem uma linha de tabela,
 * entao nao ha como ver o que a coluna TIPO imprime. Diante disso, a decisao e
 * usar OS MESMOS ROTULOS DO SELETOR em vez do valor cru do banco — duas razoes:
 *
 *   1. a tela inteira esta em portugues, e `discount automatic` destoaria de
 *      tudo a volta;
 *   2. imprimir o `replace("_"," ")` do original AMARRA a coluna ao formato do
 *      enum do banco. Este projeto ja usa camelCase com nomes proprios
 *      (`discountAutomatic`), e o texto da tela nao deveria quebrar se o nome do
 *      valor mudar no schema.
 *
 * DIVERGENCIA REGISTRADA: se a intencao for reproduzir o original ao pe da
 * letra, esta funcao e o unico ponto a trocar.
 */
const TYPE_LABELS: Record<CampaignType, string> = {
  discount_automatic: 'Desconto Automático',
  free_shipping: 'Frete Grátis',
  category_sale: 'Promoção por Categoria',
  first_purchase: 'Primeira Compra',
  vip: 'Clientes VIP',
  anniversary: 'Aniversário',
};

export function campaignTypeLabel(type: CampaignType): string {
  return TYPE_LABELS[type] ?? type;
}

/** As opcoes do seletor `TIPO DE PROMOÇÃO`, na ordem do original. */
export const CAMPAIGN_TYPE_OPTIONS: { value: CampaignType; label: string }[] = [
  { value: 'discount_automatic', label: TYPE_LABELS.discount_automatic },
  { value: 'free_shipping', label: TYPE_LABELS.free_shipping },
  { value: 'category_sale', label: TYPE_LABELS.category_sale },
  { value: 'first_purchase', label: TYPE_LABELS.first_purchase },
  { value: 'vip', label: TYPE_LABELS.vip },
  { value: 'anniversary', label: TYPE_LABELS.anniversary },
];

/** As opcoes do seletor `TIPO DE VALOR`, na ordem do original. */
export const DISCOUNT_TYPE_OPTIONS: { value: 'percentage' | 'fixed'; label: string }[] = [
  { value: 'percentage', label: 'Porcentagem (%)' },
  { value: 'fixed', label: 'Valor Fixo (R$)' },
];

/**
 * A COLUNA DESCONTO.
 *
 * `10%` ou `R$ 20,00` — o mesmo par do original
 * (`discount_type === "percentage" ? \`${v}%\` : formatBRL(v)`).
 *
 * O `Number()` em volta normaliza o que vier do banco: um `numeric` chega ao
 * driver como `"10.00"`, e sem normalizar a coluna imprimiria `10.00%` enquanto o
 * formulario do lado mostra `10`. Um decimal de verdade continua decimal —
 * `12.5%` e um desconto valido e o `String(Number())` nao o achata.
 */
export function formatCampaignDiscount(campaign: Pick<Campaign, 'discountType' | 'discountValue'>): string {
  const value = Number(campaign.discountValue);
  if (!Number.isFinite(value)) return '—';
  return campaign.discountType === 'percentage' ? `${value}%` : formatBRL(value);
}

/**
 * A COLUNA VALIDADE.
 *
 * O original imprime `Indeterminado` quando nao ha `expires_at` — e NAO um
 * travessao. A diferenca importa: `—` diz "nao sei", e `Indeterminado` diz "esta
 * campanha nao tem fim", que e o que a ausencia de data significa aqui. A palavra
 * e a do original e o print nao a desmente (nao ha linha), entao fica.
 *
 * A data usada e `expires_at`, e nao `starts_at`: o original decide por ela.
 */
export function formatCampaignValidity(
  campaign: Pick<Campaign, 'expiresAt'>,
  formatDate: (value: string | Date | null | undefined) => string,
): string {
  if (!campaign.expiresAt) return 'Indeterminado';
  const date = new Date(campaign.expiresAt);
  if (Number.isNaN(date.getTime())) return 'Indeterminado';
  return formatDate(campaign.expiresAt);
}

/**
 * A COLUNA STATUS — `Ativa` / `Pausada`, e nao `Ativo` / `Inativo`.
 *
 * O original escreve `Ativa`/`Pausada` (concordando com "campanha", feminino).
 * Cupons, do lado, escreve `Ativo`/`Inativo` (concordando com "cupom"). As duas
 * grafias convivem no material DE PROPOSITO, e trocar uma pela outra por
 * simetria seria "fabricar consistencia". Ver `lib/cupons/metrics.ts`.
 */
export function campaignStatusLabel(isActive: boolean): string {
  return isActive ? 'Ativa' : 'Pausada';
}

/**
 * O SELO DA TABELA — no original e VERDE quando ativa e VERMELHO quando pausada
 * (`bg-green-100 text-green-700` / `bg-red-100 text-red-700`).
 *
 * Nao ha linha em print nenhum para conferir, entao a cor vem do original. E
 * diferente do selo de Cupons, que e preto — as duas telas nao compartilham o
 * componente justamente porque o material as pinta diferente.
 */
export function campaignStatusTone(isActive: boolean): string {
  return isActive
    ? 'bg-success-surface text-success-foreground'
    : 'bg-danger-surface text-danger-foreground';
}

/**
 * A LISTA, NA ORDEM DO ORIGINAL: mais recente primeiro
 * (`.order("created_at", { ascending: false })`).
 *
 * Desempate pelo nome para a lista nao trocar de ordem entre renderizacoes
 * quando duas campanhas nascem no mesmo instante.
 */
export function sortCampaigns(rows: Campaign[]): Campaign[] {
  return [...rows].sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (diff !== 0 && Number.isFinite(diff)) return diff;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

/** Quantas campanhas estao ativas. O contador do print conta TODAS. */
export function countActive(rows: Campaign[]): number {
  return rows.filter((campaign) => campaign.isActive).length;
}

/**
 * O CARD `Campanhas com mais venda`.
 *
 * E a UNICA agregacao deste modulo, e ela e do ORIGINAL — `CampaignReport`
 * agrupa `campaign_usage` por campanha, soma `revenue_generated` e chama a
 * contagem de USOS de `sales`:
 *
 *     entry.sales += 1;
 *     entry.revenue += Number(u.revenue_generated);
 *     ... .sort((a, b) => b.revenue - a.revenue)
 *
 * A ORDEM E POR RECEITA DECRESCENTE. O texto do card mostra a receita
 * (`{formatBRL(item.revenue)}`); o campo `sales` acompanha o dado mesmo sem
 * aparecer no print vazio — ele existe para o card ficar completo quando houver
 * dado, e a bancada prova que ele e contado e nao inventado.
 *
 * A entrada de dados e uma lista de usos JA AGRUPADOS por campanha, e nao as
 * campanhas: uma campanha que existe e nunca foi usada NAO entra no card — o
 * print vazio de adm-015 diz "Sem dados de uso.", e nao "campanhas com zero".
 * Por isso a funcao recebe `rows` de desempenho, e nao `Campaign[]`.
 *
 * `limit` entra por parametro porque nenhum print mostra um card com dado, e
 * portanto nenhum print diz quantos cabem. O corte e explicito em vez de
 * escondido num numero solto.
 */
export function topCampaignsByRevenue(rows: CampaignPerformance[], limit = 5): CampaignPerformance[] {
  return [...rows]
    .sort((a, b) => {
      const diff = b.revenue - a.revenue;
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name, 'pt-BR');
    })
    .slice(0, limit);
}

/** O total de receita somado. Alimenta o resumo, nao o print. */
export function totalRevenue(rows: CampaignPerformance[]): number {
  return rows.reduce((sum, row) => sum + row.revenue, 0);
}
