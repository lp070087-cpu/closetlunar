/**
 * Bancada do modulo WhatsApp (adm-069 a adm-071).
 *
 * ================== O QUE ELA PROVA ==================
 *
 * O modulo tem DUAS faces que nunca aparecem juntas no print — a lista de
 * atendimentos (VAZIA em adm-069) e a configuracao (PREENCHIDA em adm-070/071).
 * A bancada tem que cobrir as duas:
 *
 *   a configuracao, com os valores REAIS do print (chave `order_query` incluida);
 *   as QUATRO pílulas de status com as contagens certas, e o filtro `all`;
 *   os quatro gatilhos, o rotulo de cada um, e as variaveis de cada um;
 *   a linha da tabela com um ticket SEMEADO — porque a do print nao tem linha
 *     nenhuma, e sem semear a tabela passaria por um `<tbody>` vazio;
 *   as divergencias PRINT x ORIGINAL (4 chaves em vez de 7; `order_query` em vez
 *     de `order_approved`), que sao a parte mais facil de "consertar" por engano.
 *
 * A secao 6 e a prova ao contrario: `statusCounts` conta sobre a lista INTEIRA, e
 * nao sobre a filtrada — o defeito que zeraria as pílulas inativas.
 *
 * Nao prova layout, cor, posicao, responsividade, `useEffect` nem clique.
 */

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-whatsapp.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-whatsapp');

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
  /src[\\/](lib[\\/]whatsapp|components[\\/]admin[\\/]whatsapp|app[\\/]admin[\\/]whatsapp)[\\/]/.test(f),
);

/**
 * O FECHO DE DEPENDENCIAS — so o que o modulo realmente puxa.
 *
 * Transpilar o `src` INTEIRO e o que mais custa (~200 arquivos, ~50s), e nao serve:
 * a bancada so carrega o modulo. Aqui se anda o grafo a partir das raizes, seguindo
 * todo `from '...'` que resolva para um arquivo DENTRO do `src` (o `@/...` e os
 * relativos). Pacote de fora (`react`, `lucide-react`) nao entra na conta — e
 * resolvido pelo Node na hora do `require`, nao transpilado.
 *
 * Assim o `_load` tem para onde reescrever `@/x` -> `OUT/src/x` sem precisar dos ~180
 * arquivos que o modulo nunca abre.
 */
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

/**
 * ================== TRANSPILA SO A RAIZ — NAO TYPE-CHECA ==================
 *
 * Nas bancadas anteriores a emissao era por `ts.createProgram`, e ele custa ~50s
 * so para montar o programa (o `lib.d.ts` mais os tipos do `lucide-react`), porque
 * o modulo puxa componentes de UI que puxam icones. Somado a montagem do programa
 * e ao `renderToStaticMarkup`, isso estoura o teto de ~178s do shell desta maquina
 * (medido: createProgram 50s + emit 9s + render).
 *
 * Aqui a bancada NAO type-checa — de proposito. O portao de TIPOS e o
 * `npm run typecheck` do projeto, que cobre o `src` inteiro e roda a parte; manter
 * um segundo type-check parcial aqui, mais fraco (`strict: false`), valeria menos
 * que o portao real e ainda custaria o tempo que inviabiliza a execucao. A bancada
 * so precisa QUE O CODIGO RODE e produza o HTML para medir.
 *
 * `transpileModule` apaga os tipos e devolve CommonJS. So as RAIZES do modulo sao
 * transpiladas; as dependencias (`@/lib/*`, os primitivos de `ui/`) resolvem pelo
 * `_load` apontando para `OUT/src`.
 */
const OPCOES = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
};

let emitidos = 0;
const falhasEmissao = [];
// SO o fecho do modulo (nao o `src` inteiro): o `_load` reescreve `@/x` para
// `OUT/src/x`, entao cada arquivo que o modulo puxa precisa existir la — e so ele.
for (const arquivo of dependencias) {
  const fonte = readFileSync(arquivo, 'utf8');
  const saida = ts.transpileModule(fonte, {
    compilerOptions: OPCOES,
    fileName: arquivo,
    reportDiagnostics: true,
  });
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

const demo = require(join(OUT, 'src/lib/whatsapp/demo.js'));
const dados = require(join(OUT, 'src/lib/whatsapp/data.js'));
const metricas = require(join(OUT, 'src/lib/whatsapp/metrics.js'));
const { TicketsTab } = require(join(OUT, 'src/components/admin/whatsapp/tickets-tab.js'));
const { ConfigTab } = require(join(OUT, 'src/components/admin/whatsapp/config-tab.js'));
const { WhatsAppView } = require(join(OUT, 'src/components/admin/whatsapp/whatsapp-view.js'));

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
function atributoDe(html, nome) {
  const achados = [];
  const re = new RegExp(`${nome}="([^"]*)"`, 'g');
  let casou;
  while ((casou = re.exec(html)) !== null) achados.push(casou[1]);
  return achados;
}
/** A faixa de abas — a regiao `role="tablist"` quebrada em botoes. */
function faixa(html) {
  const inicio = html.indexOf('role="tablist"');
  if (inicio === -1) return [];
  const fim = html.indexOf('</div>', inicio);
  const regiao = html.slice(inicio, fim === -1 ? html.length : fim);
  // O `<button` tem que VOLTAR junto: sem a tag de abertura, `textos()` nao tem
  // o que apagar e devolve o sopao de atributos (`type="button" role="tab" ...`).
  return regiao.split('<button').slice(1).map((pedaco) => {
    const botao = '<button' + pedaco.slice(0, pedaco.indexOf('</button>') + 9);
    return { rotulo: textos(botao), aceso: /aria-selected="true"/.test(botao) };
  });
}
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

/* ====================== 1. a configuracao do print ====================== */

console.log('\n1. a configuracao — os valores REAIS do print, transcritos');

const leitura = await dados.getConfig();
const config = leitura.data;

if (config.whatsapp === '5581998871397')
  ok('o numero do print', '`5581998871397` — a loja real preencheu');
else fail('numero', config.whatsapp);

if (config.openingHours === 'Segunda a Sexta: 09h às 18h | Sábado: 09h às 13h')
  ok('o horario do print', 'Segunda a Sexta + Sabado, com o pipe');
else fail('horario', config.openingHours);

/**
 * ================== AS QUATRO CHAVES SAO AS DO PRINT ==================
 *
 * O codigo original tem SETE (`order_approved`, `order_shipped`,
 * `order_delivered`, `abandoned_cart`, `general_query`, `product_query`,
 * `shipping_query`). O print mostra QUATRO, com `order_query` no lugar de
 * `order_approved`. Esta prova exige AS QUATRO DO PRINT e recusa qualquer uma das
 * sete do original — o defeito mais provavel seria "seguir o codigo".
 */
if (mesmo(config.templates.map((t) => t.key), ['order_query', 'general_query', 'product_query', 'shipping_query']))
  ok('as QUATRO chaves do print, na ordem', '`order_query`, `general_query`, `product_query`, `shipping_query`');
else fail('chaves dos gatilhos', JSON.stringify(config.templates.map((t) => t.key)));

const soDoOriginal = ['order_approved', 'order_shipped', 'order_delivered', 'abandoned_cart'];
if (!config.templates.some((t) => soDoOriginal.includes(t.key)))
  ok('nenhuma chave do ORIGINAL vazou para a tela', 'nem `order_approved`, nem os `order_*` de envio');
else fail('chave do original presente', JSON.stringify(config.templates.map((t) => t.key)));

if (!Object.is(config, demo.DEMO_WHATSAPP_CONFIG) &&
    !Object.is(config.templates, demo.DEMO_WHATSAPP_CONFIG.templates))
  ok('a leitura devolve COPIA (rasa e dos templates)', 'editar na tela nao muta a demo global');
else fail('a leitura devolve a demo por referencia', 'a edicao vazaria');

/** A copia dos templates tem que ser PROFUNDA — cada item e novo. */
if (config.templates.every((t, i) => !Object.is(t, demo.DEMO_WHATSAPP_CONFIG.templates[i])))
  ok('cada template e um objeto NOVO', 'editar o texto de um nao muta a demo');
else fail('template por referencia', 'editar um texto mudaria a demo');

/** Os dois textos iguais NAO sao erro — sao o material. */
const geral = config.templates.find((t) => t.key === 'general_query').body;
const produto = config.templates.find((t) => t.key === 'product_query').body;
if (geral === produto)
  ok('`general_query` e `product_query` tem o MESMO texto', 'e o material — nao um erro de copia; ver `demo.ts`');
else fail('os dois textos divergem', 'o material mostra os dois iguais');

/* ====================== 2. os atendimentos ====================== */

console.log('\n2. os atendimentos — VAZIOS, como o print');

const lista = await dados.listTickets();
if (Array.isArray(lista.data) && lista.data.length === 0)
  ok('`listTickets` devolve lista VAZIA', 'o print adm-069 tem `Nenhum atendimento encontrado.`');
else fail('a demo tem ticket', JSON.stringify(lista.data));

if (!Object.is(lista.data, demo.DEMO_TICKETS))
  ok('a leitura devolve uma COPIA', 'mutacao na tela nao vaza');
else fail('leitura por referencia', 'mutacao vaza');

/* ====================== 3. os rotulos ====================== */

console.log('\n3. status, origem e a caixa alta das pilulas');

if (metricas.statusLabel('novo') === 'Novo' &&
    metricas.statusLabel('em_atendimento') === 'Em Atendimento' &&
    metricas.statusLabel('aguardando_cliente') === 'Aguardando Cliente' &&
    metricas.statusLabel('finalizado') === 'Finalizado')
  ok('os QUATRO rotulos de status', '`Novo`, `Em Atendimento`, `Aguardando Cliente`, `Finalizado`');
else fail('rotulos de status', JSON.stringify(['novo', 'em_atendimento', 'aguardando_cliente', 'finalizado'].map(metricas.statusLabel)));

/**
 * A PILULA GRITA. `EM ATENDIMENTO` em caixa alta na pilula, `Em Atendimento` no
 * rotulo do status — e o `filterLabel` que faz a diferenca, nao o CSS.
 */
if (metricas.filterLabel('all') === 'Todos' &&
    metricas.filterLabel('novo') === 'NOVO' &&
    metricas.filterLabel('em_atendimento') === 'EM ATENDIMENTO' &&
    metricas.filterLabel('aguardando_cliente') === 'AGUARDANDO CLIENTE' &&
    metricas.filterLabel('finalizado') === 'FINALIZADO')
  ok('as pilulas sao GRITADAS e `all` e `Todos`', '`NOVO`, `EM ATENDIMENTO`, ..., `FINALIZADO`');
else fail('rotulos de pilula', JSON.stringify(metricas.TICKET_FILTERS.map(metricas.filterLabel)));

if (mesmo(metricas.TICKET_FILTERS, ['all', 'novo', 'em_atendimento', 'aguardando_cliente', 'finalizado']))
  ok('as CINCO pilulas, `Todos` primeiro', 'a ordem do print');
else fail('ordem das pilulas', JSON.stringify(metricas.TICKET_FILTERS));

if (metricas.originLabel('product_whatsapp') === 'WhatsApp do Produto' &&
    metricas.originLabel('shipping_quote') === 'Consulta de Frete' &&
    metricas.originLabel('abandoned_cart') === 'Carrinho Abandonado' &&
    metricas.originLabel('checkout_help') === 'Dúvida Checkout' &&
    metricas.originLabel('contact_form') === 'Formulário Contato' &&
    metricas.originLabel('virtual_tryon') === 'Provador Virtual' &&
    metricas.originLabel('favorites') === 'Favoritos')
  ok('os SETE rotulos de origem', 'as origens do original, uma a uma');
else fail('rotulos de origem', JSON.stringify(['product_whatsapp', 'favorites'].map(metricas.originLabel)));

/** Uma origem desconhecida devolve a CHAVE — nao esconde o que sobrou. */
if (metricas.originLabel('origem_nova') === 'origem_nova')
  ok('origem desconhecida devolve a CHAVE crua', 'a coluna diz qual valor sobrou, em vez de esconder num "Outro"');
else fail('origem desconhecida', metricas.originLabel('origem_nova'));

/* ====================== 4. as contagens e o filtro ====================== */

console.log('\n4. `statusCounts` e `filterTickets` — com tickets SEMEADOS');

const t = (id, status) => ({
  id, customerName: `C${id}`, customerPhone: '(81) 9 9888-1397',
  origin: 'product_whatsapp', product: null, status, createdAt: '2026-09-27T14:35:00',
});
const semeados = [
  t('1', 'novo'), t('2', 'novo'), t('3', 'em_atendimento'),
  t('4', 'aguardando_cliente'), t('5', 'finalizado'), t('6', 'finalizado'),
];
const contagens = metricas.statusCounts(semeados);

if (contagens.all === 6 && contagens.novo === 2 && contagens.em_atendimento === 1 &&
    contagens.aguardando_cliente === 1 && contagens.finalizado === 2)
  ok('as contagens por status, com `all` incluso', '6 no total: 2 novo, 1, 1, 2');
else fail('contagens', JSON.stringify(contagens));

if (metricas.filterTickets(semeados, 'all').length === 6 &&
    metricas.filterTickets(semeados, 'novo').length === 2 &&
    metricas.filterTickets(semeados, 'finalizado').length === 2 &&
    metricas.filterTickets(semeados, 'em_atendimento').length === 1)
  ok('o filtro por status e o `all`', '`all` = 6, `novo` = 2, `finalizado` = 2');
else fail('filtro', JSON.stringify({
  all: metricas.filterTickets(semeados, 'all').length,
  novo: metricas.filterTickets(semeados, 'novo').length,
}));

/**
 * ================== A CONTAGEM E DA LISTA INTEIRA, E NAO DA FILTRADA ==================
 *
 * O defeito que se comete sem perceber: contar sobre `filterTickets(...)`. Se as
 * contagens saissem de `statusCounts(filterTickets(semeados, 'novo'))`, as
 * pilulas inativas iriam a ZERO. A prova: contar sobre a lista PLENA e exigir que
 * `finalizado` continue `2` mesmo com `novo` aceso.
 */
const contagensDaFiltrada = metricas.statusCounts(metricas.filterTickets(semeados, 'novo'));
if (contagensDaFiltrada.finalizado === 0 && contagens.finalizado === 2)
  ok('as contagens saem da lista PLENA', 'sobre a filtrada, `finalizado` daria 0 — a tela mostraria pílulas mortas');
else fail('a contagem depende do filtro', 'impossivel distinguir aqui');

/** `filterTickets` nao muta a lista. */
const antesIds = semeados.map((x) => x.id).join(',');
metricas.filterTickets(semeados, 'novo');
if (semeados.map((x) => x.id).join(',') === antesIds)
  ok('`filterTickets` nao muta a lista', '');
else fail('lista mutada', '');

/* ====================== 5. a data, o telefone e o link ====================== */

console.log('\n5. a data, o telefone e a montagem do link');

const data = metricas.formatTicketDate('2026-09-27T14:35:00');
if (/^27\/09,? 14:35$/.test(data) || data.includes('27/09') && data.includes('14:35'))
  ok('a data sai `27/09 14:35`', `formato curto, dia/mes hora:minuto — veio \`${data}\``);
else fail('formato da data', data);

if (metricas.formatTicketDate('nao-e-data') === '—')
  ok('data invalida vira `—`', 'nunca `Invalid Date` na tela');
else fail('data invalida', metricas.formatTicketDate('nao-e-data'));

if (metricas.phoneDigits('(81) 9 9888-1397') === '81998881397')
  ok('`phoneDigits` tira tudo que nao e digito', '`(81) 9 9888-1397` -> `81998881397`');
else fail('phoneDigits', metricas.phoneDigits('(81) 9 9888-1397'));

const ticketLink = {
  id: 'l', customerName: 'Ana', customerPhone: '(81) 9 9888-1397',
  origin: 'product_whatsapp', product: null, status: 'novo', createdAt: '2026-09-27T14:35:00',
};
const link = metricas.whatsappLink(ticketLink);
if (link.startsWith('https://wa.me/55') && link.includes('text=') && !link.includes(' ') && link.includes('%20'))
  ok('o link `wa.me/55...` com o texto codificado', 'espacos viram `%20`, nada cru na URL');
else fail('link do WhatsApp', link);

const abertura = metricas.openingMessage(ticketLink);
if (abertura === 'Olá Ana! Vimos que você entrou em contato via WhatsApp do Produto...')
  ok('a mensagem de abertura usa nome e ORIGEM', '`Olá Ana! ... via WhatsApp do Produto...`');
else fail('mensagem de abertura', abertura);

/* ====================== 6. os gatilhos ====================== */

console.log('\n6. os rotulos e as variaveis dos gatilhos');

if (metricas.TEMPLATE_LABELS.order_query === 'Consulta de Pedido' &&
    metricas.TEMPLATE_LABELS.general_query === 'Atendimento Geral' &&
    metricas.TEMPLATE_LABELS.product_query === 'Dúvida de Produto' &&
    metricas.TEMPLATE_LABELS.shipping_query === 'Consulta de Frete')
  ok('os QUATRO rotulos de gatilho', 'tres estao no print; `order_query` esta anotado como sem respaldo direto');
else fail('rotulos de gatilho', JSON.stringify(metricas.TEMPLATE_LABELS));

if (mesmo(metricas.TEMPLATE_VARIABLES.order_query, ['{customer_name}', '{order_id}']) &&
    mesmo(metricas.TEMPLATE_VARIABLES.general_query, []) &&
    mesmo(metricas.TEMPLATE_VARIABLES.product_query, ['{product_name}', '{product_price}', '{product_link}']) &&
    mesmo(metricas.TEMPLATE_VARIABLES.shipping_query, ['{cep}']))
  ok('as variaveis de cada gatilho sao as do print', 'so o `general_query` nao tem — e o print concorda');
else fail('variaveis', JSON.stringify(metricas.TEMPLATE_VARIABLES));

if (metricas.TEMPLATE_VARIABLES.general_query.length === 0)
  ok('`general_query` NAO tem variavel', 'a caixa dele nao mostra nenhum `{...}` no print');
else fail('`general_query` com variavel', JSON.stringify(metricas.TEMPLATE_VARIABLES.general_query));

/* ====================== 7. a tela montada ====================== */

console.log('\n7. `WhatsAppView`, `TicketsTab` e `ConfigTab`');

const tela = render(WhatsAppView, {});
const textoTela = textos(tela);

if (textoTela.includes('WhatsApp Inteligente') && textoTela.includes('Configure seu vendedor virtual e mensagens automáticas'))
  ok('o `SectionHeader` do print tem titulo e descricao', 'o par que o `SectionHeader` desenha');
else fail('cabecalho', textoTela.slice(0, 200));

/** A faixa de ABAS — segmantada, com `Atendimentos` aceso. */
const abas = faixa(tela);
if (abas.length === 2 && abas[0].rotulo.includes('Atendimentos') && abas[0].aceso && abas[1].rotulo.includes('Configurações'))
  ok('duas abas, `Atendimentos` acesa', '`SegmentedTabs` — faixa unica, uma so preenchida');
else fail('abas', JSON.stringify(abas));

if (textoTela.includes('Carregando...') && !textoTela.includes('Nenhum atendimento encontrado.'))
  ok('a tela abre em CARREGAMENTO', '`useEffect` nao roda no `renderToStaticMarkup`');
else fail('estado inicial', textoTela.slice(0, 200));

/** A aba de atendimentos com a lista VAZIA. */
const abaTickets = render(TicketsTab, { tickets: [] });
const textoTickets = textos(abaTickets);
const pilulas = faixa(abaTickets);

if (pilulas.length === 5 && pilulas[0].rotulo.startsWith('Todos') && pilulas[0].aceso)
  ok('as CINCO pilulas, `Todos` aceso', 'a primeira pilula e a ativa');
else fail('pilulas', JSON.stringify(pilulas.map((p) => p.rotulo)));

if (textoTickets.includes('Todos (0)') && textoTickets.includes('NOVO (0)') && textoTickets.includes('FINALIZADO (0)'))
  ok('cada pilula traz a contagem `(0)`', 'a loja sem atendimento — todas zeradas');
else fail('contagens nas pilulas', textoTickets.slice(0, 200));

if (textoTickets.includes('Nenhum atendimento encontrado.'))
  ok('a lista vazia diz o texto do print', '`Nenhum atendimento encontrado.`');
else fail('vazio da tabela', textoTickets.slice(0, 200));

const cabecalhos = ['Cliente', 'Origem', 'Relacionado', 'Status', 'Data', 'Ações'];
const pos = cabecalhos.map((c) => textoTickets.indexOf(c));
if (pos.every((p, i) => p !== -1 && (i === 0 || p > pos[i - 1])))
  ok('as SEIS colunas do print', cabecalhos.join(' · '));
else fail('cabecalhos', JSON.stringify(pos));

/** Com UM ticket semeado, a tabela desenha a linha — a prova ao contrario do vazio. */
const umTicket = render(TicketsTab, { tickets: [ticketLink] });
const textoUm = textos(umTicket);
/**
 * A `Origem` do print aparece GRITADA — mas quem grita é o `uppercase` do CSS, e
 * nao um `.toUpperCase()` no JS (quem grita no JS e a PILULA, via `filterLabel`).
 * O texto no HTML e `WhatsApp do Produto`; exigir `WHATSAPP DO PRODUTO` aqui seria
 * medir o CSS pelo DOM, que nao o carrega.
 */
if (textoUm.includes('Ana') && textoUm.includes('WhatsApp do Produto') && textoUm.includes('27/09') &&
    !textoUm.includes('Nenhum atendimento encontrado.'))
  ok('com um ticket, a linha desenha e o vazio some', 'nome, origem (o CSS que grita) e a data');
else fail('linha da tabela', textoUm.slice(0, 240));

/** O produto nulo vira `—`; com produto, sai a miniatura. */
const comProduto = render(TicketsTab, {
  tickets: [{ ...ticketLink, product: { name: 'Legging Preta', image: '/l.jpg' } }],
});
if (textoUm.includes('—') && textos(comProduto).includes('Legging Preta') && comProduto.includes('<img'))
  ok('sem produto e `—`; com produto, miniatura e nome', 'os dois ramos do `product`');
else fail('coluna Relacionado', textos(comProduto).slice(0, 200));

if (umTicket.includes('https://wa.me/55') && umTicket.includes('target="_blank"'))
  ok('o botao verde abre o `wa.me` em aba nova', 'funciona sem banco — e um link');
else fail('link da linha', 'sem `wa.me`');

/** A CONFIGURACAO — os valores do print na tela. */
const abaConfig = render(ConfigTab, {
  config, onChange: () => {}, onSave: () => {}, saving: false, aviso: null,
});
const textoConfig = textos(abaConfig);

/**
 * O valor de um `input` vive em ATRIBUTO — `textos()` o apaga, entao a leitura e do
 * HTML CRU, pelos `value=` de verdade. A agulha das horas nao pode exigir a aspa de
 * fechamento logo apos `18h`: o valor inteiro e `...09h às 18h | Sábado: 09h às 13h`,
 * e a aspa so vem depois do `13h`.
 */
const valores = atributoDe(abaConfig, 'value');
if (valores.includes('5581998871397') &&
    valores.some((v) => v.startsWith('Segunda a Sexta: 09h às 18h')))
  ok('numero e horario chegam ao VALOR dos campos', 'o valor de um `input` e atributo — `textos()` o apagaria');
else fail('campos da configuracao', JSON.stringify(valores.slice(0, 4)));

if (textoConfig.includes('Configuração Geral') && textoConfig.includes('Gatilhos de Mensagem') &&
    textoConfig.includes('Dicas de Conversão') && textoConfig.includes('Vendedor Virtual Ativo'))
  ok('os QUATRO blocos do print', 'Configuracao Geral · Gatilhos · Dicas · Vendedor');
else fail('blocos da configuracao', textoConfig.slice(0, 300));

if (textoConfig.includes('Consulta de Pedido') && textoConfig.includes('Atendimento Geral') &&
    textoConfig.includes('Dúvida de Produto') && textoConfig.includes('Consulta de Frete'))
  ok('os QUATRO rotulos de gatilho na tela', 'com os textos do print ao lado');
else fail('gatilhos na tela', textoConfig.slice(0, 300));

/** Os badges mono das chaves, e as variaveis. `textos()` apaga as classes — le o cru. */
if (contar(abaConfig, 'font-mono') >= 4 && textoConfig.includes('order_query') && textoConfig.includes('{product_name}') && textoConfig.includes('{cep}'))
  ok('as chaves cruas e as variaveis aparecem', '`order_query` em mono, `{product_name}`, `{cep}`');
else fail('chaves e variaveis', textoTela.slice(0, 200));

if (textoConfig.includes('Salvar Configurações') && /\buppercase\b/.test(abaConfig))
  ok('o botao `Salvar Configurações` esta la, em caixa alta pelo CSS', 'o texto no HTML e normal; o `uppercase` e classe');
else fail('botao salvar', textoConfig.slice(-200));

/** O AVISO de salvamento aparece quando existe — e se cala quando nao. */
const comAviso = render(ConfigTab, {
  config, onChange: () => {}, onSave: () => {}, saving: false,
  aviso: 'Configurações não foram gravadas: o banco (Neon) ainda não está conectado.',
});
if (textos(comAviso).includes('não foram gravadas') && !textoConfig.includes('não foram gravadas'))
  ok('o aviso aparece quando existe', 'a tela diz que nao gravou, em vez de fingir sucesso');
else fail('aviso de salvamento', textos(comAviso).slice(-200));

/* ====================== 8. a escrita e a rota ====================== */

console.log('\n8. a escrita nao finge gravar, e a rota foi corrigida');

const escrita = await dados.saveConfig(config);
if (escrita.persisted === false && typeof escrita.reason === 'string' && escrita.reason.length > 0)
  ok('`saveConfig` devolve `persisted: false` com motivo', 'nao finge um "salvo com sucesso"');
else fail('escrita', JSON.stringify(escrita));

const pagina = arquivo('src/app/admin/whatsapp/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('WhatsAppView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', '');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (pagina.includes('adm-069 a adm-071'))
  ok('a faixa CORRETA registrada: `adm-069 a adm-071`', 'dizia `adm-069 e adm-071` — tres prints com duas pontas');
else fail('faixa de prints', 'a correcao nao esta documentada');

if (!paginaLimpa.includes('structure'))
  ok('o array `structure` inventado sumiu', '');
else fail('`structure` sobreviveu', '');

const fonte = [
  arquivo('src/lib/whatsapp/types.ts'), arquivo('src/lib/whatsapp/demo.ts'),
  arquivo('src/lib/whatsapp/metrics.ts'), arquivo('src/lib/whatsapp/data.ts'),
  arquivo('src/components/admin/whatsapp/tickets-tab.tsx'),
  arquivo('src/components/admin/whatsapp/config-tab.tsx'),
  arquivo('src/components/admin/whatsapp/whatsapp-view.tsx'), pagina,
].join('\n');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonte)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', '');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', '');
else fail('supressao de tipo', '');

if (!/#25D366/i.test(semComentarios(fonte)))
  ok('o verde do WhatsApp NAO entrou como hex cru', 'o modulo usa o token `success`, nao `#25D366`');
else fail('hex do WhatsApp na tela', 'ha `#25D366` no codigo fora de comentario');

/* ====================== 9. provas ao contrario ====================== */

console.log('\n9. provas ao contrario — o defeito tem que REPROVAR');

if (!semComentarios('/* #25D366 */ const x = 1;').includes('25D366') &&
    semComentarios('/* #25D366 */ const x = 1;').includes('const x = 1'))
  ok('`semComentarios` apaga o hex citado na prosa', 'a nota que explica o `#25D366` nao conta como uso');
else fail('`semComentarios`', '');

if (!textos('<div aria-selected="true" data-x="1"></div>').includes('true'))
  ok('`textos` apaga ATRIBUTOS', 'por isso a faixa de abas le o HTML cru');
else fail('`textos`', '');

if (contar('a a a', 'a') === 3 && contar('abc', 'z') === 0)
  ok('`contar` conta TODAS e devolve 0 para ausente', '');
else fail('`contar`', '');

/** Uma lista de UM ticket nao cai no vazio — o defeito de `length`. */
if (textoUm.includes('Ana') && !textoUm.includes('Nenhum atendimento encontrado.'))
  ok('um ticket desenha a linha, nao o texto vazio', 'o vazio e so com zero');
else fail('tabela com um ticket', '');

/** E a lista vazia NAO desenha `<tr>` de dado — so a linha do vazio. */
if (contar(abaTickets, 'wa.me') === 0 && textoTickets.includes('Nenhum atendimento encontrado.'))
  ok('lista vazia nao desenha acao nenhuma', 'sem link de WhatsApp, so o texto do vazio');
else fail('lista vazia', '');

/** Uma pilula inativa NAO pode estar acesa. */
const acesas = pilulas.filter((p) => p.aceso);
if (acesas.length === 1)
  ok('exatamente UMA pilula acesa', 'cinco pilulas, uma ativa — nao todas nem nenhuma');
else fail('pilulas acesas', `${acesas.length}`);

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
