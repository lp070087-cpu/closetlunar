import type { Metadata } from 'next';
import { StockView } from '@/components/admin/estoque/stock-view';

export const metadata: Metadata = { title: 'Estoque' };

/**
 * Estoque — reconstruida de adm-028 e adm-029.
 *
 * adm-028 = o topo: os quatro indicadores (`TOTAL PRODUTOS`, `BAIXO ESTOQUE`,
 * `ESGOTADOS`, `MOVIMENTAÇÕES`), a busca `Buscar produto ou SKU...` com o botão
 * de relógio e a tabela (`PRODUTO · SKU · VARIAÇÕES (COR/TAM) · ESTOQUE TOTAL ·
 * AÇÕES`). adm-029 = a mesma tela rolada, revelando as duas linhas com variação
 * de cor (`Macaquinho` e `top`) e o card `Histórico de Movimentações` com os
 * chips de filtro.
 *
 * O placeholder anterior desta rota citava `adm-041 a adm-043` — que são Avatar
 * Virtual e Provador Virtual — e listava um bloco `Indicadores` genérico. A
 * referência errada foi corrigida aqui.
 *
 * PENDÊNCIA DECLARADA — o subtítulo do menu diz mais do que a tela faz.
 *
 * `src/lib/nav.ts` descreve este item como "Quantidades por tamanho e
 * movimentações de entrada e saída". As duas metades não se sustentam nos
 * materiais: `TAM.` aparece nas tabelas mas SEMPRE com `—` (não há quantidade
 * por tamanho em print nenhum), e os chips de movimentação são Entrada, Saída,
 * Venda, Reposição, Devolução e Ajuste — não "entrada e saída".
 *
 * O `nav.ts` NÃO foi alterado: aquele arquivo está declarado como inventário
 * congelado do painel original ("não reordenar, não renomear, não remover
 * itens"), e a descrição veio de lá. Fica registrado aqui, que é onde quem for
 * mexer na tela vai ler — e some quando existir a fonte definitiva.
 *
 * A tela é um componente cliente porque tem busca, filtro e ajuste com estado.
 * A página fica como Server Component para poder, mais adiante, resolver a
 * sessão e buscar a primeira página no servidor.
 */
export default function EstoquePage() {
  return <StockView />;
}
