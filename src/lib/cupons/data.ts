/**
 * Camada de dados de Cupons.
 *
 * ESTE E O UNICO PONTO DE CONTATO DA TELA COM OS DADOS. Nenhum componente
 * importa de `demo.ts`. Quando o Neon entrar, troca-se o corpo destas funcoes; a
 * assinatura e as telas continuam iguais.
 *
 * NAO HA IMPORTACAO CRUZADA AQUI, ao contrario de Categorias (que conta
 * produtos). O cupom nao depende de outro modulo para existir.
 *
 * ================== O QUE VAI DEPENDER DO NEON ==================
 *
 *   `coupons` — uma linha por cupom, com as colunas snake_case que o original
 *   usa (`code`, `name`, `kind`, `value`, `min_subtotal`, `max_uses`,
 *   `starts_at`, `expires_at`, `is_active`, `campaign_id`,
 *   `usage_limit_per_user`, `apply_to`, `applicable_ids`, `description`,
 *   `uses_count`, `created_at`).
 *
 *   O `code` precisa de INDICE UNICO. E ele que transforma "ja existe um cupom
 *   com este codigo" de uma checagem otimista da tela numa garantia do banco —
 *   duas pessoas salvando `VOLTA10` ao mesmo tempo passariam pela checagem da
 *   tela e criariam o cupom duas vezes sem a restricao.
 *
 *   `uses_count` NAO e escrito por esta tela. Quem incrementa e o CHECKOUT, no
 *   momento em que o cupom e aplicado, e a operacao precisa ser atomica
 *   (`UPDATE coupons SET uses_count = uses_count + 1`), e nao ler-somar-gravar:
 *   duas compras simultaneas com o mesmo cupom perderiam um uso na segunda
 *   forma.
 *
 *   `applicable_ids` e uma coluna de lista. No Postgres ela e `text[]` ou uma
 *   tabela de juncao; a decisao depende de como Campanhas e Produtos forem
 *   modelados, e NAO e tomada aqui.
 *
 * ================== DIVERGENCIA REGISTRADA, NAO RESOLVIDA ==================
 *
 * O formulario de adm-013 oferece o seletor `Aplicar em` com tres opcoes, mas
 * NENHUM print do material mostra a lista que `Produtos especificos` e
 * `Categorias especificas` abrem. O campo existe no contrato (`applyTo`,
 * `applicableIds`) porque o seletor existe; a lista fica VAZIA e nenhuma tela
 * de selecao foi construida, porque inventa-la seria inventar interface. Ver o
 * aviso na tela e o comentario de `types.ts`.
 *
 * O SEGUNDO PONTO: o original NAO checa se a `Validade` e anterior ao `Inicio`.
 * Um cupom com validade antes do inicio nunca vale, e a loja simplesmente nao o
 * aplica. Nao foi inventada uma regra para isso — mas fica registrado que e um
 * estado alcancavel pela tela.
 */

import { DEMO_COUPONS } from './demo';
import { sortCoupons } from './metrics';
import type { Coupon } from './types';

export interface Dataset<T> {
  data: T;
  /**
   * De onde os dados vieram. A tela usa isso para rotular a origem e nao
   * apresentar dado de exemplo como se fosse real.
   */
  source: 'demo' | 'database';
}

/**
 * Leitura da lista.
 *
 * Assincrona de proposito, mesmo servindo dados locais: e o que a chamada ao
 * Neon vai ser, e assim nenhuma tela precisa mudar de sincrona para assincrona
 * depois. `signal` ja esta no contrato para cancelamento.
 *
 * A ordem e a do original — `created_at` decrescente. Ver `sortCoupons`.
 */
export async function listCoupons(options?: { signal?: AbortSignal }): Promise<Dataset<Coupon[]>> {
  if (options?.signal?.aborted) throw new DOMException('Abortada', 'AbortError');
  return { data: sortCoupons(DEMO_COUPONS), source: 'demo' };
}

/** Um cupom por id. `null` quando nao existe. */
export async function getCoupon(id: string): Promise<Dataset<Coupon | null>> {
  return { data: DEMO_COUPONS.find((coupon) => coupon.id === id) ?? null, source: 'demo' };
}

/**
 * Escrita.
 *
 * NAO PERSISTE NADA. Enquanto o Neon nao existir, estas funcoes devolvem o que
 * foi enviado para que a tela possa fechar o formulario e atualizar a lista;
 * mas `persisted: false` marca explicitamente que o dado NAO foi gravado.
 *
 * ISSO IMPORTA MAIS AQUI do que nos outros modulos, por um motivo concreto: o
 * original mostra um `toast.success("Cupom criado.")` depois de inserir. Se esta
 * versao exibisse a mesma confirmacao, o cupom apareceria na lista da sessao e
 * NAO existiria no banco — e a loja so descobriria quando a cliente tentasse
 * aplicar `VOLTA10` no checkout e recebesse "cupom invalido". A tela DIZ que nao
 * gravou. Ver `cupom-form.tsx`.
 */
export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}

const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

export async function createCoupon(coupon: Coupon): Promise<WriteResult<Coupon>> {
  return { data: coupon, persisted: false, reason: PENDING_REASON };
}

export async function updateCoupon(coupon: Coupon): Promise<WriteResult<Coupon>> {
  return { data: coupon, persisted: false, reason: PENDING_REASON };
}

export async function deleteCoupon(id: string): Promise<WriteResult<{ id: string }>> {
  return { data: { id }, persisted: false, reason: PENDING_REASON };
}

/**
 * LIGAR/DESLIGAR o cupom — a acao do selo de status da tabela.
 *
 * No original e um `update({ is_active })` proprio, separado do formulario:
 * `toggle(r)` e chamado pelo clique no selo, sem abrir a edicao. Por isso ela e
 * uma funcao desta camada, e nao um caso particular de `updateCoupon`.
 */
export async function toggleCoupon(
  coupon: Coupon,
  isActive: boolean,
): Promise<WriteResult<Coupon>> {
  return { data: { ...coupon, isActive }, persisted: false, reason: PENDING_REASON };
}

export { PENDING_REASON };
