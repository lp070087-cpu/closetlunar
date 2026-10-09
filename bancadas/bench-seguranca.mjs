/**
 * Bancada do modulo Seguranca & Backup (adm-086).
 *
 * ================== O QUE ELA PROVA ==================
 *
 *   as DEZ linhas de log do print, na ordem, com data e hora formatadas;
 *   o fuso: um instante ISO vira o mesmo dia e hora de Brasilia, sempre;
 *   a ARMADILHA do `-03:00` num ISO sem fuso (data que volta um dia);
 *   o HISTORICO VAZIO e a assimetria dos vazios (log tem frase, backup nao);
 *   os tres cartoes, o selo `Automatico Diario` em caixa baixa e as cores;
 *   os tres desfechos de backup e o `qualquer outra coisa = falha`;
 *   que a tela NAO inventa sessoes ativas, IP nem dispositivo.
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
  console.error('uso: node bench-seguranca.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-seguranca');

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
  /src[\\/](lib[\\/]seguranca|components[\\/]admin[\\/]seguranca|app[\\/]admin[\\/]seguranca)[\\/]/.test(f),
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

const demo = require(join(OUT, 'src/lib/seguranca/demo.js'));
const dados = require(join(OUT, 'src/lib/seguranca/data.js'));
const m = require(join(OUT, 'src/lib/seguranca/metrics.js'));
const cartoes = require(join(OUT, 'src/components/admin/seguranca/security-cards.js'));
const tabelas = require(join(OUT, 'src/components/admin/seguranca/security-tables.js'));
const { SegurancaView } = require(join(OUT, 'src/components/admin/seguranca/seguranca-view.js'));

/* ------------------------------------------------------------- utilidades */

const normalizar = (s) => s.replace(/[\s ]+/g, ' ').trim();
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

/* ====================== 1. as dez linhas do log ====================== */

console.log('\n1. as DEZ linhas de log do print, na ordem');

if (demo.DEMO_AUDIT_LOGS.length === 10)
  ok('sao exatamente DEZ linhas', 'o original pede `LIMIT 10`');
else fail('numero de logs', `${demo.DEMO_AUDIT_LOGS.length}`);

const acoes = demo.DEMO_AUDIT_LOGS.map((l) => l.action);
if (contar(acoes.join('\n'), 'Login de cliente') === 6 &&
    contar(acoes.join('\n'), 'Login administrativo realizado') === 3 &&
    contar(acoes.join('\n'), 'Logout de cliente') === 1)
  ok('a mistura do print: 6 cliente, 3 administrativo, 1 logout', '');
else fail('mistura de acoes', JSON.stringify(acoes));

if (acoes[0] === 'Login de cliente' && acoes[9] === 'Login administrativo realizado')
  ok('a PRIMEIRA e a ULTIMA linha sao as do print', 'mais recente primeiro');
else fail('ordem', `${acoes[0]} … ${acoes[9]}`);

if (!acoes.some((a) => /excluir|alterar|editar|criar|deletar/i.test(a)))
  ok('nenhuma acao de ESCRITA no log', 'o print so registra entrada e saida');
else fail('acao inventada', JSON.stringify(acoes.filter((a) => /excluir|alterar|editar|criar|deletar/i.test(a))));

/* ====================== 2. o fuso ====================== */

console.log('\n2. a data: o fuso e CALCULADO, nao herdado da maquina');

if (m.formatDateTimeBR('2026-09-27T23:26:00-03:00') === '27/09/2026, 23:26:00')
  ok('`23:26:00-03:00` sai `27/09/2026, 23:26:00`', 'igual ao print');
else fail('formatacao', m.formatDateTimeBR('2026-09-27T23:26:00-03:00'));

if (m.formatDateTimeBR('2026-09-27T22:56:50-03:00') === '27/09/2026, 22:56:50')
  ok('a ultima linha tambem bate', '');
else fail('ultima linha', m.formatDateTimeBR('2026-09-27T22:56:50-03:00'));

/** A ARMADILHA: um ISO SEM fuso e lido como meia-noite UTC e o dia volta. */
if (m.formatDateTimeBR('2026-09-27') === '26/09/2026, 21:00:00')
  ok('ISO SEM fuso recua para o dia ANTERIOR as 21h', 'meia-noite UTC menos 3 horas');
else fail('meia-noite UTC', m.formatDateTimeBR('2026-09-27'));

/** E dois instantes iguais escritos de duas formas dao o mesmo texto. */
if (m.formatDateTimeBR('2026-09-27T23:26:00-03:00') === m.formatDateTimeBR('2026-09-28T02:26:00Z'))
  ok('o mesmo instante escrito de duas formas da o MESMO texto', '');
else fail('instante equivalente', m.formatDateTimeBR('2026-09-28T02:26:00Z'));

if (m.formatDateTimeBR('nao e data') === '')
  ok('texto invalido devolve vazio', 'nao `Invalid Date` na tela');
else fail('invalido', m.formatDateTimeBR('nao e data'));

if (m.formatDateBR('2026-09-27T23:26:00-03:00') === '27/09/2026')
  ok('`formatDateBR` da so a data', 'é o que o historico usa');
else fail('formatDateBR', m.formatDateBR('2026-09-27T23:26:00-03:00'));

/* ====================== 3. o historico VAZIO ====================== */

console.log('\n3. o historico de backups esta VAZIO — como o print');

if (demo.DEMO_BACKUPS.length === 0)
  ok('nenhum backup na demonstracao', 'o print mostra a tabela so com o cabecalho');
else fail('backups na demo', `${demo.DEMO_BACKUPS.length}`);

const leituraBackups = await dados.listBackups();
if (leituraBackups.data.length === 0 && leituraBackups.source === 'demo')
  ok('`listBackups` devolve vazio, marcado como demo', '');
else fail('leitura de backups', JSON.stringify(leituraBackups.source));

if (m.lastBackupValue([], 'Pendente') === 'Pendente')
  ok('sem backup, o cartao diz `Pendente`', 'nao uma data inventada');
else fail('ultimo backup vazio', m.lastBackupValue([], 'Pendente'));

const comUm = [{ id: 'b1', type: 'automatico', status: 'completed', createdAt: '2026-09-27T10:00:00-03:00' }];
if (m.lastBackupValue(comUm, 'Pendente') === '27/09/2026')
  ok('com um backup, o cartao mostra a DATA dele', 'e nao `Pendente`');
else fail('ultimo backup com um', m.lastBackupValue(comUm, 'Pendente'));

/** A ASSIMETRIA: o log tem frase de vazio, o backup NAO tem. */
if (m.AUDIT_EMPTY_TEXT === 'Nenhum log registrado')
  ok('o vazio do log tem frase', 'a do original');
else fail('frase do log', m.AUDIT_EMPTY_TEXT);

/* ====================== 4. os tres desfechos de backup ====================== */

console.log('\n4. os tres desfechos e o `qualquer outra coisa = falha`');

if (m.backupTone('completed') === 'success' && m.backupStatusLabel('completed') === 'Sucesso')
  ok('`completed` = Sucesso', '');
else fail('completed', m.backupStatusLabel('completed'));

if (m.backupTone('pending') === 'pending' && m.backupStatusLabel('pending') === 'Pendente')
  ok('`pending` = Pendente', '');
else fail('pending', m.backupStatusLabel('pending'));

if (m.backupTone('failed') === 'failure' && m.backupStatusLabel('failed') === 'Falha')
  ok('`failed` = Falha', '');
else fail('failed', m.backupStatusLabel('failed'));

if (m.backupTone('qualquer_coisa') === 'failure' && m.backupTone('') === 'failure')
  ok('status DESCONHECIDO tambem vira Falha', 'nao existe quarto estado nem "sucesso por omissao"');
else fail('desconhecido', m.backupTone('qualquer_coisa'));

if (m.backupTypeLabel('automatico') === 'Automatico' && m.backupTypeLabel('manual') === 'Manual')
  ok('o tipo e capitalizado', '`automatico` → `Automatico`');
else fail('tipo', m.backupTypeLabel('automatico'));

if (m.loginAttemptsValue(5) === '5 Limite' && m.loginAttemptsValue(1) === '1 Limite')
  ok('`5 Limite` — numero e palavra colados', 'a palavra nao muda no singular');
else fail('limite', m.loginAttemptsValue(5));

/* ====================== 5. os tres cartoes ====================== */

console.log('\n5. os tres cartoes do topo');

const c1 = render(cartoes.SystemStatusCard, {});
const c2 = render(cartoes.LoginAttemptsCard, { limit: 5 });
const c3 = render(cartoes.LastBackupCard, { value: 'Pendente', badge: 'Automático Diário' });

if (textos(c1).includes('Status do Sistema') && textos(c1).includes('Protegido') &&
    textos(c1).includes('Monitoramento ativo em tempo real'))
  ok('cartao 1: `Status do Sistema` / `Protegido` / a dica', '');
else fail('cartao 1', textos(c1));

if (textos(c2).includes('Tentativas de Login') && textos(c2).includes('5 Limite') &&
    textos(c2).includes('Bloqueio automático após o limite'))
  ok('cartao 2: `Tentativas de Login` / `5 Limite` / a dica', '');
else fail('cartao 2', textos(c2));

if (textos(c3).includes('Último Backup') && textos(c3).includes('Pendente') &&
    textos(c3).includes('Automático Diário'))
  ok('cartao 3: `Último Backup` / `Pendente` / o selo', '');
else fail('cartao 3', textos(c3));

/** O selo sai em CAIXA BAIXA — o `Badge` do projeto e versalete por padrao. */
if (c3.includes('normal-case') && textos(c3).includes('Automático Diário'))
  ok('o selo esta em caixa baixa (`normal-case`)', 'o `Badge` do projeto sai versalete');
else fail('selo versalete', '');

/** NAO e o `StatCard`: nao tem o quadrado de 48px do projeto. */
if (!c1.includes('size-12') && !c2.includes('size-12') && !c3.includes('size-12'))
  ok('nao usou o `StatCard` (sem quadrado `size-12`)', 'o print tem icone pequeno e solto');
else fail('quadrado do StatCard', '');

if (contar(c1, 'size-4') === 1 && !c1.includes('size-5'))
  ok('o icone e pequeno (`size-4`, sem fundo)', '');
else fail('tamanho do icone', '');

/** As cores dos tres icones, como o print: verde, azul, roxo. */
if (c1.includes('text-success') && c2.includes('#3B82F6') && c3.includes('#A855F7'))
  ok('as cores dos icones: verde, azul e roxo', 'cores do print, nao tons de estado');
else fail('cores', [c1.includes('text-success'), c2.includes('#3B82F6'), c3.includes('#A855F7')].join(','));

/* ====================== 6. as duas tabelas ====================== */

console.log('\n6. as duas tabelas, lado a lado');

const logs = demo.DEMO_AUDIT_LOGS.map((l) => ({ ...l }));
const tLog = render(tabelas.AuditLogsCard, { logs });
const tLogV = render(tabelas.AuditLogsCard, { logs: [] });
const tBkpV = render(tabelas.BackupHistoryCard, { backups: [] });

if (textos(tLog).includes('Logs de Auditoria Recentes') &&
    textos(tLog).includes('Monitoramento de ações administrativas e acessos'))
  ok('tabela do log: titulo e descricao', '');
else fail('titulo do log', textos(tLog).slice(0, 160));

if (textos(tLog).includes('Ação') && textos(tLog).includes('Data/Hora'))
  ok('as duas colunas: `Ação` e `Data/Hora`', '');
else fail('colunas do log', '');

if (textos(tLog).includes('27/09/2026, 23:26:00') && textos(tLog).includes('27/09/2026, 22:56:50'))
  ok('a primeira e a ultima data aparecem formatadas', 'a tabela chama `formatDateTimeBR`');
else fail('datas na tabela', '');

if (contar(tLog, '<tr') === 11)
  ok('11 linhas de tabela = 1 cabecalho + 10 registros', '');
else fail('linhas', `${contar(tLog, '<tr')}`);

if (textos(tLogV).includes('Nenhum log registrado'))
  ok('log VAZIO mostra `Nenhum log registrado`', 'a frase do original');
else fail('vazio do log', textos(tLogV).slice(0, 200));

/**
 * O DEFEITO QUE A BANCADA PEGOU: sem `loading`, a tabela mostrava a frase do
 * vazio ANTES de a leitura responder. Aqui a mesma lista vazia, mas AINDA
 * carregando, tem que ficar CALADA.
 */
const tLogCarregando = render(tabelas.AuditLogsCard, { logs: [], loading: true });
if (textos(tLogCarregando).includes('Nenhum log registrado'))
  fail('frase do vazio aparece durante o carregamento', textos(tLogCarregando).slice(0, 160));
else
  ok('log vazio MAS carregando nao afirma "nenhum log"', 'distinguir "nao chegou" de "nao tem"');

if (textos(tBkpV).includes('Histórico de Backups') &&
    textos(tBkpV).includes('Registro de salvamentos automáticos e manuais') &&
    textos(tBkpV).includes('Tipo') && textos(tBkpV).includes('Status') && textos(tBkpV).includes('Data'))
  ok('tabela do backup: titulo, descricao e as TRES colunas', '');
else fail('cabecalho do backup', textos(tBkpV).slice(0, 200));

/** A ASSIMETRIA medida: o backup vazio NAO tem frase nenhuma. */
if (!/Nenhum|Sem |nenhum|vazio/i.test(textos(tBkpV)))
  ok('backup VAZIO nao mostra frase nenhuma', 'nem o print nem o original tem — nao e esquecimento');
else fail('frase inventada no backup vazio', textos(tBkpV).slice(0, 200));

if (contar(tBkpV, '<tr') === 1)
  ok('backup vazio: so a linha do cabecalho', '');
else fail('linhas do backup vazio', `${contar(tBkpV, '<tr')}`);

/** Com um backup de verdade, os tres desfechos desenham. */
const tBkpSucesso = render(tabelas.BackupHistoryCard, {
  backups: [{ id: 'b1', type: 'manual', status: 'completed', createdAt: '2026-09-27T10:00:00-03:00' }],
});
if (textos(tBkpSucesso).includes('Sucesso') && textos(tBkpSucesso).includes('27/09/2026') &&
    textos(tBkpSucesso).includes('Manual'))
  ok('um backup `completed` desenha tipo, selo e data', '');
else fail('backup com linha', textos(tBkpSucesso));

/* ====================== 7. a tela ====================== */

console.log('\n7. a tela — cabecalho, botao e estado inicial');

const tela = render(SegurancaView, {});
const tTela = textos(tela);

if (tTela.includes('Segurança e Backup'))
  ok('o titulo `Segurança e Backup` — com `e`, nao `&`', 'e como o print escreve');
else fail('titulo da tela', tTela.slice(0, 160));

if (tTela.includes('Executar Backup Agora'))
  ok('o botao `Executar Backup Agora`', '');
else fail('botao', tTela.slice(0, 200));

if (contar(tela, '<button') === 1)
  ok('ha UM botao — o original nao tem nenhum outro', '');
else fail('botoes', `${contar(tela, '<button')}`);

if (tTela.includes('Automático Diário') && tTela.includes('5 Limite') && tTela.includes('Protegido'))
  ok('os cartoes 1 e 2 e o SELO FIXO do terceiro aparecem', 'o selo e tela, nao dado');
else fail('cartoes na tela', tTela.slice(0, 300));

/**
 * O estado do ULTIMO BACKUP nao pode sair antes da leitura: um `Pendente` as
 * cegas seria uma afirmacao sobre um dado que ainda nao chegou. Antes da
 * resposta, o terceiro cartao mostra um traco.
 */
if (tTela.includes('Último Backup') && !tTela.includes('Pendente'))
  ok('antes da leitura, o `Ultimo Backup` mostra traco, nao `Pendente`', 'nao afirma o que nao sabe');
else fail('ultimo backup prematuro', tTela.slice(0, 300));

if (!tTela.includes('Nenhum log registrado'))
  ok('a tela NAO mostra `Nenhum log registrado` no estado inicial', 'o `useEffect` ainda nao rodou');
else fail('estado inicial', tTela.slice(0, 200));

/** O aviso do backup so nasce no clique — nao no primeiro render. */
if (!tela.includes('role="status"'))
  ok('nenhum aviso antes do clique', 'o aviso do backup nasce so ao apertar o botao');
else fail('aviso prematuro', '');

/* ====================== 8. o que NAO foi inventado ====================== */

console.log('\n8. o que o placeholder prometia e o print nao mostra');

const fonte = [
  arquivo('src/lib/seguranca/types.ts'), arquivo('src/lib/seguranca/demo.ts'),
  arquivo('src/lib/seguranca/metrics.ts'), arquivo('src/lib/seguranca/data.ts'),
  arquivo('src/components/admin/seguranca/security-cards.tsx'),
  arquivo('src/components/admin/seguranca/security-tables.tsx'),
  arquivo('src/components/admin/seguranca/seguranca-view.tsx'),
  arquivo('src/app/admin/seguranca/page.tsx'),
].join('\n');
const codigo = semComentarios(fonte);

if (!/sess(õ|o)es ativas|session_id|user_agent|dispositivo|encerramento remoto|ip\b|ipAddress/i.test(codigo))
  ok('nada de sessoes ativas, IP, dispositivo ou user-agent', 'o placeholder prometia; o print nao mostra');
else fail('campo inventado', (codigo.match(/sess(õ|o)es ativas|session_id|user_agent|dispositivo|ipAddress/gi) ?? []).join(', '));

if (!/from\s+['"]@\/lib\/security/.test(fonte) && !/triggerBackup/.test(codigo))
  ok('o `triggerBackup` do original nao foi copiado', 'o pedido de backup e local e honesto');
else fail('triggerBackup copiado', '');

if (!/prisma|DATABASE_URL|process\.env/.test(codigo))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', '');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', '');
else fail('supressao de tipo', '');

if (!/\bany\b/.test(codigo))
  ok('nenhum `any` no modulo', 'o original usa `any` em toda parte');
else fail('any', (codigo.match(/\bany\b/g) ?? []).length + ' ocorrencia(s)');

/* ====================== 9. a pagina foi trocada ====================== */

console.log('\n9. a pagina e a tela de verdade');

const pagina = arquivo('src/app/admin/seguranca/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('SegurancaView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', '');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (!paginaLimpa.includes('structure') && !paginaLimpa.includes('references='))
  ok('o `structure` e o `references=` inventados sumiram', '');
else fail('placeholder sobreviveu', '');

if (!/adm-087/.test(paginaLimpa))
  ok('a faixa ERRADA `adm-087` nao aparece', 'Seguranca e adm-086; adm-087 e Abrir Loja');
else fail('faixa errada', '');

/* ====================== 10. provas ao contrario ====================== */

console.log('\n10. provas ao contrario — o defeito tem que REPROVAR');

/** Um status desconhecido NAO pode virar sucesso. */
if (m.backupTone('error') === 'failure' && m.backupTone('ERROR') === 'failure')
  ok('status desconhecido nunca e sucesso', 'nem em caixa alta');
else fail('desconhecido virou sucesso', '');

/** O formato de data NAO pode depender do fuso da maquina. */
const antesDoTeste = process.env.TZ;
process.env.TZ = 'UTC';
const emUTC = m.formatDateTimeBR('2026-09-27T23:26:00-03:00');
process.env.TZ = 'Asia/Tokyo';
const emToquio = m.formatDateTimeBR('2026-09-27T23:26:00-03:00');
process.env.TZ = antesDoTeste;
if (emUTC === emToquio && emUTC === '27/09/2026, 23:26:00')
  ok('o mesmo texto em UTC e em Toquio', 'a maquina nao decide o horario');
else fail('o fuso da maquina vazou', `${emUTC} != ${emToquio}`);

/** O aviso do backup NAO pode sair antes do clique — ja provado no item 7. */
const telaLimpa = semComentarios(arquivo('src/components/admin/seguranca/seguranca-view.tsx'));
if (/setAviso\(resultado\.reason\)/.test(telaLimpa) && /role="status"/.test(telaLimpa))
  ok('o aviso e preenchido pelo RESULTADO da chamada, nao por texto fixo', '');
else fail('aviso fixo', '');

if (!/sucesso/i.test(telaLimpa))
  ok('a tela nao promete "sucesso" em texto nenhum', 'o original prometia');
else fail('promessa de sucesso', '');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
