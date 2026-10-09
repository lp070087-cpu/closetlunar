import { AdminLayoutClient } from './layout-client';

/**
 * Layout do painel administrativo.
 *
 * Fica como Server Component para poder, mais adiante, resolver a sessao no
 * servidor (cookie httpOnly) e entregar o usuario ja autenticado para a casca.
 * O destaque do item ativo fica no componente cliente, que deriva a rota de
 * `usePathname` — assim a navegacao funciona com botao voltar e link direto.
 */

export const metadata = {
  title: 'Painel Administrativo',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
