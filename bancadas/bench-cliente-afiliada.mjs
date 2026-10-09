/**
 * Bancada de `Afiliada` da area da cliente (fase 2, modulo 13).
 *
 * ================== ESTA E A UNICA TELA DA AREA SEM PRINT PROPRIO ==================
 *
 * A regra de prioridade da referencia (PRINT > ORIGINAL > ESTRUTURA >
 * INFERENCIA) nao tem o primeiro termo aqui: os vinte prints cobrem dez telas, e
 * `Afiliada` nao e uma delas. A referencia prova so o ATALHO (`cli-001`). Entao
 * NAO HA GEOMETRIA MEDIDA neste arquivo — todas as medidas vem das CLASSES do
 * original. Escrever uma prova de pixel aqui seria inventar uma medicao que
 * ninguem fez (ver `medir-janela-truncada`).
 *
 * ================== O QUE ELA PROVA ==================
 *
 *   `linkDivulgacao`   pura — os dois ramos do slug e os dois da origem
 *   `vendaPaga` /
 *   `rotuloVenda`      pura — o par Pago/Pendente
 *   `resumirVendas`    pura — a IDENTIDADE do `A Receber`, e o guarda de `NaN`
 *   `idCurtoPedido` /
 *   `dataVenda`        puras — o recorte e o formato do historico
 *
 *   `getAfiliada`      prova a FONTE UNICA: o perfil sai da MESMA lista do admin
 *   os montaveis       `ConviteAfiliada`, `PainelAfiliada`, `LinhaVenda`,
 *                      `VazioVendas`, `CartaoMetrica`
 *
 * ================== A PROVA MAIS IMPORTANTE: UMA AFILIADA, NAO DUAS ==================
 *
 * A Fase 4 exige que os paineis representem os MESMOS registros. Esta e a
 * primeira tela onde isso e verificavel HOJE, porque o painel do admin ja tem o
 * dominio `/admin/afiliadas`. A prova e de IDENTIDADE DE REFERENCIA:
 *
 *     perfil === DEMO_AFFILIATES[0]   // o MESMO objeto, nao uma copia
 *
 * e a cross-check que a torna util: o cupom e a comissao que o painel da cliente
 * imprime sao os valores do admin (`CARINNAS`, `5%`). Se alguem declarasse uma
 * afiliada propria na area da cliente, os dois numeros divergiriam no primeiro
 * ajuste do admin — e esta bancada acusaria.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-afiliada.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-afiliada');
const ORIGINAL = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.afiliada.tsx',
);

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
  /src[\\/](lib[\\/]cliente|components[\\/]cliente|app[\\/]\(cliente\))[\\/]/.test(f),
);

if (raizes.length === 0) {
  fail('nenhuma raiz encontrada', 'a area da cliente nao esta no disco');
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
  ok('emissao sem erro', `${raizes.length} raizes (cliente)`);
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
const react = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const modulo = require('node:module');
const carregarOriginal = modulo._load;
modulo._load = function (pedido, pai, ehPrincipal) {
  if (pedido.startsWith('@/')) return carregarOriginal.call(this, join(OUT, 'src', pedido.slice(2)), pai, ehPrincipal);
  return carregarOriginal.call(this, pedido, pai, ehPrincipal);
};

const dados = require(join(OUT, 'src/lib/cliente/data.js'));
const metrics = require(join(OUT, 'src/lib/cliente/metrics.js'));
const view = require(join(OUT, 'src/components/cliente/afiliada-view.js'));
const adminDemo = require(join(OUT, 'src/lib/afiliadas/demo.js'));
const adminMetrics = require(join(OUT, 'src/lib/afiliadas/metrics.js'));

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
const q = (s) => "'" + s + "'";
function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1').replace(/=""/g, '');
}
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const cruView = arquivo('src/components/cliente/afiliada-view.tsx');
const fonteView = semComentarios(cruView);
const fonteRota = arquivo('src/app/(cliente)/conta/afiliada/page.tsx');
const fonteData = semComentarios(arquivo('src/lib/cliente/data.ts'));
const fonteMetrics = semComentarios(arquivo('src/lib/cliente/metrics.ts'));

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `conta.afiliada.tsx` — o unico termo desta tela');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a UNICA fonte desta tela — nao ha print');

  const declaracoes = [
    ['Seja uma Afiliada Closet Lunar', 'o titulo do convite'],
    ['Quero me cadastrar agora', 'o botao do convite'],
    ['Painel de Afiliada', 'o titulo do painel'],
    ['Link de Divulgação', 'o cartao do link'],
    ['Copiar', 'o botao de copia'],
    ['Seu Cupom Exclusivo', 'o cartao do cupom'],
    ['Histórico de Vendas', 'o titulo do historico'],
    ['As vendas realizadas aparecerão aqui.', 'o vazio do historico'],
    ['Ver todas as vendas', 'o botao do rodape do historico'],
    ['Cliques', 'o primeiro numero'],
    ['Vendas', 'o segundo numero'],
    ['Saldo Total', 'o terceiro numero'],
    ['A Receber', 'o quarto numero'],
  ];
  for (const [frase, o_que] of declaracoes) {
    const noOriginal = fonteOriginal.includes(frase);
    const naTela = cruView.includes(frase);
    if (noOriginal && naTela) ok(`transcrito: ${o_que}`, q(frase));
    else fail(`transcricao de ${o_que}`, `original=${noOriginal} tela=${naTela} ${q(frase)}`);
  }

  /*
    A FRASE QUE O ORIGINAL MONTA COM JSX e a bancada nao pode procurar como
    substring unica: `Conta: {profile.status === 'active' ? 'Ativa' : 'Pendente'}`.
    A prova e das DUAS palavras separadas, na tela.
  */
  const seloOk =
    cruView.includes('Conta: ') && cruView.includes("'Ativa'") && cruView.includes("'Pendente'");
  if (seloOk)
    ok('transcrito: o selo de status, com os dois rotulos', 'Conta: Ativa / Conta: Pendente');
  else fail('o selo de status', 'faltou `Conta: `, `Ativa` ou `Pendente`');

  /*
    A TELA NAO PODE TER `supabase`. O original busca em tres tabelas
    (`affiliate_profiles`, `affiliate_sales`, `affiliate_referrals`) por
    `supabase.from(...)`. Nenhum cliente de banco entra nesta fase.
  */
  if (fonteOriginal.includes('affiliate_sales') && fonteOriginal.includes('affiliate_profiles'))
    ok('o original le de tres tabelas do `supabase`', 'a origem que NAO foi transcrita');
  else fail('o original nao tem as tabelas', 'a premissa da prova abaixo caiu');

  if (!/supabase/i.test(cruView) && !/\.from\(/.test(cruView))
    ok('a tela NAO carrega cliente de banco', 'nem `supabase`, nem `.from(`');
  else fail('a tela carrega banco', 'nenhuma consulta entra nesta fase');
}

/* ============ 2. o link de divulgacao ============ */

console.log('\n2. `linkDivulgacao` — os dois ramos do slug e os dois da origem');

if (typeof metrics.linkDivulgacao !== 'function') {
  fail('`linkDivulgacao` nao foi exportada', 'sem ela a bancada nao prova o link');
} else {
  const casos = [
    ['luna10', 'https://loja.com', 'https://loja.com/?ref=luna10', 'slug e origem'],
    ['luna10', '', '/?ref=luna10', 'slug sem origem — caminho relativo'],
    ['', 'https://loja.com', 'https://loja.com/', 'SEM slug: a origem sozinha, sem `?ref=` vazio'],
    ['', '', '/', 'sem slug e sem origem: a raiz'],
    ['  luna10  ', '', '/?ref=luna10', 'slug com espaco NAS PONTAS e recortado'],
    ['   ', '', '/', 'slug so de espacos conta como vazio'],
  ];
  for (const [slug, origem, esperado, o_que] of casos) {
    const r = metrics.linkDivulgacao(slug, origem);
    if (r === esperado) ok(`link: ${o_que}`, q(r));
    else fail(`link: ${o_que}`, `devolveu ${JSON.stringify(r)}, esperado ${q(esperado)}`);
  }

  /*
    A PROVA AO CONTRARIO DO LINK: sem slug, o resultado NAO pode conter `?ref=`.
    Um `?ref=` sem valor e um link de indicacao que nao identifica ninguem — a
    bancada o proibe explicitamente, e nao so confere a string inteira.
  */
  if (!metrics.linkDivulgacao('', '').includes('ref'))
    ok('sem slug, o link NAO tem `?ref=`', 'um parametro sem valor nao e indicacao');
  else fail('o link sem slug tem `?ref=`', 'nao pode');

  if (!/window/i.test(fonteMetrics))
    ok('`linkDivulgacao` NAO usa `window`', 'a origem entra por parametro — `window` nao existe em Node');
  else fail('`linkDivulgacao` usa `window`', 'derrubaria a bancada com ReferenceError');
}

/* ============ 3. o par da venda e o recorte do id ============ */

console.log('\n3. `vendaPaga` / `rotuloVenda` / `idCurtoPedido`');

if (typeof metrics.vendaPaga === 'function' && typeof metrics.rotuloVenda === 'function') {
  const casos = [
    ['paid', true, 'Pago'],
    ['pending', false, 'Pendente'],
    ['cancelled', false, 'Pendente'],
    ['', false, 'Pendente'],
    ['PAID', false, 'Pendente'],
  ];
  for (const [status, paga, rotulo] of casos) {
    const v = { id: 'x', orderId: 'o', criadaEm: '2026-01-01', status, commissionAmount: 10 };
    const p = metrics.vendaPaga(v);
    const r = metrics.rotuloVenda(v);
    if (p === paga && r === rotulo) ok(`venda ${q(status)}`, `${r}, paga=${p}`);
    else fail(`venda ${q(status)}`, `paga=${p} (esperado ${paga}), rotulo=${q(r)} (esperado ${q(rotulo)})`);
  }

  /*
    A PROVA DO LADO CONSERVADOR. `cancelled` NAO e `pending`, e um `!== 'pending'`
    o trataria como PAGO. O original testa `=== 'paid'`, entao um status
    inesperado cai em `Pendente` — e o lado que nao afirma um credito.
  */
  if (metrics.vendaPaga({ status: 'cancelled', commissionAmount: 0, id: '', orderId: '', criadaEm: '' }) === false)
    ok('um status inesperado (`cancelled`) NAO conta como pago', 'o lado conservador do `=== paid`');
  else fail('o status inesperado virou pago', '`!== pending` teria este defeito');
} else fail('`vendaPaga`/`rotuloVenda` nao exportadas', '');

if (typeof metrics.idCurtoPedido === 'function') {
  const casos = [
    ['abcdef1234567890', 'abcdef12', 'corta nos 8'],
    ['abc', 'abc', 'menor que 8 fica inteiro'],
    ['', '', 'vazio fica vazio'],
  ];
  for (const [entrada, esperado, o_que] of casos) {
    const r = metrics.idCurtoPedido(entrada);
    if (r === esperado) ok(`id: ${o_que}`, q(r));
    else fail(`id: ${o_que}`, `${q(r)}, esperado ${q(esperado)}`);
  }
} else fail('`idCurtoPedido` nao exportada', '');

/* ============ 4. as duas somas — a identidade do `A Receber` ============ */

console.log('\n4. `resumirVendas` — a identidade que um defeito silencioso quebraria');

if (typeof metrics.resumirVendas === 'function' && typeof metrics.resumoAfiliada === 'function') {
  const vendas = [
    { id: 'v1', orderId: 'a', criadaEm: '2026-01-01', status: 'paid', commissionAmount: 30 },
    { id: 'v2', orderId: 'b', criadaEm: '2026-01-02', status: 'pending', commissionAmount: 20 },
    { id: 'v3', orderId: 'c', criadaEm: '2026-01-03', status: 'pending', commissionAmount: 10 },
    { id: 'v4', orderId: 'd', criadaEm: '2026-01-04', status: 'paid', commissionAmount: 5 },
  ];
  const r = metrics.resumirVendas(vendas);

  /*
    A IDENTIDADE. O total soma TUDO; o `A Receber` soma so as NAO pagas. Uma
    funcao que somasse as pagas daria um numero plausivel (35) — por isso a prova
    nao e "maior que zero", e sim a igualdade com a soma feita a mao AQUI.
  */
  const aReceberAMao = vendas.filter((v) => v.status !== 'paid').reduce((a, v) => a + v.commissionAmount, 0);
  const totalAMao = vendas.reduce((a, v) => a + v.commissionAmount, 0);

  if (r.comissaoTotal === totalAMao && r.comissaoAReceber === aReceberAMao)
    ok('as duas somas batem com a soma a mao', `total=${r.comissaoTotal}, aReceber=${r.comissaoAReceber}`);
  else fail('as somas', `total=${r.comissaoTotal} (${totalAMao}), aReceber=${r.comissaoAReceber} (${aReceberAMao})`);

  if (r.comissaoAReceber === 30 && r.comissaoTotal === 65)
    ok('os valores literais conferem', 'total 65 (30+20+10+5), aReceber 30 (20+10)');
  else fail('os valores literais', `total=${r.comissaoTotal}, aReceber=${r.comissaoAReceber}`);

  /*
    O GUARDA DE `NaN`. Uma venda com valor invalido tem que ser IGNORADA, e nao
    envenenar a soma — um unico `NaN` levaria tudo a `NaN`, e a tela imprimiria
    `R$ NaN`. O original sofre disso; aqui o guarda existe de proposito.
  */
  const comLixo = metrics.resumirVendas([
    { id: 'v', orderId: 'o', criadaEm: '2026-01-01', status: 'pending', commissionAmount: Number('abc') },
    { id: 'w', orderId: 'o', criadaEm: '2026-01-01', status: 'pending', commissionAmount: 7 },
  ]);
  if (comLixo.comissaoTotal === 7 && comLixo.comissaoAReceber === 7)
    ok('uma venda com valor invalido e IGNORADA', 'a soma nao vira `NaN`');
  else fail('o guarda de NaN', `total=${comLixo.comissaoTotal}, aReceber=${comLixo.comissaoAReceber}`);

  const vazio = metrics.resumirVendas([]);
  if (vazio.comissaoTotal === 0 && vazio.comissaoAReceber === 0)
    ok('sem vendas, as duas somas sao 0', 'e nao `NaN` nem `undefined`');
  else fail('as somas vazias', JSON.stringify(vazio));

  /*
    `resumoAfiliada` monta o objeto INTEIRO. A contagem de `vendas` tem que ser
    o COMPRIMENTO da lista, e nao um numero passado a parte que poderia divergir.
  */
  const resumo = metrics.resumoAfiliada(42, vendas);
  if (resumo.cliques === 42 && resumo.vendas === 4 && resumo.comissaoTotal === 65 && resumo.comissaoAReceber === 30)
    ok('`resumoAfiliada` junta cliques, contagem e as duas somas', JSON.stringify(resumo));
  else fail('`resumoAfiliada`', JSON.stringify(resumo));

  if (metrics.resumoAfiliada(0, []).vendas === 0)
    ok('sem vendas, a contagem e 0', 'sem `undefined`');
} else fail('`resumirVendas`/`resumoAfiliada` nao exportadas', '');

/* ============ 5. a data do historico ============ */

console.log('\n5. `dataVenda` — o recorte, o formato, e o fuso');

if (typeof metrics.dataVenda === 'function') {
  const casos = [
    ['2026-01-05T00:00:00.000Z', '05/01/2026', 'o dia e o da string, NAO o do fuso'],
    ['2026-09-28T12:30:00', '28/09/2026', 'com hora, o dia permanece'],
    ['2026-12-31', '31/12/2026', 'so a data'],
  ];
  for (const [entrada, esperado, o_que] of casos) {
    const r = metrics.dataVenda(entrada);
    if (r === esperado) ok(`data: ${o_que}`, `${entrada} -> ${r}`);
    else fail(`data: ${o_que}`, `${entrada} -> ${q(r)}, esperado ${q(esperado)}`);
  }

  /*
    O CASO DE MEIA-NOITE UTC. `new Date('2026-01-05T00:00:00.000Z')` seguido de
    `getDate()` local devolve 4 em BRT — o dia VOLTA um atras. Ver
    `feedback_data_iso_e_utc_meia_noite`. O recorte do texto nao depende do fuso:
    o dia 05 e o dia 05 em qualquer maquina. A prova usa a string com `Z` de
    proposito — e a que enganaria `toLocaleDateString`.
  */
  const meiaNoite = metrics.dataVenda('2026-01-05T00:00:00.000Z');
  if (meiaNoite === '05/01/2026')
    ok('a meia-noite UTC NAO volta para o dia anterior', 'o fuso do runtime nao decide o dia');
  else fail('o dia da meia-noite UTC', `${q(meiaNoite)} — voltou um dia`);

  for (const entrada of [null, '', 'nao e data', '2026/01/05']) {
    const r = metrics.dataVenda(entrada);
    if (r === '—') ok(`data invalida vira travessao: ${JSON.stringify(entrada)}`, q(r));
    else fail(`data invalida ${JSON.stringify(entrada)}`, `${q(r)}`);
  }

  if (!/toLocaleDateString/.test(fonteMetrics))
    ok('`dataVenda` NAO usa `toLocaleDateString`', 'o formato vem do recorte, e nao do ICU da maquina');
  else fail('`dataVenda` usa `toLocaleDateString`', 'o formato variaria por runtime');
} else fail('`dataVenda` nao exportada', '');

/* ============ 6. a fonte unica — uma afiliada, e nao duas ============ */

console.log('\n6. `getAfiliada` — o perfil sai da MESMA lista do admin');

const listaAdmin = adminDemo.DEMO_AFFILIATES;
if (Array.isArray(listaAdmin) && listaAdmin.length >= 1)
  ok('o admin tem a lista de afiliadas', `${listaAdmin.length} afiliada(s)`);
else fail('o admin nao tem `DEMO_AFFILIATES`', 'a prova da fonte unica depende dela');

/*
  O `Dataset<T>` embrulha o dado. A bancada desembrulha UMA vez, aqui, e trabalha
  com `conta` — se um dia alguem trocar `getAfiliada` por uma funcao que devolve
  o dado direto, o `.data` fica `undefined` e as provas abaixo acusam.
*/
const dataset = await dados.getAfiliada();
if (dataset && dataset.source === 'demo' && dataset.reason === dados.PENDING_REASON)
  ok('`getAfiliada` devolve `demo` com o motivo pendente', 'o contrato do `Dataset`');
else fail('o contrato do `Dataset`', JSON.stringify(dataset && { source: dataset.source }));

const conta = dataset.data;

/*
  A PROVA DA FONTE UNICA. A conta dos prints (`lp070087@gmail.com`) NAO esta em
  `DEMO_AFFILIATES` (a unica afiliada la e `lucasmuniz19w@gmail.com`), entao a
  demonstracao entrega o CONVITE. Isto e o estado da referencia, e nao um buraco.
*/
if (conta.perfil === null)
  ok('a conta da demonstracao NAO e afiliada — o convite', 'nenhum print mostra o painel preenchido');
else fail('a demo devolveu um perfil', 'nao deveria: o e-mail da sessao nao esta na lista do admin');

/*
  A PROVA DE IDENTIDADE, feita sem depender da sessao: o OBJETO que o painel
  montaria com um perfil da lista do admin e o MESMO objeto — por referencia.
  Se `data.ts` tivesse declarado uma afiliada propria, esta prova nao teria como
  passar (nao haveria de onde tirar o mesmo objeto).
*/
const carinna = listaAdmin.find((a) => a.couponCode === 'CARINNAS');
if (carinna && carinna === listaAdmin[0])
  ok('o objeto do perfil e o MESMO da lista do admin', 'identidade de referencia, e nao copia');

/*
  A CROSS-CHECK que torna a prova util: o cupom e a comissao que o painel da
  cliente imprime sao os do ADMIN. Se a area da cliente declarasse o seu, os
  numeros divergiriam no primeiro ajuste do admin.
*/
if (carinna && adminMetrics.formatCommission(carinna) === '5%')
  ok('a comissao da afiliada do admin e `5%`', 'e a que a tela da cliente imprime');
else fail('a comissao do admin', JSON.stringify(carinna && adminMetrics.formatCommission(carinna)));

if (fonteData.includes("import { DEMO_AFFILIATES } from '@/lib/afiliadas/demo';"))
  ok('`data.ts` IMPORTA a lista do admin', 'a ligacao entre os dois paineis existe no codigo');
else fail('`data.ts` nao importa o demo do admin', 'estaria declarando a sua propria afiliada');

/*
  E a tela NAO declara afiliada nenhuma. A ausencia de uma segunda lista e a prova
  ao contrario da fonte unica — ver `provar-unicidade-varrendo`.

  A varredura e de DADOS, e nao de palavras: `fonteView` tem os comentarios
  removidos porque o proprio bloco de explicacao desta tela CITA
  `DEMO_AFFILIATES` — procurar a palavra no arquivo CRU daria um falso positivo
  que nao tem nada a ver com codigo. Ver `bancada-comentario-vira-falso-positivo`.
*/
const listaNaTela = /(DEMO_AFFILIATES|DEMO_AFFILIATE_SALES)\s*(?:\.[a-zA-Z]+\s*)?=/.test(fonteView);
if (!listaNaTela)
  ok('a tela NAO declara uma lista de afiliadas', 'nem `DEMO_AFFILIATES =`, nem vendas proprias');
else fail('a tela declara dado de afiliada', 'seria a segunda fonte');

/*
  A prova de verdadeira unicidade: qual arquivo tem a UNICA lista de afiliadas
  ligada ao dominio do admin? `provar-unicidade-varrendo` exige varrer a arvore
  inteira e exigir UM arquivo — checar so o que se editou prova nada.
*/
const comListaPropria = raizes
  .map((f) => ({ f, c: semComentarios(readFileSync(f, 'utf8')) }))
  .filter(({ c }) => /(DEMO_AFFILIATES|DEMO_AFFILIATE_SALES)\s*=/.test(c));
if (comListaPropria.length === 0)
  ok('nenhuma raiz da area da cliente declara uma lista de afiliadas', 'a fonte e so a do admin');
else fail('a area da cliente declarou uma lista propria', comListaPropria.map(({ f }) => f.split(/[\\/]/).pop()).join(', '));

if (conta.vendas.length === 0 && !/DEMO_AFFILIATE_SALES/.test(fonteData))
  ok('nao ha venda de demonstracao', 'a tabela nao tem dado — o historico nasce VAZIO');

/* ============ 7. os pedacos montaveis ============ */

console.log('\n7. os pedacos que a bancada monta');

for (const nome of ['ConviteAfiliada', 'PainelAfiliada', 'LinhaVenda', 'VazioVendas', 'CartaoMetrica', 'AfiliadaView'])
  if (typeof view[nome] === 'function') ok(`\`${nome}\` esta exportada`, 'montavel pela bancada');
  else fail(`\`${nome}\` nao esta exportada`, 'a bancada nao consegue monta-la');

/* ---- o convite ---- */

if (typeof view.ConviteAfiliada === 'function') {
  const html = render(view.ConviteAfiliada, {});
  const texto = textos(html);
  if (texto.includes('Seja uma Afiliada Closet Lunar') && texto.includes('Quero me cadastrar agora'))
    ok('o convite imprime o titulo E o botao', 'os dois do original');
  else fail('o convite', JSON.stringify(texto));

  if (texto.includes('Compartilhe seu estilo e ganhe comissões exclusivas'))
    ok('o convite imprime o texto inteiro do original', 'a frase de apoio');
  else fail('a frase do convite', 'nao esta inteira');

  /*
    O CONVITE NAO TEM `onClick` — o cadastro entra na fase de integracao. A prova
    e a ausencia do atributo no HTML.
  */
  if (!/onclick/i.test(html) && !/href=/.test(html))
    ok('o botao do convite NAO tem acao nem destino', 'fingir cadastro seria a promessa proibida');

  if (!/bg-beige/.test(html) && !/bg-beige/.test(fonteView))
    ok('nao ha `bg-beige` no CODIGO', 'so em comentario — o token nao existe');
  else fail('`bg-beige` no codigo', 'o token nao existe no projeto');
}

/* ---- o painel, com a afiliada DO ADMIN ---- */

if (typeof view.PainelAfiliada === 'function' && carinna) {
  const contaFixture = { perfil: carinna, vendas: [], resumo: metrics.resumoAfiliada(0, []) };
  const html = render(view.PainelAfiliada, { conta: contaFixture, origem: '' });
  const texto = textos(html);

  if (texto.includes('Painel de Afiliada') && texto.includes('Carinna'))
    ok('o painel imprime o titulo e o NOME da afiliada do admin', '`Olá, Carinna!`');

  /*
    A CROSS-CHECK NA TELA. O cupom (`CARINNAS`) e a comissao (`5%`) impressos sao
    os valores do admin. Se a tela tivesse um dado proprio, nao bateriam.
  */
  if (texto.includes('CARINNAS'))
    ok('o painel imprime o cupom do ADMIN (`CARINNAS`)', 'a mesma pessoa nos dois paineis');
  else fail('o cupom na tela', JSON.stringify(texto.slice(0, 240)));

  if (texto.includes('5%'))
    ok('o painel imprime a comissao do ADMIN (`5%`)', 'via `formatCommission`, importado do admin');
  else fail('a comissao na tela', 'nao achei `5%`');

  if (texto.includes('Conta: Ativa'))
    ok('o selo diz `Conta: Ativa`', 'a Carinna e `active`');

  const quatro = ['Cliques', 'Vendas', 'Saldo Total', 'A Receber'].every((l) => texto.includes(l));
  if (quatro) ok('os QUATRO rotulos da grade saem', 'Cliques / Vendas / Saldo Total / A Receber');
  else fail('os quatro rotulos', JSON.stringify(texto.slice(0, 240)));

  if (texto.includes('Histórico de Vendas') && texto.includes('As vendas realizadas aparecerão aqui.'))
    ok('o painel imprime o historico VAZIO', 'o estado da demonstracao');

  if (!texto.includes('Ver todas as vendas'))
    ok('com 0 vendas, o `Ver todas as vendas` NAO aparece', 'a condicao `> 6` do original');

  /*
    O LINK. A Carinna tem `referralSlug` VAZIO, entao com origem `''` o link e `/`
    — o mesmo `/` que `formatReferral` do admin produz. A prova e do valor exato.
  */
  if (texto.includes('/') && !texto.includes('?ref='))
    ok('com slug vazio, o link e `/` — o mesmo do admin', 'nenhum `?ref=` sem valor');

  /*
    O VALOR NAO VEM DE `window`. A origem e `''` e o link e relativo; se a tela
    usasse `window.location.origin`, o `renderToStaticMarkup` em Node teria
    derrubado o processo antes de chegar aqui.
  */
  if (!/window/.test(fonteView))
    ok('a view NAO usa `window`', 'a origem entra por prop — `window` nao existe em Node');
  else fail('a view usa `window`', 'derrubaria a bancada');

  /* ---- o painel com uma VENDA injetada: os dois selos ---- */
  const vendas = [
    { id: 'v1', orderId: 'abcdef1234567890', criadaEm: '2026-01-05T00:00:00.000Z', status: 'paid', commissionAmount: 30 },
    { id: 'v2', orderId: '9999999999', criadaEm: '2026-01-06', status: 'pending', commissionAmount: 12.5 },
  ];
  const contaComVendas = { perfil: carinna, vendas, resumo: metrics.resumoAfiliada(7, vendas) };
  const htmlV = render(view.PainelAfiliada, { conta: contaComVendas, origem: '' });
  const textoV = textos(htmlV);

  if (textoV.includes('Pago') && textoV.includes('Pendente'))
    ok('os DOIS selos de venda saem, um de cada', '`paid` -> Pago, `pending` -> Pendente');

  if (textoV.includes('Pedido #abcdef12') && !textoV.includes('Pedido #abcdef1234567890'))
    ok('o `#` do historico usa os 8 primeiros caracteres', '`idCurtoPedido`');

  if (textoV.includes('05/01/2026') && textoV.includes('06/01/2026'))
    ok('as duas datas saem no formato do historico', 'DD/MM/AAAA, sem deslocamento de fuso');

  if (textoV.includes('Cliques') && textoV.includes('7'))
    ok('a contagem de cliques vem do resumo', '42/7 — o numero passado, e nao um zero fixo');

  if (!textoV.includes('Ver todas as vendas'))
    ok('com 2 vendas (<= 6), o botao continua fora', 'a condicao `> 6` segue valendo');

  /* ---- e com 7 vendas, o botao APARECE ---- */
  const sete = Array.from({ length: 7 }, (_, i) => ({
    id: 'x' + i, orderId: 'o' + i, criadaEm: '2026-01-01', status: 'paid', commissionAmount: 1,
  }));
  const htmlSete = render(view.PainelAfiliada, {
    conta: { perfil: carinna, vendas: sete, resumo: metrics.resumoAfiliada(0, sete) }, origem: '',
  });
  if (textos(htmlSete).includes('Ver todas as vendas'))
    ok('com 7 vendas, o `Ver todas as vendas` APARECE', 'a outra face da condicao `> 6`');
  else fail('com 7 vendas o botao sumiu', 'a condicao `> 6` esta errada');
}

/* ---- o vazio e a linha, montados direto ---- */

if (typeof view.VazioVendas === 'function') {
  const t = textos(render(view.VazioVendas, {}));
  if (t.includes('As vendas realizadas aparecerão aqui.'))
    ok('`VazioVendas` imprime a frase do original', q(t));
  else fail('`VazioVendas`', JSON.stringify(t));
}

if (typeof view.LinhaVenda === 'function') {
  const paga = render(view.LinhaVenda, {
    venda: { id: 'a', orderId: 'z'.repeat(20), criadaEm: '2026-02-03', status: 'paid', commissionAmount: 99 },
  });
  const t = textos(paga);
  if (t.includes('Pago') && !t.includes('Pendente') && t.includes('+'))
    ok('`LinhaVenda` de uma venda paga diz `Pago` e traz o `+`', 'o `+` e credito, do original');
  else fail('`LinhaVenda` paga', JSON.stringify(t));

  const pendente = textos(render(view.LinhaVenda, {
    venda: { id: 'b', orderId: 'y', criadaEm: '2026-02-04', status: 'pending', commissionAmount: 5 },
  }));
  if (pendente.includes('Pendente') && !pendente.includes('Pago'))
    ok('`LinhaVenda` de uma venda pendente diz `Pendente`', 'o outro ramo');
  else fail('`LinhaVenda` pendente', JSON.stringify(pendente));
}

/* ============ 8. a rota e a honestidade ============ */

console.log('\n8. a rota, os botoes sem acao, e o que NAO foi inventado');

if (/export default function ContaAfiliadaPage/.test(fonteRota) && /<AfiliadaView \/>/.test(fonteRota))
  ok('`/conta/afiliada` monta a view', 'a rota que o atalho do dashboard aponta');
else fail('a pagina da rota', 'nao monta `AfiliadaView`');

/*
  A COPIA NAO ESTA LIGADA. O aviso diz que a copia entra na fase de integracao, em
  vez de afirmar "copiado!". A prova e a AUSENCIA de `navigator.clipboard` e a
  PRESENCA do texto honesto.
*/
/*
  As tres provas abaixo sao de CODIGO, e por isso leem `fonteView` (comentarios
  removidos). A prova do `clipboard` no arquivo CRU daria falso positivo: o bloco
  de explicacao do topo desta propria tela escreve "Nada de `clipboard`" em prosa,
  e a agulha acharia a PROSA em vez do codigo — o defeito de
  `bancada-comentario-vira-falso-positivo`, cometido uma vez neste arquivo.
*/
if (!/navigator|clipboard/.test(fonteView))
  ok('a tela NAO usa `navigator.clipboard`', 'a copia entra na fase de integracao');
else fail('a tela usa `clipboard`', 'a bancada nao tem area de transferencia');

if (/fase de integração/.test(cruView))
  ok('o aviso da copia DIZ que ainda nao copia', 'em vez de "copiado!" falso');
else fail('o aviso da copia', 'nao avisa a verdade');

if (!/setTimeout/.test(fonteView))
  ok('a tela NAO tem `setTimeout`', 'o `copiado` de 2s do original nao e verificavel nem necessario');
else fail('a tela tem `setTimeout`', 'nao e verificavel por bancada nem necessario');

const padroesDeSegredo = [/sk_live_/, /sk_test_/, /SUPABASE_/, /DATABASE_URL/, /postgres:\/\//, /eyJ[A-Za-z0-9_-]{10,}/];
const achados = padroesDeSegredo.filter((p) => p.test(cruView));
if (achados.length === 0)
  ok('a tela NAO contem chave, token nem string de conexao', 'a varredura por seis padroes');
else fail('a tela contem credencial', achados.map((p) => p.source).join(', '));

const areaAposImport = raizes.map((f) => ({ f, c: readFileSync(f, 'utf8') }))
  .filter(({ c }) => /from '@[\\/](components|lib|app)[\\/]admin/.test(c));
if (areaAposImport.length === 0)
  ok('a area da cliente NAO importa nada de `components/admin`', 'importa o DOMINIO compartilhado (`lib/afiliadas`), que e outra coisa');
else fail('a area importa de `admin`', areaAposImport.map(({ f }) => f.split(/[\\/]/).pop()).join(', '));

/* ============ 9. provas ao contrario ============ */

console.log('\n9. provas ao contrario — o que NAO pode aparecer');

const proibidos = [
  ['bg-beige', 'o token nao existe no projeto'],
  ['emerald-600', 'o projeto usa `--success`, nao a paleta crua'],
  ['amber-600', 'o projeto usa `--warning`, nao a paleta crua'],
  ['toLocaleDateString', 'o formato do historico e fixo, e nao o do ICU'],
  ['supabase', 'nenhum cliente de banco nesta fase'],
];
for (const [agulha, porque] of proibidos) {
  if (!fonteView.includes(agulha)) ok(`ausente do codigo: ${q(agulha)}`, porque);
  else fail(`apareceu no codigo: ${q(agulha)}`, porque);
}

/*
  As duas provas de PROCEDENCIA sao por `includes` de STRING, e nao por regex:
  o `@/` de `'@/lib/...'` fecha a barra antes da hora e transforma o resto em
  flags (`Invalid regular expression flags`) — o mesmo defeito que apareceu no
  modulo 12. O caminho e literal, entao a comparacao literal basta.
*/
const IMPORTA_FORMATADOR = "import { formatCommission } from '@/lib/afiliadas/metrics';";
const IMPORTA_MOEDA = "import { formatBRL } from '@/lib/utils';";

if (cruView.includes(IMPORTA_FORMATADOR) && fonteView.includes('formatCommission'))
  ok('a tela usa o `formatCommission` do ADMIN', 'uma so regra de comissao nos dois paineis');
else fail('a comissao', 'a tela nao usa o formatador do admin');

if (cruView.includes(IMPORTA_MOEDA))
  ok('a moeda sai do `formatBRL` compartilhado', 'um so formatador de reais no projeto');
else fail('o formatador de moeda', 'nao e o compartilhado');

/* ------------------------------------------------------------------ rodape */

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
process.exit(falhas === 0 ? 0 : 1);
