/**
 * Tipos do dominio de Categorias.
 *
 * MESMA REGRA DA FASE 2: nada aqui e persistencia. Isto e o CONTRATO que a tela
 * consome hoje e que o Prisma vai satisfazer depois, com nomes de campo em
 * camelCase traduzidos para as colunas snake_case (`image_url`, `sort_order`,
 * `is_active`, `meta_title`, `meta_description`, `intro_text`) na camada de
 * dados, num unico lugar.
 *
 * POR QUE UM TIPO PROPRIO, e nao o `Category` de `lib/produtos/types.ts`:
 * o `Category` de Produtos e o subconjunto que o SELECT de categoria do
 * formulario de produto precisa — `{ id, name, slug }`. A tela de Categorias
 * precisa de mais: imagem de capa, ordem de exibicao, status ativo/inativo e o
 * bloco de SEO que a referencia do projeto guarda por categoria. Sao perguntas
 * diferentes, entao sao tipos diferentes.
 *
 * Os DOIS descricao: `Product.categoryId` continua apontando para o `id` desta
 * categoria, e a ponte entre os dois mundos e `lib/categorias/data.ts`. O tipo
 * estreito de Produtos NAO muda — preservar o que ja funciona em
 * `/admin/produtos` e parte do pedido.
 */

/** Imagem de capa da categoria. Hoje sempre `data:`; amanha a URL do storage. */
export interface CategoryImage {
  id: string;
  url: string;
  /** Texto alternativo; obrigatorio para acessibilidade. */
  alt: string;
}

export interface Category {
  id: string;
  name: string;
  /** URL amigavel. Gerada do nome, mas editavel — igual ao slug de Produtos. */
  slug: string;

  /** Capa exibida na lista (recortada em circulo). `null` = sem imagem. */
  image: CategoryImage | null;

  /** Ordem de exibicao na loja. Empate na ordem e desempatado pelo nome. */
  sortOrder: number;

  /**
   * `false` = a categoria nao aparece na loja.
   *
   * Nasceu do print: adm-030/031 mostram `/atacado · ordem 5 · INATIVO` com a
   * acao `Ativar` no lugar de `Desativar`. A referencia antiga do projeto nao
   * tinha essa coluna; o print manda, entao ela existe.
   */
  isActive: boolean;

  /**
   * Quantos produtos apontam para esta categoria.
   *
   * Contado na leitura, a partir dos produtos — NAO e um campo gravado. Guardar
   * um contador no banco cria a chance de ele divergir da contagem real depois
   * de mover uma peca de categoria; contando na leitura isso nao acontece.
   */
  productCount: number;

  /** SEO por categoria, como a referencia do projeto guarda. */
  metaTitle: string;
  metaDescription: string;
  /** Texto de introducao, quando a referencia usar. */
  introText: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Rascunho usado pelo formulario.
 *
 * `sortOrder` fica como string durante a digitacao, como os precos do produto:
 * o campo precisa aceitar o estado "vazio" enquanto a pessoa apaga para
 * redigitar, e `Number('')` e 0, nao "ainda nao digitou".
 */
export interface CategoryDraft {
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
  introText: string;
  /** Enquanto true, o slug acompanha o nome automaticamente. */
  slugTouched: boolean;
}

/** Erros por campo, no formato que `Field` ja usa na fundacao. */
export type CategoryFieldErrors = Partial<Record<keyof CategoryDraft, string>>;
