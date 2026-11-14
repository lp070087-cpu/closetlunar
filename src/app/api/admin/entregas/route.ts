import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessaoAtual } from '@/lib/auth/guardas';
import { lerEntrega, prepararEntrega } from '@/lib/entregas/rastreio';

export const dynamic = 'force-dynamic';

async function admin() {
  const s = await sessaoAtual().catch(() => null);
  return !!s && s.papel === 'admin';
}

/** GET: pedidos pagos de entrega propria (ultimos 60 dias) com o estado da entrega. */
export async function GET() {
  if (!(await admin())) return NextResponse.json({ ok: false }, { status: 401 });
  const desde = new Date(Date.now() - 60 * 86400000);
  const pedidos = await db()!.order.findMany({
    where: { paymentStatus: 'pago', shippingKind: 'propria', placedAt: { gte: desde } },
    orderBy: { placedAt: 'desc' },
    take: 100,
  });
  const lista = await Promise.all(
    pedidos.map(async (p) => {
      const e = await lerEntrega(p.id);
      return {
        id: p.id,
        code: p.code,
        cliente: p.customerName,
        telefone: p.customerPhone,
        endereco: `${p.addressStreet}, ${p.addressNumber}${p.addressComplement ? ' — ' + p.addressComplement : ''} · ${p.addressDistrict}, ${p.addressCity}`,
        metodo: p.shipmentMethod,
        status: p.status,
        entrega: e ? { status: e.status, token: e.token, entregador: e.entregador } : null,
      };
    }),
  );
  return NextResponse.json({ ok: true, pedidos: lista });
}

/** POST {orderId, entregador}: gera/atualiza o link do entregador. */
export async function POST(req: Request) {
  if (!(await admin())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { orderId?: string; entregador?: string };
  if (!b.orderId) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await prepararEntrega(b.orderId, String(b.entregador ?? '').slice(0, 60));
  if (!r) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, token: r.token, temDestino: !!r.destino });
}
