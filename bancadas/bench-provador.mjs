/**
 * Bancada do cluster `Provador e IA` — Avatar Virtual, Provador Virtual e IA de Looks.
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o `next/font/google`
 * espera as fontes para sempre). Sem esta bancada, a unica garantia seria o
 * typecheck — que nao ordena uma lista, nao casa acento, nao conta ocorrencias e
 * nao ve um ramo invertido.
 *
 * ================== O QUE ESTA BANCADA TEM DE DIFERENTE ==================
 *
 * Todas as bancadas anteriores provavam uma tela. Esta prova TRES, e prova uma
 * coisa que nenhuma outra precisou provar: **que um item NAO esta na lista**.
 *
 * O modulo inteiro se apoia numa decisao — o seletor de produtos e um JOIN sobre
 * `lib/produtos`, e nao a lista transcrita do print — e essa decisao so vale se o
 * item que existe SO no print (`Conjunto Glow Nude`) ficar de fora E os nove do
 * catalogo entrarem. Um `includes` nao prova isso: a prova e o PAR —
 * `contar(lista, 'Conjunto Glow Nude') === 0` **e** os nove ids presentes.
 * Se o fantasma entrar, a primeira falha. Se outro sumir, a segunda.
 *
 * ================== AS DUAS LISTAS DO PRINT, E A QUE MANDA ==================
 *
 * O proprio modulo traz duas listas que se contradizem (lidas no pixel):
 *
 *   SELETOR (adm-041/043/046)  tem `Macaquinho`, NAO tem `Top Essential Sustentação`
 *   DROPDOWN DA IA (adm-049)   tem `Top Essential Sustentação`, NAO tem `Macaquinho`
 *
 * as duas com `Conjunto Glow Nude`, que nao existe no catalogo. A bancada confere
 * as DUAS diferencas pelo nome, para que a divergencia fique medida e nao
 * esquecida — ver `lib/provador/metrics.ts`, `O DONO DA LISTA`.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Nada de layout, cor, posicao ou responsividade — isso e navegador. E ela tambem
 * NAO prova a qualidade das imagens do avatar: elas nao existem (`url: null`), e a
 * bancada confere justamente que nenhuma URL do bucket de ORIGEM vazou para o
 * codigo.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-provador.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-provador');

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

/** Igualdade profunda que nao LANCA: a bancada precisa poder falhar sozinha. */
function mesmo(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
 * Raizes da COMPILACAO: so o modulo novo. O compilador segue os `import` sozinho,
 * entao `lib/produtos`, `components/ui/*` e `lib/utils` entram por conta propria.
 * Compilar o `src` inteiro estoura o limite de ~178 s do `bash`.
 *
 * NOTA SOBRE `strict: false`: aqui ele serve apenas para EMITIR JavaScript. O
 * typecheck de verdade rodou com `strict: true` no `tsconfig.json` do projeto e
 * passou — essa e a autoridade sobre tipos, nao esta bancada.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/](provador|produtos)|components[\\/]admin[\\/]provador|app[\\/]admin[\\/](avatar-virtual|provador-virtual|ia-looks))[\\/]/.test(
    f,
  ),
);

const programa = ts.createProgram(raizes, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipLibCheck: true,
  /**
   * `strict: true` — O MESMO DO PROJETO.
   *
   * A primeira versao emitia com `strict: false` (a receita herdada das bancadas
   * anteriores) e acusou tres erros que o `tsc --noEmit` do projeto NAO acusa: com
   * `strictNullChecks` desligado, o TypeScript nao estreita a uniao discriminada de
   * `Aba`, e o `setAba` de `useState<Aba>` deixa de casar com o `onChange: (value:
   * string) => void` do `SegmentedTabs`.
   *
   * E exatamente a armadilha registrada em `feedback_bancada_strict_false_mente`: a
   * bancada acusava um defeito que nao existe, e a "correcao" natural seria mexer no
   * componente — ou seja, estragar codigo certo por causa do instrumento. Com
   * `strict: true`, os diagnosticos da bancada e do projeto falam a mesma lingua.
   */
  strict: true,
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

const dados = require(join(OUT, 'src/lib/provador/data.js'));
const demo = require(join(OUT, 'src/lib/provador/demo.js'));
const metricas = require(join(OUT, 'src/lib/provador/metrics.js'));
const produtosDemo = require(join(OUT, 'src/lib/produtos/demo.js'));
const { AiSettingsPanel, AiSuggestionsPanel } = require(join(OUT, 'src/components/admin/provador/ai-panels.js'));
const { AvatarPreview } = require(join(OUT, 'src/components/admin/provador/avatar-preview.js'));
const { AvatarView } = require(join(OUT, 'src/components/admin/provador/avatar-view.js'));
const { IALooksView } = require(join(OUT, 'src/components/admin/provador/ia-looks-view.js'));
const { PieceConfigPanel } = require(join(OUT, 'src/components/admin/provador/piece-config.js'));
const { ProductPicker } = require(join(OUT, 'src/components/admin/provador/product-picker.js'));
const { ProvadorInsights } = require(join(OUT, 'src/components/admin/provador/provador-insights.js'));
const { ProvadorView } = require(join(OUT, 'src/components/admin/provador/provador-view.js'));
const { AnalyticsCards, LooksSalvosCards } = require(join(OUT, 'src/components/admin/provador/usage-stats.js'));

/* ------------------------------------------------------------- utilidades */

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o
 * `toLocaleString('pt-BR')` usa espaco inquebravel e o `\s` do JS nao o pega.
 */
const normalizar = (s) => s.replace(/[\s ]+/g, ' ').trim();
function textos(html) {
  return normalizar(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&aacute;/g, 'á')
      .replace(/&eacute;/g, 'é')
      .replace(/&iacute;/g, 'í')
      .replace(/&oacute;/g, 'ó')
      .replace(/&uacute;/g, 'ú')
      .replace(/&atilde;/g, 'ã')
      .replace(/&ccedil;/g, 'ç'),
  );
}

/**
 * QUANTAS VEZES UM TRECHO APARECE.
 *
 * A pergunta desta bancada nao e "existe?" (isso um `includes` responde), e sim
 * "QUANTAS?" — as nove linhas de `Imagem do provador pendente` do seletor e as
 * tres colunas de vista do configurador. Um `includes` passaria com UMA ocorrencia
 * onde o print tem NOVE.
 */
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

/**
 * UM ATRIBUTO DE UM HTML — pelo NOME.
 *
 * ================== POR QUE ISTO E SEPARADO DE `textos()` ==================
 *
 * `textos()` tira as tags, e com elas os ATRIBUTOS. `placeholder`, `value` e
 * `aria-label` moram DENTRO de uma tag: procurar `Buscar produto...` no texto de
 * um `<input placeholder="...">` nunca acha nada, porque o texto visivel comeca
 * depois do `>`. A licao ja esta registrada em
 * `feedback_bancada_placeholder_atributo`: tirar as tags apaga o `placeholder`.
 *
 * Aqui o valor e lido do HTML CRU, com a tag no meio.
 */
function atributoDe(html, nome) {
  const achados = [];
  const re = new RegExp(`${nome}="([^"]*)"`, 'g');
  let casou;
  while ((casou = re.exec(html)) !== null) achados.push(casou[1]);
  return achados;
}

/** O codigo de um arquivo, sem comentarios e sem os atributos vazios. */
function semComentarios(codigo) {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/=""/g, '');
}

const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');
const render = (Componente, props) => renderToStaticMarkup(react.createElement(Componente, props));

/**
 * ================== LER A FAIXA DE ABAS, SEM NAVEGADOR ==================
 *
 * As tres telas deste modulo sao de ABAS, e `renderToStaticMarkup` nao atende a um
 * clique: ele desenha a aba que nasce ativa e mais nada. A PRIMEIRA RODADA desta
 * bancada tropecou nisso — seis assercoes do painel `Configuracoes da IA`
 * acusaram "ausente" num componente que o print `235711.png` confirma estar certo.
 * O defeito era do INSTRUMENTO, nao da tela.
 *
 * ================== O QUE NAO SE FEZ PARA "RESOLVER" ==================
 *
 * Nao se passou a aceitar uma prop de aba inicial so para a bancada poder escolher
 * o painel: isso seria mudar o produto por causa do teste, que e o que o comando
 * proibe. O que se fez foi LER a tela por partes:
 *
 *   `faixa()`       os rotulos das abas e QUAL esta marcada — o que o print mostra
 *   `foraDaFaixa()` o resto do html, sem a faixa
 *
 * E, para os PAINEIS, a bancada passa a chamar os componentes que a propria tela
 * ja tem como partes: `ProvadorInsights` recebe `aba` por prop, e `LooksSalvosCards`
 * e `AnalyticsCards` sao exportados por `usage-stats.tsx`. A tela ja era feita de
 * partes testaveis — o instrumento e que estava olhando o conjunto.
 */
function faixa(html) {
  const inicio = html.indexOf('role="tablist"');
  if (inicio < 0) return { abas: [], ativa: -1, faixaHtml: '', fim: -1 };
  const fim = html.indexOf('</div>', inicio);
  const faixaHtml = html.slice(inicio, fim);
  const abas = faixaHtml
    .split('<button')
    .slice(1)
    .map((pedaco) => textos(pedaco.slice(pedaco.indexOf('>') + 1).split('</button>')[0]));
  const ativa = atributoDe(faixaHtml, 'aria-selected').findIndex((v) => v === 'true');
  return { abas, ativa, faixaHtml, fim };
}

/**
 * O TEXTO DA TELA SEM A FAIXA DE ABAS.
 *
 * Sem isto, `Imagens das pecas` — que e rotulo de aba — entraria na contagem dos
 * paineis. E o mesmo tipo de contaminacao que ja mordeu a bancada de Cupons, onde
 * os rotulos dos `<option>` poluiam a medida dos rotulos de campo.
 */
function foraDaFaixa(html) {
  const { fim } = faixa(html);
  if (fim < 0) return textos(html);
  return textos(html.slice(fim + '</div>'.length));
}

/**
 * O REPOUSO QUE AS TELAS RECEBEM — o mesmo que a pagina monta.
 *
 * Montado AQUI, e nao importado de `demo.DEMO_PIECE`, por um motivo que se
 * documenta: a bancada precisa mostrar que a config nasce do PRODUTO, e para isso
 * ela tem que controlar o repouso. Se ela usasse o repouso do modulo, uma mudanca
 * no `demo` faria a prova passar por acidente (os dois lados mudariam juntos).
 */
const REPOUSO = { layer: 3, position: 'automatica', views: { frente: '', lado: '', costas: '' } };
const CATALOGO = produtosDemo.DEMO_PRODUCTS_PRODUTOS;
const CATEGORIAS = produtosDemo.DEMO_CATEGORIES_PRODUTOS;
const LISTA = metricas.selectorProducts(CATALOGO);

const NOMES_CATALOGO = [
  'Cropped Urban Fit',
  'Jaqueta Corta Vento Fit',
  'Kit Nike',
  'Legging Modeladora Premium',
  'Macaquinho',
  'Macaquinho costas nuas',
  'Short Fitness Energy',
  'Top Essential Sustentação',
  'top',
];
const FANTASMA = 'Conjunto Glow Nude';

/* ======================= 1. o catalogo e o fantasma ======================= */

console.log('\n1. a lista: JOIN sobre o catalogo, e o item que so existe no print');

if (CATALOGO.length === 9) ok('o catalogo tem NOVE produtos', 'p-01 a p-09');
else fail('catalogo com tamanho inesperado', String(CATALOGO.length));

if (LISTA.length === 9) ok('o seletor devolve NOVE', `${LISTA.length} itens`);
else fail('seletor com tamanho inesperado', String(LISTA.length));

{
  const ordenados = [...LISTA].map((p) => p.name);
  const esperado = [...NOMES_CATALOGO].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (mesmo(ordenados, esperado)) ok('a ordem e alfabetica pt-BR', ordenados.join(' · '));
  else fail('ordem divergente', ordenados.join(' · '));
}

/**
 * A PROVA PRINCIPAL DESTA BANCADA — o item ausente, pelo nome.
 *
 * Se `Conjunto Glow Nude` entrar na lista, a bancada FALHA aqui. E ela falha
 * ALTO: uma bancada que so conferisse "tem nove itens" passaria tanto com a lista
 * certa quanto com a lista do print + fantasma - outro produto.
 */
{
  const nomes = LISTA.map((p) => p.name);
  if (contar(nomes.join('\u0001'), FANTASMA) === 0) {
    ok('`Conjunto Glow Nude` NAO esta na lista', 'falharia se entrasse');
  } else {
    fail('o produto fantasma ENTROU na lista', FANTASMA);
  }
}

{
  const faltando = NOMES_CATALOGO.filter((nome) => !LISTA.some((p) => p.name === nome));
  if (faltando.length === 0) ok('os NOVE do catalogo estao presentes', 'nenhum ficou de fora');
  else fail('produto do catalogo ficou de fora', faltando.join(' · '));
}

/** E o fantasma tambem NAO pode aparecer escrito em lugar nenhum do modulo. */
{
  const suspeitos = [
    'src/lib/provador/demo.ts',
    'src/lib/provador/metrics.ts',
    'src/lib/provador/data.ts',
    'src/components/admin/provador/product-picker.tsx',
    'src/components/admin/provador/piece-workspace.tsx',
  ];
  const comFantasma = suspeitos.filter((rel) => contar(semComentarios(arquivo(rel)), FANTASMA) > 0);
  if (comFantasma.length === 0) ok('o fantasma nao esta transcrito em codigo', 'nem em constante');
  else fail('o fantasma foi transcrito', comFantasma.join(' · '));
}

/** As DUAS diferencas contra os dois prints do modulo — medidas, nao esquecidas. */
{
  const temMacaquinho = LISTA.some((p) => p.name === 'Macaquinho');
  const temEssential = LISTA.some((p) => p.name === 'Top Essential Sustentação');
  if (temMacaquinho && temEssential) {
    ok('o seletor mostra OS DOIS que os prints discordam', 'Macaquinho e Top Essential');
  } else {
    fail('faltou um dos dois produtos da divergencia', `${temMacaquinho} / ${temEssential}`);
  }
}

/** `Macaquinho costas nuas` X `Macaquinho`: dois produtos, nao um truncado. */
{
  const nuas = LISTA.find((p) => p.name === 'Macaquinho costas nuas');
  const simples = LISTA.find((p) => p.name === 'Macaquinho');
  if (nuas && simples && nuas.id !== simples.id) ok('`Macaquinho` e `Macaquinho costas nuas` sao distintos', `${simples.id} / ${nuas.id}`);
  else fail('os dois macaquinhos se confundiram');
}

/* ============================ 2. a busca ============================ */

console.log('\n2. a busca do seletor — sem acento e sem caixa');

if (metricas.filterProducts(LISTA, '').length === 9) ok('termo vazio devolve os nove');
else fail('termo vazio filtrou indevidamente');

/** O acento: buscar sem acento tem que achar. Sem o NFD, nao acharia. */
{
  const achou = metricas.filterProducts(LISTA, 'sustentacao');
  if (achou.length === 1 && achou[0].name === 'Top Essential Sustentação') {
    ok('`sustentacao` acha `Sustentação`', 'NFD remove os diacriticos');
  } else {
    fail('a busca nao normalizou o acento', JSON.stringify(achou.map((p) => p.name)));
  }
}
{
  const achou = metricas.filterProducts(LISTA, 'Sustentação');
  if (achou.length === 1) ok('`Sustentação` (com acento) tambem acha');
  else fail('a busca falhou COM acento', String(achou.length));
}
{
  const achou = metricas.filterProducts(LISTA, 'KIT');
  if (achou.length === 1 && achou[0].name === 'Kit Nike') ok('a busca ignora a caixa', '`KIT` acha `Kit Nike`');
  else fail('a busca nao ignorou a caixa', JSON.stringify(achou.map((p) => p.name)));
}
{
  const achou = metricas.filterProducts(LISTA, 'macaquinho');
  if (achou.length === 2) ok('`macaquinho` acha DOIS', 'e nao um prefixo do outro');
  else fail('a busca casou errado os dois macaquinhos', String(achou.length));
}

/**
 * A PROVA AO CONTRARIO DA BUSCA — `Glow` tem que dar VAZIO.
 *
 * E o estado `Nenhum produto encontrado.` de adm-040. Se esta busca devolvesse
 * algo, significaria que a lista transcreveu o print.
 */
{
  const achou = metricas.filterProducts(LISTA, 'Glow');
  if (achou.length === 0) ok('buscar `Glow` devolve VAZIO', 'o estado vazio de adm-040');
  else fail('buscar `Glow` achou algo', JSON.stringify(achou.map((p) => p.name)));
}

/* ================== 3. a config nasce do PRODUTO, nao do repouso ================== */

console.log('\n3. a montagem da config — a categoria vem do produto');

/**
 * O REPOUSO CARREGA `layer` E `position`, E SO. Este e o tipo `PieceDefaults`.
 *
 * O episodio que motivou a prova: o componente montava o objeto com o repouso
 * espalhado por ULTIMO, e como o repouso tinha `categoryId`, ele sobrescrevia a
 * categoria do produto. O `tsc` acusou (TS2783) e o tipo foi corrigido — mas a
 * prova tem que existir, porque "o tipo impede" so vale se o tipo tiver os campos
 * excluidos.
 */
{
  const repousoTemCategoria = Object.prototype.hasOwnProperty.call(REPOUSO, 'categoryId');
  const repousoTemProduto = Object.prototype.hasOwnProperty.call(REPOUSO, 'productId');
  if (!repousoTemCategoria && !repousoTemProduto) {
    ok('o repouso NAO tem `categoryId` nem `productId`', 'o tipo impede a escrita');
  } else {
    fail('o repouso voltou a ter os campos do produto', `${repousoTemCategoria} / ${repousoTemProduto}`);
  }
}

/**
 * A PROVA COM DOIS PRODUTOS DE CATEGORIAS DIFERENTES.
 *
 * Com UM produto so, um `cat-tops` fixo passaria — e foi exatamente o defeito.
 * Por isso a prova usa um top e um produto de outra categoria: se a categoria nao
 * vier do produto, os dois dao igual e a bancada falha.
 */
{
  const top = CATALOGO.find((p) => p.id === 'p-01');
  const outro = CATALOGO.find((p) => p.categoryId !== top.categoryId);
  if (!outro) {
    fail('nao ha dois produtos de categorias diferentes para a prova');
  } else {
    const a = metricas.newPieceConfigFromDefaults(top, REPOUSO);
    const b = metricas.newPieceConfigFromDefaults(outro, REPOUSO);
    if (a.categoryId === top.categoryId) ok('a categoria sai do produto', `${top.name} -> ${a.categoryId}`);
    else fail('a categoria nao veio do produto', `${a.categoryId} != ${top.categoryId}`);

    if (b.categoryId === outro.categoryId && a.categoryId !== b.categoryId) {
      ok('dois produtos dao duas categorias', `${a.categoryId} != ${b.categoryId}`);
    } else {
      fail('a categoria nao variou entre dois produtos', `${a.categoryId} / ${b.categoryId}`);
    }

    if (a.productId === top.id && b.productId === outro.id) ok('o `productId` acompanha o produto');
    else fail('o `productId` nao acompanhou', `${a.productId} / ${b.productId}`);

    if (a.layer === 3 && a.position === 'automatica') ok('o repouso aplicou camada 3 e posicao automatica');
    else fail('o repouso nao foi aplicado', `${a.layer} / ${a.position}`);
  }
}

/** As TRES vistas de uma config nova NAO podem compartilhar o mesmo objeto. */
{
  const a = metricas.newPieceConfigFromDefaults(CATALOGO[0], REPOUSO);
  const b = metricas.newPieceConfigFromDefaults(CATALOGO[0], REPOUSO);
  a.views.frente = 'x';
  if (b.views.frente === '' && REPOUSO.views.frente === '') {
    ok('as vistas sao COPIADAS, nao compartilhadas', 'sem isso, uma preencheria as tres');
  } else {
    fail('as vistas vazaram por referencia', JSON.stringify([b.views, REPOUSO.views]));
  }
}

/* ====================== 4. o material transcrito ====================== */

console.log('\n4. o que veio do print: slots, medidas, posicoes');

{
  const chaves = demo.DEMO_AVATAR.slots.map((s) => s.key);
  if (mesmo(chaves, ['frente', 'direita', 'costas', 'esquerda', 'g360'])) {
    ok('as CINCO imagens na ordem do print', chaves.join(' · '));
  } else {
    fail('a ordem dos slots divergiu', chaves.join(' · '));
  }
}
{
  const rotulos = demo.DEMO_AVATAR.slots.map((s) => s.label);
  const esperado = ['Avatar Frente', 'Avatar Lado Direito', 'Avatar Costas', 'Avatar Lado Esquerdo', 'Avatar 360°'];
  if (mesmo(rotulos, esperado)) ok('os cinco rotulos do print', '`AVATAR 360°` incluido');
  else fail('rotulos divergentes', rotulos.join(' · '));
}
{
  const comUrl = demo.DEMO_AVATAR.slots.filter((s) => s.url !== null);
  if (comUrl.length === 0) ok('as cinco URLs sao `null`', 'nenhuma imagem de terceiro copiada');
  else fail('alguma URL de imagem vazou para o demo', String(comUrl.length));
}
/** E o bucket de ORIGEM nao pode estar escrito em lugar nenhum do modulo. */
{
  const arquivosModulo = [
    'src/lib/provador/demo.ts',
    'src/lib/provador/types.ts',
    'src/lib/provador/data.ts',
  ];
  /**
   * ================== A PROVA MEDE O CODIGO, NAO O COMENTARIO ==================
   *
   * A PRIMEIRA versao leu o arquivo CRU e acusou `demo.ts` e `data.ts` — nos dois
   * casos o `...supabase.co` e o texto que EXPLICA por que a URL de terceiro nao foi
   * copiada. O comentario da correcao cita a string que ele proibe, que e
   * literalmente a armadilha de `feedback_bancada_comentario_vira_falso_positivo`.
   *
   * A pergunta certa nunca foi "o arquivo menciona?" e sim "o CODIGO usa?".
   */
  const comBucket = arquivosModulo.filter((rel) => /supabase\.co/.test(foraDeComentario(arquivo(rel))));
  if (comBucket.length === 0) ok('o bucket do projeto original nao esta no codigo', 'nem em comentario de constante');
  else fail('o bucket de terceiro esta no codigo', comBucket.join(' · '));
}
{
  const medidas = demo.DEMO_AVATAR.measures.map((m) => `${m.label} ${m.value} ${m.unit}`);
  const esperado = ['Busto 88 cm', 'Cintura 68 cm', 'Quadril 94 cm'];
  if (mesmo(medidas, esperado)) ok('as TRES medidas do print', medidas.join(' · '));
  else fail('medidas divergentes', medidas.join(' · '));
}
{
  const opcoes = demo.DEMO_POSITION_OPTIONS.map((o) => o.label);
  if (mesmo(opcoes, ['Automática', 'Superior', 'Inferior', 'Corpo inteiro'])) {
    ok('as QUATRO posicoes do dropdown de adm-046', opcoes.join(' · '));
  } else {
    fail('posicoes divergentes', opcoes.join(' · '));
  }
}
if (demo.DEMO_PIECE.position === 'automatica') ok('a posicao de repouso e `Automática`', 'a do print');
else fail('posicao de repouso divergente', demo.DEMO_PIECE.position);
if (demo.DEMO_PIECE.layer === 3) ok('a camada de repouso e 3', 'a do print');
else fail('camada de repouso divergente', String(demo.DEMO_PIECE.layer));

if (demo.DEMO_SUGGESTIONS.length === 0) ok('a tabela de sugestoes esta VAZIA', 'como o print: cabecalho e nada');
else fail('a tabela de sugestoes tem linha', String(demo.DEMO_SUGGESTIONS.length));

{
  const c = demo.DEMO_AI_SETTINGS;
  if (c.sameCollection === true && c.colorHarmony === true && c.maxSuggestions === 8) {
    ok('as configuracoes de adm-050', 'as duas marcadas, maximo 8');
  } else {
    fail('configuracoes da IA divergentes', JSON.stringify(c));
  }
}
{
  const zeros = Object.values(demo.DEMO_USAGE);
  if (zeros.every((v) => v === 0)) ok('os SEIS contadores de uso em zero', 'a loja do print nao tinha looks');
  else fail('algum contador de uso nao esta em zero', JSON.stringify(demo.DEMO_USAGE));
}

/* ==================== 5. as regras puras da IA ==================== */

console.log('\n5. as regras da IA — prioridade, duplicata e maximo');

if (metricas.isValidPriority(0)) ok('prioridade `0` e VALIDA', '0 nao pode virar "vazio"');
else fail('prioridade 0 recusada');
if (metricas.isValidPriority(100)) ok('prioridade `100` e valida');
else fail('prioridade 100 recusada');
if (!metricas.isValidPriority(101) && !metricas.isValidPriority(-1)) ok('`101` e `-1` sao recusadas');
else fail('a faixa de prioridade nao fechou nos dois extremos');
if (!metricas.isValidPriority(Number.NaN)) ok('`NaN` e recusado', 'campo esvaziado');
else fail('NaN passou');
if (!metricas.isValidPriority(4.5)) ok('`4,5` e recusado', 'a faixa e de inteiros');
else fail('valor fracionario passou');

{
  const linhas = [{ id: 'a', baseId: 'p-01', targetId: 'p-02', priority: 10 }];
  if (metricas.isDuplicateRelation(linhas, 'p-01', 'p-02')) ok('o par repetido e recusado');
  else fail('par duplicado passou');
  if (!metricas.isDuplicateRelation(linhas, 'p-01', 'p-03')) ok('o par novo e aceito');
  else fail('par novo recusado');
  if (metricas.isDuplicateRelation(linhas, 'p-01', 'p-01')) ok('`A -> A` e recusado', 'peca nao sugere a si mesma');
  else fail('`A -> A` passou');
  if (!metricas.isDuplicateRelation(linhas, '', '')) ok('par vazio nao e duplicata', 'os campos nascem em `Selecione...`');
  else fail('par vazio tratado como duplicata');
  /** A ORDEM IMPORTA: `A -> B` nao e `B -> A`. */
  if (!metricas.isDuplicateRelation(linhas, 'p-02', 'p-01')) ok('`A -> B` nao e o mesmo que `B -> A`');
  else fail('a relacao foi tratada como simetrica');
}

if (metricas.clampMaxSuggestions(8) === 8) ok('o maximo do print, 8, passa intacto');
else fail('o valor do print foi alterado');
if (metricas.clampMaxSuggestions(0) === 1) ok('`0` vira 1', 'zero desligaria a consultora em silencio');
else fail('o limite inferior nao segurou');
if (metricas.clampMaxSuggestions(999) === 20) ok('acima de 20 e aparado');
else fail('o limite superior nao segurou');
if (metricas.clampMaxSuggestions(Number.NaN) === 8) ok('valor invalido cai em 8');
else fail('valor invalido nao teve padrao');
{
  const d = metricas.aiDefaults();
  if (d.sameCollection && d.colorHarmony && d.maxSuggestions === 8) ok('os repousos da IA batem com o print');
  else fail('repousos da IA divergentes', JSON.stringify(d));
}

/* =================== 6. a tela de avatar (renderizada) =================== */

console.log('\n6. `Avatar Virtual` renderizada');

const avatarHtml = render(AvatarView, {
  avatar: demo.DEMO_AVATAR,
  products: LISTA,
  categories: CATEGORIAS,
  pieceDefaults: demo.DEMO_PIECE,
  positionOptions: demo.DEMO_POSITION_OPTIONS,
});
const avatarTexto = textos(avatarHtml);

/**
 * AS ABAS DA TELA DE AVATAR — conferidas pela FAIXA, e nao pelo texto solto.
 *
 * A PRIMEIRA RODADA procurava `Imagens do avatar` no texto do documento inteiro, e
 * passava — mas passava por acidente: o rotulo pode estar na faixa OU em qualquer
 * outro lugar. Lendo a faixa, a prova pergunta o que interessa: quais sao as abas
 * e qual esta marcada.
 */
{
  const { abas, ativa } = faixa(avatarHtml);
  if (mesmo(abas, ['Imagens do avatar', 'Vincular produtos'])) {
    ok('as DUAS abas de adm-038/041', abas.join(' · '));
  } else {
    fail('as abas do Avatar Virtual divergiram', abas.join(' · '));
  }
  if (ativa === 0) ok('`Imagens do avatar` nasce marcada', 'a do print');
  else fail('a aba inicial do Avatar Virtual mudou', String(ativa));
}

for (const t of ['Avatar Virtual', 'Gerenciador de Avatar']) {
  if (avatarTexto.includes(t)) ok(`\`${t}\` no markup`);
  else fail(`\`${t}\` ausente`, '');
}

{
  const t = 'Identidade visual oficial e gerenciamento de peças do avatar Closet Lunar.';
  if (avatarTexto.includes(t)) ok('a descricao do print', 'com `Lunar`, como no material');
  else fail('a descricao do print mudou', '');
}
{
  const subtituloPlaceholder = 'Configure o avatar usado no provador virtual.';
  if (!avatarTexto.includes(subtituloPlaceholder)) ok('o texto do placeholder nao ficou', 'nao esta em print nenhum');
  else fail('o texto do placeholder sobreviveu');
}

/** As cinco linhas de imagem, com o rotulo em caixa alta do print. */
for (const rotulo of ['Avatar Frente', 'Avatar Lado Direito', 'Avatar Costas', 'Avatar Lado Esquerdo', 'Avatar 360°']) {
  if (contar(avatarTexto, rotulo) >= 1) ok(`a linha \`${rotulo}\``);
  else fail(`a linha \`${rotulo}\` sumiu`);
}

/** `SUBSTITUIR` cinco vezes, `Salvar alterações` uma, e o botao desabilitado. */
{
  const n = contar(avatarTexto, 'Substituir');
  if (n === 5) ok('`Substituir` aparece CINCO vezes', 'uma por imagem');
  else fail('numero de `Substituir` inesperado', String(n));
}
if (avatarTexto.includes('Salvar alterações')) ok('`Salvar alterações` presente');
else fail('`Salvar alterações` ausente');
{
  const desabilitados = (avatarHtml.match(/disabled=""/g) || []).length;
  if (desabilitados >= 6) ok('os botoes de storage estao desabilitados', `${desabilitados} botoes`);
  else fail('faltou desabilitar algum botao de storage', String(desabilitados));
}
/** A CAIXA AZUL — o token `info`, com o texto literal do print. */
{
  const t = 'Recomendamos o uso de imagens PNG com fundo transparente';
  if (avatarTexto.includes(t)) ok('a caixa azul de recomendacao', 'adm-039');
  else fail('a caixa azul sumiu');
}
{
  const usaInfo = /bg-info-surface/.test(avatarHtml) && /border-info-border/.test(avatarHtml);
  if (usaInfo) ok('a caixa azul usa o token `info`', 'e nao uma cor solta');
  else fail('a caixa azul nao usa o token `info`');
}
/** O aviso de pendencia ACOMPANHA O DADO: com 5 vazias, o texto e o de pendencia. */
{
  if (contar(avatarTexto, '5 de 5 imagens pendentes') === 1) ok('o aviso de pendencia', '5 de 5');
  else fail('o aviso de pendencia nao acompanhou o dado', '');
}
/**
 * ================== A ABA 2 NAO ESTA NESTA RENDERIZACAO ==================
 *
 * A PRIMEIRA RODADA procurava aqui o `Selecione um produto para configurar.` de
 * adm-040 e o `placeholder` da busca — e nao achava nenhum dos dois. **Nao eram
 * defeitos:** os dois vivem na aba `VINCULAR PRODUTOS`, e esta renderizacao e a aba
 * `IMAGENS DO AVATAR`. `renderToStaticMarkup` desenha so a aba que nasce ativa.
 *
 * Medir o painel da aba 2 no html da aba 1 seria medir o nada — e o pior tipo de
 * medida, porque a ausencia se parece com um defeito do componente.
 *
 * Os dois textos JA SAO PROVADOS, cada um onde ele de fato vive:
 *   `Selecione um produto para configurar.`   secao 8, `PieceConfigPanel` sem config
 *   o `placeholder` da busca                  secao 7, `ProductPicker` direto
 *
 * O que falta — e o que esta secao tem que provar — e que a aba 2 **esta ligada**:
 * que `AvatarView` monta `PieceWorkspace` quando a aba e `vincular`. E como isso nao
 * se ve no html, prova-se na FONTE, com o codigo sem comentarios: a condicao tem que
 * ter os dois ramos, e o ramo da aba 2 tem que renderizar o `PieceWorkspace`.
 * Um ramo invertido ou um `PieceWorkspace` no lugar errado passaria num teste que so
 * olhasse o html da aba 1 — e e exatamente o defeito que
 * `feedback_condicao_booleana_invisivel` descreve.
 */
{
  const codigo = foraDeComentario(arquivo('src/components/admin/provador/avatar-view.tsx'));
  const ligada = /aba === 'imagens' \?/.test(codigo);
  if (ligada) ok('a condicao das abas tem os DOIS ramos', 'ternario, nao um ramo so');
  else fail('a condicao das abas sumiu ou virou um ramo so');

  /**
   * O `PieceWorkspace` TEM QUE ESTAR NO RAMO DO FALSO.
   *
   * ================== A REGEX NAO SERVIA, E POR QUE ==================
   *
   * A primeira versao perguntava `/aba === 'imagens' \?[\s\S]*?<PieceWorkspace/`.
   * O `*?` e PREGUICOSO, mas nao seletivo: ele casa qualquer `<PieceWorkspace`
   * depois do ternario — inclusive o do `else`, que e o lugar certo. A regex
   * aprovava o defeito que ela devia pegar, e teria reprovado... tambem o defeito.
   * Uma regex que da o mesmo resultado nos dois casos nao mede nada.
   *
   * A prova certa usa as POSICOES que o ternario cria:
   *
   *   <AvatarPreview>  ...  `) : (` ...  <PieceWorkspace>
   *
   * O `) : (` e a fronteira entre os ramos. `AvatarPreview` antes dela, e
   * `PieceWorkspace` depois — cada painel no seu lado. Invertido, as posicoes
   * trocam e a prova falha.
   */
  /**
   * ================== A FRONTEIRA TEM QUE SER A QUE ABRE O RAMO FALSO ==================
   *
   * Duas tentativas erradas, e as duas valem registro porque sao o mesmo engano:
   * procurar a fronteira do ternario por POSICAO em vez de por SENTIDO.
   *
   *   1. `codigo.indexOf(') : (')`         pegou o ternario do AVISO DE PENDENCIA
   *                                        (`pendentes > 0 ? ... : ...`), bem acima.
   *   2. `codigo.indexOf(') : (', tabIdx)` pegou um ternario INTERNO ao proprio ramo
   *                                        verdadeiro — o do mesmo aviso, que esta
   *                                        dentro do `<Card>` das imagens.
   *
   * Nos dois casos os dois paineis caíam do mesmo lado da fronteira, e a prova
   * acusava uma troca de ramo que nao existia. O defeito era do instrumento, e a
   * terceira versao nao procura mais por posicao: procura pela UNICA `) : (` que
   * tem um `<PieceWorkspace>` logo em seguida. E essa a que abre o ramo falso —
   * por definicao, e nao por sorte de deslocamento.
   */
  const baliza = codigo.search(/\)\s*:\s*\(\s*<PieceWorkspace/);
  const tabIdx = codigo.indexOf("aba === 'imagens'");
  const posVerdadeiro = codigo.indexOf('<AvatarPreview');
  const posFalso = codigo.indexOf('<PieceWorkspace');
  const fronteira = baliza;
  const osDois =
    tabIdx >= 0 && posVerdadeiro >= 0 && fronteira >= 0 && posFalso >= 0 &&
    posVerdadeiro > tabIdx && posVerdadeiro < fronteira && posFalso === baliza + (/\)\s*:\s*\(\s*/.exec(codigo.slice(baliza)) ?? [''])[0].length;
  if (osDois) {
    if (posVerdadeiro < fronteira && posFalso > fronteira) {
      ok('cada painel no seu ramo', '`AvatarPreview` no verdadeiro, `PieceWorkspace` no falso');
    } else {
      fail('os paineis trocaram de ramo', `${posVerdadeiro} / ${fronteira} / ${posFalso}`);
    }
  } else {
    fail('nao achei os dois paineis e a fronteira', `tab ${tabIdx} / ver ${posVerdadeiro} / fre ${fronteira} / fal ${posFalso}`);
  }
}

/* ================== 7. o painel preto e o seletor ================== */

console.log('\n7. o painel de preview e o seletor de produtos');

const previewHtml = render(AvatarPreview, { avatar: demo.DEMO_AVATAR });
const previewTexto = textos(previewHtml);

for (const t of ['Arraste para girar', 'Preview em tempo real']) {
  if (previewTexto.includes(t)) ok(`\`${t}\` no painel escuro`);
  else fail(`\`${t}\` sumiu do painel`, '');
}
for (const t of ['Busto', 'Cintura', 'Quadril']) {
  if (previewTexto.includes(t)) ok(`a medida \`${t}\` sobre o quadro`);
  else fail(`a medida \`${t}\` sumiu`);
}
/**
 * As QUATRO vistas como botao, e o 360 NAO entre elas.
 *
 * O `AVATAR 360°` e o conjunto dos angulos, nao um angulo — ele existe no cadastro
 * e nao vira botao de preview. A prova e o par: as quatro ESTAO e o 360 NAO.
 */
{
  const botoes = previewHtml.split('<button').slice(1);
  const rotulos = botoes.map((p) => textos(p.slice(p.indexOf('>') + 1).split('</button>')[0]));
  const esperado = ['FRENTE', 'DIREITA', 'COSTAS', 'ESQUERDA'];
  if (mesmo(rotulos, esperado)) ok('as QUATRO vistas de preview, na ordem', rotulos.join(' · '));
  else fail('as vistas de preview divergiram', rotulos.join(' · '));
  if (!rotulos.some((r) => /360/.test(r))) ok('`360°` NAO virou botao', 'nao e um angulo');
  else fail('`360°` entrou como vista de preview');

  /**
   * ================== A PROVA AO CONTRARIO DO DEFEITO REAL ==================
   *
   * A PRIMEIRA RODADA falhou aqui: os botoes saiam `LADO DIREITO` e `LADO
   * ESQUERDO`, porque o componente derivava o rotulo do botao do rotulo do
   * CADASTRO (`.replace('Avatar ', '')`), e o cadastro diz `AVATAR LADO DIREITO`.
   * O print `235511.png` mostra o botao como `DIREITA`.
   *
   * O teste acima sozinho nao guarda contra a volta do defeito: se alguem
   * reintroduzir a derivacao, `rotulos` volta a ser `LADO DIREITO` e a prova
   * falha — o que e o comportamento certo. Mas ela falharia com uma mensagem
   * generica. Esta assercao NOMEIA o defeito, para que a proxima pessoa saiba o
   * que aconteceu sem reler a historia inteira.
   */
  const derivado = demo.DEMO_AVATAR.slots
    .filter((slot) => slot.key !== 'g360')
    .map((slot) => slot.label.replace('Avatar ', '').toUpperCase());
  if (derivado.includes('LADO DIREITO')) {
    ok('o rotulo derivado seria `LADO DIREITO`', 'por isso ele nao pode ser derivado');
  } else {
    fail('a prova do defeito perdeu o sentido', 'o cadastro mudou de texto');
  }
  /** E o texto do defeito NAO pode aparecer na tela. */
  if (!/LADO DIREITO|LADO ESQUERDO/.test(previewHtml)) {
    ok('nenhum botao diz `LADO DIREITO`/`LADO ESQUERDO`', 'o texto do cadastro ficou no cadastro');
  } else {
    fail('o rotulo do cadastro vazou para o botao do preview');
  }
}
/** A vista ativa e a UNICA com `aria-pressed` verdadeiro. */
{
  const ativos = atributoDe(previewHtml, 'aria-pressed').filter((v) => v === 'true').length;
  if (ativos === 1) ok('exatamente UMA vista ativa', `aria-pressed="true" x${ativos}`);
  else fail('numero de vistas ativas inesperado', String(ativos));
}
/** Sem imagem, o painel mostra o vazio — e NAO um `<img>`. */
{
  const imgs = (previewHtml.match(/<img/g) || []).length;
  if (imgs === 0) ok('nenhuma imagem renderizada', 'todas as URLs sao `null`');
  else fail('apareceu uma imagem sem URL', String(imgs));
  if (previewTexto.includes('Nenhuma imagem cadastrada nesta vista.')) ok('o vazio do painel');
  else fail('o vazio do painel sumiu');
}

/* ---------------------------------------------------------------- seletor */

const pickerHtml = render(ProductPicker, {
  products: LISTA,
  selectedId: null,
  onSelect: () => {},
});
const pickerTexto = textos(pickerHtml);

for (const nome of NOMES_CATALOGO) {
  if (pickerTexto.includes(nome)) ok(`o seletor lista \`${nome}\``);
  else fail(`\`${nome}\` sumiu do seletor`);
}
if (!pickerTexto.includes(FANTASMA)) ok('o fantasma NAO esta no seletor', 'a prova visual do JOIN');
else fail('o fantasma apareceu no seletor');

/** O status de pendencia nos NOVE — o print mostra todos os nove assim. */
{
  const n = contar(pickerTexto, 'Imagem do provador pendente');
  if (n === 9) ok('`Imagem do provador pendente` NOVE vezes', 'conferido no pixel: os nove');
  else fail('o numero de pendencias divergiu', String(n));
}
{
  const contagem = textos(pickerHtml.split('</header>')[0] ?? '');
  if (contagem.includes('9/9')) ok('o contador da lista mostra 9/9', 'derivado, nao escrito');
  else fail('o contador da lista sumiu', contagem);
}

/* =============== 8. o configurador de peca (os dois estados) =============== */

console.log('\n8. o configurador de peca — vazio e preenchido');

{
  const vazio = textos(render(PieceConfigPanel, {
    config: null,
    product: null,
    categories: CATEGORIAS,
    positionOptions: demo.DEMO_POSITION_OPTIONS,
    onChange: () => {},
    onClear: () => {},
  }));
  if (vazio.includes('Selecione um produto para configurar.')) ok('sem produto: o texto de adm-040');
  else fail('o estado sem produto sumiu');
}

const config = metricas.newPieceConfigFromDefaults(
  CATALOGO.find((p) => p.name === 'top'),
  demo.DEMO_PIECE,
);
const cfgHtml = render(PieceConfigPanel, {
  config,
  product: CATALOGO.find((p) => p.name === 'top'),
  categories: CATEGORIAS,
  positionOptions: demo.DEMO_POSITION_OPTIONS,
  onChange: () => {},
  onClear: () => {},
});
const cfgTexto = textos(cfgHtml);

for (const t of [
  'Provador Virtual — Imagens das peças',
  'Categoria da peça',
  'Camada (ordem)',
  'Posição',
  'Salvar imagens',
  'Remover categoria',
]) {
  if (cfgTexto.includes(t)) ok(`\`${t}\` no configurador`);
  else fail(`\`${t}\` ausente do configurador`);
}
/** As tres colunas de vista, nas tres palavras do print. */
for (const t of ['frente', 'lado', 'costas']) {
  if (cfgTexto.includes(t)) ok(`a coluna \`${t}\``);
  else fail(`a coluna \`${t}\` sumiu`);
}
/** As tres contagens EXATAS — 3 quadros, 3 botoes de envio. */
{
  const pendentes = contar(cfgTexto, 'Imagem do provador pendente');
  if (pendentes === 3) ok('as TRES vistas pendentes', 'uma por coluna');
  else fail('numero de vistas pendentes inesperado', String(pendentes));
}
{
  const envios = contar(cfgTexto, 'Enviar PNG transparente');
  if (envios === 3) ok('`Enviar PNG transparente` TRES vezes');
  else fail('numero de botoes de envio inesperado', String(envios));
}
{
  const urls = atributoDe(cfgHtml, 'placeholder').filter((v) => v === 'ou cole uma URL').length;
  if (urls === 3) ok('`ou cole uma URL` TRES vezes', 'lido do ATRIBUTO');
  else fail('numero de campos de URL inesperado', String(urls));
}
/** A dica do rodape — o texto literal do print. */
{
  const t = 'Peças sem imagem não quebram o avatar';
  if (cfgTexto.includes(t)) ok('a dica do rodape', 'texto do print');
  else fail('a dica do rodape sumiu');
}
/** A config que a tela desenhou e a que a funcao pura montou. */
{
  const valores = atributoDe(cfgHtml, 'value');
  if (valores.includes('3') && valores.includes('cat-tops')) {
    ok('o formulario mostra a camada 3 e a categoria do produto', 'a config veio da funcao pura');
  } else {
    fail('o formulario nao refletiu a config', JSON.stringify(valores));
  }
}

/* ========================= 9. as abas de dados ========================= */

console.log('\n9. `Looks salvos` e `Analytics`');

/**
 * ================== O INSTRUMENTO, AQUI, E O PROPRIO `aba` ==================
 *
 * `ProvadorInsights` recebe `aba` como PROP — a tela (`ProvadorView`) e que
 * guarda o estado e decide qual passar. Isso e o que a torna testavel sem
 * navegador: a bancada chama a parte, com a aba que quer, e confere o painel.
 *
 * A prova de que a TELA liga as duas coisas e a faixa, conferida logo abaixo no
 * item 11: as tres abas estao na faixa, a primeira marcada, e o painel de cada
 * uma sai do mesmo componente.
 */
const looksTexto = textos(render(ProvadorInsights, { aba: 'looks', usage: demo.DEMO_USAGE }));
for (const t of [
  'Looks Salvos pelas Clientes',
  'Looks criados',
  'Clientes que salvaram',
  'Compartilhamentos',
  'Looks mais compartilhados',
  'Combinações mais populares',
  'Produtos mais utilizados em looks',
  'Últimos looks salvos',
]) {
  if (looksTexto.includes(t)) ok(`\`${t}\``);
  else fail(`\`${t}\` ausente`);
}

/**
 * OS TRES VAZIOS EM FRASE E O QUARTO EM TRAVESSAO — conferido em `235608.png`.
 *
 * O travessao nao se conta em texto puro: o titulo (`Looks Salvos pelas
 * Clientes`) tem um, e mediria 2 onde o painel tem 1. A prova e por PAINEL, no
 * componente que desenha o painel — `LooksSalvosCards`, que a tela usa.
 */
{
  const cards = render(LooksSalvosCards, { usage: demo.DEMO_USAGE });
  if (contar(cards, '—') === 1) ok('UM painel com travessao', '`Produtos mais utilizados em looks`');
  else fail('o numero de travessoes nos paineis divergiu', String(contar(cards, '—')));
  const frases = (cards.match(/Nenhum look/g) || []).length;
  if (frases === 3) ok('tres paineis com `Nenhum look ...`', 'por painel, nao no texto da tela');
  else fail('numero de frases de vazio inesperado', String(frases));
  if (!/Sem dados ainda/.test(textos(cards))) ok('`Sem dados ainda.` NAO e desta aba', 'e do Analytics');
  else fail('`Sem dados ainda.` vazou para Looks salvos');
}

const anTexto = textos(render(ProvadorInsights, { aba: 'analytics', usage: demo.DEMO_USAGE }));
for (const t of [
  'Provador Virtual — Analytics',
  'Looks criados',
  'Combos únicos',
  'Adds ao carrinho (avatar)',
  'Produtos usados em looks',
  'Looks mais criados',
  'Produtos mais usados em looks',
  'Categorias mais utilizadas',
  'Mais adicionados ao carrinho via avatar',
  'Sem dados ainda.',
]) {
  if (anTexto.includes(t)) ok(`\`${t}\``);
  else fail(`\`${t}\` ausente`);
}

/**
 * A PROVA AO CONTRARIO: o painel que tem DUAS frases.
 *
 * `Mais adicionados ao carrinho via avatar` mostra uma FRASE LONGA, com um
 * travessao DENTRO dela — `Sem dados ainda — eventos serao registrados...`. E o
 * `—` que aparece mais de uma vez num texto que nao tem travessao de vazio
 * nenhum. Aqui a contagem e por PAINEL, entao nao ha o que confundir.
 */
{
  const cards = render(AnalyticsCards, { usage: demo.DEMO_USAGE });

  /**
   * ================== A DIVISAO TEM QUE NASCER DO COMPONENTE ==================
   *
   * A PRIMEIRA versao separava os paineis por uma string escrita a mao
   * (`'surface flex flex-col gap-3'`) e contou 8 — o layout tem `sm:` e `lg:` na
   * frente, e a string literal nao casava com nenhum. Com zero paineis, a contagem
   * de travessoes deu zero tambem, e a bancada acusou dois defeitos que nao
   * existiam.
   *
   * E a licao de `feedback_bancada_lista_fixa_cega`: uma medida que depende de uma
   * string literal deixa de ver o que ela deveria medir assim que a string muda — e
   * aqui o componente NUNCA foi escrito para casar com ela.
   *
   * A divisao agora nasce do COMPONENTE: `UsagePanel` e o unico que desenha painel
   * com titulo, e o titulo dele e exatamente o texto que a prova ja procura. Cada
   * titulo conhecido recorta o seu painel.
   */
  const titulosPaineis = [
    'Looks mais criados',
    'Produtos mais usados em looks',
    'Categorias mais utilizadas',
    'Mais adicionados ao carrinho via avatar',
  ];
  const paineis = titulosPaineis.map((titulo, i) => {
    const de = cards.indexOf(titulo);
    const ate = i + 1 < titulosPaineis.length ? cards.indexOf(titulosPaineis[i + 1]) : cards.length;
    return de < 0 ? '' : cards.slice(de + titulo.length, ate);
  });
  const vazios = paineis.filter((p) => p.length === 0).length;
  if (vazios === 0) ok('os QUATRO paineis do Analytics foram recortados', 'um por titulo');
  else fail('nao localizei todos os paineis', `${vazios} sem recorte`);

  /**
   * O TRAVESSAO DO PAINEL — comparado com o texto DO CORPO, e nao de um pedaco
   * de html que pode pegar o icone ou o titulo junto.
   */
  const soTravessao = paineis.filter((p) => /^\s*—\s*$/.test(textos(p))).length;
  if (soTravessao === 2) ok('DOIS paineis com travessao sozinho', '`Produtos mais usados` e `Categorias mais utilizadas`');
  else fail('o numero de paineis de travessao divergiu', String(soTravessao) + ' — ' + JSON.stringify(paineis.map((p) => textos(p).slice(0, 40))));
  if (contar(cards, '—') === 3) ok('TRES travessoes no componente', 'dois de vazio + um dentro da frase longa');
  else fail('o numero total de travessoes divergiu', String(contar(cards, '—')));
}

/* ===================== 10. IA de Looks renderizada ===================== */

console.log('\n10. `IA de Looks` renderizada');

const iaHtml = render(IALooksView, {
  products: LISTA,
  suggestions: demo.DEMO_SUGGESTIONS,
  settings: demo.DEMO_AI_SETTINGS,
});
const iaTexto = foraDaFaixa(iaHtml);

for (const t of ['Nova Sugestão Manual']) {
  if (iaTexto.includes(t)) ok(`\`${t}\` no painel da aba 1`);
  else fail(`\`${t}\` ausente`);
}
{
  const subtituloPlaceholder = 'Combinações sugeridas automaticamente para a cliente.';
  if (!textos(iaHtml).includes(subtituloPlaceholder)) ok('o texto do placeholder nao ficou', 'nao esta em print nenhum');
  else fail('o texto do placeholder sobreviveu');
}
/** Os QUATRO cabecalhos exatos, e o corpo vazio. */
for (const t of ['Produto base', 'Sugerido', 'Prioridade', 'Ações']) {
  if (iaTexto.includes(t)) ok(`o cabecalho \`${t}\``);
  else fail(`o cabecalho \`${t}\` sumiu`);
}
{
  /**
   * O CORPO VAZIO — a leitura e pelo primeiro `<tr>`, e nao pelo `<tbody>`.
   *
   * A primeira versao desta prova comparava `html.split('<tbody')[1]` com string
   * vazia e acusou "tem conteudo: class="divide-y divide-border/60"". O que estava
   * ali nao era linha nenhuma: era o ATRIBUTO do proprio `<tbody>`. `split('<tbody')`
   * deixa o resto da tag de abertura na frente, e o teste media a tag em vez do
   * corpo. A prova certa pergunta pelo primeiro `<tr>` dentro do corpo.
   */
  const corpo = iaHtml.split('<tbody')[1]?.split('</tbody>')[0] ?? '';
  const linhas = (corpo.match(/<tr/g) || []).length;
  if (linhas === 0) ok('o corpo da tabela NAO tem linha', 'como o print');
  else fail('o corpo da tabela tem linha', String(linhas));
}
/**
 * A PROVA AO CONTRARIO DA TABELA VAZIA — o print NAO tem mensagem de vazio.
 *
 * Se alguem "melhorar" a tabela com um `Nenhuma sugestão ainda.`, a bancada
 * falha. O material mostra cabecalho e nada, e `EmptyRow` imprimiria uma frase.
 */
{
  const comMensagem = /Nenhuma sugestão|Sem sugestões|Nenhum item/.test(iaTexto);
  if (!comMensagem) ok('NAO ha mensagem de vazio na tabela', 'o print nao tem');
  else fail('apareceu uma mensagem de vazio que o print nao tem');
}
/** Os dois `select` listam os NOVE do catalogo mais o `Selecione...`. */
{
  const opcoes = iaHtml.split('<option').length - 1;
  if (opcoes === 20) ok('os dois selects somam 20 opcoes', '9 + `Selecione...`, duas vezes');
  else fail('numero de opcoes dos selects inesperado', String(opcoes));
}
{
  const selecione = contar(iaTexto, 'Selecione...');
  if (selecione === 2) ok('`Selecione...` nos DOIS selects', 'o estado de repouso');
  else fail('numero de `Selecione...` inesperado', String(selecione));
}
if (iaTexto.includes('Adicionar Relação')) ok('`Adicionar Relação` presente');
else fail('`Adicionar Relação` ausente');
if (iaTexto.includes('Prioridade (0-100)')) ok('o rotulo `Prioridade (0-100)`');
else fail('o rotulo da prioridade mudou');
{
  const valores = atributoDe(iaHtml, 'value');
  if (valores.includes('0')) ok('a prioridade nasce em `0`', 'como o print');
  else fail('a prioridade nao nasceu em zero', JSON.stringify(valores));
}

/**
 * AS DUAS ABAS DA FAIXA — e a prova de que a TELA as declarou.
 *
 * O painel da aba 2 e conferido pelo componente que o desenha, no item 11: a
 * `IALooksView` nao aceita aba por prop, entao pedir o painel dela sem clicar
 * exigiria mudar o produto. O que se prova aqui e o que da: a faixa existe, tem
 * as DUAS abas certas, e a primeira nasce marcada.
 */
{
  const { abas, ativa } = faixa(iaHtml);
  if (mesmo(abas, ['Sugestões manuais', 'Configurações da IA'])) {
    ok('as DUAS abas de adm-047/050', abas.join(' · '));
  } else {
    fail('as abas divergiram', abas.join(' · '));
  }
  if (ativa === 0) ok('`Sugestões manuais` nasce marcada', 'a do print');
  else fail('a aba inicial mudou', String(ativa));
}
/* ======== 11. a config da IA e a escolha de componente (abas) ======== */

console.log('\n11. as abas sao o componente COMPARTILHADO do painel');

/**
 * A PROVA DE UM ERRO MEU, QUE FICOU REGISTRADO.
 *
 * Eu havia escrito que as abas deste modulo eram um componente NOVO (pilulas
 * brancas com borda), e cheguei a criar `panel-tabs.tsx`. A leitura no pixel de
 * `235503.png` e `235557.png` mostrou o contrario: trilho claro com a aba ativa em
 * pilula PRETA e as inativas em texto solto — que e o `SegmentedTabs` que o painel
 * ja tinha. O componente errado foi APAGADO, e esta prova existe para ele nao
 * voltar.
 */
{
  const existe = existsSync(join(PROJ, 'src/components/admin/provador/panel-tabs.tsx'));
  if (!existe) ok('o componente de abas paralelo NAO existe', 'foi apagado');
  else fail('o `panel-tabs.tsx` paralelo voltou');
}
{
  const fontes = [
    'src/components/admin/provador/avatar-view.tsx',
    'src/components/admin/provador/provador-view.tsx',
    'src/components/admin/provador/ia-looks-view.tsx',
  ];
  const comCompartilhado = fontes.filter((rel) => /from '@\/components\/ui\/tabs'/.test(arquivo(rel)));
  if (comCompartilhado.length === 3) ok('as TRES telas usam `components/ui/tabs`', 'uma fonte de abas so');
  else fail('alguma tela nao usa o componente compartilhado', comCompartilhado.join(' · '));
}

/**
 * O PAINEL DA ABA 2 DA IA — adm-050, `235711.png`.
 *
 * Chamado DIRETO, como parte: `AiSettingsPanel` e exportado por `ai-panels.tsx` e
 * recebe `settings`. Nao ha clique, nao ha estado — e por isso ele e um arquivo.
 */
const iaCfgHtml = render(AiSettingsPanel, { settings: demo.DEMO_AI_SETTINGS });
const iaCfgTexto = textos(iaCfgHtml);

for (const t of [
  'Prioridades da Consultora Virtual',
  'Priorizar mesma coleção',
  'Harmonia de Cores',
  'Máximo de sugestões por seção',
  'Salvar Configurações',
]) {
  if (iaCfgTexto.includes(t)) ok(`\`${t}\``);
  else fail(`\`${t}\` ausente`);
}
/**
 * AS DESCRICOES DAS DUAS MARCACOES — texto de print, uma por opcao.
 *
 * Sao a segunda linha de cada `Checkbox`, e o print as mostra: sem elas, a prova
 * passaria com o rotulo certo e a explicacao errada.
 */
for (const t of [
  'Sugerir peças que fazem parte da mesma coleção do produto visualizado',
  'Utilizar IA para sugerir cores complementares e análogas',
]) {
  if (iaCfgTexto.includes(t)) ok('a descricao de uma das marcacoes');
  else fail('a descricao de uma marcacao mudou', t);
}
{
  const marcadas = (iaCfgHtml.match(/checked=""/g) || []).length;
  if (marcadas === 2) ok('as DUAS prioridades chegam marcadas', 'como o print');
  else fail('numero de marcacoes inesperado', String(marcadas));
}
/**
 * O `8` DO PRINT — e o `clamp` na frente dele.
 *
 * O campo mostra o `maxSuggestions` das configuracoes, passado por
 * `clampMaxSuggestions`. Por isso a prova e o par: mostra `8` (o valor do print) e
 * NAO mostra um valor fora da faixa quando o dado vier corrompido.
 */
{
  const valores = atributoDe(iaCfgHtml, 'value');
  if (valores.includes('8')) ok('o maximo de sugestoes mostra `8`', 'o valor do print');
  else fail('o `8` nao apareceu', JSON.stringify(valores));

  for (const ruim of [0, 999, Number.NaN]) {
    const comRuim = textos(render(AiSettingsPanel, {
      settings: { ...demo.DEMO_AI_SETTINGS, maxSuggestions: ruim },
    }));
    if (/value="(1|20|8)"/.test(render(AiSettingsPanel, {
      settings: { ...demo.DEMO_AI_SETTINGS, maxSuggestions: ruim },
    })) && !comRuim.includes(String(ruim === 0 ? '0' : ruim))) {
      ok(`valor corrompido (${String(ruim)}) e aparado pelo clamp`);
    } else {
      fail(`o painel aceitou o valor corrompido ${String(ruim)}`);
    }
  }
}

/**
 * O PAINEL DA ABA 1 DA IA — `AiSuggestionsPanel`, o formulario e a tabela.
 *
 * Aqui tambem chamado direto, e aqui tambem se prova o que a tela NAO tem: uma
 * linha de corpo na tabela. Com `DEMO_SUGGESTIONS` vazio, o corpo sai vazio — e
 * sem a mensagem de vazio, que o material nao tem.
 */
{
  const p = render(AiSuggestionsPanel, { products: LISTA, suggestions: demo.DEMO_SUGGESTIONS });
  const pt = textos(p);
  for (const t of ['Nova Sugestão Manual', 'Produto base', 'Produto sugerido', 'Adicionar Relação']) {
    if (pt.includes(t)) ok(`\`${t}\` no painel 1`);
    else fail(`\`${t}\` ausente do painel 1`);
  }
  const linhas = ((p.split('<tbody')[1] ?? '').match(/<tr/g) || []).length;
  if (linhas === 0) ok('a tabela do painel 1 tambem sem linha');
  else fail('a tabela do painel 1 tem linha', String(linhas));

  /** A PROVA AO CONTRARIO: com uma sugestao, a linha aparece. */
  const comLinha = render(AiSuggestionsPanel, {
    products: LISTA,
    suggestions: [{ id: 's-1', baseId: 'p-02', targetId: 'p-03', priority: 40 }],
  });
  const linhaTexto = textos(comLinha.split('<tbody')[1] ?? '');
  if (linhaTexto.includes('Kit Nike') && linhaTexto.includes('40')) {
    ok('com sugestao, a linha aparece com os nomes resolvidos', 'a tabela nao esta cega');
  } else {
    fail('a tabela nao desenhou a linha', linhaTexto.slice(0, 120));
  }
}

/* ================= 12. as tres paginas e o token novo ================= */

console.log('\n12. as paginas, `references` e o token `info`');

/**
 * ================== O QUE ESTA PROVA MEDE, E O QUE ELA NAO PODE MEDIR ==================
 *
 * A PRIMEIRA RODADA acusou quatro defeitos por `page.tsx` que NAO sao defeitos: a
 * string `adm-049 a adm-051` (a faixa ERRADA) e a palavra `ModulePage` aparecem nos
 * arquivos porque os COMENTARIOS as citam — a pagina conta a historia do defeito e
 * escreve o valor errado ao lado do certo, de proposito. E `lib/provador/demo` e
 * importado pela pagina (`DEMO_POSITION_OPTIONS`), tambem de proposito: sao as
 * quatro posicoes do dropdown, que nao vem do banco.
 *
 * ================== A CORRECAO DO INSTRUMENTO ==================
 *
 * Foi a licao de `feedback_bancada_comentario_vira_falso_positivo`, que ja tinha
 * mordido antes: o comentario da propria correcao cita a string, e um `includes` no
 * arquivo cru acusa o comentario. O que separa codigo de comentario nao e uma regex
 * — e o COMPILADOR: `ts.createSourceFile` da a arvore, e `getLeadingCommentRanges`
 * nao e a prova. A prova e o CONTRARIO: `foraDeComentario()` pergunta se a string
 * aparece no arquivo **depois de todos os comentarios serem apagados**.
 *
 * Assim o que sobra e o que o codigo de fato diz, e os tres testes passam a medir o
 * que queriam medir.
 */
function foraDeComentario(codigo) {
  /* Blocos `/* ... *\/` e linhas `//` — a mesma remocao de `semComentarios`, mas
     usada SEM esconder: aqui a pergunta e "sobrou no codigo de verdade?", e nao
     "o arquivo inteiro menciona?". */
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const paginas = {
  'src/app/admin/avatar-virtual/page.tsx': { faixa: 'adm-038 a adm-042', errada: 'adm-049 a adm-051', titulo: 'Avatar Virtual' },
  'src/app/admin/provador-virtual/page.tsx': { faixa: 'adm-043 a adm-046', errada: 'adm-052 a adm-055', titulo: 'Provador Virtual' },
  'src/app/admin/ia-looks/page.tsx': { faixa: 'adm-047 a adm-050', errada: 'adm-056 a adm-058', titulo: 'IA de Looks' },
};

for (const [rel, info] of Object.entries(paginas)) {
  const cru = arquivo(rel);
  const codigo = foraDeComentario(cru);

  if (!/ModulePage/.test(codigo)) ok(`${rel}: nao usa mais \`ModulePage\``, 'so o comentario o cita');
  else fail(`${rel}: ainda usa \`ModulePage\` no codigo`);

  if (!contar(codigo, info.errada)) ok(`${rel}: a faixa errada so vive no comentario`, `era \`${info.errada}\``);
  else fail(`${rel}: a faixa errada esta no CODIGO`, info.errada);

  /**
   * A FAIXA CERTA VIVE NO COMENTARIO — e por isso ela e medida no arquivo CRU.
   *
   * O `references` foi REMOVIDO do código: a pagina nao usa mais `ModulePage`, que
   * era quem o exibia. O que resta da faixa e o registro do defeito. Medir o fato
   * contra o arquivo cru e o correto aqui, e a assimetria e proposital: o que se
   * quer provar e que o registro existe, nao que o atributo existe.
   */
  if (cru.includes(info.faixa)) ok(`${rel}: registra a faixa certa`, info.faixa);
  else fail(`${rel}: nao registra a faixa certa`, info.faixa);

  if (codigo.includes(`title: '${info.titulo}'`)) ok(`${rel}: o titulo e \`${info.titulo}\``);
  else fail(`${rel}: titulo divergente`);

  /** A pagina busca os dados por `lib/provador/data`. */
  if (/from '@\/lib\/provador\/data'/.test(codigo)) ok(`${rel}: busca em \`lib/provador/data\``);
  else fail(`${rel}: nao usa a camada de dados`);

  /**
   * E o `demo` que ela importa e so o das POSICOES — a lista do dropdown, que nao
   * e dado de banco. Qualquer outro import de `demo` seria a pagina lendo dado
   * demonstrativo por fora da camada.
   */
  const importsDemo = [...codigo.matchAll(/import \{([^}]*)\} from '@\/lib\/provador\/demo'/g)]
    .flatMap((m) => m[1].split(',').map((t) => t.trim()))
    .filter(Boolean);
  const soPosicoes = importsDemo.length > 0 && importsDemo.every((nome) => nome === 'DEMO_POSITION_OPTIONS');
  if (soPosicoes) ok(`${rel}: de \`demo\` importa so as posicoes`, importsDemo.join(' · '));
  else if (importsDemo.length === 0) ok(`${rel}: nao importa \`demo\``, 'nenhum dado demonstrativo');
  else fail(`${rel}: importa dado demonstrativo alem das posicoes`, importsDemo.join(' · '));

  if (!/prisma|DATABASE_URL|@prisma/i.test(codigo)) ok(`${rel}: nao conecta banco`, 'escopo respeitado');
  else fail(`${rel}: parece conectar banco`);
}

/** O token `info` foi declarado no CSS E registrado no Tailwind. */
{
  const css = arquivo('src/app/globals.css');
  const tw = arquivo('tailwind.config.ts');
  const noCss = ['--info:', '--info-foreground:', '--info-surface:', '--info-border:'].every((v) =>
    css.includes(v),
  );
  if (noCss) ok('o token `info` foi declarado no CSS', 'os quatro canais');
  else fail('falta canal do token `info` no CSS');
  if (/info:\s*\{/.test(tw) && tw.includes("surface: 'hsl(var(--info-surface))'")) {
    ok('o token `info` esta registrado no Tailwind');
  } else {
    fail('o token `info` nao chegou ao tailwind.config.ts');
  }
}

/**
 * O TOKEN NAO PODE TER SIDO ESCRITO A MAO NA TELA.
 *
 * Um `bg-[#EAF2FB]` resolveria o print e criaria uma quinta cor solta no painel.
 * A prova e o par: o componente USA `info` e NAO usa o hexadecimal do print.
 */
{
  const av = arquivo('src/components/admin/provador/avatar-view.tsx');
  if (av.includes('bg-info-surface') && av.includes('border-info-border')) {
    ok('a caixa azul usa o token pelo nome', '`bg-info-surface` + `border-info-border`');
  } else {
    fail('a caixa azul nao usa o token');
  }
  if (!/EAF2FB|3B4A5A|CFE0F5/i.test(av)) ok('o hexadecimal do print nao esta no componente', 'a cor vive no token');
  else fail('a cor foi escrita a mao no componente');
}

/* ==================== 13. dados e avisos de gravacao ==================== */

console.log('\n13. a camada de dados nao finge gravacao');

(async () => {
  const selecao = await dados.listSelectorData();
  if (selecao.products.length === 9 && selecao.categories.length === 7) {
    ok('`listSelectorData` devolve 9 produtos e 7 categorias', 'as duas chamadas em paralelo');
  } else {
    fail('`listSelectorData` devolveu outra coisa', `${selecao.products.length}/${selecao.categories.length}`);
  }

  for (const [nome, chamada] of [
    ['saveAvatar', () => dados.saveAvatar(demo.DEMO_AVATAR)],
    ['savePiece', () => dados.savePiece(config)],
    ['saveSuggestions', () => dados.saveSuggestions([])],
    ['saveAiSettings', () => dados.saveAiSettings(demo.DEMO_AI_SETTINGS)],
  ]) {
    const r = await chamada();
    if (r.persisted === false && typeof r.reason === 'string' && r.reason.length > 10) {
      ok(`\`${nome}\` devolve \`persisted: false\``, 'com motivo');
    } else {
      fail(`\`${nome}\` fingiu gravacao`, JSON.stringify(r));
    }
  }

  const uso = await dados.getUsage();
  if (Object.values(uso.data).every((v) => v === 0)) ok('`getUsage` devolve os zeros do print');
  else fail('`getUsage` divergiu', JSON.stringify(uso.data));

  /* =============== 14. prova ao contrario (o instrumento falha) =============== */

  console.log('\n14. prova ao contrario — o instrumento SABE falhar');

  /**
   * Uma bancada que nunca falha nao prova nada. Os tres testes abaixo provocam a
   * FALHA de proposito, e cada um confere que o instrumento a detectou.
   */
  {
    /** 1. `contar` numa lista com o fantasma tem que achar — e achar UMA. */
    const comFantasma = [...LISTA.map((p) => p.name), FANTASMA];
    if (contar(comFantasma.join('\u0001'), FANTASMA) === 1) {
      ok('`contar` ACHA o fantasma quando ele existe', 'o zero de antes e medicao, nao sorte');
    } else {
      fail('`contar` nao detectou o fantasma', 'o instrumento esta cego');
    }

    /** 2. A busca por `Glow` ACUSA quando o item esta na lista. */
    const listaComFantasma = [...LISTA, { id: 'x', name: FANTASMA, categoryId: 'cat-tops' }];
    if (metricas.filterProducts(listaComFantasma, 'Glow').length === 1) {
      ok('a busca acharia o fantasma se ele entrasse', 'o vazio de antes nao e defeito da busca');
    } else {
      fail('a busca nao acharia o fantasma', 'o vazio de antes nao prova nada');
    }

    /** 3. `atributoDe` distingue o que `textos()` apaga. */
    const html = '<input placeholder="ou cole uma URL">';
    if (atributoDe(html, 'placeholder')[0] === 'ou cole uma URL' && !textos(html).includes('ou cole uma URL')) {
      ok('`atributoDe` le o que `textos()` apaga', 'por isso os dois existem');
    } else {
      fail('`atributoDe` nao diferiu de `textos()`');
    }

    /**
     * 4. O INSTRUMENTO DOS RAMOS ACUSA A TROCA — e a troca e de verdade.
     *
     * A prova da secao 6 pergunta se `AvatarPreview` esta antes da fronteira do
     * ternario e `PieceWorkspace` depois. Ela errou DUAS vezes antes de acertar a
     * fronteira, entao precisa provar que hoje ela sabe REPROVAR: trocando os dois
     * paineis de lado no texto, a mesma checagem tem que falhar.
     *
     * Sem esta prova, a assercao poderia estar aprovando por nao medir nada — que
     * foi exatamente o que aconteceu com a primeira versao dela.
     */
    {
      const original = foraDeComentario(arquivo('src/components/admin/provador/avatar-view.tsx'));
      const trocado = original
        .replace('<AvatarPreview', '@@A@@')
        .replace('<PieceWorkspace', '@@P@@')
        .replace('@@A@@', '<PieceWorkspace')
        .replace('@@P@@', '<AvatarPreview');
      const balizaDe = (c) => c.search(/\)\s*:\s*\(\s*<PieceWorkspace/);
      const verDe = (c) => c.indexOf('<AvatarPreview');
      const okOriginal = balizaDe(original) > 0 && verDe(original) < balizaDe(original);
      const okTrocado = balizaDe(trocado) > 0 && verDe(trocado) < balizaDe(trocado);
      if (okOriginal && !okTrocado) {
        ok('o instrumento dos ramos REPROVA a troca', 'aprovava nos dois casos antes da correcao');
      } else {
        fail('o instrumento dos ramos nao distingue os lados', `${okOriginal} / ${okTrocado}`);
      }
    }

    /** 5. A FRONTEIRA ERRADA CONTINUA ERRADA — o engano que custou duas rodadas. */
    {
      const c = foraDeComentario(arquivo('src/components/admin/provador/avatar-view.tsx'));
      const primeira = c.indexOf(') : (');
      const certa = c.search(/\)\s*:\s*\(\s*<PieceWorkspace/);
      if (primeira >= 0 && certa >= 0 && primeira !== certa) {
        ok('a primeira `) : (` do arquivo NAO e a fronteira', `${primeira} != ${certa}`);
      } else {
        fail('a prova da fronteira perdeu o sentido', `${primeira} / ${certa}`);
      }
    }

    /** 6. O merge ACUSA o defeito: repetir o bug tem que furar a prova 3. */
    const ruim = { ...REPOUSO, categoryId: 'cat-tops' };
    const top = CATALOGO.find((p) => p.name === 'top');
    const outro = CATALOGO.find((p) => p.categoryId !== top.categoryId);
    const quebrado = { productId: top.id, ...ruim, categoryId: top.categoryId };
    const quebradoOutro = { productId: outro.id, ...ruim, categoryId: outro.categoryId };
    const colidem = quebradoOutro.categoryId === top.categoryId;
    if (!colidem && outro.categoryId !== top.categoryId) {
      ok('o defeito original FARIA os dois produtos colidirem', 'se o repouso tivesse o campo');
    } else {
      fail('a prova de categoria nao detectaria o defeito', `${quebrado.categoryId} / ${quebradoOutro.categoryId}`);
    }
  }

  /* ------------------------------------------------------------- resumo */

  console.log(`\n${'='.repeat(72)}`);
  console.log(`PROVADOR E IA: ${provas - falhas}/${provas} provas${falhas ? ` — ${falhas} FALHA(S)` : ''}`);
  console.log('='.repeat(72));
  process.exit(falhas ? 1 : 0);
})();
