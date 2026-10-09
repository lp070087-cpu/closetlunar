'use client';

import { Card } from '@/components/ui/card';
import { cn, formatBRL } from '@/lib/utils';
import { eixoY, formatPieValue } from '@/lib/financeiro/metrics';
import type { NamedValue, SalesPoint, MonthPoint } from '@/lib/financeiro/types';

/**
 * Os QUATRO graficos de adm-023 (blocos de cima para baixo):
 *
 *   Vendas por dia          linha,  eixo de 09-01 a 09-27, no zero
 *   Faturamento por mes     barra,  uma barra em 06/2026
 *   Formas de pagamento     pizza,  vazia ("Sem dados no periodo.")
 *   Pedidos por status      pizza,  vazia
 *
 * ================== POR QUE SVG NA MAO, E NAO UMA BIBLIOTECA ==================
 *
 * O original usa `recharts`. Este projeto NAO tem recharts, e nao tem NENHUMA
 * biblioteca de grafico instalada (`package.json` traz seis dependencias de
 * runtime, todas de UI). Instalar uma agora nao e uma decisao de desenho: e
 * trocar a arvore de dependencias do projeto inteiro para desenhar quatro
 * figuras, e o `npm run build` deste ambiente nao tem rede para instalar nada.
 *
 * O que os quatro graficos precisam e pequeno e cabe num arquivo: uma polilinha,
 * uma serie de retangulos e duas pizzas. Nada aqui e animado, nada e interativo e
 * nada carrega dado depois de montar — entao o ganho de uma biblioteca (escalas,
 * eixos, tooltip, animacao, responsividade por `ResizeObserver`) nao e usado.
 *
 * O QUE SE PERDE, e fica registrado: nao ha TOOLTIP. O original mostra o valor
 * ao passar o mouse (`RTooltip` + `formatBRL`). Aqui o valor esta no eixo, na
 * barra e na legenda da pizza — mas nao ha o balao. Desenhar um tooltip exige
 * estado de hover, posicionamento e `pointer-events`, e o unico jeito de provar
 * tudo isso e um navegador, que nao existe na verificacao deste projeto. Um
 * tooltip que nao pode ser provado seria a peca mais fragil da tela.
 *
 * ================== A ESCALA E UNIFORME, E O `viewBox` E O TRUQUE ==================
 *
 * Cada SVG tem um `viewBox` de 640x260 e escala com `preserveAspectRatio`
 * PADRAO (`xMidYMid meet`), e nao `none`. `none` esticaria o grafico na largura
 * e o texto do eixo viraria texto deformado — o rotulo `R$1.400` e o mesmo
 * `viewBox` para todos, entao a proporcao se mantem e ele nao estica.
 */

/** A moldura de um grafico: card branco, titulo serifado e altura fixa. */
export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 font-serif text-lg leading-tight">{title}</h3>
      {/* `h-64` e a altura do original (`<div className="h-64">`). */}
      <div className="h-64">{children}</div>
    </Card>
  );
}

/** O vazio dos quatro graficos — o texto literal do print. */
export function EmptyChart() {
  return (
    <div className="grid h-full place-items-center text-xs text-muted-foreground">
      Sem dados no período.
    </div>
  );
}

/* -------------------------------------------------------------- geometria */

const L = 48; // margem esquerda, para o rotulo `R$1.400`
const R = 14;
const T = 12;
const B = 24; // margem inferior, para o rotulo do dia/mes
const W = 640;
const H = 260;
const PLOT_W = W - L - R;
const PLOT_H = H - T - B;

/** O valor formatado de um degrau do eixo, no estilo curto do print: `R$350`. */
function rotuloEixo(valor: number): string {
  return `R$${Math.round(valor).toLocaleString('pt-BR')}`;
}

/* -------------------------------------------------------- linha: vendas/dia */

export function SalesLineChart({ points }: { points: SalesPoint[] }) {
  if (points.length === 0) return <EmptyChart />;

  const maior = Math.max(...points.map((p) => p.revenue), 0);
  const { topo, passos } = eixoY(maior);
  const n = points.length;

  // Com UM ponto nao ha reta: `i/(n-1)` dividiria por zero. O ponto unico fica no
  // meio do plot, que e o que o original faz ao receber uma serie de um item.
  const x = (i: number) => (n === 1 ? L + PLOT_W / 2 : L + (i / (n - 1)) * PLOT_W);
  const y = (v: number) => T + (1 - v / topo) * PLOT_H;

  const caminho = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.revenue).toFixed(1)}`).join(' ');

  // No maximo 10 rotulos no eixo, um a cada `salto` — 27 dias nao cabem escritos.
  const salto = Math.max(1, Math.ceil(n / 10));
  const rotulos = points.map((p, i) => ({ p, i })).filter(({ i }) => i % salto === 0 || i === n - 1);

  const total = points.reduce((soma, p) => soma + p.revenue, 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      role="img"
      aria-label={`Vendas por dia: ${formatBRL(total)} em ${points.length} dia(s).`}
    >
      {passos.map((passo) => (
        <g key={passo}>
          <line
            x1={L}
            x2={W - R}
            y1={y(passo)}
            y2={y(passo)}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="3 3"
            className="text-border"
          />
          <text x={L - 6} y={y(passo) + 3} textAnchor="end" fontSize={10} className="fill-muted-foreground">
            {rotuloEixo(passo)}
          </text>
        </g>
      ))}

      {/* A linha do zero por cima das guias: no print ela e solida. */}
      <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="currentColor" strokeWidth={1} className="text-border" />

      <path d={caminho} fill="none" stroke="currentColor" strokeWidth={2} className="text-foreground" />

      {rotulos.map(({ p, i }) => (
        <text
          key={p.date}
          x={x(i)}
          y={H - 8}
          textAnchor="middle"
          fontSize={10}
          className="fill-muted-foreground"
        >
          {/* `09-01` — o `slice(5)` do original, mantido: o ano repetido em 27
              rotulos nao caberia, e o periodo ja esta escrito nas pilulas. */}
          {p.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

/* -------------------------------------------------------- barra: por mes */

export function RevenueBarChart({ points }: { points: MonthPoint[] }) {
  if (points.length === 0) return <EmptyChart />;

  const maior = Math.max(...points.map((p) => p.total), 0);
  const { topo, passos } = eixoY(maior);
  const n = points.length;
  const slot = PLOT_W / n;

  /**
   * A LARGURA DA BARRA, e os dois limites.
   *
   * Piso implicito: com UMA barra (`2026-06`, o caso do print) `slot * 0.84`
   * daria 489px e a barra tomaria o grafico inteiro. O teto em `PLOT_W * 0.68`
   * mantem a barra em dois tercos, que e o que o print mostra — uma barra larga,
   * com folga dos dois lados.
   *
   * Com DOZE meses (`slot = 48`) o teto nao age e sobra o respiro do `0.84`, que
   * e o espacamento do original.
   */
  const largura = Math.min(slot * 0.84, PLOT_W * 0.68);
  const y = (v: number) => T + (1 - v / topo) * PLOT_H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      role="img"
      aria-label={`Faturamento por mês: ${points.length} mês(es) com venda.`}
    >
      {passos.map((passo) => (
        <g key={passo}>
          <line
            x1={L}
            x2={W - R}
            y1={y(passo)}
            y2={y(passo)}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="3 3"
            className="text-border"
          />
          <text x={L - 6} y={y(passo) + 3} textAnchor="end" fontSize={10} className="fill-muted-foreground">
            {rotuloEixo(passo)}
          </text>
        </g>
      ))}

      {points.map((p, i) => {
        const altura = Math.max(y(p.total) > y(0) ? H - B - y(p.total) : 0, 0);
        return (
          <rect
            key={p.month}
            x={L + slot * i + (slot - largura) / 2}
            y={y(p.total)}
            width={largura}
            height={altura}
            fill="currentColor"
            className="text-foreground"
          />
        );
      })}

      {points.map((p, i) => (
        <text
          key={`${p.month}-rotulo`}
          x={L + slot * i + slot / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize={10}
          className="fill-muted-foreground"
        >
          {p.month}
        </text>
      ))}
    </svg>
  );
}

/* --------------------------------------------------------------- pizza */

/**
 * AS CORES DAS FATIAS — as do original, sem troca.
 *
 * `PIE_COLORS` e um array literal no codigo do projeto original
 * (`["#1f2937", "#9ca3af", "#d4a574", "#e8b4b8", "#7c9885", "#b08968"]`). Nao
 * sao tokens do design system (nao existem como `--*` em `globals.css`), sao a
 * paleta daquele grafico — e por isso entram aqui como valor, com esta nota, em
 * vez de viram variavel.
 *
 * O ciclo com `%` e o do original: uma setima fatia volta ao primeiro cinza.
 */
const CORES = ['#1f2937', '#9ca3af', '#d4a574', '#e8b4b8', '#7c9885', '#b08968'];

/** As coordenadas de uma fatia, em angulos medidos a partir das 12 horas. */
function fatia(cx: number, cy: number, r: number, de: number, ate: number) {
  const ponto = (graus: number) => {
    const rad = ((graus - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
  };
  const [x0, y0] = ponto(de);
  const [x1, y1] = ponto(ate);
  // O arco e `large-arc` quando a fatia passa de meia volta.
  return `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${ate - de > 180 ? 1 : 0},1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}

/**
 * UMA PIZZA. A UNIDADE DO VALOR ENTRA POR PARAMETRO.
 *
 * ================== O DEFEITO DO ORIGINAL QUE NAO SE REPETE ==================
 *
 * No original as duas pizzas usam o MESMO `FinancePieChart`, e o tooltip dele
 * formata tudo com `formatBRL`. `Pedidos por status` recebe CONTAGENS — entao o
 * balao de "3 pedidos novos" escreve `R$ 3,00`, tratando tres pedidos como tres
 * reais. Um numero com a unidade errada e pior que numero nenhum, porque parece
 * certo.
 *
 * Por isso `unidade` e obrigatoria: `Formas de pagamento` passa `moeda`,
 * `Pedidos por status` passa `contagem`, e o componente nao adivinha. Ver
 * `formatPieValue` em `metrics.ts`.
 */
export function PieChart({
  data,
  unidade,
  label,
}: {
  data: NamedValue[];
  unidade: 'moeda' | 'contagem';
  label: string;
}) {
  // Mesma condicao do original: sem fatia nenhuma ou todas zeradas, o grafico
  // some e entra o texto — e nao um circulo vazio, que pareceria um dado.
  if (data.length === 0 || data.every((d) => !d.value)) return <EmptyChart />;

  const total = data.reduce((soma, d) => soma + d.value, 0);
  const cx = W / 2;
  const cy = H / 2;
  const raio = Math.min(PLOT_W, PLOT_H) / 2 - 6;

  let acumulado = 0;
  const fatias = data.map((d, i) => {
    const inicio = (acumulado / total) * 360;
    acumulado += d.value;
    const fim = (acumulado / total) * 360;
    /**
     * UMA FATIA QUE DA A VOLTA INTEIRA VIRA UM CIRCULO.
     *
     * Com uma unica categoria, o arco iria de 0 a 360 graus — e um arco de angulo
     * cheio tem o ponto inicial igual ao final, o que o desenha como um segmento
     * invisivel (ou, pior, como uma fatia que nao existe). O limite de
     * `359.999` e o mesmo do original, e existe para o erro de arredondamento
     * (`359.99999999`) nao trocar o circulo por uma fatia quebrada.
     *
     * O teste mora AQUI, junto do calculo dos angulos, e nao dentro do `map` do
     * JSX: um `{/* ... *\/}` no inicio do ramo de um ternario dentro de uma lista
     * RACHA o JSX — foi exatamente o erro de sintaxe que o primeiro typecheck
     * desta tela acusou.
     */
    const voltaInteira = fim - inicio >= 359.999;
    return { ...d, cor: CORES[i % CORES.length], inicio, fim, voltaInteira };
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label={`${label}. ${data.map((d) => `${d.name}: ${formatPieValue(d.value, unidade)}`).join('; ')}.`}
      >
        {/* `voltaInteira` decidido fora do JSX — ver o comentario no `map`. */}
        {fatias.map((f) =>
          f.voltaInteira ? (
            <circle key={f.name} cx={cx} cy={cy} r={raio} fill={f.cor} />
          ) : (
            <path key={f.name} d={fatia(cx, cy, raio, f.inicio, f.fim)} fill={f.cor} />
          ),
        )}
      </svg>

      {/*
        A LEGENDA E UMA ADICAO DECLARADA.

        O original escreve o NOME da fatia em cima dela (`label={(d) => d.name}`).
        Com duas ou tres fatias grandes isso funciona; com muitas pequenas os
        rotulos se sobrepoem e o grafico vira mancha — e o nome de uma fatia de
        2% some atras do vizinho. A legenda abaixo diz o mesmo, com o valor junto
        (que o print nao mostra em lugar nenhum, mas o tooltip do original
        mostrava), e sobrevive a qualquer numero de fatias.

        Ela e uma ADICAO, e nao uma transcricao: o print so mostra o estado vazio
        destes dois graficos.
      */}
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        {fatias.map((f) => (
          <li key={f.name} className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: f.cor }} aria-hidden />
            <span className="font-medium text-foreground">{f.name}</span>
            <span className="tabular-nums">{formatPieValue(f.value, unidade)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * O conjunto dos quatro, na ordem do print.
 *
 * Existe para a bancada poder renderizar a grade inteira com uma chamada — e
 * para que a ordem dos quatro blocos fique escrita em UM lugar, e nao
 * distribuidas pelo JSX da tela. A ordem e a do print, e uma troca acidental
 * entre "Formas de pagamento" e "Pedidos por status" nao quebraria nada em
 * compilacao.
 */
export function FinanceCharts({
  sales,
  months,
  payments,
  statuses,
  className,
}: {
  sales: SalesPoint[];
  months: MonthPoint[];
  payments: NamedValue[];
  statuses: NamedValue[];
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 lg:grid-cols-2', className)}>
      <ChartCard title="Vendas por dia">
        <SalesLineChart points={sales} />
      </ChartCard>
      <ChartCard title="Faturamento por mês">
        <RevenueBarChart points={months} />
      </ChartCard>
      {/*
        AS DUAS PIZZAS TROCAM DE UNIDADE, e a troca esta escrita AQUI — no unico
        lugar onde as duas aparecem juntas. `Formas de pagamento` soma REAIS
        (vem de `paymentBreakdown`, sobre os pedidos validos); `Pedidos por
        status` conta PEDIDOS (vem de `statusBreakdown`, contagem crua). Fora
        daqui a distincao seria invisivel — e era exatamente ali que o original
        errava, formatando as duas em `formatBRL`.
      */}
      <ChartCard title="Formas de pagamento">
        <PieChart data={payments} unidade="moeda" label="Formas de pagamento" />
      </ChartCard>
      <ChartCard title="Pedidos por status">
        <PieChart data={statuses} unidade="contagem" label="Pedidos por status" />
      </ChartCard>
    </div>
  );
}
