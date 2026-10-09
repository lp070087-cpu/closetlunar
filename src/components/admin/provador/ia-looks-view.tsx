'use client';

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/card';
import { SegmentedTabs } from '@/components/ui/tabs';
import { AiSettingsPanel, AiSuggestionsPanel } from './ai-panels';
import type { Product } from '@/lib/produtos/types';
import type { AiSettings, ManualSuggestion } from '@/lib/provador/types';

type Aba = 'manuais' | 'config';

/**
 * AS DUAS ABAS DE `IA de Looks` — adm-047/048/049 (sugestoes) e adm-050 (config).
 *
 * ================== A PAGINA NAO TEM SUBTITULO ==================
 *
 * Conferido no pixel (`235632.png`): embaixo do titulo `IA de Looks` vem direto a
 * barra de abas. O placeholder dizia
 * `Combinações sugeridas automaticamente para a cliente.` — texto que nao esta em
 * print nenhum. Como nao ha subtitulo, `SectionHeader` sai sem `description`.
 *
 * ================== ESTE ARQUIVO E A FAIXA, E SO ==================
 *
 * Cada aba tem um painel inteiro, com estado proprio, e os dois moram em
 * `ai-panels.tsx` (`AiSuggestionsPanel` e `AiSettingsPanel`). Aqui fica a faixa e a
 * escolha entre eles — que e o que esta tela de fato e. A razao esta escrita la:
 * painel preso atras de um clique nao da para conferir sem navegador.
 *
 * ================== A LISTA DOS DOIS `SELECT` VEM DO CATALOGO ==================
 *
 * Os campos do painel da aba 1 listam os produtos que chegam por prop — derivados
 * de `lib/produtos`, o mesmo JOIN do seletor das outras duas telas. E a mesma
 * decisao; ver o bloco `O DONO DA LISTA` em `metrics.ts`, que registra que o
 * dropdown da IA e um DOS DOIS prints que discordam entre si sobre qual e a nona
 * peca.
 */
export function IALooksView({
  products,
  suggestions,
  settings,
}: {
  products: Product[];
  suggestions: ManualSuggestion[];
  settings: AiSettings;
}) {
  const [aba, setAba] = useState<Aba>('manuais');

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="IA de Looks" />

      <SegmentedTabs
        items={[
          { value: 'manuais' as Aba, label: 'Sugestões manuais' },
          { value: 'config' as Aba, label: 'Configurações da IA' },
        ]}
        value={aba}
        onChange={setAba}
      />

      {aba === 'manuais' ? (
        <AiSuggestionsPanel products={products} suggestions={suggestions} />
      ) : (
        <AiSettingsPanel settings={settings} />
      )}
    </div>
  );
}
