'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';
import { StatsSkeleton, TableSkeleton } from '@/components/ui/states';
import {
  listOrders,
  listTabCounts,
  listTrackedOrders,
  type OrdersTab,
} from '@/lib/pedidos/data';
import type { Order } from '@/lib/pedidos/types';
import { OrdersList } from './orders-list';
import { OrdersTabs } from './orders-tabs';
import { TrackingTable } from './tracking-table';

/**
 * Tela de Pedidos (`/admin/pedidos`) — reconstruida de adm-003 e adm-004.
 *
 * UMA TELA, DUAS ABAS. E a estrutura do print, e nao uma escolha: o titulo e o
 * mesmo, a sidebar e a mesma, e o que muda entre adm-003 e adm-004 e so a aba
 * ativa e o corpo. Por isso as duas visoes vivem aqui, atras de um unico
 * `useState<OrdersTab>` — e nao em duas rotas.
 *
 *   `Todos`          lista de CARTOES, um por pedido (adm-003)
 *   `Rastreamento`   TABELA de seis colunas (adm-004)
 *
 * O CABECALHO. O print tem, no topo do conteudo, um titulo `Pedidos` grande em
 * serifado, com as duas abas ancoradas a DIREITA, na mesma linha. E o
 * `SectionHeader` do design system, que ja desenha exatamente esse par
 * titulo/acao — o mesmo que as outras telas do painel usam.
 *
 * A tela NAO desenha o eyebrow `PAINEL ADMINISTRATIVO` nem um segundo `<h1>`:
 * os dois ja vem da casca (`AdminShell`), que le o rotulo do item de menu ativo.
 * Repetir aqui seria o defeito mais facil de todos — o titulo duas vezes.
 *
 * O QUE ESTA TELA NAO TEM, E POR QUE
 *
 * Nao ha busca, filtro, paginacao, ordenacao por coluna, modal de detalhe nem
 * botao de acao. O catalogo e explicito: "Sem filtros de busca, sem paginacao,
 * sem modais" (adm-003) e "Sem filtros, sem modais" (adm-004). A unica acao
 * prevista — alterar status, lancar rastreio, imprimir — nao tem print nenhum,
 * e por isso NAO foi desenhada; ver `ORDER_ACTIONS` em `lib/pedidos/demo.ts`.
 *
 * Toda leitura passa por `@/lib/pedidos/data`. Nada e persistido, e a tela nao
 * oferece nenhuma escrita.
 */
export function OrdersView() {
  const [tab, setTab] = useState<OrdersTab>('todos');
  const [orders, setOrders] = useState<Order[]>([]);
  const [tracked, setTracked] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<OrdersTab, number>>({ todos: 0, rastreamento: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // As DUAS abas sao carregadas de uma vez, e nao ao trocar de aba: o
        // contador `(N)` do chip precisa do numero das duas antes de qualquer
        // clique, e trocar de aba nao deve piscar esqueleto outra vez.
        const [ordersResult, trackedResult, countsResult] = await Promise.all([
          listOrders(),
          listTrackedOrders(),
          listTabCounts(),
        ]);
        if (!alive) return;
        setOrders(ordersResult.data);
        setTracked(trackedResult.data);
        setCounts(countsResult.data);
      } catch {
        if (alive) setError('Não foi possível carregar os pedidos.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  /**
   * Qual corpo desenhar. As duas listas ja vem montadas da camada de dados, com
   * a ordenacao e o filtro aplicados — a tela so escolhe qual mostrar, e nao
   * refiltra. Refiltrar aqui criaria um segundo lugar onde "quem aparece na aba
   * Rastreamento" e decidido, e os dois divergiriam.
   */
  const body = useMemo(() => (tab === 'todos' ? orders : tracked), [tab, orders, tracked]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Header tabs={<OrdersTabs value={tab} onChange={setTab} counts={counts} />} />
        <StatsSkeleton count={4} />
        <TableSkeleton rows={4} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header tabs={<OrdersTabs value={tab} onChange={setTab} counts={counts} />} />
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-danger/40 bg-danger-surface/40 px-6 py-12 text-center"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-danger-surface text-danger-foreground">
            <Clock className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-serif text-lg">{error}</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Tente novamente em instantes. Se persistir, verifique a conexão com o banco de dados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="focus-ring rounded-full border border-border bg-background px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em]"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 motion-safe:animate-fade-up">
      <Header tabs={<OrdersTabs value={tab} onChange={setTab} counts={counts} />} />
      {tab === 'todos' ? (
        <OrdersList orders={body} />
      ) : (
        <TrackingTable orders={body} />
      )}
    </div>
  );
}

/**
 * O titulo + as abas, ancorados nos dois extremos da mesma linha.
 *
 * Extraido porque aparece nos TRES estados (carregando, erro, pronto). Se
 * ficasse copiado, o cabecalho do estado de erro divergiria do normal sem
 * ninguem ver — e o mesmo defeito que as outras telas do painel ja resolveram
 * com um componente.
 */
function Header({ tabs }: { tabs: React.ReactNode }) {
  return <SectionHeader title="Pedidos" action={tabs} />;
}
