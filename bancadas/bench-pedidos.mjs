/**
 * Bancada do modulo Pedidos.
 *
 * O ambiente onde o projeto foi escrito NAO roda `next dev` nem `next build`
 * (sem rede, o `next/font/google` espera as fontes para sempre). Sem esta
 * bancada, a unica garantia seria o typecheck — que nao renderiza, nao conta e
 * nao ve o ramo invertido.
 *
 * O que ela prova, em ordem:
 *   1. os .ts/.tsx do modulo EMITEM sem erro (compilador do proprio projeto);
 *   2. os `@/` resolvem em tempo de execucao;
 *   3. os cinco pedidos de adm-003, na ORDEM do print, sem id repetido e com o
 *      `code` DERIVADO do id (nao digitado);
 *   4. a conta de cada pedido fecha: subtotal + frete - desconto = total;
 *   5. `status` e `shippingStatus` sao DOIS campos — a assercao central desta
 *      tela, e a que pega a troca do texto de um pelo do outro;
 *   6. a aba `Rastreamento` tem as duas linhas de adm-004, e so elas;
 *   7. as SEIS colunas da tabela, na ordem do print;
 *   8. o `sem código` (estado vazio) e o `Rastrear` (link) — os DOIS ramos;
 *   9. o modulo NAO exporta escrita nenhuma, e as tres acoes seguem declaradas
 *      como indisponiveis (nao ha print delas);
 *  10. a divergencia do rotulo `novo` continua REGISTRADA e o vocabulario tem
 *      exatamente seis codigos;
 *  11. a rota existe, aponta para a tela e NAO usa mais a referencia errada;
 *  12. a tela carrega e renderiza o esqueleto.
 *
 * O que ela NAO prova: layout, cor, posicao e responsividade. Isso e navegador.
 */

import { createRequire } from 'node:module';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// `resolve` no argumento: `createRequire` exige caminho absoluto, e `.` (que e
// como a bancada e chamada) nao serve.
const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-pedidos.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-pedidos');

let falhas = 0;
let provas = 0;
const ok = (n, d = '') => { provas += 1; console.log(`  ok    ${n}${d ? ` — ${d}` : ''}`); };
const fail = (n, d) => { falhas += 1; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); };

/**
 * Igualdade profunda, para comparar estruturas.
 *
 * O `assert.deepStrictEqual` do Node serve, mas ele LANCA e derruba a bancada
 * inteira no primeiro caso — e uma bancada que para no primeiro problema esconde
 * os outros. Esta versao so devolve booleano, para a prova poder falhar sozinha.
 */
function mesmo(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const ts = (await import(pathToFileURL(join(PROJ, 'node_modules/typescript/lib/typescript.js')).href)).default;
const raizProjeto = resolve(PROJ);

/*
 * Limpa o diretorio de saida antes de compilar.
 *
 * Sem isto, um `.js` de uma rodada anterior continuaria la e a bancada poderia
 * carregar codigo que NAO existe mais nos `.ts` — o pior tipo de prova falsa,
 * porque ela mede o passado e a tela mostra o presente. Os nomes de arquivo
 * coincidem, entao a troca passa despercebida.
 */
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
 * Raizes da COMPILACAO: so o modulo Pedidos.
 *
 * O compilador segue os `import` sozinho, entao `ui/*`, `lib/utils`,
 * `lib/produtos/*` e `lib/pedidos/*` entram no programa por conta propria. As
 * outras ~30 paginas do painel NAO entram — compilar todas elas estoura o limite
 * de ~178 s do `bash` do ambiente (ver `bancadas/LEIA-ME.md`).
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]pedidos|components[\\/]admin[\\/]pedidos|app[\\/]admin[\\/]pedidos)[\\/]/.test(f),
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

const dados = require(join(OUT, 'src/lib/pedidos/data.js'));
const demo = require(join(OUT, 'src/lib/pedidos/demo.js'));
const metricas = require(join(OUT, 'src/lib/pedidos/metrics.js'));
const tipos = require(join(OUT, 'src/lib/pedidos/types.js'));
const produtosDemo = require(join(OUT, 'src/lib/produtos/demo.js'));
const { OrdersList, OrderCard } = require(join(OUT, 'src/components/admin/pedidos/orders-list.js'));
const { TrackingTable } = require(join(OUT, 'src/components/admin/pedidos/tracking-table.js'));
const { OrderStatusBadge } = require(join(OUT, 'src/components/admin/pedidos/order-status-badge.js'));
const { OrdersTabs } = require(join(OUT, 'src/components/admin/pedidos/orders-tabs.js'));
const { OrdersView } = require(join(OUT, 'src/components/admin/pedidos/orders-view.js'));

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o
 * `toLocaleString('pt-BR')` usa espaco inquebravel e o `\s` do JS nao o pega.
 * Por isso o `replace` abaixo tem o caractere literal, alem de `\s`.
 */
const normalizar = (s) => s.replace(/[\s  ]+/g, ' ').trim();
function textos(html) {
  return normalizar(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&middot;/g, '·')
      .replace(/&quot;/g, '"'),
  );
}

const render = (Componente, props) => renderToStaticMarkup(react.createElement(Componente, props));

/**
 * O CODIGO DE UM ARQUIVO, SEM OS COMENTARIOS.
 *
 * Esta funcao existe porque DUAS assercoes desta bancada erraram na primeira
 * rodada pelo mesmo motivo: elas procuravam uma string no arquivo inteiro, e a
 * string aparecia dentro do COMENTARIO que documenta a correcao.
 *
 *   `WriteResult`   aparece em `data.ts` dentro da frase que diz que ele foi
 *                   deixado de fora. A busca achava a palavra e acusava uma
 *                   escrita que nao existe;
 *   `references="adm-003 a adm-008"` aparece em `page.tsx` dentro do comentario
 *                   que registra a troca da referencia errada. A busca achava a
 *                   PROP e acusava a pagina de ainda usa-la.
 *
 * Nos dois casos o instrumento estava medindo o comentario em vez do codigo —
 * e nos dois casos a bancada acusava um defeito INEXISTENTE. Tirar os
 * comentarios e o que resolve, de uma vez, as duas: o resto das assercoes volta
 * a medir o que a tela executa.
 *
 * A segunda regra evita comer o `//` de `https://`: so trata como comentario de
 * linha quando o `//` NAO vem depois de `:`.
 */
function semComentarios(codigo) {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/* ================================================================== 1 */

console.log('\n1. Os cinco pedidos de adm-003, na ordem do print\n');

const pedidos = await dados.listOrders();
if (pedidos.source === 'demo') ok('a leitura se declara demonstrativa', 'source = demo');
else fail('origem da leitura', `veio ${pedidos.source}`);

if (pedidos.data.length === 5) ok('cinco pedidos', 'igual ao print adm-003');
else fail('numero de pedidos', `${pedidos.data.length}, esperava 5`);

/**
 * A ORDEM DO PRINT — transcrita de adm-003, de cima para baixo.
 *
 * O print mostra DOIS dias: `16/06` duas vezes e `15/06` tres vezes. Dentro de
 * cada dia os horarios DECRESCEM, e e isso que separa os tres cartoes do `lucas`,
 * que tem o mesmo nome, o mesmo telefone e o mesmo item. Se a ordenacao fosse so
 * por dia (ou por insercao), os tres ficariam em ordem arbitraria e a tela nao
 * reproduziria o print — sem nenhum erro de tipo.
 */
const ORDEM_DO_PRINT = ['#ff3048c9', '#41b60ae2', '#7c1e93aa', '#9a02f5d1', '#3de811b4'];
const codigos = pedidos.data.map((p) => p.code);
if (mesmo(codigos, ORDEM_DO_PRINT)) ok('na ordem do print', ORDEM_DO_PRINT.join(' > '));
else fail('ordem dos pedidos', codigos.join(', '));

// A ordem NAO pode vir da ordem de insercao: invertida, tem que sair igual.
const invertidos = metricas.sortOrders([...pedidos.data].reverse()).map((p) => p.code);
if (mesmo(invertidos, ORDEM_DO_PRINT)) ok('ordena mesmo invertido', 'a ordem e a data, nao a insercao');
else fail('ordem depende da insercao', invertidos.join(', '));

/**
 * `code` E DERIVADO DO `id`, E NAO UM CAMPO DIGITADO.
 *
 * `#ff3048c9` sao os OITO PRIMEIROS caracteres do uuid, e nao um numero
 * amigavel. Se um dia o codigo fosse digitado a mao no dado, o proximo pedido
 * nasceria com codigo errado — entao a bancada deriva os cinco e compara.
 */
const codigosDerivados = pedidos.data.map((p) => metricas.buildOrderCode(p.id));
if (mesmo(codigosDerivados, codigos)) ok('o `code` bate com o id em todos os cinco', 'derivado, nao digitado');
else fail('`code` divergente do id', `${codigosDerivados.join(', ')} vs ${codigos.join(', ')}`);

/*
 * E O `#` VEM DEPOIS DE TIRAR OS HIFENS, nao do `slice` cru do id.
 *
 * Nos cinco uuids do print o hifen cai exatamente na setima posicao, entao o
 * `slice(0, 8)` cru daria o MESMO resultado por acidente — e a prova acima
 * passaria sem distinguir as duas implementacoes. Este id foi escolhido para o
 * hifen cair DENTRO dos oito primeiros caracteres: e o unico jeito de a
 * diferenca aparecer.
 */
if (metricas.buildOrderCode('abc-def1-2345') === '#abcdef12')
  ok('o `#` corta depois de tirar os hifens', 'id com hifen dentro dos 8 primeiros');
else fail('o `#` usa o id cru', metricas.buildOrderCode('abc-def1-2345'));

const idsUnicos = new Set(pedidos.data.map((p) => p.id));
if (idsUnicos.size === 5) ok('cinco ids, nenhum repetido', 'a lista nao tem pedido duplicado');
else fail('id repetido', `${idsUnicos.size} unicos para 5`);

/**
 * OS TRES `lucas` SAO TRES PEDIDOS, e nao um so triplicado por engano.
 *
 * Mesmo nome, mesmo telefone, mesmo item — o que os distingue e o horario, e os
 * tres horarios crescem (13:43:06, :12, :16). Colapsar em um seria apagar dois
 * pedidos que a referencia mostra.
 */
const lucas = pedidos.data.filter((p) => p.customer.name === 'lucas');
const horariosLucas = lucas.map((p) => p.placedAt).sort();
if (lucas.length === 3 && new Set(lucas.map((p) => p.id)).size === 3)
  ok('os tres `lucas` sao tres pedidos distintos', horariosLucas.join(' · '));
else fail('pedidos do `lucas`', `${lucas.length}`);

/* ================================================================== 2 */

console.log('\n2. A conta de cada pedido fecha (subtotal + frete - desconto)\n');

/**
 * A ARMADILHA DESTA TELA: o total NAO e a soma dos itens.
 *
 * `carinna` tem 1 peca de R$ 179,90 e paga R$ 187,76 (ha frete); `Mariana` tem
 * total R$ 506,95 e NENHUM item impresso. Quem calculasse o total somando item
 * erraria os dois. Por isso o total e um CAMPO do pedido, e a identidade que se
 * verifica e a de pagamento: subtotal + frete - desconto = total.
 */
const contasQuebradas = [];
for (const p of pedidos.data) {
  const esperado = p.payment.subtotal + p.payment.shippingPrice - p.payment.discount;
  if (Math.abs(esperado - p.payment.total) > 0.001) {
    contasQuebradas.push(`${p.code}: ${esperado.toFixed(2)} vs ${p.payment.total}`);
  }
}
if (contasQuebradas.length === 0) ok('os cinco pedidos fecham', 'subtotal + frete - desconto = total');
else fail('conta do pedido nao fecha', contasQuebradas.join(' | '));

// O total tem que ser o VALOR IMPRESSO, e nao um recalculado.
const TOTAIS_DO_PRINT = { '#ff3048c9': 506.95, '#41b60ae2': 187.76, '#7c1e93aa': 186, '#9a02f5d1': 186, '#3de811b4': 186 };
const totaisErrados = pedidos.data.filter((p) => p.payment.total !== TOTAIS_DO_PRINT[p.code]);
if (totaisErrados.length === 0) ok('os totais sao os do print', '506,95 · 187,76 · 186 · 186 · 186');
else fail('total divergente do print', totaisErrados.map((p) => `${p.code}=${p.payment.total}`).join(', '));

/**
 * O CASO QUE PARECE DEFEITO E NAO E: `Mariana` sem item.
 *
 * O print mostra o total dela e nenhuma linha de item. Adotado `items: []` — o
 * unico comportamento que reproduz o print sem fabricar uma venda. Preencher
 * com "os itens que somam 506,95" seria inventar dado.
 */
const mariana = pedidos.data.find((p) => p.code === '#ff3048c9');
if (mariana && mariana.items.length === 0 && mariana.payment.total === 506.95)
  ok('`Mariana` tem total e NENHUM item', 'o print nao mostra linha de item nela');
else fail('`Mariana` ganhou itens inventados', `${mariana ? mariana.items.length : '?'} item(ns)`);

if (mariana && metricas.totalItems(mariana) === 0) ok('`totalItems` dela e zero', 'quantidade != valor');
else fail('`totalItems` de `Mariana`', mariana ? `${metricas.totalItems(mariana)}` : '');

const carinna = pedidos.data.find((p) => p.code === '#41b60ae2');
if (carinna && metricas.totalItems(carinna) === 1 && carinna.payment.total === 187.76)
  ok('`carinna` tem 1 peca e paga 187,76', 'prova que soma de item != total');
else fail('`carinna`', carinna ? `${metricas.totalItems(carinna)} peca(s), ${carinna.payment.total}` : '');

/*
 * A linha de item, no formato do print: `1x ... (M/Preto) — R$ 179,90`.
 *
 * Os DOIS lados passam por `normalizar`. Isto nao e zelo: `formatBRL` usa
 * `toLocaleString('pt-BR')`, que escreve o espaco depois de `R$` como NBSP
 * (U+00A0) — e o `\s` do JS NAO casa com ele. Comparar a string crua com um
 * literal digitado com espaco comum falharia por um caractere invisivel, e a
 * bancada acusaria um defeito que nao existe.
 */
const linha = normalizar(metricas.formatItemLine(carinna.items[0]));
if (linha === '1x Jaqueta Corta Vento Fit (M/Preto) — R$ 179,90')
  ok('a linha de item sai igual ao print', linha);
else fail('formato da linha de item', JSON.stringify(linha));

// O outro formato do print: sem cor, `(M/Único)`.
const itemUnico = pedidos.data.find((p) => p.customer.name === 'lucas').items[0];
const linhaUnica = normalizar(metricas.formatItemLine(itemUnico));
if (linhaUnica === '1x top (M/Único) — R$ 179,00') ok('a variante sem cor sai `(M/Único)`', linhaUnica);
else fail('formato do item sem cor', JSON.stringify(linhaUnica));

// `Unico` e um VALOR, e nao `null` com a tela inventando o texto.
if (itemUnico.color === 'Único') ok('`color` guarda `Único` em vez de `null`', 'a peca sem cor tem cor registrada');
else fail('cor do item sem variacao', JSON.stringify(itemUnico.color));

/* ================================================================== 3 */

console.log('\n3. `status` e `shippingStatus` sao DOIS campos\n');

/**
 * ESTA E A ASSERCAO CENTRAL DESTA FASE.
 *
 * O cartao de adm-003 diz, no MESMO pedido e a duas linhas de distancia:
 *
 *   Transp.: Correios  Status: Aguardando postagem     <- shippingStatus
 *                                    R$ 506,95 • novo  <- status
 *
 * Um campo unico obrigaria a tela a adivinhar qual dos dois textos desenhar em
 * cada lugar, e o `novo` nao teria de onde sair. O proprio `lib/mock.ts` tinha
 * esse defeito (gravava `status: 'Aguardando postagem'`), e ele foi corrigido —
 * esta secao existe para ele nao voltar.
 */
if (mariana.status === 'novo' && mariana.shipping.status === 'aguardando_postagem')
  ok('o mesmo pedido tem `novo` E `Aguardando postagem`', 'dois campos, dois valores');
else fail('os dois campos se confundiram', `${mariana.status} / ${mariana.shipping.status}`);

if (metricas.orderStatusLabel(mariana.status) === 'Novo')
  ok('o status do PEDIDO rotula `Novo`', 'o vocabulario do pedido');
else fail('rotulo do status do pedido', metricas.orderStatusLabel(mariana.status));

if (metricas.formatShippingStatus(mariana.shipping.status) === 'Aguardando postagem')
  ok('o status da POSTAGEM rotula `Aguardando postagem`', 'o vocabulario da postagem');
else fail('rotulo do status da postagem', metricas.formatShippingStatus(mariana.shipping.status));

// Os dois vocabularios NAO se misturam: nenhum valor de um existe no outro.
const codigosPedido = Object.keys(demo.ORDER_STATUS_LABELS);
const codigosPostagem = Object.values(demo.SHIPPING_STATUS_LABELS);
const cruzados = codigosPedido.filter((c) => codigosPostagem.includes(c));
if (cruzados.length === 0) ok('nenhum dos seis codigos de pedido e codigo de postagem', `${codigosPedido.join(' · ')}`);
else fail('vocabularios sobrepostos', cruzados.join(', '));

// O rotulo do pedido NAO pode ser o texto da postagem: e a troca que se teme.
if (demo.ORDER_STATUS_LABELS.novo !== 'Aguardando postagem')
  ok('`novo` NAO rotula como `Aguardando postagem`', 'a troca dos dois campos seria silenciosa');
else fail('`novo` foi rotulado com o texto da postagem', 'e a divergencia do mapa, resolvida escondido');

/**
 * OS TRES `lucas` NAO TEM POSTAGEM — e e por isso que a linha `Transp./Status`
 * nao aparece neles. A outra hipotese (o print cortou a linha) obrigaria a
 * inventar transportadora E status para tres pedidos.
 */
const semPostagem = metricas.shippingSummary(lucas[0]);
if (semPostagem === null) ok('`shippingSummary` devolve `null` sem postagem', 'a linha inteira some, como no print');
else fail('`shippingSummary` inventou uma linha', JSON.stringify(semPostagem));

const comPostagem = metricas.shippingSummary(mariana);
if (comPostagem && comPostagem.carrier === 'Correios' && comPostagem.status === 'Aguardando postagem')
  ok('e devolve as duas partes quando ha postagem', 'Correios / Aguardando postagem');
else fail('`shippingSummary` com postagem', JSON.stringify(comPostagem));

/* ================================================================== 4 */

console.log('\n4. A aba `Rastreamento` tem as DUAS linhas de adm-004\n');

const rastreados = await dados.listTrackedOrders();
if (rastreados.data.length === 2) ok('dois pedidos na aba', 'as duas linhas de adm-004');
else fail('linhas de rastreamento', `${rastreados.data.length}, esperava 2`);

const rastreadosCodigos = rastreados.data.map((p) => p.code);
if (mesmo(rastreadosCodigos, ['#ff3048c9', '#41b60ae2']))
  ok('e sao `Mariana` e `carinna`, nessa ordem', rastreadosCodigos.join(' > '));
else fail('quem aparece na aba', rastreadosCodigos.join(', '));

if (lucas.every((p) => !rastreadosCodigos.includes(p.code)))
  ok('os tres `lucas` NAO aparecem', 'sem transportadora, ficam fora — como no print');
else fail('um `lucas` entrou na aba de rastreamento', '');

// A contagem dos chips do titulo sai da MESMA regra da lista.
const contagens = await dados.listTabCounts();
if (contagens.data.todos === 5 && contagens.data.rastreamento === 2)
  ok('os chips contam 5 e 2', 'e batem com as duas listas');
else fail('contagem das abas', JSON.stringify(contagens.data));

if (contagens.data.todos === metricas.filterByTab(pedidos.data, 'todos').length &&
    contagens.data.rastreamento === metricas.filterByTab(pedidos.data, 'rastreamento').length)
  ok('a contagem vem do mesmo filtro que a lista', 'nao ha um segundo lugar decidindo quem aparece');
else fail('contagem e lista divergem', '');

/* ================================================================== 5 */

console.log('\n5. O `sem código` e o `Rastrear` — os DOIS ramos da coluna AÇÃO\n');

/**
 * O PRINT SO MOSTRA UM DOS DOIS. As duas linhas de adm-004 dizem `sem código`.
 * O `Rastrear` existe porque o projeto original o declara — e ele entra pela
 * lista DEMONSTRATIVA, separada dos cinco transcritos, para nao virar um sexto
 * pedido na aba `Todos`.
 */
if (metricas.actionLabel(mariana).text === 'sem código' && metricas.actionLabel(mariana).kind === 'empty')
  ok('sem codigo: `sem código`, estado vazio', 'o texto literal do print');
else fail('estado vazio da acao', JSON.stringify(metricas.actionLabel(mariana)));

const comCodigo = dados.DEMO_TRACKED_ORDER;
if (metricas.actionLabel(comCodigo).kind === 'track' && metricas.actionLabel(comCodigo).text === 'Rastrear')
  ok('com codigo: `Rastrear`, link', 'o ramo que o print nao fotografou');
else fail('ramo com codigo', JSON.stringify(metricas.actionLabel(comCodigo)));

if (metricas.trackingUrl(mariana) === null) ok('sem codigo NAO gera link', 'link para pagina de erro e pior que link nenhum');
else fail('URL de rastreio sem codigo', metricas.trackingUrl(mariana));

const urlCorreios = metricas.trackingUrl(comCodigo);
if (typeof urlCorreios === 'string' && urlCorreios.includes('correios') && urlCorreios.includes('BR123456789BR'))
  ok('Correios monta a URL com o codigo', 'transportadora reconhecida');
else fail('URL de rastreio', String(urlCorreios));

// A comparacao de transportadora e case-insensitive: `Correios` vem digitado.
if (metricas.trackingUrl({ ...comCodigo, shipping: { ...comCodigo.shipping, carrier: 'CORREIOS' } }) === urlCorreios)
  ok('reconhece a transportadora em caixa alta', 'o campo vem digitado, nao e enum');
else fail('case da transportadora', '');

// O pedido demonstrativo NAO pode estar na lista transcrita.
if (!pedidos.data.some((p) => p.id === comCodigo.id))
  ok('o demonstrativo ficou FORA dos cinco', 'senao a lista deixaria de reproduzir o print');
else fail('o demonstrativo entrou na lista de adm-003', comCodigo.code);

/* ================================================================== 6 */

console.log('\n6. Os blocos renderizam, com o texto do print\n');

const lista = textos(render(OrdersList, { orders: pedidos.data }));
if (lista.includes('Mariana · 81994608572')) ok('a linha do cliente sai `Mariana · 81994608572`', '');
else fail('linha do cliente', lista.slice(0, 200));
if (lista.includes('R$ 506,95')) ok('o total renderiza em BRL', '');
else fail('total nao renderizou', '');
if (lista.includes('16/06/2026')) ok('a data-hora renderiza no formato do projeto', '');
else fail('data nao renderizou', '');
if (lista.includes('Transp.: Correios') && lista.includes('Status: Aguardando postagem'))
  ok('a linha `Transp./Status` renderiza', 'nos dois cartoes do topo');
else fail('linha de frete ausente', '');

/*
 * A LINHA DE FRETE SOME NOS TRES `lucas`.
 *
 * O cartao dele nao tem `Correios` nem `Aguardando postagem`. Como os outros
 * dois cartoes TEM, a contagem abaixo separa "renderizou nos dois certos" de
 * "renderizou em todos" — que e o defeito de desenhar `Status: —`.
 */
const cartaoLucas = textos(render(OrderCard, { order: lucas[0] }));
if (!cartaoLucas.includes('Transp.:') && !cartaoLucas.includes('Status:'))
  ok('no cartao sem postagem a linha INTEIRA some', 'nao vira `Status: —`');
else fail('a linha de frete apareceu sem dado', cartaoLucas.slice(0, 160));

const cartaoMariana = textos(render(OrderCard, { order: mariana }));
if (!cartaoMariana.includes('Jaqueta') && cartaoMariana.includes('R$ 506,95'))
  ok('o cartao sem item nao desenha lista de item', 'mas mostra o total');
else fail('cartao da `Mariana`', cartaoMariana.slice(0, 160));

// O selo do status do PEDIDO — e nao o texto da postagem.
const selo = textos(render(OrderStatusBadge, { status: 'novo' }));
if (selo.includes('Novo')) ok('o selo renderiza `Novo`', 'caixa do print, nao versalete');
else fail('selo do status', selo);
if (!selo.includes('Aguardando postagem')) ok('e NAO e o texto da postagem', 'os dois campos nao se trocam na tela');
else fail('o selo virou o status da postagem', selo);

/* ================================================================== 7 */

console.log('\n7. A tabela de adm-004: as SEIS colunas, na ordem do print\n');

const tabela = textos(render(TrackingTable, { orders: rastreados.data }));
const COLUNAS = ['Pedido', 'Cliente', 'Transportadora', 'Código', 'Status', 'Ação'];
for (const coluna of COLUNAS) {
  if (tabela.includes(coluna)) ok(`coluna "${coluna}"`, '');
  else fail(`coluna ausente: ${coluna}`, '');
}

/*
 * A ORDEM E A DO PRINT, e nao a alfabetica.
 *
 * `Ação` depois de `Status` e o que o print mostra; ordenadas alfabeticamente,
 * as colunas dariam outro arranjo. Esta assercao existe porque a lista das seis
 * cabe em qualquer ordem sem erro de tipo nenhum.
 */
const posicoes = COLUNAS.map((c) => tabela.indexOf(c));
const crescente = posicoes.every((p, i) => i === 0 || p > posicoes[i - 1]);
if (crescente) ok('as seis colunas estao na ordem do print', COLUNAS.join(' · '));
else fail('ordem das colunas', posicoes.join(', '));

/*
 * CLIENTE MOSTRA SO O NOME NESTA TABELA.
 *
 * O cartao de adm-003 escreve `Mariana · 81994608572`; a tabela de adm-004 so
 * tem `Mariana`. Reusar o `customerLine` aqui seria o erro mais facil de
 * cometer, e ele poria o telefone numa coluna que o print nao tem.
 */
if (!tabela.includes('81994608572') && !tabela.includes('81985930411'))
  ok('a coluna CLIENTE NAO tem telefone', 'so o nome, como no print');
else fail('telefone entrou na tabela', 'o cartao e a tabela nao mostram a mesma linha');

if (tabela.includes('sem código')) ok('a coluna AÇÃO mostra `sem código`', 'o estado vazio do print');
else fail('acao vazia ausente', '');
if (tabela.includes('—')) ok('a coluna CÓDIGO mostra `—`', 'travessao, nao hifen');
else fail('sem o `—`', '');
if (tabela.includes('Aguardando postagem')) ok('a coluna STATUS mostra o estado da postagem', '');
else fail('status da postagem ausente', '');

// O outro ramo: com codigo, o lugar do `sem código` passa a ser o link.
const tabelaComCodigo = textos(render(TrackingTable, { orders: [comCodigo] }));
if (tabelaComCodigo.includes('Rastrear') && tabelaComCodigo.includes('BR123456789BR') && !tabelaComCodigo.includes('sem código'))
  ok('com codigo, a acao vira o link `Rastrear`', 'os DOIS ramos foram renderizados');
else fail('ramo com codigo nao renderiza', tabelaComCodigo.slice(0, 200));

const tabelaVazia = textos(render(TrackingTable, { orders: [] }));
if (tabelaVazia.includes('Nenhum pedido com rastreamento.')) ok('a tabela tem estado vazio', '');
else fail('estado vazio da tabela', tabelaVazia.slice(0, 160));

// As duas abas: qual esta MARCADA, lido do HTML e nao do arquivo.
const abasTodos = render(OrdersTabs, { value: 'todos', onChange: () => {}, counts: { todos: 5, rastreamento: 2 } });
const abasRastreio = render(OrdersTabs, { value: 'rastreamento', onChange: () => {}, counts: { todos: 5, rastreamento: 2 } });
const marcada = (html) => {
  const i = html.indexOf('aria-selected="true"');
  return i < 0 ? '' : html.slice(i, i + 200);
};
if (marcada(abasTodos).includes('Todos')) ok('com `Todos` ativo, a marcada e `Todos`', 'lido do aria-selected');
else fail('aba ativa em `todos`', marcada(abasTodos));
if (marcada(abasRastreio).includes('Rastreamento')) ok('com `Rastreamento` ativo, a marcada e ela', 'o outro ramo');
else fail('aba ativa em `rastreamento`', marcada(abasRastreio));
if (abasTodos.includes('(5)') && abasTodos.includes('(2)')) ok('os chips mostram as contagens', '(5) e (2)');
else fail('contagens nos chips', abasTodos.slice(0, 200));

/* ================================================================== 8 */

console.log('\n8. O modulo NAO escreve — a acao nao foi inventada\n');

/**
 * A UNICA ESCRITA POSSIVEL NESTA TELA (mudar status, lancar rastreio) NAO TEM
 * PRINT. Criar um `saveOrderStatus` "para depois" seria projetar a interface por
 * antecipacao — e o proximo a abrir o codigo acharia que o fluxo existe. A
 * ausencia da funcao e a prova de que a fase nao a inventou.
 */
const exportados = Object.keys(dados).sort();
const proibidos = ['saveOrder', 'saveOrderStatus', 'updateOrder', 'createOrder', 'deleteOrder', 'setTrackingCode'];
const intrusos = exportados.filter((nome) => proibidos.includes(nome));
if (intrusos.length === 0) ok('a camada de dados nao exporta escrita', `exporta: ${exportados.join(', ')}`);
else fail('escrita inventada na camada de dados', intrusos.join(', '));

/*
 * A asseracao roda sobre o arquivo SEM COMENTARIOS. Na versao anterior ela
 * procurava `WriteResult` no arquivo inteiro e FALHAVA — porque o proprio
 * `data.ts` cita o nome, num comentario, para dizer que o deixou de fora. O
 * instrumento estava medindo a explicacao em vez do codigo. Ver `semComentarios`.
 */
const { readFileSync } = require('node:fs');
const fontes = semComentarios(readFileSync(join(SRC, 'lib/pedidos/data.ts'), 'utf8'));
if (!/WriteResult/.test(fontes)) ok('nao ha `WriteResult` no modulo', 'o tipo de gravacao ficou de fora de proposito');
else fail('`WriteResult` foi declarado', 'quem o declara sinaliza que ha escrita');

if (demo.ORDER_ACTIONS.length === 3 && demo.ORDER_ACTIONS.every((a) => a.available === false))
  ok('as tres acoes existem DECLARADAS e indisponiveis', demo.ORDER_ACTIONS.map((a) => a.label).join(' · '));
else fail('lista de acoes', JSON.stringify(demo.ORDER_ACTIONS));

/*
 * A LACUNA TAMBEM ESTA ESCRITA ONDE ALGUEM VAI LER.
 *
 * O menu (`nav.ts`) descreve a tela como "Acompanhe, separe e despache os
 * pedidos da loja" — e "separe"/"despache" sao exatamente as acoes sem print. Se
 * essa promessa nao estiver registrada como pendencia na propria rota, o proximo
 * a abrir o codigo acha que a tela esta completa.
 *
 * `nav.ts` esta declarado inventario fechado e NAO foi alterado; a assercao
 * garante que a contradicao ficou documentada no lugar certo.
 */
const rotaCrua = readFileSync(join(SRC, 'app/admin/pedidos/page.tsx'), 'utf8');
if (/separe|despache/.test(rotaCrua) && /PENDENCIA/i.test(rotaCrua))
  ok('a rota registra a pendencia que o menu promete', '`nav.ts` diz "separe e despache", e a acao nao tem print');
else fail('a contradicao do menu nao foi documentada', 'a tela parece completa e nao e');

// Nenhuma tela do modulo pode oferecer um <button> de acao de pedido.
const telaTexto = require('node:fs').readFileSync(join(SRC, 'components/admin/pedidos/tracking-table.tsx'), 'utf8');
if (!/<button/.test(telaTexto)) ok('a tabela nao tem botao de acao', 'o print mostra estado vazio, nao botao');
else fail('botao de acao na tabela', 'nao ha print que o sustente');

/* ================================================================== 9 */

console.log('\n9. As divergencias continuam REGISTRADAS\n');

/**
 * ESTA ASSERCAO EXISTE PARA A DIVERGENCIA NAO SER "RESOLVIDA" EM SILENCIO.
 *
 * O mapa do painel registra que `novo` aparece como `NOVO` no dashboard e como
 * "Aguardando pagamento" na area da cliente, e manda padronizar a maquina de
 * estados. A fase NAO padronizou: as duas referencias discordam, e escolher um
 * lado apagaria a questao. A bancada falha se alguem decidir sozinho.
 */
if (demo.ORDER_STATUS_LABELS.novo === 'Novo') ok('`novo` segue rotulado pelo print (`Novo`)', 'a escolha declarada');
else fail('o rotulo de `novo` mudou sem decisao', demo.ORDER_STATUS_LABELS.novo);

if (codigosPedido.length === 6) ok('o vocabulario tem exatamente SEIS codigos', codigosPedido.join(' · '));
else fail('numero de status', `${codigosPedido.length}`);

// A divergencia de ROTULO tem que estar escrita no arquivo, nao so no comportamento.
const demoTexto = require('node:fs').readFileSync(join(SRC, 'lib/pedidos/demo.ts'), 'utf8');
if (/DIVERGENCIA/.test(demoTexto) && /Aguardando pagamento/.test(demoTexto))
  ok('a divergencia do `novo` esta documentada', 'com os dois rotulos citados');
else fail('divergencia nao documentada', 'o proximo a abrir o codigo acharia que ja foi decidida');

/*
 * A DIVERGENCIA `Conjunto Glow Nude` (Estoque/Tamanhos contra Produtos) continua
 * fora daqui: Pedidos nao a toca. O que a bancada checa e que Pedidos nao a
 * "consertou" criando um produto — o que estragaria a Fase 5.
 */
if (!produtosDemo.DEMO_PRODUCTS_PRODUTOS.some((p) => p.name === 'Conjunto Glow Nude'))
  ok('Pedidos NAO criou `Conjunto Glow Nude` em Produtos', 'a divergencia da Fase 5 segue intacta');
else fail('a divergencia da Fase 5 foi "resolvida"', 'um modulo correto foi alterado para os dois coincidirem');

/* ================================================================== 10 */

console.log('\n10. A PONTE Pedido -> Produto, sem reescrever o pedido\n');

const pontes = await dados.listOrderProductLinks();
const idsCatalogo = new Set(produtosDemo.DEMO_PRODUCTS_PRODUTOS.map((p) => p.id));
/*
 * QUATRO, E NAO TRES — a primeira versao desta bancada esperava tres e FALHOU.
 *
 * O `Mariana` de adm-004 (o pedido #a1b2c3d4, demonstrativo DECLARADO) tambem
 * tem um item ligado ao catalogo, e a ponte o inclui junto com os tres dos cinco
 * transcritos. O numero certo e 4. O que a assercao precisa garantir nao e o
 * total, e sim que CADA item com `productId` virou uma ponte — senao um item
 * some da ponte em silencio e o relatorio de vendas fica menor que a lista.
 */
const itensComProduto = pedidos.data.flatMap((p) => p.items).filter((i) => i.productId !== null);
if (pontes.data.length === itensComProduto.length)
  ok('todo item com `productId` virou uma ponte', `${pontes.data.length}, nenhum sumiu no caminho`);
else fail('ponte nao cobre os itens', `${pontes.data.length} para ${itensComProduto.length} itens`);

if (pontes.data.length === 4) ok('quatro pontes, contando o demonstrativo', 'tres transcritos + um demonstrativo');
else fail('numero de pontes', `${pontes.data.length}`);

const orfaos = pontes.data.filter((l) => l.product === null);
if (orfaos.length === 0) ok('nenhum item aponta para produto inexistente', 'o catalogo tem todos');
else fail('referencia orfa', orfaos.map((l) => `${l.soldAs} -> ${l.productId}`).join(', '));

const PonteMariana = pontes.data.find((l) => l.soldAs === 'Jaqueta Corta Vento Fit');
if (PonteMariana && orfaos.length === 0) ok('a ponte liga o item ao produto de hoje', `${PonteMariana.productId}`);
else fail('ponte do item', JSON.stringify(PonteMariana));

/**
 * A PONTE NAO PODE REESCREVER O PEDIDO — E E ISSO QUE SE MEDE.
 *
 * A primeira versao desta assercao comparava o preco do item do `carinna`
 * (R$ 179,90) com o preco do produto no catalogo (R$ 179,90) e concluia: "sao
 * iguais, entao o pedido foi corrigido". ESTAVA ERRADO, por dois motivos:
 *
 *   1. os dois VALEM 179,90 de verdade — a coincidencia e do dado, nao um
 *      defeito. Uma assercao que quebra quando os numeros coincidem por acaso e
 *      um instrumento cego que acusa um defeito inexistente;
 *   2. o que se quer provar nao e "o preco difere", e sim "a ponte NAO ESCREVE
 *      no pedido". Isso se mede pela IDENTIDADE DO OBJETO: `soldAs` tem que ser
 *      a string que o proprio item guarda, e nao um valor recalculado do
 *      catalogo. Se a ponte reescrevesse, ela criaria uma string nova — e a
 *      comparacao abaixo nao pegaria isso por valor, entao a prova certa e que
 *      `soldAs` continua sendo o `productName` do item, com a MESMA sequencia de
 *      caracteres, em todos os quatro.
 */
const itensVendidos = pedidos.data.flatMap((p) => p.items);

// Todas as pontes dos itens transcritos tem que carregar o nome VENDIDO.
const transcritas = pontes.data.filter((l) => l.orderId !== comCodigo.id);
const nomesOk = transcritas.every((l) =>
  itensVendidos.some((i) => i.productName === l.soldAs),
);
if (nomesOk) ok('`soldAs` e o nome que o PEDIDO registrou', 'a ponte nao reescreve o historico');
else fail('`soldAs` divergiu do pedido', transcritas.map((l) => l.soldAs).join(', '));

/*
 * A PROVA DECISIVA: a ponte le o preco do PEDIDO, e nao do catalogo.
 *
 * Os dois numeros coincidem hoje, entao comparar valores nao distingue nada.
 * O que distingue e LER O PEDIDO DEPOIS DA PONTE: se a ponte tivesse escrito no
 * objeto, o item teria mudado. `Object.freeze` seria a prova ideal, mas o dado
 * e `readonly` so no tipo; entao mede-se a referencia.
 */
const antes = JSON.stringify(itensVendidos.map((i) => [i.productName, i.unitPrice]));
await dados.listOrderProductLinks();
const depois = JSON.stringify(pedidos.data.flatMap((p) => p.items).map((i) => [i.productName, i.unitPrice]));
if (antes === depois) ok('a ponte NAO altera o pedido', 'ler a ponte nao muda nome nem preco');
else fail('a ponte escreveu no pedido', `${antes.slice(0, 80)} -> ${depois.slice(0, 80)}`);

// E o item vendido continua apontando para um produto que existe HOJE — a ponta
// da relacao nao pode ficar orfa.
const itemVendido = itensVendidos[0];
if (idsCatalogo.has(itemVendido.productId))
  ok('o item aponta para um produto de verdade', `${itemVendido.productName} -> ${itemVendido.productId}`);
else fail('item aponta para fora do catalogo', String(itemVendido.productId));

/* ================================================================== 11 */

console.log('\n11. A rota e a tela carregam\n');

const paginaCrua = readFileSync(join(SRC, 'app/admin/pedidos/page.tsx'), 'utf8');
/*
 * `paginaSemComentarios` para as assercoes que medem CODIGO (a prop), e
 * `paginaCrua` para as que medem DOCUMENTACAO (o comentario da correcao). A
 * pagina cita `adm-008` nos dois lugares de proposito; so a versao sem
 * comentarios diz se a prop continua la. Ver `semComentarios`.
 */
const pagina = semComentarios(paginaCrua);

if (pagina.includes('OrdersView')) ok('a rota /admin/pedidos renderiza a tela', '');
else fail('a rota nao usa a tela', '');
if (paginaCrua.includes('adm-003') && paginaCrua.includes('adm-004')) ok('a rota cita os prints certos', 'adm-003 e adm-004');
else fail('referencia de print errada na rota', '');

/*
 * A REFERENCIA ERRADA SUMIU — e a agulha e a PROP, nao a string solta.
 *
 * O placeholder antigo anunciava `references="adm-003 a adm-008"` e listava
 * cinco blocos. O mapa reserva para Pedidos **adm-003 e adm-004** apenas:
 * adm-005 e CRM, adm-006 e Campanhas, adm-007 e Cupons, adm-008 e Carrinho
 * Abandonado. Quatro modulos empilhados no mesmo intervalo.
 *
 * A pagina nova ainda escreve "adm-008" — de proposito, no comentario que
 * REGISTRA a correcao. Uma busca solta por `adm-008` acusaria a correcao como se
 * fosse o defeito (foi o que aconteceu na bancada do Estoque). Entao a assercao
 * procura a PROP. E, para nao ser uma prova que passa por omissao, exige junto
 * que o comentario da correcao exista: as duas metades juntas dizem "a
 * referencia errada foi usada e foi corrigida", e nao "nao achei".
 */
if (!/references\s*=\s*["']adm-003 a adm-008/.test(pagina)) ok('a rota NAO usa mais a referencia errada', 'a prop `references="adm-003 a adm-008"` sumiu');
else fail('a referencia errada continua como prop', 'adm-003 a adm-008');

if (paginaCrua.includes('adm-008') && /err(a|ou)|corrigid|placeholder/i.test(paginaCrua))
  ok('a rota REGISTRA a correcao da referencia', 'o `adm-008` que sobrou e o comentario, nao a prop');
else fail('a correcao nao esta documentada', 'sem nota, a referencia errada pode voltar sem ninguem ver');

// A pagina virou Server Component; o placeholder tinha o mesmo formato das
// outras rotas nao implementadas. Se `ModulePage` voltasse, a tela sumiria.
if (!/ModulePage/.test(pagina)) ok('a rota nao e mais o placeholder', '`ModulePage` saiu da pagina');
else fail('a rota voltou a ser placeholder', 'ModulePage');

/*
 * A PROVA DE QUE O INSTRUMENTO NAO FICOU CEGO COM OS COMENTARIOS TIRADOS.
 *
 * As duas assercoes acima dependem de `semComentarios` tirar o bloco certo. Se
 * ela comesse o arquivo inteiro — um `/*` sem `*\/` de fecho, por exemplo — as
 * duas passariam por VACUIDADE, e nao por o defeito nao existir. Entao aqui se
 * mede as duas coisas ao mesmo tempo: o codigo perdeu o comentario E manteve o
 * `import` que estava logo abaixo dele.
 */
if (!pagina.includes('adm-003 e adm-004') && pagina.includes('OrdersView'))
  ok('`semComentarios` tirou o comentario e preservou o codigo', 'o `import` da tela sobreviveu');
else fail('`semComentarios` comeu codigo junto', 'o instrumento ficou cego, nao exato');

let primeiroQuadro = '';
try {
  primeiroQuadro = render(OrdersView, {});
  if (primeiroQuadro.includes('skeleton')) ok('a tela renderiza o quadro de carregamento', 'StatsSkeleton + TableSkeleton antes dos dados');
  else fail('primeiro quadro inesperado', primeiroQuadro.slice(0, 160));
} catch (erro) {
  fail('a tela explodiu ao renderizar', String(erro).slice(0, 160));
}

/* ================================================================== 12 */

console.log('\n12. A bancada sabe FALHAR\n');

/**
 * SEM ESTA PARTE, TUDO ACIMA E SUSPEITO.
 *
 * "0 falhas" so significa alguma coisa se o instrumento for capaz de acusar 1.
 * Um `ok()` que sempre passa, um `fail()` que nunca e alcancado ou um `textos()`
 * que achata tudo no vazio produzem a mesma tela verde — e a mesma tela vazia.
 *
 * Entao aqui a bancada se ataca de proposito: mede uma coisa SABIDAMENTE errada
 * com as MESMAS funcoes que usou nas provas. Se alguma destas quatro passar, o
 * instrumento esta quebrado e o resto do relatorio nao vale.
 *
 * Repare que o contador nao e mexido: estas provas sao ao contrario, e por isso
 * nao entram em `provas`/`falhas`. Uma bancada que conta a si mesma se confunde.
 */
let quebrado = 0;

// (a) `buildOrderCode` NAO pode ser so um `slice` cru do id — senao a prova da
//     secao 1 nao distingue "tirou os hifens" de "cortou os oito primeiros
//     caracteres e deixou o hifen entrar", que e o defeito silencioso: nos ids
//     do print os dois coincidem, e so um id com hifen dentro do corte separa.
if (metricas.buildOrderCode('abc-def1-2345') !== '#abc-def1') { quebrado += 0; } else { quebrado += 1; }

// (b) `textos` NAO pode achar um texto que nao existe — senao o `includes` das
//     secoes 6 e 7 passaria em qualquer coisa.
if (!textos(render(OrdersList, { orders: [] })).includes('ZZZ frase que nao existe')) { quebrado += 0; } else { quebrado += 1; }

// (c) `trackedOrders` NAO pode deixar passar um pedido sem transportadora —
//     senao a prova de quem aparece na aba nao vale.
const comSemPostagem = metricas.trackedOrders([lucas[0], lucas[1]]);
if (comSemPostagem.length === 0) { quebrado += 0; } else { quebrado += 1; }

// (d) `orderStatusLabel` NAO pode devolver o texto da postagem — e a troca dos
//     dois campos, o defeito que a secao 3 existe para pegar.
if (metricas.orderStatusLabel('novo') !== 'Aguardando postagem') { quebrado += 0; } else { quebrado += 1; }

// (e) O filtro por aba NAO pode ser um identidade disfarcada: `rastreamento`
//     tem que devolver MENOS que `todos`.
if (metricas.filterByTab(pedidos.data, 'rastreamento').length === pedidos.data.length) { quebrado += 1; } else { quebrado += 0; }

if (quebrado === 0) ok('as cinco provas ao contrario falharam como deviam', 'o instrumento acusa defeito');
else fail('a bancada passaria em qualquer coisa', `${quebrado} de 5 provas ao contrario nao acusaram`);

// `types.js` e carregado so para provar que o modulo EMITIDO existe: os tipos
// somem na compilacao, e um arquivo de tipos sem nenhum `export` de valor e um
// erro que so apareceria em tempo de execucao do import.
if (tipos !== undefined) ok('o modulo de tipos foi emitido', 'o import de `types.js` resolve');

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
