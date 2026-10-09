/**
 * Contas e ordenacao das categorias.
 *
 * Modulo PURO, sem React e sem I/O: recebe listas, devolve listas ou numeros.
 * Esta separado de `data.ts` e do componente porque e aqui que moram os
 * defeitos que um typecheck nao pega — ordem que nao ordena, "proxima ordem"
 * que colide com uma ordem existente, slug repetido.
 *
 * A regra que ele existe para garantir: ORDENAR NUNCA PERDE LINHA. Um
 * comparador que so cobre parte dos casos (por exemplo, so quando as duas
 * ordens diferem) devolve `undefined` em parte das comparacoes e a linha pode
 * terminar em posicao arbitraria. Todo ramo aqui devolve um numero.
 */

import type { Category } from './types';

/**
 * Ordena a lista SEM mutar a entrada.
 *
 * `[...rows]` antes do `sort` e obrigatorio: `Array.prototype.sort` ordena no
 * lugar, e a lista que chega aqui e o estado do React. Mutar o estado direto
 * faria a tela nao perceber a mudanca (mesma referencia) ou, pior, mudar sem
 * renderizar.
 *
 * O desempate e sempre por nome: sem ele, duas categorias com a mesma ordem
 * ficam na posicao que o motor de ordenacao escolher, e a lista "pula" de uma
 * renderizacao para outra. Com o desempate, a ordem e estavel e previsivel.
 */
export function sortCategories(
  rows: Category[],
  sort: { field: 'sortOrder' | 'name' | 'productCount'; direction: 'asc' | 'desc' },
): Category[] {
  const direction = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    let result: number;
    switch (sort.field) {
      case 'name':
        result = a.name.localeCompare(b.name, 'pt-BR');
        break;
      case 'productCount':
        result = a.productCount - b.productCount;
        break;
      case 'sortOrder':
      default:
        result = a.sortOrder - b.sortOrder;
        break;
    }
    if (result !== 0) return result * direction;
    // Desempate estavel, sempre crescente pelo nome, independente da direcao:
    // inverter o desempate faria a lista mudar de forma estranha ao alternar.
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

/** Quantas categorias estao ativas. */
export function countActive(rows: Category[]): number {
  return rows.filter((category) => category.isActive).length;
}

/** Quantas categorias estao inativas. */
export function countInactive(rows: Category[]): number {
  return rows.filter((category) => !category.isActive).length;
}

/**
 * Soma de produtos nas categorias — quantas pecas estao classificadas.
 *
 * NAO e "quantos produtos a loja tem": produto sem categoria nao entra aqui.
 * Somar `productCount` e justamente a conta que responde "quantas pecas estao
 * em alguma categoria".
 */
export function totalProducts(rows: Category[]): number {
  return rows.reduce((sum, category) => sum + category.productCount, 0);
}

/**
 * Proxima ordem livre: o maior `sortOrder` da lista mais um.
 *
 * O print mostra `Ordem 7` no modal `Nova categoria` com seis categorias
 * listadas — ou seja, a referencia calcula assim. Usar `rows.length + 1` daria
 * o mesmo resultado no caso do print, mas quebra assim que existir uma ordem
 * removida (1, 2, 5 → `length+1` = 4, que ja esta ocupada).
 *
 * Lista vazia devolve 1.
 */
export function nextSortOrder(rows: Category[]): number {
  if (rows.length === 0) return 1;
  return Math.max(...rows.map((category) => category.sortOrder)) + 1;
}

/**
 * O slug ja esta em uso por OUTRA categoria?
 *
 * `exceptId` existe para a edicao: ao salvar uma categoria mantendo o proprio
 * slug, ela nao pode acusar conflito consigo mesma. Sem isso, toda edicao de
 * uma categoria existente reprovaria pelo slug dela propria.
 *
 * A comparacao normaliza a caixa: `Tops` e `tops` sao a mesma URL na web.
 */
export function slugTaken(rows: Category[], slug: string, exceptId?: string): boolean {
  const alvo = slug.trim().toLowerCase();
  if (!alvo) return false;
  return rows.some(
    (category) => category.id !== exceptId && category.slug.trim().toLowerCase() === alvo,
  );
}

/**
 * Data da alteracao mais recente da lista, ou `null` se a lista estiver vazia.
 *
 * Usada na linha de resumo para dizer quando o catalogo mudou pela ultima vez.
 */
export function lastUpdated(rows: Category[]): string | null {
  if (rows.length === 0) return null;
  return rows.reduce(
    (mais, category) => (category.updatedAt > mais ? category.updatedAt : mais),
    rows[0].updatedAt,
  );
}
