/**
 * Dados de demonstracao do modulo Produtos.
 *
 * SEPARACAO OBRIGATORIA: nada aqui e persistencia. Estes sao os valores que
 * aparecem nos prints (adm-025), transcritos linha por linha, e existem apenas
 * para que a tela possa ser conferida visualmente contra a referencia.
 *
 * Quem consome estes dados e `src/lib/produtos/data.ts`. A tela NUNCA importa
 * deste arquivo diretamente.
 *
 * Quando o Neon existir, `data.ts` passa a ler do banco e este arquivo vira
 * somente semente de desenvolvimento (`prisma/seed.ts`) ou e descartado.
 *
 * As imagens sao SVG em `data:` e nao fotos: sao marcadores de posicao bege,
 * iguais ao fundo vazio que a propria referencia mostra em Macaquinho e Kit
 * Nike. Nao sao fotos de produto e nao fingem ser.
 */

import type { Category, Product } from './types';

/** Marcador de posicao bege quadrado, no tom medido dos prints (#F2E7DD). */
function placeholder(seed: string, tint = '#F2E7DD'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${tint}"/><circle cx="48" cy="42" r="15" fill="#FFFFFF" opacity="0.55"/><path d="M22 96c0-16 12-26 26-26s26 10 26 26z" fill="#FFFFFF" opacity="0.55"/></svg>`;
  void seed;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const IMAGE_BEIGE = placeholder('padrao');
const IMAGE_ROSA = placeholder('rosa', '#F0D4D8');
const IMAGE_PELE = placeholder('pele', '#EBD9C8');
const IMAGE_AZUL = placeholder('azul', '#D8E2EA');
const IMAGE_VERDE = placeholder('verde', '#DCE8DE');

export const DEMO_CATEGORIES_PRODUTOS: Category[] = [
  { id: 'cat-conjuntos', name: 'Conjuntos', slug: 'conjuntos' },
  { id: 'cat-leggings', name: 'Leggings', slug: 'leggings' },
  { id: 'cat-tops', name: 'Tops', slug: 'tops' },
  { id: 'cat-shorts', name: 'Shorts', slug: 'shorts' },
  { id: 'cat-streetwear', name: 'Streetwear', slug: 'streetwear' },
  { id: 'cat-macaquinhos', name: 'Macaquinhos', slug: 'macaquinhos' },
  { id: 'cat-croppeds', name: 'Croppeds', slug: 'croppeds' },
];

function img(url: string, alt: string, id: string) {
  return { id, url, alt };
}

export const DEMO_PRODUCTS_PRODUTOS: Product[] = [
  {
    id: 'p-01',
    name: 'top',
    slug: 'top',
    description: '',
    categoryId: 'cat-tops',
    price: 179,
    costPrice: 90,
    promoPrice: null,
    compareAtPrice: null,
    images: [img(IMAGE_ROSA, 'top', 'p-01-i1')],
    colors: [],
    sizes: ['P', 'M', 'G'],
    stock: 8,
    status: 'active',
    featured: true,
    createdAt: '2026-06-12T10:12:00',
    updatedAt: '2026-06-16T09:30:00',
  },
  {
    id: 'p-02',
    name: 'Macaquinho',
    slug: 'macaquinho',
    description: '',
    categoryId: 'cat-macaquinhos',
    price: 69.99,
    costPrice: 40,
    promoPrice: null,
    compareAtPrice: null,
    images: [img(IMAGE_PELE, 'Macaquinho', 'p-02-i1')],
    colors: [],
    sizes: ['P', 'M', 'G'],
    stock: 5,
    status: 'active',
    featured: false,
    createdAt: '2026-06-11T16:40:00',
    updatedAt: '2026-06-15T11:05:00',
  },
  {
    id: 'p-03',
    name: 'Kit Nike',
    slug: 'kitnike',
    description: '',
    categoryId: 'cat-conjuntos',
    price: 139.9,
    costPrice: 119.99,
    promoPrice: null,
    compareAtPrice: null,
    images: [img(IMAGE_PELE, 'Kit Nike', 'p-03-i1')],
    colors: [],
    sizes: ['P', 'M', 'G'],
    stock: 1,
    status: 'active',
    featured: false,
    createdAt: '2026-06-10T09:15:00',
    updatedAt: '2026-06-14T18:22:00',
  },
  {
    id: 'p-04',
    name: 'Legging Modeladora Premium',
    slug: 'legging-modeladora-premium',
    description: '',
    categoryId: 'cat-leggings',
    price: 129.9,
    costPrice: 0,
    promoPrice: null,
    compareAtPrice: null,
    images: [img(IMAGE_BEIGE, 'Legging Modeladora Premium', 'p-04-i1')],
    colors: [],
    sizes: ['P', 'M', 'G', 'GG'],
    stock: 40,
    status: 'active',
    featured: true,
    createdAt: '2026-06-08T14:00:00',
    updatedAt: '2026-06-13T10:40:00',
  },
  {
    id: 'p-05',
    name: 'Short Fitness Energy',
    slug: 'short-energy-fit',
    description: '',
    categoryId: 'cat-shorts',
    price: 79.9,
    costPrice: 0,
    promoPrice: null,
    compareAtPrice: null,
    images: [img(IMAGE_ROSA, 'Short Fitness Energy', 'p-05-i1')],
    colors: [],
    sizes: ['P', 'M', 'G'],
    stock: 30,
    status: 'active',
    featured: false,
    createdAt: '2026-06-07T08:55:00',
    updatedAt: '2026-06-12T15:10:00',
  },
  {
    id: 'p-06',
    name: 'Top Essential Sustentação',
    slug: 'top-essential-sustentacao',
    description: '',
    categoryId: 'cat-tops',
    price: 89.9,
    costPrice: 0,
    promoPrice: null,
    compareAtPrice: null,
    images: [img(IMAGE_AZUL, 'Top Essential Sustentação', 'p-06-i1')],
    colors: [],
    sizes: ['PP', 'P', 'M', 'G'],
    stock: 35,
    status: 'active',
    featured: true,
    createdAt: '2026-06-05T11:20:00',
    updatedAt: '2026-06-11T09:00:00',
  },
  {
    id: 'p-07',
    name: 'Jaqueta Corta Vento Fit',
    slug: 'jaqueta-corta-vento',
    description: '',
    categoryId: 'cat-streetwear',
    price: 179.9,
    costPrice: 0,
    promoPrice: null,
    compareAtPrice: null,
    images: [img(IMAGE_VERDE, 'Jaqueta Corta Vento Fit', 'p-07-i1')],
    colors: [],
    sizes: ['P', 'M', 'G', 'GG'],
    stock: 22,
    status: 'active',
    featured: false,
    createdAt: '2026-06-04T17:30:00',
    updatedAt: '2026-06-10T12:45:00',
  },
  {
    id: 'p-08',
    name: 'Macaquinho costas nuas',
    slug: 'macaquinho-costas-nuas',
    description: '',
    categoryId: 'cat-macaquinhos',
    price: 69.9,
    costPrice: 0,
    promoPrice: null,
    compareAtPrice: null,
    images: [img(IMAGE_ROSA, 'Macaquinho costas nuas', 'p-08-i1')],
    colors: [],
    sizes: ['P', 'M', 'G'],
    stock: 18,
    status: 'active',
    featured: false,
    createdAt: '2026-06-03T13:05:00',
    updatedAt: '2026-06-09T16:15:00',
  },
  {
    id: 'p-09',
    name: 'Cropped Urban Fit',
    slug: 'cropped-urban-fit',
    description: '',
    categoryId: 'cat-croppeds',
    price: 99.9,
    costPrice: 0,
    promoPrice: null,
    compareAtPrice: null,
    images: [img(IMAGE_BEIGE, 'Cropped Urban Fit', 'p-09-i1')],
    colors: [],
    sizes: ['P', 'M', 'G'],
    stock: 28,
    status: 'active',
    featured: false,
    createdAt: '2026-06-02T10:00:00',
    updatedAt: '2026-06-08T14:25:00',
  },
];

/** Descricao de cada produto na referencia e vazia; nao inventamos texto. */
export const EMPTY_PRODUCT_DESCRIPTION_NOTE =
  'Os prints nao mostram descricao preenchida em nenhum produto.';
