'use client';

import { Check, Loader2, MessageCircle } from 'lucide-react';
import { PillTabs } from '@/components/ui/tabs';
import type { TabItem } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { TicketCounts, TicketFilter } from '@/lib/atendimento/types';

/**
 * A FAIXA DE PÍLULAS do filtro.
 *
 * ================== O WRAPPER EXISTE PELO GENÉRICO, NÃO PELO DESENHO ==================
 *
 * `PillTabs<T>` é genérico e infere `T` do `value`. Passando `value={filter}` e
 * `onChange={setFilter}` direto, o TypeScript tenta casar `T` com
 * `Dispatch<SetStateAction<TicketFilter>>` e não fecha — foi exatamente o erro que
 * apareceu no WhatsApp com `SegmentedTabs`. A saída é a mesma que `report-tabs`,
 * `crm-tabs`, `loyalty-tabs` e `whatsapp-tabs` já usam: um wrapper que fixa o
 * genérico UMA vez e recebe `onChange: (value: TicketFilter) => void`.
 *
 * Aqui o wrapper também constrói os `items`, porque os contadores vêm dos dados:
 * cada rótulo carrega o `count` da sua contagem.
 */
export function AtendimentoFilterTabs({
  filter,
  counts,
  onChange,
}: {
  filter: TicketFilter;
  counts: TicketCounts;
  onChange: (filter: TicketFilter) => void;
}) {
  const items: TabItem<TicketFilter>[] = [
    { value: 'all', label: 'Todos', count: counts.all },
    { value: 'open', label: 'Abertos', count: counts.open },
    { value: 'progress', label: 'Em andamento', count: counts.progress },
    { value: 'done', label: 'Finalizados', count: counts.done },
  ];

  return <PillTabs<TicketFilter> items={items} value={filter} onChange={onChange} />;
}

/**
 * Os QUATRO indicadores do topo.
 *
 * ================== O QUADRADO É BRANCO; SÓ O GLIFO É COLORIDO ==================
 *
 * Medido no print: dentro dos quatro quadrados, o pixel dominante é BRANCO — só o
 * traço do ícone tem cor. O `StatCard` do painel não consegue fazer isso: nele a
 * cor vai no QUADRADO (`TONES[tone]`), e o glifo apenas herda. Passar uma classe de
 * glifo por fora — `[&_span.grid]:text-blue-600` — brigaria com o `text-foreground`
 * do tom neutro: as duas são utilitárias de mesma especificidade, e quem vence é a
 * ordem no CSS gerado, não a intenção.
 *
 * O projeto já resolveu esse caso duas vezes com um card LOCAL em vez do
 * compartilhado, e registrou o porquê: `cart-stats.tsx` (Carrinho Abandonado) e
 * `segment-grid.tsx` (CRM). Aqui vale o mesmo, pelo mesmo motivo — e o card abaixo
 * mantém a anatomia do `StatCard` (rótulo em caixa alta, número serifado, quadrado
 * branco com sombra à direita), mudando só quem recebe a cor.
 *
 * As três cores são as medidas no print: azul `#155DFC` (`blue-600`), laranja
 * `#F54A00` (`orange-600`) e verde `#02A73F` (`green-600`). O `Total` fica neutro,
 * como no print.
 *
 * Os ícones são os do print e do original: `MessageCircle` em `Total` e em
 * `Abertos`, `Loader2` em `Em andamento` e `Check` em `Finalizados`.
 */
export function AtendimentoStats({ counts }: { counts: TicketCounts }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <AtendimentoStat label="Total" value={counts.all} icon={MessageCircle} />
      <AtendimentoStat
        label="Abertos"
        value={counts.open}
        icon={MessageCircle}
        glyph="text-blue-600"
      />
      <AtendimentoStat
        label="Em andamento"
        value={counts.progress}
        icon={Loader2}
        glyph="text-orange-600"
      />
      <AtendimentoStat
        label="Finalizados"
        value={counts.done}
        icon={Check}
        glyph="text-green-600"
      />
    </div>
  );
}

/**
 * Um dos quatro cartões. `glyph` é a cor SÓ do traço do ícone — o quadrado em si
 * fica branco com `shadow-card`, como o print mostra.
 */
function AtendimentoStat({
  label,
  value,
  icon: Icon,
  glyph,
}: {
  label: string;
  value: number;
  icon: typeof MessageCircle;
  /** Cor do glifo. Sem ela, o ícone herda a tinta do texto. */
  glyph?: string;
}) {
  return (
    <div className="surface flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="eyebrow-caps truncate">{label}</span>
          <span className="truncate font-serif text-3xl tabular-nums tracking-tight">{value}</span>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-background text-foreground shadow-card">
          <Icon className={cn('size-5', glyph)} aria-hidden />
        </span>
      </div>
    </div>
  );
}
