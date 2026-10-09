/**
 * Bancada da FASE 5 — banco real + integracao + autenticacao.
 *
 * ================== O QUE ELA PROVA, E O QUE ELA NAO PODE PROVAR ==================
 *
 * **NAO ha banco.** `DATABASE_URL` nao existe, o engine do Prisma nao baixa, e
 * `prisma generate` nao roda — os tipos do cliente continuam `any`. Entao esta
 * bancada NAO prova: conexao, tabela criada, linha lida, migration aplicada,
 * fluxo ponta a ponta. Nada disso e afirmado em lugar nenhum.
 *
 * O que ela PROVA sao as REGRAS — que valem com e sem banco:
 *
 *   1. **A AUTENTICACAO DECIDE CERTO.** Quem entra, quem nao entra, e por que.
 *      Testado de verdade, chamando as funcoes: senha errada recusa; usuario
 *      inexistente recusa; inativo recusa; cliente nao entra no admin; a
 *      mensagem e a MESMA para e-mail inexistente e senha errada (senao vaza
 *      quais e-mails existem).
 *
 *   2. **O REPOSITORIO NAO MENTE.** Sem banco, `ler` devolve
 *      `source: 'demo'` COM motivo; `escrever` devolve `ok: false`. Nenhum
 *      caminho devolve `source: 'database'` sem ter consultado.
 *
 *   3. **O PAGAMENTO E NEUTRO.** O pedido existe sem gateway; nao ha provider
 *      concreto; nenhum SDK de pagamento foi instalado; nenhum nome de gateway
 *      aparece no codigo; o estado nasce `pendente`; um estado desconhecido NAO
 *      vira `pago`.
 *
 *   4. **O MAPEAMENTO BANCO -> DOMINIO.** `Decimal` -> `number`, `Date` -> ISO,
 *      `null` continua `null`. O `null` virando zero e o defeito registrado.
 *
 *   5. **A GUARDA E SERVER-SIDE.** O `where` das leituras de dono sai da SESSAO.
 *
 * Uso: node bancadas/bench-fase5.mjs <pasta do projeto>
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-fase5.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-fase5');

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

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);

/* ------------------------------------------------- arquivos das camadas novas */

const arquivos = [];
(function varrer(dir) {
  if (!existsSync(dir)) return;
  for (const entrada of readdirSync(dir)) {
    const c = join(dir, entrada);
    if (statSync(c).isDirectory()) varrer(c);
    else if (/\.tsx?$/.test(c)) arquivos.push(c);
  }
})(SRC);

/** As raizes PURAS: sem React, sem `next/*`, sem `'use server'`. */
const raizesPuras = [
  join(SRC, 'lib', 'auth', 'senha.ts'),
  join(SRC, 'lib', 'auth', 'sessao.ts'),
  join(SRC, 'lib', 'auth', 'decisao.ts'),
  join(SRC, 'lib', 'data', 'mapear.ts'),
  join(SRC, 'lib', 'pagamento', 'provider.ts'),
  join(SRC, 'lib', 'db.ts'),
].filter(existsSync);

const programa = ts.createProgram(raizesPuras, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  esModuleInterop: true,
  skipLibCheck: true,
  strict: false,
  rootDir: raizProjeto,
  outDir: OUT,
  baseUrl: raizProjeto,
  paths: { '@/*': ['./src/*'] },
});
const emitido = programa.emit();
const erros = ts.getPreEmitDiagnostics(programa).filter((d) => d.category === ts.DiagnosticCategory.Error);
if (erros.length === 0 && !emitido.emitSkipped) ok('as camadas novas compilam', `${raizesPuras.length} arquivos`);
else {
  fail('as camadas novas nao compilam', `${erros.length} erro(s)`);
  for (const d of erros.slice(0, 6)) console.log(`       ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
}

const require = createRequire(join(PROJ, 'package.json'));
const senha = require(join(OUT, 'src/lib/auth/senha.js'));
const decisao = require(join(OUT, 'src/lib/auth/decisao.js'));
const mapear = require(join(OUT, 'src/lib/data/mapear.js'));
const pagamento = require(join(OUT, 'src/lib/pagamento/provider.js'));

/* ================= 1. a autenticacao decide ================= */

console.log('\n1. a autenticacao — quem entra, quem nao, e por que');

const HASH_OK = senha.hashSenha('senha-correta');

const usuarioOk = { id: 'u1', passwordHash: HASH_OK, role: 'cliente', isActive: true };
const admin = { id: 'u2', passwordHash: HASH_OK, role: 'admin', isActive: true };
const inativo = { id: 'u3', passwordHash: HASH_OK, role: 'cliente', isActive: false };

const r1 = decisao.decidirEntrada(usuarioOk, 'senha-correta', senha.verificarSenha);
if (r1.ok && r1.id === 'u1' && r1.papel === 'cliente')
  ok('a senha certa entra, com o papel certo', JSON.stringify({ id: r1.id, papel: r1.papel }));
else fail('a senha certa nao entrou', JSON.stringify(r1));

const r2 = decisao.decidirEntrada(usuarioOk, 'senha-errada', senha.verificarSenha);
if (!r2.ok && r2.motivo === decisao.CREDENCIAL_INVALIDA) ok('a senha errada recusa', `"${r2.motivo}"`);
else fail('a senha errada entrou', JSON.stringify(r2));

const r3 = decisao.decidirEntrada(null, 'qualquer', senha.verificarSenha);
if (!r3.ok && r3.motivo === decisao.CREDENCIAL_INVALIDA) ok('usuario inexistente recusa', `"${r3.motivo}"`);
else fail('usuario inexistente entrou', JSON.stringify(r3));

/*
  A PROVA MAIS IMPORTANTE DESTA SECAO: a mensagem de "e-mail que nao existe" tem
  que ser IDENTICA a de "senha errada". Se diferissem, quem sondasse descobriria
  quais e-mails estao cadastrados.
*/
if (r2.motivo === r3.motivo)
  ok('a mensagem e a MESMA para senha errada e e-mail inexistente', 'nao vaza quais e-mails existem');
else fail('as mensagens divergem — vaza a existencia do e-mail', `"${r2.motivo}" != "${r3.motivo}"`);

const r4 = decisao.decidirEntrada(inativo, 'senha-correta', senha.verificarSenha);
if (!r4.ok && r4.motivo === decisao.CREDENCIAL_INVALIDA)
  ok('conta INATIVA recusa, mesmo com a senha certa', 'o `isActive` e conferido no login');
else fail('conta inativa entrou', JSON.stringify(r4));

const r5 = decisao.decidirEntrada(usuarioOk, 'senha-correta', senha.verificarSenha, 'admin');
if (!r5.ok && r5.motivo === decisao.MENSAGEM_SEM_PERMISSAO)
  ok('CLIENTE nao entra na area de admin', `"${r5.motivo}"`);
else fail('cliente entrou no admin', JSON.stringify(r5));

const r6 = decisao.decidirEntrada(admin, 'senha-correta', senha.verificarSenha, 'admin');
if (r6.ok && r6.papel === 'admin') ok('ADMIN entra na area de admin', '');
else fail('admin nao entrou no admin', JSON.stringify(r6));

if (r5.motivo !== r2.motivo)
  ok('a recusa por PAPEL e diferente da de credencial', 'quem acertou a senha ja sabe que a conta existe');
else fail('a recusa por papel usa a mesma mensagem da de credencial', 'confundiria quem tem permissao');

/*
  O `conferirSenha` roda PRECISAMENTE UMA VEZ em cada caminho — inclusive quando
  o usuario nao existe. Se o caminho "inexistente" pulasse a conferencia, ele
  responderia mais rapido, e a diferenca de tempo revelaria se o e-mail existe.
*/
let chamadas = 0;
decisao.decidirEntrada(null, 'x', (s, h) => {
  chamadas += 1;
  return senha.verificarSenha(s, h);
});
if (chamadas === 1) ok('a conferencia roda mesmo SEM usuario', 'o tempo nao revela se o e-mail existe');
else fail('a conferencia foi pulada', `${chamadas} chamadas`);

if (decisao.papelDe('admin') === 'admin' && decisao.papelDe('cliente') === 'cliente' && decisao.papelDe('qualquer') === 'cliente')
  ok('papel desconhecido cai em `cliente`, e nunca em `admin`', 'o lado que NAO tem privilegio');
else fail('a normalizacao de papel esta errada', '');

/* ---- o cadastro ---- */

const base = { nome: 'Ana', email: 'ana@exemplo.com', senha: 'segredo1' };
if (decisao.validarCadastro(base, 6) === null) ok('um cadastro valido passa', '');
else fail('cadastro valido foi recusado', JSON.stringify(decisao.validarCadastro(base, 6)));

const semNome = decisao.validarCadastro({ ...base, nome: '' }, 6);
if (semNome && semNome.campo === 'nome') ok('cadastro sem nome recusa, e diz o campo', semNome.motivo);
else fail('cadastro sem nome passou', JSON.stringify(semNome));

const emailRuim = decisao.validarCadastro({ ...base, email: 'sem-arroba' }, 6);
if (emailRuim && emailRuim.campo === 'email') ok('e-mail invalido recusa', emailRuim.motivo);
else fail('e-mail invalido passou', JSON.stringify(emailRuim));

const senhaCurta = decisao.validarCadastro({ ...base, senha: 'abc' }, 6);
if (senhaCurta && senhaCurta.campo === 'senha') ok('senha curta recusa', senhaCurta.motivo);
else fail('senha curta passou', JSON.stringify(senhaCurta));

if (decisao.normalizarEmail('  ANA@Exemplo.COM ') === 'ana@exemplo.com')
  ok('o e-mail e normalizado antes de buscar', 'a unicidade nao depende de caixa');
else fail('o e-mail nao e normalizado', '');

/* ================= 2. o repositorio nao mente ================= */

console.log('\n2. o repositorio — sem banco, devolve demo COM motivo, e nunca diz `database`');

const repoArquivo = join(SRC, 'lib', 'data', 'repositorio.ts');
if (!existsSync(repoArquivo)) fail('`lib/data/repositorio.ts` ausente', '');
else {
  const codigo = readFileSync(repoArquivo, 'utf8');
  if (/source: 'database'/.test(codigo) && /source: 'demo'/.test(codigo))
    ok('o repositorio distingue `demo` de `database`', 'o contrato da Fase 2 preservado');
  else fail('o repositorio nao distingue as fontes', '');

  /*
    A prova de que NADA afirma `database` sem consultar: o unico `'database'` do
    CODIGO esta DEPOIS do `await consulta(...)`. A ordem no texto importa.

    A BUSCA IGNORA COMENTARIO — a primeira versao desta prova pegou o proprio
    cabecalho do arquivo, que cita `source: 'database'` numa frase. E o falso
    positivo de `bancada-comentario-vira-falso-positivo`, e ja e a QUARTA vez
    nesta base.
  */
  const semDoc = codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const posConsulta = semDoc.indexOf('await consulta(');
  const posDatabase = semDoc.indexOf("source: 'database'");
  if (posConsulta > 0 && posDatabase > posConsulta)
    ok('`database` so aparece DEPOIS da consulta, no CODIGO', 'nao ha caminho que o afirme sem ler');
  else fail('`database` aparece antes da consulta', 'afirmaria banco sem ter lido');

  if (/catch/.test(codigo) && /source: 'demo'/.test(codigo.slice(codigo.indexOf('catch'))))
    ok('uma leitura que FALHA cai para demo, e diz isso', 'nao serve erro do banco como se fosse dado');
  else fail('a falha de leitura nao cai para demo', '');

  if (/resp[ao]sta.*160|slice\(0, 160\)/.test(codigo))
    ok('a mensagem de erro e CORTADA', 'o Prisma poe a query e os parametros na mensagem');
  else fail('a mensagem de erro nao e cortada', 'poderia vazar query/dado na tela');
}

/* ================= 3. o mapeamento banco -> dominio ================= */

console.log('\n3. o mapeamento — `Decimal`->number, `Date`->ISO, `null` continua `null`');

const linhaProduto = {
  id: 'p1',
  name: 'top',
  slug: 'top',
  description: null,
  categoryId: null,
  price: { toString: () => '179.9' },
  costPrice: 90,
  promoPrice: null,
  compareAtPrice: { toString: () => '200.00' },
  stock: 8,
  sizes: ['P', 'M'],
  status: 'active',
  featured: true,
  images: [{ id: 'i1', url: 'u', alt: '', sortOrder: 2 }, { id: 'i2', url: 'u2', alt: 'a', sortOrder: 1 }],
  colors: [],
  createdAt: new Date('2026-06-12T10:12:00Z'),
  updatedAt: new Date('2026-06-16T09:30:00Z'),
};

const p = mapear.paraProduto(linhaProduto);
if (typeof p.price === 'number' && p.price === 179.9)
  ok('`Decimal` virou `number`', `${linhaProduto.price.toString()} -> ${p.price}`);
else fail('o `Decimal` nao virou numero', JSON.stringify(p.price));

if (p.compareAtPrice === 200 && p.promoPrice === null)
  ok('`null` continua `null` no campo opcional', 'nao virou 0');
else fail('um `null` virou valor', `compareAt=${p.compareAtPrice} promo=${p.promoPrice}`);

if (p.createdAt === '2026-06-12T10:12:00.000Z')
  ok('`Date` virou string ISO', p.createdAt);
else fail('a data nao virou ISO', p.createdAt);

if (p.images[0].id === 'i2')
  ok('as imagens saem ORDENADAS pelo `sortOrder`', p.images.map((i) => i.id).join(','));
else fail('a ordem das imagens esta errada', p.images.map((i) => i.id).join(','));

if (p.categoryId === '')
  ok('`categoryId: null` vira `\'\'` — o "— Sem categoria —" do formulario', 'a conversao e explicita');
else fail('o `categoryId` nulo nao virou string vazia', JSON.stringify(p.categoryId));

if (p.description === '')
  ok('descricao nula vira string vazia', 'o dominio declara `string`, nao `string | null`');
else fail('a descricao nula nao virou vazio', JSON.stringify(p.description));

/* o status e uma uniao FECHADA — um valor estranho nao pode publicar */
if (mapear.statusProduto('active') === 'active' && mapear.statusProduto('qualquer') === 'draft')
  ok('status desconhecido cai em `draft`', 'o lado que NAO publica');
else fail('status desconhecido nao cai em draft', '');

if (mapear.statusPedido('pago') === 'pago' && mapear.statusPedido('lixo') === 'novo')
  ok('status de pedido desconhecido cai em `novo`', '');
else fail('status de pedido desconhecido', '');

/*
  O ESTADO DE PAGAMENTO — a prova que mais importa aqui. Um valor que o projeto
  nao conhece NAO pode virar `pago`: isso transformaria um estado desconhecido
  numa venda confirmada.
*/
if (mapear.estadoPagamento('pago') === 'pago' && mapear.estadoPagamento('coisa-do-gateway') === 'pendente')
  ok('estado de pagamento desconhecido cai em `pendente`', 'nunca em `pago` — nao inventa venda');
else fail('estado de pagamento desconhecido virou pago', JSON.stringify(mapear.estadoPagamento('coisa-do-gateway')));

const linhaCategoria = {
  id: 'c1', name: 'Tops', slug: 'tops', imageUrl: null, imageAlt: null,
  sortOrder: 1, isActive: true, metaTitle: '', metaDescription: '', introText: '',
  createdAt: new Date(), updatedAt: new Date(),
};
const cat = mapear.paraCategoria(linhaCategoria);
if (cat.image === null && cat.productCount === 0)
  ok('categoria sem imagem e sem `_count` fica `null` e `0`', 'nao inventa contagem');
else fail('a categoria', JSON.stringify({ image: cat.image, count: cat.productCount }));

const catComContagem = mapear.paraCategoria({ ...linhaCategoria, _count: { products: 5 } });
if (catComContagem.productCount === 5) ok('`_count` vira `productCount`', 'contado na leitura, nao gravado');
else fail('o `_count` nao virou productCount', String(catComContagem.productCount));

/* ================= 4. o pagamento e neutro ================= */

console.log('\n4. o pagamento — preparado, SEM gateway');

if (pagamento.providerAtual() === null) ok('`providerAtual()` devolve `null`', 'nenhum gateway escolhido');
else fail('ha um provider concreto', 'o proprietario ainda nao escolheu');

if (!pagamento.temGateway()) ok('`temGateway()` e falso', 'o sistema sabe que nao ha cobranca');
else fail('`temGateway()` e verdadeiro sem provider', '');

if (pagamento.podeCriarPedido() === true)
  ok('o pedido PODE ser criado sem gateway', 'o pagamento nao bloqueia a loja');
else fail('o pedido depende do gateway', 'trancaria a loja ate a escolha sair');

if (pagamento.statusPedidoPara('pendente') === 'novo' && pagamento.statusPedidoPara('pago') === 'pago')
  ok('o estado do pedido decorre do pagamento', 'pendente -> `novo`; so o gateway leva a `pago`');
else fail('a derivacao do status do pedido esta errada', '');

if (/GATEWAY A DEFINIR/.test(pagamento.ESTADO_PAGAMENTO_PROJETO))
  ok('o estado do projeto se declara GATEWAY A DEFINIR', pagamento.ESTADO_PAGAMENTO_PROJETO);
else fail('o estado nao declara a pendencia', '');

/*
  A PROVA AO CONTRARIO: nenhum gateway pode ter sido implementado ou instalado.
  A varredura e do CODIGO e das DEPENDENCIAS.
*/
const nomesDeGateway = /stripe|mercadopago|mercado_pago|asaas|pagseguro|pagarme|pagar\.me|infinitepay|cielo|getnet/i;

/*
  A varredura IGNORA COMENTARIO, e isso e uma correcao, nao uma conveniencia.

  Duas mencoes legitimas a `InfinitePay` existem e SAO ANTERIORES a esta fase:

    - `admin/configuracoes/page.tsx` — a transcricao do print adm-083, cujo
      titulo de secao E `Pagamentos — InfinitePay`;
    - `(site)/pedido-confirmado/[orderId]/page.tsx` — o MEU comentario de
      pendencia, explicando que o original consultava esse gateway.

  Nenhuma das duas INSTALA nem IMPLEMENTA um provider — a de `configuracoes` e a
  tela de administracao das credenciais (que existe desde a Fase 1 e nao foi
  tocada), e a outra e prosa. Procurar o nome no arquivo CRU daria falso
  positivo; o que a prova precisa garantir e que nao ha IMPLEMENTACAO.
*/
const semComentarios = (c) =>
  c.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/*
  O ESCOPO DA PROVA: as camadas NOVAS desta fase, mais o site e o dominio do
  pedido — que sao onde um provider seria IMPLEMENTADO. A tela de configuracao do
  ADMIN fica de fora, e a razao esta logo abaixo.
*/
const dadosDoAdmin = join(SRC, 'components', 'admin') + '\\';
const ehDoAdmin = (f) => f.includes(join(SRC, 'components', 'admin')) || f.includes(join(SRC, 'app', 'admin')) || f.includes(join(SRC, 'lib', 'abrir-loja'));

const arquivosComGateway = arquivos
  .filter((f) => !ehDoAdmin(f))
  .filter((f) => nomesDeGateway.test(semComentarios(readFileSync(f, 'utf8'))))
  .map((f) => f.split(/[\\/]/).slice(-3).join('/'));
if (arquivosComGateway.length === 0)
  ok('nenhum gateway implementado FORA do admin', 'nem Stripe, nem Mercado Pago, nem Asaas');
else fail('ha codigo de gateway', arquivosComGateway.slice(0, 4).join(', '));

/*
  ================== A MENCAO NO ADMIN — REGISTRADA, E NAO CORRIGIDA ==================

  `components/admin/configuracoes/payments-tab.tsx` (FASE 1) tem uma secao
  `InfinitePay` e uma constante `WEBHOOK_URL` apontando para o webhook dela. Isso
  **presume um gateway** que o proprietario ainda nao escolheu — e por isso esta
  prova existe: para que a mencao nao passe silenciosa.

  Ela NAO e corrigida aqui por dois motivos, e os dois sao regra do comando:

    1. **A tela transcreve o print `adm-083`**, cujo titulo de secao E
       `Pagamentos — InfinitePay`. Apaga-lo seria divergir da referencia;
    2. **A Fase 1 esta aprovada** — `NÃO altere Admin espontaneamente`, `NÃO
       redesenhe Admin`. A Fase 5 nao mexe em tela aprovada para acomodar backend.

  O que fica registrado: quando o proprietario escolher (ou descartar) o gateway,
  esta e a tela que muda. A bancada AFIRMA que a mencao existe e onde, para que a
  decisao saiba onde encostar.
*/
const temMencaoNoAdmin = arquivos.some(
  (f) => ehDoAdmin(f) && nomesDeGateway.test(semComentarios(readFileSync(f, 'utf8'))),
);
if (temMencaoNoAdmin)
  ok('a mencao a um gateway existe SO no admin (Fase 1), e esta registrada', 'transcricao do print adm-083; nao tocada');
else ok('nao ha mencao a gateway em lugar nenhum', '');

const pkg = JSON.parse(readFileSync(join(PROJ, 'package.json'), 'utf8'));
const todasDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
const sdkDeGateway = Object.keys(todasDeps).filter((d) => nomesDeGateway.test(d));
if (sdkDeGateway.length === 0) ok('nenhum SDK de pagamento instalado', 'nem em deps nem em devDeps');
else fail('SDK de pagamento instalado', sdkDeGateway.join(', '));

/* ================= 5. a guarda e server-side ================= */

console.log('\n5. a guarda — a protecao roda no SERVIDOR, e o filtro sai da sessao');

const guardas = join(SRC, 'lib', 'auth', 'guardas.ts');
if (!existsSync(guardas)) fail('`lib/auth/guardas.ts` ausente', '');
else {
  const codigo = readFileSync(guardas, 'utf8');
  if (/from 'next\/headers'/.test(codigo) && /from 'next\/navigation'/.test(codigo))
    ok('a guarda usa `cookies()` e `redirect()` do servidor', 'nao ha checagem no navegador');
  else fail('a guarda nao e server-side', '');

  if (/export function filtroDoDono/.test(codigo) && /sessao\.usuarioId|sessao\.demo/.test(codigo))
    ok('o filtro de dono sai da SESSAO', 'nao de um id que veio do navegador');
  else fail('o filtro de dono nao sai da sessao', 'seria o defeito que mostra pedido de outra pessoa');

  if (/'demo-sem-banco'/.test(codigo))
    ok('a sessao de demonstracao tem id SENTINELA', 'impossivel de colidir com um id real');
  else fail('a sessao de demo nao tem sentinela', '');
}

/*
  A prova de que a senha NAO chega ao cliente: as acoes que mexem com senha sao
  `'use server'`, e o hash so e produzido la.
*/
const acoes = join(SRC, 'lib', 'auth', 'acoes.ts');
if (existsSync(acoes)) {
  const codigo = readFileSync(acoes, 'utf8');
  if (/^'use server';/m.test(codigo)) ok('as acoes de auth sao `\'use server\'`', 'a senha nao volta ao navegador');
  else fail('as acoes de auth nao sao server', '');
  if (/hashSenha\(/.test(codigo) && !/passwordHash:\s*dados\.senha/.test(codigo))
    ok('a senha e hasheada antes de tocar o banco', 'nunca gravada em texto');
  else fail('a senha pode chegar crua ao banco', '');
  if (/httpOnly/.test(readFileSync(join(SRC, 'lib', 'auth', 'sessao.ts'), 'utf8')))
    ok('o cookie e `httpOnly`', 'o JavaScript da pagina nao le o token');
  else fail('o cookie nao e httpOnly', '');
} else fail('`lib/auth/acoes.ts` ausente', '');

/* ================= 6. provas ao contrario ================= */

console.log('\n6. provas ao contrario — `any`, escape de tipo e senha em texto');

const PROIBIDOS = [
  [/\bas any\b/, '`any` — o cliente do Prisma e `any` hoje, e ninguem pode espalha-lo'],
  [/@ts-(?:ignore|expect-error|nocheck)/, 'escape de tipo — o `strict: true` do projeto vale'],
];
for (const [re, porque] of PROIBIDOS) {
  const achados = arquivos
    .filter((f) => re.test(readFileSync(f, 'utf8')))
    .map((f) => f.split(/[\\/]/).slice(-2).join('/'));
  if (achados.length === 0) ok(`ausente do codigo: ${re.source}`, porque);
  else fail(`apareceu no codigo: ${re.source}`, achados.slice(0, 4).join(', '));
}

const schema = readFileSync(join(PROJ, 'prisma', 'schema.prisma'), 'utf8');
const colunas = [...schema.matchAll(/^\s*(\w*senha\w*|\w*password\w*)\s+\w+/gm)].map((m) => m[1]);
const semHash = colunas.filter((c) => !/hash/i.test(c));
if (colunas.length > 0 && semHash.length === 0)
  ok(`a unica coluna de senha se chama \`passwordHash\``, colunas.join(', '));
else fail('coluna de senha sem `hash`', String(semHash.join(', ')));

if (/paymentStatus/.test(schema) && /paymentExternalId/.test(schema))
  ok('o pedido tem estado de pagamento e referencia GENERICA', '`paymentExternalId`, e nao o id de um gateway');
else fail('o pedido nao tem os campos de pagamento neutros', '');

/* ================= 7. o diagnostico da fase ================= */

console.log('\n7. o estado real do Prisma, medido');

const stub = join(PROJ, 'node_modules', '.prisma', 'client', 'index.d.ts');
if (existsSync(stub)) {
  const dts = readFileSync(stub, 'utf8');
  if (/export declare const PrismaClient: any/.test(dts))
    ok('o cliente do Prisma AINDA e o stub (`any`)', 'e por isso que `db.ts` compila');
  else ok('o cliente do Prisma TEM os models gerados', 'a geracao rodou');
} else fail('nao ha cliente do Prisma', '');

const envReal = ['.env', '.env.local', '.env.production'].some((f) => existsSync(join(PROJ, f)));
if (!envReal) ok('nao ha `.env` — a credencial NAO existe', 'NEON EXECUTION: BLOQUEADO POR DATABASE_URL');
else {
  const conteudo = readFileSync(join(PROJ, '.env'), 'utf8');
  if (/ep-xxxx/.test(conteudo)) ok('o `.env` tem host de EXEMPLO, e nao credencial', 'nao conta como banco');
  else ok('existe um `.env` — a credencial pode existir', 'a execucao real pode ser tentada');
}

/* ------------------------------------------------------------------ rodape */

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
process.exit(falhas === 0 ? 0 : 1);
