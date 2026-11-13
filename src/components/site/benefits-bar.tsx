import {
  CreditCard,
  Gift,
  Heart,
  MessageCircle,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import type { Benefit } from '@/lib/conteudo/types';

/**
 * A faixa de cinco beneficios — a tarja fina logo abaixo do Hero.
 *
 * ================== O ICONE E UM NOME, E NAO UM DESENHO ==================
 *
 * O `icon_name` do dado guarda o NOME do icone do lucide (`Truck`, `CreditCard`,
 * ...), porque e o que o formulario do painel grava e o que a tela do admin
 * imprime. Aqui o nome vira componente por este mapa — e nao por um `import * as
 * Icons`, que arrastaria a biblioteca inteira para o pacote so para desenhar
 * cinco glifos.
 *
 * Os dez nomes do mapa sao os dez do original (`BenefitsBar.tsx`). Um nome fora
 * da lista cai no `Truck`, como no original — e nao num espaco vazio.
 *
 * ================== OS CINCO VEM DO ADMIN ==================
 *
 * `listBenefits()` devolve os cinco do print (`Frete grátis / acima de R$299`,
 * `Pague em até 6x / sem juros`, ...) — e sao os mesmos que o painel edita. Um
 * icone sem `title` nao desenha (nao inventa um beneficio).
 */
const ICONES: Record<string, LucideIcon> = {
  Truck,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
  Gift,
  Heart,
  Star,
  Sparkles,
  Package,
};

export function BenefitsBar({ benefits }: { benefits: Benefit[] }) {
  const itens = benefits.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  if (itens.length === 0) return null;

  return (
    <section className="border-y border-border bg-background">
      <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-6 md:grid-cols-5">
        {itens.map((b) => {
          const Icone = ICONES[b.iconName] ?? Truck;
          return (
            <div key={b.id} className="flex items-center gap-3">
              <Icone className="size-7 shrink-0 text-foreground/80" aria-hidden />
              <div>
                <div className="text-sm font-medium leading-tight">{b.title}</div>
                {b.description && (
                  <div className="text-xs text-muted-foreground">{b.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
