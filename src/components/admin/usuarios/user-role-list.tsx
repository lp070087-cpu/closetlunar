'use client';

import { roleInitials, rowKey } from '@/lib/usuarios/metrics';
import type { UserRoleRow } from '@/lib/usuarios/types';

/**
 * A lista de contas com acesso administrativo — o cartão do print adm-085.
 *
 * ================== É UM `divide-y`, NÃO UMA `Table` ==================
 *
 * O print não tem cabeçalho de coluna nem grade: são linhas empilhadas dentro de um
 * cartão, separadas por um fio fino, e a última sem fio (`last:border-0`). Isso é
 * exatamente um `divide-y` de linhas `flex`, como o original escreve — usar a
 * `Table` do projeto desenharia um cabeçalho que nenhum pixel mostra.
 *
 * ================== OS TRÊS ESTADOS ==================
 *
 * O componente recebe `loading` e `rows` para desenhar os três estados: carregando,
 * vazio (a frase do `ComingSoon` do original) e com linhas. O vazio tem componente
 * próprio porque, deixado só na view atrás de `useEffect`, ele ficaria inalcançável
 * na bancada — `renderToStaticMarkup` não roda efeito, e a tela sairia sempre no
 * estado de carregamento.
 */
export function UserRoleList({ rows, loading }: { rows: UserRoleRow[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="surface-flat p-10 text-center text-sm text-muted-foreground">Carregando…</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="surface-flat p-10 text-center text-sm text-muted-foreground">
        Nenhum usuário com função administrativa.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-soft">
      {rows.map((linha) => (
        <div
          key={rowKey(linha)}
          className="flex items-center gap-3 border-b border-border/40 px-5 py-3 last:border-0"
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs text-foreground">
            {roleInitials(linha.role)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium uppercase tracking-wide">{linha.role}</div>
            <div className="truncate text-xs text-muted-foreground">{linha.userId}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
