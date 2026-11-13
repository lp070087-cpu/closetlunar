'use server';

/**
 * Acoes do painel para as integracoes. Todas exigem sessao de ADMIN.
 * O token do Melhor Envio nunca volta inteiro para o navegador (so mascarado).
 */

import { sessaoAtual } from '@/lib/auth/guardas';
import {
  CHAVE_FRETE,
  CHAVE_MELHOR_ENVIO,
  CHAVE_PAGAMENTO,
  configFrete,
  configMelhorEnvio,
  configPagamento,
  salvarSetting,
} from './config';
import { cotarFrete, testarMelhorEnvio } from '@/lib/frete/melhor-envio';
import { criarLinkCheckout } from '@/lib/pagamento/infinitepay';
import { db } from '@/lib/db';

async function admin(): Promise<boolean> {
  const s = await sessaoAtual();
  return !!s && s.papel === 'admin';
}
const NEGADO = { ok: false, mensagem: 'Apenas administradores.' } as const;

export interface PainelIntegracoes {
  handle: string;
  pagamentoAtivo: boolean;
  meTokenMascarado: string;
  meTemToken: boolean;
  meSandbox: boolean;
  cepOrigem: string;
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  freteGratisAcima: number;
  diasManuseio: number;
  freteFixo: number;
  freteFixoPrazo: number;
  retiradaAtiva: boolean;
}

export async function lerPainelIntegracoes(): Promise<PainelIntegracoes | null> {
  if (!(await admin())) return null;
  const [p, me, f] = await Promise.all([configPagamento(), configMelhorEnvio(), configFrete()]);
  return {
    handle: p.handle,
    pagamentoAtivo: p.ativo,
    meTemToken: !!me.token,
    meTokenMascarado: me.token ? `${me.token.slice(0, 6)}…${me.token.slice(-4)}` : '',
    meSandbox: me.sandbox,
    cepOrigem: me.cepOrigem,
    pesoKg: me.pesoKg,
    alturaCm: me.alturaCm,
    larguraCm: me.larguraCm,
    comprimentoCm: me.comprimentoCm,
    freteGratisAcima: f.freteGratisAcima,
    diasManuseio: f.diasManuseio,
    freteFixo: f.freteFixo,
    freteFixoPrazo: f.freteFixoPrazo,
    retiradaAtiva: f.retiradaAtiva,
  };
}

export async function salvarPagamento(dados: { handle: string; ativo: boolean }) {
  if (!(await admin())) return NEGADO;
  const handle = String(dados.handle ?? '').trim().replace(/^\$/, '').toLowerCase();
  if (!/^[a-z0-9_.-]{2,40}$/.test(handle)) return { ok: false, mensagem: 'InfiniteTag inválida (sem o $).' };
  await salvarSetting(CHAVE_PAGAMENTO, { handle, ativo: !!dados.ativo });
  return { ok: true, mensagem: 'Configuração da InfinitePay salva.' };
}

/** Cria um link de R$ 1,00 SEM pedido, so para provar que a InfiniteTag aceita links. Ninguem e cobrado. */
export async function testarInfinitePay(origem: string) {
  if (!(await admin())) return NEGADO;
  const { handle } = await configPagamento();
  if (!handle) return { ok: false, mensagem: 'Salve a InfiniteTag primeiro.' };
  try {
    const { url } = await criarLinkCheckout({
      handle,
      orderNsu: `teste-${Date.now()}`,
      redirectUrl: `${origem}/`,
      webhookUrl: `${origem}/api/pagamentos/infinitepay/webhook`,
      itens: [{ quantity: 1, price: 100, description: 'Teste de conexão (não pagar)' }],
    });
    return { ok: true, mensagem: `Conectado! A InfinitePay gerou o link para $${handle}.`, url };
  } catch (e) {
    return { ok: false, mensagem: (e as Error).message };
  }
}

export async function salvarMelhorEnvio(dados: {
  token?: string;
  sandbox: boolean;
  cepOrigem: string;
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  freteGratisAcima: number;
  diasManuseio: number;
  freteFixo?: number;
  freteFixoPrazo?: number;
  retiradaAtiva?: boolean;
}) {
  if (!(await admin())) return NEGADO;
  const atual = await configMelhorEnvio();
  const cep = String(dados.cepOrigem ?? '').replace(/\D/g, '');
  if (cep.length !== 8 && cep.length !== 0) return { ok: false, mensagem: 'CEP de origem inválido.' };
  const token = dados.token?.trim() ? dados.token.trim() : atual.token;
  const n = (v: unknown, d: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
  await salvarSetting(CHAVE_MELHOR_ENVIO, {
    token,
    sandbox: !!dados.sandbox,
    cepOrigem: cep,
    pesoKg: n(dados.pesoKg, 0.3),
    alturaCm: n(dados.alturaCm, 4),
    larguraCm: n(dados.larguraCm, 20),
    comprimentoCm: n(dados.comprimentoCm, 25),
    servicos: atual.servicos,
  });
  await salvarSetting(CHAVE_FRETE, {
    freteGratisAcima: Math.max(0, Number(dados.freteGratisAcima) || 0),
    diasManuseio: Math.max(0, Math.trunc(Number(dados.diasManuseio) || 0)),
    freteFixo: Math.max(0, Number(dados.freteFixo) || 0),
    freteFixoPrazo: Math.max(1, Math.trunc(Number(dados.freteFixoPrazo) || 10)),
    retiradaAtiva: dados.retiradaAtiva !== false,
  });
  return { ok: true, mensagem: 'Configuração do Melhor Envio salva.' };
}

export async function testarFrete(cepDestino: string) {
  if (!(await admin())) return { ...NEGADO, detalhes: [] as string[] };
  const conta = await testarMelhorEnvio();
  if (!conta.ok) return { ok: false, mensagem: conta.mensagem, detalhes: [] as string[] };
  const produto = await db()?.product.findFirst({ where: { status: 'active' }, select: { id: true } });
  if (!produto) return { ok: true, mensagem: `${conta.mensagem} (cadastre um produto ativo para cotar)`, detalhes: [] };
  const r = await cotarFrete({ cep: cepDestino, itens: [{ produtoId: produto.id, quantidade: 1 }] });
  return {
    ok: r.ok,
    mensagem: r.ok ? `${conta.mensagem} Cotação OK para ${cepDestino}.` : `${conta.mensagem} ${r.mensagem ?? ''}`,
    detalhes: r.opcoes.map((o) => `${o.empresa} ${o.nome}: R$ ${o.preco.toFixed(2)} (${o.prazoMin}-${o.prazoMax} dias)`),
  };
}
