import type { Metadata } from 'next';
import { CategoriesView } from '@/components/admin/categorias/categories-view';

export const metadata: Metadata = { title: 'Categorias' };

/**
 * Categorias — reconstruida dos prints adm-030 e adm-031.
 *
 * adm-030 = a lista (`/tops · ordem 1 · ativo`, miniatura circular, acoes
 * `Desativar` · `Editar` · `Excluir`). adm-031 = o modal `Nova categoria` com
 * `Nome`, `Slug (url)`, `Imagem (círculo)` + `Upload`, `Ordem` + `Ativo`.
 *
 * O placeholder anterior desta rota citava `adm-044 a adm-046`, que sao do
 * Provador Virtual — referencia errada, corrigida aqui.
 *
 * A tela e um componente cliente porque tem busca, filtro, modal e estado. A
 * pagina fica como Server Component para poder, mais adiante, resolver a sessao
 * e buscar a primeira pagina no servidor.
 */
export default function CategoriasPage() {
  return <CategoriesView />;
}
