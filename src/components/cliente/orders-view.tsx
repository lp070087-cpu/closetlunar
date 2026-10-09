'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { listPedidos } from '@/lib/cliente/data';
import type { PedidoCliente } from '@/lib/cliente/types';
import { ClientPageHeader } from './client-page-header';
import { PedidoCard } from './pedido-card';

/**
 * `Meus Pedidos` — `/conta/pedidos`, os prints `cli-004` e `cli-005`.
 *
 * ================== O TITULO NAO TEM LINHA DE APOIO ==================
 *
 * O print mostra `Meus Pedidos` e, imediatamente abaixo, o primeiro cartao. Nao
 * ha a segunda linha serifada que `Dados da Conta` tem (`Gerencie suas …`). Por
 * isso `descricao` nao e passada — ver a nota de `ClientPageHeader`: o campo e
 * opcional justamente para que a ausencia dele seja uma informacao.
 *
 * ================== UM CARTAO ABERTO POR VEZ ==================
 *
 * O original guarda `openId` — UM id, e nao um `Set`. Abrir outro cartao fecha o
 * anterior, e clicar no que esta aberto fecha tudo. Aqui e igual: um `string |
 * null`, e o `onAlternar` escreve `null` quando o id clicado ja estava aberto.
 *
 * Nao e um detalhe de implementacao: com um `Set`, tres cartoes ficariam abertos
 * ao mesmo tempo, e a lista de `cli-005` (que mostra os cartoes FECHADOS
 * rolando) deixaria de existir como estado.
 *
 * ================== O CARREGAMENTO MOSTRA A FRASE, E NAO UMA TARJA ==================
 *
 * `renderToStaticMarkup` nao roda efeito, entao no primeiro desenho a lista e
 * `null` e a tela escreve `Carregando...`. E o mesmo texto do original
 * (`if (!ready || isLoading) return <p …>Carregando…</p>`), montado aqui sem a
 * espera do Supabase — a leitura e local.
 *
 * ================== O ESTADO VAZIO VEM DO ORIGINAL, INTEIRO ==================
 *
 * O print NAO mostra a lista vazia: os dois prints desta tela tem pedidos. Mas o
 * original desenha o vazio por extenso, e a regra de prioridade desta fase diz
 * que o comportamento provado pelo original se preserva — o que nao se inventa e
 * a APARENCIA que nenhuma fonte mostra. Como aqui a aparencia tambem vem do
 * original (bloco tracejado, circulo com o icone, `Você ainda não fez nenhum
 * pedido.` e o botao `Começar a comprar`), o estado inteiro e transcricao.
 *
 * O `Link` do botao aponta para `/`, a home da loja. No original o destino e
 * `<Link to="/">` — a mesma home. Quando a Fase 3 chegar, `/` deixa de ser o
 * placeholder do admin e passa a ser a vitrine, e este link ja esta certo.
 */
export function OrdersView() {
  const [pedidos, setPedidos] = useState<PedidoCliente[] | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void listPedidos().then(({ data }) => {
      if (ativo) setPedidos(data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!pedidos) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <ClientPageHeader titulo="Meus Pedidos" />

      {pedidos.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-secondary/5 p-16 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-secondary/40">
            {/*
              `text-muted-foreground/40` e do original — o icone e um desenho de
              fundo, e nao um alerta. Ele fica bem mais claro que o texto.
            */}
            <Package className="size-8 text-muted-foreground/40" aria-hidden />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Você ainda não fez nenhum pedido.
          </p>
          <Link
            href="/"
            className="focus-ring mt-6 inline-block rounded-xl bg-foreground px-8 py-3 text-xs font-bold uppercase tracking-widest text-background transition-all hover:opacity-90"
          >
            Começar a comprar
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              aberto={aberto === pedido.id}
              /* Clicar no cartao aberto fecha tudo: `null`, e nao o mesmo id. */
              onAlternar={() => setAberto((atual) => (atual === pedido.id ? null : pedido.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
