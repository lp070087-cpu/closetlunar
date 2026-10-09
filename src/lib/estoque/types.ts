/**
 * Tipos do dominio de Estoque.
 *
 * DESENHADOS A PARTIR DOS PRINTS adm-028 e adm-029 — e nao de um ERP.
 * O Estoque da Closet Lunnar tem duas partes, e so duas:
 *
 *   1. a LISTA de estoque por produto (adm-028 + o topo do adm-029);
 *   2. o HISTORICO de movimentacoes (o rodape do adm-029).
 *
 * NAO HA BAIXA DE ESTOQUE, PEDIDO, FORNECEDOR NEM ALMOXARIFADO EM PRINT
 * NENHUM. Por isso nao existe tipo para nada disso aqui.
 *
 * O ESTOQUE EM SI NAO MORA NESTE MODULO. O dono da quantidade e
 * `lib/produtos` (`Product.stock` e `ProductColor.stock`). Este modulo so
 * PROJETA e MOVIMENTA o que Produtos guarda — ver `data.ts` para a ponte.
 *
 * Niveis que os materiais sustentam:
 *
 *   Produto -> Cor -> quantidade          (adm-029: `top` tem PRETO 5 e ROSA 3)
 *
 * Tamanho NAO tem quantidade em print nenhum: `TAM.` aparece na tabela de
 * produtos e no historico, mas SEMPRE com `—`. Por isso nao existe nivel de
 * tamanho no estoque. Ver a divergencia registrada em `demo.ts`.
 *
 * OS PRODUTOS DE DEMONSTRACAO NAO TEM COR GRAVADA. O print adm-029 mostra
 * `top` e `Macaquinho` com pastilhas de cor, mas o cadastro de Produtos
 * (adm-026/027) nao tem nenhum dado de cor para nenhum produto — o editor de
 * variacoes so aparece depois que a peca existe. Entao ha uma divergencia real
 * entre o que Produtos guarda e o que Estoque mostra, e ela esta declarada em
 * `demo.ts` em vez de resolvida por invencao em qualquer um dos dois lados.
 */

/**
 * Tipo de movimentacao do estoque.
 *
 * AS SEIS OPCOES SAO AS DO PRINT adm-029, na ordem em que os chips aparecem,
 * depois de `Todas`: Entrada, Saida, Venda, Reposicao, Devolucao, Ajuste.
 *
 * Sao rotulos de UI e nao um enum de banco: o filtro `Todas` nao e um tipo, e
 * `TipoMovimentacao | 'todas'` no componente.
 */
export type MovementType = 'entrada' | 'saida' | 'venda' | 'reposicao' | 'devolucao' | 'ajuste';

/** Situacao de estoque de um produto, derivada da quantidade. */
export type StockStatus = 'normal' | 'baixo' | 'esgotado';

/**
 * Uma variacao de cor, projetada de `ProductColor`.
 *
 * `hex` e `string | null` de proposito. O print adm-029 desenha o PONTO da
 * pastilha em CINZA NEUTRO tanto em `ROSA` quanto em `PRETO` — ou seja, a
 * referencia nao pinta o ponto com a cor. Como os produtos de demonstracao
 * tambem nao trazem hex nenhum, inventar `#E8D5C4` para o ponto parecer
 * colorido seria fabricar dado. Com `null`, a tela desenha o ponto neutro do
 * print — e um produto que um dia tenha hex real mostra a cor de verdade.
 */
export interface StockVariation {
  /** Id da cor em `lib/produtos` (`ProductColor.id`), ou id da sobreposicao. */
  colorId: string;
  name: string;
  /** Hex do seletor, ou `null` = ponto neutro (o caso do print). */
  hex: string | null;
  /** Quantidade desta cor. Nunca `null` aqui: `null` la significa "usa o geral". */
  quantity: number;
}

/**
 * Uma linha da tabela de estoque.
 *
 * Colunas do print adm-028, na ordem:
 *   PRODUTO · SKU · VARIACOES (COR/TAM) · ESTOQUE TOTAL · ACOES
 *
 * `sku` e `null` porque o print mostra `—` em todas as linhas; nao ha SKU
 * cadastrado. Ver `demo.ts`.
 */
export interface StockRow {
  /** Id do produto em `lib/produtos` (`Product.id`). */
  productId: string;
  name: string;
  /** URL da primeira imagem, para a miniatura de 48px. */
  imageUrl: string | null;
  /** Texto alternativo da imagem. */
  imageAlt: string;
  /** SKU cadastrado, ou `null` (o `—` do print). */
  sku: string | null;
  /** Cores com quantidade. Lista vazia = "Sem variacoes" no print. */
  variations: StockVariation[];
  /** Estoque total — o que aparece na coluna ESTOQUE TOTAL. */
  total: number;
  status: StockStatus;
}

/**
 * Uma linha do Historico de Movimentacoes (rodape do adm-029).
 *
 * Colunas do print, na ordem:
 *   DATA · HORA · PRODUTO · COR · TAM. · QTDE · TIPO · RESPONSAVEL
 *
 * A COLUNA QTDE NAO E UM NUMERO COM SINAL — e o simbolo `±` seguido da
 * magnitude. Li o glifo pixel a pixel: e um `+` com um `-` embaixo, nao um `+`.
 * E o que faz sentido para o unico tipo de movimentacao que o print mostra,
 * `Ajuste`: um ajuste nao tem direcao, ele redefine a quantidade. Por isso a
 * coluna aqui e `DeltaGlyph` — `{ sign, magnitude }` — e nao `delta: number`.
 * Guardar `+1`/`-1` perderia justamente o `±`, e um ajuste viraria uma entrada
 * que ninguem registrou.
 *
 * Se um dia existir uma movimentacao com direcao (uma Venda, por exemplo), ela
 * entra como um quarto `sign` e a interface ja suporta.
 */
export interface DeltaGlyph {
  /** `up` = `+N`, `down` = `−N`, `adjust` = `±N` (o do print). */
  sign: 'up' | 'down' | 'adjust';
  /** Quantidade absoluta. Nunca negativa: o sinal mora em `sign`. */
  magnitude: number;
}

export interface StockMovement {
  id: string;
  /** ISO 8601 completo; a tabela separa em data e hora. */
  at: string;
  productId: string;
  productName: string;
  /** `null` = a coluna COR mostra `—`. */
  colorName: string | null;
  /** `null` = a coluna TAM. mostra `—`. */
  sizeLabel: string | null;
  /** Quantidade com o glifo da coluna QTDE. Ver `DeltaGlyph`. */
  delta: DeltaGlyph;
  type: MovementType;
  /** Quem registrou, ex.: o e-mail do admin. */
  responsible: string;
}

/** Os quatro indicadores do topo do adm-028. */
export interface StockStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  movements: number;
}

/**
 * Um motivo de ajuste ja usado, para o campo `MOTIVO` do ajuste.
 *
 * `used` marca se o motivo ja apareceu no historico. O print so tem um motivo
 * em uso (`Ajuste`), e a lista nao deve fingir que existem varios ja aplicados.
 */
export interface ReasonOption {
  value: string;
  label: string;
  used: boolean;
}

/**
 * O que uma pessoa pediu no formulario de ajuste.
 *
 * Separado de `StockMovement` porque sao coisas diferentes: isto e a INTENCAO
 * ("coloque 12 nesta cor"), e `StockMovement` e a linha ja registrada. A tela
 * aplica a intencao no estado e passa o resultado por `buildMovement`, em
 * `metrics.ts`. O ajuste NAO anota uma quantidade anterior nem um `delta`
 * calculado — ver `demo.ts` para por que.
 */
export interface StockAdjustment {
  productId: string;
  /** `null` = ajuste no estoque geral do produto (o caso de todas as pecas hoje). */
  colorId: string | null;
  /** Nova quantidade daquele alvo. Ajuste define, nao soma. */
  quantity: number;
  /** Motivo escolhido — a coluna TIPO do historico. */
  type: MovementType;
  /** Texto livre do campo `MOTIVO`, complementando o tipo. */
  note: string;
}

/**
 * Escrita.
 *
 * `persisted: false` e o contrato de todo o painel enquanto o Neon nao existe:
 * a tela atualiza o campo para nao parecer travada, mas DIZ que nao gravou.
 * Ver `data.ts`.
 */
export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}
