/**
 * Metricas do cluster Provador e IA — PURAS.
 *
 * Sem React, sem I/O, sem `Date.now()`. Nada aqui le relogio: as tres telas deste
 * modulo nao mostram data, e um `new Date()` escondido so criaria uma fonte de
 * instabilidade sem comprar nada.
 *
 * ESTE ARQUIVO E O DONO DA ORDEM DA LISTA DE PRODUTOS e do JOIN com o catalogo.
 * Ver a nota `O DONO DA LISTA`, que e a decisao central do modulo.
 */

import type { Category, Product } from '@/lib/produtos/types';
import type { AiSettings, ManualSuggestion, PieceConfig, PieceDefaults } from './types';

/**
 * ================== O DONO DA LISTA (a decisao central) ==================
 *
 * O SELECTOR DE PRODUTOS DAS TRES TELAS NAO TEM LISTA PROPRIA: ele e um JOIN
 * SOBRE `lib/produtos`.
 *
 * ================== POR QUE NAO TRANSCREVER A LISTA DO PRINT ==================
 *
 * O MESMO MODULO TRAZ DUAS LISTAS DE PRODUTOS, E ELAS SE CONTRADIZEM. As duas
 * foram lidas no pixel:
 *
 *   SELETOR (`235547.png`, `235557.png`, `235626.png` — Avatar Virtual e
 *   Provador Virtual), nove itens:
 *     Conjunto Glow Nude · Cropped Urban Fit · Jaqueta Corta Vento Fit · Kit Nike ·
 *     Legging Modeladora Premium · Macaquinho · Macaquinho costas nuas ·
 *     Short Fitness Energy · top
 *
 *   DROPDOWN DA IA (`235639.png`, `235644.png` — IA de Looks), nove itens:
 *     Conjunto Glow Nude · Cropped Urban Fit · Jaqueta Corta Vento Fit · Kit Nike ·
 *     Legging Modeladora Premium · Macaquinho costas nuas · Short Fitness Energy ·
 *     top · Top Essential Sustentação
 *
 * A DIFERENCA, item a item:
 *   · as duas listas tem `Conjunto Glow Nude`, que NAO existe em `lib/produtos`;
 *   · o SELETOR tem `Macaquinho` e nao tem `Top Essential Sustentação`;
 *   · o DROPDOWN tem `Top Essential Sustentação` e nao tem `Macaquinho`.
 *
 * `lib/produtos` (o catalogo real, `p-01` a `p-09`) tem NOVE, entre eles
 * `Macaquinho` e `Top Essential Sustentação`, e NAO tem `Conjunto Glow Nude`.
 * Ou seja: o catalogo tem dois produtos que o seletor nao mostra, e nenhuma das
 * duas listas do print bate com ele. **Os prints do proprio modulo se contradizem
 * sobre qual e a nona peca**, e nao ha como satisfazer os tres.
 *
 * E O MESMO PRODUTO FANTASMA DE adm-034 (Tamanhos), e a decisao tambem e a mesma,
 * porque ela JA FOI VALIDADA (73/73): `Conjunto Glow Nude` aparece em adm-034 e
 * aqui, e NAO aparece em adm-025 (Produtos) nem em `lib/produtos`. A regra
 * `print > projeto original > placeholder` NAO RESOLVE, porque os dois lados sao
 * PRINTS — e um print nao derruba outro.
 *
 * As tres saidas, e por que as duas primeiras foram descartadas:
 *
 *   1. TRANSCREVER o print — criaria um decimo produto que so existe nesta
 *      tela. O id dele nao existiria no catalogo, a config da peca apontaria
 *      para um produto fantasma, e `Conjunto Glow Nude` passaria a existir em
 *      dois lugares discordando do catalogo. E criaria um SEGUNDO dono da
 *      lista de produtos, o que e a origem de toda divergencia.
 *   2. INVENTAR a juncao dos dois (nove do catalogo + Glow Nude = dez) —
 *      pior: fabrica a peca E mantem o segundo dono.
 *   3. **JOIN sobre o catalogo** (adotada) — a lista e derivada, o Glow Nude
 *      fica de fora por nao existir na fonte, e a bancada DECLARA a ausencia
 *      pelo nome (falha se ele entrar, falha se outro sumir).
 *
 * O QUE ISSO CUSTA, e fica registrado: a tela mostra NOVE produtos do catalogo, e
 * CADA print mostra oito dos nove mais o fantasma. Contra o SELETOR, a diferenca e
 * uma linha: entra `Top Essential Sustentação`, sai `Macaquinho`. Contra o
 * DROPDOWN, e a inversa: entra `Macaquinho`, sai `Top Essential Sustentação`. As
 * duas sao diferencas VISIVEIS contra o material, aceitas de proposito — e a
 * mesma do modulo Tamanhos, para a divergencia nao ficar resolvida de dois jeitos
 * diferentes em dois modulos.
 *
 * QUEM ARBITRA: nenhuma tela. Quando existir banco, `products` e a fonte, e as
 * duas telas leem o mesmo — as duas divergencias morrem sozinhas. Ate la, elas
 * vivem no relatorio final e em `project_closet_lunnar_fase4_validada`.
 * ==========================================================================
 */

/**
 * A LISTA DO SELETOR — alfabetica, derivada do catalogo.
 *
 * A ORDEM E `localeCompare`, e nao a ordem de `lib/produtos`: o catalogo comeca
 * por `top`, e o print comeca por `Conjunto Glow Nude` — ou seja, o print esta
 * em ordem ALFABETICA. Ordenar aqui e o que faz a lista reproduzir a ordem do
 * print (sem o item fantasma). O `pt-BR` importa: sem ele `Top` e `top` ficam
 * separados por causa da caixa.
 */
export function selectorProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * A LISTA FILTRADA PELA BUSCA — o campo `Buscar produto...`.
 *
 * A BUSCA E POR NOME, SEM ACENTO E SEM CAIXA, e ela acontece no CLIENTE: o campo
 * filtra a lista que ja esta em memoria. Fazer a busca no servidor a cada tecla
 * precisaria de uma rota de API que nao existe nesta fase.
 *
 * `normalize('NFD')` + remocao dos diacriticos e o mesmo truque do `slugify`: sem
 * ele, buscar `sustentacao` nao acharia `Sustentação`, e a pessoa concluiria que
 * a peca nao existe.
 */
export function filterProducts(products: Product[], termo: string): Product[] {
  const alvo = semAcento(termo.trim());
  if (!alvo) return products;
  return products.filter((product) => semAcento(product.name).includes(alvo));
}

function semAcento(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * ================== POR QUE A BUSCA NAO ACUSA O ITEM AUSENTE ==================
 *
 * Buscar `Glow` neste seletor devolve VAZIO — `Nenhum produto encontrado.`, o
 * estado vazio de adm-040. Isso e CONSEQUENCIA do JOIN, e nao um defeito novo: a
 * peca nao existe no catalogo, entao nao ha o que achar. A tela reproduz o vazio
 * de adm-040 corretamente em qualquer busca que nao case.
 */

/**
 * O PRODUTO SELECIONADO DE UMA CONFIG, ou `null`.
 *
 * `null` significa "nenhum produto escolhido" — o estado de adm-040
 * (`← Selecione um produto para configurar.`) e o de adm-041 (lista com
 * resultados e nenhum selecionado). Devolver `undefined` faria a tela ter que
 * tratar dois vazios; um so basta.
 */
export function selectedProduct(products: Product[], config: PieceConfig | null): Product | null {
  if (!config) return null;
  return products.find((product) => product.id === config.productId) ?? null;
}

/* ----------------------------------------------------------------- Avatar */

/**
 * A IMAGEM DE UM SLOT ESTA PREENCHIDA?
 *
 * `null` e string vazia contam igual — nao ha imagem. E o teste que decide se a
 * linha de adm-038 mostra a URL ou o estado vazio.
 */
export function hasImage(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.trim().length > 0;
}

/**
 * QUANTAS DAS CINCO IMAGENS ESTAO PREENCHIDAS — `0` no estado atual.
 *
 * Existe para a tela poder dizer o progresso sem contar no JSX: com as cinco em
 * `null`, o aviso de "imagens pendentes" precisa de um numero, e esse numero tem
 * que vir da mesma fonte que a lista.
 */
export function filledSlots(urls: (string | null)[]): number {
  return urls.filter((url) => hasImage(url)).length;
}

/**
 * O ROTULO CURTO DA URL, para a linha do cartao.
 *
 * O print mostra a URL TRUNCADA com `...` no fim. Reproduzir o reticulo e o
 * certo: a URL inteira nao cabe na largura da linha, e o print a corta.
 */
export function shortUrl(url: string, max = 48): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max)}...`;
}

/* --------------------------------------------------------------- Provador */

/**
 * A CATEGORIA DA PECA — pelo id, com o rotulo do catalogo.
 *
 * O join e por `categoryId`: a config guarda o id (`cat-tops`), e o rotulo
 * (`Top`) sai de `lib/produtos`. Sem o join, o select imprimiria `cat-tops`.
 */
export function categoryLabel(categories: Category[], categoryId: string): string {
  return categories.find((category) => category.id === categoryId)?.name ?? '';
}

/**
 * UMA CONFIG NOVA PARA UM PRODUTO — com a categoria sugerida.
 *
 * ================== ONDE ESTE DADO VEM DE MENTIRA, E ONDE NAO ==================
 *
 * Quando a pessoa escolhe um produto que ainda nao tem config, a tela cria uma.
 * Os CAMPOS DE REPOUSO nao sao inventados: `position` nasce `automatica` (o
 * valor que o print mostra selecionado), `layer` nasce `1` e nao `3` — o `3` do
 * print e a camada daquele produto especifico, e nal o repouso — e as tres vistas
 * nascem vazias (`IMAGEM DO PROVADOR PENDENTE`).
 *
 * A `categoryId` vem do PROPRIO PRODUTO (`product.categoryId`), e nao de uma
 * constante: os prints de adm-042/046 mostram `Top` porque o produto base era um
 * top. Amarrar `cat-tops` faria toda peca nascer como top.
 */
export function newPieceConfig(product: Product): PieceConfig {
  return {
    productId: product.id,
    categoryId: product.categoryId,
    layer: 1,
    position: 'automatica',
    views: { frente: '', lado: '', costas: '' },
  };
}

/**
 * A CONFIG DE UM PRODUTO QUE AINDA NAO TEM UMA — monta o repouso + o produto.
 *
 * ================== POR QUE ISTO E UMA FUNCAO PURA, E NAO CODIGO NA TELA ==================
 *
 * A primeira versao montava este objeto DENTRO de `piece-workspace.tsx`, com o
 * spread nesta ordem:
 *
 *     { productId: product.id, categoryId: product.categoryId, ...pieceDefaults }
 *
 * e o `typecheck` acusou TS2783: `categoryId` aparecia duas vezes. O `pieceDefaults`
 * era `Omit<PieceConfig, 'productId'>`, ou seja, ele AINDA TINHA `categoryId` — e
 * vinha por ultimo, sobrescrevendo a categoria do produto. Toda peca nascia como
 * `cat-tops`, que e exatamente o defeito que a nota de `newPieceConfig` manda nao
 * cometer.
 *
 * A correcao definitiva foram DUAS mudancas, e nao uma:
 *
 *   1. O tipo virou `PieceDefaults = Omit<PieceConfig, 'productId' | 'categoryId'>`
 *      — agora o repouso NAO TEM os dois campos, entao nao ha ordem de spread que
 *      consiga sobrescrever nada. O compilador impede o defeito.
 *   2. A montagem saiu do componente e veio para ca. Aqui ela e PURA e testavel, e
 *      a bancada prova o que o componente nao deixava provar: que a categoria sai
 *      do produto. Provado com DOIS produtos de categorias diferentes — com um so,
 *      um `cat-tops` fixo passaria.
 *
 * `views` e copiado (e nao compartilhado por referencia): sem a copia, as tres
 * vistas de toda config nova apontariam para o MESMO objeto do repouso, e
 * preencher uma preencheria as tres.
 */
export function newPieceConfigFromDefaults(product: Product, defaults: PieceDefaults): PieceConfig {
  return {
    ...defaults,
    productId: product.id,
    categoryId: product.categoryId,
    views: { ...defaults.views },
  };
}

/* ------------------------------------------------------------- IA de Looks */

/**
 * A PRIORIDADE E VALIDA?
 *
 * O campo do print pede `0-100`, e ele nasce em `0`. Um valor fora da faixa e
 * recusado aqui em vez de ser gravado — e `0` e VALIDO (`0` nao pode ser
 * confundido com "vazio", pelo mesmo motivo dos custos de Financeiro).
 *
 * ================== O INTEIRO, E POR QUE ELE ENTROU DEPOIS ==================
 *
 * A primeira versao aceitava `4.5`: `Number.isFinite(4.5)` e verdadeiro e `4.5`
 * esta dentro de `[0, 100]`. A bancada reprovou, e a pergunta certa nao era "o
 * teste esta exigindo demais?" e sim "o que a prioridade E?".
 *
 * Ela e uma POSICAO numa ordenacao — o peso com que uma relacao aparece na frente
 * das outras —, e o campo e de inteiros: `inputMode="numeric"` abre o teclado sem
 * ponto decimal, e o outro numero desta mesma tela (`Máximo de sugestões por
 * seção`) ja e tratado como inteiro por `clampMaxSuggestions`, que ARREDONDA. Uma
 * prioridade fracionaria seria o unico numero quebrado de um formulario que nao
 * tem nenhum.
 *
 * A DIFERENCA DE RESPOSTA entre as duas funcoes e proposital, e nao
 * inconsistencia: `clampMaxSuggestions` COAGE em silencio (e uma configuracao, e
 * nao ha para quem mostrar erro), enquanto `isValidPriority` RECUSA e a tela
 * mostra a mensagem — porque este campo tem um `error` para mostrar.
 */
export function isValidPriority(valor: number): boolean {
  return Number.isInteger(valor) && valor >= 0 && valor <= 100;
}

/**
 * A RELACAO JA EXISTE NA TABELA?
 *
 * O par (base, sugerido) e a chave: adicionar `A -> B` duas vezes criaria duas
 * linhas identicas na tabela. O mesmo produto sugerido a si proprio
 * (`A -> A`) tambem e recusado — um look que sugere a peca que a pessoa ja esta
 * vendo nao e uma sugestao.
 */
export function isDuplicateRelation(
  rows: ManualSuggestion[],
  baseId: string,
  targetId: string,
): boolean {
  if (!baseId || !targetId) return false;
  if (baseId === targetId) return true;
  return rows.some((row) => row.baseId === baseId && row.targetId === targetId);
}

/**
 * O MAXIMO DE SUGESTOES TEM UM LIMITE SANO?
 *
 * O print traz `8`. Um `0` desligaria a consultora em silencio (nenhuma sugestao
 * e um resultado plausivel, e ninguem notaria que foi configuracao), e um numero
 * gigante encheria a secao. A faixa e `1` a `20` — e o valor do print cai dentro
 * dela, o que e a prova de que a faixa nao foi escolhida para caber no print.
 */
export function clampMaxSuggestions(valor: number): number {
  if (!Number.isFinite(valor)) return 8;
  return Math.min(20, Math.max(1, Math.round(valor)));
}

/** As duas prioridades marcadas por padrao, quando o formulario abre. */
export function aiDefaults(): AiSettings {
  return { sameCollection: true, colorHarmony: true, maxSuggestions: 8 };
}
