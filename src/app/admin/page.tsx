import type { Metadata } from 'next';
import { Heart, Package, ShoppingBag, Sparkles, UserPlus, Wallet } from 'lucide-react';
import { Card, CardContent, SectionHeader } from '@/components/ui/card';
import { StatCard, StatGrid } from '@/components/ui/stats';
import { StatusPill } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { formatBRL } from '@/lib/utils';
import { DEMO_DASHBOARD_STATS, DEMO_LOW_STOCK } from '@/lib/mock';

/**
 * Lista vazia e lista preenchida sao os dois ramos reais desta tela.
 *
 * O tipo anotado em `lib/mock.ts` (`DemoLowStock[]`) e o que permite comparar
 * `.length` com `0`: com `as const`, o `.length` de uma tupla fica fixado no
 * tipo literal e a comparacao reprova no typecheck (TS2367).
 *
 * O nome segue a pergunta que o ramo faz — "esta vazio?" —, e nao o estado
 * oposto, porque um `hasLowStock` verdadeiro aqui renderizaria a lista justo
 * quando ela nao tem itens.
 */
const lowStockIsEmpty = DEMO_LOW_STOCK.length === 0;

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Dashboard — reproduzido do print principal (adm-001 / adm-002).
 *
 * Ordem exata dos elementos: titulo serifado + saudacao, pill "Operação
 * Normal", 6 KPIs em duas fileiras (4 + 2) e, abaixo, os tres paineis de
 * acompanhamento. Os textos de estado vazio sao os mesmos da referencia
 * ("Sem vendas no período.", "Sem favoritos registrados.").
 */
export default function DashboardPage() {
  const stats = DEMO_DASHBOARD_STATS;

  return (
    <div className="space-y-8 lg:space-y-10 motion-safe:animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <SectionHeader
          title="Painel de Controle"
          description="Bem-vinda de volta ao centro de comando da Closet Lunna."
        />
        <StatusPill label="Operação Normal" tone="success" className="shrink-0" />
      </div>

      <StatGrid columns={4}>
        <StatCard label="Total de produtos" value={stats.products} icon={Package} />
        <StatCard label="Pedidos hoje" value={stats.ordersToday} hint="desde 00:00" icon={ShoppingBag} />
        <StatCard label="Receita do mês" value={formatBRL(stats.revenueMonth)} icon={Wallet} />
        <StatCard
          label="Lucro estimado"
          value={formatBRL(stats.profitMonth)}
          hint={`margem média ${stats.profitMargin}%`}
          icon={Sparkles}
        />
        <StatCard label="Leads captados" value={stats.leads} icon={UserPlus} />
        <StatCard
          label="Estoque baixo"
          value={stats.lowStock}
          hint="≤ 5 unidades"
          icon={Package}
          tone="danger"
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg">Mais vendidos (60 dias)</h3>
              <ShoppingBag className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-xs text-muted-foreground">Sem vendas no período.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg">Mais favoritados</h3>
              <Heart className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-xs text-muted-foreground">Sem favoritos registrados.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg">Produtos com estoque baixo</h3>
            <Package className="size-4 text-muted-foreground" aria-hidden />
          </div>
          {lowStockIsEmpty ? (
            <EmptyState title="Nenhum produto com estoque baixo." icon={Package} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {DEMO_LOW_STOCK.map((product) => (
                <li
                  key={product.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3"
                >
                  <span className="truncate text-sm font-medium">{product.name}</span>
                  <span className="shrink-0 rounded-full bg-warning-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-warning-foreground">
                    {product.stock} un.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
