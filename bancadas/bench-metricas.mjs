/**
 * Bancada de COERENCIA das metricas do produto.
 *
 * O defeito que ela procura: a mesma peca com DOIS numeros diferentes
 * dependendo de quem desenhou a linha. A tabela calculava lucro e margem pelo
 * preco cheio (`grossProfit(product.price, ...)`) e o cartao pelo preco
 * efetivo (`productProfit(product)`). Enquanto nenhuma peca de demonstracao tem
 * promocional, os dois numeros coincidem e o defeito fica invisivel — inclusive
 * para o typecheck, porque as duas chamadas sao validas.
 *
 * Entao a bancada NAO usa os dados de demonstracao: ela fabrica uma peca com
 * promocional e renderiza AS DUAS superficies, exigindo que concordem.
 *
 * Prova ainda que a regra esta certa, nao so igual: o lucro tem de cair quando
 * o promocional entra (R$ 89,00 -> R$ 69,00 no caso usado).
 */

import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-metricas.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-metricas');

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
 * Raizes da COMPILACAO: so o modulo que esta bancada RENDERIZA.
 *
 * Antes esta bancada compilava o `src` inteiro. Funcionava com 89 arquivos; com
 * 108 (Pedidos entrou na Fase 6) ela passou a estourar o limite de ~178 s do
 * shell e morria ANTES de imprimir o rodape — a rodada nao contava como prova.
 *
 * Estreitar as raizes NAO afrouxa prova nenhuma desta bancada: as tres
 * superficies que ela mede (`ProductCard`, `ProductsTable`, `ProductForm`) e as
 * metricas que ela chama vivem todas em `lib/produtos` e
 * `components/admin/produtos`, e o TypeScript segue os `import` sozinho, entao
 * `ui/*` e `lib/utils` entram por conta propria.
 *
 * A emissao do projeto INTEIRO continua coberta — por quem tem essa
 * responsabilidade: `npm run typecheck`. Este arquivo prova RENDER, e nao
 * compilacao global.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]produtos|components[\\/]admin[\\/]produtos)[\\/]/.test(f),
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

const { productProfit, productMargin, effectivePrice, grossProfit } =
  require(join(OUT, 'src/lib/produtos/metrics.js'));
const { ProductCard } = require(join(OUT, 'src/components/admin/produtos/product-card.js'));
const { ProductsTable } = require(join(OUT, 'src/components/admin/produtos/products-table.js'));

/* Peca de prova: preco cheio 179, promocional 149, custo 90.
   Cheio ->  lucro 89,00  margem 49,7%
   Promo ->  lucro 59,00  margem 39,6%   (os dois numeros TEM de diferir,
   senao a bancada nao distingue a regra certa da errada.) */

const preco = 179;
const promo = 149;
const custo = 90;

const lucroCheio = grossProfit(preco, custo);
const lucroPromo = grossProfit(promo, custo);

console.log('\nA peca de prova\n');
console.log(`   cheio ${preco} / promo ${promo} / custo ${custo}`);
console.log(`   lucro no cheio  = R$ ${lucroCheio.toFixed(2)}`);
console.log(`   lucro no promo  = R$ ${lucroPromo.toFixed(2)}\n`);

if (lucroCheio !== lucroPromo) ok('a peca distingue as duas regras', 'os numeros diferem');
else fail('peca de prova', 'cheio e promo dao o mesmo numero — a bancada nao prova nada');

const produto = {
  id: 'p-prova',
  name: 'Peça de prova',
  slug: 'peca-de-prova',
  description: '',
  categoryId: 'cat-tops',
  price: preco,
  costPrice: custo,
  promoPrice: promo,
  compareAtPrice: null,
  sizes: ['P', 'M'],
  colors: [],
  images: [],
  stock: 10,
  status: 'active',
  featured: false,
  createdAt: '2026-09-28T00:00:00.000Z',
  updatedAt: '2026-09-28T00:00:00.000Z',
};

/**
 * Texto visivel da tela.
 *
 * `\s` do JavaScript NAO inclui o espaco inquebravel (U+00A0), e o
 * `toLocaleString('pt-BR')` usa U+00A0 entre `R$` e o numero. Sem trocar esse
 * caractere, o HTML renderizado contem `R$<NBSP>59,00` e a busca por
 * `R$ 59,00` falha — a bancada acusaria um defeito que nao existe. O contrario
 * tambem vale: normalizar o HTML e nao a agulha faria a bancada so saber dizer
 * "nao achei".
 */
function textos(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[\s  ]+/g, ' ')
    .trim();
}

/** A mesma normalizacao tem de valer para o que se procura. */
const brl = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    .replace(/[\s  ]+/g, ' ');

console.log('As duas superficies\n');

const cartao = textos(renderToStaticMarkup(react.createElement(ProductCard, {
  product: produto, onEdit: () => {}, onDelete: () => {},
})));

const tabela = textos(renderToStaticMarkup(react.createElement(ProductsTable, {
  products: [produto], onEdit: () => {}, onDelete: () => {},
})));

/* O cartao e a tabela desenham o lucro com o mesmo widget, entao o numero
   aparece identico nos dois. Exigimos que esse numero seja o do PROMO. */
const esperadoLucro = brl(productProfit(produto));
const esperadoMargem = `${productMargin(produto).toFixed(1)}%`;
const proibidoLucro = brl(lucroCheio);

/**
 * Cada superficie tem a SUA precisao, e as duas estao certas.
 *
 * Conferido no catalogo (`_catalog/admin-01.md`): a coluna `MARGEM` da tabela
 * imprime uma casa (`49.7%`, `42.8%`, `14.2%`, `100.0%`), e o bloco
 * `MARGEM DE LUCRO` do modal imprime duas (`0.00%`). Nao e divergencia de
 * conta — e o que os prints mostram, e a conta por tras e a mesma.
 *
 * A bancada exige o formato de cada uma. Se exigisse um so, ela estaria
 * pedindo uma mudanca que quebraria a fidelidade visual.
 */
const margemPorSuperficie = {
  cartao: `${productMargin(produto).toFixed(1)}%`,
  tabela: `${productMargin(produto).toFixed(1)}%`,
  modal: `${productMargin(produto).toFixed(2)}%`,
};

console.log('   esperado (efetivo):', esperadoLucro);
console.log('   proibido (cheio)  :', proibidoLucro);
console.log('   margem: cartao/tabela', margemPorSuperficie.cartao, '| modal', margemPorSuperficie.modal);
console.log('   cartao :', cartao.slice(0, 220));
console.log('   tabela :', tabela.slice(0, 220));
console.log();

/**
 * Terceira superficie: as duas caixas do modal.
 *
 * O formulario nao guarda numeros — guarda o que a pessoa digitou (string).
 * Por isso ele passa por `draftFromProduct`, que e a conversao real do
 * projeto, em vez de uma montagem a mao que poderia nao ser o que a tela
 * recebe de verdade.
 */
const { draftFromProduct } = require(join(OUT, 'src/lib/produtos/form.js'));
const { ProductForm } = require(join(OUT, 'src/components/admin/produtos/product-form.js'));

const formulario = textos(renderToStaticMarkup(react.createElement(ProductForm, {
  open: true,
  onClose: () => {},
  draft: draftFromProduct(produto),
  onDraftChange: () => {},
  categories: [],
  editing: true,
  onSubmit: () => {},
  errors: {},
})));

console.log('   modal  :', formulario.slice(0, 200));
console.log();

for (const [nome, texto] of [['cartao', cartao], ['tabela', tabela], ['modal', formulario]]) {
  if (texto.includes(esperadoLucro)) ok(`${nome} mostra o lucro efetivo`, esperadoLucro);
  else fail(`${nome} lucro`, `esperava ${esperadoLucro}`);

  const margemEsperada = margemPorSuperficie[nome];
  if (texto.includes(margemEsperada)) ok(`${nome} mostra a margem efetiva`, margemEsperada);
  else fail(`${nome} margem`, `esperava ${margemEsperada}`);

  if (!texto.includes(proibidoLucro)) ok(`${nome} nao mostra o lucro do preco cheio`, `ausente: ${proibidoLucro}`);
  else fail(`${nome}`, `mostrou o lucro do CHEIO (${proibidoLucro}) — regra divergente`);
}

console.log(`\n${'-'.repeat(60)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(60)}\n`);
process.exit(falhas === 0 ? 0 : 1);
