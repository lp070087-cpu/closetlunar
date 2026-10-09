'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { DEFAULT_RANGE, listAbandonedReport, listCategoryReport, listCustomerReport, listProductReport } from '@/lib/relatorios/data';
import { categoryShareRows, inactiveCustomers, recurringCustomers, topCustomers } from '@/lib/relatorios/metrics';
import type {
  AbandonedCartRow,
  CategoryReportRow,
  CustomerReportRow,
  ProductReportRow,
  ReportRange,
  ReportTab,
} from '@/lib/relatorios/types';
import { ReportFilter } from './report-filter';
import { CategoryReportTable } from './report-category';
import { AbandonedPanel, CustomerStats, InactiveCustomersPanel, TopCustomersTable } from './report-customer';
import { ProductReport } from './report-products';

/**
 * A tela de Relatórios (`/admin/relatorios`) — reconstruída de adm-063 a adm-066.
 *
 * ================== OS QUATRO PRINTS SÃO A MESMA TELA ==================
 *
 *   235851 (adm-063)  aba `Produtos`, topo: os três cartões + o começo de `Todos os Produtos`
 *   235859 (adm-064)  a MESMA aba, rolada: o resto da tabela, `Estoque Baixo`, `Sem Vendas`
 *   235911 (adm-065)  aba `Clientes`, tudo vazio
 *   235919 (adm-066)  aba `Categorias`, só a tabela `Desempenho por Categoria`
 *
 * Não há mais nenhuma tela de Relatórios depois de adm-066.
 *
 * ================== O TÍTULO É `Relatórios` E A DESCRIÇÃO É A DO PRINT ==================
 *
 * `Analise o desempenho da sua loja` está na captura, abaixo do título — o
 * `nav.ts` traz outra descrição, e o print manda, como em Afiliadas e Financeiro.
 *
 * ================== OS DOIS BOTÕES DO CABEÇALHO NÃO BAIXAM ARQUIVO ==================
 *
 * `CSV` (contorno, com ícone de documento) e `PDF / Imprimir` (pill preta cheia)
 * estão no canto superior direito, ao lado do título — medidos em 1820–2320px do
 * topo da captura. O original liga o primeiro a um `Blob` e o segundo a
 * `window.print()`, que são DOM puro: não há navegador na verificação deste
 * projeto, então uma prova de download não poderia falhar — e um botão que
 * "funciona" sem poder ser provado é pior do que um botão honestamente marcado.
 * Os dois levam `data-export="pendente"`, como os de Financeiro, para que a
 * bancada prove que existem, com o rótulo certo, e que nenhum está ligado a um
 * manipulador que finge exportar.
 *
 * ================== O RELÓGIO ENTRA UMA VEZ SÓ ==================
 *
 * `agora` é capturado no momento da carga e vai junto com os dados no mesmo
 * estado — como em Financeiro. O corte de `Clientes Inativos (+90 dias)` sai
 * desse instante, e não de um `new Date()` no meio do render: senão a janela do
 * período e o "hoje" do corte poderiam vir de instantes diferentes.
 *
 * ================== A JANELA DE DATAS AINDA NÃO CORTA NADA ==================
 *
 * As quatro leituras recebem `range`/`startDate`/`endDate` por contrato, mas a
 * demonstração não tem data para filtrar — ver `data.ts`. Trocar o período
 * recarrega e devolve a mesma demonstração; quando o Neon entrar, é o `WHERE`
 * do banco que passa a cortar. A tela NÃO finge o corte, e esta nota é o
 * registro da diferença.
 */
export function RelatoriosView() {
  const [tab, setTab] = useState<ReportTab>('products');
  const [range, setRange] = useState<ReportRange>(DEFAULT_RANGE);
  const [custom, setCustom] = useState({ start: '', end: '' });
  const [category, setCategory] = useState('all');

  const [dados, setDados] = useState<{
    products: ProductReportRow[];
    customers: CustomerReportRow[];
    categories: CategoryReportRow[];
    abandoned: AbandonedCartRow[];
    agora: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let vivo = true;
    (async () => {
      setLoading(true);
      setError(null);
      const agora = new Date();
      const janela = { range, start: custom.start, end: custom.end };
      try {
        const [products, customers, categories, abandoned] = await Promise.all([
          listProductReport(janela),
          listCustomerReport(janela),
          listCategoryReport(janela),
          listAbandonedReport(janela),
        ]);
        if (!vivo) return;
        setDados({
          products: products.data,
          customers: customers.data,
          categories: categories.data,
          abandoned: abandoned.data,
          agora,
        });
      } catch {
        if (vivo) setError('Não foi possível carregar os relatórios.');
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => {
      vivo = false;
    };
    // `custom` e `range` disparam nova leitura; os três são o que o banco vai usar.
  }, [range, custom.start, custom.end, reloadKey]);

  const painel = useMemo(() => {
    if (!dados) return null;
    return {
      customers: topCustomers(dados.customers),
      recurring: recurringCustomers(dados.customers).length,
      inactive: inactiveCustomers(dados.customers, dados.agora),
      categories: categoryShareRows(dados.categories),
    };
  }, [dados]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Relatórios"
        description="Analise o desempenho da sua loja"
        action={
          <>
            <Button variant="outline" size="sm" data-export="pendente" aria-disabled="true">
              <FileText className="size-4" aria-hidden />
              CSV
            </Button>
            <Button variant="primary" size="sm" data-export="pendente" aria-disabled="true">
              <FileText className="size-4" aria-hidden />
              PDF / Imprimir
            </Button>
          </>
        }
      />

      <ReportFilter
        tab={tab}
        onTabChange={setTab}
        range={range}
        onRangeChange={setRange}
        customStart={custom.start}
        customEnd={custom.end}
        onCustomChange={(patch) => setCustom((prev) => ({ ...prev, ...patch }))}
        category={category}
        onCategoryChange={setCategory}
      />

      {loading ? (
        <LoadingState label="Gerando relatório..." />
      ) : error || !dados || !painel ? (
        <ErrorState
          title="Não foi possível carregar"
          description="Tente novamente em instantes."
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : (
        <div className="space-y-8">
          {tab === 'products' ? <ProductReport rows={dados.products} category={category} /> : null}

          {tab === 'customers' ? (
            <div className="space-y-8">
              <CustomerStats
                customers={dados.customers}
                recurringCount={painel.recurring}
                abandonedCount={dados.abandoned.length}
              />
              <TopCustomersTable items={painel.customers} />
              <div className="grid gap-6 md:grid-cols-2">
                <InactiveCustomersPanel items={painel.inactive} />
                <AbandonedPanel items={dados.abandoned} />
              </div>
            </div>
          ) : null}

          {tab === 'categories' ? <CategoryReportTable items={painel.categories} /> : null}
        </div>
      )}
    </div>
  );
}
