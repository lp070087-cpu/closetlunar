/**
 * Bancada de `Segurança` da area da cliente (fase 2, modulo 12).
 *
 * ================== O QUE ESTA BANCADA PROVA, E POR QUE ELA E A MAIS DENSA DA AREA ==================
 *
 * `SegurancaView` carrega o ultimo acesso num `useEffect`. O
 * `renderToStaticMarkup` NAO roda efeito — a view montada sai em
 * `Carregando...`. Mesmo limite de `AccountView`, `AddressesView`, `ClubeView`,
 * `CouponsView`.
 *
 * Mas esta tela tem MAIS pedacos montaveis do que as anteriores, e por isso a
 * bancada dela e a mais densa:
 *
 *   `validarSenha`   funcao PURA, exportada, com dois ramos e uma ORDEM que
 *                    importa. E o unico lugar do modulo onde uma inversao
 *                    passaria no typecheck sem reclamar (ver
 *                    `feedback_condicao_booleana_invisivel`), e so aqui ela cai.
 *
 *   `ultimoAcesso`   funcao PURA, exportada, com o formato do print e o `—` do
 *                    vazio. Formato e o que se prova por assercao de string.
 *
 *   `CampoSenha`     montavel. Carrega o `type="password"` (que o original tem) e
 *                    os dois `placeholder` (que sao ATRIBUTO — ver a armadilha
 *                    abaixo).
 *
 *   `SeloIcone` /
 *   `CabecalhoCartao` montaveis, sem estado.
 *
 * ================== A ARMADILHA JA CONHECIDA, E O QUE ELA MUDA AQUI ==================
 *
 * `textos()` tira as TAGS e os ATRIBUTOS junto (`html.replace(/<[^>]+>/g, ' ')`).
 * Logo um `placeholder` NAO existe no texto limpo — ele e atributo. Ver
 * `feedback_bancada_placeholder_atributo.md`. Esta bancada procura os dois
 * `placeholder` no HTML CRU, e o ROTULO no texto limpo. E, pelo mesmo motivo,
 * prova que a SENHA digitada NAO vaza para o texto (so para o atributo `value`,
 * que e o unico lugar onde um input controlado pode estar).
 *
 * ================== AS FONTES DESTA TELA ==================
 *
 *   o print `cli-019` (`004914`)  ->  o cabecalho, o cartao `Alterar Senha`
 *                                     inteiro, e o topo do `Sessões & Acesso`
 *   o print `cli-020` (`004922`)  ->  o resto do `Sessões & Acesso`, o
 *                                     `ÚLTIMO LOGIN`, e a barra tracejada
 *   `conta.seguranca.tsx`         ->  o COMPORTAMENTO: as duas validacoes, a
 *                                     ordem delas, o `confirm`, e os textos
 *
 * ================== A GEOMETRIA: O QUE ELA DISTINGUE ==================
 *
 * Como no modulo 11, as medidas abaixo nao dizem "esta perto" — cada uma
 * separa DUAS declaracoes plausiveis:
 *
 *   largura da coluna 1049 px   ->  `gap-8` (e nao `gap-6`, que daria 1053)
 *   recuo do botao 41 px        ->  `md:p-10` (e nao `p-8`, que daria 33)
 *   largura do botao 967 px     ->  `w-full` dentro do `p-10` (1049 - 82 = 967)
 *   altura do botao 48 px       ->  `h-12`
 *   altura da barra 65 px       ->  `p-6` + caixa `text-xs` (24 + 18 + 24 = 66)
 *
 * A prova mais forte e a LARGURA DO BOTAO: 967 = 1049 - 2 x 41 EXATO. Ela amarra
 * de uma vez a largura da coluna, o `p-10` e o `w-full`.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Cor de pixel (navegador). O clique real. E, principalmente: NAO prova que a
 * senha e trocada nem que as sessoes sao encerradas — nao sao. O que se prova e
 * que as duas acoes existem, que as duas devolvem `{ ok: false }`, e que a tela
 * DIZ isso em vez de mostrar um sucesso que nao aconteceu.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-seguranca.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-seguranca');
const ORIGINAL = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.seguranca.tsx',
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

/**
 * AS RAIZES — `lib/cliente` + `components/cliente` + `app/(cliente)`. A tela nao
 * atravessa a ponte com o admin: a sessao da cliente e uma leitura de
 * `auth.users`, e nao um pedido.
 */
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
const view = require(join(OUT, 'src/components/cliente/seguranca-view.js'));
const casca = require(join(OUT, 'src/components/cliente/account-shell.js'));

/* ------------------------------------------------------------- utilidades */

const normalizar = (s) => s.replace(/[\s ]+/g, ' ').trim();
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

/**
 * ================== A GEOMETRIA MEDIDA NOS DOIS PRINTS ==================
 *
 * Coordenadas da CAPTURA, na escala 1x — a mesma ancora dos outros modulos
 * (sidebar 259 px, pilula ativa 29 px, coracao 30 px, botao de `Endereços` 48 px,
 * cartao de `Dados da Conta`). O predicado de borda e o mesmo: tinta
 * `--border` = (233,227,223), tolerancia 12.
 */
const G = {
  /** O painel de conteudo, de canto a canto (`cli-019`). */
  painelEsq: 314,
  painelDir: 2526,
  /** O cartao `Alterar Senha`, na coluna da esquerda. */
  cardEsqEsq: 355,
  cardEsqDir: 1404,
  /** O cartao `Sessões & Acesso` + a barra, na coluna da direita. */
  cardDirEsq: 1437,
  cardDirDir: 2485,
  /** O botao escuro `ATUALIZAR SENHA`. */
  botaoEsq: 396,
  botaoDir: 1363,
  botaoTopo: 630,
  botaoBase: 678,
  /** A barra tracejada `Deseja sair da sua conta?`. */
  barraTopo: 721,
  barraBase: 786,
};

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const cruView = arquivo('src/components/cliente/seguranca-view.tsx');
const fonteView = semComentarios(cruView);
const cruCasca = arquivo('src/components/cliente/account-shell.tsx');
const fonteCasca = semComentarios(cruCasca);
const fonteRota = arquivo('src/app/(cliente)/conta/seguranca/page.tsx');
const fonteData = semComentarios(arquivo('src/lib/cliente/data.ts'));
const fonteTipos = semComentarios(arquivo('src/lib/cliente/types.ts'));
const fonteNav = semComentarios(arquivo('src/lib/cliente/nav.ts'));
const cruCss = readFileSync(join(PROJ, 'src/app/globals.css'), 'utf8');

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `conta.seguranca.tsx` — o que o original declara');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a fonte do COMPORTAMENTO desta tela');

  /**
   * Cada frase e buscada nos DOIS lados: se o original a declara e a tela nao, a
   * transcricao perdeu um pedaco que existe em fonte.
   */
  const declaracoes = [
    ['Segurança', 'o titulo do painel'],
    ['Proteja sua conta e gerencie suas sessões ativas.', 'a descricao'],
    ['Alterar Senha', 'o titulo do cartao da esquerda'],
    ['Nova Senha', 'o rotulo do primeiro campo'],
    ['Confirmar Senha', 'o rotulo do segundo campo'],
    ['Mínimo 6 caracteres', 'o placeholder E a frase da validacao curta'],
    ['Repita a nova senha', 'o placeholder da confirmacao'],
    ['ATUALIZAR SENHA', 'o texto do botao'],
    ['Sessões & Acesso', 'o titulo do cartao da direita'],
    ['Último Login', 'o rotulo do ultimo acesso'],
    ['Encerrar todas as sessões', 'o texto do botao de encerrar'],
    ['Deseja sair da sua conta?', 'a pergunta da barra tracejada'],
    ['Logout', 'o texto do botao da barra'],
    ['Senhas não conferem', 'a segunda frase da validacao'],
    ['Encerrar todas as sessões? Você precisará entrar novamente.', 'a pergunta do confirm'],
  ];
  for (const [frase, o_que] of declaracoes) {
    const noOriginal = fonteOriginal.includes(frase);
    const naTela = cruView.includes(frase);
    if (noOriginal && naTela) ok(`transcrito: ${o_que}`, q(frase));
    else fail(`transcricao de ${o_que}`, `original=${noOriginal} tela=${naTela} ${q(frase)}`);
  }

  /**
   * O ORIGINAL USA `supabase`, E A TELA NAO PODE. Se `supabase` aparecesse aqui,
   * seria um cliente de banco inventado dentro de uma fase que ainda nao tem
   * banco — ver "NAO invente credenciais". Prova ao contrario, e das boas.
   */
  if (fonteOriginal.includes('supabase.auth.updateUser') && fonteOriginal.includes('signOut'))
    ok('o original fecha as sessoes pelo `supabase.auth`', 'a fonte que NAO foi transcrita');
  else fail('o original nao usa `supabase.auth`', 'a premissa da prova abaixo caiu');

  if (!/supabase/i.test(cruView) && !/[^a-z]auth\.(updateUser|signOut)/.test(cruView))
    ok('a tela NAO carrega cliente de autenticacao nenhum', 'nem `supabase`, nem `auth.*`');
  else fail('a tela carrega autenticacao', 'a tela nao pode falar com provedor nesta fase');
}

/* ============ 2. o comportamento: `validarSenha`, puro ============ */

console.log('\n2. `validarSenha` — os dois ramos, a ordem, e a fronteira');

if (typeof view.validarSenha !== 'function') {
  fail('`validarSenha` nao foi exportada', 'a bancada nao consegue provar a validacao');
} else {
  const ERRO_CURTA = view.ERRO_CURTA;
  const ERRO_DIFERENTE = view.ERRO_DIFERENTE;

  if (ERRO_CURTA === 'Mínimo 6 caracteres' && ERRO_DIFERENTE === 'Senhas não conferem')
    ok('as duas frases de erro sao as do original', `${q(ERRO_CURTA)} / ${q(ERRO_DIFERENTE)}`);
  else fail('as frases de erro', `${q(ERRO_CURTA)} / ${q(ERRO_DIFERENTE)}`);

  const casos = [
    ['12345', '12345', ERRO_CURTA, 'curta (5) e iguais'],
    ['', '', ERRO_CURTA, 'vazia'],
    ['1', '1', ERRO_CURTA, 'um caractere'],
    ['12345', '99999', ERRO_CURTA, 'CURTA e DIFERENTES — prova a ORDEM'],
    ['123456', '1234567', ERRO_DIFERENTE, 'longa (6) e diferentes'],
    ['1234567890', '123456789', ERRO_DIFERENTE, 'quase iguais'],
  ];
  for (const [a, b, esperado, o_que] of casos) {
    const r = view.validarSenha(a, b);
    if (r === esperado) ok(`recusa: ${o_que}`, q(r));
    else fail(`recusa: ${o_que}`, `devolveu ${JSON.stringify(r)}, esperado ${q(esperado)}`);
  }

  /*
    A FRONTEIRA. `length < 6` e `length <= 6` concordam em TUDO menos aqui — e e
    por isso que o caso existe. Sem ele, um `<` trocado por `<=` passaria em todos
    os outros casos e passaria no typecheck.
  */
  const fronteira = view.validarSenha('123456', '123456');
  if (fronteira === null)
    ok('aceita: exatamente 6 caracteres', 'a fronteira de `length < 6`');
  else fail('a fronteira de 6 caracteres', `devolveu ${JSON.stringify(fronteira)}, esperado null`);

  const cincoComConfirmacaoLonga = view.validarSenha('12345', '1234567890');
  if (cincoComConfirmacaoLonga === ERRO_CURTA)
    ok('com 5 e a confirmacao diferente, o erro e o da CURTA', 'a ordem outra vez, por outro caminho');
  else fail('a ordem, por outro caminho', `${JSON.stringify(cincoComConfirmacaoLonga)}`);

  if (typeof view.validarSenha('123456', '123456') === 'object' && view.validarSenha('123456', '123456') === null)
    ok('o sucesso devolve `null`, e nao um objeto', 'o tipo diz "pode seguir" sem inventar mensagem');
  else fail('o sucesso devolve `null`', 'a funcao nao pode devolver outra coisa no caminho feliz');
}

/* ============ 3. o formato do ultimo acesso ============ */

console.log('\n3. `ultimoAcesso` — o formato do print, e o `—` do vazio');

if (typeof metrics.ultimoAcesso !== 'function') {
  fail('`ultimoAcesso` nao foi exportada', 'a bancada nao consegue provar o formato');
} else {
  /*
    SEM FUZO NA STRING. `new Date('2026-09-28T00:45:51')` (sem `Z`, sem offset) e
    parseado como hora LOCAL, por especificacao — entao `getHours()` devolve 0
    aqui e devolveria 0 em qualquer maquina. E isso que torna a prova de FORMATO
    independente do fuso de quem roda a bancada. Uma string com `Z` nao serviria:
    ela daria 21:45 em Sao Paulo e 00:45 em UTC, e a prova passaria ou falharia
    conforme a maquina.
  */
  const casos = [
    ['2026-09-28T00:45:51', '28/09/2026, 00:45:51', 'a data do print `cli-020`'],
    ['2026-01-05T03:04:05', '05/01/2026, 03:04:05', 'mes, dia, hora e minuto com zero a esquerda'],
    ['2026-12-31T23:59:59', '31/12/2026, 23:59:59', 'o ultimo segundo do ano'],
    ['2026-06-01T09:00:00', '01/06/2026, 09:00:00', 'o primeiro dia do mes na hora cheia'],
  ];
  for (const [entrada, esperado, o_que] of casos) {
    const r = metrics.ultimoAcesso(entrada);
    if (r === esperado) ok(`formata: ${o_que}`, `${entrada} -> ${r}`);
    else fail(`formatacao de ${o_que}`, `${entrada} -> ${JSON.stringify(r)}, esperado ${q(esperado)}`);
  }

  /*
    O `—` NAO E UM DETALHE DE ESTILO: e a diferenca entre "nao ha registro" e "ha
    um registro que eu nao sei". Uma data falsa no lugar seria pior do que nada.
  */
  for (const entrada of [null, '', 'nao e uma data', '   ']) {
    const r = metrics.ultimoAcesso(entrada);
    if (r === '—') ok(`o vazio vira travessao: ${JSON.stringify(entrada)}`, q(r));
    else fail(`o vazio ${JSON.stringify(entrada)}`, `devolveu ${JSON.stringify(r)}, esperado '—'`);
  }

  /*
    A VIRGULA. `toLocaleString('pt-BR')` sepra data e hora por virgula; um estilo
    a mao sem ela daria `28/09/2026 00:45:51`, que passa em toda prova de "contem
    a data" e erra o que o print mostra. Prova estreita de proposito.
  */
  const r = metrics.ultimoAcesso('2026-09-28T00:45:51');
  if (r.includes(', ')) ok('a virgula separa data e hora', 'o separador do print');
  else fail('o separador entre data e hora', `sem virgula em ${JSON.stringify(r)}`);

  if (!/2026-09-28/.test(r) && !r.includes('T00'))
    ok('a saida NAO e ISO', 'a tela nao pode mostrar formato de banco');
  else fail('a saida parece ISO', `${JSON.stringify(r)}`);

  /*
    E A PROVA MAIS FINA DESTA SECAO: a hora NAO passa por UTC. `getHours()`
    escolhe a hora local; `getUTCHours()` escolheria a do meridiano. As duas
    concordam em 00:45:51 no fuso zero — entao a prova tem que usar uma hora que
    as separe. A 21:00 de um dia, `getHours` local (America/Sao_Paulo) da 21 e
    `getUTCHours` daria 00, do dia seguinte. Como a bancada roda em UTC, o que se
    prova AQUI e so a FORMA; a escolha do fuso esta documentada em `metrics.ts` e
    verificada no STATUS, e nao por esta assercao. O que esta prova garante e o
    que da: que a funcao nao usa a data ISO crua.
  */
  const dia = metrics.ultimoAcesso('2026-09-28T00:45:51').slice(0, 10);
  if (dia === '28/09/2026') ok('o DIA e o da entrada, e nao o do meridiano', dia);
  else fail('o dia', `${dia}`);
}

/* ============ 4. a escrita que nao grava — e diz isso ============ */

console.log('\n4. as duas escritas devolvem `{ ok: false }`, com o motivo honesto');

const PENDING = dados.PENDING_REASON;
if (typeof PENDING === 'string' && PENDING.includes('Neon/PostgreSQL'))
  ok('o motivo pendente e o do projeto, e nao um texto proprio', q(PENDING));
else fail('o `PENDING_REASON`', JSON.stringify(PENDING));

if (typeof dados.getAcesso === 'function' && typeof dados.salvarSenha === 'function' && typeof dados.encerrarSessoes === 'function')
  ok('as tres funcoes do modulo existem em `data.ts`', 'getAcesso / salvarSenha / encerrarSessoes');
else fail('as funcoes do modulo', 'falta pelo menos uma de getAcesso/salvarSenha/encerrarSessoes');

const acesso = await dados.getAcesso();
if (acesso && acesso.source === 'demo' && acesso.data && acesso.data.ultimoAcessoEm === null && acesso.reason === PENDING)
  ok('`getAcesso` devolve o vazio explicito, e nao uma data falsa', 'source=demo, ultimoAcessoEm=null');
else fail('`getAcesso`', JSON.stringify(acesso));

/*
  A SENHA NAO ENTRA NA FUNCAO. `salvarSenha` nao recebe parametro nenhum — se
  recebesse, haveria um valor de senha circulando num tipo do dominio, e um
  `console.log` de depuracao o imprimiria. A prova e a ARIDADE, e nao um texto.
*/
if (dados.salvarSenha.length === 0)
  ok('`salvarSenha` NAO aceita a senha por parametro', 'a senha nao passa por tipo nenhum');
else fail('`salvarSenha` recebe parametro', `${dados.salvarSenha.length} — a senha entraria no dominio`);

for (const [nome, fn] of [['salvarSenha', dados.salvarSenha], ['encerrarSessoes', dados.encerrarSessoes]]) {
  const r = await fn();
  if (r && r.ok === false && typeof r.reason === 'string' && r.reason === PENDING)
    ok(`\`${nome}\` nao grava e DIZ que nao gravou`, 'ok:false + o motivo pendente');
  else fail(`\`${nome}\``, JSON.stringify(r));
}

/*
  A TELA MOSTRA O MOTIVO. Se o texto do motivo nao estivesse na tela, o `{ ok:
  false }` nao chegaria a ninguem e o botao pareceria nao fazer nada. A prova e o
  `reason ?? ...` na fonte — o caminho de fallback que existe para quando o
  provedor devolver um motivo sem texto.
*/
if (/reason \?\? 'Ainda não foi possível salvar\.'/.test(fonteView) && /reason \?\? 'Ainda não foi possível encerrar\.'/.test(fonteView))
  ok('as duas falhas caem no aviso da tela, com texto de reserva', 'o `reason ?? ...` nas duas');
else fail('o motivo nao chega a tela', 'nao achei os dois `reason ?? ...` na view');

/* ============ 5. a geometria, e o que ela distingue ============ */

console.log('\n5. a geometria medida — cada numero separa duas declaracoes');

const internoEsq = G.painelEsq + 41;
const internoDir = G.painelDir - 41;
const larguraInterna = internoDir - internoEsq;
const larguraColuna = G.cardEsqDir - G.cardEsqEsq;
const gapMedido = G.cardDirEsq - G.cardEsqDir;

if (larguraInterna === 2130)
  ok('o interior do painel mede 2130 px', `${G.painelEsq}..${G.painelDir} menos 2 x 41 do recuo lg:p-10`);
else fail('o interior do painel', `${larguraInterna} px, esperado 2130`);

/*
  A PROVA DA COLUNA. Duas colunas iguais com `gap-8` num interior de 2130 dao
  1049 cada. Com `gap-6` dariam 1053 — quatro pixels mais largas. A medida deu
  1049, e e essa a diferenca que a assercao pega.
*/
const previstoGap8 = Math.round((larguraInterna - 32) / 2);
const previstoGap6 = Math.round((larguraInterna - 24) / 2);
if (larguraColuna === previstoGap8 && larguraColuna !== previstoGap6)
  ok('a coluna mede o que `gap-8` preve, e NAO o que `gap-6` preveria', `${larguraColuna} px medidos; gap-8 -> ${previstoGap8}, gap-6 -> ${previstoGap6}`);
else fail('a largura da coluna', `${larguraColuna} px; gap-8 preve ${previstoGap8}, gap-6 preve ${previstoGap6}`);

if (gapMedido >= 31 && gapMedido <= 33)
  ok('o vao medido entre as colunas e de 32 px', `${gapMedido} px (borda a borda, com a tolerancia da captura)`);
else fail('o vao entre as colunas', `${gapMedido} px, esperado ~32`);

/*
  O RECUO. `md:p-10` = 40 px; a borda da captura cai ~1 px para dentro, e a medida
  da 41 dos DOIS lados. `p-8` daria 33 e `p-12` daria 49 — nenhum dos dois cabe.
*/
const recuoEsq = G.botaoEsq - G.cardEsqEsq;
const recuoDir = G.cardEsqDir - G.botaoDir;
if (recuoEsq === 41 && recuoDir === 41)
  ok('o recuo do botao e de 41 px nos dois lados', 'md:p-10 (p-8 daria 33, p-12 daria 49)');
else fail('o recuo do botao', `esquerda ${recuoEsq}, direita ${recuoDir}`);

/*
  A PROVA MAIS FORTE. A largura do botao tem que fechar DUAS coisas de uma vez: a
  largura da coluna (menos os dois recuos) e o `w-full`. 1049 - 2 x 41 = 967, e a
  captura mediu 967. Se o botao fosse `md:w-auto` (como o de `Dados da Conta`), a
  largura seria a do texto — e nao 967.
*/
const larguraBotao = G.botaoDir - G.botaoEsq;
if (larguraBotao === larguraColuna - 2 * recuoEsq)
  ok('a largura do botao fecha com a coluna menos os dois recuos', `${larguraBotao} = ${larguraColuna} - 2 x ${recuoEsq} — prova o w-full`);
else fail('a largura do botao', `${larguraBotao} px contra ${larguraColuna - 2 * recuoEsq} previstos`);

const alturaBotao = G.botaoBase - G.botaoTopo;
if (alturaBotao === 48)
  ok('o botao tem 48 px de altura', 'h-12 (h-11 daria 44, h-14 daria 56)');
else fail('a altura do botao', `${alturaBotao} px, esperado 48`);

/*
  A BARRA TRACEJADA. `p-6` (24) em cima e embaixo, mais a caixa de linha do texto
  mais alto. O maior dos dois e o `text-xs` (12 px de fonte x 1.5 do preflight =
  18 px). 24 + 18 + 24 = 66, e a captura mediu 65 — um pixel, que e a tolerancia.
  Ver `feedback_caixa_de_linha_invisivel`: a caixa nao tem tinta, mas ela OCUPA.
*/
const alturaBarra = G.barraBase - G.barraTopo;
const CAIXA_XS = 18;
const previsaoBarra = 24 + CAIXA_XS + 24;
if (Math.abs(alturaBarra - previsaoBarra) <= 1)
  ok('a altura da barra fecha com `p-6` mais uma caixa `text-xs`', `${alturaBarra} px contra ${previsaoBarra} previstos (24 + 18 + 24)`);
else fail('a altura da barra', `${alturaBarra} px contra ${previsaoBarra} previstos`);

/* ---- e as declaracoes que produzem esses numeros ---- */

if (/grid gap-8 md:grid-cols-2/.test(fonteView))
  ok('a grade e `gap-8 md:grid-cols-2`', 'a unica declaracao que produz 1049 + 32 + 1049');
else fail('a declaracao da grade', 'nao achei `grid gap-8 md:grid-cols-2` na view');

if (/rounded-\[2rem\] border border-border bg-background p-6 shadow-elegant md:p-10/.test(fonteView))
  ok('o cartao da esquerda e `rounded-[2rem]` + `md:p-10` + `shadow-elegant`', 'as tres do original');
else fail('o cartao da esquerda', 'as classes nao batem com o original');

if (/rounded-3xl border border-border bg-background p-6 shadow-soft/.test(fonteView))
  ok('o cartao da direita e `rounded-3xl` + `p-6` + `shadow-soft`', 'as tres do original');
else fail('o cartao da direita', 'as classes nao batem com o original');

if (/h-12 w-full rounded-xl bg-foreground/.test(fonteView))
  ok('o botao e `h-12 w-full` sobre `bg-foreground`', 'a largura e a altura medidas');
else fail('o botao', 'nao achei `h-12 w-full rounded-xl bg-foreground`');

if (/border border-dashed border-border/.test(fonteView))
  ok('a barra do rodape e tracejada', 'border-dashed, como o original');
else fail('a barra do rodape', 'nao e tracejada');

/* ============ 6. os pedacos montaveis ============ */

console.log('\n6. os pedacos que a bancada monta — `CampoSenha`, `SeloIcone`, `CabecalhoCartao`');

for (const nome of ['CampoSenha', 'SeloIcone', 'CabecalhoCartao', 'SegurancaView'])
  if (typeof view[nome] === 'function') ok(`\`${nome}\` esta exportada`, 'montavel pela bancada');
  else fail(`\`${nome}\` nao esta exportada`, 'a bancada nao consegue monta-la');

if (typeof view.CampoSenha === 'function') {
  const html = render(view.CampoSenha, { label: 'Nova Senha', value: '', onChange: () => {} });
  const texto = textos(html);

  /*
    O `type`. Esta e a assercao que separa um campo de senha de um campo de texto,
    e ela vale nos DOIS sentidos: o `password` tem que estar, e o `text` NAO.
  */
  if (/type="password"/.test(html) && !/type="text"/.test(html))
    ok('`CampoSenha` sai com `type="password"` e NAO com `type="text"`', 'o campo nao imprime a senha em claro');
  else fail('o `type` do campo de senha', `password=${/type="password"/.test(html)} text=${/type="text"/.test(html)}`);

  if (texto.includes('Nova Senha'))
    ok('o rotulo sai no TEXTO limpo', 'o `<span>` de cima do campo');
  else fail('o rotulo no texto limpo', JSON.stringify(texto));

  /*
    O `placeholder` e ATRIBUTO — `textos()` o apaga. Ver a armadilha no topo.
  */
  const comPlaceholder = render(view.CampoSenha, {
    label: 'Confirmar Senha', value: '', onChange: () => {}, placeholder: 'Repita a nova senha',
  });
  if (/placeholder="Repita a nova senha"/.test(comPlaceholder))
    ok('o `placeholder` sai no HTML CRU', 'no texto limpo ele nao existiria');
  else fail('o `placeholder` no HTML cru', 'nao achei o atributo');

  if (!textos(comPlaceholder).includes('Repita a nova senha'))
    ok('o `placeholder` NAO esta no texto limpo', 'a armadilha, virada em prova');

  /*
    A SENHA NAO VAZA PARA O TEXTO. Um input controlado imprime `value` como
    ATRIBUTO (e o unico lugar onde ele pode estar, no SSR). O que nao pode
    acontecer e o valor aparecer como TEXTO — que e o que um `<p>{senha}</p>`
    distraido produziria.
  */
  const comValor = render(view.CampoSenha, { label: 'Nova Senha', value: 'segredo123', onChange: () => {} });
  const textoComValor = textos(comValor);
  if (!textoComValor.includes('segredo123') && /value="segredo123"/.test(comValor))
    ok('o valor sai como atributo, e NAO como texto', 'nao ha a senha num no de texto');
  else fail('o valor da senha', `texto=${textoComValor.includes('segredo123')} atributo=${/value="segredo123"/.test(comValor)}`);

  /*
    A TINTA DO CAMPO. `placeholder:text-placeholder` so funciona se o token
    existir no CSS E no Tailwind; `bg-secondary/30` e o mesmo par do modulo 11.
  */
  if (/placeholder:text-placeholder/.test(cruView))
    ok('o campo usa a tinta `placeholder:` do token', 'o mesmo par do modulo `Dados da Conta`');
  else fail('a tinta do placeholder', 'a classe `placeholder:text-placeholder` sumiu');
}

if (typeof view.SeloIcone === 'function') {
  const html = render(view.SeloIcone, { children: react.createElement('svg') });
  if (/size-10/.test(html) && /rounded-xl/.test(html) && /bg-secondary\/30/.test(html))
    ok('`SeloIcone` sai com `size-10 rounded-xl bg-secondary/30`', 'o quadradinho do `beige/30`, convertido');
  else fail('`SeloIcone`', html);

  if (!/bg-beige/.test(html) && !/bg-beige/.test(fonteView))
    ok('NAO ha `bg-beige` no CODIGO da tela', 'so em comentario — o token nao existe; a classe sairia inerte');
  else fail('`bg-beige` reapareceu no codigo', 'o token nao existe no projeto');
}

if (typeof view.CabecalhoCartao === 'function') {
  const html = render(view.CabecalhoCartao, {
    icone: react.createElement('svg'), titulo: 'Alterar Senha', className: 'mb-2',
  });
  const texto = textos(html);
  if (texto.includes('Alterar Senha') && /<h3[^>]*font-serif text-xl/.test(html))
    ok('`CabecalhoCartao` sai com o `h3` serifado e o titulo', 'o mesmo cabecalho nos dois cartoes');
  else fail('`CabecalhoCartao`', html);

  if (/className={`flex items-center gap-3 \$\{className\}`}/.test(fonteView))
    ok('o `className` do cabecalho e COMPOSTO, e nao fixo', 'e o que faz o `mb-2` e o `mb-6` conviverem');
  else fail('o `className` do cabecalho', 'nao e composto — os dois cartoes teriam o mesmo `mb`');
}

/* ============ 7. o portao: um so, e alcancavel ============ */

console.log('\n7. o `Logout` fecha a CONTA — sem criar um segundo portao');

if (typeof casca.PortaoDaConta === 'object' && typeof casca.usePortaoDaConta === 'function')
  ok('a casca publica `PortaoDaConta` e `usePortaoDaConta`', 'o caminho que a tela nao tinha');
else fail('o portao nao foi publicado', 'a tela nao alcanca o `sair` da casca');

if (/createContext<Sair>\(async \(\) => \{\}\)/.test(fonteCasca))
  ok('o valor padrao do portao e um `async` VAZIO', 'permite montar a tela sem casca, em vez de derrubar');
else fail('o valor padrao do portao', 'nao e o no-opassincrono');

if (/<PortaoDaConta\.Provider value=\{sair\}>/.test(cruCasca))
  ok('a casca ENVOLVE o painel com o provedor', 'o contexto vale por posicao na arvore, nao por quem criou o filho');
else fail('o provedor nao envolve o painel', 'o `sair` nao chegaria a view');

if (/import \{ usePortaoDaConta \} from '\.\/account-shell'/.test(cruView))
  ok('a tela IMPORTA o portao', 'a ligacao existe');
else fail('a tela nao importa o portao', 'o `Logout` estaria solto');

if (/onClick=\{\(\) => void sair\(\)\}/.test(fonteView))
  ok('o `Logout` chama `sair()`', 'o mesmo `sair` do botao da coluna e do celular');
else fail('o `Logout` nao chama `sair`', 'nao achei o `onClick={() => void sair()}`');

/*
  A PROVA CENTRAL DESTA SECAO: existe UM unico `dentro` em toda a area da cliente.
  Um segundo estado de sessao seria a copia que faria o `Logout` fechar metade da
  arvore. A contagem e sobre a AREA, e nao sobre um arquivo — e e isso que a torna
  uma prova, e nao uma conferencia.
*/
const comDentro = raizes.filter((f) => /const \[dentro,/.test(readFileSync(f, 'utf8')));
if (comDentro.length === 1 && comDentro[0].endsWith('account-shell.tsx'))
  ok('existe UM unico estado de sessao na area, e ele e o da casca', 'nenhum segundo portao');
else fail('o estado de sessao', `${comDentro.length} arquivo(s) com \`dentro\`: ${comDentro.map((f) => f.split(/[\\/]/).pop()).join(', ')}`);

if (!/\[dentro|setDentro/.test(cruView))
  ok('a tela NAO tem estado de sessao proprio', 'ela so CONSOME o portao');
else fail('a tela tem estado de sessao', 'seria o login paralelo que a regra proibe');

/*
  E `sair` passou a ser `async` — o tipo esta pronto para o servidor, mesmo que a
  implementacao de hoje so mude um booleano.
*/
if (/async function sair\(\)/.test(fonteCasca) && /setDentro\(false\)/.test(fonteCasca))
  ok('`sair` e `async` e fecha o portao', 'a assinatura ja cabe o `await` do servidor futuro');
else fail('`sair`', 'nao e `async` ou nao fecha o portao');

/* ============ 8. as honestidades: o que NAO foi inventado ============ */

console.log('\n8. o que a tela NAO faz — e por que isso e uma prova, e nao uma falta');

/*
  O `confirm()`. O original chama `confirm(...)`, que NAO EXISTE em Node — a
  bancada derrubaria o processo com `ReferenceError` se a tela o chamasse. Ele
  virou estado (`confirmando`), desenhado.
*/
if (!/[^.\w]confirm\(/.test(fonteView) && !/window\.confirm/.test(fonteView) && /PERGUNTA_ENCERRAR/.test(fonteView))
  ok('a tela NAO chama `confirm()` nativo', 'a pergunta vive em estado, e a bancada pode roda-la em Node');
else fail('a tela chama `confirm()`', 'a bancada quebraria com `ReferenceError: confirm is not defined`');

if (/const \[confirmando, setConfirmando\] = useState\(false\)/.test(fonteView))
  ok('a confirmacao E um estado, e nasce fechada', 'o `confirm()` do original, desenhado');
else fail('o estado da confirmacao', 'nao existe ou nao nasce `false`');

/*
  O `saving`. Como no modulo 11: a escrita volta no mesmo tique, entao um estado
  de "salvando" nunca apareceria. A CLASSE fica.
*/
if (!/saving/.test(fonteView) && /disabled:opacity-50/.test(fonteView))
  ok('NAO ha estado `saving` — mas a classe `disabled:opacity-50` ficou', 'o mesmo par do modulo `Dados da Conta`');

if (!/PROCESSANDO/.test(fonteView))
  ok('o botao NAO mostra `PROCESSANDO...`', 'nao ha espera para mostrar — ver `saving`');

if (/\{confirmando && \(/.test(fonteView))
  ok('a faixa de confirmacao so existe quando `confirmando`', 'a condicao esta no JSX');
else fail('a faixa de confirmacao', 'nao esta condicionada ao estado');

/*
  A pergunta e comparada com o texto DENTRO do `confirm()` do original — extraido
  por regex, e nao digitado por mim. Escrever a frase na mao aqui seria comparar a
  tela com a MINHA memoria da frase, e nao com a referencia — que e justamente o
  erro que esta bancada existe para nao cometer.
*/
const doConfirm = fonteOriginal ? (fonteOriginal.match(/confirm\("([^"]+)"\)/) || [])[1] : null;
if (doConfirm && view.PERGUNTA_ENCERRAR === doConfirm)
  ok('`PERGUNTA_ENCERRAR` e o texto do `confirm()` do original, extraido do original', q(doConfirm));
else fail('`PERGUNTA_ENCERRAR`', `tela=${JSON.stringify(view.PERGUNTA_ENCERRAR)} original=${JSON.stringify(doConfirm)}`);

if (/text-danger/.test(fonteView) && !/rose-600/.test(fonteView))
  ok('o hover destrutivo usa o token `danger`, e NAO o `rose-600` do original', 'o projeto nao tem dois vermelhos com o mesmo papel');
else fail('o vermelho do hover', 'ou nao usa `danger`, ou traz o `rose-600` do Tailwind');

/*
  AS CREDENCIAIS. Esta fase proibe chave real, e a tela nao pode ter nenhuma.
  A varredura e por PADRAO, e nao por palavra — `senha` e `password` aparecem
  legitimamente como rotulo.
*/
const padroesDeSegredo = [/sk_live_/, /sk_test_/, /SUPABASE_/, /DATABASE_URL/, /postgres:\/\//, /eyJ[A-Za-z0-9_-]{10,}/];
const achados = padroesDeSegredo.filter((p) => p.test(cruView));
if (achados.length === 0)
  ok('a tela NAO contem chave, token nem string de conexao', 'a varredura por seis padroes');
else fail('a tela contem credencial', achados.map((p) => p.source).join(', '));

/* ============ 9. a rota, e a ausencia de ponte com o admin ============ */

console.log('\n9. a rota existe, e a area nao atravessa a ponte com o admin');

if (/export default function ContaSegurancaPage/.test(fonteRota) && /<SegurancaView \/>/.test(fonteRota))
  ok('`/conta/seguranca` monta a view, sem props', 'a pagina e uma casca de servidor');
else fail('a pagina da rota', 'nao monta `SegurancaView`');

/*
  A rota NAO aparece literalmente em `nav.ts` — o `href` e CONSTRUIDO por
  `clientHref(slug)`. Procurar a string `/conta/seguranca` no arquivo reprovaria
  uma tela correta (a mesma classe de falso negativo de `agulha-curta-casa-import`).
  A prova usa a FUNCAO: um item cujo `clientHref` de o caminho da rota.
*/
const nav = require(join(OUT, 'src/lib/cliente/nav.js'));
const itemSeguranca = nav.NAV_ITEMS.find((i) => nav.clientHref(i.slug) === '/conta/seguranca');
if (itemSeguranca && itemSeguranca.label === 'Segurança')
  ok('o menu monta `/conta/seguranca`, com o rotulo `Segurança`', 'provado por `clientHref`, e nao por texto');
else fail('o menu nao alcanca a rota', JSON.stringify(itemSeguranca));

const areaAposImport = raizes.map((f) => ({ f, c: readFileSync(f, 'utf8') }))
  .filter(({ c }) => /from '@[\/](components|lib|app)[\/]admin/.test(c));
if (areaAposImport.length === 0)
  ok('a area da cliente NAO importa nada do admin', 'a ponte entre os dois paineis fica na FASE 4');
else fail('a area importa do admin', areaAposImport.map(({ f }) => f.split(/[\\/]/).pop()).join(', '));

/* ============ 10. provas ao contrario ============ */

console.log('\n10. provas ao contrario — o que NAO pode aparecer');

const proibidos = [
  ['bg-beige/', 'o token nao existe no projeto'],
  ['h-11', 'a altura medida e 48 px (`h-12`)'],
  ['rounded-[3rem]', 'o cartao medido e `rounded-[2rem]`'],
  ['gap-6 md:grid-cols-2', 'a grade medida e `gap-8`'],
  ['md:w-auto', 'o botao medido e `w-full`'],
];
for (const [classe, porque] of proibidos) {
  /*
    `fonteView` (sem comentarios), e NAO o arquivo cru: tres `bg-beige` vivem na
    PROSA desta tela, explicando por que o token do original nao foi usado. Ler o
    cru acusaria a propria explicacao — ver `feedback_bancada_comentario_vira_falso_positivo`.
  */
  if (!fonteView.includes(classe)) ok(`ausente do codigo: ${q(classe)}`, porque);
  else fail(`apareceu no codigo: ${q(classe)}`, porque);
}

if (!/toLocaleString/.test(semComentarios(arquivo('src/lib/cliente/metrics.ts')).slice(-1200)))
  ok('`ultimoAcesso` NAO usa `toLocaleString`', 'o formato do print e fixo, e nao o do ICU da maquina');
else fail('`ultimoAcesso` usa `toLocaleString`', 'o formato variaria com o runtime');

if (!/base64/i.test(cruView) && !/data:image/i.test(cruView))
  ok('a tela NAO guarda imagem em base64', 'a regra "STORAGE A DEFINIR"');
else fail('base64 na tela', 'a regra proibe base64 como solucao de armazenamento');

/* ------------------------------------------------------------------ rodape */

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
process.exit(falhas === 0 ? 0 : 1);
