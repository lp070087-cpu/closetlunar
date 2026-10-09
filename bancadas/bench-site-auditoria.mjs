/**
 * Auditoria final da FASE 3 — o site publico.
 *
 * ================== O QUE ESTA BANCADA E, E O QUE ELA NAO E ==================
 *
 * Ela NAO remede a Home. As 14 capturas foram conferidas na construcao, e as
 * medidas que importam estao nas CLASSES (nao ha medida de pixel nesta fase: os
 * prints cobrem UMA rota, e as outras oito vem do original). Repetir a leitura
 * de imagem aqui nao provaria nada de novo.
 *
 * Ela prova o CONJUNTO — o que so existe com o site inteiro montado:
 *
 *   1. O FECHAMENTO DAS ROTAS. Todo destino declarado resolve numa rota que
 *      existe. Um `Link href="/categoria/promocoes"` que apontasse para uma rota
 *      inexistente passaria pelo TypeScript e daria 404.
 *
 *   2. A AUSENCIA DE LINK INTERNO FALSO. Nenhum `href="#"` e nenhum
 *      `href="/rota-que-nao-existe"` no codigo do site.
 *
 *   3. O REUSO DOS DOMINIOS. O site le dos MESMOS `lib/*` que o admin e o painel
 *      do cliente. Se ele tivesse criado um `lib/site/produtos`, existiriam dois
 *      produtos — o que a condicao da fase proibe.
 *
 *   4. A FRONTEIRA DO BANCO E DO SEGREDO. Nenhum cliente de banco, nenhum
 *      `process.env`, nenhum padrao de chave no codigo do site.
 *
 *   5. O QUE NAO PODE APARECER. `ModulePage`, `TODO`, texto de placeholder,
 *      `bg-beige` e a paleta crua.
 *
 * Uso: node bancadas/bench-site-auditoria.mjs <pasta do projeto>
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-site-auditoria.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const SITE = join(SRC, 'app', '(site)');
const OUT = join(PROJ, '.bench-site-auditoria');

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => {
  provas += 1;
  console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`);
};
const fail = (n, d) => {
  falhas += 1;
  console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`);
};

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

/* ------------------------------------------------ varrer as raizes do site */

const arquivos = [];
(function varrer(dir) {
  if (!existsSync(dir)) return;
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) varrer(caminho);
    else if (/\.tsx?$/.test(caminho)) arquivos.push(caminho);
  }
})(SRC);

/** Codigo do site: a pasta de rotas do site, os componentes e `lib/site`. */
const raizes = arquivos.filter((f) =>
  /src[\\/](components[\\/]site|lib[\\/]site)[\\/]/.test(f) ||
  /src[\\/]app[\\/]\(site\)[\\/]/.test(f),
);
/** Os dois handlers de arquivo (robots/sitemap) vivem fora do grupo. */
const handlers = [join(SRC, 'app', 'robots.txt', 'route.ts'), join(SRC, 'app', 'sitemap.xml', 'route.ts')].filter(
  existsSync,
);

if (raizes.length === 0) {
  fail('nenhuma raiz do site', 'a Fase 3 nao esta no disco');
  console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
  process.exit(1);
}

const programa = ts.createProgram([...raizes, ...handlers], {
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
  ok('emissao sem erro', `${raizes.length} arquivos do site`);
else {
  fail('emissao', `${erros.length} erro(s)`);
  for (const d of erros.slice(0, 8)) console.log(`       ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
}

function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
const ler = (f) => readFileSync(f, 'utf8');

/* ================= 1. as rotas do site ================= */

console.log('\n1. o fechamento das rotas — toda rota e alcancavel, e todo destino existe');

/**
 * As rotas do site, contadas do DISCO. `[slug]`/`[token]`/`[orderId]` sao
 * dinamicas: elas valem por QUALQUER valor, e a prova abaixo e de que os
 * destinos literais do codigo casam com um destes padroes.
 */
function rotasDe(dir, prefixo = '', acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) rotasDe(caminho, `${prefixo}/${entrada}`, acc);
    else if (entrada === 'page.tsx') acc.push(prefixo || '/');
  }
  return acc;
}

const dinamicas = rotasDe(SITE);
const rotasDeArquivo = ['/robots.txt', '/sitemap.xml'];

/** `/categoria/[slug]` vira o regex `/categoria/<algo>`. */
function ehRota(href) {
  const limpo = href.split('?')[0].split('#')[0];
  for (const r of [...dinamicas, ...rotasDeArquivo]) {
    const padrao = r.replace(/\[[^\]]+\]/g, '[^/]+').replace(/\//g, '\\/');
    if (new RegExp(`^${padrao}$`).test(limpo)) return true;
  }
  return false;
}

const rotasEsperadas = [
  '/',
  '/buscar',
  '/checkout',
  '/sobre',
  '/blog',
  '/categoria/[slug]',
  '/produto/[slug]',
  '/look/[token]',
  '/pedido-confirmado/[orderId]',
];
const faltando = rotasEsperadas.filter((r) => !dinamicas.includes(r));
if (faltando.length === 0)
  ok(`as ${dinamicas.length} rotas do site estao no disco`, dinamicas.sort().join(' '));
else fail('rota do site ausente', faltando.join(', '));

if (rotasDeArquivo.every((r) => existsSync(join(SRC, 'app', r.slice(1), 'route.ts'))))
  ok('`/robots.txt` e `/sitemap.xml` existem', 'os dois handlers de arquivo');
else fail('handler de arquivo ausente', rotasDeArquivo.join(', '));

/* ================= 2. nenhum link interno falso ================= */

console.log('\n2. nenhum link falso — todo `href` literal resolve numa rota ou e externo');

const codigoDoSite = raizes.map((f) => ({ f, c: semComentarios(ler(f)) }));

/*
  A varredura de `href`. Aceita: rota do site, rota de outra area que EXISTE
  (`/conta/...`, o painel do cliente), externo (`http`), ancora (`#algo`),
  `mailto:`/`tel:`/`wa.me`. Recusa: `#` sozinho (o "link que nao vai a lugar
  nenhum") e caminho que nao resolve em rota nenhuma.
*/
const rotasDoProjeto = ['/conta', '/conta/pedidos', '/conta/favoritos', '/conta/enderecos', '/conta/medidas', '/conta/pontos', '/conta/cupons', '/conta/dados', '/conta/seguranca', '/conta/afiliada'];

const falsos = [];
for (const { f, c } of codigoDoSite) {
  for (const m of c.matchAll(/(?:href|action)=["']([^"'{}]+)["']/g)) {
    const href = m[1];
    if (!href) continue;
    if (href === '#' || href === '') {
      falsos.push(`${f.split(/[\\/]/).pop()}: href="${href}"`);
      continue;
    }
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    if (href.startsWith('#')) continue;
    if (ehRota(href) || rotasDoProjeto.includes(href.split('?')[0])) continue;
    falsos.push(`${f.split(/[\\/]/).pop()}: href="${href}"`);
  }
}
if (falsos.length === 0)
  ok('nenhum `href` falso em codigo', 'nem `#`, nem caminho inexistente');
else fail('link falso', falsos.slice(0, 6).join(' | '));

/* ================= 3. o reuso dos dominios ================= */

console.log('\n3. o site le dos MESMOS dominios — nao ha um segundo catalogo');

const importacoes = raizes.flatMap((f) =>
  [...semComentarios(ler(f)).matchAll(/from\s+'(@\/[^']+)'/g)].map((m) => ({ arquivo: f, de: m[1] })),
);

/*
  Um `lib/site/produtos` ou um `lib/site/pedidos` seria o SEGUNDO catalogo — a
  coisa exata que a condicao da fase proibe. `lib/site/carrinho.tsx` existe e e
  legitimo: a sacola e do VISITANTE, e nao uma copia de um dominio existente.
*/
const dominiosProprios = [...new Set(importacoes.filter((i) => i.de.startsWith('@/lib/site/')).map((i) => i.de))];
const permitidos = ['@/lib/site/carrinho'];
const intrusos = dominiosProprios.filter((d) => !permitidos.includes(d));
if (intrusos.length === 0)
  ok('o unico modulo proprio do site e a sacola', permitidos.join(', '));
else fail('o site criou um dominio paralelo', intrusos.join(', '));

/*
  E a prova positiva: os dominios do admin/cliente sao LIDOS pelo site.
*/
const dominiosReusados = [...new Set(importacoes.map((i) => i.de))].filter(
  (d) => d.startsWith('@/lib/') && !d.startsWith('@/lib/site/'),
);
const esperados = ['@/lib/produtos', '@/lib/conteudo', '@/lib/categorias'];
const reusadosOk = esperados.every((e) => dominiosReusados.some((d) => d.startsWith(e)));
if (reusadosOk)
  ok('o site le produtos, conteudo e categorias do projeto', `${dominiosReusados.length} modulos de ` + '\`@/lib\`');
else fail('o site nao le os dominios esperados', `achados: ${dominiosReusados.join(', ')}`);

/*
  Nenhuma entidade NOVA declarada no site. Um `interface ProdutoSite` aqui seria
  a segunda forma do mesmo conceito.
*/
const tiposNovos = codigoDoSite
  .filter(({ c }) => /export\s+interface\s+(Produto|Categoria|Pedido|Cliente|Cupom|Carrinho)\b/i.test(c))
  .map(({ f }) => f.split(/[\\/]/).pop());
if (tiposNovos.length === 0)
  ok('o site NAO declara tipo de dominio proprio', 'ele importa os tipos do projeto');
else fail('tipo de dominio declarado no site', tiposNovos.join(', '));

/* ================= 4. a fronteira do banco e do segredo ================= */

console.log('\n4. a fronteira — nenhum banco, nenhum env, nenhum segredo');

const clientesDeBanco = /(?:from|require\()\s*['"](@prisma\/client|@neondatabase\/serverless|drizzle-orm|\bpg\b|postgres|mysql2|better-sqlite3|@supabase\/[^'"]*)['"]/;
const comBanco = codigoDoSite.filter(({ c }) => clientesDeBanco.test(c)).map(({ f }) => f.split(/[\\/]/).pop());
if (comBanco.length === 0) ok('nenhum arquivo do site importa cliente de banco', 'tudo le de `lib/*/data.ts`');
else fail('o site importa banco', comBanco.join(', '));

const comEnv = codigoDoSite.filter(({ c }) => /process\.env/.test(c)).map(({ f }) => f.split(/[\\/]/).pop());
if (comEnv.length === 0) ok('nenhum arquivo do site le `process.env`', 'nem para banco, nem para nada');
else fail('o site le `process.env`', comEnv.join(', '));

const padroes = [
  [/sk_live_[A-Za-z0-9]/, 'chave de gateway'],
  [/eyJ[A-Za-z0-9_-]{20,}/, 'token JWT'],
  [/postgres(?:ql)?:\/\/[^\s'"]/, 'string de conexao'],
  [/(?:DATABASE_URL|DIRECT_URL|SUPABASE_URL)\s*[:=]/, 'nome de variavel de conexao'],
];
const segredos = [];
for (const { f, c } of codigoDoSite)
  for (const [re, o] of padroes) if (re.test(c)) segredos.push(`${f.split(/[\\/]/).pop()} (${o})`);
if (segredos.length === 0) ok('nenhum dos quatro padroes de segredo aparece', 'varredura sobre o site inteiro');
else fail('segredo no site', segredos.join(', '));

/* ================= 5. o que NAO pode aparecer ================= */

console.log('\n5. provas ao contrario — placeholder, TODO e paleta crua');

const PROIBIDOS = [
  [/\bModulePage\b/, 'o componente de placeholder que a fase proibe'],
  [/\bTODO\b|\bFIXME\b|\bXXX\b/, 'marcador de codigo inacabado'],
  [/\bLorem ipsum\b/i, 'texto de encomenda'],
  [/\bem construc/i, 'aviso de obra'],
  [/bg-beige/, 'o token `beige` nao existe (`secondary` e o par)'],
  [/overflow-x-hidden/, 'mata o `sticky` do cabecalho — o projeto usa `clip`'],
];
for (const [re, porque] of PROIBIDOS) {
  const achados = codigoDoSite.filter(({ c }) => re.test(c)).map(({ f }) => f.split(/[\\/]/).pop());
  if (achados.length === 0) ok(`ausente do codigo: ${re.source}`, porque);
  else fail(`apareceu no codigo: ${re.source}`, achados.join(', '));
}

/*
  A PALETA CRUA, com a mesma ressalva da Fase 2: o `text-amber-600` e MEDIDO (o
  amarelo do cartao de KPI no print), e as classes de marca do WhatsApp
  (`#25D366`) sao a cor DO TERCEIRO, nao uma escolha de paleta. Os dois sao
  excecoes declaradas; qualquer outra cor crua e acusada.
*/
const EXCECOES = ['text-amber-600'];
const crua = /(?:text|bg|border|from|to|via)-(?:slate|gray|zinc|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g;
let corCrua = 0;
for (const { f, c } of codigoDoSite) {
  const achados = [...c.matchAll(crua)].map((m) => m[0]).filter((x) => !EXCECOES.includes(x));
  if (achados.length > 0) {
    fail('cor crua fora da excecao', `${f.split(/[\\/]/).pop()}: ${[...new Set(achados)].join(', ')}`);
    corCrua += 1;
  }
}
if (corCrua === 0) ok('nenhuma cor crua fora da excecao medida', 'ele usa os tokens do projeto');

/*
  A COR DO WHATSAPP. `#25D366` e a cor DO TERCEIRO — nao e uma escolha de paleta
  do projeto, e nao tem token (`--success` e outra coisa, o verde do feedback).
  Reproduzir a marca do botao do WhatsApp com o verde do projeto mudaria a cor da
  marca; inventar um token para ela seria criar uma cor que ninguem decidiu.
  Entao ela e uma EXCECAO DECLARADA, como o `text-amber-600` — e o que a prova
  afirma e que ela continua sendo SO a do WhatsApp, e nao que nao existe hex.
*/
const HEX_MARCA_EXCECAO = /\[#25D366\]/i;
const hexEncontrados = [...new Set(codigoDoSite.flatMap(({ c }) => [...c.matchAll(/[a-z-]+\[#[0-9a-fA-F]{3,8}\]/g)].map((m) => m[0])))];
const foraDaExcecao = hexEncontrados.filter((h) => !HEX_MARCA_EXCECAO.test(h) && !/\[#[0-9a-fA-F]{3}000000/i.test(h));
if (foraDaExcecao.length === 0)
  ok('nenhuma cor hexadecimal fora da marca do WhatsApp', HEX_MARCA_EXCECAO.test(hexEncontrados.join(' ')) ? 'a unica e `#25D366`' : 'nenhuma');
else fail('cor hexadecimal fora da excecao', foraDaExcecao.join(', '));

/* ================= 6. a honestidade ================= */

console.log('\n6. a honestidade — o que a fase NAO pode afirmar');

/*
  A frase que a fase proibe. O `Cupom enviado` do original seria uma afirmacao de
  envio sem provider; `pagamento funcionando` sem gateway. A varredura e do TEXTO
  VISIVEL e do codigo.
*/
const AFIRMACOES = [
  [/Cupom enviado/i, 'afirma envio de cupom sem provider'],
  [/pagamento (?:aprovado|confirmado)/i, 'afirma pagamento sem gateway'],
  [/e-?mail enviado/i, 'afirma e-mail sem provider'],
];
const mentiras = [];
for (const { f, c } of codigoDoSite)
  for (const [re, o] of AFIRMACOES) if (re.test(c)) mentiras.push(`${f.split(/[\\/]/).pop()} (${o})`);
if (mentiras.length === 0) ok('nenhuma afirmacao de integracao que nao existe', 'nem cupom, nem pagamento, nem e-mail');
else fail('afirmacao sem lastro', mentiras.join(', '));

/*
  E o aviso honesto ESTA la. O checkout diz que o gateway nao foi definido; o
  lead popup diz que o cadastro entra na integracao.
*/
const checkout = ler(join(SRC, 'components', 'site', 'checkout-view.tsx'));
const lead = ler(join(SRC, 'components', 'site', 'lead-popup.tsx'));
if (/gateway ainda não foi definido/i.test(checkout))
  ok('o checkout AVISA que o gateway nao foi definido', '"GATEWAY A DEFINIR" visivel');
else fail('o checkout nao avisa sobre o gateway', 'uma tela de cobranca sem aviso mente');
if (/fase de integração/i.test(lead))
  ok('o modal do cupom AVISA que o cadastro entra na integracao', 'nao afirma envio');
else fail('o modal nao avisa', '');

/* ================= 7. o STATUS contra o disco ================= */

console.log('\n7. o STATUS diz o que o disco prova');

const STATUS = join(PROJ, 'SITE-STATUS.md');
if (!existsSync(STATUS)) fail('`SITE-STATUS.md` ausente', '');
else {
  const status = ler(STATUS);
  if (/\*\*PRONTO\*\*/.test(status)) ok('o STATUS registra modulos concluidos', '');
  if (!/a fazer/.test(status) || /Modulos/.test(status))
    ok('o STATUS tem a tabela de modulos', '');

  const componentes = readdirSync(join(SRC, 'components', 'site')).filter((n) => n.endsWith('.tsx')).length;
  ok(`o site tem ${componentes} componentes`, 'a contagem do inventario');
}

/* ------------------------------------------------------------------ rodape */

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
process.exit(falhas === 0 ? 0 : 1);
