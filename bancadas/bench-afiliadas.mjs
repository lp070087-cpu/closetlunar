/**
 * Bancada do modulo Afiliadas.
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o
 * `next/font/google` espera as fontes para sempre). Sem esta bancada, a unica
 * garantia seria o typecheck — que nao renderiza, nao formata e nao ve o ramo
 * invertido.
 *
 * O QUE ELA PROVA, EM ORDEM
 *
 *   1. os .ts/.tsx do modulo EMITEM sem erro e os `@/` resolvem em execucao;
 *   2. a afiliada do material, campo por campo, como adm-021 a mostra;
 *   3. as CINCO colunas, na ordem do print, e os alinhamentos (STATUS ao CENTRO);
 *   4. que o link de indicacao sai `—`? NAO: ele sai `/` — a barra sozinha e o
 *      estado real de um slug vazio, e corrigi-la para travessao seria deixar de
 *      reproduzir o print;
 *   5. que a COMISSAO sai `5%` e nao `R$ 5,00`, e que um `commission_type`
 *      inesperado NAO cai no ramo dos reais;
 *   6. que o selo imprime `ACTIVE` — o texto CRU do original — e nao `Ativa`;
 *   7. que o botao da linha diz o que o clique VAI FAZER (`Suspender` numa
 *      ativa, `Ativar` numa suspensa);
 *   8. que o formulario renderiza os SEIS campos do print, com os dois valores
 *      que o original preenche (`Percentual (%)` e `10`) e os quatro vazios;
 *   9. que o titulo do modal muda com o modo (`Nova` / `Editar`);
 *  10. que `Salvar` NAO finge gravar (`persisted: false`), e que o status de uma
 *      suspensa SOBREVIVE a uma edicao do nome;
 *  11. que `countActive` NAO e o `length` da lista;
 *  12. a rota existe e nao usa mais o placeholder, e a referencia errada ficou
 *      REGISTRADA;
 *  13. as provas ao contrario: o instrumento sabe FALHAR.
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
  console.error('uso: node bench-afiliadas.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-afiliadas');

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
 * Raizes da COMPILACAO: so o modulo novo.
 *
 * O compilador segue os `import` sozinho, entao `ui/*`, `lib/utils` e
 * `components/ui/*` entram por conta propria. As outras paginas do painel NAO
 * entram — compilar todas estoura o limite de ~178 s do `bash` deste ambiente.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]afiliadas|components[\\/]admin[\\/]afiliadas|app[\\/]admin[\\/]afiliadas)[\\/]/.test(f),
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

const dados = require(join(OUT, 'src/lib/afiliadas/data.js'));
const demo = require(join(OUT, 'src/lib/afiliadas/demo.js'));
const metricas = require(join(OUT, 'src/lib/afiliadas/metrics.js'));
const formulario = require(join(OUT, 'src/lib/afiliadas/form.js'));
const tipos = require(join(OUT, 'src/lib/afiliadas/types.js'));
const utils = require(join(OUT, 'src/lib/utils.js'));
const { AffiliateTable } = require(join(OUT, 'src/components/admin/afiliadas/affiliate-table.js'));
const { AffiliateForm } = require(join(OUT, 'src/components/admin/afiliadas/affiliate-form.js'));

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

const render = (Componente, props) => renderToStaticMarkup(react.createElement(Componente, props));

/**
 * TEXTO DOS ROTULOS, SEM AS `<option>`.
 *
 * Sem isto a bancada mede o nada no seletor: o `<select>` de tipo de comissao
 * carrega as DUAS opcoes SEMPRE, entao `Valor Fixo (R$)` aparece no HTML mesmo
 * com o tipo em `percentage` — e a prova de que o campo esta no modo percentual
 * passaria a medir a opcao em vez do estado do formulario.
 */
function textosDeRotulo(html) {
  return textos(html.replace(/<option[\s\S]*?<\/option>/g, ' '));
}

/**
 * O CODIGO DE UM ARQUIVO, SEM OS COMENTARIOS — e sem os ATRIBUTOS VAZIOS.
 *
 * A primeira licao veio da bancada de Pedidos, onde DUAS assercoes passaram a
 * medir o comentario em vez do codigo: a documentacao da correcao CITA a string
 * procurada, entao a agulha casava dentro da explicacao e a bancada acusava um
 * defeito que nao existia. A segunda regra evita comer o `//` de um protocolo:
 * so trata como comentario de linha quando o `//` NAO vem depois de `:`.
 *
 * A SEGUNDA LICAO VEIO DESTA BANCADA, e e a razao da terceira regra. Procurar
 * os CINCO rotulos de `TableHeaderCell` por posicao no codigo-fonte passou a
 * acusar "cabecalho embaralhado" depois que `align="center"` entrou no
 * `Status` — e o cabecalho nao tinha se mexido. O que aconteceu e que a agulha
 * `Status` casou dentro de `align="center">Status`, ANTES de `Comissão` no
 * arquivo, porque o atributo novo empurrou o rotulo para tras da agulha
 * anterior. Ou seja: uma mudanca de ATRIBUTO fez a prova de ORDEM medir outra
 * coisa.
 *
 * Tirar os `=""` resolve a classe inteira: `align="center">Status` volta a ser
 * `align="center">Status`... e o `Status` de `role="tab"` ou de um `aria-hidden`
 * deixa de poder ser confundido com um rotulo de coluna. O que sobra no texto
 * limpo e so o que o codigo NOMEIA.
 */
function semComentarios(codigo) {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/=""/g, '');
}

/**
 * OS ATRIBUTOS DO HTML — `placeholder` E `value`.
 *
 * ESTE INSTRUMENTO FALTOU NA PRIMEIRA RODADA, e o defeito e o mesmo que o
 * cabecalho de `textosDeRotulo` descreve, um nivel mais fundo: `textos()` tira as
 * TAGS e, com elas, os ATRIBUTOS.
 *
 * O formulario de Afiliada nao tem rotulo em campo nenhum — o que a pessoa le
 * dentro do campo vazio e o `placeholder`, que e um ATRIBUTO. Medir o
 * formulario so por `textos()` encontraria apenas o titulo e os botoes, e as
 * SEIS provas de campo falhariam contra um formulario que esta CERTO.
 *
 * O MESMO VALE PARA A EDICAO: os valores da afiliada vao no atributo `value` de
 * cada `<input>`. Sem ler `value`, o formulario de edicao mede o nada.
 *
 * Os dois atributos ficam separados de proposito: `placeholder` e o que aparece
 * quando o campo esta VAZIO (o modo NOVO), e `value` e o que aparece quando ele
 * esta PREENCHIDO (o modo EDICAO). Misturar os dois faria a prova do modo NOVO
 * passar por causa de um `value` que so existe no modo de edicao.
 */
function atributoHtml(html, nome) {
  const encontrados = [];
  const re = new RegExp(`${nome}="([^"]*)"`, 'g');
  let casou;
  while ((casou = re.exec(html)) !== null) encontrados.push(casou[1]);
  return encontrados;
}
const placeholdersDe = (html) => atributoHtml(html, 'placeholder').join(' ');
const valoresDe = (html) => atributoHtml(html, 'value').join(' ');

/**
 * A OPCAO SELECIONADA DE UM `<select>`.
 *
 * `textosDeRotulo` TIRA as `<option>` de proposito — sem isso o `<select>` de
 * tipo de comissao traria as DUAS opcoes SEMPRE e uma prova de rotulo mediria a
 * opcao em vez do estado. Mas isso deixa sem instrumento a prova do CONTRARIO:
 * qual das duas esta selecionada.
 *
 * O React marca a opcao ativa com um ATRIBUTO VAZIO (`selected=""`), e nao com
 * `selected="selected"`. Ler o atributo pelo NOME resolve sem depender do
 * formato: o valor dele nao carrega informacao nenhuma, so a presenca.
 */
function opcaoSelecionada(html) {
  const re = /<option([^>]*\bselected\b[^>]*)>([\s\S]*?)<\/option>/g;
  const achados = [];
  let casou;
  while ((casou = re.exec(html)) !== null) achados.push(casou[2].replace(/<[^>]+>/g, ' ').trim());
  return achados.join(' ');
}

/**
 * ORDEM POR POSICAO — e nao por comparacao de indices.
 *
 * Comparar `posicoes` com `[...posicoes].sort()` PASSA quando duas agulhas caem
 * no mesmo lugar (as duas posicoes empatam e o array ja esta "ordenado"). Foi
 * assim que a bancada de Carrinho Abandonado quase deu verde para uma tabela
 * desalinhada: a agulha `Status` casou dentro de `CartStatus`. Aqui a assercao
 * exige ordem ESTRITAMENTE crescente.
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

/**
 * OS ROTULOS DAS COLUNAS, NA ORDEM EM QUE APARECEM NO JSX.
 *
 * E O INSTRUMENTO CERTO PARA A PROVA DE CABECALHO, e o motivo e a MESMA
 * armadilha que o `naOrdem` acima descreve — desta vez caindo nesta bancada.
 *
 * `naOrdem(limpoTabela, [...])` busca a agulha `Status` por `indexOf` no arquivo
 * inteiro, e a PRIMEIRA ocorrencia de `Status` nao e a coluna: e o `import {
 * affiliateStatusLabel, affiliateStatusTone }` no topo, na posicao 338 —
 * ANTES de `Comissão`, na 998. A prova acusava "cabecalho embaralhado" contra um
 * cabecalho que nunca se mexeu, e a causa nao tinha nada a ver com a tabela.
 *
 * Ler SO o conteudo de cada `<TableHeaderCell>` resolve a classe inteira: o que
 * entra na comparacao e o rotulo que a coluna imprime, e nao uma string que
 * aparece em qualquer lugar do arquivo por coincidencia de nome.
 *
 * O `[^>]*` cobre os atributos (`align="center"`) sem engolir o rotulo, e o
 * `[^<]*` para no proximo `<` — que e o fechamento da tag.
 */
function rotulosDeColuna(codigo) {
  const re = /<TableHeaderCell[^>]*>([^<]*)/g;
  const achados = [];
  let casou;
  while ((casou = re.exec(codigo)) !== null) achados.push(casou[1].trim());
  return achados.filter(Boolean);
}

// `join(PROJ, rel)` — e nao `join(SRC, rel)`: os caminhos passados aqui ja vem
// com o prefixo `src/`, como nos `require` desta bancada. Com `SRC` a juncao
// produziria `src/src/...` e a bancada morreria no `readFileSync`.
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

/* ------------------------------------------------------------- 1. emissao */

/* -------------------------------------------- 2. a afiliada do material */

console.log('\n2. a afiliada do material — adm-021');

const aff = demo.DEMO_AFFILIATES[0];

if (demo.DEMO_AFFILIATES.length === 1) ok('o material tem UMA afiliada', 'e ela que a bancada mede');
else fail('lista demo', `${demo.DEMO_AFFILIATES.length} itens`);

const esperado = {
  name: 'Carinna',
  email: 'lucasmuniz19w@gmail.com',
  couponCode: 'CARINNAS',
  referralSlug: '',
  commissionType: 'percentage',
  commissionValue: 5,
  status: 'active',
};
const lidos = Object.fromEntries(Object.keys(esperado).map((k) => [k, aff[k]]));
if (mesmo(lidos, esperado)) ok('os SETE campos do print batem', 'nome, e-mail, cupom, slug, tipo, valor, status');
else fail('campo divergente', JSON.stringify(lidos));

/**
 * O SLUG E VAZIO — e e isso que produz o `/` da tabela. Se alguem "preencher"
 * este campo para o link ficar bonito, a tela deixa de reproduzir o print.
 */
if (aff.referralSlug === '') ok('o slug e VAZIO — e o que produz a barra sozinha', 'nao e um slug chamado `/`');
else fail('slug preenchido', aff.referralSlug);

/**
 * OS QUATRO CAMPOS QUE O `upsert` GRAVA E O FORMULARIO NAO MOSTRA.
 *
 * A prova de que eles ESTAO no objeto e o que garante que o primeiro salvamento
 * com o Neon ligado nao apague `bank_info`, `user_id`, `created_at` e
 * `updated_at`. O tipo tem dez campos; a tela mostra cinco.
 */
const chaves = Object.keys(aff).sort();
const dez = ['bankInfo', 'commissionType', 'commissionValue', 'couponCode', 'createdAt', 'email', 'id', 'name', 'referralSlug', 'status', 'updatedAt', 'userId'];
if (mesmo(chaves, dez)) ok('o objeto tem as DOZE chaves do `Row`', 'inclusive as quatro que a tela nao mostra');
else fail('faltou coluna no objeto', chaves.join(', '));

if (aff.bankInfo === null && aff.userId === null) ok('`bankInfo` e `userId` nascem nulos', 'e o estado do original na insercao');
else fail('campo que deveria ser nulo', JSON.stringify({ bankInfo: aff.bankInfo, userId: aff.userId }));

/* ------------------------------------------------- 3. a tabela de adm-021 */

console.log('\n3. a tabela — as cinco colunas e os alinhamentos');

const tabelaSrc = arquivo('src/components/admin/afiliadas/affiliate-table.tsx');
const limpoTabela = semComentarios(tabelaSrc);

/**
 * A ORDEM E MEDIDA PELOS ROTULOS DAS COLUNAS, e nao por `indexOf` no arquivo.
 *
 * A versao anterior usava `naOrdem(limpoTabela, [...])` e acusava cabecalho
 * embaralhado: a agulha `Status` casava primeiro dentro de um `import`
 * (`affiliateStatusLabel`), na posicao 338 — antes de `Comissão`, na 998. A
 * tabela renderiza as cinco colunas na ordem certa; o INSTRUMENTO e que lia o
 * arquivo errado. Ver `rotulosDeColuna`.
 */
const rotulos = rotulosDeColuna(limpoTabela);
const esperados = ['Nome / E-mail', 'Cupom / Link', 'Comissão', 'Status', 'Ações'];
if (mesmo(rotulos, esperados)) ok('as CINCO colunas na ordem do print', rotulos.join(' · '));
else fail('cabecalho embaralhado', JSON.stringify(rotulos));

/**
 * E O INSTRUMENTO NAO PODE ACHAR MENOS COLUNAS DO QUE EXISTEM — senao uma
 * tabela com duas colunas passaria com `['Nome / E-mail', 'Status']` se a lista
 * esperada fosse conferida por `includes` em vez de igualdade. A igualdade
 * posicional acima ja cobre isso; esta prova e a que garante que o instrumento
 * esta LENDO, e nao devolvendo vazio.
 */
if (rotulos.length === 5) ok('e o instrumento le exatamente cinco', 'nao esta medindo um array vazio');
else fail('instrumento cego', `${rotulos.length} rotulos lidos`);

/**
 * `STATUS` E A UNICA COLUNA CENTRALIZADA. O print mostra a pilula `ACTIVE` no
 * meio da coluna, com espaco dos dois lados — e as outras tres a esquerda.
 * Alinhar `Status` a esquerda, ou centralizar `Comissao`, seriam dois erros na
 * mesma celula, e nenhum dos dois quebra nada em tempo de compilacao.
 */
if (limpoTabela.includes('align="center">Status') && limpoTabela.includes('align="right">Ações'))
  ok('`Status` ao centro e `Ações` a direita', 'como adm-021');
else fail('alinhamento das colunas', 'Status/Ações fora do lugar');

const tabela = render(AffiliateTable, { rows: demo.DEMO_AFFILIATES, onEdit: () => {}, onToggle: () => {} });
const textoTabela = textos(tabela);

/* --------------------------------------------- 4. o link `/` de indicacao */

console.log('\n4. o link de indicacao — a barra sozinha');

const referral = metricas.formatReferral(aff);
if (referral === '/') ok('o link sai `/` — a barra sozinha', 'o estado real de um slug vazio');
else fail('link de indicacao', JSON.stringify(referral));

/**
 * A BARRA NAO PODE VIRAR UM LINK. O original usa um `<div>`; um `<a>` levaria a
 * pessoa para a RAIZ do painel, que e o defeito de `href="/"` que o proprio mapa
 * registra na tela de Rodape. Aqui a assercao e direta: nao ha `<a` na celula.
 */
if (!/<a[\s>]/.test(tabela)) ok('a celula de link NAO tem `<a>`', 'o original usa `<div>` — nao ha destino');
else fail('a barra sozinha virou link', 'levaria para a raiz do painel');

const comSlug = metricas.formatReferral({ referralSlug: 'luna10' });
if (comSlug === '/luna10') ok('e com slug preenchido o link sai `/luna10`', 'a barra e fixa, como no original');
else fail('link com slug', comSlug);

const comEspaco = metricas.formatReferral({ referralSlug: '  luna10  ' });
if (comEspaco === '/luna10') ok('com espaco nas pontas a barra NAO se solta', 'o original imprimiria `/ luna10`');
else fail('espaco no slug', JSON.stringify(comEspaco));

/* ------------------------------------------------------ 5. a COLUNA comissao */

console.log('\n5. a coluna COMISSAO');

if (metricas.formatCommission(aff) === '5%') ok('percentual sai `5%`', 'e nao `R$ 5,00`');
else fail('comissao percentual', metricas.formatCommission(aff));

if (metricas.formatCommission({ commissionType: 'fixed', commissionValue: 20 }) === utils.formatBRL(20))
  ok('valor fixo sai em reais', utils.formatBRL(20));
else fail('comissao fixa', metricas.formatCommission({ commissionType: 'fixed', commissionValue: 20 }));

/**
 * O DEFEITO QUE UM TYPECHECK NAO PEGA: `commission_type` e `string` no schema e
 * NAO tem CHECK. Um valor inesperado (`'PERCENT'`, `null`, `''`) que escapasse
 * para o ramo dos REAIS imprimiria `R$ 5,00` no lugar de `5%` — inflando a
 * comissao na cabeca de quem le. O padrao tem que ser PERCENTUAL.
 */
const inesperados = ['PERCENT', null, undefined, '', 'porcentagem'];
const cairam = inesperados.filter(
  (t) => metricas.formatCommission({ commissionType: t, commissionValue: 5 }) !== '5%',
);
if (cairam.length === 0) ok('um tipo inesperado NAO cai no ramo dos reais', 'os cinco viram `5%`');
else fail('tipo inesperado virou reais', JSON.stringify(cairam));

/**
 * `'5.00'` — o que o driver devolve para uma coluna `numeric`. Sem o `Number()`
 * em volta, o percentual imprimiria `5.00%`; e `R$ 5,00` no ramo fixo.
 */
if (metricas.formatCommission({ commissionType: 'percentage', commissionValue: '5.00' }) === '5%')
  ok('o `"5.00"` do driver sai `5%`', 'a normalizacao acontece antes de imprimir');
else fail('valor do driver', metricas.formatCommission({ commissionType: 'percentage', commissionValue: '5.00' }));

if (metricas.formatCommission({ commissionType: 'percentage', commissionValue: NaN }) === '—')
  ok('um valor nao numerico sai `—`', 'e nao `NaN%`');
else fail('valor invalido', metricas.formatCommission({ commissionType: 'percentage', commissionValue: NaN }));

/* ------------------------------------------------------- 6. o selo de status */

console.log('\n6. o selo de status — o texto CRU');

if (metricas.affiliateStatusLabel('active') === 'ACTIVE') ok('o selo imprime `ACTIVE`', 'o texto CRU do original — nao `Ativa`');
else fail('rotulo de status', metricas.affiliateStatusLabel('active'));

if (textoTabela.includes('ACTIVE')) ok('e a tabela mostra `ACTIVE`', 'o selo renderiza o valor cru');
else fail('selo na tabela', textoTabela.slice(0, 120));

if (metricas.affiliateStatusTone('active') === 'success' && metricas.affiliateStatusTone('suspended') === 'danger')
  ok('verde na ativa, vermelho na suspensa', 'as duas cores dos prints');
else fail('tom do selo', 'os dois ramos nao batem');

/**
 * O DEFEITO ASSIMETRICO: `status` tambem e `string` sem CHECK. O padrao tem que
 * ser `active` — cair em `suspended` por engano TIRARIA a afiliada do ar sem
 * ninguem ter clicado em `Suspender`. Ja cair em `active` deixa no ar quem
 * deveria estar suspenso, e esse erro aparece.
 */
const statusInesperados = ['ACTIVE', null, undefined, '', 'inativo', 0];
const statusCairam = statusInesperados.filter((s) => metricas.toAffiliateStatus(s) !== 'active');
if (statusCairam.length === 0) ok('um status inesperado cai em `active`', 'os seis viram ativo, e nao suspenso');
else fail('status inesperado virou suspenso', JSON.stringify(statusCairam));

/* ------------------------------------------------- 7. o botao da linha */

console.log('\n7. o botao da linha — o que o clique VAI FAZER');

if (metricas.toggleActionLabel('active') === 'Suspender') ok('na ativa o botao diz `Suspender`', 'como adm-021');
else fail('rotulo do botao (ativa)', metricas.toggleActionLabel('active'));

/**
 * O PAR QUE O MATERIAL NAO MOSTRA. A Carinna esta ativa, entao `Ativar` nunca
 * aparece em print nenhum — mas o ramo existe no original e a bancada precisa
 * provar que ele nao esta invertido. Um toggle que diz `Suspender` e ATIVA e o
 * defeito classico, e ele passa em qualquer typecheck.
 */
if (metricas.toggleActionLabel('suspended') === 'Ativar') ok('na suspensa o botao diz `Ativar`', 'o ramo que o print nao mostra');
else fail('rotulo do botao (suspensa)', metricas.toggleActionLabel('suspended'));

const proximoDeAtiva = metricas.nextStatus('active');
const proximoDeSuspensa = metricas.nextStatus('suspended');
if (proximoDeAtiva === 'suspended' && proximoDeSuspensa === 'active')
  ok('e o clique grava o OPOSTO do que havia', '`Suspender` suspende, `Ativar` ativa');
else fail('proximo status', JSON.stringify({ proximoDeAtiva, proximoDeSuspensa }));

/**
 * ROTULO E PROXIMO STATUS SAO PERGUNTAS DIFERENTES, e a assercao acima sozinha
 * nao pega a troca: um `toggleActionLabel` que devolvesse o status ATUAL daria
 * `active`/`suspended` em vez de `Suspender`/`Ativar`, e um `nextStatus` tambem
 * trocado fecharia a conta. Aqui os dois textos sao conferidos contra o valor
 * GRAVADO, um por um.
 */
if (metricas.toggleActionLabel('active') !== metricas.nextStatus('active'))
  ok('o rotulo NAO e o proximo status disfarcado', '`Suspender` != `suspended`');
else fail('rotulo e valor colidiram', 'a assercao anterior mediria o nada');

/* --------------------------------------------------- 8. o formulario */

console.log('\n8. o formulario — adm-022');

const rascunho = formulario.emptyDraft();
if (rascunho.commissionType === 'percentage' && rascunho.commissionValue === '10')
  ok('abre com `Percentual (%)` e `10`', 'os dois padroes do original');
else fail('valores padrao', JSON.stringify(rascunho));

const vazios = ['name', 'email', 'couponCode', 'referralSlug', 'id'];
const preenchidos = vazios.filter((k) => rascunho[k] !== '');
if (preenchidos.length === 0) ok('e os QUATRO campos do print abrem vazios', 'mais o `id`, que decide NOVA vs EDICAO');
else fail('campo que deveria abrir vazio', JSON.stringify(preenchidos));

const formHtmlBruto = render(AffiliateForm, {
  draft: rascunho,
  errors: {},
  saving: false,
  outcome: 'none',
  onChange: () => {},
  onCancel: () => {},
  onSubmit: () => {},
});

/**
 * OS QUATRO CAMPOS VAZIOS DO PRINT SAO `placeholder` — um ATRIBUTO.
 *
 * Medi-los por `textos()` foi o defeito da primeira rodada: a funcao tira as
 * tags e os atributos junto, e a prova acusava um formulario correto. Ver o
 * cabecalho de `atributoHtml`.
 *
 * O TEXTO VISIVEL ENTRA SEPARADO, para o titulo e os botoes — que sao texto de
 * verdade e nao atributo.
 */
const formTexto = textosDeRotulo(formHtmlBruto);
const formPlaceholders = placeholdersDe(formHtmlBruto);

const placeholders = ['Nome', 'E-mail', 'Cupom (ex: LUNA10)', 'Slug (ex: luna10)'];
const faltando = placeholders.filter((p) => !formPlaceholders.includes(p));
if (faltando.length === 0) ok('os QUATRO placeholders do print aparecem', 'e sao atributos, nao texto visivel');
else fail('placeholder faltando no formulario', JSON.stringify(faltando));

/**
 * E OS DOIS VALORES QUE O ORIGINAL PREENCHE — `Percentual (%)` e `10`.
 *
 * O PRIMEIRO ESTA NA `<option>` SELECIONADA, e nao em texto visivel. A assercao
 * anterior media `formTexto`, que e justamente o texto SEM as opcoes (para nao
 * medir a opcao por engano) — e por isso ela acusava um formulario correto. Os
 * dois instrumentos se completam: `textosDeRotulo` prova que o rotulo NAO veio
 * da opcao, e `opcaoSelecionada` prova QUAL opcao esta ativa.
 *
 * O SEGUNDO, o `10`, esta no `value` do campo de comissao.
 */
const formValores = valoresDe(formHtmlBruto);
const selecionada = opcaoSelecionada(formHtmlBruto);
if (selecionada === 'Percentual (%)' && formValores.includes('10'))
  ok('e abre com `Percentual (%)` e `10`', 'a opcao ATIVA e o `value` do campo');
else fail('valores padrao do formulario', JSON.stringify({ selecionada, valores: formValores }));

/**
 * O SELECT NAO PODE ABRIR NO TIPO ERRADO. `Valor Fixo (R$)` esta no `<select>`
 * sempre — e por isso ele NAO pode aparecer como selecionado. Sem esta prova, a
 * anterior passaria com os dois campos trocados.
 */
if (selecionada !== 'Valor Fixo (R$)')
  ok('e a opcao ativa NAO e `Valor Fixo (R$)`', 'o formulario abre no percentual, como o print');
else fail('o formulario abriu no tipo fixo', 'invertido em relacao ao print');

if (formTexto.includes('Nova Afiliada')) ok('o titulo e `Nova Afiliada`', 'o `val.id` vazio decide');
else fail('titulo do modal', formTexto.slice(0, 100));

if (formTexto.includes('Cancelar') && formTexto.includes('Salvar'))
  ok('o rodape tem `Cancelar` e `Salvar`', 'como o print');
else fail('rodape do modal', 'faltou um dos dois botoes');

/**
 * O TITULO MUDA COM O MODO — e o `id` e o unico campo que decide isso. O
 * original escreve `{val.id ? "Editar" : "Nova"} Afiliada`.
 */
const formEdicaoBruto = render(AffiliateForm, {
  draft: formulario.draftFromAffiliate(aff),
  errors: {},
  saving: false,
  outcome: 'none',
  onChange: () => {},
  onCancel: () => {},
  onSubmit: () => {},
});
const formEdicao = textosDeRotulo(formEdicaoBruto);

if (formEdicao.includes('Editar Afiliada')) ok('em edicao o titulo vira `Editar Afiliada`', 'o `id` preenchido decide');
else fail('titulo em edicao', formEdicao.slice(0, 100));

/**
 * OS VALORES DA AFILIADA VEM NO ATRIBUTO `value` — nao em texto visivel. O
 * `Nome` do modo NOVO e o `value` do modo EDICAO sao o MESMO campo lido de dois
 * lugares diferentes; por isso os dois instrumentos existem.
 */
const valoresEdicao = valoresDe(formEdicaoBruto);
if (valoresEdicao.includes('Carinna') && valoresEdicao.includes('CARINNAS') && valoresEdicao.includes('lucasmuniz19w@gmail.com'))
  ok('e o formulario abre preenchido com a afiliada', 'nome, cupom e e-mail no atributo `value`');
else fail('formulario de edicao vazio', valoresEdicao.slice(0, 140));

/**
 * O MODO DE EDICAO NAO PODE TRAZER OS PLACEHOLDERS DO MODO NOVO PREENCHIDOS POR
 * ENGANO — e o contrario tambem. Aqui a assercao e a que separa os dois
 * instrumentos: `Carinna` nao pode aparecer como `placeholder`.
 */
if (!placeholdersDe(formEdicaoBruto).includes('Carinna'))
  ok('e `Carinna` NAO virou placeholder', 'o valor esta em `value`, nao em `placeholder`');
else fail('valor e placeholder se misturaram', 'os dois instrumentos medem a mesma coisa');

/* ------------------------------------------------- 9. as duas transformacoes */

console.log('\n9. o cupom em maiuscula e o slug com hifen');

const subiu = formulario.applyCouponCode(rascunho, 'carinnas');
if (subiu.couponCode === 'CARINNAS') ok('o cupom sobe para MAIUSCULA', 'a cada tecla, como o original');
else fail('cupom nao subiu', subiu.couponCode);

const slug1 = formulario.applyReferralSlug(rascunho, 'Luna 10');
if (slug1.referralSlug === 'luna-10') ok('o slug desce e o espaco vira hifen', '`Luna 10` -> `luna-10`');
else fail('slug', slug1.referralSlug);

/**
 * O `replace` PRECISA DO `/g`. Sem ele, so o PRIMEIRO espaco vira hifen e o
 * segundo sobrevive dentro do slug — `luna-10 pro`. O original tem o `/g`, e o
 * defeito passaria despercebido com um slug de uma palavra so.
 */
const slug2 = formulario.applyReferralSlug(rascunho, 'Luna 10 Pro');
if (slug2.referralSlug === 'luna-10-pro') ok('os DOIS espacos viram hifen', 'o `/g` do `replace`');
else fail('o `replace` perdeu o `/g`', slug2.referralSlug);

/* ------------------------------------------------------- 10. a validacao */

console.log('\n10. a validacao — o que o original NAO checa');

/**
 * O ORIGINAL NAO VALIDA NADA. O `save()` dele e um `upsert` e um `toast` — quem
 * recusa e o BANCO. A bancada prova que este modulo NAO inventou
 * obrigatoriedade: um rascunho com nome, e-mail e cupom VAZIOS passa limpo.
 *
 * Se esta assercao ficar vermelha, a tela passou a recusar uma afiliada que a
 * referencia ACEITA — e a correcao nao e "ajustar a bancada".
 */
const errosVazio = formulario.validateDraft(rascunho, [], undefined);
if (!formulario.hasErrors(errosVazio)) ok('nome, e-mail e cupom vazios PASSAM', 'o original nao valida nada — fiel');
else fail('o modulo inventou obrigatoriedade', JSON.stringify(errosVazio));

const escolhido = formulario.draftFromAffiliate(aff);
const errosDuplicado = formulario.validateDraft(escolhido, demo.DEMO_AFFILIATES, undefined);
if (errosDuplicado.couponCode) ok('mas um cupom REPETIDO acusa no campo', 'a divergencia declarada');
else fail('cupom duplicado passou', JSON.stringify(errosDuplicado));

/**
 * O `exceptId` e o que permite EDITAR a afiliada sem ela conflitar consigo
 * mesma. Salvar o mesmo cupom mantendo o proprio id NAO pode acusar.
 */
const errosProprio = formulario.validateDraft(escolhido, demo.DEMO_AFFILIATES, 'aff-01');
if (!errosProprio.couponCode) ok('editar mantendo o proprio cupom NAO acusa', 'o `exceptId` funciona');
else fail('conflito consigo mesma', JSON.stringify(errosProprio));

/**
 * DOIS E-MAILS VAZIOS NAO SAO DUPLICATA UM DO OUTRO. O e-mail nao e obrigatorio
 * na tela, e um `emailTaken` que tratasse `'' === ''` como conflito recusaria a
 * segunda afiliada cadastrada sem e-mail.
 */
if (!metricas.emailTaken([aff], '', undefined)) ok('dois e-mails VAZIOS nao sao duplicata', 'senao a 2a afiliada sem e-mail seria recusada');
else fail('e-mail vazio acusou conflito', 'a regra do e-mail vazio');

const errosEmail = formulario.validateDraft(
  { ...rascunho, email: 'LUCASMUNIZ19W@GMAIL.COM' },
  demo.DEMO_AFFILIATES,
  undefined,
);
if (errosEmail.email) ok('e o e-mail e comparado sem diferenciar caixa', 'a mesma conta nao entra duas vezes');
else fail('e-mail com caixa diferente nao acusou', JSON.stringify(errosEmail));

/* ------------------------------------------ 11. a escrita NAO finge gravar */

console.log('\n11. a escrita');

const resultSalvar = await dados.saveAffiliate(aff);
if (resultSalvar.persisted === false && typeof resultSalvar.reason === 'string')
  ok('`saveAffiliate` NAO finge gravar', '`persisted: false`, com o motivo — o original faz `toast.success`');
else fail('a escrita fingiu persistir', JSON.stringify(resultSalvar));

const resultStatus = await dados.setAffiliateStatus(aff, 'suspended');
if (resultStatus.persisted === false && resultStatus.data.status === 'suspended')
  ok('`setAffiliateStatus` troca o status sem gravar', 'a acao da linha, separada do formulario');
else fail('troca de status', JSON.stringify(resultStatus));

/**
 * O STATUS DE UMA SUSPENSA SOBREVIVE A UMA EDICAO DO NOME.
 *
 * Este e o defeito que o formulario nao ve: ele NAO edita status, e um
 * `draftToAffiliate` que zerasse o status para `active` REATIVARIA a afiliada so
 * porque alguem corrigiu o nome dela. Ninguem pediu isso e o print nao mostra.
 */
const suspensa = { ...aff, status: 'suspended' };
const editada = formulario.draftToAffiliate(formulario.draftFromAffiliate(suspensa), suspensa);
if (editada.status === 'suspended') ok('editar uma SUSPENSA nao a reativa', 'o status vem do registro, nao do rascunho');
else fail('a edicao reativou a afiliada', editada.status);

/**
 * E OS QUATRO CAMPOS QUE O FORMULARIO NAO TOCA SAO PRESERVADOS INTEIROS. Sem
 * isto, o primeiro salvamento com o Neon ligado apagaria `bank_info` — o defeito
 * que o tipo inteiro existe para evitar.
 */
const comBanco = { ...aff, bankInfo: { agencia: '1', conta: '2' }, userId: 'u-9' };
const preservada = formulario.draftToAffiliate(formulario.draftFromAffiliate(comBanco), comBanco);
if (mesmo(preservada.bankInfo, { agencia: '1', conta: '2' }) && preservada.userId === 'u-9')
  ok('`bankInfo` e `userId` ATRAVESSAM a edicao', 'o `upsert` grava o objeto inteiro');
else fail('campo preservado se perdeu', JSON.stringify({ bankInfo: preservada.bankInfo, userId: preservada.userId }));

/**
 * CAMPO VAZIO NAO VIRA `NaN`. O `<input>` deixa passar texto nao numerico em
 * alguns navegadores, e `NaN` no banco e um registro quebrado.
 */
const comTexto = formulario.draftToAffiliate({ ...rascunho, commissionValue: 'abc' }, aff);
if (Number.isFinite(comTexto.commissionValue) && comTexto.commissionValue === 0)
  ok('um valor nao numerico vira `0`, e nao `NaN`', '`NaN` no banco seria registro quebrado');
else fail('valor invalido virou NaN', String(comTexto.commissionValue));

/* --------------------------------------------------------------- 12. contagem */

console.log('\n12. a contagem — `cadastradas` NAO e `ativas`');

const umaAtiva = metricas.countActive(demo.DEMO_AFFILIATES);
if (umaAtiva === 1 && demo.DEMO_AFFILIATES.length === 1) ok('com uma ativa os dois numeros batem', '1 e 1');
else fail('contagem', `${umaAtiva} / ${demo.DEMO_AFFILIATES.length}`);

const duas = [aff, { ...aff, id: 'aff-02', status: 'suspended', couponCode: 'OUTRA' }];
if (metricas.countActive(duas) === 1 && duas.length === 2)
  ok('e com uma suspensa eles DIVERGEM', '`countActive`=1 contra `length`=2 — o erro facil de cometer');
else fail('`countActive` virou `length`', `${metricas.countActive(duas)} / ${duas.length}`);

/* ---------------------------------------------- 13. a ordenacao e a lista vazia */

console.log('\n13. a ordenacao e a lista vazia');

const comDatas = [
  { ...aff, id: 'velha', name: 'Ana', createdAt: '2026-01-01T00:00:00' },
  { ...aff, id: 'nova', name: 'Bia', createdAt: '2026-09-01T00:00:00' },
];
if (metricas.sortAffiliates(comDatas)[0].id === 'nova') ok('a mais recente vem primeiro', 'o `created_at desc` do original');
else fail('ordenacao', metricas.sortAffiliates(comDatas)[0].id);

const mesmaData = [
  { ...aff, id: 'a', name: 'Zelia', createdAt: '2026-06-01T00:00:00' },
  { ...aff, id: 'b', name: 'Ana', createdAt: '2026-06-01T00:00:00' },
];
if (metricas.sortAffiliates(mesmaData)[0].name === 'Ana') ok('empate desempata pelo nome', 'a lista nao pula entre renderizacoes');
else fail('desempate', metricas.sortAffiliates(mesmaData)[0].name);

const vazia = textos(render(AffiliateTable, { rows: [], onEdit: () => {}, onToggle: () => {} }));
if (vazia.includes('Nenhuma afiliada cadastrada')) ok('a lista vazia tem mensagem propria', 'uma ADICAO declarada — o original nao tem estado vazio');
else fail('estado vazio', vazia.slice(0, 80));

/**
 * `semComentarios` NAO PODE COMER CODIGO JUNTO — senao todas as assercoes de
 * texto limpo passariam por vaculdade em vez de por o defeito nao existir.
 */
if (!limpoTabela.includes('adm-021') && limpoTabela.includes('TableHeaderCell') && limpoTabela.includes('formatCommission'))
  ok('`semComentarios` tirou o comentario e preservou o codigo', 'o instrumento continua exato');
else fail('`semComentarios` comeu codigo junto', 'o instrumento ficou cego, nao exato');

/* ---------------------------------------------------------- 14. a rota */

console.log('\n14. a rota');

const pageSrc = arquivo('src/app/admin/afiliadas/page.tsx');
const limpoPage = semComentarios(pageSrc);

if (existsSync(join(SRC, 'app/admin/afiliadas/page.tsx'))) ok('a rota existe', '/admin/afiliadas');
else fail('rota', 'page.tsx ausente');

if (limpoPage.includes('AffiliatesView')) ok('a pagina aponta para a tela', '`AffiliatesView`');
else fail('a pagina nao monta a tela', limpoPage.slice(0, 120));

if (!limpoPage.includes('ModulePage')) ok('a pagina NAO usa mais o placeholder', 'o `ModulePage` foi removido');
else fail('o placeholder continua', '`ModulePage` ainda importado');

/**
 * A REFERENCIA ERRADA NAO PODE VOLTAR AO CODIGO — e a divergencia tem que ficar
 * REGISTRADA, e nao apagada.
 *
 * A ASSERCAO ANTERIOR MEDIA O NADA, e por isso foi reescrita. Ela exigia
 * `adm-022 a adm-023` no codigo limpo e recusava a pagina por nao encontrar —
 * mas a pagina nao MENCIONA a faixa antiga em lugar nenhum, nem no comentario:
 * ela a descreve por extenso ("o terceiro numero citado na faixa"). As duas
 * assercoes eram uma contradicao — a mesma prova queria a string presente no
 * codigo E ausente dele.
 *
 * (O comentario chegou a conter a string literal, e foi trocado por extenso
 * justamente porque cita-la ali a mantinha viva no arquivo — que e a armadilha
 * que `semComentarios` existe para contornar, e que nao vale a pena armar.)
 *
 * O QUE A PROVA PODE MEDIR sem depender de uma string que o modulo escolheu nao
 * escrever: que o CODIGO limpo nao traz `references` nenhum (a prop do
 * placeholder sumiu) e que a pagina MONTA a tela de verdade.
 */
if (!limpoPage.includes('references=') && !limpoPage.includes('adm-02'))
  ok('a referencia errada saiu do CODIGO', 'nao ha mais faixa de prints — nem `references`');
else fail('ainda ha faixa de prints no codigo', limpoPage.slice(0, 160));

if (limpoPage.includes('AffiliatesView') && limpoPage.includes('export default'))
  ok('e a pagina e a tela de verdade', 'nao sobrou prop de exibicao do placeholder');
else fail('a pagina nao e a tela', limpoPage.slice(0, 160));

/**
 * E O ERRO FICOU REGISTRADO NO COMENTARIO — medido no arquivo INTEIRO, que e o
 * certo aqui: o registro e a razao de o comentario existir, e ele cita a faixa
 * antiga por extenso. As duas provas sao complementares por construcao: uma
 * olha o codigo, a outra o comentario.
 */
if (pageSrc.includes('adm-021 e adm-022') && pageSrc.includes('FINANCEIRO'))
  ok('e o erro ficou DOCUMENTADO no comentario', 'a faixa certa e o modulo que a antiga invadia');
else fail('a divergencia nao ficou registrada', 'o comentario da pagina nao registra a correcao');

/* ------------------------------------------------- 15. provas ao contrario */

console.log('\n15. as provas ao contrario');

let quebrado = 0;

// (a) `formatCommission` NAO pode imprimir reais no ramo percentual.
if (metricas.formatCommission({ commissionType: 'percentage', commissionValue: 5 }) !== utils.formatBRL(5)) { quebrado += 0; } else { quebrado += 1; }

// (b) `formatReferral` NAO pode devolver so o slug, sem a barra.
if (metricas.formatReferral({ referralSlug: 'luna10' }) !== 'luna10') { quebrado += 0; } else { quebrado += 1; }

// (c) `affiliateStatusLabel` NAO pode TRADUZIR: `ACTIVE` nao e `Ativa`.
if (metricas.affiliateStatusLabel('active') !== 'Ativa') { quebrado += 0; } else { quebrado += 1; }

// (d) `toggleActionLabel` NAO pode devolver o status atual em vez da acao.
if (metricas.toggleActionLabel('active') !== 'active') { quebrado += 0; } else { quebrado += 1; }

// (e) `nextStatus` NAO pode ser identidade.
if (metricas.nextStatus('active') !== 'active') { quebrado += 0; } else { quebrado += 1; }

// (f) `countActive` NAO pode ser o `length`.
if (metricas.countActive(duas) !== duas.length) { quebrado += 0; } else { quebrado += 1; }

// (g) `emailTaken` NAO pode tratar vazio como igual a vazio.
if (metricas.emailTaken([{ ...aff, email: '' }], '', undefined) === false) { quebrado += 0; } else { quebrado += 1; }

// (h) `sortAffiliates` NAO pode ordenar crescente, nem ser identidade.
if (metricas.sortAffiliates(comDatas)[0].id === 'nova') { quebrado += 0; } else { quebrado += 1; }

// (i) `naOrdem` NAO pode dar verde com o cabecalho embaralhado, nem com duas
//     agulhas caindo no mesmo trecho — o caso exato que quase cegou a bancada
//     anterior.
if (naOrdem('beta alfa', ['alfa', 'beta']).ok === false) { quebrado += 0; } else { quebrado += 1; }
if (naOrdem('X Status Y', ['Status', 'Status']).ok === false) { quebrado += 0; } else { quebrado += 1; }

// (j) `rotulosDeColuna` NAO pode devolver vazio quando HA colunas — um
//     instrumento cego daria `[]` e a igualdade posicional passaria a medir o
//     nada. E NAO pode colher um rotulo de um `import`: e exatamente o defeito
//     que ele existe para corrigir.
if (mesmo(rotulosDeColuna('<TableHeaderCell>Nome</TableHeaderCell><TableHeaderCell>Status</TableHeaderCell>'), ['Nome', 'Status'])) { quebrado += 0; } else { quebrado += 1; }
if (rotulosDeColuna("import { affiliateStatusLabel } from './metrics';").length === 0) { quebrado += 0; } else { quebrado += 1; }

// (k) `opcaoSelecionada` NAO pode devolver a PRIMEIRA opcao sempre — senao a
//     prova do tipo de comissao mediria a ordem do `<select>` e nao a selecao.
const doisSelects = '<option value="percentage">Percentual (%)</option><option value="fixed" selected="">Valor Fixo (R$)</option>';
if (opcaoSelecionada(doisSelects) === 'Valor Fixo (R$)') { quebrado += 0; } else { quebrado += 1; }

// (l) `placeholdersDe` NAO pode devolver o texto visivel — se devolvesse, a
//     prova dos quatro campos mediria o titulo em vez do atributo.
if (!placeholdersDe('<h2>Nome</h2>').includes('Nome')) { quebrado += 0; } else { quebrado += 1; }

if (quebrado === 0) ok('as treze provas ao contrario falharam como deviam', 'o instrumento acusa defeito');
else fail('a bancada passaria em qualquer coisa', `${quebrado} de 13 provas ao contrario nao acusaram`);

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
