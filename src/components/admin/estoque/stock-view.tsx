'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { SearchInput } from '@/components/ui/form';
import { StatsSkeleton, TableSkeleton } from '@/components/ui/states';
import {
  DEMO_RESPONSIBLE,
  filterMovements,
  listReasonOptions,
  listStockMovements,
  listStockRows,
  saveStockAdjustment,
  type MovementFilter,
} from '@/lib/estoque/data';
import {
  applyAdjustment,
  buildStockRow,
  filterRows,
  summarizeStock,
} from '@/lib/estoque/metrics';
import type { Product } from '@/lib/produtos/types';
import type {
  ReasonOption,
  StockAdjustment,
  StockMovement,
  StockRow,
} from '@/lib/estoque/types';
import { MovementHistory } from './movement-history';
import { StockAdjustModal } from './stock-adjust-modal';
import { StockStatsGrid } from './stock-stats';
import { StockTable } from './stock-table';

/**
 * Tela de Estoque (`/admin/estoque`) — reconstruida de adm-028 e adm-029.
 *
 * DOIS BLOCOS, NA ORDEM DO PRINT:
 *
 *   1. os quatro indicadores + a busca + a tabela de estoque (adm-028);
 *   2. o Historico de Movimentacoes, com os chips de filtro (adm-029).
 *
 * Este arquivo e o DONO DO ESTADO: ele carrega, busca, filtra, ajusta e trata
 * carregamento/erro. O desenho de cada bloco mora nos componentes ao lado, que
 * sao apresentacionais — e e isso que permite a bancada renderizar cada bloco com
 * dados e conferir o cabecalho sem navegador.
 *
 * CABECALHO: a tela NAO desenha titulo grande nem subtitulo, porque o print
 * tambem nao. O eyebrow `PAINEL ADMINISTRATIVO` e o `<h1>Estoque` ja vem da
 * casca (`AdminShell`). Repetir um `<h2>Estoque</h2>` aqui seria o defeito mais
 * facil de todos: a tela ficaria com o titulo duas vezes.
 *
 * O QUE ESTA TELA NAO TEM, E POR QUE
 *
 * O pedido da fase citava "quantidades por tamanho". Nao existe quantidade por
 * tamanho em print nenhum: a coluna `TAM.` aparece na tabela e no historico, mas
 * SEMPRE com `—`. O estoque tem UM nivel de quantidade — Produto, e Cor quando a
 * peca tem cor. Criar um nivel de tamanho aqui seria inventar a tela inteira.
 *
 * Toda leitura passa por `@/lib/estoque/data`. Nada e persistido, e a tela diz
 * isso nos avisos — nao ha simulacao de gravacao.
 */
export function StockView() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [reasons, setReasons] = useState<ReasonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('todas');

  /** A linha que o `Ajuste Geral` abriu, e a sobreposicao do produto por tras. */
  const [adjustingRow, setAdjustingRow] = useState<StockRow | null>(null);
  /**
   * As sobreposicoes de cor que o ajuste criou NESTA sessao, por id de produto.
   *
   * O estoque nao e persistido, entao nao ha de onde reler o produto depois de
   * ajustar. Em vez de reescrever a tabela inteira a partir de um `Product`
   * sintetizado — que apagaria a divergencia de `demo.ts` e faria `top` perder as
   * cores do print —, a tela guarda SO o que o ajuste mudou e o total derivado.
   * E o minimo que mantem tabela, KPI e historico contando a mesma coisa.
   */
  const [overrides, setOverrides] = useState<
    Record<string, { total: number; variations: StockRow['variations'] }>
  >({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [rowsResult, movementsResult, reasonsResult] = await Promise.all([
          listStockRows(),
          listStockMovements(),
          listReasonOptions(),
        ]);
        if (!alive) return;
        setRows(rowsResult.data);
        setMovements(movementsResult.data);
        setReasons(reasonsResult.data);
      } catch {
        if (alive) setError('Não foi possível carregar o estoque.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  /** As linhas com os ajustes da sessao ja aplicados. */
  const effectiveRows = useMemo(
    () =>
      rows.map((row) => {
        const override = overrides[row.productId];
        if (!override) return row;
        return { ...row, total: override.total, variations: override.variations };
      }),
    [rows, overrides],
  );

  const visibleRows = useMemo(() => filterRows(effectiveRows, search), [effectiveRows, search]);

  /**
   * Os KPIs contam as linhas JA ajustadas, e nao as carregadas no inicio.
   *
   * Se contassem as originais, ajustar `Kit Nike` de 1 para 10 deixaria o numero
   * 10 na tabela e `BAIXO ESTOQUE 2` no topo — a tela se contradizendo. O mesmo
   * vale para `MOVIMENTAÇÕES`, que soma os lancamentos da sessao.
   */
  const stats = useMemo(
    () => summarizeStock(effectiveRows, movements),
    [effectiveRows, movements],
  );

  const visibleMovements = useMemo(
    () => filterMovements(movements, movementFilter),
    [movements, movementFilter],
  );

  /**
   * Aplica o ajuste.
   *
   * A quantidade nova vai para a tabela E para o historico, de uma vez. Se so a
   * tabela mudasse, o numero pularia sem explicacao; se so o historico ganhasse a
   * linha, ela apontaria para um estoque que nao mudou.
   *
   * O `Product` montado aqui existe so para `applyAdjustment` saber onde escrever
   * — a tela nao le nada dele de volta. As cores da linha entram como `colors`
   * para que ajustar uma cor nao apague as outras.
   */
  async function submitAdjustment(adjustment: StockAdjustment) {
    const row = rows.find((item) => item.productId === adjustment.productId);
    if (!row) return;

    const current = overrides[adjustment.productId] ?? {
      total: row.total,
      variations: row.variations,
    };

    const nextVariations =
      adjustment.colorId === null
        ? current.variations
        : current.variations.map((variation) =>
            variation.colorId === adjustment.colorId
              ? { ...variation, quantity: adjustment.quantity }
              : variation,
          );

    const synthetic: Product = {
      id: row.productId,
      name: row.name,
      slug: '',
      description: '',
      categoryId: '',
      price: 0,
      costPrice: 0,
      promoPrice: null,
      compareAtPrice: null,
      images: [],
      colors: nextVariations.map((variation) => ({
        id: variation.colorId,
        name: variation.name,
        hex: variation.hex ?? '',
        // `applyAdjustment` so le `id` e `stock`; as imagens da cor sao do
        // cadastro de Produtos e nao tem o que fazer nesta tela.
        images: [],
        stock: variation.quantity,
      })),
      sizes: [],
      stock: adjustment.colorId === null ? adjustment.quantity : current.total,
      status: 'active',
      featured: false,
      createdAt: '',
      updatedAt: '',
    };

    const updated = applyAdjustment(synthetic, adjustment);
    const total =
      adjustment.colorId === null
        ? adjustment.quantity
        : nextVariations.reduce((sum, variation) => sum + variation.quantity, 0);

    setOverrides((current) => ({
      ...current,
      [adjustment.productId]: {
        total,
        variations: updated.colors.map((color) => ({
          colorId: color.id,
          name: color.name,
          hex: color.hex || null,
          quantity: color.stock ?? 0,
        })),
      },
    }));

    const colorName =
      adjustment.colorId === null
        ? null
        : (nextVariations.find((variation) => variation.colorId === adjustment.colorId)?.name ??
          null);

    try {
      const result = await saveStockAdjustment(adjustment, {
        id: `mv-${adjustment.productId}-${Date.now()}`,
        at: new Date().toISOString(),
        productName: row.name,
        colorName,
        responsible: DEMO_RESPONSIBLE,
      });
      setMovements((current) => [result.data, ...current]);
      setNotice(
        result.persisted
          ? 'Ajuste registrado.'
          : 'Ajuste aplicado nesta sessão e lançado no histórico. A gravação no banco entra na fase de integração.',
      );
    } catch {
      setNotice('Não foi possível registrar o ajuste. Tente novamente.');
    } finally {
      setAdjustingRow(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <StatsSkeleton count={4} />
        <div className="surface p-6 sm:p-8 lg:p-10">
          <TableSkeleton rows={6} columns={5} />
        </div>
        <div className="surface p-6 sm:p-8 lg:p-10">
          <TableSkeleton rows={3} columns={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 motion-safe:animate-fade-up">
      {/* Aviso honesto sobre a origem dos dados e o que foi feito na sessao */}
      {notice ? (
        <p
          role="status"
          className="rounded-2xl border border-warning-surface bg-warning-surface/50 px-4 py-3 text-xs font-medium text-warning-foreground"
        >
          {notice}
        </p>
      ) : null}

      <StockStatsGrid stats={stats} />

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/60 p-5 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar produto ou SKU..."
            className="sm:max-w-md sm:flex-1"
            aria-label="Buscar produto ou SKU"
          />
          {/* O botao quadrado com o relogio, a direita do campo, e do print.
              Ele ainda nao abre nada: nao ha print da busca por historico. */}
          <button
            type="button"
            disabled
            title="Histórico de buscas — sem tela de referência"
            aria-label="Histórico de buscas"
            className="focus-ring grid size-12 shrink-0 cursor-not-allowed place-items-center rounded-xl border border-input bg-background text-muted-foreground opacity-60"
          >
            <Clock className="size-4" aria-hidden />
          </button>
        </div>

        <StockTable
          rows={visibleRows}
          onAdjust={setAdjustingRow}
          hasFilter={search.trim().length > 0}
        />
      </div>

      <MovementHistory
        movements={visibleMovements}
        filter={movementFilter}
        onFilterChange={setMovementFilter}
      />

      <StockAdjustModal
        open={adjustingRow !== null}
        row={adjustingRow}
        reasons={reasons}
        onClose={() => setAdjustingRow(null)}
        onSubmit={submitAdjustment}
      />
    </div>
  );
}
