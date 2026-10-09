/**
 * As regras de apresentação do WhatsApp — PURAS.
 *
 * Aqui moram os RÓTULOS e as CONTAGENS: de que origem veio o cliente, qual o
 * nome de cada status, quantos tickets há em cada faixa e quantos sobram depois
 * do filtro. Nada disto pode morar no JSX — um `label` escrito dentro da tela não
 * tem onde ser provado, e a bancada não o alcança.
 *
 * Sem React, sem I/O, sem relógio: `formatTicketDate` recebe a string ISO e
 * devolve texto; não lê `new Date()` sem argumento em lugar nenhum.
 */

import type {
  Ticket,
  TicketFilter,
  TicketOrigin,
  TicketStatus,
  TemplateKey,
} from './types';

/* ============================ os status ============================ */

/**
 * O rótulo de cada status — o texto da pílula e o do `select` da linha.
 *
 * É `Em Atendimento`, com maiúsculas, como o `<option>` do original. O rótulo da
 * PÍLULA de filtro é diferente: ele é gritado em caixa alta (`EM ATENDIMENTO`) —
 * mas isso é `text-transform` do CSS, e não um segundo texto. Um só rótulo,
 * estilizado de duas formas. Ver `filterLabel`.
 */
export function statusLabel(status: TicketStatus): string {
  switch (status) {
    case 'novo':
      return 'Novo';
    case 'em_atendimento':
      return 'Em Atendimento';
    case 'aguardando_cliente':
      return 'Aguardando Cliente';
    case 'finalizado':
      return 'Finalizado';
  }
}

/** O rótulo da pílula de filtro — `Todos` para `all`, senão o status em caixa alta. */
export function filterLabel(filter: TicketFilter): string {
  return filter === 'all' ? 'Todos' : statusLabel(filter).toUpperCase();
}

/** A ordem das cinco pílulas do print, com `Todos` primeiro. */
export const TICKET_FILTERS: TicketFilter[] = [
  'all',
  'novo',
  'em_atendimento',
  'aguardando_cliente',
  'finalizado',
];

/* ============================ as origens ============================ */

/**
 * O rótulo de cada origem — a coluna `Origem` da tabela.
 *
 * Uma origem DESCONHECIDA devolve a própria chave, e não um `—` nem um texto
 * genérico: a coluna passa a mostrar `nova_origem` cru, o que diz exatamente qual
 * valor está sobrando para alguém cadastrar. Esconder isso atrás de um "Outro"
 * faria a loja nunca saber que uma origem nova apareceu.
 */
export function originLabel(origin: TicketOrigin | string): string {
  switch (origin) {
    case 'product_whatsapp':
      return 'WhatsApp do Produto';
    case 'shipping_quote':
      return 'Consulta de Frete';
    case 'abandoned_cart':
      return 'Carrinho Abandonado';
    case 'checkout_help':
      return 'Dúvida Checkout';
    case 'contact_form':
      return 'Formulário Contato';
    case 'virtual_tryon':
      return 'Provador Virtual';
    case 'favorites':
      return 'Favoritos';
    default:
      return origin;
  }
}

/* ============================ as contagens ============================ */

/** Quantos tickets há em cada status — os números ao lado das pílulas. */
export function statusCounts(tickets: readonly Ticket[]): Record<TicketFilter, number> {
  const contagem: Record<TicketFilter, number> = {
    all: tickets.length,
    novo: 0,
    em_atendimento: 0,
    aguardando_cliente: 0,
    finalizado: 0,
  };
  for (const ticket of tickets) contagem[ticket.status] += 1;
  return contagem;
}

/**
 * OS TICKETS DE UMA PÍLULA — o filtro da tabela.
 *
 * `all` devolve tudo; qualquer outro valor casa pelo `status` EXATO. A ordem é a
 * que vem da leitura (já ordenada por data, mais recente primeiro) — filtrar não
 * reordena. Uma função separada, e não um `filter` na tela, porque é aqui que a
 * bancada prova que `all` não é tratado como um status qualquer.
 */
export function filterTickets(tickets: readonly Ticket[], filter: TicketFilter): Ticket[] {
  if (filter === 'all') return [...tickets];
  return tickets.filter((ticket) => ticket.status === filter);
}

/* ============================ os textos ============================ */

/**
 * A DATA DO TICKET — `27/09 14:35`, o formato do original.
 *
 * `toLocaleString('pt-BR', { day, month, hour, minute })` — dia e mês com dois
 * dígitos, hora e minuto com dois. É deliberadamente CURTO (sem ano): a lista é
 * de atendimentos recentes, e o ano não cabe bem na coluna. Uma data inválida
 * devolve `—`, pela mesma razão de `formatDate`: uma string que o `Date` não
 * entende não pode virar `Invalid Date` na tela.
 */
export function formatTicketDate(createdAt: string): string {
  const data = new Date(createdAt);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * O TELEFONE — só os dígitos, para o link do WhatsApp.
 *
 * A coluna mostra o número como ele está no banco; o LINK precisa dos dígitos, e
 * o original faz `replace(/\D/g, '')`. Fica aqui para a montagem do `wa.me` da
 * tela não repetir a expressão — e para a bancada provar que um telefone com
 * `(81) 9 9888-1397` vira dígitos.
 */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * O RÓTULO DE UM GATILHO — `Dúvida de Produto` para `product_query`.
 *
 * As quatro chaves do material. A tabela é fechada de propósito: uma chave fora
 * dela é um erro de tipo (o `Record<TemplateKey, string>` não compila sem as
 * quatro), então não há `default` de recuo — se o tipo mudar, o compilador
 * aponta, e não a tela.
 *
 * ================== O RÓTULO DE `order_query` NÃO ESTÁ NO PRINT ==================
 *
 * As capturas mostram três rótulos — `ATENDIMENTO GERAL`, `DÚVIDA DE PRODUTO`,
 * `CONSULTA DE FRETE` — e, acima deles, só o BADGE `order_query`; a caixa do
 * primeiro gatilho está cortada pelo topo da tela e o rótulo dela não aparece em
 * captura nenhuma. `Consulta de Pedido` é a leitura do nome da chave (o mesmo
 * caminho que dá `Consulta de Frete` para `shipping_query`), e está anotado aqui
 * como a única peça deste módulo que não tem respaldo direto de imagem.
 */
export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  order_query: 'Consulta de Pedido',
  general_query: 'Atendimento Geral',
  product_query: 'Dúvida de Produto',
  shipping_query: 'Consulta de Frete',
};

/**
 * AS VARIÁVEIS DISPONÍVEIS EM CADA GATILHO — os `{...}` abaixo da caixa.
 *
 * São as do original: `product_query` tem as três do produto; `shipping_query`
 * tem o `{cep}`; e `order_query` tem as do pedido. O original monta estas listas
 * com `key.startsWith('order_')`; aqui elas são explícitas por chave, porque a
 * tela tem QUATRO chaves e não as sete do original — um `startsWith` genérico
 * esconderia a diferença no dia em que uma chave nova entrar. Ver a nota em
 * `demo.ts` sobre a divergência de chaves.
 */
export const TEMPLATE_VARIABLES: Record<TemplateKey, string[]> = {
  order_query: ['{customer_name}', '{order_id}'],
  general_query: [],
  product_query: ['{product_name}', '{product_price}', '{product_link}'],
  shipping_query: ['{cep}'],
};

/* ============================ a mensagem de ação ============================ */

/**
 * A MENSAGEM DE SAUDACAO DO BOTÃO VERDE — o texto que o original monta ao clicar
 * no WhatsApp de uma linha.
 *
 * NÃO é o corpo de um gatilho: é um texto de abertura, montado na hora a partir
 * do nome do cliente e da origem. Por isso tem reticências no fim — o admin
 * completa antes de enviar. Fica aqui para a bancada poder conferir a montagem, e
 * não para ser enviado: a tela abre o link `wa.me` com este texto pré-preenchido.
 */
export function openingMessage(ticket: Ticket): string {
  return `Olá ${ticket.customerName}! Vimos que você entrou em contato via ${originLabel(ticket.origin)}...`;
}

/**
 * O LINK DO WHATSAPP — `https://wa.me/55<dígitos>?text=<mensagem>`.
 *
 * O `55` do país é acrescentado aqui (o número guardado já vem com DDI, mas o
 * original prefixa `55` de todo jeito — e o `phoneDigits` mantém os dois). O
 * texto vai codificado. `encodeURIComponent` é o que faz a acentuação e os
 * espaços chegarem inteiros.
 */
export function whatsappLink(ticket: Ticket): string {
  return `https://wa.me/55${phoneDigits(ticket.customerPhone)}?text=${encodeURIComponent(openingMessage(ticket))}`;
}
