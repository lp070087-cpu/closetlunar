import type { Metadata } from 'next';
import { StatusPagamento } from '@/components/site/status-pagamento';

export const metadata: Metadata = {
  title: 'Pedido — Closet Lunar',
  robots: { index: false, follow: false },
};

/**
 * `/pedido-confirmado/[orderId]` — a volta da InfinitePay.
 *
 * A InfinitePay acrescenta `transaction_nsu`, `slug`, `receipt_url` e
 * `capture_method` na URL. A tela manda isso ao servidor, que confere no
 * `/payment_check` antes de liberar. Enquanto nao confirma, tenta de novo.
 */
export default async function PedidoConfirmadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderId } = await params;
  const q = await searchParams;
  const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <StatusPagamento
        pedidoId={orderId}
        transactionNsu={um(q.transaction_nsu)}
        slug={um(q.slug)}
        receiptUrl={um(q.receipt_url)}
      />
    </div>
  );
}
