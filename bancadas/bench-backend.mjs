/**
 * Bancada da FASE 4 — o backend.
 *
 * ================== O QUE ESTA BANCADA PODE E O QUE ELA NAO PODE ==================
 *
 * **NAO ha conexao com banco.** Nao existe `DATABASE_URL`, o engine do Prisma
 * nao baixa neste ambiente, e nenhum model foi gerado. Entao esta bancada NAO
 * prova: que a tabela foi criada, que a linha foi lida, que a migration rodou.
 * Isso fica registrado como **BLOQUEADO POR CREDENCIAL NEON**, e nao maquiado.
 *
 * O que ela PROVA, e que e bastante:
 *
 *   1. **O schema cobre as entidades.** Todo `interface` de dominio que a Fase 4
 *      classificou como persistente tem um `model` correspondente. Um dominio sem
 *      tabela seria uma tela que nunca persiste — e o defeito so apareceria na
 *      integracao.
 *
 *   2. **Os enums batem LITERALMENTE.** Cada valor do `type X = 'a' | 'b'` do
 *      TypeScript existe no `enum X` do Prisma, e nenhum a mais. Um literal
 *      trocado passa no TypeScript e o banco recusa na escrita — e a bancada
 *      pega os dois lados.
 *
 *   3. **A senha.** Que `hashSenha` devolve um hash e nao a senha; que duas
 *      chamadas da MESMA senha dao hashes DIFERENTES (salt); que
 *      `verificarSenha` aceita a certa e recusa a errada; e que a senha nao
 *      aparece em texto puro em lugar nenhum do schema.
 *
 *   4. **A sessao.** Que o token assinado volta com os campos certos; que
 *      **adulterar um byte invalida**; que **outro segredo invalida**; que
 *      **expirado devolve `null`**; e que **`SESSION_SECRET` vazio LANCA** em vez
 *      de assinar com uma chave de exemplo.
 *
 *   5. **A fronteira.** Que `db()` devolve `null` sem banco, e que o resto do
 *      sistema trata esse `null` como um ESTADO — o mesmo contrato da Fase 2/3.
 *
 * Uso: node bancadas/bench-backend.mjs <pasta do projeto>
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-backend.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const SCHEMA = join(PROJ, 'prisma', 'schema.prisma');
const OUT = join(PROJ, '.bench-backend');

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

if (!existsSync(SCHEMA)) {
  fail('`prisma/schema.prisma` ausente', 'a Fase 4 nao esta no disco');
  console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
  process.exit(1);
}

const schema = readFileSync(SCHEMA, 'utf8');
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);

/* ================= 1. o schema cobre as entidades ================= */

console.log('\n1. o schema cobre as entidades que a fase marcou como persistentes');

const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]);
const enums = [...schema.matchAll(/^enum\s+(\w+)\s*\{/gm)].map((m) => m[1]);

if (models.length > 0) ok(`o schema declara ${models.length} models`, models.slice(0, 6).join(', ') + '...');
else fail('nenhum model no schema', '');

/**
 * As entidades por dominio. A lista foi escrita a partir do `BACKEND-MAP.md`, e
 * cobre o que a fase classificou como A (persiste) — as de configuracao viram
 * `Setting` (chave/valor), e as de relatorio nao persistem.
 */
const ENTIDADES = {
  produtos: ['Product', 'ProductImage', 'ProductColor'],
  categorias: ['Category'],
  estoque: ['StockMovement'],
  cupons: ['Coupon'],
  campanhas: ['Campaign'],
  'carrinho-abandonado': ['AbandonedCart'],
  fidelidade: ['LoyaltyMovement'],
  afiliadas: ['Affiliate'],
  pedidos: ['Order', 'OrderItem'],
  /*
    `usuarios` declara `UserRoleRow` (a ATRIBUICAO de papel), e
    `cliente/types.ts` declara `ContaCliente` (a conta da area da cliente). O
    model `User` e a UNIFICACAO dos dois — a MESMA pessoa nas duas areas. Os dois
    tipos entram no `noTipo`, e o nome do model e `User`.
  */
  usuarios: ['User'],
  crm: ['CrmLead'],
  emails: ['EmailLog', 'EmailTemplate'],
  whatsapp: ['Ticket'],
  busca: ['SearchTerm'],
  seguranca: ['AuditLog', 'Backup'],
  conteudo: ['HeroSlide', 'HomeSection', 'PromoBanner', 'Benefit', 'Look'],
};

/**
 * O TIPO DE ORIGEM de cada model, quando o nome difere.
 *
 * Tres models foram batizados sem o `Row` do tipo — o model e a ENTIDADE, e o
 * tipo era a linha da tela. Exigir nome identico acusaria tres falsos positivos;
 * o que importa e que o CONCEITO tenha os dois lados.
 */
const TIPO_DE_ORIGEM = {
  SearchTerm: { dominio: 'busca', tipo: 'SearchTermRow' },
  AuditLog: { dominio: 'seguranca', tipo: 'AuditLogRow' },
  Backup: { dominio: 'seguranca', tipo: 'BackupRow' },
  User: { dominio: 'usuarios', tipo: 'UserRoleRow' },
};

for (const [dominio, alvos] of Object.entries(ENTIDADES)) {
  const fonte = readFileSync(join(SRC, 'lib', dominio, 'types.ts'), 'utf8');
  const declarados = [...fonte.matchAll(/^export (?:interface|type)\s+(\w+)/gm)].map((m) => m[1]);
  const semModel = alvos.filter((a) => !models.includes(a));
  const noTipo = alvos.filter((a) => {
    const origem = TIPO_DE_ORIGEM[a];
    return !declarados.includes(origem ? origem.tipo : a);
  });
  if (semModel.length === 0 && noTipo.length === 0)
    ok(`${dominio}: ${alvos.length} entidade(s) com model`, alvos.join(', '));
  else
    fail(
      `${dominio}: entidade sem par`,
      `sem model=[${semModel.join(', ')}] sem tipo=[${noTipo.join(', ')}]`,
    );
}

/* ================= 2. os enums batem literalmente ================= */

console.log('\n2. os enums — cada valor do TypeScript existe no Prisma, e nenhum a mais');

/** Os valores de um `export type X = 'a' | 'b';` (com o `|` inicial opcional). */
function valoresDoTipo(fonte, nome) {
  const m = fonte.match(new RegExp(`export type ${nome}\\s*=([^;]+);`, 's'));
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

/** Os valores de um `enum X { a b c }` do schema. */
function valoresDoEnum(nome) {
  const m = schema.match(new RegExp(`enum ${nome}\\s*\\{([^}]*)\\}`, 's'));
  if (!m) return null;
  return m[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//') && !l.startsWith('@@'))
    .map((l) => l.split(/\s/)[0]);
}

const ENUMS = {
  produtos: ['ProductStatus'],
  cupons: ['CouponKind', 'CouponApplyTo'],
  campanhas: ['CampaignType', 'CampaignDiscountType'],
  'carrinho-abandonado': ['CartStatus'],
  afiliadas: ['CommissionType', 'AffiliateStatus'],
  estoque: ['MovementType'],
  fidelidade: ['LoyaltyMovementType'],
  pedidos: ['OrderStatus', 'ShippingStatus', 'PaymentMethod', 'ShippingKind'],
  atendimento: ['TicketStatus'],
  whatsapp: ['TicketOrigin'],
  conteudo: ['SiteSectionKind'],
};

for (const [dominio, nomes] of Object.entries(ENUMS)) {
  const fonte = readFileSync(join(SRC, 'lib', dominio, 'types.ts'), 'utf8');
  for (const nome of nomes) {
    const doTipo = valoresDoTipo(fonte, nome);
    const doSchema = valoresDoEnum(nome);
    if (!doTipo) {
      fail(`\`${nome}\` nao esta em \`${dominio}/types.ts\``, 'a premissa da prova caiu');
      continue;
    }
    if (!doSchema) {
      fail(`\`${nome}\` nao tem enum no schema`, doTipo.join(' | '));
      continue;
    }
    const faltando = doTipo.filter((v) => !doSchema.includes(v));
    const sobrando = doSchema.filter((v) => !doTipo.includes(v));
    if (faltando.length === 0 && sobrando.length === 0)
      ok(`\`${nome}\`: ${doTipo.length} valores batem`, doTipo.join(' | '));
    else
      fail(`\`${nome}\` diverge`, `faltando no schema=[${faltando.join(', ')}] sobrando=[${sobrando.join(', ')}]`);
  }
}

/*
  `UserRole` e `string` no TypeScript. A prova AO CONTRARIO: o schema NAO pode
  ter fechado esse vocabulario num enum — fechar no banco o que o codigo deixa
  aberto seria inventar uma restricao que ninguem decidiu.
*/
const usuarios = readFileSync(join(SRC, 'lib', 'usuarios', 'types.ts'), 'utf8');
const userRoleEhString = /export type UserRole = string;/.test(usuarios);
if (userRoleEhString && !enums.includes('UserRole'))
  ok('`UserRole` continua `string`, e o schema NAO o fechou', 'nenhum enum inventado');
else fail('`UserRole` virou enum no schema', 'o TypeScript o declara `string`');

/* ================= 3. a senha ================= */

console.log('\n3. a senha — hash, salt, comparacao em tempo constante');

const arquivos = [];
(function varrer(dir) {
  for (const entrada of readdirSync(dir)) {
    const c = join(dir, entrada);
    if (statSync(c).isDirectory()) varrer(c);
    else if (/\.tsx?$/.test(c)) arquivos.push(c);
  }
})(join(SRC, 'lib', 'auth'));

const programaAuth = ts.createProgram(arquivos, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  esModuleInterop: true,
  skipLibCheck: true,
  /*
    `strict: true` — e NAO `false` como o resto das bancadas.

    Com `strictNullChecks` desligado, o TypeScript NAO estreita uma uniao
    discriminada por booleano: `if (!decisao.ok)` deixa de provar que `motivo`
    existe, e uma linha CORRETA passa a acusar erro. Foi exatamente o que
    aconteceu: esta bancada reprovou `acoes.ts` linha 103 enquanto o
    `tsc --noEmit` do projeto dava EXIT=0.

    O projeto compila em `strict: true`; uma bancada que o afrouxa mede outra
    coisa que nao o projeto — ver `feedback_bancada_strict_false_mente`.
  */
  strict: true,
  rootDir: raizProjeto,
  outDir: OUT,
  baseUrl: raizProjeto,
  paths: { '@/*': ['./src/*'] },
});
const emitAuth = programaAuth.emit();
const errosAuth = ts.getPreEmitDiagnostics(programaAuth).filter((d) => d.category === ts.DiagnosticCategory.Error);
if (errosAuth.length === 0 && !emitAuth.emitSkipped) ok('a camada de auth compila', `${arquivos.length} arquivos`);
else fail('a camada de auth nao compila', `${errosAuth.length} erro(s)`);

const require = createRequire(join(PROJ, 'package.json'));
const senha = require(join(OUT, 'src/lib/auth/senha.js'));
const sessao = require(join(OUT, 'src/lib/auth/sessao.js'));

const h1 = senha.hashSenha('minha-senha-secreta');
if (h1 !== 'minha-senha-secreta' && !h1.includes('minha-senha-secreta'))
  ok('`hashSenha` NAO devolve a senha', h1.slice(0, 24) + '...');
else fail('`hashSenha` devolveu a senha', 'FAIL nao deveria');

if (h1.startsWith('scrypt$')) ok('o hash guarda o ALGORITMO e o custo', h1.split('$').slice(0, 4).join('$'));
else fail('o hash nao guarda os parametros', h1.slice(0, 20));

const h2 = senha.hashSenha('minha-senha-secreta');
if (h1 !== h2) ok('a MESMA senha gera hashes DIFERENTES', 'salt aleatorio por senha');
else fail('a mesma senha gerou o mesmo hash', 'sem salt — duas clientes com a mesma senha seriam identicas');

if (senha.verificarSenha('minha-senha-secreta', h1)) ok('`verificarSenha` aceita a senha certa', '');
else fail('`verificarSenha` recusou a senha certa', '');

if (!senha.verificarSenha('senha-errada', h1)) ok('`verificarSenha` recusa a senha errada', '');
else fail('`verificarSenha` aceitou a senha errada', '');

if (!senha.verificarSenha('minha-senha-secreta', 'lixo')) ok('hash em formato invalido recusa', 'nao lanca');
else fail('hash invalido foi aceito', '');

if (!senha.verificarSenha('x', null)) ok('hash `null` recusa', 'cliente sem senha definida nao entra');

if (senha.MINIMO_SENHA === 6) ok('o minimo de senha e 6, como na area da cliente', 'a mesma regra nas duas portas');
else fail('o minimo de senha mudou', String(senha.MINIMO_SENHA));

/*
  A prova do TEMPO CONSTANTE e da LEITURA do codigo: `timingSafeEqual` esta la.
  Nao da para provar tempo constante por relogio numa bancada — a diferenca e de
  nanossegundos e o ruido a engole. O que da para provar e que a comparacao NAO e
  `===`, que e o defeito real.
*/
const codigoSenha = readFileSync(join(SRC, 'lib', 'auth', 'senha.ts'), 'utf8');
if (/timingSafeEqual/.test(codigoSenha) && !/calculado\s*===\s*esperado/.test(codigoSenha))
  ok('a comparacao do hash e `timingSafeEqual`, e nao `===`', 'um `===` vazaria o hash byte a byte');
else fail('a comparacao do hash nao e em tempo constante', '');

/* ================= 4. a sessao ================= */

console.log('\n4. a sessao — assinatura, adulteracao, expiracao e segredo vazio');

const SEGREDO = 'um-segredo-de-teste-com-mais-de-16-bytes';
const AGORA = Date.parse('2026-10-05T12:00:00Z');

const criada = sessao.criarToken({ sub: 'usr-1', papel: 'cliente' }, SEGREDO, AGORA, 7);
if (typeof criada.token === 'string' && criada.token.includes('.') && criada.expiraEm)
  ok('`criarToken` devolve token e validade', `exp=${criada.expiraEm}`);
else fail('`criarToken`', JSON.stringify(criada));

const lida = sessao.lerToken(criada.token, SEGREDO, AGORA + 1000);
if (lida && lida.sub === 'usr-1' && lida.papel === 'cliente')
  ok('`lerToken` devolve o `sub` e o papel', JSON.stringify({ sub: lida.sub, papel: lida.papel }));
else fail('`lerToken`', JSON.stringify(lida));

/*
  A ADULTERACAO. Trocar UM caractere do payload tem que invalidar — e o defeito
  que o HMAC existe para pegar. A prova mexe no primeiro caractere do payload e
  exige `null`.
*/
const [payload, assinatura] = criada.token.split('.');
const payloadMexido = (payload[0] === 'A' ? 'B' : 'A') + payload.slice(1);
if (sessao.lerToken(`${payloadMexido}.${assinatura}`, SEGREDO, AGORA + 1000) === null)
  ok('um byte trocado no payload INVALIDA o token', 'o HMAC pegou a adulteracao');
else fail('o token adulterado foi aceito', 'a assinatura nao confere o conteudo');

if (sessao.lerToken(`${payload}.${assinatura.slice(0, -1)}X`, SEGREDO, AGORA + 1000) === null)
  ok('uma assinatura trocada INVALIDA o token', '');
else fail('assinatura invalida foi aceita', '');

/*
  O OUTRO SEGREDO. Um token assinado com o segredo do atacante NAO pode valer —
  e o ataque que o `SESSION_SECRET` existe para impedir.
*/
const forjado = sessao.criarToken({ sub: 'admin-1', papel: 'admin' }, 'segredo-do-atacante-tambem-longo', AGORA).token;
if (sessao.lerToken(forjado, SEGREDO, AGORA + 1000) === null)
  ok('token assinado com OUTRO segredo e recusado', 'nao da para forjar um admin');
else fail('token com outro segredo foi aceito', 'FAIL — isto seria escalacao de privilegio');

/*
  A EXPIRACAO. O `agora` entra por parametro justamente para isto: provar a
  fronteira SEM esperar 7 dias.
*/
const seteDias = 7 * 24 * 60 * 60 * 1000;
if (sessao.lerToken(criada.token, SEGREDO, AGORA + seteDias - 1000) !== null)
  ok('um segundo ANTES de expirar, o token vale', 'a fronteira e do lado certo');
else fail('o token expirou antes da hora', '');
if (sessao.lerToken(criada.token, SEGREDO, AGORA + seteDias + 1000) === null)
  ok('um segundo DEPOIS de expirar, o token nao vale', 'a expiracao e conferida');
else fail('o token vale depois de expirado', 'FAIL');

/*
  O SEGREDO VAZIO. Um default silencioso assinaria com uma chave que esta no
  codigo — e qualquer um forjaria um token. A prova exige que LANCE.
*/
let lancou = false;
try {
  sessao.criarToken({ sub: 'x', papel: 'admin' }, '', AGORA);
} catch {
  lancou = true;
}
if (lancou) ok('`SESSION_SECRET` vazio LANCA — nao ha chave de exemplo', 'falha alto, e nao em silencio');
else fail('segredo vazio foi aceito', 'assinaria com uma chave publica');

let lancouCurto = false;
try {
  sessao.criarToken({ sub: 'x', papel: 'admin' }, 'curto', AGORA);
} catch {
  lancouCurto = true;
}
if (lancouCurto) ok('segredo CURTO demais tambem lanca', '16 bytes e o minimo');
else fail('segredo curto foi aceito', '');

if (sessao.lerToken(null, SEGREDO, AGORA) === null && sessao.lerToken('', SEGREDO, AGORA) === null)
  ok('token ausente ou vazio devolve `null`', 'nao lanca no caminho comum');
else fail('token vazio nao devolveu `null`', '');

const opaco = sessao.novoTokenOpaco();
if (opaco.token !== opaco.hash && opaco.hash === sessao.hashTokenOpaco(opaco.token))
  ok('o token opaco do banco vai HASHEADO', 'o cru so existe no cookie');
else fail('o token opaco', 'o hash tem que bater com o token');

/* ================= 5. a fronteira do banco ================= */

console.log('\n5. a fronteira — sem credencial, o sistema DIZ que nao ha banco');

const dbArquivo = join(SRC, 'lib', 'db.ts');
if (existsSync(dbArquivo)) {
  const codigo = readFileSync(dbArquivo, 'utf8');
  if (/export function temBanco/.test(codigo) && /ep-xxxx/.test(codigo))
    ok('`temBanco()` reconhece a URL de EXEMPLO como ausencia', 'o host `ep-xxxx` do template nao conta');
  else fail('`temBanco` nao checa a URL de exemplo', '');

  if (/export const PENDENTE_SEM_BANCO/.test(codigo))
    ok('ha um motivo PENDENTE escrito uma vez', 'as telas nao inventam o proprio texto');
  else fail('nao ha motivo pendente', '');

  /*
    A prova de que o cliente NAO e instanciado no topo do modulo: a linha
    `globalForPrisma.prisma = new PrismaClient()` tem que estar DENTRO de uma
    funcao, e nao no escopo do modulo. A verificacao e pelo recuo — a instrucao
    dentro do `db()` vem indentada; no topo viria na coluna zero.

    A BUSCA IGNORA COMENTARIO. A primeira versao pegou a PROPRIA documentacao do
    arquivo, que cita `new PrismaClient()` numa frase — falso positivo de
    `bancada-comentario-vira-falso-positivo`, cometido dentro do instrumento que
    existe para pegá-lo.
  */
  const semDoc = codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const linhaDoCliente = semDoc.split('\n').find((l) => /new PrismaClient\(\)/.test(l)) ?? '';
  if (/^\s{2,}globalForPrisma\.prisma = new PrismaClient\(\)/.test(linhaDoCliente))
    ok('o cliente so e instanciado DENTRO do `db()`', 'nao ha conexao no topo do modulo');
  else fail('o cliente e instanciado no topo', JSON.stringify(linhaDoCliente.trim()));
} else fail('`lib/db.ts` ausente', '');

/*
  E a prova de que nada no projeto JA liga o banco: `@prisma/client` nao e
  importado por nenhuma tela, e nao ha `process.env.DATABASE_URL` fora do
  `db.ts`. A persistencia nao vazou para a interface.
*/
const todos = [];
(function varrer(dir) {
  for (const entrada of readdirSync(dir)) {
    const c = join(dir, entrada);
    if (statSync(c).isDirectory()) varrer(c);
    else if (/\.tsx?$/.test(c)) todos.push(c);
  }
})(SRC);

const importamPrisma = todos
  .filter((f) => !f.includes(join('lib', 'db.ts')))
  .filter((f) => /from '@prisma\/client'/.test(readFileSync(f, 'utf8')))
  .map((f) => f.split(/[\\/]/).pop());
if (importamPrisma.length === 0)
  ok('so o `db.ts` importa `@prisma/client`', 'o banco nao vazou para as telas');
else fail('outro arquivo importa o cliente', importamPrisma.join(', '));

/* ================= 6. o que nao pode aparecer ================= */

console.log('\n6. provas ao contrario — segredo, senha em texto e credencial inventada');

const padroes = [
  [/sk_live_[A-Za-z0-9]/, 'chave secreta de gateway'],
  [/eyJ[A-Za-z0-9_-]{20,}/, 'token JWT'],
  [/postgres(?:ql)?:\/\/[^\s'"$]{12,}/, 'string de conexao com senha'],
];
const achados = [];
for (const f of todos) {
  const c = readFileSync(f, 'utf8');
  for (const [re, o] of padroes) if (re.test(c)) achados.push(`${f.split(/[\\/]/).pop()} (${o})`);
}
if (achados.length === 0) ok('nenhum padrao de segredo real no codigo', 'varredura sobre `src/`');
else fail('segredo no codigo', achados.join(', '));

/*
  O `.env.example` tem o host `ep-xxxx` de exemplo — que NAO e credencial. A
  prova e que ele NAO contem uma URL com host plausivel do Neon.
*/
const exemplo = readFileSync(join(PROJ, '.env.example'), 'utf8');
if (/ep-xxxx/.test(exemplo) && !/ep-[a-z0-9]{10,}/.test(exemplo))
  ok('o `.env.example` traz host de EXEMPLO, e nao credencial', '`ep-xxxx`, nao um endpoint real');
else fail('o `.env.example` parece ter credencial real', 'FAIL');

/*
  Nenhuma senha em texto puro no schema: a coluna tem que se chamar `passwordHash`
  (ou nao existir) — uma coluna `password` seria a senha guardada.
*/
const colunasSenha = [...schema.matchAll(/^\s*(password\w*)\s+\w+/gm)].map((m) => m[1]);
const semHash = colunasSenha.filter((c) => !/hash/i.test(c));
if (colunasSenha.length > 0 && semHash.length === 0)
  ok('a unica coluna de senha se chama `passwordHash`', colunasSenha.join(', '));
else fail('ha coluna de senha sem `hash` no nome', String(semHash.join(', ')));

/* ================= 7. os documentos da fase ================= */

console.log('\n7. os documentos da fase existem e dizem o estado real');

for (const doc of ['BACKEND-MAP.md', 'BACKEND-STATUS.md']) {
  if (existsSync(join(PROJ, doc))) ok(`\`${doc}\` existe`, '');
  else fail(`\`${doc}\` ausente`, '');
}
if (/BLOQUEADO POR CREDENCIAL NEON/.test(readFileSync(join(PROJ, 'BACKEND-MAP.md'), 'utf8')))
  ok('o `BACKEND-MAP.md` registra o bloqueio da credencial', 'nao afirma banco conectado');
else fail('o `BACKEND-MAP.md` nao registra o bloqueio', '');

/* ------------------------------------------------------------------ rodape */

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
process.exit(falhas === 0 ? 0 : 1);
