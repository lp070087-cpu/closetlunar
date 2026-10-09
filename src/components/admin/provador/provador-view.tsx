'use client';

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/card';
import { SegmentedTabs } from '@/components/ui/tabs';
import { PieceWorkspace } from './piece-workspace';
import { ProvadorInsights } from './provador-insights';
import type { Category, Product } from '@/lib/produtos/types';
import type { PieceDefaults, PiecePosition, ProvadorUsage } from '@/lib/provador/types';

type Aba = 'imagens' | 'looks' | 'analytics';

/**
 * AS TRES ABAS DE `Provador Virtual` — adm-043/046, adm-044 e adm-045.
 *
 * ================== AS ABAS SAO `SegmentedTabs` ==================
 *
 * Conferido no pixel (`235557.png`): trilho claro, `IMAGENS DAS PEÇAS` em pilula
 * preta, `LOOKS SALVOS` e `ANALYTICS` em texto solto dentro do trilho, sem borda
 * propria. E o `SegmentedTabs` compartilhado.
 *
 * ================== A ABA 1 E O MESMO PAR DE `Avatar Virtual` ==================
 *
 * `IMAGENS DAS PEÇAS` aqui e `VINCULAR PRODUTOS` la: as duas renderizam
 * `PieceWorkspace`, que e o que garante que as duas tenham o mesmo comportamento
 * — e nao so a mesma aparencia. Ver a nota no componente.
 *
 * ================== A PAGINA NAO TEM SUBTITULO PROPRIO ==================
 *
 * O print mostra o titulo da secao (`Provador Virtual — Imagens das peças`, com a
 * descricao do PNG) e, nas outras abas, os seus proprios titulos. NAO existe um
 * subtitulo geral da pagina — o placeholder dizia
 * `Camadas, encaixes e calibragem da prova virtual.`, que nao esta em print
 * nenhum. Por isso o `SectionHeader` sai sem `description`.
 */
export function ProvadorView({
  products,
  categories,
  pieceDefaults,
  positionOptions,
  usage,
}: {
  products: Product[];
  categories: Category[];
  pieceDefaults: PieceDefaults;
  positionOptions: { value: PiecePosition; label: string }[];
  usage: ProvadorUsage;
}) {
  const [aba, setAba] = useState<Aba>('imagens');

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Provador Virtual" />

      <SegmentedTabs
        items={[
          { value: 'imagens' as Aba, label: 'Imagens das peças' },
          { value: 'looks' as Aba, label: 'Looks salvos' },
          { value: 'analytics' as Aba, label: 'Analytics' },
        ]}
        value={aba}
        onChange={setAba}
      />

      {aba === 'imagens' ? (
        <PieceWorkspace
          products={products}
          categories={categories}
          pieceDefaults={pieceDefaults}
          positionOptions={positionOptions}
        />
      ) : (
        <ProvadorInsights aba={aba} usage={usage} />
      )}
    </div>
  );
}
