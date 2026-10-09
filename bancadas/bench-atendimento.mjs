/**
 * Bancada do modulo Atendimento (adm-074).
 *
 * ================== O QUE ELA PROVA ==================
 *
 *   o cabecalho do print (`Atendimento` / `Tickets e mensagens recebidas dos clientes.`);
 *   os QUATRO indicadores com os valores do print — todos ZERO;
 *   a faixa de pilulas `Todos (0) · Abertos (0) · Em andamento (0) · Finalizados (0)`;
 *   o VAZIO do print: `Nenhum atendimento recebido ainda.`;
 *   que a demo e `[]` de proposito — o print esta vazio;
 *   o mapeamento do status CRU para o BALDE (`aguardando_cliente` e `progress`);
 *   as contagens por balde e que `all` e a SOMA das partes;
 *   a linha, o badge por balde, o corte da mensagem e a data;
 *   o modal: mensagem inteira, data, e o `select` com valor CRU e rotulo PT;
 *   que a escrita nao grava e que trocar o status NAO muta a lista de entrada;
 *   que a pagina deixou de ser `ModulePage` e o `structure` inventado sumiu.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Layout, cor renderizada, posicao, responsividade, animacao, `useEffect` e clique.
 *
 * A bancada NAO type-checa — so executa. O portao de TIPOS e o `npm run typecheck`.
 */

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-atendimento.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-atendimento');

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
  /src[\\/](lib[\\/]atendimento|components[\\/]admin[\\/]atendimento|app[\\/]admin[\\/]atendimento)[\\/]/.test(f),
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

/** TRANSPILA SO O FECHO — nao type-checa. O portao de tipos e o `npm run typecheck`. */
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

const demo = require(join(OUT, 'src/lib/atendimento/demo.js'));
const dados = require(join(OUT, 'src/lib/atendimento/data.js'));
const metricas = require(join(OUT, 'src/lib/atendimento/metrics.js'));
const { AtendimentoView } = require(join(OUT, 'src/components/admin/atendimento/atendimento-view.js'));
const { AtendimentoStats, AtendimentoFilterTabs } = require(join(OUT, 'src/components/admin/atendimento/atendimento-tabs.js'));
const { TicketsList } = require(join(OUT, 'src/components/admin/atendimento/tickets-list.js'));
const { TicketRow } = require(join(OUT, 'src/components/admin/atendimento/ticket-row.js'));
const { TicketModal } = require(join(OUT, 'src/components/admin/atendimento/ticket-modal.js'));

/* ------------------------------------------------------------- utilidades */

const normalizar = (s) => s.replace(/[\s  ]+/g, ' ').trim();
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
/** Le um ATRIBUTO do HTML CRU — `textos()` apaga atributos. */
function atributoDe(html, nome) {
  const achou = new RegExp(`${nome}="([^"]*)"`).exec(html);
  return achou ? achou[1] : null;
}
/** Um ticket de teste. Construido AQUI — a demo do produto fica vazia. */
const ticket = (id, status, extra = {}) => ({
  id,
  customerName: `Cliente ${id}`,
  phone: '(81) 99999-0000',
  message: 'Ola, gostaria de saber sobre a entrega do meu pedido.',
  status,
  createdAt: '2026-10-01T14:32:00',
  ...extra,
});
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

/* ====================== 1. a demo e vazia — o print e vazio ====================== */

console.log('\n1. a demonstracao e VAZIA, como o print');

if (Array.isArray(demo.DEMO_TICKETS) && demo.DEMO_TICKETS.length === 0)
  ok('`DEMO_TICKETS` e `[]`', 'o print mostra `Nenhum atendimento recebido ainda.`');
else fail('demo', `${demo.DEMO_TICKETS.length} ticket(s)`);

const leitura = await dados.listTickets();
if (mesmo(leitura.data, []) && leitura.source === 'demo')
  ok('`listTickets` devolve lista vazia, marcada como demo', '');
else fail('listTickets', JSON.stringify(leitura));

/* ====================== 2. o mapeamento do status ====================== */

console.log('\n2. o status CRU vira BALDE — e o `aguardando_cliente` nao se perde');

if (metricas.bucketOf('novo') === 'open' && metricas.bucketOf('em_atendimento') === 'progress' &&
    metricas.bucketOf('aguardando_cliente') === 'progress' && metricas.bucketOf('finalizado') === 'done')
  ok('os quatro status crus caem no balde certo', '`aguardando_cliente` = `progress`, como no original');
else fail('mapeamento', JSON.stringify(['novo','em_atendimento','aguardando_cliente','finalizado'].map(metricas.bucketOf)));

/** Um status DESCONHECIDO nao pode sumir da conta — senao `all` deixa de fechar. */
if (metricas.bucketOf('status_que_nao_existe') === 'open')
  ok('status desconhecido cai em `open`', 'nao some da soma — `all` continua fechando');
else fail('status desconhecido', metricas.bucketOf('status_que_nao_existe'));

const rotulos = { open: 'Aberto', progress: 'Em andamento', done: 'Finalizado' };
if (metricas.bucketLabel('open') === rotulos.open && metricas.bucketLabel('progress') === rotulos.progress &&
    metricas.bucketLabel('done') === rotulos.done)
  ok('os tres rotulos do badge', 'Aberto · Em andamento · Finalizado');
else fail('rotulos', JSON.stringify(['open','progress','done'].map(metricas.bucketLabel)));

/* ====================== 3. as contagens e o `all` que fecha ====================== */

console.log('\n3. as contagens do print — e `all` e a SOMA das partes');

const lista = [
  ticket('a', 'novo'),
  ticket('b', 'em_atendimento'),
  ticket('c', 'aguardando_cliente'),
  ticket('d', 'finalizado'),
  ticket('e', 'finalizado'),
];
const contagens = metricas.countTickets(lista);

if (contagens.all === 5 && contagens.open === 1 && contagens.progress === 2 && contagens.done === 2)
  ok('total 5 · abertos 1 · em andamento 2 · finalizados 2', 'os dois `aguardando_cliente` entram em andamento');
else fail('contagens', JSON.stringify(contagens));

if (contagens.open + contagens.progress + contagens.done === contagens.all)
  ok('`all` e a SOMA dos tres baldes', 'a tela nunca mostra numero que nao fecha');
else fail('soma', `${contagens.open + contagens.progress + contagens.done} != ${contagens.all}`);

if (mesmo(metricas.countTickets([]), { all: 0, open: 0, progress: 0, done: 0 }))
  ok('a lista vazia da ZERO nos quatro', 'e o estado do print');
else fail('contagens do vazio', JSON.stringify(metricas.countTickets([])));

/* ====================== 4. o filtro das pilulas ====================== */

console.log('\n4. o filtro das pilulas');

if (metricas.filterTickets(lista, 'all').length === 5)
  ok('`all` devolve a lista inteira', '');
else fail('filtro all', '');

if (mesmo(metricas.filterTickets(lista, 'done').map((t) => t.id), ['d', 'e']))
  ok('`done` devolve so os finalizados', 'na ordem da lista');
else fail('filtro done', JSON.stringify(metricas.filterTickets(lista, 'done').map((t) => t.id)));

if (metricas.filterTickets(lista, 'progress').length === 2)
  ok('`progress` junta `em_atendimento` e `aguardando_cliente`', '');
else fail('filtro progress', '');

/* ====================== 5. a view NAO monta antes da leitura ====================== */

console.log('\n5. a tela montada — o cabecalho, os indicadores e o vazio do print');

const tela = render(AtendimentoView, {});
const textoTela = textos(tela);

if (textoTela.includes('Atendimento') && textoTela.includes('Tickets e mensagens recebidas dos clientes.'))
  ok('o cabecalho do print', 'titulo e descricao');
else fail('cabecalho', textoTela.slice(0, 200));

/** `useEffect` nao roda aqui: a tela sai no estado de CARREGAMENTO. */
if (textoTela.includes('Carregando...') && !textoTela.includes('Nenhum atendimento recebido ainda.'))
  ok('a tela abre em CARREGAMENTO', '`useEffect` nao roda no `renderToStaticMarkup`');
else fail('estado inicial', textoTela.slice(0, 200));

/** Os quatro indicadores NAO dependem da leitura: saem zerados. */
if (textoTela.includes('Total') && textoTela.includes('Abertos') &&
    textoTela.includes('Em andamento') && textoTela.includes('Finalizados'))
  ok('os QUATRO titulos dos indicadores', 'Total · Abertos · Em andamento · Finalizados');
else fail('titulos dos indicadores', textoTela.slice(0, 240));

/**
 * Os quatro `0` se contam no HTML CRU, nao no texto: `textos()` apaga as tags, e
 * sem elas `>0<` nao existe mais — o `0` vira ` 0 ` cercado de espaco e qualquer
 * contagem daria zero. E a mesma armadilha do `value` de `input`.
 */
const quatroZeros = contar(tela, '>0</span>');
if (quatroZeros >= 4)
  ok('os quatro valores sao `0`', 'o print mostra zero em todos');
else fail('valores dos indicadores', `${quatroZeros}`);

if (textoTela.includes('Todos') && textoTela.includes('(0)'))
  ok('a faixa de pilulas esta la, com contador', '');
else fail('pilulas', textoTela.slice(0, 240));

/* ====================== 6. a caixa da fila nos TRES estados ====================== */

console.log('\n6. a caixa da fila — vazia, carregando e com linhas');

const vazia = render(TicketsList, { tickets: [], loading: false, onOpen: () => {} });
if (textos(vazia).includes('Nenhum atendimento recebido ainda.'))
  ok('VAZIA: a frase exata do print', '');
else fail('vazio', textos(vazia).slice(0, 160));

const carregando = render(TicketsList, { tickets: [], loading: true, onOpen: () => {} });
if (textos(carregando).includes('Carregando...') && !textos(carregando).includes('Nenhum atendimento'))
  ok('CARREGANDO: nao mostra a frase do vazio', 'os dois estados nao se confundem');
else fail('carregando', textos(carregando).slice(0, 160));

const cheia = render(TicketsList, { tickets: lista, loading: false, onOpen: () => {} });
if (contar(cheia, 'Ver detalhes') === 5)
  ok('COM LINHAS: um botao `Ver detalhes` por atendimento', 'cinco linhas, cinco botoes');
else fail('botoes na lista', `${contar(cheia, 'Ver detalhes')}`);

if (!textos(cheia).includes('Nenhum atendimento recebido ainda.'))
  ok('COM LINHAS: a frase do vazio SOME', 'a caixa nao mistura os dois estados');
else fail('vazio fantasma', '');

/* ====================== 7. a linha — badge, corte e data ====================== */

console.log('\n7. a linha de um atendimento');

const linhaFinalizado = render(TicketRow, { ticket: ticket('x', 'finalizado'), onOpen: () => {} });
const tFinalizado = textos(linhaFinalizado);
if (tFinalizado.includes('Finalizado') && linhaFinalizado.includes('bg-green-100 text-green-700'))
  ok('o badge de `finalizado` e verde com o texto `Finalizado`', '')
else fail('badge finalizado', tFinalizado.slice(0, 160));

const linhaAberto = render(TicketRow, { ticket: ticket('y', 'novo'), onOpen: () => {} });
if (linhaAberto.includes('bg-blue-100 text-blue-700') && textos(linhaAberto).includes('Aberto'))
  ok('o badge de `novo` e azul com o texto `Aberto`', 'azul nao existe nos tons do `Badge` — classe crua, como no CRM');
else fail('badge aberto', '');

const linhaAndamento = render(TicketRow, { ticket: ticket('z', 'aguardando_cliente'), onOpen: () => {} });
if (linhaAndamento.includes('bg-orange-100 text-orange-700') && textos(linhaAndamento).includes('Em andamento'))
  ok('`aguardando_cliente` desenha `Em andamento` em laranja', 'o valor cru nao vaza para a tela');
else fail('badge aguardando', '');

/** O telefone vazio vira `—`; e o corte da mensagem mora no dado, nao no CSS. */
const semTelefone = render(TicketRow, { ticket: ticket('w', 'novo', { phone: '' }), onOpen: () => {} });
if (textos(semTelefone).includes('—'))
  ok('telefone vazio vira `—`', 'como no original');
else fail('telefone vazio', textos(semTelefone).slice(0, 160));

const longa = 'A'.repeat(120);
const cortada = render(TicketRow, { ticket: ticket('v', 'novo', { message: longa }), onOpen: () => {} });
if (textos(cortada).includes('A'.repeat(80)) && !textos(cortada).includes('A'.repeat(81)))
  ok('a mensagem e cortada em 80 caracteres NA LINHA', 'o corte e dado, nao CSS — `line-clamp` mediria o pixel');
else fail('corte da mensagem', '');

const semAssunto = render(TicketRow, { ticket: ticket('u', 'novo', { message: '   ' }), onOpen: () => {} });
if (textos(semAssunto).includes('Sem assunto'))
  ok('mensagem em branco vira `Sem assunto`', '');
else fail('sem assunto', '');

/** A data sai por FATIA — o dia nao volta um atras. */
if (textos(linhaAberto).includes('01/10/2026 14:32'))
  ok('a data sai `01/10/2026 14:32`', 'lida por fatia do ISO');
else fail('data da linha', textos(linhaAberto).slice(0, 200));

/* ====================== 8. o modal ====================== */

console.log('\n8. o detalhe — mensagem inteira, data e o `select` de status');

const aberto = render(TicketModal, {
  ticket: ticket('m', 'novo', { message: 'Mensagem\ncom quebra de linha.' }),
  onClose: () => {},
  onStatusChange: () => {},
  aviso: null,
});
const textoAberto = textos(aberto);

if (textoAberto.includes('Mensagem') && textoAberto.includes('Recebido em') && textoAberto.includes('Status'))
  ok('os tres blocos do original', 'Mensagem · Recebido em · Status');
else fail('blocos do modal', textoAberto.slice(0, 240));

/** O modal mostra a mensagem INTEIRA — quem corta e a linha, nao ele. */
if (textoAberto.includes('Mensagem com quebra de linha.'))
  ok('a mensagem inteira aparece no modal', 'quem corta em 80 e a linha da lista');
else fail('mensagem no modal', textoAberto.slice(0, 240));

if (textoAberto.includes('01/10/2026 14:32'))
  ok('a data aparece no modal', '');
else fail('data no modal', '');

/** O `select`: rotulo em PT e VALOR CRU no `option` — o banco guarda o cru. */
if (/<option[^>]*value="novo"[^>]*>Aberto<\/option>/.test(aberto) &&
    /<option[^>]*value="em_atendimento"[^>]*>Em andamento<\/option>/.test(aberto) &&
    /<option[^>]*value="finalizado"[^>]*>Finalizado<\/option>/.test(aberto))
  ok('os tres `option` com rotulo PT e valor CRU', 'o banco guarda `novo`, nao `Aberto`');
else fail('options do select', '');

if (atributoDe(aberto, 'value') === 'novo' || /<select[^>]*value="novo"/.test(aberto))
  ok('o `select` sai com o status atual', 'o valor de um `select` e atributo/propriedade, nao texto');
else fail('valor do select', '');

/** O aviso aparece quando a escrita nao grava — e se cala quando nao houve escrita. */
const comAviso = render(TicketModal, {
  ticket: ticket('m', 'novo'),
  onClose: () => {}, onStatusChange: () => {},
  aviso: 'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.',
});
if (textos(comAviso).includes('Persistência ainda não conectada') && !textoAberto.includes('Persistência ainda não'))
  ok('o aviso da escrita aparece so quando existe', 'a tela avisa em vez de fingir que gravou');
else fail('aviso do modal', '');

/* ====================== 9. a escrita e a troca de status ====================== */

console.log('\n9. a escrita nao finge gravar, e trocar status nao muta a entrada');

const escrita = await dados.updateTicketStatus('a', 'finalizado');
if (escrita.persisted === false && typeof escrita.reason === 'string' && escrita.reason.length > 0 &&
    escrita.data.id === 'a' && escrita.data.status === 'finalizado')
  ok('`updateTicketStatus` devolve `persisted: false` com motivo', 'nao finge um "Status atualizado."');
else fail('escrita', JSON.stringify(escrita));

const entrada = [ticket('a', 'novo'), ticket('b', 'finalizado')];
const trocada = metricas.applyStatusChange(entrada, 'a', 'finalizado');

if (trocada.find((t) => t.id === 'a').status === 'finalizado' &&
    trocada.find((t) => t.id === 'b').status === 'finalizado')
  ok('o ticket pedido muda de status', '');
else fail('troca', JSON.stringify(trocada.map((t) => t.status)));

if (entrada[0].status === 'novo' && !Object.is(trocada, entrada))
  ok('a lista de ENTRADA nao e mutada, e sai uma lista NOVA', '`map` copia antes de trocar');
else fail('entrada mutada', '');

/** A demo do modulo sobrevive a uma troca — a leitura ja devolve copia. */
metricas.applyStatusChange(demo.DEMO_TICKETS, 'a', 'finalizado');
if (demo.DEMO_TICKETS.length === 0)
  ok('a demonstracao global nao e tocada', 'segue vazia depois de uma troca');
else fail('demo mutada', `${demo.DEMO_TICKETS.length}`);

/* ====================== 10. a pagina foi trocada ====================== */

console.log('\n10. a pagina e a tela de verdade, e o que NAO foi inventado');

const pagina = arquivo('src/app/admin/atendimento/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('AtendimentoView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', '');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (!paginaLimpa.includes('structure') && !paginaLimpa.includes('references='))
  ok('o `structure` e o `references=` inventados sumiram', '');
else fail('placeholder sobreviveu', '');

const fonte = [
  arquivo('src/lib/atendimento/types.ts'), arquivo('src/lib/atendimento/demo.ts'),
  arquivo('src/lib/atendimento/metrics.ts'), arquivo('src/lib/atendimento/data.ts'),
  arquivo('src/components/admin/atendimento/atendimento-tabs.tsx'),
  arquivo('src/components/admin/atendimento/tickets-list.tsx'),
  arquivo('src/components/admin/atendimento/ticket-row.tsx'),
  arquivo('src/components/admin/atendimento/ticket-modal.tsx'),
  arquivo('src/components/admin/atendimento/atendimento-view.tsx'), pagina,
].join('\n');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonte)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', '');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', '');
else fail('supressao de tipo', '');

/**
 * Os campos que o placeholder prometia e o print NAO mostra nao existem — e a
 * prova tem de ser feita sobre o CODIGO SEM COMENTARIOS. `semComentarios()` existe
 * para isso: quem escreve a decisao "nao inventamos `canal`" escreve a palavra
 * `canal`, e medir o arquivo cru acusaria a propria nota. E o falso positivo ja
 * registrado na memoria da bancada.
 */
const codigo = semComentarios(fonte);
if (!/\bcanal\b|\bresponsável\b|\btempo de espera\b/i.test(codigo))
  ok('nada de `canal`, `responsável` ou `tempo de espera`', 'o placeholder prometia; o print nao mostra — nao inventado');
else fail('campo inventado', '');

/* ====================== 11. provas ao contrario ====================== */

console.log('\n11. provas ao contrario — o defeito tem que REPROVAR');

/** Um balde desconhecido NAO pode virar `done` nem `progress`. */
if (metricas.bucketOf('') === 'open' && metricas.bucketOf('FINALIZADO') === 'open')
  ok('texto vazio e caixa alta NAO entram em `done`', 'so o literal exato conta');
else fail('mapeamento frouxo', '');

/** O corte nao pode sumir: 81 caracteres nao podem passar inteiros. */
if (metricas.excerpt('B'.repeat(81)) === 'B'.repeat(80) && metricas.excerpt('B'.repeat(80)) === 'B'.repeat(80))
  ok('o corte em 80 vale no limite exato', '80 passa, 81 corta');
else fail('corte no limite', metricas.excerpt('B'.repeat(81)).length);

/** Uma data malformada nao pode virar `undefined/undefined`. */
if (metricas.formatReceivedAt('ontem') === '—' && metricas.formatReceivedAt('') === '—')
  ok('data fora do ISO vira `—`', 'nunca `undefined/NaN`');
else fail('data invalida', metricas.formatReceivedAt('ontem'));

/** `textos()` apaga ATRIBUTOS — por isso o `value` do select se le no cru. */
if (!textos(aberto).includes('value="novo"') && aberto.includes('value="novo"'))
  ok('`textos` apaga o atributo `value`', 'por isso o select se le no HTML cru');
else fail('textos nao apaga atributos', '');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
