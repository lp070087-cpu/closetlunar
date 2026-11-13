import { NextResponse } from 'next/server';
import { sair } from '@/lib/auth/acoes';
import { COOKIE_SESSAO } from '@/lib/auth/sessao';

/**
 * Saída do painel.
 *
 * Ainda não há sessão persistida (essa é a próxima fase, junto com o login no
 * Neon). Por isso a rota apenas limpa os cookies de sessão, caso existam, e
 * devolve o usuário para a raiz. Quando o login existir, é aqui que a sessão
 * será invalidada de verdade.
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  }
  await sair();
  const response = NextResponse.redirect(new URL('/', request.url), { status: 303 });
  for (const name of [COOKIE_SESSAO, 'cl_session', 'cl_admin_session']) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 });
  }
  return response;
}
