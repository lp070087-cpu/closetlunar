/**
 * Tipos do dominio da AREA DA CLIENTE.
 *
 * Regra desta camada: um conceito que JA EXISTE no admin NAO ganha um tipo
 * novo aqui. `OrderStatus`, por exemplo, e o MESMO campo nos dois paineis — o
 * admin le `Pedido.status` e a cliente le `Pedido.status`, e quando o Neon
 * entrar os dois tem que ler a MESMA coluna. Por isso o tipo e IMPORTADO de
 * `@/lib/pedidos/types`, e nao redeclarado. Um tipo paralelo aqui seria a
 * semente de dois modelos incompativeis para a mesma coisa.
 *
 * Este arquivo cresce por MODULO: hoje tem o que a casca e o Dashboard
 * precisam. Medidas, clube, enderecos e afiliada entram junto com as telas
 * deles — declarar agora um contrato que nenhuma tela le seria codigo morto
 * com cara de planejamento.
 *
 * Nada aqui toca banco. Nesta fase tudo e demonstracao.
 */

import type { OrderStatus } from '@/lib/pedidos/types';
import type { Affiliate } from '@/lib/afiliadas/types';

/**
 * A conta logada na loja.
 *
 * O print `cli-001` mostra `Ola, lp070087@gmail.com` — o e-mail, e nao um
 * nome, porque esta conta nao tem `full_name` salvo. O original faz
 * `(full_name ?? email).split(' ')[0]`, e o e-mail nao tem espaco: sai o
 * e-mail inteiro. Reproduz-se o comportamento, e nao se inventa um nome.
 */
export interface ContaCliente {
  /** `auth.users.id` quando o Supabase entrar. Hoje, id de demonstracao. */
  id: string;
  email: string;
  /** `user_metadata.full_name`. `null` na conta dos prints. */
  nomeCompleto: string | null;
  /**
   * `user_metadata.phone` — o `Telefone / WhatsApp` do formulario de
   * `Dados da Conta`. `null` na conta dos prints: o campo aparece VAZIO, com o
   * `placeholder` `(00) 00000-0000`.
   *
   * O telefone NAO e um dado do pedido. Ele mora no `user_metadata` da conta (o
   * original o le e o grava por `supabase.auth.updateUser`) — e diferente do
   * `phone` de `EnderecoCliente`, que e o contato da ENTREGA daquele endereco.
   * Sao dois telefones com papeis diferentes, e por isso sao dois campos.
   */
  telefone: string | null;
}

/**
 * Um cupom ativo da cliente (`coupons` + resgate).
 *
 * `expiraEm` e `esgotado` sao as DUAS razoes de um cupom nao valer, e o
 * original as trata juntas (`disabled = expired || exhausted`) escurecendo o
 * cartao. Guardar as duas separadas e o que permite a tela dizer POR QUE o
 * cupom nao vale, em vez de so apaga-lo.
 */
export interface CupomCliente {
  id: string;
  /** Caixa alta, como o print: `CLOSET10`. */
  code: string;
  /** `percent` → `10% OFF`; `fixed` → `R$ 20,00 OFF`. */
  kind: 'percent' | 'fixed';
  value: number;
  /** Compra minima. `null` quando nao ha. */
  minimo: number | null;
  /** ISO 8601. A comparacao com "hoje" recebe o relogio por parametro. */
  expiraEm: string | null;
  /** Esgotado: o cartao fica `opacity-60 grayscale`. */
  esgotado: boolean;
}

/** Item como a area da cliente imprime: `{size} · Cor: {color} · Qtd: {n}`. */
export interface ItemPedidoCliente {
  id: string;
  nome: string;
  tamanho: string;
  cor: string;
  quantidade: number;
  precoUnitario: number;
}

/**
 * Uma linha de `Meus Pedidos`.
 *
 * E a PROJECAO do pedido do admin para o que a area da cliente imprime: o
 * `id` e o MESMO, e o `status` e o MESMO campo. O que muda e so o que a tela
 * mostra — itens resumidos, frete pelo nome, total.
 */
export interface PedidoCliente {
  id: string;
  /** `#` + 8 primeiros caracteres do id. Mesma regra do admin. */
  codigo: string;
  /** ISO 8601 completo. O cartao separa data e hora. */
  feitoEm: string;
  status: OrderStatus;
  /** Nome do metodo/frete escolhido — `me:1` nos prints. */
  frete: string | null;
  subtotal: number;
  desconto: number;
  freteValor: number;
  total: number;
  itens: ItemPedidoCliente[];
}

/** Um favorito. E a mesma entidade `produto` vista pela cliente. */
export interface FavoritoCliente {
  id: string;
  /** Mesmo `slug` da loja, para o link do produto quando ele existir. */
  slug: string;
  nome: string;
  preco: number;
  precoDe: number | null;
  imagem: string | null;
}

/**
 * Um endereco da CADERNETA da cliente (`customer_addresses`).
 *
 * ================== NAO CONFUNDIR COM `ShippingAddress` ==================
 *
 * `@/lib/pedidos/types` tem um `ShippingAddress` (street, cep, city, state,
 * complement), e ele NAO e este tipo. A diferenca e de natureza:
 *
 *   `ShippingAddress`      e uma COPIA CONGELADA de onde um pedido foi entregue.
 *                          Se a cliente mudar de casa, o pedido antigo continua
 *                          apontando para o endereco de entao.
 *   `EnderecoCliente`      e a CADERNETA viva — muda quando a cliente quiser, e
 *                          nao pertence a pedido nenhum.
 *
 * O original tem as duas: `customer_addresses` (esta) e `orders.address` (aquela).
 * Fundir as duas num tipo so apagaria justamente a distincao que existe na
 * origem.
 *
 * ================== OS NOMES SAO OS DA COLUNA ==================
 *
 * `label`, `recipient`, `is_default` e companhia ficam em INGLES de proposito: sao
 * os nomes das colunas de `customer_addresses` na origem, e mante-los torna o
 * mapeamento para o Neon 1:1. E a mesma regra que `CupomCliente` segue ao manter
 * `code`/`kind`/`value` (colunas de `coupons`) com os demais campos em portugues.
 */
export interface EnderecoCliente {
  id: string;
  /** `Casa`, `Trabalho` — a etiqueta que a cliente da ao endereco. */
  label: string;
  /** Quem recebe. */
  recipient: string;
  /** WhatsApp. `null` quando nao foi preenchido. */
  phone: string | null;
  cep: string;
  street: string;
  /** `null` quando o endereco nao tem numero (ex.: terreno). */
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string;
  /** UF, duas letras. */
  state: string;
  /** O endereco principal. So UM por cliente. */
  is_default: boolean;
}

/**
 * O perfil de medidas da cliente (`customer_size_profiles`).
 *
 * ================== OS NOMES SAO OS DA COLUNA ==================
 *
 * Como em `EnderecoCliente`, os campos ficam em INGLES (`height`, `weight`,
 * `usual_size`): sao exatamente as colunas de `customer_size_profiles`, e
 * mante-los torna o mapeamento para o Neon 1:1 — o `upsert` do original escreve
 * esses nomes, e o `onConflict: "user_id"` prova que ha UMA linha por cliente.
 *
 * ================== NUMERO, E NAO TEXTO ==================
 *
 * O formulario trabalha com `string` (e o que o `<input>` da), mas o BANCO
 * guarda NUMERO: o original faz `Number(form[key])` e grava `null` quando o
 * campo esta vazio. O tipo aqui reflete o BANCO, e nao a tela — converter na
 * fronteira de `data.ts` e onde a decisao de "vazio vira nulo" mora, uma vez so.
 *
 * ================== `updated_at` E O QUE A TELA MOSTRA ==================
 *
 * O cartao `Ultima recomendacao` escreve `Atualizado em DD/MM/AAAA` a partir
 * desta coluna, e `Complete seu perfil` quando ela falta. E a unica data do
 * perfil, e por isso ela esta aqui.
 */
export interface PerfilMedidas {
  height: number | null;
  weight: number | null;
  age: number | null;
  bust: number | null;
  waist: number | null;
  hip: number | null;
  /** `PP`, `P`, `M`, `G`, `GG`, `XG`. Fonte do `Tamanho {usual_size}` do cartao. */
  usual_size: string | null;
  /** `justo` | `normal` | `folgado`. */
  fit_preference: string | null;
  /** `null` = a cliente ainda nao respondeu (o original so guarda `true`/`false`). */
  practices_activity: boolean | null;
  /** `Ex: 6 meses, 2 anos`. So faz sentido quando `practices_activity`. */
  activity_time: string | null;
  /** `null` = ainda nao respondeu. */
  knows_measurements: boolean | null;
  /** ISO 8601. Alimenta o `Atualizado em`. */
  updated_at: string | null;
}

/**
 * ================== UMA LINHA DO HISTORICO — E POR QUE ELE EXISTE ==================
 *
 * `customer_measurement_history` e o EXTRATO do perfil. O `save()` do original
 * grava DUAS vezes o mesmo payload: um `upsert` em `customer_size_profiles`
 * (o estado atual, uma linha por cliente) e um `insert` em
 * `customer_measurement_history` (o registro daquele momento, muitas linhas).
 *
 * Ou seja: cada salvamento e uma VERSAO. Quando a cliente muda de peso, o
 * perfil muda e o historico guarda o valor antigo. Sem esta tabela, o dado de
 * "quanto ela pesava quando a recomendacao foi feita" sumiria no proximo salvar.
 *
 * A tabela do print (`cli-011`) mostra so QUATRO colunas — Peso, Busto, Cintura
 * e Quadril —, e nao as seis do formulario. O tipo segue o print: e o que a
 * tabela desenha. O `insert` do original grava todas as colunas, mas a TELA le
 * estas quatro, e um tipo com as outras seis seria campo que nenhuma linha usa.
 */
export interface MedidaHistorico {
  id: string;
  /** ISO 8601. O `created_at` do registro. */
  created_at: string;
  weight: number | null;
  bust: number | null;
  waist: number | null;
  hip: number | null;
}

/**
 * Um nivel do clube (`loyalty_tiers`).
 *
 * Tres campos, e nao o minimo: o `nome` e o `cor` sao os dois que o cartao do
 * dashboard imprime, e o `minimoPontos` e a chave de comparacao para descobrir
 * em que nivel a cliente esta. O `cor` e um VALOR DA TABELA — o original le
 * `currentTier.color` e joga direto no `style` —, e nao uma constante do
 * codigo: níveis diferentes tem cores diferentes, e quem decide e o banco.
 */
export interface NivelClube {
  id: string;
  nome: string;
  /** CSS: `hsl(...)` ou `#RRGGBB`. Vem da tabela. */
  cor: string;
  /** Pontos ACUMULADOS necessarios para entrar no nivel. */
  minimoPontos: number;
  /**
   * Os beneficios do nivel, um por linha.
   *
   * A coluna `benefits` e um ARRAY no original (`Array.isArray(currentTier.benefits)`)
   * — o banco guarda `jsonb`. O Dashboard NAO usa este campo (ele so mostra o nome
   * e a cor); quem o desenha e o `Clube VIP & Cashback`, na secao `Seus Benefícios`.
   * Ele fica no tipo compartilhado porque e a mesma entidade `loyalty_tiers`, e
   * partir o tipo em dois por causa de uma tela seria a semente de dois modelos.
   */
  beneficios: string[];
}

/**
 * Uma movimentacao de pontos (`loyalty_points`).
 *
 * ================== O TIPO DECIDE O SINAL, E ISSO E A REGRA DO ORIGINAL ==================
 *
 * O original separa `earn`/`bonus` (entrada) de `adjustment` (que pode ser
 * positiva ou negativa) e do resto (saida). O SALDO soma o que entra e subtrai o
 * que sai; o NIVEL usa so o que entra (`earn`/`bonus`). Sao dois numeros do mesmo
 * extrato — ver `nivelAtual`.
 *
 * O `pontos` guarda o valor ABSOLUTO da movimentacao (o `+`/`-` vem do tipo), e
 * e por isso que `tipo` e obrigatorio no tipo: sem ele nao ha como saber o sinal.
 */
export interface MovimentoPontos {
  id: string;
  /** `earn`/`bonus` entram; `redeem` sai; `adjustment` segue o proprio valor. */
  tipo: 'earn' | 'bonus' | 'redeem' | 'adjustment';
  pontos: number;
  /** `Compra #ff3048c9`. Vazio no original vira `Movimentação` na tela. */
  descricao: string | null;
  /** ISO 8601. A tela escreve `DD/MM/AAAA`. */
  criadoEm: string;
}

/**
 * Uma recompensa resgatavel (`loyalty_config`, chave `rewards`).
 *
 * O original guarda a lista de recompensas como um `jsonb` sob a chave `rewards`
 * de `loyalty_config`, e nao numa tabela propria. O tipo segue o que a TELA le:
 * um `id` (a `key` do React), um `rotulo` e o custo em `pontos`.
 */
export interface RecompensaClube {
  id: string;
  /** `R$ 10 de desconto`. */
  rotulo: string;
  /** Custo em pontos. */
  pontos: number;
}

/**
 * As regras do programa (`loyalty_config`, chave `general_rules`).
 *
 * Os dois numeros que a tela imprime: quantos pontos por indicacao e por
 * avaliacao. Eles vem do BANCO — o original escreve `{config?.rules?.points_for_referral || 100}`
 * —, e por isso estao no dado, e nao fixos no componente. O `|| 100`/`|| 50` do
 * original e o valor de reserva quando a chave falta; aqui o dado ja nasce com os
 * valores do print.
 */
export interface RegrasClube {
  pontosIndicacao: number;
  pontosAvaliacao: number;
}

/**
 * Tudo o que o `Clube VIP & Cashback` mostra, em uma leitura.
 *
 * Como o `ResumoCliente` do Dashboard, este objeto chega JA CALCULADO: o saldo, o
 * acumulado, o nivel atual, o proximo nivel, o progresso e quanto falta. A tela
 * nao faz conta — ela desenha. E o mesmo principio de `metrics.ts` ser o dono da
 * regra: se o progresso fosse calculado no componente, existiriam duas contas
 * para o mesmo numero no dia em que outra tela mostrasse o progresso.
 */
export interface ResumoClube {
  /** O que a cliente pode GASTAR — entradas menos saidas. */
  saldo: number;
  /** O que a cliente JA CONQUISTOU — so as entradas. Decide o nivel. */
  acumulado: number;
  /** O nivel atual, ou `null` quando nao ha niveis ou nenhum cabe. */
  nivel: NivelClube | null;
  /** O proximo nivel, ou `null` no topo da escada. */
  proximoNivel: NivelClube | null;
  /** 0 a 100. A largura da barra de progresso. */
  progressoPct: number;
  /** Quantos pontos faltam para o proximo nivel. `0` no topo. */
  faltamProximo: number;
  extrato: MovimentoPontos[];
  recompensas: RecompensaClube[];
  /** TODOS os niveis, ordenados por `minimoPontos` — a lista lateral. */
  niveis: NivelClube[];
  regras: RegrasClube;
}

/**
 * O que o Dashboard precisa saber, em um objeto so.
 *
 * O Dashboard do print (`cli-001`) nao faz cinco leituras: ele mostra tres
 * numeros, o ultimo pedido e os cupons. Este tipo e o resultado dessas
 * leituras JA COMBINADAS, para a tela nao montar regra de negocio.
 */
export interface ResumoCliente {
  /** `Meus Pedidos` — o total de pedidos da cliente. */
  pedidos: number;
  /** Saldo de cashback a receber, em reais. */
  cashback: number;
  /** Saldo de pontos do clube. */
  pontos: number;
  favoritos: number;
  /** O ultimo pedido, para o cartao "Ultimo pedido". */
  ultimoPedido: PedidoCliente | null;
  /** Cupons validos hoje, para o cartao "Cupons ativos". */
  cuponsAtivos: CupomCliente[];
  /**
   * O nivel VIP atual, ou `null` quando ainda nao ha niveis cadastrados.
   *
   * O `null` NAO e um caso de erro: e o ramo em que o original troca o cartao
   * escuro por um `Stat` de `Afiliada`. O print mostra o ramo COM nivel
   * (`BRONZE`), e este campo e o que permite reproduzir o outro sem inventar
   * uma segunda tela.
   */
  nivel: NivelClube | null;
}

/**
 * ================== O ESTADO DE ACESSO DA CONTA — O QUE A TELA DE SEGURANCA LE ==================
 *
 * A tela `Segurança` mostra DUAS coisas sobre a conta que nao cabem em
 * `ContaCliente`: quando foi o ULTIMO ACESSO, e o que a escrita de senha/`logout`
 * devolve.
 *
 * ================== A SENHA NAO ESTA AQUI, E ISSO E O PONTO ==================
 *
 * Este tipo NAO tem campo de senha, e a ausencia e deliberada. O original le
 * `pw`/`pw2` do FORMULARIO (estado local do React) e os manda para
 * `supabase.auth.updateUser({ password })` — a senha nunca passa por um tipo do
 * dominio, nunca e guardada, e nunca e lida de volta. Reproduzir essa disciplina
 * e o que mantem a senha fora do alcance de qualquer `console.log` futuro: nao
 * existe campo para vazar.
 *
 * ================== A DATA VEM DA CONTA, E NAO DE UM RELOGIO ==================
 *
 * `ultimoAcessoEm` e o `last_sign_in_at` do `auth.users`. `null` quando o
 * provedor nunca registrou um acesso (o original escreve `—` nesse caso) — e
 * tambem o caso da conta de demonstracao, cuja sessao nao passa por login real.
 *
 * O campo e ISO 8601, e nao um texto ja formatado: quem formata e o `metrics`,
 * que e o dono da regra, e o print mostra o formato `DD/MM/AAAA, HH:MM:SS`.
 */
export interface AcessoConta {
  /** ISO 8601. `null` = nenhum acesso registrado (a tela escreve `—`). */
  ultimoAcessoEm: string | null;
}

/**
 * ================== O LADO-A-LADO DO ADMIN — O PERFIL NAO E REDECLARADO ==================
 *
 * A regra do topo deste arquivo ("um conceito que JA EXISTE no admin NAO ganha
 * um tipo novo aqui") foi escrita no modulo 1 e e exatamente o que governa este
 * modulo. O painel admin JA tem o dominio `/admin/afiliadas`, com
 * `lib/afiliadas/types.ts` declarando `Affiliate` — `name`, `email`,
 * `couponCode`, `referralSlug`, `commissionType`, `commissionValue`, `status`.
 *
 * Entao esta tela NAO declara o perfil. Ela IMPORTA `Affiliate` de
 * `@/lib/afiliadas/types` e usa. Uma segunda declaracao de `Affiliate` aqui
 * seria a semente de dois modelos incompativeis para a mesma pessoa: a comissao
 * do admin e a comissao da tela da cliente tem que ser O MESMO NUMERO lido da
 * MESMA coluna quando o Neon entrar. E a mesma decisao de `OrderStatus`, no topo
 * deste arquivo, e de `PedidoCliente` (que estende `Order`, e nao o recopia).
 *
 * ================== O QUE E NOVO, E POR QUE ==================
 *
 * `affiliate_sales` e `affiliate_referrals` sao tabelas que o ADMIN NAO TEM: o
 * painel admin lista perfis, nao vendas. Como nao existe declaracao anterior, a
 * venda e o resumo ganham tipos aqui, como `CupomCliente` e `AcessoConta`.
 *
 * O STATUS DA VENDA (`paga`/`pendente`) NAO VIRA UM ENUM. O original compara
 * `s.status === 'pending'` duas vezes e trata todo o resto como pago — um unico
 * literal. Um enum de duas variantes aqui inventaria uma rigidez que a
 * referencia nao tem, e faria o dado do banco (que pode trazer outro valor)
 * quebrar o typecheck. O texto cru fica no tipo; quem o significa e
 * `vendaPaga()` em `metrics.ts`.
 */

/**
 * Uma venda atribuida a afiliada — uma linha do `Histórico de Vendas`.
 *
 * `commissionAmount` e o campo que o HISTORICO imprime; `totalAmount` fica
 * registrado para a fase do banco, mas nao entra em nenhuma tela hoje. Ele esta
 * aqui porque a venda do admin (quando existir) vai precisar dele, e adiciona-lo
 * depois seria uma migracao de coluna.
 */
export interface VendaAfiliada {
  id: string;
  /** O pedido que gerou a comissao. O historico imprime os 8 primeiros caracteres. */
  orderId: string;
  /** ISO 8601. */
  criadaEm: string;
  /** `'paid'` = paga; qualquer outro valor = pendente. Ver `vendaPaga()`. */
  status: string;
  /** A comissao DESTA venda, em reais. */
  commissionAmount: number;
}

/**
 * O que o painel da afiliada mostra no topo — os QUATRO numeros da grade.
 *
 * ================== OS NUMEROS VEM CALCULADOS, E NAO DA TELA ==================
 *
 * O original conta `referralsCount` (um `head: true` do Supabase), conta
 * `sales.length`, e SOMA a comissao das vendas duas vezes (o total e o pendente).
 * As duas somas sao as unicas contas desta tela. Elas moram em `metrics.ts`, e
 * nao aqui nem na view, pelo mesmo motivo do `Dados da Conta`: a view desenha, e
 * nao calcula.
 *
 * `cliques` e `vendas` vem prontos do `data.ts` (a contagem e do banco); as duas
 * comissoes o `metrics` calcula das vendas. Por isso o resumo tem os quatro
 * campos, e nao apenas os dois que a tela deriva.
 */
export interface ResumoAfiliada {
  cliques: number;
  vendas: number;
  /** Soma da comissao de TODAS as vendas. */
  comissaoTotal: number;
  /** Soma da comissao SO das vendas pendentes. */
  comissaoAReceber: number;
}

/**
 * O conjunto do perfil de afiliada com o seu desempenho.
 *
 * ================== O PERFIL E `null`, E ISSO E UM ESTADO, E NAO UM ERRO ==================
 *
 * A conta dos prints (`lp070087@gmail.com`) NAO e afiliada no material: nenhum
 * print mostra o `Painel de Afiliada` preenchido, e o proprio original
 * (`conta.afiliada.tsx`, linhas 58 a 77) trata a ausencia de perfil como a tela
 * de convite — `Seja uma Afiliada Closet Lunar` + `Quero me cadastrar agora`.
 *
 * Entao `perfil: null` NAO significa "carregando" nem "deu erro": significa "esta
 * conta ainda nao e afiliada", e e o que a demonstracao entrega. `null` e o
 * valor HONESTO, e nao um `Affiliate` de exemplo que faria a tela mostrar uma
 * comissao que ninguem tem.
 */
export interface ContaAfiliada {
  perfil: Affiliate | null;
  vendas: VendaAfiliada[];
  resumo: ResumoAfiliada;
}
