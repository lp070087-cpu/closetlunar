/**
 * CONFIRMAR O PAGAMENTO E LIBERAR O PEDIDO.
 *
 * Unico caminho que leva um pedido a `pago`. Chamado pelo webhook da
 * InfinitePay e pela volta da cliente (redirect). Idempotente: chamar duas vezes
 * nao baixa estoque duas vezes nem manda dois avisos.
 *
 *   1. acha o pedido (order_nsu = Order.id);
 *   2. ja pago? devolve como esta;
 *   3. confere no servidor da InfinitePay (`/payment_check`);
 *   4. so libera se success && paid && amount >= total do pedido;
 *   5. numa transacao: marca pago SO se ainda nao estava pago (trava contra
 *      corrida webhook x redirect), baixa estoque, conta uso do cupom;
 *   6. avisa (log + e-mail/webhook opcionais) — falha de aviso nunca desfaz o pago.
 */

import { db } from '@/lib/db';
import { configPagamento } from '@/lib/integracoes/config';
import { verificarPagamento } from './infinitepay';
import { avisarPagamentoConfirmado } from './avisos';

export interface EstadoPedidoPublico {
  id: string;
  code: string;
  pago: boolean;
  paymentStatus: string;
  status: string;
  total: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publico(p: any): EstadoPedidoPublico {
  return {
    id: p.id,
    code: p.code,
    pago: p.paymentStatus === 'pago',
    paymentStatus: p.paymentStatus,
    status: p.status,
    total: Number(p.total),
  };
}

export async function estadoDoPedido(id: string): Promise<EstadoPedidoPublico | null> {
  const cliente = db();
  if (!cliente) return null;
  const p = await cliente.order.findUnique({ where: { id } });
  return p ? publico(p) : null;
}

export async function confirmarPagamento(dados: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
  receiptUrl?: string | null;
}): Promise<EstadoPedidoPublico | null> {
  const cliente = db();
  if (!cliente) return null;
  if (!dados.orderNsu || !dados.transactionNsu || !dados.slug) return null;

  const pedido = await cliente.order.findUnique({ where: { id: dados.orderNsu }, include: { items: true } });
  if (!pedido) return null;
  if (pedido.paymentStatus === 'pago') return publico(pedido);

  const { handle } = await configPagamento();
  if (!handle) return publico(pedido);

  const check = await verificarPagamento({
    handle,
    orderNsu: pedido.id,
    transactionNsu: dados.transactionNsu,
    slug: dados.slug,
  });
  const totalCentavos = Math.round(Number(pedido.total) * 100);
  if (!check.success || !check.paid || check.amount < totalCentavos) {
    return publico(pedido);
  }

  const metodo = check.captureMethod === 'credit_card' ? 'cartao' : 'pix';

  const mudou = await cliente.$transaction(async (tx) => {
    const r = await tx.order.updateMany({
      where: { id: pedido.id, paymentStatus: { not: 'pago' } },
      data: {
        paymentStatus: 'pago',
        status: 'pago',
        paymentMethod: metodo,
        paymentExternalId: `${dados.transactionNsu}|${dados.slug}`,
      },
    });
    if (r.count === 0) return false;

    for (const item of pedido.items) {
      if (!item.productId) continue;
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          productName: item.productName,
          colorName: item.color || null,
          sizeLabel: item.size || null,
          delta: -item.quantity,
          type: 'venda',
          responsible: `Pedido #${pedido.code}`,
        },
      });
    }
    // Estoque nunca fica negativo na vitrine.
    await tx.product.updateMany({ where: { stock: { lt: 0 } }, data: { stock: 0 } });

    if (pedido.couponCode) {
      await tx.coupon.updateMany({
        where: { code: pedido.couponCode },
        data: { usesCount: { increment: 1 } },
      });
    }
    await tx.auditLog.create({
      data: { action: `pagamento_confirmado pedido=${pedido.code} via=infinitepay metodo=${metodo}` },
    });
    return true;
  });

  const atualizado = await cliente.order.findUnique({ where: { id: pedido.id }, include: { items: true } });
  if (mudou && atualizado) {
    await creditarPontos(atualizado).catch(() => undefined);
    await avisarPagamentoConfirmado(atualizado, dados.receiptUrl ?? null).catch(() => undefined);
  }
  return atualizado ? publico(atualizado) : null;
}

/** Credita os pontos do Clube VIP na conta da cliente (por userId ou e-mail). */
async function creditarPontos(pedido: { id: string; code: string; total: unknown; userId: string | null; customerEmail: string | null }) {
  const c = db();
  if (!c) return;
  const regrasLinha = await c.setting.findUnique({ where: { key: 'modulo:fidelidade:regras' } });
  const regras = (regrasLinha?.value as { pointsPerReal?: number; isEnabled?: boolean } | null) ?? { pointsPerReal: 1, isEnabled: true };
  if (regras.isEnabled === false) return;
  const usuario = pedido.userId
    ? await c.user.findUnique({ where: { id: pedido.userId } })
    : pedido.customerEmail
      ? await c.user.findUnique({ where: { email: pedido.customerEmail.toLowerCase() } })
      : null;
  if (!usuario) return;
  const pontos = Math.floor(Number(pedido.total) * Number(regras.pointsPerReal ?? 1));
  if (pontos <= 0) return;
  const chave = `cliente:${usuario.id}:pontos`;
  const l = await c.setting.findUnique({ where: { key: chave } });
  const extrato = (l?.value as { id: string }[] | null) ?? [];
  if (extrato.some((m) => m.id === `compra-${pedido.id}`)) return;
  extrato.unshift({ id: `compra-${pedido.id}`, tipo: 'earn', pontos, descricao: `Compra #${pedido.code}`, criadoEm: new Date().toISOString() } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await c.setting.upsert({ where: { key: chave }, update: { value: extrato as any }, create: { key: chave, value: extrato as any } });
}
