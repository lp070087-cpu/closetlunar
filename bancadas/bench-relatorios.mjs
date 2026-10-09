/**
 * Bancada do modulo Relatorios (adm-063 a adm-066).
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o
 * `next/font/google` espera as fontes para sempre). Sem esta bancada, a unica
 * garantia seria o typecheck — que nao ordena, nao corta e nao ve o ramo
 * invertido.
 *
 * ================== O QUE ESTA BANCADA PROVA ==================
 *
 *   1. que as DEZ linhas de `Todos os Produtos` sao as do print, na ordem do print;
 *   2. que os TRES cartoes do topo saem da MESMA lista, e que o `Jaqueta Corta
 *      Vento Fit` sobe em `Mais Visualizados` (o unico com `views = 1`) enquanto
 *      os outros dois cartoes ficam na ordem de entrada;
 *   3. que `Estoque Baixo (<= 5)` corta em `<= 5` e ordena por estoque crescente
 *      (`Kit Nike 1 un.` antes de `Macaquinho 5 un.`);
 *   4. que `Clientes` e `Categorias` ficam VAZIOS como o print, sem dado inventado;
 *   5. que a tela NAO desenha o grafico `Receita por Categoria` — o print o mostra
 *      ausente e o projeto nao tem biblioteca de graficos;
 *   6. que `shareOf` nao produz `NaN%` com receita total zero.
 *
 * ================== AS PROVAS AO CONTRARIO SAO O PONTO ==================
 *
 * Quase tudo aqui e um estado VAZIO ou um empate — e um zero passa tanto para o
 * codigo certo quanto para um codigo quebrado que devolve zero sempre. Por isso a
 * secao 10 repete os cortes com uma lista SEMEADA e exige o resultado oposto:
 *
 *   semear `views` e exigir o topo por views;
 *   semear estoque `<= 5` E `> 5` e exigir so os de baixo;
 *   semear duas categorias e exigir o share somando 100;
 *   e a MAIS importante: se o desempate fosse por NOME, o primeiro item de `Mais
 *   Vendidos` seria `Conjunto Glow Nude` — e o print mostra `Top Essential
 *   Sustentacao`. A bancada exige que NAO seja `Conjunto`, que e o que distingue
 *   a ordem de entrada (a do print) de uma ordem alfabetica inventada.
 *
 * O que ela NAO prova: layout, cor, posicao e responsividade. Isso e navegador.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-relatorios.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-relatorios');

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
 * Raizes da COMPILACAO: so o modulo novo. O compilador segue os `import` sozinho,
 * entao `components/ui/*`, `lib/utils` e `lib/produtos` entram por conta propria.
 * Compilar o `src` inteiro estoura o limite de ~178 s do `bash`.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]relatorios|components[\\/]admin[\\/]relatorios|app[\\/]admin[\\/]relatorios)[\\/]/.test(f),
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

const demo = require(join(OUT, 'src/lib/relatorios/demo.js'));
const dados = require(join(OUT, 'src/lib/relatorios/data.js'));
const metricas = require(join(OUT, 'src/lib/relatorios/metrics.js'));
const { ReportRankCard, LowStockPanel, NoSalesPanel } = require(join(OUT, 'src/components/admin/relatorios/report-cards.js'));
const { ProductReport } = require(join(OUT, 'src/components/admin/relatorios/report-products.js'));
const {
  CustomerStats,
  TopCustomersTable,
  InactiveCustomersPanel,
  AbandonedPanel,
} = require(join(OUT, 'src/components/admin/relatorios/report-customer.js'));
const { CategoryReportTable } = require(join(OUT, 'src/components/admin/relatorios/report-category.js'));
const { ReportFilter } = require(join(OUT, 'src/components/admin/relatorios/report-filter.js'));
const { RelatoriosView } = require(join(OUT, 'src/components/admin/relatorios/relatorios-view.js'));

/* ------------------------------------------------------------- utilidades */

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o
 * `toLocaleString('pt-BR')` usa espaco inquebravel e o `\s` do JS nao pega.
 */
const normalizar = (s) => s.replace(/[\s ]+/g, ' ').trim();
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
      .replace(/&otilde;/g, 'õ')
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

/** QUANTAS VEZES UM TRECHO APARECE — um `includes` so responde "existe?". */
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

/**
 * UM ATRIBUTO DE UM HTML — pelo NOME.
 *
 * `textos()` tira as tags, e com elas os ATRIBUTOS. `aria-selected`, `aria-label`
 * e `data-export` moram DENTRO de uma tag: procura-los no texto nunca acha nada,
 * e a prova passaria por AUSENCIA — o pior tipo de verde.
 */
function atributoDe(html, nome) {
  const achados = [];
  const re = new RegExp(`${nome}="([^"]*)"`, 'g');
  let casou;
  while ((casou = re.exec(html)) !== null) achados.push(casou[1]);
  return achados;
}

/**
 * A FAIXA DE ABAS. Isola a regiao `role="tablist"`, quebra em `<button` e le o
 * `aria-selected` de cada um — e a unica forma de provar QUAL aba esta acesa.
 */
function faixa(html) {
  const inicio = html.indexOf('role="tablist"');
  if (inicio === -1) return [];
  const fim = html.indexOf('</div>', inicio);
  const regiao = html.slice(inicio, fim === -1 ? html.length : fim);
  return regiao
    .split('<button')
    .slice(1)
    .map((btn) => ({
      rotulo: textos(btn.slice(0, btn.indexOf('</button>') + 9)),
      aceso: /aria-selected="true"/.test(btn),
    }));
}

const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

/* ============================ 1. o material ============================ */

console.log('\n1. as dez linhas de adm-063/064 — transcritas, nao escolhidas');

const nomesPrint = [
  'Top Essential Sustentação',
  'Conjunto Glow Nude',
  'Kit Nike',
  'Legging Modeladora Premium',
  'Short Fitness Energy',
  'Cropped Urban Fit',
  'Jaqueta Corta Vento Fit',
  'Macaquinho costas nuas',
  'Macaquinho',
  'top',
];

if (demo.DEMO_PRODUCT_REPORT.length === 10) ok('dez linhas', 'a contagem do print');
else fail('contagem de linhas', String(demo.DEMO_PRODUCT_REPORT.length));

if (mesmo(demo.DEMO_PRODUCT_REPORT.map((r) => r.name), nomesPrint))
  ok('a ORDEM e a do print', 'linha a linha, de `Top Essential` a `top`');
else fail('ordem divergente', JSON.stringify(demo.DEMO_PRODUCT_REPORT.map((r) => r.name)));

const categoriasPrint = ['Tops', 'Conjuntos', 'Conjuntos', 'Leggings', 'Shorts', 'Tops', 'Tops', 'Macaquinhos', 'Macaquinhos', 'Sem categoria'];
if (mesmo(demo.DEMO_PRODUCT_REPORT.map((r) => r.category), categoriasPrint))
  ok('as dez categorias', '`top` como `Sem categoria` — a prova de que a tabela NAO e o catalogo');
else fail('categorias divergentes', JSON.stringify(demo.DEMO_PRODUCT_REPORT.map((r) => r.category)));

if (mesmo(demo.DEMO_PRODUCT_REPORT.map((r) => r.stock), [35, 20, 1, 40, 30, 28, 22, 18, 5, 8]))
  ok('os dez estoques', '35 · 20 · 1 · 40 · 30 · 28 · 22 · 18 · 5 · 8');
else fail('estoques divergentes', JSON.stringify(demo.DEMO_PRODUCT_REPORT.map((r) => r.stock)));

if (demo.DEMO_PRODUCT_REPORT.every((r) => r.qtySold === 0 && r.revenue === 0 && r.favorites === 0))
  ok('vendas, receita e favoritos todos ZERO', 'a loja de demonstracao nao vendeu nada');
else fail('ha contagem nao-zero', JSON.stringify(demo.DEMO_PRODUCT_REPORT.find((r) => r.qtySold || r.revenue || r.favorites)));

if (demo.DEMO_PRODUCT_REPORT.filter((r) => r.views === 1).length === 1 &&
    demo.DEMO_PRODUCT_REPORT.find((r) => r.views === 1).name === 'Jaqueta Corta Vento Fit')
  ok('so `Jaqueta Corta Vento Fit` tem views', 'o unico `1` do print');
else fail('a unica view do print', JSON.stringify(demo.DEMO_PRODUCT_REPORT.filter((r) => r.views !== 0)));

if (demo.DEMO_CUSTOMER_REPORT.length === 0 && demo.DEMO_CATEGORY_REPORT.length === 0 && demo.DEMO_ABANDONED_REPORT.length === 0)
  ok('Clientes, Categorias e Carrinhos VAZIOS', 'o print mostra os tres em estado vazio');
else fail('lista de cliente/categoria/carrinho nao vazia', 'ha dado inventado');

if (mesmo(demo.REPORT_RANGES.map((r) => r.label), ['Hoje', 'Ontem', 'Últimos 7 dias', 'Últimos 30 dias', 'Este mês', 'Mês passado', 'Personalizado']))
  ok('os SETE periodos do `select`', 'os rotulos do original, na ordem dele');
else fail('periodos divergentes', JSON.stringify(demo.REPORT_RANGES.map((r) => r.label)));

if (demo.REPORT_RANGES.find((r) => r.value === '30d').label === 'Últimos 30 dias')
  ok('o periodo ativo do print', '`30d` = `Últimos 30 dias`, com acento');
else fail('rotulo do periodo ativo', demo.REPORT_RANGES.find((r) => r.value === '30d').label);

if (mesmo(demo.REPORT_CATEGORY_FILTERS.map((f) => f.value), ['all', 'Tops', 'Shorts', 'Leggings', 'Conjuntos', 'Macaquinhos', 'Croppeds', 'Promoções']))
  ok('as OITO opcoes do filtro de categoria', '`all` + as sete do original');
else fail('filtros divergentes', JSON.stringify(demo.REPORT_CATEGORY_FILTERS.map((f) => f.value)));

if (demo.REPORT_CATEGORY_FILTERS.some((f) => f.value === 'Promoções'))
  ok('`Promoções` com CEDILHA e til', 'nao e uma categoria do catalogo — e opcao do relatorio');
else fail('`Promoções` ausente ou normalizada', 'a grafia do print tem acento');

/* ====================== 2. os tres cartoes (adm-063) ====================== */

console.log('\n2. os tres cartoes do topo — a ordem do print, nao a alfabetica');

const linhas = demo.DEMO_PRODUCT_REPORT;
const vendedores = metricas.topBy(linhas, 'qtySold');
const vistos = metricas.topBy(linhas, 'views');
const favoritos = metricas.topBy(linhas, 'favorites');

if (mesmo(vendedores.map((r) => r.name), nomesPrint) &&
    mesmo(favoritos.map((r) => r.name), nomesPrint))
  ok('`Mais Vendidos` e `Mais Favoritados` na ORDEM DE ENTRADA', 'empate total: o `sort` estavel mantem a ordem');
else fail('ordem de empate divergente', JSON.stringify(vendedores.map((r) => r.name)));

/**
 * A PROVA CENTRAL. Nao basta a ordem bater: a bancada tem que mostrar que uma
 * ordem ALFABETICA daria OUTRO resultado — senao "bateu" nao distingue o codigo
 * certo de um que nunca ordenou nada.
 */
const alfabetica = [...linhas].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
if (alfabetica[0].name === 'Conjunto Glow Nude' && vendedores[0].name === 'Top Essential Sustentação')
  ok('a ordem alfabetica daria OUTRO primeiro item', '`Conjunto Glow Nude` — o print mostra `Top Essential`');
else fail('o desempate por nome nao seria distinguivel', `alfabetica=${alfabetica[0].name} entrada=${vendedores[0].name}`);

if (vistos[0].name === 'Jaqueta Corta Vento Fit' &&
    mesmo(vistos.slice(1).map((r) => r.name), nomesPrint.filter((n) => n !== 'Jaqueta Corta Vento Fit')))
  ok('`Mais Visualizados` sobe a `Jaqueta` — a unica com views', 'o topo dela e 1, o resto 0');
else fail('`Mais Visualizados` nao subiu a `Jaqueta`', JSON.stringify(vistos.map((r) => r.name)));

if (vendedores.length === 10 && vistos.length === 10 && favoritos.length === 10)
  ok('os tres cartoes cortam em DEZ', '`slice(0, 10)` — sem corte, os cartoes nao mudariam (10 linhas)');
else fail('corte dos cartoes', JSON.stringify([vendedores.length, vistos.length, favoritos.length]));

const cardVendedores = render(ReportRankCard, { title: 'Mais Vendidos', items: vendedores, metric: (r) => r.qtySold });
const cardVistos = render(ReportRankCard, { title: 'Mais Visualizados', items: vistos, metric: (r) => r.views });

if (textos(cardVendedores).includes('1. Top Essential Sustentação') &&
    textos(cardVendedores).includes('10. top'))
  ok('a numeracao `n. NOME` esta na tela', '`1.` e `10.` — o numero e a POSICAO');
else fail('numeracao do cartao', textos(cardVendedores).slice(0, 160));

if (textos(cardVistos).includes('1. Jaqueta Corta Vento Fit'))
  ok('a numeracao acompanha a ordem nova', '`1.` e a `Jaqueta`, nao o primeiro da entrada');
else fail('numeracao de `Mais Visualizados`', textos(cardVistos).slice(0, 160));

if (contar(textos(cardVendedores), ' 0') >= 10 && textos(cardVistos).includes(' 1'))
  ok('os VALORES sao o numero da coluna', '`0` dez vezes em Vendas, `1` uma vez em Views');
else fail('valores dos cartoes', textos(cardVistos));

/* ================== 3. a tabela `Todos os Produtos` ================== */

console.log('\n3. `Todos os Produtos` — sete colunas, dez linhas, a ordem do print');

const abaProdutos = render(ProductReport, { rows: linhas, category: 'all' });
const textoProdutos = textos(abaProdutos);

const cabecalhos = ['Produto', 'Categoria', 'Estoque', 'Vendas', 'Receita', 'Views', 'Favs'];
const posicoes = cabecalhos.map((c) => textoProdutos.indexOf(c));
if (posicoes.every((p, i) => p !== -1 && (i === 0 || p > posicoes[i - 1])))
  ok('as SETE colunas, na ordem do print', cabecalhos.join(' · '));
else fail('cabecalhos da tabela', JSON.stringify(posicoes));

if (nomesPrint.every((n) => textoProdutos.includes(n)))
  ok('as dez linhas estao na tela', 'nenhum nome perdido no caminho');
else fail('linha ausente', nomesPrint.filter((n) => !textoProdutos.includes(n)).join(', '));

if (textoProdutos.includes('Sem categoria'))
  ok('`top` entra como `Sem categoria`', 'a coluna CATEGORIA e a resolvida na leitura');
else fail('`Sem categoria` ausente', 'a tabela voltou a ser o catalogo');

if (contar(textoProdutos, 'R$ 0,00') === 10)
  ok('as dez receitas em `R$ 0,00`', '`formatBRL`, com virgula — nao `R$ 0.00`');
else fail('receitas formatadas', String(contar(textoProdutos, 'R$ 0,00')));

/**
 * AS DUAS CELULAS VERMELHAS. A classe `text-danger` mora na TAG, entao o
 * instrumento tem que ler o HTML CRU — `textos()` a apagaria junto com as tags.
 */
const celulasVermelhas = (abaProdutos.match(/tabular-nums font-bold text-danger/g) || []).length;
if (celulasVermelhas === 2)
  ok('duas celulas de estoque em vermelho', '`Kit Nike` (1) e `Macaquinho` (5) — o `<= 5` do painel');
else fail('celulas vermelhas', `${celulasVermelhas} (esperado 2)`);

/* ==================== 4. os dois paineis (adm-064) ==================== */

console.log('\n4. `Estoque Baixo (<= 5)` e `Sem Vendas no Periodo`');

const baixo = metricas.lowStockRows(linhas);
if (mesmo(baixo.map((r) => [r.name, r.stock]), [['Kit Nike', 1], ['Macaquinho', 5]]))
  ok('as DUAS linhas de estoque baixo, na ordem do print', '`Kit Nike 1 un.` antes de `Macaquinho 5 un.`');
else fail('estoque baixo', JSON.stringify(baixo.map((r) => [r.name, r.stock])));

/**
 * A PROVA AO CONTRARIO DO LIMITE: `Macaquinho` tem estoque `5` e esta na lista.
 * Um corte `< 5` (o defeito de um caractere) o deixaria de fora, e a bancada
 * pegaria — por isso a assercao e sobre a PRESENCA, e nao sobre a contagem.
 */
if (baixo.some((r) => r.name === 'Macaquinho'))
  ok('o limite e FECHADO: estoque 5 entra', 'um corte `< 5` perderia o `Macaquinho`');
else fail('o limite virou `< 5`', '`Macaquinho` (5 un.) saiu da lista');

const semVenda = metricas.noSalesRows(linhas);
if (semVenda.length === 10 && mesmo(semVenda.map((r) => r.name), nomesPrint))
  ok('todas as dez em `Sem Vendas`, na ordem da tabela', 'o original nao reordena esta lista');
else fail('`Sem Vendas`', JSON.stringify(semVenda.map((r) => r.name)));

const painelBaixo = render(LowStockPanel, { items: baixo });
const painelSemVenda = render(NoSalesPanel, { items: semVenda });
if (textos(painelBaixo).includes('Estoque Baixo (≤ 5)') &&
    textos(painelBaixo).includes('Kit Nike') && textos(painelBaixo).includes('1 un.') &&
    textos(painelBaixo).includes('5 un.'))
  ok('o painel desenha titulo, nome e `un.`', '`Estoque Baixo (≤ 5)` com o ≤ de verdade');
else fail('painel de estoque baixo', textos(painelBaixo));

if (textos(painelSemVenda).includes('Sem Vendas no Período') &&
    !textos(painelSemVenda).includes('Todos os produtos tiveram vendas!'))
  ok('`Sem Vendas` lista os dez — nao cai no texto vazio', 'o vazio so aparece com a lista vazia');
else fail('painel de sem vendas', textos(painelSemVenda).slice(0, 200));

/* ==================== 5. a aba Clientes (adm-065) ==================== */

console.log('\n5. a aba `Clientes` — estado VAZIO, como o print');

const kpis = render(CustomerStats, { customers: [], recurringCount: 0, abandonedCount: 0 });
const textoKpis = textos(kpis);
if (textoKpis.includes('Total de Clientes') && textoKpis.includes('Clientes Recorrentes') && textoKpis.includes('Carrinhos Abandonados'))
  ok('os TRES KPIs do print', 'Total · Recorrentes · Carrinhos');
else fail('KPIs de clientes', textoKpis);

const tomVerde = (kpis.match(/bg-success-surface/g) || []).length;
const tomRosa = (kpis.match(/bg-danger-surface/g) || []).length;
if (tomVerde === 1 && tomRosa === 1)
  ok('um cartao VERDE e um ROSA', 'recorrentes em success, carrinhos em danger — as cores do print');
else fail('tons dos KPIs', JSON.stringify({ tomVerde, tomRosa }));

const tabelaClientes = render(TopCustomersTable, { items: [] });
const cabClientes = ['Cliente', 'Pedidos', 'Total Gasto', 'Última Compra', 'Status'];
const posClientes = cabClientes.map((c) => textos(tabelaClientes).indexOf(c));
if (posClientes.every((p, i) => p !== -1 && (i === 0 || p > posClientes[i - 1])))
  ok('as CINCO colunas de `Top Clientes`', cabClientes.join(' · '));
else fail('cabecalhos de clientes', JSON.stringify(posClientes));

if (textos(tabelaClientes).includes('Nenhum cliente no período.'))
  ok('a tabela vazia diz o vazio', '`EmptyRow` dentro da tabela, com o cabecalho visivel');
else fail('vazio de `Top Clientes`', textos(tabelaClientes));

if (!tabelaClientes.includes('@') && !kpis.includes('@'))
  ok('NENHUM cliente inventado', 'a loja de demonstracao nao tem cliente, e a tela nao escreve um');
else fail('cliente inventado', 'ha um `@` na tela');

const inativos = render(InactiveCustomersPanel, { items: [] });
const abandonados = render(AbandonedPanel, { items: [] });
if (textos(inativos).includes('Clientes Inativos (+90 dias)') && textos(inativos).includes('Nenhum cliente inativo no período.'))
  ok('o painel de inativos, com o `+90 dias`', 'o numero do rotulo e o mesmo do corte');
else fail('painel de inativos', textos(inativos));

if (textos(inativos).includes('text-danger') || inativos.includes('text-danger'))
  ok('`Clientes Inativos` e VERMELHO no print', 'o outro painel nao e — a tela preserva a distincao');
else fail('cor do painel de inativos', 'sem `text-danger`');

if (textos(abandonados).includes('Carrinhos Abandonados') && textos(abandonados).includes('Nenhum carrinho abandonado no período.'))
  ok('o painel de carrinhos, com o texto vazio do print', 'duas colunas: quem e quanto');
else fail('painel de carrinhos', textos(abandonados));

if (metricas.abandonedLabel({ email: null, subtotal: 100 }) === 'Visitante' &&
    metricas.abandonedLabel({ email: '  ', subtotal: 0 }) === 'Visitante' &&
    metricas.abandonedLabel({ email: 'a@b.com', subtotal: 0 }) === 'a@b.com')
  ok('sem e-mail vira `Visitante`', 'inclusive um e-mail so de espacos');
else fail('rotulo do carrinho', JSON.stringify([
  metricas.abandonedLabel({ email: null, subtotal: 0 }),
  metricas.abandonedLabel({ email: 'a@b.com', subtotal: 0 }),
]));

/* ================== 6. a aba Categorias (adm-066) ================== */

console.log('\n6. a aba `Categorias` — a tabela vazia e a conta do share');

const abaCategorias = render(CategoryReportTable, { items: metricas.categoryShareRows(demo.DEMO_CATEGORY_REPORT) });
const cabCategorias = ['Categoria', 'Produtos Vendidos', 'Receita Total', 'Share de Receita'];
const posCategorias = cabCategorias.map((c) => textos(abaCategorias).indexOf(c));
if (posCategorias.every((p, i) => p !== -1 && (i === 0 || p > posCategorias[i - 1])))
  ok('as QUATRO colunas de `Desempenho por Categoria`', cabCategorias.join(' · '));
else fail('cabecalhos de categorias', JSON.stringify(posCategorias));

if (!abaCategorias.includes('<tbody><tr>') || !/Nenhuma categoria|Geral/.test(textos(abaCategorias)))
  ok('nenhuma linha de categoria, e nenhum texto inventado', 'o print tem a tabela so com o cabecalho');
else fail('categoria inventada', textos(abaCategorias).slice(0, 200));

/**
 * O GRAFICO NAO EXISTE. O print de adm-066 nao tem o bloco `Receita por
 * Categoria` (a loja nao vendeu), e o projeto nao tem biblioteca de graficos.
 */
if (!abaCategorias.includes('Receita por Categoria') && !abaCategorias.includes('<svg'))
  ok('SEM o grafico `Receita por Categoria`', 'o print o mostra ausente; sem dado e sem biblioteca, ele nao entra');
else fail('grafico desenhado sem dado', 'bloco de grafico presente no html');

/* ==================== 7. as metricas puras, com `now` ==================== */

console.log('\n7. `rangeBounds` e os cortes de cliente — o relogio entra por parametro');

const AGORA = new Date('2026-09-27T15:30:00');
const hoje = metricas.rangeBounds('today', '', '', AGORA);
if (hoje.start.getHours() === 0 && hoje.start.getMinutes() === 0 && hoje.end.getTime() === AGORA.getTime())
  ok('`today` comeca a meia-noite', 'e termina no `agora` que entrou');
else fail('`today`', JSON.stringify([hoje.start.toISOString(), hoje.end.toISOString()]));

const ontem = metricas.rangeBounds('yesterday', '', '', AGORA);
if (ontem.start.getDate() === 26 && ontem.start.getHours() === 0 && ontem.end.getHours() === 23 && ontem.end.getMinutes() === 59)
  ok('`yesterday` cobre o dia 26 inteiro', '00:00:00.000 ate 23:59:59.999');
else fail('`yesterday`', JSON.stringify([ontem.start.toISOString(), ontem.end.toISOString()]));

const mesPassado = metricas.rangeBounds('last_month', '', '', AGORA);
if (mesPassado.start.getMonth() === 7 && mesPassado.start.getDate() === 1 &&
    mesPassado.end.getMonth() === 7 && mesPassado.end.getDate() === 31)
  ok('`last_month` = o mes de AGOSTO inteiro', 'dia 0 do mes corrente e o ultimo do anterior');
else fail('`last_month`', JSON.stringify([mesPassado.start.toISOString(), mesPassado.end.toISOString()]));

/**
 * ================== O DIA é LOCAL — A PROVA AO CONTRARIO QUE PEGOU O DEFEITO ==================
 *
 * Aqui o Node roda em `America/Sao_Paulo` (UTC−3). O jeito ERRADO de ler o
 * campo é `new Date('2026-06-01')`, que a especificação lê como UTC: em UTC−3
 * ele vira 31/05 às 21:00, e `getDate()` devolve **31**. Se a bancada só
 * exigisse "o dia 1", um `new Date` cru passaria por acidente em fuso ZERO. A
 * primeira prova compara as duas leituras e exige a DIFERENÇA: é o que distingue
 * "o dia que a cliente clicou" de "o dia em Greenwich".
 */
const emUTC = new Date('2026-06-01');
const personalizado = metricas.rangeBounds('custom', '2026-06-01', '2026-06-30', AGORA);
if (emUTC.getDate() !== 1 && personalizado.start.getDate() === 1) {
  ok('`custom` abre a data em dia LOCAL', '`new Date` cru daria 31 aqui; a janela comeca no DIA 1');
} else {
  fail('`custom` le a data em UTC', `UTC=${emUTC.getDate()} janela=${personalizado.start.getDate()}`);
}

if (personalizado.start.getFullYear() === 2026 && personalizado.start.getMonth() === 5 &&
    personalizado.start.getDate() === 1 && personalizado.start.getHours() === 0 &&
    personalizado.end.getDate() === 30 && personalizado.end.getHours() === 23 &&
    personalizado.end.getMinutes() === 59 && personalizado.end.getSeconds() === 59)
  ok('`custom` cobre 01/06 a 30/06 do comeco ao fim', 'inicio a meia-noite e fim em 23:59:59.999 — o dia 30 inteiro');
else
  fail('`custom` com datas', JSON.stringify([personalizado.start.toISOString(), personalizado.end.toISOString()]));

/**
 * `custom` EM BRANCO. O campo nasce vazio; o comportamento do original e nao
 * mexer no `start`/`end` do `new Date()` corrente. Aqui a janela fica o dia de
 * `agora` — e NAO um `Date` invalido nem um lancamento.
 */
const vazio = metricas.rangeBounds('custom', '', '', AGORA);
if (!Number.isNaN(vazio.start.getTime()) && vazio.start.getHours() === 0 && vazio.end.getHours() === 23)
  ok('`custom` em branco cai no dia de `agora`', 'nao zera a tela nem lanca');
else fail('`custom` em branco', JSON.stringify([vazio.start.toISOString(), vazio.end.toISOString()]));

const cliente = (lastOrder, totalOrders = 1) => ({ name: 'x', email: 'x@x', totalOrders, totalSpent: 0, lastOrder, status: 'Ativo' });
const comDias = (n) => { const d = new Date(AGORA); d.setDate(d.getDate() - n); return d.toISOString(); };

const cortados = metricas.inactiveCustomers([cliente(comDias(91)), cliente(comDias(89)), cliente(comDias(90))], AGORA);
if (cortados.length === 1 && cortados[0].lastOrder === comDias(91))
  ok('inativo e `> 90` dias: 91 entra, 89 e 90 nao', 'o limite do rotulo, exato');
else fail('corte de inativos', String(cortados.length));

if (metricas.recurringCustomers([cliente(comDias(1), 2), cliente(comDias(1), 1)]).length === 1)
  ok('recorrente e `totalOrders > 1`', 'um pedido so nao e recorrente');
else fail('corte de recorrentes', 'invertido ou afrouxado');

const top = metricas.topCustomers([
  { name: 'a', email: 'a', totalOrders: 1, totalSpent: 50, lastOrder: comDias(1), status: 'Ativo' },
  { name: 'b', email: 'b', totalOrders: 1, totalSpent: 500, lastOrder: comDias(1), status: 'Ativo' },
]);
if (top[0].name === 'b')
  ok('`topCustomers` ordena por faturamento desc', 'o maior primeiro');
else fail('topCustomers', JSON.stringify(top.map((c) => c.name)));

if (metricas.filterByCategory(linhas, 'all').length === 10 &&
    metricas.filterByCategory(linhas, 'Tops').length === 3 &&
    metricas.filterByCategory(linhas, 'Sem categoria').length === 1 &&
    metricas.filterByCategory(linhas, 'Promoções').length === 0)
  ok('o filtro casa pelo TEXTO da coluna', '`Tops` = 3, `Promoções` = 0, `Sem categoria` = 1');
else fail('filtro de categoria', JSON.stringify([
  metricas.filterByCategory(linhas, 'Tops').length,
  metricas.filterByCategory(linhas, 'Sem categoria').length,
]));

/* ==================== 8. a tela, montada ==================== */

console.log('\n8. `RelatoriosView` — o que a tela desenha antes de qualquer clique');

const tela = render(RelatoriosView, {});
if (textos(tela).includes('Gerando relatório...'))
  ok('a tela abre em CARREGAMENTO', '`useEffect` nao roda no `renderToStaticMarkup` — o estado inicial e o unico observavel');
else fail('estado inicial da tela', textos(tela).slice(0, 200));

const exportacoes = atributoDe(tela, 'data-export');
if (exportacoes.length === 2 && exportacoes.every((v) => v === 'pendente'))
  ok('os DOIS botoes de exportacao marcados PENDENTES', '`CSV` e `PDF / Imprimir` — nenhum finge baixar arquivo');
else fail('botoes de exportacao', JSON.stringify(exportacoes));

if (textos(tela).includes('CSV') && textos(tela).includes('PDF / Imprimir'))
  ok('os dois rotulos do print', '`CSV` e `PDF / Imprimir`');
else fail('rotulos de exportacao', textos(tela));

const telaAbas = faixa(tela);
if (telaAbas.length === 3 && telaAbas[0].rotulo.includes('Produtos') && telaAbas[0].aceso &&
    telaAbas[1].rotulo.includes('Clientes') && telaAbas[2].rotulo.includes('Categorias'))
  ok('TRES abas, `Produtos` acesa', 'a quarta aba `Produtos (detalhado)` do placeholder nao existe');
else fail('abas da tela', JSON.stringify(telaAbas));

if (!textos(tela).includes('detalhado'))
  ok('nenhuma aba `detalhado` inventada', 'o bloco do placeholder nao sobreviveu');
else fail('aba inventada presente', '`detalhado` na tela');

const filtro = render(ReportFilter, {
  tab: 'products', onTabChange: () => {}, range: '30d', onRangeChange: () => {},
  customStart: '', customEnd: '', onCustomChange: () => {}, category: 'all', onCategoryChange: () => {},
});
const rotulos = atributoDe(filtro, 'aria-label');
/**
 * O React marca a opcao ativa com `selected=""`, entao a busca NAO pode ser pelo
 * texto exato da tag — foi assim que esta prova falhou na primeira rodada, por
 * um instrumento cego e nao por um defeito. A agulha para na `>`, e o `selected`
 * fica de fora.
 */
if (filtro.includes('<option value="30d"') && filtro.includes('>Últimos 30 dias</option>') &&
    filtro.includes('selected=""') &&
    filtro.includes('<option value="all"') && filtro.includes('>Todas as Categorias</option>'))
  ok('os dois `select` com as opcoes do print', 'periodo em `30d` (ativo) e categoria em `Todas as Categorias`');
else fail('opcoes dos selects', `${filtro.includes('selected=""')} · ${rotulos.join(', ')}`);

if (rotulos.includes('Período') && rotulos.includes('Categoria'))
  ok('os dois selects tem nome acessivel', '`aria-label` — le' + 'do do HTML cru, e nao do texto');
else fail('aria-label dos selects', JSON.stringify(rotulos));

const filtroClientes = render(ReportFilter, {
  tab: 'customers', onTabChange: () => {}, range: '30d', onRangeChange: () => {},
  customStart: '', customEnd: '', onCustomChange: () => {}, category: 'all', onCategoryChange: () => {},
});
if (rotulos.filter((r) => r === 'Categoria').length === 1 && !atributoDe(filtroClientes, 'aria-label').includes('Categoria'))
  ok('o filtro de CATEGORIA some fora da aba `Produtos`', 'as capturas de Clientes e Categorias nao o tem');
else fail('filtro de categoria por aba', JSON.stringify(atributoDe(filtroClientes, 'aria-label')));

/* ==================== 9. o codigo-fonte e a rota ==================== */

console.log('\n9. a rota `/admin/relatorios` — a correcao do `references` e o fim do placeholder');

const pagina = arquivo('src/app/admin/relatorios/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('RelatoriosView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', 'o placeholder foi substituido');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (pagina.includes('adm-063 a adm-066'))
  ok('a faixa CORRETA registrada: `adm-063 a adm-066`', 'dizia `adm-062 a adm-065` — errada pelas duas pontas');
else fail('faixa de prints', 'a correcao nao esta documentada');

/**
 * `adm-062` NAO PODE VOLTAR COMO REFERENCIA. A leitura e no codigo SEM
 * comentarios: o numero aparece tres vezes na PROSA que explica o defeito (`Dizia
 * adm-062 a adm-065…`, `O adm-062 é o último print…`), e um `replace` de uma
 * frase só — como na primeira rodada — tropeca na segunda mencao. O que uma
 * referencia de verdade tem é estar FORA do comentario.
 */
if (!/adm-062/.test(semComentarios(pagina)))
  ok('`adm-062` so existe na PROSA, nunca como referencia', 'a nona ocorrencia do defeito nao voltou');
else fail('`adm-062` reapareceu como referencia valida', 'ha `adm-062` fora de comentario na pagina');

if (!paginaLimpa.includes('Produtos (detalhado)') && !paginaLimpa.includes('structure'))
  ok('os blocos INVENTADOS sumiram', 'nem `structure`, nem a quarta aba');
else fail('blocos do placeholder', 'a lista inventada sobreviveu');

const tipos = arquivo('src/lib/relatorios/types.ts');
const abas = [...tipos.matchAll(/ReportTab =([^;]+);/g)][0];
const quantas = (abas ? abas[1] : '').split('|').length;
if (quantas === 3)
  ok('o tipo declara TRES abas', '`products | customers | categories` — e nao quatro');
else fail('tipo de aba', String(quantas));

const fonteDados = arquivo('src/lib/relatorios/data.ts');
if (!/prisma|pg\b|DATABASE_URL|process\.env/.test(fonteDados))
  ok('a camada de dados NAO toca banco', 'nenhum `prisma`, `pg` ou `DATABASE_URL` — Neon fora de escopo');
else fail('a camada de dados conecta banco', 'Neon nao pode estar conectado nesta fase');

/**
 * A agulha aceita a ANOTACAO DE TIPO no meio (`: ReportRange`). A primeira
 * versao exigia a linha exata sem anotacao e reprovava um arquivo correto — lista
 * fixa cega.
 */
if (/export const DEFAULT_RANGE(?::[^=]+)?=\s*'30d'/.test(fonteDados))
  ok('o periodo padrao e `30d`', 'a opcao ativa do print, num lugar so');
else fail('periodo padrao', 'nao esta em `data.ts`');

const fonteModulo = [
  arquivo('src/lib/relatorios/metrics.ts'),
  arquivo('src/lib/relatorios/data.ts'),
  arquivo('src/lib/relatorios/demo.ts'),
  arquivo('src/lib/relatorios/types.ts'),
  arquivo('src/components/admin/relatorios/report-cards.tsx'),
  arquivo('src/components/admin/relatorios/report-products.tsx'),
  arquivo('src/components/admin/relatorios/report-customer.tsx'),
  arquivo('src/components/admin/relatorios/report-category.tsx'),
  arquivo('src/components/admin/relatorios/relatorios-view.tsx'),
  pagina,
].join('\n');

if (!/recharts|ResponsiveContainer|BarChart/.test(semComentarios(fonteModulo)))
  ok('NENHUMA biblioteca de graficos no modulo', 'o projeto nao tem uma instalada — e o grafico do print esta ausente');
else fail('grafico importado', 'ha `recharts` no modulo');

if (!/@ts-ignore|@ts-expect-error/.test(fonteModulo))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', 'o typecheck nao foi silenciado');
else fail('supressao de tipo', 'ha um `@ts-ignore` no modulo');

/**
 * O RELOGIO NAO PODE SER LIDO DENTRO DAS METRICAS.
 *
 * `metrics.ts` tem que ser puro: se houver um `new Date()` sem argumento la, a
 * bancada passaria hoje e falharia amanha — e uma bancada que expira nao prova.
 * A busca e no codigo SEM comentarios, senao as proprias notas que explicam a
 * regra derrubariam a prova.
 */
const metricasLimpo = semComentarios(arquivo('src/lib/relatorios/metrics.ts'));
if (!/new Date\(\s*\)/.test(metricasLimpo))
  ok('`metrics.ts` nao le o relogio', 'todo corte recebe `now: Date` de fora');
else fail('`new Date()` dentro de `metrics.ts`', 'a bancada passaria hoje e falharia amanha');

if (/new Date\(\s*\)/.test(arquivo('src/components/admin/relatorios/relatorios-view.tsx')))
  ok('a TELA le o relogio — uma vez, na carga', 'e o instante vai junto com os dados');
else fail('a tela nao captura `agora`', 'o corte de inativos usaria um instante arbitrario');

/* ==================== 10. provas ao contrario ==================== */

console.log('\n10. provas ao contrario — o defeito tem que REPROVAR');

/** `semComentarios` tem que apagar comentario e preservar codigo. */
if (!semComentarios('/* adm-062 */ const x = 1;').includes('adm-062') &&
    semComentarios('/* adm-062 */ const x = 1;').includes('const x = 1'))
  ok('`semComentarios` apaga comentario e guarda o codigo', 'a citacao de `adm-062` nao conta como referencia');
else fail('`semComentarios`', 'ou comento codigo, ou deixou passar o comentario');

/** `textos` apaga ATRIBUTO — e por isso `atributoDe` existe. */
if (!textos('<div aria-label="Período"></div>').includes('Período') &&
    atributoDe('<div aria-label="Período"></div>', 'aria-label')[0] === 'Período')
  ok('`textos` nao ve atributo e `atributoDe` ve', 'as provas de `aria-label` nao podem usar `textos`');
else fail('instrumento de atributo', 'ou `textos` viu o atributo, ou `atributoDe` falhou');

/** NBSP. */
if (normalizar('R$ 0,00') === 'R$ 0,00')
  ok('`normalizar` converte o espaco inquebravel do `pt-BR`', 'senao `R$ 0,00` nunca casaria');
else fail('normalizar NBSP', JSON.stringify(normalizar('R$ 0,00')));

/** `contar` nao para na primeira. */
if (contar('x x x', 'x') === 3 && contar('abc', 'zzz') === 0)
  ok('`contar` conta TODAS e devolve 0 para ausente', 'um `includes` nao distinguiria 2 de 3');
else fail('`contar`', String(contar('x x x', 'x')));

/**
 * O SHARE. `shareOf(0, 0)` tem que ser `0` e nao `NaN` — com `NaN`, o
 * `NaN.toFixed(1)` imprimiria `NaN%` na tela e a barra ficaria com largura
 * invalida. E o defeito do original, que a bancada pega com a loja sem receita.
 */
if (metricas.shareOf(0, 0) === 0 && !Number.isNaN(metricas.shareOf(0, 0)))
  ok('`shareOf(0, 0)` e `0`, nao `NaN`', 'a loja do print nao tem receita — `NaN%` iria para a tela');
else fail('`shareOf(0, 0)`', String(metricas.shareOf(0, 0)));

/** E com receita de verdade, o share distribui. */
const comReceita = metricas.categoryShareRows([
  { name: 'A', qty: 10, revenue: 75 },
  { name: 'B', qty: 5, revenue: 25 },
]);
if (comReceita[0].name === 'A' && Math.abs(comReceita[0].share - 75) < 1e-9 &&
    Math.abs(comReceita[0].share + comReceita[1].share - 100) < 1e-9)
  ok('com receita, o share fecha em 100 e ordena desc', '75 / 25 — a barra e o numero saem do mesmo valor');
else fail('share com receita', JSON.stringify(comReceita));

if (Math.abs(metricas.shareOf(1, 3) - 33.3333) < 0.001 && metricas.shareOf(1, 3).toFixed(1) === '33.3')
  ok('`toFixed(1)` do share', 'a precisao que o print mostra');
else fail('`toFixed(1)`', metricas.shareOf(1, 3).toFixed(1));

/**
 * O CORTE DE ESTOQUE COM UMA LISTA SEMEADA. A demonstracao tem DUAS linhas em
 * `<= 5`; aqui entram cinco, das quais so tres devem passar — e exatamente no
 * limite (`5` passa, `6` nao), que e o defeito de um caractere.
 */
const semeada = [1, 5, 6, 0, 40].map((stock, i) => ({
  id: `a-${i}`, name: `p${stock}`, category: 'x', stock, qtySold: 0, revenue: 0, views: 0, favorites: 0,
}));
if (mesmo(metricas.lowStockRows(semeada).map((r) => r.stock), [0, 1, 5]))
  ok('corte semeado: `<= 5`, e ordenado crescente', '0 · 1 · 5 — e o `6` fica de fora');
else fail('corte semeado', JSON.stringify(metricas.lowStockRows(semeada).map((r) => r.stock)));

/** O topo, com uma lista semeada — a ORDEM tem que reagir, nao so copiar. */
const semeadaViews = [
  { id: 'v1', name: 'menos', category: 'x', stock: 0, qtySold: 0, revenue: 0, views: 1, favorites: 0 },
  { id: 'v2', name: 'mais', category: 'x', stock: 0, qtySold: 0, revenue: 0, views: 99, favorites: 0 },
];
if (metricas.topBy(semeadaViews, 'views')[0].name === 'mais')
  ok('`topBy` realmente ordena', 'o `99` sobe sobre o `1` — nao e so uma copia da entrada');
else fail('`topBy` nao ordenou', JSON.stringify(metricas.topBy(semeadaViews, 'views').map((r) => r.name)));

/** `topBy` NAO muta a lista recebida — o defeito que embaralharia a tabela. */
const antesDoTop = linhas.map((r) => r.name);
metricas.topBy(linhas, 'views');
metricas.lowStockRows(linhas);
if (mesmo(linhas.map((r) => r.name), antesDoTop))
  ok('as metricas NAO mutam a lista de entrada', 'senao a tabela `Todos os Produtos` seria reordenada pelos cartoes');
else fail('a lista foi mutada', '`sort` sem copia');

/**
 * A NUMERACAO VEM DA POSICAO, E NAO DO DADO.
 *
 * `vistos` tem `Jaqueta Corta Vento Fit` em primeiro (a unica com `views = 1`).
 * Invertida, quem ocupa a posicao 1 e o ULTIMO da ordenacao — o `top`, o item de
 * `Sem categoria`. Exigir `1. top` prova que o numero e desenhado pela POSICAO no
 * laco; se a tela numerasse a partir do valor (`views`), o `top` sairia como
 * `0.` e a prova cairia.
 */
const cardInvertido = render(ReportRankCard, { title: 't', items: [...vistos].reverse(), metric: (r) => r.views });
if (textos(cardInvertido).includes('1. top') && textos(cardInvertido).includes('10. Jaqueta Corta Vento Fit'))
  ok('a numeracao vem da POSICAO, nao do dado', 'invertendo a lista, o `1.` vai para o `top` e a `Jaqueta` para o `10.`');
else fail('numeracao presa ao dado', textos(cardInvertido).slice(0, 120));

/* ---------------------------------------------------------------- resumo */

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
