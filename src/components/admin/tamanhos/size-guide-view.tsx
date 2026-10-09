'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/states';
import {
  listGarmentTypes,
  listProductRules,
  listSizeLearning,
  listSizeRows,
  saveMeasurement,
  saveProductRule,
} from '@/lib/tamanhos/data';
import { applyMeasurement, rangeError } from '@/lib/tamanhos/metrics';
import type {
  GarmentType,
  MeasurementAddress,
  ProductRuleRow as RuleRow,
  ProductSizeRule,
  SizeLearningEntry,
  SizeRow,
} from '@/lib/tamanhos/types';
import { MeasureSection } from './measure-section';
import { RuleSection } from './rule-section';
import { SizeIntelligence } from './size-intelligence';

/**
 * Tela de Tamanhos (`/admin/tamanhos`) — reconstruida de adm-032 a adm-037.
 *
 * TRES BLOCOS, NA ORDEM DO PRINT:
 *
 *   1. Tabela de Medidas       — matriz de tamanhos x medidas, editavel.
 *   2. Regras por Produto      — uma linha por produto.
 *   3. Inteligência de Tamanho — o log, hoje vazio.
 *
 * Este arquivo e o DONO DO ESTADO: ele carrega, filtra, grava e trata os
 * estados de carregamento/erro. O desenho de cada bloco mora nos componentes
 * ao lado, que sao apresentacionais — e e isso que permite a bancada
 * renderizar cada bloco com dados e conferir o cabecalho de verdade, sem
 * navegador.
 *
 * O QUE ESTA TELA NAO TEM, E POR QUE
 *
 * O pedido da fase listou criar / editar / ativar / desativar / excluir / nome /
 * sigla / ordem. Nenhum dos seis prints tem qualquer um desses: nao ha lista de
 * tamanhos para criar, nenhuma sigla, nenhuma ordem, nenhum status e nenhum
 * botao de excluir. O que existe e uma matriz de medidas editavel no lugar.
 * Construir um CRUD de tamanhos aqui seria inventar uma tela que a referencia
 * nao tem — entao ele NAO foi construido, e isso esta relatado no fim da fase.
 *
 * Toda leitura passa por `@/lib/tamanhos/data`. Nada e persistido, e a tela
 * diz isso nos avisos — nao ha simulacao de gravacao.
 */
export function SizeGuideView() {
  const garmentTypes = useMemo(() => listGarmentTypes(), []);
  const [garmentType, setGarmentType] = useState<GarmentType>('top');

  /**
   * A matriz de TODOS os tipos fica na memoria da tela, e nao so a do tipo
   * visivel: trocar o seletor e ida e volta o tempo todo, e reconsultar a cada
   * troca faria a tela piscar o esqueleto sem necessidade. O filtro e derivado.
   */
  const [allRows, setAllRows] = useState<SizeRow[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [entries, setEntries] = useState<SizeLearningEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /**
   * Erro de coerencia por celula, enderecado por `linha:medida:ponta`. Mora na
   * tela, e nao na tabela, porque e o unico lugar que ve a linha inteira no
   * momento de gravar — e o erro e do PAR, nao de um campo so.
   */
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Os tres blocos sao independentes: buscar em paralelo e o que o print
        // sugere, ja que nenhum depende do outro.
        const [rowsResult, rulesResult, learningResult] = await Promise.all([
          listSizeRows('top'),
          listProductRules(),
          listSizeLearning(),
        ]);
        if (!alive) return;
        // Carrega tambem os tipos que hoje vem vazios, para o seletor nao
        // precisar reconsultar. Se um deles passar a ter linha, ja aparece.
        const outros = await Promise.all(
          garmentTypes
            .filter((type) => type.value !== 'top')
            .map((type) => listSizeRows(type.value)),
        );
        if (!alive) return;
        setAllRows([...rowsResult.data, ...outros.flatMap((result) => result.data)]);
        setRules(rulesResult.data);
        setEntries(learningResult.data);
      } catch {
        if (alive) setError('Não foi possível carregar as tabelas de medidas.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [garmentTypes, reloadKey]);

  const visibleRows = useMemo(
    () => allRows.filter((row) => row.garmentType === garmentType),
    [allRows, garmentType],
  );

  const errorFor = useCallback(
    (address: MeasurementAddress) =>
      cellErrors[`${address.rowId}:${address.key}:${address.end}`] ?? null,
    [cellErrors],
  );

  /**
   * Grava uma celula ao sair do campo — o comportamento que o rodape do print
   * descreve por escrito.
   *
   * O valor bruto do input passa por `applyMeasurement`, que transforma vazio
   * em `null` (e nao zero) e texto invalido em `null` (e nao `NaN`). Depois a
   * faixa inteira e conferida: minimo maior que maximo e impossivel numa medida
   * real, e o erro fica preso a celula em vez de virar um aviso solto.
   */
  async function commitCell(address: MeasurementAddress, raw: string) {
    const current = allRows.find((row) => row.id === address.rowId);
    if (!current) return;

    const updated: SizeRow = {
      ...current,
      [address.key]: applyMeasurement(current[address.key], address.end, raw),
      updatedAt: new Date().toISOString(),
    };

    const message = rangeError(updated[address.key]);
    setCellErrors((previous) => {
      const next = { ...previous };
      // Limpa as DUAS pontas: o erro e do par. Deixar so uma marcada faria o
      // campo certo parecer o culpado.
      next[`${address.rowId}:${address.key}:min`] = message ?? '';
      next[`${address.rowId}:${address.key}:max`] = message ?? '';
      return next;
    });

    setAllRows((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));

    try {
      const result = await saveMeasurement(updated);
      if (!result.persisted) {
        setNotice(
          'Medidas ajustadas nesta sessão. A gravação automática no banco entra na fase de integração.',
        );
      }
    } catch {
      setNotice('Não foi possível salvar a medida. Tente novamente.');
    }
  }

  async function saveRule(rule: ProductSizeRule) {
    setSavingRuleId(rule.productId);
    try {
      const result = await saveProductRule(rule);
      setRules((current) =>
        current.map((row) => (row.productId === rule.productId ? { ...row, rule } : row)),
      );
      setNotice(
        result.persisted
          ? 'Regra salva.'
          : 'Regra aplicada nesta sessão. A gravação no banco entra na fase de integração.',
      );
    } catch {
      setNotice('Não foi possível salvar a regra. Tente novamente.');
    } finally {
      setSavingRuleId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="surface p-6 sm:p-8 lg:p-10">
          <TableSkeleton rows={5} columns={6} />
        </div>
        <div className="surface p-6 sm:p-8 lg:p-10">
          <TableSkeleton rows={4} columns={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-danger/40 bg-danger-surface/40 px-6 py-12 text-center"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-danger-surface text-danger-foreground">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-serif text-lg">{error}</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Tente novamente em instantes. Se persistir, verifique a conexão com o banco de dados.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
          <RefreshCw className="size-3.5" aria-hidden />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 motion-safe:animate-fade-up">
      {/* Aviso honesto sobre a origem dos dados e o que foi feito na sessao */}
      {notice ? (
        <p
          role="status"
          className="rounded-2xl border border-warning-surface bg-warning-surface/50 px-4 py-3 text-xs font-medium text-warning-foreground"
        >
          {notice}
        </p>
      ) : null}

      <MeasureSection
        garmentTypes={garmentTypes}
        garmentType={garmentType}
        onGarmentTypeChange={setGarmentType}
        rows={visibleRows}
        onCellCommit={commitCell}
        errorFor={errorFor}
      />

      <RuleSection rules={rules} savingProductId={savingRuleId} onSave={saveRule} />

      <SizeIntelligence entries={entries} />
    </div>
  );
}
