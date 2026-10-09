/**
 * Metricas de Estoque — modulo PURO, sem React e sem dados.
 *
 * E aqui que o Estoque deixa de ser uma tela e vira uma REGRA. Tudo o que a
 * tabela mostra como numero — o status da linha, o glifo da coluna QTDE, o
 * corte dos KPIs, a ordem das linhas — sai de uma funcao deste arquivo. E o que
 * permite a bancada provar as decisoes sem navegador.
 *
 * ESTE MODULO NAO E DONO DE QUANTIDADE. Ele projeta o que `lib/produtos` guarda
 * e reusa as contas de la (`totalStock`, `isLowStock`) em vez de reescreve-las.
 * Uma segunda copia da regra de estoque baixo e a forma mais rapida de a tela de
 * Estoque e a de Produtos discordarem sobre a mesma peca.
 */

import { isLowStock, toNumber, totalStock } from '@/lib/produtos/metrics';
import type { Product } from '@/lib/produtos/types';
import { PRINT_ROW_ORDER, type StockOverride } from './demo';
import type {
  DeltaGlyph,
  MovementType,
  StockAdjustment,
  StockMovement,
  StockRow,
  StockStats,
  StockStatus,
  StockVariation,
} from './types';

/**
 * O corte de "esgotado" — zero unidades.
 *
 * NAO e 1: o print adm-028 mostra `ESGOTADOS 0` e o produto com 1 unidade
 * (`Kit Nike`) aparece em VERMELHO na tabela, mas NAO conta como esgotado. Ou
 * seja, 1 unidade e "baixo", e nao "esgotado". So zero e esgotado.
 */
export const OUT_OF_STOCK_AT = 0;

/**
 * A situacao de uma linha, pela quantidade — a MESMA regra de Produtos.
 *
 * `esgotado` primeiro: zero e tambem `<= 5`, entao a ordem dos testes importa.
 * Se o `isLowStock` viesse antes, todo produto esgotado apareceria como "baixo"
 * e o KPI `ESGOTADOS` nunca sairia de zero.
 */
export function stockStatus(total: number): StockStatus {
  if (total <= OUT_OF_STOCK_AT) return 'esgotado';
  if (isLowStock(total)) return 'baixo';
  return 'normal';
}

/** A quantidade decide a cor do numero na coluna ESTOQUE TOTAL (print: `1` e `5` em vermelho). */
export function isHighlightedTotal(total: number): boolean {
  return stockStatus(total) !== 'normal';
}

/** As quatro contagens do topo, derivadas das linhas — nunca digitadas a mao. */
export function summarizeStock(rows: StockRow[], movements: StockMovement[]): StockStats {
  return {
    totalProducts: rows.length,
    lowStock: rows.filter((row) => row.status === 'baixo').length,
    outOfStock: rows.filter((row) => row.status === 'esgotado').length,
    movements: movements.length,
  };
}

/**
 * ORDEM DAS LINHAS. Ver `PRINT_ROW_ORDER` em `demo.ts` para o porque da lista
 * explicita.
 *
 * Duas metades: primeiro quem esta na lista do print, na ordem dela; depois os
 * ids que a lista nao conhece, em ordem alfabetica. A segunda metade e o que
 * impede um produto novo de sumir da tela — a lista do print nao podia prever
 * um produto que ainda nao existia.
 */
export function orderForStock<T extends { productId: string; name: string }>(rows: T[]): T[] {
  const position = new Map(PRINT_ROW_ORDER.map((id, index) => [id, index]));
  const known: T[] = [];
  const rest: T[] = [];
  for (const row of rows) (position.has(row.productId) ? known : rest).push(row);

  known.sort(
    (a, b) => (position.get(a.productId) ?? 0) - (position.get(b.productId) ?? 0),
  );
  rest.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return [...known, ...rest];
}

/**
 * Monta a linha de UM produto.
 *
 * A REGRA CENTRAL, e ela vem de `lib/produtos`: se o produto tem cores com
 * estoque proprio, o total e a SOMA DELAS; sem cores, vale o estoque geral.
 * `totalStock` ja implementa exatamente isso e e reusada aqui — nao recalculada.
 *
 * `override` e a sobreposicao declarada em `demo.ts` (divergencia entre prints).
 * Quando ela existe, ela vence a cor E o total, porque e ela que reproduz o
 * print de Estoque. Hoje sao dois produtos — `Macaquinho` e `top` — e o efeito e
 * justamente dar a eles as pastilhas de cor que o cadastro nao tem.
 *
 * O status NUNCA vem de fora: e sempre derivado do total, pelo mesmo corte do
 * KPI. Se o total e a sobreposicao discordassem, a linha mostraria um numero e o
 * KPI outro.
 */
export function buildStockRow(product: Product, override?: StockOverride): StockRow {
  const variations: StockVariation[] = override
    ? override.variations.map((variation) => ({ ...variation }))
    : product.colors
        .filter((color): color is typeof color & { stock: number } => color.stock !== null)
        .map((color) => ({
          colorId: color.id,
          name: color.name,
          hex: color.hex || null,
          quantity: toNumber(color.stock),
        }));

  const total = override ? override.total : totalStock(product);
  const first = product.images[0];

  return {
    productId: product.id,
    name: product.name,
    imageUrl: first ? first.url : null,
    imageAlt: first ? first.alt : product.name,
    // O print mostra `—` em TODAS as linhas: nao ha SKU cadastrado.
    sku: null,
    variations,
    total,
    status: stockStatus(total),
  };
}

/**
 * Monta a linha do produto que so o print de Estoque tem.
 *
 * `Conjunto Glow Nude` nao existe em `lib/produtos` (ver a divergencia em
 * `demo.ts`), entao nao ha `Product` de onde derivar imagem. A linha sai com a
 * miniatura vazia do proprio componente — o mesmo estado que a referencia
 * mostra para pecas sem foto.
 */
export function buildOverrideRow(override: StockOverride): StockRow {
  return {
    productId: override.productId,
    name: override.name,
    imageUrl: null,
    imageAlt: override.name,
    sku: null,
    variations: override.variations.map((variation) => ({ ...variation })),
    total: override.total,
    status: stockStatus(override.total),
  };
}

/** O glifo da coluna QTDE. O print so mostra `±`; ver `DeltaGlyph`. */
export function deltaGlyph(sign: DeltaGlyph['sign'], magnitude: number): DeltaGlyph {
  return { sign, magnitude: Math.abs(Math.round(magnitude)) };
}

/** Texto do glifo: `+1`, `−1` ou `±1` — com o menos tipografico, nao o hifen. */
export function formatDelta(delta: DeltaGlyph): string {
  if (delta.sign === 'up') return `+${delta.magnitude}`;
  if (delta.sign === 'down') return `−${delta.magnitude}`;
  return `±${delta.magnitude}`;
}

/** Um ajuste e um `±` — nao uma entrada nem uma saida. Ver `StockAdjustment`. */
export function glyphForAdjustment(): DeltaGlyph['sign'] {
  return 'adjust';
}

/**
 * Onde o ajuste cai: a cor escolhida, ou o estoque geral do produto.
 *
 * Escreve SO no alvo, e nunca recalcula as outras quantidades a partir do novo
 * total. Um ajuste que "distribuisse" a diferenca entre as cores seria uma
 * invencao: o print nao mostra isso, e a pessoa pediu o numero de UMA cor.
 * Quando ha uma cor com estoque proprio e o alvo e outra cor, o total do produto
 * passa a ser a soma das cores — que e a regra de `totalStock`, e nao um defeito.
 */
export function applyAdjustment(product: Product, adjustment: StockAdjustment): Product {
  const quantity = Math.max(0, Math.round(adjustment.quantity));

  if (adjustment.colorId === null) {
    return { ...product, stock: quantity, updatedAt: new Date().toISOString() };
  }

  const colors = product.colors.map((color) =>
    color.id === adjustment.colorId ? { ...color, stock: quantity } : color,
  );
  return {
    ...product,
    colors,
    stock: totalStock({ ...product, colors } as Pick<Product, 'stock' | 'colors'>),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * A linha de historico de um ajuste.
 *
 * DATA e HORA nao vem daqui: o print usa a data real do lancamento, e a tela
 * passa o instante em que o ajuste foi feito. O id tambem vem de fora, porque
 * e o que garante que dois ajustes no mesmo segundo nao virem a mesma linha.
 *
 * COR e TAM. saem `null` quando o ajuste foi no estoque geral, e e isso que faz
 * a coluna mostrar `—` como no print. TAM. e `null` SEMPRE, porque o estoque
 * nao tem nivel de tamanho — ver `types.ts`.
 */
export function buildMovement(
  adjustment: StockAdjustment,
  context: {
    id: string;
    at: string;
    productName: string;
    colorName: string | null;
    responsible: string;
  },
): StockMovement {
  return {
    id: context.id,
    at: context.at,
    productId: adjustment.productId,
    productName: context.productName,
    colorName: context.colorName,
    sizeLabel: null,
    delta: deltaGlyph(glyphForAdjustment(), adjustment.quantity),
    type: adjustment.type,
    responsible: context.responsible,
  };
}

/** Filtro do historico — `Todas` nao e um tipo, e a ausencia de filtro. */
export type MovementFilter = MovementType | 'todas';

export function filterMovements(
  movements: StockMovement[],
  filter: MovementFilter,
): StockMovement[] {
  if (filter === 'todas') return [...movements];
  return movements.filter((movement) => movement.type === filter);
}

/**
 * Busca do campo `Buscar produto ou SKU...`.
 *
 * Busca no NOME e no SKU. Hoje todo SKU e `null`, entao na pratica so o nome
 * casa — mas a funcao ja le os dois, que e o que o placeholder promete. Sem
 * isso, quem digitasse um SKU futuro nao acharia nada e a causa seria invisivel.
 */
export function filterRows(rows: StockRow[], term: string): StockRow[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [...rows];
  return rows.filter((row) => {
    if (row.name.toLowerCase().includes(needle)) return true;
    return row.sku !== null && row.sku.toLowerCase().includes(needle);
  });
}

/** Rótulo do status, para a tela e para o `aria-label` da linha. */
export function statusLabel(status: StockStatus): string {
  if (status === 'esgotado') return 'Esgotado';
  if (status === 'baixo') return 'Estoque baixo';
  return 'Normal';
}

/** Rótulo legivel de cada tipo de movimentacao — o texto do chip do print. */
export const MOVEMENT_LABELS: { value: MovementType; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
  { value: 'venda', label: 'Venda' },
  { value: 'reposicao', label: 'Reposição' },
  { value: 'devolucao', label: 'Devolução' },
  { value: 'ajuste', label: 'Ajuste' },
];

/** O rotulo de um tipo, para a pastilha da coluna TIPO. */
export function movementLabel(type: MovementType): string {
  return MOVEMENT_LABELS.find((item) => item.value === type)?.label ?? type;
}
