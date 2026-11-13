import { NextResponse } from 'next/server';
import { cotarFrete } from '@/lib/frete/melhor-envio';

export const dynamic = 'force-dynamic';

/** POST /api/frete  { cep, itens: [{ produtoId, quantidade }] } -> opcoes do Melhor Envio */
export async function POST(req: Request) {
  const corpo = (await req.json().catch(() => null)) as {
    cep?: string;
    itens?: { produtoId: string; quantidade: number }[];
  } | null;
  if (!corpo?.cep || !Array.isArray(corpo.itens) || corpo.itens.length === 0 || corpo.itens.length > 50) {
    return NextResponse.json({ ok: false, opcoes: [], mensagem: 'Dados inválidos.' }, { status: 400 });
  }
  const itens = corpo.itens
    .filter((i) => typeof i?.produtoId === 'string')
    .map((i) => ({ produtoId: i.produtoId, quantidade: Math.min(20, Math.max(1, Math.trunc(Number(i.quantidade) || 1))) }));
  const r = await cotarFrete({ cep: String(corpo.cep), itens });
  return NextResponse.json(r);
}
