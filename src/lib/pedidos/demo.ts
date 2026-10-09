/**
 * Dados demonstrativos de Pedidos.
 *
 * Transcritos LINHA POR LINHA de adm-003 (aba `Todos`) e adm-004 (aba
 * `Rastreamento`). Nao ha pedido inventado: os cinco do `Todos` e os dois do
 * `Rastreamento` sao os mesmos, vistos por duas telas — e a bancada prova isso.
 *
 * O que veio de ONDE, campo a campo, esta anotado em cada bloco. A regra da
 * fase e literal: divergencia entre referencias se documenta, nao se resolve
 * escolhendo um lado em silencio.
 */

import type { Order, OrderStatus } from './types';

/**
 * O ROTULO DE CADA STATUS, e a divergencia que continua aberta.
 *
 * ============================ DIVERGENCIA ============================
 *
 * O mapa do painel registra, desde antes desta fase:
 *
 *   "Status inconsistente entre telas: `#FF3048C9` aparece como `NOVO` no
 *    dashboard e como `AGUARDANDO PAGAMENTO` em Meus Pedidos. Padronizar a
 *    maquina de estados do pedido antes de implementar Pedidos."
 *
 * A pendencia NAO foi resolvida, e nao dava para resolver com o que existe: as
 * duas referencias simplesmente discordam do sentido de `novo`.
 *
 *   dashboard (adm-001)      pinta o estado como NOVO
 *   conta.pedidos.tsx        pinta o estado como "Aguardando pagamento"
 *
 * As TRES opcoes, e por que nenhuma delas foi tomada:
 *
 *   1. adotar "Aguardando pagamento" — contraria o UNICO print desta tela, que
 *      escreve `novo` em cinco cartoes. O print e a fonte mais forte;
 *   2. adotar "Novo" — obriga o codigo do painel do cliente a mudar, e o painel
 *      do cliente esta FORA do escopo desta fase (proibido por instrucao);
 *   3. inventar um terceiro rotulo que sirva aos dois — e exatamente o que o
 *      briefing proibe.
 *
 * Entao o rotulo sai do print (`Novo`, o texto que adm-003 mostra) e o codigo
 * sai da fonte que tem os seis (`novo`). A divergencia fica REGISTRADA aqui e
 * no relatorio final, ate existir a fonte definitiva no banco. O que NAO se faz
 * e escolher "Aguardando pagamento" agora para o proximo que abrir o codigo
 * achar que a questao ja foi decidida.
 *
 * Os rotulos dos outros cinco saem de `conta.pedidos.tsx`, que e a unica fonte
 * onde os seis aparecem juntos. Sao rotulos de UI: o banco guarda o codigo.
 * =====================================================================
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  novo: 'Novo',
  pago: 'Pago',
  separacao: 'Separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

/**
 * O TOM de cada status, pelas cores que o painel ja usa.
 *
 * `novo` e o unico confirmado por print: ele aparece AMBAR/neutro nos cartoes
 * (`#FF3048C9`, o chip rosa/ambar do dashboard). Os outros cinco nao aparecem em
 * print nenhum DESTA tela — os tons abaixo seguem a convencao que as outras
 * telas ja usam para o mesmo significado (verde = concluido, rosa = cancelado),
 * e nao uma paleta nova inventada aqui.
 */
export const ORDER_STATUS_TONES: Record<OrderStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  novo: 'warning',
  pago: 'neutral',
  separacao: 'neutral',
  enviado: 'neutral',
  entregue: 'success',
  cancelado: 'danger',
};

/** O rotulo da coluna STATUS do adm-004 — o estado da POSTAGEM. */
export const SHIPPING_STATUS_LABELS: Record<string, string> = {
  aguardando_postagem: 'Aguardando postagem',
  postado: 'Postado',
  em_transito: 'Em trânsito',
  saiu_para_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  extraviado: 'Extraviado',
  devolvido: 'Devolvido',
};

/**
 * AS ACOES DO PEDIDO.
 *
 * ====================== FUNCIONALIDADE SEM PRINT ======================
 *
 * adm-004 tem uma coluna `AÇÃO` em toda a tabela, e o que ela mostra, nas duas
 * linhas, e `sem código` — um ESTADO VAZIO em cinza, nao um botao. O projeto
 * original confirma a leitura: naquele lugar ele desenha um link `Rastrear`
 * quando existe `tracking_code`, e o texto `sem código` quando nao existe.
 *
 * Ou seja: a tela de Pedidos tem uma acao que NUNCA foi fotografada. Nao ha
 * print de modal de status, de campo de rastreio nem de botao de imprimir. O
 * proprio mapa do painel aponta a lacuna: adm-003/004 estao na lista dos prints
 * com "o da acao" faltando.
 *
 * O que foi feito: as tres acoes que o projeto original DECLARA existir
 * ("Alterar status, lançar código de rastreio e imprimir os dados de envio")
 * estao aqui como LISTA DECLARADA, para a tela ter para onde apontar quando o
 * print aparecer — e nao como botoes ativos que fingem funcionar.
 *
 * O que NAO foi feito: desenhar um modal bonito e plausivel de "alterar
 * status". Isso produziria a interface que PARECE a referencia e nao e, e daria
 * a entender que existe um fluxo que ninguem desenhou. Ver o relatorio final.
 * =====================================================================
 */
export const ORDER_ACTIONS: { key: string; label: string; available: false }[] = [
  { key: 'status', label: 'Alterar status', available: false },
  { key: 'tracking', label: 'Lançar código de rastreio', available: false },
  { key: 'print', label: 'Imprimir dados de envio', available: false },
];

/**
 * OS PEDIDOS — transcritos de adm-003.
 *
 * ORDEM: a do print, de cima para baixo. E ordem de DATA decrescente, e por
 * isso a tela nao precisa de uma lista explicita como a do Estoque — mas a
 * bancada verifica as duas coisas: que a ordem e a do print E que ordenar por
 * data reproduz a mesma sequencia. Se um dia deixar de reproduzir, e sinal de
 * que apareceu um pedido com data fora de lugar.
 *
 * O QUE O PRINT DEIXA AMBIGUO, E COMO FOI TRATADO
 *
 * 1. `lucas` aparece TRES VEZES, com o MESMO telefone e o mesmo item, em tres
 *    horarios diferentes (13:43:06, 13:43:12, 13:43:16). Sao realmente TRES
 *    pedidos: os horarios sao distintos e crescem, e o print mostra os tres
 *    cartoes separados. Nao foi colapsado em um so — colapsar seria apagar dois
 *    pedidos que a referencia mostra.
 *
 * 2. O PRIMEIRO CARD de adm-003 (`Mariana`, R$ 506,95) NAO MOSTRA a lista de
 *    itens. Os outros quatro mostram. As causas possiveis sao duas — o pedido
 *    nao tem itens gravados, ou o print cortou a lista ao capturar — e o
 *    material nao decide entre elas.
 *
 *    Adotado o UNICO comportamento que nao inventa dado: `items: []`. A tela
 *    entao nao desenha linha de item nenhuma, que e exatamente o que o print
 *    mostra. (Preencher com os tres itens "que somam R$ 506,95" seria fabricar
 *    uma venda — e um pedido sem itens e um estado legitimo do sistema: o
 *    proprio projeto original escreve `Sem pedidos ainda.` e imprime lista
 *    vazia sem quebrar.)
 *
 * 3. Os itens de `carinna` e `lucas` vem do CARTAO (adm-003), nao da tabela
 *    (adm-004) — a tabela nao tem coluna de itens. O cartao da propria
 *    `Mariana`, em adm-004, nao ajuda: aquela tabela so tem as duas primeiras
 *    linhas.
 *
 * ================== O E-MAIL, E POR QUE ELE ESTA AQUI ==================
 *
 * Os cinco pedidos foram transcritos com `email: null`, porque a tela de Pedidos
 * NAO MOSTRA e-mail — nao ha coluna, e portanto nao havia de onde transcrever.
 *
 * So que o CRM le exatamente esse campo: a chave de agrupamento dele e
 * `email || telefone || nome` (ver `lib/crm/metrics.ts`, `customerKey`), e o
 * resultado tem que reproduzir o adm-005, que mostra UMA cliente:
 *
 *   Mariana · lp070087@gmail.com · 5 pedidos · R$ 1.252,71 · 16/06/2026
 *
 * Com `email: null` nos cinco, a chave cai no TELEFONE — e `lucas` e `carinna`
 * compartilham o mesmo numero (`81985930411`, conforme adm-003). O CRM passa a
 * ver DUAS clientes em vez de uma: `carinna` absorve os tres pedidos do `lucas`
 * (4 pedidos, `R$ 745,76`) e `Mariana` fica sozinha (1 pedido, `R$ 506,95`).
 * Nenhuma das duas linhas e a de adm-005, o `TOTAL INVESTIDO` deixa de somar os
 * cinco e a tabela nao reproduz print nenhum. O defeito foi encontrado pela
 * bancada do CRM, e nao a olho.
 *
 * O e-mail entra, entao, pelo unico caminho que nao inventa: o ADM-005 O MOSTRA.
 * As duas referencias descrevem a MESMA compra — os cinco pedidos de adm-003 sao
 * os cinco que adm-005 soma — e uma delas simplesmente exibe um campo que a
 * outra nao tem coluna para exibir. Preencher um campo com o valor que o print
 * do CRM ja imprime nao e fabricar: e completar a transcricao com a unica
 * referencia que fala desse campo.
 *
 * A tela de Pedidos nao muda em nada por isso: ela nao le `email` (a bancada
 * prova — `grep` por `email` em `components/admin/pedidos/` nao acha nada), e
 * nenhum print de Pedidos deixa de ser reproduzido.
 *
 * ================== O ENDERECO, E POR QUE ELE NAO ESTA ==================
 *
 * Pelo mesmo raciocinio, `city`/`state` ficam VAZIOS.
 *
 * Aqui as duas referencias DISCORDAM, e nao ha valor que satisfaca as duas:
 *
 *   adm-005  mostra `Rio de Janeiro - RJ` na LOCALIZACAO da cliente
 *   adm-011  conta 1 no card `RECIFE / OLINDA / JABOATAO`
 *
 * So existe UMA cliente, e ela e a mesma nas duas telas (mesmo `1` em INATIVAS,
 * mesma sessao). Ela NAO pode estar em `Rio de Janeiro` e em Recife/Olinda/
 * Jabotao ao mesmo tempo — uma das duas telas esta mostrando um estado que o
 * banco nao tinha mais quando a outra foi capturada (o banco de demonstracao e
 * resemeado; os dois prints sao de minutos diferentes).
 *
 * Escolher qualquer uma das duas cidades seria fabricar: `Rio de Janeiro`
 * contradiz adm-011, `Recife` contradiz adm-005, e um terceiro valor nao existe
 * em referencia nenhuma. Ficam VAZIOS, e a divergencia sobe para o relatorio.
 * A celula LOCALIZACAO aparece vazia — e a unica opcao que nao inventa dado.
 *
 * Em Neon isto deixa de ser escolha: `orders` ganha uma coluna por campo de
 * endereco, o valor passa a vir da origem, e as duas telas passam a ler o mesmo.
 * =======================================================================
 */
export const DEMO_ORDERS_PEDIDOS: Order[] = [
  {
    id: 'ff3048c9-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
    code: '#ff3048c9',
    // O e-mail vem de adm-005, que o EXIBE (a tela de Pedidos nao tem essa
    // coluna). Ver o bloco `O E-MAIL, E POR QUE ELE ESTA AQUI`.
    customer: { name: 'Mariana', phone: '81994608572', email: 'lp070087@gmail.com' },
    placedAt: '2026-06-16T14:56:54',
    // Canto direito: `R$ 506,95 • novo`.
    status: 'novo',
    // Sem itens, como o print. Ver a nota (2) acima.
    items: [],
    payment: {
      // `null` em print nenhum: o pagamento nao aparece nesta tela. `pix` e o
      // caminho padrao do checkout; fica como dado, sem interface.
      method: 'pix',
      shippingPrice: 0,
      discount: 0,
      couponCode: null,
      subtotal: 506.95,
      total: 506.95,
    },
    shipping: {
      kind: 'transportadora',
      carrier: 'Correios',
      // `CÓDIGO` = `—` no adm-004; `AÇÃO` = `sem código`.
      trackingCode: null,
      status: 'aguardando_postagem',
      /*
        O identificador CRU do metodo. Ver a nota de `shipmentMethod` em
        `types.ts`: e ele — e nao `carrier` — que a area da cliente imprime na
        linha do caminhao (`me:1`, no print `cli-004`).
      */
      shipmentMethod: 'me:1',
    },
    address: {
      street: '',
      cep: '',
      city: '',
      state: '',
      complement: null,
    },
  },
  {
    id: '41b60ae2-2b3c-4d5e-9f60-6b7c8d9e0f1a',
    code: '#41b60ae2',
    customer: { name: 'carinna', phone: '81985930411', email: 'lp070087@gmail.com' },
    placedAt: '2026-06-16T14:45:30',
    status: 'novo',
    items: [
      {
        id: 'oi-02-1',
        productId: 'p-07',
        productName: 'Jaqueta Corta Vento Fit',
        size: 'M',
        color: 'Preto',
        quantity: 1,
        unitPrice: 179.9,
      },
    ],
    payment: {
      method: 'pix',
      shippingPrice: 7.86,
      discount: 0,
      couponCode: null,
      subtotal: 179.9,
      total: 187.76,
    },
    shipping: {
      kind: 'transportadora',
      carrier: 'Correios',
      trackingCode: null,
      status: 'aguardando_postagem',
      // `me:1` — o identificador do print `cli-004` (ver `shipmentMethod`).
      shipmentMethod: 'me:1',
    },
    address: { street: '', cep: '', city: '', state: '', complement: null },
  },
  {
    id: '7c1e93aa-3c4d-5e6f-a071-7c8d9e0f1a2b',
    code: '#7c1e93aa',
    customer: { name: 'lucas', phone: '81985930411', email: 'lp070087@gmail.com' },
    placedAt: '2026-06-15T13:43:16',
    status: 'novo',
    items: [
      {
        id: 'oi-03-1',
        productId: 'p-01',
        productName: 'top',
        size: 'M',
        color: 'Único',
        quantity: 1,
        unitPrice: 179,
      },
    ],
    payment: {
      method: 'pix',
      shippingPrice: 7,
      discount: 0,
      couponCode: null,
      subtotal: 179,
      total: 186,
    },
    // SEM linha `Transp./Status` no cartao — ver a nota (4) abaixo.
    // O `own:` e o identificador do print `cli-004`; ver `shipmentMethod`.
    shipping: { kind: 'propria', carrier: null, trackingCode: null, status: null, shipmentMethod: 'own:341d5a3a-8603-4a60-9903-72b8f529d0e0' },
    address: { street: '', cep: '', city: '', state: '', complement: null },
  },
  {
    id: '9a02f5d1-4d5e-6f70-b182-8d9e0f1a2b3c',
    code: '#9a02f5d1',
    customer: { name: 'lucas', phone: '81985930411', email: 'lp070087@gmail.com' },
    placedAt: '2026-06-15T13:43:12',
    status: 'novo',
    items: [
      {
        id: 'oi-04-1',
        productId: 'p-01',
        productName: 'top',
        size: 'M',
        color: 'Único',
        quantity: 1,
        unitPrice: 179,
      },
    ],
    payment: {
      method: 'pix',
      shippingPrice: 7,
      discount: 0,
      couponCode: null,
      subtotal: 179,
      total: 186,
    },
    // O `own:` e o identificador do print `cli-004`; ver `shipmentMethod`.
    shipping: { kind: 'propria', carrier: null, trackingCode: null, status: null, shipmentMethod: 'own:341d5a3a-8603-4a60-9903-72b8f529d0e0' },
    address: { street: '', cep: '', city: '', state: '', complement: null },
  },
  {
    id: '3de811b4-5e6f-7081-c293-9e0f1a2b3c4d',
    code: '#3de811b4',
    customer: { name: 'lucas', phone: '81985930411', email: 'lp070087@gmail.com' },
    placedAt: '2026-06-15T13:43:06',
    status: 'novo',
    items: [
      {
        id: 'oi-05-1',
        productId: 'p-01',
        productName: 'top',
        size: 'M',
        color: 'Único',
        quantity: 1,
        unitPrice: 179,
      },
    ],
    payment: {
      method: 'pix',
      shippingPrice: 7,
      discount: 0,
      couponCode: null,
      subtotal: 179,
      total: 186,
    },
    // O `own:` e o identificador do print `cli-004`; ver `shipmentMethod`.
    shipping: { kind: 'propria', carrier: null, trackingCode: null, status: null, shipmentMethod: 'own:341d5a3a-8603-4a60-9903-72b8f529d0e0' },
    address: { street: '', cep: '', city: '', state: '', complement: null },
  },
];

/**
 * O PEDIDO QUE JA TEM CODIGO DE RASTREIO.
 *
 * adm-004 so tem duas linhas, e as duas dizem `sem código`. Mas a COLUNA
 * `AÇÃO` existe para o outro caso, e o projeto original diz o que ele faz:
 * quando ha codigo, o lugar do `sem código` passa a ser o link `Rastrear`.
 *
 * Esse estado NAO esta em print nenhum. Para a bancada poder provar que o
 * ramo existe (e nao so o vazio), ele entra aqui como um pedido DEMONSTRATIVO
 * DECLARADO, marcado como tal — e nao misturado aos cinco transcritos. Se ele
 * fosse um sexto pedido na lista, a tela deixaria de reproduzir o print.
 */
export const DEMO_TRACKED_ORDER: Order = {
  id: 'a1b2c3d4-6f70-8192-d3a4-0f1a2b3c4d5e',
  code: '#a1b2c3d4',
  customer: { name: 'Mariana', phone: '81994608572', email: null },
  placedAt: '2026-06-14T10:20:00',
  status: 'enviado',
  items: [
    {
      id: 'oi-demo-1',
      productId: 'p-04',
      productName: 'Legging Modeladora Premium',
      size: 'M',
      color: 'Preto',
      quantity: 1,
      unitPrice: 129.9,
    },
  ],
  payment: {
    method: 'cartao',
    shippingPrice: 7,
    discount: 0,
    couponCode: null,
    subtotal: 129.9,
    total: 136.9,
  },
  shipping: {
    kind: 'transportadora',
    carrier: 'Correios',
    trackingCode: 'BR123456789BR',
    status: 'postado',
    shipmentMethod: 'me:1',
  },
  address: { street: '', cep: '', city: '', state: '', complement: null },
};

/**
 * a nota (4) que ficou pendente acima, agora escrita onde interessa.
 *
 * Os tres cartoes do `lucas` nao mostram a linha `Transp.: / Status:`, enquanto
 * os dois do topo mostram. A explicacao que o material sustenta e que eles nao
 * TEM postagem (`status: null`) — e a tela omite a linha inteira, do mesmo jeito
 * que o projeto original faz:
 *
 *   {(o.carrier || o.tracking_code || o.delivery_status) && ( ...a linha... )}
 *
 * Nao foi adotada a outra hipotese — de que o print apenas CORTOU a linha. Ela
 * tambem explicaria o que se ve, mas adota-la obrigaria a inventar uma
 * transportadora e um status para tres pedidos, ou seja, a fabricar o dado para
 * a tela ficar cheia.
 */

/**
 * NOME DE QUEM VE O PAINEL, para a coluna de acao e para a impressao — quando
 * ela existir. Mesmo valor e mesmo dono unico de `lib/estoque/demo.ts`.
 */
export const DEMO_OPERATOR = 'lp070087@gmail.com';
