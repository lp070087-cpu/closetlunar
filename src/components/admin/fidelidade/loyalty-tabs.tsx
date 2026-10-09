'use client';

import { SegmentedTabs } from '@/components/ui/tabs';
import { LOYALTY_TABS, type LoyaltyTab } from '@/lib/fidelidade/metrics';

/**
 * AS TRES ABAS do titulo — `Configurações & Resgates`, `Níveis Clube VIP` e
 * `Histórico de Pontos`, na ordem de adm-018.
 *
 * PILULA ESCURA, e nao sublinhado: o print mostra a aba ativa dentro de uma
 * pilula PRETA arredondada e as outras duas em texto solto ao lado. E o visual do
 * `SegmentedTabs`, e o mesmo caso do CRM. Os rotulos vem de `LOYALTY_TABS`, que e
 * onde eles estao transcritos — este componente nao os repete.
 *
 * A BARRA DIVISORIA ABAIXO. O print tem uma hairline de largura inteira
 * atravessando a pagina logo abaixo da linha das abas (medida em y=150, de
 * x=639 a x=2174), e ela esta FORA do container das abas: passa por baixo das
 * abas e continua ate a borda direita. Nao e um `border-b` das abas — e uma
 * divisoria da PAGINA, e por isso ela mora aqui, envolvendo a linha das abas, e
 * nao dentro do `SegmentedTabs`.
 *
 * A pilula ativa NAO ENCOSTA nessa hairline: entre o fim da pilula (y=133) e a
 * barra (y=150) sobram 17px, e as abas estao alinhadas pelo TOPO da pilula — o
 * `items-start` que da isso. Sem ele, um `items-center` empurraria a pilula para
 * baixo e ela encostaria na barra, porque as abas inativas sao mais baixas.
 *
 * EXISTE COMO COMPONENTE PROPRIO pelos dois motivos que ja valem no CRM: deixa a
 * bancada renderizar o bloco com cada aba ativa e LER qual esta marcada, em vez
 * de procurar a string no arquivo; e e onde o parametro de tipo e fixado UMA vez
 * (`SegmentedTabs<LoyaltyTab>`), sem o qual o `onChange` e inferido como
 * `(value: string) => void` e nao aceita `SetStateAction<LoyaltyTab>`.
 */
export function LoyaltyTabs({
  value,
  onChange,
}: {
  value: LoyaltyTab;
  onChange: (tab: LoyaltyTab) => void;
}) {
  return (
    <div className="border-b border-border/60 pb-3">
      <SegmentedTabs<LoyaltyTab> items={[...LOYALTY_TABS]} value={value} onChange={onChange} />
    </div>
  );
}
