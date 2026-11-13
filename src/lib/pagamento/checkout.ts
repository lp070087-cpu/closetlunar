/**
 * CHECKOUT — cria o pedido no banco e o link de pagamento na InfinitePay.
 *
 * Tudo que envolve dinheiro e recalculado AQUI, no servidor:
 *   - preco de cada peca vem do banco (promo > preco);
 *   - estoque e conferido;
 *   - frete e cotado de novo no Melhor Envio pelo `servicoId` escolhido;
 *   - cupom e validado no banco.
 * O navegador so diz O QUE quer comprar, nunca QUANTO custa.
 */

import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { configPagamento, urlDoSite } from '@/lib/integracoes/config';
import { cotarFrete } from '@/lib/frete/melhor-envio';
import { criarLinkCheckout, type ItemLink } from './infinitepay';

export interface EntradaCheckout {
  cliente: { nome: string; email: string; telefone: string; cpf?: string };
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  itens: { produtoId: string; tamanho: string; cor: string; quantidade: number }[];
  servicoFreteId: string;
  cupom?: string;
  userId?: string | null;
}

export type ResultadoCheckout =
  | { ok: true; pedidoId: string; codigo: string; url: string; total: number }
  | { ok: false; erro: string };

const so = (s: string) => s.replace(/\D/g, '');
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function novoCodigo(): string {
  const b = randomBytes(8);
  return 'CL' + Array.from(b, (x) => ALFABETO[x % ALFABETO.length]).join('').slice(0, 6);
}

export function validarEntrada(e: EntradaCheckout): string | null {
  if (!e?.cliente?.nome || e.cliente.nome.trim().length < 3) return 'Informe seu nome completo.';
  if (!/^\S+@\S+\.\S+$/.test(e.cliente.email ?? '')) return 'Informe um e-mail válido.';
  const tel = so(e.cliente.telefone ?? '');
  if (tel.length < 10 || tel.length > 13) return 'Informe um WhatsApp válido com DDD.';
  if (so(e.endereco?.cep ?? '').length !== 8) return 'CEP inválido.';
  if (!e.endereco.rua?.trim() || !e.endereco.numero?.trim() || !e.endereco.bairro?.trim())
    return 'Complete o endereço de entrega (rua, número e bairro).';
  if (!e.endereco.cidade?.trim() || !/^[A-Za-z]{2}$/.test(e.endereco.uf ?? '')) return 'Cidade/UF inválidos.';
  if (!Array.isArray(e.itens) || e.itens.length === 0 || e.itens.length > 50) return 'Sua sacola está vazia.';
  if (e.itens.some((i) => !i.produtoId || !Number.isInteger(i.quantidade) || i.quantidade < 1 || i.quantidade > 20))
    return 'Quantidade inválida na sacola.';
  if (!e.servicoFreteId) return 'Escolha uma forma de entrega.';
  return null;
}

export async function criarPedidoECobranca(e: EntradaCheckout, req: Request): Promise<ResultadoCheckout> {
  const erro = validarEntrada(e);
  if (erro) return { ok: false, erro };

  const cliente = db();
  if (!cliente) return { ok: false, erro: 'Loja em manutenção. Tente novamente em instantes.' };

  const { handle, ativo } = await configPagamento();
  if (!handle || !ativo) return { ok: false, erro: 'Pagamento temporariamente indisponível. Fale conosco no WhatsApp.' };

  // 1) Produtos e precos do banco
  const ids = [...new Set(e.itens.map((i) => i.produtoId))];
  const produtos = await cliente.product.findMany({ where: { id: { in: ids }, status: 'active' } });
  const mapa = new Map(produtos.map((p) => [p.id, p]));
  const qtdPorProduto = new Map<string, number>();
  for (const i of e.itens) qtdPorProduto.set(i.produtoId, (qtdPorProduto.get(i.produtoId) ?? 0) + i.quantidade);

  for (const [id, qtd] of qtdPorProduto) {
    const p = mapa.get(id);
    if (!p) return { ok: false, erro: 'Uma peça da sua sacola não está mais disponível. Remova-a e tente de novo.' };
    if (p.stock < qtd) return { ok: false, erro: `Estoque insuficiente de "${p.name}" (disponível: ${p.stock}).` };
  }

  const linhas = e.itens.map((i) => {
    const p = mapa.get(i.produtoId)!;
    const unit = Number(p.promoPrice ?? p.price);
    return { p, i, unit };
  });
  const subtotal = Math.round(linhas.reduce((s, l) => s + l.unit * l.i.quantidade, 0) * 100) / 100;

  // 2) Frete cotado de novo no servidor
  const cot = await cotarFrete({
    cep: e.endereco.cep,
    itens: e.itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
  });
  const frete = cot.opcoes.find((o) => o.id === String(e.servicoFreteId));
  if (!frete) return { ok: false, erro: cot.mensagem ?? 'A forma de entrega escolhida não está mais disponível. Recalcule o frete.' };

  // 3) Cupom
  let desconto = 0;
  let cupomAplicado: string | null = null;
  if (e.cupom?.trim()) {
    const c = await cliente.coupon.findUnique({ where: { code: e.cupom.trim().toUpperCase() } });
    const agora = new Date();
    const valido =
      c &&
      c.isActive &&
      (!c.startsAt || c.startsAt <= agora) &&
      (!c.expiresAt || c.expiresAt >= agora) &&
      (c.maxUses == null || c.usesCount < c.maxUses) &&
      subtotal >= Number(c.minSubtotal);
    if (!valido) return { ok: false, erro: 'Cupom inválido, expirado ou abaixo do valor mínimo.' };
    desconto =
      c.kind === 'percent' ? (subtotal * Number(c.value)) / 100 : Math.min(subtotal, Number(c.value));
    desconto = Math.round(desconto * 100) / 100;
    cupomAplicado = c.code;
  }

  const total = Math.round((subtotal - desconto + frete.preco) * 100) / 100;
  if (total < 1) return { ok: false, erro: 'Valor do pedido inválido.' };

  // 4) Pedido no banco (nasce pendente)
  let pedido = null;
  for (let tentativa = 0; tentativa < 4 && !pedido; tentativa++) {
    try {
      pedido = await cliente.order.create({
        data: {
          code: novoCodigo(),
          customerName: e.cliente.nome.trim(),
          customerPhone: so(e.cliente.telefone),
          customerEmail: e.cliente.email.trim().toLowerCase(),
          paymentMethod: 'pix',
          paymentStatus: 'pendente',
          shippingPrice: frete.preco,
          discount: desconto,
          couponCode: cupomAplicado,
          subtotal,
          total,
          shippingKind: frete.id.startsWith('propria:') || frete.id === 'retirada' ? 'propria' : 'transportadora',
          carrier: frete.empresa,
          shipmentMethod: `${frete.empresa} ${frete.nome} (${frete.prazoMin}-${frete.prazoMax} dias úteis)`.trim(),
          addressZip: so(e.endereco.cep),
          addressStreet: e.endereco.rua.trim(),
          addressNumber: e.endereco.numero.trim(),
          addressComplement: (e.endereco.complemento ?? '').trim(),
          addressDistrict: e.endereco.bairro.trim(),
          addressCity: e.endereco.cidade.trim(),
          addressState: e.endereco.uf.trim().toUpperCase(),
          status: 'novo',
          userId: e.userId ?? null,
          items: {
            create: linhas.map((l) => ({
              productId: l.p.id,
              productName: l.p.name,
              size: l.i.tamanho || 'Único',
              color: l.i.cor || '',
              quantity: l.i.quantidade,
              unitPrice: l.unit,
            })),
          },
        },
      });
    } catch (err) {
      // colisao de codigo: tenta outro
      if (tentativa === 3) throw err;
    }
  }
  if (!pedido) return { ok: false, erro: 'Não foi possível registrar o pedido.' };
  if (e.userId) await lembrarDadosDaConta(e.userId, e).catch(() => undefined);

  // 5) Itens para a InfinitePay (centavos). Com desconto, vira uma linha so com o total.
  const centavos = (v: number) => Math.round(v * 100);
  let itensLink: ItemLink[];
  if (desconto > 0) {
    itensLink = [{ quantity: 1, price: centavos(total), description: `Pedido #${pedido.code} — Closet Lunna` }];
  } else {
    itensLink = linhas.map((l) => ({
      quantity: l.i.quantidade,
      price: centavos(l.unit),
      description: [l.p.name, l.i.tamanho, l.i.cor].filter(Boolean).join(' · ').slice(0, 100),
    }));
    if (frete.preco > 0) {
      itensLink.push({ quantity: 1, price: centavos(frete.preco), description: `Frete ${frete.empresa} ${frete.nome}`.trim() });
    }
  }

  const site = urlDoSite(req);
  try {
    const { url } = await criarLinkCheckout({
      handle,
      orderNsu: pedido.id,
      redirectUrl: `${site}/pedido-confirmado/${pedido.id}`,
      webhookUrl: `${site}/api/pagamentos/infinitepay/webhook`,
      itens: itensLink,
      cliente: {
        name: e.cliente.nome.trim(),
        email: e.cliente.email.trim().toLowerCase(),
        phone_number: '+55' + so(e.cliente.telefone).replace(/^55(?=\d{10,11}$)/, ''),
      },
      endereco: {
        cep: so(e.endereco.cep),
        number: e.endereco.numero.trim(),
        complement: (e.endereco.complemento ?? '').trim() || undefined,
      },
    });
    return { ok: true, pedidoId: pedido.id, codigo: pedido.code, url, total };
  } catch {
    await cliente.order.update({ where: { id: pedido.id }, data: { status: 'cancelado', paymentStatus: 'recusado' } });
    return { ok: false, erro: 'Não foi possível abrir o pagamento agora. Tente novamente em instantes.' };
  }
}

/**
 * Depois do pedido criado por uma cliente logada: guarda o endereco na conta
 * (se ainda nao existir) e completa nome/WhatsApp vazios. Nunca guarda dados de cartao.
 */
export async function lembrarDadosDaConta(userId: string, e: EntradaCheckout): Promise<void> {
  const c = db();
  if (!c) return;
  const usuario = await c.user.findUnique({ where: { id: userId } });
  if (!usuario) return;
  const dados: { name?: string; phone?: string } = {};
  if (!usuario.name?.trim()) dados.name = e.cliente.nome.trim();
  if (!usuario.phone?.trim()) dados.phone = e.cliente.telefone.trim();
  if (Object.keys(dados).length) await c.user.update({ where: { id: userId }, data: dados });

  const chave = `cliente:${userId}:enderecos`;
  const linha = await c.setting.findUnique({ where: { key: chave } });
  const lista = ((linha?.value as { cep: string; number: string | null; is_default: boolean }[] | null) ?? []).slice();
  const cep = so(e.endereco.cep);
  const fmt = `${cep.slice(0, 5)}-${cep.slice(5)}`;
  if (lista.some((x) => so(x.cep) === cep && (x.number ?? '') === e.endereco.numero.trim())) return;
  lista.push({
    id: randomBytes(8).toString('hex'),
    label: lista.length ? 'Entrega' : 'Casa',
    recipient: e.cliente.nome.trim(),
    phone: e.cliente.telefone.trim() || null,
    cep: fmt,
    street: e.endereco.rua.trim(),
    number: e.endereco.numero.trim() || null,
    complement: (e.endereco.complemento ?? '').trim() || null,
    neighborhood: e.endereco.bairro.trim() || null,
    city: e.endereco.cidade.trim(),
    state: e.endereco.uf.trim().toUpperCase(),
    is_default: lista.length === 0,
  } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await c.setting.upsert({ where: { key: chave }, update: { value: lista as any }, create: { key: chave, value: lista as any } });
}
