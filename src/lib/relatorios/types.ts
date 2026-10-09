/**
 * Tipos do módulo Relatórios — `/admin/relatorios`.
 *
 * DESENHADOS A PARTIR DE adm-063 a adm-066 (quatro capturas da MESMA tela, uma por
 * aba/rolagem) e do original Lovable (`ReportsAdmin`), nessa ordem de prioridade.
 *
 * ================== O QUE OS QUATRO PRINTS SUSTENTAM ==================
 *
 *   adm-063  235851  aba `Produtos` (acesa): os tres cartoes do topo (`Mais
 *                    Vendidos`, `Mais Visualizados`, `Mais Favoritados`) e o
 *                    cabecalho da tabela `Todos os Produtos`
 *   adm-064  235859  a mesma aba rolada: o resto da tabela, `Estoque Baixo (≤ 5)`
 *                    e `Sem Vendas no Período`
 *   adm-065  235911  aba `Clientes` (acesa): tres KPIs, `Top Clientes (por
 *                    faturamento)`, `Clientes Inativos (+90 dias)` e `Carrinhos
 *                    Abandonados`
 *   adm-066  235919  aba `Categorias` (acesa): a tabela `Desempenho por Categoria`
 *
 * ================== A TELA TEM TRES ABAS, E NAO QUATRO ==================
 *
 * O placeholder antigo desta rota listava QUATRO blocos, incluindo um
 * `Produtos (detalhado)` que NAO EXISTE em print nenhum. As abas dos tres prints
 * sao `Produtos`, `Clientes` e `Categorias` — tres. O quarto bloco foi inventado
 * a partir do nome da tela, e a lista real e a dos prints.
 *
 * ================== O `range` E INJETAVEL, E NAO LIDO AQUI ==================
 *
 * Os sete valores de `ReportRange` sao os do `select` do original e o ativo do
 * print (`30d` -> `Últimos 30 dias`). O corte por data mora em `metrics.ts` e
 * recebe `now: Date` de fora — sem isso a bancada passaria hoje e falharia
 * amanha, que e a mesma regra do módulo CRM.
 */

/** As tres abas da tela. Ordem do print: `Produtos`, `Clientes`, `Categorias`. */
export type ReportTab = 'products' | 'customers' | 'categories';

/** As sete opções do `select` de período — as do original e a ativa do print. */
export type ReportRange =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'month'
  | 'last_month'
  | 'custom';

/**
 * UMA LINHA de `Todos os Produtos` (adm-063/064).
 *
 * O PRINT É A FONTE, e o print NÃO É o catálogo de `/admin/produtos`. Duas provas
 * medidas nas capturas:
 *
 *   `top` aparece com a categoria **`Sem categoria`**, e no catálogo ele é `Tops`;
 *   `Conjunto Glow Nude` aparece na tabela e **não existe** no catálogo.
 *
 * Ou seja: a tela de Relatórios lê um CONJUNTO AGREGADO (produto + vendas + views
 * + favoritos), e não o catálogo cru. Transcrever o catálogo e remendar duas linhas
 * seria trocar o print por uma suposição; as dez linhas do print ficam gravadas
 * como estão. O `Conjunto Glow Nude` é o mesmo fantasma já registrado no módulo
 * Provador — ver o relatório final.
 *
 * `revenue` é DINHEIRO e `qtySold`/`views`/`favorites` são CONTAGENS. No print,
 * todas as dez linhas têm `qtySold = 0` e `revenue = 0` — a loja de demonstração
 * não tem vendas — e só `Jaqueta Corta Vento Fit` tem `views = 1`.
 */
export interface ProductReportRow {
  id: string;
  name: string;
  /** O texto da coluna CATEGORIA, já resolvido (`Tops`, `Sem categoria`, ...). */
  category: string;
  stock: number;
  qtySold: number;
  revenue: number;
  views: number;
  favorites: number;
}

/**
 * UMA LINHA de `Top Clientes (por faturamento)` (adm-065).
 *
 * `status` é o texto do selo da última coluna. O print mostra `Ativo` em toda
 * linha — e o original grava `status: "Ativo"` fixo na montagem, sem derivar de
 * nada. Aqui o campo guarda esse texto, e não um booleano que a tela traduziria:
 * é o que o dado É hoje.
 */
export interface CustomerReportRow {
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  /** ISO 8601. A coluna mostra só a data (`ÚLTIMA COMPRA`). */
  lastOrder: string;
  status: string;
}

/** UMA LINHA de `Desempenho por Categoria` (adm-066). */
export interface CategoryReportRow {
  name: string;
  /** A coluna `PRODUTOS VENDIDOS`. No original é `qty`. */
  qty: number;
  revenue: number;
}

/**
 * UMA LINHA do painel `Carrinhos Abandonados` (adm-065).
 *
 * `email` é `null` para o visitante não identificado; a tela imprime `Visitante`
 * nesse caso — o texto literal do original. Não há telefone nem data: o painel do
 * print mostra só o e-mail e o valor.
 */
export interface AbandonedCartRow {
  email: string | null;
  subtotal: number;
}

/** O que a camada de dados devolve. Igual ao `Dataset` do resto do painel. */
export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
}
