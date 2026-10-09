/**
 * Tipos do dominio de Produtos.
 *
 * Estes tipos foram desenhados espelhando o que um schema PostgreSQL/Neon vai
 * precisar. Nomes de campo em camelCase (idiomatico no TS); a traducao para
 * colunas snake_case (`cost_price`, `compare_at_price`, `promo_price`,
 * `is_active`) acontece na camada de dados, num unico lugar.
 *
 * Regra de ouro da fase: nada aqui e persistencia. Isto e o CONTRATO que a
 * tela consome hoje e que o Prisma vai satisfazer depois.
 */

/** Imagem da galeria. A ordem do array e a ordem exibida na loja. */
export interface ProductImage {
  /** Chave estavel para listas e reordenacao (nao e o id do banco). */
  id: string;
  /** URL publica. Hoje sempre `data:`; amanha a URL do storage. */
  url: string;
  /** Texto alternativo; obrigatorio para acessibilidade. */
  alt: string;
}

/** Variacao de cor. Cada cor tem fotos e estoque proprios. */
export interface ProductColor {
  id: string;
  /** Nome exibido, ex.: "Nude", "Preto". */
  name: string;
  /** Hex para o seletor de cor, ex.: "#E8D5C4". */
  hex: string;
  /** Subconjunto de `ProductImage`, so desta cor. */
  images: ProductImage[];
  /** Estoque proprio da cor. `null` = usar o estoque geral do produto. */
  stock: number | null;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  name: string;
  /** URL amigavel. Gerada do nome, mas editavel. */
  slug: string;
  description: string;

  /** Id da categoria; string vazia = "— Sem categoria —". */
  categoryId: string;

  /** Preco que a cliente paga, em reais. */
  price: number;
  /** Quanto a loja pagou pela peca. Label em vermelho no formulario. */
  costPrice: number;
  /** Preco promocional opcional. */
  promoPrice: number | null;
  /** Preco antigo, para exibir riscado. */
  compareAtPrice: number | null;

  images: ProductImage[];
  colors: ProductColor[];
  /** Tamanhos oferecidos, ex.: ["P","M","G"]. */
  sizes: string[];

  /** Estoque geral, usado quando a cor nao tem estoque proprio. */
  stock: number;

  status: ProductStatus;
  /** Destaque na vitrine. */
  featured: boolean;

  /** ISO 8601. Usado para "mais recentes primeiro". */
  createdAt: string;
  updatedAt: string;
}

/** Categoria do catalogo. A tela de Categorias vira depois; o tipo ja serve. */
export interface Category {
  id: string;
  name: string;
  slug: string;
}

/** Rascunho usado pelo formulario. Numeros ficam como string durante a digitacao. */
export interface ProductDraft {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: string;
  costPrice: string;
  promoPrice: string;
  compareAtPrice: string;
  sizes: string[];
  colors: ProductColor[];
  images: ProductImage[];
  stock: string;
  status: ProductStatus;
  featured: boolean;
  /** Enquanto true, o slug acompanha o nome automaticamente. */
  slugTouched: boolean;
}

/** Erros por campo, no formato que a fundacao ja usa em `Field`. */
export type ProductFieldErrors = Partial<Record<keyof ProductDraft, string>>;
