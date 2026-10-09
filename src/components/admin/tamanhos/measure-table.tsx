'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/states';
import { Ruler } from 'lucide-react';
import type { MeasurementAddress, MeasurementKey, SizeRow } from '@/lib/tamanhos/types';

/**
 * Tabela de Medidas (adm-032 e adm-033).
 *
 * MEDIDO NO PRINT, nao inferido:
 *
 * - As LINHAS sao os tamanhos (G, GG, M, P, PP) em serifado, alinhados a
 *   esquerda; as COLUNAS sao as medidas. O placeholder antigo deste modulo
 *   dizia o contrario ("tamanhos nas colunas, medidas nas linhas") — o print
 *   desmente, e o print manda.
 * - O cabecalho fala em caixa alta miuda: `TAMANHO`, `BUSTO (MIN/MAX)`,
 *   `CINTURA (MIN/MAX)`, `QUADRIL (MIN/MAX)`, `ALTURA (CM)`, `PESO (KG)`.
 * - Cada celula e um PAR: um campo estreito, o separador `/`, outro campo. O
 *   separador e um caractere proprio, apagado.
 * - As celulas sao campos de verdade, e nao texto: o rodape promete
 *   `ALTERACOES SAO SALVAS AUTOMATICAMENTE AO SAIR DO CAMPO`.
 * - A tabela rola na horizontal em tela estreita (`min-w-[900px]`, como a
 *   referencia), em vez de espremer seis colunas num celular.
 *
 * O que NAO esta aqui porque o print nao tem: coluna de acoes, botao de
 * adicionar linha, botao de excluir tamanho. Ver o comentario de `types.ts`.
 */

/**
 * As cinco colunas de medida, com o SUFIXO EXATO do print.
 *
 * O print NAO usa o mesmo sufixo nas cinco: as tres primeiras dizem `MIN/MAX` e
 * as duas ultimas dizem a unidade (`CM`, `KG`). Uniformizar tudo em `min/max`
 * seria "mais consistente" e estaria errado — o pedido e fidelidade ao print, e
 * a diferenca esta la.
 */
const COLUMNS: { key: MeasurementKey; label: string; suffix: string; unit: string }[] = [
  { key: 'bust', label: 'Busto', suffix: 'min/max', unit: 'cm' },
  { key: 'waist', label: 'Cintura', suffix: 'min/max', unit: 'cm' },
  { key: 'hip', label: 'Quadril', suffix: 'min/max', unit: 'cm' },
  { key: 'height', label: 'Altura', suffix: 'cm', unit: 'cm' },
  { key: 'weight', label: 'Peso', suffix: 'kg', unit: 'kg' },
];

export function MeasureTable({
  rows,
  onCellCommit,
  errorFor,
}: {
  rows: SizeRow[];
  /** Chamado ao sair do campo — e o "salva automaticamente" do print. */
  onCellCommit: (address: MeasurementAddress, raw: string) => void;
  /** Erro de coerencia daquela celula, se houver. */
  errorFor: (address: MeasurementAddress) => string | null;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-secondary/10">
        <EmptyState
          title="Nenhuma medida cadastrada para este tipo de peça."
          description="Escolha outro tipo de peça ou preencha as faixas desta tabela."
          icon={Ruler}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-secondary/10">
      <div className="table-scroll">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-secondary/50 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
              <th scope="col" className="px-6 py-4 text-left font-bold">
                Tamanho
              </th>
              {COLUMNS.map((column) => (
                <th key={column.key} scope="col" className="px-6 py-4 text-center font-bold">
                  {column.label} ({column.suffix})
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-secondary/20">
                <th
                  scope="row"
                  className="px-6 py-4 text-left font-serif text-lg font-normal text-foreground"
                >
                  {row.sizeLabel}
                </th>
                {COLUMNS.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    <RangePair
                      rowId={row.id}
                      measurementKey={column.key}
                      label={`${column.label} do tamanho ${row.sizeLabel}`}
                      unit={column.unit}
                      min={row[column.key].min}
                      max={row[column.key].max}
                      error={errorFor({ rowId: row.id, key: column.key, end: 'min' })}
                      onCommit={onCellCommit}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * O par `min / max` de uma celula.
 *
 * Os dois campos sao NAO CONTROLADOS e guardam o texto localmente: o estado da
 * verdade e a linha, que so muda quando o campo perde o foco. Se fossem
 * controlados pelo valor numerico, digitar `9` enquanto se quer `92` faria o
 * campo reformatar a cada tecla.
 *
 * `type="number"` com `inputMode="numeric"` para o teclado numerico subir no
 * celular. O `key` do `useEffect` abaixo ressincroniza o campo quando o valor
 * de fora muda (por exemplo, quando o tipo de peca troca e a linha inteira e
 * outra) — sem isso, o campo mostraria o numero da peca anterior.
 */
function RangePair({
  rowId,
  measurementKey,
  label,
  unit,
  min,
  max,
  error,
  onCommit,
}: {
  rowId: string;
  measurementKey: MeasurementKey;
  label: string;
  unit: string;
  min: number | null;
  max: number | null;
  error: string | null;
  onCommit: (address: MeasurementAddress, raw: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center justify-center gap-2">
        <CellInput
          value={min}
          label={`${label}, mínimo, em ${unit}`}
          invalid={error !== null}
          onCommit={(raw) => onCommit({ rowId, key: measurementKey, end: 'min' }, raw)}
        />
        <span aria-hidden className="text-[10px] text-muted-foreground/40">
          /
        </span>
        <CellInput
          value={max}
          label={`${label}, máximo, em ${unit}`}
          invalid={error !== null}
          onCommit={(raw) => onCommit({ rowId, key: measurementKey, end: 'max' }, raw)}
        />
      </div>
      {error ? (
        <p role="alert" className="text-[10px] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CellInput({
  value,
  label,
  invalid,
  onCommit,
}: {
  value: number | null;
  label: string;
  invalid: boolean;
  onCommit: (raw: string) => void;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));

  // Ressincroniza quando o valor de fora muda — ver o comentario acima.
  useEffect(() => {
    setText(value === null ? '' : String(value));
  }, [value]);

  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      aria-invalid={invalid ? true : undefined}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={(event) => onCommit(event.target.value)}
      onKeyDown={(event) => {
        // Enter confirma sem esperar o clique em outro lugar.
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      className={cn(
        'focus-ring w-16 rounded-lg border bg-background px-2 py-1.5 text-center text-xs tabular-nums transition-all',
        invalid
          ? 'border-danger/60 focus-visible:ring-danger/30'
          : 'border-border/60 focus-visible:ring-foreground/10',
      )}
    />
  );
}
