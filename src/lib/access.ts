import { NAV_ITEMS, type AdminNavItem, type AdminRole } from './nav';

/**
 * Regras de acesso do painel.
 *
 * Nesta fase (fundacao) ainda NAO ha autenticacao real: a sessao vem de uma
 * constante. Toda autorizacao, porem, ja passa por aqui, de forma que ligar o
 * login depois seja trocar apenas `getSession()` — sem tocar nas telas.
 *
 * ATENCAO: nenhuma checagem deste arquivo vale como barreira de seguranca.
 * A protecao real vai em middleware + banco, na fase de persistencia.
 */

export interface AdminSession {
  email: string;
  name: string;
  roles: AdminRole[];
}

const DEMO_SESSION: AdminSession = {
  email: 'lp070087@gmail.com',
  name: 'Closet Lunna',
  roles: ['SUPER_ADMIN'],
};

/** Sessao atual do painel. Ponto unico de troca quando o login existir. */
export function getSession(): AdminSession {
  return DEMO_SESSION;
}

/** O usuario pode ver este item de navegacao? */
export function canAccess(item: AdminNavItem, roles: AdminRole[]): boolean {
  if (!item.roles) return true;
  return item.roles.some((role) => roles.includes(role));
}

/** O usuario tem ao menos um destes papeis? */
export function hasRole(roles: AdminRole[], required: AdminRole[]): boolean {
  return required.some((role) => roles.includes(role));
}

/** Item de navegacao correspondente a um slug de rota. */
export function findNavItem(slug: string): AdminNavItem | undefined {
  return NAV_ITEMS.find((item) => item.slug === slug);
}
