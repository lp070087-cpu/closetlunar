/**
 * Bancada do modulo CRM.
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o
 * `next/font/google` espera as fontes para sempre). Sem esta bancada, a unica
 * garantia seria o typecheck — que nao renderiza, nao conta e nao ve o ramo
 * invertido.
 *
 * O QUE ELA PROVA, EM ORDEM
 *
 *   1. os .ts/.tsx do modulo EMITEM sem erro e os `@/` resolvem em execucao;
 *   2. a aba `Clientes` (adm-005) tem UMA linha, com nome, e-mail, cidade, 5
 *      pedidos, R$ 1.252,71 e 16/06/2026;
 *   3. essa linha e DERIVADA dos cinco pedidos de adm-003 — nao ha cliente
 *      digitado em lugar nenhum do modulo;
 *   4. as SEIS colunas da tabela de clientes, na ordem do print;
 *   5. a aba `Leads` (adm-010) tem UMA linha, com a pilula `carrinho_abandonado`,
 *      a data `13/06/2026, 00:31` e um unico icone (o WhatsApp nao existe);
 *   6. as CINCO colunas da tabela de leads, na ordem do print;
 *   7. a assimetria 3 x 1 — o segmento conta TODOS os carrinhos, a lista so os
 *      que tem e-mail. E a assercao central desta tela;
 *   8. os OITO segmentos de adm-011 com os numeros EXATOS do print;
 *   9. o rotulo do card usa a paleta nomeada do print, e nao os tokens do design
 *      system — o card desta tela e diferente de proposito;
 *  10. a busca filtra pelos campos que o placeholder promete;
 *  11. `Ver Perfil` continua DECLARADO e indisponivel, e o modulo nao exporta
 *      escrita nenhuma;
 *  12. a rota existe, aponta para a tela e NAO usa mais a referencia errada;
 *  13. a tela carrega e renderiza o esqueleto;
 *  14. as provas ao contrario: o instrumento sabe FALHAR.
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
  console.error('uso: node bench-crm.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-crm');

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
 * Raizes da COMPILACAO: so o modulo CRM.
 *
 * O compilador segue os `import` sozinho, entao `ui/*`, `lib/utils`, `lib/crm/*`
 * e `lib/pedidos/*` entram por conta propria. As ~30 outras paginas do painel
 * NAO entram — compilar todas elas estoura o limite de ~178 s do `bash` deste
 * ambiente (ver `bancadas/LEIA-ME.md`).
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]crm|components[\\/]admin[\\/]crm|app[\\/]admin[\\/]crm)[\\/]/.test(f),
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

const dados = require(join(OUT, 'src/lib/crm/data.js'));
const demo = require(join(OUT, 'src/lib/crm/demo.js'));
const acoes = require(join(OUT, 'src/lib/crm/actions.js'));
const helpers = require(join(OUT, 'src/lib/crm/helpers.js'));
const metricas = require(join(OUT, 'src/lib/crm/metrics.js'));
const tipos = require(join(OUT, 'src/lib/crm/types.js'));
const { CrmView } = require(join(OUT, 'src/components/admin/crm/crm-view.js'));

/* ------------------------------------------------------------- utilidades */

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o
 * `toLocaleString('pt-BR')` usa espaco inquebravel e o `\s` do JS nao o pega.
 * Por isso o `replace` abaixo tem o caractere literal, alem de `\s`.
 */
const normalizar = (s) => s.replace(/[\s  ]+/g, ' ').trim();
function textos(html) {
  return normalizar(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&middot;/g, '·')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'"),
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
 * Nesta bancada a armadilha ja esta armada antes de rodar: a `page.tsx` do CRM
 * cita `references="adm-009 a adm-011"` num comentario que REGISTRA a troca da
 * referencia errada, e o `data.ts` cita `WriteResult` num comentario que diz que
 * ele foi deixado de fora. As duas assercoes correspondentes medem o texto LIMPO.
 *
 * A segunda regra evita comer o `//` de `https://`: so trata como comentario de
 * linha quando o `//` NAO vem depois de `:`.
 */
function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const arquivo = (rel) => readFileSync(join(SRC, rel), 'utf8');

/**
 * O DIA EM QUE OS PRINTS FORAM TIRADOS — e por que ele PRECISA estar aqui.
 *
 * `novas` e `inativas` contam em JANELAS de 30 e 90 dias a partir de "hoje". O
 * conjunto do CRM e lido UMA vez, com o relogio da maquina, e os dois cards
 * mudam sozinhos com o passar do tempo: a ultima compra e 16/06/2026, entao a
 * cliente sai de `novas` em 16/07 e entra em `inativas` em 14/09.
 *
 * Sem fixar o dia, esta bancada passaria hoje e falharia no mes que vem — e uma
 * bancada que expira nao prova nada. Os arquivos de print sao de 2026-09-27, e e
 * essa a data em que os numeros de adm-011 valem:
 *
 *   27/09 menos a ultima compra (16/06) = 103 dias
 *   103 > 90  ->  INATIVAS = 1   (o print mostra 1)
 *   103 > 30  ->  NOVAS    = 0   (o print mostra 0)
 *
 * A data entra por PARAMETRO, e nao por relogio — `listCrmDataset({ now })` ja
 * aceita isso justamente para a conta ser reproduzivel.
 */
const DIA_DO_PRINT = new Date('2026-09-27T23:00:00');

/* ----------------------------------------------------- 1. clientes (adm-005) */

console.log('\n1. aba Clientes — adm-005');

const pedidos = await require(join(OUT, 'src/lib/pedidos/data.js')).listOrders();
const clientes = await dados.listCustomers();

if (clientes.data.length === 1) ok('uma cliente na lista', 'a tabela de adm-005 tem uma linha');
else fail('numero de clientes', `${clientes.data.length}, esperado 1`);

const mariana = clientes.data[0];

/**
 * O NOME VEM DA PRIMEIRA OCORRENCIA DA CHAVE — e o da `Mariana`.
 *
 * A chave de agrupamento e o E-MAIL (`lp070087@gmail.com`), porque o CRM usa
 * `email || telefone || nome`. Os cinco pedidos caem na mesma chave, e o
 * original guarda o nome do PRIMEIRO item do grupo, sem sobrescrever — o
 * primeiro pedido e o da `Mariana` (16/06, o mais recente), entao o nome
 * exibido bate com o print em vez de virar `lucas`.
 *
 * A ORDEM IMPORTA: se `groupCustomers` sobrescrevesse o nome a cada pedido, o
 * resultado seria `lucas` (15/06, o ultimo em ordem decrescente) e a tabela
 * divergiria de adm-005 sem que nenhum numero mudasse.
 */
if (mariana && mariana.name === 'Mariana') ok('o nome e o do print', mariana.name);
else fail('nome da cliente', mariana ? mariana.name : '(vazio)');

if (mariana && mariana.email === 'lp070087@gmail.com') ok('o e-mail e o do print', mariana.email);
else fail('e-mail da cliente', mariana ? String(mariana.email) : '(vazio)');

if (mariana && mariana.orders === 5) ok('cinco pedidos', 'tres `lucas` + `carinna` + `Mariana` = 5 da mesma chave');
else fail('contagem de pedidos', mariana ? String(mariana.orders) : '(vazio)');

/**
 * A CONTA. `R$ 1.252,71` e o total do print, e ele precisa sair da SOMA dos
 * cinco totais — nao de uma constante.
 *
 * Os cinco totais de adm-003: 506,95 + 187,76 + 186 + 186 + 186 = 1.252,71.
 * Se alguem trocar o campo lido (por exemplo ler `subtotal` em vez de `total`),
 * a soma cai para 1.230,85 e esta prova acusa.
 */
const somaEsperada = pedidos.data.reduce((soma, pedido) => soma + pedido.payment.total, 0);
if (Math.abs(mariana.totalSpent - somaEsperada) < 0.005)
  ok('o total investido e a SOMA dos pedidos', `${mariana.totalSpent.toFixed(2)} = soma de ${pedidos.data.length}`);
else
  fail('total investido', `${mariana.totalSpent.toFixed(2)} vs soma ${somaEsperada.toFixed(2)}`);

if (Math.abs(mariana.totalSpent - 1252.71) < 0.005)
  ok('o total bate com o print', 'R$ 1.252,71');
else fail('total do print', mariana.totalSpent.toFixed(2));

/**
 * A LOCALIZACAO FICA VAZIA — e isso e uma DIVERGENCIA REGISTRADA, nao um
 * esquecimento.
 *
 * Adm-005 mostra `Rio de Janeiro - RJ`. Adm-011 conta `1` em
 * `RECIFE / OLINDA / JABOATAO`. So existe UMA cliente, e ela e a mesma nas duas
 * telas — nao pode estar nas duas cidades. Uma das capturas mostra um estado que
 * o banco de demonstracao nao tinha mais quando a outra foi tirada.
 *
 * Escolher qualquer uma das duas seria fabricar dado: `Rio de Janeiro`
 * contradiz adm-011, `Recife` contradiz adm-005. Os dois prints foram lidos e a
 * cidade NAO foi escrita em pedido nenhum. Esta prova FIXA esse estado — o dia
 * em que alguem preencher uma cidade "para a celula nao ficar vazia", ela cai e
 * obriga a decisao a ser tomada de proposito, com a referencia na mao.
 */
if (mariana.location === '') ok('a LOCALIZACAO fica vazia', 'adm-005 diz Rio, adm-011 diz Recife — a divergencia foi registrada, nao resolvida');
else fail('localizacao preenchida sem decidir a divergencia', `"${mariana.location}" — qual print sustenta esse valor?`);

/**
 * A FRONTEIRA COM PEDIDOS. O CRM le `lib/pedidos/DATA`, e nao `demo`. Se lesse
 * o demo direto, o CRM ficaria preso ao dado de exemplo e trocar a fonte de
 * Pedidos pelo Neon quebraria o CRM em silencio.
 */
const codigoData = semComentarios(arquivo('lib/crm/data.ts'));
if (/from '@\/lib\/pedidos\/data'/.test(codigoData)) ok('o CRM le Pedidos pela porta publica', "importa `@/lib/pedidos/data`");
else fail('a ponte com Pedidos', 'nao importa a camada de dados de Pedidos');

if (!/from '@\/lib\/pedidos\/demo'/.test(codigoData)) ok('e NAO importa o demo de Pedidos', 'a fronteira vale');
else fail('acoplamento com o demo de Pedidos', 'importa `lib/pedidos/demo` diretamente');

/* ---------------------------------------- 2. a tabela de clientes (colunas) */

console.log('\n2. as seis colunas da tabela de clientes');

const clientesSrc = semComentarios(arquivo('components/admin/crm/customers-table.tsx'));
const colunasClientes = ['Cliente', 'Localização', 'Pedidos', 'Total Investido', 'Última Compra', 'Ações'];
const faltandoClientes = colunasClientes.filter((c) => !clientesSrc.includes(c));
if (faltandoClientes.length === 0) ok('as seis colunas, na ordem do print', colunasClientes.join(' · '));
else fail('colunas da tabela de clientes', `faltam: ${faltandoClientes.join(', ')}`);

// A ordem importa: o mesmo conjunto embaralhado passaria no teste acima.
const posicoesClientes = colunasClientes.map((c) => clientesSrc.indexOf(c));
if (mesmo(posicoesClientes, [...posicoesClientes].sort((a, b) => a - b)))
  ok('e na ordem em que aparecem no arquivo', 'nenhuma trocada de lugar');
else fail('ordem das colunas de clientes', posicoesClientes.join(', '));

/* ------------------------------------------------------- 3. leads (adm-010) */

console.log('\n3. aba Leads — adm-010');

const conjunto = await dados.listCrmDataset({ now: DIA_DO_PRINT });

if (conjunto.data.leads.length === 1) ok('um lead na lista', 'a tabela de adm-010 tem uma linha');
else fail('numero de leads', `${conjunto.data.leads.length}, esperado 1`);

const lead = conjunto.data.leads[0];

if (lead && lead.name === 'Carrinho Abandonado') ok('o nome e o do print', lead.name);
else fail('nome do lead', lead ? lead.name : '(vazio)');

if (lead && lead.email === 'lp070087@gmail.com') ok('o e-mail e o do print', lead.email);
else fail('e-mail do lead', lead ? String(lead.email) : '(vazio)');

if (lead && lead.whatsapp === null) ok('o WhatsApp e `null`', 'por isso a coluna ACOES tem UM icone');
else fail('whatsapp do lead', lead ? String(lead.whatsapp) : '(vazio)');

if (lead && lead.source === 'carrinho_abandonado') ok('a origem e a do print', lead.source);
else fail('origem do lead', lead ? lead.source : '(vazio)');

/**
 * A DATA COM HORA, e com precisao de MINUTO.
 *
 * O print mostra `13/06/2026, 00:31`. O `formatDateTime` de `lib/utils` poe
 * SEGUNDOS, e por isso o CRM tem o proprio formatador. Se alguem trocar pelo
 * compartilhado "para padronizar", sai `00:31:00` — e esta prova acusa.
 */
if (helpers.formatDateTimeShort('2026-06-13T00:31:00') === '13/06/2026, 00:31')
  ok('a DATA sai com minuto e sem segundo', '13/06/2026, 00:31');
else fail('formato da data', helpers.formatDateTimeShort('2026-06-13T00:31:00'));

if (helpers.formatDateTimeShort(null) === '—' && helpers.formatDateTimeShort('nao-e-data') === '—')
  ok('data ausente ou invalida vira travessao', 'a tela nunca mostra `Invalid Date`');
else fail('data invalida', helpers.formatDateTimeShort('nao-e-data'));

console.log('\n4. as cinco colunas da tabela de leads');

const leadsSrc = semComentarios(arquivo('components/admin/crm/leads-table.tsx'));
const colunasLeads = ['Nome / Identificação', 'Contato', 'Origem', 'Data', 'Ações'];
const faltandoLeads = colunasLeads.filter((c) => !leadsSrc.includes(c));
if (faltandoLeads.length === 0) ok('as cinco colunas, na ordem do print', colunasLeads.join(' · '));
else fail('colunas da tabela de leads', `faltam: ${faltandoLeads.join(', ')}`);

const posicoesLeads = colunasLeads.map((c) => leadsSrc.indexOf(c));
if (mesmo(posicoesLeads, [...posicoesLeads].sort((a, b) => a - b)))
  ok('e na ordem em que aparecem no arquivo', 'nenhuma trocada de lugar');
else fail('ordem das colunas de leads', posicoesLeads.join(', '));

/* -------------------------------------------------- 5. a assimetria 3 x 1 */

console.log('\n5. a assimetria entre o segmento e a lista');

/**
 * ESTA E A ASSERCAO CENTRAL DA TELA.
 *
 * O segmento `Carrinho Abandonado` mostra 3 e a lista de leads mostra 1. Nao e
 * erro: o original conta TODOS os carrinhos no segmento e filtra
 * `email IS NOT NULL` na lista. Se alguem "arrumar" os dois para baterem, uma
 * das duas provas abaixo cai.
 */
const segmentoCarrinho = conjunto.data.segments.find((s) => s.key === 'carrinho_abandonado');

if (segmentoCarrinho && segmentoCarrinho.value === 3) ok('o segmento conta os TRES carrinhos', 'todos, com ou sem e-mail');
else fail('segmento carrinho abandonado', segmentoCarrinho ? String(segmentoCarrinho.value) : '(ausente)');

if (conjunto.data.abandonedCartsWithEmail === 1) ok('so UM carrinho tem e-mail', 'e por isso a lista tem um lead');
else fail('carrinhos com e-mail', String(conjunto.data.abandonedCartsWithEmail));

if (conjunto.data.abandonedCartsWithEmail < segmentoCarrinho.value)
  ok('os dois numeros DIFEREM, e de proposito', `${segmentoCarrinho.value} no card, ${conjunto.data.leads.length} na lista`);
else fail('a assimetria sumiu', 'os dois numeros iguais apagariam a regra do original');

/* --------------------------------------------------- 6. segmentos (adm-011) */

console.log('\n6. os oito segmentos — adm-011');

/**
 * OS OITO VALORES, COM HOJE = 2026-07-16 — a data em que o print foi tirado.
 *
 * SEM A DATA INJETADA esta prova nao valeria: `novas` e `inativas` dependem de
 * "hoje", e rodar a bancada em dezembro daria `0 / 1` no lugar de `1 / 0`. Por
 * isso o `now` entra aqui, e nao o relogio da maquina.
 *
 * O ULTIMO E O UNICO QUE NAO BATE COM O PRINT, e de proposito: adm-011 conta 1
 * em `regiao` e o nosso dado conta 0, porque nenhum pedido tem cidade. A causa
 * esta documentada em `lib/pedidos/demo.ts` — adm-005 diz `Rio de Janeiro` e
 * adm-011 diz `Recife`, e os dois nao podem ser verdade ao mesmo tempo. O valor
 * fica CALCULADO (0) em vez de escrito a mao (1) para a divergencia nao
 * desaparecer por baixo de uma constante.
 */
const ESPERADO = [
  ['novas', 'Novas Clientes', 0],
  ['recorrentes', 'Recorrentes', 1],
  ['vip', 'VIP', 1],
  ['inativas', 'Inativas', 1],
  ['carrinho_abandonado', 'Carrinho Abandonado', 3],
  ['wishlist', 'Interesse (Wishlist)', 0],
  ['provador', 'Usaram Provador', 0],
  ['regiao', 'Recife / Olinda / Jaboatão', 0],
];

const NO_PRINT = [0, 1, 1, 1, 3, 0, 0, 1];

if (conjunto.data.segments.length === 8) ok('oito cards', 'igual ao print');
else fail('numero de segmentos', `${conjunto.data.segments.length}, esperado 8`);

const valoresObtidos = conjunto.data.segments.map((s) => [s.key, s.label, s.value]);
if (mesmo(valoresObtidos, ESPERADO))
  ok('os oito valores calculados', ESPERADO.map(([, , v]) => v).join(' · '));
else {
  fail('valores dos segmentos', 'divergem do esperado');
  console.log(`       esperado: ${JSON.stringify(ESPERADO)}`);
  console.log(`       obtido:   ${JSON.stringify(valoresObtidos)}`);
}

/**
 * A DIVERGENCIA E EXATAMENTE UMA — e nao "deu tudo diferente".
 *
 * Comparar o calculado com o impresso campo a campo prova DUAS coisas de uma
 * vez: que sete dos oito numeros de adm-011 sao reproduzidos, e que o oitavo
 * difere por uma causa conhecida (`regiao`, sem cidade na origem). Sem esta
 * prova, "esta diferente do print" seria uma frase vaga que tanto esconde um
 * erro grande quanto uma divergencia declarada.
 */
const divergentes = ESPERADO
  .map(([, , calculado], i) => (calculado === NO_PRINT[i] ? null : ESPERADO[i][0]))
  .filter(Boolean);
if (mesmo(divergentes, ['regiao']))
  ok('sete numeros batem com o print, e so `regiao` diverge', 'a divergencia e a do endereco, e nao um erro de conta');
else fail('divergencias com o print', divergentes.length ? divergentes.join(', ') : 'nenhuma — o esperado era so `regiao`');

/**
 * O `regiao` DIVERGE POR CAUSA CONHECIDA — e o valor e CALCULADO, nao escrito.
 *
 * Este e o unico numero de adm-011 que o nosso dado nao reproduz, e a causa esta
 * em `lib/pedidos/demo.ts`: adm-005 diz `Rio de Janeiro - RJ` e adm-011 conta
 * `1` em `RECIFE / OLINDA / JABOATAO`, e as duas nao podem ser verdade para a
 * mesma cliente. O card FALHARIA se alguem tivesse escrito `regiao: 1` na mao
 * para "fechar" com o print — o numero tem que sair da conta, e nao da vontade.
 */
const regiaoCard = conjunto.data.segments.find((s) => s.key === 'regiao');
if (regiaoCard && regiaoCard.value === 0)
  ok('e o card `regiao` conta 0, CALCULADO', 'sem cidade na origem, nao ha como contar Recife');
else fail('o card regiao', regiaoCard ? String(regiaoCard.value) : '(ausente)');

// ...e a prova de que ele CONTA algo quando ha cidade. Sem ela, a assercao
// acima passaria com um `regiao` fixo em zero.
const comCidade = metricas.buildSegments(
  metricas.groupCustomers([
    { customerName: 'x', customerEmail: 'x@x.com', customerPhone: null, city: 'Olinda', state: 'PE', total: 1, createdAt: '2026-01-01T00:00:00' },
    { customerName: 'y', customerEmail: 'y@y.com', customerPhone: null, city: 'Recife', state: 'PE', total: 1, createdAt: '2026-01-01T00:00:00' },
    { customerName: 'z', customerEmail: 'z@z.com', customerPhone: null, city: 'Salvador', state: 'BA', total: 1, createdAt: '2026-01-01T00:00:00' },
  ]),
  { abandonedCarts: 0, wishlist: 0, tryOn: 0 },
  new Date('2026-07-16T12:00:00'),
).find((s) => s.key === 'regiao').value;
if (comCidade === 2) ok('e ele CONTA quando a cidade existe', 'Olinda e Recife entram, Salvador nao');
else fail('o card regiao com cidade', `${comCidade}, esperado 2`);

/**
 * OS VALORES SAO CALCULADOS, E NAO CONSTANTES.
 *
 * Se `demo.ts` tivesse `novas: 0` escrito a mao, todas as provas acima
 * passariam sem que a conta existisse — o teste artificial que nao vale nada.
 * Esta prova move o RELOGIO e exige que o numero MUDE.
 *
 * O CORTE E POR LIMITE ARITMETICO, e nao por calendario: `new Date()` menos 30
 * dias corridos. Com HOJE = 2026-07-16, a ultima compra (16/06) esta NO limite
 * exato dos 30 dias e ainda conta como nova (`>=`). Um dia depois deixa de
 * contar. E esse par — 16/07 dentro, 17/07 fora — que prova a janela.
 *
 * (Note que 16/07 NAO e o dia do print: aqui o relogio e movido so para o
 * limite da janela, que e o que esta prova quer medir.)
 */
const hoje = new Date('2026-07-16T12:00:00');
const umDiaDepois = new Date('2026-07-17T12:00:00');
const segHoje = metricas.buildSegments(clientes.data, { abandonedCarts: 3, wishlist: 0, tryOn: 0 }, hoje);
const segAmanha = metricas.buildSegments(clientes.data, { abandonedCarts: 3, wishlist: 0, tryOn: 0 }, umDiaDepois);
const novasHoje = segHoje.find((s) => s.key === 'novas').value;
const novasAmanha = segAmanha.find((s) => s.key === 'novas').value;

if (novasHoje === 1 && novasAmanha === 0)
  ok('`novas` e a JANELA de 30 dias, calculada', 'dentro no dia 30, fora no dia 31');
else fail('a janela de `novas`', `${novasHoje} no limite e ${novasAmanha} um dia depois — esperado 1 e 0`);

/**
 * A JANELA DE `inativas` E OUTRA COISA, CUIDADO: ela usa o corte de 90 DIAS.
 *
 * A prova anterior parecia cobrir este card e nao cobria — ela varria um ano
 * inteiro, onde os dois cortes dao o mesmo resultado. Com HOJE = 2026-07-16 a
 * cliente e NOVA (0 inativas). Para ela ficar inativa e preciso passar dos 90
 * dias, e nao dos 30: em 2026-07-17 (31 dias) ela continua nova, e so depois de
 * meados de setembro o card vira 1.
 */
const trintaEUmDias = new Date('2026-07-17T12:00:00');
const oitentaENoveDias = new Date('2026-09-13T12:00:00');
const noventaEUmDias = new Date('2026-09-15T12:00:00');
const inativasCurto = metricas.buildSegments(clientes.data, { abandonedCarts: 3, wishlist: 0, tryOn: 0 }, trintaEUmDias).find((s) => s.key === 'inativas').value;
const inativasQuase = metricas.buildSegments(clientes.data, { abandonedCarts: 3, wishlist: 0, tryOn: 0 }, oitentaENoveDias).find((s) => s.key === 'inativas').value;
const inativasLongo = metricas.buildSegments(clientes.data, { abandonedCarts: 3, wishlist: 0, tryOn: 0 }, noventaEUmDias).find((s) => s.key === 'inativas').value;

if (inativasCurto === 0 && inativasQuase === 0 && inativasLongo === 1)
  ok('`inativas` e a JANELA de 90 dias, e NAO a de 30', '0 aos 31 dias, 0 aos 89, 1 aos 91');
else fail('a janela de `inativas`', `31d=${inativasCurto}, 89d=${inativasQuase}, 91d=${inativasLongo} — esperado 0, 0, 1`);

/**
 * A ULTIMA COMPRA E A MAXIMA, e nao a ultima lida.
 *
 * `listOrders` devolve os pedidos do mais RECENTE para o mais antigo. Se a
 * agregacao guardasse a primeira data em vez do `MAX`, ela guardaria a CORRETA
 * por acidente nesta ordem — e passaria a errar no dia em que a ordem da lista
 * mudasse. Esta prova alimenta os registros FORA DE ORDEM e cobra a data certa.
 */
const foraDeOrdem = metricas.groupCustomers([
  { customerName: 'x', customerEmail: 'x@x.com', customerPhone: null, city: '', state: '', total: 1, createdAt: '2026-01-01T00:00:00' },
  { customerName: 'x', customerEmail: 'x@x.com', customerPhone: null, city: '', state: '', total: 1, createdAt: '2026-06-16T00:00:00' },
  { customerName: 'x', customerEmail: 'x@x.com', customerPhone: null, city: '', state: '', total: 1, createdAt: '2026-03-01T00:00:00' },
]);
if (foraDeOrdem.length === 1 && foraDeOrdem[0].lastOrderAt === '2026-06-16T00:00:00')
  ok('a ULTIMA COMPRA e o maior `createdAt`', 'mesmo com a lista fora de ordem');
else fail('a ultima compra', foraDeOrdem[0] ? foraDeOrdem[0].lastOrderAt : '(vazio)');

/**
 * A CHAVE DE AGRUPAMENTO E O E-MAIL PRIMEIRO — e a ordem importa.
 *
 * Dois nomes diferentes com o MESMO telefone viram UMA pessoa, porque e o
 * telefone a chave quando nao ha e-mail. Isso nao e hipotese: os tres `lucas` do
 * material sao tres pedidos da mesma chave. Esta prova fixa a regra.
 */
const agrupado = metricas.groupCustomers([
  { customerName: 'a', customerEmail: null, customerPhone: '81999990000', city: '', state: '', total: 10, createdAt: '2026-01-01T00:00:00' },
  { customerName: 'b', customerEmail: null, customerPhone: '81999990000', city: '', state: '', total: 20, createdAt: '2026-01-02T00:00:00' },
]);
if (agrupado.length === 1 && agrupado[0].orders === 2)
  ok('mesmo telefone, sem e-mail = UMA pessoa', 'dois nomes, uma chave');
else fail('agrupamento por telefone', JSON.stringify(agrupado));

const separado = metricas.groupCustomers([
  { customerName: 'a', customerEmail: 'a@x.com', customerPhone: '81999990000', city: '', state: '', total: 10, createdAt: '2026-01-01T00:00:00' },
  { customerName: 'b', customerEmail: 'b@x.com', customerPhone: '81999990000', city: '', state: '', total: 20, createdAt: '2026-01-02T00:00:00' },
]);
if (separado.length === 2) ok('e-mail diferente separa mesmo com telefone igual', 'o e-mail vem primeiro');
else fail('o e-mail nao teve prioridade', JSON.stringify(separado));

/* ------------------------------------------- 7. o card de segmento e proprio */

console.log('\n7. o card de segmento e diferente dos KPIs do painel');

const gridSrc = semComentarios(arquivo('components/admin/crm/segment-grid.tsx'));
if (!/from '@\/components\/ui\/stats'/.test(gridSrc))
  ok('o card NAO reusa o `StatCard` do painel', 'a tela tem o card proprio do print');
else fail('o card de segmento', 'reusa o KPI padrao — perde a diferenca do print');

const PALETA = ['bg-blue-100', 'bg-purple-100', 'bg-yellow-100', 'bg-gray-100', 'bg-orange-100', 'bg-pink-100', 'bg-cyan-100', 'bg-green-100'];
const paletaFaltando = PALETA.filter((c) => !gridSrc.includes(c));
if (paletaFaltando.length === 0) ok('as oito cores nomeadas do print', 'nao os tokens de superficie do design system');
else fail('paleta dos segmentos', `faltam: ${paletaFaltando.join(', ')}`);

/* ------------------------------------------------------------ 8. a busca */

console.log('\n8. a busca');

if (metricas.filterCustomers(clientes.data, 'mariana').length === 1) ok('busca por nome acha a cliente', 'mariana');
else fail('busca por nome', 'nao achou');

if (metricas.filterCustomers(clientes.data, 'NÃO EXISTE').length === 0) ok('busca sem resultado devolve vazio', 'o estado vazio e alcancavel');
else fail('busca sem resultado', 'devolveu linhas');

/**
 * A BUSCA IGNORA ESPACO — e a prova e a IGUALDADE com a lista sem busca.
 *
 * A versao anterior desta prova dizia "busca so com espacos devolve tudo" e
 * contava as linhas. Isso estava errado: com uma cliente so, "devolveu tudo" e
 * "nao devolveu nada" dao o mesmo `1` e `0` na contagem nao distingue os dois.
 * O que prova de verdade e a IGUALDADE entre `/  spaces  /` e a lista crua.
 */
const semEspacos = metricas.filterCustomers(clientes.data, '   ');
if (mesmo(semEspacos, clientes.data)) ok('busca so com espacos nao filtra nada', 'devolve a lista identica');
else fail('busca em branco', `${semEspacos.length} de ${clientes.data.length} linhas`);

/**
 * O TELEFONE E COMPARADO POR DIGITOS.
 *
 * Dois ataques, e os dois tem que passar:
 *   (a) o numero cru acha, mesmo sem a coluna existir na tela;
 *   (b) o numero FORMATADO tambem acha, porque a comparacao tira o nao-digito
 *       dos dois lados. Sem isso a busca dependeria da formatacao do dado
 *       gravado — e no proximo banco o telefone pode vir com parenteses.
 */
if (metricas.filterCustomers(clientes.data, '81994608572').length === 1)
  ok('busca por TELEFONE cru acha', 'o campo promete telefone e ele existe no dominio');
else fail('busca por telefone cru', 'nao achou');

if (metricas.filterCustomers(clientes.data, '(81) 99460-8572').length === 1)
  ok('e acha pelo numero FORMATADO', 'a comparacao tira o nao-digito dos dois lados');
else fail('busca por telefone formatado', 'nao achou');

if (metricas.filterLeads(conjunto.data.leads, 'lp070087').length === 1) ok('busca de lead por e-mail', 'lp070087');
else fail('busca de lead', 'nao achou');

if (metricas.filterLeads(conjunto.data.leads, 'CARRINHO').length === 1) ok('busca de lead por nome, sem caixa', 'CARRINHO');
else fail('busca de lead por nome', 'nao achou');

/* ------------------------------------------------- 9. acoes e ausencia de escrita */

console.log('\n9. as acoes e o que o modulo NAO tem');

if (acoes.CUSTOMER_ACTIONS.length === 1 && acoes.CUSTOMER_ACTIONS[0].label === 'Ver Perfil')
  ok('a unica acao de cliente e `Ver Perfil`', 'a do print');
else fail('acoes de cliente', JSON.stringify(acoes.CUSTOMER_ACTIONS.map((a) => a.label)));

if (acoes.CUSTOMER_ACTIONS.every((a) => a.available === false))
  ok('`Ver Perfil` esta indisponivel', 'o destino nao tem print nenhum');
else fail('`Ver Perfil` disponivel', 'abriria uma tela que ninguem viu');

if (acoes.LEAD_ACTIONS.length === 2 && acoes.LEAD_ACTIONS.every((a) => a.available))
  ok('as duas acoes de lead estao disponiveis', 'sao URL, nao tela deste painel');
else fail('acoes de lead', JSON.stringify(acoes.LEAD_ACTIONS));

if (acoes.whatsappLeadUrl(null, 'x') === null) ok('sem WhatsApp, sem link', 'a tela esconde o icone');
else fail('link de WhatsApp sem numero', String(acoes.whatsappLeadUrl(null, 'x')));

if (acoes.mailtoLeadUrl(null) === null) ok('sem e-mail, sem link', 'a tela esconde o icone');
else fail('mailto sem e-mail', String(acoes.mailtoLeadUrl(null)));

/**
 * O MODULO NAO ESCREVE. Nenhum dos tres prints mostra criar, editar ou excluir.
 * Um `WriteResult` exportado sugeriria uma operacao que a referencia nao tem.
 */
const dataSrc = semComentarios(arquivo('lib/crm/data.ts'));
if (!/WriteResult/.test(dataSrc)) ok('o modulo NAO exporta escrita', 'nenhum print mostra criar, editar ou excluir');
else fail('ha escrita no modulo', 'a referencia nao tem nenhuma');

const acoesSrc = semComentarios(arquivo('lib/crm/actions.ts'));
if (!/available: true/.test(acoesSrc.split('LEAD_ACTIONS')[0]))
  ok('nenhuma acao de cliente nasce disponivel', 'so as de lead');
else fail('acao de cliente disponivel', 'encontrada antes de `LEAD_ACTIONS`');

/* -------------------------------------------------------------- 10. a rota */

console.log('\n10. a rota');

const rotaCrua = arquivo('app/admin/crm/page.tsx');
const rota = semComentarios(rotaCrua);

if (/export default function CrmPage/.test(rota)) ok('a rota existe e exporta a pagina', '/admin/crm');
else fail('a rota do CRM', 'nao exporta o componente');

if (/from '@\/components\/admin\/crm\/crm-view'/.test(rota)) ok('a pagina aponta para a tela', '`CrmView`');
else fail('a pagina', 'nao importa a tela');

if (!/ModulePage/.test(rota)) ok('a pagina NAO usa mais o placeholder', 'o `ModulePage` foi removido');
else fail('a pagina ainda e um placeholder', '`ModulePage` continua la');

/**
 * A REFERENCIA ERRADA. O placeholder anterior citava `adm-009 a adm-011`, e
 * adm-009 e do Carrinho Abandonado. A `page.tsx` CITA essa prop errada no
 * comentario que registra a correcao — por isso a assercao mede o texto LIMPO e
 * a de documentacao mede o CRU. Sao duas perguntas diferentes.
 */
if (!/references\s*=\s*["']adm-009/.test(rota)) ok('a referencia errada NAO esta mais na prop', 'adm-009 e outro modulo');
else fail('a prop ainda cita adm-009', 'a referencia errada voltou');

if (/adm-009/.test(rotaCrua) && /adm-005/.test(rotaCrua))
  ok('e a divergencia ficou REGISTRADA no comentario', 'a troca esta documentada, nao apagada');
else fail('a divergencia nao esta registrada', 'sumiu do comentario');

/* --------------------------------------------- 11. o instrumento sabe falhar */

console.log('\n11. a tela carrega');

const esqueleto = textos(render(CrmView, {}));
if (normalizar(esqueleto).includes('Clientes')) ok('a tela renderiza o cabecalho de abas', 'no esqueleto de carregamento');
else fail('a tela nao renderizou', esqueleto.slice(0, 60));

/**
 * O TITULO DO CORPO — o defeito que ficou sem prova.
 *
 * Este modulo nasceu com o cabecalho AUSENTE: o comentario afirmava que o
 * `AdminShell` desenhava `CRM` + a descricao lendo `description` do `nav.ts`, e
 * o `admin-shell.tsx` nao le nada disso — ele desenha so o eyebrow e o `h1` do
 * topbar. A tela ficava sem titulo nenhum no corpo.
 *
 * A prova tem que ser sobre o TITULO, e nao sobre o codigo. Procurar
 * `SectionHeader` no arquivo passaria com o componente importado e nao usado, e
 * passaria de novo se o titulo voltasse a sumir. Aqui se mede o TEXTO que sai do
 * render — os dois textos do print adm-005.
 */
if (esqueleto.includes('CRM') && esqueleto.includes('Gerencie o relacionamento com sua base de clientes e leads.'))
  ok('e a tela traz o TITULO e a DESCRICAO do print', 'adm-005 — e nao texto da casca, que nao existe');
else fail('o cabecalho do corpo sumiu', `nao achei o titulo/descricao do adm-005`);

/**
 * ...E A DESCRICAO E A DO PRINT, NAO A DO `nav.ts` — as duas coincidem aqui, e a
 * prova trava a coincidencia para que uma mudanca futura no `nav.ts` nao leve o
 * titulo da tela junto por tabela.
 */
if (!esqueleto.includes('Recupere vendas interrompidas antes do pagamento.'))
  ok('e a descricao NAO vem do `nav.ts`', 'aquele texto e de outro contexto e nao aparece em print');
else fail('a descricao veio do nav.ts', 'vazou para a tela o texto que nenhum print mostra');

/**
 * `semComentarios` NAO PODE COMER CODIGO JUNTO.
 *
 * Se ele apagasse o arquivo inteiro, TODAS as assercoes de texto limpo
 * passariam por vaculdade em vez de por o defeito nao existir. Esta prova mede
 * as duas coisas de uma vez: o comentario some E o codigo ao lado sobrevive.
 */
const limpo = semComentarios(clientesSrc);
if (!limpo.includes('adm-009') && limpo.includes('TableHeaderCell') && limpo.includes('CUSTOMER_ACTIONS'))
  ok('`semComentarios` tirou o comentario e preservou o codigo', 'o instrumento continua exato');
else fail('`semComentarios` comeu codigo junto', 'o instrumento ficou cego, nao exato');

/* -------------------------------------------------- 12. provas ao contrario */

console.log('\n12. as provas ao contrario');

let quebrado = 0;

// (a) `groupCustomers` NAO pode devolver mais clientes que pedidos.
const inflado = metricas.groupCustomers([
  { customerName: 'x', customerEmail: 'x@x.com', customerPhone: null, city: '', state: '', total: 1, createdAt: '2026-01-01T00:00:00' },
]);
if (inflado.length === 1) { quebrado += 0; } else { quebrado += 1; }

// (b) `filterCustomers` NAO pode ser identidade disfarcada: um termo absurdo
//     tem que devolver MENOS que tudo.
if (metricas.filterCustomers(clientes.data, 'zzz-inexistente').length === clientes.data.length) { quebrado += 1; } else { quebrado += 0; }

// (c) `buildSegments` NAO pode ignorar os sinais de terceiros: mudar o
//     carrinho abandonado tem que mudar o card.
const comCinco = metricas.buildSegments(clientes.data, { abandonedCarts: 5, wishlist: 0, tryOn: 0 }, DIA_DO_PRINT);
if (comCinco.find((s) => s.key === 'carrinho_abandonado').value === 5) { quebrado += 0; } else { quebrado += 1; }

// (d) `customerKey` NAO pode agrupar pelo NOME quando ha e-mail — senao dois
//     homonimos viravam uma pessoa.
if (metricas.customerKey({ customerName: 'a', customerEmail: 'a@x.com', customerPhone: null, city: '', state: '', total: 0, createdAt: '' }) === 'a@x.com') { quebrado += 0; } else { quebrado += 1; }

// (e) `formatDateTimeShort` NAO pode deixar passar o segundo. E a troca que a
//     secao 3 existe para pegar.
if (helpers.formatDateTimeShort('2026-06-13T00:31:00').split(':').length === 2) { quebrado += 0; } else { quebrado += 1; }

if (quebrado === 0) ok('as cinco provas ao contrario falharam como deviam', 'o instrumento acusa defeito');
else fail('a bancada passaria em qualquer coisa', `${quebrado} de 5 provas ao contrario nao acusaram`);

// `types.js` e carregado so para provar que o modulo EMITIDO existe: os tipos
// somem na compilacao, e um arquivo de tipos sem nenhum `export` de valor e um
// erro que so apareceria em tempo de execucao do import.
if (tipos !== undefined) ok('o modulo de tipos foi emitido', 'o import de `types.js` resolve');

// `demo.js` idem: as constantes de demonstracao precisam existir emitidas.
if (demo.DEMO_ABANDONED_CARTS.length === 3) ok('os tres carrinhos de demonstracao existem', 'emitidos em `demo.js`');
else fail('carrinhos de demonstracao', String(demo.DEMO_ABANDONED_CARTS.length));

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
