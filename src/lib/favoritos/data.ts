/**
 * A camada de dados de Favoritos — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Nada aqui toca banco: não há `prisma`, não há
 * `DATABASE_URL`, não há `process.env`. O Neon entra na fase de integração, e o
 * contrato desta função já é o que ele vai preencher.
 *
 * ================== O QUE O BANCO VAI FAZER (e o que JÁ está decidido) ==================
 *
 * A leitura é um AGRUPAMENTO, não um `select` de linhas. O original (Lovable)
 * faz exatamente isto, e o formato importa porque muda o custo:
 *
 *   1. `wishlist` é contada por produto — `SELECT product_id, COUNT(*) FROM
 *      wishlist GROUP BY product_id`. Um produto com 40 salvamentos é UMA linha
 *      aqui, e não 40;
 *   2. só os produtos com contagem entram — `ids` vazio devolve lista vazia, sem
 *      segunda consulta;
 *   3. o nome, a primeira imagem e a categoria vêm de `products` (`images[0]` e a
 *      categoria ligada), buscados só pelos `ids` que apareceram.
 *
 * ================== POR QUE A DEMONSTRAÇÃO É VAZIA ==================
 *
 * `wishlist` numa loja recém-instalada não tem linha, então a consulta devolve
 * zero produtos — o mesmo estado do print. Inventar favoritos aqui faria a tela
 * mostrar salvamentos que não existem, e o estado vazio (que é o do print) nunca
 * seria exercitado. A lista vazia é o dado honesto, e a bancada a prova.
 */

import { DEMO_FAVORITES } from './demo';
import type { FavoriteRow } from './types';

/**
 * A mensagem que a tela mostra quando o banco ainda não está ligado.
 *
 * Mora aqui, e não na tela, porque é uma propriedade da CAMADA DE DADOS: quando o
 * Neon entrar, é este arquivo que muda e esta constante que sai. Ver a nota no fim
 * do arquivo.
 */
const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/** O que uma leitura devolve: os dados e de onde eles vieram. */
export interface FavoritesResult {
  data: FavoriteRow[];
  source: 'demo';
  /** Presente só enquanto a persistência não está ligada. */
  reason?: string;
}

/**
 * OS PRODUTOS MAIS FAVORITADOS — a leitura da tela.
 *
 * Devolve a lista JÁ AGRUPADA e ordenada por salvamentos. Não recebe janela de
 * tempo: o original não filtra favoritos por período, e acrescentar um filtro que
 * o material não tem seria inventar um recorte. Quando o banco entrar, é aqui que
 * as três consultas descritas acima rodam.
 *
 * A cópia (`[...]`) evita que a tela mutando a lista altere a demonstração — o
 * array do módulo é um só, e `sort` no lugar o reordenaria para as próximas
 * chamadas.
 */
export async function listFavorites(): Promise<FavoritesResult> {
  return {
    data: [...DEMO_FAVORITES],
    source: 'demo',
    reason: PENDING_REASON,
  };
}

export { PENDING_REASON };
