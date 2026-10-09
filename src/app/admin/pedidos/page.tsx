import type { Metadata } from 'next';
import { OrdersView } from '@/components/admin/pedidos/orders-view';

export const metadata: Metadata = { title: 'Pedidos' };

/**
 * Pedidos — reconstruida de adm-003 e adm-004.
 *
 * UMA TELA, DUAS ABAS, que e como o material a apresenta:
 *
 *   adm-003   aba `Todos`         lista de cartoes
 *             nome · telefone · data-hora · Transp./Status (quando ha) ·
 *             itens · `R$ total • status`
 *
 *   adm-004   aba `Rastreamento`  tabela de seis colunas
 *             PEDIDO · CLIENTE · TRANSPORTADORA · CÓDIGO · STATUS · AÇÃO
 *
 * A REFERENCIA DO PLACEHOLDER ANTERIOR ESTAVA ERRADA.
 *
 * Ele anunciava `references="adm-003 a adm-008"` e listava cinco blocos. O mapa
 * do painel (`MAPA-ADMIN.md`) reserva para Pedidos **adm-003 e adm-004** apenas
 * — adm-005 e CRM, adm-006 e Campanhas, adm-007 e Cupons, adm-008 e Carrinho
 * Abandonado. Quatro modulos diferentes, empilhados em cima do mesmo intervalo.
 *
 * E o bloco `Tabela de rastreamento` do placeholder descrevia uma tabela com
 * coluna `Ação` mostrando `sem código`; isso esta certo, e veio de adm-004.
 *
 * A LACUNA: a ACAO.
 *
 * A coluna `AÇÃO` existe em adm-004, mas o print so mostra o seu ESTADO VAZIO
 * (`sem código`). O projeto original declara o outro lado — um link `Rastrear`
 * quando ha codigo — e o proprio mapa registra a lacuna: adm-003/004 estao
 * entre os prints que ficaram sem o "da acao".
 *
 * Nenhum print do painel mostra modal de status, campo de rastreio ou botao de
 * impressao. Por isso esta fase NAO desenhou nenhum dos tres: eles estao
 * declarados como indisponiveis em `ORDER_ACTIONS` (`lib/pedidos/demo.ts`) e
 * relatados como pendencia. Desenhar um modal plausivel daria a entender que o
 * fluxo existe — e nao existe em referencia nenhuma.
 *
 * PENDENCIA DECLARADA: o proprio menu promete mais do que estas duas telas.
 *
 * `nav.ts` descreve o item Pedidos como "Acompanhe, separe e despache os pedidos
 * da loja." — e "separe" e "despache" sao justamente as acoes que nao tem print:
 * separar e o `separacao` da maquina de estados, despachar e lancar rastreio,
 * que sem o codigo nao anda. Com o que existe, a tela cumpre so o "acompanhe".
 *
 * `nav.ts` NAO foi alterado, pelo mesmo motivo do Estoque: o arquivo se declara
 * inventario fechado ("Nao reordenar, nao renomear, nao remover itens"). A
 * divergencia fica registrada aqui, e nao resolvida mexendo no menu — que
 * apagaria a pendencia sem resolver nem a acao nem a descricao.
 *
 * DUAS DIVERGENCIAS REGISTRADAS, NAO RESOLVIDAS
 *
 *   1. `novo` tem dois rotulos: `NOVO` no dashboard (adm-001) e "Aguardando
 *      pagamento" na area da cliente (`conta.pedidos.tsx`). O rotulo daqui sai
 *      do print desta tela (`Novo`); o codigo, da fonte que tem os seis valores.
 *      Escolher um dos dois lados seria resolver em silencio o que o mapa deixou
 *      aberto. Ver `ORDER_STATUS_LABELS` em `lib/pedidos/demo.ts`.
 *
 *   2. O primeiro cartao de adm-003 (`Mariana`, R$ 506,95) NAO mostra itens,
 *      enquanto os outros quatro mostram. O material nao decide se o pedido nao
 *      tem itens ou se o print cortou — entao ele entra com `items: []`, que e o
 *      unico estado que reproduz o print sem fabricar uma venda.
 *
 * A tela e um componente cliente porque tem estado de aba. A pagina fica como
 * Server Component para poder, mais adiante, resolver a sessao e buscar a
 * primeira pagina no servidor.
 */
export default function PedidosPage() {
  return <OrdersView />;
}
