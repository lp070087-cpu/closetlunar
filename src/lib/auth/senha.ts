/**
 * HASH DE SENHA — `scrypt` do `node:crypto`.
 *
 * ================== POR QUE `scrypt`, E NAO `bcrypt` ==================
 *
 * `bcrypt` NAO esta no `package.json`. Instalar uma dependencia nova exigiria
 * rede, e o sandbox nao tem — mas, mais importante: **escolher uma biblioteca de
 * hash e uma decisao que ninguem tomou**, e adotar `bcrypt` so porque e comum
 * seria inventar. O `scrypt` esta no proprio Node, e um KDF de senha projetado
 * exatamente para isto (lento por design, com custo de CPU e memoria
 * parametrizavel, e com salt). Ele nao precisa de dependencia externa e nao
 * precisa de rede.
 *
 * Se a Fase 4 quiser `bcrypt`/`argon2` depois, esta e a UNICA camada que muda —
 * `hashSenha` e `verificarSenha` tem a assinatura que qualquer um dos dois
 * implementa.
 *
 * ================== AS DECISOES QUE VALEM ==================
 *
 * **Salt aleatorio por senha.** Duas chamadas de `hashSenha('mesma')` devolvem
 * strings DIFERENTES. Sem salt, duas clientes com a mesma senha teriam o mesmo
 * hash no banco, e uma tabela vazada revelaria quem compartilha senha. A bancada
 * prova esta diferenca.
 *
 * **O formato guarda os parametros.** A string e
 * `scrypt$N$r$p$<salt-b64>$<hash-b64>`. Guardar os parametros JUNTO permite
 * endurecer o custo no futuro sem invalidar as senhas antigas: a verificacao le
 * o custo que esta na propria linha. Uma coluna com so o hash puro obrigaria a
 * migrar todas as senhas quando o custo subisse.
 *
 * **Comparacao em tempo constante.** `timingSafeEqual`, e nao `===`. Um `===`
 * sobre hash vaza, pelo tempo de resposta, quantos bytes iniciais acertaram —
 * e e assim que se descobre um hash byte a byte.
 *
 * **A senha nunca volta.** Nao existe `revelarSenha`, e nenhum tipo de dominio
 * transporta senha (regra herdada do modulo `Seguranca` da Fase 2). O que sai
 * daqui e o HASH; a senha so existe no argumento desta funcao.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** Custo do `scrypt`. `N` precisa ser potencia de 2. */
const N = 16384;
const R = 8;
const P = 1;
const TAMANHO_CHAVE = 64;
const TAMANHO_SALT = 16;

/**
 * Gera o hash de uma senha. Devolve a string que vai para `User.passwordHash`.
 *
 * Lanca com senha vazia: um hash de `''` seria uma conta com senha em branco que
 * entra sem que ninguem saiba. Melhor recusar na fronteira.
 */
export function hashSenha(senha: string): string {
  if (typeof senha !== 'string' || senha.length === 0) {
    throw new Error('Senha vazia nao pode ser hasheada.');
  }
  const salt = randomBytes(TAMANHO_SALT);
  const chave = scryptSync(senha, salt, TAMANHO_CHAVE, { N, r: R, p: P });
  return [
    'scrypt',
    N,
    R,
    P,
    salt.toString('base64'),
    chave.toString('base64'),
  ].join('$');
}

/**
 * Confere uma senha contra o hash guardado. `false` para qualquer coisa que nao
 * case — inclusive um hash em formato invalido, que e o caso de um dado
 * corrompido: recusar e o lado seguro.
 */
export function verificarSenha(senha: string, hash: string | null | undefined): boolean {
  if (typeof senha !== 'string' || !senha) return false;
  if (typeof hash !== 'string') return false;

  const partes = hash.split('$');
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false;

  const nHash = Number(partes[1]);
  const rHash = Number(partes[2]);
  const pHash = Number(partes[3]);
  if (!Number.isFinite(nHash) || !Number.isFinite(rHash) || !Number.isFinite(pHash)) return false;

  let salt: Buffer;
  let esperado: Buffer;
  try {
    salt = Buffer.from(partes[4], 'base64');
    esperado = Buffer.from(partes[5], 'base64');
  } catch {
    return false;
  }
  if (salt.length === 0 || esperado.length === 0) return false;

  let calculado: Buffer;
  try {
    calculado = scryptSync(senha, salt, esperado.length, { N: nHash, r: rHash, p: pHash });
  } catch {
    /* Parametros fora do limite do Node — o hash e de outro ambiente. */
    return false;
  }

  if (calculado.length !== esperado.length) return false;
  return timingSafeEqual(calculado, esperado);
}

/**
 * A senha serve? — a regra da fronteira, escrita UMA vez.
 *
 * A Fase 2 ja tinha esta regra na area da cliente (`validarSenha`, com
 * `Mínimo 6 caracteres` e `Senhas não conferem`), e ela veio do ORIGINAL. Aqui a
 * regra e a MESMA, pelo mesmo motivo: sao duas portas (a area da cliente e o
 * servidor) e a mensagem nao pode divergir entre elas.
 */
export const MINIMO_SENHA = 6;

export function senhaAceitavel(senha: string): boolean {
  return typeof senha === 'string' && senha.length >= MINIMO_SENHA;
}
