import { Quote } from 'lucide-react';
import { SectionHeading } from './section-heading';

/**
 * `DEPOIMENTOS — O que dizem nossas clientes` (print `004033`).
 *
 * ================== OS TRES SAO LITERAIS DO ORIGINAL ==================
 *
 * No original a lista `TESTIMONIALS` esta ESCRITA no `index.tsx` — nao vem do
 * banco e nao tem tela no painel. Transcricao literal, e ela bate palavra por
 * palavra com o print `004033`:
 *
 *   Mariana S. · Cliente desde 2024 · "Tecido impecável e caimento dos sonhos.
 *                                            Já é minha loja favorita."
 *   Beatriz L. · Cliente VIP          · "Atendimento atencioso e entrega
 *                                            rápida. As peças são lindas demais!"
 *   Camila R.  · Embaixadora          · "Visual sofisticado e conforto absurdo.
 *                                            Recomendo de olhos fechados."
 *
 * Nao ha dado de painel para ler, entao nao ha como divergir do admin: nao
 * existe admin deste bloco. Se um dia os depoimentos vierem do banco, eles
 * nascem em `lib/conteudo` e este componente passa a recebe-los por prop — como
 * os beneficios e os slides ja fazem.
 *
 * ================== O FUNDO ==================
 *
 * O original usa `bg-beige`; o projeto nao tem esse token. Vira `bg-secondary`,
 * a mesma conversao de toda a Fase 2 (divergencia registrada).
 */
const DEPOIMENTOS = [
  {
    nome: 'Mariana S.',
    papel: 'Cliente desde 2024',
    texto: 'Tecido impecável e caimento dos sonhos. Já é minha loja favorita.',
  },
  {
    nome: 'Beatriz L.',
    papel: 'Cliente VIP',
    texto: 'Atendimento atencioso e entrega rápida. As peças são lindas demais!',
  },
  {
    nome: 'Camila R.',
    papel: 'Embaixadora',
    texto: 'Visual sofisticado e conforto absurdo. Recomendo de olhos fechados.',
  },
] as const;

export function Depoimentos() {
  return (
    <section className="bg-secondary py-20">
      <div className="container mx-auto px-4">
        <SectionHeading eyebrow="Depoimentos" title="O que dizem nossas clientes" />
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {DEPOIMENTOS.map((d) => (
            <div key={d.nome} className="rounded-2xl bg-background p-8 shadow-soft">
              <Quote className="mb-4 size-6 text-accent" aria-hidden />
              <p className="text-sm italic leading-relaxed text-foreground/80">&quot;{d.texto}&quot;</p>
              <div className="mt-6 border-t border-border pt-6">
                <div className="text-sm font-medium">{d.nome}</div>
                <div className="text-xs text-muted-foreground">{d.papel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
