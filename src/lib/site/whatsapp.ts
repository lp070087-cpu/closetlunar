'use client';

import { useEffect, useState } from 'react';
import { getFooter } from '@/lib/conteudo/data';
import { getConfig } from '@/lib/whatsapp/data';
import { phoneDigits } from '@/lib/whatsapp/metrics';

/**
 * WhatsApp da loja no site.
 *
 * O NUMERO e as MENSAGENS vem de Admin → WhatsApp (salvos no banco). Se o numero
 * estiver vazio la, usa o do rodape. Os botoes do site abrem a conversa ja com a
 * mensagem do gatilho certo (`product_query`, `order_query`, `general_query`).
 */

interface ContatoLoja {
  telefone: string;
  modelos: Record<string, string>;
}

let contato: Promise<ContatoLoja> | undefined;

function carregar(): Promise<ContatoLoja> {
  contato ??= Promise.all([getConfig().catch(() => null), getFooter().catch(() => null)]).then(([cfg, rodape]) => {
    const modelos: Record<string, string> = {};
    for (const t of cfg?.data.templates ?? []) modelos[t.key] = t.body;
    const tel = phoneDigits(cfg?.data.whatsapp ?? '') || phoneDigits(rodape?.data.whatsapp ?? '');
    return { telefone: tel, modelos };
  });
  return contato;
}

/** Monta o link `wa.me`. `undefined` quando o numero e invalido. */
export function whatsappLinkFor(phone: string, message: string): string | undefined {
  const digits = phoneDigits(phone);
  if (!/^\d{10,15}$/.test(digits)) return undefined;
  return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(message);
}

/** O numero da loja (so digitos). */
export function useStoreWhatsApp(): string {
  return useContatoLoja().telefone;
}

export function useContatoLoja(): ContatoLoja {
  const [c, setC] = useState<ContatoLoja>({ telefone: '', modelos: {} });
  useEffect(() => {
    let ativo = true;
    carregar()
      .then((v) => {
        if (ativo) setC(v);
      })
      .catch(() => {
        contato = undefined;
      });
    return () => {
      ativo = false;
    };
  }, []);
  return c;
}

/**
 * A mensagem de um gatilho, com as variaveis trocadas
 * (`{customer_name}`, `{order_id}`, `{product_name}`). Se o modelo nao citar o
 * produto/pedido, o nome dele e acrescentado no fim para a loja saber do que se trata.
 */
export function mensagemDoGatilho(
  modelos: Record<string, string>,
  chave: string,
  padrao: string,
  vars: { produto?: string; pedido?: string; cliente?: string } = {},
): string {
  let m = (modelos[chave] || padrao).trim();
  const citaProduto = m.includes('{product_name}');
  const citaPedido = m.includes('{order_id}');
  m = m
    .replaceAll('{product_name}', vars.produto ?? '')
    .replaceAll('{order_id}', vars.pedido ? `#${vars.pedido}` : '')
    .replaceAll('{customer_name}', vars.cliente ?? '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (vars.produto && !citaProduto) m += `\nProduto: ${vars.produto}`;
  if (vars.pedido && !citaPedido) m += `\nPedido: #${vars.pedido}`;
  return m;
}
