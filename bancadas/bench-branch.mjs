/**
 * Bancada do RAMO de estoque baixo (Dashboard).
 *
 * Por que ela existe: o defeito que ela procura e invisivel para o typecheck.
 * `DEMO_LOW_STOCK.length === 0` e `!== 0` sao as duas booleanas validas — as
 * duas compilam, as duas passam no strict, e uma delas esta errada. So a
 * renderizacao diz qual ramo sai de verdade.
 *
 * Ela renderiza a pagina do Dashboard com `react-dom/server` e exige:
 *   1. que os dois itens reais aparecam (Kit Nike / Macaquinho);
 *   2. que o texto de estado vazio NAO apareca junto com eles.
 *
 * Isso e um teste de ramo: uma pagina que renderizasse os dois ao mesmo tempo
 * tambem passaria num teste que so procurasse os itens.
 */

import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-branch.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-branch');

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
 * Raizes da COMPILACAO: o Dashboard e o que ele puxa.
 *
 * Esta bancada renderiza `src/app/admin/page.tsx` — a UNICA superficie que ela
 * mede. Antes compilava o `src` inteiro; com 108 arquivos (Pedidos entrou na
 * Fase 6) isso passou o limite de ~178 s do shell e a bancada morria antes do
 * rodape, sem contar como prova.
 *
 * Estreitar as raizes nao afrouxa nada: `app/admin/page.tsx` e importado como
 * RAIZ, e o TypeScript segue todos os `import` dele — `ui/*`, `lib/utils` e
 * `lib/mock` entram no programa sozinhos. O que sai daqui e so o que o
 * Dashboard nao toca (as outras ~30 rotas), cuja emissao e responsabilidade do
 * `npm run typecheck`.
 */
const raizes = arquivos.filter((f) => /src[\\/]app[\\/]admin[\\/]page\.tsx$/.test(f));

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

if (erros.length === 0 && emitidos.emitSkipped === false) ok('emissao sem erro', `${raizes.length} raiz (o Dashboard)`);
else {
  fail('emissao', `${erros.length} erro(s)`);
  for (const d of erros.slice(0, 8)) console.log('       ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));
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

const pagina = require(join(OUT, 'src/app/admin/page.js'));
const html = renderToStaticMarkup(react.createElement(pagina.default));

/* Os itens reais que o ramo preenchido deve imprimir. */
const itens = ['Kit Nike', 'Macaquinho'];
const vazio = 'Nenhum produto com estoque baixo';

console.log('\nRamo de estoque baixo no Dashboard\n');

for (const item of itens) {
  if (html.includes(item)) ok(`mostra ${JSON.stringify(item)}`);
  else fail(`mostra ${JSON.stringify(item)}`, 'o ramo preenchido nao saiu');
}

if (!html.includes(vazio)) ok('nao mostra o estado vazio junto', 'os dois ramos sao exclusivos');
else fail('ramo exclusivo', 'o estado vazio saiu — o ramo preenchido nao foi escolhido');

/* Prova de que o RASTRO certo foi lido: o rotulo da secao tem de estar la,
   senao o HTML poderia ser de outra pagina que por acaso tem esses nomes. */
if (html.includes('Produtos com estoque baixo')) ok('a secao certa foi renderizada');
else fail('secao certa', 'rotulo ausente');

/* O rotulo de unidades vem do dado, nao do texto solto. */
if (html.includes('1 un.') && html.includes('5 un.')) ok('as unidades vem do dado (1 e 5)');
else fail('unidades', 'nao achei 1 un. / 5 un.');

console.log(`\n${'-'.repeat(60)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(60)}\n`);
process.exit(falhas === 0 ? 0 : 1);
