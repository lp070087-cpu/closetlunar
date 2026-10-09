/**
 * Bancada do Dashboard da area da cliente (fase 2, modulo 4) e da fundacao de
 * dados que ele consome.
 *
 * ================== POR QUE ESTA BANCADA EXISTE ==================
 *
 * O Dashboard e a tela em que uma DEMONSTRACAO pode mentir sem quebrar nada.
 * Ele mostra seis numeros, um nome de nivel e um codigo de pedido — todos
 * plausiveis — e nenhum deles tem como errar sozinho: um `cashback` que virasse
 * zero, um `pedidos` que contasse o total do admin em vez do total DESTA
 * cliente, ou um codigo de pedido que deixasse de sair do `id`. Nada disso
 * levanta erro; so a tela fica errada.
 *
 * Por isso a secao 1 prende os numeros ao que o print `cli-001` mostra, valor
 * por valor. Se um deles mudar, a bancada cai — e e o que se quer, porque cada
 * um foi lido do material e nao escolhido.
 *
 * ================== O CASO QUE MAIS IMPORTA: O ROTULO DIVERGENTE ==================
 *
 * A area da cliente e o admin mostram o MESMO `status` de pedido com rotulos
 * DIFERENTES (`Aguardando pagamento` contra `Novo`). Isso e facil de "consertar"
 * por engano — basta alguem achar que e copia e importar o mapa do admin. A
 * secao 4 exige os DOIS mapas ao mesmo tempo: os dois tem que existir, com os
 * dois textos, cada um no seu lado. A prova do cliente sozinha nao pegaria a
 * troca; as duas juntas, sim.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Layout, cor de verdade e responsividade — isso e navegador. As cores aqui sao
 * provadas por CLASSE (`text-accent`, `text-amber-600`) e pela cor do nivel via
 * `style`, que e o que o HTML carrega; se o tom compensa no pixel, so a captura
 * diz.
 */

import { createRequire } from 'node:module';
import { appendFileSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-conta.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-conta');

/**
 * ================== O RASTRO, PARA QUANDO A BANCADA NAO RESPONDE ==================
 *
 * `createProgram` do TypeScript leva ~80s aqui. Quando a bancada estoura o teto
 * de tempo do shell (~178s), o `timeout` mata o processo e o que ja tinha sido
 * impresso se perde no buffer do pipe — e nao da para saber ONDE ela parou.
 *
 * Com `BENCH_TRACE=1` cada etapa grava uma linha com o instante em que
 * terminou, num arquivo. Assim uma execucao morta por tempo ainda deixa o
 * rastro de ate onde chegou, e a etapa culpada aparece pelo NOME e nao por
 * deducao. Sem a variavel, custa uma comparacao por etapa.
 */
const RASTRO = process.env.BENCH_TRACE ? join(PROJ, '_bench-conta.log') : null;
let anterior = Date.now();
const marca = (etapa) => {
  if (!RASTRO) return;
  const agora = Date.now();
  appendFileSync(RASTRO, `${new Date().toISOString().slice(11, 19)} ${String(agora - anterior).padStart(7)}ms  ${etapa}\n`);
  anterior = agora;
};
if (RASTRO) appendFileSync(RASTRO, `--- inicio ${new Date().toISOString()} ---\n`);

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

const mesmo = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);
marca('typescript carregado');

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

const arquivos = [];
(function varrer(dir) {
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) varrer(caminho);
    else if (/\.tsx?$/.test(caminho)) arquivos.push(caminho);
  }
})(SRC);
marca(`varredura: ${arquivos.length} arquivos`);

/**
 * ================== O `stat.tsx` NAO E RAIZ, E SIM DEPENDENCIA ==================
 *
 * Ele e um componente COMPARTILHADO (`src/components/ui/`), e ficou aqui so
 * para a bancada poder monta-lo direto na secao 5. Ele nao precisa estar em
 * `rootNames`: o `dashboard-view.tsx` o importa, e o `createProgram` o resolve
 * pelo programa. Por isso a lista de raizes e a MESMA da bancada de navegacao —
 * a comparacao entre as duas continua valendo, sem uma raiz a mais para
 * explicar.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]cliente|components[\\/]cliente|app[\\/]\(cliente\))[\\/]/.test(f),
);
marca(`raizes: ${raizes.length}`);

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
marca('createProgram');
const emitidos = programa.emit();
marca('emit');
const erros = ts.getPreEmitDiagnostics(programa).filter((d) => d.category === ts.DiagnosticCategory.Error);
marca(`diagnostics (${erros.length} erro(s))`);
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
const react = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
marca('react carregado');

const modulo = require('node:module');
const carregarOriginal = modulo._load;
modulo._load = function (pedido, pai, ehPrincipal) {
  if (pedido.startsWith('@/')) return carregarOriginal.call(this, join(OUT, 'src', pedido.slice(2)), pai, ehPrincipal);
  return carregarOriginal.call(this, pedido, pai, ehPrincipal);
};

const conta = require(join(OUT, 'src/lib/cliente/data.js'));
const metricas = require(join(OUT, 'src/lib/cliente/metrics.js'));
const demo = require(join(OUT, 'src/lib/cliente/demo.js'));
const nav = require(join(OUT, 'src/lib/cliente/nav.js'));
const adminDemo = require(join(OUT, 'src/lib/pedidos/demo.js'));

const { DashboardView } = require(join(OUT, 'src/components/cliente/dashboard-view.js'));
const { ClubeNivelCard } = require(join(OUT, 'src/components/cliente/clube-nivel-card.js'));
const { CuponsAtivosCard } = require(join(OUT, 'src/components/cliente/cupons-ativos-card.js'));
const { UltimoPedidoCard } = require(join(OUT, 'src/components/cliente/ultimo-pedido-card.js'));
const { AccountQuickLink } = require(join(OUT, 'src/components/cliente/account-quick-link.js'));
marca('modulos do cliente e componentes carregados');

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
function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1').replace(/=""/g, '');
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

/**
 * O instante em que os prints foram capturados — `2026-09-28 00:46`, pelo nome
 * dos arquivos. So e usado para as funcoes que de fato medem tempo.
 */
const NO_PRINT = new Date('2026-09-28T00:46:00');
/** Um dia em que o `CLOSET10` ja venceu (ele expira em 20/08/2026). */
const DEPOIS = new Date('2026-10-03T12:00:00');

/* ============ 1. o resumo, numero por numero contra o print ============ */

console.log('\n1. `getResumo` — os numeros do print `cli-001`, um por um');

const r = (await conta.getResumo()).data;

if (r.pedidos === 5)
  ok('`PEDIDOS 5`', 'o print mostra 5, e o filtro por cliente nao pega os do admin inteiro');
else fail('contagem de pedidos', `${r.pedidos} (print: 5)`);

if (r.cashback === 10.14)
  ok('`CASHBACK R$ 10,14`', 'o valor do print, e nao um calculo inventado');
else fail('cashback', `${r.cashback} (print: 10.14)`);

if (r.pontos === 0)
  ok('`MEUS PONTOS 0`', 'saldo zerado, como o print');
else fail('pontos', String(r.pontos));

if (r.favoritos === 0)
  ok('`FAVORITOS 0 ITENS`', 'a lista nasce vazia');
else fail('favoritos', String(r.favoritos));

if (r.ultimoPedido && r.ultimoPedido.codigo === '#ff3048c9')
  ok('`NUMERO #ff3048c9`', 'o codigo e derivado do `id`, como no admin');
else fail('codigo do ultimo pedido', String(r.ultimoPedido && r.ultimoPedido.codigo));

if (r.ultimoPedido && r.ultimoPedido.total === 506.95)
  ok('`Valor total` R$ 506,95', 'o total do pedido, nao a soma de todos');
else fail('total do ultimo pedido', String(r.ultimoPedido && r.ultimoPedido.total));

/**
 * ================== OS DOIS PRINTS DO MESMO CUPOM, NA MESMA SESSAO ==================
 *
 * `004603` (dashboard) mostra o `CLOSET10` no cartao `Cupons ativos`.
 * `004841` (lista de cupons) mostra o MESMO cupom escurecido, com o selo
 * `EXPIRADO`. Os dois foram tirados com dois minutos e meio de diferenca.
 *
 * Isso so fecha se as duas telas usarem criterios DIFERENTES: o dashboard lista
 * por `is_active` (a consulta do original nao tem `expires_at`), e a lista
 * escurece o que venceu. Se alguem "consertar" o dashboard filtrando por
 * validade, o cartao abre com `Nenhum cupom disponível.` — um estado que
 * nenhuma referencia mostra.
 *
 * As provas abaixo exigem os DOIS lados. Uma sozinha nao pegaria a troca: com
 * o filtro de validade no dashboard, a prova da lista continuaria passando.
 */
if (r.cuponsAtivos.length === 1 && r.cuponsAtivos[0].code === 'CLOSET10')
  ok('`Cupons ativos` traz o `CLOSET10` mesmo vencido', 'o criterio e `is_active`, como a consulta do original');
else fail('cupons ativos', JSON.stringify(r.cuponsAtivos.map((c) => c.code)));

const vencido = metricas.cupomFechado(demo.DEMO_CUPONS_CLIENTE[0], DEPOIS);
if (vencido === true)
  ok('o MESMO cupom esta vencido para a lista', '`cupomFechado` decide o cartao escurecido de `/conta/cupons`');
else fail('`cupomFechado`', String(vencido));

if (metricas.cupomFechado(demo.DEMO_CUPONS_CLIENTE[0], NO_PRINT) === true)
  ok('vencido tambem NA data do print', 'a expiracao e 20/08/2026 e os prints sao de 28/09/2026');
else fail('vencimento na data do print', 'o cupom estaria valido na data do print, o que contradiz `004841`');

/**
 * O CODIGO, e nao a prosa. O `metrics.ts` CITA `cuponsValidos` num comentario
 * explicando por que ele saiu — entao ler o arquivo cru acharia a citacao e
 * acusaria um defeito que nao existe. `semComentarios` tira a prosa antes de
 * medir, e e o que faz esta prova medir o codigo.
 */
const codigoMetricas = semComentarios(readFileSync(join(PROJ, 'src/lib/cliente/metrics.ts'), 'utf8'));
if (!/cuponsValidos|cupomValido\b/.test(codigoMetricas))
  ok('`cuponsValidos` NAO existe no codigo ao vivo', 'o filtro por validade no dashboard era invencao');
else fail('`cuponsValidos` voltou', 'o dashboard voltaria a abrir vazio');


if (r.nivel && r.nivel.nome === 'Bronze' && r.nivel.minimoPontos === 0)
  ok('`NIVEL VIP BRONZE`', 'o nivel que o cartao escuro do print mostra');
else fail('nivel', JSON.stringify(r.nivel));

/* ============ 2. o pedido projetado e a ponte com o admin ============ */

console.log('\n2. `projetarPedido` — projecao, e nao copia');

/**
 * O ULTIMO PEDIDO NAO TEM ITEM NENHUM — E ISSO E DECISAO DO ADMIN, NAO DEFEITO.
 *
 * `DEMO_ORDERS_PEDIDOS[0]` nasce com `items: []`: a nota do `pedidos/demo.ts`
 * explica que preencher com os tres itens "que somam R$ 506,95" seria fabricar
 * uma venda que o material nao mostra. Um pedido sem itens e um estado legitimo.
 *
 * Entao a prova aqui NAO pode exigir item. O que ela exige e a PROJECAO: a lista
 * da cliente tem que ser do MESMO TAMANHO da lista do admin, e o mapa de campos
 * tem que levar os quatro que a tela imprime. Provar `length > 0` seria provar
 * o admin, e nao esta area.
 */
const p = r.ultimoPedido;
/** A linha do admin por tras de um pedido da cliente — a ponte, id a id. */
const brutoDe = (pedido) => adminDemo.DEMO_ORDERS_PEDIDOS.find((o) => o.id === pedido.id);

if (p.itens.length === 0 && brutoDe(p).items.length === 0)
  ok('o ultimo pedido nao tem item, como no admin', '`items: []` e o estado que o material documenta');
else fail('itens do ultimo pedido', `cliente: ${p.itens.length}, admin: ${brutoDe(p).items.length}`);

/** Um pedido do admin QUE TEM itens, para a projecao poder ser medida. */
const comItens = adminDemo.DEMO_ORDERS_PEDIDOS.find((o) => o.items.length > 0);
const projetado = metricas.projetarPedido(comItens);
const mesmoTamanho = projetado.itens.length === comItens.items.length;
const camposCertos = projetado.itens.every(
  (i, n) =>
    i.id === comItens.items[n].id &&
    i.nome === comItens.items[n].productName &&
    i.tamanho === comItens.items[n].size &&
    i.cor === comItens.items[n].color &&
    i.quantidade === comItens.items[n].quantity &&
    i.precoUnitario === comItens.items[n].unitPrice,
);
if (mesmoTamanho && camposCertos && projetado.itens.length > 0)
  ok('`projetarPedido` leva os itens, campo a campo', `${projetado.itens.length} item(ns) do pedido ${comItens.code}`);
else fail('projecao dos itens', JSON.stringify({ mesmoTamanho, camposCertos, n: projetado.itens.length }));

/** A ponte: o pedido da cliente tem que ser a MESMA linha do array do admin. */
const bruto = adminDemo.DEMO_ORDERS_PEDIDOS.find((o) => o.id === p.id);
if (bruto && bruto.id === p.id && bruto.code === p.codigo && bruto.status === p.status)
  ok('o pedido e a MESMA linha do admin — mesmo `id`, `code` e `status`', 'nao ha copia divergente');
else fail('ponte com o admin', JSON.stringify({ achou: !!bruto, id: p.id, codigo: p.codigo }));

/*
  ================== O FRETE E O IDENTIFICADOR CRU, E NAO O NOME ==================

  Esta prova dizia `p.frete === bruto.shipping.carrier`. Ela nasceu no modulo do
  DASHBOARD, quando `frete` era o nome da transportadora — e estava certa
  enquanto isso era verdade.

  O modulo de `Meus Pedidos` provou o contrario no material: o print `cli-004`
  escreve `me:1` na linha do caminhao de um pedido cuja transportadora e
  `Correios`. A tela escreve `o.shipping_method`, sem traduzir, e `Correios` NAO
  aparece na area da cliente. A projecao passou a apontar para `shipmentMethod`
  (ver `projetarPedido` e a nota de `shipmentMethod` em `lib/pedidos/types.ts`).

  A prova foi ATUALIZADA, e nao apagada: ela continua exigindo que `frete` venha
  do pedido do admin — so que do campo CERTO. A forma antiga fica aqui registrada
  porque o dia em que alguem "consertar" `frete` de volta para o nome da
  transportadora, o material passa a contradizer a tela de novo.
*/
if (bruto && p.frete === bruto.shipping.shipmentMethod)
  ok('`frete` e o identificador CRU de `shipping_method`', `"${p.frete}" — o nome da transportadora NAO aparece aqui`);
else fail('frete', `${p.frete} x ${bruto && bruto.shipping.shipmentMethod}`);

/** E o campo existe no modelo: sem ele, `kind` sozinho nao distingue `me:1` de `own:<uuid>`. */
if (bruto && typeof bruto.shipping.shipmentMethod !== 'undefined')
  ok('o pedido do admin CARREGA o campo cru', '`shipmentMethod`, aditivo ao modelo compartilhado');
else fail('`shipmentMethod`', 'o campo sumiu do pedido do admin');

if (bruto && p.total === bruto.payment.total && p.subtotal === bruto.payment.subtotal)
  ok('os valores saem de `payment`, sem conta nova', 'o painel do cliente nao recalcula preco');
else fail('valores', JSON.stringify({ total: p.total, bruto: bruto && bruto.payment.total }));

/* ============ 3. o nivel VIP: a regra do maior que cabe ============ */

console.log('\n3. `nivelAtual` — o maior nivel alcancado');

const niveis = [
  { id: 'o', nome: 'Ouro', cor: '#c9a227', minimoPontos: 1000 },
  { id: 'b', nome: 'Bronze', cor: '#b8860b', minimoPontos: 0 },
  { id: 'p', nome: 'Prata', cor: '#aaa', minimoPontos: 500 },
];

if (metricas.nivelAtual(niveis, 0)?.nome === 'Bronze')
  ok('com 0 ponto, `Bronze`', 'o piso alcancado pelo menor `minimoPontos`');
else fail('nivel com 0 ponto', JSON.stringify(metricas.nivelAtual(niveis, 0)));

if (metricas.nivelAtual(niveis, 499)?.nome === 'Bronze' && metricas.nivelAtual(niveis, 500)?.nome === 'Prata')
  ok('a virada e em `>= minimoPontos`, e nao em `>`', '499 fica no anterior, 500 ja entra');
else fail('virada de nivel', JSON.stringify([
  metricas.nivelAtual(niveis, 499)?.nome, metricas.nivelAtual(niveis, 500)?.nome,
]));

if (metricas.nivelAtual(niveis, 9999)?.nome === 'Ouro')
  ok('acima do ultimo limiar, o nivel mais alto', 'nao estoura nem devolve `null`');
else fail('nivel acima do topo', JSON.stringify(metricas.nivelAtual(niveis, 9999)));

/**
 * A LISTA FORA DE ORDEM. Ela entra como `[Ouro, Bronze, Prata]` de proposito: a
 * escolha e pelo MAIOR limiar que cabe, e nao pelo primeiro nem pelo ultimo da
 * lista. Uma implementacao que pegasse o ultimo item que coubesse devolveria
 * `Bronze` aqui, porque `Bronze` (0) cabe sempre.
 */
if (metricas.nivelAtual(niveis, 750)?.nome === 'Prata')
  ok('a lista fora de ordem nao muda o resultado', 'escolhe pelo maior limiar, e nao pela posicao');
else fail('lista fora de ordem', JSON.stringify(metricas.nivelAtual(niveis, 750)));

if (metricas.nivelAtual([], 5000) === null && metricas.nivelAtual(niveis, -1) === null)
  ok('sem nivel que caiba, devolve `null`', 'e o ramo em que o dashboard mostra o atalho de `Afiliada`');
else fail('nivel nulo', JSON.stringify([metricas.nivelAtual([], 5000), metricas.nivelAtual(niveis, -1)]));

/* ============ 4. o rotulo divergente — os DOIS mapas ao mesmo tempo ============ */

console.log('\n4. o status: `Aguardando pagamento` no cliente, `Novo` no admin');

if (metricas.rotuloStatus('novo') === 'Aguardando pagamento')
  ok('no cliente, `novo` e `Aguardando pagamento`', 'transcrito de `conta.pedidos.tsx`');
else fail('rotulo do cliente', metricas.rotuloStatus('novo'));

if (adminDemo.ORDER_STATUS_LABELS.novo === 'Novo')
  ok('no admin, o MESMO `novo` e `Novo`', 'os dois mapas continuam diferentes — e tem que continuar');
else fail('rotulo do admin', String(adminDemo.ORDER_STATUS_LABELS.novo));

if (metricas.rotuloStatus('novo') !== adminDemo.ORDER_STATUS_LABELS.novo)
  ok('o cliente NAO importou o mapa do admin', 'a divergencia e a do material, e nao um erro de copia');
else fail('o cliente copiou o mapa do admin', 'a divergencia registrada foi apagada');

/**
 * Os SEIS estados. O `Record<OrderStatus, ...>` obriga o typecheck, mas o
 * typecheck nao roda nesta bancada — entao a cobertura e conferida por VALOR:
 * as chaves dos dois mapas tem que ser o mesmo conjunto.
 */
const chavesCliente = Object.keys(metricas.ROTULO_STATUS_CLIENTE).sort();
const chavesAdmin = Object.keys(adminDemo.ORDER_STATUS_LABELS).sort();
if (mesmo(chavesCliente, chavesAdmin) && chavesCliente.length === 6)
  ok('os dois mapas cobrem os MESMOS 6 estados', 'um estado novo no admin quebraria o typecheck, nao a tela');
else fail('cobertura dos estados', JSON.stringify({ cliente: chavesCliente, admin: chavesAdmin }));

if (chavesCliente.every((k) => /^bg-\S+ text-\S+$/.test(metricas.tomStatus(k))))
  ok('todo estado tem um tom de selo, com fundo e tinta', 'nenhum selo sai sem cor');
else fail('toms', JSON.stringify(chavesCliente.map((k) => metricas.tomStatus(k))));

/** Nenhum tom pode ser a paleta crua do Tailwind — o projeto usa tokens. */
if (!/bg-(amber|emerald|blue|indigo|green|rose)-\d/.test(JSON.stringify(metricas.ROTULO_STATUS_CLIENTE)))
  ok('nenhum tom na paleta crua do Tailwind', 'o projeto usa `--warning`, `--success`, `--info`, `--danger`');
else fail('paleta crua', 'ha um `bg-amber-100` solto no mapa do cliente');

/**
 * O TIPO DO MAPA. A cobertura acima ja e provada por VALOR (as duas listas de
 * chaves), mas o `Record<OrderStatus, ...>` e o que faria o TYPECHECK quebrar
 * quando o enum do admin ganhasse um estado. Se a anotacao virasse
 * `Record<string, ...>`, a bancada continuaria passando com o defeito la dentro.
 */
if (/Record<OrderStatus,\s*\{\s*label: string; tom: string \}>/.test(readFileSync(join(PROJ, 'src/lib/cliente/metrics.ts'), 'utf8')))
  ok('o mapa e anotado com o tipo do ADMIN, e nao `string`', 'um estado novo no enum quebra o typecheck, nao a tela');
else fail('anotacao do mapa', 'o mapa deixou de ser `Record<OrderStatus, ...>`');

/* ============ 5. os atalhos — o icone que diverge ============ */

console.log('\n5. `CONTA_ATALHOS` — oito atalhos, e UM icone diferente da coluna');

const nome = (icone) => String(icone.displayName || icone.name || '');
const atalhoPorHref = new Map(nav.CONTA_ATALHOS.map((a) => [a.href, a]));

if (nome(atalhoPorHref.get('/conta/dados').icon) === 'Sparkles')
  ok('o atalho `Meus Dados` usa `Sparkles`', 'linha 90 do `conta.index.tsx`');
else fail('icone do atalho `Meus Dados`', nome(atalhoPorHref.get('/conta/dados').icon));

if (nome(nav.NAV_ITEMS.find((i) => i.slug === 'dados').icon) === 'UserCog')
  ok('a coluna `Dados da Conta` usa `UserCog`', 'linha 27 do `AccountLayout.tsx` — os dois divergem de proposito');
else fail('icone da coluna `Dados da Conta`', nome(nav.NAV_ITEMS.find((i) => i.slug === 'dados').icon));

if (nome(atalhoPorHref.get('/conta/dados').icon) !== nome(nav.NAV_ITEMS.find((i) => i.slug === 'dados').icon))
  ok('os dois icones sao DIFERENTES', 'igualar seria o "conserto" errado — o material tem dois');
else fail('os icones foram igualados', 'a divergencia do material foi apagada');

if (nav.CONTA_ATALHOS.filter((a) => a.mostraContagem).length === 1 &&
    nav.CONTA_ATALHOS.find((a) => a.mostraContagem).href === '/conta/favoritos')
  ok('so `Favoritos` mostra contagem', 'e o unico em que o original passa `count` e o print mostra `0 ITENS`');
else fail('contagens', JSON.stringify(nav.CONTA_ATALHOS.filter((a) => a.mostraContagem).map((a) => a.href)));

/* ============ 6. o que as telas desenham ============ */

console.log('\n6. os componentes — o que sai no HTML');

const tela = render(DashboardView, {});
const textoTela = textos(tela);
if (textoTela.includes('Carregando...'))
  ok('antes de ler, `Carregando...`', '`renderToStaticMarkup` nao roda efeito — e a tela nao afirma zero');
else fail('estado inicial da tela', textoTela.slice(0, 160));

if (!textoTela.includes('R$ 0,00') && !/\b0\b/.test(textoTela.replace('Carregando', '')))
  ok('nenhum numero aparece antes da leitura', 'nem `0` nem `R$ 0,00` — nada de piscar valor errado');
else fail('numero antes da leitura', textoTela.slice(0, 120));

const cartaoNivel = render(ClubeNivelCard, { nivel: { id: 'n', nome: 'Bronze', cor: 'hsl(33 72% 44%)', minimoPontos: 0 } });
const textoNivel = textos(cartaoNivel);
/**
 * O ACENTO. O SSR do React emite `í` como UTF-8 cru, e nao como entidade — por
 * isso a comparacao e contra `Nível` COM acento. Comparar com `NIVEL` (sem
 * acento) falharia num componente correto: as entidades que `textos()` traduz
 * sao as que o React ESCAPA (`&amp;`, `&quot;`), e o acento nao esta entre elas.
 */
if (textoNivel.includes('Nível VIP') && textoNivel.includes('Bronze'))
  ok('o cartao de nivel escreve `Nível VIP` e o nome', 'o dado chega em caixa mista');
else fail('cartao de nivel', textoNivel);

/**
 * A caixa alta do rotulo e CSS. Se o `uppercase` saisse da classe, o print
 * (`NÍVEL VIP`) deixaria de bater e nada mais acusaria.
 */
if (/class="[^"]*uppercase[^"]*"[^>]*>Nível VIP</.test(cartaoNivel))
  ok('`Nível VIP` sobe para caixa alta por CSS', 'o texto carrega o acento e o estilo carrega a caixa');
else fail('caixa alta do rotulo', 'o `uppercase` nao esta na classe do rotulo');

if (contar(cartaoNivel, 'hsl(33 72% 44%)') === 2)
  ok('a cor do nivel entra nos DOIS elementos — trofeu e nome', 'vem do dado, em `style`, e nao de uma classe fixa');
else fail('cor do nivel', `${contar(cartaoNivel, 'hsl(33 72% 44%)')} usos (esperado 2)`);

if (cartaoNivel.includes('uppercase') && !textos(cartaoNivel).includes('BRONZE'))
  ok('a caixa alta e CSS, e nao o texto do dado', 'subir a caixa no dado apagaria o nome original do nivel');
else fail('caixa alta', textos(cartaoNivel));

const pedidoSemeado = {
  id: 'x', codigo: '#abc12345', feitoEm: '2026-01-01T10:00:00', status: 'novo', frete: 'me:1',
  subtotal: 100, desconto: 0, freteValor: 0, total: 100, itens: [],
};
const comPedido = render(UltimoPedidoCard, { pedido: pedidoSemeado });
const textoPedido = textos(comPedido);
if (textoPedido.includes('#abc12345') && textoPedido.includes('Ver todos os pedidos') &&
    normalizar(comPedido).includes('R$ 100,00'))
  ok('`UltimoPedidoCard` com pedido: numero, total e o link', 'os tres do print');
else fail('cartao com pedido', textoPedido.slice(0, 160));

/**
 * O SELO do cartao de ultimo pedido e o codigo CRU — `novo`, nao a frase longa.
 *
 * O print concorda: o cartao de `004603` traz `NOVO` no selo, e o rotulo longo
 * (`AGUARDANDO PAGAMENTO`) e o da lista de `Meus Pedidos`. Sao dois lugares do
 * material escrevendo o mesmo campo de dois jeitos.
 */
if (textoPedido.includes('novo') && !textoPedido.includes('Aguardando pagamento'))
  ok('o selo mostra o codigo cru, como o original (`{last.status}`)', 'e nao o rotulo longo de `Meus Pedidos`');
else fail('selo do ultimo pedido', textoPedido);

const semPedido = render(UltimoPedidoCard, { pedido: null });
if (textos(semPedido).includes('Nenhum pedido realizado ainda.') && textos(semPedido).includes('Ir para a loja'))
  ok('sem pedido, o vazio do original', 'bloco tracejado com icone, frase e link');
else fail('cartao sem pedido', textos(semPedido).slice(0, 160));

if (semPedido.includes('border-dashed') && comPedido.includes('border border-border'))
  ok('os dois ramos desenham coisas diferentes', 'o vazio e tracejado; o preenchido, nao');
else fail('ramos do cartao', 'os dois ramos parecem iguais');

const cuponsZero = render(CuponsAtivosCard, { cupons: [] });
if (textos(cuponsZero).includes('Nenhum cupom disponível.'))
  ok('sem cupom, o vazio do original', 'nao ha lista vazia sem explicacao');
else fail('cupons vazios', textos(cuponsZero));

/**
 * ================== O LIMITE DE TRES, E UMA CODIFICACAO QUE NAO MENTE ==================
 *
 * A primeira versao desta prova usou os codigos `CODIGO1..4` e contou as
 * ocorrencias de `CODIGO3`. Isso NAO funciona: `CODIGO1`, `CODIGO2`, `CODIGO3` e
 * `CODIGO4` comecam todos com `CODIGO`, e os trechos de texto sao adjacentes no
 * HTML — entao `contar(texto, 'CODIGO3')` acha um so, mas qualquer contagem do
 * prefixo se confunde com os tres.
 *
 * Agora cada codigo e uma palavra DISTINTA, sem prefixo comum. A contagem vira
 * uma decisao de presenca, e nao de posicao: os tres primeiros aparecem, o
 * quarto NAO, e a prova do `4` continua valendo se o `slice` sair de lugar.
 */
const quatro = [
  { codigo: 'ALFA', valor: 10 },
  { codigo: 'BRAVO', valor: 20 },
  { codigo: 'CHARLIE', valor: 30 },
  { codigo: 'DELTA', valor: 40 },
].map(({ codigo, valor }) => ({
  id: `c-${codigo}`, code: codigo, kind: 'percent', valor, value: valor,
  minimo: null, expiraEm: null, esgotado: false,
}));
const comQuatro = textos(render(CuponsAtivosCard, { cupons: quatro }));
const dentro = ['ALFA', 'BRAVO', 'CHARLIE'].every((c) => comQuatro.includes(c));
if (dentro && !comQuatro.includes('DELTA'))
  ok('com QUATRO cupons, so os TRES primeiros aparecem', '`slice(0, 3)` — o resumo nao vira a lista inteira');
else fail('limite de 3 cupons', comQuatro.slice(0, 200));

const umAtalho = render(AccountQuickLink, { href: '/conta/favoritos', icon: nav.CONTA_ATALHOS[1].icon, label: 'Favoritos', count: 0, mostraContagem: true });
if (textos(umAtalho).includes('0 itens') && umAtalho.includes('href="/conta/favoritos"'))
  ok('`Favoritos` mostra `0 itens` e aponta para a rota', 'o singular/plural do original');
else fail('atalho com contagem', textos(umAtalho));

const singular = render(AccountQuickLink, { href: '/conta/favoritos', icon: nav.CONTA_ATALHOS[1].icon, label: 'Favoritos', count: 1, mostraContagem: true });
if (textos(singular).includes('1 item') && !textos(singular).includes('1 itens'))
  ok('com UM item, `1 item`', 'nao `1 itens`');
else fail('plural do atalho', textos(singular));

const semContagem = render(AccountQuickLink, { href: '/conta/pedidos', icon: nav.CONTA_ATALHOS[0].icon, label: 'Pedidos', count: 7 });
if (!textos(semContagem).includes('7'))
  ok('sem `mostraContagem`, a contagem NAO e desenhada', 'sete pedidos nao viram `7 itens` no atalho de Pedidos');
else fail('contagem indevida', textos(semContagem));

/* ============ 7. o teto de contexto ============ */

console.log('\n7. a area nao toca banco, nao suprime tipo e o componente nao le `demo`');

const fonteArea = raizes.map((f) => readFileSync(f, 'utf8')).join('\n');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonteArea)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('a area toca banco', 'ha conexao de banco na area da cliente');

if (!/@ts-ignore|@ts-expect-error/.test(fonteArea))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', 'o typecheck nao foi silenciado');
else fail('supressao de tipo', 'ha um `@ts-ignore` na area');

/**
 * O `demo.ts` continua sendo lido SO por `data.ts`. O Dashboard e o primeiro
 * modulo com dado de verdade, e e onde a tentacao de importar a demonstracao
 * direto no componente aparece: o cartao de nivel precisa de um nivel para
 * desenhar ANTES de a leitura chegar. `resumo.nivel` ja resolve isso.
 */
const vazando = raizes
  .filter((f) => /src[\\/]components[\\/]/.test(f))
  .filter((f) => /from '\S*cliente\/demo'/.test(readFileSync(f, 'utf8')));
if (vazando.length === 0)
  ok('nenhum componente importa `cliente/demo`', 'o dado so entra pelo `data.ts`');
else fail('componente lendo `demo.ts`', vazando.join(', '));

/**
 * `data.ts` nao le o relogio — e `getResumo` nem RECEBE um. A assinatura tem
 * zero parametro obrigatorio: se alguem reintroduzir uma data ali, o corpo
 * desta prova pega pelo nome.
 */
const fonteData = semComentarios(readFileSync(join(PROJ, 'src/lib/cliente/data.ts'), 'utf8'));
if (!/new Date\(\s*\)/.test(fonteData) && /export async function getResumo\(\)/.test(fonteData))
  ok('`getResumo` nao recebe nem le relogio', 'o cartao de cupons nao depende da validade — so de `is_active`');
else fail('`getResumo` e o relogio', 'a assinatura ou o corpo voltou a depender da data');

const dentes = render(CuponsAtivosCard, { cupons: demo.DEMO_CUPONS_CLIENTE });
if (textos(dentes).includes('CLOSET10') && !textos(dentes).includes('Nenhum cupom disponível.'))
  ok('o cartao desenha o `CLOSET10` VENCIDO, sem esconder', 'e o estado do print `004603`, 2min30 antes do `004841`');
else fail('cartao com o cupom vencido', textos(dentes));

const fonteMetricas = semComentarios(readFileSync(join(PROJ, 'src/lib/cliente/metrics.ts'), 'utf8'));
if (!/new Date\(\s*\)/.test(fonteMetricas) && !/Date\.now\(/.test(fonteMetricas))
  ok('`metrics.ts` continua puro', 'nenhum `new Date()` sem argumento nem `Date.now()`');
else fail('`metrics.ts` le o relogio', 'a pureza foi perdida');

/* ============ 8. provas ao contrario ============ */

console.log('\n8. provas ao contrario — o defeito tem que REPROVAR');

if (metricas.rotuloStatus('novo') !== 'Novo' && adminDemo.ORDER_STATUS_LABELS.novo === 'Novo')
  ok('o rotulo do cliente NAO e o do admin', 'a prova pega a troca se alguem importar o mapa errado');
else fail('os dois rotulos coincidem', 'a prova de divergencia nao distingue nada');

const comCupom = render(CuponsAtivosCard, { cupons: [quatro[0]] });
if (textos(comCupom).includes('ALFA') && !textos(comCupom).includes('Nenhum cupom disponível.'))
  ok('um unico cupom NAO cai no ramo vazio', 'o `length === 0` nao foi trocado por um `!length` frouxo');
else fail('um cupom', textos(comCupom));

if (metricas.nivelAtual(niveis, 0)?.nome !== 'Ouro' && metricas.nivelAtual(niveis, 9999)?.nome === 'Ouro')
  ok('a escolha do nivel distingue os extremos', 'um `find` no primeiro item nao passaria nos dois');
else fail('a escolha do nivel nao distingue', 'a prova nao estaria provando nada');

if (!semComentarios('/* Aguardando pagamento */ const x = 1;').includes('Aguardando pagamento'))
  ok('`semComentarios` impede que a citacao na prosa conte como rotulo', 'o texto aparece em comentario e nao no codigo');
else fail('`semComentarios`', 'um comentario esta contando como codigo');

if (contar('<?>', '<?>') === 1 && contar('abc', 'z') === 0)
  ok('`contar` conta todas e devolve 0 para ausente', 'a contagem de `CODIGO3` nao poderia usar `includes`');
else fail('`contar`', String(contar('<?>', '<?>')));

/**
 * ================== A ARMADILHA DA CAIXA ALTA ==================
 *
 * A prova do cartao de nivel compara contra `Nível VIP`, com acento e em caixa
 * mista. Se ela comparasse contra o texto JA em caixa alta (`NÍVEL VIP`),
 * passaria hoje e continuaria passando mesmo se o `uppercase` saisse da classe:
 * o CSS nao aparece no texto extraido de um HTML, e o texto do dado nunca sobe
 * de caixa sozinho.
 */
if (!textos('<p class="x">Nível VIP</p>').includes('NÍVEL VIP') &&
    textos('<p class="x">Nível VIP</p>').includes('Nível VIP'))
  ok('comparar contra o texto em caixa alta nao provaria nada', 'o CSS nao esta no texto — a prova seria oca');
else fail('a comparacao de caixa alta', 'o texto extraido ja viria em caixa alta');

/**
 * ================== A CONTRAPROVA DO FILTRO QUE SAIU ==================
 *
 * Se alguem reintroduzir o filtro de validade no resumo, o `CLOSET10` do print
 * some do cartao. As duas contagens abaixo tem que DISCORDAR: uma lista mostra
 * o cupom, a outra nao. Se concordassem, a contraprova nao estaria medindo nada.
 */
const comFiltro = demo.DEMO_CUPONS_CLIENTE.filter((c) => !metricas.cupomFechado(c, NO_PRINT));
if (comFiltro.length === 0 && r.cuponsAtivos.length === 1)
  ok('com o filtro de validade, o cartao abriria VAZIO', 'as duas contagens discordam — a contraprova mede algo');
else fail('o filtro nao muda nada', 'a contraprova nao distingue os dois criterios');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
