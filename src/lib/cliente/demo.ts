/**
 * Os dados de demonstracao da AREA DA CLIENTE.
 *
 * Este arquivo e lido SO por `data.ts`. Nenhum componente o importa: se um
 * componente importasse, a tela passaria a ter duas fontes e o dia em que o
 * Neon entrar viraria uma cacada.
 *
 * ================== O QUE VEM DOS PRINTS, E O QUE NAO VEM ==================
 *
 * Os CUPONS abaixo sao os do print `cli-015`, e o principal e o que ele
 * mostra: `CLOSET10`, 10% OFF, com EXPIRACAO em 20/08/2026 — uma data que JA
 * PASSOU em relacao ao "hoje" desta fase. A demonstracao mantem a data do
 * print de proposito: e ela que faz a tela abrir no estado que o material
 * documenta (cartao escurecido, selo `EXPIRADO`), em vez de abrir bonita e
 * esconder o unico estado que a referencia prova.
 *
 * Os FAVORITOS sao deliberadamente NENHUM: o print `cli-007` mostra a tela
 * vazia, com `Sua lista de favoritos está vazia.`. Escrever aqui produtos
 * "provaveis" faria a tela mentir sobre o banco — a mesma decisao que o modulo
 * Favoritos do admin ja tomou.
 *
 * Os PEDIDOS nao estao neste arquivo: eles vem de `@/lib/pedidos/demo`, que e
 * a fonte do admin, filtrados por cliente em `data.ts`.
 */

import type {
  CupomCliente,
  EnderecoCliente,
  FavoritoCliente,
  MedidaHistorico,
  MovimentoPontos,
  NivelClube,
  PerfilMedidas,
  RecompensaClube,
  RegrasClube,
} from './types';

/** Nenhum favorito — o print `cli-007` mostra exatamente isso. */
export const DEMO_FAVORITOS_CLIENTE: FavoritoCliente[] = [];

/**
 * O perfil de medidas da cliente.
 *
 * Os numeros sao os do print `cli-010` (`004742`): altura 165, peso 59, idade
 * 28. Os outros tres (busto, cintura, quadril) o print mostra VAZIOS, e o
 * `Tamanho de costume` mostra `Selecione —`, ou seja, `null`. Nada foi
 * inventado para "completar" o perfil — os campos que o material deixa em
 * branco nascem `null`.
 *
 * O `updated_at` e o do cartao escuro do print: `ATUALIZADO EM 07/08/2026`.
 * Reproduzir a data (e nao usar "hoje") mantem a tela no estado que o material
 * documenta.
 *
 * ================== POR QUE OS TRES CAMPOS VAZIOS NAO SAO "DADOS FALTANDO" ==================
 *
 * Eles sao o estado REAL da conta dos prints, e a tela tem que saber lidar com
 * isso: a tabela do historico mostra `null` como celula vazia, e o passo 2 da
 * bancada prova que nenhum deles vira `0` ou `undefined`. Preencher um numero
 * plausivel aqui faria a tela parecer mais pronta — e menos verdadeira.
 */
export const DEMO_PERFIL_MEDIDAS: PerfilMedidas = {
  height: 165,
  weight: 59,
  age: 28,
  bust: null,
  waist: null,
  hip: null,
  usual_size: null,
  fit_preference: 'normal',
  practices_activity: null,
  activity_time: null,
  knows_measurements: null,
  updated_at: '2026-08-07T00:00:00',
};

/**
 * O historico de medidas.
 *
 * VAZIO, e o print prova: `004753` mostra `Nenhum registro anterior encontrado.`
 * A tabela (`Data · Peso · Busto · Cintura · Quadril`) existe no original, mas
 * com a lista vazia ela nem e desenhada — o vazio tem o proprio bloco. Inventar
 * uma linha de historico poria na tela uma pesagem que nunca aconteceu.
 */
export const DEMO_HISTORICO_MEDIDAS: MedidaHistorico[] = [];

/**
 * A caderneta de enderecos da cliente.
 *
 * VAZIA, como o print `cli-008` (`004726`): a tela mostra o bloco tracejado com
 * `Você ainda não possui endereços cadastrados.`, e nenhum cartao de endereco.
 * `customer_addresses` de uma conta recem-criada nao tem linha — inventar um
 * `Casa` com uma rua plausivel faria a tela mostrar um endereco que a cliente
 * nunca salvou. Ver a nota de `DEMO_FAVORITOS_CLIENTE`, que e a mesma decisao.
 */
export const DEMO_ENDERECOS_CLIENTE: EnderecoCliente[] = [];

/**
 * Os cupons da cliente.
 *
 * `expiraEm` e ISO 8601 com hora, e nao so a data: o print escreve a data, mas
 * o banco guarda `timestamptz`. O fim do dia 20 e `23:59:59`, e nao
 * `00:00:00` do dia 20 — o cupom vence quando o dia impresso TERMINA.
 *
 * ================== O MESMO CUPOM VENCE NO DASHBOARD E NAO VENCE NA LISTA ==================
 *
 * Ele nasce ja vencido de proposito, e isso NAO faz as duas telas discordarem:
 *
 * - `/conta` (`cli-001`) lista os cupons por `is_active`, SEM olhar validade, e
 *   por isso mostra o `CLOSET10` normalmente. O nome do cartao — `Cupons
 *   ativos` — fala do campo `is_active`, e nao do que esta dentro do prazo.
 * - `/conta/cupons` (`cli-015`) faz o mesmo `is_active = true` e DEPOIS
 *   escurece o que venceu. E o print em que este cupom aparece com o selo
 *   `EXPIRADO`.
 *
 * Os dois prints foram tirados na mesma sessao, com dois minutos e meio de
 * diferenca. Entao o estado dos dois lados e o estado do material, e nao uma
 * contradicao a resolver.
 */
export const DEMO_CUPONS_CLIENTE: CupomCliente[] = [
  {
    id: 'cupom-closet10',
    code: 'CLOSET10',
    kind: 'percent',
    value: 10,
    /*
      ================== ZERO, E NAO `150` — DOIS PRINTS DIZEM ZERO ==================

      Este campo nasceu com `150` (por volta do modulo 4) sem nenhuma fonte que o
      sustentasse, e a bancada do modulo 10 reprovou a invencao. Duas fontes
      independentes dizem ZERO:

        `adm-012` (a lista de cupons do admin) — a coluna `MÍN.` do `CLOSET10`
        imprime `—`, e a tabela do admin imprime `—` so quando o valor e zerado
        (o proprio original: `Number(r.min_subtotal) > 0 ? formatBRL(...) : "—"`).
        Um alvo de R$ 150 imprimiria `R$ 150,00`, e o print nao mostra isso. E o
        formulario de cupom do admin (adm-013) ABRE com `min_subtotal: 0`.

        `cli-015` (esta tela) — a linha de meta do cupom traz dois termos,
        `EXPIRA EM: 20/08/2026` e `EXPIRADO`, e nada mais. A medida fecha a
        questao: a tinta da linha vai de x=383 a x=598 dentro de um cartao que vai
        de x=350 a x=1404, com um unico vazio de 18 px entre os dois termos. O
        termo `Mínimo:` do original so desenha quando o valor passa de zero, e no
        material ele nao esta la — porque nao ha valor.

      Zero, e nao `null`: `min_subtotal` e uma coluna `NOT NULL DEFAULT 0`, e zero
      significa "sem pedido minimo". Ver a nota de `formatMinSubtotal` em
      `lib/cupons/`.
    */
    minimo: 0,
    // A data do print cli-015. Ver a nota acima: vencido na lista, ativo no resumo.
    expiraEm: '2026-08-20T23:59:59',
    esgotado: false,
  },
];

/**
 * O EXTRATO de pontos da cliente — a tabela `loyalty_points`.
 *
 * VAZIO, e os prints provam: `cli-012` mostra `Nenhuma movimentação.` no cartao
 * `Histórico`, o `Seu Saldo 0` e a barra de progresso VAZIA (`0 / 1000 PTS`).
 * Com o extrato vazio, o saldo e o acumulado sao ambos 0 — e o nivel e o
 * `BRONZE` (o piso de 0 pontos). Inventar uma compra aqui poria na tela um
 * `+500` que nunca aconteceu.
 *
 * ================== O EXTRATO E A FONTE, E NAO UM NUMERO SOLTO ==================
 *
 * Antes desta mudanca o saldo era a funcao `saldoPontos()` devolvendo `0` fixo.
 * Agora o saldo E O ACUMULADO sao DERIVADOS deste array (ver
 * `saldoPontosDoExtrato`/`pontosAcumulados` em `metrics.ts`), porque o original
 * le a tabela inteira e soma. Um numero fixo nao teria como virar o extrato que a
 * tela desenha — e no dia em que houver uma linha, o saldo tem que acompanhar
 * sozinho.
 */
export const DEMO_PONTOS_CLUBE: MovimentoPontos[] = [];

/**
 * As RECOMPENSAS resgataveis — a chave `rewards` de `loyalty_config`.
 *
 * As tres do print `cli-013`: `R$ 10 de desconto` por 500 pts, `R$ 15` por 1000
 * e `R$ 30` por 2000. Os VALORES sao os do material; o `USO ÚNICO EM TODO O
 * SITE` e outro.
 *
 * Nenhuma e acessivel hoje (o saldo e 0), e por isso o print mostra as tres com
 * o estado BLOQUEADO (`Faltam N pontos`). A quarta recompensa existe no original
 * so como ramo do mapa — o material mostra tres, e sao tres que entram.
 */
export const DEMO_RECOMPENSAS_CLUBE: RecompensaClube[] = [
  { id: 'rec-10', rotulo: 'R$ 10 de desconto', pontos: 500 },
  { id: 'rec-15', rotulo: 'R$ 15 de desconto', pontos: 1000 },
  { id: 'rec-30', rotulo: 'R$ 30 de desconto', pontos: 2000 },
];

/**
 * As REGRAS do programa — a chave `general_rules` de `loyalty_config`.
 *
 * Os dois numeros que a secao `Regras do Programa` imprime: `100` pontos por
 * indicacao e `50` por avaliacao — os mesmos do print e os mesmos que o fallback
 * do original (`|| 100` / `|| 50`) produziria com a config vazia.
 */
export const DEMO_REGRAS_CLUBE: RegrasClube = {
  pontosIndicacao: 100,
  pontosAvaliacao: 50,
};

/**
 * O cashback a receber.
 *
 * O numero e o do print `cli-002`: `CASHBACK R$ 10,14`. Ele NAO e calculado
 * aqui, e a diferenca importa: 10,14 e exatamente 2% de 506,95 (o total do
 * pedido `#ff3048c9`), o que sugeriria "cashback = 2% do pedido" — mas NENHUMA
 * referencia desta fase diz qual e a porcentagem, nem se a base e o pedido ou o
 * total acumulado. Calcular 2% agora seria inventar a regra do programa de
 * fidelidade a partir de uma coincidencia aritmetica.
 *
 * Entao ele viaja como NUMERO, com a mesma natureza dos outros: valor de
 * demonstracao que veio do print, a ser substituido pelo saldo real quando o
 * Neon entrar. Quando a tela de Fidelidade do admin (que e a dona da regra)
 * entrar em cena, a formula sai de la e nao daqui.
 */
export const DEMO_CASHBACK = 10.14;

/**
 * ================== OS QUATRO NIVEIS DO CLUBE ==================
 *
 * O print `cli-013` mostra a lista `Níveis do Clube` com QUATRO niveis, e os
 * limiares de cada um: `BRONZE` 0+, `PRATA` 1000+, `OURO` 3000+, `DIAMANTE`
 * 7000+. Estes sao os numeros do material — nenhum foi escolhido.
 *
 * A `cor` e um VALOR DA TABELA `loyalty_tiers`: o original le `currentTier.color`
 * e joga direto no `style`. Aqui ela vem medida dos prints, porque a cor tambem
 * e o que a tela desenha.
 *
 * ================== A COR DO BRONZE FOI RECORRIGIDA NESTE MODULO ==================
 *
 * O valor anterior era `hsl(33 72% 44%)` = (188,103,36), medido pela mediana da
 * PALAVRA `BRONZE` no cartao escuro. Aquela medida estava contaminada: o texto
 * tem anti-aliasing, e a mediana da tinta de um texto sai MAIS ESCURA que a cor
 * pura. A medida limpa e a FAIXA SOLIDA do topo do cartao (`borderTop: 8px solid
 * currentTier.color`), que no `cli-012` deu **exatamente (205,127,50)** — o
 * bronze classico `#CD7F32`. E essa a cor que a demonstracao guarda agora.
 *
 * Os outros tres vieram da mesma natureza de medida (a tinta do trofeu na lista):
 * `PRATA` ~ (190,190,190), `OURO` ~ (240,208,0), `DIAMANTE` ~ (176,240,240).
 * Os pixels carregam gradiente, entao sao aproximacoes; os QUATRO valores sao de
 * DEMONSTRACAO — em producao vem da coluna `color`, e a tela so os repassa.
 */
export const DEMO_NIVEIS_CLUBE: NivelClube[] = [
  {
    id: 'nivel-bronze',
    nome: 'Bronze',
    cor: '#CD7F32',
    minimoPontos: 0,
    beneficios: ['Acúmulo padrão de pontos', 'Cupons sazonais'],
  },
  {
    id: 'nivel-prata',
    nome: 'Prata',
    cor: 'hsl(0 0% 75%)',
    minimoPontos: 1000,
    beneficios: ['Acúmulo turbo de pontos', 'Frete grátis em compras selecionadas'],
  },
  {
    id: 'nivel-ouro',
    nome: 'Ouro',
    cor: '#F0D000',
    minimoPontos: 3000,
    beneficios: ['Acúmulo turbo de pontos', 'Frete grátis', 'Acesso antecipado a lançamentos'],
  },
  {
    id: 'nivel-diamante',
    nome: 'Diamante',
    cor: '#B0F0F0',
    minimoPontos: 7000,
    beneficios: ['Acúmulo máximo de pontos', 'Frete grátis sempre', 'Atendimento prioritário'],
  },
];

/**
 * O nivel VIP da cliente — `BRONZE`, como o print `cli-001`.
 *
 * ================== ELES SAO O MESMO `BRONZE`, E NAO UMA COPIA ==================
 *
 * Este objeto e o primeiro item de `DEMO_NIVEIS_CLUBE`, e NAO uma segunda
 * declaracao do mesmo nivel. O Dashboard ja o usava; agora o `Clube VIP` usa a
 * lista inteira. Se fossem duas declaracoes, a cor do `BRONZE` poderia divergir
 * entre as duas telas — e "uma cor por nivel, vinda do dado" so vale enquanto
 * houver UM dado. A igualdade e por IDENTIDADE de referencia (o mesmo objeto),
 * provada na bancada.
 */
export const DEMO_NIVEL_CLUBE: NivelClube = DEMO_NIVEIS_CLUBE[0];
