import type { Metadata } from 'next';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pedido — Closet Lunar',
  robots: { index: false, follow: false },
};

/**
 * `/pedido-confirmado/[orderId]` — a tela que acompanha o pagamento.
 *
 * ================== POR QUE ELA PARA NO PRIMEIRO ESTADO ==================
 *
 * O original tem QUATRO estados (`pending`, `paid`, `expired`, `refused`) e
 * chega neles consultando o gateway a cada 5 segundos
 * (`getInfinitepayPaymentStatusFn`). **Sem gateway nao ha o que consultar** — a
 * tela nao tem como saber se um pagamento foi aprovado, e nao vai fingir saber.
 *
 * Entao ela mostra o estado que E verdadeiro hoje: o pedido existe (a rota
 * recebeu um id) e o pagamento **nao foi processado**. O icone e o `Loader2` e o
 * texto e o do original para esse exato estado (`Aguardando confirmação` /
 * `Estamos verificando seu pagamento automaticamente.`) — e nao uma frase nova.
 *
 * `GATEWAY A DEFINIR`: quando o gateway entrar, os outros tres estados e o
 * `polling` entram aqui, e o original ja diz como.
 */
export default async function PedidoConfirmadoPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const curto = orderId.slice(0, 8).toUpperCase();

  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-foreground text-background">
        <Loader2 className="size-7 animate-spin" aria-hidden />
      </div>
      <h1 className="font-serif text-3xl">Aguardando confirmação</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Pedido <span className="font-mono">{curto}</span>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Estamos verificando seu pagamento automaticamente.
      </p>
      <p className="mt-2 text-xs italic text-muted-foreground">
        O pagamento entra na fase de integração — o gateway ainda não foi definido.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="text-xs uppercase tracking-wider underline">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
