/**
 * A demonstração do WhatsApp — a configuração com os valores do print, e a lista
 * de atendimentos VAZIA.
 *
 * ================== A CONFIGURAÇÃO MOSTRA OS VALORES REAIS DO PRINT ==================
 *
 * O número, o horário e os quatro textos são os que a loja REALMENTE tem: aparecem
 * preenchidos em adm-070/071, e são a configuração que o painel administra. NÃO
 * são dado de demonstração inventado — são o estado atual, transcrito. Por isso
 * esta é uma das poucas demonstrações do painel que mostra conteúdo em vez de
 * vazio: o vazio aqui não é o estado da loja, é uma escolha que o material desmente.
 *
 * ================== OS DOIS TEXTOS IGUAIS NÃO SÃO ERRO DE CÓPIA ==================
 *
 * `Atendimento Geral` e `Dúvida de Produto` têm, os dois, o texto
 * `Olá! Vim pelo site da Closet Lunar e tenho uma dúvida sobre este produto.` —
 * idêntico, e o `{product_*}` do gatilho de produto aponta que ele deveria citar o
 * produto. Mas é ASSIM que o material está, nos dois prints. A regra do projeto é
 * preservar o print: "corrigir" o segundo texto seria inventar uma mensagem que a
 * loja não escreveu. Fica como está, e a nota registra por quê.
 *
 * ================== A LISTA DE ATENDIMENTOS É VAZIA ==================
 *
 * `235950.png` (adm-069) mostra `Nenhum atendimento encontrado.` — a tabela sem
 * linha nenhuma. `customer_service_tickets` numa loja recém-instalada não tem
 * registro, e inventar tickets faria a tela afirmar conversas que não existiram.
 * Mesmo critério de Favoritos e Busca.
 *
 * ================== AS DIVERGÊNCIAS DE CHAVE FICAM DOCUMENTADAS AQUI ==================
 *
 * O código original tem SETE gatilhos (`order_approved`, `order_shipped`,
 * `order_delivered`, `abandoned_cart`, `shipping_query`, `general_query`,
 * `product_query`). O print mostra QUATRO — e a chave `order_query` no lugar de
 * `order_approved`. O print vence (regra: PRINT > ORIGINAL), e a chave
 * `order_query` é a que a tela usa. Isso está anotado em `types.ts` (a lista) e
 * em `metrics.ts` (as variáveis de cada uma).
 */

import type { Ticket, WhatsAppConfig } from './types';

/** A configuração que o print mostra preenchida. */
export const DEMO_WHATSAPP_CONFIG: WhatsAppConfig = {
  whatsapp: '5581998871397',
  openingHours: 'Segunda a Sexta: 09h às 18h | Sábado: 09h às 13h',
  templates: [
    {
      key: 'order_query',
      body: 'Olá! Vim pelo site da Closet Lunar e gostaria de falar sobre meu pedido.',
    },
    {
      key: 'general_query',
      body: 'Olá! Vim pelo site da Closet Lunar e tenho uma dúvida sobre este produto.',
    },
    {
      key: 'product_query',
      // Igual ao de cima NO MATERIAL — não é erro de cópia. Ver a nota do topo.
      body: 'Olá! Vim pelo site da Closet Lunar e tenho uma dúvida sobre este produto.',
    },
    {
      key: 'shipping_query',
      body: 'Olá! Vim pelo site da Closet Lunar e gostaria de consultar informações sobre entrega.',
    },
  ],
};

/** Tantos atendimentos quanto o print mostra: nenhum. */
export const DEMO_TICKETS: Ticket[] = [];
