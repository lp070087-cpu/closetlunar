import type { Metadata } from 'next';
import { ProductsView } from '@/components/admin/produtos/products-view';

export const metadata: Metadata = { title: 'Produtos' };

/**
 * Produtos — reconstruido dos prints adm-025 a adm-027.
 *
 * A tela em si e um componente cliente porque tem busca, filtros, modal e
 * edicao de estado. A pagina fica como Server Component para poder, mais
 * adiante, resolver a sessao e buscar a primeira pagina de produtos no
 * servidor (o que evita o salto de esqueleto para conteudo).
 */
export default function ProdutosPage() {
  return <ProductsView />;
}
