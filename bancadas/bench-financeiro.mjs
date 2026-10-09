/**
 * Bancada do modulo Financeiro.
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o
 * `next/font/google` espera as fontes para sempre). Sem esta bancada, a unica
 * garantia seria o typecheck — que nao soma, nao formata e nao ve o ramo
 * invertido.
 *
 * ================== O QUE ESTA BANCADA TEM DE DIFERENTE ==================
 *
 * As bancadas anteriores provavam LISTAS transcritas de print (afiliadas,
 * cupons, pedidos). Esta prova uma CONTA. E o material permite isso porque os
 * numeros de adm-023 nao sao um estado aleatorio: eles FECHAM com os cinco
 * pedidos que ja existem no projeto.
 *
 * O print foi capturado em 27/09/2026 com `ESTE MES` ativo, e o painel le o
 * relogio de verdade. Por isso a bancada NAO congela o relogio do processo:
 * `rangeBounds` recebe o `agora` como parametro (a assinatura existe justamente
 * para isso) e a bancada passa uma data FIXA — 27/09/2026, a do print.
 *
 * Com esse `agora`, a tela tem que reproduzir adm-023 EXATAMENTE:
 *
 *   Faturamento total    R$ 1.252,71   os cinco pedidos de junho (o print)
 *   Faturamento do mes   R$ 0,00       setembro esta vazio
 *   Faturamento de hoje  R$ 0,00       idem
 *   Ticket medio         R$ 0,00       o periodo nao tem pedido
 *   Pedidos pagos        0             os cinco sao `novo`
 *   Pedidos pendentes    0             setembro esta vazio
 *   Pedidos cancelados   0             idem
 *   Lucro estimado       R$ 0,00       idem
 *
 *   Custo fixo (27 dias)               <-- o texto do print, e a prova do rateio
 *   eixo do grafico de mes: 0..1.400   <-- o eixo do print
 *
 * E DEPOIS A PROVA AO CONTRARIO, que e a mais importante desta bancada: com o
 * MESMO codigo e o MESMO conjunto de pedidos, uma janela que COBRE junho (16/06)
 * tem que dar numeros DIFERENTES. Sem isso, "tudo zero" passaria tambem para um
 * calculo quebrado que devolvesse zero sempre — e o verde nao significaria nada.
 *
 * O que ela NAO prova: layout, cor, posicao e responsividade. Isso e navegador.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-financeiro.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-financeiro');

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

/** Igualdade profunda que nao LANCA: a bancada precisa poder falhar sozinha. */
function mesmo(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

const arquivos = [];
(function varrer(dir) {
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) varrer(caminho);
    else if (/\.tsx?$/.test(caminho)) arquivos.push(caminho);
  }
})(SRC);

/**
 * Raizes da COMPILACAO: so o modulo novo. O compilador segue os `import`
 * sozinho, entao `lib/pedidos`, `components/ui/*` e `lib/utils` entram por conta
 * propria. Compilar o `src` inteiro estoura o limite de ~178 s do `bash`.
 *
 * NOTA SOBRE `strict: false`: ele aqui e apenas para EMITIR o JavaScript. O
 * typecheck de verdade rodou com `strict: true` no `tsconfig.json` do projeto e
 * passou — essa e a autoridade sobre tipos, nao esta bancada. (A licao de
 * `strict:false` mentir foi sobre ele NEGAR estreitamento de uniao
 * discriminada; os numeros provados aqui sao de tempo de execucao, e nao
 * dependem de narrowing.)
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]financeiro|components[\\/]admin[\\/]financeiro|app[\\/]admin[\\/]financeiro)[\\/]/.test(f),
);

const programa = ts.createProgram(raizes, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipLibCheck: true,
  strict: false,
  rootDir: raizProjeto,
  outDir: OUT,
  baseUrl: raizProjeto,
  paths: { '@/*': ['./src/*'] },
});
const emitidos = programa.emit();
const erros = ts.getPreEmitDiagnostics(programa).filter((d) => d.category === ts.DiagnosticCategory.Error);
if (erros.length === 0 && emitidos.emitSkipped === false) ok('emissao sem erro', `${raizes.length} raizes do modulo`);
else {
  fail('emissao', `${erros.length} erro(s)`);
  for (const d of erros.slice(0, 8)) {
    const onde = d.file && d.start !== undefined
      ? `${d.file.fileName.replace(raizProjeto + '\\', '').replace(raizProjeto + '/', '')}:${d.file.getLineAndCharacterOfPosition(d.start).line + 1}`
      : '(sem arquivo)';
    console.log(`       ${onde} — ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
  }
}

const require = createRequire(join(PROJ, 'package.json'));
const react = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const modulo = require('node:module');
const carregarOriginal = modulo._load;
modulo._load = function (pedido, pai, ehPrincipal) {
  if (pedido.startsWith('@/')) {
    return carregarOriginal.call(this, join(OUT, 'src', pedido.slice(2)), pai, ehPrincipal);
  }
  return carregarOriginal.call(this, pedido, pai, ehPrincipal);
};

/* ---------------------------------------------------------------- modulos */

const dados = require(join(OUT, 'src/lib/financeiro/data.js'));
const demo = require(join(OUT, 'src/lib/financeiro/demo.js'));
const metricas = require(join(OUT, 'src/lib/financeiro/metrics.js'));
const utils = require(join(OUT, 'src/lib/utils.js'));
const pedidosDemo = require(join(OUT, 'src/lib/pedidos/demo.js'));
const { CostsCard } = require(join(OUT, 'src/components/admin/financeiro/costs-card.js'));
const { FinanceCharts, PieChart } = require(join(OUT, 'src/components/admin/financeiro/finance-charts.js'));
const { ProfitBreakdown } = require(join(OUT, 'src/components/admin/financeiro/profit-breakdown.js'));
const { RangeFilter } = require(join(OUT, 'src/components/admin/financeiro/range-filter.js'));

/* ------------------------------------------------------------- utilidades */

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o
 * `toLocaleString('pt-BR')` usa espaco inquebravel e o `\s` do JS nao o pega. O
 * literal abaixo tem um NBSP de verdade.
 */
const normalizar = (s) => s.replace(/[\s\u00A0]+/g, " ").trim();
function textos(html) {
  return normalizar(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&aacute;/g, 'á')
      .replace(/&eacute;/g, 'é')
      .replace(/&iacute;/g, 'í')
      .replace(/&oacute;/g, 'ó')
      .replace(/&uacute;/g, 'ú')
      .replace(/&atilde;/g, 'ã')
      .replace(/&ccedil;/g, 'ç'),
  );
}

const render = (Componente, props) => renderToStaticMarkup(react.createElement(Componente, props));

/** O codigo de um arquivo, sem comentarios e sem os atributos vazios. */
function semComentarios(codigo) {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/=""/g, '');
}

/**
 * QUANTAS VEZES UM TRECHO APARECE.
 *
 * O instrumento precisa disso porque a pergunta desta bancada nao e "existe?"
 * (isso um `includes` responde), e sim "QUANTAS?" — as cinco linhas de custo tem
 * que estar com o sinal de menos e as duas de dinheiro nao. Um `includes` de
 * `-R$ 0,00` passaria com UMA ocorrencia; o print tem SEIS.
 */
function contar(texto, agulha) {
  if (!agulha) return 0;
  let total = 0;
  let de = 0;
  for (;;) {
    const achou = texto.indexOf(agulha, de);
    if (achou === -1) return total;
    total += 1;
    de = achou + agulha.length;
  }
}

/** Os valores dos atributos `value="..."` de um HTML. */
function valoresDe(html) {
  const achados = [];
  const re = /value="([^"]*)"/g;
  let casou;
  while ((casou = re.exec(html)) !== null) achados.push(casou[1]);
  return achados;
}

/**
 * UM ATRIBUTO DE UM HTML — pelo NOME.
 *
 * ================== POR QUE ISTO E SEPARADO DE `textos()` ==================
 *
 * `textos()` tira as tags, e com elas os ATRIBUTOS. Um `aria-label` mora DENTRO
 * de uma tag: procurar `27 dia(s)` no texto de um SVG nunca acha nada, porque o
 * texto de um `<svg aria-label="...">` comeca DEPOIS do `>`. A primeira versao
 * desta bancada fazia exatamente isso e as duas provas passavam por AUSENCIA —
 * o pior tipo de verde, o que nao mede nada.
 *
 * Aqui o valor e lido do HTML CRU, com a tag no meio, e por isso a agulha pode
 * ser curta: `aria-label="` so existe em atributo.
 */
function atributoDe(html, nome) {
  const achados = [];
  const re = new RegExp(`${nome}="([^"]*)"`, 'g');
  let casou;
  while ((casou = re.exec(html)) !== null) achados.push(casou[1]);
  return achados;
}

const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

/* ============================ 1. o material ============================ */

console.log('\n1. os cinco custos de adm-024 — transcritos, nao escolhidos');

const custosEsperados = {
  productCostPct: 40,
  paymentFeePct: 4.99,
  shippingCostPct: 100,
  packagingPerOrder: 3,
  fixedMonthly: 0,
};
if (mesmo(demo.DEMO_COSTS, custosEsperados)) ok('os CINCO custos do print', '40 · 4,99 · 100 · 3 · 0');
else fail('custo divergente', JSON.stringify(demo.DEMO_COSTS));

if (demo.COSTS_KEY === 'financial_costs')
  ok('a chave da tabela `settings`', '`financial_costs` — a grafia do original');
else fail('chave errada', demo.COSTS_KEY);

/* ==================== 2. a aritmetica de adm-023 ==================== */

console.log('\n2. adm-023 — a conta reproduzida com a data do print (27/09/2026)');

/**
 * O `AGORA` DO PRINT. 27/09/2026 e a data de captura de adm-023, confirmada por
 * dois detalhes do proprio print: o eixo do grafico de dia vai de `09-01` a
 * `09-27`, e o bloco de lucro escreve `Custo fixo (27 dias)`.
 */
const AGORA_DO_PRINT = new Date(2026, 8, 27, 15, 0, 0);
const JANELA_PRINT = metricas.rangeBounds('this_month', undefined, undefined, AGORA_DO_PRINT);

/** Os pedidos REAIS do projeto — os cinco de adm-003, de junho. */
const PEDIDOS = pedidosDemo.DEMO_ORDERS_PEDIDOS;

if (PEDIDOS.length === 5)
  ok('a base sao os CINCO pedidos existentes', 'nenhum pedido novo foi inventado para esta tela');
else fail('base de pedidos', `${PEDIDOS.length} pedidos — o print soma cinco`);

/**
 * O NUMERO MAIS IMPORTANTE DA BANCADA.
 *
 * `1252.71` e o `Faturamento total` de adm-023, lido do print. Ele NAO esta
 * escrito em lugar nenhum do codigo: e a soma que o modulo tem que produzir a
 * partir de pedidos que existiam antes desta tela.
 */
if (Math.abs(metricas.totalRevenue(PEDIDOS) - 1252.71) < 0.005)
  ok('Faturamento total = R$ 1.252,71', 'o valor do print, somado do codigo');
else fail('Faturamento total', String(metricas.totalRevenue(PEDIDOS)));

/**
 * O RATEIO DO CUSTO FIXO — o `(27 dias)` do print.
 *
 * O print escreve esse numero no ROTULO de uma das linhas de lucro, o que o
 * torna uma ancora tao boa quanto um valor: o periodo `ESTE MES` aberto no dia 27
 * tem que ter 27 dias. Se o `end` fosse meia-noite em vez de fim do dia, `days`
 * cairia para 26 e o rotulo do print nao seria reproduzido.
 */
if (JANELA_PRINT.days === 27) ok('o periodo `este mes` tem 27 dias', 'o `Custo fixo (27 dias)` do print');
else fail('contagem de dias', `${JANELA_PRINT.days} — o print escreve 27`);

if (mesmo(
  [JANELA_PRINT.start.getDate(), JANELA_PRINT.start.getMonth() + 1, JANELA_PRINT.start.getFullYear()],
  [1, 9, 2026],
)) ok('o periodo comeca em 01/09', 'o `09-01` do eixo do grafico');
else fail('inicio do periodo', String(JANELA_PRINT.start));

const painelPrint = metricas.buildFinancePanel(PEDIDOS, demo.DEMO_COSTS, JANELA_PRINT, AGORA_DO_PRINT);

/**
 * OS OITO KPIs DE adm-023, um a um. Os quatro primeiros tem que sair R$ 0,00 e
 * os tres de contagem 0 — `ESTE MES` (setembro) nao tem pedido nenhum, e os cinco
 * de junho so aparecem no TOTAL, que ignora o periodo.
 */
const oito = [
  ['Faturamento total', painelPrint.totalAll, 1252.71],
  ['Faturamento do mes', painelPrint.monthRev, 0],
  ['Faturamento de hoje', painelPrint.todayRev, 0],
  ['Ticket medio', painelPrint.slice.avgTicket, 0],
  ['Pedidos pagos', painelPrint.slice.paidCount, 0],
  ['Pedidos pendentes', painelPrint.slice.pendingCount, 0],
  ['Pedidos cancelados', painelPrint.slice.canceledCount, 0],
  ['Lucro estimado', painelPrint.costs.profit, 0],
];
for (const [rotulo, obtido, esperado] of oito) {
  if (Math.abs(obtido - esperado) < 0.005) ok(`KPI \`${rotulo}\` = ${esperado}`, 'como adm-023');
  else fail(`KPI \`${rotulo}\``, `${obtido} — o print mostra ${esperado}`);
}

/** O eixo do grafico de dia: `09-01` a `09-27`, COM os 27 dias da serie. */
const serie = painelPrint.sales;
if (serie.length === 27) ok('a serie de dias tem 27 pontos', 'todos os dias do periodo, inclusive os vazios');
else fail('extensao da serie', `${serie.length} pontos`);

if (serie.length > 0 && serie[0].date === '2026-09-01')
  ok('a serie comeca em 2026-09-01', 'o primeiro rotulo do eixo do print');
else fail('primeiro ponto', serie[0] && serie[0].date);

if (serie.length > 0 && serie[serie.length - 1].date === '2026-09-27')
  ok('e termina em 2026-09-27', 'o ultimo rotulo do eixo do print');
else fail('ultimo ponto', serie.length > 0 && serie[serie.length - 1].date);

if (serie.every((p) => p.revenue === 0))
  ok('a linha fica no zero', 'o print mostra a linha colada no eixo, nao um grafico vazio');
else fail('serie com venda em setembro', 'nao deveria haver');

/**
 * O GRAFICO DE MES: UMA BARRA SO (`2026-06`), e ela com o total do print.
 *
 * O `.slice(-12)` do original pega os doze meses mais recentes QUE TEM PEDIDO, e
 * nao os doze anteriores a hoje — por isso o grafico do print tem uma barra, e
 * nao doze com onze vazias.
 */
const meses = painelPrint.months;
if (meses.length === 1 && meses[0].month === '2026-06' && Math.abs(meses[0].total - 1252.71) < 0.005)
  ok('uma barra em `2026-06` com R$ 1.252,71', 'o grafico de mes do print');
else fail('grafico de mes', JSON.stringify(meses));

/**
 * O EIXO `R$ 0` A `R$ 1.400` EM CINCO MARCAS — medido no print.
 *
 * Este e o ponto em que a escada de arredondamento tem que ser a de `1,5 · 2,5 ·
 * 3,5` e nao a classica de `1 · 2 · 5`: com o maximo de 1.252,71 a escada
 * classica daria passo `500` e topo `2.000`, e o print mostra `1.400`.
 */
const eixoCheio = metricas.eixoY(1252.71);
if (mesmo(eixoCheio.passos, [0, 350, 700, 1050, 1400]))
  ok('eixo de R$ 0 a R$ 1.400 em cinco marcas', 'o eixo do print — passo 350');
else fail('eixo com dados', JSON.stringify(eixoCheio));

const eixoVazio = metricas.eixoY(0);
if (mesmo(eixoVazio.passos, [0, 1, 2, 3, 4]))
  ok('eixo vazio de R$ 0 a R$ 4', 'o eixo do print com `ESTE MES` — o piso de 4 e do material');
else fail('eixo vazio', JSON.stringify(eixoVazio));

const eixoReal = metricas.eixoY(0.45);
if (eixoReal.passos.length === 5 && eixoReal.passos[0] === 0 && eixoReal.passos[4] > 0.45)
  ok('centavos: o eixo nao perde a casa decimal', JSON.stringify(eixoReal))
else fail('eixo de centavos', JSON.stringify(eixoReal));

/* ---- as quatro series de adm-023 ---- */

console.log('\n2b. as quatro series — duas com dado, duas vazias');

if (painelPrint.payments.length === 0)
  ok('`Formas de pagamento` vazia', 'o `Sem dados no periodo.` do print');
else fail('pizzas de pagamento', JSON.stringify(painelPrint.payments));

if (painelPrint.statuses.length === 0)
  ok('`Pedidos por status` vazia', 'idem');
else fail('pizzas de status', JSON.stringify(painelPrint.statuses));

/**
 * A CONTA DE LUCRO, TODA ZERO — e o `(0.0%)` do print.
 *
 * `margin` tem que ser EXATAMENTE `0` e nao `NaN`: a divisao `profit / revenue`
 * sobre zero daria `NaN`, e um `NaN` aqui imprime `(NaN%)` na tela.
 */
if (painelPrint.costs.totalCosts === 0 && painelPrint.costs.profit === 0)
  ok('custos e lucro zerados', 'o bloco de adm-024');
else fail('custos do periodo vazio', JSON.stringify(painelPrint.costs));

if (painelPrint.costs.margin === 0 && Number.isFinite(painelPrint.costs.margin))
  ok('a margem sai `0.0` e nao `NaN`', 'o `(0.0%)` do print');
else fail('margem', String(painelPrint.costs.margin));

/* ============ 3. a prova ao contrario: uma janela que COBRE junho ============ */

console.log('\n3. prova ao contrario — a mesma conta numa janela com pedido');

/**
 * ESTA E A PROVA QUE DA VALOR A SECAO 2.
 *
 * "Tudo zero" tambem seria o resultado de um calculo QUEBRADO que devolvesse zero
 * sempre. Aqui o MESMO codigo roda com a MESMA lista de pedidos e uma janela que
 * cobre junho — e TODOS os numeros tem que mudar. Se qualquer um continuasse
 * zero, o verde da secao 2 nao significaria nada.
 */
const AGORA_DE_JUNHO = new Date(2026, 5, 16, 20, 0, 0);
const JANELA_JUNHO = metricas.rangeBounds('this_month', undefined, undefined, AGORA_DE_JUNHO);
const painelJunho = metricas.buildFinancePanel(PEDIDOS, demo.DEMO_COSTS, JANELA_JUNHO, AGORA_DE_JUNHO);

if (JANELA_JUNHO.days === 16) ok('junho ate o dia 16 tem 16 dias', 'o rateio acompanha o periodo');
else fail('dias de junho', String(JANELA_JUNHO.days));

if (Math.abs(painelJunho.slice.revenue - 1252.71) < 0.005)
  ok('a receita do periodo passa a ser R$ 1.252,71', 'os cinco pedidos entram');
else fail('receita de junho', String(painelJunho.slice.revenue));

if (painelJunho.slice.revenue !== painelPrint.slice.revenue)
  ok('a receita MUDA com a janela', 'o calculo responde ao periodo — nao e um zero fixo');
else fail('receita igual nas duas janelas', 'a bancada nao estaria provando nada');

if (painelJunho.slice.pendingCount === 5 && painelJunho.slice.paidCount === 0 && painelJunho.slice.canceledCount === 0)
  ok('5 pendentes, 0 pagos, 0 cancelados', 'os cinco pedidos sao `novo` — o mapa de status');
else fail('contagens de junho', JSON.stringify(painelJunho.slice));

if (Math.abs(painelJunho.slice.avgTicket - 1252.71 / 5) < 1e-9)
  ok('ticket medio = total / 5', 'R$ 250,542 — a media dos pedidos que geraram a receita');
else fail('ticket medio', String(painelJunho.slice.avgTicket));

/**
 * AS BASES DOS CINCO CUSTOS, uma a uma — porque tres deles sao PORCENTAGEM e
 * nenhuma porcentagem incide sobre a mesma coisa. Este e o erro facil da tela:
 * cobrar a taxa de pagamento sobre o subtotal, ou o custo do produto sobre o
 * total (que inclui o frete).
 */
const junho = painelJunho.costs;
const subtotais = PEDIDOS.reduce((s, o) => s + o.payment.subtotal, 0);
const fretes = PEDIDOS.reduce((s, o) => s + o.payment.shippingPrice, 0);

if (Math.abs(junho.productCost - subtotais * 0.4) < 1e-9)
  ok('custo do produto = 40% do SUBTOTAL', 'e nao do total: o frete cobrado nao e mercadoria');
else fail('custo do produto', `${junho.productCost} vs ${subtotais * 0.4}`);

if (Math.abs(junho.paymentFee - 1252.71 * 0.0499) < 1e-9)
  ok('taxa de pagamento = 4,99% do FATURAMENTO', 'o gateway cobra sobre o que entrou');
else fail('taxa de pagamento', `${junho.paymentFee} vs ${1252.71 * 0.0499}`);

if (Math.abs(junho.shippingCost - fretes) < 1e-9)
  ok('custo de frete = 100% do frete COBRADO', `R$ ${fretes.toFixed(2)} — o frete nao deixa margem`);
else fail('custo de frete', `${junho.shippingCost} vs ${fretes}`);

if (Math.abs(junho.packagingCost - 15) < 1e-9)
  ok('embalagem = 5 pedidos x R$ 3,00', 'R$ 15,00 — o custo por PEDIDO, nao por item');
else fail('embalagem', String(junho.packagingCost));

if (junho.fixedCost === 0)
  ok('custo fixo zerado quando o mensal e 0', 'o padrao do print nao inventa custo');
else fail('custo fixo', String(junho.fixedCost));

if (Math.abs(junho.profit - (1252.71 - junho.totalCosts)) < 1e-9)
  ok('lucro = faturamento - total de custos', 'a ultima linha da conta');
else fail('lucro', String(junho.profit));

if (Math.abs(junho.margin - (junho.profit / 1252.71) * 100) < 1e-9 && junho.margin !== 0)
  ok('a margem sai do lucro sobre o faturamento', `${junho.margin.toFixed(1)}%`);
else fail('margem de junho', String(junho.margin));

/**
 * O RATEIO DO CUSTO FIXO, provado com um mensal DIFERENTE DE ZERO.
 *
 * Com o padrão do print (`fixedMonthly: 0`) o rateio nao pode ser observado —
 * `0 x qualquer coisa` e `0`. Aqui entra um mensal de R$ 300 e os dois periodos
 * ja medidos: 27 dias tem que dar `300 x 27/30 = 270`, e 16 dias, `160`.
 *
 * O denominador e 30 FIXO (mes comercial), e nao o tamanho do mes — e o que faz
 * 27 dias darem 270 exatos.
 */
const comFixo = { ...demo.DEMO_COSTS, fixedMonthly: 300 };
const fixo27 = metricas.computeCosts([], comFixo, JANELA_PRINT).fixedCost;
const fixo16 = metricas.computeCosts([], comFixo, JANELA_JUNHO).fixedCost;

if (Math.abs(fixo27 - 270) < 1e-9) ok('custo fixo de 27 dias = R$ 270,00', '300 x 27/30 — o rateio do print');
else fail('rateio de 27 dias', String(fixo27));

if (Math.abs(fixo16 - 160) < 1e-9) ok('custo fixo de 16 dias = R$ 160,00', '300 x 16/30');
else fail('rateio de 16 dias', String(fixo16));

/* ---- o cancelado sai de todo dinheiro ---- */

const comCancelado = PEDIDOS.map((o, i) =>
  i === 0 ? { ...o, status: 'cancelado' } : o,
);
const totalComCancelado = metricas.totalRevenue(comCancelado);

if (Math.abs(totalComCancelado - (1252.71 - PEDIDOS[0].payment.total)) < 1e-9)
  ok('pedido cancelado sai do faturamento', 'a unica exclusao do modulo');
else fail('cancelado no faturamento', String(totalComCancelado));

const junhoCancelado = metricas.buildFinancePanel(
  comCancelado, demo.DEMO_COSTS, JANELA_JUNHO, AGORA_DE_JUNHO,
);
if (junhoCancelado.slice.canceledCount === 1 && junhoCancelado.slice.valid.length === 4)
  ok('e entra na contagem de cancelados', 'a contagem ve o que existe, inclusive o cancelado');
else fail('contagem com cancelado', JSON.stringify({
  cancelados: junhoCancelado.slice.canceledCount, validos: junhoCancelado.slice.valid.length,
}));

/* ---- as bases das duas pizzas ---- */

const comValores = metricas.buildFinancePanel(
  PEDIDOS, demo.DEMO_COSTS, JANELA_JUNHO, AGORA_DE_JUNHO,
);
if (mesmo(comValores.payments, [{ name: 'Pix', value: 1252.71 }]))
  ok('`Formas de pagamento` soma REAIS por metodo', 'os cinco sao pix -> uma fatia de R$ 1.252,71');
else fail('pizzas de pagamento com dado', JSON.stringify(comValores.payments));

if (mesmo(comValores.statuses, [{ name: 'novo', value: 5 }]))
  ok('`Pedidos por status` conta PEDIDOS', 'a fatia vale 5 — que NAO e R$ 5,00');
else fail('pizzas de status com dado', JSON.stringify(comValores.statuses));

/* ============ 4. o defeito do original que NAO se repete ============ */

console.log('\n4. a unidade das pizzas — o defeito do original');

/**
 * NO ORIGINAL, AS DUAS PIZZAS COMPARTILHAM UM TOOLTIP QUE FORMATA TUDO EM
 * `formatBRL`. `Pedidos por status` recebe CONTAGENS — entao tres pedidos novos
 * apareciam como `R$ 3,00`. A prova de que isso nao acontece aqui e a unidade
 * entrar por parametro.
 */
if (metricas.formatPieValue(3, 'contagem') === '3 pedidos')
  ok('3 na pizza de status sai `3 pedidos`', 'e nao `R$ 3,00`');
else fail('unidade de contagem', metricas.formatPieValue(3, 'contagem'));

if (metricas.formatPieValue(1, 'contagem') === '1 pedido')
  ok('o singular e respeitado', '`1 pedido`, nao `1 pedidos`');
else fail('singular', metricas.formatPieValue(1, 'contagem'));

if (normalizar(metricas.formatPieValue(1252.71, 'moeda')) === 'R$ 1.252,71')
  ok('o mesmo numero em `moeda` sai em reais', 'a unidade entra por parametro, o componente nao adivinha');
else fail('unidade de moeda', metricas.formatPieValue(1252.71, 'moeda'));

/**
 * A PROVA NO DESENHO, e nao so na funcao: a pizza de status renderizada com tres
 * pedidos NAO pode conter a string do erro em lugar nenhum — nem no texto, nem
 * no `aria-label` (que a bancada tambem le, porque ele e um atributo do HTML).
 */
const pizzaStatus = render(PieChart, {
  data: [{ name: 'novo', value: 3 }],
  unidade: 'contagem',
  label: 'Pedidos por status',
});
const rotuloStatus = atributoDe(pizzaStatus, 'aria-label').join(' ');
if (normalizar(rotuloStatus).includes('novo: 3 pedidos'))
  ok('a pizza escreve `3 pedidos` no `aria-label`', 'que mora DENTRO da tag — fora do alcance de `textos()`');
else fail('aria-label da pizza de status', rotuloStatus || '(nao existe aria-label)');

if (textos(pizzaStatus).includes('3 pedidos'))
  ok('e na legenda visivel tambem', 'o mesmo numero, para quem le a tela');
else fail('legenda da pizza', textos(pizzaStatus).slice(0, 120));

// A prova da unidade errada olha o HTML CRU: ela precisa ser capaz de ver o
// `aria-label`, que e justamente onde o defeito apareceria primeiro.
if (!pizzaStatus.includes('R$ 3,00') && !pizzaStatus.includes('R$&nbsp;3,00'))
  ok('e NAO escreve `R$ 3,00` em lugar nenhum', 'nem na legenda, nem no `aria-label`');
else fail('a contagem virou reais', 'defeito do original reproduzido');

const pizzaMoeda = render(PieChart, {
  data: [{ name: 'Pix', value: 1252.71 }],
  unidade: 'moeda',
  label: 'Formas de pagamento',
});
if (textos(pizzaMoeda).includes('R$ 1.252,71'))
  ok('e a pizza de pagamento escreve em reais', 'as duas unidades convivem');
else fail('pizza de moeda', textos(pizzaMoeda).slice(0, 120));

/* ==================== 5. o que a tela desenha ==================== */

console.log('\n5. os componentes — rotulos, linhas e botoes do print');

const filtros = render(RangeFilter, {
  range: 'this_month',
  onRangeChange: () => {},
  customStart: '',
  customEnd: '',
  onCustomChange: () => {},
});
const textoFiltros = textos(filtros);

const setePilulas = ['Hoje', 'Ontem', '7 dias', '30 dias', 'Este mês', 'Mês anterior', 'Personalizado'];
const faltando = setePilulas.filter((p) => !textoFiltros.includes(p));
if (faltando.length === 0) ok('os SETE periodos do print', setePilulas.join(' · '));
else fail('periodos faltando', faltando.join(', '));

/**
 * A PILULA ATIVA E A DO PRINT, lida pelo `aria-pressed` — nao pela cor, que a
 * bancada nao ve. `ESTE MES` ativo e o estado de adm-023.
 *
 * ================== POR QUE NAO SE PROCURA `aria-pressed="true">Este mes` ==================
 *
 * A primeira versao deste trecho procurava exatamente isso — o atributo colado
 * no texto do rotulo — e falhou contra um codigo CORRETO. O motivo e a ORDEM em
 * que o React escreve os atributos no HTML do servidor: `aria-pressed` sai junto
 * do resto dos atributos da tag, e `className` vem DEPOIS dele. Entao o que
 * existe no HTML e `aria-pressed="true" class="...">Este mês`, com a classe no
 * meio. Aquela assercao media a FORMA da serializacao do React, e nao o estado
 * do componente — um instrumento mais fraco que o alvo, que teria dado um falso
 * negativo para sempre.
 *
 * Lendo os DOIS conjuntos separadamente — os botoes e os rotulos — a prova mede
 * o estado de verdade.
 */
const botoesAtivos = (filtros.match(/aria-pressed="true"/g) ?? []).length;
const botoesTotais = (filtros.match(/aria-pressed="(true|false)"/g) ?? []).length;

// O rotulo ativo: a tag de `Este mês`, e nao qualquer `Este mês` — o texto do
// print tem doze ocorrencias do mes (`09-01`, `R$ 1.400`, ...), mas so UMA delas
// e o rotulo deste botao.
const pilulasHtml = filtros.split('<button').slice(1);
const rotulosAtivos = pilulasHtml
  .filter((p) => /aria-pressed="true"/.test(p))
  // A FATIA COMECA DEPOIS DO `<button`, entao o fragmento nao tem `<` nenhum: o
  // `textos()` — que troca `<...>` por espaco — nao teria o que remover e devolveria
  // os ATRIBUTOS junto do rotulo. Cortar no primeiro `>` deixa so o texto do botao.
  .map((p) => textos(p.slice(p.indexOf('>') + 1).split('</button>')[0]));

if (rotulosAtivos.length === 1 && rotulosAtivos[0] === 'Este mês')
  ok('`Este mês` e a pilula ativa', 'o estado de adm-023 — lido do botao, nao do texto solto');
else fail('pilula ativa', JSON.stringify(rotulosAtivos));

if (botoesAtivos === 1 && botoesTotais === 7)
  ok('e so UMA das SETE esta ativa', `${botoesAtivos} de ${botoesTotais}`);
else fail('pilulas ativas', `${botoesAtivos} ativas de ${botoesTotais}`);

const semCustom = ['type="date"'];
if (semCustom.every((t) => !filtros.includes(t)))
  ok('e os campos de data ficam OCULTOS', '`Personalizado` e o unico que os revela');
else fail('campos de data visiveis', 'nao deveriam aparecer em `Este mês`');

const filtrosCustom = render(RangeFilter, {
  range: 'custom', onRangeChange: () => {}, customStart: '2026-09-01', customEnd: '2026-09-27',
  onCustomChange: () => {},
});
if (contar(filtrosCustom, 'type="date"') === 2)
  ok('em `Personalizado` aparecem DOIS campos de data', 'como no original');
else fail('campos de data', String(contar(filtrosCustom, 'type="date"')));

/**
 * OS DOIS BOTOES DE EXPORTACAO existem com o rotulo do print — e NAO estao
 * ligados a nada. O `data-export="pendente"` e o alvo DECLARADO: ele prova que a
 * ausencia de manipulador e uma decisao registrada, e nao um botao esquecido.
 */
if (textoFiltros.includes('Exportar CSV') && textoFiltros.includes('Exportar PDF'))
  ok('`EXPORTAR CSV` e `EXPORTAR PDF`', 'os dois botoes de adm-023');
else fail('botoes de exportacao', textoFiltros);

if (contar(filtros, 'data-export="pendente"') === 2)
  ok('os dois estao marcados como pendentes', 'declarado, nao um botao morto');
else fail('marcacao de exportacao', String(contar(filtros, 'data-export="pendente"')));

/* ---- o bloco de lucro, com o sinal correto em cada linha ---- */

const lucroVazio = render(ProfitBreakdown, {
  breakdown: painelPrint.costs, revenue: painelPrint.slice.revenue, days: JANELA_PRINT.days,
});
const textoLucro = textos(lucroVazio);

const linhasDoPrint = [
  'Faturamento', 'Custo dos produtos', 'Taxas de pagamento', 'Custo de frete',
  'Embalagem', 'Custo fixo (27 dias)', 'Total de custos', 'Lucro estimado',
];
const faltamLinhas = linhasDoPrint.filter((l) => !textoLucro.includes(l));
if (faltamLinhas.length === 0) ok('as OITO linhas de adm-024', 'na ordem do print');
else fail('linhas faltando', faltamLinhas.join(', '));

/**
 * O `(27 DIAS)` NO ROTULO — e ele vem da JANELA, nao de uma constante.
 *
 * A prova de que o numero do rotulo e o do periodo e rodar o MESMO componente com
 * a janela de junho e exigir `(16 dias)`. Se o `27` estivesse escrito no
 * componente, a segunda chamada continuaria dizendo 27 e a prova falharia.
 */
const lucroJunho = textos(render(ProfitBreakdown, {
  breakdown: painelJunho.costs, revenue: painelJunho.slice.revenue, days: JANELA_JUNHO.days,
}));
if (lucroJunho.includes('Custo fixo (16 dias)'))
  ok('o rotulo do custo fixo acompanha a janela', '`(27 dias)` no print, `(16 dias)` em junho');
else fail('rotulo do custo fixo', 'nao acompanhou a janela');

/**
 * O SINAL DE MENOS NAS CINCO LINHAS DE CUSTO.
 *
 * O print mostra `- R$ 0,00` nas linhas de custo e `R$ 0,00` em `Faturamento` e
 * `Lucro estimado`. E como o valor do custo chega aqui e POSITIVO, o sinal tem
 * que ser aplicado pelo DESENHO — se cada linha negasse o proprio valor, o
 * `-0` de um custo zerado imprimiria `-R$ 0,00` e nao haveria como distinguir a
 * linha de custo da de faturamento.
 */
const comMenos = contar(textoLucro, '-R$ 0,00');
if (comMenos === 6)
  ok('SEIS linhas com `-R$ 0,00`', 'os cinco custos + o total de custos');
else fail('sinal de menos nas linhas de custo', `${comMenos} ocorrencias — o print tem 6`);

if (textoLucro.includes('Faturamento R$ 0,00'))
  ok('`Faturamento` SEM o sinal de menos', 'e a unica linha que soma');
else fail('linha de faturamento', textoLucro.slice(0, 160));

if (textoLucro.includes('Lucro estimado R$ 0,00 (0.0%)'))
  ok('`Lucro estimado R$ 0,00 (0.0%)`', 'o verde com a margem de uma casa decimal');
else fail('linha de lucro', textoLucro.slice(-160));

/**
 * A NATUREZA ESTIMADA DA CONTA, dita na tela. Sem esta frase a margem apareceria
 * com a autoridade de um dado medido, e nao ha uma unica fonte de custo real
 * neste modulo.
 */
if (textoLucro.includes('estimado a partir dos custos informados'))
  ok('a tela declara que o calculo e ESTIMADO', 'nao ha lancamento de despesa real');
else fail('aviso de estimativa', 'ausente');

/* ---- os quatro graficos ---- */

const graficosHtml = render(FinanceCharts, {
  sales: painelPrint.sales,
  months: painelPrint.months,
  payments: painelPrint.payments,
  statuses: painelPrint.statuses,
});
const graficos = textos(graficosHtml);
const rotulosGrafico = atributoDe(graficosHtml, 'aria-label');

const titulos = ['Vendas por dia', 'Faturamento por mês', 'Formas de pagamento', 'Pedidos por status'];
const faltamTitulos = titulos.filter((t) => !graficos.includes(t));
if (faltamTitulos.length === 0) ok('os QUATRO graficos, com o titulo do print', titulos.join(' · '));
else fail('graficos faltando', faltamTitulos.join(', '));

const vazios = contar(graficos, 'Sem dados no período.');
if (vazios === 2) ok('as DUAS pizzas mostram `Sem dados no período.`', 'o estado de adm-024');
else fail('estado vazio das pizzas', `${vazios} ocorrencias — o print tem 2`);

/**
 * OS `aria-label` DOS GRAFICOS — lidos do HTML cru, porque moram dentro das
 * tags. A serie de dia declara `27 dia(s)` e a de mes declara `1 mês(es)`: os
 * dois numeros do print, no unico lugar onde a extensao da serie e dita em
 * palavras (o eixo mostra rotulos, nao a contagem).
 */
if (rotulosGrafico.some((r) => normalizar(r).includes('27 dia(s)')))
  ok('a serie de dia declara `27 dia(s)` no `aria-label`', 'a extensao do periodo do print');
else fail('aria-label da serie de dia', JSON.stringify(rotulosGrafico));

if (rotulosGrafico.some((r) => normalizar(r).includes('1 mês(es) com venda')))
  ok('e a de mes declara `1 mês(es) com venda`', 'a barra unica de `2026-06`');
else fail('aria-label da serie de mes', JSON.stringify(rotulosGrafico));

/**
 * E SO DOIS GRAFICOS TEM `aria-label` — porque so dois desenharam.
 *
 * As duas pizzas estao VAZIAS (`Sem dados no periodo.`), e o estado vazio e um
 * `<div>` de texto, sem rotulo nenhum. Exigir dois, e nao quatro, e o que prova
 * que a contagem esta lendo os graficos que existem de verdade — um `>= 1` aqui
 * passaria mesmo se a leitura estivesse pegando o SVG errado.
 */
if (rotulosGrafico.length === 2)
  ok('exatamente DOIS `aria-label` — os dois graficos com dado', 'as duas pizzas vazias nao tem rotulo de serie');
else fail('numero de aria-label', `${rotulosGrafico.length} — esperado 2 (linha e barra)`);

/* ---- o card de custos ---- */

const cardCustos = render(CostsCard, {
  costs: demo.DEMO_COSTS, onSave: () => {}, saving: false, outcome: 'none',
});
const textoCustos = textos(cardCustos);

const rotulosCusto = [
  'Custo médio do produto (%)', 'Taxa de pagamento (%)', 'Custo de frete (% do cobrado)',
  'Embalagem por pedido (R$)', 'Custo fixo mensal (R$)',
];
const faltamCustos = rotulosCusto.filter((l) => !textoCustos.includes(l));
if (faltamCustos.length === 0) ok('os CINCO rotulos de custo do print', 'cada um com a unidade no rotulo');
else fail('rotulos de custo faltando', faltamCustos.join(', '));

/**
 * OS CINCO VALORES DO PRINT, lidos do ATRIBUTO `value`.
 *
 * Nao da para ler de `textos()`: `textos()` tira as tags e, com elas, os
 * ATRIBUTOS — e o valor de um `<input>` controlado mora no atributo. Sem
 * `valoresDe`, este card mediria so os rotulos. (Mesma armadilha do
 * `placeholder` que a bancada de Afiliadas encontrou.)
 */
const valores = valoresDe(cardCustos);
const esperadosValores = ['40', '4.99', '100', '3', '0'];
if (mesmo(valores, esperadosValores))
  ok('e os CINCO valores do print', valores.join(' · '));
else fail('valores dos custos', JSON.stringify(valores));

if (textoCustos.includes('Salvar custos'))
  ok('o botao `Salvar custos`', 'caixa mista, como o print');
else fail('botao de salvar', 'ausente');

if (textoCustos.includes('Defina suas estimativas para calcular o lucro.'))
  ok('e o subtitulo do bloco', 'a frase do print');
else fail('subtitulo do card de custos', 'ausente');

/* ============ 6. a tela nao soma — o dono do calculo e um so ============ */

console.log('\n6. `metrics.ts` e o dono do calculo');

const viewSrc = semComentarios(arquivo('src/components/admin/financeiro/finance-view.tsx'));
const metricsSrc = semComentarios(arquivo('src/lib/financeiro/metrics.ts'));

/**
 * A CONTA MORA EM `metrics.ts`, E SO LA.
 *
 * Se a tela tivesse a propria soma, um KPI e um grafico poderiam divergir sem
 * nenhum sintoma — e o typecheck nao veria. A prova e negativa: o arquivo da tela
 * nao pode conter `reduce(` nem somar pedido.
 */
if (viewSrc.includes('buildFinancePanel'))
  ok('a tela consome `buildFinancePanel`', 'o calculo vem de um lugar so');
else fail('a tela nao usa o painel', 'estaria somando por conta propria');

if (!viewSrc.includes('reduce('))
  ok('e a tela NAO tem `reduce(`', 'nenhuma soma escrita no JSX');
else fail('a tela soma', 'ha um `reduce(` no arquivo da tela');

/** A PROVA AO CONTRARIO: o instrumento tem que achar `reduce(` ONDE ELE EXISTE. */
if (contar(metricsSrc, 'reduce(') >= 5)
  ok('e o instrumento acha `reduce(` em `metrics.ts`', `${contar(metricsSrc, 'reduce(')} ocorrencias`);
else fail('instrumento cego', 'nao achou `reduce(` nem onde ele existe');

/* ==================== 7. a rota e a referencia ==================== */

console.log('\n7. a rota e a faixa de prints');

const pageSrc = arquivo('src/app/admin/financeiro/page.tsx');
const pageLimpa = semComentarios(pageSrc);

if (pageLimpa.includes('FinanceView') && !pageLimpa.includes('ModulePage'))
  ok('a rota deixou de ser o placeholder', '`/admin/financeiro` monta a tela de verdade');
else fail('page ainda e placeholder', 'FinanceView ausente ou ModulePage presente');

/**
 * A FAIXA ERRADA FICA REGISTRADA — e o TEXTO DO CODIGO nao a repete.
 *
 * O comentario da page cita `adm-024 a adm-031` para dizer que ela estava errada.
 * Uma prova que procurasse essa string no arquivo INTEIRO casaria dentro do
 * comentario e mediria a documentacao em vez do codigo (a licao que a bancada de
 * Pedidos pagou). Por isso a prova roda sobre o codigo LIMPO: ele nao pode
 * conter `references=` nem a faixa de tres numeros.
 */
if (!pageLimpa.includes('references=') && !/adm-02[0-9]|adm-03[0-9]/.test(pageLimpa))
  ok('o codigo limpo nao anuncia mais faixa nenhuma', 'o `references` saiu com o placeholder');
else fail('faixa de prints no codigo', 'sobrou `references` ou um intervalo');

/** E o comentario REGISTRA os dois numeros certos. */
if (pageSrc.includes('adm-023 e adm-024'))
  ok('e o comentario registra a faixa CERTA', '`adm-023 e adm-024`');
else fail('registro da faixa', 'ausente');

/**
 * O `235244.png` E A CONTINUACAO, e nao outro modulo — conferido na pasta. Se o
 * segundo print fosse de outra tela, a faixa certa seria outra.
 */
if (pageSrc.includes('235244'))
  ok('e cita o arquivo do segundo print', '`235244.png` — `Custos` + `Lucro estimado`');
else fail('citacao do segundo print', 'ausente');

/* ======================== 8. provas ao contrario ======================== */

console.log('\n8. as provas ao contrario — o instrumento sabe FALHAR');

/** `contar` nao pode devolver numero para agulha ausente. */
if (contar('abc', 'zzz') === 0) ok('`contar` devolve 0 para agulha ausente', 'nao conta o vazio');
else fail('contar agulha ausente', 'devolveu algo');

/** `contar` nao pode parar na primeira ocorrencia. */
if (contar('x x x', 'x') === 3) ok('e conta TODAS as ocorrencias', 'nao para na primeira');
else fail('contar repeticoes', String(contar('x x x', 'x')));

/** `valoresDe` le atributo, e nao texto: se `textos()` fosse usado, nao haveria valor nenhum. */
if (valoresDe(cardCustos).length === 5 && !textos(cardCustos).includes('4.99'))
  ok('`valoresDe` le o ATRIBUTO e `textos` nao o ve', 'a prova de valor nao pode usar `textos`');
else fail('instrumento de valor', 'o atributo estaria visivel no texto — prova viciada');

/** `semComentarios` nao pode engolir codigo. */
if (semComentarios(pageSrc).includes('FinanceView'))
  ok('`semComentarios` preserva o codigo', 'so os comentarios saem');
else fail('semComentarios comeu codigo', 'FinanceView sumiu');

/** O eixo nao pode ser constante. */
if (metricas.eixoY(0).topo !== metricas.eixoY(1252.71).topo)
  ok('`eixoY` responde ao maximo', 'nao devolve um eixo fixo');
else fail('eixoY constante', 'nao distingue 0 de 1.252,71');

/** E o eixo nunca pode ser degenerado — `0 a 0` nao desenha nada. */
if (metricas.eixoY(0).passos[4] > 0 && metricas.eixoY(1e9).passos[4] >= 1e9)
  ok('o eixo nunca colapsa em `0 .. 0`', 'nem com zero, nem com um bilhao');
else fail('eixo degenerado', JSON.stringify([metricas.eixoY(0), metricas.eixoY(1e9)]));

/**
 * A MAIS IMPORTANTE DAS PROVAS AO CONTRARIO DESTA BANCADA: o conjunto de pedidos
 * tem que gerar TUDO ZERO em setembro e NAO ZERO em junho. Ja medido acima — mas
 * repetido aqui como assercao unica, porque e o que sustenta a secao 2 inteira.
 */
if (painelPrint.slice.revenue === 0 && painelJunho.slice.revenue !== 0)
  ok('o mesmo codigo da zero em setembro e nao-zero em junho', 'a secao 2 nao esta medindo um zero fixo');
else fail('o zero nao e distinguivel de um calculo quebrado', 'a secao 2 seria vazia');

/* ---------------------------------------------------------------- resumo */

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
