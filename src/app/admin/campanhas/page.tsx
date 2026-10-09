import type { Metadata } from 'next';
import { CampanhasView } from '@/components/admin/campanhas/campanhas-view';

export const metadata: Metadata = { title: 'Campanhas' };

/**
 * Campanhas — reconstruida de adm-006, adm-015, adm-016 e adm-017.
 *
 * UMA TELA, QUATRO ESTADOS:
 *
 *   adm-006   `0 campanha(s)`, a tabela so com o CABECALHO (sem a mensagem de
 *             vazio) e os dois cards vazios — e a LEITURA EM ANDAMENTO
 *   adm-015   a leitura concluida e as listas vazias: a tabela com `Nenhuma
 *             campanha ativa no momento.` e o card `Cupons mais usados` com
 *             `CLOSET10 · 0 usos`
 *   adm-016   o bloco `Nova Campanha` ABERTO entre o contador e a tabela —
 *             INLINE, e nao em modal, com a tabela visivel por baixo
 *   adm-017   a mesma tela rolada, com os dois cards de desempenho no fim
 *
 * A REFERENCIA DO PLACEHOLDER ANTERIOR ESTAVA ERRADA — o quinto caso do mesmo
 * defeito no projeto.
 *
 * Ele anunciava `references="adm-012"`. **adm-012 e a tela de CUPONS**, nao a de
 * Campanhas. O `MAPA-ADMIN.md` atribui a Campanhas `adm-006` e `adm-015` a
 * `adm-017`. O nome `Nova campanha` que o placeholder citava vinha do texto certo
 * e do numero errado.
 *
 * Aqui ha uma diferenca em relacao aos casos anteriores: o MAPA lista **adm-014**
 * como print de CUPONS, com a explicacao de que o card `Cupons mais usados` dela
 * mostra `CLOSET10 · 0 usos`, que e dado daquele modulo. Os quatro prints que
 * mostrei desta tela mostram que **adm-015** — e nao adm-014 — e que traz esse
 * mesmo card preenchido, ja dentro da tela de Campanhas. As duas coisas sao
 * verdadeiras e nao se contradizem: o MAPA atribuiu os prints pelo MODULO DONO DO
 * DADO (cupons), e nao pela tela que os exibe. O `references` desta pagina usa os
 * quatro prints que a tela realmente apresenta.
 *
 * O QUE O PLACEHOLDER ACERTOU: os tres blocos (o botao `Nova campanha` com o
 * contador, a tabela de cinco colunas e os dois paineis de desempenho). Os tres
 * vieram do print e os tres existem.
 *
 * ESTA TELA NAO E UM CRUD GENERICO. Ela tem exatamente o que os prints mostram:
 * uma tabela, um formulario e dois cards. Nao ha busca, nao ha filtro de status,
 * nao ha paginacao, nao ha aba — nenhum print mostra nada disso. E a ACAO DA
 * LINHA E SO `Editar`: o original nao tem `Excluir` em campanha, entao nenhum
 * botao de apagar foi inventado aqui (ao contrario de Cupons, onde `Excluir`
 * existe).
 *
 * A LISTA DE DEMONSTRACAO E VAZIA, e isso e fidelidade: **todos** os prints
 * mostram `0 campanha(s)`. Nao ha, em referencia nenhuma, uma campanha
 * preenchida. Ver `lib/campanhas/demo.ts` para a decisao e o motivo.
 *
 * A tela e um componente cliente porque tem estado de formulario. A pagina fica
 * como Server Component para poder, mais adiante, resolver a sessao e buscar a
 * primeira pagina no servidor.
 */
export default function CampanhasPage() {
  return <CampanhasView />;
}
