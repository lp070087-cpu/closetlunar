'use server';

/** Leituras reais de registros do banco para o painel (somente admin). */

import { db, temBanco } from '@/lib/db';
import { sessaoAtual } from '@/lib/auth/guardas';
import { configMelhorEnvio, configPagamento } from '@/lib/integracoes/config';

async function ehAdmin() {
  const s = await sessaoAtual().catch(() => null);
  return !!s && s.papel === 'admin';
}

export async function auditoriaAcao(): Promise<{ id: string; action: string; createdAt: string }[] | null> {
  if (!temBanco()) return null;
  if (!(await ehAdmin())) return [];
  const l = await db()!.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return l.map((x) => ({ id: x.id, action: x.action, createdAt: x.createdAt.toISOString() }));
}

export async function emailsEnviadosAcao(): Promise<{ id: string; email: string; templateName: string; sentAt: string }[] | null> {
  if (!temBanco()) return null;
  if (!(await ehAdmin())) return [];
  const l = await db()!.emailLog.findMany({ orderBy: { sentAt: 'desc' }, take: 200 });
  return l.map((x) => ({ id: x.id, email: x.email, templateName: x.templateName, sentAt: x.sentAt.toISOString() }));
}

export type Verificacao = { status: 'ok' | 'fail'; detail?: string };

/** O checklist "Abrir loja" calculado com os dados reais. */
export async function checklistAcao(): Promise<Record<string, Verificacao> | null> {
  if (!temBanco()) return null;
  if (!(await ehAdmin())) return {};
  const c = db()!;
  const [ativos, comFoto, categorias, semEstoque, pag, me, banners, rodape, insta] = await Promise.all([
    c.product.count({ where: { status: 'active' } }),
    c.product.count({ where: { status: 'active', images: { some: {} } } }),
    c.category.count({ where: { isActive: true } }),
    c.product.count({ where: { status: 'active', stock: { lte: 0 } } }),
    configPagamento(),
    configMelhorEnvio(),
    c.setting.findUnique({ where: { key: 'modulo:conteudo:banners' } }),
    c.setting.findUnique({ where: { key: 'modulo:conteudo:rodape' } }),
    c.setting.findUnique({ where: { key: 'modulo:conteudo:instagram' } }),
  ]);
  const ok = (cond: boolean, bom: string, ruim: string): Verificacao => ({ status: cond ? 'ok' : 'fail', detail: cond ? bom : ruim });
  return {
    products: ok(ativos > 0 && comFoto === ativos, `${ativos} produtos ativos, todos com foto`, `${ativos - comFoto} produto(s) ativo(s) sem foto`),
    categories: ok(categorias > 0, `${categorias} categorias ativas`, 'Nenhuma categoria ativa'),
    stock: ok(semEstoque === 0, 'Todos os produtos ativos têm estoque', `${semEstoque} produto(s) ativo(s) sem estoque`),
    banner: ok(true, banners ? 'Banners personalizados no ar' : 'Banners padrão da loja no ar', ''),
    instagram: ok(true, insta ? 'Instagram configurado' : 'Instagram padrão (@closetlunnar)', ''),
    whatsapp: ok(true, rodape ? 'WhatsApp do rodapé configurado' : 'WhatsApp padrão do rodapé', ''),
    policy: ok(true, 'Primeira troca grátis em até 7 dias', ''),
    shipping: ok(!!me.token && me.cepOrigem.length === 8, 'Melhor Envio conectado', !me.token ? 'Falta colar o token do Melhor Envio' : 'Falta o CEP de origem'),
    payment: ok(!!pag.handle && pag.ativo, `InfinitePay ativa ($${pag.handle})`, 'InfinitePay não configurada'),
  };
}

/* ------------------------------- relatorios ------------------------------- */

function janela(range: string, inicio?: string, fim?: string): { de: Date; ate: Date } {
  const agora = new Date();
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const hoje = dia(agora);
  const mais = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
  switch (range) {
    case 'today': return { de: hoje, ate: mais(hoje, 1) };
    case 'yesterday': return { de: mais(hoje, -1), ate: hoje };
    case '7d': return { de: mais(hoje, -6), ate: mais(hoje, 1) };
    case 'month': return { de: new Date(hoje.getFullYear(), hoje.getMonth(), 1), ate: mais(hoje, 1) };
    case 'last_month': return { de: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1), ate: new Date(hoje.getFullYear(), hoje.getMonth(), 1) };
    case 'custom': {
      const de = inicio ? new Date(`${inicio}T00:00:00`) : mais(hoje, -29);
      const ate = fim ? mais(new Date(`${fim}T00:00:00`), 1) : mais(hoje, 1);
      return { de, ate };
    }
    default: return { de: mais(hoje, -29), ate: mais(hoje, 1) };
  }
}

export interface RelatorioReal {
  produtos: { id: string; name: string; category: string; stock: number; qtySold: number; revenue: number; views: number; favorites: number }[];
  clientes: { name: string; email: string; totalOrders: number; totalSpent: number; lastOrder: string; status: string }[];
  categorias: { name: string; qty: number; revenue: number }[];
}

export async function relatorioAcao(range: string, inicio?: string, fim?: string): Promise<RelatorioReal | null> {
  if (!temBanco()) return null;
  if (!(await ehAdmin())) return { produtos: [], clientes: [], categorias: [] };
  const { de, ate } = janela(range, inicio, fim);
  const c = db()!;
  const [pedidos, produtos] = await Promise.all([
    c.order.findMany({
      where: { paymentStatus: 'pago', placedAt: { gte: de, lt: ate } },
      include: { items: true },
    }),
    c.product.findMany({ include: { category: true } }),
  ]);
  const porProduto = new Map<string, { qtd: number; receita: number }>();
  const porCliente = new Map<string, { name: string; email: string; n: number; total: number; ultimo: Date }>();
  for (const p of pedidos) {
    for (const i of p.items) {
      if (!i.productId) continue;
      const a = porProduto.get(i.productId) ?? { qtd: 0, receita: 0 };
      a.qtd += i.quantity;
      a.receita += Number(i.unitPrice) * i.quantity;
      porProduto.set(i.productId, a);
    }
    const k = (p.customerEmail || p.customerPhone).toLowerCase();
    const cl = porCliente.get(k) ?? { name: p.customerName, email: p.customerEmail ?? '', n: 0, total: 0, ultimo: p.placedAt };
    cl.n += 1;
    cl.total += Number(p.total);
    if (p.placedAt > cl.ultimo) cl.ultimo = p.placedAt;
    porCliente.set(k, cl);
  }
  const linhas = produtos.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category?.name ?? 'Sem categoria',
    stock: p.stock,
    qtySold: porProduto.get(p.id)?.qtd ?? 0,
    revenue: Math.round((porProduto.get(p.id)?.receita ?? 0) * 100) / 100,
    views: 0,
    favorites: 0,
  }));
  const cat = new Map<string, { qty: number; revenue: number }>();
  for (const l of linhas) {
    const a = cat.get(l.category) ?? { qty: 0, revenue: 0 };
    a.qty += l.qtySold;
    a.revenue += l.revenue;
    cat.set(l.category, a);
  }
  return {
    produtos: linhas.sort((a, b) => b.revenue - a.revenue),
    clientes: [...porCliente.values()]
      .sort((a, b) => b.total - a.total)
      .map((x) => ({
        name: x.name,
        email: x.email,
        totalOrders: x.n,
        totalSpent: Math.round(x.total * 100) / 100,
        lastOrder: x.ultimo.toISOString(),
        status: x.n > 1 ? 'Recorrente' : 'Novo',
      })),
    categorias: [...cat.entries()]
      .map(([name, v]) => ({ name, qty: v.qty, revenue: Math.round(v.revenue * 100) / 100 }))
      .filter((x) => x.qty > 0)
      .sort((a, b) => b.revenue - a.revenue),
  };
}

/* -------------------------------- usuarios -------------------------------- */

export async function usuariosAcao(): Promise<{ userId: string; role: string }[] | null> {
  if (!temBanco()) return null;
  if (!(await ehAdmin())) return [];
  const l = await db()!.user.findMany({ where: { role: 'admin' }, select: { id: true, role: true }, orderBy: { createdAt: 'asc' } });
  return l.map((u) => ({ userId: u.id, role: u.role }));
}

/* ------------------------------- favoritos ------------------------------- */

export async function favoritosAgregadosAcao(): Promise<
  { productId: string; name: string; image: string | null; category: string | null; count: number }[] | null
> {
  if (!temBanco()) return null;
  if (!(await ehAdmin())) return [];
  const c = db()!;
  const linhas = await c.setting.findMany({ where: { key: { startsWith: 'cliente:', endsWith: ':favoritos' } } });
  const conta = new Map<string, number>();
  for (const l of linhas) for (const id of (l.value as string[]) ?? []) conta.set(id, (conta.get(id) ?? 0) + 1);
  if (!conta.size) return [];
  const prods = await c.product.findMany({
    where: { id: { in: [...conta.keys()] } },
    include: { category: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });
  return prods
    .map((p) => ({
      productId: p.id,
      name: p.name,
      image: p.images[0]?.url ?? null,
      category: p.category?.name ?? null,
      count: conta.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/* ------------------------------ dashboard admin ------------------------------ */

export interface PainelAdmin {
  produtos: number;
  pedidosHoje: number;
  receitaMes: number;
  lucroMes: number;
  margem: number;
  leads: number;
  estoqueBaixo: { name: string; stock: number }[];
  maisVendidos: { name: string; qtd: number }[];
  maisFavoritados: { name: string; count: number }[];
  aguardandoEnvio: number;
}

export async function painelAdminAcao(): Promise<PainelAdmin | null> {
  if (!temBanco()) return null;
  if (!(await ehAdmin())) return null;
  const c = db()!;
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const sessenta = new Date(agora.getTime() - 60 * 86400000);
  const [produtos, pedidosHoje, doMes, recentes, leads, baixos, aguardando, favs] = await Promise.all([
    c.product.count({ where: { status: 'active' } }),
    c.order.count({ where: { paymentStatus: 'pago', placedAt: { gte: hoje } } }),
    c.order.findMany({ where: { paymentStatus: 'pago', placedAt: { gte: inicioMes } }, include: { items: true } }),
    c.order.findMany({ where: { paymentStatus: 'pago', placedAt: { gte: sessenta } }, include: { items: true } }),
    c.setting.findUnique({ where: { key: 'modulo:crm:leads' } }),
    c.product.findMany({ where: { status: 'active', stock: { lte: 5 } }, select: { name: true, stock: true }, orderBy: { stock: 'asc' }, take: 12 }),
    c.order.count({ where: { paymentStatus: 'pago', status: { in: ['pago', 'separacao'] } } }),
    favoritosAgregadosAcao(),
  ]);
  const custos = new Map(
    (await c.product.findMany({ select: { id: true, costPrice: true } })).map((p) => [p.id, Number(p.costPrice)]),
  );
  let receita = 0;
  let custo = 0;
  for (const p of doMes) {
    receita += Number(p.total);
    for (const i of p.items) custo += (custos.get(i.productId ?? '') ?? 0) * i.quantity;
  }
  const vendidos = new Map<string, number>();
  for (const p of recentes) for (const i of p.items) vendidos.set(i.productName, (vendidos.get(i.productName) ?? 0) + i.quantity);
  const lucro = receita - custo;
  return {
    produtos,
    pedidosHoje,
    receitaMes: Math.round(receita * 100) / 100,
    lucroMes: Math.round(lucro * 100) / 100,
    margem: receita > 0 ? Math.round((lucro / receita) * 100) : 0,
    leads: Array.isArray(leads?.value) ? (leads!.value as unknown[]).length : 0,
    estoqueBaixo: baixos,
    maisVendidos: [...vendidos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, qtd]) => ({ name, qtd })),
    maisFavoritados: (favs ?? []).slice(0, 6).map((f) => ({ name: f.name, count: f.count })),
    aguardandoEnvio: aguardando,
  };
}
