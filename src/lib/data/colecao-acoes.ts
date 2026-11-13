'use server';

/**
 * ARMAZENAMENTO DOS MODULOS DO PAINEL — server actions.
 *
 * Cada modulo (conteudo, CRM, campanhas, fidelidade...) guarda sua colecao como
 * JSON na tabela `Setting`, com a chave `modulo:<nome>`. So chaves da lista
 * abaixo sao aceitas (nada de ler `integracao_*` ou `cliente:*` por aqui).
 *
 * - Leitura PUBLICA: so o conteudo que o site mostra (banners, rodape...).
 * - Leitura dos demais e TODA escrita: exigem sessao de ADMIN.
 */

import { db, temBanco } from '@/lib/db';
import { sessaoAtual } from '@/lib/auth/guardas';

const PUBLICAS = new Set([
  'conteudo:banners',
  'conteudo:secoes',
  'conteudo:promo',
  'conteudo:beneficios',
  'conteudo:instagram',
  'conteudo:rodape',
  'conteudo:tema',
  'conteudo:looks',
  'seo:config',
  'tamanhos:tabela',
  'tamanhos:regras',
  'fidelidade:regras',
  'fidelidade:recompensas',
  'fidelidade:niveis',
]);

const PRIVADAS = new Set([
  'afiliadas:lista',
  'campanhas:lista',
  'atendimento:tickets',
  'whatsapp:config',
  'emails:modelos',
  'emails:identidade',
  'seguranca:backups',
  'carrinho:config',
  'carrinho:lista',
  'financeiro:custos',
  'abrir-loja:checklist',
  'provador:avatar',
  'provador:pecas',
  'provador:sugestoes',
  'provador:ia',
  'tamanhos:aprendizado',
  'configuracoes:zonas',
  'crm:leads',
  'busca:termos',
  'fidelidade:movimentos',
]);

export interface LeituraModulo {
  banco: boolean;
  existe: boolean;
  valor: unknown;
}

async function ehAdmin(): Promise<boolean> {
  const s = await sessaoAtual().catch(() => null);
  return !!s && s.papel === 'admin';
}

export async function lerModuloAcao(chave: string): Promise<LeituraModulo> {
  const banco = temBanco();
  if (!PUBLICAS.has(chave) && !PRIVADAS.has(chave)) return { banco, existe: false, valor: null };
  if (!banco) return { banco, existe: false, valor: null };
  if (PRIVADAS.has(chave) && !(await ehAdmin())) return { banco, existe: false, valor: null };
  try {
    const l = await db()!.setting.findUnique({ where: { key: `modulo:${chave}` } });
    return { banco, existe: !!l, valor: l?.value ?? null };
  } catch {
    return { banco, existe: false, valor: null };
  }
}

export async function gravarModuloAcao(chave: string, valor: unknown): Promise<{ ok: boolean; reason?: string }> {
  if (!PUBLICAS.has(chave) && !PRIVADAS.has(chave)) return { ok: false, reason: 'Módulo desconhecido.' };
  if (!temBanco()) return { ok: false, reason: 'Banco não configurado.' };
  if (!(await ehAdmin())) return { ok: false, reason: 'Apenas administradores podem salvar.' };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = JSON.parse(JSON.stringify(valor ?? null)) as any;
    await db()!.setting.upsert({
      where: { key: `modulo:${chave}` },
      update: { value: v },
      create: { key: `modulo:${chave}`, value: v },
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'Não foi possível salvar. Tente novamente.' };
  }
}

/**
 * Cadastro PUBLICO do pop-up de desconto -> CRM (`modulo:crm:leads`).
 * Unica escrita aberta: valida campos, limita tamanho e evita duplicar e-mail.
 */
export async function registrarLeadAcao(dados: { nome: string; whatsapp: string; email: string }): Promise<{ ok: boolean; reason?: string }> {
  if (!temBanco()) return { ok: false, reason: 'Cadastro indisponível no momento.' };
  const nome = String(dados?.nome ?? '').trim().slice(0, 80);
  const email = String(dados?.email ?? '').trim().toLowerCase().slice(0, 120);
  const whatsapp = String(dados?.whatsapp ?? '').replace(/\D/g, '').slice(0, 13);
  if (nome.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || whatsapp.length < 10) {
    return { ok: false, reason: 'Confira nome, WhatsApp (com DDD) e e-mail.' };
  }
  const c = db()!;
  const chave = 'modulo:crm:leads';
  const l = await c.setting.findUnique({ where: { key: chave } });
  const lista = ((l?.value as { email: string | null }[] | null) ?? []).slice(0, 5000);
  if (!lista.some((x) => x.email === email)) {
    lista.unshift({ id: `lead-${Date.now().toString(36)}`, name: nome, email, whatsapp, createdAt: new Date().toISOString() } as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await c.setting.upsert({ where: { key: chave }, update: { value: lista as any }, create: { key: chave, value: lista as any } });
  }
  return { ok: true };
}
