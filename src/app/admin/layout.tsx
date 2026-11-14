import { AdminLayoutClient } from './layout-client';
import { exigirPapel } from '@/lib/auth/guardas';
import { usuarioAtual } from '@/lib/auth/acoes';

/**
 * Layout do painel administrativo.
 *
 * Fica como Server Component para poder, mais adiante, resolver a sessao no
 * servidor (cookie httpOnly) e entregar o usuario ja autenticado para a casca.
 * O destaque do item ativo fica no componente cliente, que deriva a rota de
 * `usePathname` — assim a navegacao funciona com botao voltar e link direto.
 */

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Painel Administrativo',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirPapel('admin', '/entrar?area=admin');
  const usuario = sessao.demo ? null : await usuarioAtual();
  return <AdminLayoutClient email={usuario?.email} demo={sessao.demo}>{children}</AdminLayoutClient>;
}
