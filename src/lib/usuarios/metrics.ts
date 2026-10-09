/**
 * Conversões de Usuários / Admins.
 *
 * PURO: sem React, sem I/O, sem `Date.now()`.
 *
 * A tela não tem número: nenhum total, percentual ou contador. O que ela tem é o
 * avatar de iniciais e a frase do vazio. Nada além disso foi inventado.
 */

import type { UserRoleRow } from './types';

/**
 * As DUAS primeiras letras do papel, em maiúsculas — é o avatar circular do print.
 *
 * O original faz `role.slice(0, 2).toUpperCase()`: `ADMIN` → `AD`, `USER` → `US`,
 * `SUPER_ADMIN` → `SU`. É por isso que `SUPER_ADMIN` desenha `SU` e não `SA` — a
 * fatia é das duas primeiras LETRAS, não das iniciais de duas palavras. Reproduzir
 * isso é o que faz a terceira linha do print sair certa.
 *
 * Papel vazio devolve `?`: um avatar sem nada dentro pareceria erro de desenho.
 */
export function roleInitials(role: string): string {
  const texto = role.trim();
  if (texto === '') return '?';
  return texto.slice(0, 2).toUpperCase();
}

/**
 * A chave de cada linha.
 *
 * ================== `userId` SOZINHO NÃO SERVE DE CHAVE ==================
 *
 * `ADMIN` e `SUPER_ADMIN` compartilham o mesmo `user_id` no print. Usar só o id
 * faria duas linhas colidirem; usar só o papel faria duas atribuições do mesmo
 * papel colidirem. A chave é o par — exatamente o `key={r.user_id + r.role}` que o
 * original escreve.
 */
export function rowKey(row: UserRoleRow): string {
  return `${row.userId}\u0000${row.role}`;
}
