/**
 * A camada de dados de Usuários / Admins — o ÚNICO ponto de contato com os dados.
 *
 * Hoje devolve a demonstração. Quando o Neon entrar, é ESTE arquivo que muda.
 */

import { DEMO_USER_ROLES } from './demo';
import type { UserRoleRow } from './types';

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * As atribuições de papel.
 *
 * FUTURO (Neon): `SELECT user_id, role FROM user_roles ORDER BY role`. O original
 * ordena por `role` — e é a ordem que o print mostra (`ADMIN`, `USER`,
 * `SUPER_ADMIN`). Devolve cópias: a lista é de leitura, mas nenhuma tela deve poder
 * escrever na demonstração do módulo.
 */
export async function listUserRoles(): Promise<{
  data: UserRoleRow[];
  source: 'demo';
  reason: string;
}> {
  return { data: DEMO_USER_ROLES.map((linha) => ({ ...linha })), source: 'demo', reason: PENDING_REASON };
}

export { PENDING_REASON };
