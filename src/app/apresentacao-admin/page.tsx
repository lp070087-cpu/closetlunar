import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Boxes, Check, Layers, Lock, MonitorSmartphone } from 'lucide-react';
import { CountUp, Reveal } from '@/components/apresentacao/reveal';
import {
  BrandTile,
  MobileProductCard,
  ScreenMockup,
} from '@/components/apresentacao/screen-mockup';
import {
  CAPACIDADES,
  DADOS_TELAS,
  GRUPOS_REAIS,
  MARCA,
  NAV_GRUPO_COUNT,
  NAV_TOTAL,
  NUMEROS,
  RESPONSIVIDADE,
  SEGURANCA,
  VALORES_PRODUTO,
} from '@/components/apresentacao/mock-data';
import { NAV_GROUPS } from '@/lib/nav';
import './apresentacao.css';

/**
 * Apresentação do sistema — rota /apresentacao-admin.
 *
 * O que esta pagina E: uma apresentacao do painel, para mostrar ao cliente o
 * que o sistema faz. O que ela NAO E: o painel. Ela nao substitui nenhuma rota
 * existente (`/admin` continua sendo o painel de verdade) e nao escreve nada.
 *
 * REGRA DE HONESTIDADE: as interfaces mostradas aqui sao as TELAS REAIS do
 * Closet Lunnar — mesmos tokens, mesmos componentes (`MarginBar`, `StockChip`,
 * `ProfitValue`) e mesmas contas (`grossProfit`, `profitMargin`). Nao ha
 * screenshot de outro sistema, nem tela desenhada para enfeitar. O que ainda
 * depende do banco nao aparece como "pronto": aparece nomeado.
 *
 * Todo o CSS mora em `./apresentacao.css`, com escopo `.ap-root` — por isso a
 * apresentacao nao interfere no Admin.
 */

export const metadata: Metadata = {
  title: 'Apresentação do Sistema',
  description:
    'Conheça o sistema de gestão da Closet Lunnar: catálogo, vendas, conteúdo, provador virtual e insights em um painel só.',
  robots: { index: false, follow: false },
};

/** Textos que a apresentacao usa e que nao sao dado de tela. */
const TELAS = [
  {
    kind: 'dashboard' as const,
    titulo: 'Dashboard',
    texto:
      'Oito indicadores no topo, mais vendidos dos últimos 60 dias e o alerta de estoque baixo — a operação abre já sabendo o que precisa de atenção.',
  },
  {
    kind: 'produtos' as const,
    titulo: 'Produtos',
    texto:
      'Venda, custo, lucro, margem e estoque na mesma linha, com busca, categoria, status e filtro de estoque baixo. Um produto por vez, sem planilha paralela.',
  },
  {
    kind: 'pedidos' as const,
    titulo: 'Pedidos',
    texto:
      'Cada pedido com status, cliente, quantidade, data, transportadora e total, mais a aba de rastreamento para despacho.',
  },
  {
    kind: 'canais' as const,
    titulo: 'Conteúdo e comunicação',
    texto:
      'Sete abas de conteúdo do site, banners por posição e os canais de atendimento ligados e desligados no mesmo painel.',
  },
];

const BLOCOS_CADASTRO = [
  {
    titulo: 'Valores completos',
    texto:
      'Venda, custo, desconto, promocional e riscado. Custo em vermelho e desconto em âmbar, como no material de origem.',
  },
  {
    titulo: 'Lucro e margem calculados',
    texto:
      'O lucro bruto e a margem saem da mesma função que a listagem usa. Digitar o custo muda os dois na hora.',
  },
  {
    titulo: 'Galeria com principal',
    texto:
      'Arrastar ou escolher arquivos, selo “Principal” na primeira imagem e reordenação pelas setas — como o próprio texto da tela promete.',
  },
  {
    titulo: 'Cor, foto e estoque por variação',
    texto:
      'Cada cor tem tom, fotos e estoque próprios, separados do estoque geral do produto.',
  },
];

export default function ApresentacaoAdminPage() {
  return (
    <main className="ap-root">
      <a href="#showcase" className="ap-skip focus-ring rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-background">
        Ir para as telas
      </a>

      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pb-32 sm:pt-28 lg:px-10">
        {/* Halos de profundidade: movimento lentíssimo, só para dar volume. */}
        <span
          className="ap-halo -left-24 top-0 size-[28rem]"
          style={{ backgroundColor: 'hsl(var(--rose))' }}
          aria-hidden
        />
        <span
          className="ap-halo ap-halo--slow -right-20 top-32 size-[32rem]"
          style={{ backgroundColor: 'hsl(var(--champagne))' }}
          aria-hidden
        />
        <div className="ap-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />

        <div className="relative mx-auto max-w-shell">
          <Reveal className="max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="h-px w-10 bg-foreground/30" aria-hidden />
              <span className="text-eyebrow font-bold uppercase text-muted-foreground">
                {MARCA.assinatura}
              </span>
            </div>

            <h1 className="mt-7 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              O sistema
              <br />
              <span className="italic">por dentro.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {MARCA.promessa} Tudo o que a loja precisa — catálogo, vendas, conteúdo, provador
              virtual e insights — em um painel só, com as contas de lucro e margem feitas pelo
              próprio sistema.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/admin"
                className="focus-ring ap-lift inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-background transition-colors hover:bg-foreground/90"
              >
                Abrir o painel
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href="#showcase"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-foreground/20 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground/40"
              >
                Ver as telas
              </a>
            </div>
          </Reveal>

          {/* Numeros: sobem quando entram na tela. */}
          <Reveal delay={140} className="mt-16 border-t border-border/70 pt-8">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
              {NUMEROS.map((item) => (
                <div key={item.label}>
                  <dd className="font-serif text-4xl tracking-tight sm:text-5xl">
                    <CountUp value={item.value} suffix={item.suffix} />
                  </dd>
                  <dt className="mt-2 text-sm font-medium">{item.label}</dt>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ MARQUEE */}
      {/*
        Faixa de nomes dos módulos. Usa a lista REAL de navegação, não um
        slogan: o que passa na tela é o que existe no menu do painel.
      */}
      <section className="ap-band overflow-hidden py-5" aria-label="Módulos do painel">
        <div className="ap-marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {NAV_GROUPS.flatMap((grupo) => grupo.items).map((item) => (

                <span
                  key={`${copy}-${item.slug}`}
                  className="flex shrink-0 items-center gap-6 px-6 text-eyebrow font-bold uppercase tracking-[0.3em] text-background/85"
                >
                  {item.label}
                  <span className="size-1 rounded-full bg-background/40" aria-hidden />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ SHOWCASE */}
      <section id="showcase" className="px-6 py-24 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-shell">
          <Reveal className="max-w-2xl">
            <span className="text-eyebrow font-bold uppercase text-muted-foreground">
              As telas do sistema
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              Nada aqui é maquete.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              As telas abaixo são a interface real do Closet Lunnar, renderizada em tamanho natural
              e reduzida para caber no cartão. A tipografia, as cores, os chips de margem e de
              estoque e os números são os mesmos do painel — inclusive as contas de lucro, que saem
              da mesma função.
            </p>
          </Reveal>

          <div className="mt-16 space-y-20">
            {TELAS.map((tela, index) => (
              <div
                key={tela.kind}
                className="grid items-center gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16"
              >
                <Reveal variant={index % 2 === 0 ? 'left' : 'right'}>
                  <span className="text-eyebrow font-bold uppercase text-muted-foreground">
                    Tela {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-serif text-3xl tracking-tight">{tela.titulo}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{tela.texto}</p>
                  <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-foreground">
                    <Check className="size-3.5 text-success-foreground" aria-hidden />
                    Em funcionamento no painel
                  </p>
                </Reveal>

                <Reveal variant="scale" delay={120}>
                  <ScreenMockup
                    kind={tela.kind}
                    label={`Tela de ${tela.titulo} do painel administrativo`}
                  />
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- CADASTRO */}
      <section className="border-y border-border/70 bg-background px-6 py-24 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start lg:gap-16">
            <Reveal variant="left">
              <span className="text-eyebrow font-bold uppercase text-muted-foreground">
                Cadastro de produto
              </span>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
                O preço certo
                <br />
                <span className="italic">na hora certa.</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Ao cadastrar a peça, o painel já responde a pergunta que importa: quanto sobra.
                Lucro bruto e margem aparecem no mesmo instante em que o custo é digitado, e a
                listagem inteira passa a mostrar essa peça com o mesmo número.
              </p>

              <ul className="mt-10 space-y-6">
                {BLOCOS_CADASTRO.map((bloco, index) => (
                  <Reveal as="li" key={bloco.titulo} delay={index * 80} className="flex gap-4">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{bloco.titulo}</div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {bloco.texto}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </ul>

              <p className="mt-10 rounded-2xl border border-dashed border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground">
                Os cinco campos de valores do formulário são:{' '}
                {VALORES_PRODUTO.map((campo) => campo.label).join(' · ')}.
              </p>
            </Reveal>

            <Reveal variant="scale" delay={140}>
              <ScreenMockup
                kind="cadastro"
                scale={0.62}
                label="Modal de edição de produto: nome, slug, categoria, valores, lucro bruto, margem, galeria, variações de cor, tamanhos e descrição"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- RESPONSIVIDADE */}
      <section className="px-6 py-24 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-shell">
          <Reveal className="max-w-2xl">
            <span className="text-eyebrow font-bold uppercase text-muted-foreground">
              Responsividade
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              A mesma informação
              <br />
              em qualquer tela.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              No celular, a tabela não é espremida: cada produto vira um cartão que mantém venda,
              custo, lucro, margem, estoque e as duas ações. Nenhuma coluna some, nada fica só no
              desktop.
            </p>
          </Reveal>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
            <Reveal variant="right" delay={100}>
              <div className="rounded-3xl border border-border/70 bg-secondary/20 p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <MonitorSmartphone className="size-4 text-muted-foreground" aria-hidden />
                  <span className="text-eyebrow font-bold uppercase text-muted-foreground">
                    No bolso
                  </span>
                </div>
                <div className="mx-auto max-w-sm space-y-3">
                  {DADOS_TELAS.produtos.slice(0, 2).map((produto) => (
                    <MobileProductCard key={produto.slug} produto={produto} />
                  ))}
                </div>
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Cartão de produto, como aparece no celular.
                </p>
              </div>
            </Reveal>

            <Reveal variant="left" delay={160}>
              <ul className="space-y-8">
                {RESPONSIVIDADE.map((item) => (
                  <li key={item.tela} className="border-b border-border/70 pb-8 last:border-0">
                    <div className="text-sm font-semibold">{item.tela}</div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.detalhe}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Detalhe ampliado da marca, para provar a identidade e não a silhueta */}
              <BrandTile className="mt-10 border border-border/70" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ CAPACIDADES */}
      <section className="border-y border-border/70 bg-background px-6 py-24 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-shell">
          <Reveal className="max-w-2xl">
            <span className="text-eyebrow font-bold uppercase text-muted-foreground">
              Áreas de gestão
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              {NAV_GRUPO_COUNT} áreas, {NAV_TOTAL} telas.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              A navegação abaixo é a do painel, com os nomes exatos. Não há área “em breve” nessa
              lista: todas têm rota, casca e lugar definido no sistema.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPACIDADES.map((area, index) => (
              <Reveal
                key={area.id}
                delay={(index % 3) * 90}
                className="ap-card flex flex-col rounded-2xl border border-border/70 bg-canvas p-6"
              >
                <span className="text-eyebrow font-bold uppercase text-muted-foreground">
                  {area.grupo}
                </span>
                <h3 className="mt-3 font-serif text-2xl leading-snug tracking-tight">
                  {area.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{area.resumo}</p>
                <ul className="mt-5 space-y-2 border-t border-border/60 pt-5">
                  {area.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-foreground/85">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success-foreground" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          {/* Navegação real, item por item */}
          <Reveal delay={120} className="mt-16">
            <div className="rounded-3xl border border-border/70 bg-canvas p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-serif text-2xl tracking-tight">
                  Inventário da navegação
                </h3>
                <span className="text-xs text-muted-foreground">
                  {NAV_TOTAL} itens em {NAV_GRUPO_COUNT} grupos
                </span>
              </div>
              <div className="mt-7 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
                {GRUPOS_REAIS.map((grupo) => (
                  <div key={grupo.id}>
                    <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
                      <span className="text-eyebrow font-bold uppercase text-muted-foreground">
                        {grupo.label}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground/70">
                        {grupo.items.length}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {grupo.items.map((item) => (
                        <li key={item} className="text-xs text-foreground/80">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------------- SISTEMA */}
      <section className="px-6 py-24 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
            <Reveal variant="left">
              <span className="text-eyebrow font-bold uppercase text-muted-foreground">
                Organização e segurança
              </span>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
                Feito para
                <br />
                <span className="italic">durar.</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                O painel não é um conjunto de telas soltas: as telas compartilham os mesmos
                contratos, as mesmas contas e o mesmo desenho. É isso que permite acrescentar um
                módulo novo sem quebrar os antigos.
              </p>

              <ul className="mt-10 space-y-6">
                {SEGURANCA.map((item, index) => (
                  <Reveal as="li" key={item.titulo} delay={index * 80} className="flex gap-4">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                      {index === 0 ? (
                        <Lock className="size-4" aria-hidden />
                      ) : index === 1 ? (
                        <Layers className="size-4" aria-hidden />
                      ) : (
                        <Boxes className="size-4" aria-hidden />
                      )}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{item.titulo}</div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.texto}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </Reveal>

            <Reveal variant="right" delay={140}>
              <div className="rounded-3xl border border-border/70 bg-secondary/20 p-8 sm:p-10">
                <BrandTile />
                <div className="mt-8 space-y-4 border-t border-border/60 pt-8">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    A identidade do sistema é a do material de origem: fundo champanhe, tinta
                    quase preta, tipografia serifada nos títulos e uma sans neutra na interface.
                    Cada valor vem da paleta medida nos prints — não de escolha estética.
                  </p>
                  <dl className="grid grid-cols-2 gap-5 pt-2">
                    {[
                      { k: 'Fundo', v: '#F7EDE2' },
                      { k: 'Tinta', v: '#14110E' },
                      { k: 'Status positivo', v: '#00BC7D' },
                      { k: 'Destrutivo', v: '#DE3C36' },
                    ].map((cor) => (
                      <div key={cor.k} className="flex items-center gap-3">
                        <span
                          className="size-8 shrink-0 rounded-lg border border-border/70"
                          style={{ backgroundColor: cor.v }}
                          aria-hidden
                        />
                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                            {cor.k}
                          </dt>
                          <dd className="text-xs tabular-nums">{cor.v}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ CTA */}
      <section className="ap-band px-6 py-24 sm:py-28 lg:px-10">
        <Reveal className="mx-auto flex max-w-shell flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <span className="text-eyebrow font-bold uppercase text-background/70">
              Próximo passo
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-background sm:text-5xl">
              O painel está aberto.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-background/75">
              Esta apresentação é a leitura do sistema. O funcionamento — filtros, ordenação,
              cálculo de margem, cadastro de produto — está no painel, e é onde a avaliação
              continua.
            </p>
          </div>
          <Link
            href="/admin"
            className="focus-ring ap-lift inline-flex shrink-0 items-center gap-2 rounded-full bg-background px-7 py-4 text-xs font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-background/90"
          >
            Entrar no painel
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </section>

      <footer className="px-6 py-10 lg:px-10">
        <div className="mx-auto flex max-w-shell flex-col gap-3 border-t border-border/70 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {MARCA.nome} · {MARCA.assinatura}
          </span>
          <span>
            Apresentação do sistema — página de demonstração, separada do painel administrativo.
          </span>
        </div>
      </footer>
    </main>
  );
}
