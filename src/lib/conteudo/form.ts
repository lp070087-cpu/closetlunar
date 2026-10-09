/**
 * Formularios do grupo CONTEUDO — conversoes e validacao, PURAS.
 *
 * Sem React, sem I/O. O que entra e o que a PESSOA DIGITOU (rascunho, com numeros em
 * texto); o que sai e o que o BANCO guarda (numero). A conversao acontece uma vez,
 * ao salvar, e nao a cada tecla — que e o defeito que o painel inteiro evita.
 *
 * ================== POR QUE OS NUMEROS SAO TEXTO NO RASCUNHO ==================
 *
 * Os dois formularios deste grupo que tem numero — `ORDEM DE EXIBIÇÃO` de adm-052 e
 * o `0` de adm-062 — abrem com o campo PREENCHIDO (`0`) e nao com o campo vazio. Mas
 * os dois precisam ACEITAR o estado vazio enquanto a pessoa apaga para redigitar
 * outro valor.
 *
 * Com um `<input type="number">` controlado por numero, apagar o campo escreve `0`
 * e o zero aparece sozinho — a pessoa briga com ele. Em string, "vazio" e um estado
 * representavel, e a conversao para numero so acontece no `draftToX`. E o mesmo
 * motivo de `CampaignDraft.discountValue` e de `CategoryDraft.sortOrder`.
 */

import { isAcceptableLink, isValidOrder, isValidTitle, instagramHandle } from './metrics';
import type {
  HeroSlide,
  HeroSlideDraft,
  HeroSlideFieldErrors,
  Look,
  LookDraft,
  LookFieldErrors,
  LookPiece,
} from './types';

/* ================================ Banners ================================ */

/** O rascunho em branco do modal `Novo Banner`, com o repouso que o print mostra. */
export function newHeroSlideDraft(defaults: {
  eyebrow: string;
  sortOrder: number;
  isActive: boolean;
}): HeroSlideDraft {
  return {
    title: '',
    eyebrow: defaults.eyebrow,
    subtitle: '',
    linkUrl: '',
    ctaText: '',
    imageDesktopUrl: '',
    imageMobileUrl: '',
    sortOrder: String(defaults.sortOrder),
    isActive: defaults.isActive,
  };
}

/** Um slide do banco vira rascunho para editar — `null` de imagem vira string vazia. */
export function heroSlideToDraft(slide: HeroSlide): HeroSlideDraft {
  return {
    title: slide.title,
    eyebrow: slide.eyebrow,
    subtitle: slide.subtitle,
    linkUrl: slide.linkUrl,
    ctaText: slide.ctaText,
    imageDesktopUrl: slide.imageDesktopUrl ?? '',
    imageMobileUrl: slide.imageMobileUrl ?? '',
    sortOrder: String(slide.sortOrder),
    isActive: slide.isActive,
  };
}

/**
 * A ORDEM DIGITADA — texto vazio vira `0`.
 *
 * ================== POR QUE VAZIO E ZERO, E NAO ERRO ==================
 *
 * Nos DOIS campos de ordem deste grupo, `0` e um valor VALIDO e e o VALOR DE
 * REPOUSO do print. Entao "campo vazio" nao pode virar erro: quem apagar o campo
 * quer o zero, que e o mesmo que o formulario abre. Recusar o vazio obrigaria a
 * pessoa a digitar um `0` que ja estava la.
 *
 * O que NAO pode passar e `-1` ou `1.5` — e para esses dois `isValidOrder` recusa,
 * com a mensagem no campo. A diferenca entre "coagir" e "recusar" ja esta decidida no
 * Provador (`clampMaxSuggestions` coage em silencio, `isValidPriority` recusa com
 * mensagem): aqui ha um campo onde mostrar o erro, entao ele e mostrado.
 */
export function parseOrder(value: string): number {
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** O rascunho vira o registro. `id` vem de fora — ver `newLook` em `data.ts`. */
export function draftToHeroSlide(draft: HeroSlideDraft, id: string): HeroSlide {
  return {
    id,
    title: draft.title.trim(),
    eyebrow: draft.eyebrow.trim(),
    subtitle: draft.subtitle.trim(),
    linkUrl: draft.linkUrl.trim(),
    ctaText: draft.ctaText.trim(),
    imageDesktopUrl: draft.imageDesktopUrl.trim() === '' ? null : draft.imageDesktopUrl.trim(),
    imageMobileUrl: draft.imageMobileUrl.trim() === '' ? null : draft.imageMobileUrl.trim(),
    sortOrder: parseOrder(draft.sortOrder),
    isActive: draft.isActive,
  };
}

/**
 * O QUE O FORMULARIO RECUSA.
 *
 * DUAS REGRAS, e nao mais:
 *
 *   `title`     obrigatorio — e a unica coisa que toda linha desta tela tem
 *   `sortOrder` o formato (inteiro, dentro da faixa) e NUNCA o zero
 *   `linkUrl`   o esquema, quando houver um
 *
 * O `linkUrl` NAO e obrigatorio: o print mostra dois dos tres slides sem link e sem
 * CTA (adm-051: o segundo e o terceiro nao mostram botao nenhum na lista). Um campo
 * obrigatorio ali recusaria dois tercos do material.
 */
export function validateHeroSlide(draft: HeroSlideDraft): HeroSlideFieldErrors {
  const errors: HeroSlideFieldErrors = {};

  if (!isValidTitle(draft.title)) {
    errors.title = 'Informe o título principal do banner.';
  }

  const order = parseOrder(draft.sortOrder);
  if (!isValidOrder(order)) {
    errors.sortOrder = 'Use um número inteiro entre 0 e 9999.';
  }

  /**
   * O LINK INVALIDO NAO TEM CAMPO PROPRIO NO TIPO DE ERRO.
   *
   * `HeroSlideFieldErrors` tem `title` e `sortOrder`. O link entra em `title` porque
   * o tipo nao tem uma chave para ele — e acrescentar uma chave so para carregar a
   * mensagem seria mudar o contrato de erro por conveniencia. Este e o ponto onde
   * isso esta registrado, e nao escondido: se a proxima rodada quiser a mensagem no
   * campo certo, o que falta e a chave no tipo, e o lugar e este `if`.
   */
  if (!isAcceptableLink(draft.linkUrl) && !errors.title) {
    errors.title = 'O link deve ser um caminho interno (/categoria) ou um endereço http(s).';
  }

  return errors;
}

/* ================================== Looks ================================== */

/** O `id` de uma peca no rascunho nao existe: a peca e o par (look, produto). */
export function newLookDraft(id: string, defaults: { sortOrder: number; isActive: boolean }): LookDraft {
  return {
    id,
    name: '',
    subtitle: '',
    description: '',
    coverUrl: '',
    sortOrder: String(defaults.sortOrder),
    isActive: defaults.isActive,
    pieces: [],
  };
}

export function lookToDraft(look: Look): LookDraft {
  return {
    id: look.id,
    name: look.name,
    subtitle: look.subtitle,
    description: look.description,
    coverUrl: look.coverUrl ?? '',
    sortOrder: String(look.sortOrder),
    isActive: look.isActive,
    pieces: look.pieces.map((piece) => ({ productId: piece.productId })),
  };
}

/**
 * MARCAR/DESMARCAR UM PRODUTO NO LOOK.
 *
 * ================== A ORDEM E A DA MARCAÇÃO, E ISSO E VISIVEL ==================
 *
 * Uma peca nova entra no FIM (`[...pieces, ...]`), e nao ordenada por id ou por nome.
 * A razao esta no formulario: os cartoes de adm-062 estao em ordem alfabetica, e o
 * `PREVIEW DO LOOK` logo abaixo desenha as pecas escolhidas. Se a lista fosse
 * reordenada a cada marcacao, a pessoa marcaria a terceira peca e ela apareceria no
 * meio do preview — sem que nada explicasse por que.
 *
 * ================== DESMARCAR E UM FILTRO, E NAO UM `splice` ==================
 *
 * `filter` preserva a ordem relativa do resto sem precisar saber em que posicao a
 * peca estava. Um `splice` com `indexOf` daria o mesmo resultado e erraria no caso em
 * que o mesmo produto estivesse marcado duas vezes — que nao deveria acontecer, mas
 * que um `indexOf` resolveria pela metade em silencio.
 *
 * O componente impede o par duplicado na caixa (uma marcacao tem UM estado), entao
 * esta funcao pode ser idempotente sem custo: marcar o que ja esta marcado nao
 * duplica, e a bancada prova isso.
 */
export function toggleLookPiece(pieces: readonly LookPiece[], productId: string): LookPiece[] {
  const exists = pieces.some((piece) => piece.productId === productId);
  if (exists) return pieces.filter((piece) => piece.productId !== productId);
  return [...pieces, { productId }];
}

export function draftToLook(draft: LookDraft): Look {
  return {
    id: draft.id,
    name: draft.name.trim(),
    subtitle: draft.subtitle.trim(),
    description: draft.description.trim(),
    coverUrl: draft.coverUrl.trim() === '' ? null : draft.coverUrl.trim(),
    sortOrder: parseOrder(draft.sortOrder),
    isActive: draft.isActive,
    pieces: draft.pieces.map((piece) => ({ productId: piece.productId })),
  };
}

/**
 * O QUE O FORMULARIO DE LOOK RECUSA.
 *
 * ================== `name` E O UNICO OBRIGATORIO, E O PRINT PROVA ==================
 *
 * O preview do modal imprime `Sem nome` quando o nome esta vazio — ou seja, o
 * material PREVE o estado sem nome e o desenha. Mas o botao `Salvar` precisa ter o
 * que gravar, e a lista de adm-061 mostra o nome como a unica coluna que toda linha
 * tem.
 *
 * A diferenca entre "o preview sabe desenhar o vazio" e "o registro pode nascer
 * vazio" e a diferenca entre a pre-visualizacao e o dado. O `Sem nome` do preview e
 * um ESTADO DE EDICAO, e nao um valor gravavel.
 *
 * `sortOrder` segue a mesma regra de Banners — inclusive aceitar `0`.
 */
export function validateLook(draft: LookDraft): LookFieldErrors {
  const errors: LookFieldErrors = {};

  if (!isValidTitle(draft.name)) {
    errors.name = 'Informe o nome do look.';
  }

  const order = parseOrder(draft.sortOrder);
  if (!isValidOrder(order)) {
    errors.sortOrder = 'Use um número inteiro entre 0 e 9999.';
  }

  return errors;
}

/* ================================ Instagram ================================ */

/**
 * A URL DO INSTAGRAM E ACEITAVEL?
 *
 * O CAMPO NAO E OBRIGATORIO — o print mostra ele preenchido, mas nao ha nada que
 * obrigue a loja a ter Instagram, e recusar o vazio obrigaria a inventar um.
 *
 * O que se recusa e uma URL que NAO seja do Instagram. `instagramHandle` ja devolve
 * `''` para qualquer outra coisa — e `''` e o mesmo que o campo vazio. Entao a regra
 * fica: **se ha texto, tem que dar um `@`**. E a unica regra que impede a home de
 * exibir o feed de um dominio que nao e o da loja.
 *
 * O `@nome` puro E ACEITO (`instagramHandle` o reconhece): e a forma como as pessoas
 * escrevem o proprio perfil, e recusa-la obrigaria a pessoa a descobrir a URL
 * completa sozinha.
 */
export function isAcceptableInstagram(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return true;
  return instagramHandle(trimmed) !== '';
}

export { instagramHandle };
