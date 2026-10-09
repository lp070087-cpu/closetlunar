/**
 * Camada de dados do módulo Relatórios — o ÚNICO ponto de contato da tela.
 *
 * Nenhum componente importa de `demo.ts`. Quando o Neon entrar, troca-se o CORPO
 * destas funções; as assinaturas e a tela continuam iguais.
 *
 * ================== ESTE MÓDULO É SÓ DE LEITURA ==================
 *
 * Não há `save`, `delete` nem `toggle` aqui — e isso não é esquecimento. A tela de
 * Relatórios é um relatório: ela lê vendas, clientes e categorias, e o original não
 * tem um único formulário. Os dois botões do cabeçalho (`CSV` e `PDF / Imprimir`)
 * EXPORTAM o que está na tela; nenhum dos dois escreve.
 *
 * Por isso `PENDING_REASON` não aparece preso a nenhuma escrita: ele existe no
 * arquivo para o dia em que a exportação precisar de um destino, mas a tela de hoje
 * não grava nada.
 *
 * ================== O QUE VAI DEPENDER DO NEON ==================
 *
 * Nenhuma tabela NOVA. As quatro leituras são consultas sobre o que já existe:
 *
 *   `listProductReport`   um JOIN de `products` com o agregado de `order_items`
 *                         (quantidade vendida e receita), `product_views` e
 *                         `favorites`. O `category` é o NOME resolvido na leitura —
 *                         o print mostra `Sem categoria` para um produto que no
 *                         catálogo tem `Tops`, então a coluna é o que o join
 *                         resolveu, não o que está gravado no produto.
 *
 *   `listCustomerReport`  um agregado de `orders` por cliente: contagem de pedidos,
 *                         soma gasta e data do último pedido.
 *
 *   `listCategoryReport`  um agregado de `order_items` por categoria da peça.
 *
 *   `listAbandonedReport` as MESMAS linhas de `lib/carrinho-abandonado`, cortadas em
 *                         `{ email, subtotal }` — o painel do print só mostra essas
 *                         duas colunas. A tabela não é nova: a tela de Carrinho
 *                         Abandonado já é dona dos dados, e criar uma segunda
 *                         leitura aqui seria um segundo dono do mesmo fato.
 *
 * ================== A JANELA DE DATAS CHEGA PRONTA ==================
 *
 * Toda leitura recebe `range: ReportRange` e as duas datas do modo personalizado.
 * Quem traduz o recorte em `[start, end]` é `rangeBounds` (em `metrics.ts`), e a
 * decisão de ONDE aplicar o corte é do banco quando ele existir (`WHERE created_at
 * BETWEEN …`). Enquanto não existe, as leituras ignoram a janela e devolvem a
 * demonstração: filtrar dados de demonstração por data daria uma tela vazia que
 * mente sobre o período — o print mostra as linhas, e a tela mostra as linhas.
 */

import { DEMO_ABANDONED_REPORT, DEMO_CATEGORY_REPORT, DEMO_CUSTOMER_REPORT, DEMO_PRODUCT_REPORT } from './demo';
import type {
  AbandonedCartRow,
  CategoryReportRow,
  CustomerReportRow,
  Dataset,
  ProductReportRow,
  ReportRange,
} from './types';

/** O recorte pedido pela tela. Só viaja; o corte por data mora em `metrics.ts`. */
export interface ReportWindowInput {
  range: ReportRange;
  /** ISO `yyyy-mm-dd` do `<input type="date">`; só é lido quando `range` é `custom`. */
  start?: string;
  end?: string;
}

/**
 * A RAZÃO ÚNICA das escritas que não gravam — o mesmo texto do resto do painel.
 *
 * Hoje nenhuma função deste arquivo escreve. Ele fica exportado assim mesmo porque
 * os dois botões de exportação do cabeçalho são o primeiro lugar onde uma escrita
 * vai aparecer (o arquivo gerado, ou o registro de quem exportou), e um texto só
 * evita que a mesma frase seja reescrita de dois jeitos diferentes.
 */
const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * AS DEZ LINHAS DE `Todos os Produtos` — adm-063/064.
 *
 * ================== A JANELA NÃO É APLICADA AQUI, E ISSO É DELIBERADO ==================
 *
 * A assinatura recebe a janela para que a troca pelo Neon seja uma troca de CORPO, e
 * não de assinatura. Mas filtrar a demonstração por data seria pior do que não
 * filtrar: as dez linhas não têm data, o corte devolveria uma lista vazia em quase
 * todo recorte, e a tela passaria a mostrar `Nenhum produto` onde o print mostra dez
 * produtos. Uma tela vazia por um filtro que o dado não tem é uma segunda mentira.
 *
 * O `void` marca a intenção: o parâmetro é lido pelo contrato, não pelo corpo.
 */
export async function listProductReport(
  input: ReportWindowInput,
  options?: { signal?: AbortSignal },
): Promise<Dataset<ProductReportRow[]>> {
  void input;
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_PRODUCT_REPORT, source: 'demo' };
}

/**
 * OS CLIENTES DA ABA `Clientes` — adm-065.
 *
 * `DEMO_CUSTOMER_REPORT` é um array VAZIO: o print mostra os três KPIs em `0`, a
 * tabela só com o cabeçalho e os dois painéis com o texto de vazio. O spread existe
 * para que o retorno seja `CustomerReportRow[]` e não `never[]` — sem ele, o tipo do
 * array vazio "grudaria" e a bancada não conseguiria provar que a tela aceita uma
 * lista preenchida quando ela existir (a mesma nota de `listPromoBanners`).
 */
export async function listCustomerReport(
  input: ReportWindowInput,
  options?: { signal?: AbortSignal },
): Promise<Dataset<CustomerReportRow[]>> {
  void input;
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: [...DEMO_CUSTOMER_REPORT], source: 'demo' };
}

/** AS CATEGORIAS DE `Desempenho por Categoria` — adm-066. Vazio, como o print. */
export async function listCategoryReport(
  input: ReportWindowInput,
  options?: { signal?: AbortSignal },
): Promise<Dataset<CategoryReportRow[]>> {
  void input;
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: [...DEMO_CATEGORY_REPORT], source: 'demo' };
}

/** OS CARRINHOS ABANDONADOS do painel de adm-065. Vazio, como o print. */
export async function listAbandonedReport(
  input: ReportWindowInput,
  options?: { signal?: AbortSignal },
): Promise<Dataset<AbandonedCartRow[]>> {
  void input;
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: [...DEMO_ABANDONED_REPORT], source: 'demo' };
}

/**
 * A JANELA PADRÃO DA TELA — o recorte com que `/admin/relatorios` abre.
 *
 * `30d` (`Últimos 30 dias`) é a opção ATIVA no `select` de adm-063. Está exportada
 * daqui porque é uma decisão da tela, não do dado, e a página precisa dela para
 * montar a primeira leitura sem duplicar a string `'30d'` em dois arquivos.
 */
export const DEFAULT_RANGE: ReportRange = '30d';

export { PENDING_REASON };
