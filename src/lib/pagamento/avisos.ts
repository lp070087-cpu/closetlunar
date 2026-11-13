/**
 * AVISOS de pagamento confirmado.
 *
 * Sempre: log no servidor (Vercel Logs) + registro em `AuditLog` (feito em
 * `confirmar.ts`) + o pedido aparece como PAGO no painel `/admin/pedidos`
 * + a cliente ve "Pagamento confirmado" na tela do pedido.
 *
 * Opcional (variaveis na Vercel):
 *   RESEND_API_KEY        -> envia e-mail pela API da Resend (sem dependencia)
 *   AVISO_EMAIL_REMETENTE -> remetente verificado na Resend
 *   AVISO_EMAIL_LOJA      -> e-mail da loja que recebe "Novo pedido pago"
 *   AVISO_WEBHOOK_URL     -> qualquer URL (Make/Zapier/n8n/bot de WhatsApp) recebe um POST JSON
 */

import { db } from '@/lib/db';
import { formatBRL } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pedido = any;

async function enviarEmail(para: string, assunto: string, html: string, modelo: string) {
  const chave = process.env.RESEND_API_KEY;
  const de = process.env.AVISO_EMAIL_REMETENTE;
  if (!chave || !de || !para) return;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: de, to: [para], subject: assunto, html }),
  });
  if (r.ok) {
    await db()
      ?.emailLog.create({ data: { email: para, templateName: modelo } })
      .catch(() => undefined);
  }
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);
}

function listaItens(p: Pedido): string {
  return (p.items ?? [])
    .map(
      (i: Pedido) =>
        `<li>${i.quantity}x ${esc(i.productName)} ${esc([i.size, i.color].filter(Boolean).join(' / '))}</li>`,
    )
    .join('');
}

export async function avisarPagamentoConfirmado(p: Pedido, receiptUrl: string | null): Promise<void> {
  const total = formatBRL(Number(p.total));
  console.log(`[pagamento] PEDIDO PAGO #${p.code} total=${total}`);

  const tarefas: Promise<unknown>[] = [];

  if (p.customerEmail) {
    tarefas.push(
      enviarEmail(
        p.customerEmail,
        `Pagamento confirmado — pedido #${p.code}`,
        `<p>Oi, ${esc(p.customerName)}!</p><p>Recebemos o pagamento do seu pedido <b>#${esc(p.code)}</b> (${total}). Já estamos separando suas peças.</p><ul>${listaItens(p)}</ul>${receiptUrl ? `<p><a href="${esc(receiptUrl)}">Ver comprovante</a></p>` : ''}<p>Closet Lunna</p>`,
        'pagamento_confirmado_cliente',
      ),
    );
  }
  const loja = process.env.AVISO_EMAIL_LOJA;
  if (loja) {
    tarefas.push(
      enviarEmail(
        loja,
        `Novo pedido pago #${p.code} — ${total}`,
        `<p><b>${esc(p.customerName)}</b> (${esc(p.customerPhone)}) pagou ${total}.</p><ul>${listaItens(p)}</ul><p>Entrega: ${esc(p.shipmentMethod ?? '-')} · ${esc(p.addressCity)}/${esc(p.addressState)}</p>`,
        'pagamento_confirmado_loja',
      ),
    );
  }
  const gancho = process.env.AVISO_WEBHOOK_URL;
  if (gancho) {
    tarefas.push(
      fetch(gancho, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'pedido_pago',
          pedido: p.code,
          id: p.id,
          total: Number(p.total),
          cliente: { nome: p.customerName, telefone: p.customerPhone, email: p.customerEmail },
          comprovante: receiptUrl,
        }),
      }),
    );
  }
  await Promise.allSettled(tarefas);
}
