import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComingSoon } from '@/components/ui/states';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { formatBRL, formatDate, cn } from '@/lib/utils';
import { formatDiscount, formatMinSubtotal, formatUses } from '@/lib/cupons/metrics';
import type { Coupon } from '@/lib/cupons/types';

/**
 * A tabela de cupons — adm-012.
 *
 * SEIS COLUNAS MAIS A COLUNA DE ACOES, na ordem do print:
 *
 *   CODIGO · DESCONTO · MIN. · USOS · VALIDADE · STATUS · (acoes)
 *
 * O `MIN.` E `—` NO PRINT, e nao `R$ 0,00`. A regra fica em
 * `formatMinSubtotal`: pedido minimo zero significa "sem minimo" e imprime
 * travessao. Ver o comentario la.
 *
 * O SELO DE STATUS E UM BOTAO, e nao uma pilula estatica. No print ele e preto
 * com `Ativo` em branco; no original ele e `<button onClick={toggle}>`, ou seja,
 * CLICAR NELE LIGA/DESLIGA o cupom sem abrir o formulario. E a unica acao
 * rapida da linha, e por isso nao virou um selo decorativo.
 *
 * AS DUAS CORES: preto quando ativo, cinza quando inativo. O `MAPA-ADMIN.md`
 * registra que o selo `Ativo` sai PRETO em Cupons e VERDE em Afiliadas — as
 * duas cores convivem no material de proposito, e aqui fica o preto, que e o
 * que os prints de Cupons mostram.
 *
 * O ALINHAMENTO: no print todo o cabecalho esta a esquerda, inclusive
 * `DESCONTO`, `MIN.`, `USOS` e `VALIDADE`. Nao sao colunas de numero com o
 * titulo a direita — e o que o print mostra, entao e o que esta aqui.
 */
export function CouponTable({
  rows,
  hasFilter,
  onEdit,
  onDelete,
  onToggle,
}: {
  rows: Coupon[];
  /** Diferencia "lista vazia" de "busca sem resultado". Ver `cupons-view.tsx`. */
  hasFilter: boolean;
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
  onToggle: (coupon: Coupon) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="surface p-6 sm:p-8">
        {hasFilter ? (
          <ComingSoon icon={Ticket} text="Nenhum cupom encontrado para esta busca." />
        ) : (
          <ComingSoon
            icon={Ticket}
            text="Nenhum cupom criado ainda. Clique em Novo cupom para começar."
          />
        )}
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Código</TableHeaderCell>
              <TableHeaderCell>Desconto</TableHeaderCell>
              <TableHeaderCell>Mín.</TableHeaderCell>
              <TableHeaderCell>Usos</TableHeaderCell>
              <TableHeaderCell>Validade</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              {/* Coluna sem titulo: e o espaco dos dois links de acao. */}
              <TableHeaderCell>
                <span className="sr-only">Ações</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((coupon) => (
              <TableRow key={coupon.id}>
                {/*
                  O codigo em monospace com tracking, como no print — e sem
                  `toUpperCase()` aqui: ele ja e gravado em maiuscula, e
                  forcar na tela esconderia um dado que viesse minusculo do
                  banco errado.
                */}
                <TableCell className="font-mono tracking-wider">{coupon.code}</TableCell>
                <TableCell>{formatDiscount(coupon)}</TableCell>
                <TableCell>{formatMinSubtotal(coupon, formatBRL)}</TableCell>
                <TableCell className="tabular-nums">{formatUses(coupon)}</TableCell>
                <TableCell className="text-xs">{formatDate(coupon.expiresAt)}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onToggle(coupon)}
                    aria-pressed={coupon.isActive}
                    className={cn(
                      'focus-ring rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] transition-colors',
                      coupon.isActive
                        ? 'bg-foreground text-background'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {coupon.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </TableCell>
                <TableCell align="right">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    {/* `link` = sublinhado em caixa normal, como o print. */}
                    <Button variant="link" size="sm" onClick={() => onEdit(coupon)}>
                      Editar
                    </Button>
                    <button
                      type="button"
                      onClick={() => onDelete(coupon)}
                      className="focus-ring text-xs font-medium text-danger underline underline-offset-4 transition-colors hover:text-danger/80"
                    >
                      Excluir
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}
