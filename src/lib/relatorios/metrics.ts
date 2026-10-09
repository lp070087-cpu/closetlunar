/**
 * Métricas do módulo Relatórios — PURAS.
 *
 * Sem React, sem I/O. A ÚNICA coisa que entra de fora e não pode ser lida aqui é a
 * data: `rangeBounds` e `inactiveCustomers` recebem `now: Date` por parâmetro. Se
 * `new Date()` fosse chamado dentro destas funções, a bancada passaria hoje e
 * falharia amanhã — e uma bancada que expira não prova nada. É a mesma regra do
 * módulo CRM (ver `lib/crm/metrics.ts`).
 *
 * ================== OS QUATRO DONOS QUE MORAM AQUI ==================
 *
 *   1. `rangeBounds`       a janela do período, a partir dos sete recortes
 *   2. `topBy`             os três cartões do topo (top-10 por uma coluna)
 *   3. `lowStockRows`      `Estoque Baixo (≤ 5)` — o corte de estoque
 *   4. `noSalesRows`       `Sem Vendas no Período` — o corte de `qtySold === 0`
 *
 * Os quatro existem porque cada um é uma REGRA que o print mostra e que a tela não
 * deve recalcular no JSX — um número calculado na tela não tem onde ser provado.
 */

import type {
  AbandonedCartRow,
  CategoryReportRow,
  CustomerReportRow,
  ProductReportRow,
  ReportRange,
} from './types';

/* ========================= 1. a janela do período ========================= */

/** Uma janela fechada de datas, como `[start, end]`. */
export interface DateWindow {
  start: Date;
  end: Date;
  /** Quantos dias a janela cobre. Usado por rótulos e pelo corte de inatividade. */
  days: number;
}

/**
 * O CORTE DE ESTOQUE BAIXO — `≤ 5`, o mesmo do original e do rótulo do print.
 *
 * Está aqui, e não `5` solto em três lugares, porque ele aparece no TÍTULO do
 * painel (`Estoque Baixo (≤ 5)`) e no FILTRO. Um número que o rótulo promete tem
 * que ser o número que a conta usa — senão o dia em que alguém trocar o `5` do
 * rótulo deixa o filtro cortando em outro lugar, e o painel passa a mentir no
 * título.
 */
export const LOW_STOCK_THRESHOLD = 5;

/** O corte de `Clientes Inativos (+90 dias)`. Mesmo dono único do rótulo. */
export const INACTIVE_DAYS = 90;

/** Quantos itens cada cartão do topo mostra — `slice(0, 10)` do original. */
export const TOP_N = 10;

/**
 * A JANELA DE CADA RECORTE — a tradução direta do `getRangeBounds` do original.
 *
 * `today`          de 00:00 de hoje até agora
 * `yesterday`      o dia de ontem inteiro (00:00 às 23:59:59)
 * `7d`             de sete dias atrás até agora
 * `30d`            de trinta dias atrás até agora
 * `month`          do dia 1 do mês corrente até agora
 * `last_month`     do dia 1 do mês passado até o último dia dele
 * `custom`         as duas datas digitadas; em branco, cai no dia de `now`
 *
 * O `custom` com campo vazio NÃO zera a tela nem lança: um `<input type="date">`
 * nasce vazio, e o comportamento do original é que a data em branco não muda o
 * `start`/`end` do `new Date()` corrente. Aqui a janela fica o dia inteiro de
 * `now` — o mesmo resultado observável, sem `Date` inválido.
 */
export function rangeBounds(
  range: ReportRange,
  customStart: string,
  customEnd: string,
  now: Date,
): DateWindow {
  const start = new Date(now);
  const end = new Date(now);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    case 'month':
      start.setFullYear(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_month':
      start.setFullYear(now.getFullYear(), now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      // O dia 0 do mês corrente é o último dia do mês passado.
      end.setFullYear(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom': {
      const parsedStart = parseDay(customStart);
      const parsedEnd = parseDay(customEnd);
      if (parsedStart) start.setTime(parsedStart.getTime());
      else start.setHours(0, 0, 0, 0);
      if (parsedEnd) {
        end.setTime(parsedEnd.getTime());
        // O dia ESCOLHIDO inteiro: sem isto, um fim em 30/06 cortaria tudo o que
        // aconteceu no próprio dia 30 — e as outras seis janelas terminam todas
        // em `23:59:59.999`. Ver a nota de `parseDay`.
        end.setHours(23, 59, 59, 999);
      } else {
        end.setHours(23, 59, 59, 999);
      }
      break;
    }
  }

  return { start, end, days: daysBetween(start, end) };
}

/**
 * Uma data digitada no `<input type="date">` — `2026-06-01`.
 *
 * ================== O DIA é LOCAL, E ISSO FOI UM DEFEITO ==================
 *
 * `new Date('2026-06-01')` — a forma "só a data" — é lida pela especificação como
 * **UTC**, e não como hora local. Em `America/Sao_Paulo` (UTC−3) isso vira 31/05
 * às 21:00 locais: a janela do modo `Personalizado` começava UM DIA ANTES do dia
 * clicado. As outras seis janelas (`today`, `yesterday`, `last_month`, …) são
 * todas calculadas em hora LOCAL, então `custom` era a única fora do lugar — e a
 * diferença só aparece em fuso negativo, que é exatamente o caso daqui.
 *
 * Um `<input type="date">` devolve um dia de CALENDÁRIO, sem fuso: quem digita
 * `2026-06-01` quer o dia 1 de junho na loja, não em Greenwich. Por isso a string
 * é aberta em três números e montada com o construtor LOCAL — o mesmo que as
 * outras janelas usam. Uma prova do contrário está na bancada: com o `new Date`
 * cru o `getDate()` do início dava `31` e não `1`.
 *
 * Uma string vazia, fora do formato `AAAA-MM-DD` ou de mês impossível devolve
 * `null`; quem chama decide o recuo. Não lança: o campo pode estar pela metade
 * enquanto se digita.
 */
function parseDay(value: string): Date | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const casou = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!casou) return null;
  const [, ano, mes, dia] = casou;
  const date = new Date(Number(ano), Number(mes) - 1, Number(dia));
  // Mês 13 "transborda" para janeiro do ano seguinte. Se o mês ou o dia
  // voltarem diferentes do digitado, a data não existe (ex.: 31/02) — é `null`,
  // e não um dia vizinho silencioso.
  if (date.getFullYear() !== Number(ano) || date.getMonth() !== Number(mes) - 1 || date.getDate() !== Number(dia)) {
    return null;
  }
  return date;
}

/** Dias inteiros entre duas datas, para o rótulo de apoio. */
function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/* ========================= 2. os cartões do topo ========================= */

/**
 * OS N PRIMEIROS POR UMA COLUNA — os três `ReportCard` do original.
 *
 * `Mais Vendidos`   ordena por `qtySold` desc, corta em 10
 * `Mais Visualizados` ordena por `views` desc, corta em 10
 * `Mais Favoritados`  ordena por `favorites` desc, corta em 10
 *
 * `sort` NÃO muta a lista recebida: `[...rows]` antes de ordenar. O original usa
 * `[...data].sort(...)` pelo mesmo motivo — ordenar `data` no lugar reordenaria a
 * tabela `Todos os Produtos` que é desenhada logo abaixo, e a tabela e os cartões
 * passariam a mostrar ordens diferentes DO MESMO dado.
 *
 * ================== O EMPATE É A ORDEM DE ENTRADA, E ISSO FOI MEDIDO ==================
 *
 * Na loja do print NÃO HÁ DESEMPATE A FAZER: as dez linhas têm `qtySold = 0` e
 * `favorites = 0`, e nove delas têm `views = 0`. Então os três cartões são a
 * MESMA lista de dez nomes, e a pergunta é qual ordem um empate total produz.
 *
 * A RESPOSTA ESTÁ NO PRINT, e não foi escolhida: em `235851.png` os três cartões
 * listam
 *
 *   1. Top Essential Sustentação
 *   2. Conjunto Glow Nude
 *   3. Kit Nike
 *   4. Legging Modeladora Premium
 *   ...
 *
 * que é a ordem de ENTRADA — a mesma da tabela `Todos os Produtos` logo abaixo
 * (linhas 1 a 4 idênticas). Se o empate fosse desempatado por NOME, o cartão
 * `Mais Vendidos` começaria em `Conjunto Glow Nude` (a ordem alfabética `pt-BR`
 * põe `Conjunto` antes de `Top`), e o print mostra `Top Essential Sustentação`
 * em primeiro. Um desempate por nome CONTRARIA a captura.
 *
 * Por isso NÃO há critério de desempate aqui: `Array.prototype.sort` é estável
 * desde o ES2019, então empates preservam a ordem de entrada — que é o que o
 * print mostra. Acrescentar um `localeCompare` seria inventar uma ordem que o
 * material não tem, e o resultado apareceria no primeiro cartão.
 *
 * O `Jaqueta Corta Vento Fit` é a prova de que a ordenação REALMENTE ordena e não
 * apenas copia a lista: é o único com `views = 1`, e ele sobe para o topo de
 * `Mais Visualizados` — mantendo os nove zeros na ordem de entrada, logo abaixo
 * dele.
 */
export function topBy<K extends 'qtySold' | 'views' | 'favorites'>(
  rows: readonly ProductReportRow[],
  key: K,
): ProductReportRow[] {
  return [...rows].sort((a, b) => b[key] - a[key]).slice(0, TOP_N);
}

/* ===================== 3. Estoque Baixo (≤ 5) ===================== */

/**
 * AS LINHAS DE `Estoque Baixo (≤ 5)` — filtro e ordem.
 *
 * O filtro é `stock <= LOW_STOCK_THRESHOLD` (o mesmo número do rótulo). A ORDEM é
 * CRESCENTE por estoque (`a.stock - b.stock`), o `sort` do original, e não a ordem
 * da tabela: no print, `Kit Nike` (`1 un.`) vem ANTES de `Macaquinho` (`5 un.`),
 * que é a ordem do estoque e não a ordem em que eles aparecem em `Todos os
 * Produtos` (lá o `Kit Nike` é a linha 3 e o `Macaquinho` a linha 9 — a mesma
 * coisa aqui por acaso, mas o critério é o estoque, não a posição).
 *
 * O limite superior é FECHADO: o `5 un.` do `Macaquinho` está na lista, e um corte
 * `< 5` o deixaria de fora.
 */
export function lowStockRows(rows: readonly ProductReportRow[]): ProductReportRow[] {
  return [...rows]
    .filter((row) => row.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);
}

/**
 * UM ESTOQUE ESTÁ BAIXO? O predicado que a tabela usa para pintar a célula.
 *
 * Recebe o NÚMERO, e não a linha: a tabela já tem o `stock` isolado no ponto onde
 * pinta, e pedir a linha inteira obrigaria quem chama a inventar uma linha falsa
 * só para a chamada passar — o tipo viraria um cast, e um cast aqui é o defeito
 * que este projeto proíbe. O número é o que o corte precisa.
 */
export function isLowStock(stock: number): boolean {
  return stock <= LOW_STOCK_THRESHOLD;
}

/* ===================== 4. Sem Vendas no Período ===================== */

/**
 * AS LINHAS DE `Sem Vendas no Período` — `qtySold === 0`.
 *
 * Mantém a ordem da tabela (`Todos os Produtos`), e não uma ordenação própria: o
 * original faz `data.filter(p => p.qtySold === 0)` sem `sort`, e no print o painel
 * lista `Top Essential Sustentação`, `Conjunto Glow Nude`, `Kit Nike`, ... — a
 * mesma ordem da tabela. Ordenar aqui seria inventar um critério que o material
 * não tem.
 */
export function noSalesRows(rows: readonly ProductReportRow[]): ProductReportRow[] {
  return rows.filter((row) => row.qtySold === 0);
}

/* ========================= o filtro de categoria ========================= */

/**
 * O FILTRO DE CATEGORIA DA ABA `Produtos`.
 *
 * `all` devolve tudo; qualquer outro valor casa EXATAMENTE pelo texto da coluna
 * (`p.category === filtro`), como o original. Não normaliza acento nem caixa: o
 * valor do filtro vem da lista fixa, e casar por igualdade é o que o print
 * sustenta — a categoria `Sem categoria` não é alvo de nenhuma opção do `select`,
 * então ela some quando se filtra por uma categoria real, e isso é correto.
 */
export function filterByCategory(
  rows: readonly ProductReportRow[],
  category: string,
): ProductReportRow[] {
  if (category === 'all') return [...rows];
  return rows.filter((row) => row.category === category);
}

/* ========================= Clientes ========================= */

/**
 * OS CLIENTES RECORRENTES — `totalOrders > 1`.
 *
 * O corte é ESTRITAMENTE maior que um: uma cliente com UM pedido não é recorrente.
 * O KPI `Clientes Recorrentes` de adm-065 conta estas linhas.
 */
export function recurringCustomers(rows: readonly CustomerReportRow[]): CustomerReportRow[] {
  return rows.filter((row) => row.totalOrders > 1);
}

/**
 * OS CLIENTES INATIVOS (+90 dias) — os que não compram há mais de 90 dias.
 *
 * O corte recebe `now` de fora (nunca `new Date()` aqui). No print a lista está
 * vazia porque não há cliente nenhum; a função precisa existir assim mesmo, porque
 * a bancada tem que provar o corte com uma cliente de 91 dias e uma de 89 — o
 * limite é o que o rótulo `+90 dias` promete, e um `>` errado classificaria as
 * duas do mesmo jeito.
 */
export function inactiveCustomers(
  rows: readonly CustomerReportRow[],
  now: Date,
): CustomerReportRow[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS);
  return rows.filter((row) => {
    const last = new Date(row.lastOrder);
    if (Number.isNaN(last.getTime())) return false;
    return last < cutoff;
  });
}

/** Os clientes do topo, por faturamento — a `Top Clientes` da tabela. */
export function topCustomers(rows: readonly CustomerReportRow[]): CustomerReportRow[] {
  return [...rows].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, TOP_N);
}

/* ========================= Categorias ========================= */

/** A linha do topo, para já formatar a barra. */
export interface CategoryShareRow extends CategoryReportRow {
  /** `share` em pontos percentuais, ex.: `42.5` para 42,5%. */
  share: number;
}

/**
 * DESEMPENHO POR CATEGORIA — a tabela `Desempenho por Categoria` (adm-066).
 *
 * Cada linha recebe o `share` de receita: quanto por cento ela representa do total.
 * O share é DERIVADO aqui, na leitura, e não gravado — pela mesma razão de
 * `Category.productCount`: uma receita gravada precisa ser recalculada a cada venda,
 * e o share gravado ficaria no valor de ontem.
 *
 * A ORDEM é decrescente por receita (o `sort` do original), e o EMPATE fica com a
 * ordem de entrada pelo mesmo motivo de `topBy`: o `sort` do JavaScript é estável
 * e acrescentar um desempate por nome seria inventar um critério que o material
 * não tem.
 *
 * O TOTAL ZERO é tratado: se todas as receitas forem zero, `total` é 0 e a divisão
 * daria `NaN`. Nesse caso o `share` é `0` para todas — a loja de demonstração está
 * exatamente nesse estado (nenhuma venda), e `NaN.toFixed(1)` imprimiria `NaN%`
 * na tela. Ver `shareOf`.
 */
export function categoryShareRows(rows: readonly CategoryReportRow[]): CategoryShareRow[] {
  const total = rows.reduce((sum, row) => sum + row.revenue, 0);
  return [...rows]
    .sort((a, b) => b.revenue - a.revenue)
    .map((row) => ({ ...row, share: shareOf(row.revenue, total) }));
}

/**
 * O SHARE DE UMA RECEITA SOBRE O TOTAL — `(receita / total) * 100`, em pontos.
 *
 * Devolve `0` quando o total é zero. O original NÃO protege isso (`c.revenue /
 * totalRevenue`), e na loja vazia do print o resultado seria `NaN` — a barra
 * ficaria com largura `NaN%` e o texto imprimiria `NaN%`. É um defeito que o
 * material do print não expõe (não há linha) mas que a bancada pega com um total
 * zero, e a função corrige na origem.
 */
export function shareOf(revenue: number, total: number): number {
  if (!Number.isFinite(total) || total === 0) return 0;
  return (revenue / total) * 100;
}

/* ========================= Carrinhos abandonados ========================= */

/** O rótulo do carrinho sem e-mail — `Visitante`, o texto literal do original. */
export const VISITOR_LABEL = 'Visitante';

/** O texto de um carrinho abandonado, na coluna da esquerda. */
export function abandonedLabel(row: AbandonedCartRow): string {
  return row.email && row.email.trim() !== '' ? row.email : VISITOR_LABEL;
}
