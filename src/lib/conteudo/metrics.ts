/**
 * Metricas do grupo CONTEUDO — PURAS.
 *
 * Sem React, sem I/O, sem `Date.now()`. Nada aqui le relogio: as quatro telas deste
 * grupo nao mostram data nenhuma — nem na lista, nem no formulario, nem no rodape.
 * Banners tem `ordem`, Looks tem `ordem`, nada tem `criado em`.
 *
 * ================== OS TRES DONOS QUE MORAM AQUI ==================
 *
 *   1. `toSiteCategories`   a aba Categorias e um JOIN sobre `lib/categorias`
 *   2. `positionOf`         a ORDEM das linhas e DERIVADA, nunca gravada
 *   3. `lookPreview`        o preview do look e uma CONTA sobre as pecas
 *
 * Os tres existem pelo mesmo motivo: um numero calculado na tela nao tem onde ser
 * provado, e um numero GRAVADO pode divergir da lista que ele descreve.
 */

import type { Category } from '@/lib/categorias/types';
import type { Product } from '@/lib/produtos/types';
import type { Look, LookPiece, SiteCategory } from './types';

/* ===================== 1. A aba Categorias e um JOIN ===================== */

/**
 * AS CATEGORIAS DE `Conteudo do Site` — derivadas de `lib/categorias`.
 *
 * ================== POR QUE ESTA FUNCAO EXISTE ==================
 *
 * A tentacao era transcrever os seis ids de adm-054 numa constante em `demo.ts`.
 * Isso foi escrito e removido: guardar a lista aqui cria um SEGUNDO DONO para as
 * categorias, e a lista desta aba passa a divergir de `/admin/categorias` no dia em
 * que alguem renomear, reordenar ou desativar uma categoria. A divergencia ja
 * existe hoje — o catalogo tem OITO categorias e o print tem SEIS —, o que e
 * exatamente o cenario em que um segundo dono vira mentira.
 *
 * ================== O QUE ESTA FUNCAO NAO FAZ ==================
 *
 * NAO FILTRA NADA. Nem por `isActive`, nem por `productCount > 0`.
 *
 * A tentacao seguinte seria esconder as duas categorias inativas ou vazias para a
 * lista chegar nas seis do print. Isso seria pior que transcrever: as duas linhas a
 * mais ficariam invisiveis AQUI e continuariam existindo em `/admin/categorias`, e a
 * tela mostraria um numero diferente da tela vizinha sobre a mesma tabela. Filtro
 * silencioso e a forma mais rapida de uma tela "bater" com um print e mentir sobre a
 * loja.
 *
 * A tela mostra as OITO. As duas a mais sao visiveis contra o material, e a bancada
 * as DECLARA pelo nome (`Streetwear`, `Croppeds`) em vez de fingir que nao existem.
 *
 * ================== A ORDEM ==================
 *
 * Vem de `sortOrder`, que e o campo que a tela de Categorias ja usa e que reproduz
 * `ordem 1..6` do print. Empate e desempatado pelo nome, com `pt-BR` — as duas
 * categorias acrescentadas nasceram nas ordens 7 e 8, entao o desempate so age se
 * alguem mudar a ordem no banco.
 *
 * ================== A CAPA ATRAVESSA O CORTE ==================
 *
 * Esta funcao CARREGA `imageUrl`, e a versao anterior dela nao carregava — a nota
 * antiga dizia que a linha de `adm-055` "comeca direto no nome" e que transcrever a
 * capa criaria "um campo que nenhuma linha daquela tela desenha".
 *
 * As duas afirmacoes estavam erradas contra o print:
 *
 *   a aba `Categorias` e **adm-054**, nao adm-055 (essa e `Secoes da Home`);
 *   e em adm-054 as linhas `Tops` e `Conjuntos` MOSTRAM foto. `Shorts`, `Atacado` e
 *   `Leggings` e que nao mostram — a miniatura e condicional, nao inexistente.
 *
 * A `Category` de `/admin/categorias` ja carrega `image`, entao o corte so a
 * ATRAVESSA. Nada e inventado: nao ha imagem nova, ha a imagem que ja existia e que
 * esta tela desenha quando ela esta la.
 *
 * ================== AS DUAS TELAS DIVERGEM NA FORMA, E FICA REGISTRADO ==================
 *
 * `/admin/categorias` (adm-030) usa um CIRCULO FIXO (`rounded-full size-12`) com um
 * icone de reserva quando nao ha imagem. Adm-054 nao tem circulo nem reserva: o quadro
 * segue a proporcao da foto (`Tops` e um retrato e sai 59x96) e quando a foto falta
 * nao ha caixa nenhuma. Sao dois desenhos diferentes para a mesma entidade, e nao se
 * muda a outra tela por conta propria.
 */
export function toSiteCategories(categories: Category[]): SiteCategory[] {
  return [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'pt-BR'))
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      // A imagem vem junto, e `?? null` e explicito: `Category.image` ja e
      // `CategoryImage | null`. Sem o `??` o corte carregaria `undefined` para um
      // campo tipado `string | null`, e a linha desenharia uma caixa quebrada.
      imageUrl: category.image?.url ?? null,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    }));
}

/* ======================= 2. A ORDEM das linhas ======================= */

/**
 * A POSICAO DE UMA LINHA — o `ORDEM: n` de adm-051.
 *
 * ================== POR QUE NAO E O CAMPO `sortOrder` ==================
 *
 * O formulario `Novo Banner` (adm-052) abre com `ORDEM DE EXIBIÇÃO` em **`0`** — um
 * campo de texto com um zero, que e o valor de repouso que o print mostra. A lista
 * de adm-051 mostra **`ORDEM: 1`, `ORDEM: 2`, `ORDEM: 3`**.
 *
 * As duas coisas nao podem sair do mesmo numero do mesmo jeito: se a lista
 * imprimisse `sortOrder` cru, o banner recem-criado apareceria como `ORDEM: 0` — e
 * o print mostra a lista comecando em 1. Se o campo abrisse em `1`, o print do
 * formulario estaria errado.
 *
 * O QUE O PRINT PROVA, entao: **o formulario guarda a ORDEM RELATIVA e a lista
 * imprime a POSICAO na lista**. Ou seja, o numero entre parenteses e a posicao
 * ORDINAL da linha depois de ordenada — o mesmo `n` de "1o, 2o, 3o" —, e nao o
 * valor do campo.
 *
 * ELE E DERIVADO, e nao gravado, pelo mesmo motivo de `Category.productCount`: um
 * `position` guardado no banco fica errado na hora em que alguem apaga ou reordena
 * uma linha, e a tela passa a mostrar `1, 2, 4`. Derivando da lista, a posicao nunca
 * diverge dela — e apagar a linha 2 renumeraria 1, 2 (as tres do print viram duas, e
 * a segunda continua sendo a segunda).
 *
 * ================== O `+1` NAO E DECORACAO ==================
 *
 * `indexOf` e base zero; `ORDEM: 1` e base um. A bancada prova os DOIS lados disso:
 * a primeira linha e `1` e nao `0`, e a ultima de tres e `3` e nao `2`.
 *
 * A IDENTIDADE E POR `id`, e nao por igualdade de objeto: duas linhas podem ter
 * titulos iguais, e um `indexOf` por referencia devolveria `-1` para uma copia. Um
 * `id` que nao esta na lista devolve `0`, e nao `-1` — `ORDEM: 0` seria a unica
 * saida que confundiria a contagem com o valor do campo.
 */
export function positionOf<T extends { id: string }>(rows: readonly T[], row: T): number {
  const index = rows.findIndex((candidate) => candidate.id === row.id);
  return index < 0 ? 0 : index + 1;
}

/**
 * AS LINHAS NA ORDEM DA LISTA, pela `sortOrder` e depois pelo titulo.
 *
 * `sortOrder` e a ordem que a pessoa escolheu; o titulo e o desempate. Sem o
 * desempate, duas linhas com a mesma `sortOrder` sairiam na ordem em que o banco
 * devolveu as linhas — que muda de consulta para consulta, e faria o `ORDEM: n`
 * mudar sozinho entre dois carregamentos da mesma tela.
 *
 * `localeCompare` com `pt-BR` e o mesmo criterio do seletor de produtos: sem ele
 * `Á` e `a` ficariam em blocos separados, e a lista pareceria fora de ordem.
 */
export function byDisplayOrder<T extends { sortOrder: number; title: string }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'pt-BR'),
  );
}

/** A mesma ordenacao para `HomeSection`, cujo campo de titulo se chama `title`. */
export function bySectionOrder<T extends { sortOrder: number; title: string }>(
  rows: readonly T[],
): T[] {
  return byDisplayOrder(rows);
}

/* ===================== 3. O preview do look ===================== */

/** Uma linha do preview: a peca e o preco que ela traz. */
export interface LookPreviewRow {
  productId: string;
  name: string;
  price: number;
}

export interface LookPreview {
  /** `Sem nome` quando o rascunho nao tem nome — o texto literal do print. */
  name: string;
  /** `0 peças` (ou `1 peça`). */
  pieceCountLabel: string;
  /** `Total: R$ 0,00`. */
  totalLabel: string;
  /** As pecas resolvidas contra o catalogo. */
  rows: LookPreviewRow[];
}

/**
 * O TEXTO DO PLACEHOLDER DO PREVIEW — `Sem nome`.
 *
 * Esta em `metrics.ts` e nao no componente porque e o VALOR DE UM CAMPO do preview,
 * e a bancada precisa conferi-lo sem renderizar. E o mesmo caso de
 * `ACTIVE_REQUEST_STATUS` em Carrinho Abandonado.
 */
export const LOOK_UNNAMED = 'Sem nome';

/**
 * O PREVIEW DO LOOK — `Sem nome` / `0 peças` / `Total: R$ 0,00`.
 *
 * ================== AS TRES LINHAS DO PRINT, E DE ONDE CADA UMA VEM ==================
 *
 * Conferido no pixel em `235840.png`, a faixa `PREVIEW DO LOOK` imprime:
 *
 *     PREVIEW DO LOOK
 *     Sem nome
 *     0 peças
 *     Total: R$ 0,00
 *     COMPRAR LOOK COMPLETO
 *
 *   `Sem nome`    o NOME do rascunho, ou o placeholder quando ele esta vazio. A
 *                 forma do rotulo (serifada, text-xl) e do componente; o TEXTO
 *                 mora aqui.
 *   `N peças`     a CONTAGEM das pecas escolhidas. `0 peças` com zero marcado, e
 *                 com uma marcada o plural muda (`1 peça`) — o print so prova o
 *                 plural, e a bancada prova os dois.
 *   `Total`       a SOMA dos precos das pecas escolhidas, formatada em `pt-BR`.
 *
 * ================== NAO HA DESCONTO, E ISSO FOI CONFERIDO ==================
 *
 * A primeira versao do tipo `LookPiece` tinha um `discountPercent`, com a
 * justificativa de que o preview imprimia uma linha `Discount`. Ele NAO IMPRIME. As
 * quatro linhas acima sao tudo que existe na faixa. O campo foi removido do tipo, e
 * o preview nao desconta nada — o total e a soma, e a conta inteira e provavel.
 *
 * ================== O TOTAL E A SOMA, NAO UM CAMPO ==================
 *
 * Nao existe `look.total` no dado, e nao deve existir: um total gravado precisa ser
 * recalculado toda vez que uma peca muda de preco, e no dia em que ninguem
 * recalcular a tela mostra o preco de ontem. Aqui ele e recomputado a cada render a
 * partir do catalogo — a mesma decisao de `productCount` e de `positionOf`.
 *
 * ================== O FORMATO DO DINHEIRO ==================
 *
 * `R$ 0,00` no print: separador de milhar ponto, decimal virgula, sempre duas casas.
 * E o `pt-BR` com `minimumFractionDigits: 2`. A bancada confere o `0,00` e um valor
 * de milhar, e — o caso que quebra — que o separador depois de `R$` pode vir como
 * ESPACO INQUEBRAVEL. O `Intl` de `pt-BR` insere `U+00A0` (e nao o espaco comum
 * `U+0020`) em varias versoes do ICU, e a bancada normaliza os dois antes de
 * comparar. Sem essa normalizacao a comparacao falharia por um caractere invisivel
 * — defeito ja registrado em `feedback_bancada_espaco_inquebravel`, que e
 * exatamente este caso.
 *
 * ================== PECA QUE NAO ESTA NO CATALOGO ==================
 *
 * A resolucao e por JOIN: o id da peca e procurado nos produtos que chegaram. Um id
 * que nao existe nao entra em `rows` e NAO soma — melhor um total menor e honesto do
 * que um total que inclui uma peca que a loja nao tem. A bancada prova esse caso.
 */
export function lookPreview(pieces: readonly LookPiece[], products: readonly Product[]): LookPreview {
  const rows: LookPreviewRow[] = [];
  for (const piece of pieces) {
    const product = products.find((candidate) => candidate.id === piece.productId);
    if (!product) continue;
    rows.push({ productId: product.id, name: product.name, price: product.price });
  }

  const total = rows.reduce((sum, row) => sum + row.price, 0);

  return {
    name: LOOK_UNNAMED,
    pieceCountLabel: `${rows.length} ${rows.length === 1 ? 'peça' : 'peças'}`,
    totalLabel: `Total: ${formatBRL(total)}`,
    rows,
  };
}

/**
 * O NOME DO PREVIEW: o do rascunho, ou `Sem nome`.
 *
 * Separado de `lookPreview` porque o preview PRECISA do nome digitado, e a funcao
 * acima e pura e nao recebe o rascunho inteiro — ela recebe as pecas. Assim a conta
 * continua testavel sem montar um rascunho completo, e o texto do vazio continua
 * vindo de um lugar so.
 */
export function lookPreviewName(name: string): string {
  return name.trim() === '' ? LOOK_UNNAMED : name;
}

/**
 * FORMATA EM REAL — `R$ 1.299,90`.
 *
 * O `Intl` de `pt-BR` insere `U+00A0` entre `R$` e o numero em algumas versoes do
 * ICU. O componente nao deveria se importar com qual espaco veio, e a bancada
 * normaliza os dois antes de comparar — ver `normalizar`. Aqui o formato sai como o
 * `Intl` do runtime decidir, porque trocar por uma concatenacao manual abriria mao
 * do agrupamento de milhar por nada.
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ============================ validacoes ============================ */

/**
 * A ORDEM DIGITADA E VALIDA?
 *
 * ================== `0` E VALIDO, E ISSO NAO E DETALHE ==================
 *
 * O formulario de adm-052 abre com `ORDEM DE EXIBIÇÃO` em `0`, e o de adm-062
 * (`Novo look`) tambem. Um campo de ordem que recusasse o zero recusaria o PROPRIO
 * ESTADO DO PRINT: quem abrisse o modal e clicasse em salvar sem mexer em nada
 * levaria um erro.
 *
 * E o mesmo caso dos custos de Financeiro: um `0` nao pode ser confundido com
 * "vazio". O que ele nao pode e ser `NaN`, fracionario ou negativo — posicao e
 * INTEIRO, pelo mesmo motivo de `isValidPriority` no Provador.
 *
 * O limite superior existe porque a coluna e `integer` no banco: um valor que nao
 * cabe na coluna e recusado na tela, com mensagem, em vez de estourar no `insert`.
 */
export function isValidOrder(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 9999;
}

/**
 * O TITULO E VALIDO?
 *
 * O titulo e a UNICA coisa que toda linha destas quatro telas tem — e o unico campo
 * cuja ausencia deixaria uma linha anonima. Nao ha print de erro de validacao em
 * lugar nenhum do material, entao a regra e a minima: nao pode ficar vazio. Nenhum
 * minimo de caracteres, nenhum formato, nenhuma lista de proibidos.
 */
export function isValidTitle(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * A URL DE LINK E ACEITAVEL?
 *
 * O print mostra `/categoria/novidades` — um CAMINHO INTERNO, com barra na frente e
 * sem dominio. Entao "tem que comecar com http" esta errado aqui e recusaria o unico
 * exemplo real do material.
 *
 * O que a funcao recusa e o que o navegador recusaria: vazio e permitido (link
 * opcional), caminho interno e permitido, `http`/`https` sao permitidos, e QUALQUER
 * OUTRO ESQUEMA e recusado. `javascript:` e o caso que importa — ele e um link que,
 * clicado, executa codigo, e a tela do painel nao tem por que aceitar isso.
 */
export function isAcceptableLink(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (trimmed.startsWith('/')) return true;
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!scheme) return true;
  const protocol = scheme[1].toLowerCase();
  return protocol === 'http' || protocol === 'https';
}

/* ============================ o usuario do Instagram ============================ */

/**
 * O `@` DETECTADO DA URL — a linha `Usuário detectado: @closetlunar` de adm-058.
 *
 * ================== O TEXTO DE APOIO NAO E DECORATIVO ==================
 *
 * Ele confirma, antes de salvar, QUAL conta a loja vai exibir. Se a URL tiver uma
 * barra a mais, um `?igshid=`, ou o nome de outra conta, a linha mostra — e a pessoa
 * ve o erro antes de a home publicar o feed errado.
 *
 * ================== A DERIVACAO, E OS CASOS QUE ELA RECUSA ==================
 *
 *   `https://instagram.com/closetlunar`         -> `@closetlunar`
 *   `https://www.instagram.com/nome/`           -> `@nome`
 *   `instagram.com/nome`                        -> `@nome`
 *   `@closetlunar`                              -> `@closetlunar`
 *   qualquer outra coisa (dominio errado, vazio)-> `''`
 *
 * O ULTIMO CASO E O QUE IMPORTA: devolver `''` faz a linha de apoio NAO APARECER, e
 * nao aparecer uma confirmacao falsa. E a diferenca entre "nao sei qual e a conta" e
 * "a conta e esta" — e o componente trata as duas de jeitos diferentes, porque uma
 * delas nao pode ser escrita.
 *
 * ================== POR QUE NAO E UM `split('/').pop()` ==================
 *
 * Porque `https://instagram.com` (a home, sem conta) tem `pop()` = `instagram.com`, e
 * a tela anunciaria `Usuário detectado: @instagram.com`. A funcao exige que sobre um
 * SEGMENTO DE CAMINHO depois do host, e exige que o host seja do Instagram — uma URL
 * de outro dominio nao e "o Instagram da loja", e confirmar-la seria pior que nao
 * confirmar nada.
 *
 * A BARRA FINAL NAO E CONTA: `instagram.com/nome/` tem `pop()` = `''`, e por isso os
 * segmentos vazios sao filtrados antes.
 *
 * QUERY E FRAGMENTO SAO DESCARTADOS (`?igshid=...`, `#`): o link que o painel do
 * Instagram entrega para copiar vem com eles, e eles nao fazem parte do nome.
 */
export function instagramHandle(url: string): string {
  const raw = url.trim();
  if (raw === '') return '';
  if (raw.startsWith('@')) return sanitizeHandle(raw.slice(1));

  const withoutScheme = raw.replace(/^https?:\/\//i, '');
  const withoutQuery = withoutScheme.split(/[?#]/)[0];
  const segments = withoutQuery.split('/').filter((part) => part !== '');
  if (segments.length < 2) return '';

  const host = segments[0].toLowerCase().replace(/^www\./, '');
  if (host !== 'instagram.com') return '';

  return sanitizeHandle(segments[1]);
}

/**
 * O NOME DE USUARIO TEM O FORMATO QUE O INSTAGRAM ACEITA?
 *
 * Letras, numeros, ponto e sublinhado, ate 30 — mais o hifen, que aparece nos
 * nomes comerciais. Um segmento de caminho que tenha `:` ou espaco nao e um nome de
 * usuario, e confirmar-lo com `@` na frente daria uma confirmacao que o Instagram
 * nao reconheceria.
 */
function sanitizeHandle(value: string): string {
  const clean = value.trim();
  if (!/^[A-Za-z0-9._-]{1,30}$/.test(clean)) return '';
  return `@${clean}`;
}

/* ============================ contagens de tela ============================ */

/**
 * QUANTAS LINHAS ESTAO ATIVAS — o numero que a barra de filtros de cada lista
 * mostra, quando ela mostra.
 *
 * NAO e usado em lugar nenhum hoje, e existe por um motivo de contrato: as quatro
 * telas deste grupo listam TUDO (o print nao tem filtro de status em nenhuma das
 * quatro — nem Banners, nem Categorias, nem Secoes, nem Beneficios). Deixar a funcao
 * aqui, sem chamador, seria codigo morto; por isso ela NAO esta aqui.
 *
 * O registro fica em vez do codigo: se a proxima rodada pedir o contador, o lugar
 * onde ele NAO esta e este comentario.
 */
