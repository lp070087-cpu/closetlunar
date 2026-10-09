import type { ReactNode } from 'react';

/**
 * Casca de secao do Estoque — titulo serifado, subtitulo e o corpo.
 *
 * Existe pelo mesmo motivo do `panel-section.tsx` de Tamanhos, e nao porque os
 * dois foram copiados: os dois cards do adm-029 (`Historico de Movimentacoes` e
 * o bloco de KPIs) usam a mesma casca, e repetir o par h2/p duas vezes e onde o
 * segundo comeca a divergir do primeiro.
 *
 * Torna o cabecalho PROVAVEL: como componente, a bancada renderiza o bloco com
 * dados e LE o texto de verdade, em vez de procurar a string no arquivo — que e
 * um instrumento cego, porque casa dentro de comentario e casa o bloco errado.
 *
 * E LOCAL de proposito. Nao e o `PanelSection` de Tamanhos sendo compartilhado:
 * aquela fase esta fechada, e mexer nela esta fora do pedido desta. Os dois
 * arquivos podem convergir depois, quando houver um motivo — nao antes.
 */
export function PanelSection({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Conteudo alinhado a direita do titulo — os chips do historico. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface p-6 sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm font-medium text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
