import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre a Closet Lunar',
  description:
    'A Closet Lunar nasceu para vestir mulheres que buscam conforto, confiança e estilo. Moda fitness e streetwear com estética clean e feminina.',
};

/**
 * `/sobre` — a pagina institucional.
 *
 * ================== O TEXTO E LITERAL DO ORIGINAL ==================
 *
 * As duas frases sao do `sobre.tsx`, transcritas palavra por palavra. Nao ha
 * dado de painel para ler: o original as escreve no proprio arquivo, e nao ha
 * tela de admin para elas. Por isso nao existe como divergir do admin — nao ha
 * admin deste conteudo.
 *
 * ================== ELA E A PAGINA DE QUATRO DESTINOS ==================
 *
 * No rodape, `Trocas e devoluções`, `Política de privacidade`, `Pagamento e
 * frete` e `Contato` apontam TODOS para ca. Isso e deliberado: nenhuma dessas
 * quatro rotas existe no original nem nos prints, e criar quatro paginas vazias
 * (ou quatro `href="#"`) seria pior que apontar para a pagina que existe e diz a
 * verdade sobre a marca. Ver a nota em `site-footer.tsx`.
 */
export default function SobrePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-center font-serif text-4xl italic">Sobre a Closet Lunar</h1>
      <div className="mx-auto mb-10 mt-4 h-px w-12 bg-border" />
      <p className="mb-4 leading-relaxed text-muted-foreground">
        A Closet Lunar nasceu para vestir mulheres que buscam conforto, confiança e estilo em todos
        os momentos da rotina fitness e do dia a dia. Nossas peças foram pensadas para valorizar o
        corpo, acompanhar o movimento e entregar elegância dentro e fora da academia.
      </p>
      <p className="leading-relaxed text-muted-foreground">
        Misturamos moda fitness e streetwear com estética clean, feminina e autêntica.
      </p>
    </div>
  );
}
