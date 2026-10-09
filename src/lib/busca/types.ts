/**
 * Os tipos do módulo Busca.
 *
 * Aqui a unidade NÃO é o termo já somado: é a LINHA CRUA de uma busca, como o
 * banco a registra. O agrupamento (quantas vezes o termo foi buscado, quantos
 * resultados ele trouxe em média) é uma REGRA, e regra mora em `metrics.ts` — não
 * na leitura, não na tela.
 *
 * A separação importa neste módulo mais do que em outros: o print tem DUAS
 * contagens que saem da MESMA linha crua (`count` = quantas buscas; `avg` =
 * resultados por busca), e é o `avg` que separa `Termos mais pesquisados` de
 * `Buscas sem resultado`. Guardar só o total apagaria essa distinção.
 */

/** Uma linha de `search_terms` — uma busca registrada. */
export interface SearchTermRow {
  /** O termo como a cliente digitou, com maiúsculas e acentos. */
  term: string;
  /**
   * A forma normalizada do termo (sem acento, sem caixa), ou `null`.
   *
   * É a CHAVE do agrupamento quando existe: `Camiseta` e `camiseta` são a mesma
   * busca, e somá-las separadas inflaria a lista. Um `null` cai no próprio
   * `term` — a nota de `aggregateSearch` explica.
   */
  normalized: string | null;
  /** Quantos produtos a busca devolveu. Zero é o que interessa ao relatório. */
  resultsCount: number;
}

/** Um termo já agrupado, para as duas listas da tela. */
export interface AggregatedTerm {
  /** O termo EXIBIDO — o primeiro da linha crua, com a grafia da cliente. */
  term: string;
  /** Quantas vezes foi buscado. */
  count: number;
  /** Resultados por busca, EM MÉDIA. Zero é uma busca sem resultado. */
  avg: number;
}
