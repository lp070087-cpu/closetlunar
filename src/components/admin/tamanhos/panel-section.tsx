import type { ReactNode } from 'react';

/**
 * Casca de secao do painel — titulo serifado, subtitulo e o corpo.
 *
 * Existe por dois motivos:
 *
 * 1. Os dois primeiros blocos de Tamanhos (`Tabela de Medidas` e `Regras por
 *    Produto`) usam exatamente a mesma casca nos prints. Repetir o par
 *    h2/p duas vezes e onde o segundo comeca a divergir do primeiro.
 *
 * 2. Torna o cabecalho PROVAVEL. O bloco nao pode ser renderizado isolado
 *    quando o titulo mora dentro da tela que carrega dados — e sem isso a
 *    unica forma de conferir o titulo seria procurar a string no arquivo, que
 *    e um instrumento cego (casa dentro de comentario, casa o bloco errado).
 *    Como componente, a bancada renderiza e le o texto de verdade.
 *
 * Nao e compartilhado com Produtos nem Categorias: aquelas telas ja estao
 * fechadas e mexer nelas esta fora do pedido desta fase.
 */
export function PanelSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="surface p-6 sm:p-8 lg:p-10">
      <div className="mb-8">
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm font-medium text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
