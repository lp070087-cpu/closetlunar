/**
 * Demonstração de Usuários / Admins — adm-085.
 *
 * ================== AS TRÊS LINHAS SÃO AS DO PRINT ==================
 *
 * O print mostra exatamente três linhas, nesta ordem (o original ordena por `role`,
 * e é a ordem alfabética que aparece):
 *
 *   ADMIN       f2fe46dc-cf34-45dc-becc-abedcbe377f3
 *   USER        b77b99e5-628e-470d-b63d-05c46ba63812
 *   SUPER_ADMIN f2fe46dc-cf34-45dc-becc-abedcbe377f3
 *
 * Repare que `ADMIN` e `SUPER_ADMIN` compartilham o MESMO `user_id` — é a mesma
 * conta com dois papéis, e é assim que o print mostra. A chave do React no original
 * é `user_id + role` justamente por causa disso; a demonstração preserva o caso em
 * vez de "limpar" a duplicidade, que é dado real, não defeito.
 *
 * ================== O `user_id` NÃO É DADO PESSOAL REVELADOR ==================
 *
 * Diferente do CPF/telefone do Melhor Envio, um UUID não identifica ninguém sozinho:
 * ele é a chave opaca que a própria tela precisa EXIBIR para o administrador saber
 * qual conta está olhando. Por isso ele fica — é conteúdo da tela, não vazamento.
 * Nenhum e-mail, nome ou senha aparece no print, e nenhum foi inventado.
 */

import type { UserRoleRow } from './types';

export const DEMO_USER_ROLES: UserRoleRow[] = [
  { userId: 'f2fe46dc-cf34-45dc-becc-abedcbe377f3', role: 'ADMIN' },
  { userId: 'b77b99e5-628e-470d-b63d-05c46ba63812', role: 'USER' },
  { userId: 'f2fe46dc-cf34-45dc-becc-abedcbe377f3', role: 'SUPER_ADMIN' },
];
