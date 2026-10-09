'use client';

import { useEffect, useRef, useState } from 'react';
import { Calculator, ImagePlus, Plus, Star, TrendingUp } from 'lucide-react';
import { cn, formatBRL } from '@/lib/utils';
import { MarginBar, ProfitValue, StockChip } from '@/components/ui/margin-bar';
import { grossProfit, profitMargin } from '@/lib/produtos/metrics';
import { CORES_PRODUTO, DADOS_TELAS, TAMANHOS_PRODUTO, VALORES_PRODUTO } from './mock-data';

/**
 * Mockup de tela.
 *
 * DECISAO IMPORTANTE: isto NAO e um screenshot, nem uma imagem, nem um desenho
 * de outra interface. E a interface REAL do Closet Lunnar — os mesmos tokens,
 * a mesma tipografia, os mesmos componentes (`MarginBar`, `StockChip`,
 * `ProfitValue`) — renderizada em tamanho natural (1280px) e reduzida por
 * `transform: scale()`. E o que o pedido exige: "use componentes/telas do
 * proprio Closet Lunnar", nunca "screenshots falsos de outro sistema".
 *
 * Por isso o texto continua legivel no zoom e continua sendo texto de verdade
 * para leitor de tela e para busca.
 *
 * A MOLDURA E MEDIDA, NAO ADIVINHADA. `transform` nao ocupa espaco, entao a
 * moldura precisa de altura propria — e um numero digitado erra nos dois
 * sentidos: sobrando espaco em branco ou CORTANDO a tela em silencio. Aqui o
 * conteudo e medido com `getBoundingClientRect()`, que devolve o tamanho de
 * LAYOUT (antes da escala, porque o `transform` nao altera essa medida).
 *
 * `ResizeObserver` e nao uma medicao unica: a largura da coluna muda com a
 * janela, o texto quebra em outro ponto e a altura real muda junto. Sem ele, a
 * moldura ficaria com a altura do primeiro render.
 */

type ScreenKind = 'produtos' | 'dashboard' | 'pedidos' | 'canais' | 'cadastro';

export function ScreenMockup({
  kind,
  scale = 0.55,
  className,
  label,
}: {
  kind: ScreenKind;
  /** Fator de reducao. `0.55` mostra ~1280px dentro de ~700px. */
  scale?: number;
  className?: string;
  /** Rotulo acessivel do que a tela mostra. */
  label: string;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [altura, setAltura] = useState(0);

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    const medir = () => {
      // `Math.ceil` evita sobra de meio pixel virando linha cortada.
      const medida = Math.ceil(node.getBoundingClientRect().height);
      setAltura((atual) => (Math.abs(atual - medida) >= 1 ? medida : atual));
    };

    medir();

    if (typeof ResizeObserver === 'undefined') {
      // Sem observador, ao menos acompanha a troca de tamanho da janela.
      window.addEventListener('resize', medir);
      return () => window.removeEventListener('resize', medir);
    }

    const observer = new ResizeObserver(medir);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('ap-screen-wrap', className)} role="img" aria-label={label}>
      <div
        className="ap-screen-shell rounded-2xl border border-border/70 bg-background shadow-elegant"
        style={
          {
            '--ap-scale': scale,
            /* Antes da primeira medicao a altura e 0: o cartao nasce fechado e
               abre no primeiro quadro, em vez de piscar com um chute. */
            '--ap-screen-h': `${altura}px`,
          } as React.CSSProperties
        }
      >
        <div className="ap-screen">
          <div ref={innerRef} className="ap-screen-inner">
            {kind === 'produtos' ? <ScreenProdutos /> : null}
            {kind === 'dashboard' ? <ScreenDashboard /> : null}
            {kind === 'pedidos' ? <ScreenPedidos /> : null}
            {kind === 'canais' ? <ScreenCanais /> : null}
            {kind === 'cadastro' ? (
              <Shell title="Produtos" eyebrow="Catálogo · Editar Produto">
                <ScreenCadastro />
              </Shell>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Barra de titulo que imita a casca do painel (sidebar + topbar). */
export function Shell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="flex bg-canvas">
      {/* Sidebar reduzida, com os grupos reais */}
      <div className="w-64 shrink-0 border-r border-border/70 bg-background">
        <div className="flex items-center justify-center border-b border-border/40 bg-secondary/20 px-6 py-6">
          <div className="flex flex-col items-center gap-2">
            <div className="grid size-10 place-items-center rounded-2xl bg-foreground text-background">
              <span className="font-serif text-lg">CL</span>
            </div>
            <div className="text-center">
              <div className="font-serif text-base leading-none text-foreground">Closet Lunnar</div>
              <div className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">
                Luxury Admin v2.0
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-5 px-3 py-4">
          {DADOS_TELAS.sidebar.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 text-[8px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <div
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[11px] font-medium',
                        item.active
                          ? 'bg-foreground text-background'
                          : 'text-foreground/70',
                      )}
                    >
                      <span
                        className={cn(
                          'size-3.5 shrink-0 rounded',
                          item.active ? 'bg-background/80' : 'bg-foreground/25',
                        )}
                      />
                      {item.label}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex h-14 items-center justify-between border-b border-border/70 bg-background px-6">
          <div>
            <div className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/80">
              Painel Administrativo
            </div>
            <div className="font-serif text-base leading-tight">{title}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              SUPER_ADMIN
            </span>
            <span className="text-[10px] text-foreground">lp070087@gmail.com</span>
            <span className="grid size-7 place-items-center rounded-lg bg-foreground font-serif text-[11px] text-background">
              L
            </span>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="mb-4">
            <div className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/70">
              {eyebrow}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Tela de Produtos — a tabela real, com os dados da referencia (adm-025). */
function ScreenProdutos() {
  return (
    <Shell title="Produtos" eyebrow="Catálogo · 9 produtos cadastrados">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-serif text-2xl tracking-tight">Gerenciamento de Produtos</h3>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Cadastre, edite e acompanhe a performance das suas peças.
          </p>
        </div>
        <span className="rounded-full bg-foreground px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-background">
          + Novo Produto
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-soft">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
            <tr>
              <th className="px-5 py-3 text-left font-bold">Produto</th>
              <th className="px-4 py-3 text-left font-bold">Venda</th>
              <th className="px-4 py-3 text-left font-bold">Custo</th>
              <th className="px-4 py-3 text-left font-bold">Lucro</th>
              <th className="px-4 py-3 text-left font-bold">Margem</th>
              <th className="px-4 py-3 text-left font-bold">Estoque</th>
              <th className="px-5 py-3 text-right font-bold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {DADOS_TELAS.produtos.map((product) => (
              <tr key={product.name}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="size-9 shrink-0 rounded-lg border border-border/40"
                      style={{ backgroundColor: product.hex }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{product.name}</div>
                      <div className="text-[8px] uppercase tracking-wider text-muted-foreground">
                        {product.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium tabular-nums">{product.price}</td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">{product.cost}</td>
                <td className="px-4 py-3">
                  <ProfitValue profit={product.profit} />
                </td>
                <td className="px-4 py-3">
                  <MarginBar margin={product.margin} />
                </td>
                <td className="px-4 py-3">
                  <StockChip stock={product.stock} />
                </td>
                <td className="px-5 py-3 text-right text-xs">
                  <span className="text-foreground">Editar</span>
                  <span className="ml-3 inline-block size-3.5 rounded align-middle bg-foreground/25" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

/** Dashboard — os 6 KPIs reais e os tres paineis de acompanhamento. */
function ScreenDashboard() {
  return (
    <Shell title="Dashboard" eyebrow="Visão geral · Operação normal">
      <div className="mb-4">
        <h3 className="font-serif text-2xl tracking-tight">Painel de Controle</h3>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          Bem-vinda de volta ao centro de comando da Closet Lunnar.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {DADOS_TELAS.kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border/60 bg-background p-4 shadow-card">
            <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
              {kpi.label}
            </div>
            <div className="mt-2 font-serif text-xl tabular-nums">{kpi.value}</div>
            {kpi.hint ? (
              <div className="mt-1 text-[9px] text-muted-foreground">{kpi.hint}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="col-span-2 rounded-2xl border border-border/60 bg-background p-4 shadow-card">
          <div className="mb-3 font-serif text-sm">Mais vendidos (60 dias)</div>
          <div className="space-y-2">
            {DADOS_TELAS.maisVendidos.map((row, index) => (
              <div key={row.name} className="flex items-center gap-3 text-xs">
                <span className="w-3 text-right text-[9px] text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <span className="flex-1 truncate">{row.name}</span>
                <span className="text-[9px] text-muted-foreground tabular-nums">{row.qty}x</span>
                <span className="w-16 text-right font-medium tabular-nums">{row.revenue}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background p-4 shadow-card">
          <div className="mb-3 font-serif text-sm">Estoque baixo</div>
          <div className="space-y-2">
            {DADOS_TELAS.estoqueBaixo.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs"
              >
                <span className="truncate">{row.name}</span>
                <StockChip stock={row.stock} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

/** Pedidos — lista com status, cliente e total. */
function ScreenPedidos() {
  return (
    <Shell title="Pedidos" eyebrow="Vendas · Todos os pedidos">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-serif text-2xl tracking-tight">Pedidos</h3>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Acompanhe cada pedido do pagamento à entrega.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-foreground px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-background">
            Todos
          </span>
          <span className="rounded-full border border-border bg-background px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Rastreamento
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {DADOS_TELAS.pedidos.map((order) => (
          <div
            key={order.code}
            className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm">{order.code}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {order.status}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {order.customer} · {order.items} {order.items === 1 ? 'item' : 'itens'} ·{' '}
                {order.date}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-medium tabular-nums">{order.total}</div>
              <div className="text-[9px] text-muted-foreground">{order.carrier}</div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** Conteúdo e canais — banners, WhatsApp e e-mails no mesmo painel. */
function ScreenCanais() {
  return (
    <Shell title="Conteúdo do Site" eyebrow="Conteúdo · 7 abas de edição">
      <div className="mb-4">
        <h3 className="font-serif text-2xl tracking-tight">Conteúdo do Site</h3>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          Edite a vitrine sem tocar em código.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {DADOS_TELAS.abasConteudo.map((tab, index) => (
          <span
            key={tab}
            className={cn(
              'rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em]',
              index === 0
                ? 'bg-foreground text-background'
                : 'border border-border bg-background text-muted-foreground',
            )}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/60 bg-background p-4 shadow-card">
          <div className="mb-3 font-serif text-sm">Banners ativos</div>
          <div className="space-y-2.5">
            {DADOS_TELAS.banners.map((banner) => (
              <div key={banner.title} className="flex items-center gap-3">
                <span
                  className="h-9 w-16 shrink-0 rounded-lg"
                  style={{ backgroundColor: banner.hex }}
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium">{banner.title}</div>
                  <div className="text-[9px] text-muted-foreground">{banner.placement}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background p-4 shadow-card">
          <div className="mb-3 font-serif text-sm">Canais de atendimento</div>
          <div className="space-y-2.5">
            {DADOS_TELAS.canais.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between gap-2">
                <span className="text-xs">{channel.name}</span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]',
                    channel.on
                      ? 'bg-success-surface text-success-foreground'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {channel.on ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

/**
 * Modal de cadastro/edicao — a sequencia de blocos do print adm-026/027.
 *
 * Os numeros NAO sao digitados: vem do mesmo modulo puro que a tela real usa
 * (`grossProfit` / `profitMargin`), sobre os valores do `top` (R$ 179,00 de
 * venda e R$ 90,00 de custo). Se a conta do painel mudar, a apresentacao muda
 * junto — e o cartao mostra R$ 89,00 e 49,70%, que e o que a tela real exibe.
 */
function ScreenCadastro() {
  const preco = 179;
  const custo = 90;
  const promo = 143.2;
  const lucro = grossProfit(preco, custo);
  const margem = profitMargin(preco, custo);
  const desconto = Math.round((1 - promo / preco) * 100);

  const valores: Record<string, string> = {
    'Preço de Venda': formatBRL(preco),
    'Preço de Custo': formatBRL(custo),
    'Desconto %': `${desconto}`,
    Promocional: formatBRL(promo),
    'Riscado (antigo)': '',
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-background shadow-elegant">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <h3 className="font-serif text-xl tracking-tight">Editar Produto</h3>
        <span className="text-lg leading-none text-muted-foreground">×</span>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div>
          <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
            Nome do Produto *
          </div>
          <div className="mt-1.5 rounded-xl border border-input bg-background px-3 py-2.5 text-xs">
            top
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
              URL Amigável (Slug)
            </div>
            <div className="mt-1.5 rounded-xl border border-input bg-background px-3 py-2.5 text-xs">
              top
            </div>
            <div className="mt-1 text-[9px] text-muted-foreground">
              Gerado automaticamente a partir do nome
            </div>
          </div>
          <div>
            <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
              Categoria
            </div>
            <div className="mt-1.5 flex items-center justify-between rounded-xl border border-input bg-background px-3 py-2.5 text-xs">
              Tops
              <span className="text-muted-foreground">▾</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
            Valores
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {VALORES_PRODUTO.map((campo) => (
              <div key={campo.label}>
                <div
                  className={cn(
                    'text-[7px] font-bold uppercase leading-tight tracking-[0.12em]',
                    campo.tom === 'custo' && 'text-danger',
                    campo.tom === 'desconto' && 'text-warning-foreground',
                    campo.tom === 'neutro' && 'text-muted-foreground/80',
                  )}
                >
                  {campo.label}
                </div>
                <div
                  className={cn(
                    'mt-1.5 rounded-lg border border-input bg-background px-2 py-2 text-[10px] font-medium tabular-nums',
                    campo.tom === 'neutro' && 'text-foreground',
                    campo.tom === 'custo' && 'text-danger',
                    campo.tom === 'desconto' && 'text-warning-foreground',
                  )}
                >
                  {valores[campo.label] || '—'}
                </div>
                <div className="mt-1 text-[7px] leading-tight text-muted-foreground">
                  {campo.hint}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco de calculo — os mesmos dois chips da tela real */}
        <div className="flex items-center gap-5 rounded-2xl border border-border/60 bg-secondary/20 p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success-surface text-success-foreground">
              <Calculator className="size-4" aria-hidden />
            </span>
            <div>
              <div className="text-[7px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
                Lucro Bruto
              </div>
              <div className="font-serif text-base font-medium text-success-foreground tabular-nums">
                {formatBRL(lucro)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 border-l border-border/60 pl-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-warning-surface text-warning-foreground">
              <TrendingUp className="size-4" aria-hidden />
            </span>
            <div>
              <div className="text-[7px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
                Margem de Lucro
              </div>
              <div className="font-serif text-base font-medium text-warning-foreground tabular-nums">
                {margem.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* GALERIA DE IMAGENS — mesma moldura tracejada e selo `Principal` */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
                Galeria de imagens
              </div>
              <div className="mt-1 text-[9px] text-muted-foreground">
                Aceita PNG, JPG, JPEG e WEBP. A primeira imagem é a principal — use as setas para
                reordenar.
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em]">
              Enviar Imagem
            </span>
          </div>
          <div className="mt-2.5 flex gap-3 rounded-2xl border border-dashed border-border bg-secondary/20 p-3">
            {[0, 1, 2].map((slot) => (
              <div
                key={slot}
                className="relative size-20 overflow-hidden rounded-xl border border-border bg-background"
              >
                {slot === 2 ? (
                  <span className="grid size-full place-items-center text-muted-foreground/50">
                    <ImagePlus className="size-4" aria-hidden />
                  </span>
                ) : (
                  <>
                    <div
                      className="size-full"
                      style={{
                        background:
                          slot === 0
                            ? 'linear-gradient(150deg, #F0D4D8, #E4C4B0)'
                            : 'linear-gradient(150deg, #EBD9C8, #D8E2EA)',
                      }}
                    />
                    {slot === 0 ? (
                      <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-foreground/85 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-background">
                        <Star className="size-2" aria-hidden />
                        Principal
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Variações de cor — estrutura que o aviso do print promete */}
        <div>
          <div className="flex items-center justify-between">
            <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
              Variações de Cor
            </div>
            <span className="text-[9px] text-muted-foreground">
              Cada cor tem fotos e estoque próprios
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CORES_PRODUTO.map((cor) => (
              <div
                key={cor.nome}
                className="flex items-center gap-2 rounded-full border border-border bg-background py-1.5 pl-1.5 pr-3"
              >
                <span
                  className="size-4 rounded-full border border-border/60"
                  style={{ backgroundColor: cor.hex }}
                />
                <span className="text-[10px] font-medium">{cor.nome}</span>
                <span className="text-[9px] text-muted-foreground tabular-nums">
                  {cor.estoque} un.
                </span>
              </div>
            ))}
            <span className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-[10px] text-muted-foreground">
              <Plus className="size-3" aria-hidden />
              Nova cor
            </span>
          </div>
        </div>

        {/* Tamanhos como pills, igual à tela real */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
            Tamanhos
          </span>
          {TAMANHOS_PRODUTO.map((tamanho) => (
            <span
              key={tamanho}
              className={cn(
                'min-w-8 rounded-full border px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider',
                tamanho === 'PP' || tamanho === 'XG'
                  ? 'border-border bg-background text-muted-foreground'
                  : 'border-foreground bg-foreground text-background',
              )}
            >
              {tamanho}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border/60 px-6 py-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Cancelar
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-background">
          <Plus className="size-3" aria-hidden />
          Salvar Produto
        </span>
      </div>
    </div>
  );
}

/**
 * A marca na escala em que ela aparece na sidebar do painel.
 *
 * O `Store` de 24px nao era visivel no mockup reduzido; aqui a marca e
 * desenhada no tamanho real dela, para aparecer de verdade na apresentacao.
 */
export function BrandTile({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex flex-col items-center gap-3 rounded-2xl bg-background p-5', className)}
      role="img"
      aria-label="Marca do painel: Closet Lunnar, Luxury Admin v2.0"
    >
      <div className="grid size-11 place-items-center rounded-2xl bg-foreground font-serif text-lg text-background">
        CL
      </div>
      <div className="text-center">
        <div className="font-serif text-lg leading-none tracking-tight">Closet Lunnar</div>
        <div className="mt-2 text-[7px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">
          Luxury Admin v2.0
        </div>
      </div>
    </div>
  );
}

/** Cartao de produto no formato de celular — as mesmas colunas da tabela. */
export function MobileProductCard({ produto }: { produto: (typeof DADOS_TELAS.produtos)[number] }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span
          className="size-12 shrink-0 rounded-xl border border-border/40"
          style={{ backgroundColor: produto.hex }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{produto.name}</div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {produto.slug}
          </div>
        </div>
        <StockChip stock={produto.stock} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border/50 pt-4">
        <div>
          <dt className="label-caps">Venda</dt>
          <dd className="mt-1 text-xs font-medium tabular-nums">{produto.price}</dd>
        </div>
        <div>
          <dt className="label-caps">Custo</dt>
          <dd className="mt-1 text-xs text-muted-foreground tabular-nums">{produto.cost}</dd>
        </div>
        <div>
          <dt className="label-caps">Lucro</dt>
          <dd className="mt-1 text-xs">
            <ProfitValue profit={produto.profit} />
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-end justify-between border-t border-border/50 pt-3">
        <div>
          <div className="label-caps">Margem</div>
          <div className="mt-1.5">
            <MarginBar margin={produto.margin} />
          </div>
        </div>
        <div className="flex items-center gap-3 pb-0.5 text-[10px] font-bold uppercase tracking-wider">
          <span className="text-foreground">Editar</span>
          <span className="text-danger">Excluir</span>
        </div>
      </div>
    </div>
  );
}
