/**
 * Bancada do modulo Categorias.
 *
 * O ambiente onde o projeto foi escrito NAO roda `next dev` nem `next build`
 * (sem rede, o `next/font/google` espera as fontes para sempre). Sem esta
 * bancada, a unica garantia seria o typecheck — que nao renderiza, nao conta e
 * nao ve o ramo invertido.
 *
 * O que ela prova, em ordem:
 *   1. os .ts/.tsx do modulo EMITEM sem erro (compiador do proprio projeto);
 *   2. os `@/` resolvem em tempo de execucao;
 *   3. a LINHA renderiza a meta exatamente como o print (`/tops · ordem 1 · ativo`);
 *   4. a categoria INATIVA troca `Desativar` por `Ativar` — os DOIS ramos,
 *      porque procurar so um deles nao prova nada;
 *   5. a contagem de produtos vem dos produtos reais, nao de um numero escrito
 *      a mao em `demo.ts`;
 *   6. o MODAL tem os quatro campos do print, o rodape sem barra e NAO tem o
 *      cabecalho com X (o de Produtos tem; este nao);
 *   7. `nextSortOrder` reproduz o `Ordem 7` do print;
 *   8. ordenar nao perde linha e o desempate e estavel nos DOIS sentidos;
 *   9. o estado VAZIO renderiza quando o filtro nao casa com nada.
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
  console.error('uso: node bench-categorias.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-categorias');

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
 * Raizes da COMPILACAO: so o modulo Categorias.
 *
 * O compilador segue os `import` sozinho, entao `ui/*`, `lib/utils` e
 * `lib/produtos/*` entram no programa por conta propria. As outras ~30 paginas
 * do painel nao entram — e por isso este `rootNames` existe.
 *
 * NAO e economia de vaidade: a bancada precisa rodar dentro do limite de tempo
 * do ambiente, e compilar as 30 paginas de placeholder a cada rodada estourava
 * o limite. Restringir a RAIZ nao enfraquece a prova, porque o que esta sendo
 * provado e o modulo Categorias e a resolucao dos `@/` que ele usa.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]categorias|components[\\/]admin[\\/]categorias|app[\\/]admin[\\/]categorias)[\\/]/.test(f),
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
if (erros.length === 0 && emitidos.emitSkipped === false) ok("emissao sem erro", `${raizes.length} raizes do modulo`);
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

const dados = require(join(OUT, 'src/lib/categorias/data.js'));
const metricas = require(join(OUT, 'src/lib/categorias/metrics.js'));
const form = require(join(OUT, 'src/lib/categorias/form.js'));
const { CategoryRow } = require(join(OUT, 'src/components/admin/categorias/category-row.js'));
const { CategoryForm } = require(join(OUT, 'src/components/admin/categorias/category-form.js'));
const { CategoriesView } = require(join(OUT, 'src/components/admin/categorias/categories-view.js'));

/** Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados. */
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

console.log('\n1. A lista que o print mostra\n');

const lista = await dados.listCategories();
const nomes = lista.data.map((c) => c.name);
const esperadoPrint = ['Tops', 'Macaquinhos', 'Conjuntos', 'Shorts', 'Atacado'];
const primeiros = nomes.slice(0, 5);
if (JSON.stringify(primeiros) === JSON.stringify(esperadoPrint)) {
  ok('as 5 primeiras categorias sao as do print, na ordem', primeiros.join(' · '));
} else {
  fail('ordem/nomes do print', `esperava ${esperadoPrint.join(' · ')}, veio ${primeiros.join(' · ')}`);
}

if (nomes[5] === 'Leggings') ok('a 6a e Leggings', 'ordem 6 · inativo no print');
else fail('6a categoria', `esperava Leggings, veio ${nomes[5]}`);

const atacado = lista.data.find((c) => c.slug === 'atacado');
if (atacado && atacado.isActive === false) ok('Atacado e a INATIVA do print', 'isActive=false');
else fail('Atacado inativo', 'o print mostra `/atacado · ordem 5 · inativo`');

const ativas = lista.data.filter((c) => c.isActive).length;
if (ativas === lista.data.length - 1) ok('exatamente uma inativa na lista', `${ativas} de ${lista.data.length}`);
else fail('contagem de inativas', `${ativas} de ${lista.data.length} ativas`);

console.log('\n2. A contagem de produtos vem dos PRODUTOS, nao do demo de categorias\n');

const contagens = new Map(lista.data.map((c) => [c.slug, c.productCount]));
console.log('   ' + [...contagens].map(([s, n]) => `${s}=${n}`).join(' '));
const esperadoContagem = { tops: 2, macaquinhos: 2, conjuntos: 1, shorts: 1, atacado: 0, leggings: 1, streetwear: 1, croppeds: 1 };
let contagemOk = true;
for (const [slug, esperado] of Object.entries(esperadoContagem)) {
  if (contagens.get(slug) !== esperado) {
    contagemOk = false;
    fail(`contagem de ${slug}`, `esperava ${esperado}, veio ${contagens.get(slug)}`);
  }
}
if (contagemOk) ok('contagem por categoria bate com os produtos', '9 pecas distribuidas');

const total = metricas.totalProducts(lista.data);
if (total === 9) ok('soma das contagens = 9 produtos', 'nenhuma peca se perdeu na contagem');
else fail('soma das contagens', `esperava 9, veio ${total}`);

const somaHand = lista.data.reduce((s, c) => s + c.productCount, 0);
if (somaHand === 9) ok('nenhum produto ficou ORFAO', 'toda peca caiu em alguma categoria');

console.log('\n3. A linha renderiza como o print — os DOIS ramos de status\n');

const ativa = lista.data.find((c) => c.slug === 'tops');
const inativa = atacado;

const linhaAtiva = textos(renderToStaticMarkup(react.createElement(CategoryRow, {
  category: ativa, onEdit: () => {}, onToggle: () => {}, onDelete: () => {},
})));
const linhaInativa = textos(renderToStaticMarkup(react.createElement(CategoryRow, {
  category: inativa, onEdit: () => {}, onToggle: () => {}, onDelete: () => {},
})));

console.log('   ativa   :', linhaAtiva.slice(0, 120));
console.log('   inativa :', linhaInativa.slice(0, 120));

if (linhaAtiva.includes('/tops · ordem 1 · ativo')) ok('meta da ativa igual ao print', '/tops · ordem 1 · ativo');
else fail('meta da ativa', 'nao achei `/tops · ordem 1 · ativo`');

if (linhaInativa.includes('/atacado · ordem 5 · inativo')) ok('meta da inativa igual ao print', '/atacado · ordem 5 · inativo');
else fail('meta da inativa', 'nao achei `/atacado · ordem 5 · inativo`');

// Ramo 1: a ativa oferece DESATIVAR. Ramo 2: a inativa oferece ATIVAR.
// Provar so um dos dois nao prova nada — foi assim que um ramo invertido
// passou por uma rodada inteira de "validado" no Dashboard.
if (linhaAtiva.includes('Desativar')) ok('ativa oferece `Desativar`', '');
else fail('ativa sem Desativar', 'o ramo certo e Desativar');
if (!linhaAtiva.includes('Ativar')) ok('ativa NAO oferece `Ativar`', 'os dois verbos nao convivem');
else fail('ativa ofereceu Ativar', 'ramo invertido');

if (linhaInativa.includes('Ativar')) ok('inativa oferece `Ativar`', '');
else fail('inativa sem Ativar', 'o ramo certo e Ativar');
if (!linhaInativa.includes('Desativar')) ok('inativa NAO oferece `Desativar`', 'os dois verbos nao convivem');
else fail('inativa ofereceu Desativar', 'ramo invertido');

for (const [nome, texto] of [['ativa', linhaAtiva], ['inativa', linhaInativa]]) {
  if (texto.includes('Editar') && texto.includes('Excluir')) ok(`${nome} tem as 3 acoes`, 'toggle · Editar · Excluir');
  else fail(`${nome} acoes incompletas`, texto.slice(0, 80));
}

// A miniatura e CIRCULAR — medido no print. `rounded-full` e o que faz o circulo.
const htmlAtiva = renderToStaticMarkup(react.createElement(CategoryRow, {
  category: ativa, onEdit: () => {}, onToggle: () => {}, onDelete: () => {},
}));
if (htmlAtiva.includes('rounded-full')) ok('miniatura circular', 'rounded-full, como o print');
else fail('miniatura', 'o print mostra circulo, nao quadrado arredondado');

console.log('\n4. O modal\n');

const rascunhoNovo = form.emptyDraft(lista.data);
const modal = renderToStaticMarkup(react.createElement(CategoryForm, {
  open: true, onClose: () => {}, draft: rascunhoNovo, onDraftChange: () => {},
  editing: false, onSubmit: () => {}, errors: {},
}));
const modalTexto = textos(modal);
console.log('   modal :', modalTexto.slice(0, 180));

/**
 * TEXTO VISIVEL x ATRIBUTO — a distincao que esta bancada quase errou.
 *
 * Os tres primeiros campos do print (adm-031) NAO tem rotulo: o que nomeia
 * cada um e o `placeholder`. E placeholder e ATRIBUTO, nao texto: tirar as
 * tags e justamente o que o remove.
 *
 * A primeira versao desta bancada procurava `Nome` e `Slug (url)` no texto
 * limpo e acusava tres defeitos que nao existem. O codigo estava certo; a
 * AGULHA estava no lugar errado. Por isso os rotulos vao em `modalTexto` e os
 * placeholders vao contra o HTML cru.
 */
for (const [campo, esperado] of [
  ['titulo', 'Nova categoria'],
  ['rotulo imagem', 'Imagem (círculo)'],
  ['botao de upload', 'Upload'],
  ['rotulo ordem', 'Ordem'],
  ['label ativo', 'Ativo'],
  ['rodape cancelar', 'Cancelar'],
  ['rodape salvar', 'Salvar'],
]) {
  if (modalTexto.includes(esperado)) ok(`modal tem ${campo}`, esperado);
  else fail(`modal sem ${campo}`, `esperava "${esperado}"`);
}

for (const [campo, placeholder] of [
  ['campo 1 (sem rotulo)', 'Nome'],
  ['campo 2 (sem rotulo)', 'Slug (url)'],
  ['campo 3', 'URL da imagem'],
]) {
  if (modal.includes(`placeholder="${placeholder}"`)) ok(`placeholder de ${campo}`, placeholder);
  else fail(`placeholder de ${campo}`, `esperava placeholder="${placeholder}"`);
}

// O print tem `Ordem 7` com seis categorias: e `nextSortOrder`, nao `length+1`.
if (rascunhoNovo.sortOrder === '9') ok('ordem sugerida = 9 (maior+1 com 8 categorias)', 'a regra e o maior + 1');
else fail('ordem sugerida', `esperava 9, veio ${rascunhoNovo.sortOrder}`);

const seisCategorias = lista.data.slice(0, 6);
if (form.emptyDraft(seisCategorias).sortOrder === '7') ok('com 6 categorias sugere 7', 'reproduz o `Ordem 7` do print');
else fail('ordem com 6 categorias', `esperava 7, veio ${form.emptyDraft(seisCategorias).sortOrder}`);

// O modal de Categorias NAO tem cabecalho com X (o de Produtos tem).
if (!/<header/i.test(modal)) ok('modal sem cabecalho/X', 'o print nao mostra o X — hideHeader');
else fail('modal com cabecalho', 'o print deste modal nao mostra X');

if (modal.includes('max-w-md')) ok('modal na largura do print', 'max-w-md ~441px medidos');
else fail('largura do modal', 'esperava max-w-md');

const modalEdicao = textos(renderToStaticMarkup(react.createElement(CategoryForm, {
  open: true, onClose: () => {}, draft: form.draftFromCategory(ativa), onDraftChange: () => {},
  editing: true, onSubmit: () => {}, errors: {},
})));
if (modalEdicao.includes('Editar categoria')) ok('modo edicao muda o titulo', 'Editar categoria');
else fail('titulo da edicao', 'esperava "Editar categoria"');

console.log('\n5. Ordenacao: nao perde linha e o desempate e estavel\n');

const comEmpate = [
  { ...ativa, id: 'x1', name: 'Zebra', sortOrder: 3 },
  { ...ativa, id: 'x2', name: 'Alfa', sortOrder: 3 },
  { ...ativa, id: 'x3', name: 'Meio', sortOrder: 1 },
];
const asc = metricas.sortCategories(comEmpate, { field: 'sortOrder', direction: 'asc' });
const desc = metricas.sortCategories(comEmpate, { field: 'sortOrder', direction: 'desc' });

if (asc.length === comEmpate.length && desc.length === comEmpate.length) ok('ordenar nao perde linha', '3 -> 3 nos dois sentidos');
else fail('linha perdida na ordenacao', `${asc.length} / ${desc.length}`);

// Empate: Alfa antes de Zebra nos DOIS sentidos.
const iAlfaAsc = asc.findIndex((c) => c.name === 'Alfa');
const iZebraAsc = asc.findIndex((c) => c.name === 'Zebra');
const iAlfaDesc = desc.findIndex((c) => c.name === 'Alfa');
const iZebraDesc = desc.findIndex((c) => c.name === 'Zebra');
if (iAlfaAsc < iZebraAsc && iAlfaDesc < iZebraDesc) ok('empate desempata por nome nos DOIS sentidos', 'Alfa antes de Zebra sempre');
else fail('desempate instavel', `asc ${iAlfaAsc}/${iZebraAsc} desc ${iAlfaDesc}/${iZebraDesc}`);

if (asc[0].name === 'Meio') ok('a menor ordem vem primeiro', 'ordem 1 antes de 3');
else fail('ordenacao por ordem', `primeiro foi ${asc[0].name}`);

if (metricas.nextSortOrder([]) === 1) ok('lista vazia -> ordem 1', '');
else fail('nextSortOrder vazio', String(metricas.nextSortOrder([])));

// Ordem removida: 1,2,5 -> proxima e 6, NAO 4 (que e o defeito de `length+1`).
const comBuraco = [{ ...ativa, id: 'a', sortOrder: 1 }, { ...ativa, id: 'b', sortOrder: 2 }, { ...ativa, id: 'c', sortOrder: 5 }];
if (metricas.nextSortOrder(comBuraco) === 6) ok('ordem removida nao colide', '1,2,5 -> 6, nao 4');
else fail('nextSortOrder com buraco', `veio ${metricas.nextSortOrder(comBuraco)}`);

if (metricas.slugTaken(lista.data, 'TOPS')) ok('slug repetido e detectado', 'caixa normalizada');
else fail('slugTaken', 'TOPS deveria colidir com tops');

const topsId = lista.data.find((c) => c.slug === 'tops').id;
if (!metricas.slugTaken(lista.data, 'tops', topsId)) ok('editar mantendo o proprio slug nao acusa', 'exceptId funciona');
else fail('slugTaken com exceptId', 'acusou conflito consigo mesma');

console.log('\n6. O formulario valida o que importa\n');

const semNome = { ...rascunhoNovo, name: '', slug: '' };
const errosSemNome = form.validateDraft(semNome, lista.data);
if (errosSemNome.name && errosSemNome.slug) ok('nome e slug vazios reprovam', '2 erros');
else fail('validacao sem nome', JSON.stringify(errosSemNome));

const slugDup = { ...rascunhoNovo, name: 'Novo', slug: 'tops' };
if (form.validateDraft(slugDup, lista.data).slug) ok('slug duplicado reprova', '`tops` ja existe');
else fail('slug duplicado passou', 'a loja ficaria com duas rotas iguais');

const ordemZero = { ...rascunhoNovo, name: 'Nova', slug: 'nova', sortOrder: '0' };
if (form.validateDraft(ordemZero, lista.data).sortOrder) ok('ordem 0 reprova', '');
else fail('ordem 0 passou', 'a ordem comeca em 1');

const valido = { ...rascunhoNovo, name: 'Nova', slug: 'nova', sortOrder: '9' };
if (!form.hasErrors(form.validateDraft(valido, lista.data))) ok('rascunho valido passa', '');
else fail('rascunho valido reprovou', JSON.stringify(form.validateDraft(valido, lista.data)));

// Aplicar o nome gera o slug; depois de tocar no slug, para de acompanhar.
const passo1 = form.applyName(rascunhoNovo, 'Linha Praia');
const passo2 = form.applyName(passo1, 'Linha Praia Verão');
const passo3 = form.applySlug(passo2, 'praia-top');
const passo4 = form.applyName(passo3, 'Outro Nome');
if (passo2.slug === 'linha-praia-verao') ok('slug acompanha o nome ate ser tocado', passo2.slug);
else fail('slug automatico', passo2.slug);
if (passo4.slug === 'praia-top') ok('slug para de acompanhar depois de editado', passo4.slug);
else fail('slug apos toque', `esperava praia-top, veio ${passo4.slug}`);

// Sem URL de imagem, a capa e `null` — nao string vazia.
const semCapa = form.draftToCategory({ ...valido, imageUrl: '' }, { id: 'x', createdAt: '2026-01-01' });
if (semCapa.image === null) ok('sem URL -> capa null', 'a linha sabe que nao ha imagem');
else fail('capa sem URL', JSON.stringify(semCapa.image));

const comCapa = form.draftToCategory({ ...valido, imageUrl: 'https://exemplo/foto.jpg' }, { id: 'x', createdAt: '2026-01-01' });
if (comCapa.image && comCapa.image.url === 'https://exemplo/foto.jpg') ok('com URL -> capa montada', '');
else fail('capa com URL', JSON.stringify(comCapa.image));

if (comCapa.productCount === 0) ok('a gravacao nao inventa contagem', 'productCount sempre da leitura');
else fail('productCount gravado', 'o formulario nao deve gravar contador');

console.log('\n7. Estados de carregamento e vazio\n');

const vista = renderToStaticMarkup(react.createElement(CategoriesView));
const vistaTexto = textos(vista);
if (/skeleton/.test(vista)) ok('a tela abre em CARREGANDO', 'esqueleto antes dos dados');
else fail('estado de carregamento', 'nao achei o esqueleto');

const vazio = renderToStaticMarkup(react.createElement(
  require(join(OUT, 'src/components/ui/states.js')).EmptyState,
  { title: 'Nenhuma categoria encontrada.', description: 'Ajuste a busca ou o filtro para ver outros resultados.' },
));
if (textos(vazio).includes('Nenhuma categoria encontrada.')) ok('estado vazio diz o que houve', '');
else fail('estado vazio', 'texto nao renderizou');

// Filtrar por algo inexistente tem de sobrar zero — a lista nao pode "escorregar".
const semMatch = await dados.listCategories({ filters: { search: 'zzzz-nao-existe' } });
if (semMatch.data.length === 0) ok('busca sem resultado devolve lista vazia', '');
else fail('busca sem resultado', `veio ${semMatch.data.length}`);

const soInativas = await dados.listCategories({ filters: { status: 'inactive' } });
if (soInativas.data.length === 1 && soInativas.data[0].slug === 'atacado') ok('filtro `inativas` isola o Atacado', '');
else fail('filtro inativas', soInativas.data.map((c) => c.slug).join(','));

const soAtivas = await dados.listCategories({ filters: { status: 'active' } });
if (soAtivas.data.every((c) => c.isActive)) ok('filtro `ativas` nao deixa inativa passar', '');
else fail('filtro ativas', 'vazou uma inativa');

console.log('\n8. Importacoes cruzadas\n');

const conteudoData = readFileSync(join(SRC, 'lib/categorias/data.ts'), 'utf8');
if (/from '@\/lib\/produtos\/demo'/.test(conteudoData)) ok('data.ts e o unico ponto do join com Produtos', '');
else fail('join com Produtos', 'nao achei o import de produtos/demo em data.ts');

const conteudoRow = readFileSync(join(SRC, 'components/admin/categorias/category-row.tsx'), 'utf8');
if (!/from '@\/lib\/categorias\/demo'/.test(conteudoRow)) ok('nenhuma tela importa do demo', 'só data.ts conhece o demo');
else fail('tela importando demo', 'category-row.tsx nao pode conhecer demo.ts');

console.log('\n9. Sem supressao de tipo\n');

let supressoes = 0;
for (const f of arquivos) {
  const texto = readFileSync(f, 'utf8');
  const linhas = texto.split('\n');
  linhas.forEach((linha, i) => {
    if (/@ts-ignore|@ts-expect-error/.test(linha)) {
      supressoes += 1;
      fail('supressao de tipo', `${f.replace(raizProjeto + '\\', '')}:${i + 1}`);
    }
    // `: any` e `as any` — o `any` que esconde o problema.
    if (/[:<]\s*any\b|as any\b/.test(linha) && !/Array\.from|\.map\(/.test(linha)) {
      supressoes += 1;
      fail('any', `${f.replace(raizProjeto + '\\', '')}:${i + 1} — ${linha.trim().slice(0, 70)}`);
    }
  });
}
if (supressoes === 0) ok('nenhum @ts-ignore / @ts-expect-error / any no projeto', `${arquivos.length} arquivos`);

console.log('\n10. As duas decisoes da TELA que o print nao mostra\n');

// (a) A ordem sugerida ao CRIAR sai da lista completa e nao da filtrada. Se
// saisse da filtrada, uma criacao feita com a busca ligada proporia uma ordem
// ja ocupada por uma categoria que a busca escondeu — colisao silenciosa.
const soTops = lista.data.filter((c) => c.slug === 'tops');
if (form.emptyDraft(soTops).sortOrder === '2') ok('ordem do rascunho segue a lista que recebe', 'com 1 categoria sugere 2');
else fail('emptyDraft ignora o que recebe', `veio ${form.emptyDraft(soTops).sortOrder}`);
// E a tela passa a lista COMPLETA (8), nao a `visible` filtrada: com 8 a sugestao
// e 9, que e o que a bancada ja confere na secao 4. Aqui prova-se o outro lado:
// se a tela passasse `visible` (1 item), a sugestao seria 2 e colidiria.
const ordemSeFiltrado = Number(form.emptyDraft(soTops).sortOrder);
const ordemSeCompleto = Number(form.emptyDraft(lista.data).sortOrder);
if (ordemSeFiltrado !== ordemSeCompleto && ordemSeCompleto === 9) {
  ok('a tela precisa passar a lista COMPLETA', `filtrado daria ${ordemSeFiltrado}, completo da ${ordemSeCompleto}`);
} else {
  fail('ordem independe do filtro', `filtrado ${ordemSeFiltrado}, completo ${ordemSeCompleto}`);
}

// (b) Editar NAO pode zerar o productCount. O formulario nao conhece a
// contagem (ela vem da leitura), entao `draftToCategory` grava 0 de proposito —
// e a tela precisa restaurar o valor lido. Prova-se que o defeito existe e que
// a correcao da tela o desfaz.
const editadoCru = form.draftToCategory(form.draftFromCategory(ativa), { id: ativa.id, createdAt: ativa.createdAt });
if (editadoCru.productCount === 0) ok('o formulario devolve contagem 0 (por desenho)', 'draftToCategory nao conhece Produtos');
else fail('draftToCategory deveria zerar', `veio ${editadoCru.productCount}`);

const listaEditada = lista.data.map((c) => (c.id === ativa.id ? { ...editadoCru, productCount: c.productCount } : c));
const preservado = listaEditada.find((c) => c.id === ativa.id).productCount;
if (preservado === ativa.productCount && preservado > 0) ok('a tela preserva a contagem ao editar', `${ativa.name} segue com ${preservado}`);
else fail('editar zerou a contagem', `esperava ${ativa.productCount}, veio ${preservado}`);

const conteudoView = readFileSync(join(SRC, 'components/admin/categorias/categories-view.tsx'), 'utf8');
if (/emptyDraft\(categories\)/.test(conteudoView)) ok('a tela usa a lista completa ao criar', 'emptyDraft(categories), nao emptyDraft(visible)');
else fail('tela usa a lista filtrada ao criar', 'deveria ser emptyDraft(categories)');
if (/\{ \.\.\.next, productCount: category\.productCount \}/.test(conteudoView)) ok('a tela restaura o productCount lido', '');
else fail('a tela nao restaura o productCount', 'editar zeraria a contagem de Produtos');

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
