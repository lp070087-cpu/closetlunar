/**
 * Regras derivadas do Carrinho Abandonado.
 *
 * PURO: sem React, sem `data.ts`, sem estado. Os quatro KPIs de adm-008 e a
 * ordem da tabela saem daqui, e a bancada chama estas funcoes direto — e assim
 * que os numeros do print deixam de ser constantes e viram conta conferivel.
 *
 * NAO HA JANELA DE TEMPO AQUI. Ao contrario do CRM, nenhum destes numeros
 * depende de "hoje": o print mostra `3`, `0`, `0` e `R$ 0,00`, que sao o total,
 * os recuperados, os perdidos e a soma dos recuperados — contagens do conjunto
 * inteiro. Nao ha corte de 30/90 dias, e por isso nao ha `now` para injetar.
 * Se uma janela aparecer (e o modulo tem "periodo" escrito na descricao do
 * placeholder), ela entra aqui como parametro, do mesmo jeito que no CRM.
 */

import type { AbandonedCart, CartConfig, CartDelay, CartStats } from './types';

/** Os quatro atrasos de disparo, na ordem do print e em minutos. */
export const DELAY_MINUTES: Record<string, number> = {
  '1h': 60,
  '6h': 360,
  '24h': 1440,
  '48h': 2880,
};

/**
 * Os quatro indicadores do topo de adm-008.
 *
 * A REGRA DE CADA UM e a do original, literalmente:
 *
 *   total           quantos carrinhos existem
 *   recuperados     os que tem `status === "recovered"`
 *   perdidos        os que tem `status === "lost"`
 *   valor recuperado a soma de `recovery_value` SO dos recuperados
 *
 * O ULTIMO E O QUE MAIS ERRA FACIL. Somar `recovery_value` de TODOS os
 * carrinhos daria o mesmo `R$ 0,00` neste print — porque nao ha nenhum
 * recuperado e nenhum valor — e a bancada nao pegaria a diferenca. A prova que
 * pega e a do dado montado: um carrinho PERDIDO com valor de recuperacao
 * preenchido nao pode entrar na soma.
 */
export function buildCartStats(carts: AbandonedCart[]): CartStats {
  const recovered = carts.filter((cart) => cart.status === 'recuperado');
  const lost = carts.filter((cart) => cart.status === 'perdido');
  const recoveredValue = recovered.reduce((sum, cart) => sum + Number(cart.recoveryValue ?? 0), 0);

  return {
    total: carts.length,
    recovered: recovered.length,
    lost: lost.length,
    recoveredValue,
  };
}

/**
 * A tabela `Historico de Carrinhos`, mais recentes primeiro.
 *
 * A ORDEM E A DO ORIGINAL: `order("created_at", { ascending: false })`. O print
 * nao tem coluna de data, entao a ordem dele e o UNICO vestigio dessa regra — e
 * ela nao e ordem de valor (`R$ 0,00` antes de `R$ 537,00`) nem de e-mail
 * (a linha do e-mail vem em segundo). A data explicando a sequencia e o que
 * fecha.
 *
 * O desempate e o `id` decrescente para a saida ser ESTAVEL: dois carrinhos
 * gravados no mesmo instante trocariam de lugar entre chamadas e a bancada
 * acusaria uma diferenca que nao existe.
 *
 * A funcao NAO muta a lista recebida — `[...carts]` antes do `sort`, porque o
 * `sort` do JS ordena no lugar e mudaria o array de quem chamou.
 */
export function sortCarts(carts: AbandonedCart[]): AbandonedCart[] {
  return [...carts].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
      b.id.localeCompare(a.id),
  );
}

/**
 * Quantos carrinhos foram IDENTIFICADOS (tem e-mail).
 *
 * NAO APARECE NA TELA. Existe porque e a pergunta que o CRM faz — a aba `Leads`
 * dele so lista carrinhos com e-mail (`email IS NOT NULL`), enquanto o card
 * `Carrinho Abandonado` conta todos. Sao `3` carrinhos e `1` com e-mail neste
 * conjunto, e e essa assimetria que explica os dois numeros diferentes de
 * adm-010 e adm-011 conviverem. Ver `lib/crm/demo.ts`.
 *
 * Vive AQUI porque a lista de carrinhos e deste modulo — a pergunta e sobre
 * carrinhos, e nao sobre leads.
 */
export function countIdentifiedCarts(carts: AbandonedCart[]): number {
  return carts.filter((cart) => Boolean(cart.contactEmail)).length;
}

/** Os quatro disparos, do mais curto ao mais longo — a ordem do print. */
export function sortDelays(delays: CartDelay[]): CartDelay[] {
  return [...delays].sort(
    (a, b) => (DELAY_MINUTES[a.key] ?? 0) - (DELAY_MINUTES[b.key] ?? 0),
  );
}

/**
 * A configuracao de adm-009, com os quatro disparos ja ordenados.
 *
 * Devolve uma COPIA, e nao o objeto original: a ordem dos disparos passa a ser
 * garantida por esta funcao, e deixar a tela mexer no objeto de origem abriria
 * a porta para a configuracao exibida divergir da configuracao guardada.
 */
export function buildCartConfig(config: CartConfig): CartConfig {
  return { ...config, delays: sortDelays(config.delays) };
}
