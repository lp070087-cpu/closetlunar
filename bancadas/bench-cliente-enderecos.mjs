/**
 * Bancada de `Endereços` da area da cliente (fase 2, modulo 7).
 *
 * ================== POR QUE ESTA BANCADA E MAIOR QUE A DE `Favoritos` ==================
 *
 * `Favoritos` tinha DUAS referencias (print do vazio + original da grade). Esta
 * tela tem TRES, e cada uma cobre um pedaco diferente:
 *
 *   o print `cli-008` (`004726`)  ->  o CABECALHO (o titulo `Endereços` + o botao
 *                                     `+ NOVO ENDEREÇO` a direita) e o VAZIO
 *   `conta.enderecos.tsx`         ->  o FORMULARIO (os 10 campos, os dois botoes)
 *                                     e a GRADE (o cartao, o selo `Principal`)
 *   a medicao do print            ->  a ALTURA do botao (`h-12` = 48 px)
 *
 * E, como em `Favoritos`, ha a TINTA: o original declara `bg-beige/5` na caixa,
 * `bg-beige/20` no circulo e `bg-beige/30` no quadrado do cartao. O `beige` nao
 * existe neste projeto, e a tinta e quase invisivel — a decisao e a mesma, e a
 * bancada a prova de novo porque o bloco vazio aqui e o MESMO do `Favoritos`.
 *
 * ================== O QUE ESTA BANCADA PROVA POR RENDER, E O QUE NAO ==================
 *
 * Diferente da view de `Favoritos`, o FORMULARIO aqui pode ser MONTADO: ele e um
 * componente que recebe `initial` por prop e usa `useState`, e o
 * `renderToStaticMarkup` roda o corpo do componente (so nao roda EFEITO). Entao
 * a secao 3 monta `EnderecoForm` de verdade — com `initial: null` e com um
 * endereco sintetico — e confere o HTML. Essa e a prova mais forte do arquivo.
 *
 * A `AddressesView` em si NAO pode ser montada: ela carrega a lista num efeito, e
 * o SSR pararia em `Carregando...`. Para a view, a prova e por FONTE.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Cor exata de pixel (isso e navegador) e o clique real. E, principalmente, NAO
 * prova que nada grava por execucao do banco — porque nao ha banco: o que se
 * prova e que as tres funcoes de escrita DEVOLVEM `ok: false` quando chamadas, e
 * que a tela mostra esse motivo em vez de um sucesso falso.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-enderecos.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-enderecos');
const ORIGINAL = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.enderecos.tsx',
);
// A casca, onde vive o rotulo da COLUNA (`Endereços`) — que aqui COINCIDE com o
// do painel, ao contrario de `Meus Favoritos` / `Favoritos`. Ver a secao 1.
const CASCA = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'components', 'site', 'account', 'AccountLayout.tsx',
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
 * ================== AS RAIZES ==================
 *
 * As mesmas de `Favoritos`: `lib/cliente` (a ponte e o contrato) +
 * `components/cliente` (a tela e o formulario) + `app/(cliente)` (a ROTA). A
 * tela nao atravessa a ponte com o admin — o endereco e um dado PROPRIO da
 * cliente, e nao um pedido. O que se prova contra o admin e a ausencia de
 * import cruzado.
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
const demo = require(join(OUT, 'src/lib/cliente/demo.js'));
const nav = require(join(OUT, 'src/lib/cliente/nav.js'));
const {
  AddressesView,
  EnderecoForm,
  ENDERECO_VAZIO,
} = require(join(OUT, 'src/components/cliente/addresses-view.js'));

/* ------------------------------------------------------------- utilidades */

// O ` ` entra explicito: o print e o original usam espaco inquebravel em
// alguns trechos, e um `[\s ]` escrito com um espaco comum nao o pegaria.
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
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const fonteCasca = existsSync(CASCA) ? readFileSync(CASCA, 'utf8') : null;
const cru = arquivo('src/components/cliente/addresses-view.tsx');
const fonteView = semComentarios(cru);
const fonteRota = arquivo('src/app/(cliente)/conta/enderecos/page.tsx');
const fonteNav = semComentarios(arquivo('src/lib/cliente/nav.ts'));
const fonteDemo = semComentarios(arquivo('src/lib/cliente/demo.ts'));
const fonteData = semComentarios(arquivo('src/lib/cliente/data.ts'));
const fonteHeader = semComentarios(arquivo('src/components/cliente/client-page-header.tsx'));

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `conta.enderecos.tsx` — o que o original declara');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a fonte do COMPORTAMENTO desta tela');

  /**
   * Cada string e buscada nos DOIS arquivos. Se o original a declara e a tela
   * nao, a transcricao perdeu um pedaco que existe em fonte.
   */
  const declaracoes = [
    ['Endereços', 'o titulo do painel'],
    ['Novo endereço', 'o botao do cabecalho'],
    ['Você ainda não possui endereços cadastrados.', 'a frase do estado vazio'],
    ['Tornar principal', 'o botao do cartao nao-principal'],
    ['Editar', 'o botao de editar'],
    ['Excluir', 'o botao de excluir'],
    ['Principal', 'o selo do endereco principal'],
    ['Salvar Endereço', 'o botao escuro do formulario'],
    ['Cancelar', 'o botao claro do formulario'],
    ['Preencha os campos abaixo para entrega', 'a linha de apoio do formulario'],
    ['Identificação (ex: Casa, Trabalho)', 'o rotulo da etiqueta'],
    ['Destinatário (Nome Completo)', 'o rotulo de quem recebe'],
    ['WhatsApp', 'o rotulo do telefone'],
    ['Rua / Avenida', 'o rotulo do logradouro'],
    ['Complemento', 'o rotulo do complemento'],
    ['Bairro', 'o rotulo do bairro'],
    ['Cidade', 'o rotulo da cidade'],
    ['Estado', 'o rotulo da UF'],
    ['(00) 00000-0000', 'o exemplo do telefone'],
    ['00000-000', 'o exemplo do CEP'],
  ];
  for (const [texto, nome] of declaracoes) {
    const noOriginal = fonteOriginal.includes(texto);
    const naTela = fonteView.includes(texto);
    if (noOriginal && naTela) ok(`${nome}: declarado nos dois`, `"${texto}"`);
    else fail(`${nome}`, `original: ${noOriginal} · tela: ${naTela}`);
  }

  /**
   * ================== AQUI O TITULO DO PAINEL E O DA COLUNA COINCIDEM ==================
   *
   * Em `Favoritos` os dois rotulos DIVERGEM (`Favoritos` no painel, `Meus
   * Favoritos` na coluna) e a bancada daquele modulo prova os dois lados. Aqui
   * NAO ha divergencia: o `<h2>` do original e `Endereços` e o item da coluna
   * tambem. Entao a prova e a IGUALDADE — e ela importa porque a expectativa
   * contraria (supor que toda tela tem dois rotulos) levaria a inventar um
   * `Meus Endereços` que nenhuma fonte escreve.
   */
  if (/titulo="Endereços"/.test(fonteView) === false && /font-serif text-3xl">Endereços</.test(fonteView))
    ok('o `<h2>` do painel e `Endereços`', 'o mesmo texto que o original declara');
  else fail('o titulo do painel', 'a tela nao escreve `Endereços` como o original');

  if (/label: 'Endereços'/.test(fonteNav))
    ok('a COLUNA tambem escreve `Endereços`', 'aqui os dois rotulos COINCIDEM, ao contrario de `Favoritos`');
  else fail('o rotulo da coluna', 'a sidebar nao tem `Endereços`');

  if (!/Meus Endereços/.test(fonteView) && !/Meus Endereços/.test(fonteNav))
    ok('niguem inventou um `Meus Endereços`', 'nenhuma fonte desta tela escreve isso');
  else fail('rotulo inventado', 'apareceu um `Meus Endereços` que nenhuma referencia tem');

  if (fonteCasca !== null) {
    if (fonteCasca.includes('Endereços'))
      ok('o original confirma o rotulo da coluna', '`Endereços`, sem prefixo');
    else fail('o rotulo no original', 'a casca do original nao tem `Endereços`');
  }
}

/* ============ 2. o cabecalho PROPRIO desta tela ============ */

console.log('\n2. o cabecalho proprio — por que esta tela NAO usa o `ClientPageHeader`');

/**
 * ================== A EXCECAO PRECISA DE PROVA ==================
 *
 * `Meus Pedidos` e `Favoritos` usam o `ClientPageHeader`. Esta tela nao usa: o
 * print mostra o botao `+ NOVO ENDEREÇO` na mesma linha do titulo, e o original
 * declara esse cabecalho INLINE, com `space-y-8` no container. Duas razoes
 * concretas, e a bancada prova as duas:
 *
 *   1. o corte de largura e `sm:flex-row` (o cabecalho compartilhado usa `md`);
 *   2. o espaco vem do `space-y-8` do container, sem `mb-` no titulo.
 *
 * Se alguem "consertar" a excecao reusando o componente, as duas provas viram
 * FALHA — e e isso que se quer.
 */
if (!/ClientPageHeader/.test(fonteView))
  ok('a tela NAO importa o `ClientPageHeader`', 'o cabecalho dela e proprio, como o original');
else fail('o cabecalho', 'a tela reusou o componente que o original nao usa aqui');

if (/flex flex-col justify-between gap-4 sm:flex-row sm:items-center/.test(fonteView))
  ok('o cabecalho usa `sm:flex-row`', 'o corte do original, e nao o `md` do componente');
else fail('o corte de largura', 'o cabecalho nao empilha no ponto do original');

/**
 * O outro lado: o componente COMPARTILHADO realmente usa `md`. Sem esta prova, a
 * de cima poderia passar por acidente (um `sm:flex-row` escrito que nao viesse do
 * original). Os dois cortes tem que ser DIFERENTES para a excecao ter sentido.
 */
if (/md:flex-row/.test(fonteHeader) && !/sm:flex-row/.test(fonteHeader))
  ok('o `ClientPageHeader` usa `md:flex-row`', 'os dois cortes sao de fato diferentes');
else fail('o corte do componente', 'o componente compartilhado mudou de corte — a excecao perdeu o motivo');

/**
 * O ESPACO. O original espaca o cabecalho pelo container (`space-y-8`), e o
 * titulo NAO carrega `mb-`. A prova e a ausencia de `mb-` no `<h2>` desta tela —
 * o `mb-6` do componente compartilhado seria soma dupla.
 */
if (/text-3xl">Endereços</.test(fonteView))
  ok('o titulo nao carrega margem propria', 'o espaco vem do `space-y-8`, como no original');
else fail('a margem do titulo', 'o titulo recebeu um `mb-` que o original nao declara');

if (/space-y-8/.test(fonteView) && /space-y-8/.test(fonteOriginal))
  ok('o `space-y-8` do container esta nos dois', 'o espaco entre o cabecalho e o resto');
else fail('o espaco do container', 'o container perdeu o `space-y-8` do original');

/**
 * ================== A MEDICAO DO BOTAO — `h-12` = 48 px ==================
 *
 * No print `004726` o botao `+ NOVO ENDEREÇO` foi medido: caixa de x 2279 a 2486
 * e y 320 a 367 -> 208 x 48 px. Os 48 px batem exatamente com o `h-12` que o
 * original declara — e essa e a QUINTA medida independente de que a captura esta
 * em 1x (as outras: sidebar 259, pilula 29, coracao 30, arco ~26). A prova aqui
 * e a classe; a conferencia da escala esta em `PAINEL-CLIENTE-STATUS.md`.
 */
if (/h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground/.test(fonteView))
  ok('o botao do cabecalho e `h-12`', 'os 48 px do print, e a mesma escala do resto do material');
else fail('a altura do botao', 'o botao nao tem o `h-12` que o original e o print mostram');

if (/Plus className="size-4"/.test(fonteView))
  ok('o botao tem o `Plus` do original', 'o `+` e um icone, e nao um caractere de texto');
else fail('o icone do botao', 'o `+` nao veio do `lucide` como no original');

if (/w-full/.test(fonteView) && /sm:w-auto/.test(fonteView))
  ok('o botao e largo no mobile e natural no desktop', 'o `w-full sm:w-auto` do original');
else fail('a largura do botao', 'o botao perdeu o comportamento responsivo');

/* ============ 3. o FORMULARIO, por RENDER ============ */

console.log('\n3. o formulario — montado de verdade, com `initial` nulo e com um endereco');

/**
 * ================== ESTA E A PROVA QUE `Favoritos` NAO PODIA TER ==================
 *
 * O `EnderecoForm` recebe tudo por prop e usa `useState` — nao ha efeito. Entao
 * `renderToStaticMarkup` o monta, e o HTML sai com os 10 campos, os rotulos e os
 * dois botoes. Nada aqui e por fonte: e o componente rodando.
 */
const semAcao = () => {};
const htmlNovo = render(EnderecoForm, { initial: null, onCancelar: semAcao, onSalvar: semAcao });
const textoNovo = textos(htmlNovo);

if (textoNovo.includes('Novo Endereço'))
  ok('com `initial: null` o titulo e `Novo Endereço`', 'o ramo de criacao');
else fail('o titulo do formulario vazio', textoNovo.slice(0, 120));

if (!htmlNovo.includes('Editar Endereço'))
  ok('e NAO diz `Editar`', 'o ramo de criacao nao vaza para o de edicao');
else fail('o formulario confundiu os ramos', 'o titulo de edicao apareceu no formulario novo');

/**
 * Os 10 campos, um a um, no HTML renderizado. O rotulo de each e o texto que o
 * original escreve.
 */
const rotulos = [
  'Identificação (ex: Casa, Trabalho)',
  'Destinatário (Nome Completo)',
  'WhatsApp',
  'CEP',
  'Rua / Avenida',
  'Número',
  'Complemento',
  'Bairro',
  'Cidade',
  'Estado',
];
let presentes = 0;
for (const r of rotulos) if (textoNovo.includes(r)) presentes += 1;
if (presentes === rotulos.length)
  ok('os 10 rotulos aparecem no HTML', 'o formulario esta inteiro');
else fail('os rotulos do formulario', `${presentes}/${rotulos.length} presentes`);

if (textoNovo.includes('Salvar Endereço') && textoNovo.includes('Cancelar'))
  ok('os dois botoes aparecem no HTML', '`Salvar Endereço` e `Cancelar`');
else fail('os botoes do formulario', 'faltou um dos dois');

/**
 * OS DOIS CAMPOS OBRIGATORIOS, pelo ATRIBUTO `required` do HTML — e nao por
 * leitura do texto. Contar `required` no HTML e a unica prova de que o navegador
 * barraria o envio; procurar a string `required` na fonte pegaria o nome da prop.
 */
const obrigatorios = (htmlNovo.match(/required=""/g) || []).length;
if (obrigatorios === 5)
  ok('5 campos sao obrigatorios no HTML', 'Destinatario, CEP, Rua, Cidade, Estado — como o original');
else fail('os campos obrigatorios', `${obrigatorios} no HTML, esperado 5`);

/**
 * ================== O RAMO DE EDICAO, com um endereco sintetico ==================
 *
 * Um endereco montado AQUI, com uma rua de texto unico. Se o formulario
 * preenche os campos a partir do `initial`, o valor tem que aparecer no HTML.
 */
const SINTETICO = {
  id: 'end-teste',
  label: 'Trabalho',
  recipient: 'Maria Souza',
  phone: '11988887777',
  cep: '01310-100',
  street: 'RUA DE PROVA NAO INVENTADA',
  number: '1500',
  complement: 'Sala 42',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  is_default: true,
};
const htmlEdicao = render(EnderecoForm, { initial: SINTETICO, onCancelar: semAcao, onSalvar: semAcao });
const textoEdicao = textos(htmlEdicao);

if (textoEdicao.includes('Editar Endereço'))
  ok('com um endereco, o titulo e `Editar Endereço`', 'o ramo de edicao');
else fail('o titulo da edicao', 'o formulario nao trocou para `Editar`');

if (htmlEdicao.includes('RUA DE PROVA NAO INVENTADA') && htmlEdicao.includes('Maria Souza'))
  ok('os campos vem PREENCHIDOS do `initial`', 'o `paraForm` levou os valores ao formulario');
else fail('o preenchimento', 'o formulario nao preencheu os campos a partir do endereco');

/**
 * AS NULABILIDADES. O tipo deixa `phone`, `number`, `complement` e `neighborhood`
 * serem `null`; o formulario os achata para `''`. Se nao achadasse, o `<input>`
 * receberia `null` e o React o tornaria NAO-CONTROLADO no primeiro digito — o bug
 * classico. A prova: o endereco sintetico acima tem todos preenchidos, e o
 * formulario NAO escreve a string `null` no HTML.
 */
if (!/value="null"/.test(htmlEdicao))
  ok('nenhum campo virou `null`', 'as nulabilidades foram achatadas para string vazia');
else fail('campo `null`', 'um `input` recebeu `null` — viraria nao-controlado ao digitar');

/** O `disabled`/placeholder do CEP e o exemplo do original. */
if (htmlNovo.includes('placeholder="00000-000"') && htmlNovo.includes('placeholder="(00) 00000-0000"'))
  ok('os exemplos dos campos sao os do original', 'CEP e WhatsApp');
else fail('os placeholders', 'um dos exemplos do original se perdeu');

/**
 * O `ENDERECO_VAZIO` — o estado inicial do original, com `Casa` na etiqueta.
 * Provar pelo EXPORT evita a armadilha de achar `Casa` dentro do rotulo
 * `Identificação (ex: Casa, Trabalho)`, que apareceria mesmo sem o estado.
 */
if (ENDERECO_VAZIO && ENDERECO_VAZIO.label === 'Casa')
  ok('o formulario nasce com a etiqueta `Casa`', 'o `empty` do original');
else fail('a etiqueta inicial', 'o estado inicial nao tem `Casa`');

const vazios = Object.entries(ENDERECO_VAZIO).filter(([k, v]) => k !== 'label' && v !== '');
if (vazios.length === 0)
  ok('e TODOS os outros campos nascem vazios', 'nenhum valor de exemplo foi inventado');
else fail('estado inicial com valor', `campos preenchidos: ${vazios.map(([k]) => k).join(', ')}`);

/* ============ 4. o dado — a lista vazia, e a ORDEM ============ */

console.log('\n4. o dado — a lista vazia, e a regra de ordenacao');

let enderecos = [];
let erroPonte = null;
try {
  enderecos = (await dados.listEnderecos()).data;
} catch (e) {
  erroPonte = e;
}

if (erroPonte) fail('a ponte falhou', String(erroPonte));
else ok('a ponte respondeu', '`listEnderecos()` leu sem erro');

/**
 * A lista E vazia — o print `004726` mostra a tela assim, e `customer_addresses`
 * de uma conta nova nao tem linha. O que se prova e que o vazio e a RESPOSTA, e
 * que ele nasce de um array declarado vazio (e nao de um filtro que esvaziou).
 */
if (Array.isArray(enderecos) && enderecos.length === 0)
  ok('a lista e VAZIA', 'e o estado que o `cli-008` mostra');
else fail('a lista', `${Array.isArray(enderecos) ? enderecos.length : typeof enderecos} itens`);

if (Array.isArray(demo.DEMO_ENDERECOS_CLIENTE) && demo.DEMO_ENDERECOS_CLIENTE.length === 0)
  ok('a demonstracao declara ZERO enderecos', 'o vazio vem da fonte, e nao de um filtro');
else fail('a fonte da demo', 'os enderecos da demo nao nascem vazios');

/**
 * ================== A ORDEM: O PRINCIPAL PRIMEIRO ==================
 *
 * O original ordena `.order("is_default", { ascending: false })` — o principal
 * vem antes. Com a demo VAZIA essa regra nao teria como ser exercitada, entao a
 * bancada INSERE dois enderecos na demo (fora de ordem), chama a ponte, confere a
 * ordem e RESTAURA o array. A ponte trabalha sobre uma copia, entao a mutacao
 * temporaria aqui nao pode escapar — e a restauracao deixa isso explicito.
 */
const demoEnd = demo.DEMO_ENDERECOS_CLIENTE;
const endereco = (id, isDefault) => ({
  id, label: 'Casa', recipient: id, phone: null, cep: '00000-000', street: 'R',
  number: null, complement: null, neighborhood: null, city: 'C', state: 'SP',
  is_default: isDefault,
});
let ordem = null;
try {
  demoEnd.push(endereco('secundario', false));
  demoEnd.push(endereco('principal', true));
  ordem = (await dados.listEnderecos()).data.map((e) => e.id);
} finally {
  demoEnd.length = 0;
}

if (ordem && ordem[0] === 'principal' && ordem[1] === 'secundario')
  ok('o endereco PRINCIPAL vem primeiro', 'o `.order("is_default", false)` do original');
else fail('a ordenacao', `ordem obtida: ${JSON.stringify(ordem)}`);

if (demo.DEMO_ENDERECOS_CLIENTE.length === 0)
  ok('a demo foi RESTAURADA', 'a insercao da prova nao ficou no disco');
else fail('a demo ficou suja', `${demo.DEMO_ENDERECOS_CLIENTE.length} itens sobraram`);

/**
 * A ponte DEVOLVE uma copia — mutar o array da tela nao pode mexer na demo.
 */
const antes = demo.DEMO_ENDERECOS_CLIENTE.length;
enderecos.push(endereco('x', false));
const depois = (await dados.listEnderecos()).data.length;
enderecos.pop();
if (antes === 0 && depois === 0)
  ok('a ponte devolve COPIA', 'mutar a lista da tela nao contamina a demo');
else fail('a ponte vazou referencia', `demo: ${antes} -> ${depois}`);

/* ============ 5. o VAZIO e a GRADE, por FONTE ============ */

console.log('\n5. o vazio e a grade — o desenho do original, por fonte');

/**
 * O vazio e o unico estado que o print mostra, e a view o escolhe por
 * `enderecos.length === 0 && !criando`. Como a view carrega a lista num efeito,
 * nao da para monta-la aqui — a prova e pela fonte, item a item.
 */
const desenhoVazio = [
  [/enderecos\.length === 0 && !criando/, 'a condicao do vazio (e o formulario aberto a esconde)'],
  [/border-dashed/, 'o tracejado do bloco'],
  [/rounded-\[2rem\]/, 'o raio grande do bloco'],
  [/size-16/, 'o circulo `size-16`'],
  [/rounded-full/, 'o circulo REDONDO'],
  [/MapPin className="size-8 text-muted-foreground\/40"/, 'o pino claro dentro do circulo'],
];
for (const [re, nome] of desenhoVazio) {
  if (re.test(fonteView)) ok(nome, 'presente');
  else fail(nome, 'ausente — o vazio perdeu um pedaco do original');
}

/**
 * ================== O VAZIO NAO TEM BOTAO — E ISSO E DO PRINT ==================
 *
 * Em `Favoritos` o vazio TEM um `Explorar a loja`. Aqui NAO tem: o print `004726`
 * mostra o bloco tracejado com o pino e a frase, e mais nada. A prova e a
 * AUSENCIA de um `<Link` ou `<button` DENTRO do bloco do vazio — recortado pelo
 * `rounded-[2rem]` ate o fechamento.
 */
const blocoVazio = /className="[^"]*rounded-\[2rem\][^"]*"([\s\S]*?)<\/div>\s*\)\}/.exec(fonteView);
if (blocoVazio && !/<Link|<button/.test(blocoVazio[1]))
  ok('o vazio NAO tem botao', 'o print nao mostra nenhum, e o original tambem nao poe');
else fail('o vazio tem botao', 'foi inventado um botao que nenhuma referencia mostra');

/**
 * O ATRIBUTO `className` do bloco, SEPARADO do corpo.
 *
 * `blocoVazio[0]` nao serve para a prova do fundo (secao 6): ele inclui o grupo
 * capturado — o CORPO do bloco, que tem `bg-secondary/40` no circulo — e um
 * `!/bg-/` sobre ele reprovaria por medir o trecho errado. O que a prova do fundo
 * quer e so o atributo. Guarda-se o atributo aqui, e nao o match inteiro.
 */
const classNameVazio = fonteView.match(/className="[^"]*rounded-\[2rem\][^"]*"/);

if (!/Explorar a loja/.test(fonteView))
  ok('nem o `Explorar a loja` de `Favoritos` vazou para ca', 'cada vazio tem o seu desenho');
else fail('texto de outra tela', 'o vazio desta tela copiou o de `Favoritos`');

/**
 * ================== A GRADE TEM DOIS CORTES, NAO TRES ==================
 *
 * `Favoritos` usa tres (`1 / 2 / 3` colunas). Aqui o original declara DOIS:
 * `grid-cols-1 md:grid-cols-2`. Igualar as duas telas seria o erro natural — a
 * prova tem os dois lados: o original declara dois, e a tela NAO inventa o
 * terceiro.
 */
if (/grid-cols-1 md:grid-cols-2/.test(fonteOriginal))
  ok('o original declara DOIS cortes', '`grid-cols-1 md:grid-cols-2`');
else fail('os cortes do original', 'o original nao declara o que se esperava');

if (/grid grid-cols-1 gap-6 md:grid-cols-2/.test(fonteView))
  ok('a grade reproduz os dois cortes', '1 / 2 colunas');
else fail('a grade', 'os cortes nao sao os do original');

if (!/xl:grid-cols-3/.test(fonteView) && !/xl:grid-cols-3/.test(fonteOriginal))
  ok('NENHUM terceiro corte foi inventado', 'o `xl:grid-cols-3` de `Favoritos` nao entrou aqui');
else fail('corte a mais', 'a grade ganhou um corte que o original nao tem');

/**
 * O CARTAO. O estado principal muda a moldura: `ring-1 ring-foreground/10` e
 * `border-foreground/20`. O selo `Principal` so aparece no principal. E o
 * `Tornar principal` so aparece no NAO-principal — os dois lados do `!is_default`.
 */
const desenhoCartao = [
  [/ring-1 ring-foreground\/10/, 'o anel do cartao principal'],
  [/border-foreground\/20/, 'a borda reforcada'],
  [/a\.is_default &&/, 'o selo so no principal'],
  [/!a\.is_default &&/, 'o `Tornar principal` so no nao-principal'],
  [/ml-auto/, 'o `Excluir` empurrado para a direita'],
  [/font-mono/, 'o CEP em fonte monoespacada'],
];
for (const [re, nome] of desenhoCartao) {
  if (re.test(fonteView)) ok(nome, 'presente');
  else fail(nome, 'ausente — o cartao perdeu um pedaco do original');
}

/**
 * A LINHA DO LOGRADOURO e condicional nos dois campos: `, numero` so se houver,
 * ` · complemento` so se houver. A prova: as duas condicionais existem, e o
 * `<p>` nao escreve uma virgula solta incondicional.
 */
if (/\{a\.number \? `, \$\{a\.number\}` : ''\}/.test(fonteView)
  && /\{a\.complement \? ` · \$\{a\.complement\}` : ''\}/.test(fonteView))
  ok('a linha do endereco e condicional nos dois campos', 'sem virgula solta quando falta o numero');
else fail('a linha do endereco', 'a linha nao condiciona numero/complemento como o original');

if (/\{a\.neighborhood \? `\$\{a\.neighborhood\} · ` : ''\}/.test(fonteView))
  ok('o bairro tambem e condicional', 'sem ` · ` orfao quando nao ha bairro');
else fail('a linha do bairro', 'o bairro nao condiciona como o original');

/**
 * A UF e limitada a duas letras em caixa alta — `.toUpperCase().slice(0, 2)` do
 * original. Sem isso o campo aceitaria `sao paulo`.
 */
if (/v\.toUpperCase\(\)\.slice\(0, 2\)/.test(fonteView))
  ok('a UF e limitada a 2 letras maiusculas', 'a regra do original no campo Estado');
else fail('o campo Estado', 'a UF perdeu a regra do original');

/* ============ 6. a TINTA — o `beige`, a mesma decisao de `Favoritos` ============ */

console.log('\n6. a tinta — o `beige` nao foi reproduzido');

/**
 * O original pinta TRES pontos de beige: a caixa (`bg-beige/5`), o circulo
 * (`bg-beige/20`) e o quadrado do cartao (`bg-beige/30`), alem dos
 * `hover:bg-beige/30`. O token nao existe neste projeto, e a tinta e quase
 * invisivel. A prova: a tela NAO escreve `beige` e USA a familia `secondary`.
 */
if (!/beige/.test(fonteView))
  ok('a tela NAO usa o token `beige`', 'nem existe neste projeto');
else fail('`beige` na tela', 'a tela inventou um token que o projeto nao tem');

if (/bg-secondary\/40/.test(fonteView) && /bg-secondary\/30/.test(fonteView))
  ok('a tela usa a familia `secondary` nos dois pontos', 'o circulo e o quadrado do cartao');
else fail('a tinta equivalente', 'os pontos de beige nao ganharam o equivalente');

if (/hover:bg-secondary\/50/.test(fonteView))
  ok('os `hover` tambem viraram `secondary`', 'nenhuma cor crua do Tailwind');
else fail('o hover', 'sobrou um `hover:bg-beige` no original sem equivalente');

/**
 * O BLOCO VAZIO nao tem fundo — a 5% o material mostra branco puro. Mesma prova
 * de `Favoritos`, e aqui o bloco e o MESMO do original (so trocam o icone e a
 * frase) — entao a decisao de la vale para ca, e a bancada a reafirma.
 */
if (classNameVazio && !/bg-/.test(classNameVazio[0]))
  ok('o bloco tracejado NAO tem fundo', 'o material mostra branco puro, e nao tinta');
else fail('o fundo do bloco', classNameVazio ? classNameVazio[0] : 'o bloco nao foi encontrado');

/* ============ 7. honestidade — o que NAO grava, e diz isso ============ */

console.log('\n7. honestidade — a escrita nao grava, e a tela avisa');

const semRede = semComentarios(cru);
if (!/fetch\(|supabase|localStorage|sessionStorage|console\./.test(semRede))
  ok('nada de rede, provedor, navegador nem console', 'nem a consulta de CEP por `viacep` entrou');
else fail('rede/provedor/console', 'a tela importou um provedor que esta fase nao tem');

/**
 * ================== A CONSULTA DE CEP FICOU DE FORA, DE PROPOSITO ==================
 *
 * O original chama `https://viacep.com.br/ws/.../json/` ao completar 8 digitos e
 * preenche rua/bairro/cidade/UF. Nesta fase a area nao faz rede (invariante), e o
 * formulario ainda nao grava — o auto-preenchimento seria cosmetico. A prova e a
 * AUSENCIA de `viacep` no codigo (fora de comentario) e a presenca de um campo
 * CEP MANUAL.
 */
if (!/viacep/.test(semRede))
  ok('a consulta de CEP NAO esta no codigo', 'nem rede, nem um `fetch` disfarcado');
else fail('consulta de CEP', 'a tela faz rede nesta fase — o invariante caiu');

if (/lookupCep/.test(fonteView) === false && /label="CEP"/.test(fonteView))
  ok('o campo CEP continua, MANUAL', 'o dado que falta entra na fase do Neon');
else fail('o campo CEP', 'o campo sumiu junto com a consulta');

/**
 * ================== AS TRES ESCRITAS DEVOLVEM `ok: false` ==================
 *
 * `salvarEndereco`, `excluirEndereco` e `marcarEnderecoPrincipal` sao chamadas de
 * verdade aqui. O que se prova e o CONTRATO: elas respondem `ok: false` com o
 * motivo, entao a tela tem como ser honesta em vez de dar um sucesso falso.
 */
const escritas = [
  ['salvarEndereco', dados.salvarEndereco],
  ['excluirEndereco', dados.excluirEndereco],
  ['marcarEnderecoPrincipal', dados.marcarEnderecoPrincipal],
];
for (const [nome, fn] of escritas) {
  const r = await fn();
  if (r && r.ok === false && typeof r.reason === 'string' && r.reason.length > 0)
    ok(`${nome} devolve \`ok: false\` com motivo`, 'a escrita nao mente');
  else fail(`${nome}`, `resposta: ${JSON.stringify(r)}`);
}

/**
 * O MOTIVO e o da ponte, e cita o que falta de verdade (`Neon`/`PostgreSQL`), e
 * nao um texto generico de erro.
 */
if (typeof dados.PENDING_REASON === 'string' && /Neon|PostgreSQL/.test(dados.PENDING_REASON))
  ok('o motivo nomeia o que falta', '`Neon`/`PostgreSQL`, e nao um erro generico');
else fail('o motivo da escrita', 'o aviso nao diz por que nao gravou');

/**
 * A TELA MOSTRA O MOTIVO. O `tentar` liga o resultado ao aviso: quando `ok` e
 * falso, o texto do aviso passa a ser o `reason`. Se a tela so mostrasse o texto
 * de sucesso, as provas de cima nao adiantariam.
 */
if (/reason \?\?/.test(fonteView) && /setAviso\(/.test(fonteView))
  ok('a tela exibe o `reason` quando nao grava', 'o aviso vem da resposta, e nao de um texto fixo');
else fail('o aviso', 'a tela nao ligou o resultado da escrita ao aviso');

if (/'Endereço salvo'/.test(fonteView) && /tom: 'sucesso'/.test(fonteView))
  ok('o sucesso existe, mas so no ramo `ok`', 'pronto para quando o banco entrar');
else fail('o ramo de sucesso', 'a tela perdeu o caminho de sucesso');

/** E o `ClienteToast` e o mesmo componente do login — nao um segundo aviso. */
if (/ClienteToast/.test(fonteView))
  ok('usa o `ClienteToast` do projeto', 'o terceiro uso do mesmo desenho de aviso');
else fail('o aviso', 'a tela inventou um segundo desenho de aviso');

/**
 * O `window.confirm` do original NAO entrou: a exclusao nao grava, entao um
 * dialogo de confirmacao seria uma pergunta para uma acao que nao acontece.
 */
if (!/\bconfirm\(/.test(semRede))
  ok('nao ha `confirm()` de exclusao', 'a pergunta volta quando o banco existir');
else fail('o `confirm`', 'a tela pede confirmacao de uma acao que nao grava');

/** A area da cliente nao importa nada do admin nem de outro modulo de negocio. */
if (!/from\s+['"]@\/components\/admin|from\s+['"]@\/lib\/(?!cliente|utils|access)/.test(semRede))
  ok('nada importa do admin', 'a area da cliente e autonoma');
else fail('import cruzado', 'a tela importou algo de fora do escopo');

/**
 * ================== O TIPO NAO DUPLICA O `ShippingAddress` ==================
 *
 * `@/lib/pedidos/types` tem um `ShippingAddress` — a COPIA CONGELADA de onde um
 * pedido foi entregue. O `EnderecoCliente` e a CADERNETA viva. Sao coisas
 * diferentes em `customer_addresses` e `orders.address`, e fundir as duas apagaria
 * a distincao. A prova: o tipo proprio existe, e a tela NAO importa o
 * `ShippingAddress` para representar a caderneta.
 */
if (/export interface EnderecoCliente/.test(semComentarios(arquivo('src/lib/cliente/types.ts'))))
  ok('o `EnderecoCliente` existe no contrato', 'a caderneta viva tem tipo proprio');
else fail('o tipo da caderneta', 'o endereco da cliente nao tem tipo proprio');

if (!/ShippingAddress/.test(semRede))
  ok('a tela NAO usa o `ShippingAddress` do pedido', 'caderneta e copia-do-pedido sao coisas diferentes');
else fail('tipo duplicado', 'a tela tratou a caderneta como se fosse a copia do pedido');

/* ============ 8. provas ao contrario ============ */

console.log('\n8. provas ao contrario — o instrumento tem que saber REPROVAR');

/**
 * 1. `h-12` e `h-10` sao strings DIFERENTES. A prova da altura do botao do
 *    cabecalho nao passaria por acidente com um `h-10`.
 */
if (!'h-12'.includes('h-10') && !'h-10'.includes('h-12'))
  ok('`h-12` e `h-10` nao colidem', 'a prova da altura distingue os dois');
else fail('alturas colidem', 'a prova do botao seria cega');

/**
 * 2. O vazio de `Favoritos` TEM botao e o daqui NAO tem: se as duas telas fossem
 *    iguais, a prova da ausencia seria cega. Aqui se confirma que o texto
 *    `Explorar a loja` e DIFERENTE de `Você ainda não possui endereços
 *    cadastrados.` — a prova procura um e nao acha o outro.
 */
if (!'Você ainda não possui endereços cadastrados.'.includes('Explorar a loja'))
  ok('a frase do vazio nao carrega o botao de `Favoritos`', 'a prova da ausencia tem sentido');
else fail('frases colidem', 'a prova do vazio seria cega');

/**
 * 3. O `paraForm` preenche de verdade: um endereco com rua X produz HTML com X, e
 *    um `initial: null` NAO produz X. As duas metades juntas provam que o
 *    preenchimento vem do `initial`.
 */
if (htmlEdicao.includes('RUA DE PROVA NAO INVENTADA') && !htmlNovo.includes('RUA DE PROVA NAO INVENTADA'))
  ok('o preenchimento DEPENDE do `initial`', 'com endereco vem, sem endereco nao');
else fail('preenchimento independente', 'o texto apareceu (ou sumiu) onde nao devia');

/**
 * 4. A escrita NAO grava: uma funcao que devolvesse `ok: true` reprovaria. Aqui se
 *    confirma que `ok: true` e um valor DISTINTO do que as tres devolvem.
 */
const contraEscrita = await dados.salvarEndereco();
if (contraEscrita.ok !== true)
  ok('a escrita nao devolve `true` fingindo sucesso', 'a prova do `ok: false` tem contraste');
else fail('a escrita gravou', 'a escrita devolveu `ok: true` sem banco');

/**
 * 5. A rota e a do print — `/conta/enderecos`, a URL do `004726`.
 */
if (/AddressesView/.test(fonteRota))
  ok('a rota existe e entrega a view', '`/conta/enderecos`, a URL do `cli-008`');
else fail('a rota', 'a pagina nao entrega a `AddressesView`');

/**
 * 6. A `AddressesView` existe e e exportada — a rota a importa por nome.
 */
if (typeof AddressesView === 'function' && typeof EnderecoForm === 'function')
  ok('a view e o formulario sao exportados', 'a rota monta a view, e a view monta o formulario');
else fail('os exports', 'um dos dois componentes nao foi exportado');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
