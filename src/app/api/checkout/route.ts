import { NextResponse } from 'next/server';
import { criarPedidoECobranca, type EntradaCheckout } from '@/lib/pagamento/checkout';
import { sessaoAtual } from '@/lib/auth/guardas';

export const dynamic = 'force-dynamic';

/** POST /api/checkout -> cria o pedido (pendente) e devolve a URL da InfinitePay. */
export async function POST(req: Request) {
  const corpo = (await req.json().catch(() => null)) as EntradaCheckout | null;
  if (!corpo) return NextResponse.json({ ok: false, erro: 'Dados inválidos.' }, { status: 400 });
  const sessao = await sessaoAtual().catch(() => null);
  try {
    const r = await criarPedidoECobranca({ ...corpo, userId: sessao?.usuarioId ?? null }, req);
    return NextResponse.json(r, { status: r.ok ? 200 : 422 });
  } catch (e) {
    console.error('[checkout] falha', (e as Error)?.message);
    return NextResponse.json({ ok: false, erro: 'Erro ao finalizar. Tente novamente.' }, { status: 500 });
  }
}
