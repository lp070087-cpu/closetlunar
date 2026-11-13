import { NextResponse } from 'next/server';
import { confirmarPagamento } from '@/lib/pagamento/confirmar';

export const dynamic = 'force-dynamic';

/**
 * Webhook da InfinitePay. Chega quando o pagamento e aprovado.
 * O corpo NAO e assinado: por isso so serve de gatilho — quem decide e o
 * `/payment_check` dentro de `confirmarPagamento()`.
 * 200 = processado; 400 = a InfinitePay tenta de novo.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const orderNsu = String(b?.order_nsu ?? '');
  const transactionNsu = String(b?.transaction_nsu ?? '');
  const slug = String(b?.invoice_slug ?? b?.slug ?? '');
  if (!orderNsu || !transactionNsu || !slug) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const r = await confirmarPagamento({
    orderNsu,
    transactionNsu,
    slug,
    receiptUrl: typeof b?.receipt_url === 'string' ? b.receipt_url : null,
  });
  if (!r) return NextResponse.json({ ok: false, motivo: 'pedido não encontrado' }, { status: 400 });
  if (!r.pago) return NextResponse.json({ ok: false, motivo: 'pagamento não confirmado' }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, servico: 'webhook InfinitePay — Closet Lunna' });
}
