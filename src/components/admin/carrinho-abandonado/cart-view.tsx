'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/states';
import { getCartDataset } from '@/lib/carrinho-abandonado/data';
import type { CartDataset } from '@/lib/carrinho-abandonado/types';
import { CartConfigPanel } from './cart-config-panel';
import { CartStatsRow } from './cart-stats';
import { CartTable } from './cart-table';

/**
 * Tela de Carrinho Abandonado (`/admin/carrinho-abandonado`).
 *
 * RECONSTRUIDA DE adm-008 E adm-009, que sao A MESMA TELA vista em duas rolagens.
 *
 *   adm-008   os quatro KPIs e a tabela `Historico de Carrinhos`
 *   adm-009   a continuacao: o painel `Configuracoes` inteiro, ate o botao
 *             `SALVAR CONFIGURACOES`
 *
 * NAO SAO DUAS TELAS, e por isso nao ha abas aqui. O print adm-009 tem os quatro
 * cartoes cortados no topo, na mesma largura e na mesma posicao do adm-008 — e a
 * pagina rolada. Criar duas rotas (uma de historico e outra de configuracao)
 * seria partir em duas uma tela que a referencia apresenta inteira.
 *
 * O CABECALHO VEM DAQUI, e nao da casca — o que este comentario afirmava antes
 * estava ERRADO, e a correcao fica registrada.
 *
 * O comentario antigo dizia que o titulo e a descricao "ja vem da casca
 * (`AdminShell`), que le `description` de `nav.ts`". A casca NAO faz isso:
 * `admin-shell.tsx` desenha so o eyebrow `Painel Administrativo` e o `h1` do
 * topbar com o `currentLabel` — a `description` do `nav.ts` nao e lida em lugar
 * nenhum. O resultado e que a tela ficava SEM titulo no corpo.
 *
 * O TITULO E O DA CASCA, MAS A DESCRICAO NAO — e por isso os dois textos sairam
 * de fontes diferentes. O print adm-008 mostra:
 *
 *   Cabecalho do topo ................ Carrinho Abandonado
 *   Titulo do corpo .................. Carrinho Abandonado Automatico
 *   Descricao ........................ Recupere vendas perdidas com disparos
 *                                      automaticos de mensagens e incentivos.
 *
 * A `description` do `nav.ts` e OUTRA ("Recupere vendas interrompidas antes do
 * pagamento."), que nao aparece em nenhum print. O titulo do corpo tambem difere
 * do rotulo da sidebar. PRINT ATUAL VENCE: os textos aqui sao os do adm-008.
 *
 * (Mesmo defeito, sem a divergencia de texto, no CRM.)
 *
 * Repetir um `SectionHeader` aqui seria o titulo duas vezes — o defeito evitado
 * nas seis telas anteriores.
 *
 * A GRADE E 3 COLUNAS, com a tabela ocupando DUAS. E o que o print mostra: a
 * tabela e larga e o painel de configuracoes e uma coluna estreita a direita.
 * Em telas pequenas os dois empilham — a tabela primeiro, porque e o historico
 * que se consulta no dia a dia — e a tabela rola na horizontal em vez de
 * espremer cinco colunas num telefone.
 *
 * `getCartDataset` devolve OS TRES numa leitura so — carrinhos, KPIs e
 * configuracao. Os KPIs saem da mesma lista que a tabela desenha: separar faria
 * o topo contar uma lista e a tabela mostrar outra.
 */
export function CartView() {
  const [dataset, setDataset] = useState<CartDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getCartDataset();
        if (!alive) return;
        setDataset(result.data);
      } catch {
        if (alive) setError('Não foi possível carregar os carrinhos abandonados.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <SectionHeader
          title="Carrinho Abandonado Automático"
          description="Recupere vendas perdidas com disparos automáticos de mensagens e incentivos."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="surface h-28 animate-pulse" />
          ))}
        </div>
        <div className="surface p-6 sm:p-8">
          <TableSkeleton rows={3} columns={5} />
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <SectionHeader
          title="Carrinho Abandonado Automático"
          description="Recupere vendas perdidas com disparos automáticos de mensagens e incentivos."
        />
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-danger/40 bg-danger-surface/40 px-6 py-12 text-center"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-danger-surface text-danger-foreground">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-serif text-lg">{error ?? 'Não foi possível carregar os carrinhos.'}</p>
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
    <div className="space-y-6 lg:space-y-8 motion-safe:animate-fade-up">
      <SectionHeader
        title="Carrinho Abandonado Automático"
        description="Recupere vendas perdidas com disparos automáticos de mensagens e incentivos."
      />

      <CartStatsRow stats={dataset.stats} />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="surface overflow-hidden">
            <header className="border-b border-border/60 bg-secondary/30 px-6 py-4">
              <h2 className="font-serif text-lg">Histórico de Carrinhos</h2>
            </header>
            <CartTable rows={dataset.carts} />
          </div>
        </div>

        <div>
          {/* O `key` reinicia o rascunho do formulario quando a leitura chega:
              o painel copia `initial` para o estado na MONTAGEM, e so monta
              depois que `dataset` existe. */}
          <CartConfigPanel key={reloadKey} initial={dataset.config} />
        </div>
      </div>
    </div>
  );
}
