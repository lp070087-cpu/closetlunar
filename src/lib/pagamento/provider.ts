/**
 * O DOMINIO DE PAGAMENTO — a abstracao, e SO a abstracao.
 *
 * ================== NAO HA GATEWAY, E NAO E POR FALTA DE TRABALHO ==================
 *
 * A decisao do proprietario e explicita: a forma de pagamento ainda sera
 * escolhida. Entao **nenhum gateway concreto e implementado** — nao ha Stripe,
 * Mercado Pago, Asaas, PagSeguro nem Pagar.me, nem SDK instalado, nem chave
 * ficticia.
 *
 * ================== POR QUE AINDA ASSIM EXISTE UM ARQUIVO ==================
 *
 * Porque o PEDIDO nao pode depender do gateway que vai ser escolhido. A
 * alternativa — o pedido nascer com um campo `mercadoPagoId` — obrigaria a mexer
 * no pedido quando a escolha sair, e mexer no pedido depois de ele ja ter linhas
 * no banco e a pior hora para fazer isso.
 *
 * O que existe aqui e o MINIMO para que o pedido seja neutro:
 *
 *   1. os ESTADOS de pagamento, que ja sao do dominio (o `OrderPayment` original
 *      tem `method` e os valores; o que faltava era o ESTADO do pagamento);
 *   2. a FORMA de um provider (a interface), sem nenhuma implementacao;
 *   3. a recusa explicita, que e o que o sistema usa HOJE.
 *
 * **Isto NAO e overengineering:** nao ha fabrica, nao ha registro de providers,
 * nao ha injecao de dependencia, nao ha abstracao de abstracao. E uma interface
 * de quatro campos e um estado que faltava no pedido.
 *
 * ================== O QUE O SISTEMA FAZ HOJE ==================
 *
 * `providerAtual()` devolve `null`. O checkout **nao simula sucesso**: o pedido
 * nasce com o pagamento `pendente`, e a tela diz que a cobranca entra na
 * integracao. Um `paid` falso seria a mentira que a regra de honestidade proibe
 * — e o pior tipo, porque pareceria uma venda.
 */

import type { OrderStatus } from '@/lib/pedidos/types';

/**
 * O ESTADO do pagamento — NEUTRO, e nao "o estado do gateway X".
 *
 * Os quatro valores sao os que QUALQUER gateway tem: nao comecou, esperando,
 * deu certo, nao deu. Um estado proprio de provider (`pending_pix_expiration`)
 * seria acoplamento disfarcado de vocabulario.
 *
 * `pendente` e o estado em que TODO pedido nasce enquanto nao ha gateway — e o
 * unico que o sistema pode produzir honestamente hoje.
 */
export type EstadoPagamento = 'pendente' | 'processando' | 'pago' | 'recusado';

/** Os metodos que o projeto ja declara (`PaymentMethod` do dominio de pedidos). */
export type MetodoPagamento = 'pix' | 'cartao' | 'boleto';

/**
 * A FORMA de um provider. **Nenhuma implementacao existe.**
 *
 * Um provider real teria que satisfazer isto — e e isso que torna a escolha
 * futura uma troca de arquivo, e nao uma refatoracao do pedido.
 */
export interface PaymentProvider {
  /** Identificador curto, ex.: o nome do gateway. Vazio enquanto nao houver. */
  readonly nome: string;
  /**
   * Cria a cobranca e devolve a referencia externa + para onde mandar a pessoa.
   * `externalId` e o que o pedido guarda — e ele e GENERICO de proposito: nao e
   * `mercadoPagoPreferenceId`.
   */
  criarCobranca(entrada: {
    pedidoId: string;
    valor: number;
    metodo: MetodoPagamento;
    descricao: string;
  }): Promise<{ externalId: string; urlPagamento?: string }>;
  /** Consulta o estado ATUAL — o `polling` que a tela de pedido confirmado faz. */
  consultarCobranca(externalId: string): Promise<EstadoPagamento>;
}

/**
 * O provider ativo. **`null` — e este e o estado correto hoje.**
 *
 * Quando o proprietario escolher o gateway, esta funcao passa a devolver a
 * implementacao, e nenhum outro arquivo precisa mudar: o pedido ja guarda um
 * `externalId` generico e ja tem os quatro estados.
 */
export function providerAtual(): PaymentProvider | null {
  return null;
}

/** Ha gateway configurado? — o que as telas usam para decidir o texto. */
export function temGateway(): boolean {
  return providerAtual() !== null;
}

/**
 * A frase unica sobre o estado do pagamento.
 *
 * Ela existe UMA vez para que o checkout, o pedido confirmado e o painel do
 * admin digam a MESMA coisa. Tres redacoes diferentes do mesmo aviso fariam a
 * cliente achar que sao tres problemas.
 */
export const AVISO_GATEWAY = 'O pagamento entra na fase de integração — o gateway ainda não foi definido.';

/** O rotulo curto, para o status do projeto. */
export const ESTADO_PAGAMENTO_PROJETO = 'PREPARADO — GATEWAY A DEFINIR PELO PROPRIETÁRIO';

/**
 * O estado do PEDIDO a partir do estado do PAGAMENTO.
 *
 * Enquanto nao ha gateway, a unica transicao possivel e `pendente` -> pedido
 * `novo`: o pedido existe, foi registrado, e NAO esta pago. O `pago` do dominio
 * do pedido so e alcancavel quando um provider confirmar — e nao ha provider.
 *
 * Esta funcao e o que impede o caminho contrario: alguem marcar um pedido como
 * `pago` a mao. Ela devolve `novo` para tudo menos `pago`, e o unico jeito de
 * chegar a `pago` e o gateway dizer.
 */
export function statusPedidoPara(estado: EstadoPagamento): OrderStatus {
  switch (estado) {
    case 'pago':
      return 'pago';
    case 'recusado':
      return 'cancelado';
    case 'processando':
    case 'pendente':
    default:
      return 'novo';
  }
}

/**
 * O pedido pode ser criado?
 *
 * **Sim, sempre.** O pedido nao depende de gateway: ele e o REGISTRO de uma
 * compra, e o pagamento e um estado dele. Exigir um gateway para criar o pedido
 * faria a loja parar de funcionar ate a escolha sair — e o comando diz
 * explicitamente que isso "NAO deve impedir pedidos em estado apropriado".
 */
export function podeCriarPedido(): boolean {
  return true;
}
