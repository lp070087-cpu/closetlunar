/**
 * InfinitePay — Checkout Integrado (https://api.checkout.infinitepay.io).
 *
 *   POST /links          cria o link de pagamento (Pix e cartao) a partir do pedido
 *   POST /payment_check  confirma no servidor se o pagamento foi feito
 *
 * Nao precisa de chave: so a InfiniteTag (`handle`) da conta que recebe.
 *
 * REGRA DE OURO: o webhook da InfinitePay NAO tem assinatura. Nunca marque um
 * pedido como pago so porque o webhook chegou ou porque a cliente voltou pela
 * `redirect_url` — sempre confirme com `/payment_check` (ver `confirmar.ts`).
 */

const API = 'https://api.checkout.infinitepay.io';

export interface ItemLink {
  quantity: number;
  /** Centavos. */
  price: number;
  description: string;
}

export interface EntradaLink {
  handle: string;
  orderNsu: string;
  redirectUrl: string;
  webhookUrl: string;
  itens: ItemLink[];
  cliente?: { name: string; email?: string | null; phone_number?: string };
  endereco?: { cep: string; number: string; complement?: string };
}

export async function criarLinkCheckout(e: EntradaLink): Promise<{ url: string }> {
  const corpo: Record<string, unknown> = {
    handle: e.handle,
    order_nsu: e.orderNsu,
    redirect_url: e.redirectUrl,
    webhook_url: e.webhookUrl,
    items: e.itens,
  };
  if (e.cliente) corpo.customer = e.cliente;
  if (e.endereco) corpo.address = e.endereco;

  const r = await fetch(`${API}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(corpo),
    cache: 'no-store',
  });
  const j = (await r.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!r.ok || !j.url) {
    // Sem customer/address a API e mais tolerante: tenta de novo so com o essencial.
    if (e.cliente || e.endereco) {
      return criarLinkCheckout({ ...e, cliente: undefined, endereco: undefined });
    }
    throw new Error(`InfinitePay recusou o link (HTTP ${r.status}).`);
  }
  return { url: j.url };
}

export interface ResultadoCheck {
  success: boolean;
  paid: boolean;
  /** Centavos. */
  amount: number;
  paidAmount: number;
  installments: number | null;
  captureMethod: string | null;
}

export async function verificarPagamento(dados: {
  handle: string;
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<ResultadoCheck> {
  try {
    const r = await fetch(`${API}/payment_check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        handle: dados.handle,
        order_nsu: dados.orderNsu,
        transaction_nsu: dados.transactionNsu,
        slug: dados.slug,
      }),
      cache: 'no-store',
    });
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      success: j.success === true,
      paid: j.paid === true,
      amount: Number(j.amount ?? 0),
      paidAmount: Number(j.paid_amount ?? 0),
      installments: j.installments == null ? null : Number(j.installments),
      captureMethod: typeof j.capture_method === 'string' ? j.capture_method : null,
    };
  } catch {
    return { success: false, paid: false, amount: 0, paidAmount: 0, installments: null, captureMethod: null };
  }
}
