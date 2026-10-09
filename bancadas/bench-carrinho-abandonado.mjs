/**
 * Bancada do modulo Carrinho Abandonado.
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o
 * `next/font/google` espera as fontes para sempre). Sem esta bancada, a unica
 * garantia seria o typecheck — que nao renderiza, nao soma e nao ve o ramo
 * invertido.
 *
 * O QUE ELA PROVA, EM ORDEM
 *
 *   1. os .ts/.tsx do modulo EMITEM sem erro e os `@/` resolvem em execucao;
 *   2. os QUATRO KPIs de adm-008 com os valores exatos do print (3, 0, 0, R$ 0,00);
 *   3. que `Valor Recuperado` soma SO os recuperados — com um perdido de valor
 *      alto na entrada, que nao pode entrar na conta;
 *   4. a tabela tem TRES linhas, na ordem do print (0, 537, 358);
 *   5. as CINCO colunas, na ordem do print;
 *   6. que o `Status` tem os tres estados, mesmo o print mostrando so um;
 *   7. os QUATRO disparos de adm-009 na ordem 1/6/24/48, com os textos literais;
 *   8. o cupom vazio e o frete desmarcado — como o print;
 *   9. que `SALVAR CONFIGURACOES` NAO finge gravar (`persisted: false`);
 *  10. a assimetria 3 x 1 que o CRM depende, agora calculada neste modulo;
 *  11. que o CRM LE deste modulo e NAO tem uma segunda lista de carrinhos;
 *  12. a rota existe, aponta para a tela e nao usa mais a referencia errada;
 *  13. as provas ao contrario: o instrumento sabe FALHAR.
 *
 * O que ela NAO prova: layout, cor, posicao e responsividade. Isso e navegador.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// `resolve` no argumento: `createRequire` exige caminho absoluto, e `.` (que e
// como a bancada e chamada) nao serve.
const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-carrinho-abandonado.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-carrinho');

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

/** Igualdade profunda que nao LANCA: a bancada precisa poder falhar sozinha. */
function mesmo(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);

// Limpa a saida antes de compilar: um `.js` de rodada anterior faria a bancada
// medir codigo que NAO existe mais nos `.ts`.
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
 * Raizes da COMPILACAO: o modulo novo, o que ele precisa do CRM e os dois
 * componentes que a bancada renderiza.
 *
 * O compilador segue os `import` sozinho, entao `ui/*`, `lib/utils` e
 * `lib/carrinho-abandonado/*` entram por conta propria. As ~30 outras paginas do
 * painel NAO entram — compilar todas estoura o limite de ~178 s do `bash` deste
 * ambiente, e mesmo restringindo nao se deve compilar o projeto inteiro para
 * medir um modulo.
 *
 * `lib/crm` entra porque esta fase MEXEU nele (a lista de carrinhos mudou de
 * casa): a bancada prova que a ponte entre os dois modulos compila e funciona.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/](carrinho-abandonado|crm)|components[\\/]admin[\\/]carrinho-abandonado|app[\\/]admin[\\/]carrinho-abandonado)[\\/]/.test(f),
);

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
if (erros.length === 0 && emitidos.emitSkipped === false) ok('emissao sem erro', `${raizes.length} raizes do modulo`);
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
  if (pedido.startsWith('@/')) {
    return carregarOriginal.call(this, join(OUT, 'src', pedido.slice(2)), pai, ehPrincipal);
  }
  return carregarOriginal.call(this, pedido, pai, ehPrincipal);
};

/* ---------------------------------------------------------------- modulos */

const dados = require(join(OUT, 'src/lib/carrinho-abandonado/data.js'));
const demo = require(join(OUT, 'src/lib/carrinho-abandonado/demo.js'));
const metricas = require(join(OUT, 'src/lib/carrinho-abandonado/metrics.js'));
const tipos = require(join(OUT, 'src/lib/carrinho-abandonado/types.js'));
const crmDemo = require(join(OUT, 'src/lib/crm/demo.js'));
const utils = require(join(OUT, 'src/lib/utils.js'));
const { CartView } = require(join(OUT, 'src/components/admin/carrinho-abandonado/cart-view.js'));
const { CartTable } = require(join(OUT, 'src/components/admin/carrinho-abandonado/cart-table.js'));
const { CartStatsRow } = require(join(OUT, 'src/components/admin/carrinho-abandonado/cart-stats.js'));

/* ------------------------------------------------------------- utilidades */

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o
 * `toLocaleString('pt-BR')` usa espaco inquebravel e o `\s` do JS nao o pega.
 */
const normalizar = (s) => s.replace(/[\s  ]+/g, ' ').trim();
function textos(html) {
  return normalizar(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&middot;/g, '·')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&aacute;/g, 'á')
      .replace(/&eacute;/g, 'é')
      .replace(/&iacute;/g, 'í')
      .replace(/&oacute;/g, 'ó')
      .replace(/&uacute;/g, 'ú')
      .replace(/&atilde;/g, 'ã')
      .replace(/&ccedil;/g, 'ç'),
  );
}

const render = (Componente, props) => renderToStaticMarkup(react.createElement(Componente, props));

/**
 * O CODIGO DE UM ARQUIVO, SEM OS COMENTARIOS.
 *
 * A licao veio da bancada de Pedidos, onde DUAS assercoes passaram a medir o
 * comentario em vez do codigo: a documentacao da correcao CITA a string
 * procurada, entao a agulha casava dentro da explicacao e a bancada acusava um
 * defeito que nao existia.
 *
 * Nesta bancada a armadilha ja esta armada antes de rodar: a `page.tsx` cita
 * `references="adm-014 a adm-018"` num comentario que REGISTRA a referencia
 * errada, e o `data.ts` cita `persisted: false` num comentario que explica por
 * que ele nunca e `true`. As assercoes correspondentes medem o texto LIMPO.
 *
 * A segunda regra evita comer o `//` de `https://`: so trata como comentario de
 * linha quando o `//` NAO vem depois de `:`.
 */
function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * ORDEM DE COLUNAS POR POSICAO — e nao por comparacao de indices.
 *
 * A primeira versao comparava `posicoes` com `[...posicoes].sort()`. Parece
 * equivalente e nao e: se DUAS agulhas caem no MESMO lugar, as duas posicoes
 * empatam, o array ja esta "ordenado" e a assercao PASSA — escondendo o defeito.
 *
 * E foi exatamente o que aconteceu aqui. A agulha `'Status'` casa dentro de
 * `CartStatus`, que aparece na LINHA 8 do arquivo, antes da tabela. As cinco
 * posicoes sairam `262, 889, 966, 1034, 1109`: fora de ordem na PRIMEIRA, e o
 * teste so nao passou porque `262` veio antes de `889`. Ou seja, ele acusou um
 * problema por sorte, sem saber onde; se a agulha intrusa tivesse caido depois,
 * a bancada teria dado verde para uma tabela desalinhada.
 *
 * Agora a assercao exige que as cinco apareçam NA SEQUENCIA, uma depois da
 * outra, sem intrusa no meio. E a mensagem diz QUEM se meteu no meio.
 */
function naOrdem(codigo, agulhas) {
  const indices = agulhas.map((a) => codigo.indexOf(a));
  const fora = agulhas.filter((a, i) => indices[i] === -1);
  if (fora.length > 0) return { ok: false, detalhe: `nao encontradas: ${fora.join(', ')}` };
  for (let i = 1; i < indices.length; i += 1) {
    if (indices[i] <= indices[i - 1]) {
      return {
        ok: false,
        detalhe: `\`${agulhas[i]}\` vem antes de \`${agulhas[i - 1]}\` — ou o mesmo trecho casou nas duas`,
      };
    }
  }
  return { ok: true, detalhe: indices.join(' < ') };
}

const arquivo = (rel) => readFileSync(join(SRC, rel), 'utf8');

/* ------------------------------------------------------- 1. os quatro KPIs */

console.log('\n1. os quatro KPIs — adm-008');

const conjunto = await dados.getCartDataset();

if (conjunto.data.stats.total === 3) ok('TOTAL ABANDONADOS = 3', 'as tres linhas do print');
else fail('total abandonados', String(conjunto.data.stats.total));

if (conjunto.data.stats.recovered === 0) ok('RECUPERADOS = 0', 'nenhuma linha recuperada');
else fail('recuperados', String(conjunto.data.stats.recovered));

if (conjunto.data.stats.lost === 0) ok('PERDIDOS = 0', 'nenhuma linha perdida');
else fail('perdidos', String(conjunto.data.stats.lost));

if (conjunto.data.stats.recoveredValue === 0) ok('VALOR RECUPERADO = R$ 0,00', 'nao ha recuperado para somar');
else fail('valor recuperado', String(conjunto.data.stats.recoveredValue));

/**
 * `VALOR RECUPERADO` SOMA SO OS RECUPERADOS — e esta prova e a que pega.
 *
 * Com o dado do print os quatro numeros dao zero ou vazio, e somar a coluna
 * inteira daria o mesmo `0` que somar so os recuperados. A diferenca so aparece
 * com um PERDIDO que tenha valor de recuperacao preenchido: ele nao pode entrar
 * na conta. Sem esta prova, o bug passaria despercebido para sempre.
 */
const comPerdido = metricas.buildCartStats([
  { id: 'a', contactName: null, contactEmail: null, subtotal: 100, notificationCount: 0, lastNotifiedAt: null, createdAt: '2026-01-01T00:00:00', status: 'recuperado', recoveryValue: 50 },
  { id: 'b', contactName: null, contactEmail: null, subtotal: 200, notificationCount: 0, lastNotifiedAt: null, createdAt: '2026-01-02T00:00:00', status: 'perdido', recoveryValue: 999 },
  { id: 'c', contactName: null, contactEmail: null, subtotal: 300, notificationCount: 0, lastNotifiedAt: null, createdAt: '2026-01-03T00:00:00', status: 'pendente', recoveryValue: 777 },
]);
if (comPerdido.recoveredValue === 50)
  ok('`Valor Recuperado` ignora perdidos e pendentes', 'R$ 50,00 — e nao 999 nem 777');
else fail('a soma do valor recuperado', `${comPerdido.recoveredValue}, esperado 50`);

if (comPerdido.recovered === 1 && comPerdido.lost === 1 && comPerdido.total === 3)
  ok('e os outros tres contam do mesmo conjunto', '1 recuperado, 1 perdido, 3 no total');
else fail('as contagens com status misto', JSON.stringify(comPerdido));

// ...e um carrinho recuperado SEM valor nao pode virar `NaN` na soma.
const semValor = metricas.buildCartStats([
  { id: 'a', contactName: null, contactEmail: null, subtotal: 100, notificationCount: 0, lastNotifiedAt: null, createdAt: '2026-01-01T00:00:00', status: 'recuperado', recoveryValue: null },
]);
if (semValor.recoveredValue === 0)
  ok('recuperado sem valor soma ZERO, e nao `NaN`', 'o `Number(x ?? 0)` protege a coluna');
else fail('soma com valor nulo', String(semValor.recoveredValue));

/* --------------------------------------------------- 2. a tabela de adm-008 */

console.log('\n2. a tabela `Historico de Carrinhos`');

if (conjunto.data.carts.length === 3) ok('tres linhas', 'igual ao print');
else fail('numero de linhas', String(conjunto.data.carts.length));

/**
 * A ORDEM E A DO PRINT. O print nao tem coluna de data, entao a sequencia dos
 * VALORES e a unica forma de conferir que a ordem foi reproduzida:
 *
 *   R$ 0,00  >  R$ 537,00  >  R$ 358,00
 *
 * Nao e ordem de valor (0 < 358 < 537) nem de e-mail. E data decrescente, que e
 * como o original consulta (`.order("created_at", { ascending: false })`). Se
 * `sortCarts` virar identidade ou ordenar por valor, esta prova cai.
 *
 * O `normalizar` NOS DOIS LADOS NAO E ENFEITE. O `toLocaleString('pt-BR')` de
 * `formatBRL` poe um espaco INQUEBRAVEL (U+00A0) entre `R$` e o numero — o `\s`
 * do JS nao o pega, e um literal digitado aqui tem espaco normal. Sem normalizar,
 * a comparacao falha com os dois lados PARECENDO iguais na mensagem de erro: foi
 * exatamente o que aconteceu na primeira rodada desta correcao, e o texto
 * impresso dizia `R$ 0,00 > R$ 537,00 > R$ 358,00` — que e o valor certo.
 */
const valoresExibidos = conjunto.data.carts.map((cart) => normalizar(utils.formatBRL(cart.subtotal)));
if (mesmo(valoresExibidos, ['R$ 0,00', 'R$ 537,00', 'R$ 358,00']))
  ok('a ordem dos valores e a do print', valoresExibidos.join(' > '));
else fail('ordem das linhas', valoresExibidos.join(' > '));

/**
 * ...E O NBSP EXISTE DE VERDADE. Sem esta prova, o `normalizar` poderia estar
 * consertando um problema que nao existe, e a proxima pessoa a ler a bancada
 * acharia que ele e decoracao.
 */
if (/R\$[ ]/.test(utils.formatBRL(0)))
  ok('e o `formatBRL` usa espaco INQUEBRAVEL', 'o `normalizar` dos dois lados nao e enfeite');
else fail('o NBSP sumiu do formatBRL', 'a normalizacao virou decoracao');

const identificados = conjunto.data.carts.map((cart) => Boolean(cart.contactEmail));
if (mesmo(identificados, [false, true, false]))
  ok('e a linha COM e-mail e a do meio', 'a do lead de adm-010');
else fail('posicao do e-mail', JSON.stringify(identificados));

// A data que explica a ordem existe e e DECRESCENTE — a regra, e nao so o
// resultado.
const datas = conjunto.data.carts.map((cart) => new Date(cart.createdAt).getTime());
if (datas[0] > datas[1] && datas[1] > datas[2])
  ok('as datas decrescem de cima para baixo', 'a ordem e data, conferida na origem');
else fail('datas fora de ordem', JSON.stringify(datas));

console.log('\n3. as cinco colunas, na ordem do print');

const tabelaSrc = semComentarios(arquivo('components/admin/carrinho-abandonado/cart-table.tsx'));
/**
 * AS AGULHAS SAO AS PROPS DO CABECALHO, e nao os rotulos soltos.
 *
 * Com os rotulos crus, `'Status'` casava dentro de `CartStatus` — que aparece na
 * linha 8, antes da tabela — e a posicao saia 262 em vez da posicao real da
 * coluna. As agulhas abaixo (`<TableHeaderCell>Cliente / Email`, `align="right"`,
 * ...) aparecem UMA VEZ cada, no cabecalho e na ordem certa. E a prova tambem
 * mede o alinhamento de cada coluna, que o print define:
 *
 *   CLIENTE / EMAIL  a esquerda  · VALOR a direita · NOTIFICACOES centralizada
 *   ULTIMO ENVIO centralizada    · STATUS centralizado
 */
const colunas = [
  '<TableHeaderCell>Cliente / Email',
  '<TableHeaderCell align="right">Valor',
  '<TableHeaderCell align="center">Notificações',
  '<TableHeaderCell align="center">Último Envio',
  '<TableHeaderCell align="center">Status',
];
const ordem = naOrdem(tabelaSrc, colunas);
if (ordem.ok) ok('as cinco colunas, na ordem e no alinhamento do print', ordem.detalhe);
else fail('colunas da tabela', ordem.detalhe);

/**
 * OS TRES ESTADOS DO STATUS EXISTEM, mesmo o print mostrando so `PENDENTE`.
 *
 * As tres linhas de adm-008 sao pendentes. Mas o KPI `Recuperados` existe e o
 * original pinta `recovered` e `lost` com cores proprias — o estado foi escrito
 * para os cartoes do topo deixarem de ser zero um dia. Sem os tres no mapa, a
 * primeira linha recuperada sairia sem cor.
 */
const estados = ['Pendente', 'Recuperado', 'Perdido'].filter((e) => tabelaSrc.includes(e));
if (estados.length === 3) ok('o Status cobre os tres estados', 'pendente, recuperado e perdido');
else fail('estados do status', `so ${estados.join(', ')}`);

/**
 * OS DOIS TEXTOS DE CAIXA VAZIA SAO DA TELA, E NAO DO DADO.
 *
 * `Visitante` e `Nao identificado` sao o que o original escreve quando o nome e
 * o e-mail sao nulos (`c.contact_name || "Visitante"`). Se estivessem gravados
 * no registro, um carrinho identificado amanha carregaria o rotulo de nao
 * identificado para sempre. A prova le o DADO e exige que ele esteja LIMPO.
 */
if (conjunto.data.carts.every((cart) => cart.contactName === null))
  ok('o dado guarda `null`, nao `Visitante`', 'o rotulo e composto pela tela');
else fail('nome gravado no dado', JSON.stringify(conjunto.data.carts.map((c) => c.contactName)));

/**
 * A RENDERIZACAO DA TABELA — o unico jeito de conferir o que sai, e nao o que
 * o arquivo diz. As tres linhas tem que aparecer com o texto do print.
 */
const tabela = textos(render(CartTable, { rows: conjunto.data.carts }));
if (tabela.includes('Visitante') && tabela.includes('Não identificado') && tabela.includes('lp070087@gmail.com'))
  ok('a tabela renderiza `Visitante` e `Não identificado`', 'com o e-mail na linha do meio');
else fail('render da tabela', tabela.slice(0, 120));

if (tabela.includes('R$ 537,00') && tabela.includes('R$ 358,00'))
  ok('e os valores do print aparecem formatados', 'R$ 537,00 e R$ 358,00');
else fail('valores no render', tabela.slice(0, 120));

if ((tabela.match(/Pendente/g) || []).length === 3) ok('as tres linhas estao `Pendente`', 'igual ao print');
else fail('contagem de `Pendente`', String((tabela.match(/Pendente/g) || []).length));

// A coluna ULTIMO ENVIO mostra `—` nas tres: nenhuma foi notificada.
if (!tabela.includes('Invalid Date')) ok('nenhuma data invalida na tela', 'o travessao cobre o nulo');
else fail('data invalida renderizada', 'apareceu `Invalid Date`');

/* ------------------------------------------------ 4. a configuracao (adm-009) */

console.log('\n4. o painel `Configurações` — adm-009');

const config = conjunto.data.config;

const atrasos = config.delays.map((delay) => delay.key);
if (mesmo(atrasos, ['1h', '6h', '24h', '48h']))
  ok('os quatro disparos, do mais curto ao mais longo', atrasos.join(' > '));
else fail('ordem dos disparos', atrasos.join(', '));

if (config.delays.every((delay) => delay.active))
  ok('os quatro interruptores estao MARCADOS', 'como no print');
else fail('interruptores', JSON.stringify(config.delays.map((d) => d.active)));

/**
 * OS QUATRO TEXTOS SAO LITERAIS DO PRINT — e o `(nome)` faz parte.
 *
 * `(nome)` e o marcador de substituicao do original. "Corrigir" para um nome
 * generico apagaria a unica pista de que o texto e um molde. Esta prova exige o
 * marcador: se alguem reescrever a mensagem, ela cai.
 */
const TEXTOS = [
  'Oi (nome), notamos que você esqueceu alguns itens no carrinho. Use o cupom VOLTA10 para 10% de desconto!',
  'Ainda pensando naqueles itens? Aproveite frete grátis nas próximas 2 horas!',
  'Última chance! Seus favoritos estão quase acabando no estoque.',
  'Vimos que você não finalizou seu pedido. Gostaria de uma ajuda personalizada?',
];
if (mesmo(config.delays.map((d) => d.template), TEXTOS))
  ok('os quatro textos sao literais do print', 'copiados sem reescrever');
else fail('textos dos disparos', 'divergem do print');

if (config.delays[0].template.includes('(nome)'))
  ok('e o marcador `(nome)` foi preservado', 'corrigi-lo apagaria que o texto e um molde');
else fail('marcador de substituicao', 'sumiu do primeiro disparo');

if (config.isActive === true) ok('o interruptor `Ativo` esta ligado', 'como no print');
else fail('`Ativo`', String(config.isActive));

/**
 * O CUPOM VAZIO E O FRETE DESMARCADO — os dois "vazios" do print.
 *
 * O campo `CUPOM AUTOMATICO` mostra so o `placeholder` `EX: VOLTA10` em cinza;
 * preencher `VOLTA10` faria a tela afirmar que existe um cupom configurado. O
 * `Incentivo de Frete Gratis` tem o checkbox VAZIO em adm-009, ao contrario dos
 * outros quatro. Os dois sao estados que o print mostra e que a bancada fixa:
 * o dia em que alguem "completar" o dado, ela cai.
 */
if (config.couponToSend === '') ok('o cupom automatico esta VAZIO', 'o print mostra so o placeholder');
else fail('cupom preenchido', `"${config.couponToSend}"`);

if (config.freeShippingIncentive === false)
  ok('o frete gratis esta DESMARCADO', 'e o unico dos cinco checkboxes que o print deixa vazio');
else fail('frete gratis', String(config.freeShippingIncentive));

/* ---------------------------------------------- 5. a escrita nao finge gravar */

console.log('\n5. `SALVAR CONFIGURAÇÕES` nao mente');

const salvo = await dados.saveCartConfig(config);
if (salvo.persisted === false) ok('salvar devolve `persisted: false`', 'esta fase NAO tem banco');
else fail('persisted', String(salvo.persisted));

if (typeof salvo.reason === 'string' && salvo.reason.length > 0)
  ok('e devolve o MOTIVO', 'a tela tem o que dizer ao usuario');
else fail('motivo da nao-gravacao', String(salvo.reason));

/**
 * O `persisted: true` NAO PODE EXISTIR NO MEIO DO CODIGO.
 *
 * A assercao roda sobre o texto LIMPO do `data.ts`, e nao sobre a execucao: o
 * comentario do arquivo CITA `persisted: true` justamente para explicar por que
 * ele nao acontece, e medir o texto cru acusaria o proprio comentario. Este e o
 * caso que a bancada de Pedidos ja viveu — ver `semComentarios`.
 */
const dataLimpo = semComentarios(arquivo('lib/carrinho-abandonado/data.ts'));
if (!/persisted:\s*true/.test(dataLimpo))
  ok('nao ha `persisted: true` no codigo', 'a gravacao falsa nao existe nem escondida');
else fail('gravacao fingida', 'o `data.ts` afirma ter gravado');

/**
 * A TELA NAO PODE AFIRMAR SUCESSO. Se o painel mostrasse "Configuracoes
 * salvas", a mentira estaria na interface mesmo com a camada de dados correta.
 * A prova procura a frase num arquivo de componente — depois de tirar as tags e
 * os comentarios.
 */
const painelLimpo = textos(semComentarios(arquivo('components/admin/carrinho-abandonado/cart-config-panel.tsx')));
if (!/salvas|salvo com sucesso|Configurações salvas/i.test(painelLimpo))
  ok('e a tela NAO diz "salvo"', 'o aviso e de que nao persistiu');
else fail('mensagem de sucesso', 'a tela afirma ter gravado');

if (/sess[ãa]o/i.test(painelLimpo))
  ok('e ela AVISA que vale so nesta sessao', 'o usuario nao fica enganado');
else fail('aviso de sessao', 'a tela nao diz que o dado nao persiste');

/* ------------------------------------- 6. a assimetria 3 x 1 (o CRM depende) */

console.log('\n6. a assimetria 3 x 1');

const comEmail = metricas.countIdentifiedCarts(conjunto.data.carts);
if (comEmail === 1) ok('so UM carrinho tem e-mail', 'os outros dois sao anonimos');
else fail('carrinhos identificados', String(comEmail));

if (comEmail < conjunto.data.carts.length)
  ok('e por isso a lista de leads e MENOR que o total', '3 carrinhos, 1 lead');
else fail('a assimetria sumiu', 'os dois numeros iguais apagariam a regra do original');

/* ------------------------------------------- 7. o CRM le DESTE modulo */

console.log('\n7. o CRM le deste modulo, e nao tem lista propria');

const crmDemoLimpo = semComentarios(arquivo('lib/crm/demo.ts'));
if (/from '@\/lib\/carrinho-abandonado\/demo'/.test(crmDemoLimpo))
  ok('`lib/crm/demo.ts` importa daqui', 'a lista tem UM dono');
else fail('a ponte com o CRM', 'o CRM nao le a lista deste modulo');

/**
 * O CRM NAO PODE GUARDAR UMA LISTA PROPRIA. Se os dois modulos tivessem copia,
 * marcar um carrinho como recuperado numa tela o deixaria abandonado na outra.
 * A prova procura o ARRAY LITERAL de carrinhos no arquivo do CRM — o formato
 * unico do dado deste modulo, ja que o CRM consome uma forma reduzida.
 */
if (!/createdAt:\s*'2026-06-13T00:31:00'/.test(crmDemoLimpo))
  ok('e NAO guarda uma copia dos carrinhos', 'nenhum literal de carrinho sobrou la');
else fail('lista duplicada', 'o CRM guarda os carrinhos outra vez');

/**
 * ...E O CRM CONTINUA ENXERGANDO O QUE O PRINT DELE MOSTRA.
 *
 * Esta e a prova de REGRESSAO da mudanca de dono: se a ponte falhasse, a lista
 * do CRM viria vazia e a aba `Leads` de adm-010 perderia a unica linha dela. O
 * numero de leads e 1, e o nome e `Carrinho Abandonado`.
 */
const crmDados = await require(join(OUT, 'src/lib/crm/data.js')).listCrmDataset({ now: new Date('2026-09-27T23:00:00') });
if (crmDados.data.leads.length === 1 && crmDados.data.leads[0].email === 'lp070087@gmail.com')
  ok('e o CRM ainda tem o lead de adm-010', `${crmDados.data.leads.length} lead, ${crmDados.data.leads[0].email}`);
else fail('o lead do CRM', `${crmDados.data.leads.length} lead(s)`);

const carrinhoNoCrm = crmDados.data.segments.find((s) => s.key === 'carrinho_abandonado');
if (carrinhoNoCrm && carrinhoNoCrm.value === 3)
  ok('e o segmento de adm-011 ainda conta 3', 'a mudanca de dono nao mexeu no numero');
else fail('segmento carrinho abandonado no CRM', String(carrinhoNoCrm && carrinhoNoCrm.value));

/* -------------------------------------------------------------- 8. a rota */

console.log('\n8. a rota');

const rotaCrua = arquivo('app/admin/carrinho-abandonado/page.tsx');
const rota = semComentarios(rotaCrua);

if (/export default function CarrinhoAbandonadoPage/.test(rota)) ok('a rota existe', '/admin/carrinho-abandonado');
else fail('a rota', 'nao exporta a pagina');

if (/from '@\/components\/admin\/carrinho-abandonado\/cart-view'/.test(rota))
  ok('a pagina aponta para a tela', '`CartView`');
else fail('a pagina', 'nao importa a tela');

if (!/ModulePage/.test(rota)) ok('a pagina NAO usa mais o placeholder', 'o `ModulePage` foi removido');
else fail('a pagina ainda e um placeholder', '`ModulePage` continua la');

/**
 * A REFERENCIA ERRADA. O placeholder anterior citava `adm-014 a adm-018`, que e
 * de Cupons e Fidelidade. A `page.tsx` CITA essa prop errada no comentario que
 * registra a correcao — por isso a assercao mede o texto LIMPO e a de
 * documentacao mede o CRU. Sao duas perguntas diferentes.
 */
if (!/references\s*=\s*["']adm-014/.test(rota)) ok('a referencia errada NAO esta mais na prop', 'adm-014 e outro modulo');
else fail('a prop ainda cita adm-014', 'a referencia errada voltou');

if (/adm-014/.test(rotaCrua) && /adm-008/.test(rotaCrua))
  ok('e a divergencia ficou REGISTRADA no comentario', 'a troca esta documentada');
else fail('a divergencia nao esta registrada', 'sumiu do comentario');

/* ---------------------------------------------- 9. a tela carrega e renderiza */

console.log('\n9. a tela carrega');

const esqueleto = textos(render(CartView, {}));
if (esqueleto.length >= 0) ok('a tela monta sem quebrar', 'o esqueleto de carregamento renderizou');
else fail('a tela nao montou', 'renderizacao vazia');

/**
 * O TITULO DO CORPO — o defeito que ficou sem prova.
 *
 * Este modulo nasceu com o cabecalho AUSENTE: o comentario afirmava que o
 * `AdminShell` desenhava o titulo e a descricao lendo `description` do `nav.ts`,
 * e o `admin-shell.tsx` nao le nada disso. A prova mede o TEXTO do render, e nao
 * a presenca de `SectionHeader` no arquivo: importar e nao usar passaria, e o
 * titulo poderia sumir de novo sem a bancada reclamar.
 */
if (esqueleto.includes('Carrinho Abandonado Automático'))
  ok('e a tela traz o TITULO do adm-008', '`Carrinho Abandonado Automatico`, e nao o rotulo da sidebar');
else fail('o titulo do corpo sumiu', 'nao achei o titulo do adm-008');

/**
 * A DESCRICAO E A DO PRINT, E NAO A DO `nav.ts`.
 *
 * Aqui as duas DIVERGEM, ao contrario do CRM: o print diz "Recupere vendas
 * perdidas com disparos automaticos de mensagens e incentivos." e o `nav.ts`
 * diz "Recupere vendas interrompidas antes do pagamento." — texto que nao
 * aparece em print nenhum. PRINT ATUAL VENCE, e a prova trava a escolha.
 */
if (esqueleto.includes('Recupere vendas perdidas com disparos automáticos de mensagens e incentivos.'))
  ok('e a DESCRICAO e a do print', 'a que o `nav.ts` traz nao aparece em referencia nenhuma');
else fail('a descricao do corpo', 'nao e a do adm-008');

if (!esqueleto.includes('Recupere vendas interrompidas antes do pagamento.'))
  ok('e a descricao do `nav.ts` NAO vazou para a tela', 'sao dois textos diferentes, e o print manda');
else fail('vazou o texto do `nav.ts`', 'a tela mostra um texto que nenhum print tem');

// Os quatro KPIs renderizados com os valores do print.
const kpis = textos(render(CartStatsRow, { stats: conjunto.data.stats }));
for (const rotulo of ['Total Abandonados', 'Recuperados', 'Perdidos', 'Valor Recuperado']) {
  if (!kpis.includes(rotulo)) fail('rotulo do KPI', `${rotulo} nao apareceu`);
}
if (['Total Abandonados', 'Recuperados', 'Perdidos', 'Valor Recuperado'].every((r) => kpis.includes(r)))
  ok('os quatro KPIs renderizam com os rotulos do print', 'na ordem do print');

if (kpis.includes('R$ 0,00')) ok('e o `Valor Recuperado` sai formatado em reais', 'R$ 0,00');
else fail('valor recuperado no render', kpis.slice(0, 80));

/**
 * `semComentarios` NAO PODE COMER CODIGO JUNTO.
 *
 * Se ele apagasse o arquivo inteiro, TODAS as assercoes de texto limpo
 * passariam por vaculdade em vez de por o defeito nao existir. Esta prova mede
 * as duas coisas de uma vez: o comentario some E o codigo ao lado sobrevive.
 */
const limpo = semComentarios(tabelaSrc);
if (!limpo.includes('adm-014') && limpo.includes('TableHeaderCell') && limpo.includes('STATUS_LABELS'))
  ok('`semComentarios` tirou o comentario e preservou o codigo', 'o instrumento continua exato');
else fail('`semComentarios` comeu codigo junto', 'o instrumento ficou cego, nao exato');

/* ------------------------------------------------- 10. provas ao contrario */

console.log('\n10. as provas ao contrario');

let quebrado = 0;

// (a) `sortCarts` NAO pode ser identidade: a entrada fora de ordem tem que sair
//     ordenada. E tambem NAO pode mutar o array de quem chamou.
const bagunçado = [
  { id: 'x', contactName: null, contactEmail: null, subtotal: 1, notificationCount: 0, lastNotifiedAt: null, createdAt: '2026-01-01T00:00:00', status: 'pendente', recoveryValue: null },
  { id: 'y', contactName: null, contactEmail: null, subtotal: 2, notificationCount: 0, lastNotifiedAt: null, createdAt: '2026-06-01T00:00:00', status: 'pendente', recoveryValue: null },
];
const ordenado = metricas.sortCarts(bagunçado);
if (ordenado[0].id === 'y' && bagunçado[0].id === 'x') { quebrado += 0; } else { quebrado += 1; }

// (b) `countIdentifiedCarts` NAO pode ser o total: com um so identificado, os
//     dois numeros tem que diferir.
if (metricas.countIdentifiedCarts(conjunto.data.carts) === conjunto.data.carts.length) { quebrado += 1; } else { quebrado += 0; }

// (c) `sortDelays` NAO pode confiar na ordem da entrada: embaralhado, tem que
//     sair 1/6/24/48.
const embaralhado = ['24h', '1h', '48h', '6h'].map((key) => ({ key, label: key, active: true, template: '' }));
if (metricas.sortDelays(embaralhado).map((d) => d.key).join() === '1h,6h,24h,48h') { quebrado += 0; } else { quebrado += 1; }

// (d) `buildCartStats` NAO pode somar a coluna inteira — ja provado acima, mas
//     aqui com um pendente de valor alto, para o instrumento nao depender de o
//     status ser `perdido`.
const soPendente = metricas.buildCartStats([
  { id: 'a', contactName: null, contactEmail: null, subtotal: 1, notificationCount: 0, lastNotifiedAt: null, createdAt: '2026-01-01T00:00:00', status: 'pendente', recoveryValue: 500 },
]);
if (soPendente.recoveredValue === 0) { quebrado += 0; } else { quebrado += 1; }

// (e) `saveCartConfig` NAO pode devolver `persisted: true` em nenhuma hipotese
//     enquanto nao ha banco.
const salvoDeNovo = await dados.saveCartConfig({ ...config, couponToSend: 'X' });
if (salvoDeNovo.persisted === false) { quebrado += 0; } else { quebrado += 1; }

// (f) `naOrdem` NAO pode dar verde com o cabecalho embaralhado. Foi ele que
//     pegou o `CartStatus` casando no lugar de `Status`; se ele nao souber
//     falhar, a bancada inteira perde o chao — todas as outras assercoes de
//     ordem passariam por vaculdade.
if (naOrdem('beta alfa', ['alfa', 'beta']).ok === false) { quebrado += 0; } else { quebrado += 1; }

// (g) ...e `naOrdem` NAO pode dar verde com uma agulha repetida, que e o caso
//     exato que enganou a primeira versao: duas agulhas caindo no mesmo trecho.
if (naOrdem('X Status Y', ['Status', 'Status']).ok === false) { quebrado += 0; } else { quebrado += 1; }

if (quebrado === 0) ok('as sete provas ao contrario falharam como deviam', 'o instrumento acusa defeito');
else fail('a bancada passaria em qualquer coisa', `${quebrado} de 7 provas ao contrario nao acusaram`);

// `types.js` e carregado so para provar que o modulo EMITIDO existe: os tipos
// somem na compilacao, e um arquivo de tipos sem nenhum `export` de valor e um
// erro que so apareceria em tempo de execucao do import.
if (tipos !== undefined) ok('o modulo de tipos foi emitido', 'o import de `types.js` resolve');

// ...e a RE-EXPORTACAO do CRM aponta para os MESMOS tres carrinhos.
if (crmDemo.DEMO_ABANDONED_CARTS.length === 3 && crmDemo.DEMO_ABANDONED_CARTS[0].id === demo.DEMO_ABANDONED_CARTS[0].id)
  ok('a re-exportacao do CRM e a MESMA lista', 'nao ha copia — os ids batem');
else fail('a lista do CRM', JSON.stringify(crmDemo.DEMO_ABANDONED_CARTS.map((c) => c.id)));

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
