/**
 * Bancada do modulo Estoque.
 *
 * O ambiente onde o projeto foi escrito NAO roda `next dev` nem `next build`
 * (sem rede, o `next/font/google` espera as fontes para sempre). Sem esta
 * bancada, a unica garantia seria o typecheck — que nao renderiza, nao conta e
 * nao ve o ramo invertido.
 *
 * O que ela prova, em ordem:
 *   1. os .ts/.tsx do modulo EMITEM sem erro (compilador do proprio projeto);
 *   2. os `@/` resolvem em tempo de execucao;
 *   3. o estoque NAO e um segundo cadastro de produtos — o numero de cada linha
 *      bate com `lib/produtos` e com o print;
 *   4. a ORDEM das linhas e a do print adm-028/029 — e nao a de Produtos nem a
 *      alfabetica (esta assercao existe porque as TRES sao diferentes);
 *   5. as cinco colunas da tabela e as oito do historico, na ordem do print;
 *   6. os quatro KPIs batem com o print e sao DERIVADOS das linhas;
 *   7. o corte de esgotado e zero, e nao 1 (`Kit Nike` tem 1 e NAO e esgotado);
 *   8. os `±1` do historico nao viraram `+1`;
 *   9. a divergencia `Conjunto Glow Nude` continua DECLARADA (a assercao falha
 *      se ela sumir, se virar produto, ou se aparecer uma segunda);
 *  10. o ajuste muda a tabela E grava no historico, e nao finge persistir;
 *  11. a tela carrega e renderiza o esqueleto.
 *
 * O que ela NAO prova: layout, cor, posicao e responsividade. Isso e navegador.
 */

import { createRequire } from 'node:module';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// `resolve` no argumento: `createRequire` exige caminho absoluto, e `.` (que e
// como a bancada e chamada) nao serve.
const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-estoque.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-estoque');

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

/**
 * Igualdade profunda, para comparar estruturas de linha.
 *
 * O `assert.deepStrictEqual` do Node serve, mas ele LANCA e derruba a bancada
 * inteira no primeiro caso — e uma bancada que para no primeiro problema esconde
 * os outros. Esta versao so devolve booleano, para a prova poder falhar sozinha.
 */
function mesmo(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);

/*
 * Limpa o diretorio de saida antes de compilar.
 *
 * Sem isto, um `.js` de uma rodada anterior continuaria la e a bancada poderia
 * carregar codigo que NAO existe mais nos `.ts` — o pior tipo de prova falsa,
 * porque ela mede o passado e a tela mostra o presente. Os nomes de arquivo
 * coincidem, entao a troca passa despercebida.
 */
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
 * Raizes da COMPILACAO: so o modulo Estoque.
 *
 * O compilador segue os `import` sozinho, entao `ui/*`, `lib/utils` e
 * `lib/produtos/*` entram no programa por conta propria. As outras ~30 paginas
 * do painel NAO entram — compilar todas elas estoura o limite de ~178 s do
 * `bash` do ambiente (ver `bancadas/LEIA-ME.md`).
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]estoque|components[\\/]admin[\\/]estoque|app[\\/]admin[\\/]estoque)[\\/]/.test(f),
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

const dados = require(join(OUT, 'src/lib/estoque/data.js'));
const demo = require(join(OUT, 'src/lib/estoque/demo.js'));
const metricas = require(join(OUT, 'src/lib/estoque/metrics.js'));
const produtosDemo = require(join(OUT, 'src/lib/produtos/demo.js'));
const produtosMetricas = require(join(OUT, 'src/lib/produtos/metrics.js'));
const { StockTable } = require(join(OUT, 'src/components/admin/estoque/stock-table.js'));
const { MovementHistory, formatDate, formatTime } = require(join(OUT, 'src/components/admin/estoque/movement-history.js'));
const { StockStatsGrid } = require(join(OUT, 'src/components/admin/estoque/stock-stats.js'));
const { StockView } = require(join(OUT, 'src/components/admin/estoque/stock-view.js'));

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o
 * `toLocaleString('pt-BR')` usa espaco inquebravel e o `\s` do JS nao o pega.
 */
const normalizar = (s) => s.replace(/[\s  ]+/g, ' ').trim();
function textos(html) {
  return normalizar(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&middot;/g, '·'),
  );
}

const render = (Componente, props) => renderToStaticMarkup(react.createElement(Componente, props));

/* ================================================================== 1 */

console.log('\n1. O estoque NAO e um segundo cadastro de produtos\n');

const linhas = await dados.listStockRows();
if (linhas.source === 'demo') ok('a leitura se declara demonstrativa', 'source = demo');
else fail('origem da leitura', `veio ${linhas.source}`);

if (linhas.data.length === 10) ok('dez linhas de estoque', 'igual ao print adm-028');
else fail('numero de linhas', `${linhas.data.length}, esperava 10`);

// O TOTAL impresso, por produto — transcrito do print. E a assercao que pega
// qualquer numero inventado ou trocado na projecao.
const TOTAIS_DO_PRINT = {
  'Top Essential Sustentação': 35,
  'Conjunto Glow Nude': 20,
  'Kit Nike': 1,
  'Legging Modeladora Premium': 40,
  'Short Fitness Energy': 30,
  'Cropped Urban Fit': 28,
  'Jaqueta Corta Vento Fit': 22,
  'Macaquinho costas nuas': 18,
  Macaquinho: 5,
  top: 8,
};

const divergentes = [];
for (const linha of linhas.data) {
  const esperado = TOTAIS_DO_PRINT[linha.name];
  if (esperado === undefined) divergentes.push(`${linha.name} nao esta no print`);
  else if (linha.total !== esperado) divergentes.push(`${linha.name}=${linha.total} (print: ${esperado})`);
}
if (divergentes.length === 0) ok('os dez totais batem com o print', '35 20 1 40 30 28 22 18 5 8');
else fail('total divergente do print', divergentes.slice(0, 5).join(' | '));

/**
 * A PONTE: o numero tem que ser o MESMO que `lib/produtos` guarda.
 *
 * Esta e a prova de que o Estoque nao mantem uma copia propria. Se alguem
 * "consertar" um total so aqui para o print bater, esta assercao quebra — que e
 * exatamente o que se quer.
 */
const produtos = produtosDemo.DEMO_PRODUCTS_PRODUTOS;
const semProduto = [];
for (const produto of produtos) {
  const linha = linhas.data.find((l) => l.productId === produto.id);
  if (!linha) { semProduto.push(`${produto.name} fora da tabela`); continue; }
  // A excecao e declarada: `top` e `Macaquinho` tem a cor sobreposta do print.
  const sobreposto = demo.DEMO_STOCK_OVERRIDES.some((o) => o.productId === produto.id);
  if (sobreposto) continue;
  const doProdutos = produtosMetricas.totalStock(produto);
  if (linha.total !== doProdutos) semProduto.push(`${produto.name}: estoque ${linha.total}, produtos ${doProdutos}`);
}
if (semProduto.length === 0) ok('todo produto de Produtos aparece, com o MESMO numero', `${produtos.length} produtos`);
else fail('divergencia Produtos x Estoque nao declarada', semProduto.slice(0, 4).join(' | '));

// As sobreposicoes nao podem ser muitas: e uma lista curta e declarada.
if (demo.DEMO_STOCK_OVERRIDES.length === 3) ok('tres sobreposicoes, todas declaradas', 'Glow Nude + Macaquinho + top');
else fail('numero de sobreposicoes', `${demo.DEMO_STOCK_OVERRIDES.length}`);

/* ================================================================== 2 */

console.log('\n2. A ordem das linhas e a do print (e nao a de Produtos)\n');

const ORDEM_DO_PRINT = [
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
const nomes = linhas.data.map((l) => l.name);
if (mesmo(nomes, ORDEM_DO_PRINT)) ok('linhas na ordem do print', nomes.slice(0, 3).join(' > ') + ' > ...');
else fail('ordem das linhas', nomes.join(', '));

// A ordem NAO pode vir da ordem de insercao: invertida, tem que sair igual.
const invertidas = metricas.orderForStock([...linhas.data].reverse()).map((l) => l.name);
if (mesmo(invertidas, ORDEM_DO_PRINT)) ok('ordena mesmo invertido', 'a ordem e a lista, nao a insercao');
else fail('ordem depende da insercao', invertidas.slice(0, 4).join(', '));

// E as duas ordens dos prints originais continuam intactas: a bancada pode
// reordenar a lista DELA sem mexer no que as outras telas leem.
if (mesmo(produtosDemo.DEMO_PRODUCTS_PRODUTOS.map((p) => p.name), [
  'top', 'Macaquinho', 'Kit Nike', 'Legging Modeladora Premium', 'Short Fitness Energy',
  'Top Essential Sustentação', 'Jaqueta Corta Vento Fit', 'Macaquinho costas nuas', 'Cropped Urban Fit',
])) ok('a ordem de `lib/produtos` NÃO foi mexida', 'o Estoque ordena, nao reordena a origem');
else fail('a ordem de Produtos mudou', produtosDemo.DEMO_PRODUCTS_PRODUTOS.map((p) => p.name).join(', '));

/**
 * AS OUTRAS DUAS ORDENS, calculadas aqui para a assercao ser explicita.
 *
 * Esta e a armadilha central desta tela: a ordem do print NAO e a de
 * `lib/produtos` (que comeca por `top`) e NAO e a alfabetica (que comeca por
 * `Conjunto`). Se a tela reusasse qualquer uma das duas — que e o caminho
 * natural, e foi o que Tamanhos fez de proposito — a tabela ficaria com `top` em
 * primeiro e ninguem perceberia, porque nao ha erro de tipo nenhum.
 */
const ordemProdutos = produtos.map((p) => p.name);
const ordemAlfabetica = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
if (!mesmo(nomes, ordemProdutos)) ok('NAO e a ordem de Produtos', 'Produtos comecaria por "top"');
else fail('a ordem veio de Produtos', nomes[0]);
if (!mesmo(nomes, ordemAlfabetica)) ok('NAO e a ordem alfabetica', `alfabetica comecaria por "${ordemAlfabetica[0]}"`);
else fail('a ordem veio do sort alfabetico', nomes[0]);

// Um produto NOVO (que o print nao tinha como mostrar) nao pode sumir.
const comNovo = metricas.orderForStock([
  ...linhas.data,
  { productId: 'p-novo', name: 'AAA Produto Novo', total: 3, status: 'baixo', variations: [] },
]);
if (comNovo.length === 11 && comNovo[comNovo.length - 1].name === 'AAA Produto Novo')
  ok('produto fora do print vai para o FIM, em vez de sumir', 'alfabetica, depois da lista');
else fail('produto novo mal posicionado', comNovo.map((l) => l.name).join(', '));

/* ================================================================== 3 */

console.log('\n3. KPIs derivados das linhas — nao digitados\n');

const historico = await dados.listStockMovements();
const kpis = metricas.summarizeStock(linhas.data, historico.data);
if (kpis.totalProducts === 10) ok('TOTAL PRODUTOS = 10', 'igual ao print');
else fail('TOTAL PRODUTOS', `${kpis.totalProducts}`);
if (kpis.lowStock === 2) ok('BAIXO ESTOQUE = 2', 'Kit Nike (1) e Macaquinho (5)');
else fail('BAIXO ESTOQUE', `${kpis.lowStock}`);
if (kpis.outOfStock === 0) ok('ESGOTADOS = 0', 'nenhum produto em zero');
else fail('ESGOTADOS', `${kpis.outOfStock}`);
if (kpis.movements === 2) ok('MOVIMENTAÇÕES = 2', 'as duas linhas do historico');
else fail('MOVIMENTAÇÕES', `${kpis.movements}`);

/**
 * O CORTE DE ESGOTADO E ZERO, E NAO 1.
 *
 * `Kit Nike` tem 1 unidade. No print ele aparece em VERMELHO na tabela — mas o
 * KPI `ESGOTADOS` e `0`. Ou seja: 1 unidade e "baixo", nao "esgotado". Se o teste
 * de esgotado viesse antes do de baixo estoque, ou se o corte fosse `<= 1`, o KPI
 * diria 1 e o print diz 0 — e a diferenca seria de UMA linha de codigo.
 */
if (metricas.stockStatus(1) === 'baixo') ok('1 unidade e BAIXO, nao esgotado', 'o print: Kit Nike 1 e ESGOTADOS 0');
else fail('corte de esgotado errado', `1 unidade => ${metricas.stockStatus(1)}`);
if (metricas.stockStatus(0) === 'esgotado') ok('0 unidade e ESGOTADO', '');
else fail('zero nao e esgotado', `${metricas.stockStatus(0)}`);
if (metricas.stockStatus(5) === 'baixo') ok('5 unidades e BAIXO', 'o corte de Produtos, reusado');
else fail('corte de 5', `${metricas.stockStatus(5)}`);
if (metricas.stockStatus(6) === 'normal') ok('6 unidades e NORMAL', '');
else fail('corte entre 5 e 6', `${metricas.stockStatus(6)}`);

// Os KPIs tem que MUDAR quando as linhas mudam: se nao mudarem, sao constantes
// disfarcadas e nao contam nada.
const kpisZero = metricas.summarizeStock([], []);
if (kpisZero.totalProducts === 0 && kpisZero.lowStock === 0 && kpisZero.outOfStock === 0)
  ok('sem linhas, os tres primeiros KPIs zeram', 'entao eles contam de verdade');
else fail('KPIs nao acompanham as linhas', JSON.stringify(kpisZero));

/* ================================================================== 4 */

console.log('\n4. As variacoes de cor do print (adm-029)\n');

const porNome = new Map(linhas.data.map((l) => [l.name, l]));
const top = porNome.get('top');
const macaquinho = porNome.get('Macaquinho');
const semCor = linhas.data.filter((l) => l.variations.length === 0).length;

if (top && top.variations.length === 2) ok('`top` tem DUAS cores', top.variations.map((v) => `${v.name} ${v.quantity}`).join(' + '));
else fail('cores de `top`', top ? `${top.variations.length}` : 'linha ausente');
if (top && top.variations.map((v) => `${v.name}:${v.quantity}`).join('|') === 'PRETO:5|ROSA:3')
  ok('`top` = PRETO 5 e ROSA 3, na ordem do print', '');
else fail('valores das cores de `top`', top ? top.variations.map((v) => `${v.name}:${v.quantity}`).join('|') : '');
if (macaquinho && macaquinho.variations.length === 1 && macaquinho.variations[0].name === 'ROSA' && macaquinho.variations[0].quantity === 5)
  ok('`Macaquinho` = ROSA 5', '');
else fail('cores de `Macaquinho`', macaquinho ? JSON.stringify(macaquinho.variations) : 'linha ausente');
if (semCor === 8) ok('as outras OITO linhas dizem "Sem variacoes"', '');
else fail('linhas sem variacao', `${semCor}, esperava 8`);

// A soma das cores tem que fechar o total — senao a linha se contradiz.
if (top && top.variations.reduce((s, v) => s + v.quantity, 0) === top.total)
  ok('a soma das cores de `top` fecha o total', '5 + 3 = 8');
else fail('soma das cores != total', top ? `${top.variations.reduce((s, v) => s + v.quantity, 0)} vs ${top.total}` : '');

// O ponto colorido do print e NEUTRO: nao pode ter hex inventado.
const comHex = linhas.data.flatMap((l) => l.variations).filter((v) => v.hex !== null);
if (comHex.length === 0) ok('nenhum hex inventado para o ponto', 'o print desenha o ponto neutro');
else fail('hex inventado nas variacoes', comHex.map((v) => `${v.name}=${v.hex}`).join(', '));

/* ================================================================== 5 */

console.log('\n5. A divergencia `Conjunto Glow Nude` continua DECLARADA\n');

/**
 * ESTA ASSERCAO EXISTE PARA A DIVERGENCIA NAO SER "RESOLVIDA" EM SILENCIO.
 *
 * `Conjunto Glow Nude` aparece em adm-029 (Estoque), adm-034 (Tamanhos) e nao
 * aparece em adm-025 (Produtos, nove pecas) nem em `lib/produtos/demo.ts`. Tres
 * referencias contra uma.
 *
 * A bancada falha se: a divergencia sumir (alguem apagou a linha para os dois
 * lados coincidirem), ou ela virar produto (alguem "consertou" criando em
 * `lib/produtos`), ou aparecer uma SEGUNDA linha ausente — que seria outro
 * problema, e nao este.
 */
const AUSENTE_CONHECIDO = 'Conjunto Glow Nude';
const idsDeProdutos = new Set(produtos.map((p) => p.id));
const sobrepostas = linhas.data.filter((l) => !idsDeProdutos.has(l.productId));

if (sobrepostas.length === 1 && sobrepostas[0].name === AUSENTE_CONHECIDO)
  ok('uma unica linha sem produto de origem, e e ela', `${AUSENTE_CONHECIDO} (20)`);
else fail('divergencia mudou de forma', `${sobrepostas.length} linha(s): ${sobrepostas.map((l) => l.name).join(', ')}`);

if (linhas.data.some((l) => l.name === AUSENTE_CONHECIDO)) ok('a linha continua na tabela', 'nao foi removida para coincidir');
else fail('a linha sumiu da tabela', 'a divergencia foi "resolvida" apagando um lado');

if (!produtos.some((p) => p.name === AUSENTE_CONHECIDO))
  ok('e NAO foi criada em `lib/produtos`', 'Produtos segue com nove pecas');
else fail('`Conjunto Glow Nude` virou produto', 'a divergencia foi "resolvida" inventando o dado');

/* ================================================================== 6 */

console.log('\n6. O historico: as colunas e os glifos do print\n');

if (historico.data.length === 2) ok('duas linhas de historico', 'identicas, como no print');
else fail('linhas de historico', `${historico.data.length}`);

const primeira = historico.data[0];
/**
 * O `±` E O PONTO. Li o glifo pixel a pixel no adm-029: e um `+` com um `-`
 * embaixo (`±`), e nao um `+`. Ele e o unico sinal coerente com o tipo `Ajuste`,
 * que define a quantidade em vez de somar. Se alguem "arrumar" para `+1`, esta
 * assercao quebra — foi por isso que ela existe.
 */
if (primeira.delta.sign === 'adjust') ok('o glifo da coluna QTDE e o de ajuste', '`±`, e nao `+`');
else fail('glifo da QTDE', primeira.delta.sign);
if (metricas.formatDelta(primeira.delta) === '±1') ok('a coluna QTDE imprime `±1`', '');
else fail('texto da coluna QTDE', metricas.formatDelta(primeira.delta));
if (primeira.delta.magnitude === 1) ok('magnitude 1', '');
else fail('magnitude', `${primeira.delta.magnitude}`);
// `sign` e `up`/`down` tambem precisam saber formatar, para quando existir uma
// movimentacao com direcao.
if (metricas.formatDelta({ sign: 'up', magnitude: 3 }) === '+3' && metricas.formatDelta({ sign: 'down', magnitude: 3 }) === '−3')
  ok('os outros dois glifos tambem formatam', '+3 e −3 (com o menos tipografico)');
else fail('formatacao de `up`/`down`', '');

if (primeira.colorName === null && primeira.sizeLabel === null)
  ok('COR e TAM. saem `—`', 'o ajuste foi no estoque geral');
else fail('COR/TAM. preenchidos', `${primeira.colorName} / ${primeira.sizeLabel}`);
if (primeira.type === 'ajuste' && metricas.movementLabel(primeira.type) === 'Ajuste')
  ok('TIPO = `Ajuste`', 'o rotulo do print');
else fail('TIPO', primeira.type);
if (primeira.responsible === 'lp070087@gmail.com') ok('RESPONSÁVEL = o e-mail do admin', 'igual ao print');
else fail('RESPONSÁVEL', primeira.responsible);
if (formatDate(primeira.at) === '12/06/2026' && formatTime(primeira.at) === '02:33')
  ok('DATA e HORA separadas no formato do print', '12/06/2026 · 02:33');
else fail('data/hora', `${formatDate(primeira.at)} ${formatTime(primeira.at)}`);

// A data com DIA 1 nao pode virar `1/6/2026`: o formato nao pode depender do ICU.
if (formatDate('2026-06-01T02:33:00') === '01/06/2026') ok('dia 1 sai com dois digitos', '01/06/2026');
else fail('dia de um digito', formatDate('2026-06-01T02:33:00'));

const movimentos = metricas.MOVEMENT_LABELS.map((m) => m.label);
const CHIPS = ['Entrada', 'Saída', 'Venda', 'Reposição', 'Devolução', 'Ajuste'];
if (JSON.stringify(movimentos) === JSON.stringify(CHIPS)) ok('os seis chips, na ordem do print', movimentos.join(' · '));
else fail('chips do filtro', movimentos.join(', '));

/* ================================================================== 7 */

console.log('\n7. O ajuste muda a tabela E registra no historico\n');

const alvo = produtos.find((p) => p.id === 'p-03'); // Kit Nike, 1 unidade
const ajustado = metricas.applyAdjustment(alvo, {
  productId: 'p-03',
  colorId: null,
  quantity: 12,
  type: 'ajuste',
  note: '',
});
if (ajustado.stock === 12) ok('o ajuste DEFINE a quantidade', 'Kit Nike: 1 -> 12');
else fail('estoque apos ajuste', `${ajustado.stock}`);
if (alvo.stock === 1) ok('nao muta o produto original', 'devolve novo, como o estado do React precisa');
else fail('mutou o produto de entrada', `${alvo.stock}`);

// Ajuste de UMA cor nao pode apagar as outras.
const topProduto = {
  ...alvo,
  id: 'p-01',
  stock: 8,
  colors: [
    { id: 'c-preto', name: 'PRETO', hex: '', images: [], stock: 5 },
    { id: 'c-rosa', name: 'ROSA', hex: '', images: [], stock: 3 },
  ],
};
const ajustadoCor = metricas.applyAdjustment(topProduto, {
  productId: 'p-01',
  colorId: 'c-rosa',
  quantity: 10,
  type: 'ajuste',
  note: '',
});
if (ajustadoCor.colors.find((c) => c.id === 'c-preto').stock === 5)
  ok('ajustar uma cor NAO mexe na outra', 'ROSA 3 -> 10, PRETO segue 5');
else fail('o ajuste apagou a outra cor', JSON.stringify(ajustadoCor.colors.map((c) => [c.id, c.stock])));
if (ajustadoCor.stock === 15) ok('o total passa a ser a soma das cores', '5 + 10 = 15');
else fail('total apos ajuste de cor', `${ajustadoCor.stock}`);

const lancamento = metricas.buildMovement(
  { productId: 'p-03', colorId: null, quantity: 12, type: 'ajuste', note: '' },
  { id: 'x', at: '2026-09-29T10:00:00', productName: 'Kit Nike', colorName: null, responsible: 'a@b.c' },
);
if (lancamento.delta.sign === 'adjust' && lancamento.sizeLabel === null)
  ok('o lancamento nasce com `±` e TAM. `—`', 'nao ha nivel de tamanho no estoque');
else fail('lancamento malformado', JSON.stringify(lancamento.delta));

const gravado = await dados.saveStockAdjustment(
  { productId: 'p-03', colorId: null, quantity: 12, type: 'ajuste', note: '' },
  { id: 'x', at: '2026-09-29T10:00:00', productName: 'Kit Nike', colorName: null, responsible: 'a@b.c' },
);
if (gravado.persisted === false && typeof gravado.reason === 'string' && gravado.reason.length > 0)
  ok('a gravacao NAO finge persistir', '`persisted: false` com motivo');
else fail('gravacao falsa ou sem motivo', JSON.stringify(gravado));

// Os dois motivos declarados da fase: nada de CRUD inventado, nada de segundo
// cadastro. Se alguem criar uma escrita de PRODUTO aqui, isto quebra.
const exportados = Object.keys(dados).sort();
const proibidos = ['createProduct', 'updateProduct', 'deleteProduct', 'createStockRow'];
const intrusos = exportados.filter((nome) => proibidos.includes(nome));
if (intrusos.length === 0) ok('Estoque nao exporta escrita de produto', `dados.ts exporta: ${exportados.length} simbolos`);
else fail('Estoque virou CRUD de produto', intrusos.join(', '));

/* ================================================================== 8 */

console.log('\n8. Os blocos renderizam, com o texto do print\n');

const tabela = textos(render(StockTable, { rows: linhas.data, onAdjust: () => {}, hasFilter: false }));
for (const coluna of ['Produto', 'SKU', 'Variações (cor/tam)', 'Estoque total', 'Ações']) {
  if (tabela.includes(coluna)) ok(`coluna "${coluna}"`, '');
  else fail(`coluna ausente: ${coluna}`, '');
}
if (tabela.includes('Sem variações')) ok('o estado "Sem variações" renderiza', 'italico cinza no print');
else fail('sem o texto "Sem variações"', '');
if (tabela.includes('Ajuste Geral')) ok('a acao `Ajuste Geral` renderiza', `${linhas.data.length} vezes`);
else fail('acao ausente', '');
if (tabela.includes('—')) ok('o `—` do SKU renderiza', 'todas as linhas do print');
else fail('sem o `—`', '');

const tabelaVazia = textos(render(StockTable, { rows: [], onAdjust: () => {}, hasFilter: true }));
if (tabelaVazia.includes('Nenhum produto encontrado para a busca.')) ok('a tabela tem estado vazio de busca', '');
else fail('estado vazio da tabela', '');

const kpiTexto = textos(render(StockStatsGrid, { stats: kpis }));
for (const rotulo of ['Total de produtos', 'Baixo estoque', 'Esgotados', 'Movimentações']) {
  if (kpiTexto.includes(rotulo)) ok(`KPI "${rotulo}"`, '');
  else fail(`KPI ausente: ${rotulo}`, '');
}
if (kpiTexto.includes('10') && kpiTexto.includes('2') && kpiTexto.includes('0')) ok('os KPIs mostram 10 / 2 / 0', 'igual ao print');
else fail('valores dos KPIs', kpiTexto.slice(0, 160));

const hist = textos(render(MovementHistory, { movements: historico.data, filter: 'todas', onFilterChange: () => {} }));
if (hist.includes('Histórico de Movimentações')) ok('o bloco tem o titulo do print', '');
else fail('titulo do historico', hist.slice(0, 120));
for (const coluna of ['Data', 'Hora', 'Produto', 'Cor', 'Tam.', 'Qtde', 'Tipo', 'Responsável']) {
  if (hist.includes(coluna)) ok(`coluna "${coluna}"`, '');
  else fail(`coluna ausente: ${coluna}`, '');
}
for (const chip of ['Todas', ...CHIPS]) {
  if (hist.includes(chip)) ok(`chip "${chip}"`, '');
  else fail(`chip ausente: ${chip}`, '');
}
if (hist.includes('±1')) ok('a coluna QTDE mostra `±1`', 'o glifo do print');
else fail('QTDE sem o `±`', '');
if (hist.includes('12/06/2026') && hist.includes('02:33')) ok('data e hora do print', '');
else fail('data/hora nao renderizaram', '');

// Filtro: `Todas` nao e um tipo — e a ausencia de filtro. Provar os DOIS ramos.
if (metricas.filterMovements(historico.data, 'todas').length === 2) ok('`Todas` devolve tudo', '');
else fail('filtro `todas`', '');
if (metricas.filterMovements(historico.data, 'venda').length === 0) ok('filtrar por `Venda` esvazia', 'nao ha venda registrada');
else fail('filtro `venda`', '');

/* ================================================================== 9 */

console.log('\n9. A tela e o modulo carregam\n');

let primeiroQuadro = '';
try {
  primeiroQuadro = render(StockView, {});
  if (primeiroQuadro.includes('skeleton')) ok('a tela renderiza o quadro de carregamento', 'StatsSkeleton + TableSkeleton antes dos dados');
  else fail('primeiro quadro inesperado', primeiroQuadro.slice(0, 140));
} catch (erro) {
  fail('a tela explodiu ao renderizar', String(erro).slice(0, 160));
}

// A rota existe e aponta para a tela — sem isso o menu levaria a lugar nenhum.
const { readFileSync } = require('node:fs');
const pagina = readFileSync(join(SRC, 'app/admin/estoque/page.tsx'), 'utf8');
if (pagina.includes('StockView')) ok('a rota /admin/estoque renderiza a tela', '');
else fail('a rota nao usa a tela', '');
if (pagina.includes('adm-028') && pagina.includes('adm-029')) ok('a rota cita os prints certos', 'adm-028 e adm-029');
else fail('referencia de print errada na rota', '');

/*
 * A REFERENCIA ERRADA SUMIU — e a agulha e a PROP, nao a string solta.
 *
 * O placeholder antigo citava `adm-041 a adm-043` (que sao Avatar Virtual e
 * Provador Virtual) numa prop `references`. A pagina nova ainda escreve
 * "adm-041" — de proposito, no comentario que REGISTRA a correcao. Uma busca
 * solta por `adm-041` acusaria a correcao como se fosse o defeito, que foi
 * exatamente o que aconteceu na primeira rodada desta bancada.
 *
 * Entao a assercao procura a prop. E, para nao virar uma prova que passa por
 * omissao (se a prop se chamasse outra coisa, ela passaria sem checar nada),
 * exige junto que o comentario de correcao exista: as duas metades juntas dizem
 * "a referencia errada foi usada e foi corrigida", e nao "nao achei".
 */
if (!/references\s*=\s*["']adm-041/.test(pagina)) ok('a rota NAO usa mais a referencia errada', 'a prop `references="adm-041..."` sumiu');
else fail('a referencia errada continua como prop', 'adm-041');

if (pagina.includes('adm-041') && /corrigid|errad|placeholder/i.test(pagina))
  ok('a rota REGISTRA a correcao da referencia', 'o `adm-041` que sobrou e o comentario, nao a prop');
else fail('a correcao nao esta documentada', 'sem nota, a referencia errada pode voltar sem ninguem ver');

console.log('\n10. A bancada sabe FALHAR\n');

/**
 * SEM ESTA PARTE, TUDO ACIMA E SUSPEITO.
 *
 * "0 falhas" so significa alguma coisa se o instrumento for capaz de acusar 1.
 * Um `ok()` que sempre passa, um `fail()` que nunca e alcancado ou um `textos()`
 * que achata tudo no vazio produzem a mesma tela verde — e a mesma tela vazia.
 *
 * Entao aqui a bancada se ataca de proposito: mede uma coisa SABIDAMENTE errada
 * com as MESMAS funcoes que usou nas provas. Se alguma destas quatro passar, o
 * instrumento esta quebrado e o resto do relatorio nao vale.
 *
 * Repare que o contador nao e mexido: estas provas sao ao contrario, e por isso
 * nao entram em `provas`/`falhas`. Uma bancada que conta a si mesma se confunde.
 */
let quebrado = 0;

// (a) Uma linha falsa, com quantidade do print mas total trocado, TEM que ser
//     acusada pela comparacao de totais da secao 1.
const linhaFalsa = { ...linhas.data[0], total: 999 };
const totaisErrados = linhas.data.map((l) =>
  l.productId === linhaFalsa.productId ? linhaFalsa.total : l.total,
);
const printConfere = linhas.data.every((l, i) => totaisErrados[i] === TOTAIS_DO_PRINT[l.name]);
if (printConfere === false) { quebrado += 0; } else { quebrado += 1; }

// (b) `textos` NAO pode achar um texto que nao existe — senao o `includes` das
//     secoes 8 e 9 passaria em qualquer coisa. A agulha e uma frase inventada,
//     para nao depender do que a tabela desenha quando esta vazia.
if (!textos(render(StockTable, { rows: [], onAdjust: () => {}, hasFilter: false })).includes('ZZZ frase que nao existe')) { quebrado += 0; } else { quebrado += 1; }

// (c) Uma movimentacao com `sign: 'up'` NAO pode formatar como `±` — senao a
//     prova do glifo na secao 6 nao distinguiria nada.
if (metricas.formatDelta({ sign: 'up', magnitude: 1 }) !== '±1') { quebrado += 0; } else { quebrado += 1; }

// (d) `orderForStock` NAO pode reordenar ao contrario: a prova de insercao da
//     secao 2 so vale se a funcao realmente ordenar.
if (!mesmo(metricas.orderForStock([...linhas.data].reverse()).map((l) => l.name), nomes.slice().reverse())) { quebrado += 0; } else { quebrado += 1; }

if (quebrado === 0) ok('as quatro provas ao contrario falharam como deviam', 'o instrumento acusa defeito');
else fail('a bancada passaria em qualquer coisa', `${quebrado} de 4 provas ao contrario nao acusaram`);

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
