import {
  ClipboardCheck,
  FileText,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Package,
  Palette,
  Phone,
  Ruler,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tags,
  Ticket,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/**
 * Inventario OFICIAL de navegacao do painel administrativo.
 *
 * Esta lista reproduz, na ordem exata e com os rotulos exatos, a navegacao do
 * painel original: 7 grupos e 31 itens. Nao reordenar, nao renomear, nao
 * remover itens. Os icones tambem seguem o original (lucide-react).
 */

export type AdminGroupId =
  | 'visao-geral'
  | 'vendas'
  | 'catalogo'
  | 'conteudo'
  | 'insights'
  | 'comunicacao'
  | 'sistema';

export interface AdminNavItem {
  /** Rota dentro de /admin. '' = raiz (dashboard). */
  slug: string;
  label: string;
  icon: LucideIcon;
  /** Papeis que enxergam o item. Ausente = todos. */
  roles?: AdminRole[];
  /** Texto de apoio da tela. Vem das referencias. */
  description?: string;
}

export interface AdminNavGroup {
  id: AdminGroupId;
  label: string;
  items: AdminNavItem[];
}

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'ATENDIMENTO';

export const NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'visao-geral',
    label: 'Visão geral',
    items: [
      {
        slug: '',
        label: 'Dashboard',
        icon: LayoutDashboard,
        description: 'Bem-vinda de volta ao centro de comando da Closet Lunna.',
      },
    ],
  },
  {
    id: 'vendas',
    label: 'Vendas',
    items: [
      {
        slug: 'pedidos',
        label: 'Pedidos',
        icon: ShoppingBag,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ATENDIMENTO'],
        description: 'Acompanhe, separe e despache os pedidos da loja.',
      },
      {
        slug: 'carrinho-abandonado',
        label: 'Carrinho Abandonado',
        icon: ShoppingCart,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Recupere vendas interrompidas antes do pagamento.',
      },
      {
        slug: 'crm',
        label: 'CRM',
        icon: Users,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ATENDIMENTO'],
        description: 'Gerencie o relacionamento com sua base de clientes e leads.',
      },
      {
        slug: 'cupons',
        label: 'Cupons',
        icon: Ticket,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Crie códigos promocionais para impulsionar suas vendas.',
      },
      {
        slug: 'campanhas',
        label: 'Campanhas',
        icon: Sparkles,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Gerencie promoções automáticas, frete grátis e banners promocionais.',
      },
      {
        slug: 'fidelidade',
        label: 'Fidelidade',
        icon: Trophy,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Configure o clube de pontos e acompanhe os resgates.',
      },
      {
        slug: 'afiliadas',
        label: 'Afiliadas',
        icon: Users,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Acompanhe quem divulga a loja e quanto cada uma converteu.',
      },
      {
        slug: 'financeiro',
        label: 'Financeiro',
        icon: Wallet,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Entradas, custos, lucro e conciliação de recebimentos.',
      },
    ],
  },
  {
    id: 'catalogo',
    label: 'Catálogo',
    items: [
      {
        slug: 'produtos',
        label: 'Produtos',
        icon: Package,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Gerencie produtos, variações, preços e imagens.',
      },
      {
        slug: 'estoque',
        label: 'Estoque',
        icon: ShoppingCart,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Quantidades por tamanho e movimentações de entrada e saída.',
      },
      {
        slug: 'categorias',
        label: 'Categorias',
        icon: Tags,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Organize as categorias exibidas na loja.',
      },
      {
        slug: 'tamanhos',
        label: 'Tamanhos',
        icon: Ruler,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Tabela de medidas e regras de tamanho por produto.',
      },
      {
        slug: 'avatar-virtual',
        label: 'Avatar Virtual',
        icon: UserPlus,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Configure o avatar usado no provador virtual.',
      },
      {
        slug: 'provador-virtual',
        label: 'Provador Virtual',
        icon: Sparkles,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Camadas, encaixes e calibragem da prova virtual.',
      },
      {
        slug: 'ia-looks',
        label: 'IA de Looks',
        icon: Sparkles,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Combinações sugeridas automaticamente para a cliente.',
      },
    ],
  },
  {
    id: 'conteudo',
    label: 'Conteúdo',
    items: [
      {
        slug: 'banners',
        label: 'Banners',
        icon: ImageIcon,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Imagens de destaque da home e das categorias.',
      },
      {
        slug: 'conteudo-do-site',
        label: 'Conteúdo do Site',
        icon: FileText,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Textos e seções editáveis da loja online.',
      },
      {
        slug: 'personalizar-loja',
        label: 'Personalizar Loja',
        icon: Palette,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Tema, cores e identidade visual da loja.',
      },
      {
        slug: 'looks',
        label: 'Looks',
        icon: Sparkles,
        roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
        description: 'Monte e publique combinações de peças.',
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      {
        slug: 'relatorios',
        label: 'Relatórios',
        icon: FileText,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Desempenho de vendas, clientes e categorias.',
      },
      {
        slug: 'favoritos',
        label: 'Favoritos',
        icon: Heart,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'As peças que as clientes mais salvaram.',
      },
      {
        slug: 'busca',
        label: 'Busca',
        icon: Search,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'O que as clientes procuram e não encontram.',
      },
    ],
  },
  {
    id: 'comunicacao',
    label: 'Comunicação',
    items: [
      {
        slug: 'whatsapp',
        label: 'WhatsApp',
        icon: MessageCircle,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Atendimentos e mensagens automáticas no WhatsApp.',
      },
      {
        slug: 'emails',
        label: 'E-mails',
        icon: Mail,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Modelos de e-mail transacional da loja.',
      },
      {
        slug: 'atendimento',
        label: 'Atendimento',
        icon: Phone,
        roles: ['SUPER_ADMIN', 'ADMIN', 'ATENDIMENTO'],
        description: 'Fila de atendimentos abertos e finalizados.',
      },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    items: [
      {
        slug: 'configuracoes',
        label: 'Configurações',
        icon: Settings,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Entrega, transportadoras e formas de pagamento.',
      },
      {
        slug: 'seo',
        label: 'SEO & Google',
        icon: Search,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Indexação, pixels e dados estruturados.',
      },
      {
        slug: 'usuarios',
        label: 'Usuários / Admins',
        icon: ShieldCheck,
        roles: ['SUPER_ADMIN'],
        description: 'Quem acessa o painel e com qual permissão.',
      },
      {
        slug: 'seguranca',
        label: 'Segurança & Backup',
        icon: ShieldCheck,
        roles: ['SUPER_ADMIN'],
        description: 'Sessões, backups e histórico de acesso.',
      },
      {
        slug: 'abrir-loja',
        label: 'Abrir Loja',
        icon: ClipboardCheck,
        roles: ['SUPER_ADMIN', 'ADMIN'],
        description: 'Checklist final antes de abrir a loja ao público.',
      },
    ],
  },
];

/** Lista plana de todos os itens, na ordem em que aparecem na sidebar. */
export const NAV_ITEMS: AdminNavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Rota completa de um item do painel. */
export function adminHref(slug: string): string {
  return slug ? `/admin/${slug}` : '/admin';
}

/** Item correspondente a uma rota do App Router (ex.: ['admin','crm']). */
export function findNavItemBySegments(segments: string[] | undefined): AdminNavItem | undefined {
  const rest = (segments ?? []).filter(Boolean);
  if (rest[0] !== 'admin') return undefined;
  const slug = rest.slice(1).join('/');
  return NAV_ITEMS.find((item) => item.slug === slug);
}

/** Filtra os grupos pelos papeis do usuario logado. */
export function visibleGroups(roles: AdminRole[] | undefined): AdminNavGroup[] {
  if (!roles || roles.length === 0) return [];
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.some((role) => roles.includes(role))),
  })).filter((group) => group.items.length > 0);
}

/** Rotulo legivel do papel, como aparece na pill do topbar. */
export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  ATENDIMENTO: 'ATENDIMENTO',
};
