import { FavoritesView } from '@/components/cliente/favorites-view';

/**
 * `/conta/favoritos` — `Favoritos`, o print `cli-006` (`004717`).
 *
 * Server Component, como as outras rotas da area: a pagina so entrega a view. A
 * lista e lida no cliente porque os favoritos pertencem a CONTA da sessao, e a
 * sessao (de demonstracao, nesta fase) e resolvida no navegador.
 *
 * O titulo `Favoritos` NAO esta aqui: ele pertence ao painel de conteudo
 * (`ClientPageHeader`, dentro da view), e nao a casca — ver a nota de
 * `account-shell.tsx`.
 */
export default function ContaFavoritosPage() {
  return <FavoritesView />;
}
