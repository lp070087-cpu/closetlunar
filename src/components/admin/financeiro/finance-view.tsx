'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Sparkles, Trophy, Wallet } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';
import { StatCard, StatGrid } from '@/components/ui/stats';
import { ErrorState, LoadingState, StatsSkeleton } from '@/components/ui/states';
import { formatBRL } from '@/lib/utils';
import type { Order } from '@/lib/pedidos/types';
import { getCosts, listFinancialOrders, saveCosts } from '@/lib/financeiro/data';
import { buildFinancePanel, rangeBounds } from '@/lib/financeiro/metrics';
import { DEMO_COSTS } from '@/lib/financeiro/demo';
import type { FinanceRange, FinancialCosts } from '@/lib/financeiro/types';
import { CostsCard } from './costs-card';
import { FinanceCharts } from './finance-charts';
import { ProfitBreakdown } from './profit-breakdown';
import { RangeFilter } from './range-filter';

/**
 * A tela de Financeiro (`/admin/financeiro`) — reconstruida de adm-023 e adm-024.
 *
 * OS DOIS PRINTS SAO A MESMA TELA, um por cima do outro:
 *
 *   adm-023   o topo: titulo, a linha de filtros com os dois botoes de
 *             exportacao a direita, os OITO KPIs em duas fileiras de quatro, e o
 *             comeco dos graficos
 *   adm-024   a mesma tela mais abaixo: os quatro graficos fechados (dois deles
 *             vazios), `Custos` e `Lucro estimado` lado a lado
 *
 * O TITULO E `Financeiro`, e nao o do menu — os dois coincidem aqui, e desta vez
 * sem a pegadinha de Carrinho Abandonado. A DESCRICAO existe e esta no print:
 * `Acompanhe seu faturamento, custos e lucratividade real.` O `nav.ts` traz
 * outra (`Entradas, custos, lucro e conciliacao de recebimentos.`), e o print
 * manda — e o mesmo caso ja registrado em Afiliadas.
 *
 * NAO HA BOTAO NO CABECALHO. As acoes desta tela sao os dois botoes de
 * EXPORTACAO, e eles ficam na linha dos filtros, a direita, e nao ao lado do
 * titulo.
 *
 * ================== A TELA NAO SOMA NADA ==================
 *
 * Todo numero que ela desenha vem de `buildFinancePanel` (`lib/financeiro`). A
 * tela escolhe a janela de datas e passa; nao ha uma segunda conta no JSX que
 * possa divergir da primeira. Ver o cabecalho daquela funcao.
 */
export function FinanceView() {
  const [range, setRange] = useState<FinanceRange>('this_month');
  const [custom, setCustom] = useState({ start: '', end: '' });

  /**
   * OS PEDIDOS E O RELOGIO DA CARGA, no MESMO estado — de proposito.
   *
   * O `agora` que alimenta o relatorio e capturado UMA vez, no momento da
   * leitura, e guardado junto com os pedidos. Se ele fosse um `new Date()` no
   * corpo do render, a janela do periodo e o "hoje" sairiam de instantes
   * diferentes — e na virada da meia-noite o periodo comecaria em um dia e o
   * "hoje" seria o outro. Guardado aqui, os dois vem do mesmo instante, e
   * recarregar a tela e o gesto que move o relogio.
   */
  const [dados, setDados] = useState<{ orders: Order[]; agora: Date } | null>(null);
  const [costs, setCosts] = useState<FinancialCosts>(DEMO_COSTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<'none' | 'unsaved'>('none');

  useEffect(() => {
    let vivo = true;
    (async () => {
      setLoading(true);
      setError(null);
      const agora = new Date();
      try {
        const [pedidos, custos] = await Promise.all([listFinancialOrders(), getCosts()]);
        if (!vivo) return;
        setDados({ orders: pedidos.data, agora });
        setCosts(custos.data);
      } catch {
        if (vivo) setError('Não foi possível carregar os dados financeiros.');
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [reloadKey]);

  /**
   * A JANELA E O PAINEL. Um periodo personalizado com data em branco cai no
   * `inicioDoDia(agora)` do `rangeBounds`, que e o comportamento do original: o
   * campo vazio nao zera a tela nem lanca.
   */
  const janela = useMemo(
    () => (dados ? rangeBounds(range, custom.start, custom.end, dados.agora) : null),
    [dados, range, custom.start, custom.end],
  );

  const painel = useMemo(
    () => (dados && janela ? buildFinancePanel(dados.orders, costs, janela, dados.agora) : null),
    [dados, janela, costs],
  );

  async function submitCosts(proximos: FinancialCosts) {
    setSaving(true);
    const resultado = await saveCosts(proximos);
    setSaving(false);
    // Os numeros PASSAM A VALER na tela — e o que faz a conta de lucro reagir ao
    // que foi digitado. O que nao se finge e a GRAVACAO, e e isso que o aviso do
    // `CostsCard` diz. Ver `data.ts`.
    setCosts(resultado.data);
    setOutcome(resultado.persisted ? 'none' : 'unsaved');
  }

  const cabecalho = (
    <SectionHeader
      title="Financeiro"
      description="Acompanhe seu faturamento, custos e lucratividade real."
    />
  );

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        {cabecalho}
        <StatsSkeleton count={8} />
        <LoadingState />
      </div>
    );
  }

  /**
   * OS DOIS GUARDADOS JUNTOS, e nao so o `painel`.
   *
   * `painel` so existe quando `dados` E `janela` existem, mas o TypeScript nao
   * consegue deduzir isso de um `useMemo` — para ele, `janela` continua sendo
   * `DateWindow | null` depois de `!painel` ser descartado. Testar os dois aqui e
   * o que estreita os dois, sem `!` nem cast: o `!` esconderia o caso real de
   * `janela === null` (com `dados` ainda em voo) e a tela quebraria em
   * `janela.days`.
   */
  if (error || !painel || !janela) {
    return (
      <div className="space-y-6 lg:space-y-8">
        {cabecalho}
        <ErrorState
          title={error ?? 'Não foi possível montar o relatório.'}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  const { slice, costs: conta } = painel;

  return (
    <div className="space-y-6 motion-safe:animate-fade-up">
      {cabecalho}

      <RangeFilter
        range={range}
        onRangeChange={setRange}
        customStart={custom.start}
        customEnd={custom.end}
        onCustomChange={(patch) => setCustom((atual) => ({ ...atual, ...patch }))}
      />

      {/*
        OS OITO KPIs, na ordem exata do print.

        A ORDEM NAO E A DE CALCULO: os tres faturamentos vem primeiro porque sao
        os mais olhados; as tres contagens ficam agrupadas no meio; o lucro fecha.
        Reagrupar por tipo (todo dinheiro junto, toda contagem junto) seria mais
        logico e menos fiel — os `StatCard` pareados do print estao alternados.
      */}
      <StatGrid columns={4}>
        <StatCard label="Faturamento total" value={formatBRL(painel.totalAll)} icon={Wallet} />
        <StatCard label="Faturamento do mês" value={formatBRL(painel.monthRev)} icon={Wallet} />
        <StatCard label="Faturamento de hoje" value={formatBRL(painel.todayRev)} icon={Wallet} />
        <StatCard label="Ticket médio" value={formatBRL(slice.avgTicket)} icon={Sparkles} />
        <StatCard label="Pedidos pagos" value={slice.paidCount} icon={ShoppingBag} />
        <StatCard label="Pedidos pendentes" value={slice.pendingCount} icon={ShoppingBag} />
        <StatCard label="Pedidos cancelados" value={slice.canceledCount} icon={ShoppingBag} />
        <StatCard label="Lucro estimado" value={formatBRL(conta.profit)} icon={Trophy} />
      </StatGrid>

      {/* Os quatro graficos, na ordem do print — a ordem mora no componente. */}
      <FinanceCharts
        sales={painel.sales}
        months={painel.months}
        payments={painel.payments}
        statuses={painel.statuses}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CostsCard costs={costs} onSave={submitCosts} saving={saving} outcome={outcome} />
        <ProfitBreakdown breakdown={conta} revenue={slice.revenue} days={janela.days} />
      </div>
    </div>
  );
}
