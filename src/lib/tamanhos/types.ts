/**
 * Tipos do dominio de Tamanhos.
 *
 * MESMA REGRA DAS FASES 2 E 3: nada aqui e persistencia. Isto e o CONTRATO que
 * a tela consome hoje e que o Prisma vai satisfazer depois, com nomes de campo
 * em camelCase traduzidos para as colunas snake_case na camada de dados, num
 * unico lugar.
 *
 * O QUE ESTE MODULO E — E O QUE ELE NAO E
 *
 * Os prints adm-032 a adm-037 NAO mostram um cadastro de tamanhos. Nao existe
 * "criar tamanho", "sigla", "ordem", "ativar/desativar" nem "excluir" em
 * nenhum dos seis. O que existe e:
 *
 *   1. Tabela de Medidas  — para cada TIPO DE PECA (top, short, legging,
 *      conjunto, macaquinho, cropped) e cada tamanho (G, GG, M, P, PP), uma
 *      faixa min/max de busto, cintura, quadril, altura e peso. As celulas sao
 *      editaveis e salvam ao sair do campo.
 *   2. Regras por Produto — por produto: modelagem, elasticidade e observacoes.
 *   3. Inteligencia de Tamanho — log de aprendizado, com estado vazio.
 *
 * Entao o modelo abaixo espelha isso e nao inventa um CRUD de tamanho. As
 * "linhas" da matriz (G, GG, M, P, PP) sao valores de medida, e nao registros
 * que alguem cria e apaga: o tamanho de uma peca existe porque a loja vende
 * aquele tamanho, nao porque alguem o cadastrou numa lista.
 */

/**
 * Tipo de peca — o filtro que troca a matriz inteira.
 *
 * As seis opcoes sao EXATAMENTE as do print adm-033 e as mesmas da referencia
 * do projeto (`const garments = ["top","short","legging","conjunto",
 * "macaquinho","cropped"]`), na mesma ordem. Nao acrescentei nenhuma.
 */
export type GarmentType =
  | 'top'
  | 'short'
  | 'legging'
  | 'conjunto'
  | 'macaquinho'
  | 'cropped';

/**
 * Uma faixa de medida (minimo e maximo), em centimetros ou quilos.
 *
 * `null` significa "ainda nao preenchido", e NAO zero: um busto minimo de 0 cm
 * nao existe, mas um campo em branco existe — e o print mostra celulas vazias
 * em varios lugares. Essa distincao e a mesma dos precos do produto.
 */
export interface MeasurementRange {
  min: number | null;
  max: number | null;
}

/**
 * Uma linha da Tabela de Medidas: um tamanho e as cinco medidas dele.
 *
 * A ordem das linhas e a ordem do print — G, GG, M, P, PP — e e alfabetica em
 * pt-BR, o que explica por que G vem antes de GG e de M. Ela mora em
 * `metrics.ts`, num unico lugar, porque nao e a ordem de criacao de nada: e a
 * ordem de exibicao de cinco valores fixos.
 */
export interface SizeRow {
  id: string;
  /** Rotulo exibido: `G`, `GG`, `M`, `P`, `PP`. */
  sizeLabel: string;
  bust: MeasurementRange;
  waist: MeasurementRange;
  hip: MeasurementRange;
  /** Altura em cm. */
  height: MeasurementRange;
  /** Peso em kg. */
  weight: MeasurementRange;
  /** A que tipo de peca esta linha pertence. */
  garmentType: GarmentType;
  updatedAt: string;
}

/**
 * Uma celula editavel enderecada: qual linha, qual medida, qual ponta.
 *
 * O print tem 5 linhas x 5 medidas x 2 pontas = 50 campos por tipo de peca.
 * Enderecar a celula por estes tres valores (em vez de mandar a linha inteira)
 * e o que permite gravar SO o campo que mudou — que e o que o rodape do print
 * promete ("alteracoes sao salvas automaticamente ao sair do campo").
 */
export type MeasurementKey = 'bust' | 'waist' | 'hip' | 'height' | 'weight';
export type RangeEnd = 'min' | 'max';

export interface MeasurementAddress {
  rowId: string;
  key: MeasurementKey;
  end: RangeEnd;
}

/** Modelagem da peca no provador virtual. Opcoes do print adm-037. */
export type Modeling = 'pequena' | 'normal' | 'grande';

/** Elasticidade do tecido. Opcoes do print adm-035. */
export type Elasticity = 'baixa' | 'media' | 'alta';

/** Regras de uma peca no provador — o segundo bloco da tela. */
export interface ProductSizeRule {
  /** Id do produto; e a chave do upsert, como na referencia. */
  productId: string;
  modeling: Modeling;
  elasticity: Elasticity;
  /** Texto livre. O print sugere `Ex: Tecido firme, nao estica`. */
  notes: string;
  updatedAt: string | null;
}

/**
 * Uma linha do log de Inteligencia de Tamanho.
 *
 * O print adm-036/037 mostra este bloco VAZIO ("Nenhum dado de aprendizado
 * registrado ainda") e o cabecalho anuncia as colunas Data, Categoria, Produto,
 * Tamanho e Status/Feedback. O tipo existe para que a tabela tenha o que
 * desenhar quando houver dado — mas hoje o demo entrega lista vazia, fiel ao
 * print, e nao um log inventado.
 */
export interface SizeLearningEntry {
  id: string;
  date: string;
  categoryName: string;
  productName: string;
  /** Tamanho comprado/devolvido, ex.: `M`. */
  sizeLabel: string;
  feedback: string;
}

/** Um produto com a sua regra ja resolvida — o que a linha da tela recebe. */
export interface ProductRuleRow {
  productId: string;
  productName: string;
  rule: ProductSizeRule;
}
