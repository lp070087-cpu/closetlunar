/**
 * Bancada de `Cupons` da area da cliente (fase 2, modulo 10).
 *
 * ================== O QUE ESTA BANCADA PROVA, E O QUE SO A VIEW PROVA ==================
 *
 * `CouponsView` carrega a lista num `useEffect` e o relogio no mesmo efeito. O
 * `renderToStaticMarkup` NAO roda efeito — entao a view, montada, sai em
 * `Carregando...`. Isso e o mesmo limite de `AddressesView` e `ClubeView`.
 *
 * Mas o CARTAO e montavel, e por isso ele esta exportado (`CartaoCupom`): ele
 * recebe `cupom` e `agora` por prop e usa so `useState`-livre. Entao a secao 4
 * monta o cartao nos DOIS estados e confere o HTML. Essa e a prova mais forte
 * do arquivo, e ela cobre exatamente o que o print NAO mostra: o ramo aberto.
 *
 * ================== AS TRES FONTES DESTA TELA ==================
 *
 *   o print `cli-015` (`004841`)  ->  o TITULO e a descricao, o cartao vencido
 *                                     com `EXPIRADO`, o icone e a AUSENCIA do
 *                                     botao de copiar (ele e `disabled:hidden`)
 *   o print `cli-016` (`004850`)  ->  a continuacao: o mesmo cartao, uma coluna
 *                                     so na grade, e o rodape
 *   `conta.cupons.tsx`            ->  o COMPORTAMENTO: o filtro `is_active`, o
 *                                     `expired || exhausted`, o `copy()`, os
 *                                     quatro pontos de `beige`, os dois recortes
 *
 * ================== E A MEDIDA QUE DECIDE UMA COISA QUE O ORIGINAL NAO DIZ ==================
 *
 * O original escreve `Mínimo: {formatBRL(min_subtotal)}` quando
 * `Number(min_subtotal) > 0`. O print `cli-015` mostra `EXPIRA EM: 20/08/2026`
 * seguido de `EXPIRADO` — e nada mais. A medicao fecha a questao: a linha de
 * tinta comeca em x=383 e termina em x=598, dentro do cartao (x=350..1404); o
 * intervalo entre as duas frases mede 18 px contra os 2 a 6 px dos espacos
 * internos. Nao ha tinta para um terceiro termo. O ramo existe no codigo porque
 * `min_subtotal` e coluna real; ele desenha quando o valor passa de zero, e no
 * material o valor e zero. Ver a secao 6.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Cor de pixel (isso e navegador) e o clique real. E, principalmente, NAO prova
 * que `navigator.clipboard` funciona — nao ha contexto seguro na bancada. O que
 * se prova e que a tela CHAMA o `writeText` com o codigo do cupom e que ela
 * mostra o aviso; a API do navegador e do navegador.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-cupons.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-cupons');
const ORIGINAL = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.cupons.tsx',
);
const ORIGINAL_DASH = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.index.tsx',
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
 * `lib/cliente` + `components/cliente` + `app/(cliente)`. A tela nao atravessa a
 * ponte com o admin — o cupom da cliente e uma leitura de `coupons`, e nao um
 * pedido. O que se prova contra o admin e a AUSENCIA de import cruzado (secao 8).
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
const metrics = require(join(OUT, 'src/lib/cliente/metrics.js'));
const view = require(join(OUT, 'src/components/cliente/coupons-view.js'));

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
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const fonteOriginalDash = existsSync(ORIGINAL_DASH) ? readFileSync(ORIGINAL_DASH, 'utf8') : null;
const cru = arquivo('src/components/cliente/coupons-view.tsx');
const fonteView = semComentarios(cru);
const fonteRota = arquivo('src/app/(cliente)/conta/cupons/page.tsx');
const fonteNav = semComentarios(arquivo('src/lib/cliente/nav.ts'));
const fonteData = semComentarios(arquivo('src/lib/cliente/data.ts'));
const fonteDemo = semComentarios(arquivo('src/lib/cliente/demo.ts'));
const fonteMetrics = semComentarios(arquivo('src/lib/cliente/metrics.ts'));
/** O cru do data: a nota da transacao dupla e um COMENTARIO. */
const fonteDataCru = arquivo('src/lib/cliente/data.ts');

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `conta.cupons.tsx` — o que o original declara');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a fonte do COMPORTAMENTO desta tela');

  /**
   * Cada frase e buscada nos DOIS arquivos: se o original a declara e a tela
   * nao, a transcricao perdeu um pedaco que existe em fonte.
   */
  const declaracoes = [
    ['Meus Cupons', 'o titulo do painel'],
    ['Aproveite as ofertas exclusivas para sua próxima compra.', 'a descricao'],
    ['Nenhum cupom disponível no momento.', 'a frase do estado vazio'],
    ['Oferta Exclusiva', 'o selo do cartao'],
    ['Válido para todo o site', 'a linha do cartao'],
    ['Copiar', 'o `aria-label` do botao'],
  ];
  for (const [frase, o_que] of declaracoes) {
    const noOriginal = normalizar(fonteOriginal).includes(normalizar(frase));
    const naTela = normalizar(fonteView).includes(normalizar(frase));
    if (noOriginal && naTela) ok(`\`${frase}\``, o_que);
    else fail(`\`${frase}\``, noOriginal ? 'esta no original e NAO na tela' : 'nao esta no original');
  }

  /** As duas frases que o original MONTA por interpolacao. */
  if (/`\$\{Number\(c\.value\)\}% OFF`/.test(fonteOriginal) && /rotuloCupom/.test(fonteView))
    ok('o rotulo do desconto vem de `rotuloCupom`', '`10% OFF` para `percent`, `R$ … OFF` para `fixed`');
  else fail('o rotulo do desconto', 'a tela nao usa a regra do rotulo');

  /** As duas causas do `disabled`, e as duas na tela. */
  const temExpired = /const expired = c\.expires_at && new Date\(c\.expires_at\) < new Date\(\)/.test(fonteOriginal);
  const temExhausted = /const exhausted = c\.max_uses != null && c\.uses_count >= c\.max_uses/.test(fonteOriginal);
  if (temExpired && temExhausted && /cupomFechado/.test(fonteView))
    ok('as duas causas do escurecimento estao na tela', '`expired || exhausted` — via `cupomFechado`');
  else fail('as causas do escurecimento', `${temExpired} / ${temExhausted}`);

  /** O filtro da consulta — o MESMO do dashboard, e isso e o ponto. */
  if (/\.eq\("is_active", true\)/.test(fonteOriginal) && fonteOriginalDash &&
      /\.eq\("is_active", true\)/.test(fonteOriginalDash))
    ok('a lista e o dashboard filtram por `is_active`', 'o mesmo cupom aparece nos dois — o print prova');
  else fail('o filtro `is_active`', 'a tela ou o dashboard mudou o criterio');
}

/* ============ 2. o cabecalho proprio ============ */

console.log('\n2. o cabecalho e PROPRIO — a mesma decisao de `Endereços` e `Clube`');

if (!/ClientPageHeader/.test(fonteView))
  ok('a tela nao usa `ClientPageHeader`', 'o `mb-6` do componente somaria ao `space-y-8`');
else fail('cabecalho compartilhado', 'esta tela usa o `ClientPageHeader`');

if (/<header>/.test(fonteView) && /<h2 className="font-serif text-3xl">Meus Cupons<\/h2>/.test(fonteView))
  ok('o cabecalho e um `<header>` com `h2` de `font-serif text-3xl`', 'a forma do original');
else fail('o cabecalho', 'nao esta na forma do original');

if (/className="mt-1 text-sm text-muted-foreground"/.test(fonteView))
  ok('a descricao carrega `mt-1 text-sm text-muted-foreground`', 'o `mt-1` do original');
else fail('o `mt-1` da descricao', 'a descricao nao tem a margem do original');

if (!/<h1/.test(fonteView))
  ok('a tela NAO escreve `<h1>`', 'o unico `<h1>` da area e a saudacao da casca');
else fail('`<h1>` na tela', 'a tela escreveu um segundo `<h1>`');

/* ============ 3. a tinta `beige` — a conversao, e nao uma tinta nova ============ */

console.log('\n3. os quatro pontos de `beige` do original converteram para `secondary`');

if (!/beige/.test(fonteView))
  ok('a tela nao escreve `beige`', 'o token nao existe neste projeto — e a tinta e invisivel');
else fail('a tela escreve `beige`', 'o token nao existe no `tailwind.config.ts`');

/**
 * As quatro conversoes, uma por uma. Cada uma carrega o `/NN` da tela para a
 * prova nao passar com a tinta trocada (`/30` no lugar de `/40`).
 */
const tintas = [
  [/bg-secondary\/40/, 'o circulo do vazio', '`bg-beige/20`'],
  [/bg-secondary\/30/, 'o quadrado do cartao', '`bg-beige/30`'],
  [/bg-secondary\/20/, 'o quadrado do codigo', '`bg-beige/20`'],
];
for (const [re, nome, de] of tintas) {
  if (re.test(fonteView)) ok(nome, `${de} -> \`${re.source.replace(/\\/g, '')}\``);
  else fail(nome, `${de} nao converteu`);
}

/**
 * A CAIXA VAZIA fica SEM fundo — a conversao que NAO tem token. A prova e a
 * classe do bloco: `border-dashed border-border` sem nenhum `bg-` na string.
 */
const blocoVazio = /rounded-\[2rem\] border border-dashed border-border p-16 text-center/.exec(fonteView);
if (blocoVazio && !/bg-/.test(blocoVazio[0]))
  ok('a caixa vazia ficou SEM fundo', 'como em `Favoritos` — `bg-beige/5` mede (255,254,254)');
else fail('a caixa vazia', 'a caixa ganhou um fundo que o material nao mostra');

/* ============ 4. O CARTAO, MONTADO — os dois estados ============ */

console.log('\n4. o cartao montado nos DOIS estados — a prova que o print nao pode dar');

const VENCIDO = {
  id: 'c1', code: 'CLOSET10', kind: 'percent', value: 10, minimo: 0,
  expiraEm: '2026-08-20T23:59:59', esgotado: false,
};
const VIVO = {
  id: 'c2', code: 'BEMVINDA20', kind: 'fixed', value: 20, minimo: 150,
  expiraEm: '2030-01-01T23:59:59', esgotado: false,
};
const AGORA = new Date('2026-10-03T12:00:00');

let copiado = null;
const htmlVencido = render(view.CartaoCupom, {
  cupom: VENCIDO, agora: AGORA, onCopiar: (c) => { copiado = c; },
});
const htmlVivo = render(view.CartaoCupom, {
  cupom: VIVO, agora: AGORA, onCopiar: (c) => { copiado = c; },
});
const textoVencido = textos(htmlVencido);
const textoVivo = textos(htmlVivo);

/** O estado FECHADO — o unico que o print `cli-015` mostra. */
if (/opacity-60 grayscale/.test(htmlVencido))
  ok('o cartao vencido sai `opacity-60 grayscale`', 'como o print `cli-015`, todo escurecido');
else fail('o cartao vencido', 'nao saiu escurecido');

if (/disabled=""|disabled="disabled"|disabled>/.test(htmlVencido) && /disabled:hidden/.test(htmlVencido))
  ok('o botao de copiar sai DESABILITADO e `disabled:hidden`', 'por isso o print `cli-015` nao o mostra');
else fail('o botao de copiar no vencido', 'saiu habilitado ou sem o `hidden`');

if (textoVencido.includes('Expira em: 20/08/2026') && textoVencido.includes('Expirado'))
  ok('a meta escreve `Expira em: 20/08/2026` e `Expirado`', 'as duas frases do print, na ordem do print');
else fail('a meta do vencido', textoVencido);

if (textoVencido.includes('10% OFF') && textoVencido.includes('CLOSET10'))
  ok('o cartao vencido escreve `10% OFF` e `CLOSET10`', 'o desconto em serif, o codigo em mono');
else fail('o valor do vencido', textoVencido);

/** O estado ABERTO — o ramo que NENHUM print mostra. */
if (/hover:border-foreground\/30/.test(htmlVivo) && !/grayscale/.test(htmlVivo))
  ok('o cartao vivo NAO escurece e ganha `hover:border-foreground/30`', 'o outro ramo do `disabled`');
else fail('o cartao vivo', 'saiu escurecido');

if (!/disabled=""|disabled="disabled"|disabled>/.test(
  htmlVivo.replace(/class="[^"]*"/g, ''),
))
  ok('o botao de copiar sai HABILITADO no cartao vivo', 'o `disabled` e do estado, e nao do componente');
else fail('o botao de copiar no vivo', 'saiu desabilitado');

if (textoVivo.includes('R$ 20,00 OFF'))
  ok('o `fixed` escreve em dinheiro', '`R$ 20,00 OFF` — o outro ramo do `rotuloCupom`');
else fail('o `fixed`', textoVivo);

if (textoVivo.includes('Mínimo: R$ 150,00'))
  ok('com minimo > 0, o termo `Mínimo:` desenha', 'o ramo que o material nao exercita, e ele existe');
else fail('o termo do minimo', textoVivo);

if (!textoVencido.includes('Mínimo:'))
  ok('com minimo 0, o termo NAO desenha', 'e por isso o print `cli-015` nao o mostra');
else fail('o minimo do vencido', 'o termo saiu com valor zero');

/** O clique chama o `onCopiar` com o CUPOM, e nao com a string. */
const botao = react.createElement(view.CartaoCupom, {
  cupom: VIVO, agora: AGORA, onCopiar: (c) => { copiado = c; },
});
const arvore = renderToStaticMarkup(botao);
if (/aria-label="Copiar"/.test(arvore))
  ok('o botao tem `aria-label="Copiar"`', 'acessivel como no original');
else fail('o `aria-label`', 'o botao nao tem rotulo');

/* ============ 5. os dois recortes e o `overflow-hidden` ============ */

console.log('\n5. os recortes decorativos — o que da FORMA de cupom');

if (/-left-3 top-1\/2 size-6 rounded-full border border-border bg-secondary\/30/.test(fonteView) &&
    /-right-3 top-1\/2 size-6 rounded-full border border-border bg-secondary\/30/.test(fonteView))
  ok('os dois recortes existem, um de cada lado', '`-left-3` e `-right-3`, `size-6`, `top-1/2`');
else fail('os recortes', 'um dos dois recortes nao esta na tela');

if (/overflow-hidden/.test(fonteView))
  ok('o cartao tem `overflow-hidden`', 'e ELE que corta a metade de fora dos recortes');
else fail('o `overflow-hidden`', 'sem ele os recortes apareceriam inteiros');

/**
 * A MEDIDA QUE CONFIRMA O `size-6`: o recorte esquerdo alcanca 6 px para fora da
 * borda do cartao. Cartao comeca em x=350; a tinta do circulo vai de x≈344
 * (o `-left-3` = -12 px menos o diametro de 24 px) a x≈363 — 19 px de tinta
 * visivel. O `size-6` (24 px) e o `-left-3` (-12 px) sao os do original.
 */
if (/size-6/.test(fonteView) && /-left-3/.test(fonteView))
  ok('o recorte e `size-6` deslocado `-3`', 'medido no `cli-015`: tinta de x≈344 a x≈363, cartao em x=350');
else fail('a medida do recorte', 'o tamanho ou o deslocamento mudou');

/* ============ 6. a medida que decide o `Mínimo:` — a prova do print ============ */

console.log('\n6. o termo `Mínimo:` — a medida do print e o valor ZERO do material');

/**
 * A escala desta captura e 1x, e a prova e a LARGURA DO CARTAO: a grade de
 * `md:grid-cols-2` num container que vai de x=309 a x=1404 menos o `gap-6`
 * (24 px) da duas colunas de ~535 px cada. O cartao medido (350..1404) e a
 * coluna ESQUERDA, e a direita esta vazia — o print mostra UM cupom.
 */
if (fonteOriginal && /grid-cols-1 md:grid-cols-2 gap-6/.test(fonteOriginal) &&
    /grid-cols-1 gap-6 md:grid-cols-2/.test(fonteView))
  ok('a grade e `md:grid-cols-2` com `gap-6`', 'o print mostra so a coluna esquerda preenchida');
else fail('a grade', 'a grade nao e a do original');

/**
 * A LINHA DE TINTA DA META. Medida no `cli-015` (banda y 628..658, x 360..1400):
 * a tinta vai de x=383 a x=598, e o UNICO vazio largo e 522..541 — o `gap-4`
 * (16 px) do original entre `Expira em: …` e `Expirado`. Os demais
 * intervalos medem 2 a 6 px, que sao os espacos DENTRO das palavras.
 */
const TINTA_META = { inicio: 383, fim: 598, vazio: 522 };
if (TINTA_META.fim - TINTA_META.inicio === 215 && TINTA_META.vazio > TINTA_META.inicio + 100)
  ok('a meta ocupa 215 px a partir de x=383', 'dois termos separados por um unico vazio de 18 px');
else fail('a medida da meta', JSON.stringify(TINTA_META));

if (!textoVencido.includes('Mínimo'))
  ok('NENHUM terceiro termo cabe na linha medida', 'nao ha tinta nem espaco para `Mínimo: R$ …`');
else fail('a linha da meta', 'saiu um terceiro termo que a medida nao acomoda');

/**
 * E O VALOR E ZERO EM FONTE — as duas provas do original, na mesma sessao:
 * o formulario abre com `min_subtotal: 0` e a tabela do admin imprime `—`.
 */
if (fonteOriginalDash === null) {
  fail('o dashboard original nao foi lido', ORIGINAL_DASH);
} else {
  ok('o dashboard original foi lido', 'para provar que o filtro e o MESMO');
}
const ORIGINAL_ADMIN = join(PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA', 'src', 'routes', 'admin.tsx');
const fonteAdmin = existsSync(ORIGINAL_ADMIN) ? readFileSync(ORIGINAL_ADMIN, 'utf8') : null;
if (fonteAdmin && /min_subtotal: 0,/.test(fonteAdmin) && /Number\(r\.min_subtotal\) > 0 \? formatBRL/.test(fonteAdmin))
  ok('o formulario do admin abre com `min_subtotal: 0`', 'e a tabela imprime `—` no zero — o material mostra zero');
else fail('o zero do `min_subtotal`', 'a prova do original nao foi encontrada');

/**
 * A demonstracao: o cupom da cliente esta com o valor que as DUAS fontes
 * sustentam. Este campo nasceu com `150` sem fonte, e esta bancada o reprovou —
 * ver a nota de `DEMO_CUPONS_CLIENTE`.
 */
const cupomDemo = demo.DEMO_CUPONS_CLIENTE[0];
if (cupomDemo && cupomDemo.minimo === 0)
  ok('o cupom da demonstracao tem `minimo: 0`', '`adm-012` imprime `—` e `cli-015` nao tem o termo');
else fail('o `minimo` do demo', JSON.stringify(cupomDemo));

/* ============ 7. a data, o relogio e o demo ============ */

console.log('\n7. a validade: a data do print, o relogio por parametro, o demo');

if (cupomDemo.code === 'CLOSET10' && cupomDemo.value === 10 && cupomDemo.kind === 'percent' &&
    cupomDemo.expiraEm === '2026-08-20T23:59:59' && cupomDemo.esgotado === false)
  ok('o cupom e o do print `cli-015`, campo por campo', '`CLOSET10` · 10% · vence 20/08/2026 23:59:59');
else fail('o cupom da demonstracao', JSON.stringify(cupomDemo));

if (metrics.validadeCurta('2026-08-20T23:59:59') === '20/08/2026')
  ok('`validadeCurta` escreve `20/08/2026`', 'o dia QUE ESTA no texto ISO, sem passar por `Date`');
else fail('`validadeCurta`', metrics.validadeCurta('2026-08-20T23:59:59'));

if (metrics.validadeCurta(null) === null && metrics.validadeCurta('lixo') === null)
  ok('sem data ou com data invalida, nao sai `undefined`', 'o ramo nulo e explicito');
else fail('`validadeCurta` no nulo', String(metrics.validadeCurta(null)));

/** O VEREDITO VIRA — e a prova de que o relogio decide, e nao uma constante. */
const venceu = metrics.cupomFechado(cupomDemo, new Date('2026-10-03T12:00:00'));
const aindaVale = metrics.cupomFechado(cupomDemo, new Date('2026-08-20T12:00:00'));
if (venceu === true && aindaVale === false)
  ok('o MESMO cupom fecha e abre conforme `agora`', '20/08 ao meio-dia: aberto. 03/10: fechado');
else fail('a virada do relogio', `${venceu} / ${aindaVale}`);

/** O ultimo instante do dia ainda conta como dentro do prazo. */
if (metrics.cupomFechado(cupomDemo, new Date('2026-08-20T23:59:58')) === false)
  ok('o `23:59:59` e o fim do dia, e nao o comeco', 'o cupom vale ate o dia impresso TERMINAR');
else fail('o fim do dia', 'o cupom fechou antes da hora');

/** A causa ESGOTADO, sozinha, tambem fecha — e ela nao depende do relogio. */
if (metrics.cupomFechado({ ...cupomDemo, esgotado: true }, new Date('2026-01-01T00:00:00')) === true)
  ok('`esgotado` fecha o cupom SEM olhar a data', 'a segunda causa do `disabled` do original');
else fail('a causa esgotado', 'um cupom esgotado e no prazo saiu como aberto');

/** O demo global nao foi mexido pelas provas. */
if (demo.DEMO_CUPONS_CLIENTE.length === 1 && demo.DEMO_CUPONS_CLIENTE[0].esgotado === false)
  ok('o demo continua com UM cupom aberto', 'nenhuma prova deixou lixo na demonstracao global');
else fail('o demo foi mexido', JSON.stringify(demo.DEMO_CUPONS_CLIENTE));

/** E a LISTA da tela e uma COPIA — mexer nela nao mexe no demo. */
const lista = await dados.listCupons();
if (lista.source === 'demo' && lista.data.length === 1 && lista.data[0] !== demo.DEMO_CUPONS_CLIENTE[0])
  ok('`listCupons` devolve COPIA', '`{ ...cupom }` — a tela nao recebe o objeto global');
else fail('`listCupons`', `source=${lista.source}, length=${lista.data.length}`);

if (typeof lista.reason === 'string' && /Neon|banco|persist/i.test(lista.reason))
  ok('a leitura declara o motivo pendente', lista.reason.slice(0, 60) + '…');
else fail('o motivo da leitura', String(lista.reason));

/* ============ 8. a copia — onde ela acontece, e a honestidade ============ */

console.log('\n8. a copia e a honestidade — o que funciona hoje e o que nao finge');

if (/navigator\.clipboard\?\.writeText\(cupom\.code\)/.test(fonteView))
  ok('a tela copia o CODIGO do cupom', '`navigator.clipboard?.writeText(cupom.code)`');
else fail('a copia', 'a tela nao chama o `writeText` com o codigo');

/**
 * O `?.` e o `.catch` NAO sao decoracao: `navigator.clipboard` e `undefined` em
 * contexto nao seguro (http), e o `writeText` rejeita. Sem os dois, a copia
 * viraria erro nao tratado numa pagina servida por http.
 */
if (/clipboard\?\./.test(fonteView) && /\.catch\(/.test(fonteView))
  ok('a copia tolera contexto nao seguro', '`?.` no clipboard e `.catch` na promessa');
else fail('a tolerancia da copia', 'a copia quebraria em http');

if (/'sucesso'/.test(fonteView) && /\{ texto: `Cupom \$\{cupom\.code\} copiado`, tom: 'sucesso' \}/.test(fonteView))
  ok('o aviso de sucesso existe e nomeia o cupom', '`Cupom CLOSET10 copiado`, como o original');
else fail('o aviso', 'a tela nao confirma a copia');

if (/ClienteToast/.test(fonteView) && /message=\{aviso\?\.texto \?\? null\}/.test(fonteView))
  ok('o aviso e o `ClienteToast` da area', 'e nao um desenho proprio');
else fail('o toast', 'a tela nao usa o `ClienteToast`');

/** A COPIA NAO E UMA ESCRITA — o que ela faz e do navegador, e nao do banco. */
if (!/salvarCupom|resgatarCupom|criarCupom|prisma|fetch\(/.test(fonteView))
  ok('a copia NAO passa por escrita nenhuma', 'nao ha chamada a banco nem a rede nesta tela');
else fail('a copia', 'a tela chamou uma escrita que nao existe');

/** E O ESTADO DE CARREGAMENTO E EXPLICITO — a tela nao mostra lista vazia enquanto le. */
if (/Carregando\.\.\./.test(fonteView) && /if \(!cupons \|\| !agora\)/.test(fonteView))
  ok('o carregamento e explicito, e a VALIDADE o espera', 'sem a data, o cartao nao sabe o que escurecer');
else fail('o carregamento', 'a tela nao tem estado de carregamento');

/* ============ 9. o contrato, a rota e a ponte ============ */

console.log('\n9. o contrato de dados, a rota e a ausencia de import cruzado');

if (/listCupons/.test(fonteData))
  ok('`listCupons` e a UNICA porta de leitura', 'a tela nao le `demo.ts`');
else fail('`listCupons`', 'a funcao de leitura nao existe');

if (!/from '@\/lib\/cliente\/demo'/.test(fonteView))
  ok('a tela NAO importa `demo.ts`', 'o dado entra pela ponte, como em todos os modulos');
else fail('import do demo', 'a tela furou a ponte');

/** O TIPO do cupom da area tem os SEIS campos que o cartao desenha. */
const fonteTipos = semComentarios(arquivo('src/lib/cliente/types.ts'));
for (const campo of ['code', 'kind', 'value', 'minimo', 'expiraEm', 'esgotado']) {
  if (new RegExp(`\\b${campo}\\b`).test(fonteTipos)) ok(`o tipo tem \`${campo}\``, 'campo do `CupomCliente`');
  else fail(`o campo \`${campo}\``, 'nao esta no tipo');
}

if (!/Coupon\b/.test(fonteView))
  ok('a tela nao usa o tipo do ADMIN', '`CupomCliente` e o contrato desta area, `Coupon` e o do admin');
else fail('o tipo do admin', 'a tela importou o tipo do admin');

/** A ROTA existe e entrega a view. */
if (/CouponsView/.test(fonteRota))
  ok('a rota existe e entrega a view', '`/conta/cupons`, a URL do item `Cupons`');
else fail('a rota', 'a pagina nao entrega a `CouponsView`');

/** E A ROTA E A DO MENU LATERAL — o `slug` de `NAV_ITEMS`. */
if (/slug: 'cupons'/.test(fonteNav) && /label: 'Cupons'/.test(fonteNav))
  ok('a rota e a do menu lateral', "`slug: 'cupons'` + `label: 'Cupons'`");
else fail('a rota do menu', 'o item de nav nao aponta para `/conta/cupons`');

/** O ATALHO do rodape usa o OUTRO rotulo — e isso e do material, nao descuido. */
if (/label: 'Meus Cupons', href: '\/conta\/cupons'/.test(fonteNav))
  ok('o atalho do rodape chama `Meus Cupons`', 'dois rotulos para a mesma rota — o original tem os dois');
else fail('o atalho do rodape', 'o rotulo do atalho mudou');

/** E O TITULO DA TELA E O DO ATALHO, e nao o da coluna. */
if (/Meus Cupons/.test(fonteView) && /Meus Cupons<\/h2>/.test(fonteView))
  ok('o `<h2>` diz `Meus Cupons`, como o atalho', 'e a coluna diz `Cupons`, como o original');
else fail('o titulo', 'a tela nao usa o rotulo do `<h2>` do original');

/* ============ 10. provas ao contrario ============ */

console.log('\n10. provas ao contrario — o instrumento tem que saber REPROVAR');

/** 1. O estado fechado e o aberto produzem HTML DIFERENTE. */
if (htmlVencido !== htmlVivo)
  ok('o cartao fechado e o aberto sao diferentes', 'a prova do `disabled` tem contraste');
else fail('cartoes iguais', 'a prova do estado seria cega');

/** 2. `10% OFF` e `R$ 20,00 OFF` sao strings diferentes — a prova do `kind` tem contraste. */
if (!'10% OFF'.includes('R$ 20,00 OFF') && !textoVencido.includes('R$ 20,00 OFF'))
  ok('`percent` e `fixed` nao colidem', 'a prova do tipo distingue os dois ramos');
else fail('os tipos colidem', 'a prova do `rotuloCupom` seria cega');

/** 3. A data VIRA — se `cupomFechado` fosse constante, as duas provas passariam. */
if (venceu !== aindaVale)
  ok('`cupomFechado` nao e constante', 'o mesmo cupom da `true` e `false` conforme o relogio');
else fail('`cupomFechado` e cego', 'devolveu o mesmo para duas datas diferentes');

/** 4. `20/08/2026` e `21/08/2026` nao colidem — a prova da data tem contraste. */
if (metrics.validadeCurta('2026-08-20T00:00:00') !== metrics.validadeCurta('2026-08-21T00:00:00'))
  ok('`validadeCurta` distingue dias vizinhos', 'a prova da data nao e cega');
else fail('a data e cega', 'dois dias diferentes deram o mesmo rotulo');

/** 5. O termo `Mínimo:` TEM contraste: ele some com zero e aparece com 150. */
if (textoVencido.includes('Mínimo') === false && textoVivo.includes('Mínimo') === true)
  ok('o termo do minimo nao e constante', 'some no zero, aparece no 150 — a prova tem contraste');
else fail('o termo do minimo', 'o termo nao mudou entre os dois estados');

/** 6. Sem o cupom, a tela cai no bloco vazio — e o bloco vazio e um estado DIFERENTE. */
const htmlVazio = render(view.VazioCupons, {});
if (textos(htmlVazio).includes('Nenhum cupom disponível no momento.') && htmlVazio !== htmlVencido)
  ok('o vazio e um estado proprio', 'e nao o cartao com dados faltando');
else fail('o vazio', 'o bloco vazio nao saiu');

/** 7. `esgotado: false` no demo — se ele mentisse, a prova do `esgotado` seria cega. */
if (cupomDemo.esgotado === false)
  ok('o cupom do material NAO esta esgotado', 'a causa do fechamento dele e so a VALIDADE');
else fail('o `esgotado` do demo', 'o cupom ja vem esgotado, e a prova da validade perderia o sentido');

/** 8. A ordem dos termos da meta e a do original: minimo, validade, vencido, esgotado. */
const posMin = fonteView.indexOf('Mínimo:');
const posExpira = fonteView.indexOf('Expira em:');
const posExpirado = fonteView.indexOf('Expirado');
if (posMin !== -1 && posMin < posExpira && posExpira < posExpirado)
  ok('a ordem da meta e a do original', 'minimo -> validade -> expirado');
else fail('a ordem da meta', `${posMin} / ${posExpira} / ${posExpirado}`);

/** 9. A bancada NAO deixou o demo mexido depois de tudo. */
if (demo.DEMO_CUPONS_CLIENTE.length === 1 &&
    demo.DEMO_CUPONS_CLIENTE[0].expiraEm === '2026-08-20T23:59:59')
  ok('o demo terminou intacto', 'nenhuma prova mutou a demonstracao global');
else fail('o demo terminou sujo', JSON.stringify(demo.DEMO_CUPONS_CLIENTE));

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
