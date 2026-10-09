import {
  Heart,
  LayoutDashboard,
  MapPin,
  Package,
  Ruler,
  Shield,
  Sparkles,
  Ticket,
  Trophy,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * Inventario de navegacao do PAINEL DO CLIENTE.
 *
 * A lista reproduz, na ordem exata e com os rotulos exatos, a sidebar dos
 * prints `cli-001` e `cli-019` — que sao a MESMA sidebar em dois estados. Sao
 * nove itens e um botao de saida, e nada mais.
 *
 * ================== DE ONDE VEM CADA ITEM ==================
 *
 * A coluna da esquerda do print tem esta sequencia, de cima para baixo:
 *
 *   Dashboard · Meus Pedidos · Meus Favoritos · Endereços · Minhas Medidas ·
 *   Clube VIP & Cashback · Cupons · Dados da Conta · Segurança
 *
 * Os icones tambem sao os do material. O original
 * (`components/site/account/AccountLayout.tsx`) declara exatamente esses nove,
 * nessa ordem, com estes tres que o olho erraria:
 *
 *   `Clube VIP & Cashback` usa `Trophy`, e NAO `Gem`;
 *   `Dados da Conta` usa `UserCog`, e NAO `User`;
 *   `Segurança` usa `Shield`, e NAO `Lock`.
 *
 * ================== O QUE NAO ENTRA AQUI, E POR QUE ==================
 *
 * `conta.looks.tsx` EXISTE no projeto original, mas **nenhum print tem o item
 * `Looks`** na sidebar e **nenhum print mostra a tela**. Nove itens sao o que o
 * material prova. Acrescentar um decimo porque o original tem o arquivo seria
 * inventar interface a partir de um arquivo, e nao de uma referencia — ver
 * `MAPA-CLIENTE.md`.
 *
 * `Afiliada` NAO aparece como item nesta lista porque **nao e item de sidebar**:
 * no print ele e um dos OITO ATALHOS do corpo do dashboard (`cli-001`), uma
 * grade de cartoes — e nao uma linha da coluna. A rota existe e e alcancavel
 * por esse atalho. Misturar as duas coisas poria `Afiliada` na coluna, que e
 * onde o print NAO a tem.
 *
 * `Sair da conta` tambem nao e item: e um `<button>` (acao), e por isso mora
 * fora de `NAV_ITEMS`, em `SIGN_OUT_LABEL`.
 */

/** Uma rota da area da cliente. `''` = a raiz (`/conta`). */
export interface ClientNavItem {
  /** Trecho depois de `/conta`. `''` = a raiz. */
  slug: string;
  label: string;
  icon: LucideIcon;
  /** Texto de apoio da tela, quando a referencia o da. */
  description?: string;
}

/**
 * Os nove itens, na ordem do print.
 *
 * O `description` so existe onde a referencia escreve uma: e a segunda linha
 * serifada que aparece ABAIXO do titulo, dentro do painel de conteudo
 * (`Gerencie suas informacoes pessoais de contato e acesso.`, em `cli-017`).
 * Ele NAO e o `description` do Admin — ver a nota em `client-page-header.tsx`.
 * Onde o print nao tem essa linha, o campo fica ausente e a tela nao a escreve.
 */
export const NAV_ITEMS: ClientNavItem[] = [
  { slug: '', label: 'Dashboard', icon: LayoutDashboard },
  { slug: 'pedidos', label: 'Meus Pedidos', icon: Package },
  { slug: 'favoritos', label: 'Meus Favoritos', icon: Heart },
  { slug: 'enderecos', label: 'Endereços', icon: MapPin },
  { slug: 'medidas', label: 'Minhas Medidas', icon: Ruler },
  { slug: 'pontos', label: 'Clube VIP & Cashback', icon: Trophy },
  { slug: 'cupons', label: 'Cupons', icon: Ticket },
  {
    slug: 'dados',
    label: 'Dados da Conta',
    icon: UserCog,
    description: 'Gerencie suas informações pessoais de contato e acesso.',
  },
  {
    slug: 'seguranca',
    label: 'Segurança',
    icon: Shield,
    description: 'Proteja sua conta e gerencie suas sessões ativas.',
  },
];

/**
 * O rotulo do botao de saida.
 *
 * Fica separado dos itens porque ele NAO e uma rota: no print ele tem cor
 * propria (rosa) e uma linha divisoria acima, e no original
 * (`AccountLayout.tsx`) e um `onClick={() => signOut()}` — um botao, e nao um
 * `<Link>`. Trata-lo como item faria a casca desenhar um link morto.
 */
export const SIGN_OUT_LABEL = 'Sair da conta';

/**
 * ================== OS ATALHOS DO DASHBOARD — OUTRA LISTA, E OUTRA COISA ==================
 *
 * Sao os OITO cartoes do corpo do `cli-001`, e eles NAO sao a sidebar. A
 * diferenca importa em dois pontos:
 *
 * 1. **`Afiliada` so existe AQUI.** O print `cli-001` mostra `Afiliada` como
 *    atalho, e a sidebar do `cli-019` NAO tem esse item. E por isso que a rota
 *    `/conta/afiliada` do original e alcancavel nesta fase: por este cartao.
 *    Se a lista fosse uma so, `Afiliada` apareceria na coluna — onde o print
 *    nao a tem.
 *
 * 2. **Rotulos diferentes.** `Meus Favoritos` na coluna vira `Favoritos` no
 *    atalho, e `Cupons` vira `Meus Cupons`. Cada lista carrega o texto da sua
 *    PRÓPRIA referencia; igualar os dois seria escolher um rotulo e apagar o
 *    outro, e os dois estao no mesmo material.
 *
 * ================== E OS ICONES TAMBEM NAO SAO TODOS OS MESMOS ==================
 *
 * Quase todos repetem o icone do item equivalente da coluna. Mas `Meus Dados`
 * NAO: na sidebar `Dados da Conta` usa `UserCog` (linha 27 do
 * `AccountLayout.tsx`), e no atalho do dashboard `Meus Dados` usa `Sparkles`
 * (linha 90 do `conta.index.tsx`). Sao dois arquivos do mesmo material, e cada
 * um declara o seu.
 *
 * Vale registrar porque a "correcao" natural — igualar o icone ao da coluna —
 * seria justamente o erro: a semelhanca entre os rotulos convida a supor que o
 * icone acompanha, e nao acompanha. `Afiliada` tambem nao tem equivalente na
 * coluna e usa `Users`.
 */
export interface ClientShortcut {
  label: string;
  href: string;
  icon: LucideIcon;
  /** `clicavel e alcancavel`: a rota existe nesta fase. */
  disponivel: boolean;
  /**
   * Mostra a contagem de itens abaixo do rotulo.
   *
   * So `Favoritos` tem: e o unico atalho em que o original passa `count` (e o
   * unico que o print mostra com a segunda linha — `0 ITENS`). Deixar o campo
   * aqui, e nao no componente, mantem a regra de QUEM tem contagem junto da
   * lista que o material define.
   */
  mostraContagem?: boolean;
}

export const CONTA_ATALHOS: ClientShortcut[] = [
  { label: 'Pedidos', href: '/conta/pedidos', icon: Package, disponivel: true },
  { label: 'Favoritos', href: '/conta/favoritos', icon: Heart, disponivel: true, mostraContagem: true },
  { label: 'Endereços', href: '/conta/enderecos', icon: MapPin, disponivel: true },
  { label: 'Medidas', href: '/conta/medidas', icon: Ruler, disponivel: true },
  { label: 'Clube VIP', href: '/conta/pontos', icon: Trophy, disponivel: true },
  { label: 'Meus Cupons', href: '/conta/cupons', icon: Ticket, disponivel: true },
  { label: 'Afiliada', href: '/conta/afiliada', icon: Users, disponivel: true },
  // `Sparkles`, e nao `UserCog`: ver a nota dos icones acima.
  { label: 'Meus Dados', href: '/conta/dados', icon: Sparkles, disponivel: true },
];

/** Rota completa de um item. */
export function clientHref(slug: string): string {
  return slug ? `/conta/${slug}` : '/conta';
}

/**
 * Qual item esta ATIVO, a partir da URL.
 *
 * A regra tem uma armadilha: `pathname.startsWith('/conta/pedidos')` casaria
 * uma rota futura `/conta/pedidos-teste`. A comparacao e por SEGMENTO —
 * separa por `/` e exige igualdade da lista inteira —, e o item raiz (`''`) so
 * fica ativo quando nao ha segmento nenhum depois de `conta`. E a mesma logica
 * do `accountHref` acima, para que href e destaque nunca discordem.
 */
export function isActiveSlug(pathname: string | null | undefined, slug: string): boolean {
  const segments = (pathname ?? '').split('/').filter(Boolean);
  if (segments[0] !== 'conta') return false;
  const resto = segments.slice(1);
  if (slug === '') return resto.length === 0;
  return resto.length === 1 && resto[0] === slug;
}

/** Item correspondente a URL atual, ou `undefined` se a URL nao for da area. */
export function findNavItemByPath(
  pathname: string | null | undefined,
): ClientNavItem | undefined {
  const segments = (pathname ?? '').split('/').filter(Boolean);
  if (segments[0] !== 'conta') return undefined;
  const slug = segments.slice(1).join('/');
  return NAV_ITEMS.find((item) => item.slug === slug);
}
