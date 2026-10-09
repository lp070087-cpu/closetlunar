/**
 * Os tipos de E-mails.
 *
 * ================== AS CHAVES SÃO O MATERIAL ==================
 *
 * Os seis modelos são os que o print adm-072 mostra, na ordem em que aparecem:
 *
 *   cart_recovery     Cart Recovery
 *   order_delivered   Order Delivered
 *   order_received    Order Received
 *   order_shipped     Order Shipped
 *   payment_approved  Payment Approved
 *   welcome           Welcome
 *
 * O original guarda o nome na coluna `name` (`cart_recovery`) e o desenha com
 * `name.replace('_', ' ')` + `capitalize` do CSS. Aqui cada modelo tem um
 * `slug` (o identificador) e um `title` escrito — porque `capitalize` não
 * resolve `cart_recovery` (só a PRIMEIRA palavra ficaria maiúscula, e o `_`
 * continuaria no meio). O print escreve os dois nomes separados e capitalizados,
 * e é esse texto que fica.
 */

export type TemplateSlug =
  | 'cart_recovery'
  | 'order_delivered'
  | 'order_received'
  | 'order_shipped'
  | 'payment_approved'
  | 'welcome';

/** Um modelo de e-mail transacional. */
export interface EmailTemplate {
  id: TemplateSlug;
  /** O rótulo do card — `Cart Recovery`, `Order Delivered`, ... */
  title: string;
  /** O assunto (a segunda linha do card). Aceita `{{variavel}}` e emoji. */
  subject: string;
  /** O corpo HTML do e-mail, com a identidade da marca. */
  bodyHtml: string;
  /** O badge verde `Ativo` / o cinza `Inativo`. */
  active: boolean;
  /**
   * A data de atualização, em ISO (`2026-06-10`).
   *
   * É dia, não instante: o card mostra `Atualizado em 10/06/2026`. Guardar como
   * string ISO evita o `new Date('2026-06-10')` (que vira meia-noite UTC e, em
   * BRT, volta um dia para 09/06 — ver a memória `data-iso-vira-utc`).
   */
  updatedAt: string;
}

/**
 * A identidade visual que acompanha todos os e-mails — o painel escuro da
 * direita. Não é editável na tela; é o padrão da marca, e por isso é lido junto
 * com os modelos.
 */
export interface EmailIdentity {
  /** O nome no rodapé/logo dos e-mails. */
  brandName: string;
  /** A cor principal em hexadecimal — o print mostra `#FF4D8D`. */
  primaryColor: string;
  /** Se o rodapé é customizado — o print mostra `Sim`. */
  customFooter: boolean;
  /** A nota em itálico embaixo do painel. */
  note: string;
}

/** Uma linha do `Envios Recentes`. */
export interface EmailLog {
  id: string;
  /** O destinatário. */
  email: string;
  /** O nome do modelo enviado — `Order Delivered`. */
  templateName: string;
  /** O instante do envio, em ISO. */
  sentAt: string;
}
