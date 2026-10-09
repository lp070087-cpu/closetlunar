import { countLabel, resultsLabel } from '@/lib/busca/metrics';
import type { AggregatedTerm } from '@/lib/busca/types';

/**
 * OS DOIS PAINÉIS DE BUSCA — `Termos mais pesquisados` e `Buscas sem resultado`.
 *
 * ================== A CAIXA É `rounded` (≈3px), COMO AS OUTRAS DE INSIGHTS ==================
 *
 * Medido em `235943.png`: a quina do card é um canto pequeno — `rounded`, o
 * `border-radius: 0.25rem` do original, e NÃO o `rounded-2xl` de `.surface-flat`
 * nem o `rounded-3xl` de `.surface`. É a mesma caixa do módulo Favoritos
 * (`adm-067`), e a mesma do original (`bg-background border border-border rounded
 * p-4`). O fundo é o token do painel — `bg-card`, branco puro — e não a cor crua.
 *
 * ================== AS DUAS LISTAS DIFEREM EM UM SÓ PONTO ==================
 *
 * A da esquerda mostra `12x · 3 result.`; a da direita, só `5x`. E o número da
 * direita é VERMELHO no print (`text-rose-500` no original) — é alarme: um termo
 * que ninguém acha é catálogo faltando. A distinção é a razão de `empty` e `top`
 * virem de funções diferentes em `metrics.ts`, e não de um filtro na tela.
 *
 * O corte é em `divide-y divide-border` (linhas coladas com um fio entre elas),
 * e não em cards separados: no print as linhas de uma lista formam um bloco só.
 */
export function SearchPanel({
  title,
  empty,
  items,
  tone = 'neutral',
}: {
  title: string;
  /** O texto quando a lista está vazia. Cada painel tem o seu, e são diferentes. */
  empty: string;
  items: AggregatedTerm[];
  /** `danger` pinta o volume de vermelho — só a lista sem resultado. */
  tone?: 'neutral' | 'danger';
}) {
  return (
    <div className="rounded border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {items.map((term) => (
            <li key={term.term} className="flex justify-between gap-3 py-2">
              <span className="truncate">{term.term}</span>
              <span
                className={
                  tone === 'danger'
                    ? 'shrink-0 text-xs text-danger'
                    : 'shrink-0 text-xs text-muted-foreground'
                }
              >
                {tone === 'danger' ? countLabel(term) : resultsLabel(term)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A DICA DO RODAPÉ — a linha em texto pequeno abaixo dos dois painéis.
 *
 * O texto tem DUAS partes em negrito (`palavras-chave / sinônimos`), e elas são
 * um `<strong>` de verdade: no print elas são visivelmente mais escuras que o
 * resto da frase. É o único lugar do módulo com ênfase no meio do texto, e a
 * razão de a dica estar em componente próprio — o `<strong>` não se perde numa
 * string.
 */
export function SearchTip() {
  return (
    <p className="text-xs text-muted-foreground">
      Dica: adicione os termos sem resultado como{' '}
      <strong className="font-semibold text-foreground">palavras-chave / sinônimos</strong> nos
      produtos correspondentes para melhorar a recuperação da busca.
    </p>
  );
}
