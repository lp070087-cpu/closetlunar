/**
 * Bancada do modulo Busca (adm-068).
 *
 * ================== O QUE ELA PRECISA PROVAR ==================
 *
 * A tela do print esta VAZIA nas duas listas, e um modulo que so sabe devolver
 * vazio passa por qualquer codigo quebrado que devolva vazio sempre. A bancada
 * tem que provar o CONTRARIO — que a agregacao existe e reage:
 *
 *   1. o agrupamento por `normalized || term` (e o `||` importa);
 *   2. a MEDIA de resultados por termo, e o corte `avg === 0` que separa as duas
 *      listas — a regra que decide o que e "busca sem resultado";
 *   3. o desempate por ordem de ENTRADA (o `Map` entra em ordem, o `sort` e
 *      estavel) — a mesma armadilha ja corrigida em Relatorios;
 *   4. o corte em 20, o `Math.round` do rotulo, e o `Nx` sem resultados;
 *   5. a tela: titulo, os dois paineis com os textos vazios do print, a dica com
 *      o `<strong>`, e os TRES periodos do `select`.
 *
 * A secao 6 e a prova ao contrario: um termo achado em 3 de 5 buscas tem
 * `avg > 0` e NAO pode cair na lista de sem-resultado — o arredondamento que
 * jogaria isso para zero esconderia o caso que a dica manda corrigir.
 *
 * Nao prova layout, cor, posicao, responsividade nem o `useEffect`
 * (`renderToStaticMarkup` nao roda efeito — a tela so mostra o estado inicial).
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-busca.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-busca');

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
  /src[\\/](lib[\\/]busca|components[\\/]admin[\\/]busca|app[\\/]admin[\\/]busca)[\\/]/.test(f),
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

const demo = require(join(OUT, 'src/lib/busca/demo.js'));
const dados = require(join(OUT, 'src/lib/busca/data.js'));
const metricas = require(join(OUT, 'src/lib/busca/metrics.js'));
const { SearchPanel, SearchTip } = require(join(OUT, 'src/components/admin/busca/search-panels.js'));
const { SearchView } = require(join(OUT, 'src/components/admin/busca/search-view.js'));

/* ------------------------------------------------------------- utilidades */

const normalizar = (s) => s.replace(/[\s ]+/g, ' ').trim();
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
function atributoDe(html, nome) {
  const achados = [];
  const re = new RegExp(`${nome}="([^"]*)"`, 'g');
  let casou;
  while ((casou = re.exec(html)) !== null) achados.push(casou[1]);
  return achados;
}
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

/** Uma linha crua, curta. */
const linha = (term, resultsCount, normalized = null) => ({ term, normalized, resultsCount });

/* ====================== 1. a demonstracao e o vazio ====================== */

console.log('\n1. a demonstracao — VAZIA, como o print');

const resultado = await dados.listSearchTerms(30);
if (Array.isArray(resultado.data) && resultado.data.length === 0)
  ok('`listSearchTerms` devolve lista VAZIA', 'o print adm-068 nao tem termo nenhum');
else fail('a demonstracao tem termo', JSON.stringify(resultado.data));

if (resultado.source === 'demo' && typeof resultado.reason === 'string' && resultado.reason.length > 0)
  ok('a leitura se declara `demo` e explica o motivo', 'nada finge vir do banco');
else fail('camada de dados', JSON.stringify({ source: resultado.source, reason: resultado.reason }));

if (!Object.is(resultado.data, demo.DEMO_SEARCH_TERMS))
  ok('a leitura devolve uma COPIA do array do modulo', 'mutacao na tela nao vaza para a demo global');
else fail('a leitura devolve o array do modulo', 'mutacao vaza');

/* ====================== 2. o agrupamento ====================== */

console.log('\n2. `aggregateSearch` — agrupa por `normalized || term` e tira a media');

const cruas = [
  linha('Camiseta', 0, 'camiseta'),
  linha('camiseta', 3, 'camiseta'),
  linha('camiseta', 0, 'camiseta'),
  linha('Vestido', 5, null),
  linha('Vestido', 5, null),
  linha('Boné', 0, 'bone'),
];
const agregado = metricas.aggregateSearch(cruas);
const porTermo = Object.fromEntries(agregado.map((t) => [t.term, t]));

if (agregado.length === 3)
  ok('as seis linhas viram TRES termos', '`Camiseta` + `camiseta` sao o mesmo');
else fail('contagem de termos', JSON.stringify(agregado.map((t) => t.term)));

if (porTermo['Camiseta'] && porTermo['Camiseta'].count === 3)
  ok('`normalized` igual soma em UMA linha', '`Camiseta`, `camiseta`, `camiseta` = 3 buscas');
else fail('agrupamento por `normalized`', JSON.stringify(porTermo.Camiseta));

if (porTermo['Vestido'] && porTermo['Vestido'].count === 2)
  ok('`normalized` nulo cai no proprio `term`', 'dois `Vestido` sem normalizacao = 2');
else fail('agrupamento sem `normalized`', JSON.stringify(porTermo.Vestido));

if (porTermo['Camiseta'].term === 'Camiseta')
  ok('o termo exibido e o PRIMEIRO da linha crua', '`Camiseta` — a grafia da cliente, nao uma canonica');
else fail('termo exibido', porTermo['Camiseta'].term);

/**
 * A MEDIA. `Camiseta` achou 0, 3 e 0 — media `1`. `Vestido` achou 5 e 5 — media
 * `5`. Se `avg` fosse o TOTAL ou o ULTIMO valor, os numeros mudariam.
 */
if (porTermo['Camiseta'].avg === 1 && porTermo['Vestido'].avg === 5)
  ok('`avg` e a MEDIA de resultados por busca', '`Camiseta` (0+3+0)/3 = 1 · `Vestido` (5+5)/2 = 5');
else fail('media', JSON.stringify([porTermo.Camiseta.avg, porTermo.Vestido.avg]));

/**
 * ================== O `||` E O `null`, E NAO O VAZIO ==================
 *
 * Um `normalized` de string VAZIA (`''`) e `falsy`, entao a chave cai no `term`.
 * Se a chave fosse `normalized` cru, todos os termos de normalizacao vazia
 * cairiam no MESMO balde `''` e virariam um termo so. A prova: dois termos
 * DIFERENTES, os dois com `normalized` vazio, nao podem se juntar.
 */
const vazios = metricas.aggregateSearch([
  linha('Alfa', 1, ''),
  linha('Beta', 1, ''),
]);
if (vazios.length === 2)
  ok('`normalized` vazio NAO junta termos diferentes', '`Alfa` e `Beta` com `\'\'` ficam separados');
else fail('`normalized` vazio virou chave', JSON.stringify(vazios.map((t) => t.term)));

/* ====================== 3. as duas listas ====================== */

console.log('\n3. as duas listas — o `avg === 0` separa, e o desempate e a ENTRADA');

/**
 * ================== A LISTA SEMEADA, TERMO A TERMO ==================
 *
 * QUATRO termos, os QUATRO com `count = 2` — um empate de quatro, para a prova de
 * desempate ter o que medir:
 *
 *   `achou`     2 buscas, ambas com 4 resultados  -> `avg` 4
 *   `CasoMeio`  2 buscas, uma com 0 e uma com 3   -> `avg` 1,5   <- o caso do meio
 *   `nadaA`     2 buscas, ambas com 0             -> `avg` 0     <- sem resultado
 *   `nadaB`     2 buscas, ambas com 0             -> `avg` 0     <- sem resultado
 *
 * A ORDEM DE ENTRADA e `achou`, `CasoMeio`, `nadaA`, `nadaB`, e ela NAO e a
 * alfabetica (`achou` antes de `nada…`, mas `CasoMeio` — maiuscula — vem DEPOIS
 * de `achou` e ANTES de `nadaA`). E o que distingue o desempate por entrada de um
 * por nome.
 */
const comErro = [
  linha('achou', 4, 'achou'),
  linha('achou', 4, 'achou'),
  linha('CasoMeio', 0, 'casomeio'),
  linha('CasoMeio', 3, 'casomeio'),
  linha('nadaA', 0, 'nadaa'),
  linha('nadaA', 0, 'nadaa'),
  linha('nadaB', 0, 'nadab'),
  linha('nadaB', 0, 'nadab'),
];
const top = metricas.topSearchTerms(comErro);
const vazia = metricas.emptySearchTerms(comErro);

if (top.length === 4)
  ok('`Termos mais pesquisados` tem TODOS os termos', 'inclusive os sem resultado — eles foram pesquisados');
else fail('lista de top', JSON.stringify(top.map((t) => [t.term, t.count])));

/**
 * O CORTE `avg === 0`. `CasoMeio` foi buscado 2 vezes e achou em UMA — media
 * 1,5, diferente de zero, entao NAO entra na lista de sem-resultado. Um
 * `Math.round` aplicado ANTES do corte o jogaria para `2` (ou um `Math.floor`
 * para `1`) — e se o corte fosse sobre o ULTIMO resultado da linha (0), ele
 * entraria indevidamente. As duas possibilidades erradas caem aqui.
 */
if (mesmo(vazia.map((t) => t.term), ['nadaA', 'nadaB']))
  ok('`Buscas sem resultado` = so o que tem `avg` ZERO', '`CasoMeio` (media 1,5) fica de fora');
else fail('lista de sem-resultado', JSON.stringify(vazia.map((t) => [t.term, t.avg])));

/**
 * ================== O DESEMPATE E A ORDEM DE ENTRADA ==================
 *
 * Os QUATRO termos tem `count = 2`. A saida tem que seguir a ENTRADA. Um
 * desempate por nome daria `CasoMeio, achou, nadaA, nadaB` (maiusculas antes em
 * `pt-BR`), e a entrada comeca em `achou` — as duas ordens divergem no PRIMEIRO
 * item, e e isso que a prova mede.
 */
const empatados = top.map((t) => t.term);
if (mesmo(empatados, ['achou', 'CasoMeio', 'nadaA', 'nadaB']))
  ok('o empate mantem a ordem de ENTRADA', '`achou`, `CasoMeio`, `nadaA`, `nadaB` — nao alfabetica');
else fail('desempate', JSON.stringify(empatados));

if (empatados[0] !== 'CasoMeio')
  ok('o desempate NAO e por nome', 'a ordem alfabetica comecaria em `CasoMeio`; a saida comeca em `achou`');
else fail('desempate virou alfabetico', JSON.stringify(empatados));

/** E a prova de que NAO ha ordem alfabetica: invertendo a entrada, inverte a saida. */
const invertidos = metricas.topSearchTerms([
  linha('CasoMeio', 0, 'casomeio'),
  linha('CasoMeio', 0, 'casomeio'),
  linha('nadaB', 0, 'nadab'),
  linha('nadaA', 0, 'nadaa'),
]).map((t) => t.term);
if (invertidos[0] === 'CasoMeio')
  ok('invertendo a entrada, o empate inverte junto', 'confirma que NAO ha ordem por nome escondida');
else fail('desempate nao e a entrada', JSON.stringify(invertidos));

/** `topSearchTerms` nao muta a entrada — a copia antes do `sort`. */
const antes = comErro.map((r) => `${r.term}/${r.resultsCount}`).join(',');
metricas.topSearchTerms(comErro);
if (comErro.map((r) => `${r.term}/${r.resultsCount}`).join(',') === antes)
  ok('as metricas nao mutam as linhas cruas', 'copia antes de ordenar');
else fail('as linhas foram mutadas', '`sort` sem copia');

/* ====================== 4. o corte de 20 e os rotulos ====================== */

console.log('\n4. o corte em 20, o `Math.round` e o rotulo de volume');

const muitas = [];
for (let i = 0; i < 25; i += 1) muitas.push(linha(`t${String(i).padStart(2, '0')}`, 1, `t${i}`));
// o ultimo tem volume maior: se o corte pegasse os ULTIMOS, ele apareceria
muitas.push(linha('t00', 9, 't0'));
const cortada = metricas.topSearchTerms(muitas);
if (cortada.length === 20 && cortada[0].term === 't00')
  ok('corta em VINTE, os de MAIOR volume', '25 termos + 1 repetido — so 20 saem, o `t00` na frente');
else fail('corte de 20', JSON.stringify([cortada.length, cortada[0] && cortada[0].term]));

if (metricas.resultsLabel({ term: 'x', count: 12, avg: 3.4 }) === '12x · 3 result.')
  ok('o rotulo e `12x · 3 result.` com `Math.round`', 'media 3,4 vira `3 result.`');
else fail('rotulo de resultados', metricas.resultsLabel({ term: 'x', count: 12, avg: 3.4 }));

if (metricas.resultsLabel({ term: 'x', count: 1, avg: 0 }) === '1x · 0 result.' &&
    metricas.countLabel({ term: 'x', count: 5, avg: 0 }) === '5x')
  ok('sem resultado mostra `0 result.` e a lista vermelha mostra so `5x`', 'os dois rotulos do print');
else fail('rotulos', JSON.stringify([metricas.resultsLabel({ term: 'x', count: 1, avg: 0 }), metricas.countLabel({ term: 'x', count: 5, avg: 0 })]));

if (mesmo([...metricas.SEARCH_WINDOWS], [7, 30, 90]) && metricas.DEFAULT_WINDOW === 30)
  ok('as TRES janelas (7/30/90) e o padrao 30', 'o periodo ativo do print');
else fail('janelas', JSON.stringify(metricas.SEARCH_WINDOWS));

/* ====================== 5. os paineis e a tela ====================== */

console.log('\n5. `SearchPanel`, `SearchTip` e `SearchView`');

const painelCheio = render(SearchPanel, {
  title: 'Termos mais pesquisados',
  empty: 'Sem dados ainda.',
  items: [{ term: 'vestido', count: 12, avg: 3.4 }],
});
const painelVazio = render(SearchPanel, {
  title: 'Termos mais pesquisados',
  empty: 'Sem dados ainda.',
  items: [],
});

if (textos(painelCheio).includes('vestido') && textos(painelCheio).includes('12x · 3 result.'))
  ok('o painel desenha termo e rotulo', '`vestido` · `12x · 3 result.`');
else fail('painel cheio', textos(painelCheio));

if (textos(painelVazio).includes('Sem dados ainda.') && !textos(painelVazio).includes('12x'))
  ok('a lista vazia cai no texto do print', '`Sem dados ainda.`');
else fail('painel vazio', textos(painelVazio));

const painelPerigo = render(SearchPanel, {
  title: 'Buscas sem resultado',
  empty: 'Nenhuma — ótimo trabalho!',
  items: [{ term: 'boné', count: 5, avg: 0 }],
  tone: 'danger',
});
if (textos(painelPerigo).includes('5x') && painelPerigo.includes('text-danger') && !painelPerigo.includes('result.'))
  ok('a lista sem resultado mostra `5x` em VERMELHO', '`text-danger`, sem o `result.`');
else fail('painel de perigo', textos(painelPerigo));

if (painelCheio.includes('rounded border border-border bg-card') && !painelCheio.includes('rounded-2xl'))
  ok('a caixa e `rounded` (≈3px), como Favoritos', 'medido em `235943.png`');
else fail('caixa do painel', 'raio diferente');

const dica = render(SearchTip, {});
if (dica.includes('<strong') && textos(dica).includes('palavras-chave / sinônimos'))
  ok('a dica tem o `<strong>` do print', '`palavras-chave / sinônimos` em negrito de verdade');
else fail('dica', dica.slice(0, 200));

const tela = render(SearchView, {});
const textoTela = textos(tela);

if (textoTela.includes('Relatórios de busca') && tela.includes('font-serif text-2xl'))
  ok('o titulo serif do print', '`Relatórios de busca` em `font-serif text-2xl`');
else fail('titulo', textoTela.slice(0, 160));

/** O estado inicial NAO pode ser o vazio do print — a leitura ainda nao aconteceu. */
if (textoTela.includes('Carregando...') && !textoTela.includes('Sem dados ainda.'))
  ok('antes de ler, mostra `Carregando...`', 'o vazio so aparece depois da leitura');
else fail('estado inicial', textoTela.slice(0, 200));

const opcoes = atributoDe(tela, 'value').filter((v) => ['7', '30', '90'].includes(v));
if (opcoes.length === 3 && tela.includes('>Últimos 7 dias</option>') && tela.includes('>Últimos 90 dias</option>'))
  ok('os TRES periodos no `select`', '`Últimos 7 / 30 / 90 dias`');
else fail('opcoes do select', JSON.stringify(opcoes));

/**
 * A opcao ATIVA. `value="30"` tem que sair com `selected` — o `useState` nasce no
 * `DEFAULT_WINDOW`. Se o padrao fosse outro, o print nao bateria.
 */
if (/<option value="30"[^>]*selected/.test(tela))
  ok('`Últimos 30 dias` e a opcao ATIVA', 'o periodo do print, vindo de `DEFAULT_WINDOW`');
else fail('opcao ativa', 'o `30` nao esta selecionado');

if (!textoTela.includes('Sugestões') && !textoTela.includes('Ações rápidas'))
  ok('a secao `Sugestões` inventada NAO existe', 'o placeholder descrevia um bloco que nenhum print tem');
else fail('bloco inventado', '`Sugestões` na tela');

/* ====================== 6. a rota e o codigo ====================== */

console.log('\n6. a rota `/admin/busca` — a correcao do `references`');

const pagina = arquivo('src/app/admin/busca/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('SearchView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', 'o placeholder foi substituido');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (pagina.includes('adm-068'))
  ok('a faixa CORRETA registrada: `adm-068`', 'dizia `adm-067 a adm-068`');
else fail('faixa de prints', 'a correcao nao esta documentada');

if (!/adm-067/.test(paginaLimpa))
  ok('`adm-067` (Favoritos) nao aparece como referencia', 'era o valor errado; agora so na prosa');
else fail('`adm-067` como referencia', 'a faixa estendida sobreviveu');

if (!paginaLimpa.includes('structure') && !paginaLimpa.includes('Sugestões'))
  ok('o array `structure` inventado sumiu', 'nem a lista, nem a terceira secao');
else fail('blocos do placeholder', 'a lista inventada sobreviveu');

const fonte = [
  arquivo('src/lib/busca/types.ts'), arquivo('src/lib/busca/demo.ts'),
  arquivo('src/lib/busca/metrics.ts'), arquivo('src/lib/busca/data.ts'),
  arquivo('src/components/admin/busca/search-panels.tsx'),
  arquivo('src/components/admin/busca/search-view.tsx'), pagina,
].join('\n');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonte)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', 'ha conexao de banco');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', 'o typecheck nao foi silenciado');
else fail('supressao de tipo', 'ha um `@ts-ignore`');

if (!/new Date\(|Date\.now\(/.test(semComentarios(arquivo('src/lib/busca/metrics.ts'))))
  ok('`metrics.ts` nao le o relogio', 'o recorte de periodo e da camada de dados');
else fail('`metrics.ts` le o relogio', 'a janela de datas deveria estar em `data.ts`');

/* ====================== 7. provas ao contrario ====================== */

console.log('\n7. provas ao contrario — o defeito tem que REPROVAR');

if (!semComentarios('/* adm-067 */ const x = 1;').includes('adm-067') &&
    semComentarios('/* adm-067 */ const x = 1;').includes('const x = 1'))
  ok('`semComentarios` apaga comentario e guarda o codigo', 'a citacao do valor errado nao conta como referencia');
else fail('`semComentarios`', 'ou comentou codigo, ou deixou passar');

if (!textos('<div aria-label="x"></div>').includes('x'))
  ok('`textos` apaga ATRIBUTOS', 'por isso a prova de `selected` le o HTML cru');
else fail('`textos`', 'nao apaga atributos');

if (contar('a a a', 'a') === 3 && contar('abc', 'z') === 0)
  ok('`contar` conta TODAS e devolve 0 para ausente', 'um `includes` nao distinguiria 2 de 3');
else fail('`contar`', String(contar('a a a', 'a')));

/** Uma lista de UM item nao pode cair no vazio — o defeito de `length`. */
const umSo = render(SearchPanel, { title: 't', empty: 'vazio', items: [{ term: 'só', count: 1, avg: 0 }] });
if (textos(umSo).includes('só') && !textos(umSo).includes('vazio'))
  ok('um item desenha a lista, nao o texto vazio', 'o vazio e so com zero');
else fail('painel com um item', textos(umSo));

/** E uma lista vazia nao desenha `<li>` nenhum — a prova inversa. */
const zero = render(SearchPanel, { title: 't', empty: 'vazio', items: [] });
if (!zero.includes('<li') && !zero.includes('<ul'))
  ok('lista vazia nao desenha `<ul>` nem `<li>`', 'so o texto vazio');
else fail('lista vazia', zero);

/** A LISTA DE SEM-RESULTADO de um termo achado tem que ser VAZIA. */
if (metricas.emptySearchTerms([linha('achou', 3, 'achou')]).length === 0)
  ok('um termo que achou nao entra em `sem resultado`', '`avg` 3 — filtrado fora');
else fail('sem-resultado com termo que achou', 'o filtro `avg === 0` nao pegou');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
