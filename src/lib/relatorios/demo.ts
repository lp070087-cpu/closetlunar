/**
 * Dados de demonstração do módulo Relatórios.
 *
 * TRANSCRITOS LINHA POR LINHA de adm-063/064 (Produtos), adm-065 (Clientes) e
 * adm-066 (Categorias). Nada aqui é persistência: `data.ts` é o único consumidor,
 * e a tela nunca importa deste arquivo.
 *
 * ================== AS DEZ LINHAS DE `Todos os Produtos` ==================
 *
 * A ORDEM É A DO PRINT, lida duas vezes (o topo em adm-063, o resto em adm-064):
 *
 *   1. Top Essential Sustentação   Tops               35  0   R$ 0,00  0  0
 *   2. Conjunto Glow Nude          Conjuntos          20  0   R$ 0,00  0  0
 *   3. Kit Nike                    Conjuntos           1  0   R$ 0,00  0  0
 *   4. Legging Modeladora Premium  Leggings           40  0   R$ 0,00  0  0
 *   5. Short Fitness Energy        Shorts             30  0   R$ 0,00  0  0
 *   6. Cropped Urban Fit           Tops               28  0   R$ 0,00  0  0
 *   7. Jaqueta Corta Vento Fit     Tops               22  0   R$ 0,00  1  0
 *   8. Macaquinho costas nuas      Macaquinhos        18  0   R$ 0,00  0  0
 *   9. Macaquinho                  Macaquinhos         5  0   R$ 0,00  0  0
 *  10. top                         Sem categoria       8  0   R$ 0,00  0  0
 *
 * O `8 / 5 / 1 / 22 / 30 / 40 / 28 / 18 / 35` da coluna ESTOQUE casa com o
 * catálogo de `lib/produtos` (mesmos valores), o que CONFIRMA que a fonte é o
 * mesmo banco — mas a tabela do relatório NÃO é o catálogo, porque `top` vem como
 * `Sem categoria` (no catálogo é `Tops`) e `Conjunto Glow Nude` não está no
 * catálogo (`Kit Nike` está). Ver `types.ts`, `ProductReportRow`.
 *
 * ================== OS DOIS ESTADOS VAZIOS DE adm-064 ==================
 *
 * `Estoque Baixo (≤ 5)` mostra DUAS linhas: `Kit Nike` (`1 un.`) e `Macaquinho`
 * (`5 un.`) — os dois produtos com estoque ≤ 5, em ordem crescente de estoque.
 *
 * `Sem Vendas no Período` lista os produtos com `qtySold === 0`. Como TODAS as dez
 * linhas têm zero vendas, o painel do print traz vários nomes e rola (a barra de
 * rolagem aparece na captura). A lista abaixo é a que aparece em adm-064, na
 * ordem do print, e é o que o filtro por `qtySold === 0` reproduz.
 *
 * ================== O estado de CLIENTES é VAZIO (adm-065) ==================
 *
 * Os três KPIs mostram `0`, a tabela `Top Clientes` só tem o cabeçalho, e os dois
 * painéis dizem `Nenhum cliente inativo no período.` e `Nenhum carrinho abandonado
 * no período.` Ou seja: a loja de demonstração não tem clientes, e as listas de
 * clientes/carrinhos ficam vazias — como o print. Não há cliente inventado.
 *
 * ================== o estado de CATEGORIAS é VAZIO (adm-066) ==================
 *
 * A tabela `Desempenho por Categoria` do print só tem o cabeçalho — nenhuma linha,
 * e o gráfico `Receita por Categoria` do original também não aparece (ele só é
 * desenhado quando há linhas). Sem vendas não há receita por categoria, e a tela
 * fica exatamente como o print a mostra.
 */

import type {
  AbandonedCartRow,
  CategoryReportRow,
  CustomerReportRow,
  ProductReportRow,
} from './types';

/**
 * As dez linhas de `Todos os Produtos`, na ordem de adm-063/064.
 *
 * Os únicos valores NÃO-zero são: `stock` (de cada um), as duas linhas de estoque
 * baixo, e o `views: 1` da `Jaqueta Corta Vento Fit`. Todo o resto é zero, como o
 * print — a loja de demonstração não vendeu nada e ninguém favoritou nada.
 */
export const DEMO_PRODUCT_REPORT: ProductReportRow[] = [
  { id: 'r-01', name: 'Top Essential Sustentação', category: 'Tops', stock: 35, qtySold: 0, revenue: 0, views: 0, favorites: 0 },
  { id: 'r-02', name: 'Conjunto Glow Nude', category: 'Conjuntos', stock: 20, qtySold: 0, revenue: 0, views: 0, favorites: 0 },
  { id: 'r-03', name: 'Kit Nike', category: 'Conjuntos', stock: 1, qtySold: 0, revenue: 0, views: 0, favorites: 0 },
  { id: 'r-04', name: 'Legging Modeladora Premium', category: 'Leggings', stock: 40, qtySold: 0, revenue: 0, views: 0, favorites: 0 },
  { id: 'r-05', name: 'Short Fitness Energy', category: 'Shorts', stock: 30, qtySold: 0, revenue: 0, views: 0, favorites: 0 },
  { id: 'r-06', name: 'Cropped Urban Fit', category: 'Tops', stock: 28, qtySold: 0, revenue: 0, views: 0, favorites: 0 },
  { id: 'r-07', name: 'Jaqueta Corta Vento Fit', category: 'Tops', stock: 22, qtySold: 0, revenue: 0, views: 1, favorites: 0 },
  { id: 'r-08', name: 'Macaquinho costas nuas', category: 'Macaquinhos', stock: 18, qtySold: 0, revenue: 0, views: 0, favorites: 0 },
  { id: 'r-09', name: 'Macaquinho', category: 'Macaquinhos', stock: 5, qtySold: 0, revenue: 0, views: 0, favorites: 0 },
  { id: 'r-10', name: 'top', category: 'Sem categoria', stock: 8, qtySold: 0, revenue: 0, views: 0, favorites: 0 },
];

/** Nenhum cliente na loja de demonstração — o print mostra `0` e a tabela vazia. */
export const DEMO_CUSTOMER_REPORT: CustomerReportRow[] = [];

/** Nenhuma receita por categoria — a tabela de adm-066 só tem o cabeçalho. */
export const DEMO_CATEGORY_REPORT: CategoryReportRow[] = [];

/** Nenhum carrinho abandonado no período — o painel de adm-065 está vazio. */
export const DEMO_ABANDONED_REPORT: AbandonedCartRow[] = [];

/**
 * AS OPÇÕES DO `select` DE PERÍODO — os sete rótulos do original.
 *
 * O ativo do print é `Últimos 30 dias` (`30d`). A ordem é a do `<select>` do
 * original, do menor recorte para o maior, com o personalizado por último.
 */
export const REPORT_RANGES: { value: string; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'custom', label: 'Personalizado' },
];

/**
 * AS CATEGORIAS DO FILTRO DA ABA `Produtos` — as oito opções do original.
 *
 * O print mostra o filtro em `Todas as Categorias` (o valor `all`). As outras
 * sete são as do original; `Promoções` NÃO é uma categoria do catálogo — é uma
 * opção do filtro do relatório, e por isso ela aparece aqui e não em
 * `lib/categorias`. Transcrever a lista como está é o que a tela do print pede.
 */
export const REPORT_CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todas as Categorias' },
  { value: 'Tops', label: 'Tops' },
  { value: 'Shorts', label: 'Shorts' },
  { value: 'Leggings', label: 'Leggings' },
  { value: 'Conjuntos', label: 'Conjuntos' },
  { value: 'Macaquinhos', label: 'Macaquinhos' },
  { value: 'Croppeds', label: 'Croppeds' },
  { value: 'Promoções', label: 'Promoções' },
];
