/**
 * Bancada do modulo Cupons.
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o
 * `next/font/google` espera as fontes para sempre). Sem esta bancada, a unica
 * garantia seria o typecheck — que nao renderiza, nao formata e nao ve o ramo
 * invertido.
 *
 * O QUE ELA PROVA, EM ORDEM
 *
 *   1. os .ts/.tsx do modulo EMITEM sem erro e os `@/` resolvem em execucao;
 *   2. o cupom do material, campo por campo, como adm-012 o mostra;
 *   3. as SETE colunas, na ordem do print, e que todas alinham a ESQUERDA;
 *   4. que `MIN.` e `—` e nao `R$ 0,00` — a regra que o print fixa;
 *   5. que USOS e VALIDADE formatam certo, e que ILIMITADO nao e 0;
 *   6. as tres validacoes do original, palavra por palavra;
 *   7. que o codigo sobe para maiuscula e que `valor` vazio nao vira 0;
 *   8. que as DATAS nao trocam de dia pelo fuso (o defeito do `T00:00:00`);
 *   9. que `SALVAR` NAO finge gravar (`persisted: false`), como no original;
 *  10. que a tela renderiza o formulario com os ONZE campos e os valores padrao
 *      que o print mostra preenchidos;
 *  11. `topUsedCoupons` — o dado do card `Cupons mais usados` de adm-014;
 *  12. a rota existe e nao usa mais o placeholder;
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
  console.error('uso: node bench-cupons.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cupons');

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
  /src[\\/](lib[\\/]cupons|components[\\/]admin[\\/]cupons|app[\\/]admin[\\/]cupons)[\\/]/.test(f),
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

const dados = require(join(OUT, 'src/lib/cupons/data.js'));
const demo = require(join(OUT, 'src/lib/cupons/demo.js'));
const metricas = require(join(OUT, 'src/lib/cupons/metrics.js'));
const formulario = require(join(OUT, 'src/lib/cupons/form.js'));
const utils = require(join(OUT, 'src/lib/utils.js'));
const { CouponTable } = require(join(OUT, 'src/components/admin/cupons/coupon-table.js'));
const { CouponForm } = require(join(OUT, 'src/components/admin/cupons/coupon-form.js'));

/* ------------------------------------------------------------- utilidades */

/**
 * Texto visivel. NBSP (U+00A0) e normalizado nos DOIS lados — o
 * `toLocaleString('pt-BR')` usa espaco inquebravel e o `\s` do JS nao o pega.
 */
const normalizar = (s) => s.replace(/[\s  ]+/g, ' ').trim();
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
 * Sem isto a bancada mede o nada no rotulo condicional: o `<select>` de `Tipo`
 * carrega as duas opcoes SEMPRE, entao `Percentual (%)` aparece no HTML mesmo
 * com o tipo em `Valor fixo` — e a prova de que o rotulo mudou passaria a medir
 * a opcao em vez do rotulo. Foi um falso positivo que so apareceu ao conferir o
 * texto que a assercao realmente le.
 */
function textosDeRotulo(html) {
  return textos(html.replace(/<option[\s\S]*?<\/option>/g, ' '));
}

/**
 * O CODIGO DE UM ARQUIVO, SEM OS COMENTARIOS.
 *
 * A licao veio da bancada de Pedidos, onde DUAS assercoes passaram a medir o
 * comentario em vez do codigo: a documentacao da correcao CITA a string
 * procurada, entao a agulha casava dentro da explicacao e a bancada acusava um
 * defeito que nao existia.
 *
 * A armadilha JA ESTA ARMADA nesta bancada: a `page.tsx` cita
 * `references="adm-012 a adm-013"` num comentario que registra a referencia
 * errada, e o `data.ts` cita `persisted: true` num comentario que explica por
 * que ele nunca acontece. As assercoes correspondentes medem o texto LIMPO.
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
 * Comparar `posicoes` com `[...posicoes].sort()` PASSA quando duas agulhas caem
 * no mesmo lugar (as duas posicoes empatam e o array ja esta "ordenado"). Foi
 * assim que a bancada de Carrinho Abandonado quase deu verde para uma tabela
 * desalinhada: a agulha `'Status'` casou dentro de `CartStatus`. Aqui a
 * assercao exige ordem ESTRITAMENTE crescente.
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

/* --------------------------------------------- 1. o cupom do material */

console.log('\n1. o cupom `CLOSET10` — adm-012');

const conjunto = await dados.listCoupons();

if (conjunto.data.length === 1) ok('ha UM cupom cadastrado', 'igual ao `1 cupom(s) cadastrados`');
else fail('numero de cupons', String(conjunto.data.length));

const cupom = conjunto.data[0];

/**
 * OS SEIS CAMPOS DA TABELA, conferidos contra o print coluna por coluna.
 *
 * Esta assercao e o coracao da bancada: ela prende o dado ao print. Se alguem
 * "melhorar" o cupom — dar um nome interno, encher a quantidade maxima, mudar o
 * desconto — a bancada cai e diz qual campo mudou.
 */
const esperado = {
  code: 'CLOSET10',
  kind: 'percent',
  value: 10,
  minSubtotal: 0,
  maxUses: null,
  isActive: true,
  usesCount: 0,
};
const campoDivergente = Object.keys(esperado).find((campo) => cupom[campo] !== esperado[campo]);
if (!campoDivergente) ok('o cupom bate com o print campo por campo', 'codigo, tipo, valor, minimo, teto, status e usos');
else fail('campo divergente', `${campoDivergente} = ${JSON.stringify(cupom[campoDivergente])}, esperado ${JSON.stringify(esperado[campoDivergente])}`);

// A validade e a UNICA data que o material mostra para o cupom.
const validade = utils.formatDate(cupom.expiresAt);
if (validade === '20/08/2026') ok('VALIDADE = 20/08/2026', 'a data do print');
else fail('validade', validade);

/**
 * ...E A DATA NAO ESCORREGA DE DIA.
 *
 * Esta e a prova que pega o defeito classico de `new Date('2026-08-20')`: sem
 * hora, o JS interpreta o texto como UTC, e num fuso a oeste (o Brasil e UTC-3)
 * `20/08` vira `19/08`. O dado aqui tem `T00:00:00` SEM `Z`, que e o dia local.
 * A prova compara as partes LOCAIS da data, e nao o ISO — comparar o ISO daria
 * verde nos dois casos.
 */
const local = new Date(cupom.expiresAt);
if (local.getFullYear() === 2026 && local.getMonth() === 7 && local.getDate() === 20)
  ok('e o dia LOCAL e 20, e nao 19', 'o `T00:00:00` sem `Z` protege o fuso');
else fail('a data escorregou de dia', `${local.getFullYear()}-${local.getMonth() + 1}-${local.getDate()}`);

/* ------------------------------------------------- 2. as sete colunas */

console.log('\n2. a tabela — as colunas do print');

const tabelaSrc = semComentarios(arquivo('components/admin/cupons/coupon-table.tsx'));
/**
 * AS AGULHAS SAO AS PROPS DO CABECALHO, e nao os rotulos soltos — duas razoes:
 *
 *   1. um rotulo curto como `Mín.` ou `Usos` pode aparecer antes da tabela, num
 *      comentario ou num map de status, e a posicao sairia errada;
 *   2. assim a prova mede tambem o ALINHAMENTO. No print, TODAS as seis colunas
 *      tem o titulo a ESQUERDA — inclusive DESCONTO, MIN., USOS e VALIDADE. Nao
 *      ha `align="right"` em nenhuma delas, e uma que ganhasse `align` sem o
 *      print mudar seria uma divergencia silenciosa.
 */
const colunas = [
  '<TableHeaderCell>Código',
  '<TableHeaderCell>Desconto',
  '<TableHeaderCell>Mín.',
  '<TableHeaderCell>Usos',
  '<TableHeaderCell>Validade',
  '<TableHeaderCell>Status',
];
const ordem = naOrdem(tabelaSrc, colunas);
if (ordem.ok) ok('as seis colunas, na ordem do print', ordem.detalhe);
else fail('colunas da tabela', ordem.detalhe);

if (!/<TableHeaderCell align="(right|center)">(Código|Desconto|Mín\.|Usos|Validade|Status)/.test(tabelaSrc))
  ok('e todas alinham o titulo a ESQUERDA', 'como no print — nenhuma coluna de numero virou a direita');
else fail('alinhamento de coluna', 'alguma coluna do print ficou a direita ou centralizada');

// A setima coluna e a das acoes, e ela nao tem titulo visivel.
if (tabelaSrc.includes('sr-only') && tabelaSrc.includes('Ações'))
  ok('e ha a coluna de acoes, sem titulo visivel', 'o print nao mostra cabecalho para Editar/Excluir');
else fail('coluna de acoes', 'a setima coluna sumiu ou ganhou titulo');

// As duas acoes do print, com os dois rotulos exatos.
if (tabelaSrc.includes('Editar') && tabelaSrc.includes('Excluir'))
  ok('as acoes sao `Editar` e `Excluir`', 'caixa normal, como no print');
else fail('acoes da linha', 'Editar ou Excluir sumiu');

/* ------------------------------------------- 3. `MIN.` e `—`, nao `R$ 0,00` */

console.log('\n3. a coluna `Mín.` — a regra que o print fixa');

if (metricas.formatMinSubtotal(cupom, utils.formatBRL) === '—')
  ok('pedido minimo ZERO imprime travessao', 'e nao `R$ 0,00` — o print mostra `—`');
else fail('`Mín.` com minimo zero', metricas.formatMinSubtotal(cupom, utils.formatBRL));

/**
 * ...E O TRAVESSAO NAO E UM ZERO DISFARCADO. Com um minimo real, a coluna
 * precisa MUDAR. Sem esta prova, um `return '—'` fixo passaria na assercao de
 * cima.
 */
const comMinimo = { ...cupom, minSubtotal: 150 };
if (normalizar(metricas.formatMinSubtotal(comMinimo, utils.formatBRL)) === 'R$ 150,00')
  ok('e com pedido minimo de R$ 150,00 ela mostra o valor', 'a coluna e calculada, e nao fixa em travessao');
else fail('`Mín.` com valor', metricas.formatMinSubtotal(comMinimo, utils.formatBRL));

// ...e um minimo NEGATIVO (dado corrompido) nao pode virar `R$ -10,00`.
if (metricas.formatMinSubtotal({ ...cupom, minSubtotal: -10 }, utils.formatBRL) === '—')
  ok('e minimo negativo cai no travessao', 'nao imprime valor negativo');
else fail('minimo negativo', metricas.formatMinSubtotal({ ...cupom, minSubtotal: -10 }, utils.formatBRL));

/* --------------------------------------------- 4. USOS, VALIDADE e desconto */

console.log('\n4. `Usos`, `Validade` e `Desconto`');

if (metricas.formatUses(cupom) === '0') ok('USOS = 0', 'o cupom nunca foi usado');

/**
 * ILIMITADO NAO E ZERO. O campo `Quantidade maxima` em branco significa usos
 * sem fim (`em branco = ilimitado`), e a coluna imprime so o numero usado. Com
 * um teto, ela imprime `usado / teto`.
 */
if (metricas.formatUses({ usesCount: 3, maxUses: null }) === '3')
  ok('sem teto, USOS mostra so o numero usado', 'ilimitado');
else fail('usos sem teto', metricas.formatUses({ usesCount: 3, maxUses: null }));

if (metricas.formatUses({ usesCount: 3, maxUses: 100 }) === '3 / 100')
  ok('com teto, mostra `usado / teto`', 'a forma do original');
else fail('usos com teto', metricas.formatUses({ usesCount: 3, maxUses: 100 }));

// Teto ZERO nao pode ser confundido com ilimitado: `0 / 0` seria mentira.
if (metricas.formatUses({ usesCount: 0, maxUses: 0 }) === '0 / 0')
  ok('e teto ZERO nao vira ilimitado', '`null` e o unico ilimitado');
else fail('teto zero', metricas.formatUses({ usesCount: 0, maxUses: 0 }));

if (metricas.formatDiscount(cupom) === '10%') ok('DESCONTO = 10%', 'percentual, e nao `R$ 10,00`');
else fail('desconto percentual', metricas.formatDiscount(cupom));

if (normalizar(metricas.formatDiscount({ kind: 'fixed', value: 20 })) === 'R$ 20,00')
  ok('e o valor fixo sai em reais', 'o outro ramo do `Tipo` formata diferente');
else fail('desconto fixo', metricas.formatDiscount({ kind: 'fixed', value: 20 }));

// A validade ausente e travessao, e nao `Invalid Date`.
const semValidade = metricas.formatExpiry({ expiresAt: null }, utils.formatDate);
const validadeInvalida = metricas.formatExpiry({ expiresAt: 'nao e data' }, utils.formatDate);
if (semValidade === '—' && validadeInvalida === '—')
  ok('sem validade e data invalida dao travessao', 'nunca `Invalid Date` na coluna');
else fail('validade nula ou invalida', `${semValidade} / ${validadeInvalida}`);

/* -------------------------------------------------- 5. as tres validacoes */

console.log('\n5. as tres regras de validacao do original');

const base = formulario.emptyDraft();

/**
 * AS TRES MENSAGENS SAO AS DO ORIGINAL, palavra por palavra — `save()` em
 * `CouponsAdmin`. Se alguem reescrever uma delas, o painel passa a ter duas
 * redacoes para a mesma regra e a bancada avisa.
 */
const vazio = formulario.validateDraft({ ...base, code: '' }, []);
if (vazio.code === 'Informe o código do cupom.') ok('codigo vazio e recusado', 'com a mensagem do original');
else fail('validacao de codigo', String(vazio.code));

const zerado = formulario.validateDraft({ ...base, code: 'X', value: '0' }, []);
if (zerado.value === 'Valor do cupom deve ser maior que zero.') ok('valor zero e recusado', 'a segunda regra do original');
else fail('validacao de valor zero', String(zerado.value));

// ...e valor NEGATIVO tambem: `!(value > 0)` cobre os dois.
const negativo = formulario.validateDraft({ ...base, code: 'X', value: '-5' }, []);
if (negativo.value === 'Valor do cupom deve ser maior que zero.')
  ok('e valor negativo cai na MESMA regra', 'o original usa `!(value > 0)`, que pega os dois');
else fail('validacao de valor negativo', String(negativo.value));

const acima = formulario.validateDraft({ ...base, code: 'X', kind: 'percent', value: '150' }, []);
if (acima.value === 'Percentual máximo é 100%.') ok('percentual acima de 100 e recusado', 'a terceira regra');
else fail('validacao de percentual', String(acima.value));

/**
 * O TETO DE 100% E SO DO PERCENTUAL. `R$ 150,00` de desconto fixo e perfeitamente
 * valido, e recusa-lo seria inventar uma regra que o original nao tem.
 */
const fixo150 = formulario.validateDraft({ ...base, code: 'X', kind: 'fixed', value: '150' }, []);
if (!fixo150.value) ok('mas R$ 150,00 de valor FIXO passa', 'o teto de 100% nao vale para reais');
else fail('valor fixo alto', String(fixo150.value));

/**
 * O QUE O ORIGINAL **NAO** VALIDA, e a bancada exige que continue assim: nome
 * vazio, validade vazia, minimo zero e uso por cliente sem checagem. Inventar
 * obrigatoriedade faria a tela recusar um cupom que a referencia aceita.
 */
const soOcodigo = formulario.validateDraft({ ...base, code: 'OK' }, []);
if (!formulario.hasErrors(soOcodigo))
  ok('e um cupom so com codigo e VALIDO', 'nome, datas e minimo sao opcionais, como no original');
else fail('obrigatoriedade inventada', JSON.stringify(soOcodigo));

// O codigo duplicado e recusado — e nao consigo mesmo, na edicao.
const existente = [cupom];
if (formulario.validateDraft({ ...base, code: 'CLOSET10' }, existente).code === 'Já existe um cupom com este código.')
  ok('codigo repetido e recusado', 'o banco tambem recusaria, mas a mensagem chega no campo');
else fail('codigo duplicado', 'nao foi acusado');

if (!formulario.validateDraft({ ...base, code: 'CLOSET10' }, existente, 'cup-01').code)
  ok('e editar o cupom mantendo o proprio codigo NAO acusa conflito', 'o `exceptId` cobre isso');
else fail('conflito consigo mesmo', 'a edicao do proprio cupom foi recusada');

// A caixa nao diferencia: `closet10` e o mesmo cupom que `CLOSET10`.
if (formulario.validateDraft({ ...base, code: 'closet10' }, existente).code)
  ok('e a comparacao ignora maiuscula/minuscula', 'a loja compara assim');
else fail('caixa do codigo', '`closet10` passou como novo');

/* --------------------------------------- 6. o rascunho e a conversao */

console.log('\n6. o rascunho, o codigo em maiuscula e as datas');

if (formulario.applyCode(base, 'volta10').code === 'VOLTA10')
  ok('o codigo sobe para MAIUSCULA ao digitar', 'senao o cupom some na loja');
else fail('codigo em maiuscula', formulario.applyCode(base, 'volta10').code);

/**
 * O CAMPO VAZIO NAO PODE VIRAR `0`.
 *
 * Aqui esta o motivo de o rascunho guardar `value` como STRING. No original,
 * `<input type="number" value={Number(e.target.value)}>` transforma `''` em `0`,
 * e o React reescreve o campo com `0` — apagar o percentual para redigitar faz
 * aparecer um zero que a pessoa nao digitou. O rascunho em string aceita o
 * estado vazio; a conversao acontece uma vez, ao salvar.
 */
const apagado = formulario.applyCode({ ...base, value: '' }, 'X');
if (apagado.value === '') ok('apagar o valor deixa o campo VAZIO', 'e nao `0`, que e o defeito do input numerico');
else fail('campo apagado', `virou ${JSON.stringify(apagado.value)}`);

// E ao salvar, o vazio vira 0 e a validacao RECUSA — nao grava um cupom invalido.
const salvoVazio = formulario.draftToCoupon({ ...apagado, value: '' }, { id: 'x', createdAt: 'c', usesCount: 0, description: '' });
if (salvoVazio.value === 0 && formulario.validateDraft(apagado, []).value)
  ok('e ao salvar ele vira 0, que a validacao recusa', 'o vazio nao chega ao banco como cupom valido');
else fail('vazio ao salvar', JSON.stringify({ value: salvoVazio.value }));

// A conversao do formulario para o cupom, ida e volta.
const rascunho = formulario.draftFromCoupon(cupom);
if (rascunho.expiresAt === '2026-08-20')
  ok('a validade volta para o campo como `2026-08-20`', 'o formato do `<input type="date">`');
else fail('validade no rascunho', rascunho.expiresAt);

/**
 * `toDateInput` NAO PODE USAR `toLocaleDateString`.
 *
 * Seria o caminho natural para "mostrar a data", e devolveria `20/08/2026`.
 * O `<input type="date">` so aceita `aaaa-mm-dd`, entao ele DESCARTARIA o valor
 * em silencio e o campo apareceria vazio na edicao — nenhum erro, nenhum aviso.
 */
const comToLocale = utils.formatDate(cupom.expiresAt);
if (rascunho.expiresAt !== comToLocale)
  ok('e NAO no formato brasileiro', `\`${comToLocale}\` faria o input descartar o valor em silencio`);
else fail('formato de data do input', 'o campo devolveria o formato que o input recusa');

// Ida e volta completa: rascunho -> cupom -> rascunho nao muda nada.
const ida = formulario.draftToCoupon(rascunho, {
  id: cupom.id,
  createdAt: cupom.createdAt,
  usesCount: cupom.usesCount,
  description: cupom.description,
});
if (mesmo(formulario.draftFromCoupon(ida), rascunho))
  ok('ida e volta rascunho -> cupom -> rascunho nao altera nada', 'nenhum campo se perde na conversao');
else fail('ida e volta', JSON.stringify(formulario.draftFromCoupon(ida)));

/**
 * O `usesCount` E PRESERVADO ao salvar. O formulario nao edita usos; zera-lo ao
 * salvar apagaria o historico so porque alguem corrigiu o nome da campanha.
 */
const comUsos = formulario.draftToCoupon(rascunho, {
  id: cupom.id,
  createdAt: cupom.createdAt,
  usesCount: 42,
  description: 'nota',
});
if (comUsos.usesCount === 42 && comUsos.description === 'nota')
  ok('e os usos e a descricao sobrevivem ao salvar', 'campos fora do formulario nao sao zerados');
else fail('usos perdidos ao salvar', JSON.stringify({ usesCount: comUsos.usesCount }));

/**
 * `usageLimitPerUser` TEM PISO 1. Zero significaria um cupom que ninguem pode
 * usar, e o campo abre com `1` no print. Vazio cai no mesmo piso.
 */
if (formulario.draftToCoupon({ ...rascunho, usageLimitPerUser: '0' }, { id: 'x', createdAt: 'c', usesCount: 0, description: '' }).usageLimitPerUser === 1)
  ok('e `Uso por cliente` tem piso 1', 'zero seria um cupom que ninguem pode usar');
else fail('piso do uso por cliente', 'aceitou zero');

/* ------------------------------------------ 7. `SALVAR` nao finge gravar */

console.log('\n7. `SALVAR` nao mente');

const criado = await dados.createCoupon(cupom);
const alterado = await dados.updateCoupon(cupom);
const excluido = await dados.deleteCoupon('cup-01');
const alternado = await dados.toggleCoupon(cupom, false);

const gravaram = [criado.persisted, alterado.persisted, excluido.persisted, alternado.persisted];
if (gravaram.every((p) => p === false))
  ok('as QUATRO escritas devolvem `persisted: false`', 'criar, atualizar, excluir e alternar');
else fail('alguma escrita fingiu gravar', JSON.stringify(gravaram));

if ([criado, alterado, excluido, alternado].every((r) => typeof r.reason === 'string' && r.reason.length > 0))
  ok('e as quatro devolvem o MOTIVO', 'a tela tem o que dizer ao usuario');
else fail('motivo da nao-gravacao', 'alguma escrita nao devolve motivo');

// O selo de status e uma acao propria, e nao um caso do formulario.
if (alternado.data.isActive === false)
  ok('e alternar o status devolve o cupom com o valor pedido', 'a acao do selo da tabela');
else fail('toggle do status', String(alternado.data.isActive));

/**
 * O `persisted: true` NAO PODE EXISTIR NO MEIO DO CODIGO.
 *
 * A assercao roda sobre o texto LIMPO: o comentario do `data.ts` CITA
 * `toast.success`/`persisted` ao explicar por que a confirmacao do original nao
 * foi reproduzida, e medir o texto cru acusaria o proprio comentario.
 */
const dataLimpo = semComentarios(arquivo('lib/cupons/data.ts'));
if (!/persisted:\s*true/.test(dataLimpo))
  ok('nao ha `persisted: true` no codigo', 'a gravacao falsa nao existe nem escondida');
else fail('gravacao fingida', 'o `data.ts` afirma ter gravado');

/**
 * A TELA NAO PODE AFIRMAR SUCESSO COMO O ORIGINAL FAZ.
 *
 * O original mostra `toast.success("Cupom criado.")`. Reproduzir essa mensagem
 * aqui seria a mentira mais cara do modulo: o cupom apareceria na lista e NAO
 * existiria no banco, e a loja so descobriria quando a cliente tentasse aplicar
 * o codigo no checkout.
 */
/**
 * ...E OS DOIS ARQUIVOS DA TELA ENTRAM NA MEDICAO.
 *
 * O aviso de que nada foi gravado mora no `coupon-form.tsx` (e o `UnsavedNotice`
 * tambem), e o texto de confirmacao que NAO pode existir poderia aparecer em
 * qualquer um dos dois. Medir so a `view` deixaria o arquivo mais provavel de
 * carregar a mensagem de fora da prova.
 */
const telaTexto = textos(
  `${semComentarios(arquivo('components/admin/cupons/cupons-view.tsx'))} ${semComentarios(
    arquivo('components/admin/cupons/coupon-form.tsx'),
  )}`,
);
if (!/cupom criado|cupom atualizado|cupom excluído|criado com sucesso/i.test(telaTexto))
  ok('e a tela NAO diz "cupom criado"', 'a confirmacao do original nao foi copiada');
else fail('mensagem de sucesso', 'a tela afirma ter gravado o cupom');

if (/n[ãa]o foi gravado|nesta sess[ãa]o/i.test(telaTexto))
  ok('e ela AVISA que o cupom nao foi gravado', 'o usuario nao fica enganado');
else fail('aviso de sessao', 'a tela nao diz que o dado nao persiste');

/* --------------------------------------------------- 8. `topUsedCoupons` */

console.log('\n8. o card `Cupons mais usados` de adm-014');

const usados = metricas.topUsedCoupons(conjunto.data);
if (mesmo(usados, [{ code: 'CLOSET10', usesCount: 0 }]))
  ok('o card mostra `CLOSET10` com 0 usos', 'exatamente o que adm-014 mostra');
else fail('cupons mais usados', JSON.stringify(usados));

/**
 * USO ZERO **ENTRA** NA LISTA. A tentacao e filtrar `usesCount > 0`, e essa
 * regra deixaria o card VAZIO — a tela de Campanhas nao reproduziria adm-014,
 * que mostra o cupom com `0 usos`. Esta prova trava a decisao.
 */
if (usados.length === 1) ok('e um cupom com ZERO usos ainda aparece', 'a lista e "os mais usados", nao "os ja usados"');
else fail('uso zero sumiu da lista', 'o filtro `> 0` foi reintroduzido');

// A ORDEM: maior uso primeiro, empate pelo codigo.
const misturado = [
  { ...cupom, id: 'a', code: 'AAA', usesCount: 5 },
  { ...cupom, id: 'b', code: 'BBB', usesCount: 40 },
  { ...cupom, id: 'c', code: 'CCC', usesCount: 5 },
];
const ordenados = metricas.topUsedCoupons(misturado);
if (mesmo(ordenados.map((u) => u.code), ['BBB', 'AAA', 'CCC']))
  ok('e a ordem e por uso, com empate pelo codigo', 'BBB(40) > AAA(5) · CCC(5)');
else fail('ordem dos mais usados', JSON.stringify(ordenados));

// O limite existe porque o print so tem um cupom para mostrar; ele e explicito.
if (metricas.topUsedCoupons(misturado, 2).length === 2)
  ok('e o limite e um parametro', 'adm-014 nao diz quantos cabem — o corte e declarado');
else fail('limite do card', 'nao respeitou o parametro');

/**
 * `topUsedCoupons` NAO PODE ORDENAR O ARRAY DO CHAMADOR. `sort` ordena no lugar,
 * e a lista que chega e o estado do React.
 */
const original = [{ ...cupom, id: 'z', code: 'ZZZ', usesCount: 1 }, { ...cupom, id: 'y', code: 'YYY', usesCount: 9 }];
const copiaAntes = JSON.stringify(original);
metricas.topUsedCoupons(original);
if (JSON.stringify(original) === copiaAntes)
  ok('e ela nao embaralha a lista de quem chamou', 'ordena numa copia');
else fail('mutacao da entrada', 'a lista do chamador foi reordenada');

/* ------------------------------------------------------------ 9. a rota */

console.log('\n9. a rota');

const rotaCrua = arquivo('app/admin/cupons/page.tsx');
const rota = semComentarios(rotaCrua);

if (/export default function CuponsPage/.test(rota)) ok('a rota existe', '/admin/cupons');
else fail('a rota', 'nao exporta a pagina');

if (/from '@\/components\/admin\/cupons\/cupons-view'/.test(rota))
  ok('a pagina aponta para a tela', '`CuponsView`');
else fail('a pagina', 'nao importa a tela');

if (!/ModulePage/.test(rota)) ok('a pagina NAO usa mais o placeholder', 'o `ModulePage` foi removido');
else fail('a pagina ainda e um placeholder', '`ModulePage` continua la');

/**
 * A REFERENCIA ERRADA. O placeholder citava `adm-012 a adm-013`, e o mapa
 * atribui `adm-007, adm-012, adm-013, adm-014` — faltavam o print do estado de
 * carregamento e o print do card que consome o dado daqui.
 */
if (!/references\s*=\s*["']adm-012/.test(rota)) ok('a prop `references` sumiu', 'nao ha mais faixa de prints na prop');
else fail('a prop ainda cita a faixa', 'a referencia errada voltou');

if (/adm-007/.test(rotaCrua) && /adm-014/.test(rotaCrua))
  ok('e os DOIS prints que faltavam estao no comentario', 'adm-007 (carregando) e adm-014 (o card)');
else fail('os prints que faltavam nao estao registrados', 'a correcao nao ficou documentada');

/* ---------------------------------------------- 10. a tela e o formulario */

console.log('\n10. a tela carrega e o formulario renderiza');

const formRender = textos(
  render(CouponForm, {
    draft: formulario.emptyDraft(),
    errors: {},
    editingCode: null,
    saving: false,
    outcome: 'none',
    onChange: () => {},
    onCancel: () => {},
    onSubmit: () => {},
  }),
);

/**
 * OS ONZE ROTULOS DO PRINT, na ordem em que aparecem no arquivo.
 *
 * Os textos sao copiados do print com a grafia exata — `Quantidade máxima (em
 * branco = ilimitado)` com os parenteses, `Nome da Campanha (Interno)` com a
 * maiuscula no meio. O design system poe o rotulo em caixa alta via CSS, entao
 * o TEXTO aqui e o do print, em caixa mista.
 */
const rotulos = [
  'Código',
  'Nome da Campanha (Interno)',
  'Tipo',
  'Percentual (%)',
  'Subtotal mínimo (R$)',
  'Quantidade máxima (em branco = ilimitado)',
  'Início (opcional)',
  'Validade (opcional)',
  'Uso por Cliente',
  'Aplicar em',
  'Status',
];
const faltando = rotulos.filter((r) => !formRender.includes(r));
if (faltando.length === 0) ok('os onze rotulos do print renderizam', `${rotulos.length} campos`);
else fail('rotulos do formulario', `faltam: ${faltando.join(' · ')}`);

// O titulo do bloco, e o botao `Cancelar` em texto.
if (formRender.includes('Novo cupom')) ok('o bloco se chama `Novo cupom`', 'como no print');
else fail('titulo do formulario', 'nao apareceu');

if (formRender.includes('Cancelar')) ok('e tem o `Cancelar` em texto', 'e nao um botao com borda');
else fail('botao cancelar', 'sumiu');

/**
 * OS VALORES PADRAO DO PRINT. adm-013 mostra o formulario ABERTO com cinco
 * campos ja preenchidos. Se o formulario abrisse em branco, a tela nao
 * reproduziria o print — e a bancada de Pedidos ja ensinou que "abre em branco"
 * passa por qualquer conferencia visual.
 */
const padroes = formulario.emptyDraft();
if (padroes.kind === 'percent' && padroes.value === '10' && padroes.minSubtotal === '0' && padroes.usageLimitPerUser === '1' && padroes.applyTo === 'all' && padroes.isActive === true)
  ok('e abre com os CINCO valores do print', '10% · minimo 0 · uso 1 · todo o site · ativo');
else fail('valores padrao do formulario', JSON.stringify(padroes));

// ...e o que o print deixa EM BRANCO continua em branco.
if (padroes.code === '' && padroes.name === '' && padroes.maxUses === '' && padroes.startsAt === '' && padroes.expiresAt === '')
  ok('e os cinco que o print deixa vazios seguem vazios', 'codigo, nome, teto e as duas datas');
else fail('campos que deviam estar vazios', JSON.stringify({ code: padroes.code, maxUses: padroes.maxUses }));

// O rotulo do segundo campo da linha 2 MUDA com o tipo.
const comoFixo = textosDeRotulo(
  render(CouponForm, {
    draft: { ...formulario.emptyDraft(), kind: 'fixed' },
    errors: {},
    editingCode: null,
    saving: false,
    outcome: 'none',
    onChange: () => {},
    onCancel: () => {},
    onSubmit: () => {},
  }),
);
if (comoFixo.includes('Valor (R$)') && !comoFixo.includes('Percentual (%)'))
  ok('e com `Valor fixo` o rotulo vira `Valor (R$)`', 'a condicional do original');
else fail('rotulo condicional', 'nao mudou com o tipo');

// Em modo edicao o titulo mostra o codigo.
const editando = textos(
  render(CouponForm, {
    draft: formulario.draftFromCoupon(cupom),
    errors: {},
    editingCode: 'CLOSET10',
    saving: false,
    outcome: 'none',
    onChange: () => {},
    onCancel: () => {},
    onSubmit: () => {},
  }),
);
if (editando.includes('Editar CLOSET10')) ok('e em edicao o titulo vira `Editar CLOSET10`', 'como o original');
else fail('titulo de edicao', editando.slice(0, 80));

/**
 * A TABELA RENDERIZADA. O unico jeito de conferir o que SAI, e nao o que o
 * arquivo diz: os seis valores do print tem que aparecer na linha unica.
 */
const tabela = textos(
  render(CouponTable, {
    rows: conjunto.data,
    hasFilter: false,
    onEdit: () => {},
    onDelete: () => {},
    onToggle: () => {},
  }),
);
for (const celula of ['CLOSET10', '10%', '20/08/2026', 'Ativo']) {
  if (!tabela.includes(celula)) fail('celula da tabela', `\`${celula}\` nao renderizou`);
}
if (['CLOSET10', '10%', '20/08/2026', 'Ativo'].every((c) => tabela.includes(c)))
  ok('e a linha renderiza os valores do print', 'codigo, desconto, validade e status');

if (tabela.includes('—')) ok('e o `Mín.` sai como travessao na tela', 'nao `R$ 0,00`');
else fail('travessao do minimo na tela', 'nao apareceu');

if (!tabela.includes('Invalid Date')) ok('e nenhuma data invalida vaza', 'o travessao cobre o nulo');
else fail('data invalida na tela', 'apareceu `Invalid Date`');

// A lista vazia tem mensagem propria, e ela e a do original.
const vazia = textos(
  render(CouponTable, { rows: [], hasFilter: false, onEdit: () => {}, onDelete: () => {}, onToggle: () => {} }),
);
if (vazia.includes('Nenhum cupom criado ainda'))
  ok('e a lista vazia diz o que fazer', 'a mensagem do original');
else fail('estado vazio', vazia.slice(0, 80));

/**
 * `semComentarios` NAO PODE COMER CODIGO JUNTO — senao todas as assercoes de
 * texto limpo passariam por vaculdade em vez de por o defeito nao existir.
 */
const limpo = semComentarios(tabelaSrc);
if (!limpo.includes('adm-012') && limpo.includes('TableHeaderCell') && limpo.includes('formatDiscount'))
  ok('`semComentarios` tirou o comentario e preservou o codigo', 'o instrumento continua exato');
else fail('`semComentarios` comeu codigo junto', 'o instrumento ficou cego, nao exato');

/* ------------------------------------------------- 11. provas ao contrario */

console.log('\n11. as provas ao contrario');

let quebrado = 0;

// (a) `formatUses` NAO pode tratar `null` como zero.
if (metricas.formatUses({ usesCount: 7, maxUses: null }) !== '7 / 0') { quebrado += 0; } else { quebrado += 1; }

// (b) `formatMinSubtotal` NAO pode ser identidade: zero tem que virar travessao.
if (metricas.formatMinSubtotal({ minSubtotal: 0 }, utils.formatBRL) !== utils.formatBRL(0)) { quebrado += 0; } else { quebrado += 1; }

// (c) `sortCoupons` NAO pode ordenar crescente, nem ser identidade.
const dois = [
  { ...cupom, id: 'novo', code: 'NOVO', createdAt: '2026-09-01T00:00:00' },
  { ...cupom, id: 'velho', code: 'VELHO', createdAt: '2026-01-01T00:00:00' },
];
if (metricas.sortCoupons(dois)[0].id === 'novo') { quebrado += 0; } else { quebrado += 1; }

// (d) `codeTaken` NAO pode ignorar o `exceptId`.
if (!metricas.codeTaken(existente, 'CLOSET10', 'cup-01')) { quebrado += 0; } else { quebrado += 1; }

// (e) `isRedeemableNow` NAO pode ignorar as datas. O relogio entra por
//     parametro — um `new Date()` escondido dentro tornaria isto impossivel.
const expirado = { ...cupom, expiresAt: '2026-08-20T23:59:59' };
const vencido = metricas.isRedeemableNow(expirado, new Date('2026-09-01T00:00:00'));
const valido = metricas.isRedeemableNow(expirado, new Date('2026-08-20T12:00:00'));
if (vencido === false && valido === true) { quebrado += 0; } else { quebrado += 1; }

// (f) `naOrdem` NAO pode dar verde com o cabecalho embaralhado, nem com duas
//     agulhas caindo no mesmo trecho — o caso exato que quase cegou a bancada
//     anterior.
if (naOrdem('beta alfa', ['alfa', 'beta']).ok === false) { quebrado += 0; } else { quebrado += 1; }
if (naOrdem('X Status Y', ['Status', 'Status']).ok === false) { quebrado += 0; } else { quebrado += 1; }

if (quebrado === 0) ok('as sete provas ao contrario falharam como deviam', 'o instrumento acusa defeito');
else fail('a bancada passaria em qualquer coisa', `${quebrado} de 7 provas ao contrario nao acusaram`);

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
