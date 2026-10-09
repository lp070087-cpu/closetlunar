/**
 * Conteudo da apresentacao do sistema.
 *
 * TODOS os textos e numeros vem dos materiais reais do projeto:
 *  - os 7 grupos / 31 itens de navegacao vem de `src/lib/nav.ts`;
 *  - os produtos e precos vem dos prints adm-025 e do catalogo do site;
 *  - os canais e abas vem dos prints de Conteudo do Site e Comunicacao.
 *
 * Nada aqui e numero inventado para "ficar bonito": o pedido proibe encher a
 * apresentacao de dados ficticios. Onde a tela real ainda nao existe, o cartao
 * diz que esta em construcao, em vez de inventar indicador.
 */

import { NAV_GROUPS } from '@/lib/nav';

/** Marca. Grafia unica definida pelo briefing: Closet Lunnar. */
export const MARCA = {
  nome: 'Closet Lunnar',
  assinatura: 'Luxury Admin v2.0',
  promessa: 'Moda fitness feminina com operação de loja grande, sem parecer grande.',
  email: 'lp070087@gmail.com',
} as const;

/**
 * Contagens derivadas da navegacao real, nao digitadas a mao.
 *
 * O nome e `NAV_GRUPO_COUNT`, e nao `NAV_GRUPOS`, de proposito: `NAV_GROUPS`
 * (o array, em `lib/nav.ts`) e `NAV_GRUPO_COUNT` (o numero) coexistem neste
 * modulo, e um nome parecido demais faria uma tela usar a contagem no lugar da
 * lista — erro que o TypeScript so acusa quando alguem chama `.map`.
 */
export const NAV_TOTAL = NAV_GROUPS.reduce((sum, group) => sum + group.items.length, 0);
export const NAV_GRUPO_COUNT = NAV_GROUPS.length;

/** Os 7 grupos, com os itens reais. Usado na secao de navegacao. */
export const GRUPOS_REAIS = NAV_GROUPS.map((group) => ({
  id: group.id,
  label: group.label,
  items: group.items.map((item) => item.label),
}));

/**
 * Numeros do topo.
 *
 * Nenhum deles e estimativa de negocio inventada: os dois primeiros sao
 * contagens derivadas da navegacao real e os dois ultimos sao regras que o
 * sistema cumpre (corte de estoque baixo e ausencia de planilha paralela).
 */
export const NUMEROS = [
  { value: NAV_TOTAL, suffix: '', label: 'Telas no painel', note: 'rotas reais, todas navegáveis' },
  { value: NAV_GRUPO_COUNT, suffix: '', label: 'Áreas de gestão', note: 'da visão geral ao sistema' },
  { value: 1, suffix: '%', label: 'Margem mínima', note: 'alerta automático de estoque' },
  { value: 0, suffix: '', label: 'Planilhas paralelas', note: 'catálogo, vendas e conteúdo juntos' },
] as const;

/** Capacidades, agrupadas pelos grupos reais da sidebar. */
export const CAPACIDADES = [
  {
    id: 'vendas',
    grupo: 'Vendas',
    titulo: 'Do pedido ao repasse',
    resumo:
      'Pedidos, rastreamento, CRM, cupons, campanhas, fidelidade, afiliadas e financeiro — cada etapa com a sua própria tela.',
    itens: [
      'Pedidos com aba de rastreamento',
      'Carrinho abandonado e recuperação',
      'CRM com clientes, leads e segmentos',
      'Financeiro com KPIs, custos e lucro',
    ],
  },
  {
    id: 'catalogo',
    grupo: 'Catálogo',
    titulo: 'Produto cadastrado uma vez',
    resumo:
      'Preço de venda, preço de custo, lucro e margem calculados na hora. Cores com foto e estoque próprios.',
    itens: [
      'Lucro e margem por peça, em tempo real',
      'Variações de cor com fotos próprias',
      'Galeria com imagem principal reordenável',
      'Estoque com histórico de movimentações',
    ],
  },
  {
    id: 'conteudo',
    grupo: 'Conteúdo',
    titulo: 'A vitrine sem programador',
    resumo:
      'Banners, hero, categorias, seções da home, benefícios, Instagram e rodapé editáveis pelo painel.',
    itens: [
      'Banners com vigência e posição',
      'Sete abas de conteúdo do site',
      'Personalização de cores e identidade',
      'Looks e montagem de combinações',
    ],
  },
  {
    id: 'ia',
    grupo: 'Provador e IA',
    titulo: 'A cliente se vê na peça',
    resumo:
      'Avatar virtual, provador virtual e sugestões de look por IA — o diferencial de conversão da loja.',
    itens: [
      'Avatar com medidas e fotos da cliente',
      'Provador com posição ajustável da peça',
      'Looks salvos e analytics de uso',
      'IA que sugere combinações por produto base',
    ],
  },
  {
    id: 'insights',
    grupo: 'Insights',
    titulo: 'Decidir com número, não com achismo',
    resumo:
      'Relatórios de produtos, clientes e categorias, favoritos e busca — tudo com filtro de período.',
    itens: [
      'Relatórios por produto, cliente e categoria',
      'Favoritos para saber o que a cliente quer',
      'Busca com termos reais do catálogo',
    ],
  },
  {
    id: 'comunicacao',
    grupo: 'Comunicação',
    titulo: 'Falar com a cliente no canal dela',
    resumo:
      'WhatsApp com atendimentos, e-mails transacionais e central de atendimento com fila por status.',
    itens: [
      'WhatsApp com histórico de atendimentos',
      'Modelos de e-mail transacionais',
      'Atendimento com filtro por status',
    ],
  },
  {
    id: 'sistema',
    grupo: 'Sistema',
    titulo: 'Configurar, proteger, abrir a loja',
    resumo:
      'Frete próprio e por transportadora, pagamentos, SEO, usuários com papel, backup e o checklist de abertura.',
    itens: [
      'Entrega própria, Melhor Envio e transportadoras',
      'SEO, Google e dados estruturados',
      'Usuários com papel de acesso',
      'Checklist de abertura da loja',
    ],
  },
] as const;

/** Dados que os mockups de tela usam. Saem dos prints, nao da imaginação. */
export const DADOS_TELAS = {
  sidebar: [
    {
      label: 'Visão geral',
      items: [{ label: 'Dashboard', active: false }],
    },
    {
      label: 'Vendas',
      items: [
        { label: 'Pedidos', active: false },
        { label: 'CRM', active: false },
        { label: 'Cupons', active: false },
        { label: 'Financeiro', active: false },
      ],
    },
    {
      label: 'Catálogo',
      items: [
        { label: 'Produtos', active: true },
        { label: 'Estoque', active: false },
        { label: 'Categorias', active: false },
        { label: 'Tamanhos', active: false },
      ],
    },
    {
      label: 'Conteúdo',
      items: [{ label: 'Banners', active: false }, { label: 'Conteúdo do Site', active: false }],
    },
  ],
  produtos: [
    { name: 'top', slug: 'top', hex: '#F0D4D8', price: 'R$ 179,00', cost: 'R$ 90,00', profit: 89, margin: 49.7, stock: 8 },
    { name: 'Macaquinho', slug: 'macaquinho', hex: '#EBD9C8', price: 'R$ 69,99', cost: 'R$ 40,00', profit: 29.99, margin: 42.8, stock: 5 },
    { name: 'Kit Nike', slug: 'kitnike', hex: '#EBD9C8', price: 'R$ 139,90', cost: 'R$ 119,99', profit: 19.91, margin: 14.2, stock: 1 },
    { name: 'Legging Modeladora Premium', slug: 'legging-modeladora-premium', hex: '#F2E7DD', price: 'R$ 129,90', cost: 'R$ 0,00', profit: 129.9, margin: 100, stock: 40 },
    { name: 'Short Fitness Energy', slug: 'short-energy-fit', hex: '#F0D4D8', price: 'R$ 79,90', cost: 'R$ 0,00', profit: 79.9, margin: 100, stock: 30 },
    { name: 'Top Essential Sustentação', slug: 'top-essential-sustentacao', hex: '#D8E2EA', price: 'R$ 89,90', cost: 'R$ 0,00', profit: 89.9, margin: 100, stock: 35 },
  ],
  kpis: [
    { label: 'Total de produtos', value: '10', hint: '' },
    { label: 'Pedidos hoje', value: '0', hint: 'desde 00:00' },
    { label: 'Receita do mês', value: 'R$ 0,00', hint: '' },
    { label: 'Lucro estimado', value: 'R$ 0,00', hint: 'margem média 35%' },
    { label: 'Leads captados', value: '0', hint: '' },
    { label: 'Estoque baixo', value: '2', hint: '≤ 5 unidades' },
    { label: 'Ticket médio', value: 'R$ 0,00', hint: '' },
    { label: 'Carrinhos recuperados', value: '0', hint: '' },
  ],
  maisVendidos: [
    { name: 'top', qty: 1, revenue: 'R$ 179,00' },
    { name: 'Jaqueta Corta Vento Fit', qty: 1, revenue: 'R$ 179,90' },
    { name: 'Legging Modeladora Premium', qty: 1, revenue: 'R$ 129,90' },
    { name: 'Top Essential Sustentação', qty: 1, revenue: 'R$ 89,90' },
  ],
  estoqueBaixo: [
    { name: 'Kit Nike', stock: 1 },
    { name: 'Macaquinho', stock: 5 },
  ],
  pedidos: [
    { code: '#ff3048c9', status: 'Aguardando postagem', customer: 'Mariana', items: 3, date: '16/06/2026, 14:56:54', total: 'R$ 506,95', carrier: 'Correios' },
    { code: '#41b60ae2', status: 'Aguardando postagem', customer: 'carinna', items: 1, date: '16/06/2026, 14:45:30', total: 'R$ 187,76', carrier: 'Correios' },
    { code: '#7c1e93aa', status: 'Novo', customer: 'lucas', items: 1, date: '15/06/2026, 13:43:16', total: 'R$ 186,00', carrier: 'Correios' },
  ],
  abasConteudo: ['Hero', 'Categorias', 'Seções da Home', 'Banners', 'Benefícios', 'Instagram', 'Rodapé'],
  banners: [
    { title: 'Coleção Verão', placement: 'Topo da home', hex: '#F0D4D8' },
    { title: 'Conjuntos até 30% off', placement: 'Meio da home', hex: '#EBD9C8' },
    { title: 'Novidades da semana', placement: 'Rodapé da home', hex: '#DCE8DE' },
  ],
  canais: [
    { name: 'WhatsApp', on: true },
    { name: 'E-mail transacional', on: true },
    { name: 'Instagram', on: true },
    { name: 'Chat no site', on: false },
  ],
} as const;

/**
 * Os cinco campos de `VALORES` do modal de cadastro (adm-026), na ordem exata.
 *
 * `tom` marca as duas cores que o print usa para chamar atencao: o custo em
 * vermelho (e dinheiro que sai) e o desconto em ambar (e dinheiro que deixa de
 * entrar). O valor de cada um e calculado no componente, nao digitado.
 */
export const VALORES_PRODUTO = [
  { label: 'Preço de Venda', hint: 'Valor que a cliente paga', tom: 'neutro' },
  { label: 'Preço de Custo', hint: 'Valor que você pagou', tom: 'custo' },
  { label: 'Desconto %', hint: 'Atualiza promo', tom: 'desconto' },
  { label: 'Promocional', hint: 'Opcional', tom: 'neutro' },
  { label: 'Riscado (antigo)', hint: 'Para preço riscado', tom: 'neutro' },
] as const;

/**
 * Variacoes de cor do produto. O print adm-027 mostra o aviso de que cada cor
 * tem fotos e estoque proprios; estes sao os tons ja usados na vitrine, para o
 * exemplo nao introduzir cor que a loja nao tem.
 */
export const CORES_PRODUTO = [
  { nome: 'Preto', hex: '#1A1A1A', estoque: 12, principal: true },
  { nome: 'Nude', hex: '#E4C4B0', estoque: 6, principal: false },
  { nome: 'Verde Água', hex: '#A8C8BC', estoque: 3, principal: false },
  { nome: 'Rosé', hex: '#D9A5A5', estoque: 9, principal: false },
] as const;

/** Tamanhos que o formulario oferece, na ordem do print. */
export const TAMANHOS_PRODUTO = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;

/**
 * Organizacao e seguranca.
 *
 * Cada linha descreve algo que ja existe no codigo, nao um plano: os papeis
 * estao em `src/lib/nav.ts`, a casca de servidor em `src/app/admin/layout.tsx`
 * e o contrato de dados em `src/lib/produtos/types.ts`.
 */
export const SEGURANCA = [
  {
    titulo: 'Papel de acesso por item',
    texto:
      'Cada item do painel declara quais papéis o enxergam — SUPER_ADMIN, ADMIN, EDITOR e ATENDIMENTO. O que o papel não pode ver não aparece na navegação, em vez de aparecer e ser negado depois.',
  },
  {
    titulo: 'Sessão resolvida no servidor',
    texto:
      'A casca do painel já é um Server Component: o cookie da sessão será lido no servidor e o usuário chega pronto no cliente. Nenhum segredo trafega para o navegador.',
  },
  {
    titulo: 'Uma fonte de verdade por dado',
    texto:
      'Lucro, margem, desconto e estoque total têm um único dono. A mesma função alimenta a listagem, o formulário e o dashboard — não existem dois lugares calculando o mesmo número.',
  },
  {
    titulo: 'Contratos prontos para o banco',
    texto:
      'Os tipos de produto, categoria e rascunho de edição já estão definidos como contrato. Conectar o banco passa a ser preencher a função de leitura, não reescrever a tela.',
  },
] as const;

/** Blocos da secao de responsividade, com o comportamento real do painel. */
export const RESPONSIVIDADE = [
  {
    tela: 'Desktop e notebook',
    detalhe: 'Sidebar fixa de 256px, tabela com as sete colunas e conteúdo até 1600px.',
  },
  {
    tela: 'Tablet',
    detalhe: 'Sidebar recolhe para gaveta e as grades passam de quatro para duas colunas.',
  },
  {
    tela: 'Android e iPhone',
    detalhe:
      'Cada produto vira cartão com venda, custo, lucro, margem, estoque e as duas ações — nada é escondido.',
  },
] as const;
