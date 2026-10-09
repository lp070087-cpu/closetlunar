'use client';

import type { OrdersTab } from '@/lib/pedidos/data';
import { SegmentedTabs } from '@/components/ui/tabs';

/**
 * As DUAS ABAS do titulo — `Todos` e `Rastreamento` (adm-003 e adm-004).
 *
 * O componente compartilhado ja existia esperando por esta tela: o comentario
 * de `@/components/ui/tabs` diz, literalmente, que o `SegmentedTabs` e "usada em
 * 'Todos / Rastreamento' (Pedidos) e nos filtros do CRM". Ou seja, o padrao
 * visual foi medido quando a fundacao foi feita — aqui ele so recebe os itens.
 *
 * E a MESMA casca do print: pilula clara com borda, a aba ativa em pilula preta
 * de texto branco. Em adm-003 a ativa e `Todos`; em adm-004, `Rastreamento`.
 *
 * Existe como componente proprio, e nao inline na tela, pelo mesmo motivo das
 * outras fases: a bancada renderiza este bloco com cada aba ativa e LE qual
 * esta marcada, em vez de procurar a string no arquivo — instrumento que casa
 * dentro de comentario e nao distingue ativo de inativo.
 */
export function OrdersTabs({
  value,
  onChange,
  counts,
}: {
  value: OrdersTab;
  onChange: (tab: OrdersTab) => void;
  /** Quantos pedidos em cada aba. Ver `listTabCounts`. */
  counts: Record<OrdersTab, number>;
}) {
  return (
    <SegmentedTabs<OrdersTab>
      items={[
        { value: 'todos', label: 'Todos', count: counts.todos },
        { value: 'rastreamento', label: 'Rastreamento', count: counts.rastreamento },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}
