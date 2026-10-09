/**
 * Tipos do dominio de CRM.
 *
 * DESENHADOS A PARTIR DE adm-005, adm-010 e adm-011 — e nao de um CRM.
 *
 * A TELA TEM TRES ABAS, E AS TRES SAO LISTAS. Nao ha funil, nao ha Kanban, nao
 * ha lead scoring, nao ha tarefa, nao ha automacao. Nenhum dos tres prints
 * mostra qualquer uma dessas coisas, entao nenhuma delas tem tipo aqui.
 *
 * O QUE CADA PRINT SUSTENTA
 *
 *   adm-005  aba `Clientes`    tabela de seis colunas
 *            CLIENTE · LOCALIZACAO · PEDIDOS · TOTAL INVESTIDO ·
 *            ULTIMA COMPRA · ACOES
 *
 *   adm-010  aba `Leads`       tabela de cinco colunas
 *            NOME / IDENTIFICACAO · CONTATO · ORIGEM · DATA · ACOES
 *
 *   adm-011  aba `Segmentos`   oito cards, sem tabela
 *
 * UM CLIENTE NAO E UMA PESSOA CADASTRADA. No original, a lista de clientes e
 * DERIVADA dos pedidos: agrupa `orders` por e-mail (ou telefone, ou nome) e
 * conta quantos pedidos cada chave tem e quanto somou. Nao existe tabela
 * `customers` em lugar nenhum do material. Por isso `CrmCustomer` guarda o que
 * essa derivacao produz — e nao um cadastro.
 *
 * ISSO IMPORTA PARA A RELACAO COM PEDIDOS. Pedidos ja tem `OrderCustomer`
 * (nome, telefone, e-mail) dentro de cada pedido. O CRM nao copia nem altera
 * aquilo: ele AGREGA. A agregacao mora em `data.ts`, que e o unico arquivo que
 * olha para os pedidos — ver a nota de unificacao futura la. Nenhuma tela de
 * Pedidos foi tocada para isso.
 */

/** As tres abas, na ordem do original e dos prints. */
export type CrmTab = 'clientes' | 'leads' | 'segmentos';

/**
 * Uma linha da tabela de Clientes (adm-005).
 *
 * `location` e uma STRING JA MONTADA, e nao `{city, state}`. O print mostra
 * `Rio de Janeiro - RJ` numa celula so, e o original monta exatamente esse
 * texto. Guardar as partes separadas convidaria a tela a inventar um formato
 * proprio — e nos CINCO pedidos reais que alimentam esta linha Cidade e Estado
 * estao VAZIOS (a divergencia entre adm-005 e adm-011 esta documentada em
 * `lib/pedidos/demo.ts`), entao o caso comum e a celula ficar vazia.
 */
export interface CrmCustomer {
  /** Chave da agregacao: e-mail, ou telefone, ou nome — o primeiro que existir. */
  key: string;
  name: string;
  /** `null` = a coluna CLIENTE mostra so o nome, sem a segunda linha. */
  email: string | null;
  /**
   * O telefone da chave.
   *
   * NAO APARECE NA TELA — a coluna CLIENTE mostra nome e e-mail, e o print nao
   * tem campo de telefone. Ele existe porque a BUSCA usa: o campo anuncia
   * "Buscar por nome, e-mail ou telefone...", e o original filtra pelos tres
   * (`name | email | phone`). Guardar so o que se desenha deixaria a busca
   * prometendo um campo que ela nao alcanca.
   */
  phone: string | null;
  /** Texto da coluna LOCALIZACAO, ja formatado pelo original (`cidade - UF`). */
  location: string;
  /** Quantidade de pedidos daquela chave. */
  orders: number;
  /** Soma dos totais dos pedidos. E a coluna TOTAL INVESTIDO. */
  totalSpent: number;
  /** ISO 8601 do pedido mais recente. A coluna mostra so a data. */
  lastOrderAt: string;
}

/**
 * Origem de um lead.
 *
 * DOIS VALORES, E SO DOIS, porque sao os dois que o material tem:
 *
 *   `carrinho_abandonado` — o original MONTA esse lead a partir de
 *     `abandoned_carts` (e o que o print adm-010 mostra, com esse mesmo texto
 *     em caixa alta);
 *   `formulario` — a tabela `leads` do original, para quem se cadastrou sem
 *     comprar.
 *
 * O print so exibe o primeiro. O segundo existe na fonte e entra na uniao com
 * poucos registros de demonstracao — sem ele, o filtro de uma origem unica nao
 * teria o que filtrar e a aba seria uma prova de nada.
 */
export type LeadSource = 'carrinho_abandonado' | 'formulario';

/**
 * Uma linha da tabela de Leads (adm-010).
 *
 * As colunas sao as do print. `email` e `whatsapp` sao SEPARADOS porque a coluna
 * CONTATO desenha os dois em linhas distintas — e o original usa cada um para uma
 * acao diferente na coluna ACOES (e-mail abre `mailto:`, WhatsApp abre conversa).
 */
export interface CrmLead {
  id: string;
  /** Texto da coluna NOME / IDENTIFICACAO. */
  name: string;
  email: string | null;
  whatsapp: string | null;
  source: LeadSource;
  /** ISO 8601. A coluna DATA mostra data E hora. */
  createdAt: string;
}

/**
 * Os oito segmentos de adm-011.
 *
 * `key` e um identificador estavel para a tela e para a bancada; `label` e o
 * texto em caixa alta do print, copiado literalmente, INCLUSIVE a barra:
 * `RECIFE / OLINDA / JABOATAO` e UM segmento so, com tres cidades somadas — e
 * nao tres.
 */
export type SegmentKey =
  | 'novas'
  | 'recorrentes'
  | 'vip'
  | 'inativas'
  | 'carrinho_abandonado'
  | 'wishlist'
  | 'provador'
  | 'regiao';

/**
 * Um dos oito cards de Segmentos.
 *
 * `value` e o NUMERO DERIVADO — ver `metrics.ts`. Nao ha constante com os
 * valores do print em `demo.ts`: se houvesse, a bancada so estaria conferindo a
 * constante contra ela mesma, que e exatamente o teste artificial que nao vale
 * nada. Os numeros de adm-011 sao usados como ORACULO na bancada, aplicados
 * sobre os dados, e nao como dado.
 */
export interface CrmSegment {
  key: SegmentKey;
  /** Texto do card, em caixa alta, igual ao print. */
  label: string;
  /** Nome do icone lucide, resolvido na tela — mantem `metrics.ts` sem React. */
  iconName: SegmentIconName;
  /** Paleta do quadrado do icone. */
  tone: SegmentTone;
  value: number;
}

/** Os oito icones de adm-011, um por segmento. */
export type SegmentIconName =
  | 'user-plus'
  | 'clock'
  | 'trophy'
  | 'user'
  | 'shopping-cart'
  | 'heart'
  | 'sparkles'
  | 'map-pin';

/**
 * As oito cores dos quadrados de adm-011.
 *
 * O print usa a paleta nomeada do Tailwind (azul, roxo, amarelo, cinza, laranja,
 * rosa, ciano, verde), em `100/600` — e nao os tokens de superficie do design
 * system, que sao bege/ambar/rosa. Sao cores proprias DESTA tela e ficam aqui em
 * vez de virar token global: mudar `globals.css` por causa de um print que so o
 * CRM usa mexeria em modulos ja validados.
 */
export type SegmentTone =
  | 'blue'
  | 'purple'
  | 'amber'
  | 'gray'
  | 'orange'
  | 'pink'
  | 'cyan'
  | 'green';

/**
 * O que a tela recebe pronto de `data.ts`.
 *
 * As tres leituras vao juntas porque a tela desenha as tres abas e a contagem de
 * clientes alimenta os segmentos: separar em tres chamadas faria a mesma
 * agregacao rodar duas vezes.
 */
export interface CrmDataset {
  customers: CrmCustomer[];
  leads: CrmLead[];
  segments: CrmSegment[];
  /**
   * A quantidade de carrinhos abandonados COM e-mail.
   *
   * Guardada separada porque alimenta DOIS lugares com significados diferentes:
   * o segmento `Carrinho Abandonado` (que conta carrinhos) e os leads de origem
   * `carrinho_abandonado` (que sao pessoas). Sao o mesmo numero hoje, mas sao
   * perguntas diferentes — e o dia em que um carrinho sem e-mail aparecer, so
   * uma delas muda.
   */
  abandonedCartsWithEmail: number;
}
