/**
 * Metricas de Financeiro — PURAS.
 *
 * Sem React, sem I/O, sem `Date.now()` escondido: toda funcao que depende do
 * agora RECEBE o agora. E o que torna a tela testavel e o que permitiu a bancada
 * provar os numeros de adm-023 sem congelar o relogio do processo.
 *
 * ESTE ARQUIVO E O DONO UNICO DO CALCULO FINANCEIRO. A tela nao soma nada por
 * conta propria — se um KPI e um grafico divergissem, seria aqui que a diferenca
 * nasceria. E o mesmo papel de `lib/produtos/metrics.ts` (lucro/margem) e
 * `lib/crm/metrics.ts` (chave da cliente).
 *
 * ================== O UNIVERSO DE CADA NUMERO ==================
 *
 * A confusao mais provavel desta tela e somar no universo errado, porque as
 * quatro primeiras metricas NAO entram no filtro de periodo:
 *
 *   Faturamento total      -> TODOS os pedidos, menos cancelados
 *   Faturamento do mes     -> TODOS, menos cancelados, do MES CORRENTE
 *   Faturamento de hoje    -> TODOS, menos cancelados, do DIA de hoje
 *   Faturamento por mes    -> TODOS, menos cancelados (12 meses)
 *
 *   todo o resto           -> SO os pedidos do PERIODO selecionado
 *
 * A regra e do original, e ela e deliberada: "faturamento total" e "do mes" sao
 * placares de vitrine, uteis mesmo quando a pessoa esta olhando um periodo
 * fechado (o mes passado). Ja ticket medio, contagens de pedido, custos e lucro
 * so fazem sentido DENTRO do periodo — sao o recorte que a pessoa pediu.
 */

import { formatBRL } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/pedidos/types';
import type {
  CostBreakdown,
  CostsDraft,
  DateWindow,
  FinanceRange,
  FinancialCosts,
  MonthPoint,
  NamedValue,
  SalesPoint,
} from './types';

const MS_DIA = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ status */

/**
 * O ESTADO DO PEDIDO -> o grupo financeiro.
 *
 * ================== ISTO NAO E O `classifyStatus` DO ORIGINAL ==================
 *
 * O original recebe `status` como STRING CRUA do banco e decide por conjuntos de
 * palavras:
 *
 *   PAID     = ["pago","paid","concluido","concluído","enviado","entregue","approved"]
 *   PENDING  = ["novo","aguardando","pendente","pending","processando"]
 *   CANCELED = ["cancelado","canceled","cancelled","estornado","reembolsado"]
 *
 * Aqui `OrderStatus` e uma UNIAO FECHADA de seis valores (`lib/pedidos/types.ts`,
 * ja validado), entao a mesma decisao e um mapa exaustivo. Nao ha `outros`: com
 * a uniao fechada, todo valor cai em um dos tres ramos — e o compilador COBRA
 * esse mapa se um setimo estado nascer. Aquele `return "outros"` do original
 * existia porque o banco pode ter qualquer string; aqui nao pode, e manter um
 * quarto ramo seria carregar uma incerteza que o tipo ja resolveu.
 *
 * O MAPEAMENTO, e por que `separacao` e pendente: a lista de PENDING do original
 * tem `processando`, e `separacao` ("em separacao") e exatamente isso — o pedido
 * existe e ainda nao foi pago/expedido. `enviado` e `entregue` contam como pagos
 * pela mesma razao do original: so se despacha o que foi pago.
 */
const GRUPO: Record<OrderStatus, 'pago' | 'pendente' | 'cancelado'> = {
  novo: 'pendente',
  separacao: 'pendente',
  pago: 'pago',
  enviado: 'pago',
  entregue: 'pago',
  cancelado: 'cancelado',
};

export function classifyStatus(status: OrderStatus): 'pago' | 'pendente' | 'cancelado' {
  return GRUPO[status] ?? 'pendente';
}

/**
 * O PEDIDO ENTRA NO FATURAMENTO?
 *
 * Cancelado NAO entra em soma nenhuma — nem no total, nem no mes, nem no
 * periodo. E a unica exclusao do modulo, e ela vale nas QUATRO metricas de
 * dinheiro. As contagens (`Pedidos pagos/pendentes/cancelados`) sao a excecao
 * obvia: elas contam o que existe, inclusive o cancelado.
 */
export function isCanceled(order: Order): boolean {
  return classifyStatus(order.status) === 'cancelado';
}

/** O valor de um pedido, com `null`/`NaN` virando zero. */
function total(order: Order): number {
  const value = Number(order.payment?.total ?? 0);
  return Number.isFinite(value) ? value : 0;
}

/* ------------------------------------------------------------------ janelas */

function inicioDoDia(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function fimDoDia(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * AS DATAS DE UM PERIODO — nos termos LOCAIS, como o original.
 *
 * `este mes` comeca no dia 1 local, e nao em UTC: o painel fala de fuso do
 * Brasil, e um mes que comece as 21h do ultimo dia do mes anterior estaria
 * medindo outro periodo. O `end` de `este mes` e o FIM DO DIA de hoje, e nao o
 * fim do mes: o print mede o mes ATE AGORA, e incluir os dias que ainda nao
 * aconteceram inflaria o denominador do custo fixo (o `days`) com dias que nao
 * existem ainda.
 *
 * `7d` e `30d` sao JANELAS MOVEIS que INCLUEM hoje: 7 dias sao hoje e mais seis,
 * nao "a semana passada". O offset e `-6` e `-29` por isso.
 */
export function rangeBounds(
  range: FinanceRange,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date(),
): DateWindow {
  let start: Date;
  let end: Date;

  switch (range) {
    case 'today':
      start = inicioDoDia(now);
      end = fimDoDia(now);
      break;
    case 'yesterday': {
      const ontem = new Date(now);
      ontem.setDate(ontem.getDate() - 1);
      start = inicioDoDia(ontem);
      end = fimDoDia(ontem);
      break;
    }
    case '7d': {
      const sete = new Date(now);
      sete.setDate(sete.getDate() - 6);
      start = inicioDoDia(sete);
      end = fimDoDia(now);
      break;
    }
    case '30d': {
      const trinta = new Date(now);
      trinta.setDate(trinta.getDate() - 29);
      start = inicioDoDia(trinta);
      end = fimDoDia(now);
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = fimDoDia(now);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // Dia 0 do mes corrente = ultimo dia do mes anterior. E o idioma do
      // original, e ele acerta fevereiro de ano bissexto sem caso especial.
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'custom':
      // `T00:00:00` sem `Z` = meia-noite LOCAL. Sem a hora explicita, o
      // `new Date('2026-09-01')` seria lido como UTC e o dia comecaria as 21h
      // do dia anterior no Brasil.
      start = customStart ? new Date(`${customStart}T00:00:00`) : inicioDoDia(now);
      end = customEnd ? new Date(`${customEnd}T23:59:59`) : fimDoDia(now);
      break;
  }

  const dias = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_DIA));
  return { start, end, days: dias };
}

/** O pedido caiu dentro da janela? Comparacao por INSTANTE, inclusiva. */
export function inWindow(order: Order, window: DateWindow): boolean {
  const quando = new Date(order.placedAt).getTime();
  if (!Number.isFinite(quando)) return false;
  return quando >= window.start.getTime() && quando <= window.end.getTime();
}

/* ---------------------------------------------------------------- os totais */

/** TODOS os pedidos menos os cancelados, dentro da janela. */
export function validOrdersIn(orders: Order[], window: DateWindow): Order[] {
  return orders.filter((order) => inWindow(order, window) && !isCanceled(order));
}

/** TODOS os pedidos dentro da janela, inclusive cancelados (as contagens). */
export function ordersIn(orders: Order[], window: DateWindow): Order[] {
  return orders.filter((order) => inWindow(order, window));
}

/**
 * FATURAMENTO TOTAL — o `R$ 1.252,71` de adm-023.
 *
 * Todos os pedidos, de qualquer data, menos cancelados. NAO depende do periodo.
 */
export function totalRevenue(orders: Order[]): number {
  return orders.filter((order) => !isCanceled(order)).reduce((soma, order) => soma + total(order), 0);
}

/**
 * FATURAMENTO DO MES CORRENTE — o `R$ 0,00` de adm-023.
 *
 * Nao depende do periodo selecionado: e sempre o mes de HOJE, mesmo com a pessoa
 * olhando "mes anterior". Quando o periodo E "este mes", ele coincide com a
 * receita do periodo — e os dois numeros aparecem lado a lado no print, um do
 * lado do outro, com o MESMO valor. Nao sao redundantes: um fica parado enquanto
 * a pessoa troca de aba.
 */
export function monthRevenue(orders: Order[], now: Date = new Date()): number {
  const inicioDoMes = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return orders
    .filter((order) => !isCanceled(order) && new Date(order.placedAt).getTime() >= inicioDoMes)
    .reduce((soma, order) => soma + total(order), 0);
}

/**
 * FATURAMENTO DE HOJE — o outro `R$ 0,00` de adm-023.
 *
 * O original usa `todayStart` calculado na hora, e nao `rangeBounds('today')` —
 * os dois dariam o mesmo, mas o `>= todayStart` do original nao tem teto. Aqui
 * ha teto (fim do dia) pelo mesmo motivo do `inWindow`: um pedido com data no
 * futuro (fuso, importacao) nao pode entrar em "hoje".
 */
export function todayRevenue(orders: Order[], now: Date = new Date()): number {
  const janela: DateWindow = { start: inicioDoDia(now), end: fimDoDia(now), days: 1 };
  return totalRevenue(ordersIn(orders, janela));
}

/* -------------------------------------------------------------- o periodo */

/**
 * O RECORTE DO PERIODO, em um passo so.
 *
 * Devolve tudo o que a tela precisa do periodo, e nada mais: as contagens que
 * aparecem nos tres cartoes de pedido, a receita e o ticket medio. Os CUSTOS
 * ficam em `computeCosts`, porque dependem tambem dos custos digitados.
 */
export interface PeriodSlice {
  /** Os pedidos do periodo, menos cancelados — a base de receita e custos. */
  valid: Order[];
  /** Os pedidos do periodo, todos — a base das tres contagens. */
  all: Order[];
  revenue: number;
  paidCount: number;
  pendingCount: number;
  canceledCount: number;
  avgTicket: number;
}

export function sliceWindow(orders: Order[], window: DateWindow): PeriodSlice {
  const all = ordersIn(orders, window);
  const valid = all.filter((order) => !isCanceled(order));
  const revenue = valid.reduce((soma, order) => soma + total(order), 0);
  return {
    valid,
    all,
    revenue,
    paidCount: all.filter((order) => classifyStatus(order.status) === 'pago').length,
    pendingCount: all.filter((order) => classifyStatus(order.status) === 'pendente').length,
    canceledCount: all.filter((order) => classifyStatus(order.status) === 'cancelado').length,
    /**
     * TICKET MEDIO = receita / numero de pedidos VALIDOS.
     *
     * O denominador sao os pedidos que geraram a receita, e nao todos os do
     * periodo: dividir por um pedido cancelado (que nao soma) derrubaria a media
     * e o numero nao corresponderia a nada. Sem pedido nenhum, e zero — e nao
     * `NaN`, que e o que a divisao direta produziria e o que imprimiria
     * `R$ NaN` na tela.
     */
    avgTicket: valid.length > 0 ? revenue / valid.length : 0,
  };
}

/* ---------------------------------------------------------------- os custos */

/**
 * A CONTA DE CUSTOS E LUCRO — o bloco de adm-024.
 *
 * CINCO CUSTOS, e cada um multiplica uma base DIFERENTE. E aqui que mora o erro
 * facil desta tela, porque tres deles sao porcentagens e ninguma e sobre a mesma
 * coisa:
 *
 *   produto    x SUBTOTAL dos itens   (nao sobre o total: o frete cobrado nao e
 *                                      mercadoria)
 *   taxa       x FATURAMENTO          (o gateway cobra sobre o que entrou)
 *   frete      x FRETE COBRADO        (`100%` = o frete cobrado e todo custo)
 *   embalagem  x NUMERO DE PEDIDOS    (R$ por pedido)
 *   fixo       x DIAS / 30            (rateio do mensal pelo periodo)
 *
 * O CUSTO FIXO RATEADO e o unico que divide: `fixedMonthly * (days / 30)`, com 30
 * fixo como denominador (mes comercial), e nao o numero de dias do mes corrente.
 * Um mes de 31 dias ratearia `31/30` do custo fixo — o original aceita esse
 * arredondamento, e mante-lo e o certo: trocar 30 pelo tamanho do mes faria
 * fevereiro custar 1/12 mais caro que janeiro sem nenhuma razao de negocio.
 *
 * `margin` e `lucro / faturamento`, ZERO quando o faturamento e zero — senao a
 * divisao daria `NaN`/`Infinity` e o `(0.0%)` do print viraria lixo.
 */
export function computeCosts(
  valid: Order[],
  costs: FinancialCosts,
  window: DateWindow,
): CostBreakdown {
  const productSubtotal = valid.reduce((soma, order) => {
    const value = Number(order.payment?.subtotal ?? 0);
    return soma + (Number.isFinite(value) ? value : 0);
  }, 0);
  const shippingCharged = valid.reduce((soma, order) => {
    const value = Number(order.payment?.shippingPrice ?? 0);
    return soma + (Number.isFinite(value) ? value : 0);
  }, 0);
  const revenue = valid.reduce((soma, order) => soma + total(order), 0);

  const productCost = productSubtotal * (costs.productCostPct / 100);
  const paymentFee = revenue * (costs.paymentFeePct / 100);
  const shippingCost = shippingCharged * (costs.shippingCostPct / 100);
  const packagingCost = valid.length * costs.packagingPerOrder;
  const fixedCost = costs.fixedMonthly * (window.days / 30);

  const totalCosts = productCost + paymentFee + shippingCost + packagingCost + fixedCost;
  const profit = revenue - totalCosts;
  return {
    productCost,
    paymentFee,
    shippingCost,
    packagingCost,
    fixedCost,
    totalCosts,
    profit,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
  };
}

/* ----------------------------------------------------------------- graficos */

/**
 * VENDAS POR DIA — a serie do primeiro grafico.
 *
 * A SERIE TEM TODOS OS DIAS DO PERIODO, inclusive os que venderam zero: e o que
 * faz o grafico mostrar uma linha reta no chao quando nao ha venda, em vez de um
 * grafico vazio. O print e exatamente isso — eixo de `09-01` a `09-27` com a
 * linha colada no zero. Uma serie so com os dias que venderam desenharia uma
 * linha curta de um ponto e o eixo sumiria.
 *
 * O TETO DE 92 DIAS existe no original e fica: um periodo "personalizado" de
 * cinco anos geraria quase dois mil pontos, o que nao cabe em 400 pixels e
 * derruba a legibilidade. Acima disso a serie simplesmente para — e o limite e
 * declarado, nao silencioso.
 */
export function salesByDay(valid: Order[], window: DateWindow, maxDias = 92): SalesPoint[] {
  const mapa = new Map<string, SalesPoint>();
  const cursor = new Date(window.start);
  while (cursor.getTime() <= window.end.getTime() && mapa.size < maxDias) {
    const chave = diaISO(cursor);
    mapa.set(chave, { date: chave, revenue: 0, orders: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const order of valid) {
    const chave = diaISO(new Date(order.placedAt));
    const ponto = mapa.get(chave);
    // Pedido FORA do esqueleto (periodo acima de 92 dias) nao cria ponto novo:
    // ele entra em `orders`, mas nao na serie — ver o teto acima.
    if (!ponto) continue;
    ponto.revenue += total(order);
    ponto.orders += 1;
  }
  return Array.from(mapa.values());
}

/**
 * FATURAMENTO POR MES — os ULTIMOS 12 meses com movimento.
 *
 * "Ultimos 12" e por POSICAO na lista ordenada, e nao "os 12 meses anteriores a
 * hoje": o `.slice(-12)` do original pega os doze meses mais recentes QUE TEM
 * PEDIDO. Com os cinco pedidos de junho, so existe a barra `2026-06` — que e
 * exatamente o print. Preencher os outros onze meses com zero desenharia uma
 * barra e onze vazios, e o print mostra uma barra.
 *
 * Cancelados ficam fora, como nas outras somas de dinheiro.
 */
export function revenueByMonth(orders: Order[], meses = 12): MonthPoint[] {
  const mapa = new Map<string, number>();
  for (const order of orders) {
    if (isCanceled(order)) continue;
    const quando = new Date(order.placedAt);
    if (Number.isNaN(quando.getTime())) continue;
    const chave = `${quando.getFullYear()}-${String(quando.getMonth() + 1).padStart(2, '0')}`;
    mapa.set(chave, (mapa.get(chave) ?? 0) + total(order));
  }
  return Array.from(mapa.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-meses)
    .map(([month, total]) => ({ month, total }));
}

/**
 * FORMAS DE PAGAMENTO — a primeira pizza.
 *
 * `valid` (sem cancelados), como todas as somas de dinheiro. O `?? '—'` do
 * original vira `'—'` aqui tambem: um pedido sem metodo de pagamento precisa
 * aparecer no grafico, e nao sumir. Dois pedidos, um sem metodo, somando 100 e
 * 50: a fatia `—` vale 50, e nao 0.
 */
export function paymentBreakdown(valid: Order[]): NamedValue[] {
  const mapa = new Map<string, number>();
  for (const order of valid) {
    const nome = order.payment?.method ? ROTULO_PAGAMENTO[order.payment.method] : '—';
    mapa.set(nome, (mapa.get(nome) ?? 0) + total(order));
  }
  return Array.from(mapa.entries()).map(([name, value]) => ({ name, value }));
}

/**
 * O ROTULO DE CADA FORMA DE PAGAMENTO.
 *
 * `pix`, `cartao` e `boleto` sao os codigos que o checkout grava
 * (`lib/pedidos/types.ts`). O original imprime a string crua do banco
 * (`Nubank`, `Pix`, o que estiver gravado). Aqui o tipo e fechado, entao o
 * rotulo e explicito — e um mapa exaustivo: se um quarto metodo nascer no
 * checkout, o compilador cobra a entrada nova em vez de a tela imprimir o codigo
 * cru para a cliente ler `cartao`.
 */
const ROTULO_PAGAMENTO: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  boleto: 'Boleto',
};

/**
 * PEDIDOS POR STATUS — a segunda pizza.
 *
 * AQUI A BASE E A LISTA INTEIRA DO PERIODO, COM CANCELADOS — e e uma excecao
 * deliberada. O nome do grafico e `Pedidos por status`: ele conta PEDIDOS, nao
 * dinheiro, e um status que quase nunca aparece e justamente `cancelado`. Usar
 * `valid` aqui apagaria a fatia que a pessoa mais precisa ver. (O original
 * tambem usa `orders`, a lista crua.)
 *
 * E O VALOR E CONTAGEM, NAO REAIS. O original passa contagens para um
 * componente de pizza cujo tooltip formata em `formatBRL` — entao a fatia de 3
 * pedidos mostra `R$ 3,00`. E um DEFEITO REAL do original, e ele NAO e
 * reproduzido: ver `formatPieValue` mais abaixo e o comentario do componente.
 */
export function statusBreakdown(all: Order[]): NamedValue[] {
  const mapa = new Map<string, number>();
  for (const order of all) {
    const nome = order.status ?? '—';
    mapa.set(nome, (mapa.get(nome) ?? 0) + 1);
  }
  return Array.from(mapa.entries()).map(([name, value]) => ({ name, value }));
}

/* ------------------------------------------------------------------ eixos */

/**
 * O PASSO "REDONDO" DE UM EIXO — a escada de 1 a 10 por decada.
 *
 * O eixo do print vai de `R$ 0` a `R$ 1.400` em cinco marcas, com passo `350`.
 * Para chegar em 350 a partir de um maximo de 1.252,71 o passo da escada tem que
 * ser `3,5 x 100` — por isso o `3.5` esta na lista. Uma escada classica
 * (`1, 2, 5, 10`) arredondaria para `500` e o eixo terminaria em `2.000`, com a
 * barra em dois tercos da altura em vez de encostar no topo como no print.
 */
const ESCADA = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10];

/** O menor degrau da escada maior ou igual ao valor. */
function degrau(valor: number): number {
  const decada = Math.pow(10, Math.floor(Math.log10(valor)));
  for (const passo of ESCADA) {
    if (passo * decada >= valor - 1e-9) return passo * decada;
  }
  return 10 * decada;
}

/**
 * O MAXIMO DE UM EIXO, E AS SUAS MARCAS.
 *
 * ================== O `4` VEM DO PRINT, NAO DA CONTA ==================
 *
 * Com a serie TODA ZERO — o estado de adm-023, com `ESTE MES` selecionado e
 * nenhum pedido em setembro — o maximo matematico e `0`, e um eixo de `0 a 0`
 * nao desenha nada. O print mostra o eixo indo de `R$ 0` a `R$ 4`, em cinco
 * marcas de um real: esse `4` e o PISO do eixo, e ele e medido no material.
 *
 * Para os outros casos, o eixo e `passo x 5`, com o passo vindo de
 * `degrau(maximo / 4)` — o mesmo desenho de cinco marcas, com o passo que faz a
 * barra encostar no topo.
 *
 * O `(+, 0) x 5` devolve numeros com no maximo duas casas, pelo mesmo motivo do
 * `formatBRL`: `0.30000000000000004` num rotulo de eixo e um defeito visivel.
 */
export function eixoY(maximo: number, marcas = 5): { topo: number; passos: number[] } {
  const limpo = Number.isFinite(maximo) && maximo > 0 ? maximo : 0;
  const topo = limpo > 0 ? degrau(limpo / (marcas - 1)) * (marcas - 1) : 4;
  const passos: number[] = [];
  for (let i = 0; i < marcas; i += 1) {
    passos.push(Number(((topo / (marcas - 1)) * i).toFixed(2)));
  }
  return { topo, passos };
}

/* ------------------------------------------------------------- o painel */

/**
 * TUDO O QUE A TELA MOSTRA, EM UMA CHAMADA — e a razao de a tela ser burra.
 *
 * ================== POR QUE ESTA FUNCAO EXISTE ==================
 *
 * A tela de Financeiro carrega os pedidos dentro de um `useEffect`, e
 * `renderToStaticMarkup` NAO roda efeito — entao a bancada nao consegue montar
 * `FinanceView` e ler os KPIs: ela mediria o esqueleto de carregamento. Foi
 * exatamente esse o muro que a bancada de Afiliadas encontrou, e a saida la foi
 * renderizar a TABELA em vez da tela.
 *
 * Aqui a saida e melhor: TODA a derivacao sai do componente e vira esta funcao
 * pura, que recebe os pedidos, os custos, a janela e o agora. A bancada chama
 * esta funcao com uma data fixa e prova os OITO KPIs, as QUATRO series e a conta
 * de lucro ate o centavo — sem relogio congelado e sem DOM.
 *
 * E O EFEITO COLATERAL E O QUE IMPORTA MAIS: a tela deixa de SOMAR. Os KPIs que
 * ela desenha sao os que `sliceWindow`, `computeCosts` e as quatro series
 * devolvem; nao ha uma segunda conta no JSX que possa divergir da primeira. O
 * dono do calculo e um so, como `metrics.ts` de Produtos e de CRM.
 */
export interface FinancePanel {
  /** Todos os pedidos, menos cancelados — o `R$ 1.252,71` de adm-023. */
  totalAll: number;
  /** O mes CORRENTE, independente do periodo selecionado. */
  monthRev: number;
  /** O dia de HOJE, independente do periodo selecionado. */
  todayRev: number;
  /** O recorte do periodo: receita, contagens e ticket medio. */
  slice: PeriodSlice;
  /** A conta de custos e lucro do periodo. */
  costs: CostBreakdown;
  sales: SalesPoint[];
  months: MonthPoint[];
  payments: NamedValue[];
  statuses: NamedValue[];
}

export function buildFinancePanel(
  orders: Order[],
  costSettings: FinancialCosts,
  window: DateWindow,
  now: Date = new Date(),
): FinancePanel {
  const slice = sliceWindow(orders, window);
  return {
    totalAll: totalRevenue(orders),
    monthRev: monthRevenue(orders, now),
    todayRev: todayRevenue(orders, now),
    slice,
    costs: computeCosts(slice.valid, costSettings, window),
    sales: salesByDay(slice.valid, window),
    months: revenueByMonth(orders),
    payments: paymentBreakdown(slice.valid),
    statuses: statusBreakdown(slice.all),
  };
}

/* ------------------------------------------------------------------ escritas */

/** O rotulo de um dia da serie, no formato do eixo do print: `09-01`. */
export function diaISO(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** `2026-06` -> `06/2026`. O original imprime a chave crua; o print, cortada. */
export function rotuloMes(chave: string): string {
  const [ano, mes] = chave.split('-');
  return `${mes}/${ano}`;
}

/* -------------------------------------------------- custos: rascunho <-> valor */

/** Os cinco custos como texto, para editar. */
export function costsToDraft(costs: FinancialCosts): CostsDraft {
  return {
    // `String(n)` e nao `n.toFixed(2)`: `4.99` tem que sair `4.99`, e `3` tem
    // que sair `3` — o print mostra `3` no campo de embalagem, nao `3.00`.
    productCostPct: String(costs.productCostPct),
    paymentFeePct: String(costs.paymentFeePct),
    shippingCostPct: String(costs.shippingCostPct),
    packagingPerOrder: String(costs.packagingPerOrder),
    fixedMonthly: String(costs.fixedMonthly),
  };
}

/**
 * O RASCUNHO DE VOLTA PARA NUMERO.
 *
 * CAMPO VAZIO VIRA ZERO, e nao erro: `0` e um valor legitimo para os cinco
 * (`custo fixo mensal 0` e o padrao do print), entao nao ha como distinguir
 * "vazio" de "zero" — e tratar vazio como erro obrigaria a digitar `0` em todo
 * campo que a pessoa nao usa. Um texto que nao e numero (colado de outro lugar)
 * tambem vira zero, em vez de `NaN` se espalhar por toda a conta de lucro.
 *
 * A VIRGULA E ACEITA como separador decimal, porque o teclado brasileiro digita
 * `4,99` — e o `<input>` do tipo texto deixa a virgula entrar. Sem isso, o valor
 * digitado com virgula viraria zero em silencio, que e o pior dos mundos: o
 * campo mostraria `4,99` e a conta usaria `0`.
 */
export function draftToCosts(draft: CostsDraft): FinancialCosts {
  return {
    productCostPct: numeroDeTexto(draft.productCostPct),
    paymentFeePct: numeroDeTexto(draft.paymentFeePct),
    shippingCostPct: numeroDeTexto(draft.shippingCostPct),
    packagingPerOrder: numeroDeTexto(draft.packagingPerOrder),
    fixedMonthly: numeroDeTexto(draft.fixedMonthly),
  };
}

function numeroDeTexto(texto: string): number {
  const normalizado = String(texto ?? '').trim().replace(',', '.');
  if (normalizado === '') return 0;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : 0;
}

/**
 * O VALOR DE UMA FATIA DE PIZZA, ja pronto para exibir.
 *
 * ================== DEFEITO DO ORIGINAL, NAO REPRODUZIDO ==================
 *
 * No original as DUAS pizzas compartilham um `FinancePieChart` cujo tooltip
 * formata TODO valor com `formatBRL`. O grafico `Pedidos por status` recebe
 * CONTAGENS — entao passar o mouse em "3 pedidos novos" mostra `R$ 3,00`, lendo
 * tres pedidos como tres reais. Um numero com a unidade errada e pior que numero
 * nenhum, porque parece certo.
 *
 * Aqui a unidade entra por PARAMETRO: `Formas de pagamento` e dinheiro,
 * `Pedidos por status` e contagem. O componente nao adivinha — quem monta o
 * grafico sabe o que passou.
 */
export function formatPieValue(value: number, unidade: 'moeda' | 'contagem'): string {
  return unidade === 'moeda' ? formatBRL(value) : `${value} ${value === 1 ? 'pedido' : 'pedidos'}`;
}
