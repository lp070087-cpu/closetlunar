import { db } from '@/lib/db';

/**
 * Configuracoes das integracoes (InfinitePay + Melhor Envio + frete).
 *
 * Ordem de prioridade: o que foi salvo no painel (tabela `Setting`) e, se vazio,
 * a variavel de ambiente da Vercel. Assim a loja troca a conta pelo painel sem
 * redeploy, e o deploy ja nasce funcionando com os valores do ambiente.
 */

export interface ConfigPagamento {
  /** InfiniteTag da conta que recebe (sem o `$`). */
  handle: string;
  ativo: boolean;
}

export interface ConfigMelhorEnvio {
  token: string;
  sandbox: boolean;
  cepOrigem: string;
  /** Pacote padrao por peca (kg / cm). */
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  /** Ids de servico aceitos (vazio = todos). Ex.: 1 PAC, 2 SEDEX, 3 .Package, 4 .Com */
  servicos: number[];
}

export interface ConfigFrete {
  /** Subtotal a partir do qual o frete mais barato sai gratis. 0 = desligado. */
  freteGratisAcima: number;
  /** Prazo extra de manuseio (dias) somado ao prazo da transportadora. */
  diasManuseio: number;
  /** Frete fixo usado quando o Melhor Envio nao responde/nao esta configurado. 0 = desligado. */
  freteFixo: number;
  freteFixoPrazo: number;
}

export const CHAVE_PAGAMENTO = 'integracao_infinitepay';
export const CHAVE_MELHOR_ENVIO = 'integracao_melhor_envio';
export const CHAVE_FRETE = 'integracao_frete';

async function lerSetting<T>(chave: string): Promise<Partial<T>> {
  const cliente = db();
  if (!cliente) return {};
  try {
    const l = await cliente.setting.findUnique({ where: { key: chave } });
    return (l?.value ?? {}) as Partial<T>;
  } catch {
    return {};
  }
}

export async function salvarSetting(chave: string, valor: object): Promise<void> {
  const cliente = db();
  if (!cliente) throw new Error('Banco não configurado.');
  await cliente.setting.upsert({
    where: { key: chave },
    update: { value: valor },
    create: { key: chave, value: valor },
  });
}

const limpaHandle = (h: string) => h.trim().replace(/^\$/, '').toLowerCase();

export async function configPagamento(): Promise<ConfigPagamento> {
  const s = await lerSetting<ConfigPagamento>(CHAVE_PAGAMENTO);
  const handle = limpaHandle(s.handle || process.env.INFINITEPAY_HANDLE || '');
  return { handle, ativo: s.ativo ?? true };
}

export async function configMelhorEnvio(): Promise<ConfigMelhorEnvio> {
  const s = await lerSetting<ConfigMelhorEnvio>(CHAVE_MELHOR_ENVIO);
  const num = (v: unknown, d: number) => (typeof v === 'number' && v > 0 ? v : d);
  return {
    token: (s.token || process.env.MELHOR_ENVIO_TOKEN || '').trim(),
    sandbox: s.sandbox ?? process.env.MELHOR_ENVIO_SANDBOX === 'true',
    cepOrigem: (s.cepOrigem || process.env.MELHOR_ENVIO_CEP_ORIGEM || '').replace(/\D/g, ''),
    pesoKg: num(s.pesoKg, 0.3),
    alturaCm: num(s.alturaCm, 4),
    larguraCm: num(s.larguraCm, 20),
    comprimentoCm: num(s.comprimentoCm, 25),
    servicos: Array.isArray(s.servicos) ? s.servicos.filter((n) => Number.isInteger(n)) : [],
  };
}

export async function configFrete(): Promise<ConfigFrete> {
  const s = await lerSetting<ConfigFrete>(CHAVE_FRETE);
  return {
    freteGratisAcima: typeof s.freteGratisAcima === 'number' ? s.freteGratisAcima : 299,
    diasManuseio: typeof s.diasManuseio === 'number' ? s.diasManuseio : 1,
    freteFixo: typeof s.freteFixo === 'number' && s.freteFixo > 0 ? s.freteFixo : 0,
    freteFixoPrazo: typeof s.freteFixoPrazo === 'number' && s.freteFixoPrazo > 0 ? s.freteFixoPrazo : 10,
  };
}

/** A URL publica do site, para montar redirect/webhook. */
export function urlDoSite(req?: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL;
  if (env && !env.includes('localhost')) return env.replace(/\/$/, '');
  if (req) {
    const h = req.headers;
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || 'https';
    if (host) return `${proto}://${host}`;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}
