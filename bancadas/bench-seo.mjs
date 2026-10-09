/**
 * Bancada do modulo SEO & Google (adm-084).
 *
 * ================== O QUE ELA PROVA ==================
 *
 *   os OITO campos — os tres do Meta Tags, os dois da imagem OG, os tres do Google;
 *   os `placeholder` exatos do print (sao atributos — so se leem no HTML cru);
 *   o botao `Upload` da imagem de compartilhamento;
 *   as duas recomendacoes fixas e o cartao `SEO Técnico Ativo` com os quatro itens;
 *   que a demonstracao e VAZIA — o print nao tem campo preenchido;
 *   que a troca de um campo NAO muta a entrada;
 *   que a pagina deixou de ser `ModulePage` e a faixa errada sumiu.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Layout, as duas colunas, cor renderizada, posicao, responsividade e clique.
 *
 * A bancada NAO type-checa — so executa. O portao de TIPOS e o `npm run typecheck`.
 */

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-seo.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-seo');

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
  /src[\\/](lib[\\/]seo|components[\\/]admin[\\/]seo|app[\\/]admin[\\/]seo)[\\/]/.test(f),
);

const porCaminho = new Map();
for (const f of arquivos) porCaminho.set(f.replace(/\.tsx?$/, '').replace(/\\/g, '/'), f);

function resolverDe(base, pedido) {
  let alvo;
  if (pedido.startsWith('@/')) alvo = join(SRC, pedido.slice(2));
  else if (pedido.startsWith('.')) alvo = resolve(dirname(base), pedido);
  else return null;
  const chave = alvo.replace(/\\/g, '/');
  if (porCaminho.has(chave)) return porCaminho.get(chave);
  for (const sufixo of ['.tsx', '.ts']) if (porCaminho.has(chave + sufixo)) return porCaminho.get(chave + sufixo);
  for (const indice of ['/index.tsx', '/index.ts']) if (porCaminho.has(chave + indice)) return porCaminho.get(chave + indice);
  return null;
}

const precisa = new Set();
const fila = [...raizes];
while (fila.length) {
  const arquivo = fila.pop();
  if (precisa.has(arquivo)) continue;
  precisa.add(arquivo);
  const fonte = readFileSync(arquivo, 'utf8');
  const re = /from\s+['"]([^'"]+)['"]/g;
  let casou;
  while ((casou = re.exec(fonte)) !== null) {
    const dep = resolverDe(arquivo, casou[1]);
    if (dep && !precisa.has(dep)) fila.push(dep);
  }
}
const dependencias = [...precisa];

const OPCOES = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
};

let emitidos = 0;
const falhasEmissao = [];
for (const arquivo of dependencias) {
  const fonte = readFileSync(arquivo, 'utf8');
  const saida = ts.transpileModule(fonte, { compilerOptions: OPCOES, fileName: arquivo, reportDiagnostics: true });
  for (const diag of saida.diagnostics ?? []) {
    if (diag.category !== ts.DiagnosticCategory.Error) continue;
    const linha = diag.file && diag.start !== undefined
      ? diag.file.getLineAndCharacterOfPosition(diag.start).line + 1
      : '?';
    const onde = arquivo.replace(raizProjeto + '\\', '').replace(raizProjeto + '/', '');
    falhasEmissao.push(`${onde}:${linha} — ${ts.flattenDiagnosticMessageText(diag.messageText, ' ')}`);
  }
  const destino = join(OUT, arquivo.replace(raizProjeto + '\\', '').replace(raizProjeto + '/', '')).replace(/\.tsx?$/, '.js');
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, saida.outputText);
  emitidos += 1;
}

if (falhasEmissao.length === 0) ok('transpilacao', `fecho do modulo — ${emitidos} arquivos (de ${arquivos.length} do src)`);
else {
  fail('transpilacao', `${falhasEmissao.length} erro(s) de sintaxe`);
  for (const linha of falhasEmissao.slice(0, 8)) console.log(`       ${linha}`);
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

const demo = require(join(OUT, 'src/lib/seo/demo.js'));
const dados = require(join(OUT, 'src/lib/seo/data.js'));
const metricas = require(join(OUT, 'src/lib/seo/metrics.js'));
const { SeoView } = require(join(OUT, 'src/components/admin/seo/seo-view.js'));
const {
  MetaTagsPanel, OpenGraphPanel, GooglePanel, SeoTechnicalCard,
} = require(join(OUT, 'src/components/admin/seo/seo-panels.js'));

/* ------------------------------------------------------------- utilidades */

const normalizar = (s) => s.replace(/[\s  ]+/g, ' ').trim();
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
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
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
const nada = () => {};
/** A config vazia, vinda da propia demo. */
const vazio = demo.DEMO_SEO;

/* ====================== 1. a demonstracao e VAZIA ====================== */

console.log('\n1. a demonstracao e VAZIA — o print nao tem campo preenchido');

const camposTexto = ['seoTitle', 'seoDescription', 'seoKeywords', 'ogImageUrl', 'ogImageUpload', 'gaId', 'gtmId', 'gscVerification'];
const preenchidos = camposTexto.filter((c) => vazio[c] !== '');
if (preenchidos.length === 0)
  ok('os OITO campos comecam vazios', 'nem titulo, nem GA ID, nem imagem');
else fail('demo preenchida', preenchidos.join(', '));

const leitura = await dados.getSeoConfig();
if (leitura.source === 'demo' && mesmo(leitura.data, vazio))
  ok('`getSeoConfig` devolve a demo marcada como tal', '');
else fail('leitura', JSON.stringify(leitura.source));

leitura.data.seoTitle = 'mexido';
if (vazio.seoTitle === '')
  ok('a leitura devolve COPIA — a demo nao e tocada', 'spread antes de devolver');
else fail('demo mutada', vazio.seoTitle);

/* ====================== 2. as listas fixas ====================== */

console.log('\n2. o checklist tecnico e as duas recomendacoes');

if (metricas.SEO_CHECKLIST.length === 4)
  ok('o cartao verde tem QUATRO itens', 'nao depende de campo nenhum — sao afirmacoes fixas');
else fail('checklist', `${metricas.SEO_CHECKLIST.length}`);

const itensEsperados = [
  'Sitemap automático gerado em /sitemap.xml',
  'Arquivo Robots.txt configurado em /robots.txt',
  'URLs amigáveis para produtos e categorias',
  'Canonical tags implementadas em todas as páginas',
];
if (mesmo(metricas.SEO_CHECKLIST, itensEsperados))
  ok('os quatro textos sao os do print', 'sitemap · robots · URLs · canonical');
else fail('itens do checklist', JSON.stringify(metricas.SEO_CHECKLIST));

if (metricas.SEO_LIMITS.title === 'Recomendado: até 60 caracteres.' &&
    metricas.SEO_LIMITS.description === 'Recomendado: entre 120 e 160 caracteres.')
  ok('as duas recomendacoes fixas', 'nao ha contador ao vivo — o print nao mostra');
else fail('limites', JSON.stringify(metricas.SEO_LIMITS));

/* ====================== 3. as conversoes puras ====================== */

console.log('\n3. a troca de um campo e o `Upload`');

const original = { ...vazio, seoTitle: 'A' };
const trocado = metricas.applySeoChange(original, 'seoTitle', 'B');
if (trocado.seoTitle === 'B' && original.seoTitle === 'A' && !Object.is(trocado, original))
  ok('`applySeoChange` troca UM campo e nao muta a entrada', '');
else fail('applySeoChange', JSON.stringify([trocado.seoTitle, original.seoTitle]));

if (metricas.applySeoChange(original, 'gaId', 'G-1').seoTitle === 'A')
  ok('trocar um campo preserva os outros', '');
else fail('preserva os outros', '');

if (metricas.ogImageFromFile(null) === null && metricas.ogImageFromFile('   ') === null &&
    metricas.ogImageFromFile('foto.png') === 'foto.png')
  ok('`ogImageFromFile`: sem arquivo nao muda nada', '`null` e vazio devolvem `null`');
else fail('ogImageFromFile', JSON.stringify([metricas.ogImageFromFile(null), metricas.ogImageFromFile('foto.png')]));

/* ====================== 4. o painel `Meta Tags Globais` ====================== */

console.log('\n4. `Meta Tags Globais` — os tres campos e as duas dicas');

const meta = render(MetaTagsPanel, { config: vazio, onChange: nada });
const tMeta = textos(meta);

for (const rotulo of ['Título do site (SEO Title)', 'Meta descrição', 'Palavras-chave (Keywords)']) {
  if (!tMeta.includes(rotulo)) fail('rotulo', rotulo);
}
if (['Título do site (SEO Title)', 'Meta descrição', 'Palavras-chave (Keywords)'].every((r) => tMeta.includes(r)))
  ok('os tres rotulos', '');
else fail('rotulos do meta', tMeta.slice(0, 200));

if (tMeta.includes('Recomendado: até 60 caracteres.') && tMeta.includes('Recomendado: entre 120 e 160 caracteres.'))
  ok('as duas recomendacoes aparecem embaixo dos campos', '');
else fail('dicas', '');

if (meta.includes('placeholder="Ex: Closet Lunna — Moda Fitness e Streetwear Feminino"') &&
    meta.includes('placeholder="Descreva sua loja em poucas frases..."') &&
    meta.includes('placeholder="Ex: moda fitness, academia, legging, tops, streetwear"'))
  ok('os tres `placeholder` do print, no HTML cru', 'placeholder e atributo — `textos` nao o ve');
else fail('placeholders do meta', '');

if (!textos(meta).includes('placeholder='))
  ok('`textos()` apaga o `placeholder`', 'por isso ele se prova no cru');
else fail('textos nao apaga atributo', '');

/* ====================== 5. o painel `Open Graph` ====================== */

console.log('\n5. `Redes Sociais (Open Graph)` — DOIS campos e o botao `Upload`');

const og = render(OpenGraphPanel, { config: vazio, onChange: nada, onUpload: nada });
const tOg = textos(og);

if (tOg.includes('Redes Sociais (Open Graph)') &&
    tOg.includes('Como a loja aparece quando compartilhada no WhatsApp/Instagram'))
  ok('o titulo e a descricao da secao', '');
else fail('cabecalho do OG', tOg.slice(0, 200));

if (tOg.includes('Imagem de compartilhamento (OG Image)'))
  ok('o rotulo do campo de imagem', '');
else fail('rotulo do OG', '');

if (og.includes('placeholder="URL da imagem (1200×630px)"'))
  ok('o primeiro campo com o `placeholder` de dimensoes', '');
else fail('placeholder 1200x630', '');

/**
 * O `placeholder` curto (`URL da imagem`) casa SO no segundo campo — o de cima tem
 * o texto longo, com ` (1200×630px)` depois. Contar as duas formas separadamente e
 * o que distingue os campos: se os dois tivessem o mesmo texto, a soma seria 2 na
 * mesma agulha.
 */
const curto = contar(og, 'placeholder="URL da imagem"');
const longo = contar(og, 'placeholder="URL da imagem (1200×630px)"');
if (curto === 1 && longo === 1)
  ok('dois campos de imagem: um com o texto curto, outro com o longo', 'dois caminhos para o mesmo valor');
else fail('campos de imagem', `curto=${curto} longo=${longo}`);

if (tOg.includes('Upload'))
  ok('o botao `Upload`', '');
else fail('botao upload', '');

if (contar(og, 'aria-label="URL da imagem de compartilhamento"') === 1 &&
    contar(og, 'aria-label="URL da imagem enviada"') === 1)
  ok('os dois campos sao distinguiveis por `aria-label`', 'mesma aparencia, nomes diferentes');
else fail('aria-label dos dois campos', '');

/* ====================== 6. o painel `Integracoes Google` ====================== */

console.log('\n6. `Integrações Google` — os tres IDs em monoespacada');

const goog = render(GooglePanel, { config: vazio, onChange: nada });
const tGoog = textos(goog);

if (tGoog.includes('Integrações Google') && tGoog.includes('Conecte as ferramentas de análise e indexação'))
  ok('o titulo e a descricao da secao', '');
else fail('cabecalho do Google', '');

for (const rotulo of ['Google Analytics 4 (GA ID)', 'Google Tag Manager (GTM ID)', 'Google Search Console (Código de Verificação)']) {
  if (!tGoog.includes(rotulo)) fail('rotulo do Google', rotulo);
}
if (['Google Analytics 4 (GA ID)', 'Google Tag Manager (GTM ID)', 'Google Search Console (Código de Verificação)'].every((r) => tGoog.includes(r)))
  ok('os tres rotulos', '');
else fail('rotulos do Google', '');

if (goog.includes('placeholder="Ex: G-XXXXXXXXXX"') && goog.includes('placeholder="Ex: GTM-XXXXXXX"') &&
    goog.includes('placeholder="O código de verificação da meta tag"'))
  ok('os tres `placeholder` do print', '');
else fail('placeholders do Google', '');

/** Os tres campos usam monoespacada — sao identificadores, nao texto corrido. */
if (contar(goog, 'font-mono') === 3)
  ok('os tres campos em `font-mono`', 'como no original');
else fail('font-mono', `${contar(goog, 'font-mono')}`);

if (tGoog.includes('Usado para indexar a loja e gerar o Sitemap.'))
  ok('a dica do Search Console', '');
else fail('dica do GSC', '');

/* ====================== 7. o cartao verde ====================== */

console.log('\n7. o cartao `SEO Técnico Ativo`');

const cartao = render(SeoTechnicalCard, {});
const tCartao = textos(cartao);

if (tCartao.includes('SEO Técnico Ativo'))
  ok('o titulo do cartao', '');
else fail('titulo do cartao', '');

const faltando = itensEsperados.filter((i) => !tCartao.includes(i));
if (faltando.length === 0)
  ok('os quatro itens aparecem', '');
else fail('itens do cartao', faltando.join(' | '));

if (contar(cartao, '<li') === 4)
  ok('a lista tem quatro `li`', 'o marcador e um `span`, nao um `li` solto');
else fail('lis do cartao', `${contar(cartao, '<li')}`);

if (cartao.includes('bg-success-surface'))
  ok('o cartao e verde (`success-surface`)', '');
else fail('cor do cartao', '');

/* ====================== 8. a tela abre em CARREGAMENTO ====================== */

console.log('\n8. a tela — cabecalho e o estado inicial');

const tela = render(SeoView, {});
const tTela = textos(tela);

if (tTela.includes('SEO & Google') && tTela.includes('Otimize a visibilidade da Closet Lunna nos motores de busca'))
  ok('o cabecalho do print', 'titulo e descricao');
else fail('cabecalho', tTela.slice(0, 200));

if (tTela.includes('Carregando…') && !tTela.includes('Meta Tags Globais'))
  ok('a tela abre em CARREGAMENTO', '`useEffect` nao roda no `renderToStaticMarkup`');
else fail('estado inicial', tTela.slice(0, 200));

/* ====================== 9. a escrita e a pagina ====================== */

console.log('\n9. a escrita nao finge gravar, e a pagina e a tela de verdade');

const escrita = await dados.saveSeoConfig({ ...vazio, seoTitle: 'X' });
if (escrita.persisted === false && escrita.reason.length > 0 && escrita.data.seoTitle === 'X')
  ok('`saveSeoConfig` devolve `persisted: false` com motivo', 'nao finge um "SEO salvo!"');
else fail('escrita', JSON.stringify(escrita));

const pagina = arquivo('src/app/admin/seo/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('SeoView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', '');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (!paginaLimpa.includes('structure') && !paginaLimpa.includes('references='))
  ok('o `structure` e o `references=` inventados sumiram', '');
else fail('placeholder sobreviveu', '');

if (!/adm-083 a adm-084/.test(paginaLimpa) && !/adm-083/.test(paginaLimpa))
  ok('a faixa ERRADA `adm-083 a adm-084` nao aparece', 'SEO e so adm-084');
else fail('faixa errada', '');

const fonte = [
  arquivo('src/lib/seo/types.ts'), arquivo('src/lib/seo/demo.ts'),
  arquivo('src/lib/seo/metrics.ts'), arquivo('src/lib/seo/data.ts'),
  arquivo('src/components/admin/seo/seo-panels.tsx'),
  arquivo('src/components/admin/seo/seo-view.tsx'), pagina,
].join('\n');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonte)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', '');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', '');
else fail('supressao de tipo', '');

/**
 * Os blocos que o placeholder prometia e o print NAO mostra nao existem no CODIGO.
 * A medicao e sobre `semComentarios(fonte)`: a propria nota que explica "nao ha
 * Pixels" escreve a palavra `Pixels`, e medir o arquivo cru acusaria a nota.
 */
const codigo = semComentarios(fonte);
if (!/\bpixels?\b|Facebook Pixel|TikTok Pixel|dados estruturados|JSON-LD|schema\.org/i.test(codigo))
  ok('nada de `Pixels`, `Dados estruturados` ou JSON-LD', 'o placeholder prometia; o print nao mostra — nao inventado');
else fail('campo inventado', (codigo.match(/\bpixels?\b|Facebook Pixel|TikTok Pixel|dados estruturados|JSON-LD|schema\.org/gi) ?? []).join(', '));

/* ====================== 10. provas ao contrario ====================== */

console.log('\n10. provas ao contrario — o defeito tem que REPROVAR');

/** Um campo vazio NAO pode virar texto na tela — o `placeholder` e que aparece. */
if (tMeta.includes('Ex: Closet Lunna') === false && meta.includes('Ex: Closet Lunna'))
  ok('o exemplo esta no `placeholder`, nao no valor', 'o campo esta vazio; o exemplo e dica');
else fail('exemplo vazou para o texto', '');

/** `ogImageFromFile` nao pode transformar `null` em string. */
if (typeof metricas.ogImageFromFile(null) !== 'string')
  ok('`ogImageFromFile(null)` nao vira `"null"`', '`null` continua `null`');
else fail('null virou string', metricas.ogImageFromFile(null));

/** `applySeoChange` com string vazia nao pode apagar os vizinhos. */
const comVazio = metricas.applySeoChange({ ...vazio, gaId: 'G-1', gtmId: 'GTM-1' }, 'gaId', '');
if (comVazio.gaId === '' && comVazio.gtmId === 'GTM-1')
  ok('limpar um campo nao apaga os vizinhos', '');
else fail('limpar apagou vizinho', JSON.stringify(comVazio));

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
