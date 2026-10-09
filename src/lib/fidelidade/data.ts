/**
 * Camada de dados de Fidelidade.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente importa
 * de `demo.ts`. Quando o Neon entrar, troca-se o corpo destas funcoes; a
 * assinatura e as telas continuam iguais.
 *
 * ================== O QUE VAI DEPENDER DO NEON ==================
 *
 * TRES tabelas, com os nomes do original:
 *
 *   `loyalty_config` (id, key, value jsonb, created_at, updated_at)
 *     Duas linhas: chave `general_rules` (as regras) e chave `rewards` (a lista).
 *     O `upsert(..., { onConflict: "key" })` do original exige INDICE UNICO na
 *     coluna `key` — sem ele, salvar as regras duas vezes criaria duas linhas com
 *     a mesma chave e a leitura `.eq("key","general_rules").single()` passaria a
 *     falhar com "multiple rows returned".
 *
 *   `loyalty_tiers` (id, name, color, min_points, multiplier, benefits jsonb)
 *     Uma linha por nivel. Ver o bloco do `upsert` mais abaixo: o `id` de cada
 *     nivel E FORNECIDO PELA APLICACAO, e nao gerado pelo banco.
 *
 *   `loyalty_points` (id, customer_email, description, type, points, order_id,
 *   created_at)
 *     O extrato. Lido com `order by created_at desc limit 50`.
 *
 * ================== A DECISAO DE `persisted: false` ==================
 *
 * Nenhuma escrita grava. A tela DIZ isso em vez de mostrar uma confirmacao — o
 * original faz `toast.success("Regras salvas")` logo depois de um `upsert` que,
 * aqui, nao existe. Copiar a confirmacao faria a pessoa achar que as regras do
 * programa de pontos estao valendo na loja quando elas nao estao.
 *
 * O `persisted` e decidido PELO BANCO — `Boolean(error)` no original — e nao por
 * um gesto da tela. Aqui ele e `false` fixo, com o motivo. Quando o Neon entrar,
 * esta funcao passa a devolver o que o banco responder, e a tela nao muda.
 *
 * ================== OS NIVEIS: POR QUE O `id` VEM DAQUI ==================
 *
 * `DEMO_LOYALTY_TIERS` tinha comeca VAZIO, com o argumento de que o `id` de cada
 * nivel nao esta em print nenhum e e a chave do `update(...).eq("id", tier.id)` do
 * original. O argumento era sobre a FORMA DE ESCREVER do original, e nao sobre o
 * dado. Ele caiu, e o motivo fica escrito para nao ser refeito:
 *
 *   `update ... where id = ?` so precisa de um id que JA EXISTE. `upsert` sobre a
 *   chave primaria NAO precisa: para ele, um id que ainda nao esta no banco e
 *   simplesmente uma INSERCAO, que e exatamente o que uma lista de niveis semeada
 *   pelo produto quer. Com `upsert`, o `id` deixa de ser uma referencia a uma
 *   linha secreta e passa a ser o identificador estavel do nivel — que e o que os
 *   quatro valores de `demo.ts` sao.
 *
 * O CONTRATO QUE ISSO IMPOE no Neon, e que precisa ser lido antes de escrever o
 * schema: A COLUNA `id` NAO PODE SER `default gen_random_uuid()`. Ela e a chave
 * primaria, mas quem a preenche e a aplicacao (`tr-bronze`, `tr-prata`, ...). Se a
 * gravacao for um `INSERT` puro com default do banco, estes ids nunca chegam la, e
 * a leitura seguinte devolve as linhas do banco com outro id — os dois conjuntos
 * convivem e a lista de niveis DOBRA. A gravacao de niveis e um `upsert` em LOTE
 * (uma instrucao, todos os niveis), e nao o `for` de updates independentes do
 * original — ver `saveTiers`.
 *
 * ================== DIVERGENCIA REGISTRADA: O `id` DAS RECOMPENSAS ==================
 *
 * O original cria recompensa com `id: Date.now().toString()`. Dois cliques dentro
 * do mesmo milissegundo produzem o MESMO id, e as duas linhas da lista ficam com a
 * mesma `key` — o React passa a atualizar a linha errada. Aqui `newReward` recebe
 * o id de fora (`localId`), que nao colide. A DIFERENCA E DELIBERADA e o formulario
 * continua com o mesmo comportamento visivel.
 */

import {
  DEMO_LOYALTY_MOVEMENTS,
  DEMO_LOYALTY_REWARDS,
  DEMO_LOYALTY_RULES,
  DEMO_LOYALTY_TIERS,
} from './demo';
import { sortTiers } from './metrics';
import type { LoyaltyMovement, LoyaltyReward, LoyaltyRules, LoyaltyTier } from './types';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/* --------------------------------------------------------------- leituras */

/**
 * As regras gerais.
 *
 * O original le a linha de chave `general_rules` e cai para `{}` quando ela nao
 * existe (`c1.data?.value || {}`). Aqui as regras de demonstracao trazem os
 * valores do print, e o `source` diz de onde vieram.
 */
export async function getLoyaltyRules(options?: { signal?: AbortSignal }): Promise<Dataset<LoyaltyRules>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_LOYALTY_RULES, source: 'demo' };
}

/** As recompensas resgataveis. */
export async function listRewards(options?: { signal?: AbortSignal }): Promise<Dataset<LoyaltyReward[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: DEMO_LOYALTY_REWARDS, source: 'demo' };
}

/**
 * Os niveis do Clube VIP, na ordem do original.
 *
 * A lista esta VAZIA de proposito — o motivo esta no cabecalho deste arquivo e em
 * `demo.ts`. A ordenacao por `min_points` fica aplicada mesmo com a lista vazia,
 * porque e a leitura que o Neon vai fazer.
 */
export async function listTiers(options?: { signal?: AbortSignal }): Promise<Dataset<LoyaltyTier[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: sortTiers(DEMO_LOYALTY_TIERS), source: 'demo' };
}

/**
 * O extrato de pontos.
 *
 * O original le `order by created_at desc limit 50`. O limite de 50 e do
 * ORIGINAL e fica registrado no contrato: quando o Neon entrar, este `limit`
 * precisa virar paginacao de verdade, senao o painel mostra 50 linhas e nao ha
 * como chegar na 51a.
 */
export async function listMovements(options?: { signal?: AbortSignal }): Promise<Dataset<LoyaltyMovement[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: [...DEMO_LOYALTY_MOVEMENTS].slice(0, 50), source: 'demo' };
}

/**
 * TUDO DE UMA VEZ — o que a tela consome.
 *
 * O original faz as QUATRO leituras num `Promise.all` unico: se qualquer uma
 * falhar, a tela inteira cai no estado de erro. Elas sao do MESMO modulo e da
 * mesma tela, entao agrupar e fiel — ao contrario de Campanhas, onde a leitura de
 * Cupons teve `try` proprio por ser de OUTRO modulo.
 */
export async function loadLoyalty(options?: { signal?: AbortSignal }): Promise<
  Dataset<{
    rules: LoyaltyRules;
    rewards: LoyaltyReward[];
    tiers: LoyaltyTier[];
    movements: LoyaltyMovement[];
  }>
> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  const [rules, rewards, tiers, movements] = await Promise.all([
    getLoyaltyRules(options),
    listRewards(options),
    listTiers(options),
    listMovements(options),
  ]);
  return {
    data: {
      rules: rules.data,
      rewards: rewards.data,
      tiers: tiers.data,
      movements: movements.data,
    },
    source: 'demo',
  };
}

/* --------------------------------------------------------------- escritas */

/**
 * Salvar as regras gerais.
 *
 * MAIS PERIGOSO QUE OS OUTROS, e por isso o aviso na tela e mais explicito: as
 * regras decidem quantos pontos a loja INTEIRA passa a dar. Uma pessoa que mexe em
 * `Pontos por R$ 1,00` acreditando ter gravado muda o comportamento de todos os
 * pedidos na cabeca dela — e um recarregamento traz o valor antigo de volta sem
 * explicacao.
 */
export async function saveRules(rules: LoyaltyRules): Promise<WriteResult<LoyaltyRules>> {
  return { data: rules, persisted: false, reason: PENDING_REASON };
}

/**
 * Salvar as recompensas.
 *
 * O `data` devolvido JA VEM NA ORDEM que a tela mostra, para que a lista da sessao
 * fique igual a que viria do banco.
 */
export async function saveRewards(rewards: LoyaltyReward[]): Promise<WriteResult<LoyaltyReward[]>> {
  return { data: rewards, persisted: false, reason: PENDING_REASON };
}

/**
 * Salvar os niveis.
 *
 * O ORIGINAL FAZ UM `update` POR NIVEL num `for`, e nenhum dos updates e checado:
 * `await supabase.from("loyalty_tiers").update({...}).eq("id", tier.id)` — o
 * resultado nao e lido. Se o terceiro de quatro falhar, os dois primeiros ja
 * gravaram, o `toast.success("Níveis atualizados")` aparece, e a lista fica
 * METADE NOVA e METADE VELHA sem ninguem saber.
 *
 * Aqui isso nao pode acontecer, porque nada grava. Mas fica registrado o que o
 * Neon vai precisar: uma TRANSACAO (ou um `upsert` em lote), e nao um `for` de
 * updates independentes. E a mesma classe de defeito que o `uses_count` de Cupons
 * tem, e a correcao e a mesma — a operacao tem que ser atomica.
 */
export async function saveTiers(tiers: LoyaltyTier[]): Promise<WriteResult<LoyaltyTier[]>> {
  return { data: sortTiers(tiers), persisted: false, reason: PENDING_REASON };
}

/**
 * Adicionar uma recompensa.
 *
 * Existe separada de `saveRewards` pela mesma razao de `toggleCoupon` em Cupons:
 * no original, `+ Adicionar Recompensa` so mexe no ESTADO local
 * (`setConfig({...config, rewards: [...config.rewards, {...}]})`) e nao grava
 * nada — quem grava e o botao `SALVAR RECOMPENSAS` no fim. Manter as duas
 * separadas deixa visivel que adicionar nao e salvar.
 */
export async function addReward(reward: LoyaltyReward): Promise<WriteResult<LoyaltyReward>> {
  return { data: reward, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
