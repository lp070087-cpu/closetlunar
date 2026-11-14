import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { concluirEntrega, pedidoDoToken, registrarPosicao } from '@/lib/entregas/rastreio';

export const dynamic = 'force-dynamic';

/** GET: dados que o ENTREGADOR precisa (endereco e contato da cliente). */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const achado = await pedidoDoToken(token);
  if (!achado) return NextResponse.json({ ok: false }, { status: 404 });
  const p = await db()!.order.findUnique({ where: { id: achado.orderId }, include: { items: true } });
  if (!p) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({
    ok: true,
    pedido: {
      code: p.code,
      cliente: p.customerName,
      telefone: p.customerPhone,
      endereco: `${p.addressStreet}, ${p.addressNumber}${p.addressComplement ? ' — ' + p.addressComplement : ''}`,
      bairro: `${p.addressDistrict}, ${p.addressCity}/${p.addressState}`,
      cep: p.addressZip,
      itens: p.items.map((i) => `${i.quantity}x ${i.productName} ${i.size}`),
    },
    entrega: { status: achado.registro.status, destino: achado.registro.destino },
  });
}

/** POST {lat,lng,precisao} | {acao:'entregue'} */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = (await req.json().catch(() => ({}))) as { lat?: number; lng?: number; precisao?: number; acao?: string };
  const r =
    b.acao === 'entregue'
      ? await concluirEntrega(token)
      : await registrarPosicao(token, Number(b.lat), Number(b.lng), b.precisao == null ? null : Number(b.precisao));
  if (!r) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, status: r.status });
}
