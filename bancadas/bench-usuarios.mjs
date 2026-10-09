/**
 * Bancada do modulo Usuarios / Admins (adm-085).
 *
 * ================== O QUE ELA PROVA ==================
 *
 *   as TRES linhas do print, com os papeis e os `user_id` exatos;
 *   que `ADMIN` e `SUPER_ADMIN` compartilham o MESMO `user_id` (chave composta);
 *   o avatar de iniciais — `AD` · `US` · `SU` (duas LETRAS, nao duas palavras);
 *   os tres estados: carregando, vazio e com linhas;
 *   que a tela NAO tem convite, botao, busca nem nome/e-mail;
 *   que a pagina deixou de ser `ModulePage` e a faixa errada sumiu.
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
  console.error('uso: node bench-usuarios.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-usuarios');

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
  /src[\\/](lib[\\/]usuarios|components[\\/]admin[\\/]usuarios|app[\\/]admin[\\/]usuarios)[\\/]/.test(f),
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

const demo = require(join(OUT, 'src/lib/usuarios/demo.js'));
const dados = require(join(OUT, 'src/lib/usuarios/data.js'));
const metricas = require(join(OUT, 'src/lib/usuarios/metrics.js'));
const { UsuariosView } = require(join(OUT, 'src/components/admin/usuarios/usuarios-view.js'));
const { UserRoleList } = require(join(OUT, 'src/components/admin/usuarios/user-role-list.js'));

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/* ====================== 1. as tres linhas do print ====================== */

console.log('\n1. as TRES linhas do print, na ordem do `ORDER BY role`');

if (demo.DEMO_USER_ROLES.length === 3)
  ok('a lista tem exatamente TRES linhas', 'como o print');
else fail('numero de linhas', `${demo.DEMO_USER_ROLES.length}`);

if (mesmo(demo.DEMO_USER_ROLES.map((r) => r.role), ['ADMIN', 'USER', 'SUPER_ADMIN']))
  ok('os papeis: `ADMIN` · `USER` · `SUPER_ADMIN`', 'ordem alfabetica do original');
else fail('papeis', JSON.stringify(demo.DEMO_USER_ROLES.map((r) => r.role)));

if (demo.DEMO_USER_ROLES.every((r) => UUID_RE.test(r.userId)))
  ok('os tres `user_id` sao UUID validos', 'nao nome nem e-mail');
else fail('uuid invalido', JSON.stringify(demo.DEMO_USER_ROLES.map((r) => r.userId)));

/** `ADMIN` e `SUPER_ADMIN` compartilham o id — a mesma conta com dois papeis. */
const admin = demo.DEMO_USER_ROLES.find((r) => r.role === 'ADMIN');
const superAdmin = demo.DEMO_USER_ROLES.find((r) => r.role === 'SUPER_ADMIN');
if (admin.userId === superAdmin.userId)
  ok('`ADMIN` e `SUPER_ADMIN` sao a MESMA conta', 'mesmo `user_id` — dado real, nao defeito');
else fail('ids divergem', `${admin.userId} != ${superAdmin.userId}`);

/** A chave composta e o que impede a colisao das duas linhas iguais. */
const chaves = demo.DEMO_USER_ROLES.map(metricas.rowKey);
if (new Set(chaves).size === 3)
  ok('as tres chaves de linha sao DISTINTAS', '`user_id` sozinho colidiria nas duas do topo');
else fail('chaves colidem', JSON.stringify(chaves));

const leitura = await dados.listUserRoles();
if (leitura.source === 'demo' && leitura.data.length === 3)
  ok('`listUserRoles` devolve as tres, marcadas como demo', '');
else fail('leitura', JSON.stringify(leitura.source));

leitura.data[0].role = 'MEXIDO';
if (demo.DEMO_USER_ROLES[0].role === 'ADMIN')
  ok('a leitura devolve COPIA — a demo nao e tocada', 'spread por linha');
else fail('demo mutada', demo.DEMO_USER_ROLES[0].role);

/* ====================== 2. o avatar de iniciais ====================== */

console.log('\n2. o avatar sao as DUAS PRIMEIRAS LETRAS — nao as iniciais das palavras');

if (metricas.roleInitials('ADMIN') === 'AD' && metricas.roleInitials('USER') === 'US' &&
    metricas.roleInitials('SUPER_ADMIN') === 'SU')
  ok('`ADMIN` → `AD`, `USER` → `US`, `SUPER_ADMIN` → `SU`', 'os tres avatares do print');
else fail('iniciais', JSON.stringify(['ADMIN','USER','SUPER_ADMIN'].map(metricas.roleInitials)));

/** A prova que separa "duas letras" de "iniciais das palavras". */
if (metricas.roleInitials('SUPER_ADMIN') !== 'SA')
  ok('`SUPER_ADMIN` NAO vira `SA`', 'e `SU` — fatia de letras, como o original');
else fail('iniciais de palavra', 'deu SA');

if (metricas.roleInitials('') === '?' && metricas.roleInitials('   ') === '?')
  ok('papel vazio devolve `?`', 'avatar sem nada pareceria erro de desenho');
else fail('papel vazio', metricas.roleInitials(''));

/* ====================== 3. a lista com linhas ====================== */

console.log('\n3. a lista montada');

const cheia = render(UserRoleList, { rows: demo.DEMO_USER_ROLES, loading: false });
const tCheia = textos(cheia);

if (tCheia.includes('ADMIN') && tCheia.includes('USER') && tCheia.includes('SUPER_ADMIN'))
  ok('os tres papeis aparecem', '');
else fail('papeis na tela', tCheia.slice(0, 200));

for (const r of demo.DEMO_USER_ROLES) {
  if (!tCheia.includes(r.userId)) fail('user_id na tela', r.userId);
}
if (demo.DEMO_USER_ROLES.every((r) => tCheia.includes(r.userId)))
  ok('os tres `user_id` aparecem', 'o administrador precisa saber qual conta esta vendo');
else fail('ids na tela', '');

if (textos(cheia).includes('AD') && textos(cheia).includes('US') && textos(cheia).includes('SU'))
  ok('os tres avatares de iniciais', '`AD` · `US` · `SU`');
else fail('avatares', '');

if (contar(cheia, 'rounded-full') >= 3 && contar(cheia, 'size-9') === 3)
  ok('tres circulos de avatar (`size-9 rounded-full`)', 'como o original');
else fail('avatares desenhados', `${contar(cheia, 'size-9')}`);

/** O `user_id` aparece DUAS vezes — `ADMIN` e `SUPER_ADMIN` o compartilham. */
if (contar(cheia, 'f2fe46dc-cf34-45dc-becc-abedcbe377f3') === 2)
  ok('o `user_id` repetido aparece nas duas linhas', 'a mesma conta com dois papeis');
else fail('id repetido', `${contar(cheia, 'f2fe46dc-cf34-45dc-becc-abedcbe377f3')}`);

/* ====================== 4. os tres estados ====================== */

console.log('\n4. carregando, vazio e com linhas — sem se misturar');

const carregando = render(UserRoleList, { rows: [], loading: true });
if (textos(carregando).includes('Carregando…') && !textos(carregando).includes('Nenhum usuário'))
  ok('CARREGANDO: nao mostra a frase do vazio', '');
else fail('carregando', textos(carregando).slice(0, 160));

const vazio = render(UserRoleList, { rows: [], loading: false });
if (textos(vazio).includes('Nenhum usuário com função administrativa.'))
  ok('VAZIO: a frase exata do original', '`ComingSoon` do `UsersAdmin`');
else fail('vazio', textos(vazio).slice(0, 160));

if (!textos(vazio).includes('Carregando'))
  ok('VAZIO: nao mostra o carregando', 'os dois estados nao se confundem');
else fail('vazio com carregando', '');

if (!textos(cheia).includes('Nenhum usuário') && !textos(cheia).includes('Carregando'))
  ok('COM LINHAS: nem vazio nem carregando', 'a lista nao mistura os estados');
else fail('estado fantasma', '');

/* ====================== 5. a tela abre em CARREGAMENTO ====================== */

console.log('\n5. a tela — cabecalho e o estado inicial');

const tela = render(UsuariosView, {});
const tTela = textos(tela);

if (tTela.includes('Usuários e Permissões') && tTela.includes('Lista de contas com acesso administrativo.'))
  ok('o cabecalho do print', 'titulo e descricao');
else fail('cabecalho', tTela.slice(0, 200));

if (tTela.includes('Carregando…') && !tTela.includes('Nenhum usuário'))
  ok('a tela abre em CARREGAMENTO', '`useEffect` nao roda no `renderToStaticMarkup`');
else fail('estado inicial', tTela.slice(0, 200));

/* ====================== 6. o que NAO foi inventado ====================== */

console.log('\n6. a tela NAO tem convite, botao, busca nem nome/e-mail');

if (contar(tela, '<button') === 0)
  ok('nenhum botao na tela', 'o print nao tem `+ Convidar` nem menu de acao');
else fail('botoes', `${contar(tela, '<button')}`);

if (contar(tela, '<input') === 0)
  ok('nenhum campo nem busca', '');
else fail('inputs', `${contar(tela, '<input')}`);

const pagina = arquivo('src/app/admin/usuarios/page.tsx');
const fonte = [
  arquivo('src/lib/usuarios/types.ts'), arquivo('src/lib/usuarios/demo.ts'),
  arquivo('src/lib/usuarios/metrics.ts'), arquivo('src/lib/usuarios/data.ts'),
  arquivo('src/components/admin/usuarios/user-role-list.tsx'),
  arquivo('src/components/admin/usuarios/usuarios-view.tsx'), pagina,
].join('\n');
const codigo = semComentarios(fonte);

/** Os campos que o placeholder prometia e o print nao mostra, medidos SEM comentarios. */
if (!/\bEDITOR\b|\bATENDIMENTO\b|\búltimo acesso\b|\blast_login\b/i.test(codigo))
  ok('nada de `EDITOR`, `ATENDIMENTO` ou `ultimo acesso`', 'o placeholder prometia; o print nao mostra');
else fail('campo inventado', (codigo.match(/EDITOR|ATENDIMENTO|último acesso|last_login/gi) ?? []).join(', '));

if (!/\bconvite\b|\bconvidar\b|\binvite\b/i.test(codigo))
  ok('nada de convite/convidar', 'nenhum print mostra formulario de convite');
else fail('convite inventado', '');

if (!/\bname\b|\bemail\b|\bphone\b/i.test(codigo))
  ok('nada de `name`, `email` ou `phone`', 'a linha so tem papel e `user_id`');
else fail('campo de pessoa', (codigo.match(/\bname\b|\bemail\b|\bphone\b/gi) ?? []).join(', '));

/* ====================== 7. a pagina foi trocada ====================== */

console.log('\n7. a pagina e a tela de verdade');

const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('UsuariosView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', '');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (!paginaLimpa.includes('structure') && !paginaLimpa.includes('references='))
  ok('o `structure` e o `references=` inventados sumiram', '');
else fail('placeholder sobreviveu', '');

if (!/adm-085 a adm-086/.test(paginaLimpa) && !/adm-086/.test(paginaLimpa))
  ok('a faixa ERRADA `adm-085 a adm-086` nao aparece', 'Usuarios e so adm-085');
else fail('faixa errada', '');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonte)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', '');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', '');
else fail('supressao de tipo', '');

/* ====================== 8. provas ao contrario ====================== */

console.log('\n8. provas ao contrario — o defeito tem que REPROVAR');

/** Um papel de uma letra nao pode quebrar o avatar. */
if (metricas.roleInitials('A') === 'A' && metricas.roleInitials('a') === 'A')
  ok('papel de uma letra devolve uma letra', 'e sobe a caixa');
else fail('papel curto', metricas.roleInitials('A'));

/** `rowKey` com o MESMO id e papeis diferentes NAO pode colidir. */
if (metricas.rowKey({ userId: 'x', role: 'ADMIN' }) !== metricas.rowKey({ userId: 'x', role: 'USER' }))
  ok('mesmo `user_id`, papeis diferentes = chaves diferentes', '');
else fail('rowKey frouxa', '');

/** A frase do vazio NAO pode aparecer na lista cheia. */
if (!textos(cheia).includes('Nenhum usuário com função administrativa.'))
  ok('a frase do vazio nao vaza para a lista cheia', '');
else fail('frase do vazio na cheia', '');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
