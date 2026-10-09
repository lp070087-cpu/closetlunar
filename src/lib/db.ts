/**
 * O CLIENTE DO BANCO — o singleton do Prisma.
 *
 * ================== BLOQUEADO POR CREDENCIAL NEON ==================
 *
 * `prisma/schema.prisma` existe e descreve as tabelas, mas **`@prisma/client`
 * ainda nao foi gerado** — `prisma generate` precisa baixar o engine, e o
 * download esta bloqueado neste ambiente (403). Os tipos do cliente sao hoje um
 * `PrismaClient: any`, e nao os models.
 *
 * Por isso `db()` **nao instancia** o cliente ainda: ela devolve
 * `null` enquanto o banco nao existir. E o mesmo contrato que a Fase 2 e a
 * Fase 3 usaram do outro lado (`source: 'demo'`, `PENDING_REASON`): um sistema
 * que DIZ que a persistencia ainda nao esta ligada, em vez de quebrar na
 * primeira leitura.
 *
 * ================== O QUE ACONTECE QUANDO A CREDENCIAL EXISTIR ==================
 *
 *   1. `DATABASE_URL` e `DIRECT_URL` entram no `.env`;
 *   2. `npx prisma generate` gera o cliente COM os models;
 *   3. `npx prisma migrate dev` cria as tabelas;
 *   4. `db()` passa a devolver o `PrismaClient`, e a leitura deixa de ser `null`.
 *
 * O passo 4 e o UNICO que muda neste arquivo (tirar o `null`), e nada mais no
 * sistema precisa saber: quem chama checa o `null` hoje, e amanha acha o cliente.
 *
 * ================== POR QUE SINGLETON ==================
 *
 * Em desenvolvimento, o hot-reload do Next reavalia os modulos a cada
 * alteracao. Um `new PrismaClient()` no topo do modulo cria uma conexao nova a
 * cada reavaliacao, e o banco acumula conexoes ate recusar. O padrao e guardar a
 * instancia no `globalThis`, que sobrevive ao reload. Ver o comentario do
 * `globalForPrisma`.
 */

import { PrismaClient } from '@prisma/client';

/**
 * O `PrismaClient` guardado entre reloads. Em producao o modulo e avaliado uma
 * vez so, e o `globalThis` e so um lugar a mais para o mesmo objeto.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * O cliente, ou `null` enquanto nao houver banco.
 *
 * Devolver `null` (e nao lancar) e deliberado: a area inteira ja trata "sem
 * banco" como um ESTADO, e nao como erro — e um `throw` aqui obrigaria um
 * try/catch em cada leitura para reproduzir o mesmo resultado.
 */
export function db(): PrismaClient | null {
  if (!temBanco()) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Ha banco configurado?
 *
 * Checa a VARIAVEL, e nao tenta conectar: uma checagem de conexao aqui faria
 * cada request pagar o custo de uma tentativa que falha. A `DATABASE_URL` vazia
 * ou ausente e a resposta honesta de "ainda nao ha banco" — e o `.env.example`
 * explica como preencher.
 */
export function temBanco(): boolean {
  const url = process.env.DATABASE_URL;
  return typeof url === 'string' && url.length > 0 && !url.includes('ep-xxxx');
}

/** O motivo que as telas escrevem quando nao ha banco. O mesmo texto da Fase 2. */
export const PENDENTE_SEM_BANCO =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/**
 * Desconecta. Existe para o ENCERRAMENTO (script, teste, worker) — um processo
 * que termina sem fechar as conexoes faz o Postgres reclamar no log.
 */
export async function desconectar(): Promise<void> {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}
