/**
 * Contas, ordenacao e derivacoes de Cupons.
 *
 * Modulo PURO: sem React, sem I/O, sem Prisma. Recebe listas e devolve listas,
 * numeros ou strings. Esta separado de `data.ts` e das telas porque e aqui que
 * moram os defeitos que um typecheck nao pega — desconto formatado errado,
 * ordem que nao ordena, "cupom mais usado" que empatou e ficou instavel,
 * validade nula virando `Invalid Date`.
 *
 * Toda funcao que ordena recebe uma copia: `Array.prototype.sort` ordena no
 * lugar, e a lista que chega aqui e o estado do React.
 */

import { formatBRL } from '@/lib/utils';
import type { Coupon, CouponUsage } from './types';

/**
 * O DESCONTO COMO A TABELA MOSTRA.
 *
 * `10%` no percentual, `R$ 20,00` no valor fixo — exatamente o que o original
 * faz: `${Number(r.value)}%` ou `formatBRL(Number(r.value))`.
 *
 * O `Number()` em volta NAO e decoracao. `10.0` e `10` sao o mesmo numero em
 * JS, mas o texto de `String(10.0)` e `"10"` — e o valor que vier do banco como
 * `numeric` chega como `"10.00"` no driver. Sem normalizar, o percentual
 * imprimiria `10.000000000000002%` no caso de uma conta anterior e `10.00%` no
 * caso do driver; com `Number()`, sai `10%` sempre.
 */
export function formatDiscount(coupon: Pick<Coupon, 'kind' | 'value'>): string {
  const value = Number(coupon.value);
  if (!Number.isFinite(value)) return '—';
  return coupon.kind === 'percent' ? `${value}%` : formatBRL(value);
}

/**
 * A coluna USOS.
 *
 * `0` no cupom do print, e `0 / 100` quando existe teto. O `maxUses != null` e
 * o que separa ILIMITADO de ZERO: `0 / 0` seria mentira — um teto de zero usos
 * significa um cupom que nunca pode ser usado, e o campo em branco significa o
 * contrario, usos sem fim.
 */
export function formatUses(coupon: Pick<Coupon, 'usesCount' | 'maxUses'>): string {
  const used = Number(coupon.usesCount ?? 0);
  if (coupon.maxUses === null || coupon.maxUses === undefined) return String(used);
  return `${used} / ${Number(coupon.maxUses)}`;
}

/**
 * A coluna VALIDADE: `dd/mm/aaaa`, ou `—` quando nao ha validade.
 *
 * A data do print e `20/08/2026`. O `new Date('2026-08-20T00:00:00')` e
 * interpretado em horario LOCAL, e nao UTC: com UTC, um fuso a oeste leria
 * 19/08. `formatDate` do design system ja usa o formato e o fuso locais.
 *
 * Data invalida devolve `—` em vez de `Invalid Date` — o defeito mais facil de
 * deixar passar numa coluna de data.
 */
export function formatExpiry(coupon: Pick<Coupon, 'expiresAt'>, formatDate: (value: string) => string): string {
  if (!coupon.expiresAt) return '—';
  const date = new Date(coupon.expiresAt);
  if (Number.isNaN(date.getTime())) return '—';
  return formatDate(coupon.expiresAt);
}

/**
 * A coluna MIN.: o pedido minimo, ou `—` quando nao ha.
 *
 * A REGRA E `> 0`, e nao `!= null`: o pedido minimo nasce ZERO (o print abre o
 * campo com `0`), e zero significa "sem pedido minimo". Um `minSubtotal != null`
 * imprimiria `R$ 0,00` na coluna — e o print mostra `—`.
 */
export function formatMinSubtotal(coupon: Pick<Coupon, 'minSubtotal'>, formatBRLFn: (value: number) => string): string {
  const value = Number(coupon.minSubtotal ?? 0);
  if (!Number.isFinite(value) || value <= 0) return '—';
  return formatBRLFn(value);
}

/**
 * A LISTA, NA ORDEM DO ORIGINAL: mais recente primeiro.
 *
 * `.order("created_at", { ascending: false })`. Com um cupom so o print nao
 * prova a ordem; o que a prova e o original. O desempate por codigo existe
 * porque dois cupons criados no mesmo segundo (o `createdAt` do banco tem
 * precisao de microssegundos, mas o do Postgres serializado pode empatar) nao
 * podem trocar de lugar entre duas renderizacoes.
 */
export function sortCoupons(rows: Coupon[]): Coupon[] {
  return [...rows].sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (diff !== 0 && Number.isFinite(diff)) return diff;
    return a.code.localeCompare(b.code, 'pt-BR');
  });
}

/**
 * Busca por codigo OU pelo nome interno da campanha.
 *
 * O PRINT NAO MOSTRA CAMPO DE BUSCA em Cupons — nem adm-007, nem adm-012, nem
 * adm-013. Esta funcao existe porque a bancada precisa poder provar o filtro, e
 * porque a lista cresce: com uma lista longa o painel vai precisar dela. Ela
 * NAO esta ligada a nenhum campo da tela, e enquanto nao estiver, o
 * comportamento visivel e identico ao print. Registrado aqui para nao parecer
 * um recurso que apareceu sozinho.
 */
export function filterCoupons(rows: Coupon[], query: string): Coupon[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(needle) || coupon.name.toLowerCase().includes(needle),
  );
}

/**
 * O codigo ja esta em uso por OUTRO cupom?
 *
 * `exceptId` existe para a edicao: salvar um cupom mantendo o proprio codigo
 * nao pode acusar conflito consigo mesmo.
 *
 * A comparacao normaliza a caixa E o espaco nas pontas. `closet10` e
 * `CLOSET10 ` sao o mesmo cupom — a loja compara sem diferenciar maiuscula, e
 * um cupom duplicado so apareceria na hora da cliente digitar.
 *
 * O banco tambem vai recusar (o original trata o erro `duplicate`), mas acusar
 * aqui evita a ida ao servidor e da a mensagem no campo certo.
 */
export function codeTaken(rows: Coupon[], code: string, exceptId?: string): boolean {
  const alvo = code.trim().toUpperCase();
  if (!alvo) return false;
  return rows.some(
    (coupon) => coupon.id !== exceptId && coupon.code.trim().toUpperCase() === alvo,
  );
}

/**
 * O cupom esta valido AGORA? Serve para a tabela e para o resumo.
 *
 * Um cupom pode estar `isActive` e ainda assim nao valer: antes do `startsAt`
 * ou depois do `expiresAt`. O selo de status da tabela mostra o `isActive` (e o
 * print mostra `Ativo` no unico cupom), mas o botao do selo alterna o
 * `isActive`, entao as duas perguntas sao diferentes.
 *
 * `now` entra por parametro para a bancada poder congelar o relogio. Um
 * `new Date()` escondido aqui dentro tornaria a funcao impossivel de testar no
 * limite (23:59:59 do ultimo dia de validade).
 */
export function isRedeemableNow(coupon: Coupon, now: Date): boolean {
  if (!coupon.isActive) return false;
  const time = now.getTime();
  if (coupon.startsAt) {
    const start = new Date(coupon.startsAt).getTime();
    if (Number.isFinite(start) && time < start) return false;
  }
  if (coupon.expiresAt) {
    const end = new Date(coupon.expiresAt).getTime();
    if (Number.isFinite(end) && time > end) return false;
  }
  if (coupon.maxUses !== null && Number(coupon.usesCount) >= Number(coupon.maxUses)) return false;
  return true;
}

/** Quantos cupons estao ativos. */
export function countActive(rows: Coupon[]): number {
  return rows.filter((coupon) => coupon.isActive).length;
}

/**
 * OS CUPONS MAIS USADOS — o card que adm-014 mostra na tela de CAMPANHAS.
 *
 * Mora neste modulo porque o dado e daqui: e a lista de cupons ordenada pelo
 * uso. A tela de Campanhas so exibe.
 *
 * DUAS DECISOES QUE O PRINT NAO RESOLVE, e que ficam declaradas:
 *
 *   QUANTOS — adm-014 mostra UM (`CLOSET10 · 0 usos`) porque so existe um cupom
 *   cadastrado. Nao ha numero no print. O limite fica em 5, e o corte e
 *   explicito no parametro para quem chamar poder pedir outro.
 *
 *   USO ZERO ENTRA? O print mostra `0 usos`, e `0 > 0` e falso — se a regra
 *   fosse "so quem tem uso", o card viria VAZIO e a tela dele nao reproduziria
 *   adm-014. Entao a lista inclui cupons com zero usos: ela e "os mais usados",
 *   ordenada, e nao "os que ja foram usados".
 *
 * Empate no uso e desempatado pelo codigo, para a lista nao pular entre
 * renderizacoes.
 */
export function topUsedCoupons(rows: Coupon[], limit = 5): CouponUsage[] {
  return [...rows]
    .sort((a, b) => {
      const diff = Number(b.usesCount ?? 0) - Number(a.usesCount ?? 0);
      if (diff !== 0) return diff;
      return a.code.localeCompare(b.code, 'pt-BR');
    })
    .slice(0, limit)
    .map((coupon) => ({ code: coupon.code, usesCount: Number(coupon.usesCount ?? 0) }));
}

/** O total de usos somado. Usado no resumo. */
export function totalUses(rows: Coupon[]): number {
  return rows.reduce((sum, coupon) => sum + Number(coupon.usesCount ?? 0), 0);
}
