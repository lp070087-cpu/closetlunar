/**
 * A DECISAO DA AUTENTICACAO — pura, sem banco e sem Next.
 *
 * ================== POR QUE A DECISAO FICA SEPARADA DA CONSULTA ==================
 *
 * `entrar(email, senha)` faz duas coisas: LE o usuario (banco) e DECIDE se a
 * senha confere. A primeira nao roda sem Neon. A segunda — que e onde moram as
 * regras de autorizacao — roda hoje, e e provavel que ela continue sendo a mesma
 * quando o banco ligar.
 *
 * Separando as duas, a bancada prova as REGRAS agora: que papel pode entrar no
 * admin, que senha errada nao entra, que usuario inativo nao entra, que a mesma
 * mensagem sai para e-mail inexistente e para senha errada. Sem essa separacao
 * tudo isso so seria testavel com o banco no ar — e um defeito de autorizacao
 * encontrado depois do banco ligado e um defeito em producao.
 *
 * ================== A MENSAGEM UNICA ==================
 *
 * `CREDENCIAL_INVALIDA` serve para os QUATRO casos: e-mail que nao existe,
 * senha errada, usuario inativo e (no admin) papel insuficiente. **Distinguir
 * "este e-mail existe mas a senha esta errada" de "este e-mail nao existe"**
 * entrega a quem sonda uma lista de e-mails cadastrados. E a mesma escolha que o
 * original faz (`toast.error` unico), e ela e a correta.
 *
 * A unica excecao e o PAPEL, e ela e deliberada: negar por permissao (e nao por
 * credencial) e necessario, porque quem acertou a senha JA sabe que a conta
 * existe. Ver `MENSAGEM_SEM_PERMISSAO`.
 */

/** O mesmo texto do original — a cliente ve exatamente isto. */
export const CREDENCIAL_INVALIDA = 'E-mail ou senha incorretos.';

/**
 * A mensagem de quem ACERTOU a credencial mas nao tem o papel. Diferente da
 * anterior de proposito: a pessoa ja provou que e dona da conta, e uma mensagem
 * generica a faria achar que errou a senha e tentar de novo.
 */
export const MENSAGEM_SEM_PERMISSAO = 'Sua conta não tem acesso a esta área.';

/** Os papeis. Dois, e nao vinte: e o que o projeto usa. */
export type Papel = 'admin' | 'cliente';

/** A linha de usuario que a decisao precisa — o minimo, e nao o `User` inteiro. */
export interface UsuarioParaDecidir {
  id: string;
  /** O HASH. Nunca a senha. */
  passwordHash: string | null;
  role: string;
  isActive: boolean;
}

export type ResultadoEntrada =
  | { ok: true; id: string; papel: Papel }
  | { ok: false; motivo: string };

/** O papel do banco e `string`; a decisao o normaliza para a uniao. */
export function papelDe(role: string): Papel {
  return role === 'admin' ? 'admin' : 'cliente';
}

/**
 * A decisao. `conferirSenha` entra por PARAMETRO — e o `verificarSenha` de
 * `senha.ts`, e recebe-lo assim mantem esta funcao pura (sem importar o
 * `node:crypto`, que ja esta testado no lugar dele).
 */
export function decidirEntrada(
  usuario: UsuarioParaDecidir | null,
  senha: string,
  conferirSenha: (senha: string, hash: string | null) => boolean,
  /** `undefined` = qualquer papel serve (o login da area da cliente). */
  exigirPapel?: Papel,
): ResultadoEntrada {
  /*
    A CONFERENCIA ACONTECE ANTES DE OLHAR O PAPEL, e mesmo quando o usuario nao
    existe — o `conferirSenha` roda contra `null` e devolve `false`. Fazer o
    caminho "usuario inexistente" retornar MAIS RAPIDO que o "senha errada"
    cria uma diferenca de tempo que revela se o e-mail existe.
  */
  const hash = usuario?.passwordHash ?? null;
  const senhaConfere = conferirSenha(senha, hash);

  if (!usuario) return { ok: false, motivo: CREDENCIAL_INVALIDA };
  if (!senhaConfere) return { ok: false, motivo: CREDENCIAL_INVALIDA };
  if (!usuario.isActive) return { ok: false, motivo: CREDENCIAL_INVALIDA };

  const papel = papelDe(usuario.role);
  if (exigirPapel && papel !== exigirPapel) {
    return { ok: false, motivo: MENSAGEM_SEM_PERMISSAO };
  }

  return { ok: true, id: usuario.id, papel };
}

/**
 * O cadastro pode entrar?
 *
 * Devolve o motivo, ou `null` se estiver tudo certo. A regra de senha e a MESMA
 * das outras duas portas (`lib/auth/senha.ts` e `validarSenha` da area da
 * cliente): 6 caracteres no minimo.
 *
 * **NAO valida se o e-mail ja existe.** Isso exige uma consulta ao banco, e
 * fingir aqui seria pior: a checagem de duplicidade e a UNICA parte do cadastro
 * que depende do banco, e ela pertence a quem tem o banco.
 */
export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}

export function validarCadastro(
  d: DadosCadastro,
  minimoSenha: number,
): { campo: keyof DadosCadastro; motivo: string } | null {
  if (!d.nome || d.nome.trim().length < 2) return { campo: 'nome', motivo: 'Informe seu nome.' };
  if (!emailPareceValido(d.email)) return { campo: 'email', motivo: 'Informe um e-mail válido.' };
  if (!d.senha || d.senha.length < minimoSenha) {
    return { campo: 'senha', motivo: `A senha precisa de ${minimoSenha} caracteres ou mais.` };
  }
  return null;
}

/**
 * Um teste grosseiro de e-mail — e DELIBERADAMENTE grosseiro.
 *
 * Um regex "completo" de e-mail recusa enderecos validos (o RFC permite coisas
 * que ninguem imagina) e aceita coisas que nao existem. A validacao de verdade e
 * mandar a mensagem. Aqui so se evita o obvio: sem `@`, sem ponto depois dele,
 * com espaco.
 */
export function emailPareceValido(email: string): boolean {
  const e = String(email ?? '').trim();
  if (e.length < 5 || e.length > 254) return false;
  if (/\s/.test(e)) return false;
  const at = e.indexOf('@');
  if (at <= 0 || at !== e.lastIndexOf('@')) return false;
  const dominio = e.slice(at + 1);
  return dominio.includes('.') && !dominio.startsWith('.') && !dominio.endsWith('.');
}

/** O e-mail normalizado para busca e para unicidade. */
export function normalizarEmail(email: string): string {
  return String(email ?? '').trim().toLowerCase();
}
