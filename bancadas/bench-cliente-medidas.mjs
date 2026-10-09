/**
 * Bancada de `Minhas Medidas` da area da cliente (fase 2, modulo 8).
 *
 * ================== O QUE ESTA BANCADA PROVA POR RENDER, E O QUE NAO ==================
 *
 * Como em `Endereços`, ha dois tipos de prova:
 *
 *   POR RENDER  ->  `BotaoSimNao` e `CelulaValor` sao componentes sem efeito (so
 *                   `useState`/props), entao `renderToStaticMarkup` os monta de
 *                   verdade e o HTML sai para ser conferido.
 *   POR FONTE   ->  a `MeasuresView` carrega perfil e historico num efeito, e o
 *                   SSR pararia em `Carregando...`; o resto da tela se prova lendo
 *                   o arquivo.
 *
 * ================== A PROVA MAIS FORTE: `CelulaValor` E O `null` ==================
 *
 * O perfil dos prints tem busto, cintura e quadril VAZIOS (`null`). A tentacao
 * natural e escrever `{valor} cm` e deixar sair `null cm` ou `0 cm`. A secao 4
 * MONTA `CelulaValor` com `null` e com um numero e compara: o `null` tem que virar
 * vazio (`—`), e nunca `null`/`0`/`undefined`. E a diferenca entre "medida que
 * ninguem tirou" e "medida zero".
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Cor exata de pixel (navegador) e o clique real. E NAO prova que nada grava por
 * execucao do banco — nao ha banco: prova que `salvarPerfilMedidas` DEVOLVE
 * `ok: false`, e que a tela mostra esse motivo em vez de um `Medidas salvas` falso.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-medidas.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-medidas');
const ORIGINAL = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.medidas.tsx',
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

/** As mesmas raizes das bancadas de `Favoritos` e `Endereços`. */
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
const metrics = require(join(OUT, 'src/lib/cliente/metrics.js'));
const {
  FIELDS,
  TAMANHOS,
  BotaoSimNao,
  CelulaValor,
} = require(join(OUT, 'src/components/cliente/measures-view.js'));

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
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const cru = arquivo('src/components/cliente/measures-view.tsx');
const fonteView = semComentarios(cru);
const fonteRota = arquivo('src/app/(cliente)/conta/medidas/page.tsx');
/**
 * O `data.ts` e lido nas DUAS formas, e a diferenca importa: a secao 9 procura
 * uma NOTA (o aviso de transacao dupla), e nota mora em COMENTARIO. Procurar em
 * `semComentarios(...)` daria falso negativo — foi o segundo defeito de
 * instrumento desta bancada na primeira rodada.
 */
const fonteDataCru = arquivo('src/lib/cliente/data.ts');
const fonteData = semComentarios(fonteDataCru);
const fonteTipos = semComentarios(arquivo('src/lib/cliente/types.ts'));
const fonteHeader = semComentarios(arquivo('src/components/cliente/client-page-header.tsx'));

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `conta.medidas.tsx` — o que o original declara');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a fonte do COMPORTAMENTO desta tela');

  const declaracoes = [
    ['Minhas Medidas', 'o titulo do painel'],
    ['Mantenha seu perfil atualizado para recomendações precisas no', 'a descricao'],
    ['Provador Virtual', 'o trecho destacado da descricao'],
    ['Ver no Avatar 3D', 'o botao do cabecalho'],
    ['Tamanho de costume', 'o rotulo do primeiro select'],
    ['Preferência de caimento', 'o rotulo do segundo select'],
    ['Selecione —', 'a opcao vazia do tamanho'],
    ['Mais justo ao corpo', 'a opcao `justo`'],
    ['Caimento padrão (Normal)', 'a opcao `normal` — a do print'],
    ['Mais folgado/confortável', 'a opcao `folgado`'],
    ['Você pratica atividade física?', 'a primeira pergunta sim/nao'],
    ['Há quanto tempo?', 'o campo condicional'],
    ['Ex: 6 meses, 2 anos', 'o exemplo do campo condicional'],
    ['Sabe informar suas medidas?', 'a segunda pergunta sim/nao'],
    ['(busto, cintura, quadril)', 'a linha de apoio da segunda pergunta'],
    ['Última recomendação', 'o rotulo do cartao escuro'],
    ['Aguardando dados', 'o ramo sem tamanho do cartao escuro'],
    ['Complete seu perfil', 'o ramo sem data do cartao escuro'],
    ['Vantagens VIP', 'o rotulo do cartao claro'],
    ['Sua Closet, Seu Tamanho', 'o titulo do cartao claro'],
    ['Histórico de Medidas', 'o titulo da secao do historico'],
    ['Nenhum registro anterior encontrado.', 'a frase do historico vazio'],
    ['Altura, peso e idade são obrigatórios.', 'a mensagem de validacao'],
  ];
  for (const [texto, nome] of declaracoes) {
    const noOriginal = fonteOriginal.includes(texto);
    const naTela = fonteView.includes(texto);
    if (noOriginal && naTela) ok(`${nome}: declarado nos dois`, `"${texto}"`);
    else fail(`${nome}`, `original: ${noOriginal} · tela: ${naTela}`);
  }

  /**
   * AS SEIS MEDIDAS. O original declara `FIELDS` com `key`/`label`/`unit`. A tela
   * tem que declarar as MESMAS seis, na MESMA ordem — a ordem e o que o print
   * mostra (Altura, Peso, Idade na primeira linha; Busto, Cintura, Quadril na
   * segunda), e trocar a ordem poria a Idade no lugar do Peso.
   */
  const esperado = [
    ['height', 'Altura', 'cm'], ['weight', 'Peso', 'kg'], ['age', 'Idade', 'anos'],
    ['bust', 'Busto', 'cm'], ['waist', 'Cintura', 'cm'], ['hip', 'Quadril', 'cm'],
  ];
  const iguais = esperado.every(([k, l, u], i) =>
    FIELDS[i] && FIELDS[i].key === k && FIELDS[i].label === l && FIELDS[i].unit === u);
  if (FIELDS.length === 6 && iguais)
    ok('as 6 medidas batem com o original', 'mesma chave, rotulo, unidade e ORDEM');
  else fail('as 6 medidas', `obtido: ${JSON.stringify(FIELDS)}`);

  /** A ordem importa: o print poe Altura/Peso/Idade na primeira linha. */
  if (FIELDS[0].key === 'height' && FIELDS[1].key === 'weight' && FIELDS[2].key === 'age')
    ok('a ORDEM e a do print', 'Altura, Peso, Idade (a primeira linha do `004742`)');
  else fail('a ordem das medidas', 'a ordem mudou em relacao ao print/original');

  /** A lista de tamanhos de costume, na ordem do original. */
  if (JSON.stringify(TAMANHOS) === JSON.stringify(['PP', 'P', 'M', 'G', 'GG', 'XG']))
    ok('os 6 tamanhos sao os do original', 'PP, P, M, G, GG, XG — na ordem');
  else fail('os tamanhos', JSON.stringify(TAMANHOS));

  /**
   * ================== O BOTAO DE SALVAR — CAPS NO ORIGINAL, NATURAL AQUI ==================
   *
   * O original escreve o texto JA EM CAIXA ALTA literal (`SALVAR PERFIL DE
   * MEDIDAS`). O projeto escreve em caixa natural e deixa o `uppercase` da classe
   * subir — e a MESMA convencao do `Salvar Endereço` de `addresses-view`, que a
   * bancada daquele modulo ja provou. Comparar o literal daria falso negativo (foi
   * o que aconteceu na primeira rodada desta bancada); a prova tem que ser o TEXTO
   * MAIUSCULIZADO nos dois lados, que e o que o olho ve.
   */
  const caps = (s) => s.toUpperCase();
  const botaoOriginal = /SALVAR PERFIL DE MEDIDAS/.test(caps(fonteOriginal));
  const botaoTela = /SALVAR PERFIL DE MEDIDAS/.test(caps(fonteView));
  if (botaoOriginal && botaoTela)
    ok('o botao de salvar existe nos dois (comparado em CAIXA ALTA)', 'o original escreve em caps; a tela usa `uppercase`');
  else fail('o botao de salvar', `original: ${botaoOriginal} · tela: ${botaoTela}`);

  if (/uppercase/.test(fonteView))
    ok('a tela usa `uppercase` no botao', 'a convencao do projeto no lugar do caps literal do original');
  else fail('o `uppercase` do botao', 'sem ele o botao sairia minusculo, diferente do print');
}

/* ============ 2. o cabecalho PROPRIO desta tela ============ */

console.log('\n2. o cabecalho proprio — por que esta tela NAO usa o `ClientPageHeader`');

/**
 * A MESMA situacao de `Endereços`, e a bancada a prova de novo: o cabecalho vive
 * dentro do `space-y-8` do container, e o titulo NAO carrega margem. Reusar o
 * `ClientPageHeader` (que tem `mb-6`) somaria dois espacos.
 */
if (!/ClientPageHeader/.test(fonteView))
  ok('a tela NAO importa o `ClientPageHeader`', 'o cabecalho dela e proprio, como o original');
else fail('o cabecalho', 'a tela reusou o componente que o original nao usa aqui');

if (/flex flex-col justify-between gap-4 md:flex-row md:items-center/.test(fonteView))
  ok('o cabecalho corta em `md:flex-row`', 'o mesmo corte do original (`md`, e nao `sm`)');
else fail('o corte de largura', 'o cabecalho nao empilha no ponto do original');

if (/md:flex-row/.test(fonteHeader))
  ok('o `ClientPageHeader` tambem usa `md`', 'confirma que o reuso seria diferente');
else fail('o corte do componente', 'o componente compartilhado mudou de corte');

if (/text-3xl">Minhas Medidas</.test(fonteView))
  ok('o titulo nao carrega margem propria', 'o espaco vem do `space-y-8`, como no original');
else fail('a margem do titulo', 'o titulo recebeu um `mb-` que o original nao declara');

if (/space-y-8/.test(fonteView) && /space-y-8/.test(fonteOriginal))
  ok('o `space-y-8` do container esta nos dois', 'o espaco entre o cabecalho e o resto');
else fail('o espaco do container', 'o container perdeu o `space-y-8` do original');

/**
 * ================== A DESCRICAO TEM UM TRECHO COM ESTILO PROPRIO ==================
 *
 * `Provador Virtual` vai numa `<span>` com `text-foreground font-medium`. E o
 * motivo pelo qual a descricao NAO pode ser uma prop de texto puro do
 * `ClientPageHeader`. A prova: existe a `<span>`, e ela tem as duas classes.
 */
if (/<span className="font-medium text-foreground">Provador Virtual<\/span>/.test(fonteView))
  ok('a descricao destaca `Provador Virtual` numa `<span>`', 'o trecho com estilo proprio que o print mostra');
else fail('o destaque da descricao', 'a descricao perdeu o `<span>` do original');

/**
 * ================== O BOTAO `VER NO AVATAR 3D` E ALVO, E NAO FLUXO ==================
 *
 * O original liga o botao a `openFitting()`. Aqui NAO ha `onClick`: a acao depende
 * do Provador, que e do SITE e nao existe nesta fase. A prova e a AUSENCIA de
 * `openFitting`/`useFittingRoom` e a presenca do desenho (`h-12`, `rounded-full`,
 * `bg-foreground`) e do `Sparkles`.
 */
if (/Ver no Avatar 3D/.test(fonteView) && /Sparkles className="size-4"/.test(fonteView))
  ok('o botao `VER NO AVATAR 3D` esta desenhado', 'com o `Sparkles` do original');
else fail('o botao do cabecalho', 'o botao perdeu o texto ou o icone do original');

if (/h-12 items-center justify-center gap-2 rounded-full bg-foreground/.test(fonteView))
  ok('o botao e um pill `h-12 rounded-full bg-foreground`', 'a forma do original');
else fail('a forma do botao', 'o botao nao tem a forma do original');

if (!/openFitting|useFittingRoom|FittingRoomContext/.test(fonteView))
  ok('o botao NAO chama `openFitting()`', 'a acao do Provador e do SITE, e nao desta fase');
else fail('o botao chama o Provador', 'a tela importou o contexto de um modulo que nao existe aqui');

/* ============ 3. o formulario — os campos, por FONTE ============ */

console.log('\n3. o formulario — os dois selects, os dois sim/nao, o condicional e o botao');

const desenhoForm = [
  [/grid grid-cols-2 gap-6 sm:grid-cols-3/, 'a grade de 6 campos (2 no mobile, 3 no desktop)'],
  [/type="number"/, 'o campo e numerico'],
  [/step="0\.1"/, 'o passo decimal do original'],
  [/Tamanho de costume/, 'o primeiro select'],
  [/Preferência de caimento/, 'o segundo select'],
  [/SALVAR PERFIL DE MEDIDAS|Salvar Perfil de Medidas/i, 'o botao de salvar'],
];
for (const [re, nome] of desenhoForm) {
  if (re.test(fonteView)) ok(nome, 'presente');
  else fail(nome, 'ausente');
}

/** O campo `Há quanto tempo?` so existe quando `practicesActivity === true`. */
if (/\{praticaAtividade === true && \(/.test(fonteView))
  ok('o campo condicional depende de `praticaAtividade === true`', 'a condicao do original');
else fail('o campo condicional', 'o `Há quanto tempo?` nao e condicional');

/** E ao escolher `Não`, o tempo e limpo — a regra do original (`if (!o.v) setActivityTime("")`). */
if (/setPraticaAtividade\(false\)[\s\S]{0,80}setTempoAtividade\(''\)/.test(fonteView))
  ok('escolher `Não` limpa o tempo', 'o `if (!o.v) setActivityTime("")` do original');
else fail('a limpeza do tempo', 'a tela nao limpa o tempo ao marcar `Não`');

/** O `optional` (busto, cintura, quadril) e um `<span>` proprio, como no original. */
if (/\(busto, cintura, quadril\)/.test(fonteView) && /normal-case/.test(fonteView))
  ok('o `(busto, cintura, quadril)` e um `<span>` de estilo diferente', 'nao um texto colado');
else fail('a linha de apoio', 'a segunda pergunta perdeu o sub-texto');

/* ============ 4. as CELULAS do historico, por RENDER — a prova do `null` ============ */

console.log('\n4. as celulas do historico — montadas de verdade, com numero e com `null`');

/**
 * ================== ESTA E A PROVA PRINCIPAL ==================
 *
 * `CelulaValor` nao tem efeito: `renderToStaticMarkup` a monta. O numero sai
 * `59 kg` e o `null` sai VAZIO. Se a tela escrevesse `{valor} cm` cru, o `null`
 * viraria `null cm` ou `0 cm` — e a bancada reprova.
 */
const htmlNumero = render(CelulaValor, { valor: 59, unidade: 'kg' });
const textoNumero = textos(htmlNumero);
if (/59/.test(textoNumero) && /kg/.test(textoNumero) && htmlNumero.includes('font-serif'))
  ok('um numero sai `59 kg` em serifada', 'com a unidade em caixa alta ao lado');
else fail('a celula com numero', textoNumero.slice(0, 100));

const htmlNulo = render(CelulaValor, { valor: null, unidade: 'cm' });
const textoNulo = textos(htmlNulo);
if (!/null|undefined|NaN/.test(htmlNulo) && !/\b0\b/.test(textoNulo))
  ok('o `null` NAO vira `null`/`0`/`undefined`', 'a celula marca ausencia, e nao uma medida falsa');
else fail('a celula com `null`', `html: ${htmlNulo.slice(0, 120)}`);

/**
 * AS DUAS METADES JUNTAS. `59` aparece com numero e NAO aparece com `null` — e
 * `cm` (a unidade) tambem some com `null` (nao faz sentido medir o nada).
 */
if (/59/.test(textoNumero) && !/59/.test(textoNulo))
  ok('o numero DEPENDE do valor', 'com `59` vem, com `null` nao');
else fail('independencia do valor', 'o `59` apareceu (ou sumiu) onde nao devia');

if (/kg/.test(textoNumero) && !/cm/.test(textoNulo))
  ok('a unidade some junto com o `null`', 'nao ha `— cm`');
else fail('a unidade no vazio', 'a unidade ficou ao lado de uma celula vazia');

/* ============ 5. os dois botoes sim/nao, por RENDER ============ */

console.log('\n5. o botao sim/nao — o estado aceso muda a classe, nao o texto');

const htmlAceso = render(BotaoSimNao, { ativo: true, onClick: () => {}, children: 'Sim' });
const htmlApagado = render(BotaoSimNao, { ativo: false, onClick: () => {}, children: 'Sim' });

/**
 * O texto e o MESMO (`Sim`) nos dois estados — o que muda e a classe. A prova:
 * os dois HTML contem `Sim`, e as classes sao diferentes (`bg-foreground` no
 * aceso, `bg-secondary` no apagado).
 */
if (textos(htmlAceso).includes('Sim') && textos(htmlApagado).includes('Sim'))
  ok('os dois estados escrevem `Sim`', 'o texto nao muda com o estado');
else fail('o texto do botao', 'o rotulo sumiu em um dos estados');

if (htmlAceso.includes('bg-foreground') && !htmlAceso.includes('bg-secondary'))
  ok('o estado ACESO usa `bg-foreground`', 'a pilula escura');
else fail('o estado aceso', 'o aceso nao tem o fundo escuro');

if (htmlApagado.includes('bg-secondary') && !htmlApagado.includes('bg-foreground'))
  ok('o estado APAGADO usa `bg-secondary`', 'a pilula clara');
else fail('o estado apagado', 'o apagado nao tem o fundo claro');

/**
 * A FORMA e a mesma nos dois: `h-12 flex-1 rounded-xl`. Se um estado tivesse
 * altura diferente, o par dancaria ao alternar.
 */
if (/h-12/.test(htmlAceso) && /h-12/.test(htmlApagado) && /flex-1/.test(htmlAceso) && /flex-1/.test(htmlApagado))
  ok('a FORMA nao muda com o estado', '`h-12 flex-1` nos dois');
else fail('a forma do botao', 'a forma muda com o estado');

/* ============ 6. o dado — o perfil do print, e a nulabilidade ============ */

console.log('\n6. o dado — o perfil dos prints, o `null` dos tres vazios, e o historico vazio');

const perfil = demo.DEMO_PERFIL_MEDIDAS;

if (perfil.height === 165 && perfil.weight === 59 && perfil.age === 28)
  ok('o perfil tem 165 / 59 / 28', 'os numeros do print `004742`');
else fail('os numeros do perfil', JSON.stringify(perfil));

/**
 * ================== OS TRES VAZIOS SAO `null` DE PROPOSITO ==================
 *
 * O print mostra busto, cintura e quadril em BRANCO. A demonstracao os deixa
 * `null`, e NAO inventa um numero plausivel. A prova: os tres sao `null`.
 */
if (perfil.bust === null && perfil.waist === null && perfil.hip === null)
  ok('busto, cintura e quadril sao `null`', 'o print mostra os tres VAZIOS');
else fail('os tres vazios', 'a demonstracao preencheu um campo que o print deixa em branco');

if (perfil.usual_size === null)
  ok('`usual_size` e `null`', 'o `Selecione —` do print');
else fail('o tamanho de costume', 'a demo inventou um tamanho que o print nao mostra');

if (perfil.updated_at === '2026-08-07T00:00:00')
  ok('o `updated_at` e o do print', '`ATUALIZADO EM 07/08/2026`');
else fail('a data do perfil', String(perfil.updated_at));

/** O historico nasce VAZIO — o print `004753` mostra `Nenhum registro anterior encontrado.`. */
if (Array.isArray(demo.DEMO_HISTORICO_MEDIDAS) && demo.DEMO_HISTORICO_MEDIDAS.length === 0)
  ok('o historico nasce VAZIO', 'o estado que o `cli-011` mostra');
else fail('o historico', 'a demo inventou uma pesagem');

/**
 * ================== A PONTE: le o perfil, le o historico, e a ORDEM ==================
 */
const leituraPerfil = await dados.getPerfilMedidas();
if (leituraPerfil.data && leituraPerfil.data.height === 165)
  ok('`getPerfilMedidas()` devolve o perfil', 'a ponte leu sem erro');
else fail('a ponte do perfil', JSON.stringify(leituraPerfil));

const leituraHist = await dados.listHistoricoMedidas();
if (Array.isArray(leituraHist.data) && leituraHist.data.length === 0)
  ok('`listHistoricoMedidas()` devolve a lista vazia', 'a ponte leu sem erro');
else fail('a ponte do historico', JSON.stringify(leituraHist));

/**
 * A ORDEM do historico: mais recente primeiro. A demo nasce vazia, entao a
 * bancada INSERE dois registros fora de ordem, chama a ponte, confere e RESTAURA.
 */
const demoHist = demo.DEMO_HISTORICO_MEDIDAS;
const registro = (id, created_at) => ({ id, created_at, weight: 59, bust: null, waist: null, hip: null });
let ordem = null;
try {
  demoHist.push(registro('antigo', '2026-01-01T00:00:00'));
  demoHist.push(registro('novo', '2026-08-07T00:00:00'));
  ordem = (await dados.listHistoricoMedidas()).data.map((r) => r.id);
} finally {
  demoHist.length = 0;
}

if (ordem && ordem[0] === 'novo' && ordem[1] === 'antigo')
  ok('o historico vem mais RECENTE primeiro', 'o `.order("created_at", { ascending: false })` do original');
else fail('a ordenacao do historico', `ordem obtida: ${JSON.stringify(ordem)}`);

if (demo.DEMO_HISTORICO_MEDIDAS.length === 0)
  ok('a demo foi RESTAURADA', 'a insercao da prova nao ficou no disco');
else fail('a demo ficou suja', `${demo.DEMO_HISTORICO_MEDIDAS.length} itens sobraram`);

/* ============ 7. a TINTA — o `beige`, e o amber ============ */

console.log('\n7. a tinta — o `beige` nao foi reproduzido');

/**
 * O original pinta QUATRO pontos de beige: os campos e os selects (`bg-beige/10`),
 * o bloco vazio (`bg-beige/5`), o `thead` (`bg-beige/20`) e a linha (`hover:bg-beige/10`).
 * O token nao existe neste projeto. A prova: a tela NAO escreve `beige` e usa a
 * familia `secondary`.
 */
if (!/beige/.test(fonteView))
  ok('a tela NAO usa o token `beige`', 'nem existe neste projeto');
else fail('`beige` na tela', 'a tela inventou um token que o projeto nao tem');

if (/bg-secondary\/30/.test(fonteView))
  ok('os campos usam `bg-secondary/30`', 'o `bg-beige/10` convertido');
else fail('a tinta dos campos', 'os campos nao ganharam o equivalente');

if (/bg-secondary\/40/.test(fonteView))
  ok('o `thead` usa `bg-secondary/40`', 'o `bg-beige/20` convertido');
else fail('a tinta do thead', 'o cabecalho da tabela nao ganhou o equivalente');

/**
 * O BLOCO VAZIO nao tem fundo — a 5% o material mostra branco puro. Mesma prova
 * de `Favoritos`/`Endereços`.
 */
const classNameVazio = fonteView.match(/className="[^"]*rounded-\[2rem\][^"]*border-dashed[^"]*"|className="border border-dashed[^"]*"/);
if (classNameVazio && !/bg-/.test(classNameVazio[0]))
  ok('o bloco tracejado NAO tem fundo', 'o material mostra branco puro');
else if (classNameVazio) fail('o fundo do bloco', classNameVazio[0]);
else fail('o bloco vazio', 'nao foi encontrado');

/**
 * ================== A ESTRELINHA E `amber-600`, E NAO `amber-500` ==================
 *
 * Decisao registrada no topo da view: o amber do projeto foi MEDIDO no KPI do
 * Dashboard como `amber-600`. A tela usa o medido, e NAO o `amber-500` do
 * original — para a area ter UM amber e nao dois tons do mesmo papel.
 */
if (/text-amber-600/.test(fonteView) && !/text-amber-500/.test(fonteView))
  ok('a estrelinha usa `amber-600`, o amber medido da area', 'e NAO o `amber-500` do original');
else fail('o amber da estrelinha', 'a area ficou com dois ambers diferentes');

/* ============ 8. honestidade — o que NAO grava, e diz isso ============ */

console.log('\n8. honestidade — a escrita nao grava, e a tela avisa');

if (!/fetch\(|supabase|localStorage|sessionStorage|console\./.test(fonteView))
  ok('nada de rede, provedor, navegador nem console', 'a tela nao faz rede nesta fase');
else fail('rede/provedor/console', 'a tela importou um provedor que esta fase nao tem');

/**
 * A validacao do original: altura, peso e idade sao obrigatorios. A prova: a
 * condicao existe, e a MESMA mensagem do original.
 */
if (/!form\.height \|\| !form\.weight \|\| !form\.age/.test(fonteView))
  ok('a validacao confere os tres obrigatorios', 'a condicao do original');
else fail('a validacao', 'a tela nao confere altura/peso/idade');

/** A escrita devolve `ok: false` com motivo. */
const escrita = await dados.salvarPerfilMedidas();
if (escrita && escrita.ok === false && typeof escrita.reason === 'string' && escrita.reason.length > 0)
  ok('`salvarPerfilMedidas()` devolve `ok: false` com motivo', 'a escrita nao mente');
else fail('a escrita', JSON.stringify(escrita));

if (typeof dados.PENDING_REASON === 'string' && /Neon|PostgreSQL/.test(dados.PENDING_REASON))
  ok('o motivo nomeia o que falta', '`Neon`/`PostgreSQL`, e nao um erro generico');
else fail('o motivo da escrita', 'o aviso nao diz por que nao gravou');

/** A tela exibe o motivo, e tem o ramo de sucesso pronto. */
if (/reason \?\?/.test(fonteView) && /setAviso\(/.test(fonteView))
  ok('a tela exibe o `reason` quando nao grava', 'o aviso vem da resposta');
else fail('o aviso', 'a tela nao ligou o resultado da escrita ao aviso');

if (/'Medidas salvas'/.test(fonteView) && /tom: 'sucesso'/.test(fonteView))
  ok('o sucesso existe, mas so no ramo `ok`', 'pronto para quando o banco entrar');
else fail('o ramo de sucesso', 'a tela perdeu o caminho de sucesso');

if (/ClienteToast/.test(fonteView))
  ok('usa o `ClienteToast` do projeto', 'o mesmo desenho de aviso de login/enderecos');
else fail('o aviso', 'a tela inventou um segundo desenho de aviso');

/** Nada do admin nem de outro modulo de negocio. */
if (!/from\s+['"]@\/components\/admin|from\s+['"]@\/lib\/(?!cliente|utils|access)/.test(fonteView))
  ok('nada importa do admin', 'a area da cliente e autonoma');
else fail('import cruzado', 'a tela importou algo de fora do escopo');

/* ============ 9. o contrato do tipo ============ */

console.log('\n9. o contrato — `PerfilMedidas` e `MedidaHistorico`');

if (/export interface PerfilMedidas/.test(fonteTipos))
  ok('o `PerfilMedidas` existe no contrato', 'a tabela `customer_size_profiles` tem tipo proprio');
else fail('o tipo do perfil', 'nao ha `PerfilMedidas`');

if (/export interface MedidaHistorico/.test(fonteTipos))
  ok('o `MedidaHistorico` existe no contrato', 'a tabela `customer_measurement_history` tem tipo proprio');
else fail('o tipo do historico', 'nao ha `MedidaHistorico`');

/**
 * ================== OS NOMES SAO OS DA COLUNA, EM INGLES ==================
 *
 * `height`, `usual_size`, `practices_activity` — os nomes das colunas de
 * `customer_size_profiles`. Mante-los torna o mapeamento para o Neon 1:1.
 */
if (/height: number \| null/.test(fonteTipos) && /usual_size: string \| null/.test(fonteTipos))
  ok('os campos usam os nomes da COLUNA', '`height`, `usual_size`, `practices_activity`');
else fail('os nomes dos campos', 'o tipo nao segue as colunas da origem');

/**
 * ================== A NOTA DE TRANSACAO ==================
 *
 * O `save()` do original faz DUAS escritas (upsert no perfil + insert no
 * historico). `data.ts` anota que as duas tem que caber na MESMA transacao — a
 * nota e o que impede a Fase 4 de esquecer. A prova: ela esta la, no arquivo CRU
 * (a nota e um COMENTARIO; `fonteData` ja o teria removido).
 */
if (/transa[çc][ãa]o|transaction/i.test(fonteDataCru) && /upsert/i.test(fonteDataCru))
  ok('`data.ts` anota a transacao dupla', 'perfil + historico na mesma transacao quando o Neon entrar');
else fail('a nota de transacao', '`data.ts` nao anota o efeito duplo da escrita');

/* ============ 10. provas ao contrario ============ */

console.log('\n10. provas ao contrario — o instrumento tem que saber REPROVAR');

/** 1. `amber-500` e `amber-600` sao strings diferentes. */
if (!'text-amber-600'.includes('text-amber-500'))
  ok('`amber-600` e `amber-500` nao colidem', 'a prova do tom distingue os dois');
else fail('ambers colidem', 'a prova do tom seria cega');

/** 2. `numOpen` (59) e a celula vazia produzem HTML DIFERENTE. */
if (htmlNumero !== htmlNulo)
  ok('a celula com numero e a vazia sao diferentes', 'a prova do `null` tem contraste');
else fail('celulas iguais', 'a prova do `null` seria cega');

/** 3. `ativo: true` e `ativo: false` produzem classe diferente. */
if (htmlAceso !== htmlApagado)
  ok('o estado aceso e o apagado sao diferentes', 'a prova do sim/nao tem contraste');
else fail('estados iguais', 'a prova do sim/nao seria cega');

/** 4. A escrita NAO devolve `true` fingindo sucesso. */
if (escrita.ok !== true)
  ok('a escrita nao devolve `true` fingindo sucesso', 'a prova do `ok: false` tem contraste');
else fail('a escrita gravou', 'a escrita devolveu `ok: true` sem banco');

/** 5. A rota existe e entrega a view. */
if (/MeasuresView/.test(fonteRota))
  ok('a rota existe e entrega a view', '`/conta/medidas`, a URL do `cli-010`');
else fail('a rota', 'a pagina nao entrega a `MeasuresView`');

/** 6. A funcao de data e pura: `null` -> `null`, uma data -> `DD/MM/AAAA`. */
if (metrics.dataCurta(null) === null && metrics.dataCurta('2026-08-07T00:00:00') === '07/08/2026')
  ok('`dataCurta` formata sem fuso', '`2026-08-07T00:00:00` -> `07/08/2026`, e `null` -> `null`');
else fail('a formatacao de data', `${metrics.dataCurta(null)} / ${metrics.dataCurta('2026-08-07T00:00:00')}`);

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
