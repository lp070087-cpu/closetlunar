import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog — Closet Lunar',
  description: 'Em breve: dicas de moda fitness, lookbooks e novidades da Closet Lunar.',
  openGraph: {
    title: 'Blog — Closet Lunar',
    description: 'Em breve: dicas de moda fitness, lookbooks e novidades da Closet Lunar.',
    type: 'website',
  },
};

/**
 * `/blog` — a pagina `Em breve`.
 *
 * ================== ELA NAO E UM PLACEHOLDER MEU — E A DO ORIGINAL ==================
 *
 * A condicao de conclusao da fase proibe `ModulePage` e `TODO visual`. Esta
 * pagina **nao e nenhum dos dois**: o `blog.tsx` do original entrega exatamente
 * isto — o selo `Em breve`, o titulo, o tracinho, o paragrafo e o `Voltar para a
 * loja` — com o texto literal. Nao ha um post sequer no material nem no original,
 * e nao ha tabela de blog em lugar nenhum do projeto.
 *
 * A diferenca entre esta pagina e um placeholder e concreta: um placeholder
 * promete um conteudo que virá por um caminho que existe; aqui, o proprio texto
 * diz que o espaco ainda nao tem conteudo. Nada foi escondido — a tela afirma o
 * que E.
 */
export default function BlogPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
      <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Em breve</span>
      <h1 className="mt-3 font-serif text-4xl italic md:text-5xl">Blog Closet Lunar</h1>
      <div className="mx-auto mt-5 h-px w-16 bg-foreground/30" />
      <p className="mt-6 text-muted-foreground">
        Estamos preparando um espaço com dicas de moda fitness, lookbooks, guias de tamanho e tudo o
        que envolve o universo Closet Lunar. Volte em breve.
      </p>
      <Link href="/" className="mt-8 inline-block text-sm underline">
        Voltar para a loja
      </Link>
    </div>
  );
}
