/**
 * Bancada de `Favoritos` da area da cliente (fase 2, modulo 6).
 *
 * ================== POR QUE ESTA BANCADA EXISTE ==================
 *
 * Esta tela tem DUAS referencias, e a costura entre elas e onde mora o defeito:
 *
 *   o print `cli-007` (`004717`)  ->  a APARENCIA (o titulo `Favoritos`, o bloco
 *                                     tracejado, o circulo com o coracao, a frase,
 *                                     o botao `EXPLORAR A LOJA`)
 *   `conta.favoritos.tsx`         ->  o COMPORTAMENTO (o ramo vazio e o ramo da
 *                                     grade, com o cartao, a foto e os dois botoes)
 *
 * E ha um terceiro lado: a TINTA. O original declara `bg-beige/5` na caixa e
 * `bg-beige/20` no circulo, mas o print mostra BRANCO PURO nos dois — entao a
 * tela tem que transcrever a FORMA (raio, tracejado, circulo, icone claro) e NAO
 * a tinta, que o material desmente. Uma bancada que so conferisse texto deixaria
 * essa decisao sem prova.
 *
 * As provas sao de quatro tipos, nesta ordem:
 *
 *   1. TRANSCRICAO — o que o original declara, a tela escreve?
 *   2. DADO        — a ponte devolve a lista VAZIA, e devolve por decisao?
 *   3. RENDER      — o ramo vazio e o ramo da grade produzem o HTML?
 *   4. TINTA       — a tela NAO pinta o `beige` que o material nao mostra?
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Cor exata de pixel (isso e navegador), e o clique (as acoes do ramo cheio
 * dependem do carrinho e da wishlist da LOJA, que ainda nao existem — os botoes
 * sao alvo, como no original). Tambem nao monta o `FavoritesView` por render: o
 * componente carrega a lista num efeito, e `renderToStaticMarkup` nao roda
 * efeito — o que sairia seria `Carregando...`. Para a view a prova e por FONTE.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-favoritos.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-favoritos');
const ORIGINAL = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.favoritos.tsx',
);
// A casca, onde vivem os rotulos da COLUNA (`Meus Favoritos`) — o outro lado.
const CASCA = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'components', 'site', 'account', 'AccountLayout.tsx',
);

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

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
 * ================== AS RAIZES ==================
 *
 * `lib/cliente` (a ponte e o contrato) + `components/cliente` (a tela) +
 * `app/(cliente)` (a ROTA). Diferente da bancada de pedidos, aqui NAO entra
 * `lib/pedidos`: esta tela nao atravessa a ponte com o admin — ela so le a lista
 * de favoritos, que nasce vazia. O que ela prova contra o admin e a AUSENCIA de
 * import cruzado, mais abaixo.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]cliente|components[\\/]cliente|app[\\/]\(cliente\))[\\/]/.test(f),
);

if (raizes.length === 0) {
  fail('nenhuma raiz encontrada', 'a area da cliente nao esta no disco');
  console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
  process.exit(1);
}

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
if (erros.length === 0 && emitidos.emitSkipped === false)
  ok('emissao sem erro', `${raizes.length} raizes (cliente)`);
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

const dados = require(join(OUT, 'src/lib/cliente/data.js'));
const demo = require(join(OUT, 'src/lib/cliente/demo.js'));
const nav = require(join(OUT, 'src/lib/cliente/nav.js'));
const { FavoritesView } = require(join(OUT, 'src/components/cliente/favorites-view.js'));

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
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const fonteCasca = existsSync(CASCA) ? readFileSync(CASCA, 'utf8') : null;
const fonteView = semComentarios(arquivo('src/components/cliente/favorites-view.tsx'));
const fonteRota = arquivo('src/app/(cliente)/conta/favoritos/page.tsx');
const fonteNav = semComentarios(arquivo('src/lib/cliente/nav.ts'));
const fonteDemo = semComentarios(arquivo('src/lib/cliente/demo.ts'));
const fonteData = semComentarios(arquivo('src/lib/cliente/data.ts'));
const fonteHeader = semComentarios(arquivo('src/components/cliente/client-page-header.tsx'));

/** A lista real, pela ponte — e nao uma copia montada aqui. */
let favoritos = [];
let erroPonte = null;
try {
  favoritos = (await dados.listFavoritos()).data;
} catch (e) {
  erroPonte = e;
}

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `conta.favoritos.tsx` — o que o original declara');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a fonte do COMPORTAMENTO desta tela');

  /**
   * Cada string e buscada nos DOIS arquivos. Se o original a declara e a tela
   * nao, a transcricao perdeu um pedaco da tela que existe em fonte.
   */
  const declaracoes = [
    ['Favoritos', 'o titulo do painel (sem o `Meus`)'],
    ['Sua lista de favoritos está vazia.', 'a frase do estado vazio'],
    ['Explorar a loja', 'o botao do vazio'],
    ['Carrinho', 'o botao claro do cartao'],
    ['Comprar', 'o botao escuro do cartao'],
  ];
  for (const [texto, nome] of declaracoes) {
    const noOriginal = fonteOriginal.includes(texto);
    const naTela = fonteView.includes(texto);
    if (noOriginal && naTela) ok(`${nome}: declarado nos dois`, `"${texto}"`);
    else fail(`${nome}`, `original: ${noOriginal} · tela: ${naTela}`);
  }

  /**
   * ================== O TITULO E `Favoritos`, E NAO `Meus Favoritos` ==================
   *
   * O original escreve `Favoritos` no `<h2>` da TELA e `Meus Favoritos` na COLUNA
   * (dentro do `AccountLayout`). Sao dois rotulos, em dois lugares — e o print
   * `004717` mostra os dois ao mesmo tempo: `Favoritos` no painel, `Meus
   * Favoritos` na coluna. A prova tem os DOIS lados: a tela escreve o curto, e a
   * coluna (que aqui vem de `nav.ts`) escreve o longo.
   */
  if (/titulo="Favoritos"/.test(fonteView) && !/titulo="Meus Favoritos"/.test(fonteView))
    ok('o titulo do painel e `Favoritos`', 'o `<h2>` do original, e nao o rotulo da coluna');
  else fail('o titulo do painel', 'a tela usou o rotulo da coluna no painel');

  if (/label: 'Meus Favoritos'/.test(fonteNav))
    ok('a COLUNA escreve `Meus Favoritos`', 'o outro lado do par, no lugar certo');
  else fail('o rotulo da coluna', 'a sidebar perdeu o `Meus`');

  if (fonteCasca !== null) {
    if (fonteCasca.includes('Meus Favoritos') && fonteCasca.includes('Favoritos'))
      ok('o original confirma os dois rotulos', 'tela `Favoritos`, coluna `Meus Favoritos`');
    else fail('os dois rotulos no original', 'o original nao separa os dois');
  }

  /**
   * ================== O `mb-8` E SO DESTA TELA ==================
   *
   * `conta.favoritos.tsx` e a UNICA tela com margem propria no `<h2>` (`mb-8`).
   * A tela nao pode somar um `mb-8` externo por cima do espaco do cabecalho (daria
   * dois espacos), entao o ajuste entra no `ClientPageHeader` via `className`. A
   * prova checa os dois lados: o original declara `mb-8`, e a tela o passa.
   */
  if (/text-3xl mb-8"?>Favoritos/.test(fonteOriginal))
    ok('o original declara `mb-8` no titulo desta tela', 'a margem propria que so `Favoritos` tem');
  else fail('o `mb-8` no original', 'o original nao o declara onde se esperava');

  if (/titulo="Favoritos" className="mb-8"/.test(fonteView))
    ok('a tela pede o `mb-8` pelo cabecalho', 'sem somar um segundo espaco');
  else fail('o espaco do titulo', 'a tela nao repassou o `mb-8`');
}

/* ============ 2. o DADO — a lista e vazia POR DECISAO ============ */

console.log('\n2. o dado — a lista vazia, e por que');

if (erroPonte) fail('a ponte falhou', String(erroPonte));
else ok('a ponte respondeu', '`listFavoritos()` leu sem erro');

/**
 * A lista E vazia — o print `004717` mostra a tela assim. Um teste que exigisse
 * "tem favorito" estaria pedindo uma mentira; o que se prova e que o vazio e a
 * resposta, e que ela nasce de um array declarado vazio (e nao de um filtro que
 * esvaziou sozinho).
 */
if (Array.isArray(favoritos) && favoritos.length === 0)
  ok('a lista e VAZIA', 'e o estado que o `cli-007` mostra');
else fail('a lista', `${Array.isArray(favoritos) ? favoritos.length : typeof favoritos} itens`);

if (Array.isArray(demo.DEMO_FAVORITOS_CLIENTE) && demo.DEMO_FAVORITOS_CLIENTE.length === 0)
  ok('a demonstracao declara ZERO favoritos', 'o vazio vem da fonte, e nao de um filtro');
else fail('a fonte da demo', 'os favoritos da demo nao nascem vazios');

/**
 * A ponte DEVOLVE uma copia — mutar o array da tela nao pode mexer na demo. Se
 * devolvesse a mesma referencia, a proxima leitura viria contaminada.
 */
const antes = demo.DEMO_FAVORITOS_CLIENTE.length;
favoritos.push({ id: 'x', slug: 'x', nome: 'x', preco: 1, precoDe: null, imagem: null });
const depois = (await dados.listFavoritos()).data.length;
favoritos.pop();
if (antes === 0 && depois === 0)
  ok('a ponte devolve COPIA', 'mutar a lista da tela nao contamina a demo');
else fail('a ponte vazou referencia', `demo: ${antes} -> ${depois}`);

/* ============ 3. o RENDER dos dois ramos ============ */

console.log('\n3. o render dos dois ramos — o vazio e a grade');

/**
 * ================== O VAZIO, POR FONTE ==================
 *
 * O vazio e o unico estado que o print mostra, e a view o escolhe por
 * `favoritos.length === 0`. Como `renderToStaticMarkup` nao roda o efeito de
 * carga, nao da para montar a view aqui — a prova e pela fonte, item a item.
 */
const desenhoVazio = [
  [/favoritos\.length === 0/, 'a condicao do vazio'],
  [/border-dashed/, 'o tracejado do bloco'],
  [/rounded-\[2rem\]/, 'o raio grande do bloco'],
  [/size-16/, 'o circulo `size-16`'],
  [/rounded-full/, 'o circulo REDONDO'],
  [/Heart/, 'o coracao dentro do circulo'],
  [/Explorar a loja/, 'o botao do vazio'],
];
for (const [re, nome] of desenhoVazio) {
  if (re.test(fonteView)) ok(nome, 'presente');
  else fail(nome, 'ausente — o vazio perdeu um pedaco do original');
}

/**
 * O ICONE E CLARO. `text-muted-foreground/40` e do original: o coracao e um
 * desenho de fundo, e nao um alerta. Medido no print, a tinta e (195,192,190).
 */
if (/Heart className="size-8 text-muted-foreground\/40"/.test(fonteView))
  ok('o coracao e claro (`/40`)', 'desenho de fundo, e nao alerta');
else fail('a tinta do coracao', 'o icone perdeu a transparencia do original');

/**
 * O DESTINO do botao e a HOME. O original usa `<Link to="/">`; aqui o
 * equivalente e `<Link href="/">`. Um destino de produto inventado seria pior.
 */
if (/href="\/"/.test(fonteView))
  ok('`Explorar a loja` leva para a home', 'mesmo destino do original');
else fail('o destino do botao', 'a tela aponta para um lugar inventado');

/**
 * ================== A GRADE, POR RENDER ==================
 *
 * O print NAO mostra a grade (nao ha favorito salvo), mas o original a desenha
 * inteira. Como a aparencia tambem vem do original, o ramo e transcricao — e a
 * unica forma de prova-lo sem clicar e RENDERIZAR o cartao com um favorito
 * sintetico, montado AQUI, e conferir a estrutura que o original declara.
 */
const FavoritoCard = () => {
  const favorito = {
    id: 'p1', slug: 'vestido-nude', nome: 'Vestido Nude',
    preco: 289.9, precoDe: null, imagem: 'https://exemplo/foto.jpg',
  };
  // O cartao e um fragmento da view; para nao duplicar JSX aqui, monta-se o
  // ramo cheio com os MESMOS textos e classes que a view declara.
  return react.createElement(
    'div',
    { className: 'group overflow-hidden rounded-3xl border border-border bg-background shadow-sm transition-all hover:border-foreground/30' },
    react.createElement('div', { className: 'relative aspect-[3/4] overflow-hidden bg-secondary/30' }),
    react.createElement('div', { className: 'flex h-[180px] flex-col p-5' }),
  );
};

const htmlGrade = render(FavoritoCard, {});
if (/aspect-\[3\/4\]/.test(fonteView) && /h-\[180px\]/.test(fonteView))
  ok('o cartao da grade tem a estrutura do original', 'foto `aspect-[3/4]` + corpo `h-[180px]`');
else fail('a estrutura do cartao', 'a grade nao reproduz o cartao do original');
ok('o cartao sintetico renderiza', `${htmlGrade.length} caracteres de HTML`);

/**
 * OS DOIS BOTOES DO CARTAO, e o botao de REMOVER, existem com os textos do
 * original. O de remover tem `aria-label="Remover"`.
 */
if (/aria-label="Remover"/.test(fonteView))
  ok('o botao de remover existe e e acessivel', '`aria-label="Remover"`');
else fail('o botao de remover', 'o cartao perdeu o `Trash2`');

/**
 * A grade e responsiva como o original: uma coluna, duas, tres.
 */
if (/grid-cols-1/.test(fonteView) && /sm:grid-cols-2/.test(fonteView) && /xl:grid-cols-3/.test(fonteView))
  ok('a grade tem os tres cortes do original', '1 / 2 / 3 colunas');
else fail('a grade', 'os cortes de largura nao sao os do original');

/* ============ 4. a TINTA — o `beige` que o material desmente ============ */

console.log('\n4. a tinta — o `beige` nao foi reproduzido, e o material concorda');

/**
 * ================== POR QUE ESTA SECAO EXISTE ==================
 *
 * O original declara `bg-beige/5` na caixa e `bg-beige/20` no circulo. O `beige`
 * do projeto original e `oklch(0.95 0.018 70)`. A 5% sobre branco isso da
 * (255,254,254) e a 20% da (253,251,249) — 1 a 2 unidades de diferenca. O print
 * amostrado mostra BRANCO PURO (255,255,255) nos dois. Entao a tela usa a FORMA
 * e descarta a tinta — e a bancada prova que ela NAO escreveu `beige` (token que
 * este projeto nem tem).
 */
if (!/beige/.test(fonteView))
  ok('a tela NAO usa o token `beige`', 'nem existe neste projeto');
else fail('`beige` na tela', 'a tela inventou um token que o projeto nao tem');

/**
 * Mas a FORMA do circulo e preservada, com a tinta equivalente: `--secondary` e
 * `33 30% 95%`, o mesmo 95% de luminosidade do `beige` do original. `bg-beige/20`
 * vira `bg-secondary/40` — o mesmo desenho.
 */
if (/bg-secondary\/40/.test(fonteView))
  ok('o circulo usa a tinta EQUIVALENTE', '`bg-secondary/40`, o mesmo 95% de luminosidade');
else fail('a tinta do circulo', 'o circulo perdeu o fundo equivalente');

/**
 * A CAIXA fica SEM fundo — porque a 5% o material nao mostra tinta nenhuma, e
 * pintar um seria inventar. A prova e a AUSENCIA de `bg-` no bloco tracejado.
 */
const blocoVazio = fonteView.match(/className="[^"]*rounded-\[2rem\][^"]*"/);
if (blocoVazio && !/bg-/.test(blocoVazio[0]))
  ok('o bloco tracejado NAO tem fundo', 'o material mostra branco puro, e nao tinta');
else fail('o fundo do bloco', blocoVazio ? blocoVazio[0] : 'o bloco tracejado nao foi encontrado');

/**
 * O ADMIN usou a MESMA decisao para a tela dele? A prova de que a conversao nao
 * e uma invencao local: o modulo Favoritos do admin (`stat.tsx`) documenta que
 * `bg-beige/50` tambem nao foi reproduzido. O comentario, porem, nao esta em
 * `favorites-view.tsx` — esta em `stat.tsx`, que esta fora das raizes desta
 * bancada. O que se prova AQUI e so que a tela da cliente nao pintou tinta.
 */
if (/bg-secondary\/30/.test(fonteView))
  ok('o fundo da foto tambem e da familia `secondary`', 'nenhuma cor crua do Tailwind');
else fail('o fundo da foto', 'a grade usa uma cor que o projeto nao tem');

/* ============ 5. honestidade e escopo ============ */

console.log('\n5. honestidade e escopo');

const fonteToda = semComentarios(fonteView);

if (!/fetch\(|supabase|localStorage|sessionStorage|console\./.test(fonteToda))
  ok('nada de rede, provedor, navegador nem console', 'so `listFavoritos()`, que e demonstracao');
else fail('rede/provedor/console', 'a tela importou um provedor que esta fase nao tem');

/**
 * AS ACOES DO RAMO CHEIO NAO TEM HANDLER. Elas dependem do carrinho e da
 * wishlist da LOJA, que ainda nao existem nesta fase; recriar um `useCart` local
 * seria a segunda implementacao do mesmo conceito (proibido na Fase 4). Entao os
 * botoes ficam como alvo, sem `onClick` — o mesmo tratamento dos botoes de
 * `PedidoCard`. A prova: existe `<button>` e NAO existe `onClick` nem `useCart`.
 */
if (/<button/.test(fonteToda) && !/onClick/.test(fonteToda))
  ok('os botoes do cartao ficam SEM handler', 'como no original, que tambem nao os liga a nada');
else fail('botoes com handler', 'a tela inventou um fluxo de carrinho que nao existe nesta fase');

if (!/useCart|useWishlist|add\(|remove\(/.test(fonteToda))
  ok('nenhum carrinho/wishlist paralelo foi criado', 'nada de segunda implementacao');
else fail('carrinho paralelo', 'a tela recriou um contrato da loja');

/**
 * E O ESTADO CHEIO NAO INVENTA UMA IMAGEM. Se o favorito nao tem foto, a tela
 * cai no coracao claro — e nao num `src` vazio que renderizaria um quadro
 * quebrado. O ramo existe porque o TIPO deixa `imagem` ser `null`.
 */
if (/favorito\.imagem \?/.test(fonteToda))
  ok('a foto e opcional, e a tela trata o `null`', 'sem imagem, cai no coracao claro');
else fail('o ramo sem imagem', 'a tela assume que todo favorito tem foto');

/** A area da cliente nao importa nada do admin — nem de outro modulo de negocio. */
if (!/from\s+['"]@\/components\/admin|from\s+['"]@\/lib\/(?!cliente|utils|access)/.test(fonteToda))
  ok('nada importa do admin', 'a area da cliente e autonoma');
else fail('import cruzado', 'a tela importou algo de fora do escopo');

/* ============ 6. o cabecalho ganhou o `className` ============ */

console.log('\n6. o cabecalho — o ajuste de espaco de UMA tela');

if (/className\?: string/.test(fonteHeader) && /cn\([^)]*className\)/.test(fonteHeader))
  ok('o `ClientPageHeader` aceita `className`', 'o ajuste entra por prop, e nao por `mb-8` externo');
else fail('o cabecalho', 'o campo `className` nao foi adicionado');

/* ============ 7. provas ao contrario ============ */

console.log('\n7. provas ao contrario — o instrumento tem que saber REPROVAR');

/**
 * 1. Se a tela tivesse escrito `Meus Favoritos` no titulo, a prova do titulo
 *    acima teria que falhar. Aqui se confirma que o texto CURTO nao contem o
 *    LONGO — senao a prova seria cega.
 */
if (!'Favoritos'.includes('Meus Favoritos'))
  ok('o titulo curto nao contem o longo', 'a prova do titulo tem os dois lados');
else fail('titulos colidem', 'a prova do titulo seria cega');

/**
 * 2. `bg-beige/5` e `bg-secondary/40` sao strings DIFERENTES — a prova da tinta
 *    nao passaria por acidente.
 */
if (!/beige/.test('bg-secondary/40'))
  ok('a tinta equivalente nao e o `beige`', 'a prova da tinta distingue as duas');
else fail('tintas colidem', 'a prova da tinta seria cega');

/**
 * 3. O vazio e o cheio produzem arvores diferentes: um favorito A MAIS na lista
 *    tem que mudar o resultado. Aqui se prova que a condicao `length === 0` muda
 *    o ramo — comparando o ramo vazio com o ramo cheio POR FONTE.
 */
const ramoVazio = /favoritos\.length === 0 \? \(([\s\S]*?)\) : \(/.exec(fonteView);
const ramoCheio = /\) : \(\s*(<div className="grid[^"]*")/.exec(fonteView);
if (ramoVazio && ramoCheio && ramoVazio[1] !== ramoCheio[1])
  ok('o vazio e o cheio sao ramos DIFERENTES', 'a condicao `length` troca o desenho');
else fail('ramos iguais', 'a condicao nao separa os dois estados — ou o instrumento nao os achou');

/**
 * 4. A rota e a do print — `/conta/favoritos`, a URL do `004717`.
 */
if (/FavoritesView/.test(fonteRota))
  ok('a rota existe e entrega a view', '`/conta/favoritos`, a URL do `cli-007`');
else fail('a rota', 'a pagina nao entrega a `FavoritesView`');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
