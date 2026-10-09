import type { Metadata } from 'next';
import { IALooksView } from '@/components/admin/provador/ia-looks-view';
import { getAiSettings, listSelectorData, listSuggestions } from '@/lib/provador/data';

export const metadata: Metadata = { title: 'IA de Looks' };

/**
 * `/admin/ia-looks` — reconstruida de adm-047 a adm-050.
 *
 * ================== DECIMA PRIMEIRA OCORRENCIA DO DEFEITO DE `references` ==================
 *
 * Esta rota era servida pelo `ModulePage` com a faixa ERRADA:
 *
 *   dizia   `adm-056 a adm-058`
 *   certo   `adm-047 a adm-050`
 *
 * Nove prints adiante. CONFERIDO no arquivo: `235632.png` e a tela `IA de Looks`
 * com as abas `SUGESTÕES MANUAIS` e `CONFIGURAÇÕES DA IA`, e o `235711.png` e a
 * aba `CONFIGURAÇÕES DA IA` com `Prioridades da Consultora Virtual`.
 *
 * ================== O DROPDOWN DESTA TELA E METADE DA CONTRADICAO ==================
 *
 * Os dois `SELECT` desta tela listam, no print, uma nona peca DIFERENTE da que o
 * seletor de Avatar/Provador Virtual lista: aqui aparece `Top Essential
 * Sustentação` e NAO aparece `Macaquinho`; la e o inverso. As duas listas incluem
 * `Conjunto Glow Nude`, que nao existe no catalogo.
 *
 * Nenhuma tela arbitra isso: as tres usam o MESMO JOIN sobre `lib/produtos`, e as
 * duas divergencias contra os prints estao registradas por extenso em
 * `lib/provador/metrics.ts` (`O DONO DA LISTA`) e vao para o relatorio final.
 *
 * ================== O QUE A PAGINA FAZ ==================
 *
 * Componente de SERVIDOR: busca e entrega. A tabela de sugestoes chega VAZIA
 * (`DEMO_SUGGESTIONS`), que e o que o print mostra: quatro cabecalhos e nenhuma
 * linha. NADA AQUI CONECTA O NEON.
 */
export default async function IaLooks_Page() {
  const [selecao, sugestoes, config] = await Promise.all([
    listSelectorData(),
    listSuggestions(),
    getAiSettings(),
  ]);

  return (
    <IALooksView
      products={selecao.products}
      suggestions={sugestoes.data}
      settings={config.data}
    />
  );
}
