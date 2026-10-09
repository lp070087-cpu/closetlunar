import { Badge } from '@/components/ui/badge';
import { orderStatusLabel } from '@/lib/pedidos/metrics';
import type { OrderStatus } from '@/lib/pedidos/types';

/**
 * O selo do STATUS DO PEDIDO — o `• novo` do canto direito do cartao.
 *
 * ATENCAO AO QUE ESTE COMPONENTE **NAO** E: ele nao e o `Status: Aguardando
 * postagem` da linha do meio. Aquele e o estado da POSTAGEM, tem vocabulario
 * proprio e e desenhado pelo `shippingSummary`. Os dois aparecem no MESMO cartao
 * de adm-003, a duas linhas de distancia, e trocar um pelo outro e o defeito
 * mais provavel desta tela — ver `lib/pedidos/types.ts`.
 *
 * O TOM. `novo` e o unico status que um print desta tela mostra, e ele sai
 * AMBAR/neutro (o chip `#FF3048C9` do dashboard). Os outros cinco nao aparecem
 * em print nenhum aqui; os tons seguem a convencao que o resto do painel ja usa
 * para o mesmo significado, e nao uma paleta escolhida nesta tela.
 *
 * Minusculo com ponto: o print escreve `• novo` em caixa baixa, e nao
 * `NOVO` em versalete como os selos de estoque. Por isso o `Badge` entra sem o
 * `uppercase` que ele aplica por padrao.
 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tones = {
    novo: 'warning',
    pago: 'neutral',
    separacao: 'neutral',
    enviado: 'neutral',
    entregue: 'success',
    cancelado: 'danger',
  } as const;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span aria-hidden>•</span>
      <Badge variant={tones[status]} size="sm" className="normal-case tracking-normal">
        {orderStatusLabel(status)}
      </Badge>
    </span>
  );
}
