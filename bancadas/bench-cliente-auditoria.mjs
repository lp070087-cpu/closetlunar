/**
 * Auditoria final da FASE 2 — o Painel do Cliente (modulos 1 a 13).
 *
 * ================== O QUE ESTA BANCADA E, E O QUE ELA NAO E ==================
 *
 * Ela NAO e uma soma das outras doze. Cada bancada de modulo prova UMA tela
 * contra a referencia dela; esta prova o CONJUNTO — as propriedades que so
 * existem quando as treze estao no disco juntas. Tres delas nao tem como ser
 * vistas modulo a modulo:
 *
 *   1. O FECHAMENTO DAS ROTAS. Todo destino declarado existe, e nenhuma rota
 *      existe que ninguem declare. Um modulo isolado so prova a propria rota.
 *
 *   2. A ORIGEM UNICA DOS DADOS. Quatro dominios entram na area (`pedidos`,
 *      `afiliadas`, `utils`, `access`) e nenhuma tela de admin. So faz sentido
 *      olhar isso com a area inteira montada.
 *
 *   3. A AUSENCIA DE CREDENCIAL. Uma varredura por padrao de segredo sobre a
 *      arvore inteira — e nao sobre um arquivo.
 *
 * ================== A REGRA DE HONESTIDADE VALE PARA O INSTRUMENTO ==================
 *
 * A bancada mede nao o que o autor queria, mas o que esta no disco. Onde ha
 * divergencia entre a lista de rotas e o disco, quem manda e o disco: a lista
 * `ESPERADO` abaixo foi escrita com os dez caminhos CONTADOS em `find`, e a
 * bancada confere os dois lados. Se alguem apagar uma rota, ela acusa; se alguem
 * acrescentar uma rota que ninguem declara, ela tambem acusa.
 *
 * ================== O QUE ELA NAO PODE PROVAR ==================
 *
 * **Nao ha prova de pixel aqui.** As medidas estao nas bancadas de modulo, cada
 * uma contra o print dela. Esta bancada nao abre imagem nenhuma.
 *
 * **Nao ha prova de banco.** Nenhuma tela le banco nesta fase — e uma das provas
 * e justamente a AUSENCIA. O `source: 'demo'` de toda leitura e o contrato que a
 * Fase 4 vai trocar, e ele esta provado modulo a modulo.
 *
 * Uso: node bancadas/bench-cliente-auditoria.mjs <pasta do projeto>
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-auditoria.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-auditoria');
const RAIZ_CONTA = join(SRC, 'app', '(cliente)', 'conta');

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

/* ------------------------------------------------- as raizes da area */

const arquivos = [];
(function varrer(dir) {
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) varrer(caminho);
    else if (/\.tsx?$/.test(caminho)) arquivos.push(caminho);
  }
})(SRC);

const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]cliente|components[\\/]cliente|app[\\/]\(cliente\))[\\/]/.test(f),
);

if (raizes.length === 0) {
  fail('nenhuma raiz da area', 'a area da cliente nao esta no disco');
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
  ok('emissao sem erro', `${raizes.length} raizes da area da cliente`);
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
const modulo = require('node:module');
const carregarOriginal = modulo._load;
modulo._load = function (pedido, pai, ehPrincipal) {
  if (pedido.startsWith('@/')) return carregarOriginal.call(this, join(OUT, 'src', pedido.slice(2)), pai, ehPrincipal);
  return carregarOriginal.call(this, pedido, pai, ehPrincipal);
};

const nav = require(join(OUT, 'src/lib/cliente/nav.js'));
const dados = require(join(OUT, 'src/lib/cliente/data.js'));

/* -------------------------------------------------------- utilidades */

function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}
const ler = (f) => readFileSync(f, 'utf8');
/** Le um arquivo da area pelo caminho relativo ao projeto, para a prova de texto. */
const area = (rel) => ler(join(PROJ, rel));

/* ================= 1. o fechamento das rotas ================= */

console.log('\n1. o fechamento das rotas — cada destino declarado, e so os declarados');

/*
  O ESPERADO foi escrito com os caminhos CONTADOS em disco (find), e nao com a
  lista de `nav.ts` — foi essa a unica forma de a prova pegar uma rota que existe
  sem que ninguem a declare, e nao so o contrario.
*/
const ESPERADO = [
  'conta',
  'conta/pedidos',
  'conta/favoritos',
  'conta/enderecos',
  'conta/medidas',
  'conta/pontos',
  'conta/cupons',
  'conta/dados',
  'conta/seguranca',
  'conta/afiliada',
];

/** A rota de uma pagina, no formato do `ESPERADO`. */
function rotaDe(pageTsx) {
  const rel = pageTsx.slice(join(SRC, 'app', '(cliente)').length + 1).replace(/[\\/]page\.tsx$/, '');
  return rel.split(/[\\/]/).join('/');
}
function paginasDe(dir, acc = []) {
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) paginasDe(caminho, acc);
    else if (entrada === 'page.tsx') acc.push(caminho);
  }
  return acc;
}

const noDisco = paginasDe(RAIZ_CONTA).map(rotaDe).sort();
const esperadoOrdenado = [...ESPERADO].sort();

if (JSON.stringify(noDisco) === JSON.stringify(esperadoOrdenado))
  ok('as rotas do disco sao EXATAMENTE as dez esperadas', `${noDisco.length} rotas`);
else {
  const faltando = esperadoOrdenado.filter((r) => !noDisco.includes(r));
  const sobrando = noDisco.filter((r) => !esperadoOrdenado.includes(r));
  fail('o fechamento das rotas', `faltando=[${faltando.join(', ')}] sobrando=[${sobrando.join(', ')}]`);
}

/*
  TODO item da coluna de navegacao resolve numa rota que existe. Esta e a prova
  que torna o `clientHref` util: se ele montasse um caminho errado, o item daria
  404 e ninguem veria no typecheck.
*/
const destinosNav = nav.NAV_ITEMS.map((i) => nav.clientHref(i.slug));
const navQuebrados = destinosNav.filter((h) => !noDisco.includes(h.replace(/^\//, '')));
if (navQuebrados.length === 0)
  ok(`os ${nav.NAV_ITEMS.length} itens da coluna resolvem em rota existente`, destinosNav.join(' '));
else fail('item da coluna sem rota', navQuebrados.join(', '));

/*
  E os atalhos do dashboard — que sao OUTRA lista (ver a divergencia 2). O
  `Afiliada` e um atalho e nao um item de coluna, entao ele SO aparece aqui: se a
  prova checasse so a coluna, a rota `/conta/afiliada` ficaria sem cobertura.
*/
const destinosAtalho = nav.CONTA_ATALHOS.map((a) => a.href);
const atalhosQuebrados = destinosAtalho.filter((h) => !noDisco.includes(h.replace(/^\//, '')));
if (atalhosQuebrados.length === 0)
  ok(`os ${nav.CONTA_ATALHOS.length} atalhos resolvem em rota existente`, destinosAtalho.join(' '));
else fail('atalho sem rota', atalhosQuebrados.join(', '));

/*
  E o CAMINHO DE VOLTA: toda rota do disco e alcançavel por alguem. Um rota sem
  entrada e uma tela orfa — existe, renderiza e ninguem chega.
*/
const alcancaveis = new Set([...destinosNav, ...destinosAtalho].map((h) => h.replace(/^\//, '')));
const orfas = noDisco.filter((r) => !alcancaveis.has(r));
if (orfas.length === 0)
  ok('nenhuma rota esta orfa', 'as dez sao alcancaveis pela coluna ou pelos atalhos');
else fail('rota orfa', orfas.join(', '));

/*
  A rota `/conta/afiliada` e ALCANCAVEL e NAO ESTA NA COLUNA — a divergencia 2
  do material, provada em vez de afirmada. Se alguem a promovesse a item de
  coluna, esta prova acusaria a mudanca.
*/
const afiliadaNaColuna = nav.NAV_ITEMS.some((i) => nav.clientHref(i.slug) === '/conta/afiliada');
const afiliadaNoAtalho = nav.CONTA_ATALHOS.some((a) => a.href === '/conta/afiliada');
if (!afiliadaNaColuna && afiliadaNoAtalho)
  ok('`/conta/afiliada` e atalho e NAO item de coluna', 'a divergencia 2, provada');
else fail('`Afiliada` mudou de lista', `coluna=${afiliadaNaColuna} atalho=${afiliadaNoAtalho}`);

/* ================= 2. a origem unica dos dados ================= */

console.log('\n2. a origem unica — quatro dominios, e nenhuma tela de admin');

const importacoes = raizes.flatMap((f) =>
  [...semComentarios(ler(f)).matchAll(/from\s+'(@\/[^']+)'/g)].map((m) => ({ arquivo: f, de: m[1] })),
);

/*
  Nenhum arquivo da area importa uma tela de admin. `components/admin` e
  `lib/<dominio>` sao coisas diferentes: o primeiro e INTERFACE, o segundo e
  DADO compartilhado. A area da cliente usa o segundo e nunca o primeiro.
*/
const deAdmin = importacoes.filter((i) => /^@\/(components|app)\/admin/.test(i.de));
if (deAdmin.length === 0)
  ok('nenhuma tela de admin e importada', 'a area da cliente redesenha, e nao reaproveita layout do admin');
else fail('a area importa tela de admin', deAdmin.map((i) => i.de).join(', '));

/*
  A direcao das dependencias de DOMINIO. Quatro entram, e as quatro sao dominio
  puro (sem JSX, sem React): sao os registros compartilhados, e nao componentes.
*/
const dominios = [...new Set(importacoes.map((i) => i.de))]
  .filter((d) => !d.startsWith('@/(components|lib)/cliente') && !d.startsWith('@/components/cliente'))
  .filter((d) => !d.startsWith('@/lib/cliente'))
  .sort();

const DOMINIOS_ESPERADOS = ['@/components/ui/stat', '@/lib/access', '@/lib/afiliadas/demo', '@/lib/afiliadas/metrics', '@/lib/afiliadas/types', '@/lib/pedidos/demo', '@/lib/pedidos/metrics', '@/lib/pedidos/types', '@/lib/utils'];
const dominiosForaDoEsperado = dominios.filter((d) => !DOMINIOS_ESPERADOS.includes(d));
const dominiosFaltando = DOMINIOS_ESPERADOS.filter((d) => !dominios.includes(d));

if (dominiosForaDoEsperado.length === 0 && dominiosFaltando.length === 0)
  ok('as dependencias de fora da area sao as nove declaradas', dominios.length + ' modulos');
else
  fail('as dependencias mudaram',
    `novas=[${dominiosForaDoEsperado.join(', ')}] faltando=[${dominiosFaltando.join(', ')}]`);

/*
  As tres importacoes de dominio COMPARTILHADO — a prova de "os mesmos
  registros". Sao a unica ponte entre os dois paineis, e ela e de mao unica: a
  area da cliente LE, o admin NAO le nada da area da cliente.
*/
const ponte = ['@/lib/pedidos/demo', '@/lib/pedidos/types', '@/lib/afiliadas/demo', '@/lib/afiliadas/types'];
for (const alvo of ponte) {
  const quem = importacoes.filter((i) => i.de === alvo).map((i) => i.arquivo.split(/[\\/]/).pop());
  if (quem.length > 0) ok(`a area le de \`${alvo}\``, quem.join(', '));
  else fail(`a area deixou de ler \`${alvo}\``, 'a ponte com o admin caiu');
}

/*
  E a mao de volta NAO existe: nenhum arquivo de admin importa de
  `lib/cliente`. Se existisse, as duas areas dependeriam uma da outra.
*/
const adminPuxandoCliente = arquivos
  .filter((f) => /src[\\/](lib[\\/]admin|components[\\/]admin|app[\\/]admin)[\\/]/.test(f))
  .filter((f) => /@[\\/]lib[\\/]cliente/.test(semComentarios(ler(f))));
if (adminPuxandoCliente.length === 0)
  ok('o admin NAO importa nada de `lib/cliente`', 'a dependencia e de mao unica');
else fail('o admin importa da area da cliente', adminPuxandoCliente.map((f) => f.split(/[\\/]/).pop()).join(', '));

/* ================= 3. a fronteira do banco ================= */

console.log('\n3. a fronteira do banco — nada le dados reais ainda');

/*
  Nenhum cliente de banco na area. Esta e a prova que sustenta a REGRA DE
  HONESTIDADE: se nenhuma tela fala com o Neon, nenhuma pode afirmar dado real.
  A agulha e o NOME DA DEPENDENCIA, e nao a palavra em prosa — `data.ts` EXPLICA
  tres vezes que o original usava `supabase`, e uma varredura crua acusaria a
  propria explicacao (o defeito de `bancada-comentario-vira-falso-positivo`).
*/
const clientesDeBanco = /(?:from|require\()\s*['"](@prisma\/client|@neondatabase\/serverless|drizzle-orm|pg|postgres|mysql2|better-sqlite3|supabase[^'"]*)['"]/;
const comBanco = raizes.filter((f) => clientesDeBanco.test(semComentarios(ler(f))));
if (comBanco.length === 0)
  ok('nenhuma raiz importa cliente de banco', 'a area inteira le de `data.ts`');
else fail('a area importa cliente de banco', comBanco.map((f) => f.split(/[\\/]/).pop()).join(', '));

/*
  Sem `process.env` na area — nem para segredo, nem para nada. Um `env` lido numa
  tela e a porta por onde um token chega perto do cliente.
*/
const comEnv = raizes.filter((f) => /process\.env/.test(semComentarios(ler(f))));
if (comEnv.length === 0)
  ok('nenhuma raiz le `process.env`', 'nenhuma credencial chega perto da interface');
else fail('a area le `process.env`', comEnv.map((f) => f.split(/[\\/]/).pop()).join(', '));

/*
  E a varredura por PADRAO de segredo, na area inteira. O padrao do JWT
  (`eyJ...`) e o que pegaria uma chave colada por engano; o da URL do Postgres
  pegaria uma string de conexao. Nenhum dos dois pode existir aqui.
*/
const padroes = [
  [/sk_live_[A-Za-z0-9]/, 'chave secreta de gateway'],
  [/sk_test_[A-Za-z0-9]/, 'chave de teste de gateway'],
  [/eyJ[A-Za-z0-9_-]{20,}/, 'token JWT'],
  [/postgres(?:ql)?:\/\/[^\s'"]/, 'string de conexao'],
  [/(?:DATABASE_URL|DIRECT_URL)\s*[:=]/, 'nome de variavel de conexao'],
  [/re_[A-Za-z0-9]{16,}/, 'chave de e-mail'],
];
const comSegredo = [];
for (const f of raizes) {
  const codigo = semComentarios(ler(f));
  for (const [re, o_que] of padroes) if (re.test(codigo)) comSegredo.push(`${f.split(/[\\/]/).pop()} (${o_que})`);
}
if (comSegredo.length === 0)
  ok('nenhum dos seis padroes de segredo aparece em codigo', 'varredura sobre a area inteira');
else fail('padrao de segredo encontrado', comSegredo.join(', '));

/* ================= 4. o contrato das leituras ================= */

console.log('\n4. o contrato das leituras — `demo` e sempre com motivo');

/*
  As leituras exportadas de `data.ts`. Se uma delas deixar de existir, algum
  modulo perdeu a fonte e a contagem abaixo acusa.
*/
const LEITURAS = [
  'getConta', 'getResumo', 'listPedidos', 'listFavoritos', 'listEnderecos',
  'getPerfilMedidas', 'listHistoricoMedidas', 'getClube', 'listCupons',
  'getAcesso', 'getAfiliada',
];
const ausentes = LEITURAS.filter((n) => typeof dados[n] !== 'function');
if (ausentes.length === 0)
  ok(`as ${LEITURAS.length} leituras da area estao exportadas`, LEITURAS.join(', '));
else fail('leitura ausente de `data.ts`', ausentes.join(', '));

/*
  TODAS devolvem `source: 'demo'` com o motivo pendente — uma por uma, chamadas
  de verdade. A prova nao le o codigo: ela AGUARDA a promessa. Uma leitura que
  devolvesse `source: 'database'` estaria afirmando um banco que nao existe — a
  REGRA DE HONESTIDADE, verificada no valor e nao no texto.
*/
const resultados = [];
for (const nome of LEITURAS) {
  if (typeof dados[nome] !== 'function') continue;
  try {
    const r = await dados[nome]();
    resultados.push({ nome, source: r?.source, reason: r?.reason });
  } catch (e) {
    resultados.push({ nome, erro: String(e && e.message) });
  }
}
const comErro = resultados.filter((r) => r.erro);
const naoDemo = resultados.filter((r) => !r.erro && r.source !== 'demo');
const semMotivo = resultados.filter((r) => !r.erro && r.reason !== dados.PENDING_REASON);

if (comErro.length === 0)
  ok(`as ${LEITURAS.length} leituras resolvem sem lancar`, 'nenhuma depende de banco para responder');
else fail('leitura lancou', comErro.map((r) => `${r.nome}: ${r.erro}`).join('; '));

if (naoDemo.length === 0)
  ok('todas devolvem `source: demo`', 'nenhuma afirma `database`');
else fail('leitura dizendo `database`', naoDemo.map((r) => `${r.nome}=${r.source}`).join(', '));

if (semMotivo.length === 0)
  ok('todas trazem o motivo pendente', 'o `Dataset` nunca volta mudo');
else fail('leitura sem motivo', semMotivo.map((r) => r.nome).join(', '));

/* ================= 5. as escritas honestas ================= */

console.log('\n5. as escritas — nenhuma devolve sucesso falso');

const ESCRITAS = [
  'salvarEndereco', 'excluirEndereco', 'marcarEnderecoPrincipal',
  'salvarPerfilMedidas', 'resgatarRecompensa', 'salvarDadosConta',
  'salvarSenha', 'encerrarSessoes',
];
const escritasAusentes = ESCRITAS.filter((n) => typeof dados[n] !== 'function');
if (escritasAusentes.length === 0)
  ok(`as ${ESCRITAS.length} escritas da area estao exportadas`, ESCRITAS.join(', '));
else fail('escrita ausente de `data.ts`', escritasAusentes.join(', '));

/*
  Uma escrita remota pode ou nao existir para um dado argumento (o
  `removerEndereco` de um id inexistente devolve `ok: true`, porque nao havia o
  que remover). Por isso a prova nao exige `ok: false` de todas: exige que
  NENHUMA devolva `ok: true` SEM ter mudado nada — e a unica forma de o sucesso
  ser falso neste desenho e a escrita alegar persistencia que nao houve. O que a
  bancada verifica e o TIPO do retorno: `{ ok: boolean, reason?: string }`.
*/
const retornos = [];
for (const nome of ESCRITAS) {
  if (typeof dados[nome] !== 'function') continue;
  try {
    const r = await dados[nome]({});
    retornos.push({ nome, ok: r?.ok, temReason: typeof r?.reason === 'string' });
  } catch (e) {
    retornos.push({ nome, erro: String(e && e.message) });
  }
}
const escritasComErro = retornos.filter((r) => r.erro);
const formaErrada = retornos.filter((r) => !r.erro && typeof r.ok !== 'boolean');

if (escritasComErro.length === 0)
  ok(`as ${retornos.length} escritas respondem sem lancar`, 'mesmo com o objeto vazio que a bancada passa');
else fail('escrita lancou com argumento vazio', escritasComErro.map((r) => `${r.nome}: ${r.erro}`).join('; '));

if (formaErrada.length === 0)
  ok('todas devolvem `{ ok: boolean }`', 'o `ResultadoEscrita` do contrato');
else fail('escrita com retorno fora do contrato', formaErrada.map((r) => r.nome).join(', '));

/*
  E a prova central da honestidade: a escrita que MAIS poderia mentir — a senha —
  devolve `ok: false` com motivo. Ela nao tem provedor, e diz isso em vez de
  fingir que trocou.
*/
if (typeof dados.salvarSenha === 'function') {
  const r = await dados.salvarSenha();
  if (r && r.ok === false && typeof r.reason === 'string' && r.reason.length > 0)
    ok('`salvarSenha` devolve `ok: false` COM motivo', `"${r.reason.slice(0, 48)}..."`);
  else fail('`salvarSenha`', JSON.stringify(r));
} else fail('`salvarSenha` nao existe', '');

/* ================= 6. o que NAO pode estar na area ================= */

console.log('\n6. provas ao contrario — o que a area nao pode conter');

const PROIBIDOS = [
  [/bg-beige/, 'o token `beige` nao existe no projeto (`secondary` e o par)'],
  [/toLocaleDateString\(/, 'formato de data dependente do ICU da maquina'],
  [/window\.location\.origin/, '`window` nao existe na bancada, e a origem entra por prop'],
  [/overflow-x-hidden/, 'mata o `sticky` da coluna — o projeto usa `clip`'],
];

for (const [re, porque] of PROIBIDOS) {
  const achados = raizes.filter((f) => re.test(semComentarios(ler(f))));
  if (achados.length === 0) ok(`ausente do codigo: ${re.source}`, porque);
  else fail(`apareceu no codigo: ${re.source}`, achados.map((f) => f.split(/[\\/]/).pop()).join(', '));
}

/*
  ================== A PALETA CRUA: PERMITIDA UMA, E SO A MEDIDA ==================

  A area NAO adota a paleta crua do Tailwind. Os tons que o original declara
  (`rose-600`, `emerald-600`, `amber-100`/`amber-800`) foram convertidos para os
  tokens semanticos (`danger`, `success`, `warning`), e as bancadas de modulo
  provam cada conversao.

  Ha UMA excecao, e ela e medida e registrada: o `amber-600` do KPI e da
  estrelinha VIP. A bancada de `conta` mediu o amarelo do cartao no print
  `004603` — mediana (228,124,20) — e ele E o `amber-600`. O STATUS registra a
  escolha como divergencia 16: usar o `amber-500` do original poria DOIS ambers
  no mesmo painel para o mesmo papel. Um `amber-600` com lastro de pixel nao e
  "paleta crua por descuido"; e a cor do material.

  A prova entao nao e "nenhuma cor crua", que seria falsa — e "nenhuma cor crua
  FORA da lista de excecoes". Uma cor nova, nao medida, seria pega aqui, e o
  autor teria que ou medi-la e registrar, ou converter.
*/
const EXCECOES_DE_PALETA = ['text-amber-600'];
const crua = /(?:text|bg|border|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g;

for (const f of raizes) {
  const codigo = semComentarios(ler(f));
  const achados = [...codigo.matchAll(crua)]
    .map((m) => m[0])
    .filter((c) => !EXCECOES_DE_PALETA.includes(c));
  if (achados.length > 0)
    fail('paleta crua FORA da excecao medida', `${f.split(/[\\/]/).pop()}: ${[...new Set(achados)].join(', ')}`);
}
if (raizes.every((f) => [...semComentarios(ler(f)).matchAll(crua)].every((m) => EXCECOES_DE_PALETA.includes(m[0]))))
  ok('nenhuma cor crua fora do `text-amber-600` medido', 'uma excecao, com lastro de pixel (divergencia 16)');

/*
  E a excecao tem que CONTINUAR sendo a mesma. Se o `amber-600` sumisse, a
  estrelinha teria sido convertida sem que a divergencia 16 fosse atualizada.
*/
const usaAmberMedido = raizes.some((f) => semComentarios(ler(f)).includes('text-amber-600'));
if (usaAmberMedido) ok('o `amber-600` medido continua na area', 'a divergencia 16 segue verdadeira');
else fail('o `amber-600` medido sumiu', 'a divergencia 16 ficou stale');

/*
  E nenhum `any` explicito nem `@ts-ignore` — o `strict: true` do projeto so vale
  se ninguem o desliga. O `strict:false` da COMPILACAO da bancada e do
  instrumento, e nao do projeto: quem prova o `strict:true` e o `tsc --noEmit`,
  que roda separado. Aqui a prova e a ausencia da ESCAPE.
*/
const escapes = raizes.filter((f) => /@ts-(ignore|nocheck|expect-error)|\bas any\b/.test(semComentarios(ler(f))));
if (escapes.length === 0)
  ok('nenhuma escape de tipo (`any` / `@ts-ignore`)', 'o `strict: true` do projeto vale na area inteira');
else fail('escape de tipo', escapes.map((f) => f.split(/[\\/]/).pop()).join(', '));

/* ================= 7. a cadeia de arquivos ================= */

console.log('\n7. a cadeia — todo arquivo da area tem razao de existir');

const tsxCliente = raizes.filter((f) => /src[\\/]components[\\/]cliente[\\/]/.test(f));
if (tsxCliente.length >= 20)
  ok(`a area tem ${tsxCliente.length} componentes`, 'a contagem do inventario');
else fail('poucos componentes', String(tsxCliente.length));

/*
  ================== A PROVA DE ORFAO, PELO NOME ==================

  Nenhum componente de `components/cliente` e codigo morto: todo arquivo e
  citado por algum outro arquivo da area — pela rota que o monta, ou por outro
  componente que o importa (ou o reexporta).

  ================== ESTA PROVA JA ESTEVO ERRADA, E A FALHA ERA DELA ==================

  A primeira versao so olhava `import ... from '@/components/cliente/<x>'` e
  acusou DEZESSEIS componentes como orfaos — todos falsos positivos. Os
  importes REAIS da area usam ALIAS

      import { AccountShell as AccountShellBase } from './account-shell';

  e nao o caminho com `@`. A bancada estava medindo o TEXTO do import, e nao a
  EXISTENCIA da ligacao: um instrumento que procura a forma que o autor imaginou
  e nao a que o projeto escreveu — o mesmo defeito de
  `feedback_bancada_lista_fixa_cega`. Aqui a busca e pelo NOME DO ARQUIVO em
  qualquer `from`, o que pega as duas formas.
*/
const componentes = tsxCliente.map((f) => f.replace(/\.tsx$/, '').split(/[\\/]/).pop());
const orfaos = componentes.filter((nome) => {
  const citacoes = raizes.filter((f) => f.split(/[\\/]/).pop() !== `${nome}.tsx`);
  return !citacoes.some((f) => new RegExp(`from\\s+'[^']*\\b${nome}'`).test(semComentarios(ler(f))));
});
if (orfaos.length === 0)
  ok('nenhum componente orfao', `os ${componentes.length} sao citados por alguem`);
else fail('componente que ninguem cita', orfaos.join(', '));

/* ================= 8. o inventario contra o arquivo de status ================= */

console.log('\n8. o STATUS diz o que o disco prova');

const STATUS = join(PROJ, 'PAINEL-CLIENTE-STATUS.md');
if (!existsSync(STATUS)) fail('`PAINEL-CLIENTE-STATUS.md` ausente', '');
else {
  const status = ler(STATUS);

  /*
    Os treze modulos estao PRONTO. A prova e a CONTAGEM de linhas `PRONTO` na
    tabela de modulos — um modulo que voltasse a "a fazer" derrubaria a conta.
  */
  const prontos = (status.match(/\*\*PRONTO\*\*/g) || []).length;
  if (prontos === 13) ok('os treze modulos marcados PRONTO', '13 linhas');
  else fail('a contagem de PRONTO', `${prontos} (esperado 13)`);

  if (!/a fazer/.test(status)) ok('nenhum modulo ficou "a fazer"', 'a fila fechou');
  else fail('sobrou um "a fazer"', 'a fila nao fechou');

  /*
    E as bancadas do arquivo batem com as que estao no disco. Esta e a prova
    contra a memoria stale: se uma bancada foi criada e nao registrada, ou
    registrada e apagada, a bancada acusa.
  */
  const noStatus = [...status.matchAll(/`(bench-cliente-[a-z]+)\.mjs`/g)].map((m) => m[1]);
  const unicasNoStatus = [...new Set(noStatus)].sort();
  const noDisco = readdirSync(join(PROJ, 'bancadas'))
    .filter((n) => /^bench-cliente-[a-z]+\.mjs$/.test(n))
    .map((n) => n.replace(/\.mjs$/, ''))
    .sort();

  if (JSON.stringify(unicasNoStatus) === JSON.stringify(noDisco))
    ok(`as ${noDisco.length} bancadas do STATUS sao as do disco`, noDisco.join(' '));
  else {
    const soNoStatus = unicasNoStatus.filter((b) => !noDisco.includes(b));
    const soNoDisco = noDisco.filter((b) => !unicasNoStatus.includes(b));
    fail('STATUS x disco divergem', `so no STATUS=[${soNoStatus.join(', ')}] so no disco=[${soNoDisco.join(', ')}]`);
  }

  /*
    A secao de compartilhados tem que estar atualizada: a ultima coisa que ela
    pode dizer e que o modulo 13 nao tocou nada do admin.
  */
  if (/modulo 13.*nao alterou nenhum arquivo compartilhado/i.test(status) ||
      /O modulo 13 tambem nao alterou/.test(status))
    ok('a secao de compartilhados registra o modulo 13', 'a memoria nao ficou em 12');
  else fail('a secao de compartilhados', 'nao menciona o modulo 13');

  /*
    E as medidas REGISTRADAS nos modulos continuam no lugar. A prova de que a
    bancada de modulo e a de auditoria olham o mesmo disco: um `conta-section-card`
    com uma classe trocada derrubaria a de modulo, e a auditoria nao precisa
    saber qual era a medida.
  */
  if (/12 \+ 260 \+ 40 \+ 2212 \+ 12 = 2536/.test(status))
    ok('a medicao da coluna segue registrada', '2536 — a base das bancadas de modulo');
  else fail('a medicao da coluna sumiu do STATUS', 'alguem apagou uma prova');
}

/* ------------------------------------------------------------------ rodape */

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
process.exit(falhas === 0 ? 0 : 1);
