'use client';

import { PillTabs } from '@/components/ui/tabs';
import type { TabItem } from '@/components/ui/tabs';
import { configTabs } from '@/lib/configuracoes/metrics';
import type { ConfigTab } from '@/lib/configuracoes/types';

/**
 * AS QUATRO PÍLULAS DE TOPO — `Entrega própria · Melhor Envio · Integração
 * transportadoras · Pagamentos`, na ordem do print.
 *
 * ================== ESTE ENVOLTÓRIO EXISTE PELO PARÂMETRO DE TIPO ==================
 *
 * `PillTabs` é genérico (`<T extends string>`) e o `T` só sai do par
 * `value`/`onChange`. Escrito direto na tela,
 * `<PillTabs items={TABS} value={tab} onChange={setTab} />` vira
 * `PillTabs<string>` e o `setTab` (`Dispatch<SetStateAction<ConfigTab>>`) não
 * assigna a `(value: string) => void`. Fixar o genérico AQUI
 * (`PillTabs<ConfigTab>`) resolve de uma vez. É o mesmo arranjo de
 * `whatsapp-tabs.tsx`, `report-tabs.tsx`, `crm-tabs.tsx` e `loyalty-tabs.tsx`.
 *
 * ================== POR QUE `PillTabs`, E NÃO `SegmentedTabs` ==================
 *
 * No print cada aba é uma PÍLULA SOLTA com borda própria, de cantos totalmente
 * arredondados, com a ativa preenchida de preto. Não é o trilho único do
 * `SegmentedTabs` (o de WhatsApp), onde a ativa se funde ao fundo. A fileira
 * `MELHOR ENVIO · CORREIOS (EM BREVE) …` embaixo é do mesmo desenho, mas ali é o
 * seletor de transportadora, dentro da seção.
 */
const TABS: TabItem<ConfigTab>[] = configTabs().map((aba) => ({
  value: aba.value,
  label: aba.label,
}));

export function ConfiguracoesTabs({
  value,
  onChange,
}: {
  value: ConfigTab;
  onChange: (tab: ConfigTab) => void;
}) {
  return <PillTabs<ConfigTab> items={TABS} value={value} onChange={onChange} />;
}
