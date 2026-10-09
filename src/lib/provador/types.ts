/**
 * Tipos do cluster `Provador e IA` — Avatar Virtual, Provador Virtual e IA de Looks.
 *
 * ================== POR QUE UM SO DIRETORIO PARA TRES TELAS ==================
 *
 * As tres rotas (`/admin/avatar-virtual`, `/admin/provador-virtual`,
 * `/admin/ia-looks`) compartilham o MESMO dado de duas formas, e as duas estao no
 * material:
 *
 *   1. A LISTA DE PRODUTOS. O seletor de produto aparece identico no segundo
 *      bloco de Avatar Virtual (adm-041/042) e no primeiro de Provador Virtual
 *      (adm-043/046): mesma busca (`Buscar produto...`), mesmos nove produtos,
 *      mesma ordem alfabetica. E o mesmo componente, e nao duas listas parecidas.
 *
 *   2. AS CATEGORIAS DE PECA. `CATEGORIA DA PEÇA` (adm-042/046) e `PRODUTO BASE`
 *      (adm-048/049) sao o mesmo campo: a categoria da peca dentro do provador.
 *
 * Um diretorio por tela obrigaria a duplicar esses dois dados — e duas copias da
 * mesma lista divergem. Ver `demo.ts` para a regra de quem e dono de cada um.
 */

/* --------------------------------------------------------------- Avatar */

/**
 * AS CINCO IMAGENS DO AVATAR — adm-038/039.
 *
 * A ordem e a do print, de cima para baixo. Ela NAO e alfabetica, e nao e a ordem
 * das vistas (`frente`, `lado direito`, `costas`, `lado esquerdo`, `360`): e a
 * ordem em que as imagens foram cadastradas no painel original, e a tela a
 * reproduz como esta.
 */
export type AvatarSlotKey = 'frente' | 'direita' | 'costas' | 'esquerda' | 'g360';

export interface AvatarSlot {
  key: AvatarSlotKey;
  /** O rotulo em caixa alta do print: `AVATAR FRENTE`, `AVATAR 360°`. */
  label: string;
  /**
   * A URL publica da imagem. `null` = sem imagem cadastrada.
   *
   * O print mostra as cinco preenchidas, e todas apontando para o mesmo bucket
   * (`.../site-content/avatar/...`). Aqui as URLs entram como `null` e o estado
   * na tela e o VAZIO: ver a nota em `demo.ts` sobre o bucket de terceiro.
   */
  url: string | null;
}

/** Uma medida do painel de preview — `BUSTO 88 cm`, `CINTURA 68 cm`. */
export interface PanelMeasure {
  key: 'busto' | 'cintura' | 'quadril';
  label: string;
  value: number;
  /** `cm` no material; o campo existe para a unidade nao ficar presa no rotulo. */
  unit: string;
}

export interface AvatarSettings {
  slots: AvatarSlot[];
  measures: PanelMeasure[];
}

/* ------------------------------------------------------------- Provador */

/** As tres vistas de cada peca no provador — as colunas de adm-042/043/046. */
export type PieceView = 'frente' | 'lado' | 'costas';

export const PIECE_VIEWS: PieceView[] = ['frente', 'lado', 'costas'];

/**
 * A POSICAO DA PECA — o select `POSIÇÃO` de adm-042 e o dropdown de adm-046.
 *
 * As quatro opcoes e a ordem sao do dropdown aberto de adm-046, que e a unica
 * fonte onde elas aparecem juntas: `Automática`, `Superior`, `Inferior`, `Corpo
 * inteiro`. `Automática` e o valor de repouso (o print mostra ela selecionada).
 *
 * Os VALORES sao slugs e os ROTULOS sao o texto do print — a mesma separacao dos
 * status de pedido. O banco guarda o slug.
 */
export type PiecePosition = 'automatica' | 'superior' | 'inferior' | 'corpo-inteiro';

export interface PiecePositionOption {
  value: PiecePosition;
  label: string;
}

/**
 * A CONFIGURACAO DE UMA PECA NO PROVADOR.
 *
 * `views` guarda a URL de cada vista. String VAZIA = `IMAGEM DO PROVADOR
 * PENDENTE`, que e o estado do print — e um estado legitimo, nao um erro: a dica
 * do rodape diz que "peças sem imagem não quebram o avatar".
 */
export interface PieceConfig {
  productId: string;
  /** O `CATEGORIA DA PEÇA` do print — o id de `lib/produtos` (`cat-tops`). */
  categoryId: string;
  /** O `CAMADA (ORDEM)` — numero, nao texto. `3` no print. */
  layer: number;
  position: PiecePosition;
  views: Record<PieceView, string>;
}

/**
 * OS VALORES DE REPOUSO DE UMA PECA — SEM `productId` E SEM `categoryId`.
 *
 * ================== POR QUE ESTES DOIS CAMPOS FICAM DE FORA, E NAO E DETALHE ==================
 *
 * Os dois vem do PRODUTO (`product.id`, `product.categoryId`), nunca de um valor
 * de repouso. Deixa-los entrar aqui foi, por um momento, um defeito de verdade: o
 * componente montava a config espalhando o repouso DEPOIS do produto, e o
 * `cat-tops` do demonstrativo sobrescrevia a categoria real — toda peca nascia
 * como top. O `tsc` pegou (TS2783, chave duplicada), mas a correcao certa nao era
 * so trocar a ordem: era TIRAR os dois campos daqui, para que o tipo IMPECA a
 * escrita errada em vez de depender de alguem lembrar da ordem.
 *
 * Com `Omit`, escrever `categoryId` no repouso nao compila. O `DEMO_PIECE` deste
 * modulo passou a ter exatamente este tipo depois do episodio.
 */
export type PieceDefaults = Omit<PieceConfig, 'productId' | 'categoryId'>;

/* ------------------------------------------------------------- IA de Looks */

/**
 * UMA SUGESTAO MANUAL — uma linha da tabela de adm-047.
 *
 * A tabela do print esta VAZIA (so os quatro cabecalhos, sem mensagem de vazio),
 * e por isso nao ha uma linha transcrita. O TIPO existe; o dado e `[]`.
 */
export interface ManualSuggestion {
  id: string;
  /** `PRODUTO BASE` — o id do produto de partida. */
  baseId: string;
  /** `SUGERIDO` — o id do produto sugerido. */
  targetId: string;
  /** `PRIORIDADE` — 0 a 100. O campo do formulario nasce em `0`. */
  priority: number;
}

/**
 * AS DUAS PRIORIDADES DA CONSULTORA — adm-050.
 *
 * `Priorizar mesma coleção` e `Harmonia de Cores` chegam MARCADAS no print. O
 * nome dos campos aqui e descritivo; os rotulos e as descricoes do print vivem no
 * componente, onde sao texto de tela.
 */
export interface AiSettings {
  sameCollection: boolean;
  colorHarmony: boolean;
  /** `Máximo de sugestões por seção` — `8` no print. */
  maxSuggestions: number;
}

/* --------------------------------------------------------------- Insights */

/**
 * OS NUMEROS DE USO — os cards de adm-044 (`Looks Salvos`) e adm-045
 * (`Analytics`).
 *
 * Todas as telas do material estao VAZIAS (todos os cards em `0`): a loja do
 * print nao tinha looks criados ainda. O tipo existe para a tela ter o que
 * desenhar quando o Neon entrar; hoje o dado e zero.
 */
export interface ProvadorUsage {
  looksCreated: number;
  uniqueCombos: number;
  cartAdds: number;
  productsUsed: number;
  clientsWhoSaved: number;
  shares: number;
}
