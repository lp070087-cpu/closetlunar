import { ArrowLeft, Boxes, Clock, X } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui/stats';
import type { StockStats } from '@/lib/estoque/types';

/**
 * Os quatro indicadores do topo do adm-028.
 *
 * MEDIDO NO PRINT — os rotulos e os icones, na ordem exata:
 *
 *   TOTAL PRODUTOS   caixa            (chip claro)   -> `Boxes`  / neutral
 *   BAIXO ESTOQUE    relogio          (chip AMBAR)   -> `Clock`  / warning
 *   ESGOTADOS        X                (chip ROSA)    -> `X`      / danger
 *   MOVIMENTACOES    seta para a ESQ. (chip claro)   -> `ArrowLeft` / neutral
 *
 * A seta e para a ESQUERDA no print, e nao o icone de "entrada/saida" de
 * armazem. Trocar por um icone mais obvio seria o tipo de "melhoria" que faz a
 * tela deixar de ser a referencia.
 *
 * OS NUMEROS NAO SAO DIGITADOS: chegam prontos de `summarizeStock`, que conta as
 * mesmas linhas que a tabela mostra. Digitar `10`, `2`, `0`, `2` aqui criaria um
 * segundo lugar onde o total de produtos vive — e quando um produto novo
 * entrasse, o KPI diria 10 e a tabela mostraria 11.
 *
 * Componente APRESENTACIONAL: so desenha. E por isso que a bancada consegue
 * renderiza-lo com numeros e ler os quatro rotulos sem navegador.
 */
export function StockStatsGrid({ stats }: { stats: StockStats }) {
  return (
    <StatGrid columns={4}>
      <StatCard
        label="Total de produtos"
        value={stats.totalProducts}
        icon={Boxes}
        tone="neutral"
      />
      <StatCard
        label="Baixo estoque"
        value={stats.lowStock}
        icon={Clock}
        tone="warning"
        hint="5 unidades ou menos"
      />
      <StatCard
        label="Esgotados"
        value={stats.outOfStock}
        icon={X}
        tone="danger"
        hint="Sem unidades"
      />
      <StatCard
        label="Movimentações"
        value={stats.movements}
        icon={ArrowLeft}
        tone="neutral"
        hint="Lançamentos no histórico"
      />
    </StatGrid>
  );
}
