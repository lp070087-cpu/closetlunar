import type { Metadata } from 'next';
import { SearchView } from '@/components/admin/busca/search-view';

export const metadata: Metadata = {
  title: 'Busca',
};

/**
 * `/admin/busca` — reconstruída de adm-068.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (período e as
 * linhas lidas) vive em `SearchView`.
 *
 * ================== DÉCIMA PRIMEIRA OCORRÊNCIA DO DEFEITO DE `references` ==================
 *
 * A rota era servida pelo `ModulePage` com a faixa `adm-067 a adm-068`. O certo é
 * **`adm-068`** — só ele. O `adm-067` é o print de FAVORITOS, e a faixa o
 * reivindicava aqui também: o módulo de cima cedendo o próprio print para baixo.
 * É o mesmo defeito de Relatórios (`adm-062 a adm-065`) e de Favoritos (`adm-066`),
 * agora pelo lado oposto — nos outros casos o módulo puxava o print de cima para
 * si; aqui ele estende a faixa para trás e toma o de cima. CONFERIDO na pasta:
 * `235943` é o print de Busca.
 *
 * ================== OS BLOCOS INVENTADOS ==================
 *
 * O placeholder listava TRÊS seções:
 *
 *   `Termos mais buscados`   existe, com outro nome: `Termos mais pesquisados`;
 *   `Buscas sem resultado`   existe;
 *   `Sugestões`              NÃO EXISTE em print nenhum. "Ações rápidas a partir
 *                            do termo pesquisado" era invenção a partir do nome
 *                            da tela — a tela real é só as duas listas e a dica.
 *
 * Os nomes também foram corrigidos para os do print: `Termos mais PESQUISADOS`,
 * não "buscados". É o vocabulário do material, e não o que o placeholder supôs.
 */
export default function Busca_Page() {
  return <SearchView />;
}
