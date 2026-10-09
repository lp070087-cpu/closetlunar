'use client';

import { Input, Select } from '@/components/ui/form';
import { REPORT_CATEGORY_FILTERS, REPORT_RANGES } from '@/lib/relatorios/demo';
import type { ReportRange, ReportTab } from '@/lib/relatorios/types';
import { ReportTabs } from './report-tabs';

/**
 * A BARRA DE FILTROS DE RELATÓRIOS — a faixa branca abaixo do título.
 *
 * É a linha inteira de adm-063: as três abas à esquerda, um divisor vertical, o
 * `select` de PERÍODO e (só na aba `Produtos`) o `select` de CATEGORIA. Tudo
 * dentro do mesmo retângulo branco.
 *
 * ================== AS MEDIDAS VIERAM DA CAPTURA ==================
 *
 * Medido em `235851.png`:
 *
 *   a barra branca começa em x ≈ 631 e o primeiro `select` também — os dois
 *   alinhados na MESMA margem, o que diz que a faixa é um card com padding e não
 *   um grupo solto;
 *   o `select` de período tem 180px de largura (x 1080–1259) e 70px de altura
 *   com a borda — `h-10` (40px) mais o padding da caixa, então a caixa é `h-10`
 *   em 1×;
 *   o de categoria tem 220px (x 1300–1519), porque `Todas as Categorias` é mais
 *   longo que `Últimos 30 dias`.
 *
 * Por isso o `Select` sai com `h-10` e `w-auto` — o padrão do painel é `h-11` e
 * largura cheia, e aqui o print manda.
 *
 * ================== O DIVISOR É UM `bg-border` DE 1px ==================
 *
 * O traço vertical entre as abas e o select aparece no print como um fio cinza
 * claro de ~50px de altura. É o `h-6 w-px bg-border` do original, e ele NÃO
 * aparece na aba em que o `select` de categoria não existe? Aparece sempre — o
 * original o desenha fixo, dentro do JSX, e só o select de categoria é
 * condicional.
 *
 * ================== O FILTRO DE CATEGORIA SÓ EXISTE NA ABA `Produtos` ==================
 *
 * Nas capturas de `Clientes` (adm-065) e `Categorias` (adm-066) o segundo
 * `select` NÃO está lá — a faixa termina no select de período. É o
 * `{activeReport === "products" && …}` do original, e a tela o reproduz.
 */
export function ReportFilter({
  tab,
  onTabChange,
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomChange,
  category,
  onCategoryChange,
}: {
  tab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  range: ReportRange;
  onRangeChange: (range: ReportRange) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (patch: { start?: string; end?: string }) => void;
  category: string;
  onCategoryChange: (category: string) => void;
}) {
  return (
    <div className="surface-flat flex flex-wrap items-center gap-4 p-4">
      <ReportTabs value={tab} onChange={onTabChange} />

      <div aria-hidden className="h-6 w-px bg-border" />

      <Select
        aria-label="Período"
        value={range}
        onChange={(event) => onRangeChange(event.target.value as ReportRange)}
        options={REPORT_RANGES}
        className="h-10 w-auto"
      />

      {/* Os dois campos só no modo personalizado — como no original. */}
      {range === 'custom' ? (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Início do período"
            value={customStart}
            onChange={(event) => onCustomChange({ start: event.target.value })}
            className="h-9 w-auto text-xs"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="date"
            aria-label="Fim do período"
            value={customEnd}
            onChange={(event) => onCustomChange({ end: event.target.value })}
            className="h-9 w-auto text-xs"
          />
        </div>
      ) : null}

      {tab === 'products' ? (
        <Select
          aria-label="Categoria"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          options={REPORT_CATEGORY_FILTERS}
          className="h-10 w-auto"
        />
      ) : null}
    </div>
  );
}
