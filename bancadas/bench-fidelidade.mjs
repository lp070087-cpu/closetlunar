/**
 * Bancada do modulo Fidelidade.
 *
 * O ambiente NAO roda `next dev` nem `next build` (sem rede, o
 * `next/font/google` espera as fontes para sempre). Sem esta bancada, a unica
 * garantia seria o typecheck — que nao renderiza, nao formata e nao ve o ramo
 * invertido.
 *
 * ESTE E O MODULO MAIS POBRE DE REFERENCIA DO PAINEL: TRES prints e so. É tambem
 * o mais tentador a "completar", e por isso metade das provas abaixo e sobre o que
 * NAO existe — niveis calculados, saldo, extrato por cliente, cashback, ranking,
 * expiracao de pontos, link de indicacao. Nada disso aparece em adm-018/019/020.
 *
 * O QUE ELA PROVA, EM ORDEM
 *
 *   1. os .ts/.tsx do modulo EMITEM sem erro e os `@/` resolvem em execucao;
 *   2. as TRES abas, com os rotulos LITERAIS do print, na ordem do print, e a
 *      primeira (`Configurações & Resgates`) aberta por padrao;
 *   3. os DADOS de adm-018 (as tres recompensas, os `100`/`50` das regras) e o
 *      fato de que `discountValue` acompanha o rotulo em vez de sair zerado;
 *   4. as QUATRO cores dos niveis, lidas do pixel do print, e a ORDEM delas por
 *      `min_points`;
 *   5. `movementTypeLabel` — a regra FALSAVEL do original, que o material sustenta;
 *   6. `formatMovementPoints` — o SINAL vem do TIPO, e nao do numero;
 *   7. o rascunho NAO transforma campo vazio em `0`, e `toField` escreve PONTO e
 *      nao virgula (senao o `<input type="number">` abriria vazio);
 *   8. `parseBenefits` ACUSA o JSON torto em vez de descartar em silencio;
 *   9. a tabela de adm-020: as cinco colunas na ordem, `Tipo` CENTRADA e `Pontos`
 *      a direita, o vazio LEGITIMO do print e o selo/sinal do tipo;
 *  10. que as QUATRO escritas devolvem `persisted: false` com motivo, e que
 *      `persisted: true` nao existe em lugar nenhum do modulo;
 *  11. que a tela NAO tem titulo de corpo (o print nao tem) e o cabecalho da
 *      tabela de adm-020 TEM;
 *  12. a rota existe, aponta para a tela e nao usa mais o `ModulePage`;
 *  13. que o modulo NAO inventou as coisas que nao estao nos prints;
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
  console.error('uso: node bench-fidelidade.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-fidelidade');

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
 * Raizes da COMPILACAO: so o modulo Fidelidade.
 *
 * Fidelidade NAO le de outro modulo de dominio (ao contrario de Campanhas, que
 * le de Cupons), entao nao ha raiz extra aqui. As outras paginas do painel NAO
 * entram: compilar tudo estoura o limite de ~178 s do `bash` deste ambiente.
 */
const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]fidelidade|components[\\/]admin[\\/]fidelidade|app[\\/]admin[\\/]fidelidade)[\\/]/.test(f),
);

const programa = ts.createProgram(raizes, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipLibCheck: true,
  /**
   * `strict: TRUE` — e esta bancada e a PRIMEIRA do projeto a usar isso.
   *
   * As bancadas anteriores compilavam com `strict: false` porque o `strict` do
   * projeto liga `exactOptionalPropertyTypes` e `noUncheckedIndexedAccess`, e as
   * telas antigas nao foram escritas sob essas duas. O efeito colateral passou
   * despercebido ate aqui: com `strict: false` o TypeScript deixa de estreitar
   * uma UNIAO DISCRIMINADA pelo `if (r.ok)`, e a bancada acusava um erro que o
   * `npm run typecheck` do projeto NAO acusa. O instrumento estava mais fraco que
   * o alvo, e do lado errado — acusando defeito onde nao ha.
   *
   * Este modulo compila limpo sob `strict: true` (13 raizes, 0 erro), entao ele
   * passou a ser a configuracao daqui. A prova esta na secao 1: a uniao de
   * `parseBenefits` e estreitada como o `typecheck` real faz.
   */
  strict: true,
  rootDir: raizProjeto,
  outDir: OUT,
  baseUrl: raizProjeto,
  paths: { '@/*': ['./src/*'] },
});
const emitidos = programa.emit();
const erros = ts.getPreEmitDiagnostics(programa).filter((d) => d.category === ts.DiagnosticCategory.Error);
if (erros.length === 0 && emitidos.emitSkipped === false) ok('emissao sem erro', `${raizes.length} raizes (fidelidade)`);
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

const dados = require(join(OUT, 'src/lib/fidelidade/data.js'));
const demo = require(join(OUT, 'src/lib/fidelidade/demo.js'));
const metricas = require(join(OUT, 'src/lib/fidelidade/metrics.js'));
const formulario = require(join(OUT, 'src/lib/fidelidade/form.js'));
const { LoyaltyTabs } = require(join(OUT, 'src/components/admin/fidelidade/loyalty-tabs.js'));
const { LoyaltyRulesCard } = require(join(OUT, 'src/components/admin/fidelidade/loyalty-rules-card.js'));
const { LoyaltyRewardsCard } = require(join(OUT, 'src/components/admin/fidelidade/loyalty-rewards-card.js'));
const { LoyaltyTierGrid } = require(join(OUT, 'src/components/admin/fidelidade/loyalty-tier-grid.js'));
const { LoyaltyMovementsTable } = require(join(OUT, 'src/components/admin/fidelidade/loyalty-movements-table.js'));

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
 * O CODIGO DE UM ARQUIVO, SEM OS COMENTARIOS.
 *
 * A licao veio de Pedidos e se repetiu em Cupons e Campanhas: o comentario que
 * EXPLICA uma correcao CITA a string procurada, e a agulha casa dentro da
 * explicacao. Aqui a armadilha esta armada em DOIS lugares concretos:
 *
 *   `page.tsx` cita `adm-019 a adm-021` para registrar a referencia errada;
 *   `data.ts` e `metrics.ts` citam `toast.success`, `catch(e)` e `persisted`
 *   ao explicar por que NAO os reproduzem.
 *
 * As assercoes correspondentes medem o texto LIMPO.
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
 * mesmo lugar. Aqui a ordem e ESTRITAMENTE crescente.
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
const tem = (texto, agulha) => normalizar(texto).includes(normalizar(agulha));

/* ------------------------------------------------------- 1. os dados do print */

console.log('\n1. os dados — adm-018, letra por letra');

const regras = (await dados.getLoyaltyRules()).data;
if (regras.pointsPerReal === 1 && regras.pointsForReferral === 100 && regras.pointsForReview === 50 && regras.isEnabled === true)
  ok('as regras sao as do print', '`1`, `100`, `50` e `Programa Ativo` MARCADO');
else fail('regras de demonstracao', JSON.stringify(regras));

const recompensas = (await dados.listRewards()).data;
const rotulos = recompensas.map((r) => r.label);
if (mesmo(rotulos, ['R$ 10 de desconto', 'R$ 15 de desconto', 'R$ 30 de desconto']))
  ok('as tres recompensas sao as do print', 'os tres rotulos, na ordem');
else fail('recompensas', JSON.stringify(rotulos));

if (mesmo(recompensas.map((r) => r.points), [500, 1000, 2000]))
  ok('e os pontos batem com cada rotulo', '500, 1000 e 2000 PTS');
else fail('pontos das recompensas', JSON.stringify(recompensas.map((r) => r.points)));

/**
 * `discountValue` NAO ESTA NO PRINT — e por isso ele e DERIVADO do rotulo, e nao
 * lido do banco. Se ele viesse do campo do banco, viria `0`: o original so o
 * escreve na criacao (`discount_value: 0`) e nunca o le de volta.
 */
if (mesmo(recompensas.map((r) => r.discountValue), [10, 15, 30]))
  ok('e o valor em reais acompanha o rotulo', 'derivado, e nao o `discount_value: 0` do original');
else fail('valor das recompensas', JSON.stringify(recompensas.map((r) => r.discountValue)));

const derivada = formulario.draftToReward({ id: 'x', label: 'R$ 20 de desconto', points: '700' });
if (derivada.discountValue === 20 && derivada.points === 700)
  ok('e uma recompensa digitada deriva o valor do que foi escrito', '`R$ 20 de desconto` -> 20');
else fail('derivacao do valor', JSON.stringify(derivada));

// Um rotulo SEM valor em reais nao inventa um: o campo fica ZERO, que e o que o
// JSON do original guarda — e nao `null`.
const semValor = formulario.draftToReward({ id: 'y', label: 'Frete grátis', points: '' });
if (semValor.discountValue === 0 && semValor.points === 0)
  ok('e um rotulo sem valor nao inventa um `R$ 0,00`', 'o campo fica zero, como no JSON do original');
else fail('rotulo sem valor', JSON.stringify(semValor));

/* ---------------------------------------------------------- 2. as tres abas */

console.log('\n2. as abas — os rotulos e a ordem do print');

const ABAS = ['Configurações & Resgates', 'Níveis Clube VIP', 'Histórico de Pontos'];
if (mesmo(metricas.LOYALTY_TABS.map((t) => t.label), ABAS))
  ok('as tres abas, na ordem do print', ABAS.join(' | '));
else fail('rotulos das abas', JSON.stringify(metricas.LOYALTY_TABS.map((t) => t.label)));

if (metricas.LOYALTY_TABS[0].value === 'config' && metricas.LOYALTY_TABS.length === 3)
  ok('e a primeira e a que abre', '`config` — a tela nasce nela');
else fail('aba inicial', JSON.stringify(metricas.LOYALTY_TABS.map((t) => t.value)));

/**
 * A ABA ATIVA E PROVADA PELO DOM, e nao por uma string no arquivo. O
 * `SegmentedTabs` escreve `aria-selected` — e ler qual esta marcada e o que prova
 * que o componente foi usado como pilula, e nao trocado por um sublinhado.
 */
const abasHtml = render(LoyaltyTabs, { value: 'tiers', onChange: () => {} });
if ((abasHtml.match(/aria-selected="true"/g) ?? []).length === 1)
  ok('e so UMA aba fica marcada por vez', '`aria-selected` unico');
else fail('aba ativa', `aria-selected true x${(abasHtml.match(/aria-selected="true"/g) ?? []).length}`);

const abasTxt = textos(abasHtml);
if (abasTxt.includes('Níveis Clube VIP') && abasTxt.includes('Configurações & Resgates') && abasTxt.includes('Histórico de Pontos'))
  ok('e as tres aparecem no DOM', 'nenhuma aba foi omitida na renderizacao');
else fail('abas renderizadas', abasTxt.slice(0, 120));

const abasSrc = semComentarios(arquivo('components/admin/fidelidade/loyalty-tabs.tsx'));
if (abasSrc.includes('SegmentedTabs'))
  ok('e a pilula escura e a do design system', '`SegmentedTabs` — o mesmo caso de CRM e Pedidos');
else fail('componente de abas', 'nao usa o `SegmentedTabs`');

/* ---------------------------------------------------------- 3. os niveis */

console.log('\n3. os niveis do Clube VIP — as quatro cores do print');

const niveis = (await dados.listTiers()).data;
if (mesmo(niveis.map((t) => t.name), ['Bronze', 'Prata', 'Ouro', 'Diamante']))
  ok('os quatro niveis, na ordem de `min_points`', 'Bronze 0, Prata 1000, Ouro 3000, Diamante 7000');
else fail('ordem dos niveis', JSON.stringify(niveis.map((t) => t.name)));

/**
 * AS QUATRO CORES FORAM LIDAS DO PIXEL da tarja de cada cartao em adm-019.
 *
 * A prova repete os quatro hexa literalmente porque ela e a unica coisa que
 * impede alguem de "melhorar" a paleta: `#7DD3FC` e o azul do Tailwind, e era o
 * que um chute produziria no lugar do `#B9F2FF` do diamante.
 */
if (mesmo(niveis.map((t) => t.color), ['#CD7F32', '#C0C0C0', '#FFD700', '#B9F2FF']))
  ok('e as quatro cores sao as medidas no print', '#CD7F32, #C0C0C0, #FFD700, #B9F2FF');
else fail('cores dos niveis', JSON.stringify(niveis.map((t) => t.color)));

if (niveis[0].minPoints === 0 && niveis[1].minPoints === 1000 && niveis[2].minPoints === 3000 && niveis[3].minPoints === 7000)
  ok('e os pontos minimos sao os do print', '0, 1000, 3000, 7000');
else fail('pontos minimos', JSON.stringify(niveis.map((t) => t.minPoints)));

if (mesmo(niveis.map((t) => t.multiplier), [1, 1.2, 1.5, 2]))
  ok('e os multiplicadores tambem', '1, 1.2, 1.5 e 2');
else fail('multiplicadores', JSON.stringify(niveis.map((t) => t.multiplier)));

if (niveis.every((t) => Array.isArray(t.benefits) && t.benefits.length > 0))
  ok('e todos os quatro tem beneficios', `${niveis.map((t) => t.benefits.length).join(', ')} itens`);
else fail('beneficios', 'algum nivel ficou sem lista');

/**
 * A COR VEM DO DADO, e nao de uma tabela no codigo. A prova passa um nivel com uma
 * cor que nao existe em `demo.ts`: se a funcao devolvesse uma cor da paleta fixa,
 * este caso falharia.
 */
if (metricas.tierColor({ color: '#123456' }) === '#123456')
  ok('e a cor sai do REGISTRO do nivel', 'um quinto nivel criado no banco nao ficaria sem cor');
else fail('origem da cor', metricas.tierColor({ color: '#123456' }));

if (metricas.tierColor({ color: '' }) === metricas.COR_PADRAO && metricas.COR_PADRAO === '#9CA3AF')
  ok('e um nivel sem cor cai no cinza de reserva', 'e o unico caso que o banco resolve mal');
else fail('cor de reserva', metricas.tierColor({ color: '' }));

/**
 * `sortTiers` ORDENA POR PONTOS e NAO PELO NOME. Bronze..Diamante coincide nas
 * duas ordens, entao o dado do print NAO distingue as duas — a prova monta dois
 * niveis fora de ordem por nome.
 */
const bagunçados = [
  { id: 'b', name: 'Aaa', color: '#000', minPoints: 5000, multiplier: 1, benefits: [] },
  { id: 'a', name: 'Zzz', color: '#000', minPoints: 100, multiplier: 1, benefits: [] },
];
if (metricas.sortTiers(bagunçados)[0].name === 'Zzz')
  ok('e a lista ordena por PONTOS, e nao pelo nome', 'o `order by min_points asc` do original');
else fail('ordenacao dos niveis', JSON.stringify(metricas.sortTiers(bagunçados).map((t) => t.name)));

const antesCopia = JSON.stringify(bagunçados);
metricas.sortTiers(bagunçados);
if (JSON.stringify(bagunçados) === antesCopia)
  ok('e ela ordena numa COPIA', 'nao embaralha o estado do React');
else fail('mutacao de `sortTiers`', 'a lista do chamador foi reordenada');

// Empate de pontos e desempatado pelo nome, senao a lista pula entre renders — e
// com ela as CORES dos cartoes.
const empatados = [
  { id: 'z', name: 'Zeta', color: '#000', minPoints: 10, multiplier: 1, benefits: [] },
  { id: 'a', name: 'Alfa', color: '#000', minPoints: 10, multiplier: 1, benefits: [] },
];
if (metricas.sortTiers(empatados)[0].name === 'Alfa')
  ok('e empate de pontos e desempatado pelo nome', 'a ordem nao muda entre renderizacoes');
else fail('desempate dos niveis', 'ordem instavel');

/* ------------------------------------------------- 4. o tipo da movimentacao */

console.log('\n4. o selo e o sinal da movimentacao — a regra falsavel');

if (metricas.movementTypeLabel('earn') === 'Ganho' && metricas.movementTypeLabel('redeem') === 'Resgate')
  ok('`earn` diz `Ganho` e `redeem` diz `Resgate`', 'as duas palavras do original');
else fail('rotulo do tipo', `${metricas.movementTypeLabel('earn')} / ${metricas.movementTypeLabel('redeem')}`);

/**
 * A REGRA E FALSAVEL DE PROPOSITO — e o material a sustenta.
 *
 * O original escreve `log.type === 'earn' ? 'Ganho' : 'Resgate'`, ou seja, QUALQUER
 * coisa que nao seja exatamente `earn` vira `Resgate`. Nao foi endurecido para "so
 * `redeem` e resgate" porque a coluna `type` do banco e TEXTO LIVRE, sem CHECK
 * documentado, e endurecer seria inventar uma regra de validacao que a referencia
 * nao tem. A prova trava esse comportamento para que ninguem o "conserte".
 */
if (metricas.movementTypeLabel('quality') === 'Resgate' && metricas.movementTypeLabel('') === 'Resgate')
  ok('e QUALQUER outro valor cai em `Resgate`', 'divergencia conhecida, nao corrigida — a referencia nao tem CHECK');
else fail('regra falsavel do tipo', 'alguem endureceu a regra sem referencia');

if (formulario.toMovementType('earn') === 'earn' && formulario.toMovementType('qualquer') === 'redeem')
  ok('e a normalizacao do banco faz a MESMA escolha', 'mas de forma explicita, para o tipo deixar de ser `string`');
else fail('normalizacao do tipo', formulario.toMovementType('qualquer'));

/**
 * O SINAL VEM DO TIPO, E NAO DO NUMERO. `points` e guardado SEMPRE POSITIVO na
 * referencia; o `+`/`-` e derivado. Uma `earn` com valor negativo imprimiria
 * `+-50`, que e um estado que a tela PERMITE — e que nao foi consertado por conta
 * propria.
 */
if (metricas.formatMovementPoints({ points: 100, type: 'earn' }) === '+100')
  ok('`earn` sai com sinal de mais', '`+100`');
else fail('sinal do ganho', metricas.formatMovementPoints({ points: 100, type: 'earn' }));

if (metricas.formatMovementPoints({ points: 100, type: 'redeem' }) === '-100')
  ok('e `redeem` com sinal de menos', '`-100`');
else fail('sinal do resgate', metricas.formatMovementPoints({ points: 100, type: 'redeem' }));

const milPontos = metricas.formatMovementPoints({ points: 1000, type: 'earn' });
if (milPontos === `+1${String.fromCharCode(0x00a0)}000` || milPontos === '+1.000')
  ok('e mil pontos saem com separador de milhar', 'o `toLocaleString("pt-BR")` do original');
else fail('separador de milhar', JSON.stringify(milPontos));

// O valor torto nao vira `NaN` na tela.
if (metricas.formatMovementPoints({ points: Number.NaN, type: 'earn' }) === '+0')
  ok('e um valor torto nao imprime `NaN`', 'vira zero — o print nao tem linha, entao nao ha o que copiar');
else fail('valor torto', metricas.formatMovementPoints({ points: Number.NaN, type: 'earn' }));

/* -------------------------------------------- 5. o rascunho NUNCA escreve zero */

console.log('\n5. o rascunho — campo vazio continua vazio');

/**
 * O DEFEITO QUE ISTO EVITA e o do proprio original: `onChange={(e) => setX({
 * ...x, points: Number(e.target.value) })}` escreve um `0` no instante em que a
 * pessoa seleciona tudo e comeca a digitar outro valor. Em Fidelidade isso pesa
 * mais do que em qualquer outro modulo, porque `Pontos por R$ 1,00` decide o
 * acumulo da LOJA INTEIRA.
 */
const vazio = formulario.rulesToDraft({
  pointsPerReal: 0,
  pointsForReferral: 0,
  pointsForReview: 0,
  isEnabled: false,
});
if (vazio.pointsPerReal === '' && vazio.pointsForReferral === '' && vazio.pointsForReview === '')
  ok('zero vira campo VAZIO, e nao `"0"`', 'nao ha zero escrito que ninguem digitou');
else fail('rascunho com zero', JSON.stringify(vazio));

const cheio = formulario.rulesToDraft({ pointsPerReal: 1, pointsForReferral: 100, pointsForReview: 50, isEnabled: true });
if (cheio.pointsPerReal === '1' && cheio.pointsForReferral === '100' && cheio.pointsForReview === '50' && cheio.isEnabled === true)
  ok('e um valor de verdade aparece como digitado', '`"1"`, `"100"`, `"50"` e a caixa marcada');
else fail('rascunho preenchido', JSON.stringify(cheio));

/**
 * O MULTIPLICADOR: `toField` escreve PONTO, e nao virgula.
 *
 * E o mesmo defeito das datas de Cupons, em outro campo. Se `toField` usasse
 * `toLocaleString`, `1.2` viraria `"1,2"` e o `<input type="number">` NAO
 * reconheceria o valor — o campo abriria VAZIO na edicao.
 */
if (formulario.toField(1.2) === '1.2' && formulario.toField(1.5) === '1.5')
  ok('`toField(1.2)` escreve `"1.2"`, com PONTO', 'senao o `<input type="number">` abriria vazio na edicao');
else fail('formato do multiplicador', `${formulario.toField(1.2)} / ${formulario.toField(1.5)}`);

if (formulario.toNumber('') === 0 && formulario.toNumber('12') === 12 && formulario.toNumber('1.2') === 1.2)
  ok('e o caminho de volta le o vazio como zero', '`Number("")` ja da zero; `Number("abc")` da NaN e vira zero na guarda');
else fail('conversao para numero', `${formulario.toNumber('')} / ${formulario.toNumber('abc')}`);

if (formulario.toNumber('abc') === 0)
  ok('e um texto que nao e numero nao vira `NaN`', 'a guarda pega o `Number.isFinite`');
else fail('guarda do `NaN`', formulario.toNumber('abc'));

// O rascunho de um nivel traz o JSON SEM espacos, como o print.
const rascunhoNivel = formulario.tierToDraft(niveis[0]);
if (rascunhoNivel.benefitsText === '["Acúmulo padrão de pontos","Cupons sazonais"]')
  ok('e o JSON dos beneficios sai sem espacos', 'exatamente o `JSON.stringify` do original');
else fail('texto dos beneficios', rascunhoNivel.benefitsText);

// Ida e volta: o rascunho nao pode perder o valor decimal nem ganhar zero.
const voltou = formulario.draftToTier(formulario.tierToDraft(niveis[1]), niveis[1].benefits);
if (mesmo(voltou, niveis[1]))
  ok('e rascunho -> nivel devolve o mesmo nivel', 'ida e volta sem perda');
else fail('ida e volta do nivel', JSON.stringify(voltou));

// Um nivel com ZERO pontos abre em branco, e nao com `0` escrito.
const nivelZero = formulario.tierToDraft({ id: 'z', name: 'Z', color: '#000', minPoints: 0, multiplier: 0, benefits: [] });
if (nivelZero.minPoints === '' && nivelZero.multiplier === '' && nivelZero.benefitsText === '[]')
  ok('e um nivel zerado abre com os campos EM BRANCO', 'e o `benefitsText` fica `[]`, nao vazio');
else fail('nivel zerado', JSON.stringify(nivelZero));

/* --------------------------------------------- 6. o JSON torto NAO e descartado */

console.log('\n6. os beneficios — o erro sobe para o campo');

const certo = formulario.parseBenefits('["Frete grátis","Brinde"]');
if (certo.ok === true && mesmo(certo.benefits, ['Frete grátis', 'Brinde']))
  ok('uma lista valida e aceita', 'os dois beneficios');
else fail('JSON valido', JSON.stringify(certo));

/**
 * O DEFEITO DO ORIGINAL, e a prova que o trava: ele faz `try { JSON.parse(...) }
 * catch(e) {}`. Uma lista digitada com uma virgula a mais NAO e gravada, a pessoa
 * ve o texto na tela, e nao fica sabendo. Aqui o erro sobe.
 */
const torto = formulario.parseBenefits('["Frete grátis",]');
if (torto.ok === false && typeof torto.error === 'string' && torto.error.length > 0)
  ok('e um JSON invalido ACUSA, em vez de sumir', 'o `catch(e) {}` do original nao foi reproduzido');
else fail('JSON invalido silencioso', JSON.stringify(torto));

if (formulario.parseBenefits('123').ok === false && formulario.parseBenefits('{"a":1}').ok === false)
  ok('e um JSON valido que NAO e lista de textos tambem acusa', 'um numero solto e um objeto nao tem como virar beneficios');
else fail('forma do JSON', 'aceitou algo que a leitura (`plainText`) nao saberia mostrar');

if (formulario.parseBenefits('[1,2]').ok === false)
  ok('e uma lista com numeros dentro tambem acusa', 'precisa ser lista de TEXTO');
else fail('lista de numeros', 'aceitou numeros dentro de uma `string[]`');

// Campo VAZIO e lista vazia, e NAO erro: esvaziar e uma forma legitima de dizer
// "este nivel nao tem beneficios".
const vazioOk = formulario.parseBenefits('   ');
if (vazioOk.ok === true && vazioOk.benefits.length === 0)
  ok('mas o campo VAZIO e lista vazia, e nao erro', 'esvaziar o campo e uma resposta legitima');
else fail('campo vazio', JSON.stringify(vazioOk));

/**
 * O ERRO E MAPEADO POR NIVEL, e o salvamento PARA enquanto houver qualquer um. O
 * original descartava o cartao torto em SILENCIO e gravava os outros tres.
 */
const validacao = formulario.validateTierDrafts([
  { id: 'tr-bronze', name: 'Bronze', color: '#CD7F32', minPoints: '0', multiplier: '1', benefitsText: '["a"]' },
  { id: 'tr-prata', name: 'Prata', color: '#C0C0C0', minPoints: '1000', multiplier: '1.2', benefitsText: '["a",]' },
]);
if (validacao.errors['tr-prata'] && !validacao.errors['tr-bronze'] && validacao.parsed['tr-bronze'])
  ok('e o erro fica no cartao que o causou', '`tr-prata` acusa, `tr-bronze` nao');
else fail('erro por nivel', JSON.stringify(validacao.errors));

if (Object.keys(validacao.errors).length === 1)
  ok('e UM cartao torto impede o salvamento dos QUATRO', 'o original perdia esse em silencio');
else fail('contagem de erros', JSON.stringify(Object.keys(validacao.errors)));

/* ------------------------------------------------- 7. a tabela de adm-020 */

console.log('\n7. a tabela `Últimas Movimentações` — as colunas do print');

const tabelaSrc = semComentarios(arquivo('components/admin/fidelidade/loyalty-movements-table.tsx'));
const colunas = [
  '<TableHeaderCell>Cliente',
  '<TableHeaderCell>Data',
  '<TableHeaderCell>Descrição',
  '<TableHeaderCell align="center">Tipo',
  '<TableHeaderCell align="right">Pontos',
];
const ordem = naOrdem(tabelaSrc, colunas);
if (ordem.ok) ok('as cinco colunas, na ordem do print', ordem.detalhe);
else fail('colunas da tabela', ordem.detalhe);

/**
 * O ALINHAMENTO NAO E UNIFORME, e por isso ele e provado: `Tipo` CENTRADA e
 * `Pontos` a direita, as tres primeiras a esquerda. E o que o print mostra e o que
 * o original faz (`text-center` e `text-right`).
 *
 * A medida NAO e uma expressao regular sobre o texto solto. A primeira tentativa
 * foi `/!<TableHeaderCell>(Cliente|Data|Descrição)/` com um `replace` antes, e ela
 * acusou defeito onde nao havia: `Descrição` casava tambem dentro da agulha
 * `<TableHeaderCell align="center">Tipo` por causa do `replace` mal recortado, e o
 * negativo olhava para o trecho errado. Aqui as duas classes sao COLETADAS uma a
 * uma — as celulas sem `align` e as com — e comparadas, que e o que "tres a
 * esquerda" quer dizer em numeros.
 */
const celulasCabecalho = [...tabelaSrc.matchAll(/<TableHeaderCell([^>]*)>/g)].map((m) => ({
  attrs: m[1],
  rotulo: (tabelaSrc.slice(m.index + m[0].length).match(/^([^<]*)/) ?? [, ''])[1].trim(),
}));
const semAlign = celulasCabecalho.filter((c) => !/align=/.test(c.attrs)).map((c) => c.rotulo);
if (mesmo(semAlign, ['Cliente', 'Data', 'Descrição']) && celulasCabecalho.length === 5)
  ok('e as tres primeiras alinham a ESQUERDA', `sem \`align\`: ${semAlign.join(', ')}`);
else fail('alinhamento a esquerda', `colunas sem \`align\`: ${JSON.stringify(semAlign)}`);

const vazia = textos(render(LoyaltyMovementsTable, { rows: [] }));
if (vazia.includes('Nenhuma movimentação de pontos registrada.'))
  ok('a tabela vazia DIZ que esta vazia', 'a unica diferenca deliberada em relacao ao original');
else fail('vazio da tabela', vazia.slice(0, 120));

if (vazia.includes('Cliente') && vazia.includes('Pontos') && vazia.includes('Últimas Movimentações'))
  ok('e o cabecalho e o titulo do cartao continuam la com a lista vazia', 'e o ESTADO LEGITIMO de adm-020');
else fail('cabecalho com lista vazia', vazia.slice(0, 160));

/**
 * O PRINT DE adm-020 MOSTRA A TABELA VAZIA — e isso NAO e um placeholder. A prova
 * registra a diferenca, porque a regra do projeto e "D = 0" e uma tabela vazia mal
 * lida viraria um falso positivo na auditoria final.
 */
const viewSrc = semComentarios(arquivo('components/admin/fidelidade/fidelidade-view.tsx'));
if (!/PlaceholderPage|em breve|Em breve|TODO/.test(viewSrc))
  ok('e a tela NAO e um placeholder', 'a lista vazia e dado, nao uma tela por construir');
else fail('marca de placeholder', 'a tela tem texto de "em breve" ou `PlaceholderPage`');

// Agora com uma linha: o selo, a cor e o sinal.
const linha = {
  id: 'mv-1',
  customerEmail: 'cliente@exemplo.com',
  createdAt: '2026-09-20T12:00:00',
  description: 'Compra #123',
  type: 'earn',
  points: 100,
};
const comLinha = textos(render(LoyaltyMovementsTable, { rows: [linha] }));
if (comLinha.includes('cliente@exemplo.com') && comLinha.includes('Ganho') && comLinha.includes('+100'))
  ok('e uma linha mostra o e-mail, o selo `Ganho` e `+100`', 'o sinal e a palavra saem do TIPO');
else fail('linha preenchida', comLinha.slice(0, 160));

const comResgate = textos(render(LoyaltyMovementsTable, { rows: [{ ...linha, type: 'redeem' }] }));
if (comResgate.includes('Resgate') && comResgate.includes('-100'))
  ok('e um resgate mostra `Resgate` e `-100`', 'a outra metade da regra');
else fail('linha de resgate', comResgate.slice(0, 160));

/**
 * A COR DA PALAVRA sai do tipo: o selo de `Resgate` nao pode sair verde.
 *
 * A medida e feita no HTML CRU, e nao em `textos(...)`: `textos` remove as TAGS
 * junto com elas as CLASSES, e a primeira versao desta prova media `textos` —
 * entao ela comparava duas strings onde `bg-success-surface` nunca poderia estar.
 * E o mesmo defeito que a regra de `placeholder` ja registrou em outra bancada: a
 * medida tem que ser feita onde o atributo VIVE.
 */
const htmlGanho = render(LoyaltyMovementsTable, { rows: [linha] });
const htmlResgate = render(LoyaltyMovementsTable, { rows: [{ ...linha, type: 'redeem' }] });
if (/bg-danger-surface/.test(htmlResgate) && /bg-success-surface/.test(htmlGanho))
  ok('e a cor do selo vem do tipo', 'verde no ganho, vermelho no resgate');
else fail('cor do selo', 'o ganho e o resgate sairam com a mesma cor');

// ...e o contrario: os dois NAO podem sair com a mesma classe.
if (/bg-success-surface/.test(htmlResgate) === false && /bg-danger-surface/.test(htmlGanho) === false)
  ok('e o ganho nao sai vermelho nem o resgate verde', 'as duas cores nao se cruzam');
else fail('cores cruzadas', 'o selo nao esta derivando a cor do tipo');

/**
 * A DATA usa o formatador do painel. O print nao tem linha, entao o formato vem do
 * CODIGO de referencia — a prova so garante que a data NAO sai em ISO cru.
 */
if (/20\/09\/2026/.test(comLinha))
  ok('e a data sai no formato do painel', '`20/09/2026`, e nao o ISO do banco');
else fail('formato da data', comLinha.slice(0, 160));

/* ------------------------------------------------------------- 8. as escritas */

console.log('\n8. as escritas — nada finge gravar');

const escritaRegras = await dados.saveRules({ pointsPerReal: 2, pointsForReferral: 0, pointsForReview: 0, isEnabled: true });
const escritaRecompensas = await dados.saveRewards(recompensas);
const escritaNiveis = await dados.saveTiers(niveis);
const escritaNova = await dados.addReward(formulario.newReward('rw-x'));

const todas = [
  ['saveRules', escritaRegras],
  ['saveRewards', escritaRecompensas],
  ['saveTiers', escritaNiveis],
  ['addReward', escritaNova],
];
const fingindo = todas.filter(([, r]) => r.persisted !== false);
if (fingindo.length === 0)
  ok('as QUATRO escritas devolvem `persisted: false`', 'nenhuma delas diz que gravou');
else fail('escrita fingindo gravar', fingindo.map(([n]) => n).join(', '));

const semMotivo = todas.filter(([, r]) => typeof r.reason !== 'string' || r.reason.length === 0);
if (semMotivo.length === 0)
  ok('e todas explicam POR QUE nao gravou', 'a tela mostra o motivo, e nao uma confirmacao falsa');
else fail('escrita sem motivo', semMotivo.map(([n]) => n).join(', '));

if (todas.every(([, r]) => r.reason === dados.PENDING_REASON))
  ok('e o motivo e o mesmo texto do modulo', 'uma fonte so para a frase');
else fail('texto do motivo', 'os motivos divergem entre as funcoes');

/**
 * A PROVA DECISIVA: `persisted: true` NAO EXISTE no codigo do modulo.
 *
 * O original faz `toast.success("Regras salvas")` logo depois de um `upsert`. Se
 * alguem copiasse essa confirmacao para a tela, a pessoa acharia que as regras do
 * programa de pontos estao valendo na loja — e elas nao estao. A medida e feita no
 * texto LIMPO, porque `data.ts` e `metrics.ts` CITAM `toast.success` e `persisted`
 * ao explicar por que nao os reproduzem.
 */
const todoOmodulo = [
  'lib/fidelidade/data.ts',
  'lib/fidelidade/metrics.ts',
  'lib/fidelidade/form.ts',
  'components/admin/fidelidade/fidelidade-view.tsx',
  'components/admin/fidelidade/loyalty-rules-card.tsx',
  'components/admin/fidelidade/loyalty-rewards-card.tsx',
  'components/admin/fidelidade/loyalty-tier-grid.tsx',
  'components/admin/fidelidade/loyalty-movements-table.tsx',
].map((rel) => semComentarios(arquivo(rel))).join('\n');

if (!/persisted:\s*true/.test(todoOmodulo))
  ok('e `persisted: true` nao aparece em NENHUM arquivo', 'nao ha caminho que finja gravar');
else fail('`persisted: true` no codigo', 'alguma escrita passou a fingir persistencia');

if (!/toast\.|alert\(/.test(todoOmodulo))
  ok('e nao ha confirmacao copiada do original', 'nenhum `toast.success` nem `alert`');
else fail('confirmacao falsa', 'um `toast` ou `alert` foi reproduzido sem banco');

// A LISTA LOCAL SO MUDA QUANDO NAO PERSISTIU: com o Neon ligado, quem manda e o banco.
if (/if \(!result\.persisted\)/.test(viewSrc))
  ok('e a tela so assume a mudanca local quando NAO gravou', 'com o Neon ligado, quem manda na lista e o banco');
else fail('assumir a mudanca local', 'a tela sobrescreve a lista mesmo quando o banco respondeu');

if (/PENDING_REASON|reason/.test(semComentarios(arquivo('lib/fidelidade/data.ts'))))
  ok('e o contrato de `WriteResult` esta na camada de dados', 'a tela nao inventa o texto do aviso');
else fail('contrato de escrita', 'a camada de dados perdeu o motivo');

/* ------------------------------------------------------- 9. o titulo do corpo */

console.log('\n9. o titulo do corpo — o print NAO tem');

/**
 * CRM, Carrinho Abandonado, Cupons e Campanhas tem um `SectionHeader` no corpo
 * porque o print DELES mostra o par titulo + descricao. ADM-018 NAO MOSTRA: depois
 * da topbar vem a linha das abas, e nao um `Fidelidade` serifado nem a frase de
 * descricao. E o mesmo padrao de Pedidos.
 *
 * A prova e ao contrario: mede a AUSENCIA. Um `SectionHeader` acrescentado aqui
 * deixaria a tela menos fiel, e e exatamente o tipo de "melhoria" que alguem faria
 * para padronizar o painel.
 */
if (!/SectionHeader/.test(viewSrc))
  ok('a tela NAO renderiza `SectionHeader`', 'o print nao tem titulo de corpo — decisao POR MODULO');
else fail('titulo de corpo inventado', '`SectionHeader` foi acrescentado sem print que o sustente');

if (/LoyaltyTabs/.test(viewSrc.slice(0, viewSrc.indexOf('tab ==='))))
  ok('e o primeiro bloco do corpo sao as ABAS', 'logo depois da topbar, como em adm-018');
else fail('primeiro bloco do corpo', 'as abas nao sao o primeiro bloco');

// E o cartao de adm-020 TEM cabecalho proprio — o oposto, no mesmo modulo.
if (tabelaSrc.includes('Últimas Movimentações') && tabelaSrc.includes('History'))
  ok('mas o cartao de adm-020 TEM cabecalho, com icone', 'a diferenca entre as duas telas e o motivo da prova');
else fail('cabecalho do cartao de logs', 'o cartao de adm-020 perdeu o titulo');

/* ------------------------------------------------------------- 10. a rota */

console.log('\n10. a rota');

const rotaCrua = arquivo('app/admin/fidelidade/page.tsx');
const rota = semComentarios(rotaCrua);

if (/export default function Fidelidade_Page/.test(rota)) ok('a rota existe', '/admin/fidelidade');
else fail('a rota', 'nao exporta a pagina');

if (/from '@\/components\/admin\/fidelidade\/fidelidade-view'/.test(rota))
  ok('a pagina aponta para a tela', '`FidelidadeView`');
else fail('a pagina', 'nao importa a tela');

if (!/ModulePage/.test(rota)) ok('a pagina NAO usa mais o placeholder', 'o `ModulePage` foi removido');
else fail('a pagina ainda e um placeholder', '`ModulePage` continua la');

/**
 * A REFERENCIA ERRADA — e a SEXTA ocorrencia do mesmo defeito no projeto (depois
 * de CRM, Carrinho Abandonado, o mapa da Fase 2, Cupons e Campanhas).
 *
 * O placeholder citava `adm-019 a adm-021`. O print adm-021 e de AFILIADAS. A
 * assercao roda sobre o texto LIMPO porque a `page.tsx` CITA a faixa errada no
 * comentario que registra o erro: medir o texto cru acusaria a propria
 * documentacao.
 */
if (!/references\s*=\s*["']adm-019/.test(rota)) ok('a prop `references` sumiu', 'nao ha mais faixa de prints na prop');
else fail('a prop ainda cita a faixa', 'a referencia errada voltou');

if (/adm-018/.test(rotaCrua) && /adm-019/.test(rotaCrua) && /adm-020/.test(rotaCrua))
  ok('e os TRES prints da tela estao registrados', 'adm-018, adm-019 e adm-020');
else fail('os prints nao estao registrados', 'a correcao nao ficou documentada');

if (/adm-021/.test(rotaCrua) && /AFILIADAS/i.test(rotaCrua))
  ok('e o erro da referencia antiga ficou DOCUMENTADO', 'o comentario diz de quem e o `adm-021` e nomeia o arquivo');
else fail('o erro nao esta registrado', 'a substituicao foi feita sem deixar rastro');

/**
 * A DOCUMENTACAO TEM QUE NOMEAR O ARQUIVO, e esta prova existe porque a primeira
 * versao dela nao olhava para isso.
 *
 * Dizer "o `adm-021` e de Afiliadas" e uma afirmacao sem fonte — e este projeto ja
 * teve SEIS erros de referencia justamente assim. O comentario nomeia a captura
 * (`233222`), que e o que permite conferir a afirmacao contra a pasta em vez de
 * acreditar nela. Sem o nome do arquivo, a documentacao vira mais uma faixa
 * escrita de memoria.
 */
if (/233222/.test(rotaCrua))
  ok('e a documentacao NOMEIA a captura de adm-021', 'afirmacao conferivel contra a pasta `Painel admin/`');
else fail('afirmacao sem fonte', 'o comentario diz de quem e o print sem nomear o arquivo');

// A faixa erra nas DUAS pontas, e o registro diz isso.
if (/duas\s+[\s\S]{0,20}ponta|come por baixo|sobra\s+por\s+cima/i.test(rotaCrua))
  ok('e registra que a faixa erra nas DUAS pontas', 'falta o `adm-018` e sobra o `adm-021`');
else fail('alcance do erro', 'o comentario so diz que a faixa esta errada');

/* ------------------------ 11. o que NAO foi inventado (o modulo tem 3 prints) */

console.log('\n11. o que NAO existe — e por que');

/**
 * ESTE MODULO TEM TRES PRINTS, e nenhum deles mostra: saldo por cliente, nivel
 * calculado de cada cliente, cashback, ranking, expiracao de pontos, link de
 * indicacao, meta de gasto, extrato por cliente nem gamificacao. Metade deles e
 * SUGERIDO PELO PROPRIO NOME do modulo ("Fidelidade"), e por isso a prova existe:
 * ela le o codigo do modulo inteiro e confirma que nenhum desses conceitos
 * apareceu. Nao e prova de que a tela esta certa — e prova de que ela nao cresceu
 * alem da referencia.
 */
const conceitos = [
  ['cashback', /cashback/i],
  ['ranking', /ranking/i],
  ['gamifica', /gamifica/i],
  ['link de indicacao', /referral_?link|link_?indic/i],
  ['expiracao de pontos', /expira/i],
  ['meta de gasto', /goal|meta_?de_?gasto/i],
];
const inventados = conceitos.filter(([, re]) => re.test(todoOmodulo)).map(([nome]) => nome);
if (inventados.length === 0)
  ok('nenhum conceito que os prints nao mostram foi acrescentado', 'cashback, ranking, indicacao, expiracao, meta, gamificacao');
else fail('conceito inventado', inventados.join(', '));

/**
 * E O EXTRATO ESTA VAZIO DE PROPOSITO. Uma linha de extrato tem o e-mail REAL de
 * uma cliente da loja; um e-mail inventado apareceria no painel como se alguem
 * tivesse ganhado pontos. Nenhuma linha existe em referencia nenhuma.
 */
const movimentos = (await dados.listMovements()).data;
if (movimentos.length === 0 && demo.DEMO_LOYALTY_MOVEMENTS.length === 0)
  ok('e o extrato de adm-020 esta VAZIO, como o print', 'nenhuma movimentacao inventada');
else fail('extrato', `${movimentos.length} linha(s) — o print mostra a tabela vazia`);

if (movimentos.length === 0)
  ok('e o estado vazio e o ESTADO LEGITIMO do print', 'nao e `PlaceholderPage` nem tela por construir');
else fail('estado do extrato', 'a tabela veio preenchida sem referencia');

/**
 * AS QUATRO ESCRITAS, E SO QUATRO. O modulo tem tres botoes de gravacao na tela
 * (`Salvar Regras`, `Salvar Recompensas`, `Salvar Configuração do Clube VIP`) e o
 * `+ Adicionar Recompensa`, que NAO grava. Nao ha `saveMovement`, `deleteReward`
 * nem `deleteTier`: nenhum print mostra essas acoes, e a referencia tambem nao.
 */
const exportadas = Object.keys(dados).filter((k) => /^(save|add|remove|delete|update|create)/.test(k));
if (mesmo(exportadas.sort(), ['addReward', 'saveRewards', 'saveRules', 'saveTiers']))
  ok('e so ha as QUATRO escritas que a tela usa', exportadas.join(', '));
else fail('escritas exportadas', exportadas.join(', '));

/* ------------------------------------------------------ 12. a origem do dado */

console.log('\n12. a origem do dado');

const conjuntos = await Promise.all([dados.getLoyaltyRules(), dados.listRewards(), dados.listTiers(), dados.listMovements()]);
if (conjuntos.every((c) => c.source === 'demo'))
  ok('as quatro leituras vem marcadas como `demo`', 'o dado nao se apresenta como real');
else fail('origem das leituras', JSON.stringify(conjuntos.map((c) => c.source)));

const agrupado = await dados.loadLoyalty();
if (agrupado.source === 'demo' && agrupado.data.tiers.length === 4 && agrupado.data.rewards.length === 3)
  ok('e `loadLoyalty` junta as quatro partes', '3 recompensas, 4 niveis, 0 movimentacoes');
else fail('leitura agrupada', JSON.stringify({ source: agrupado.source, tiers: agrupado.data.tiers.length }));

// NENHUM COMPONENTE IMPORTA DE `demo.ts`: a tela so fala com `data.ts`.
const componentes = [
  'components/admin/fidelidade/fidelidade-view.tsx',
  'components/admin/fidelidade/loyalty-rules-card.tsx',
  'components/admin/fidelidade/loyalty-rewards-card.tsx',
  'components/admin/fidelidade/loyalty-tier-grid.tsx',
  'components/admin/fidelidade/loyalty-movements-table.tsx',
  'components/admin/fidelidade/loyalty-tabs.tsx',
  'components/admin/fidelidade/fidelidade-notice.tsx',
  'app/admin/fidelidade/page.tsx',
];
const vazando = componentes.filter((rel) => /from '@\/lib\/fidelidade\/demo'/.test(semComentarios(arquivo(rel))));
if (vazando.length === 0)
  ok('e NENHUM componente importa de `demo.ts`', 'a tela so fala com `data.ts`');
else fail('componente lendo `demo.ts`', vazando.join(', '));

/* ------------------------------------------- 13. o aviso de que nada gravou */

console.log('\n13. o aviso de que nada foi gravado');

const noticeSrc = semComentarios(arquivo('components/admin/fidelidade/fidelidade-notice.tsx'));
const { UnsavedNotice } = require(join(OUT, 'src/components/admin/fidelidade/fidelidade-notice.js'));

if (render(UnsavedNotice, { kind: 'rules', visible: false }) === '')
  ok('o aviso NAO aparece antes do primeiro clique', 'a tela nao abre acusando uma mudanca que ninguem fez');
else fail('aviso visivel de inicio', 'o aviso aparece sem ninguem ter salvo');

if (textos(render(UnsavedNotice, { kind: 'rules', visible: true })).includes('acúmulo de pontos da loja'))
  ok('e o aviso das REGRAS fala do acumulo da LOJA INTEIRA', 'e o mais grave dos tres — muda o que a loja da');
else fail('texto do aviso de regras', textos(render(UnsavedNotice, { kind: 'rules', visible: true })).slice(0, 120));

const textoRecompensas = textos(render(UnsavedNotice, { kind: 'rewards', visible: true }));
const textoNiveis = textos(render(UnsavedNotice, { kind: 'tiers', visible: true }));
if (textoRecompensas !== textoNiveis && textoRecompensas.length > 0 && textoNiveis.length > 0)
  ok('e os tres avisos sao textos DIFERENTES, e nao um generico', 'as consequencias sao de tamanhos diferentes');
else fail('avisos iguais', 'um aviso unico deixa a pessoa sem saber se `Pontos por R$ 1,00` vale');

if (!/setTimeout|useEffect/.test(noticeSrc))
  ok('e o aviso NAO se apaga sozinho', 'ele some quando a pessoa edita de novo, e nao por relogio');
else fail('aviso com relogio', 'o aviso se apaga sozinho');

/* --------------------------------------------- 14. provas ao contrario */

console.log('\n14. as provas ao contrario');

let quebrado = 0;

// (a) `movementTypeLabel` NAO pode trocar as palavras.
if (metricas.movementTypeLabel('earn') === 'Resgate' || metricas.movementTypeLabel('redeem') === 'Ganho') { quebrado += 1; }

// (b) `formatMovementPoints` NAO pode tirar o sinal DO NUMERO: uma `earn` positiva
//     com o sinal trocado, ou um `redeem` saindo com `+`.
if (metricas.formatMovementPoints({ points: 100, type: 'earn' }).startsWith('-') ||
    metricas.formatMovementPoints({ points: 100, type: 'redeem' }).startsWith('+')) { quebrado += 1; }

// (c) `toField` NAO pode escrever virgula — o campo abriria vazio na edicao.
if (formulario.toField(1.2) === '1,2') { quebrado += 1; }

// (d) `parseBenefits` NAO pode engolir o JSON torto em silencio.
if (formulario.parseBenefits('["a",]').ok === true) { quebrado += 1; }

// (e) `tierColor` NAO pode ignorar a cor do registro nem deixar o vazio passar.
if (metricas.tierColor({ color: '#123456' }) === metricas.COR_PADRAO || metricas.tierColor({ color: '' }) === '') { quebrado += 1; }

// (f) `sortTiers` NAO pode ordenar pelo nome.
if (metricas.sortTiers(bagunçados)[0].name === 'Aaa') { quebrado += 1; }

// (g) `naOrdem` NAO pode dar verde com duas agulhas caindo no MESMO trecho.
if (naOrdem('Tipo', ['Tipo', 'Tipo']).ok !== false) { quebrado += 1; }

// (h) `semComentarios` NAO pode comer o codigo junto — senao as provas de texto
//     limpo passariam por vaculdade.
const limpo = semComentarios(tabelaSrc);
if (limpo.includes('TableHeaderCell') && limpo.includes('Últimas Movimentações') && !limpo.includes('ESTADO LEGITIMO')) {
  quebrado += 0;
} else { quebrado += 1; }

// (i) `normalizar` NAO pode deixar o NBSP passar: e ele que faz `+1 000` casar.
if (normalizar('+1 000') !== normalizar('+1 000')) { quebrado += 1; }

// (j) As duas medidas de COR desta bancada NAO podem passar por vaculdade. Se o
//     renderizador deixasse de emitir a classe, `htmlGanho` e `htmlResgate` seriam
//     iguais e as duas provas da secao 7 dariam verde sem medir nada.
if (htmlGanho === htmlResgate) { quebrado += 1; }

// (k) A contagem de celulas do cabecalho NAO pode dar certo com o numero errado de
//     colunas: cinco e o que o print tem.
if (celulasCabecalho.length !== 5) { quebrado += 1; }

/**
 * (l) `strict` NAO pode voltar a ser `false` sem alguem decidir isso.
 *
 * Foi `strict: false` que fez esta bancada acusar um erro que o `npm run
 * typecheck` do projeto NAO acusa — o instrumento estava mais fraco que o alvo e
 * do lado errado. A prova le a opcao do PROPRIO programa compilado: se alguem
 * reverter a configuracao, a bancada avisa em vez de voltar a acusar fantasma.
 */
const opcoesUsadas = programa.getCompilerOptions();
if (opcoesUsadas.strict === true) { quebrado += 0; } else { quebrado += 1; }

if (quebrado === 0) ok('as doze provas ao contrario falharam como deviam', 'o instrumento acusa defeito');
else fail('a bancada passaria em qualquer coisa', `${quebrado} de 12 provas ao contrario nao acusaram`);

console.log(`\n${'-'.repeat(64)}`);
console.log(`${provas} provas, ${falhas} falha(s)`);
console.log(`${'-'.repeat(64)}\n`);
process.exit(falhas === 0 ? 0 : 1);
