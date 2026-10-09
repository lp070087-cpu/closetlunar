'use client';

import { SegmentedTabs } from '@/components/ui/tabs';
import type { TabItem } from '@/components/ui/tabs';

export type WhatsAppTab = 'tickets' | 'config';

/**
 * AS DUAS ABAS DE TOPO — `Atendimentos · Configurações`.
 *
 * ================== ESTE ENVOLTÓRIO EXISTE PELO PARÂMETRO DE TIPO ==================
 *
 * `SegmentedTabs` é genérico (`<T extends string>`), mas o `T` só é inferido pelo
 * par `value`/`onChange`. Escrito DIRETO na tela como
 * `<SegmentedTabs items={TABS} value={tab} onChange={setTab} />`, o compilador lê o
 * `value` como `WhatsAppTab` mas tenta casar o `onChange` com o `(value: string) => void`
 * do genérico aberto — e o `setTab` (que só aceita `WhatsAppTab`) não assigna a um
 * parâmetro `string`. A chamada vira `SegmentedTabs<string>` e o erro sobe como
 * "`Dispatch<SetStateAction<WhatsAppTab>>` não é assignable a `(value: string) => void`".
 *
 * Fixar o genérico AQUI (`SegmentedTabs<WhatsAppTab>`), dentro do envoltório, resolve
 * de uma vez: o `onChange` daqui é `(tab: WhatsAppTab) => void` e casa com o
 * `SetStateAction` do `useState` (a função de atualização é assignable a um parâmetro
 * `WhatsAppTab`). É o mesmo arranjo de `report-tabs.tsx`, `crm-tabs.tsx` e
 * `loyalty-tabs.tsx` — as telas que passam no `typecheck` têm este envoltório; a que
 * não tem é a que quebra.
 *
 * A escolha de componente NÃO é dedução do desenho: o print adm-069 mostra as duas
 * dentro de um trilho único (a ativa preenchida, a outra sem borda própria), que é o
 * `SegmentedTabs`. Ver `tabs.tsx`.
 */
const TABS: TabItem<WhatsAppTab>[] = [
  { value: 'tickets', label: 'Atendimentos' },
  { value: 'config', label: 'Configurações' },
];

export function WhatsAppTabs({
  value,
  onChange,
}: {
  value: WhatsAppTab;
  onChange: (tab: WhatsAppTab) => void;
}) {
  return <SegmentedTabs<WhatsAppTab> items={TABS} value={value} onChange={onChange} />;
}
