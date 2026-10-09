/**
 * Bancada da apresentacao.
 *
 * Por que ela existe: o sandbox NAO consegue rodar `next dev` nem `next build`
 * (o `next/font/google` busca as fontes na rede no start, e aqui nao ha rede),
 * entao "abrir a pagina" nao e uma prova disponivel. Sem isso, a unica garantia
 * sobre a apresentacao seria o typecheck — que nao pega erro de execucao.
 *
 * Esta bancada fecha essa lacuna: compila os componentes com o TSC (resolvendo
 * o alias `@/` como o Next resolve) e renderiza com `react-dom/server`. Se um
 * import nao resolver, se um componente devolver `undefined`, se um `.map` cair
 * em algo que nao e lista — quebra aqui, com a mensagem do React.
 *
 * O que ela PROVA:
 *   1. as cinco telas renderizam sem excecao;
 *   2. os numeros do mockup sao os calculados (R$ 89,00 / 49,70% para o `top`);
 *   3. as telas sao TEXTO, nao imagem — ha palavras no HTML gerado;
 *   4. a marcacao mostra a marca com a grafia nova (Lunnar), nao a antiga.
 *
 * O que ela NAO prova: layout, cor e posicao. Para isso serve o navegador, que
 * roda na maquina do usuario.
 */

import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-apresentacao.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-apresentacao');

let falhas = 0;
let provas = 0;

function ok(nome, detalhe = '') {
  provas += 1;
  console.log(`  ok   ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}
function fail(nome, detalhe) {
  falhas += 1;
  console.log(`  FALHA ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}

/* ------------------------------------------------------------------ 1. COMPILA */

console.log('\n1. Compilando os componentes com o TSC (alias @/ resolvido)\n');

/**
 * CommonJS, e nao ESNext, de proposito.
 *
 * Os modulos do projeto escrevem caminhos relativos SEM extensao (`./mock-data`).
 * O ESM do Node recusa isso, mas o resolvedor do CommonJS aceita — e e assim que
 * o bundler do Next tambem resolve. Entao emitir CJS evita que a bancada invente
 * um defeito de resolucao que nao existe no projeto.
 */
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

const opcoes = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipLibCheck: true,
  /**
   * `strict: true` — CORRIGIDO NA RODADA DO MODULO PROVADOR E IA.
   *
   * Este era `strict: false`, herdado das primeiras bancadas, e com `strictNullChecks`
   * desligado o TypeScript nao estreita uniao discriminada: a emissao acusava
   * `AvatarView`, `ProvadorView` e `IALooksView` por causa do `onChange` do
   * `SegmentedTabs`, e acusava um falso positivo em `lib/fidelidade/form.ts`
   * (`.error` num retorno que e uniao discriminada). Nenhum dos quatro existe no
   * typecheck de verdade (`tsc --noEmit -p tsconfig.json` = 0 erros).
   *
   * A licao esta registrada em `feedback_bancada_strict_false_mente`: a bancada
   * acusa um defeito que nao existe, e a "correcao" natural seria mexer no
   * componente — estragar codigo certo por causa do instrumento. Com `strict: true`,
   * a bancada e o projeto falam a mesma lingua.
   */
  strict: true,
  rootDir: raizProjeto,
  outDir: OUT,
  baseUrl: raizProjeto,
  paths: { '@/*': ['./src/*'] },
};

const programa = ts.createProgram(arquivos, opcoes);
const emitidos = programa.emit();
const errosCompilacao = ts.getPreEmitDiagnostics(programa).filter((d) => d.category === ts.DiagnosticCategory.Error);

if (errosCompilacao.length === 0 && emitidos.emitSkipped === false) {
  ok('emissao sem erro', `${arquivos.length} arquivos`);
} else {
  fail('emissao', `${errosCompilacao.length} erro(s)`);
  for (const d of errosCompilacao.slice(0, 10)) {
    console.log('       ' + ts.flattenDiagnosticMessageText(d.messageText, ' '));
  }
}

/* --------------------------------------------------------------- 2. RENDERIZA */

console.log('\n2. Renderizando as telas com react-dom/server\n');

const require = createRequire(join(PROJ, 'package.json'));
const react = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Os `.js` emitidos importam `@/...` (o TSC nao reescreve o alias do `paths`),
// e em Node isso nao e um pacote. Este gancho mapeia `@/x` -> arquivo emitido,
// que e exatamente o que o bundler do Next faria. Sem ele a bancada acusaria um
// defeito de resolucao que nao existe no projeto.
const modulo = require('node:module');
const carregarOriginal = modulo._load;
modulo._load = function (pedido, pai, ehPrincipal) {
  if (pedido.startsWith('@/')) {
    return carregarOriginal.call(this, join(OUT, 'src', pedido.slice(2)), pai, ehPrincipal);
  }
  return carregarOriginal.call(this, pedido, pai, ehPrincipal);
};

const mod = require(join(OUT, 'src/components/apresentacao/screen-mockup.js'));

const TELAS = [
  ['produtos', 'Tela de Produtos'],
  ['dashboard', 'Tela de Dashboard'],
  ['pedidos', 'Tela de Pedidos'],
  ['canais', 'Tela de Conteúdo'],
  ['cadastro', 'Modal de Cadastro'],
];

const html = {};
for (const [kind, rotulo] of TELAS) {
  try {
    html[kind] = renderToStaticMarkup(
      react.createElement(mod.ScreenMockup, { kind, label: rotulo }),
    );
    ok(`render ${kind}`, `${html[kind].length} bytes`);
  } catch (erro) {
    fail(`render ${kind}`, String(erro && erro.message ? erro.message : erro));
  }
}

/* --------------------------------------------------------------- 3. VERIFICA */

console.log('\n3. Conferindo o que as telas mostram\n');

function contem(kind, agulha, nome) {
  const alvo = html[kind];
  if (!alvo) return fail(nome, 'tela nao renderizou');
  if (alvo.includes(agulha)) return ok(nome, JSON.stringify(agulha));
  return fail(nome, `nao achei ${JSON.stringify(agulha)}`);
}

for (const texto of ['Gerenciamento de Produtos', 'Kit Nike', 'Legging Modeladora Premium', 'Ações']) {
  contem('produtos', texto, `produtos mostra ${JSON.stringify(texto)}`);
}
contem('produtos', 'Margem de 49.7%', 'produtos usa a margem calculada do top');

for (const texto of ['Painel de Controle', 'Mais vendidos', 'Estoque baixo', 'Ticket médio']) {
  contem('dashboard', texto, `dashboard mostra ${JSON.stringify(texto)}`);
}

contem('pedidos', 'Aguardando postagem', 'pedidos mostra o status do print');
contem('pedidos', 'Correios', 'pedidos mostra a transportadora');

contem('canais', 'Conteúdo do Site', 'canais mostra o titulo');
contem('canais', 'Seções da Home', 'canais mostra as sete abas');

// O modal: a conta tem que bater com a do modulo puro, nao ser um numero solto.
const { grossProfit, profitMargin } = require(join(OUT, 'src/lib/produtos/metrics.js'));
const lucroEsperado = grossProfit(179, 90).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});
const margemEsperada = `${profitMargin(179, 90).toFixed(2)}%`;

contem('cadastro', lucroEsperado, `cadastro mostra o lucro calculado (${lucroEsperado})`);
contem('cadastro', margemEsperada, `cadastro mostra a margem calculada (${margemEsperada})`);

for (const texto of [
  'Preço de Venda',
  'Preço de Custo',
  'Desconto %',
  'Promocional',
  'Riscado (antigo)',
  'Lucro Bruto',
  'Margem de Lucro',
  'Galeria de imagens',
  'Variações de Cor',
  'Tamanhos',
]) {
  contem('cadastro', texto, `cadastro tem o bloco ${JSON.stringify(texto)}`);
}

// As telas precisam ser TEXTO. Se fossem imagem, isto nao apareceria.
const algumComTexto = TELAS.every(([kind]) => (html[kind] || '').includes('Closet Lunnar'));
if (algumComTexto) ok('as telas sao texto real, nao imagem', 'a marca aparece no HTML');
else fail('as telas sao texto real', 'a marca nao apareceu — pode ter virado imagem');

/* ------------------------------------------------- 4. A MARCA NA GRAFIA NOVA */

console.log('\n4. Grafia da marca no que a apresentacao renderiza\n');

const tudo = Object.values(html).join('');
const antiga = (tudo.match(/Closet Lunna(?!r)/g) || []).length;
const nova = (tudo.match(/Closet Lunnar/g) || []).length;

if (nova > 0 && antiga === 0) ok('grafia nova em todo o conteudo', `${nova} ocorrencias de "Lunnar"`);
else fail('grafia da marca', `antiga=${antiga} nova=${nova}`);

// O parametro/metadata da apresentacao tambem precisa estar na grafia nova.
const pagina = readFileSync(join(SRC, 'app/apresentacao-admin/page.tsx'), 'utf8');
const paginaAntiga = (pagina.match(/Closet Lunna(?!r)/g) || []).length;
if (paginaAntiga === 0) ok('page.tsx sem a grafia antiga');
else fail('page.tsx', `${paginaAntiga} ocorrencia(s) de "Closet Lunna"`);

// Ela pode citar a marca uma vez (para dizer que corrigiu) sem afetar a tela.
const dados = readFileSync(join(SRC, 'components/apresentacao/mock-data.ts'), 'utf8');
const dadosAntigos = (dados.match(/Closet Lunna(?!r)/g) || []).length;
if (dadosAntigos <= 1) ok('mock-data.ts limpo', `${dadosAntigos} comentario(s) citando a grafia antiga`);
else fail('mock-data.ts', `${dadosAntigos} ocorrencias`);

/* ----------------------------------------------------------------- 5. RESULTADO */

console.log(`\n${'-'.repeat(60)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(60)}\n`);

writeFileSync(join(OUT, 'telas-renderizadas.html'), Object.entries(html).map(([k, v]) => `<!-- ${k} -->\n${v}`).join('\n\n'));

process.exit(falhas === 0 ? 0 : 1);
