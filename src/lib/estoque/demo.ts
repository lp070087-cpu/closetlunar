/**
 * Dados demonstrativos de Estoque.
 *
 * ESTE ARQUIVO NAO E UM SEGUNDO CADASTRO DE PRODUTOS, e essa e a decisao mais
 * importante dele. O dono do produto, do preco e da QUANTIDADE e `lib/produtos`
 * (`Product.stock` e `ProductColor.stock`). Escrever aqui uma segunda copia dos
 * numeros — `top` 8, `Kit Nike` 1, `Legging` 40 — criaria duas verdades sobre a
 * mesma peca: bastaria mudar o estoque em Produtos para o Estoque passar a
 * mostrar outro numero, e ninguem saberia qual dos dois vale.
 *
 * Entao aqui ficam SO as coisas que o print de Estoque tem e Produtos nao tem:
 *
 *   1. os dois lancamentos do Historico de Movimentacoes (adm-029);
 *   2. as duas correcoes que a tabela de Estoque imprime e o cadastro nao —
 *      e que estao declaradas como DIVERGENCIA, nao como dado.
 *
 * A ponte Produto -> linha de estoque mora em `data.ts`, que e quem importa
 * `@/lib/produtos/demo`. A regra e a mesma de Tamanhos: o join entre modulos
 * fica na camada de dados, nunca numa tela.
 */

import type { ReasonOption, StockMovement } from './types';

/**
 * Os lancamentos do historico, transcritos do rodape do adm-029.
 *
 * SAO DUAS LINHAS IDENTICAS no print, e isso NAO e erro de transcricao: mesma
 * data, mesma hora, mesmo produto, mesma quantidade. E o que o print mostra, e
 * copiar o print e o trabalho — "consertar" a duplicata inventando um horario
 * diferente seria fabricar o dado mais facil de conferir de todos.
 *
 * A data `12/06/2026` tambem e a data de criacao de `top` em `lib/produtos`.
 * Foi mantida porque e o que a referencia mostra.
 */
export const DEMO_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mv-01',
    at: '2026-06-12T02:33:00',
    productId: 'p-03',
    productName: 'Kit Nike',
    // COR e TAM. aparecem como `—` no print: o ajuste foi no estoque geral.
    colorName: null,
    sizeLabel: null,
    // `±1` — o glifo de ajuste, e nao `+1`. Ver `DeltaGlyph` em `types.ts`.
    delta: { sign: 'adjust', magnitude: 1 },
    type: 'ajuste',
    responsible: 'lp070087@gmail.com',
  },
  {
    id: 'mv-02',
    at: '2026-06-12T02:33:00',
    productId: 'p-03',
    productName: 'Kit Nike',
    colorName: null,
    sizeLabel: null,
    delta: { sign: 'adjust', magnitude: 1 },
    type: 'ajuste',
    responsible: 'lp070087@gmail.com',
  },
];

/**
 * QUEM REGISTROU, no historico.
 *
 * O print mostra o e-mail do administrador (`lp070087@gmail.com`) — o mesmo do
 * perfil no topo de todas as telas. Nao ha sessao ligada nesta fase, entao a
 * tela nao tem de onde tirar o nome de quem esta usando. A constante existe
 * para o valor ter UM dono so: quando a sessao entrar, e este ponto que passa a
 * ler o usuario logado, e nao cada componente por conta propria.
 */
export const DEMO_RESPONSIBLE = 'lp070087@gmail.com';

/**
 * Os motivos oferecidos pelo campo `MOTIVO` do ajuste.
 *
 * Os seis depois de `Todos` sao os chips do print adm-029 — e o campo MOTIVO so
 * era visivel na versao anterior por engano; o `Ajuste` do print e a coluna
 * TIPO. Os seis viraram, portanto, o proprio tipo da movimentacao.
 *
 * `used` diz se aquele motivo ja aparece no historico. Hoje so `ajuste` esta em
 * uso, e a tela desenha um marcador so nele — em vez de marcar os seis como
 * "usados", que faria a lista parecer recheada de historico que nao existe.
 */
export const DEMO_REASON_OPTIONS: ReasonOption[] = [
  { value: 'entrada', label: 'Entrada', used: false },
  { value: 'saida', label: 'Saída', used: false },
  { value: 'venda', label: 'Venda', used: false },
  { value: 'reposicao', label: 'Reposição', used: false },
  { value: 'devolucao', label: 'Devolução', used: false },
  { value: 'ajuste', label: 'Ajuste', used: true },
];

/** O motivo que vem selecionado no ajuste: o unico que o print registra. */
export const DEFAULT_REASON: ReasonOption = DEMO_REASON_OPTIONS[5];

/**
 * ============================ DIVERGENCIA ============================
 *
 * A tabela de Estoque (adm-028/adm-029) mostra DOIS dados que o cadastro de
 * Produtos (adm-025) NAO tem. Os dois estao aqui porque sao do print de
 * Estoque, e os dois sao DECLARADOS — nenhum deles foi escrito dentro de
 * `lib/produtos`.
 *
 * (1) `Conjunto Glow Nude` — 20 unidades.
 *
 *     O print de Estoque lista DEZ produtos. O de Produtos (adm-025) mostra
 *     NOVE, e `lib/produtos/demo.ts` tambem tem nove. E a MESMA divergencia ja
 *     registrada na Fase 4 (Tamanhos, adm-034), agora pela terceira referencia.
 *     Tres prints contra um.
 *
 *     A decisao NAO mudou: quem e dono da lista de produtos e `lib/produtos`, e
 *     Estoque nao cria produto. Entao esta linha entra como SOBREPOSICAO DE
 *     ESTOQUE — ela existe para a tabela de Estoque conferir com o print, e nao
 *     finge ser um produto cadastrado. Quando a fonte definitiva existir (banco),
 *     ou o produto entra em Produtos e esta constante some, ou ele nao existe e
 *     a linha some junto.
 *
 * (2) As pastilhas de cor de `top` (PRETO 5 + ROSA 3) e `Macaquinho` (ROSA 5).
 *
 *     O print de Estoque mostra as duas pecas COM VARIACAO DE COR; o cadastro
 *     de Produtos nao tem cor nenhuma em produto nenhum (o editor de variacoes
 *     so aparece depois que a peca existe — adm-026/027). Aqui vale a mesma
 *     regra: a cor NAO foi escrita em `lib/produtos`, porque isso mudaria o
 *     cadastro para fazer a tela de Estoque parecer certa. Ela entra como
 *     sobreposicao, e o total do produto continua fechando com o print (8 = 5+3).
 *
 * O que NAO foi feito em nenhum dos dois casos: escrever no outro modulo para
 * os prints coincidirem. Divergencia entre referencias se documenta; nao se
 * resolve escolhendo um lado em silencio.
 * ====================================================================
 */

/** A linha de estoque que so o print de Estoque tem. Ver DIVERGENCIA acima. */
export interface StockOverride {
  productId: string;
  name: string;
  /** Quantidade total do produto no print. */
  total: number;
  /** Cores do print. Hex `null` = ponto neutro, como o print desenha. */
  variations: { colorId: string; name: string; hex: string | null; quantity: number }[];
}

export const DEMO_STOCK_OVERRIDES: StockOverride[] = [
  {
    productId: 'p-glow-nude',
    name: 'Conjunto Glow Nude',
    total: 20,
    variations: [],
  },
  {
    productId: 'p-02',
    name: 'Macaquinho',
    total: 5,
    variations: [{ colorId: 'c-rosa', name: 'ROSA', hex: null, quantity: 5 }],
  },
  {
    productId: 'p-01',
    name: 'top',
    total: 8,
    variations: [
      { colorId: 'c-preto', name: 'PRETO', hex: null, quantity: 5 },
      { colorId: 'c-rosa', name: 'ROSA', hex: null, quantity: 3 },
    ],
  },
];

/**
 * A ORDEM DAS LINHAS NA TABELA DE ESTOQUE.
 *
 * Este e o ponto que mais facilmente passa despercebido, e por isso ele esta
 * escrito: a ordem de adm-028/adm-029 NAO e a alfabetica e NAO e a de
 * `lib/produtos`. Comparando as tres:
 *
 *   print adm-028/029   Top Essential, Conjunto Glow Nude, Kit Nike, Legging,
 *                       Short, Cropped, Jaqueta, Macaquinho costas nuas,
 *                       Macaquinho, top
 *
 *   `lib/produtos`      top, Macaquinho, Kit Nike, Legging, Short,
 *                       Top Essential, Jaqueta, Macaquinho costas nuas, Cropped
 *
 *   alfabetica          Conjunto Glow Nude, Cropped, Jaqueta, Kit Nike,
 *                       Legging, Macaquinho, Macaquinho costas nuas, Short,
 *                       Top Essential, top
 *
 * Nenhuma das duas coincide com o print. Reproduzir a ordem de Produtos aqui
 * (como Tamanhos fez de proposito, porque LA a ordem era a do print) mostraria
 * `top` em primeiro — exatamente o contrario. Por isso a ordem e uma LISTA
 * EXPLICITA dos ids, transcrita do print, e nao um `sort()`.
 *
 * IDs fora da lista vao para o fim, em ordem alfabetica: e o que garante que um
 * produto novo (que o print nao tinha como mostrar) apareca na tela em vez de
 * sumir. Ver `orderForStock` em `metrics.ts`.
 */
export const PRINT_ROW_ORDER: string[] = [
  'p-06', // Top Essential Sustentação    (35)
  'p-glow-nude', // Conjunto Glow Nude     (20)
  'p-03', // Kit Nike                      (1)
  'p-04', // Legging Modeladora Premium    (40)
  'p-05', // Short Fitness Energy          (30)
  'p-09', // Cropped Urban Fit             (28)
  'p-07', // Jaqueta Corta Vento Fit       (22)
  'p-08', // Macaquinho costas nuas        (18)
  'p-02', // Macaquinho                    (5)
  'p-01', // top                           (8)
];
