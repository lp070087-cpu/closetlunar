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
  DIAS_DE_SESSAO,
  criarToken,
  hashTokenOpaco,
  novoTokenOpaco,
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
}): Promise<ResultadoAcao> {
  if (!temBanco()) {
    return { ok: false, motivo: MOTIVO_SEM_BANCO };
  }

  const email = normalizarEmail(dados.email);
  const usuario = await lerUsuarioPorEmail(email);
  const decisao = decidirEntrada(usuario, dados.senha, verificarSenha, dados.exigirPapel);

  if (!decisao.ok) return { ok: false, motivo: decisao.motivo };

  // O cookie e assinado. O `sub` e o ID, e nunca o e-mail: um id nao muda
  // quando a cliente troca de e-mail, e nao carrega dado pessoal no cookie.
  const { token, expiraEm } = criarToken({ sub: decisao.id, papel: decisao.papel }, process.env.SESSION_SECRET);

  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, {
    ...ATRIBUTOS_COOKIE,
    expires: new Date(expiraEm),
  });

  /*
    A LINHA DE SESSAO. O token do cookie prova que a sessao e nossa; esta linha
    e o que permite REVOGAR (encerrar em todos os aparelhos), porque uma lista
    que o servidor controla pode ser apagada, e um token auto-contido nao pode
    ser invalidado antes de expirar.
  */
  const opaco = novoTokenOpaco();
  try {
    const cliente = db();
    if (cliente) {
      await cliente.userSession.create({
        data: {
          userId: decisao.id,
          tokenHash: opaco.hash,
          expiresAt: new Date(expiraEm),
        },
      });
    }
  } catch {
    /*
      Falhar ao gravar a LISTA nao impede o login: a sessao assinada ja vale.
      O custo e que esta sessao nao podera ser revogada antes de expirar — um
      custo menor que recusar a entrada por causa de um registro auxiliar.
    */
  }

  return { ok: true, destino: decisao.papel === 'admin' ? '/admin' : '/conta' };
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
  const invalido = validarCadastro(dados, MINIMO_SENHA);
  if (invalido) return { ok: false, motivo: invalido.motivo };

  if (!temBanco()) return { ok: false, motivo: MOTIVO_SEM_BANCO };

  const cliente = db();
  if (!cliente) return { ok: false, motivo: MOTIVO_SEM_BANCO };

  const email = normalizarEmail(dados.email);

  const existente = await cliente.user.findUnique({ where: { email }, select: { id: true } });
  if (existente) {
    /*
      A mensagem e a MESMA de credencial invalida. Distinguir "este e-mail ja
      tem conta" de "cadastro ok" entrega a quem sonda uma lista de e-mails
      cadastrados — o mesmo risco do login.
    */
    return { ok: false, motivo: CREDENCIAL_INVALIDA };
  }

  // O hash AQUI, no servidor. A senha em texto existe so neste escopo.
  const passwordHash = hashSenha(dados.senha);

  const criado = await cliente.user.create({
    data: {
      email,
      name: dados.nome.trim(),
      phone: dados.telefone?.trim() ?? '',
      passwordHash,
      // Papel `cliente` SEMPRE. Cadastro publico nunca cria admin — o papel
      // privilegiado so se atribui por dentro do painel.
      role: 'cliente',
      isActive: true,
    },
    select: { id: true, role: true },
  });

  const { token, expiraEm } = criarToken(
    { sub: criado.id, papel: papelDe(criado.role) },
    process.env.SESSION_SECRET,
  );
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, { ...ATRIBUTOS_COOKIE, expires: new Date(expiraEm) });

  return { ok: true, destino: '/conta' };
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
export const usuarioAtual = cache(async (): Promise<{
  id: string;
  email: string;
  nome: string;
  papel: Papel;
} | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value ?? null;
  if (!token) return null;

  const { lerToken } = await import('./sessao');
  const dados = lerToken(token, process.env.SESSION_SECRET);
  if (!dados) return null;

  const cliente = db();
  if (!cliente) return null;

  try {
    const usuario = await cliente.user.findUnique({
      where: { id: dados.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true },
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
    };
  } catch {
    return null;
  }
});

/** Limpa tudo da sessao — usado pelo encerramento de TODAS as sessoes. */
export async function encerrarTodasAsSessoes(): Promise<ResultadoAcao> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value ?? null;
  if (!token) return { ok: true };

  const cliente = db();
  if (!cliente) return { ok: false, motivo: MOTIVO_SEM_BANCO };

  const { lerToken } = await import('./sessao');
  const dados = lerToken(token, process.env.SESSION_SECRET);
  if (!dados) return { ok: false, motivo: 'Sessão inválida.' };

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

export { DIAS_DE_SESSAO };
