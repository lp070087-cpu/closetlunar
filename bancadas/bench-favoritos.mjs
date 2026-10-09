/**
 * Bancada do modulo Favoritos (adm-067).
 *
 * ================== POR QUE ESTA BANCADA EXISTE ==================
 *
 * A tela e QUASE TODA estado vazio — e e exatamente por isso que ela precisa de
 * bancada. Um modulo cujo unico caminho exercitado em producao e "lista vazia"
 * passa por qualquer codigo que devolva zero sempre. O trabalho aqui e separar:
 *
 *   o que a DEMONSTRACAO mostraria hoje (vazio — o do print),
 *   do que a LISTA faz quando tem dado (transcrito do original, nao do print).
 *
 * Sem a segunda parte, `FavoritesList` poderia nao existir e ninguem notaria.
 * Por isso a secao 3 alimenta a lista com linhas semeadas e exige o desenho.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Layout, cor, posicao e responsividade — isso e navegador. E nao prova o
 * `useEffect`: `renderToStaticMarkup` nao roda efeito, entao a tela so mostra o
 * estado em que nasceu (o `Carregando...`), e a bancada prova isso tambem.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-favoritos.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-favoritos');

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

const mesmo = (a, b) => JSON.stringify(a) === JSON.stringify(b);

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

const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]favoritos|components[\\/]admin[\\/]favoritos|app[\\/]admin[\\/]favoritos)[\\/]/.test(f),
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
  if (pedido.startsWith('@/')) return carregarOriginal.call(this, join(OUT, 'src', pedido.slice(2)), pai, ehPrincipal);
  return carregarOriginal.call(this, pedido, pai, ehPrincipal);
};

const demo = require(join(OUT, 'src/lib/favoritos/demo.js'));
const dados = require(join(OUT, 'src/lib/favoritos/data.js'));
const metricas = require(join(OUT, 'src/lib/favoritos/metrics.js'));
const { FavoritesList } = require(join(OUT, 'src/components/admin/favoritos/favorites-list.js'));
const { FavoritosView } = require(join(OUT, 'src/components/admin/favoritos/favoritos-view.js'));

/* ------------------------------------------------------------- utilidades */

const normalizar = (s) => s.replace(/[\s ]+/g, ' ').trim();
function textos(html) {
  return normalizar(
    html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
      .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
      .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&atilde;/g, 'ã')
      .replace(/&otilde;/g, 'õ').replace(/&ccedil;/g, 'ç'),
  );
}
const render = (C, props) => renderToStaticMarkup(react.createElement(C, props));
function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1').replace(/=""/g, '');
}
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
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

/* ====================== 1. a demonstracao e o vazio ====================== */

console.log('\n1. a demonstracao — VAZIA, como o print');

const resultado = await dados.listFavorites();
if (Array.isArray(resultado.data) && resultado.data.length === 0)
  ok('`listFavorites` devolve lista VAZIA', 'o print adm-067 nao tem nenhum favorito');
else fail('a demonstracao tem favorito', JSON.stringify(resultado.data));

if (resultado.source === 'demo' && typeof resultado.reason === 'string' && resultado.reason.length > 0)
  ok('a leitura se declara `demo` e explica o motivo', 'nada finge vir do banco');
else fail('camada de dados', JSON.stringify({ source: resultado.source, reason: resultado.reason }));

/** A lista NAO pode ser o array do modulo: mutar a tela mudaria a demonstracao. */
const copia = resultado.data;
if (!Object.is(copia, demo.DEMO_FAVORITES))
  ok('a leitura devolve uma COPIA do array do modulo', 'um `sort` da tela nao reordena a demonstracao global');
else fail('a leitura devolve o array do modulo', 'mutacao vaza para as proximas chamadas');

/* ====================== 2. o teto de contexto ====================== */

console.log('\n2. o modulo nao toca banco nem inventa codigo');

const fonte = [
  arquivo('src/lib/favoritos/types.ts'),
  arquivo('src/lib/favoritos/demo.ts'),
  arquivo('src/lib/favoritos/metrics.ts'),
  arquivo('src/lib/favoritos/data.ts'),
  arquivo('src/components/admin/favoritos/favorites-list.tsx'),
  arquivo('src/components/admin/favoritos/favoritos-view.tsx'),
  arquivo('src/app/admin/favoritos/page.tsx'),
].join('\n');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonte)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', 'ha conexao de banco no modulo');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', 'o typecheck nao foi silenciado');
else fail('supressao de tipo', 'ha um `@ts-ignore` no modulo');

if (!/new Date\(/.test(semComentarios(arquivo('src/lib/favoritos/metrics.ts'))))
  ok('`metrics.ts` nao le o relogio', 'o modulo nao tem recorte de tempo');
else fail('`metrics.ts` le o relogio', 'nao deveria haver data aqui');

/* ====================== 3. a lista com dado semeado ====================== */

console.log('\n3. `FavoritesList` com dado — a forma do ORIGINAL, nao inventada');

const semeadas = [
  { productId: 'p4', name: 'Quarto', image: null, category: null, count: 2 },
  { productId: 'p1', name: 'Primeiro', image: '/a.jpg', category: 'Tops', count: 40 },
  { productId: 'p3', name: 'Terceiro', image: null, category: 'Shorts', count: 40 },
  { productId: 'p2', name: 'Segundo', image: '/b.jpg', category: 'Leggings', count: 7 },
];
const ordenadas = metricas.sortByCount(semeadas);

if (mesmo(ordenadas.map((r) => r.name), ['Primeiro', 'Terceiro', 'Segundo', 'Quarto']))
  ok('ordena por contagem, MAIOR primeiro', '40 · 40 · 7 · 2');
else fail('ordem por contagem', JSON.stringify(ordenadas.map((r) => [r.name, r.count])));

/**
 * O EMPATE PRESERVA A ENTRADA. `Primeiro` e `Terceiro` tem 40; se um desempate
 * por nome existisse, `Primeiro` continuaria na frente (`P` < `T`) e a prova nao
 * distinguiria. Por isso o par de empate e escolhido com o SEGUNDO
 * alfabeticamente ANTES do primeiro — `Terceiro` entra primeiro na entrada e
 * `Primeiro` depois, e a ordem de saida segue a ENTRADA, nao o alfabeto.
 */
const empate = metricas.sortByCount([
  { productId: 'x', name: 'Alfa', image: null, category: null, count: 9 },
  { productId: 'y', name: 'Zeta', image: null, category: null, count: 9 },
]);
if (mesmo(empate.map((r) => r.name), ['Alfa', 'Zeta']))
  ok('o empate mantem a ordem de ENTRADA', '`sort` estavel — sem desempate por nome inventado');
else fail('desempate', JSON.stringify(empate.map((r) => r.name)));

/** E a prova de que o empate nao e alfabetico: invertendo a entrada, inverte. */
const empateInvertido = metricas.sortByCount([
  { productId: 'y', name: 'Zeta', image: null, category: null, count: 9 },
  { productId: 'x', name: 'Alfa', image: null, category: null, count: 9 },
]);
if (mesmo(empateInvertido.map((r) => r.name), ['Zeta', 'Alfa']))
  ok('invertendo a entrada, o empate inverte junto', 'confirma que NAO ha ordem por nome escondida');
else fail('desempate nao e a entrada', JSON.stringify(empateInvertido.map((r) => r.name)));

/** `sortByCount` NAO muta a entrada. */
const antes = semeadas.map((r) => r.name);
metricas.sortByCount(semeadas);
if (mesmo(semeadas.map((r) => r.name), antes))
  ok('`sortByCount` nao muta a lista recebida', 'copia antes de ordenar');
else fail('a lista foi mutada', '`sort` sem copia');

const html = render(FavoritesList, { items: ordenadas });
const saida = textos(html);

if (saida.includes('1 Primeiro') && saida.includes('2 Terceiro') && saida.includes('3 Segundo') && saida.includes('4 Quarto'))
  ok('a POSICAO `1..4` aparece na frente de cada nome', 'o numero e a posicao, nao a contagem');
else fail('numeracao da lista', saida);

if (saida.includes('40 ♥') && contar(saida, '♥') === 4 && saida.includes('2 ♥'))
  ok('a contagem sai como `N ♥`', 'quatro coracoes — um por linha');
else fail('contagem com coracao', saida);

/** A CATEGORIA NULA vira o rotulo do original; e a vazia tambem. */
if (saida.includes('Sem categoria'))
  ok('categoria `null` vira `Sem categoria`', 'nao ha vao vazio na segunda linha');
else fail('categoria nula', saida);

if (metricas.categoryLabel('Tops') === 'Tops' &&
    metricas.categoryLabel(null) === 'Sem categoria' &&
    metricas.categoryLabel('   ') === 'Sem categoria' &&
    metricas.categoryLabel(undefined) === 'Sem categoria')
  ok('`categoryLabel` cobre nome, `null`, vazio e espacos', 'os quatro casos do dado real');
else fail('`categoryLabel`', JSON.stringify([
  metricas.categoryLabel('Tops'), metricas.categoryLabel(null), metricas.categoryLabel('   '),
]));

/** A FOTO. Sem `image`, nenhum `<img>` — a linha nao pode render um quadrado quebrado. */
const comFoto = (html.match(/<img /g) || []).length;
if (comFoto === 2)
  ok('so as linhas COM foto desenham `<img>`', '`Primeiro` e `Segundo` — as duas com `image`');
else fail('quantidade de `<img>`', `${comFoto} (esperado 2)`);

if (html.includes('class="h-12 w-10') && html.includes('object-cover'))
  ok('a foto e 40×48 com `object-cover`', '`h-12 w-10`, como no original');
else fail('classe da foto', 'nao e `h-12 w-10 object-cover`');

/** A CAIXA. `rounded` — o raio de ~3px medido no print, nao `.surface`. */
if (html.includes('rounded border border-border bg-card') && !html.includes('rounded-2xl') && !html.includes('rounded-3xl'))
  ok('a caixa e `rounded` (≈3px), nao `.surface`', 'medido em `235929.png`');
else fail('caixa da lista', 'raio diferente do medido');

if (html.includes('last:border-0') && contar(html, 'border-b border-border') === 4)
  ok('todas as linhas tem divisor e a ULTIMA o perde', '`last:border-0` — sem risco solto no fim');
else fail('divisores das linhas', String(contar(html, 'border-b border-border')));

/* ====================== 4. a tela montada ====================== */

console.log('\n4. `FavoritosView` — o que ela desenha antes de qualquer leitura');

const tela = render(FavoritosView, {});
const textoTela = textos(tela);

if (textoTela.includes('Produtos mais favoritados'))
  ok('o titulo serif do print esta la', '`Produtos mais favoritados`');
else fail('titulo da tela', textoTela.slice(0, 160));

if (tela.includes('font-serif text-2xl'))
  ok('o titulo e `<h2>` serif `text-2xl`', 'como no original, e nao o `SectionHeader` do painel');
else fail('classe do titulo', tela.slice(0, 200));

/**
 * O ESTADO INICIAL. `renderToStaticMarkup` nao roda `useEffect`, entao a tela
 * sai no estado em que nasceu — e o estado inicial NAO pode ser o texto vazio do
 * print, senao a tela afirmaria "nenhum favorito" antes de ter lido.
 */
if (textoTela.includes('Carregando...') && !textoTela.includes('Nenhum favorito registrado ainda.'))
  ok('antes de ler, mostra `Carregando...`', 'o vazio so aparece depois da leitura — nunca antes');
else fail('estado inicial da tela', textoTela.slice(0, 200));

if (!textoTela.includes('Oportunidades') && !textoTela.includes('pouco vendidas'))
  ok('a secao `Oportunidades` inventada NAO existe', 'o placeholder descrevia um bloco que nenhum print tem');
else fail('bloco inventado presente', '`Oportunidades` na tela');

/* ====================== 5. a rota e o codigo ====================== */

console.log('\n5. a rota `/admin/favoritos` — a correcao do `references`');

const pagina = arquivo('src/app/admin/favoritos/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('FavoritosView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', 'o placeholder foi substituido');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (pagina.includes('adm-067'))
  ok('a faixa CORRETA registrada: `adm-067`', 'dizia `adm-066` — que e de Relatorios');
else fail('faixa de prints', 'a correcao nao esta documentada');

if (!/adm-066/.test(paginaLimpa))
  ok('`adm-066` so aparece na prosa, nunca como referencia', 'era o valor errado; agora esta fora do codigo');
else fail('`adm-066` como referencia', 'a referencia errada sobreviveu');

if (!paginaLimpa.includes('structure') && !paginaLimpa.includes('Oportunidades'))
  ok('o array `structure` inventado sumiu', 'nem a lista, nem a segunda secao');
else fail('blocos do placeholder', 'a lista inventada sobreviveu');

/* ====================== 6. provas ao contrario ====================== */

console.log('\n6. provas ao contrario — o defeito tem que REPROVAR');

if (!semComentarios('/* adm-066 */ const x = 1;').includes('adm-066') &&
    semComentarios('/* adm-066 */ const x = 1;').includes('const x = 1'))
  ok('`semComentarios` apaga comentario e guarda o codigo', 'a citacao do valor errado nao conta como referencia');
else fail('`semComentarios`', 'ou comentou codigo, ou deixou passar o comentario');

if (!textos('<div aria-label="x"></div>').includes('aria-label') &&
    textos('<img src="/a.jpg" alt="" />').includes(''))
  ok('`textos` apaga tags e atributos', 'por isso a prova de `<img>` le o HTML cru');
else fail('`textos`', 'nao esta apagando as tags');

if (contar('a a a', 'a') === 3 && contar('abc', 'z') === 0)
  ok('`contar` conta TODAS e devolve 0 para ausente', 'um `includes` nao distinguiria 2 de 3');
else fail('`contar`', String(contar('a a a', 'a')));

/** Uma lista COM um item nao pode cair no ramo vazio — o defeito de `length`. */
const umSo = render(FavoritesList, { items: [{ productId: 'p', name: 'So', image: null, category: null, count: 1 }] });
if (textos(umSo).includes('1 So') && !textos(umSo).includes('Carregando'))
  ok('uma lista de UM item desenha a lista', 'nao cai no vazio nem no carregando');
else fail('lista de um item', textos(umSo));

/** E uma lista vazia NAO desenha nenhuma linha — a prova inversa. */
const zero = render(FavoritesList, { items: [] });
if (textos(zero) === '')
  ok('lista vazia nao desenha linha nenhuma', 'quem mostra o texto vazio e a TELA, nao a lista');
else fail('lista vazia', JSON.stringify(textos(zero)));

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
