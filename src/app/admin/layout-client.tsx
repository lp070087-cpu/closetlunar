'use client';

import { usePathname } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { NAV_GROUPS, findNavItemBySegments } from '@/lib/nav';
import { getSession } from '@/lib/access';

/**
 * Casca cliente do painel.
 *
 * O item ativo e derivado da propria URL, e nao de estado local: assim a
 * navegacao funciona com botao voltar, link direto e recarregamento.
 */
export function AdminLayoutClient({ children, email, demo = true }: { children: React.ReactNode; email?: string; demo?: boolean }) {
  const pathname = usePathname();
  const segments = pathname?.split('/').filter(Boolean);
  const currentItem = findNavItemBySegments(segments);
  const session = getSession();

  return (
    <AdminShell
      groups={NAV_GROUPS}
      currentLabel={currentItem?.label ?? 'Painel'}
      email={email ?? session.email}
      role={session.roles[0]}
    >
      <p role="status" className="mb-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
        {demo ? 'Demonstração de desenvolvimento: dados de exemplo, sem persistência.' : 'Acesso administrativo autenticado. Os módulos operacionais ainda exibem dados demonstrativos; não use os valores como vendas, estoque ou clientes reais.'}
      </p>
      {children}
    </AdminShell>
  );
}
