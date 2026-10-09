'use client';

import { History } from 'lucide-react';
import { SegmentedTabs, type TabItem } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { EmptyRow } from '@/components/ui/states';
import { formatDelta, movementLabel, MOVEMENT_LABELS } from '@/lib/estoque/metrics';
import type { MovementFilter } from '@/lib/estoque/metrics';
import type { StockMovement } from '@/lib/estoque/types';

/**
 * Historico de Movimentacoes (rodape do adm-029).
 *
 * Colunas na ordem exata do print:
 *   DATA · HORA · PRODUTO · COR · TAM. · QTDE · TIPO · RESPONSAVEL
 *
 * OS CHIPS, na ordem do print, com `Todas` ativo e em pill preta:
 *   Todas · Entrada · Saída · Venda · Reposição · Devolução · Ajuste
 *
 * `Todas` NAO e um tipo de movimentacao: e a ausencia de filtro. Por isso o
 * tipo do filtro e `MovementType | 'todas'`, e nao um setimo valor no enum.
 *
 * A COLUNA QTDE nao e um numero com sinal — e o glifo `±` (lido pixel a pixel no
 * print; ver `DeltaGlyph`). Ele sai em laranja, junto com a pastilha do TIPO,
 * exatamente como na referencia.
 *
 * DATA e HORA vem separadas porque e assim que o print as mostra: `12/06/2026` e
 * `02:33` em colunas distintas. A conversao mora aqui, e nao no dado, porque o
 * dado guarda o instante completo.
 */
export function MovementHistory({
  movements,
  filter,
  onFilterChange,
}: {
  movements: StockMovement[];
  filter: MovementFilter;
  onFilterChange: (filter: MovementFilter) => void;
}) {
  const items: TabItem<MovementFilter>[] = [
    { value: 'todas', label: 'Todas' },
    ...MOVEMENT_LABELS.map((item) => ({ value: item.value, label: item.label })),
  ];

  return (
    <div className="surface p-6 sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-serif text-2xl text-foreground">Histórico de Movimentações</h2>
        <div className="overflow-x-auto">
          <SegmentedTabs items={items} value={filter} onChange={onFilterChange} />
        </div>
      </div>

      <TableWrap>
        <Table className="min-w-[54rem]">
          <TableHead>
            <tr>
              <TableHeaderCell className="pl-8">Data</TableHeaderCell>
              <TableHeaderCell>Hora</TableHeaderCell>
              <TableHeaderCell>Produto</TableHeaderCell>
              <TableHeaderCell>Cor</TableHeaderCell>
              <TableHeaderCell>Tam.</TableHeaderCell>
              <TableHeaderCell align="right">Qtde</TableHeaderCell>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell className="pr-8">Responsável</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {movements.length === 0 ? (
              <EmptyRow colSpan={8} icon={History} title="Nenhuma movimentação registrada." />
            ) : (
              movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="pl-8 tabular-nums">{formatDate(movement.at)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatTime(movement.at)}
                  </TableCell>
                  <TableCell className="font-medium">{movement.productName}</TableCell>
                  <TableCell className="text-muted-foreground">{movement.colorName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{movement.sizeLabel ?? '—'}</TableCell>
                  <TableCell align="right">
                    <span className="font-semibold tabular-nums text-warning-foreground">
                      {formatDelta(movement.delta)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-md bg-warning-surface px-2 py-0.5 text-[11px] font-semibold text-warning-foreground">
                      {movementLabel(movement.type)}
                    </span>
                  </TableCell>
                  <TableCell className="pr-8 text-muted-foreground">{movement.responsible}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}

/**
 * DATA no formato do print: `12/06/2026`.
 *
 * `pt-BR` com dia e mes de dois digitos nao e garantido por opcao de locale —
 * `toLocaleDateString('pt-BR')` devolve `12/06/2026` hoje, mas o dia 1 cairia
 * como `1/6/2026`. As partes sao montadas a mao para o formato nao depender da
 * implementacao do ICU de quem roda.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** HORA no formato do print: `02:33`. */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
