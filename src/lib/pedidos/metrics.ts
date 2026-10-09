/**
 * Metricas de Pedidos — modulo PURO, sem React e sem dados.
 *
 * Tudo o que a tela mostra como TEXTO CALCULADO sai daqui: o codigo do pedido,
 * o resumo do cliente, o texto da linha de item, o link de rastreio, a
 * ordenacao, a contagem das abas. E o que permite a bancada provar as decisoes
 * sem navegador.
 *
 * A FRONTEIRA COM O ESTOQUE: este modulo NAO baixa estoque. Nao ha nada em
 * adm-003 nem adm-004 que diga que a tela de Pedidos movimenta quantidade — o
 * Historico de Movimentacoes do Estoque tem o tipo `venda` como CHIP de filtro,
 * mas nenhum print liga um pedido a um lancamento. Baixar estoque ao mudar um
 * status seria inventar uma regra de negocio inteira (quando? no `pago`? no
 * `enviado`? e o cancelamento devolve?). Fica registrado como pendencia.
 */

import { formatBRL } from '@/lib/utils';
import { ORDER_STATUS_LABELS } from './demo';
import type {
  Order,
  OrderItem,
  OrdersTab,
  OrderStatus,
  ShippingStatus,
} from './types';

/**
 * O CODIGO DO PEDIDO — `#ff3048c9`.
 *
 * Nao e um numero amigavel: sao os OITO PRIMEIROS caracteres do id, com `#`.
 * O projeto original faz exatamente isso (`#{String(o.id).slice(0,8)}`), e e por
 * isso que os dois codigos de adm-004 parecem codigos de cor hexadecimal. Eles
 * sao: `ff3048c9` e `41b60ae2` sao os primeiros 8 caracteres de dois UUIDs.
 *
 * Existe como funcao porque o `code` do pedido e DERIVADO do id, e nao um campo
 * separado — se ficasse digitado no dado, um id novo apareceria com codigo
 * errado.
 */
export function buildOrderCode(id: string): string {
  return `#${id.replace(/-/g, '').slice(0, 8)}`;
}

/** `Mariana · 81994608572` — nome e telefone na mesma linha, como no cartao. */
export function customerLine(order: Order): string {
  return `${order.customer.name} · ${order.customer.phone}`;
}

/**
 * A LINHA DE UM ITEM — `1x Jaqueta Corta Vento Fit (M/Preto) — R$ 179,90`.
 *
 * O separador entre tamanho e cor e BARRA, sem espaco: `M/Preto`, `M/Único`.
 * E o separador entre o preco e o resto e o travessao longo (`—`), nao hifen —
 * o mesmo caractere do print, e nao um `-` que se parece com ele.
 *
 * O preco sai de `formatBRL`, o formatador unico do projeto, para o pedido e o
 * resto do painel nao divergirem em centavos.
 */
export function formatItemLine(item: OrderItem): string {
  return `${item.quantity}x ${item.productName} (${item.size}/${item.color}) — ${formatBRL(item.unitPrice)}`;
}

/**
 * A linha de rastreio do cartao: `Transp.: Correios` e `Status: Aguardando
 * postagem`.
 *
 * Devolve `null` quando NAO HA O QUE MOSTRAR — e esse `null` e a diferenca entre
 * os dois cartoes do topo de adm-003 (que mostram a linha) e os tres do `lucas`
 * (que nao mostram). O projeto original usa exatamente esta condicao:
 * `carrier || tracking_code || delivery_status`.
 *
 * Devolve as PARTES, e nao uma string montada, porque a tela precisa negritar
 * os rotulos `Transp.:` e `Status:` separadamente do valor.
 */
export function shippingSummary(order: Order): { carrier: string | null; status: string | null } | null {
  const { carrier, status } = order.shipping;
  if (!carrier && status === null) return null;
  return {
    carrier,
    status: status === null ? null : formatShippingStatus(status),
  };
}

/** O rotulo do estado da postagem. Ver `SHIPPING_STATUS_LABELS` em `demo.ts`. */
export function formatShippingStatus(status: ShippingStatus): string {
  const LABELS: Record<ShippingStatus, string> = {
    aguardando_postagem: 'Aguardando postagem',
    postado: 'Postado',
    em_transito: 'Em trânsito',
    saiu_para_entrega: 'Saiu para entrega',
    entregue: 'Entregue',
    extraviado: 'Extraviado',
    devolvido: 'Devolvido',
  };
  return LABELS[status];
}

/**
 * O TEXTO DA COLUNA `AÇÃO` DO adm-004.
 *
 * Duas situacoes, e o print so mostra uma:
 *
 *   sem codigo     `sem código`  — cinza claro, NAO e botao
 *   com codigo     `Rastrear`    — link
 *
 * O `Rastrear` vem do projeto original, nao de print nenhum. O texto do estado
 * vazio, `sem código`, e literal do print — com acento, e com espaco.
 */
export function actionLabel(order: Order): { text: string; kind: 'empty' | 'track' } {
  if (!order.shipping.trackingCode) return { text: 'sem código', kind: 'empty' };
  return { text: 'Rastrear', kind: 'track' };
}

/**
 * A URL DE RASTREIO, por transportadora.
 *
 * Transcrita do projeto original. O caso DEFAULT e o rastreador universal do
 * Melhor Envio — que e o provedor padrao do painel (`SHIPPING_PROVIDERS` em
 * `lib/mock.ts` marca `melhor_envio` como o unico disponivel). A comparacao e
 * case-insensitive porque a transportadora vem digitada (`Correios`).
 *
 * `null` quando nao ha codigo: uma URL de rastreio sem codigo levaria a uma
 * pagina de erro, o que e pior do que nao ter link.
 */
export function trackingUrl(order: Order): string | null {
  const code = order.shipping.trackingCode;
  if (!code) return null;
  const carrier = (order.shipping.carrier ?? '').toLowerCase();
  const encoded = encodeURIComponent(code);
  if (carrier.includes('correios')) {
    return `https://rastreamento.correios.com.br/app/index.php?objetos=${encoded}`;
  }
  if (carrier.includes('jadlog')) return `https://www.jadlog.com.br/tracking?cte=${encoded}`;
  if (carrier.includes('loggi')) return `https://rastreador.loggi.com/${encoded}`;
  if (carrier.includes('total')) {
    return `https://tracking.totalexpress.com.br/poupup_track.php?reid=${encoded}`;
  }
  return `https://www.melhorenvio.com.br/rastreio/${encoded}`;
}

/**
 * QUAIS PEDIDOS APARECEM NA ABA `Rastreamento`.
 *
 * O projeto original filtra por
 * `shipping_method.startsWith("me:") || carrier || tracking_code` — ou seja,
 * "tem transportadora". Reproduzido aqui pela presenca da TRANSPORTADORA, que e
 * o campo que o print mostra naquela tabela.
 *
 * O efeito no material: `Mariana` e `carinna` (Correios) aparecem; os tres do
 * `lucas` (sem postagem) NAO. E exatamente as duas linhas de adm-004.
 */
export function trackedOrders(orders: Order[]): Order[] {
  return orders.filter((order) => order.shipping.carrier !== null);
}

/**
 * A ordenacao dos PEDIDOS: mais recente primeiro.
 *
 * adm-003 mostra `16/06` duas vezes e depois `15/06` tres vezes, com os
 * horarios decrescendo (`14:56:54`, `14:45:30`, `13:43:16`, `13:43:12`,
 * `13:43:06`). Empatar no dia nao basta: os tres do `lucas` so ficam na ordem
 * certa pelo HORARIO, e o desempate por id e o que garante ordem estavel se dois
 * pedidos chegarem no mesmo segundo.
 *
 * A lista NAO e mutada: devolve um array novo, para a tela poder ordenar sem
 * mexer no que veio da camada de dados.
 */
export function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const byDate = b.placedAt.localeCompare(a.placedAt);
    return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
  });
}

/** Filtra pela aba do titulo. `todos` nao e um filtro — e a ausencia dele. */
export function filterByTab(orders: Order[], tab: OrdersTab): Order[] {
  if (tab === 'todos') return [...orders];
  return trackedOrders(orders);
}

/** A contagem de cada aba, para o `(N)` que o painel usa nos chips. */
export function tabCount(orders: Order[], tab: OrdersTab): number {
  return filterByTab(orders, tab).length;
}

/** O rotulo do status do pedido — o texto do `• novo`. */
export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

/**
 * A QUANTIDADE DE PECAS de um pedido — a soma das quantidades dos itens.
 *
 * Cuidado: NAO e o mesmo que o valor total. `carinna` tem 1 peca e paga
 * R$ 187,76 (o item custa 179,90 e ha 7,86 de frete); `Mariana` tem total
 * R$ 506,95 e NENHUM item impresso. Quem somasse precos de item para achar o
 * total erraria os dois casos — por isso o total do pedido e um CAMPO
 * (`payment.total`), e nao uma conta feita na tela.
 */
export function totalItems(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Ha mais de um pedido da mesma cliente? Usado para o rotulo de repeticao. */
export function isRepeatCustomer(orders: Order[], order: Order): boolean {
  return orders.filter((item) => item.customer.phone === order.customer.phone).length > 1;
}
