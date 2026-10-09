/**
 * Camada de dados do CRM.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts`, e nenhum conhece Prisma. Quando o Neon entrar, troca-se o
 * corpo destas duas funcoes; a assinatura e as telas continuam iguais.
 *
 * A PONTE COM PEDIDOS — E O QUE ELA NAO E
 *
 * `listCrmDataset` importa `@/lib/pedidos/data` e AGREGA os pedidos em clientes.
 * E a mesma decisao das fases anteriores: a ponte entre modulos fica na camada de
 * dados, nunca numa tela nem num tipo compartilhado.
 *
 * O QUE NAO FOI FEITO, DE PROPOSITO:
 *
 *   - o CRM NAO importa `lib/pedidos/demo`. Importa `lib/pedidos/DATA`, que e a
 *     porta publica daquele modulo. Se amanha Pedidos trocar de fonte, o CRM
 *     acompanha sem saber que trocou.
 *   - `Order` NAO atravessa a fronteira. `metrics.ts` define
 *     `CustomerOrderRecord` com os sete campos que a agregacao usa, e a traducao
 *     acontece AQUI, em um unico lugar. Assim o CRM nao fica preso ao formato da
 *     tela de Pedidos: mudar `Order` quebra a traducao (e a bancada avisa), mas
 *     nao vaza para o dominio do CRM.
 *   - NENHUM ARQUIVO DE PEDIDOS FOI ALTERADO para atender o CRM. O CRM so le.
 *
 * UNIFICACAO FUTURA NO BANCO (documentada, nao executada)
 *
 * Hoje `CustomerOrderRecord.city` e `state` chegam VAZIOS: `lib/pedidos/demo.ts`
 * nao transcreveu endereco de nenhum dos cinco pedidos, porque o print de Pedidos
 * nao mostra endereco. O original Lovable le `city`/`state` direto da tabela
 * `orders`, e e por isso que o print adm-005 tem `Rio de Janeiro - RJ` onde o
 * nosso dado nao tem nada.
 *
 * No Neon isso se resolve com UMA coluna por campo em `orders` — e nao com uma
 * tabela `customers`, que nao existe em material nenhum. A agregacao por chave
 * continua sendo uma consulta (`GROUP BY` sobre e-mail/telefone), nao um cadastro.
 * Se um dia um cadastro de cliente existir, ele sera do Painel do Cliente, e nao
 * um artefato inventado aqui.
 *
 * O QUE DEPENDERA DO NEON
 *
 *   clientes      `GROUP BY` sobre `orders`
 *   ultima compra `MAX(created_at)` do grupo
 *   leads         uniao de `abandoned_carts` com `leads`
 *   segmentos     contagens derivadas da mesma agregacao, com janela de 30/90
 *                 dias resolvida em SQL (`now() - interval`), e nao em JS
 *   sinais        `wishlist` e `tryon_cart_events` — tabelas de OUTROS modulos
 */

import { listOrders } from '@/lib/pedidos/data';
import type { Order } from '@/lib/pedidos/types';
import {
  DEMO_ABANDONED_CARTS,
  DEMO_FORM_LEADS,
  DEMO_TRYON_EVENT_COUNT,
  DEMO_WISHLIST_COUNT,
} from './demo';
import { buildLeads, buildSegments, groupCustomers, type CustomerOrderRecord } from './metrics';
import type { CrmDataset } from './types';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

/**
 * `Order` -> `CustomerOrderRecord`.
 *
 * A traducao inteira mora aqui — e ela e o UNICO lugar do CRM que sabe a forma
 * de `Order`. Note que o CRM NAO le `order.payment.total` em lugar nenhum: se
 * lesse, o formato de Pedidos vazaria para dentro do CRM e a fronteira nao
 * valeria nada.
 *
 * `Order` e o tipo REAL de `lib/pedidos/types`, e nao uma forma suposta. Ele
 * guarda `placedAt` (nao `createdAt`) e o valor vive em `payment.total` (nao na
 * raiz). Escrever a forma de memoria deu erro de compilacao — e o erro esta
 * certo: e exatamente ele que impede a traducao de silenciosamente ler um campo
 * que nao existe e somar `undefined` em todo mundo.
 */
function toRecord(order: Order): CustomerOrderRecord {
  return {
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    customerPhone: order.customer.phone,
    city: order.address.city,
    state: order.address.state,
    total: order.payment.total,
    createdAt: order.placedAt,
  };
}

/**
 * O conjunto inteiro do CRM: clientes, leads e segmentos.
 *
 * UMA LEITURA SO, e nao quatro. Os clientes e os segmentos saem da MESMA
 * agregacao: `listCrmDataset` precisa ter os clientes em maos para contar
 * `novas`, `recorrentes`, `vip`, `inativas` e `regiao`. Separar em duas funcoes
 * faria a agregacao rodar duas vezes sobre os mesmos pedidos, e abriria a porta
 * para as duas abas contarem coisas diferentes.
 *
 * `now` entra por parametro pelo mesmo motivo de `metrics.ts`: os cortes de 30 e
 * 90 dias precisam ser reproduziveis. Sem argumento, usa o relogio — que e o
 * comportamento da tela.
 */
export async function listCrmDataset(options?: {
  signal?: AbortSignal;
  now?: Date;
}): Promise<Dataset<CrmDataset>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');

  const now = options?.now ?? new Date();

  const ordersResult = await listOrders({ signal: options?.signal });
  const records = ordersResult.data.map(toRecord);

  const customers = groupCustomers(records);
  const leads = buildLeads(DEMO_ABANDONED_CARTS, DEMO_FORM_LEADS);

  /**
   * Quantos carrinhos TEM E-MAIL.
   *
   * Na leitura real isto e um `WHERE email IS NOT NULL` no banco. Aqui e a mesma
   * regra, aplicada sobre os carrinhos de demonstracao — e e ela que explica a
   * assimetria 3 x 1 entre o segmento e a lista de leads. Ver `demo.ts`.
   */
  const abandonedCartsWithEmail = DEMO_ABANDONED_CARTS.filter((cart) =>
    Boolean(cart.email),
  ).length;

  const segments = buildSegments(
    customers,
    {
      // O SEGMENTO conta CARRINHOS (todos), nao carrinhos com e-mail. E o que o
      // original faz, e e o que faz os dois numeros de adm-010 e adm-011
      // conviverem: 3 no card, 1 na lista.
      abandonedCarts: DEMO_ABANDONED_CARTS.length,
      wishlist: DEMO_WISHLIST_COUNT,
      tryOn: DEMO_TRYON_EVENT_COUNT,
    },
    now,
  );

  return {
    data: { customers, leads, segments, abandonedCartsWithEmail },
    source: 'demo',
  };
}

/**
 * So os clientes — a aba `Clientes`.
 *
 * A agregacao roda de novo aqui, e isso e aceitavel de proposito: ela e pura e
 * barata sobre a lista que o banco devolveria paginada. O que NAO se faz e a
 * tela chamar as duas e escolher uma: por isso `listCrmDataset` devolve as tres
 * partes juntas e a tela usa so ela. Esta funcao existe para quem precisa apenas
 * dos clientes — a bancada, por exemplo, que quer conferir `TOTAL INVESTIDO` sem
 * montar segmento nenhum.
 */
export async function listCustomers(options?: {
  signal?: AbortSignal;
}): Promise<Dataset<CrmDataset['customers']>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  const ordersResult = await listOrders({ signal: options?.signal });
  return { data: groupCustomers(ordersResult.data.map(toRecord)), source: 'demo' };
}

/**
 * As tres contagens de aba.
 *
 * Ficam aqui, e nao na tela, porque e a MESMA pergunta que `lib/pedidos/data.ts`
 * responde para as abas de Pedidos: a tela so desenha. Segmentos nao tem contador
 * no print — as abas de adm-005/010/011 nao mostram numero nenhum ao lado do
 * rotulo — portanto nao ha contador de segmentos, e a funcao devolve so os dois.
 */
export async function listTabCounts(options?: { signal?: AbortSignal }): Promise<
  Dataset<{ clientes: number; leads: number }>
> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  const dataset = await listCrmDataset({ signal: options?.signal });
  return {
    data: { clientes: dataset.data.customers.length, leads: dataset.data.leads.length },
    source: 'demo',
  };
}

/**
 * NAO HA ESCRITA NESTE MODULO.
 *
 * Nenhum dos tres prints mostra criar, editar ou excluir — nem cliente, nem
 * lead, nem segmento. Nao existe `WriteResult` aqui, e a ausencia e deliberada:
 * exportar uma funcao de escrita "preparada para o futuro" sugeriria uma
 * operacao que a referencia nao tem.
 *
 * A unica acao que o print sustenta e `Ver Perfil` na coluna ACOES, e o destino
 * dela NAO tem print nenhum. Ela esta declarada em `actions.ts` e aparece
 * indisponivel na tela — mesmo tratamento dado as acoes de Pedidos e de Estoque.
 */
export type { CrmCustomer, CrmLead, CrmSegment, CrmTab } from './types';
export { DEMO_ABANDONED_CARTS, DEMO_FORM_LEADS } from './demo';
