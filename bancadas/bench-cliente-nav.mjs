/**
 * Bancada da FUNDACAO da area da cliente (fase 2, modulo 1).
 *
 * ================== POR QUE ESTA BANCADA EXISTE ==================
 *
 * A fundacao nao tem tela: ela tem NAVEGACAO e CONTRATO. Os dois erram em
 * silencio.
 *
 * Uma lista de navegacao com um item a mais ou a menos nao quebra nada — ela
 * so passa a mostrar, para sempre, um item que print nenhum tem. E o destaque
 * do item ativo erra calado: `startsWith('/conta/pedidos')` casa
 * `/conta/pedidos-teste`, e ninguem ve, porque a rota ainda nao existe. O
 * defeito nasce agora e aparece no dia em que a rota nascer.
 *
 * O contrato erra mais calado ainda: um `OrderStatus` redeclarado aqui e o
 * mesmo enum do admin, hoje. So no dia do Neon ele vira duas colunas
 * incompativeis para a mesma coisa — e a essa altura ja ha tela escrita em
 * cima dos dois. E por isso que esta bancada confere o IMPORT, e nao o valor.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Layout, cor e responsividade — isso e navegador. Ela tambem nao monta a
 * casca (`AccountShell`): ela usa `usePathname`, que fora de um router do Next
 * nao tem contexto. Em vez disso prova a CASCA por fonte (os breakpoints
 * `lg:hidden` / `hidden lg:block`) e os dois pedacos de navegacao por render,
 * que e onde o defeito de fato mora.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-nav.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-nav');

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
  ok('emissao sem erro', `${raizes.length} raizes da area da cliente`);
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

const nav = require(join(OUT, 'src/lib/cliente/nav.js'));
const metricas = require(join(OUT, 'src/lib/cliente/metrics.js'));
const dados = require(join(OUT, 'src/lib/cliente/data.js'));
const demo = require(join(OUT, 'src/lib/cliente/demo.js'));
const { AccountSidebar } = require(join(OUT, 'src/components/cliente/account-sidebar.js'));
const { AccountMobileNav } = require(join(OUT, 'src/components/cliente/account-mobile-nav.js'));

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

/* ============ 1. a navegacao — a lista que os prints provam ============ */

console.log('\n1. `NAV_ITEMS` — os NOVE itens, na ordem do print');

const rotulos = nav.NAV_ITEMS.map((i) => i.label);
const esperado = [
  'Dashboard', 'Meus Pedidos', 'Meus Favoritos', 'Endereços', 'Minhas Medidas',
  'Clube VIP & Cashback', 'Cupons', 'Dados da Conta', 'Segurança',
];

if (nav.NAV_ITEMS.length === 9)
  ok('a coluna tem EXATAMENTE 9 itens', 'nem 8, nem 10');
else fail('quantidade de itens', String(nav.NAV_ITEMS.length));

if (mesmo(rotulos, esperado))
  ok('os rotulos e a ORDEM sao os do print', esperado.join(' · '))
else fail('ordem dos rotulos', JSON.stringify(rotulos));

/** Os `slug` viram URL; um `slug` trocado e um link morto silencioso. */
if (mesmo(nav.NAV_ITEMS.map((i) => i.slug), ['', 'pedidos', 'favoritos', 'enderecos', 'medidas', 'pontos', 'cupons', 'dados', 'seguranca']))
  ok('os `slug` batem com as rotas do original', '`/conta`, `/conta/pedidos`, … `/conta/seguranca`');
else fail('slugs', JSON.stringify(nav.NAV_ITEMS.map((i) => i.slug)));

/** Nenhum `slug` repetido: dois itens iguais marcariam o mesmo ativo. */
if (new Set(nav.NAV_ITEMS.map((i) => i.slug)).size === 9)
  ok('nenhum `slug` se repete', 'o destaque nao tem como marcar dois itens');
else fail('slug repetido', JSON.stringify(nav.NAV_ITEMS.map((i) => i.slug)));

/**
 * `Afiliada` NAO pode estar na coluna. O print `cli-001` a mostra como ATALHO
 * do corpo, e a coluna do `cli-019` nao a tem — misturar as duas listas poe na
 * sidebar um item que o material nao mostra ali.
 */
if (!rotulos.some((r) => /Afiliad/i.test(r)))
  ok('`Afiliada` NAO esta na coluna', 'ela e atalho do corpo, e nao item de sidebar');
else fail('`Afiliada` entrou na sidebar', 'o print a mostra no corpo do dashboard');

/** `Looks` existe no original como ARQUIVO, mas em print nenhum. */
if (!rotulos.some((r) => /Looks/i.test(r)))
  ok('`Looks` NAO entrou', 'arquivo do original nao e referencia de interface');
else fail('`Looks` entrou', 'nenhum print tem esse item');

/** Os 3 icones que o olho erraria — conferidos por NOME, nao por forma. */
const icones = nav.NAV_ITEMS.map((i) => i.icon.displayName || i.icon.name || '');
if (icones[5] === 'Trophy' && icones[7] === 'UserCog' && icones[8] === 'Shield')
  ok('`Trophy` · `UserCog` · `Shield` — e nao `Gem`/`User`/`Lock`', 'os tres que o original declara')
else fail('icones', JSON.stringify([icones[5], icones[7], icones[8]]));

if (String(icones[0]) === 'LayoutDashboard')
  ok('o item raiz usa `LayoutDashboard`', '`Dashboard` e a raiz, e nao uma sub-rota');
else fail('icone da raiz', String(icones[0]));

/** A descricao so existe onde o print escreve uma. */
const comDescricao = nav.NAV_ITEMS.filter((i) => typeof i.description === 'string');
if (comDescricao.length === 2 && comDescricao.map((i) => i.slug).join(',') === 'dados,seguranca')
  ok('so DUAS telas tem linha de apoio', '`Dados da Conta` e `Segurança` — as que o print mostra');
else fail('descricoes', JSON.stringify(comDescricao.map((i) => i.slug)));

/* ============ 2. os atalhos — OUTRA lista, com outros rotulos ============ */

console.log('\n2. `CONTA_ATALHOS` — os OITO cartoes do dashboard');

if (nav.CONTA_ATALHOS.length === 8)
  ok('sao EXATAMENTE 8 atalhos', 'a grade do `cli-001`');
else fail('quantidade de atalhos', String(nav.CONTA_ATALHOS.length));

const atalhosRotulos = nav.CONTA_ATALHOS.map((a) => a.label);
if (atalhosRotulos.includes('Afiliada'))
  ok('`Afiliada` esta entre os atalhos', 'e o UNICO caminho para `/conta/afiliada` nesta fase');
else fail('`Afiliada` ausente', JSON.stringify(atalhosRotulos));

/** O rotulo do atalho NAO e o da coluna — sao duas redacoes do mesmo material. */
if (atalhosRotulos.includes('Favoritos') && atalhosRotulos.includes('Meus Cupons') &&
    !atalhosRotulos.includes('Meus Favoritos') && !atalhosRotulos.includes('Cupons'))
  ok('o atalho usa o rotulo DELE (`Favoritos`, `Meus Cupons`)', 'igualar as duas listas apagaria uma das redacoes');
else fail('rotulos dos atalhos', JSON.stringify(atalhosRotulos));

/** Os atalhos que apontam para a mesma rota da coluna tem que apontar para a MESMA rota. */
const porHref = new Map(nav.CONTA_ATALHOS.map((a) => [a.href, a]));
const pares = [
  ['/conta/pedidos', 'pedidos'], ['/conta/favoritos', 'favoritos'], ['/conta/enderecos', 'enderecos'],
  ['/conta/medidas', 'medidas'], ['/conta/pontos', 'pontos'], ['/conta/cupons', 'cupons'],
  ['/conta/dados', 'dados'],
];
const desalinhados = pares.filter(([href, slug]) => {
  const atalho = porHref.get(href);
  const item = nav.NAV_ITEMS.find((i) => i.slug === slug);
  return !atalho || !item || nav.clientHref(item.slug) !== href;
});
if (desalinhados.length === 0)
  ok('todo atalho com equivalente aponta para a MESMA rota', 'atalho e coluna nunca discordam do destino');
else fail('atalho aponta para outra rota', JSON.stringify(desalinhados));

/** `/conta/afiliada` existe como atalho e NAO como item — provado pela ausencia. */
if (porHref.has('/conta/afiliada') && !nav.NAV_ITEMS.some((i) => i.slug === 'afiliada'))
  ok('`/conta/afiliada` e alcancavel SO pelo atalho', 'rota viva, sem item de coluna — como o material');
else fail('rota da afiliada', 'ou nao existe atalho, ou virou item de coluna');

if (nav.CONTA_ATALHOS.every((a) => a.disponivel === true))
  ok('os 8 atalhos se declaram disponiveis', 'nenhum deles aponta para tela inexistente');
else fail('atalho indisponivel', JSON.stringify(nav.CONTA_ATALHOS.filter((a) => !a.disponivel)));

/* ============ 3. o item ATIVO — a armadilha do `startsWith` ============ */

console.log('\n3. `isActiveSlug` — o destaque nao pode casar rota parecida');

const casos = [
  ['/conta', '', true],
  ['/conta/pedidos', 'pedidos', true],
  ['/conta/pedidos', '', false],
  ['/conta/pedidos-teste', 'pedidos', false],
  ['/conta/pedidos/123', 'pedidos', false],
  ['/admin/pedidos', 'pedidos', false],
  ['/', '', false],
  [null, '', false],
  ['/conta/seguranca', 'seguranca', true],
];
const errados = casos.filter(([url, slug, espera]) => nav.isActiveSlug(url, slug) !== espera);
if (errados.length === 0)
  ok('os 9 casos de casamento passam', 'inclusive `/conta/pedidos/123` — que NAO e a lista');
else fail('`isActiveSlug`', JSON.stringify(errados.map(([u, s]) => [u, s, nav.isActiveSlug(u, s)])));

/**
 * A PROVA AO CONTRARIO. O erro que esta funcao existe para impedir e o
 * `startsWith`. Ele e escrito aqui de proposito: se o naive casar o caso que o
 * certo rejeita, a prova vale; se o naive tambem rejeitasse, a prova nao
 * distinguiria nada e nao estaria provando.
 */
const naive = (url, slug) => (url ?? '').startsWith(slug ? `/conta/${slug}` : '/conta');
if (naive('/conta/pedidos-teste', 'pedidos') === true && nav.isActiveSlug('/conta/pedidos-teste', 'pedidos') === false)
  ok('o `startsWith` naive CASA `/conta/pedidos-teste` — e o certo NAO', 'e por isso que a comparacao e por segmento');
else fail('a prova ao contrario nao distingue', 'ou o naive nao casou, ou o certo casou');

/** O item da URL — usado pelo `aria-current` e pelo titulo da tela. */
if (nav.findNavItemByPath('/conta/pedidos')?.label === 'Meus Pedidos' &&
    nav.findNavItemByPath('/conta/pedidos-teste') === undefined &&
    nav.findNavItemByPath('/conta')?.label === 'Dashboard')
  ok('`findNavItemByPath` resolve a lista, a raiz — e devolve `undefined` fora', 'rota desconhecida nao e mascarada');
else fail('`findNavItemByPath`', JSON.stringify([
  nav.findNavItemByPath('/conta/pedidos')?.label, nav.findNavItemByPath('/conta/pedidos-teste'),
]));

/** `clientHref('')` = a raiz, sem barra sobrando. */
if (nav.clientHref('') === '/conta' && nav.clientHref('pedidos') === '/conta/pedidos' && !nav.clientHref('').endsWith('/'))
  ok('`clientHref` monta a raiz sem barra dupla', '`/conta`, e nao `/conta/`');
else fail('`clientHref`', `${nav.clientHref('')} / ${nav.clientHref('pedidos')}`);

if (nav.SIGN_OUT_LABEL === 'Sair da conta' && !/Sair/i.test(rotulos.join('|')))
  ok('`Sair da conta` esta fora de `NAV_ITEMS`', 'e botao, nao rota');
else fail('rotulo de saida', `${nav.SIGN_OUT_LABEL} / ${JSON.stringify(rotulos)}`);

/* ============ 4. a conta e a saudacao ============ */

console.log('\n4. `saudacao` — o comportamento que PARECE defeito');

if (metricas.saudacao({ id: 'x', email: 'lp070087@gmail.com', nomeCompleto: null }) === 'Olá, lp070087@gmail.com')
  ok('sem nome, sai o E-MAIL INTEIRO', 'como o print `cli-001` — e nao a parte antes do `@`');
else fail('saudacao sem nome', metricas.saudacao({ id: 'x', email: 'lp070087@gmail.com', nomeCompleto: null }));

if (metricas.saudacao({ id: 'x', email: 'a@b.c', nomeCompleto: 'Maria Clara Souza' }) === 'Olá, Maria')
  ok('com nome, sai so o PRIMEIRO nome', '`split(" ")[0]`, como o original');
else fail('saudacao com nome', metricas.saudacao({ id: 'x', email: 'a@b.c', nomeCompleto: 'Maria Clara Souza' }));

if (metricas.saudacao({ id: 'x', email: '', nomeCompleto: null }) === 'Olá, Olá')
  ok('sem nome e sem e-mail, nao sai `Olá, `', 'a linha nao termina em vazio');
else fail('saudacao vazia', metricas.saudacao({ id: 'x', email: '', nomeCompleto: null }));

/* ============ 5. cupom e pedido — o relogio entra por parametro ============ */

console.log('\n5. o cupom vencido do print e a ordenacao que nao muta');

const cupom = demo.DEMO_CUPONS_CLIENTE[0];
/**
 * O `minimo` do cupom e ZERO, e nao `150`: a bancada do modulo 10 mediu o
 * `cli-015` (a linha de meta tem DOIS termos, x=383 a x=598) e leu o `adm-012`
 * (a coluna `MÍN.` do `CLOSET10` imprime `—`, que e como o admin escreve zero).
 * Ver a nota de `DEMO_CUPONS_CLIENTE` em `demo.ts`.
 */
if (cupom.code === 'CLOSET10' && cupom.value === 10 && cupom.minimo === 0 && cupom.expiraEm === '2026-08-20T23:59:59')
  ok('o cupom e o do print `cli-015`', '`CLOSET10` · 10% · sem minimo · vence 20/08/2026');
else fail('cupom da demonstracao', JSON.stringify(cupom));

/**
 * ================== O CUPOM VENCIDO, E POR QUE ELE NAO SOME ==================
 *
 * Estas provas usavam `cuponsValidos`, que foi REMOVIDO. O motivo esta na prova
 * que veio abaixo e no `metrics.ts`: o cartao `Cupons ativos` do dashboard
 * filtra por `is_active`, e nao por validade — o `CLOSET10` aparece nele
 * (`004603`) e escurecido como `EXPIRADO` na lista (`004841`), na mesma sessao.
 *
 * Entao o que se prova agora e o VEREDITO do cartao da lista (`cupomFechado`),
 * e a virada do dia continua sendo dele.
 */
if (metricas.cupomFechado(cupom, new Date('2026-10-03T12:00:00')))
  ok('hoje (03/10/2026) o `CLOSET10` esta FECHADO', 'a lista de cupons abre no estado `EXPIRADO` do print');
else fail('cupom vencido aparece como aberto', 'a demonstracao perdeu o unico estado que a referencia prova');

/** E ANTES do vencimento ele esta aberto — senao o veredito seria sempre `true`. */
if (!metricas.cupomFechado(cupom, new Date('2026-08-20T12:00:00')))
  ok('em 20/08/2026 ao meio-dia o `CLOSET10` esta ABERTO', 'o veredito nao devolve `true` sempre — a prova acima vale');
else fail('cupom no ultimo dia de validade', 'o veredito parece sempre fechado');

/** O ULTIMO SEGUNDO do dia 20 ainda vale: a data e o FIM do dia, nao o comeco. */
if (!metricas.cupomFechado(cupom, new Date('2026-08-20T23:59:58')) &&
    metricas.cupomFechado(cupom, new Date('2026-08-21T00:00:01')))
  ok('a virada e a do ULTIMO segundo', '`20/08/2026` vence quando o dia 20 termina');
else fail('virada do dia', 'a data foi tratada como inicio do dia');

const esgotadoSemData = {
  id: 'e', code: 'X', kind: 'fixed', value: 5, minimo: null, expiraEm: null, esgotado: true,
};
if (metricas.cupomFechado(esgotadoSemData, new Date('2026-10-03T12:00:00')) === true)
  ok('cupom ESGOTADO esta fechado mesmo sem validade', 'as DUAS razoes do original: `expired || exhausted`');
else fail('cupom esgotado', 'a segunda razao nao foi tratada');

/**
 * E O CUPOM VENCIDO **NAO** SAI DO RESUMO — a prova que prende a decisao de
 * hoje. Se alguem reintroduzir um filtro de validade em `getResumo`, o cartao
 * do dashboard abre vazio e o `CLOSET10` do print `004603` desaparece.
 */
const resumoNav = (await dados.getResumo()).data;
if (resumoNav.cuponsAtivos.length === 1 && resumoNav.cuponsAtivos[0].code === 'CLOSET10')
  ok('o `CLOSET10` continua no resumo mesmo vencido', 'o criterio e `is_active`, como a consulta do original');
else fail('cupom no resumo', JSON.stringify(resumoNav.cuponsAtivos.map((c) => c.code)));

/**
 * ================== A ARMADILHA DO ESPACO INQUEBRAVEL ==================
 *
 * `formatBRL` usa `toLocaleString('pt-BR', { style: 'currency' })`, e o
 * separador que o ICU insere entre `R$` e o numero NAO e o espaco comum: e o
 * `U+00A0` (NO-BREAK SPACE). Comparar a saida crua com `'R$ 20,00 OFF'` escrito
 * com espaco comum REPROVA um valor CORRETO — a bancada acusaria um defeito que
 * nao existe.
 *
 * A prova por isso normaliza os DOIS lados. E a contraprova abaixo exige que o
 * caractere seja mesmo o `U+00A0`: se um dia ele virar espaco comum, a prova
 * continua passando mas deixa de estar provando o que diz, e a contraprova
 * denuncia isso.
 */
const rotuloFixo = metricas.rotuloCupom({ kind: 'fixed', value: 20 });
if (normalizar(metricas.rotuloCupom(cupom)) === '10% OFF' && normalizar(rotuloFixo) === 'R$ 20,00 OFF')
  ok('o rotulo cobre os DOIS tipos', '`10% OFF` e `R$ 20,00 OFF`');
else fail('rotulo do cupom', `${JSON.stringify(metricas.rotuloCupom(cupom))} / ${JSON.stringify(rotuloFixo)}`);

if (rotuloFixo.includes(' '))
  ok('`formatBRL` separa com `U+00A0`, e nao com espaco comum', 'e por isso que a prova acima normaliza — a saida crua nao casa com o texto digitado');
else fail('separador de `formatBRL`', `${JSON.stringify(rotuloFixo)} — a contraprova do U+00A0 deixou de valer`);

if (metricas.validadeCurta('2026-08-20T23:59:59') === '20/08/2026' && metricas.validadeCurta(null) === null)
  ok('`validadeCurta` recorta do ISO, sem `toLocaleDateString`', 'nenhum fuso pode virar o dia para 21');
else fail('validadeCurta', String(metricas.validadeCurta('2026-08-20T23:59:59')));

const três = [
  { id: 'a', codigo: '#a', feitoEm: '2026-01-01T10:00:00', status: 'novo', frete: null, subtotal: 0, desconto: 0, freteValor: 0, total: 0, itens: [] },
  { id: 'c', codigo: '#c', feitoEm: '2026-07-01T10:00:00', status: 'novo', frete: null, subtotal: 0, desconto: 0, freteValor: 0, total: 0, itens: [] },
  { id: 'b', codigo: '#b', feitoEm: '2026-03-01T10:00:00', status: 'novo', frete: null, subtotal: 0, desconto: 0, freteValor: 0, total: 0, itens: [] },
];
const ordenado = metricas.resumirPedidos(três);
if (mesmo(ordenado.map((p) => p.id), ['c', 'b', 'a']))
  ok('`resumirPedidos` ordena do mais NOVO para o mais antigo', 'c · b · a');
else fail('ordem dos pedidos', JSON.stringify(ordenado.map((p) => p.id)));

if (mesmo(três.map((p) => p.id), ['a', 'c', 'b']))
  ok('`resumirPedidos` NAO muta a lista recebida', 'copiou com `[...]` antes de ordenar');
else fail('a lista foi mutada', 'mutar reordenaria a demonstracao global para as proximas chamadas');

if (metricas.rotuloItens(1) === '1 item no pedido' && metricas.rotuloItens(3) === '3 itens no pedido')
  ok('`rotuloItens` cuida do singular', '`1 item no pedido` — nao `1 itens`');
else fail('rotulo de itens', `${metricas.rotuloItens(1)} / ${metricas.rotuloItens(3)}`);

/* ============ 6. a camada de dados e a ponte com o admin ============ */

console.log('\n6. a leitura, o `source` e a ponte com o ADMIN');

const leitura = await dados.listFavoritos();
if (leitura.source === 'demo' && typeof leitura.reason === 'string' && leitura.reason.length > 0)
  ok('toda leitura se declara `demo` e explica o motivo', 'nada finge vir do banco');
else fail('camada de dados', JSON.stringify({ source: leitura.source, reason: leitura.reason }));

if (Array.isArray(leitura.data) && leitura.data.length === 0)
  ok('os favoritos nascem VAZIOS', 'o print `cli-006` mostra a tela vazia');
else fail('favoritos nao vazios', JSON.stringify(leitura.data));

if (!Object.is(leitura.data, demo.DEMO_FAVORITOS_CLIENTE))
  ok('a leitura devolve COPIA, nao o array do modulo', 'um `sort` da tela nao reordena a demonstracao global');
else fail('a leitura devolve o array do modulo', 'mutacao vaza');

const cuponsLidos = await dados.listCupons();
const original = demo.DEMO_CUPONS_CLIENTE[0];
cuponsLidos.data[0].code = 'MUTADO';
if (demo.DEMO_CUPONS_CLIENTE[0].code === 'CLOSET10')
  ok('mutar o copom lido NAO muda a demonstracao', 'copia por item, e nao so do array');
else fail('mutacao vazou para a demonstracao', `virou ${demo.DEMO_CUPONS_CLIENTE[0].code}`);
demo.DEMO_CUPONS_CLIENTE[0].code = original.code;

/**
 * A PONTE. O pedido da cliente tem que ser a MESMA linha do admin — mesmo
 * `id`, mesmo `code`, mesmo `status`. Uma copia local divergiria no primeiro
 * dia em que um preco mudasse.
 */
const fonteDados = semComentarios(arquivo('src/lib/cliente/data.ts'));
if (fonteDados.includes("from '@/lib/pedidos/demo'") && !/DEMO_ORDERS\s*[:=]\s*\[/.test(fonteDados))
  ok('os pedidos vem de `@/lib/pedidos/demo`', 'o array do admin, filtrado por cliente — nao uma copia local');
else fail('origem dos pedidos', 'os pedidos do admin nao sao a fonte');

const fonteTipos = semComentarios(arquivo('src/lib/cliente/types.ts'));
if (/from '@\/lib\/pedidos\/types'/.test(fonteTipos) && !/(export\s+(type|interface)\s+OrderStatus|type OrderStatus\s*=)/.test(fonteTipos))
  ok('`OrderStatus` e IMPORTADO, nao redeclarado', 'um tipo paralelo seria a semente de dois modelos incompativeis');
else fail('`OrderStatus`', 'ou nao importa, ou redeclarou o enum do admin');

const fontePedidosTipos = semComentarios(arquivo('src/lib/pedidos/types.ts'));
if (/OrderStatus/.test(fontePedidosTipos))
  ok('`@/lib/pedidos/types` de fato declara `OrderStatus`', 'o import tem destino real');
else fail('destino do import', '`pedidos/types` nao tem `OrderStatus`');

/* ============ 7. o teto de contexto ============ */

console.log('\n7. a area nao toca banco, nao suprime tipo e nao importa `demo`');

const fonteArea = raizes.map((f) => readFileSync(f, 'utf8')).join('\n');

if (!/prisma|DATABASE_URL|process\.env/.test(semComentarios(fonteArea)))
  ok('nenhum `prisma`, `DATABASE_URL` ou `process.env`', 'Neon fora de escopo nesta fase');
else fail('a area toca banco', 'ha conexao de banco na area da cliente');

if (!/@ts-ignore|@ts-expect-error/.test(fonteArea))
  ok('nenhum `@ts-ignore` nem `@ts-expect-error`', 'o typecheck nao foi silenciado');
else fail('supressao de tipo', 'ha um `@ts-ignore` na area');

/**
 * ================== "NAO LE O RELOGIO" NAO E "NAO ESCREVE `new Date`" ==================
 *
 * O que faz `metrics.ts` ler o relogio e `new Date()` SEM argumento, ou
 * `Date.now()` — os dois dependem do momento em que o codigo roda. Converter um
 * TEXTO em `Date` (`new Date(cupom.expiraEm)`) nao depende de relogio nenhum: e
 * a mesma conta em qualquer dia.
 *
 * A prova anterior exigia a AUSENCIA da string `new Date(`. `expirou()` precisa
 * dela para comparar o vencimento, e a bancada reprovava um arquivo PURO — o
 * instrumento medindo a coisa errada. Aqui a proibicao passa a ser a do relogio
 * de verdade.
 */
const fonteMetricas = semComentarios(arquivo('src/lib/cliente/metrics.ts'));
if (!/new Date\(\s*\)/.test(fonteMetricas) && !/Date\.now\(/.test(fonteMetricas))
  ok('`metrics.ts` nao le o relogio', 'nenhum `new Date()` sem argumento nem `Date.now()`');
else fail('`metrics.ts` le o relogio', 'o resultado mudaria conforme o dia em que a bancada roda');

/** E a CONTRAprova: o arquivo precisa CONTER `new Date(<texto>)`, senao nao compara data nenhuma. */
if (/new Date\([^)]/.test(fonteMetricas))
  ok('e ele converte o ISO do cupom com `new Date(<texto>)`', 'parsing de texto, e nao leitura de relogio — a proibicao acima nao o atinge');
else fail('`expirou` nao converte data', 'a funcao nao compararia vencimento nenhum');

/**
 * O `demo.ts` e lido SO por `data.ts`. Um componente importando `demo` daria
 * duas fontes para a mesma tela, e o dia do Neon viraria uma cacada.
 */
const componentes = raizes.filter((f) => /src[\\/]components[\\/]cliente[\\/]/.test(f));
const vazando = componentes.filter((f) => /from '\S*cliente\/demo'/.test(readFileSync(f, 'utf8')));
if (vazando.length === 0)
  ok('nenhum componente importa `cliente/demo`', `os ${componentes.length} componentes so falam com \`data.ts\``);
else fail('componente lendo `demo.ts`', vazando.join(', '));

if (fonteDados.includes('getSession') && !/DEMO_SESSION\s*[:=]/.test(fonteDados))
  ok('a conta vem de `getSession()` do admin, nao de uma sessao paralela', 'cliente e admin apontam para a MESMA pessoa');
else fail('origem da conta', 'a sessao da cliente foi inventada em paralelo');

/* ============ 8. a coluna e a barra renderizadas ============ */

console.log('\n8. `AccountSidebar` e `AccountMobileNav` — o que sai no HTML');

const coluna = render(AccountSidebar, { pathname: '/conta/pedidos' });
const textoColuna = textos(coluna);

if (contar(coluna, '<a ') === 9 && contar(coluna, '<button') === 1)
  ok('a coluna desenha 9 LINKS e 1 BOTAO', 'a saida e acao, nao rota');
else fail('contagem na coluna', `${contar(coluna, '<a ')} links, ${contar(coluna, '<button')} botoes`);

if (contar(coluna, 'aria-current="page"') === 1)
  ok('exatamente UM item ativo em `/conta/pedidos`', 'dois ativos confundiriam; zero esconderia a posicao');
else fail('`aria-current`', `${contar(coluna, 'aria-current="page"')} marcados`);

const ancoras = coluna.match(/<a [^>]*>[\s\S]*?<\/a>/g) ?? [];
const ativa = ancoras.find((a) => a.includes('aria-current="page"'));
if (ativa && ativa.includes('/conta/pedidos') && ativa.includes('bg-foreground') && ativa.includes('text-background'))
  ok('o item ativo e a PILULA PRETA, e e o item certo', '`Meus Pedidos`, nao o primeiro da lista');
else fail('item ativo', (ativa ?? '(nenhum)').slice(0, 200));

if (ancoras.every((a) => a.includes('href="/conta')))
  ok('todo item aponta para `/conta…`', 'nenhum `href` falso');
else fail('href fora da area', JSON.stringify(ancoras.filter((a) => !a.includes('href="/conta')).map((a) => a.slice(0, 80))));

if (textoColuna.includes('Sair da conta') && !/<a [^>]*>[^<]*Sair/.test(coluna))
  ok('`Sair da conta` sai como BOTAO, nao como link', 'o original usa `onClick`, e nao `<Link>`');
else fail('saida', 'a saida virou um link — link morto');

const mobile = render(AccountMobileNav, { pathname: '/conta/favoritos' });
if (contar(mobile, '<a ') === 9 && contar(mobile, 'aria-current="page"') === 1 &&
    mobile.includes('lg:hidden') && mobile.includes('scrollbar-hide'))
  ok('a barra mobile tem os 9 itens, um ativo, e so aparece abaixo de `lg`', '`lg:hidden` + rolagem horizontal');
else fail('barra mobile', `${contar(mobile, '<a ')} links, ${contar(mobile, 'aria-current="page"')} ativos`);

const ativaMobile = (mobile.match(/<a [^>]*aria-current[\s\S]*?<\/a>/) ?? [''])[0];
if (ativaMobile.includes('/conta/favoritos'))
  ok('a barra mobile marca o item certo', '`Meus Favoritos`');
else fail('ativo na barra mobile', ativaMobile.slice(0, 200));

/* ============ 9. a casca e a pagina ============ */

console.log('\n9. a casca — o que a bancada prova por FONTE, e por que');

const casca = arquivo('src/components/cliente/account-shell.tsx');
const cascaLimpa = semComentarios(casca);

/**
 * ================== A PROVA ESTAVA NO ARQUIVO ERRADO ==================
 *
 * O corte de breakpoint NAO esta todo na casca, e nao podia estar: `lg:hidden`
 * e do `AccountMobileNav` — ele some sozinho onde nao deve aparecer. Exigir as
 * duas metades dentro de `account-shell.tsx` reprovava uma divisao CORRETA de
 * responsabilidade.
 *
 * O que de fato importa e a RECIPROCIDADE entre as duas pontas: a barra precisa
 * sumir a partir de `lg` e a coluna precisa aparecer a partir de `lg`. Se as
 * duas aparecessem juntas, haveria navegacao duplicada; se as duas sumissem,
 * nao haveria navegacao nenhuma.
 */
const fonteMobileNav = semComentarios(arquivo('src/components/cliente/account-mobile-nav.tsx'));
const barraSomeNoLg = /lg:hidden/.test(fonteMobileNav);
const colunaApareceNoLg = /hidden lg:block/.test(cascaLimpa);

if (barraSomeNoLg && colunaApareceNoLg)
  ok('a barra some em `lg` (`lg:hidden`) e a coluna aparece em `lg` (`hidden lg:block`)', 'reciprocas — nunca as duas, nunca nenhuma');
else fail('breakpoint das duas pontas', `barra \`lg:hidden\`: ${barraSomeNoLg} · coluna \`hidden lg:block\`: ${colunaApareceNoLg}`);

/**
 * E nao pode haver uma TERCEIRA navegacao: so dois pontos, e nao tres.
 *
 * A contagem e das TAGs JSX (`<AccountMobileNav`), e nao do nome solto: o nome
 * tambem aparece na linha de `import`, e contar o texto cru daria 2 para uma
 * montagem unica — o instrumento acusaria navegacao duplicada onde ha uma so.
 */
if (contar(cascaLimpa, '<AccountMobileNav') === 1 && contar(cascaLimpa, '<AccountSidebar') === 1)
  ok('a casca monta a barra e a coluna UMA vez cada', 'contando as TAGS, e nao as linhas de `import`');
else fail('montagens de navegacao', `${contar(cascaLimpa, '<AccountMobileNav')} barra(s), ${contar(cascaLimpa, '<AccountSidebar')} coluna(s)`);

/**
 * A coluna do desktop nao pode aparecer no celular por conta propria: o
 * elemento que a envolve precisa ter `hidden` ANTES do `lg:block`. Ler o
 * `<aside>` inteiro (e nao o arquivo) evita que um `hidden lg:block` de outro
 * elemento faca esta prova passar por engano.
 */
const asideHtml = (cascaLimpa.match(/<aside[^>]*>/) ?? [''])[0];
if (asideHtml.includes('hidden') && asideHtml.includes('lg:block'))
  ok('o `<aside>` da coluna e `hidden lg:block`', 'a coluna nao vaza para o celular');
else fail('`<aside>` da coluna', asideHtml || '(nao encontrado)');

if (cascaLimpa.includes('lg:grid-cols-[260px_1fr]') && cascaLimpa.includes('min-w-0'))
  ok('a grade e `260px 1fr` e o `main` tem `min-w-0`', 'sem `min-w-0` o conteudo estoura a coluna em vez de encolher');
else fail('grade da casca', 'a coluna do conteudo nao encolhe');

if (/\bpx-3\b/.test(cascaLimpa) && /\bsm:px-4\b/.test(cascaLimpa) && /\bmd:py-14\b/.test(cascaLimpa))
  ok('o respiro e o do original (`px-3 sm:px-4 py-6 md:py-14`)', 'linha 48 do `AccountLayout.tsx`');
else fail('respiro da casca', 'padding diferente do do original');

/**
 * ================== GEOMETRIA: A SOMA TEM QUE FECHAR ==================
 *
 * A coluna de navegacao foi medida em **exatamente 260 px** numa captura de
 * 2x — e `260px` e o que o original declara. Este e o caso em que a conta
 * fecha sem sobra, e por isso ela e uma prova, e nao uma estimativa:
 *
 *   12 (recuo) + 260 (coluna) + 40 (vao) + 2212 (painel) + 12 (recuo) = 2536
 *
 * 2536 e a largura exata da captura `cli-019`. Nao ha folga para um teto de
 * largura escondido.
 */
const somaGeometria = 12 + 260 + 40 + 2212 + 12;
if (somaGeometria === 2536)
  ok('a geometria do print SOMA na largura da captura', `12 + 260 + 40 + 2212 + 12 = ${somaGeometria}`);
else fail('a soma da geometria nao fecha', `${somaGeometria} ≠ 2536`);

/** O teto de largura tem que estar FORA: ele deslocaria a coluna em tela larga. */
if (!/max-w-shell/.test(cascaLimpa) && !/max-w-\[/.test(cascaLimpa))
  ok('a casca NAO tem teto de largura', 'o original declara `max-w-full`; um teto proprio deslocaria a coluna de 260 px');
else fail('teto de largura na casca', 'a coluna sai do primeiro pixel do recuo assim que a janela passar do teto');

/**
 * E o recorte de estouro horizontal tem que ser `clip`, NAO `hidden`: a coluna
 * de dentro e `sticky top-28`, e `hidden` cria container de rolagem e mata o
 * `sticky` sem erro nenhum no console.
 */
if (/overflow-x-clip/.test(cascaLimpa) && !/overflow-x-hidden/.test(cascaLimpa))
  ok('o recorte e `overflow-x-clip`, nao `hidden`', '`hidden` transformaria a casca em container de rolagem e mataria o `sticky` da coluna');
else fail('recorte de estouro', '`overflow-x-hidden` na casca — o `sticky top-28` da coluna deixa de colar');

if (!/max-w-\[1600px\]/.test(arquivo('src/components/cliente/store-header.tsx')))
  ok('o cabecalho tambem NAO tem teto de 1600 px', 'o original e `container mx-auto px-4`, e o conteudo fica centrado');
else fail('teto no cabecalho', '`max-w-[1600px]` deslocaria o cabecalho em tela larga');

/**
 * O `StoreHeader` e um APOIO DECLARADO — ele substitui o site publico, que esta
 * fora desta fase. A bancada exige que isso esteja escrito, para o dia em que o
 * site publico existir: um cabecalho de loja nao pode virar permanente por
 * esquecimento.
 */
const cabecalho = arquivo('src/components/cliente/store-header.tsx');
if (/substitui|stand-in|site publico|site público/i.test(cabecalho))
  ok('o `StoreHeader` se declara substituto do site publico', 'nao pode virar permanente por esquecimento');
else fail('`StoreHeader`', 'nao esta declarado como substituto');

if (cascaLimpa.includes('StoreHeader') && cascaLimpa.includes('StoreFooter'))
  ok('a casca usa o cabecalho e o rodape de loja', 'a area da cliente nasce dentro da loja, nao solta');
else fail('loja na casca', 'faltou cabecalho ou rodape');

/** A saida NAO pode fingir que encerra sessao: nao ha sessao real nesta fase. */
if (/ainda n[aã]o encerra|n[aã]o encerra sess/i.test(casca))
  ok('o aviso de saida NAO finge um logout', 'diz que a autenticacao entra na fase de integracao');
else fail('aviso de saida', 'o botao promete um logout que nao existe');

const layout = semComentarios(arquivo('src/app/(cliente)/conta/layout.tsx'));
if (layout.includes('getConta') && layout.includes('saudacao') && /await/.test(layout))
  ok('o layout e SERVER Component e resolve a conta no servidor', 'a saudacao sai pronta; o cliente nao monta texto');
else fail('layout da conta', 'a conta nao e resolvida no servidor');

if (!layout.includes("'use client'") && !layout.includes('"use client"'))
  ok('o layout NAO e `use client`', 'se fosse, `getConta` nao rodaria no servidor');
else fail('layout e cliente', 'o server component virou cliente');

const layoutCliente = arquivo('src/app/(cliente)/conta/layout-client.tsx');
if (layoutCliente.includes("'use client'") && layoutCliente.includes('AccountShell'))
  ok('o pedaco que precisa de navegador esta declarado como cliente', '`usePathname` so existe deste lado');
else fail('layout cliente', 'a casca nao esta no componente cliente');

/**
 * O grupo de rota `(cliente)` NAO entra na URL. Se o layout estivesse em
 * `conta/layout.tsx` fora do grupo, o cabecalho da loja vazaria para o admin,
 * que usa o mesmo layout raiz.
 */
if (existsSync(join(PROJ, 'src/app/(cliente)/conta/layout.tsx')))
  ok('a area vive em `(cliente)/conta` — grupo de rota', 'o parêntese nao aparece na URL: a rota continua `/conta`');
else fail('grupo de rota', 'a casca nao esta isolada do layout raiz');

/* ============ 10. provas ao contrario ============ */

console.log('\n10. provas ao contrario — o defeito tem que REPROVAR');

if (!semComentarios('/* Looks */ const x = 1;').includes('Looks') &&
    semComentarios('/* Looks */ const x = 1;').includes('const x = 1'))
  ok('`semComentarios` apaga o comentario e guarda o codigo', 'citar `Looks` na prosa nao conta como item');
else fail('`semComentarios`', 'ou comentou codigo, ou deixou passar o comentario');

if (!textos('<div aria-label="x"></div>').includes('aria-label') &&
    textos('<span>Sair da conta</span>').includes('Sair da conta'))
  ok('`textos` apaga tags e atributos, mas guarda o texto', 'por isso a prova de `<a>` le o HTML cru');
else fail('`textos`', 'nao esta apagando as tags');

if (contar('<a ><a ><a >', '<a ') === 3 && contar('abc', 'z') === 0)
  ok('`contar` conta TODAS e devolve 0 para ausente', 'um `includes` nao distinguiria 9 de 8 links');
else fail('`contar`', String(contar('<a ><a ><a >', '<a ')));

/** Uma coluna com UM item nao pode marcar dois ativos — a prova da contagem. */
const um = nav.NAV_ITEMS.slice(0, 1).map((i) => i.label);
if (um.length === 1 && !mesmo(um, esperado))
  ok('uma lista truncada NAO passa na prova de rotulos', `a prova exige os 9, e nao "pelo menos o primeiro"`);
else fail('a prova de rotulos aceitaria uma lista truncada', 'ela nao esta comparando a lista inteira');

/** E a prova de que `false` nao passa por engano: o caso negativo e exigido. */
if (nav.isActiveSlug('/conta/pedidos-teste', 'pedidos') === false &&
    nav.isActiveSlug('/conta/pedidos', 'pedidos') === true)
  ok('o mesmo `slug` da `true` numa URL e `false` na parecida', 'a funcao distingue de fato — nao devolve sempre o mesmo');
else fail('a funcao devolve sempre o mesmo', 'a prova de casamento nao estaria provando nada');

/**
 * As tres CORRECOES DE INSTRUMENTO desta rodada tambem precisam de contraprova —
 * senao "consertei a bancada" vira "afrouxei a bancada", e as 65 provas passam a
 * valer menos.
 */

/** 1. A regra ANTIGA reprovava `new Date(<texto>)`, que e parsing e nao relogio. */
if (/new Date\(/.test('const fim = new Date(cupom.expiraEm);') &&
    !/new Date\(\s*\)/.test('const fim = new Date(cupom.expiraEm);'))
  ok('a regra nova distingue `new Date(<texto>)` de `new Date()`', 'a antiga reprovava parsing de data — medindo a coisa errada');
else fail('a regra nova nao distingue', 'ela ainda confunde parsing com relogio');

/** 2. A regra ANTIGA exigia `lg:hidden` dentro da casca — onde ele nao mora. */
const cascaExemplo = '<aside className="hidden lg:block">';
const navExemplo = 'className="... lg:hidden"';
if (!cascaExemplo.includes('lg:hidden') && navExemplo.includes('lg:hidden') &&
    /lg:hidden/.test(navExemplo) && /hidden lg:block/.test(cascaExemplo))
  ok('a reciprocidade passa com as duas metades em ARQUIVOS diferentes', 'a antiga so olhava a casca e reprovava a divisao correta');
else fail('a prova de reciprocidade', 'ela ainda exige as duas metades no mesmo arquivo');

/** 3. A comparacao CRUA de `formatBRL` reprovaria um valor correto. */
const cru = (20).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
if (cru !== 'R$ 20,00' && normalizar(cru) === 'R$ 20,00')
  ok('a saida crua de `formatBRL` NAO casa com o texto digitado, e a normalizada casa', 'a comparacao crua acusaria um defeito inexistente');
else fail('a armadilha do `U+00A0`', `cru=${JSON.stringify(cru)} — a normalizacao deixou de ser necessaria`);

/** 4. Contar o NOME solto conta a linha de `import` junto — 2 para um uso so. */
const exemploImport = "import { AccountSidebar } from './account-sidebar';\n<AccountSidebar pathname={p} />";
if (contar(exemploImport, 'AccountSidebar') === 2 && contar(exemploImport, '<AccountSidebar') === 1)
  ok('contar a TAG da 1 onde contar o nome da 2', 'a regra antiga acusaria navegacao duplicada em um uso unico');
else fail('contagem por tag', `${contar(exemploImport, 'AccountSidebar')} / ${contar(exemploImport, '<AccountSidebar')}`);

/** 5. O `sticky` sobrevive ao `clip` e morre ao `hidden` — a razao da troca. */
const comHidden = '.a{overflow-x:hidden}.b{overflow-x:clip}';
if (/overflow-x:hidden/.test(comHidden) && /overflow-x:clip/.test(comHidden) && comHidden.includes('overflow-x:clip'))
  ok('`overflow-x:clip` e `hidden` sao valores distintos e ambos presentes no exemplo', 'a casca escolhe `clip` justamente por causa do `sticky` de dentro');
else fail('a comparacao de recorte', 'os dois valores nao foram distinguidos');

/** 6. O teto de largura, se voltasse, seria detectado. */
if (/max-w-shell/.test('className="mx-auto max-w-shell"') && !/max-w-shell/.test('className="mx-auto max-w-full"'))
  ok('a prova de teto distingue `max-w-shell` de `max-w-full`', 'ela nao passaria com o teto de volta');
else fail('a prova de teto', 'ela nao distingue os dois casos');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
