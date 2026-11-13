import { NextResponse } from 'next/server';
import { confirmarPagamento, estadoDoPedido } from '@/lib/pagamento/confirmar';

export const dynamic = 'force-dynamic';

/** GET /api/pedidos/:id -> estado publico minimo (o id e um cuid nao adivinhavel). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await estadoDoPedido(id);
  if (!e) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, ...e });
}

/**
 * POST /api/pedidos/:id  { transaction_nsu, slug, receipt_url? }
 * A cliente voltou da InfinitePay: confere o pagamento no servidor e libera.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const transactionNsu = String(b.transaction_nsu ?? '');
  const slug = String(b.slug ?? '');
  const e = transactionNsu && slug
    ? await confirmarPagamento({
        orderNsu: id,
        transactionNsu,
        slug,
        receiptUrl: typeof b.receipt_url === 'string' ? b.receipt_url : null,
      })
    : await estadoDoPedido(id);
  if (!e) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, ...e });
}
