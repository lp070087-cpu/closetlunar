/**
 * Dados de demonstracao do painel.
 *
 * IMPORTANTE: nada aqui e dado real de producao. Sao os valores que aparecem
 * nos prints de referencia, mantidos para que a fundacao ja abra com o painel
 * preenchido e seja possivel conferir fidelidade visual tela a tela.
 * Toda leitura passa por `src/lib/db.ts`; quando o banco (Neon) estiver
 * conectado, basta trocar a origem la, sem mexer nas telas.
 */

export const DEMO_ADMIN = {
  email: 'lp070087@gmail.com',
  name: 'Closet Lunna',
  role: 'SUPER_ADMIN' as const,
};

/** KPIs do dashboard, exatamente como aparecem na referencia. */
export const DEMO_DASHBOARD_STATS = {
  products: 10,
  ordersToday: 0,
  leads: 0,
  revenueMonth: 0,
  profitMonth: 0,
  profitMargin: 35,
  lowStock: 2,
} as const;

export interface DemoLowStock {
  name: string;
  stock: number;
}

/**
 * Produtos com estoque baixo no dashboard.
 *
 * Declarado como lista tipada (e nao como tupla `as const`) de proposito: uma
 * tupla com `as const` fixa o `.length` no tipo literal, o que faria a checagem
 * de lista vazia no dashboard nunca compilar.
 */
export const DEMO_LOW_STOCK: DemoLowStock[] = [
  { name: 'Kit Nike', stock: 1 },
  { name: 'Macaquinho', stock: 5 },
];

/**
 * ============================== CORRIGIDO ==============================
 *
 * Este bloco foi corrigido na Fase 6 (Pedidos), e as duas correcoes abaixo sao
 * de DADO, nao de estilo. Ele nao e consumido por nenhuma tela — quem le os
 * pedidos de verdade e `lib/pedidos/demo.ts` —, mas ficava aqui como semente
 * ERRADA, e a proxima pessoa a reusar `DEMO_ORDERS` ia espalhar o defeito.
 *
 * (1) `status` E `shippingStatus` SÃO DOIS CAMPOS. O bloco antigo gravava
 *     `status: 'Aguardando postagem'` em dois pedidos — ou seja, o texto do
 *     campo ERRADO. O print adm-003 mostra o mesmo cartao dizendo, a duas
 *     linhas de distancia:
 *
 *        Transp.: Correios  Status: Aguardando postagem     <- shippingStatus
 *                                         R$ 506,95 • novo  <- status
 *
 *     Um `status` unico obrigaria a tela a adivinhar qual dos dois textos
 *     desenhar no canto direito, e o `• novo` do print nao teria de onde sair.
 *     Separado agora em `status` (o pedido) e `shippingStatus` (a postagem).
 *
 * (2) `'novo'` e o valor REAL de `status` — nao um texto solto em portugues.
 *     O bloco antigo misturava os dois vocabularios na mesma coluna: dois
 *     pedidos com `'Aguardando postagem'` e tres com `'novo'`. Ver
 *     `OrderStatus` em `lib/pedidos/types.ts` para o porque de o codigo ser a
 *     fonte e o rotulo ser a traducao.
 *
 * A divergencia de ROTULO (`novo` = "Novo" no painel, "Aguardando pagamento" na
 * area da cliente) continua ABERTA e registrada — ver `ORDER_STATUS_LABELS`.
 * O que foi corrigido aqui e a mistura de campos, que nao era divergencia entre
 * referencias: era erro de transcricao.
 * ======================================================================
 */
export interface DemoOrder {
  code: string;
  customer: string;
  phone: string;
  placedAt: string;
  total: number;
  /** Estado do PEDIDO. Ver `OrderStatus` em `lib/pedidos/types.ts`. */
  status: 'novo' | 'pago' | 'separacao' | 'enviado' | 'entregue' | 'cancelado';
  carrier: string;
  /** Estado da POSTAGEM — o `Status: Aguardando postagem` do cartao. */
  shippingStatus: string | null;
  tracking: string | null;
  items: { name: string; variant: string; price: number }[];
}

export const DEMO_ORDERS: DemoOrder[] = [
  {
    code: '#ff3048c9',
    customer: 'Mariana',
    phone: '81994608572',
    placedAt: '2026-06-16T14:56:54',
    total: 506.95,
    status: 'novo',
    carrier: 'Correios',
    shippingStatus: 'Aguardando postagem',
    tracking: null,
    // Sem itens, como o print. Ver a nota (2) em `lib/pedidos/demo.ts`.
    items: [],
  },
  {
    code: '#41b60ae2',
    customer: 'carinna',
    phone: '81985930411',
    placedAt: '2026-06-16T14:45:30',
    total: 187.76,
    status: 'novo',
    carrier: 'Correios',
    shippingStatus: 'Aguardando postagem',
    tracking: null,
    items: [{ name: 'Jaqueta Corta Vento Fit', variant: 'M / Preto', price: 179.9 }],
  },
  {
    code: '#7c1e93aa',
    customer: 'lucas',
    phone: '81985930411',
    placedAt: '2026-06-15T13:43:16',
    total: 186,
    status: 'novo',
    carrier: '',
    // Sem postagem: o cartao nao mostra a linha `Transp./Status`. Ver a nota (4).
    shippingStatus: null,
    tracking: null,
    items: [{ name: 'top', variant: 'M / Único', price: 179 }],
  },
  {
    code: '#9a02f5d1',
    customer: 'lucas',
    phone: '81985930411',
    placedAt: '2026-06-15T13:43:12',
    total: 186,
    status: 'novo',
    carrier: '',
    shippingStatus: null,
    tracking: null,
    items: [{ name: 'top', variant: 'M / Único', price: 179 }],
  },
  {
    code: '#3de811b4',
    customer: 'lucas',
    phone: '81985930411',
    placedAt: '2026-06-15T13:43:06',
    total: 186,
    status: 'novo',
    carrier: '',
    shippingStatus: null,
    tracking: null,
    items: [{ name: 'top', variant: 'M / Único', price: 179 }],
  },
];

export interface DemoCustomer {
  name: string;
  email: string;
  location: string;
  orders: number;
  totalSpent: number;
  lastPurchase: string;
}

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  {
    name: 'Mariana',
    email: 'lp070087@gmail.com',
    location: 'Rio de Janeiro - RJ',
    orders: 5,
    totalSpent: 1252.71,
    lastPurchase: '2026-06-16',
  },
];

export interface DemoProduct {
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { name: 'top', category: 'Tops', price: 179, stock: 10, active: true },
  { name: 'Top Essential Sustentação', category: 'Tops', price: 89.9, stock: 8, active: true },
  { name: 'Conjunto Glow Nude', category: 'Conjuntos', price: 209.9, stock: 6, active: true },
  { name: 'Kit Nike', category: 'Conjuntos', price: 139.9, stock: 1, active: true },
  { name: 'Jaqueta Corta Vento Fit', category: 'Streetwear', price: 179.9, stock: 4, active: true },
  { name: 'Legging Modeladora Premium', category: 'Leggings', price: 129.9, stock: 12, active: true },
  { name: 'Macaquinho', category: 'Macaquinhos', price: 149.9, stock: 5, active: true },
  { name: 'Short Saia Fitness', category: 'Shorts', price: 99.9, stock: 9, active: true },
];

export const DEMO_CATEGORIES = [
  'Conjuntos',
  'Leggings',
  'Tops',
  'Shorts',
  'Streetwear',
  'Macaquinhos',
] as const;

/** Tamanhos da loja, na ordem em que aparecem nos prints. */
export const DEMO_SIZES = ['PP', 'P', 'M', 'G', 'GG'] as const;

/** Formatos de entrega previstos no painel. */
export const SHIPPING_PROVIDERS = [
  { value: 'melhor_envio', label: 'Melhor Envio', available: true },
  { value: 'correios', label: 'Correios', available: false },
  { value: 'jadlog', label: 'Jadlog', available: false },
  { value: 'azul_cargo', label: 'Azul Cargo', available: false },
  { value: 'loggi', label: 'Loggi', available: false },
  { value: 'total_express', label: 'Total Express', available: false },
] as const;

/** Tipos de peca usados no cadastro de produto. */
export const PRODUCT_KINDS = [
  { value: 'top', label: 'Top' },
  { value: 'cropped', label: 'Cropped' },
  { value: 'short', label: 'Short' },
  { value: 'legging', label: 'Legging' },
  { value: 'conjunto', label: 'Conjunto' },
  { value: 'macaquinho', label: 'Macaquinho' },
] as const;
