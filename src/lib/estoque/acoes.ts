'use server';

/** Estoque no banco: linhas (produtos), historico (StockMovement) e ajuste. So admin. */

import { db, temBanco } from '@/lib/db';
import { sessaoAtual } from '@/lib/auth/guardas';
import { listProducts } from '@/lib/produtos/data';
import { buildStockRow, deltaGlyph, orderForStock } from './metrics';
import type { MovementType, StockAdjustment, StockMovement, StockRow } from './types';

async function ehAdmin() {
  const s = await sessaoAtual().catch(() => null);
  return !!s && s.papel === 'admin';
}

export async function estoqueReal(): Promise<boolean> {
  return temBanco();
}

export async function linhasEstoqueAcao(): Promise<StockRow[] | null> {
  if (!temBanco()) return null;
  const { data } = await listProducts();
  return orderForStock(data.map((p) => buildStockRow(p)));
}

export async function movimentosAcao(): Promise<StockMovement[] | null> {
  if (!temBanco()) return null;
  if (!(await ehAdmin())) return [];
  const linhas = await db()!.stockMovement.findMany({ orderBy: { at: 'desc' }, take: 300 });
  return linhas.map((l) => ({
    id: l.id,
    at: l.at.toISOString(),
    productId: l.productId ?? '',
    productName: l.productName,
    colorName: l.colorName,
    sizeLabel: l.sizeLabel,
    delta: deltaGlyph(l.type === 'ajuste' ? 'adjust' : l.delta >= 0 ? 'up' : 'down', l.delta),
    type: l.type as MovementType,
    responsible: l.responsible,
  }));
}

export async function ajustarEstoqueAcao(
  ajuste: StockAdjustment,
  contexto: { productName: string; colorName: string | null },
): Promise<{ ok: boolean; reason?: string; movimento?: StockMovement }> {
  if (!temBanco()) return { ok: false, reason: 'Banco não configurado.' };
  const s = await sessaoAtual().catch(() => null);
  if (!s || s.papel !== 'admin') return { ok: false, reason: 'Apenas administradores.' };
  const qtd = Math.max(0, Math.round(Number(ajuste.quantity) || 0));
  const c = db()!;
  try {
    const mov = await c.$transaction(async (tx) => {
      let anterior = 0;
      if (ajuste.colorId) {
        const cor = await tx.productColor.findUnique({ where: { id: ajuste.colorId } });
        anterior = cor?.stock ?? 0;
        await tx.productColor.update({ where: { id: ajuste.colorId }, data: { stock: qtd } });
      } else {
        const p = await tx.product.findUnique({ where: { id: ajuste.productId } });
        anterior = p?.stock ?? 0;
        await tx.product.update({ where: { id: ajuste.productId }, data: { stock: qtd } });
      }
      const usuario = await tx.user.findUnique({ where: { id: s.usuarioId }, select: { email: true } });
      return tx.stockMovement.create({
        data: {
          productId: ajuste.productId,
          productName: contexto.productName,
          colorName: contexto.colorName,
          sizeLabel: null,
          delta: qtd - anterior,
          type: ajuste.type,
          responsible: usuario?.email ?? 'admin',
        },
      });
    });
    return {
      ok: true,
      movimento: {
        id: mov.id,
        at: mov.at.toISOString(),
        productId: ajuste.productId,
        productName: mov.productName,
        colorName: mov.colorName,
        sizeLabel: null,
        delta: deltaGlyph(ajuste.type === 'ajuste' ? 'adjust' : mov.delta >= 0 ? 'up' : 'down', mov.delta),
        type: ajuste.type,
        responsible: mov.responsible,
      },
    };
  } catch {
    return { ok: false, reason: 'Não foi possível salvar o ajuste.' };
  }
}
