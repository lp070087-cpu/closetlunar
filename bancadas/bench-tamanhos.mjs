/**
 * Bancada do modulo Tamanhos.
 *
 * O ambiente onde o projeto foi escrito NAO roda `next dev` nem `next build`
 * (sem rede, o `next/font/google` espera as fontes para sempre). Sem esta
 * bancada, a unica garantia seria o typecheck — que nao renderiza, nao conta e
 * nao ve o ramo invertido.
 *
 * O que ela prova, em ordem:
 *   1. os .ts/.tsx do modulo EMITEM sem erro (compilador do proprio projeto);
 *   2. os `@/` resolvem em tempo de execucao;
 *   3. a MATRIZ de `Top` transcreve o print adm-032 celula por celula;
 *   4. os SEIS tipos de peca do seletor (adm-033), na mesma ordem;
 *   5. a ORDEM das linhas e G, GG, M, P, PP — e nao a ordem de insercao;
 *   6. os quatro outros tipos vem VAZIOS, com estado vazio que renderiza;
 *   7. os dois seletores de `Regras por Produto` trazem as opcoes dos prints
 *      adm-035 e adm-037, e o placeholder de observacao e o do adm-034;
 *   8. as regras sao por PRODUTO e vem dos produtos reais, nao de uma lista
 *      escrita a mao;
 *   9. a gravacao NAO finge persistir — `persisted: false` em toda escrita;
 *  10. o log de Inteligencia de Tamanho esta VAZIO, com o texto do print;
 *  11. coerencia de faixa: min > max e recusado, nas DUAS pontas;
 *  12. o que a tela NAO tem (o CRUD de tamanho que o pedido citou) e ausente
 *      de verdade — esta asserção existe para nao me deixar inventar depois.
 *
 * O que ela NAO prova: layout, cor, posicao e responsividade. Isso e navegador.
 */

import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// `resolve` no argumento: `createRequire` exige caminho absoluto, e `.` (que e
// como a bancada e chamada) nao serve.
const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-tamanhos.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-tamanhos');

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok   ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);

const arquivos = [];
(function varrer(dir) {
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) varrer(caminho);
    else if (/\.tsx?$/.test(caminho)) arquivos.push(caminho);
  }
})(SRC);

/**
 * Raizes da COMPILACAO: so o modulo Tamanhos.
 *
 * O compilador segue os `import` sozinho, entao `ui/*`, `lib/utils` e
 * `lib/produtos/*` entram no programa por conta propria. As outras ~30 paginas
 * do painel nao entram — e por isso este `rootNames` existe: compilar todas elas
 * estoura o limite de tempo do `bash` do ambiente.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]tamanhos|components[\\/]admin[\\/]tamanhos|app[\\/]admin[\\/]tamanhos)[\\/]/.test(f),
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

const dados = require(join(OUT, 'src/lib/tamanhos/data.js'));
const demo = require(join(OUT, 'src/lib/tamanhos/demo.js'));
const metricas = require(join(OUT, 'src/lib/tamanhos/metrics.js'));
const form = require(join(OUT, 'src/lib/tamanhos/form.js'));
const { MeasureTable } = require(join(OUT, 'src/components/admin/tamanhos/measure-table.js'));
const { MeasureSection } = require(join(OUT, 'src/components/admin/tamanhos/measure-section.js'));
const { RuleSection } = require(join(OUT, 'src/components/admin/tamanhos/rule-section.js'));
const { ProductRuleRow } = require(join(OUT, 'src/components/admin/tamanhos/product-rule-row.js'));
const { SizeIntelligence } = require(join(OUT, 'src/components/admin/tamanhos/size-intelligence.js'));
const { SizeGuideView } = require(join(OUT, 'src/components/admin/tamanhos/size-guide-view.js'));

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

console.log('\n1. Os seis tipos de peca do print adm-033\n');

const tipos = dados.listGarmentTypes();
const rotulos = tipos.map((t) => t.label);
const esperados = ['Top', 'Short', 'Legging', 'Conjunto', 'Macaquinho', 'Cropped'];

if (rotulos.length === esperados.length) ok('seis tipos de peca', rotulos.join(', '));
else fail('quantidade de tipos', `${rotulos.length}, esperava ${esperados.length}`);

if (JSON.stringify(rotulos) === JSON.stringify(esperados)) ok('na ordem do print', 'Top, Short, Legging, Conjunto, Macaquinho, Cropped');
else fail('ordem dos tipos', rotulos.join(', '));

console.log('\n2. A matriz de `Top` transcreve o print adm-032\n');

const top = await dados.listSizeRows('top');
if (top.source === 'demo') ok('a leitura se declara demonstrativa', 'source = demo');
else fail('origem da leitura', `veio ${top.source}`);

const porTamanho = new Map(top.data.map((r) => [r.sizeLabel, r]));
if (top.data.length === 5) ok('cinco linhas de tamanho', top.data.map((r) => r.sizeLabel).join(' '));
else fail('linhas da matriz de Top', `${top.data.length}`);

// Cada numero do print, conferido celula por celula. Se algum estiver trocado,
// esta tabela diz QUAL.
const ESPERADO_TOP = {
  G:  { bust: [92, 98],   waist: [72, 78], hip: [98, 104],  height: [160, 180], weight: [62, 72] },
  GG: { bust: [98, 106],  waist: [78, 86], hip: [104, 112], height: [160, 185], weight: [70, 82] },
  M:  { bust: [86, 92],   waist: [66, 72], hip: [92, 98],   height: [158, 175], weight: [56, 65] },
  P:  { bust: [82, 88],   waist: [62, 68], hip: [88, 94],   height: [155, 170], weight: [50, 58] },
  PP: { bust: [78, 84],   waist: [58, 64], hip: [84, 90],   height: [150, 165], weight: [45, 52] },
};

let celulasErradas = [];
for (const [tamanho, medidas] of Object.entries(ESPERADO_TOP)) {
  const linha = porTamanho.get(tamanho);
  if (!linha) { celulasErradas.push(`${tamanho} ausente`); continue; }
  for (const [chave, [mn, mx]] of Object.entries(medidas)) {
    if (linha[chave].min !== mn || linha[chave].max !== mx) {
      celulasErradas.push(`${tamanho}.${chave}=${linha[chave].min}/${linha[chave].max} (print: ${mn}/${mx})`);
    }
  }
}
if (celulasErradas.length === 0) ok('as 50 celulas batem com o print', '5 linhas x 5 medidas x 2 pontas');
else fail('celula divergente do print', celulasErradas.slice(0, 4).join(' | '));

console.log('\n3. A ordem das linhas e a do print: G, GG, M, P, PP\n');

const ordemExibida = top.data.map((r) => r.sizeLabel).join(',');
if (ordemExibida === 'G,GG,M,P,PP') ok('linhas na ordem do print', 'G, GG, M, P, PP');
else fail('ordem das linhas', ordemExibida);

// A ordem NAO pode depender da ordem de insercao: um array invertido tem que
// sair igual. Se isto falhar, a ordem veio do demo por acidente.
const embaralhado = [...top.data].reverse();
const reordenado = metricas.sortBySizeOrder(embaralhado).map((r) => r.sizeLabel).join(',');
if (reordenado === 'G,GG,M,P,PP') ok('ordena mesmo invertido', 'a ordem e a lista, nao a insercao');
else fail('ordem depende da insercao', reordenado);

/*
  A ARMADILHA QUE ESTAS ASSERCOES EXISTEM PARA PEGAR.

  A ordem do print (`G, GG, M, P, PP`) e ALFABETICA, e nao uma ordem de tamanho.
  A primeira versao ordenava por regua — `PP` primeiro — e imprimia
  `PP, P, M, G, GG`, o INVERSO do print. A "correcao" seguinte tratou como
  "do maior para o menor" e imprimiu `GG, G, M, P, PP`, que tambem nao e o
  print. Nenhuma regua de tamanho produz esta ordem; so a alfabetica produz.

  Sem estas provas, o proximo "conserto" volta a inverter a tabela em silencio.
*/
if (metricas.sizeRank('XG') > metricas.sizeRank('GG'))
  ok('a regua continua comparando tamanho de verdade', `XG(${metricas.sizeRank('XG')}) > GG(${metricas.sizeRank('GG')})`);
else fail('regua alfabetica por acidente', 'XG deveria ficar depois de GG');

if (metricas.sizeRank('M') === 2 && metricas.sizeRank('G') === 3) ok('a regua tem PP,P,M,G,GG', 'M antes de G');
else fail('regua de tamanhos', `M=${metricas.sizeRank('M')} G=${metricas.sizeRank('G')}`);

/*
  A PROVA DECISIVA: a saida tem que ser igual a ordenacao alfabetica. Isto
  falha para a ordem de tamanho crescente E para a decrescente — e foi escrito
  assim de proposito, para nao depender de eu lembrar qual das duas era.
*/
const alfabetica = [...top.data].map((r) => r.sizeLabel).sort((a, b) => a.localeCompare(b, 'pt-BR'));
if (ordemExibida === alfabetica.join(','))
  ok('a ordem da tela E a alfabetica do print', ordemExibida);
else fail('a ordem da tela nao e a alfabetica', `${ordemExibida} vs ${alfabetica.join(',')}`);

// E nao pode ser a ordem de tamanho em NENHUM dos dois sentidos.
const crescente = [...top.data]
  .sort((a, b) => metricas.sizeRank(a.sizeLabel) - metricas.sizeRank(b.sizeLabel))
  .map((r) => r.sizeLabel)
  .join(',');
const decrescente = [...top.data]
  .sort((a, b) => metricas.sizeRank(b.sizeLabel) - metricas.sizeRank(a.sizeLabel))
  .map((r) => r.sizeLabel)
  .join(',');
if (ordemExibida !== crescente && ordemExibida !== decrescente)
  ok('nao e ordem de tamanho em nenhum sentido', `crescente=${crescente} decrescente=${decrescente}`);
else fail('a tabela voltou a ser ordenada por tamanho', ordemExibida);

console.log('\n4. Os tipos sem medida vem VAZIOS, e o vazio renderiza\n');

const outros = ['short', 'legging', 'conjunto', 'macaquinho', 'cropped'];
let comLinha = [];
for (const tipo of outros) {
  const resultado = await dados.listSizeRows(tipo);
  if (resultado.data.length > 0) comLinha.push(`${tipo}=${resultado.data.length}`);
}
if (comLinha.length === 0) ok('os cinco outros tipos vem vazios', 'nao inventei medida que o print nao mostra');
else fail('tipo com medida inventada', comLinha.join(', '));

const vazioHtml = render(MeasureTable, { rows: [], onCellCommit: () => {}, errorFor: () => null });
const vazioTexto = textos(vazioHtml);
if (/Nenhuma medida cadastrada para este tipo de peça\./.test(vazioTexto)) ok('estado vazio da matriz renderiza', '');
else fail('estado vazio da matriz', vazioTexto.slice(0, 120));

console.log('\n5. A matriz renderiza o cabecalho do print\n');

const matrizHtml = render(MeasureTable, { rows: top.data, onCellCommit: () => {}, errorFor: () => null });
const matrizTexto = textos(matrizHtml);

// Os sufixos NAO sao os mesmos nas cinco colunas: o print usa `MIN/MAX` nas tres
// primeiras e a unidade (`CM`, `KG`) nas duas ultimas. Uniformizar seria
// "consistente" e errado.
for (const rotulo of [
  'Tamanho',
  'Busto (min/max)',
  'Cintura (min/max)',
  'Quadril (min/max)',
  'Altura (cm)',
  'Peso (kg)',
]) {
  if (matrizTexto.includes(rotulo)) ok(`coluna ${rotulo}`, '');
  else fail('coluna ausente', rotulo);
}

// Controle negativo do proprio cabecalho: se as duas ultimas tivessem sido
// uniformizadas em `min/max`, esta assercao acusa.
if (!matrizTexto.includes('Altura (min/max)') && !matrizTexto.includes('Peso (min/max)'))
  ok('Altura e Peso NAO dizem min/max', 'fiel ao print, que la usa cm e kg');
else fail('cabecalho uniformizado', 'o print nao usa min/max nas duas ultimas');

// As celulas sao CAMPOS, nao texto — e o rodape promete gravacao ao sair deles.
const campos = (matrizHtml.match(/<input/g) ?? []).length;
if (campos === 50) ok('as 50 celulas sao campos editaveis', `${campos} inputs`);
else fail('numero de campos da matriz', `achei ${campos}, esperava 50`);

if (/type="number"/.test(matrizHtml)) ok('campos numericos', 'type="number"');
else fail('tipo dos campos', 'deveriam ser number');

// O separador do print e o caractere `/` entre os dois campos.
if (matrizTexto.includes('/')) ok('separador min/max presente', '');
else fail('separador ausente', 'o print mostra `92 / 98`');

console.log('\n6. Regras por Produto: as opcoes dos prints adm-035 e adm-037\n');

const mod = metricas.MODELING_OPTIONS.map((o) => o.label);
const el = metricas.ELASTICITY_OPTIONS.map((o) => o.label);

if (JSON.stringify(mod) === JSON.stringify(['Modelagem pequena', 'Modelagem normal', 'Modelagem grande']))
  ok('opcoes de modelagem', mod.join(' / '));
else fail('opcoes de modelagem', mod.join(', '));

if (JSON.stringify(el) === JSON.stringify(['Pouca elasticidade', 'Média elasticidade', 'Alta elasticidade']))
  ok('opcoes de elasticidade', el.join(' / '));
else fail('opcoes de elasticidade', el.join(', '));

if (metricas.NOTES_PLACEHOLDER === 'Ex: Tecido firme, não estica') ok('placeholder das observacoes', metricas.NOTES_PLACEHOLDER);
else fail('placeholder das observacoes', metricas.NOTES_PLACEHOLDER);

// O padrao que o print mostra em TODAS as linhas.
if (metricas.DEFAULT_MODELING === 'normal' && metricas.DEFAULT_ELASTICITY === 'media')
  ok('padrao do print', 'Modelagem normal + Média elasticidade');
else fail('padrao', `${metricas.DEFAULT_MODELING}/${metricas.DEFAULT_ELASTICITY}`);

console.log('\n7. As regras sao por PRODUTO e vem dos produtos reais\n');

const regras = await dados.listProductRules();
const nomesProdutos = regras.data.map((r) => r.productName);

// Os nomes do print adm-034/035/036, na ordem em que ele os mostra.
const NOMES_DO_PRINT = [
  'Conjunto Glow Nude', 'Cropped Urban Fit', 'Jaqueta Corta Vento Fit', 'Kit Nike',
  'Legging Modeladora Premium', 'Macaquinho', 'Macaquinho costas nuas',
  'Short Fitness Energy', 'top', 'Top Essential Sustentação',
];

/*
  A ORDEM: o print lista em ordem alfabetica — `Conjunto` primeiro, `Top` por
  ultimo. `lib/produtos/demo.ts` comeca por `top`, entao ordenar aqui e
  obrigatorio; sem isso a tela mostraria as dez linhas na ordem errada.
*/
const ordenados = [...nomesProdutos].sort((a, b) => a.localeCompare(b, 'pt-BR'));
if (nomesProdutos.join('|') === ordenados.join('|'))
  ok('a lista de regras sai em ordem alfabetica, como o print', `1o: ${nomesProdutos[0]}`);
else fail('a lista de regras nao esta ordenada', nomesProdutos.join(', '));

/*
  A DIVERGENCIA ENTRE DOIS PRINTS — declarada, e nao escondida.

  `Conjunto Glow Nude` aparece em adm-034 (primeira linha) e NAO aparece em
  adm-025, o print de Produtos, que mostra os outros nove. Os dois prints se
  contradizem; a ordem de prioridade `print > projeto original > placeholder`
  nao resolve isso, porque sao dois prints.

  A decisao: Tamanhos NAO cria produto. Quem e dono da lista de produtos e
  `lib/produtos`, e a lista de regras e um JOIN sobre ela — inventar um produto
  aqui seria criar uma linha que a tela de Produtos nao conhece. Entao a linha
  fica de fora ate alguem decidir de qual print e a verdade. Esta assercao
  documenta a ausencia para que ela nao passe em silencio, e falha se um dia o
  produto entrar (o que exige revisitar esta decisao).
*/
const AUSENTE_CONHECIDO = 'Conjunto Glow Nude';
const ausentes = NOMES_DO_PRINT.filter((n) => !nomesProdutos.includes(n));
if (ausentes.length === 1 && ausentes[0] === AUSENTE_CONHECIDO)
  ok('so a divergencia conhecida entre adm-025 e adm-034 falta', AUSENTE_CONHECIDO);
else if (ausentes.length === 0)
  fail('a divergencia conhecida sumiu', `${AUSENTE_CONHECIDO} entrou: revisar a decisao registrada`);
else fail('produto do print ausente', ausentes.join(', '));

// Nenhum produto pode SUMIR da lista de regras: toda linha de Produtos tem que
// aparecer aqui. E o lado que realmente importa — o que existe la tem que
// existir ca.
const { DEMO_PRODUCTS_PRODUTOS } = require(join(OUT, 'src/lib/produtos/demo.js'));
const nomesDeProdutos = DEMO_PRODUCTS_PRODUTOS.map((p) => p.name);
const sumiram = nomesDeProdutos.filter((n) => !nomesProdutos.includes(n));
if (sumiram.length === 0) ok('nenhum produto de Produtos ficou de fora', `${nomesDeProdutos.length} produtos`);
else fail('produto de Produtos sem linha de regra', sumiram.join(', '));

if (regras.data.length > 0) ok('a lista nao esta vazia', `${regras.data.length} produtos`);
else fail('lista de produtos vazia', 'deveria vir de lib/produtos');

// Toda linha sai com regra EFETIVA: nao ha `undefined` para a tela tratar.
const semRegra = regras.data.filter((r) => !r.rule || !r.rule.productId);
if (semRegra.length === 0) ok('toda linha sai com regra efetiva', 'a tela nao decide "e quando nao tem regra?"');
else fail('linha sem regra', `${semRegra.length}`);

// Nenhuma regra "salva" inventada: o print mostra o estado inicial.
if (metricas.countConfigured(regras.data.map((r) => r.rule)) === 0)
  ok('nenhuma regra marcada como salva', 'as 9 linhas estao no padrao, como no print');
else fail('regra salva sem ninguem salvar', 'o contador de configurados mentiria');

console.log('\n8. A linha de regra renderiza os controles do print\n');

const primeira = regras.data.find((r) => r.productName === 'Conjunto Glow Nude') ?? regras.data[0];
const linhaHtml = render(ProductRuleRow, { row: primeira, saving: false, onSave: () => {} });
const linhaTexto = textos(linhaHtml);

if (linhaTexto.includes(primeira.productName)) ok('mostra o nome do produto', primeira.productName);
else fail('nome do produto', primeira.productName);

// Os dois seletores trazem a opcao SELECIONADA do print.
if (/Modelagem normal/.test(textos(linhaHtml))) ok('modelagem selecionada no padrao', 'Modelagem normal');
else fail('modelagem', linhaTexto.slice(0, 120));

if (/Média elasticidade/.test(textos(linhaHtml))) ok('elasticidade selecionada no padrao', 'Média elasticidade');
else fail('elasticidade', linhaTexto.slice(0, 120));

// `placeholder` e ATRIBUTO: procurar no texto limpo nunca acha. Vai no HTML cru.
if (linhaHtml.includes('placeholder="Ex: Tecido firme, não estica"'))
  ok('placeholder de observacoes no campo', 'atributo, nao texto visivel');
else fail('placeholder de observacoes', 'nao achei no HTML cru');

if (/Salvar/i.test(linhaTexto)) ok('botao SALVAR em toda linha', '');
else fail('botao salvar', 'o print mostra SALVAR em cada linha');

console.log('\n9. Escrita: nao finge persistir\n');

const medidaGravada = await dados.saveMeasurement(top.data[0]);
if (medidaGravada.persisted === false) ok('gravar medida nao finge persistir', 'persisted: false');
else fail('gravar medida mentiu', 'persisted nao pode ser true sem banco');
if (medidaGravada.reason && /Neon|integra/i.test(medidaGravada.reason)) ok('diz por que nao gravou', medidaGravada.reason.slice(0, 48) + '...');
else fail('motivo da gravacao ausente', String(medidaGravada.reason));

const regraGravada = await dados.saveProductRule(primeira.rule);
if (regraGravada.persisted === false) ok('gravar regra nao finge persistir', 'persisted: false');
else fail('gravar regra mentiu', 'persisted nao pode ser true sem banco');

console.log('\n10. Inteligencia de Tamanho: vazia, como o print adm-036\n');

const aprendizado = await dados.listSizeLearning();
if (aprendizado.data.length === 0) ok('log comeca vazio', 'o print mostra exatamente isso');
else fail('log com linha inventada', `${aprendizado.data.length}`);

const iaHtml = render(SizeIntelligence, { entries: aprendizado.data });
const iaTexto = textos(iaHtml);
if (iaTexto.includes('Nenhum dado de aprendizado registrado ainda.')) ok('texto do estado vazio', '');
else fail('texto do estado vazio', iaTexto.slice(0, 160));

for (const coluna of ['Data', 'Categoria', 'Produto', 'Tamanho', 'Status/Feedback']) {
  if (iaTexto.includes(coluna)) ok(`coluna ${coluna}`, '');
  else fail('coluna ausente', coluna);
}

console.log('\n11. Coerencia de faixa: min > max e recusado\n');

const invertida = { min: 98, max: 92 };
if (metricas.rangeError(invertida)) ok('min maior que max e recusado', metricas.rangeError(invertida));
else fail('faixa invertida passou', '98/92 deveria ser erro');

if (metricas.rangeError({ min: 92, max: 98 }) === null) ok('faixa coerente passa', '92/98');
else fail('faixa coerente recusada', '');

// Uma ponta so nao e uma faixa — nao ha o que comparar, e nao e erro.
if (metricas.rangeError({ min: 92, max: null }) === null && metricas.rangeError({ min: null, max: null }) === null)
  ok('faixa incompleta nao e erro de coerencia', 'min sozinho nao define faixa');
else fail('faixa incompleta acusou erro', 'nao deveria');

// `applyMeasurement` e o que o input entrega. Vazio NAO pode virar zero.
if (metricas.applyMeasurement({ min: 1, max: 2 }, 'min', '') .min === null)
  ok('campo vazio vira null, nao zero', 'apagar nao e digitar 0');
else fail('vazio virou zero', 'um busto de 0 cm nao existe');

if (metricas.applyMeasurement({ min: null, max: null }, 'max', 'abc').max === null)
  ok('texto invalido vira null, nao NaN', 'NaN envenenaria toda conta seguinte');
else fail('texto invalido virou NaN', '');

const numerico = metricas.applyMeasurement({ min: null, max: null }, 'min', ' 88 ');
if (numerico.min === 88) ok('numero digitado entra como number', '88');
else fail('conversao de numero', String(numerico.min));

// O ponto de integracao: uma faixa invertida pela TELA e presa a celula.
const linhaInvertida = { ...top.data[0], bust: { min: 106, max: 92 } };
if (metricas.rangeError(linhaInvertida.bust)) ok('a tela prende o erro na celula', 'erro do par, nao do campo');
else fail('erro de faixa nao detectado', '');

console.log('\n12. O CRUD que o pedido citou NAO existe nos prints — e nao foi inventado\n');

const conteudoView = readFileSync(join(SRC, 'components/admin/tamanhos/size-guide-view.tsx'), 'utf8');
const conteudoTipos = readFileSync(join(SRC, 'lib/tamanhos/types.ts'), 'utf8');

// Nenhuma operacao de criar/excluir tamanho no modulo.
const operacoesInventadas = ['createSize', 'deleteSize', 'toggleSize', 'renameSize'];
const achadas = operacoesInventadas.filter((nome) => conteudoView.includes(nome) || conteudoTipos.includes(nome));
if (achadas.length === 0) ok('nenhuma operacao de CRUD de tamanho', 'o print nao tem criar/excluir/ativar');
else fail('CRUD de tamanho inventado', achadas.join(', '));

// A tela nao importa do demo — so `data.ts` conhece o demo.
if (!/from '@\/lib\/tamanhos\/demo'/.test(conteudoView)) ok('nenhuma tela importa do demo', 'so data.ts conhece o demo');
else fail('tela importando demo', 'size-guide-view.tsx nao pode conhecer demo.ts');

// O join com Produtos fica na camada de dados, nao numa tela.
const conteudoData = readFileSync(join(SRC, 'lib/tamanhos/data.ts'), 'utf8');
if (/from '@\/lib\/produtos\/demo'/.test(conteudoData)) ok('o join com Produtos vive em data.ts', 'unico ponto de contato');
else fail('join com Produtos', 'nao achei em data.ts');

// Os erros do typecheck nao podem ter sido escondidos.
let supressoes = 0;
for (const f of arquivos) {
  const texto = readFileSync(f, 'utf8');
  texto.split('\n').forEach((linha, i) => {
    if (/@ts-ignore|@ts-expect-error/.test(linha)) {
      supressoes += 1;
      fail('supressao de tipo', `${f.replace(raizProjeto + '\\', '')}:${i + 1}`);
    }
    if (/[:<]\s*any\b|as any\b/.test(linha) && !/Array\.from|\.map\(/.test(linha)) {
      supressoes += 1;
      fail('any', `${f.replace(raizProjeto + '\\', '')}:${i + 1} — ${linha.trim().slice(0, 70)}`);
    }
  });
}
if (supressoes === 0) ok('nenhum @ts-ignore / @ts-expect-error / any no projeto', `${arquivos.length} arquivos`);

console.log('\n13. A tela monta os TRES blocos do print\n');

/*
  `renderToStaticMarkup` NAO roda `useEffect`. A `SizeGuideView` carrega dentro
  de um efeito, entao o que ela devolve aqui e o PRIMEIRO QUADRO — o esqueleto
  de carregamento, sem titulo nenhum. Procurar `Tabela de Medidas` nela
  acusaria um defeito que nao existe, pelo mesmo motivo de sempre: a agulha
  estaria no lugar errado.

  Por isso o cabecalho de cada bloco mora num componente APRESENTACIONAL, e a
  prova abaixo o renderiza COM os dados que a camada de dados entrega. E prova
  mais forte do que ler a string no arquivo: le o texto que o bloco produz.
*/

const tiposReais = dados.listGarmentTypes();
const secaoMedidas = render(MeasureSection, {
  garmentTypes: tiposReais,
  garmentType: 'top',
  onGarmentTypeChange: () => {},
  rows: top.data,
  onCellCommit: () => {},
  errorFor: () => null,
});
const secaoMedidasTexto = textos(secaoMedidas);

for (const esperado of [
  ['titulo', 'Tabela de Medidas'],
  ['subtitulo (adm-032)', 'Configure as dimensões padrão para cada tipo de peça.'],
  ['rotulo do seletor (adm-032)', 'Tipo de peça'],
]) {
  if (secaoMedidasTexto.includes(esperado[1])) ok(`bloco 1 tem ${esperado[0]}`, esperado[1]);
  else fail(`bloco 1 sem ${esperado[0]}`, secaoMedidasTexto.slice(0, 160));
}

if (/Alterações são salvas automaticamente ao sair do campo/i.test(secaoMedidasTexto))
  ok('bloco 1 tem o rodape do salvamento automatico', 'do print adm-032');
else fail('bloco 1 sem o rodape', '');

// O seletor oferece os SEIS tipos — e o print adm-033 mostra a lista aberta.
const opcoesNaSecao = tiposReais.filter((t) => secaoMedidas.includes(`value="${t.value}"`));
if (opcoesNaSecao.length === 6) ok('o seletor traz os seis tipos de peca', opcoesNaSecao.map((t) => t.label).join(', '));
else fail('opcoes do seletor', `${opcoesNaSecao.length} de 6`);

// Estado VAZIO do bloco 1: um tipo sem medida precisa dizer isso.
const secaoMedidasVazia = textos(render(MeasureSection, {
  garmentTypes: tiposReais,
  garmentType: 'legging',
  onGarmentTypeChange: () => {},
  rows: [],
  onCellCommit: () => {},
  errorFor: () => null,
}));
if (/Nenhuma medida cadastrada para este tipo de peça\./.test(secaoMedidasVazia))
  ok('bloco 1 diz quando nao ha medida', 'o vazio e alcancavel de verdade');
else fail('bloco 1 nao avisa o vazio', secaoMedidasVazia.slice(0, 160));

const secaoRegras = render(RuleSection, {
  rules: regras.data,
  savingProductId: null,
  onSave: () => {},
});
const secaoRegrasTexto = textos(secaoRegras);
if (secaoRegrasTexto.includes('Regras por Produto')) ok('bloco 2 tem o titulo', '');
else fail('bloco 2 sem titulo', secaoRegrasTexto.slice(0, 120));
if (secaoRegrasTexto.includes('Personalize como cada peça se comporta no provador virtual.'))
  ok('bloco 2 tem o subtitulo do print', 'adm-034');
else fail('bloco 2 sem subtitulo', '');
if (secaoRegrasTexto.includes(primeira.productName)) ok('bloco 2 lista os produtos', `${regras.data.length} linhas`);
else fail('bloco 2 sem produtos', '');

const secaoRegrasVazia = textos(render(RuleSection, { rules: [], savingProductId: null, onSave: () => {} }));
if (secaoRegrasVazia.includes('Nenhum produto cadastrado.')) ok('bloco 2 tem estado vazio', 'da referencia do projeto');
else fail('bloco 2 sem estado vazio', '');

const secaoIa = textos(render(SizeIntelligence, { entries: [] }));
if (secaoIa.includes('Inteligência de Tamanho')) ok('bloco 3 tem o titulo', '');
else fail('bloco 3 sem titulo', secaoIa.slice(0, 120));
if (secaoIa.includes('Log de aprendizado do sistema baseado em compras e devoluções reais'))
  ok('bloco 3 tem o subtitulo do print', 'adm-036');
else fail('bloco 3 sem subtitulo', '');

// A tela carrega: o primeiro quadro (esqueleto) tem que sair sem explodir.
let primeiroQuadro = '';
try {
  primeiroQuadro = render(SizeGuideView, {});
  if (primeiroQuadro.includes('skeleton')) ok('a tela renderiza o quadro de carregamento', 'TableSkeleton antes dos dados');
  else fail('primeiro quadro inesperado', primeiroQuadro.slice(0, 120));
} catch (erro) {
  fail('a tela explodiu ao renderizar', String(erro).slice(0, 120));
}

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
