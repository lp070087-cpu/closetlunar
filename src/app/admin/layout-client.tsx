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
export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname?.split('/').filter(Boolean);
  const currentItem = findNavItemBySegments(segments);
  const session = getSession();

  return (
    <AdminShell
      groups={NAV_GROUPS}
      currentLabel={currentItem?.label ?? 'Painel'}
      email={session.email}
      role={session.roles[0]}
    >
      {children}
    </AdminShell>
  );
}
