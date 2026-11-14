import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lerEntrega, visaoPublica } from '@/lib/entregas/rastreio';

export const dynamic = 'force-dynamic';

/** GET: posicao ao vivo para a CLIENTE (sem dados pessoais). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db()?.order.findUnique({ where: { id }, select: { code: true, status: true, shippingKind: true, shipmentMethod: true } });
  if (!p) return NextResponse.json({ ok: false }, { status: 404 });
  const e = await lerEntrega(id);
  return NextResponse.json({
    ok: true,
    pedido: { code: p.code, status: p.status, local: p.shippingKind === 'propria', metodo: p.shipmentMethod },
    entrega: e ? visaoPublica(e) : null,
  });
}
