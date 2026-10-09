/**
 * Camada de dados de Afiliadas.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts`. Quando o Neon entrar, troca-se o corpo destas funcoes; a
 * assinatura e as telas continuam iguais.
 *
 * NAO HA IMPORTACAO CRUZADA AQUI: a afiliada nao conta produtos nem depende de
 * outro modulo para existir.
 *
 * ================== O QUE VAI DEPENDER DO NEON ==================
 *
 *   `affiliate_profiles` — UMA tabela, com as dez colunas do original
 *   (`id`, `user_id`, `name`, `email`, `coupon_code`, `referral_slug`,
 *   `commission_type`, `commission_value`, `status`, `bank_info`, `created_at`,
 *   `updated_at`). Ver `types.ts` para por que o tipo tem as dez mesmo a tela
 *   mostrando cinco.
 *
 *   `coupon_code` precisa de INDICE UNICO. E ele que transforma "ja existe uma
 *   afiliada com este cupom" de uma checagem otimista da tela numa garantia do
 *   banco — duas pessoas salvando `LUNA10` ao mesmo tempo passariam pela
 *   checagem e criariam a afiliada duas vezes sem a restricao. O e-mail tambem,
 *   se a regra do produto for "uma conta por e-mail".
 *
 *   O `upsert` GRAVA O OBJETO INTEIRO. E o comportamento do original e o motivo
 *   de `bankInfo`, `userId`, `createdAt` e `updatedAt` estarem no tipo: uma
 *   coluna fora do objeto seria sobrescrita com nulo no primeiro salvamento. O
 *   `id` vazio e o que decide INSERT de UPDATE — o original usa um `upsert` no
 *   `id`, e um id que ainda nao existe e simplesmente uma insercao. Ver
 *   `types.ts`.
 *
 * ================== A DECISAO DE `persisted: false` ==================
 *
 * Nenhuma escrita grava. A tela DIZ isso em vez de mostrar uma confirmacao — o
 * original faz `toast.success("Afiliada salva")` logo depois de um `upsert` que,
 * aqui, nao existe. Copiar a confirmacao faria a pessoa achar que a afiliada ja
 * esta cadastrada e recebendo comissao quando nao esta.
 *
 * O `persisted` e decidido PELO BANCO — `Boolean(error)` no original — e nao por
 * um gesto da tela. Aqui ele e `false` fixo, com o motivo. Quando o Neon entrar,
 * esta funcao passa a devolver o que o banco responder, e a tela nao muda.
 *
 * ================== DIVERGENCIA REGISTRADA: `bankInfo` NAO TEM TELA ==================
 *
 * A coluna `bank_info` e `jsonb` livre e NAO aparece em print nenhum: nao ha
 * campo no formulario, nao ha coluna na tabela, e a conta da afiliada
 * (`src/routes/conta.afiliada.tsx` do original) e que a consome. Ela e
 * PRESERVADA no salvamento e nunca editada aqui. Desenhar os campos do dado
 * bancario seria inventar um formulario que a referencia nao tem — a mesma
 * decisao de `applyTo`/`applicableIds` em Cupons.
 */

import { DEMO_AFFILIATES } from './demo';
import { sortAffiliates } from './metrics';
import type { Affiliate, AffiliateStatus } from './types';

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
 * A lista de afiliadas, na ordem do original.
 *
 * O original faz `.order("created_at", { ascending: false })` — mais recente
 * primeiro. A ordenacao fica aplicada aqui mesmo com a lista de um item, porque
 * e a leitura que o Neon vai fazer.
 */
export async function listAffiliates(options?: { signal?: AbortSignal }): Promise<Dataset<Affiliate[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: sortAffiliates(DEMO_AFFILIATES), source: 'demo' };
}

/* --------------------------------------------------------------- escritas */

/**
 * Salvar uma afiliada (insercao ou edicao).
 *
 * UMA FUNCAO PARA OS DOIS CASOS, como o `upsert` do original: o `id` vazio e o
 * que faz a chamada ser uma insercao. Ver `types.ts`.
 */
export async function saveAffiliate(affiliate: Affiliate): Promise<WriteResult<Affiliate>> {
  return {
    data: affiliate,
    persisted: false,
    reason: PENDING_REASON,
  };
}

/**
 * Trocar o status de uma afiliada.
 *
 * SEPARADA DE `saveAffiliate` pela mesma razao de `toggleCoupon` em Cupons e
 * `toggleStatus` no original: a acao da LINHA grava só o status, com um
 * `update({ status }).eq("id", id)` — ela NAO reenvia o objeto inteiro. Manter
 * as duas separadas deixa visivel que suspender nao e o mesmo que abrir o
 * formulario e salvar.
 *
 * O ORIGINAL NAO CHECA O RESULTADO DESTE `update`: `if (!error) load()` — se
 * falhar, ele nao avisa ninguem, a lista simplesmente nao recarrega e o selo
 * continua o antigo. Aqui a tela aplica a mudanca e mostra o aviso de que nada
 * foi gravado, em vez de falhar em silencio.
 */
export async function setAffiliateStatus(
  affiliate: Affiliate,
  status: AffiliateStatus,
): Promise<WriteResult<Affiliate>> {
  return {
    data: { ...affiliate, status },
    persisted: false,
    reason: PENDING_REASON,
  };
}

export { PENDING_REASON };
