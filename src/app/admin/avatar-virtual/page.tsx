import type { Metadata } from 'next';
import { AvatarView } from '@/components/admin/provador/avatar-view';
import { getAvatar, getPieceDefaults, listSelectorData } from '@/lib/provador/data';
import { DEMO_POSITION_OPTIONS } from '@/lib/provador/demo';

export const metadata: Metadata = { title: 'Avatar Virtual' };

/**
 * `/admin/avatar-virtual` — reconstruida de adm-038 a adm-042.
 *
 * ================== RAIZ DO DEFEITO DE `references` (a nona ocorrencia) ==================
 *
 * Esta rota era servida pelo `ModulePage` com a faixa ERRADA:
 *
 *   dizia   `adm-049 a adm-051`
 *   certo   `adm-038 a adm-042`
 *
 * A faixa apontava ONZE prints adiante, para dentro de modulos que ainda nao
 * existem. A prova nao veio do `MAPA-ADMIN.md` sozinho (ele ja foi corrigido uma
 * vez e a correcao se apoiava numa pasta `_catalog/admin-0N.md` que nao existe
 * mais): veio do `estoque/page.tsx`, que registra que o placeholder ANTIGO citava
 * `adm-041 a adm-043 — que são Avatar Virtual e Provador Virtual`. Ou seja, o
 * proprio projeto ja dizia onde este modulo comeca. A conferencia foi fechada no
 * arquivo: `235503.png` e a tela `Avatar Virtual` com o titulo, as abas e o
 * `Gerenciador de Avatar`.
 *
 * O padrao das nove ocorrencias e o mesmo — cada modulo pegava um print do vizinho
 * e empurrava o proprio primeiro para o de cima, formando uma corrente deslocada.
 * `references` e atributo de EXIBICAO (nao aponta arquivo), entao um intervalo
 * errado nunca quebra nada e sobrevive. Ver a nota longa em
 * `financeiro/page.tsx`, que e onde o padrao foi descrito pela primeira vez.
 *
 * ================== O QUE A PAGINA FAZ ==================
 *
 * Componente de SERVIDOR: busca os dados e entrega a tela. Todo o estado (aba,
 * produto escolhido, rascunhos) vive no cliente, dentro de `AvatarView` — uma
 * pagina de servidor nao guarda estado entre interacoes.
 *
 * NADA AQUI CONECTA O NEON. `lib/provador/data.ts` devolve `persisted: false` e
 * a lista de pendencias de banco esta no fim daquele arquivo.
 */
export default async function AvatarVirtual_Page() {
  const [avatar, selecao, defaults] = await Promise.all([
    getAvatar(),
    listSelectorData(),
    getPieceDefaults(),
  ]);

  return (
    <AvatarView
      avatar={avatar.data}
      products={selecao.products}
      categories={selecao.categories}
      pieceDefaults={defaults.data}
      positionOptions={DEMO_POSITION_OPTIONS}
    />
  );
}
