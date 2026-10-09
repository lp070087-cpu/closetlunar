import type { Metadata } from 'next';
import { UsuariosView } from '@/components/admin/usuarios/usuarios-view';

export const metadata: Metadata = { title: 'Usuários / Admins' };

/**
 * `/admin/usuarios` — reconstruída de adm-085.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (a lista de
 * atribuições de papel) vive em `UsuariosView`.
 *
 * ================== A FAIXA DE PRINTS ESTAVA ERRADA ==================
 *
 * O placeholder registrava `adm-085 a adm-086` — dois prints. Usuários / Admins é
 * UMA tela só, e ela é **adm-085** (2026-09-28 000241). `adm-086` (000247) é
 * Segurança & Backup, outra tela. A faixa certa é `adm-085`.
 *
 * ================== O QUE O PLACEHOLDER PROMETIA E NÃO EXISTE ==================
 *
 * O placeholder listava três blocos. Nenhum deles se confirma inteiro:
 *
 *   "Lista de usuários"   existe, mas SEM nome, e-mail ou último acesso. Cada linha
 *                         tem só o avatar de iniciais, o PAPEL e o `user_id`. O
 *                         original só lê `user_id, role` — não há nome nem data.
 *   "Convite"             NÃO existe. Nenhum print mostra formulário de convite, e o
 *                         original não tem. Os papéis `EDITOR` e `ATENDIMENTO` que o
 *                         placeholder citava também não existem: os três do print
 *                         são `ADMIN`, `USER` e `SUPER_ADMIN`.
 *   "Permissões"          NÃO existe. Não há tela descrevendo o que cada papel pode.
 *
 * ================== A MESMA CONTA COM DOIS PAPÉIS ==================
 *
 * `ADMIN` e `SUPER_ADMIN` aparecem com o MESMO `user_id` no print. Não é erro: é a
 * mesma conta com duas atribuições, e o original cuida disso com a chave
 * `user_id + role`. A demonstração preserva o caso — apagar a duplicidade seria
 * "corrigir" um dado que o print mostra de propósito.
 *
 * ================== O QUE NÃO MUDOU ==================
 *
 * A rota continua `/admin/usuarios`, o item de menu o mesmo, e nada aqui conecta o
 * Neon — ver `lib/usuarios/data.ts`.
 */
export default function Usuarios_Page() {
  return <UsuariosView />;
}
