/**
 * Tipos do modulo Carrinho Abandonado.
 *
 * DESENHADOS A PARTIR DE adm-008 e adm-009 — e nao de um sistema de recuperacao
 * de carrinho generico.
 *
 * O QUE OS PRINTS SUSTENTAM
 *
 *   adm-008  os QUATRO KPIs (Total Abandonados, Recuperados, Perdidos, Valor
 *            Recuperado) e a tabela `Historico de Carrinhos`, de cinco colunas
 *            (CLIENTE / EMAIL · VALOR · NOTIFICACOES · ULTIMO ENVIO · STATUS)
 *   adm-009  a mesma tela rolada: o painel `Configuracoes` inteiro — os quatro
 *            disparos com os textos ja escritos, o campo de cupom, o incentivo
 *            de frete gratis e o botao `SALVAR CONFIGURACOES`
 *
 * ESTE MODULO E O DONO DOS CARRINHOS.
 *
 * O CRM le `abandoned_carts` para montar os leads (adm-010 mostra um lead com
 * esta origem), e o card `Carrinho Abandonado` de adm-011 conta os carrinhos.
 * Ate agora essa lista vivia dentro de `lib/crm/demo.ts`, porque o CRM foi o
 * primeiro a precisar dela. Com esta fase, ela passa a morar AQUI, que e o
 * modulo dela — ver a nota de propriedade em `demo.ts` e a ponte em
 * `lib/crm/data.ts`. Nao ha duas listas de carrinhos no projeto.
 *
 * O CARRINHO NAO E UM PEDIDO. Sao tabelas diferentes no original (`carts` x
 * `orders`), e a distincao e real: um carrinho abandonado nunca virou pedido —
 * e justamente por isso que existe uma tela para ele. Nao ha `Order` aqui, e
 * nenhum arquivo de Pedidos e tocado por este modulo.
 */

/**
 * O estado de um carrinho.
 *
 * TRES VALORES, e sao os do original — que os escreve em ingles no banco
 * (`recovered` / `lost`) e em portugues na tela. O codigo fica em portugues
 * aqui porque e o que a INTERFACE mostra; a traducao para os valores do banco
 * acontece na camada de dados, quando o Neon entrar.
 */
export type CartStatus = 'pendente' | 'recuperado' | 'perdido';

/**
 * Um carrinho abandonado.
 *
 * O QUE NAO ESTA AQUI, E POR QUE
 *
 * `contactPhone` NAO existe. A tentacao e grande — a referência tem WhatsApp na
 * tela de leads do CRM e seria natural supor um telefone aqui. Mas o print
 * adm-008 nao tem coluna de telefone, o original nao mostra telefone nesta
 * tabela, e o `select("*")` dele nao prova campo nenhum. Um dado que nenhuma
 * referencia exibe nao entra no tipo so para "completar".
 *
 * `createdAt` ESTA AQUI E NAO APARECE NA TELA. A tabela de adm-008 nao tem
 * coluna de data — mas a ORDEM das linhas e a unica pista de que ela existe:
 * o print mostra `R$ 0,00`, `R$ 537,00`, `R$ 358,00`, que nao e ordem de valor
 * nem de e-mail. E a ordem de data decrescente, que e exatamente como o
 * original consulta (`order("created_at", { ascending: false })`). Guardar o
 * campo e o que permite reproduzir a ordem do print sem chumbar as linhas.
 */
export interface AbandonedCart {
  id: string;
  /** Nome de contato. `null` quando o carrinho nao foi identificado. */
  contactName: string | null;
  /** `null` = a coluna CLIENTE / EMAIL mostra `Nao identificado`. */
  contactEmail: string | null;
  /** Valor dos itens no momento do abandono. E a coluna VALOR. */
  subtotal: number;
  /** Quantos avisos ja foram disparados. E a coluna NOTIFICACOES. */
  notificationCount: number;
  /** ISO 8601 do ultimo disparo, ou `null` (a coluna mostra `—`). */
  lastNotifiedAt: string | null;
  /** ISO 8601 do abandono. Ordena a tabela, mas NAO e coluna. */
  createdAt: string;
  status: CartStatus;
  /**
   * Quanto voltou, quando o carrinho foi recuperado.
   *
   * E o que soma o KPI `Valor Recuperado`. O print mostra `R$ 0,00` porque nao
   * ha nenhum carrinho recuperado — nao porque o campo nao exista. O original
   * le `recovery_value` e soma sobre os recuperados.
   */
  recoveryValue: number | null;
}

/**
 * As quatro contagens do topo de adm-008.
 *
 * `recoveredValue` e DINHEIRO e nao quantidade — e o unico dos quatro que nao e
 * um `length`. Fica junto com os outros porque e assim que o print os apresenta:
 * quatro cartoes lado a lado, na mesma fileira.
 */
export interface CartStats {
  total: number;
  recovered: number;
  lost: number;
  recoveredValue: number;
}

/**
 * Um dos quatro disparos automaticos.
 *
 * Na tela sao quatro blocos iguais, em ordem crescente de tempo (1, 6, 24 e 48
 * horas), cada um com um interruptor e um texto. Estao modelados como LISTA, e
 * nao como quatro campos soltos, porque sao a mesma coisa repetida quatro vezes
 * — e porque a bancada precisa poder varrer os quatro.
 */
export interface CartDelay {
  /** Identificador estavel: `1h`, `6h`, `24h`, `48h`. */
  key: string;
  /** O rotulo do bloco, em caixa alta no print: `1 HORA`, `6 HORAS`, ... */
  label: string;
  active: boolean;
  /** O texto que a cliente recebe. */
  template: string;
}

/**
 * As configuracoes inteiras de adm-009.
 *
 * Os quatro disparos vivem em `delays` para a tela e a bancada poderem
 * percorrer; o resto sao campos proprios.
 */
export interface CartConfig {
  /** O interruptor `Ativo` do canto do painel. */
  isActive: boolean;
  /** Os quatro disparos, do mais curto ao mais longo. */
  delays: CartDelay[];
  /** `CUPOM AUTOMATICO` — o codigo enviado junto. Vazio no print. */
  couponToSend: string;
  /** `Incentivo de Frete Gratis`. Desmarcado no print. */
  freeShippingIncentive: boolean;
}

/**
 * O que a tela recebe pronto da camada de dados.
 *
 * Os carrinhos, os indicadores e a configuracao vao juntos: os tres KPIs saem
 * da MESMA lista que a tabela desenha. Separar em duas chamadas faria os cartoes
 * do topo contarem uma lista e a tabela mostrar outra no dia em que o dado
 * mudasse no meio.
 */
export interface CartDataset {
  carts: AbandonedCart[];
  stats: CartStats;
  config: CartConfig;
}
