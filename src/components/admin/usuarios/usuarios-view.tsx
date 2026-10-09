'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/ui/card';
import { listUserRoles } from '@/lib/usuarios/data';
import type { UserRoleRow } from '@/lib/usuarios/types';
import { UserRoleList } from './user-role-list';

/**
 * A tela de Usuários / Admins (`/admin/usuarios`) — adm-085.
 *
 * ================== SÓ A LISTA. NENHUM BOTÃO, NENHUM FORMULÁRIO ==================
 *
 * O print tem o cabeçalho (`Usuários e Permissões` / `Lista de contas com acesso
 * administrativo.`) e a lista de três linhas. Nada mais. Não há `+ Convidar`, nem
 * menu de ações, nem busca. Inventar qualquer um deles seria construir uma tela que
 * o print não mostra e o original não tem — o `UsersAdmin` do original é só leitura.
 *
 * Este componente carrega a lista pelo MESMO caminho assíncrono que o Neon vai usar,
 * para que a troca de camada não mude nada aqui.
 */
export function UsuariosView() {
  const [rows, setRows] = useState<UserRoleRow[] | null>(null);

  useEffect(() => {
    let vivo = true;
    listUserRoles().then((res) => {
      if (vivo) setRows(res.data);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Usuários e Permissões"
        description="Lista de contas com acesso administrativo."
      />
      <UserRoleList rows={rows ?? []} loading={rows === null} />
    </div>
  );
}
