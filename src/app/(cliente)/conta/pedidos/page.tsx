import { OrdersView } from '@/components/cliente/orders-view';

/**
 * `/conta/pedidos` — `Meus Pedidos`, os prints `cli-004` e `cli-005`.
 *
 * Server Component, como as outras rotas da area: a pagina so entrega a view. A
 * lista e lida no cliente porque o dono do pedido e a CONTA da sessao, e a
 * sessao (de demonstracao, nesta fase) e resolvida no navegador — nao ha cookie
 * de servidor para ler ainda.
 *
 * O titulo `Meus Pedidos` NAO esta aqui: ele pertence ao painel de conteudo
 * (`ClientPageHeader`, dentro da view), e nao a casca — ver a nota de
 * `account-shell.tsx`.
 */
export default function ContaPedidosPage() {
  return <OrdersView />;
}
