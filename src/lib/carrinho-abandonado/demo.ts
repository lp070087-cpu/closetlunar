/**
 * Dados demonstrativos do Carrinho Abandonado.
 *
 * Transcritos de adm-008 e adm-009. Nada foi inventado: as tres linhas da
 * tabela, os quatro textos dos disparos e o estado de cada interruptor sao os
 * que os prints mostram.
 *
 * ============================ A MUDANCA DE DONO ============================
 *
 * ATE A FASE 7, os tres carrinhos viviam em `lib/crm/demo.ts`. Eles foram para
 * la porque o CRM foi o primeiro modulo a precisar deles — a aba `Leads`
 * (adm-010) mostra um lead com origem `carrinho_abandonado`, e o card de
 * adm-011 conta os carrinhos.
 *
 * So que o dono natural dessa lista e ESTE modulo: a tela que EXISTE para
 * carrinho abandonado e /admin/carrinho-abandonado, e o CRM so a consulta. Com
 * esta fase a lista mudou de casa, e `lib/crm/data.ts` passou a ler daqui.
 *
 * NAO HA DUAS LISTAS. Se a lista ficasse copiada nos dois modulos, o dia em que
 * um carrinho fosse recuperado numa tela ele continuaria abandonado na outra —
 * e as duas telas discordariam sobre o mesmo carrinho sem que nada acusasse.
 * `lib/crm/demo.ts` agora RE-EXPORTA estes valores em vez de guarda-los.
 *
 * O QUE O CRM PERDEU E O QUE GANHOU: nada e nada. Os mesmos tres carrinhos, os
 * mesmos dois sem e-mail. A assimetria `3 carrinhos / 1 com e-mail` continua
 * valendo e continua provada — ver `countIdentifiedCarts`.
 *
 * ============================ O ACHADO DA FASE =============================
 *
 * Adm-008 mostra TRES carrinhos, e adm-010 mostra UM lead de carrinho. Nao e
 * contradicao: as duas telas fazem perguntas diferentes.
 *
 *   adm-008   TODOS os carrinhos .......................... 3
 *   adm-010   os carrinhos COM E-MAIL (`is not null`) ..... 1
 *
 * Dois dos tres carrinhos nao tem e-mail — e o print diz isso em letras: a
 * primeira e a terceira linha mostram `Nao identificado` na coluna CLIENTE /
 * EMAIL. Eles CONTAM no total de abandonados (sao carrinhos abandonados de
 * verdade) mas nao geram lead (nao ha para quem mandar mensagem).
 *
 * Os dois ficam SEM e-mail aqui de proposito: e o unico jeito de o conjunto
 * reproduzir as duas telas ao mesmo tempo. Preencher um e-mail neles "para a
 * linha nao ficar vazia" faria o CRM passar a mostrar 2 ou 3 leads e a tela dele
 * deixaria de reproduzir adm-010.
 * ==========================================================================
 */

import type { AbandonedCart, CartConfig } from './types';

/**
 * OS TRES CARRINHOS — transcritos de adm-008.
 *
 * ORDEM: os prints mostram esta sequencia, de cima para baixo:
 *
 *   Visitante / Nao identificado  · R$ 0,00   · 0
 *   Visitante / lp070087@gmail.com · R$ 537,00 · 0
 *   Visitante / Nao identificado  · R$ 358,00 · 0
 *
 * O TEXTO DA COLUNA CLIENTE. Repare que ele NAO e o e-mail: em todas as tres
 * linhas a primeira linha da celula diz `Visitante`, e a segunda diz o e-mail —
 * ou `Nao identificado`. Ou seja, o original mostra `contact_name || "Visitante"`
 * e `contact_email || "Nao identificado"`. Como o nosso dado nao tem nome de
 * contato, `contactName` fica `null` nas tres e a tela compoe `Visitante` — que
 * e o que o print mostra. Escrever `Visitante` no dado seria gravar na fonte o
 * que e uma decisao da tela.
 *
 * O E-MAIL É O DO PRINT: `lp070087@gmail.com`, o mesmo da cliente do CRM. E a
 * MESMA pessoa — ela abandonou um carrinho de R$ 537,00 e depois comprou.
 *
 * AS DATAS, E A REGRA QUE ELAS PRECISAM OBEDECER.
 *
 * A ORDEM DA TABELA E A ORDEM DAS DATAS. O print nao tem coluna de data, entao
 * a sequencia das linhas nao se explica por valor (0 < 358 < 537, e nao
 * 0 > 537 > 358) nem por e-mail. Quem explica e o original, que monta a lista
 * com `.order("created_at", { ascending: false })` — a MAIS RECENTE em cima.
 *
 * Disso sai a unica regra que estas tres datas tem de respeitar:
 *
 *   carta-02  R$ 0,00    ......... a MAIS NOVA   (1a linha do print)
 *   carta-01  R$ 537,00  ......... do meio       (2a linha)
 *   carta-03  R$ 358,00  ......... a MAIS ANTIGA (3a linha)
 *
 * UMA DATA ESTA ANCORADA EM PRINT: `carta-01` e `13/06/2026, 00:31`, que e o
 * que o lead do CRM mostra em adm-010 — o carrinho com e-mail e este, e o
 * `13/06/2026 00:31` e o mesmo carrinho visto de outra tela. As outras duas
 * datas NAO ESTAO EM PRINT NENHUM e nao podem estar: a tabela nao tem coluna de
 * data, e nada no material diz quando os dois carrinhos anonimos foram
 * abandonados. Elas existem para a ORDEM sair como o print mostra, e estao
 * marcadas como derivadas.
 *
 * O ERRO QUE ESTAVA AQUI, E POR QUE A BANCADA O PEGOU. A primeira versao dizia,
 * no comentario, "os outros dois ficam ANTES dele na lista, ou seja, sao mais
 * recentes" — e gravava `06-11` e `06-09`, os DOIS antes do `06-13`. O
 * comentario afirmava uma coisa e o dado dizia o contrario, e o resultado era a
 * tabela desenhar `R$ 537,00` em cima, que e exatamente o que o print NAO
 * mostra. Nenhum numero mudava, o typecheck passava e o olho nao via: so a
 * bancada, comparando a lista com a sequencia do print, acusou. Corrigido
 * movendo SO o dia do `carta-02` para depois do ancora — uma data, um campo.
 */
export const DEMO_ABANDONED_CARTS: AbandonedCart[] = [
  {
    // Mais recente — a primeira linha do print. Data DERIVADA: existe so para
    // esta linha ficar acima das outras duas, como a ordem do print exige.
    id: 'carta-02',
    contactName: null,
    contactEmail: null,
    subtotal: 0,
    notificationCount: 0,
    lastNotifiedAt: null,
    createdAt: '2026-06-13T08:12:00',
    status: 'pendente',
    recoveryValue: null,
  },
  {
    // A linha do meio, e a unica identificada. Data e hora confirmadas pelo
    // lead de adm-010 (`13/06/2026, 00:31`).
    id: 'carta-01',
    contactName: null,
    contactEmail: 'lp070087@gmail.com',
    subtotal: 537,
    notificationCount: 0,
    lastNotifiedAt: null,
    createdAt: '2026-06-13T00:31:00',
    status: 'pendente',
    recoveryValue: null,
  },
  {
    // A ultima linha. Data DERIVADA, so para a ordem — esta ja estava correta.
    id: 'carta-03',
    contactName: null,
    contactEmail: null,
    subtotal: 358,
    notificationCount: 0,
    lastNotifiedAt: null,
    createdAt: '2026-06-09T15:47:00',
    status: 'pendente',
    recoveryValue: null,
  },
];

/**
 * A CONFIGURACAO DE adm-009 — os quatro disparos e os dois incentivos.
 *
 * OS QUATRO TEXTOS SAO LITERAIS DO PRINT, copiados sem reescrever:
 *
 *   1 HORA    "Oi (nome), notamos que você esqueceu alguns itens no carrinho.
 *              Use o cupom VOLTA10 para 10% de desconto!"
 *
 *   6 HORAS   "Ainda pensando naqueles itens? Aproveite frete grátis nas
 *              próximas 2 horas!"
 *
 *   24 HORAS  "Última chance! Seus favoritos estão quase acabando no estoque."
 *
 *   48 HORAS  "Vimos que você não finalizou seu pedido. Gostaria de uma ajuda
 *              personalizada?"
 *
 * `(nome)` NAO E UM ERRO DE DIGITACAO — e o marcador de substituicao do
 * original, que troca por `{nome}` na hora do envio. Corrigir para um nome
 * generico apagaria a unica pista de que o texto e um MOLDE, e nao uma mensagem
 * pronta. Reproduzido como esta.
 *
 * OS QUATRO INTERRUPTORES ESTAO MARCADOS — adm-009 mostra os quatro checkboxes
 * com o visto azul. O `Ativo` do topo tambem.
 *
 * O CUPOM AUTOMATICO ESTA VAZIO: o campo mostra so o `placeholder` `EX: VOLTA10`
 * em cinza, que e dica e nao valor. Preencher `VOLTA10` faria a tela afirmar que
 * existe um cupom configurado quando o print mostra o campo em branco.
 *
 * O INCENTIVO DE FRETE GRATIS ESTA DESMARCADO — o checkbox de adm-009 esta
 * vazio, ao contrario dos outros quatro. Reproduzido como esta.
 */
export const DEMO_CART_CONFIG: CartConfig = {
  isActive: true,
  delays: [
    {
      key: '1h',
      label: '1 Hora',
      active: true,
      template:
        'Oi (nome), notamos que você esqueceu alguns itens no carrinho. Use o cupom VOLTA10 para 10% de desconto!',
    },
    {
      key: '6h',
      label: '6 Horas',
      active: true,
      template:
        'Ainda pensando naqueles itens? Aproveite frete grátis nas próximas 2 horas!',
    },
    {
      key: '24h',
      label: '24 Horas',
      active: true,
      template: 'Última chance! Seus favoritos estão quase acabando no estoque.',
    },
    {
      key: '48h',
      label: '48 Horas',
      active: true,
      template:
        'Vimos que você não finalizou seu pedido. Gostaria de uma ajuda personalizada?',
    },
  ],
  couponToSend: '',
  freeShippingIncentive: false,
};
