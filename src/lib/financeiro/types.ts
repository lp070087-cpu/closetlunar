/**
 * Tipos do dominio Financeiro.
 *
 * DESENHADOS A PARTIR DE adm-023 E adm-024 — e do codigo do projeto original
 * (`FinanceAdmin` em `src/routes/admin.tsx`), que e a unica fonte do CALCULO.
 *
 * O QUE ESTA TELA E: um RELATORIO, e nao um cadastro. Ela nao tem tabela, nao
 * tem CRUD e nao cria pedido nenhum. Tudo o que ela mostra sai de duas fontes:
 *
 *   1. os PEDIDOS (`lib/pedidos`) — faturamento, contagens, graficos, relatorio;
 *   2. um registro UNICO de CUSTOS estimados (`financial_costs`), que a pessoa
 *      digita e salva.
 *
 * Por isso este modulo nao tem `form.ts`: os unicos campos digitaveis sao os
 * cinco custos, e eles vivem no proprio tipo abaixo. Um `form.ts` com um
 * rascunho de cinco numeros seria cerimonia — mas os cinco campos de custo
 * TAMBEM ficam em string enquanto se digita, pelo mesmo motivo de todo o painel
 * (apagar o campo para redigitar e o gesto mais comum, e `Number('')` grava um
 * zero fantasma). Ver `CostsDraft`.
 *
 * ================== DE ONDE VEM CADA NUMERO DE adm-023 ==================
 *
 * O PRINT NAO E UM ESTADO ALEATORIO: ele e a prova de como o calculo funciona, e
 * os numeros dele fecham com os cinco pedidos que ja existem no projeto.
 *
 *   Faturamento total    R$ 1.252,71   <- os 5 pedidos de adm-003, que sao de
 *                                         JUNHO/2026 e somam exatamente isso
 *   Faturamento do mes   R$ 0,00       <- somados no MES CORRENTE (setembro):
 *                                         nenhum pedido e de setembro
 *   Faturamento de hoje  R$ 0,00       <- idem, no dia de hoje
 *   Ticket medio         R$ 0,00       <- do PERIODO (setembro), vazio
 *   Pedidos pagos        0             <- do PERIODO: os cinco sao `novo`
 *   Pedidos pendentes    0             <- do PERIODO (setembro), vazio
 *   Pedidos cancelados   0             <- do PERIODO, vazio
 *   Lucro estimado       R$ 0,00       <- do PERIODO, vazio
 *
 * Os dois primeiros numeros vem de TODOS os pedidos; os seis seguintes vem do
 * PERIODO SELECIONADO. E essa distincao — e nao um valor de exemplo — que
 * explica por que "total" tem dinheiro e o resto tem zero. `totalAll` e
 * `monthRev` sao calculados fora do `range`; todo o resto entra por ele.
 *
 * CONSEQUENCIA: esta tela reproduz adm-023 EXATAMENTE sem inventar pedido
 * nenhum, porque a aba ativa do print (`ESTE MES`) e um periodo VAZIO. Os cinco
 * pedidos de junho ficam de fora do periodo e aparecem no total e no grafico de
 * meses — que e exatamente o que o print mostra.
 *
 * ================== O QUE MUDA COM O RELOGIO, E E DECLARADO ==================
 *
 * `adm-023` foi capturado em 27/09/2026. O painel le o relogio de verdade, e nao
 * uma data fixa: o eixo do grafico de "Vendas por dia" vai de `09-01` a `09-27`
 * e o bloco de lucro escreve `Custo fixo (27 dias)`. Aberta em outro dia, a
 * tela mostra a contagem de dias daquele periodo, e o grafico desloca junto.
 *
 * Isso NAO e um defeito a corrigir: congelar o relogio para a tela bater 1:1 com
 * um print de setembro faria o modulo mentir sobre o periodo que esta medindo. O
 * que a bancada prova, entao, e a RELACAO (o numero de dias e o do periodo
 * selecionado), e nao o literal `27`.
 */

/**
 * OS CINCO CUSTOS ESTIMADOS — a tabela `settings`, chave `financial_costs`.
 *
 * SAO ESTIMATIVAS DA PESSOA, nao dado medido: nao existe, em print nem no
 * original, nenhuma fonte de custo real por produto. Todo o bloco "Lucro
 * estimado" e uma conta de guardanapo alimentada por estes cinco numeros, e o
 * proprio print diz isso no subtitulo: `Defina suas estimativas para calcular o
 * lucro.`
 *
 * OS VALORES DE PARTIDA (adm-024): 40 · 4,99 · 100 · 3 · 0. Eles sao os
 * `DEFAULT_COSTS` do original, e o print os mostra preenchidos porque o banco de
 * demonstracao nao tinha a chave salva ainda — ou seja, na primeira abertura a
 * tela mostra o PADRAO, e nao um valor que alguem digitou.
 *
 * NAO HA FORMATO DE MOEDA NEM DE PORCENTAGEM AQUI. Os cinco sao `number` puros:
 * a unidade esta no ROTULO do campo (`(%)`, `(R$)`), como no print, e misturar a
 * unidade no valor obrigaria a tirar na hora de multiplicar.
 */
export interface FinancialCosts {
  /** % do preco do produto que e custo de mercadoria. */
  productCostPct: number;
  /** % sobre o faturamento, a taxa da adquirente. */
  paymentFeePct: number;
  /** % do frete COBRADO que e custo real. `100` = o frete nao deixa margem. */
  shippingCostPct: number;
  /** R$ por pedido, de embalagem. */
  packagingPerOrder: number;
  /** R$ por mes, rateado pelos dias do periodo. */
  fixedMonthly: number;
}

/**
 * OS CINCO CUSTOS ENQUANTO SE DIGITA — com os valores em STRING.
 *
 * Mesmo motivo de todo o painel (`AffiliateDraft.commissionValue`,
 * `CouponDraft`): um `number` no estado nao consegue representar o campo VAZIO.
 * `Number('')` e `0`, entao apagar o campo para digitar `45` mostraria `0` e o
 * `onChange` gravaria zero — o campo nunca ficaria limpo. Em string, o campo
 * pode estar vazio e a conversao acontece UMA vez, no salvamento.
 *
 * Ver `costsToDraft` / `draftToCosts` em `metrics.ts` (a conversao) e
 * `CostsCard`, que e o unico componente que edita isso.
 */
export interface CostsDraft {
  productCostPct: string;
  paymentFeePct: string;
  shippingCostPct: string;
  packagingPerOrder: string;
  fixedMonthly: string;
}

/**
 * OS SETE PERIODOS DO PRINT (adm-023), na ordem da linha.
 *
 * O `custom` e o unico que abre campos extras — dois `<input type="date">` ao
 * lado das pilulas, como no original.
 */
export type FinanceRange =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'custom';

/**
 * UMA JANELA DE TEMPO, ja resolvida em datas — e com a CONTAGEM DE DIAS.
 *
 * Os tres campos andam juntos de proposito: `days` e o divisor do rateio do
 * custo fixo mensal e o texto do bloco de lucro (`Custo fixo (27 dias)`). Ele e
 * `Math.max(1, ceil((end - start) / 1 dia))`, o que da 1 para um periodo de um
 * dia (hoje, ontem) e 27 para `este mes` aberto no dia 27.
 *
 * `end` e o FIM DO DIA (`23:59:59.999`), e nao meia-noite: um pedido feito hoje
 * as 14h tem que entrar em `hoje`, e um filtro que termine em `00:00:00` de hoje
 * deixaria de fora todo o dia de hoje.
 */
export interface DateWindow {
  start: Date;
  end: Date;
  days: number;
}

/** Um ponto do grafico "Vendas por dia". `date` e `YYYY-MM-DD`. */
export interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

/** Uma barra do grafico "Faturamento por mes". `month` e `YYYY-MM`. */
export interface MonthPoint {
  month: string;
  total: number;
}

/** Uma fatia de pizza (`Formas de pagamento`, `Pedidos por status`). */
export interface NamedValue {
  name: string;
  value: number;
}

/**
 * A CONTA DE CUSTOS E LUCRO de um periodo — o bloco de adm-024.
 *
 * Cada campo e uma LINHA do print, e a ordem da interface e a ordem em que eles
 * sao calculados. `margin` e `profit / revenue` (0 quando nao ha faturamento),
 * e nao uma media de margens: com um so pedido as duas coincidem, com varios
 * nao — e a segunda seria errada.
 */
export interface CostBreakdown {
  productCost: number;
  paymentFee: number;
  shippingCost: number;
  packagingCost: number;
  fixedCost: number;
  totalCosts: number;
  profit: number;
  margin: number;
}
