/**
 * Bancada do modulo Configuracoes (adm-075 a adm-083).
 *
 * ================== O QUE ELA PROVA ==================
 *
 *   as QUATRO pilulas `Entrega propria · Melhor Envio · Integracao · Pagamentos`;
 *   as 67 zonas de entrega nas 4 cidades, com os valores do print;
 *   o agrupamento por cidade na ordem do print (Jabatao · Olinda · Paulista · Recife);
 *   o contador `(11 bairros)` / `(1 bairro)`;
 *   o valor `25,00` sem o `R$` colado (o simbolo e um span a parte);
 *   os sete campos do Melhor Envio — e que peso/dimensoes/seguro NAO existem;
 *   os cinco `(EM BREVE)` do seletor de transportadoras;
 *   o cartao verde `Melhor Envio conectado` com `Desconectar`;
 *   o cartao da InfinitePay: quatro campos, webhook e dois botoes;
 *   que toda escrita devolve `persisted: false` e nao muta a entrada;
 *   que a pagina deixou de ser `ModulePage` e a faixa errada sumiu.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Layout, cor renderizada, posicao, responsividade, animacao, `useEffect` e clique.
 *
 * A bancada NAO type-checa — so executa. O portao de TIPOS e o `npm run typecheck`.
 */

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-configuracoes.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-configuracoes');

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
  /src[\\/](lib[\\/]configuracoes|components[\\/]admin[\\/]configuracoes|app[\\/]admin[\\/]configuracoes)[\\/]/.test(f),
);

/* ---- o FECHO DE DEPENDENCIAS: so o que o modulo puxa ---- */
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

/** TRANSPILA SO O FECHO — nao type-checa. O portao de tipos e o `npm run typecheck`. */
const OPCOES = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
};

let emitidos = 0;
const falhasEmissao = [];
for (const arquivo of dependencias) {
  const fonte = readFileSync(arquivo, 'utf8');
  const saida = ts.transpileModule(fonte, { compilerOptions: OPCOES, fileName: arquivo, reportDiagnostics: true });
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

const demo = require(join(OUT, 'src/lib/configuracoes/demo.js'));
const dados = require(join(OUT, 'src/lib/configuracoes/data.js'));
const metricas = require(join(OUT, 'src/lib/configuracoes/metrics.js'));
const { ConfiguracoesView } = require(join(OUT, 'src/components/admin/configuracoes/configuracoes-view.js'));
const { ConfiguracoesTabs } = require(join(OUT, 'src/components/admin/configuracoes/configuracoes-tabs.js'));
const { OwnDeliveryTab } = require(join(OUT, 'src/components/admin/configuracoes/own-delivery-tab.js'));
const { ShippingSection, CALLBACK_URL } = require(join(OUT, 'src/components/admin/configuracoes/melhor-envio-tab.js'));
const { PaymentsTab, WEBHOOK_URL } = require(join(OUT, 'src/components/admin/configuracoes/payments-tab.js'));
const { ZoneForm, draftFromZone, draftNewCity } = require(join(OUT, 'src/components/admin/configuracoes/zone-form.js'));

/* ------------------------------------------------------------- utilidades */

const normalizar = (s) => s.replace(/[\s  ]+/g, ' ').trim();
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
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
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
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

const nada = () => {};

/* ====================== 1. a demonstracao: 67 zonas nas 4 cidades ====================== */

console.log('\n1. a demonstracao tem as QUATRO cidades do print, inteiras');

if (demo.DEMO_DELIVERY_ZONES.length === 67)
  ok('sao 67 bairros no total', '11 + 22 + 12 + 22, como os contadores das capturas');
else fail('total de zonas', `${demo.DEMO_DELIVERY_ZONES.length}`);

const cidades = {};
for (const z of demo.DEMO_DELIVERY_ZONES) cidades[z.city] = (cidades[z.city] ?? 0) + 1;
const esperado = {
  'Jaboatão dos Guararapes': 11,
  Olinda: 22,
  Paulista: 12,
  Recife: 22,
};
if (mesmo(cidades, esperado))
  ok('as quatro cidades com 11 · 22 · 12 · 22 bairros', 'bate com o `(N bairros)` de cada cabecalho');
else fail('por cidade', JSON.stringify(cidades));

if (demo.DEMO_DELIVERY_ZONES.every((z) => z.state === 'PE' && z.isActive))
  ok('todas em `PE` e todas `isActive`', 'o print mostra todas com o selo `Ativo`');
else fail('estado/ativo', '');

if (demo.DEMO_DELIVERY_ZONES.every((z) => z.neighborhood.trim() !== ''))
  ok('nenhum bairro em branco', 'por isso nenhuma linha cai no caso `toda a cidade`');
else fail('bairro em branco', '');

/** Jabatao cobra 25 em TODOS; as outras tem tabela por bairro. */
const jab = demo.DEMO_DELIVERY_ZONES.filter((z) => z.city === 'Jaboatão dos Guararapes');
if (jab.every((z) => z.price === 25))
  ok('Jabatao cobra 25 em todos os bairros', 'o print nao varia');
else fail('preco de Jabatao', '');

const olinda = demo.DEMO_DELIVERY_ZONES.find((z) => z.city === 'Olinda' && z.neighborhood === 'Águas Compridas');
if (olinda && olinda.price === 7)
  ok('Olinda tem tabela por bairro', '`Águas Compridas` = 7, como o print');
else fail('preco por bairro de Olinda', JSON.stringify(olinda));

/* ====================== 2. o agrupamento e o contador ====================== */

console.log('\n2. o agrupamento por cidade — a ordem do print e o contador');

const grupos = metricas.groupByCity(demo.DEMO_DELIVERY_ZONES);
if (mesmo(grupos.map((g) => g.city), ['Jaboatão dos Guararapes', 'Olinda', 'Paulista', 'Recife']))
  ok('a ordem dos blocos: Jabatao · Olinda · Paulista · Recife', '`state` depois `city`');
else fail('ordem dos blocos', JSON.stringify(grupos.map((g) => g.city)));

if (grupos.length === 4 && grupos.every((g) => g.zones.length > 0))
  ok('quatro grupos, nenhum vazio', '');
else fail('grupos', `${grupos.length}`);

if (metricas.neighborhoodCountLabel(11) === '11 bairros' && metricas.neighborhoodCountLabel(1) === '1 bairro')
  ok('o contador faz plural e singular', '`11 bairros` / `1 bairro`');
else fail('contador', metricas.neighborhoodCountLabel(1));

const totais = metricas.cityTotals(demo.DEMO_DELIVERY_ZONES);
if (totais.cities === 4 && totais.neighborhoods === 67)
  ok('`cityTotals` = 4 cidades e 67 bairros', '');
else fail('cityTotals', JSON.stringify(totais));

/* ====================== 3. os formatadores ====================== */

console.log('\n3. valor, nome do bairro e rotulo do selo');

if (metricas.priceLabel(25) === '25,00' && metricas.priceLabel(7.5) === '7,50')
  ok('`priceLabel` usa virgula e NAO cola o `R$`', 'o simbolo e um span a parte — nao duplicar');
else fail('priceLabel', metricas.priceLabel(7.5));

if (metricas.parsePrice('25') === 25 && metricas.parsePrice('25,50') === 25.5 && metricas.parsePrice('25.50') === 25.5)
  ok('`parsePrice` aceita `25`, `25,50` e `25.50`', '');
else fail('parsePrice', JSON.stringify([metricas.parsePrice('25'), metricas.parsePrice('25,50')]));

if (metricas.parsePrice('abc') === null && metricas.parsePrice('-5') === null && metricas.parsePrice('') === null)
  ok('texto sem numero, negativo e campo VAZIO devolvem `null`', 'vazio nunca vira preco zero');
else fail('parsePrice invalido', JSON.stringify([metricas.parsePrice('abc'), metricas.parsePrice('-5'), metricas.parsePrice('')]));

if (metricas.neighborhoodLabel('Boa Viagem') === 'Boa Viagem' && metricas.neighborhoodLabel('   ') === 'toda a cidade')
  ok('bairro em branco vira `toda a cidade`', 'o caso da cidade inteira');
else fail('neighborhoodLabel', metricas.neighborhoodLabel('   '));

if (metricas.zoneStatusLabel(true) === 'Ativo' && metricas.zoneStatusLabel(false) === 'Inativo')
  ok('o selo alterna `Ativo` / `Inativo`', '');
else fail('zoneStatusLabel', metricas.zoneStatusLabel(false));

/* ====================== 4. as quatro pilulas e as transportadoras ====================== */

console.log('\n4. as quatro pilulas e o seletor de transportadoras');

const abas = metricas.configTabs();
if (abas.length === 4 && abas[0].value === 'entrega_propria' && abas[3].value === 'pagamentos')
  ok('quatro abas, na ordem do print', 'Entrega propria · Melhor Envio · Integracao · Pagamentos');
else fail('abas', JSON.stringify(abas.map((a) => a.value)));

const pilulas = render(ConfiguracoesTabs, { value: 'entrega_propria', onChange: nada });
const tp = textos(pilulas);
if (tp.includes('Entrega própria') && tp.includes('Melhor Envio') &&
    tp.includes('Integração transportadoras') && tp.includes('Pagamentos'))
  ok('as quatro pilulas saem com o texto do print', 'caixa normal; a alta e do CSS');
else fail('pilulas', tp.slice(0, 200));

const prods = metricas.SHIPPING_PROVIDERS;
if (prods.length === 6 && prods.filter((p) => p.available).length === 1 && prods[0].value === 'melhor_envio')
  ok('seis transportadoras, so o Melhor Envio disponivel', '');
else fail('providers', JSON.stringify(prods.map((p) => p.available)));

if (metricas.providerLabel('Correios', false) === 'Correios (EM BREVE)' &&
    metricas.providerLabel('Melhor Envio', true) === 'Melhor Envio')
  ok('`providerLabel` so poe o `(EM BREVE)` nas indisponiveis', 'os cinco sufixos do print');
else fail('providerLabel', metricas.providerLabel('Correios', false));

/* ====================== 5. a aba ENTREGA PROPRIA montada ====================== */

console.log('\n5. a aba `Entrega propria` — ajuda, botoes, blocos e a tabela');

const telaEntrega = render(OwnDeliveryTab, {
  zones: demo.DEMO_DELIVERY_ZONES,
  onChangePrice: nada, onSave: nada, saving: false, aviso: null,
  onAddCity: nada, onAddNeighborhood: nada, onEdit: nada,
  onToggleActive: nada, onRemoveZone: nada, onRemoveCity: nada,
});
const tEntrega = textos(telaEntrega);

if (tEntrega.includes('Cadastre as cidades e bairros atendidos pela entrega própria.'))
  ok('a frase de ajuda do print', '');
else fail('ajuda', tEntrega.slice(0, 200));

if (tEntrega.includes('Salvar alterações') && tEntrega.includes('+ Adicionar cidade'))
  ok('os dois botoes do topo', '`Salvar alteracoes` e `+ Adicionar cidade`');
else fail('botoes do topo', '');

if (tEntrega.includes('Jaboatão dos Guararapes / PE') && tEntrega.includes('(11 bairros)'))
  ok('o bloco de Jabatao com o contador', '`Cidade / UF (N bairros)`');
else fail('bloco Jabatao', '');

if (tEntrega.includes('+ Adicionar bairro') && tEntrega.includes('Excluir cidade'))
  ok('os dois links do cabecalho do bloco', '');
else fail('links do bloco', '');

if (tEntrega.includes('Bairro') && tEntrega.includes('Valor') && tEntrega.includes('Prazo') &&
    tEntrega.includes('Status'))
  ok('as cinco colunas (o cabecalho da acao sai vazio)', 'Bairro · Valor · Prazo · Status');
else fail('colunas', '');

if (tEntrega.includes('Prazeres') && tEntrega.includes('Piedade'))
  ok('os bairros de Jabatao na tabela', 'primeiro e ultimo do print');
else fail('bairros', '');

if (tEntrega.includes('Mesmo dia / 24h') && tEntrega.includes('Ativo'))
  ok('o prazo e o selo de status', '');
else fail('prazo/status', '');

if (tEntrega.includes('Editar') && tEntrega.includes('Excluir'))
  ok('as duas acoes de cada linha', '');
else fail('acoes', '');

/** O `R$` aparece uma vez por linha, e o valor e um `input` — nao texto. */
if (contar(tEntrega, 'R$') === 67)
  ok('`R$` aparece uma vez por bairro', '67 bairros, 67 simbolos');
else fail('contagem de `R$`', `${contar(tEntrega, 'R$')}`);

const inputsValor = contar(telaEntrega, 'aria-label="Valor da entrega para');
if (inputsValor === 67)
  ok('67 campos de valor, um por bairro', 'o valor e editavel na celula, como o print');
else fail('campos de valor', `${inputsValor}`);

/** O valor se le no HTML CRU: `textos()` apaga o ATRIBUTO `value`. */
if (contar(telaEntrega, '25,00') >= 11 && !textos(telaEntrega).includes('value='))
  ok('o valor `25,00` existe como TEXTO e o `value` e atributo', '`textos` apaga atributo');
else fail('valor nos campos', '');

/* ====================== 6. a cidade vazia e o caso "toda a cidade" ====================== */

console.log('\n6. o vazio e o `toda a cidade`');

const semZonas = render(OwnDeliveryTab, {
  zones: [], onChangePrice: nada, onSave: nada, saving: false, aviso: null,
  onAddCity: nada, onAddNeighborhood: nada, onEdit: nada,
  onToggleActive: nada, onRemoveZone: nada, onRemoveCity: nada,
});
if (textos(semZonas).includes('Nenhuma cidade cadastrada ainda.'))
  ok('lista vazia mostra a frase propria', 'nao confunde com o estado cheio');
else fail('vazio', textos(semZonas).slice(0, 160));

const comCidadeToda = render(OwnDeliveryTab, {
  zones: [{ id: 'z1', state: 'PE', city: 'Recife', neighborhood: '', price: 20, etaLabel: 'Mesmo dia / 24h', daysMin: 0, daysMax: 1, isActive: true }],
  onChangePrice: nada, onSave: nada, saving: false, aviso: null,
  onAddCity: nada, onAddNeighborhood: nada, onEdit: nada,
  onToggleActive: nada, onRemoveZone: nada, onRemoveCity: nada,
});
if (textos(comCidadeToda).includes('toda a cidade') && textos(comCidadeToda).includes('(1 bairro)'))
  ok('bairro em branco desenha `toda a cidade` e conta `1 bairro`', 'o caso do `+ Adicionar cidade`');
else fail('cidade toda', textos(comCidadeToda).slice(0, 200));

/* ====================== 7. o cartao do MELHOR ENVIO ====================== */

console.log('\n7. o cartao do Melhor Envio — os sete campos e o que NAO existe');

const telaEnvio = render(ShippingSection, {
  config: demo.DEMO_MELHOR_ENVIO,
  connection: demo.DEMO_CONNECTION,
  saving: false, aviso: null,
  onSave: nada, onDisconnect: nada, onTest: nada,
});
const tEnvio = textos(telaEnvio);

if (tEnvio.includes('Melhor Envio') && tEnvio.includes('Credenciais, remetente e conexão OAuth oficial.'))
  ok('o titulo e o subtitulo do cartao', '');
else fail('cabecalho do cartao', tEnvio.slice(0, 200));

if (tEnvio.includes('Sandbox') && tEnvio.includes('Ativo'))
  ok('os dois checkboxes do topo', '`Sandbox` e `Ativo`, separados');
else fail('checkboxes', '');

const rotulos = ['Client ID', 'Client Secret', 'CEP de origem', 'Nome do remetente', 'Documento (CPF/CNPJ)', 'Telefone', 'Endereço de origem'];
const faltando = rotulos.filter((r) => !tEnvio.includes(r));
if (faltando.length === 0)
  ok('os SETE campos do print', 'Client ID · Secret · CEP · Remetente · Documento · Telefone · Endereco');
else fail('campos', `faltam: ${faltando.join(', ')}`);

if (tEnvio.includes('Melhor Envio conectado') && tEnvio.includes('Desconectar') && tEnvio.includes('desde'))
  ok('o cartao verde de conexao com o `Desconectar`', 'estado `ok` da demonstracao');
else fail('cartao de conexao', '');

if (tEnvio.includes('Callback URL') && tEnvio.includes(CALLBACK_URL))
  ok('a `Callback URL` com o endereco do print', 'registrar no Melhor Envio, nao configurar aqui');
else fail('callback', '');

if (tEnvio.includes('Testar frete') && tEnvio.includes('CEP de destino') && tEnvio.includes('Testar Frete'))
  ok('o bloco `TESTAR FRETE`', '');
else fail('testar frete', '');

for (const botao of ['Atualizar Token', 'Testar Conexão', 'Conectar Melhor Envio', 'Salvar Configurações']) {
  if (!tEnvio.includes(botao)) { fail('botao do rodape', botao); }
}
if (['Atualizar Token', 'Testar Conexão', 'Conectar Melhor Envio', 'Salvar Configurações'].every((b) => tEnvio.includes(b)))
  ok('os quatro botoes do rodape', '');
else fail('rodape', '');

/** Os cinco `(EM BREVE)` e o chip ativo. */
if (contar(tEnvio, '(EM BREVE)') === 5)
  ok('cinco transportadoras com `(EM BREVE)`', 'so o Melhor Envio fica de fora');
else fail('EM BREVE', `${contar(tEnvio, '(EM BREVE)')}`);

if (telaEnvio.includes('disabled') && tEnvio.includes('Correios (EM BREVE)'))
  ok('as indisponiveis saem desabilitadas', '');
else fail('disabled do seletor', '');

/** A conexao `off` troca o cartao verde pelo cinza. */
const semConexao = render(ShippingSection, {
  config: demo.DEMO_MELHOR_ENVIO,
  connection: { status: 'off', accountName: '', accountEmail: '', connectedAt: '' },
  saving: false, aviso: null, onSave: nada, onDisconnect: nada, onTest: nada,
});
if (textos(semConexao).includes('Melhor Envio não conectado') && !textos(semConexao).includes('Desconectar'))
  ok('sem conexao o cartao vira `nao conectado` e o `Desconectar` some', '');
else fail('conexao off', textos(semConexao).slice(0, 200));

/* ====================== 8. o cartao da InfinitePay ====================== */

console.log('\n8. a aba `Pagamentos` — InfinitePay');

const telaPag = render(PaymentsTab, {
  config: demo.DEMO_PAYMENTS, saving: false, aviso: null, onSave: nada, onTest: nada,
});
const tPag = textos(telaPag);

if (tPag.includes('InfinitePay') && tPag.includes('Configure as credenciais para receber PIX e cartão na loja.'))
  ok('o titulo e o subtitulo do cartao', '');
else fail('cabecalho do pagamento', tPag.slice(0, 200));

const camposPag = ['API Key / Token', 'Client ID', 'Client Secret', 'Webhook Secret'];
const faltandoPag = camposPag.filter((c) => !tPag.includes(c));
if (faltandoPag.length === 0)
  ok('os quatro campos da InfinitePay', '');
else fail('campos do pagamento', faltandoPag.join(', '));

if (tPag.includes('Modo teste (sandbox)') && tPag.includes('Ativo no checkout'))
  ok('os dois checkboxes', '');
else fail('checkboxes do pagamento', '');

if (tPag.includes('Webhook URL') && tPag.includes(WEBHOOK_URL) &&
    tPag.includes('Cole esta URL no painel InfinitePay (notificações/webhooks).'))
  ok('o bloco de webhook com a instrucao', '');
else fail('webhook', '');

if (tPag.includes('Salvar configurações') && tPag.includes('Testar conexão'))
  ok('os dois botoes do rodape', '');
else fail('botoes do pagamento', '');

/** Todos os quatro campos vazios — o print adm-223 nao tem nenhum preenchido. */
if (demo.DEMO_PAYMENTS.apiKey === '' && demo.DEMO_PAYMENTS.clientId === '' &&
    demo.DEMO_PAYMENTS.clientSecret === '' && demo.DEMO_PAYMENTS.webhookSecret === '')
  ok('as credenciais de demonstracao sao vazias', 'como o print mostra');
else fail('credenciais', JSON.stringify(demo.DEMO_PAYMENTS));

if (demo.DEMO_PAYMENTS.sandbox === true && demo.DEMO_PAYMENTS.isActive === false)
  ok('`sandbox` marcado e `Ativo no checkout` desmarcado', 'exatamente o print');
else fail('estado dos checkboxes', '');

/* ====================== 9. a view abre em CARREGAMENTO ====================== */

console.log('\n9. a tela — cabecalho e o estado inicial');

const tela = render(ConfiguracoesView, {});
const tTela = textos(tela);

if (tTela.includes('Configurações') && tTela.includes('Preferências gerais da loja.'))
  ok('o cabecalho do print', 'titulo e descricao');
else fail('cabecalho', tTela.slice(0, 200));

if (tTela.includes('Carregando…') && !tTela.includes('Cadastre as cidades'))
  ok('a tela abre em CARREGAMENTO', '`useEffect` nao roda no `renderToStaticMarkup`');
else fail('estado inicial', tTela.slice(0, 200));

/* ====================== 10. a escrita e as mutacoes puras ====================== */

console.log('\n10. a escrita nao finge gravar, e as mutacoes nao tocam a entrada');

const escZona = await dados.saveZonePrices([{ id: 'z001', price: 30 }]);
if (escZona.persisted === false && escZona.reason.length > 0 && escZona.data[0].price === 30)
  ok('`saveZonePrices` devolve `persisted: false` com motivo', '');
else fail('escrita de precos', JSON.stringify(escZona));

const escEnvio = await dados.saveMelhorEnvio(demo.DEMO_MELHOR_ENVIO);
if (escEnvio.persisted === false && escEnvio.reason.length > 0)
  ok('`saveMelhorEnvio` devolve `persisted: false`', '');
else fail('escrita do envio', JSON.stringify(escEnvio.persisted));

const escPag = await dados.savePayments(demo.DEMO_PAYMENTS);
if (escPag.persisted === false && escPag.reason.length > 0)
  ok('`savePayments` devolve `persisted: false`', '');
else fail('escrita do pagamento', JSON.stringify(escPag.persisted));

/** A leitura devolve COPIA — editar a tela nao pode escrever na demonstracao. */
const leitura = await dados.listDeliveryZones();
leitura.data[0].price = 999;
if (demo.DEMO_DELIVERY_ZONES[0].price === 25)
  ok('a leitura devolve copia — a demonstracao nao e tocada', '`map` + spread por zona');
else fail('demo mutada', `${demo.DEMO_DELIVERY_ZONES[0].price}`);

/** As mutacoes puras devolvem lista NOVA e nao mudam a de entrada. */
const entrada = [
  { id: 'a', state: 'PE', city: 'Recife', neighborhood: 'Boa Viagem', price: 20, etaLabel: 'Mesmo dia / 24h', daysMin: 0, daysMax: 1, isActive: true },
  { id: 'b', state: 'PE', city: 'Olinda', neighborhood: 'Rio Doce', price: 20, etaLabel: 'Mesmo dia / 24h', daysMin: 0, daysMax: 1, isActive: true },
];

const comPreco = metricas.applyPriceChange(entrada, 'a', 30);
if (comPreco.find((z) => z.id === 'a').price === 30 && entrada[0].price === 20 && !Object.is(comPreco, entrada))
  ok('`applyPriceChange` troca um preco e nao muta a entrada', '');
else fail('applyPriceChange', '');

const alternada = metricas.toggleZoneActive(entrada, 'b');
if (alternada.find((z) => z.id === 'b').isActive === false && entrada[1].isActive === true)
  ok('`toggleZoneActive` inverte um e nao muta a entrada', '');
else fail('toggleZoneActive', '');

if (metricas.removeZone(entrada, 'a').length === 1 && entrada.length === 2)
  ok('`removeZone` tira um e nao muta a entrada', '');
else fail('removeZone', '');

if (metricas.removeCity(entrada, 'PE', 'Olinda').length === 1 && entrada.length === 2)
  ok('`removeCity` tira a cidade inteira e nao muta a entrada', '');
else fail('removeCity', '');

const inserida = metricas.upsertZone(entrada, { id: 'c', state: 'PE', city: 'Recife', neighborhood: 'Pina', price: 20, etaLabel: 'Mesmo dia / 24h', daysMin: 0, daysMax: 1, isActive: true });
if (inserida.length === 3 && entrada.length === 2)
  ok('`upsertZone` insere um novo sem mutar a entrada', '');
else fail('upsertZone insere', '');

const trocada = metricas.upsertZone(entrada, { ...entrada[0], price: 44 });
if (trocada.length === 2 && trocada.find((z) => z.id === 'a').price === 44 && entrada[0].price === 20)
  ok('`upsertZone` substitui um existente pelo id', 'mesmo tamanho, valor novo');
else fail('upsertZone substitui', '');

/** `zoneFromDraft` — o id novo vem de FORA, e a UF sobe a caixa. */
const doDraft = metricas.zoneFromDraft(
  { id: null, state: 'pe', city: 'Recife', neighborhood: 'Pina', price: '25,50', etaLabel: '', isActive: true },
  'novo-1',
);
if (doDraft.id === 'novo-1' && doDraft.state === 'PE' && doDraft.price === 25.5 && doDraft.etaLabel === 'Mesmo dia / 24h')
  ok('`zoneFromDraft` monta a zona: id de fora, UF em caixa alta, prazo padrao', '');
else fail('zoneFromDraft', JSON.stringify(doDraft));

const edicaoDraft = metricas.zoneFromDraft(
  { id: 'z005', state: 'PE', city: 'Recife', neighborhood: 'Pina', price: '10', etaLabel: 'Mesmo dia / 24h', isActive: false },
  'novo-9',
);
if (edicaoDraft.id === 'z005')
  ok('`zoneFromDraft` de edicao MANTEM o id da linha', 'o id de fora so vale na criacao');
else fail('zoneFromDraft edicao', edicaoDraft.id);

/* ====================== 11. o formulario de bairro ====================== */

console.log('\n11. o formulario de bairro — do original, nao de um print');

const form = render(ZoneForm, { draft: draftNewCity(), open: true, saving: false, onClose: nada, onSave: nada });
const tForm = textos(form);
if (tForm.includes('UF') && tForm.includes('Cidade') && tForm.includes('Bairro') &&
    tForm.includes('Valor') && tForm.includes('Prazo') && tForm.includes('Ativo no checkout'))
  ok('os campos do `LocalZoneForm` do original', 'UF · Cidade · Bairro · Valor · Prazo · Ativo');
else fail('campos do formulario', tForm.slice(0, 240));

if (tForm.includes('Adicionar cidade / bairro') && !tForm.includes('Editar bairro'))
  ok('criacao e edicao tem titulos diferentes', '');
else fail('titulo do formulario', '');

const formEdicao = render(ZoneForm, { draft: draftFromZone(entrada[0]), open: true, saving: false, onClose: nada, onSave: nada });
/** O TITULO se prova no texto; os VALORES dos campos, so no HTML cru (sao atributos). */
if (textos(formEdicao).includes('Editar bairro') && !textos(formEdicao).includes('Adicionar cidade / bairro'))
  ok('o titulo de edicao troca para `Editar bairro`', 'nao confunde com a criacao');
else fail('form de edicao', textos(formEdicao).slice(0, 240));

/** O campo preenchido e um ATRIBUTO — `textos()` o apaga, entao se le no HTML cru. */
if (formEdicao.includes('value="Boa Viagem"') && formEdicao.includes('value="20,00"'))
  ok('os campos vem preenchidos no HTML cru', 'o `value` e atributo; `textos` nao o ve');
else fail('campos preenchidos', '');

const formFechado = render(ZoneForm, { draft: null, open: false, saving: false, onClose: nada, onSave: nada });
if (formFechado === '')
  ok('sem rascunho o formulario nao desenha nada', '`draft === null` devolve `null`');
else fail('form sem draft', formFechado.slice(0, 80));

/* ====================== 12. a pagina e o que NAO foi inventado ====================== */

console.log('\n12. a pagina e a tela de verdade, e o que NAO foi inventado');

const pagina = arquivo('src/app/admin/configuracoes/page.tsx');
const paginaLimpa = semComentarios(pagina);

if (!paginaLimpa.includes('ModulePage') && paginaLimpa.includes('ConfiguracoesView'))
  ok('a pagina e a tela de verdade, nao o `ModulePage`', '');
else fail('pagina ainda e placeholder', paginaLimpa.slice(0, 160));

if (!paginaLimpa.includes('structure') && !paginaLimpa.includes('references='))
  ok('o `structure` e o `references=` inventados sumiram', '');
else fail('placeholder sobreviveu', '');

if (!/adm-075 a adm-078/.test(paginaLimpa))
  ok('a faixa ERRADA `adm-075 a adm-078` nao aparece no codigo', 'a correta e adm-075 a adm-083');
else fail('faixa errada', '');

const fonte = [
  arquivo('src/lib/configuracoes/types.ts'), arquivo('src/lib/configuracoes/demo.ts'),
  arquivo('src/lib/configuracoes/metrics.ts'), arquivo('src/lib/configuracoes/data.ts'),
  arquivo('src/components/admin/configuracoes/configuracoes-tabs.tsx'),
  arquivo('src/components/admin/configuracoes/own-delivery-tab.tsx'),
  arquivo('src/components/admin/configuracoes/zone-form.tsx'),
  arquivo('src/components/admin/configuracoes/melhor-envio-tab.tsx'),
  arquivo('src/components/admin/configuracoes/payments-tab.tsx'),
  arquivo('src/components/admin/configuracoes/configuracoes-view.tsx'), pagina,
].join('\n');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonte)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo');
else fail('o modulo toca banco', '');

if (!/@ts-ignore|@ts-expect-error/.test(fonte))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', '');
else fail('supressao de tipo', '');

/**
 * Peso, dimensoes e seguro NAO existem no print — uma versao anterior do `types.ts`
 * os tinha (vinham do `MelhorEnvioAdmin` do original), e a medicao sobre o CODIGO
 * SEM COMENTARIOS e o que prova que sairam: quem explica "nao ha peso aqui" escreve
 * a palavra `peso`, e medir o arquivo cru acusaria a propria nota.
 */
const codigo = semComentarios(fonte);
if (!/defaultWeight|defaultHeight|defaultWidth|defaultLength|\binsurance\b|\breceipt\b|\bownHand\b/.test(codigo))
  ok('nada de peso, dimensoes, seguro ou mao propria', 'o print nao mostra; nao inventado');
else fail('campo inventado', (codigo.match(/defaultWeight|defaultHeight|defaultWidth|defaultLength|insurance|receipt|ownHand/) ?? []).join(', '));

/** Dado pessoal do titular NAO foi copiado para o codigo. */
if (!/71524692450|81998817397|carinnatavares|Carina Tav\\|Aguas compridas - Rua/.test(codigo))
  ok('nenhum dado pessoal do print entrou no codigo', 'nome, CPF, telefone e endereco do titular, fora');
else fail('dado pessoal no codigo', '');

/* ====================== 13. provas ao contrario ====================== */

console.log('\n13. provas ao contrario — o defeito tem que REPROVAR');

/** O contador NAO pode dizer `1 bairros`. */
if (metricas.neighborhoodCountLabel(0) === '0 bairros' && metricas.neighborhoodCountLabel(2) === '2 bairros')
  ok('o plural vale de 0 em diante, e so o 1 e singular', '');
else fail('plural frouxo', metricas.neighborhoodCountLabel(0));

/** `textos()` apaga o ATRIBUTO `value` — por isso o valor se le no cru. */
if (telaEntrega.includes('value="25,00"') && !tTextosTemValue(telaEntrega))
  ok('`textos` apaga o `value`; o HTML cru nao', 'por isso o preco se prova no cru');
else fail('textos nao apaga atributos', '');

/** O agrupamento NAO pode juntar cidades de UF diferente pela chave. */
const duasUfs = metricas.groupByCity([
  { id: 'x', state: 'PE', city: 'Recife', neighborhood: 'Boa Viagem', price: 20, etaLabel: '', daysMin: 0, daysMax: 1, isActive: true },
  { id: 'y', state: 'SP', city: 'Recife', neighborhood: 'Sé', price: 20, etaLabel: '', daysMin: 0, daysMax: 1, isActive: true },
]);
if (duasUfs.length === 2)
  ok('duas cidades de MESMO nome e UF diferente nao se fundem', 'a chave junta estado e cidade');
else fail('chave de agrupamento frouxa', `${duasUfs.length}`);

/** Um preco de 2 casas nao pode virar `25` cru na tela. */
if (metricas.priceLabel(25) !== '25' && metricas.priceLabel(25).includes(','))
  ok('o valor nunca sai sem as duas casas', '`25,00`, nao `25`');
else fail('priceLabel sem casas', metricas.priceLabel(25));

/** `parsePrice('')` NAO pode voltar como `0` — o defeito que esta bancada pegou. */
if (metricas.parsePrice('   ') === null && metricas.parsePrice('R$') === null)
  ok('so espaco e so simbolo tambem nao viram zero', 'a limpeza esvaziaria; o guarda barra antes');
else fail('vazio virou zero', JSON.stringify([metricas.parsePrice('   '), metricas.parsePrice('R$')]));

function tTextosTemValue(html) {
  return textos(html).includes('value=');
}

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
