'use client';

import { SegmentedTabs } from '@/components/ui/tabs';
import type { ReportTab } from '@/lib/relatorios/types';

/**
 * AS TRÊS ABAS DE RELATÓRIOS — `Produtos · Clientes · Categorias`.
 *
 * ================== É `SegmentedTabs`, E ISSO FOI MEDIDO ==================
 *
 * A escolha NÃO foi deduzida do desenho da faixa — deduzir do desenho foi
 * exatamente o erro que `tabs.tsx` registra ter cometido duas vezes. Foi medida
 * na captura `235851.png`, amostrando o pixel nas coordenadas reais:
 *
 *   `Produtos` (ativo)  x 647–737, y 185–220. É uma pílula PREENCHIDA de tinta
 *                       `rgb(20,17,14)` = `#14110E`, sem borda de contorno.
 *   `Clientes`          x ~800–880, y 205. TEXTO SOLTO sobre o branco — o pixel
 *                       `(880, 175)` e o `(880, 230)`, logo acima e logo abaixo
 *                       da linha de base, são `rgb(255,255,255)`.
 *   `Categorias`        idem: `(1050, 172)` e `(1050, 232)` são brancos.
 *
 * E o TRILHO está lá. O fundo em volta das três abas é `rgb(241,230,220)`, mais
 * escuro que o branco da barra — medido na coluna `x = 742` (o vão logo depois
 * da pílula ativa) e na base da faixa, em `y = 240`. O trilho tem 74px de altura
 * (y 167–240), que é o `p-1` (8px) somado aos 40px do `h-10` da pílula ativa —
 * os 36px de tinta medidos (185–220) mais a suavização de borda que a medição
 * por limiar de cor come.
 *
 * ================== O QUE ISSO DESCARTA ==================
 *
 *   NÃO é `PillTabs` (Conteúdo do Site): lá as SETE abas são pílulas
 *   INDIVIDUAIS, cada uma com borda clara própria. Aqui `Clientes` e `Categorias`
 *   não têm borda nenhuma — um `PillTabs` desenharia duas bordas que o print não
 *   tem, e um trilho que também não existe.
 *
 *   Conteúdo do Site MEDIDO para comparar: a pílula `Hero Banner` em
 *   `235737.png` tem 93px de largura e 30px de tinta sem trilho em volta — o
 *   desenho é outro. Os dois casos foram lidos na fonte, não pelos nomes.
 *
 * É o mesmo componente das abas de Pedidos, CRM, Fidelidade e Provador — que é
 * o que o painel usa quando as abas são "algumas opções curtas dentro de um
 * trilho", que é o caso aqui.
 *
 * O parâmetro de tipo é fixado UMA vez (`SegmentedTabs<ReportTab>`), como em
 * `crm-tabs.tsx` e `loyalty-tabs.tsx`: sem ele o `onChange` seria inferido como
 * `string` e a tela teria que estreitar de volta.
 */

export const REPORT_TAB_ITEMS: { value: ReportTab; label: string }[] = [
  { value: 'products', label: 'Produtos' },
  { value: 'customers', label: 'Clientes' },
  { value: 'categories', label: 'Categorias' },
];

export function ReportTabs({
  value,
  onChange,
}: {
  value: ReportTab;
  onChange: (tab: ReportTab) => void;
}) {
  return (
    <SegmentedTabs<ReportTab> items={REPORT_TAB_ITEMS} value={value} onChange={onChange} />
  );
}
