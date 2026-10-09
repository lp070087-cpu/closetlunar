/**
 * Os tipos do módulo WhatsApp — os atendimentos e a configuração do vendedor.
 *
 * ================== AS DUAS ABAS NÃO COMPARTILHAM TIPO ==================
 *
 * A tela tem duas faces: `Atendimentos` (uma lista de TICKETS) e `Configurações`
 * (a mensagem automática). São dados de naturezas diferentes — um ticket é um
 * registro que cresce sozinho, a configuração é um valor único que o admin edita —
 * e por isso não há um tipo único que os junte. O que os une é a ROTA, não a
 * forma.
 */

/* ============================ os atendimentos ============================ */

/**
 * O ciclo de vida de um ticket, na ordem em que as pílulas o mostram.
 *
 * Os quatro valores são os do banco (`customer_service_tickets.status`); o rótulo
 * exibido é `Novo`, `Em Atendimento`, `Aguardando Cliente`, `Finalizado` — ver
 * `statusLabel`. O `em_atendimento` é o único em que a troca de status acontece
 * sozinha: quando a loja responde pelo WhatsApp, o ticket sai de `novo`.
 */
export type TicketStatus = 'novo' | 'em_atendimento' | 'aguardando_cliente' | 'finalizado';

/** O filtro aceita os quatro status mais `all` — as cinco pílulas do print. */
export type TicketFilter = TicketStatus | 'all';

/**
 * DE ONDE O CLIENTE CHEGOU — o que a coluna `Origem` mostra.
 *
 * São as origens do código original, e o rótulo de cada uma mora em
 * `originLabel`. O valor cru é uma chave (`product_whatsapp`), não um texto: se
 * uma origem nova aparecer no banco sem rótulo, a coluna mostra a CHAVE — o que é
 * melhor do que esconder a linha, porque diz exatamente qual origem está sobrando.
 */
export type TicketOrigin =
  | 'product_whatsapp'
  | 'shipping_quote'
  | 'abandoned_cart'
  | 'checkout_help'
  | 'contact_form'
  | 'virtual_tryon'
  | 'favorites';

/** O produto sobre o qual o cliente perguntou — a miniatura da coluna `Relacionado`. */
export interface TicketProduct {
  name: string;
  image: string | null;
}

/** Um atendimento. */
export interface Ticket {
  id: string;
  customerName: string;
  /** O telefone como a loja o guarda — a máscara fica na formatação, não no dado. */
  customerPhone: string;
  origin: TicketOrigin;
  /** O produto relacionado, ou `null` — a coluna mostra `—` no lugar. */
  product: TicketProduct | null;
  status: TicketStatus;
  /** ISO 8601. A tela formata em dia/mês hora:minuto — ver `formatTicketDate`. */
  createdAt: string;
}

/* ============================ a configuração ============================ */

/**
 * OS QUATRO GATILHOS DA TELA, na ordem do print.
 *
 * ================== SÃO QUATRO, E NÃO OS SETE DO CÓDIGO ORIGINAL ==================
 *
 * O `WhatsAppAdmin` do Lovable tem SETE: `product_query`, `abandoned_cart`,
 * `shipping_query`, `order_approved`, `order_shipped`, `order_delivered` e
 * `general_query`. O print adm-070/071 mostra apenas QUATRO —
 * `order_query`, `general_query`, `product_query`, `shipping_query` — e a chave
 * `order_query` NÃO EXISTE no código original (lá é `order_approved`).
 *
 * A regra do projeto manda o PRINT sobre o código: a tela tem os quatro do
 * material. Ver a nota em `demo.ts`, que também registra os dois textos iguais.
 */
export type TemplateKey = 'order_query' | 'general_query' | 'product_query' | 'shipping_query';

/** Um gatilho: a chave (mono, à direita) e o corpo editável. */
export interface MessageTemplate {
  key: TemplateKey;
  body: string;
}

/** A configuração do vendedor virtual, como o admin a edita. */
export interface WhatsAppConfig {
  /** Só dígitos, com DDI (55) e DDD — o `5581998871397` do print. */
  whatsapp: string;
  /** O texto livre do horário — `Segunda a Sexta: 09h às 18h | Sábado: 09h às 13h`. */
  openingHours: string;
  /** Os quatro gatilhos, na ordem em que aparecem na tela. */
  templates: MessageTemplate[];
}
