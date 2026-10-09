/**
 * A SESSAO — o token assinado que diz quem esta logado.
 *
 * ================== O QUE ESTE ARQUIVO RESOLVE, E O QUE NAO RESOLVE ==================
 *
 * Ele resolve o que e PROVAVEL sem banco e sem rede: montar um token, assinar
 * com `SESSION_SECRET`, conferir a assinatura, recusar token expirado, recusar
 * token adulterado e ler os campos. Isso e criptografia de mensagem — o
 * `node:crypto` faz, e a bancada prova.
 *
 * Ele NAO resolve a criacao/consulta do usuario: `entrar(email, senha)` precisa
 * ler `User` do banco (o `passwordHash`), e o banco nao responde —
 * `BLOQUEADO POR CREDENCIAL NEON`. Por isso **nao ha `login()` aqui**. Ha
 * `criarToken` e `lerToken`: as duas metades que nao dependem do Neon, e que sao
 * exatamente as que dao para provar hoje.
 *
 * ================== POR QUE O TOKEN NAO E UM JWT ==================
 *
 * Um JWT aqui precisaria de uma biblioteca (`jsonwebtoken`/`jose`), e nenhuma
 * esta no `package.json`. Instalar exigiria rede, e escolher uma seria decidir
 * por conta propria. O formato abaixo e o mesmo conceito — `payload.assinatura`,
 * com HMAC-SHA256 e comparacao em tempo constante — escrito com o `node:crypto`
 * que ja existe. As duas propriedades que importam estao preservadas:
 *
 *   1. **Nao da para forjar** sem o `SESSION_SECRET` (HMAC);
 *   2. **Nao da para adulterar** sem invalidar a assinatura — e a conferencia e
 *      `timingSafeEqual`, e nao `===`.
 *
 * Se a Fase 4 adotar JWT, `criarToken`/`lerToken` sao as unicas funcoes que
 * mudam; o resto do sistema le o resultado destas duas.
 *
 * ================== O QUE VAI DENTRO ==================
 *
 * `sub` (o id do usuario), `papel` e `exp`. **Nao vai senha, nao vai hash, nao
 * vai dado pessoal alem do id.** O token viaja no cookie do navegador; qualquer
 * coisa dentro dele e legivel por quem tiver o cookie — ser assinado impede a
 * ADULTERACAO, e nao a LEITURA.
 *
 * ================== O RELOGIO ==================
 *
 * `agora` entra por PARAMETRO, com o default `Date.now()`. Sem isso a bancada
 * nao conseguiria provar a expiracao sem esperar — e esperar por relogio real e
 * o defeito que a Fase 2 registrou em `bancada-relogio-congelado-vs-real`.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/** As tres areas que logam. O `role` do banco e `string`; estes sao os valores usados. */
export type Papel = 'admin' | 'cliente';

export interface SessaoCriada {
  /** O token que vai no cookie. */
  token: string;
  /** ISO — o instante em que ele deixa de valer. */
  expiraEm: string;
}

export interface DadosSessao {
  /** O id do usuario (`User.id`). */
  sub: string;
  papel: Papel;
  /** `exp` em segundos desde a epoch, como no JWT. */
  exp: number;
}

/** 7 dias. O mesmo prazo que o original usa para a sessao da cliente. */
export const DIAS_DE_SESSAO = 7;

/**
 * A chave de assinatura.
 *
 * **`SESSION_SECRET` vazio LANCA.** Um default silencioso (`|| 'dev'`) seria o
 * pior dos mundos: em producao, sem a variavel, o sistema assinaria com uma
 * chave que esta no codigo — e qualquer um forjaria um token de admin. Falhar
 * alto na primeira linha e o comportamento certo.
 */
function chave(segredo: string | undefined): Buffer {
  if (!segredo || segredo.length < 16) {
    throw new Error(
      'SESSION_SECRET ausente ou curto demais. Ver `.env.example` (openssl rand -base64 32).',
    );
  }
  return Buffer.from(segredo, 'utf8');
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64url(s: string): Buffer {
  const normalizado = s.replace(/-/g, '+').replace(/_/g, '/');
  const sobra = normalizado.length % 4 === 0 ? '' : '='.repeat(4 - (normalizado.length % 4));
  return Buffer.from(normalizado + sobra, 'base64');
}

/**
 * A assinatura de um payload. Separada para a bancada poder chamar so ela.
 *
 * Aceita `string | undefined` porque quem chama costuma ter lido
 * `process.env.SESSION_SECRET`, que pode nao existir — e `chave()` e quem lanca
 * nesse caso, com a mensagem certa.
 */
export function assinar(payloadB64: string, segredo: string | undefined): string {
  return base64url(createHmac('sha256', chave(segredo)).update(payloadB64).digest());
}

/**
 * Cria o token de uma sessao. `agora` em milissegundos (default `Date.now()`).
 */
export function criarToken(
  dados: { sub: string; papel: Papel },
  segredo: string | undefined,
  agora: number = Date.now(),
  dias: number = DIAS_DE_SESSAO,
): SessaoCriada {
  if (!dados.sub) throw new Error('Sessao sem `sub` — nao ha usuario para assinar.');
  const exp = Math.floor(agora / 1000) + Math.round(dias * 24 * 60 * 60);
  const payload: DadosSessao = { sub: dados.sub, papel: dados.papel, exp };
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const token = `${payloadB64}.${assinar(payloadB64, segredo)}`;
  return { token, expiraEm: new Date(exp * 1000).toISOString() };
}

/**
 * Le e CONFERE o token. Devolve `null` para qualquer coisa que nao preste —
 * formato errado, assinatura invalida, payload ilegivel ou expirado.
 *
 * Devolver `null` (e nao lancar) e deliberado: quem chama trata "sem sessao" o
 * tempo todo, e um `throw` no caminho comum obrigaria um `try/catch` em cada
 * request. A excecao fica para o que e erro de PROGRAMACAO — o segredo ausente,
 * que lanca dentro de `assinar`.
 */
export function lerToken(
  token: string | null | undefined,
  segredo: string | undefined,
  agora: number = Date.now(),
): DadosSessao | null {
  if (typeof token !== 'string' || !token) return null;

  const ponto = token.indexOf('.');
  if (ponto <= 0) return null;
  const payloadB64 = token.slice(0, ponto);
  const assinaturaRecebida = token.slice(ponto + 1);
  if (!assinaturaRecebida) return null;

  let esperada: string;
  try {
    esperada = assinar(payloadB64, segredo);
  } catch {
    /* Sem segredo nao da para conferir NADA — recusar tudo e o lado seguro. */
    return null;
  }

  const a = deBase64url(assinaturaRecebida);
  const b = deBase64url(esperada);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(deBase64url(payloadB64).toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object') return null;

  const p = payload as Record<string, unknown>;
  if (typeof p.sub !== 'string' || !p.sub) return null;
  if (p.papel !== 'admin' && p.papel !== 'cliente') return null;
  if (typeof p.exp !== 'number' || !Number.isFinite(p.exp)) return null;
  if (p.exp * 1000 <= agora) return null; // expirado

  return { sub: p.sub, papel: p.papel, exp: p.exp };
}

/**
 * O token OPACO que vai para o banco (`UserSession.tokenHash`).
 *
 * O token do cookie e assinado e legivel; este e aleatorio e so existe hasheado
 * no banco. A razao de serem dois: o cookie prova QUE A SESSAO E NOSSA; a linha
 * em `UserSession` e o que permite REVOGAR (encerrar a sessao em todos os
 * aparelhos), porque uma lista de tokens so-servidor pode ser apagada, e um
 * token auto-contido nao pode ser invalidado antes de expirar.
 *
 * Devolve o token CRU (para o cookie) e o HASH (para o banco). O cru nunca e
 * gravado.
 */
export function novoTokenOpaco(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashTokenOpaco(token) };
}

export function hashTokenOpaco(token: string): string {
  return createHmac('sha256', 'closet-lunar-sessao').update(token).digest('hex');
}

/** O nome do cookie. Um so, para as duas areas — o papel diferencia. */
export const COOKIE_SESSAO = 'cl-sessao';

/** Os atributos do cookie. `httpOnly` e o que impede o JavaScript de le-lo. */
export const ATRIBUTOS_COOKIE = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
} as const;
