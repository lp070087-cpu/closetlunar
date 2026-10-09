/**
 * Dados demonstrativos de Tamanhos.
 *
 * SO A CAMADA DE DADOS (`data.ts`) IMPORTA DAQUI. Nenhuma tela conhece este
 * arquivo — e a mesma regra das fases 2 e 3.
 *
 * DE ONDE VEM CADA NUMERO
 *
 * A matriz de `Top` e transcrita do print adm-032, celula por celula. E o unico
 * tipo de peca que os seis prints mostram preenchido, e por isso e o unico tipo
 * que vem com medida aqui.
 *
 * Os outros cinco tipos de peca (Short, Legging, Conjunto, Macaquinho,
 * Cropped) existem como OPCAO do filtro — porque o print adm-033 lista os seis —
 * mas vem SEM LINHA NENHUMA. Isso e de proposito: eu nao tenho as medidas de
 * uma legging, e inventar numeros de busto/cintura que parecessem autoridade
 * seria pior do que deixar a tela dizer que ainda nao ha medida cadastrada. E
 * tambem o que faz o estado vazio da Tabela de Medidas ser alcancavel de
 * verdade, em vez de decorativo.
 *
 * A lista de produtos das "Regras por Produto" NAO esta aqui: ela vem de
 * `lib/produtos`, que e o dono dos produtos. Ver `data.ts`.
 *
 * Ela tambem NAO esta na ordem deste arquivo: o print adm-034 mostra os
 * produtos em ordem alfabetica (`Conjunto Glow Nude` primeiro), enquanto
 * `lib/produtos/demo.ts` comeca por `top`. Quem ordena e `data.ts`.
 */

import type { GarmentType, ProductSizeRule, SizeLearningEntry, SizeRow } from './types';

/**
 * Os seis tipos de peca, na ordem do print adm-033 — que e tambem a ordem da
 * referencia do projeto. Nao acrescentei nem reordenei nada.
 */
export const GARMENT_TYPES: { value: GarmentType; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'short', label: 'Short' },
  { value: 'legging', label: 'Legging' },
  { value: 'conjunto', label: 'Conjunto' },
  { value: 'macaquinho', label: 'Macaquinho' },
  { value: 'cropped', label: 'Cropped' },
];

/**
 * Matriz de medidas de `Top`, transcrita de adm-032.
 *
 * A ORDEM DE INSERCAO AQUI NAO E A ORDEM DA TELA. O print mostra as linhas em
 * ordem alfabetica (`G`, `GG`, `M`, `P`, `PP`), e quem garante isso e
 * `sortBySizeOrder` — a bancada prova invertendo esta lista e conferindo que a
 * saida nao muda. Manter a lista ja na ordem do print e so higiene para quem
 * ler o arquivo.
 *
 * A data fixa aqui e o marcador de "isto e demonstracao", igual aos outros
 * modulos: nao ha gravacao, entao nao ha data real para mostrar.
 */
const DEMO_TOP_MATRIX: Omit<SizeRow, 'id' | 'garmentType' | 'updatedAt'>[] = [
  {
    sizeLabel: 'G',
    bust: { min: 92, max: 98 },
    waist: { min: 72, max: 78 },
    hip: { min: 98, max: 104 },
    height: { min: 160, max: 180 },
    weight: { min: 62, max: 72 },
  },
  {
    sizeLabel: 'GG',
    bust: { min: 98, max: 106 },
    waist: { min: 78, max: 86 },
    hip: { min: 104, max: 112 },
    height: { min: 160, max: 185 },
    weight: { min: 70, max: 82 },
  },
  {
    sizeLabel: 'M',
    bust: { min: 86, max: 92 },
    waist: { min: 66, max: 72 },
    hip: { min: 92, max: 98 },
    height: { min: 158, max: 175 },
    weight: { min: 56, max: 65 },
  },
  {
    sizeLabel: 'P',
    bust: { min: 82, max: 88 },
    waist: { min: 62, max: 68 },
    hip: { min: 88, max: 94 },
    height: { min: 155, max: 170 },
    weight: { min: 50, max: 58 },
  },
  {
    sizeLabel: 'PP',
    bust: { min: 78, max: 84 },
    waist: { min: 58, max: 64 },
    hip: { min: 84, max: 90 },
    height: { min: 150, max: 165 },
    weight: { min: 45, max: 52 },
  },
];

const DEMO_STAMP = '2026-09-01T12:00:00.000Z';

/** Id estavel por tipo + tamanho, ex.: `size-top-M`. */
function rowId(garmentType: GarmentType, sizeLabel: string): string {
  return `size-${garmentType}-${sizeLabel}`;
}

export const DEMO_SIZE_ROWS: SizeRow[] = [
  ...DEMO_TOP_MATRIX.map((row) => ({
    ...row,
    id: rowId('top', row.sizeLabel),
    garmentType: 'top' as GarmentType,
    updatedAt: DEMO_STAMP,
  })),
  // Os outros cinco tipos entram sem linha: ver o comentario do topo.
];

/**
 * O log de Inteligencia de Tamanho comeca VAZIO.
 *
 * O print adm-036 mostra exatamente isso — cabecalho com as cinco colunas e,
 * no corpo, `Nenhum dado de aprendizado registrado ainda.` Nao inventei
 * linhas de aprendizado para a tabela parecer cheia: o sistema aprende com
 * compras e devolucoes reais, e nao ha nenhuma ate o banco existir.
 */
export const DEMO_SIZE_LEARNING: SizeLearningEntry[] = [];

/**
 * Regras por produto ja salvas — mapa por id de produto.
 *
 * VAZIO de proposito. Os prints adm-034 a adm-037 mostram TODAS as linhas com
 * `Modelagem normal`, `Média elasticidade` e a observacao em branco: e o estado
 * inicial, nao o estado salvo. Preencher este mapa com valores iguais ao padrao
 * criaria "regras salvas" que ninguem salvou, e o contador de configurados
 * mentiria dizendo que os 9 produtos ja foram configurados.
 */
export const DEMO_SIZE_RULES = new Map<string, ProductSizeRule>();
