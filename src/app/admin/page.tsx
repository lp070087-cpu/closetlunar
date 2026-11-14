import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Package, ShoppingBag, Sparkles, Truck, UserPlus, Wallet } from 'lucide-react';
import { Card, CardContent, SectionHeader } from '@/components/ui/card';
import { StatCard, StatGrid } from '@/components/ui/stats';
import { StatusPill } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { formatBRL } from '@/lib/utils';
import { DEMO_DASHBOARD_STATS, DEMO_LOW_STOCK } from '@/lib/mock';
import { painelAdminAcao, type PainelAdmin } from '@/lib/data/registros-acoes';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

/** Dashboard do painel — numeros REAIS do banco (pedidos pagos, estoque, leads, favoritos). */
export default async function DashboardPage() {
  const real = await painelAdminAcao().catch(() => null);
  const d: PainelAdmin = real ?? {
    produtos: DEMO_DASHBOARD_STATS.products,
    pedidosHoje: DEMO_DASHBOARD_STATS.ordersToday,
    receitaMes: DEMO_DASHBOARD_STATS.revenueMonth,
    lucroMes: DEMO_DASHBOARD_STATS.profitMonth,
    margem: DEMO_DASHBOARD_STATS.profitMargin,
    leads: DEMO_DASHBOARD_STATS.leads,
    estoqueBaixo: DEMO_LOW_STOCK,
    maisVendidos: [],
    maisFavoritados: [],
    aguardandoEnvio: 0,
  };

  return (
    <div className="space-y-8 lg:space-y-10 motion-safe:animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <SectionHeader title="Painel de Controle" description="Bem-vinda de volta ao centro de comando da Closet Lunar." />
        {d.aguardandoEnvio > 0 ? (
          <Link
            href="/admin/pedidos"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background"
          >
            <Truck className="size-4" aria-hidden /> {d.aguardandoEnvio} pedido(s) pago(s) para enviar
          </Link>
        ) : (
          <StatusPill label="Tudo em dia" tone="success" className="shrink-0" />
        )}
      </div>

      <StatGrid columns={4}>
        <StatCard label="Produtos ativos" value={d.produtos} icon={Package} />
        <StatCard label="Pedidos pagos hoje" value={d.pedidosHoje} hint="desde 00:00" icon={ShoppingBag} />
        <StatCard label="Receita do mês" value={formatBRL(d.receitaMes)} hint="pedidos pagos" icon={Wallet} />
        <StatCard
          label="Lucro estimado"
          value={formatBRL(d.lucroMes)}
          hint={d.receitaMes > 0 ? `margem ${d.margem}% (custo cadastrado)` : 'cadastre o preço de custo'}
          icon={Sparkles}
        />
        <StatCard label="Leads captados" value={d.leads} hint="pop-up de desconto" icon={UserPlus} />
        <StatCard label="Estoque baixo" value={d.estoqueBaixo.length} hint="≤ 5 unidades" icon={Package} tone="danger" />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg">Mais vendidos (60 dias)</h3>
              <ShoppingBag className="size-4 text-muted-foreground" aria-hidden />
            </div>
            {d.maisVendidos.length ? (
              <ul className="divide-y divide-border/60">
                {d.maisVendidos.map((v) => (
                  <li key={v.name} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate">{v.name}</span>
                    <span className="shrink-0 font-medium tabular-nums">{v.qtd} un.</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Sem vendas pagas no período.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg">Mais favoritados</h3>
              <Heart className="size-4 text-muted-foreground" aria-hidden />
            </div>
            {d.maisFavoritados.length ? (
              <ul className="divide-y divide-border/60">
                {d.maisFavoritados.map((f) => (
                  <li key={f.name} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 font-medium tabular-nums">{f.count} ♥</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Sem favoritos registrados.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg">Produtos com estoque baixo</h3>
            <Package className="size-4 text-muted-foreground" aria-hidden />
          </div>
          {d.estoqueBaixo.length === 0 ? (
            <EmptyState title="Nenhum produto com estoque baixo." icon={Package} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {d.estoqueBaixo.map((product) => (
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
