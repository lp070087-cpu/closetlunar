/**
 * Dados de demonstração do Atendimento.
 *
 * ================== A LISTA É VAZIA, E ISSO É O PRODUTO ==================
 *
 * O print adm-074 mostra `Nenhum atendimento recebido ainda.` e as quatro
 * contagens em `0`. Não é um esqueleto a preencher com exemplo: é o estado REAL
 * da loja — nenhum cliente abriu atendimento ainda.
 *
 * Inventar cinco tickets de exemplo aqui produziria uma tela que NUNCA existe na
 * vida do projeto: assim que o Neon entrar, a lista vem do banco e os exemplos
 * somem. E enquanto isso o print mentiria — mostraria `(5)` onde a referência
 * mostra `(0)`.
 *
 * A decisão é a mesma de `Favoritos` e do `Envios Recentes` de E-mails: quem manda
 * é o print, e o print está vazio. As linhas da lista, o badge e o modal são
 * provados na bancada com tickets construídos NA BANCADA — não com demo plantada
 * no produto.
 */

import type { Ticket } from './types';

export const DEMO_TICKETS: Ticket[] = [];
