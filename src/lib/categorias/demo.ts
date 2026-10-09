/**
 * Dados de demonstracao do modulo Categorias.
 *
 * SEPARACAO OBRIGATORIA, igual a Produtos: nada aqui e persistencia. Estes sao
 * os valores que aparecem no print adm-030/adm-031, transcritos linha por
 * linha, e existem apenas para que a tela possa ser conferida visualmente
 * contra a referencia.
 *
 * Quem consome estes dados e `src/lib/categorias/data.ts`. A tela NUNCA importa
 * deste arquivo diretamente.
 *
 * AS DUAS CATEGORIAS QUE O PRINT NAO MOSTRA
 *
 * O print lista seis: Tops, Macaquinhos, Conjuntos, Shorts, Atacado e Leggings
 * (todos com `ordem 1..6`). Mas os produtos de demonstracao — que ja existiam,
 * aprovados, na Fase 2 — estao em oito categorias: acrescentam `Streetwear`
 * (onde vive a `Jaqueta Corta Vento Fit`) e `Croppeds` (onde vive o
 * `Cropped Urban Fit`).
 *
 * Apagar as duas deixaria aqueles produtos apontando para uma categoria
 * inexistente — o famoso filtro que mostra "Streetwear" na lista de produtos e
 * um select de categoria sem essa opcao. Entao elas ficam, nas ordens
 * seguintes (7 e 8) e marcadas com `[NOVA]` no nome, para que ninguem confunda
 * o que veio do print com o que foi acrescentado aqui.
 *
 * `productCount` NAO aparece neste arquivo de proposito: ele e contado dos
 * produtos reais em `data.ts`. Um numero escrito a mao aqui viraria mentira no
 * dia em que um produto mudasse de categoria.
 *
 * As imagens sao SVG em `data:` e nao fotos — sao marcadores de posicao bege,
 * os mesmos da Fase 2. Os prints mostram foto real em `Tops` e `Conjuntos`;
 * essas fotos nao sao nossas e por isso nao sao embutidas. O que fica
 * reproduzido e a ESTRUTURA: duas categorias com capa, quatro sem.
 */

import type { Category } from './types';

/** Marcador de posicao bege circular, no tom medido dos prints (#F2E7DD). */
function placeholder(tint = '#F2E7DD'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${tint}"/><circle cx="48" cy="42" r="15" fill="#FFFFFF" opacity="0.55"/><path d="M22 96c0-16 12-26 26-26s26 10 26 26z" fill="#FFFFFF" opacity="0.55"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const CAPA_BEIGE = placeholder();
const CAPA_PELE = placeholder('#EBD9C8');

/** Data fixa: o print nao mostra data de criacao, e "hoje" mudaria a cada rodada. */
const MESMA_DATA = '2026-06-12T10:00:00.000Z';

/**
 * Nome de exibicao. As duas acrescentadas levam `[NOVA]` porque nao estao no
 * print — e o aviso de que a origem delas e outra.
 */
export const DEMO_CATEGORIES: Category[] = [
  {
    id: 'cat-tops',
    name: 'Tops',
    slug: 'tops',
    image: { id: 'cat-tops-img', url: CAPA_BEIGE, alt: 'Tops' },
    sortOrder: 1,
    isActive: true,
    productCount: 0,
    metaTitle: '',
    metaDescription: '',
    introText: '',
    createdAt: MESMA_DATA,
    updatedAt: MESMA_DATA,
  },
  {
    id: 'cat-macaquinhos',
    name: 'Macaquinhos',
    slug: 'macaquinhos',
    image: null,
    sortOrder: 2,
    isActive: true,
    productCount: 0,
    metaTitle: '',
    metaDescription: '',
    introText: '',
    createdAt: MESMA_DATA,
    updatedAt: MESMA_DATA,
  },
  {
    id: 'cat-conjuntos',
    name: 'Conjuntos',
    slug: 'conjuntos',
    image: { id: 'cat-conjuntos-img', url: CAPA_PELE, alt: 'Conjuntos' },
    sortOrder: 3,
    isActive: true,
    productCount: 0,
    metaTitle: '',
    metaDescription: '',
    introText: '',
    createdAt: MESMA_DATA,
    updatedAt: MESMA_DATA,
  },
  {
    id: 'cat-shorts',
    name: 'Shorts',
    slug: 'shorts',
    image: null,
    sortOrder: 4,
    isActive: true,
    productCount: 0,
    metaTitle: '',
    metaDescription: '',
    introText: '',
    createdAt: MESMA_DATA,
    updatedAt: MESMA_DATA,
  },
  {
    // A unica INATIVA do print: `/atacado · ordem 5 · inativo`, acao `Ativar`.
    id: 'cat-atacado',
    name: 'Atacado',
    slug: 'atacado',
    image: null,
    sortOrder: 5,
    isActive: false,
    productCount: 0,
    metaTitle: '',
    metaDescription: '',
    introText: '',
    createdAt: MESMA_DATA,
    updatedAt: MESMA_DATA,
  },
  {
    id: 'cat-leggings',
    name: 'Leggings',
    slug: 'leggings',
    image: null,
    sortOrder: 6,
    isActive: true,
    productCount: 0,
    metaTitle: '',
    metaDescription: '',
    introText: '',
    createdAt: MESMA_DATA,
    updatedAt: MESMA_DATA,
  },
  {
    // [NOVA] Nao esta no print. Existe porque a `Jaqueta Corta Vento Fit`
    // (Fase 2, ja aprovada) aponta para `cat-streetwear`.
    id: 'cat-streetwear',
    name: '[NOVA] Streetwear',
    slug: 'streetwear',
    image: null,
    sortOrder: 7,
    isActive: true,
    productCount: 0,
    metaTitle: '',
    metaDescription: '',
    introText: '',
    createdAt: MESMA_DATA,
    updatedAt: MESMA_DATA,
  },
  {
    // [NOVA] Nao esta no print. Existe porque o `Cropped Urban Fit`
    // (Fase 2, ja aprovada) aponta para `cat-croppeds`.
    id: 'cat-croppeds',
    name: '[NOVA] Croppeds',
    slug: 'croppeds',
    image: null,
    sortOrder: 8,
    isActive: true,
    productCount: 0,
    metaTitle: '',
    metaDescription: '',
    introText: '',
    createdAt: MESMA_DATA,
    updatedAt: MESMA_DATA,
  },
];

/** Nota de honestidade exibida na tela, junto do aviso de origem dos dados. */
export const DEMO_CATEGORIAS_NOTE =
  'Categorias de demonstração. As marcadas com [NOVA] não aparecem no print — foram acrescentadas para não deixar produto sem categoria.';
