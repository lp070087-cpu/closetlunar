import { categoryLabel, countLabel } from '@/lib/favoritos/metrics';
import type { FavoriteRow } from '@/lib/favoritos/types';

/**
 * A LISTA `Produtos mais favoritados` — adm-067.
 *
 * ================== A FORMA VEIO DO ORIGINAL, NÃO DA IMAGINAÇÃO ==================
 *
 * O print mostra só o estado VAZIO, então a lista cheia não aparece em captura
 * nenhuma. Ela NÃO foi inventada: foi transcrita do `WishlistReport` do projeto
 * original, que desenha cada produto assim —
 *
 *   um número da POSIÇÃO à esquerda (`1`, `2`, `3`…),
 *   a foto do produto (`h-12 w-10`, ou seja 40×48 — retrato, levemente alto),
 *   o nome em cima e a categoria embaixo,
 *   e `N ♥` na ponta direita.
 *
 * As classes são as do original (`flex items-center gap-3 p-3 border-b
 * last:border-0`), com os tokens do painel no lugar das cores cruas: `bg-card` em
 * vez de `bg-background`, `border-border` no divisor.
 *
 * ================== A CAIXA NÃO TEM RAIO ==================
 *
 * Medido em `235929.png`: a quina do card é um canto de ~3px — `rounded`, o mesmo
 * `border-radius: 0.25rem` do original. O painel tem `.surface` (`rounded-3xl`) e
 * `.surface-flat` (`rounded-2xl`), mas nenhum dos dois é essa caixa: usá-los aqui
 * deixaria a tela mais arredondada do que o print. É `border border-border rounded
 * bg-card` na mão, como no original.
 */
export function FavoritesList({ items }: { items: FavoriteRow[] }) {
  return (
    <div className="overflow-hidden rounded border border-border bg-card">
      {items.map((row, index) => (
        <div
          key={row.productId}
          className="flex items-center gap-3 border-b border-border p-3 last:border-0"
        >
          {/* A posição, e não a contagem: um `1` à esquerda é "primeiro da lista". */}
          <span className="w-6 text-center text-xs tabular-nums text-muted-foreground">
            {index + 1}
          </span>

          {row.image ? (
            <img
              src={row.image}
              alt=""
              loading="lazy"
              className="h-12 w-10 shrink-0 rounded bg-muted object-cover"
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{row.name}</div>
            <div className="text-xs text-muted-foreground">{categoryLabel(row.category)}</div>
          </div>

          <div className="shrink-0 text-sm font-medium tabular-nums">{countLabel(row.count)}</div>
        </div>
      ))}
    </div>
  );
}
