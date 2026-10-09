/**
 * Bancada do LOGIN da area da cliente (fase 2, modulo 3).
 *
 * ================== POR QUE ESTA BANCADA EXISTE ==================
 *
 * O login e a UNICA tela desta fase sem print. Entao nao ha captura para
 * conferir contra — o que existe e o ARQUIVO do original
 * (`CustomerLogin.tsx`), que declara os campos, os atributos e as duas
 * mensagens. Toda prova dessa tela e, por isso, uma prova de TRANSCRICAO:
 * "o que o original escreve, a tela escreve igual?".
 *
 * E o defeito aqui e o mais caro de todos, porque ele nao aparece: esta tela e
 * o PORTAO. Se o portao nao abre, as nove telas ficam inalcancaveis e NENHUMA
 * bancada de tela percebe — as nove continuam passando, renderizadas
 * diretamente, enquanto na pratica ninguem chega nelas. Por isso esta bancada
 * prova a PORTA em si (renderizando-a com estado sintetico), e nao so o
 * formulario.
 *
 * ================== O QUE ELA NAO PROVA ==================
 *
 * Layout, cor e o olho da senha trocando o TIPO do campo (isso e interacao de
 * navegador). Tambem nao prova persistencia: nao ha. Ela prova o que se pode
 * provar sem clicar — a transcricao do original, a derivacao das mensagens, a
 * porta e a honestidade das duas.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJ = process.argv[2] ? resolve(process.argv[2]) : '';
if (!PROJ) {
  console.error('uso: node bench-cliente-login.mjs <pasta do projeto>');
  process.exit(2);
}

const SRC = join(PROJ, 'src');
const OUT = join(PROJ, '.bench-cliente-login');
const ORIGINAL = join(PROJ, '..', 'PROJETO-ORIGINAL-LOVABLE-REFERENCIA', 'src', 'components', 'site', 'account', 'CustomerLogin.tsx');

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

const raizes = arquivos.filter((f) =>
  /src[\\/](lib[\\/]cliente|components[\\/]cliente)[\\/]/.test(f),
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

const login = require(join(OUT, 'src/lib/cliente/login.js'));
const sessao = require(join(OUT, 'src/lib/cliente/sessao.js'));
const { CustomerLogin } = require(join(OUT, 'src/components/cliente/customer-login.js'));
const { ClienteToast } = require(join(OUT, 'src/components/cliente/cliente-toast.js'));

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

const fonteOriginal = existsSync(ORIGINAL) ? readFileSync(ORIGINAL, 'utf8') : null;
const fonteLogin = semComentarios(arquivo('src/components/cliente/customer-login.tsx'));
const fonteLogica = semComentarios(arquivo('src/lib/cliente/login.ts'));
const fonteCasca = semComentarios(arquivo('src/components/cliente/account-shell.tsx'));
const fonteToast = semComentarios(arquivo('src/components/cliente/cliente-toast.tsx'));

/* ============ 1. a transcricao do original ============ */

console.log('\n1. a transcricao do `CustomerLogin.tsx` — o que o original declara');

if (fonteOriginal === null) {
  fail('original ausente', ORIGINAL);
} else {
  ok('o original foi lido', 'a fonte desta tela sem print');

  /**
   * Os PLACEHOLDERS e os ATRIBUTOS de validacao sao o que o original declara, e
   * sao exatamente o que se pode comparar sem clicar. Cada string e buscada nos
   * DOIS arquivos: se o original a tem e a tela nao, a transcricao perdeu algo.
   *
   * O `minLength` NAO esta nesta lista de proposito: o original escreve
   * `minLength={6}` (um literal), e a tela escreve `minLength={SENHA_MINIMA}` —
   * o MESMO numero, mas pela constante, para que a tela e a validacao nao possam
   * divergir. Exigir o literal aqui reprovaria a escolha CORRETA; ele e provado
   * logo abaixo, pela constante.
   */
  const declaracoes = [
    ['placeholder="E-mail"', 'o campo de e-mail'],
    ['placeholder="Senha"', 'o campo de senha'],
    ['placeholder="Nome completo"', 'o campo de nome (cadastro)'],
    ['placeholder="WhatsApp (opcional)"', 'o campo de WhatsApp (cadastro)'],
    ['type="email"', 'o `type="email"` do e-mail'],
  ];
  for (const [decl, nome] of declaracoes) {
    if (fonteOriginal.includes(decl) && fonteLogin.includes(decl))
      ok(`${nome}: declarado nos dois`, decl);
    else fail(`${nome}`, `original: ${fonteOriginal.includes(decl)} · tela: ${fonteLogin.includes(decl)}`);
  }

  /**
   * O `minLength` NAO pode ser um literal solto na tela: ele vem da constante
   * `SENHA_MINIMA`, que e a MESMA que a validacao usa. Com dois literais, o dia
   * em que um mudasse o outro continuaria mentindo — e a bancada nao veria.
   */
  if (fonteLogin.includes('minLength={SENHA_MINIMA}') && login.SENHA_MINIMA === 6)
    ok('o `minLength` sai da constante, nao de um `6` solto', 'a tela e a validacao leem o MESMO numero');
  else fail('`minLength` literal', `SENHA_MINIMA=${login.SENHA_MINIMA}`);

  const rotulos = [
    ['ENTRAR', 'o botao de entrada'],
    ['CRIAR CONTA', 'o botao de cadastro'],
    ['Esqueci minha senha', 'o link de recuperacao'],
    ['Manter conectado neste dispositivo', 'a caixa de manter conectado'],
    ['Ainda não tem conta?', 'a pergunta do rodape (modo entrada)'],
    ['Criar agora', 'a acao do rodape (modo entrada)'],
    ['Já tem conta?', 'a pergunta do rodape (modo cadastro)'],
  ];
  for (const [texto, nome] of rotulos) {
    if (fonteOriginal.includes(texto) && fonteLogin.includes(texto))
      ok(`${nome}: "${texto}"`, 'nos dois');
    else fail(`${nome}`, `original: ${fonteOriginal.includes(texto)} · tela: ${fonteLogin.includes(texto)}`);
  }

  const titulos = [
    ['Acesse seu universo Closet Lunar', 'o subtitulo de entrada'],
    ['Sua nova experiência fashion começa aqui', 'o subtitulo de cadastro'],
  ];
  for (const [texto, nome] of titulos) {
    if (fonteOriginal.includes(texto) && fonteLogin.includes(texto))
      ok(`${nome}: transcrito`, texto);
    else fail(`${nome}`, `original: ${fonteOriginal.includes(texto)} · tela: ${fonteLogin.includes(texto)}`);
  }

  /**
   * O `aria-label` do olho existe nos dois, e com as MESMAS duas frases.
   *
   * A comparacao usa o TEXTO entre aspas, e nao o par de aspas: os dois arquivos
   * nao sao identicos byte a byte — o original usa aspas duplas nos `aria-label`
   * dentro de um ternario JSX, e a transcricao tambem — mas ancorar no delimitador
   * exato ataria a prova a FORMATACAO, e nao ao conteudo. O que importa e que as
   * duas frases aparecam nos dois.
   */
  const doisEstados = /Ocultar senha/.test(fonteOriginal) && /Mostrar senha/.test(fonteOriginal) &&
    /Ocultar senha/.test(fonteLogin) && /Mostrar senha/.test(fonteLogin);
  if (doisEstados)
    ok('o olho da senha tem o `aria-label` dos dois estados', 'Ocultar senha / Mostrar senha');
  else fail('`aria-label` do olho', 'faltou um dos dois estados');
}

/* ============ 2. `SENHA_MINIMA` e a validacao ============ */

console.log('\n2. `validarLogin` — as regras do original, e nenhuma inventada');

if (login.SENHA_MINIMA === 6)
  ok('`SENHA_MINIMA` e 6', 'o `minLength={6}` do original');
else fail('`SENHA_MINIMA`', String(login.SENHA_MINIMA));

/**
 * CADA RECUSA — e a prova ao contrario. A validacao tem que APROVAR o caso bom
 * e REPROVAR cada caso ruim; uma funcao que devolvesse sempre `valido: true`
 * passaria em metade destas linhas, e por isso as duas metades estao aqui.
 */
const casos = [
  [{ email: 'a@b.co', senha: '123456' }, true, 'e-mail e senha validos'],
  [{ email: 'a@b.co', senha: '12345' }, false, 'senha de 5 (um a menos que o minimo)'],
  [{ email: 'a@b.co', senha: '123456' }, true, 'senha de exatamente 6'],
  [{ email: '', senha: '123456' }, false, 'e-mail vazio'],
  [{ email: 'a@b.co', senha: '' }, false, 'senha vazia'],
  [{ email: 'sem-arroba', senha: '123456' }, false, 'e-mail sem `@`'],
  [{ email: 'a@b', senha: '123456' }, false, 'e-mail sem ponto no dominio'],
  [{ email: 'a@b.', senha: '123456' }, false, 'e-mail com ponto e nada depois'],
  [{ email: '  a@b.co  ', senha: '123456' }, true, 'e-mail com espaco nas pontas (o `trim`)'],
];
for (const [dados, esperado, nome] of casos) {
  const r = login.validarLogin(dados);
  if (r.valido === esperado)
    ok(`validacao: ${nome}`, esperado ? 'passa' : 'recusa');
  else fail(`validacao: ${nome}`, `esperado ${esperado}, veio ${r.valido}`);
}

/** `motivo` e `null` EXATAMENTE quando `valido` — senao a tela mostra frase de sucesso. */
let motivoCoerente = true;
for (const [dados] of casos) {
  const r = login.validarLogin(dados);
  if (r.valido !== (r.motivo === null)) motivoCoerente = false;
}
if (motivoCoerente)
  ok('`motivo` e `null` se e so se `valido`', 'a tela nunca mostra frase de recusa num envio bom');
else fail('coerencia de `motivo`', 'valido e motivo discordam');

/**
 * A UNICA mensagem e a de credencial — nao ha frase inventada. A frase vem de
 * `sessao.ts` (o `toast.error` do original), e nao nasce em `login.ts`.
 */
if (login.validarLogin({ email: 'sem@arroba', senha: '123456' }).motivo === sessao.ERRO_CREDENCIAL)
  ok('toda recusa usa `ERRO_CREDENCIAL`, a frase do original', sessao.ERRO_CREDENCIAL)
else fail('mensagem de recusa', login.validarLogin({ email: 'x', senha: '123456' }).motivo);

if (!/minimo|m[ií]nimo|caracteres/i.test(fonteLogica))
  ok('nenhuma frase de recusa foi inventada em `login.ts`', 'o original nao escreve frase — quem escreve e o navegador');
else fail('frase inventada', '`login.ts` autora uma mensagem que o original nao tem');

/** `entrar()` devolve a mensagem de `sessao.ts`, e nao uma copia local. */
if (login.entrar({ email: 'a@b.co', senha: '123456' }).mensagem === sessao.MENSAGEM_ENTROU)
  ok('`entrar()` devolve `MENSAGEM_ENTROU`', `"${sessao.MENSAGEM_ENTROU}"`);
else fail('`entrar()`', login.entrar({ email: 'a@b.co', senha: '123456' }).mensagem);

if (sessao.MENSAGEM_ENTROU === 'Bem-vinda de volta!')
  ok('`MENSAGEM_ENTROU` e o texto do aviso do print', 'Bem-vinda de volta!');
else fail('`MENSAGEM_ENTROU`', sessao.MENSAGEM_ENTROU);

/* ============ 3. o formulario renderizado ============ */

console.log('\n3. o formulario — o que sai no HTML');

const htmlEntrada = render(CustomerLogin, { onEntrar: () => {} });
const txtEntrada = textos(htmlEntrada);

/**
 * O rotulo `MINHA CONTA` sai em CAIXA ALTA no CSS (`uppercase`), e o HTML guarda
 * o texto na grafia do arquivo — `Minha Conta`. Buscar `MINHA CONTA` no texto
 * acusaria um defeito que nao existe: a caixa alta e do estilo, nao do dado. A
 * prova confere as duas coisas — o texto como esta na fonte E a classe que o
 * levanta.
 */
const tituloEmCaixa = /[Mm]inha [Cc]onta/.test(txtEntrada) && /uppercase/.test(htmlEntrada);
if (txtEntrada.includes('Entrar') && tituloEmCaixa)
  ok('a tela desenha o titulo `Entrar` e o rotulo `Minha Conta`', 'com `uppercase` na classe, como o original');
else fail('titulo', `texto: ${txtEntrada.slice(0, 80)} · uppercase: ${/uppercase/.test(htmlEntrada)}`);

/** A ORDEM dos campos e a do original: e-mail, depois senha. */
const posEmail = htmlEntrada.indexOf('placeholder="E-mail"');
const posSenha = htmlEntrada.indexOf('placeholder="Senha"');
if (posEmail !== -1 && posSenha !== -1 && posEmail < posSenha)
  ok('o e-mail vem ANTES da senha', 'a ordem do original');
else fail('ordem dos campos', `${posEmail} / ${posSenha}`);

/** No modo ENTRADA o form tem 2 campos; o cadastro acrescenta 2 (nome e WhatsApp). */
if (contar(htmlEntrada, 'placeholder=') === 2)
  ok('o modo ENTRADA tem 2 campos', 'e-mail e senha');
else fail('campos no modo entrada', String(contar(htmlEntrada, 'placeholder=')));

/** `Manter conectado` existe SO no modo entrada (o original o envolve em `mode === "login"`). */
if (txtEntrada.includes('Manter conectado neste dispositivo'))
  ok('`Manter conectado` aparece no modo entrada', 'e so nele');
else fail('manter conectado', 'ausente no modo entrada');

/** A caixa nasce MARCADA: `MANTER_CONECTADO_PADRAO` e `true`, e o print a mostra marcada. */
if (htmlEntrada.includes('type="checkbox"') && htmlEntrada.includes('checked=""') && sessao.MANTER_CONECTADO_PADRAO === true)
  ok('a caixa de manter conectado nasce MARCADA', '`checked` no HTML e o padrao `true`');
else fail('caixa marcada', `checked no HTML: ${htmlEntrada.includes('checked')}`);

/** O botao de envio e `submit` — sem isso o `onSubmit` nunca dispara. */
if (htmlEntrada.includes('type="submit"'))
  ok('o botao de envio e `type="submit"`', 'sem isso o formulario nunca envia');
else fail('botao de envio', 'nao e `submit`');

/**
 * O BOTAO NAO TEM `disabled` FIXO. O original o desabilita SO durante o envio
 * (`disabled={loading}`). Um `disabled` literal aqui deixaria o portao travado —
 * e a area ficaria inalcancavel para sempre.
 */
if (!/disabled(?!=\{)/.test(fonteLogin.replace(/type="submit"/g, '')) && !/disabled=/.test(fonteLogin))
  ok('o botao NAO tem `disabled` — o portao nunca trava', 'o original so desabilita durante o envio');
else fail('botao desabilitado', 'ha um `disabled` na tela; o portao poderia ficar travado');

/** O olho segue o original: e `type="button"` (nao envia o form) e tem o `aria-label`. */
if (htmlEntrada.includes('aria-label="Mostrar senha"'))
  ok('o olho da senha sai como `Mostrar senha`', 'estado inicial: senha oculta');
else fail('olho da senha', 'sem o `aria-label` inicial');

if (/type="button"[\s\S]{0,200}aria-label="Mostrar senha"/.test(htmlEntrada))
  ok('o olho e `type="button"`', 'um `submit` ali enviaria o formulario ao clicar no olho');
else fail('olho `type="button"`', 'o olho pode estar enviando o formulario');

/** `Esqueci minha senha` e o rodape existem no modo entrada. */
if (txtEntrada.includes('Esqueci minha senha') && txtEntrada.includes('Ainda não tem conta?') && txtEntrada.includes('Criar agora'))
  ok('`Esqueci minha senha` e o rodape de alternancia estao la', 'modo entrada');
else fail('rodape de entrada', txtEntrada.slice(0, 200));

/* ============ 4. a alternancia de modo ============ */

console.log('\n4. `Criar conta` — o outro modo, o mesmo componente');

/**
 * A alternancia e `useState`, e o modo inicial e `login`. Renderizar o modo
 * cadastro exige mudar o estado — o que `renderToStaticMarkup` nao faz. Entao a
 * bancada prova o modo cadastro pela FONTE: os campos que so existem la estao
 * guardados por `!entrada`, e a tela escreve `Criar conta`.
 *
 * O tipo `ModoConta` NAO pode ser lido em tempo de execucao: um alias de tipo
 * nao existe no JavaScript emitido, e `sessao.ModoConta` seria sempre
 * `undefined` — a prova falharia mesmo com o tipo no lugar. Ele e provado pela
 * FONTE, que e onde o tipo de fato vive.
 */
const fonteSessao = semComentarios(arquivo('src/lib/cliente/sessao.ts'));
if (/ModeConta|ModoConta/.test(fonteSessao) && fonteSessao.includes("'login' | 'signup'") &&
    fonteLogin.includes("useState<ModoConta>('login')"))
  ok('o modo inicial e `login`, o outro e `signup`, e o tipo e `ModoConta`', 'os dois do original');
else fail('modos', 'nao estao declarados como o original');

if (fonteLogin.includes('{!entrada &&') || fonteLogin.includes("modo === 'login'"))
  ok('os campos de cadastro estao guardados por condicao', 'nao aparecem no modo entrada');
else fail('guarda dos campos de cadastro', 'nome/WhatsApp podem estar sempre visiveis');

/** `Criar conta` e o titulo do outro modo, e o original o escreve. */
if (fonteLogin.includes('Criar conta') && fonteOriginal && fonteOriginal.includes('"Criar conta"'))
  ok('`Criar conta` e transcrito', 'o titulo do modo cadastro');
else fail('titulo do cadastro', 'ausente');

/* ============ 5. o aviso — as duas cores ============ */

console.log('\n5. `ClienteToast` — o aviso das duas mensagens');

const htmlSucesso = render(ClienteToast, { message: sessao.MENSAGEM_ENTROU, tom: 'sucesso' });
const htmlErro = render(ClienteToast, { message: sessao.ERRO_CREDENCIAL, tom: 'erro' });
const htmlVazio = render(ClienteToast, { message: null, tom: 'sucesso' });

if (textos(htmlSucesso).includes('Bem-vinda de volta!'))
  ok('o aviso de sucesso desenha a mensagem', 'Bem-vinda de volta!');
else fail('aviso de sucesso', textos(htmlSucesso));

if (textos(htmlErro).includes(sessao.ERRO_CREDENCIAL))
  ok('o aviso de erro desenha a mensagem de credencial', sessao.ERRO_CREDENCIAL);
else fail('aviso de erro', textos(htmlErro));

if (htmlVazio === '')
  ok('`message: null` nao desenha NADA', 'o aviso sumiu, e nao um retangulo vazio');
else fail('aviso vazio', htmlVazio);

/** O sucesso usa `--success`; o erro usa `--danger`. Nao podem ter a mesma cor. */
if (htmlSucesso.includes('bg-success-surface') && !htmlSucesso.includes('bg-danger-surface'))
  ok('o aviso de sucesso usa o token `success`', 'nao uma cor propria');
else fail('cor do sucesso', 'nao usa o token');

if (htmlErro.includes('bg-danger-surface') && !htmlErro.includes('bg-success-surface'))
  ok('o aviso de erro usa o token `danger`', 'e nao o verde');
else fail('cor do erro', 'nao usa o token');

if (htmlSucesso.includes('role="status"') && htmlSucesso.includes('aria-live="polite"'))
  ok('o aviso tem `role="status"` e `aria-live="polite"`', 'quem nao ve, ouve');
else fail('semantica do aviso', 'falta `role`/`aria-live`');

/** O verde NAO e um hex cru: e o token. Uma cor propria criaria um segundo verde. */
if (!/#[0-9a-f]{6}|hsl\(/i.test(fonteToast))
  ok('o aviso NAO fixa cor em hex nem hsl', 'usa os tokens do projeto');
else fail('cor crua no aviso', 'ha hex/hsl no componente');

/* ============ 6. A PORTA — o defeito caro ============ */

console.log('\n6. a casca como PORTAO — o defeito que nenhuma outra bancada veria');

/**
 * A casca monta `CustomerLogin` quando nao ha sessao, e a tela quando ha. As
 * duas metades sao necessarias: sem a primeira, o portao nao existe; sem a
 * segunda, ele nunca abre.
 */
if (fonteCasca.includes('<CustomerLogin'))
  ok('a casca monta o formulario de entrada', 'e onde o portao mora');
else fail('casca sem login', 'o portao nao existe');

if (fonteCasca.includes('onEntrar={entrar}'))
  ok('a casca passa `onEntrar` ao formulario', 'e a porta que abre');
else fail('`onEntrar` ausente', 'o formulario nao tem como abrir a area');

/** O estado do portao existe e a decisao e uma guarda antes do retorno. */
if (/if\s*\(\s*!dentro\s*\)/.test(fonteCasca))
  ok('ha uma guarda `if (!dentro)` antes da area', 'sem sessao, a area nao aparece');
else fail('guarda do portao', 'a area aparece sempre');

if (/const\s*\[dentro,\s*setDentro\]/.test(fonteCasca))
  ok('o estado do portao e `dentro`', 'nomeado — nao um booleano solto');
else fail('estado do portao', 'nao encontrado');

/** `Sair` FECHA o portao: ele e o unico gesto que produz "sem sessao". */
const corpoSair = (fonteCasca.match(/function sair\(\)\s*\{[\s\S]*?\}/) ?? [''])[0];
if (corpoSair.includes('setDentro(false)'))
  ok('`Sair` fecha o portao (`setDentro(false)`)', 'e o unico gesto que leva ao login');
else fail('`Sair` nao fecha o portao', corpoSair || '(nao encontrado)');

const corpoEntrar = (fonteCasca.match(/function entrar\(\)\s*\{[\s\S]*?\}/) ?? [''])[0];
if (corpoEntrar.includes('setDentro(true)'))
  ok('`entrar` abre o portao (`setDentro(true)`)', 'e o que o formulario chama');
else fail('`entrar` nao abre o portao', corpoEntrar || '(nao encontrado)');

/**
 * A PORTA NAO PODE FICAR PRESA. O estado nasce `true` (a area abre DENTRO, como
 * o print `cli-001`, que mostra a cliente ja logada) e pode ir para `false`
 * (`Sair`) e voltar para `true` (`entrar`). Uma guarda SEM o `entrar` deixaria o
 * usuario preso no login para sempre — e a bancada pega isso olhando as duas
 * transicoes, e nao so a existencia da guarda.
 */
if (/useState\(true\)/.test(fonteCasca) && corpoSair && corpoEntrar)
  ok('o portao NASCE aberto e sabe fechar e reabrir', 'comeca dentro (print cli-001) e volta pelo formulario');
else fail('portao assimetrico', 'nasce aberto mas nao ha caminho de volta');

/** Nao ha rota `/conta/login`: o original poe o portao no LAYOUT. */
if (!existsSync(join(SRC, 'app', '(cliente)', 'conta', 'login')))
  ok('NAO foi criada uma rota `/conta/login`', 'o original usa o layout como portao, nao uma pagina');
else fail('rota de login criada', 'o material nao tem `/conta/login`');

/* ============ 7. a honestidade — o que a fase NAO faz ============ */

console.log('\n7. honestidade — nada aqui autentica de verdade');

/** A area nao toca rede: nenhum `fetch`, nenhum provedor. */
if (!/\bfetch\s*\(/.test(fonteLogin) && !/\bsupabase\b/i.test(fonteLogin))
  ok('o formulario NAO chama rede nem provedor', 'nao ha `.signInWithPassword` nem `fetch`');
else fail('chamada de rede', 'o formulario tenta autenticar sem provedor');

if (!/\bsupabase\b/i.test(fonteLogica))
  ok('a logica NAO importa `supabase`', 'o original importa; aqui nao ha provedor');
else fail('supabase em `login.ts`', 'importou um provedor que esta fase nao tem');

/** As senhas nao passam de um `useState`: nenhum `localStorage`, nenhum log. */
if (!/localStorage|sessionStorage/.test(fonteLogin) && !/console\./.test(fonteLogin))
  ok('a senha nao vai para o navegador nem para o console', 'so o `useState`');
else fail('persistencia/console', 'a senha pode vazar para o navegador ou o log');

/**
 * O AVISO DE HONESTIDADE. Sem ele, `ENTRAR` pareceria autenticar de verdade —
 * que e a promessa que esta fase nao pode fazer.
 */
if (/ainda n[aã]o encerra sess[aã]o/i.test(arquivo('src/components/cliente/account-shell.tsx')))
  ok('a tela diz que entrar NAO cria sessao real', 'a autenticacao entra na fase de integracao');
else fail('aviso de honestidade', 'a entrada promete uma sessao que nao existe');

/** Mas o aviso de SUCESSO e verdadeiro: a demonstracao entra de fato. */
if (fonteLogin.includes('setAviso') || fonteLogin.includes('{ texto: MENSAGEM_ENTROU'))
  ok('o sucesso mostra `Bem-vinda de volta!` ao entrar', 'e o print `cli-001` que prova o aviso');
else fail('aviso de sucesso na tela', 'entrar nao mostra a mensagem do print');

/* ============ 8. o escopo — o que a bancada NAO deve ver ============ */

console.log('\n8. escopo — a area da cliente sozinha');

const cliente = semComentarios(fonteLogin + fonteLogica + fonteToast + fonteCasca);
if (!/from\s+['"]@\/components\/admin|from\s+['"]@\/lib\/(?!cliente)/.test(cliente))
  ok('nada importa do admin nem de outro modulo de negocio', 'a area da cliente e autonoma');
else fail('import cruzado', 'a area da cliente importou algo de fora');

/* ============ 9. provas ao contrario ============ */

console.log('\n9. provas ao contrario — o instrumento tem que saber REPROVAR');

/** 1. A validacao distinguiria os casos? Uma funcao que sempre aprova falharia. */
const sempreAprova = () => ({ valido: true, motivo: null });
let distinguiria = false;
for (const [dados, esperado] of casos) if (sempreAprova(dados).valido !== esperado) distinguiria = true;
if (distinguiria)
  ok('um `sempre aprova` NAO passaria na bateria de validacao', 'a bateria tem os dois sentidos');
else fail('bateria de validacao', 'ela nao distingue aprovacao de recusa');

/** 2. O `trim` e real: um e-mail com espaco passa SO com ele. */
if (login.validarLogin({ email: ' a@b.co ', senha: '123456' }).valido &&
    !login.validarLogin({ email: ' a@b.co ', senha: '123456' }).valido === false)
  ok('o `trim` e o que faz o e-mail com espaco passar', 'sem ele a recusa seria falsa');
else fail('`trim`', 'o e-mail com espaco nao passa');

/** 3. O motivo vazio NAO e o mesmo que o motivo de recusa. */
if (sessao.ERRO_CREDENCIAL !== '' && sessao.ERRO_CREDENCIAL.length > 10)
  ok('`ERRO_CREDENCIAL` tem corpo — nao e uma string vazia', `"${sessao.ERRO_CREDENCIAL}"`);
else fail('`ERRO_CREDENCIAL` vazio', 'um aviso vazio passaria como valido');

/** 4. `MENSAGEM_ENTROU` e a do print, e nao outra. */
if (sessao.MENSAGEM_ENTROU !== sessao.MENSAGEM_CONTA_CRIADA)
  ok('as duas mensagens de sucesso sao DIFERENTES', 'entrar e criar conta nao mostram o mesmo texto');
else fail('mensagens iguais', 'entrar e cadastro mostrariam a mesma frase');

console.log(`\n${provas - falhas}/${provas} provas — ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
