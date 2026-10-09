'use client';

import { AnalyticsCards, LooksSalvosCards } from './usage-stats';
import type { ProvadorUsage } from '@/lib/provador/types';

/**
 * AS ABAS `LOOKS SALVOS` (adm-044) E `ANALYTICS` (adm-045) DE `Provador Virtual`.
 *
 * ================== POR QUE ESTAS DUAS SAO UM COMPONENTE SO ==================
 *
 * As duas telas tem o MESMO dado na mesma forma: um titulo serifado, uma
 * descricao, e o mesmo corpo — cartoes de numero em cima, paineis de vazio
 * embaixo. O que muda e QUAIS numeros e QUAIS textos.
 *
 * Elas ficam juntas (e nao uma funcao por aba em `provador-view.tsx`) porque a
 * diferenca entre elas e so de conteudo, e nao de estrutura: separa-las deixaria
 * `provador-view.tsx` com dois blocos longos de JSX quase identicos, que e
 * exatamente o tipo de duplicacao que faz duas telas divergirem com o tempo.
 *
 * O QUE NAO SE FAZ AQUI: inventar numero. Todos os contadores chegam de
 * `DEMO_USAGE`, e a loja do material nao tinha look nenhum — todos os seis
 * valores sao zero, conferido nos dois prints.
 */
export function ProvadorInsights({
  aba,
  usage,
}: {
  aba: 'looks' | 'analytics';
  usage: ProvadorUsage;
}) {
  if (aba === 'looks') {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <h2 className="font-serif text-xl leading-tight">Looks Salvos pelas Clientes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Análise dos looks que as clientes salvaram no Provador Virtual.
          </p>
        </header>
        <LooksSalvosCards usage={usage} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="font-serif text-xl leading-tight">Provador Virtual — Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Métricas de uso do Provador Virtual, looks criados e itens adicionados ao carrinho via
          avatar.
        </p>
      </header>
      <AnalyticsCards usage={usage} />
    </div>
  );
}
