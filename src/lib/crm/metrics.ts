/**
 * Regras derivadas do CRM.
 *
 * PURO: sem React, sem `data.ts`, sem estado. Tudo que a tela CALCULA mora aqui,
 * e a bancada chama estas funcoes direto — e assim que os numeros de adm-011 e as
 * linhas de adm-005 deixam de ser constantes e viram conta conferivel.
 *
 * A JANELA DOS SEGMENTOS E INJETAVEL. `novas`, `inativas` e `ultima compra`
 * dependem de "hoje". Se eu chamasse `new Date()` aqui dentro, a bancada passaria
 * hoje e falharia amanha — e uma bancada que expira nao prova nada. Por isso todo
 * corte de tempo recebe `now: Date` de fora. Sem isso os numeros do print nao
 * seriam reproduziveis.
 */

import type {
  CrmCustomer,
  CrmLead,
  CrmSegment,
  LeadSource,
  SegmentIconName,
  SegmentKey,
  SegmentTone,
} from './types';

/**
 * O minimo que a agregacao de clientes precisa de um pedido.
 *
 * DELIBERADAMENTE NAO E `Order`. Se fosse, este modulo passaria a depender de
 * `lib/pedidos` e o CRM ficaria preso ao formato da tela de Pedidos — que e
 * justamente o acoplamento ruim a evitar. `data.ts` traduz `Order` para ISTO,
 * num unico lugar. Quando o Neon entrar, o `select` do banco devolve exatamente
 * estes campos e nem a traducao sobra.
 */
export interface CustomerOrderRecord {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  city: string;
  state: string;
  total: number;
  createdAt: string;
}

/** Dias usados nos cortes de `novas` e `inativas`. Os do original. */
export const NEW_WINDOW_DAYS = 30;
export const INACTIVE_WINDOW_DAYS = 90;

/** O patamar de VIP do original: acima disso OU a partir de 5 pedidos. */
export const VIP_TOTAL = 1000;
export const VIP_ORDERS = 5;

/**
 * A chave de agrupamento de um pedido, igual a do original.
 *
 * E-mail primeiro, depois telefone, depois nome — o primeiro que existir, em
 * minusculas. A ORDEM IMPORTA e nao e estetica: ela decide quais pedidos viram
 * uma pessoa so. Trocar e-mail por telefone juntaria `lucas` (3 pedidos) com
 * `carinna` se os dois compartilhassem o numero — e no material eles NAO
 * compartilham, mas a bancada cobre justamente esse caso para o dia em que
 * compartilharem.
 *
 * Devolve `null` quando o pedido nao tem nenhum dos tres: sem chave nao ha como
 * agrupar, e o original simplesmente descarta a linha (`if (!key) return`).
 */
export function customerKey(record: CustomerOrderRecord): string | null {
  const raw = record.customerEmail || record.customerPhone || record.customerName || '';
  const key = raw.trim().toLowerCase();
  return key.length > 0 ? key : null;
}

/**
 * A coluna LOCALIZACAO, no formato do original: `cidade - UF`, e so a cidade
 * quando nao ha UF. Nunca ` - ` solto, nunca `—` no lugar de uma cidade vazia:
 * sem cidade a celula fica vazia, que e o que o material da para mostrar.
 */
export function buildLocation(city: string, state: string): string {
  const cleanCity = (city ?? '').trim();
  const cleanState = (state ?? '').trim();
  if (cleanCity && cleanState) return `${cleanCity} - ${cleanState}`;
  return cleanCity || cleanState;
}

/**
 * Agrupa pedidos em clientes, ordenados por total investido (do maior).
 *
 * A ORDEM E A DO ORIGINAL (`sort((a, b) => b.total - a.total)`), e nao a do
 * print: com um unico cliente visivel em adm-005 nao ha como saber a ordem por
 * dois. Aqui a fonte de comportamento e o Lovable, e o print nao contradiz.
 *
 * O empate e resolvido pelo nome para a saida ser ESTAVEL. Sem isso, dois
 * clientes com o mesmo total poderiam trocar de lugar entre duas chamadas e a
 * bancada acusaria uma diferenca que nao existe.
 *
 * O NOME E O DA PRIMEIRA OCORRENCIA DA CHAVE, e nao o do pedido mais recente.
 *
 * Isto e uma CORRECAO, e nao um detalhe. A primeira versao sobrescrevia o nome
 * a cada pedido mais novo do grupo. Com os cinco pedidos do Closet Lunnar — que
 * vem em ordem DECRESCENTE de data — o nome exibido virava o do ULTIMO pedido
 * lido, `lucas`, enquanto o print adm-005 mostra `Mariana`. Nenhum numero
 * mudava, entao a diferenca era invisivel a olho; a bancada pegou.
 *
 * O original guarda o nome junto com o RESTO da linha, no ramo do `else` (isto
 * e, na PRIMEIRA vez que a chave aparece), e nos pedidos seguintes so mexe em
 * `orders` e `total`. E por isso que ele mostra `Mariana`: o pedido da Mariana e
 * o primeiro da lista ordenada.
 *
 * A ORDEM DA ENTRADA passa a importar, entao: `groupCustomers` reproduz o
 * original quando recebe os pedidos na mesma ordem que ele recebe do banco
 * (mais recente primeiro). Isso esta documentado aqui porque e uma dependencia
 * real, e nao um acaso.
 */
export function groupCustomers(records: CustomerOrderRecord[]): CrmCustomer[] {
  const map = new Map<string, CrmCustomer>();

  for (const record of records) {
    const key = customerKey(record);
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.orders += 1;
      existing.totalSpent += Number(record.total ?? 0);
      if (new Date(record.createdAt).getTime() > new Date(existing.lastOrderAt).getTime()) {
        existing.lastOrderAt = record.createdAt;
      }
      continue;
    }

    map.set(key, {
      key,
      name: record.customerName || '—',
      email: record.customerEmail,
      phone: record.customerPhone,
      location: buildLocation(record.city, record.state),
      orders: 1,
      totalSpent: Number(record.total ?? 0),
      lastOrderAt: record.createdAt,
    });
  }

  return [...map.values()].sort(
    (a, b) => b.totalSpent - a.totalSpent || a.name.localeCompare(b.name, 'pt-BR'),
  );
}

/**
 * A busca da aba Clientes.
 *
 * Nos TRES campos que o placeholder promete — "nome, e-mail ou telefone" — e nos
 * mesmos tres que o original filtra (`name | email | phone`). O telefone nao
 * esta na linha exibida, mas esta no dominio: buscar por ele e o que o proprio
 * campo anuncia, e a coluna CLIENTE mostra so nome e e-mail por decisao do print.
 *
 * O TELEFONE E COMPARADO POR DIGITOS, como no original — que faz
 * `phone.replace(/\D/g, '')` antes de comparar. Sem isso, `81994608572` nao
 * acharia um telefone gravado como `(81) 99460-8572`, e a busca dependeria da
 * formatacao em que o dado foi salvo. O nome e o e-mail seguem texto simples.
 */
export function filterCustomers(rows: CrmCustomer[], query: string): CrmCustomer[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  const digits = needle.replace(/\D/g, '');
  return rows.filter((row) => {
    if (row.name.toLowerCase().includes(needle)) return true;
    if ((row.email ?? '').toLowerCase().includes(needle)) return true;
    if (digits.length > 0 && (row.phone ?? '').replace(/\D/g, '').includes(digits)) return true;
    return false;
  });
}

/** O que a tabela de Leads precisa de um carrinho abandonado. */
export interface AbandonedCartRecord {
  id: string;
  whatsapp: string | null;
  email: string | null;
  createdAt: string;
}

/** O que a tabela de Leads precisa de um cadastro de formulario. */
export interface FormLeadRecord {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  createdAt: string;
}

/** O nome literal que o original da a todo lead vindo de carrinho. */
export const ABANDONED_LEAD_NAME = 'Carrinho Abandonado';

/**
 * Junta as duas origens de lead numa lista so, mais recentes primeiro.
 *
 * A ORDEM E DO ORIGINAL e e o unico desempate que existe: os dois carrinhos de
 * demonstracao tem o MESMO minuto, e sem um segundo criterio eles trocariam de
 * lugar entre chamadas. O desempate e o `id`, decrescente — estavel, e sem
 * fabricar uma data que o material nao tem.
 */
export function buildLeads(
  carts: AbandonedCartRecord[],
  forms: FormLeadRecord[],
): CrmLead[] {
  const fromCarts: CrmLead[] = carts
    .filter((cart) => Boolean(cart.email))
    .map((cart) => ({
      id: cart.id,
      name: ABANDONED_LEAD_NAME,
      email: cart.email,
      whatsapp: cart.whatsapp,
      source: 'carrinho_abandonado' as LeadSource,
      createdAt: cart.createdAt,
    }));

  const fromForms: CrmLead[] = forms.map((form) => ({
    id: form.id,
    name: form.name,
    email: form.email,
    whatsapp: form.whatsapp,
    source: 'formulario' as LeadSource,
    createdAt: form.createdAt,
  }));

  return [...fromCarts, ...fromForms].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id.localeCompare(a.id),
  );
}

/**
 * A busca da aba Leads — "nome, e-mail ou WhatsApp", os tres do placeholder.
 *
 * A coluna CONTATO mostra o e-mail; o WhatsApp aparece so quando existe. Buscar
 * pelos dois e o que o campo promete, e por isso o filtro olha os dois.
 */
export function filterLeads(leads: CrmLead[], query: string): CrmLead[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return leads;
  const digits = needle.replace(/\D/g, '');
  return leads.filter((lead) => {
    if (lead.name.toLowerCase().includes(needle)) return true;
    if ((lead.email ?? '').toLowerCase().includes(needle)) return true;
    if (digits.length > 0 && (lead.whatsapp ?? '').replace(/\D/g, '').includes(digits)) return true;
    return false;
  });
}

/**
 * A definicao fixa de cada segmento: rotulo, icone e cor.
 *
 * O ROTULO E LITERAL DO PRINT, incluindo `INTERESSE (WISHLIST)` e a barra de
 * `RECIFE / OLINDA / JABOATAO`. O NUMERO nao esta aqui de proposito — ele e
 * derivado abaixo.
 */
export const SEGMENT_DEFS: ReadonlyArray<{
  key: SegmentKey;
  label: string;
  iconName: SegmentIconName;
  tone: SegmentTone;
}> = [
  { key: 'novas', label: 'Novas Clientes', iconName: 'user-plus', tone: 'blue' },
  { key: 'recorrentes', label: 'Recorrentes', iconName: 'clock', tone: 'purple' },
  { key: 'vip', label: 'VIP', iconName: 'trophy', tone: 'amber' },
  { key: 'inativas', label: 'Inativas', iconName: 'user', tone: 'gray' },
  { key: 'carrinho_abandonado', label: 'Carrinho Abandonado', iconName: 'shopping-cart', tone: 'orange' },
  { key: 'wishlist', label: 'Interesse (Wishlist)', iconName: 'heart', tone: 'pink' },
  { key: 'provador', label: 'Usaram Provador', iconName: 'sparkles', tone: 'cyan' },
  { key: 'regiao', label: 'Recife / Olinda / Jaboatão', iconName: 'map-pin', tone: 'green' },
];

/** As tres cidades que o card `regiao` soma. */
export const REGION_CITIES = ['recife', 'olinda', 'jaboatão', 'jaboatao'] as const;

/**
 * Os oito numeros de adm-011.
 *
 * AS REGRAS SAO AS DO ORIGINAL, uma a uma:
 *   novas       ultima compra nos ultimos 30 dias
 *   recorrentes mais de um pedido
 *   vip         mais de R$ 1.000 OU 5+ pedidos
 *   inativas    ultima compra ha mais de 90 dias
 *   regiao      cidade na lista acima, somando as tres
 *
 * TRES DELES NAO SAO DE CLIENTE e por isso entram por parametro, e nao da
 * agregacao: carrinho abandonado conta CARRINHOS, wishlist conta itens de lista
 * de desejos e provador conta EVENTOS de prova virtual. Sao sinais de terceiros
 * que o CRM so exibe — o dono deles e outro modulo.
 *
 * A ORDEM E A DE `SEGMENT_DEFS`, que e a do print (linha por linha, da esquerda
 * para a direita).
 */
export function buildSegments(
  customers: CrmCustomer[],
  signals: { abandonedCarts: number; wishlist: number; tryOn: number },
  now: Date,
): CrmSegment[] {
  const newCut = now.getTime() - NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const inactiveCut = now.getTime() - INACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const counts: Record<SegmentKey, number> = {
    novas: customers.filter((c) => new Date(c.lastOrderAt).getTime() >= newCut).length,
    recorrentes: customers.filter((c) => c.orders > 1).length,
    vip: customers.filter((c) => c.totalSpent > VIP_TOTAL || c.orders >= VIP_ORDERS).length,
    inativas: customers.filter((c) => new Date(c.lastOrderAt).getTime() < inactiveCut).length,
    carrinho_abandonado: signals.abandonedCarts,
    wishlist: signals.wishlist,
    provador: signals.tryOn,
    regiao: customers.filter((c) => {
      const location = c.location.toLowerCase();
      return REGION_CITIES.some((city) => location.includes(city));
    }).length,
  };

  return SEGMENT_DEFS.map((def) => ({ ...def, value: counts[def.key] }));
}

/**
 * Quantos leads existem por origem — para o filtro da aba, se um dia houver.
 * Hoje so a bancada usa, mas a funcao e a mesma que a tela usaria.
 */
export function countBySource(leads: CrmLead[]): Record<LeadSource, number> {
  return leads.reduce<Record<LeadSource, number>>(
    (acc, lead) => {
      acc[lead.source] += 1;
      return acc;
    },
    { carrinho_abandonado: 0, formulario: 0 },
  );
}
