/**
 * O REPOSITORIO — o unico lugar onde "banco" e "demo" se encontram.
 *
 * ================== O PROBLEMA QUE ELE RESOLVE ==================
 *
 * Cada `data.ts` de dominio tem a MESMA forma de leitura:
 *
 *     export async function listX(): Promise<Dataset<X[]>> {
 *       return { data: DEMO_X, source: 'demo', reason: PENDING_REASON };
 *     }
 *
 * Quando o banco existir, o corpo muda para "le do Prisma e mapeia". Se cada
 * `data.ts` reescrever esse corpo por conta propria, a ORDEM (tenta banco ->
 * cai no demo) e o FORMATO do `Dataset` ficam duplicados em 20 arquivos — e no
 * dia em que a regra mudar, 20 arquivos divergem.
 *
 * Aqui a regra esta UMA vez:
 *
 *     1. ha banco?          nao -> devolve o demo com o motivo (o estado de hoje)
 *     2. sim -> le         -> devolve `source: 'database'`
 *     3. a leitura falhou? -> devolve o demo, e DIZ que caiu (nao mente)
 *
 * O passo 3 e o que importa. Uma leitura que falha e servida como se fosse
 * banco seria pior que nao ter banco: a tela diria `source: 'database'` sobre
 * um dado de demonstracao. Aqui ela cai para `demo` e o motivo viaja junto.
 *
 * ================== O ESTADO DE HOJE ==================
 *
 * Sem `DATABASE_URL`, `db()` devolve `null`, e toda leitura cai no passo 1: o
 * demo, com o motivo. **E o mesmo comportamento de antes desta fase** — e por
 * isso mudar os `data.ts` para passar por aqui NAO quebra nenhuma tela nem
 * nenhuma bancada. A diferenca e que agora existe o lugar onde o real entra.
 */

import { db, temBanco, PENDENTE_SEM_BANCO } from '@/lib/db';

/** O contrato que a Fase 2 fixou — inalterado. */
export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
  reason?: string;
}

export interface ResultadoEscrita {
  ok: boolean;
  reason?: string;
}

/** O motivo, reexportado para os `data.ts` nao importarem `db` so por causa dele. */
export const MOTIVO_SEM_BANCO = PENDENTE_SEM_BANCO;

/**
 * Le do banco, com o demo como piso.
 *
 * `consulta` so e chamada quando HA banco — e `recebe o cliente ja resolvido, e
 * nao o `null`: quem escreve a consulta nao precisa repetir a checagem.
 */
export async function ler<T>(
  demo: T,
  consulta: (cliente: NonNullable<ReturnType<typeof db>>) => Promise<T>,
): Promise<Dataset<T>> {
  const cliente = db();
  if (!cliente) {
    return { data: demo, source: 'demo', reason: MOTIVO_SEM_BANCO };
  }
  try {
    const dados = await consulta(cliente);
    return { data: dados, source: 'database' };
  } catch (e) {
    /*
      A leitura falhou. NAO propaga o erro para a tela (a tela nao tem o que
      fazer com um `PrismaClientKnownRequestError`), e NAO devolve como se fosse
      banco. Devolve o demo, e DIZ que caiu — e o unico comportamento honesto.
    */
    return {
      data: demo,
      source: 'demo',
      reason: `Leitura do banco falhou; exibindo demonstração. ${mensagemCurta(e)}`,
    };
  }
}

/**
 * Escreve no banco.
 *
 * Sem banco, devolve `ok: false` com o motivo — **e nao um sucesso falso**. E o
 * contrato que a Fase 2 ja usava nas escritas (`salvarSenha`, `encerrarSessoes`)
 * e que a condicao da fase 4 preserva.
 *
 * Com banco, o erro tambem vira `ok: false` com motivo: a tela mostra o motivo,
 * e nao um stack trace.
 */
export async function escrever<T>(
  operacao: (cliente: NonNullable<ReturnType<typeof db>>) => Promise<T>,
): Promise<ResultadoEscrita & { valor?: T }> {
  const cliente = db();
  if (!cliente) {
    return { ok: false, reason: MOTIVO_SEM_BANCO };
  }
  try {
    const valor = await operacao(cliente);
    return { ok: true, valor };
  } catch (e) {
    return { ok: false, reason: mensagemCurta(e) };
  }
}

/** Uma mensagem curta e sem vazamento — nunca o stack, nunca a query. */
function mensagemCurta(e: unknown): string {
  if (e instanceof Error && e.message) {
    // Uma mensagem do Prisma costuma trazer a QUERY e os PARAMETROS. Corta no
    // primeiro `\n` e limita o tamanho: o suficiente para diagnosticar, e sem
    // despejar dado da cliente na tela (a regra de nao vazar SQL).
    const primeira = e.message.split('\n')[0].slice(0, 160);
    return primeira;
  }
  return 'erro desconhecido';
}

/**
 * Ha banco? — reexportado, para as telas que precisam mostrar um aviso de
 * "modo demonstracao" sem tentar uma leitura so para descobrir.
 */
export { temBanco };
