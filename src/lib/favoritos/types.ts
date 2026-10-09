/**
 * Os tipos do módulo Favoritos.
 *
 * A tela é uma LISTA DE PRODUTOS, um por peça que tem pelo menos um salvamento.
 * NÃO existe entidade `Favorite` aqui: o que entra é a contagem JÁ AGRUPADA por
 * produto, porque é assim que o print a apresenta — nunca um favorito solto.
 * Quem agrupa é o banco (ou a leitura de `data.ts`), e a tela só ordena o que
 * recebe.
 */

/** Uma linha da lista `Produtos mais favoritados`. */
export interface FavoriteRow {
  /** O `id` do produto — a chave do agrupamento, e o que liga à tabela `products`. */
  productId: string;
  name: string;
  /** A primeira imagem do produto, ou `null` — a linha funciona sem foto. */
  image: string | null;
  /**
   * A categoria, ou `null`. O `null` NÃO é "sem dado": é o produto que não tem
   * categoria ligada, e o original o mostra como `Sem categoria` (o mesmo rótulo
   * que o Relatórios usa). A distinção entre os dois mora aqui no tipo, e não no
   * texto da tela.
   */
  category: string | null;
  /** Quantos salvamentos o produto tem — o `5 ♥` da direita. */
  count: number;
}
