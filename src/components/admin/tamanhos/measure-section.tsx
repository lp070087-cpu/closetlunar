'use client';

import { Select } from '@/components/ui/form';
import { measuredCells } from '@/lib/tamanhos/metrics';
import type { GarmentType, MeasurementAddress, SizeRow } from '@/lib/tamanhos/types';
import { MeasureTable } from './measure-table';
import { PanelSection } from './panel-section';

/**
 * Bloco 1 — Tabela de Medidas (adm-032 e adm-033).
 *
 * MEDIDO NO PRINT:
 *
 * - O seletor `TIPO DE PEÇA` fica no ALTO A DIREITA, com o rotulo em caixa alta
 *   miuda ACIMA dele; o titulo e o subtitulo ocupam a esquerda.
 * - O seletor mede ~48px de altura e ~192px de largura no desktop, e ocupa a
 *   largura toda quando a linha quebra.
 * - O rodape tem o PONTO cor de destaque, que pulsa, e a frase em caixa alta
 *   miuda: `ALTERACOES SAO SALVAS AUTOMATICAMENTE AO SAIR DO CAMPO`.
 *
 * Componente APRESENTACIONAL: nao carrega dados nem guarda estado de lista. O
 * tipo de peca visivel e as linhas vem de fora, do dono do estado — e e por
 * isso que a bancada consegue renderiza-lo com dados e conferir o cabecalho
 * sem precisar de navegador.
 */
export function MeasureSection({
  garmentTypes,
  garmentType,
  onGarmentTypeChange,
  rows,
  onCellCommit,
  errorFor,
}: {
  garmentTypes: { value: GarmentType; label: string }[];
  garmentType: GarmentType;
  onGarmentTypeChange: (value: GarmentType) => void;
  rows: SizeRow[];
  onCellCommit: (address: MeasurementAddress, raw: string) => void;
  errorFor: (address: MeasurementAddress) => string | null;
}) {
  return (
    <PanelSection
      title="Tabela de Medidas"
      subtitle="Configure as dimensões padrão para cada tipo de peça."
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-end">
        <div className="w-full sm:w-48 sm:shrink-0">
          <label htmlFor="tipo-de-peca" className="label-caps mb-2 block">
            Tipo de peça
          </label>
          <Select
            id="tipo-de-peca"
            value={garmentType}
            onChange={(event) => onGarmentTypeChange(event.target.value as GarmentType)}
            className="h-11"
          >
            {garmentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <MeasureTable rows={rows} onCellCommit={onCellCommit} errorFor={errorFor} />

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 px-2">
        <span className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse"
            aria-hidden
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Alterações são salvas automaticamente ao sair do campo
          </span>
        </span>
        <Coverage rows={rows} />
      </div>
    </PanelSection>
  );
}

/** Quanto da matriz esta preenchido. Nao esta no print; ver `measuredCells`. */
function Coverage({ rows }: { rows: SizeRow[] }) {
  if (rows.length === 0) return null;
  const { filled, total } = measuredCells(rows);
  return (
    <span className="text-[10px] text-muted-foreground/80">
      <span className="tabular-nums">
        {filled}/{total}
      </span>{' '}
      faixas preenchidas
    </span>
  );
}
