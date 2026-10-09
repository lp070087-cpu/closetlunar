/**
 * Contas, ordenacao e formatacao de Afiliadas.
 *
 * Modulo PURO: sem React, sem I/O, sem Prisma. Recebe listas e valores e
 * devolve listas ou strings. Esta separado de `data.ts` e das telas porque e
 * aqui que moram os defeitos que um typecheck nao pega — o link de indicacao
 * montado errado, o status que vira `undefined`, a comissao fixa que perde
 * centavos, a lista que nao ordena.
 *
 * Toda funcao que ordena recebe uma COPIA: `Array.prototype.sort` ordena no
 * lugar, e a lista que chega aqui e o estado do React.
 */

import { formatBRL } from '@/lib/utils';
import type { Affiliate, AffiliateStatus, CommissionType } from './types';

/**
 * OS DOIS VALORES LEGAIS DE `commission_type`, para o dado que vem de fora.
 *
 * A coluna e `string` no schema do original e NAO tem CHECK documentado — ver
 * `types.ts`. Isso significa que `toCommissionType('PERCENT')`, ou `null`, ou
 * qualquer string vinda de um banco malformado nao pode virar uma comparacao
 * silenciosamente falsa.
 *
 * O PADRAO E `percentage`, e nao `fixed`, por um motivo assimetrico: o ramo
 * `fixed` imprime REAIS. Um valor de comissao que na verdade era `5` (ou seja,
 * 5%) impresso como `R$ 5,00` faria a afiliada parecer estar recebendo R$ 5 por
 * venda quando ela recebe 5% — um numero MENOR que o real na maioria dos
 * carrinhos, e portanto o erro mais barato de desconfiar. Cair em `fixed` por
 * engano inflaria a comissao, e esse erro ninguem confere.
 */
export function toCommissionType(value: unknown): CommissionType {
  return value === 'fixed' ? 'fixed' : 'percentage';
}

/**
 * O `status` do dado que vem de fora.
 *
 * O original imprime `{af.status}` cru na pilula. O corpus conhecido tem dois
 * valores: `active` e `suspended`. Guardar como string livre faria a pilula
 * imprimir `undefined` se a coluna viesse nula — e o print mostra `ACTIVE`, que
 * e um dos dois.
 *
 * O PADRAO E `active` porque e o valor que o print exibe, e porque o original
 * nasce com `active` na insercao (`status` default). Cair em `suspended` por
 * engano tiraria a afiliada do ar sem ninguem ter clicado em `Suspender`.
 */
export function toAffiliateStatus(value: unknown): AffiliateStatus {
  return value === 'suspended' ? 'suspended' : 'active';
}

/**
 * A COLUNA COMISSAO, como o print mostra.
 *
 * `5%` no percentual e `R$ 5,00` no fixo — exatamente a condicional do original:
 * `af.commission_type === 'percentage' ? `${af.commission_value}%` :
 * formatBRL(Number(af.commission_value))`.
 *
 * O `Number()` em volta NAO e decoracao. O valor que vier do banco como
 * `numeric` chega como `"5.00"` no driver; sem normalizar, um percentual de
 * `5` imprimiria `5.00%` e um de `5.5` imprimiria `5.50%`. Com `Number()`, sai
 * `5%` e `5.5%` — o numero como a pessoa o digitou.
 *
 * O `type` tambem passa por `toCommissionType` para que um valor inesperado
 * caia no ramo percentual, e nao imprima reais por acidente. Ver `types.ts`.
 */
export function formatCommission(affiliate: Pick<Affiliate, 'commissionType' | 'commissionValue'>): string {
  const value = Number(affiliate.commissionValue);
  if (toCommissionType(affiliate.commissionType) === 'fixed') {
    return formatBRL(Number.isFinite(value) ? value : 0);
  }
  if (!Number.isFinite(value)) return '—';
  return `${value}%`;
}

/**
 * A SEGUNDA LINHA DA COLUNA CUPOM / LINK: o caminho de indicacao.
 *
 * O PRINT MOSTRA `/` SOZINHO — e nao um slug chamado `/`. A Carinna esta com o
 * `referral_slug` VAZIO, e o original imprime `/{af.referral_slug}` com a barra
 * fixa no template, sem condicional nenhuma. Com o slug vazio, o resultado e
 * exatamente `/`.
 *
 * ISTO NAO E UM DEFEITO A CORRIGIR. A barra sozinha e o que a referencia
 * mostra, e e o estado real de uma afiliada cadastrada sem link proprio. Uma
 * funcao que "consertasse" o vazio para `—` deixaria de reproduzir o print; uma
 * que escondesse a linha faria a celula pular. As duas seriam piores que a
 * barra. O que NAO pode acontecer e a barra sozinha virar um LINK clicavel para
 * a raiz do painel — o original usa um `<div>`, e nao um `<a>`, justamente
 * porque nao ha destino.
 *
 * O `trim` protege contra um slug gravado com espaco nas pontas por um
 * formulario antigo; o original nao faz isso, e por isso ele imprimiria
 * `/ luna10`. Aqui a barra fica colada.
 */
export function formatReferral(affiliate: Pick<Affiliate, 'referralSlug'>): string {
  return `/${String(affiliate.referralSlug ?? '').trim()}`;
}

/**
 * O SELO DE STATUS — o texto CRU, em caixa alta.
 *
 * O ORIGINAL IMPRIME `{af.status}` DIRETO, SEM TRADUZIR: o print mostra
 * `ACTIVE`, e nao `Ativa`. Um selo que dissesse `Ativa` estaria mais bonito e
 * seria MENOS fiel — e a divergencia de vocabulario com a coluna de Cupons
 * (`Ativo`) ja esta registrada no MAPA-ADMIN.
 *
 * O `toUpperCase` existe porque o original depende do CSS (`uppercase`); o
 * texto dele e `active` em minusculo. Imprimir `active` na tela seria o defeito
 * de ler o print pelo valor do dado e nao pelo que se ve.
 */
export function affiliateStatusLabel(status: AffiliateStatus): string {
  return toAffiliateStatus(status).toUpperCase();
}

/**
 * As CLASSES da pilula de status, medidas nos prints.
 *
 * `active` e o verde `#00BC7D` sobre `#D0FAE5` com texto `#007A55` — os mesmos
 * tokens do design system, que `Badge variant="success"` ja carrega. Os valores
 * literais ficam aqui para a bancada poder afirmar QUAL dos dois ramos saiu, sem
 * depender da resolucao de uma classe Tailwind.
 */
export function affiliateStatusTone(status: AffiliateStatus): 'success' | 'danger' {
  return toAffiliateStatus(status) === 'active' ? 'success' : 'danger';
}

/**
 * O TEXTO DO BOTAO DE ACOES DA LINHA.
 *
 * O print mostra `Suspender` na afiliada `ACTIVE`. O original alterna:
 * `{af.status === 'active' ? 'Suspender' : 'Ativar'}`. Ou seja, o botao diz o
 * que o clique VAI FAZER — e o par `Ativar` nunca aparece em print nenhum
 * porque a Carinna esta ativa. Os dois textos ficam registrados aqui para que a
 * bancada possa provar o ramo que o material nao mostra.
 */
export function toggleActionLabel(status: AffiliateStatus): string {
  return toAffiliateStatus(status) === 'active' ? 'Suspender' : 'Ativar';
}

/**
 * O PROXIMO STATUS, o que o clique grava.
 *
 * `active -> suspended`, `suspended -> active`. Existe separado do rotulo
 * porque as duas perguntas sao diferentes: o rotulo e o que a pessoa LE e o
 * proximo status e o que o banco GRAVA, e trocar um pelo outro e o defeito
 * classico de um toggle — o botao que diz `Suspender` e ativa.
 */
export function nextStatus(status: AffiliateStatus): AffiliateStatus {
  return toAffiliateStatus(status) === 'active' ? 'suspended' : 'active';
}

/**
 * A LISTA, NA ORDEM DO ORIGINAL: mais recente primeiro.
 *
 * `.order("created_at", { ascending: false })`. Com uma afiliada so o print nao
 * prova a ordem; o que a prova e o original. O desempate por nome existe porque
 * duas afiliadas cadastradas no mesmo segundo nao podem trocar de lugar entre
 * duas renderizacoes.
 */
export function sortAffiliates(rows: Affiliate[]): Affiliate[] {
  return [...rows].sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (diff !== 0 && Number.isFinite(diff)) return diff;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

/**
 * Quantas afiliadas estao ativas.
 *
 * NAO e o `length` da lista. O contador de afiliadas cadastradas e o total; este
 * numero responde outra pergunta (`quantas estao no ar hoje`), e existe para a
 * bancada poder provar que os dois numeros NAO sao a mesma coisa — o erro facil
 * de cometer quando se escreve `rows.length` nos dois lugares. Nenhum print
 * mostra esse contador; ele nao esta ligado a nenhuma celula da tela.
 */
export function countActive(rows: Affiliate[]): number {
  return rows.filter((affiliate) => toAffiliateStatus(affiliate.status) === 'active').length;
}

/**
 * O cupom ja esta em uso por OUTRA afiliada?
 *
 * `exceptId` existe para a edicao: salvar mantendo o proprio cupom nao pode
 * acusar conflito consigo mesmo.
 *
 * A comparacao normaliza caixa E espaco nas pontas: `carinnas` e `CARINNAS ` sao
 * o mesmo cupom. O formulario ja sobe o texto em maiuscula a cada tecla (ver
 * `applyCouponCode`), entao este `toUpperCase` e a segunda rede — a que pega o
 * dado que veio do banco, e nao do teclado.
 *
 * O banco tambem vai recusar (o `coupon_code` precisa de indice unico), mas
 * acusar aqui evita a ida ao servidor e da a mensagem no campo certo.
 */
export function couponCodeTaken(rows: Affiliate[], code: string, exceptId?: string): boolean {
  const target = code.trim().toUpperCase();
  if (!target) return false;
  return rows.some(
    (affiliate) =>
      affiliate.id !== exceptId && affiliate.couponCode.trim().toUpperCase() === target,
  );
}

/**
 * O e-mail ja esta em uso por OUTRA afiliada?
 *
 * Vale o mesmo raciocinio do cupom, com duas diferencas:
 *
 *   A CAIXA do e-mail e normalizada para minuscula, e nao maiuscula — o
 *   dominio e case-insensitive e a convencao e minuscula. Comparar
 *   `Carinna@Gmail.com` com `carinna@gmail.com` como diferentes deixaria a
 *   mesma pessoa cadastrada duas vezes.
 *
 *   O E-MAIL NAO E OBRIGATORIO na tela (o formulario o tem, mas o print de
 *   adm-022 mostra o campo vazio no modo NOVO). Um e-mail em branco nao acusa
 *   conflito com outro em branco — senao a segunda afiliada sem e-mail seria
 *   recusada por "duplicidade" com a primeira.
 */
export function emailTaken(rows: Affiliate[], email: string, exceptId?: string): boolean {
  const target = email.trim().toLowerCase();
  if (!target) return false;
  return rows.some(
    (affiliate) => affiliate.id !== exceptId && affiliate.email.trim().toLowerCase() === target,
  );
}
