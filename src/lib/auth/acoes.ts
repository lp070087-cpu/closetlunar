'use server';

/**
 * AS ACOES DE AUTENTICACAO — entrar, cadastrar, sair.
 *
 * ================== POR QUE 'use server' ==================
 *
 * Estas funcoes leem e ESCREVEM o cookie de sessao e consultam o banco. Rodando
 * no servidor, a senha nunca passa pelo navegador depois do POST, o hash nunca
 * chega ao cliente, e o `Set-Cookie` e `httpOnly` — o JavaScript da pagina nao
 * consegue ler o token.
 *
 * A UI aprovada NAO muda: o formulario ja existe e ja valida os campos
 * (`lib/cliente/login.ts`). O que muda e o DESTINO do envio — de um `setState`
 * local para esta Action. O comportamento visivel e o mesmo quando nao ha banco
 * (a area continua entrando em modo demonstracao), e passa a ser real quando o
 * Neon entrar.
 *
 * ================== SEM BANCO, ESTAS ACOES RECUSAM ==================
 *
 * `entrar` sem banco devolve `{ ok: false, motivo: MOTIVO_SEM_BANCO }`. **Nao
 * existe caminho em que ela "autentique" sem consultar ninguem** — seria um
 * login falso, exatamente o que a regra de honestidade proibe.
 *
 * A area da cliente continua acessivel sem login porque a CASCA
 * (`account-shell`) abre em demonstracao — e nao porque esta Action mentiu.
 */

import { cookies } from 'next/headers';
import { cache } from 'react';
import {
  COOKIE_SESSAO,
  ATRIBUTOS_COOKIE,
  criarToken,
  hashTokenOpaco,
  segredoSessao,
} from './sessao';
import { hashSenha, verificarSenha, MINIMO_SENHA } from './senha';
import {
  CREDENCIAL_INVALIDA,
  decidirEntrada,
  normalizarEmail,
  papelDe,
  validarCadastro,
  type Papel,
} from './decisao';
import { db, temBanco } from '@/lib/db';
import { MOTIVO_SEM_BANCO } from '@/lib/data/repositorio';

export interface ResultadoAcao {
  ok: boolean;
  motivo?: string;
  /** Para onde ir quando der certo. O cliente redireciona. */
  destino?: string;
}
/** A linha de usuario que a autenticacao le. O minimo — sem `select *`. */
interface UsuarioAutenticavel {
  id: string;
  passwordHash: string | null;
  role: string;
  isActive: boolean;
}

/**
 * Le o usuario pelo e-mail, com o MENOR `select` possivel.
 *
 * Nao traz o `User` inteiro: a decisao precisa de quatro campos. Trazer nome,
 * telefone e o resto para uma funcao que vai descarta-los aumenta a superficie
 * do que pode vazar num log de erro, sem beneficio nenhum.
 */
async function lerUsuarioPorEmail(email: string): Promise<UsuarioAutenticavel | null> {
  const cliente = db();
  if (!cliente) return null;

  const usuario = await cliente.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, role: true, isActive: true },
  });
  return usuario ?? null;
}

/**
 * ENTRAR.
 *
 * `exigirPapel` vazio = qualquer papel serve (a entrada da loja). Quando o
 * admin usar esta mesma Action, ele passa `'admin'`.
 */
export async function entrar(dados: {
  email: string;
  senha: string;
  exigirPapel?: Papel;
  manterConectado?: boolean;
}): Promise<ResultadoAcao> {
  if (!dados || typeof dados.email !== 'string' || dados.email.length > 254 ||
      typeof dados.senha !== 'string' || !dados.senha || dados.senha.length > 1024 ||
      (dados.exigirPapel !== undefined && dados.exigirPapel !== 'admin' && dados.exigirPapel !== 'cliente')) {
    return { ok: false, motivo: CREDENCIAL_INVALIDA };
  }
  if (!temBanco()) {
    return { ok: false, motivo: MOTIVO_SEM_BANCO };
  }

  try {
    const email = normalizarEmail(dados.email);
    const usuario = await lerUsuarioPorEmail(email);
    const decisao = decidirEntrada(usuario, dados.senha, verificarSenha, dados.exigirPapel);
    if (decisao.ok === false) return { ok: false, motivo: decisao.motivo };

    const { token, expiraEm } = criarToken(
      { sub: decisao.id, papel: decisao.papel }, segredoSessao(),
    );
    const cliente = db();
    if (!cliente) return { ok: false, motivo: MOTIVO_SEM_BANCO };
    // Persistir o hash do MESMO token antes de entregar o cookie.
    await cliente.userSession.create({
      data: {
        userId: decisao.id,
        tokenHash: hashTokenOpaco(token),
        expiresAt: new Date(expiraEm),
      },
    });
    const jar = await cookies();
    jar.set(COOKIE_SESSAO, token, {
      ...ATRIBUTOS_COOKIE,
      ...(dados.manterConectado === false ? {} : { expires: new Date(expiraEm) }),
    });
    return { ok: true, destino: decisao.papel === 'admin' ? '/admin' : '/conta' };
  } catch {
    return { ok: false, motivo: 'Não foi possível entrar. Tente novamente mais tarde.' };
  }
}

/**
 * CADASTRAR.
 *
 * A unica checagem que depende do banco e a de e-mail duplicado — e ela esta
 * AQUI, e nao em `validarCadastro` (que e puro e por isso testavel sem banco).
 */
export async function cadastrar(dados: {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}): Promise<ResultadoAcao> {
  if (!dados || typeof dados.nome !== 'string' || dados.nome.length > 200 ||
      typeof dados.email !== 'string' || dados.email.length > 254 ||
      typeof dados.senha !== 'string' || dados.senha.length > 1024 ||
      (dados.telefone !== undefined && (typeof dados.telefone !== 'string' || dados.telefone.length > 40))) {
    return { ok: false, motivo: 'Confira os dados do cadastro.' };
  }
  const invalido = validarCadastro(dados, MINIMO_SENHA);
  if (invalido) return { ok: false, motivo: invalido.motivo };

  if (!temBanco()) return { ok: false, motivo: MOTIVO_SEM_BANCO };

  const cliente = db();
  if (!cliente) return { ok: false, motivo: MOTIVO_SEM_BANCO };

  try {
    const email = normalizarEmail(dados.email);
    const existente = await cliente.user.findUnique({ where: { email }, select: { id: true } });
    if (existente) return { ok: false, motivo: CREDENCIAL_INVALIDA };

    const passwordHash = hashSenha(dados.senha);
    // Cadastro e sessao sao atomicos: falhar ao gravar a sessao desfaz a conta.
    const sessaoCriada = await cliente.$transaction(async (
      transacao: Pick<NonNullable<ReturnType<typeof db>>, 'user' | 'userSession'>,
    ) => {
      const criado = await transacao.user.create({
        data: {
          email,
          name: dados.nome.trim(),
          phone: dados.telefone?.trim() ?? '',
          passwordHash,
          role: 'cliente', // Cadastro publico nunca atribui acesso administrativo.
          isActive: true,
        },
        select: { id: true, role: true },
      });
      const { token, expiraEm } = criarToken(
        { sub: criado.id, papel: papelDe(criado.role) }, segredoSessao(),
      );
      await transacao.userSession.create({
        data: { userId: criado.id, tokenHash: hashTokenOpaco(token), expiresAt: new Date(expiraEm) },
      });
      return { token, expiraEm };
    });
    const jar = await cookies();
    jar.set(COOKIE_SESSAO, sessaoCriada.token, {
      ...ATRIBUTOS_COOKIE, expires: new Date(sessaoCriada.expiraEm),
    });
    return { ok: true, destino: '/conta' };
  } catch {
    return { ok: false, motivo: 'Não foi possível concluir o cadastro. Tente novamente mais tarde.' };
  }
}

/**
 * SAIR.
 *
 * Apaga o cookie E revoga a linha da sessao. Apagar so o cookie deixaria o
 * token valido ate expirar — quem tivesse uma copia dele continuaria entrando.
 * O `tokenHash` e o que permite achar a linha para revogar.
 */
export async function sair(): Promise<ResultadoAcao> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;

  if (token) {
    try {
      const cliente = db();
      if (cliente) {
        await cliente.userSession.updateMany({
          where: { tokenHash: hashTokenOpaco(token), revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    } catch {
      /* Falhar ao revogar nao pode impedir a saida: o cookie sai de qualquer forma. */
    }
  }

  jar.delete(COOKIE_SESSAO);
  return { ok: true, destino: '/' };
}

/**
 * Quem esta logado — memoizado POR REQUISICAO com o `cache` do React.
 *
 * Sem o `cache`, um layout que chama isto e uma pagina que chama isto fariam
 * DUAS consultas ao banco na mesma requisicao. O `cache` garante uma. E o mesmo
 * cuidado que o `getSession` do painel do cliente ja tinha.
 */
const carregarUsuarioAtual = cache(async (): Promise<{
  id: string;
  email: string;
  nome: string;
  papel: Papel;
  telefone: string | null;
} | null> => {
  if (!temBanco()) return null;
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value ?? null;
  if (!token) return null;

  const { lerToken } = await import('./sessao');
  const dados = lerToken(token, segredoSessao());
  if (!dados) return null;

  const cliente = db();
  if (!cliente) return null;

  try {
    const sessao = await cliente.userSession.findFirst({
      where: { userId: dados.sub, tokenHash: hashTokenOpaco(token), revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (!sessao) return null;
    const usuario = await cliente.user.findUnique({
      where: { id: dados.sub },
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true },
    });
    /*
      A CONTA FOI DESATIVADA DEPOIS que o token foi emitido. Um token valido de
      uma conta desativada nao pode continuar entrando — conferir `isActive` na
      LEITURA (e nao so no login) e o que fecha essa janela.
    */
    if (!usuario || !usuario.isActive) return null;
    return {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.name,
      papel: papelDe(usuario.role),
      telefone: usuario.phone ?? null,
    };
  } catch {
    return null;
  }
});

/** Export async explicito para a fronteira de Server Actions do Next. */
export async function usuarioAtual() {
  return carregarUsuarioAtual();
}

/** Limpa tudo da sessao — usado pelo encerramento de TODAS as sessoes. */
export async function encerrarTodasAsSessoes(): Promise<ResultadoAcao> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value ?? null;
  if (!token) return { ok: true };

  const cliente = db();
  if (!cliente) return { ok: false, motivo: MOTIVO_SEM_BANCO };

  const { lerToken } = await import('./sessao');
  const dados = lerToken(token, segredoSessao());
  if (!dados) return { ok: false, motivo: 'Sessão inválida.' };
  const usuario = await usuarioAtual();
  if (!usuario || usuario.id !== dados.sub) return { ok: false, motivo: 'Sessão inválida.' };

  try {
    await cliente.userSession.updateMany({
      where: { userId: dados.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    jar.delete(COOKIE_SESSAO);
    return { ok: true };
  } catch {
    return { ok: false, motivo: 'Não foi possível encerrar as sessões.' };
  }
}
