/**
 * Bancada do modulo Campanhas.
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o
 * `next/font/google` espera as fontes para sempre). Sem esta bancada, a unica
 * garantia seria o typecheck — que nao renderiza, nao formata e nao ve o ramo
 * invertido.
 *
 * O QUE ELA PROVA, EM ORDEM
 *
 *   1. os .ts/.tsx do modulo EMITEM sem erro e os `@/` resolvem em execucao;
 *   2. os quatro estados do material, e a diferenca FINA entre dois deles:
 *      adm-006 e a leitura em andamento (cabecalho SEM mensagem de vazio) e
 *      adm-015 e a leitura concluida com lista vazia (COM a mensagem);
 *   3. as cinco colunas, na ordem do print, todas alinhadas a ESQUERDA;
 *   4. que `Status` diz `Ativa`/`Pausada` e NAO `Ativo`/`Inativo` — a grafia
 *      divergente de Cupons, que o material sustenta de proposito;
 *   5. que a validade nula diz `Indeterminado`, e nao um travessao;
 *   6. o formulario: os OITO campos, os dois `placeholder`, o padrao dos tres
 *      seletores e a DATA INICIO preenchida com o dia;
 *   7. que o rascunho NAO transforma campo vazio em `0`;
 *   8. que as duas regras de data tratam o fuso (o defeito do `T00:00:00`);
 *   9. que a lista de demonstracao E VAZIA de proposito — o material nao tem
 *      uma campanha sequer;
 *  10. que `SALVAR CAMPANHA` NAO finge gravar;
 *  11. QUE A UNIAO COM CUPONS E UMA CHAMADA, E NAO UMA COPIA — o ponto mais
 *      importante deste modulo;
 *  12. os cards de desempenho e os dois textos de vazio do print;
 *  13. a rota existe e nao usa mais o placeholder;
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
  console.error('uso: node bench-campanhas.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-campanhas');

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
 * Raizes da COMPILACAO: so o modulo novo, mais o modulo Cupons.
 *
 * `lib/cupons` entra porque a tela LE de la (`listCoupons`, `topUsedCoupons`) — e
 * a uniao entre os dois modulos que esta bancada precisa provar. O compilador
 * segue os outros `import` sozinho. As outras paginas do painel NAO entram:
 * compilar tudo estoura o limite de ~178 s do `bash` deste ambiente.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/](campanhas|cupons)|components[\\/]admin[\\/](campanhas|cupons)|app[\\/]admin[\\/]campanhas)[\\/]/.test(f),
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
if (erros.length === 0 && emitidos.emitSkipped === false) ok('emissao sem erro', `${raizes.length} raizes (campanhas + cupons)`);
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

const dados = require(join(OUT, 'src/lib/campanhas/data.js'));
const demo = require(join(OUT, 'src/lib/campanhas/demo.js'));
const metricas = require(join(OUT, 'src/lib/campanhas/metrics.js'));
const formulario = require(join(OUT, 'src/lib/campanhas/form.js'));
const cuponsDados = require(join(OUT, 'src/lib/cupons/data.js'));
const cuponsMetricas = require(join(OUT, 'src/lib/cupons/metrics.js'));
const { CampaignTable } = require(join(OUT, 'src/components/admin/campanhas/campaign-table.js'));
const { CampaignForm } = require(join(OUT, 'src/components/admin/campanhas/campaign-form.js'));
const { CampaignReport, CouponReport } = require(join(OUT, 'src/components/admin/campanhas/campaign-reports.js'));
// A TABELA DE CUPONS entra so para a prova das DUAS GRAFIAS: `Ativo` nao mora em
// `lib/cupons/metrics.ts`, e sim no componente. Ver a secao 4.
const { CouponTable } = require(join(OUT, 'src/components/admin/cupons/coupon-table.js'));

/* ------------------------------------------------------------- utilidades */

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o
 * `toLocaleString('pt-BR')` usa espaco inquebravel e o `\s` do JS nao o pega.
 */
const normalizar = (s) => s.replace(/[\s ]+/g, ' ').trim();
function textos(html) {
  return normalizar(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
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

/**
 * TEXTO DOS ROTULOS, SEM AS `<option>`.
 *
 * O `<select>` carrega TODAS as opcoes no HTML sempre, entao um rotulo curto pode
 * ser encontrado dentro de uma `<option>` em vez de no rotulo. Foi o que quase
 * cegou a bancada de Cupons, onde `Percentual (%)` aparecia nas duas situacoes.
 */
function textosDeRotulo(html) {
  return textos(html.replace(/<option[\s\S]*?<\/option>/g, ' '));
}

const render = (Componente, props) => renderToStaticMarkup(react.createElement(Componente, props));

/**
 * O CODIGO DE UM ARQUIVO, SEM OS COMENTARIOS.
 *
 * A licao veio de Pedidos e se repetiu em Cupons: o comentario que EXPLICA uma
 * correcao CITA a string procurada, e a agulha casa dentro da explicacao. A
 * armadilha esta armada aqui em varios lugares — a `page.tsx` cita `adm-012` ao
 * registrar a referencia errada, e `data.ts` cita `toast.success` ao explicar por
 * que ele nao foi reproduzido. As assercoes correspondentes medem o texto LIMPO.
 *
 * A segunda regra evita comer o `//` de `https://`: so trata como comentario de
 * linha quando o `//` NAO vem depois de `:`.
 */
function semComentarios(codigo) {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * ORDEM POR POSICAO — e nao por comparacao de indices.
 *
 * Comparar `posicoes` com `[...posicoes].sort()` PASSA quando duas agulhas caem no
 * mesmo lugar. Foi assim que a bancada de Carrinho Abandonado quase deu verde
 * para uma tabela desalinhada. Aqui a ordem e ESTRITAMENTE crescente.
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

/** Um dia local no formato do `<input type="date">`, sem passar por UTC. */
function diaLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/* ------------------------------------------------ 1. a lista e VAZIA */

console.log('\n1. a lista — o que o material mostra');

const conjunto = await dados.listCampaigns();

if (conjunto.data.length === 0)
  ok('a lista de demonstracao esta VAZIA', 'os QUATRO prints mostram `0 campanha(s)`');
else fail('a lista tem campanha inventada', `${conjunto.data.length} — nenhum print tem uma linha preenchida`);

if (demo.DEMO_CAMPAIGNS.length === 0 && Array.isArray(demo.DEMO_CAMPAIGNS))
  ok('e `DEMO_CAMPAIGNS` e um array vazio de verdade', 'nao e `undefined` nem um objeto');
else fail('`DEMO_CAMPAIGNS`', 'nao e um array vazio');

if (conjunto.source === 'demo') ok('e a origem vem marcada como `demo`', 'o dado nao se apresenta como real');
else fail('origem do conjunto', conjunto.source);

/* ------------------------------------- 2. os quatro estados do material */

console.log('\n2. os quatro estados — e a diferenca entre dois deles');

/**
 * ADM-006 E ADM-015 SAO O MESMO `0 campanha(s)` COM UMA DIFERENCA FINA.
 *
 * Em adm-006 a tabela mostra o CABECALHO e mais nada — sem a mensagem de vazio. Em
 * adm-015 aparece `Nenhuma campanha ativa no momento.`. A leitura e: o primeiro e
 * a pagina com a leitura em ANDAMENTO (o esqueleto do cabecalho no lugar da
 * linha), e o segundo e a leitura CONCLUIDA com a lista vazia.
 *
 * A tabela vazia e seus dois estados sao distinguiveis pelo texto que sai. O
 * esqueleto de carregamento mora na VIEW (`TableSkeleton`), e nao na tabela —
 * por isso a prova do estado de carregamento mede a view.
 */
const tabelaVazia = textos(render(CampaignTable, { rows: [], onEdit: () => {} }));
if (tabelaVazia.includes('Nenhuma campanha ativa no momento.'))
  ok('a tabela vazia diz o que o print diz', '`Nenhuma campanha ativa no momento.` — palavra por palavra');
else fail('mensagem de lista vazia', tabelaVazia.slice(0, 80));

// ...e NAO diz "Carregando...", que e o texto do estado de carregamento de Cupons.
// A distincao entre os dois estados aqui e a AUSENCIA da mensagem, nao um texto.
if (!tabelaVazia.includes('Carregando'))
  ok('e ela NAO diz `Carregando...`', 'o print de carregamento nao tem esse texto — o esqueleto e o sinal');

const viewSrc = semComentarios(arquivo('components/admin/campanhas/campanhas-view.tsx'));
if (viewSrc.includes('TableSkeleton'))
  ok('e a tela tem o esqueleto de carregamento', 'e o que adm-006 mostra no lugar da linha');
else fail('esqueleto de carregamento', 'a tela nao tem estado de carregamento');

// O outro estado vazio: os DOIS cards. Os textos sao os de adm-006.
const cardCampanhasVazio = textos(render(CampaignReport, { rows: [] }));
const cardCuponsVazio = textos(render(CouponReport, { rows: [] }));
if (cardCampanhasVazio.includes('Sem dados de uso.'))
  ok('o card `Campanhas com mais venda` vazio diz `Sem dados de uso.`', 'o texto de adm-006');
else fail('vazio do card de campanhas', cardCampanhasVazio.slice(0, 80));

if (cardCuponsVazio.includes('Sem cupons usados.'))
  ok('e o card `Cupons mais usados` vazio diz `Sem cupons usados.`', 'o outro texto de adm-006');
else fail('vazio do card de cupons', cardCuponsVazio.slice(0, 80));

/* ------------------------------------------------- 3. as cinco colunas */

console.log('\n3. a tabela — as colunas do print');

const tabelaSrc = semComentarios(arquivo('components/admin/campanhas/campaign-table.tsx'));
/**
 * As agulhas sao as PROPS do cabecalho, e nao os rotulos soltos: assim a prova
 * mede tambem o ALINHAMENTO. No print todas as cinco colunas tem o titulo a
 * ESQUERDA, inclusive `DESCONTO`, `VALIDADE` e `STATUS`.
 */
const colunas = [
  '<TableHeaderCell>Campanha',
  '<TableHeaderCell>Tipo',
  '<TableHeaderCell>Desconto',
  '<TableHeaderCell>Validade',
  '<TableHeaderCell>Status',
];
const ordem = naOrdem(tabelaSrc, colunas);
if (ordem.ok) ok('as cinco colunas, na ordem do print', ordem.detalhe);
else fail('colunas da tabela', ordem.detalhe);

if (!/<TableHeaderCell align="(right|center)">(Campanha|Tipo|Desconto|Validade|Status)/.test(tabelaSrc))
  ok('e todas alinham o titulo a ESQUERDA', 'como no print — nenhuma coluna virou a direita');
else fail('alinhamento de coluna', 'alguma coluna do print ficou a direita ou centralizada');

// A sexta coluna e a das acoes, e ela NAO tem titulo visivel no print.
if (tabelaSrc.includes('sr-only') && tabelaSrc.includes('Ações'))
  ok('e ha a coluna de acoes, sem titulo visivel', 'o print nao mostra cabecalho para `Editar`');
else fail('coluna de acoes', 'a sexta coluna sumiu ou ganhou titulo');

/**
 * A ACAO E SO `Editar` — NAO HA `Excluir` EM CAMPANHA.
 *
 * O original so tem o link `Editar` na linha de campanha (o de cupom tem os
 * dois). Inventar um botao de apagar aqui seria acrescentar uma acao que a
 * referencia nao tem.
 */
if (tabelaSrc.includes('Editar') && !/>\s*Excluir\s*</.test(tabelaSrc))
  ok('e a unica acao e `Editar`', 'sem `Excluir` — o original nao tem apagar campanha');
else fail('acoes da linha', 'apareceu um `Excluir` que a referencia nao tem');

/**
 * O SELO DE STATUS NAO E BOTAO AQUI.
 *
 * Em Cupons o selo e um `<button onClick={toggle}>` — clicar alterna o status. Em
 * Campanhas o original usa um `<span>`. As duas telas divergem de proposito, e a
 * prova trava a diferenca para ninguem "uniformizar" as duas.
 */
if (!/onToggle|onClick=\{\(\) => onToggle/.test(tabelaSrc) && tabelaSrc.includes('<span'))
  ok('e o selo de status e um `<span>`, nao um botao', 'ao contrario de Cupons, onde ele alterna ao clique');
else fail('selo de status', 'virou botao — isso e do modulo Cupons, nao daqui');

/* ------------------------------------------- 4. as duas grafias divergentes */

console.log('\n4. `Ativa`/`Pausada` — e nao `Ativo`/`Inativo`');

if (metricas.campaignStatusLabel(true) === 'Ativa' && metricas.campaignStatusLabel(false) === 'Pausada')
  ok('o status diz `Ativa` e `Pausada`', 'concorda com "campanha", como o original');
else fail('rotulo de status', `${metricas.campaignStatusLabel(true)} / ${metricas.campaignStatusLabel(false)}`);

/**
 * ...E A GRAFIA DE CUPONS E OUTRA, DE PROPOSITO.
 *
 * E preciso RENDERIZAR a tabela de Cupons para medir isso: `Ativo` NAO mora em
 * `lib/cupons/metrics.ts`, e sim no JSX do `coupon-table.tsx`. Uma prova que
 * comparasse contra uma constante escrita aqui estaria medindo a constante, e nao
 * o codigo — passaria mesmo com as duas telas unificadas.
 *
 * Se alguem trocar `Ativa` por `Ativo` aqui, ou `Ativo` por `Ativa` la, uma das
 * duas provas cai. As duas grafias convivem no material e devem continuar
 * convivendo.
 */
const cupomAtivo = textos(render(CouponTable, {
  rows: [{
    id: 'cup-01', code: 'CLOSET10', name: 'Primeira compra', kind: 'percent', value: 10,
    minSubtotal: 0, usesCount: 0, maxUses: null, startsAt: null, expiresAt: null,
    isActive: true, description: '', createdAt: '2026-08-20T10:00:00',
  }],
  hasFilter: false,
  onEdit: () => {}, onDelete: () => {}, onToggle: () => {},
}));
if (cupomAtivo.includes('Ativo') && !cupomAtivo.includes('Ativa') && metricas.campaignStatusLabel(true) === 'Ativa')
  ok('e a tabela de Cupons continua dizendo `Ativo`', 'as duas grafias do material nao foram unificadas');
else fail('grafias unificadas', 'as duas telas passaram a usar a mesma palavra');

/* --------------------------------------------------- 5. tipo e desconto */

console.log('\n5. o tipo, o desconto e a validade');

// Os SEIS rotulos do seletor, na ordem do original.
const rotulosTipo = metricas.CAMPAIGN_TYPE_OPTIONS.map((o) => o.label);
if (mesmo(rotulosTipo, ['Desconto Automático', 'Frete Grátis', 'Promoção por Categoria', 'Primeira Compra', 'Clientes VIP', 'Aniversário']))
  ok('os SEIS tipos, na ordem do original', rotulosTipo.join(' · '));
else fail('opcoes de tipo', JSON.stringify(rotulosTipo));

// O padrao do seletor e o primeiro — o print mostra `Desconto Automático`.
if (metricas.CAMPAIGN_TYPE_OPTIONS[0].value === 'discount_automatic')
  ok('e o padrao e `Desconto Automático`', 'o que o print mostra selecionado');

if (mesmo(metricas.DISCOUNT_TYPE_OPTIONS.map((o) => o.label), ['Porcentagem (%)', 'Valor Fixo (R$)']))
  ok('e `Tipo de Valor` tem as duas opcoes do print', '`Porcentagem (%)` e `Valor Fixo (R$)`');
else fail('opcoes de tipo de valor', JSON.stringify(metricas.DISCOUNT_TYPE_OPTIONS));

// O rotulo do tipo, por valor.
if (metricas.campaignTypeLabel('free_shipping') === 'Frete Grátis')
  ok('e cada valor tem o rotulo em portugues', 'nao o `replace("_"," ")` do original');
else fail('rotulo de tipo', metricas.campaignTypeLabel('free_shipping'));

// O desconto nos dois modos.
if (metricas.formatCampaignDiscount({ discountType: 'percentage', discountValue: 10 }) === '10%')
  ok('desconto percentual sai `10%`', 'e nao `R$ 10,00`');
else fail('desconto percentual', metricas.formatCampaignDiscount({ discountType: 'percentage', discountValue: 10 }));

if (normalizar(metricas.formatCampaignDiscount({ discountType: 'fixed', discountValue: 20 })) === 'R$ 20,00')
  ok('e desconto fixo sai em reais', 'o outro ramo formata diferente');
else fail('desconto fixo', metricas.formatCampaignDiscount({ discountType: 'fixed', discountValue: 20 }));

// Um decimal NAO pode ser achatado: `12.5%` e um desconto valido.
if (metricas.formatCampaignDiscount({ discountType: 'percentage', discountValue: 12.5 }) === '12.5%')
  ok('e um percentual decimal sobrevive', '`String(Number())` formata, nao arredonda');
else fail('percentual decimal', metricas.formatCampaignDiscount({ discountType: 'percentage', discountValue: 12.5 }));

/**
 * A VALIDADE NULA DIZ `Indeterminado` — E NAO UM TRAVESSAO.
 *
 * O original imprime `Indeterminado` quando nao ha `expires_at`, e a diferenca
 * importa: `—` diz "nao sei", `Indeterminado` diz "esta campanha nao tem fim".
 * Um modulo copiando o outro por simetria escreveria `—`, e a prova pega.
 */
const semFim = metricas.formatCampaignValidity({ expiresAt: null }, () => 'x');
if (semFim === 'Indeterminado')
  ok('campanha sem validade diz `Indeterminado`', 'e NAO `—`, que e o que Cupons usa');
else fail('validade nula', semFim);

if (metricas.formatCampaignValidity({ expiresAt: '2026-08-20T00:00:00' }, () => '20/08/2026') === '20/08/2026')
  ok('e com validade ela delega a formatacao de data', 'o valor do print');
else fail('validade com data', 'nao delegou');

// Data invalida cai no mesmo rotulo, e nunca vira `Invalid Date`.
if (metricas.formatCampaignValidity({ expiresAt: 'nao e data' }, () => 'x') === 'Indeterminado')
  ok('e data corrompida cai no `Indeterminado`', 'nunca `Invalid Date` na coluna');
else fail('data invalida', 'vazou `Invalid Date`');

/* --------------------------------------------------- 6. o formulario */

console.log('\n6. o formulario — adm-016 e adm-017');

const HOJE = '2026-09-28';
const formRender = textosDeRotulo(
  render(CampaignForm, {
    draft: formulario.emptyDraft(HOJE),
    errors: {},
    editingName: null,
    saving: false,
    outcome: 'none',
    onChange: () => {},
    onCancel: () => {},
    onSubmit: () => {},
  }),
);

const rotulos = [
  'Nome da Campanha',
  'Tipo de Promoção',
  'Valor do Desconto',
  'Tipo de Valor',
  'Pedido Mínimo (R$)',
  'Texto do Selo (Badge)',
  'Data Início',
  'Data Expiração',
];
const faltando = rotulos.filter((r) => !formRender.includes(r));
if (faltando.length === 0) ok('os OITO rotulos do print renderizam', `${rotulos.length} campos`);
else fail('rotulos do formulario', `faltam: ${faltando.join(' · ')}`);

if (formRender.includes('Nova Campanha')) ok('o bloco se chama `Nova Campanha`', 'como no print');
else fail('titulo do formulario', 'nao apareceu');

if (formRender.includes('Cancelar') && formRender.includes('Salvar Campanha'))
  ok('e tem `Cancelar` em texto e `Salvar Campanha`', 'os dois do print');
else fail('botoes do formulario', 'faltou um dos dois');

/**
 * OS DOIS `placeholder` DO PRINT.
 *
 * `Ex: Black Friday 2026` no nome e `Ex: 20% OFF` no selo. Os outros seis campos
 * nao tem placeholder em print nenhum, e inventar um seria acrescentar texto que
 * a referencia nao mostra.
 *
 * ESTA PROVA MEDE O HTML CRU, E NAO `textosDeRotulo`. `placeholder` e ATRIBUTO, e
 * nao texto: `textosDeRotulo` tira as tags para limpar as `<option>`, e no mesmo
 * passo apaga o atributo. Medir o texto limpo aqui acusaria falta de um
 * `placeholder` que esta la — foi o que aconteceu na primeira rodada.
 */
const formCru = render(CampaignForm, {
  draft: formulario.emptyDraft(HOJE),
  errors: {},
  editingName: null,
  saving: false,
  outcome: 'none',
  onChange: () => {},
  onCancel: () => {},
  onSubmit: () => {},
});
if (formCru.includes('placeholder="Ex: Black Friday 2026"') && formCru.includes('placeholder="Ex: 20% OFF"'))
  ok('e os DOIS `placeholder` do print aparecem', 'no nome e no selo, medidos no HTML cru');
else fail('placeholders', 'faltou o do nome ou o do selo');

/**
 * ...E NAO HA UM TERCEIRO.
 *
 * Os outros seis campos nao tem placeholder em print nenhum. Contar e a unica
 * forma de pegar um placeholder inventado num campo que a referencia deixa mudo.
 */
const quantosPlaceholders = (formCru.match(/placeholder="/g) ?? []).length;
if (quantosPlaceholders === 2)
  ok('e sao exatamente DOIS campos com placeholder', 'um terceiro seria texto que nenhum print mostra');
else fail('placeholders inventados', `${quantosPlaceholders} campos com placeholder`);

/**
 * O ROTULO DO CAMPO DE VALOR **NAO** MUDA COM O TIPO AQUI.
 *
 * Em Cupons o rotulo alterna entre `Percentual (%)` e `Valor (R$)`. Aqui os dois
 * prints dizem `VALOR DO DESCONTO` com `Porcentagem (%)` em `TIPO DE VALOR`. A
 * prova confere que o rotulo e o mesmo nos dois modos — e que o texto que muda
 * esta no `TIPO DE VALOR`, nao no rotulo do valor.
 */
const comoFixo = textosDeRotulo(
  render(CampaignForm, {
    draft: { ...formulario.emptyDraft(HOJE), discountType: 'fixed' },
    errors: {},
    editingName: null,
    saving: false,
    outcome: 'none',
    onChange: () => {},
    onCancel: () => {},
    onSubmit: () => {},
  }),
);
if (comoFixo.includes('Valor do Desconto') && !comoFixo.includes('Valor (R$)'))
  ok('e o rotulo do valor NAO muda com o tipo', 'ao contrario de Cupons — os dois prints dizem `Valor do Desconto`');
else fail('rotulo condicional indevido', 'o rotulo mudou, e isso e de Cupons');

/**
 * OS PADROES DO PRINT: os dois seletores no primeiro item e a DATA INICIO no dia.
 * O resto abre VAZIO, inclusive o valor do desconto.
 */
const padroes = formulario.emptyDraft(HOJE);
if (padroes.type === 'discount_automatic' && padroes.discountType === 'percentage' && padroes.isActive === true)
  ok('e abre com `Desconto Automático` e `Porcentagem (%)`', 'os primeiros itens dos dois seletores');
else fail('padroes dos seletores', JSON.stringify({ type: padroes.type, discountType: padroes.discountType }));

if (padroes.startsAt === HOJE)
  ok('e a DATA INICIO abre com o DIA', 'o print mostra a data da captura nesse campo');
else fail('data de inicio padrao', padroes.startsAt);

if (padroes.name === '' && padroes.discountValue === '' && padroes.minOrderValue === '' && padroes.badgeText === '' && padroes.expiresAt === '')
  ok('e os cinco que o print deixa vazios seguem vazios', 'nome, valor, minimo, selo e expiracao');
else fail('campos que deviam estar vazios', JSON.stringify({ discountValue: padroes.discountValue }));

// Em modo edicao o titulo mostra o nome.
const editando = textosDeRotulo(
  render(CampaignForm, {
    draft: { ...formulario.emptyDraft(HOJE), name: 'Black Friday 2026' },
    errors: {},
    editingName: 'Black Friday 2026',
    saving: false,
    outcome: 'none',
    onChange: () => {},
    onCancel: () => {},
    onSubmit: () => {},
  }),
);
if (editando.includes('Editar Black Friday 2026')) ok('e em edicao o titulo vira `Editar <nome>`', 'como o original');
else fail('titulo de edicao', editando.slice(0, 80));

/* ------------------------------------- 7. o rascunho e a regra de validacao */

console.log('\n7. o rascunho, a validacao e as datas');

/**
 * O CAMPO VAZIO NAO VIRA `0`. Mesma armadilha de Cupons: o original faz
 * `discount_value: Number(e.target.value)`, e apagar o campo para redigitar escreve
 * `0` e a pessoa briga com o zero que apareceu sozinho. O rascunho em string
 * aceita o estado vazio.
 */
if (padroes.discountValue === '')
  ok('o valor do desconto abre VAZIO', 'e nao `0`, que e o defeito do input numerico');
else fail('campo de valor', `virou ${JSON.stringify(padroes.discountValue)}`);

// ...e ao salvar o vazio vira 0, que aqui e PERMITIDO — o original nao valida.
const salvoVazio = formulario.draftToCampaign({ ...padroes, name: 'X' }, {
  id: 'i', createdAt: 'c', description: '', bannerUrl: '', bannerUrlMobile: '', targetIds: [], rules: {},
});
if (salvoVazio.discountValue === 0 && !formulario.validateDraft({ ...padroes, name: 'X' }).discountValue)
  ok('e ao salvar ele vira 0, que a validacao ACEITA', 'o original nao exige valor de desconto');
else fail('desconto zero', 'foi recusado — o original nao recusa');

/**
 * A UNICA REGRA: o nome. Com a MENSAGEM do original, palavra por palavra.
 */
if (formulario.validateDraft({ ...padroes, name: '' }).name === 'Nome é obrigatório')
  ok('nome vazio e recusado, com a mensagem do original', '`Nome é obrigatório`');
else fail('validacao de nome', String(formulario.validateDraft({ ...padroes, name: '' }).name));

// Um nome de um espaco so tambem e recusado — o original gravaria sem nome visivel.
if (formulario.validateDraft({ ...padroes, name: '   ' }).name)
  ok('e um nome SO DE ESPACOS tambem e recusado', '`!draft.name` do original deixaria passar');
else fail('nome de espacos', 'passou como valido');

// E o que o original NAO valida continua nao sendo validado.
const soNome = formulario.validateDraft({ ...padroes, name: 'Promo' });
if (!formulario.hasErrors(soNome))
  ok('e uma campanha so com nome e VALIDA', 'valor, minimo, selo e datas sao opcionais, como no original');
else fail('obrigatoriedade inventada', JSON.stringify(soNome));

/**
 * AS DUAS DATAS TRATAM O FUSO.
 *
 * `new Date('2026-09-28')` sozinho e UTC e num fuso UTC-3 vira `27/09`. O dado
 * grava `T00:00:00` sem `Z`, e a prova compara as partes LOCAIS — comparar o ISO
 * daria verde nos dois casos.
 */
const ida = formulario.fromDateInput('2026-09-28');
const volta = new Date(ida);
if (volta.getFullYear() === 2026 && volta.getMonth() === 8 && volta.getDate() === 28)
  ok('`fromDateInput` guarda o dia LOCAL', '`28/09` no campo e `28/09` na tabela');
else fail('fuso da data', `${volta.getFullYear()}-${volta.getMonth() + 1}-${volta.getDate()}`);

if (formulario.toDateInput(ida) === '2026-09-28')
  ok('e `toDateInput` devolve o formato do input', 'ida e volta sem escorregar um dia');
else fail('ida e volta da data', formulario.toDateInput(ida));

/**
 * `toDateInput` NAO PODE USAR `toLocaleDateString`: devolveria `28/09/2026`, e o
 * `<input type="date">` descartaria em silencio, deixando o campo VAZIO na edicao.
 */
const brasileiro = new Date(ida).toLocaleDateString('pt-BR');
if (formulario.toDateInput(ida) !== brasileiro)
  ok('e NAO o formato brasileiro', `\`${brasileiro}\` faria o input descartar o valor em silencio`);
else fail('formato de data do input', 'o campo devolveria o formato que o input recusa');

if (formulario.fromDateInput('') === null && formulario.toDateInput(null) === '')
  ok('e a data ausente e representavel nos dois sentidos', 'vazio no campo, `null` no dado');
else fail('data ausente', 'nao tratou o vazio');

/**
 * IDA E VOLTA COMPLETA: rascunho -> campanha -> rascunho.
 *
 * O QUE ESTA PROVA PODE E NAO PODE AFIRMAR. Ela NAO compara o objeto de entrada
 * com o de saida: o `fromDateInput` normaliza a data para UTC
 * (`2026-09-28T00:00:00` local vira `...T03:00:00.000Z`), entao o texto ISO muda
 * sem nada estar errado — o INSTANTE e o mesmo. Foi assim que a primeira rodada
 * acusou uma falha que nao existia.
 *
 * O INVARIANTE DE VERDADE E O DIA. Se a data escorregasse um dia — o defeito do
 * `new Date('aaaa-mm-dd')` lido como UTC — o dia na volta seria outro. E o que a
 * prova trava, nos DOIS campos de data.
 */
const original = {
  id: 'cam-1', name: 'Black Friday', description: 'nota interna', type: 'vip', discountType: 'fixed',
  discountValue: 30, minOrderValue: 150, badgeText: '30 OFF', startsAt: '2026-09-28T00:00:00',
  expiresAt: '2026-10-05T00:00:00', isActive: false, bannerUrl: 'b.png', bannerUrlMobile: 'bm.png',
  targetIds: ['p1', 'p2'], rules: { a: 'b' }, createdAt: '2026-09-01T10:00:00',
};
const rascunho = formulario.draftFromCampaign(original);
const gravada = formulario.draftToCampaign(rascunho, {
  id: original.id, createdAt: original.createdAt, description: original.description,
  bannerUrl: original.bannerUrl, bannerUrlMobile: original.bannerUrlMobile,
  targetIds: original.targetIds, rules: original.rules,
});

/** O dia de uma data, JULGADO NO FUSO LOCAL — que e o que a pessoa ve no campo. */
function diaDe(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

if (diaDe(gravada.startsAt) === '2026-09-28' && diaDe(gravada.expiresAt) === '2026-10-05')
  ok('ida e volta: as duas DATAS sobrevivem com o mesmo dia', '28/09 e 05/10, sem escorregar');
else fail('idas e voltas das datas', `${diaDe(gravada.startsAt)} e ${diaDe(gravada.expiresAt)}`);

// Os campos que o formulario EDITA, esses sim, tem que voltar identicos.
const iguais = ['name', 'type', 'discountType', 'discountValue', 'minOrderValue', 'badgeText', 'isActive'];
const desviaram = iguais.filter((campo) => mesmo(gravada[campo], original[campo]) === false);
if (desviaram.length === 0)
  ok('e os sete campos do formulario voltam identicos', iguais.join(', '));
else fail('campos alterados na conversao', desviaram.join(', '));

if (gravada.bannerUrl === 'b.png' && gravada.targetIds.length === 2 && gravada.rules.a === 'b')
  ok('e os campos fora do formulario sobrevivem ao salvar', 'banners, alvos e regras nao sao zerados');
else fail('campos preservados', 'algo fora do formulario foi apagado');

// Zero significa "sem minimo" — o campo volta VAZIO, nao com `0`.
if (formulario.draftFromCampaign({ ...original, minOrderValue: 0, discountValue: 0 }).minOrderValue === '' &&
    formulario.draftFromCampaign({ ...original, minOrderValue: 0, discountValue: 0 }).discountValue === '')
  ok('e zero volta para o campo como VAZIO', 'e nao como `0`, que e o que o print nao mostra');
else fail('zero no rascunho', 'imprimiu `0`');

/* ------------------------------------------ 8. `SALVAR` nao finge gravar */

console.log('\n8. `SALVAR CAMPANHA` nao mente');

const criada = await dados.createCampaign(original);
const alterada = await dados.updateCampaign(original);
const removida = await dados.deleteCampaign('cam-1');
const gravaram = [criada.persisted, alterada.persisted, removida.persisted];
if (gravaram.every((p) => p === false))
  ok('as TRES escritas devolvem `persisted: false`', 'criar, atualizar e excluir');
else fail('alguma escrita fingiu gravar', JSON.stringify(gravaram));

if ([criada, alterada, removida].every((r) => typeof r.reason === 'string' && r.reason.length > 0))
  ok('e as tres devolvem o MOTIVO', 'a tela tem o que dizer ao usuario');
else fail('motivo da nao-gravacao', 'alguma escrita nao devolve motivo');

/**
 * O `persisted: true` NAO PODE EXISTIR NO MEIO DO CODIGO — e a assercao roda
 * sobre o texto LIMPO. O comentario do `data.ts` CITA `toast.success` ao explicar
 * por que a confirmacao do original nao foi reproduzida, e medir o texto cru
 * acusaria o proprio comentario.
 */
const dataLimpo = semComentarios(arquivo('lib/campanhas/data.ts'));
if (!/persisted:\s*true/.test(dataLimpo))
  ok('nao ha `persisted: true` no codigo', 'a gravacao falsa nao existe nem escondida');
else fail('gravacao fingida', 'o `data.ts` afirma ter gravado');

/**
 * A TELA NAO PODE AFIRMAR SUCESSO COMO O ORIGINAL FAZ (`toast.success("Campanha
 * criada")`). Reproduzir isso faria a campanha aparecer na lista e NAO existir no
 * banco — e a loja so descobriria quando o desconto nao aplicasse.
 */
const telaTexto = textos(
  `${semComentarios(arquivo('components/admin/campanhas/campanhas-view.tsx'))} ${semComentarios(
    arquivo('components/admin/campanhas/campaign-form.tsx'),
  )}`,
);
if (!/campanha criada|campanha atualizada|criada com sucesso/i.test(telaTexto))
  ok('e a tela NAO diz "campanha criada"', 'a confirmacao do original nao foi copiada');
else fail('mensagem de sucesso', 'a tela afirma ter gravado a campanha');

if (/n[ãa]o foi gravada|nesta sess[ãa]o/i.test(telaTexto))
  ok('e ela AVISA que a campanha nao foi gravada', 'o usuario nao fica enganado');
else fail('aviso de sessao', 'a tela nao diz que o dado nao persiste');

/* ------------------------- 9. A UNIAO COM CUPONS E UMA CHAMADA, NAO UMA COPIA */

console.log('\n9. a uniao com Cupons — o ponto central deste modulo');

const viewLimpo = semComentarios(arquivo('components/admin/campanhas/campanhas-view.tsx'));

/**
 * A TELA CHAMA `topUsedCoupons` DO MODULO DE CUPONS.
 *
 * O `CouponReport` do original fazia a propria query em `coupons`. Reproduzir
 * isso aqui criaria um SEGUNDO dono para o mesmo numero, e os dois divergiriam na
 * primeira mudanca. A prova exige o import da FUNCAO, e nao so do modulo.
 */
if (/topUsedCoupons/.test(viewLimpo) && /from '@\/lib\/cupons\/metrics'/.test(viewLimpo))
  ok('a tela chama `topUsedCoupons` de `lib/cupons/metrics`', 'o dado de cupons tem UM dono so');
else fail('uniao com Cupons', 'a tela nao chama `topUsedCoupons` do modulo de cupons');

if (/listCoupons/.test(viewLimpo) && /from '@\/lib\/cupons\/data'/.test(viewLimpo))
  ok('e le a lista pela camada de dados de Cupons', '`listCoupons`, e nao `demo` de cupons');
else fail('leitura de cupons', 'nao le por `lib/cupons/data`');

/**
 * ...E NAO REIMPLEMENTA A REGRA.
 *
 * Este e o defeito que a prova precisa pegar, e ele nao e hipotetico: a tentacao
 * de escrever `coupons.filter(c => c.usesCount > 0).slice(0,5)` aqui dentro e
 * grande, e o resultado seria uma SEGUNDA regra de "cupons mais usados" — que
 * ficaria diferente da primeira no primeiro ajuste. Por isso a tela nao pode
 * ordenar cupom nenhum por conta propria.
 */
if (!/usesCount\s*[<>-]/.test(viewLimpo) && !/\.sort\(/.test(viewLimpo))
  ok('e NAO reimplementa a regra de cupons na tela', 'nenhum filtro nem ordenacao de cupom aqui dentro');
else fail('regra de cupons duplicada', 'a tela tem logica propria de cupons');

/**
 * A UNIAO E REAL: os dois modulos ligados produzem a linha que o print adm-015
 * mostra — `CLOSET10` e `0 usos`. A prova cruza os DOIS modulos de verdade, e nao
 * uma constante repetida.
 */
const cupons = (await cuponsDados.listCoupons()).data;
const maisUsados = cuponsMetricas.topUsedCoupons(cupons);
const cardPreenchido = textos(render(CouponReport, { rows: maisUsados }));
if (cardPreenchido.includes('CLOSET10') && cardPreenchido.includes('0 usos'))
  ok('e o card mostra `CLOSET10 · 0 usos`', 'exatamente a linha de adm-015');
else fail('card de cupons preenchido', cardPreenchido.slice(0, 120));

/**
 * ...E O SINGULAR NAO FOI TRATADO, DE PROPOSITO.
 *
 * O original escreve `{item.uses_count} usos` sempre, sem regra de plural: um
 * cupom com um unico uso imprime `1 usos`. A string do print e `0 usos` e a regra
 * nao esta em referencia nenhuma, entao o comportamento ficou como o original —
 * e a prova trava isso para que ninguem "conserte" por conta propria e mude um
 * texto que ninguem pediu para mudar.
 */
const cardUmUso = textos(render(CouponReport, { rows: [{ code: 'UNICO', usesCount: 1 }] }));
if (cardUmUso.includes('1 usos'))
  ok('e um unico uso imprime `1 usos`', 'o original nao trata plural — divergencia conhecida, nao corrigida');
else fail('plural de usos', 'alguem acrescentou uma regra de plural que a referencia nao tem');

/**
 * ...E O CARD NAO FILTRA USO ZERO.
 *
 * Se a tela (ou a funcao) filtrasse `usesCount > 0`, o card viria VAZIO e a tela
 * de Campanhas nao reproduziria adm-015. A prova ja esta do lado de Cupons, e
 * aqui ela e repetida do lado do CONSUMIDOR — que e onde o defeito reapareceria.
 */
if (maisUsados.length === 1)
  ok('e o cupom de ZERO usos NAO e filtrado', 'senao o card viria vazio e adm-015 nao reproduziria');
else fail('filtro de uso zero', `a lista tem ${maisUsados.length} item(ns)`);

/* ------------------------------------------- 10. o card de desempenho */

console.log('\n10. `Campanhas com mais venda`');

const desempenho = [
  { name: 'Campanha A', sales: 3, revenue: 100 },
  { name: 'Campanha B', sales: 9, revenue: 900 },
  { name: 'Campanha C', sales: 1, revenue: 400 },
];
const ordenado = metricas.topCampaignsByRevenue(desempenho);
if (mesmo(ordenado.map((r) => r.name), ['Campanha B', 'Campanha C', 'Campanha A']))
  ok('o card ordena por RECEITA decrescente', 'e nao pelo numero de usos — e o `sort` do original');
else fail('ordem do card de desempenho', JSON.stringify(ordenado.map((r) => r.name)));

if (metricas.topCampaignsByRevenue(desempenho, 2).length === 2)
  ok('e o corte e um parametro', 'nenhum print tem card preenchido — o limite e declarado, nao escondido');
else fail('limite do card', 'nao respeitou o parametro');

// O card mostra a RECEITA, nao os usos — o `sales` acompanha o dado mas nao aparece.
const cardComDado = textos(render(CampaignReport, { rows: ordenado }));
if (cardComDado.includes('Campanha B') && cardComDado.includes('R$ 900,00') && !cardComDado.includes('9 vendas'))
  ok('e ele mostra a receita em reais', 'o `sales` acompanha o dado sem aparecer no print');
else fail('conteudo do card', cardComDado.slice(0, 120));

// Empate na receita e desempatado pelo nome, para a lista nao pular.
const empatadas = [
  { name: 'Zeta', sales: 1, revenue: 50 },
  { name: 'Alfa', sales: 1, revenue: 50 },
];
if (metricas.topCampaignsByRevenue(empatadas)[0].name === 'Alfa')
  ok('e empate de receita e desempatado pelo nome', 'a lista nao troca de ordem entre renderizacoes');
else fail('desempate do card', 'ordem instavel');

/**
 * `topCampaignsByRevenue` NAO PODE ORDENAR O ARRAY DO CHAMADOR. `sort` ordena no
 * lugar, e a lista que chega e o estado do React.
 */
const copiaAntes = JSON.stringify(desempenho);
metricas.topCampaignsByRevenue(desempenho);
if (JSON.stringify(desempenho) === copiaAntes)
  ok('e ela nao embaralha a lista de quem chamou', 'ordena numa copia');
else fail('mutacao da entrada', 'a lista do chamador foi reordenada');

/**
 * `sortCampaigns` NAO PODE SER IDENTIDADE NEM ORDENAR CRESCENTE.
 *
 * Com a lista vazia de demonstracao, o print nao prova a ordem — o que prova e o
 * `.order("created_at", { ascending: false })` do original. A bancada monta duas
 * campanhas e confere que a mais NOVA vem primeiro.
 */
const duas = [
  { ...original, id: 'velha', name: 'Velha', createdAt: '2026-01-01T00:00:00' },
  { ...original, id: 'nova', name: 'Nova', createdAt: '2026-09-01T00:00:00' },
];
if (metricas.sortCampaigns(duas)[0].id === 'nova')
  ok('e a lista de campanhas ordena da mais NOVA para a mais velha', 'o `created_at desc` do original');
else fail('ordem da lista', 'ordenou crescente ou nao ordenou');

const antesDaOrdenacao = JSON.stringify(duas);
metricas.sortCampaigns(duas);
if (JSON.stringify(duas) === antesDaOrdenacao)
  ok('e ela tambem nao embaralha a lista de quem chamou', 'ordena numa copia');
else fail('mutacao de `sortCampaigns`', 'a entrada foi reordenada');

/* ------------------------------------------------------------ 11. a rota */

console.log('\n11. a rota');

const rotaCrua = arquivo('app/admin/campanhas/page.tsx');
const rota = semComentarios(rotaCrua);

if (/export default function CampanhasPage/.test(rota)) ok('a rota existe', '/admin/campanhas');
else fail('a rota', 'nao exporta a pagina');

if (/from '@\/components\/admin\/campanhas\/campanhas-view'/.test(rota))
  ok('a pagina aponta para a tela', '`CampanhasView`');
else fail('a pagina', 'nao importa a tela');

if (!/ModulePage/.test(rota)) ok('a pagina NAO usa mais o placeholder', 'o `ModulePage` foi removido');
else fail('a pagina ainda e um placeholder', '`ModulePage` continua la');

/**
 * A REFERENCIA ERRADA — E A PROVA MAIS DELICADA DESTA BANCADA.
 *
 * O placeholder citava `adm-012`, que e a tela de CUPONS. A assercao roda sobre o
 * texto LIMPO justamente porque a `page.tsx` CITA `adm-012` no comentario que
 * registra o erro: medir o texto cru acusaria a propria documentacao.
 */
if (!/references\s*=\s*["']adm-012/.test(rota)) ok('a prop `references` sumiu', 'nao ha mais faixa de prints na prop');
else fail('a prop ainda cita a faixa', 'a referencia errada voltou');

if (/adm-006/.test(rotaCrua) && /adm-015/.test(rotaCrua) && /adm-016/.test(rotaCrua) && /adm-017/.test(rotaCrua))
  ok('e os QUATRO prints da tela estao registrados', 'adm-006, adm-015, adm-016 e adm-017');
else fail('os prints nao estao registrados', 'a correcao nao ficou documentada');

if (/adm-012/.test(rotaCrua))
  ok('e o erro da referencia antiga ficou DOCUMENTADO', 'o comentario registra que `adm-012` e de Cupons');
else fail('o erro nao esta registrado', 'a substituicao foi feita sem deixar rastro');

/* --------------------------------------------- 12. provas ao contrario */

console.log('\n12. as provas ao contrario');

let quebrado = 0;

// (a) `formatCampaignDiscount` NAO pode trocar os ramos.
if (metricas.formatCampaignDiscount({ discountType: 'fixed', discountValue: 10 }).includes('%')) { quebrado += 1; }

// (b) `campaignStatusLabel` NAO pode dizer `Ativo` — a grafia de Cupons.
if (metricas.campaignStatusLabel(true) === 'Ativo') { quebrado += 1; }

// (c) `formatCampaignValidity` NAO pode devolver travessao.
if (metricas.formatCampaignValidity({ expiresAt: null }, () => 'x') === '—') { quebrado += 1; }

// (d) `topCampaignsByRevenue` NAO pode ordenar por `sales` em vez de `revenue`.
if (metricas.topCampaignsByRevenue(desempenho)[0].name === 'Campanha B' &&
    metricas.topCampaignsByRevenue([{ name: 'X', sales: 99, revenue: 1 }, { name: 'Y', sales: 1, revenue: 99 }])[0].name !== 'Y') {
  quebrado += 1;
}

// (e) `naOrdem` NAO pode dar verde com o cabecalho embaralhado, nem com duas
//     agulhas caindo no mesmo trecho.
if (naOrdem('Tipo Campanha', ['Campanha', 'Tipo']).ok === false) { quebrado += 0; } else { quebrado += 1; }
if (naOrdem('X Status Y', ['Status', 'Status']).ok === false) { quebrado += 0; } else { quebrado += 1; }

// (f) `semComentarios` NAO pode comer codigo junto, senao as provas de texto limpo
//     passariam por vaculdade.
const limpo = semComentarios(tabelaSrc);
if (!limpo.includes('adm-') && limpo.includes('TableHeaderCell') && limpo.includes('formatCampaignDiscount')) {
  quebrado += 0;
} else { quebrado += 1; }

if (quebrado === 0) ok('as seis provas ao contrario falharam como deviam', 'o instrumento acusa defeito');
else fail('a bancada passaria em qualquer coisa', `${quebrado} de 6 provas ao contrario nao acusaram`);

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
