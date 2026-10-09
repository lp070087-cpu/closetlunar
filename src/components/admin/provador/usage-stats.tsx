import type { ProvadorUsage } from '@/lib/provador/types';

/**
 * OS CARTOES DE NUMERO DAS ABAS `LOOKS SALVOS` E `ANALYTICS`.
 *
 * ================== POR QUE NAO USAR O `StatCard` DO PAINEL ==================
 *
 * O `StatCard` de `components/ui/stats.tsx` desenha um QUADRADO COLORIDO COM ICONE
 * a direita do numero. Os cartoes destas duas telas NAO TEM ICONE NENHUM — conferido
 * no pixel em `235608.png` (Looks Salvos) e `235613.png` (Analytics): so o rotulo
 * em caixa alta e o numero serifado grande, alinhados a esquerda.
 *
 * Nao e uma diferenca de detalhe: e a terceira disposicao de KPI do painel, e o
 * mesmo caso dos cartoes de Carrinho Abandonado e do CRM — cada tela tem a sua, e
 * "padronizar" apagaria o que o print mostra. O padrao esta registrado em
 * `carrinho-abandonado/cart-stats.tsx`.
 *
 * ================== OS ZEROS NAO SAO DIGITADOS ==================
 *
 * Os valores chegam de `DEMO_USAGE` (`demo.ts`), e nao escritos aqui. Quando o
 * Neon entrar, `getUsage` passa a agregar `saved_looks` e `cart_events` e estes
 * cartoes acompanham sozinhos — que e o motivo de existirem como componente.
 */

/** Um cartao: rotulo em caixa alta e numero serifado, sem icone. */
export function UsageCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface flex flex-col gap-3 p-5">
      <span className="eyebrow-caps">{label}</span>
      <span className="font-serif text-3xl tabular-nums tracking-tight">{value}</span>
    </div>
  );
}

/** Painel com titulo e um valor curto ou uma mensagem de vazio. */
export function UsagePanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface flex flex-col gap-3 p-5">
      <span className="font-serif text-lg leading-tight">{title}</span>
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  );
}

/**
 * AS TRES LINHAS DE `LOOKS SALVOS` — adm-044.
 *
 * `Looks mais compartilhados`, `Combinações mais populares` e `Últimos looks
 * salvos` mostram `Nenhum look ... ainda.`; `Produtos mais utilizados em looks`
 * mostra um TRAVESSAO (`—`), que e um vazio DIFERENTE — ele fica no lugar do
 * valor, enquanto os outros ficam no lugar da frase. Os dois estados vem do
 * material e sao desenhados como estao.
 */
export function LooksSalvosCards({ usage }: { usage: ProvadorUsage }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <UsageCard label="Looks criados" value={usage.looksCreated} />
        <UsageCard label="Clientes que salvaram" value={usage.clientsWhoSaved} />
        <UsageCard label="Compartilhamentos" value={usage.shares} />
      </div>
      <div className="grid gap-4">
        <UsagePanel title="Looks mais compartilhados">Nenhum look foi compartilhado ainda.</UsagePanel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <UsagePanel title="Combinações mais populares">Nenhum look salvo ainda.</UsagePanel>
        <UsagePanel title="Produtos mais utilizados em looks">—</UsagePanel>
      </div>
      <div className="grid gap-4">
        <UsagePanel title="Últimos looks salvos">Nenhum look salvo ainda.</UsagePanel>
      </div>
    </>
  );
}

/** AS QUATRO LINHAS DE `ANALYTICS` — adm-045. */
export function AnalyticsCards({ usage }: { usage: ProvadorUsage }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UsageCard label="Looks criados" value={usage.looksCreated} />
        <UsageCard label="Combos únicos" value={usage.uniqueCombos} />
        <UsageCard label="Adds ao carrinho (avatar)" value={usage.cartAdds} />
        <UsageCard label="Produtos usados em looks" value={usage.productsUsed} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <UsagePanel title="Looks mais criados">Sem dados ainda.</UsagePanel>
        <UsagePanel title="Produtos mais usados em looks">—</UsagePanel>
        <UsagePanel title="Categorias mais utilizadas">—</UsagePanel>
        <UsagePanel title="Mais adicionados ao carrinho via avatar">
          Sem dados ainda — eventos serão registrados quando clientes comprarem looks pelo provador.
        </UsagePanel>
      </div>
    </>
  );
}
