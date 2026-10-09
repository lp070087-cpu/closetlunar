/**
 * Tipos de Usuários / Admins (`/admin/usuarios`) — adm-085.
 *
 * ================== A TELA É UMA LISTA SÓ, SEM COLUNAS E SEM BOTÃO ==================
 *
 * O print mostra um cartão com TRÊS linhas e nada mais: um círculo com as duas
 * primeiras letras do papel (`AD`, `US`, `SU`), o papel em maiúsculas e o `user_id`
 * embaixo. NÃO há cabeçalho de tabela, NÃO há botão de convidar, editar ou excluir,
 * e NÃO há barra de busca.
 *
 * ================== O QUE O PLACEHOLDER PROMETIA E NÃO EXISTE ==================
 *
 * O placeholder listava três blocos: "Lista de usuários" (nome, e-mail, papel e
 * último acesso), "Convite" (com os papéis SUPER_ADMIN, ADMIN, EDITOR e
 * ATENDIMENTO) e "Permissões" (o que cada papel pode ver).
 *
 *   "Convite"       NÃO existe. Nenhum print mostra formulário, botão ou modal de
 *                   convite — nem no original, que só LÊ a tabela `user_roles`.
 *                   Os papéis `EDITOR` e `ATENDIMENTO` também não aparecem em
 *                   lugar nenhum: os três do print são `ADMIN`, `USER` e
 *                   `SUPER_ADMIN`. Não foram inventados.
 *   "Permissões"    NÃO existe. Não há tela que descreva o que cada papel pode.
 *
 * O que sobra é o que o print e o original têm: a lista. Nada mais foi construído.
 */

/**
 * ================== O PAPEL É TEXTO ABERTO, NÃO UNIÃO FECHADA ==================
 *
 * O original lê a coluna `role` da tabela `user_roles` sem validar contra uma lista
 * — o valor vem do banco. Fechar isto num `union` de três nomes faria o tipo MENTIR
 * sobre a origem: bastaria um papel novo no banco para o `typecheck` acusar erro num
 * dado que é legítimo. Aqui o papel é `string`, e a tela desenha o que vier.
 *
 * O print mostra os três valores em MAIÚSCULAS; o original os escreve com
 * `uppercase` no CSS. Como não há captura do banco, o valor sai exatamente como o
 * print o mostra — e o `uppercase` do original é preservado no componente.
 */
export type UserRole = string;

/** Uma linha de atribuição: o `user_id` e o papel que ele tem. */
export interface UserRoleRow {
  /** O `user_id` — um UUID opaco, como o print mostra. Não é nome nem e-mail. */
  userId: string;
  role: UserRole;
}
