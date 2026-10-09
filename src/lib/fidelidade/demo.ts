/**
 * Dados de demonstracao de Fidelidade.
 *
 * LEGENDA DAS FONTES (vale para cada numero abaixo):
 *
 *   [PRINT]  esta escrito no print
 *   [LOVABLE] o projeto original cria/consulta com esta forma
 *   [SCHEMA] a coluna existe em `integrations/supabase/types.ts`
 *
 * NADA AQUI E INVENTADO SEM FONTE. Onde o print nao mostra, o valor vem do
 * original; onde nenhum dos dois mostra, o campo fica vazio e o motivo e escrito.
 *
 * ---------------------------------------------------------------- os IDs
 *
 * DUAS FONTES DE ID, E SO DUAS, nesta lista:
 *
 *   `rw-*`  escrito aqui, estavel, so para a `key` das linhas de recompensa
 *   `tr-*`  TAMBEM escrito aqui — e o `id` de cada nivel do Clube VIP
 *
 * O `id` do nivel e a excecao que este arquivo ORIGINALMENTE recusava a criar, e
 * a explicacao de por que a recusa caiu fica registrada abaixo, porque e o tipo de
 * decisao que nao pode ser revertida em silencio depois.
 *
 * ---------------------------------------------------------------------- NIVELES
 *
 * adm-019 mostra QUATRO cartoes preenchidos. Nao ha duvida sobre o que a tela deve
 * MOSTRAR: nome, cor, pontos minimos, multiplicador e a lista de beneficios dos
 * quatro estao no print, e os quatro foram transcritos letra a letra.
 *
 * A PRIMEIRA DECISAO FOI DEIXAR ESTA LISTA VAZIA, e o motivo era bom: o projeto
 * original so LE `loyalty_tiers` (`select *`), nunca cria um nivel; nao ha `seed`
 * nem array de niveis em nenhum arquivo das referencias; os quatro vieram
 * pre-carregados no banco da loja; e o `id` — que e a chave pela qual `saveTiers`
 * faz `update(...).eq("id", tier.id)` — nao aparece em print nenhum. Inventar o id
 * seria a unica parte do dado sem fonte, justamente a que a gravacao usa.
 *
 * ESSA RECUSA ESTAVA ERRADA, e o motivo e este: `update(...).eq("id", ...)` NAO E
 * A UNICA FORMA de gravar um nivel. Com `upsert` sobre a chave primaria, o `id`
 * passa a ser INFORMACAO, e nao referencia — um id que ainda nao existe no banco e
 * exatamente o que um upsert de insercao espera receber. O erro da primeira versao
 * foi tratar a restricao do `for`+`eq` do original como se fosse uma restricao do
 * DOMINIO. O padrao de escrita do Neon e uma escolha nossa (ver `data.ts`), e
 * escolher `upsert` devolve ao `id` o papel de identificador estavel, que e o que
 * ele e.
 *
 * O QUE ISSO CUSTA, escrito para nao ser esquecido: como o id nao veio do banco, o
 * banco TEM que aceitar id fornecido pelo cliente. Se a tabela do Neon nascer com
 * `default gen_random_uuid()` e a gravacao usar apenas `INSERT`, estes quatro ids
 * nunca chegam la e a lista continua vazia depois da primeira sincronizacao. O
 * contrato esta em `data.ts`, e a bancada prova que nenhum id se repete.
 *
 * OS VALORES SAO DO PRINT, UM A UM:
 *
 *   Bronze    0 pts  x1    #CD7F32  2 beneficios
 *   Prata     1000    x1.2  #C0C0C0  3 beneficios
 *   Ouro      3000    x1.5  #FFD700  4 beneficios
 *   Diamante  7000    x2    #B9F2FF  4 beneficios
 *
 * As quatro cores foram LIDAS DO PIXEL da tarja do topo de cada cartao em adm-019,
 * e nao deduzidas do nome: #CD7F32 e o bronze, #C0C0C0 a prata, #FFD700 o ouro e
 * #B9F2FF o diamante, os quatro com correspondencia exata ao hexa medido. Nao ha
 * "#9CA3AF" (o cinza de reserva de `tierColor`) em uso aqui — nem poderia haver,
 * porque o print nao tem cartao sem cor.
 *
 * A ORDEM E A DO BANCO (`order by min_points asc`), e nao a ordem em que os cartoes
 * foram digitados: Bronze 0, Prata 1000, Ouro 3000, Diamante 7000. `sortTiers`
 * aplica a mesma ordenacao na leitura, entao a lista abaixo ja esta na ordem final.
 */

import type { LoyaltyMovement, LoyaltyReward, LoyaltyRules, LoyaltyTier } from './types';

/**
 * As regras gerais de adm-018.
 *
 * OS QUATRO VALORES SAO DO PRINT. Nao ha numero escolhido aqui: `1`, `100` e `50`
 * sao os que aparecem nos campos, e `isEnabled: true` corresponde ao quadradinho
 * `Programa Ativo` MARCADO.
 *
 * O original NAO define estes valores: ele os LE (`c1.data?.value || {}`), e o
 * `|| {}` produz um objeto VAZIO quando nao ha linha no banco. Numero nenhum
 * nasce no codigo da referencia.
 */
export const DEMO_LOYALTY_RULES: LoyaltyRules = {
  pointsPerReal: 1,
  pointsForReferral: 100,
  pointsForReview: 50,
  isEnabled: true,
};

/**
 * As tres recompensas de adm-018.
 *
 * `label` e `points` SAO DO PRINT: `R$ 10 de desconto` = 500 PTS, `R$ 15 de
 * desconto` = 1000 PTS, `R$ 30 de desconto` = 2000 PTS. Os tres `label` comecam
 * com `R$`, e e de onde `formatRewardValue` tira o valor — ver o comentario la.
 *
 * `discountValue` NAO esta no print — o campo existe no contrato do original
 * (`{ label, points, discount_value, id }`) mas a tela nao o edita. O valor
 * acompanha o rotulo e esta MARCADO com `// [LOVABLE]` para ninguem achar que
 * saiu do print.
 *
 * O `id` e estavel (`rw-1`, `rw-2`, `rw-3`) e nao `Date.now()`: ver a divergencia
 * registrada em `data.ts` sobre o id das recompensas.
 */
export const DEMO_LOYALTY_REWARDS: LoyaltyReward[] = [
  { id: 'rw-1', label: 'R$ 10 de desconto', points: 500, discountValue: 10 },
  { id: 'rw-2', label: 'R$ 15 de desconto', points: 1000, discountValue: 15 },
  { id: 'rw-3', label: 'R$ 30 de desconto', points: 2000, discountValue: 30 },
];

/**
 * Os quatro niveis do Clube VIP — adm-019, integralmente.
 *
 * Ver o bloco longo no topo deste arquivo para a decisao sobre o `id`.
 * Os `benefits` sao listas de TEXTO (nao de objetos), gravadas como JSON, que e o
 * que o `<textarea>` do print edita e o que `benefitsToText` escreve.
 */
export const DEMO_LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'tr-bronze',
    name: 'Bronze',
    color: '#CD7F32',
    minPoints: 0,
    multiplier: 1,
    benefits: ['Acúmulo padrão de pontos', 'Cupons sazonais'],
  },
  {
    id: 'tr-prata',
    name: 'Prata',
    color: '#C0C0C0',
    minPoints: 1000,
    multiplier: 1.2,
    benefits: ['1.2x mais pontos', 'Frete especial', 'Descontos exclusivos'],
  },
  {
    id: 'tr-ouro',
    name: 'Ouro',
    color: '#FFD700',
    minPoints: 3000,
    multiplier: 1.5,
    benefits: ['1.5x mais pontos', 'Pré-venda exclusiva', 'Cashback maior', 'Brinde no aniversário'],
  },
  {
    id: 'tr-diamante',
    name: 'Diamante',
    color: '#B9F2FF',
    minPoints: 7000,
    multiplier: 2,
    benefits: ['2x mais pontos', 'Atendimento VIP', 'Frete grátis ilimitado', 'Convites para eventos'],
  },
];

/**
 * O extrato de adm-020 esta vazio — a tabela mostra so o cabecalho.
 *
 * `customer_email`, `description`, `type` e `points` sao as colunas de
 * `loyalty_points` [SCHEMA]. Nenhuma linha existe em referencia nenhuma, entao a
 * lista fica vazia e o estado vazio e o do print.
 *
 * NAO INVENTAR MOVIMENTACAO. Uma linha de extrato tem um `customer_email` REAL de
 * uma cliente da loja, e um e-mail inventado aqui apareceria no painel como se
 * alguem tivesse ganhado pontos.
 */
export const DEMO_LOYALTY_MOVEMENTS: LoyaltyMovement[] = [];
