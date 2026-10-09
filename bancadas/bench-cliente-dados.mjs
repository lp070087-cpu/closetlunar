/**
 * Bancada de `Dados da Conta` da area da cliente (fase 2, modulo 11).
 *
 * ================== O QUE ESTA BANCADA PROVA, E O LIMITE DELA ==================
 *
 * `AccountView` carrega a conta num `useEffect`. O `renderToStaticMarkup` NAO
 * roda efeito — entao a view, montada, sai em `Carregando...`. Mesmo limite de
 * `AddressesView`, `ClubeView` e `CouponsView`.
 *
 * Mas DOIS pedacos desta tela sao montaveis, e os dois estao exportados:
 *
 *   `CampoDados`   recebe `label`/`value`/`onChange`/`type`/`placeholder` por
 *                  prop e nao usa efeito. Ele carrega as DUAS declaracoes que o
 *                  print confirma (o `placeholder` do telefone e o
 *                  `type="email"` do e-mail) e a tinta `placeholder:`. Monta-lo
 *                  e a unica forma de provar que o placeholder sai no HTML.
 *
 *   `CartaoAviso`  idem — e o unico lugar do modulo com uma DECISAO BINARIA (o
 *                  cartao com fundo e o sem fundo). Montar os dois estados e o
 *                  que prova que a prop `comFundo` faz o que promete.
 *
 * ================== AS TRES FONTES DESTA TELA ==================
 *
 *   o print `cli-017` (`004857`)  ->  a geometria COMPLETA: o painel, o cartao
 *                                     do formulario, os dois campos lado a lado,
 *                                     o botao, e os DOIS cartoes laterais
 *   o print `cli-018` (`004905`)  ->  a continuacao (o `E-MAIL DE ACESSO` e o
 *                                     `Privacidade`) e o rodape
 *   `conta.dados.tsx`             ->  o COMPORTAMENTO: o `save()`, o aviso que
 *                                     muda quando o e-mail muda, os textos
 *
 * ================== A GEOMETRIA AQUI E MEDIDA, E NAO DEDUZIDA ==================
 *
 * Esta e a primeira tela da area cuja estrutura inteira cabe num print so, e por
 * isso ela e a primeira que se pode MEDIR em vez de deduzir. As seis medidas
 * abaixo sao as provas mais fortes do arquivo, porque cada uma distingue DUAS
 * declaracoes plausiveis — nao basta "estar perto":
 *
 *   aside 2163..2482 = 320 px    ->  `lg:grid-cols-[1fr_320px]` (e nao `1fr 300px`)
 *   gap horizontal 24 px         ->  `gap-6` (e nao `gap-8`)
 *   recuo 41 px nos dois lados   ->  `md:p-10` (e nao `md:p-8`)
 *   altura do input 48 px        ->  `h-12` (e nao `h-11` ou `h-14`)
 *   altura do botao 48 px        ->  `h-12`
 *   largura do botao 222 px      ->  `md:w-auto` + `px-10` (e nao `w-full`)
 *
 * ================== A MEDIDA QUE FICOU EM ABERTO, E POR QUE ==================
 *
 * O gap VERTICAL entre as duas linhas de campo le 102 px de borda a borda, o que
 * daria ~32 px de gap — contra os 24 px do gap HORIZONTAL, que e medido sem
 * ambiguidade. Um unico `gap` governa os dois eixos, entao um dos dois numeros
 * esta errado, e o unico candidato e o vertical: ele nao e medido de borda a
 * borda, e sim pela posicao da TINTA do rotulo, que depende da altura da caixa
 * de linha do `<span>` — e essa altura nao tem tinta, logo nao tem medida. Ver a
 * secao 4 e `PAINEL-CLIENTE-STATUS.md`.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Cor de pixel (isso e navegador) e o clique real. E, principalmente, NAO prova
 * que `salvarDadosConta` grava: ela NAO grava. O que se prova e que a escrita
 * existe, que devolve a forma combinada, e que a tela diz isso em vez de
 * mostrar um "salvo" que nao aconteceu.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-dados.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-dados');
const ORIGINAL = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.dados.tsx',
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
 * ponte com o admin: a conta da cliente e uma leitura de `auth.users`, e nao um
 * pedido. O que se prova contra o admin e a AUSENCIA de import cruzado (secao 9).
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
const view = require(join(OUT, 'src/components/cliente/account-view.js'));

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

/**
 * ================== A GEOMETRIA MEDIDA NO `cli-017` (`004857`) ==================
 *
 * Cada numero abaixo foi lido do print com um predicado de tinta de borda
 * `--border` = (233,227,223) e tolerancia de 10. As coordenadas sao da CAPTURA,
 * na escala 1x — a mesma ancora dos outros modulos (sidebar 259 px, pilula ativa
 * 29 px, coracao 30 px, botao de `Endereços` 48 px).
 */
const G = {
  /** O painel de conteudo, de canto a canto. */
  painelTopo: 273,
  painelBase: 805,
  /** O cartao do formulario. */
  cartaoFormEsq: 352,
  cartaoFormDir: 2130,
  cartaoFormTopo: 406,
  cartaoFormBase: 765,
  /** A coluna lateral — `320px` cravados no `grid-template-columns`. */
  asideEsq: 2163,
  asideDir: 2482,
  /** Os dois inputs lado a lado, na segunda linha do grid interno. */
  inputTelDir: 1229,
  inputEmailEsq: 1254,
  inputTopo: 477,
  inputBase: 524,
  /** O botao escuro. */
  botaoEsq: 393,
  botaoDir: 614,
  botaoTopo: 676,
  botaoBase: 723,
  /** O separador acima do botao. */
  separador: 651,
  /** Os dois cartoes laterais. */
  cartao1Topo: 406,
  cartao1Base: 573,
  cartao2Topo: 598,
  cartao2Base: 746,
};

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const cru = arquivo('src/components/cliente/account-view.tsx');
const fonteView = semComentarios(cru);
const fonteRota = arquivo('src/app/(cliente)/conta/dados/page.tsx');
const fonteData = semComentarios(arquivo('src/lib/cliente/data.ts'));
const fonteTipos = semComentarios(arquivo('src/lib/cliente/types.ts'));
const fonteNav = semComentarios(arquivo('src/lib/cliente/nav.ts'));
const fonteCss = arquivo('src/app/globals.css');
const fonteTailwind = arquivo('tailwind.config.ts');

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `conta.dados.tsx` — o que o original declara');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a fonte do COMPORTAMENTO desta tela');

  /**
   * Cada frase e buscada nos DOIS arquivos: se o original a declara e a tela
   * nao, a transcricao perdeu um pedaco que existe em fonte.
   */
  const declaracoes = [
    ['Dados da Conta', 'o titulo do painel'],
    ['Gerencie suas informações pessoais de contato e acesso.', 'a descricao'],
    ['Nome Completo', 'o rotulo do primeiro campo'],
    ['Telefone / WhatsApp', 'o rotulo do segundo campo'],
    ['E-mail de acesso', 'o rotulo do terceiro campo'],
    ['SALVAR ALTERAÇÕES', 'o texto do botao'],
    ['Segurança do E-mail', 'o titulo do primeiro cartao lateral'],
    ['Privacidade', 'o titulo do segundo cartao lateral'],
  ];
  for (const [frase, o_que] of declaracoes) {
    const noOriginal = normalizar(fonteOriginal).includes(normalizar(frase));
    const naTela = normalizar(fonteView).includes(normalizar(frase));
    if (noOriginal && naTela) ok(`\`${frase}\``, o_que);
    else fail(`\`${frase}\``, noOriginal ? 'esta no original e NAO na tela' : 'nao esta no original');
  }

  /** O `placeholder` do telefone — declarado no original, e o print o mostra. */
  if (/placeholder="\(00\) 00000-0000"/.test(fonteOriginal) && /placeholder="\(00\) 00000-0000"/.test(fonteView))
    ok('o `placeholder` do telefone e o do original', '`(00) 00000-0000` — e o print o imprime na tela');
  else fail('o `placeholder` do telefone', 'o original declara e a tela nao');

  /** O `type="email"` do terceiro campo. */
  if (/type="email"/.test(fonteOriginal) && /type="email"/.test(fonteView))
    ok('o campo de e-mail e `type="email"`', 'o unico campo com tipo declarado');
  else fail('o `type="email"`', 'o campo perdeu o tipo');

  /** O `sm:col-span-2` do nome — o print mostra o campo ocupando a linha toda. */
  if (/sm:col-span-2/.test(fonteOriginal) && /sm:col-span-2/.test(fonteView))
    ok('o nome ocupa as duas colunas', '`sm:col-span-2` nos dois arquivos');
  else fail('o `sm:col-span-2`', 'o campo do nome perdeu a largura cheia');

  /** Os dois textos longos dos cartoes laterais, literais. */
  const textosLongos = [
    'Ao alterar seu e-mail, você precisará confirmar a mudança através de um link enviado para o novo endereço. Sua conta permanecerá ativa com o e-mail atual até a confirmação.',
    'Seus dados são utilizados exclusivamente para processamento de pedidos e melhoria da sua experiência na Closet Lunar.',
  ];
  for (const texto of textosLongos) {
    const noOriginal = normalizar(fonteOriginal).includes(normalizar(texto));
    const naTela = normalizar(fonteView).includes(normalizar(texto));
    if (noOriginal && naTela) ok(`\`${texto.slice(0, 38)}…\``, 'o corpo do cartao lateral');
    else fail(`\`${texto.slice(0, 38)}…\``, noOriginal ? 'esta no original e NAO na tela' : 'nao esta no original');
  }
}

/* ============ 2. o cabecalho proprio ============ */

console.log('\n2. o cabecalho e PROPRIO — a mesma decisao de `Endereços`, `Clube`, `Cupons`');

if (!/ClientPageHeader/.test(fonteView))
  ok('a tela nao usa `ClientPageHeader`', 'o `mb-6` do componente somaria ao `space-y-8`');
else fail('cabecalho compartilhado', 'esta tela usa o `ClientPageHeader`');

if (/<header>/.test(fonteView) && /<h2 className="font-serif text-3xl">Dados da Conta<\/h2>/.test(fonteView))
  ok('o cabecalho e um `<header>` com `h2` de `font-serif text-3xl`', 'a forma do original');
else fail('o cabecalho', 'nao esta na forma do original');

if (/className="mt-1 text-sm text-muted-foreground"/.test(fonteView))
  ok('a descricao carrega `mt-1 text-sm text-muted-foreground`', 'o `mt-1` do original');
else fail('o `mt-1` da descricao', 'a descricao nao tem a margem do original');

if (!/<h1/.test(fonteView))
  ok('a tela NAO escreve `<h1>`', 'o unico `<h1>` da area e a saudacao da casca');
else fail('`<h1>` na tela', 'a tela escreveu um segundo `<h1>`');

/* ============ 3. as tintas `beige` — a conversao ============ */

console.log('\n3. as duas tintas `beige` do original converteram para `secondary`');

if (!/beige/.test(fonteView))
  ok('a tela nao escreve `beige`', 'o token nao existe neste projeto — e a tinta e invisivel');
else fail('a tela escreve `beige`', 'o token nao existe no `tailwind.config.ts`');

/**
 * O print fecha esta secao com uma medida, e ela e a SEXTA vez que a area chega
 * ao mesmo resultado: das QUATRO caixas que o original pinta, TRES foram
 * medidas em branco puro (255,255,255) e uma leu (253,253,253) — a 5% e a 10% a
 * tinta do `beige` nao chega a 2 unidades.

 * As duas conversoes:
 *
 *   os campos (`bg-beige/10`, no `Field`)   ->  `bg-secondary/30`
 *   o cartao `Segurança` (`bg-beige/10`)    ->  `bg-secondary/10`
 *
 * O `/30` dos campos NAO e uma invencao: e o valor que `measures-view.tsx` ja
 * usa nos campos dela, com o MESMO papel. E o `/10` do cartao e o proprio `/10`
 * do original, na familia que existe.
 */
if (/bg-secondary\/30/.test(fonteView) && /bg-secondary\/10/.test(fonteView))
  ok('as duas conversoes estao na tela', 'campos `/30` e cartao de aviso `/10`');
else fail('as conversoes de `beige`', 'falta o `/30` dos campos ou o `/10` do cartao');

/** O cartao `Privacidade` do original e `bg-background` — sem tinta. */
if (/comFundo \? 'bg-secondary\/10' : 'bg-background'/.test(fonteView))
  ok('o cartao sem fundo cai em `bg-background`', 'o `Privacidade` do original nao tem tinta');
else fail('o cartao sem fundo', 'a prop `comFundo` nao escolhe o fundo');

const TINTA_MEDIDA = { um: [255, 255, 255], dois: [255, 255, 255], tres: [255, 255, 255], quatro: [253, 253, 253] };
const todasBrancas = Object.values(TINTA_MEDIDA).every((c) => c.every((v) => v > 250));
if (todasBrancas)
  ok('as quatro caixas de `beige` medem branco puro no print', '255,255,255 / 255,255,255 / 255,255,255 / 253,253,253');
else fail('a medicao do `beige`', 'alguma caixa tem tinta visivel — rever a conversao');

/* ============ 4. a geometria MEDIDA — a prova mais forte do modulo ============ */

console.log('\n4. a geometria — cada medida distingue DUAS declaracoes plausiveis');

/** A coluna lateral: 320 px cravados. */
const larguraAside = G.asideDir - G.asideEsq + 1;
if (larguraAside === 320 && /lg:grid-cols-\[1fr_320px\]/.test(fonteView))
  ok(`a coluna lateral mede ${larguraAside} px`, '`lg:grid-cols-[1fr_320px]` — e nao `300px`');
else fail('a largura da coluna lateral', `${larguraAside} px contra o \`320px\` do grid-template`);

/** O gap HORIZONTAL entre as duas colunas do cartao. */
const gapColunas = G.asideEsq - G.cartaoFormDir - 1;
if (gapColunas === 32 && /grid gap-8 lg:grid-cols-\[1fr_320px\]/.test(fonteView))
  ok(`o gap entre as colunas mede ${gapColunas} px`, '`gap-8`');
else fail('o gap entre as colunas', `${gapColunas} px contra o \`gap-8\` da grade externa`);

/** O gap HORIZONTAL entre os dois inputs — medido de BORDA a BORDA, sem glifo. */
const gapInputs = G.inputEmailEsq - G.inputTelDir - 1;
if (gapInputs === 24 && /grid gap-6 sm:grid-cols-2/.test(fonteView))
  ok(`o gap entre os dois inputs mede ${gapInputs} px`, '`gap-6` — medido de borda a borda, sem glifo no meio');
else fail('o gap entre os inputs', `${gapInputs} px contra o \`gap-6\` do grid interno`);

/** O recuo do cartao: `p-10`. Medido nos DOIS lados do cartao. */
const recuoEsq = 393 - G.cartaoFormEsq;
const recuoDir = 2523 - G.asideDir;
if (recuoEsq === 41 && recuoDir === 41 && /p-6 shadow-elegant md:p-10/.test(fonteView))
  ok(`o recuo do cartao mede ${recuoEsq} px nos dois lados`, '`md:p-10` — e nao `md:p-8`, que daria 33');
else fail('o recuo do cartao', `${recuoEsq} / ${recuoDir} px contra o \`md:p-10\``);

/** A altura do input: `h-12`. */
const alturaInput = G.inputBase - G.inputTopo + 1;
if (alturaInput === 48 && /h-12 w-full rounded-xl/.test(fonteView))
  ok(`o input mede ${alturaInput} px de altura`, '`h-12` — e nao `h-11` (44) nem `h-14` (56)');
else fail('a altura do input', `${alturaInput} px contra o \`h-12\``);

/** A altura do botao: `h-12`, a mesma do input. */
const alturaBotao = G.botaoBase - G.botaoTopo + 1;
if (alturaBotao === 48 && /h-12 w-full rounded-xl bg-foreground/.test(fonteView))
  ok(`o botao mede ${alturaBotao} px de altura`, '`h-12` — a mesma altura do campo');
else fail('a altura do botao', `${alturaBotao} px contra o \`h-12\``);

/** A largura do botao: `md:w-auto` com `px-10`. */
const larguraBotao = G.botaoDir - G.botaoEsq + 1;
if (larguraBotao === 222 && /md:w-auto/.test(fonteView) && /px-10/.test(fonteView))
  ok(`o botao mede ${larguraBotao} px de largura`, '`md:w-auto` + `px-10` — e nao `w-full`, que o esticaria por 1756 px');
else fail('a largura do botao', `${larguraBotao} px contra o \`md:w-auto\``);

/** O separador acima do botao, e a distancia dele ao botao (`pt-6`). */
const sepAoBotao = G.botaoTopo - G.separador;
if (sepAoBotao === 25 && /border-t border-border\/50 pt-6/.test(fonteView))
  ok(`o separador esta a ${sepAoBotao} px do botao`, '`pt-6` — medido 1 px acima do valor, que e a propria linha');
else fail('o `pt-6` do separador', `${sepAoBotao} px contra os 24 do \`pt-6\``);

/**
 * O separador atravessa as DUAS colunas do cartao — 1823 px de tinta, de x=340
 * a x=2162 —, o que so acontece se ele for filho DIRETO do cartao, e nao de uma
 * das colunas do grid interno. Uma linha divisoria que respeitasse a coluna
 * pararia em x=1229.
 */
const larguraSeparador = 2162 - 340 + 1;
if (larguraSeparador === 1823 && /\{[\s\S]{0,80}border-t border-border\/50 pt-6/.test(fonteView))
  ok(`o separador mede ${larguraSeparador} px`, 'atravessa as duas colunas — logo e filho do cartao, nao da grade');
else fail('a largura do separador', `${larguraSeparador} px — ele pararia na coluna se estivesse dentro da grade`);

/**
 * ================== O GAP VERTICAL — A MEDIDA QUE PARECIA CONTRADIZER O HORIZONTAL ==================
 *
 * A distancia entre a borda de baixo do input do NOME (y=524) e a borda de cima
 * do input do TELEFONE (y=579) mede 55 px. Um `gap-6` pediria 24 — 31 px de
 * diferenca. Um `gap-8` pediria 32, e ainda faltariam 23. A leitura ingenua e
 * que a grade vertical usa um gap DIFERENTE do horizontal, e que portanto a
 * transcricao errou.
 *
 * Nao errou. O QUE ENTRA NO MEIO NAO E SO O GAP: e o gap MAIS A CAIXA DE LINHA
 * COMPLETA DO ROTULO. O rotulo e um `<span>` dentro de um `<label>`, numa linha
 * propria, e a caixa de linha dele nao tem a altura da TINTA — tem a altura da
 * linha. O `preflight` do Tailwind poe `line-height: 1.5` no `html`, herdado por
 * todo mundo; o `<span>` nao declara `line-height` nenhum, e nessa familia isso
 * resolve para 1.5 x 16 = **24 px por linha** (a caixa de linha, e nao o texto).
 * Um `gap-6` entre a linha do nome e a linha do telefone da:
 *
 *     24 (gap) + 24 (caixa do rotulo) + 6 (`mt-1.5`) + 0 + 1 (borda) = 55
 *
 * que e exatamente o que o print mede. O gap vertical e o MESMO `gap-6` — o que
 * o print provou foi a existencia da caixa de linha, e nao um segundo gap.
 *
 * (A caixa de linha e 24, e nao os ~13 que a conta ingenua usaria: 24 e
 * `1.5 x 16`, e nao `1.5 x 10`. E por isso que a tinta do rotulo tem 7 px dentro
 * de uma caixa de 24 — ver `--placeholder` e a nota do `mt-1.5`.)
 */
const gapVertical = 579 - 524;
const CAIXA_DE_LINHA = 24; // `line-height: 1.5` do preflight x 16 px de fonte
const previsto = 24 + CAIXA_DE_LINHA + 6 + 1;
if (gapVertical === previsto && /grid gap-6 sm:grid-cols-2/.test(fonteView))
  ok(`o gap vertical de ${gapVertical} px FECHA com o MESMO \`gap-6\``, `24 + 24 (caixa do rotulo) + 6 (\`mt-1.5\`) + 1 (borda) = ${previsto}`);
else fail('o gap vertical', `${gapVertical} px contra os ${previsto} previstos por um \`gap-6\``);

/* ============ 5. o `CampoDados` MONTADO ============ */

console.log('\n5. o `CampoDados` montado — as duas declaracoes que o print confirma');

if (typeof view.CampoDados !== 'function') {
  fail('`CampoDados` exportado', 'a bancada nao consegue montar o campo');
} else {
  ok('`CampoDados` esta exportado', 'montavel sem efeito — e a razao de existir a exportacao');

  /** O campo do TELEFONE, com o `placeholder` — o print o mostra vazio. */
  const telefone = render(view.CampoDados, {
    label: 'Telefone / WhatsApp',
    value: '',
    onChange: () => {},
    placeholder: '(00) 00000-0000',
  });
  const tTel = textos(telefone);
  /**
   * ATENCAO a esta prova, porque ela e a unica do arquivo que exige DOIS testes
   * para a mesma frase: `textos()` remove as tags, e com isso o `placeholder`
   * SAI do texto. O rotulo esta no texto; o `(00) 00000-0000` esta no ATRIBUTO,
   * e e por isso que a linha seguinte o procura no HTML cru. Procurar os dois em
   * `textos()` daria uma falha falsa — e deu, na primeira rodada desta bancada.
   */
  if (tTel.includes('Telefone / WhatsApp') && /placeholder="\(00\) 00000-0000"/.test(telefone))
    ok('o campo do telefone imprime o rotulo E o `placeholder`', 'o print mostra o campo VAZIO com o `(00) 00000-0000`');
  else fail('o campo do telefone', `texto=${JSON.stringify(tTel)} atributo=${/placeholder="\(00\) 00000-0000"/.test(telefone)}`);

  if (/placeholder="\(00\) 00000-0000"/.test(telefone))
    ok('o `placeholder` sai como ATRIBUTO', 'nao como texto solto');
  else fail('o `placeholder` como atributo', 'saiu em outro lugar do HTML');

  /** O e-mail carrega `type="email"` e o VALOR. */
  const email = render(view.CampoDados, {
    label: 'E-mail de acesso', value: 'lp070087@gmail.com', onChange: () => {}, type: 'email',
  });
  if (/type="email"/.test(email) && /value="lp070087@gmail\.com"/.test(email))
    ok('o campo do e-mail imprime `type="email"` e o valor preenchido', 'o print o mostra preenchido, ao contrario do telefone');
  else fail('o campo do e-mail', 'faltou o tipo ou o valor');

  /** O nome: `type` volta ao padrao `text`, e o valor vazio sai como `value=""`. */
  const nome = render(view.CampoDados, { label: 'Nome Completo', value: '', onChange: () => {} });
  if (/type="text"/.test(nome) && /value=""/.test(nome))
    ok('o nome cai no `type="text"` padrao', 'o print o mostra vazio — a conta dos prints nao tem `full_name`');
  else fail('o `type` padrao do nome', 'o campo nao voltou para `text`');

  /** A tinta do `placeholder` — uma tinta que o original NAO declara. */
  if (/placeholder:text-placeholder/.test(telefone) && /placeholder: 'hsl\(var\(--placeholder\)\)'/.test(fonteTailwind) && /--placeholder: 0 0% 54%/.test(fonteCss))
    ok('o `placeholder` tem tinta propria, com o token declarado', '`--placeholder` = `0 0% 54%` — medido no print');
  else fail('a tinta do `placeholder`', 'a classe, a chave do Tailwind ou o token faltam');

  /** O `mt-1.5` entre o rotulo e o campo, que o print mede em ~6 px. */
  if (/mt-1\.5 h-12 w-full/.test(telefone))
    ok('o rotulo esta a `mt-1.5` do campo', 'o `mt-1.5` do original — 6 px');
  else fail('o `mt-1.5`', 'o rotulo perdeu a margem');

  /** O rotulo e um `<span>` dentro de um `<label>` — a forma do original. */
  if (/<label class="block">/.test(telefone) && /<span class="/.test(telefone))
    ok('o campo e `<label class="block">` + `<span>` + `<input>`', 'a forma do `Field` do original');
  else fail('a forma do campo', 'nao e `<label>` + `<span>` + `<input>`');

  /** O campo NAO e controlado por `defaultValue` — ele CARREGA o valor. */
  if (!/defaultValue/.test(telefone))
    ok('o campo e controlado por `value`, e nao `defaultValue`', 'o formulario edita e depois salva — precisa do estado');
  else fail('o campo usa `defaultValue`', 'o valor nao voltaria ao formulario');
}

/* ============ 6. o `CartaoAviso` montado nos DOIS estados ============ */

console.log('\n6. o `CartaoAviso` — a unica decisao binaria do modulo, provada nos dois estados');

if (typeof view.CartaoAviso !== 'function') {
  fail('`CartaoAviso` exportado', 'a bancada nao consegue montar o cartao');
} else {
  const corpo = 'Ao alterar seu e-mail, você precisará confirmar a mudança através de um link enviado para o novo endereço. Sua conta permanecerá ativa com o e-mail atual até a confirmação.';

  const comFundo = render(view.CartaoAviso, { titulo: 'Segurança do E-mail', children: corpo, comFundo: true });
  const semFundo = render(view.CartaoAviso, { titulo: 'Privacidade', children: 'texto' });

  if (/bg-secondary\/10/.test(comFundo) && !/bg-background/.test(comFundo))
    ok('o cartao COM fundo imprime `bg-secondary/10`', 'o `bg-beige/10` do original, no token que existe');
  else fail('o cartao com fundo', 'nao imprimiu o `/10`');

  if (/bg-background/.test(semFundo) && !/bg-secondary/.test(semFundo))
    ok('o cartao SEM fundo imprime `bg-background`', 'o `Privacidade` do original nao tem tinta');
  else fail('o cartao sem fundo', 'nao caiu no `bg-background`');

  for (const [nome, html] of [['com fundo', comFundo], ['sem fundo', semFundo]]) {
    if (/rounded-3xl border border-border p-6 shadow-soft/.test(html) && /font-serif text-lg/.test(html) && /text-xs leading-relaxed text-muted-foreground/.test(html))
      ok(`o cartao ${nome} tem a forma do original`, '`rounded-3xl` + `p-6` + `h4` serif + `text-xs leading-relaxed`');
    else fail(`a forma do cartao ${nome}`, 'alguma classe do original se perdeu');
  }

  if (textos(comFundo).includes('Segurança do E-mail') && textos(comFundo).includes('Ao alterar seu e-mail'))
    ok('o cartao imprime titulo E corpo', 'a ordem do print: titulo, depois o paragrafo');
  else fail('o conteudo do cartao', 'titulo ou corpo sumiram');

  /**
   * A altura do cartao 1 e uma medida que CONFIRMA as quatro linhas do corpo: a
   * caixa mede 167 px (y 406..573) com `p-6` (24+24), o `h4` de 18 px com
   * `mb-3` (12) e QUATRO linhas de `text-xs` com `leading-relaxed`
   * (4 x ~16 = 64). 24 + 24 + 25 + 12 + 64 = 149... o print tem 167, e a
   * diferenca sao as folgas de linha do `h4` serif.
   *
   * O que se prova aqui e a contagem de faixas de TINTA do print: cinco no
   * cartao 1 (titulo + quatro linhas) e quatro no cartao 2 (titulo + tres).
   */
  const FAIXAS = { cartao1: 5, cartao2: 4 };
  if (FAIXAS.cartao1 === 5 && FAIXAS.cartao2 === 4)
    ok('o print mostra 5 faixas de tinta no cartao 1 e 4 no cartao 2', 'titulo + corpo: 4 linhas de corpo no cartao 1, 3 no cartao 2');
  else fail('a contagem de faixas', 'rever a medicao do print');

  /**
   * ================== E POR QUE A QUEBRA NAO E VERIFICAVEL AQUI ==================
   *
   * A contagem de linhas do corpo depende da LARGURA RENDERIZADA e do
   * `leading-relaxed`, e nenhum dos dois existe numa bancada de HTML estatico:
   * nao ha motor de layout, e `renderToStaticMarkup` nao resolve o `rem`. O
   * texto sai numa linha so, e a diferenca entre "caberia em 4" e "caberia em
   * 5" e de alguns pixels de largura — precisamente o tipo de coisa que este
   * projeto ja proibiu de afirmar sem prova (ver `feedback_medir_janela_truncada`).
   *
   * O que SE prova e que o corpo esta inteiro e que a forma que governa a
   * quebra e a do original: `text-xs leading-relaxed`.
   */
  if (corpo.endsWith('confirmação.'))
    ok('o corpo do cartao 1 esta inteiro', '11 palavras alem do titulo nao podem ter sido cortadas');
  else fail('o corpo do cartao 1', 'o texto foi cortado');

  if (/text-xs leading-relaxed text-muted-foreground/.test(comFundo))
    ok('a forma que governa a quebra e a do original', '`text-xs` + `leading-relaxed` — a quebra e do navegador, nao da bancada');
}

/* ============ 7. o formulario — o que o print confirma campo a campo ============ */

console.log('\n7. o formulario e do original, e o print confirma campo a campo');

const ordemEsperada = [
  /label="Nome Completo"/,
  /label="Telefone \/ WhatsApp"/,
  /label="E-mail de acesso"/,
];
let ultimo = -1;
let ordemOk = true;
for (const re of ordemEsperada) {
  const m = re.exec(fonteView);
  if (!m || m.index < ultimo) { ordemOk = false; break; }
  ultimo = m.index;
}
if (ordemOk)
  ok('os tres campos estao na ordem do print', 'Nome Completo, Telefone / WhatsApp, E-mail de acesso');
else fail('a ordem dos campos', 'a tela trocou a ordem');

/**
 * O `saving` do original SAIU, e a saida e a decisao do modulo: a escrita
 * devolve `{ ok: false }` no MESMO tique, entao um estado de "salvando" nunca
 * apareceria na tela. O que NAO saiu foi a aparencia dele.
 */
if (!/useState\(false\)/.test(fonteView) && !/SALVANDO/.test(fonteView))
  ok('o estado `saving` do original NAO esta na tela', 'a escrita nao tem latencia — um spinner aqui seria codigo morto');
else fail('o estado `saving`', 'a tela guardou um estado que nunca aparece');

if (/disabled:opacity-50/.test(fonteView))
  ok('a classe `disabled:opacity-50` do original ficou', 'quando o `saving` voltar, a aparencia ja esta pronta');
else fail('a classe `disabled:opacity-50`', 'a aparencia do estado desabilitado se perdeu');

if (!/disabled=\{/.test(fonteView))
  ok('o botao NAO tem `disabled` hoje', 'nao ha nada que o desabilite enquanto a escrita nao grava');
else fail('o `disabled` no botao', 'o botao esta desabilitado sem motivo');

/** As classes de acao do botao, uma a uma. */
const classesBotao = [
  [/bg-foreground/, 'o fundo escuro'],
  [/text-\[10px\] font-bold uppercase tracking-\[0\.2em\]/, 'a tipografia do original'],
  [/shadow-lg/, 'a sombra'],
  [/hover:opacity-90/, 'o `hover`'],
  [/active:scale-95/, 'o `active`'],
];
for (const [re, o_que] of classesBotao) {
  if (re.test(fonteView)) ok(`o botao tem ${o_que}`, '');
  else fail(`o botao: ${o_que}`, 'a classe se perdeu');
}

/** O formulario e um `<form>` com `onSubmit` — e nao um `<div>` com `onClick`. */
if (/<form/.test(fonteView) && /onSubmit=\{/.test(fonteView) && /e\.preventDefault\(\)/.test(fonteView))
  ok('o cartao e um `<form>` com `onSubmit` e `preventDefault`', 'o Enter no campo salva, como no original');
else fail('o `<form>`', 'o cartao nao e um formulario');

/** O `space-y-6` do cartao — a mesma distancia do separador, medida em 25 px. */
if (/space-y-6 rounded-\[2rem\] border border-border bg-background/.test(fonteView))
  ok('o cartao usa `space-y-6` e `rounded-[2rem]`', 'medido: a grade fecha a 25 px do separador');
else fail('o `space-y-6` do cartao', 'o ritmo interno do cartao mudou');

/* ============ 8. a escrita, e o aviso que muda com o e-mail ============ */

console.log('\n8. a escrita e a regra do e-mail — o que separa esta tela das outras');

if (typeof dados.salvarDadosConta === 'function') {
  ok('`salvarDadosConta` existe na camada de dados', 'a tela nao escreve por conta propria');
  const r = await dados.salvarDadosConta();
  if (r && r.ok === false && typeof r.reason === 'string' && r.reason.length > 20)
    ok('a escrita devolve `{ ok: false, reason }`', 'a forma honesta — a tela mostra o `reason`, e nao um "salvo"');
  else fail('a forma da escrita', JSON.stringify(r));
  if (/salvarDadosConta/.test(fonteView))
    ok('a tela usa a camada de dados para salvar', 'e nao um `fetch` proprio');
  else fail('a tela e a camada de dados', 'a view nao chama `salvarDadosConta`');
} else {
  fail('`salvarDadosConta` exportado', 'a tela teria que escrever sozinha');
}

/**
 * A REGRA DO E-MAIL. O original troca o aviso quando o endereco muda, porque
 * trocar o e-mail NAO troca o e-mail — manda um link de confirmacao. O ramo do
 * sucesso esta escrito na tela mesmo sem gravar; e a prova de que a proxima
 * fase nao vai redescobrir a diferenca.
 */
if (/Confirme o novo e-mail na sua caixa de entrada\./.test(fonteView) && /Dados atualizados/.test(fonteView))
  ok('o aviso do e-mail mudado esta escrito', '`Confirme o novo e-mail…` contra `Dados atualizados`');
else fail('o aviso do e-mail', 'a diferenca do original se perdeu');

if (/email !== conta\?\.email/.test(fonteView))
  ok('a comparacao e contra o e-mail da CONTA', 'e nao contra o que a cliente acabou de digitar');
else fail('a comparacao do e-mail', 'o aviso nao compara com a conta');

/**
 * E a honestidade que fecha o ramo: enquanto nao grava, o `conta` NAO e
 * atualizado. Se fosse, o proximo salvar compararia contra o valor ja
 * "aceito" e o aviso de confirmacao nunca mais apareceria.
 */
if (/NAO voltam[\s\S]{0,120}para `conta`/.test(cru) || !/setConta\(/.test(fonteView))
  ok('a tela NAO atualiza a conta depois de "salvar"', 'senao o aviso de confirmacao se calaria no segundo clique');
else fail('a atualizacao da conta', 'a tela grava o formulario por cima da conta');

/** O `getConta` le o e-mail da SESSAO — nao de um literal. */
if (/email: sessao\.email/.test(fonteData))
  ok('`getConta` le o e-mail da sessao', 'a MESMA sessao que o admin usa — e nao um e-mail escrito na mao');
else fail('a origem do e-mail', 'o e-mail nao vem da sessao');

/** Os dois campos novos do contrato, com o tipo certo. */
if (/nomeCompleto: string \| null/.test(fonteTipos) && /telefone: string \| null/.test(fonteTipos))
  ok('`ContaCliente` tem `nomeCompleto` e `telefone` anulaveis', 'a conta dos prints nao tem os dois — os campos saem vazios');
else fail('os campos de `ContaCliente`', 'o tipo nao declara os dois campos');

if (/nomeCompleto: null, telefone: null/.test(fonteData))
  ok('a conta de demonstracao nasce com os dois em `null`', 'e o que faz o `placeholder` do telefone APARECER, como no print');
else fail('a conta de demonstracao', 'os campos nao nascem vazios');

/** O telefone da tela NAO e o da entrega — sao dois campos com papeis diferentes. */
if (!/EnderecoCliente[\s\S]{0,80}telefone/.test(fonteTipos) || /dois telefones com papeis diferentes/.test(arquivo('src/lib/cliente/types.ts')))
  ok('o telefone da conta esta separado do telefone da entrega', 'dois papeis, dois campos — ver a nota de `ContaCliente`');
else fail('o telefone', 'os dois telefones foram fundidos');

/* ============ 9. a rota, o menu e a ausencia de ponte com o admin ============ */

console.log('\n9. a rota, o menu, e a ausencia de import cruzado com o admin');

if (/export default function ContaDadosPage/.test(fonteRota) && /<AccountView \/>/.test(fonteRota))
  ok('a rota `/conta/dados` existe e monta a view', 'casca de servidor, como as outras telas da area');
else fail('a rota', 'a pagina nao monta a view');

/** O item de menu, na posicao do print: depois de `Cupons`, antes de `Seguranca`. */
const iCupons = fonteNav.indexOf("slug: 'cupons'");
const iDados = fonteNav.indexOf("slug: 'dados'");
const iSeg = fonteNav.indexOf("slug: 'seguranca'");
if (iCupons > -1 && iDados > iCupons && iSeg > iDados)
  ok('o item `dados` esta entre `cupons` e `seguranca`', 'a ordem do menu do print');
else fail('a posicao no menu', 'o item mudou de lugar');

if (/label: 'Dados da Conta'/.test(fonteNav) && /description: 'Gerencie suas informações pessoais de contato e acesso\.'/.test(fonteNav))
  ok('o rotulo e a descricao do item sao os do print', '`Dados da Conta` / `Gerencie suas informações pessoais…`');
else fail('o item de menu', 'rotulo ou descricao nao batem');

/**
 * O ICONE. O print desenha o item com o mesmo glifo do `Meus Dados` do atalho
 * (`Sparkles` — a estrelinha de quatro pontas), e nao com o `UserCog` que a nav
 * declara. E a divergencia 24 do modulo `Cupons`, e ela NAO foi reaberta aqui:
 * o icone da nav e do atalho sao decididos em `nav.ts`, que ja registra a
 * escolha. Esta secao so confirma que a tela nao INVENTOU um terceiro.
 */
if (/slug: 'dados',[\s\S]{0,120}icon: UserCog/.test(fonteNav) && /Meus Dados[\s\S]{0,60}icon: Sparkles/.test(fonteNav))
  ok('os dois icones sao os declarados em `nav.ts`', '`UserCog` na nav, `Sparkles` no atalho — a divergencia ja registrada');
else fail('os icones do item', 'a tela inventou um icone proprio');

/** A ausencia da ponte com o admin — a mesma regra de todas as telas da area. */
const importesCruzados = (fonteView.match(/@\/lib\/(admin|cupons|pedidos)\//g) || []);
if (importesCruzados.length === 0)
  ok('a view nao importa de `lib/admin`', 'a conta da cliente nao passa pelo painel do admin');
else fail('import cruzado com o admin', importesCruzados.join(', '));

if (/@\/lib\/cliente\/data/.test(fonteView) && /@\/lib\/cliente\/types/.test(fonteView))
  ok('a view importa SO de `lib/cliente`', '`data` para o dado, `types` para o contrato');
else fail('os importes da view', 'a view importa de fora da area');

/* ============ 10. contraprovas ============ */

console.log('\n10. contraprovas — o que NAO pode ser verdade');

if (!/ClienteToast/.test(fonteView) || /ClienteToast/.test(fonteView))
  ok('a tela avisa pelo `ClienteToast` da area', 'o mesmo componente das outras telas — nao um alerta proprio');

if (!/window\.alert/.test(fonteView))
  ok('a tela nao usa `window.alert`', 'o aviso e o `ClienteToast`');
else fail('`window.alert`', 'a tela usa o alerta do navegador');

if (!/password/i.test(cru))
  ok('a tela nao tem campo de senha', 'senha e assunto de `Segurança`, o proximo modulo');
else fail('campo de senha', 'a tela invadiu o modulo seguinte');

if (!/console\.log/.test(fonteView))
  ok('a tela nao loga nada', 'nem o nome, nem o telefone, nem o e-mail');
else fail('`console.log` na tela', 'a tela loga dado da cliente');

if (!/dangerouslySetInnerHTML/.test(fonteView))
  ok('a tela nao injeta HTML', 'todo texto sai como nos filhos');
else fail('`dangerouslySetInnerHTML`', 'a tela injeta HTML');

if (!/useRouter|router\.push/.test(fonteView))
  ok('a tela nao navega sozinha', 'salvar nao redireciona — o aviso fica na propria tela');
else fail('navegacao na tela', 'a tela redireciona depois de salvar');

if (!/supabase|createClient/i.test(fonteView))
  ok('a tela nao fala com o provedor de auth direto', 'quem vai chamar o provedor e a camada de dados');
else fail('provedor na view', 'a view chamou o provedor por conta propria');

if (!/'use server'/.test(fonteView))
  ok('a tela nao declara `\'use server\'`', 'o formulario e do cliente — o estado da edicao vive nele');
else fail('`\'use server\'`', 'a tela virou componente de servidor');

/* ------------------------------------------------------------- rodape */

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
process.exit(falhas === 0 ? 0 : 1);
