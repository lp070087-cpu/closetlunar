/**
 * A demonstração de E-mails — os SEIS modelos do print adm-072, transcritos.
 *
 * ================== O QUE VEM DO PRINT E O QUE NÃO VEM ==================
 *
 * VEM DO PRINT (adm-072, lido no zoom):
 *
 *   o título de cada card (`Cart Recovery`, ..., `Welcome`);
 *   o ASSUNTO de cada um, com os emojis — `Esqueceu algo lindo no carrinho? 🛒`,
 *     `Pedido Entregue! Esperamos que ame! ❤️`, `Recebemos seu pedido
 *     #{{order_number}})! ✨`, `Seu pedido foi enviado! 📦`, `Pagamento Aprovado!
 *     Seu look está chegando! 🎉`, `Bem-vinda à Closet Lunar! 💖`;
 *   o badge `Ativo` e o `Atualizado em 10/06/2026` nos seis;
 *   a identidade visual — `Closet Lunar`, `#FF4D8D`, `Rodapé Customizado: Sim` e a
 *     nota em itálico;
 *   o vazio de `Envios Recentes`.
 *
 * NÃO VEM DO PRINT — e está dito para não se passar por medido:
 *
 *   o CORPO HTML de cada modelo. Nenhuma captura abre a edição de um template: o
 *     botão da paleta existe nos seis cards, mas o print para no botão. O corpo
 *     abaixo é um esqueleto de demonstração, com a identidade da marca (o
 *     `#FF4D8D` do painel), só para a edição ter o que editar. O corpo real sai do
 *     banco (`transactional_email_templates.body_html`) na integração.
 *
 *   a linha de `Envios Recentes`: a tabela está vazia no print e a demonstração
 *     também (`DEMO_EMAIL_LOGS = []`).
 */

import type { EmailIdentity, EmailLog, EmailTemplate } from './types';

/**
 * O corpo de demonstração de um modelo.
 *
 * REPETIDO em vez de um componente: é HTML de e-mail (tabela/estilo inline, sem
 * classe), não JSX — vai como string para o campo de edição. A função existe só
 * para a string não ser seis blocos copiados; o resultado é o mesmo texto.
 *
 * A cor de destaque é a `#FF4D8D` da identidade — se ela mudar, os seis corpos
 * mudam junto, que é o que a nota do painel promete ("todos os e-mails seguem o
 * padrão premium da marca").
 */
function corpo(titulo: string, texto: string, cta: string): string {
  return [
    '<div style="font-family:Inter,Arial,sans-serif;background:#F7EDE2;padding:32px">',
    '  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px">',
    '    <p style="margin:0 0 24px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#69625D">Closet Lunar</p>',
    `    <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;line-height:1.2;color:#14110E">${titulo}</h1>`,
    `    <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#69625D">${texto}</p>`,
    `    <a href="#" style="display:inline-block;background:#FF4D8D;color:#ffffff;padding:14px 30px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none">${cta}</a>`,
    '  </div>',
    '</div>',
  ].join('\n');
}

/** Os seis modelos, na ORDEM do print (adm-072, de cima para baixo). */
export const DEMO_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'cart_recovery',
    title: 'Cart Recovery',
    subject: 'Esqueceu algo lindo no carrinho? 🛒',
    bodyHtml: corpo(
      'Esqueceu algo lindo no carrinho?',
      'Suas peças favoritas ainda estão reservadas — mas não por muito tempo. Finalize sua compra antes que acabem.',
      'Voltar ao carrinho',
    ),
    active: true,
    updatedAt: '2026-06-10',
  },
  {
    id: 'order_delivered',
    title: 'Order Delivered',
    subject: 'Pedido Entregue! Esperamos que ame! ❤️',
    bodyHtml: corpo(
      'Pedido entregue!',
      'Seu pedido chegou. Esperamos que você ame cada peça — e se quiser contar como foi, responda este e-mail.',
      'Ver meus pedidos',
    ),
    active: true,
    updatedAt: '2026-06-10',
  },
  {
    id: 'order_received',
    title: 'Order Received',
    subject: 'Recebemos seu pedido #{{order_number}})! ✨',
    bodyHtml: corpo(
      'Recebemos seu pedido!',
      'Seu pedido #{{order_number}} foi confirmado e já está sendo preparado com cuidado. Avisamos assim que ele sair para entrega.',
      'Acompanhar pedido',
    ),
    active: true,
    updatedAt: '2026-06-10',
  },
  {
    id: 'order_shipped',
    title: 'Order Shipped',
    subject: 'Seu pedido foi enviado! 📦',
    bodyHtml: corpo(
      'Seu pedido foi enviado!',
      'Boas notícias: seu pedido #{{order_number}} saiu para entrega. Use o código de rastreio para acompanhar cada etapa.',
      'Rastrear entrega',
    ),
    active: true,
    updatedAt: '2026-06-10',
  },
  {
    id: 'payment_approved',
    title: 'Payment Approved',
    subject: 'Pagamento Aprovado! Seu look está chegando! 🎉',
    bodyHtml: corpo(
      'Pagamento aprovado!',
      'Recebemos seu pagamento e seu look já está a caminho. Prepare-se para arrasar.',
      'Ver meu pedido',
    ),
    active: true,
    updatedAt: '2026-06-10',
  },
  {
    id: 'welcome',
    title: 'Welcome',
    subject: 'Bem-vinda à Closet Lunar! 💖',
    bodyHtml: corpo(
      'Bem-vinda à Closet Lunar!',
      'Que bom ter você por aqui. Preparamos uma seleção de peças para o seu primeiro look — e novidades chegam antes para quem é da casa.',
      'Explorar a coleção',
    ),
    active: true,
    updatedAt: '2026-06-10',
  },
];

/**
 * A identidade visual dos e-mails — o painel escuro da direita (adm-072/adm-073).
 *
 * NOTE O `brandName`: o print escreve `Closet LUNAR` (com R), e é o que está aqui.
 * A `#FF4D8D` foi lida com a ampliação: é o que a página ampliada mostra, e é o
 * mesmo valor do código original (a divergência que uma leitura anterior tinha
 * anotado como `#FF4080` era artefato de ClearType no texto pequeno — ver a
 * memória `clear-type-envenena-pixel`).
 */
export const DEMO_EMAIL_IDENTITY: EmailIdentity = {
  brandName: 'Closet Lunar',
  primaryColor: '#FF4D8D',
  customFooter: true,
  note: 'Todos os e-mails seguem o padrão premium da marca, com design responsivo e CTAs estratégicos para conversão.',
};

/**
 * Os envios recentes — VAZIOS, como o print.
 *
 * O card mostra `Nenhum e-mail enviado recentemente.` e não há linha nenhuma.
 * A demonstração reproduz o vazio: inventar envios que não existem criaria um
 * histórico falso de e-mails que ninguém recebeu.
 */
export const DEMO_EMAIL_LOGS: EmailLog[] = [];
