'use client';

import { SegmentedTabs } from '@/components/ui/tabs';
import type { CrmTab } from '@/lib/crm/types';

/**
 * As TRES ABAS do titulo — `Clientes`, `Leads` e `Segmentos`.
 *
 * PILULA ESCURA, e nao sublinhado. O print adm-005 mostra `Clientes` dentro de
 * uma pilula PRETA arredondada, com `Leads` e `Segmentos` em texto solto ao lado,
 * e sem sublinhado em lugar nenhum. E o visual do `SegmentedTabs`.
 *
 * EXISTE COMO COMPONENTE PROPRIO, e nao inline na tela, pelos DOIS motivos que
 * ja valem em Pedidos:
 *
 *   1. e o que permite a bancada renderizar este bloco com cada aba ativa e LER
 *      qual esta marcada, em vez de procurar a string no arquivo — instrumento
 *      que casaria dentro de comentario e nao distinguiria ativa de inativa;
 *   2. e onde o parametro de tipo e fixado UMA vez (`SegmentedTabs<CrmTab>`). A
 *      tela nao precisa anotar `TabItem<CrmTab>[]` nem `SegmentedTabs<CrmTab>` a
 *      cada chamada: sem esta fixacao, o `onChange` e inferido como
 *      `(value: string) => void` e nao aceita `SetStateAction<CrmTab>`. O erro
 *      so aparecia na emissao — nao no `next lint`, e nao a olho.
 *
 * NAO HA CONTADOR nas abas. O print de adm-005/010/011 nao mostra numero nenhum
 * ao lado do rotulo — nem em Clientes, nem em Leads, nem em Segmentos. Em Pedidos
 * os dois numeros existem porque adm-003/004 mostram; aqui nao ha o que mostrar,
 * e inventar um `(5)` seria acrescentar dado que a referencia nao tem.
 */
export function CrmTabs({
  value,
  onChange,
}: {
  value: CrmTab;
  onChange: (tab: CrmTab) => void;
}) {
  return (
    <SegmentedTabs<CrmTab>
      items={[
        { value: 'clientes', label: 'Clientes' },
        { value: 'leads', label: 'Leads' },
        { value: 'segmentos', label: 'Segmentos' },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}
