'use server';

/**
 * A camada de dados da AREA DA CLIENTE — ligada ao banco (Neon/Prisma).
 *
 * Tudo e da conta LOGADA (`usuarioAtual()`):
 *   - pedidos: `Order` com `userId` da conta OU o e-mail da conta (compra feita
 *     antes de criar o cadastro tambem aparece);
 *   - dados/senha/sessoes: tabela `User` / `UserSession`;
 *   - enderecos e medidas: guardados em `Setting` por cliente
 *     (`cliente:<id>:enderecos`, `cliente:<id>:medidas`, `cliente:<id>:historico`);
 *   - cupons: os cupons ATIVOS da loja (tabela `Coupon`);
 *   - pontos/cashback/afiliada: a loja ainda nao opera esses programas, entao a
 *     conta real mostra ZERO (nunca um numero de exemplo).
 *
 * Sem `DATABASE_URL` (desenvolvimento local), devolve os dados de demonstracao.
 */

import { randomBytes } from 'node:crypto';
import { db, temBanco } from '@/lib/db';
import { usuarioAtual, encerrarTodasAsSessoes } from '@/lib/auth/acoes';
import { hashSenha, MINIMO_SENHA } from '@/lib/auth/senha';
import { paraOrder } from '@/lib/pedidos/mapear-db';
import { DEMO_ORDERS_PEDIDOS } from '@/lib/pedidos/demo';
import {
  DEMO_CASHBACK,
  DEMO_CUPONS_CLIENTE,
  DEMO_ENDERECOS_CLIENTE,
  DEMO_FAVORITOS_CLIENTE,
  DEMO_HISTORICO_MEDIDAS,
  DEMO_NIVEIS_CLUBE,
  DEMO_PERFIL_MEDIDAS,
  DEMO_PONTOS_CLUBE,
  DEMO_RECOMPENSAS_CLUBE,
  DEMO_REGRAS_CLUBE,
} from './demo';
import {
  nivelAtual,
  pontosAcumulados,
  progressoClube,
  projetarPedido,
  resumirPedidos,
  resumoAfiliada,
  saldoPontosDoExtrato,
} from './metrics';
import type {
  AcessoConta,
  ContaAfiliada,
  ContaCliente,
  CupomCliente,
  EnderecoCliente,
  FavoritoCliente,
  MedidaHistorico,
  MovimentoPontos,
  PedidoCliente,
  PerfilMedidas,
  ResumoCliente,
  ResumoClube,
} from './types';

export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
  reason?: string;
}

export interface ResultadoEscrita {
  ok: boolean;
  reason?: string;
}

const SEM_LOGIN = 'Entre na sua conta para continuar.';
const DEMO = 'Modo demonstração (sem banco configurado).';

/* ------------------------------- utilitarios ------------------------------- */

async function contaReal() {
  if (!temBanco()) return null;
  return usuarioAtual();
}

async function lerJson<T>(chave: string, padrao: T): Promise<T> {
  const c = db();
  if (!c) return padrao;
  const l = await c.setting.findUnique({ where: { key: chave } });
  return (l?.value as T) ?? padrao;
}

async function gravarJson(chave: string, valor: unknown): Promise<void> {
  const c = db();
  if (!c) throw new Error('sem banco');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = valor as any;
  await c.setting.upsert({ where: { key: chave }, update: { value: v }, create: { key: chave, value: v } });
}

const chave = (id: string, nome: string) => `cliente:${id}:${nome}`;
const novoId = () => randomBytes(8).toString('hex');
const txt = (v: unknown, max = 120) => String(v ?? '').trim().slice(0, max);

/* --------------------------------- a conta --------------------------------- */

export async function getConta(): Promise<Dataset<ContaCliente>> {
  const usuario = await usuarioAtual();
  if (usuario) {
    return {
      data: { id: usuario.id, email: usuario.email, nomeCompleto: usuario.nome || null, telefone: usuario.telefone || null },
      source: 'database',
    };
  }
  return {
    data: { id: 'nao-autenticado', email: '', nomeCompleto: null, telefone: null },
    source: 'demo',
    reason: temBanco() ? SEM_LOGIN : DEMO,
  };
}

export async function salvarDadosConta(dados?: { nome: string; telefone: string }): Promise<ResultadoEscrita> {
  const u = await contaReal();
  if (!u) return { ok: false, reason: SEM_LOGIN };
  const nome = txt(dados?.nome);
  if (nome.length < 2) return { ok: false, reason: 'Informe seu nome.' };
  const telefone = txt(dados?.telefone, 20).replace(/[^\d()+\s-]/g, '');
  await db()!.user.update({ where: { id: u.id }, data: { name: nome, phone: telefone } });
  return { ok: true };
}

export async function salvarSenha(senha?: string): Promise<ResultadoEscrita> {
  const u = await contaReal();
  if (!u) return { ok: false, reason: SEM_LOGIN };
  if (!senha || senha.length < MINIMO_SENHA) return { ok: false, reason: `Mínimo ${MINIMO_SENHA} caracteres` };
  await db()!.user.update({ where: { id: u.id }, data: { passwordHash: hashSenha(senha) } });
  return { ok: true };
}

export async function encerrarSessoes(): Promise<ResultadoEscrita> {
  const r = await encerrarTodasAsSessoes();
  return { ok: r.ok, reason: r.ok ? undefined : ('motivo' in r ? String(r.motivo) : 'Não foi possível encerrar.') };
}

export async function getAcesso(): Promise<Dataset<AcessoConta>> {
  const u = await contaReal();
  if (!u) return { data: { ultimoAcessoEm: null }, source: 'demo', reason: SEM_LOGIN };
  const s = await db()!.userSession.findFirst({ where: { userId: u.id }, orderBy: { createdAt: 'desc' } });
  return { data: { ultimoAcessoEm: s ? s.createdAt.toISOString() : null }, source: 'database' };
}

/* --------------------------------- pedidos --------------------------------- */

async function pedidosReais(id: string, email: string): Promise<PedidoCliente[]> {
  const linhas = await db()!.order.findMany({
    where: { OR: [{ userId: id }, { customerEmail: email.toLowerCase() }] },
    include: { items: true },
    orderBy: { placedAt: 'desc' },
    take: 100,
  });
  return resumirPedidos(linhas.map(paraOrder).map(projetarPedido));
}

export async function listPedidos(): Promise<Dataset<PedidoCliente[]>> {
  const u = await contaReal();
  if (u) return { data: await pedidosReais(u.id, u.email), source: 'database' };
  if (temBanco()) return { data: [], source: 'demo', reason: SEM_LOGIN };
  return {
    data: resumirPedidos(DEMO_ORDERS_PEDIDOS.slice(0, 2).map(projetarPedido)),
    source: 'demo',
    reason: DEMO,
  };
}

/* ------------------------------ favoritos ------------------------------ */

export async function listFavoritos(): Promise<Dataset<FavoritoCliente[]>> {
  const u = await contaReal();
  if (!u) return { data: temBanco() ? [] : DEMO_FAVORITOS_CLIENTE.map((f) => ({ ...f })), source: 'demo' };
  const ids = await lerJson<string[]>(chave(u.id, 'favoritos'), []);
  if (!ids.length) return { data: [], source: 'database' };
  const prods = await db()!.product.findMany({ where: { id: { in: ids }, status: 'active' }, include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } });
  const ordem = new Map(ids.map((id, i) => [id, i]));
  return {
    data: prods
      .sort((a, b) => (ordem.get(a.id) ?? 0) - (ordem.get(b.id) ?? 0))
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        nome: p.name,
        preco: Number(p.promoPrice ?? p.price),
        precoDe: p.promoPrice ? Number(p.price) : null,
        imagem: p.images[0]?.url ?? null,
      })),
    source: 'database',
  };
}

/* ------------------------------ enderecos ------------------------------ */

export interface DadosEnderecoEntrada {
  label: string;
  recipient: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function listEnderecos(): Promise<Dataset<EnderecoCliente[]>> {
  const u = await contaReal();
  if (!u) {
    return temBanco()
      ? { data: [], source: 'demo', reason: SEM_LOGIN }
      : { data: DEMO_ENDERECOS_CLIENTE.map((e) => ({ ...e })), source: 'demo', reason: DEMO };
  }
  const lista = await lerJson<EnderecoCliente[]>(chave(u.id, 'enderecos'), []);
  return {
    data: [...lista].sort((a, b) => Number(b.is_default) - Number(a.is_default)),
    source: 'database',
  };
}

export async function salvarEndereco(dados?: DadosEnderecoEntrada, id?: string | null): Promise<ResultadoEscrita> {
  const u = await contaReal();
  if (!u) return { ok: false, reason: SEM_LOGIN };
  if (!dados) return { ok: false, reason: 'Dados do endereço ausentes.' };
  const cep = txt(dados.cep, 9).replace(/\D/g, '');
  if (cep.length !== 8) return { ok: false, reason: 'CEP inválido.' };
  if (!txt(dados.street) || !txt(dados.city) || !txt(dados.state, 2)) {
    return { ok: false, reason: 'Preencha rua, cidade e UF.' };
  }
  const k = chave(u.id, 'enderecos');
  const lista = await lerJson<EnderecoCliente[]>(k, []);
  const base: EnderecoCliente = {
    id: id || novoId(),
    label: txt(dados.label, 30) || 'Casa',
    recipient: txt(dados.recipient) || u.nome || '',
    phone: txt(dados.phone, 20) || null,
    cep: `${cep.slice(0, 5)}-${cep.slice(5)}`,
    street: txt(dados.street),
    number: txt(dados.number, 20) || null,
    complement: txt(dados.complement) || null,
    neighborhood: txt(dados.neighborhood) || null,
    city: txt(dados.city),
    state: txt(dados.state, 2).toUpperCase(),
    is_default: lista.length === 0,
  };
  const i = lista.findIndex((e) => e.id === base.id);
  if (i >= 0) lista[i] = { ...base, is_default: lista[i].is_default };
  else lista.push(base);
  await gravarJson(k, lista.slice(0, 20));
  return { ok: true };
}

export async function excluirEndereco(id?: string): Promise<ResultadoEscrita> {
  const u = await contaReal();
  if (!u) return { ok: false, reason: SEM_LOGIN };
  const k = chave(u.id, 'enderecos');
  let lista = (await lerJson<EnderecoCliente[]>(k, [])).filter((e) => e.id !== id);
  if (lista.length && !lista.some((e) => e.is_default)) lista = lista.map((e, n) => ({ ...e, is_default: n === 0 }));
  await gravarJson(k, lista);
  return { ok: true };
}

export async function marcarEnderecoPrincipal(id?: string): Promise<ResultadoEscrita> {
  const u = await contaReal();
  if (!u) return { ok: false, reason: SEM_LOGIN };
  const k = chave(u.id, 'enderecos');
  const lista = (await lerJson<EnderecoCliente[]>(k, [])).map((e) => ({ ...e, is_default: e.id === id }));
  await gravarJson(k, lista);
  return { ok: true };
}

/* -------------------------------- medidas -------------------------------- */

export async function getPerfilMedidas(): Promise<Dataset<PerfilMedidas | null>> {
  const u = await contaReal();
  if (!u) {
    return temBanco()
      ? { data: null, source: 'demo', reason: SEM_LOGIN }
      : { data: { ...DEMO_PERFIL_MEDIDAS }, source: 'demo', reason: DEMO };
  }
  return { data: await lerJson<PerfilMedidas | null>(chave(u.id, 'medidas'), null), source: 'database' };
}

export async function listHistoricoMedidas(): Promise<Dataset<MedidaHistorico[]>> {
  const u = await contaReal();
  if (!u) {
    return temBanco()
      ? { data: [], source: 'demo', reason: SEM_LOGIN }
      : { data: DEMO_HISTORICO_MEDIDAS.map((m) => ({ ...m })), source: 'demo', reason: DEMO };
  }
  const h = await lerJson<MedidaHistorico[]>(chave(u.id, 'historico'), []);
  return { data: [...h].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), source: 'database' };
}

export async function salvarPerfilMedidas(perfil?: Omit<PerfilMedidas, 'updated_at'>): Promise<ResultadoEscrita> {
  const u = await contaReal();
  if (!u) return { ok: false, reason: SEM_LOGIN };
  if (!perfil) return { ok: false, reason: 'Medidas ausentes.' };
  const n = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) || Number(v) <= 0 ? null : Number(v));
  const agora = new Date().toISOString();
  const limpo: PerfilMedidas = {
    height: n(perfil.height),
    weight: n(perfil.weight),
    age: n(perfil.age),
    bust: n(perfil.bust),
    waist: n(perfil.waist),
    hip: n(perfil.hip),
    usual_size: perfil.usual_size ? txt(perfil.usual_size, 5) : null,
    fit_preference: perfil.fit_preference ? txt(perfil.fit_preference, 20) : null,
    practices_activity: typeof perfil.practices_activity === 'boolean' ? perfil.practices_activity : null,
    activity_time: perfil.activity_time ? txt(perfil.activity_time, 30) : null,
    knows_measurements: typeof perfil.knows_measurements === 'boolean' ? perfil.knows_measurements : null,
    updated_at: agora,
  };
  if (!limpo.height || !limpo.weight || !limpo.age) return { ok: false, reason: 'Altura, peso e idade são obrigatórios.' };
  await gravarJson(chave(u.id, 'medidas'), limpo);
  const kh = chave(u.id, 'historico');
  const h = await lerJson<MedidaHistorico[]>(kh, []);
  h.unshift({ id: novoId(), created_at: agora, weight: limpo.weight, bust: limpo.bust, waist: limpo.waist, hip: limpo.hip });
  await gravarJson(kh, h.slice(0, 30));
  return { ok: true };
}

/* ------------------------------ clube / pontos ------------------------------ */

async function extratoReal(): Promise<MovimentoPontos[]> {
  const u = await contaReal();
  if (!u) return [];
  return lerJson<MovimentoPontos[]>(chave(u.id, 'pontos'), []);
}

export async function getClube(): Promise<Dataset<ResumoClube>> {
  const real = temBanco();
  const extrato = real ? await extratoReal() : DEMO_PONTOS_CLUBE;
  const acumulado = pontosAcumulados(extrato);
  const { nivel, proximoNivel, progressoPct, faltamProximo } = progressoClube(DEMO_NIVEIS_CLUBE, acumulado);
  return {
    data: {
      saldo: saldoPontosDoExtrato(extrato),
      acumulado,
      nivel,
      proximoNivel,
      progressoPct,
      faltamProximo,
      extrato: [...extrato].map((m) => ({ ...m })),
      recompensas: DEMO_RECOMPENSAS_CLUBE.map((r) => ({ ...r })),
      niveis: [...DEMO_NIVEIS_CLUBE].sort((a, b) => a.minimoPontos - b.minimoPontos).map((n) => ({ ...n })),
      regras: { ...DEMO_REGRAS_CLUBE },
    },
    source: real ? 'database' : 'demo',
  };
}

export async function resgatarRecompensa(): Promise<ResultadoEscrita> {
  return { ok: false, reason: 'Você ainda não tem pontos suficientes para este resgate.' };
}

/* -------------------------------- afiliada -------------------------------- */

export async function getAfiliada(): Promise<Dataset<ContaAfiliada>> {
  const u = await contaReal();
  let perfil: ContaAfiliada['perfil'] = null;
  if (u) {
    const lista = await lerJson<NonNullable<ContaAfiliada['perfil']>[]>('modulo:afiliadas:lista', []);
    perfil = lista.find((a) => a.email?.toLowerCase() === u.email.toLowerCase()) ?? null;
  }
  return {
    data: { perfil, vendas: [], resumo: resumoAfiliada(0, []) },
    source: temBanco() ? 'database' : 'demo',
  };
}

/* --------------------------------- cupons --------------------------------- */

async function cuponsAtivosLoja(): Promise<CupomCliente[]> {
  const agora = new Date();
  const linhas = await db()!.coupon.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 20 });
  return linhas
    .filter((c) => !c.startsAt || c.startsAt <= agora)
    .map((c) => ({
      id: c.id,
      code: c.code,
      kind: c.kind === 'fixed' ? 'fixed' : 'percent',
      value: Number(c.value),
      minimo: Number(c.minSubtotal) > 0 ? Number(c.minSubtotal) : null,
      expiraEm: c.expiresAt ? c.expiresAt.toISOString() : null,
      esgotado: c.maxUses != null && c.usesCount >= c.maxUses,
    }));
}

export async function listCupons(): Promise<Dataset<CupomCliente[]>> {
  if (!temBanco()) return { data: DEMO_CUPONS_CLIENTE.map((c) => ({ ...c })), source: 'demo', reason: DEMO };
  return { data: await cuponsAtivosLoja(), source: 'database' };
}

/* -------------------------------- dashboard -------------------------------- */

export async function getResumo(): Promise<Dataset<ResumoCliente>> {
  const u = await contaReal();
  if (u) {
    const pedidos = await pedidosReais(u.id, u.email);
    return {
      data: {
        pedidos: pedidos.length,
        cashback: 0,
        pontos: saldoPontosDoExtrato(await extratoReal()),
        favoritos: (await lerJson<string[]>(chave(u.id, 'favoritos'), [])).length,
        ultimoPedido: pedidos[0] ?? null,
        cuponsAtivos: (await cuponsAtivosLoja()).filter((c) => !c.esgotado),
        nivel: nivelAtual(DEMO_NIVEIS_CLUBE, pontosAcumulados(await extratoReal())),
      },
      source: 'database',
    };
  }
  const pedidos = resumirPedidos(DEMO_ORDERS_PEDIDOS.slice(0, 2).map(projetarPedido));
  return {
    data: {
      pedidos: pedidos.length,
      cashback: DEMO_CASHBACK,
      pontos: saldoPontosDoExtrato(DEMO_PONTOS_CLUBE),
      favoritos: DEMO_FAVORITOS_CLIENTE.length,
      ultimoPedido: pedidos[0] ?? null,
      cuponsAtivos: DEMO_CUPONS_CLIENTE.map((c) => ({ ...c })),
      nivel: nivelAtual(DEMO_NIVEIS_CLUBE, pontosAcumulados(DEMO_PONTOS_CLUBE)),
    },
    source: 'demo',
    reason: temBanco() ? SEM_LOGIN : DEMO,
  };
}

/* ------------------------------ favoritos reais ------------------------------ */

/** Ids dos produtos favoritos da conta logada (`null` = sem login). */
export async function idsFavoritos(): Promise<string[] | null> {
  const u = await contaReal();
  if (!u) return null;
  return lerJson<string[]>(chave(u.id, 'favoritos'), []);
}

/** Liga/desliga um favorito. `null` = precisa entrar na conta. */
export async function alternarFavorito(produtoId: string): Promise<{ favorito: boolean } | null> {
  const u = await contaReal();
  if (!u) return null;
  const k = chave(u.id, 'favoritos');
  const atual = await lerJson<string[]>(k, []);
  const tem = atual.includes(produtoId);
  const novo = tem ? atual.filter((x) => x !== produtoId) : [produtoId, ...atual].slice(0, 200);
  await gravarJson(k, novo);
  return { favorito: !tem };
}
