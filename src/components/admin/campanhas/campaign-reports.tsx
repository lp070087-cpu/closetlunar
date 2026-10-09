import { formatBRL } from '@/lib/utils';
import type { CampaignPerformance } from '@/lib/campanhas/types';
import type { CouponUsage } from '@/lib/cupons/types';

/**
 * OS DOIS CARDS DE DESEMPENHO — `Campanhas com mais venda` e `Cupons mais usados`.
 *
 * ELES SAO LADO A LADO, metade da largura cada, em todos os prints: em adm-006
 * estao logo abaixo da tabela, em adm-015 aparecem com o cupom preenchido, e em
 * adm-017 sao o fim da pagina. A grade vai a uma coluna no telefone.
 *
 * O ORIGINAL TEM DOIS COMPONENTES SEPARADOS PORQUE CADA UM FAZIA A PROPRIA
 * QUERY. Aqui a separacao continua, mas por outro motivo: um card e alimentado
 * por DADO DESTE MODULO e o outro por dado do modulo CUPONS. Manter os dois
 * componentes separados deixa a fronteira visivel no codigo — o `Cupons mais
 * usados` nao tem logica de cupom nenhuma dentro dele, so a lista que recebe.
 *
 * O `Cupons mais usados` E DADO DO MODULO CUPONS, e nao uma copia feita aqui. O
 * original consultava `coupons` direto (`CouponReport`), o que criaria um segundo
 * dono para o mesmo numero — este projeto ja tem a funcao (`topUsedCoupons` em
 * `lib/cupons/metrics.ts`), e ela e reusada. Ver `campanhas-view.tsx`.
 */

/**
 * `Campanhas com mais venda`.
 *
 * O `Sem dados de uso.` e o do original, palavra por palavra, e o mesmo texto
 * aparece em adm-006 e em adm-015. Ele entra quando a lista esta VAZIA — e nao
 * quando a receita e zero: uma campanha que faturou `R$ 0,00` e um dado, e mostra
 * o valor.
 */
export function CampaignReport({ rows }: { rows: CampaignPerformance[] }) {
  return (
    <div className="surface p-6">
      <h3 className="font-serif text-lg">Campanhas com mais venda</h3>
      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-4 text-sm">
            <span className="truncate">{row.name}</span>
            {/* O valor em monospace e negrito, como o original
                (`font-mono font-bold`). */}
            <span className="shrink-0 font-mono font-bold">{formatBRL(row.revenue)}</span>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="text-xs text-muted-foreground">Sem dados de uso.</div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * `Cupons mais usados`.
 *
 * A LINHA TEM O CODIGO A ESQUERDA EM MONOSPACE e `N usos` a direita, tambem em
 * monospace e negrito — exatamente `CLOSET10` / `0 usos` no print adm-015.
 *
 * O `0 usos` no SINGULAR/PLURAL: o original escreve `{item.uses_count} usos`
 * sempre, sem tratar o singular. Entao um cupom com um unico uso imprime
 * `1 usos`. Nao foi corrigido — a string do print e `0 usos`, e a regra de
 * plural nao esta em referencia nenhuma. Fica registrado como divergencia
 * conhecida do original, e nao como decisao nova.
 *
 * O vazio e `Sem cupons usados.`, o do print de adm-006.
 */
export function CouponReport({ rows }: { rows: CouponUsage[] }) {
  return (
    <div className="surface p-6">
      <h3 className="font-serif text-lg">Cupons mais usados</h3>
      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={row.code} className="flex items-center justify-between gap-4 text-sm">
            <span className="truncate font-mono">{row.code}</span>
            <span className="shrink-0 font-mono font-bold">{row.usesCount} usos</span>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="text-xs text-muted-foreground">Sem cupons usados.</div>
        ) : null}
      </div>
    </div>
  );
}
