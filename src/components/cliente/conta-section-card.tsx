import { cn } from '@/lib/utils';

/**
 * O cartao com TITULO serifado dentro do painel de conteudo — o `Card` do
 * dashboard (`Ultimo pedido`, `Cupons ativos`).
 *
 * ================== POR QUE ESTE CARTAO EXISTE E O `Stat` NAO TEM UM ==================
 *
 * Os dois blocos com titulo do Dashboard sao cartoes de verdade: o print mostra
 * a borda arredondada em volta de `Ultimo pedido`, e o painel de conteudo abre
 * espaco para ela. Os indicadores (`PEDIDOS`, `CASHBACK`, `MEUS PONTOS`), nao —
 * eles ficam soltos, sem moldura. A distincao esta no material, e nao no gosto:
 * introduzir um cartao em volta dos indicadores criaria um cartao dentro de
 * outro, e tirar a moldura destes dois apagaria o que o print desenha.
 *
 * ================== A SOMBRA ==================
 *
 * O original declara `shadow-elegant` aqui tambem. O painel da casca ja tem
 * essa sombra, e duas iguais aninhadas escurecem a juncao dos dois recortes —
 * a area entre o cartao de dentro e a borda do painel fica suja nos quatro
 * cantos. A borda sozinha ja separa os dois planos, como o print mostra.
 */
export interface ContaSectionCardProps {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}

export function ContaSectionCard({ titulo, children, className }: ContaSectionCardProps) {
  return (
    <section className={cn('rounded-[2rem] border border-border p-6 md:p-8', className)}>
      <h3 className="mb-6 font-serif text-xl md:text-2xl">{titulo}</h3>
      {children}
    </section>
  );
}
