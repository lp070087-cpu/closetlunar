'use server';

/**
 * Camada de dados de Cupons — LIGADA AO BANCO (tabela `Coupon`).
 *
 * E a MESMA tabela que o checkout valida (`lib/pagamento/checkout.ts`), entao o
 * cupom criado aqui vale no site na hora. Escritas exigem sessao de ADMIN.
 * Sem banco (dev local), devolve a demonstracao.
 */

import { ler, escrever } from '@/lib/data/repositorio';
import { sessaoAtual } from '@/lib/auth/guardas';
import { DEMO_COUPONS } from './demo';
import { sortCoupons } from './metrics';
import type { Coupon } from './types';

export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
}

export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function paraCupom(l: any): Coupon {
  return {
    id: l.id,
    code: l.code,
    name: l.name ?? '',
    kind: l.kind === 'fixed' ? 'fixed' : 'percent',
    value: Number(l.value),
    minSubtotal: Number(l.minSubtotal ?? 0),
    maxUses: l.maxUses ?? null,
    startsAt: l.startsAt ? new Date(l.startsAt).toISOString() : null,
    expiresAt: l.expiresAt ? new Date(l.expiresAt).toISOString() : null,
    isActive: !!l.isActive,
    campaignId: l.campaignId ?? null,
    usageLimitPerUser: l.usageLimitPerUser ?? 1,
    applyTo: l.applyTo ?? 'all',
    applicableIds: l.applicableIds ?? [],
    description: l.description ?? '',
    usesCount: l.usesCount ?? 0,
    createdAt: new Date(l.createdAt ?? Date.now()).toISOString(),
  };
}

function campos(c: Coupon) {
  return {
    code: c.code.trim().toUpperCase(),
    name: c.name ?? '',
    kind: c.kind,
    value: c.value,
    minSubtotal: c.minSubtotal ?? 0,
    maxUses: c.maxUses,
    startsAt: c.startsAt ? new Date(c.startsAt) : null,
    expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
    isActive: c.isActive,
    usageLimitPerUser: c.usageLimitPerUser ?? 1,
    applyTo: c.applyTo ?? 'all',
    applicableIds: c.applicableIds ?? [],
    description: c.description ?? '',
  };
}

async function ehAdmin() {
  const s = await sessaoAtual().catch(() => null);
  return !!s && s.papel === 'admin';
}
const NEGADO = 'Apenas administradores podem alterar cupons.';

export async function listCoupons(): Promise<Dataset<Coupon[]>> {
  const r = await ler(DEMO_COUPONS, async (db) => (await db.coupon.findMany()).map(paraCupom));
  return { data: sortCoupons(r.data), source: r.source };
}

export async function getCoupon(id: string): Promise<Dataset<Coupon | null>> {
  const r = await listCoupons();
  return { data: r.data.find((c) => c.id === id) ?? null, source: r.source };
}

export async function createCoupon(coupon: Coupon): Promise<WriteResult<Coupon>> {
  if (!(await ehAdmin())) return { data: coupon, persisted: false, reason: NEGADO };
  const r = await escrever(async (db) => paraCupom(await db.coupon.create({ data: campos(coupon) })));
  return r.ok && r.valor ? { data: r.valor, persisted: true } : { data: coupon, persisted: false, reason: 'Não foi possível criar (código já existe?).' };
}

export async function updateCoupon(coupon: Coupon): Promise<WriteResult<Coupon>> {
  if (!(await ehAdmin())) return { data: coupon, persisted: false, reason: NEGADO };
  const r = await escrever(async (db) =>
    paraCupom(await db.coupon.update({ where: { id: coupon.id }, data: campos(coupon) })),
  );
  return r.ok && r.valor ? { data: r.valor, persisted: true } : { data: coupon, persisted: false, reason: r.reason };
}

export async function deleteCoupon(id: string): Promise<WriteResult<{ id: string }>> {
  if (!(await ehAdmin())) return { data: { id }, persisted: false, reason: NEGADO };
  const r = await escrever((db) => db.coupon.delete({ where: { id } }));
  return { data: { id }, persisted: r.ok, reason: r.reason };
}

export async function toggleCoupon(coupon: Coupon, isActive: boolean): Promise<WriteResult<Coupon>> {
  return updateCoupon({ ...coupon, isActive });
}
