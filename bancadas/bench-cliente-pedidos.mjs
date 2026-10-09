/**
 * Bancada de `Meus Pedidos` da area da cliente (fase 2, modulo 5).
 *
 * ================== POR QUE ESTA BANCADA EXISTE ==================
 *
 * Esta tela tem DUAS referencias que falam coisas diferentes, e o defeito nasce
 * exatamente na costura entre elas:
 *
 *   os prints `cli-004`/`cli-005`  ->  a APARENCIA (a linha do cartao, a pilula,
 *                                      os rotulos `STATUS`/`TOTAL`, o `me:1` cru)
 *   `conta.pedidos.tsx`            ->  o COMPORTAMENTO (o accordion, os seis
 *                                      estados, o painel de itens, o vazio)
 *
 * Nenhuma das duas sozinha fecha a tela. E ha um terceiro lado: o DADO. O pedido
 * desta area e a MESMA linha `orders` que o admin ja le — e um campo que o print
 * mostra (`me:1`, o `shipping_method` cru) NAO existia no modelo do admin ate
 * este modulo. Um erro aí nao quebra tela nenhuma: ele so faz a area da cliente
 * guardar um modelo paralelo do mesmo pedido, que e o que a Fase 4 proibe.
 *
 * Por isso as provas sao de tres tipos, e nesta ordem:
 *
 *   1. TRANSCRICAO — o que o original declara, a tela escreve?
 *   2. DADO        — a ponte devolve os cinco pedidos do print, com os codigos,
 *                    os totais e o IDENTIFICADOR CRU do frete?
 *   3. RENDER      — o cartao fechado e o aberto produzem o HTML do print?
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Cor, tamanho de fonte e o giro da seta (isso e navegador/pixel). Ela tambem nao
 * prova persistencia: nao ha. E ela NAO monta `OrdersView`, porque o componente
 * carrega a lista num efeito e `renderToStaticMarkup` nao roda efeito — o que
 * sairia seria `Carregando...`. Para a view, a prova e por FONTE (a regra de um
 * cartao aberto por vez, o vazio do original); para o CARTAO, a prova e por
 * RENDER, com o estado passado por prop.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-pedidos.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-pedidos');
const ORIGINAL = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.pedidos.tsx',
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
 * ================== AS RAIZES SAO QUATRO AREAS, E NAO DUAS ==================
 *
 * A bancada do login so precisa de `lib/cliente` e `components/cliente`. Esta
 * precisa de mais duas, porque a tela ATRAVESSA a ponte com o admin:
 *
 *   `lib/pedidos`    o `Order` do admin e o `shipmentMethod` que este modulo
 *                    acrescentou — se ele sumisse, a tela perderia o `me:1`
 *   `app/(cliente)`  a ROTA `/conta/pedidos`, que e o unico lugar onde se prova
 *                    que a URL da tela e a do print
 *
 * Sem `lib/pedidos` aqui, a bancada provaria a tela contra uma copia do dado, e
 * nao contra o dado de verdade — que e justamente o defeito que ela existe para
 * pegar.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/](cliente|pedidos)|components[\\/]cliente|app[\\/]\(cliente\))[\\/]/.test(f),
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
  ok('emissao sem erro', `${raizes.length} raizes (cliente + a ponte com pedidos)`);
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
const metricas = require(join(OUT, 'src/lib/cliente/metrics.js'));
const tiposPedido = join(OUT, 'src/lib/pedidos/demo.js');
const adminDemo = require(tiposPedido);
const { PedidoCard } = require(join(OUT, 'src/components/cliente/pedido-card.js'));

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
function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1').replace(/=""/g, '');
}
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const fonteCard = semComentarios(arquivo('src/components/cliente/pedido-card.tsx'));
const fonteView = semComentarios(arquivo('src/components/cliente/orders-view.tsx'));
const fonteRota = arquivo('src/app/(cliente)/conta/pedidos/page.tsx');
const fonteMetrics = semComentarios(arquivo('src/lib/cliente/metrics.ts'));
const fonteTiposPedido = semComentarios(arquivo('src/lib/pedidos/types.ts'));

/** A lista real, pela ponte — e nao uma copia montada aqui. */
let pedidos = [];
let erroPonte = null;
const carregarPedidos = async () => {
  try {
    pedidos = (await dados.listPedidos()).data;
  } catch (e) {
    erroPonte = e;
  }
};
await carregarPedidos();

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `conta.pedidos.tsx` — o que o original declara');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a fonte do COMPORTAMENTO desta tela');

  /**
   * Cada string e buscada nos DOIS arquivos. Se o original a declara e a tela
   * nao, a transcricao perdeu um pedaco da tela que existe em fonte.
   */
  const declaracoes = [
    ['Meus Pedidos', 'o titulo do painel'],
    ['Itens do pedido', 'o cabecalho do painel aberto'],
    ['Sem itens registrados.', 'a lista vazia DENTRO do painel aberto'],
    ['Resumo de valores', 'o cabecalho do resumo'],
    ['Subtotal:', 'a linha do subtotal'],
    ['Desconto:', 'a linha do desconto'],
    ['Frete:', 'a linha do frete'],
    ['Total:', 'a linha do total'],
    ['Acompanhar entrega', 'o botao claro do painel'],
    ['Preciso de ajuda', 'o botao escuro do painel'],
    ['Você ainda não fez nenhum pedido.', 'o vazio da lista inteira'],
    ['Começar a comprar', 'o botao do vazio'],
    ['Status', 'o rotulo acima da pilula'],
    ['Total', 'o rotulo acima do valor'],
  ];
  for (const [texto, nome] of declaracoes) {
    const noOriginal = fonteOriginal.includes(texto);
    const naTela = fonteCard.includes(texto) || fonteView.includes(texto);
    if (noOriginal && naTela) ok(`${nome}: declarado nos dois`, `"${texto}"`);
    else fail(`${nome}`, `original: ${noOriginal} · tela: ${naTela}`);
  }

  /**
   * A LINHA DE VARIACAO DO ITEM — a forma exata, com os separadores do original.
   *
   * Ela e montada com template literals (`Tam: ${…}`), entao a comparacao e por
   * pedacos: o texto literal de cada pedaco, nos dois arquivos. Comparar a
   * STRING MONTADA seria comparar duas coisas que nunca aparecem escritas.
   */
  /*
    O TEXTO e comparado, e nao a SINTAXE de quem o monta.

    O original concatena com o operador `+` (`"Tam: " + it.size`), e a tela usa
    template literal (`` `Tam: ${item.tamanho}` ``). Exigir a MESMA aspa
    reprovaria a escolha correta — o que importa e que os tres rotulos e os dois
    separadores sejam os do material.
  */
  const rotulosItem = [
    ['Tam: ', 'o rotulo do tamanho'],
    ['· Cor: ', 'o rotulo da cor (com o `·` do original)'],
    ['· Qtd: ', 'o rotulo da quantidade (com o `·` do original)'],
  ];
  for (const [pedaco, nome] of rotulosItem) {
    if (fonteOriginal.includes(pedaco) && fonteCard.includes(pedaco))
      ok(`${nome}: o MESMO texto nos dois`, pedaco);
    else
      fail(`${nome}`, `original: ${fonteOriginal.includes(pedaco)} · tela: ${fonteCard.includes(pedaco)}`);
  }

  /** E a quantidade sai do ITEM, e nao de um numero escrito na tela. */
  if (/Qtd: \$?\{?[\w.]*quantidade/.test(fonteCard))
    ok('a quantidade vem do campo do item', 'nao e um literal');
  else fail('a quantidade', 'a tela nao interpola a quantidade do item');

  /**
   * A INICIAL DO ITEM. O original imprime `it.product_name?.charAt(0)` — a
   * primeira letra, e nao uma miniatura. Nao ha imagem de produto neste modelo,
   * e inventar um quadrado com foto seria prometer um dado que nao existe.
   */
  if (/charAt\(0\)/.test(fonteOriginal) && /\.nome\.charAt\(0\)/.test(fonteCard))
    ok('a inicial do item e a primeira letra do nome', '`charAt(0)` nos dois');
  else fail('a inicial do item', 'a tela nao escreve a inicial como o original');

  /**
   * AS DUAS LINHAS CONDICIONAIS. O original escreve
   * `{Number(o.discount) > 0 && (…)}` e `{Number(o.shipping_price) > 0 && (…)}`.
   * Sem a condicao, o pedido sem cupom passaria a escrever `Desconto: R$ 0,00`.
   */
  if (/pedido\.desconto > 0/.test(fonteCard) && /pedido\.freteValor > 0/.test(fonteCard))
    ok('desconto e frete so aparecem quando existem', 'a linha nao existe com valor zero');
  else fail('linhas condicionais', 'o resumo escreveria `Desconto: R$ 0,00`');
}

/* ============ 2. OS SEIS ESTADOS — o mapa tem que estar completo ============ */

console.log('\n2. os SEIS estados — a exigencia do `MAPA-CLIENTE.md`');

/**
 * Esta e a prova que o mapa pede por nome: "o original e a unica fonte onde os
 * seis estados aparecem juntos; a bancada exige que os seis existam".
 *
 * Os dois mapas sao lidos dos DOIS arquivos: o do original (para saber QUAIS sao
 * os seis) e o da tela (para saber se ela cobre os seis). Comparar contra uma
 * lista escrita aqui seria escrever a resposta no instrumento.
 */
const seis = ['novo', 'pago', 'separacao', 'enviado', 'entregue', 'cancelado'];

const doOriginal = fonteOriginal
  ? [...fonteOriginal.matchAll(/^\s{2}(\w+):\s*\{\s*label:/gm)].map((m) => m[1])
  : [];

if (doOriginal.length === 6 && seis.every((s) => doOriginal.includes(s)))
  ok('o original declara os seis estados', doOriginal.join(' · '));
else fail('os seis estados no original', `achei ${doOriginal.length}: ${doOriginal.join(',')}`);

const mapaTela = metricas.ROTULO_STATUS_CLIENTE;
const chavesTela = Object.keys(mapaTela ?? {});
if (chavesTela.length === 6 && seis.every((s) => chavesTela.includes(s)))
  ok('a tela cobre os seis — nem um a mais, nem um a menos', chavesTela.join(' · '));
else fail('os seis estados na tela', `achei ${chavesTela.length}: ${chavesTela.join(',')}`);

/**
 * O `Record<OrderStatus, …>` obriga o mapa a ter TODA chave do enum e NENHUMA a
 * mais. A prova e o ENUM do admin: cada membro tem que estar no mapa.
 */
const { OrderStatus: _tipo } = { OrderStatus: null }; // o tipo nao existe em runtime
const membrosEnum = [...fonteTiposPedido.matchAll(/'(novo|pago|separacao|enviado|entregue|cancelado)'/g)]
  .map((m) => m[1]);
const enumLimpo = [...new Set(membrosEnum)];
if (enumLimpo.length === 6 && enumLimpo.every((s) => chavesTela.includes(s)))
  ok('o mapa cobre o ENUM do admin, chave a chave', 'o tipo vem de `lib/pedidos`, nao de uma copia');
else fail('mapa × enum', `enum tem ${enumLimpo.length}: ${enumLimpo.join(',')}`);

/**
 * O ROTULO DE `novo` DIVERGE DO ADMIN, e isso e uma decisao registrada: o admin
 * escreve `Novo` (adm-003), esta tela escreve `Aguardando pagamento`
 * (`conta.pedidos.tsx`). Igualar os dois seria escolher um lado em silencio.
 */
if (mapaTela?.novo?.label === 'Aguardando pagamento')
  ok('`novo` aqui e `Aguardando pagamento`', 'o rotulo do original desta tela');
else fail('rotulo de `novo`', `veio "${mapaTela?.novo?.label}"`);

const adminLabels = adminDemo.ORDER_STATUS_LABELS;
if (adminLabels?.novo === 'Novo' && mapaTela?.novo?.label !== adminLabels.novo)
  ok('a divergencia com o admin continua ABERTA', `admin: "${adminLabels.novo}" · cliente: "${mapaTela.novo.label}"`);
else fail('divergencia `novo`', 'as duas areas passaram a escrever igual sem decisao');

/** A pill do print e um selo de verdade: o tom tem que ser um token do projeto. */
const tons = Object.values(mapaTela ?? {}).map((v) => v.tom);
if (tons.every((t) => /bg-\w+-surface|bg-\w+\b/.test(t)) && tons.every((t) => !/#/.test(t)))
  ok('os tons sao tokens do projeto, e nao hex solto', `${new Set(tons).size} tons distintos`);
else fail('tons', JSON.stringify(tons));

/* ============ 3. A PONTE — o dado do print, pelo caminho de verdade ============ */

console.log('\n3. a ponte com o admin — os cinco pedidos do print `cli-004`');

if (erroPonte) {
  fail('`listPedidos()` quebrou', String(erroPonte.message).slice(0, 80));
} else {
  /**
   * OS CINCO PEDIDOS DO PRINT, com os codigos e os totais LIDOS da captura.
   * E a prova de que a area da cliente le a MESMA linha `orders` do admin — se
   * alguem copiasse os cinco pedidos para dentro de `cliente/demo.ts`, os dois
   * arrays divergiriam no primeiro dia em que um preco mudasse, e a bancada
   * pegaria aqui.
   */
  const doPrint = [
    ['#ff3048c9', 506.95],
    ['#41b60ae2', 187.76],
    ['#7c1e93aa', 186],
    ['#9a02f5d1', 186],
    ['#3de811b4', 186],
  ];
  const achados = pedidos.map((p) => [p.codigo, p.total]);
  if (JSON.stringify(achados) === JSON.stringify(doPrint))
    ok('os cinco codigos e totais batem com o print, na ordem', achados.map((a) => a[0]).join(' '));
  else fail('os cinco do print', JSON.stringify(achados));

  /**
   * O SEXTO PEDIDO NAO PODE APARECER. `DEMO_ORDERS_PEDIDOS` tem um sexto
   * (`#a1b2c3d4`, `enviado`, `email: null`) que existe para a tela do ADMIN ter
   * o outro estado. Ele NAO tem e-mail, e a conta desta area tem — entao ele fica
   * fora. Se a filtragem por cliente quebrasse, ele apareceria como sexto cartao.
   */
  if (pedidos.length === 5 && !pedidos.some((p) => p.codigo === '#a1b2c3d4'))
    ok('o sexto pedido do demo (sem e-mail) NAO aparece', 'a filtragem por cliente esta viva');
  else fail('filtragem por cliente', `${pedidos.length} pedido(s) vieram`);

  /** O mais recente primeiro — a ordem do print, de cima para baixo. */
  const crescente = pedidos.every(
    (p, i) => i === 0 || pedidos[i - 1].feitoEm >= p.feitoEm,
  );
  if (crescente) ok('ordenado do mais recente para o mais antigo', '16/06 -> 15/06, como a captura');
  else fail('ordem', pedidos.map((p) => p.feitoEm).join(' '));

  /**
   * ================== O FRETE E O IDENTIFICADOR CRU ==================
   *
   * A prova mais fina desta bancada. O print mostra `me:1` na linha do caminhao
   * de um pedido cuja transportadora e `Correios` — ou seja, a tela escreve
   * `shipping_method`, e NAO o nome da transportadora. `Correios` nao pode
   * aparecer em lugar nenhum do HTML desta tela.
   */
  const primeiro = pedidos[0];
  if (primeiro?.frete === 'me:1')
    ok('o frete do primeiro e `me:1` — o identificador cru', 'nao o nome da transportadora');
  else fail('frete do primeiro', String(primeiro?.frete));

  const comOwn = pedidos.filter((p) => typeof p.frete === 'string' && p.frete.startsWith('own:'));
  if (comOwn.length === 3 && comOwn.every((p) => p.frete === 'own:341d5a3a-8603-4a60-9903-72b8f529d0e0'))
    ok('os tres `own:` do print batem caractere a caractere', 'o uuid inteiro, e nao um pedaco');
  else fail('os tres `own:`', `${comOwn.length} encontrados`);

  /**
   * O CAMPO VEM DO MODELO COMPARTILHADO. Se ele existisse so na area da cliente,
   * haveria dois modelos para a mesma coluna `orders` — o que a Fase 4 proibe.
   */
  if (/shipmentMethod: string \| null/.test(fonteTiposPedido))
    ok('`shipmentMethod` mora no modelo COMPARTILHADO do pedido', 'uma coluna, um campo');
  else fail('`shipmentMethod`', 'o campo nao esta em `lib/pedidos/types.ts`');

  /**
   * E ADITIVO: nenhuma tela do ADMIN le o campo novo. Se alguma lesse, este
   * modulo teria mudado a tela do admin — que esta fora do escopo.
   */
  const telasAdmin = arquivos.filter((f) => /src[\\/](app[\\/]admin|components[\\/]admin)[\\/]/.test(f));
  const adminLeem = telasAdmin.filter((f) => /shipmentMethod/.test(readFileSync(f, 'utf8')));
  if (adminLeem.length === 0)
    ok('nenhuma tela do admin le `shipmentMethod`', `${telasAdmin.length} arquivos varridos`);
  else fail('o admin passou a ler o campo novo', adminLeem.map((f) => f.replace(PROJ, '')).join(', '));

  /** O pedido sem itens e um estado do material, e nao um erro. */
  if (pedidos[0]?.itens.length === 0)
    ok('o `#ff3048c9` tem ZERO itens, como o print', '`0 itens no pedido` na linha fechada');
  else fail('itens do `#ff3048c9`', `${pedidos[0]?.itens.length}`);
}

/* ============ 4. o cartao FECHADO — o que o print mostra ============ */

console.log('\n4. o cartao fechado — a linha do print `cli-004`');

if (pedidos.length === 0) {
  fail('sem pedidos para renderizar', 'a secao 4 depende da ponte');
} else {
  const fechado = textos(render(PedidoCard, { pedido: pedidos[0], aberto: false, onAlternar: () => {} }));

  const naLinha = [
    ['#ff3048c9', 'o codigo do pedido'],
    ['16/06/2026', 'a data'],
    ['0 itens no pedido', 'a contagem, no singular/plural do original'],
    ['me:1', 'o frete CRU'],
    ['Status', 'o rotulo acima da pilula'],
    ['Aguardando pagamento', 'o rotulo do status'],
    ['Total', 'o rotulo acima do valor'],
    ['R$ 506,95', 'o total, formatado em BRL'],
  ];
  for (const [texto, nome] of naLinha) {
    if (fechado.includes(texto)) ok(`${nome}: presente`, texto);
    else fail(`${nome}`, `nao achei "${texto}"`);
  }

  /** `Correios` NAO PODE aparecer: e o nome, e o print mostra o identificador. */
  if (!fechado.includes('Correios'))
    ok('`Correios` NAO aparece em lugar nenhum', 'a tela escreve o identificador, nao o nome');
  else fail('`Correios` na tela', 'a tela traduziu o frete, e o print nao traduz');

  /**
   * FECHADO quer dizer fechado: o painel de itens e o resumo nao existem no HTML.
   * Se existissem, estariam so escondidos por CSS — e a bancada nao veria a
   * diferenca entre abrir e fechar.
   */
  if (!fechado.includes('Itens do pedido') && !fechado.includes('Resumo de valores'))
    ok('o painel fechado NAO esta no HTML', 'abrir e fechar muda a arvore, nao so a classe');
  else fail('painel fechado', 'o conteudo do accordion saiu mesmo com o cartao fechado');

  /** Os dois botoes vivem DENTRO do painel — fora dele nao devem existir. */
  if (!fechado.includes('Acompanhar entrega') && !fechado.includes('Preciso de ajuda'))
    ok('os dois botoes so existem no painel aberto', 'como no original');
  else fail('botoes fora do painel', 'os botoes vazaram para a linha fechada');

  /** A seta so aparece no desktop — `hidden md:block`, do original. */
  if (/hidden size-5 .*md:block/.test(fonteCard) || /hidden .*md:block .*transition-transform/.test(fonteCard))
    ok('a seta e `hidden md:block`', 'no celular o fio horizontal ja separa a linha');
  else fail('a seta no celular', 'a seta nao esta escondida abaixo de `md`');
}

/* ============ 5. o cartao ABERTO — o painel de itens ============ */

console.log('\n5. o cartao aberto — o painel que o `cli-005` mostra');

if (pedidos.length >= 2) {
  /**
   * O PRIMEIRO PEDIDO ABERTO: zero itens. O painel tem que escrever a frase do
   * original (`Sem itens registrados.`) — e nao uma tabela vazia nem um `0`.
   */
  const semItens = textos(render(PedidoCard, { pedido: pedidos[0], aberto: true, onAlternar: () => {} }));
  if (semItens.includes('Itens do pedido') && semItens.includes('Sem itens registrados.'))
    ok('o pedido sem itens abre com a frase do original', '`Sem itens registrados.`');
  else fail('painel vazio', 'nao escreveu a frase do original');

  /**
   * O SEGUNDO PEDIDO ABERTO: um item, com tamanho e cor. E a prova da linha de
   * variacao — `Tam: M · Cor: Preto · Qtd: 1` — e do valor da LINHA (o unitario
   * vezes a quantidade).
   */
  const comItem = textos(render(PedidoCard, { pedido: pedidos[1], aberto: true, onAlternar: () => {} }));
  const itensEsperados = [
    ['Jaqueta Corta Vento Fit', 'o nome do item'],
    ['Tam: M', 'o tamanho'],
    ['· Cor: Preto', 'a cor, com o separador do original'],
    ['Qtd: 1', 'a quantidade'],
    ['Resumo de valores', 'o resumo'],
    ['Subtotal:', 'o subtotal'],
    ['Frete:', 'o frete do resumo'],
    ['Total:', 'o total do resumo'],
    ['R$ 179,90', 'o valor da linha'],
  ];
  for (const [texto, nome] of itensEsperados) {
    if (comItem.includes(texto)) ok(`${nome}: presente no painel aberto`, texto);
    else fail(`${nome} no painel`, `nao achei "${texto}"`);
  }

  /** `Unico` no lugar da cor e um valor de verdade — o `top` do `lucas`. */
  const comUnico = textos(render(PedidoCard, { pedido: pedidos[2], aberto: true, onAlternar: () => {} }));
  if (comUnico.includes('Cor: Único'))
    ok('a peca sem cor escreve `Único`, e nao vazio', '`color ?? "Unico"` do original');
  else fail('`Único`', 'a peca sem cor nao escreveu o valor do original');

  /** A caixa de desconto NAO existe quando nao ha desconto — a linha condicional. */
  if (!comItem.includes('Desconto:'))
    ok('sem desconto, a linha do desconto NAO existe', 'nao escreveu `Desconto: R$ 0,00`');
  else fail('linha do desconto com zero', 'a tela escreveu desconto num pedido sem cupom');

  /** A caixa de frete NAO aparece quando o frete do pedido e zero. */
  const semFrete = textos(render(PedidoCard, { pedido: pedidos[0], aberto: true, onAlternar: () => {} }));
  if (!semFrete.includes('Frete:'))
    ok('frete zero nao vira linha no resumo', 'o `#ff3048c9` tem `shippingPrice: 0`');
  else fail('frete zero', 'a tela escreveu `Frete: R$ 0,00`');
}

/* ============ 6. os DOIS BLOCOS DE RASTREIO que NAO existem aqui ============ */

console.log('\n6. os dois blocos de rastreio — a condicao do original que NUNCA casa');

/**
 * ================== A PROVA NEGATIVA DESTA BANCADA ==================
 *
 * O original desenha dois blocos de acompanhamento entre a linha e o painel:
 *
 *     isOwnDelivery = (shipping_method ?? "").toLowerCase().includes("propria")
 *                  || ...("própria") || ...("local")
 *     isMelhorEnvio = (shipping_method ?? "").toLowerCase().includes("melhor")
 *
 * As duas procuram PALAVRAS. O dado que a tela recebe — e que o print mostra — e
 * `me:1` e `own:341d5a3a-…`. Aqui as DUAS condicoes do original sao REIMPLEMENTADAS
 * literalmente e rodadas contra o dado de verdade: se as duas derem `false` para
 * todos os cinco pedidos, entao o original NAO desenha os blocos neste material,
 * e a tela estar sem eles e fidelidade — nao omissao.
 *
 * Se um dia alguem "concertar" o predicado para `me:`/`own:`, esta prova continua
 * passando — so que por outro motivo. Por isso ela TAMBEM confere que os campos
 * que os dois blocos precisam nao existem no modelo: sem eles, desenhar os blocos
 * exigiria inventar tres campos, e criar um segundo modelo para `orders` e o que
 * a Fase 4 proibe.
 */
const comoOriginal = (metodo) => (metodo ?? '').toLowerCase().includes('propria')
  || (metodo ?? '').toLowerCase().includes('própria')
  || (metodo ?? '').toLowerCase().includes('local');
const comoOriginalME = (metodo) => (metodo ?? '').toLowerCase().includes('melhor');

const ligadosPropria = pedidos.filter((p) => comoOriginal(p.frete));
const ligadosME = pedidos.filter((p) => comoOriginalME(p.frete));

if (ligadosPropria.length === 0 && ligadosME.length === 0)
  ok('com o dado do print, as DUAS condicoes do original sao falsas', '`me:1` nao contem "melhor"; `own:` nao contem "propria"');
else fail('condicao do original', `propria:${ligadosPropria.length} melhor:${ligadosME.length}`);

const camposAusentes = ['tracking_url', 'delivery_status', 'delivery_tracker_url'];
const ausentes = camposAusentes.filter((c) => !new RegExp(`\\b${c}\\b`).test(fonteTiposPedido));
if (ausentes.length === 3)
  ok('os tres campos que os blocos exigem NAO existem no modelo', camposAusentes.join(' · '));
else fail('campos de rastreio', `ja existem: ${camposAusentes.filter((c) => !ausentes.includes(c)).join(', ')}`);

/** E a tela nao escreve nenhuma das duas frases — nem os links dos blocos. */
const declaradoNaTela = ['Acompanhar entregador', 'Rastrear pedido', 'Rastreamento ainda não disponível.'];
const vazados = declaradoNaTela.filter((t) => fonteCard.includes(t));
if (vazados.length === 0)
  ok('nenhuma das frases dos dois blocos aparece na tela', 'nao ha bloco de rastreio inventado');
else fail('frases dos blocos de rastreio', vazados.join(', '));

/* ============ 7. o ACCORDION e o VAZIO — provados por FONTE ============ */

console.log('\n7. o accordion e o vazio — o que se prova sem clicar');

/**
 * UM CARTAO ABERTO POR VEZ. O original guarda `openId` (um id, e nao um `Set`).
 * Se a view guardasse varios, tres cartoes ficariam abertos — e o estado do
 * `cli-005` (os cartoes fechados, rolando) deixaria de existir.
 */
if (/useState<string \| null>\(null\)/.test(fonteView) &&
    /atual === pedido\.id \? null : pedido\.id/.test(fonteView))
  ok('um cartao aberto por vez, e clicar no aberto fecha', '`openId`, e nao um `Set`');
else fail('o estado do accordion', 'a view nao guarda um id unico');

/** A seta GIRA — ela nao e decorativa. */
if (/rotate-90/.test(fonteCard))
  ok('a seta gira quando o cartao abre', '`rotate-90` sob a condicao de aberto');
else fail('a seta', 'ela nao gira, e o cartao nao da sinal de aberto');

/**
 * O VAZIO DA LISTA. O print nao o mostra (os dois prints tem pedidos), mas o
 * original o desenha inteiro — bloco tracejado, circulo com o icone, a frase e o
 * botao. Como a aparencia tambem vem do original, o estado todo e transcricao.
 */
if (
  /pedidos\.length === 0/.test(fonteView) &&
  /border-dashed/.test(fonteView) &&
  /size-16/.test(fonteView) &&
  /rounded-full/.test(fonteView)
)
  ok('o vazio tem o desenho do original', 'bloco tracejado + circulo `size-16 rounded-full` com o icone');
else fail('o vazio', 'a view nao desenha o estado vazio do original');

/**
 * O `Carregando...` antes de ler. Sem ele, a tela abriria com `0 pedidos` — um
 * numero ERRADO, e nao um vazio — antes de a leitura terminar.
 */
if (/Carregando\.\.\./.test(fonteView) && /if \(!pedidos\)/.test(fonteView))
  ok('antes de ler, a tela diz `Carregando...`', 'nunca um numero antes de ter lido');
else fail('estado de carga', 'a view nao tem o ramo de carregamento');

/** A ROTA e a do print. */
if (/conta\/pedidos/.test(fonteRota) || /OrdersView/.test(fonteRota))
  ok('a rota existe e entrega a view', '`/conta/pedidos`, a URL do `cli-004`');
else fail('a rota', 'a pagina nao entrega a `OrdersView`');

/* ============ 8. honestidade e escopo ============ */

console.log('\n8. honestidade e escopo');

const fonteToda = semComentarios(fonteCard + fonteView);

if (!/fetch\(|supabase|localStorage|sessionStorage|console\./.test(fonteToda))
  ok('nada de rede, provedor, navegador nem console', 'só `listPedidos()`, que é demonstração');
else fail('rede/provedor/console', 'a tela importou um provedor que esta fase nao tem');

/**
 * OS DOIS BOTOES NAO TEM DESTINO — como no original. Dar a eles um `href`
 * inventado seria pior do que nao ter: a tela passaria a levar a lugar nenhum de
 * verdade, e pareceria funcionar.
 */
if (!/href=/.test(fonteCard) || !/Acompanhar entrega[\s\S]{0,400}?href=/.test(fonteCard))
  ok('os dois botoes do painel NAO ganharam destino', 'o original tambem nao os liga a nada');
else fail('botoes com destino', 'a tela inventou um fluxo que o original nao tem');

/** A area da cliente nao importa nada do admin — nem de outro modulo de negocio. */
if (!/from\s+['"]@\/components\/admin|from\s+['"]@\/lib\/(?!cliente|pedidos|utils|access)/.test(fonteToda))
  ok('nada importa do admin alem do MODELO do pedido', 'a area da cliente e autonoma');
else fail('import cruzado', 'a tela importou algo de fora do escopo');

/* ============ 9. provas ao contrario ============ */

console.log('\n9. provas ao contrario — o instrumento tem que saber REPROVAR');

/** 1. O texto do cartao NAO troca o frete pelo nome: `Correios` continua ausente. */
if (pedidos.length > 0) {
  const html = textos(render(PedidoCard, { pedido: pedidos[0], aberto: false, onAlternar: () => {} }));
  const carregandoPeloNome = { ...pedidos[0], frete: 'Correios' };
  const htmlDoNome = textos(render(PedidoCard, { pedido: carregandoPeloNome, aberto: false, onAlternar: () => {} }));
  if (!html.includes('Correios') && htmlDoNome.includes('Correios'))
    ok('o cartao escreve o campo, e o campo pode ser qualquer string', 'a prova negativa tem os dois lados');
  else fail('prova ao contrario do frete', 'o cartao nao distingue `me:1` de `Correios`');
}

/** 2. O painel fechado NAO e o aberto: os dois HTMLs tem que diferir. */
if (pedidos.length > 0) {
  const fechado = render(PedidoCard, { pedido: pedidos[0], aberto: false, onAlternar: () => {} });
  const aberto = render(PedidoCard, { pedido: pedidos[0], aberto: true, onAlternar: () => {} });
  if (fechado !== aberto && aberto.length > fechado.length)
    ok('aberto e fechado produzem arvores DIFERENTES', `${fechado.length} -> ${aberto.length} caracteres`);
  else fail('aberto × fechado', 'a prop `aberto` nao muda o HTML');
}

/** 3. O rotulo do cliente nao e o do admin — se fossem iguais, o mapa nao serviria. */
if (mapaTela?.novo?.label !== adminLabels?.novo)
  ok('`rotuloStatus` NAO devolve o rotulo do admin', 'os dois mapas sao independentes de verdade');
else fail('rotulos iguais', 'os dois mapas coincidem — a divergencia foi apagada');

/** 4. O `valor 186` de tres pedidos nao e erro de digitacao: eles sao distintos. */
if (pedidos.filter((p) => p.total === 186).length === 3 &&
    new Set(pedidos.filter((p) => p.total === 186).map((p) => p.id)).size === 3)
  ok('tres pedidos com o MESMO total sao tres ids distintos', 'o print mostra os tres, e sao tres');
else fail('os tres de R$ 186,00', 'nao sao tres pedidos distintos');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
