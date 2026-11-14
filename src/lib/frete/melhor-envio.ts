/**
 * FRETE — cotacao pelo Melhor Envio.
 *
 *   POST {base}/api/v2/me/shipment/calculate   (token Bearer da conta)
 *
 * O token e gerado no painel do Melhor Envio (Integracoes > Permissoes de acesso
 * > Gerar novo token) e colado no admin em Configuracoes > Melhor Envio.
 *
 * O preco do frete NUNCA vem do navegador: o checkout manda so o `servicoId`, e o
 * servidor cota de novo e usa o preco que o Melhor Envio devolveu.
 */

import { db } from '@/lib/db';
import { configFrete, configMelhorEnvio } from '@/lib/integracoes/config';
import { DEMO_DELIVERY_ZONES } from '@/lib/configuracoes/demo';
import type { DeliveryZone } from '@/lib/configuracoes/types';

export interface OpcaoFrete {
  id: string;
  nome: string;
  empresa: string;
  preco: number;
  precoOriginal: number;
  prazoMin: number;
  prazoMax: number;
  gratis: boolean;
}

export interface ResultadoFrete {
  ok: boolean;
  opcoes: OpcaoFrete[];
  mensagem?: string;
  freteGratisAcima: number;
}

export function baseMelhorEnvio(sandbox: boolean): string {
  return sandbox ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br';
}

export const USER_AGENT = 'Closet Lunna (loja online)';

const semAcento = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/** Entrega propria (zonas por bairro do painel) para o CEP, se houver. */
async function entregaPropria(cep: string, subtotal: number, regras: { freteGratisAcima: number; diasManuseio: number }): Promise<OpcaoFrete | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    const j = (await r.json()) as { erro?: boolean; localidade?: string; bairro?: string };
    if (j.erro || !j.localidade || !j.bairro) return null;
    const linha = await db()?.setting.findUnique({ where: { key: 'modulo:configuracoes:zonas' } });
    const zonas = (linha?.value as DeliveryZone[] | undefined) ?? DEMO_DELIVERY_ZONES;
    const z = zonas.find(
      (x) => x.isActive && semAcento(x.city) === semAcento(j.localidade!) && semAcento(x.neighborhood) === semAcento(j.bairro!),
    );
    if (!z) return null;
    const gratis = regras.freteGratisAcima > 0 && subtotal >= regras.freteGratisAcima;
    return {
      id: `propria:${z.id}`,
      nome: z.etaLabel || 'Entrega local',
      empresa: 'Entrega Closet Lunar',
      preco: gratis ? 0 : z.price,
      precoOriginal: z.price,
      prazoMin: Math.max(0, z.daysMin),
      prazoMax: Math.max(z.daysMin, z.daysMax),
      gratis,
    };
  } catch {
    return null;
  }
}

export async function cotarFrete(entrada: {
  cep: string;
  itens: { produtoId: string; quantidade: number }[];
}): Promise<ResultadoFrete> {
  const r = await cotarMelhorEnvio(entrada);
  const cep = entrada.cep.replace(/\D/g, '');
  if (cep.length !== 8) return r;
  const regras = await configFrete();
  const cliente = db();
  const ids = [...new Set(entrada.itens.map((i) => i.produtoId))];
  const produtos = cliente
    ? await cliente.product.findMany({ where: { id: { in: ids } }, select: { id: true, price: true, promoPrice: true } })
    : [];
  const preco = new Map(produtos.map((p) => [p.id, Number(p.promoPrice ?? p.price)]));
  const subtotal = entrada.itens.reduce((s, i) => s + (preco.get(i.produtoId) ?? 0) * i.quantidade, 0);
  const propria = await entregaPropria(cep, subtotal, regras);
  const retirada: OpcaoFrete | null = regras.retiradaAtiva
    ? {
        id: 'retirada',
        nome: regras.retiradaEndereco,
        empresa: 'Retirar na loja',
        preco: 0,
        precoOriginal: 0,
        prazoMin: regras.diasManuseio,
        prazoMax: regras.diasManuseio,
        gratis: true,
      }
    : null;
  if (!propria && !retirada) return r;
  const deMelhorEnvio = r.ok ? r.opcoes.filter((o) => o.id !== 'fixo' || !propria) : [];
  const opcoes = [propria, ...deMelhorEnvio, retirada].filter(Boolean) as OpcaoFrete[];
  return { ok: true, opcoes, freteGratisAcima: regras.freteGratisAcima };
}

async function cotarMelhorEnvio(entrada: {
  cep: string;
  itens: { produtoId: string; quantidade: number }[];
}): Promise<ResultadoFrete> {
  const cfg = await configMelhorEnvio();
  const regras = await configFrete();
  const cep = entrada.cep.replace(/\D/g, '');
  const vazio = (mensagem: string): ResultadoFrete => {
    // Contingencia: frete fixo configurado no admin.
    if (regras.freteFixo > 0 && cep.length === 8) {
      return {
        ok: true,
        opcoes: [
          {
            id: 'fixo',
            nome: 'Envio padrão',
            empresa: 'Closet Lunna',
            preco: regras.freteFixo,
            precoOriginal: regras.freteFixo,
            prazoMin: regras.diasManuseio + 2,
            prazoMax: regras.diasManuseio + regras.freteFixoPrazo,
            gratis: false,
          },
        ],
        freteGratisAcima: regras.freteGratisAcima,
      };
    }
    return { ok: false, opcoes: [], mensagem, freteGratisAcima: regras.freteGratisAcima };
  };

  if (cep.length !== 8) return vazio('CEP inválido.');
  if (!cfg.token || cfg.cepOrigem.length !== 8) {
    return vazio('Cálculo de frete indisponível no momento. Fale com a loja pelo WhatsApp.');
  }

  // Preco real dos produtos (seguro e frete gratis usam o subtotal do servidor).
  const cliente = db();
  const ids = [...new Set(entrada.itens.map((i) => i.produtoId))];
  const produtos = cliente
    ? await cliente.product.findMany({ where: { id: { in: ids } }, select: { id: true, price: true, promoPrice: true } })
    : [];
  const preco = new Map(produtos.map((p) => [p.id, Number(p.promoPrice ?? p.price)]));
  const subtotal = entrada.itens.reduce((s, i) => s + (preco.get(i.produtoId) ?? 0) * i.quantidade, 0);
  const pecas = entrada.itens.reduce((s, i) => s + i.quantidade, 0) || 1;

  // Um pacote: as pecas empilham na altura; minimos dos Correios 2 x 11 x 16 cm.
  const pacote = {
    weight: Math.max(0.1, +(cfg.pesoKg * pecas).toFixed(3)),
    height: Math.min(100, Math.max(2, Math.round(cfg.alturaCm * pecas))),
    width: Math.max(11, Math.round(cfg.larguraCm)),
    length: Math.max(16, Math.round(cfg.comprimentoCm)),
  };

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(`${baseMelhorEnvio(cfg.sandbox)}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      signal: ctrl.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.token}`,
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({
        from: { postal_code: cfg.cepOrigem },
        to: { postal_code: cep },
        package: pacote,
        options: { insurance_value: Math.round(subtotal * 100) / 100, receipt: false, own_hand: false },
        ...(cfg.servicos.length ? { services: cfg.servicos.join(',') } : {}),
      }),
    });
    if (r.status === 401) return vazio('Frete indisponível: o token do Melhor Envio expirou. A loja já foi avisada.');
    if (!r.ok) return vazio('Não foi possível calcular o frete agora. Tente novamente.');
    const lista = (await r.json()) as unknown;
    const arr = Array.isArray(lista) ? lista : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let opcoes: OpcaoFrete[] = arr
      .filter((m: any) => m && !m.error && m.price)
      .map((m: any) => {
        const p = Number(m.custom_price ?? m.price);
        const min = Number(m.custom_delivery_range?.min ?? m.delivery_range?.min ?? m.delivery_time ?? 0);
        const max = Number(m.custom_delivery_range?.max ?? m.delivery_range?.max ?? m.delivery_time ?? min);
        return {
          id: String(m.id),
          nome: String(m.name ?? ''),
          empresa: String(m.company?.name ?? ''),
          preco: p,
          precoOriginal: p,
          prazoMin: min + regras.diasManuseio,
          prazoMax: max + regras.diasManuseio,
          gratis: false,
        };
      })
      .sort((a: OpcaoFrete, b: OpcaoFrete) => a.preco - b.preco);

    // No maximo 5 opcoes: as 4 mais baratas + a mais rapida (se ja nao estiver).
    if (opcoes.length > 5) {
      const baratas = opcoes.slice(0, 4);
      const rapida = [...opcoes].sort((x, y) => x.prazoMax - y.prazoMax || x.preco - y.preco)[0];
      opcoes = baratas.some((o) => o.id === rapida.id) ? opcoes.slice(0, 5) : [...baratas, rapida];
    }
    if (regras.freteGratisAcima > 0 && subtotal >= regras.freteGratisAcima && opcoes.length) {
      opcoes = opcoes.map((o, i) => (i === 0 ? { ...o, preco: 0, gratis: true } : o));
    }
    if (!opcoes.length) return vazio('Nenhuma transportadora atende esse CEP.');
    return { ok: true, opcoes, freteGratisAcima: regras.freteGratisAcima };
  } catch (e) {
    return vazio(
      (e as Error)?.name === 'AbortError'
        ? 'O Melhor Envio demorou a responder. Tente novamente.'
        : 'Não foi possível calcular o frete agora.',
    );
  } finally {
    clearTimeout(t);
  }
}

/** Testa o token: devolve o nome da conta conectada. */
export async function testarMelhorEnvio(): Promise<{ ok: boolean; mensagem: string }> {
  const cfg = await configMelhorEnvio();
  if (!cfg.token) return { ok: false, mensagem: 'Nenhum token salvo.' };
  try {
    const r = await fetch(`${baseMelhorEnvio(cfg.sandbox)}/api/v2/me`, {
      cache: 'no-store',
      headers: { Accept: 'application/json', Authorization: `Bearer ${cfg.token}`, 'User-Agent': USER_AGENT },
    });
    if (!r.ok) return { ok: false, mensagem: `Token recusado pelo Melhor Envio (HTTP ${r.status}).` };
    const j = (await r.json()) as { firstname?: string; lastname?: string; email?: string };
    const nome = [j.firstname, j.lastname].filter(Boolean).join(' ') || j.email || 'conta';
    return { ok: true, mensagem: `Conectado como ${nome}.` };
  } catch {
    return { ok: false, mensagem: 'Falha de rede ao falar com o Melhor Envio.' };
  }
}
