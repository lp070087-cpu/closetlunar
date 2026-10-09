/**
 * Bancada do grupo `Conteudo` — Hero Banner, Categorias, Secoes da Home, Banners
 * Promocionais, Beneficios, Instagram, Rodape, Personalizar Loja e Looks.
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o `next/font/google`
 * espera as fontes para sempre). Sem esta bancada, a unica garantia seria o typecheck
 * — que nao ordena uma lista, nao casa acento, nao conta ocorrencias e nao ve um ramo
 * invertido.
 *
 * ================== O QUE ESTA BANCADA PROVA DE DIFERENTE ==================
 *
 * 1. O MAPEAMENTO, e nao so a tela. O defeito que abriu esta rodada foi o `references`
 *    das telas: `conteudo-do-site` dizia `adm-063 a adm-070`, `personalizar-loja` dizia
 *    `adm-071` e `looks` dizia `adm-061` sem o `adm-062`. A bancada confere a tabela
 *    `CONTEUDO_TABS` contra os numeros lidos na PILULA ACESA de cada captura — e prova
 *    que o mapa DESLOCADO (o do defeito) falharia.
 *
 * 2. A AUSENCIA de uma caixa. `SiteCategoryRow` desenha miniatura SO quando ha imagem.
 *    Provar isso nao e um `includes`: e o PAR — `Conta` (sem foto) nao pode ter `<img>`
 *    e `Tops` (com foto) tem que ter exatamente um. Um `includes('img')` passaria com a
 *    caixa quebrada que o `?? null` existe para evitar.
 *
 * 3. O TITULO DE adm-053 NAO ESTA DUPLICADO. `ConteudoTabs` desenhava um
 *    `SectionHeader title="Conteúdo do Site"` acima das pilulas — um segundo titulo,
 *    repetindo o da casca. A bancada conta as ocorrencias no HTML da faixa e prova que
 *    nao ha titulo ali (a versao antiga falharia).
 *
 * 4. O `Salvar` do Instagram e do Rodape fica no FIM do formulario, e nao no cabecalho.
 *    A posicao e lida: o botao tem que aparecer DEPOIS do ultimo campo.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Nada de layout, cor, posicao em pixel ou responsividade — isso e navegador. As
 * capturas sao 1x e o ClearType esta ligado; medir cor dentro de um glifo por pixel
 * isolado mente (ver `feedback_clear_type_envenena_pixel`).
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-conteudo.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-conteudo');

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
 * Raizes da COMPILACAO: so o modulo novo, mais o que ele reusa. O compilador segue os
 * `import` sozinho, entao `lib/categorias`, `lib/produtos`, `components/ui/*` e
 * `lib/utils` entram por conta propria. Compilar o `src` inteiro estoura o limite de
 * ~178 s do `bash` (ver `feedback_bancada_tempo_limite`).
 *
 * `app/admin/conteudo-do-site`, `personalizar-loja`, `looks` e `banners` entram porque
 * a secao 14 le os arquivos de pagina.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/](conteudo|categorias|produtos)|components[\\/]admin[\\/](conteudo|categorias)|app[\\/]admin[\\/](conteudo-do-site|personalizar-loja|looks|banners))[\\/]/.test(
    f,
  ),
);

const programa = ts.createProgram(raizes, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipLibCheck: true,
  /**
   * `strict: true` — O MESMO DO PROJETO.
   *
   * A receita herdada das bancadas antigas emitia com `strict: false`, e isso mente em
   * uniao discriminada e em `strictNullChecks` (ver `feedback_bancada_strict_false_mente`).
   * Com `strict: true`, os diagnosticos da bancada e do `tsc` do projeto falam a mesma
   * lingua.
   */
  strict: true,
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

const demo = require(join(OUT, 'src/lib/conteudo/demo.js'));
const metricas = require(join(OUT, 'src/lib/conteudo/metrics.js'));
const form = require(join(OUT, 'src/lib/conteudo/form.js'));
const catDemo = require(join(OUT, 'src/lib/categorias/demo.js'));
const catForm = require(join(OUT, 'src/lib/categorias/form.js'));
const prodDemo = require(join(OUT, 'src/lib/produtos/demo.js'));

const { HeroSlideRow, SiteCategoryRow, HomeSectionRow, BenefitRow } = require(join(OUT, 'src/components/admin/conteudo/conteudo-rows.js'));
const { ConteudoTabs } = require(join(OUT, 'src/components/admin/conteudo/conteudo-tabs.js'));
const { EmptyLine } = require(join(OUT, 'src/components/admin/conteudo/empty-line.js'));
const { InstagramPanel } = require(join(OUT, 'src/components/admin/conteudo/instagram-panel.js'));
const { FooterPanel } = require(join(OUT, 'src/components/admin/conteudo/footer-panel.js'));
const { PromoBanners } = require(join(OUT, 'src/components/admin/conteudo/promo-banners.js'));
const { ThemeCard, isDarkStrip } = require(join(OUT, 'src/components/admin/conteudo/theme-card.js'));

/* ------------------------------------------------------------- utilidades */

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o `formatBRL` usa espaco
 * inquebravel entre `R$` e o numero, e o `\s` do JS nao pega o U+00A0
 * (ver `feedback_bancada_espaco_inquebravel`).
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

/** Quantas vezes um trecho aparece. A pergunta e "QUANTAS?", nao "existe?". */
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
 * UM ATRIBUTO DE UM HTML — pelo NOME, no HTML CRU.
 *
 * `placeholder`, `value` e `aria-label` moram DENTRO de uma tag: `textos()` tira as
 * tags e, com elas, os atributos (ver `feedback_bancada_placeholder_atributo`).
 */
function atributoDe(html, nome) {
  const achados = [];
  const re = new RegExp(`${nome}="([^"]*)"`, 'g');
  let casou;
  while ((casou = re.exec(html)) !== null) achados.push(casou[1]);
  return achados;
}

/** O codigo de um arquivo, SEM comentarios — senao um `adm-063` citado na nota conta. */
function semComentarios(codigo) {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/=""/g, '');
}

const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');
const render = (Componente, props) => renderToStaticMarkup(react.createElement(Componente, props));

/**
 * A FAIXA DE ABAS DE `Conteudo do Site`, sem navegador.
 *
 * `renderToStaticMarkup` nao responde a clique: desenha a aba que nasce ativa e mais
 * nada. Como as sete abas ficam MONTADAS (so alternam `hidden`), o HTML traz tudo — mas
 * os ROTULOS das abas tambem estao no HTML e contaminariam as medidas dos paineis. Por
 * isso a bancada isola a faixa (`role="tablist"`) e mede o resto separado.
 */
function faixa(html) {
  const inicio = html.indexOf('role="tablist"');
  if (inicio < 0) return { abas: [], ativa: -1, faixaHtml: '', fim: -1 };
  const fim = html.indexOf('</div>', inicio);
  const faixaHtml = html.slice(inicio, fim);
  const abas = faixaHtml
    .split('<button')
    .slice(1)
    .map((pedaco) => textos(pedaco.slice(pedaco.indexOf('>') + 1).split('</button>')[0]));
  const ativa = atributoDe(faixaHtml, 'aria-selected').findIndex((v) => v === 'true');
  return { abas, ativa, faixaHtml, fim };
}

/* =========================== o repouso controlado =========================== */

const HERO = demo.DEMO_HERO_SLIDES;
const SECTIONS = demo.DEMO_HOME_SECTIONS;
const BENEFITS = demo.DEMO_BENEFITS;
const CATEGORIAS = catDemo.DEMO_CATEGORIES;
const CATALOGO = prodDemo.DEMO_PRODUCTS_PRODUTOS;

(async () => {
  /* ============ 1. O MAPEAMENTO: a pilula acesa de cada captura ============ */

  console.log('\n[1] CONTEUDO_TABS x a pilula acesa de cada captura');
  {
    const esperado = [
      { value: 'hero', label: 'Hero Banner', adm: 'adm-053', print: '235737' },
      { value: 'categorias', label: 'Categorias', adm: 'adm-054', print: '235745' },
      { value: 'secoes', label: 'Seções da Home', adm: 'adm-055', print: '235750' },
      { value: 'promo', label: 'Banners Promocionais', adm: 'adm-056', print: '235757' },
      { value: 'beneficios', label: 'Benefícios', adm: 'adm-057', print: '235804' },
      { value: 'instagram', label: 'Instagram', adm: 'adm-058', print: '235810' },
      { value: 'rodape', label: 'Rodapé', adm: 'adm-059', print: '235816' },
    ];
    if (mesmo(demo.CONTEUDO_TABS, esperado)) ok('as sete abas com adm/print corretos', 'adm-053..adm-059');
    else fail('CONTEUDO_TABS divergente', JSON.stringify(demo.CONTEUDO_TABS));

    // A ORDEM tambem e prova: `Banners Promocionais` e a QUARTA pilula (indice 3).
    const ordemCerta = demo.CONTEUDO_TABS.map((t) => t.label).join(' | ') ===
      'Hero Banner | Categorias | Seções da Home | Banners Promocionais | Benefícios | Instagram | Rodapé';
    if (ordemCerta) ok('a ordem das pilulas e a do print');
    else fail('ordem das pilulas errada', demo.CONTEUDO_TABS.map((t) => t.label).join(' | '));

    // PROVA AO CONTRARIO: o mapa DESLOCADO do defeito tem que FALHAR.
    const deslocado = demo.CONTEUDO_TABS.map((t, i) => ({ ...t, adm: `adm-0${63 + i}` }));
    if (!mesmo(deslocado, esperado)) ok('o mapa deslocado (adm-063..adm-070) FALHA', 'o defeito nao passaria');
    else fail('o mapa deslocado passou — o instrumento nao detecta o defeito');
  }

  /* ============================ 2. os botoes ============================ */

  console.log('\n[2] CONTEUDO_ACTIONS — o rotulo do botao de cada aba');
  {
    const esperado = {
      hero: 'Novo slide',
      categorias: 'Nova categoria',
      secoes: 'Nova seção',
      promo: 'Novo banner',
      beneficios: 'Novo',
      instagram: 'Salvar',
      rodape: 'Salvar',
    };
    if (mesmo(demo.CONTEUDO_ACTIONS, esperado)) ok('os sete rotulos, um a um');
    else fail('CONTEUDO_ACTIONS divergente', JSON.stringify(demo.CONTEUDO_ACTIONS));

    // As duas abas de formulario terminam em `Salvar`; as cinco de lista em `+ Novo`.
    const salvar = Object.values(demo.CONTEUDO_ACTIONS).filter((v) => v === 'Salvar').length;
    if (salvar === 2) ok('exatamente DUAS abas terminam em Salvar', 'Instagram e Rodape');
    else fail('numero de abas com Salvar', `${salvar}`);
  }

  /* ==================== 3. o titulo NAO esta duplicado ==================== */

  console.log('\n[3] adm-053: o titulo da casca nao se repete no corpo');
  {
    const htmlFaixa = render(ConteudoTabs, { value: 'hero', onChange: () => {} });
    const alvo = 'Conteúdo do Site';
    const dentro = contar(textos(htmlFaixa), alvo);

    // O `ConteudoTabs` NAO deve desenhar titulo nenhum `Conteúdo do Site`: esse e o
    // rotulo da casca. A versao corrigida produz zero.
    if (dentro === 0) ok('ConteudoTabs nao repete o titulo da casca', 'zero ocorrencias');
    else fail('titulo duplicado em ConteudoTabs', `${dentro} ocorrencia(s)`);

    // A faixa continua desenhando as SETE pilulas, e a ativa e a primeira.
    const { abas, ativa } = faixa(htmlFaixa);
    if (abas.length === 7 && abas[0] === 'Hero Banner') ok('a faixa desenha as sete pilulas', abas.join(' | '));
    else fail('faixa de pilulas errada', `${abas.length}: ${abas.join(' | ')}`);
    if (ativa === 0) ok('a aba ativa de nascenca e `Hero Banner`');
    else fail('aba ativa', `${ativa}`);
  }

  /* ================= 4. Categorias: foto condicional (o PAR) ================= */

  console.log('\n[4] SiteCategoryRow — a miniatura so existe quando ha imagem');
  {
    const corte = metricas.toSiteCategories(CATEGORIAS);
    const tops = corte.find((c) => c.name === 'Tops');
    const macaquinho = corte.find((c) => c.name === 'Macaquinhos');

    if (tops && tops.imageUrl) ok('`Tops` carrega a imagem de `Category.image`', tops.imageUrl);
    else fail('`Tops` sem imageUrl apos o corte', JSON.stringify(tops));

    if (macaquinho && macaquinho.imageUrl === null) ok('categoria sem imagem vira `imageUrl: null`');
    else fail('o corte nao zerou a imagem ausente', JSON.stringify(macaquinho));

    // O PAR: com imagem -> exatamente um <img>; sem imagem -> nenhum.
    const htmlComFoto = render(SiteCategoryRow, {
      category: tops, imageUrl: tops.imageUrl, onEdit: () => {}, onToggle: () => {}, onDelete: () => {},
    });
    const htmlSemFoto = render(SiteCategoryRow, {
      category: macaquinho, imageUrl: macaquinho.imageUrl, onEdit: () => {}, onToggle: () => {}, onDelete: () => {},
    });
    const imgsCom = (htmlComFoto.match(/<img\b/g) || []).length;
    const imgsSem = (htmlSemFoto.match(/<img\b/g) || []).length;

    if (imgsCom === 1) ok('com foto: exatamente UMA caixa', `${imgsCom}`);
    else fail('com foto deveria ter 1 <img>', `${imgsCom}`);
    if (imgsSem === 0) ok('sem foto: NENHUMA caixa', `${imgsSem}`);
    else fail('sem foto nao pode ter <img>', `${imgsSem}`);

    // PROVA AO CONTRARIO: transcrever o `?? null` como `undefined` nao desenharia
    // caixa quebrada? — o card so chama o desenho quando `imageUrl` e string. Se o
    // componente desenhasse com URL falsa, o ramo "com foto" nao mudaria de 1.
    const htmlVazia = render(SiteCategoryRow, {
      category: tops, imageUrl: '', onEdit: () => {}, onToggle: () => {}, onDelete: () => {},
    });
    if ((htmlVazia.match(/<img\b/g) || []).length === 0) ok('string vazia tambem nao desenha caixa', 'o guarda e por valor');
    else fail('string vazia desenhou caixa');

    // O catálogo TEM oito categorias, e o print SEIS — o corte nao filtra (declarado).
    if (CATEGORIAS.length === 8) ok('o catalogo traz OITO categorias, sem filtro silencioso', 'contra as SEIS do print');
    else fail('o catalogo mudou de tamanho', `${CATEGORIAS.length}`);
  }

  /* ===================== 5. positionOf / byDisplayOrder ===================== */

  console.log('\n[5] a ORDEM das linhas e DERIVADA, e comeca em 1');
  {
    const ordenado = metricas.byDisplayOrder(HERO);
    const pos1 = metricas.positionOf(ordenado, ordenado[0]);
    const posUltima = metricas.positionOf(ordenado, ordenado[ordenado.length - 1]);
    if (pos1 === 1) ok('a primeira linha e ORDEM 1, nao 0');
    else fail('a primeira linha nao e 1', `${pos1}`);
    if (posUltima === ordenado.length) ok('a ultima de N e N, nao N-1', `${posUltima}`);
    else fail('a ultima linha', `${posUltima}`);

    // Um id fora da lista devolve 0 (a saida que confunde contagem com campo) — e nao -1.
    const fantasma = metricas.positionOf(ordenado, { id: 'nao-existe' });
    if (fantasma === 0) ok('id ausente devolve 0, nunca -1', 'documentado em metrics.ts');
    else fail('id ausente devolveu', `${fantasma}`);

    // A identidade e por `id`: uma COPIA do objeto ainda acha a posicao.
    const copia = { ...ordenado[1] };
    if (metricas.positionOf(ordenado, copia) === 2) ok('a identidade e por `id`, nao por referencia');
    else fail('a copia nao achou a posicao');
  }

  /* ================== 6. as quatro linhas: o que cada uma imprime ================== */

  console.log('\n[6] as quatro linhas de `Conteudo do Site`');
  {
    // Hero: `Ordem N · ativo`, e SEM botao de ativar pela lista (2 acoes).
    const heroHtml = render(HeroSlideRow, {
      title: 'Nova coleção fitness', subtitle: 'Conforto.', order: 1, active: true,
      onEdit: () => {}, onDelete: () => {},
    });
    const heroTxt = textos(heroHtml);
    if (heroTxt.includes('Ordem 1 · ativo')) ok('Hero imprime `Ordem 1 · ativo`');
    else fail('Hero nao imprimiu a meta', heroTxt);
    const botoesHero = (heroHtml.match(/<button\b/g) || []).length;
    if (botoesHero === 2) ok('Hero tem DUAS acoes (Editar, Excluir), sem Desativar', `${botoesHero}`);
    else fail('Hero com numero de acoes errado', `${botoesHero}`);

    // Categorias: `/slug · ordem N · ativo`, e TRES acoes.
    const corte = metricas.toSiteCategories(CATEGORIAS);
    const catHtml = render(SiteCategoryRow, {
      category: corte[0], imageUrl: corte[0].imageUrl, onEdit: () => {}, onToggle: () => {}, onDelete: () => {},
    });
    if (textos(catHtml).includes(`/${corte[0].slug} · ordem ${corte[0].sortOrder} · ativo`)) ok('Categoria imprime `/slug · ordem N · ativo`');
    else fail('Categoria nao imprimiu a meta', textos(catHtml));
    if ((catHtml.match(/<button\b/g) || []).length === 3) ok('Categoria tem TRES acoes (Desativar, Editar, Excluir)');
    else fail('Categoria com numero de acoes errado');

    // Secoes da Home: `TITULO (kind)` + `fonte: … · N itens · ordem N · ativo`, e 2 acoes.
    const secHtml = render(HomeSectionRow, {
      section: SECTIONS[0], order: 1, onEdit: () => {}, onDelete: () => {},
    });
    const secTxt = textos(secHtml);
    if (secTxt.includes(`(${SECTIONS[0].kind})`)) ok('Secao imprime o `kind` entre parenteses', SECTIONS[0].kind);
    else fail('Secao nao imprimiu o kind', secTxt);
    if (secTxt.includes('fonte:') && secTxt.includes('itens · ordem 1 · ativo')) ok('Secao imprime `fonte: … · N itens · ordem N · ativo`');
    else fail('Secao nao imprimiu a meta', secTxt);
    if ((secHtml.match(/<button\b/g) || []).length === 2) ok('Secao tem DUAS acoes');

    // Beneficios: o CHIP com o nome do icone, `descricao · ordem N`, e 3 acoes.
    const benHtml = render(BenefitRow, {
      benefit: BENEFITS[0], order: 1, onEdit: () => {}, onToggle: () => {}, onDelete: () => {},
    });
    if (textos(benHtml).includes(BENEFITS[0].iconName)) ok('Beneficio imprime o NOME do icone no chip', BENEFITS[0].iconName);
    else fail('Beneficio nao imprimiu o icone', textos(benHtml));
    if ((benHtml.match(/<button\b/g) || []).length === 3) ok('Beneficio tem TRES acoes');
  }

  /* ================ 7. a divergencia interna do print (Secoes) ================ */

  console.log('\n[7] `Secoes da Home`: `kind` e `source` sao campos DIFERENTES');
  {
    const primeira = SECTIONS[0];
    // A primeira linha do print DISCORDA de si mesma: `(best_sellers)` mas `fonte: featured`.
    if (primeira.kind === 'best_sellers' && primeira.source === 'featured') {
      ok('a divergencia esta representada, nao apagada', `${primeira.kind} / fonte: ${primeira.source}`);
    } else {
      fail('a divergencia foi "consertada" sem prova', `${primeira.kind} / ${primeira.source}`);
    }
    const segunda = SECTIONS[1];
    if (segunda && segunda.kind === segunda.source) ok('a segunda linha concorda consigo mesma', segunda.kind);
    else fail('a segunda linha nao bate kind/source', JSON.stringify(segunda));
  }

  /* ================= 8. Instagram e Rodape: `Salvar` no FIM ================= */

  console.log('\n[8] o `Salvar` dos formularios fica no fim');
  {
    const igHtml = render(InstagramPanel, { initial: demo.DEMO_INSTAGRAM });
    const igTxt = textos(igHtml);
    if (igTxt.includes('Usuário detectado')) ok('Instagram imprime a linha de apoio `Usuário detectado`');
    else fail('Instagram sem a linha de apoio');

    // A POSICAO: o `Salvar` tem que aparecer DEPOIS do texto do checkbox.
    const posSalvar = igTxt.indexOf('Salvar');
    const posCheckbox = igTxt.indexOf('Exibir feed na Home');
    if (posSalvar > posCheckbox && posCheckbox >= 0) ok('`Salvar` vem DEPOIS do checkbox', `checkbox@${posCheckbox} < salvar@${posSalvar}`);
    else fail('`Salvar` nao esta no fim do formulario', `checkbox@${posCheckbox} / salvar@${posSalvar}`);

    const ftHtml = render(FooterPanel, { initial: demo.DEMO_SITE_FOOTER });
    const ftTxt = textos(ftHtml);
    const inputs = atributoDe(ftHtml, 'aria-label');
    // QUATRO campos: WhatsApp, Instagram, E-mail, Endereco.
    const quatro = ['WhatsApp', 'Instagram', 'E-mail', 'Endereço'].every((n) => inputs.includes(n));
    if (quatro) ok('Rodape tem os QUATRO inputs (2x2)', inputs.join(' · '));
    else fail('Rodape com inputs errados', JSON.stringify(inputs));

    // Os dois campos vazios trazem o placeholder; os dois preenchidos trazem o valor.
    const valores = atributoDe(ftHtml, 'value');
    if (valores.includes('5581998871397') && valores.includes('@closetlunnar')) ok('os dois valores do print estao no repouso');
    else fail('valores do rodape', JSON.stringify(valores));
    const places = atributoDe(ftHtml, 'placeholder');
    if (places.includes('E-mail') && places.includes('Endereço')) ok('`E-mail` e `Endereço` sao PLACEHOLDER de input vazio, nao texto de lista');
    else fail('placeholders do rodape', JSON.stringify(places));

    // O `Salvar` do Rodape fica DEPOIS das listas.
    if (ftTxt.indexOf('Salvar') > ftTxt.indexOf('Links')) ok('`Salvar` do Rodape vem depois de `Políticas`/`Links`');
    else fail('`Salvar` do Rodape fora de posicao');

    // As duas listas VAZIAS nao desenham linha nenhuma (`Políticas`/`Links` sozinhas).
    const linhasRodape = (ftHtml.match(/<li\b/g) || []).length;
    if (linhasRodape === 0) ok('as duas listas vazias nao desenham <li>', 'a mesma distincao de empty-line');
    else fail('lista vazia desenhou linhas', `${linhasRodape}`);
  }

  /* ======================== 9. Banners Promocionais: vazio ======================== */

  console.log('\n[9] `Banners Promocionais` (adm-056) esta VAZIO, e o texto e o do print');
  {
    if (Array.isArray(demo.DEMO_PROMO_BANNERS) && demo.DEMO_PROMO_BANNERS.length === 0) ok('DEMO_PROMO_BANNERS vazio');
    else fail('DEMO_PROMO_BANNERS nao vazio', JSON.stringify(demo.DEMO_PROMO_BANNERS));

    const html = render(PromoBanners, { initial: demo.DEMO_PROMO_BANNERS });
    if (textos(html).includes(demo.PROMO_EMPTY_TEXT)) ok('a tela imprime o vazio do print', demo.PROMO_EMPTY_TEXT);
    else fail('o vazio nao apareceu', textos(html));
  }

  /* ===================== 10. Looks: vazio, e o modal e JOIN ===================== */

  console.log('\n[10] `Looks` (adm-061/062) e o preview');
  {
    if (demo.DEMO_LOOKS.length === 0) ok('DEMO_LOOKS vazio', 'a lista do print nao tem look');
    else fail('DEMO_LOOKS nao vazio');

    // `lookPreview` conta as pecas e soma — mas DESCARTA id ausente do catalogo.
    const p0 = metricas.lookPreview([], CATALOGO);
    if (p0.pieceCountLabel === '0 peças' && p0.rows.length === 0) ok('zero pecas -> `0 peças` e soma zero');
    else fail('preview vazio', JSON.stringify(p0));

    const primeira = CATALOGO[0];
    const p1 = metricas.lookPreview([{ productId: primeira.id }], CATALOGO);
    if (p1.pieceCountLabel === '1 peça') ok('uma peca -> `1 peça` (singular)', p1.pieceCountLabel);
    else fail('singular do contador', p1.pieceCountLabel);
    if (p1.totalLabel === `Total: ${metricas.formatBRL(primeira.price)}`) ok('o total soma o preco do catalogo');
    else fail('total do preview', p1.totalLabel);

    // PROVA AO CONTRARIO: um id que NAO existe no catalogo nao soma nem conta.
    const pFantasma = metricas.lookPreview([{ productId: 'produto-fantasma' }], CATALOGO);
    if (pFantasma.rows.length === 0 && pFantasma.pieceCountLabel === '0 peças') ok('id ausente e DESCARTADO, nao soma zero a esmo');
    else fail('id ausente entrou na conta', JSON.stringify(pFantasma));

    // O fantasma de OUTRO modulo (`Conjunto Glow Nude`) nao existe no catalogo.
    const nomes = CATALOGO.map((p) => p.name);
    if (!nomes.includes('Conjunto Glow Nude')) ok('`Conjunto Glow Nude` (fantasma do Provador) nao esta no catalogo');
    else fail('o fantasma entrou no catalogo de produtos');

    if (metricas.lookPreviewName('   ') === metricas.LOOK_UNNAMED) ok('nome em branco -> `Sem nome`', metricas.LOOK_UNNAMED);
    else fail('nome vazio do preview');

    // `formatBRL` normalizado bate nos dois lados (NBSP).
    if (normalizar(metricas.formatBRL(1299.9)) === 'R$ 1.299,90') ok('formatBRL -> `R$ 1.299,90` (NBSP normalizado)');
    else fail('formatBRL', metricas.formatBRL(1299.9));

    // `toggleLookPiece` adiciona e remove — o mesmo id nao duplica.
    const add = form.toggleLookPiece([], primeira.id);
    if (add.length === 1 && add[0].productId === primeira.id) ok('toggleLookPiece adiciona');
    else fail('toggleLookPiece nao adicionou');
    const rem = form.toggleLookPiece(add, primeira.id);
    if (rem.length === 0) ok('toggleLookPiece remove o mesmo id');
    else fail('toggleLookPiece nao removeu');
  }

  /* ===================== 11. Personalizar Loja (adm-060) ===================== */

  console.log('\n[11] `Personalizar Loja` — tres cartoes, um ATIVO');
  {
    const temas = demo.DEMO_STORE_THEMES;
    if (temas.length === 3) ok('tres temas', temas.map((t) => t.name).join(' · '));
    else fail('numero de temas', `${temas.length}`);

    const ativo = temas[0];
    const inativo = temas[1];
    const htmlAtivo = render(ThemeCard, { theme: ativo, active: true, onApply: () => {} });
    const htmlInativo = render(ThemeCard, { theme: inativo, active: false, onApply: () => {} });

    /*
     * A PILULA DIZ `Ativo` NO DOM, E `ATIVO` NA TELA.
     *
     * `renderToStaticMarkup` nao aplica CSS: a caixa alta do print e a CLASSE
     * `uppercase`, e o texto cru e `Ativo`. A primeira versao desta asserção procurava
     * `ATIVO` no texto e falhava num cartao certo — o defeito era do INSTRUMENTO
     * (`textos()` apaga CLASSES, ver `feedback_regex_textual_mede_trecho_errado`).
     *
     * A prova certa e dupla: o texto do DOM e `Ativo` **e** a classe `uppercase` esta
     * presente (e o que faz a tela imprimir `ATIVO`).
     */
    if (textos(htmlAtivo).includes('Ativo') && htmlAtivo.includes('uppercase')) ok('o cartao ativo traz a pilula `Ativo` (caixa alta pela classe `uppercase`)');
    else fail('o cartao ativo nao tem a pilula');
    if (!textos(htmlInativo).includes('Ativo')) ok('o cartao inativo NAO traz a pilula');
    else fail('o cartao inativo trouxe a pilula');

    // O botao: `Aplicar tema` no inativo, `Tema atual` (desabilitado) no ativo.
    if (textos(htmlInativo).includes('Aplicar tema')) ok('o inativo oferece `Aplicar tema`');
    else fail('o inativo nao oferece aplicar');
    if (textos(htmlAtivo).includes('Tema atual')) ok('o ativo mostra `Tema atual`');
    else fail('o ativo nao mostra `Tema atual`');

    // A tarja e um gradiente com as DUAS cores do tema.
    const estilo = atributoDe(htmlAtivo, 'style').join(' ');
    if (estilo.includes(ativo.previewFrom) && estilo.includes(ativo.previewTo)) ok('a tarja usa `previewFrom` e `previewTo`');
    else fail('gradiente da tarja', estilo);

    // `isDarkStrip` decide a tinta: `Premium Black` (`#1A1A1A`) e escuro, `Elegant` nao.
    const premium = temas.find((t) => t.name === 'Premium Black');
    if (premium && isDarkStrip(premium.previewFrom) === true) ok('`isDarkStrip` marca `#1A1A1A` como escuro');
    else fail('isDarkStrip errou o tema escuro');
    if (isDarkStrip('#F4E9DA') === false) ok('`isDarkStrip` nao marca o claro como escuro');
    else fail('isDarkStrip errou o tema claro');
  }

  /* ============ 12. as validacoes que o formulario usa (zero e valido) ============ */

  console.log('\n[12] validacoes puras de `metrics.ts`');
  {
    if (metricas.isValidOrder(0)) ok('`0` e ordem valida', 'o repouso do modal e 0');
    else fail('`0` recusado — o repouso do print nao passaria');
    if (!metricas.isValidOrder(-1)) ok('negativo e recusado');
    else fail('negativo aceito');
    if (!metricas.isValidOrder(1.5)) ok('fracionario e recusado');
    else fail('fracionario aceito');

    if (!metricas.isValidTitle('   ')) ok('titulo em branco e recusado');
    else fail('titulo em branco aceito');
    if (metricas.isValidTitle('Tops')) ok('titulo com texto passa');
    else fail('titulo valido recusado');

    if (metricas.isAcceptableLink('https://instagram.com/closetlunar')) ok('URL https aceita');
    else fail('URL https recusada');
    if (!metricas.isAcceptableLink('javascript:alert(1)')) ok('esquema perigoso recusado');
    else fail('esquema perigoso aceito');

    // `instagramHandle` extrai a conta e larga o `?igshid=`.
    if (metricas.instagramHandle('https://instagram.com/closetlunar?igshid=abc') === '@closetlunar') ok('instagramHandle limpa a query', '@closetlunar');
    else fail('instagramHandle', metricas.instagramHandle('https://instagram.com/closetlunar?igshid=abc'));
    if (metricas.instagramHandle('') === '') ok('URL vazia nao vira `@` sozinho');
    else fail('instagramHandle do vazio', metricas.instagramHandle(''));
  }

  /* ============ 13. a grafia divergente: `closetlunar` x `closetlunnar` ============ */

  console.log('\n[13] a divergencia de grafia fica REGISTRADA, nao corrigida');
  {
    const ig = demo.DEMO_INSTAGRAM.url;
    const ft = demo.DEMO_SITE_FOOTER.instagram;
    if (ig.includes('/closetlunar') && !ig.includes('/closetlunnar')) ok('Instagram escreve UM n', ig);
    else fail('Instagram mudou de grafia', ig);
    if (ft === '@closetlunnar') ok('Rodape escreve DOIS n', ft);
    else fail('Rodape mudou de grafia', ft);
    if (ig.includes('/closetlunar?') || ig.endsWith('closetlunar')) ok('as duas telas divergem de proposito');
    else fail('a divergencia sumiu');
  }

  /* ============ 14. as tres paginas nao sao mais placeholder ============ */

  console.log('\n[14] as paginas: sem `ModulePage`, e o `references` so em comentario');
  {
    const paginas = [
      { rel: 'src/app/admin/conteudo-do-site/page.tsx', certo: /adm-053|adm-059/ },
      { rel: 'src/app/admin/personalizar-loja/page.tsx', certo: /adm-060/ },
      { rel: 'src/app/admin/looks/page.tsx', certo: /adm-061|adm-062/ },
    ];
    for (const p of paginas) {
      const cru = arquivo(p.rel);
      const codigo = semComentarios(cru);

      // 1. Nao importam o placeholder.
      if (!/ModulePage|PlaceholderPage/.test(codigo)) ok(`${p.rel}: nao usa placeholder`);
      else fail(`${p.rel}: ainda importa placeholder`);

      // 2. O numero ERRADO do defeito so pode viver em comentario, nunca no codigo.
      const errados = p.rel.includes('conteudo-do-site')
        ? ['adm-063', 'adm-070']
        : p.rel.includes('personalizar-loja')
          ? ['adm-071']
          : [];
      const vazou = errados.filter((n) => codigo.includes(n));
      if (vazou.length === 0) ok(`${p.rel}: nenhum numero adm errado no codigo`, errados.join(' / ') || '(nenhum)');
      else fail(`${p.rel}: numero errado vazou para o codigo`, vazou.join(', '));

      // 3. O numero CERTO esta citado no arquivo (no comentario que documenta o defeito).
      if (p.certo.test(cru)) ok(`${p.rel}: cita o intervalo correto`);
      else fail(`${p.rel}: nao cita o intervalo correto`);

      // 4. A pagina e um Server Component assincrono que carrega dado de verdade.
      if (/export default async function/.test(codigo)) ok(`${p.rel}: Server Component async`);
      else fail(`${p.rel}: nao e Server Component async`);
    }

    // As tres paginas antigas de placeholder foram substituidas; a `banners` ja estava.
    const banners = semComentarios(arquivo('src/app/admin/banners/page.tsx'));
    if (!/ModulePage|PlaceholderPage/.test(banners)) ok('src/app/admin/banners/page.tsx: tambem sem placeholder');
    else fail('banners ainda usa placeholder');
  }

  /* ============ 15. o corte `SiteCategory` reusa `lib/categorias` ============ */

  console.log('\n[15] a aba Categorias e um JOIN, e nao um segundo dono');
  {
    const corte = metricas.toSiteCategories(CATEGORIAS);
    if (corte.length === CATEGORIAS.length) ok('o corte nao inventa nem descarta linhas', `${corte.length}`);
    else fail('o corte mudou o numero de linhas', `${corte.length} vs ${CATEGORIAS.length}`);

    // A ordem do corte e `sortOrder` e depois nome.
    const ordens = corte.map((c) => c.sortOrder);
    const crescentes = ordens.every((n, i) => i === 0 || ordens[i - 1] <= n);
    if (crescentes) ok('o corte sai ordenado por `sortOrder`', ordens.join(','));
    else fail('o corte saiu fora de ordem', ordens.join(','));

    // O formulario reusado e o de `lib/categorias` — o mesmo `draft`/`validateDraft`.
    const draft = catForm.emptyDraft(CATEGORIAS);
    const erro = catForm.validateDraft(draft, CATEGORIAS, undefined);
    if (catForm.hasErrors(erro)) ok('o rascunho vazio ACUSA erro', Object.keys(erro).join(', '));
    else fail('o rascunho vazio passou — a validacao reusada esta frouxa');

    // PROVA AO CONTRARIO: um slug repetido tem que ser recusado pelo MESMO validador.
    const base = catForm.draftFromCategory(CATEGORIAS[1]);
    const dup = { ...base, slug: CATEGORIAS[0].slug };
    const erroDup = catForm.validateDraft(dup, CATEGORIAS, undefined);
    if (erroDup.slug) ok('slug repetido e recusado pelo validador reusado', `"${dup.slug}" ja existe`);
    else fail('slug repetido passou — a reutilizacao esta incompleta');

    // E o `editingId` desarma a colisao consigo mesma: editar `Tops` sem trocar o slug.
    const erroEdicao = catForm.validateDraft(catForm.draftFromCategory(CATEGORIAS[0]), CATEGORIAS, CATEGORIAS[0].id);
    if (!erroEdicao.slug) ok('editar sem trocar o slug nao acusa colisao consigo mesma');
    else fail('a edicao da propria categoria acusou colisao', erroEdicao.slug);
  }

  /* ------------------------------------------------------------- resumo */

  console.log(`\n${'='.repeat(72)}`);
  console.log(`CONTEUDO: ${provas - falhas}/${provas} provas${falhas ? ` — ${falhas} FALHA(S)` : ''}`);
  console.log('='.repeat(72));
  process.exit(falhas ? 1 : 0);
})();
