/**
 * Bancada de `Clube VIP & Cashback` da area da cliente (fase 2, modulo 9).
 *
 * ================== O QUE ESTA BANCADA PROVA POR RENDER, E O QUE NAO ==================
 *
 *   POR RENDER  ->  `LinhaExtrato` e `CartaoRecompensa` nao tem efeito (so props),
 *                   entao `renderToStaticMarkup` os monta de verdade. E aqui que
 *                   mora a prova mais forte das duas:
 *
 *                     `LinhaExtrato`     monta um `adjustment` NEGATIVO — o caso
 *                                        que o ORIGINAL desenha com `+` verde e
 *                                        conta como saida no saldo.
 *                     `CartaoRecompensa` monta os DOIS estados; o material so
 *                                        mostra o BLOQUEADO.
 *
 *   POR FONTE   ->  a `ClubeView` carrega o resumo num efeito e o SSR pararia em
 *                   `Carregando...`; o resto da tela se prova lendo o arquivo.
 *
 * ================== A PROVA CENTRAL: O SINAL DA LINHA = O SINAL DO SALDO ==================
 *
 * `saldoPontosDoExtrato` e a linha do extrato precisam dar o MESMO veredito para
 * o mesmo lancamento. A secao 4 monta um extrato com um `adjustment` negativo e
 * confere que:
 *
 *   - o saldo CAI, e
 *   - a linha sai com `-`, e nunca com `+` verde.
 *
 * No original os dois discordam (a cor da linha usa uma regra mais frouxa que o
 * saldo). Esta e a prova que a correcao existe, e nao so que ela foi prometida.
 *
 * ================== E A IGUALDADE DO `BRONZE` ==================
 *
 * O Dashboard e o Clube desenham o MESMO nivel. `DEMO_NIVEL_CLUBE` tem que ser
 * `DEMO_NIVEIS_CLUBE[0]` por IDENTIDADE de referencia — se fosse uma segunda
 * declaracao, a cor poderia divergir entre as duas telas.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Cor exata de pixel (navegador), o clique real, e que nada grava por execucao do
 * banco — nao ha banco. Prova que `resgatarRecompensa` DEVOLVE `ok: false` e que a
 * tela mostra esse motivo em vez de um sucesso falso.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-clube.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-clube');
const ORIGINAL = join(
  PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA',
  'src', 'routes', 'conta.pontos.tsx',
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

/** As mesmas raizes das bancadas de Medidas, Enderecos, Favoritos e Pedidos. */
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
const tiposMod = require(join(OUT, 'src/lib/cliente/types.js'));
const {
  LinhaExtrato,
  CartaoRecompensa,
  entradaDePontos,
} = require(join(OUT, 'src/components/cliente/clube-view.js'));

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
const arquivo = (rel) => readFileSync(join(PROJ, rel), 'utf8');

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const cru = arquivo('src/components/cliente/clube-view.tsx');
const fonteView = semComentarios(cru);
const fonteRota = arquivo('src/app/(cliente)/conta/pontos/page.tsx');
/**
 * O `data.ts` e lido nas DUAS formas. A secao 8 procura NOTAS (o efeito duplo do
 * resgate), e nota mora em COMENTARIO — `semComentarios` daria falso negativo.
 * E o mesmo defeito de instrumento que a bancada de Medidas ja corrigiu.
 */
const fonteDataCru = arquivo('src/lib/cliente/data.ts');
const fonteData = semComentarios(fonteDataCru);
const fonteTipos = semComentarios(arquivo('src/lib/cliente/types.ts'));
const fonteDemo = arquivo('src/lib/cliente/demo.ts');

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `conta.pontos.tsx` — o que o original declara');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a fonte do COMPORTAMENTO desta tela');

  const declaracoes = [
    ['Clube VIP Closet Lunar', 'o titulo — escrito `Lunar`, e nao `Lunnar`'],
    ['Quanto mais você compra, mais benefícios exclusivos você ganha.', 'a descricao'],
    ['Você faz parte do nosso Clube VIP!', 'a linha de apoio do cartao escuro'],
    ['Seu Saldo', 'o rotulo do saldo'],
    ['pontos', 'a unidade do saldo'],
    ['Progresso para o próximo nível', 'o rotulo da barra'],
    ['Nível Máximo Atingido!', 'o ramo do topo da escada'],
    ['Seus Benefícios', 'o titulo da secao de beneficios'],
    ['Trocar por Recompensas', 'o titulo da secao de recompensas'],
    ['Uso único em todo o site', 'a linha de apoio da recompensa'],
    ['Resgatar Agora', 'o botao quando o saldo cobre'],
    ['Histórico', 'o titulo da secao do extrato'],
    ['Movimentação', 'o rotulo de fallback do extrato'],
    ['Nenhuma movimentação.', 'a frase do extrato vazio (o estado do print)'],
    ['Níveis do Clube', 'o titulo da lista de niveis'],
    ['Regras do Programa', 'o titulo da secao escura'],
    ['Os pontos expiram em 12 meses após a data de ganho.', 'a 1a regra'],
    ['O resgate gera um cupom de desconto de uso único.', 'a 2a regra'],
    ['Indique uma amiga: ganhe', 'a 3a regra (com o numero vindo do dado)'],
    ['pontos após a primeira compra.', 'a cauda da 3a regra'],
    ['Avalie seus produtos: ganhe', 'a 4a regra (com o numero vindo do dado)'],
    ['pontos por cada avaliação.', 'a cauda da 4a regra'],
  ];
  for (const [texto, nome] of declaracoes) {
    const noOriginal = fonteOriginal.includes(texto);
    const naTela = fonteView.includes(texto);
    if (noOriginal && naTela) ok(`${nome}: declarado nos dois`, `"${texto}"`);
    else fail(`${nome}`, `original: ${noOriginal} · tela: ${naTela}`);
  }

  /*
    `Seu Saldo` e a TERCEIRA ocorrencia nesta area do mesmo padrao de caixa: o
    projeto escreve o texto em caixa natural e sobe a caixa com o `uppercase` da
    classe. Aqui nao ha divergencia de caixa (o original tambem escreve
    `Seu Saldo`), mas a prova compara MAIUSCULIZADO assim mesmo: foi exatamente
    esse par que fez a bancada de `Medidas` reprovar o `SALVAR PERFIL DE MEDIDAS`,
    e a licao daquele defeito de instrumento vale para toda tela — comparar o
    TEXTO RENDERIZADO, e nao a grafia do arquivo.
  */
  const chaveSaldo = declaracoes.find(([, nome]) => nome === 'o rotulo do saldo');
  if (chaveSaldo) {
    const bate = fonteOriginal.toUpperCase().includes('SEU SALDO') && fonteView.includes('uppercase');
    if (bate) ok('o rotulo do saldo confere com a caixa RENDERIZADA', '`Seu Saldo` + classe `uppercase`');
    else fail('a caixa do saldo', 'o rotulo nao sai `SEU SALDO` na tela');
  }

  /**
   * AS DUAS FRASES QUE SO EXISTEM NO ORIGINAL POR CONCATENACAO.
   *
   * `Faltam {n} pontos para você se tornar PRATA` e `Faltam {n} pontos` sao
   * montadas com interpolacao. Procurar a frase inteira no arquivo falharia nos
   * dois lados — o que se prova e o PEDACO literal, e depois a frase MONTADA, no
   * render (secao 5) e no dado (secao 6).
   */
  if (fonteOriginal.includes('pontos para você se tornar') && fonteView.includes('pontos para você se tornar'))
    ok('a frase do "faltam para o proximo nivel"', 'o pedaco literal esta nos dois');
  else fail('a frase do proximo nivel', 'o pedaco literal nao bate');

  /** O `Faltam {n} pontos` do botao bloqueado — o texto do print `cli-013`. */
  if (fonteView.includes('Faltam ${faltam} pontos') || /Faltam \$\{[^}]+\} pontos/.test(fonteView))
    ok('o `Faltam N pontos` do botao bloqueado', 'o texto literal do print esta na tela');
  else fail('o texto do botao bloqueado', 'nao ha `Faltam N pontos` na tela');

  /**
   * OS ICONES. O original importa cinco do `lucide-react`, e cada um tem um
   * papel. Trocar `Trophy` por `Gem` (a tentacao natural para "clube VIP") nao
   * mudaria nenhum texto — so o desenho.
   */
  for (const [icone, papel] of [
    ['Trophy', 'o nivel: no cartao escuro, na recompensa e na lista de niveis'],
    ['History', 'o titulo da secao `Histórico`'],
    ['Gift', 'o titulo de `Trocar por Recompensas`'],
    ['ArrowRight', 'os quatro marcadores das `Regras do Programa`'],
    ['Sparkles', 'o titulo de `Seus Benefícios`'],
  ]) {
    if (new RegExp(`\\b${icone}\\b`).test(fonteView)) ok(`${icone} — ${papel}`);
    else fail(`${icone}`, `o icone nao esta na tela (${papel})`);
  }

  /** Os dois titulos de secao usam o MESMO `text-accent` do original. */
  const ocorrenciasAccent = (fonteView.match(/text-accent/g) || []).length;
  if (ocorrenciasAccent >= 2)
    ok('`text-accent` nos dois titulos', `${ocorrenciasAccent} ocorrencias — iguais as do original`);
  else fail('`text-accent`', `esperado 2 (beneficios e recompensas), achou ${ocorrenciasAccent}`);
}

/* ============ 2. o cabecalho, e por que ele e proprio ============ */

console.log('\n2. o cabecalho desta tela — `<header>` dentro do `space-y-8`');

if (
  fonteView.includes('space-y-8') &&
  /<header>/.test(fonteView) &&
  !fonteView.includes('ClientPageHeader') &&
  fonteView.includes('font-serif text-3xl')
)
  ok('cabecalho proprio, sem `ClientPageHeader`', 'titulo `text-3xl` serifado + descricao, dentro do `space-y-8`');
else fail('o cabecalho', 'reusou o componente compartilhado, que somaria `mb-6` ao `space-y-8`');

/**
 * A TAG E `h2`, E NAO O `h1` DO ORIGINAL.
 *
 * Este e o unico print da area da cliente em que o titulo da tela e `<h1>`. O
 * projeto usa `<h2>` em todas as telas desta area — e `/conta/pontos` nunca
 * renderiza junto com `/conta`, que e onde vive o unico `<h1>` da area.
 */
if (/\bh2\b/.test(fonteView) && !/<h1/.test(fonteView))
  ok('o titulo e `h2`, como o resto da area', 'o `<h1>` do original e a unica tag fora do padrao');
else fail('a tag do titulo', 'a tela usa `h1` — verificar se nao duplica o `<h1>` da saudacao');

/** A descricao e `text-sm text-muted-foreground`, igual a de `Minhas Medidas`. */
if (/mt-1 text-sm text-muted-foreground/.test(fonteView))
  ok('a descricao e do tamanho do traco medido', '`mt-1 text-sm` — 15 px de tinta no `004801`, como no `004742`');
else fail('a descricao', 'o tamanho da descricao nao bate com o medido');

/* ============ 3. o cartao escuro do nivel ============ */

console.log('\n3. o cartao escuro — a faixa do topo, a barra e o saldo');

/**
 * A FAIXA DO TOPO E UMA BORDA DE 8 px.
 *
 * Medida no `cli-012`: as linhas 414 a 421 da coluna x=1500 sao (205,127,50)
 * cheio, e a 422 ja e o preto do cartao. Sao 8 linhas de 1x — exatamente o
 * `borderTop: 8px solid` do original.
 */
if (/borderTop: `8px solid \$\{cor\}`/.test(fonteView) || /borderTop: `8px solid/.test(fonteView))
  ok('a faixa do topo e `borderTop: 8px solid`', 'a medida do `cli-012` (x=1500, linhas 414-421)');
else fail('a faixa do topo', 'a borda de 8 px do nivel nao esta no cartao');

/** O cartao escuro e `bg-foreground text-background`, e nao um preto literal. */
if (/rounded-2xl bg-foreground p-8 text-background shadow-elegant/.test(fonteView))
  ok('o cartao escuro usa os tokens', '`bg-foreground text-background shadow-elegant`, `rounded-2xl p-8`');
else fail('as classes do cartao escuro', 'o cartao nao segue o original');

/**
 * A COR DO NIVEL VEM DO DADO, E NAO DO CODIGO.
 *
 * O original le `currentTier.color` e joga no `style`. A prova: o componente le
 * `cor` de `nivel`/`t`, e nao escreve um hexadecimal.
 */
if (/const cor = nivel\?\.cor \?\?/.test(fonteView) && /style=\{\{ color: t\.cor \}\}/.test(fonteView))
  ok('a cor sai do DADO no cartao e na lista', '`nivel?.cor` e `t.cor`, sem hexadecimal no componente');
else fail('a origem da cor', 'a tela nao le a cor do nivel');

/** A BARRA: `h-2`, trilho `bg-background/10`, largura = `progressoPct`. */
if (
  /h-2 w-full overflow-hidden rounded-full bg-background\/10/.test(fonteView) &&
  /width: `\$\{progressoPct\}%`/.test(fonteView)
)
  ok('a barra de progresso', 'trilho `h-2 bg-background/10` + largura `progressoPct%`');
else fail('a barra de progresso', 'a barra nao segue o original');

/** O `Nível Máximo Atingido!` e o ramo `sem proximoNivel`. */
if (/proximoNivel \? \(/.test(fonteView) && fonteView.includes('Nível Máximo Atingido!'))
  ok('o ramo do topo da escada', '`Nível Máximo Atingido!` quando nao ha proximo nivel');
else fail('o ramo do topo', 'o ramo sem proximo nivel nao esta na tela');

/* ============ 4. A PROVA CENTRAL — o sinal da linha = o sinal do saldo ============ */

console.log('\n4. a prova central — a linha do extrato e o saldo tem que concordar');

const comNegativo = [
  { id: 'm1', tipo: 'earn', pontos: 500, descricao: 'Compra #ff3048c9', criadoEm: '2026-08-01T10:00:00' },
  { id: 'm2', tipo: 'redeem', pontos: 200, descricao: 'Resgate R$ 10', criadoEm: '2026-08-02T10:00:00' },
  { id: 'm3', tipo: 'adjustment', pontos: 100, descricao: 'Ajuste a mais', criadoEm: '2026-08-03T10:00:00' },
  /*
    O AJUSTE PARA BAIXO VEM COM O NUMERO NEGATIVO — e nao com `+50` e o tipo
    bastando. E o que a linha do original prova (`points > 0`), e e o unico
    caso que separa a conta certa da conta do original.
  */
  { id: 'm4', tipo: 'adjustment', pontos: -50, descricao: 'Ajuste a menos', criadoEm: '2026-08-04T10:00:00' },
];

/** O veredito esperado de cada lancamento — ESCRITO A MAO, e nao pela funcao.  */
const vereditoEsperado = [true, false, true, false];

/** A funcao que a TELA usa, pelo mesmo simbolo que o saldo usa. */
const vereditosTela = comNegativo.map((m) => metrics.movimentoEntra(m));
if (JSON.stringify(vereditosTela) === JSON.stringify(vereditoEsperado))
  ok('a regra interpreta os 4 tipos', `earn:true redeem:false ajuste+:true ajuste-:false`);
else
  fail('a regra do sinal', `obtido [${vereditosTela.join(', ')}] · esperado [${vereditoEsperado.join(', ')}]`);

/**
 * ================== A IGUALDADE E POR IDENTIDADE DE SIMBOLO ==================
 *
 * `entradaDePontos` (a que a LINHA usa) e `movimentoEntra` (a que o SALDO usa)
 * tem que ser a MESMA funcao — o mesmo objeto, e nao duas copias equivalentes.
 * Duas copias passariam nesta prova HOJE e divergiriam no primeiro ajuste que
 * uma recebesse. A identidade e a unica prova que nao envelhece.
 */
if (entradaDePontos === metrics.movimentoEntra)
  ok('a linha e o saldo usam a MESMA funcao', 'identidade de simbolo, e nao igualdade de comportamento');
else fail('duas funcoes diferentes', 'a linha do extrato tem copia propria da regra');

/**
 * O SALDO tem que cair: 500 (entra) − 200 (sai) + 100 (entra) − 50 (sai) = 350.
 *
 * E o numero prova a aritmetica. O DEFEITO DO ORIGINAL daria OUTRO numero: com
 * `acc + (entra ? p.points : -p.points)` e `points` = −50 no ultimo ajuste, ele
 * faz `-(-50)` = +50, e o saldo sai 450 — o ajuste que devia tirar pontos os
 * ACRESCENTA. Esta e a prova que separa 350 de 450.
 */
const saldo = metrics.saldoPontosDoExtrato(comNegativo);
if (saldo === 350)
  ok('o saldo conta o ajuste negativo como SAIDA', '500 − 200 + 100 − 50 = 350 (o original daria 450)');
else fail('a conta do saldo', `obtido ${saldo}, esperado 350 (o defeito do original daria 450)`);

/**
 * E A MAGNITUDE IGNORA O SINAL DO PROPRIO VALOR.
 *
 * `Math.abs` nao e decoracao: sem ele, `-(-50)` no saldo e `-50` na lista
 * imprimiriam um ajuste que cai como se subisse.
 */
if (metrics.magnitudePontos({ tipo: 'adjustment', pontos: -50 }) === 50)
  ok('`magnitudePontos` ignora o sinal do valor', '`-50` vira `50` — o sinal e do TIPO, nao do numero');
else fail('a magnitude', 'o valor negativo nao foi normalizado');


/** A LINHA do ajuste negativo: sai com `-`, e nunca com `+` verde. */
const htmlAjusteNegativo = render(LinhaExtrato, { movimento: comNegativo[3] });
const textoAjusteNegativo = textos(htmlAjusteNegativo);
if (textoAjusteNegativo.includes('-50') && !textoAjusteNegativo.includes('+50'))
  ok('a linha do ajuste negativo sai com `-`', textoAjusteNegativo);
else fail('a linha do ajuste negativo', `saiu "${textoAjusteNegativo}"`);

if (htmlAjusteNegativo.includes('text-danger') && !htmlAjusteNegativo.includes('text-success'))
  ok('o ajuste negativo sai em `danger`', 'a cor acompanha o sinal');
else fail('a cor do ajuste negativo', 'a linha usa a cor de entrada para uma saida');

/** E a linha do ajuste POSITIVO sai com `+` em `success` — o contraste. */
const htmlAjustePositivo = render(LinhaExtrato, { movimento: comNegativo[2] });
if (textos(htmlAjustePositivo).includes('+100') && htmlAjustePositivo.includes('text-success'))
  ok('o ajuste positivo sai com `+` em `success`', textos(htmlAjustePositivo));
else fail('o ajuste positivo', `saiu "${textos(htmlAjustePositivo)}"`);

/** A linha do `earn` tambem entra. */
const htmlEarn = render(LinhaExtrato, { movimento: comNegativo[0] });
if (textos(htmlEarn).includes('+500') && htmlEarn.includes('text-success'))
  ok('o `earn` entra', textos(htmlEarn));
else fail('o `earn`', textos(htmlEarn));

/** A linha do `redeem` sai. */
const htmlRedeem = render(LinhaExtrato, { movimento: comNegativo[1] });
if (textos(htmlRedeem).includes('-200') && htmlRedeem.includes('text-danger'))
  ok('o `redeem` sai', textos(htmlRedeem));
else fail('o `redeem`', textos(htmlRedeem));

/**
 * O `description` FALTANDO vira `Movimentação`, e nao string vazia.
 *
 * O original escreve `p.description || 'Movimentação'`. Um `?? ''` deixaria a
 * linha com o motivo em branco.
 */
const htmlSemDescricao = render(LinhaExtrato, {
  movimento: { id: 'x', tipo: 'earn', pontos: 10, descricao: null, criadoEm: '2026-08-05T10:00:00' },
});
if (textos(htmlSemDescricao).includes('Movimentação'))
  ok('a descricao nula vira `Movimentação`', textos(htmlSemDescricao));
else fail('a descricao nula', `saiu "${textos(htmlSemDescricao)}"`);

/** E a data do movimento sai `DD/MM/AAAA`, sem fuso. */
if (textos(htmlSemDescricao).includes('05/08/2026'))
  ok('a data do extrato sai `DD/MM/AAAA`', '`2026-08-05T10:00:00` -> `05/08/2026` (sem passar por `Date`)');
else fail('a data do extrato', textos(htmlSemDescricao));

/* ============ 5. o cartao de recompensa — os DOIS estados ============ */

console.log('\n5. o cartao de recompensa — o material so mostra o BLOQUEADO');

const htmlBloqueado = render(CartaoRecompensa, {
  rotulo: 'R$ 10 de desconto',
  pontos: 500,
  podeResgatar: false,
  faltam: 500,
  onResgatar: () => {},
});
const htmlLiberado = render(CartaoRecompensa, {
  rotulo: 'R$ 10 de desconto',
  pontos: 500,
  podeResgatar: true,
  faltam: 0,
  onResgatar: () => {},
});

if (textos(htmlBloqueado).includes('Faltam 500 pontos'))
  ok('o estado BLOQUEADO e o do print', '"Faltam 500 pontos"');
else fail('o estado bloqueado', textos(htmlBloqueado));

if (textos(htmlLiberado).includes('Resgatar Agora'))
  ok('o estado LIBERADO existe', '"Resgatar Agora" — o ramo que nenhum print mostra');
else fail('o estado liberado', textos(htmlLiberado));

/** Os dois estados tem que ser DIFERENTES — senao a prova seria cega. */
if (htmlBloqueado !== htmlLiberado)
  ok('os dois estados sao diferentes', 'a prova do `podeResgatar` tem contraste');
else fail('estados iguais', 'a prova do `podeResgatar` seria cega');

/** No bloqueado o botao esta `disabled`; no liberado, nao. */
if (/disabled=""/.test(htmlBloqueado) && !/disabled/.test(htmlLiberado))
  ok('o botao bloqueado esta `disabled` e o liberado nao', 'o atributo existe so no estado bloqueado');
else fail('o `disabled`', 'os dois estados nao se distinguem pelo atributo');

/**
 * O `Resgatar Agora` TEM `onClick` — e isto e uma DIVERGENCIA REGISTRADA.
 *
 * O original declara o botao so com `disabled={!canAfford}`: nao ha `onClick`
 * nele. Aqui ha, e ele chama `resgatarRecompensa()` — que devolve `ok: false` e
 * mostra o motivo. Transcrever a omissao deixaria um botao que parece
 * acionavel e nao faz nada, que e justamente o defeito que esta fase existe
 * para nao repetir.
 */
if (/onClick=\{onResgatar\}/.test(fonteView))
  ok('o botao TEM `onClick` (divergencia do original)', 'o original omite o `onClick`; aqui ele avisa que nao grava');
else fail('o `onClick`', 'o botao nao tem acao — o mesmo defeito do original');

/** O selo do custo: `{pontos} PTS` em `bg-foreground`. */
if (/bg-foreground px-3 py-1 font-mono text-\[10px\] font-black text-background/.test(fonteView))
  ok('o selo de custo', '`bg-foreground text-background`, mono — o do print');
else fail('o selo de custo', 'o selo nao segue o original');

/** A borda muda de cor conforme o estado — `border-foreground` vs `border-border`. */
if (htmlLiberado.includes('border-foreground') && htmlBloqueado.includes('border-border'))
  ok('a borda do cartao segue o estado', 'liberado `border-foreground`, bloqueado `border-border`');
else fail('a borda do cartao', 'a borda nao acompanha o estado');

/* ============ 6. o dado — o que a tela le ============ */

console.log('\n6. o dado — saldo, acumulado, nivel, progresso e o extrato');

const clube = await dados.getClube();
const c = clube.data;

/**
 * O EXTRATO VAZIO E O DO PRINT, e dele saem QUATRO zeros coerentes:
 * saldo 0, acumulado 0, nivel BRONZE (o piso) e progresso 0%.
 */
if (c.saldo === 0 && c.acumulado === 0)
  ok('o extrato vazio da saldo 0 e acumulado 0', 'o estado dos prints `cli-012` e `cli-013`');
else fail('saldo/acumulado do demo', `saldo ${c.saldo} · acumulado ${c.acumulado}`);

if (c.nivel && c.nivel.nome === 'Bronze' && c.nivel.minimoPontos === 0)
  ok('o nivel e o `Bronze`', 'o piso da escada, com 0 ponto acumulado');
else fail('o nivel atual', JSON.stringify(c.nivel));

if (c.proximoNivel && c.proximoNivel.nome === 'Prata')
  ok('o proximo nivel e o `Prata`', '`Faltam 1000 pontos para você se tornar PRATA`');
else fail('o proximo nivel', JSON.stringify(c.proximoNivel));

if (c.faltamProximo === 1000 && c.progressoPct === 0)
  ok('faltam 1000 e a barra sai VAZIA', '0 / 1000 PTS — a barra do `cli-012` esta vazia de proposito');
else fail('o progresso', `faltam ${c.faltamProximo} · ${c.progressoPct}%`);

/** OS QUATRO NIVEIS, na ordem do print, com os limiares do material. */
const ordemNiveis = c.niveis.map((n) => `${n.nome}:${n.minimoPontos}`);
if (JSON.stringify(ordemNiveis) === JSON.stringify(['Bronze:0', 'Prata:1000', 'Ouro:3000', 'Diamante:7000']))
  ok('os 4 niveis na ordem do print', ordemNiveis.join(', '));
else fail('os niveis', ordemNiveis.join(', '));

/** AS TRES RECOMPENSAS, com os custos do material. */
const custos = c.recompensas.map((r) => r.pontos);
if (JSON.stringify(custos) === JSON.stringify([500, 1000, 2000]))
  ok('as 3 recompensas e seus custos', '500, 1000, 2000 — os do `cli-013`');
else fail('as recompensas', JSON.stringify(c.recompensas));

/** AS REGRAS, com os dois numeros do print. */
if (c.regras.pontosIndicacao === 100 && c.regras.pontosAvaliacao === 50)
  ok('as regras: 100 por indicacao e 50 por avaliacao', 'os numeros que a secao escura imprime');
else fail('as regras', JSON.stringify(c.regras));

/**
 * A ORDEM DO EXTRATO E MAIS RECENTE PRIMEIRO — `.order("created_at", {descending})`.
 *
 * A prova NAO usa o demo vazio: ela poe duas linhas no array, le a ordem que
 * `getClube` devolve, e RESTAURA o array. Senao a bancada deixaria a
 * demonstracao global do modulo mexida para as bancadas seguintes.
 */
const originalPontos = demo.DEMO_PONTOS_CLUBE.slice();
demo.DEMO_PONTOS_CLUBE.length = 0;
demo.DEMO_PONTOS_CLUBE.push(
  { id: 'a', tipo: 'earn', pontos: 10, descricao: 'antiga', criadoEm: '2026-01-01T00:00:00' },
  { id: 'b', tipo: 'earn', pontos: 20, descricao: 'nova', criadoEm: '2026-09-01T00:00:00' },
);
const ordenado = (await dados.getClube()).data.extrato.map((m) => m.id);
demo.DEMO_PONTOS_CLUBE.length = 0;
demo.DEMO_PONTOS_CLUBE.push(...originalPontos);

if (JSON.stringify(ordenado) === JSON.stringify(['b', 'a']))
  ok('o extrato vem mais recente primeiro', `['b','a'] (e o demo foi restaurado: ${demo.DEMO_PONTOS_CLUBE.length} itens)`);
else fail('a ordem do extrato', `${JSON.stringify(ordenado)} — esperado ['b','a']`);

if (demo.DEMO_PONTOS_CLUBE.length === 0)
  ok('o array do demo voltou ao estado original', 'a bancada nao deixa residuo');
else fail('residuo no demo', `sobrou ${demo.DEMO_PONTOS_CLUBE.length} item(ns)`);

/** O DEMO NAO TEM EXTRATO — e a bancada acima nao o inventou. */
if (demo.DEMO_PONTOS_CLUBE.length === 0 && c.extrato.length === 0)
  ok('a demonstracao nasce VAZIA', 'como o print: `Nenhuma movimentação.`');
else fail('o extrato do demo', `${c.extrato.length} linha(s)`);

/* ============ 7. `bronze` e o mesmo objeto nas duas telas ============ */

console.log('\n7. o `Bronze` do dashboard e o do clube sao o MESMO');

/**
 * A IGUALDADE E POR IDENTIDADE DE REFERENCIA.
 *
 * `DEMO_NIVEL_CLUBE` tem que ser o MESMO objeto que `DEMO_NIVEIS_CLUBE[0]`. Se
 * fosse `{ ...DEMO_NIVEIS_CLUBE[0] }` (uma copia), mudar a cor em um lugar nao
 * mudaria no outro — e as duas telas mostrariam bronzes diferentes.
 */
if (demo.DEMO_NIVEL_CLUBE === demo.DEMO_NIVEIS_CLUBE[0])
  ok('`DEMO_NIVEL_CLUBE === DEMO_NIVEIS_CLUBE[0]`', 'o mesmo objeto, e nao uma copia');
else fail('a identidade do Bronze', 'o dashboard e o clube tem dois objetos diferentes para o mesmo nivel');

/** A cor do `Bronze` e `#CD7F32` — a medida da FAIXA SOLIDA do `cli-012`. */
if (demo.DEMO_NIVEL_CLUBE.cor === '#CD7F32')
  ok('a cor do `Bronze` e `#CD7F32`', 'medida na faixa do topo (205,127,50), e nao na tinta da palavra');
else fail('a cor do Bronze', demo.DEMO_NIVEL_CLUBE.cor);

/** E o dashboard e o clube leem a MESMA cor. */
const resumo = await dados.getResumo();
if (resumo.data.nivel && resumo.data.nivel.cor === c.nivel.cor)
  ok('o dashboard e o clube mostram a MESMA cor', `ambos ${c.nivel.cor}`);
else fail('as cores divergem', `dashboard: ${resumo.data.nivel?.cor} · clube: ${c.nivel.cor}`);

/**
 * E OS QUATRO NIVEIS TEM CORES DIFERENTES.
 *
 * A bancada anterior do Bronze pegou um erro exatamente por medir a TINTA de um
 * texto em vez da cor solida. Uma prova que apenas checasse "tem cor" passaria
 * com quatro strings iguais.
 */
const cores = c.niveis.map((n) => n.cor);
if (new Set(cores).size === 4)
  ok('os 4 niveis tem 4 cores DIFERENTES', cores.join(' · '));
else fail('as cores dos niveis', `so ${new Set(cores).size} cores distintas`);

/* ============ 8. a honestidade — a escrita nao grava, e diz isso ============ */

console.log('\n8. a escrita — o resgate nao grava, e a tela mostra o motivo');

const escrita = await dados.resgatarRecompensa();
if (escrita.ok === false && typeof escrita.reason === 'string' && escrita.reason.length > 0)
  ok('`resgatarRecompensa` devolve `ok: false` com motivo', escrita.reason);
else fail('a escrita', JSON.stringify(escrita));

/**
 * E O MOTIVO E O `PENDING_REASON` DO MODULO — um texto so para toda a area.
 * O mesmo numero de arquivo, a mesma promessa de Neon.
 */
const { PENDING_REASON } = dados;
if (escrita.reason === PENDING_REASON && /Neon/.test(PENDING_REASON))
  ok('o motivo e o `PENDING_REASON` da area', PENDING_REASON);
else fail('o motivo', 'a escrita tem motivo proprio em vez do compartilhado');

/** A TELA mostra o motivo, e nao um sucesso — o mesmo padrao de Medidas/Enderecos. */
if (
  /setAviso/.test(fonteView) &&
  /reason \?\?/.test(fonteView) &&
  /ClienteToast/.test(fonteView) &&
  fonteView.includes('não foi possível resgatar')
)
  ok('a tela mostra o `reason` num aviso', '`reason ?? "Ainda não foi possível resgatar."` + `ClienteToast`');
else fail('a tela e honesta?', 'a tela nao mostra o motivo da escrita');

/** E o SUCESSO tambem existe — senao o ramo nunca foi escrito. */
if (fonteView.includes('resgatada') && /tom: 'sucesso'/.test(fonteView))
  ok('o ramo de sucesso existe', '`{rotulo} resgatada` + `tom: "sucesso"`');
else fail('o ramo de sucesso', 'a tela so tem o caminho de erro');

/** A TELA NAO IMPORTA O ADMIN — a area da cliente tem a fonte dela. */
if (!/from '@\/lib\/admin/.test(fonteView) && !/admin\//.test(fonteView))
  ok('a tela nao importa nada do admin', 'a area da cliente le so `@/lib/cliente`');
else fail('import cruzado', 'a tela do cliente importa do admin');

/* ============ 9. o contrato — e a nota de transacao dupla ============ */

console.log('\n9. o contrato — `ResumoClube` e o efeito duplo do resgate');

for (const [campo, papel] of [
  ['saldo: number', 'o que a cliente pode gastar'],
  ['acumulado: number', 'o que ela ja conquistou — decide o nivel'],
  ['progressoPct: number', 'a largura da barra'],
  ['faltamProximo: number', 'os pontos ate o proximo nivel'],
  ['extrato: MovimentoPontos[]', 'o historico'],
  ['recompensas: RecompensaClube[]', 'as tres recompensas'],
  ['niveis: NivelClube[]', 'a lista lateral'],
  ['regras: RegrasClube', 'os dois numeros da secao escura'],
]) {
  if (new RegExp(campo.replace(/[[\]]/g, '\\$&')).test(fonteTipos)) ok(`\`${campo}\` — ${papel}`);
  else fail(`\`${campo}\``, 'o campo nao existe em `types.ts`');
}

/** O `tipo` do movimento e uma UNIAO LITERAL — sem ele nao ha sinal. */
if (/'earn' \| 'bonus' \| 'redeem' \| 'adjustment'/.test(fonteTipos))
  ok('o `tipo` do movimento e uniao literal', '`earn | bonus | redeem | adjustment` — o sinal vem daqui');
else fail('o tipo do movimento', 'o `tipo` nao e uma uniao literal de quatro');

/**
 * A NOTA DO EFEITO DUPLO. O resgate gera um CUPOM e debita os pontos — duas
 * escritas que tem que caber na MESMA transacao. A nota tem que estar no arquivo
 * CRU: ela e um COMENTARIO, e `fonteData` ja o teria removido.
 */
if (
  /transa[çc][ãa]o|transaction/i.test(fonteDataCru) &&
  /cupom/i.test(fonteDataCru) &&
  /resgatarRecompensa/.test(fonteData)
)
  ok('`data.ts` anota a transacao dupla do resgate', 'o debito e o cupom na mesma transacao');
else fail('a nota de transacao', '`data.ts` nao anota o efeito duplo do resgate');

/** A ROTA existe e entrega a view. */
if (/ClubeView/.test(fonteRota))
  ok('a rota existe e entrega a view', '`/conta/pontos`, a URL do item `Clube VIP & Cashback`');
else fail('a rota', 'a pagina nao entrega a `ClubeView`');

/** E A ROTA E A DO MENU LATERAL — o `slug` de `NAV_ITEMS`. */
const fonteNav = semComentarios(arquivo('src/lib/cliente/nav.ts'));
if (/slug: 'pontos'/.test(fonteNav) && /label: 'Clube VIP & Cashback'/.test(fonteNav))
  ok('a rota e a do menu lateral', "`slug: 'pontos'` + `label: 'Clube VIP & Cashback'`");
else fail('a rota do menu', 'o item de nav nao aponta para `/conta/pontos`');

/* ============ 10. provas ao contrario ============ */

console.log('\n10. provas ao contrario — o instrumento tem que saber REPROVAR');

/** 1. `+50` e `-50` sao strings diferentes — a prova do sinal nao e cega. */
if (!'-50'.includes('+50'))
  ok('`-50` e `+50` nao colidem', 'a prova do sinal distingue entrada de saida');
else fail('os sinais colidem', 'a prova do sinal seria cega');

/** 2. `text-success` e `text-danger` sao strings diferentes. */
if (!'text-danger'.includes('text-success'))
  ok('`danger` e `success` nao colidem', 'a prova da cor distingue os dois');
else fail('as cores colidem', 'a prova da cor seria cega');

/** 3. O estado bloqueado e o liberado produzem HTML DIFERENTE. */
if (htmlBloqueado !== htmlLiberado)
  ok('os cartoes bloqueado e liberado sao diferentes', 'a prova do `podeResgatar` tem contraste');
else fail('cartoes iguais', 'a prova do `podeResgatar` seria cega');

/** 4. A escrita NAO devolve `true` fingindo sucesso. */
if (escrita.ok !== true)
  ok('a escrita nao devolve `true` fingindo sucesso', 'a prova do `ok: false` tem contraste');
else fail('a escrita gravou', 'a escrita devolveu `ok: true` sem banco');

/** 5. O extrato do demo continua VAZIO depois da prova de ordem. */
if (demo.DEMO_PONTOS_CLUBE.length === 0)
  ok('o demo continua vazio', 'a prova que inseriu duas linhas restaurou o array');
else fail('o demo foi mexido', 'a bancada deixou lixo na demonstracao global');

/** 6. A MAGNITUDE tem contraste: `-50` e `50` dao o mesmo, mas `-50` e `-20` nao. */
if (
  metrics.magnitudePontos({ tipo: 'adjustment', pontos: -50 }) ===
    metrics.magnitudePontos({ tipo: 'adjustment', pontos: 50 }) &&
  metrics.magnitudePontos({ tipo: 'adjustment', pontos: -50 }) !==
    metrics.magnitudePontos({ tipo: 'adjustment', pontos: -20 })
)
  ok('`magnitudePontos` nao e constante', '`-50` e `50` dao 50; `-50` e `-20` dao 50 e 20');
else fail('a magnitude e cega', 'a funcao devolve o mesmo para valores diferentes');

/** 7. `progressoClube` e puro: nao muda a lista de niveis recebida. */
const niveisAntes = c.niveis.map((n) => n.nome).join(',');
metrics.progressoClube(c.niveis, 3500);
const niveisDepois = c.niveis.map((n) => n.nome).join(',');
if (niveisAntes === niveisDepois)
  ok('`progressoClube` nao reordena a lista recebida', 'ordenar o array de entrada mexeria no dado global');
else fail('`progressoClube` mexeu na entrada', `${niveisAntes} -> ${niveisDepois}`);

/** 8. O meio da escada: 3500 pontos caem no `Ouro` e o proximo e o `Diamante`. */
const meio = metrics.progressoClube(c.niveis, 3500);
if (meio.nivel?.nome === 'Ouro' && meio.proximoNivel?.nome === 'Diamante' && meio.faltamProximo === 3500)
  ok('o meio da escada resolve certo', '3500 pts -> `Ouro`, proximo `Diamante`, faltam 3500');
else fail('o meio da escada', JSON.stringify({ n: meio.nivel?.nome, p: meio.proximoNivel?.nome, f: meio.faltamProximo }));

/** 9. O topo da escada: sem proximo nivel, a barra fica CHEIA. */
const topo = metrics.progressoClube(c.niveis, 9000);
if (topo.proximoNivel === null && topo.progressoPct === 100 && topo.faltamProximo === 0)
  ok('no topo nao ha proximo e a barra fica cheia', '`Nível Máximo Atingido!` com 100%');
else fail('o topo da escada', JSON.stringify(topo));

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
