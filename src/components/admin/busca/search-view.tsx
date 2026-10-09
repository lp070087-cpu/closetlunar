'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/form';
import { listSearchTerms } from '@/lib/busca/data';
import { DEFAULT_WINDOW, SEARCH_WINDOWS, emptySearchTerms, topSearchTerms } from '@/lib/busca/metrics';
import type { AggregatedTerm, SearchTermRow } from '@/lib/busca/types';
import { SearchPanel, SearchTip } from './search-panels';

/** As opções do `select` de período. Derivadas de `SEARCH_WINDOWS`, num lugar só. */
const WINDOW_OPTIONS = SEARCH_WINDOWS.map((days) => ({
  value: String(days),
  label: `Últimos ${days} dias`,
}));

/**
 * A tela de Busca (`/admin/busca`).
 *
 * ================== O TÍTULO E O PERÍODO FICAM NA MESMA LINHA ==================
 *
 * No print adm-068, `Relatórios de busca` está à esquerda e o `select` de período
 * à direita, na MESMA faixa (`flex items-center justify-between` no original). É
 * por isso que o `<h2>` e o `Select` vivem aqui, juntos — e não num `SectionHeader`,
 * que empilharia a descrição embaixo do título. O print não tem descrição do lado
 * do título.
 *
 * ================== POR QUE O PERÍODO É `30` POR PADRÃO ==================
 *
 * `235943.png` mostra `Últimos 30 dias` selecionado. É o valor de `DEFAULT_WINDOW`
 * (`metrics.ts`), usado tanto pela leitura quanto pelo `useState` — um padrão, num
 * lugar só. As três opções do `select` saem de `SEARCH_WINDOWS`: se alguém
 * acrescentar `14` lá, o `select` o mostra sozinho.
 *
 * ================== A TELA NÃO AGREGA NADA ==================
 *
 * Ela guarda as LINHAS CRUAS e passa por `topSearchTerms`/`emptySearchTerms`. O
 * agrupamento, a média e o corte de `avg === 0` são regras de `metrics.ts` — a
 * tela não os reimplementa, senão não haveria onde prová-los.
 */
export function SearchView() {
  const [days, setDays] = useState<number>(DEFAULT_WINDOW);
  const [rows, setRows] = useState<SearchTermRow[] | null>(null);

  useEffect(() => {
    let ativo = true;
    setRows(null); // trocar o período recomeça a leitura — sem número velho na tela
    listSearchTerms(days).then((resultado) => {
      if (ativo) setRows(resultado.data);
    });
    return () => {
      ativo = false;
    };
  }, [days]);

  const carregando = rows === null;
  const maisPesquisados: AggregatedTerm[] = rows ? topSearchTerms(rows) : [];
  const semResultado: AggregatedTerm[] = rows ? emptySearchTerms(rows) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl">Relatórios de busca</h2>
        <Select
          aria-label="Período"
          value={String(days)}
          onChange={(event) => setDays(Number(event.target.value))}
          options={WINDOW_OPTIONS}
          className="h-10 w-auto"
        />
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <SearchPanel
              title="Termos mais pesquisados"
              empty="Sem dados ainda."
              items={maisPesquisados}
            />
            <SearchPanel
              title="Buscas sem resultado"
              empty="Nenhuma — ótimo trabalho!"
              items={semResultado}
              tone="danger"
            />
          </div>
          <SearchTip />
        </>
      )}
    </div>
  );
}
