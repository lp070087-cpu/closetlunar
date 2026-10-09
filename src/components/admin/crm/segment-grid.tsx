import {
  Clock,
  Heart,
  MapPin,
  ShoppingCart,
  Sparkles,
  Trophy,
  User,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmSegment, SegmentIconName, SegmentTone } from '@/lib/crm/types';

/**
 * Os oito cards da aba `Segmentos` — adm-011.
 *
 * O CARD DESTA TELA E DIFERENTE DOS KPIs DO RESTO DO PAINEL, e isso e do print:
 *
 *   KPI padrao (`StatCard`)   rotulo em cima, numero grande embaixo, icone a direita
 *   card de Segmentos          icone a ESQUERDA (quadrado colorido de 48px) e o
 *                              numero grande a DIREITA; rotulo embaixo, sozinho
 *
 * Reusar `StatCard` aqui "para padronizar" apagaria a unica diferenca visual que
 * a tela tem. Fidelidade > padronizacao: o card e proprio, e por isso ele mora
 * aqui, e nao em `components/ui`.
 *
 * AS OITO CORES SAO NOMEADAS DO TAILWIND, em `100/600` — e NAO os tokens de
 * superficie do design system (bege, ambar, rosa). Sao cores desta tela; virar
 * token global por causa de um print que so o CRM usa mexeria em modulos ja
 * validados. O mapa esta fechado aqui embaixo: sao oito e nao ha nona.
 *
 * A GRADE E 2 x 4 no celular e 4 x 2 no desktop, como o original
 * (`grid-cols-2 md:grid-cols-4`). Nos quatro segmentos de baixo, a linha e
 * exatamente a mesma — cada card tem altura propria, sem `h-full`, o que
 * reproduz a leve diferenca de altura entre as duas fileiras que o print mostra.
 */
const ICONS: Record<SegmentIconName, LucideIcon> = {
  'user-plus': UserPlus,
  clock: Clock,
  trophy: Trophy,
  user: User,
  'shopping-cart': ShoppingCart,
  heart: Heart,
  sparkles: Sparkles,
  'map-pin': MapPin,
};

const TONES: Record<SegmentTone, string> = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-yellow-100 text-yellow-600',
  gray: 'bg-gray-100 text-gray-600',
  orange: 'bg-orange-100 text-orange-600',
  pink: 'bg-pink-100 text-pink-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  green: 'bg-green-100 text-green-600',
};

/**
 * Um card.
 *
 * O NUMERO usa a serifada do painel (`font-serif`) e `tabular-nums`, como o
 * print — os algarismos ficam alinhados entre os oito cards mesmo com larguras
 * diferentes.
 *
 * O card NAO e clicavel. O original poe `cursor-pointer` e um `hover`, mas nao
 * liga `onClick` nenhum: nao existe tela de destino para um segmento. Manter o
 * cursor de clique sem destino seria prometer uma navegacao que nao existe —
 * entao fica o `hover` visual do print, sem o cursor enganoso.
 */
function SegmentCard({ segment }: { segment: CrmSegment }) {
  const Icon = ICONS[segment.iconName];

  return (
    <div className="surface flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <span
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-2xl shadow-card',
            TONES[segment.tone],
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="font-serif text-3xl tabular-nums tracking-tight">{segment.value}</span>
      </div>
      <span className="eyebrow-caps">{segment.label}</span>
    </div>
  );
}

/** Os oito cards, na ordem do print — linha por linha, da esquerda para a direita. */
export function SegmentGrid({ segments }: { segments: CrmSegment[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {segments.map((segment) => (
        <SegmentCard key={segment.key} segment={segment} />
      ))}
    </div>
  );
}
