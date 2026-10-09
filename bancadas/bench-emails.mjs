/**
 * Bancada do modulo E-mails (adm-072 e adm-073).
 *
 * ================== O QUE ELA PROVA ==================
 *
 *   os SEIS modelos do print, com titulo, assunto e emoji, na ORDEM;
 *   a identidade: `Closet Lunar`, `#FF4D8D`, `Rodape Customizado: Sim`, a nota;
 *   o `Envios Recentes` VAZIO, com o texto do print;
 *   a data `Atualizado em 10/06/2026` — e, na secao 5, POR QUE ela nao passa pelo
 *     `Date` (a prova ao contrario que mostra o dia voltando um atras);
 *   o editor, que NAO esta em print nenhum e por isso vem do ORIGINAL;
 *   que editar um modelo nao muta os outros nem a lista;
 *   que a pagina deixou de ser `ModulePage` e o `structure` inventado sumiu.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Layout, cor renderizada, posicao, responsividade, `useEffect` e clique.
 *
 * A bancada NAO type-checa — so executa (ver o cabecalho da secao de transpilacao).
 * O portao de TIPOS e o `npm run typecheck` do projeto.
 */

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-emails.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-emails');

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
  /src[\\/](lib[\\/]emails|components[\\/]admin[\\/]emails|app[\\/]admin[\\/]emails)[\\/]/.test(f),
);

/* ---- o FECHO DE DEPENDENCIAS: so o que o modulo puxa (ver bench-whatsapp) ---- */
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

/**
 * TRANSPILA SO O FECHO — nao type-checa. `transpileModule` apaga os tipos e
 * devolve CommonJS; o portao de tipos e o `npm run typecheck`.
 */
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

const demo = require(join(OUT, 'src/lib/emails/demo.js'));
const dados = require(join(OUT, 'src/lib/emails/data.js'));
const metricas = require(join(OUT, 'src/lib/emails/metrics.js'));
const { TemplateList } = require(join(OUT, 'src/components/admin/emails/template-list.js'));
const { TemplateEditor } = require(join(OUT, 'src/components/admin/emails/template-editor.js'));
const { IdentityPanel } = require(join(OUT, 'src/components/admin/emails/identity-panel.js'));
const { EmailsView } = require(join(OUT, 'src/components/admin/emails/emails-view.js'));

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

/* ====================== 1. os seis modelos ====================== */

console.log('\n1. os SEIS modelos do print, na ordem');

const leitura = await dados.listTemplates();
const modelos = leitura.data;

const TITULOS = ['Cart Recovery', 'Order Delivered', 'Order Received', 'Order Shipped', 'Payment Approved', 'Welcome'];
if (mesmo(modelos.map((m) => m.title), TITULOS))
  ok('os SEIS titulos, na ordem do print', TITULOS.join(' · '));
else fail('titulos/modelos', JSON.stringify(modelos.map((m) => m.title)));

if (modelos.length === 6)
  ok('exatamente SEIS modelos', 'nem mais (o `Disparo` inventado), nem menos');
else fail('contagem', `${modelos.length}`);

/** Cada titulo e escrito por extenso — nao e `name.replace('_',' ')`. */
if (modelos.every((m) => !m.title.includes('_')))
  ok('nenhum titulo tem `_` sobrando', 'o `capitalize` do original deixaria o sublinhado no meio');
else fail('titulo com underscore', JSON.stringify(modelos.map((m) => m.title)));

/* ====================== 2. os assuntos e os emojis ====================== */

console.log('\n2. os assuntos, com os emojis do print');

const ASSUNTOS = [
  'Esqueceu algo lindo no carrinho? 🛒',
  'Pedido Entregue! Esperamos que ame! ❤️',
  'Recebemos seu pedido #{{order_number}})! ✨',
  'Seu pedido foi enviado! 📦',
  'Pagamento Aprovado! Seu look está chegando! 🎉',
  'Bem-vinda à Closet Lunar! 💖',
];
if (mesmo(modelos.map((m) => m.subject), ASSUNTOS))
  ok('os SEIS assuntos na integra, com emoji', 'inclusive o `#{{order_number}})` do Order Received');
else fail('assuntos', JSON.stringify(modelos.map((m) => m.subject)));

if (modelos.find((m) => m.id === 'order_received').subject.includes('#{{order_number}})'))
  ok('o assunto do Order Received tem a variavel `{{order_number}}`', 'e o parentese extra, como no print');
else fail('variavel do Order Received', '');

/** Os emojis NAO foram trocados por imagem nem por texto ASCII. */
if (modelos.every((m) => /\p{Extended_Pictographic}/u.test(m.subject)))
  ok('cada assunto tem um emoji de verdade', 'o print mostra emoji, nao um icone do lucide');
else fail('emoji ausente', JSON.stringify(modelos.map((m) => m.subject)));

/* ====================== 3. o ativo e a data ====================== */

console.log('\n3. `Ativo`, a data e a identidade');

if (modelos.every((m) => m.active === true))
  ok('os SEIS estao `Ativo`', 'e o que o print mostra nos seis cards');
else fail('ativo', JSON.stringify(modelos.map((m) => m.active)));

if (modelos.every((m) => m.updatedAt === '2026-06-10'))
  ok('os SEIS com `Atualizado em 10/06/2026`', 'a mesma data em todos, como o print');
else fail('updatedAt', JSON.stringify(modelos.map((m) => m.updatedAt)));

if (metricas.templateStatusLabel(true) === 'Ativo' && metricas.templateStatusLabel(false) === 'Inativo')
  ok('o rotulo do badge e `Ativo` / `Inativo`', '');
else fail('rotulo de badge', metricas.templateStatusLabel(true));

if (metricas.updatedLabel('2026-06-10') === 'Atualizado em 10/06/2026')
  ok('`updatedLabel` monta a frase do print', '`Atualizado em 10/06/2026`');
else fail('updatedLabel', metricas.updatedLabel('2026-06-10'));

/** A IDENTIDADE — o painel escuro. */
const identidade = (await dados.getIdentity()).data;
if (identidade.brandName === 'Closet Lunar' && identidade.primaryColor === '#FF4D8D' &&
    identidade.customFooter === true)
  ok('a identidade do print', '`Closet Lunar`, `#FF4D8D`, rodape `Sim`');
else fail('identidade', JSON.stringify(identidade));

if (identidade.note.startsWith('Todos os e-mails seguem o padrão premium da marca'))
  ok('a nota em italico e a do print', '`Todos os e-mails seguem o padrão premium da marca...`');
else fail('nota', identidade.note);

/**
 * ================== A COR NAO E `#FF4080` ==================
 *
 * Uma leitura ANTERIOR desta tela anotou `#FF4080`. A ampliacao mostra `#FF4D8D`.
 * A prova recusa o valor velho: se ele voltar, isto reprova.
 */
if (identidade.primaryColor !== '#FF4080' && identidade.primaryColor === '#FF4D8D')
  ok('a cor e `#FF4D8D`, nao a leitura antiga `#FF4080`', 'o `#FF4080` era artefato de ClearType no texto pequeno');
else fail('cor principal', identidade.primaryColor);

/* ====================== 4. os envios recentes ====================== */

console.log('\n4. o `Envios Recentes` — VAZIO, como o print');

const logs = (await dados.listEmailLogs()).data;
if (Array.isArray(logs) && logs.length === 0)
  ok('`listEmailLogs` devolve lista VAZIA', 'o print tem `Nenhum e-mail enviado recentemente.`');
else fail('logs', JSON.stringify(logs));

if (demo.DEMO_EMAIL_LOGS.length === 0)
  ok('a demo nao inventa envios', 'criar historico falso de e-mails que ninguem recebeu seria pior que o vazio');
else fail('demo de logs', `${demo.DEMO_EMAIL_LOGS.length}`);

/* ====================== 5. a data — a prova ao contrario ====================== */

console.log('\n5. por que a data NAO passa pelo `Date`');

if (metricas.formatUpdatedAt('2026-06-10') === '10/06/2026')
  ok('`formatUpdatedAt` devolve `10/06/2026`', 'lido por fatia, sem `Date`');
else fail('formatUpdatedAt', metricas.formatUpdatedAt('2026-06-10'));

/**
 * ================== O DEFEITO QUE A FUNCAO EVITA ==================
 *
 * `new Date('2026-06-10')` e meia-noite UTC — 21h do dia 09/06 em BRT. Se a data
 * fosse formatada por `Date`, o card mostraria `09/06/2026`, um dia ATRAS. A prova
 * exige que o caminho `Date` de fato erre (senao nao haveria o que evitar) e que a
 * funcao de fatia acerte.
 */
const viaDate = new Date('2026-06-10').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
if (viaDate === '09/06/2026' && metricas.formatUpdatedAt('2026-06-10') === '10/06/2026')
  ok('o caminho `Date` erra (`09/06`), o da fatia acerta (`10/06`)', 'e por isso a funcao nao usa `Date`');
else fail('prova da armadilha', `viaDate=${viaDate}`);

if (metricas.formatUpdatedAt('10/06/2026') === '—' && metricas.formatUpdatedAt('') === '—')
  ok('data fora do formato `AAAA-MM-DD` vira `—`', 'nunca `Invalid Date` na tela');
else fail('data invalida', metricas.formatUpdatedAt('10/06/2026'));

/* ====================== 6. a tela montada ====================== */

console.log('\n6. `EmailsView` — o cabecalho, a lista e a identidade');

const tela = render(EmailsView, {});
const textoTela = textos(tela);

if (textoTela.includes('E-mails Transacionais') &&
    textoTela.includes('Gerencie a comunicação automática da Closet Lunar'))
  ok('o cabecalho do print tem titulo e descricao', '');
else fail('cabecalho', textoTela.slice(0, 200));

if (textoTela.includes('Servidor de E-mail: Ativo'))
  ok('a pilula `Servidor de E-mail: Ativo` esta la', 'o `action` do `SectionHeader`');
else fail('pilula do servidor', textoTela.slice(0, 200));

if (textoTela.includes('Carregando e-mails...') && !textoTela.includes('Nenhum e-mail enviado'))
  ok('a tela abre em CARREGAMENTO', '`useEffect` nao roda no `renderToStaticMarkup`');
else fail('estado inicial', textoTela.slice(0, 200));

/** A lista e a identidade montadas com o dado real. */
const lista = render(TemplateList, { templates: modelos, onEdit: () => {}, editingId: null });
const painel = render(IdentityPanel, { identity: identidade, logs: [] });
const textoLista = textos(lista);
const textoPainel = textos(painel);

if (TITULOS.every((t) => textoLista.includes(t)))
  ok('os SEIS titulos desenham na lista', '');
else fail('titulos na lista', textoLista.slice(0, 200));

if (contar(textoLista, 'Atualizado em 10/06/2026') === 6)
  ok('`Atualizado em 10/06/2026` aparece SEIS vezes', 'uma por card — a data certa em todos');
else fail('datas na lista', `${contar(textoLista, 'Atualizado em 10/06/2026')}`);

if (contar(textoLista, 'Ativo') === 6)
  ok('o badge `Ativo` aparece SEIS vezes', '');
else fail('badges', `${contar(textoLista, 'Ativo')}`);

if (ASSUNTOS.every((a) => textoLista.includes(a)))
  ok('os SEIS assuntos, com emoji, desenham', '');
else fail('assuntos na lista', textoLista.slice(0, 240));

/** O botao da paleta, um por card. */
if (contar(lista, 'aria-label="Editar o modelo') === 6)
  ok('um botao de editar por card, com rotulo de acessibilidade', 'seis cards, seis botoes');
else fail('botoes de editar', `${contar(lista, 'aria-label="Editar o modelo')}`);

if (textoPainel.includes('Identidade Visual') && textoPainel.includes('Logo da Marca') &&
    textoPainel.includes('Closet Lunar') && textoPainel.includes('Cor Principal') &&
    textoPainel.includes('#FF4D8D') && textoPainel.includes('Rodapé Customizado') &&
    textoPainel.includes('Sim'))
  ok('o painel escuro tem as tres linhas do print', 'Logo · Cor · Rodape, com os valores');
else fail('painel de identidade', textoPainel.slice(0, 240));

if (textoPainel.includes('Envios Recentes') && textoPainel.includes('Nenhum e-mail enviado recentemente.'))
  ok('`Envios Recentes` com o vazio do print', '');
else fail('envios recentes', textoPainel.slice(0, 200));

/** A bolinha da cor usa a cor da IDENTIDADE, nao uma classe fixa. */
if (painel.includes('#FF4D8D') && /background-color:\s*#FF4D8D/i.test(painel))
  ok('a bolinha da cor sai do dado da identidade', '`style` inline com o hex — nao `bg-accent`');
else fail('bolinha da cor', '');

/* ====================== 7. o editor ====================== */

console.log('\n7. o editor — que NAO esta em print nenhum, e vem do original');

const editor = render(TemplateEditor, {
  template: modelos[0],
  onChange: () => {},
  onCancel: () => {},
  onSave: () => {},
  saving: false,
  aviso: null,
});
const textoEditor = textos(editor);

if (textoEditor.includes('Editando Template: Cart Recovery'))
  ok('o editor diz qual modelo esta editando', '');
else fail('cabecalho do editor', textoEditor.slice(0, 200));

if (textoEditor.includes('Assunto do E-mail') && textoEditor.includes('Corpo HTML') &&
    textoEditor.includes('Template Ativado'))
  ok('os tres campos do original', 'Assunto · Corpo HTML · Template Ativado');
else fail('campos do editor', textoEditor.slice(0, 240));

if (textoEditor.includes('Cancelar') && textoEditor.includes('Salvar Alterações'))
  ok('os dois botoes do original', '');
else fail('botoes do editor', textoEditor.slice(-200));

if (editor.includes('value="Esqueceu algo lindo no carrinho? 🛒"'))
  ok('o assunto chega ao VALOR do campo', 'o valor de um `input` e atributo — `textos()` o apagaria');
else fail('valor do assunto', '');

if (/\bchecked\b/.test(editor.replace(/checked=""/g, 'checked=""')))
  ok('o checkbox `Template Ativado` sai marcado', 'o modelo esta `active: true`');
else fail('checkbox', '');

/** O AVISO de salvamento aparece quando existe — e se cala quando nao. */
const comAviso = render(TemplateEditor, {
  template: modelos[0], onChange: () => {}, onCancel: () => {}, onSave: () => {},
  saving: false, aviso: 'O template não foi gravado: o banco (Neon) ainda não está conectado.',
});
if (textos(comAviso).includes('não foi gravado') && !textoEditor.includes('não foi gravado'))
  ok('o aviso aparece quando existe', 'a tela diz que nao gravou, em vez de fingir sucesso');
else fail('aviso', textos(comAviso).slice(-160));

/* ====================== 8. editar um nao muta os outros ====================== */

console.log('\n8. `applyTemplateEdit` — editar um modelo, sem tocar nos outros');

const copia = modelos.map((m) => ({ ...m }));
const editada = metricas.applyTemplateEdit(copia, 'welcome', { subject: 'Novo assunto', active: false });

if (editada.find((m) => m.id === 'welcome').subject === 'Novo assunto' &&
    editada.find((m) => m.id === 'welcome').active === false)
  ok('o modelo editado muda', 'assunto e ativo');
else fail('edicao', JSON.stringify(editada.find((m) => m.id === 'welcome')));

if (editada.filter((m) => m.id !== 'welcome').every((m, i) => mesmo(m, copia[i])) &&
    !Object.is(editada, copia))
  ok('os OUTROS cinco ficam intactos, e sai uma lista NOVA', 'nenhum irmao mutado');
else fail('mutacao de irmaos', '');

if (copia.find((m) => m.id === 'welcome').subject === 'Bem-vinda à Closet Lunar! 💖')
  ok('a lista de ENTRADA nao e mutada', 'a funcao copia antes de editar');
else fail('entrada mutada', '');

/** A demo tem que sobreviver a uma edicao — a leitura ja devolve copia. */
const daLeitura = (await dados.listTemplates()).data;
metricas.applyTemplateEdit(daLeitura, 'welcome', { subject: 'X' });
if (demo.DEMO_EMAIL_TEMPLATES.find((m) => m.id === 'welcome').subject === 'Bem-vinda à Closet Lunar! 💖')
  ok('a demonstracao global nao e tocada por uma edicao', '');
else fail('demo mutada', '');

/* ====================== 9. a escrita e a rota ====================== */

console.log('\n9. a escrita nao finge gravar, e a pagina foi trocada');

const escrita = await dados.saveTemplate(modelos[0]);
if (escrita.persisted === false && typeof escrita.reason === 'string' && escrita.reason.length > 0)
  ok('`saveTemplate` devolve `persisted: false` com motivo', 'nao finge um "Template atualizado!"');
else fail('escrita', JSON.stringify(escrita));

const pagina = arquivo('src/app/admin/emails/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('EmailsView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', '');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (!paginaLimpa.includes('structure'))
  ok('o array `structure` inventado sumiu', '');
else fail('`structure` sobreviveu', '');

if (pagina.includes('adm-072 e adm-073'))
  ok('a faixa `adm-072 e adm-073` esta documentada', 'aqui a conjuncao "e" estava CERTA — sao dois prints, nao uma faixa');
else fail('faixa de prints', 'a correcao nao esta documentada');

const fonte = [
  arquivo('src/lib/emails/types.ts'), arquivo('src/lib/emails/demo.ts'),
  arquivo('src/lib/emails/metrics.ts'), arquivo('src/lib/emails/data.ts'),
  arquivo('src/components/admin/emails/template-list.tsx'),
  arquivo('src/components/admin/emails/template-editor.tsx'),
  arquivo('src/components/admin/emails/identity-panel.tsx'),
  arquivo('src/components/admin/emails/emails-view.tsx'), pagina,
].join('\n');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonte)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', '');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', '');
else fail('supressao de tipo', '');

/* ====================== 10. provas ao contrario ====================== */

console.log('\n10. provas ao contrario — o defeito tem que REPROVAR');

/** Uma lista com UM modelo nao pode dizer "seis". */
const umSo = render(TemplateList, { templates: [modelos[0]], onEdit: () => {}, editingId: null });
if (contar(textos(umSo), 'Atualizado em 10/06/2026') === 1 && !textos(umSo).includes('Welcome'))
  ok('um modelo desenha UM card', 'a lista nao inventa os outros cinco');
else fail('lista de um', '');

/** O vazio `Envios Recentes` NAO desenha linha de log. */
if (contar(painel, 'truncate text-xs font-bold') === 0)
  ok('o vazio nao desenha nenhuma linha de envio', 'sem log, so a mensagem');
else fail('linha fantasma', '');

/** `formatUpdatedAt` de uma data real nao vira `—`. */
if (metricas.formatUpdatedAt('2026-01-01') === '01/01/2026')
  ok('a virada de ano nao quebra a fatia', '`2026-01-01` -> `01/01/2026`');
else fail('virada de ano', metricas.formatUpdatedAt('2026-01-01'));

/** `textos()` apaga atributos — por isso o valor do assunto se le no cru. */
if (!textos('<input value="x" />').includes('x') && editor.includes('value="Esqueceu'))
  ok('`textos` apaga ATRIBUTOS', 'por isso o `value` do assunto se le no HTML cru');
else fail('`textos`', '');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
