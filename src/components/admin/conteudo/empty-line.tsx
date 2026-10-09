/**
 * A LINHA VAZIA das abas do Conteudo do Site.
 *
 * ================== MEDIDO NO PRINT — E NAO E UM `EmptyState` ==================
 *
 * Em `Banners Promocionais` (adm-056) e em `Looks` (adm-061) o vazio e uma UNICA linha
 * (o de Banners Promocionais estava escrito como adm-057 numa versao anterior — ver a
 * tabela de abas corrigida em `demo.ts`).
 * de texto cinza, alinhada a ESQUERDA, logo abaixo do titulo da secao:
 *
 *   `Nenhum banner promocional.`
 *   `Nenhum look cadastrado ainda.`
 *
 * Nao ha icone, nao ha caixa, nao ha centralizacao, e nao ha botao de acao. Usar o
 * `EmptyState` do design system aqui desenharia um bloco centralizado com icone e
 * borda — que e o desenho de outras telas (Carrinho Abandonado, Favoritos) e NAO o
 * destas. A ausencia de referencia para um estado vazio maiore nao autoriza inventar
 * um: o que o print mostra e uma linha, entao e uma linha.
 */
export function EmptyLine({ text }: { text: string }) {
  return <p className="py-1 text-sm text-muted-foreground">{text}</p>;
}
