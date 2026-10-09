/**
 * Tipos do dominio de Pedidos.
 *
 * DESENHADOS A PARTIR DE adm-003 E adm-004 — e de mais nada.
 *
 * O mapa do painel (`MAPA-ADMIN.md`) reserva TRES prints para Pedidos: adm-003
 * e adm-004, que existem e foram lidos, e um terceiro — o da ACAO — que nao
 * esta em lugar nenhum. O placeholder antigo desta rota anunciava
 * "adm-003 a adm-008" e listava cinco blocos; seis prints para dois. A lista
 * real esta no doc da pagina, e aqui ficam so os tipos que esses dois prints
 * sustentam.
 *
 * ================== A DISTINCAO QUE ESTA TELA INTEIRA DEPENDE ==================
 *
 * `status` E `shippingStatus` SAO DOIS CAMPOS DIFERENTES. Confundi-los e o
 * defeito mais provavel desta tela, e ele JA EXISTE em `lib/mock.ts` — o
 * `DEMO_ORDERS` de la grava `status: 'Aguardando postagem'`, que e o texto do
 * campo ERRADO. Ver a nota nesse arquivo.
 *
 * A prova esta no proprio print adm-003, no MESMO cartao, a duas linhas de
 * distancia:
 *
 *   Mariana · 81994608572
 *   16/06/2026, 14:56:54
 *   Transp.: Correios  Status: Aguardando postagem      <- shippingStatus
 *                                            R$ 506,95 • novo   <- status
 *
 * O canto direito diz `novo`; a linha do meio diz `Status: Aguardando postagem`.
 * Um e o estado do PEDIDO, o outro e o estado da POSTAGEM, e o rotulo `Status:`
 * do print pertence ao segundo. Por isso sao dois tipos, e nao um.
 *
 * ===============================================================================
 */

/**
 * O estado do PEDIDO — o `• novo` do canto direito do cartao (adm-003).
 *
 * O VOCABULARIO. O unico valor que um print do painel mostra e `novo`. A lista
 * completa existe em `conta.pedidos.tsx` do projeto original (a area da
 * cliente), que e a UNICA fonte em que os seis valores aparecem juntos:
 *
 *   novo · pago · separacao · enviado · entregue · cancelado
 *
 * O mapa do painel registra que esse conjunto NAO estava conciliado: o dashboard
 * pinta `#FF3048C9` como `NOVO`, e `Meus Pedidos` pinta o MESMO `novo` como
 * `AGUARDANDO PAGAMENTO` — dois rotulos, um estado. A divergencia continua em
 * aberto (ver `demo.ts`), e por isso o tipo guarda o CODIGO (`novo`) e nao o
 * rotulo: o codigo e o que as duas referencias concordam em ter.
 */
export type OrderStatus = 'novo' | 'pago' | 'separacao' | 'enviado' | 'entregue' | 'cancelado';

/**
 * O estado da POSTAGEM — o `Status: Aguardando postagem` da linha do meio.
 *
 * Vocabulario diferente do anterior, e essa e a questao: o print usa "postagem"
 * (o ato de despachar), nao "entrega". O valor do print e exatamente um:
 * `Aguardando postagem`, e ele e o que o checkout grava quando a cliente escolhe
 * uma transportadora (`delivery_status: "Aguardando postagem"`).
 *
 * `null` = o pedido NAO tem postagem. E o caso dos tres cartoes do `lucas` em
 * adm-003, que nao mostram a linha `Transp./Status` — enquanto os dois do topo
 * mostram. A tela desenha a linha so quando ha o que mostrar, e e assim que ela
 * reproduz a diferenca do print, em vez de imprimir `Status: —`.
 */
export type ShippingStatus =
  | 'aguardando_postagem'
  | 'postado'
  | 'em_transito'
  | 'saiu_para_entrega'
  | 'entregue'
  | 'extraviado'
  | 'devolvido';

/**
 * Como o pedido foi pago.
 *
 * Os valores sao os do `checkout.tsx` do projeto original. NENHUM PRINT DO
 * PAINEL MOSTRA PAGAMENTO — nem na lista nem na tabela —, entao este campo nao
 * aparece na tela. Ele existe porque faz parte do modelo que a fase pediu para
 * preparar (Pedido -> Pagamento), e porque uma tabela de pedidos sem forma de
 * pagamento nao serve para operar. Fica aqui, sem interface que o mostre.
 */
export type PaymentMethod = 'pix' | 'cartao' | 'boleto';

/**
 * De quem e a entrega.
 *
 * `propria` = Entrega Propria (o proprio painel tem uma tela para configura-la,
 * adm-075 em diante). `transportadora` = Melhor Envio e afins, que e o caminho
 * que grava o `Aguardando postagem` do print. O campo vem do `source` que o
 * checkout guarda no formato escolhido.
 */
export type ShippingKind = 'propria' | 'transportadora';

/**
 * UM ITEM DO PEDIDO — a linha `1x Jaqueta Corta Vento Fit (M/Preto) — R$ 179,90`.
 *
 * O print mostra DUAS FORMAS de escrever uma linha, e a diferenca esta na COR:
 *
 *   com cor     `1x Jaqueta Corta Vento Fit (M/Preto) — R$ 179,90`
 *   sem cor     `1x top (M/Único) — R$ 179,00`
 *
 * `Unico` no lugar da cor nao e um acidente de transcricao: e o que o projeto
 * original escreve quando a peca nao tem variacao (`color ?? "Unico"` no
 * carrinho, conforme o proprio codigo). Entao `color` aqui e string, e `Unico`
 * e um valor de verdade — nao `null` com a tela inventando o texto.
 *
 * `size` e `color` NAO sao id de variacao: sao o que a cliente escolheu, e o
 * pedido precisa guardar isso mesmo que a variacao mude depois. E o mesmo
 * principio de `Product.sizes` em Produtos: o pedido registra o que foi
 * vendido, nao um ponteiro para o que existe hoje.
 */
export interface OrderItem {
  id: string;
  /** Id do produto em `lib/produtos`. `null` = a peca saiu do catalogo. */
  productId: string | null;
  /** Nome do produto NO MOMENTO da venda. */
  productName: string;
  /** Tamanho vendido, ex.: `M`. */
  size: string;
  /** COR vendida, ou `Unico` quando a peca nao tem cor. Nunca `null`. */
  color: string;
  quantity: number;
  /** Preco unitario no momento da venda — nao o preco de hoje. */
  unitPrice: number;
}

/**
 * O ENDERECO DE ENTREGA de um pedido.
 *
 * NAO APARECE EM PRINT NENHUM desta tela: nem adm-003 nem adm-004 mostram
 * endereco. Ele esta aqui porque existe na origem (`orders.address`, `cep`,
 * `city`, `state`) e porque o proprio projeto original diz onde ele seria usado:
 * o texto do botao de imprimir e "imprimir os dados de envio".
 *
 * Fica como DADO, sem tela. Quando existir o print da acao (impressao ou
 * detalhe), este e o objeto que ela vai desenhar — e ate la ninguem inventa um
 * formato de endereco para preencher uma tela que nao foi projetada.
 */
export interface ShippingAddress {
  street: string;
  cep: string;
  city: string;
  state: string;
  complement: string | null;
}

/** COMO FOI PAGO. Ver `PaymentMethod` para por que isto nao esta na tela. */
export interface OrderPayment {
  method: PaymentMethod;
  /** Valor cobrado pelo frete. */
  shippingPrice: number;
  /** Desconto aplicado (cupom, PIX, cashback) sobre o subtotal. */
  discount: number;
  /** Codigo do cupom usado, ou `null`. */
  couponCode: string | null;
  subtotal: number;
  total: number;
}

/** COMO VAI SER ENTREGUE. */
export interface OrderShipping {
  kind: ShippingKind;
  /** Transportadora, ex.: `Correios`. `null` = Entrega Propria. */
  carrier: string | null;
  /** Codigo de rastreio, ou `null` — o `sem código` do adm-004. */
  trackingCode: string | null;
  /** Estado da postagem. `null` = o pedido nao tem postagem (os cartoes do `lucas`). */
  status: ShippingStatus | null;
  /**
   * ================== O VALOR CRU DE `shipping_method` ==================
   *
   * E a string que o banco guarda, e ela NAO e `carrier`. O checkout grava um
   * IDENTIFICADOR, e nao um nome de transportadora:
   *
   *   `me:1`                    -> Melhor Envio, servico 1
   *   `own:341d5a3a-8603-...`   -> Entrega Propria, configuracao daquele id
   *
   * Isso e literalmente o que o print `cli-004`/`004649` da area da cliente
   * imprime, e o que a propria tela do original mostra: ela escreve
   * `{o.shipping_method}` na linha do caminhao, sem traduzir.
   *
   * POR QUE ENTROU NO TIPO. O campo ja existia no BANCO (a consulta do original
   * e `select("*")`), mas nao no modelo deste projeto: o admin guardou so `kind`
   * e `carrier`. `kind` sozinho nao reproduz o print — `me:1` e
   * `own:<uuid>` sao AMBOS um caminho, mas o print mostra coisas diferentes nas
   * duas linhas, e a diferenca esta no identificador, nao no tipo.
   *
   * Ele e ADITIVO: nenhuma tela do admin o le, e nenhum campo existente mudou de
   * sentido. Sem ele, a area da cliente teria que guardar isso a parte — e seriam
   * dois modelos para a mesma coluna de `orders`, exatamente o que a Fase 4
   * proibe.
   *
   * `null` = a origem nao guardou o identificador. A tela omite a linha, como ja
   * faz quando `carrier` e `trackingCode` sao nulos.
   */
  shipmentMethod: string | null;
}

/**
 * A CLIENTE do pedido.
 *
 * O telefone aparece colado ao nome no cartao (`Mariana · 81994608572`). O
 * e-mail nao aparece em print nenhum e fica como dado.
 */
export interface OrderCustomer {
  name: string;
  phone: string;
  email: string | null;
}

/**
 * UM PEDIDO.
 *
 * O `code` e o que o adm-004 mostra na coluna PEDIDO: `#ff3048c9` — o id
 * truncado em 8 caracteres com `#` na frente. NAO e um numero amigavel tipo
 * `#1042`; e literalmente um pedaco do id, e por isso as duas linhas daquela
 * tabela parecem codigos de cor. Reproduzir isso e o trabalho; "melhorar" para
 * um contador sequencial seria inventar um campo que o banco nao tem.
 */
export interface Order {
  id: string;
  /** `#` + os 8 primeiros caracteres do id. Ver `buildOrderCode`. */
  code: string;
  customer: OrderCustomer;
  /** ISO 8601 completo. O cartao separa em data e hora. */
  placedAt: string;
  status: OrderStatus;
  items: OrderItem[];
  payment: OrderPayment;
  shipping: OrderShipping;
  address: ShippingAddress;
}

/** As duas abas do titulo (adm-003/004). */
export type OrdersTab = 'todos' | 'rastreamento';
