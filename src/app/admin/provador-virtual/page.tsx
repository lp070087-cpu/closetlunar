import type { Metadata } from 'next';
import { ProvadorView } from '@/components/admin/provador/provador-view';
import { getPieceDefaults, getUsage, listSelectorData } from '@/lib/provador/data';
import { DEMO_POSITION_OPTIONS } from '@/lib/provador/demo';

export const metadata: Metadata = { title: 'Provador Virtual' };

/**
 * `/admin/provador-virtual` — reconstruida de adm-043 a adm-046.
 *
 * ================== DECIMA OCORRENCIA DO DEFEITO DE `references` ==================
 *
 * Esta rota era servida pelo `ModulePage` com a faixa ERRADA:
 *
 *   dizia   `adm-052 a adm-055`
 *   certo   `adm-043 a adm-046`
 *
 * Nove prints adiante, tambem apontando para modulos ainda inexistentes.
 * CONFERIDO no arquivo: `235557.png` abre com o titulo `Provador Virtual` e as
 * tres abas `IMAGENS DAS PEÇAS`, `LOOKS SALVOS` e `ANALYTICS` — e o
 * `235626.png` e o mesmo modulo com o dropdown `POSIÇÃO` aberto.
 *
 * ================== A ABA `LOOKS SALVOS` ESTA NO PRIMEIRO PRINT ==================
 *
 * Um detalhe que engana: `235557.png` e `235626.png` mostram `IMAGENS DAS PEÇAS`
 * ATIVA, e `235608.png` mostra `LOOKS SALVOS` ativa. Nao sao dois modulos — e o
 * mesmo, em abas diferentes. Por isso a faixa correta e um intervalo CONTINUO
 * (`adm-043 a adm-046`) e nao uma lista.
 *
 * ================== O QUE A PAGINA FAZ ==================
 *
 * Componente de SERVIDOR: busca e entrega. O estado da aba vive no cliente, em
 * `ProvadorView`. NADA AQUI CONECTA O NEON — ver a lista de pendencias no fim de
 * `lib/provador/data.ts`.
 */
export default async function ProvadorVirtual_Page() {
  const [selecao, defaults, uso] = await Promise.all([
    listSelectorData(),
    getPieceDefaults(),
    getUsage(),
  ]);

  return (
    <ProvadorView
      products={selecao.products}
      categories={selecao.categories}
      pieceDefaults={defaults.data}
      positionOptions={DEMO_POSITION_OPTIONS}
      usage={uso.data}
    />
  );
}
