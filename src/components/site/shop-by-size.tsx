import type { Product } from '@/lib/produtos/types';
import { ProductCard } from './product-card';
import { SectionHeading } from './section-heading';

/**
 * `ENCONTRE O SEU — Compre por Tamanho`.
 *
 * ================== A LISTA DE TAMANHOS E DERIVADA, NAO INVENTADA ==================
 *
 * O print (`003944`) mostra os cinco botoes `PP P M G GG` — e o `M` esta aceso
 * (preto), que e o estado inicial. O original declara a ordem canonica
 * `PP P M G GG XG` e **filtra pelos tamanhos que existem nos produtos**: um
 * tamanho que nenhuma peca tem nao ganha botao, porque clicar nele nao acharia
 * nada.
 *
 * A area da cliente ja tem uma lista de tamanhos propria (`lib/cliente`, a tela
 * `Minhas Medidas`). Aqui NAO se reusa aquela: sao conceitos diferentes — la
 * sao os tamanhos que a CLIENTE usa; aqui sao os que a LOJA vende. O projeto
 * tambem tem `lib/tamanhos`, que e a matriz de medidas peca-a-peca do admin —
 * tambem outra coisa. Os cinco do print sao os tamanhos DOS PRODUTOS, e por isso
 * sao derivados deles.
 *
 * ================== O QUE NAO ESTA AQUI: A TROCA DE TAMANHO ==================
 *
 * No original o botao aceso troca a GRADE (um `useState`). Num Componente de
 * Servidor nao ha estado — entao **o tamanho `M` esta aceso**, que e o que o
 * print mostra, e a grade mostra TODAS as pecas com estoque. Trocar de tamanho e
 * filtrar entra quando este bloco virar cliente, junto com o carrinho — fica
 * registrado como pendencia, e nao escondido.
 */
const ORDEM = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;

export function ShopBySize({
  products,
  tamanhoAceso = 'M',
}: {
  products: Product[];
  tamanhoAceso?: string;
}) {
  const disponiveis = new Set<string>();
  for (const p of products) for (const s of p.sizes) disponiveis.add(s);
  const botoes = ORDEM.filter((s) => disponiveis.has(s));
  if (botoes.length === 0 || products.length === 0) return null;

  const aceso = botoes.includes(tamanhoAceso as (typeof ORDEM)[number]) ? tamanhoAceso : botoes[0];
  const grade = products.filter((p) => p.stock > 0).slice(0, 8);

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <SectionHeading
        eyebrow="Encontre o seu"
        title="Compre por Tamanho"
        subtitle="Filtre rapidamente as peças disponíveis no seu tamanho"
        align="left"
      />
      <div className="mb-6 mt-4 flex flex-wrap gap-2 md:gap-3">
        {botoes.map((s) => (
          <span
            key={s}
            className={
              'grid h-11 min-w-[3rem] place-items-center rounded-full border px-4 text-xs font-medium uppercase tracking-[0.18em] ' +
              (s === aceso
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-foreground')
            }
          >
            {s}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {grade.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
