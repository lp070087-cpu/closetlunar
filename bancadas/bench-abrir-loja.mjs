/**
 * Bancada do modulo Abrir Loja (adm-087 a adm-089).
 *
 * ================== O QUE ELA PROVA ==================
 *
 *   os NOVE itens do print, com titulo e criterio exatos, na ordem;
 *   os resultados da captura: SEIS verdes e TRES vermelhos;
 *   `6 de 9` e `67%` — o arredondamento, nao o truncamento;
 *   os quatro estados do selo (`OK` · `Pendente` · `...` · `—`);
 *   que NADA e marcado a mao: nao ha caixa de marcar, nao ha escrita;
 *   os dois avisos (verde pronto / ambar pendente) e o toast;
 *   que a tela nao afirma nada antes de a leitura chegar.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Layout, cor renderizada, posicao, responsividade, animacao e clique.
 *
 * A bancada NAO type-checa — so executa. O portao de TIPOS e o `npm run typecheck`.
 */

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-abrir-loja.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-abrir-loja');

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

const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]abrir-loja|components[\\/]admin[\\/]abrir-loja|app[\\/]admin[\\/]abrir-loja)[\\/]/.test(f),
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

const demo = require(join(OUT, 'src/lib/abrir-loja/demo.js'));
const dados = require(join(OUT, 'src/lib/abrir-loja/data.js'));
const m = require(join(OUT, 'src/lib/abrir-loja/metrics.js'));
const cartao = require(join(OUT, 'src/components/admin/abrir-loja/checklist-card.js'));
const lista = require(join(OUT, 'src/components/admin/abrir-loja/checklist-list.js'));
const toast = require(join(OUT, 'src/components/admin/abrir-loja/checklist-toast.js'));
const { AbrirLojaView } = require(join(OUT, 'src/components/admin/abrir-loja/abrir-loja-view.js'));

/* ------------------------------------------------------------- utilidades */

const normalizar = (s) => s.replace(/[\s  ]+/g, ' ').trim();
function textos(html) {
  return normalizar(
    html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#x27;/g, "'"),
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

/* ====================== 1. os nove itens do print ====================== */

console.log('\n1. os NOVE itens, com titulo e criterio exatos, na ordem');

const TITULOS = [
  'Produtos cadastrados', 'Categorias cadastradas', 'Estoque válido', 'Banner ativo',
  'Instagram configurado', 'WhatsApp configurado', 'Política cadastrada', 'Frete configurado',
  'Pagamento configurado',
];

if (demo.DEMO_CHECKLIST.length === 9)
  ok('sao exatamente NOVE itens', 'como o print');
else fail('numero de itens', `${demo.DEMO_CHECKLIST.length}`);

if (JSON.stringify(demo.DEMO_CHECKLIST.map((i) => i.title)) === JSON.stringify(TITULOS))
  ok('os nove titulos e a ORDEM batem com o print', '');
else fail('titulos', JSON.stringify(demo.DEMO_CHECKLIST.map((i) => i.title)));

const DESCRICOES = [
  'Pelo menos 1 produto ativo no catálogo.',
  'Pelo menos 1 categoria criada.',
  'Pelo menos 1 produto ativo com estoque > 0.',
  'Pelo menos 1 banner marcado como ativo.',
  'URL ou usuário do Instagram salvo nas configurações.',
  'Número de WhatsApp salvo nas configurações.',
  'Ao menos uma política no rodapé.',
  'Ao menos um método de frete em configurações.',
  'Stripe, Paddle ou outro gateway ativo.',
];
if (JSON.stringify(demo.DEMO_CHECKLIST.map((i) => i.description)) === JSON.stringify(DESCRICOES))
  ok('as nove descricoes batem palavra por palavra', '');
else fail('descricoes', JSON.stringify(demo.DEMO_CHECKLIST.map((i) => i.description)));

/** Todo item comeca em `pending` — a tela nasce cinza e vai pintando. */
if (demo.DEMO_CHECKLIST.every((i) => i.status === 'pending'))
  ok('todos comecam em `pending`', 'nao nascem pintados');
else fail('estado inicial', JSON.stringify(demo.DEMO_CHECKLIST.map((i) => i.status)));

/* ====================== 2. seis verdes, tres vermelhos ====================== */

console.log('\n2. os resultados da captura: SEIS verdes, TRES vermelhos');

const ids = Object.keys(demo.DEMO_OUTCOMES);
const verdes = ids.filter((id) => demo.DEMO_OUTCOMES[id].status === 'ok');
const vermelhos = ids.filter((id) => demo.DEMO_OUTCOMES[id].status === 'fail');

if (verdes.length === 6 && vermelhos.length === 3)
  ok('6 verdes e 3 vermelhos', 'como o print');
else fail('contagem de resultados', `${verdes.length} ok / ${vermelhos.length} fail`);

if (JSON.stringify(vermelhos.sort()) === JSON.stringify(['instagram', 'payment', 'policy']))
  ok('os vermelhos sao Instagram, Politica e Pagamento', 'exatamente os do print');
else fail('quais vermelhos', JSON.stringify(vermelhos));

const DETALHES = {
  products: '9 produto(s) ativo(s)', categories: '6 categoria(s)', stock: '9 produto(s) com estoque',
  banner: '3 banner(s) ativo(s)', instagram: 'Não configurado', whatsapp: '5581998871397',
  policy: '0 política(s)', shipping: '3 método(s)', payment: 'Nenhum gateway ativo',
};
for (const id of ids) {
  if (demo.DEMO_OUTCOMES[id].detail !== DETALHES[id]) fail(`detalhe de ${id}`, demo.DEMO_OUTCOMES[id].detail);
}
if (ids.every((id) => demo.DEMO_OUTCOMES[id].detail === DETALHES[id]))
  ok('os NOVE detalhes batem com o print', 'numeros e frases de "nao configurado"');
else fail('detalhes', '');

/** O WhatsApp e o mesmo da loja em `conteudo`, sem formatacao. */
const conteudoDemo = arquivo('src/lib/conteudo/demo.ts');
if (conteudoDemo.includes("whatsapp: '5581998871397'") &&
    demo.DEMO_OUTCOMES.whatsapp.detail === '5581998871397')
  ok('o WhatsApp bate com o de `conteudo`', 'mesma fonte, sem formatacao');
else fail('whatsapp divergente', demo.DEMO_OUTCOMES.whatsapp.detail);

/* ====================== 3. a contagem e a porcentagem ====================== */

console.log('\n3. `6 de 9` e `67%` — arredondado, nao truncado');

const prontos = demo.DEMO_CHECKLIST.map((i) => ({ ...i, ...demo.DEMO_OUTCOMES[i.id] }));

if (m.okCount(prontos) === 6)
  ok('a contagem da 6', '');
else fail('contagem', `${m.okCount(prontos)}`);

if (m.progressLabel(prontos) === '6 de 9 itens prontos')
  ok('o rotulo e `6 de 9 itens prontos`', 'a frase do print, em caixa alta no CSS');
else fail('rotulo', m.progressLabel(prontos));

/** 6/9 = 66,66… — o print mostra 67, entao e ARREDONDAMENTO. */
if (m.progressPercent(prontos) === 67)
  ok('a porcentagem e 67% (arredondado)', 'truncar daria 66 e nao bateria com o print');
else fail('porcentagem', `${m.progressPercent(prontos)}`);

if (m.progressPercent([]) === 0)
  ok('lista vazia da 0%, sem divisao por zero', '');
else fail('divisao por zero', `${m.progressPercent([])}`);

if (m.isReady(prontos) === false)
  ok('com 6 de 9, a loja NAO esta pronta', '');
else fail('pronto com pendencia', '');

const tudoOk = prontos.map((i) => ({ ...i, status: 'ok' }));
if (m.isReady(tudoOk) === true)
  ok('com 9 de 9, esta pronta', 'nao existe "quase pronto"');
else fail('nao pronto com tudo ok', '');

if (m.readyMessage(prontos) === 'Finalize os itens pendentes antes de abrir.')
  ok('a frase ambar do print', '');
else fail('frase ambar', m.readyMessage(prontos));

if (m.readyMessage(tudoOk) === 'Loja pronta para produção.')
  ok('a frase verde quando tudo OK', '');
else fail('frase verde', m.readyMessage(tudoOk));

/* ====================== 4. os quatro estados do selo ====================== */

console.log('\n4. os quatro estados do selo');

if (m.statusLabel('ok') === 'OK' && m.statusLabel('fail') === 'Pendente' &&
    m.statusLabel('checking') === '...' && m.statusLabel('pending') === '—')
  ok('`OK` · `Pendente` · `...` · `—`', 'os quatro do original');
else fail('rotulos de estado', ['ok','fail','checking','pending'].map(m.statusLabel).join(' · '));

if (m.statusTone('ok') === 'ok' && m.statusTone('fail') === 'fail' &&
    m.statusTone('checking') === 'neutral' && m.statusTone('pending') === 'neutral')
  ok('os tons: verde, vermelho, e neutro nos dois nao-sabidos', '');
else fail('tons', '');

/** O icone de linha so aparece nos dois estados FINAIS. */
if (m.showsRowIcon('ok') && m.showsRowIcon('fail') &&
    !m.showsRowIcon('checking') && !m.showsRowIcon('pending'))
  ok('o icone verde/vermelho so aparece em `ok` e `fail`', 'nos outros nao ha icone');
else fail('icone de linha', '');

/* ====================== 5. a aplicacao do resultado ====================== */

console.log('\n5. aplicar o resultado NAO muta a lista');

const antes = demo.DEMO_CHECKLIST.map((i) => ({ ...i }));
const depois = m.applyOutcome(antes, 'products', { status: 'ok', detail: 'X' });

if (depois !== antes && antes[0].status === 'pending' && depois[0].status === 'ok')
  ok('devolve lista NOVA; a antiga nao muda', 'sem mutacao — o React precisa do array novo');
else fail('mutou a lista', `antes=${antes[0].status} depois=${depois[0].status}`);

if (depois[1].status === 'pending' && depois.length === 9)
  ok('so o item indicado muda; os outros oito ficam', '');
else fail('atingiu outro item', '');

const marcado = m.markChecking(antes, 'instagram');
if (marcado[4].status === 'checking' && marcado[4].detail === undefined)
  ok('`markChecking` limpa o detalhe antigo', 'senao o texto velho fica embaixo do spinner');
else fail('markChecking', JSON.stringify(marcado[4]));

const zerado = m.resetAll(prontos);
if (zerado.every((i) => i.status === 'pending') && zerado.every((i) => i.detail === undefined))
  ok('`resetAll` zera estado E detalhe', 'antes de cada rodada');
else fail('resetAll', '');

/* ====================== 6. o cartao do topo ====================== */

console.log('\n6. o cartao do topo — titulo, botao, barra e aviso');

const c = render(cartao.ChecklistCard, { items: prontos, running: false, onRecheck: () => {} });
const cRodando = render(cartao.ChecklistCard, { items: prontos, running: true, onRecheck: () => {} });

if (textos(c).includes('Abrir Loja — Checklist de Produção'))
  ok('o titulo com o travessao, como o print', '');
else fail('titulo', textos(c).slice(0, 160));

if (textos(c).includes('Verificações reais no banco de dados. Cada item só fica verde quando o dado existe.'))
  ok('o subtitulo que diz que NADA e marcado a mao', '');
else fail('subtitulo', '');

if (textos(c).includes('Revalidar') && textos(c).includes('6 de 9 itens prontos') && textos(c).includes('67%'))
  ok('`Revalidar` · `6 de 9 itens prontos` · `67%`', '');
else fail('cabecalho', textos(c).slice(0, 240));

if (textos(c).includes('Finalize os itens pendentes antes de abrir.'))
  ok('o aviso ambar do print', '');
else fail('aviso ambar', '');

/** A barra e um `role="progressbar"` com os valores certos. */
if (c.includes('role="progressbar"') && c.includes('aria-valuenow="6"') && c.includes('aria-valuemax="9"'))
  ok('a barra anuncia 6 de 9 para o leitor de tela', '');
else fail('progressbar', '');

if (c.includes('width:67%'))
  ok('a barra esta preenchida em 67%', 'o mesmo numero do texto');
else fail('largura da barra', '');

if (c.includes('animate-spin') === false && cRodando.includes('animate-spin'))
  ok('o `RefreshCw` so gira enquanto a verificacao roda', '');
else fail('spinner', '');

/** Enquanto roda, o botao fica desabilitado. */
if (cRodando.includes('disabled'))
  ok('o botao fica desabilitado durante a rodada', 'nao da para disparar duas ao mesmo tempo');
else fail('botao nao desabilita', '');

/* ====================== 7. a lista dos nove ====================== */

console.log('\n7. a lista dos nove itens');

const lst = render(lista.ChecklistList, { items: prontos, onRecheckItem: () => {} });
const tLst = textos(lst);

if (lst.includes('divide-y'))
  ok('a lista e um `divide-y`, nao uma `Table`', 'o print nao tem cabecalho de coluna');
else fail('nao e divide-y', '');

for (const t of TITULOS) {
  if (!tLst.includes(t)) fail('titulo faltando', t);
}
if (TITULOS.every((t) => tLst.includes(t)))
  ok('os nove titulos aparecem na tela', '');
else fail('titulos na tela', '');

if (tLst.includes('6 categoria(s)') && tLst.includes('Nenhum gateway ativo') && tLst.includes('3 método(s)'))
  ok('os detalhes do print aparecem', 'a linha de baixo de cada item');
else fail('detalhes na tela', '');

if (contar(tLst, 'OK') === 6)
  ok('seis selos `OK`', '');
else fail('selos OK', `${contar(tLst, 'OK')}`);

if (contar(tLst, 'Pendente') === 3)
  ok('tres selos `Pendente`', '');
else fail('selos Pendente', `${contar(tLst, 'Pendente')}`);

if (contar(lst, 'aria-label="Revalidar') === 9)
  ok('nove botoes de revalidar, um por item', 'cada um com `aria-label` proprio');
else fail('botoes de revalidar', `${contar(lst, 'aria-label="Revalidar')}`);

/** NENHUMA caixa de marcar — a prova de que nada e marcado a mao. */
if (contar(lst, '<input') === 0 && contar(c, '<input') === 0)
  ok('ZERO caixas de marcar no cartao e na lista', 'o placeholder dizia "marcados manualmente": e falso');
else fail('caixa de marcar', `${contar(lst, '<input')}`);

/** O selo sai em caixa baixa, como o print escreve `OK` e `Pendente`. */
if (contar(lst, 'normal-case tracking-normal') >= 9)
  ok('os nove selos em caixa baixa (`normal-case`)', 'o `Badge` do projeto e versalete');
else fail('selos versalete', `${contar(lst, 'normal-case tracking-normal')}`);

/* ====================== 8. o toast ====================== */

console.log('\n8. o aviso `Checklist atualizado` (adm-089)');

const t = render(toast.ChecklistToast, { message: 'Checklist atualizado' });
if (textos(t).includes('Checklist atualizado'))
  ok('a frase do toast e a do print', '');
else fail('toast', textos(t));

if (t.includes('role="status"') && t.includes('fixed'))
  ok('o toast e `role="status"` e flutua no canto', 'como o print mostra');
else fail('toast posicionado', '');

if (render(toast.ChecklistToast, { message: null }) === '')
  ok('sem mensagem, o toast nao desenha nada', 'nao deixa uma casca vazia');
else fail('toast vazio', render(toast.ChecklistToast, { message: null }));

/* ====================== 9. a tela ====================== */

console.log('\n9. a tela — estado inicial honesto');

const tela = render(AbrirLojaView, {});
const tTela = textos(tela);

if (tTela.includes('Carregando'))
  ok('a tela abre CARREGANDO', 'nao afirma `0 de 0` nem mostra o aviso ambar cedo');
else fail('estado inicial', tTela.slice(0, 200));

if (!tTela.includes('0 de 0') && !tTela.includes('Finalize os itens pendentes'))
  ok('nao afirma nada falso antes da leitura', 'nem contagem zerada, nem "finalize"');
else fail('afirmacao prematura', tTela.slice(0, 200));

if (!tTela.includes('Checklist atualizado'))
  ok('o toast so aparece DEPOIS da rodada', 'nao no primeiro quadro');
else fail('toast prematuro', '');

/* ====================== 10. nada e gravado nem marcado a mao ====================== */

console.log('\n10. o modulo NAO grava, NAO marca a mao e NAO toca o banco');

const fonte = [
  arquivo('src/lib/abrir-loja/types.ts'), arquivo('src/lib/abrir-loja/demo.ts'),
  arquivo('src/lib/abrir-loja/metrics.ts'), arquivo('src/lib/abrir-loja/data.ts'),
  arquivo('src/components/admin/abrir-loja/checklist-card.tsx'),
  arquivo('src/components/admin/abrir-loja/checklist-list.tsx'),
  arquivo('src/components/admin/abrir-loja/checklist-toast.tsx'),
  arquivo('src/components/admin/abrir-loja/abrir-loja-view.tsx'),
  arquivo('src/app/admin/abrir-loja/page.tsx'),
].join('\n');
const codigo = semComentarios(fonte);

if (!/prisma|DATABASE_URL|process\.env/.test(codigo))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', '');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', '');
else fail('supressao de tipo', '');

if (!/\bany\b/.test(codigo))
  ok('nenhum `any` no modulo', 'o original usa `any` na verificacao do Instagram');
else fail('any', (codigo.match(/\bany\b/g) ?? []).length + ' ocorrencia(s)');

if (!/sonner|Toaster|useToast/.test(codigo))
  ok('nenhuma biblioteca de toast', 'o aviso e desenhado na propria tela');
else fail('toast importado', '');

if (!/\b(checkbox|Checkbox)\b/.test(codigo))
  ok('nenhuma caixa de marcar no codigo', 'nao ha marcacao manual');
else fail('checkbox no codigo', '');

/* ====================== 11. a pagina foi trocada ====================== */

console.log('\n11. a pagina e a tela de verdade');

const pagina = arquivo('src/app/admin/abrir-loja/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('AbrirLojaView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', '');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (!paginaLimpa.includes('structure') && !paginaLimpa.includes('references='))
  ok('o `structure` e o `references=` inventados sumiram', '');
else fail('placeholder sobreviveu', '');

if (!/adm-088 e adm-089/.test(paginaLimpa))
  ok('a faixa ERRADA `adm-088 e adm-089` nao aparece', 'Abrir Loja e adm-087 a adm-089');
else fail('faixa errada', '');

/* ====================== 12. provas ao contrario ====================== */

console.log('\n12. provas ao contrario — o defeito tem que REPROVAR');

/** Um item verde a mais mudaria a porcentagem. */
const sete = prontos.map((i) => (i.id === 'policy' ? { ...i, status: 'ok' } : i));
if (m.progressPercent(sete) === 78)
  ok('7 de 9 da 78% (nao 77)', '7/9 = 77,77… arredonda para 78');
else fail('7 de 9', `${m.progressPercent(sete)}`);

/** O rotulo do estado desconhecido NAO pode virar `OK`. */
if (m.statusLabel('checking') !== 'OK' && m.statusLabel('pending') !== 'OK')
  ok('estado desconhecido nunca vira `OK`', '`...` e `—`, nunca verde');
else fail('desconhecido verde', '');

/** O toast NAO pode aparecer com mensagem vazia. */
if (render(toast.ChecklistToast, { message: '' }) === '')
  ok('mensagem VAZIA tambem nao desenha o toast', 'nao so `null`');
else fail('toast com string vazia', '');

/** A contagem de prontos nao pode contar `checking` nem `pending`. */
const meio = m.okCount([{ ...prontos[0], status: 'checking' }, { ...prontos[1], status: 'pending' }]);
if (meio === 0)
  ok('`okCount` nao conta `checking` nem `pending`', 'so `ok` e verde');
else fail('okCount frouxo', `${meio}`);

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
