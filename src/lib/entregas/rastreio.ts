/**
 * ENTREGA LOCAL COM RASTREIO AO VIVO.
 *
 * Registro por pedido em `Setting` (`entrega:<orderId>`):
 *   token do entregador, status, ultima posicao, trilha e destino (geocodificado).
 *
 * - Admin gera o link do entregador (`/entregador/<token>`).
 * - O entregador inicia a entrega e o celular dele envia a posicao a cada poucos segundos.
 * - A cliente acompanha em `/pedido/<orderId>/rastreio` (o id do pedido e um cuid
 *   nao adivinhavel; so a posicao e o status sao expostos, nunca dados pessoais).
 */

import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';

export type StatusEntrega = 'aguardando' | 'a_caminho' | 'entregue';

export interface Ponto {
  lat: number;
  lng: number;
  em: string;
}

export interface RegistroEntrega {
  token: string;
  status: StatusEntrega;
  entregador: string;
  destino: { lat: number; lng: number } | null;
  posicao: (Ponto & { precisao: number | null }) | null;
  trilha: Ponto[];
  criadoEm: string;
  iniciadoEm: string | null;
  entregueEm: string | null;
}

const chave = (orderId: string) => `entrega:${orderId}`;

export async function lerEntrega(orderId: string): Promise<RegistroEntrega | null> {
  const l = await db()?.setting.findUnique({ where: { key: chave(orderId) } });
  return (l?.value as RegistroEntrega | undefined) ?? null;
}

async function gravar(orderId: string, r: RegistroEntrega) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = r as any;
  await db()!.setting.upsert({ where: { key: chave(orderId) }, update: { value: v }, create: { key: chave(orderId), value: v } });
}

/** Geocodifica o endereco do pedido (OpenStreetMap / Nominatim). */
async function geocodificar(p: {
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
}): Promise<{ lat: number; lng: number } | null> {
  const tentativas = [
    `${p.addressStreet}, ${p.addressNumber}, ${p.addressDistrict}, ${p.addressCity}, ${p.addressState}, Brasil`,
    `${p.addressStreet}, ${p.addressCity}, ${p.addressState}, Brasil`,
    `${p.addressDistrict}, ${p.addressCity}, ${p.addressState}, Brasil`,
  ];
  for (const q of tentativas) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`,
        { headers: { 'User-Agent': 'loja-online-rastreio/1.0', 'Accept-Language': 'pt-BR' }, cache: 'no-store' },
      );
      const j = (await r.json()) as { lat: string; lon: string }[];
      if (j[0]) return { lat: Number(j[0].lat), lng: Number(j[0].lon) };
    } catch {
      /* tenta a proxima */
    }
  }
  return null;
}

/** Cria (ou devolve) o registro e o token do entregador para um pedido. */
export async function prepararEntrega(orderId: string, entregador = ''): Promise<RegistroEntrega | null> {
  const c = db();
  if (!c) return null;
  const pedido = await c.order.findUnique({ where: { id: orderId } });
  if (!pedido) return null;
  const atual = await lerEntrega(orderId);
  if (atual) {
    if (entregador && atual.entregador !== entregador) {
      atual.entregador = entregador;
      await gravar(orderId, atual);
    }
    return atual;
  }
  const novo: RegistroEntrega = {
    token: randomBytes(18).toString('base64url'),
    status: 'aguardando',
    entregador,
    destino: await geocodificar(pedido),
    posicao: null,
    trilha: [],
    criadoEm: new Date().toISOString(),
    iniciadoEm: null,
    entregueEm: null,
  };
  await gravar(orderId, novo);
  return novo;
}

/** Acha o pedido pelo token do entregador. */
export async function pedidoDoToken(token: string): Promise<{ orderId: string; registro: RegistroEntrega } | null> {
  if (!token || token.length < 16) return null;
  const linhas = await db()?.setting.findMany({ where: { key: { startsWith: 'entrega:' } } });
  for (const l of linhas ?? []) {
    const r = l.value as unknown as RegistroEntrega;
    if (r?.token === token) return { orderId: l.key.slice('entrega:'.length), registro: r };
  }
  return null;
}

export async function registrarPosicao(token: string, lat: number, lng: number, precisao: number | null) {
  const achado = await pedidoDoToken(token);
  if (!achado) return null;
  const { orderId, registro } = achado;
  if (registro.status === 'entregue') return registro;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return registro;
  const em = new Date().toISOString();
  registro.posicao = { lat, lng, em, precisao };
  const ultimo = registro.trilha[registro.trilha.length - 1];
  if (!ultimo || Math.abs(ultimo.lat - lat) + Math.abs(ultimo.lng - lng) > 0.00005) {
    registro.trilha = [...registro.trilha, { lat, lng, em }].slice(-300);
  }
  if (registro.status === 'aguardando') {
    registro.status = 'a_caminho';
    registro.iniciadoEm = em;
    await db()!.order.update({
      where: { id: orderId },
      data: { status: 'enviado', shippingStatus: 'saiu_para_entrega' },
    }).catch(() => undefined);
  }
  await gravar(orderId, registro);
  return registro;
}

export async function concluirEntrega(token: string) {
  const achado = await pedidoDoToken(token);
  if (!achado) return null;
  const { orderId, registro } = achado;
  registro.status = 'entregue';
  registro.entregueEm = new Date().toISOString();
  await gravar(orderId, registro);
  await db()!.order.update({ where: { id: orderId }, data: { status: 'entregue', shippingStatus: 'entregue' } }).catch(() => undefined);
  await db()!.auditLog.create({ data: { action: `entrega_concluida pedido=${orderId}` } }).catch(() => undefined);
  return registro;
}

/** O que a cliente ve (sem dados pessoais). */
export function visaoPublica(r: RegistroEntrega) {
  return {
    status: r.status,
    destino: r.destino,
    posicao: r.posicao ? { lat: r.posicao.lat, lng: r.posicao.lng, em: r.posicao.em } : null,
    trilha: r.trilha.slice(-120).map((p) => [p.lat, p.lng] as [number, number]),
    iniciadoEm: r.iniciadoEm,
    entregueEm: r.entregueEm,
    entregador: r.entregador ? r.entregador.split(' ')[0] : '',
  };
}
